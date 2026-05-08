// Target Shooting Game
class TargetShootingGame {
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
      ammo: 30,
      targets: [],
      crosshair: { x: 400, y: 300 },
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
    for (let i = 0; i < 5; i++) {
      this.spawnTarget();
    }
  }
  
  spawnTarget() {
    const types = ['static', 'moving', 'shooting'];
    const type = types[Math.floor(Math.random() * types.length)];
    this.gameState.targets.push({
      x: 100 + Math.random() * 600,
      y: 100 + Math.random() * 400,
      vx: type === 'moving' ? (Math.random() - 0.5) * 4 : 0,
      vy: type === 'moving' ? (Math.random() - 0.5) * 4 : 0,
      size: type === 'static' ? 30 : 25,
      type: type,
      hit: false
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
    
    this.gameState.targets.forEach(t => {
      if (t.hit) return;
      t.x += t.vx;
      t.y += t.vy;
      if (t.x < 50 || t.x > 750) t.vx *= -1;
      if (t.y < 50 || t.y > 550) t.vy *= -1;
    });
    
    this.gameState.targets = this.gameState.targets.filter(t => !t.hit);
    if (this.gameState.targets.length < 5 && Math.random() < 0.02) {
      this.spawnTarget();
    }
    
    if (this.gameState.ammo <= 0 && this.gameState.targets.length === 0) {
      this.gameState.gameOver = true;
    }
  }
  
  shoot() {
    if (this.gameState.ammo <= 0) return;
    this.gameState.ammo--;
    
    const ch = this.gameState.crosshair;
    this.gameState.targets.forEach(t => {
      const dx = ch.x - t.x;
      const dy = ch.y - t.y;
      if (Math.sqrt(dx*dx+dy*dy) < t.size) {
        t.hit = true;
        this.gameState.score += t.type === 'shooting' ? 30 : (t.type === 'moving' ? 20 : 10);
      }
    });
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
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.beginPath();
    this.ctx.arc(400, 50, 20, 0, Math.PI*2);
    this.ctx.fill();
    
    this.gameState.targets.forEach(t => {
      if (t.hit) return;
      const color = t.type === 'shooting' ? '#e74c3c' : (t.type === 'moving' ? '#f1c40f' : '#2ecc71');
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#fff';
      this.ctx.beginPath();
      this.ctx.arc(t.x, t.y, t.size - 10, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    const ch = this.gameState.crosshair;
    this.ctx.strokeStyle = '#00ff00';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(ch.x, ch.y, 20, 0, Math.PI*2);
    this.ctx.stroke();
    this.ctx.moveTo(ch.x - 25, ch.y);
    this.ctx.lineTo(ch.x - 10, ch.y);
    this.ctx.moveTo(ch.x + 10, ch.y);
    this.ctx.lineTo(ch.x + 25, ch.y);
    this.ctx.moveTo(ch.x, ch.y - 25);
    this.ctx.lineTo(ch.x, ch.y - 10);
    this.ctx.moveTo(ch.x, ch.y + 10);
    this.ctx.lineTo(ch.x, ch.y + 25);
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Score: ' + this.gameState.score + ' | Ammo: ' + this.gameState.ammo, 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('TARGET SHOOTER', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input);
  }
}

window.TargetShootingGame = TargetShootingGame;