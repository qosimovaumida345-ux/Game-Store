// Desert Commando - Desert Warfare Action Game
class DesertCommandoGame {
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
      temperature: 35,
      hydration: 100,
      players: [],
      enemies: [],
      vehicles: [],
      ammoCrates: [],
      healthCrates: [],
      sandstorms: [],
      bullets: [],
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
    this.players.forEach((p, i) => {
      this.gameState.players.push({
        name: p,
        x: 100 + i * 120,
        y: this.canvas.height - 150,
        vx: 0,
        vy: 0,
        speed: 4.5,
        radius: 18,
        health: 100,
        maxHealth: 100,
        ammo: 25,
        maxAmmo: 25,
        weapon: 'rifle',
        lastShot: 0,
        grenades: 2,
        inVehicle: null,
        heatExposure: 0,
        color: ['#d35400', '#2980b9', '#27ae60', '#8e44ad'][i % 4]
      });
    });
    
    this.spawnAmmoCrates(3);
    this.spawnHealthCrates(2);
    this.spawnWave();
  }
  
  spawnAmmoCrates(count) {
    for (let i = 0; i < count; i++) {
      this.gameState.ammoCrates.push({
        x: 150 + Math.random() * (this.canvas.width - 300),
        y: this.canvas.height - 150 - Math.random() * 100,
        radius: 15,
        life: 30
      });
    }
  }
  
  spawnHealthCrates(count) {
    for (let i = 0; i < count; i++) {
      this.gameState.healthCrates.push({
        x: 150 + Math.random() * (this.canvas.width - 300),
        y: this.canvas.height - 150 - Math.random() * 100,
        radius: 15,
        life: 30
      });
    }
  }
  
  spawnWave() {
    const enemyCount = 3 + this.gameState.wave * 2;
    
    for (let i = 0; i < enemyCount; i++) {
      const types = ['infantry', 'sniper', 'jeep', 'tank', 'helicopter'];
      const type = types[Math.min(Math.floor(Math.random() * types.length), Math.min(this.gameState.wave - 1, 4))];
      
      this.gameState.enemies.push(this.createEnemy(type));
    }
  }
  
  createEnemy(type) {
    const side = Math.random() > 0.5 ? 1 : -1;
    const baseEnemy = {
      x: side > 0 ? this.canvas.width + 50 : -50,
      y: this.canvas.height - 150,
      vx: 0,
      vy: 0,
      radius: 20,
      health: 50 + this.gameState.wave * 20,
      maxHealth: 50 + this.gameState.wave * 20,
      damage: 10 + this.gameState.wave * 4,
      speed: 2 + Math.random(),
      type: type,
      state: 'moving',
      attackCooldown: 0,
      hitStun: 0,
      color: this.getEnemyColor(type),
      reward: 100 + this.gameState.wave * 50
    };
    
    switch(type) {
      case 'infantry':
        Object.assign(baseEnemy, { range: 180, fireRate: 1.2, radius: 15 });
        break;
      case 'sniper':
        Object.assign(baseEnemy, { range: 400, fireRate: 3, damage: baseEnemy.damage * 2, radius: 15 });
        break;
      case 'jeep':
        Object.assign(baseEnemy, { range: 150, fireRate: 0.8, health: baseEnemy.health * 3, speed: baseEnemy.speed * 2, radius: 30 });
        break;
      case 'tank':
        Object.assign(baseEnemy, { range: 200, fireRate: 2, health: baseEnemy.health * 8, speed: baseEnemy.speed * 0.5, radius: 45 });
        break;
      case 'helicopter':
        Object.assign(baseEnemy, { range: 300, fireRate: 0.5, health: baseEnemy.health * 4, speed: baseEnemy.speed * 1.5, y: 100, radius: 35, isAerial: true });
        break;
    }
    
    return baseEnemy;
  }
  
  getEnemyColor(type) {
    const colors = {
      infantry: '#795548',
      sniper: '#5d4037',
      jeep: '#4e342e',
      tank: '#3e2723',
      helicopter: '#6d4c41'
    };
    return colors[type] || '#5d4037';
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
    this.updateEnvironment(deltaTime);
    this.handlePlayerInput();
    this.updatePhysics(deltaTime);
    this.handleShooting();
    this.updateBullets(deltaTime);
    this.updateEnemies(deltaTime);
    this.updateCrates();
    this.updateExplosions(deltaTime);
    this.updateParticles(deltaTime);
    this.checkWaveCompletion();
    
    if (this.gameState.players.every(p => p.health <= 0)) {
      this.gameState.status = 'gameover';
    }
  }
  
  updateEnvironment(deltaTime) {
    this.gameState.hydration -= deltaTime * 2;
    
    this.gameState.players.forEach(player => {
      if (!player.inVehicle) {
        player.heatExposure += deltaTime * (this.gameState.temperature / 50);
        
        if (player.heatExposure > 20) {
          player.health -= deltaTime * 5;
        }
      }
    });
    
    if (this.gameState.hydration <= 0) {
      this.gameState.players.forEach(player => {
        if (!player.inVehicle) {
          player.health -= deltaTime * 10;
        }
      });
    }
    
    if (Math.random() < 0.002 && this.gameState.sandstorms.length < 2) {
      this.gameState.sandstorms.push({
        x: Math.random() > 0.5 ? -200 : this.canvas.width + 200,
        y: Math.random() * this.canvas.height,
        width: 200,
        direction: Math.random() > 0.5 ? 1 : -1,
        speed: 3 + Math.random() * 2,
        life: 10
      });
    }
    
    this.gameState.sandstorms = this.gameState.sandstorms.filter(storm => {
      storm.x += storm.direction * storm.speed;
      storm.life -= deltaTime;
      
      this.gameState.players.forEach(player => {
        if (!player.inVehicle && 
            player.x > storm.x && 
            player.x < storm.x + storm.width) {
          player.visibility = 0.3;
        }
      });
      
      return storm.life > 0 && storm.x > -300 && storm.x < this.canvas.width + 300;
    });
  }
  
  handlePlayerInput() {
    this.gameState.players.forEach(player => {
      const input = this.getPlayerInput(player.name);
      
      if (player.inVehicle) return;
      
      let moveX = 0;
      if (input.left) moveX -= 1;
      if (input.right) moveX += 1;
      
      player.vx = moveX * player.speed;
      
      if (input.up) player.vy = -player.speed * 0.6;
      else if (input.down) player.vy = player.speed * 0.6;
      else player.vy = 0;
      
      if (input.action && player.ammo > 0) {
        this.fireBullet(player);
        player.ammo--;
        player.lastShot = this.gameState.time;
      }
      
      if (input.grenade && player.grenades > 0) {
        this.throwGrenade(player);
        player.grenades--;
      }
    });
  }
  
  fireBullet(player) {
    this.gameState.bullets.push({
      x: player.x,
      y: player.y - 10,
      vx: Math.random() * 2 - 1,
      vy: -15,
      radius: 4,
      damage: 20 + this.gameState.wave * 5,
      fromPlayer: true,
      playerName: player.name
    });
  }
  
  throwGrenade(player) {
    this.gameState.bullets.push({
      x: player.x,
      y: player.y - 10,
      vx: (Math.random() - 0.5) * 10,
      vy: -12,
      radius: 8,
      damage: 40,
      isGrenade: true,
      fromPlayer: true
    });
  }
  
  updatePhysics(deltaTime) {
    const groundY = this.canvas.height - 100;
    
    this.gameState.players.forEach(player => {
      if (player.inVehicle) return;
      
      player.x += player.vx;
      player.y += player.vy;
      
      player.x = Math.max(player.radius, Math.min(this.canvas.width - player.radius, player.x));
      player.y = Math.max(player.radius, Math.min(groundY, player.y));
    });
    
    this.gameState.enemies.forEach(enemy => {
      enemy.x += enemy.vx;
      enemy.y += enemy.vy;
      
      if (!enemy.isAerial) {
        enemy.y = Math.max(enemy.radius, Math.min(groundY, enemy.y));
      }
      
      enemy.x = Math.max(enemy.radius, Math.min(this.canvas.width - enemy.radius, enemy.x));
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
      if (!targetPlayer || enemy.attackCooldown > 0) return;
      
      const dx = targetPlayer.x - enemy.x;
      const dy = targetPlayer.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < enemy.range) {
        this.enemyFire(enemy, targetPlayer);
        enemy.attackCooldown = enemy.fireRate;
      } else {
        enemy.vx = Math.sign(dx) * enemy.speed;
      }
    });
  }
  
  findTargetPlayer(enemy) {
    let target = null;
    let minDist = Infinity;
    
    this.gameState.players.forEach(player => {
      if (player.health <= 0 || player.inVehicle) return;
      
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
    
    this.gameState.bullets.push({
      x: enemy.x,
      y: enemy.y,
      vx: Math.cos(angle) * 10,
      vy: Math.sin(angle) * 10,
      radius: 4,
      damage: enemy.damage,
      fromPlayer: false
    });
  }
  
  updateBullets(deltaTime) {
    this.gameState.bullets = this.gameState.bullets.filter(bullet => {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      
      if (bullet.isGrenade) {
        bullet.vy += 0.4;
      }
      
      if (bullet.y > this.canvas.height || bullet.x < 0 || bullet.x > this.canvas.width) {
        if (bullet.isGrenade) {
          this.createExplosion(bullet.x, bullet.y, 50, bullet.damage);
        }
        return false;
      }
      
      if (bullet.fromPlayer) {
        this.gameState.enemies.forEach(enemy => {
          const dx = enemy.x - bullet.x;
          const dy = enemy.y - bullet.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < enemy.radius + bullet.radius) {
            enemy.health -= bullet.damage;
            enemy.hitStun = 0.2;
            
            if (bullet.isGrenade) {
              this.createExplosion(bullet.x, bullet.y, 50, bullet.damage);
            }
            
            this.gameState.score += bullet.damage;
            
            for (let i = 0; i < 8; i++) {
              this.gameState.particles.push({
                x: bullet.x,
                y: bullet.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 0.4,
                color: '#e74c3c',
                size: 3
              });
            }
            
            return false;
          }
        });
      } else {
        this.gameState.players.forEach(player => {
          if (player.health <= 0 || player.inVehicle) return;
          
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
                size: 3
              });
            }
            
            return false;
          }
        });
      }
      
      return true;
    });
  }
  
  createExplosion(x, y, radius, damage) {
    this.gameState.explosions.push({
      x, y,
      radius: 0,
      maxRadius: radius,
      life: 0.6
    });
    
    this.gameState.enemies.forEach(enemy => {
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < radius) {
        enemy.health -= damage * (1 - dist / radius);
      }
    });
    
    for (let i = 0; i < 40; i++) {
      this.gameState.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        life: 1,
        color: ['#e74c3c', '#f39c12', '#e67e22'][Math.floor(Math.random() * 3)],
        size: 5 + Math.random() * 8
      });
    }
  }
  
  updateEnemies(deltaTime) {
    this.gameState.enemies = this.gameState.enemies.filter(enemy => {
      if (enemy.health <= 0) {
        this.gameState.score += enemy.reward;
        
        if (Math.random() > 0.6) {
          if (Math.random() > 0.5) {
            this.gameState.ammoCrates.push({
              x: enemy.x,
              y: enemy.y,
              radius: 15,
              life: 20
            });
          } else {
            this.gameState.healthCrates.push({
              x: enemy.x,
              y: enemy.y,
              radius: 15,
              life: 20
            });
          }
        }
        
        for (let i = 0; i < 20; i++) {
          this.gameState.particles.push({
            x: enemy.x,
            y: enemy.y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1,
            color: enemy.color,
            size: 5
          });
        }
        
        return false;
      }
      
      return true;
    });
  }
  
  updateCrates() {
    this.gameState.ammoCrates = this.gameState.ammoCrates.filter(crate => {
      crate.life -= 0.016;
      
      this.gameState.players.forEach(player => {
        if (player.inVehicle || player.health <= 0) return;
        
        const dx = player.x - crate.x;
        const dy = player.y - crate.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.radius + crate.radius) {
          player.ammo = player.maxAmmo;
          player.grenades = Math.min(5, player.grenades + 2);
          return false;
        }
      });
      
      return crate.life > 0;
    });
    
    this.gameState.healthCrates = this.gameState.healthCrates.filter(crate => {
      crate.life -= 0.016;
      
      this.gameState.players.forEach(player => {
        if (player.inVehicle || player.health <= 0) return;
        
        const dx = player.x - crate.x;
        const dy = player.y - crate.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.radius + crate.radius) {
          player.health = player.maxHealth;
          player.heatExposure = 0;
          return false;
        }
      });
      
      return crate.life > 0;
    });
  }
  
  updateExplosions(deltaTime) {
    this.gameState.explosions = this.gameState.explosions.filter(exp => {
      exp.life -= deltaTime;
      exp.radius += (exp.maxRadius - exp.radius) * 0.15;
      return exp.life > 0;
    });
  }
  
  updateParticles(deltaTime) {
    this.gameState.particles = this.gameState.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life -= deltaTime;
      return p.life > 0;
    });
  }
  
  checkWaveCompletion() {
    if (this.gameState.enemies.length === 0 && this.gameState.status === 'playing') {
      this.gameState.wave++;
      this.gameState.hydration = Math.min(100, this.gameState.hydration + 30);
      setTimeout(() => this.spawnWave(), 2500);
    }
  }
  
  getPlayerInput(name) {
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  render() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#e67e22');
    gradient.addColorStop(0.5, '#d35400');
    gradient.addColorStop(1, '#a04000');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawDunes();
    this.drawSandstorms();
    this.drawCrates();
    this.drawEnemies();
    this.drawPlayers();
    this.drawBullets();
    this.drawExplosions();
    this.drawParticles();
    this.drawUI();
    
    if (this.gameState.status === 'gameover') {
      this.drawGameOver();
    }
  }
  
  drawDunes() {
    this.ctx.fillStyle = '#d68910';
    for (let i = 0; i < 8; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * 150 - 50, this.canvas.height - 80);
      this.ctx.quadraticCurveTo(i * 150 + 25, this.canvas.height - 150, i * 150 + 100, this.canvas.height - 80);
      this.ctx.lineTo(i * 150 + 100, this.canvas.height);
      this.ctx.lineTo(i * 150 - 50, this.canvas.height);
      this.ctx.fill();
    }
  }
  
  drawSandstorms() {
    this.gameState.sandstorms.forEach(storm => {
      const gradient = this.ctx.createLinearGradient(storm.x, 0, storm.x + storm.width, 0);
      gradient.addColorStop(0, 'rgba(210, 105, 30, 0.4)');
      gradient.addColorStop(0.5, 'rgba(210, 105, 30, 0.7)');
      gradient.addColorStop(1, 'rgba(210, 105, 30, 0.4)');
      
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(storm.x, 0, storm.width, this.canvas.height);
    });
  }
  
  drawCrates() {
    this.gameState.ammoCrates.forEach(crate => {
      this.ctx.fillStyle = '#8b4513';
      this.ctx.beginPath();
      this.ctx.arc(crate.x, crate.y, crate.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('A', crate.x, crate.y + 4);
    });
    
    this.gameState.healthCrates.forEach(crate => {
      this.ctx.fillStyle = '#c0392b';
      this.ctx.beginPath();
      this.ctx.arc(crate.x, crate.y, crate.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('+', crate.x, crate.y + 4);
    });
  }
  
  drawEnemies() {
    this.gameState.enemies.forEach(enemy => {
      this.ctx.fillStyle = enemy.color;
      
      if (enemy.type === 'helicopter') {
        this.ctx.beginPath();
        this.ctx.ellipse(enemy.x, enemy.y, enemy.radius, enemy.radius * 0.6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(enemy.x - 30, enemy.y, 60, 4);
        
        for (let i = 0; i < 4; i++) {
          this.ctx.fillRect(enemy.x - 25 + i * 15, enemy.y - 5, 10, 2);
        }
      } else if (enemy.type === 'tank') {
        this.ctx.fillRect(enemy.x - 40, enemy.y - 25, 80, 40);
        this.ctx.fillStyle = '#2c2c2c';
        this.ctx.fillRect(enemy.x + 30, enemy.y - 8, 25, 16);
      } else if (enemy.type === 'jeep') {
        this.ctx.fillRect(enemy.x - 25, enemy.y - 15, 50, 25);
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.beginPath();
        this.ctx.arc(enemy.x - 15, enemy.y + 10, 8, 0, Math.PI * 2);
        this.ctx.arc(enemy.x + 15, enemy.y + 10, 8, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        this.ctx.beginPath();
        this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      if (enemy.hitStun > 0) {
        this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
        this.ctx.beginPath();
        this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      const healthPercent = enemy.health / enemy.maxHealth;
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.fillRect(enemy.x - 20, enemy.y - enemy.radius - 10, 40, 5);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(enemy.x - 20, enemy.y - enemy.radius - 10, 40 * healthPercent, 5);
    });
  }
  
  drawPlayers() {
    this.gameState.players.forEach(player => {
      if (player.health <= 0 || player.inVehicle) return;
      
      this.ctx.fillStyle = player.color;
      this.ctx.beginPath();
      this.ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#d35400';
      this.ctx.fillRect(player.x - 8, player.y - 25, 16, 4);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '9px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(player.name.substring(0, 4), player.x, player.y - player.radius - 5);
    });
  }
  
  drawBullets() {
    this.gameState.bullets.forEach(bullet => {
      if (bullet.isGrenade) {
        this.ctx.fillStyle = '#27ae60';
      } else {
        this.ctx.fillStyle = bullet.fromPlayer ? '#f1c40f' : '#e74c3c';
      }
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawExplosions() {
    this.gameState.explosions.forEach(exp => {
      const gradient = this.ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
      gradient.addColorStop(0, 'rgba(241, 196, 15, 0.9)');
      gradient.addColorStop(0.4, 'rgba(230, 126, 34, 0.7)');
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
    this.ctx.fillRect(10, 10, 180, 100);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Wave: ${this.gameState.wave}`, 20, 30);
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 50);
    this.ctx.fillText(`Enemies: ${this.gameState.enemies.length}`, 20, 70);
    
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillText(`Hydration: ${Math.floor(this.gameState.hydration)}%`, 20, 90);
    
    this.gameState.players.forEach((player, i) => {
      if (player.inVehicle) return;
      
      const y = this.canvas.height - 70 - i * 45;
      
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(10, y, 160, 40);
      
      this.ctx.fillStyle = player.color;
      this.ctx.font = '12px Arial';
      this.ctx.fillText(player.name, 20, y + 15);
      
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.fillRect(20, y + 22, 100, 8);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(20, y + 22, 100 * (player.health / player.maxHealth), 8);
      
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.fillText(`Am: ${player.ammo} | G: ${player.grenades}`, 90, y + 15);
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

window.DesertCommandoGame = DesertCommandoGame;