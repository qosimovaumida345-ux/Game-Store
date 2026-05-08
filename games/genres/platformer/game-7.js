// City Parkour - Urban Stealth Platformer
class CityParkour {
  constructor(canvas, players, gameId) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.players = players;
    this.gameId = gameId;
    this.isRunning = false;
    this.lastTime = 0;
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    this.config = {
      gravity: 0.6,
      jumpForce: -14,
      doubleJump: true,
      moveSpeed: 6,
      wallRun: true,
      wallRunSpeed: 8,
      dashSpeed: 15,
      dashDuration: 0.3,
      dashCooldown: 2,
      climbSpeed: 3,
      levelWidth: 5000,
      cameraSpeed: 0.12
    };
    
    this.gameState = {
      players: {},
      time: 0,
      level: 1,
      score: 0,
      status: 'playing',
      buildings: [],
      ledges: [],
      vents: [],
      airConditioners: [],
      securityCameras: [],
      lasers: [],
      guards: [],
      dataPoints: [],
      objectives: [],
      generators: [],
      timeOfDay: 'night',
      alertLevel: 0,
      detected: false
    };
    
    this.player = null;
    this.camera = { x: 0, y: 0 };
    this.particles = [];
    this.inputState = {};
    this.ledgeGrabTimer = 0;
    this.isWallRunning = false;
    this.wallRunDirection = 0;
    
