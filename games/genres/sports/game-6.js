// Golf Sports Game
class GolfGame {
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
      strokes: 0,
      hole: 1,
      totalHoles: 9,
      status: 'aiming',
      ball: null,
      power: 0,
      aimAngle: 0,
      holes: [],
      wind: 0,
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.holes = [
      { x: 700, y: 500, par: 3 },
      { x: 100, y: 500, par: 4 },
      { x: 700, y: 100, par: 3 },
      { x: 100, y: 100, par: 4 },
      { x: 700, y: 300, par: 4 },
      { x: 150, y: 300, par: 5 },
      { x: 650, y: 200, par: 3 },
      { x: 200, y: 150, par: 4 },
      { x: 600, y: 450, par: 3 }
    ];
    
    this.gameState.ball = {
      x: 100,
      y: 500,
      vx: 0,
      vy: 0,
      radius: 8,
      rolling: false
    };
    
    this.gameState.wind = (Math.random() - 0.5) * 5;
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
    
    if (this.gameState.status === 'moving') {
      this.updateBall(deltaTime);
    } else if (this.gameState.status === 'aiming') {
      this.gameState.power = 50 + Math.sin(this.gameState.time * 3) * 30;
      this.gameState.aimAngle = Math.sin(this.gameState.time * 1.5) * 0.5;
    }
  }
  
  updateBall(deltaTime) {
    const ball = this.gameState.ball;
    const friction = ball.rolling ? 0.95 : 0.99;
    const wind = this.gameState.wind * 0.1;
    
    ball.vx += wind * deltaTime;
    ball.vx *= friction;
    ball.vy *= friction;
    ball.vy += 0.15;
    
    if (Math.abs(ball.vx) < 0.1 && Math.abs(ball.vy) < 0.1 && ball.y > 0) {
      ball.rolling = true;
    }
    
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    if (ball.y > 550) {
      ball.y = 550;
      ball.vy *= -0.5;
      ball.rolling = true;
    }
    
    const currentHole = this.gameState.holes[this.gameState.hole - 1];
    const dx = ball.x - currentHole.x;
    const dy = ball.y - currentHole.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 15) {
      this.holeComplete();
    }
    
    ball.x = Math.max(20, Math.min(780, ball.x));
    
    if (Math.abs(ball.vx) < 0.05 && Math.abs(ball.vy) < 0.05) {
      this.gameState.status = 'aiming';
      ball.vx = 0;
      ball.vy = 0;
    }
  }
  
  shoot() {
    if (this.gameState.status !== 'aiming') return;
    
    const power = this.gameState.power / 100;
    const speed = power * 15;
    
    this.gameState.ball.vx = Math.cos(this.gameState.aimAngle) * speed;
    this.gameState.ball.vy = Math.sin(this.gameState.aimAngle) * speed;
    this.gameState.ball.rolling = false;
    
    this.gameState.strokes++;
    this.gameState.score += this.gameState.strokes;
    this.gameState.status = 'moving';
  }
  
  holeComplete() {
    const currentHole = this.gameState.holes[this.gameState.hole - 1];
    const par = currentHole.par;
    const score = this.gameState.strokes - par;
    
    if (this.gameState.hole >= this.gameState.totalHoles) {
      this.gameState.gameOver = true;
    } else {
      this.gameState.hole++;
      this.gameState.strokes = 0;
      this.gameState.ball.x = 100;
      this.gameState.ball.y = 500;
      this.gameState.ball.vx = 0;
      this.gameState.ball.vy = 0;
      this.gameState.ball.rolling = false;
      this.gameState.status = 'aiming';
      this.gameState.wind = (Math.random() - 0.5) * 5;
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (input.left) this.gameState.aimAngle -= 0.05;
    if (input.right) this.gameState.aimAngle += 0.05;
    if (input.action) this.shoot();
  }
  
  render() {
    this.drawBackground();
    this.drawCourse();
    this.drawHole();
    this.drawBall();
    this.drawAim();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(0.3, '#98d8c8');
    gradient.addColorStop(1, '#7dcea0');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawCourse() {
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(50, 50, 700, 500);
    
    this.ctx.fillStyle = '#27ae60';
    for (let x = 60; x < 750; x += 40) {
      for (let y = 60; y < 550; y += 40) {
        if ((x + y) % 80 === 0) {
          this.ctx.fillRect(x, y, 35, 35);
        }
      }
    }
    
    this.ctx.fillStyle = '#8b4513';
    this.ctx.fillRect(80, 480, 60, 40);
    this.ctx.fillStyle = '#deb887';
    this.ctx.fillRect(85, 485, 50, 30);
    
    this.ctx.fillStyle = '#8b4513';
    this.ctx.fillRect(50, 20, 100, 25);
    this.ctx.fillRect(60, 20, 80, 20);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('TEE', 100, 38);
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for (let i = 0; i < 10; i++) {
      const x = 100 + i * 70;
      const y = 150 + Math.sin(i) * 100;
      this.ctx.beginPath();
      this.ctx.ellipse(x, y, 40, 20, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  
  drawHole() {
    const currentHole = this.gameState.holes[this.gameState.hole - 1];
    
    this.ctx.fillStyle = '#27ae60';
    this.ctx.beginPath();
    this.ctx.ellipse(currentHole.x, currentHole.y, 25, 15, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#1e8449';
    this.ctx.beginPath();
    this.ctx.ellipse(currentHole.x, currentHole.y, 10, 6, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(currentHole.par.toString(), currentHole.x, currentHole.y + 5);
  }
  
  drawBall() {
    const ball = this.gameState.ball;
    
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#ccc';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(ball.x - 2, ball.y - 2, 2, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  drawAim() {
    if (this.gameState.status !== 'aiming') return;
    
    const ball = this.gameState.ball;
    const length = this.gameState.power * 1.5;
    
    this.ctx.strokeStyle = '#e74c3c';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([10, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(ball.x, ball.y);
    this.ctx.lineTo(
      ball.x + Math.cos(this.gameState.aimAngle) * length,
      ball.y + Math.sin(this.gameState.aimAngle) * length
    );
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.beginPath();
    this.ctx.arc(
      ball.x + Math.cos(this.gameState.aimAngle) * length,
      ball.y + Math.sin(this.gameState.aimAngle) * length,
      5, 0, Math.PI * 2
    );
    this.ctx.fill();
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, 10, 130, 80);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Hole: ${this.gameState.hole}/${this.gameState.totalHoles}`, 20, 30);
    this.ctx.fillText(`Par: ${this.gameState.holes[this.gameState.hole - 1].par}`, 20, 50);
    this.ctx.fillText(`Strokes: ${this.gameState.strokes}`, 20, 70);
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, this.canvas.height - 40, 150, 30);
    
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(15, this.canvas.height - 35, 140, 8);
    this.ctx.fillStyle = this.gameState.power > 70 ? '#e74c3c' : (this.gameState.power > 40 ? '#f1c40f' : '#2ecc71');
    this.ctx.fillRect(15, this.canvas.height - 35, 140 * (this.gameState.power / 100), 8);
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(this.canvas.width - 100, 10, 90, 35);
    
    const windSpeed = Math.abs(this.gameState.wind);
    const windDir = this.gameState.wind > 0 ? '→' : '←';
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Wind ${windDir}${windSpeed.toFixed(1)}`, this.canvas.width - 55, 32);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.fillText('MINI GOLF', this.canvas.width / 2, 25);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('COURSE COMPLETE!', this.canvas.width / 2, this.canvas.height / 2 - 40);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Total Strokes: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.GolfGame = GolfGame;