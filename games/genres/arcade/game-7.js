// Air Hockey Game
class AirHockeyGame {
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
      status: 'playing',
      p1Paddle: null,
      p2Paddle: null,
      puck: null,
      friction: 0.995,
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.p1Paddle = {
      x: 100,
      y: this.canvas.height / 2,
      radius: 30,
      vx: 0,
      vy: 0,
      speed: 6
    };
    
    this.gameState.p2Paddle = {
      x: this.canvas.width - 100,
      y: this.canvas.height / 2,
      radius: 30,
      vx: 0,
      vy: 0,
      speed: 6
    };
    
    this.gameState.puck = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      radius: 20,
      vx: 0,
      vy: 0,
      speed: 0
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
    
    this.updatePuck(deltaTime);
    this.checkGoal();
  }
  
  updatePuck(deltaTime) {
    const puck = this.gameState.puck;
    const p1 = this.gameState.p1Paddle;
    const p2 = this.gameState.p2Paddle;
    
    puck.x += puck.vx * deltaTime * 60;
    puck.y += puck.vy * deltaTime * 60;
    
    puck.vx *= this.gameState.friction;
    puck.vy *= this.gameState.friction;
    
    if (puck.y - puck.radius < 0) {
      puck.y = puck.radius;
      puck.vy *= -0.9;
    }
    if (puck.y + puck.radius > this.canvas.height) {
      puck.y = this.canvas.height - puck.radius;
      puck.vy *= -0.9;
    }
    
    if (puck.x - puck.radius < 0) {
      puck.x = puck.radius;
      puck.vx *= -0.9;
    }
    if (puck.x + puck.radius > this.canvas.width) {
      puck.x = this.canvas.width - puck.radius;
      puck.vx *= -0.9;
    }
    
    this.checkPaddleCollision(puck, p1);
    this.checkPaddleCollision(puck, p2);
  }
  
  checkPaddleCollision(puck, paddle) {
    const dx = puck.x - paddle.x;
    const dy = puck.y - paddle.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = puck.radius + paddle.radius;
    
    if (dist < minDist) {
      const angle = Math.atan2(dy, dx);
      const speed = Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy);
      
      puck.vx = Math.cos(angle) * (speed + 3);
      puck.vy = Math.sin(angle) * (speed + 3);
      
      const overlap = minDist - dist;
      puck.x += Math.cos(angle) * overlap;
      puck.y += Math.sin(angle) * overlap;
    }
  }
  
  checkGoal() {
    const puck = this.gameState.puck;
    
    if (puck.x < 0) {
      this.gameState.p2Score++;
      this.resetPuck(2);
    } else if (puck.x > this.canvas.width) {
      this.gameState.p1Score++;
      this.resetPuck(1);
    }
    
    if (this.gameState.p1Score >= 7 || this.gameState.p2Score >= 7) {
      this.gameState.gameOver = true;
    }
  }
  
  resetPuck(scorer) {
    const puck = this.gameState.puck;
    puck.x = this.canvas.width / 2;
    puck.y = this.canvas.height / 2;
    puck.vx = scorer === 1 ? 3 : -3;
    puck.vy = (Math.random() - 0.5) * 2;
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput1(input) {
    const p1 = this.gameState.p1Paddle;
    if (input.up) p1.y -= p1.speed;
    if (input.down) p1.y += p1.speed;
    if (input.left) p1.x -= p1.speed;
    if (input.right) p1.x += p1.speed;
    
    p1.x = Math.max(p1.radius, Math.min(this.canvas.width/2 - p1.radius, p1.x));
    p1.y = Math.max(p1.radius, Math.min(this.canvas.height - p1.radius, p1.y));
  }
  
  handleInput2(input) {
    const p2 = this.gameState.p2Paddle;
    if (input.up) p2.y -= p2.speed;
    if (input.down) p2.y += p2.speed;
    if (input.left) p2.x -= p2.speed;
    if (input.right) p2.x += p2.speed;
    
    p2.x = Math.max(this.canvas.width/2 + p2.radius, Math.min(this.canvas.width - p2.radius, p2.x));
    p2.y = Math.max(p2.radius, Math.min(this.canvas.height - p2.radius, p2.y));
  }
  
  render() {
    this.drawBackground();
    this.drawTable();
    this.drawPaddles();
    this.drawPuck();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#2c3e50');
    gradient.addColorStop(1, '#34495e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawTable() {
    this.ctx.fillStyle = '#ecf0f1';
    this.ctx.fillRect(20, 20, this.canvas.width - 40, this.canvas.height - 40);
    
    this.ctx.strokeStyle = '#e74c3c';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(20, 20, this.canvas.width - 40, this.canvas.height - 40);
    
    this.ctx.strokeStyle = '#3498db';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 20);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height - 20);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 60, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.beginPath();
    this.ctx.arc(20, this.canvas.height / 2, 40, -Math.PI/2, Math.PI/2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width - 20, this.canvas.height / 2, 40, Math.PI/2, -Math.PI/2);
    this.ctx.fill();
  }
  
  drawPaddles() {
    const p1 = this.gameState.p1Paddle;
    const p2 = this.gameState.p2Paddle;
    
    this.ctx.fillStyle = '#3498db';
    this.ctx.beginPath();
    this.ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#2980b9';
    this.ctx.beginPath();
    this.ctx.arc(p1.x, p1.y, p1.radius - 5, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.beginPath();
    this.ctx.arc(p2.x, p2.y, p2.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#c0392b';
    this.ctx.beginPath();
    this.ctx.arc(p2.x, p2.y, p2.radius - 5, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  drawPuck() {
    const puck = this.gameState.puck;
    
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.beginPath();
    this.ctx.arc(puck.x, puck.y, puck.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#1a252f';
    this.ctx.beginPath();
    this.ctx.arc(puck.x, puck.y, puck.radius - 5, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  drawUI() {
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 60px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${this.gameState.p1Score} - ${this.gameState.p2Score}`, this.canvas.width / 2, 80);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.fillText('P1: Arrow Keys', 60, 30);
    this.ctx.fillText('P2: WASD', this.canvas.width - 60, 30);
    
    this.ctx.fillText('AIR HOCKEY', this.canvas.width / 2, 18);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const winner = this.gameState.p1Score >= 7 ? 'Player 1' : 'Player 2';
    const color = this.gameState.p1Score >= 7 ? '#3498db' : '#e74c3c';
    
    this.ctx.fillStyle = color;
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${winner} Wins!`, this.canvas.width / 2, this.canvas.height / 2);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    if (name === 'player1') this.handleInput1(input);
    if (name === 'player2') this.handleInput2(input);
  }
}

window.AirHockeyGame = AirHockeyGame;