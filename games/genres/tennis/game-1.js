// Tennis Championship Game
class TennisChampGame {
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
      scores: [0, 0],
      points: [0, 0],
      games: [0, 0],
      sets: [0, 0],
      server: 0,
      status: 'playing',
      ball: null,
      players: [
        { x: 200, y: 400, vx: 0, vy: 0, serving: true },
        { x: 600, y: 400, vx: 0, vy: 0, serving: false }
      ],
      winner: null,
      lastWinner: null,
      rallyCount: 0,
      matchOver: false
    };
    
    this.config = {
      courtWidth: 800,
      courtHeight: 500,
      playerSpeed: 5,
      ballSpeed: 12,
      netHeight: 120,
      serviceLine: 150
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.resetBall();
    this.gameState.players[0].x = 200;
    this.gameState.players[0].y = 400;
    this.gameState.players[1].x = 600;
    this.gameState.players[1].y = 400;
  }
  
  resetBall(server) {
    const s = server !== undefined ? server : this.gameState.server;
    this.gameState.ball = {
      x: s === 0 ? 150 : this.canvas.width - 150,
      y: 350,
      vx: 0,
      vy: 0,
      vz: 0,
      active: false,
      server: s,
      inPlay: false,
      bounceCount: 0
    };
  }
  
  serve() {
    const server = this.gameState.server;
    const player = this.gameState.players[server];
    const targetPlayer = this.gameState.players[1 - server];
    
    const dx = targetPlayer.x - player.x;
    const dy = targetPlayer.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const targetX = targetPlayer.x + (Math.random() - 0.5) * 100;
    const targetY = targetPlayer.y;
    
    this.gameState.ball.x = player.x;
    this.gameState.ball.y = player.y - 30;
    this.gameState.ball.vx = (targetX - player.x) / 30;
    this.gameState.ball.vy = (targetY - player.y) / 30 - 8;
    this.gameState.ball.vz = 8;
    this.gameState.ball.active = true;
    this.gameState.ball.inPlay = true;
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
    if (this.gameState.matchOver) return;
    
    this.gameState.time += deltaTime;
    
    this.updatePlayers(deltaTime);
    
    if (this.gameState.ball.active) {
      this.updateBall(deltaTime);
    }
  }
  
  updatePlayers(deltaTime) {
    this.players.forEach((playerName, i) => {
      const input = this.getPlayerInput(playerName);
      const player = this.gameState.players[i];
      
      const speed = this.config.playerSpeed;
      
      if (input.left) player.x -= speed;
      if (input.right) player.x += speed;
      if (input.up) player.y -= speed;
      if (input.down) player.y += speed;
      
      player.x = Math.max(50, Math.min(this.canvas.width - 50, player.x));
      player.y = Math.max(200, Math.min(this.canvas.height - 50, player.y));
      
      if (input.action && !this.gameState.ball.active && !this.gameState.ball.inPlay) {
        this.serve();
      }
    });
  }
  
  updateBall(deltaTime) {
    const ball = this.gameState.ball;
    
    ball.vy += this.config.ballSpeed * 0.5 * deltaTime;
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    const netY = this.config.netHeight;
    const netX = this.canvas.width / 2;
    
    if (Math.abs(ball.x - netX) < 20 && ball.y > netY && ball.y < netY + 30) {
      ball.vx *= -0.5;
      ball.x = ball.x < netX ? netX - 20 : netX + 20;
    }
    
    if (ball.y >= this.canvas.height - 30) {
      this.handleBounce();
    }
    
    this.checkPlayerCollision();
  }
  
  handleBounce() {
    const ball = this.gameState.ball;
    ball.bounceCount++;
    
    ball.vy = -ball.vy * 0.7;
    ball.y = this.canvas.height - 30;
    
    if (ball.bounceCount >= 2) {
      const scorer = ball.server === 0 ? 1 : 0;
      this.scorePoint(scorer);
    }
  }
  
  checkPlayerCollision() {
    const ball = this.gameState.ball;
    
    this.gameState.players.forEach((player, i) => {
      const dx = ball.x - player.x;
      const dy = ball.y - (player.y - 20);
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 40) {
        this.hitBall(i);
      }
    });
  }
  
  hitBall(playerIndex) {
    const ball = this.gameState.ball;
    const targetIndex = 1 - playerIndex;
    const target = this.gameState.players[targetIndex];
    
    const targetX = target.x + (Math.random() - 0.5) * 150;
    const targetY = target.y;
    
    const dx = targetX - ball.x;
    const dy = targetY - ball.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const speed = 15 + this.gameState.rallyCount * 0.5;
    ball.vx = (dx / dist) * speed;
    ball.vy = (dy / dist) * speed - 5;
    ball.vz = 5;
    
    this.gameState.rallyCount++;
  }
  
  scorePoint(scorer) {
    this.gameState.points[scorer]++;
    this.gameState.lastWinner = scorer;
    
    const pointNames = [0, 15, 30, 40];
    const p1 = this.gameState.points[0];
    const p2 = this.gameState.points[1];
    
    if ((p1 >= 4 && p1 - p2 >= 2) || (p2 >= 4 && p2 - p1 >= 2)) {
      this.gameState.games[scorer]++;
      this.gameState.points = [0, 0];
      this.gameState.server = 1 - this.gameState.server;
      this.gameState.rallyCount = 0;
      
      if (this.gameState.games[scorer] >= 6) {
        this.gameState.sets[scorer]++;
        this.gameState.games = [0, 0];
        
        if (this.gameState.sets[scorer] >= 2) {
          this.gameState.matchOver = true;
          this.gameState.winner = this.players[scorer];
        }
      }
    }
    
    this.gameState.ball.active = false;
    this.gameState.ball.inPlay = false;
    setTimeout(() => this.resetBall(this.gameState.server), 1000);
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.drawCourt();
    this.drawNet();
    this.drawPlayers();
    if (this.gameState.ball.active) this.drawBall();
    this.drawUI();
    if (this.gameState.matchOver) this.drawGameOver();
  }
  
  drawCourt() {
    this.ctx.fillStyle = '#c9a959';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 3;
    
    this.ctx.strokeRect(50, 100, this.canvas.width - 100, this.canvas.height - 130);
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 100);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height - 30);
    this.ctx.stroke();
    
    this.ctx.strokeRect(200, 100, 400, 300);
    
    this.ctx.beginPath();
    this.ctx.moveTo(50, 350);
    this.ctx.lineTo(200, 350);
    this.ctx.moveTo(this.canvas.width - 50, 350);
    this.ctx.lineTo(this.canvas.width - 200, 350);
    this.ctx.stroke();
  }
  
  drawNet() {
    const netY = this.config.netHeight;
    
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 4;
    
    this.ctx.beginPath();
    this.ctx.moveTo(50, netY);
    this.ctx.lineTo(this.canvas.width - 50, netY);
    this.ctx.stroke();
    
    this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    this.ctx.lineWidth = 1;
    for (let x = 60; x < this.canvas.width; x += 20) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, netY);
      this.ctx.lineTo(x, netY + 30);
      this.ctx.stroke();
    }
  }
  
  drawPlayers() {
    this.gameState.players.forEach((player, i) => {
      const color = i === 0 ? '#3498db' : '#e74c3c';
      
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(player.x, player.y - 30, 15, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.fillRect(player.x - 10, player.y - 15, 20, 25);
      
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.moveTo(player.x, player.y + 10);
      this.ctx.lineTo(player.x - 15, player.y + 40);
      this.ctx.lineTo(player.x + 15, player.y + 40);
      this.ctx.closePath();
      this.ctx.fill();
      
      this.ctx.fillStyle = '#ffd93d';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.players[i], player.x, player.y + 55);
    });
  }
  
  drawBall() {
    const ball = this.gameState.ball;
    
    const gradient = this.ctx.createRadialGradient(
      ball.x - 3, ball.y - 3, 0,
      ball.x, ball.y, 10
    );
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(1, '#ccc');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, 10, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, 10, 0, Math.PI * 2);
    this.ctx.stroke();
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 180, 100);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${this.players[0]}: ${this.gameState.sets[0]}-${this.gameState.games[0]}`, 20, 30);
    this.ctx.fillText(`${this.players[1]}: ${this.gameState.sets[1]}-${this.gameState.games[1]}`, 20, 50);
    
    const p1 = this.gameState.points[0];
    const p2 = this.gameState.points[1];
    const scores = [0, 15, 30, 40, 'Ad'];
    this.ctx.fillText(`Points: ${scores[p1] || 40}-${scores[p2] || 40}`, 20, 70);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('TENNIS', this.canvas.width / 2, 30);
    
    const server = this.players[this.gameState.server];
    this.ctx.fillStyle = '#4ecdc4';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`Server: ${server}`, this.canvas.width - 70, 30);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('MATCH OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`${this.gameState.winner} Wins!`, this.canvas.width / 2, this.canvas.height / 2 + 30);
    this.ctx.fillText(`${this.gameState.sets[0]}-${this.gameState.sets[1]}`, this.canvas.width / 2, this.canvas.height / 2 + 70);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.TennisChampGame = TennisChampGame;