    this.generateLevel();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  generateLevel() {
    this.gameState.buildings = [];
    this.gameState.ledges = [];
    this.gameState.vents = [];
    this.gameState.airConditioners = [];
    this.gameState.securityCameras = [];
    this.gameState.lasers = [];
    this.gameState.guards = [];
    this.gameState.dataPoints = [];
    this.gameState.objectives = [];
    this.gameState.generators = [];
    
    // Building platforms (vertical cityscape)
    const buildingData = [
      { x: 0, y: this.canvas.height - 50, w: 400, h: 50, type: 'ground' },
      { x: 500, y: this.canvas.height - 80, w: 350, h: 80, type: 'building' },
      { x: 950, y: this.canvas.height - 120, w: 400, h: 120, type: 'skyscraper' },
      { x: 1450, y: this.canvas.height - 60, w: 380, h: 60, type: 'building' },
      { x: 1930, y: this.canvas.height - 150, w: 450, h: 150, type: 'skyscraper' },
      { x: 2480, y: this.canvas.height - 80, w: 400, h: 80, type: 'building' },
      { x: 2980, y: this.canvas.height - 100, w: 350, h: 100, type: 'tower' },
      { x: 3430, y: this.canvas.height - 60, w: 420, h: 60, type: 'building' },
      { x: 3950, y: this.canvas.height - 120, w: 450, h: 120, type: 'skyscraper' },
      { x: 4500, y: this.canvas.height - 80, w: 400, h: 80, type: 'building' }
    ];
    
    buildingData.forEach(b => {
      this.gameState.buildings.push({
        x: b.x, y: b.y, width: b.w, height: b.h, type: b.type
      });
    });
    
    // Floating ledges (parkour points)
    const ledgeData = [
      { x: 150, y: this.canvas.height - 150, w: 80 },
      { x: 300, y: this.canvas.height - 220, w: 100 },
      { x: 550, y: this.canvas.height - 180, w: 80 },
      { x: 700, y: this.canvas.height - 280, w: 100 },
      { x: 900, y: this.canvas.height - 220, w: 80 },
      { x: 1100, y: this.canvas.height - 320, w: 100 },
      { x: 1300, y: this.canvas.height - 180, w: 80 },
      { x: 1500, y: this.canvas.height - 260, w: 100 },
      { x: 1750, y: this.canvas.height - 350, w: 120 },
      { x: 2000, y: this.canvas.height - 280, w: 100 },
      { x: 2200, y: this.canvas.height - 380, w: 80 },
      { x: 2450, y: this.canvas.height - 200, w: 100 },
      { x: 2700, y: this.canvas.height - 320, w: 120 },
      { x: 2950, y: this.canvas.height - 180, w: 80 },
      { x: 3150, y: this.canvas.height - 280, w: 100 },
      { x: 3400, y: this.canvas.height - 160, w: 80 },
      { x: 3600, y: this.canvas.height - 260, w: 120 },
      { x: 3850, y: this.canvas.height - 220, w: 100 },
      { x: 4100, y: this.canvas.height - 320, w: 80 },
      { x: 4350, y: this.canvas.height - 180, w: 100 },
      { x: 4600, y: this.canvas.height - 280, w: 120 }
    ];
    
    ledgeData.forEach((l, i) => {
      this.gameState.ledges.push({
        x: l.x, y: l.y, width: l.w, height: 15,
        climbable: i % 2 === 0, tagged: false
      });
    });
    
    // Vents (hiding spots)
    const ventPositions = [
      { x: 400, y: this.canvas.height - 130, occupied: false },
      { x: 1700, y: this.canvas.height - 200, occupied: false },
      { x: 2900, y: this.canvas.height - 150, occupied: false },
      { x: 4200, y: this.canvas.height - 170, occupied: false }
    ];
    
    this.gameState.vents = ventPositions.map(v => ({
      x: v.x, y: v.y, width: 40, height: 30, occupied: v.occupied
    }));
    
    // Air conditioners (obstacles)
    for (let i = 0; i < 15; i++) {
      this.gameState.airConditioners.push({
        x: 200 + Math.random() * (this.config.levelWidth - 400),
        y: this.canvas.height - 50 + Math.random() * 30,
        width: 30, height: 25, working: false
      });
    }
    
    // Security cameras (hazards)
    const cameraData = [
      { x: 600, y: 50, range: 150, angle: 0, sweepLeft: true },
      { x: 1300, y: 50, range: 120, angle: Math.PI, sweepLeft: false },
      { x: 2100, y: 50, range: 180, angle: Math.PI / 2, sweepLeft: true },
      { x: 3000, y: 50, range: 140, angle: -Math.PI / 2, sweepLeft: false },
      { x: 3800, y: 50, range: 160, angle: 0, sweepLeft: true }
    ];
    
    this.gameState.securityCameras = cameraData.map(c => ({
      x: c.x, y: c.y, width: 20, height: 15,
      range: c.range, angle: c.angle, sweepLeft: c.sweepLeft,
      sweepAngle: 0, sweepSpeed: 0.02, alerted: false
    }));
    
    // Lasers (security system)
    const laserData = [
      { x: 1000, y: this.canvas.height - 150, horizontal: true },
      { x: 2000, y: this.canvas.height - 250, horizontal: false },
      { x: 3200, y: this.canvas.height - 200, horizontal: true },
      { x: 4100, y: this.canvas.height - 300, horizontal: true }
    ];
    
    this.gameState.lasers = laserData.map(l => ({
      x: l.x, y: l.y, length: 100,
      horizontal: l.horizontal,
      active: true, pulse: 0
    }));
    
    // Guards (patrolling enemies)
    const guardData = [
      { x: 300, y: this.canvas.height - 90, range: 150 },
      { x: 1100, y: this.canvas.height - 160, range: 100 },
      { x: 1900, y: this.canvas.height - 190, range: 120 },
      { x: 2700, y: this.canvas.height - 120, range: 150 },
      { x: 3500, y: this.canvas.height - 100, range: 100 }
    ];
    
    this.gameState.guards = guardData.map(g => ({
      x: g.x, y: g.y, width: 25, height: 40,
      startX: g.x, range: g.range,
      speed: 1.5, direction: 1,
      patrol: true, alert: false,
      animTimer: 0, alive: true
    }));
    
    // Data points (collectibles)
    const dataPositions = [
      { x: 250, y: this.canvas.height - 270 }, { x: 850, y: this.canvas.height - 330 },
      { x: 1350, y: this.canvas.height - 210 }, { x: 2050, y: this.canvas.height - 400 },
      { x: 2850, y: this.canvas.height - 230 }, { x: 3650, y: this.canvas.height - 180 },
      { x: 4450, y: this.canvas.height - 330 }
    ];
    
    this.gameState.dataPoints = dataPositions.map(d => ({
      x: d.x, y: d.y, radius: 12, collected: false, hacked: false,
      hackProgress: 0
    }));
    
    // Hackable objectives
    this.gameState.objectives = [
      { x: 1900, y: this.canvas.height - 250, type: 'server', hacked: false },
      { x: 3300, y: this.canvas.height - 180, type: 'terminal', hacked: false }
    ];
    
    // Generators (disable security)
    this.gameState.generators = [
      { x: 1100, y: this.canvas.height - 130, active: true },
      { x: 2500, y: this.canvas.height - 150, active: true },
      { x: 3900, y: this.canvas.height - 170, active: true }
    ];
  }
  
