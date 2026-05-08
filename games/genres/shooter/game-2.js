// Galactic Wars - Galaxy Shooter
class GalacticWarsGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.players = players;
    this.gameId = gameId;
    this.isRunning = false;
    this.lastTime = 0;
    this.keys = {};
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    window.addEventListener('keydown', e => this.keys[e.code] = true);
    window.addEventListener('keyup', e => this.keys[e.code] = false);
    
    this.gameState = {
      time: 0,
      score: 0,
      highScore: parseInt(localStorage.getItem('galacticWarsHighScore')) || 0,
      level: 1,
      lives: 4,
      status: 'playing',
      player: null,
      bullets: [],
      enemyBullets: [],
      enemies: [],
      asteroids: [],
      planets: [],
      powerups: [],
      particles: [],
      nebula: [],
      blackHole: null,
      boss: null,
      bossPhase: 0,
      mission: null,
      missionTimer: 0,
      missionComplete: false,
      warpEffect: false,
      warpTimer: 0,
      combo: 0,
      multiplier: 1,
      difficulty: 1,
      energy: 100,
      maxEnergy: 100,
      energyRegen: 0.1,
      specialReady: false,
      specialCooldown: 0
    };
    
    this.initBackground();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initBackground() {
    for (let i = 0; i < 200; i++) {
      this.gameState.nebula.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 100 + 50,
        color: `hsl(${Math.random() * 60 + 200}, 70%, 50%)`,
        alpha: Math.random() * 0.3 + 0.1,
        speed: Math.random() * 0.5 + 0.2
      });
    }
    
    this.gameState.planets = [];
    for (let i = 0; i < 3; i++) {
      this.gameState.planets.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: Math.random() * 30 + 20,
        color: `hsl(${Math.random() * 360}, 60%, 40%)`,
        ring: Math.random() > 0.7,
        ringColor: `hsl(${Math.random() * 360}, 50%, 70%)`
      });
    }
  }
  
  start() {
    const playerName = this.players[0] || 'Pilot';
    this.gameState.player = {
      x: this.canvas.width / 2,
      y: this.canvas.height - 80,
      width: 50,
      height: 40,
      speed: 6,
      maxSpeed: 10,
      acceleration: 0.3,
      velocityX: 0,
      velocityY: 0,
      rotation: 0,
      shield: 100,
      maxShield: 100,
      shootCooldown: 0,
      shootDelay: 150,
      special: false,
      specialActive: false,
      specialTimer: 0,
      specialDuration: 5000,
      invincible: false,
      invincibleTimer: 0,
      boost: false,
      boostFuel: 100,
      afterburner: false
    };
    
    this.gameState.mission = this.generateMission();
    this.spawnInitialEnemies();
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }
  
  generateMission() {
    const missions = [
      { name: 'Destroy All Enemies', target: 10, type: 'kill', progress: 0 },
      { name: 'Survive for 60 seconds', target: 60, type: 'time', progress: 0 },
      { name: 'Collect 5 Powerups', target: 5, type: 'collect', progress: 0 },
      { name: 'Destroy 3 Bosses', target: 3, type: 'boss', progress: 0 },
      { name: 'Clear Asteroid Field', target: 15, type: 'asteroid', progress: 0 }
    ];
    
    const mission = missions[Math.floor(Math.random() * missions.length)];
    this.gameState.missionTimer = 0;
    return mission;
  }
  
  spawnInitialEnemies() {
    this.gameState.enemies = [];
    this.gameState.asteroids = [];
    
    for (let i = 0; i < 8; i++) {
      this.spawnEnemy();
    }
    
    for (let i = 0; i < 10; i++) {
      this.spawnAsteroid();
    }
  }
  
  spawnEnemy() {
    const types = ['fighter', 'cruiser', 'scout', 'bomber', 'carrier'];
    const weights = [0.4, 0.2, 0.25, 0.1, 0.05];
    
    let typeIndex = 0;
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        typeIndex = i;
        break;
      }
    }
    
    const type = types[typeIndex];
    const enemy = this.createEnemyByType(type);
    
    enemy.x = Math.random() * (this.canvas.width - 100) + 50;
    enemy.y = -50;
    enemy.alive = true;
    
    this.gameState.enemies.push(enemy);
  }
  
  createEnemyByType(type) {
    const baseProps = {
      fighter: { width: 30, height: 30, health: 2, speed: 3, points: 100, shootChance: 0.02 },
      cruiser: { width: 50, height: 40, health: 5, speed: 1.5, points: 250, shootChance: 0.015 },
      scout: { width: 25, height: 25, health: 1, speed: 5, points: 75, shootChance: 0.025 },
      bomber: { width: 40, height: 35, health: 3, speed: 2, points: 150, shootChance: 0.01 },
      carrier: { width: 80, height: 60, health: 15, speed: 0.8, points: 500, shootChance: 0.008 }
    };
    
    const props = baseProps[type];
    return {
      type: type,
      x: 0,
      y: 0,
      width: props.width,
      height: props.height,
      health: props.health + Math.floor(this.gameState.level / 3),
      maxHealth: props.health + Math.floor(this.gameState.level / 3),
      speed: props.speed * (1 + this.gameState.level * 0.1),
      points: props.points * this.gameState.level,
      shootChance: props.shootChance + this.gameState.level * 0.001,
      angle: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.05,
      shootCooldown: Math.random() * 2000,
      behavior: this.getEnemyBehavior(type),
      alive: true
    };
  }
  
  getEnemyBehavior(type) {
    const behaviors = ['patrol', 'zigzag', 'dive', 'circle', 'hunt'];
    return behaviors[Math.floor(Math.random() * behaviors.length)];
  }
  
  spawnAsteroid() {
    const size = Math.random() * 40 + 20;
    
    this.gameState.asteroids.push({
      x: Math.random() * this.canvas.width,
      y: -50,
      width: size,
      height: size,
      radius: size / 2,
      speed: Math.random() * 2 + 1,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      health: Math.floor(size / 15),
      points: Math.floor(size),
      shape: this.generateAsteroidShape(size)
    });
  }
  
  generateAsteroidShape(radius) {
    const points = [];
    const numPoints = 8 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const r = radius * (0.7 + Math.random() * 0.6);
      points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }
    
    return points;
  }
  
  gameLoop() {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    const deltaTime = Math.min(currentTime - this.lastTime, 50);
    this.lastTime = currentTime;
    
    this.update(deltaTime);
    this.render();
    
    requestAnimationFrame(() => this.gameLoop());
  }
  
  update(deltaTime) {
    if (this.gameState.status !== 'playing') return;
    
    this.gameState.time += deltaTime;
    this.gameState.missionTimer += deltaTime / 1000;
    
    this.updateBackground();
    this.updatePlayer(deltaTime);
    this.updateBullets(deltaTime);
    this.updateEnemies(deltaTime);
    this.updateAsteroids(deltaTime);
    this.updateEnemyBullets(deltaTime);
    this.updatePowerups(deltaTime);
    this.updateParticles(deltaTime);
    this.updateBlackHole(deltaTime);
    this.updateBoss(deltaTime);
    this.updateMission(deltaTime);
    this.updateSpecial(deltaTime);
    this.checkCollisions();
    
    if (this.gameState.enemies.filter(e => e.alive).length < 3) {
      this.spawnEnemy();
    }
    
    if (this.gameState.asteroids.length < 5 && Math.random() < 0.02) {
      this.spawnAsteroid();
    }
    
    if (this.gameState.level % 5 === 0 && !this.gameState.boss) {
      this.spawnBoss();
    }
  }
  
  updateBackground() {
    this.gameState.nebula.forEach(n => {
      n.y += n.speed;
      if (n.y > this.canvas.height + n.size) {
        n.y = -n.size;
        n.x = Math.random() * this.canvas.width;
      }
    });
    
    this.gameState.planets.forEach(p => {
      p.y += 0.2;
      if (p.y > this.canvas.height + p.radius) {
        p.y = -p.radius;
        p.x = Math.random() * this.canvas.width;
      }
    });
    
    if (this.gameState.warpEffect) {
      this.gameState.warpTimer -= 1;
      if (this.gameState.warpTimer <= 0) {
        this.gameState.warpEffect = false;
      }
    }
  }
  
  updatePlayer(deltaTime) {
    const player = this.gameState.player;
    if (!player) return;
    
    if (player.invincible) {
      player.invincibleTimer -= deltaTime;
      if (player.invincibleTimer <= 0) {
        player.invincible = false;
      }
    }
    
    let inputX = 0;
    let inputY = 0;
    
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) inputX = -1;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) inputX = 1;
    if (this.keys['ArrowUp'] || this.keys['KeyW']) inputY = -1;
    if (this.keys['ArrowDown'] || this.keys['KeyS']) inputY = 1;
    
    player.velocityX += inputX * player.acceleration;
    player.velocityY += inputY * player.acceleration;
    
    player.velocityX = Math.max(-player.maxSpeed, Math.min(player.maxSpeed, player.velocityX));
    player.velocityY = Math.max(-player.maxSpeed, Math.min(player.maxSpeed, player.velocityY));
    
    player.velocityX *= 0.95;
    player.velocityY *= 0.95;
    
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    player.x = Math.max(player.width / 2, Math.min(this.canvas.width - player.width / 2, player.x));
    player.y = Math.max(player.height / 2, Math.min(this.canvas.height - player.height / 2, player.y));
    
    if (inputX !== 0 || inputY !== 0) {
      player.rotation = Math.atan2(inputY, inputX);
    }
    
    if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) {
      if (player.boostFuel > 0) {
        player.boost = true;
        player.boostFuel -= 0.5;
      }
    } else {
      player.boost = false;
      if (player.boostFuel < 100) {
        player.boostFuel += 0.2;
      }
    }
    
    player.afterburner = inputY < 0;
    
    if ((this.keys['Space'] || this.keys['KeyZ']) && player.shootCooldown <= 0) {
      this.shoot();
      player.shootCooldown = player.shootDelay;
    }
    
    if (player.shootCooldown > 0) {
      player.shootCooldown -= deltaTime;
    }
    
    if (this.keys['KeyX'] && this.gameState.specialReady && player.specialCooldown <= 0) {
      this.activateSpecial();
    }
    
    if (player.specialCooldown > 0) {
      player.specialCooldown -= deltaTime;
    }
    
    if (!player.specialActive && player.specialCooldown <= 0) {
      this.gameState.specialReady = true;
    } else {
      this.gameState.specialReady = false;
    }
    
    this.gameState.energy = Math.min(this.gameState.maxEnergy, this.gameState.energy + this.gameState.energyRegen);
  }
  
  shoot() {
    const player = this.gameState.player;
    const spread = player.boost ? 3 : 5;
    
    for (let i = -Math.floor(spread / 2); i <= Math.floor(spread / 2); i++) {
      const angle = player.rotation + (i * 0.15);
      
      this.gameState.bullets.push({
        x: player.x,
        y: player.y - 20,
        vx: Math.sin(angle) * 10,
        vy: -Math.cos(angle) * 10,
        width: 6,
        height: 15,
        damage: 1,
        type: 'player',
        trail: []
      });
    }
    
    this.playSound('shoot');
  }
  
  activateSpecial() {
    const player = this.gameState.player;
    
    player.specialActive = true;
    player.specialTimer = player.specialDuration;
    player.specialCooldown = 15000;
    this.gameState.specialReady = false;
    
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      this.gameState.bullets.push({
        x: player.x,
        y: player.y,
        vx: Math.sin(angle) * 12,
        vy: Math.cos(angle) * 12,
        width: 8,
        height: 8,
        damage: 2,
        type: 'special',
        isSpecial: true
      });
    }
    
    this.playSound('special');
  }
  
  updateSpecial(deltaTime) {
    const player = this.gameState.player;
    if (!player || !player.specialActive) return;
    
    player.specialTimer -= deltaTime;
    
    if (player.specialTimer <= 0) {
      player.specialActive = false;
    }
    
    if (player.specialActive && player.specialTimer > 1000) {
      this.gameState.bullets.push({
        x: player.x + (Math.random() - 0.5) * 40,
        y: player.y - 30,
        vx: (Math.random() - 0.5) * 2,
        vy: -15,
        width: 4,
        height: 10,
        damage: 1,
        type: 'special'
      });
    }
  }
  
  updateBullets(deltaTime) {
    this.gameState.bullets.forEach(bullet => {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      
      if (bullet.trail) {
        bullet.trail.push({ x: bullet.x, y: bullet.y });
        if (bullet.trail.length > 5) {
          bullet.trail.shift();
        }
      }
      
      if (bullet.y < -20 || bullet.y > this.canvas.height + 20 ||
          bullet.x < -20 || bullet.x > this.canvas.width + 20) {
        bullet.alive = false;
      }
    });
    
    this.gameState.bullets = this.gameState.bullets.filter(b => b.alive !== false);
  }
  
  updateEnemies(deltaTime) {
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      
      this.updateEnemyBehavior(enemy, deltaTime);
      
      enemy.angle += enemy.rotationSpeed;
      enemy.shootCooldown -= deltaTime;
      
      if (enemy.shootCooldown <= 0 && Math.random() < enemy.shootChance) {
        this.spawnEnemyBullet(enemy);
        enemy.shootCooldown = 2000 + Math.random() * 1000;
      }
      
      if (enemy.y > this.canvas.height + 50) {
        enemy.alive = false;
      }
    });
    
    this.gameState.enemies = this.gameState.enemies.filter(e => e.alive);
  }
  
  updateEnemyBehavior(enemy, deltaTime) {
    const player = this.gameState.player;
    if (!player) return;
    
    switch (enemy.behavior) {
      case 'patrol':
        enemy.x += enemy.speed * Math.sin(this.gameState.time / 2000);
        enemy.y += enemy.speed * 0.5;
        break;
        
      case 'zigzag':
        enemy.x += Math.sin(this.gameState.time / 300 + enemy.angle) * 3;
        enemy.y += enemy.speed;
        break;
        
      case 'dive':
        if (enemy.y < this.canvas.height / 3) {
          enemy.y += enemy.speed;
        } else {
          const dx = player.x - enemy.x;
          const dy = player.y - enemy.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          enemy.x += (dx / dist) * enemy.speed * 2;
          enemy.y += (dy / dist) * enemy.speed * 2;
        }
        break;
        
      case 'circle':
        enemy.x += Math.cos(this.gameState.time / 500) * 3;
        enemy.y += Math.sin(this.gameState.time / 500) * 2 + enemy.speed * 0.3;
        break;
        
      case 'hunt':
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 100) {
          enemy.x += (dx / dist) * enemy.speed;
          enemy.y += (dy / dist) * enemy.speed;
        }
        break;
    }
  }
  
  spawnEnemyBullet(enemy) {
    const player = this.gameState.player;
    if (!player) return;
    
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    this.gameState.enemyBullets.push({
      x: enemy.x,
      y: enemy.y + enemy.height / 2,
      vx: (dx / dist) * 5,
      vy: (dy / dist) * 5,
      width: 8,
      height: 8,
      type: enemy.type
    });
  }
  
  updateEnemyBullets(deltaTime) {
    this.gameState.enemyBullets.forEach(bullet => {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      
      if (bullet.y > this.canvas.height + 20 || bullet.y < -20 ||
          bullet.x > this.canvas.width + 20 || bullet.x < -20) {
        bullet.alive = false;
      }
    });
    
    this.gameState.enemyBullets = this.gameState.enemyBullets.filter(b => b.alive !== false);
  }
  
  updateAsteroids(deltaTime) {
    this.gameState.asteroids.forEach(asteroid => {
      asteroid.y += asteroid.speed;
      asteroid.rotation += asteroid.rotationSpeed;
      
      if (asteroid.y > this.canvas.height + 50) {
        asteroid.alive = false;
      }
    });
    
    this.gameState.asteroids = this.gameState.asteroids.filter(a => a.alive !== false);
  }
  
  updatePowerups(deltaTime) {
    if (Math.random() < 0.003) {
      const types = ['shield', 'weapon', 'special', 'score', 'life'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      this.gameState.powerups.push({
        x: Math.random() * (this.canvas.width - 40) + 20,
        y: -20,
        width: 30,
        height: 30,
        speed: 2,
        type: type,
        rotation: 0,
        pulse: 0
      });
    }
    
    this.gameState.powerups.forEach(powerup => {
      powerup.y += powerup.speed;
      powerup.rotation += 0.05;
      powerup.pulse += 0.1;
      
      if (powerup.y > this.canvas.height + 30) {
        powerup.alive = false;
      }
    });
    
    this.gameState.powerups = this.gameState.powerups.filter(p => p.alive !== false);
  }
  
  updateParticles(deltaTime) {
    this.gameState.particles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1;
      particle.life -= deltaTime;
      particle.alpha = particle.life / particle.maxLife;
    });
    
    this.gameState.particles = this.gameState.particles.filter(p => p.life > 0);
  }
  
  createExplosion(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      this.gameState.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        size: Math.random() * 8 + 2,
        color: color || '#ff8800',
        life: 600,
        maxLife: 600,
        alpha: 1
      });
    }
  }
  
  updateBlackHole(deltaTime) {
    if (this.gameState.level % 10 === 0 && !this.gameState.blackHole) {
      this.gameState.blackHole = {
        x: this.canvas.width / 2,
        y: -100,
        radius: 30,
        speed: 1,
        gravity: 0.5,
        active: false
      };
    }
    
    if (this.gameState.blackHole) {
      if (!this.gameState.blackHole.active && this.gameState.time > 30000) {
        this.gameState.blackHole.active = true;
      }
      
      if (this.gameState.blackHole.active) {
        this.gameState.blackHole.y += this.gameState.blackHole.speed;
        
        if (this.gameState.blackHole.y > this.canvas.height + 100) {
          this.gameState.blackHole = null;
        }
        
        const player = this.gameState.player;
        if (player) {
          const dx = this.gameState.blackHole.x - player.x;
          const dy = this.gameState.blackHole.y - player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 200) {
            player.x += (dx / dist) * this.gameState.blackHole.gravity;
            player.y += (dy / dist) * this.gameState.blackHole.gravity;
          }
        }
      }
    }
  }
  
  updateBoss(deltaTime) {
    if (!this.gameState.boss) return;
    
    this.gameState.boss.phaseTimer += deltaTime;
    
    if (this.gameState.boss.phaseTimer > 10000) {
      this.gameState.bossPhase = (this.gameState.bossPhase + 1) % 3;
      this.gameState.boss.phaseTimer = 0;
    }
    
    const boss = this.gameState.boss;
    
    switch (this.gameState.bossPhase) {
      case 0:
        boss.x = this.canvas.width / 2 + Math.sin(this.gameState.time / 1000) * 150;
        boss.y = 100;
        break;
      case 1:
        boss.x = Math.sin(this.gameState.time / 500) * (this.canvas.width / 2 - 50);
        boss.y = 100 + Math.sin(this.gameState.time / 800) * 30;
        break;
      case 2:
        boss.x = this.canvas.width / 2;
        boss.y = 80 + Math.abs(Math.sin(this.gameState.time / 1000)) * 50;
        break;
    }
    
    if (Math.random() < 0.02) {
      this.spawnBossBullet();
    }
    
    if (this.gameState.boss.phase === 2 && Math.random() < 0.01) {
      this.spawnMinions();
    }
  }
  
  spawnBoss() {
    const bossTypes = [
      { name: 'Vanguard', health: 100, points: 2000, width: 150, height: 100 },
      { name: 'Dreadnought', health: 150, points: 3000, width: 200, height: 120 },
      { name: 'Leviathan', health: 200, points: 5000, width: 250, height: 150 }
    ];
    
    const type = bossTypes[Math.floor(this.gameState.level / 5) % bossTypes.length];
    
    this.gameState.boss = {
      x: this.canvas.width / 2,
      y: -100,
      width: type.width,
      height: type.height,
      health: type.health + this.gameState.level * 10,
      maxHealth: type.health + this.gameState.level * 10,
      points: type.points,
      name: type.name,
      speed: 1.5,
      shootChance: 0.03,
      phase: 0,
      phaseTimer: 0,
      alive: true,
      invincible: false,
      invincibleTimer: 0
    };
  }
  
  spawnBossBullet() {
    const boss = this.gameState.boss;
    const player = this.gameState.player;
    if (!player) return;
    
    const patterns = [
      { count: 1, spread: 0 },
      { count: 5, spread: 0.5 },
      { count: 8, spread: 0.3 }
    ];
    
    const pattern = patterns[this.gameState.bossPhase];
    
    for (let i = 0; i < pattern.count; i++) {
      const angle = Math.atan2(player.y - boss.y, player.x - boss.x) + 
                   (i - Math.floor(pattern.count / 2)) * pattern.spread;
      
      this.gameState.enemyBullets.push({
        x: boss.x,
        y: boss.y + boss.height / 2,
        vx: Math.cos(angle) * 6,
        vy: Math.sin(angle) * 6,
        width: 10,
        height: 10,
        type: 'boss'
      });
    }
  }
  
  spawnMinions() {
    for (let i = 0; i < 5; i++) {
      const enemy = this.createEnemyByType('fighter');
      enemy.x = this.gameState.boss.x + (Math.random() - 0.5) * 100;
      enemy.y = this.gameState.boss.y + 50;
      enemy.health = 1;
      enemy.alive = true;
      this.gameState.enemies.push(enemy);
    }
  }
  
  updateMission(deltaTime) {
    if (!this.gameState.mission) return;
    
    switch (this.gameState.mission.type) {
      case 'kill':
        if (this.gameState.mission.lastKills !== this.gameState.enemies.length) {
          this.gameState.mission.progress = Math.max(this.gameState.mission.progress, 
            this.gameState.mission.target - this.gameState.enemies.filter(e => !e.alive).length);
        }
        break;
      case 'time':
        this.gameState.mission.progress = Math.min(this.gameState.missionTimer, this.gameState.mission.target);
        break;
      case 'collect':
        this.gameState.mission.progress = this.gameState.mission.collected || 0;
        break;
      case 'boss':
        this.gameState.mission.progress = this.gameState.mission.bossesDefeated || 0;
        break;
      case 'asteroid':
        this.gameState.mission.progress = Math.max(this.gameState.mission.progress,
          this.gameState.mission.target - this.gameState.asteroids.length);
        break;
    }
    
    if (this.gameState.mission.progress >= this.gameState.mission.target && !this.gameState.missionComplete) {
      this.gameState.missionComplete = true;
      this.gameState.score += 5000;
      this.gameState.level++;
      
      setTimeout(() => {
        this.gameState.mission = this.generateMission();
        this.gameState.missionComplete = false;
      }, 3000);
    }
  }
  
  checkCollisions() {
    const player = this.gameState.player;
    if (!player || player.invincible) return;
    
    this.gameState.bullets.forEach(bullet => {
      if (!bullet.alive || bullet.type === 'special' && !bullet.isSpecial) return;
      
      this.gameState.enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        if (this.checkCollision(bullet, enemy)) {
          bullet.alive = false;
          this.damageEnemy(enemy, bullet.damage);
        }
      });
      
      if (this.gameState.boss && this.gameState.boss.alive) {
        if (this.checkCollision(bullet, this.gameState.boss)) {
          bullet.alive = false;
          this.damageEnemy(this.gameState.boss, bullet.damage);
        }
      }
    });
    
    this.gameState.enemyBullets.forEach(bullet => {
      if (!bullet.alive) return;
      
      if (this.checkCollision(bullet, player)) {
        bullet.alive = false;
        this.damagePlayer();
      }
    });
    
    this.gameState.asteroids.forEach(asteroid => {
      if (!asteroid.alive) return;
      
      if (this.checkCollision(player, asteroid)) {
        this.damagePlayer();
        this.createExplosion(asteroid.x, asteroid.y, 10, '#888888');
        asteroid.health -= 1;
        if (asteroid.health <= 0) {
          asteroid.alive = false;
          this.gameState.score += asteroid.points;
        }
      }
      
      this.gameState.bullets.forEach(bullet => {
        if (!bullet.alive) return;
        
        if (this.checkCollision(bullet, asteroid)) {
          bullet.alive = false;
          asteroid.health -= 1;
          if (asteroid.health <= 0) {
            asteroid.alive = false;
            this.createExplosion(asteroid.x, asteroid.y, 15, '#888888');
            this.gameState.score += asteroid.points;
            
            if (this.gameState.mission.type === 'asteroid') {
              this.gameState.mission.collected = (this.gameState.mission.collected || 0) + 1;
            }
          }
        }
      });
    });
    
    this.gameState.powerups.forEach(powerup => {
      if (!powerup.alive) return;
      
      if (this.checkCollision(player, powerup)) {
        powerup.alive = false;
        this.collectPowerup(powerup);
      }
    });
  }
  
  checkCollision(a, b) {
    const aLeft = a.x - (a.width || 0) / 2;
    const aRight = a.x + (a.width || 0) / 2;
    const aTop = a.y - (a.height || 0) / 2;
    const aBottom = a.y + (a.height || 0) / 2;
    
    const bLeft = b.x - b.width / 2;
    const bRight = b.x + b.width / 2;
    const bTop = b.y - b.height / 2;
    const bBottom = b.y + b.height / 2;
    
    return aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop;
  }
  
  damageEnemy(enemy, damage) {
    if (enemy.invincible) return;
    
    enemy.health -= damage;
    
    if (enemy.health <= 0) {
      enemy.alive = false;
      
      this.gameState.combo++;
      const multiplier = Math.min(this.gameState.combo, 10);
      
      const score = enemy.points * multiplier;
      this.gameState.score += score;
      
      this.createExplosion(enemy.x, enemy.y, 20, this.getEnemyColor(enemy.type));
      
      if (enemy.type === 'carrier') {
        for (let i = 0; i < 8; i++) {
          this.spawnEnemy();
        }
      }
      
      this.playSound('explosion');
    } else {
      this.createExplosion(enemy.x, enemy.y, 5, '#ffff00');
    }
  }
  
  getEnemyColor(type) {
    const colors = {
      fighter: '#00ff00',
      cruiser: '#0088ff',
      scout: '#ffff00',
      bomber: '#ff8800',
      carrier: '#ff0000',
      boss: '#ff00ff'
    };
    return colors[type] || '#ffffff';
  }
  
  damagePlayer() {
    const player = this.gameState.player;
    
    player.shield -= 20;
    this.createExplosion(player.x, player.y, 10, '#ff0000');
    
    if (player.shield <= 0) {
      this.gameState.lives--;
      player.shield = player.maxShield;
      player.invincible = true;
      player.invincibleTimer = 3000;
      
      if (this.gameState.lives <= 0) {
        this.gameOver();
      }
    }
    
    this.playSound('hit');
  }
  
  collectPowerup(powerup) {
    const player = this.gameState.player;
    
    switch (powerup.type) {
      case 'shield':
        player.shield = Math.min(player.maxShield, player.shield + 30);
        break;
      case 'weapon':
        player.shootDelay = Math.max(50, player.shootDelay - 20);
        break;
      case 'special':
        player.specialCooldown = Math.max(0, player.specialCooldown - 5000);
        break;
      case 'score':
        this.gameState.score += 1000;
        break;
      case 'life':
        this.gameState.lives = Math.min(this.gameState.lives + 1, 5);
        break;
    }
    
    this.createExplosion(powerup.x, powerup.y, 8, '#00ff00');
    this.playSound('powerup');
  }
  
  playSound(type) {
    if (typeof AudioContext !== 'undefined') {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        const frequencies = {
          shoot: 660,
          explosion: 150,
          powerup: 880,
          hit: 330,
          special: 1320
        };
        
        oscillator.frequency.value = frequencies[type] || 440;
        oscillator.type = type === 'shoot' ? 'triangle' : 'square';
        gainNode.gain.value = 0.08;
        
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.stop(audioCtx.currentTime + 0.1);
      } catch (e) {}
    }
  }
  
  gameOver() {
    this.gameState.status = 'gameover';
    this.isRunning = false;
    
    if (this.gameState.score > this.gameState.highScore) {
      this.gameState.highScore = this.gameState.score;
      localStorage.setItem('galacticWarsHighScore', this.gameState.highScore);
    }
  }
  
  render() {
    const ctx = this.ctx;
    
    ctx.fillStyle = '#000005';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.renderNebula();
    this.renderPlanets();
    this.renderStars();
    this.renderBlackHole();
    this.renderAsteroids();
    this.renderEnemies();
    this.renderBoss();
    this.renderPlayer();
    this.renderBullets();
    this.renderEnemyBullets();
    this.renderPowerups();
    this.renderParticles();
    this.renderWarpEffect();
    this.renderUI();
    this.renderMission();
  }
  
  renderNebula() {
    const ctx = this.ctx;
    
    this.gameState.nebula.forEach(n => {
      ctx.globalAlpha = n.alpha;
      ctx.fillStyle = n.color;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.globalAlpha = 1;
  }
  
  renderStars() {
    const ctx = this.ctx;
    
    for (let i = 0; i < 100; i++) {
      const x = (i * 137.5) % this.canvas.width;
      const y = (i * 73.7 + this.gameState.time * 0.05) % this.canvas.height;
      
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + (i % 5) * 0.1})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }
  
  renderPlanets() {
    const ctx = this.ctx;
    
    this.gameState.planets.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      
      if (p.ring) {
        ctx.strokeStyle = p.ringColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.radius * 1.5, p.radius * 0.3, 0.3, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }
  
  renderPlayer() {
    const player = this.gameState.player;
    if (!player) return;
    
    const ctx = this.ctx;
    
    if (player.invincible && Math.floor(this.gameState.time / 100) % 2 === 0) {
      return;
    }
    
    ctx.save();
    ctx.translate(player.x, player.y);
    
    if (player.boost) {
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 20;
    }
    
    ctx.fillStyle = '#444466';
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(-15, 15);
    ctx.lineTo(0, 10);
    ctx.lineTo(15, 15);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#8888aa';
    ctx.fillRect(-8, -5, 16, 10);
    
    ctx.fillStyle = '#00aaff';
    ctx.fillRect(-5, 0, 4, 6);
    ctx.fillRect(1, 0, 4, 6);
    
    if (player.afterburner) {
      ctx.fillStyle = '#ff8800';
      ctx.beginPath();
      ctx.moveTo(-8, 15);
      ctx.lineTo(0, 25 + Math.random() * 10);
      ctx.lineTo(8, 15);
      ctx.fill();
    }
    
    if (player.specialActive) {
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 35, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  renderEnemies() {
    const ctx = this.ctx;
    
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(enemy.angle);
      
      ctx.fillStyle = this.getEnemyColor(enemy.type);
      
      this.drawEnemyShip(enemy.type);
      
      if (enemy.maxHealth > 1) {
        const healthPercent = enemy.health / enemy.maxHealth;
        ctx.fillStyle = '#333';
        ctx.fillRect(-enemy.width / 2, -enemy.height / 2 - 8, enemy.width, 4);
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : '#ff0000';
        ctx.fillRect(-enemy.width / 2, -enemy.height / 2 - 8, enemy.width * healthPercent, 4);
      }
      
      ctx.restore();
    });
  }
  
  drawEnemyShip(type) {
    const ctx = this.ctx;
    
    switch (type) {
      case 'fighter':
        ctx.beginPath();
        ctx.moveTo(0, 15);
        ctx.lineTo(-12, -5);
        ctx.lineTo(-6, -10);
        ctx.lineTo(0, -5);
        ctx.lineTo(6, -10);
        ctx.lineTo(12, -5);
        ctx.closePath();
        ctx.fill();
        break;
        
      case 'cruiser':
        ctx.fillRect(-20, -15, 40, 30);
        ctx.fillRect(-25, 5, 8, 10);
        ctx.fillRect(17, 5, 8, 10);
        break;
        
      case 'scout':
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(-10, 8);
        ctx.lineTo(10, 8);
        ctx.closePath();
        ctx.fill();
        break;
        
      case 'bomber':
        ctx.fillRect(-15, -10, 30, 20);
        ctx.fillRect(-20, -5, 8, 12);
        ctx.fillRect(12, -5, 8, 12);
        break;
        
      case 'carrier':
        ctx.fillRect(-35, -25, 70, 50);
        ctx.fillRect(-20, -15, 15, 10);
        ctx.fillRect(5, -15, 15, 10);
        ctx.fillStyle = '#440000';
        ctx.fillRect(-30, 15, 25, 15);
        break;
    }
  }
  
  renderBoss() {
    const boss = this.gameState.boss;
    if (!boss) return;
    
    const ctx = this.ctx;
    
    ctx.save();
    ctx.translate(boss.x, boss.y);
    
    ctx.fillStyle = '#440044';
    ctx.fillRect(-boss.width / 2, -boss.height / 2, boss.width, boss.height);
    
    ctx.fillStyle = '#ff0066';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(-30 + i * 20, -20, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.fillStyle = '#880088';
    ctx.fillRect(-boss.width / 2 + 10, boss.height / 2 - 20, 20, 20);
    ctx.fillRect(boss.width / 2 - 30, boss.height / 2 - 20, 20, 20);
    
    const healthPercent = boss.health / boss.maxHealth;
    ctx.fillStyle = '#333333';
    ctx.fillRect(-boss.width / 2, -boss.height / 2 - 15, boss.width, 8);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(-boss.width / 2, -boss.height / 2 - 15, boss.width * healthPercent, 8);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(boss.name, 0, -boss.height / 2 - 25);
    
    ctx.restore();
  }
  
  renderAsteroids() {
    const ctx = this.ctx;
    
    this.gameState.asteroids.forEach(asteroid => {
      if (!asteroid.alive) return;
      
      ctx.save();
      ctx.translate(asteroid.x, asteroid.y);
      ctx.rotate(asteroid.rotation);
      
      ctx.fillStyle = '#666666';
      ctx.beginPath();
      ctx.moveTo(asteroid.shape[0].x, asteroid.shape[0].y);
      
      for (let i = 1; i < asteroid.shape.length; i++) {
        ctx.lineTo(asteroid.shape[i].x, asteroid.shape[i].y);
      }
      
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = '#444444';
      ctx.beginPath();
      ctx.arc(-asteroid.radius * 0.3, -asteroid.radius * 0.2, asteroid.radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
  }
  
  renderBullets() {
    const ctx = this.ctx;
    
    this.gameState.bullets.forEach(bullet => {
      ctx.save();
      ctx.translate(bullet.x, bullet.y);
      
      if (bullet.trail) {
        ctx.fillStyle = 'rgba(255, 200, 50, 0.3)';
        bullet.trail.forEach(t => {
          ctx.fillRect(t.x - bullet.x - 2, t.y - bullet.y - 2, 4, 4);
        });
      }
      
      if (bullet.type === 'special') {
        ctx.fillStyle = '#ff00ff';
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 15;
      } else {
        ctx.fillStyle = '#ffcc00';
      }
      
      ctx.fillRect(-bullet.width / 2, -bullet.height / 2, bullet.width, bullet.height);
      
      ctx.restore();
    });
  }
  
  renderEnemyBullets() {
    const ctx = this.ctx;
    
    this.gameState.enemyBullets.forEach(bullet => {
      ctx.fillStyle = bullet.type === 'boss' ? '#ff0044' : '#ff6600';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.width / 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
    });
  }
  
  renderPowerups() {
    const ctx = this.ctx;
    
    this.gameState.powerups.forEach(powerup => {
      ctx.save();
      ctx.translate(powerup.x, powerup.y);
      ctx.rotate(powerup.rotation);
      
      const colors = {
        shield: '#00ffff',
        weapon: '#00ff00',
        special: '#ff00ff',
        score: '#ffff00',
        life: '#ff0000'
      };
      
      ctx.fillStyle = colors[powerup.type];
      ctx.beginPath();
      ctx.arc(0, 0, 12 + Math.sin(powerup.pulse) * 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const symbols = {
        shield: 'S',
        weapon: 'W',
        special: 'X',
        score: '$',
        life: '+'
      };
      
      ctx.fillText(symbols[powerup.type], 0, 0);
      
      ctx.restore();
    });
  }
  
  renderParticles() {
    const ctx = this.ctx;
    
    this.gameState.particles.forEach(particle => {
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.globalAlpha = 1;
  }
  
  renderBlackHole() {
    const blackHole = this.gameState.blackHole;
    if (!blackHole || !blackHole.active) return;
    
    const ctx = this.ctx;
    
    ctx.save();
    ctx.translate(blackHole.x, blackHole.y);
    
    for (let i = 5; i > 0; i--) {
      ctx.fillStyle = `rgba(${100 + i * 30}, 0, ${100 + i * 20}, ${0.3 - i * 0.05})`;
      ctx.beginPath();
      ctx.arc(0, 0, blackHole.radius + i * 15, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, 0, blackHole.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  renderWarpEffect() {
    if (!this.gameState.warpEffect) return;
    
    const ctx = this.ctx;
    
    ctx.strokeStyle = `rgba(100, 200, 255, ${Math.random() * 0.5})`;
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const length = 50 + Math.random() * 100;
      
      ctx.beginPath();
      ctx.moveTo(
        this.canvas.width / 2 + Math.cos(angle) * Math.random() * this.canvas.width,
        this.canvas.height / 2 + Math.sin(angle) * Math.random() * this.canvas.height
      );
      ctx.lineTo(
        this.canvas.width / 2 + Math.cos(angle) * (Math.random() * this.canvas.width + length),
        this.canvas.height / 2 + Math.sin(angle) * (Math.random() * this.canvas.height + length)
      );
      ctx.stroke();
    }
  }
  
  renderUI() {
    const ctx = this.ctx;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    ctx.fillText(`Level: ${this.gameState.level}`, 20, 55);
    
    ctx.textAlign = 'right';
    ctx.fillText(`High: ${this.gameState.highScore}`, this.canvas.width - 20, 30);
    
    ctx.fillText(`Lives: ${this.gameState.lives}`, this.canvas.width - 20, 55);
    
    const player = this.gameState.player;
    if (player) {
      ctx.fillStyle = '#333333';
      ctx.fillRect(20, 80, 150, 15);
      
      ctx.fillStyle = player.shield > 30 ? '#00aaff' : '#ff4400';
      ctx.fillRect(20, 80, 150 * (player.shield / player.maxShield), 15);
      
      ctx.fillStyle = '#888888';
      ctx.fillText('Shield', 20, 110);
      
      ctx.fillStyle = '#333333';
      ctx.fillRect(20, 125, 150, 15);
      ctx.fillStyle = player.boostFuel > 20 ? '#ff8800' : '#ff4400';
      ctx.fillRect(20, 125, 150 * (player.boostFuel / 100), 15);
      ctx.fillStyle = '#888888';
      ctx.fillText('Boost', 20, 155);
      
      ctx.fillStyle = '#333333';
      ctx.fillRect(this.canvas.width - 170, 80, 150, 15);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(this.canvas.width - 170, 80, 150 * (this.gameState.energy / this.gameState.maxEnergy), 15);
      ctx.fillStyle = '#888888';
      ctx.textAlign = 'right';
      ctx.fillText('Energy', this.canvas.width - 20, 110);
      
      if (this.gameState.specialReady) {
        ctx.fillStyle = '#ff00ff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('SPECIAL READY! (Press X)', this.canvas.width - 20, 140);
      } else if (player.specialCooldown > 0) {
        ctx.fillStyle = '#888888';
        ctx.font = '14px Arial';
        ctx.fillText(`Special: ${Math.ceil(player.specialCooldown / 1000)}s`, this.canvas.width - 20, 140);
      }
    }
    
    if (this.gameState.combo > 1) {
      ctx.fillStyle = '#ff8800';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.gameState.combo}x COMBO`, this.canvas.width / 2, this.canvas.height - 30);
    }
    
    if (this.gameState.status === 'gameover') {
      this.renderGameOver();
    }
  }
  
  renderMission() {
    if (!this.gameState.mission) return;
    
    const ctx = this.ctx;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, this.canvas.height - 80, 250, 70);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Mission: ${this.gameState.mission.name}`, 20, this.canvas.height - 60);
    
    const progress = this.gameState.mission.progress / this.gameState.mission.target;
    
    ctx.fillStyle = '#333333';
    ctx.fillRect(20, this.canvas.height - 40, 200, 15);
    ctx.fillStyle = progress >= 1 ? '#00ff00' : '#00aaff';
    ctx.fillRect(20, this.canvas.height - 40, 200 * progress, 15);
    
    if (this.gameState.missionComplete) {
      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('MISSION COMPLETE!', this.canvas.width / 2, this.canvas.height - 100);
    }
  }
  
  renderGameOver() {
    const ctx = this.ctx;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 60);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 - 10);
    ctx.fillText(`Level Reached: ${this.gameState.level}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
    
    ctx.fillStyle = '#888888';
    ctx.font = '18px Arial';
    ctx.fillText('Press SPACE to restart', this.canvas.width / 2, this.canvas.height / 2 + 80);
  }
  
  restart() {
    this.gameState = {
      time: 0,
      score: 0,
      highScore: this.gameState.highScore,
      level: 1,
      lives: 4,
      status: 'playing',
      player: null,
      bullets: [],
      enemyBullets: [],
      enemies: [],
      asteroids: [],
      planets: this.gameState.planets,
      powerups: [],
      particles: [],
      nebula: this.gameState.nebula,
      blackHole: null,
      boss: null,
      bossPhase: 0,
      mission: null,
      missionTimer: 0,
      missionComplete: false,
      warpEffect: false,
      warpTimer: 0,
      combo: 0,
      multiplier: 1,
      difficulty: 1,
      energy: 100,
      maxEnergy: 100,
      energyRegen: 0.1,
      specialReady: false,
      specialCooldown: 0
    };
    
    this.keys = {};
    this.start();
  }
}

window.GalacticWarsGame = GalacticWarsGame;