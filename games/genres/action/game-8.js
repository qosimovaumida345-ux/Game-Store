// War Zone - Intense Combat Action Game
class WarZoneGame {
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
      territory: 50,
      players: [],
      enemies: [],
      airSupport: [],
      artillery: [],
      supplyDrops: [],
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
        y: this.canvas.height - 150,
        vx: 0,
        vy: 0,
        speed: 5,
        radius: 18,
        health: 100,
        maxHealth: 100,
        ammo: 25,
        maxAmmo: 25,
        kills: 0,
        callSupportCooldown: 0,
        color: ['#c0392b', '#2980b9', '#e67e22', '#9b59b6'][i % 4]
      });
    });
    
    this.spawnSupplyDrops(3);
    this.spawnWave();
  }
  
  spawnSupplyDrops(count) {
    for (let i = 0; i < count; i++) {
      this.gameState.supplyDrops.push({
        x: 150 + Math.random() * (this.canvas.width - 300),
        y: 100 + Math.random() * 300,
        falling: true,
        vy: 2,
        radius: 20,
        lifetime: 15
      });
    }
  }
  
  spawnWave() {
    const enemyCount = 4 + this.gameState.wave * 2;
    
    for (let i = 0; i < enemyCount; i++) {
      const types = ['soldier', 'heavy', 'sniper', 'officer', 'tank'];
      const type = types[Math.min(Math.floor(Math.random() * types.length), Math.min(this.gameState.wave - 1, 4))];
      
      this.gameState.enemies.push(this.createEnemy(type));
    }
  }
  
  createEnemy(type) {
    const side = Math.random() > 0.5 ? 1 : -1;
    const baseEnemy = {
      x: side > 0 ? this.canvas.width + 40 : -40,
      y: this.canvas.height - 150,
      vx: 0,
      vy: 0,
      radius: 18,
      health: 50 + this.gameState.wave * 20,
      maxHealth: 50 + this.gameState.wave * 20,
      damage: 12 + this.gameState.wave * 4,
      speed: 2 + Math.random(),
      type: type,
      attackCooldown: 0,
      hitStun: 0,
      color: this.getEnemyColor(type),
      reward: 100 + this.gameState.wave * 50
    };
    
    switch(type) {
      case 'soldier':
        Object.assign(baseEnemy, { range: 180, fireRate: 1.2 });
        break;
      case 'heavy':
        Object.assign(baseEnemy, { range: 150, fireRate: 2, health: baseEnemy.health * 2, speed: baseEnemy.speed * 0.7 });
        break;
      case 'sniper':
        Object.assign(baseEnemy, { range: 450, fireRate: 3.5, damage: baseEnemy.damage * 2.5 });
        break;
      case 'officer':
        Object.assign(baseEnemy, { range: 200, fireRate: 1, canBoost: true, reward: baseEnemy.reward * 1.5 });
        break;
      case 'tank':
        Object.assign(baseEnemy, { range: 250, fireRate: 2.5, health: baseEnemy.health * 5, speed: baseEnemy.speed * 0.4, radius: 35 });
        break;
    }
    
    return baseEnemy;
  }
  
  getEnemyColor(type) {
    const colors = {
      soldier: '#5d6d7e',
      heavy: '#7f8c8d',
      sniper: '#34495e',
      officer: '#c0392b',
      tank: '#2c3e50'
    };
    return colors[type] || '#5d6d7e';
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
    this.updateBullets(deltaTime);
    this.updateEnemies(deltaTime);
    this.updateSupplyDrops(deltaTime);
    this.updateAirSupport(deltaTime);
    this.updateArtillery(deltaTime);
    this.updateExplosions(deltaTime);
    this.updateParticles(deltaTime);
    this.checkWaveCompletion();
    this.updateTerritory();
    
    if (this.gameState.players.every(p => p.health <= 0)) {
      this.gameState.status = 'gameover';
    }
  }
  
  handlePlayerInput() {
    this.gameState.players.forEach(player => {
      const input = this.getPlayerInput(player.name);
      
      let moveX = 0;
      if (input.left) moveX -= 1;
      if (input.right) moveX += 1;
      
      player.vx = moveX * player.speed;
      
      if (input.up) player.vy = -player.speed * 0.7;
      else if (input.down) player.vy = player.speed * 0.7;
      else player.vy = 0;
      
      if (input.action && player.ammo > 0) {
        this.fireBullet(player);
        player.ammo--;
      }
      
      if (input.special && player.callSupportCooldown <= 0) {
        this.callAirSupport(player);
        player.callSupportCooldown = 15;
      }
      
      if (player.callSupportCooldown > 0) {
        player.callSupportCooldown -= 0.016;
      }
    });
  }
  
  fireBullet(player) {
    const target = this.findNearestEnemy(player);
    let vx = player.vx > 0 ? 16 : -16;
    let vy = 0;
    
    if (target) {
      const angle = Math.atan2(target.y - player.y, target.x - player.x);
      vx = Math.cos(angle) * 16;
      vy = Math.sin(angle) * 16;
    }
    
    this.gameState.bullets.push({
      x: player.x,
      y: player.y - 10,
      vx: vx,
      vy: vy,
      radius: 3,
      damage: 20 + this.gameState.wave * 4,
      fromPlayer: true,
      playerName: player.name
    });
  }
  
  callAirSupport(player) {
    this.gameState.airSupport.push({
      x: player.x,
      y: 0,
      vy: 15,
      type: 'airstrike',
      radius: 100,
      damage: 80,
      active: true
    });
    
    for (let i = 0; i < 20; i++) {
      this.gameState.particles.push({
        x: player.x, y: 0,
        vx: (Math.random() - 0.5) * 5,
        vy: 5,
        life: 1,
        color: '#3498db',
        size: 4
      });
    }
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
        return;
      }
      
      const targetPlayer = this.findTargetPlayer(enemy);
      if (!targetPlayer) return;
      
      const dx = targetPlayer.x - enemy.x;
      const dy = targetPlayer.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < enemy.range && enemy.attackCooldown <= 0) {
        this.enemyFire(enemy, targetPlayer);
        enemy.attackCooldown = enemy.fireRate;
      } else if (dist < enemy.range * 1.3) {
        enemy.vx = Math.sign(dx) * enemy.speed;
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
    const spread = (Math.random() - 0.5) * 0.15;
    
    this.gameState.bullets.push({
      x: enemy.x,
      y: enemy.y - 10,
      vx: Math.cos(angle + spread) * 12,
      vy: Math.sin(angle + spread) * 12,
      radius: 3,
      damage: enemy.damage,
      fromPlayer: false
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
            enemy.hitStun = 0.2;
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
          if (player.health <= 0) return;
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
        this.gameState.territory = Math.min(100, this.gameState.territory + 5);
        
        this.gameState.players.forEach(p => {
          if (p.name === enemy.playerName) {
            p.kills++;
          }
        });
        
        for (let i = 0; i < 18; i++) {
          this.gameState.particles.push({
            x: enemy.x, y: enemy.y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 0.7,
            color: enemy.color,
            size: 4
          });
        }
        return false;
      }
      return true;
    });
  }
  
  updateSupplyDrops(deltaTime) {
    this.gameState.supplyDrops = this.gameState.supplyDrops.filter(drop => {
      if (drop.falling) {
        drop.y += drop.vy;
        if (drop.y > this.canvas.height - 120) {
          drop.falling = false;
        }
      } else {
        drop.lifetime -= deltaTime;
        
        this.gameState.players.forEach(player => {
          if (player.health <= 0) return;
          const dx = player.x - drop.x;
          const dy = player.y - drop.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < player.radius + drop.radius) {
            player.health = player.maxHealth;
            player.ammo = player.maxAmmo;
            drop.lifetime = 0;
            
            for (let i = 0; i < 15; i++) {
              this.gameState.particles.push({
                x: drop.x, y: drop.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 0.6,
                color: '#2ecc71',
                size: 4
              });
            }
          }
        });
      }
      
      return drop.lifetime > 0;
    });
  }
  
  updateAirSupport(deltaTime) {
    this.gameState.airSupport = this.gameState.airSupport.filter(support => {
      support.y += support.vy;
      
      if (support.active && support.y > 100) {
        this.createExplosion(support.x, support.y, support.radius, support.damage);
        support.active = false;
      }
      
      return support.y < this.canvas.height + 50;
    });
  }
  
  updateArtillery(deltaTime) {
    this.gameState.artillery = this.gameState.artillery.filter(art => {
      art.life -= deltaTime;
      
      if (art.life < 0.1 && art.active) {
        this.createExplosion(art.x, art.y, 60, 50);
        art.active = false;
      }
      
      return art.life > 0;
    });
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
    
    this.gameState.players.forEach(player => {
      const dx = player.x - x;
      const dy = player.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < radius) {
        player.health -= damage * (1 - dist / radius) * 0.3;
      }
    });
    
    for (let i = 0; i < 35; i++) {
      this.gameState.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.5) * 18,
        life: 0.9,
        color: ['#e74c3c', '#f39c12', '#e67e22'][Math.floor(Math.random() * 3)],
        size: 5 + Math.random() * 7
      });
    }
  }
  
  updateExplosions(deltaTime) {
    this.gameState.explosions = this.gameState.explosions.filter(exp => {
      exp.life -= deltaTime;
      exp.radius += (exp.maxRadius - exp.radius) * 0.18;
      return exp.life > 0;
    });
  }
  
  updateParticles(deltaTime) {
    this.gameState.particles = this.gameState.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
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
  
  updateTerritory() {
    this.gameState.territory = Math.max(0, Math.min(100, this.gameState.territory));
  }
  
  getPlayerInput(name) {
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  render() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#2c3e50');
    gradient.addColorStop(1, '#1a252f');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawBackground();
    this.drawSupplyDrops();
    this.drawEnemies();
    this.drawPlayers();
    this.drawBullets();
    this.drawAirSupport();
    this.drawExplosions();
    this.drawParticles();
    this.drawUI();
    
    if (this.gameState.status === 'gameover') {
      this.drawGameOver();
    }
  }
  
  drawBackground() {
    this.ctx.fillStyle = '#1a1a1a';
    for (let i = 0; i < 12; i++) {
      this.ctx.fillRect(30 + i * 70, 30, 50, this.canvas.height - 130);
    }
    
    this.ctx.fillStyle = '#2d3436';
    this.ctx.fillRect(0, this.canvas.height - 100, this.canvas.width, 100);
  }
  
  drawSupplyDrops() {
    this.gameState.supplyDrops.forEach(drop => {
      this.ctx.fillStyle = '#27ae60';
      this.ctx.beginPath();
      this.ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('+', drop.x, drop.y + 5);
    });
  }
  
  drawEnemies() {
    this.gameState.enemies.forEach(enemy => {
      this.ctx.fillStyle = enemy.color;
      
      if (enemy.type === 'tank') {
        this.ctx.fillRect(enemy.x - 30, enemy.y - 20, 60, 35);
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(enemy.x + 20, enemy.y - 8, 25, 12);
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
      
      this.ctx.fillStyle = player.color;
      this.ctx.beginPath();
      this.ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#95a5a6';
      this.ctx.font = '10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(player.name.substring(0, 5), player.x, player.y - player.radius - 5);
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
  
  drawAirSupport() {
    this.gameState.airSupport.forEach(support => {
      this.ctx.fillStyle = '#3498db';
      this.ctx.fillRect(support.x - 40, support.y - 5, 80, 10);
      
      this.ctx.fillStyle = '#2980b9';
      this.ctx.beginPath();
      this.ctx.moveTo(support.x - 30, support.y - 5);
      this.ctx.lineTo(support.x - 50, support.y - 20);
      this.ctx.lineTo(support.x - 30, support.y - 5);
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
    
    this.ctx.fillStyle = this.gameState.territory > 50 ? '#27ae60' : '#e74c3c';
    this.ctx.fillText(`Territory: ${this.gameState.territory}%`, 120, 30);
    
    this.gameState.players.forEach((player, i) => {
      const y = this.canvas.height - 60 - i * 45;
      
      this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
      this.ctx.fillRect(10, y, 170, 40);
      
      this.ctx.fillStyle = player.color;
      this.ctx.font = '12px Arial';
      this.ctx.fillText(`${player.name} (${player.kills})`, 20, y + 15);
      
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.fillRect(20, y + 22, 100, 8);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(20, y + 22, 100 * (player.health / player.maxHealth), 8);
      
      this.ctx.fillStyle = player.callSupportCooldown <= 0 ? '#2ecc71' : '#95a5a6';
      this.ctx.fillText(`A: ${player.ammo}`, 130, y + 15);
    });
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.9)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 60px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('DEFEAT', this.canvas.width / 2, this.canvas.height / 2 - 40);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Territory: ${this.gameState.territory}%`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    this.ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 60);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.WarZoneGame = WarZoneGame;