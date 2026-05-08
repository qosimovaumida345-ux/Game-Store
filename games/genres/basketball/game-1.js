// Basketball Pro Game
class BasketballProGame {
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
      possessions: [0, 0],
      quarter: 1,
      quarterTime: 0,
      status: 'playing',
      ball: null,
      shooter: null,
      players: [
        { x: 300, y: 500, vx: 0, vy: 0, team: 0, shooting: false },
        { x: 500, y: 500, vx: 0, vy: 0, team: 1, shooting: false }
      ],
      hoop: { x: 700, y: 180, radius: 25 },
      gameOver: false,
      winner: null
    };
    
    this.config = {
      courtWidth: 800,
      courtHeight: 600,
      playerSpeed: 4,
      ballSpeed: 18,
      gravity: 0.4,
      hoopY: 180,
      threePointLine: 600,
      freeThrowLine: 450
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.ball = {
      x: 400,
      y: 300,
      vx: 0,
      vy: 0,
      vz: 0,
      heldBy: null,
      active: false,
      scored: false
    };
    this.gameState.shooter = 0;
    this.gameState.players[0].x = 250;
    this.gameState.players[0].y = 400;
    this.gameState.players[1].x = 550;
    this.gameState.players[1].y = 400;
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
    
    if (this.gameState.quarterTime >= 120) {
      this.nextQuarter();
    }
    
    this.updatePlayers(deltaTime);
    
    if (this.gameState.ball.active) {
      this.updateBall(deltaTime);
    }
  }
  
  updatePlayers(deltaTime) {
    this.players.forEach((player, i) => {
      const input = this.getPlayerInput(this.players[i]);
      const speed = this.config.playerSpeed;
      
      if (input.left) player.x -= speed;
      if (input.right) player.x += speed;
      if (input.up) player.y -= speed;
      if (input.down) player.y += speed;
      
      player.x = Math.max(20, Math.min(this.canvas.width - 20, player.x));
      player.y = Math.max(300, Math.min(this.canvas.height - 30, player.y));
      
      if (input.action && !this.gameState.ball.heldBy) {
        this.shootBall(i);
      }
    });
  }
  
  shootBall(playerIndex) {
    const player = this.gameState.players[playerIndex];
    const ball = this.gameState.ball;
    const hoop = this.gameState.hoop;
    
    ball.x = player.x;
    ball.y = player.y - 30;
    ball.heldBy = playerIndex;
    
    const dx = hoop.x - ball.x;
    const dy = hoop.y - ball.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const isThreePoint = player.x < this.config.threePointLine;
    const points = isThreePoint ? 3 : 2;
    
    const power = 0.7 + Math.random() * 0.3;
    ball.vx = (dx / dist) * this.config.ballSpeed * power;
    ball.vy = (dy / dist) * this.config.ballSpeed * power - 8;
    ball.vz = 10;
    
    ball.active = true;
    ball.heldBy = null;
    player.shooting = true;
    
    this.gameState.shooter = playerIndex;
    
    setTimeout(() => {
      player.shooting = false;
      this.checkScore(points);
    }, 1500);
  }
  
  updateBall(deltaTime) {
    const ball = this.gameState.ball;
    const hoop = this.gameState.hoop;
    
    ball.vy += this.config.gravity;
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.z = ball.vz;
    
    ball.vz *= 0.95;
    
    if (ball.y > this.canvas.height) {
      ball.active = false;
      this.switchPossession();
    }
    
    const dx = ball.x - hoop.x;
    const dy = ball.y - hoop.y;
    const dz = ball.z - 0;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (dist < 30 && ball.vy > 0 && !ball.scored) {
      ball.scored = true;
      ball.y = hoop.y;
      ball.vy = -3;
    }
    
    if ((ball.x < 0 || ball.x > this.canvas.width) && ball.active) {
      ball.active = false;
      this.switchPossession();
    }
  }
  
  checkScore(points) {
    const ball = this.gameState.ball;
    const hoop = this.gameState.hoop;
    
    if (ball.scored) {
      this.gameState.score[this.gameState.shooter] += points;
    }
    
    setTimeout(() => {
      this.resetPositions();
      this.switchPossession();
    }, 1000);
  }
  
  switchPossession() {
    this.gameState.possessions = [1, 0];
    this.gameState.ball.active = false;
    this.gameState.ball.heldBy = null;
    this.gameState.ball.x = 400;
    this.gameState.ball.y = 300;
    this.gameState.ball.vx = 0;
    this.gameState.ball.vy = 0;
  }
  
  resetPositions() {
    this.gameState.players[0].x = 250;
    this.gameState.players[0].y = 400;
    this.gameState.players[1].x = 550;
    this.gameState.players[1].y = 400;
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
    this.drawCourt();
    this.drawHoop();
    this.drawPlayers();
    this.drawBall();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawCourt() {
    this.ctx.fillStyle = '#d4a76a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 3;
    
    this.ctx.strokeRect(50, 100, 700, 450);
    
    this.ctx.beginPath();
    this.ctx.moveTo(50, 300);
    this.ctx.lineTo(750, 300);
    this.ctx.stroke();
    
    this.ctx.strokeStyle = '#ff4444';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(600, 100, 200, 200);
    
    this.ctx.beginPath();
    this.ctx.moveTo(50, 100);
    this.ctx.lineTo(150, 100);
    this.ctx.lineTo(50, 300);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(750, 100);
    this.ctx.lineTo(650, 100);
    this.ctx.lineTo(750, 300);
    this.ctx.stroke();
  }
  
  drawHoop() {
    const hoop = this.gameState.hoop;
    
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(hoop.x + 20, 100, 10, 80);
    
    this.ctx.strokeStyle = '#ff6600';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.arc(hoop.x, hoop.y, hoop.radius, 0, Math.PI, true);
    this.ctx.stroke();
    
    this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
    this.ctx.fillRect(hoop.x - 40, hoop.y - 5, 80, 10);
  }
  
  drawPlayers() {
    this.gameState.players.forEach((player, i) => {
      const color = i === 0 ? '#3498db' : '#e74c3c';
      
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(player.x, player.y - 30, 15, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.fillRect(player.x - 12, player.y - 15, 24, 30);
      
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.moveTo(player.x, player.y + 15);
      this.ctx.lineTo(player.x - 18, player.y + 40);
      this.ctx.lineTo(player.x + 18, player.y + 40);
      this.ctx.closePath();
      this.ctx.fill();
      
      this.ctx.fillStyle = '#ffd93d';
      this.ctx.font = 'bold 11px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.players[i], player.x, player.y + 55);
      
      if (player.shooting) {
        this.ctx.fillStyle = '#ff0';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText('SHOOTING!', player.x, player.y - 60);
      }
    });
  }
  
  drawBall() {
    const ball = this.gameState.ball;
    const screenY = ball.y - ball.z;
    
    const gradient = this.ctx.createRadialGradient(
      ball.x - 3, screenY - 3, 0,
      ball.x, screenY, 12
    );
    gradient.addColorStop(0, '#ff6600');
    gradient.addColorStop(0.5, '#ff8c00');
    gradient.addColorStop(1, '#cc5500');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(ball.x, screenY, 12, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(ball.x, screenY, 12, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(ball.x - 12, screenY);
    this.ctx.lineTo(ball.x + 12, screenY);
    this.ctx.stroke();
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 150, 80);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${this.players[0]}: ${this.gameState.score[0]}`, 20, 35);
    this.ctx.fillText(`${this.players[1]}: ${this.gameState.score[1]}`, 20, 60);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BASKETBALL', this.canvas.width / 2, 30);
    
    this.ctx.fillStyle = '#4ecdc4';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`Q${this.gameState.quarter} - ${Math.floor(this.gameState.quarterTime / 60)}:${Math.floor(this.gameState.quarterTime % 60).toString().padStart(2, '0')}`, this.canvas.width / 2, 55);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
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

window.BasketballProGame = BasketballProGame;