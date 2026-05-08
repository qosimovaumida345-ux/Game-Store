// Dead Zone - Post-Apocalyptic Zombie Survival Game
class DeadZoneGame {
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
      radiationLevel: 0,
      status: 'playing',
      players: [],
      zombies: [],
      supplies: [],
      traps: [],
      bullets: [],
      clouds: [],
      particles: []
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.createTraps(5);
    this.createRadiationClouds();
    
    this.players.forEach((p, i) => {
      this.gameState.players.push({
        name: p,
        x: 100 + i * 80,
        y: this.canvas.height - 160,
        vx: 0,
        vy: 0,
        speed: 4,
        radius: 16,
        health: 100,
        maxHealth: 100,
        ammo: 18,
        maxAmmo: 18,
        geigerCounter: 0,
        hasMask: false,
        lastShot: 0,
        color: ['#7f8c8d', '#95a5a6', '#bdc3c7', '#ecf0f1'][i % 4]
      });
    });
    
    this.spawnZombies(6);
    this.spawnSupplies(4);
  }
  
  createTraps(count) {
    for (let i = 0; i < count; i++) {
      this.gameState.traps.push({
        x: 150 + Math.random() * (this.canvas.width - 300),
        y: this.canvas.height - 150,
        type: 'bear_trap',
        radius: 20,
        triggered: false,
        damage: 25
      });
    }
  }
  
  createRadiationClouds() {
    for (let i = 0; i < 5; i++) {
      this.gameState.clouds.push({
        x: Math.random() * this.canvas.width,
        y: 50 + Math.random() * 200,
        vx: (Math.random() - 0.5) * 20,
        radius: 80 + Math.random() * 50,
        density: 0.5 + Math.random() * 0.5,
        toxic: true
      });
    }
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
      
      const types = ['radioactive', 'mutant', 'crawler', 'feral', 'alpha'];
      const type = types[Math.min(Math.floor(Math.random() * types.length), this.gameState.wave - 1)];
      
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
      speed: 1.2 + Math.random(),
      type: type,
      attackCooldown: 0,
      hitStun: 0,
      color: this.getZombieColor(type),
      isRadioactive: type === 'radioactive' || type === 'mutant'
    };
    
    switch(type) {
      case 'radioactive':
        Object.assign(baseZombie, { range: 30, attackSpeed: 1.5, health: baseZombie.health * 1.2, glow: 0 });
        break;
      case 'mutant':
        Object.assign(baseZombie, { range: 35, attackSpeed: 1.2, health: baseZombie.health * 2, speed: baseZombie.speed * 0.8 });
        break;
      case 'crawler':
        Object.assign(baseZombie, { range: 25, attackSpeed: 0.6, speed: baseZombie.speed * 2.5, radius: 12 });
        break;
      case 'feral':
        Object.assign(baseZombie, { range: 40, attackSpeed: 0.8, speed: baseZombie.speed * 1.8 });
        break;
      case 'alpha':
        Object.assign(baseZombie, { range: 50, attackSpeed: 2, health: baseZombie.health * 3, speed: baseZombie.speed * 0.5, reward: 100 });
        break;
    }
    
    return baseZombie;
  }
  
  getZombieColor(type) {
    const colors = {
      radioactive: '#7dcea0',
      mutant: '#45b39d',
      crawler: '#5d6d7e',
      feral: '#a569bd',
      alpha: '#c0392b'
    };
    return colors[type] || '#7f8c8d';
  }
  
  spawnSupplies(count) {
    for (let i = 0; i < count; i++) {
      this.gameState.supplies.push({
        x: 100 + Math.random() * (this.canvas.width - 200),
        y: 100 + Math.random() * 300,
        type: ['medkit', 'ammo', 'mask', 'antidote'][Math.floor(Math.random() * 4)],
        radius: 18,
        lifetime: 20
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
    this.gameState.radiationLevel = Math.min(100, this.gameState.radiationLevel + deltaTime * 0.5);
    
    this.handlePlayerInput();
    this.updatePhysics(deltaTime);
    this.updateRadiation(deltaTime);
    this.handleShooting();
    this.updateBullets(deltaTime);
    this.updateZombies(deltaTime);
    this.updateTraps();
    this.updateClouds(deltaTime);
    this.updateSupplies(deltaTime);
    this.updateParticles(deltaTime);
    this.checkWaveCompletion();
    
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
      
      if (input.action && player.ammo > 0 && this.gameState.time - player.lastShot > 0.3) {
        this.fireBullet(player);
        player.ammo--;
        player.lastShot = this.gameState.time;
      }
    });
  }
  
  fireBullet(player) {
    const target = this.findNearestZombie(player);
    let vx = player.vx > 0 ? 15 : -15;
    let vy = 0;
    
    if (target) {
      const angle = Math.atan2(target.y - player.y, target.x - player.x);
      vx = Math.cos(angle) * 15;
      vy = Math.sin(angle) * 15;
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
  
  updateRadiation(deltaTime) {
    this.gameState.players.forEach(player => {
      if (player.health <= 0 || player.hasMask) return;
      
      player.geigerCounter = Math.min(100, player.geigerCounter + this.gameState.radiationLevel * deltaTime * 0.1);
      
      if (player.geigerCounter > 50) {
        player.health -= deltaTime * (player.geigerCounter / 50);
      }
    });
    
    this.gameState.zombies.forEach(zombie => {
      if (zombie.isRadioactive && zombie.glow !== undefined) {
        zombie.glow += deltaTime * 3;
      }
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
      
      const targetPlayer = this.findTargetPlayer(zombie);
      if (!targetPlayer) return;
      
      const dx = targetPlayer.x - zombie.x;
      const dy = targetPlayer.y - zombie.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < zombie.range && zombie.attackCooldown <= 0) {
        this.zombieAttack(zombie, targetPlayer);
        zombie.attackCooldown = zombie.attackSpeed;
      } else if (dist < zombie.range * 1.5) {
        zombie.vx = Math.sign(dx) * zombie.speed;
        zombie.vy = Math.sign(dy) * zombie.speed * 0.5;
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
  
  zombieAttack(zombie, target) {
    target.health -= zombie.damage;
    
    if (zombie.isRadioactive && !target.hasMask) {
      target.geigerCounter += 20;
    }
    
    for (let i = 0; i < 8; i++) {
      this.gameState.particles.push({
        x: target.x,
        y: target.y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 0.4,
        color: zombie.isRadioactive ? '#7dcea0' : '#8b0000',
        size: 3
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
          
          for (let i = 0; i < 8; i++) {
            this.gameState.particles.push({
              x: bullet.x, y: bullet.y,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              life: 0.3,
              color: zombie.isRadioactive ? '#7dcea0' : '#c0392b',
              size: 2
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
        this.gameState.score += 30 + (zombie.reward || 0) + this.gameState.wave * 15;
        
        if (zombie.isRadioactive) {
          this.gameState.radiationLevel = Math.min(100, this.gameState.radiationLevel + 5);
        }
        
        if (Math.random() > 0.6) {
          this.spawnSupply(zombie.x, zombie.y);
        }
        
        for (let i = 0; i < 20; i++) {
          this.gameState.particles.push({
            x: zombie.x, y: zombie.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 0.6,
            color: zombie.color,
            size: 4
          });
        }
        return false;
      }
      return true;
    });
  }
  
  spawnSupply(x, y) {
    const types = ['medkit', 'ammo', 'mask', 'antidote'];
    this.gameState.supplies.push({
      x, y,
      type: types[Math.floor(Math.random() * types.length)],
      radius: 18,
      lifetime: 15
    });
  }
  
  updateTraps() {
    this.gameState.traps.forEach(trap => {
      if (trap.triggered) return;
      
      this.gameState.players.forEach(player => {
        if (player.health <= 0) return;
        
        const dx = player.x - trap.x;
        const dy = player.y - trap.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.radius + trap.radius) {
          player.health -= trap.damage;
          trap.triggered = true;
          
          for (let i = 0; i < 10; i++) {
            this.gameState.particles.push({
              x: trap.x, y: trap.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              life: 0.5,
              color: '#e74c3c',
              size: 3
            });
          }
        }
      });
    });
  }
  
  updateClouds(deltaTime) {
    this.gameState.clouds.forEach(cloud => {
      cloud.x += cloud.vx * deltaTime;
      
      if (cloud.x < -cloud.radius) cloud.x = this.canvas.width + cloud.radius;
      if (cloud.x > this.canvas.width + cloud.radius) cloud.x = -cloud.radius;
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
      case 'mask':
        player.hasMask = true;
        player.geigerCounter = 0;
        break;
      case 'antidote':
        player.geigerCounter = Math.max(0, player.geigerCounter - 50);
        break;
    }
    
    this.gameState.score += 50;
    
    for (let i = 0; i < 12; i++) {
      this.gameState.particles.push({
        x: supply.x, y: supply.y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 0.5,
        color: '#2ecc71',
        size: 4
      });
    }
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
      this.gameState.radiationLevel = Math.max(0, this.gameState.radiationLevel - 20);
      setTimeout(() => this.spawnZombies(4 + this.gameState.wave * 2), 2000);
    }
  }
  
  getPlayerInput(name) {
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawBackground();
    this.drawClouds();
    this.drawTraps();
    this.drawSupplies();
    this.drawZombies();
    this.drawPlayers();
    this.drawBullets();
    this.drawParticles();
    this.drawRadiationOverlay();
    this.drawUI();
    
    if (this.gameState.status === 'gameover') {
      this.drawGameOver();
    }
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1a252f');
    gradient.addColorStop(1, '#2c3e50');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#17202a';
    for (let i = 0; i < 10; i++) {
      this.ctx.fillRect(50 + i * 80, 40, 60, this.canvas.height - 140);
    }
  }
  
  drawClouds() {
    this.gameState.clouds.forEach(cloud => {
      const gradient = this.ctx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.radius);
      gradient.addColorStop(0, `rgba(150, 200, 100, ${cloud.density * 0.4})`);
      gradient.addColorStop(1, 'rgba(150, 200, 100, 0)');
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawTraps() {
    this.gameState.traps.forEach(trap => {
      if (trap.triggered) return;
      
      this.ctx.fillStyle = '#5d4037';
      this.ctx.beginPath();
      this.ctx.arc(trap.x, trap.y, trap.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.strokeStyle = '#3e2723';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(trap.x, trap.y, trap.radius - 5, 0, Math.PI * 2);
      this.ctx.stroke();
    });
  }
  
  drawSupplies() {
    this.gameState.supplies.forEach(supply => {
      const colors = {
        medkit: '#e74c3c',
        ammo: '#f1c40f',
        mask: '#3498db',
        antidote: '#2ecc71'
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
      
      if (zombie.isRadioactive && zombie.glow !== undefined) {
        const glowSize = 5 + Math.sin(zombie.glow) * 3;
        this.ctx.shadowColor = '#7dcea0';
        this.ctx.shadowBlur = glowSize;
      }
      
      this.ctx.beginPath();
      this.ctx.arc(zombie.x, zombie.y, zombie.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.shadowBlur = 0;
      
      this.ctx.fillStyle = '#1a1a1a';
      this.ctx.beginPath();
      this.ctx.arc(zombie.x - 4, zombie.y - 4, 4, 0, Math.PI * 2);
      this.ctx.arc(zombie.x + 4, zombie.y - 4, 4, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#ff4444';
      this.ctx.beginPath();
      this.ctx.arc(zombie.x - 4, zombie.y - 4, 2, 0, Math.PI * 2);
      this.ctx.arc(zombie.x + 4, zombie.y - 4, 2, 0, Math.PI * 2);
      this.ctx.fill();
      
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
      
      this.ctx.strokeStyle = player.hasMask ? '#2ecc71' : '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      if (player.geigerCounter > 30) {
        this.ctx.strokeStyle = `rgba(231, 76, 60, ${player.geigerCounter / 100})`;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, player.radius + 8, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    });
  }
  
  drawBullets() {
    this.gameState.bullets.forEach(bullet => {
      this.ctx.fillStyle = '#f39c12';
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
  
  drawRadiationOverlay() {
    const level = this.gameState.radiationLevel / 100;
    this.ctx.fillStyle = `rgba(150, 200, 100, ${level * 0.3})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(10, 10, 200, 80);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Wave: ${this.gameState.wave}`, 20, 30);
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 50);
    this.ctx.fillText(`Zombies: ${this.gameState.zombies.length}`, 20, 70);
    
    this.ctx.fillStyle = this.gameState.radiationLevel > 60 ? '#e74c3c' : '#2ecc71';
    this.ctx.fillText(`Rad: ${Math.floor(this.gameState.radiationLevel)}%`, 140, 30);
    
    this.gameState.players.forEach((player, i) => {
      const y = this.canvas.height - 60 - i * 45;
      
      this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
      this.ctx.fillRect(10, y, 170, 40);
      
      this.ctx.fillStyle = player.color;
      this.ctx.font = '12px Arial';
      this.ctx.fillText(player.name, 20, y + 15);
      
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.fillRect(20, y + 22, 100, 8);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(20, y + 22, 100 * (player.health / player.maxHealth), 8);
      
      this.ctx.fillStyle = player.geigerCounter > 50 ? '#e74c3c' : '#95a5a6';
      this.ctx.fillText(`Am:${player.ammo}`, 130, y + 15);
    });
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.9)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#c0392b';
    this.ctx.font = 'bold 60px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('DEAD ZONE', this.canvas.width / 2, this.canvas.height / 2 - 40);
    
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

window.DeadZoneGame = DeadZoneGame;