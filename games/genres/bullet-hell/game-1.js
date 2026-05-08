// Bullet Hell - Danmaku Game
class BulletHellGame {
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
      player: null,
      bullets: [],
      enemies: [],
      boss: null
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 600;
    this.canvas.height = this.canvas.parentElement.clientHeight || 800;
  }
  
  initGame() {
    this.gameState.player = {
      x: 300,
      y: 700,
      hitbox: 5,
      health: 5,
      invincible: 0,
      speed: 5
    };
  }
  
  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.spawnBoss();
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
  
  spawnBoss() {
    this.gameState.boss = {
      x: 300,
      y: 100,
      health: 500,
      maxHealth: 500,
      phase: 1,
      timer: 0,
      angle: 0
    };
  }
  
  update(deltaTime) {
    this.gameState.time += deltaTime;
    
    const input = this.getPlayerInput();
    const p = this.gameState.player;
    
    if (p.invincible > 0) p.invincible -= deltaTime;
    
    if (input.left) p.x = Math.max(20, p.x - p.speed);
    if (input.right) p.x = Math.min(this.canvas.width - 20, p.x + p.speed);
    if (input.up) p.y = Math.max(20, p.y - p.speed);
    if (input.down) p.y = Math.min(this.canvas.height - 20, p.y + p.speed);
    
    // Boss patterns
    const boss = this.gameState.boss;
    if (boss) {
      boss.timer += deltaTime;
      boss.angle += deltaTime * 2;
      
      if (boss.phase === 1) {
        // Spiral pattern
        if (boss.timer > 0.1) {
          for (let i = 0; i < 3; i++) {
            const angle = boss.angle + i * (Math.PI * 2 / 3);
            this.gameState.bullets.push({
              x: boss.x,
              y: boss.y,
              vx: Math.cos(angle) * 4,
              vy: Math.sin(angle) * 4,
              color: '#ff0000',
              type: 'enemy'
            });
          }
          boss.timer = 0;
        }
        
        if (boss.health < 400) {
          boss.phase = 2;
          boss.health = 500;
        }
      } else if (boss.phase === 2) {
        // Burst pattern
        if (boss.timer > 0.3) {
          for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            this.gameState.bullets.push({
              x: boss.x,
              y: boss.y,
              vx: Math.cos(angle) * 3,
              vy: Math.sin(angle) * 3,
              color: '#ff6600',
              type: 'enemy'
            });
          }
          boss.timer = 0;
        }
        
        // Move towards player
        if (boss.y < 150) boss.y += 0.5;
        
        if (boss.health < 100) {
          boss.phase = 3;
        }
      } else {
        // Chaos mode
        if (boss.timer > 0.05) {
          const angle = Math.random() * Math.PI * 2;
          this.gameState.bullets.push({
            x: boss.x,
            y: boss.y,
            vx: Math.cos(angle) * 5,
            vy: Math.sin(angle) * 5,
            color: '#ff00ff',
            type: 'enemy'
          });
          boss.timer = 0;
        }
      }
    }
    
    // Update bullets
    this.gameState.bullets.forEach((b, i) => {
      b.x += b.vx;
      b.y += b.vy;
      
      if (b.x < -10 || b.x > this.canvas.width + 10 || 
          b.y < -10 || b.y > this.canvas.height + 10) {
        this.gameState.bullets.splice(i, 1);
      }
      
      // Player bullets hit boss
      if (b.type === 'player' && boss) {
        const dx = b.x - boss.x;
        const dy = b.y - boss.y;
        if (Math.sqrt(dx*dx + dy*dy) < 40) {
          boss.health--;
          this.gameState.bullets.splice(i, 1);
          this.gameState.score += 10;
          
          if (boss.health <= 0) {
            this.gameState.score += 10000;
            boss = null;
          }
        }
      }
      
      // Enemy bullets hit player
      if (b.type === 'enemy' && p.invincible <= 0) {
        const dx = b.x - p.x;
        const dy = b.y - p.y;
        if (Math.sqrt(dx*dx + dy*dy) < p.hitbox + 5) {
          p.health--;
          p.invincible = 1;
          this.gameState.bullets.splice(i, 1);
        }
      }
    });
    
    if (p.health <= 0) {
      this.gameState.status = 'gameover';
    }
  }
  
  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#0a0a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Stars
    this.ctx.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) {
      const x = (i * 137 + this.gameState.time * 20) % this.canvas.width;
      const y = (i * 97) % this.canvas.height;
      this.ctx.fillRect(x, y, 2, 2);
    }
    
    // Boss
    const boss = this.gameState.boss;
    if (boss) {
      this.ctx.fillStyle = boss.phase === 3 ? '#ff00ff' : boss.phase === 2 ? '#ff6600' : '#ff0000';
      this.ctx.beginPath();
      this.ctx.arc(boss.x, boss.y, 40, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.beginPath();
      this.ctx.arc(boss.x - 15, boss.y - 10, 10, 0, Math.PI * 2);
      this.ctx.arc(boss.x + 15, boss.y - 10, 10, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Health bar
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(100, 30, 400, 15);
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fillRect(100, 30, 400 * (boss.health / boss.maxHealth), 15);
    }
    
    // Bullets
    this.gameState.bullets.forEach(b => {
      this.ctx.fillStyle = b.color;
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    // Player
    const p = this.gameState.player;
    if (p.invincible > 0 && Math.floor(this.gameState.time * 10) % 2 === 0) {
    } else {
      this.ctx.fillStyle = '#00ffff';
      this.ctx.beginPath();
      this.ctx.moveTo(p.x, p.y - 15);
      this.ctx.lineTo(p.x - 12, p.y + 10);
      this.ctx.lineTo(p.x + 12, p.y + 10);
      this.ctx.fill();
      
      // Hitbox
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.hitbox, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    
    // UI
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 120, 60);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    this.ctx.fillText(`HP: ${p.health}`, 20, 50);
    this.ctx.fillText(`Wave: ${boss ? boss.phase : 'WIN'}`, 20, 70);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.BulletHellGame = BulletHellGame;