// Asteroid Mining Game
class AsteroidMiningGame {
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
      health: 100,
      player: null,
      asteroids: [],
      ore: [],
      status: 'playing',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = { x: 400, y: 300, vx: 0, vy: 0, angle: 0, mining: false };
    for (let i = 0; i < 15; i++) {
      this.spawnAsteroid();
    }
  }
  
  spawnAsteroid() {
    this.gameState.asteroids.push({
      x: Math.random() * 800,
      y: Math.random() * 600,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: 20 + Math.random() * 30,
      health: 10 + Math.floor(Math.random() * 20)
    });
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
    if (this.gameState.fuel <= 0 || this.gameState.health <= 0) this.gameState.gameOver = true;
    
    const input = this.getPlayerInput(this.players[0]);
    const p = this.gameState.player;
    const thrust = input.action ? 8 : 4;
    if (input.up) { p.vy -= thrust * deltaTime; p.mining = true; }
    if (input.down) p.vy += thrust * deltaTime;
    if (input.left) { p.vx -= thrust * deltaTime; p.angle = Math.atan2(p.vy, p.vx); }
    if (input.right) { p.vx += thrust * deltaTime; p.angle = Math.atan2(p.vy, p.vx); }
    
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.x = Math.max(20, Math.min(780, p.x));
    p.y = Math.max(20, Math.min(580, p.y));
    
    this.gameState.asteroids.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < 0 || a.x > 800) a.vx *= -1;
      if (a.y < 0 || a.y > 600) a.vy *= -1;
      
      const dx = p.x - a.x;
      const dy = p.y - a.y;
      if (Math.sqrt(dx*dx+dy*dy) < a.size + 15) {
        p.vx = -p.vx * 0.5;
        p.vy = -p.vy * 0.5;
        if (!input.action) this.gameState.health -= 5;
      }
    });
    
    if (input.action) {
      this.gameState.asteroids.forEach((a, i) => {
        const dx = p.x - a.x;
        const dy = p.y - a.y;
        if (Math.sqrt(dx*dx+dy*dy) < a.size + 50) {
          a.health -= 1;
          if (a.health <= 0) {
            this.gameState.score += Math.floor(a.size);
            this.gameState.ore.push({ x: a.x, y: a.y });
            this.gameState.asteroids.splice(i, 1);
            this.spawnAsteroid();
          }
        }
      });
      this.gameState.ore = this.gameState.ore.filter(o => {
        const dx = p.x - o.x;
        const dy = p.y - o.y;
        if (Math.sqrt(dx*dx+dy*dy) < 20) { this.gameState.score += 50; return false; }
        return true;
      });
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#0a0a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) {
      this.ctx.fillRect((i*73)%800, (i*47)%600, 2, 2);
    }
    
    this.ctx.fillStyle = '#888';
    this.gameState.asteroids.forEach(a => {
      this.ctx.beginPath();
      this.ctx.arc(a.x, a.y, a.size, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    this.ctx.fillStyle = '#f1c40f';
    this.gameState.ore.forEach(o => {
      this.ctx.beginPath();
      this.ctx.arc(o.x, o.y, 8, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    const p = this.gameState.player;
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.angle);
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillRect(-15, -10, 30, 20);
    this.ctx.fillStyle = '#e74c3c';
    if (p.mining) {
      this.ctx.beginPath();
      this.ctx.arc(20, 0, 10, 0, Math.PI*2);
      this.ctx.fill();
    }
    this.ctx.restore();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '14px Arial';
    this.ctx.fillText('Score: ' + this.gameState.score + ' | Fuel: ' + Math.floor(this.gameState.fuel) + '% | Health: ' + Math.floor(this.gameState.health) + '%', 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.fillText('ASTEROID MINER', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.AsteroidMiningGame = AsteroidMiningGame;