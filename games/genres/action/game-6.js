// SpongeBob Game (Cartoon Platformer)
class SpongeBobGame {
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
      jellyfishCount: 0,
      health: 100,
      status: 'playing',
      player: null,
      jellyfish: [],
      platforms: [],
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = { x: 100, y: 400, vx: 0, vy: 0, width: 40, height: 50, grounded: false };
    this.gameState.platforms = [
      { x: 0, y: 550, width: 800, height: 50 },
      { x: 200, y: 450, width: 100, height: 20 },
      { x: 400, y: 380, width: 100, height: 20 },
      { x: 600, y: 300, width: 100, height: 20 },
      { x: 300, y: 250, width: 80, height: 20 }
    ];
    for (let i = 0; i < 5; i++) this.spawnJellyfish();
  }
  
  spawnJellyfish() {
    this.gameState.jellyfish.push({
      x: 100 + Math.random() * 600,
      y: 100 + Math.random() * 300,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 1,
      color: ['#e74c3c', '#3498db', '#f1c40f', '#9b59b6'][Math.floor(Math.random() * 4)]
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
    
    const input = this.getPlayerInput(this.players[0]);
    const p = this.gameState.player;
    if (input.left) p.vx = -4;
    else if (input.right) p.vx = 4;
    else p.vx = 0;
    if (input.up && p.grounded) { p.vy = -10; p.grounded = false; }
    
    p.vy += 0.5;
    p.x += p.vx;
    p.y += p.vy;
    
    p.grounded = false;
    this.gameState.platforms.forEach(plat => {
      if (p.y + p.height > plat.y && p.y < plat.y + plat.height && p.x + p.width > plat.x && p.x < plat.x + plat.width && p.vy > 0) {
        p.y = plat.y - p.height;
        p.vy = 0;
        p.grounded = true;
      }
    });
    
    p.x = Math.max(0, Math.min(this.canvas.width - p.width, p.x));
    
    this.gameState.jellyfish.forEach(j => {
      j.x += j.vx;
      j.y += j.vy;
      if (j.x < 0 || j.x > this.canvas.width) j.vx *= -1;
      if (j.y < 50 || j.y > 450) j.vy *= -1;
      
      const dx = p.x + p.width/2 - j.x;
      const dy = p.y + p.height/2 - j.y;
      if (Math.sqrt(dx*dx + dy*dy) < 30) {
        this.gameState.score += 100;
        this.gameState.jellyfishCount++;
        j.x = -100;
        this.spawnJellyfish();
      }
    });
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, '#87ceeb');
    grad.addColorStop(1, '#b0e0e6');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#8b4513';
    this.gameState.platforms.forEach(p => this.ctx.fillRect(p.x, p.y, p.width, p.height));
    
    this.gameState.jellyfish.forEach(j => {
      this.ctx.fillStyle = j.color;
      this.ctx.beginPath();
      this.ctx.arc(j.x, j.y, 15, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
      this.ctx.beginPath();
      this.ctx.moveTo(j.x, j.y);
      this.ctx.lineTo(j.x - 10, j.y + 20);
      this.ctx.lineTo(j.x + 10, j.y + 20);
      this.ctx.fill();
    });
    
    const p = this.gameState.player;
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.fillRect(p.x, p.y, p.width, p.height);
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(p.x + 20, p.y + 10, 15, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(p.x + 15, p.y + 8, 3, 0, Math.PI * 2);
    this.ctx.arc(p.x + 25, p.y + 8, 3, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#000';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Score: ' + this.gameState.score + ' | Jellyfish: ' + this.gameState.jellyfishCount, 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.fillText('SPONGE BOB', this.canvas.width / 2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.SpongeBobGame = SpongeBobGame;