  start() {
    this.player = this.players[0] || 'Player 1';
    
    this.gameState.players[this.player] = {
      name: this.player,
      x: 80,
      y: this.canvas.height - 100,
      vx: 0,
      vy: 0,
      width: 28,
      height: 45,
      color: '#2C3E50',
      outfitColor: '#1a1a2a',
      skinColor: '#D5C4A7',
      onGround: false,
      onLedge: false,
      canDoubleJump: true,
      canWallRun: true,
      isWallRunning: false,
      wallRunDir: 0,
      isDashing: false,
      dashTimer: 0,
      dashCooldown: 0,
      isHiding: false,
      isClimbing: false,
      climbTimer: 0,
      dataPoints: 0,
      objectives: 0,
      stealthKills: 0,
      health: 100,
      maxHealth: 100,
      invincible: false,
      invincibleTimer: 0,
      detected: false,
      detectedTimer: 0,
      facing: 1,
      state: 'idle',
      lastLedge: null
    };
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }
  
  stop() {
    this.isRunning = false;
  }
  
  gameLoop(currentTime) {
    if (!this.isRunning) return;
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;
    this.update(deltaTime);
    this.render();
    requestAnimationFrame((t) => this.gameLoop(t));
  }
  
  update(deltaTime) {
    this.gameState.time += deltaTime;
    const player = this.gameState.players[this.player];
    if (!player) return;
    
    if (this.gameState.detected) {
      player.detectedTimer -= deltaTime;
      if (player.detectedTimer <= 0) {
        this.gameState.detected = false;
      }
    }
    
    this.handleInput(player);
    this.applyPhysics(player, deltaTime);
    this.checkCollisions(player);
    this.updateCamera(player);
    this.checkLedges(player);
    this.updateDataPoints(player, deltaTime);
    this.updateObjectives(player);
    this.updateSecurityCameras(deltaTime, player);
    this.updateLasers(deltaTime, player);
    this.updateGuards(player, deltaTime);
    this.updateGenerators(player);
    this.updateHiding(player);
    this.updateParticles(deltaTime);
    this.checkWinCondition();
    
    if (player.invincible) {
      player.invincibleTimer -= deltaTime;
      if (player.invincibleTimer <= 0) {
        player.invincible = false;
      }
    }
    
    if (player.dashTimer > 0) {
      player.dashTimer -= deltaTime;
      if (player.dashTimer <= 0) {
        player.isDashing = false;
      }
    }
    
    if (player.dashCooldown > 0) {
      player.dashCooldown -= deltaTime;
    }
    
    if (player.climbTimer > 0) {
      player.climbTimer -= deltaTime;
      if (player.climbTimer <= 0) {
        player.isClimbing = false;
      }
    }
    
    if (player.y > this.canvas.height + 100) {
      this.fallReset(player);
    }
  }
  
