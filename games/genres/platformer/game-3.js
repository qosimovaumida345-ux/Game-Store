// Ice Climber - Icy Mountain Platformer
class IceClimber {
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
      gravity: 0.5,
      friction: 0.85,
      iceFriction: 0.98,
      jumpForce: -13,
      slideJumpForce: -11,
      moveSpeed: 5,
      slideSpeed: 12,
      levelWidth: 3500,
      levelHeight: 800,
      cameraSpeed: 0.1
    };
    
    this.gameState = {
      players: {},
      time: 0,
      level: 1,
      score: 0,
      status: 'playing',
      platforms: [],
      icePatches: [],
      snowflakes: [],
      crystals: [],
      icicles: [],
      penguins: [],
      yeti: null,
      springs: [],
      flags: []
    };
    
    this.player = null;
    this.camera = { x: 0, y: 0 };
    this.particles = [];
    this.inputState = {};
    this.snowAccum = 0;
    
    this.generateLevel();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  generateLevel() {
    this.gameState.platforms = [];
    this.gameState.icePatches = [];
    this.gameState.snowflakes = [];
    this.gameState.crystals = [];
    this.gameState.icicles = [];
    this.gameState.penguins = [];
    this.gameState.springs = [];
    this.gameState.flags = [];
    
    // Ground platforms with snow
    const groundPlatforms = [
      { x: 0, y: this.canvas.height - 60, w: 500, h: 60, type: 'snow' },
      { x: 600, y: this.canvas.height - 80, w: 400, h: 80, type: 'ice' },
      { x: 1100, y: this.canvas.height - 60, w: 500, h: 60, type: 'snow' },
      { x: 1700, y: this.canvas.height - 100, w: 450, h: 100, type: 'ice' },
      { x: 2250, y: this.canvas.height - 60, w: 500, h: 60, type: 'snow' },
      { x: 2850, y: this.canvas.height - 80, w: 450, h: 80, type: 'ice' }
    ];
    
    groundPlatforms.forEach(p => {
      this.gameState.platforms.push({
        x: p.x, y: p.y, width: p.w, height: p.h, type: p.type,
        slip: p.type === 'ice'
      });
    });
    
    // Ice patches (slippery areas)
    const icePatches = [
      { x: 700, y: this.canvas.height - 100, w: 200, h: 20 },
      { x: 1800, y: this.canvas.height - 120, w: 150, h: 20 },
      { x: 2950, y: this.canvas.height - 100, w: 150, h: 20 }
    ];
    
    this.gameState.icePatches = icePatches.map(p => ({
      x: p.x, y: p.y, width: p.w, height: p.h,
      opacity: 0.6, shimmer: 0
    }));
    
    // Floating platforms climbing up
    const platforms = [
      { x: 150, y: this.canvas.height - 180, w: 100, h: 20, type: 'snow' },
      { x: 350, y: this.canvas.height - 250, w: 80, h: 20, type: 'ice' },
      { x: 200, y: this.canvas.height - 340, w: 120, h: 20, type: 'snow' },
      { x: 450, y: this.canvas.height - 420, w: 100, h: 20, type: 'ice' },
      { x: 650, y: this.canvas.height - 350, w: 80, h: 20, type: 'snow' },
      { x: 850, y: this.canvas.height - 280, w: 100, h: 20, type: 'ice' },
      { x: 1100, y: this.canvas.height - 200, w: 150, h: 20, type: 'snow' },
      { x: 1350, y: this.canvas.height - 280, w: 100, h: 20, type: 'ice' },
      { x: 1200, y: this.canvas.height - 380, w: 80, h: 20, type: 'snow' },
      { x: 1450, y: this.canvas.height - 420, w: 120, h: 20, type: 'ice' },
      { x: 1650, y: this.canvas.height - 350, w: 100, h: 20, type: 'snow' },
      { x: 1850, y: this.canvas.height - 280, w: 80, h: 20, type: 'ice' },
      { x: 2000, y: this.canvas.height - 380, w: 120, h: 20, type: 'snow' },
      { x: 2200, y: this.canvas.height - 320, w: 100, h: 20, type: 'ice' },
      { x: 2350, y: this.canvas.height - 420, w: 80, h: 20, type: 'snow' },
      { x: 2550, y: this.canvas.height - 350, w: 120, h: 20, type: 'ice' },
      { x: 2750, y: this.canvas.height - 280, w: 80, h: 20, type: 'snow' },
      { x: 2900, y: this.canvas.height - 380, w: 100, h: 20, type: 'ice' },
      { x: 3100, y: this.canvas.height - 320, w: 120, h: 20, type: 'snow' }
    ];
    
    platforms.forEach((p, i) => {
      this.gameState.platforms.push({
        x: p.x, y: p.y, width: p.w, height: p.h, type: p.type,
        slip: p.type === 'ice'
      });
    });
    
    // Crystals (collectibles)
    const crystalPositions = [
      { x: 180, y: this.canvas.height - 230, type: 'blue' },
      { x: 480, y: this.canvas.height - 470, type: 'blue' },
      { x: 680, y: this.canvas.height - 400, type: 'blue' },
      { x: 1150, y: this.canvas.height - 250, type: 'blue' },
      { x: 1230, y: this.canvas.height - 430, type: 'blue' },
      { x: 1500, y: this.canvas.height - 470, type: 'blue' },
      { x: 1700, y: this.canvas.height - 400, type: 'blue' },
      { x: 2050, y: this.canvas.height - 430, type: 'blue' },
      { x: 2400, y: this.canvas.height - 470, type: 'blue' },
      { x: 2800, y: this.canvas.height - 430, type: 'blue' },
      { x: 3200, y: this.canvas.height - 370, type: 'purple' }
    ];
    
    this.gameState.crystals = crystalPositions.map(c => ({
      x: c.x, y: c.y, radius: 12, type: c.type, collected: false,
      rotation: 0, glow: 0
    }));
    
    // Spring pads
    const springs = [
      { x: 400, y: this.canvas.height - 110 },
      { x: 1650, y: this.canvas.height - 130 },
      { x: 2800, y: this.canvas.height - 110 }
    ];
    
    this.gameState.springs = springs.map(s => ({
      x: s.x, y: s.y, width: 50, height: 20,
      compression: 0, active: false
    }));
    
    // Flags (checkpoints)
    const flags = [
      { x: 450, y: this.canvas.height - 100, active: false },
      { x: 1600, y: this.canvas.height - 140, active: false },
      { x: 2900, y: this.canvas.height - 120, active: true }
    ];
    
    this.gameState.flags = flags.map(f => ({
      x: f.x, y: f.y, width: 20, height: 60, active: f.active, wave: 0
    }));
    
    // Penguins (enemies)
    const penguins = [
      { x: 250, y: this.canvas.height - 80, range: 150 },
      { x: 750, y: this.canvas.height - 100, range: 120 },
      { x: 1300, y: this.canvas.height - 80, range: 180 },
      { x: 1900, y: this.canvas.height - 120, range: 150 },
      { x: 2450, y: this.canvas.height - 80, range: 200 },
      { x: 3000, y: this.canvas.height - 100, range: 100 }
    ];
    
    this.gameState.penguins = penguins.map(p => ({
      x: p.x, y: p.y, width: 35, height: 40,
      startX: p.x, range: p.range,
      speed: 1.5, direction: 1,
      animTimer: 0, alive: true
    }));
    
    // Yeti (boss)
    this.gameState.yeti = {
      x: 2300, y: this.canvas.height - 200,
      width: 80, height: 120,
      health: 100, maxHealth: 100,
      alive: true, active: false,
      attacked: false, attackTimer: 0,
      direction: -1
    };
    
    // Snowflakes
    for (let i = 0; i < 100; i++) {
      this.gameState.snowflakes.push({
        x: Math.random() * this.config.levelWidth,
        y: Math.random() * this.config.levelHeight,
        size: 2 + Math.random() * 4,
        speed: 0.5 + Math.random() * 1.5,
        drift: (Math.random() - 0.5) * 0.5,
        opacity: 0.5 + Math.random() * 0.5
      });
    }
    
    // Icicles (hazards)
    for (let i = 0; i < 20; i++) {
      this.gameState.icicles.push({
        x: 200 + Math.random() * (this.config.levelWidth - 400),
        y: -50 + Math.random() * 100,
        length: 40 + Math.random() * 40,
        fallTimer: 3 + Math.random() * 5,
        falling: false,
        speed: 0,
        opacity: 0.9
      });
    }
  }
  
  start() {
    this.player = this.players[0] || 'Player 1';
    
    this.gameState.players[this.player] = {
      name: this.player,
      x: 100,
      y: this.canvas.height - 120,
      vx: 0,
      vy: 0,
      width: 28,
      height: 45,
      color: '#E74C3C',
      scarfColor: '#C0392B',
      onGround: false,
      onIce: false,
      isSliding: false,
      slidingDir: 0,
      crystals: 0,
      health: 100,
      maxHealth: 100,
      invincible: false,
      invincibleTimer: 0,
      facing: 1,
      state: 'idle',
      combo: 0
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
    this.updateSnowflakes(deltaTime);
    this.updateCrystals(player, deltaTime);
    this.updateSprings(player, deltaTime);
    this.updatePenguins(player, deltaTime);
    this.updateYeti(player, deltaTime);
    this.updateIcicles(deltaTime, player);
    this.updateParticles(deltaTime);
    this.checkFlags(player);
    this.checkSnowAccum(deltaTime, player);
    
    if (player.invincible) {
      player.invincibleTimer -= deltaTime;
      if (player.invincibleTimer <= 0) {
        player.invincible = false;
      }
    }
    
    if (player.y > this.canvas.height + 100) {
      this.fallReset(player);
    }
  }
  
  handleInput(player) {
    const input = this.getPlayerInput(player.name);
    
    // Check ice/snow surface
    player.onIce = false;
    this.gameState.icePatches.forEach(patch => {
      if (this.onPlatform(player, patch)) {
        player.onIce = true;
      }
    });
    
    if (player.onGround) {
      if (input.left) {
        if (player.onIce) {
          player.vx = Math.max(player.vx - 0.5, -this.config.slideSpeed);
          if (Math.abs(player.vx) > this.config.moveSpeed) {
            player.isSliding = true;
            player.slidingDir = -1;
          }
        } else {
          player.vx = -this.config.moveSpeed;
          player.isSliding = false;
        }
        player.facing = -1;
        player.state = 'running';
      } else if (input.right) {
        if (player.onIce) {
          player.vx = Math.min(player.vx + 0.5, this.config.slideSpeed);
          if (Math.abs(player.vx) > this.config.moveSpeed) {
            player.isSliding = true;
            player.slidingDir = 1;
          }
        } else {
          player.vx = this.config.moveSpeed;
          player.isSliding = false;
        }
        player.facing = 1;
        player.state = 'running';
      } else {
        if (player.onIce) {
          player.vx *= this.config.iceFriction;
          if (Math.abs(player.vx) < 0.5) {
            player.isSliding = false;
          } else {
            player.isSliding = true;
            player.slidingDir = player.vx > 0 ? 1 : -1;
          }
        } else {
          player.vx *= this.config.friction;
          player.isSliding = false;
        }
        player.state = 'idle';
      }
    } else {
      if (player.onIce) {
        player.vx *= 0.99;
      }
    }
    
    if (input.up) {
      if (player.onGround) {
        const jumpForce = player.isSliding ? this.config.slideJumpForce : this.config.jumpForce;
        player.vy = jumpForce;
        player.onGround = false;
        this.createJumpParticles(player, '#FFF');
      }
    }
  }
  
  getPlayerInput(playerName) {
    const inputs = window.gameInputs || {};
    return inputs[playerName] || this.inputState;
  }
  
  applyPhysics(player, deltaTime) {
    player.vy += this.config.gravity;
    player.vy = Math.min(player.vy, 15);
    player.x += player.vx;
    player.y += player.vy;
    player.onGround = false;
    player.x = Math.max(0, Math.min(this.config.levelWidth - player.width, player.x));
  }
  
  checkCollisions(player) {
    this.gameState.platforms.forEach(platform => {
      if (this.checkAABB(player, platform)) {
        if (player.vy > 0 && player.y + player.height - player.vy <= platform.y + 5) {
          player.y = platform.y - player.height;
          player.vy = 0;
          player.onGround = true;
        }
      }
    });
    
    this.gameState.springs.forEach(spring => {
      if (this.checkAABB(player, spring)) {
        if (player.vy > 0 && !spring.active) {
          spring.compression = 1;
          spring.active = true;
          player.vy = -20;
          this.createSpringParticles(player);
        }
      }
    });
  }
  
  checkAABB(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
  }
  
  onPlatform(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y + a.height >= b.y && a.y + a.height <= b.y + b.height + 5;
  }
  
  updateCamera(player) {
    const targetX = player.x - this.canvas.width / 3;
    this.camera.x += (targetX - this.camera.x) * this.config.cameraSpeed;
    this.camera.x = Math.max(0, Math.min(this.config.levelWidth - this.canvas.width, this.camera.x));
    
    const targetY = player.y - this.canvas.height / 2;
    this.camera.y = Math.max(0, Math.min(this.config.levelHeight - this.canvas.height, targetY));
  }
  
  updateSnowflakes(deltaTime) {
    this.gameState.snowflakes.forEach(flake => {
      flake.y += flake.speed;
      flake.x += flake.drift;
      flake.drift += (Math.random() - 0.5) * 0.1;
      flake.drift = Math.max(-1, Math.min(1, flake.drift));
      
      if (flake.y > this.canvas.height + 50) {
        flake.y = -10;
        flake.x = this.camera.x + Math.random() * this.canvas.width;
      }
    });
  }
  
  updateCrystals(player, deltaTime) {
    this.gameState.crystals.forEach(crystal => {
      if (crystal.collected) return;
      
      crystal.rotation += deltaTime * 2;
      crystal.glow = (Math.sin(this.gameState.time * 4) + 1) / 2;
      
      const dx = (player.x + player.width / 2) - crystal.x;
      const dy = (player.y + player.height / 2) - crystal.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 35) {
        crystal.collected = true;
        player.crystals++;
        this.gameState.score += 30;
        this.createCrystalParticles(crystal.x, crystal.y, crystal.type);
      }
    });
  }
  
  updateSprings(player, deltaTime) {
    this.gameState.springs.forEach(spring => {
      if (spring.active) {
        spring.compression -= deltaTime * 5;
        if (spring.compression <= 0) {
          spring.compression = 0;
          spring.active = false;
        }
      }
    });
  }
  
  updatePenguins(player, deltaTime) {
    this.gameState.penguins.forEach(penguin => {
      if (!penguin.alive) return;
      
      penguin.x += penguin.speed * penguin.direction;
      if (penguin.x > penguin.startX + penguin.range) {
        penguin.direction = -1;
      } else if (penguin.x < penguin.startX - penguin.range) {
        penguin.direction = 1;
      }
      penguin.animTimer += deltaTime * 5;
      
      if (this.checkAABB(player, penguin) && !player.invincible) {
        if (player.vy > 0 && player.y + player.height < penguin.y + penguin.height * 0.4) {
          penguin.alive = false;
          player.vy = -10;
          this.gameState.score += 40;
          this.createPenguinParticles(penguin.x + penguin.width / 2, penguin.y + penguin.height / 2);
        } else {
          player.invincible = true;
          player.invincibleTimer = 1;
          const knockback = player.x < penguin.x ? -10 : 10;
          player.vx = knockback;
          player.vy = -5;
        }
      }
    });
  }
  
  updateYeti(player, deltaTime) {
    const yeti = this.gameState.yeti;
    if (!yeti.alive || !yeti.active) return;
    
    yeti.x += yeti.direction * 0.5;
    yeti.direction = player.x < yeti.x ? -1 : 1;
    
    if (yeti.attackTimer > 0) {
      yeti.attackTimer -= deltaTime;
    }
    
    if (this.checkAABB(player, yeti) && !player.invincible) {
      player.invincible = true;
      player.invincibleTimer = 1;
      player.vy = -8;
    }
  }
  
  updateIcicles(deltaTime, player) {
    this.gameState.icicles.forEach(icicle => {
      if (!icicle.falling) {
        icicle.fallTimer -= deltaTime;
        if (icicle.fallTimer <= 0) {
          icicle.falling = true;
          icicle.speed = 2;
        }
      } else {
        icicle.y += icicle.speed;
        icicle.speed += 0.5;
        
        if (player && this.checkAABB(player, { x: icicle.x, y: icicle.y, width: 10, height: icicle.length })) {
          player.health -= 15;
          player.invincible = true;
          player.invincibleTimer = 1;
          this.particles.push({
            x: player.x + player.width / 2, y: player.y + player.height / 2,
            vx: 0, vy: -5, life: 0.5, color: '#FFF', size: 5
          });
        }
        
        if (icicle.y > this.canvas.height + 50) {
          icicle.y = -50;
          icicle.falling = false;
          icicle.fallTimer = 3 + Math.random() * 5;
          icicle.x = this.camera.x + Math.random() * this.canvas.width;
        }
      }
    });
  }
  
  checkFlags(player) {
    this.gameState.flags.forEach(flag => {
      if (!flag.active && this.checkAABB(player, flag)) {
        flag.active = true;
        this.gameState.score += 100;
        this.snowAccum += 20;
      }
    });
  }
  
  checkSnowAccum(deltaTime, player) {
    if (!player.onGround) return;
    
    this.snowAccum = Math.max(0, this.snowAccum - deltaTime * 2);
    
    if (this.snowAccum > 80) {
      player.crystals += 5;
      this.gameState.score += 150;
      this.snowAccum = 0;
    }
  }
  
  fallReset(player) {
    player.health -= 25;
    player.x = 100;
    player.y = this.canvas.height - 120;
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
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * -3,
        life: 0.4,
        color: color,
        size: 3 + Math.random() * 2
      });
    }
  }
  
  createSpringParticles(player) {
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI;
      this.particles.push({
        x: player.x + player.width / 2,
        y: player.y + player.height,
        vx: Math.cos(angle) * 5,
        vy: Math.sin(angle) * -5 - 3,
        life: 0.5,
        color: '#3498DB',
        size: 4
      });
    }
  }
  
  createCrystalParticles(x, y, type) {
    const color = type === 'blue' ? '#3498DB' : '#9B59B6';
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 0.8,
        color: color,
        size: 4
      });
    }
  }
  
  createPenguinParticles(x, y) {
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 0.6,
        color: '#2C3E50',
        size: 4
      });
    }
  }
  
  updateParticles(deltaTime) {
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 10 * deltaTime;
      p.life -= deltaTime;
      return p.life > 0;
    });
  }
  
  render() {
    // Sky gradient (aurora effect)
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    skyGrad.addColorStop(0, '#0B1026');
    skyGrad.addColorStop(0.3, '#1B2A4E');
    skyGrad.addColorStop(0.6, '#2C3E50');
    skyGrad.addColorStop(1, '#34495E');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Northern lights
    this.drawAurora();
    
    // Snowflakes (background)
    this.drawSnowflakes();
    
    this.ctx.save();
    this.ctx.translate(-this.camera.x, -this.camera.y);
    
    this.drawPlatforms();
    this.drawIcePatches();
    this.drawSprings();
    this.drawFlags();
    this.drawCrystals();
    this.drawIcicles();
    this.drawPenguins();
    this.drawYeti();
    this.drawPlayer();
    this.drawParticles();
    
    this.ctx.restore();
    
    this.drawUI();
  }
  
  drawAurora() {
    const colors = ['#2ECC71', '#27AE60', '#1ABC9C'];
    for (let i = 0; i < 3; i++) {
      this.ctx.strokeStyle = colors[i];
      this.ctx.lineWidth = 20;
      this.ctx.globalAlpha = 0.1 + i * 0.05;
      this.ctx.beginPath();
      this.ctx.moveTo(0, 100 + i * 50);
      
      for (let x = 0; x < this.canvas.width; x += 50) {
        const y = 100 + i * 50 + Math.sin(x * 0.01 + this.gameState.time) * 30;
        this.ctx.lineTo(x, y);
      }
      this.ctx.stroke();
    }
    this.ctx.globalAlpha = 1;
  }
  
  drawSnowflakes() {
    this.gameState.snowflakes.forEach(flake => {
      const x = flake.x - this.camera.x;
      const y = flake.y - this.camera.y;
      if (x < -10 || x > this.canvas.width + 10 || y < -10 || y > this.canvas.height + 10) return;
      
      this.ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, flake.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawPlatforms() {
    this.gameState.platforms.forEach(platform => {
      if (platform.type === 'snow') {
        const grad = this.ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
        grad.addColorStop(0, '#ECF0F1');
        grad.addColorStop(0.3, '#BDC3C7');
        grad.addColorStop(1, '#99A3A4');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Snow top
        this.ctx.fillStyle = '#FFF';
        this.ctx.fillRect(platform.x, platform.y, platform.width, 8);
      } else if (platform.type === 'ice') {
        const grad = this.ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
        grad.addColorStop(0, 'rgba(133, 193, 233, 0.8)');
        grad.addColorStop(0.5, 'rgba(52, 152, 219, 0.6)');
        grad.addColorStop(1, 'rgba(41, 128, 185, 0.5)');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Ice shine
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.fillRect(platform.x + 5, platform.y + 2, platform.width - 10, 3);
      }
    });
  }
  
  drawIcePatches() {
    this.gameState.icePatches.forEach(patch => {
      patch.shimmer += 0.05;
      this.ctx.fillStyle = `rgba(52, 152, 219, ${patch.opacity * (0.5 + Math.sin(patch.shimmer) * 0.2)})`;
      this.ctx.fillRect(patch.x, patch.y, patch.width, patch.height);
    });
  }
  
  drawSprings() {
    this.gameState.springs.forEach(spring => {
      const compression = spring.compression * 15;
      
      this.ctx.fillStyle = '#7F8C8D';
      this.ctx.fillRect(spring.x, spring.y + compression, spring.width, spring.height - compression);
      
      this.ctx.fillStyle = '#E74C3C';
      this.ctx.fillRect(spring.x + 5, spring.y + compression + 2, spring.width - 10, spring.height - compression - 4);
    });
  }
  
  drawFlags() {
    this.gameState.flags.forEach(flag => {
      flag.wave += 0.1;
      
      // Pole
      this.ctx.fillStyle = '#95A5A6';
      this.ctx.fillRect(flag.x, flag.y, 4, flag.height);
      
      // Flag
      const waveAmount = Math.sin(flag.wave) * 5;
      this.ctx.fillStyle = flag.active ? '#27AE60' : '#C0392B';
      this.ctx.beginPath();
      this.ctx.moveTo(flag.x + 4, flag.y);
      this.ctx.lineTo(flag.x + 4 + 20 + waveAmount, flag.y + 10);
      this.ctx.lineTo(flag.x + 4, flag.y + 20);
      this.ctx.fill();
    });
  }
  
  drawCrystals() {
    this.gameState.crystals.forEach(crystal => {
      if (crystal.collected) return;
      
      this.ctx.save();
      this.ctx.translate(crystal.x, crystal.y);
      this.ctx.rotate(crystal.rotation);
      
      const glow = crystal.glow * 15 + 20;
      this.ctx.shadowColor = crystal.type === 'blue' ? '#3498DB' : '#9B59B6';
      this.ctx.shadowBlur = glow;
      
      this.ctx.fillStyle = crystal.type === 'blue' ? '#3498DB' : '#9B59B6';
      this.ctx.beginPath();
      this.ctx.moveTo(0, -crystal.radius);
      this.ctx.lineTo(crystal.radius, 0);
      this.ctx.lineTo(0, crystal.radius);
      this.ctx.lineTo(-crystal.radius, 0);
      this.ctx.closePath();
      this.ctx.fill();
      
      this.ctx.strokeStyle = '#FFF';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      this.ctx.restore();
    });
  }
  
  drawIcicles() {
    this.gameState.icicles.forEach(icicle => {
      this.ctx.fillStyle = `rgba(133, 193, 233, ${icicle.opacity})`;
      this.ctx.beginPath();
      this.ctx.moveTo(icicle.x, icicle.y);
      this.ctx.lineTo(icicle.x + 10, icicle.y + icicle.length);
      this.ctx.lineTo(icicle.x, icicle.y + icicle.length - 10);
      this.ctx.lineTo(icicle.x - 10, icicle.y);
      this.ctx.closePath();
      this.ctx.fill();
    });
  }
  
  drawPenguins() {
    this.gameState.penguins.forEach(penguin => {
      if (!penguin.alive) return;
      
      const bob = Math.sin(penguin.animTimer) * 3;
      
      this.ctx.save();
      this.ctx.translate(penguin.x + penguin.width / 2, penguin.y + penguin.height / 2);
      
      if (penguin.direction < 0) {
        this.ctx.scale(-1, 1);
      }
      
      // Body
      this.ctx.fillStyle = '#2C3E50';
      this.ctx.beginPath();
      this.ctx.ellipse(0, 5, penguin.width / 2, penguin.height / 2 - 5, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Belly
      this.ctx.fillStyle = '#ECF0F1';
      this.ctx.beginPath();
      this.ctx.ellipse(0, 8, penguin.width / 2 - 5, penguin.height / 2 - 10, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Head
      this.ctx.fillStyle = '#2C3E50';
      this.ctx.beginPath();
      this.ctx.arc(0, -penguin.height / 2 + 10 + bob, 12, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Eyes
      this.ctx.fillStyle = '#FFF';
      this.ctx.beginPath();
      this.ctx.arc(-4, -penguin.height / 2 + 8 + bob, 3, 0, Math.PI * 2);
      this.ctx.arc(4, -penguin.height / 2 + 8 + bob, 3, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#000';
      this.ctx.beginPath();
      this.ctx.arc(-4, -penguin.height / 2 + 8 + bob, 1.5, 0, Math.PI * 2);
      this.ctx.arc(4, -penguin.height / 2 + 8 + bob, 1.5, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Beak
      this.ctx.fillStyle = '#F39C12';
      this.ctx.beginPath();
      this.ctx.moveTo(0, -penguin.height / 2 + 12 + bob);
      this.ctx.lineTo(6, -penguin.height / 2 + 15 + bob);
      this.ctx.lineTo(0, -penguin.height / 2 + 18 + bob);
      this.ctx.fill();
      
      // Feet
      this.ctx.fillStyle = '#F39C12';
      this.ctx.beginPath();
      this.ctx.ellipse(-8, penguin.height / 2 - 5, 6, 4, 0, 0, Math.PI * 2);
      this.ctx.ellipse(8, penguin.height / 2 - 5, 6, 4, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.restore();
    });
  }
  
  drawYeti() {
    const yeti = this.gameState.yeti;
    if (!yeti.alive || !yeti.active) return;
    
    this.ctx.save();
    this.ctx.translate(yeti.x + yeti.width / 2, yeti.y + yeti.height / 2);
    
    if (yeti.direction < 0) {
      this.ctx.scale(-1, 1);
    }
    
    // Body (furry)
    this.ctx.fillStyle = '#BDC3C7';
    this.ctx.fillRect(-yeti.width / 2, -yeti.height / 2 + 20, yeti.width, yeti.height - 20);
    
    // Fur texture
    for (let i = 0; i < 8; i++) {
      this.ctx.beginPath();
      this.ctx.arc(-30 + i * 10, -20 + (i % 2) * 10, 8, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Head
    this.ctx.fillStyle = '#ECF0F1';
    this.ctx.beginPath();
    this.ctx.arc(0, -yeti.height / 2 + 25, 25, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Eyes
    this.ctx.fillStyle = '#C0392B';
    this.ctx.beginPath();
    this.ctx.arc(-8, -yeti.height / 2 + 20, 4, 0, Math.PI * 2);
    this.ctx.arc(8, -yeti.height / 2 + 20, 4, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Fangs
    this.ctx.fillStyle = '#FFF';
    this.ctx.beginPath();
    this.ctx.moveTo(-5, -yeti.height / 2 + 35);
    this.ctx.lineTo(-3, -yeti.height / 2 + 45);
    this.ctx.lineTo(-1, -yeti.height / 2 + 35);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.moveTo(1, -yeti.height / 2 + 35);
    this.ctx.lineTo(3, -yeti.height / 2 + 45);
    this.ctx.lineTo(5, -yeti.height / 2 + 35);
    this.ctx.fill();
    
    // Arms
    this.ctx.fillStyle = '#BDC3C7';
    this.ctx.fillRect(-yeti.width / 2 - 20, -yeti.height / 2 + 30, 20, 10);
    this.ctx.fillRect(yeti.width / 2, -yeti.height / 2 + 30, 20, 10);
    
    this.ctx.restore();
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
    
    // Shadow
    this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, player.height / 2, player.width / 2, 5, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Body
    this.ctx.fillStyle = player.color;
    this.ctx.fillRect(-player.width / 2, -player.height / 2 + 12, player.width, player.height - 12);
    
    // Scarf
    this.ctx.fillStyle = player.scarfColor;
    this.ctx.fillRect(-player.width / 2, -player.height / 2 + 10, player.width, 8);
    
    // Scarf tail
    if (player.isSliding) {
      const tailWave = Math.sin(this.gameState.time * 10) * 5;
      this.ctx.beginPath();
      this.ctx.moveTo(-player.width / 2, -player.height / 2 + 12);
      this.ctx.lineTo(-player.width / 2 - 20, -player.height / 2 + 8 + tailWave);
      this.ctx.lineTo(-player.width / 2 - 15, -player.height / 2 + 20 + tailWave);
      this.ctx.fill();
    }
    
    // Head
    this.ctx.fillStyle = '#FDEBD0';
    this.ctx.fillRect(-player.width / 2 + 4, -player.height / 2 + 2, player.width - 8, 15);
    
    // Ears (winter hat)
    this.ctx.fillStyle = '#C0392B';
    this.ctx.fillRect(-player.width / 2 + 2, -player.height / 2 - 5, 5, 8);
    this.ctx.fillRect(player.width / 2 - 7, -player.height / 2 - 5, 5, 8);
    
    // Hat pom-pom
    this.ctx.fillStyle = '#FFF';
    this.ctx.beginPath();
    this.ctx.arc(0, -player.height / 2 - 8, 5, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Eyes
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(-5, -player.height / 2 + 7, 3, 3);
    this.ctx.fillRect(3, -player.height / 2 + 7, 3, 3);
    
    // Legs
    if (player.state === 'running') {
      const legAnim = Math.sin(this.gameState.time * 15) * 8;
      this.ctx.fillStyle = '#5D6D7E';
      this.ctx.fillRect(-8, player.height / 2 - 12, 6, 12 + legAnim);
      this.ctx.fillRect(2, player.height / 2 - 12, 6, 12 - legAnim);
    } else {
      this.ctx.fillStyle = '#5D6D7E';
      this.ctx.fillRect(-8, player.height / 2 - 12, 6, 12);
      this.ctx.fillRect(2, player.height / 2 - 12, 6, 12);
    }
    
    // Sled
    if (player.isSliding) {
      this.ctx.fillStyle = '#8B4513';
      this.ctx.fillRect(-player.width / 2 - 5, player.height / 2 - 5, player.width + 15, 6);
      this.ctx.fillStyle = '#F39C12';
      this.ctx.fillRect(-player.width / 2 + 5, player.height / 2 - 8, player.width - 10, 3);
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
    
    // Score
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(15, 15, 150, 50);
    this.ctx.fillStyle = '#3498DB';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 25, 40);
    
    // Crystals
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(15, 75, 120, 30);
    this.ctx.fillStyle = '#3498DB';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.fillText(`Crystals: ${player.crystals}`, 25, 95);
    
    // Sliding indicator
    if (player.isSliding) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(15, 115, 80, 25);
      this.ctx.fillStyle = '#F39C12';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.fillText('SLIDING!', 25, 132);
    }
    
    // Health
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(15, 150, 180, 25);
    this.ctx.fillStyle = '#C0392B';
    this.ctx.fillRect(17, 152, 176, 21);
    this.ctx.fillStyle = '#27AE60';
    this.ctx.fillRect(17, 152, 176 * (player.health / player.maxHealth), 21);
    
    // Snow accumulation bar
    if (this.snowAccum > 0) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(this.canvas.width - 120, 15, 105, 30);
      this.ctx.fillStyle = '#ECF0F1';
      this.ctx.fillRect(this.canvas.width - 118, 17, 101, 26);
      this.ctx.fillStyle = '#3498DB';
      this.ctx.fillRect(this.canvas.width - 118, 17, this.snowAccum * 5, 26);
      this.ctx.font = 'bold 10px Arial';
      this.ctx.fillStyle = '#2C3E50';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('BLAST!', this.canvas.width - 67, 35);
    }
  }
  
  updatePlayerInput(playerName, input) {
    window.gameInputs = window.gameInputs || {};
    window.gameInputs[playerName] = input;
  }
}

window.IceClimber = IceClimber;