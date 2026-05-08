// Volleyball Beach Game
class VolleyballBeachGame {
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
      rallyCount: 0,
      serving: 0,
      status: 'serving',
      ball: null,
      net: null,
      players: [
        { x: 200, y: 450, vx: 0, vy: 0, jumping: false, hitting: false },
        { x: 600, y: 450, vx: 0, vy: 0, jumping: false, hitting: false }
      ],
      gameOver: false,
      winner: null
    };
    
    this.config = {
      courtWidth: 800,
      courtHeight: 500,
      netHeight: 250,
      netX: 400,
      gravity: 0.4,
      playerSpeed: 5,
      jumpForce: 12,
      ballBounce: 0.7,
      maxScore: 25
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.ball = {
      x: 100,
      y: 200,
      vx: 0,
      vy: 0,
      active: false,
      rotation: 0
    };
    
    this.gameState.net = {
      x: this.config.netX,
      y: this.config.netHeight,
      width: 10,
      height: 150
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
    
    this.updatePlayers(deltaTime);
    
    if (this.gameState.ball.active) {
      this.updateBall(deltaTime);
    }
  }
  
  updatePlayers(deltaTime) {
    this.players.forEach((player, i) => {
      const input = this.getPlayerInput(player);
      const p = this.gameState.players[i];
      
      const minX = i === 0 ? 50 : this.config.netX + 50;
      const maxX = i === 0 ? this.config.netX - 50 : this.canvas.width - 50;
      
      if (input.left) p.x -= this.config.playerSpeed;
      if (input.right) p.x += this.config.playerSpeed;
      if (input.up && !p.jumping) {
        p.vy = -this.config.jumpForce;
        p.jumping = true;
      }
      
      p.x = Math.max(minX, Math.min(maxX, p.x));
      
      p.vy += this.config.gravity;
      p.y += p.vy;
      
      if (p.y >= 450) {
        p.y = 450;
        p.vy = 0;
        p.jumping = false;
      }
      
      if (input.action) {
        p.hitting = true;
        setTimeout(() => { p.hitting = false; }, 200);
      }
    });
  }
  
  updateBall(deltaTime) {
    const ball = this.gameState.ball;
    const net = this.gameState.net;
    
    ball.vy += this.config.gravity;
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.rotation += ball.vx * 0.1;
    
    if (ball.x < 10 || ball.x > this.canvas.width - 10) {
      ball.vx *= -0.8;
      ball.x = Math.max(10, Math.min(this.canvas.width - 10, ball.x));
    }
    
    if (ball.y < 0) {
      ball.vy = Math.abs(ball.vy);
    }
    
    if (ball.x > net.x - 20 && ball.x < net.x + 20 && ball.y > net.y && ball.y < net.y + net.height) {
      ball.vx *= -0.8;
      ball.x = ball.x < net.x ? net.x - 20 : net.x + 20;
    }
    
    if (ball.y > 480) {
      this.scorePoint();
    }
    
    this.checkPlayerHits();
  }
  
  checkPlayerHits() {
    const ball = this.gameState.ball;
    
    this.gameState.players.forEach((p, i) => {
      const dx = ball.x - p.x;
      const dy = ball.y - (p.y - 20);
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 40 && ball.active) {
        this.hitBall(i);
      }
    });
  }
  
  hitBall(playerIndex) {
    const ball = this.gameState.ball;
    const p = this.gameState.players[playerIndex];
    const targetIndex = 1 - playerIndex;
    const target = this.gameState.players[targetIndex];
    
    const targetX = target.x + (Math.random() - 0.5) * 150;
    const targetY = 200 + Math.random() * 150;
    
    const dx = targetX - ball.x;
    const dy = targetY - ball.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const power = p.hitting ? 15 : 10;
    ball.vx = (dx / dist) * power;
    ball.vy = (dy / dist) * power - 3;
    
    this.gameState.rallyCount++;
  }
  
  serve() {
    const server = this.gameState.serving;
    const p = this.gameState.players[server];
    const ball = this.gameState.ball;
    
    ball.x = p.x;
    ball.y = p.y - 50;
    ball.vx = (this.config.netX - ball.x) / 30 + (Math.random() - 0.5) * 2;
    ball.vy = -10;
    ball.active = true;
    
    this.gameState.status = 'playing';
  }
  
  scorePoint() {
    const ball = this.gameState.ball;
    
    if (ball.x < this.config.netX) {
      this.gameState.score[1]++;
    } else {
      this.gameState.score[0]++;
    }
    
    if (this.gameState.score[0] >= this.config.maxScore || this.gameState.score[1] >= this.config.maxScore) {
      this.gameState.gameOver = true;
      this.gameState.winner = this.gameState.score[0] >= this.config.maxScore ? this.players[0] : this.players[1];
      return;
    }
    
    this.gameState.serving = 1 - this.gameState.serving;
    this.gameState.rallyCount = 0;
    
    ball.active = false;
    ball.x = this.gameState.players[this.gameState.serving].x;
    ball.y = 200;
    ball.vx = 0;
    ball.vy = 0;
    
    this.gameState.status = 'serving';
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    const idx = this.players.indexOf(playerName);
    if (idx === -1) return;
    
    if (this.gameState.status === 'serving' && idx === this.gameState.serving && input.action) {
      this.serve();
    }
  }
  
  render() {
    this.drawBeach();
    this.drawNet();
    this.drawPlayers();
    this.drawBall();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBeach() {
    const gradient = this.ctx.createLinearGradient(0, 100, 0, 600);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.3, '#98D8C8');
    gradient.addColorStop(1, '#DEB887');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#F4A460';
    this.ctx.fillRect(0, 450, this.canvas.width, 100);
  }
  
  drawNet() {
    const net = this.gameState.net;
    
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(net.x - 2, net.y, 4, net.height);
    
    this.ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    this.ctx.lineWidth = 1;
    for (let y = net.y; y < net.y + net.height; y += 10) {
      this.ctx.beginPath();
      this.ctx.moveTo(net.x - 50, y);
      this.ctx.lineTo(net.x + 50, y);
      this.ctx.stroke();
    }
  }
  
  drawPlayers() {
    this.gameState.players.forEach((p, i) => {
      const color = i === 0 ? '#e74c3c' : '#3498db';
      
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y - 30, 15, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillRect(p.x - 12, p.y - 15, 24, 30);
      
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.moveTo(p.x, p.y + 15);
      this.ctx.lineTo(p.x - 15, p.y + 40);
      this.ctx.lineTo(p.x + 15, p.y + 40);
      this.ctx.closePath();
      this.ctx.fill();
    });
  }
  
  drawBall() {
    const ball = this.gameState.ball;
    if (!ball.active) return;
    
    const gradient = this.ctx.createRadialGradient(
      ball.x - 3, ball.y - 3, 0, ball.x, ball.y, 15
    );
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(1, '#ff6b6b');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, 15, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#c00';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, 15, 0, Math.PI * 2);
    this.ctx.stroke();
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 150, 60);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${this.players[0]}: ${this.gameState.score[0]}`, 20, 30);
    this.ctx.fillText(`${this.players[1]}: ${this.gameState.score[1]}`, 20, 55);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('VOLLEYBALL', this.canvas.width / 2, 30);
    
    if (this.gameState.status === 'serving') {
      const server = this.players[this.gameState.serving];
      this.ctx.fillStyle = '#4ecdc4';
      this.ctx.font = '14px Arial';
      this.ctx.fillText(`Serve: ${server}`, this.canvas.width / 2, 55);
    }
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
    this.ctx.fillText(`${this.gameState.winner} Wins!`, this.canvas.width / 2, this.canvas.height / 2 + 20);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.VolleyballBeachGame = VolleyballBeachGame;