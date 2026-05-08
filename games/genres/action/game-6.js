// Tactical Ops - Tactical Warfare Action Game
class TacticalOpsGame {
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
      missionObjective: 'eliminate',
      players: [],
      enemies: [],
      hostages: [],
      objectives: [],
      bullets: [],
      gadgets: [],
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
        y: this.canvas.height - 150,
        vx: 0,
        vy: 0,
        speed: 4.5,
        radius: 15,
        health: 100,
        maxHealth: 100,
        ammo: 15,
        maxAmmo: 15,
        gadget: 'flashbang',
        hasObjective: false,
        isStealthed: false,
        color: ['#2c3e50', '#2980b9', '#16a085', '#8e44ad'][i % 4]
      });
    });
    
    this.spawnObjectives(3);
    this.spawnHostages(2);
    this.spawnWave();
  }
  
  spawnObjectives(count) {
    for (let i = 0; i < count; i++) {
      this.gameState.objectives.push({
        x: 200 + Math.random() * (this.canvas.width - 400),
        y: 150 + Math.random() * 200,
        type: ['intel', 'documents', ' VIP'][Math.floor(Math.random() * 3)],
        collected: false,
        radius: 20
      });
    }
  }
  
  spawnHostages(count) {
    for (let i = 0; i < count; i++) {
      this.gameState.hostages.push({
        x: 300 + Math.random() * (this.canvas.width - 600),
        y: this.canvas.height - 150,
        rescued: false,
        health: 50,
        radius: 12
      });
    }
  }
  
  spawnWave() {
    const enemyCount = 3 + this.gameState.wave * 2;
    
    for (let i = 0; i < enemyCount; i++) {
      const types = ['guard', 'sniper', 'terrorist', 'leader'];
      const type = types[Math.min(Math.floor(Math.random() * types.length), Math.min(this.gameState.wave - 1, 3))];
      
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
      radius: 15,
      health: 40 + this.gameState.wave * 15,
      maxHealth: 40 + this.gameState.wave * 15,
      damage: 10 + this.gameState.wave * 4,
      speed: 1.5 + Math.random(),
      type: type,
      state: 'patrol',
      alertLevel: 0,
      attackCooldown: 0,
      hitStun: 0,
      color: '#5d6d7e',
      reward: 100 + this.gameState.wave * 50
    };
    
    switch(type) {
      case 'guard':
        Object.assign(baseEnemy, { range: 150, fireRate: 1.5, patrolRange: 100 });
        break;
      case 'sniper':
        Object.assign(baseEnemy, { range: 400, fireRate: 3, damage: baseEnemy.damage * 2, isStatic: true });
        break;
      case 'terrorist':
        Object.assign(baseEnemy, { range: 100, fireRate: 0.8, speed: baseEnemy.speed * 1.3, canBomb: true });
        break;
      case 'leader':
        Object.assign(baseEnemy, { range: 180, fireRate: 1.2, canCallReinforcement: true, health: baseEnemy.health * 1.5 });
        break;
    }
    
    return baseEnemy;
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
    this.updateObjectives();
    this.updateHostages();
    this.updateGadgets(deltaTime);
    this.updateParticles(deltaTime);
    this.checkWaveCompletion();
    this.checkMissionSuccess();
    
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
      
      if (input.up) player.vy = -player.speed * 0.6;
      else if (input.down) player.vy = player.speed * 0.6;
      else player.vy = 0;
      
      if (input.action && player.ammo > 0) {
        this.fireBullet(player);
        player.ammo--;
      }
      
      if (input.special) {
        this.useGadget(player);
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
      radius: 2,
      damage: 30 + this.gameState.wave * 5,
      fromPlayer: true,
      isSilent: player.isStealthed
    });
  }
  
  useGadget(player) {
    if (player.gadget === 'flashbang') {
      this.gameState.enemies.forEach(enemy => {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 150) {
          enemy.alertLevel = 0;
          enemy.state = 'stunned';
          enemy.attackCooldown = 3;
        }
      });
      
      for (let i = 0; i < 20; i++) {
        this.gameState.particles.push({
          x: player.x, y: player.y,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          life: 0.5,
          color: '#f1c40f',
          size: 5
        });
      }
    } else if (player.gadget === 'smoke') {
      this.gameState.gadgets.push({
        x: player.x,
        y: player.y,
        radius: 10,
        maxRadius: 80,
        life: 5,
        type: 'smoke'
      });
    }
    
    player.gadget = player.gadget === 'flashbang' ? 'smoke' : 'flashbang';
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
  
  handleCombat() {
    this.gameState.enemies.forEach(enemy => {
      if (enemy.hitStun > 0) {
        enemy.hitStun -= 0.016;
        return;
      }
      
      if (enemy.attackCooldown > 0) {
        enemy.attackCooldown -= 0.016;
      }
      
      if (enemy.state === 'stunned' && enemy.attackCooldown <= 0) {
        enemy.state = 'patrol';
      }
      
      const targetPlayer = this.findTargetPlayer(enemy);
      if (!targetPlayer) return;
      
      const dx = targetPlayer.x - enemy.x;
      const dy = targetPlayer.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < enemy.range && enemy.attackCooldown <= 0) {
        this.enemyFire(enemy, targetPlayer);
        enemy.attackCooldown = enemy.fireRate;
      } else if (dist < enemy.range * 1.5) {
        enemy.alertLevel = Math.min(100, enemy.alertLevel + 1);
        
        if (enemy.alertLevel > 50) {
          enemy.vx = Math.sign(dx) * enemy.speed;
        }
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
    
    this.gameState.bullets.push({
      x: enemy.x,
      y: enemy.y,
      vx: Math.cos(angle) * 14,
      vy: Math.sin(angle) * 14,
      radius: 2,
      damage: enemy.damage,
      fromPlayer: false
    });
  }
  
  updateEnemies(deltaTime) {
    this.gameState.enemies = this.gameState.enemies.filter(enemy => {
      if (enemy.health <= 0) {
        this.gameState.score += enemy.reward;
        
        if (enemy.type === 'leader') {
          this.gameState.missionObjective = 'extract';
        }
        
        for (let i = 0; i < 15; i++) {
          this.gameState.particles.push({
            x: enemy.x, y: enemy.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 0.6,
            color: '#5d6d7e',
            size: 3
          });
        }
        return false;
      }
      return true;
    });
  }
  
  updateObjectives() {
    this.gameState.objectives = this.gameState.objectives.filter(obj => {
      if (obj.collected) return false;
      
      this.gameState.players.forEach(player => {
        if (player.health <= 0) return;
        
        const dx = player.x - obj.x;
        const dy = player.y - obj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.radius + obj.radius) {
          obj.collected = true;
          player.hasObjective = true;
          this.gameState.score += 500;
          
          for (let i = 0; i < 15; i++) {
            this.gameState.particles.push({
              x: obj.x, y: obj.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              life: 0.6,
              color: '#f1c40f',
              size: 4
            });
          }
        }
      });
      
      return !obj.collected;
    });
  }
  
  updateHostages() {
    this.gameState.hostages = this.gameState.hostages.filter(hostage => {
      if (hostage.rescued) return false;
      
      this.gameState.players.forEach(player => {
        if (player.health <= 0 || !player.hasObjective) return;
        
        const dx = player.x - hostage.x;
        const dy = player.y - hostage.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.radius + hostage.radius) {
          hostage.rescued = true;
          this.gameState.score += 300;
          
          for (let i = 0; i < 15; i++) {
            this.gameState.particles.push({
              x: hostage.x, y: hostage.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              life: 0.6,
              color: '#2ecc71',
              size: 4
            });
          }
        }
      });
      
      return !hostage.rescued;
    });
  }
  
  updateGadgets(deltaTime) {
    this.gameState.gadgets = this.gameState.gadgets.filter(gadget => {
      gadget.life -= deltaTime;
      
      if (gadget.type === 'smoke' && gadget.radius < gadget.maxRadius) {
        gadget.radius += 2;
      }
      
      return gadget.life > 0;
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
    if (this.gameState.enemies.length === 0 && this.gameState.status === 'playing') {
      this.gameState.wave++;
      setTimeout(() => this.spawnWave(), 2000);
    }
  }
  
  checkMissionSuccess() {
    if (this.gameState.missionObjective === 'extract') {
      const allRescued = this.gameState.hostages.every(h => h.rescued);
      const allHaveObjectives = this.gameState.players.every(p => p.hasObjective || p.health <= 0);
      
      if (allRescued && allHaveObjectives) {
        this.gameState.status = 'victory';
      }
    }
  }
  
  getPlayerInput(name) {
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawBackground();
    this.drawObjectives();
    this.drawHostages();
    this.drawEnemies();
    this.drawPlayers();
    this.drawGadgets();
    this.drawParticles();
    this.drawUI();
    
    if (this.gameState.status === 'gameover') {
      this.drawGameOver();
    } else if (this.gameState.status === 'victory') {
      this.drawVictory();
    }
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#0f0f0f');
    gradient.addColorStop(1, '#1a1a1a');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#2c2c2c';
    for (let i = 0; i < 10; i++) {
      this.ctx.fillRect(50 + i * 80, 50, 60, this.canvas.height - 150);
    }
  }
  
  drawObjectives() {
    this.gameState.objectives.forEach(obj => {
      const pulse = Math.sin(this.gameState.time * 4) * 3;
      
      this.ctx.fillStyle = '#f39c12';
      this.ctx.beginPath();
      this.ctx.arc(obj.x, obj.y, obj.radius + pulse, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('?', obj.x, obj.y + 5);
    });
  }
  
  drawHostages() {
    this.gameState.hostages.forEach(hostage => {
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.beginPath();
      this.ctx.arc(hostage.x, hostage.y, hostage.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.fillText('H', hostage.x, hostage.y + 4);
    });
  }
  
  drawEnemies() {
    this.gameState.enemies.forEach(enemy => {
      this.ctx.fillStyle = enemy.color;
      
      if (enemy.state === 'stunned') {
        this.ctx.globalAlpha = 0.6;
      }
      
      this.ctx.beginPath();
      this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.globalAlpha = 1;
      
      if (enemy.alertLevel > 50) {
        this.ctx.strokeStyle = '#e74c3c';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(enemy.x, enemy.y, enemy.radius + 8, 0, Math.PI * 2);
        this.ctx.stroke();
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
      
      if (player.hasObjective) {
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.fillRect(player.x - 10, player.y - 25, 20, 8);
      }
    });
  }
  
  drawGadgets() {
    this.gameState.gadgets.forEach(gadget => {
      if (gadget.type === 'smoke') {
        this.ctx.fillStyle = 'rgba(150, 150, 150, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(gadget.x, gadget.y, gadget.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
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
    this.ctx.fillRect(10, 10, 200, 80);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Wave: ${this.gameState.wave}`, 20, 30);
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 50);
    
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillText(`Mission: ${this.gameState.missionObjective}`, 20, 70);
    
    this.gameState.players.forEach((player, i) => {
      const y = this.canvas.height - 60 - i * 45;
      
      this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
      this.ctx.fillRect(10, y, 160, 40);
      
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
    this.ctx.fillStyle = 'rgba(0,0,0,0.9)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 60px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('MISSION FAILED', this.canvas.width / 2, this.canvas.height / 2 - 40);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
  }
  
  drawVictory() {
    this.ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#27ae60';
    this.ctx.font = 'bold 60px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('MISSION COMPLETE', this.canvas.width / 2, this.canvas.height / 2 - 40);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.TacticalOpsGame = TacticalOpsGame;