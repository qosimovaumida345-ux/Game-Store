// Machine Gunner - Run and Gun
class MachineGunnerGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.players = players;
    this.gameId = gameId;
    this.isRunning = false;
    this.lastTime = 0;
    this.keys = {};
    this.mousePos = { x: 0, y: 0 };
    this.mouseDown = false;
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    window.addEventListener('keydown', e => this.keys[e.code] = true);
    window.addEventListener('keyup', e => this.keys[e.code] = false);
    
    this.canvas.addEventListener('mousemove', e => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos.x = e.clientX - rect.left;
      this.mousePos.y = e.clientY - rect.top;
    });
    this.canvas.addEventListener('mousedown', () => this.mouseDown = true);
    this.canvas.addEventListener('mouseup', () => this.mouseDown = false);
    
    this.gameState = {
      time: 0,
      score: 0,
      highScore: parseInt(localStorage.getItem('machineGunnerHighScore')) || 0,
      wave: 1,
      lives: 3,
      status: 'playing',
      player: null,
      bullets: [],
      enemies: [],
      grenades: [],
      powerups: [],
      coverPoints: [],
      currentObjective: null,
      objectives: [],
      objectiveIndex: 0,
      mapWidth: 2000,
      mapHeight: 1500,
      camera: { x: 0, y: 0 },
      chaos: 0,
      combo: 0,
      meleeStreak: 0,
      weaponHeat: 0,
      overheat: false,
      reloadProgress: 0,
      isReloading: false,
      adrenaline: 0,
      maxAdrenaline: 100,
      bulletsFired: 0,
      accuracy: 100,
      headshots: 0,
      coverUsed: 0,
      lastMeleeTime: 0,
      meleeAvailable: true
    };
    
    this.initLevel();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initLevel() {
    this.gameState.objectives = [
      { name: 'Eliminate All Enemies', type: 'kill', target: 20 },
      { name: 'Survive the Wave', type: 'survive', duration: 60 },
      { name: 'Use Cover Effectively', type: 'cover', target: 10 },
      { name: 'Get Close Kills', type: 'melee', target: 5 },
      { name: 'No Missed Shots', type: 'accuracy', target: 30 },
      { name: 'Stay Moving', type: 'movement', distance: 2000 }
    ];
    
    this.gameState.currentObjective = this.gameState.objectives[0];
    
    this.gameState.coverPoints = [];
    for (let i = 0; i < 30; i++) {
      this.gameState.coverPoints.push({
        x: Math.random() * this.gameState.mapWidth,
        y: Math.random() * this.gameState.mapHeight,
        type: ['wall', 'crate', 'barricade', 'vehicle'][Math.floor(Math.random() * 4)],
        width: 40 + Math.random() * 40,
        height: 30 + Math.random() * 30
      });
    }
  }
  
  start() {
    const playerName = this.players[0] || 'Gunner';
    this.gameState.player = {
      x: this.gameState.mapWidth / 2,
      y: this.gameState.mapHeight / 2,
      width: 30,
      height: 40,
      speed: 5,
      health: 100,
      maxHealth: 100,
      weapon: 'machine_gun',
      weapons: ['machine_gun', 'shotgun', 'assault_rifle', 'rocket_launcher', 'flamethrower'],
      weaponIndex: 0,
      ammo: { machine_gun: 100, shotgun: 20, assault_rifle: 60, rocket_launcher: 5, flamethrower: 100 },
      shootCooldown: 0,
      shootDelay: 80,
      inCover: false,
      coverObject: null,
      facingAngle: 0,
      dashCooldown: 0,
      dashDuration: 0,
      meleeCooldown: 0,
      invincible: false,
      invincibleTimer: 0,
      killStreak: 0,
      killStreakTimer: 0
    };
    
    this.spawnInitialEnemies();
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }
  
  spawnInitialEnemies() {
    for (let i = 0; i < 15; i++) {
      this.spawnEnemy();
    }
  }
  
  spawnEnemy() {
    const types = ['soldier', 'heavy', 'runner', 'grenadier', 'sniper', 'medic', 'commander'];
    const weights = [0.35, 0.15, 0.2, 0.1, 0.1, 0.05, 0.05];
    
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
    
    const angle = Math.random() * Math.PI * 2;
    const distance = 300 + Math.random() * 400;
    
    enemy.x = this.gameState.player.x + Math.cos(angle) * distance;
    enemy.y = this.gameState.player.y + Math.sin(angle) * distance;
    
    enemy.x = Math.max(50, Math.min(this.gameState.mapWidth - 50, enemy.x));
    enemy.y = Math.max(50, Math.min(this.gameState.mapHeight - 50, enemy.y));
    
    enemy.alive = true;
    this.gameState.enemies.push(enemy);
  }
  
  createEnemyByType(type) {
    const baseProps = {
      soldier: { width: 25, height: 40, health: 3, speed: 2, damage: 10, points: 100, shootChance: 0.02 },
      heavy: { width: 40, height: 50, health: 8, speed: 1, damage: 25, points: 200, shootChance: 0.015 },
      runner: { width: 20, height: 35, health: 2, speed: 5, damage: 8, points: 75, shootChance: 0.025 },
      grenadier: { width: 30, height: 45, health: 4, speed: 1.5, damage: 30, points: 150, grenade: true },
      sniper: { width: 25, height: 40, health: 2, speed: 1, damage: 50, points: 200, ranged: true },
      medic: { width: 25, height: 40, health: 3, speed: 2, damage: 8, points: 125, heal: true },
      commander: { width: 30, height: 45, health: 6, speed: 1.5, damage: 15, points: 300, buffs: true }
    };
    
    const props = baseProps[type];
    const waveMultiplier = 1 + this.gameState.wave * 0.2;
    
    return {
      type: type,
      x: 0,
      y: 0,
      width: props.width,
      height: props.height,
      health: Math.floor(props.health * waveMultiplier),
      maxHealth: Math.floor(props.health * waveMultiplier),
      speed: props.speed,
      damage: props.damage,
      points: Math.floor(props.points * waveMultiplier),
      shootChance: props.shootChance,
      grenade: props.grenade || false,
      ranged: props.ranged || false,
      heal: props.heal || false,
      buffs: props.buffs || false,
      lastShot: Math.random() * 2000,
      state: 'chase',
      accuracy: 0.7,
      shooting: false
    };
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
    this.gameState.chaos = Math.min(100, this.gameState.chaos + deltaTime * 0.001);
    
    this.updatePlayer(deltaTime);
    this.updateCamera();
    this.updateEnemies(deltaTime);
    this.updateBullets(deltaTime);
    this.updateGrenades(deltaTime);
    this.updatePowerups(deltaTime);
    this.updateObjective(deltaTime);
    this.checkCollisions();
    this.spawnEnemyIfNeeded();
    
    if (this.gameState.player.killStreakTimer > 0) {
      this.gameState.player.killStreakTimer -= deltaTime;
      if (this.gameState.player.killStreakTimer <= 0) {
        this.gameState.player.killStreak = 0;
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
    
    if (player.dashDuration > 0) {
      player.dashDuration -= deltaTime;
    }
    
    if (player.meleeCooldown > 0) {
      player.meleeCooldown -= deltaTime;
    } else {
      this.gameState.meleeAvailable = true;
    }
    
    if (this.keys['KeyC']) {
      this.checkCover();
      this.keys['KeyC'] = false;
    }
    
    if (!player.inCover) {
      let inputX = 0;
      let inputY = 0;
      
      if (this.keys['KeyW'] || this.keys['ArrowUp']) inputY = -1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) inputY = 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputX = -1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) inputX = 1;
      
      if (inputX !== 0 || inputY !== 0) {
        let speed = player.speed;
        
        if (player.dashDuration > 0) {
          speed *= 2;
        }
        
        player.x += inputX * speed;
        player.y += inputY * speed;
        
        if (this.gameState.currentObjective.type === 'movement') {
          this.gameState.currentObjective.distanceTraveled = 
            (this.gameState.currentObjective.distanceTraveled || 0) + speed;
        }
      }
      
      if (this.keys['ShiftLeft'] && player.dashCooldown <= 0) {
        player.dashDuration = 300;
        player.dashCooldown = 2000;
        this.createDashEffect();
      }
    }
    
    if (player.dashCooldown > 0) {
      player.dashCooldown -= deltaTime;
    }
    
    if (this.keys['KeyQ']) {
      player.weaponIndex = (player.weaponIndex + 1) % player.weapons.length;
      player.weapon = player.weapons[player.weaponIndex];
      player.shootDelay = this.getFireRate(player.weapon);
      this.keys['KeyQ'] = false;
    }
    
    if (this.keys['KeyE'] && this.gameState.meleeAvailable && player.meleeCooldown <= 0) {
      this.meleeAttack();
    }
    
    player.x = Math.max(0, Math.min(this.gameState.mapWidth, player.x));
    player.y = Math.max(0, Math.min(this.gameState.mapHeight, player.y));
    
    const worldMouseX = this.mousePos.x + this.gameState.camera.x;
    const worldMouseY = this.mousePos.y + this.gameState.camera.y;
    player.facingAngle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);
    
    if (this.mouseDown && player.shootCooldown <= 0 && 
        player.ammo[player.weapon] > 0 && !this.gameState.overheat) {
      this.shoot();
      player.shootCooldown = player.shootDelay;
      player.ammo[player.weapon]--;
      player.bulletsFired++;
      
      this.gameState.bulletsFired++;
    }
    
    if (player.shootCooldown > 0) {
      player.shootCooldown -= deltaTime;
    }
    
    if (this.gameState.weaponHeat > 80 && !this.gameState.overheat) {
      this.gameState.overheat = true;
      player.shootCooldown = 2000;
    }
    
    if (this.gameState.overheat) {
      this.gameState.weaponHeat = Math.max(0, this.gameState.weaponHeat - deltaTime * 0.5);
      if (this.gameState.weaponHeat <= 20) {
        this.gameState.overheat = false;
      }
    } else {
      this.gameState.weaponHeat = Math.max(0, this.gameState.weaponHeat - deltaTime * 0.1);
    }
    
    if (this.mouseDown && player.inCover) {
      player.inCover = false;
      player.coverObject = null;
    }
  }
  
  checkCover() {
    const player = this.gameState.player;
    if (!player) return;
    
    const coverPoint = this.findNearestCover(player.x, player.y);
    if (coverPoint && this.getDistance(player, coverPoint) < 50) {
      player.inCover = true;
      player.coverObject = coverPoint;
      player.x = coverPoint.x;
      player.y = coverPoint.y;
      this.gameState.coverUsed++;
      
      if (this.gameState.currentObjective.type === 'cover') {
        this.gameState.currentObjective.count = (this.gameState.currentObjective.count || 0) + 1;
      }
    }
  }
  
  findNearestCover(x, y) {
    let nearest = null;
    let minDist = Infinity;
    
    this.gameState.coverPoints.forEach(cover => {
      const dist = this.getDistance({ x, y }, cover);
      if (dist < minDist && dist < 60) {
        minDist = dist;
        nearest = cover;
      }
    });
    
    return nearest;
  }
  
  getFireRate(weapon) {
    const fireRates = {
      machine_gun: 60,
      shotgun: 600,
      assault_rifle: 100,
      rocket_launcher: 1500,
      flamethrower: 30
    };
    return fireRates[weapon] || 100;
  }
  
  shoot() {
    const player = this.gameState.player;
    if (!player) return;
    
    this.gameState.weaponHeat = Math.min(100, this.gameState.weaponHeat + 2);
    
    const worldMouseX = this.mousePos.x + this.gameState.camera.x;
    const worldMouseY = this.mousePos.y + this.gameState.camera.y;
    const angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);
    
    const spread = this.gameState.overheat ? 0.2 : 0.05;
    
    switch (player.weapon) {
      case 'machine_gun':
      case 'assault_rifle':
        const bulletAngle = angle + (Math.random() - 0.5) * spread;
        this.gameState.bullets.push({
          x: player.x + Math.cos(angle) * 20,
          y: player.y + Math.sin(angle) * 20,
          vx: Math.cos(bulletAngle) * 15,
          vy: Math.sin(bulletAngle) * 15,
          damage: player.weapon === 'assault_rifle' ? 15 : 12,
          type: 'bullet',
          radius: 3
        });
        break;
        
      case 'shotgun':
        for (let i = -4; i <= 4; i++) {
          const bulletAngle = angle + i * 0.15;
          this.gameState.bullets.push({
            x: player.x + Math.cos(angle) * 20,
            y: player.y + Math.sin(angle) * 20,
            vx: Math.cos(bulletAngle) * 12,
            vy: Math.sin(bulletAngle) * 12,
            damage: 10,
            type: 'shotgun',
            radius: 2
          });
        }
        break;
        
      case 'rocket_launcher':
        this.gameState.bullets.push({
          x: player.x + Math.cos(angle) * 20,
          y: player.y + Math.sin(angle) * 20,
          vx: Math.cos(angle) * 10,
          vy: Math.sin(angle) * 10,
          damage: 100,
          type: 'rocket',
          radius: 8,
          explosive: true,
          explosionRadius: 80
        });
        break;
        
      case 'flamethrower':
        for (let i = -2; i <= 2; i++) {
          const bulletAngle = angle + i * 0.2;
          this.gameState.bullets.push({
            x: player.x + Math.cos(angle) * 15,
            y: player.y + Math.sin(angle) * 15,
            vx: Math.cos(bulletAngle) * 8,
            vy: Math.sin(bulletAngle) * 8,
            damage: 5,
            type: 'flame',
            radius: 10,
            lifetime: 500
          });
        }
        break;
    }
    
    this.playSound('shoot');
  }
  
  meleeAttack() {
    const player = this.gameState.player;
    if (!player) return;
    
    player.meleeCooldown = 800;
    this.gameState.meleeAvailable = false;
    
    const meleeRange = 50;
    const meleeDamage = 50;
    
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      
      const dist = this.getDistance(player, enemy);
      if (dist < meleeRange) {
        enemy.health -= meleeDamage;
        
        if (enemy.health <= 0) {
          this.killEnemy(enemy);
          this.gameState.meleeStreak++;
          
          if (this.gameState.currentObjective.type === 'melee') {
            this.gameState.currentObjective.count = (this.gameState.currentObjective.count || 0) + 1;
          }
        }
        
        const knockback = 10;
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        enemy.x += (dx / len) * knockback;
        enemy.y += (dy / len) * knockback;
      }
    });
    
    this.createMeleeEffect(player.x, player.y, player.facingAngle);
    this.playSound('melee');
  }
  
  createMeleeEffect(x, y, angle) {
    for (let i = 0; i < 5; i++) {
      const offsetAngle = angle + (Math.random() - 0.5) * 0.5;
      this.gameState.particles = this.gameState.particles || [];
      this.gameState.particles.push({
        x: x + Math.cos(angle) * 30,
        y: y + Math.sin(angle) * 30,
        vx: Math.cos(offsetAngle) * 5,
        vy: Math.sin(offsetAngle) * 5,
        color: '#ff8800',
        size: 4,
        lifetime: 300
      });
    }
  }
  
  createDashEffect() {
    const player = this.gameState.player;
    if (!player) return;
    
    for (let i = 0; i < 8; i++) {
      this.gameState.particles = this.gameState.particles || [];
      this.gameState.particles.push({
        x: player.x - (Math.random() - 0.5) * 20,
        y: player.y - (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        color: '#00ffff',
        size: 5,
        lifetime: 200
      });
    }
  }
  
  updateCamera() {
    const player = this.gameState.player;
    if (!player) return;
    
    const targetX = player.x - this.canvas.width / 2;
    const targetY = player.y - this.canvas.height / 2;
    
    this.gameState.camera.x += (targetX - this.gameState.camera.x) * 0.1;
    this.gameState.camera.y += (targetY - this.gameState.camera.y) * 0.1;
    
    this.gameState.camera.x = Math.max(0, Math.min(this.gameState.mapWidth - this.canvas.width, this.gameState.camera.x));
    this.gameState.camera.y = Math.max(0, Math.min(this.gameState.mapHeight - this.canvas.height, this.gameState.camera.y));
  }
  
  updateEnemies(deltaTime) {
    const player = this.gameState.player;
    if (!player) return;
    
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      
      if (enemy.buffs) {
        this.buffNearbyEnemies(enemy);
      }
      
      if (enemy.heal && Math.random() < 0.005) {
        this.healNearbyEnemies(enemy);
      }
      
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 150) {
        enemy.x += (dx / dist) * enemy.speed;
        enemy.y += (dy / dist) * enemy.speed;
      }
      
      if (enemy.grenade && dist < 200 && Math.random() < 0.01) {
        this.throwGrenade(enemy, player);
      }
      
      enemy.lastShot -= deltaTime;
      if (enemy.lastShot <= 0 && dist < 300) {
        if (Math.random() < enemy.shootChance) {
          this.spawnEnemyBullet(enemy);
          enemy.lastShot = 1500;
        }
      }
    });
  }
  
  buffNearbyEnemies(enemy) {
    this.gameState.enemies.forEach(other => {
      if (other === enemy || !other.alive) return;
      
      const dist = this.getDistance(enemy, other);
      if (dist < 100) {
        other.speed *= 1.1;
        other.damage *= 1.2;
      }
    });
  }
  
  healNearbyEnemies(medic) {
    this.gameState.enemies.forEach(other => {
      if (other === medic || !other.alive) return;
      
      const dist = this.getDistance(medic, other);
      if (dist < 80 && other.health < other.maxHealth) {
        other.health = Math.min(other.maxHealth, other.health + 1);
      }
    });
  }
  
  throwGrenade(enemy, player) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    this.gameState.grenades.push({
      x: enemy.x,
      y: enemy.y,
      vx: (dx / dist) * 5,
      vy: (dy / dist) * 5,
      timer: 2000,
      damage: 40,
      radius: 30
    });
  }
  
  spawnEnemyBullet(enemy) {
    const player = this.gameState.player;
    if (!player) return;
    
    const dx = player.x - enemy.x + (Math.random() - 0.5) * 50;
    const dy = player.y - enemy.y + (Math.random() - 0.5) * 50;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    this.gameState.bullets.push({
      x: enemy.x,
      y: enemy.y,
      vx: (dx / dist) * 6,
      vy: (dy / dist) * 6,
      damage: enemy.damage,
      type: 'enemy',
      radius: 4
    });
  }
  
  updateBullets(deltaTime) {
    this.gameState.bullets.forEach(bullet => {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      
      if (bullet.lifetime) {
        bullet.lifetime -= deltaTime;
        if (bullet.lifetime <= 0) {
          bullet.active = false;
        }
      }
      
      if (bullet.type === 'flame') {
        bullet.vx *= 0.95;
        bullet.vy *= 0.95;
      }
      
      if (bullet.x < 0 || bullet.x > this.gameState.mapWidth ||
          bullet.y < 0 || bullet.y > this.gameState.mapHeight) {
        bullet.active = false;
      }
    });
    
    this.gameState.bullets = this.gameState.bullets.filter(b => b.active !== false);
  }
  
  updateGrenades(deltaTime) {
    this.gameState.grenades.forEach(grenade => {
      grenade.x += grenade.vx;
      grenade.y += grenade.vy;
      grenade.vy += 0.2;
      
      grenade.timer -= deltaTime;
      if (grenade.timer <= 0) {
        grenade.exploded = true;
        this.createExplosion(grenade.x, grenade.y, grenade.radius, grenade.damage);
      }
    });
    
    this.gameState.grenades = this.gameState.grenades.filter(g => !g.exploded);
  }
  
  createExplosion(x, y, radius, damage) {
    const player = this.gameState.player;
    
    if (player) {
      const dist = this.getDistance(player, { x, y });
      if (dist < radius) {
        const damagePercent = 1 - (dist / radius);
        this.damagePlayer(damage * damagePercent);
      }
    }
    
    this.gameState.enemies.forEach(enemy => {
      const dist = this.getDistance(enemy, { x, y });
      if (dist < radius) {
        const damagePercent = 1 - (dist / radius);
        enemy.health -= damage * damagePercent;
        
        if (enemy.health <= 0) {
          this.killEnemy(enemy);
        }
      }
    });
    
    for (let i = 0; i < 20; i++) {
      this.gameState.particles = this.gameState.particles || [];
      this.gameState.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        color: '#ff8800',
        size: 6,
        lifetime: 500
      });
    }
  }
  
  updatePowerups(deltaTime) {
    if (Math.random() < 0.003) {
      const types = ['health', 'ammo', 'weapon', 'adrenaline', 'special'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      this.gameState.powerups.push({
        x: Math.random() * (this.gameState.mapWidth - 40) + 20,
        y: Math.random() * (this.gameState.mapHeight - 40) + 20,
        width: 25,
        height: 25,
        type: type,
        rotation: 0
      });
    }
    
    this.gameState.powerups.forEach(powerup => {
      powerup.rotation += 0.05;
    });
  }
  
  updateObjective(deltaTime) {
    if (!this.gameState.currentObjective) return;
    
    switch (this.gameState.currentObjective.type) {
      case 'kill':
        break;
        
      case 'survive':
        this.gameState.currentObjective.elapsed = (this.gameState.currentObjective.elapsed || 0) + deltaTime / 1000;
        if (this.gameState.currentObjective.elapsed >= this.gameState.currentObjective.duration) {
          this.completeObjective();
        }
        break;
        
      case 'cover':
        break;
        
      case 'melee':
        break;
        
      case 'accuracy':
        this.gameState.currentObjective.shotsFired = (this.gameState.currentObjective.shotsFired || 0) + this.gameState.bulletsFired;
        if (this.gameState.currentObjective.shotsFired >= this.gameState.currentObjective.target) {
          const killedEnemies = this.gameState.enemies.filter(e => !e.alive).length;
          if (killedEnemies > 0) {
            this.gameState.score += 2000;
            this.completeObjective();
          }
        }
        break;
        
      case 'movement':
        break;
    }
  }
  
  completeObjective() {
    this.gameState.score += 1000;
    this.gameState.wave++;
    this.gameState.objectiveIndex = (this.gameState.objectiveIndex + 1) % this.gameState.objectives.length;
    this.gameState.currentObjective = this.gameState.objectives[this.gameState.objectiveIndex];
    this.gameState.currentObjective.count = 0;
    this.gameState.currentObjective.distanceTraveled = 0;
    this.gameState.currentObjective.elapsed = 0;
    this.gameState.currentObjective.shotsFired = 0;
    
    for (let i = 0; i < 10 + this.gameState.wave * 2; i++) {
      this.spawnEnemy();
    }
    
    this.playSound('objective');
  }
  
  checkCollisions() {
    const player = this.gameState.player;
    if (!player) return;
    
    this.gameState.bullets.forEach(bullet => {
      if (!bullet.active) return;
      
      this.gameState.enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        if (this.checkCircleRectCollision(bullet, enemy)) {
          bullet.active = false;
          enemy.health -= bullet.damage;
          
          if (enemy.health <= 0) {
            this.killEnemy(enemy);
          } else {
            this.createHitEffect(bullet.x, bullet.y);
          }
        }
      });
    });
    
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      
      if (this.checkCircleRectCollision(player, enemy)) {
        this.damagePlayer(enemy.damage);
      }
    });
    
    this.gameState.powerups.forEach(powerup => {
      if (this.checkCircleRectCollision(player, powerup)) {
        this.collectPowerup(powerup);
        powerup.active = false;
      }
    });
  }
  
  checkCircleRectCollision(circle, rect) {
    const closestX = Math.max(rect.x - rect.width / 2, Math.min(circle.x, rect.x + rect.width / 2));
    const closestY = Math.max(rect.y - rect.height / 2, Math.min(circle.y, rect.y + rect.height / 2));
    
    const distanceX = circle.x - closestX;
    const distanceY = circle.y - closestY;
    
    return (distanceX * distanceX + distanceY * distanceY) < (circle.radius || 5) * (circle.radius || 5);
  }
  
  getDistance(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }
  
  killEnemy(enemy) {
    enemy.alive = false;
    
    this.gameState.combo++;
    this.gameState.score += enemy.points * Math.min(this.gameState.combo, 10);
    
    this.gameState.player.killStreak++;
    this.gameState.player.killStreakTimer = 3000;
    
    this.gameState.adrenaline = Math.min(this.gameState.maxAdrenaline, this.gameState.adrenaline + 10);
    
    this.createExplosion(enemy.x, enemy.y, 15, '#ff0000');
    
    if (this.gameState.currentObjective.type === 'kill') {
      this.gameState.currentObjective.count = (this.gameState.currentObjective.count || 0) + 1;
      if (this.gameState.currentObjective.count >= this.gameState.currentObjective.target) {
        this.completeObjective();
      }
    }
    
    this.playSound('kill');
  }
  
  createHitEffect(x, y) {
    for (let i = 0; i < 5; i++) {
      this.gameState.particles = this.gameState.particles || [];
      this.gameState.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        color: '#ffff00',
        size: 3,
        lifetime: 200
      });
    }
  }
  
  damagePlayer(damage) {
    const player = this.gameState.player;
    if (!player || player.invincible) return;
    
    player.health -= damage;
    player.invincible = true;
    player.invincibleTimer = 500;
    
    this.gameState.combo = 0;
    this.gameState.meleeStreak = 0;
    
    this.playSound('hit');
    
    if (player.health <= 0) {
      this.gameState.lives--;
      player.health = player.maxHealth;
      player.invincibleTimer = 2000;
      
      if (this.gameState.lives <= 0) {
        this.gameOver();
      }
    }
  }
  
  collectPowerup(powerup) {
    const player = this.gameState.player;
    if (!player) return;
    
    switch (powerup.type) {
      case 'health':
        player.health = Math.min(player.maxHealth, player.health + 30);
        break;
      case 'ammo':
        player.ammo[player.weapon] += 30;
        break;
      case 'weapon':
        player.weaponIndex = (player.weaponIndex + 1) % player.weapons.length;
        player.weapon = player.weapons[player.weaponIndex];
        break;
      case 'adrenaline':
        this.gameState.adrenaline = this.gameState.maxAdrenaline;
        break;
      case 'special':
        this.activateSpecial();
        break;
    }
    
    this.createHitEffect(powerup.x, powerup.y);
    this.playSound('powerup');
  }
  
  activateSpecial() {
    const player = this.gameState.player;
    if (!player) return;
    
    player.invincible = true;
    player.invincibleTimer = 5000;
    
    this.gameState.enemies.forEach(enemy => {
      enemy.health -= 50;
      if (enemy.health <= 0) {
        this.killEnemy(enemy);
      }
    });
    
    this.gameState.adrenaline = 0;
    this.playSound('special');
  }
  
  spawnEnemyIfNeeded() {
    const aliveEnemies = this.gameState.enemies.filter(e => e.alive).length;
    const targetEnemies = 10 + this.gameState.wave * 2;
    
    if (aliveEnemies < targetEnemies && Math.random() < 0.02) {
      this.spawnEnemy();
    }
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
          shoot: 300,
          kill: 150,
          hit: 400,
          powerup: 800,
          objective: 600,
          melee: 200,
          special: 500
        };
        
        oscillator.frequency.value = frequencies[type] || 440;
        oscillator.type = 'square';
        gainNode.gain.value = 0.05;
        
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
      localStorage.setItem('machineGunnerHighScore', this.gameState.highScore);
    }
  }
  
  render() {
    const ctx = this.ctx;
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    ctx.save();
    ctx.translate(-this.gameState.camera.x, -this.gameState.camera.y);
    
    this.renderMap();
    this.renderCoverPoints();
    this.renderPowerups();
    this.renderEnemies();
    this.renderPlayer();
    this.renderBullets();
    this.renderGrenades();
    this.renderParticles();
    
    ctx.restore();
    
    this.renderUI();
  }
  
  renderMap() {
    const ctx = this.ctx;
    
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, this.gameState.mapWidth, this.gameState.mapHeight);
    
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    
    for (let x = 0; x < this.gameState.mapWidth; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.gameState.mapHeight);
      ctx.stroke();
    }
    
    for (let y = 0; y < this.gameState.mapHeight; y += 100) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.gameState.mapWidth, y);
      ctx.stroke();
    }
  }
  
  renderCoverPoints() {
    const ctx = this.ctx;
    
    this.gameState.coverPoints.forEach(cover => {
      ctx.fillStyle = '#444444';
      ctx.fillRect(cover.x - cover.width / 2, cover.y - cover.height / 2, cover.width, cover.height);
      
      ctx.fillStyle = '#333333';
      if (cover.type === 'crate') {
        ctx.fillRect(cover.x - cover.width / 2 + 3, cover.y - cover.height / 2 + 3, 
                    cover.width - 6, cover.height - 6);
      } else if (cover.type === 'vehicle') {
        ctx.fillRect(cover.x - cover.width / 2 + 5, cover.y - cover.height / 2 + 5, 
                    cover.width - 10, cover.height - 15);
      }
    });
  }
  
  renderPowerups() {
    const ctx = this.ctx;
    
    this.gameState.powerups.forEach(powerup => {
      if (powerup.active === false) return;
      
      ctx.save();
      ctx.translate(powerup.x, powerup.y);
      ctx.rotate(powerup.rotation);
      
      const colors = {
        health: '#ff0000',
        ammo: '#ffff00',
        weapon: '#00ff00',
        adrenaline: '#ff00ff',
        special: '#00ffff'
      };
      
      ctx.fillStyle = colors[powerup.type];
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(powerup.type[0].toUpperCase(), 0, 0);
      
      ctx.restore();
    });
  }
  
  renderEnemies() {
    const ctx = this.ctx;
    
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      
      const colors = {
        soldier: '#556644',
        heavy: '#664444',
        runner: '#666666',
        grenadier: '#665544',
        sniper: '#445566',
        medic: '#666666',
        commander: '#884444'
      };
      
      ctx.fillStyle = colors[enemy.type];
      ctx.fillRect(enemy.x - enemy.width / 2, enemy.y - enemy.height / 2, enemy.width, enemy.height);
      
      ctx.fillStyle = '#333333';
      ctx.fillRect(enemy.x - 5, enemy.y - enemy.height / 2 - 10, 4, 4);
      ctx.fillRect(enemy.x + 1, enemy.y - enemy.height / 2 - 10, 4, 4);
      
      if (enemy.maxHealth > 3) {
        ctx.fillStyle = '#333333';
        ctx.fillRect(enemy.x - 15, enemy.y - enemy.height / 2 - 15, 30, 4);
        ctx.fillStyle = enemy.health > enemy.maxHealth * 0.5 ? '#00ff00' : '#ff0000';
        ctx.fillRect(enemy.x - 15, enemy.y - enemy.height / 2 - 15, 30 * (enemy.health / enemy.maxHealth), 4);
      }
    });
  }
  
  renderPlayer() {
    const player = this.gameState.player;
    if (!player) return;
    
    const ctx = this.ctx;
    
    ctx.save();
    ctx.translate(player.x, player.y);
    
    if (player.invincible && Math.floor(this.gameState.time / 100) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }
    
    if (player.inCover) {
      ctx.fillStyle = '#4488aa';
    } else {
      ctx.fillStyle = '#4488ff';
    }
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    
    ctx.fillStyle = '#ffcc88';
    ctx.beginPath();
    ctx.arc(0, -player.height / 2 - 8, 10, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.save();
    ctx.rotate(player.facingAngle);
    ctx.fillStyle = '#333333';
    ctx.fillRect(10, -3, 25, 6);
    ctx.restore();
    
    if (player.dashDuration > 0) {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  renderBullets() {
    const ctx = this.ctx;
    
    this.gameState.bullets.forEach(bullet => {
      if (!bullet.active) return;
      
      if (bullet.type === 'flame') {
        ctx.fillStyle = `rgba(255, ${100 + Math.random() * 100}, 0, 0.8)`;
      } else if (bullet.type === 'rocket') {
        ctx.fillStyle = '#ff8800';
      } else if (bullet.type === 'enemy') {
        ctx.fillStyle = '#ff0000';
      } else {
        ctx.fillStyle = '#ffff00';
      }
      
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  
  renderGrenades() {
    const ctx = this.ctx;
    
    this.gameState.grenades.forEach(grenade => {
      ctx.fillStyle = '#444444';
      ctx.beginPath();
      ctx.arc(grenade.x, grenade.y, 6, 0, Math.PI * 2);
      ctx.fill();
      
      const flash = (grenade.timer < 500) ? (500 - grenade.timer) / 500 : 0;
      ctx.fillStyle = `rgba(255, 100, 0, ${flash})`;
      ctx.beginPath();
      ctx.arc(grenade.x, grenade.y, 10, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  
  renderParticles() {
    const ctx = this.ctx;
    this.gameState.particles = this.gameState.particles || [];
    
    this.gameState.particles.forEach(particle => {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.lifetime / 500;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.globalAlpha = 1;
  }
  
  renderUI() {
    const ctx = this.ctx;
    const player = this.gameState.player;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    ctx.fillText(`Wave: ${this.gameState.wave}`, 20, 55);
    
    ctx.textAlign = 'right';
    ctx.fillText(`High: ${this.gameState.highScore}`, this.canvas.width - 20, 30);
    ctx.fillText(`Lives: ${this.gameState.lives}`, this.canvas.width - 20, 55);
    
    if (player) {
      ctx.fillStyle = '#333333';
      ctx.fillRect(20, 70, 150, 15);
      ctx.fillStyle = player.health > 30 ? '#00ff00' : '#ff0000';
      ctx.fillRect(20, 70, 150 * (player.health / player.maxHealth), 15);
      ctx.fillStyle = '#888888';
      ctx.fillText('Health', 20, 100);
      
      ctx.fillStyle = '#333333';
      ctx.fillRect(this.canvas.width - 170, 70, 150, 15);
      ctx.fillStyle = '#ff8800';
      ctx.fillRect(this.canvas.width - 170, 70, 150 * (this.gameState.adrenaline / this.gameState.maxAdrenaline), 15);
      ctx.fillStyle = '#888888';
      ctx.textAlign = 'right';
      ctx.fillText('Adrenaline', this.canvas.width - 20, 100);
      
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffff00';
      ctx.fillText(`Weapon: ${player.weapon.replace('_', ' ').toUpperCase()}`, 20, 125);
      ctx.fillText(`Ammo: ${player.ammo[player.weapon]}`, this.canvas.width - 100, 125);
      
      ctx.fillStyle = this.gameState.overheat ? '#ff0000' : '#00ff00';
      ctx.fillText(`Heat: ${Math.floor(this.gameState.weaponHeat)}%`, 20, 150);
    }
    
    ctx.fillStyle = '#888888';
    ctx.fillText(`Chaos: ${Math.floor(this.gameState.chaos)}%`, this.canvas.width / 2 - 50, 30);
    
    if (this.gameState.player.killStreak > 2) {
      ctx.fillStyle = '#ff8800';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.gameState.player.killStreak} KILL STREAK!`, this.canvas.width / 2, 60);
    }
    
    if (this.gameState.currentObjective) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(10, this.canvas.height - 70, 250, 60);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Objective: ${this.gameState.currentObjective.name}`, 20, this.canvas.height - 50);
      
      let progress = 0;
      switch (this.gameState.currentObjective.type) {
        case 'kill':
          progress = (this.gameState.currentObjective.count || 0) / this.gameState.currentObjective.target;
          break;
        case 'cover':
          progress = (this.gameState.currentObjective.count || 0) / this.gameState.currentObjective.target;
          break;
        case 'melee':
          progress = (this.gameState.currentObjective.count || 0) / this.gameState.currentObjective.target;
          break;
        case 'survive':
          progress = (this.gameState.currentObjective.elapsed || 0) / this.gameState.currentObjective.duration;
          break;
        case 'movement':
          progress = (this.gameState.currentObjective.distanceTraveled || 0) / this.gameState.currentObjective.distance;
          break;
      }
      
      ctx.fillStyle = '#333333';
      ctx.fillRect(20, this.canvas.height - 30, 200, 10);
      ctx.fillStyle = '#00aaff';
      ctx.fillRect(20, this.canvas.height - 30, 200 * Math.min(progress, 1), 10);
    }
    
    ctx.fillStyle = '#666666';
    ctx.font = '12px Arial';
    ctx.fillText('WASD: Move | SHIFT: Dash | C: Cover | E: Melee | Q: Switch Weapon', 20, this.canvas.height - 10);
    
    if (this.gameState.status === 'gameover') {
      this.renderGameOver();
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
    ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2);
    ctx.fillText(`Waves: ${this.gameState.wave}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
    ctx.fillText(`Melee Kills: ${this.gameState.meleeStreak}`, this.canvas.width / 2, this.canvas.height / 2 + 80);
  }
  
  restart() {
    this.gameState = {
      time: 0,
      score: 0,
      highScore: this.gameState.highScore,
      wave: 1,
      lives: 3,
      status: 'playing',
      player: null,
      bullets: [],
      enemies: [],
      grenades: [],
      powerups: [],
      coverPoints: this.gameState.coverPoints,
      currentObjective: this.gameState.objectives[0],
      objectives: this.gameState.objectives,
      objectiveIndex: 0,
      mapWidth: 2000,
      mapHeight: 1500,
      camera: { x: 0, y: 0 },
      chaos: 0,
      combo: 0,
      meleeStreak: 0,
      weaponHeat: 0,
      overheat: false,
      reloadProgress: 0,
      isReloading: false,
      adrenaline: 0,
      maxAdrenaline: 100,
      bulletsFired: 0,
      accuracy: 100,
      headshots: 0,
      coverUsed: 0,
      lastMeleeTime: 0,
      meleeAvailable: true,
      particles: []
    };
    
    this.start();
  }
}

window.MachineGunnerGame = MachineGunnerGame;