// Pinball Arcade Game
class PinballGame {
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
      flippers: [],
      bumpers: [],
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
    this.gameState.ball = {
      x: 100,
      y: 400,
      vx: 3,
      vy: -8,
      radius: 8
    };
    
    this.gameState.flippers = [
      { x: 250, y: 550, angle: -0.5, length: 60, side: 'left' },
      { x: 550, y: 550, angle: Math.PI + 0.5, length: 60, side: 'right' }
    ];
    
    this.gameState.bumpers = [
      { x: 400, y: 200, radius: 25, hit: false },
      { x: 300, y: 300, radius: 20, hit: false },
      { x: 500, y: 300, radius: 20, hit: false },
      { x: 400, y: 380, radius: 15, hit: false }
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
    if (this.gameState.gameOver) return;
    
    this.gameState.time += deltaTime;
    
    this.updateBall(deltaTime);
    this.updateFlipper(deltaTime);
    this.checkBumpers();
    this.checkOut();
  }
  
  updateBall(deltaTime) {
    const ball = this.gameState.ball;
    const gravity = 0.5;
    
    ball.vy += gravity;
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    if (ball.x < ball.radius) { ball.x = ball.radius; ball.vx *= -0.8; }
    if (ball.x > this.canvas.width - ball.radius) { ball.x = this.canvas.width - ball.radius; ball.vx *= -0.8; }
    
    this.gameState.bumpers.forEach(bumper => {
      const dx = ball.x - bumper.x;
      const dy = ball.y - bumper.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < ball.radius + bumper.radius) {
        const angle = Math.atan2(dy, dx);
        ball.vx = Math.cos(angle) * 8;
        ball.vy = Math.sin(angle) * 8;
        this.gameState.score += 100;
      }
    });
    
    const flippers = this.gameState.flippers;
    flippers.forEach(flipper => {
      const targetAngle = flipper.side === 'left' ? -0.5 : Math.PI + 0.5;
      flipper.angle += (targetAngle - flipper.angle) * 0.3;
    });
  }
  
  updateFlipper(deltaTime) {
    const input = this.getPlayerInput(this.players[0]);
    const flippers = this.gameState.flippers;
    
    if (input.left || input.a) {
      flippers[0].angle = -1.2;
      if (this.checkFlipperCollision(flippers[0])) {
        this.gameState.ball.vy = -12;
        this.gameState.ball.vx += 2;
      }
    }
    if (input.right || input.b) {
      flippers[1].angle = Math.PI + 1.2;
      if (this.checkFlipperCollision(flippers[1])) {
        this.gameState.ball.vy = -12;
        this.gameState.ball.vx -= 2;
      }
    }
  }
  
  checkFlipperCollision(flipper) {
    const ball = this.gameState.ball;
    const dx = ball.x - flipper.x;
    const dy = ball.y - flipper.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    return dist < flipper.length && Math.abs(dy) < 20;
  }
  
  checkBumpers() {}
  
  checkOut() {
    const ball = this.gameState.ball;
    
    if (ball.y > this.canvas.height + 50) {
      this.gameState.gameOver = true;
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.drawBackground();
    this.drawBumpers();
    this.drawFlippers();
    this.drawBall();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(50, 100, 30, 500);
    this.ctx.fillRect(720, 100, 30, 500);
  }
  
  drawBumpers() {
    this.gameState.bumpers.forEach(bumper => {
      const gradient = this.ctx.createRadialGradient(bumper.x, bumper.y, 0, bumper.x, bumper.y, bumper.radius);
      gradient.addColorStop(0, '#f1c40f');
      gradient.addColorStop(1, '#e67e22');
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(bumper.x, bumper.y, bumper.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('100', bumper.x, bumper.y + 4);
    });
  }
  
  drawFlippers() {
    this.gameState.flippers.forEach(flipper => {
      this.ctx.save();
      this.ctx.translate(flipper.x, flipper.y);
      this.ctx.rotate(flipper.angle);
      
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(-flipper.length/2, -5, flipper.length, 10);
      
      this.ctx.restore();
    });
  }
  
  drawBall() {
    const ball = this.gameState.ball;
    
    this.ctx.fillStyle = '#ecf0f1';
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
    this.ctx.beginPath();
    this.ctx.arc(ball.x - 2, ball.y - 2, 3, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, 10, 120, 40);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 35);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PINBALL', this.canvas.width / 2, 25);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.PinballGame = PinballGame;