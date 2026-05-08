// American Football Game
class FootballGame {
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
      quarter: 1,
      quarterTime: 0,
      score: [0, 0],
      down: 1,
      yardsToGo: 10,
      ballPosition: 20,
      status: 'playing',
      ball: null,
      players: [
        { x: 200, y: 300, team: 0, hasBall: true },
        { x: 600, y: 300, team: 1, hasBall: false }
      ],
      fieldPosition: 20,
      gameOver: false,
      winner: null
    };
    
    this.config = {
      fieldLength: 100,
      fieldWidth: 800,
      playerSpeed: 4,
      ballSpeed: 15,
      touchdownYard: 100
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.ball = {
      x: 200,
      y: 300,
      vx: 0,
      vy: 0,
      active: false,
      heldBy: 0
    };
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
    this.gameState.quarterTime += deltaTime;
    
    if (this.gameState.quarterTime >= 180) {
      this.nextQuarter();
    }
    
    this.updatePlayers(deltaTime);
    
    if (this.gameState.ball.active) {
      this.updateBall(deltaTime);
    }
  }
  
  updatePlayers(deltaTime) {
    this.gameState.players.forEach((player, i) => {
      const input = this.getPlayerInput(this.players[i]);
      const p = this.gameState.players[i];
      
      if (p.hasBall) {
        if (input.up) p.y -= this.config.playerSpeed;
        if (input.down) p.y += this.config.playerSpeed;
        if (input.left) p.x -= this.config.playerSpeed;
        if (input.right) p.x += this.config.playerSpeed;
        
        if (input.action) {
          this.throwBall();
        }
      }
      
      p.x = Math.max(50, Math.min(this.canvas.width - 50, p.x));
      p.y = Math.max(100, Math.min(450, p.y));
    });
  }
  
  updateBall(deltaTime) {
    const ball = this.gameState.ball;
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    ball.vx *= 0.98;
    ball.vy *= 0.98;
    
    if (Math.abs(ball.vx) < 0.5 && Math.abs(ball.vy) < 0.5) {
      ball.active = false;
      ball.vx = 0;
      ball.vy = 0;
      
      const receiver = this.gameState.players[1];
      const dx = receiver.x - ball.x;
      const dy = receiver.y - ball.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 40) {
        receiver.hasBall = true;
        ball.heldBy = 1;
        this.gameState.players[0].hasBall = false;
      } else {
        this.incomplete();
      }
    }
    
    if (ball.y < 50 || ball.y > 500) {
      this.incomplete();
    }
  }
  
  throwBall() {
    const ball = this.gameState.ball;
    const thrower = this.gameState.players[0];
    const receiver = this.gameState.players[1];
    
    ball.x = thrower.x;
    ball.y = thrower.y;
    
    const dx = receiver.x - thrower.x;
    const dy = receiver.y - thrower.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    ball.vx = (dx / dist) * this.config.ballSpeed;
    ball.vy = (dy / dist) * this.config.ballSpeed;
    ball.active = true;
    
    thrower.hasBall = false;
    ball.heldBy = null;
    
    const gainedYards = Math.floor((receiver.x - thrower.x) / 8);
    this.gameState.fieldPosition += gainedYards;
    
    if (this.gameState.fieldPosition >= this.config.touchdownYard) {
      this.touchdown();
    } else {
      this.gameState.yardsToGo -= gainedYards;
      
      if (this.gameState.yardsToGo <= 0) {
        this.gameState.down = 1;
        this.gameState.yardsToGo = 10;
      } else {
        this.gameState.down++;
      }
      
      if (this.gameState.down > 4) {
        this.turnover();
      }
    }
  }
  
  touchdown() {
    this.gameState.score[0] += 7;
    this.resetAfterScore();
  }
  
  fieldGoal() {
    this.gameState.score[0] += 3;
    this.resetAfterScore();
  }
  
  incomplete() {
    this.gameState.down++;
    
    if (this.gameState.down > 4) {
      this.turnover();
    }
  }
  
  turnover() {
    this.gameState.players[0].hasBall = true;
    this.gameState.players[1].hasBall = false;
    this.gameState.ball.heldBy = 0;
    this.gameState.ball.active = false;
    this.gameState.ball.x = 200;
    this.gameState.ball.y = 300;
    this.gameState.fieldPosition = 20;
    this.gameState.down = 1;
    this.gameState.yardsToGo = 10;
    this.gameState.currentPlayer = 1 - this.gameState.currentPlayer;
  }
  
  resetAfterScore() {
    this.gameState.players[0].x = 200;
    this.gameState.players[0].y = 300;
    this.gameState.players[1].x = 600;
    this.gameState.players[1].y = 300;
    this.gameState.players[0].hasBall = true;
    this.gameState.players[1].hasBall = false;
    this.gameState.ball.x = 200;
    this.gameState.ball.y = 300;
    this.gameState.ball.active = false;
    this.gameState.ball.heldBy = 0;
    this.gameState.fieldPosition = 20;
    this.gameState.down = 1;
    this.gameState.yardsToGo = 10;
  }
  
  nextQuarter() {
    this.gameState.quarter++;
    this.gameState.quarterTime = 0;
    
    if (this.gameState.quarter > 4) {
      if (this.gameState.score[0] > this.gameState.score[1]) {
        this.gameState.winner = this.players[0];
      } else if (this.gameState.score[1] > this.gameState.score[0]) {
        this.gameState.winner = this.players[1];
      } else {
        this.gameState.winner = 'Overtime';
      }
      this.gameState.gameOver = true;
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.drawField();
    this.drawPlayers();
    this.drawBall();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawField() {
    this.ctx.fillStyle = '#2e7d32';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    
    for (let i = 0; i <= 10; i++) {
      const x = 50 + i * 70;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 80);
      this.ctx.lineTo(x, 480);
      this.ctx.stroke();
    }
    
    this.ctx.fillStyle = '#fff';
    for (let i = 1; i < 10; i++) {
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(i * 10, 50 + i * 70, 75);
    }
    
    this.ctx.strokeStyle = '#e74c3c';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(50, 80, 700, 400);
    
    this.ctx.strokeStyle = '#1e88e5';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(50 + (this.gameState.fieldPosition - 10) * 7, 80, 70 * 10, 400);
  }
  
  drawPlayers() {
    this.gameState.players.forEach((player, i) => {
      const color = i === 0 ? '#1976d2' : '#d32f2f';
      
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(player.x, player.y - 20, 18, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.fillRect(player.x - 15, player.y - 5, 30, 25);
      
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.moveTo(player.x, player.y + 20);
      this.ctx.lineTo(player.x - 20, player.y + 45);
      this.ctx.lineTo(player.x + 20, player.y + 45);
      this.ctx.closePath();
      this.ctx.fill();
      
      if (player.hasBall) {
        this.ctx.fillStyle = '#8d6e63';
        this.ctx.beginPath();
        this.ctx.ellipse(player.x + 20, player.y, 8, 12, 0, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }
  
  drawBall() {
    const ball = this.gameState.ball;
    if (!ball.active && ball.heldBy === null) return;
    
    if (ball.heldBy !== null) return;
    
    this.ctx.fillStyle = '#8d6e63';
    this.ctx.beginPath();
    this.ctx.ellipse(ball.x, ball.y, 12, 18, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.ellipse(ball.x, ball.y, 12, 18, 0, 0, Math.PI * 2);
    this.ctx.stroke();
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 180, 100);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${this.players[0]}: ${this.gameState.score[0]}`, 20, 30);
    this.ctx.fillText(`${this.players[1]}: ${this.gameState.score[1]}`, 20, 50);
    this.ctx.fillText(`Down: ${this.gameState.down}`, 20, 70);
    this.ctx.fillText(`To Go: ${this.gameState.yardsToGo}`, 20, 90);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('FOOTBALL', this.canvas.width / 2, 25);
    
    this.ctx.fillStyle = '#4ecdc4';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`Q${this.gameState.quarter} - ${Math.floor(this.gameState.quarterTime / 60)}:${Math.floor(this.gameState.quarterTime % 60).toString().padStart(2, '0')}`, this.canvas.width / 2, 50);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '24px Arial';
    if (this.gameState.winner === 'Overtime') {
      this.ctx.fillText('Overtime!', this.canvas.width / 2, this.canvas.height / 2 + 30);
    } else {
      this.ctx.fillText(`${this.gameState.winner} Wins!`, this.canvas.width / 2, this.canvas.height / 2 + 30);
    }
    this.ctx.fillText(`${this.gameState.score[0]} - ${this.gameState.score[1]}`, this.canvas.width / 2, this.canvas.height / 2 + 70);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.FootballGame = FootballGame;