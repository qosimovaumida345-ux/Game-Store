// Ninja Gaiden Style - Action Game
class NinjaActionGame {
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
      wave: 1,
      status: 'playing',
      ninja: null,
      enemies: [],
      shurikens: [],
      platforms: [],
      particles: []
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.ninja = {
      name: this.players[0] || 'Ninja',
      x: 100,
      y: 400,
      vx: 0,
      vy: 0,
      width: 40,
      height: 60,
      speed: 6,
      jumpForce: -15,
      gravity: 0.6,
      onGround: true,
      facing: 1,
      state: 'idle',
      health: 100,
      attackCooldown: 0,
      canDoubleJump: true
    };
    
    this.gameState.platforms = [
      { x: 0, y: 500, width: 800, height: 100 },
      { x: 150, y: 400, width: 150, height: 20 },
      { x: 400, y: 350, width: 150, height: 20 },
      { x: 600, y: 280, width: 150, height: 20 },
      { x: 100, y: 220, width: 120, height: 20 },
      { x: 350, y: 180, width: 100, height: 20 }
    ];
    
    this.spawnEnemies();
  }
  
  spawnEnemies() {
    const count = 3 + this.gameState.wave;
    this.gameState.enemies = [];
    
    for (let i = 0; i < count; i++) {
      this.gameState.enemies.push({
        x: 500 + Math.random() * 250,
        y: 450,
        width: 40,
        height: 50,
        vx: 0,
        health: 3,
        type: ['samurai', 'soldier', 'boss'][Math.floor(Math.random() * 3)]
      });
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
    this.gameState.time += deltaTime;
    
    const ninja = this.gameState.ninja;
    const input = this.getPlayerInput();
    
    ninja.vx = 0;
    if (input.left) { ninja.vx = -ninja.speed; ninja.facing = -1; }
    if (input.right) { ninja.vx = ninja.speed; ninja.facing = 1; }
    
    if (input.up && ninja.onGround) {
      ninja.vy = ninja.jumpForce;
      ninja.onGround = false;
    } else if (input.up && ninja.canDoubleJump && ninja.vy > 0) {
      ninja.vy = ninja.jumpForce * 0.8;
      ninja.canDoubleJump = false;
      this.createJumpEffect();
    }
    
    ninja.vy += ninja.gravity;
    ninja.x += ninja.vx;
    ninja.y += ninja.vy;
    
    ninja.onGround = false;
    this.gameState.platforms.forEach(p => {
      if (ninja.x < p.x + p.width && ninja.x + ninja.width > p.x &&
          ninja.y + ninja.height > p.y && ninja.y + ninja.height < p.y + 20 &&
          ninja.vy > 0) {
        ninja.y = p.y - ninja.height;
        ninja.vy = 0;
        ninja.onGround = true;
        ninja.canDoubleJump = true;
      }
    });
    
    ninja.x = Math.max(0, Math.min(this.canvas.width - ninja.width, ninja.x));
    
    if (ninja.y > this.canvas.height) {
      ninja.y = 400;
      ninja.health -= 20;
    }
    
    if (ninja.attackCooldown > 0) ninja.attackCooldown -= deltaTime;
    
    if (input.action && ninja.attackCooldown <= 0) {
      this.attack();
      ninja.attackCooldown = 0.3;
    }
    
    // Shurikens
    this.gameState.shurikens.forEach((s, i) => {
      s.x += s.vx;
      s.y += s.vy;
      
      if (s.x < 0 || s.x > this.canvas.width) {
        this.gameState.shurikens.splice(i, 1);
      }
      
      this.gameState.enemies.forEach(e => {
        if (s.x < e.x + e.width && s.x + 15 > e.x &&
            s.y < e.y + e.height && s.y + 15 > e.y) {
          e.health--;
          this.gameState.shurikens.splice(i, 1);
          this.createHitEffect(e.x + e.width/2, e.y + e.height/2);
          
          if (e.health <= 0) {
            this.gameState.score += 100;
          }
        }
      });
    });
    
    // Enemies
    this.gameState.enemies.forEach(e => {
      const dx = ninja.x - e.x;
      const dist = Math.abs(dx);
      
      if (dist > 50) {
        e.x += dx > 0 ? 2 : -2;
      }
      
      if (dist < 40 && !ninja.invincible) {
        ninja.health -= 10;
      }
    });
    
    this.gameState.enemies = this.gameState.enemies.filter(e => e.health > 0);
    
    if (this.gameState.enemies.length === 0) {
      this.gameState.wave++;
      this.spawnEnemies();
      this.gameState.ninja.health = Math.min(100, this.gameState.ninja.health + 20);
    }
    
    this.gameState.particles = this.gameState.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime;
      return p.life > 0;
    });
    
    if (ninja.health <= 0) {
      this.gameState.status = 'gameover';
    }
  }
  
  attack() {
    const ninja = this.gameState.ninja;
    this.gameState.shurikens.push({
      x: ninja.x + ninja.width / 2,
      y: ninja.y + ninja.height / 2,
      vx: ninja.facing * 15,
      vy: 0
    });
    
    this.gameState.enemies.forEach(e => {
      const dx = e.x - (ninja.x + ninja.width/2);
      const dy = e.y - (ninja.y + ninja.height/2);
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < 80 && Math.abs(dy) < 30) {
        e.health -= 2;
        this.createHitEffect(e.x + e.width/2, e.y + e.height/2);
        this.gameState.score += 50;
      }
    });
  }
  
  createJumpEffect() {
    for (let i = 0; i < 10; i++) {
      this.gameState.particles.push({
        x: this.gameState.ninja.x + 20,
        y: this.gameState.ninja.y + 60,
        vx: (Math.random() - 0.5) * 5,
        vy: Math.random() * 3,
        life: 0.5,
        color: '#fff'
      });
    }
  }
  
  createHitEffect(x, y) {
    for (let i = 0; i < 8; i++) {
      this.gameState.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 0.3,
        color: '#ff0000'
      });
    }
  }
  
  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Moon
    this.ctx.fillStyle = '#f5f5dc';
    this.ctx.beginPath();
    this.ctx.arc(700, 80, 50, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Background buildings
    this.ctx.fillStyle = '#0a0a15';
    for (let i = 0; i < 10; i++) {
      const h = 100 + Math.random() * 200;
      this.ctx.fillRect(i * 90, this.canvas.height - h, 70, h);
    }
    
    // Platforms
    this.gameState.platforms.forEach(p => {
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(p.x, p.y, p.width, p.height);
    });
    
    // Ninja
    const n = this.gameState.ninja;
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(n.x, n.y, n.width, n.height);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(n.x + 5, n.y + 10, 30, 8);
    
    // Head band
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(n.x - 5, n.y + 5, n.width + 10, 5);
    if (n.facing < 0) {
      this.ctx.fillRect(n.x - 20, n.y + 5, 15, 5);
    } else {
      this.ctx.fillRect(n.x + n.width + 5, n.y + 5, 15, 5);
    }
    
    // Shurikens
    this.ctx.fillStyle = '#ccc';
    this.gameState.shurikens.forEach(s => {
      this.ctx.save();
      this.ctx.translate(s.x, s.y);
      this.ctx.rotate(this.gameState.time * 10);
      this.ctx.beginPath();
      this.ctx.moveTo(0, -10);
      this.ctx.lineTo(5, 0);
      this.ctx.lineTo(0, 10);
      this.ctx.lineTo(-5, 0);
      this.ctx.fill();
      this.ctx.restore();
    });
    
    // Enemies
    this.gameState.enemies.forEach(e => {
      this.ctx.fillStyle = '#8B0000';
      this.ctx.fillRect(e.x, e.y, e.width, e.height);
      this.ctx.fillStyle = '#fff';
      this.ctx.fillRect(e.x + 10, e.y + 10, 8, 8);
      this.ctx.fillRect(e.x + 22, e.y + 10, 8, 8);
    });
    
    // Particles
    this.gameState.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life;
      this.ctx.fillRect(p.x, p.y, 5, 5);
    });
    this.ctx.globalAlpha = 1;
    
    // UI
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 150, 60);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Wave: ${this.gameState.wave}`, 20, 30);
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 50);
    
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fillRect(10, this.canvas.height - 30, 180, 15);
    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillRect(10, this.canvas.height - 30, 180 * (n.health / 100), 15);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.NinjaActionGame = NinjaActionGame;