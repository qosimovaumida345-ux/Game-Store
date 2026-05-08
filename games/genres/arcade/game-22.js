// Maze Runner Game
class MazeRunnerGame {
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
      exit: null,
      walls: [],
      coins: [],
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
    this.gameState.player = { x: 50, y: 50, size: 15 };
    this.gameState.exit = { x: 750, y: 550 };
    
    const wallPositions = [];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 12; y++) {
        if ((x % 3 === 0 && y % 2 === 0) || (x % 4 === 2 && y % 3 === 1)) {
          if (Math.random() < 0.7) {
            wallPositions.push({ x: x * 50 + 25, y: y * 50 + 25, w: 40, h: 40 });
          }
        }
      }
    }
    this.gameState.walls = wallPositions;
    
    for (let i = 0; i < 10; i++) {
      this.gameState.coins.push({
        x: 50 + Math.random() * 700,
        y: 50 + Math.random() * 500
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
    let newX = p.x;
    let newY = p.y;
    if (input.up) newY -= 3;
    if (input.down) newY += 3;
    if (input.left) newX -= 3;
    if (input.right) newX += 3;
    
    let canMove = true;
    this.gameState.walls.forEach(w => {
      if (newX + p.size/2 > w.x - w.w/2 && newX - p.size/2 < w.x + w.w/2 &&
          newY + p.size/2 > w.y - w.h/2 && newY - p.size/2 < w.y + w.h/2) {
        canMove = false;
      }
    });
    if (canMove) { p.x = newX; p.y = newY; }
    
    this.gameState.coins = this.gameState.coins.filter(c => {
      const dx = p.x - c.x;
      const dy = p.y - c.y;
      if (Math.sqrt(dx*dx+dy*dy) < 20) { this.gameState.score += 50; return false; }
      return true;
    });
    
    const ex = this.gameState.exit;
    const d = Math.sqrt((p.x - ex.x)**2 + (p.y - ex.y)**2);
    if (d < 30) { this.gameState.score += 500; this.gameState.gameOver = true; }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#27ae60';
    this.ctx.fillRect(this.gameState.exit.x - 20, this.gameState.exit.y - 20, 40, 40);
    
    this.ctx.fillStyle = '#34495e';
    this.gameState.walls.forEach(w => {
      this.ctx.fillRect(w.x - w.w/2, w.y - w.h/2, w.w, w.h);
    });
    
    this.ctx.fillStyle = '#f1c40f';
    this.gameState.coins.forEach(c => {
      this.ctx.beginPath();
      this.ctx.arc(c.x, c.y, 8, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    const p = this.gameState.player;
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, p.size/2, 0, Math.PI*2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Score: ' + this.gameState.score + ' | Coins: ' + (10 - this.gameState.coins.length), 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.fillText('MAZE RUNNER', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.MazeRunnerGame = MazeRunnerGame;