// Trail Bike Game
class TrailBikeGame {
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
      player: null,
      trail: [],
      obstacles: [],
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
    this.gameState.player = { x: 100, y: 300, vx: 0, vy: 0 };
    for (let i = 0; i < 15; i++) {
      this.gameState.obstacles.push({
        x: 300 + Math.random() * 500,
        y: 100 + Math.random() * 400,
        radius: 15 + Math.random() * 20
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
    this.gameState.score = Math.floor(this.gameState.time * 10);
    
    const input = this.getPlayerInput(this.players[0]);
    const p = this.gameState.player;
    if (input.up) p.vy -= 5 * deltaTime;
    if (input.down) p.vy += 5 * deltaTime;
    if (input.left) p.vx -= 5 * deltaTime;
    if (input.right) p.vx += 5 * deltaTime;
    p.x += p.vx * 60 * deltaTime;
    p.y += p.vy * 60 * deltaTime;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.x = Math.max(20, Math.min(780, p.x));
    p.y = Math.max(20, Math.min(580, p.y));
    
    this.gameState.trail.push({ x: p.x, y: p.y, time: this.gameState.time });
    this.gameState.trail = this.gameState.trail.filter(t => this.gameState.time - t.time < 3);
    
    this.gameState.obstacles.forEach(o => {
      const dx = p.x - o.x;
      const dy = p.y - o.y;
      if (Math.sqrt(dx*dx+dy*dy) < o.radius + 10) this.gameState.gameOver = true;
    });
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.strokeStyle = '#00ff00';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.gameState.trail.forEach((t, i) => {
      if (i === 0) this.ctx.moveTo(t.x, t.y);
      else this.ctx.lineTo(t.x, t.y);
    });
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#e74c3c';
    this.gameState.obstacles.forEach(o => {
      this.ctx.beginPath();
      this.ctx.arc(o.x, o.y, o.radius, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    const p = this.gameState.player;
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, 10, 0, Math.PI*2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Score: ' + this.gameState.score, 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.fillText('TRAIL BIKE', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.TrailBikeGame = TrailBikeGame;