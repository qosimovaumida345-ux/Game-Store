// Zombie City - Urban Zombie Apocalypse Survival Game
class ZombieCityGame {
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
      cityClearance: 0,
      status: 'playing',
      players: [],
      zombies: [],
      vehicles: [],
      supplies: [],
      checkpoints: [],
      bullets: [],
      debris: [],
      particles: []
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.createCheckpoints(4);
    this.createVehicles();
    
    this.players.forEach((p, i) => {
      this.gameState.players.push({
        name: p,
        x: 80 + i * 100,
        y: this.canvas.height - 180,
        vx: 0,
        vy: 0,
        speed: 4.5,
        radius: 17,
        health: 100,
        maxHealth: 100,
        ammo: 22,
        maxAmmo: 22,
        weapon: 'rifle',
        checkpointsReached: 0,
        lastShot: 0,
        color: ['#c0392b', '#2980b9', '#16a085', '#8e44ad'][i % 4]
      });
    });
    
    this.spawnZombies(8);
    this.spawnSupplies(5);
  }
  
  createCheckpoints(count) {
    for (let i = 0; i < count; i++) {
      this.gameState.checkpoints.push({
        x: 200 + i * (this.canvas.width - 400) / (count - 1),
        y: 150 + Math.random() * 150,
        reached: false,
        radius: 25,
        wave: i + 1
      });
    }
  }
  
  createVehicles() {
    this.gameState.vehicles.push(
      { x: 100, y: this.canvas.height - 170, type: 'humvee', health: 200, active: true },
      { x: this.canvas.width - 100, y: this.canvas.height - 170, type: 'ambulance', health: 150, active: true }
    );
  }
  
  spawnZombies(count) {
    for (let i = 0; i < count; i++) {
      const side = Math.floor(Math.random() * 4);
      let x, y;
      
      switch(side) {
        case 0: x = Math.random() * this.canvas.width; y = -30; break;
        case 1: x = this.canvas.width + 30; y = Math.random() * this.canvas.height; break;
        case 2: x = Math.random() * this.canvas.width; y = this.canvas.height + 30; break;
        case 3: x = -30; y = Math.random() * this.canvas.height; break;
      }
      
      const types = ['civilian', 'police', ' firefighter', 'military', 'boss'];
      const type = types[Math.min(Math.floor(Math.random() * types.length), Math.min(this.gameState.wave - 1, 4))];
      
      this.gameState.zombies.push(this.createZombie(type, x, y));
    }
  }
  
  createZombie(type, x, y) {
    const baseZombie = {
      x, y,
      vx: 0,
      vy: 0,
      radius: 16,
      health: 40 + this.gameState.wave * 15,
      maxHealth: 40 + this.gameState.wave * 15,
      damage: 10 + this.gameState.wave * 3,
      speed: 1.5 + Math.random() * 0.5,
      type: type,
      attackCooldown: 0,
      hitStun: 0,
      color: this.getZombieColor(type),
      originalType: type
    };
    
    switch(type) {
      case 'civilian':
        Object.assign(baseZombie, { range: 25, attackSpeed: 1.2 });
        break;
      case 'police':
        Object.assign(baseZombie, { range: 35, attackSpeed: 1, canShoot: true });
        break;
      case 'firefighter':
        Object.assign(baseZombie, { range: 30, attackSpeed: 1.5, health: baseZombie.health * 1.3 });
        break;
      case 'military':
        Object.assign(baseZombie, { range: 200, attackSpeed: 2, canShoot: true, isRanged: true });
        break;
      case 'boss':
        Object.assign(baseZombie, { range: 45, attackSpeed: 2.5, health: baseZombie.health * 4, speed: baseZombie.speed * 0.5, reward: 500 });
        break;
    }
    
    return baseZombie;
  }
  
  getZombieColor(type) {
    const colors = {
      civilian: '#7f8c8d',
      police: '#2980b9',
      firefighter: '#e74c3c',
      military: '#27ae60',
      boss: '#8e44ad'
    };
    return colors[type] || '#7f8c8d';
  }
  
  spawnSupplies(count) {
    for (let i = 0; i < count; i++) {
      this.gameState.supplies.push({
        x: 100 + Math.random() * (this.canvas.width - 200),
        y: 100 + Math.random() * 300,
        type: ['medkit', 'ammo', 'weapon', 'armor'][Math.floor(Math.random() * 4)],
        radius: 16,
        lifetime: 18
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
    this.updateZombies(deltaTime);
    this.updateCheckpoints();
    this.updateSupplies(deltaTime);
    this.updateVehicles();
    this.updateDebris();
    this.updateParticles(deltaTime);
    this.checkWaveCompletion();
    this.checkVictory();
    
    if (this.gameState.players.every(p => p.health <= 0)) {
      this.gameState.status = 'gameover';
    }
  }
  
  handlePlayerInput() {
    this.gameState.players.forEach(player => {
      if (player.health <= 0) return;
      
      const input = this.getPlayerInput(player.name);
      
      let moveX = 0;
      if (input.left) moveX -= 1;
      if (input.right) moveX += 1;
      
      player.vx = moveX * player.speed;
      
      if (input.up) player.vy = -player.speed * 0.7;
      else if (input.down) player.vy = player.speed * 0.7;
      else player.vy = 0;
      
      if (input.action && player.ammo > 0 && this.gameState.time - player.lastShot > 0.25) {
        this.fireBullet(player);
        player.ammo--;
        player.lastShot = this.gameState.time;
      }
    });
  }
  
  fireBullet(player) {
    const target = this.findNearestZombie(player);
    let vx = player.vx > 0 ? 16 : -16;
    let vy = 0;
    
    if (target) {
      const angle = Math.atan2(target.y - player.y, target.x - player.x);
      vx = Math.cos(angle) * 16;
      vy = Math.sin(angle) * 16;
    }
    
    this.gameState.bullets.push({
      x: player.x,
      y: player.y - 5,
      vx: vx,
      vy: vy,
      radius: 3,
      damage: 22 + this.gameState.wave * 5,
      fromPlayer: true
    });
  }
  
  findNearestZombie(player) {
    let nearest = null;
    let minDist = Infinity;
    
    this.gameState.zombies.forEach(zombie => {
      if (zombie.health <= 0) return;
      const dx = zombie.x - player.x;
      const dy = zombie.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearest = zombie;
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
    
    this.gameState.zombies.forEach(zombie => {
      zombie.x += zombie.vx;
      zombie.y += zombie.vy;
      
      zombie.x = Math.max(zombie.radius, Math.min(this.canvas.width - zombie.radius, zombie.x));
      zombie.y = Math.max(zombie.radius, Math.min(groundY, zombie.y));
    });
  }
  
  handleShooting() {
    this.gameState.zombies.forEach(zombie => {
      if (zombie.hitStun > 0) {
        zombie.hitStun -= 0.016;
        return;
      }
      
      if (zombie.attackCooldown > 0) {
        zombie.attackCooldown -= 0.016;
      }
      
      if (!zombie.canShoot) return;
      
      const targetPlayer = this.findTargetPlayer(zombie);
      if (!targetPlayer) return;
      
      const dx = targetPlayer.x - zombie.x;
      const dy = targetPlayer.y - zombie.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < zombie.range && zombie.attackCooldown <= 0) {
        this.zombieShoot(zombie, targetPlayer);
        zombie.attackCooldown = zombie.attackSpeed;
      } else if (dist < zombie.range * 1.5) {
        zombie.vx = Math.sign(dx) * zombie.speed * 0.5;
      }
    });
  }
  
  findTargetPlayer(zombie) {
    let target = null;
    let minDist = Infinity;
    
    this.gameState.players.forEach(player => {
      if (player.health <= 0) return;
      const dx = player.x - zombie.x;
      const dy = player.y - zombie.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        target = player;
      }
    });
    
    return target;
  }
  
  zombieShoot(zombie, target) {
    const angle = Math.atan2(target.y - zombie.y, target.x - zombie.x);
    
    this.gameState.bullets.push({
      x: zombie.x,
      y: zombie.y - 10,
      vx: Math.cos(angle) * 12,
      vy: Math.sin(angle) * 12,
      radius: 3,
      damage: zombie.damage * 0.5,
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
        this.gameState.zombies.forEach(zombie => {
          if (zombie.health <= 0) return;
          
          const dx = zombie.x - bullet.x;
          const dy = zombie.y - bullet.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < zombie.radius + bullet.radius) {
            zombie.health -= bullet.damage;
            zombie.hitStun = 0.2;
            this.gameState.score += bullet.damage;
            
            this.createZombieDeathEffect(zombie);
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
  
  createZombieDeathEffect(zombie) {
    for (let i = 0; i < 12; i++) {
      this.gameState.debris.push({
        x: zombie.x,
        y: zombie.y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        size: 2 + Math.random() * 4,
        color: zombie.color,
        life: 2
      });
    }
  }
  
  updateZombies(deltaTime) {
    this.gameState.zombies = this.gameState.zombies.filter(zombie => {
      if (zombie.health <= 0) {
        this.gameState.score += 30 + (zombie.reward || 0) + this.gameState.wave * 12;
        this.gameState.cityClearance = Math.min(100, this.gameState.cityClearance + 2);
        
        if (Math.random() > 0.7) {
          this.spawnSupply(zombie.x, zombie.y);
        }
        
        this.createZombieDeathEffect(zombie);
        
        if (zombie.type === 'boss') {
          this.gameState.wave++;
        }
        
        return false;
      }
      
      const targetPlayer = this.findTargetPlayer(zombie);
      if (!targetPlayer) {
        zombie.vx = 0;
        return true;
      }
      
      const dx = targetPlayer.x - zombie.x;
      const dy = targetPlayer.y - zombie.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > zombie.range) {
        zombie.vx = Math.sign(dx) * zombie.speed;
        zombie.vy = Math.sign(dy) * zombie.speed * 0.5;
      } else if (zombie.attackCooldown <= 0 && !zombie.canShoot) {
        this.zombieAttack(zombie, targetPlayer);
        zombie.attackCooldown = zombie.attackSpeed;
      }
      
      return true;
    });
  }
  
  zombieAttack(zombie, target) {
    target.health -= zombie.damage;
    
    for (let i = 0; i < 8; i++) {
      this.gameState.debris.push({
        x: target.x,
        y: target.y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        size: 2,
        color: '#8b0000',
        life: 1
      });
    }
  }
  
  spawnSupply(x, y) {
    const types = ['medkit', 'ammo', 'weapon', 'armor'];
    this.gameState.supplies.push({
      x, y,
      type: types[Math.floor(Math.random() * types.length)],
      radius: 16,
      lifetime: 15
    });
  }
  
  updateCheckpoints() {
    this.gameState.checkpoints.forEach(checkpoint => {
      if (checkpoint.reached) return;
      
      this.gameState.players.forEach(player => {
        if (player.health <= 0) return;
        
        const dx = player.x - checkpoint.x;
        const dy = player.y - checkpoint.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.radius + checkpoint.radius && this.gameState.wave >= checkpoint.wave) {
          checkpoint.reached = true;
          player.checkpointsReached++;
          this.gameState.cityClearance = Math.min(100, this.gameState.cityClearance + 15);
          this.gameState.score += 500;
          
          for (let i = 0; i < 20; i++) {
            this.gameState.particles.push({
              x: checkpoint.x, y: checkpoint.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              life: 0.8,
              color: '#2ecc71',
              size: 5
            });
          }
        }
      });
    });
  }
  
  updateSupplies(deltaTime) {
    this.gameState.supplies = this.gameState.supplies.filter(supply => {
      supply.lifetime -= deltaTime;
      
      this.gameState.players.forEach(player => {
        if (player.health <= 0) return;
        
        const dx = player.x - supply.x;
        const dy = player.y - supply.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.radius + supply.radius) {
          this.collectSupply(player, supply);
          return false;
        }
      });
      
      return supply.lifetime > 0;
    });
  }
  
  collectSupply(player, supply) {
    switch(supply.type) {
      case 'medkit':
        player.health = player.maxHealth;
        break;
      case 'ammo':
        player.ammo = player.maxAmmo;
        break;
      case 'weapon':
        player.weapon = ['shotgun', 'sniper', 'minigun'][Math.floor(Math.random() * 3)];
        break;
      case 'armor':
        player.health = Math.min(player.maxHealth * 1.5, player.health + 50);
        break;
    }
    
    this.gameState.score += 50;
    
    for (let i = 0; i < 12; i++) {
      this.gameState.particles.push({
        x: supply.x, y: supply.y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 0.5,
        color: '#3498db',
        size: 4
      });
    }
  }
  
  updateVehicles() {
    this.gameState.vehicles.forEach(vehicle => {
      if (!vehicle.active) return;
      
      if (vehicle.health <= 0) {
        vehicle.active = false;
        this.gameState.score += 100;
        
        for (let i = 0; i < 30; i++) {
          this.gameState.debris.push({
            x: vehicle.x, y: vehicle.y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            size: 5 + Math.random() * 8,
            color: '#34495e',
            life: 3
          });
        }
      }
    });
  }
  
  updateDebris() {
    this.gameState.debris = this.gameState.debris.filter(d => {
      d.x += d.vx;
      d.y += d.vy;
      d.vy += 0.2;
      d.life -= 0.016;
      return d.life > 0;
    });
  }
  
  updateParticles(deltaTime) {
    this.gameState.particles = this.gameState.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime;
      return p.life > 0;
    });
  }
  
  checkWaveCompletion() {
    if (this.gameState.zombies.length === 0 && this.gameState.status === 'playing') {
      this.gameState.wave++;
      setTimeout(() => this.spawnZombies(5 + this.gameState.wave * 2), 2000);
    }
  }
  
  checkVictory() {
    const allCheckpointsReached = this.gameState.checkpoints.every(c => c.reached);
    if (allCheckpointsReached && this.gameState.wave >= 4) {
      this.gameState.status = 'victory';
    }
  }
  
  getPlayerInput(name) {
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawCityBackground();
    this.drawDebris();
    this.drawCheckpoints();
    this.drawVehicles();
    this.drawSupplies();
    this.drawZombies();
    this.drawPlayers();
    this.drawBullets();
    this.drawParticles();
    this.drawUI();
    
    if (this.gameState.status === 'gameover') {
      this.drawGameOver();
    } else if (this.gameState.status === 'victory') {
      this.drawVictory();
    }
  }
  
  drawCityBackground() {
    this.ctx.fillStyle = '#1a252f';
    for (let i = 0; i < 15; i++) {
      this.ctx.fillRect(30 + i * 55, 30, 40, this.canvas.height - 130);
      
      this.ctx.fillStyle = '#f39c12';
      for (let w = 0; w < 3; w++) {
        for (let h = 0; h < 5; h++) {
          if (Math.random() > 0.5) {
            this.ctx.fillRect(35 + i * 55 + w * 12, 40 + h * 25, 8, 15);
          }
        }
      }
    }
    
    this.ctx.fillStyle = '#34495e';
    this.ctx.fillRect(0, this.canvas.height - 100, this.canvas.width, 100);
  }
  
  drawDebris() {
    this.gameState.debris.forEach(d => {
      this.ctx.globalAlpha = d.life / 3;
      this.ctx.fillStyle = d.color;
      this.ctx.beginPath();
      this.ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
  }
  
  drawCheckpoints() {
    this.gameState.checkpoints.forEach(checkpoint => {
      const color = checkpoint.reached ? '#2ecc71' : this.gameState.wave >= checkpoint.wave ? '#f39c12' : '#7f8c8d';
      
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(checkpoint.x, checkpoint.y, checkpoint.radius, 0, Math.PI * 2);
      this.ctx.stroke();
      
      this.ctx.fillStyle = color;
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(checkpoint.reached ? 'CLEAR' : checkpoint.wave, checkpoint.x, checkpoint.y + 4);
    });
  }
  
  drawVehicles() {
    this.gameState.vehicles.forEach(vehicle => {
      if (!vehicle.active) return;
      
      if (vehicle.type === 'humvee') {
        this.ctx.fillStyle = '#4a5d4a';
        this.ctx.fillRect(vehicle.x - 45, vehicle.y - 25, 90, 40);
        this.ctx.fillStyle = '#2c2c2c';
        this.ctx.fillRect(vehicle.x - 35, vehicle.y - 35, 70, 15);
      } else if (vehicle.type === 'ambulance') {
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.fillRect(vehicle.x - 40, vehicle.y - 20, 80, 35);
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(vehicle.x - 20, vehicle.y - 20, 40, 10);
      }
    });
  }
  
  drawSupplies() {
    this.gameState.supplies.forEach(supply => {
      const colors = {
        medkit: '#e74c3c',
        ammo: '#f1c40f',
        weapon: '#3498db',
        armor: '#9b59b6'
      };
      
      this.ctx.fillStyle = colors[supply.type];
      this.ctx.beginPath();
      this.ctx.arc(supply.x, supply.y, supply.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(supply.type[0].toUpperCase(), supply.x, supply.y + 4);
    });
  }
  
  drawZombies() {
    this.gameState.zombies.forEach(zombie => {
      this.ctx.fillStyle = zombie.color;
      this.ctx.beginPath();
      this.ctx.arc(zombie.x, zombie.y, zombie.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.beginPath();
      this.ctx.arc(zombie.x - 4, zombie.y - 4, 4, 0, Math.PI * 2);
      this.ctx.arc(zombie.x + 4, zombie.y - 4, 4, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.beginPath();
      this.ctx.arc(zombie.x - 4, zombie.y - 4, 2, 0, Math.PI * 2);
      this.ctx.arc(zombie.x + 4, zombie.y - 4, 2, 0, Math.PI * 2);
      this.ctx.fill();
      
      if (zombie.type === 'military' || zombie.type === 'police') {
        this.ctx.strokeStyle = '#f1c40f';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(zombie.x, zombie.y, zombie.radius + 5, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      
      if (zombie.hitStun > 0) {
        this.ctx.fillStyle = 'rgba(255,255,255,0.4)';
        this.ctx.beginPath();
        this.ctx.arc(zombie.x, zombie.y, zombie.radius, 0, Math.PI * 2);
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
      
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
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
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(10, 10, 200, 95);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Wave: ${this.gameState.wave}`, 20, 30);
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 50);
    
    const clearance = this.gameState.cityClearance;
    this.ctx.fillStyle = clearance > 70 ? '#2ecc71' : clearance > 30 ? '#f39c12' : '#e74c3c';
    this.ctx.fillText(`Clearance: ${clearance}%`, 20, 70);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillText(`Zombies: ${this.gameState.zombies.length}`, 120, 30);
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillText(`CP: ${this.gameState.checkpoints.filter(c => c.reached).length}/${this.gameState.checkpoints.length}`, 120, 50);
    
    this.gameState.players.forEach((player, i) => {
      const y = this.canvas.height - 65 - i * 48;
      
      this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
      this.ctx.fillRect(10, y, 170, 43);
      
      this.ctx.fillStyle = player.color;
      this.ctx.font = '12px Arial';
      this.ctx.fillText(player.name, 20, y + 15);
      
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.fillRect(20, y + 22, 100, 8);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(20, y + 22, 100 * (player.health / player.maxHealth), 8);
      
      this.ctx.fillStyle = '#95a5a6';
      this.ctx.fillText(`Am:${player.ammo}`, 130, y + 15);
    });
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.9)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#c0392b';
    this.ctx.font = 'bold 60px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('CITY FALLEN', this.canvas.width / 2, this.canvas.height / 2 - 40);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Clearance: ${this.gameState.cityClearance}%`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    this.ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 60);
  }
  
  drawVictory() {
    this.ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#27ae60';
    this.ctx.font = 'bold 55px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('CITY SECURED', this.canvas.width / 2, this.canvas.height / 2 - 40);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.ZombieCityGame = ZombieCityGame;