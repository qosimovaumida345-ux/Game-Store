// Tactical Force - Tactical Shooter
class TacticalForceGame {
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
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    
    this.gameState = {
      time: 0,
      score: 0,
      highScore: parseInt(localStorage.getItem('tacticalForceHighScore')) || 0,
      level: 1,
      lives: 1,
      status: 'playing',
      player: null,
      squad: [],
      enemies: [],
      bullets: [],
      grenades: [],
      objectives: [],
      currentObjective: null,
      missionTime: 0,
      stealth: true,
      detected: false,
      detectedTimer: 0,
      suppressed: false,
      suppressionValue: 0,
      tacticalMode: true,
      coverSystem: true,
      reloadTimer: 0,
      isReloading: false,
      magazine: 30,
      maxMagazine: 30,
      reserveAmmo: 90,
      mapWidth: 1500,
      mapHeight: 1200,
      camera: { x: 0, y: 0 },
      visionCones: [],
      alarms: [],
      crates: [],
      vehicles: [],
      nightVision: false,
      thermalVision: false,
      tacticalMap: false
    };
    
    this.initLevel();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initLevel() {
    this.gameState.objectives = [
      { name: 'Infiltrate Base', type: 'infiltrate', target: 1, completed: false },
      { name: 'Eliminate Commander', type: 'eliminate', target: 1, completed: false },
      { name: 'Plant Charges', type: 'plant', target: 3, completed: false },
      { name: 'Extract Team', type: 'extract', target: 1, completed: false },
      { name: 'Sabotage Assets', type: 'sabotage', target: 2, completed: false },
      { name: 'Rescue Hostages', type: 'rescue', target: 3, completed: false }
    ];
    
    this.gameState.currentObjective = this.gameState.objectives[0];
    
    this.gameState.crates = [];
    for (let i = 0; i < 15; i++) {
      this.gameState.crates.push({
        x: Math.random() * this.gameState.mapWidth,
        y: Math.random() * this.gameState.mapHeight,
        type: ['ammo', 'health', 'grenade', 'weapon'][Math.floor(Math.random() * 4)],
        collected: false
      });
    }
    
    this.gameState.vehicles = [
      { x: 200, y: 200, type: 'jeep', destroyed: false },
      { x: 800, y: 600, type: 'tank', destroyed: false }
    ];
  }
  
  start() {
    const playerName = this.players[0] || 'Operative';
    this.gameState.player = {
      x: this.gameState.mapWidth / 2,
      y: this.gameState.mapHeight - 100,
      width: 25,
      height: 35,
      speed: 3,
      health: 100,
      maxHealth: 100,
      weapon: 'assault_rifle',
      angle: -Math.PI / 2,
      inCover: false,
      coverObject: null,
      stealth: true,
      suppressed: false,
      suppressedTimer: 0,
      invulnerable: false,
      invulnerableTimer: 0
    };
    
    this.gameState.squad = [
      { x: this.gameState.mapWidth / 2 + 30, y: this.gameState.mapHeight - 100, health: 80, alive: true, role: 'assault' },
      { x: this.gameState.mapWidth / 2 - 30, y: this.gameState.mapHeight - 100, health: 60, alive: true, role: 'sniper' },
      { x: this.gameState.mapWidth / 2, y: this.gameState.mapHeight - 130, health: 50, alive: true, role: 'medic' }
    ];
    
    this.spawnInitialEnemies();
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }
  
  spawnInitialEnemies() {
    for (let i = 0; i < 12; i++) {
      this.spawnEnemy();
    }
  }
  
