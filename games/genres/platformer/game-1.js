// Super Jump Platformer - Full Game Implementation
class PlatformerGame {
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
      moveSpeed: 6,
      levelWidth: 3000,
      levelHeight: 800,
      cameraSpeed: 0.1
    };
    
    this.gameState = {
      players: {},
      time: 0,
      level: 1,
      score: 0,
      status: 'playing',
      coins: [],
      enemies: [],
      platforms: [],
      powerups: [],
      checkpoints: []
    };
    
    this.player = null;
    this.camera = { x: 0, y: 0 };
    this.particles = [];
    this.animations = [];
    
    this.generateLevel();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  generateLevel() {
    this.gameState.platforms = [];
    
    // Ground platforms
    this.gameState.platforms.push(
      { x: 0, y: this.canvas.height - 40, width: 500, height: 40, type: 'ground', decoration: 'grass' },
      { x: 600, y: this.canvas.height - 40, width: 400, height: 40, type: 'ground', decoration: 'grass' },
      { x: 1100, y: this.canvas.height - 40, width: 600, height: 40, type: 'ground', decoration: 'grass' },
      { x: 1800, y: this.canvas.height - 40, width: 500, height: 40, type: 'ground', decoration: 'grass' },
      { x: 2400, y: this.canvas.height - 40, width: 600, height: 40, type: 'ground', decoration: 'grass' }
    );
    
    // Floating platforms
    this.gameState.platforms.push(
      { x: 200, y: this.canvas.height - 150, width: 120, height: 20, type: 'platform', decoration: 'stone' },
      { x: 400, y: this.canvas.height - 220, width: 100, height: 20, type: 'platform', decoration: 'wood' },
      { x: 650, y: this.canvas.height - 180, width: 150, height: 20, type: 'platform', decoration: 'stone' },
      { x: 850, y: this.canvas.height - 280, width: 100, height: 20, type: 'platform', decoration: 'wood' },
      { x: 1000, y: this.canvas.height - 150, width: 120, height: 20, type: 'platform', decoration: 'stone' },
      { x: 1200, y: this.canvas.height - 250, width: 80, height: 20, type: 'platform', decoration: 'wood' },
      { x: 1400, y: this.canvas.height - 180, width: 100, height: 20, type: 'platform', decoration: 'stone' },
      { x: 1600, y: this.canvas.height - 300, width: 150, height: 20, type: 'platform', decoration: 'gold' },
      { x: 1850, y: this.canvas.height - 200, width: 100, height: 20, type: 'platform', decoration: 'wood' },
      { x: 2000, y: this.canvas.height - 280, width: 120, height: 20, type: 'platform', decoration: 'stone' },
      { x: 2200, y: this.canvas.height - 150, width: 80, height: 20, type: 'platform', decoration: 'wood' },
      { x: 2400, y: this.canvas.height - 250, width: 100, height: 20, type: 'platform', decoration: 'gold' }
    );
    
    // Walls
    this.gameState.platforms.push(
      { x: -20, y: 0, width: 20, height: this.canvas.height, type: 'wall' },
      { x: this.config.levelWidth, y: 0, width: 20, height: this.canvas.height, type: 'wall' }
    );
    
    // Coins
    const coinPositions = [
      { x: 250, y: this.canvas.height - 200 }, { x: 450, y: this.canvas.height - 270 },
      { x: 700, y: this.canvas.height - 230 }, { x: 900, y: this.canvas.height - 330 },
      { x: 1050, y: this.canvas.height - 200 }, { x: 1250, y: this.canvas.height - 300 },
      { x: 1450, y: this.canvas.height - 230 }, { x: 1650, y: this.canvas.height - 350 },
      { x: 1900, y: this.canvas.height - 250 }, { x: 2050, y: this.canvas.height - 330 },
      { x: 2250, y: this.canvas.height - 200 }, { x: 2450, y: this.canvas.height - 300 },
      { x: 500, y: this.canvas.height - 100 }, { x: 1300, y: this.canvas.height - 100 },
      { x: 2100, y: this.canvas.height - 100 }
    ];
    
    this.gameState.coins = coinPositions.map(p => ({
      x: p.x, y: p.y, radius: 15, collected: false,
      animation: 0, rotation: Math.random() * Math.PI * 2
    }));
    
    // Enemies
    this.gameState.enemies = [
      this.createEnemy(350, this.canvas.height - 60, 'slime'),
      this.createEnemy(750, this.canvas.height - 60, 'bat'),
      this.createEnemy(1150, this.canvas.height - 60, 'slime'),
      this.createEnemy(1550, this.canvas.height - 60, 'spider'),
      this.createEnemy(1950, this.canvas.height - 60, 'slime'),
      this.createEnemy(2300, this.canvas.height - 60, 'bat'),
      this.createEnemy(650, this.canvas.height - 210, 'flying'),
      this.createEnemy(1450, this.canvas.height - 210, 'flying')
    ];
    
    // Power-ups
    this.gameState.powerups = [
      { x: 420, y: this.canvas.height - 280, type: 'jump', collected: false },
      { x: 1650, y: this.canvas.height - 350, type: 'speed', collected: false },
      { x: 2450, y: this.canvas.height - 300, type: 'invincible', collected: false }
    ];
    
    // Checkpoints
    this.gameState.checkpoints = [
      { x: 500, y: this.canvas.height - 80, activated: false },
      { x: 1400, y: this.canvas.height - 80, activated: false },
      { x: 2500, y: this.canvas.height - 80, activated: true }
    ];
  }
  
  createEnemy(x, y, type) {
    const enemies = {
      slime: { width: 30, height: 20, color: '#33cc33', speed: 1, range: 100, health: 2 },
      bat: { width: 25, height: 25, color: '#9933ff', speed: 2, range: 80, health: 1, flying: true },
      spider: { width: 35, height: 30, color: '#333333', speed: 1.5, range: 120, health: 3 },
      flying: { width: 30, height: 20, color: '#ff6666', speed: 3, range: 150, health: 1, flying: true }
    };
    
    const config = enemies[type];
    return {
      x, y, ...config, type,
      startX: x, startY: y, direction: 1,
      animation: 0, health: config.health, alive: true
    };
  }
  
  start() {
    this.player = this.players[0] || 'Player 1';
    
    this.gameState.players = {
      [this.player]: {
        name: this.player,
        x: 100,
        y: this.canvas.height - 100,
        vx: 0,
        vy: 0,
        width: 30,
        height: 40,
        color: '#ff6b6b',
        onGround: false,
        hasDoubleJump: true,
        health: 100,
        coins: 0,
        powerup: null,
        powerupTimer: 0,
        invincible: false,
        invincibleTimer: 0,
        facing: 1,
        state: 'idle',
        animation: 0
      }
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
    
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    this.update(deltaTime);
    this.render();
    
    requestAnimationFrame((time) => this.gameLoop(time));
  }
  
  update(deltaTime) {
    this.gameState.time += deltaTime;
    
    const player = this.gameState.players[this.player];
    if (!player) return;
    
    this.handleInput(player);
    this.applyPhysics(player, deltaTime);
    this.checkCollisions(player);
    this.updateCamera(player);
    this.updateCoins(deltaTime);
    this.updateEnemies(deltaTime);
    this.updatePowerups(player, deltaTime);
    this.updateParticles(deltaTime);
    
    if (player.invincible) {
      player.invincibleTimer -= deltaTime;
      if (player.invincibleTimer <= 0) {
        player.invincible = false;
      }
    }
    
    if (player.powerup) {
      player.powerupTimer -= deltaTime;
      if (player.powerupTimer <= 0) {
        player.powerup = null;
        this.config.jumpForce = -14;
        this.config.moveSpeed = 6;
      }
    }
    
    if (player.y > this.canvas.height + 100) {
      player.x = 100;
      player.y = this.canvas.height - 100;
      player.vy = 0;
    }
  }
  
  handleInput(player) {
    const input = this.getPlayerInput(player.name);
    
    player.vx = 0;
    
    if (input.left) {
      player.vx = -this.config.moveSpeed;
      player.facing = -1;
      player.state = 'running';
    } else if (input.right) {
      player.vx = this.config.moveSpeed;
      player.facing = 1;
      player.state = 'running';
    } else {
      player.state = 'idle';
    }
    
    if (input.up && player.onGround) {
      player.vy = this.config.jumpForce;
      player.onGround = false;
      player.hasDoubleJump = true;
      this.createJumpParticles(player);
    } else if (input.up && player.hasDoubleJump && this.config.doubleJump) {
      player.vy = this.config.jumpForce * 0.8;
      player.hasDoubleJump = false;
      this.createDoubleJumpParticles(player);
    }
    
    if (input.action && !player.attacking) {
      player.attacking = true;
      setTimeout(() => player.attacking = false, 300);
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? 
      window.gameState[playerName].input || {} : {};
  }
  
  applyPhysics(player, deltaTime) {
    player.vy += this.config.gravity;
    player.vy = Math.min(player.vy, 20);
    
    player.x += player.vx;
    player.y += player.vy;
    
    player.onGround = false;
  }
  
  checkCollisions(player) {
    this.gameState.platforms.forEach(platform => {
      if (this.checkPlatformCollision(player, platform)) {
        if (player.vy > 0 && player.y + player.height - player.vy <= platform.y) {
          player.y = platform.y - player.height;
          player.vy = 0;
          player.onGround = true;
        }
      }
    });
    
    // Keep player in bounds
    player.x = Math.max(0, Math.min(this.config.levelWidth - player.width, player.x));
  }
  
  checkPlatformCollision(player, platform) {
    return player.x < platform.x + platform.width &&
           player.x + player.width > platform.x &&
           player.y < platform.y + platform.height &&
           player.y + player.height > platform.y;
  }
  
  updateCamera(player) {
    const targetX = player.x - this.canvas.width / 3;
    this.camera.x += (targetX - this.camera.x) * this.config.cameraSpeed;
    this.camera.x = Math.max(0, Math.min(this.config.levelWidth - this.canvas.width, this.camera.x));
  }
  
  updateCoins(deltaTime) {
    this.gameState.coins.forEach(coin => {
      if (coin.collected) return;
      
      coin.animation += deltaTime * 3;
      coin.rotation += deltaTime * 2;
      
      const player = this.gameState.players[this.player];
      const dx = (player.x + player.width / 2) - coin.x;
      const dy = (player.y + player.height / 2) - coin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 40) {
        coin.collected = true;
        player.coins++;
        this.gameState.score += 10;
        this.createCoinParticles(coin.x, coin.y);
      }
    });
  }
  
  updateEnemies(deltaTime) {
    const player = this.gameState.players[this.player];
    
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      
      // Movement
      if (!enemy.flying) {
        enemy.x += enemy.speed * enemy.direction;
        if (enemy.x > enemy.startX + enemy.range || enemy.x < enemy.startX - enemy.range) {
          enemy.direction *= -1;
        }
      } else {
        enemy.animation += deltaTime * 5;
        enemy.y = enemy.startY + Math.sin(enemy.animation) * 30;
      }
      
      // Check collision with player
      if (this.checkCollision(player, enemy) && !player.invincible) {
        if (player.vy > 0 && player.y + player.height - player.vy < enemy.y + enemy.height * 0.5) {
          // Jump on enemy
          enemy.health--;
          player.vy = -10;
          if (enemy.health <= 0) {
            enemy.alive = false;
            this.gameState.score += 50;
          }
        } else {
          player.y = enemy.y - player.height;
          player.vy = -5;
          this.gameState.score = Math.max(0, this.gameState.score - 5);
        }
      }
    });
  }
  
  checkCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
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
    const powerups = {
      jump: () => { this.config.jumpForce = -18; player.powerup = 'jump'; },
      speed: () => { this.config.moveSpeed = 10; player.powerup = 'speed'; },
      invincible: () => { player.invincible = true; player.invincibleTimer = 10; }
    };
    
    if (powerups[type]) {
      powerups[type]();
      player.powerupTimer = 10;
      this.gameState.score += 25;
    }
  }
  
  createJumpParticles(player) {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: player.x + player.width / 2,
        y: player.y + player.height,
        vx: (Math.random() - 0.5) * 5,
        vy: Math.random() * -3,
        life: 0.5,
        color: '#fff',
        size: 5
      });
    }
  }
  
  createDoubleJumpParticles(player) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 0.7,
        color: '#ffd93d',
        size: 6
      });
    }
  }
  
  createCoinParticles(x, y) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 3,
        life: 1,
        color: '#ffd93d',
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
    // Sky background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F7FA');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Clouds
    this.drawClouds();
    
    // Parallax background
    this.ctx.save();
    this.ctx.translate(-this.camera.x * 0.3, 0);
    this.drawMountains();
    this.ctx.restore();
    
    // Game world
    this.ctx.save();
    this.ctx.translate(-this.camera.x, -this.camera.y);
    
    this.drawPlatforms();
    this.drawCheckpoints();
    this.drawCoins();
    this.drawEnemies();
    this.drawPowerups();
    this.drawPlayer();
    this.drawParticles();
    
    this.ctx.restore();
    
    // UI
    this.drawUI();
  }
  
  drawClouds() {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const cloudPositions = [
      { x: 100, y: 80 }, { x: 300, y: 60 }, { x: 500, y: 90 },
      { x: 700, y: 50 }, { x: 900, y: 80 }
    ];
    
    cloudPositions.forEach(cloud => {
      this.ctx.beginPath();
      this.ctx.arc(cloud.x - this.camera.x * 0.1, cloud.y, 30, 0, Math.PI * 2);
      this.ctx.arc(cloud.x - this.camera.x * 0.1 + 25, cloud.y - 10, 25, 0, Math.PI * 2);
      this.ctx.arc(cloud.x - this.camera.x * 0.1 + 50, cloud.y, 30, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawMountains() {
    this.ctx.fillStyle = '#90A4AE';
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.canvas.height);
    this.ctx.lineTo(200, this.canvas.height - 200);
    this.ctx.lineTo(400, this.canvas.height);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#78909C';
    this.ctx.beginPath();
    this.ctx.moveTo(300, this.canvas.height);
    this.ctx.lineTo(600, this.canvas.height - 250);
    this.ctx.lineTo(900, this.canvas.height);
    this.ctx.fill();
  }
  
  drawPlatforms() {
    this.gameState.platforms.forEach(platform => {
      if (platform.type === 'ground') {
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(platform.x, platform.y, platform.width, 10);
      } else if (platform.type === 'platform') {
        const colors = {
          stone: '#808080', wood: '#A0522D', gold: '#FFD700'
        };
        this.ctx.fillStyle = colors[platform.decoration] || '#808080';
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
      } else if (platform.type === 'wall') {
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      }
    });
  }
  
  drawCheckpoints() {
    this.gameState.checkpoints.forEach(cp => {
      this.ctx.fillStyle = cp.activated ? '#00FF00' : '#FF0000';
      this.ctx.fillRect(cp.x, cp.y - 60, 10, 60);
      
      this.ctx.fillStyle = '#FFD700';
      this.ctx.beginPath();
      this.ctx.arc(cp.x + 5, cp.y - 70, 15, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawCoins() {
    this.gameState.coins.forEach(coin => {
      if (coin.collected) return;
      
      this.ctx.fillStyle = '#FFD700';
      this.ctx.strokeStyle = '#FFA500';
      this.ctx.lineWidth = 2;
      
      this.ctx.save();
      this.ctx.translate(coin.x, coin.y);
      this.ctx.scale(1, Math.cos(coin.rotation));
      
      this.ctx.beginPath();
      this.ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#FFA500';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('$', 0, 5);
      
      this.ctx.restore();
    });
  }
  
  drawEnemies() {
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      
      this.ctx.fillStyle = enemy.color;
      
      if (enemy.type === 'slime') {
        this.ctx.beginPath();
        this.ctx.ellipse(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2 + 5, 
                        enemy.width / 2 + Math.sin(enemy.animation) * 3, enemy.height / 2 - 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(enemy.x + 10, enemy.y + 10, 4, 0, Math.PI * 2);
        this.ctx.arc(enemy.x + 22, enemy.y + 10, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(enemy.x + 10, enemy.y + 10, 2, 0, Math.PI * 2);
        this.ctx.arc(enemy.x + 22, enemy.y + 10, 2, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (enemy.type === 'bat') {
        const wingFlap = Math.sin(enemy.animation * 3) * 15;
        
        this.ctx.beginPath();
        this.ctx.moveTo(enemy.x + 15, enemy.y + 15);
        this.ctx.lineTo(enemy.x, enemy.y + 5 - wingFlap);
        this.ctx.lineTo(enemy.x + 10, enemy.y + 15);
        this.ctx.lineTo(enemy.x + 20, enemy.y + 15);
        this.ctx.lineTo(enemy.x + 30, enemy.y + 5 - wingFlap);
        this.ctx.lineTo(enemy.x + 15, enemy.y + 15);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(enemy.x + 12, enemy.y + 12, 3, 0, Math.PI * 2);
        this.ctx.arc(enemy.x + 18, enemy.y + 12, 3, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(enemy.x + 5, enemy.y + 5, 8, 8);
        this.ctx.fillRect(enemy.x + enemy.width - 13, enemy.y + 5, 8, 8);
      }
    });
  }
  
  drawPowerups() {
    this.gameState.powerups.forEach(powerup => {
      if (powerup.collected) return;
      
      const pulse = Math.sin(this.gameState.time * 5) * 3;
      
      this.ctx.save();
      this.ctx.translate(powerup.x, powerup.y);
      
      const colors = {
        jump: '#FF00FF', speed: '#00FFFF', invincible: '#FFD700'
      };
      
      this.ctx.fillStyle = colors[powerup.type];
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 15 + pulse, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.textAlign = 'center';
      const labels = { jump: '↑', speed: '⚡', invincible: '★' };
      this.ctx.fillText(labels[powerup.type], 0, 5);
      
      this.ctx.restore();
    });
  }
  
  drawPlayer() {
    const player = this.gameState.players[this.player];
    if (!player) return;
    
    if (player.invincible && Math.floor(this.gameState.time * 10) % 2 === 0) {
      return;
    }
    
    this.ctx.fillStyle = player.color;
    
    // Body
    this.ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Head
    this.ctx.fillStyle = '#FFCCAA';
    this.ctx.fillRect(player.x + 5, player.y - 15, 20, 20);
    
    // Eyes
    this.ctx.fillStyle = '#000';
    const eyeOffset = player.facing > 0 ? 5 : -5;
    this.ctx.fillRect(player.x + 10 + eyeOffset, player.y - 10, 4, 4);
    this.ctx.fillRect(player.x + 18 + eyeOffset, player.y - 10, 4, 4);
    
    // Legs animation
    if (player.state === 'running') {
      const legOffset = Math.sin(this.gameState.time * 15) * 5;
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(player.x + 5, player.y + player.height, 8, 10 + legOffset);
      this.ctx.fillRect(player.x + 17, player.y + player.height, 8, 10 - legOffset);
    }
    
    // Powerup effect
    if (player.powerup) {
      this.ctx.strokeStyle = player.powerup === 'jump' ? '#FF00FF' : 
                            player.powerup === 'speed' ? '#00FFFF' : '#FFD700';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(player.x - 5, player.y - 20, player.width + 10, player.height + 25);
    }
    
    // Name
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(player.name, player.x + player.width / 2, player.y - 25);
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
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 10, 150, 50);
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 35);
    this.ctx.fillText(`Coins: ${player.coins}`, 20, 55);
    
    // Level
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(this.canvas.width - 100, 10, 90, 40);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`Level ${this.gameState.level}`, this.canvas.width - 20, 35);
    
    // Health bar
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 70, 200, 25);
    this.ctx.fillStyle = '#FF0000';
    this.ctx.fillRect(12, 72, 196, 21);
    this.ctx.fillStyle = '#00FF00';
    this.ctx.fillRect(12, 72, 196 * (player.health / 100), 21);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`HP: ${player.health}%`, 15, 88);
  }
  
  updatePlayerInput(playerName, input) {
    window.gameState = window.gameState || {};
    window.gameState[playerName] = { input: input };
  }
}

window.PlatformerGame = PlatformerGame;