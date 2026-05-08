// Table Tennis Game
class TableTennisGame {
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
      p1Score: 0,
      p2Score: 0,
      ball: null,
      p1Paddle: null,
      p2Paddle: null,
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
    this.gameState.ball = { x: 400, y: 300, vx: 3, vy: 2, radius: 8 };
    this.gameState.p1Paddle = { x: 50, y: 250, width: 15, height: 80 };
    this.gameState.p2Paddle = { x: 750, y: 250, width: 15, height: 80 };
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
    
    const ball = this.gameState.ball;
    ball.x += ball.vx * 60 * deltaTime;
    ball.y += ball.vy * 60 * deltaTime;
    
    if (ball.y < 0 || ball.y > 600) ball.vy *= -1;
    if (ball.x < 0) { this.gameState.p2Score++; ball.x = 400; ball.y = 300; ball.vx = 3; ball.vy = 2; }
    if (ball.x > 800) { this.gameState.p1Score++; ball.x = 400; ball.y = 300; ball.vx = -3; ball.vy = 2; }
    
    const p1 = this.gameState.p1Paddle;
    const p2 = this.gameState.p2Paddle;
    
    if (ball.x - ball.radius < p1.x + p1.width && ball.y > p1.y && ball.y < p1.y + p1.height) {
      ball.vx = Math.abs(ball.vx);
      ball.vy += (ball.y - p1.y - p1.height/2) * 0.1;
    }
    if (ball.x + ball.radius > p2.x && ball.y > p2.y && ball.y < p2.y + p2.height) {
      ball.vx = -Math.abs(ball.vx);
      ball.vy += (ball.y - p2.y - p2.height/2) * 0.1;
    }
    
    if (this.gameState.p1Score >= 11 || this.gameState.p2Score >= 11) this.gameState.gameOver = true;
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput1(input) {
    const p1 = this.gameState.p1Paddle;
    if (input.up) p1.y = Math.max(0, p1.y - 8);
    if (input.down) p1.y = Math.min(520, p1.y + 8);
  }
  
  handleInput2(input) {
    const p2 = this.gameState.p2Paddle;
    if (input.up) p2.y = Math.max(0, p2.y - 8);
    if (input.down) p2.y = Math.min(520, p2.y + 8);
  }
  
  render() {
    this.ctx.fillStyle = '#27ae60';
    this.ctx.fillRect(0, 0, 800, 600);
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(400, 0);
    this.ctx.lineTo(400, 600);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.arc(400, 300, 50, 0, Math.PI*2);
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillRect(this.gameState.p1Paddle.x, this.gameState.p1Paddle.y, this.gameState.p1Paddle.width, this.gameState.p1Paddle.height);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(this.gameState.p2Paddle.x, this.gameState.p2Paddle.y, this.gameState.p2Paddle.width, this.gameState.p2Paddle.height);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(this.gameState.ball.x, this.gameState.ball.y, this.gameState.ball.radius, 0, Math.PI*2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 60px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.gameState.p1Score + ' - ' + this.gameState.p2Score, 400, 80);
    this.ctx.font = '16px Arial';
    this.ctx.fillText('P1: ↑↓ | P2: WS', 400, 30);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    if (name === 'player1') this.handleInput1(input);
    if (name === 'player2') this.handleInput2(input);
  }
}

window.TableTennisGame = TableTennisGame;