  spawnEnemy() {
    const types = ['guard', 'patrol', 'sniper', 'heavy', 'commander'];
    const weights = [0.35, 0.3, 0.15, 0.1, 0.1];
    
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
    
    const spawnPoints = [
      { x: 100, y: 100 },
      { x: this.gameState.mapWidth / 2, y: 100 },
      { x: this.gameState.mapWidth - 100, y: 100 },
      { x: 100, y: 600 },
      { x: this.gameState.mapWidth - 100, y: 600 }
    ];
    
    const spawn = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    enemy.x = spawn.x + (Math.random() - 0.5) * 100;
    enemy.y = spawn.y + (Math.random() - 0.5) * 100;
    enemy.alive = true;
    
    this.gameState.enemies.push(enemy);
  }
  
  createEnemyByType(type) {
    const baseProps = {
      guard: { health: 30, speed: 1.5, damage: 15, points: 100, detection: 150, alert: false },
      patrol: { health: 25, speed: 2, damage: 12, points: 75, detection: 180, route: [] },
      sniper: { health: 20, speed: 1, damage: 40, points: 150, detection: 200, stationary: true },
      heavy: { health: 60, speed: 1, damage: 25, points: 200, detection: 120, armored: true },
      commander: { health: 40, speed: 1.5, damage: 20, points: 300, detection: 200, alerts: true }
    };
    
    const props = baseProps[type];
    const waveMultiplier = 1 + this.gameState.level * 0.1;
    
    const enemy = {
      type: type,
      x: 0,
      y: 0,
      width: 25,
      height: 35,
      health: Math.floor(props.health * waveMultiplier),
      maxHealth: Math.floor(props.health * waveMultiplier),
      speed: props.speed,
      damage: props.damage,
      points: Math.floor(props.points * waveMultiplier),
      detection: props.detection,
      alert: props.alert || false,
      alive: true,
      angle: Math.PI / 2,
      state: 'idle',
      lastShot: Math.random() * 3000,
      patrolPoint: 0,
      patrolPoints: [],
      canSeePlayer: false,
      suppressed: false,
      suppressedTimer: 0
    };
    
    if (type === 'patrol') {
      for (let i = 0; i < 4; i++) {
        enemy.patrolPoints.push({
          x: enemy.x + (Math.random() - 0.5) * 200,
          y: enemy.y + (Math.random() - 0.5) * 200
        });
      }
    }
    
    return enemy;
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
    this.gameState.missionTime += deltaTime / 1000;
    
    this.updatePlayer(deltaTime);
    this.updateSquad(deltaTime);
    this.updateCamera();
    this.updateEnemies(deltaTime);
    this.updateBullets(deltaTime);
    this.updateStealth(deltaTime);
    this.updateSuppression(deltaTime);
    this.checkCollisions();
    this.checkObjective();
  }
  
  updatePlayer(deltaTime) {
    const player = this.gameState.player;
    if (!player) return;
    
    if (player.invulnerable) {
      player.invulnerableTimer -= deltaTime;
      if (player.invulnerableTimer <= 0) {
        player.invulnerable = false;
      }
    }
    
    if (this.keys['KeyC'] && !player.inCover) {
      this.checkForCover();
      this.keys['KeyC'] = false;
    }
    
    if (player.inCover && !this.mouseDown) {
      player.inCover = false;
      player.coverObject = null;
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
        if (player.suppressed) speed *= 0.5;
        player.x += inputX * speed;
        player.y += inputY * speed;
      }
    }
    
    player.x = Math.max(0, Math.min(this.gameState.mapWidth, player.x));
    player.y = Math.max(0, Math.min(this.gameState.mapHeight, player.y));
    
