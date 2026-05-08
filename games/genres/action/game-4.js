// Jungle Raid - Tropical Action Game
class JungleRaidGame {
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
      traps: [],
      treasures: [],
      vines: [],
      projectiles: [],
      particles: []
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.createJungleEnvironment();
    
    this.players.forEach((p, i) => {
      this.gameState.players.push({
        name: p,
        x: 100 + i * 100,
        y: this.canvas.height - 120,
        vx: 0,
        vy: 0,
        speed: 5,
        jumpForce: 14,
        radius: 18,
        health: 100,
        maxHealth: 100,
        ammo: 20,
        weapon: 'machete',
        lastAttack: 0,
        canClimb: false,
        climbing: false,
        color: ['#27ae60', '#2980b9', '#e67e22', '#8e44ad'][i % 4]
      });
    });
    
    this.spawnWave();
  }
  
  createJungleEnvironment() {
    for (let i = 0; i < 15; i++) {
      this.gameState.vines.push({
        x: 100 + i * 50 + Math.random() * 30,
        y: 50,
        length: 200 + Math.random() * 200,
        width: 3
      });
    }
    
    for (let i = 0; i < 8; i++) {
      this.gameState.traps.push({
        x: 150 + Math.random() * (this.canvas.width - 300),
        y: this.canvas.height - 100,
        type: ['spike', 'pit', 'snare'][Math.floor(Math.random() * 3)],
        radius: 25,
        triggered: false
      });
    }
    
    this.spawnTreasures(5);
  }
  
  spawnTreasures(count) {
    for (let i = 0; i < count; i++) {
      this.gameState.treasures.push({
        x: 100 + Math.random() * (this.canvas.width - 200),
        y: 100 + Math.random() * 200,
        value: 50 + Math.floor(Math.random() * 150),
        collected: false,
        glow: 0
      });
    }
  }
  
  spawnWave() {
    const enemyCount = 2 + this.gameState.wave * 2;
    
    for (let i = 0; i < enemyCount; i++) {
      const types = ['native', 'jaguar', 'snake', 'insect', 'shaman'];
      const type = types[Math.min(Math.floor(Math.random() * types.length), Math.min(this.gameState.wave - 1, 4))];
      
      this.gameState.enemies.push(this.createEnemy(type));
    }
  }
  
  createEnemy(type) {
    const side = Math.random() > 0.5 ? 1 : -1;
    const baseEnemy = {
      x: side > 0 ? this.canvas.width + 30 : -30,
      y: this.canvas.height - 120,
      vx: 0,
      vy: 0,
      radius: 20,
      health: 40 + this.gameState.wave * 15,
      maxHealth: 40 + this.gameState.wave * 15,
      damage: 8 + this.gameState.wave * 3,
      speed: 2 + Math.random(),
      type: type,
      state: 'patrol',
      attackCooldown: 0,
      hitStun: 0,
      color: this.getEnemyColor(type),
      reward: 80 + this.gameState.wave * 40
    };
    
    switch(type) {
      case 'native':
        Object.assign(baseEnemy, { range: 80, attackSpeed: 1, weapon: 'spear' });
        break;
      case 'jaguar':
        Object.assign(baseEnemy, { range: 60, attackSpeed: 0.5, speed: baseEnemy.speed * 2, damage: baseEnemy.damage * 1.5 });
        break;
      case 'snake':
        Object.assign(baseEnemy, { range: 100, attackSpeed: 1.5, isAerial: false, canPoison: true, radius: 12 });
        break;
      case 'insect':
        Object.assign(baseEnemy, { range: 50, attackSpeed: 0.3, speed: baseEnemy.speed * 2, health: baseEnemy.health * 0.5, radius: 8 });
        break;
      case 'shaman':
        Object.assign(baseEnemy, { range: 200, attackSpeed: 2.5, canHeal: true, reward: baseEnemy.reward * 2 });
        break;
    }
    
    return baseEnemy;
  }
  
  getEnemyColor(type) {
    const colors = {
      native: '#8d6e63',
      jaguar: '#ffa726',
      snake: '#4caf50',
      insect: '#1b5e20',
      shaman: '#7b1fa2'
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
    
    this.handlePlayerInput();
    this.updatePhysics(deltaTime);
    this.handleCombat();
    this.updateEnemies(deltaTime);
    this.updateTraps();
    this.updateTreasures();
    this.updateProjectiles(deltaTime);
    this.updateParticles(deltaTime);
    this.checkWaveCompletion();
    
    if (this.gameState.players.every(p => p.health <= 0)) {
      this.gameState.status = 'gameover';
    }
  }
  
  handlePlayerInput() {
    this.gameState.players.forEach(player => {
      const input = this.getPlayerInput(player.name);
      
      if (player.climbing) {
        if (input.up) player.vy = -player.speed * 0.8;
        else if (input.down) player.vy = player.speed * 0.8;
        else player.vy = 0;
        
        if (input.left) player.vx = -player.speed * 0.5;
        else if (input.right) player.vx = player.speed * 0.5;
        
        if (input.action) {
          player.climbing = false;
          player.vy = -player.jumpForce * 0.5;
        }
      } else {
        let moveX = 0;
        if (input.left) moveX -= 1;
        if (input.right) moveX += 1;
        
        player.vx = moveX * player.speed;
        
        if (input.up && player.y >= this.canvas.height - 120) {
          player.vy = -player.jumpForce;
          this.createJumpParticles(player);
        }
        
        if (input.action && this.gameState.time - player.lastAttack > 0.3) {
          this.performAttack(player);
          player.lastAttack = this.gameState.time;
        }
      }
      
      this.checkVineClimb(player);
    });
  }
  
  checkVineClimb(player) {
    if (player.climbing) return;
    
    this.gameState.vines.forEach(vine => {
      if (Math.abs(player.x - vine.x) < 20 && player.y > vine.y - vine.length && player.y < vine.y + 50) {
        if (player.vy < 0 || player.vy > 0) {
          player.canClimb = true;
        }
      }
    });
  }
  
  performAttack(player) {
    this.createAttackEffect(player);
    
    const attackRange = 60;
    
    this.gameState.enemies.forEach(enemy => {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < attackRange + enemy.radius) {
        const damage = 25 + this.gameState.wave * 5;
        enemy.health -= damage;
        enemy.hitStun = 0.4;
        enemy.vx = Math.sign(dx) * 10;
        
        this.gameState.score += damage;
        
        for (let i = 0; i < 10; i++) {
          this.gameState.particles.push({
            x: enemy.x,
            y: enemy.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 0.5,
            color: '#e74c3c',
            size: 3
          });
        }
      }
    });
  }
  
  updatePhysics(deltaTime) {
    const gravity = 0.7;
    const groundY = this.canvas.height - 100;
    
    this.gameState.players.forEach(player => {
      if (player.climbing) {
        player.y += player.vy;
        player.x += player.vx;
      } else {
        player.vy += gravity;
        player.y += player.vy;
        player.x += player.vx;
        
        if (player.y > groundY) {
          player.y = groundY;
          player.vy = 0;
        }
      }
      
      player.x = Math.max(player.radius, Math.min(this.canvas.width - player.radius, player.x));
      player.y = Math.max(player.radius, Math.min(this.canvas.height - player.radius, player.y));
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
      
      if (enemy.attackCooldown > 0) {
        enemy.attackCooldown -= 0.016;
      }
      
      const targetPlayer = this.findTargetPlayer(enemy);
      if (!targetPlayer) return;
      
      const dx = targetPlayer.x - enemy.x;
      const dy = targetPlayer.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < enemy.range && enemy.attackCooldown <= 0) {
        this.enemyAttack(enemy, targetPlayer);
        enemy.attackCooldown = enemy.attackSpeed;
      } else if (dist > enemy.range) {
        enemy.vx = Math.sign(dx) * enemy.speed;
      } else {
        enemy.vx = 0;
      }
      
      if (enemy.canHeal && enemy.health < enemy.maxHealth && enemy.attackCooldown <= 0) {
        enemy.health = Math.min(enemy.maxHealth, enemy.health + 20);
        this.createHealEffect(enemy);
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
  
  enemyAttack(enemy, target) {
    target.health -= enemy.damage;
    
    if (enemy.canPoison) {
      target.health -= enemy.damage * 0.5;
    }
    
    for (let i = 0; i < 8; i++) {
      this.gameState.particles.push({
        x: target.x,
        y: target.y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 0.4,
        color: enemy.color,
        size: 2
      });
    }
  }
  
  createHealEffect(enemy) {
    for (let i = 0; i < 15; i++) {
      this.gameState.particles.push({
        x: enemy.x,
        y: enemy.y - 20,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 4,
        life: 0.8,
        color: '#2ecc71',
        size: 4
      });
    }
  }
  
  updateEnemies(deltaTime) {
    this.gameState.enemies = this.gameState.enemies.filter(enemy => {
      if (enemy.health <= 0) {
        this.gameState.score += enemy.reward;
        
        if (Math.random() > 0.5) {
          this.gameState.treasures.push({
            x: enemy.x,
            y: enemy.y,
            value: 25 + Math.floor(Math.random() * 75),
            collected: false,
            glow: 0
          });
        }
        
        for (let i = 0; i < 20; i++) {
          this.gameState.particles.push({
            x: enemy.x,
            y: enemy.y,
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
  
  updateTraps() {
    this.gameState.traps.forEach(trap => {
      if (trap.triggered) return;
      
      this.gameState.players.forEach(player => {
        if (player.health <= 0) return;
        
        const dx = player.x - trap.x;
        const dy = player.y - trap.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.radius + trap.radius) {
          player.health -= 20;
          trap.triggered = true;
          
          this.createTrapEffect(trap);
        }
      });
    });
  }
  
  createTrapEffect(trap) {
    for (let i = 0; i < 15; i++) {
      this.gameState.particles.push({
        x: trap.x,
        y: trap.y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 0.6,
        color: '#e74c3c',
        size: 3
      });
    }
  }
  
  updateTreasures() {
    this.gameState.treasures = this.gameState.treasures.filter(treasure => {
      if (treasure.collected) return false;
      
      treasure.glow += 0.1;
      
      this.gameState.players.forEach(player => {
        if (player.health <= 0) return;
        
        const dx = player.x - treasure.x;
        const dy = player.y - treasure.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.radius + 20) {
          this.gameState.score += treasure.value;
          treasure.collected = true;
          
          for (let i = 0; i < 20; i++) {
            this.gameState.particles.push({
              x: treasure.x,
              y: treasure.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              life: 0.8,
              color: '#f1c40f',
              size: 4
            });
          }
        }
      });
      
      return !treasure.collected;
    });
  }
  
  updateProjectiles(deltaTime) {
    this.gameState.projectiles = this.gameState.projectiles.filter(proj => {
      proj.x += proj.vx;
      proj.y += proj.vy;
      
      if (proj.x < 0 || proj.x > this.canvas.width || proj.y < 0 || proj.y > this.canvas.height) {
        return false;
      }
      
      return true;
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
  
  createJumpParticles(player) {
    for (let i = 0; i < 8; i++) {
      this.gameState.particles.push({
        x: player.x,
        y: player.y + player.radius,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 2,
        life: 0.4,
        color: '#8b4513',
        size: 3
      });
    }
  }
  
  createAttackEffect(player) {
    for (let i = 0; i < 10; i++) {
      this.gameState.particles.push({
        x: player.x,
        y: player.y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 0.3,
        color: '#f1c40f',
        size: 4
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
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1b5e20');
    gradient.addColorStop(0.5, '#2e7d32');
    gradient.addColorStop(1, '#1b5e20');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawBackground();
    this.drawVines();
    this.drawTraps();
    this.drawTreasures();
    this.drawEnemies();
    this.drawPlayers();
    this.drawProjectiles();
    this.drawParticles();
    this.drawUI();
    
    if (this.gameState.status === 'gameover') {
      this.drawGameOver();
    }
  }
  
  drawBackground() {
    for (let i = 0; i < 30; i++) {
      const x = i * 40;
      const y = 30 + (i % 3) * 20;
      
      this.ctx.fillStyle = '#1b5e20';
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x + 10, y - 60);
      this.ctx.lineTo(x + 20, y);
      this.ctx.fill();
    }
    
    this.ctx.fillStyle = '#4caf50';
    for (let i = 0; i < 10; i++) {
      this.ctx.beginPath();
      this.ctx.arc(100 + i * 80, this.canvas.height - 60, 40, Math.PI, 0);
      this.ctx.fill();
    }
  }
  
  drawVines() {
    this.gameState.vines.forEach(vine => {
      this.ctx.strokeStyle = '#558b2f';
      this.ctx.lineWidth = vine.width;
      this.ctx.beginPath();
      this.ctx.moveTo(vine.x, vine.y);
      this.ctx.lineTo(vine.x, vine.y + vine.length);
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#7cb342';
      for (let i = 0; i < 10; i++) {
        this.ctx.beginPath();
        this.ctx.ellipse(vine.x + (i % 2 === 0 ? 10 : -10), vine.y + i * 20, 8, 4, 0, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }
  
  drawTraps() {
    this.gameState.traps.forEach(trap => {
      if (trap.triggered) return;
      
      if (trap.type === 'spike') {
        this.ctx.fillStyle = '#5d4037';
        for (let i = -2; i <= 2; i++) {
          this.ctx.beginPath();
          this.ctx.moveTo(trap.x + i * 8 - 4, trap.y + 15);
          this.ctx.lineTo(trap.x + i * 8, trap.y - 10);
          this.ctx.lineTo(trap.x + i * 8 + 4, trap.y + 15);
          this.ctx.fill();
        }
      } else if (trap.type === 'pit') {
        this.ctx.fillStyle = '#3e2723';
        this.ctx.beginPath();
        this.ctx.ellipse(trap.x, trap.y, 30, 10, 0, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (trap.type === 'snare') {
        this.ctx.strokeStyle = '#8d6e63';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(trap.x, trap.y, 20, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    });
  }
  
  drawTreasures() {
    this.gameState.treasures.forEach(treasure => {
      const glowSize = 5 + Math.sin(treasure.glow) * 3;
      
      this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      this.ctx.beginPath();
      this.ctx.arc(treasure.x, treasure.y, 25 + glowSize, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#ffd700';
      this.ctx.beginPath();
      this.ctx.arc(treasure.x, treasure.y, 15, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#b8860b';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('$', treasure.x, treasure.y + 5);
    });
  }
  
  drawEnemies() {
    this.gameState.enemies.forEach(enemy => {
      this.ctx.fillStyle = enemy.color;
      
      if (enemy.type === 'jaguar') {
        this.ctx.beginPath();
        this.ctx.ellipse(enemy.x, enemy.y, 25, 15, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#e65100';
        this.ctx.beginPath();
        this.ctx.arc(enemy.x - 10, enemy.y - 5, 4, 0, Math.PI * 2);
        this.ctx.arc(enemy.x + 10, enemy.y - 5, 4, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (enemy.type === 'snake') {
        this.ctx.beginPath();
        this.ctx.moveTo(enemy.x - 15, enemy.y);
        this.ctx.quadraticCurveTo(enemy.x, enemy.y - 10, enemy.x + 15, enemy.y);
        this.ctx.quadraticCurveTo(enemy.x, enemy.y + 5, enemy.x - 15, enemy.y);
        this.ctx.fill();
      } else if (enemy.type === 'insect') {
        this.ctx.beginPath();
        this.ctx.ellipse(enemy.x, enemy.y, 8, 6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#33691e';
        this.ctx.fillRect(enemy.x - 5, enemy.y - 8, 10, 3);
        this.ctx.fillRect(enemy.x - 5, enemy.y + 5, 10, 3);
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
      this.ctx.fillRect(enemy.x - 20, enemy.y - enemy.radius - 12, 40, 4);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(enemy.x - 20, enemy.y - enemy.radius - 12, 40 * healthPercent, 4);
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
      
      if (player.climbing) {
        this.ctx.strokeStyle = '#f1c40f';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, player.radius + 5, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(player.name.substring(0, 5), player.x, player.y - player.radius - 5);
    });
  }
  
  drawProjectiles() {
    this.gameState.projectiles.forEach(proj => {
      this.ctx.fillStyle = proj.color || '#e74c3c';
      this.ctx.beginPath();
      this.ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
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
    this.ctx.fillRect(10, 10, 180, 75);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Wave: ${this.gameState.wave}`, 20, 30);
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 50);
    this.ctx.fillText(`Enemies: ${this.gameState.enemies.length}`, 20, 70);
    
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.fillText(`Treasures: ${this.gameState.treasures.filter(t => !t.collected).length}`, 120, 30);
    
    this.gameState.players.forEach((player, i) => {
      const y = this.canvas.height - 60 - i * 40;
      
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(10, y, 150, 35);
      
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
    this.ctx.fillText(`Waves: ${this.gameState.wave}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    this.ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 60);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.JungleRaidGame = JungleRaidGame;