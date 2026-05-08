// Archery Sports Game
class ArcheryGame {
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
      round: 1,
      arrows: 6,
      arrowScore: 0,
      power: 50,
      status: 'aiming',
      arrow: null,
      target: null,
      wind: 0,
      perfectShots: 0,
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.target = {
      x: this.canvas.width - 100,
      y: this.canvas.height / 2,
      rings: [
        { radius: 40, points: 10, color: '#fff' },
        { radius: 32, points: 9, color: '#000' },
        { radius: 24, points: 8, color: '#3498db' },
        { radius: 16, points: 7, color: '#e74c3c' },
        { radius: 8, points: 10, color: '#f1c40f' }
      ]
    };
    
    this.gameState.wind = (Math.random() - 0.5) * 10;
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
    
    if (this.gameState.status === 'flying') {
      this.updateArrow(deltaTime);
    }
  }
  
  updateArrow(deltaTime) {
    const arrow = this.gameState.arrow;
    const target = this.gameState.target;
    
    arrow.x += arrow.vx * deltaTime * 60;
    arrow.y += arrow.vy * deltaTime * 60;
    arrow.vy += 0.15;
    
    arrow.angle = Math.atan2(arrow.vy, arrow.vx);
    
    const dx = arrow.x - target.x;
    const dy = arrow.y - target.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (arrow.x > target.x + 50) {
      this.endArrow();
      return;
    }
    
    if (dist < 50) {
      this.calculateScore(dist);
      this.endArrow();
    }
  }
  
  calculateScore(dist) {
    const target = this.gameState.target;
    let points = 0;
    
    for (let i = 0; i < target.rings.length; i++) {
      if (dist <= target.rings[i].radius) {
        points = target.rings[i].points;
      }
    }
    
    this.gameState.arrowScore = points;
    this.gameState.score += points;
    
    if (points === 10) {
      this.gameState.perfectShots++;
    }
  }
  
  endArrow() {
    this.gameState.arrows--;
    this.gameState.status = 'aiming';
    this.gameState.arrow = null;
    
    if (this.gameState.arrows <= 0) {
      this.nextRound();
    }
  }
  
  nextRound() {
    if (this.gameState.round >= 5) {
      this.gameState.gameOver = true;
    } else {
      this.gameState.round++;
      this.gameState.arrows = 6;
      this.gameState.wind = (Math.random() - 0.5) * 15;
    }
  }
  
  shoot() {
    if (this.gameState.status !== 'aiming' || this.gameState.arrows <= 0) return;
    
    const power = this.gameState.power / 50;
    
    this.gameState.arrow = {
      x: 100,
      y: this.canvas.height - 150,
      vx: power * 15 + this.gameState.wind * 0.3,
      vy: -power * 8,
      angle: 0,
      stuck: false
    };
    
    this.gameState.status = 'flying';
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (input.action) this.shoot();
    
    if (input.left) this.gameState.power = Math.max(20, this.gameState.power - 1);
    if (input.right) this.gameState.power = Math.min(100, this.gameState.power + 1);
  }
  
  render() {
    this.drawBackground();
    this.drawTarget();
    this.drawArrow();
    this.drawBow();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(1, '#90ee90');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#8fbc8f';
    this.ctx.fillRect(0, this.canvas.height - 100, this.canvas.width, 100);
    
    this.ctx.fillStyle = '#228b22';
    for (let i = 0; i < 10; i++) {
      const x = (i * 150 + 50) % this.canvas.width;
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.canvas.height - 100);
      this.ctx.lineTo(x - 10, this.canvas.height - 50);
      this.ctx.lineTo(x + 10, this.canvas.height - 50);
      this.ctx.fill();
    }
  }
  
  drawTarget() {
    const target = this.gameState.target;
    
    for (let i = target.rings.length - 1; i >= 0; i--) {
      const ring = target.rings[i];
      this.ctx.fillStyle = ring.color;
      this.ctx.beginPath();
      this.ctx.arc(target.x, target.y, ring.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('10', target.x, target.y + 4);
  }
  
  drawArrow() {
    if (!this.gameState.arrow) return;
    
    const arrow = this.gameState.arrow;
    
    this.ctx.save();
    this.ctx.translate(arrow.x, arrow.y);
    this.ctx.rotate(arrow.angle);
    
    this.ctx.fillStyle = '#8b4513';
    this.ctx.fillRect(-20, -2, 30, 4);
    
    this.ctx.fillStyle = '#333';
    this.ctx.beginPath();
    this.ctx.moveTo(10, 0);
    this.ctx.lineTo(0, -4);
    this.ctx.lineTo(0, 4);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.beginPath();
    this.ctx.moveTo(-20, 0);
    this.ctx.lineTo(-25, -3);
    this.ctx.lineTo(-25, 3);
    this.ctx.fill();
    
    this.ctx.restore();
  }
  
  drawBow() {
    const bowY = this.canvas.height - 150;
    
    this.ctx.strokeStyle = '#8b4513';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.arc(60, bowY, 40, -Math.PI/2, Math.PI/2);
    this.ctx.stroke();
    
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(60, bowY - 40);
    this.ctx.lineTo(60, bowY + 40);
    this.ctx.stroke();
    
    const powerRatio = this.gameState.power / 100;
    const pullBack = powerRatio * 30;
    
    if (this.gameState.status === 'aiming' && this.gameState.arrows > 0) {
      this.ctx.save();
      this.ctx.translate(60, bowY);
      
      this.ctx.fillStyle = '#8b4513';
      this.ctx.fillRect(-20 - pullBack, -2, 30, 4);
      
      this.ctx.fillStyle = '#333';
      this.ctx.beginPath();
      this.ctx.moveTo(10 - pullBack, 0);
      this.ctx.lineTo(0 - pullBack, -4);
      this.ctx.lineTo(0 - pullBack, 4);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.beginPath();
      this.ctx.moveTo(-20 - pullBack, 0);
      this.ctx.lineTo(-25 - pullBack, -3);
      this.ctx.lineTo(-25 - pullBack, 3);
      this.ctx.fill();
      
      this.ctx.restore();
    }
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 140, 80);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    this.ctx.fillText(`Round: ${this.gameState.round}/5`, 20, 50);
    this.ctx.fillText(`Arrows: ${this.gameState.arrows}`, 20, 70);
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, this.canvas.height - 40, 150, 30);
    
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(15, this.canvas.height - 35, 140, 8);
    this.ctx.fillStyle = this.gameState.power > 70 ? '#e74c3c' : (this.gameState.power > 40 ? '#f1c40f' : '#2ecc71');
    this.ctx.fillRect(15, this.canvas.height - 35, 140 * (this.gameState.power / 100), 8);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Power: ${this.gameState.power}%`, 85, this.canvas.height - 20);
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(this.canvas.width - 100, 10, 90, 40);
    
    const windSpeed = Math.abs(this.gameState.wind);
    const windDir = this.gameState.wind > 0 ? '→' : '←';
    this.ctx.fillStyle = this.gameState.wind > 0 ? '#e74c3c' : '#3498db';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Wind ${windDir}${windSpeed.toFixed(1)}`, this.canvas.width - 55, 35);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.fillText('ARCHERY', this.canvas.width / 2, 25);
    
    if (this.gameState.arrowScore > 0) {
      this.ctx.fillStyle = this.gameState.arrowScore === 10 ? '#f1c40f' : '#fff';
      this.ctx.font = 'bold 24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`+${this.gameState.arrowScore}`, this.canvas.width / 2, this.canvas.height / 2);
      this.gameState.arrowScore = 0;
    }
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 50);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
    this.ctx.fillText(`Perfect Shots: ${this.gameState.perfectShots}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.ArcheryGame = ArcheryGame;