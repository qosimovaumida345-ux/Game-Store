// Flower Garden Game
class FlowerGardenGame {
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
      flowers: [],
      bees: [],
      garden: [],
      status: 'growing',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    for (let i = 0; i < 6; i++) {
      this.gameState.flowers.push({
        x: 100 + i * 120,
        y: 400,
        color: ['#e74c3c', '#f1c40f', '#9b59b6', '#3498db', '#e67e22'][i],
        grown: false,
        grownTime: 0
      });
    }
    for (let i = 0; i < 5; i++) {
      this.gameState.bees.push({
        x: Math.random() * 800,
        y: Math.random() * 200,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 2
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
    
    this.gameState.flowers.forEach(f => {
      if (!f.grown && this.gameState.time > f.grownTime + 3) {
        f.grown = true;
        this.gameState.score += 50;
      }
    });
    
    this.gameState.bees.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;
      if (b.x < 0 || b.x > 800) b.vx *= -1;
      if (b.y < 0 || b.y > 250) b.vy *= -1;
    });
    
    if (this.gameState.flowers.every(f => f.grown)) this.gameState.gameOver = true;
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#90ee90';
    this.ctx.fillRect(0, 0, 800, 600);
    
    this.ctx.fillStyle = '#228b22';
    this.ctx.fillRect(0, 450, 800, 150);
    
    this.gameState.flowers.forEach(f => {
      this.ctx.fillStyle = '#8b4513';
      this.ctx.fillRect(f.x - 5, f.y, 10, 40);
      if (f.grown) {
        this.ctx.fillStyle = f.color;
        this.ctx.beginPath();
        this.ctx.arc(f.x, f.y - 10, 20, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.beginPath();
        this.ctx.arc(f.x, f.y - 10, 8, 0, Math.PI*2);
        this.ctx.fill();
      }
    });
    
    this.gameState.bees.forEach(b => {
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.beginPath();
      this.ctx.ellipse(b.x, b.y, 8, 5, 0, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.fillStyle = '#000';
      this.ctx.beginPath();
      this.ctx.arc(b.x + 3, b.y, 2, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Flowers: ' + this.gameState.flowers.filter(f => f.grown).length + '/6 | Score: ' + this.gameState.score, 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.fillText('FLOWER GARDEN', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.FlowerGardenGame = FlowerGardenGame;