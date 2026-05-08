// Zombie Survival - Horror Survival Action Game
class ZombieSurvivalGame {
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
      dayCycle: 0,
      status: 'playing',
      survivors: [],
      zombies: [],
      bullets: [],
      items: [],
      barricades: [],
      vehicles: [],
      bloodSplats: [],
      particles: []
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.createBarricades(6);
    this.createVehicles();
    
    this.players.forEach((p, i) => {
      this.gameState.survivors.push({
        name: p,
        x: 120 + i * 100,
        y: this.canvas.height - 180,
        vx: 0,
        vy: 0,
        speed: 4.5,
        radius: 18,
        health: 100,
        maxHealth: 100,
        ammo: 20,
        maxAmmo: 20,
        weapon: 'pistol',
        lastShot: 0,
        stamina: 100,
        infected: false,
        infectionLevel: 0,
        color: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'][i % 4]
      });
    });
    
    this.spawnZombies(8);
  }
  
  createBarricades(count) {
    for (let i = 0; i < count; i++) {
      this.gameState.barricades.push({
        x: 200 + i * 100,
        y: this.canvas.height - 150,
        width: 50,
        height: 40,
        health: 80,
        maxHealth: 80
      });
    }
  }
  
  createVehicles() {
    this.gameState.vehicles.push(
      { x: 80, y: this.canvas.height - 160, type: 'car', health: 150, active: true },
      { x: this.canvas.width - 80, y: this.canvas.height - 160, type: 'truck', health: 200, active: true }
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
      
      const types = ['walker', 'runner', 'tank', 'stalker', 'spitter'];
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
      health: 30 + this.gameState.wave * 10,
      maxHealth: 30 + this.gameState.wave * 10,
      damage: 8 + this.gameState.wave * 2,
      speed: 1.5 + Math.random(),
      type: type,
      state: 'chasing',
      attackCooldown: 0,
      hitStun: 0,
      color: this.getZombieColor(type),
      animFrame: 0
    };
    
    switch(type) {
      case 'walker':
        Object.assign(baseZombie, { range: 30, attackSpeed: 1.5, health: baseZombie.health * 1 });
        break;
      case 'runner':
        Object.assign(baseZombie, { range: 25, attackSpeed: 0.5, speed: baseZombie.speed * 2.5, health: baseZombie.health * 0.5 });
        break;
      case 'tank':
        Object.assign(baseZombie, { range: 40, attackSpeed: 2, speed: baseZombie.speed * 0.6, health: baseZombie.health * 3 });
        break;
      case 'stalker':
        Object.assign(baseZombie, { range: 30, attackSpeed: 1, speed: baseZombie.speed * 1.5, canClimb: true });
        break;
      case 'spitter':
        Object.assign(baseZombie, { range: 200, attackSpeed: 3, canRanged: true, health: baseZombie.health * 0.7 });
        break;
    }
    
    return baseZombie;
  }
  
  getZombieColor(type) {
    const colors = {
      walker: '#4a5d4a',
      runner: '#5d4e4e',
      tank: '#3e3e3e',
      stalker: '#4e4e4e',
      spitter: '#5a5a3e'
    };
    return colors[type] || '#4a5d4a';
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
    this.gameState.dayCycle = (this.gameState.dayCycle + deltaTime * 0.1) % 24;
    
    this.handlePlayerInput();
    this.updatePhysics(deltaTime);
    this.updateStamina();
    this.handleShooting();
    this.updateBullets(deltaTime);
    this.updateZombies(deltaTime);
    this.updateBarricades();
    this.updateVehicles();
    this.updateItems();
    this.updateInfection(deltaTime);
    this.updateParticles(deltaTime);
    this.checkWaveCompletion();
    
    if (this.gameState.survivors.every(s => s.health <= 0)) {
      this.gameState.status = 'gameover';
    }
  }
  
  handlePlayerInput() {
    this.gameState.survivors.forEach(survivor => {
      if (survivor.health <= 0) return;
      
      const input = this.getPlayerInput(survivor.name);
      
      let moveX = 0;
      if (input.left) moveX -= 1;
      if (input.right) moveX += 1;
      
      survivor.vx = moveX * survivor.speed;
      
      if (input.up) survivor.vy = -survivor.speed * 0.7;
      else if (input.down) survivor.vy = survivor.speed * 0.7;
      else survivor.vy = 0;
      
      if (input.action && survivor.ammo > 0 && this.gameState.time - survivor.lastShot > 0.25) {
        this.fireBullet(survivor);
        survivor.ammo--;
        survivor.lastShot = this.gameState.time;
        survivor.stamina -= 2;
      }
      
      if (input.special && survivor.stamina >= 30) {
        this.performMelee(survivor);
        survivor.stamina -= 30;
      }
    });
  }
  
  fireBullet(survivor) {
    const target = this.findNearestZombie(survivor);
    let vx = survivor.vx > 0 ? 14 : -14;
    let vy = 0;
    
    if (target) {
      const angle = Math.atan2(target.y - survivor.y, target.x - survivor.x);
      vx = Math.cos(angle) * 14;
      vy = Math.sin(angle) * 14;
    }
    
    this.gameState.bullets.push({
      x: survivor.x,
      y: survivor.y - 5,
      vx: vx,
      vy: vy,
      radius: 3,
      damage: 20 + this.gameState.wave * 4,
      fromPlayer: true,
      playerName: survivor.name
    });
    
    this.createMuzzleFlash(survivor.x, survivor.y - 5);
  }
  
  performMelee(survivor) {
    this.gameState.zombies.forEach(zombie => {
      const dx = zombie.x - survivor.x;
      const dy = zombie.y - survivor.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 60) {
        zombie.health -= 40;
        zombie.hitStun = 0.5;
        zombie.vx = Math.sign(dx) * 15;
        zombie.vy = -5;
        
        this.gameState.score += 15;
        
        for (let i = 0; i < 10; i++) {
          this.gameState.bloodSplats.push({
            x: zombie.x,
            y: zombie.y,
            size: 3 + Math.random() * 4,
            life: 5
          });
        }
      }
    });
  }
  
  findNearestZombie(survivor) {
    let nearest = null;
    let minDist = Infinity;
    
    this.gameState.zombies.forEach(zombie => {
      if (zombie.health <= 0) return;
      const dx = zombie.x - survivor.x;
      const dy = zombie.y - survivor.y;
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
    
    this.gameState.survivors.forEach(survivor => {
      survivor.x += survivor.vx;
      survivor.y += survivor.vy;
      
      survivor.x = Math.max(survivor.radius, Math.min(this.canvas.width - survivor.radius, survivor.x));
      survivor.y = Math.max(survivor.radius, Math.min(groundY, survivor.y));
    });
    
    this.gameState.zombies.forEach(zombie => {
      zombie.x += zombie.vx;
      zombie.y += zombie.vy;
      
      zombie.x = Math.max(zombie.radius, Math.min(this.canvas.width - zombie.radius, zombie.x));
      zombie.y = Math.max(zombie.radius, Math.min(groundY, zombie.y));
    });
  }
  
  updateStamina() {
    this.gameState.survivors.forEach(survivor => {
      if (survivor.health <= 0) return;
      survivor.stamina = Math.min(100, survivor.stamina + 0.3);
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
      
      const targetSurvivor = this.findTargetSurvivor(zombie);
      if (!targetSurvivor) return;
      
      const dx = targetSurvivor.x - zombie.x;
      const dy = targetSurvivor.y - zombie.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < zombie.range && zombie.attackCooldown <= 0) {
        this.zombieAttack(zombie, targetSurvivor);
        zombie.attackCooldown = zombie.attackSpeed;
      } else if (dist < zombie.range * 1.5) {
        zombie.vx = Math.sign(dx) * zombie.speed;
        zombie.vy = Math.sign(dy) * zombie.speed * 0.5;
      }
    });
  }
  
  findTargetSurvivor(zombie) {
    let target = null;
    let minDist = Infinity;
    
    this.gameState.survivors.forEach(survivor => {
      if (survivor.health <= 0) return;
      const dx = survivor.x - zombie.x;
      const dy = survivor.y - zombie.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        target = survivor;
      }
    });
    
    return target;
  }
  
  zombieAttack(zombie, target) {
    target.health -= zombie.damage;
    
    if (!target.infected && Math.random() > 0.7) {
      target.infected = true;
    }
    
    if (zombie.type === 'spitter') {
      target.health -= zombie.damage * 0.5;
    }
    
    for (let i = 0; i < 8; i++) {
      this.gameState.bloodSplats.push({
        x: target.x,
        y: target.y,
        size: 2 + Math.random() * 3,
        life: 3
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
      
      this.gameState.zombies.forEach(zombie => {
        if (zombie.health <= 0) return;
        
        const dx = zombie.x - bullet.x;
        const dy = zombie.y - bullet.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < zombie.radius + bullet.radius) {
          zombie.health -= bullet.damage;
          zombie.hitStun = 0.2;
          
          this.gameState.score += bullet.damage;
          
          for (let i = 0; i < 10; i++) {
            this.gameState.bloodSplats.push({
              x: zombie.x,
              y: zombie.y,
              size: 2 + Math.random() * 3,
              life: 2
            });
          }
          
          return false;
        }
      });
      
      return true;
    });
  }
  
  updateZombies(deltaTime) {
    this.gameState.zombies = this.gameState.zombies.filter(zombie => {
      if (zombie.health <= 0) {
        this.gameState.score += 25 + this.gameState.wave * 10;
        
        if (Math.random() > 0.7) {
          this.spawnItem(zombie.x, zombie.y);
        }
        
        for (let i = 0; i < 25; i++) {
          this.gameState.bloodSplats.push({
            x: zombie.x + (Math.random() - 0.5) * 20,
            y: zombie.y + (Math.random() - 0.5) * 20,
            size: 3 + Math.random() * 5,
            life: 4
          });
        }
        
        return false;
      }
      
      zombie.animFrame += deltaTime * 5;
      
      return true;
    });
  }
  
  spawnItem(x, y) {
    const types = ['health', 'ammo', 'stamina', 'weapon'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    this.gameState.items.push({
      x, y,
      type: type,
      radius: 15,
      lifetime: 15
    });
  }
  
  updateItems() {
    this.gameState.items = this.gameState.items.filter(item => {
      item.lifetime -= 0.016;
      
      this.gameState.survivors.forEach(survivor => {
        if (survivor.health <= 0) return;
        
        const dx = survivor.x - item.x;
        const dy = survivor.y - item.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < survivor.radius + item.radius) {
          this.collectItem(survivor, item);
          return false;
        }
      });
      
      return item.lifetime > 0;
    });
  }
  
  collectItem(survivor, item) {
    switch(item.type) {
      case 'health':
        survivor.health = Math.min(survivor.maxHealth, survivor.health + 40);
        break;
      case 'ammo':
        survivor.ammo = Math.min(survivor.maxAmmo, survivor.ammo + 15);
        break;
      case 'stamina':
        survivor.stamina = 100;
        break;
      case 'weapon':
        survivor.weapon = ['shotgun', 'rifle', 'machine gun'][Math.floor(Math.random() * 3)];
        break;
    }
    
    for (let i = 0; i < 12; i++) {
      this.gameState.particles.push({
        x: item.x,
        y: item.y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 0.5,
        color: '#2ecc71',
        size: 4
      });
    }
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
        this.gameState.score += 100;
      }
    });
  }
  
  updateInfection(deltaTime) {
    this.gameState.survivors.forEach(survivor => {
      if (!survivor.infected || survivor.health <= 0) return;
      
      survivor.infectionLevel += deltaTime * 5;
      
      if (survivor.infectionLevel >= 100) {
        survivor.health = 0;
        
        this.gameState.zombies.push(this.createZombie('walker', survivor.x, survivor.y));
      }
    });
  }
  
  updateParticles(deltaTime) {
    this.gameState.bloodSplats = this.gameState.bloodSplats.filter(splat => {
      splat.life -= deltaTime;
      return splat.life > 0;
    });
    
    this.gameState.particles = this.gameState.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime;
      return p.life > 0;
    });
  }
  
  createMuzzleFlash(x, y) {
    for (let i = 0; i < 6; i++) {
      this.gameState.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 0.1,
        color: '#f39c12',
        size: 3
      });
    }
  }
  
  checkWaveCompletion() {
    if (this.gameState.zombies.length === 0 && this.gameState.status === 'playing') {
      this.gameState.wave++;
      setTimeout(() => this.spawnZombies(5 + this.gameState.wave * 3), 2000);
    }
  }
  
  getPlayerInput(name) {
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  render() {
    const isNight = this.gameState.dayCycle < 6 || this.gameState.dayCycle > 20;
    const darkness = isNight ? 0.85 : 0.3;
    
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawBackground();
    this.drawBloodSplats();
    this.drawBarricades();
    this.drawVehicles();
    this.drawItems();
    this.drawZombies();
    this.drawSurvivors();
    this.drawBullets();
    this.drawParticles();
    this.drawDarkness(darkness);
    this.drawUI();
    
    if (this.gameState.status === 'gameover') {
      this.drawGameOver();
    }
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#0f0f0f');
    gradient.addColorStop(1, '#1a1a1a');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#2d2d2d';
    for (let i = 0; i < 15; i++) {
      this.ctx.fillRect(30 + i * 55, 30, 40, this.canvas.height - 130);
    }
  }
  
  drawBloodSplats() {
    this.gameState.bloodSplats.forEach(splat => {
      this.ctx.globalAlpha = splat.life / 5;
      this.ctx.fillStyle = '#8b0000';
      this.ctx.beginPath();
      this.ctx.arc(splat.x, splat.y, splat.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
  }
  
  drawBarricades() {
    this.gameState.barricades.forEach(barricade => {
      const healthPercent = barricade.health / barricade.maxHealth;
      this.ctx.fillStyle = healthPercent > 0.5 ? '#5d4037' : '#3e2723';
      this.ctx.fillRect(barricade.x - barricade.width / 2, barricade.y - barricade.height / 2, barricade.width, barricade.height);
      
      this.ctx.strokeStyle = '#4e342e';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(barricade.x - barricade.width / 2, barricade.y - barricade.height / 2, barricade.width, barricade.height);
    });
  }
  
  drawVehicles() {
    this.gameState.vehicles.forEach(vehicle => {
      if (!vehicle.active) return;
      
      if (vehicle.type === 'car') {
        this.ctx.fillStyle = '#4a5d6a';
        this.ctx.fillRect(vehicle.x - 40, vehicle.y - 20, 80, 35);
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.beginPath();
        this.ctx.arc(vehicle.x - 25, vehicle.y + 15, 10, 0, Math.PI * 2);
        this.ctx.arc(vehicle.x + 25, vehicle.y + 15, 10, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (vehicle.type === 'truck') {
        this.ctx.fillStyle = '#3d4f5f';
        this.ctx.fillRect(vehicle.x - 50, vehicle.y - 25, 100, 45);
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(vehicle.x - 30, vehicle.y - 40, 60, 20);
      }
    });
  }
  
  drawItems() {
    this.gameState.items.forEach(item => {
      const colors = {
        health: '#e74c3c',
        ammo: '#f1c40f',
        stamina: '#2ecc71',
        weapon: '#3498db'
      };
      
      this.ctx.fillStyle = colors[item.type];
      this.ctx.beginPath();
      this.ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(item.type[0].toUpperCase(), item.x, item.y + 4);
    });
  }
  
  drawZombies() {
    this.gameState.zombies.forEach(zombie => {
      const wobble = Math.sin(zombie.animFrame) * 3;
      
      this.ctx.fillStyle = zombie.color;
      
      this.ctx.beginPath();
      this.ctx.arc(zombie.x, zombie.y + wobble * 0.5, zombie.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#2d1f1f';
      this.ctx.beginPath();
      this.ctx.arc(zombie.x - 5, zombie.y - 5 + wobble * 0.5, 5, 0, Math.PI * 2);
      this.ctx.arc(zombie.x + 5, zombie.y - 5 + wobble * 0.5, 5, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#ff0000';
      this.ctx.beginPath();
      this.ctx.arc(zombie.x - 5, zombie.y - 5 + wobble * 0.5, 2, 0, Math.PI * 2);
      this.ctx.arc(zombie.x + 5, zombie.y - 5 + wobble * 0.5, 2, 0, Math.PI * 2);
      this.ctx.fill();
      
      if (zombie.hitStun > 0) {
        this.ctx.fillStyle = 'rgba(255,255,255,0.4)';
        this.ctx.beginPath();
        this.ctx.arc(zombie.x, zombie.y, zombie.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }
  
  drawSurvivors() {
    this.gameState.survivors.forEach(survivor => {
      if (survivor.health <= 0) return;
      
      if (survivor.infected) {
        this.ctx.globalAlpha = 0.7 + Math.sin(this.gameState.time * 5) * 0.2;
      }
      
      this.ctx.fillStyle = survivor.color;
      this.ctx.beginPath();
      this.ctx.arc(survivor.x, survivor.y, survivor.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      if (survivor.infected) {
        this.ctx.fillStyle = '#27ae60';
        this.ctx.fillRect(survivor.x - 15, survivor.y - 30, 30 * (survivor.infectionLevel / 100), 4);
      }
      
      this.ctx.globalAlpha = 1;
    });
  }
  
  drawBullets() {
    this.gameState.bullets.forEach(bullet => {
      this.ctx.fillStyle = '#f1c40f';
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
  
  drawDarkness(darkness) {
    this.ctx.fillStyle = `rgba(0,0,0,${darkness})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(10, 10, 200, 90);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Wave: ${this.gameState.wave}`, 20, 30);
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 50);
    this.ctx.fillText(`Zombies: ${this.gameState.zombies.length}`, 20, 70);
    
    const timeStr = this.gameState.dayCycle < 12 ? 
      `${Math.floor(this.gameState.dayCycle)} AM` : 
      `${Math.floor(this.gameState.dayCycle - 12)} PM`;
    this.ctx.fillStyle = this.gameState.dayCycle < 6 || this.gameState.dayCycle > 20 ? '#f39c12' : '#3498db';
    this.ctx.fillText(`Time: ${timeStr}`, 130, 30);
    
    this.gameState.survivors.forEach((survivor, i) => {
      const y = this.canvas.height - 70 - i * 50;
      
      this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
      this.ctx.fillRect(10, y, 180, 45);
      
      this.ctx.fillStyle = survivor.color;
      this.ctx.font = '12px Arial';
      this.ctx.fillText(survivor.name, 20, y + 15);
      
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.fillRect(20, y + 22, 100, 8);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(20, y + 22, 100 * (survivor.health / survivor.maxHealth), 8);
      
      this.ctx.fillStyle = '#95a5a6';
      this.ctx.fillText(`Am:${survivor.ammo} St:${Math.floor(survivor.stamina)}`, 130, y + 15);
    });
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.9)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#c0392b';
    this.ctx.font = 'bold 60px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('SURVIVAL ENDED', this.canvas.width / 2, this.canvas.height / 2 - 40);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Waves: ${this.gameState.wave - 1}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    this.ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 60);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.ZombieSurvivalGame = ZombieSurvivalGame;