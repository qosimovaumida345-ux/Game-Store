// Balloon Popping Game
class BalloonPopGame {
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
      arrows: 20,
      balloons: [],
      crosshair: { x: 400, y: 300 },
      status: 'aiming',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    for (let i = 0; i < 8; i++) {
      this.spawnBalloon();
    }
  }
  
  spawnBalloon() {
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'];
    this.gameState.balloons.push({
      x: 50 + Math.random() * 700,
      y: 650,
      vy: -1 - Math.random(),
      size: 30 + Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      popped: false
    });
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
    
    this.gameState.balloons.forEach(b => {
      if (!b.popped) {
        b.y += b.vy * 60 * deltaTime;
        if (b.y < -50) b.popped = true;
      }
    });
    
    this.gameState.balloons = this.gameState.balloons.filter(b => !b.popped);
    while (this.gameState.balloons.length < 8) this.spawnBalloon();
    
    if (this.gameState.arrows <= 0 && this.gameState.balloons.every(b => b.popped)) {
      this.gameState.gameOver = true;
    }
  }
  
  shoot() {
    if (this.gameState.arrows <= 0 || this.gameState.status === 'shooting') return;
    this.gameState.arrows--;
    this.gameState.status = 'shooting';
    
    const ch = this.gameState.crosshair;
    this.gameState.balloons.forEach(b => {
      const dx = ch.x - b.x;
      const dy = ch.y - b.y;
      if (Math.sqrt(dx*dx+dy*dy) < b.size + 10) {
        b.popped = true;
        this.gameState.score += 10;
      }
    });
    
    setTimeout(() => { this.gameState.status = 'aiming'; }, 200);
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input) {
    const ch = this.gameState.crosshair;
    if (input.left) ch.x = Math.max(30, ch.x - 15);
    if (input.right) ch.x = Math.min(770, ch.x + 15);
    if (input.up) ch.y = Math.max(30, ch.y - 15);
    if (input.down) ch.y = Math.min(570, ch.y + 15);
    if (input.action || input.a) this.shoot();
  }
  
  render() {
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, '#87ceeb');
    grad.addColorStop(1, '#e0f7fa');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(0, 550, 800, 50);
    
    this.gameState.balloons.forEach(b => {
      this.ctx.fillStyle = b.color;
      this.ctx.beginPath();
      this.ctx.ellipse(b.x, b.y, b.size * 0.8, b.size, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(b.x, b.y + b.size);
      this.ctx.lineTo(b.x, b.y + b.size + 20);
      this.ctx.stroke();
    });
    
    this.ctx.strokeStyle = '#e74c3c';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(this.gameState.crosshair.x, this.gameState.crosshair.y, 25, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(this.gameState.crosshair.x - 30, this.gameState.crosshair.y);
    this.ctx.lineTo(this.gameState.crosshair.x - 15, this.gameState.crosshair.y);
    this.ctx.moveTo(this.gameState.crosshair.x + 15, this.gameState.crosshair.y);
    this.ctx.lineTo(this.gameState.crosshair.x + 30, this.gameState.crosshair.y);
    this.ctx.moveTo(this.gameState.crosshair.x, this.gameState.crosshair.y - 30);
    this.ctx.lineTo(this.gameState.crosshair.x, this.gameState.crosshair.y - 15);
    this.ctx.moveTo(this.gameState.crosshair.x, this.gameState.crosshair.y + 15);
    this.ctx.lineTo(this.gameState.crosshair.x, this.gameState.crosshair.y + 30);
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Score: ' + this.gameState.score + ' | Arrows: ' + this.gameState.arrows, 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BALLOON POP', this.canvas.width / 2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input);
  }
}

window.BalloonPopGame = BalloonPopGame;