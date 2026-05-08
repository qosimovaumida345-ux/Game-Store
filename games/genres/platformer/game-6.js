// Cave Explorer - Underground Adventure Platformer
class CaveExplorer {
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
      jumpForce: -13,
      doubleJump: true,
      moveSpeed: 4,
      torchRadius: 100,
      levelWidth: 3800,
      levelHeight: 700,
      cameraSpeed: 0.08
    };
    
    this.gameState = {
      players: {},
      time: 0,
      level: 1,
      score: 0,
      status: 'playing',
      platforms: [],
      stalactites: [],
      stalagmites: [],
      crystals: [],
      gems: [],
      bats: [],
      spiders: [],
      skeletons: [],
      treasure: [],
      torches: [],
      water: null,
      lava: null,
      darkness: 0.7
    };
    
    this.player = null;
    this.camera = { x: 0, y: 0 };
    this.particles = [];
    this.inputState = {};
    this.torchFlicker = 0;
    
    this.generateLevel();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  generateLevel() {
    this.gameState.platforms = [];
    this.gameState.stalactites = [];
    this.gameState.stalagmites = [];
    this.gameState.crystals = [];
    this.gameState.gems = [];
    this.gameState.bats = [];
    this.gameState.spiders = [];
    this.gameState.skeletons = [];
    this.gameState.treasure = [];
    this.gameState.torches = [];
    
    // Ground
    const grounds = [
      { x: 0, y: this.canvas.height - 50, w: 500, h: 50 },
      { x: 600, y: this.canvas.height - 70, w: 450, h: 70 },
      { x: 1150, y: this.canvas.height - 50, w: 500, h: 50 },
      { x: 1750, y: this.canvas.height - 90, w: 550, h: 90 },
      { x: 2400, y: this.canvas.height - 50, w: 500, h: 50 },
      { x: 3000, y: this.canvas.height - 70, w: 450, h: 70 },
      { x: 3550, y: this.canvas.height - 50, w: 250, h: 50 }
    ];
    
    grounds.forEach(g => {
      this.gameState.platforms.push({
        x: g.x, y: g.y, width: g.w, height: g.h, type: 'rock'
      });
    });
    
    // Floating platforms
    const platforms = [
      { x: 150, y: this.canvas.height - 140, w: 100, h: 20 },
      { x: 350, y: this.canvas.height - 200, w: 80, h: 20 },
      { x: 550, y: this.canvas.height - 260, w: 120, h: 20 },
      { x: 750, y: this.canvas.height - 160, w: 80, h: 20 },
      { x: 950, y: this.canvas.height - 300, w: 100, h: 20 },
      { x: 1200, y: this.canvas.height - 220, w: 120, h: 20 },
      { x: 1400, y: this.canvas.height - 160, w: 80, h: 20 },
      { x: 1600, y: this.canvas.height - 320, w: 100, h: 20 },
      { x: 1850, y: this.canvas.height - 260, w: 80, h: 20 },
      { x: 2050, y: this.canvas.height - 360, w: 120, h: 20 },
      { x: 2300, y: this.canvas.height - 300, w: 100, h: 20 },
      { x: 2550, y: this.canvas.height - 220, w: 80, h: 20 },
      { x: 2750, y: this.canvas.height - 360, w: 120, h: 20 },
      { x: 3000, y: this.canvas.height - 160, w: 100, h: 20 },
      { x: 3200, y: this.canvas.height - 300, w: 80, h: 20 },
      { x: 3400, y: this.canvas.height - 220, w: 120, h: 20 },
      { x: 3650, y: this.canvas.height - 320, w: 100, h: 20 }
    ];
    
    platforms.forEach(p => {
      this.gameState.platforms.push({
        x: p.x, y: p.y, width: p.w, height: p.h, type: 'stone'
      });
    });
    
    // Stalactites (hanging hazards)
    for (let i = 0; i < 30; i++) {
      this.gameState.stalactites.push({
        x: 100 + Math.random() * (this.config.levelWidth - 200),
        y: 0,
        length: 30 + Math.random() * 50,
        width: 8 + Math.random() * 8,
        active: true
      });
    }
    
    // Stalagmites (floor hazards)
    for (let i = 0; i < 25; i++) {
      this.gameState.stalagmites.push({
        x: 100 + Math.random() * (this.config.levelWidth - 200),
        y: this.canvas.height - 50 + Math.random() * 30,
        length: 20 + Math.random() * 30,
        width: 6 + Math.random() * 6,
        active: true
      });
    }
    
    // Crystals (light sources)
    const crystalData = [
      { x: 400, y: this.canvas.height - 100, color: '#00FFFF' },
      { x: 1200, y: this.canvas.height - 120, color: '#FF00FF' },
      { x: 2000, y: this.canvas.height - 140, color: '#00FF00' },
      { x: 2800, y: this.canvas.height - 100, color: '#FFFF00' }
    ];
    
    this.gameState.crystals = crystalData.map(c => ({
      x: c.x, y: c.y, radius: 15, color: c.color, glow: 0.5
    }));
    
    // Gems (collectibles)
    const gemPositions = [
      { x: 200, y: this.canvas.height - 190, type: 'diamond' },
      { x: 380, y: this.canvas.height - 250, type: 'emerald' },
      { x: 580, y: this.canvas.height - 310, type: 'diamond' },
      { x: 780, y: this.canvas.height - 210, type: 'emerald' },
      { x: 980, y: this.canvas.height - 350, type: 'diamond' },
      { x: 1230, y: this.canvas.height - 270, type: 'diamond' },
      { x: 1430, y: this.canvas.height - 210, type: 'emerald' },
      { x: 1630, y: this.canvas.height - 370, type: 'diamond' },
      { x: 1880, y: this.canvas.height - 310, type: 'emerald' },
      { x: 2080, y: this.canvas.height - 410, type: 'diamond' },
      { x: 2330, y: this.canvas.height - 350, type: 'diamond' },
      { x: 2580, y: this.canvas.height - 270, type: 'emerald' },
      { x: 2780, y: this.canvas.height - 410, type: 'diamond' },
      { x: 3030, y: this.canvas.height - 210, type: 'emerald' },
      { x: 3230, y: this.canvas.height - 350, type: 'diamond' },
      { x: 3430, y: this.canvas.height - 270, type: 'emerald' },
      { x: 3680, y: this.canvas.height - 370, type: 'diamond' }
    ];
    
    this.gameState.gems = gemPositions.map(g => ({
      x: g.x, y: g.y, radius: 10, type: g.type, collected: false, rotation: 0
    }));
    
    // Torches
    const torchPositions = [
      { x: 300, y: this.canvas.height - 80 },
      { x: 900, y: this.canvas.height - 100 },
      { x: 1600, y: this.canvas.height - 120 },
      { x: 2300, y: this.canvas.height - 80 },
      { x: 3100, y: this.canvas.height - 100 }
    ];
    
    this.gameState.torches = torchPositions.map(t => ({
      x: t.x, y: t.y, radius: 60, flicker: 0
    }));
    
    // Bats (flying enemies)
    const batData = [
      { x: 500, y: 80 }, { x: 1300, y: 100 }, { x: 2100, y: 80 }, { x: 2900, y: 100 }
    ];
    
    this.gameState.bats = batData.map(b => ({
      x: b.x, y: b.y, width: 25, height: 20,
      startX: b.x, range: 100,
      speed: 3, direction: 1, animTimer: 0, alive: true
    }));
    
    // Spiders (ceiling enemies)
    const spiderData = [
      { x: 700, y: this.canvas.height - 320 },
      { x: 1500, y: this.canvas.height - 280 },
      { x: 2400, y: this.canvas.height - 350 },
      { x: 3200, y: this.canvas.height - 300 }
    ];
    
    this.gameState.spiders = spiderData.map(s => ({
      x: s.x, y: s.y, width: 30, height: 25,
      speed: 1.5, direction: 1,
      animTimer: 0, alive: true
    }));
    
    // Skeletons (ground enemies)
    const skeletonData = [
      { x: 400, y: this.canvas.height - 80, range: 100 },
      { x: 1400, y: this.canvas.height - 80, range: 120 },
      { x: 2500, y: this.canvas.height - 80, range: 80 },
      { x: 3400, y: this.canvas.height - 80, range: 100 }
    ];
    
    this.gameState.skeletons = skeletonData.map(s => ({
      x: s.x, y: s.y, width: 25, height: 40,
      startX: s.x, range: s.range,
      speed: 1, direction: 1, animTimer: 0, alive: true
    }));
    
    // Treasure chests
    this.gameState.treasure = [
      { x: 1800, y: this.canvas.height - 130, opened: false },
      { x: 3000, y: this.canvas.height - 110, opened: false }
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
      width: 25,
      height: 40,
      color: '#7F8C8D',
      skinColor: '#D5C4A7',
      helmet: true,
      lightRadius: 80,
      onGround: false,
      canDoubleJump: true,
      gems: 0,
      health: 100,
      maxHealth: 100,
      invincible: false,
      invincibleTimer: 0,
      facing: 1,
      state: 'idle'
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
    this.updateTorches(player);
    this.updateCrystals();
    this.updateEnemies(player, deltaTime);
    this.updateStalactites(player, deltaTime);
    this.checkTreasure(player);
    this.updateParticles(deltaTime);
    
    if (player.invincible) {
      player.invincibleTimer -= deltaTime;
      if (player.invincibleTimer <= 0) {
        player.invincible = false;
      }
    }
    
    // Update light radius based on crystals
    if (player.gems >= 3) {
      player.lightRadius = Math.min(150, 80 + player.gems * 20);
    }
    
    if (player.y > this.canvas.height + 100) {
      this.fallReset(player);
    }
  }
  
  handleInput(player) {
    const input = this.getPlayerInput(player.name);
    
    if (input.left) {
      player.vx = -this.config.moveSpeed;
      player.facing = -1;
      player.state = 'running';
    } else if (input.right) {
      player.vx = this.config.moveSpeed;
      player.facing = 1;
      player.state = 'running';
    } else {
      player.vx = 0;
      player.state = player.onGround ? 'idle' : 'jumping';
    }
    
    if (input.up && player.onGround) {
      player.vy = this.config.jumpForce;
      player.onGround = false;
      player.canDoubleJump = true;
      this.createDustParticles(player);
    } else if (input.up && !player.onGround && player.canDoubleJump && this.config.doubleJump) {
      player.vy = this.config.jumpForce * 0.75;
      player.canDoubleJump = false;
      this.createDustParticles(player);
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
      
      if (dist < player.lightRadius + 20) {
        gem.collected = true;
        player.gems++;
        this.gameState.score += 50;
        this.createGemParticles(gem.x, gem.y, gem.type);
      }
    });
  }
  
  updateTorches(player) {
    this.torchFlicker = Math.sin(this.gameState.time * 10) * 5;
    
    this.gameState.torches.forEach(torch => {
      torch.flicker = 5 + Math.sin(this.gameState.time * 8 + torch.x) * 3;
    });
  }
  
  updateCrystals() {
    this.gameState.crystals.forEach(crystal => {
      crystal.glow = 0.5 + Math.sin(this.gameState.time * 3) * 0.3;
    });
  }
  
  updateEnemies(player, deltaTime) {
    // Bats
    this.gameState.bats.forEach(bat => {
      if (!bat.alive) return;
      
      bat.x += bat.speed * bat.direction;
      bat.animTimer += deltaTime * 8;
      
      if (bat.x > bat.startX + bat.range) {
        bat.direction = -1;
      } else if (bat.x < bat.startX - bat.range) {
        bat.direction = 1;
      }
      
      if (this.checkAABB(player, bat) && !player.invincible) {
        this.takeDamage(player, 20);
      }
    });
    
    // Spiders
    this.gameState.spiders.forEach(spider => {
      if (!spider.alive) return;
      
      spider.animTimer += deltaTime * 5;
      
      if (this.checkAABB(player, spider) && !player.invincible) {
        this.takeDamage(player, 15);
      }
    });
    
    // Skeletons
    this.gameState.skeletons.forEach(skeleton => {
      if (!skeleton.alive) return;
      
      skeleton.x += skeleton.speed * skeleton.direction;
      skeleton.animTimer += deltaTime * 3;
      
      if (skeleton.x > skeleton.startX + skeleton.range) {
        skeleton.direction = -1;
      } else if (skeleton.x < skeleton.startX - skeleton.range) {
        skeleton.direction = 1;
      }
      
      if (this.checkAABB(player, skeleton) && !player.invincible) {
        this.takeDamage(player, 25);
      }
    });
  }
  
  updateStalactites(player, deltaTime) {
    this.gameState.stalactites.forEach(stalactite => {
      if (!stalactite.active) return;
      
      if (this.checkAABB(player, {
        x: stalactite.x - stalactite.width / 2,
        y: stalactite.y,
        width: stalactite.width,
        height: stalactite.length
      })) {
        this.takeDamage(player, 20);
      }
    });
  }
  
  checkTreasure(player) {
    this.gameState.treasure.forEach(chest => {
      if (chest.opened) return;
      
      const dx = (player.x + player.width / 2) - (chest.x + 20);
      const dy = (player.y + player.height / 2) - chest.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 50) {
        chest.opened = true;
        player.gems += 5;
        this.gameState.score += 300;
        this.createTreasureParticles(chest.x + 20, chest.y);
      }
    });
  }
  
  takeDamage(player, damage) {
    player.health -= damage;
    player.invincible = true;
    player.invincibleTimer = 1;
  }
  
  fallReset(player) {
    player.health -= 25;
    player.x = 80;
    player.y = this.canvas.height - 100;
    player.vx = 0;
    player.vy = 0;
    player.invincible = true;
    player.invincibleTimer = 2;
  }
  
  createDustParticles(player) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: player.x + player.width / 2,
        y: player.y + player.height,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * -2,
        life: 0.4,
        color: '#4A4A4A',
        size: 3
      });
    }
  }
  
  createGemParticles(x, y, type) {
    const color = type === 'diamond' ? '#00FFFF' : '#2ECC71';
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 0.7,
        color: color,
        size: 4
      });
    }
  }
  
  createTreasureParticles(x, y) {
    const colors = ['#FFD700', '#C0C0C0', '#CD7F32'];
    for (let i = 0; i < 25; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 5,
        life: 1,
        color: colors[i % colors.length],
        size: 6
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
    // Cave background
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.save();
    this.ctx.translate(-this.camera.x, 0);
    
    this.drawPlatforms();
    this.drawStalactites();
    this.drawStalagmites();
    this.drawTorches();
    this.drawCrystals();
    this.drawGems();
    this.drawTreasure();
    this.drawEnemies();
    this.drawPlayer();
    this.drawParticles();
    
    this.ctx.restore();
    
    // Darkness overlay
    this.renderDarkness();
    
    this.drawUI();
  }
  
  drawPlatforms() {
    this.gameState.platforms.forEach(platform => {
      if (platform.type === 'rock') {
        const grad = this.ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
        grad.addColorStop(0, '#4a4a4a');
        grad.addColorStop(0.5, '#3a3a3a');
        grad.addColorStop(1, '#2a2a2a');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      } else if (platform.type === 'stone') {
        this.ctx.fillStyle = '#555555';
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Texture dots
        for (let i = 0; i < platform.width; i += 20) {
          for (let j = 0; j < platform.height; j += 20) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
            this.ctx.fillRect(platform.x + i + 5, platform.y + j + 5, 3, 3);
          }
        }
      }
    });
  }
  
  drawStalactites() {
    this.gameState.stalactites.forEach(s => {
      this.ctx.fillStyle = '#666666';
      this.ctx.beginPath();
      this.ctx.moveTo(s.x, s.y);
      this.ctx.lineTo(s.x - s.width / 2, s.y + s.length);
      this.ctx.lineTo(s.x + s.width / 2, s.y + s.length);
      this.ctx.fill();
    });
  }
  
  drawStalagmites() {
    this.gameState.stalagmites.forEach(s => {
      this.ctx.fillStyle = '#555555';
      this.ctx.beginPath();
      this.ctx.moveTo(s.x, s.y);
      this.ctx.lineTo(s.x - s.width / 2, s.y - s.length);
      this.ctx.lineTo(s.x + s.width / 2, s.y - s.length);
      this.ctx.fill();
    });
  }
  
  drawTorches() {
    this.gameState.torches.forEach(torch => {
      const radius = torch.radius + torch.flicker;
      const gradient = this.ctx.createRadialGradient(torch.x, torch.y, 0, torch.x, torch.y, radius);
      gradient.addColorStop(0, 'rgba(255, 150, 50, 0.8)');
      gradient.addColorStop(0.5, 'rgba(255, 100, 50, 0.4)');
      gradient.addColorStop(1, 'rgba(255, 50, 50, 0)');
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(torch.x, torch.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawCrystals() {
    this.gameState.crystals.forEach(crystal => {
      this.ctx.save();
      this.ctx.translate(crystal.x, crystal.y);
      
      const glow = crystal.glow * 30;
      this.ctx.shadowColor = crystal.color;
      this.ctx.shadowBlur = glow;
      
      this.ctx.fillStyle = crystal.color;
      this.ctx.beginPath();
      this.ctx.moveTo(0, -crystal.radius);
      this.ctx.lineTo(crystal.radius, 0);
      this.ctx.lineTo(0, crystal.radius);
      this.ctx.lineTo(-crystal.radius, 0);
      this.ctx.closePath();
      this.ctx.fill();
      
      this.ctx.fillStyle = '#FFF';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, crystal.radius * 0.3, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.restore();
    });
  }
  
  drawGems() {
    this.gameState.gems.forEach(gem => {
      if (gem.collected) return;
      
      this.ctx.save();
      this.ctx.translate(gem.x, gem.y);
      this.ctx.rotate(gem.rotation);
      
      const color = gem.type === 'diamond' ? '#00FFFF' : '#2ECC71';
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.moveTo(0, -gem.radius);
      this.ctx.lineTo(gem.radius, 0);
      this.ctx.lineTo(0, gem.radius);
      this.ctx.lineTo(-gem.radius, 0);
      this.ctx.fill();
      
      this.ctx.restore();
    });
  }
  
  drawTreasure() {
    this.gameState.treasure.forEach(chest => {
      this.ctx.fillStyle = '#8B4513';
      this.ctx.fillRect(chest.x, chest.y, 40, 30);
      
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillRect(chest.x + 15, chest.y + 10, 10, 8);
      
      if (chest.opened) {
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText('$', chest.x + 20, chest.y - 10);
      }
    });
  }
  
  drawEnemies() {
    // Bats
    this.gameState.bats.forEach(bat => {
      if (!bat.alive) return;
      
      const wingAngle = Math.sin(bat.animTimer) * 0.8;
      
      this.ctx.save();
      this.ctx.translate(bat.x + bat.width / 2, bat.y + bat.height / 2);
      if (bat.direction < 0) this.ctx.scale(-1, 1);
      
      this.ctx.fillStyle = '#2c2c2c';
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, 12, 10, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.beginPath();
      this.ctx.moveTo(5, -5);
      this.ctx.lineTo(-15, -15 * wingAngle);
      this.ctx.lineTo(-5, 0);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.moveTo(-5, -5);
      this.ctx.lineTo(15, -15 * wingAngle);
      this.ctx.lineTo(5, 0);
      this.ctx.fill();
      
      this.ctx.restore();
    });
    
    // Spiders
    this.gameState.spiders.forEach(spider => {
      if (!spider.alive) return;
      
      this.ctx.save();
      this.ctx.translate(spider.x + spider.width / 2, spider.y + spider.height / 2);
      
      this.ctx.fillStyle = '#1a1a1a';
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, spider.width / 2, spider.height / 2, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Legs
      for (let i = 0; i < 4; i++) {
        this.ctx.fillRect(-spider.width / 2 - 10 + i * 8, -5, 12, 3);
        this.ctx.fillRect(spider.width / 2 - 10 + i * 8 - 8 * 3, -5, 12, 3);
      }
      
      this.ctx.fillStyle = '#FF0000';
      this.ctx.beginPath();
      this.ctx.arc(-5, -3, 2, 0, Math.PI * 2);
      this.ctx.arc(5, -3, 2, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.restore();
    });
    
    // Skeletons
    this.gameState.skeletons.forEach(skeleton => {
      if (!skeleton.alive) return;
      
      this.ctx.save();
      this.ctx.translate(skeleton.x + skeleton.width / 2, skeleton.y + skeleton.height / 2);
      if (skeleton.direction < 0) this.ctx.scale(-1, 1);
      
      this.ctx.fillStyle = '#ECF0F1';
      this.ctx.fillRect(-10, -15, 20, 25);
      this.ctx.fillRect(-3, 10, 6, 15);
      this.ctx.fillRect(-3, 10, 6, 15);
      
      // Eyes
      this.ctx.fillStyle = '#000';
      this.ctx.beginPath();
      this.ctx.arc(-5, -8, 3, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(2, -8, 3, 0, Math.PI * 2);
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
    
    // Armor
    this.ctx.fillStyle = player.color;
    this.ctx.fillRect(-player.width / 2, -player.height / 2 + 10, player.width, player.height - 10);
    
    // Helmet
    if (player.helmet) {
      this.ctx.fillStyle = '#95A5A6';
      this.ctx.beginPath();
      this.ctx.arc(0, -player.height / 2 + 8, 14, Math.PI, 0);
      this.ctx.fill();
    }
    
    // Face
    this.ctx.fillStyle = player.skinColor;
    this.ctx.fillRect(-player.width / 2 + 4, -player.height / 2 + 5, player.width - 8, 12);
    
    // Eyes
    this.ctx.fillStyle = '#FFF';
    this.ctx.beginPath();
    this.ctx.arc(-4, -player.height / 2 + 10, 2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(4, -player.height / 2 + 10, 2, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Legs
    if (player.state === 'running') {
      const legAnim = Math.sin(this.gameState.time * 15) * 6;
      this.ctx.fillStyle = '#5D6D7E';
      this.ctx.fillRect(-8, player.height / 2 - 15, 6, 10 + legAnim);
      this.ctx.fillRect(2, player.height / 2 - 15, 6, 10 - legAnim);
    } else {
      this.ctx.fillStyle = '#5D6D7E';
      this.ctx.fillRect(-8, player.height / 2 - 15, 6, 10);
      this.ctx.fillRect(2, player.height / 2 - 15, 6, 10);
    }
    
    // Pickaxe
    this.ctx.fillStyle = '#A0522D';
    this.ctx.fillRect(player.width / 2, -5, 3, 15);
    this.ctx.fillStyle = '#95A5A6';
    this.ctx.beginPath();
    this.ctx.arc(player.width / 2 + 3, -8, 5, 0, Math.PI);
    this.ctx.fill();
    
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
  
  renderDarkness() {
    const player = this.gameState.players[this.player];
    if (!player) return;
    
    // Create temporary canvas for darkness
    const centerX = player.x + player.width / 2 - this.camera.x;
    const centerY = player.y + player.height / 2;
    
    // Calculate overall light
    let totalRadius = player.lightRadius;
    
    this.gameState.crystals.forEach(crystal => {
      const dx = crystal.x - player.x;
      const dy = crystal.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200) {
        totalRadius += crystal.glow * 30;
      }
    });
    
    // Draw darkness with hole
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.arc(centerX, centerY, totalRadius, 0, Math.PI * 2, true);
    this.ctx.clip();
    
    this.ctx.fillStyle = `rgba(0, 0, 0, ${this.gameState.darkness})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }
  
  drawUI() {
    const player = this.gameState.players[this.player];
    if (!player) return;
    
    // Score
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(15, 15, 140, 50);
    this.ctx.fillStyle = '#F1C40F';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 25, 40);
    
    // Gems
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(15, 75, 130, 30);
    this.ctx.fillStyle = '#00FFFF';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.fillText(`Gems: ${player.gems}`, 25, 95);
    
    // Light radius
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(15, 115, 100, 25);
    this.ctx.fillStyle = '#F39C12';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.fillText(`Light: ${player.lightRadius}`, 25, 132);
    
    // Health
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(15, 150, 180, 25);
    this.ctx.fillStyle = '#C0392B';
    this.ctx.fillRect(17, 152, 176, 21);
    this.ctx.fillStyle = '#27AE60';
    this.ctx.fillRect(17, 152, 176 * (player.health / player.maxHealth), 21);
  }
  
  updatePlayerInput(playerName, input) {
    window.gameInputs = window.gameInputs || {};
    window.gameInputs[playerName] = input;
  }
}

window.CaveExplorer = CaveExplorer;