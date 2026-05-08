// Cyber Ninja Platformer - Full Game with 500+ lines
class CyberNinjaPlatformer {
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
      kills: 0,
      combos: [],
      currentCombo: 0,
      comboTimer: 0,
      player: null,
      enemies: [],
      projectiles: [],
      particles: [],
      platforms: [],
      collectibles: [],
      worldWidth: 5000,
      worldHeight: 800,
      cameraX: 0,
      cameraY: 0,
      wallRunEnabled: true,
      doubleJumpEnabled: true,
      swordCombo: 0,
      swordTimer: 0,
      canAttack: true,
      attackCooldown: 0,
      status: 'playing',
      gameOver: false,
      paused: false,
      timeOfDay: 0,
      weather: 'clear',
      fogDensity: 0,
      secretAreas: [],
      achievementProgress: {}
    };
    
    this.physics = {
      gravity: 2000,
      maxFallSpeed: 1000,
      jumpForce: 750,
      doubleJumpForce: 600,
      moveSpeed: 400,
      sprintSpeed: 650,
      wallJumpX: 450,
      wallJumpY: 650,
      wallSlideSpeed: 150,
      dashSpeed: 900,
      dashDuration: 0.15,
      dashCooldown: 0.8,
      acceleration: 2500,
      friction: 0.8,
      airFriction: 0.92
    };
    
    this.inputState = {};
    this.combatState = { hits: [], lastHitTime: 0 };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = this.createNinja(100, 600);
    this.gameState.secretAreas = [];
    this.createWorld();
  }
  
  createNinja(x, y) {
    return {
      x: x,
      y: y,
      width: 28,
      height: 52,
      vx: 0,
      vy: 0,
      grounded: false,
      onWall: false,
      wallDir: 0,
      facing: 1,
      state: 'idle',
      animation: 'idle',
      animationTimer: 0,
      
      hp: 120,
      maxHp: 120,
      energy: 100,
      maxEnergy: 100,
      
      invulnerable: 0,
      invincible: 0,
      
      hasDoubleJump: true,
      doubleJumpUsed: false,
      canDoubleJump: true,
      
      hasDash: true,
      dashCooldown: 0,
      isDashing: false,
      dashTimer: 0,
      dashCount: 0,
      maxDashes: 2,
      
      hasWallRun: true,
      isWallRunning: false,
      
      hasGrapplingHook: true,
      grapplingHook: null,
      
      swordLevel: 1,
      swordCombo: 0,
      swordTimer: 0,
      canSwordAttack: true,
      swordAttackCooldown: 0,
      
      kunaiCount: 15,
      maxKunai: 30,
      
      hasShuriken: true,
      shurikenCooldown: 0,
      
      smokeBombCount: 3,
      smokeBombCooldown: 0,
      
      cosmetics: {
        maskColor: '#e74c3c',
        bandanaStyle: 'trailing',
        swordGlow: true
      },
      
      stats: {
        speed: 1,
        power: 1,
        defense: 1,
        energyEfficiency: 1
      }
    };
  }
  
  createWorld() {
    this.gameState.platforms = this.createPlatforms();
    this.gameState.enemies = this.createEnemies();
    this.gameState.collectibles = this.createCollectibles();
    this.gameState.secretAreas = this.createSecretAreas();
  }
  
  createPlatforms() {
    const platforms = [];
    
    platforms.push(
      { x: 0, y: 750, width: 500, height: 50, type: 'ground', material: 'concrete', special: null },
      { x: 550, y: 700, width: 120, height: 25, type: 'platform', material: 'metal', special: null },
      { x: 720, y: 620, width: 100, height: 25, type: 'platform', material: 'metal', special: null },
      { x: 880, y: 550, width: 150, height: 25, type: 'platform', material: 'metal', special: { moving: true, startX: 880, endX: 1050, speed: 2.5 } },
      { x: 1100, y: 500, width: 180, height: 25, type: 'platform', material: 'glass', special: { fragile: true } },
      { x: 1350, y: 580, width: 120, height: 25, type: 'platform', material: 'metal', special: null },
      { x: 1550, y: 480, width: 150, height: 25, type: 'platform', material: 'neon', special: { glow: true } },
      { x: 1800, y: 400, width: 100, height: 25, type: 'platform', material: 'metal', special: null },
      { x: 2000, y: 450, width: 200, height: 25, type: 'platform', material: 'metal', special: null },
      { x: 2300, y: 500, width: 150, height: 25, type: 'platform', material: 'wood', special: { breakable: true } },
      { x: 2550, y: 420, width: 120, height: 25, type: 'platform', material: 'metal', special: null },
      { x: 2750, y: 350, width: 150, height: 25, type: 'platform', material: 'glass', special: { fragile: true } },
      { x: 3000, y: 400, width: 180, height: 25, type: 'platform', material: 'neon', special: { glow: true } },
      { x: 3250, y: 480, width: 150, height: 25, type: 'platform', material: 'metal', special: null },
      { x: 3500, y: 550, width: 200, height: 25, type: 'platform', material: 'metal', special: null },
      { x: 3800, y: 450, width: 120, height: 25, type: 'platform', material: 'metal', special: null },
      { x: 4000, y: 380, width: 150, height: 25, type: 'platform', material: 'metal', special: null },
      { x: 4250, y: 300, width: 180, height: 25, type: 'platform', material: 'glass', special: { fragile: true } },
      { x: 4500, y: 350, width: 200, height: 25, type: 'platform', material: 'neon', special: { glow: true } },
      { x: 4800, y: 400, width: 200, height: 350, type: 'wall', material: 'concrete', special: null },
      { x: -50, y: 0, width: 50, height: 800, type: 'wall', material: 'concrete', special: null }
    );
    
    return platforms;
  }
  
  createEnemies() {
    const enemies = [];
    
    enemies.push(
      { x: 600, y: 670, type: 'droid', hp: 40, vx: 60, vy: 0, width: 30, height: 35, alertRange: 200, attackRange: 80, state: 'patrol', patrolStart: 550, patrolEnd: 750, weapons: ['laser'] },
      { x: 950, y: 520, type: 'sentinel', hp: 80, vx: 0, vy: 0, width: 40, height: 50, alertRange: 300, attackRange: 150, state: 'idle', attackCooldown: 2, weapons: ['rapidFire', 'shield'] },
      { x: 1200, y: 470, type: 'assassin', hp: 50, vx: 80, vy: 0, width: 28, height: 45, alertRange: 250, attackRange: 60, state: 'patrol', patrolStart: 1100, patrolEnd: 1350, weapons: ['dagger', 'smoke'] },
      { x: 1600, y: 450, type: 'droid', hp: 40, vx: 50, vy: 0, width: 30, height: 35, alertRange: 200, attackRange: 80, state: 'patrol', patrolStart: 1550, patrolEnd: 1750, weapons: ['laser'] },
      { x: 2100, y: 420, type: 'tank', hp: 150, vx: 30, vy: 0, width: 60, height: 60, alertRange: 180, attackRange: 100, state: 'patrol', patrolStart: 2000, patrolEnd: 2200, weapons: ['missile', 'cannon'] },
      { x: 2350, y: 420, type: 'sentry', hp: 60, vx: 0, vy: 0, width: 35, height: 40, alertRange: 280, attackRange: 120, state: 'idle', attackCooldown: 1.5, weapons: ['burstLaser'] },
      { x: 2650, y: 320, type: 'assassin', hp: 50, vx: 90, vy: 0, width: 28, height: 45, alertRange: 250, attackRange: 60, state: 'patrol', patrolStart: 2550, patrolEnd: 2800, weapons: ['dagger', 'smoke'] },
      { x: 3100, y: 370, type: 'sentinel', hp: 80, vx: 0, vy: 0, width: 40, height: 50, alertRange: 300, attackRange: 150, state: 'idle', attackCooldown: 2, weapons: ['rapidFire', 'shield'] },
      { x: 3400, y: 450, type: 'droid', hp: 40, vx: 55, vy: 0, width: 30, height: 35, alertRange: 200, attackRange: 80, state: 'patrol', patrolStart: 3250, patrolEnd: 3550, weapons: ['laser'] },
      { x: 3800, y: 420, type: 'tank', hp: 150, vx: 25, vy: 0, width: 60, height: 60, alertRange: 180, attackRange: 100, state: 'patrol', patrolStart: 3700, patrolEnd: 3900, weapons: ['missile', 'cannon'] },
      { x: 4100, y: 350, type: 'assassin', hp: 50, vx: 100, vy: 0, width: 28, height: 45, alertRange: 250, attackRange: 60, state: 'patrol', patrolStart: 4000, patrolEnd: 4250, weapons: ['dagger', 'smoke'] },
      { x: 4400, y: 320, type: 'sentry', hp: 60, vx: 0, vy: 0, width: 35, height: 40, alertRange: 280, attackRange: 120, state: 'idle', attackCooldown: 1.5, weapons: ['burstLaser'] },
      { x: 4600, y: 270, type: 'sentinel', hp: 80, vx: 0, vy: 0, width: 40, height: 50, alertRange: 300, attackRange: 150, state: 'idle', attackCooldown: 2, weapons: ['rapidFire', 'shield'] },
      { x: 2000, y: 300, type: 'flyingDrone', hp: 30, vx: 60, vy: 30, width: 25, height: 25, alertRange: 200, attackRange: 100, state: 'hover', hoverAmplitude: 30, hoverFrequency: 2, weapons: ['sting'] },
      { x: 2800, y: 250, type: 'flyingDrone', hp: 30, vx: 70, vy: 40, width: 25, height: 25, alertRange: 200, attackRange: 100, state: 'hover', hoverAmplitude: 40, hoverFrequency: 2.5, weapons: ['sting'] },
      { x: 4000, y: 200, type: 'flyingDrone', hp: 30, vx: 80, vy: 35, width: 25, height: 25, alertRange: 200, attackRange: 100, state: 'hover', hoverAmplitude: 35, hoverFrequency: 3, weapons: ['sting'] }
    );
    
    return enemies;
  }
  
  createCollectibles() {
    const collectibles = [];
    
    for (let i = 0; i < 25; i++) {
      collectibles.push({
        x: 200 + i * 180,
        y: 200 + Math.random() * 400,
        type: 'xp',
        value: 25,
        collected: false
      });
    }
    
    collectibles.push({ x: 1250, y: 450, type: 'health', value: 30, collected: false });
    collectibles.push({ x: 2250, y: 400, type: 'energy', value: 40, collected: false });
    collectibles.push({ x: 3250, y: 350, type: 'health', value: 30, collected: false });
    collectibles.push({ x: 4250, y: 250, type: 'energy', value: 40, collected: false });
    
    collectibles.push({ x: 800, y: 580, type: 'weapon', subtype: 'katana', value: 0, collected: false });
    collectibles.push({ x: 1800, y: 350, type: 'weapon', subtype: 'kunai', value: 0, collected: false });
    collectibles.push({ x: 2800, y: 250, type: 'weapon', subtype: 'shuriken', value: 0, collected: false });
    
    collectibles.push({ x: 950, y: 400, type: 'secret', id: 1, value: 500, collected: false });
    collectibles.push({ x: 1950, y: 300, type: 'secret', id: 2, value: 500, collected: false });
    collectibles.push({ x: 2950, y: 200, type: 'secret', id: 3, value: 500, collected: false });
    collectibles.push({ x: 3950, y: 150, type: 'secret', id: 4, value: 500, collected: false });
    
    return collectibles;
  }
  
  createSecretAreas() {
    return [
      { x: 1000, y: 650, width: 100, height: 100, discovered: false, id: 1 },
      { x: 2100, y: 550, width: 100, height: 100, discovered: false, id: 2 },
      { x: 3200, y: 450, width: 100, height: 100, discovered: false, id: 3 },
      { x: 4300, y: 350, width: 100, height: 100, discovered: false, id: 4 }
    ];
  }
  
  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }
  
  stop() {
    this.isRunning = false;
  }
  
  gameLoop(currentTime) {
    if (!this.isRunning) return;
    
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;
    
    this.update(deltaTime);
    this.render();
    
    requestAnimationFrame((time) => this.gameLoop(time));
  }
  
  update(deltaTime) {
    if (this.gameState.paused || this.gameState.gameOver) return;
    
    this.gameState.time += deltaTime;
    this.gameState.timeOfDay = (this.gameState.timeOfDay + deltaTime * 0.01) % 1;
    
    this.handleInput();
    this.updatePlayer(deltaTime);
    this.updateEnemies(deltaTime);
    this.updateProjectiles(deltaTime);
    this.updateCollectibles(deltaTime);
    this.checkCollisions();
    this.updateCamera(deltaTime);
    this.updateParticles(deltaTime);
    this.updateEffects(deltaTime);
    this.updateWeather(deltaTime);
  }
  
  handleInput() {
    const player = this.gameState.player;
    const input = this.getPlayerInput(this.players[0]);
    
    this.inputState = input;
    
    if (input.left) {
      player.vx -= this.physics.acceleration * 0.016;
      player.vx = Math.max(-this.physics.moveSpeed, player.vx);
      player.facing = -1;
    }
    
    if (input.right) {
      player.vx += this.physics.acceleration * 0.016;
      player.vx = Math.min(this.physics.moveSpeed, player.vx);
      player.facing = 1;
    }
    
    if (!input.left && !input.right) {
      player.vx *= player.grounded ? this.physics.friction : this.physics.airFriction;
      if (Math.abs(player.vx) < 5) player.vx = 0;
    }
    
    if (input.jump && player.grounded) {
      player.vy = -this.physics.jumpForce;
      player.grounded = false;
      player.canDoubleJump = true;
      this.spawnJumpParticles();
    }
    
    if (input.jump && !player.grounded && player.hasDoubleJump && player.canDoubleJump && player.canDoubleJump) {
      player.vy = -this.physics.doubleJumpForce;
      player.canDoubleJump = false;
      this.spawnDoubleJumpParticles();
    }
    
    if (input.dash && player.hasDash && player.dashCooldown <= 0 && !player.isDashing && player.dashCount < player.maxDashes) {
      player.isDashing = true;
      player.dashTimer = this.physics.dashDuration;
      player.dashCooldown = this.physics.dashCooldown;
      player.dashCount++;
      player.vx = player.facing * this.physics.dashSpeed;
      player.vy = 0;
      this.spawnDashParticles();
    }
    
    if (input.attack && player.canSwordAttack) {
      this.performSwordAttack();
    }
    
    if (input.shoot && player.hasShuriken && player.shurikenCooldown <= 0) {
      this.throwShuriken();
    }
    
    if (input.action && player.smokeBombCount > 0 && player.smokeBombCooldown <= 0) {
      this.useSmokeBomb();
    }
  }
  
  updatePlayer(deltaTime) {
    const player = this.gameState.player;
    
    player.vy += this.physics.gravity * deltaTime;
    player.vy = Math.min(player.vy, this.physics.maxFallSpeed);
    
    if (player.isDashing) {
      player.dashTimer -= deltaTime;
      if (player.dashTimer <= 0) {
        player.isDashing = false;
        player.vx *= 0.4;
        player.vy *= 0.4;
      }
    } else {
      player.x += player.vx * deltaTime;
      this.handleHorizontalCollisions();
      
      player.y += player.vy * deltaTime;
      player.grounded = false;
      this.handleVerticalCollisions();
    }
    
    if (player.onWall && !player.grounded && player.vy > 0) {
      player.vy = Math.min(player.vy, this.physics.wallSlideSpeed);
      player.isWallRunning = true;
      
      if (this.inputState.jump) {
        player.vy = -this.physics.wallJumpY;
        player.vx = -player.wallDir * this.physics.wallJumpX;
        player.canDoubleJump = true;
        this.spawnWallJumpParticles();
      }
    } else {
      player.isWallRunning = false;
    }
    
    if (player.dashCooldown > 0) player.dashCooldown -= deltaTime;
    if (player.dashCooldown <= 0 && player.grounded) player.dashCount = 0;
    
    if (player.invulnerable > 0) player.invulnerable -= deltaTime;
    if (player.invincible > 0) player.invincible -= deltaTime;
    if (player.swordAttackCooldown > 0) player.swordAttackCooldown -= deltaTime;
    if (player.shurikenCooldown > 0) player.shurikenCooldown -= deltaTime;
    if (player.smokeBombCooldown > 0) player.smokeBombCooldown -= deltaTime;
    if (player.swordTimer > 0) player.swordTimer -= deltaTime;
    
    if (player.energy < player.maxEnergy) {
      player.energy += player.stats.energyEfficiency * deltaTime * 5;
    }
    
    player.x = Math.max(20, Math.min(this.gameState.worldWidth - player.width - 20, player.x));
    
    if (player.y > this.gameState.worldHeight + 100) {
      this.playerDies();
    }
    
    if (Math.abs(player.vx) > 50 && player.grounded && Math.random() < 0.1) {
      this.spawnDustTrail();
    }
    
    player.animationTimer += deltaTime * 10;
  }
  
  handleHorizontalCollisions() {
    const player = this.gameState.player;
    player.onWall = false;
    player.wallDir = 0;
    
    for (const platform of this.gameState.platforms) {
      if (!this.checkPlatformCollision(player, platform)) continue;
      
      if (player.vx > 0) {
        player.x = platform.x - player.width;
        player.onWall = true;
        player.wallDir = 1;
      } else if (player.vx < 0) {
        player.x = platform.x + platform.width;
        player.onWall = true;
        player.wallDir = -1;
      }
      player.vx = 0;
    }
  }
  
  handleVerticalCollisions() {
    const player = this.gameState.player;
    
    for (const platform of this.gameState.platforms) {
      if (!this.checkPlatformCollision(player, platform)) continue;
      
      if (player.vy > 0) {
        player.y = platform.y - player.height;
        player.grounded = true;
        player.vy = 0;
        player.canDoubleJump = true;
      } else if (player.vy < 0) {
        player.y = platform.y + platform.height;
        player.vy = 0;
      }
    }
  }
  
  checkPlatformCollision(player, platform) {
    return player.x < platform.x + platform.width &&
           player.x + player.width > platform.x &&
           player.y < platform.y + platform.height &&
           player.y + player.height > platform.y;
  }
  
  updateEnemies(deltaTime) {
    for (const enemy of this.gameState.enemies) {
      const dx = this.gameState.player.x - enemy.x;
      const dy = this.gameState.player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < enemy.alertRange) {
        if (enemy.state === 'patrol') {
          enemy.state = 'chase';
        }
      }
      
      if (enemy.state === 'chase') {
        if (enemy.vx !== 0 || enemy.vy !== 0) {
          const speed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
          enemy.vx = (dx / dist) * Math.min(speed, 150);
          enemy.vy = (dy / dist) * Math.min(speed, 100);
        }
      }
      
      if (enemy.type === 'flyingDrone') {
        enemy.x += enemy.vx * deltaTime;
        enemy.y = enemy.startY + Math.sin(this.gameState.time * enemy.hoverFrequency) * enemy.hoverAmplitude;
      } else if (enemy.type !== 'sentinel' && enemy.type !== 'sentry') {
        enemy.x += enemy.vx * deltaTime;
        enemy.y += enemy.vy * deltaTime;
        
        if (enemy.patrolStart && enemy.patrolEnd) {
          if (enemy.x <= enemy.patrolStart || enemy.x >= enemy.patrolEnd) {
            enemy.vx *= -1;
          }
        }
      }
      
      if (enemy.attackCooldown) {
        enemy.attackCooldown -= deltaTime;
      }
    }
  }
  
  updateProjectiles(deltaTime) {
    for (let i = this.gameState.projectiles.length - 1; i >= 0; i--) {
      const proj = this.gameState.projectiles[i];
      proj.x += proj.vx * deltaTime;
      proj.y += proj.vy * deltaTime;
      
      proj.life -= deltaTime;
      if (proj.life <= 0 || proj.x < -50 || proj.x > this.gameState.worldWidth + 50 || proj.y < -50 || proj.y > this.gameState.worldHeight + 50) {
        this.gameState.projectiles.splice(i, 1);
        continue;
      }
      
      if (proj.owner === 'player') {
        for (const enemy of this.gameState.enemies) {
          if (this.checkProjectileCollision(proj, enemy)) {
            enemy.hp -= proj.damage;
            this.spawnHitParticles(proj.x, proj.y, enemy.type === 'tank' ? '#7f8c8d' : '#e74c3c');
            
            if (enemy.hp <= 0) {
              this.gameState.kills++;
              this.gameState.score += enemy.type === 'boss' ? 1000 : (enemy.type === 'tank' ? 300 : (enemy.type === 'sentinel' ? 200 : 100));
              this.addCombo(enemy.type === 'boss' ? 500 : (enemy.type === 'tank' ? 150 : (enemy.type === 'sentinel' ? 100 : 50)));
              this.spawnEnemyDeathParticles(enemy.x, enemy.y, enemy.type);
            }
            
            this.gameState.projectiles.splice(i, 1);
            break;
          }
        }
      } else if (proj.owner === 'enemy') {
        const player = this.gameState.player;
        if (this.checkProjectileCollision(proj, { x: player.x, y: player.y, width: player.width, height: player.height })) {
          if (player.invulnerable <= 0) {
            player.hp -= proj.damage;
            player.invulnerable = 0.5;
            this.screenShakeIntensity = 10;
            
            if (player.hp <= 0) {
              this.playerDies();
            }
          }
          this.gameState.projectiles.splice(i, 1);
        }
      }
    }
  }
  
  checkProjectileCollision(proj, target) {
    return proj.x > target.x && proj.x < target.x + (target.width || 30) &&
           proj.y > target.y && proj.y < target.y + (target.height || 30);
  }
  
  updateCollectibles(deltaTime) {
    const player = this.gameState.player;
    
    for (const col of this.gameState.collectibles) {
      if (col.collected) continue;
      
      const dx = (player.x + player.width / 2) - col.x;
      const dy = (player.y + player.height / 2) - col.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 35) {
        col.collected = true;
        
        switch (col.type) {
          case 'xp':
            this.gameState.score += col.value;
            break;
          case 'health':
            player.hp = Math.min(player.hp + col.value, player.maxHp);
            break;
          case 'energy':
            player.energy = Math.min(player.energy + col.value, player.maxEnergy);
            break;
          case 'weapon':
            this.equipWeapon(col.subtype);
            break;
          case 'secret':
            this.discoverSecretArea(col.id);
            this.gameState.score += col.value;
            break;
        }
        
        this.spawnCollectParticles(col.x, col.y, col.type);
      }
    }
  }
  
  checkCollisions() {
    const player = this.gameState.player;
    
    for (const enemy of this.gameState.enemies) {
      if (this.checkEnemyCollision(player, enemy)) {
        if (player.vy > 0 && player.y + player.height < enemy.y + 20) {
          enemy.hp -= 50;
          player.vy = -250;
          this.gameState.score += 100;
          this.spawnEnemyHitParticles(enemy.x, enemy.y);
          
          if (enemy.hp <= 0) {
            this.gameState.kills++;
            this.gameState.score += enemy.type === 'boss' ? 1000 : (enemy.type === 'tank' ? 300 : 100);
            this.spawnEnemyDeathParticles(enemy.x, enemy.y, enemy.type);
          }
        } else if (player.invincible <= 0) {
          this.playerHit();
        }
      }
    }
  }
  
  checkEnemyCollision(player, enemy) {
    return player.x < enemy.x + enemy.width &&
           player.x + player.width > enemy.x &&
           player.y < enemy.y + enemy.height &&
           player.y + player.height > enemy.y;
  }
  
  playerHit() {
    const player = this.gameState.player;
    player.hp -= 20;
    player.invulnerable = 1;
    player.vx = -player.facing * 300;
    player.vy = -200;
    this.screenShakeIntensity = 15;
    
    if (player.hp <= 0) {
      this.playerDies();
    }
  }
  
  playerDies() {
    this.gameState.gameOver = true;
  }
  
  performSwordAttack() {
    const player = this.gameState.player;
    
    if (player.swordAttackCooldown > 0) return;
    
    player.swordAttackCooldown = 0.3;
    player.swordCombo = (player.swordCombo + 1) % 3;
    player.swordTimer = 0.5;
    
    this.gameState.projectiles.push({
      x: player.x + player.width / 2 + player.facing * 20,
      y: player.y + player.height / 2,
      vx: player.facing * 800,
      vy: 0,
      damage: 40,
      life: 0.3,
      owner: 'player',
      type: 'sword'
    });
    
    for (const enemy of this.gameState.enemies) {
      const dx = enemy.x - (player.x + player.facing * 40);
      const dy = enemy.y - player.y;
      if (Math.abs(dx) < 60 && Math.abs(dy) < 40) {
        enemy.hp -= 50 + player.swordCombo * 20;
        this.gameState.score += 50;
        this.spawnSwordSlashParticles(enemy.x, enemy.y);
        
        if (enemy.hp <= 0) {
          this.gameState.kills++;
          this.gameState.score += 100;
          this.spawnEnemyDeathParticles(enemy.x, enemy.y, enemy.type);
        }
      }
    }
  }
  
  throwShuriken() {
    const player = this.gameState.player;
    player.shurikenCooldown = 0.4;
    
    this.gameState.projectiles.push({
      x: player.x + player.width / 2,
      y: player.y + player.height / 2,
      vx: player.facing * 500,
      vy: 0,
      damage: 25,
      life: 1.5,
      owner: 'player',
      type: 'shuriken'
    });
  }
  
  useSmokeBomb() {
    const player = this.gameState.player;
    player.smokeBombCount--;
    player.smokeBombCooldown = 3;
    player.invincible = 2;
    
    for (let i = 0; i < 20; i++) {
      this.gameState.particles.push({
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        life: 1.5,
        color: '#95a5a6',
        size: 8,
        type: 'smoke'
      });
    }
  }
  
  equipWeapon(weapon) {
    const player = this.gameState.player;
    
    switch (weapon) {
      case 'katana':
        player.swordLevel = 2;
        player.stats.power += 0.5;
        break;
      case 'kunai':
        player.maxKunai += 10;
        player.kunaiCount += 10;
        break;
      case 'shuriken':
        player.hasShuriken = true;
        break;
    }
    
    this.gameState.score += 250;
  }
  
  discoverSecretArea(id) {
    const area = this.gameState.secretAreas.find(a => a.id === id);
    if (area && !area.discovered) {
      area.discovered = true;
      this.gameState.achievementProgress['secret_' + id] = true;
    }
  }
  
  addCombo(points) {
    this.gameState.currentCombo += points;
    this.gameState.comboTimer = 2;
  }
  
  updateCamera(deltaTime) {
    const player = this.gameState.player;
    const targetX = player.x - this.canvas.width / 3;
    const targetY = player.y - this.canvas.height / 2;
    
    this.gameState.cameraX += (targetX - this.gameState.cameraX) * 0.08;
    this.gameState.cameraY += (targetY - this.gameState.cameraY) * 0.08;
    
    this.gameState.cameraX = Math.max(0, Math.min(this.gameState.worldWidth - this.canvas.width, this.gameState.cameraX));
    this.gameState.cameraY = Math.max(-200, Math.min(this.gameState.worldHeight - this.canvas.height, this.gameState.cameraY));
  }
  
  updateParticles(deltaTime) {
    for (let i = this.gameState.particles.length - 1; i >= 0; i--) {
      const p = this.gameState.particles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      
      if (p.type !== 'smoke') {
        p.vy += 200 * deltaTime;
      }
      
      p.life -= deltaTime;
      if (p.life <= 0) {
        this.gameState.particles.splice(i, 1);
      }
    }
    
    this.gameState.comboTimer -= deltaTime;
    if (this.gameState.comboTimer <= 0) {
      this.gameState.currentCombo = 0;
    }
  }
  
  updateEffects(deltaTime) {
    if (this.screenShakeIntensity > 0) {
      this.screenShakeIntensity *= 0.9;
      if (this.screenShakeIntensity < 0.5) {
        this.screenShakeIntensity = 0;
      }
    }
  }
  
  updateWeather(deltaTime) {
    if (Math.random() < 0.001) {
      const weathers = ['clear', 'rain', 'snow'];
      this.gameState.weather = weathers[Math.floor(Math.random() * weathers.length)];
    }
    
    if (this.gameState.weather === 'rain') {
      this.gameState.fogDensity = 0.3;
    } else if (this.gameState.weather === 'snow') {
      this.gameState.fogDensity = 0.5;
    } else {
      this.gameState.fogDensity = Math.max(0, this.gameState.fogDensity - deltaTime * 0.1);
    }
  }
  
  spawnJumpParticles() {
    for (let i = 0; i < 10; i++) {
      this.gameState.particles.push({
        x: this.gameState.player.x + this.gameState.player.width / 2,
        y: this.gameState.player.y + this.gameState.player.height,
        vx: (Math.random() - 0.5) * 80,
        vy: -Math.random() * 60,
        life: 0.4,
        color: '#fff',
        size: 4
      });
    }
  }
  
  spawnDoubleJumpParticles() {
    for (let i = 0; i < 15; i++) {
      this.gameState.particles.push({
        x: this.gameState.player.x + this.gameState.player.width / 2,
        y: this.gameState.player.y + this.gameState.player.height / 2,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        life: 0.5,
        color: '#3498db',
        size: 6
      });
    }
  }
  
  spawnDashParticles() {
    for (let i = 0; i < 20; i++) {
      this.gameState.particles.push({
        x: this.gameState.player.x + this.gameState.player.width / 2,
        y: this.gameState.player.y + this.gameState.player.height / 2,
        vx: -this.gameState.player.facing * 60 + (Math.random() - 0.5) * 100,
        vy: (Math.random() - 0.5) * 100,
        life: 0.25,
        color: '#f1c40f',
        size: 7
      });
    }
  }
  
  spawnWallJumpParticles() {
    for (let i = 0; i < 12; i++) {
      this.gameState.particles.push({
        x: this.gameState.player.x + (this.gameState.player.wallDir > 0 ? this.gameState.player.width : 0),
        y: this.gameState.player.y + this.gameState.player.height / 2,
        vx: -this.gameState.player.wallDir * 100,
        vy: (Math.random() - 0.5) * 120,
        life: 0.35,
        color: '#e74c3c',
        size: 5
      });
    }
  }
  
  spawnDustTrail() {
    this.gameState.particles.push({
      x: this.gameState.player.x + this.gameState.player.width / 2,
      y: this.gameState.player.y + this.gameState.player.height - 3,
      vx: -this.gameState.player.facing * 30,
      vy: -Math.random() * 20,
      life: 0.25,
      color: '#bdc3c7',
      size: 3
    });
  }
  
  spawnCollectParticles(x, y, type) {
    const colors = { xp: '#f1c40f', health: '#e74c3c', energy: '#3498db', weapon: '#9b59b6', secret: '#2ecc71' };
    for (let i = 0; i < 12; i++) {
      this.gameState.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 150,
        vy: -Math.random() * 150 - 50,
        life: 0.6,
        color: colors[type] || '#fff',
        size: 5
      });
    }
  }
  
  spawnHitParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
      this.gameState.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        life: 0.4,
        color: color,
        size: 4
      });
    }
  }
  
  spawnSwordSlashParticles(x, y) {
    for (let i = 0; i < 15; i++) {
      this.gameState.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 250,
        vy: (Math.random() - 0.5) * 250,
        life: 0.35,
        color: '#f1c40f',
        size: 6
      });
    }
  }
  
  spawnEnemyDeathParticles(x, y, type) {
    for (let i = 0; i < 20; i++) {
      this.gameState.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 300,
        vy: -Math.random() * 200 - 50,
        life: 0.7,
        color: ['#e74c3c', '#f1c40f', '#fff'][Math.floor(Math.random() * 3)],
        size: 6
      });
    }
  }
  
  spawnEnemyHitParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      this.gameState.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 150,
        vy: (Math.random() - 0.5) * 150,
        life: 0.3,
        color: '#e74c3c',
        size: 4
      });
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    const ctx = this.ctx;
    
    ctx.save();
    ctx.translate(this.screenShakeIntensity * (Math.random() - 0.5), this.screenShakeIntensity * (Math.random() - 0.5));
    
    this.renderBackground(ctx);
    this.renderWorld(ctx);
    this.renderPlayer(ctx);
    this.renderUI(ctx);
    
    ctx.restore();
    
    if (this.gameState.gameOver) {
      this.renderGameOver(ctx);
    }
  }
  
  renderBackground(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    
    if (this.gameState.timeOfDay < 0.3) {
      gradient.addColorStop(0, '#1a1a3a');
      gradient.addColorStop(1, '#2c3e50');
    } else if (this.gameState.timeOfDay < 0.7) {
      gradient.addColorStop(0, '#1e3a5f');
      gradient.addColorStop(1, '#4a6fa5');
    } else {
      gradient.addColorStop(0, '#2c3e50');
      gradient.addColorStop(1, '#1a1a2e');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 100; i++) {
      const x = (i * 137) % this.canvas.width;
      const y = (i * 89) % (this.canvas.height * 0.6);
      const size = 1 + (i % 3);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    if (this.gameState.fogDensity > 0) {
      ctx.fillStyle = `rgba(200, 200, 200, ${this.gameState.fogDensity * 0.3})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
  
  renderWorld(ctx) {
    ctx.save();
    ctx.translate(-this.gameState.cameraX, -this.gameState.cameraY);
    
    this.renderPlatforms(ctx);
    this.renderCollectibles(ctx);
    this.renderEnemies(ctx);
    this.renderParticles(ctx);
    this.renderProjectiles(ctx);
    
    ctx.restore();
  }
  
  renderPlatforms(ctx) {
    for (const platform of this.gameState.platforms) {
      if (platform.type === 'wall') {
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      } else if (platform.material === 'neon' || platform.special?.glow) {
        ctx.fillStyle = '#9b59b6';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        ctx.shadowColor = '#9b59b6';
        ctx.shadowBlur = 15;
        ctx.fillRect(platform.x + 3, platform.y + 3, platform.width - 6, platform.height - 6);
        ctx.shadowBlur = 0;
      } else if (platform.material === 'glass' || platform.special?.fragile) {
        ctx.fillStyle = 'rgba(100, 200, 255, 0.5)';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        ctx.strokeStyle = '#87ceeb';
        ctx.lineWidth = 2;
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
      } else if (platform.material === 'wood' || platform.special?.breakable) {
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        for (let i = 0; i < platform.width; i += 20) {
          ctx.strokeStyle = '#654321';
          ctx.beginPath();
          ctx.moveTo(platform.x + i, platform.y);
          ctx.lineTo(platform.x + i, platform.y + platform.height);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = platform.material === 'metal' ? '#5d6d7e' : '#4a4a4a';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      }
    }
  }
  
  renderCollectibles(ctx) {
    for (const col of this.gameState.collectibles) {
      if (col.collected) continue;
      
      const pulse = Math.sin(this.gameState.time * 3) * 0.2 + 1;
      
      if (col.type === 'xp') {
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(col.x, col.y, 10 * pulse, 0, Math.PI * 2);
        ctx.fill();
      } else if (col.type === 'health') {
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(col.x, col.y, 12 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('+', col.x, col.y + 4);
      } else if (col.type === 'energy') {
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(col.x, col.y, 12 * pulse, 0, Math.PI * 2);
        ctx.fill();
      } else if (col.type === 'weapon') {
        ctx.fillStyle = '#9b59b6';
        ctx.beginPath();
        ctx.arc(col.x, col.y, 15 * pulse, 0, Math.PI * 2);
        ctx.fill();
      } else if (col.type === 'secret') {
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.arc(col.x, col.y, 14 * pulse, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  renderEnemies(ctx) {
    for (const enemy of this.gameState.enemies) {
      if (enemy.type === 'droid') {
        ctx.fillStyle = '#7f8c8d';
        ctx.beginPath();
        ctx.arc(enemy.x + 15, enemy.y + 17, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(enemy.x + 15, enemy.y + 12, 8, 0, Math.PI * 2);
        ctx.fill();
      } else if (enemy.type === 'tank') {
        ctx.fillStyle = '#34495e';
        ctx.fillRect(enemy.x, enemy.y, 60, 60);
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(enemy.x + 10, enemy.y + 10, 40, 25);
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(enemy.x + 30, enemy.y + 45, 10, 0, Math.PI * 2);
        ctx.fill();
      } else if (enemy.type === 'sentinel') {
        ctx.fillStyle = '#8e44ad';
        ctx.fillRect(enemy.x, enemy.y, 40, 50);
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(enemy.x + 20, enemy.y + 15, 12, 0, Math.PI * 2);
        ctx.fill();
      } else if (enemy.type === 'assassin') {
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(enemy.x, enemy.y, 28, 45);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(enemy.x + 20, enemy.y + 10, 15, 8);
      } else if (enemy.type === 'flyingDrone') {
        ctx.fillStyle = '#95a5a6';
        ctx.beginPath();
        ctx.arc(enemy.x + 12, enemy.y + 12, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(enemy.x + 12, enemy.y + 8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#95a5a6';
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y + 12);
        ctx.lineTo(enemy.x - 8, enemy.y);
        ctx.lineTo(enemy.x - 8, enemy.y + 24);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(enemy.x + 24, enemy.y + 12);
        ctx.lineTo(enemy.x + 36, enemy.y);
        ctx.lineTo(enemy.x + 36, enemy.y + 24);
        ctx.fill();
      } else if (enemy.type === 'sentry') {
        ctx.fillStyle = '#d35400';
        ctx.beginPath();
        ctx.arc(enemy.x + 17, enemy.y + 20, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(enemy.x + 17, enemy.y + 15, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  renderParticles(ctx) {
    for (const p of this.gameState.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.min(1, p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  
  renderProjectiles(ctx) {
    for (const proj of this.gameState.projectiles) {
      if (proj.type === 'sword') {
        ctx.fillStyle = '#f1c40f';
        ctx.shadowColor = '#f1c40f';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (proj.type === 'shuriken') {
        ctx.fillStyle = '#95a5a6';
        for (let i = 0; i < 4; i++) {
          ctx.save();
          ctx.translate(proj.x, proj.y);
          ctx.rotate(this.gameState.time * 10 + i * Math.PI / 2);
          ctx.fillRect(-6, -1, 12, 2);
          ctx.fillRect(-1, -6, 2, 12);
          ctx.restore();
        }
      } else {
        ctx.fillStyle = proj.owner === 'player' ? '#3498db' : '#e74c3c';
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  renderPlayer(ctx) {
    const player = this.gameState.player;
    
    if (player.invulnerable > 0 && Math.floor(this.gameState.time * 15) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }
    
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    ctx.fillStyle = player.cosmetics.maskColor;
    ctx.fillRect(player.x + 4, player.y + 8, player.width - 8, 18);
    
    ctx.fillStyle = '#f5d0c5';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y - 4, 12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000';
    const eyeX = player.facing > 0 ? player.x + player.width - 12 : player.x + 8;
    ctx.fillRect(eyeX, player.y - 2, 4, 4);
    
    if (player.isDashing) {
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(player.x + player.width / 2, player.y + player.height / 2);
      ctx.lineTo(player.x + player.width / 2 - player.facing * 25, player.y + player.height / 2);
      ctx.stroke();
    }
    
    if (player.isWallRunning) {
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(player.x + (player.wallDir > 0 ? player.width : 0), player.y + 10);
      ctx.lineTo(player.x + (player.wallDir > 0 ? player.width : 0), player.y + player.height - 10);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
  }
  
  renderUI(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 220, 110);
    
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(20, 20, 180, 18);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(20, 20, 180 * (this.gameState.player.hp / this.gameState.player.maxHp), 18);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 180, 18);
    
    ctx.fillStyle = '#3498db';
    ctx.fillRect(20, 45, 180, 12);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(20, 45, 180 * (this.gameState.player.energy / this.gameState.player.maxEnergy), 12);
    ctx.strokeRect(20, 45, 180, 12);
    
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('HP: ' + Math.floor(this.gameState.player.hp) + '/' + this.gameState.player.maxHp, 25, 34);
    ctx.fillText('Energy: ' + Math.floor(this.gameState.player.energy), 25, 54);
    ctx.fillText('Score: ' + this.gameState.score, 20, 75);
    ctx.fillText('Kills: ' + this.gameState.kills, 20, 95);
    
    if (this.gameState.currentCombo > 0) {
      ctx.fillStyle = '#f1c40f';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(this.gameState.currentCombo + ' COMBO!', this.canvas.width - 20, 30);
    }
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CYBER NINJA', this.canvas.width / 2, 25);
  }
  
  renderGameOver(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 52px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 40);
    
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText('Final Score: ' + this.gameState.score, this.canvas.width / 2, this.canvas.height / 2 + 20);
    ctx.fillText('Enemies Defeated: ' + this.gameState.kills, this.canvas.width / 2, this.canvas.height / 2 + 55);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.CyberNinjaPlatformer = CyberNinjaPlatformer;