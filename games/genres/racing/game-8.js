// Boat Racing Game
class BoatRacingGame {
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
      lap: 1,
      checkpoint: 0,
      player: null,
      opponent: null,
      obstacles: [],
      status: 'racing',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = { x: 100, y: 300, speed: 0, angle: 0 };
    this.gameState.opponent = { x: 100, y: 350, speed: 3 };
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
    const p = this.gameState.player;
    const o = this.gameState.opponent;
    
    if (input.up) p.speed = Math.min(8, p.speed + 3 * deltaTime);
    if (input.down) p.speed = Math.max(0, p.speed - 5 * deltaTime);
    if (input.left) p.angle -= 3 * deltaTime;
    if (input.right) p.angle += 3 * deltaTime;
    
    p.x += Math.cos(p.angle) * p.speed * 60 * deltaTime;
    p.y += Math.sin(p.angle) * p.speed * 60 * deltaTime;
    p.x = Math.max(20, Math.min(780, p.x));
    p.y = Math.max(20, Math.min(580, p.y));
    
    o.x += o.speed;
    if (o.x > 800) { o.x = -50; o.y = 200 + Math.random() * 300; }
    
    if (p.x > 700) this.gameState.gameOver = true;
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, '#2980b9');
    grad.addColorStop(1, '#3498db');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#27ae60';
    this.ctx.fillRect(680, 100, 100, 400);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 30px Arial';
    this.ctx.fillText('FINISH', 700, 300);
    
    this.ctx.fillStyle = '#e74c3c';
    const o = this.gameState.opponent;
    this.ctx.fillRect(o.x - 20, o.y - 10, 40, 20);
    
    const p = this.gameState.player;
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.angle);
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(-20, -10, 40, 20);
    this.ctx.fillStyle = '#3498db';
    this.ctx.beginPath();
    this.ctx.moveTo(20, 0);
    this.ctx.lineTo(35, -8);
    this.ctx.lineTo(35, 8);
    this.ctx.fill();
    this.ctx.restore();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Speed: ' + Math.floor(p.speed * 20), 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.fillText('BOAT RACING', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.BoatRacingGame = BoatRacingGame;