  handleInput(player) {
    const input = this.getPlayerInput(player.name);
    
    if (player.isHiding) return;
    
    if (input.left) {
      player.vx = player.isWallRunning ? -this.config.wallRunSpeed : -this.config.moveSpeed;
      player.facing = -1;
      player.state = 'running';
    } else if (input.right) {
      player.vx = player.isWallRunning ? this.config.wallRunSpeed : this.config.moveSpeed;
      player.facing = 1;
      player.state = 'running';
    } else {
      player.vx = 0;
      player.state = player.onGround ? 'idle' : 'jumping';
    }
    
    if (input.action && player.dashCooldown <= 0 && !player.isDashing) {
      player.isDashing = true;
      player.dashTimer = this.config.dashDuration;
      player.dashCooldown = this.config.dashCooldown;
      player.vx = player.facing * this.config.dashSpeed;
      player.vy = 0;
      this.createDashParticles(player);
    }
    
    if (input.up && player.onGround) {
      player.vy = this.config.jumpForce;
      player.onGround = false;
      player.canDoubleJump = true;
      this.createJumpParticles(player);
    }
    
    if (input.up && !player.onGround && player.canDoubleJump && this.config.doubleJump) {
      player.vy = this.config.jumpForce * 0.75;
      player.canDoubleJump = false;
      this.createJumpParticles(player);
    }
    
    // Wall run
    if (this.config.wallRun && !player.onGround && (input.left || input.right)) {
      if (player.vy > 0) {
        this.checkWallRun(player);
      }
    }
  }
  
  getPlayerInput(playerName) {
    const inputs = window.gameInputs || {};
    return inputs[playerName] || this.inputState;
  }
  
  applyPhysics(player, deltaTime) {
    if (!player.isDashing && !player.isClimbing) {
      player.vy += this.config.gravity;
    }
    player.vy = Math.min(player.vy, 18);
    player.x += player.vx;
    player.y += player.vy;
    player.onGround = false;
  }
  
  checkCollisions(player) {
    this.gameState.buildings.forEach(building => {
      if (this.checkAABB(player, building)) {
        if (player.vy > 0 && player.y + player.height - player.vy <= building.y + 5) {
          player.y = building.y - player.height;
          player.vy = 0;
          player.onGround = true;
        }
      }
    });
    
    this.gameState.ledges.forEach(ledge => {
      if (this.checkAABB(player, ledge)) {
        if (player.vy > 0 && player.y + player.height - player.vy <= ledge.y + 5) {
          player.y = ledge.y - player.height;
          player.vy = 0;
          player.onGround = true;
        }
      }
    });
    
    player.x = Math.max(0, Math.min(this.config.levelWidth - player.width, player.x));
  }
  
  checkAABB(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
  }
  
  updateCamera(player) {
    const targetX = player.x - this.canvas.width / 3;
    this.camera.x += (targetX - this.camera.x) * this.config.cameraSpeed;
    this.camera.x = Math.max(0, Math.min(this.config.levelWidth - this.canvas.width, this.camera.x));
  }
  
  checkLedges(player) {
    this.ledgeGrabTimer -= 0.016;
    player.onLedge = false;
    
    if (!player.onGround && player.vy > 0) {
      this.gameState.ledges.forEach(ledge => {
        if (ledge.climbable && !ledge.tagged) return;
        
        if (player.x + player.width > ledge.x && player.x < ledge.x + ledge.width &&
            Math.abs(player.y + player.height - ledge.y) < 10) {
          if (player.vy > 0) {
            player.onLedge = true;
            player.vy = 0;
            player.y = ledge.y - player.height;
            player.lastLedge = ledge;
          }
        }
      });
    }
  }
  
  checkWallRun(player) {
    // Check if near a wall to wall run
    this.gameState.buildings.forEach(building => {
      if (player.x + player.width > building.x - 5 && player.x < building.x &&
          player.y + player.height > building.y && player.y < building.y + building.height) {
        
        const input = this.getPlayerInput(player.name);
        
        if ((input.left && player.vx < 0) || (input.right && player.vx > 0)) {
          player.isWallRunning = true;
          player.canWallRun = false;
          player.vy = 0;
        }
      }
    });
    
    if (player.onGround) {
      player.isWallRunning = false;
    }
  }
  
