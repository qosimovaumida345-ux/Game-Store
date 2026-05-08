// Penguin Slide Game
class PenguinSlideGame {
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
      obstacles: [],
      fish: [],
      status: 'sliding',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = { x: 100, y: 100, vx: 5, vy: 0, rotation: 0 };
    for (let i = 0; i < 8; i++) {
      this.gameState.obstacles.push({
        x: 200 + Math.random() * 500,
        y: 200 + Math.random() * 350,
        size: 20 + Math.random() * 20
      });
      this.gameState.fish.push({
        x: 250 + Math.random() * 450,
        y: 180 + Math.random() * 370
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
    this.gameState.score = Math.floor(this.gameState.player.x / 10);
    
    const p = this.gameState.player;
    p.vy += 0.1;
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.vx * 0.02;
    
    if (p.y > 600) this.gameState.gameOver = true;
    
    this.gameState.obstacles.forEach(o => {
      const dx = p.x - o.x;
      const dy = p.y - o.y;
      if (Math.sqrt(dx*dx+dy*dy) < o.size + 15) {
        p.vx = -p.vx * 0.5;
        p.x += p.vx * 2;
      }
    });
    
    this.gameState.fish = this.gameState.fish.filter(f => {
      const dx = p.x - f.x;
      const dy = p.y - f.y;
      if (Math.sqrt(dx*dx+dy*dy) < 20) { this.gameState.score += 50; return false; }
      return true;
    });
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, '#87ceeb');
    grad.addColorStop(0.5, '#e0f7fa');
    grad.addColorStop(1, '#add8e6');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#87ceeb';
    this.ctx.beginPath();
    this.ctx.ellipse(400, 600, 400, 100, 0, 0, Math.PI*2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#8b4513';
    this.gameState.obstacles.forEach(o => {
      this.ctx.beginPath();
      this.ctx.arc(o.x, o.y, o.size, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    this.ctx.fillStyle = '#f1c40f';
    this.gameState.fish.forEach(f => {
      this.ctx.beginPath();
      this.ctx.ellipse(f.x, f.y, 10, 6, 0, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    const p = this.gameState.player;
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.rotation);
    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 20, 12, 0, 0, Math.PI*2);
    this.ctx.fill();
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(8, -5, 5, 0, Math.PI*2);
    this.ctx.fill();
    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(8, -5, 2, 0, Math.PI*2);
    this.ctx.fill();
    this.ctx.restore();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Score: ' + this.gameState.score, 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.fillText('PENGUIN SLIDE', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.PenguinSlideGame = PenguinSlideGame;