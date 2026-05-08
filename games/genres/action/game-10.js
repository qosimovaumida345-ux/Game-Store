// Zombie Survival Game
class ZombieSurvivalGame {
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
      health: 100,
      player: null,
      zombies: [],
      bullets: [],
      healthPacks: [],
      status: 'surviving',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = { x: 400, y: 500, angle: -Math.PI/2, health: 100 };
    for (let i = 0; i < 5; i++) {
      this.spawnZombie();
    }
  }
  
  spawnZombie() {
    this.gameState.zombies.push({
      x: Math.random() * 800,
      y: Math.random() < 0.5 ? -50 : 650,
      speed: 1 + Math.random() * 1.5,
      hp: 3
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
    
    if (this.gameState.zombies.length < 10 && Math.random() < 0.02) {
      this.spawnZombie();
    }
    
    const input = this.getPlayerInput(this.players[0]);
    const p = this.gameState.player;
    
    if (input.up) p.y = Math.max(30, p.y - 4);
    if (input.down) p.y = Math.min(570, p.y + 4);
    if (input.left) p.x = Math.max(30, p.x - 4);
    if (input.right) p.x = Math.min(770, p.x + 4);
    
    if (input.action && Math.random() < 0.2) {
      this.gameState.bullets.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(p.angle) * 10,
        vy: Math.sin(p.angle) * 10
      });
    }
    
    if (input.angle !== undefined) {
      p.angle = input.angle;
    }
    
    this.gameState.bullets.forEach((b, bi) => {
      b.x += b.vx;
      b.y += b.vy;
      if (b.x < 0 || b.x > 800 || b.y < 0 || b.y > 600) {
        this.gameState.bullets.splice(bi, 1);
      }
    });
    
    this.gameState.zombies.forEach((z, zi) => {
      const dx = p.x - z.x;
      const dy = p.y - z.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      z.x += (dx/dist) * z.speed;
      z.y += (dy/dist) * z.speed;
      
      if (dist < 30) {
        p.health -= deltaTime * 20;
      }
      
      this.gameState.bullets.forEach((b, bi) => {
        const bdx = b.x - z.x;
        const bdy = b.y - z.y;
        if (Math.sqrt(bdx*bdx + bdy*bdy) < 20) {
          z.hp--;
          this.gameState.bullets.splice(bi, 1);
          if (z.hp <= 0) {
            this.gameState.zombies.splice(zi, 1);
            this.gameState.score += 50;
          }
        }
      });
    });
    
    if (p.health <= 0) this.gameState.gameOver = true;
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, 800, 600);
    
    this.ctx.fillStyle = '#4a4a4a';
    for (let i = 0; i < 800; i += 40) {
      for (let j = 0; j < 600; j += 40) {
        this.ctx.strokeRect(i, j, 40, 40);
      }
    }
    
    this.gameState.zombies.forEach(z => {
      this.ctx.fillStyle = '#27ae60';
      this.ctx.beginPath();
      this.ctx.arc(z.x, z.y, 20, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.fillStyle = '#c0392b';
      this.ctx.beginPath();
      this.ctx.arc(z.x, z.y - 10, 15, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(z.x - 8, z.y - 12, 5, 5);
      this.ctx.fillRect(z.x + 3, z.y - 12, 5, 5);
    });
    
    this.ctx.fillStyle = '#f1c40f';
    this.gameState.bullets.forEach(b => {
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, 5, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    const p = this.gameState.player;
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.angle + Math.PI/2);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(-15, -15, 30, 30);
    this.ctx.fillStyle = '#f5d0c5';
    this.ctx.beginPath();
    this.ctx.arc(0, -10, 12, 0, Math.PI*2);
    this.ctx.fill();
    this.ctx.restore();
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(20, 550, 200, 20);
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(20, 550, 200 * (p.health/100), 20);
    this.ctx.strokeStyle = '#fff';
    this.ctx.strokeRect(20, 550, 200, 20);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Score: ' + this.gameState.score + ' | Zombies: ' + this.gameState.zombies.length, 20, 30);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillText('ZOMBIE SURVIVAL', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.ZombieSurvivalGame = ZombieSurvivalGame;