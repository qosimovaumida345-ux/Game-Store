// Mega Man Style Shooter
class MegaManGame {
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
      enemyBullets: [],
      enemies: [],
      platforms: [],
      boss: null,
      bossHealth: 200,
      charging: false,
      chargeLevel: 0,
      canShoot: true,
      shootCooldown: 0,
      direction: 1,
      invulnerable: 0,
      status: 'fighting',
      gameOver: false
    };
    
    this.physics = {
      gravity: 1500,
      jumpForce: 550,
      moveSpeed: 280,
      bulletSpeed: 600,
      enemyBulletSpeed: 250
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = { 
      x: 80, y: 450, 
      width: 28, height: 36, 
      vx: 0, vy: 0,
      grounded: false,
      state: 'idle'
    };
    
    this.gameState.platforms = [
      { x: 0, y: 520, width: 200, height: 30 },
      { x: 250, y: 480, width: 80, height: 20 },
      { x: 380, y: 420, width: 80, height: 20 },
      { x: 280, y: 350, width: 80, height: 20 },
      { x: 150, y: 280, width: 100, height: 20 },
      { x: 350, y: 220, width: 100, height: 20 },
      { x: 500, y: 300, width: 80, height: 20 },
      { x: 550, y: 180, width: 150, height: 25 }
    ];
    
    this.gameState.enemies = [
      { x: 300, y: 480, type: 'met', hp: 3, state: 'shielded', timer: 0 },
      { x: 450, y: 400, type: 'met', hp: 3, state: 'shielded', timer: 0 },
      { x: 500, y: 280, type: 'teleport', hp: 5, teleporting: false, teleportTimer: 0 },
      { x: 600, y: 150, type: 'sniper', hp: 4, shooting: false, shootTimer: 0 }
    ];
    
    this.gameState.boss = {
      x: 650,
      y: 120,
      width: 60,
      height: 60,
      vx: 0,
      vy: 0,
      phase: 1,
      attackTimer: 0,
      state: 'idle'
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
    if (this.gameState.gameOver) return;
    this.gameState.time += deltaTime;
    
    if (this.gameState.invulnerable > 0) this.gameState.invulnerable -= deltaTime;
    if (this.gameState.shootCooldown > 0) this.gameState.shootCooldown -= deltaTime;
    
    this.updatePlayer(deltaTime);
    this.updateBullets(deltaTime);
    this.updateEnemies(deltaTime);
    this.updateBoss(deltaTime);
    this.checkCollisions();
  }
  
  updatePlayer(deltaTime) {
    const p = this.gameState.player;
    const input = this.getPlayerInput(this.players[0]);
    
    if (input.left) {
      p.vx = -this.physics.moveSpeed;
      this.gameState.direction = -1;
    } else if (input.right) {
      p.vx = this.physics.moveSpeed;
      this.gameState.direction = 1;
    } else {
      p.vx = 0;
    }
    
    if (input.jump && p.grounded) {
      p.vy = -this.physics.jumpForce;
      p.grounded = false;
    }
    
    p.vy += this.physics.gravity * deltaTime;
    
    p.x += p.vx * deltaTime;
    this.handleHorizontalCollisions(p);
    
    p.y += p.vy * deltaTime;
    p.grounded = false;
    this.handleVerticalCollisions(p);
    
    p.x = Math.max(10, Math.min(790 - p.width, p.x));
    
    if (input.shoot && this.gameState.canShoot && this.gameState.shootCooldown <= 0) {
      const bulletSpeed = this.gameState.charging ? this.physics.bulletSpeed * (1 + this.gameState.chargeLevel) : this.physics.bulletSpeed;
      this.gameState.bullets.push({
        x: p.x + (this.gameState.direction > 0 ? p.width : 0),
        y: p.y + 15,
        vx: this.gameState.direction * bulletSpeed,
        damage: this.gameState.charging ? 3 + this.gameState.chargeLevel : 2,
        charged: this.gameState.charging,
        size: this.gameState.charging ? 15 + this.gameState.chargeLevel * 5 : 8
      });
      this.gameState.shootCooldown = this.gameState.charging ? 0.3 : 0.15;
      this.gameState.charging = false;
      this.gameState.chargeLevel = 0;
    }
    
    if (input.charge) {
      this.gameState.charging = true;
      this.gameState.chargeLevel = Math.min(5, this.gameState.chargeLevel + deltaTime * 3);
    } else if (!input.shoot) {
      this.gameState.charging = false;
      this.gameState.chargeLevel = 0;
    }
    
    p.state = p.vx !== 0 ? 'running' : (p.grounded ? 'idle' : 'jumping');
  }
  
  handleHorizontalCollisions(p) {
    this.gameState.platforms.forEach(plat => {
      if (this.checkCollision(p, plat)) {
        if (p.vx > 0) p.x = plat.x - p.width;
        else if (p.vx < 0) p.x = plat.x + plat.width;
        p.vx = 0;
      }
    });
  }
  
  handleVerticalCollisions(p) {
    this.gameState.platforms.forEach(plat => {
      if (this.checkCollision(p, plat)) {
        if (p.vy > 0) {
          p.y = plat.y - p.height;
          p.grounded = true;
          p.vy = 0;
        } else if (p.vy < 0) {
          p.y = plat.y + plat.height;
          p.vy = 0;
        }
      }
    });
  }
  
  checkCollision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }
  
  updateBullets(deltaTime) {
    this.gameState.bullets = this.gameState.bullets.filter(b => {
      b.x += b.vx * deltaTime;
      return b.x > -20 && b.x < 820;
    });
    
    this.gameState.enemyBullets = this.gameState.enemyBullets.filter(eb => {
      eb.x += eb.vx * deltaTime;
      eb.y += eb.vy * deltaTime;
      return eb.x > -20 && eb.x < 820 && eb.y > -20 && eb.y < 620;
    });
  }
  
  updateEnemies(deltaTime) {
    const p = this.gameState.player;
    
    this.gameState.enemies.forEach((e, ei) => {
      if (e.type === 'met') {
        e.timer += deltaTime;
        if (e.timer > 2) {
          e.state = e.state === 'shielded' ? 'exposed' : 'shielded';
          e.timer = 0;
        }
        
        if (e.state === 'exposed' && Math.random() < 0.02) {
          const angle = Math.atan2(p.y - e.y, p.x - e.x);
          this.gameState.enemyBullets.push({
            x: e.x + 15, y: e.y + 15,
            vx: Math.cos(angle) * this.physics.enemyBulletSpeed,
            vy: Math.sin(angle) * this.physics.enemyBulletSpeed
          });
        }
        
        if (e.hp <= 0) {
          this.gameState.score += 200;
          this.gameState.enemies.splice(ei, 1);
        }
      }
      
      if (e.type === 'teleport') {
        e.teleportTimer += deltaTime;
        if (e.teleportTimer > 3) {
          e.teleporting = true;
          e.x = 100 + Math.random() * 600;
          e.y = 100 + Math.random() * 400;
          e.teleportTimer = 0;
          e.teleporting = false;
        }
        
        if (!e.teleporting && Math.random() < 0.03) {
          this.gameState.enemyBullets.push({
            x: e.x, y: e.y + 15,
            vx: this.gameState.direction * 200,
            vy: Math.random() * 100 - 50
          });
        }
        
        if (e.hp <= 0) {
          this.gameState.score += 300;
          this.gameState.enemies.splice(ei, 1);
        }
      }
      
      if (e.type === 'sniper') {
        e.shootTimer += deltaTime;
        if (e.shootTimer > 1.5) {
          const angle = Math.atan2(p.y - e.y, p.x - e.x);
          for (let i = 0; i < 3; i++) {
            setTimeout(() => {
              this.gameState.enemyBullets.push({
                x: e.x + 15, y: e.y + 15,
                vx: Math.cos(angle) * this.physics.enemyBulletSpeed,
                vy: Math.sin(angle) * this.physics.enemyBulletSpeed
              });
            }, i * 200);
          }
          e.shootTimer = 0;
        }
        
        if (e.hp <= 0) {
          this.gameState.score += 400;
          this.gameState.enemies.splice(ei, 1);
        }
      }
    });
  }
  
  updateBoss(deltaTime) {
    const boss = this.gameState.boss;
    const p = this.gameState.player;
    
    boss.attackTimer += deltaTime;
    
    if (boss.phase === 1 && boss.attackTimer > 2) {
      const rand = Math.random();
      if (rand < 0.4) {
        for (let i = 0; i < 5; i++) {
          this.gameState.enemyBullets.push({
            x: boss.x + boss.width/2,
            y: boss.y + boss.height/2,
            vx: Math.cos(i * Math.PI/2) * 200,
            vy: Math.sin(i * Math.PI/2) * 200
          });
        }
      } else if (rand < 0.7) {
        const angle = Math.atan2(p.y - boss.y, p.x - boss.x);
        for (let i = 0; i < 3; i++) {
          this.gameState.enemyBullets.push({
            x: boss.x + boss.width/2,
            y: boss.y + boss.height/2,
            vx: Math.cos(angle + (i-1)*0.3) * 300,
            vy: Math.sin(angle + (i-1)*0.3) * 300
          });
        }
      } else {
        boss.vx = (p.x > boss.x ? 1 : -1) * 200;
        boss.vy = (p.y > boss.y ? 1 : -1) * 150;
      }
      boss.attackTimer = 0;
    }
    
    boss.x += boss.vx * deltaTime;
    boss.y += boss.vy * deltaTime;
    boss.x = Math.max(500, Math.min(780, boss.x));
    boss.y = Math.max(50, Math.min(500, boss.y));
    boss.vx *= 0.95;
    boss.vy *= 0.95;
  }
  
  checkCollisions() {
    const p = this.gameState.player;
    
    this.gameState.bullets.forEach((b, bi) => {
      this.gameState.enemies.forEach(e => {
        if (this.checkCollision({ x: b.x - b.size/2, y: b.y - b.size/2, width: b.size, height: b.size }, { x: e.x, y: e.y, width: 30, height: 30 })) {
          e.hp -= b.damage;
          this.gameState.bullets.splice(bi, 1);
          this.gameState.score += b.charged ? 50 : 10;
        }
      });
      
      const boss = this.gameState.boss;
      if (this.checkCollision({ x: b.x - b.size/2, y: b.y - b.size/2, width: b.size, height: b.size }, boss)) {
        this.gameState.bossHealth -= b.damage;
        this.gameState.bullets.splice(bi, 1);
        this.gameState.score += b.charged ? 30 : 10;
        
        if (this.gameState.bossHealth <= 0) {
          this.gameState.score += 5000;
          this.gameState.gameOver = true;
        }
      }
    });
    
    if (this.gameState.invulnerable <= 0) {
      this.gameState.enemyBullets.forEach(eb => {
        if (this.checkCollision({ x: eb.x - 5, y: eb.y - 5, width: 10, height: 10 }, p)) {
          this.gameState.health -= 15;
          this.gameState.invulnerable = 1;
          if (this.gameState.health <= 0) this.gameState.gameOver = true;
        }
      });
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#0a1628';
    this.ctx.fillRect(0, 0, 800, 600);
    
    const bgGradient = this.ctx.createLinearGradient(0, 0, 0, 600);
    bgGradient.addColorStop(0, '#1a2a4a');
    bgGradient.addColorStop(1, '#0a1628');
    this.ctx.fillStyle = bgGradient;
    this.ctx.fillRect(0, 0, 800, 600);
    
    for (let i = 0; i < 20; i++) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.random() * 0.3})`;
      this.ctx.beginPath();
      this.ctx.arc(Math.random() * 800, Math.random() * 300, Math.random() * 2 + 1, 0, Math.PI*2);
      this.ctx.fill();
    }
    
    this.ctx.fillStyle = '#2980b9';
    this.gameState.platforms.forEach(plat => {
      this.ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
      this.ctx.strokeStyle = '#3498db';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
    });
    
    this.gameState.enemies.forEach(e => {
      if (e.type === 'met') {
        this.ctx.fillStyle = e.state === 'shielded' ? '#7f8c8d' : '#e74c3c';
        this.ctx.fillRect(e.x, e.y, 30, 30);
        if (e.state === 'exposed') {
          this.ctx.fillStyle = '#f1c40f';
          this.ctx.beginPath();
          this.ctx.arc(e.x + 15, e.y + 15, 10, 0, Math.PI*2);
          this.ctx.fill();
        }
      } else if (e.type === 'teleport') {
        this.ctx.fillStyle = e.teleporting ? 'rgba(142, 68, 173, 0.3)' : '#9b59b6';
        this.ctx.beginPath();
        this.ctx.arc(e.x + 15, e.y + 15, 15, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.fillStyle = '#8e44ad';
        this.ctx.beginPath();
        this.ctx.arc(e.x + 15, e.y + 15, 8, 0, Math.PI*2);
        this.ctx.fill();
      } else if (e.type === 'sniper') {
        this.ctx.fillStyle = '#e67e22';
        this.ctx.fillRect(e.x, e.y, 30, 30);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(e.x + 5, e.y + 10, 20, 5);
        this.ctx.fillRect(e.x + 10, e.y + 5, 10, 5);
      }
    });
    
    const boss = this.gameState.boss;
    this.ctx.fillStyle = '#c0392b';
    this.ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(boss.x + 10, boss.y + 10, boss.width - 20, boss.height - 20);
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.beginPath();
    this.ctx.arc(boss.x + 20, boss.y + 25, 8, 0, Math.PI*2);
    this.ctx.arc(boss.x + 40, boss.y + 25, 8, 0, Math.PI*2);
    this.ctx.fill();
    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(boss.x + 20, boss.y + 25, 3, 0, Math.PI*2);
    this.ctx.arc(boss.x + 40, boss.y + 25, 3, 0, Math.PI*2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#f1c40f';
    this.gameState.bullets.forEach(b => {
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.size, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    this.ctx.fillStyle = '#e74c3c';
    this.gameState.enemyBullets.forEach(eb => {
      this.ctx.beginPath();
      this.ctx.arc(eb.x, eb.y, 6, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    const p = this.gameState.player;
    if (this.gameState.invulnerable <= 0 || Math.floor(this.gameState.time * 10) % 2 === 0) {
      this.ctx.fillStyle = '#3498db';
      this.ctx.fillRect(p.x, p.y, p.width, p.height);
      this.ctx.fillStyle = '#2980b9';
      this.ctx.fillRect(p.x, p.y + 20, p.width, 16);
      this.ctx.fillStyle = '#f5d0c5';
      this.ctx.fillRect(p.x + 5, p.y + 5, 18, 12);
      
      const eyeX = this.gameState.direction > 0 ? p.x + 16 : p.x + 8;
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(eyeX, p.y + 8, 4, 4);
      
      if (this.gameState.charging) {
        this.ctx.strokeStyle = '#f1c40f';
        this.ctx.lineWidth = 2 + this.gameState.chargeLevel;
        this.ctx.beginPath();
        this.ctx.arc(p.x + p.width/2, p.y + p.height/2, 20 + this.gameState.chargeLevel * 5, 0, Math.PI*2);
        this.ctx.stroke();
      }
    }
    
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(20, 550, 200, 20);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(20, 550, 200 * (this.gameState.health/100), 20);
    this.ctx.strokeStyle = '#fff';
    this.ctx.strokeRect(20, 550, 200, 20);
    
    if (this.gameState.bossHealth > 0) {
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(500, 20, 280, 20);
      this.ctx.fillStyle = '#2ecc71';
      this.ctx.fillRect(500, 20, 280 * (this.gameState.bossHealth/200), 20);
      this.ctx.strokeStyle = '#fff';
      this.ctx.strokeRect(500, 20, 280, 20);
    }
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('HP', 20, 545);
    this.ctx.fillText('Score: ' + this.gameState.score, 20, 30);
    this.ctx.fillText('BOSS', 500, 15);
    this.ctx.fillStyle = '#3498db';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('MEGA MAN', 400, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.MegaManGame = MegaManGame;