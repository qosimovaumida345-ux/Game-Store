// Hot Air Balloon Game
class HotAirBalloonGame {
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
      balloon: null,
      obstacles: [],
      clouds: [],
      status: 'flying',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.balloon = { x: 400, y: 300, vy: 0 };
    for (let i = 0; i < 10; i++) {
      this.gameState.clouds.push({ x: Math.random() * 800, y: Math.random() * 600, size: 30 + Math.random() * 30 });
      this.gameState.obstacles.push({ x: Math.random() * 800, y: Math.random() * 600, radius: 20 + Math.random() * 20 });
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
    this.gameState.fuel -= deltaTime * 2;
    this.gameState.score = Math.floor(this.gameState.balloon.y);
    
    const input = this.getPlayerInput(this.players[0]);
    const b = this.gameState.balloon;
    if (input.up && this.gameState.fuel > 0) { b.vy = -4; this.gameState.fuel -= deltaTime * 10; }
    else { b.vy += 2 * deltaTime; }
    b.y += b.vy;
    b.y = Math.max(50, Math.min(550, b.y));
    
    if (this.gameState.fuel <= 0) this.gameState.gameOver = true;
    
    this.gameState.obstacles.forEach(o => {
      const dx = b.x - o.x;
      const dy = b.y - o.y;
      if (Math.sqrt(dx*dx+dy*dy) < o.radius + 25) this.gameState.gameOver = true;
    });
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, '#87ceeb');
    grad.addColorStop(1, '#b0e0e6');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
    this.gameState.clouds.forEach(c => {
      this.ctx.beginPath();
      this.ctx.arc(c.x, c.y, c.size, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    this.ctx.fillStyle = '#8b4513';
    this.gameState.obstacles.forEach(o => {
      this.ctx.beginPath();
      this.ctx.arc(o.x, o.y, o.radius, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    const b = this.gameState.balloon;
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.beginPath();
    this.ctx.ellipse(b.x, b.y, 30, 40, 0, 0, Math.PI*2);
    this.ctx.fill();
    this.ctx.fillStyle = '#f5deb3';
    this.ctx.beginPath();
    this.ctx.moveTo(b.x - 15, b.y + 35);
    this.ctx.lineTo(b.x, b.y + 55);
    this.ctx.lineTo(b.x + 15, b.y + 35);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#000';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Altitude: ' + this.gameState.score + 'm | Fuel: ' + Math.floor(this.gameState.fuel) + '%', 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.fillText('HOT AIR BALLOON', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.HotAirBalloonGame = HotAirBalloonGame;