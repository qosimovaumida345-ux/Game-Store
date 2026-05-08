// Bird Feeding Game
class BirdFeedingGame {
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
      birds: [],
      seeds: [],
      feeder: null,
      status: 'playing',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.feeder = { x: 400, y: 550 };
    for (let i = 0; i < 5; i++) {
      this.gameState.birds.push({
        x: Math.random() * 700,
        y: 50 + Math.random() * 200,
        targetX: Math.random() * 700,
        targetY: 50 + Math.random() * 200,
        speed: 1 + Math.random(),
        hunger: 100
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
    
    const input = this.getPlayerInput(this.players[0]);
    const f = this.gameState.feeder;
    if (input.left) f.x = Math.max(50, f.x - 8);
    if (input.right) f.x = Math.min(750, f.x + 8);
    if (input.action && Math.random() < 0.3) {
      this.gameState.seeds.push({ x: f.x, y: f.y - 20, vy: -2 });
    }
    
    this.gameState.seeds.forEach(s => s.y += s.vy);
    this.gameState.seeds = this.gameState.seeds.filter(s => s.y > 0);
    
    this.gameState.birds.forEach(b => {
      const dx = b.targetX - b.x;
      const dy = b.targetY - b.y;
      const dist = Math.sqrt(dx*dx+dy*dy);
      b.x += (dx/dist) * b.speed;
      b.y += (dy/dist) * b.speed;
      if (dist < 10) {
        b.targetX = 50 + Math.random() * 700;
        b.targetY = 50 + Math.random() * 200;
      }
      b.hunger -= deltaTime;
      
      this.gameState.seeds.forEach((s, i) => {
        if (Math.abs(b.x - s.x) < 20 && Math.abs(b.y - s.y) < 20) {
          b.hunger = Math.min(100, b.hunger + 30);
          this.gameState.score += 10;
          this.gameState.seeds.splice(i, 1);
        }
      });
      
      if (b.hunger <= 0) this.gameState.gameOver = true;
    });
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, '#87ceeb');
    grad.addColorStop(1, '#228b22');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const f = this.gameState.feeder;
    this.ctx.fillStyle = '#8b4513';
    this.ctx.fillRect(f.x - 25, f.y, 50, 30);
    this.ctx.fillStyle = '#f4a460';
    this.ctx.beginPath();
    this.ctx.arc(f.x, f.y, 15, 0, Math.PI*2);
    this.ctx.fill();
    
    this.gameState.seeds.forEach(s => {
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, 5, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    this.gameState.birds.forEach(b => {
      const hungerColor = b.hunger > 50 ? '#2ecc71' : (b.hunger > 20 ? '#f1c40f' : '#e74c3c');
      this.ctx.fillStyle = hungerColor;
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, 12, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.fillStyle = '#000';
      this.ctx.beginPath();
      this.ctx.arc(b.x + 4, b.y - 2, 2, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Score: ' + this.gameState.score, 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.fillText('BIRD FEEDER', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.BirdFeedingGame = BirdFeedingGame;