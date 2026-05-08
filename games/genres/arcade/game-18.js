// Wall Breaking Game
class WallBreakingGame {
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
      health: 100,
      player: null,
      walls: [],
      powerups: [],
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
    this.gameState.player = { x: 100, y: 300, vy: 0, grounded: true };
    for (let i = 0; i < 10; i++) {
      this.gameState.walls.push({ x: 300 + i * 50, y: 150, width: 40, height: 400, health: 3 });
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
    const p = this.gameState.player;
    if (input.up && p.grounded) { p.vy = -15; p.grounded = false; }
    p.vy += 30 * deltaTime;
    p.y += p.vy;
    if (p.y > 500) { p.y = 500; p.vy = 0; p.grounded = true; }
    
    this.gameState.walls = this.gameState.walls.filter(w => {
      if (p.x + 20 > w.x && p.x < w.x + w.width && p.y + 30 > w.y && p.y < w.y + w.height) {
        w.health--;
        this.gameState.score += 5;
        p.vy = -10;
        if (w.health <= 0) this.gameState.score += 20;
        return w.health > 0;
      }
      return true;
    });
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#87ceeb';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#228b22';
    this.ctx.fillRect(0, 500, 800, 100);
    
    this.gameState.walls.forEach(w => {
      this.ctx.fillStyle = w.health === 3 ? '#8b4513' : (w.health === 2 ? '#a0522d' : '#cd853f');
      this.ctx.fillRect(w.x, w.y, w.width, w.height);
    });
    
    const p = this.gameState.player;
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(p.x - 15, p.y, 30, 30);
    this.ctx.fillStyle = '#f5d0c5';
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y - 5, 12, 0, Math.PI*2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Score: ' + this.gameState.score + ' | Walls: ' + this.gameState.walls.length, 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.fillText('WALL BREAKER', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.WallBreakingGame = WallBreakingGame;