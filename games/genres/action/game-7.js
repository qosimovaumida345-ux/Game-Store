// Stealth Mission - Covert Operations Action Game
class StealthMissionGame {
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
      stealthMultiplier: 1,
      detectionLevel: 0,
      players: [],
      guards: [],
      cameras: [],
      lasers: [],
      documents: [],
      exitPoint: null,
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
    this.createSecuritySystem();
    
    this.players.forEach((p, i) => {
      this.gameState.players.push({
        name: p,
        x: 60,
        y: this.canvas.height - 120,
        vx: 0,
        vy: 0,
        speed: 5,
        radius: 14,
        health: 100,
        maxHealth: 100,
        stealth: true,
        hasIntel: false,
        lastKill: 0,
        color: ['#2c3e50', '#34495e', '#1a252f', '#7f8c8d'][i % 4]
      });
    });
    
    this.spawnDocuments(4);
    this.spawnGuards(4 + this.gameState.wave);
    this.gameState.exitPoint = {
      x: this.canvas.width - 60,
      y: this.canvas.height - 120,
      radius: 30
    };
  }
  
  createSecuritySystem() {
    for (let i = 0; i < 5; i++) {
      this.gameState.cameras.push({
        x: 150 + i * 130,
        y: 80,
        angle: Math.PI / 2,
        range: 150,
        fov: Math.PI / 3,
        active: true,
        rotation: 0
      });
    }
    
    for (let i = 0; i < 4; i++) {
      this.gameState.lasers.push({
        x: 200 + i * 150,
        y: this.canvas.height - 100,
        length: 80,
        vertical: true,
        active: true
      });
    }
  }
  
  spawnDocuments(count) {
    for (let i = 0; i < count; i++) {
      this.gameState.documents.push({
        x: 150 + Math.random() * (this.canvas.width - 300),
        y: 150 + Math.random() * 200,
        collected: false,
        radius: 15
      });
    }
  }
  
  spawnGuards(count) {
    for (let i = 0; i < count; i++) {
      const patrolPoints = [];
      const startX = 200 + Math.random() * (this.canvas.width - 400);
      
      patrolPoints.push({ x: startX, y: this.canvas.height - 120 });
      patrolPoints.push({ x: startX + 100 + Math.random() * 150, y: this.canvas.height - 120 });
      
      this.gameState.guards.push({
        x: patrolPoints[0].x,
        y: patrolPoints[0].y,
        vx: 0,
        radius: 15,
        health: 30,
        maxHealth: 30,
        patrolPoints: patrolPoints,
        currentPoint: 0,
        alertLevel: 0,
        state: 'patrol',
        lastSawPlayer: 0,
        color: '#5d6d7e'
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
    this.updateGuards(deltaTime);
    this.updateCameras(deltaTime);
    this.updateLasers();
    this.updateDocuments();
    this.checkDetection();
    this.checkExtraction();
    this.updateParticles(deltaTime);
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
      
      if (input.up) player.vy = -player.speed * 0.7;
      else if (input.down) player.vy = player.speed * 0.7;
      else player.vy = 0;
      
      if (input.action && this.gameState.time - player.lastKill > 0.5) {
        this.performTakedown(player);
        player.lastKill = this.gameState.time;
      }
    });
  }
  
  performTakedown(player) {
    this.gameState.guards.forEach(guard => {
      const dx = guard.x - player.x;
      const dy = guard.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 50 && player.stealth) {
        guard.health = 0;
        this.gameState.score += 200 * this.gameState.stealthMultiplier;
        
        this.gameState.detectionLevel = Math.max(0, this.gameState.detectionLevel - 5);
        
        for (let i = 0; i < 15; i++) {
          this.gameState.particles.push({
            x: guard.x, y: guard.y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 0.5,
            color: '#e74c3c',
            size: 3
          });
        }
      }
    });
  }
  
  updatePhysics(deltaTime) {
    const groundY = this.canvas.height - 100;
    
    this.gameState.players.forEach(player => {
      player.x += player.vx;
      player.y += player.vy;
      
      player.x = Math.max(player.radius, Math.min(this.canvas.width - player.radius, player.x));
      player.y = Math.max(player.radius, Math.min(groundY, player.y));
    });
    
    this.gameState.guards.forEach(guard => {
      guard.x += guard.vx;
      guard.x = Math.max(guard.radius, Math.min(this.canvas.width - guard.radius, guard.x));
    });
  }
  
  updateGuards(deltaTime) {
    this.gameState.guards = this.gameState.guards.filter(guard => {
      if (guard.health <= 0) {
        return false;
      }
      
      if (guard.state === 'patrol') {
        const target = guard.patrolPoints[guard.currentPoint];
        const dx = target.x - guard.x;
        
        if (Math.abs(dx) > 5) {
          guard.vx = Math.sign(dx) * 1.5;
        } else {
          guard.currentPoint = (guard.currentPoint + 1) % guard.patrolPoints.length;
        }
      }
      
      this.gameState.players.forEach(player => {
        const dx = player.x - guard.x;
        const dy = player.y - guard.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 200) {
          guard.alertLevel = Math.min(100, guard.alertLevel + deltaTime * 30);
          
          if (guard.alertLevel > 50) {
            guard.state = 'alert';
            this.gameState.detectionLevel += deltaTime * 10;
            this.gameState.stealthMultiplier = Math.max(0.5, 1 - this.gameState.detectionLevel / 100);
          }
        } else {
          guard.alertLevel = Math.max(0, guard.alertLevel - deltaTime * 20);
          if (guard.alertLevel === 0) {
            guard.state = 'patrol';
          }
        }
      });
      
      return guard.health > 0;
    });
  }
  
  updateCameras(deltaTime) {
    this.gameState.cameras.forEach(camera => {
      camera.rotation += deltaTime * 0.5;
      camera.angle = Math.sin(camera.rotation) * camera.fov / 2 + Math.PI / 2;
      
      if (!camera.active) return;
      
      this.gameState.players.forEach(player => {
        if (!player.stealth) return;
        
        const dx = player.x - camera.x;
        const dy = player.y - camera.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < camera.range) {
          const angleToPlayer = Math.atan2(dy, dx);
          let angleDiff = Math.abs(angleToPlayer - camera.angle);
          
          if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
          
          if (angleDiff < camera.fov / 2) {
            this.gameState.detectionLevel += deltaTime * 20;
          }
        }
      });
    });
  }
  
  updateLasers() {
    this.gameState.lasers.forEach(laser => {
      if (!laser.active) return;
      
      this.gameState.players.forEach(player => {
        if (!player.stealth) return;
        
        if (laser.vertical) {
          if (Math.abs(player.x - laser.x) < 5 && 
              player.y > laser.y - laser.length && 
              player.y < laser.y + laser.length) {
            this.gameState.detectionLevel += 0.5;
          }
        }
      });
    });
  }
  
  updateDocuments() {
    this.gameState.documents = this.gameState.documents.filter(doc => {
      if (doc.collected) return false;
      
      this.gameState.players.forEach(player => {
        if (player.health <= 0) return;
        
        const dx = player.x - doc.x;
        const dy = player.y - doc.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.radius + doc.radius) {
          doc.collected = true;
          player.hasIntel = true;
          this.gameState.score += 500;
          
          for (let i = 0; i < 15; i++) {
            this.gameState.particles.push({
              x: doc.x, y: doc.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              life: 0.5,
              color: '#3498db',
              size: 3
            });
          }
        }
      });
      
      return !doc.collected;
    });
  }
  
  checkDetection() {
    this.gameState.detectionLevel = Math.max(0, Math.min(100, this.gameState.detectionLevel));
    
    if (this.gameState.detectionLevel > 80) {
      this.gameState.players.forEach(player => {
        player.stealth = false;
      });
    } else if (this.gameState.detectionLevel < 30) {
      this.gameState.players.forEach(player => {
        player.stealth = true;
      });
    }
  }
  
  checkExtraction() {
    this.gameState.players.forEach(player => {
      if (!player.hasIntel || player.health <= 0) return;
      
      const dx = player.x - this.gameState.exitPoint.x;
      const dy = player.y - this.gameState.exitPoint.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < player.radius + this.gameState.exitPoint.radius) {
        this.gameState.status = 'extracted';
      }
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
    if (this.gameState.guards.length === 0 && this.gameState.status === 'playing') {
      this.gameState.wave++;
      setTimeout(() => {
        this.spawnGuards(3 + this.gameState.wave);
      }, 2000);
    }
  }
  
  getPlayerInput(name) {
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawBackground();
    this.drawLasers();
    this.drawCameras();
    this.drawDocuments();
    this.drawExitPoint();
    this.drawGuards();
    this.drawPlayers();
    this.drawParticles();
    this.drawUI();
    
    if (this.gameState.status === 'gameover') {
      this.drawGameOver();
    } else if (this.gameState.status === 'extracted') {
      this.drawVictory();
    }
  }
  
  drawBackground() {
    this.ctx.fillStyle = '#0f0f1a';
    for (let i = 0; i < 15; i++) {
      this.ctx.fillRect(50 + i * 55, 40, 40, this.canvas.height - 140);
    }
    
    this.ctx.fillStyle = '#16213e';
    this.ctx.fillRect(0, this.canvas.height - 100, this.canvas.width, 100);
  }
  
  drawLasers() {
    this.gameState.lasers.forEach(laser => {
      if (!laser.active) return;
      
      const pulse = Math.sin(this.gameState.time * 15) * 0.3 + 0.7;
      this.ctx.strokeStyle = `rgba(231, 76, 60, ${pulse})`;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(laser.x, laser.y - laser.length);
      this.ctx.lineTo(laser.x, laser.y + laser.length);
      this.ctx.stroke();
    });
  }
  
  drawCameras() {
    this.gameState.cameras.forEach(camera => {
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.fillRect(camera.x - 10, camera.y - 5, 20, 10);
      
      const gradient = this.ctx.createRadialGradient(camera.x, camera.y, 0, camera.x, camera.y, camera.range);
      gradient.addColorStop(0, 'rgba(231, 76, 60, 0.1)');
      gradient.addColorStop(1, 'rgba(231, 76, 60, 0)');
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.moveTo(camera.x, camera.y);
      this.ctx.arc(camera.x, camera.y, camera.range, camera.angle - camera.fov / 2, camera.angle + camera.fov / 2);
      this.ctx.fill();
    });
  }
  
  drawDocuments() {
    this.gameState.documents.forEach(doc => {
      this.ctx.fillStyle = '#3498db';
      this.ctx.beginPath();
      this.ctx.rect(doc.x - 10, doc.y - 12, 20, 24);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('?', doc.x, doc.y + 4);
    });
  }
  
  drawExitPoint() {
    const exit = this.gameState.exitPoint;
    const pulse = Math.sin(this.gameState.time * 3) * 5;
    
    this.ctx.strokeStyle = '#27ae60';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(exit.x, exit.y, exit.radius + pulse, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#27ae60';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('EXIT', exit.x, exit.y + 4);
  }
  
  drawGuards() {
    this.gameState.guards.forEach(guard => {
      this.ctx.fillStyle = guard.alertLevel > 50 ? '#e74c3c' : guard.color;
      this.ctx.beginPath();
      this.ctx.arc(guard.x, guard.y, guard.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      if (guard.alertLevel > 0) {
        this.ctx.fillStyle = '#f39c12';
        this.ctx.fillRect(guard.x - 15, guard.y - 25, 30 * (guard.alertLevel / 100), 4);
      }
    });
  }
  
  drawPlayers() {
    this.gameState.players.forEach(player => {
      if (player.health <= 0) return;
      
      if (player.stealth) {
        this.ctx.globalAlpha = 0.7;
      }
      
      this.ctx.fillStyle = player.color;
      this.ctx.beginPath();
      this.ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.stroke();
      
      if (player.hasIntel) {
        this.ctx.fillStyle = '#3498db';
        this.ctx.fillRect(player.x - 8, player.y - 22, 16, 6);
      }
      
      this.ctx.globalAlpha = 1;
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
    this.ctx.fillRect(10, 10, 220, 80);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Wave: ${this.gameState.wave}`, 20, 30);
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 50);
    
    this.ctx.fillStyle = this.gameState.stealthMultiplier > 0.8 ? '#2ecc71' : '#e74c3c';
    this.ctx.fillText(`Stealth: ${Math.floor(this.gameState.stealthMultiplier * 100)}%`, 20, 70);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillText(`Detection: ${Math.floor(this.gameState.detectionLevel)}%`, 130, 30);
    
    this.gameState.players.forEach((player, i) => {
      const y = this.canvas.height - 50 - i * 35;
      
      this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
      this.ctx.fillRect(10, y, 140, 30);
      
      this.ctx.fillStyle = player.color;
      this.ctx.font = '11px Arial';
      this.ctx.fillText(player.name, 20, y + 15);
      
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.fillRect(70, y + 10, 60, 8);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(70, y + 10, 60 * (player.health / player.maxHealth), 8);
    });
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.9)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('DETECTED', this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '25px Arial';
    this.ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
  }
  
  drawVictory() {
    this.ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#27ae60';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('MISSION COMPLETE', this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '25px Arial';
    this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.StealthMissionGame = StealthMissionGame;