    const worldMouseX = this.mousePos.x + this.gameState.camera.x;
    const worldMouseY = this.mousePos.y + this.gameState.camera.y;
    player.angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);
    
    if (this.mouseDown && player.shootCooldown <= 0 && !player.inCover) {
      this.shoot();
      player.shootCooldown = 150;
    }
    
    if (player.shootCooldown > 0) {
      player.shootCooldown -= deltaTime;
    }
    
    if (this.keys['KeyV']) {
      this.gameState.nightVision = !this.gameState.nightVision;
      this.keys['KeyV'] = false;
    }
    
    if (this.keys['KeyB']) {
      this.gameState.tacticalMap = !this.gameState.tacticalMap;
      this.keys['KeyB'] = false;
    }
    
    if (this.keys['KeyG'] && this.gameState.grenades > 0) {
      this.throwGrenade();
      this.keys['KeyG'] = false;
    }
    
    if (this.keys['KeyR'] && this.gameState.reserveAmmo > 0) {
      player.isReloading = true;
      player.reloadTimer = 2000;
      this.keys['KeyR'] = false;
    }
    
    if (player.isReloading) {
      player.reloadTimer -= deltaTime;
      if (player.reloadTimer <= 0) {
        player.isReloading = false;
        const needed = player.maxMagazine - player.magazine;
        const available = Math.min(needed, this.gameState.reserveAmmo);
        player.magazine += available;
        this.gameState.reserveAmmo -= available;
      }
    }
  }
  
  checkForCover() {
    const player = this.gameState.player;
    if (!player) return;
    
    const coverObjects = [...this.gameState.crates, ...this.gameState.vehicles.filter(v => !v.destroyed)];
    
    for (const obj of coverObjects) {
      const dist = Math.sqrt(Math.pow(player.x - obj.x, 2) + Math.pow(player.y - obj.y, 2));
      if (dist < 40) {
        player.inCover = true;
        player.coverObject = obj;
        player.x = obj.x;
        player.y = obj.y;
        break;
      }
    }
  }
  
  shoot() {
    const player = this.gameState.player;
    if (!player || this.gameState.magazine <= 0) return;
    
    this.gameState.magazine--;
    
    this.gameState.bullets.push({
      x: player.x + Math.cos(player.angle) * 20,
      y: player.y + Math.sin(player.angle) * 20,
      vx: Math.cos(player.angle) * 20,
      vy: Math.sin(player.angle) * 20,
      damage: 25,
      type: 'player',
      radius: 3,
      distance: 0,
      maxDistance: 500
    });
    
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 50) {
        this.gameState.suppressionValue = Math.min(100, this.gameState.suppressionValue + 10);
        enemy.suppressed = true;
        enemy.suppressedTimer = 1000;
      }
    });
    
    this.playSound('shoot');
  }
  
  throwGrenade() {
    const player = this.gameState.player;
    if (!player) return;
    
    const worldMouseX = this.mousePos.x + this.gameState.camera.x;
    const worldMouseY = this.mousePos.y + this.gameState.camera.y;
    
    this.gameState.grenades.push({
      x: player.x,
      y: player.y,
      vx: (worldMouseX - player.x) * 0.05,
      vy: (worldMouseY - player.y) * 0.05,
      timer: 2000,
      damage: 50,
      radius: 80
    });
  }
  
  updateSquad(deltaTime) {
    const player = this.gameState.player;
    if (!player) return;
    
    this.gameState.squad.forEach(soldier => {
      if (!soldier.alive) return;
      
      const dx = player.x - soldier.x;
      const dy = player.y - soldier.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 50) {
        soldier.x += (dx / dist) * 2;
        soldier.y += (dy / dist) * 2;
      }
      
      const target = this.findEnemyForSquad(soldier);
      if (target && Math.random() < 0.02) {
        this.squadShoot(soldier, target);
      }
    });
  }
  
  findEnemyForSquad(soldier) {
    let closest = null;
    let minDist = 200;
    
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      
      const dx = enemy.x - soldier.x;
      const dy = enemy.y - soldier.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist) {
        minDist = dist;
        closest = enemy;
      }
    });
    
    return closest;
  }
  
  squadShoot(soldier, target) {
    const dx = target.x - soldier.x;
    const dy = target.y - soldier.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    this.gameState.bullets.push({
      x: soldier.x,
      y: soldier.y,
      vx: (dx / dist) * 18,
      vy: (dy / dist) * 18,
      damage: 15,
      type: 'squad',
      radius: 3,
      distance: 0,
      maxDistance: 400
    });
  }
  
  updateCamera() {
    const player = this.gameState.player;
    if (!player) return;
    
    const targetX = player.x - this.canvas.width / 2;
    const targetY = player.y - this.canvas.height / 2;
    
    this.gameState.camera.x += (targetX - this.gameState.camera.x) * 0.08;
    this.gameState.camera.y += (targetY - this.gameState.camera.y) * 0.08;
    
    this.gameState.camera.x = Math.max(0, Math.min(this.gameState.mapWidth - this.canvas.width, this.gameState.camera.x));
    this.gameState.camera.y = Math.max(0, Math.min(this.gameState.mapHeight - this.canvas.height, this.gameState.camera.y));
  }
  
  updateEnemies(deltaTime) {
    const player = this.gameState.player;
    if (!player) return;
    
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      
      if (enemy.suppressed) {
        enemy.suppressedTimer -= deltaTime;
        if (enemy.suppressedTimer <= 0) {
          enemy.suppressed = false;
        }
        return;
      }
      
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      if (dist < enemy.detection && player.stealth && !this.gameState.detected) {
        const rayClear = this.checkLineOfSight(enemy.x, enemy.y, player.x, player.y);
        if (!rayClear) {
          enemy.canSeePlayer = true;
          this.triggerAlarm(enemy);
        }
      }
      
      if (enemy.canSeePlayer || dist < enemy.detection * 0.5) {
        enemy.alert = true;
        this.gameState.detected = true;
        this.gameState.detectedTimer = 3000;
        
        if (dist > 30) {
          enemy.x += Math.cos(angle) * enemy.speed * 0.5;
          enemy.y += Math.sin(angle) * enemy.speed * 0.5;
        }
        
        enemy.angle = angle;
        
        enemy.lastShot -= deltaTime;
        if (enemy.lastShot <= 0 && dist < 250) {
          this.enemyShoot(enemy);
          enemy.lastShot = 1500 + Math.random() * 1000;
        }
      } else if (enemy.type === 'patrol') {
        this.updatePatrol(enemy, deltaTime);
      }
    });
    
    if (this.gameState.detectedTimer > 0) {
      this.gameState.detectedTimer -= deltaTime;
      if (this.gameState.detectedTimer <= 0) {
        this.gameState.detected = false;
      }
    }
  }
  
  updatePatrol(enemy, deltaTime) {
    if (enemy.patrolPoints.length === 0) return;
    
    const target = enemy.patrolPoints[enemy.patrolPoint];
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 10) {
      enemy.patrolPoint = (enemy.patrolPoint + 1) % enemy.patrolPoints.length;
    } else {
      enemy.x += (dx / dist) * enemy.speed;
      enemy.y += (dy / dist) * enemy.speed;
      enemy.angle = Math.atan2(dy, dx);
    }
  }
  
  checkLineOfSight(x1, y1, x2, y2) {
    return true;
  }
  
  triggerAlarm(enemy) {
    if (!this.gameState.alarms.some(a => a.x === enemy.x && a.y === enemy.y)) {
      this.gameState.alarms.push({
        x: enemy.x,
        y: enemy.y,
        radius: enemy.detection,
        time: 5000
      });
    }
  }
  
  enemyShoot(enemy) {
    const player = this.gameState.player;
    if (!player) return;
    
    const dx = player.x - enemy.x + (Math.random() - 0.5) * 30;
    const dy = player.y - enemy.y + (Math.random() - 0.5) * 30;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    this.gameState.bullets.push({
      x: enemy.x,
      y: enemy.y,
      vx: (dx / dist) * 10,
      vy: (dy / dist) * 10,
      damage: enemy.damage,
      type: 'enemy',
      radius: 3,
      distance: 0,
      maxDistance: 300
    });
  }
  
  updateBullets(deltaTime) {
    this.gameState.bullets.forEach(bullet => {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      bullet.distance += Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
      
      if (bullet.distance > bullet.maxDistance || 
          bullet.x < 0 || bullet.x > this.gameState.mapWidth ||
          bullet.y < 0 || bullet.y > this.gameState.mapHeight) {
        bullet.active = false;
      }
    });
    
    this.gameState.bullets = this.gameState.bullets.filter(b => b.active !== false);
    
    this.gameState.grenades.forEach(grenade => {
      grenade.x += grenade.vx;
      grenade.y += grenade.vy;
      grenade.vy += 0.2;
      grenade.timer -= deltaTime;
      
      if (grenade.timer <= 0) {
        this.explodeGrenade(grenade);
        grenade.exploded = true;
      }
    });
    
    this.gameState.grenades = this.gameState.grenades.filter(g => !g.exploded);
  }
  
  explodeGrenade(grenade) {
    const player = this.gameState.player;
    
    if (player && !player.invulnerable) {
      const dist = Math.sqrt(Math.pow(player.x - grenade.x, 2) + Math.pow(player.y - grenade.y, 2));
      if (dist < grenade.radius) {
        player.health -= grenade.damage * (1 - dist / grenade.radius);
        if (player.health <= 0) {
          this.gameOver();
        }
      }
    }
    
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      
      const dist = Math.sqrt(Math.pow(enemy.x - grenade.x, 2) + Math.pow(enemy.y - grenade.y, 2));
      if (dist < grenade.radius) {
        enemy.health -= grenade.damage * (1 - dist / grenade.radius);
        if (enemy.health <= 0) {
          this.killEnemy(enemy);
        }
      }
    });
    
    this.createExplosion(grenade.x, grenade.y, grenade.radius);
  }
  
  createExplosion(x, y, radius) {
    for (let i = 0; i < 20; i++) {
      this.gameState.particles = this.gameState.particles || [];
      this.gameState.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        color: '#ff8800',
        size: Math.random() * 6 + 2,
        lifetime: 600
      });
    }
  }
  
  updateStealth(deltaTime) {
    if (!this.gameState.detected) {
      this.gameState.stealth = true;
    } else {
      this.gameState.stealth = false;
    }
  }
  
  updateSuppression(deltaTime) {
    if (this.gameState.suppressionValue > 0) {
      this.gameState.suppressionValue = Math.max(0, this.gameState.suppressionValue - deltaTime * 0.05);
    }
    
    if (this.gameState.suppressionValue > 50) {
      this.gameState.suppressed = true;
    } else {
      this.gameState.suppressed = false;
    }
  }
  
  checkCollisions() {
    const player = this.gameState.player;
    if (!player || player.invulnerable) return;
    
    this.gameState.bullets.forEach(bullet => {
      if (!bullet.active || bullet.type === 'player' || bullet.type === 'squad') return;
      
      const dist = Math.sqrt(Math.pow(bullet.x - player.x, 2) + Math.pow(bullet.y - player.y, 2));
      if (dist < 15 && player.inCover) {
        const coverEfficiency = 0.7;
        const actualDamage = bullet.damage * (1 - coverEfficiency);
        player.health -= actualDamage;
        bullet.active = false;
      } else if (dist < 15) {
        player.health -= bullet.damage;
        player.invulnerable = true;
        player.invulnerableTimer = 500;
        bullet.active = false;
        
        this.gameState.suppressionValue = Math.min(100, this.gameState.suppressionValue + 20);
        
        if (player.health <= 0) {
          this.gameOver();
        }
      }
    });
    
    this.gameState.crates.forEach(crate => {
      if (crate.collected) return;
      
      const dist = Math.sqrt(Math.pow(crate.x - player.x, 2) + Math.pow(crate.y - player.y, 2));
      if (dist < 30) {
        this.collectCrate(crate);
        crate.collected = true;
      }
    });
  }
  
  collectCrate(crate) {
    switch (crate.type) {
      case 'ammo':
        this.gameState.reserveAmmo += 30;
        break;
      case 'health':
        this.gameState.player.health = Math.min(100, this.gameState.player.health + 30);
        break;
      case 'grenade':
        this.gameState.grenades = (this.gameState.grenades || 0) + 3;
        break;
      case 'weapon':
        break;
    }
    
    this.playSound('collect');
  }
  
  killEnemy(enemy) {
    enemy.alive = false;
    this.gameState.score += enemy.points;
    this.createExplosion(enemy.x, enemy.y, 15);
    this.playSound('kill');
  }
  
  checkObjective() {
    if (!this.gameState.currentObjective) return;
    
    const aliveEnemies = this.gameState.enemies.filter(e => e.alive).length;
    
    if (this.gameState.currentObjective.type === 'eliminate' && aliveEnemies === 0) {
      this.completeObjective();
    }
  }
  
  completeObjective() {
    this.gameState.score += 1000;
    this.gameState.currentObjective.completed = true;
    
    const nextIndex = (this.gameState.objectives.findIndex(o => !o.completed));
    if (nextIndex >= 0) {
      this.gameState.currentObjective = this.gameState.objectives[nextIndex];
    } else {
      this.gameState.level++;
      this.gameState.objectives.forEach(o => o.completed = false);
      this.gameState.currentObjective = this.gameState.objectives[0];
      this.spawnInitialEnemies();
    }
    
    this.playSound('objective');
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
          shoot: 250,
          kill: 150,
          collect: 600,
          objective: 800
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
      localStorage.setItem('tacticalForceHighScore', this.gameState.highScore);
    }
  }
  
  render() {
    const ctx = this.ctx;
    
    ctx.fillStyle = this.gameState.nightVision ? '#001100' : '#1a1a1a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    ctx.save();
    ctx.translate(-this.gameState.camera.x, -this.gameState.camera.y);
    
    this.renderMap();
    this.renderAlarms();
    this.renderCrates();
    this.renderVehicles();
    this.renderEnemies();
    this.renderSquad();
    this.renderPlayer();
    this.renderBullets();
    this.renderGrenades();
    this.renderParticles();
    this.renderVisionCones();
    
    ctx.restore();
    
    this.renderNightVision();
    this.renderUI();
    this.renderTacticalMap();
  }
  
  renderMap() {
    const ctx = this.ctx;
    
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, this.gameState.mapWidth, this.gameState.mapHeight);
    
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    
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
  
  renderAlarms() {
    const ctx = this.ctx;
    
    this.gameState.alarms.forEach(alarm => {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(alarm.x, alarm.y, alarm.radius, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
      ctx.fill();
    });
  }
  
  renderCrates() {
    const ctx = this.ctx;
    
    this.gameState.crates.forEach(crate => {
      if (crate.collected) return;
      
      ctx.fillStyle = '#664422';
      ctx.fillRect(crate.x - 15, crate.y - 15, 30, 30);
      
      ctx.fillStyle = '#553311';
      ctx.fillRect(crate.x - 12, crate.y - 12, 24, 24);
    });
  }
  
  renderVehicles() {
    const ctx = this.ctx;
    
    this.gameState.vehicles.forEach(vehicle => {
      if (vehicle.destroyed) return;
      
      ctx.fillStyle = '#445544';
      ctx.fillRect(vehicle.x - 30, vehicle.y - 20, 60, 40);
    });
  }
  
  renderEnemies() {
    const ctx = this.ctx;
    
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      
      const color = enemy.alert ? '#ff4444' : '#666644';
      
      ctx.fillStyle = color;
      ctx.fillRect(enemy.x - enemy.width / 2, enemy.y - enemy.height / 2, 
                   enemy.width, enemy.height);
      
      ctx.fillStyle = '#333333';
      ctx.fillRect(enemy.x - 4, enemy.y - enemy.height / 2 - 8, 3, 3);
      ctx.fillRect(enemy.x + 1, enemy.y - enemy.height / 2 - 8, 3, 3);
      
      if (enemy.alert) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y - 20);
        ctx.lineTo(enemy.x + Math.cos(this.gameState.time / 200) * 15, 
                   enemy.y - 25 + Math.sin(this.gameState.time / 200) * 5);
        ctx.stroke();
      }
      
      if (enemy.maxHealth > 25) {
        ctx.fillStyle = '#333333';
        ctx.fillRect(enemy.x - 15, enemy.y - enemy.height / 2 - 12, 30, 4);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(enemy.x - 15, enemy.y - enemy.height / 2 - 12, 
                     30 * (enemy.health / enemy.maxHealth), 4);
      }
    });
  }
  
  renderSquad() {
    const ctx = this.ctx;
    
    const roles = { assault: '#4488ff', sniper: '#88ff44', medic: '#ff4444' };
    
    this.gameState.squad.forEach(soldier => {
      if (!soldier.alive) return;
      
      ctx.fillStyle = roles[soldier.role] || '#888888';
      ctx.beginPath();
      ctx.arc(soldier.x, soldier.y - 10, 10, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = roles[soldier.role];
      ctx.fillRect(soldier.x - 8, soldier.y, 16, 20);
    });
  }
  
  renderPlayer() {
    const player = this.gameState.player;
    if (!player) return;
    
    const ctx = this.ctx;
    
    ctx.save();
    ctx.translate(player.x, player.y);
    
    if (player.invulnerable && Math.floor(this.gameState.time / 100) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }
    
    ctx.fillStyle = player.inCover ? '#448866' : '#4488aa';
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    
    ctx.fillStyle = '#ffcc99';
    ctx.beginPath();
    ctx.arc(0, -player.height / 2 - 8, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.save();
    ctx.rotate(player.angle);
    ctx.fillStyle = '#333333';
    ctx.fillRect(10, -3, 20, 6);
    ctx.restore();
    
    ctx.restore();
  }
  
  renderBullets() {
    const ctx = this.ctx;
    
    this.gameState.bullets.forEach(bullet => {
      if (!bullet.active) return;
      
      ctx.fillStyle = bullet.type === 'enemy' ? '#ff0000' : '#ffff00';
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
      
      if (grenade.timer < 500) {
        ctx.fillStyle = `rgba(255, 100, 0, ${(500 - grenade.timer) / 500})`;
        ctx.beginPath();
        ctx.arc(grenade.x, grenade.y, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }
  
  renderParticles() {
    const ctx = this.ctx;
    this.gameState.particles = this.gameState.particles || [];
    
    this.gameState.particles.forEach(particle => {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.lifetime / 600;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.globalAlpha = 1;
  }
  
  renderVisionCones() {
    const player = this.gameState.player;
    if (!player) return;
    
    const ctx = this.ctx;
    
    ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.arc(player.x, player.y, 150, player.angle - 0.3, player.angle + 0.3);
    ctx.closePath();
    ctx.fill();
  }
  
  renderNightVision() {
    if (!this.gameState.nightVision) return;
    
    const ctx = this.ctx;
    
    ctx.fillStyle = 'rgba(0, 50, 0, 0.3)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 10]);
    ctx.beginPath();
    ctx.moveTo(0, this.canvas.height / 2);
    ctx.lineTo(this.canvas.width, this.canvas.height / 2);
    ctx.moveTo(this.canvas.width / 2, 0);
    ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  
  renderUI() {
    const ctx = this.ctx;
    const player = this.gameState.player;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.gameState.score}`, 20, 25);
    ctx.fillText(`Mission: ${Math.floor(this.gameState.missionTime)}s`, 20, 50);
    
    if (player) {
      ctx.fillStyle = '#333333';
      ctx.fillRect(20, 60, 150, 15);
      ctx.fillStyle = player.health > 30 ? '#00ff00' : '#ff0000';
      ctx.fillRect(20, 60, 150 * (player.health / player.maxHealth), 15);
      ctx.fillStyle = '#888888';
      ctx.fillText('Health', 20, 90);
      
      ctx.fillStyle = '#00ff00';
      ctx.fillText(`Ammo: ${this.gameState.magazine}/${this.gameState.reserveAmmo}`, 20, 115);
    }
    
    if (this.gameState.stealth) {
      ctx.fillStyle = '#00ff00';
      ctx.fillText('STEALTH ACTIVE', this.canvas.width - 150, 25);
    } else {
      ctx.fillStyle = '#ff0000';
      ctx.fillText('DETECTED!', this.canvas.width - 100, 25);
    }
    
    if (this.gameState.suppressionValue > 30) {
      ctx.fillStyle = '#ff8800';
      ctx.fillText(`SUPPRESSED: ${Math.floor(this.gameState.suppressionValue)}%`, this.canvas.width - 180, 50);
    }
    
    if (this.gameState.currentObjective) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(10, this.canvas.height - 60, 250, 50);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Objective: ${this.gameState.currentObjective.name}`, 20, this.canvas.height - 40);
    }
    
    ctx.fillStyle = '#666666';
    ctx.font = '12px Arial';
    ctx.fillText('WASD: Move | C: Cover | V: Night Vision | B: Map | R: Reload', 20, this.canvas.height - 15);
    
    if (this.gameState.status === 'gameover') {
      this.renderGameOver();
    }
  }
  
  renderTacticalMap() {
    if (!this.gameState.tacticalMap) return;
    
    const ctx = this.ctx;
    const mapWidth = 200;
    const mapHeight = 160;
    const mapX = this.canvas.width - mapWidth - 20;
    const mapY = 80;
    
    ctx.fillStyle = 'rgba(0, 20, 0, 0.8)';
    ctx.fillRect(mapX, mapY, mapWidth, mapHeight);
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(mapX, mapY, mapWidth, mapHeight);
    
    const scaleX = mapWidth / this.gameState.mapWidth;
    const scaleY = mapHeight / this.gameState.mapHeight;
    
    ctx.fillStyle = '#00ff00';
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      ctx.beginPath();
      ctx.arc(mapX + enemy.x * scaleX, mapY + enemy.y * scaleY, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    
    const player = this.gameState.player;
    if (player) {
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(mapX + player.x * scaleX, mapY + player.y * scaleY, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  renderGameOver() {
    const ctx = this.ctx;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MISSION FAILED', this.canvas.width / 2, this.canvas.height / 2 - 40);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    ctx.fillText(`Time: ${Math.floor(this.gameState.missionTime)}s`, this.canvas.width / 2, this.canvas.height / 2 + 60);
  }
  
  restart() {
    this.gameState = {
      time: 0,
      score: 0,
      highScore: this.gameState.highScore,
      level: 1,
      lives: 1,
      status: 'playing',
      player: null,
      squad: [],
      enemies: [],
      bullets: [],
      grenades: [],
      objectives: this.gameState.objectives,
      currentObjective: this.gameState.objectives[0],
      missionTime: 0,
      stealth: true,
      detected: false,
      detectedTimer: 0,
      suppressed: false,
      suppressionValue: 0,
      tacticalMode: true,
      coverSystem: true,
      reloadTimer: 0,
      isReloading: false,
      magazine: 30,
      maxMagazine: 30,
      reserveAmmo: 90,
      mapWidth: 1500,
      mapHeight: 1200,
      camera: { x: 0, y: 0 },
      visionCones: [],
      alarms: [],
      crates: this.gameState.crates,
      vehicles: this.gameState.vehicles,
      nightVision: false,
      thermalVision: false,
      tacticalMap: false,
      grenades: 0,
      particles: []
    };
    
    this.start();
  }
}

window.TacticalForceGame = TacticalForceGame;