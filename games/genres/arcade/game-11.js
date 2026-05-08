// Space Invaders Clone
class SpaceInvadersGame {
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
      lives: 3,
      wave: 1,
      player: null,
      invaders: [],
      bullets: [],
      shields: [],
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
    this.gameState.player = { x: 400, y: 550, width: 40, height: 30, cooldown: 0 };
    this.createWave();
  }
  
  createWave() {
    this.gameState.invaders = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 8; col++) {
        this.gameState.invaders.push({
          x: 100 + col * 60,
          y: 80 + row * 40,
          width: 30,
          height: 25,
          type: row,
          alive: true
        });
      }
    }
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
    if (input.left) p.x = Math.max(20, p.x - 5);
    if (input.right) p.x = Math.min(this.canvas.width - 20, p.x + 5);
    if (input.action && p.cooldown <= 0) {
      this.gameState.bullets.push({ x: p.x, y: p.y - 20, vx: 0, vy: -8, enemy: false });
      p.cooldown = 0.3;
    }
    if (p.cooldown > 0) p.cooldown -= deltaTime;
    
    this.gameState.bullets.forEach(b => {
      b.y += b.vy;
      if (b.y < 0 || b.y > this.canvas.height) b.remove = true;
      
      if (!b.enemy) {
        this.gameState.invaders.forEach(i => {
          if (i.alive && b.x > i.x && b.x < i.x + i.width && b.y > i.y && b.y < i.y + i.height) {
            i.alive = false;
            b.remove = true;
            this.gameState.score += (4 - i.type) * 10;
          }
        });
      }
    });
    
    this.gameState.bullets = this.gameState.bullets.filter(b => !b.remove);
    
    if (this.gameState.invaders.every(i => !i.alive)) {
      this.gameState.wave++;
      this.createWave();
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 24px Courier';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('SPACE INVADERS', this.canvas.width / 2, 30);
    this.ctx.font = '16px Courier';
    this.ctx.fillText('Score: ' + this.gameState.score + ' | Wave: ' + this.gameState.wave + ' | Lives: ' + this.gameState.lives, this.canvas.width / 2, 50);
    
    const p = this.gameState.player;
    this.ctx.fillStyle = '#0f0';
    this.ctx.fillRect(p.x - 15, p.y - 10, 30, 20);
    this.ctx.fillRect(p.x - 5, p.y - 15, 10, 5);
    
    this.gameState.invaders.forEach(i => {
      if (!i.alive) return;
      const colors = ['#f00', '#0ff', '#ff0', '#f0f'];
      this.ctx.fillStyle = colors[i.type];
      this.ctx.fillRect(i.x, i.y, i.width, i.height);
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(i.x + 5, i.y + 8, 5, 5);
      this.ctx.fillRect(i.x + i.width - 10, i.y + 8, 5, 5);
    });
    
    this.ctx.fillStyle = '#ff0';
    this.gameState.bullets.forEach(b => {
      this.ctx.fillRect(b.x - 2, b.y - 5, 4, 10);
    });
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.SpaceInvadersGame = SpaceInvadersGame;