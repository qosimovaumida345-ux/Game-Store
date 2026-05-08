// Sky Runner - Floating Island Platformer
class SkyRunner {
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
      gravity: 0.4,
      glideGravity: 0.15,
      jumpForce: -12,
      hoverForce: -2,
      moveSpeed: 4.5,
      glideSpeed: 0.3,
      levelWidth: 4500,
      cameraSpeed: 0.1
    };
    
    this.gameState = {
      players: {},
      time: 0,
      level: 1,
      score: 0,
      status: 'playing',
      clouds: [],
      floatingIslands: [],
      boostRings: [],
      windGusts: [],
      feathers: [],
      birds: [],
      lightning: null,
      weather: 'sunny'
    };
    
    this.player = null;
    this.camera = { x: 0, y: 0 };
    this.particles = [];
    this.inputState = {};
    
    this.generateLevel();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  generateLevel() {
    this.gameState.floatingIslands = [];
    this.gameState.clouds = [];
    this.gameState.boostRings = [];
    this.gameState.windGusts = [];
    this.gameState.feathers = [];
    this.gameState.birds = [];
    this.gameState.lightning = null;
    
    // Floating islands (ground)
    const islands = [
      { x: 0, y: this.canvas.height - 80, w: 600, h: 80, type: 'grass' },
      { x: 700, y: this.canvas.height - 60, w: 400, h: 60, type: 'stone' },
      { x: 1200, y: this.canvas.height - 100, w: 500, h: 100, type: 'grass' },
      { x: 1800, y: this.canvas.height - 80, w: 450, h: 80, type: 'dirt' },
      { x: 2350, y: this.canvas.height - 120, w: 600, h: 120, type: 'grass' },
      { x: 3050, y: this.canvas.height - 80, w: 500, h: 80, type: 'stone' },
      { x: 3650, y: this.canvas.height - 100, w: 550, h: 100, type: 'grass' },
      { x: 4300, y: this.canvas.height - 60, w: 200, h: 60, type: 'stone' }
    ];
    
    islands.forEach(island => {
      this.gameState.floatingIslands.push({
        x: island.x, y: island.y, width: island.w, height: island.h, type: island.type,
        bounce: 0, bounceDir: 1
      });
    });
    
    // Floating platforms in sky
    const platforms = [
      { x: 200, y: this.canvas.height - 200, w: 100, h: 20 },
      { x: 400, y: this.canvas.height - 280, w: 80, h: 20 },
      { x: 600, y: this.canvas.height - 180, w: 120, h: 20 },
      { x: 850, y: this.canvas.height - 320, w: 100, h: 20 },
      { x: 1050, y: this.canvas.height - 250, w: 80, h: 20 },
      { x: 1300, y: this.canvas.height - 380, w: 100, h: 20 },
      { x: 1550, y: this.canvas.height - 300, w: 120, h: 20 },
      { x: 1450, y: this.canvas.height - 180, w: 80, h: 20 },
      { x: 1700, y: this.canvas.height - 420, w: 100, h: 20 },
      { x: 1950, y: this.canvas.height - 350, w: 80, h: 20 },
      { x: 2200, y: this.canvas.height - 280, w: 100, h: 20 },
      { x: 2500, y: this.canvas.height - 400, w: 120, h: 20 },
      { x: 2750, y: this.canvas.height - 320, w: 80, h: 20 },
      { x: 2950, y: this.canvas.height - 250, w: 100, h: 20 },
      { x: 3200, y: this.canvas.height - 380, w: 120, h: 20 },
      { x: 3450, y: this.canvas.height - 300, w: 80, h: 20 },
      { x: 3700, y: this.canvas.height - 420, w: 100, h: 20 },
      { x: 3950, y: this.canvas.height - 350, w: 120, h: 20 },
      { x: 4150, y: this.canvas.height - 280, w: 80, h: 20 },
      { x: 4400, y: this.canvas.height - 200, w: 100, h: 20 }
    ];
    
    platforms.forEach((p, i) => {
      this.gameState.floatingIslands.push({
        x: p.x, y: p.y, width: p.w, height: p.h, type: 'cloud',
        variant: i % 3, drift: 0, originalY: p.y
      });
    });
    
    // Clouds
    for (let i = 0; i < 40; i++) {
      this.gameState.clouds.push({
        x: Math.random() * this.config.levelWidth,
        y: 50 + Math.random() * 200,
        width: 80 + Math.random() * 60,
        height: 30 + Math.random() * 20,
        speed: 0.2 + Math.random() * 0.3,
        drift: (Math.random() - 0.5) * 0.5
      });
    }
    
    // Boost rings
    const ringPositions = [
      { x: 500, y: this.canvas.height - 250 },
      { x: 1400, y: this.canvas.height - 350 },
      { x: 2600, y: this.canvas.height - 320 },
      { x: 3800, y: this.canvas.height - 400 }
    ];
    
    this.gameState.boostRings = ringPositions.map(r => ({
      x: r.x, y: r.y, radius: 35,
      active: true, rotation: 0, glow: 0
    }));
    
    // Wind gusts
    for (let i = 0; i < 15; i++) {
      this.gameState.windGusts.push({
        x: Math.random() * this.config.levelWidth,
        y: 100 + Math.random() * (this.canvas.height - 200),
        width: 100 + Math.random() * 100,
        strength: 2 + Math.random() * 3,
        active: Math.random() > 0.5
      });
    }
    
    // Feathers (collectibles)
    for (let i = 0; i < 25; i++) {
      this.gameState.feathers.push({
        x: 200 + Math.random() * (this.config.levelWidth - 400),
        y: 100 + Math.random() * (this canvas.height - 250),
        collected: false,
        rotation: Math.random() * Math.PI * 2,
        flutter: Math.random() * Math.PI * 2
      });
    }
    
    // Birds (decorative)
    for (let i = 0; i < 12; i++) {
      this.gameState.birds.push({
        x: Math.random() * this.config.levelWidth,
        y: 80 + Math.random() * 150,
        speed: 1 + Math.random() * 2,
        direction: Math.random() > 0.5 ? 1 : -1,
        wingSpeed: 5 + Math.random() * 5,
        size: 15 + Math.random() * 10
      });
    }
  }
  
  start() {
    this.player = this.players[0] || 'Player 1';
    
    this.gameState.players[this.player] = {
      name: this.player,
      x: 100,
      y: this.canvas.height - 150,
      vx: 0,
      vy: 0,
      width: 30,
      height: 45,
      color: '#3498DB',
      skinColor: '#FDEBD0',
      onGround: false,
      isGliding: false,
      canGlide: true,
      hasDoubleJump: true,
      hasHover: false,
      hoverTimer: 0,
      feathers: 0,
      health: 100,
      maxHealth: 100,
      invincible: false,
      invincibleTimer: 0,
      facing: 1,
      state: 'idle',
      trail: []
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
    
    this.handleInput(player);
    this.applyPhysics(player, deltaTime);
    this.checkCollisions(player);
    this.updateCamera(player);
    this.updateClouds(deltaTime);
    this.updateBoostRings(player, deltaTime);
    this.updateFeathers(player, deltaTime);
    this.updateBirds(deltaTime);
    this.updateWeather(deltaTime);
    this.updateParticles(deltaTime);
    
    if (player.invincible) {
      player.invincibleTimer -= deltaTime;
      if (player.invincibleTimer <= 0) {
        player.invincible = false;
      }
    }
    
    if (player.hasHover && player.hoverTimer > 0) {
      player.hoverTimer -= deltaTime;
      if (player.hoverTimer <= 0) {
        player.hasHover = false;
      }
    }
    
    // Update trail
    player.trail.unshift({ x: player.x + player.width / 2, y: player.y + player.height / 2 });
    if (player.trail.length > 15) {
      player.trail.pop();
    }
    
    if (player.y > this.canvas.height + 100) {
      this.fallOff(player);
    }
  }
  
  handleInput(player) {
    const input = this.getPlayerInput(player.name);
    
    if (input.left) {
      player.vx = -this.config.moveSpeed;
      player.facing = -1;
      player.state = player.onGround ? 'running' : 'air';
    } else if (input.right) {
      player.vx = this.config.moveSpeed;
      player.facing = 1;
      player.state = player.onGround ? 'running' : 'air';
    } else {
      player.vx = 0;
      if (player.onGround) player.state = 'idle';
    }
    
    if (input.up) {
      if (player.onGround) {
        player.vy = this.config.jumpForce;
        player.onGround = false;
        player.hasDoubleJump = true;
        this.createJumpParticles(player, '#FFF');
      } else if (player.hasDoubleJump && !player.isGliding) {
        player.vy = this.config.jumpForce * 0.7;
        player.hasDoubleJump = false;
        this.createJumpParticles(player, '#F39C12');
      }
    }
    
    if (input.down && !player.onGround && player.vy > 0) {
      player.isGliding = true;
      player.vy = Math.max(player.vy, this.config.glideSpeed);
    } else {
      player.isGliding = false;
    }
    
    if (player.hasHover && input.up && !player.onGround) {
      player.vy = this.config.hoverForce;
    }
  }
  
  getPlayerInput(playerName) {
    const inputs = window.gameInputs || {};
    return inputs[playerName] || this.inputState;
  }
  
  applyPhysics(player, deltaTime) {
    if (player.isGliding && player.vy > 0) {
      player.vy += this.config.glideGravity;
    } else {
      player.vy += this.config.gravity;
    }
    player.vy = Math.min(player.vy, 15);
    player.x += player.vx;
    player.y += player.vy;
    player.onGround = false;
  }
  
  checkCollisions(player) {
    this.gameState.floatingIslands.forEach(island => {
      if (this.checkAABB(player, island)) {
        const overlapY = (player.y + player.height) - island.y;
        const overlapX = island.type !== 'cloud' ? 0 : Math.abs(player.y - island.y);
        
        if (overlapY > 0 && overlapY < 20 && player.vy >= 0) {
          player.y = island.y - player.height;
          player.vy = 0;
          player.onGround = true;
          player.isGliding = false;
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
    const targetY = player.y - this.canvas.height / 2;
    this.camera.x += (targetX - this.camera.x) * this.config.cameraSpeed;
    this.camera.y += (targetY - this.camera.y) * this.config.cameraSpeed;
    this.camera.x = Math.max(0, Math.min(this.config.levelWidth - this.canvas.width, this.camera.x));
    this.camera.y = Math.max(-100, Math.min(100, this.camera.y));
  }
  
  updateClouds(deltaTime) {
    this.gameState.clouds.forEach(cloud => {
      cloud.x += cloud.speed * cloud.drift;
      cloud.drift += (Math.random() - 0.5) * 0.1;
      cloud.drift = Math.max(-1, Math.min(1, cloud.drift));
      
      if (cloud.x < -cloud.width) cloud.x = this.config.levelWidth;
      if (cloud.x > this.config.levelWidth) cloud.x = -cloud.width;
    });
    
    this.gameState.floatingIslands.forEach(island => {
      if (island.type === 'cloud') {
        island.drift += Math.sin(this.gameState.time + island.x) * 0.0005;
        island.y = island.originalY + Math.sin(this.gameState.time * 0.5 + island.x * 0.01) * 10;
      }
    });
  }
  
  updateBoostRings(player, deltaTime) {
    this.gameState.boostRings.forEach(ring => {
      if (!ring.active) return;
      
      ring.rotation += deltaTime * 2;
      ring.glow = (Math.sin(this.gameState.time * 4) + 1) / 2;
      
      const dx = (player.x + player.width / 2) - ring.x;
      const dy = (player.y + player.height / 2) - ring.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < ring.radius + 20) {
        ring.active = false;
        this.applyBoost(player, dx, dy, dist);
      }
    });
  }
  
  applyBoost(player, dx, dy, dist) {
    const angle = Math.atan2(-dy, -dx);
    const boostSpeed = 15;
    player.vx = Math.cos(angle) * boostSpeed;
    player.vy = Math.sin(angle) * boostSpeed;
    player.hasDoubleJump = true;
    this.gameState.score += 50;
    this.createBoostParticles(player);
  }
  
  updateFeathers(player, deltaTime) {
    this.gameState.feathers.forEach(feather => {
      if (feather.collected) return;
      
      feather.rotation += deltaTime * 2;
      feather.flutter += deltaTime * 5;
      
      const dx = (player.x + player.width / 2) - feather.x;
      const dy = (player.y + player.height / 2) - feather.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 40) {
        feather.collected = true;
        player.feathers++;
        this.gameState.score += 15;
        
        if (player.feathers >= 5) {
          player.canGlide = true;
          player.hasHover = true;
          player.hoverTimer = 8;
        }
        
        this.createFeatherParticles(feather.x, feather.y);
      }
    });
  }
  
  updateBirds(deltaTime) {
    this.gameState.birds.forEach(bird => {
      bird.x += bird.speed * bird.direction;
      bird.wingSpeed += deltaTime * 20;
      
      if (bird.x < -50) bird.x = this.config.levelWidth + 50;
      if (bird.x > this.config.levelWidth + 50) bird.x = -50;
    });
  }
  
  updateWeather(deltaTime) {
    if (Math.random() < 0.0005) {
      this.gameState.weather = this.gameState.weather === 'sunny' ? 'stormy' : 'sunny';
    }
    
    if (this.gameState.weather === 'stormy' && !this.gameState.lightning) {
      if (Math.random() < 0.002) {
        this.gameState.lightning = {
          x: Math.random() * this.config.levelWidth,
          timer: 0.2
        };
      }
    }
  }
  
  fallOff(player) {
    player.health -= 30;
    player.x = 100;
    player.y = this.canvas.height - 150;
    player.vx = 0;
    player.vy = 0;
    player.invincible = true;
    player.invincibleTimer = 2;
  }
  
  createJumpParticles(player, color) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: player.x + player.width / 2,
        y: player.y + player.height,
        vx: (Math.random() - 0.5) * 5,
        vy: Math.random() * -3,
        life: 0.5,
        color: color,
        size: 4 + Math.random() * 2
      });
    }
  }
  
  createBoostParticles(player) {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.particles.push({
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        vx: Math.cos(angle) * 5,
        vy: Math.sin(angle) * 5,
        life: 0.6,
        color: '#3498DB',
        size: 3
      });
    }
  }
  
  createFeatherParticles(x, y) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 3,
        life: 0.7,
        color: '#9B59B6',
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
    // Sky
    if (this.gameState.weather === 'sunny') {
      const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      skyGrad.addColorStop(0, '#87CEEB');
      skyGrad.addColorStop(0.5, '#B4E1FF');
      skyGrad.addColorStop(1, '#E7F4FD');
      this.ctx.fillStyle = skyGrad;
    } else {
      const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      skyGrad.addColorStop(0, '#2C3E50');
      skyGrad.addColorStop(0.5, '#34495E');
      skyGrad.addColorStop(1, '#5D6D7E');
      this.ctx.fillStyle = skyGrad;
    }
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Lightning flash
    if (this.gameState.lightning) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.gameState.lightning.timer -= 0.016;
      if (this.gameState.lightning.timer <= 0) {
        this.gameState.lightning = null;
      }
    }
    
    // Clouds (background)
    this.drawClouds();
    
    // Islands
    this.ctx.save();
    this.ctx.translate(-this.camera.x, -this.camera.y);
    
    this.drawIslands();
    this.drawBoostRings();
    this.drawFeathers();
    this.drawBirds();
    this.drawPlayer();
    this.drawParticles();
    
    this.ctx.restore();
    
    this.drawUI();
  }
  
  drawClouds() {
    this.gameState.clouds.forEach(cloud => {
      const x = cloud.x - this.camera.x * 0.3;
      if (x < -cloud.width || x > this.canvas.width + cloud.width) return;
      
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      this.ctx.beginPath();
      this.ctx.ellipse(x, cloud.y, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.ellipse(x - cloud.width * 0.3, cloud.y + 10, cloud.width * 0.4, cloud.height * 0.5, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.ellipse(x + cloud.width * 0.2, cloud.y + 5, cloud.width * 0.3, cloud.height * 0.4, 0, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawIslands() {
    this.gameState.floatingIslands.forEach(island => {
      if (island.type === 'grass') {
        const grad = this.ctx.createLinearGradient(island.x, island.y, island.x, island.y + island.height);
        grad.addColorStop(0, '#52BE80');
        grad.addColorStop(0.3, '#27AE60');
        grad.addColorStop(1, '#1E8449');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(island.x, island.y, island.width, island.height);
        this.ctx.fillStyle = '#AED6F1';
        this.ctx.fillRect(island.x, island.y, island.width, 10);
      } else if (island.type === 'stone') {
        const grad = this.ctx.createLinearGradient(island.x, island.y, island.x, island.y + island.height);
        grad.addColorStop(0, '#BDC3C7');
        grad.addColorStop(0.5, '#99A3A4');
        grad.addColorStop(1, '#7F8C8D');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(island.x, island.y, island.width, island.height);
      } else if (island.type === 'dirt') {
        const grad = this.ctx.createLinearGradient(island.x, island.y, island.x, island.y + island.height);
        grad.addColorStop(0, '#D35400');
        grad.addColorStop(0.5, '#BA4A00');
        grad.addColorStop(1, '#873600');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(island.x, island.y, island.width, island.height);
      } else if (island.type === 'cloud') {
        const colors = ['#F39C12', '#E74C3C', '#9B59B6'];
        this.ctx.fillStyle = colors[island.variant] || '#85C1E9';
        this.ctx.globalAlpha = 0.7;
        this.ctx.beginPath();
        this.ctx.roundRect(island.x, island.y, island.width, island.height, 10);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
      }
    });
  }
  
  drawBoostRings() {
    this.gameState.boostRings.forEach(ring => {
      if (!ring.active) return;
      
      this.ctx.save();
      this.ctx.translate(ring.x, ring.y);
      this.ctx.rotate(ring.rotation);
      
      const glow = ring.glow * 15 + 25;
      this.ctx.shadowColor = '#00FFFF';
      this.ctx.shadowBlur = glow;
      
      this.ctx.strokeStyle = '#00FFFF';
      this.ctx.lineWidth = 5;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, ring.radius, 0, Math.PI * 2);
      this.ctx.stroke();
      
      this.ctx.restore();
    });
  }
  
  drawFeathers() {
    this.gameState.feathers.forEach(feather => {
      if (feather.collected) return;
      
      this.ctx.save();
      this.ctx.translate(feather.x, feather.y);
      this.ctx.rotate(feather.rotation);
      this.ctx.scale(1, Math.sin(feather.flutter) * 0.3 + 1);
      
      this.ctx.fillStyle = '#9B59B6';
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#ECF0F1';
      this.ctx.fillRect(-1, -8, 2, 16);
      
      this.ctx.restore();
    });
  }
  
  drawBirds() {
    this.gameState.birds.forEach(bird => {
      const wingY = Math.sin(bird.wingSpeed) * 10;
      
      this.ctx.save();
      this.ctx.translate(bird.x - this.camera.x, bird.y);
      
      if (bird.direction < 0) {
        this.ctx.scale(-1, 1);
      }
      
      this.ctx.fillStyle = '#2C3E50';
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, bird.size, bird.size * 0.5, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.beginPath();
      this.ctx.moveTo(-bird.size * 0.3, wingY);
      this.ctx.lineTo(-bird.size, -bird.size * 0.5 + wingY);
      this.ctx.lineTo(-bird.size * 0.3, wingY * 0.5);
      this.ctx.fill();
      
      this.ctx.beginPath();
      this.ctx.moveTo(bird.size * 0.3, wingY);
      this.ctx.lineTo(bird.size, -bird.size * 0.5 + wingY);
      this.ctx.lineTo(bird.size * 0.3, wingY * 0.5);
      this.ctx.fill();
      
      this.ctx.restore();
    });
  }
  
  drawPlayer() {
    const player = this.gameState.players[this.player];
    if (!player) return;
    
    if (player.invincible && Math.floor(this.gameState.time * 15) % 2 === 0) {
      return;
    }
    
    this.ctx.save();
    this.ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    
    if (player.facing < 0) {
      this.ctx.scale(-1, 1);
    }
    
    // Trail
    player.trail.forEach((pos, i) => {
      this.ctx.globalAlpha = (1 - i / player.trail.length) * 0.3;
      this.ctx.fillStyle = '#3498DB';
      this.ctx.beginPath();
      this.ctx.arc(pos.x - player.x - player.width / 2, pos.y - player.y - player.height / 2, 3 - i * 0.1, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
    
    // Body
    this.ctx.fillStyle = player.color;
    this.ctx.fillRect(-player.width / 2, -player.height / 2 + 10, player.width, player.height - 10);
    
    // Wings (when gliding)
    if (player.isGliding || !player.onGround) {
      const wingAngle = player.isGliding ? 0.3 : Math.sin(this.gameState.time * 10) * 0.2;
      this.ctx.save();
      this.ctx.rotate(-wingAngle);
      this.ctx.fillStyle = '#5DADE2';
      this.ctx.fillRect(-player.width / 2 - 15, -5, 15, 8);
      this.ctx.fillRect(player.width / 2, -5, 15, 8);
      this.ctx.restore();
    }
    
    // Head
    this.ctx.fillStyle = player.skinColor;
    this.ctx.fillRect(-player.width / 2 + 4, -player.height / 2, player.width - 8, 15);
    
    // Eyes
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(-4, -player.height / 2 + 5, 3, 3);
    this.ctx.fillRect(3, -player.height / 2 + 5, 3, 3);
    
    // Beak
    this.ctx.fillStyle = '#F39C12';
    this.ctx.beginPath();
    this.ctx.moveTo(5, -player.height / 2 + 8);
    this.ctx.lineTo(12, -player.height / 2 + 10);
    this.ctx.lineTo(5, -player.height / 2 + 12);
    this.ctx.fill();
    
    // Glider cape
    if (player.canGlide) {
      this.ctx.strokeStyle = '#8E44AD';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(-player.width / 2 + 5, -player.height / 2 + 15);
      this.ctx.lineTo(-player.width / 2 - 10, -player.height / 2 + 5);
      this.ctx.lineTo(-player.width / 2 + 5, -player.height / 2 + 25);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(player.width / 2 - 5, -player.height / 2 + 15);
      this.ctx.lineTo(player.width / 2 + 10, -player.height / 2 + 5);
      this.ctx.lineTo(player.width / 2 - 5, -player.height / 2 + 25);
      this.ctx.stroke();
    }
    
    // Hover effect
    if (player.hasHover) {
      this.ctx.strokeStyle = '#9B59B6';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(-player.width / 2, -player.height / 2, player.width, player.height);
    }
    
    this.ctx.restore();
  }
  
  drawParticles() {
    this.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life * 2;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
  }
  
  drawUI() {
    const player = this.gameState.players[this.player];
    if (!player) return;
    
    // Score
    this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
    this.ctx.fillRect(15, 15, 140, 50);
    this.ctx.fillStyle = '#F1C40F';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 25, 40);
    
    // Feathers
    this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
    this.ctx.fillRect(15, 75, 120, 30);
    this.ctx.fillStyle = '#9B59B6';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.fillText(`Feathers: ${player.feathers}/5`, 25, 95);
    
    // Abilities
    if (player.canGlide) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
      this.ctx.fillRect(15, 115, 100, 25);
      this.ctx.fillStyle = '#3498DB';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.fillText(`GLIDE`, 25, 132);
    }
    
    if (player.hasHover) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
      this.ctx.fillRect(125, 115, 100, 25);
      this.ctx.fillStyle = '#9B59B6';
      this.ctx.fillText(`HOVER: ${Math.ceil(player.hoverTimer)}s`, 135, 132);
    }
    
    // Health
    this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
    this.ctx.fillRect(15, 150, 180, 25);
    this.ctx.fillStyle = '#C0392B';
    this.ctx.fillRect(17, 152, 176, 21);
    this.ctx.fillStyle = '#27AE60';
    this.ctx.fillRect(17, 152, 176 * (player.health / player.maxHealth), 21);
    
    // Weather
    if (this.gameState.weather !== 'sunny') {
      this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
      this.ctx.fillRect(this.canvas.width - 90, 15, 75, 25);
      this.ctx.fillStyle = '#F39C12';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'right';
      this.ctx.fillText('STORMY', this.canvas.width - 25, 32);
    }
  }
  
  updatePlayerInput(playerName, input) {
    window.gameInputs = window.gameInputs || {};
    window.gameInputs[playerName] = input;
  }
}

window.SkyRunner = SkyRunner;