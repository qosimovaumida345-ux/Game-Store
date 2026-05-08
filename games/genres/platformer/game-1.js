// Super Jump Adventure - Full Game Implementation
class SuperJumpAdventure {
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
      jumpForce: -15,
      doubleJump: true,
      moveSpeed: 5,
      levelWidth: 4000,
      levelHeight: 600,
      cameraSpeed: 0.08
    };
    
    this.gameState = {
      players: {},
      time: 0,
      level: 1,
      score: 0,
      status: 'playing',
      coins: [],
      gems: [],
      enemies: [],
      platforms: [],
      powerups: [],
      decorations: [],
      boss: null,
      portal: null
    };
    
    this.player = null;
    this.camera = { x: 0, y: 0 };
    this.particles = [];
    this.screenShake = 0;
    this.inputState = {};
    
    this.generateLevel();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  generateLevel() {
    this.gameState.platforms = [];
    this.gameState.coins = [];
    this.gameState.gems = [];
    this.gameState.enemies = [];
    this.gameState.powerups = [];
    this.gameState.decorations = [];
    
    // Ground
    this.gameState.platforms.push(
      { x: 0, y: this.canvas.height - 60, width: 800, height: 60, type: 'ground' },
      { x: 900, y: this.canvas.height - 60, width: 600, height: 60, type: 'ground' },
      { x: 1600, y: this.canvas.height - 60, width: 700, height: 60, type: 'ground' },
      { x: 2400, y: this.canvas.height - 60, width: 800, height: 60, type: 'ground' },
      { x: 3300, y: this.canvas.height - 60, width: 700, height: 60, type: 'ground' }
    );
    
    // Floating platforms - varied heights
    const platforms = [
      { x: 150, y: this.canvas.height - 160, w: 100, h: 20 }, { x: 320, y: this.canvas.height - 220, w: 80, h: 20 },
      { x: 500, y: this.canvas.height - 180, w: 120, h: 20 }, { x: 700, y: this.canvas.height - 250, w: 100, h: 20 },
      { x: 950, y: this.canvas.height - 150, w: 150, h: 20 }, { x: 1150, y: this.canvas.height - 220, w: 80, h: 20 },
      { x: 1300, y: this.canvas.height - 300, w: 100, h: 20 }, { x: 1050, y: this.canvas.height - 350, w: 80, h: 20 },
      { x: 1650, y: this.canvas.height - 180, w: 120, h: 20 }, { x: 1850, y: this.canvas.height - 250, w: 100, h: 20 },
      { x: 2050, y: this.canvas.height - 320, w: 80, h: 20 }, { x: 2250, y: this.canvas.height - 200, w: 120, h: 20 },
      { x: 2450, y: this.canvas.height - 150, w: 100, h: 20 }, { x: 2650, y: this.canvas.height - 280, w: 80, h: 20 },
      { x: 2850, y: this.canvas.height - 350, w: 100, h: 20 }, { x: 3050, y: this.canvas.height - 220, w: 120, h: 20 },
      { x: 3250, y: this.canvas.height - 300, w: 100, h: 20 }, { x: 3500, y: this.canvas.height - 180, w: 80, h: 20 },
      { x: 3700, y: this.canvas.height - 280, w: 100, h: 20 }
    ];
    
    platforms.forEach((p, i) => {
      this.gameState.platforms.push({
        x: p.x, y: p.y, width: p.w, height: p.h, type: 'platform',
        variant: i % 3, locked: false
      });
    });
    
    // Walls
    this.gameState.platforms.push(
      { x: -30, y: 0, width: 30, height: this.canvas.height, type: 'wall' },
      { x: this.config.levelWidth, y: 0, width: 30, height: this.canvas.height, type: 'wall' }
    );
    
    // Coins
    const coinPositions = [
      { x: 180, y: this.canvas.height - 210 }, { x: 350, y: this.canvas.height - 270 }, { x: 530, y: this.canvas.height - 230 },
      { x: 730, y: this.canvas.height - 300 }, { x: 1000, y: this.canvas.height - 200 }, { x: 1180, y: this.canvas.height - 270 },
      { x: 1330, y: this.canvas.height - 350 }, { x: 1080, y: this.canvas.height - 400 }, { x: 1680, y: this.canvas.height - 230 },
      { x: 1880, y: this.canvas.height - 300 }, { x: 2080, y: this.canvas.height - 370 }, { x: 2280, y: this.canvas.height - 250 },
      { x: 2480, y: this.canvas.height - 200 }, { x: 2680, y: this.canvas.height - 330 }, { x: 2880, y: this.canvas.height - 400 },
      { x: 3080, y: this.canvas.height - 270 }, { x: 3280, y: this.canvas.height - 350 }, { x: 3530, y: this.canvas.height - 230 },
      { x: 3730, y: this.canvas.height - 330 }, { x: 500, y: this.canvas.height - 110 }, { x: 1500, y: this.canvas.height - 110 },
      { x: 2600, y: this.canvas.height - 110 }, { x: 3600, y: this.canvas.height - 110 }
    ];
    
    this.gameState.coins = coinPositions.map(p => ({
      x: p.x, y: p.y, radius: 12, collected: false,
      rotation: Math.random() * Math.PI * 2, animOffset: Math.random() * Math.PI * 2
    }));
    
    // Gems (special collectibles)
    const gemPositions = [
      { x: 750, y: this.canvas.height - 300, type: 'ruby' },
      { x: 2200, y: this.canvas.height - 370, type: 'emerald' },
      { x: 3400, y: this.canvas.height - 400, type: 'sapphire' }
    ];
    
    this.gameState.gems = gemPositions.map(p => ({
      x: p.x, y: p.y, radius: 15, type: p.type, collected: false,
      rotation: 0, glow: 0
    }));
    
    // Enemies
    const enemyTypes = ['slime', 'goblin', 'bat', 'spider', 'skeleton'];
    const enemyData = [
      { x: 250, y: this.canvas.height - 80, type: 'slime' }, { x: 550, y: this.canvas.height - 80, type: 'goblin' },
      { x: 950, y: this.canvas.height - 80, type: 'slime' }, { x: 1350, y: this.canvas.height - 80, type: 'bat' },
      { x: 1700, y: this.canvas.height - 80, type: 'skeleton' }, { x: 2100, y: this.canvas.height - 80, type: 'spider' },
      { x: 2500, y: this.canvas.height - 80, type: 'goblin' }, { x: 2900, y: this.canvas.height - 80, type: 'slime' },
      { x: 3350, y: this.canvas.height - 80, type: 'bat' }, { x: 3750, y: this.canvas.height - 80, type: 'skeleton' },
      { x: 850, y: this.canvas.height - 380, type: 'bat' }, { x: 2000, y: this.canvas.height - 350, type: 'bat' },
      { x: 3000, y: this.canvas.height - 400, type: 'bat' }
    ];
    
    this.gameState.enemies = enemyData.map(e => this.createEnemy(e.x, e.y, e.type));
    
    // Power-ups
    this.gameState.powerups = [
      { x: 420, y: this.canvas.height - 270, type: 'jump', collected: false },
      { x: 1400, y: this.canvas.height - 180, type: 'shield', collected: false },
      { x: 1950, y: this.canvas.height - 200, type: 'speed', collected: false },
      { x: 2650, y: this.canvas.height - 330, type: 'magnet', collected: false },
      { x: 3550, y: this.canvas.height - 350, type: 'multi', collected: false }
    ];
    
    // Decorations
    for (let i = 0; i < 30; i++) {
      this.gameState.decorations.push({
        x: Math.random() * this.config.levelWidth,
        y: this.canvas.height - 80 + Math.random() * 40,
        type: Math.random() > 0.5 ? 'flower' : 'grass',
        scale: 0.5 + Math.random() * 0.5
      });
    }
    
    // Portal to next level
    this.gameState.portal = {
      x: 3850, y: this.canvas.height - 120, width: 60, height: 80,
      active: true, rotation: 0
    };
  }
  
  createEnemy(x, y, type) {
    const configs = {
      slime: { width: 35, height: 25, color: '#2ECC71', speed: 1, range: 80, health: 2, damage: 10 },
      goblin: { width: 30, height: 40, color: '#27AE60', speed: 2.5, range: 100, health: 3, damage: 15 },
      bat: { width: 30, height: 20, color: '#8E44AD', speed: 3, range: 120, health: 1, damage: 20, flying: true },
      spider: { width: 40, height: 35, color: '#2C3E50', speed: 2, range: 150, health: 4, damage: 25 },
      skeleton: { width: 30, height: 50, color: '#ECF0F1', speed: 1.5, range: 60, health: 5, damage: 20 }
    };
    
    const config = configs[type];
    return {
      x, y, type, ...config,
      startX: x, startY: y, direction: 1,
      animTimer: 0, health: config.health, maxHealth: config.health,
      alive: true, hit: false, hitTimer: 0
    };
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
      color: '#E74C3C',
      skinColor: '#F5CBA7',
      onGround: false,
      canDoubleJump: true,
      hasShield: false,
      hasMagnet: false,
      health: 100,
      maxHealth: 100,
      coins: 0,
      gems: 0,
      powerup: null,
      powerupTimer: 0,
      invincible: false,
      invincibleTimer: 0,
      facing: 1,
      state: 'idle',
      attackTimer: 0,
      combo: 0,
      lastEnemyHit: null
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
    this.updateCoins(player, deltaTime);
    this.updateGems(player, deltaTime);
    this.updateEnemies(player, deltaTime);
    this.updatePowerups(player, deltaTime);
    this.updateParticles(deltaTime);
    this.checkPortal(player);
    this.updateScreenShake(deltaTime);
    
    if (player.invincible) {
      player.invincibleTimer -= deltaTime;
      if (player.invincibleTimer <= 0) {
        player.invincible = false;
      }
    }
    
    if (player.powerupTimer > 0) {
      player.powerupTimer -= deltaTime;
      if (player.powerupTimer <= 0) {
        player.powerup = null;
        this.config.jumpForce = -15;
        this.config.moveSpeed = 5;
        player.hasShield = false;
        player.hasMagnet = false;
      }
    }
    
    if (player.y > this.canvas.height + 100) {
      this.respawnPlayer(player);
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
    
    if (input.up) {
      if (player.onGround) {
        player.vy = this.config.jumpForce;
        player.onGround = false;
        player.canDoubleJump = true;
        this.createJumpParticles(player, '#FFF');
      } else if (player.canDoubleJump && this.config.doubleJump) {
        player.vy = this.config.jumpForce * 0.75;
        player.canDoubleJump = false;
        this.createJumpParticles(player, '#F39C12');
      }
    }
    
    if (input.attack && player.attackTimer <= 0) {
      player.attackTimer = 0.4;
      this.performAttack(player);
    }
    
    if (player.attackTimer > 0) {
      player.attackTimer -= 0.016;
    }
  }
  
  getPlayerInput(playerName) {
    const inputs = window.gameInputs || {};
    return inputs[playerName] || this.inputState;
  }
  
  applyPhysics(player, deltaTime) {
    player.vy += this.config.gravity;
    player.vy = Math.min(player.vy, 18);
    player.x += player.vx;
    player.y += player.vy;
    player.onGround = false;
    player.x = Math.max(0, Math.min(this.config.levelWidth - player.width, player.x));
  }
  
  checkCollisions(player) {
    this.gameState.platforms.forEach(platform => {
      if (platform.type === 'wall' || platform.locked) return;
      
      if (this.checkAABB(player, platform)) {
        const overlapX = (player.x + player.width / 2) - (platform.x + platform.width / 2);
        const overlapY = (player.y + player.height / 2) - (platform.y + platform.height / 2);
        const halfW = player.width / 2 + platform.width / 2;
        const halfH = player.height / 2 + platform.height / 2;
        
        if (Math.abs(overlapX / halfW) < Math.abs(overlapY / halfH)) {
          if (overlapX > 0) {
            player.x = platform.x + platform.width;
          } else {
            player.x = platform.x - player.width;
          }
          player.vx = 0;
        } else {
          if (overlapY > 0) {
            player.y = platform.y + platform.height;
            player.vy = 0;
          } else {
            player.y = platform.y - player.height;
            player.vy = 0;
            player.onGround = true;
          }
        }
      }
    });
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
  
  updateCoins(player, deltaTime) {
    this.gameState.coins.forEach(coin => {
      if (coin.collected) return;
      
      coin.rotation += deltaTime * 3;
      
      let dx = (player.x + player.width / 2) - coin.x;
      let dy = (player.y + player.height / 2) - coin.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      
      if (player.hasMagnet && dist < 200) {
        const angle = Math.atan2(dy, dx);
        const speed = 8 * (1 - dist / 200);
        coin.x += Math.cos(angle) * speed;
        coin.y += Math.sin(angle) * speed;
      }
      
      if (dist < 35) {
        coin.collected = true;
        player.coins++;
        this.gameState.score += 10;
        this.createCoinParticles(coin.x, coin.y);
      }
    });
  }
  
  updateGems(player, deltaTime) {
    this.gameState.gems.forEach(gem => {
      if (gem.collected) return;
      
      gem.rotation += deltaTime * 2;
      gem.glow = (Math.sin(this.gameState.time * 4) + 1) / 2;
      
      const dx = (player.x + player.width / 2) - gem.x;
      const dy = (player.y + player.height / 2) - gem.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 40) {
        gem.collected = true;
        player.gems++;
        this.gameState.score += 50;
        this.createGemParticles(gem.x, gem.y, gem.type);
        this.screenShake = 0.3;
      }
    });
  }
  
  updateEnemies(player, deltaTime) {
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      
      enemy.animTimer += deltaTime;
      
      if (enemy.hit) {
        enemy.hitTimer -= deltaTime;
        if (enemy.hitTimer <= 0) enemy.hit = false;
      }
      
      if (!enemy.flying) {
        enemy.x += enemy.speed * enemy.direction;
        if (enemy.x > enemy.startX + enemy.range) {
          enemy.direction = -1;
        } else if (enemy.x < enemy.startX - enemy.range) {
          enemy.direction = 1;
        }
      } else {
        enemy.y = enemy.startY + Math.sin(enemy.animTimer * 3) * 40;
      }
      
      if (this.checkAABB(player, enemy) && !player.invincible && enemy.alive) {
        if (player.vy > 5 && player.y + player.height < enemy.y + enemy.height * 0.4) {
          this.damageEnemy(enemy, 1);
          player.vy = -12;
        } else {
          if (!player.hasShield) {
            player.health -= enemy.damage;
            this.screenShake = 0.5;
          }
          player.invincible = true;
          player.invincibleTimer = 1;
          
          const knockback = player.x < enemy.x ? -15 : 15;
          player.vx = knockback;
          player.vy = -8;
        }
      }
    });
  }
  
  damageEnemy(enemy, damage) {
    enemy.health -= damage;
    enemy.hit = true;
    enemy.hitTimer = 0.2;
    
    if (enemy.health <= 0) {
      enemy.alive = false;
      this.gameState.score += 25;
      this.createDeathParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color);
    }
  }
  
  performAttack(player) {
    const attackRange = 60;
    const attackX = player.facing > 0 ? player.x + player.width : player.x - attackRange;
    
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      
      if (attackX < enemy.x + enemy.width && attackX + attackRange > enemy.x &&
          player.y < enemy.y + enemy.height && player.y + player.height > enemy.y) {
        this.damageEnemy(enemy, player.combo + 1);
        player.combo = (player.combo + 1) % 3;
        
        if (enemy.lastHitBy !== player.name) {
          enemy.lastHitBy = player.name;
        }
      }
    });
    
    this.createAttackParticles(player);
  }
  
  updatePowerups(player, deltaTime) {
    this.gameState.powerups.forEach(powerup => {
      if (powerup.collected) return;
      
      const dx = (player.x + player.width / 2) - powerup.x;
      const dy = (player.y + player.height / 2) - powerup.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 30) {
        powerup.collected = true;
        this.applyPowerup(player, powerup.type);
      }
    });
  }
  
  applyPowerup(player, type) {
    const effects = {
      jump: () => { this.config.jumpForce = -20; player.powerup = 'jump'; player.powerupTimer = 10; },
      speed: () => { this.config.moveSpeed = 8; player.powerup = 'speed'; player.powerupTimer = 10; },
      shield: () => { player.hasShield = true; player.powerup = 'shield'; player.powerupTimer = 15; },
      magnet: () => { player.hasMagnet = true; player.powerup = 'magnet'; player.powerupTimer = 12; },
      multi: () => { player.powerup = 'multi'; player.powerupTimer = 8; player.canDoubleJump = true; }
    };
    
    if (effects[type]) {
      effects[type]();
      this.gameState.score += 20;
    }
  }
  
  checkPortal(player) {
    if (!this.gameState.portal.active) return;
    
    const portal = this.gameState.portal;
    if (player.x + player.width > portal.x && player.x < portal.x + portal.width &&
        player.y + player.height > portal.y && player.y < portal.y + portal.height) {
      
      if (player.coins >= 20) {
        this.nextLevel();
      }
    }
  }
  
  nextLevel() {
    this.gameState.level++;
    this.gameState.score += 100;
    this.config.levelWidth += 500;
    this.generateLevel();
    
    const player = this.gameState.players[this.player];
    player.x = 80;
    player.y = this.canvas.height - 120;
    player.vx = 0;
    player.vy = 0;
  }
  
  respawnPlayer(player) {
    player.health = Math.max(10, player.health - 20);
    player.x = 80;
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
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * -4,
        life: 0.6,
        color: color,
        size: 4 + Math.random() * 3
      });
    }
  }
  
  createCoinParticles(x, y) {
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 4,
        life: 0.8,
        color: '#F1C40F',
        size: 3
      });
    }
  }
  
  createGemParticles(x, y, type) {
    const colors = { ruby: '#E74C3C', emerald: '#2ECC71', sapphire: '#3498DB' };
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12 - 5,
        life: 1,
        color: colors[type],
        size: 4
      });
    }
  }
  
  createDeathParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
      const angle = (Math.PI * 2 / 15) * i;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * (3 + Math.random() * 3),
        vy: Math.sin(angle) * (3 + Math.random() * 3),
        life: 0.8,
        color: color,
        size: 5
      });
    }
  }
  
  createAttackParticles(player) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: player.x + player.width / 2 + (player.facing > 0 ? 20 : -20),
        y: player.y + player.height / 2,
        vx: player.facing * (4 + Math.random() * 2),
        vy: (Math.random() - 0.5) * 4,
        life: 0.3,
        color: '#FFF',
        size: 3
      });
    }
  }
  
  updateParticles(deltaTime) {
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 15 * deltaTime;
      p.life -= deltaTime;
      return p.life > 0;
    });
  }
  
  updateScreenShake(deltaTime) {
    if (this.screenShake > 0) {
      this.screenShake -= deltaTime * 2;
    }
  }
  
  render() {
    const shakeX = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake * 20 : 0;
    const shakeY = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake * 20 : 0;
    
    // Sky gradient
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    skyGrad.addColorStop(0, '#1a1a2e');
    skyGrad.addColorStop(0.5, '#16213e');
    skyGrad.addColorStop(1, '#0f3460');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Stars
    this.drawStars();
    
    // Parallax layers
    this.ctx.save();
    this.ctx.translate(-this.camera.x * 0.2 + shakeX, shakeY);
    this.drawMountains();
    this.ctx.restore();
    
    this.ctx.save();
    this.ctx.translate(-this.camera.x * 0.4 + shakeX, shakeY);
    this.drawTrees();
    this.ctx.restore();
    
    // Game world
    this.ctx.save();
    this.ctx.translate(-this.camera.x + shakeX, -this.camera.y + shakeY);
    
    this.drawPlatforms();
    this.drawDecorations();
    this.drawPortal();
    this.drawCoins();
    this.drawGems();
    this.drawEnemies();
    this.drawPowerups();
    this.drawPlayer();
    this.drawParticles();
    
    this.ctx.restore();
    
    this.drawUI();
  }
  
  drawStars() {
    this.ctx.fillStyle = '#FFF';
    const starPositions = [
      { x: 50, y: 30 }, { x: 150, y: 60 }, { x: 250, y: 25 }, { x: 400, y: 80 }, { x: 550, y: 40 },
      { x: 650, y: 70 }, { x: 750, y: 35 }, { x: 100, y: 100 }, { x: 300, y: 120 }, { x: 500, y: 100 }
    ];
    
    starPositions.forEach(star => {
      const twinkle = Math.sin(this.gameState.time * 3 + star.x) * 0.5 + 0.5;
      this.ctx.globalAlpha = twinkle;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, 2, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
  }
  
  drawMountains() {
    this.ctx.fillStyle = '#1c1c3d';
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.canvas.height);
    this.ctx.lineTo(200, this.canvas.height - 150);
    this.ctx.lineTo(400, this.canvas.height);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#252550';
    this.ctx.beginPath();
    this.ctx.moveTo(300, this.canvas.height);
    this.ctx.lineTo(550, this.canvas.height - 180);
    this.ctx.lineTo(800, this.canvas.height);
    this.ctx.fill();
  }
  
  drawTrees() {
    this.ctx.fillStyle = '#0d1b2a';
    const treePositions = [
      { x: 50, h: 100 }, { x: 200, h: 120 }, { x: 450, h: 80 }, { x: 650, h: 110 }, { x: 850, h: 90 }
    ];
    
    treePositions.forEach(tree => {
      this.ctx.beginPath();
      this.ctx.moveTo(tree.x, this.canvas.height);
      this.ctx.lineTo(tree.x + 20, this.canvas.height - tree.h);
      this.ctx.lineTo(tree.x + 40, this.canvas.height);
      this.ctx.fill();
    });
  }
  
  drawPlatforms() {
    this.gameState.platforms.forEach(p => {
      if (p.type === 'ground') {
        const grad = this.ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
        grad.addColorStop(0, '#2d5016');
        grad.addColorStop(0.3, '#1e3810');
        grad.addColorStop(1, '#0f1f08');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(p.x, p.y, p.width, p.height);
        
        // Grass top
        this.ctx.fillStyle = '#3d7a1e';
        this.ctx.fillRect(p.x, p.y, p.width, 8);
      } else if (p.type === 'platform') {
        const colors = ['#5D6D7E', '#7B7D7D', '#85929E'];
        this.ctx.fillStyle = colors[p.variant];
        this.ctx.fillRect(p.x, p.y, p.width, p.height);
        
        this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
        this.ctx.fillRect(p.x, p.y, p.width, 4);
        
        this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(p.x, p.y, p.width, p.height);
      } else if (p.type === 'wall') {
        this.ctx.fillStyle = '#1c1c3d';
        this.ctx.fillRect(p.x, p.y, p.width, p.height);
      }
    });
  }
  
  drawDecorations() {
    this.gameState.decorations.forEach(dec => {
      if (dec.type === 'flower') {
        this.ctx.fillStyle = '#E74C3C';
        this.ctx.beginPath();
        this.ctx.arc(dec.x, dec.y, 4 * dec.scale, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#27AE60';
        this.ctx.fillRect(dec.x - 1, dec.y, 2, 8 * dec.scale);
      } else {
        this.ctx.fillStyle = `rgba(46, 125, 50, ${0.5 * dec.scale})`;
        this.ctx.fillRect(dec.x, dec.y, 3 * dec.scale, 10 * dec.scale);
      }
    });
  }
  
  drawPortal() {
    const portal = this.gameState.portal;
    if (!portal.active) return;
    
    portal.rotation += 0.02;
    
    this.ctx.save();
    this.ctx.translate(portal.x + portal.width / 2, portal.y + portal.height / 2);
    this.ctx.rotate(portal.rotation);
    
    const grad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
    grad.addColorStop(0, '#9B59B6');
    grad.addColorStop(0.5, '#8E44AD');
    grad.addColorStop(1, 'rgba(142, 68, 173, 0)');
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 40, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#FFF';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
    
    this.ctx.restore();
  }
  
  drawCoins() {
    this.gameState.coins.forEach(coin => {
      if (coin.collected) return;
      
      const bounce = Math.sin(this.gameState.time * 4 + coin.animOffset) * 3;
      
      this.ctx.save();
      this.ctx.translate(coin.x, coin.y + bounce);
      this.ctx.scale(1, Math.cos(coin.rotation));
      
      this.ctx.fillStyle = '#F1C40F';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.strokeStyle = '#D4AC0D';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#D4AC0D';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('$', 0, 4);
      
      this.ctx.restore();
    });
  }
  
  drawGems() {
    this.gameState.gems.forEach(gem => {
      if (gem.collected) return;
      
      const colors = { ruby: '#E74C3C', emerald: '#2ECC71', sapphire: '#3498DB' };
      const glow = gem.glow * 10 + 20;
      
      this.ctx.save();
      this.ctx.translate(gem.x, gem.y);
      
      this.ctx.shadowColor = colors[gem.type];
      this.ctx.shadowBlur = glow;
      
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
  
  drawEnemies() {
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      
      const bounce = enemy.flying ? Math.sin(enemy.animTimer * 3) * 5 : 0;
      
      this.ctx.save();
      this.ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2 + bounce);
      
      if (enemy.direction < 0) {
        this.ctx.scale(-1, 1);
      }
      
      if (enemy.hit) {
        this.ctx.fillStyle = '#FFF';
      } else {
        this.ctx.fillStyle = enemy.color;
      }
      
      // Draw based on type
      if (enemy.type === 'slime') {
        this.ctx.beginPath();
        this.ctx.ellipse(0, 5, enemy.width / 2, enemy.height / 2 - 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(-8, -5, 4, 0, Math.PI * 2);
        this.ctx.arc(8, -5, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(-8, -5, 2, 0, Math.PI * 2);
        this.ctx.arc(8, -5, 2, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (enemy.type === 'goblin') {
        this.ctx.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
        
        this.ctx.fillStyle = '#1c1c1c';
        this.ctx.beginPath();
        this.ctx.moveTo(-10, -10);
        this.ctx.lineTo(-5, -20);
        this.ctx.lineTo(0, -10);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.moveTo(10, -10);
        this.ctx.lineTo(5, -20);
        this.ctx.lineTo(0, -10);
        this.ctx.fill();
      } else if (enemy.type === 'bat') {
        const wingFlap = Math.sin(enemy.animTimer * 8) * 15;
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(-15, -10 + wingFlap);
        this.ctx.lineTo(-10, 5);
        this.ctx.lineTo(0, 0);
        this.ctx.lineTo(10, 5);
        this.ctx.lineTo(15, -10 + wingFlap);
        this.ctx.lineTo(0, 0);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(-5, -2, 3, 0, Math.PI * 2);
        this.ctx.arc(5, -2, 3, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (enemy.type === 'spider') {
        this.ctx.fillRect(-enemy.width / 2, 0, enemy.width, enemy.height / 2);
        
        // Legs
        for (let i = 0; i < 4; i++) {
          this.ctx.fillRect(-enemy.width / 2 - 10 + i * 8, -5, 8, 3);
          this.ctx.fillRect(enemy.width / 2 - 10 + i * 8 - 8 * 3 + (i > 1 ? 0 : 0), -5, 8, 3);
        }
      } else if (enemy.type === 'skeleton') {
        this.ctx.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height * 0.6);
        this.ctx.fillRect(-5, enemy.height * 0.1, 10, enemy.height * 0.4);
        
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(-8, -15, 5, 5);
        this.ctx.fillRect(3, -15, 5, 5);
      }
      
      this.ctx.restore();
    });
  }
  
  drawPowerups() {
    this.gameState.powerups.forEach(powerup => {
      if (powerup.collected) return;
      
      const pulse = Math.sin(this.gameState.time * 5) * 3;
      const iconColors = {
        jump: '#9B59B6', speed: '#3498DB', shield: '#E74C3C',
        magnet: '#F39C12', multi: '#2ECC71'
      };
      
      this.ctx.save();
      this.ctx.translate(powerup.x, powerup.y);
      
      this.ctx.fillStyle = iconColors[powerup.type];
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 18 + pulse, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.strokeStyle = '#FFF';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#FFF';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      const icons = { jump: 'J', speed: 'S', shield: 'Sh', magnet: 'M', multi: '2x' };
      this.ctx.fillText(icons[powerup.type] || powerup.type[0].toUpperCase(), 0, 0);
      
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
    
    // Shadow
    this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, player.height / 2 + 5, player.width / 2, 5, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Body
    this.ctx.fillStyle = player.color;
    this.ctx.fillRect(-player.width / 2, -player.height / 2 + 10, player.width, player.height - 10);
    
    // Head
    this.ctx.fillStyle = player.skinColor;
    this.ctx.fillRect(-player.width / 2 + 4, -player.height / 2, player.width - 8, 15);
    
    // Eyes
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(-5, -player.height / 2 + 5, 4, 4);
    this.ctx.fillRect(3, -player.height / 2 + 5, 4, 4);
    
    // Legs animation
    if (player.state === 'running') {
      const legAnim = Math.sin(this.gameState.time * 20) * 8;
      this.ctx.fillStyle = '#2C3E50';
      this.ctx.fillRect(-8, player.height / 2 - 15, 6, 12 + legAnim);
      this.ctx.fillRect(2, player.height / 2 - 15, 6, 12 - legAnim);
    } else {
      this.ctx.fillStyle = '#2C3E50';
      this.ctx.fillRect(-8, player.height / 2 - 15, 6, 12);
      this.ctx.fillRect(2, player.height / 2 - 15, 6, 12);
    }
    
    // Attack effect
    if (player.attackTimer > 0.2) {
      this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
      this.ctx.fillRect(player.width / 2, -10, 25, 20);
    }
    
    // Powerup glow
    if (player.powerup) {
      this.ctx.strokeStyle = {
        jump: '#9B59B6', speed: '#3498DB', shield: '#E74C3C',
        magnet: '#F39C12', multi: '#2ECC71'
      }[player.powerup];
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(-player.width / 2 - 5, -player.height / 2 - 5, player.width + 10, player.height + 10);
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
    
    // Score panel
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(15, 15, 160, 60);
    this.ctx.strokeStyle = '#3498DB';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(15, 15, 160, 60);
    
    this.ctx.fillStyle = '#F1C40F';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 25, 38);
    this.ctx.fillStyle = '#ECF0F1';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`Coins: ${player.coins}`, 25, 58);
    
    // Level panel
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(this.canvas.width - 115, 15, 100, 40);
    this.ctx.strokeStyle = '#2ECC71';
    this.ctx.strokeRect(this.canvas.width - 115, 15, 100, 40);
    
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`Level ${this.gameState.level}`, this.canvas.width - 25, 42);
    
    // Health bar
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(15, 85, 210, 30);
    
    this.ctx.fillStyle = '#C0392B';
    this.ctx.fillRect(17, 87, 206, 26);
    this.ctx.fillStyle = '#27AE60';
    this.ctx.fillRect(17, 87, 206 * (player.health / player.maxHealth), 26);
    
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`HP: ${Math.max(0, player.health)}`, 120, 105);
    
    // Powerup indicator
    if (player.powerup) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(15, 125, 100, 25);
      this.ctx.fillStyle = {
        jump: '#9B59B6', speed: '#3498DB', shield: '#E74C3C',
        magnet: '#F39C12', multi: '#2ECC71'
      }[player.powerup];
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`${player.powerup.toUpperCase()}: ${Math.ceil(player.powerupTimer)}s`, 25, 142);
    }
    
    // Gem count
    if (player.gems > 0) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(15, player.gems > 0 ? 160 : 125, 100, 25);
      
      this.ctx.fillStyle = '#E74C3C';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.fillText(`Gems: ${player.gems}`, 25, 177);
    }
  }
  
  updatePlayerInput(playerName, input) {
    window.gameInputs = window.gameInputs || {};
    window.gameInputs[playerName] = input;
  }
}

window.SuperJumpAdventure = SuperJumpAdventure;