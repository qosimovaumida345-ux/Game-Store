// Skydiving Game
class SkydivingGame {
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
      rings: [],
      obstacles: [],
      altitude: 1000,
      status: 'jumping',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = { x: 400, y: 100, vx: 0, vy: 5 };
    for (let i = 0; i < 8; i++) {
      this.gameState.rings.push({
        x: 100 + Math.random() * 600,
        y: 200 + i * 100,
        radius: 30,
        collected: false
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
    this.gameState.altitude -= this.gameState.player.vy * 10 * deltaTime;
    
    const input = this.getPlayerInput(this.players[0]);
    const p = this.gameState.player;
    if (input.left) p.vx -= 2;
    if (input.right) p.vx += 2;
    if (input.up) p.vy = Math.max(2, p.vy - 1);
    if (input.down) p.vy = Math.min(15, p.vy + 0.5);
    p.x += p.vx;
    p.y += p.vy;
    p.x = Math.max(50, Math.min(750, p.x));
    
    this.gameState.rings.forEach(r => {
      if (!r.collected) {
        const dx = p.x - r.x;
        const dy = p.y - r.y;
        if (Math.sqrt(dx*dx+dy*dy) < r.radius + 15) {
          r.collected = true;
          this.gameState.score += 100;
        }
      }
    });
    
    if (this.gameState.altitude <= 0) this.gameState.gameOver = true;
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, '#1e90ff');
    grad.addColorStop(1, '#87ceeb');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#228b22';
    this.ctx.fillRect(0, 550, 800, 50);
    
    this.gameState.rings.forEach(r => {
      if (r.collected) return;
      this.ctx.strokeStyle = '#ffd93d';
      this.ctx.lineWidth = 5;
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI*2);
      this.ctx.stroke();
    });
    
    const p = this.gameState.player;
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(-8, -15, 16, 30);
    this.ctx.fillStyle = '#f5d0c5';
    this.ctx.beginPath();
    this.ctx.arc(0, -18, 10, 0, Math.PI*2);
    this.ctx.fill();
    this.ctx.restore();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Score: ' + this.gameState.score + ' | Altitude: ' + Math.floor(this.gameState.altitude) + 'm', 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.fillText('SKYDIVING', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.SkydivingGame = SkydivingGame;