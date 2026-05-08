// Space Debris Collector Game
class SpaceDebrisCollectorGame {
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
      fuel: 100,
      player: null,
      debris: [],
      asteroids: [],
      status: 'collecting',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = { x: 400, y: 300, vx: 0, vy: 0, angle: 0 };
    
    for (let i = 0; i < 15; i++) {
      this.gameState.debris.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        type: ['satellite', 'tool', 'panel'][Math.floor(Math.random() * 3)],
        collected: false
      });
    }
    
    for (let i = 0; i < 8; i++) {
      this.gameState.asteroids.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: 20 + Math.random() * 30
      });
    }
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
    this.gameState.fuel -= deltaTime * 0.5;
    
    const input = this.getPlayerInput(this.players[0]);
    const p = this.gameState.player;
    
    if (input.up) { p.vy -= 3; p.angle = -Math.PI/2; }
    if (input.down) { p.vy += 3; p.angle = Math.PI/2; }
    if (input.left) { p.vx -= 3; p.angle = Math.PI; }
    if (input.right) { p.vx += 3; p.angle = 0; }
    
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.x += p.vx * deltaTime * 60;
    p.y += p.vy * deltaTime * 60;
    
    p.x = Math.max(20, Math.min(780, p.x));
    p.y = Math.max(20, Math.min(580, p.y));
    
    this.gameState.asteroids.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < -50) a.x = 850;
      if (a.x > 850) a.x = -50;
      if (a.y < -50) a.y = 650;
      if (a.y > 650) a.y = -50;
      
      const dx = p.x - a.x;
      const dy = p.y - a.y;
      if (Math.sqrt(dx*dx+dy*dy) < a.size + 15) {
        this.gameState.gameOver = true;
      }
    });
    
    this.gameState.debris.forEach((d, di) => {
      if (d.collected) return;
      const dx = p.x - d.x;
      const dy = p.y - d.y;
      if (Math.sqrt(dx*dx+dy*dy) < 30) {
        d.collected = true;
        this.gameState.score += 100;
        this.gameState.fuel = Math.min(100, this.gameState.fuel + 10);
        this.gameState.debris.splice(di, 1);
        
        if (this.gameState.debris.length === 0) {
          this.gameState.gameOver = true;
        }
      }
    });
    
    if (this.gameState.fuel <= 0) this.gameState.gameOver = true;
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#0a0a1a';
    this.ctx.fillRect(0, 0, 800, 600);
    
    this.ctx.fillStyle = '#fff';
    for (let i = 0; i < 100; i++) {
      this.ctx.beginPath();
      this.ctx.arc((i * 137) % 800, (i * 97) % 600, Math.random() * 2, 0, Math.PI*2);
      this.ctx.fill();
    }
    
    this.gameState.asteroids.forEach(a => {
      this.ctx.fillStyle = '#5d6d7e';
      this.ctx.beginPath();
      this.ctx.arc(a.x, a.y, a.size, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.fillStyle = '#7f8c8d';
      this.ctx.beginPath();
      this.ctx.arc(a.x - a.size*0.3, a.y - a.size*0.3, a.size*0.4, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    this.gameState.debris.forEach(d => {
      if (d.type === 'satellite') {
        this.ctx.fillStyle = '#bdc3c7';
        this.ctx.fillRect(d.x - 10, d.y - 5, 20, 10);
        this.ctx.fillStyle = '#3498db';
        this.ctx.fillRect(d.x - 12, d.y - 2, 4, 4);
        this.ctx.fillRect(d.x + 8, d.y - 2, 4, 4);
      } else if (d.type === 'tool') {
        this.ctx.fillStyle = '#e67e22';
        this.ctx.fillRect(d.x - 8, d.y, 16, 4);
        this.ctx.fillRect(d.x + 4, d.y - 4, 4, 12);
      } else {
        this.ctx.fillStyle = '#3498db';
        this.ctx.fillRect(d.x - 10, d.y - 8, 20, 3);
        this.ctx.fillRect(d.x - 10, d.y, 20, 3);
        this.ctx.fillRect(d.x - 10, d.y + 5, 20, 3);
      }
    });
    
    const p = this.gameState.player;
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.angle + Math.PI/2);
    
    this.ctx.fillStyle = '#ecf0f1';
    this.ctx.beginPath();
    this.ctx.moveTo(0, -15);
    this.ctx.lineTo(10, 10);
    this.ctx.lineTo(0, 5);
    this.ctx.lineTo(-10, 10);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 5, 0, Math.PI*2);
    this.ctx.fill();
    this.ctx.restore();
    
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(20, 550, 200, 20);
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.fillRect(20, 550, 200 * (this.gameState.fuel/100), 20);
    this.ctx.strokeStyle = '#fff';
    this.ctx.strokeRect(20, 550, 200, 20);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Score: ' + this.gameState.score + ' | Debris: ' + this.gameState.debris.length, 20, 30);
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillText('SPACE DEBRIS COLLECTOR', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.SpaceDebrisCollectorGame = SpaceDebrisCollectorGame;