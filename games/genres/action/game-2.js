// Urban Warfare - City Combat Action Game
class UrbanWarfareGame {
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
      players: [],
      enemies: [],
      bullets: [],
      grenades: [],
      coverObjects: [],
      vehicles: [],
      explosions: [],
      particles: []
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.createMap();
    
    this.players.forEach((p, i) => {
      this.gameState.players.push({
        name: p,
        x: 100 + i * 150,
        y: this.canvas.height - 150,
        vx: 0,
        vy: 0,
        speed: 4,
        radius: 15,
        health: 100,
        maxHealth: 100,
        ammo: 30,
        maxAmmo: 30,
        weapon: 'rifle',
        lastShot: 0,
        lastGrenade: 0,
        grenades: 3,
        inCover: false,
        coverObject: null,
        facing: 1,
        reloadTimer: 0,
        color: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'][i % 4]
      });
    });
    
    this.spawnWave();
  }
  
  createMap() {
    const coverPositions = [
      { x: 200, y: this.canvas.height - 180 },
      { x: 400, y: this.canvas.height - 180 },
      { x: 600, y: this.canvas.height - 180 },
      { x: 300, y: this.canvas.height - 300 },
      { x: 500, y: this.canvas.height - 300 }
    ];
    
    coverPositions.forEach(pos => {
      this.gameState.coverObjects.push({
        x: pos.x,
        y: pos.y,
        width: 60,
        height: 40,
        health: 50,
        type: 'crate'
      });
    });
    
    const buildingPositions = [
      { x: 50, y: 50, w: 100, h: 200 },
      { x: 650, y: 50, w: 100, h: 200 },
      { x: 300, y: 100, w: 200, h: 150 }
    ];
    
    buildingPositions.forEach(b => {
      this.gameState.coverObjects.push({
        x: b.x,
        y: b.y,
        width: b.w,
        height: b.h,
        health: 200,
        type: 'building'
      });
    });
  }
  
  spawnWave() {
    const enemyCount = 2 + this.gameState.wave * 2;
    
    for (let i = 0; i < enemyCount; i++) {
      const types = ['soldier', 'sniper', 'grenadier', 'heavy', 'commando'];
      const type = types[Math.min(Math.floor(Math.random() * types.length), Math.min(this.gameState.wave - 1, 4))];
      
      this.gameState.enemies.push(this.createEnemy(type));
    }
  }
  
  createEnemy(type) {
    const side = Math.random() > 0.5 ? 1 : -1;
    const baseEnemy = {
      x: side > 0 ? this.canvas.width + 30 : -30,
      y: this.canvas.height - 150 - Math.random() * 100,
      vx: 0,
      vy: 0,
      radius: 15,
      health: 40 + this.gameState.wave * 15,
      maxHealth: 40 + this.gameState.wave * 15,
      damage: 8 + this.gameState.wave * 3,
      speed: 1.5 + Math.random(),
      type: type,
      state: 'idle',
      attackCooldown: 0,
      hitStun: 0,
      accuracy: 0.6,
      color: '#5d6d7e',
      inCover: false,
      coverObject: null
    };
    
    switch(type) {
      case 'soldier':
        Object.assign(baseEnemy, { range: 200, fireRate: 1, reward: 50 });
        break;
      case 'sniper':
        Object.assign(baseEnemy, { range: 400, fireRate: 3, damage: baseEnemy.damage * 2, reward: 150 });
        break;
      case 'grenadier':
        Object.assign(baseEnemy, { range: 150, fireRate: 4, canThrowGrenades: true, reward: 100 });
        break;
      case 'heavy':
        Object.assign(baseEnemy, { range: 150, fireRate: 0.8, health: baseEnemy.health * 2, reward: 200 });
        break;
      case 'commando':
        Object.assign(baseEnemy, { range: 250, fireRate: 1.2, speed: baseEnemy.speed * 1.5, reward: 250 });
        break;
    }
    
    return baseEnemy;
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
    
    this.handlePlayerInput();
    this.updatePhysics(deltaTime);
    this.handleShooting();
    this.handleGrenades();
    this.updateBullets(deltaTime);
    this.updateEnemies(deltaTime);
    this.updateCoverObjects();
    this.updateExplosions(deltaTime);
    this.updateParticles(deltaTime);
    this.checkWaveCompletion();
    
    if (this.gameState.players.every(p => p.health <= 0)) {
      this.gameState.status = 'gameover';
    }
  }
  
  handlePlayerInput() {
    this.gameState.players.forEach(player => {
      const input = this.getPlayerInput(player.name);
      
      if (input.cover && !player.inCover) {
        this.enterCover(player);
      } else if (!input.cover && player.inCover) {
        this.exitCover(player);
      }
      
      if (!player.inCover) {
        let moveX = 0;
        if (input.left) moveX -= 1;
        if (input.right) moveX += 1;
        
        player.vx = moveX * player.speed;
        
        if (input.up) player.vy = -player.speed * 0.7;
        else if (input.down) player.vy = player.speed * 0.7;
        else player.vy = 0;
        
        player.facing = moveX !== 0 ? moveX : player.facing;
      } else {
        player.vx = 0;
        player.vy = 0;
        
        if (input.left) player.facing = -1;
        if (input.right) player.facing = 1;
      }
      
      if (input.action && player.ammo > 0 && player.reloadTimer <= 0) {
        this.fireBullet(player);
        player.ammo--;
        player.lastShot = this.gameState.time;
      }
      
      if (input.grenade && player.grenades > 0 && this.gameState.time - player.lastGrenade > 1) {
        this.throwGrenade(player);
        player.grenades--;
        player.lastGrenade = this.gameState.time;
      }
      
      if (player.reloadTimer > 0) {
        player.reloadTimer -= 0.016;
      }
      
      if (player.ammo === 0 && player.reloadTimer <= 0) {
        player.reloadTimer = 2;
        player.ammo = player.maxAmmo;
      }
    });
  }
  
  enterCover(player) {
    this.gameState.coverObjects.forEach(cover => {
      const dx = player.x - cover.x;
      const dy = player.y - cover.y;
      
      if (Math.abs(dx) < cover.width / 2 + player.radius && Math.abs(dy) < cover.height / 2 + player.radius) {
        player.inCover = true;
        player.coverObject = cover;
        player.y = cover.y + cover.height / 2 + player.radius;
        return;
      }
    });
  }
  
  exitCover(player) {
    player.inCover = false;
    player.coverObject = null;
  }
  
  fireBullet(player) {
    const angle = player.facing > 0 ? 0 : Math.PI;
    const spread = (Math.random() - 0.5) * 0.2;
    
    this.gameState.bullets.push({
      x: player.x + player.facing * 20,
      y: player.y,
      vx: Math.cos(angle + spread) * 15,
      vy: Math.sin(angle + spread) * 15,
      radius: 3,
      damage: 15 + this.gameState.wave * 3,
      fromPlayer: true,
      playerName: player.name
    });
    
    this.createMuzzleFlash(player.x + player.facing * 20, player.y);
  }
  
  throwGrenade(player) {
    const throwAngle = player.facing > 0 ? Math.PI / 4 : Math.PI * 0.75;
    
    this.gameState.grenades.push({
      x: player.x,
      y: player.y,
      vx: Math.cos(throwAngle) * 8,
      vy: -8,
      radius: 6,
      timer: 2,
      thrownBy: player.name
    });
  }
  
  handleGrenades() {
    this.gameState.grenades = this.gameState.grenades.filter(grenade => {
      grenade.timer -= 0.016;
      
      if (grenade.timer <= 0) {
        this.createExplosion(grenade.x, grenade.y, 60, 40);
        return false;
      }
      
      grenade.x += grenade.vx;
      grenade.y += grenade.vy;
      grenade.vy += 0.3;
      
      if (grenade.y > this.canvas.height - 80) {
        grenade.y = this.canvas.height - 80;
        grenade.vy *= -0.5;
        grenade.vx *= 0.8;
      }
      
      return true;
    });
  }
  
  createExplosion(x, y, radius, damage) {
    this.gameState.explosions.push({
      x, y,
      radius: 0,
      maxRadius: radius,
      life: 0.5,
      damage: damage
    });
    
    this.gameState.enemies.forEach(enemy => {
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < radius) {
        enemy.health -= damage * (1 - dist / radius);
        enemy.hitStun = 0.5;
      }
    });
    
    this.gameState.players.forEach(player => {
      const dx = player.x - x;
      const dy = player.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < radius && !player.inCover) {
        player.health -= damage * (1 - dist / radius) * 0.5;
      }
    });
    
    this.gameState.coverObjects.forEach(cover => {
      const dx = cover.x - x;
      const dy = cover.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < radius + 30) {
        cover.health -= damage * (1 - dist / radius);
      }
    });
    
    for (let i = 0; i < 30; i++) {
      this.gameState.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 1,
        color: ['#e74c3c', '#f39c12', '#e67e22'][Math.floor(Math.random() * 3)],
        size: 5 + Math.random() * 5
      });
    }
  }
  
  updateBullets(deltaTime) {
    this.gameState.bullets = this.gameState.bullets.filter(bullet => {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      
      if (bullet.x < 0 || bullet.x > this.canvas.width || bullet.y < 0 || bullet.y > this.canvas.height) {
        return false;
      }
      
      if (bullet.fromPlayer) {
        this.gameState.enemies.forEach(enemy => {
          if (enemy.hitStun > 0) return;
          
          const dx = enemy.x - bullet.x;
          const dy = enemy.y - bullet.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < enemy.radius + bullet.radius) {
            enemy.health -= bullet.damage;
            enemy.hitStun = 0.2;
            
            this.gameState.score += bullet.damage;
            
            for (let i = 0; i < 8; i++) {
              this.gameState.particles.push({
                x: bullet.x,
                y: bullet.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 0.4,
                color: '#e74c3c',
                size: 2
              });
            }
            
            return false;
          }
        });
        
        this.gameState.coverObjects.forEach(cover => {
          if (bullet.x > cover.x - cover.width / 2 &&
              bullet.x < cover.x + cover.width / 2 &&
              bullet.y > cover.y - cover.height / 2 &&
              bullet.y < cover.y + cover.height / 2) {
            cover.health -= bullet.damage * 0.5;
            return false;
          }
        });
      } else {
        this.gameState.players.forEach(player => {
          if (player.health <= 0 || player.inCover) return;
          
          const dx = player.x - bullet.x;
          const dy = player.y - bullet.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < player.radius + bullet.radius) {
            player.health -= bullet.damage;
            
            for (let i = 0; i < 8; i++) {
              this.gameState.particles.push({
                x: bullet.x,
                y: bullet.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 0.4,
                color: '#e74c3c',
                size: 2
              });
            }
            
            return false;
          }
        });
      }
      
      return true;
    });
  }
  
  updatePhysics(deltaTime) {
    const groundY = this.canvas.height - 80;
    
    this.gameState.players.forEach(player => {
      player.x += player.vx;
      player.y += player.vy;
      
      player.x = Math.max(player.radius, Math.min(this.canvas.width - player.radius, player.x));
      player.y = Math.max(player.radius, Math.min(groundY, player.y));
    });
    
    this.gameState.enemies.forEach(enemy => {
      enemy.x += enemy.vx;
      enemy.y += enemy.vy;
      
      enemy.x = Math.max(enemy.radius, Math.min(this.canvas.width - enemy.radius, enemy.x));
      enemy.y = Math.max(enemy.radius, Math.min(groundY, enemy.y));
    });
  }
  
  handleShooting() {
    this.gameState.enemies.forEach(enemy => {
      if (enemy.hitStun > 0) {
        enemy.hitStun -= 0.016;
        return;
      }
      
      if (enemy.attackCooldown > 0) {
        enemy.attackCooldown -= 0.016;
      }
      
      const targetPlayer = this.findTargetPlayer(enemy);
      if (!targetPlayer) return;
      
      const dx = targetPlayer.x - enemy.x;
      const dy = targetPlayer.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < enemy.range && enemy.attackCooldown <= 0) {
        this.enemyFire(enemy, targetPlayer);
        enemy.attackCooldown = enemy.fireRate;
      }
      
      if (dist > enemy.range * 0.7) {
        enemy.vx = Math.sign(dx) * enemy.speed;
      } else {
        enemy.vx = 0;
      }
    });
  }
  
  findTargetPlayer(enemy) {
    let target = null;
    let minDist = Infinity;
    
    this.gameState.players.forEach(player => {
      if (player.health <= 0) return;
      
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist) {
        minDist = dist;
        target = player;
      }
    });
    
    return target;
  }
  
  enemyFire(enemy, target) {
    const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
    const spread = (Math.random() - 0.5) * (1 - enemy.accuracy);
    
    this.gameState.bullets.push({
      x: enemy.x,
      y: enemy.y,
      vx: Math.cos(angle + spread) * 12,
      vy: Math.sin(angle + spread) * 12,
      radius: 3,
      damage: enemy.damage,
      fromPlayer: false
    });
  }
  
  updateEnemies(deltaTime) {
    this.gameState.enemies = this.gameState.enemies.filter(enemy => {
      if (enemy.health <= 0) {
        this.gameState.score += enemy.reward || 50;
        
        if (Math.random() > 0.7) {
          this.gameState.players.forEach(p => {
            if (p.ammo < p.maxAmmo) {
              p.ammo += 10;
            }
          });
        }
        
        for (let i = 0; i < 15; i++) {
          this.gameState.particles.push({
            x: enemy.x,
            y: enemy.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 0.8,
            color: '#5d6d7e',
            size: 4
          });
        }
        
        return false;
      }
      
      return true;
    });
  }
  
  updateCoverObjects() {
    this.gameState.coverObjects = this.gameState.coverObjects.filter(cover => {
      return cover.health > 0;
    });
  }
  
  updateExplosions(deltaTime) {
    this.gameState.explosions = this.gameState.explosions.filter(exp => {
      exp.life -= deltaTime;
      exp.radius += (exp.maxRadius - exp.radius) * 0.2;
      return exp.life > 0;
    });
  }
  
  updateParticles(deltaTime) {
    this.gameState.particles = this.gameState.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life -= deltaTime;
      return p.life > 0;
    });
  }
  
  createMuzzleFlash(x, y) {
    for (let i = 0; i < 5; i++) {
      this.gameState.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 0.1,
        color: '#f1c40f',
        size: 3
      });
    }
  }
  
  checkWaveCompletion() {
    if (this.gameState.enemies.length === 0 && this.gameState.status === 'playing') {
      this.gameState.wave++;
      setTimeout(() => this.spawnWave(), 2000);
    }
  }
  
  getPlayerInput(name) {
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawBackground();
    this.drawGround();
    this.drawCoverObjects();
    this.drawEnemies();
    this.drawPlayers();
    this.drawBullets();
    this.drawGrenades();
    this.drawExplosions();
    this.drawParticles();
    this.drawUI();
    
    if (this.gameState.status === 'gameover') {
      this.drawGameOver();
    }
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height * 0.7);
    gradient.addColorStop(0, '#34495e');
    gradient.addColorStop(1, '#2c3e50');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height * 0.7);
    
    for (let i = 0; i < 20; i++) {
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.fillRect(50 + i * 60, 20, 40, 80);
      this.ctx.fillStyle = '#1a252f';
      this.ctx.fillRect(55 + i * 60, 30, 12, 25);
      this.ctx.fillRect(75 + i * 60, 30, 12, 25);
    }
  }
  
  drawGround() {
    this.ctx.fillStyle = '#1a252f';
    this.ctx.fillRect(0, this.canvas.height - 80, this.canvas.width, 80);
    
    this.ctx.fillStyle = '#27ae60';
    this.ctx.fillRect(0, this.canvas.height - 80, this.canvas.width, 5);
  }
  
  drawCoverObjects() {
    this.gameState.coverObjects.forEach(cover => {
      if (cover.type === 'crate') {
        this.ctx.fillStyle = '#8b4513';
        this.ctx.fillRect(cover.x - cover.width / 2, cover.y - cover.height / 2, cover.width, cover.height);
        
        this.ctx.strokeStyle = '#5d4037';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(cover.x - cover.width / 2, cover.y - cover.height / 2, cover.width, cover.height);
      } else if (cover.type === 'building') {
        this.ctx.fillStyle = '#34495e';
        this.ctx.fillRect(cover.x - cover.width / 2, cover.y - cover.height / 2, cover.width, cover.height);
        
        for (let wx = 0; wx < 3; wx++) {
          for (let wy = 0; wy < 4; wy++) {
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.fillRect(cover.x - cover.width / 2 + 10 + wx * 30, cover.y - cover.height / 2 + 10 + wy * 25, 20, 15);
          }
        }
      }
    });
  }
  
  drawEnemies() {
    this.gameState.enemies.forEach(enemy => {
      this.ctx.fillStyle = enemy.color;
      this.ctx.beginPath();
      this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      if (enemy.hitStun > 0) {
        this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
        this.ctx.beginPath();
        this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      this.ctx.fillStyle = '#f39c12';
      this.ctx.beginPath();
      this.ctx.arc(enemy.x + 5, enemy.y - 5, 4, 0, Math.PI * 2);
      this.ctx.fill();
      
      const healthPercent = enemy.health / enemy.maxHealth;
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.fillRect(enemy.x - 15, enemy.y - 25, 30, 4);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(enemy.x - 15, enemy.y - 25, 30 * healthPercent, 4);
    });
  }
  
  drawPlayers() {
    this.gameState.players.forEach(player => {
      if (player.health <= 0) return;
      
      this.ctx.fillStyle = player.color;
      this.ctx.beginPath();
      this.ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.beginPath();
      this.ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.fillRect(player.x + player.facing * 10, player.y - 5, 15, 4);
      
      if (player.inCover) {
        this.ctx.strokeStyle = '#2ecc71';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, player.radius + 5, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(player.name.substring(0, 5), player.x, player.y - player.radius - 8);
    });
  }
  
  drawBullets() {
    this.gameState.bullets.forEach(bullet => {
      this.ctx.fillStyle = bullet.fromPlayer ? '#f1c40f' : '#e74c3c';
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawGrenades() {
    this.gameState.grenades.forEach(grenade => {
      this.ctx.fillStyle = '#27ae60';
      this.ctx.beginPath();
      this.ctx.arc(grenade.x, grenade.y, grenade.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      const pulse = Math.sin(this.gameState.time * 10) * 0.3 + 0.7;
      this.ctx.fillStyle = `rgba(231, 76, 60, ${pulse})`;
      this.ctx.beginPath();
      this.ctx.arc(grenade.x, grenade.y, grenade.radius + 3, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawExplosions() {
    this.gameState.explosions.forEach(exp => {
      const gradient = this.ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
      gradient.addColorStop(0, 'rgba(241, 196, 15, 0.8)');
      gradient.addColorStop(0.5, 'rgba(230, 126, 34, 0.6)');
      gradient.addColorStop(1, 'rgba(192, 57, 43, 0)');
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawParticles() {
    this.gameState.particles.forEach(p => {
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 180, 70);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Wave: ${this.gameState.wave}`, 20, 30);
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 50);
    this.ctx.fillText(`Enemies: ${this.gameState.enemies.length}`, 20, 70);
    
    this.gameState.players.forEach((player, i) => {
      const y = this.canvas.height - 80 - i * 50;
      
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(10, y, 180, 45);
      
      this.ctx.fillStyle = player.color;
      this.ctx.font = '12px Arial';
      this.ctx.fillText(player.name, 20, y + 15);
      
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.fillRect(20, y + 22, 120, 8);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(20, y + 22, 120 * (player.health / player.maxHealth), 8);
      
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.fillRect(20, y + 34, 80, 6);
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.fillRect(20, y + 34, 80 * (player.ammo / player.maxAmmo), 6);
      
      this.ctx.fillStyle = '#95a5a6';
      this.ctx.font = '10px Arial';
      this.ctx.fillText(`G: ${player.grenades}`, 110, y + 40);
    });
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 60px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 40);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Waves: ${this.gameState.wave}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    this.ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 60);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.UrbanWarfareGame = UrbanWarfareGame;