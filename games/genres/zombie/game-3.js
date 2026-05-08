// Infection Out - Containment Zone Survival Game
class InfectionOutGame {
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
      containmentLevel: 100,
      status: 'playing',
      players: [],
      infected: [],
      survivors: [],
      samples: [],
      vaccines: [],
      bullets: [],
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
        x: 100 + i * 80,
        y: this.canvas.height - 180,
        vx: 0,
        vy: 0,
        speed: 5,
        radius: 16,
        health: 100,
        maxHealth: 100,
        ammo: 25,
        maxAmmo: 25,
        hasSample: false,
        hasVaccine: false,
        lastShot: 0,
        color: ['#3498db', '#2ecc71', '#e67e22', '#9b59b6'][i % 4]
      });
    });
    
    this.spawnInfected(5);
    this.spawnSurvivors(3);
    this.spawnSamples(4);
    this.spawnVaccines(2);
  }
  
  spawnInfected(count) {
    for (let i = 0; i < count; i++) {
      const side = Math.floor(Math.random() * 4);
      let x, y;
      
      switch(side) {
        case 0: x = Math.random() * this.canvas.width; y = -30; break;
        case 1: x = this.canvas.width + 30; y = Math.random() * this.canvas.height; break;
        case 2: x = Math.random() * this.canvas.width; y = this.canvas.height + 30; break;
        case 3: x = -30; y = Math.random() * this.canvas.height; break;
      }
      
      const types = ['zombie', 'sprinter', 'brute', 'swarm'];
      const type = types[Math.min(Math.floor(Math.random() * types.length), this.gameState.wave - 1)];
      
      this.gameState.infected.push(this.createInfected(type, x, y));
    }
  }
  
  createInfected(type, x, y) {
    const baseInfected = {
      x, y,
      vx: 0,
      vy: 0,
      radius: 16,
      health: 35 + this.gameState.wave * 12,
      maxHealth: 35 + this.gameState.wave * 12,
      damage: 12 + this.gameState.wave * 3,
      speed: 1.8 + Math.random(),
      type: type,
      attackCooldown: 0,
      hitStun: 0,
      color: this.getInfectedColor(type)
    };
    
    switch(type) {
      case 'zombie':
        Object.assign(baseInfected, { range: 30, attackSpeed: 1.3 });
        break;
      case 'sprinter':
        Object.assign(baseInfected, { range: 25, attackSpeed: 0.5, speed: baseInfected.speed * 3 });
        break;
      case 'brute':
        Object.assign(baseInfected, { range: 40, attackSpeed: 2, health: baseInfected.health * 2.5, speed: baseInfected.speed * 0.6 });
        break;
      case 'swarm':
        Object.assign(baseInfected, { range: 20, attackSpeed: 0.3, speed: baseInfected.speed * 1.5, radius: 10, health: baseInfected.health * 0.3 });
        break;
    }
    
    return baseInfected;
  }
  
  getInfectedColor(type) {
    const colors = {
      zombie: '#5d4037',
      sprinter: '#6d4c41',
      brute: '#3e2723',
      swarm: '#795548'
    };
    return colors[type] || '#5d4037';
  }
  
  spawnSurvivors(count) {
    for (let i = 0; i < count; i++) {
      this.gameState.survivors.push({
        x: 200 + Math.random() * (this.canvas.width - 400),
        y: this.canvas.height - 160,
        radius: 14,
        health: 50,
        maxHealth: 50,
        rescued: false,
        canGiveSample: true
      });
    }
  }
  
  spawnSamples(count) {
    for (let i = 0; i < count; i++) {
      this.gameState.samples.push({
        x: 150 + Math.random() * (this.canvas.width - 300),
        y: 100 + Math.random() * 250,
        collected: false,
        radius: 15
      });
    }
  }
  
  spawnVaccines(count) {
    for (let i = 0; i < count; i++) {
      this.gameState.vaccines.push({
        x: 200 + Math.random() * (this.canvas.width - 400),
        y: 150 + Math.random() * 200,
        collected: false,
        radius: 15
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
    this.updateInfected(deltaTime);
    this.updateSurvivors();
    this.updateSamples();
    this.updateVaccines(deltaTime);
    this.checkContainment();
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
      
      if (input.action && player.ammo > 0 && this.gameState.time - player.lastShot > 0.2) {
        this.fireBullet(player);
        player.ammo--;
        player.lastShot = this.gameState.time;
      }
      
      if (input.special && player.hasSample) {
        this.deliverSample(player);
      }
    });
  }
  
  fireBullet(player) {
    const target = this.findNearestInfected(player);
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
      damage: 25 + this.gameState.wave * 5,
      fromPlayer: true
    });
  }
  
  deliverSample(player) {
    player.hasSample = false;
    this.gameState.containmentLevel = Math.min(100, this.gameState.containmentLevel + 15);
    this.gameState.score += 300;
    this.gameState.wave++;
    
    for (let i = 0; i < 20; i++) {
      this.gameState.particles.push({
        x: player.x, y: player.y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 0.8,
        color: '#2ecc71',
        size: 5
      });
    }
  }
  
  findNearestInfected(player) {
    let nearest = null;
    let minDist = Infinity;
    
    this.gameState.infected.forEach(infected => {
      if (infected.health <= 0) return;
      const dx = infected.x - player.x;
      const dy = infected.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearest = infected;
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
    
    this.gameState.infected.forEach(infected => {
      infected.x += infected.vx;
      infected.y += infected.vy;
      
      infected.x = Math.max(infected.radius, Math.min(this.canvas.width - infected.radius, infected.x));
      infected.y = Math.max(infected.radius, Math.min(groundY, infected.y));
    });
  }
  
  handleShooting() {
    this.gameState.infected.forEach(infected => {
      if (infected.hitStun > 0) {
        infected.hitStun -= 0.016;
        return;
      }
      
      if (infected.attackCooldown > 0) {
        infected.attackCooldown -= 0.016;
      }
      
      const targetPlayer = this.findTargetPlayer(infected);
      if (!targetPlayer) return;
      
      const dx = targetPlayer.x - infected.x;
      const dy = targetPlayer.y - infected.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < infected.range && infected.attackCooldown <= 0) {
        this.infectedAttack(infected, targetPlayer);
        infected.attackCooldown = infected.attackSpeed;
      } else if (dist < infected.range * 1.5) {
        infected.vx = Math.sign(dx) * infected.speed;
        infected.vy = Math.sign(dy) * infected.speed * 0.5;
      }
    });
  }
  
  findTargetPlayer(infected) {
    let target = null;
    let minDist = Infinity;
    
    this.gameState.players.forEach(player => {
      if (player.health <= 0) return;
      const dx = player.x - infected.x;
      const dy = player.y - infected.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        target = player;
      }
    });
    
    return target;
  }
  
  infectedAttack(infected, target) {
    target.health -= infected.damage;
    this.gameState.containmentLevel = Math.max(0, this.gameState.containmentLevel - 2);
    
    for (let i = 0; i < 8; i++) {
      this.gameState.particles.push({
        x: target.x, y: target.y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 0.4,
        color: '#e74c3c',
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
      
      this.gameState.infected.forEach(infected => {
        if (infected.health <= 0) return;
        
        const dx = infected.x - bullet.x;
        const dy = infected.y - bullet.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < infected.radius + bullet.radius) {
          infected.health -= bullet.damage;
          infected.hitStun = 0.2;
          this.gameState.score += bullet.damage;
          
          for (let i = 0; i < 6; i++) {
            this.gameState.particles.push({
              x: bullet.x, y: bullet.y,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              life: 0.3,
              color: infected.color,
              size: 2
            });
          }
          return false;
        }
      });
      
      return true;
    });
  }
  
  updateInfected(deltaTime) {
    this.gameState.infected = this.gameState.infected.filter(infected => {
      if (infected.health <= 0) {
        this.gameState.score += 20 + this.gameState.wave * 10;
        this.gameState.containmentLevel = Math.min(100, this.gameState.containmentLevel + 1);
        
        for (let i = 0; i < 15; i++) {
          this.gameState.particles.push({
            x: infected.x, y: infected.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 0.5,
            color: infected.color,
            size: 3
          });
        }
        return false;
      }
      return true;
    });
  }
  
  updateSurvivors() {
    this.gameState.survivors = this.gameState.survivors.filter(survivor => {
      if (survivor.rescued) return false;
      
      this.gameState.players.forEach(player => {
        if (player.health <= 0 || player.hasSample) return;
        
        const dx = player.x - survivor.x;
        const dy = player.y - survivor.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.radius + survivor.radius + 10) {
          survivor.rescued = true;
          player.hasSample = true;
          this.gameState.score += 200;
          
          for (let i = 0; i < 15; i++) {
            this.gameState.particles.push({
              x: survivor.x, y: survivor.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              life: 0.6,
              color: '#3498db',
              size: 4
            });
          }
        }
      });
      
      return !survivor.rescued;
    });
  }
  
  updateSamples() {
    this.gameState.samples = this.gameState.samples.filter(sample => {
      if (sample.collected) return false;
      
      this.gameState.players.forEach(player => {
        if (player.health <= 0 || player.hasSample) return;
        
        const dx = player.x - sample.x;
        const dy = player.y - sample.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.radius + sample.radius) {
          sample.collected = true;
          player.hasSample = true;
          this.gameState.score += 150;
          
          for (let i = 0; i < 12; i++) {
            this.gameState.particles.push({
              x: sample.x, y: sample.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              life: 0.5,
              color: '#f1c40f',
              size: 4
            });
          }
        }
      });
      
      return !sample.collected;
    });
  }
  
  updateVaccines(deltaTime) {
    this.gameState.vaccines = this.gameState.vaccines.filter(vaccine => {
      if (vaccine.collected) return false;
      
      this.gameState.players.forEach(player => {
        if (player.health <= 0 || player.hasVaccine) return;
        
        const dx = player.x - vaccine.x;
        const dy = player.y - vaccine.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.radius + vaccine.radius) {
          vaccine.collected = true;
          player.hasVaccine = true;
          player.health = player.maxHealth;
          this.gameState.score += 100;
          
          for (let i = 0; i < 15; i++) {
            this.gameState.particles.push({
              x: vaccine.x, y: vaccine.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              life: 0.6,
              color: '#2ecc71',
              size: 4
            });
          }
        }
      });
      
      return !vaccine.collected;
    });
  }
  
  checkContainment() {
    if (this.gameState.containmentLevel <= 0) {
      this.gameState.status = 'breached';
    } else if (this.gameState.containmentLevel >= 100 && this.gameState.wave > 3) {
      this.gameState.status = 'secure';
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
    if (this.gameState.infected.length === 0 && this.gameState.status === 'playing') {
      this.gameState.wave++;
      setTimeout(() => this.spawnInfected(4 + this.gameState.wave * 2), 2000);
    }
  }
  
  getPlayerInput(name) {
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawBackground();
    this.drawContainmentZone();
    this.drawSamples();
    this.drawVaccines();
    this.drawSurvivors();
    this.drawInfected();
    this.drawPlayers();
    this.drawBullets();
    this.drawParticles();
    this.drawUI();
    
    if (this.gameState.status === 'gameover') {
      this.drawGameOver();
    } else if (this.gameState.status === 'breached') {
      this.drawBreached();
    } else if (this.gameState.status === 'secure') {
      this.drawSecure();
    }
  }
  
  drawBackground() {
    this.ctx.fillStyle = '#0f0f0f';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#1a1a1a';
    for (let i = 0; i < 12; i++) {
      this.ctx.fillRect(40 + i * 70, 30, 50, this.canvas.height - 130);
    }
    
    this.ctx.strokeStyle = '#27ae60';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([10, 10]);
    this.ctx.strokeRect(30, 30, this.canvas.width - 60, this.canvas.height - 60);
    this.ctx.setLineDash([]);
  }
  
  drawContainmentZone() {
    const level = this.gameState.containmentLevel;
    const color = level > 60 ? '#27ae60' : level > 30 ? '#f39c12' : '#e74c3c';
    
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 4;
    this.ctx.setLineDash([15, 5]);
    this.ctx.strokeRect(50, 50, this.canvas.width - 100, this.canvas.height - 100);
    this.ctx.setLineDash([]);
    
    this.ctx.fillStyle = color;
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('CONTAINMENT ZONE', this.canvas.width / 2, 40);
  }
  
  drawSamples() {
    this.gameState.samples.forEach(sample => {
      const pulse = Math.sin(this.gameState.time * 5) * 2;
      
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.beginPath();
      this.ctx.arc(sample.x, sample.y, sample.radius + pulse, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('S', sample.x, sample.y + 5);
    });
  }
  
  drawVaccines() {
    this.gameState.vaccines.forEach(vaccine => {
      const pulse = Math.sin(this.gameState.time * 4) * 2;
      
      this.ctx.fillStyle = '#2ecc71';
      this.ctx.beginPath();
      this.ctx.arc(vaccine.x, vaccine.y, vaccine.radius + pulse, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('V', vaccine.x, vaccine.y + 5);
    });
  }
  
  drawSurvivors() {
    this.gameState.survivors.forEach(survivor => {
      this.ctx.fillStyle = '#3498db';
      this.ctx.beginPath();
      this.ctx.arc(survivor.x, survivor.y, survivor.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('HELP', survivor.x, survivor.y + 4);
    });
  }
  
  drawInfected() {
    this.gameState.infected.forEach(infected => {
      this.ctx.fillStyle = infected.color;
      this.ctx.beginPath();
      this.ctx.arc(infected.x, infected.y, infected.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#ff0000';
      this.ctx.beginPath();
      this.ctx.arc(infected.x - 4, infected.y - 4, 3, 0, Math.PI * 2);
      this.ctx.arc(infected.x + 4, infected.y - 4, 3, 0, Math.PI * 2);
      this.ctx.fill();
      
      if (infected.hitStun > 0) {
        this.ctx.fillStyle = 'rgba(255,255,255,0.4)';
        this.ctx.beginPath();
        this.ctx.arc(infected.x, infected.y, infected.radius, 0, Math.PI * 2);
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
      
      if (player.hasSample) {
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.fillRect(player.x - 12, player.y - 28, 24, 10);
      }
      
      if (player.hasVaccine) {
        this.ctx.strokeStyle = '#2ecc71';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, player.radius + 6, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    });
  }
  
  drawBullets() {
    this.gameState.bullets.forEach(bullet => {
      this.ctx.fillStyle = '#3498db';
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
    this.ctx.fillRect(10, 10, 200, 85);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Wave: ${this.gameState.wave}`, 20, 30);
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 50);
    
    const level = this.gameState.containmentLevel;
    this.ctx.fillStyle = level > 60 ? '#27ae60' : level > 30 ? '#f39c12' : '#e74c3c';
    this.ctx.fillText(`Containment: ${level}%`, 20, 70);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillText(`Infected: ${this.gameState.infected.length}`, 130, 30);
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillText(`Survivors: ${this.gameState.survivors.filter(s => !s.rescued).length}`, 130, 50);
    
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
      
      this.ctx.fillStyle = player.hasSample ? '#f1c40f' : '#95a5a6';
      this.ctx.fillText(`Am:${player.ammo}`, 130, y + 15);
    });
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.9)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 55px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('CONTAINMENT LOST', this.canvas.width / 2, this.canvas.height / 2 - 40);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '28px Arial';
    this.ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
  }
  
  drawBreached() {
    this.ctx.fillStyle = 'rgba(192, 57, 43, 0.4)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#c0392b';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BREACH DETECTED', this.canvas.width / 2, this.canvas.height / 2 - 30);
  }
  
  drawSecure() {
    this.ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#27ae60';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('CONTAINMENT SECURE', this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '28px Arial';
    this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.InfectionOutGame = InfectionOutGame;