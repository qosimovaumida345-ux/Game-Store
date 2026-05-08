// Ninja Run Game
class NinjaRunGame {
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
      coins: [],
      particles: [],
      status: 'running',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = { x: 150, y: 450, vy: 0, grounded: true, rolling: false };
    this.gameState.obstacles = [];
    this.gameState.coins = [];
    this.gameState.groundY = 500;
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
    this.gameState.distance += 300 * deltaTime;
    this.gameState.score = Math.floor(this.gameState.distance / 10);
    
    const input = this.getPlayerInput(this.players[0]);
    const p = this.gameState.player;
    
    if (input.up && p.grounded) { p.vy = -12; p.grounded = false; }
    if (input.down && p.grounded) { p.rolling = true; p.y = p.groundY + 15; }
    if (!input.down) { p.rolling = false; p.y = p.groundY; }
    
    p.vy += 25 * deltaTime;
    p.y += p.vy;
    
    if (p.y > this.gameState.groundY) { p.y = this.gameState.groundY; p.vy = 0; p.grounded = true; }
    
    if (Math.random() < 0.03) {
      this.gameState.obstacles.push({ x: 850, y: this.gameState.groundY, width: 30, height: 40 });
    }
    if (Math.random() < 0.02) {
      this.gameState.coins.push({ x: 850, y: this.gameState.groundY - 50 - Math.random() * 100 });
    }
    
    this.gameState.obstacles.forEach(o => o.x -= 6);
    this.gameState.coins.forEach(c => c.x -= 6);
    this.gameState.obstacles = this.gameState.obstacles.filter(o => o.x > -50);
    this.gameState.coins = this.gameState.coins.filter(c => c.x > -50);
    
    const pWidth = p.rolling ? 40 : 25;
    const pHeight = p.rolling ? 20 : 40;
    
    this.gameState.obstacles.forEach(o => {
      if (p.x + pWidth > o.x && p.x < o.x + o.width && p.y + pHeight > o.y - o.height && p.y < o.y) {
        this.gameState.gameOver = true;
      }
    });
    
    this.gameState.coins = this.gameState.coins.filter(c => {
      if (Math.abs(p.x - c.x) < 25 && Math.abs(p.y - c.y) < 25) {
        this.gameState.score += 50;
        return false;
      }
      return true;
    });
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(1, '#16213e');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(0, 500, 800, 100);
    this.ctx.fillStyle = '#666';
    for (let i = 0; i < 20; i++) {
      const x = (i * 50 - (this.gameState.distance * 0.2) % 1000);
      this.ctx.fillRect(x, 500, 30, 5);
    }
    
    this.ctx.fillStyle = '#f1c40f';
    this.gameState.coins.forEach(c => {
      this.ctx.beginPath();
      this.ctx.arc(c.x, c.y, 12, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    this.ctx.fillStyle = '#8b4513';
    this.gameState.obstacles.forEach(o => {
      this.ctx.fillRect(o.x, o.y - o.height, o.width, o.height);
    });
    
    const p = this.gameState.player;
    this.ctx.fillStyle = '#2c3e50';
    if (p.rolling) {
      this.ctx.fillRect(p.x, p.y, 40, 20);
    } else {
      this.ctx.fillRect(p.x, p.y, 25, 40);
      this.ctx.fillStyle = '#f5d0c5';
      this.ctx.beginPath();
      this.ctx.arc(p.x + 12, p.y + 5, 10, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(p.x + 8, p.y + 3, 3, 3);
      this.ctx.fillRect(p.x + 14, p.y + 3, 3, 3);
    }
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Distance: ' + Math.floor(this.gameState.distance) + 'm | Score: ' + this.gameState.score, 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.fillText('NINJA RUN', this.canvas.width / 2, 25);
    
    if (this.gameState.gameOver) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.font = '40px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.NinjaRunGame = NinjaRunGame;