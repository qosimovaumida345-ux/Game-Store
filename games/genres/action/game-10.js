// Combat Zone - Intense Battle Action Game
class CombatZoneGame {
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
      heat: 0,
      players: [],
      enemies: [],
      powerups: [],
      rockets: [],
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
        x: 100 + i * 100,
        y: this.canvas.height - 140,
        vx: 0,
        vy: 0,
        speed: 5.5,
        radius: 18,
        health: 100,
        maxHealth: 100,
        ammo: 30,
        maxAmmo: 30,
        rockets: 3,
        maxRockets: 3,
        heatLevel: 0,
        overheat: false,
        lastShot: 0,
        color: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'][i % 4]
      });
    });
    
    this.spawnWave();
    this.spawnPowerups(4);
  }
  
  spawnPowerups(count) {
    const types = ['health', 'ammo', 'rocket', 'cooling'];
    for (let i = 0; i < count; i++) {
      this.gameState.powerups.push({
        x: 150 + Math.random() * (this.canvas.width - 300),
        y: 100 + Math.random() * 300,
        type: types[Math.floor(Math.random() * types.length)],
        radius: 15,
        lifetime: 20
      });
    }
  }
  
  spawnWave() {
    const enemyCount = 4 + this.gameState.wave * 2;
    
    for (let i = 0; i < enemyCount; i++) {
      const types = ['grunt', 'heavy', 'assassin', 'mech', 'boss'];
      const type = types[Math.min(Math.floor(Math.random() * types.length), Math.min(this.gameState.wave - 1, 4))];
      
      this.gameState.enemies.push(this.createEnemy(type));
    }
  }
  
  createEnemy(type) {
    const side = Math.random() > 0.5 ? 1 : -1;
    const baseEnemy = {
      x: side > 0 ? this.canvas.width + 50 : -50,
      y: this.canvas.height - 140,
      vx: 0,
      vy: 0,
      radius: 20,
      health: 60 + this.gameState.wave * 25,
      maxHealth: 60 + this.gameState.wave * 25,
      damage: 15 + this.gameState.wave * 5,
      speed: 2.5 + Math.random(),
      type: type,
      attackCooldown: 0,
      hitStun: 0,
      color: this.getEnemyColor(type),
      reward: 150 + this.gameState.wave * 75
    };
    
    switch(type) {
      case 'grunt':
        Object.assign(baseEnemy, { range: 180, fireRate: 1 });
        break;
      case 'heavy':
        Object.assign(baseEnemy, { range: 150, fireRate: 1.8, health: baseEnemy.health * 2, speed: baseEnemy.speed * 0.6 });
        break;
      case 'assassin':
        Object.assign(baseEnemy, { range: 80, fireRate: 0.4, speed: baseEnemy.speed * 2, health: baseEnemy.health * 0.6 });
        break;
      case 'mech':
        Object.assign(baseEnemy, { range: 250, fireRate: 2.5, health: baseEnemy.health * 4, speed: baseEnemy.speed * 0.4, radius: 35 });
        break;
      case 'boss':
        Object.assign(baseEnemy, { range: 200, fireRate: 1.2, health: baseEnemy.health * 3, speed: baseEnemy.speed * 0.8, reward: baseEnemy.reward * 3 });
        break;
    }
    
    return baseEnemy;
  }
  
  getEnemyColor(type) {
    const colors = {
      grunt: '#6c5ce7',
      heavy: '#a29bfe',
      assassin: '#fd79a8',
      mech: '#636e72',
      boss: '#d63031'
    };
    return colors[type] || '#6c5ce7';
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
    this.gameState.heat += deltaTime * 2;
    
    this.handlePlayerInput();
    this.updatePhysics(deltaTime);
    this.updateHeat();
    this.handleShooting();
    this.updateRockets(deltaTime);
    this.updateBullets(deltaTime);
    this.updateEnemies(deltaTime);
    this.updatePowerups(deltaTime);
    this.updateExplosions(deltaTime);
    this.updateParticles(deltaTime);
    this.checkWaveCompletion();
    
    if (this.gameState.players.every(p => p.health <= 0)) {
      this.gameState.status = 'gameover';
    }
  }
  
  handlePlayerInput() {
    this.gameState.players.forEach(player => {
      if (player.overheat) return;
      
      const input = this.getPlayerInput(player.name);
      
      let moveX = 0;
      if (input.left) moveX -= 1;
      if (input.right) moveX += 1;
      
      player.vx = moveX * player.speed;
      
      if (input.up) player.vy = -player.speed * 0.7;
      else if (input.down) player.vy = player.speed * 0.7;
      else player.vy = 0;
      
      if (input.action && player.ammo > 0 && this.gameState.time - player.lastShot > 0.08) {
        this.fireBullet(player);
        player.ammo--;
        player.heatLevel += 2;
        player.lastShot = this.gameState.time;
      }
      
      if (input.special && player.rockets > 0) {
        this.fireRocket(player);
        player.rockets--;
      }
    });
  }
  
  fireBullet(player) {
    const target = this.findNearestEnemy(player);
    let vx = player.vx > 0 ? 18 : -18;
    let vy = 0;
    
    if (target) {
      const angle = Math.atan2(target.y - player.y, target.x - player.x);
      vx = Math.cos(angle) * 18;
      vy = Math.sin(angle) * 18;
    }
    
    this.gameState.bullets.push({
      x: player.x,
      y: player.y,
      vx: vx,
      vy: vy,
      radius: 3,
      damage: 18 + this.gameState.wave * 4,
      fromPlayer: true
    });
  }
  
  fireRocket(player) {
    const target = this.findNearestEnemy(player);
    let vx = player.vx > 0 ? 10 : -10;
    let vy = 0;
    
    if (target) {
      const angle = Math.atan2(target.y - player.y, target.x - player.x);
      vx = Math.cos(angle) * 10;
      vy = Math.sin(angle) * 10;
    }
    
    this.gameState.rockets.push({
      x: player.x,
      y: player.y,
      vx: vx,
      vy: vy,
      radius: 8,
      damage: 100 + this.gameState.wave * 20,
      fromPlayer: true
    });
  }
  
  updateHeat() {
    this.gameState.players.forEach(player => {
      if (!player.overheat) {
        player.heatLevel = Math.max(0, player.heatLevel - 0.5);
        
        if (player.heatLevel >= 100) {
          player.overheat = true;
          player.heatLevel = 100;
        }
      } else {
        player.heatLevel = Math.max(0, player.heatLevel - 2);
        
        if (player.heatLevel <= 0) {
          player.overheat = false;
        }
      }
    });
  }
  
  findNearestEnemy(player) {
    let nearest = null;
    let minDist = Infinity;
    
    this.gameState.enemies.forEach(enemy => {
      if (enemy.health <= 0) return;
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    });
    
    return nearest;
  }
  
  updatePhysics(deltaTime) {
    const groundY = this.canvas.height - 100;
    
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
      } else if (dist < enemy.range * 1.4) {
        enemy.vx = Math.sign(dx) * enemy.speed;
      }
    });
  }
  
  findTargetPlayer(enemy) {
    let target = null;
    let minDist = Infinity;
    
    this.gameState.players.forEach(player => {
      if (player.health <= 0 || player.overheat) return;
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
      vx: Math.cos(angle) * 11,
      vy: Math.sin(angle) * 11,
      radius: 3,
      damage: enemy.damage,
      fromPlayer: false
    });
  }
  
  updateRockets(deltaTime) {
    this.gameState.rockets = this.gameState.rockets.filter(rocket => {
      rocket.x += rocket.vx;
      rocket.y += rocket.vy;
      
      this.gameState.enemies.forEach(enemy => {
        const dx = enemy.x - rocket.x;
        const dy = enemy.y - rocket.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < enemy.radius + rocket.radius + 20) {
          this.createExplosion(rocket.x, rocket.y, 80, rocket.damage);
          return false;
        }
      });
      
      if (rocket.x < 0 || rocket.x > this.canvas.width || rocket.y < 0 || rocket.y > this.canvas.height) {
        this.createExplosion(rocket.x, rocket.y, 60, rocket.damage * 0.5);
        return false;
      }
      
      return true;
    });
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
          if (enemy.health <= 0) return;
          const dx = enemy.x - bullet.x;
          const dy = enemy.y - bullet.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < enemy.radius + bullet.radius) {
            enemy.health -= bullet.damage;
            enemy.hitStun = 0.15;
            this.gameState.score += bullet.damage;
            
            for (let i = 0; i < 6; i++) {
              this.gameState.particles.push({
                x: bullet.x, y: bullet.y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 0.3,
                color: '#e74c3c',
                size: 2
              });
            }
            return false;
          }
        });
      } else {
        this.gameState.players.forEach(player => {
          if (player.health <= 0 || player.overheat) return;
          const dx = player.x - bullet.x;
          const dy = player.y - bullet.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < player.radius + bullet.radius) {
            player.health -= bullet.damage;
            return false;
          }
        });
      }
      
      return true;
    });
  }
  
  updateEnemies(deltaTime) {
    this.gameState.enemies = this.gameState.enemies.filter(enemy => {
      if (enemy.health <= 0) {
        this.gameState.score += enemy.reward;
        
        if (Math.random() > 0.6) {
          this.spawnPowerupAt(enemy.x, enemy.y);
        }
        
        for (let i = 0; i < 20; i++) {
          this.gameState.particles.push({
            x: enemy.x, y: enemy.y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 0.8,
            color: enemy.color,
            size: 4
          });
        }
        return false;
      }
      return true;
    });
  }
  
  spawnPowerupAt(x, y) {
    const types = ['health', 'ammo', 'rocket', 'cooling'];
    this.gameState.powerups.push({
      x, y,
      type: types[Math.floor(Math.random() * types.length)],
      radius: 15,
      lifetime: 15
    });
  }
  
  updatePowerups(deltaTime) {
    this.gameState.powerups = this.gameState.powerups.filter(powerup => {
      powerup.lifetime -= deltaTime;
      
      this.gameState.players.forEach(player => {
        if (player.health <= 0) return;
        
        const dx = player.x - powerup.x;
        const dy = player.y - powerup.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.radius + powerup.radius) {
          this.applyPowerup(player, powerup);
          return false;
        }
      });
      
      return powerup.lifetime > 0;
    });
  }
  
  applyPowerup(player, powerup) {
    switch(powerup.type) {
      case 'health':
        player.health = player.maxHealth;
        break;
      case 'ammo':
        player.ammo = player.maxAmmo;
        break;
      case 'rocket':
        player.rockets = Math.min(player.maxRockets, player.rockets + 2);
        break;
      case 'cooling':
        player.heatLevel = 0;
        player.overheat = false;
        break;
    }
    
    for (let i = 0; i < 15; i++) {
      this.gameState.particles.push({
        x: player.x, y: player.y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 0.6,
        color: '#2ecc71',
        size: 4
      });
    }
  }
  
  createExplosion(x, y, radius, damage) {
    this.gameState.explosions.push({
      x, y,
      radius: 0,
      maxRadius: radius,
      life: 0.7
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
        color: ['#e74c3c', '#f39c12', '#e67e22', '#ff7675'][Math.floor(Math.random() * 4)],
        size: 5 + Math.random() * 8
      });
    }
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
      p.vy += 0.15;
      p.life -= deltaTime;
      return p.life > 0;
    });
  }
  
  checkWaveCompletion() {
    if (this.gameState.enemies.length === 0 && this.gameState.status === 'playing') {
      this.gameState.wave++;
      setTimeout(() => this.spawnWave(), 2500);
    }
  }
  
  getPlayerInput(name) {
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#1e1e1e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawBackground();
    this.drawPowerups();
    this.drawEnemies();
    this.drawPlayers();
    this.drawBullets();
    this.drawRockets();
    this.drawExplosions();
    this.drawParticles();
    this.drawUI();
    
    if (this.gameState.status === 'gameover') {
      this.drawGameOver();
    }
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#2d3436');
    gradient.addColorStop(1, '#1e1e1e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    for (let i = 0; i < 15; i++) {
      this.ctx.fillStyle = '#636e72';
      this.ctx.fillRect(40 + i * 55, 40, 40, this.canvas.height - 140);
    }
  }
  
  drawPowerups() {
    this.gameState.powerups.forEach(powerup => {
      const color = {
        health: '#e74c3c',
        ammo: '#f1c40f',
        rocket: '#e67e22',
        cooling: '#3498db'
      }[powerup.type] || '#fff';
      
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(powerup.x, powerup.y, powerup.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(powerup.type[0].toUpperCase(), powerup.x, powerup.y + 4);
    });
  }
  
  drawEnemies() {
    this.gameState.enemies.forEach(enemy => {
      this.ctx.fillStyle = enemy.color;
      
      if (enemy.type === 'mech') {
        this.ctx.fillRect(enemy.x - 30, enemy.y - 25, 60, 45);
      } else if (enemy.type === 'boss') {
        this.ctx.beginPath();
        this.ctx.arc(enemy.x, enemy.y, 30, 0, Math.PI * 2);
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
    });
  }
  
  drawPlayers() {
    this.gameState.players.forEach(player => {
      if (player.health <= 0) return;
      
      if (player.overheat) {
        this.ctx.globalAlpha = 0.5;
      }
      
      this.ctx.fillStyle = player.color;
      this.ctx.beginPath();
      this.ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      if (player.overheat) {
        this.ctx.strokeStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, player.radius + 10, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      
      this.ctx.globalAlpha = 1;
    });
  }
  
  drawBullets() {
    this.gameState.bullets.forEach(bullet => {
      this.ctx.fillStyle = bullet.fromPlayer ? '#f39c12' : '#e74c3c';
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawRockets() {
    this.gameState.rockets.forEach(rocket => {
      this.ctx.fillStyle = '#e67e22';
      this.ctx.beginPath();
      this.ctx.arc(rocket.x, rocket.y, rocket.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#f39c12';
      this.ctx.beginPath();
      this.ctx.arc(rocket.x - 3, rocket.y - 3, 4, 0, Math.PI * 2);
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
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, 10, 200, 100);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Wave: ${this.gameState.wave}`, 20, 30);
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 50);
    this.ctx.fillText(`Enemies: ${this.gameState.enemies.length}`, 20, 70);
    
    this.ctx.fillStyle = this.gameState.heat < 70 ? '#27ae60' : '#e74c3c';
    this.ctx.fillText(`Heat: ${Math.floor(this.gameState.heat)}%`, 120, 30);
    
    this.gameState.players.forEach((player, i) => {
      const y = this.canvas.height - 70 - i * 55;
      
      this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
      this.ctx.fillRect(10, y, 180, 50);
      
      this.ctx.fillStyle = player.color;
      this.ctx.font = '12px Arial';
      this.ctx.fillText(player.name, 20, y + 15);
      
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.fillRect(20, y + 22, 100, 8);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(20, y + 22, 100 * (player.health / player.maxHealth), 8);
      
      this.ctx.fillStyle = player.overheat ? '#e74c3c' : '#f39c12';
      this.ctx.fillRect(20, y + 34, player.heatLevel, 4);
      
      this.ctx.fillStyle = '#95a5a6';
      this.ctx.fillText(`Am:${player.ammo} R:${player.rockets}`, 130, y + 15);
    });
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.9)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 60px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 40);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.CombatZoneGame = CombatZoneGame;