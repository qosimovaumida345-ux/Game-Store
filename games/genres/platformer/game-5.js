// Forest Quest - Woodland Adventure Platformer
class ForestQuest {
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
      moveSpeed: 5,
      wallJump: true,
      levelWidth: 4200,
      cameraSpeed: 0.1
    };
    
    this.gameState = {
      players: {},
      time: 0,
      level: 1,
      score: 0,
      status: 'playing',
      platforms: [],
      trees: [],
      bushes: [],
      mushrooms: [],
      flowers: [],
      nuts: [],
      squirrels: [],
      wolves: [],
      fairies: [],
      ancientTree: null,
      spiritOrbs: [],
      dayCycle: 0,
      isNight: false
    };
    
    this.player = null;
    this.camera = { x: 0, y: 0 };
    this.particles = [];
    this.inputState = {};
    this.wallJumpTimer = 0;
    this.wallSide = 0;
    
    this.generateLevel();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  generateLevel() {
    this.gameState.platforms = [];
    this.gameState.trees = [];
    this.gameState.bushes = [];
    this.gameState.mushrooms = [];
    this.gameState.flowers = [];
    this.gameState.nuts = [];
    this.gameState.squirrels = [];
    this.gameState.wolves = [];
    this.gameState.fairies = [];
    this.gameState.spiritOrbs = [];
    
    // Ground
    const grounds = [
      { x: 0, y: this.canvas.height - 60, w: 500, h: 60 },
      { x: 600, y: this.canvas.height - 80, w: 450, h: 80 },
      { x: 1150, y: this.canvas.height - 60, w: 500, h: 60 },
      { x: 1750, y: this.canvas.height - 100, w: 550, h: 100 },
      { x: 2400, y: this.canvas.height - 60, w: 500, h: 60 },
      { x: 3000, y: this.canvas.height - 80, w: 450, h: 80 },
      { x: 3550, y: this.canvas.height - 60, w: 550, h: 60 }
    ];
    
    grounds.forEach(g => {
      this.gameState.platforms.push({
        x: g.x, y: g.y, width: g.w, height: g.h, type: 'grass'
      });
    });
    
    // Floating platforms
    const platforms = [
      { x: 150, y: this.canvas.height - 160, w: 100, h: 20 },
      { x: 350, y: this.canvas.height - 220, w: 80, h: 20 },
      { x: 550, y: this.canvas.height - 280, w: 120, h: 20 },
      { x: 750, y: this.canvas.height - 180, w: 80, h: 20 },
      { x: 950, y: this.canvas.height - 320, w: 100, h: 20 },
      { x: 1200, y: this.canvas.height - 250, w: 120, h: 20 },
      { x: 1400, y: this.canvas.height - 180, w: 80, h: 20 },
      { x: 1600, y: this.canvas.height - 350, w: 100, h: 20 },
      { x: 1850, y: this.canvas.height - 280, w: 80, h: 20 },
      { x: 2050, y: this.canvas.height - 380, w: 120, h: 20 },
      { x: 2300, y: this.canvas.height - 320, w: 100, h: 20 },
      { x: 2550, y: this.canvas.height - 250, w: 80, h: 20 },
      { x: 2750, y: this.canvas.height - 380, w: 120, h: 20 },
      { x: 3000, y: this.canvas.height - 180, w: 100, h: 20 },
      { x: 3200, y: this.canvas.height - 320, w: 80, h: 20 },
      { x: 3400, y: this.canvas.height - 250, w: 120, h: 20 },
      { x: 3650, y: this.canvas.height - 350, w: 100, h: 20 },
      { x: 3900, y: this.canvas.height - 280, w: 80, h: 20 }
    ];
    
    platforms.forEach((p, i) => {
      this.gameState.platforms.push({
        x: p.x, y: p.y, width: p.w, height: p.h, type: i % 2 === 0 ? 'wood' : 'root'
      });
    });
    
    // Walls (for wall jumping)
    this.gameState.platforms.push(
      { x: -20, y: 0, width: 20, height: this.canvas.height, type: 'wall' },
      { x: this.config.levelWidth, y: 0, width: 20, height: this.canvas.height, type: 'wall' }
    );
    
    // Trees (decorative)
    const treeData = [
      { x: 100, y: this.canvas.height - 60, w: 40, h: 120 },
      { x: 400, y: this.canvas.height - 60, w: 50, h: 150 },
      { x: 750, y: this.canvas.height - 60, w: 45, h: 130 },
      { x: 1200, y: this.canvas.height - 60, w: 55, h: 160 },
      { x: 1700, y: this.canvas.height - 60, w: 40, h: 140 },
      { x: 2200, y: this.canvas.height - 60, w: 50, h: 150 },
      { x: 2700, y: this.canvas.height - 60, w: 45, h: 130 },
      { x: 3200, y: this.canvas.height - 60, w: 55, h: 160 },
      { x: 3700, y: this.canvas.height - 60, w: 40, h: 120 }
    ];
    
    this.gameState.trees = treeData.map(t => ({
      x: t.x, y: t.y - t.h, width: t.w, height: t.h,
      sway: Math.random() * Math.PI * 2
    }));
    
    // Bushes
    for (let i = 0; i < 25; i++) {
      this.gameState.bushes.push({
        x: 100 + Math.random() * (this.config.levelWidth - 200),
        y: this.canvas.height - 50 + Math.random() * 20,
        width: 30 + Math.random() * 30,
        height: 20 + Math.random() * 15
      });
    }
    
    // Mushrooms (collectibles with effects)
    const mushroomData = [
      { x: 200, y: this.canvas.height - 210, type: 'red' },
      { x: 700, y: this.canvas.height - 340, type: 'red' },
      { x: 1450, y: this.canvas.height - 230, type: 'red' },
      { x: 2100, y: this.canvas.height - 430, type: 'red' },
      { x: 2900, y: this.canvas.height - 230, type: 'red' },
      { x: 3600, y: this.canvas.height - 400, type: 'blue' }
    ];
    
    this.gameState.mushrooms = mushroomData.map(m => ({
      x: m.x, y: m.y, radius: 15, type: m.type, collected: false,
      glow: 0
    }));
    
    // Flowers (healing)
    const flowerData = [
      { x: 300, y: this.canvas.height - 80 },
      { x: 900, y: this.canvas.height - 100 },
      { x: 1600, y: this.canvas.height - 120 },
      { x: 2300, y: this.canvas.height - 80 },
      { x: 3100, y: this.canvas.height - 100 }
    ];
    
    this.gameState.flowers = flowerData.map(f => ({
      x: f.x, y: f.y, collected: false, bloom: 0
    }));
    
    // Nuts (score)
    const nutPositions = [
      { x: 180, y: this.canvas.height - 210 }, { x: 400, y: this.canvas.height - 280 }, { x: 600, y: this.canvas.height - 340 },
      { x: 980, y: this.canvas.height - 380 }, { x: 1250, y: this.canvas.height - 310 }, { x: 1650, y: this.canvas.height - 410 },
      { x: 1900, y: this.canvas.height - 340 }, { x: 2100, y: this.canvas.height - 440 }, { x: 2400, y: this.canvas.height - 380 },
      { x: 2800, y: this.canvas.height - 440 }, { x: 3050, y: this.canvas.height - 240 }, { x: 3450, y: this.canvas.height - 310 },
      { x: 3700, y: this.canvas.height - 410 }
    ];
    
    this.gameState.nuts = nutPositions.map(n => ({
      x: n.x, y: n.y, radius: 10, collected: false, rotation: 0
    }));
    
    // Squirrels (fast enemies)
    const squirrelData = [
      { x: 250, y: this.canvas.height - 80, range: 120 },
      { x: 800, y: this.canvas.height - 100, range: 150 },
      { x: 1500, y: this.canvas.height - 80, range: 100 },
      { x: 2300, y: this.canvas.height - 120, range: 130 },
      { x: 3100, y: this.canvas.height - 100, range: 120 }
    ];
    
    this.gameState.squirrels = squirrelData.map(s => ({
      x: s.x, y: s.y, width: 25, height: 20,
      startX: s.x, range: s.range,
      speed: 3, direction: 1, animTimer: 0, alive: true
    }));
    
    // Wolves (dangerous enemies)
    const wolfData = [
      { x: 1800, y: this.canvas.height - 140 },
      { x: 2900, y: this.canvas.height - 120 }
    ];
    
    this.gameState.wolves = wolfData.map(w => ({
      x: w.x, y: w.y, width: 50, height: 30,
      speed: 2, direction: 1, howl: false,
      howlTimer: 0, alive: true
    }));
    
    // Fairies (helpers)
    this.gameState.fairies = [
      { x: 600, y: this.canvas.height - 300, active: false },
      { x: 1600, y: this.canvas.height - 400, active: false },
      { x: 2800, y: this.canvas.height - 350, active: false }
    ];
    
    // Ancient tree (goal)
    this.gameState.ancientTree = {
      x: 4000, y: this.canvas.height - 150,
      width: 80, height: 120, harvested: false
    };
    
    // Spirit orbs (special collectibles)
    const orbData = [
      { x: 500, y: this.canvas.height - 200, color: '#00FF00' },
      { x: 2000, y: this.canvas.height - 350, color: '#00FFFF' },
      { x: 3500, y: this.canvas.height - 300, color: '#FF00FF' }
    ];
    
    this.gameState.spiritOrbs = orbData.map(o => ({
      x: o.x, y: o.y, radius: 12, color: o.color, collected: false,
      rotation: 0, pulse: 0
    }));
  }
  
  start() {
    this.player = this.players[0] || 'Player 1';
    
    this.gameState.players[this.player] = {
      name: this.player,
      x: 80,
      y: this.canvas.height - 120,
      vx: 0,
      vy: 0,
      width: 28,
      height: 45,
      color: '#27AE60',
      cloakColor: '#1E8449',
      skinColor: '#F5CBA7',
      onGround: false,
      onWall: false,
      canDoubleJump: true,
      canWallJump: true,
      isWallSliding: false,
      nuts: 0,
      mushroomsEaten: 0,
      fairyHelp: false,
      fairyTimer: 0,
      health: 100,
      maxHealth: 100,
      invincible: false,
      invincibleTimer: 0,
      facing: 1,
      state: 'idle',
      wallJumpDir: 0
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
    this.updateDayCycle(deltaTime);
    this.updateNuts(player, deltaTime);
    this.updateMushrooms(player, deltaTime);
    this.updateFlowers(player);
    this.updateEnemies(player, deltaTime);
    this.updateFairies(player, deltaTime);
    this.updateSpiritOrbs(player, deltaTime);
    this.updateTrees(deltaTime);
    this.checkAncientTree(player);
    this.updateParticles(deltaTime);
    
    if (player.invincible) {
      player.invincibleTimer -= deltaTime;
      if (player.invincibleTimer <= 0) {
        player.invincible = false;
      }
    }
    
    if (player.fairyHelp) {
      player.fairyTimer -= deltaTime;
      if (player.fairyTimer <= 0) {
        player.fairyHelp = false;
      }
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
      player.canWallJump = true;
      this.createJumpParticles(player);
    }
    
    if (input.up && !player.onGround && player.canDoubleJump && this.config.doubleJump) {
      player.vy = this.config.jumpForce * 0.8;
      player.canDoubleJump = false;
      this.createJumpParticles(player);
    }
    
    if (this.wallJumpTimer > 0) {
      this.wallJumpTimer -= 0.016;
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
    player.onWall = false;
  }
  
  checkCollisions(player) {
    this.gameState.platforms.forEach(platform => {
      if (this.checkAABB(player, platform)) {
        if (platform.type === 'wall') {
          if (player.vy > 0) {
            player.onWall = true;
            if (player.vy > 3) {
              player.vy = 3;
            }
          }
        } else if (player.vy > 0 && player.y + player.height - player.vy <= platform.y + 5) {
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
  
  updateDayCycle(deltaTime) {
    this.gameState.dayCycle += deltaTime * 0.02;
    this.gameState.isNight = this.gameState.dayCycle > 0.7 && this.gameState.dayCycle < 0.3;
  }
  
  updateNuts(player, deltaTime) {
    this.gameState.nuts.forEach(nut => {
      if (nut.collected) return;
      
      nut.rotation += deltaTime * 2;
      
      const dx = (player.x + player.width / 2) - nut.x;
      const dy = (player.y + player.height / 2) - nut.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 30) {
        nut.collected = true;
        player.nuts++;
        this.gameState.score += 15;
        this.createNutParticles(nut.x, nut.y);
      }
    });
  }
  
  updateMushrooms(player, deltaTime) {
    this.gameState.mushrooms.forEach(mushroom => {
      if (mushroom.collected) return;
      
      mushroom.glow = (Math.sin(this.gameState.time * 4) + 1) / 2;
      
      const dx = (player.x + player.width / 2) - mushroom.x;
      const dy = (player.y + player.height / 2) - mushroom.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 30) {
        mushroom.collected = true;
        player.mushroomsEaten++;
        
        if (mushroom.type === 'red') {
          player.vy = -18;
          this.gameState.score += 30;
        } else {
          player.invincible = true;
          player.invincibleTimer = 8;
          player.fairyHelp = true;
          player.fairyTimer = 10;
        }
        
        this.createMushroomParticles(mushroom.x, mushroom.y, mushroom.type);
      }
    });
  }
  
  updateFlowers(player) {
    this.gameState.flowers.forEach(flower => {
      if (flower.collected) return;
      
      flower.bloom += 0.02;
      
      const dx = (player.x + player.width / 2) - flower.x;
      const dy = (player.y + player.height / 2) - flower.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 35) {
        flower.collected = true;
        player.health = Math.min(player.maxHealth, player.health + 20);
        this.gameState.score += 20;
      }
    });
  }
  
  updateEnemies(player, deltaTime) {
    // Squirrels
    this.gameState.squirrels.forEach(squirrel => {
      if (!squirrel.alive) return;
      
      squirrel.x += squirrel.speed * squirrel.direction;
      squirrel.animTimer += deltaTime * 10;
      
      if (squirrel.x > squirrel.startX + squirrel.range) {
        squirrel.direction = -1;
      } else if (squirrel.x < squirrel.startX - squirrel.range) {
        squirrel.direction = 1;
      }
      
      if (this.checkAABB(player, squirrel) && !player.invincible) {
        this.damagePlayer(player, 15);
      }
    });
    
    // Wolves
    this.gameState.wolves.forEach(wolf => {
      if (!wolf.alive) return;
      
      wolf.howlTimer += deltaTime;
      
      if (wolf.howlTimer > 5) {
        wolf.howl = true;
        wolf.howlTimer = 0;
        
        if (player && Math.abs(player.x - wolf.x) < 200) {
          this.damagePlayer(player, 25);
        }
      }
      
      if (wolf.howl && wolf.howlTimer > 1) {
        wolf.howl = false;
      }
    });
  }
  
  updateFairies(player, deltaTime) {
    this.gameState.fairies.forEach(fairy => {
      if (!fairy.active) {
        if (player.mushroomsEaten >= 2) {
          fairy.active = true;
          fairy.targetX = player.x + 30;
          fairy.targetY = player.y - 20;
        }
      } else {
        fairy.x += ((player.x + 30) - fairy.x) * 0.05;
        fairy.y += ((player.y - 20) - fairy.y) * 0.05;
      }
    });
  }
  
  updateSpiritOrbs(player, deltaTime) {
    this.gameState.spiritOrbs.forEach(orb => {
      if (orb.collected) return;
      
      orb.rotation += deltaTime * 2;
      orb.pulse = (Math.sin(this.gameState.time * 4) + 1) / 2;
      
      const dx = (player.x + player.width / 2) - orb.x;
      const dy = (player.y + player.height / 2) - orb.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 35) {
        orb.collected = true;
        this.gameState.score += 150;
        player.fairyTimer = 15;
        this.createOrbParticles(orb.x, orb.y, orb.color);
      }
    });
  }
  
  updateTrees(deltaTime) {
    this.gameState.trees.forEach(tree => {
      tree.sway += deltaTime;
    });
  }
  
  checkAncientTree(player) {
    if (this.gameState.ancientTree.harvested) return;
    
    const tree = this.gameState.ancientTree;
    if (this.checkAABB(player, tree)) {
      if (player.nuts >= 10) {
        tree.harvested = true;
        this.gameState.score += 1000;
        this.createVictoryParticles(tree.x + tree.width / 2, tree.y);
      }
    }
  }
  
  damagePlayer(player, damage) {
    if (player.fairyHelp) {
      player.invincible = true;
      player.invincibleTimer = 2;
    } else {
      player.health -= damage;
      player.invincible = true;
      player.invincibleTimer = 1;
    }
  }
  
  fallReset(player) {
    player.health -= 25;
    player.x = 80;
    player.y = this.canvas.height - 120;
    player.vx = 0;
    player.vy = 0;
    player.invincible = true;
    player.invincibleTimer = 2;
  }
  
  createJumpParticles(player) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: player.x + player.width / 2,
        y: player.y + player.height,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * -3,
        life: 0.4,
        color: '#27AE60',
        size: 4
      });
    }
  }
  
  createNutParticles(x, y) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 0.6,
        color: '#8B4513',
        size: 4
      });
    }
  }
  
  createMushroomParticles(x, y, type) {
    const color = type === 'red' ? '#E74C3C' : '#3498DB';
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 3,
        life: 0.8,
        color: color,
        size: 5
      });
    }
  }
  
  createOrbParticles(x, y, color) {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * 5,
        vy: Math.sin(angle) * 5,
        life: 1,
        color: color,
        size: 5
      });
    }
  }
  
  createVictoryParticles(x, y) {
    const colors = ['#F1C40F', '#E74C3C', '#9B59B6', '#2ECC71', '#3498DB'];
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15 - 5,
        life: 1.5,
        color: colors[i % colors.length],
        size: 8
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
    // Sky
    if (this.gameState.isNight) {
      const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      skyGrad.addColorStop(0, '#0c1445');
      skyGrad.addColorStop(0.5, '#1a1a4a');
      skyGrad.addColorStop(1, '#2d2d6a');
      this.ctx.fillStyle = skyGrad;
    } else {
      const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      skyGrad.addColorStop(0, '#87CEEB');
      skyGrad.addColorStop(0.5, '#B4E1FF');
      skyGrad.addColorStop(1, '#E7F4FD');
      this.ctx.fillStyle = skyGrad;
    }
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Moon (at night)
    if (this.gameState.isNight) {
      this.ctx.fillStyle = '#ECF0F1';
      this.ctx.beginPath();
      this.ctx.arc(this.canvas.width - 100, 80, 30, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.beginPath();
      this.ctx.arc(this.canvas.width - 110, 70, 5, 0, Math.PI * 2);
      this.ctx.arc(this.canvas.width - 90, 90, 8, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    this.ctx.save();
    this.ctx.translate(-this.camera.x, 0);
    
    this.drawTrees();
    this.drawPlatforms();
    this.drawBushes();
    this.drawMushrooms();
    this.drawFlowers();
    this.drawNuts();
    this.drawEnemies();
    this.drawFairies();
    this.drawSpiritOrbs();
    this.drawAncientTree();
    this.drawPlayer();
    this.drawParticles();
    
    this.ctx.restore();
    
    this.drawUI();
  }
  
  drawTrees() {
    this.gameState.trees.forEach(tree => {
      const sway = Math.sin(tree.sway) * 2;
      
      // Trunk
      this.ctx.fillStyle = '#5D4037';
      this.ctx.fillRect(tree.x + tree.width / 2 - 8, tree.y, 16, this.canvas.height - tree.y);
      
      // Foliage
      this.ctx.fillStyle = '#228B22';
      this.ctx.beginPath();
      this.ctx.moveTo(tree.x + tree.width / 2 + sway, tree.y - tree.height * 0.3);
      this.ctx.lineTo(tree.x - 10, tree.y);
      this.ctx.lineTo(tree.x + tree.width + 10, tree.y);
      this.ctx.fill();
      
      this.ctx.beginPath();
      this.ctx.moveTo(tree.x + tree.width / 2 + sway * 0.8, tree.y - tree.height * 0.6);
      this.ctx.lineTo(tree.x + 5, tree.y - tree.height * 0.3);
      this.ctx.lineTo(tree.x + tree.width - 5, tree.y - tree.height * 0.3);
      this.ctx.fill();
    });
  }
  
  drawPlatforms() {
    this.gameState.platforms.forEach(platform => {
      if (platform.type === 'grass') {
        const grad = this.ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
        grad.addColorStop(0, '#4CAF50');
        grad.addColorStop(0.3, '#388E3C');
        grad.addColorStop(1, '#2E7D32');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        this.ctx.fillStyle = '#81C784';
        this.ctx.fillRect(platform.x, platform.y, platform.width, 10);
      } else if (platform.type === 'wood') {
        this.ctx.fillStyle = '#8D6E63';
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      } else if (platform.type === 'root') {
        this.ctx.fillStyle = '#6D4C41';
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      }
    });
  }
  
  drawBushes() {
    this.gameState.bushes.forEach(bush => {
      this.ctx.fillStyle = '#2E7D32';
      this.ctx.beginPath();
      this.ctx.arc(bush.x + bush.width / 2, bush.y + bush.height / 2, bush.width / 2, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawMushrooms() {
    this.gameState.mushrooms.forEach(mushroom => {
      if (mushroom.collected) return;
      
      const glow = mushroom.glow * 10 + 20;
      this.ctx.shadowColor = mushroom.type === 'red' ? '#E74C3C' : '#3498DB';
      this.ctx.shadowBlur = glow;
      
      // Stem
      this.ctx.fillStyle = '#F5F5F5';
      this.ctx.fillRect(mushroom.x - 5, mushroom.y, 10, 15);
      
      // Cap
      this.ctx.fillStyle = mushroom.type === 'red' ? '#E74C3C' : '#3498DB';
      this.ctx.beginPath();
      this.ctx.arc(mushroom.x, mushroom.y, mushroom.radius, Math.PI, 0);
      this.ctx.fill();
      
      // Spots
      this.ctx.fillStyle = '#FFF';
      this.ctx.beginPath();
      this.ctx.arc(mushroom.x - 5, mushroom.y - 5, 3, 0, Math.PI * 2);
      this.ctx.arc(mushroom.x + 5, mushroom.y - 8, 2, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.shadowBlur = 0;
    });
  }
  
  drawFlowers() {
    this.gameState.flowers.forEach(flower => {
      if (flower.collected) return;
      
      const bloom = Math.sin(flower.bloom) * 3;
      
      // Stem
      this.ctx.fillStyle = '#27AE60';
      this.ctx.fillRect(flower.x - 2, flower.y, 4, 15);
      
      // Petals
      this.ctx.fillStyle = '#E91E63';
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 / 5) * i + flower.bloom;
        this.ctx.beginPath();
        this.ctx.arc(flower.x + Math.cos(angle) * 5, flower.y + Math.sin(angle) * 5 - 5, 4, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      // Center
      this.ctx.fillStyle = '#FFEB3B';
      this.ctx.beginPath();
      this.ctx.arc(flower.x, flower.y - 5, 4, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawNuts() {
    this.gameState.nuts.forEach(nut => {
      if (nut.collected) return;
      
      this.ctx.save();
      this.ctx.translate(nut.x, nut.y);
      this.ctx.rotate(nut.rotation);
      
      this.ctx.fillStyle = '#8B4513';
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, nut.radius, nut.radius * 0.7, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.restore();
    });
  }
  
  drawEnemies() {
    // Squirrels
    this.gameState.squirrels.forEach(squirrel => {
      if (!squirrel.alive) return;
      
      const tailWag = Math.sin(squirrel.animTimer) * 0.5;
      
      this.ctx.save();
      this.ctx.translate(squirrel.x + squirrel.width / 2, squirrel.y + squirrel.height / 2);
      if (squirrel.direction < 0) this.ctx.scale(-1, 1);
      
      // Tail
      this.ctx.fillStyle = '#A0522D';
      this.ctx.beginPath();
      this.ctx.ellipse(-squirrel.width / 2, 0, 8, 12, tailWag, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Body
      this.ctx.fillStyle = '#8B4513';
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, squirrel.width / 2, squirrel.height / 2, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Ear
      this.ctx.fillStyle = '#A0522D';
      this.ctx.beginPath();
      this.ctx.arc(-5, -squirrel.height / 2, 4, 0, Math.PI * 2);
      this.ctx.arc(5, -squirrel.height / 2, 4, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.restore();
    });
    
    // Wolves
    this.gameState.wolves.forEach(wolf => {
      if (!wolf.alive) return;
      
      this.ctx.save();
      this.ctx.translate(wolf.x + wolf.width / 2, wolf.y + wolf.height / 2);
      if (wolf.direction < 0) this.ctx.scale(-1, 1);
      
      // Body
      this.ctx.fillStyle = '#424242';
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, wolf.width / 2, wolf.height / 2, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Head
      this.ctx.fillStyle = '#424242';
      this.ctx.beginPath();
      this.ctx.arc(wolf.width / 3, -wolf.height / 4, 12, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Snout
      this.ctx.fillStyle = '#616161';
      this.ctx.fillRect(wolf.width / 3 + 5, -wolf.height / 4 + 5, 10, 6);
      
      // Eyes
      this.ctx.fillStyle = wolf.howl ? '#FFEB3B' : '#FF5722';
      this.ctx.beginPath();
      this.ctx.arc(wolf.width / 3 + 2, -wolf.height / 4 - 2, 3, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Howl indicator
      if (wolf.howl) {
        this.ctx.fillStyle = 'rgba(255, 235, 59, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(0, -20, 15, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      this.ctx.restore();
    });
  }
  
  drawFairies() {
    this.gameState.fairies.forEach(fairy => {
      if (!fairy.active) return;
      
      const glow = Math.sin(this.gameState.time * 5) * 0.3 + 0.7;
      
      this.ctx.fillStyle = `rgba(255, 215, 0, ${glow})`;
      this.ctx.beginPath();
      this.ctx.arc(fairy.x, fairy.y, 8, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#FFF';
      this.ctx.beginPath();
      this.ctx.arc(fairy.x - 8, fairy.y, 3, 0, Math.PI * 2);
      this.ctx.arc(fairy.x + 8, fairy.y, 3, 0, Math.PI * 2);
      this.ctx.arc(fairy.x, fairy.y - 8, 3, 0, Math.PI * 2);
      this.ctx.arc(fairy.x, fairy.y + 8, 3, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawSpiritOrbs() {
    this.gameState.spiritOrbs.forEach(orb => {
      if (orb.collected) return;
      
      const pulse = orb.pulse * 15 + 20;
      
      this.ctx.save();
      this.ctx.translate(orb.x, orb.y);
      
      this.ctx.shadowColor = orb.color;
      this.ctx.shadowBlur = pulse;
      
      this.ctx.fillStyle = orb.color;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, orb.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#FFF';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, orb.radius * 0.5, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.restore();
    });
  }
  
  drawAncientTree() {
    const tree = this.gameState.ancientTree;
    
    // Trunk
    this.ctx.fillStyle = '#4E342E';
    this.ctx.fillRect(tree.x + 20, tree.y, 40, 80);
    
    // Branches
    this.ctx.fillStyle = '#5D4037';
    this.ctx.fillRect(tree.x, tree.y - 30, 20, 30);
    this.ctx.fillRect(tree.x + 60, tree.y - 20, 30, 20);
    
    // Foliage
    this.ctx.fillStyle = '#2E7D32';
    this.ctx.beginPath();
    this.ctx.arc(tree.x + 40, tree.y - 40, 40, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Glow if ready
    if (player && this.gameState.players[this.player].nuts >= 10) {
      this.ctx.fillStyle = 'rgba(241, 196, 15, 0.5)';
      this.ctx.beginPath();
      this.ctx.arc(tree.x + 40, tree.y, 30, 0, Math.PI * 2);
      this.ctx.fill();
    }
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
    
    // Cloak
    this.ctx.fillStyle = player.cloakColor;
    this.ctx.fillRect(-player.width / 2, -player.height / 2 + 10, player.width, player.height - 10);
    
    // Hood
    this.ctx.fillStyle = player.cloakColor;
    this.ctx.fillRect(-player.width / 2 + 2, -player.height / 2, player.width - 4, 12);
    
    // Face
    this.ctx.fillStyle = player.skinColor;
    this.ctx.fillRect(-player.width / 2 + 5, -player.height / 2 + 2, player.width - 10, 12);
    
    // Eyes
    this.ctx.fillStyle = '#2E7D32';
    this.ctx.fillRect(-5, -player.height / 2 + 6, 3, 3);
    this.ctx.fillRect(4, -player.height / 2 + 6, 3, 3);
    
    // Legs
    if (player.state === 'running') {
      const legAnim = Math.sin(this.gameState.time * 15) * 6;
      this.ctx.fillStyle = '#1B5E20';
      this.ctx.fillRect(-8, player.height / 2 - 12, 6, 12 + legAnim);
      this.ctx.fillRect(2, player.height / 2 - 12, 6, 12 - legAnim);
    } else {
      this.ctx.fillStyle = '#1B5E20';
      this.ctx.fillRect(-8, player.height / 2 - 12, 6, 12);
      this.ctx.fillRect(2, player.height / 2 - 12, 6, 12);
    }
    
    // Elf hat
    this.ctx.fillStyle = '#27AE60';
    this.ctx.beginPath();
    this.ctx.moveTo(-player.width / 2 + 5, -player.height / 2 - 5);
    this.ctx.lineTo(0, -player.height / 2 - 20);
    this.ctx.lineTo(player.width / 2 - 5, -player.height / 2 - 5);
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
    
    // Nuts
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(15, 75, 120, 30);
    this.ctx.fillStyle = '#8B4513';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.fillText(`Nuts: ${player.nuts}`, 25, 95);
    
    // Mushrooms
    if (player.mushroomsEaten > 0) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(145, 75, 130, 30);
      this.ctx.fillStyle = '#E74C3C';
      this.ctx.fillText(`Mushrooms: ${player.mushroomsEaten}`, 155, 95);
    }
    
    // Fairy help
    if (player.fairyHelp) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(15, 115, 100, 25);
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.fillText(`FAIRY: ${Math.ceil(player.fairyTimer)}s`, 25, 132);
    }
    
    // Health
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(15, 150, 180, 25);
    this.ctx.fillStyle = '#C0392B';
    this.ctx.fillRect(17, 152, 176, 21);
    this.ctx.fillStyle = '#27AE60';
    this.ctx.fillRect(17, 152, 176 * (player.health / player.maxHealth), 21);
    
    // Time indicator
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(this.canvas.width - 85, 15, 70, 25);
    this.ctx.fillStyle = this.gameState.isNight ? '#3498DB' : '#F39C12';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(this.gameState.isNight ? 'NIGHT' : 'DAY', this.canvas.width - 25, 32);
  }
  
  updatePlayerInput(playerName, input) {
    window.gameInputs = window.gameInputs || {};
    window.gameInputs[playerName] = input;
  }
}

window.ForestQuest = ForestQuest;