// Classic Pong Game
class PongClassicGame {
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
      score: [0, 0],
      maxScore: 10,
      status: 'playing',
      ball: null,
      paddles: [],
      winner: null,
      gameOver: false
    };
    
    this.config = {
      paddleWidth: 15,
      paddleHeight: 80,
      ballSize: 10,
      paddleSpeed: 6,
      ballSpeed: 7,
      winScore: 10
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.ball = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      vx: this.config.ballSpeed * (Math.random() > 0.5 ? 1 : -1),
      vy: this.config.ballSpeed * (Math.random() - 0.5) * 0.5
    };
    
    this.gameState.paddles = [
      { x: 30, y: this.canvas.height / 2 - 40, vx: 0, vy: 0 },
      { x: this.canvas.width - 45, y: this.canvas.height / 2 - 40, vx: 0, vy: 0 }
    ];
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
    this.gameState.time += deltaTime;
    
    this.updatePaddles();
    this.updateBall();
  }
  
  updatePaddles() {
    this.players.forEach((player, i) => {
      const input = this.getPlayerInput(player);
      const paddle = this.gameState.paddles[i];
      
      if (input.up) paddle.y -= this.config.paddleSpeed;
      if (input.down) paddle.y += this.config.paddleSpeed;
      
      paddle.y = Math.max(10, Math.min(this.canvas.height - this.config.paddleHeight - 10, paddle.y));
    });
  }
  
  updateBall() {
    const ball = this.gameState.ball;
    const { paddleWidth, paddleHeight, ballSize } = this.config;
    
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    if (ball.y < ballSize || ball.y > this.canvas.height - ballSize) {
      ball.vy *= -1;
    }
    
    this.gameState.paddles.forEach((paddle, i) => {
      const isLeftPaddle = i === 0;
      const paddleX = isLeftPaddle ? paddle.x + paddleWidth : paddle.x;
      
      if (ball.y > paddle.y && ball.y < paddle.y + paddleHeight) {
        if (isLeftPaddle && ball.x - ballSize < paddleX && ball.x > paddle.x) {
          ball.vx = Math.abs(ball.vx) * 1.05;
          ball.vy += (ball.y - (paddle.y + paddleHeight / 2)) * 0.1;
          ball.x = paddleX + ballSize;
        } else if (!isLeftPaddle && ball.x + ballSize > paddle.x && ball.x < paddle.x + paddleWidth) {
          ball.vx = -Math.abs(ball.vx) * 1.05;
          ball.vy += (ball.y - (paddle.y + paddleHeight / 2)) * 0.1;
          ball.x = paddle.x - ballSize;
        }
      }
    });
    
    ball.vx = Math.max(-12, Math.min(12, ball.vx));
    
    if (ball.x < 0) {
      this.gameState.score[1]++;
      this.resetBall(1);
    } else if (ball.x > this.canvas.width) {
      this.gameState.score[0]++;
      this.resetBall(0);
    }
    
    this.checkWin();
  }
  
  resetBall(winner) {
    this.gameState.ball.x = this.canvas.width / 2;
    this.gameState.ball.y = this.canvas.height / 2;
    this.gameState.ball.vx = this.config.ballSpeed * (winner === 0 ? -1 : 1);
    this.gameState.ball.vy = this.config.ballSpeed * (Math.random() - 0.5) * 0.5;
  }
  
  checkWin() {
    if (this.gameState.score[0] >= this.config.winScore) {
      this.gameState.winner = this.players[0];
      this.gameState.gameOver = true;
    } else if (this.gameState.score[1] >= this.config.winScore) {
      this.gameState.winner = this.players[1];
      this.gameState.gameOver = true;
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawCenterLine();
    this.drawPaddles();
    this.drawBall();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawCenterLine() {
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([15, 15]);
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.stroke();
    
    this.ctx.setLineDash([]);
  }
  
  drawPaddles() {
    const colors = ['#fff', '#fff'];
    
    this.gameState.paddles.forEach((paddle, i) => {
      this.ctx.fillStyle = colors[i];
      this.ctx.fillRect(paddle.x, paddle.y, this.config.paddleWidth, this.config.paddleHeight);
    });
  }
  
  drawBall() {
    const ball = this.gameState.ball;
    
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, this.config.ballSize, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  drawUI() {
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.gameState.score[0], this.canvas.width / 4, 60);
    this.ctx.fillText(this.gameState.score[1], this.canvas.width * 3 / 4, 60);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText('PONG', this.canvas.width / 2, 30);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`${this.gameState.winner} Wins!`, this.canvas.width / 2, this.canvas.height / 2 + 30);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.PongClassicGame = PongClassicGame;