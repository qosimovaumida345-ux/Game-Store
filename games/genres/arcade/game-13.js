// Brick Breaker Game
class BrickBreakerGame {
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
      level: 1,
      paddle: null,
      ball: null,
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
    this.gameState.paddle = { x: 350, y: 550, width: 100, height: 15, speed: 8 };
    this.gameState.ball = { x: 400, y: 530, vx: 5, vy: -5, radius: 8 };
    this.generateBricks();
  }
  
  generateBricks() {
    this.gameState.bricks = [];
    const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 10; col++) {
        this.gameState.bricks.push({
          x: 75 + col * 70,
          y: 80 + row * 30,
          width: 60,
          height: 20,
          color: colors[row],
          health: 1
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
    const paddle = this.gameState.paddle;
    if (input.left) paddle.x -= paddle.speed;
    if (input.right) paddle.x += paddle.speed;
    paddle.x = Math.max(0, Math.min(this.canvas.width - paddle.width, paddle.x));
    
    const ball = this.gameState.ball;
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    if (ball.x < ball.radius || ball.x > this.canvas.width - ball.radius) ball.vx *= -1;
    if (ball.y < ball.radius) ball.vy *= -1;
    
    if (ball.y + ball.radius > paddle.y && ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
      ball.vy = -Math.abs(ball.vy);
      ball.vx += (ball.x - paddle.x - paddle.width/2) * 0.1;
    }
    
    this.gameState.bricks = this.gameState.bricks.filter(brick => {
      if (ball.x > brick.x && ball.x < brick.x + brick.width && ball.y > brick.y && ball.y < brick.y + brick.height) {
        ball.vy *= -1;
        this.gameState.score += 10;
        return false;
      }
      return true;
    });
    
    if (this.gameState.bricks.length === 0) {
      this.gameState.level++;
      this.generateBricks();
      this.gameState.ball.x = 400;
      this.gameState.ball.y = 530;
    }
    
    if (ball.y > this.canvas.height) this.gameState.gameOver = true;
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.gameState.bricks.forEach(brick => {
      this.ctx.fillStyle = brick.color;
      this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
    });
    
    const paddle = this.gameState.paddle;
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    
    const ball = this.gameState.ball;
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Score: ' + this.gameState.score + ' | Level: ' + this.gameState.level, 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BRICK BREAKER', this.canvas.width / 2, 25);
    
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

window.BrickBreakerGame = BrickBreakerGame;