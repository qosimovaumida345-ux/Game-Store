// Blade Storm - Epic Action Combat Game
class BladeStormGame {
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
      combo: 0,
      maxCombo: 0,
      status: 'playing',
      players: [],
      enemies: [],
      projectiles: [],
      powerups: [],
      particles: [],
      environmentalHazards: []
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
        x: 150 + i * 100,
        y: this.canvas.height - 150,
        vx: 0,
        vy: 0,
        speed: 5,
        jumpForce: 15,
        radius: 25,
        health: 100,
        maxHealth: 100,
        energy: 100,
        maxEnergy: 100,
        combo: 0,
        isGrounded: true,
        facing: 1,
        attackType: 'none',
        attackTimer: 0,
        weapon: 'blade',
        specialReady: true,
        specialCooldown: 0,
        invulnerable: 0,
        color: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'][i % 4],
        effects: []
      });
    });
    
    this.spawnWave();
  }
  
  spawnWave() {
    const enemyCount = 3 + this.gameState.wave * 2;
    
    for (let i = 0; i < enemyCount; i++) {
      const types = ['warrior', 'archer', 'knight', 'berserker', 'shadow'];
      const type = types[Math.min(Math.floor(Math.random() * types.length), this.gameState.wave - 1)];
      
      this.gameState.enemies.push(this.createEnemy(type, i));
    }
  }
  
  createEnemy(type, index) {
    const side = Math.random() > 0.5 ? 1 : -1;
    const baseEnemy = {
      x: side > 0 ? this.canvas.width + 50 : -50,
      y: this.canvas.height - 150,
      vx: 0,
      vy: 0,
      radius: 25,
      health: 50 + this.gameState.wave * 20,
      maxHealth: 50 + this.gameState.wave * 20,
      damage: 10 + this.gameState.wave * 5,
      speed: 2 + Math.random(),
      type: type,
      state: 'idle',
      attackCooldown: 0,
      hitStun: 0,
      color: this.getEnemyColor(type),
      xpValue: 20 + this.gameState.wave * 10
    };
    
    switch(type) {
      case 'warrior':
        Object.assign(baseEnemy, { range: 60, attackSpeed: 1.5, reward: 100 });
        break;
      case 'archer':
        Object.assign(baseEnemy, { range: 300, attackSpeed: 2, isRanged: true, reward: 150 });
        break;
      case 'knight':
        Object.assign(baseEnemy, { range: 50, attackSpeed: 2, defense: 0.3, reward: 200 });
        break;
      case 'berserker':
        Object.assign(baseEnemy, { range: 50, attackSpeed: 0.8, damage: baseEnemy.damage * 1.5, reward: 250 });
        break;
      case 'shadow':
        Object.assign(baseEnemy, { range: 80, attackSpeed: 1.2, canDodge: true, reward: 300 });
        break;
    }
    
    return baseEnemy;
  }
  
  getEnemyColor(type) {
    const colors = {
      warrior: '#8e44ad',
      archer: '#27ae60',
      knight: '#7f8c8d',
      berserker: '#c0392b',
      shadow: '#2c3e50'
    };
    return colors[type] || '#95a5a6';
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
    this.handleCombat();
    this.updateProjectiles(deltaTime);
    this.updateEnemies(deltaTime);
    this.handlePowerups();
    this.updateParticles(deltaTime);
    this.updateEnvironmentalHazards(deltaTime);
    this.checkWaveCompletion();
    
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
      player.facing = moveX !== 0 ? moveX : player.facing;
      
      if (input.up && player.isGrounded) {
        player.vy = -player.jumpForce;
        player.isGrounded = false;
        this.createJumpParticles(player);
      }
      
      if (input.action) {
        this.performAttack(player);
      }
      
      if (input.special && player.specialReady && player.specialCooldown <= 0) {
        this.performSpecial(player);
      }
      
      player.energy = Math.min(player.maxEnergy, player.energy + deltaTime * 10);
      player.invulnerable = Math.max(0, player.invulnerable - deltaTime * 60);
      player.specialCooldown = Math.max(0, player.specialCooldown - deltaTime);
      
      if (player.attackTimer > 0) {
        player.attackTimer -= deltaTime;
        if (player.attackTimer <= 0) {
          player.attackType = 'none';
        }
      }
    });
  }
  
  performAttack(player) {
    if (player.attackTimer > 0) return;
    
    const attackTypes = ['slash', 'thrust', 'spin'];
    player.attackType = attackTypes[Math.floor(Math.random() * attackTypes.length)];
    player.attackTimer = 0.4;
    player.energy = Math.max(0, player.energy - 15);
    
    this.createAttackEffect(player);
    
    const attackRange = player.weapon === 'blade' ? 80 : 60;
    
    this.gameState.enemies.forEach(enemy => {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < attackRange && Math.sign(dx) === player.facing) {
        const damage = this.calculateDamage(player, enemy);
        enemy.health -= damage;
        enemy.hitStun = 0.3;
        
        this.gameState.combo++;
        this.gameState.score += damage * this.gameState.combo;
        player.combo++;
        
        if (player.combo > this.gameState.maxCombo) {
          this.gameState.maxCombo = player.combo;
        }
        
        this.createHitParticles(enemy.x, enemy.y);
        
        if (enemy.health <= 0) {
          this.defeatEnemy(enemy);
        }
      }
    });
  }
  
  calculateDamage(player, enemy) {
    let baseDamage = 20 + this.gameState.wave * 5;
    
    if (player.attackType === 'slash') baseDamage *= 1.2;
    if (player.attackType === 'thrust') baseDamage *= 1.5;
    if (player.attackType === 'spin') baseDamage *= 1.0;
    
    const comboBonus = 1 + (player.combo * 0.1);
    baseDamage *= comboBonus;
    
    if (enemy.defense) {
      baseDamage *= (1 - enemy.defense);
    }
    
    return Math.floor(baseDamage);
  }
  
  performSpecial(player) {
    player.specialReady = false;
    player.specialCooldown = 10;
    
    this.gameState.score += 500;
    this.createSpecialEffect(player);
    
    const blastRadius = 200;
    this.gameState.enemies.forEach(enemy => {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < blastRadius) {
        enemy.health -= 50;
        enemy.hitStun = 1;
        
        if (enemy.health <= 0) {
          this.defeatEnemy(enemy);
        }
      }
    });
    
    for (let i = 0; i < 30; i++) {
      this.gameState.particles.push({
        x: player.x,
        y: player.y,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        life: 1,
        color: '#f1c40f',
        size: 5
      });
    }
  }
  
  defeatEnemy(enemy) {
    const index = this.gameState.enemies.indexOf(enemy);
    if (index > -1) {
      this.gameState.enemies.splice(index, 1);
      this.gameState.score += enemy.reward || 100;
      
      if (Math.random() > 0.7) {
        this.spawnPowerup(enemy.x, enemy.y);
      }
      
      for (let i = 0; i < 20; i++) {
        this.gameState.particles.push({
          x: enemy.x,
          y: enemy.y,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          life: 1,
          color: enemy.color,
          size: 4
        });
      }
    }
  }
  
  spawnPowerup(x, y) {
    const types = ['health', 'energy', 'speed', 'shield'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    this.gameState.powerups.push({
      x, y,
      type: type,
      life: 10,
      pulse: 0
    });
  }
  
  handlePowerups() {
    this.gameState.powerups = this.gameState.powerups.filter(powerup => {
      powerup.life -= 0.016;
      powerup.pulse += 0.1;
      
      this.gameState.players.forEach(player => {
        const dx = player.x - powerup.x;
        const dy = player.y - powerup.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.radius + 20) {
          this.applyPowerup(player, powerup);
          return false;
        }
      });
      
      return powerup.life > 0;
    });
  }
  
  applyPowerup(player, powerup) {
    switch(powerup.type) {
      case 'health':
        player.health = Math.min(player.maxHealth, player.health + 30);
        break;
      case 'energy':
        player.energy = player.maxEnergy;
        break;
      case 'speed':
        player.speed *= 1.5;
        setTimeout(() => { player.speed /= 1.5; }, 5000);
        break;
      case 'shield':
        player.invulnerable = 5;
        break;
    }
    
    for (let i = 0; i < 15; i++) {
      this.gameState.particles.push({
        x: player.x,
        y: player.y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 0.5,
        color: '#fff',
        size: 3
      });
    }
  }
  
  updatePhysics(deltaTime) {
    const gravity = 0.8;
    const groundY = this.canvas.height - 100;
    
    this.gameState.players.forEach(player => {
      player.vy += gravity;
      player.x += player.vx;
      player.y += player.vy;
      
      if (player.y > groundY) {
        player.y = groundY;
        player.vy = 0;
        player.isGrounded = true;
      }
      
      player.x = Math.max(player.radius, Math.min(this.canvas.width - player.radius, player.x));
    });
    
    this.gameState.enemies.forEach(enemy => {
      enemy.vy += gravity;
      enemy.x += enemy.vx;
      enemy.y += enemy.vy;
      
      const groundY = this.canvas.height - 100;
      if (enemy.y > groundY) {
        enemy.y = groundY;
        enemy.vy = 0;
      }
      
      enemy.x = Math.max(enemy.radius, Math.min(this.canvas.width - enemy.radius, enemy.x));
    });
  }
  
  handleCombat() {
    this.gameState.enemies.forEach(enemy => {
      if (enemy.hitStun > 0) {
        enemy.hitStun -= 0.016;
        return;
      }
      
      const nearestPlayer = this.findNearestPlayer(enemy);
      if (!nearestPlayer) return;
      
      const dx = nearestPlayer.x - enemy.x;
      const dy = nearestPlayer.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (enemy.attackCooldown > 0) {
        enemy.attackCooldown -= 0.016;
        
        if (enemy.isRanged && dist < enemy.range && enemy.attackCooldown <= 0) {
          this.fireEnemyProjectile(enemy, nearestPlayer);
        }
      }
      
      if (dist > enemy.range) {
        enemy.vx = Math.sign(dx) * enemy.speed;
        enemy.state = 'chasing';
      } else if (enemy.attackCooldown <= 0) {
        this.enemyAttack(enemy, nearestPlayer);
      } else {
        enemy.vx = 0;
        enemy.state = 'idle';
      }
    });
  }
  
  findNearestPlayer(enemy) {
    let nearest = null;
    let minDist = Infinity;
    
    this.gameState.players.forEach(player => {
      if (player.health <= 0) return;
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearest = player;
      }
    });
    
    return nearest;
  }
  
  enemyAttack(enemy, target) {
    if (!enemy.isRanged) {
      target.health -= enemy.damage;
      target.invulnerable = 0.5;
      enemy.attackCooldown = enemy.attackSpeed || 1.5;
      
      this.createHitParticles(target.x, target.y);
      
      this.gameState.players.forEach(player => {
        if (player.name === target.name) {
          this.gameState.combo = 0;
          player.combo = 0;
        }
      });
    }
  }
  
  fireEnemyProjectile(enemy, target) {
    const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
    
    this.gameState.projectiles.push({
      x: enemy.x,
      y: enemy.y,
      vx: Math.cos(angle) * 8,
      vy: Math.sin(angle) * 8,
      radius: 6,
      damage: enemy.damage,
      color: '#e74c3c',
      fromEnemy: true
    });
    
    enemy.attackCooldown = enemy.attackSpeed || 2;
  }
  
  updateProjectiles(deltaTime) {
    this.gameState.projectiles = this.gameState.projectiles.filter(proj => {
      proj.x += proj.vx;
      proj.y += proj.vy;
      
      if (proj.x < 0 || proj.x > this.canvas.width || proj.y < 0 || proj.y > this.canvas.height) {
        return false;
      }
      
      if (proj.fromEnemy) {
        this.gameState.players.forEach(player => {
          if (player.health <= 0 || player.invulnerable > 0) return;
          
          const dx = player.x - proj.x;
          const dy = player.y - proj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < player.radius + proj.radius) {
            player.health -= proj.damage;
            player.invulnerable = 0.5;
            return false;
          }
        });
      } else {
        this.gameState.enemies.forEach(enemy => {
          const dx = enemy.x - proj.x;
          const dy = enemy.y - proj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < enemy.radius + proj.radius) {
            enemy.health -= proj.damage || 20;
            enemy.hitStun = 0.3;
            return false;
          }
        });
      }
      
      return true;
    });
  }
  
  updateEnemies(deltaTime) {
    this.gameState.enemies = this.gameState.enemies.filter(enemy => {
      if (enemy.health <= 0) return false;
      return true;
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
  
  updateEnvironmentalHazards(deltaTime) {
    if (Math.random() < 0.005) {
      this.gameState.environmentalHazards.push({
        x: Math.random() * this.canvas.width,
        y: -50,
        vy: 3 + Math.random() * 2,
        radius: 15,
        damage: 20
      });
    }
    
    this.gameState.environmentalHazards = this.gameState.environmentalHazards.filter(hazard => {
      hazard.y += hazard.vy;
      
      if (hazard.y > this.canvas.height) return false;
      
      this.gameState.players.forEach(player => {
        if (player.health <= 0 || player.invulnerable > 0) return;
        
        const dx = player.x - hazard.x;
        const dy = player.y - hazard.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.radius + hazard.radius) {
          player.health -= hazard.damage;
          player.invulnerable = 1;
          this.createHitParticles(player.x, player.y);
        }
      });
      
      return true;
    });
  }
  
  checkWaveCompletion() {
    if (this.gameState.enemies.length === 0 && this.gameState.status === 'playing') {
      this.gameState.wave++;
      this.gameState.combo = 0;
      
      setTimeout(() => this.spawnWave(), 2000);
    }
  }
  
  getPlayerInput(name) {
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  createJumpParticles(player) {
    for (let i = 0; i < 8; i++) {
      this.gameState.particles.push({
        x: player.x,
        y: player.y + player.radius,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * -2,
        life: 0.5,
        color: '#fff',
        size: 3
      });
    }
  }
  
  createAttackEffect(player) {
    for (let i = 0; i < 10; i++) {
      this.gameState.particles.push({
        x: player.x + player.facing * 40,
        y: player.y,
        vx: player.facing * (2 + Math.random() * 3),
        vy: (Math.random() - 0.5) * 4,
        life: 0.4,
        color: '#3498db',
        size: 4
      });
    }
  }
  
  createSpecialEffect(player) {
    this.gameState.environmentalHazards.push({
      x: player.x,
      y: player.y,
      vy: 0,
      radius: 100,
      damage: 0,
      isShockwave: true,
      life: 0.5
    });
  }
  
  createHitParticles(x, y) {
    for (let i = 0; i < 12; i++) {
      this.gameState.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 0.6,
        color: '#e74c3c',
        size: 3
      });
    }
  }
  
  render() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawBackground();
    this.drawGround();
    this.drawPowerups();
    this.drawEnemies();
    this.drawPlayers();
    this.drawProjectiles();
    this.drawParticles();
    this.drawEnvironmentalHazards();
    this.drawUI();
    
    if (this.gameState.status === 'gameover') {
      this.drawGameOver();
    }
    
    if (this.gameState.enemies.length === 0) {
      this.drawWaveComplete();
    }
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    for (let i = 0; i < 50; i++) {
      const x = (i * 137) % this.canvas.width;
      const y = (i * 89) % (this.canvas.height * 0.6);
      this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
      this.ctx.beginPath();
      this.ctx.arc(x, y, 1 + Math.random(), 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  
  drawGround() {
    const groundY = this.canvas.height - 100;
    
    const groundGradient = this.ctx.createLinearGradient(0, groundY, 0, this.canvas.height);
    groundGradient.addColorStop(0, '#2c3e50');
    groundGradient.addColorStop(1, '#1a252f');
    this.ctx.fillStyle = groundGradient;
    this.ctx.fillRect(0, groundY, this.canvas.width, 100);
    
    this.ctx.strokeStyle = '#34495e';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, groundY);
    this.ctx.lineTo(this.canvas.width, groundY);
    this.ctx.stroke();
  }
  
  drawPowerups() {
    this.gameState.powerups.forEach(powerup => {
      const pulse = Math.sin(powerup.pulse) * 5;
      
      this.ctx.fillStyle = this.getPowerupColor(powerup.type);
      this.ctx.beginPath();
      this.ctx.arc(powerup.x, powerup.y, 20 + pulse, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(powerup.type[0].toUpperCase(), powerup.x, powerup.y + 5);
    });
  }
  
  getPowerupColor(type) {
    const colors = {
      health: '#e74c3c',
      energy: '#3498db',
      speed: '#2ecc71',
      shield: '#f39c12'
    };
    return colors[type] || '#95a5a6';
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
      
      const healthBarWidth = 40;
      const healthPercent = enemy.health / enemy.maxHealth;
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.fillRect(enemy.x - healthBarWidth/2, enemy.y - enemy.radius - 15, healthBarWidth, 6);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(enemy.x - healthBarWidth/2, enemy.y - enemy.radius - 15, healthBarWidth * healthPercent, 6);
    });
  }
  
  drawPlayers() {
    this.gameState.players.forEach(player => {
      if (player.health <= 0) return;
      
      if (player.invulnerable > 0) {
        this.ctx.globalAlpha = 0.5 + Math.sin(this.gameState.time * 20) * 0.2;
      }
      
      this.ctx.fillStyle = player.color;
      this.ctx.beginPath();
      this.ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.beginPath();
      this.ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      this.ctx.stroke();
      
      if (player.attackType !== 'none') {
        this.ctx.strokeStyle = '#f1c40f';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, player.radius + 20, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(player.name.substring(0, 5), player.x, player.y - player.radius - 10);
      
      this.ctx.globalAlpha = 1;
    });
  }
  
  drawProjectiles() {
    this.gameState.projectiles.forEach(proj => {
      this.ctx.fillStyle = proj.color;
      this.ctx.beginPath();
      this.ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
      this.ctx.beginPath();
      this.ctx.arc(proj.x - 2, proj.y - 2, proj.radius * 0.5, 0, Math.PI * 2);
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
  
  drawEnvironmentalHazards() {
    this.gameState.environmentalHazards.forEach(hazard => {
      if (hazard.isShockwave) {
        this.ctx.strokeStyle = 'rgba(241, 196, 15, 0.8)';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(hazard.x, hazard.y, 100 * (1 - hazard.life), 0, Math.PI * 2);
        this.ctx.stroke();
      } else {
        this.ctx.fillStyle = '#e67e22';
        this.ctx.beginPath();
        this.ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 200, 90);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Wave: ${this.gameState.wave}`, 20, 30);
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 55);
    this.ctx.fillText(`Combo: ${this.gameState.maxCombo}x`, 20, 80);
    
    this.gameState.players.forEach((player, i) => {
      const y = this.canvas.height - 100 - i * 60;
      
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(10, y, 220, 55);
      
      this.ctx.fillStyle = player.color;
      this.ctx.font = '14px Arial';
      this.ctx.fillText(player.name, 20, y + 18);
      
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.fillRect(20, y + 25, 150, 12);
      this.ctx.fillStyle = '#e74c3c';
      ctx.fillRect(20, y + 25, 150 * (player.health / player.maxHealth), 12);
      
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.fillRect(20, y + 42, 150, 8);
      this.ctx.fillStyle = '#3498db';
      ctx.fillRect(20, y + 42, 150 * (player.energy / player.maxEnergy), 8);
      
      if (player.specialReady) {
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.fillText('SPECIAL READY!', 130, y + 18);
      }
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
    this.ctx.fillText(`Max Combo: ${this.gameState.maxCombo}x`, this.canvas.width / 2, this.canvas.height / 2 + 100);
  }
  
  drawWaveComplete() {
    this.ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`WAVE ${this.gameState.wave} COMPLETE!`, this.canvas.width / 2, this.canvas.height / 2);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.BladeStormGame = BladeStormGame;