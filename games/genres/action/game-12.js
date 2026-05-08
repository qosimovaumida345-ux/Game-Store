// Metal Slug Style Run and Gun
class MetalSlugGame {
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
      bullets: [],
      enemies: [],
      vehicles: [],
      explosions: [],
      groundY: 500,
      scrollX: 0,
      levelLength: 5000,
      currentPhase: 0,
      status: 'fighting',
      gameOver: false,
      missionComplete: false,
      grenades: 3,
      heavyMachinegun: false,
      hmAmmo: 100,
      currentWeapon: 'rifle'
    };
    
    this.weapons = {
      rifle: { fireRate: 0.15, damage: 15, spread: 2 },
      heavy: { fireRate: 0.08, damage: 8, spread: 5 },
      rocket: { fireRate: 0.5, damage: 40, spread: 0, explosive: true }
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = {
      x: 100, y: 450,
      vx: 0, vy: 0,
      width: 30, height: 50,
      direction: 1,
      grounded: true,
      firing: false,
      firingTimer: 0,
      state: 'idle',
      animFrame: 0,
      invincible: 0,
      jumping: false,
      prone: false
    };
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
    if (this.gameState.gameOver || this.gameState.missionComplete) return;
    this.gameState.time += deltaTime;
    
    if (this.gameState.invincible > 0) this.gameState.invincible -= deltaTime;
    
    this.updatePlayer(deltaTime);
    this.updateBullets(deltaTime);
    this.updateEnemies(deltaTime);
    this.updateExplosions(deltaTime);
    this.updateScroll();
    this.spawnEnemies();
    
    if (this.gameState.scrollX >= this.gameState.levelLength) {
      this.gameState.missionComplete = true;
    }
  }
  
  updatePlayer(deltaTime) {
    const p = this.gameState.player;
    const input = this.getPlayerInput(this.players[0]);
    const weapon = this.weapons[this.gameState.currentWeapon];
    
    if (input.left) p.vx = -300;
    else if (input.right) p.vx = 300;
    else p.vx *= 0.8;
    
    if (input.jump && p.grounded && !p.jumping) {
      p.vy = -500;
      p.grounded = false;
      p.jumping = true;
    }
    
    if (input.prone) p.prone = true;
    else p.prone = false;
    
    if (input.grenade && this.gameState.grenades > 0) {
      this.throwGrenade();
    }
    
    if (input.shoot) {
      p.firing = true;
      p.firingTimer += deltaTime;
      
      if (p.firingTimer >= weapon.fireRate) {
        p.firingTimer = 0;
        this.fireBullet(p, weapon);
      }
    } else {
      p.firing = false;
      p.firingTimer = 0;
    }
    
    if (input.weapon) {
      this.gameState.currentWeapon = input.weapon;
    }
    
    p.vy += 1000 * deltaTime;
    
    p.x += p.vx * deltaTime;
    p.y += p.vy * deltaTime;
    
    if (p.y >= this.gameState.groundY) {
      p.y = this.gameState.groundY;
      p.vy = 0;
      p.grounded = true;
      p.jumping = false;
    }
    
    p.x = Math.max(50, Math.min(this.gameState.scrollX + 750, p.x));
    p.scrollX = p.x - this.gameState.scrollX;
    
    if (Math.abs(p.vx) > 50) p.state = 'running';
    else if (!p.grounded) p.state = 'jumping';
    else if (p.firing) p.state = 'firing';
    else p.state = 'idle';
    
    p.animFrame += deltaTime * 10;
  }
  
  fireBullet(player, weapon) {
    const dir = player.direction;
    const spread = (Math.random() - 0.5) * weapon.spread;
    
    this.gameState.bullets.push({
      x: player.x + dir * 20,
      y: player.y - (player.prone ? 15 : 30),
      vx: dir * 800 + spread * 10,
      vy: spread * 5,
      damage: weapon.damage,
      explosive: weapon.explosive || false,
      owner: 'player'
    });
  }
  
  throwGrenade() {
    this.gameState.grenades--;
    this.gameState.bullets.push({
      x: this.gameState.player.x,
      y: this.gameState.player.y - 30,
      vx: this.gameState.player.direction * 200,
      vy: -300,
      explosive: true,
      grenade: true,
      timer: 1.5,
      damage: 50,
      owner: 'player'
    });
  }
  
  updateBullets(deltaTime) {
    this.gameState.bullets = this.gameState.bullets.filter(b => {
      if (b.grenade) {
        b.timer -= deltaTime;
        b.vy += 300 * deltaTime;
        
        if (b.timer <= 0) {
          this.createExplosion(b.x, b.y, 80, b.damage);
          return false;
        }
      } else {
        b.x += b.vx * deltaTime;
        b.y += b.vy * deltaTime;
      }
      
      if (b.x < this.gameState.scrollX - 50 || b.x > this.gameState.scrollX + 850) return false;
      if (b.y < -50 || b.y > 600) return false;
      
      if (b.owner === 'player') {
        this.gameState.enemies.forEach((e, ei) => {
          if (e.x > this.gameState.scrollX && e.x < this.gameState.scrollX + 800) {
            const dx = b.x - e.x;
            const dy = b.y - (e.y - 20);
            if (Math.sqrt(dx*dx + dy*dy) < 30) {
              e.hp -= b.damage;
              if (b.explosive) this.createExplosion(b.x, b.y, 40, b.damage * 0.5);
              
              if (e.hp <= 0) {
                this.gameState.score += e.score || 100;
                this.createExplosion(e.x, e.y, 50, 0);
                this.gameState.enemies.splice(ei, 1);
              }
              return false;
            }
          }
        });
      }
      
      return true;
    });
  }
  
  createExplosion(x, y, size, damage) {
    this.gameState.explosions.push({
      x, y, size: 1, maxSize: size,
      timer: 0.5, damage: damage
    });
  }
  
  updateExplosions(deltaTime) {
    this.gameState.explosions.forEach((exp, i) => {
      exp.timer -= deltaTime;
      exp.size = exp.maxSize * (1 - exp.timer / 0.5);
      
      if (exp.timer <= 0) {
        this.gameState.explosions.splice(i, 1);
      }
    });
  }
  
  updateEnemies(deltaTime) {
    this.gameState.enemies.forEach(e => {
      if (e.type === 'soldier') {
        if (e.x < this.gameState.scrollX + 800 && e.x > this.gameState.scrollX) {
          e.x += e.vx * deltaTime;
          e.animFrame += deltaTime * 5;
          
          if (Math.random() < 0.02) {
            this.gameState.bullets.push({
              x: e.x, y: e.y - 25,
              vx: -300 - Math.random() * 100,
              vy: (Math.random() - 0.5) * 50,
              damage: 10,
              owner: 'enemy'
            });
          }
        }
        
        if (e.hp <= 0 || e.x < this.gameState.scrollX - 100) {
          this.gameState.enemies = this.gameState.enemies.filter(en => en !== e);
        }
      }
    });
  }
  
  spawnEnemies() {
    const spawnX = this.gameState.scrollX + 850;
    
    if (Math.random() < 0.03 && this.gameState.enemies.length < 10) {
      this.gameState.enemies.push({
        x: spawnX,
        y: this.gameState.groundY,
        vx: -50 - Math.random() * 50,
        hp: 30,
        type: 'soldier',
        state: 'walking',
        animFrame: 0,
        score: 100
      });
    }
    
    if (Math.random() < 0.01) {
      this.gameState.vehicles.push({
        x: spawnX,
        y: this.gameState.groundY - 10,
        vx: -80,
        hp: 100,
        type: 'tank',
        firing: false,
        fireTimer: 0
      });
    }
  }
  
  updateScroll() {
    this.gameState.scrollX = Math.max(0, this.gameState.player.x - 150);
    this.gameState.scrollX = Math.min(this.gameState.levelLength - 800, this.gameState.scrollX);
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, 600);
    skyGrad.addColorStop(0, '#ff6b6b');
    skyGrad.addColorStop(0.3, '#feca57');
    skyGrad.addColorStop(0.6, '#48dbfb');
    skyGrad.addColorStop(1, '#1a1a2e');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, 800, 600);
    
    this.ctx.fillStyle = '#4a4a4a';
    this.ctx.fillRect(0, this.gameState.groundY, 800, 100);
    this.ctx.fillStyle = '#3a3a3a';
    this.ctx.fillRect(0, this.gameState.groundY, 800, 10);
    
    this.gameState.enemies.forEach(e => {
      if (e.x - this.gameState.scrollX > -50 && e.x - this.gameState.scrollX < 850) {
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.fillRect(e.x - this.gameState.scrollX - 15, e.y - 50, 30, 50);
        this.ctx.fillStyle = '#27ae60';
        this.ctx.fillRect(e.x - this.gameState.scrollX - 15, e.y - 50, 30, 20);
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(e.x - this.gameState.scrollX - 5, e.y - 45, 5, 5);
        this.ctx.fillRect(e.x - this.gameState.scrollX + 5, e.y - 45, 5, 5);
      }
    });
    
    this.gameState.bullets.forEach(b => {
      if (b.explosive) {
        this.ctx.fillStyle = '#2c3e50';
      } else if (b.owner === 'player') {
        this.ctx.fillStyle = '#f1c40f';
      } else {
        this.ctx.fillStyle = '#e74c3c';
      }
      
      this.ctx.beginPath();
      this.ctx.arc(b.x - this.gameState.scrollX, b.y, 5, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    this.gameState.explosions.forEach(exp => {
      const gradient = this.ctx.createRadialGradient(exp.x - this.gameState.scrollX, exp.y, 0, exp.x - this.gameState.scrollX, exp.y, exp.size);
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(0.3, '#f1c40f');
      gradient.addColorStop(0.6, '#e74c3c');
      gradient.addColorStop(1, 'rgba(231, 76, 60, 0)');
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(exp.x - this.gameState.scrollX, exp.y, exp.size, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    const p = this.gameState.player;
    if (this.gameState.invincible <= 0 || Math.floor(this.gameState.time * 10) % 2 === 0) {
      const px = p.x - this.gameState.scrollX;
      
      this.ctx.fillStyle = '#3498db';
      if (p.prone) {
        this.ctx.fillRect(px - 20, p.y - 15, 40, 20);
      } else {
        this.ctx.fillRect(px - 15, p.y - 50, 30, 50);
        this.ctx.fillStyle = '#f5d0c5';
        this.ctx.beginPath();
        this.ctx.arc(px, p.y - 55, 12, 0, Math.PI*2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(px - 5, p.y - 58, 4, 4);
        this.ctx.fillRect(px + 3, p.y - 58, 4, 4);
      }
      
      if (p.firing) {
        this.ctx.fillStyle = '#8b4513';
        this.ctx.fillRect(px + p.direction * 10, p.y - (p.prone ? 15 : 35), 25, 8);
      }
    }
    
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(20, 550, 200, 20);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(20, 550, 200 * (this.gameState.health/100), 20);
    this.ctx.strokeStyle = '#fff';
    this.ctx.strokeRect(20, 550, 200, 20);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('SCORE: ' + this.gameState.score, 20, 30);
    this.ctx.fillText('HP', 20, 545);
    this.ctx.fillText('GRENADES: ' + this.gameState.grenades, 250, 30);
    this.ctx.fillText('WEAPON: ' + this.gameState.currentWeapon.toUpperCase(), 250, 55);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('METAL SLUG', 400, 25);
    
    if (this.gameState.missionComplete) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, 800, 600);
      this.ctx.fillStyle = '#2ecc71';
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillText('MISSION COMPLETE!', 400, 300);
      this.ctx.font = '24px Arial';
      this.ctx.fillText('Final Score: ' + this.gameState.score, 400, 350);
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.MetalSlugGame = MetalSlugGame;