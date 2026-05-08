// Super Meat Boy Style Platformer
class SuperMeatBoyGame {
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
      level: 1,
      score: 0,
      deaths: 0,
      player: null,
      platforms: [],
      spikes: [],
      portals: [],
      keys: [],
      finishLine: null,
      velocity: { x: 0, y: 0 },
      grounded: false,
      jumping: false,
      wallSliding: false,
      facingRight: true,
      dashCooldown: 0,
      isDashing: false,
      dashTime: 0,
      particleTimer: 0,
      status: 'playing',
      gameOver: false
    };
    
    this.physics = {
      gravity: 1800,
      moveSpeed: 350,
      jumpForce: 650,
      friction: 0.85,
      airFriction: 0.92,
      dashSpeed: 1200,
      dashDuration: 0.15,
      wallSlideSpeed: 80,
      wallJumpForce: { x: 400, y: 500 }
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = { x: 80, y: 450, width: 24, height: 24, hitbox: { x: 4, y: 4, w: 16, h: 20 } };
    this.gameState.velocity = { x: 0, y: 0 };
    this.gameState.grounded = false;
    this.gameState.isDashing = false;
    this.gameState.dashCooldown = 0;
    
    this.gameState.platforms = [
      { x: 0, y: 500, width: 150, height: 30, type: 'normal' },
      { x: 180, y: 450, width: 80, height: 20, type: 'normal' },
      { x: 300, y: 400, width: 80, height: 20, type: 'moving', startX: 300, endX: 400, speed: 2 },
      { x: 450, y: 350, width: 100, height: 20, type: 'normal' },
      { x: 300, y: 280, width: 60, height: 20, type: 'normal' },
      { x: 150, y: 220, width: 80, height: 20, type: 'normal' },
      { x: 50, y: 150, width: 80, height: 20, type: 'normal' },
      { x: 200, y: 100, width: 150, height: 20, type: 'normal' },
      { x: 450, y: 180, width: 80, height: 20, type: 'normal' },
      { x: 600, y: 120, width: 100, height: 20, type: 'normal' },
      { x: 700, y: 200, width: 100, height: 30, type: 'normal' }
    ];
    
    this.gameState.spikes = [
      { x: 180, y: 470, width: 60, height: 10 },
      { x: 320, y: 420, width: 40, height: 10 },
      { x: 470, y: 370, width: 60, height: 10 },
      { x: 220, y: 120, width: 40, height: 10 }
    ];
    
    this.gameState.keys = [
      { x: 330, y: 250, collected: false },
      { x: 70, y: 120, collected: false }
    ];
    
    this.gameState.portals = [
      { x: 720, y: 150, width: 40, height: 50, destX: 80, destY: 450 }
    ];
    
    this.gameState.finishLine = { x: 730, y: 60, width: 30, height: 60 };
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
    if (this.gameState.gameOver) return;
    this.gameState.time += deltaTime;
    
    if (this.gameState.dashCooldown > 0) this.gameState.dashCooldown -= deltaTime;
    if (this.gameState.isDashing) {
      this.gameState.dashTime -= deltaTime;
      if (this.gameState.dashTime <= 0) {
        this.gameState.isDashing = false;
        this.gameState.velocity.x *= 0.5;
        this.gameState.velocity.y *= 0.5;
      }
    }
    
    const input = this.getPlayerInput(this.players[0]);
    const p = this.gameState.player;
    const v = this.gameState.velocity;
    
    if (!this.gameState.isDashing) {
      if (input.left) {
        v.x -= this.physics.moveSpeed * deltaTime * 10;
        this.gameState.facingRight = false;
      }
      if (input.right) {
        v.x += this.physics.moveSpeed * deltaTime * 10;
        this.gameState.facingRight = true;
      }
      
      v.x *= this.gameState.grounded ? this.physics.friction : this.physics.airFriction;
      v.x = Math.max(-this.physics.moveSpeed, Math.min(this.physics.moveSpeed, v.x));
    }
    
    if (input.jump && this.gameState.grounded) {
      v.y = -this.physics.jumpForce;
      this.gameState.grounded = false;
      this.gameState.jumping = true;
      this.spawnJumpParticles();
    }
    
    if (input.jump && this.gameState.wallSliding) {
      v.y = -this.physics.wallJumpForce.y;
      v.x = this.gameState.facingRight ? -this.physics.wallJumpForce.x : this.physics.wallJumpForce.x;
      this.gameState.wallSliding = false;
    }
    
    if (input.dash && this.gameState.dashCooldown <= 0 && !this.gameState.isDashing) {
      this.gameState.isDashing = true;
      this.gameState.dashTime = this.physics.dashDuration;
      this.gameState.dashCooldown = 0.5;
      v.x = this.gameState.facingRight ? this.physics.dashSpeed : -this.physics.dashSpeed;
      v.y = 0;
      this.spawnDashParticles();
    }
    
    if (!this.gameState.isDashing) {
      v.y += this.physics.gravity * deltaTime;
    }
    
    if (this.gameState.wallSliding && v.y > 0) {
      v.y = this.physics.wallSlideSpeed;
    }
    
    p.x += v.x * deltaTime;
    this.handleHorizontalCollisions();
    
    p.y += v.y * deltaTime;
    this.gameState.grounded = false;
    this.handleVerticalCollisions();
    
    this.checkSpikes();
    this.checkKeys();
    this.checkPortals();
    this.checkFinish();
    
    this.gameState.platforms.forEach(plat => {
      if (plat.type === 'moving') {
        plat.x += plat.speed;
        if (plat.x > plat.endX || plat.x < plat.startX) plat.speed *= -1;
      }
    });
    
    this.gameState.particleTimer += deltaTime;
    if (this.gameState.particleTimer > 0.02) {
      this.gameState.particleTimer = 0;
      if (Math.abs(v.x) > 100) {
        this.spawnRunParticles();
      }
    }
    
    if (p.y > 650) {
      this.die();
    }
  }
  
  handleHorizontalCollisions() {
    const p = this.gameState.player;
    const v = this.gameState.velocity;
    
    this.gameState.platforms.forEach(plat => {
      if (this.checkCollision(p, plat)) {
        if (v.x > 0) {
          p.x = plat.x - p.width;
          this.gameState.wallSliding = true;
          this.gameState.facingRight = false;
        } else if (v.x < 0) {
          p.x = plat.x + plat.width;
          this.gameState.wallSliding = true;
          this.gameState.facingRight = true;
        }
        v.x = 0;
      }
    });
  }
  
  handleVerticalCollisions() {
    const p = this.gameState.player;
    const v = this.gameState.velocity;
    
    this.gameState.platforms.forEach(plat => {
      if (this.checkCollision(p, plat)) {
        if (v.y > 0) {
          p.y = plat.y - p.height;
          this.gameState.grounded = true;
          this.gameState.jumping = false;
          v.y = 0;
        } else if (v.y < 0) {
          p.y = plat.y + plat.height;
          v.y = 0;
        }
      }
    });
    
    this.gameState.wallSliding = false;
    if (!this.gameState.grounded && v.y > 0) {
      this.gameState.platforms.forEach(plat => {
        if (Math.abs(p.x + p.width/2 - (plat.x + plat.width/2)) < 5 &&
            Math.abs(p.y + p.height - plat.y) < 30) {
          this.gameState.wallSliding = true;
        }
      });
    }
  }
  
  checkCollision(player, obj) {
    return player.x < obj.x + obj.width &&
           player.x + player.width > obj.x &&
           player.y < obj.y + obj.height &&
           player.y + player.height > obj.y;
  }
  
  checkSpikes() {
    const p = this.gameState.player;
    this.gameState.spikes.forEach(spike => {
      if (this.checkCollision(p, spike)) {
        this.die();
      }
    });
  }
  
  checkKeys() {
    const p = this.gameState.player;
    this.gameState.keys.forEach((key, i) => {
      if (!key.collected && this.checkCollision(p, { x: key.x - 10, y: key.y - 10, width: 20, height: 20 })) {
        key.collected = true;
        this.gameState.score += 100;
      }
    });
  }
  
  checkPortals() {
    const p = this.gameState.player;
    this.gameState.portals.forEach(portal => {
      if (this.checkCollision(p, portal)) {
        p.x = portal.destX;
        p.y = portal.destY;
        this.gameState.velocity.x = 0;
        this.gameState.velocity.y = 0;
      }
    });
  }
  
  checkFinish() {
    const p = this.gameState.player;
    const keysCollected = this.gameState.keys.filter(k => k.collected).length;
    if (keysCollected >= this.gameState.keys.length && this.checkCollision(p, this.gameState.finishLine)) {
      this.gameState.score += 1000;
      this.gameState.level++;
      if (this.gameState.level > 3) {
        this.gameState.gameOver = true;
      } else {
        this.initGame();
      }
    }
  }
  
  die() {
    this.gameState.deaths++;
    this.gameState.player.x = 80;
    this.gameState.player.y = 450;
    this.gameState.velocity = { x: 0, y: 0 };
    this.spawnDeathParticles();
  }
  
  spawnJumpParticles() {
    for (let i = 0; i < 8; i++) {
      this.gameState.particles = this.gameState.particles || [];
      this.gameState.particles.push({
        x: this.gameState.player.x + 12,
        y: this.gameState.player.y + 24,
        vx: (Math.random() - 0.5) * 100,
        vy: Math.random() * 50,
        life: 0.3,
        color: '#fff'
      });
    }
  }
  
  spawnDashParticles() {
    for (let i = 0; i < 12; i++) {
      this.gameState.particles = this.gameState.particles || [];
      this.gameState.particles.push({
        x: this.gameState.player.x + 12,
        y: this.gameState.player.y + 12,
        vx: -this.gameState.velocity.x * 0.3 + (Math.random() - 0.5) * 50,
        vy: (Math.random() - 0.5) * 50,
        life: 0.2,
        color: this.gameState.facingRight ? '#3498db' : '#e74c3c'
      });
    }
  }
  
  spawnRunParticles() {
    this.gameState.particles = this.gameState.particles || [];
    this.gameState.particles.push({
      x: this.gameState.player.x + 12,
      y: this.gameState.player.y + 24,
      vx: -this.gameState.velocity.x * 0.1,
      vy: Math.random() * 20,
      life: 0.2,
      color: '#bdc3c7'
    });
  }
  
  spawnDeathParticles() {
    for (let i = 0; i < 20; i++) {
      this.gameState.particles = this.gameState.particles || [];
      this.gameState.particles.push({
        x: this.gameState.player.x + 12,
        y: this.gameState.player.y + 12,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        life: 0.5,
        color: ['#e74c3c', '#f1c40f', '#fff'][Math.floor(Math.random() * 3)]
      });
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, 800, 600);
    
    this.ctx.fillStyle = '#2c3e50';
    this.gameState.platforms.forEach(plat => {
      this.ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
      this.ctx.strokeStyle = '#34495e';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
    });
    
    this.ctx.fillStyle = '#e74c3c';
    this.gameState.spikes.forEach(spike => {
      for (let i = 0; i < spike.width; i += 10) {
        this.ctx.beginPath();
        this.ctx.moveTo(spike.x + i, spike.y + spike.height);
        this.ctx.lineTo(spike.x + i + 5, spike.y);
        this.ctx.lineTo(spike.x + i + 10, spike.y + spike.height);
        this.ctx.fill();
      }
    });
    
    this.gameState.keys.forEach(key => {
      if (!key.collected) {
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.beginPath();
        this.ctx.arc(key.x, key.y, 10, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.fillStyle = '#f39c12';
        this.ctx.fillRect(key.x - 3, key.y, 6, 15);
      }
    });
    
    this.gameState.portals.forEach(portal => {
      const gradient = this.ctx.createRadialGradient(portal.x + portal.width/2, portal.y + portal.height/2, 0, portal.x + portal.width/2, portal.y + portal.height/2, 30);
      gradient.addColorStop(0, '#9b59b6');
      gradient.addColorStop(1, '#8e44ad');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(portal.x, portal.y, portal.width, portal.height);
    });
    
    const finish = this.gameState.finishLine;
    const keysCollected = this.gameState.keys.filter(k => k.collected).length;
    this.ctx.fillStyle = keysCollected >= this.gameState.keys.length ? '#2ecc71' : '#7f8c8d';
    this.ctx.fillRect(finish.x, finish.y, finish.width, finish.height);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.fillText('GOAL', finish.x + 2, finish.y + 35);
    
    if (this.gameState.particles) {
      this.gameState.particles.forEach((p, i) => {
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.life * 2;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
        this.ctx.fill();
        p.x += p.vx * 0.016;
        p.y += p.vy * 0.016;
        p.life -= 0.016;
      });
      this.gameState.particles = this.gameState.particles.filter(p => p.life > 0);
      this.ctx.globalAlpha = 1;
    }
    
    const p = this.gameState.player;
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(p.x, p.y, p.width, p.height);
    
    this.ctx.fillStyle = '#fff';
    const eyeOffset = this.gameState.facingRight ? 4 : -4;
    this.ctx.fillRect(p.x + 8 + eyeOffset, p.y + 6, 4, 4);
    this.ctx.fillRect(p.x + 14 + eyeOffset, p.y + 6, 4, 4);
    
    if (this.gameState.isDashing) {
      this.ctx.strokeStyle = this.gameState.facingRight ? '#3498db' : '#e74c3c';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(p.x + p.width/2, p.y);
      this.ctx.lineTo(p.x + p.width/2 - (this.gameState.facingRight ? -10 : 10), p.y - 8);
      this.ctx.stroke();
    }
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Level: ' + this.gameState.level, 20, 30);
    this.ctx.fillText('Score: ' + this.gameState.score, 120, 30);
    this.ctx.fillText('Deaths: ' + this.gameState.deaths, 250, 30);
    this.ctx.fillText('Keys: ' + this.gameState.keys.filter(k => k.collected).length + '/' + this.gameState.keys.length, 380, 30);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillText('SUPER MEAT BOY', this.canvas.width/2, 25);
    
    this.ctx.fillStyle = '#bdc3c7';
    this.ctx.font = '12px Arial';
    this.ctx.fillText('Arrows: Move | Z: Jump | X: Dash', 20, 580);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.SuperMeatBoyGame = SuperMeatBoyGame;