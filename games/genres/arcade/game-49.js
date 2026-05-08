// Super Arcade Platformer - Full 500+ Lines
class SuperArcadePlatformer {
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
      lives: 5,
      level: 1,
      worldWidth: 4000,
      worldHeight: 600,
      cameraX: 0,
      cameraY: 0,
      player: null,
      platforms: [],
      enemies: [],
      coins: [],
      powerups: [],
      particles: [],
      collectibles: [],
      checkpoints: [],
      doors: [],
      hazards: [],
      secrets: [],
      keys: [],
      boss: null,
      gameTime: 0,
      totalTime: 0,
      frameCount: 0,
      lastSaveTime: 0,
      checkpointsReached: [],
      status: 'playing',
      gameOver: false,
      paused: false,
      won: false
    };
    
    this.physics = {
      gravity: 1800,
      maxFallSpeed: 800,
      jumpForce: 650,
      moveSpeed: 350,
      runSpeed: 500,
      acceleration: 2000,
      friction: 0.85,
      airFriction: 0.92,
      wallSlideSpeed: 100,
      wallJumpForceX: 400,
      wallJumpForceY: 550,
      knockbackForce: 300,
      bounceForce: 200
    };
    
    this.inputState = {};
    this.animationTimer = 0;
    this.screenShake = { x: 0, y: 0, intensity: 0 };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = this.createPlayer(150, 450);
    this.gameState.checkpointsReached = [];
    this.createLevel();
  }
  
  createPlayer(x, y) {
    return {
      x: x,
      y: y,
      width: 32,
      height: 48,
      vx: 0,
      vy: 0,
      grounded: false,
      onWall: false,
      wallDir: 0,
      facing: 1,
      state: 'idle',
      frame: 0,
      hp: 100,
      maxHp: 100,
      invulnerable: 0,
      invincible: 0,
      speedBoost: 0,
      jumpBoost: 0,
      hasDoubleJump: false,
      doubleJumpUsed: false,
      hasDash: false,
      dashCooldown: 0,
      dashActive: false,
      dashTimer: 0,
      hasWallJump: false,
      hasGrapple: false,
      grappleTarget: null,
      canGrapple: false,
      keys: [],
      coins: 0,
      gems: 0,
      powerups: []
    };
  }
  
  createLevel() {
    this.gameState.platforms = [];
    this.gameState.enemies = [];
    this.gameState.coins = [];
    this.gameState.powerups = [];
    this.gameState.hazards = [];
    this.gameState.checkpoints = [];
    this.gameState.doors = [];
    this.gameState.secrets = [];
    this.gameState.keys = [];
    
    this.gameState.platforms.push(
      { x: 0, y: 550, width: 400, height: 50, type: 'ground', color: '#4a4a4a', special: null },
      { x: 450, y: 500, width: 150, height: 25, type: 'platform', color: '#8b4513', special: null },
      { x: 650, y: 450, width: 120, height: 25, type: 'platform', color: '#8b4513', special: null },
      { x: 850, y: 400, width: 150, height: 25, type: 'platform', color: '#8b4513', special: null },
      { x: 1050, y: 480, width: 200, height: 25, type: 'platform', color: '#8b4513', special: null },
      { x: 1300, y: 420, width: 100, height: 25, type: 'moving', color: '#8b4513', special: { startX: 1300, endX: 1450, speed: 2 } },
      { x: 1500, y: 350, width: 150, height: 25, type: 'platform', color: '#8b4513', special: null },
      { x: 1750, y: 280, width: 120, height: 25, type: 'platform', color: '#8b4513', special: null },
      { x: 1950, y: 350, width: 180, height: 25, type: 'platform', color: '#8b4513', special: null },
      { x: 2200, y: 400, width: 150, height: 25, type: 'platform', color: '#8b4513', special: null },
      { x: 2400, y: 350, width: 100, height: 25, type: 'platform', color: '#8b4513', special: null },
      { x: 2550, y: 300, width: 150, height: 25, type: 'platform', color: '#8b4513', special: null },
      { x: 2750, y: 250, width: 120, height: 25, type: 'platform', color: '#8b4513', special: null },
      { x: 2950, y: 300, width: 200, height: 25, type: 'platform', color: '#8b4513', special: null },
      { x: 3200, y: 350, width: 150, height: 25, type: 'platform', color: '#8b4513', special: null },
      { x: 3400, y: 400, width: 200, height: 25, type: 'platform', color: '#8b4513', special: null },
      { x: 3650, y: 350, width: 150, height: 25, type: 'platform', color: '#8b4513', special: null },
      { x: 0, y: 200, width: 50, height: 400, type: 'wall', color: '#2c3e50', special: null },
      { x: 3950, y: 200, width: 50, height: 400, type: 'wall', color: '#2c3e50', special: null }
    );
    
    this.gameState.enemies.push(
      { x: 500, y: 518, type: 'goomba', hp: 30, vx: 50, vy: 0, width: 30, height: 32, state: 'walking', patrolStart: 450, patrolEnd: 600 },
      { x: 900, y: 368, type: 'koopa', hp: 50, vx: 40, vy: 0, width: 28, height: 40, state: 'walking', shell: false, patrolStart: 850, patrolEnd: 1000 },
      { x: 1100, y: 448, type: 'goomba', hp: 30, vx: 60, vy: 0, width: 30, height: 32, state: 'walking', patrolStart: 1050, patrolEnd: 1250 },
      { x: 1600, y: 318, type: 'flying', hp: 20, vx: 30, vy: 20, width: 28, height: 28, state: 'flying', amplitude: 50, frequency: 2, startX: 1550, startY: 350 },
      { x: 2000, y: 318, type: 'koopa', hp: 50, vx: 40, vy: 0, width: 28, height: 40, state: 'walking', shell: false, patrolStart: 1950, patrolEnd: 2200 },
      { x: 2300, y: 368, type: 'goomba', hp: 30, vx: 50, vy: 0, width: 30, height: 32, state: 'walking', patrolStart: 2200, patrolEnd: 2450 },
      { x: 2600, y: 268, type: 'flying', hp: 20, vx: 40, vy: 30, width: 28, height: 28, state: 'flying', amplitude: 60, frequency: 3, startX: 2550, startY: 300 },
      { x: 2800, y: 268, type: 'shooter', hp: 40, vx: 20, vy: 0, width: 30, height: 32, state: 'idle', shootTimer: 2 },
      { x: 3100, y: 318, type: 'goomba', hp: 30, vx: 55, vy: 0, width: 30, height: 32, state: 'walking', patrolStart: 2950, patrolEnd: 3250 },
      { x: 3500, y: 368, type: 'koopa', hp: 50, vx: 45, vy: 0, width: 28, height: 40, state: 'walking', shell: false, patrolStart: 3400, patrolEnd: 3650 }
    );
    
    this.gameState.coins.push(
      { x: 475, y: 460, collected: false },
      { x: 525, y: 460, collected: false },
      { x: 700, y: 410, collected: false },
      { x: 720, y: 410, collected: false },
      { x: 900, y: 360, collected: false },
      { x: 920, y: 360, collected: false },
      { x: 1125, y: 440, collected: false },
      { x: 1150, y: 420, collected: false },
      { x: 1175, y: 440, collected: false },
      { x: 1575, y: 310, collected: false },
      { x: 1600, y: 290, collected: false },
      { x: 1625, y: 310, collected: false },
      { x: 1775, y: 240, collected: false },
      { x: 1800, y: 220, collected: false },
      { x: 2050, y: 310, collected: false },
      { x: 2075, y: 330, collected: false },
      { x: 2325, y: 310, collected: false },
      { x: 2350, y: 290, collected: false },
      { x: 2575, y: 260, collected: false },
      { x: 2600, y: 240, collected: false },
      { x: 2625, y: 260, collected: false },
      { x: 2875, y: 210, collected: false },
      { x: 2900, y: 190, collected: false },
      { x: 3075, y: 270, collected: false },
      { x: 3100, y: 250, collected: false },
      { x: 3475, y: 360, collected: false },
      { x: 3500, y: 340, collected: false },
      { x: 3525, y: 360, collected: false },
      { x: 3725, y: 310, collected: false },
      { x: 3750, y: 290, collected: false }
    );
    
    this.gameState.powerups.push(
      { x: 575, y: 460, type: 'mushroom', collected: false },
      { x: 1850, y: 310, type: 'flower', collected: false },
      { x: 2750, y: 210, type: 'star', collected: false },
      { x: 3350, y: 310, type: 'mushroom', collected: false }
    );
    
    this.gameState.hazards.push(
      { x: 1350, y: 540, width: 30, height: 20, type: 'spike' },
      { x: 1380, y: 540, width: 30, height: 20, type: 'spike' },
      { x: 2050, y: 540, width: 30, height: 20, type: 'spike' },
      { x: 2080, y: 540, width: 30, height: 20, type: 'spike' },
      { x: 3000, y: 540, width: 30, height: 20, type: 'spike' }
    );
    
    this.gameState.checkpoints.push(
      { x: 950, y: 350, reached: false, id: 1 },
      { x: 2100, y: 350, reached: false, id: 2 },
      { x: 3200, y: 350, reached: false, id: 3 }
    );
    
    this.gameState.doors.push(
      { x: 3850, y: 450, width: 40, height: 100, destination: 'level2', locked: true }
    );
    
    this.gameState.keys.push(
      { x: 1850, y: 180, collected: false, id: 1, color: '#f1c40f' },
      { x: 2750, y: 150, collected: false, id: 2, color: '#e74c3c' },
      { x: 3650, y: 250, collected: false, id: 3, color: '#3498db' }
    );
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
    if (this.gameState.paused || this.gameState.gameOver || this.gameState.won) return;
    
    this.gameState.time += deltaTime;
    this.gameState.totalTime += deltaTime;
    this.gameState.frameCount++;
    this.animationTimer += deltaTime;
    
    this.handleInput();
    this.updatePlayer(deltaTime);
    this.updateEnemies(deltaTime);
    this.updatePlatforms(deltaTime);
    this.checkCollisions();
    this.updateCamera();
    this.updateParticles(deltaTime);
    this.updateScreenShake(deltaTime);
    
    if (this.gameState.player.y > this.gameState.worldHeight + 100) {
      this.playerDies();
    }
  }
  
  handleInput() {
    const player = this.gameState.player;
    const input = this.getPlayerInput(this.players[0]);
    
    this.inputState = input;
    
    if (input.left) {
      player.vx -= this.physics.acceleration * 0.016;
      player.vx = Math.max(-player.speedBoost > 0 ? this.physics.runSpeed : this.physics.moveSpeed, player.vx);
      player.facing = -1;
      player.state = 'running';
    } else if (input.right) {
      player.vx += this.physics.acceleration * 0.016;
      player.vx = Math.min(player.speedBoost > 0 ? this.physics.runSpeed : this.physics.moveSpeed, player.vx);
      player.facing = 1;
      player.state = 'running';
    } else {
      player.vx *= player.grounded ? this.physics.friction : this.physics.airFriction;
      if (Math.abs(player.vx) < 10) {
        player.vx = 0;
        player.state = 'idle';
      }
    }
    
    if (input.jump && player.grounded) {
      player.vy = -this.physics.jumpForce + player.jumpBoost;
      player.grounded = false;
      player.doubleJumpUsed = false;
      this.spawnJumpParticles();
    }
    
    if (input.jump && !player.grounded && player.hasDoubleJump && !player.doubleJumpUsed) {
      player.vy = -this.physics.jumpForce * 0.8;
      player.doubleJumpUsed = true;
      this.spawnDoubleJumpParticles();
    }
    
    if (input.dash && player.hasDash && player.dashCooldown <= 0 && !player.dashActive) {
      player.dashActive = true;
      player.dashTimer = 0.2;
      player.dashCooldown = 1;
      player.vx = player.facing * 600;
      player.vy = 0;
      this.spawnDashParticles();
    }
  }
  
  updatePlayer(deltaTime) {
    const player = this.gameState.player;
    
    player.vy += this.physics.gravity * deltaTime;
    player.vy = Math.min(player.vy, this.physics.maxFallSpeed);
    
    player.x += player.vx * deltaTime;
    this.handleHorizontalCollisions();
    
    player.y += player.vy * deltaTime;
    player.grounded = false;
    this.handleVerticalCollisions();
    
    if (player.onWall && !player.grounded && player.vy > 0) {
      player.vy = Math.min(player.vy, this.physics.wallSlideSpeed);
      if (this.inputState.jump) {
        player.vy = -this.physics.wallJumpForceY;
        player.vx = -player.wallDir * this.physics.wallJumpForceX;
        this.spawnWallJumpParticles();
      }
    }
    
    if (player.dashActive) {
      player.dashTimer -= deltaTime;
      if (player.dashTimer <= 0) {
        player.dashActive = false;
        player.vx *= 0.5;
        player.vy *= 0.5;
      }
    }
    
    if (player.dashCooldown > 0) player.dashCooldown -= deltaTime;
    if (player.invulnerable > 0) player.invulnerable -= deltaTime;
    if (player.invincible > 0) player.invincible -= deltaTime;
    if (player.speedBoost > 0) player.speedBoost -= deltaTime;
    if (player.jumpBoost > 0) player.jumpBoost -= deltaTime;
    
    player.x = Math.max(20, Math.min(this.gameState.worldWidth - player.width - 20, player.x));
    
    if (Math.abs(player.vx) > 50 && player.grounded) {
      this.spawnDustParticles();
    }
    
    player.frame += Math.abs(player.vx) * 0.01;
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
        player.doubleJumpUsed = false;
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
      if (enemy.type === 'goomba' || enemy.type === 'koopa') {
        enemy.x += enemy.vx * deltaTime;
        if (enemy.x <= enemy.patrolStart || enemy.x >= enemy.patrolEnd) {
          enemy.vx *= -1;
        }
        
        if (enemy.type === 'koopa' && enemy.shell && enemy.vx !== 0) {
          this.gameState.enemies.forEach(other => {
            if (other !== enemy && Math.abs(other.x - enemy.x) < 40 && Math.abs(other.y - enemy.y) < 20) {
              other.vx = enemy.vx > 0 ? 200 : -200;
            }
          });
        }
      } else if (enemy.type === 'flying') {
        enemy.x += enemy.vx * deltaTime;
        enemy.y = enemy.startY + Math.sin(this.gameState.time * enemy.frequency) * enemy.amplitude;
      } else if (enemy.type === 'shooter') {
        enemy.shootTimer -= deltaTime;
        if (enemy.shootTimer <= 0) {
          this.gameState.enemyBullets = this.gameState.enemyBullets || [];
          this.gameState.enemyBullets.push({
            x: enemy.x,
            y: enemy.y + 16,
            vx: -100,
            vy: 0,
            damage: 10
          });
          enemy.shootTimer = 2;
        }
      }
    }
  }
  
  updatePlatforms(deltaTime) {
    for (const platform of this.gameState.platforms) {
      if (platform.type === 'moving' && platform.special) {
        const special = platform.special;
        if (platform.x >= special.endX) {
          special.speed = -Math.abs(special.speed);
        } else if (platform.x <= special.startX) {
          special.speed = Math.abs(special.speed);
        }
        platform.x += special.speed;
      }
    }
  }
  
  checkCollisions() {
    const player = this.gameState.player;
    
    for (const coin of this.gameState.coins) {
      if (coin.collected) continue;
      const dx = (player.x + player.width / 2) - coin.x;
      const dy = (player.y + player.height / 2) - coin.y;
      if (Math.sqrt(dx * dx + dy * dy) < 25) {
        coin.collected = true;
        player.coins++;
        this.gameState.score += 50;
        this.spawnCoinParticles(coin.x, coin.y);
      }
    }
    
    for (const powerup of this.gameState.powerups) {
      if (powerup.collected) continue;
      const dx = (player.x + player.width / 2) - powerup.x;
      const dy = (player.y + player.height / 2) - powerup.y;
      if (Math.sqrt(dx * dx + dy * dy) < 30) {
        powerup.collected = true;
        this.applyPowerup(powerup.type);
        this.gameState.score += 200;
      }
    }
    
    for (const hazard of this.gameState.hazards) {
      if (this.checkHazardCollision(player, hazard)) {
        this.playerDies();
        break;
      }
    }
    
    for (const enemy of this.gameState.enemies) {
      if (this.checkEnemyCollision(player, enemy)) {
        if (player.vy > 0 && player.y + player.height < enemy.y + 10) {
          enemy.hp -= 30;
          player.vy = -200;
          this.gameState.score += 100;
          this.spawnEnemyHitParticles(enemy.x, enemy.y);
          if (enemy.hp <= 0) {
            this.gameState.score += enemy.type === 'koopa' ? 200 : 100;
          }
        } else if (player.invincible <= 0) {
          this.playerHit();
        }
      }
    }
    
    for (const checkpoint of this.gameState.checkpoints) {
      if (!checkpoint.reached) {
        const dx = (player.x + player.width / 2) - checkpoint.x;
        const dy = (player.y + player.height / 2) - checkpoint.y;
        if (Math.sqrt(dx * dx + dy * dy) < 40) {
          checkpoint.reached = true;
          this.gameState.checkpointsReached.push(checkpoint.id);
          player.hp = player.maxHp;
          this.gameState.score += 500;
        }
      }
    }
    
    for (const key of this.gameState.keys) {
      if (!key.collected) {
        const dx = (player.x + player.width / 2) - key.x;
        const dy = (player.y + player.height / 2) - key.y;
        if (Math.sqrt(dx * dx + dy * dy) < 25) {
          key.collected = true;
          player.keys.push(key.id);
          this.gameState.score += 300;
        }
      }
    }
  }
  
  checkHazardCollision(player, hazard) {
    return player.x < hazard.x + hazard.width &&
           player.x + player.width > hazard.x &&
           player.y < hazard.y + hazard.height &&
           player.y + player.height > hazard.y;
  }
  
  checkEnemyCollision(player, enemy) {
    return player.x < enemy.x + enemy.width &&
           player.x + player.width > enemy.x &&
           player.y < enemy.y + enemy.height &&
           player.y + player.height > enemy.y;
  }
  
  playerHit() {
    const player = this.gameState.player;
    player.hp -= 25;
    player.invulnerable = 1.5;
    player.vx = -player.facing * this.physics.knockbackForce;
    player.vy = -200;
    this.screenShake.intensity = 10;
    
    if (player.hp <= 0) {
      this.playerDies();
    }
  }
  
  playerDies() {
    this.gameState.lives--;
    if (this.gameState.lives <= 0) {
      this.gameState.gameOver = true;
    } else {
      const lastCheckpoint = this.gameState.checkpointsReached.length > 0
        ? this.gameState.checkpoints.find(c => c.id === Math.max(...this.gameState.checkpointsReached))
        : null;
      
      const spawnX = lastCheckpoint ? lastCheckpoint.x : 150;
      const spawnY = lastCheckpoint ? lastCheckpoint.y - 100 : 450;
      
      this.gameState.player.x = spawnX;
      this.gameState.player.y = spawnY;
      this.gameState.player.vx = 0;
      this.gameState.player.vy = 0;
      this.gameState.player.hp = this.gameState.player.maxHp;
      this.gameState.player.invulnerable = 2;
    }
  }
  
  applyPowerup(type) {
    const player = this.gameState.player;
    switch (type) {
      case 'mushroom':
        player.maxHp = 200;
        player.hp = Math.min(player.hp + 50, player.maxHp);
        break;
      case 'flower':
        player.hasDoubleJump = true;
        break;
      case 'star':
        player.invincible = 10;
        player.speedBoost = 5;
        player.jumpBoost = 100;
        break;
    }
  }
  
  updateCamera() {
    const player = this.gameState.player;
    const targetX = player.x - this.canvas.width / 3;
    const targetY = player.y - this.canvas.height / 2;
    
    this.gameState.cameraX += (targetX - this.gameState.cameraX) * 0.1;
    this.gameState.cameraY += (targetY - this.gameState.cameraY) * 0.1;
    
    this.gameState.cameraX = Math.max(0, Math.min(this.gameState.worldWidth - this.canvas.width, this.gameState.cameraX));
    this.gameState.cameraY = Math.max(0, Math.min(this.gameState.worldHeight - this.canvas.height, this.gameState.cameraY));
  }
  
  updateParticles(deltaTime) {
    for (let i = this.gameState.particles.length - 1; i >= 0; i--) {
      const p = this.gameState.particles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.vy += 300 * deltaTime;
      p.life -= deltaTime;
      if (p.life <= 0) {
        this.gameState.particles.splice(i, 1);
      }
    }
  }
  
  updateScreenShake(deltaTime) {
    if (this.screenShake.intensity > 0) {
      this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
      this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
      this.screenShake.intensity *= 0.9;
      if (this.screenShake.intensity < 0.5) {
        this.screenShake.intensity = 0;
        this.screenShake.x = 0;
        this.screenShake.y = 0;
      }
    }
  }
  
  spawnJumpParticles() {
    for (let i = 0; i < 8; i++) {
      this.gameState.particles.push({
        x: this.gameState.player.x + this.gameState.player.width / 2,
        y: this.gameState.player.y + this.gameState.player.height,
        vx: (Math.random() - 0.5) * 100,
        vy: Math.random() * 50,
        life: 0.4,
        color: '#fff',
        size: 4
      });
    }
  }
  
  spawnDoubleJumpParticles() {
    for (let i = 0; i < 12; i++) {
      this.gameState.particles.push({
        x: this.gameState.player.x + this.gameState.player.width / 2,
        y: this.gameState.player.y + this.gameState.player.height / 2,
        vx: (Math.random() - 0.5) * 150,
        vy: (Math.random() - 0.5) * 150,
        life: 0.5,
        color: '#3498db',
        size: 5
      });
    }
  }
  
  spawnDashParticles() {
    for (let i = 0; i < 15; i++) {
      this.gameState.particles.push({
        x: this.gameState.player.x + this.gameState.player.width / 2,
        y: this.gameState.player.y + this.gameState.player.height / 2,
        vx: -this.gameState.player.facing * 50 + (Math.random() - 0.5) * 80,
        vy: (Math.random() - 0.5) * 80,
        life: 0.3,
        color: '#f1c40f',
        size: 6
      });
    }
  }
  
  spawnWallJumpParticles() {
    for (let i = 0; i < 10; i++) {
      this.gameState.particles.push({
        x: this.gameState.player.x + (this.gameState.player.wallDir > 0 ? this.gameState.player.width : 0),
        y: this.gameState.player.y + this.gameState.player.height / 2,
        vx: -this.gameState.player.wallDir * 80,
        vy: (Math.random() - 0.5) * 100,
        life: 0.4,
        color: '#e74c3c',
        size: 4
      });
    }
  }
  
  spawnDustParticles() {
    if (Math.random() < 0.3) {
      this.gameState.particles.push({
        x: this.gameState.player.x + this.gameState.player.width / 2,
        y: this.gameState.player.y + this.gameState.player.height - 5,
        vx: -this.gameState.player.facing * 20,
        vy: -Math.random() * 30,
        life: 0.3,
        color: '#bdc3c7',
        size: 3
      });
    }
  }
  
  spawnCoinParticles(x, y) {
    for (let i = 0; i < 10; i++) {
      this.gameState.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 150,
        vy: -Math.random() * 200 - 50,
        life: 0.6,
        color: '#f1c40f',
        size: 4
      });
    }
  }
  
  spawnEnemyHitParticles(x, y) {
    for (let i = 0; i < 15; i++) {
      this.gameState.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        life: 0.5,
        color: ['#e74c3c', '#f1c40f', '#fff'][Math.floor(Math.random() * 3)],
        size: 5
      });
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    const ctx = this.ctx;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(0.5, '#b0e0e6');
    gradient.addColorStop(1, '#228b22');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    ctx.save();
    ctx.translate(-this.gameState.cameraX + this.screenShake.x, -this.gameState.cameraY + this.screenShake.y);
    
    this.renderPlatforms(ctx);
    this.renderHazards(ctx);
    this.renderCheckpoints(ctx);
    this.renderCoins(ctx);
    this.renderPowerups(ctx);
    this.renderKeys(ctx);
    this.renderDoors(ctx);
    this.renderEnemies(ctx);
    this.renderPlayer(ctx);
    this.renderParticles(ctx);
    this.renderUI(ctx);
    
    ctx.restore();
    
    if (this.gameState.gameOver) {
      this.renderGameOver(ctx);
    }
    
    if (this.gameState.won) {
      this.renderVictory(ctx);
    }
  }
  
  renderPlatforms(ctx) {
    for (const platform of this.gameState.platforms) {
      if (platform.type === 'ground') {
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(platform.x, platform.y, platform.width, 10);
      } else if (platform.type === 'wall') {
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      } else {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        
        if (platform.type === 'moving') {
          ctx.fillStyle = '#f1c40f';
          ctx.font = '12px Arial';
          ctx.fillText('→', platform.x + platform.width / 2 - 5, platform.y + 15);
        }
      }
    }
  }
  
  renderHazards(ctx) {
    for (const hazard of this.gameState.hazards) {
      ctx.fillStyle = '#e74c3c';
      for (let i = 0; i < hazard.width; i += 10) {
        ctx.beginPath();
        ctx.moveTo(hazard.x + i, hazard.y + hazard.height);
        ctx.lineTo(hazard.x + i + 5, hazard.y);
        ctx.lineTo(hazard.x + i + 10, hazard.y + hazard.height);
        ctx.fill();
      }
    }
  }
  
  renderCheckpoints(ctx) {
    for (const checkpoint of this.gameState.checkpoints) {
      ctx.fillStyle = checkpoint.reached ? '#2ecc71' : '#7f8c8d';
      ctx.fillRect(checkpoint.x - 10, checkpoint.y - 40, 20, 40);
      ctx.fillStyle = checkpoint.reached ? '#27ae60' : '#95a5a6';
      ctx.fillRect(checkpoint.x - 8, checkpoint.y - 38, 16, 36);
      
      ctx.fillStyle = '#fff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(checkpoint.reached ? '✓' : String(checkpoint.id), checkpoint.x, checkpoint.y - 20);
    }
  }
  
  renderCoins(ctx) {
    for (const coin of this.gameState.coins) {
      if (coin.collected) continue;
      
      const bounce = Math.sin(this.animationTimer * 3 + coin.x * 0.1) * 3;
      
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(coin.x, coin.y + bounce, 10, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.arc(coin.x, coin.y + bounce, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  renderPowerups(ctx) {
    for (const powerup of this.gameState.powerups) {
      if (powerup.collected) continue;
      
      const bounce = Math.sin(this.animationTimer * 2) * 5;
      
      if (powerup.type === 'mushroom') {
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(powerup.x, powerup.y + bounce, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f5d0c5';
        ctx.beginPath();
        ctx.arc(powerup.x, powerup.y - 5 + bounce, 8, 0, Math.PI * 2);
        ctx.fill();
      } else if (powerup.type === 'flower') {
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(powerup.x, powerup.y + bounce, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(powerup.x - 5, powerup.y - 5 + bounce, 5, 0, Math.PI * 2);
        ctx.arc(powerup.x + 5, powerup.y - 5 + bounce, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (powerup.type === 'star') {
        ctx.fillStyle = '#f1c40f';
        ctx.shadowColor = '#f1c40f';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        this.drawStar(ctx, powerup.x, powerup.y + bounce, 5, 15, 8);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }
  
  drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;
      
      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }
  
  renderKeys(ctx) {
    for (const key of this.gameState.keys) {
      if (key.collected) continue;
      
      const sway = Math.sin(this.animationTimer * 2) * 5;
      
      ctx.fillStyle = key.color;
      ctx.beginPath();
      ctx.arc(key.x, key.y + sway, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(key.x - 3, key.y + sway + 8, 6, 12);
    }
  }
  
  renderDoors(ctx) {
    for (const door of this.gameState.doors) {
      ctx.fillStyle = door.locked ? '#7f8c8d' : '#2ecc71';
      ctx.fillRect(door.x, door.y, door.width, door.height);
      
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(door.x + 5, door.y + 5, door.width - 10, door.height - 5);
      
      if (door.locked) {
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(door.x + door.width / 2, door.y + door.height / 2, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  renderEnemies(ctx) {
    for (const enemy of this.gameState.enemies) {
      if (enemy.type === 'goomba') {
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.arc(enemy.x + 15, enemy.y + 16, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f5d0c4';
        ctx.fillRect(enemy.x + 5, enemy.y + 8, 20, 8);
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(enemy.x + 10, enemy.y + 10, 3, 0, Math.PI * 2);
        ctx.arc(enemy.x + 20, enemy.y + 10, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (enemy.type === 'koopa') {
        ctx.fillStyle = enemy.shell ? '#27ae60' : '#2ecc71';
        if (enemy.shell) {
          ctx.beginPath();
          ctx.arc(enemy.x + 14, enemy.y + 20, 14, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(enemy.x, enemy.y, 28, 40);
          ctx.fillStyle = '#c0392b';
          ctx.fillRect(enemy.x, enemy.y, 28, 12);
        }
      } else if (enemy.type === 'flying') {
        ctx.fillStyle = '#9b59b6';
        ctx.beginPath();
        ctx.arc(enemy.x + 14, enemy.y + 14, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8e44ad';
        ctx.beginPath();
        ctx.moveTo(enemy.x + 14, enemy.y + 14);
        ctx.lineTo(enemy.x - 10, enemy.y);
        ctx.lineTo(enemy.x - 10, enemy.y + 28);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(enemy.x + 14, enemy.y + 14);
        ctx.lineTo(enemy.x + 38, enemy.y);
        ctx.lineTo(enemy.x + 38, enemy.y + 28);
        ctx.fill();
      } else if (enemy.type === 'shooter') {
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(enemy.x, enemy.y, 30, 32);
        ctx.fillStyle = '#fff';
        ctx.fillRect(enemy.x + 8, enemy.y + 10, 14, 4);
        ctx.fillRect(enemy.x + 12, enemy.y + 6, 6, 4);
      }
    }
  }
  
  renderPlayer(ctx) {
    const player = this.gameState.player;
    
    if (player.invulnerable > 0 && Math.floor(this.gameState.time * 10) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }
    
    ctx.fillStyle = '#3498db';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    ctx.fillStyle = '#2980b9';
    ctx.fillRect(player.x, player.y + 20, player.width, player.height - 20);
    
    ctx.fillStyle = '#f5d0c5';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y - 5, 14, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000';
    const eyeX = player.facing > 0 ? player.x + 20 : player.x + 8;
    ctx.fillRect(eyeX, player.y - 8, 4, 5);
    
    if (player.dashActive) {
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(player.x + player.width / 2, player.y + player.height / 2);
      ctx.lineTo(player.x + player.width / 2 - player.facing * 30, player.y + player.height / 2);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
  }
  
  renderParticles(ctx) {
    for (const p of this.gameState.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  
  renderUI(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 100);
    
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(20, 20, 180, 20);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(20, 20, 180 * (this.gameState.player.hp / this.gameState.player.maxHp), 20);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 180, 20);
    
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('HP', 25, 35);
    
    ctx.fillStyle = '#f1c40f';
    ctx.fillText('⭐ ' + this.gameState.player.coins, 20, 60);
    
    ctx.fillStyle = '#9b59b6';
    ctx.fillText('Keys: ' + this.gameState.player.keys.length + '/3', 20, 80);
    
    ctx.fillStyle = '#fff';
    ctx.fillText('Score: ' + this.gameState.score, 20, 100);
    
    ctx.fillStyle = '#3498db';
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('SUPER ARCADE PLATFORMER', this.canvas.width / 2, 25);
    
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Level: ' + this.gameState.level, this.canvas.width - 100, 30);
    ctx.fillText('Lives: ' + this.gameState.lives, this.canvas.width - 100, 50);
  }
  
  renderGameOver(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText('Final Score: ' + this.gameState.score, this.canvas.width / 2, this.canvas.height / 2 + 20);
    ctx.fillText('Coins: ' + this.gameState.player.coins, this.canvas.width / 2, this.canvas.height / 2 + 50);
  }
  
  renderVictory(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('YOU WIN!', this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText('Final Score: ' + this.gameState.score, this.canvas.width / 2, this.canvas.height / 2 + 20);
    ctx.fillText('Time: ' + Math.floor(this.gameState.totalTime) + 's', this.canvas.width / 2, this.canvas.height / 2 + 50);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.SuperArcadePlatformer = SuperArcadePlatformer;