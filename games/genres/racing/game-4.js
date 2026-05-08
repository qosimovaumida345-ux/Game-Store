// Dirt Bike Racing Game
class DirtBikeGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.players = players;
    this.gameId = gameId;
    this.isRunning = false;
    this.lastTime = 0;
    
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    this.gameState = {
      time: 0,
      score: 0,
      distance: 0,
      lap: 1,
      checkpoint: 0,
      status: 'racing',
      bike: null,
      terrain: [],
      obstacles: [],
      particles: [],
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.bike = {
      x: 150,
      y: 300,
      vx: 0,
      vy: 0,
      angle: 0,
      angularVelocity: 0,
      onGround: false,
      speed: 0,
      wheelAngle: 0,
      suspension: [0, 0]
    };
    
    this.generateTerrain();
    this.generateObstacles();
  }
  
  generateTerrain() {
    const terrain = [];
    let y = 400;
    
    for (let x = 0; x < 10000; x += 30) {
      y += Math.sin(x * 0.01) * 2 + (Math.random() - 0.5) * 3;
      terrain.push({ x, y });
    }
    
    this.gameState.terrain = terrain;
  }
  
  generateObstacles() {
    for (let i = 0; i < 50; i++) {
      const x = 500 + Math.random() * 9000;
      const terrainY = this.getTerrainY(x);
      
      this.gameState.obstacles.push({
        x,
        y: terrainY,
        type: ['rock', 'ramp', 'log'][Math.floor(Math.random() * 3)],
        size: 20 + Math.random() * 30
      });
    }
  }
  
  getTerrainY(x) {
    const terrain = this.gameState.terrain;
    const idx = Math.floor(x / 30);
    
    if (idx >= 0 && idx < terrain.length - 1) {
      const t = (x % 30) / 30;
      return terrain[idx].y * (1 - t) + terrain[idx + 1].y * t;
    }
    return 400;
  }
  
  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }
  
  stop() { this.isRunning = false; }
  
  gameLoop(currentTime) {
    if (!this.isRunning) return;
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    this.update(deltaTime);
    this.render();
    requestAnimationFrame((time) => this.gameLoop(time));
  }
  
  update(deltaTime) {
    if (this.gameState.gameOver) return;
    
    this.gameState.time += deltaTime;
    this.gameState.distance += this.gameState.bike.vx * deltaTime;
    
    const input = this.getPlayerInput(this.players[0]);
    this.updateBike(deltaTime, input);
    this.updateObstacles();
    this.updateCamera();
    this.updateParticles(deltaTime);
    
    this.gameState.score = Math.floor(this.gameState.distance / 10);
  }
  
  updateBike(deltaTime, input) {
    const bike = this.gameState.bike;
    const terrainY = this.getTerrainY(bike.x);
    const gravity = 25;
    
    if (input.up) bike.speed = Math.min(15, bike.speed + 10 * deltaTime);
    if (input.down) bike.speed = Math.max(0, bike.speed - 15 * deltaTime);
    
    bike.vx = Math.cos(bike.angle) * bike.speed;
    bike.vy += gravity * deltaTime;
    
    bike.x += bike.vx * deltaTime * 60;
    bike.y += bike.vy * deltaTime * 60;
    
    if (bike.y > terrainY - 30) {
      bike.y = terrainY - 30;
      bike.vy = 0;
      bike.onGround = true;
      
      const slope = this.getTerrainSlope(bike.x);
      const targetAngle = Math.atan(slope);
      bike.angle += (targetAngle - bike.angle) * 5 * deltaTime;
      
      bike.suspension[0] = Math.max(-5, Math.min(5, (terrainY - bike.y) * 0.5));
      bike.suspension[1] = bike.suspension[0];
    } else {
      bike.onGround = false;
      
      if (input.left) bike.angularVelocity -= 5 * deltaTime;
      if (input.right) bike.angularVelocity += 5 * deltaTime;
      
      bike.angle += bike.angularVelocity * deltaTime;
      bike.angularVelocity *= 0.98;
    }
    
    bike.wheelAngle += bike.speed * deltaTime * 2;
    
    if (bike.angle > Math.PI / 2 || bike.angle < -Math.PI / 2) {
      this.gameState.gameOver = true;
    }
  }
  
  getTerrainSlope(x) {
    const y1 = this.getTerrainY(x - 5);
    const y2 = this.getTerrainY(x + 5);
    return (y2 - y1) / 10;
  }
  
  updateObstacles() {
    const bike = this.gameState.bike;
    
    this.gameState.obstacles.forEach(obs => {
      const dx = bike.x - obs.x;
      const dy = bike.y - (obs.y - obs.size / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < obs.size + 20 && bike.onGround) {
        if (obs.type === 'ramp') {
          bike.vy = -15;
          bike.onGround = false;
          this.createParticles(bike.x, bike.y, '#f1c40f', 10);
        } else if (obs.type === 'rock') {
          bike.speed *= 0.5;
          bike.vx += (Math.random() - 0.5) * 10;
          this.createParticles(obs.x, obs.y, '#95a5a6', 8);
        }
      }
    });
  }
  
  updateCamera() {
    const bike = this.gameState.bike;
    this.cameraX = bike.x - this.canvas.width * 0.3;
  }
  
  createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      this.gameState.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        color,
        size: 3 + Math.random() * 4
      });
    }
  }
  
  updateParticles(deltaTime) {
    this.gameState.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 5 * deltaTime;
      p.life -= deltaTime * 2;
    });
    this.gameState.particles = this.gameState.particles.filter(p => p.life > 0);
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.drawBackground();
    this.drawTerrain();
    this.drawObstacles();
    this.drawBike();
    this.drawParticles();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(0.5, '#e0f7fa');
    gradient.addColorStop(1, '#2ecc71');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#27ae60';
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.canvas.height);
    for (let x = 0; x <= this.canvas.width; x += 50) {
      const worldX = x + this.cameraX;
      this.ctx.lineTo(x, this.getTerrainY(worldX) - 200);
    }
    this.ctx.lineTo(this.canvas.width, this.canvas.height);
    this.ctx.fill();
  }
  
  drawTerrain() {
    this.ctx.strokeStyle = '#8b4513';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    
    for (let screenX = 0; screenX < this.canvas.width; screenX++) {
      const worldX = screenX + this.cameraX;
      const terrainY = this.getTerrainY(worldX);
      
      if (screenX === 0) {
        this.ctx.moveTo(screenX, terrainY);
      } else {
        this.ctx.lineTo(screenX, terrainY);
      }
    }
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#8b4513';
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.canvas.height);
    
    for (let screenX = 0; screenX <= this.canvas.width; screenX++) {
      const worldX = screenX + this.cameraX;
      const terrainY = this.getTerrainY(worldX);
      this.ctx.lineTo(screenX, terrainY);
    }
    
    this.ctx.lineTo(this.canvas.width, this.canvas.height);
    this.ctx.fill();
  }
  
  drawObstacles() {
    this.gameState.obstacles.forEach(obs => {
      const screenX = obs.x - this.cameraX;
      
      if (screenX < -50 || screenX > this.canvas.width + 50) return;
      
      if (obs.type === 'rock') {
        this.ctx.fillStyle = '#7f8c8d';
        this.ctx.beginPath();
        this.ctx.arc(screenX, obs.y - obs.size/2, obs.size/2, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (obs.type === 'ramp') {
        this.ctx.fillStyle = '#e67e22';
        this.ctx.beginPath();
        this.ctx.moveTo(screenX - 30, obs.y);
        this.ctx.lineTo(screenX + 30, obs.y);
        this.ctx.lineTo(screenX, obs.y - 40);
        this.ctx.closePath();
        this.ctx.fill();
      } else if (obs.type === 'log') {
        this.ctx.fillStyle = '#5d4037';
        this.ctx.fillRect(screenX - 40, obs.y - 15, 80, 30);
      }
    });
  }
  
  drawBike() {
    const bike = this.gameState.bike;
    const screenX = bike.x - this.cameraX;
    const screenY = bike.y;
    
    this.ctx.save();
    this.ctx.translate(screenX, screenY);
    this.ctx.rotate(bike.angle);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(-20, -15, 40, 20);
    
    this.ctx.fillStyle = '#f39c12';
    this.ctx.beginPath();
    this.ctx.arc(-18, 12, 10, 0, Math.PI * 2);
    this.ctx.arc(18, 12, 10, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(-18, 0);
    this.ctx.lineTo(-30, -20);
    this.ctx.moveTo(18, 0);
    this.ctx.lineTo(30, -20);
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#3498db';
    this.ctx.beginPath();
    this.ctx.arc(0, -5, 8, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.fillRect(-8, -22, 5, 3);
    this.ctx.fillRect(3, -22, 5, 3);
    
    this.ctx.restore();
  }
  
  drawParticles() {
    this.gameState.particles.forEach(p => {
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x - this.cameraX, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 130, 70);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Distance: ${Math.floor(this.gameState.distance)}m`, 20, 30);
    this.ctx.fillText(`Speed: ${Math.floor(this.gameState.bike.speed * 10)} km/h`, 20, 50);
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 70);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('DIRT BIKE RACING', this.canvas.width / 2, 30);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('CRASHED!', this.canvas.width / 2, this.canvas.height / 2 - 20);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Distance: ${Math.floor(this.gameState.distance)}m`, this.canvas.width / 2, this.canvas.height / 2 + 40);
    this.ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 80);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.DirtBikeGame = DirtBikeGame;