  updateDataPoints(player, deltaTime) {
    this.gameState.dataPoints.forEach(point => {
      if (point.collected) return;
      
      const dx = (player.x + player.width / 2) - point.x;
      const dy = (player.y + player.height / 2) - point.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 40) {
        if (!point.hacked) {
          point.hackProgress += deltaTime * 2;
          
          if (point.hackProgress >= 1) {
            point.hacked = true;
            point.collected = true;
            player.dataPoints++;
            this.gameState.score += 100;
          }
        }
      } else {
        point.hackProgress = 0;
      }
    });
  }
  
  updateObjectives(player) {
    this.gameState.objectives.forEach(obj => {
      if (obj.hacked) return;
      
      const dx = (player.x + player.width / 2) - obj.x;
      const dy = (player.y + player.height / 2) - obj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 50) {
        obj.hacked = true;
        player.objectives++;
        this.gameState.score += 300;
        this.disableSecurity();
      }
    });
  }
  
  updateSecurityCameras(deltaTime, player) {
    this.gameState.securityCameras.forEach(camera => {
      if (camera.alerted) return;
      
      // Sweep animation
      camera.sweepAngle += camera.sweepSpeed * (camera.sweepLeft ? -1 : 1);
      
      const dx = (player.x + player.width / 2) - camera.x;
      const dy = (player.y + player.height / 2) - camera.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < camera.range) {
        if (!player.isHiding && !player.invincible) {
          this.triggerAlert();
          camera.alerted = true;
        }
      }
    });
  }
  
  updateLasers(deltaTime, player) {
    this.gameState.lasers.forEach(laser => {
      if (!laser.active) return;
      
      laser.pulse += deltaTime * 3;
      
      if (this.checkAABB(player, { x: laser.x, y: laser.y - laser.length, width: laser.length, height: laser.length * 2 })) {
        if (!player.invincible) {
          this.triggerAlert();
        }
      }
    });
  }
  
  updateGuards(player, deltaTime) {
    this.gameState.guards.forEach(guard => {
      if (!guard.alive) return;
      
      if (guard.patrol) {
        guard.x += guard.speed * guard.direction;
        guard.animTimer += deltaTime * 5;
        
        if (guard.x > guard.startX + guard.range) {
          guard.direction = -1;
        } else if (guard.x < guard.startX - guard.range) {
          guard.direction = 1;
        }
      }
      
      const dx = (player.x + player.width / 2) - guard.x;
      const dy = (player.y + player.height / 2) - guard.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 50 && !player.isHiding) {
        if (guard.alert) {
          this.triggerAlert();
        }
      }
    });
  }
  
  updateGenerators(player) {
    this.gameState.generators.forEach(gen => {
      const dx = (player.x + player.width / 2) - gen.x;
      const dy = (player.y + player.height / 2) - gen.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 40 && gen.active) {
        gen.active = false;
        this.disableSecurity();
      }
    });
  }
  
  updateHiding(player) {
    const input = this.getPlayerInput(player.name);
    const hideKey = input.hide || input.down;
    
    this.gameState.vents.forEach(vent => {
      if (!this.checkAABB(player, vent)) return;
      
      if (hideKey && player.onGround) {
        player.isHiding = true;
        vent.occupied = true;
      } else {
        player.isHiding = false;
        vent.occupied = false;
      }
    });
  }
  
  disableSecurity() {
    this.gameState.securityCameras.forEach(camera => {
      camera.alerted = true;
    });
    
    this.gameState.lasers.forEach(laser => {
      laser.active = false;
    });
  }
  
  triggerAlert() {
    this.gameState.alertLevel += 1;
    this.gameState.detected = true;
    this.gameState.players[this.player].detectedTimer = 2;
  }
  
  checkWinCondition() {
    const player = this.gameState.players[this.player];
    if (player && player.objectives >= 2 && player.dataPoints >= 3) {
      this.gameState.score += 1000;
    }
  }
  
  fallReset(player) {
    player.health -= 20;
    player.x = 80;
    player.y = this.canvas.height - 100;
    player.vx = 0;
    player.vy = 0;
  }
  
  createJumpParticles(player) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: player.x + player.width / 2,
        y: player.y + player.height,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * -2,
        life: 0.4,
        color: '#3498DB',
        size: 3
      });
    }
  }
  
  createDashParticles(player) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        vx: -player.facing * (3 + Math.random() * 2),
        vy: (Math.random() - 0.5) * 2,
        life: 0.3,
        color: '#3498DB',
        size: 3
      });
    }
  }
  
  updateParticles(deltaTime) {
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime;
      return p.life > 0;
    });
  }
  
  render() {
    // Night city sky
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    skyGrad.addColorStop(0, '#0a0a1a');
    skyGrad.addColorStop(0.3, '#1a1a3a');
    skyGrad.addColorStop(0.6, '#2a2a4a');
    skyGrad.addColorStop(1, '#3a3a5a');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // City lights (background)
    this.drawCityLights();
    
    this.ctx.save();
    this.ctx.translate(-this.camera.x, 0);
    
    this.drawBuildings();
    this.drawLedges();
    this.drawVents();
    this.drawAirConditioners();
    this.drawSecurityCameras();
    this.drawLasers();
    this.drawGuards();
    this.drawDataPoints();
    this.drawObjectives();
    this.drawGenerators();
    this.drawPlayer();
    this.drawParticles();
    
    this.ctx.restore();
    
    this.drawUI();
  }
  
  drawCityLights() {
    // Windows
    for (let i = 0; i < 50; i++) {
      const x = ((i * 127) % this.canvas.width);
      const y = 50 + (i * 43) % (this.canvas.height - 150);
      const brightness = Math.random() > 0.3 ? 0.8 : 0;
      
      this.ctx.fillStyle = `rgba(255, ${200 + Math.random() * 55}, ${Math.random() * 100}, ${brightness})`;
      this.ctx.fillRect(x, y, 15, 20);
    }
  }
  
  drawBuildings() {
    this.gameState.buildings.forEach(building => {
      if (building.type === 'ground') {
        this.ctx.fillStyle = '#2a2a3a';
        this.ctx.fillRect(building.x, building.y, building.width, building.height);
      } else {
        const grad = this.ctx.createLinearGradient(building.x, building.y, building.x + building.width, building.y);
        grad.addColorStop(0, '#1a1a2a');
        grad.addColorStop(0.5, '#2a2a3a');
        grad.addColorStop(1, '#1a1a2a');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(building.x, building.y, building.width, building.height);
        
        // Windows
        this.ctx.fillStyle = 'rgba(255, 200, 50, 0.3)';
        for (let wy = building.y + 20; wy < building.y + building.height - 30; wy += 40) {
          for (let wx = building.x + 15; wx < building.x + building.width - 15; wx += 30) {
            if (Math.random() > 0.4) {
              this.ctx.fillRect(wx, wy, 20, 25);
            }
          }
        }
      }
    });
  }
  
  drawLedges() {
    this.gameState.ledges.forEach(ledge => {
      if (ledge.tagged) {
        this.ctx.fillStyle = '#E74C3C';
      } else {
        this.ctx.fillStyle = this.ctx.createLinearGradient(ledge.x, ledge.y, ledge.x + ledge.width, ledge.y);
        this.ctx.fillStyle = '#3a3a4a';
      }
      this.ctx.fillRect(ledge.x, ledge.y, ledge.width, ledge.height);
    });
  }
  
  drawVents() {
    this.gameState.vents.forEach(vent => {
      this.ctx.fillStyle = '#555';
      this.ctx.fillRect(vent.x, vent.y, vent.width, vent.height);
      
      // Vent lines
      this.ctx.fillStyle = '#333';
      for (let i = 0; i < vent.width; i += 8) {
        this.ctx.fillRect(vent.x + i + 2, vent.y, 2, vent.height);
      }
    });
  }
  
  drawAirConditioners() {
    this.gameState.airConditioners.forEach(ac => {
      this.ctx.fillStyle = '#444';
      this.ctx.fillRect(ac.x, ac.y, ac.width, ac.height);
      
      // Fan
      this.ctx.fillStyle = '#333';
      this.ctx.beginPath();
      this.ctx.arc(ac.x + ac.width / 2, ac.y + ac.height / 2, 8, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawSecurityCameras() {
    this.gameState.securityCameras.forEach(camera => {
      this.ctx.save();
      this.ctx.translate(camera.x, camera.y);
      this.ctx.rotate(camera.sweepAngle);
      
      // Camera body
      this.ctx.fillStyle = camera.alerted ? '#E74C3C' : '#555';
      this.ctx.fillRect(-10, -8, 20, 15);
      
      // Lens
      this.ctx.fillStyle = camera.alerted ? '#FF0000' : '#3498DB';
      this.ctx.beginPath();
      this.ctx.arc(10, 0, 5, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Detection cone
      if (!camera.alerted) {
        this.ctx.fillStyle = 'rgba(231, 76, 60, 0.2)';
        this.ctx.beginPath();
        this.ctx.moveTo(10, 0);
        this.ctx.lineTo(camera.range, -camera.range * 0.5);
        this.ctx.lineTo(camera.range, camera.range * 0.5);
        this.ctx.fill();
      }
      
      this.ctx.restore();
    });
  }
  
  drawLasers() {
    this.gameState.lasers.forEach(laser => {
      if (!laser.active) return;
      
      const pulse = laser.pulse * 0.3 + 0.7;
      
      this.ctx.strokeStyle = `rgba(231, 76, 60, ${pulse})`;
      this.ctx.lineWidth = 3;
      this.ctx.setLineDash([5, 5]);
      this.ctx.beginPath();
      
      if (laser.horizontal) {
        this.ctx.moveTo(laser.x, laser.y);
        this.ctx.lineTo(laser.x + laser.length, laser.y);
      } else {
        this.ctx.moveTo(laser.x, laser.y);
        this.ctx.lineTo(laser.x, laser.y + laser.length);
      }
      
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    });
  }
  
  drawGuards() {
    this.gameState.guards.forEach(guard => {
      if (!guard.alive) return;
      
      const runCycle = Math.sin(guard.animTimer) * 0.3;
      
      this.ctx.save();
      this.ctx.translate(guard.x + guard.width / 2, guard.y + guard.height / 2);
      if (guard.direction < 0) this.ctx.scale(-1, 1);
      
      // Body
      this.ctx.fillStyle = guard.alert ? '#E74C3C' : '#2C3E50';
      this.ctx.fillRect(-12, -20, 24, 30);
      
      // Head
      this.ctx.fillStyle = '#D5C4A7';
      this.ctx.beginPath();
      this.ctx.arc(0, -25, 10, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Helmet
      this.ctx.fillStyle = '#333';
      this.ctx.beginPath();
      this.ctx.arc(0, -28, 8, Math.PI, 0);
      this.ctx.fill();
      
      // Weapon
      this.ctx.fillStyle = '#555';
      this.ctx.fillRect(12, -10, 15, 4);
      
      // Legs
      this.ctx.fillStyle = '#1a1a2a';
      this.ctx.fillRect(-10, 10 + runCycle, 8, 10);
      this.ctx.fillRect(2, 10 - runCycle, 8, 10);
      
      this.ctx.restore();
    });
  }
  
  drawDataPoints() {
    this.gameState.dataPoints.forEach(point => {
      if (point.collected) return;
      
      this.ctx.save();
      this.ctx.translate(point.x, point.y);
      
      if (point.hackProgress > 0) {
        // Hacking progress
        this.ctx.strokeStyle = '#3498DB';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, point.radius + 5, 0, point.hackProgress * Math.PI * 2);
        this.ctx.stroke();
      }
      
      // Data point
      this.ctx.fillStyle = point.hacked ? '#27AE60' : '#3498DB';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, point.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Icon
      this.ctx.fillStyle = '#FFF';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('i', 0, 0);
      
      this.ctx.restore();
    });
  }
  
  drawObjectives() {
    this.gameState.objectives.forEach(obj => {
      if (obj.hacked) return;
      
      this.ctx.fillStyle = obj.type === 'server' ? '#8E44AD' : '#E74C3C';
      this.ctx.fillRect(obj.x - 20, obj.y - 30, 40, 60);
      
      // Blinking light
      if (Math.sin(this.gameState.time * 5) > 0) {
        this.ctx.fillStyle = '#27AE60';
        this.ctx.beginPath();
        this.ctx.arc(obj.x, obj.y - 40, 5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }
  
  drawGenerators() {
    this.gameState.generators.forEach(gen => {
      this.ctx.fillStyle = gen.active ? '#F39C12' : '#333';
      this.ctx.beginPath();
      this.ctx.arc(gen.x, gen.y, 20, 0, Math.PI * 2);
      this.ctx.fill();
      
      if (gen.active) {
        this.ctx.strokeStyle = '#E74C3C';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(gen.x, gen.y, 25, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    });
  }
  
  drawPlayer() {
    const player = this.gameState.players[this.player];
    if (!player) return;
    
    if (player.isHiding) return;
    
    if (player.invincible && Math.floor(this.gameState.time * 15) % 2 === 0) {
      return;
    }
    
    this.ctx.save();
    this.ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    
    if (player.facing < 0) {
      this.ctx.scale(-1, 1);
    }
    
    // Outfit
    this.ctx.fillStyle = player.color;
    this.ctx.fillRect(-player.width / 2, -player.height / 2 + 10, player.width, player.height - 10);
    
    // Hood
    this.ctx.fillStyle = player.outfitColor;
    this.ctx.beginPath();
    this.ctx.arc(0, -player.height / 2 + 8, 14, Math.PI, 0);
    this.ctx.fill();
    
    // Face
    this.ctx.fillStyle = player.skinColor;
    this.ctx.fillRect(-player.width / 2 + 4, -player.height / 2 + 2, player.width - 8, 12);
    
    // Eyes (night vision goggles look)
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(-8, -player.height / 2 + 6, 16, 6);
    this.ctx.fillStyle = player.detected ? '#E74C3C' : '#27AE60';
    this.ctx.fillRect(-6, -player.height / 2 + 7, 4, 4);
    this.ctx.fillRect(2, -player.height / 2 + 7, 4, 4);
    
    // Legs
    if (player.state === 'running') {
      const legAnim = Math.sin(this.gameState.time * 18) * 6;
      this.ctx.fillStyle = '#1a1a2a';
      this.ctx.fillRect(-8, player.height / 2 - 12, 6, 12 + legAnim);
      this.ctx.fillRect(2, player.height / 2 - 12, 6, 12 - legAnim);
    } else {
      this.ctx.fillStyle = '#1a1a2a';
      this.ctx.fillRect(-8, player.height / 2 - 12, 6, 12);
      this.ctx.fillRect(2, player.height / 2 - 12, 6, 12);
    }
    
    this.ctx.restore();
  }
  
  drawParticles() {
    this.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
  }
  
  drawUI() {
    const player = this.gameState.players[this.player];
    if (!player) return;
    
    // Alert overlay
    if (this.gameState.detected) {
      this.ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.ctx.fillStyle = '#E74C3C';
      this.ctx.font = 'bold 40px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('DETECTED!', this.canvas.width / 2, this.canvas.height / 2);
    }
    
    // Score
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(15, 15, 150, 50);
    this.ctx.fillStyle = '#3498DB';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 25, 40);
    
    // Data points
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(15, 75, 150, 30);
    this.ctx.fillStyle = '#3498DB';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.fillText(`Data: ${player.dataPoints}/${this.gameState.dataPoints.length}`, 25, 95);
    
    // Objectives
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(175, 75, 100, 30);
    this.ctx.fillStyle = '#8E44AD';
    this.ctx.fillText(`Obj: ${player.objectives}/${this.gameState.objectives.length}`, 185, 95);
    
    // Stealth indicator
    if (player.isHiding) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(15, 115, 80, 25);
      this.ctx.fillStyle = '#27AE60';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.fillText('HIDDEN', 25, 132);
    }
    
    // Alert level
    if (this.gameState.alertLevel > 0) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(this.canvas.width - 100, 15, 85, 30);
      this.ctx.fillStyle = '#E74C3C';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(`ALERT: ${this.gameState.alertLevel}`, this.canvas.width - 25, 35);
    }
    
    // Dash cooldown
    if (player.dashCooldown > 0) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(15, 150, 80, 25);
      this.ctx.fillStyle = '#E74C3C';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.fillText(`DASH: ${Math.ceil(player.dashCooldown)}s`, 25, 167);
    }
  }
  
  updatePlayerInput(playerName, input) {
    window.gameInputs = window.gameInputs || {};
    window.gameInputs[playerName] = input;
  }
}

window.CityParkour = CityParkour;