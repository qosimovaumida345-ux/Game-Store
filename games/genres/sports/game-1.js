// Soccer Stars - Sports Game
class SoccerGame {
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
      score: { home: 0, away: 0 },
      half: 1,
      status: 'playing',
      ball: null,
      teams: { home: [], away: [] },
      field: { width: 0, height: 0, centerX: 0, centerY: 0 }
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.field.width = this.canvas.width;
    this.gameState.field.height = this.canvas.height;
    this.gameState.field.centerX = this.canvas.width / 2;
    this.gameState.field.centerY = this.canvas.height / 2;
    
    this.gameState.ball = {
      x: this.gameState.field.centerX,
      y: this.gameState.field.centerY,
      vx: 0,
      vy: 0,
      radius: 12,
      friction: 0.98,
      maxSpeed: 15
    };
    
    const team1Players = this.players.slice(0, Math.ceil(this.players.length / 2));
    const team2Players = this.players.slice(Math.ceil(this.players.length / 2));
    
    const leftPositions = [
      { x: 150, y: this.canvas.height * 0.3 },
      { x: 150, y: this.canvas.height * 0.7 },
      { x: 250, y: this.canvas.height * 0.2 },
      { x: 250, y: this.canvas.height * 0.5 },
      { x: 250, y: this.canvas.height * 0.8 },
      { x: 350, y: this.canvas.height * 0.5 }
    ];
    
    const rightPositions = [
      { x: this.canvas.width - 150, y: this.canvas.height * 0.3 },
      { x: this.canvas.width - 150, y: this.canvas.height * 0.7 },
      { x: this.canvas.width - 250, y: this.canvas.height * 0.2 },
      { x: this.canvas.width - 250, y: this.canvas.height * 0.5 },
      { x: this.canvas.width - 250, y: this.canvas.height * 0.8 },
      { x: this.canvas.width - 350, y: this.canvas.height * 0.5 }
    ];
    
    this.gameState.teams.home = team1Players.map((p, i) => ({
      name: p,
      x: leftPositions[i % leftPositions.length].x,
      y: leftPositions[i % leftPositions.length].y,
      vx: 0,
      vy: 0,
      speed: 4,
      radius: 20,
      color: '#ff0000',
      team: 'home',
      index: i
    }));
    
    this.gameState.teams.away = team2Players.map((p, i) => ({
      name: p,
      x: rightPositions[i % rightPositions.length].x,
      y: rightPositions[i % rightPositions.length].y,
      vx: 0,
      vy: 0,
      speed: 4,
      radius: 20,
      color: '#0000ff',
      team: 'away',
      index: i
    }));
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
    
    if (this.gameState.time >= 45 && this.gameState.half === 1) {
      this.gameState.half = 2;
      this.gameState.time = 0;
      this.resetPositions();
    }
    
    if (this.gameState.half === 2 && this.gameState.time >= 45) {
      this.gameState.status = 'finished';
    }
    
    [...this.gameState.teams.home, ...this.gameState.teams.away].forEach(player => {
      const input = this.getPlayerInput(player.name);
      
      player.vx = 0;
      player.vy = 0;
      
      if (player.team === 'home' || this.players.length === 1) {
        if (input.left) player.vx = -player.speed;
        if (input.right) player.vx = player.speed;
        if (input.up) player.vy = -player.speed;
        if (input.down) player.vy = player.speed;
      }
      
      if (input.kick || input.action) {
        this.kickBall(player);
      }
      
      player.x += player.vx;
      player.y += player.vy;
      
      player.x = Math.max(player.radius, Math.min(this.canvas.width - player.radius, player.x));
      player.y = Math.max(player.radius, Math.min(this.canvas.height - player.radius, player.y));
    });
    
