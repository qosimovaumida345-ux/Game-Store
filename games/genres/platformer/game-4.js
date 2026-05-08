// Desert Runner - Sand Storm Platformer
class DesertRunner {
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
      jumpForce: -14,
      doubleJump: true,
      moveSpeed: 5.5,
      dashSpeed: 12,
      dashCooldown: 2,
      levelWidth: 4000,
      cameraSpeed: 0.1,
      sandstormStrength: 0
    };
    
    this.gameState = {
      players: {},
      time: 0,
      level: 1,
      score: 0,
      status: 'playing',
      platforms: [],
      dunes: [],
      oases: [],
      hieroglyphs: [],
      gems: [],
      scorpions: [],
      cobras: [],
      vultures: [],
      temples: [],
      treasureChests: [],
      sandstorm: null,
      heatWave: 0
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
    this.gameState.platforms = [];
    this.gameState.dunes = [];
    this.gameState.oases = [];
    this.gameState.hieroglyphs = [];
    this.gameState.gems = [];
    this.gameState.scorpions = [];
    this.gameState.cobras = [];
    this.gameState.vultures = [];
    this.gameState.temples = [];
    this.gameState.treasureChests = [];
    this.gameState.sandstorm = null;
    
    // Ground (sand dunes)
    const grounds = [
      { x: 0, y: this.canvas.height - 60, w: 600, h: 60 },
      { x: 700, y: this.canvas.height - 80, w: 500, h: 80 },
      { x: 1300, y: this.canvas.height - 60, w: 600, h: 60 },
      { x: 2000, y: this.canvas.height - 100, w: 550, h: 100 },
      { x: 2650, y: this.canvas.height - 60, w: 600, h: 60 },
      { x: 3350, y: this.canvas.height - 80, w: 550, h: 80 }
    ];
    
    grounds.forEach(g => {
      this.gameState.platforms.push({
        x: g.x, y: g.y, width: g.w, height: g.h, type: 'sand'
      });
    });
    
    // Dune bumps
    this.gameState.dunes = [
      { x: 150, y: this.canvas.height - 70, w: 80, h: 20 },
      { x: 350, y: this.canvas.height - 80, w: 100, h: 25 },
      { x: 850, y: this.canvas.height - 70, w: 70, h: 15 },
      { x: 1450, y: this.canvas.height - 80, w: 90, h: 20 },
      { x: 2200, y: this.canvas.height - 90, w: 85, h: 25 },
      { x: 2900, y: this.canvas.height - 70, w: 75, h: 20 },
      { x: 3550, y: this.canvas.height - 80, w: 100, h: 25 }
    ];
    
    // Floating platforms (pyramids)
    const platforms = [
      { x: 200, y: this.canvas.height - 180, w: 100, h: 20 },
      { x: 450, y: this.canvas.height - 250, w: 80, h: 20 },
      { x: 650, y: this.canvas.height - 180, w: 120, h: 20 },
      { x: 900, y: this.canvas.height - 300, w: 100, h: 20 },
      { x: 1150, y: this.canvas.height - 220, w: 80, h: 20 },
      { x: 1400, y: this.canvas.height - 350, w: 100, h: 20 },
      { x: 1650, y: this.canvas.height - 280, w: 120, h: 20 },
      { x: 1900, y: this.canvas.height - 380, w: 80, h: 20 },
      { x: 2150, y: this.canvas.height - 320, w: 100, h: 20 },
      { x: 2400, y: this.canvas.height - 250, w: 80, h: 20 },
      { x: 2700, y: this.canvas.height - 380, w: 120, h: 20 },
      { x: 2950, y: this.canvas.height - 300, w: 100, h: 20 },
      { x: 3200, y: this.canvas.height - 220, w: 80, h: 20 },
      { x: 3500, y: this.canvas.height - 350, w: 100, h: 20 },
      { x: 3800, y: this.canvas.height - 280, w: 120, h: 20 }
    ];
    
    platforms.forEach((p, i) => {
      this.gameState.platforms.push({
        x: p.x, y: p.y, width: p.w, height: p.h, type: i % 2 === 0 ? 'stone' : 'brick'
      });
    });
    
    // Oases
    const oases = [
      { x: 800, y: this.canvas.height - 60, w: 150, h: 30, size: 'small' },
      { x: 2200, y: this.canvas.height - 60, w: 200, h: 40, size: 'medium' },
      { x: 3400, y: this.canvas.height - 60, w: 180, h: 35, size: 'medium' }
    ];
    
    this.gameState.oases = oases.map(o => ({
      x: o.x, y: o.y, width: o.w, height: o.h, size: o.size,
      wave: 0, shimmer: 0
    }));
    
    // Temples (goal)
    this.gameState.temples = [
      { x: 3900, y: this.canvas.height - 150, w: 80, h: 90, open: false }
    ];
    
    // Hieroglyphs (secrets)
    const hieroglyphs = [
      { x: 500, y: this.canvas.height - 120 }, { x: 1500, y: this.canvas.height - 100 },
      { x: 2500, y: this.canvas.height - 140 }, { x: 3600, y: this.canvas.height - 120 }
    ];
    
    this.gameState.hieroglyphs = hieroglyphs.map(h => ({
      x: h.x, y: h.y, collected: false, glow: 0
    }));
    
    // Gems (collectibles)
    const gemPositions = [
      { x: 220, y: this.canvas.height - 230, type: 'ruby' },
      { x: 480, y: this.canvas.height - 300, type: 'ruby' },
      { x: 680, y: this.canvas.height - 230, type: 'ruby' },
      { x: 930, y: this.canvas.height - 350, type: 'ruby' },
      { x: 1180, y: this.canvas.height - 270, type: 'ruby' },
      { x: 1430, y: this.canvas.height - 400, type: 'topaz' },
      { x: 1680, y: this.canvas.height - 330, type: 'ruby' },
      { x: 1930, y: this.canvas.height - 430, type: 'ruby' },
      { x: 2180, y: this.canvas.height - 370, type: 'topaz' },
      { x: 2430, y: this.canvas.height - 300, type: 'ruby' },
      { x: 2730, y: this.canvas.height - 430, type: 'ruby' },
      { x: 2980, y: this.canvas.height - 350, type: 'ruby' },
      { x: 3230, y: this.canvas.height - 270, type: 'emerald' },
      { x: 3530, y: this.canvas.height - 400, type: 'ruby' },
      { x: 3830, y: this.canvas.height - 330, type: 'emerald' }
    ];
    
    this.gameState.gems = gemPositions.map(g => ({
      x: g.x, y: g.y, radius: 12, type: g.type, collected: false,
      rotation: 0
    }));
    
    // Treasure chests
    this.gameState.treasureChests = [
      { x: 1800, y: this.canvas.height - 130, opened: false },
      { x: 2900, y: this.canvas.height - 110, opened: false }
    ];
    
    // Scorpions (ground enemies)
    const scorpions = [
      { x: 300, y: this.canvas.height - 80, range: 150 },
      { x: 900, y: this.canvas.height - 100, range: 120 },
      { x: 1600, y: this.canvas.height - 80, range: 180 },
      { x: 2400, y: this.canvas.height - 120, range: 150 },
      { x: 3200, y: this.canvas.height - 100, range: 100 }
    ];
    
    this.gameState.scorpions = scorpions.map(s => ({
      x: s.x, y: s.y, width: 35, height: 25,
      startX: s.x, range: s.range,
      speed: 1.5, direction: 1,
      animTimer: 0, alive: true, tailAngle: 0
    }));
    
    // Cobras (platform enemies)
    const cobras = [
      { x: 700, y: this.canvas.height - 220 }, { x: 1500, y: this.canvas.height - 390 },
      { x: 2300, y: this.canvas.height - 290 }, { x: 3100, y: this.canvas.height - 260 }
    ];
    
    this.gameState.cobras = cobras.map(c => ({
      x: c.x, y: c.y, width: 35, height: 25,
      attackTimer: 0, attacking: false, alive: true
    }));
    
    // Vultures (flying hazards)
    const vultures = [
      { x: 600, y: 100, range: 80 }, { x: 1400, y: 80, range: 100 },
      { x: 2200, y: 120, range: 80 }, { x: 3000, y: 100, range: 100 },
      { x: 3800, y: 80, range: 80 }
    ];
    
    this.gameState.vultures = vultures.map(v => ({
      x: v.x, y: v.y, width: 35, height: 25,
      startX: v.x, startY: v.y, range: v.range,
      speed: 2.5, direction: 1, dive: false,
      animTimer: 0, alive: true
    }));
    
    // Sandstorm
    this.gameState.sandstorm = {
      x: 2000, y: this.canvas.height / 2,
      width: 300, strength: 0,
      active: false, direction: 1
    };
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
      color: '#F39C12',
      skinColor: '#D4A574',
      turbanColor: '#E74C3C',
      onGround: false,
      canDoubleJump: true,
      canDash: true,
      dashCooldownTimer: 0,
      isDashing: false,
      dashTimer: 0,
      gems: 0,
      hieroglyphsFound: 0,
      health: 100,
      maxHealth: 100,
      invincible: false,
      invincibleTimer: 0,
      facing: 1,
      state: 'idle',
      dashTrail: [],
      heatLevel: 0
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
    this.updateGems(player, deltaTime);
    this.updateOases(player, deltaTime);
    this.updateHieroglyphs(player);
    this.updateEnemies(player, deltaTime);
    this.updateSandstorm(deltaTime, player);
    this.updateChests(player);
    this.updateHeat(deltaTime, player);
    this.updateParticles(deltaTime);
    this.checkTemple(player);
    
    if (player.invincible) {
      player.invincibleTimer -= deltaTime;
      if (player.invincibleTimer <= 0) {
        player.invincible = false;
      }
    }
    
    if (player.dashCooldownTimer > 0) {
      player.dashCooldownTimer -= deltaTime;
    }
    
    if (player.dashTimer > 0) {
      player.dashTimer -= deltaTime;
      if (player.dashTimer <= 0) {
        player.isDashing = false;
      }
    }
    
    // Update dash trail
    if (player.isDashing) {
      player.dashTrail.unshift({ x: player.x + player.width / 2, y: player.y + player.height / 2 });
      if (player.dashTrail.length > 15) {
        player.dashTrail.pop();
      }
    }
    
    if (player.y > this.canvas.height + 100) {
      this.fallReset(player);
    }
  }
  
  handleInput(player) {
    const input = this.getPlayerInput(player.name);
    
    if (input.left) {
      player.vx = player.isDashing ? player.facing * player.dashSpeed : -this.config.moveSpeed;
      player.facing = -1;
      player.state = 'running';
    } else if (input.right) {
      player.vx = player.isDashing ? player.facing * player.dashSpeed : this.config.moveSpeed;
      player.facing = 1;
      player.state = 'running';
    } else {
      if (!player.isDashing) {
        player.vx = 0;
      }
      player.state = player.onGround ? 'idle' : 'jumping';
    }
    
    if (input.up) {
      if (player.onGround) {
        player.vy = this.config.jumpForce;
        player.onGround = false;
        player.canDoubleJump = true;
        this.createJumpParticles(player);
      } else if (player.canDoubleJump && this.config.doubleJump) {
        player.vy = this.config.jumpForce * 0.75;
        player.canDoubleJump = false;
        this.createJumpParticles(player);
      }
    }
    
    if (input.action && player.canDash && player.dashCooldownTimer <= 0 && (input.left || input.right)) {
      player.isDashing = true;
      player.dashTimer = 0.3;
      player.canDash = false;
      player.dashCooldownTimer = this.config.dashCooldown;
      player.vx = player.facing * this.config.dashSpeed;
      player.vy = 0;
      this.createDashParticles(player);
    }
  }
  
  getPlayerInput(playerName) {
    const inputs = window.gameInputs || {};
    return inputs[playerName] || this.inputState;
  }
  
  applyPhysics(player, deltaTime) {
    if (!player.isDashing) {
      player.vy += this.config.gravity;
    }
    player.vy = Math.min(player.vy, 15);
    player.x += player.vx;
    player.y += player.vy;
    player.onGround = false;
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
  
  updateGems(player, deltaTime) {
    this.gameState.gems.forEach(gem => {
      if (gem.collected) return;
      
      gem.rotation += deltaTime * 2;
      
      const dx = (player.x + player.width / 2) - gem.x;
      const dy = (player.y + player.height / 2) - gem.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 35) {
        gem.collected = true;
        player.gems++;
        this.gameState.score += 25;
        this.createGemParticles(gem.x, gem.y, gem.type);
      }
    });
  }
  
  updateOases(player, deltaTime) {
    this.gameState.oases.forEach(oasis => {
      oasis.wave += deltaTime * 2;
      oasis.shimmer += deltaTime * 3;
      
      const dx = (player.x + player.width / 2) - (oasis.x + oasis.width / 2);
      const dy = (player.y + player.height / 2) - (oasis.y + oasis.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < oasis.width) {
        player.health = Math.min(player.maxHealth, player.health + 0.5);
        player.heatLevel = Math.max(0, player.heatLevel - 1);
      }
    });
  }
  
  updateHieroglyphs(player) {
    this.gameState.hieroglyphs.forEach(h => {
      if (h.collected) return;
      
      const dx = (player.x + player.width / 2) - h.x;
      const dy = (player.y + player.height / 2) - h.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 40) {
        h.collected = true;
        player.hieroglyphsFound++;
        this.gameState.score += 100;
        this.createSecretParticles(h.x, h.y);
      }
    });
  }
  
  updateEnemies(player, deltaTime) {
    // Scorpions
    this.gameState.scorpions.forEach(scorpion => {
      if (!scorpion.alive) return;
      
      scorpion.x += scorpion.speed * scorpion.direction;
      scorpion.animTimer += deltaTime * 5;
      scorpion.tailAngle = Math.sin(scorpion.animTimer) * 0.5;
      
      if (scorpion.x > scorpion.startX + scorpion.range) {
        scorpion.direction = -1;
      } else if (scorpion.x < scorpion.startX - scorpion.range) {
        scorpion.direction = 1;
      }
      
      if (this.checkAABB(player, scorpion) && !player.invincible) {
        this.damagePlayer(player, 15);
      }
    });
    
    // Cobras
    this.gameState.cobras.forEach(cobra => {
      if (!cobra.alive) return;
      
      cobra.attackTimer += deltaTime;
      
      if (cobra.attackTimer > 3) {
        cobra.attackTimer = 0;
        cobra.attacking = true;
        
        if (this.checkAABB(player, { x: cobra.x - 20, y: cobra.y, width: cobra.width + 40, height: cobra.height })) {
          this.damagePlayer(player, 25);
        }
      }
      
      if (cobra.attacking && cobra.attackTimer < 1) {
        cobra.attacking = false;
      }
    });
    
    // Vultures
    this.gameState.vultures.forEach(vulture => {
      if (!vulture.alive) return;
      
      vulture.animTimer += deltaTime * 3;
      
      if (!vulture.dive) {
        vulture.x += vulture.speed * vulture.direction;
        if (vulture.x > vulture.startX + vulture.range) {
          vulture.direction = -1;
        } else if (vulture.x < vulture.startX - vulture.range) {
          vulture.direction = 1;
        }
        
        // Dive attack
        if (player.x > vulture.x - 100 && player.x < vulture.x + 100) {
          vulture.dive = true;
        }
      } else {
        const toPlayer = Math.atan2(player.y - vulture.y, player.x - vulture.x);
        vulture.x += Math.cos(toPlayer) * 5;
        vulture.y += Math.sin(toPlayer) * 5;
        
        if (this.checkAABB(player, vulture)) {
          this.damagePlayer(player, 20);
          vulture.dive = false;
          vulture.x = vulture.startX;
          vulture.y = vulture.startY;
        }
        
        if (Math.abs(player.x - vulture.x) < 20 && Math.abs(player.y - vulture.y) < 20) {
          vulture.dive = false;
          vulture.x = vulture.startX;
          vulture.y = vulture.startY;
        }
      }
    });
  }
  
  updateSandstorm(deltaTime, player) {
    const sandstorm = this.gameState.sandstorm;
    if (!sandstorm.active) {
      if (Math.random() < 0.002) {
        sandstorm.active = true;
        sandstorm.x = this.camera.x + this.canvas.width + 50;
      }
    } else {
      sandstorm.x -= sandstorm.direction * 200 * deltaTime;
      
      if (sandstorm.x < this.camera.x - sandstorm.width) {
        sandstorm.active = false;
      }
      
      // Push player
      if (player.y > this.canvas.height - 150) {
        player.x -= sandstorm.direction * 3;
      }
    }
  }
  
  updateChests(player) {
    this.gameState.treasureChests.forEach(chest => {
      if (chest.opened) return;
      
      const dx = (player.x + player.width / 2) - (chest.x + 30);
      const dy = (player.y + player.height / 2) - chest.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 50) {
        chest.opened = true;
        player.gems += 3;
        this.gameState.score += 200;
        this.createChestParticles(chest.x + 30, chest.y);
      }
    });
  }
  
  updateHeat(deltaTime, player) {
    if (player.y > this.canvas.height - 200 && !player.invincible && player.heatLevel < 100) {
      player.heatLevel += deltaTime * 5;
    }
    
    if (player.heatLevel > 80) {
      player.health -= deltaTime * 3;
    }
  }
  
  checkTemple(player) {
    const temple = this.gameState.temples[0];
    if (!temple.open && this.checkAABB(player, temple)) {
      if (player.gems >= 5) {
        temple.open = true;
        this.gameState.score += 500;
      }
    }
  }
  
  damagePlayer(player, damage) {
    player.health -= damage;
    player.invincible = true;
    player.invincibleTimer = 1;
  }
  
  fallReset(player) {
    player.health -= 20;
    player.x = 100;
    player.y = this.canvas.height - 120;
    player.vx = 0;
    player.vy = 0;
  }
  
  createJumpParticles(player) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: player.x + player.width / 2,
        y: player.y + player.height,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * -3,
        life: 0.4,
        color: '#D4A574',
        size: 4
      });
    }
  }
  
  createDashParticles(player) {
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        vx: -player.facing * (3 + Math.random() * 3),
        vy: (Math.random() - 0.5) * 3,
        life: 0.3,
        color: '#F39C12',
        size: 3
      });
    }
  }
  
  createGemParticles(x, y, type) {
    const colors = { ruby: '#E74C3C', topaz: '#F39C12', emerald: '#2ECC71' };
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 0.7,
        color: colors[type],
        size: 4
      });
    }
  }
  
  createSecretParticles(x, y) {
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1,
        color: '#9B59B6',
        size: 5
      });
    }
    this.gameState.time += 0.5;
  }
  
  createChestParticles(x, y) {
    const colors = ['#F1C40F', '#E74C3C', '#9B59B6'];
    for (let i = 0; i < 25; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 5,
        life: 1,
        color: colors[i % colors.length],
        size: 5
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
    // Sky (desert heat)
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    skyGrad.addColorStop(0, '#FF8C00');
    skyGrad.addColorStop(0.3, '#FFA500');
    skyGrad.addColorStop(0.6, '#FFD700');
    skyGrad.addColorStop(1, '#F4D03F');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Heat shimmer effect
    this.heatWave += 0.05;
    
    this.ctx.save();
    this.ctx.translate(-this.camera.x, 0);
    
    this.drawDunes();
    this.drawPlatforms();
    this.drawOases();
    this.drawTemples();
    this.drawHieroglyphs();
    this.drawGems();
    this.drawChests();
    this.drawEnemies();
    this.drawSandstorm();
    this.drawPlayer();
    this.drawParticles();
    
    this.ctx.restore();
    
    this.drawUI();
  }
  
  drawDunes() {
    this.gameState.dunes.forEach(dune => {
      this.ctx.fillStyle = '#D4A574';
      this.ctx.beginPath();
      this.ctx.ellipse(dune.x + dune.w / 2, dune.y + dune.h, dune.w / 2, dune.h, 0, Math.PI, 0);
      this.ctx.fill();
    });
  }
  
  drawPlatforms() {
    this.gameState.platforms.forEach(platform => {
      if (platform.type === 'sand') {
        const grad = this.ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
        grad.addColorStop(0, '#E6B89C');
        grad.addColorStop(0.3, '#D4A574');
        grad.addColorStop(1, '#B8956A');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        this.ctx.fillStyle = '#F5CBA7';
        this.ctx.fillRect(platform.x, platform.y, platform.width, 8);
      } else if (platform.type === 'stone') {
        this.ctx.fillStyle = '#C4A484';
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        this.ctx.strokeStyle = '#A08563';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
      } else if (platform.type === 'brick') {
        this.ctx.fillStyle = '#B5651D';
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        this.ctx.fillStyle = '#8B4513';
        for (let i = 0; i < platform.width; i += 20) {
          this.ctx.fillRect(platform.x + i, platform.y + 10, 2, platform.height - 10);
        }
      }
    });
  }
  
  drawOases() {
    this.gameState.oases.forEach(oasis => {
      const wave = Math.sin(oasis.wave) * 3;
      
      // Water
      this.ctx.fillStyle = '#1E90FF';
      this.ctx.fillRect(oasis.x, oasis.y, oasis.width, oasis.height);
      
      // Ripples
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(oasis.shimmer) * 0.2})`;
      this.ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        this.ctx.beginPath();
        this.ctx.ellipse(oasis.x + oasis.width / 2, oasis.y + oasis.height / 2,
                        10 + i * 15, 5 + i * 8 + wave, 0, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      
      // Palm trees
      this.ctx.fillStyle = '#228B22';
      this.ctx.fillRect(oasis.x + 20, oasis.y - 40, 8, 45);
      this.ctx.beginPath();
      this.ctx.arc(oasis.x + 24, oasis.y - 40, 20, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawTemples() {
    const temple = this.gameState.temples[0];
    
    // Structure
    this.ctx.fillStyle = '#C4A484';
    this.ctx.fillRect(temple.x, temple.y, temple.width, temple.height);
    
    // Columns
    this.ctx.fillStyle = '#D4A574';
    this.ctx.fillRect(temple.x + 5, temple.y + 10, 10, temple.height - 10);
    this.ctx.fillRect(temple.x + temple.width - 15, temple.y + 10, 10, temple.height - 10);
    
    // Entrance glow
    if (temple.open) {
      this.ctx.fillStyle = 'rgba(241, 196, 15, 0.7)';
      this.ctx.fillRect(temple.x + 25, temple.y + 30, 30, 60);
    }
  }
  
  drawHieroglyphs() {
    this.gameState.hieroglyphs.forEach(h => {
      if (h.collected) return;
      
      const glow = (Math.sin(this.gameState.time * 3) + 1) / 2;
      this.ctx.fillStyle = `rgba(155, 89, 182, ${0.5 + glow * 0.5})`;
      this.ctx.font = 'bold 30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('?', h.x, h.y);
    });
  }
  
  drawGems() {
    this.gameState.gems.forEach(gem => {
      if (gem.collected) return;
      
      const colors = { ruby: '#E74C3C', topaz: '#F39C12', emerald: '#2ECC71' };
      
      this.ctx.save();
      this.ctx.translate(gem.x, gem.y);
      this.ctx.rotate(gem.rotation);
      
      this.ctx.fillStyle = colors[gem.type];
      this.ctx.beginPath();
      this.ctx.moveTo(0, -gem.radius);
      this.ctx.lineTo(gem.radius, 0);
      this.ctx.lineTo(0, gem.radius);
      this.ctx.lineTo(-gem.radius, 0);
      this.ctx.closePath();
      this.ctx.fill();
      
      this.ctx.strokeStyle = '#FFF';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      this.ctx.restore();
    });
  }
  
  drawChests() {
    this.gameState.treasureChests.forEach(chest => {
      this.ctx.fillStyle = '#8B4513';
      this.ctx.fillRect(chest.x, chest.y, 60, 40);
      
      this.ctx.fillStyle = '#D4A574';
      this.ctx.fillRect(chest.x + 25, chest.y + 15, 10, 10);
      
      if (chest.opened) {
        this.ctx.fillStyle = '#F1C40F';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText('$', chest.x + 30, chest.y - 10);
      }
    });
  }
  
  drawEnemies() {
    // Scorpions
    this.gameState.scorpions.forEach(scorpion => {
      if (!scorpion.alive) return;
      
      this.ctx.save();
      this.ctx.translate(scorpion.x + scorpion.width / 2, scorpion.y + scorpion.height / 2);
      
      if (scorpion.direction < 0) this.ctx.scale(-1, 1);
      
      // Body
      this.ctx.fillStyle = '#8B0000';
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, scorpion.width / 2, scorpion.height / 2 - 5, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Tail
      this.ctx.beginPath();
      this.ctx.moveTo(-scorpion.width / 2 + 5, 0);
      this.ctx.quadraticCurveTo(-scorpion.width, -15, -scorpion.width - 10, -20 + scorpion.tailAngle * 20);
      this.ctx.lineTo(-scorpion.width - 5, -20 + scorpion.tailAngle * 20);
      this.ctx.lineWidth = 4;
      this.ctx.strokeStyle = '#8B0000';
      this.ctx.stroke();
      
      // Stinger
      this.ctx.fillStyle = '#FF0000';
      this.ctx.beginPath();
      this.ctx.moveTo(-scorpion.width - 10, -20 + scorpion.tailAngle * 20);
      this.ctx.lineTo(-scorpion.width - 20, -25 + scorpion.tailAngle * 20);
      this.ctx.lineTo(-scorpion.width - 5, -15 + scorpion.tailAngle * 20);
      this.ctx.fill();
      
      // Claws
      this.ctx.fillStyle = '#8B0000';
      this.ctx.fillRect(scorpion.width / 2, -5, 10, 8);
      this.ctx.fillRect(scorpion.width / 2 + 5, -10, 8, 10);
      
      this.ctx.restore();
    });
    
    // Cobras
    this.gameState.cobras.forEach(cobra => {
      if (!cobra.alive) return;
      
      this.ctx.fillStyle = cobra.attacking ? '#FF0000' : '#1E90FF';
      this.ctx.beginPath();
      this.ctx.ellipse(cobra.x + cobra.width / 2, cobra.y + cobra.height - 10,
                      cobra.width / 2, 10, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Hood
      this.ctx.fillStyle = '#1E90FF';
      this.ctx.beginPath();
      this.ctx.ellipse(cobra.x + cobra.width / 2, cobra.y + 10, cobra.width / 2, 12, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Eyes
      this.ctx.fillStyle = '#F1C40F';
      this.ctx.beginPath();
      this.ctx.arc(cobra.x + 10, cobra.y + 8, 3, 0, Math.PI * 2);
      this.ctx.arc(cobra.x + cobra.width - 10, cobra.y + 8, 3, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Fangs when attacking
      if (cobra.attacking) {
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.moveTo(cobra.x + cobra.width / 2 - 5, cobra.y + 20);
        this.ctx.lineTo(cobra.x + cobra.width / 2 - 2, cobra.y + 30);
        this.ctx.lineTo(cobra.x + cobra.width / 2 + 5, cobra.y + 20);
        this.ctx.fill();
      }
    });
    
    // Vultures
    this.gameState.vultures.forEach(vulture => {
      if (!vulture.alive) return;
      
      const wingAngle = Math.sin(vulture.animTimer) * 0.7;
      
      this.ctx.save();
      this.ctx.translate(vulture.x + vulture.width / 2, vulture.y + vulture.height / 2);
      
      if (vulture.direction < 0) this.ctx.scale(-1, 1);
      
      // Body
      this.ctx.fillStyle = '#4A4A4A';
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, 15, 12, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Wings
      this.ctx.fillStyle = '#2F2F2F';
      this.ctx.save();
      this.ctx.rotate(wingAngle);
      this.ctx.fillRect(-15, -8, 8, 5);
      this.ctx.fillRect(7, -8, 8, 5);
      this.ctx.restore();
      
      // Head
      this.ctx.fillStyle = '#696969';
      this.ctx.beginPath();
      this.ctx.arc(12, -5, 6, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Beak
      this.ctx.fillStyle = '#F1C40F';
      this.ctx.beginPath();
      this.ctx.moveTo(16, -5);
      this.ctx.lineTo(22, -3);
      this.ctx.lineTo(16, -1);
      this.ctx.fill();
      
      this.ctx.restore();
    });
  }
  
  drawSandstorm() {
    const sandstorm = this.gameState.sandstorm;
    if (!sandstorm.active) return;
    
    this.ctx.fillStyle = 'rgba(210, 180, 140, 0.6)';
    this.ctx.fillRect(sandstorm.x, 0, sandstorm.width, this.canvas.height);
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
    
    // Dash trail
    player.dashTrail.forEach((pos, i) => {
      this.ctx.globalAlpha = (1 - i / player.dashTrail.length) * 0.5;
      this.ctx.fillStyle = '#F39C12';
      this.ctx.beginPath();
      this.ctx.arc(pos.x - player.x - player.width / 2, pos.y - player.y - player.height / 2, 5 - i * 0.3, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
    
    // Body
    this.ctx.fillStyle = player.color;
    this.ctx.fillRect(-player.width / 2, -player.height / 2 + 12, player.width, player.height - 12);
    
    // Vest
    this.ctx.fillStyle = '#E74C3C';
    this.ctx.fillRect(-player.width / 2 + 4, -player.height / 2 + 12, player.width - 8, 20);
    
    // Turban
    this.ctx.fillStyle = player.turbanColor;
    this.ctx.fillRect(-player.width / 2 - 2, -player.height / 2 - 5, player.width + 4, 12);
    
    // Head
    this.ctx.fillStyle = player.skinColor;
    this.ctx.fillRect(-player.width / 2 + 4, -player.height / 2 + 2, player.width - 8, 15);
    
    // Eyes
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(-4, -player.height / 2 + 7, 3, 3);
    this.ctx.fillRect(3, -player.height / 2 + 7, 3, 3);
    
    // Legs
    if (player.state === 'running') {
      const legAnim = Math.sin(this.gameState.time * 15) * 8;
      this.ctx.fillStyle = '#8B4513';
      this.ctx.fillRect(-8, player.height / 2 - 12, 6, 12 + legAnim);
      this.ctx.fillRect(2, player.height / 2 - 12, 6, 12 - legAnim);
    } else {
      this.ctx.fillStyle = '#8B4513';
      this.ctx.fillRect(-8, player.height / 2 - 12, 6, 12);
      this.ctx.fillRect(2, player.height / 2 - 12, 6, 12);
    }
    
    // Scimitar (cosmetic)
    this.ctx.fillStyle = '#C0C0C0';
    this.ctx.fillRect(player.width / 2 + 2, 0, 3, 20);
    
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
    this.ctx.fillStyle = '#F1C40F';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 25, 40);
    
    // Gems
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(15, 75, 130, 30);
    this.ctx.fillStyle = '#E74C3C';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.fillText(`Gems: ${player.gems}`, 25, 95);
    
    // Hieroglyphs
    if (player.hieroglyphsFound > 0) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(155, 75, 100, 30);
      this.ctx.fillStyle = '#9B59B6';
      this.ctx.fillText(`Secrets: ${player.hieroglyphsFound}`, 165, 95);
    }
    
    // Dash cooldown
    if (!player.canDash) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(15, 115, 80, 25);
      this.ctx.fillStyle = '#3498DB';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.fillText(`DASH: ${Math.ceil(player.dashCooldownTimer)}s`, 25, 132);
    }
    
    // Health
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(15, 150, 180, 25);
    this.ctx.fillStyle = '#C0392B';
    this.ctx.fillRect(17, 152, 176, 21);
    this.ctx.fillStyle = '#27AE60';
    this.ctx.fillRect(17, 152, 176 * (player.health / player.maxHealth), 21);
    
    // Heat bar
    if (player.heatLevel > 0) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(15, 185, 180, 25);
      this.ctx.fillStyle = '#E67E22';
      this.ctx.fillRect(17, 187, 176, 21);
      this.ctx.fillStyle = '#F39C12';
      this.ctx.fillRect(17, 187, 176 * (player.heatLevel / 100), 21);
      this.ctx.fillStyle = '#FFF';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.fillText('HEAT', 25, 203);
    }
  }
  
  updatePlayerInput(playerName, input) {
    window.gameInputs = window.gameInputs || {};
    window.gameInputs[playerName] = input;
  }
}

window.DesertRunner = DesertRunner;