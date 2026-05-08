// Rope Swinging Game
class RopeSwingingGame {
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
      anchor: null,
      obstacles: [],
      status: 'swinging',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = { x: 400, y: 200, vx: 0, vy: 0, length: 150, angle: Math.PI/4 };
    this.gameState.anchor = { x: 400, y: 50 };
    for (let i = 0; i < 8; i++) {
      this.gameState.obstacles.push({
        x: 100 + Math.random() * 600,
        y: 300 + Math.random() * 250,
        radius: 20 + Math.random() * 20
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
    
    const p = this.gameState.player;
    const a = this.gameState.anchor;
    const g = 0.5;
    const damping = 0.99;
    
    p.vy += g;
    p.vx *= damping;
    p.vy *= damping;
    
    p.angle += (p.vx / p.length);
    p.x = a.x + Math.sin(p.angle) * p.length;
    p.y = a.y + Math.cos(p.angle) * p.length;
    
    const input = this.getPlayerInput(this.players[0]);
    if (input.left) p.vx -= 3;
    if (input.right) p.vx += 3;
    if (input.action) p.length = Math.max(50, p.length - 5);
    if (!input.action) p.length = Math.min(200, p.length + 2);
    
    this.gameState.score = Math.floor(p.y);
    
    this.gameState.obstacles.forEach(o => {
      const dx = p.x - o.x;
      const dy = p.y - o.y;
      if (Math.sqrt(dx*dx+dy*dy) < o.radius + 20) {
        this.gameState.gameOver = true;
      }
    });
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#87ceeb';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(0, 500, 800, 100);
    
    const a = this.gameState.anchor;
    const p = this.gameState.player;
    this.ctx.strokeStyle = '#8b4513';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(a.x, a.y);
    this.ctx.lineTo(p.x, p.y);
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#666';
    this.ctx.beginPath();
    this.ctx.arc(a.x, a.y, 10, 0, Math.PI*2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, 20, 0, Math.PI*2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#000';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Score: ' + this.gameState.score, 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('ROPE SWING', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.RopeSwingingGame = RopeSwingingGame;