    this.updateBall();
    this.checkGoal();
  }
  
  getPlayerInput(name) {
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  kickBall(player) {
    const dx = this.gameState.ball.x - player.x;
    const dy = this.gameState.ball.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < player.radius + this.gameState.ball.radius + 20) {
      const angle = Math.atan2(dy, dx);
      const force = 12;
      this.gameState.ball.vx = Math.cos(angle) * force;
      this.gameState.ball.vy = Math.sin(angle) * force;
    }
  }
  
  updateBall() {
    const ball = this.gameState.ball;
    
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    ball.vx *= ball.friction;
    ball.vy *= ball.friction;
    
    if (ball.x < ball.radius || ball.x > this.canvas.width - ball.radius) {
      ball.vx *= -0.8;
      ball.x = Math.max(ball.radius, Math.min(this.canvas.width - ball.radius, ball.x));
    }
    
    if (ball.y < ball.radius || ball.y > this.canvas.height - ball.radius) {
      ball.vy *= -0.8;
      ball.y = Math.max(ball.radius, Math.min(this.canvas.height - ball.radius, ball.y));
    }
    
    [...this.gameState.teams.home, ...this.gameState.teams.away].forEach(player => {
      const dx = ball.x - player.x;
      const dy = ball.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < player.radius + ball.radius) {
        const angle = Math.atan2(dy, dx);
        ball.x = player.x + Math.cos(angle) * (player.radius + ball.radius);
        ball.y = player.y + Math.sin(angle) * (player.radius + ball.radius);
        
        ball.vx = Math.cos(angle) * 8;
        ball.vy = Math.sin(angle) * 8;
      }
    });
  }
  
  checkGoal() {
    const ball = this.gameState.ball;
    const goalWidth = 120;
    const goalTop = this.canvas.height / 2 - goalWidth / 2;
    const goalBottom = this.canvas.height / 2 + goalWidth / 2;
    
    if (ball.x < 30 && ball.y > goalTop && ball.y < goalBottom) {
      this.gameState.score.away++;
      this.goalScored('away');
    }
    
    if (ball.x > this.canvas.width - 30 && ball.y > goalTop && ball.y < goalBottom) {
      this.gameState.score.home++;
      this.goalScored('home');
    }
  }
  
  goalScored(scorer) {
    this.gameState.ball.x = this.gameState.field.centerX;
    this.gameState.ball.y = this.gameState.field.centerY;
    this.gameState.ball.vx = 0;
    this.gameState.ball.vy = 0;
    
    setTimeout(() => this.resetPositions(), 2000);
  }
  
  resetPositions() {
    this.initGame();
  }
  
  render() {
    this.drawField();
    this.drawPlayers();
    this.drawBall();
    this.drawUI();
    
    if (this.gameState.status === 'finished') {
      this.drawFinalScore();
    }
  }
  
  drawField() {
    this.ctx.fillStyle = '#4CAF50';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 3;
    
    this.ctx.strokeRect(50, 50, this.canvas.width - 100, this.canvas.height - 100);
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 50);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height - 50);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 60, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 5, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.drawGoal(20, this.canvas.height / 2 - 60, 30, 120, '#fff');
    this.drawGoal(this.canvas.width - 50, this.canvas.height / 2 - 60, 30, 120, '#fff');
  }
  
  drawGoal(x, y, width, height, color) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 5;
    this.ctx.strokeRect(x, y, width, height);
  }
  
  drawPlayers() {
    this.gameState.teams.home.forEach(p => this.drawPlayer(p));
    this.gameState.teams.away.forEach(p => this.drawPlayer(p));
  }
  
  drawPlayer(player) {
    this.ctx.fillStyle = player.color;
    this.ctx.beginPath();
    this.ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(player.name.substring(0, 2), player.x, player.y + 4);
  }
  
  drawBall() {
    const ball = this.gameState.ball;
    
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, ball.radius * 0.5, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, 50);
    
    this.ctx.fillStyle = '#ff0000';
    this.ctx.font = 'bold 30px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.gameState.score.home, this.canvas.width / 2 - 50, 38);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText('-', this.canvas.width / 2, 38);
    
    this.ctx.fillStyle = '#0000ff';
    this.ctx.fillText(this.gameState.score.away, this.canvas.width / 2 + 50, 38);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(`Half: ${this.gameState.half} | Time: ${Math.floor(this.gameState.time)}`, this.canvas.width - 120, 35);
  }
  
  drawFinalScore() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 60px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('MATCH FINISHED!', this.canvas.width / 2, this.canvas.height / 2 - 40);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '40px Arial';
    this.ctx.fillText(`${this.gameState.score.home} - ${this.gameState.score.away}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.SoccerGame = SoccerGame;