// Bouncing Ball Game
class BouncingBallGame {
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
      ball: null,
      paddles: [],
      bricks: [],
      status: 'playing',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.ball = { x: 400, y: 300, vx: 3, vy: -3, radius: 10 };
    this.gameState.paddles = [
      { x: 150, y: 550, width: 80, height: 15 },
      { x: 570, y: 550, width: 80, height: 15 }
    ];
    this.gameState.bricks = [];
    const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db'];
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 8; c++) {
        this.gameState.bricks.push({
          x: 100 + c * 75,
          y: 80 + r * 30,
          width: 65,
          height: 20,
          color: colors[r % 5]
        });
      }
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
    if (input.left) this.gameState.paddles[0].x = Math.max(50, this.gameState.paddles[0].x - 6);
    if (input.right) this.gameState.paddles[0].x = Math.min(350, this.gameState.paddles[0].x + 6);
    if (input.up) this.gameState.paddles[1].x = Math.max(450, this.gameState.paddles[1].x - 6);
    if (input.down) this.gameState.paddles[1].x = Math.min(750, this.gameState.paddles[1].x + 6);
    
    const b = this.gameState.ball;
    b.x += b.vx;
    b.y += b.vy;
    
    if (b.x < b.radius || b.x > this.canvas.width - b.radius) b.vx *= -1;
    if (b.y < b.radius) b.vy *= -1;
    if (b.y > this.canvas.height - b.radius) this.gameState.gameOver = true;
    
    this.gameState.paddles.forEach(p => {
      if (b.y + b.radius > p.y && b.y < p.y + p.height && b.x > p.x && b.x < p.x + p.width) {
        b.vy = -Math.abs(b.vy);
        b.vx += (b.x - p.x - p.width/2) * 0.1;
      }
    });
    
    this.gameState.bricks.forEach((brick, i) => {
      if (b.x > brick.x && b.x < brick.x + brick.width && b.y > brick.y && b.y < brick.y + brick.height) {
        b.vy *= -1;
        this.gameState.bricks.splice(i, 1);
        this.gameState.score += 10;
      }
    });
    
    if (this.gameState.bricks.length === 0) this.gameState.gameOver = true;
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(390, 0, 2, 600);
    
    this.gameState.bricks.forEach(b => {
      this.ctx.fillStyle = b.color;
      this.ctx.fillRect(b.x, b.y, b.width, b.height);
    });
    
    this.gameState.paddles.forEach((p, i) => {
      this.ctx.fillStyle = i === 0 ? '#3498db' : '#e74c3c';
      this.ctx.fillRect(p.x, p.y, p.width, p.height);
    });
    
    const b = this.gameState.ball;
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('P1: ← → | P2: ↑ ↓ | Score: ' + this.gameState.score, 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BOUNCING BALL', this.canvas.width / 2, 25);
    
    if (this.gameState.gameOver) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.font = '40px Arial';
      this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.BouncingBallGame = BouncingBallGame;