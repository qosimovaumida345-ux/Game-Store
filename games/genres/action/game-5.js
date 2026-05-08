// City Siege - Urban Siege Warfare Action Game
class CitySiegeGame {
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
      siegeProgress: 0,
      players: [],
      defenders: [],
      attackers: [],
      barricades: [],
      vehicles: [],
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
    this.createSiegeMap();
    
    this.players.forEach((p, i) => {
      this.gameState.players.push({
        name: p,
        x: 80 + i * 100,
        y: this.canvas.height - 150,
        vx: 0,
        vy: 0,
        speed: 4,
        radius: 18,
        health: 100,
        maxHealth: 100,
        ammo: 30,
        maxAmmo: 30,
        weapon: 'assault',
        lastShot: 0,
        barricadeHealth: 0,
        color: ['#c0392b', '#2980b9', '#16a085', '#8e44ad'][i % 4]
      });
    });
    
    this.spawnDefenders(5);
    this.spawnWave();
  }
  
  createSiegeMap() {
    for (let i = 0; i < 8; i++) {
      this.gameState.barricades.push({
        x: 200 + i * 80,
        y: this.canvas.height - 120,
        width: 40,
        height: 60,
        health: 100,
        maxHealth: 100
      });
    }
    
    this.gameState.vehicles.push(
      { x: 100, y: this.canvas.height - 160, type: 'tank', health: 300, maxHealth: 300, active: true },
      { x: this.canvas.width - 100, y: this.canvas.height - 160, type: 'apc', health: 200, maxHealth: 200, active: true }
    );
  }
  
  spawnDefenders(count) {
    for (let i = 0; i < count; i++) {
      this.gameState.defenders.push({
        x: 300 + Math.random() * (this.canvas.width - 600),
        y: this.canvas.height - 150,
        vx: 0,
        radius: 15,
        health: 50 + this.gameState.wave * 15,
        maxHealth: 50 + this.gameState.wave * 15,
        damage: 10 + this.gameState.wave * 3,
        attackCooldown: 0,
        type: 'soldier'
      });
    }
  }
  
  spawnWave() {
    const count = 2 + this.gameState.wave * 2;
    
    for (let i = 0; i < count; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      
      this.gameState.attackers.push({
        x: side > 0 ? this.canvas.width + 30 : -30,
        y: this.canvas.height - 150,
        vx: 0,
        radius: 15,
        health: 40 + this.gameState.wave * 10,
        maxHealth: 40 + this.gameState.wave * 10,
        damage: 8 + this.gameState.wave * 2,
        speed: 2 + Math.random(),
        attackCooldown: 0,
        type: 'militant'
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
    
    this.handlePlayerInput();
    this.updatePhysics(deltaTime);
    this.handleShooting();
    this.updateBullets(deltaTime);
    this.updateDefenders(deltaTime);
    this.updateAttackers(deltaTime);
    this.updateBarricades();
    this.updateVehicles();
    this.updateExplosions(deltaTime);
    this.updateParticles(deltaTime);
    this.checkWaveCompletion();
    this.checkVictoryCondition();
    
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
      
      if (input.action && player.ammo > 0 && this.gameState.time - player.lastShot > 0.1) {
        this.fireBullet(player);
        player.ammo--;
        player.lastShot = this.gameState.time;
      }
    });
  }
  
  fireBullet(player) {
    const target = this.findNearestEnemy(player);
    let vx = player.vx > 0 ? 15 : -15;
    let vy = 0;
    
    if (target) {
      const angle = Math.atan2(target.y - player.y, target.x - player.x);
      vx = Math.cos(angle) * 15;
      vy = Math.sin(angle) * 15;
    }
    
    this.gameState.bullets.push({
      x: player.x,
      y: player.y - 10,
      vx: vx,
      vy: vy,
      radius: 3,
      damage: 15 + this.gameState.wave * 3,
      fromPlayer: true,
      playerName: player.name
    });
  }
  
  findNearestEnemy(player) {
    let nearest = null;
    let minDist = Infinity;
    
    [...this.gameState.defenders, ...this.gameState.attackers].forEach(enemy => {
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
  }
  
  handleShooting() {
    this.gameState.defenders.forEach(defender => {
      if (defender.attackCooldown > 0) {
        defender.attackCooldown -= 0.016;
        return;
      }
      
      const targetPlayer = this.findNearestTarget(defender);
      if (!targetPlayer) return;
      
      const dx = targetPlayer.x - defender.x;
      const dy = targetPlayer.y - defender.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 250) {
        this.fireEnemyBullet(defender, targetPlayer);
        defender.attackCooldown = 1.2;
      }
    });
    
    this.gameState.attackers.forEach(attacker => {
      if (attacker.attackCooldown > 0) {
        attacker.attackCooldown -= 0.016;
      }
      
      const targetPlayer = this.findNearestTarget(attacker);
      if (!targetPlayer) return;
      
      const dx = targetPlayer.x - attacker.x;
      const dy = targetPlayer.y - attacker.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 200 && attacker.attackCooldown <= 0) {
        this.fireEnemyBullet(attacker, targetPlayer);
        attacker.attackCooldown = 1;
      } else if (dist > 180) {
        attacker.vx = Math.sign(dx) * attacker.speed;
      } else {
        attacker.vx = 0;
      }
    });
  }
  
  findNearestTarget(unit) {
    let target = null;
    let minDist = Infinity;
    
    this.gameState.players.forEach(player => {
      if (player.health <= 0) return;
      const dx = player.x - unit.x;
      const dy = player.y - unit.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        target = player;
      }
    });
    
    return target;
  }
  
  fireEnemyBullet(enemy, target) {
    const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
    const spread = (Math.random() - 0.5) * 0.2;
    
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
        [...this.gameState.defenders, ...this.gameState.attackers].forEach(enemy => {
          if (enemy.health <= 0) return;
          const dx = enemy.x - bullet.x;
          const dy = enemy.y - bullet.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < enemy.radius + bullet.radius) {
            enemy.health -= bullet.damage;
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
        
        this.gameState.barricades.forEach(barricade => {
          if (bullet.x > barricade.x - barricade.width / 2 &&
              bullet.x < barricade.x + barricade.width / 2 &&
              bullet.y > barricade.y - barricade.height / 2 &&
              bullet.y < barricade.y + barricade.height / 2) {
            barricade.health -= bullet.damage * 0.5;
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
  
  updateDefenders(deltaTime) {
    this.gameState.defenders = this.gameState.defenders.filter(defender => {
      if (defender.health <= 0) {
        this.gameState.score += 100;
        this.gameState.siegeProgress += 10;
        
        for (let i = 0; i < 15; i++) {
          this.gameState.particles.push({
            x: defender.x, y: defender.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 0.6,
            color: '#95a5a6',
            size: 3
          });
        }
        return false;
      }
      return true;
    });
  }
  
  updateAttackers(deltaTime) {
    this.gameState.attackers = this.gameState.attackers.filter(attacker => {
      attacker.x += attacker.vx;
      
      if (attacker.health <= 0) {
        this.gameState.score += 75;
        
        for (let i = 0; i < 12; i++) {
          this.gameState.particles.push({
            x: attacker.x, y: attacker.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 0.5,
            color: '#d35400',
            size: 3
          });
        }
        return false;
      }
      return true;
    });
  }
  
  updateBarricades() {
    this.gameState.barricades = this.gameState.barricades.filter(barricade => {
      return barricade.health > 0;
    });
  }
  
  updateVehicles() {
    this.gameState.vehicles.forEach(vehicle => {
      if (!vehicle.active) return;
      
      if (vehicle.health <= 0) {
        vehicle.active = false;
        this.createExplosion(vehicle.x, vehicle.y, 80, 50);
        this.gameState.score += 200;
      }
    });
  }
  
  createExplosion(x, y, radius, damage) {
    this.gameState.explosions.push({
      x, y,
      radius: 0,
      maxRadius: radius,
      life: 0.6
    });
    
    [...this.gameState.defenders, ...this.gameState.attackers].forEach(enemy => {
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
        player.health -= damage * (1 - dist / radius) * 0.5;
      }
    });
    
    for (let i = 0; i < 30; i++) {
      this.gameState.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 0.8,
        color: ['#e74c3c', '#f39c12', '#e67e22'][Math.floor(Math.random() * 3)],
        size: 4 + Math.random() * 6
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
    if (this.gameState.attackers.length === 0 && this.gameState.status === 'playing') {
      this.gameState.wave++;
      setTimeout(() => this.spawnWave(), 2000);
    }
  }
  
  checkVictoryCondition() {
    if (this.gameState.siegeProgress >= 100) {
      this.gameState.status = 'victory';
    }
  }
  
  getPlayerInput(name) {
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#34495e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawBackground();
    this.drawBuildings();
    this.drawBarricades();
    this.drawVehicles();
    this.drawDefenders();
    this.drawAttackers();
    this.drawPlayers();
    this.drawBullets();
    this.drawExplosions();
    this.drawParticles();
    this.drawUI();
    
    if (this.gameState.status === 'gameover') {
      this.drawGameOver();
    } else if (this.gameState.status === 'victory') {
      this.drawVictory();
    }
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height * 0.7);
    gradient.addColorStop(0, '#2c3e50');
    gradient.addColorStop(1, '#34495e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height * 0.7);
  }
  
  drawBuildings() {
    const buildings = [
      { x: 100, y: 100, w: 80, h: 200 },
      { x: 250, y: 150, w: 100, h: 180 },
      { x: 400, y: 80, w: 120, h: 250 },
      { x: 600, y: 120, w: 90, h: 200 },
      { x: 700, y: 100, w: 80, h: 220 }
    ];
    
    buildings.forEach(b => {
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.fillRect(b.x, b.y, b.w, b.h);
      
      this.ctx.fillStyle = '#f39c12';
      for (let wy = 0; wy < 5; wy++) {
        for (let wx = 0; wx < 3; wx++) {
          if (Math.random() > 0.3) {
            this.ctx.fillRect(b.x + 10 + wx * 30, b.y + 20 + wy * 40, 20, 25);
          }
        }
      }
    });
  }
  
  drawBarricades() {
    this.gameState.barricades.forEach(barricade => {
      const healthPercent = barricade.health / barricade.maxHealth;
      this.ctx.fillStyle = healthPercent > 0.5 ? '#8b4513' : '#5d4037';
      this.ctx.fillRect(barricade.x - barricade.width / 2, barricade.y - barricade.height / 2, barricade.width, barricade.height);
      
      this.ctx.strokeStyle = '#5d4037';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(barricade.x - barricade.width / 2, barricade.y - barricade.height / 2, barricade.width, barricade.height);
    });
  }
  
  drawVehicles() {
    this.gameState.vehicles.forEach(vehicle => {
      if (!vehicle.active) return;
      
      if (vehicle.type === 'tank') {
        this.ctx.fillStyle = '#4a5d4a';
        this.ctx.fillRect(vehicle.x - 40, vehicle.y - 20, 80, 35);
        this.ctx.fillStyle = '#2c2c2c';
        this.ctx.fillRect(vehicle.x + 30, vehicle.y - 10, 30, 15);
      } else if (vehicle.type === 'apc') {
        this.ctx.fillStyle = '#5d4e37';
        this.ctx.fillRect(vehicle.x - 35, vehicle.y - 15, 70, 30);
        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(vehicle.x - 20, vehicle.y + 15, 8, 0, Math.PI * 2);
        this.ctx.arc(vehicle.x + 20, vehicle.y + 15, 8, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }
  
  drawDefenders() {
    this.gameState.defenders.forEach(defender => {
      this.ctx.fillStyle = '#7f8c8d';
      this.ctx.beginPath();
      this.ctx.arc(defender.x, defender.y, defender.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#3498db';
      this.ctx.beginPath();
      this.ctx.arc(defender.x + 5, defender.y - 5, 4, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawAttackers() {
    this.gameState.attackers.forEach(attacker => {
      this.ctx.fillStyle = '#d35400';
      this.ctx.beginPath();
      this.ctx.arc(attacker.x, attacker.y, attacker.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.beginPath();
      this.ctx.arc(attacker.x + 5, attacker.y - 5, 4, 0, Math.PI * 2);
      this.ctx.fill();
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
      
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.fillRect(player.x - 8, player.y - 25, 16, 4);
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
  
  drawExplosions() {
    this.gameState.explosions.forEach(exp => {
      const gradient = this.ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
      gradient.addColorStop(0, 'rgba(241, 196, 15, 0.9)');
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
    this.ctx.fillRect(10, 10, 200, 100);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Wave: ${this.gameState.wave}`, 20, 30);
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 50);
    
    this.ctx.fillStyle = '#27ae60';
    this.ctx.fillText(`Siege: ${this.gameState.siegeProgress}%`, 20, 70);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillText(`Attackers: ${this.gameState.attackers.length}`, 120, 30);
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillText(`Defenders: ${this.gameState.defenders.length}`, 120, 50);
    
    this.gameState.players.forEach((player, i) => {
      const y = this.canvas.height - 60 - i * 40;
      
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(10, y, 160, 35);
      
      this.ctx.fillStyle = player.color;
      this.ctx.font = '12px Arial';
      this.ctx.fillText(player.name, 20, y + 15);
      
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.fillRect(20, y + 22, 100, 8);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(20, y + 22, 100 * (player.health / player.maxHealth), 8);
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
    this.ctx.fillText(`Siege Progress: ${this.gameState.siegeProgress}%`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    this.ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 60);
  }
  
  drawVictory() {
    this.ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#27ae60';
    this.ctx.font = 'bold 60px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('VICTORY!', this.canvas.width / 2, this.canvas.height / 2 - 40);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.CitySiegeGame = CitySiegeGame;