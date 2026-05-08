// Space Invaders - Classic Space Shooter
class SpaceInvadersGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.players = players;
    this.gameId = gameId;
    this.isRunning = false;
    this.lastTime = 0;
    this.keys = {};
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    window.addEventListener('keydown', e => this.keys[e.code] = true);
    window.addEventListener('keyup', e => this.keys[e.code] = false);
    
    this.gameState = {
      time: 0,
      score: 0,
      highScore: parseInt(localStorage.getItem('spaceInvadersHighScore')) || 0,
      lives: 3,
      wave: 1,
      waveComplete: false,
      status: 'playing',
      player: null,
      bullets: [],
      enemyBullets: [],
      enemies: [],
      enemyPatterns: [],
      powerups: [],
      particles: [],
      stars: [],
      boss: null,
      bossWarning: false,
      bossTimer: 0,
      combo: 0,
      comboTimer: 0,
      shieldActive: false,
      shieldHealth: 0,
      weaponLevel: 1,
      weaponTypes: ['single', 'double', 'triple', 'spread', 'laser'],
      currentWeapon: 0,
      unlockableWeapons: [false, false, false, false],
      hiddenUFO: null,
      ufoSpawnTimer: 0
    };
    
    this.initStars();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initStars() {
    for (let i = 0; i < 150; i++) {
      this.gameState.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 3 + 0.5,
        brightness: Math.random() * 0.5 + 0.5
      });
    }
  }
  
  start() {
    const playerName = this.players[0] || 'Player';
    this.gameState.player = {
      x: this.canvas.width / 2,
      y: this.canvas.height - 60,
      width: 40,
      height: 30,
      speed: 5,
      shootCooldown: 0,
      shootDelay: 250,
      lastShot: 0,
      invincible: false,
      invincibleTimer: 0,
      thrust: false,
      visible: true
    };
    
    this.spawnEnemies();
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }
  
  spawnEnemies() {
    this.gameState.enemies = [];
    this.gameState.enemyPatterns = [];
    
    const rows = 5;
    const cols = 10;
    const startX = 80;
    const startY = 80;
    const spacing = 60;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const type = this.getEnemyType(row);
        const points = type.points * this.gameState.wave;
        
        this.gameState.enemies.push({
          x: startX + col * spacing,
          y: startY + row * 50,
          width: 35,
          height: 25,
          type: type.name,
          health: type.health + Math.floor(this.gameState.wave / 3),
          maxHealth: type.health + Math.floor(this.gameState.wave / 3),
          points: points,
          speed: type.speed + (this.gameState.wave * 0.1),
          shootChance: type.shootChance + (this.gameState.wave * 0.001),
          moveDirection: 1,
          animFrame: 0,
          animTimer: 0,
          alive: true,
          deathEffect: false,
          deathTimer: 0
        });
      }
    }
    
    this.gameState.enemyPatterns = [
      { name: 'bounce', active: false, timer: 0 },
      { name: 'dive', active: false, target: null },
      { name: 'formation', active: false, offset: 0 }
    ];
  }
  
  getEnemyType(row) {
    const types = [
      { name: 'crab', health: 1, points: 10, speed: 1.5, shootChance: 0.01 },
      { name: 'squid', health: 1, points: 20, speed: 2, shootChance: 0.015 },
      { name: 'octopus', health: 2, points: 30, speed: 1, shootChance: 0.008 },
      { name: 'ufo', health: 1, points: 50, speed: 3, shootChance: 0.02 },
      { name: 'boss', health: 20, points: 100, speed: 0.5, shootChance: 0.05 }
    ];
    
    if (this.gameState.wave % 5 === 0 && row === 0) {
      return types[4];
    }
    
    return types[row] || types[0];
  }
  
  gameLoop() {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    const deltaTime = Math.min(currentTime - this.lastTime, 50);
    this.lastTime = currentTime;
    
    this.update(deltaTime);
    this.render();
    
    requestAnimationFrame(() => this.gameLoop());
  }
  
  update(deltaTime) {
    if (this.gameState.status !== 'playing') return;
    
    this.gameState.time += deltaTime;
    
    this.updateStars();
    this.updatePlayer(deltaTime);
    this.updateBullets(deltaTime);
    this.updateEnemies(deltaTime);
    this.updateEnemyBullets(deltaTime);
    this.updatePowerups(deltaTime);
    this.updateParticles(deltaTime);
    this.updateCombo(deltaTime);
    this.updateBoss(deltaTime);
    this.checkCollisions();
    this.checkWaveComplete();
  }
  
  updateStars() {
    this.gameState.stars.forEach(star => {
      star.y += star.speed;
      if (star.y > this.canvas.height) {
        star.y = 0;
        star.x = Math.random() * this.canvas.width;
      }
    });
  }
  
  updatePlayer(deltaTime) {
    const player = this.gameState.player;
    if (!player) return;
    
    if (player.invincible) {
      player.invincibleTimer -= deltaTime;
      if (player.invincibleTimer <= 0) {
        player.invincible = false;
        player.visible = true;
      } else {
        player.visible = Math.floor(this.gameState.time / 100) % 2 === 0;
      }
    }
    
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      player.x -= player.speed;
    }
    if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      player.x += player.speed;
    }
    if (this.keys['ArrowUp'] || this.keys['KeyW']) {
      player.y -= player.speed;
    }
    if (this.keys['ArrowDown'] || this.keys['KeyS']) {
      player.y += player.speed;
    }
    
    player.x = Math.max(player.width / 2, Math.min(this.canvas.width - player.width / 2, player.x));
    player.y = Math.max(this.canvas.height / 2, Math.min(this.canvas.height - player.height - 20, player.y));
    
    if ((this.keys['Space'] || this.keys['KeyZ']) && player.shootCooldown <= 0) {
      this.shoot();
      player.shootCooldown = player.shootDelay;
    }
    
    if (player.shootCooldown > 0) {
      player.shootCooldown -= deltaTime;
    }
  }
  
  shoot() {
    const player = this.gameState.player;
    const weapon = this.gameState.weaponTypes[this.gameState.currentWeapon];
    
    const createBullet = (offsetX, offsetY, angle = 0) => {
      this.gameState.bullets.push({
        x: player.x + offsetX,
        y: player.y + offsetY,
        width: 4,
        height: 12,
        speed: 8,
        damage: 1,
        angle: angle,
        type: 'player'
      });
    };
    
    switch (weapon) {
      case 'single':
        createBullet(0, -15);
        break;
      case 'double':
        createBullet(-10, -10);
        createBullet(10, -10);
        break;
      case 'triple':
        createBullet(0, -15);
        createBullet(-12, -8, -0.1);
        createBullet(12, -8, 0.1);
        break;
      case 'spread':
        for (let i = -2; i <= 2; i++) {
          createBullet(i * 8, -10, i * 0.15);
        }
        break;
      case 'laser':
        this.gameState.bullets.push({
          x: player.x,
          y: player.y - 20,
          width: 2,
          height: 40,
          speed: 15,
          damage: 2,
          type: 'laser'
        });
        break;
    }
  }
  
  updateBullets(deltaTime) {
    this.gameState.bullets.forEach(bullet => {
      if (bullet.angle) {
        bullet.x += Math.sin(bullet.angle) * bullet.speed;
      }
      bullet.y -= bullet.speed;
      
      bullet.y < -20 && (bullet.alive = false);
    });
    
    this.gameState.bullets = this.gameState.bullets.filter(b => b.alive !== false && b.y > -50);
  }
  
  updateEnemies(deltaTime) {
    let moveDown = false;
    let activeEnemies = 0;
    
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) {
        if (enemy.deathEffect) {
          enemy.deathTimer += deltaTime;
          if (enemy.deathTimer > 300) {
            enemy.deathEffect = false;
          }
        }
        return;
      }
      
      activeEnemies++;
      
      enemy.animTimer += deltaTime;
      if (enemy.animTimer > 500) {
        enemy.animFrame = (enemy.animFrame + 1) % 2;
        enemy.animTimer = 0;
      }
      
      if (enemy.type === 'ufo') {
        enemy.x += enemy.speed * enemy.moveDirection;
        if (enemy.x > this.canvas.width - 40 || enemy.x < 40) {
          enemy.moveDirection *= -1;
        }
      } else {
        enemy.x += enemy.speed * enemy.moveDirection;
        
        if (enemy.x > this.canvas.width - 50 || enemy.x < 50) {
          enemy.moveDirection *= -1;
          moveDown = true;
        }
      }
      
      if (Math.random() < enemy.shootChance) {
        this.spawnEnemyBullet(enemy);
      }
      
      if (enemy.y > this.canvas.height - 100) {
        this.gameOver();
      }
    });
    
    if (moveDown) {
      this.gameState.enemies.forEach(enemy => {
        if (enemy.alive) enemy.y += 20;
      });
    }
    
    this.gameState.boss = this.gameState.enemies.find(e => e.type === 'boss' && e.alive);
    
    if (this.gameState.boss) {
      this.gameState.boss.x = this.canvas.width / 2 + Math.sin(this.gameState.time / 1000) * 200;
    }
  }
  
  spawnEnemyBullet(enemy) {
    this.gameState.enemyBullets.push({
      x: enemy.x,
      y: enemy.y + enemy.height,
      width: 6,
      height: 10,
      speed: 4,
      type: enemy.type
    });
  }
  
  updateEnemyBullets(deltaTime) {
    this.gameState.enemyBullets.forEach(bullet => {
      bullet.y += bullet.speed;
      
      if (bullet.y > this.canvas.height + 20) {
        bullet.alive = false;
      }
    });
    
    this.gameState.enemyBullets = this.gameState.enemyBullets.filter(b => b.alive !== false);
  }
  
  updatePowerups(deltaTime) {
    if (Math.random() < 0.002) {
      const x = Math.random() * (this.canvas.width - 40) + 20;
      const types = ['weapon', 'shield', 'life', 'points'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      this.gameState.powerups.push({
        x: x,
        y: -20,
        width: 25,
        height: 25,
        speed: 2,
        type: type,
        angle: 0
      });
    }
    
    this.gameState.powerups.forEach(powerup => {
      powerup.y += powerup.speed;
      powerup.angle += 0.05;
      
      if (powerup.y > this.canvas.height + 20) {
        powerup.alive = false;
      }
    });
    
    this.gameState.powerups = this.gameState.powerups.filter(p => p.alive !== false);
  }
  
  updateParticles(deltaTime) {
    this.gameState.particles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= deltaTime;
      particle.alpha = particle.life / particle.maxLife;
    });
    
    this.gameState.particles = this.gameState.particles.filter(p => p.life > 0);
  }
  
  createExplosion(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      this.gameState.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        size: Math.random() * 6 + 2,
        color: color || '#ff6600',
        life: 500,
        maxLife: 500
      });
    }
  }
  
  updateCombo(deltaTime) {
    if (this.gameState.comboTimer > 0) {
      this.gameState.comboTimer -= deltaTime;
      if (this.gameState.comboTimer <= 0) {
        this.gameState.combo = 0;
      }
    }
  }
  
  updateBoss(deltaTime) {
    if (!this.gameState.boss) {
      this.gameState.bossTimer += deltaTime;
      
      if (this.gameState.wave % 5 === 0 && this.gameState.bossTimer > 5000 && !this.gameState.bossWarning) {
        this.gameState.bossWarning = true;
        setTimeout(() => {
          this.gameState.bossWarning = false;
          this.spawnBoss();
        }, 2000);
      }
    }
  }
  
  spawnBoss() {
    const bossTypes = [
      { name: 'Mothership', health: 50, points: 500, width: 120, height: 80 },
      { name: 'Destroyer', health: 75, points: 750, width: 150, height: 100 },
      { name: 'Dreadnought', health: 100, points: 1000, width: 180, height: 120 }
    ];
    
    const type = bossTypes[Math.floor(this.gameState.wave / 5) % bossTypes.length];
    
    this.gameState.enemies.push({
      x: this.canvas.width / 2,
      y: 100,
      width: type.width,
      height: type.height,
      type: 'boss',
      health: type.health + this.gameState.wave * 5,
      maxHealth: type.health + this.gameState.wave * 5,
      points: type.points,
      speed: 1,
      moveDirection: 1,
      shootChance: 0.03,
      alive: true,
      animFrame: 0,
      invincible: false
    });
  }
  
  checkCollisions() {
    const player = this.gameState.player;
    if (!player || player.invincible) return;
    
    this.gameState.bullets.forEach(bullet => {
      if (!bullet.alive) return;
      
      this.gameState.enemies.forEach(enemy => {
        if (!enemy.alive || enemy.deathEffect) return;
        
        if (this.checkRectCollision(bullet, enemy)) {
          bullet.alive = false;
          
          if (!enemy.invincible) {
            enemy.health -= bullet.damage;
            
            if (enemy.health <= 0) {
              this.killEnemy(enemy);
            } else {
              this.createExplosion(bullet.x, bullet.y, 5, '#ffff00');
            }
          }
        }
      });
    });
    
    this.gameState.enemyBullets.forEach(bullet => {
      if (!bullet.alive) return;
      
      if (this.checkRectCollision(bullet, player)) {
        bullet.alive = false;
        this.playerHit();
      }
    });
    
    this.gameState.powerups.forEach(powerup => {
      if (!powerup.alive) return;
      
      if (this.checkRectCollision(powerup, player)) {
        powerup.alive = false;
        this.collectPowerup(powerup);
      }
    });
  }
  
  checkRectCollision(a, b) {
    const aLeft = a.x - (a.width || 0) / 2;
    const aRight = a.x + (a.width || 0) / 2;
    const aTop = a.y - (a.height || 0) / 2;
    const aBottom = a.y + (a.height || 0) / 2;
    
    const bLeft = b.x - b.width / 2;
    const bRight = b.x + b.width / 2;
    const bTop = b.y - b.height / 2;
    const bBottom = b.y + b.height / 2;
    
    return aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop;
  }
  
  killEnemy(enemy) {
    enemy.alive = false;
    enemy.deathEffect = true;
    
    this.gameState.combo++;
    this.gameState.comboTimer = 2000;
    const multiplier = Math.min(this.gameState.combo, 5);
    
    const score = enemy.points * multiplier;
    this.gameState.score += score;
    
    this.createExplosion(enemy.x, enemy.y, 15, this.getEnemyColor(enemy.type));
    
    this.playSound('explosion');
  }
  
  getEnemyColor(type) {
    const colors = {
      crab: '#00ff00',
      squid: '#ff00ff',
      octopus: '#00ffff',
      ufo: '#ffff00',
      boss: '#ff0000'
    };
    return colors[type] || '#ffffff';
  }
  
  playerHit() {
    const player = this.gameState.player;
    
    if (this.gameState.shieldActive) {
      this.gameState.shieldHealth--;
      this.createExplosion(player.x, player.y, 10, '#00ffff');
      
      if (this.gameState.shieldHealth <= 0) {
        this.gameState.shieldActive = false;
      }
      return;
    }
    
    player.invincible = true;
    player.invincibleTimer = 2000;
    
    this.gameState.lives--;
    this.createExplosion(player.x, player.y, 20, '#ff0000');
    
    this.playSound('hit');
    
    if (this.gameState.lives <= 0) {
      this.gameOver();
    }
  }
  
  collectPowerup(powerup) {
    this.playSound('powerup');
    
    switch (powerup.type) {
      case 'weapon':
        if (this.gameState.currentWeapon < this.gameState.weaponTypes.length - 1) {
          this.gameState.currentWeapon++;
        }
        break;
      case 'shield':
        this.gameState.shieldActive = true;
        this.gameState.shieldHealth = 3;
        break;
      case 'life':
        this.gameState.lives = Math.min(this.gameState.lives + 1, 5);
        break;
      case 'points':
        this.gameState.score += 500;
        break;
    }
  }
  
  checkWaveComplete() {
    const aliveEnemies = this.gameState.enemies.filter(e => e.alive && !e.deathEffect);
    
    if (aliveEnemies.length === 0) {
      if (!this.gameState.waveComplete) {
        this.gameState.waveComplete = true;
        this.gameState.score += 1000 * this.gameState.wave;
        
        setTimeout(() => {
          this.gameState.wave++;
          this.gameState.waveComplete = false;
          this.spawnEnemies();
        }, 2000);
      }
    }
  }
  
  playSound(type) {
    if (typeof AudioContext !== 'undefined') {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        const frequencies = {
          shoot: 880,
          explosion: 200,
          powerup: 1200,
          hit: 400
        };
        
        oscillator.frequency.value = frequencies[type] || 440;
        oscillator.type = 'square';
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.stop(audioCtx.currentTime + 0.1);
      } catch (e) {}
    }
  }
  
  gameOver() {
    this.gameState.status = 'gameover';
    this.isRunning = false;
    
    if (this.gameState.score > this.gameState.highScore) {
      this.gameState.highScore = this.gameState.score;
      localStorage.setItem('spaceInvadersHighScore', this.gameState.highScore);
    }
  }
  
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.renderStars();
    this.renderEnemies();
    this.renderPlayer();
    this.renderBullets();
    this.renderEnemyBullets();
    this.renderPowerups();
    this.renderParticles();
    this.renderUI();
    this.renderBossWarning();
  }
  
  renderStars() {
    const ctx = this.ctx;
    this.gameState.stars.forEach(star => {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  
  renderPlayer() {
    const player = this.gameState.player;
    if (!player || !player.visible) return;
    
    const ctx = this.ctx;
    
    if (player.thrust) {
      ctx.fillStyle = '#ff6600';
      ctx.beginPath();
      ctx.moveTo(player.x - 10, player.y + 15);
      ctx.lineTo(player.x, player.y + 30 + Math.random() * 10);
      ctx.lineTo(player.x + 10, player.y + 15);
      ctx.fill();
    }
    
    ctx.fillStyle = '#cccccc';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - 15);
    ctx.lineTo(player.x - 15, player.y + 10);
    ctx.lineTo(player.x + 15, player.y + 10);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#888888';
    ctx.fillRect(player.x - 8, player.y - 5, 16, 8);
    
    if (this.gameState.shieldActive) {
      ctx.strokeStyle = `rgba(0, 200, 255, ${0.5 + Math.sin(this.gameState.time / 100) * 0.3})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 30, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  
  renderEnemies() {
    const ctx = this.ctx;
    
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) {
        if (enemy.deathEffect) {
          ctx.globalAlpha = 1 - (enemy.deathTimer / 300);
          this.drawEnemy(enemy);
          ctx.globalAlpha = 1;
        }
        return;
      }
      
      this.drawEnemy(enemy);
      
      if (enemy.maxHealth > 1) {
        const healthBarWidth = enemy.width;
        const healthPercent = enemy.health / enemy.maxHealth;
        
        ctx.fillStyle = '#333333';
        ctx.fillRect(enemy.x - healthBarWidth / 2, enemy.y - enemy.height / 2 - 10, healthBarWidth, 5);
        
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(enemy.x - healthBarWidth / 2, enemy.y - enemy.height / 2 - 10, healthBarWidth * healthPercent, 5);
      }
    });
  }
  
  drawEnemy(enemy) {
    const ctx = this.ctx;
    const x = enemy.x;
    const y = enemy.y;
    const frame = enemy.animFrame;
    
    ctx.fillStyle = this.getEnemyColor(enemy.type);
    
    switch (enemy.type) {
      case 'crab':
        ctx.fillRect(x - 15, y - 10, 30, 20);
        ctx.fillRect(x - 20, y + 5, 8, 8);
        ctx.fillRect(x + 12, y + 5, 8, 8);
        if (frame === 0) {
          ctx.fillRect(x - 18, y - 15, 5, 8);
          ctx.fillRect(x + 13, y - 15, 5, 8);
        }
        break;
        
      case 'squid':
        ctx.beginPath();
        ctx.moveTo(x, y - 12);
        ctx.lineTo(x - 15, y + 5);
        ctx.lineTo(x - 10, y + 12);
        ctx.lineTo(x + 10, y + 12);
        ctx.lineTo(x + 15, y + 5);
        ctx.closePath();
        ctx.fill();
        break;
        
      case 'octopus':
        ctx.beginPath();
        ctx.arc(x, y - 3, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x - 18, y + 5, 36, 8);
        for (let i = -2; i <= 2; i++) {
          ctx.fillRect(x + i * 8 - 3, y + 10, 6, 8);
        }
        break;
        
      case 'ufo':
        ctx.beginPath();
        ctx.ellipse(x, y, 20, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#aa00aa';
        ctx.beginPath();
        ctx.ellipse(x, y - 5, 15, 8, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x - 10, y - 2, 4, 4);
        ctx.fillRect(x + 6, y - 2, 4, 4);
        break;
        
      case 'boss':
        ctx.fillStyle = '#880000';
        ctx.fillRect(x - 60, y - 40, 120, 80);
        
        ctx.fillStyle = '#ff0000';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(x - 30 + i * 30, y - 20, 15, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(x - 50, y + 20, 20, 20);
        ctx.fillRect(x + 30, y + 20, 20, 20);
        
        ctx.fillStyle = '#440000';
        for (let i = 0; i < 5; i++) {
          ctx.fillRect(x - 50 + i * 25, y + 5, 15, 30);
        }
        break;
    }
  }
  
  renderBullets() {
    const ctx = this.ctx;
    
    this.gameState.bullets.forEach(bullet => {
      if (bullet.type === 'laser') {
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
      } else {
        ctx.fillStyle = '#ffff00';
        ctx.shadowBlur = 0;
      }
      
      ctx.fillRect(bullet.x - bullet.width / 2, bullet.y - bullet.height / 2, bullet.width, bullet.height);
      ctx.shadowBlur = 0;
    });
  }
  
  renderEnemyBullets() {
    const ctx = this.ctx;
    
    this.gameState.enemyBullets.forEach(bullet => {
      ctx.fillStyle = bullet.type === 'boss' ? '#ff0000' : '#ff8800';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  
  renderPowerups() {
    const ctx = this.ctx;
    
    this.gameState.powerups.forEach(powerup => {
      ctx.save();
      ctx.translate(powerup.x, powerup.y);
      ctx.rotate(powerup.angle);
      
      const colors = {
        weapon: '#00ff00',
        shield: '#00ffff',
        life: '#ff0000',
        points: '#ffff00'
      };
      
      ctx.fillStyle = colors[powerup.type];
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const symbols = {
        weapon: 'W',
        shield: 'S',
        life: '+',
        points: '$'
      };
      
      ctx.fillText(symbols[powerup.type], 0, 0);
      
      ctx.restore();
    });
  }
  
  renderParticles() {
    const ctx = this.ctx;
    
    this.gameState.particles.forEach(particle => {
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.globalAlpha = 1;
  }
  
  renderUI() {
    const ctx = this.ctx;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    
    ctx.fillText(`Wave: ${this.gameState.wave}`, 20, 55);
    
    ctx.textAlign = 'right';
    ctx.fillText(`High Score: ${this.gameState.highScore}`, this.canvas.width - 20, 30);
    
    ctx.fillText(`Lives: ${this.gameState.lives}`, this.canvas.width - 20, 55);
    
    ctx.fillStyle = '#888888';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Weapon: ${this.gameState.weaponTypes[this.gameState.currentWeapon].toUpperCase()}`, 20, 80);
    
    if (this.gameState.combo > 1) {
      ctx.fillStyle = '#ff8800';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.gameState.combo}x COMBO!`, this.canvas.width / 2, 100);
    }
    
    if (this.gameState.status === 'gameover') {
      this.renderGameOver();
    }
  }
  
  renderBossWarning() {
    if (!this.gameState.bossWarning) return;
    
    const ctx = this.ctx;
    
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('WARNING!', this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    ctx.font = '24px Arial';
    ctx.fillText('BOSS APPROACHING', this.canvas.width / 2, this.canvas.height / 2 + 20);
  }
  
  renderGameOver() {
    const ctx = this.ctx;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 50);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
    ctx.fillText(`Waves Survived: ${this.gameState.wave}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
    
    ctx.fillStyle = '#888888';
    ctx.font = '18px Arial';
    ctx.fillText('Press SPACE to restart', this.canvas.width / 2, this.canvas.height / 2 + 80);
  }
  
  restart() {
    this.gameState = {
      time: 0,
      score: 0,
      highScore: this.gameState.highScore,
      lives: 3,
      wave: 1,
      waveComplete: false,
      status: 'playing',
      player: null,
      bullets: [],
      enemyBullets: [],
      enemies: [],
      enemyPatterns: [],
      powerups: [],
      particles: [],
      stars: this.gameState.stars,
      boss: null,
      bossWarning: false,
      bossTimer: 0,
      combo: 0,
      comboTimer: 0,
      shieldActive: false,
      shieldHealth: 0,
      weaponLevel: 1,
      weaponTypes: this.gameState.weaponTypes,
      currentWeapon: 0,
      unlockableWeapons: [false, false, false, false],
      hiddenUFO: null,
      ufoSpawnTimer: 0
    };
    
    this.keys = {};
    this.start();
  }
}

window.SpaceInvadersGame = SpaceInvadersGame;