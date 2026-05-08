// Special Forces - Elite Military Action Game
class SpecialForcesGame {
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
      targets: [],
      hostages: [],
      bombs: [],
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
        x: 80,
        y: this.canvas.height - 140,
        vx: 0,
        vy: 0,
        speed: 5.5,
        radius: 16,
        health: 100,
        maxHealth: 100,
        ammo: 20,
        maxAmmo: 20,
        hasTarget: false,
        hasBombDefused: false,
        color: ['#1a1a2e', '#16213e', '#0f3460', '#533483'][i % 4]
      });
    });
    
    this.spawnWave();
    this.spawnHostages(2);
    this.spawnBombs(3);
  }
  
  spawnWave() {
    const targetCount = 3 + this.gameState.wave;
    
    for (let i = 0; i < targetCount; i++) {
      this.gameState.targets.push({
        x: 250 + Math.random() * (this.canvas.width - 350),
        y: 120 + Math.random() * 250,
        radius: 18,
        health: 40 + this.gameState.wave * 10,
        maxHealth: 40 + this.gameState.wave * 10,
        type: ['terrorist', 'sniper', 'leader'][Math.min(Math.floor(Math.random() * 3), this.gameState.wave - 1)],
        state: 'alert',
        patrolAngle: Math.random() * Math.PI * 2,
        reward: 200 + this.gameState.wave * 100
      });
    }
  }
  
  spawnHostages(count) {
    for (let i = 0; i < count; i++) {
      this.gameState.hostages.push({
        x: 200 + Math.random() * (this.canvas.width - 400),
        y: this.canvas.height - 150,
        radius: 14,
        rescued: false,
        health: 30
      });
    }
  }
  
  spawnBombs(count) {
    for (let i = 0; i < count; i++) {
      this.gameState.bombs.push({
        x: 300 + Math.random() * (this.canvas.width - 400),
        y: this.canvas.height - 120,
        timer: 30 + this.gameState.wave * 10,
        defused: false,
        radius: 20
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
    this.updateTargets(deltaTime);
    this.updateBombs(deltaTime);
    this.updateHostages();
    this.updateBullets(deltaTime);
    this.updateParticles(deltaTime);
    this.checkWaveCompletion();
    this.checkMissionStatus();
    
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
      
      if (input.special && !player.hasTarget) {
        this.scanTargets(player);
      }
    });
  }
  
  fireBullet(player) {
    const target = this.findNearestTarget(player);
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
      damage: 35 + this.gameState.wave * 5,
      fromPlayer: true
    });
  }
  
  scanTargets(player) {
    this.gameState.targets.forEach(target => {
      const dx = target.x - player.x;
      const dy = target.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 150) {
        player.hasTarget = true;
        this.gameState.score += 100;
      }
    });
  }
  
  findNearestTarget(player) {
    let nearest = null;
    let minDist = Infinity;
    
    this.gameState.targets.forEach(target => {
      if (target.health <= 0) return;
      const dx = target.x - player.x;
      const dy = target.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearest = target;
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
  
  updateTargets(deltaTime) {
    this.gameState.targets.forEach(target => {
      target.patrolAngle += deltaTime * 0.5;
      
      target.x += Math.cos(target.patrolAngle) * 0.5;
      target.y += Math.sin(target.patrolAngle) * 0.3;
      
      target.x = Math.max(target.radius, Math.min(this.canvas.width - target.radius, target.x));
      target.y = Math.max(100, Math.min(this.canvas.height - 100, target.y));
      
      this.gameState.players.forEach(player => {
        const dx = player.x - target.x;
        const dy = player.y - target.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 180) {
          target.state = 'combat';
        } else {
          target.state = 'alert';
        }
      });
    });
  }
  
  updateBombs(deltaTime) {
    this.gameState.bombs = this.gameState.bombs.filter(bomb => {
      if (bomb.defused) return false;
      
      bomb.timer -= deltaTime;
      
      if (bomb.timer <= 0) {
        this.gameState.status = 'missionfailed';
        return false;
      }
      
      this.gameState.players.forEach(player => {
        if (player.health <= 0 || player.hasBombDefused) return;
        
        const dx = player.x - bomb.x;
        const dy = player.y - bomb.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.radius + bomb.radius) {
          bomb.defused = true;
          player.hasBombDefused = true;
          this.gameState.score += 300;
          
          for (let i = 0; i < 20; i++) {
            this.gameState.particles.push({
              x: bomb.x, y: bomb.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              life: 0.8,
              color: '#2ecc71',
              size: 4
            });
          }
        }
      });
      
      return true;
    });
  }
  
  updateHostages() {
    this.gameState.hostages = this.gameState.hostages.filter(hostage => {
      if (hostage.rescued) return false;
      
      this.gameState.players.forEach(player => {
        if (player.health <= 0) return;
        
        const dx = player.x - hostage.x;
        const dy = player.y - hostage.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.radius + hostage.radius) {
          hostage.rescued = true;
          this.gameState.score += 250;
          
          for (let i = 0; i < 15; i++) {
            this.gameState.particles.push({
              x: hostage.x, y: hostage.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              life: 0.6,
              color: '#3498db',
              size: 3
            });
          }
        }
      });
      
      return !hostage.rescued;
    });
  }
  
  updateBullets(deltaTime) {
    this.gameState.bullets = this.gameState.bullets.filter(bullet => {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      
      if (bullet.x < 0 || bullet.x > this.canvas.width || bullet.y < 0 || bullet.y > this.canvas.height) {
        return false;
      }
      
      this.gameState.targets.forEach(target => {
        if (target.health <= 0) return;
        
        const dx = target.x - bullet.x;
        const dy = target.y - bullet.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < target.radius + bullet.radius) {
          target.health -= bullet.damage;
          this.gameState.score += bullet.damage;
          
          for (let i = 0; i < 8; i++) {
            this.gameState.particles.push({
              x: bullet.x, y: bullet.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              life: 0.4,
              color: '#e74c3c',
              size: 2
            });
          }
          return false;
        }
      });
      
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
  
  checkWaveCompletion() {
    if (this.gameState.targets.length === 0 && this.gameState.status === 'playing') {
      this.gameState.wave++;
      setTimeout(() => this.spawnWave(), 2000);
    }
  }
  
  checkMissionStatus() {
    const allHostagesRescued = this.gameState.hostages.every(h => h.rescued);
    const allBombsDefused = this.gameState.bombs.every(b => b.defused);
    const allTargetsEliminated = this.gameState.targets.length === 0;
    
    if (allHostagesRescued && allBombsDefused && allTargetsEliminated && this.gameState.status === 'playing') {
      this.gameState.status = 'victory';
    }
  }
  
  getPlayerInput(name) {
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#0d1117';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawBackground();
    this.drawBombs();
    this.drawHostages();
    this.drawTargets();
    this.drawPlayers();
    this.drawBullets();
    this.drawParticles();
    this.drawUI();
    
    if (this.gameState.status === 'gameover') {
      this.drawGameOver();
    } else if (this.gameState.status === 'victory') {
      this.drawVictory();
    } else if (this.gameState.status === 'missionfailed') {
      this.drawMissionFailed();
    }
  }
  
  drawBackground() {
    this.ctx.fillStyle = '#161b22';
    for (let i = 0; i < 12; i++) {
      this.ctx.fillRect(60 + i * 65, 60, 50, this.canvas.height - 160);
    }
    
    this.ctx.fillStyle = '#21262d';
    this.ctx.fillRect(0, this.canvas.height - 100, this.canvas.width, 100);
  }
  
  drawBombs() {
    this.gameState.bombs.forEach(bomb => {
      const pulse = Math.sin(this.gameState.time * 8) * 0.3 + 0.7;
      
      this.ctx.fillStyle = `rgba(231, 76, 60, ${pulse})`;
      this.ctx.beginPath();
      this.ctx.arc(bomb.x, bomb.y, bomb.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(Math.ceil(bomb.timer), bomb.x, bomb.y + 4);
    });
  }
  
  drawHostages() {
    this.gameState.hostages.forEach(hostage => {
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.beginPath();
      this.ctx.arc(hostage.x, hostage.y, hostage.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.fillText('H', hostage.x, hostage.y + 4);
    });
  }
  
  drawTargets() {
    this.gameState.targets.forEach(target => {
      this.ctx.fillStyle = target.state === 'combat' ? '#e74c3c' : '#5d6d7e';
      this.ctx.beginPath();
      this.ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      const healthPercent = target.health / target.maxHealth;
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.fillRect(target.x - 15, target.y - 28, 30, 4);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(target.x - 15, target.y - 28, 30 * healthPercent, 4);
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
      
      if (player.hasTarget) {
        this.ctx.strokeStyle = '#e74c3c';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, player.radius + 8, 0, Math.PI * 2);
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
    this.ctx.fillRect(10, 10, 200, 90);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Wave: ${this.gameState.wave}`, 20, 30);
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 50);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillText(`Targets: ${this.gameState.targets.length}`, 20, 70);
    
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillText(`Bombs: ${this.gameState.bombs.filter(b => !b.defused).length}`, 130, 30);
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.fillText(`Hostages: ${this.gameState.hostages.filter(h => !h.rescued).length}`, 130, 50);
    
    this.gameState.players.forEach((player, i) => {
      const y = this.canvas.height - 55 - i * 40;
      
      this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
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
    this.ctx.fillStyle = 'rgba(0,0,0,0.9)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 55px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('MISSION FAILED', this.canvas.width / 2, this.canvas.height / 2 - 30);
  }
  
  drawVictory() {
    this.ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#27ae60';
    this.ctx.font = 'bold 55px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('MISSION COMPLETE', this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '28px Arial';
    this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
  }
  
  drawMissionFailed() {
    this.ctx.fillStyle = 'rgba(192, 57, 43, 0.4)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#c0392b';
    this.ctx.font = 'bold 55px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BOMBS EXPLODED', this.canvas.width / 2, this.canvas.height / 2 - 30);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.SpecialForcesGame = SpecialForcesGame;