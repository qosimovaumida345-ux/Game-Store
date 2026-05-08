// Monster Truck Rally Game
class MonsterTruckRallyGame {
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
      player: null,
      obstacles: [],
      bumps: [],
      particles: [],
      status: 'racing',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = { 
      x: 100, y: 450, 
      vx: 0, vy: 0, 
      rotation: 0, 
      onGround: true,
      suspension: 0
    };
    
    for (let i = 0; i < 5; i++) {
      this.gameState.bumps.push({ x: 200 + i * 150, height: 10 + Math.random() * 20, width: 30 + Math.random() * 30 });
    }
    
    for (let i = 0; i < 3; i++) {
      this.gameState.obstacles.push({ x: 300 + i * 200, y: 400 + Math.random() * 50, type: ['car', 'truck', 'rock'][i] });
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
    this.gameState.distance += 100 * deltaTime;
    
    const input = this.getPlayerInput(this.players[0]);
    const p = this.gameState.player;
    
    if (input.up) p.vy -= 15;
    if (input.down) p.vy += 8;
    
    p.vy += 25 * deltaTime;
    p.y += p.vy * deltaTime;
    p.x += p.vx * deltaTime;
    
    p.x = Math.max(50, Math.min(750, p.x));
    
    p.onGround = false;
    this.gameState.bumps.forEach(b => {
      if (p.x > b.x - b.width/2 && p.x < b.x + b.width/2 && p.y > 460 - b.height) {
        p.y = 460 - b.height - p.suspension;
        p.onGround = true;
        p.vy = 0;
        
        if (Math.abs(p.vy) > 2) {
          p.suspension = 10;
        }
      }
    });
    
    if (p.y > 480) {
      p.y = 480;
      p.onGround = true;
      p.vy = 0;
    }
    
    if (p.onGround) {
      p.suspension = Math.max(0, p.suspension - 30 * deltaTime);
    }
    
    p.rotation = p.vy * 0.05;
    
    this.gameState.obstacles.forEach(o => {
      o.x -= 150 * deltaTime;
      if (o.x < -100) o.x = 900;
      
      if (Math.abs(p.x - o.x) < 40 && Math.abs(p.y - o.y) < 40) {
        this.gameState.score += 50;
        this.gameState.gameOver = true;
      }
    });
    
    if (Math.random() < 0.3) {
      this.gameState.particles.push({
        x: p.x - 30,
        y: p.y + 20,
        vx: -50 - Math.random() * 50,
        vy: -Math.random() * 30,
        life: 0.5,
        color: '#8b4513'
      });
    }
    
    this.gameState.particles.forEach(p => {
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.vy += 100 * deltaTime;
      p.life -= deltaTime;
    });
    this.gameState.particles = this.gameState.particles.filter(p => p.life > 0);
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    const grad = this.ctx.createLinearGradient(0, 0, 0, 600);
    grad.addColorStop(0, '#87ceeb');
    grad.addColorStop(0.5, '#98d8c8');
    grad.addColorStop(1, '#8b4513');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, 800, 600);
    
    this.ctx.fillStyle = '#7cba6e';
    this.ctx.fillRect(0, 350, 800, 100);
    
    this.ctx.fillStyle = '#8b4513';
    this.ctx.fillRect(0, 480, 800, 120);
    
    this.gameState.bumps.forEach(b => {
      this.ctx.fillStyle = '#654321';
      this.ctx.beginPath();
      this.ctx.moveTo(b.x - b.width/2, 480);
      this.ctx.quadraticCurveTo(b.x, 480 - b.height * 2, b.x + b.width/2, 480);
      this.ctx.fill();
    });
    
    this.gameState.obstacles.forEach(o => {
      if (o.type === 'car') {
        this.ctx.fillStyle = '#3498db';
        this.ctx.fillRect(o.x - 25, o.y - 15, 50, 20);
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.beginPath();
        this.ctx.arc(o.x - 15, o.y + 5, 8, 0, Math.PI*2);
        this.ctx.arc(o.x + 15, o.y + 5, 8, 0, Math.PI*2);
        this.ctx.fill();
      } else if (o.type === 'truck') {
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(o.x - 35, o.y - 20, 70, 25);
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.beginPath();
        this.ctx.arc(o.x - 25, o.y + 5, 10, 0, Math.PI*2);
        this.ctx.arc(o.x + 25, o.y + 5, 10, 0, Math.PI*2);
        this.ctx.fill();
      } else {
        this.ctx.fillStyle = '#7f8c8d';
        this.ctx.beginPath();
        this.ctx.arc(o.x, o.y, 25, 0, Math.PI*2);
        this.ctx.fill();
      }
    });
    
    this.gameState.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life * 2;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
    
    const truck = this.gameState.player;
    this.ctx.save();
    this.ctx.translate(truck.x, truck.y);
    this.ctx.rotate(truck.rotation);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(-30, -25 - truck.suspension, 60, 25);
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillRect(-20, -40 - truck.suspension, 40, 18);
    
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.beginPath();
    this.ctx.arc(-20, 0, 12, 0, Math.PI*2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(20, 0, 12, 0, Math.PI*2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#95a5a6';
    this.ctx.fillRect(-10, -55 - truck.suspension, 8, 15);
    this.ctx.fillRect(5, -55 - truck.suspension, 8, 15);
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.beginPath();
    this.ctx.arc(-10, -55 - truck.suspension, 4, 0, Math.PI*2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(5, -55 - truck.suspension, 4, 0, Math.PI*2);
    this.ctx.fill();
    
    this.ctx.restore();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Distance: ' + Math.floor(this.gameState.distance) + 'm | Score: ' + this.gameState.score, 20, 30);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillText('MONSTER TRUCK RALLY', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.MonsterTruckRallyGame = MonsterTruckRallyGame;