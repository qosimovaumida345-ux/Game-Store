// Zombie Apocalypse - Zombie Shooter
class ZombieApocalypseGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.players = players;
    this.gameId = gameId;
    this.isRunning = false;
    this.lastTime = 0;
    this.mousePos = { x: 0, y: 0 };
    this.mouseDown = false;
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
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
      highScore: parseInt(localStorage.getItem('zombieApocalypseHighScore')) || 0,
      wave: 1,
      lives: 3,
      status: 'playing',
      player: null,
      bullets: [],
      zombies: [],
      items: [],
      vehicles: [],
      barricades: [],
      survivors: [],
      objectives: [],
      currentObjective: null,
      objectiveTimer: 0,
      waveTimer: 0,
      waveInProgress: true,
      specialZombies: [],
      ambientZombies: [],
      darkOverlay: 0,
      flashlight: { x: 0, y: 0, angle: 0, on: true },
      camera: { x: 0, y: 0 },
      mapWidth: 2000,
      mapHeight: 1500,
      visitedAreas: [],
      safeZone: null,
      escapeTimer: 0,
      debugMode: false
    };
    
    this.initWorld();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initWorld() {
    this.gameState.safeZone = {
      x: this.gameState.mapWidth / 2,
      y: this.gameState.mapHeight / 2,
      radius: 200
    };
    
    for (let i = 0; i < 30; i++) {
      this.gameState.barricades.push({
        x: Math.random() * this.gameState.mapWidth,
        y: Math.gameState.mapHeight,
        width: 40,
        height: 20,
        health: 50,
        type: 'barricade'
      });
    }
    
    for (let i = 0; i < 5; i++) {
      this.gameState.survivors.push({
        x: this.gameState.safeZone.x + (Math.random() - 0.5) * 100,
        y: this.gameState.safeZone.y + (Math.random() - 0.5) * 100,
        health: 50,
        waiting: true,
        rescued: false,
        index: i
      });
    }
    
    this.gameState.objectives = [
      { name: 'Survive the Horde', type: 'survive', duration: 30 },
      { name: 'Rescue Survivors', type: 'rescue', count: 3 },
      { name: 'Defend the Safe Zone', type: 'defend', duration: 45 },
      { name: 'Clear the Area', type: 'clear', count: 20 },
      { name: 'Find Vehicle', type: 'vehicle', count: 1 },
      { name: 'Escape the City', type: 'escape', duration: 60 }
    ];
    
    this.gameState.currentObjective = this.gameState.objectives[0];
  }
  
  start() {
    const playerName = this.players[0] || 'Survivor';
    this.gameState.player = {
      x: this.gameState.mapWidth / 2,
      y: this.gameState.mapHeight / 2,
      width: 30,
      height: 30,
      speed: 4,
      health: 100,
      maxHealth: 100,
      ammo: 100,
      maxAmmo: 200,
      weapon: 'pistol',
      weapons: ['pistol', 'shotgun', 'machine_gun', 'rifle', 'flamethrower'],
      weaponIndex: 0,
      shootCooldown: 0,
      shootDelay: 400,
      reloadTimer: 0,
      reloadTime: 2000,
      reloading: false,
      invincible: false,
      invincibleTimer: 0,
      crouching: false,
      hasVehicle: null
    };
    
    this.spawnInitialZombies();
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }
  
  spawnInitialZombies() {
    for (let i = 0; i < 20; i++) {
      this.spawnZombie();
    }
  }
  
  spawnZombie() {
    const types = ['walker', 'runner', 'tank', 'spitter', 'lurker', 'brute'];
    const weights = [0.5, 0.2, 0.1, 0.1, 0.05, 0.05];
    
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
    const zombie = this.createZombieByType(type);
    
    const angle = Math.random() * Math.PI * 2;
    const distance = 400 + Math.random() * 300;
    
    zombie.x = this.gameState.player.x + Math.cos(angle) * distance;
    zombie.y = this.gameState.player.y + Math.sin(angle) * distance;
    
    zombie.x = Math.max(50, Math.min(this.gameState.mapWidth - 50, zombie.x));
    zombie.y = Math.max(50, Math.min(this.gameState.mapHeight - 50, zombie.y));
    
    zombie.alive = true;
    this.gameState.zombies.push(zombie);
  }
  
  createZombieByType(type) {
    const baseProps = {
      walker: { width: 30, height: 40, health: 3, speed: 1.5, damage: 10, points: 10, attackRate: 1000 },
      runner: { width: 25, height: 35, health: 2, speed: 4, damage: 8, points: 20, attackRate: 800 },
      tank: { width: 50, height: 60, health: 15, speed: 0.8, damage: 25, points: 50, attackRate: 2000 },
      spitter: { width: 35, height: 40, health: 4, speed: 1.2, damage: 15, points: 30, attackRate: 1500, ranged: true },
      lurker: { width: 40, height: 30, health: 5, speed: 2, damage: 20, points: 40, attackRate: 1200, ambush: true },
      brute: { width: 60, height: 70, health: 25, speed: 0.6, damage: 35, points: 100, attackRate: 2500, AoE: true }
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
      attackRate: props.attackRate,
      lastAttack: 0,
      ranged: props.ranged || false,
      ambush: props.ambush || false,
      AoE: props.AoE || false,
      state: 'chase',
      attackTarget: null,
      animationFrame: 0,
      animationTimer: 0,
      isSpecial: type === 'tank' || type === 'brute',
      isRanged: props.ranged || false,
      spitCooldown: 0,
      visible: true,
      hidden: false
    };
  }
  
  spawnSpecialZombie() {
    const types = ['queen', 'hunter', 'witch', 'boomer'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const props = {
      queen: { width: 80, height: 100, health: 50, speed: 1, damage: 30, points: 200, spawns: 10 },
      hunter: { width: 40, height: 40, health: 8, speed: 6, damage: 25, points: 75, pounce: true },
      witch: { width: 35, height: 50, health: 20, speed: 2, damage: 50, points: 100, instaKill: true },
      boomer: { width: 50, height: 50, health: 15, speed: 1.5, damage: 40, points: 80, explode: true }
    };
    
    const prop = props[type];
    const zombie = {
      type: type,
      x: Math.random() * this.gameState.mapWidth,
      y: -50,
      width: prop.width,
      height: prop.height,
      health: prop.health,
      maxHealth: prop.health,
      speed: prop.speed,
      damage: prop.damage,
      points: prop.points,
      attackRate: 1000,
      lastAttack: 0,
      isSpecial: true,
      special: type,
      alive: true,
      animationFrame: 0
    };
    
    this.gameState.specialZombies.push(zombie);
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
    this.gameState.waveTimer += deltaTime / 1000;
    
    this.updatePlayer(deltaTime);
    this.updateCamera();
    this.updateZombies(deltaTime);
    this.updateSpecialZombies(deltaTime);
    this.updateBullets(deltaTime);
    this.updateItems(deltaTime);
    this.updateFlashlight();
    this.updateObjective(deltaTime);
    this.checkCollisions();
    this.checkWaveProgress();
    this.spawnZombieIfNeeded();
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
    
    if (player.reloading) {
      player.reloadTimer -= deltaTime;
      if (player.reloadTimer <= 0) {
        player.reloading = false;
        player.ammo = Math.min(player.maxAmmo, player.ammo + this.getMagazineSize(player.weapon));
        this.playSound('reload');
      }
      return;
    }
    
    let moveX = 0;
    let moveY = 0;
    
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY = -1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY = 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX = -1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX = 1;
    
    if (moveX !== 0 || moveY !== 0) {
      const length = Math.sqrt(moveX * moveX + moveY * moveY);
      moveX /= length;
      moveY /= length;
      
      player.x += moveX * player.speed;
      player.y += moveY * player.speed;
    }
    
    if (this.keys['KeyQ']) {
      player.weaponIndex = (player.weaponIndex + 1) % player.weapons.length;
      player.weapon = player.weapons[player.weaponIndex];
      player.shootDelay = this.getFireRate(player.weapon);
      this.keys['KeyQ'] = false;
    }
    
    if (this.keys['KeyR'] && player.ammo < player.maxAmmo) {
      player.reloading = true;
      player.reloadTimer = player.reloadTime;
    }
    
    if (this.keys['ShiftLeft']) {
      player.crouching = true;
      player.speed = 2;
    } else {
      player.crouching = false;
      player.speed = 4;
    }
    
    player.x = Math.max(0, Math.min(this.gameState.mapWidth, player.x));
    player.y = Math.max(0, Math.min(this.gameState.mapHeight, player.y));
    
    if (this.mouseDown && player.shootCooldown <= 0 && player.ammo > 0) {
      this.shoot();
      player.shootCooldown = player.shootDelay;
      player.ammo--;
    }
    
    if (player.shootCooldown > 0) {
      player.shootCooldown -= deltaTime;
    }
    
    const worldMouseX = this.mousePos.x + this.gameState.camera.x;
    const worldMouseY = this.mousePos.y + this.gameState.camera.y;
    
    this.gameState.flashlight.x = player.x;
    this.gameState.flashlight.y = player.y;
    this.gameState.flashlight.angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);
  }
  
  getFireRate(weapon) {
    const fireRates = {
      pistol: 400,
      shotgun: 800,
      machine_gun: 100,
      rifle: 600,
      flamethrower: 50
    };
    return fireRates[weapon] || 400;
  }
  
  getMagazineSize(weapon) {
    const sizes = {
      pistol: 12,
      shotgun: 8,
      machine_gun: 30,
      rifle: 10,
      flamethrower: 100
    };
    return sizes[weapon] || 12;
  }
  
  shoot() {
    const player = this.gameState.player;
    const worldMouseX = this.mousePos.x + this.gameState.camera.x;
    const worldMouseY = this.mousePos.y + this.gameState.camera.y;
    
    const angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);
    
    switch (player.weapon) {
      case 'pistol':
        this.gameState.bullets.push({
          x: player.x,
          y: player.y,
          vx: Math.cos(angle) * 15,
          vy: Math.sin(angle) * 15,
          damage: 20,
          type: 'pistol',
          radius: 4
        });
        break;
        
      case 'shotgun':
        for (let i = -3; i <= 3; i++) {
          const spread = angle + i * 0.1;
          this.gameState.bullets.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(spread) * 12,
            vy: Math.sin(spread) * 12,
            damage: 15,
            type: 'shotgun',
            radius: 3
          });
        }
        break;
        
      case 'machine_gun':
        this.gameState.bullets.push({
          x: player.x,
          y: player.y,
          vx: Math.cos(angle) * 18,
          vy: Math.sin(angle) * 18,
          damage: 12,
          type: 'machine_gun',
          radius: 3
        });
        break;
        
      case 'rifle':
        this.gameState.bullets.push({
          x: player.x,
          y: player.y,
          vx: Math.cos(angle) * 25,
          vy: Math.sin(angle) * 25,
          damage: 50,
          type: 'rifle',
          radius: 5,
          piercing: true
        });
        break;
        
      case 'flamethrower':
        this.gameState.bullets.push({
          x: player.x,
          y: player.y,
          vx: Math.cos(angle) * 8,
          vy: Math.sin(angle) * 8,
          damage: 5,
          type: 'flamethrower',
          radius: 8,
          isFlame: true,
          lifetime: 500
        });
        break;
    }
    
    this.playSound('shoot');
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
  
  updateZombies(deltaTime) {
    const player = this.gameState.player;
    if (!player) return;
    
    this.gameState.zombies.forEach(zombie => {
      if (!zombie.alive) return;
      
      if (zombie.ambush && !zombie.visible) {
        const dist = this.getDistance(zombie, player);
        if (dist < 150) {
          zombie.visible = true;
          this.createEffect(zombie.x, zombie.y, 'reveal');
        }
      }
      
      if (zombie.visible !== false) {
        zombie.visible = true;
      }
      
      const dx = player.x - zombie.x;
      const dy = player.y - zombie.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 30) {
        zombie.x += (dx / dist) * zombie.speed;
        zombie.y += (dy / dist) * zombie.speed;
      }
      
      zombie.animationTimer += deltaTime;
      if (zombie.animationTimer > 200) {
        zombie.animationFrame = (zombie.animationFrame + 1) % 4;
        zombie.animationTimer = 0;
      }
      
      if (dist < 40) {
        zombie.attackTarget = player;
        
        if (zombie.lastAttack <= 0) {
          this.attackPlayer(zombie);
          zombie.lastAttack = zombie.attackRate;
        }
      }
      
      if (zombie.lastAttack > 0) {
        zombie.lastAttack -= deltaTime;
      }
      
      if (zombie.ranged && zombie.spitCooldown <= 0 && dist > 100 && dist < 400) {
        this.spitAtPlayer(zombie);
        zombie.spitCooldown = 3000;
      }
      
      if (zombie.spitCooldown > 0) {
        zombie.spitCooldown -= deltaTime;
      }
    });
    
    this.gameState.zombies = this.gameState.zombies.filter(z => z.alive);
  }
  
  updateSpecialZombies(deltaTime) {
    const player = this.gameState.player;
    if (!player) return;
    
    this.gameState.specialZombies.forEach(zombie => {
      if (!zombie.alive) return;
      
      const dx = player.x - zombie.x;
      const dy = player.y - zombie.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 30) {
        zombie.x += (dx / dist) * zombie.speed;
        zombie.y += (dy / dist) * zombie.speed;
      }
      
      if (dist < 40 && zombie.lastAttack <= 0) {
        this.attackPlayer(zombie);
        zombie.lastAttack = 1500;
      }
      
      if (zombie.lastAttack > 0) {
        zombie.lastAttack -= deltaTime;
      }
    });
    
    this.gameState.specialZombies = this.gameState.specialZombies.filter(z => z.alive);
  }
  
  spitAtPlayer(zombie) {
    const player = this.gameState.player;
    if (!player) return;
    
    const dx = player.x - zombie.x;
    const dy = player.y - zombie.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    this.gameState.bullets.push({
      x: zombie.x,
      y: zombie.y,
      vx: (dx / dist) * 6,
      vy: (dy / dist) * 6,
      damage: 15,
      type: 'spit',
      radius: 6,
      isAcid: true
    });
  }
  
  attackPlayer(zombie) {
    const player = this.gameState.player;
    if (!player || player.invincible) return;
    
    let damage = zombie.damage;
    
    if (this.gameState.currentObjective?.type === 'defend') {
      const safeZone = this.gameState.safeZone;
      const distToSafe = Math.sqrt(
        Math.pow(player.x - safeZone.x, 2) + Math.pow(player.y - safeZone.y, 2)
      );
      
      if (distToSafe < safeZone.radius) {
        damage *= 0.5;
      }
    }
    
    player.health -= damage;
    player.invincible = true;
    player.invincibleTimer = 500;
    
    this.createEffect(player.x, player.y, 'blood');
    this.playSound('hit');
    
    if (player.health <= 0) {
      this.gameOver();
    }
  }
  
  updateBullets(deltaTime) {
    this.gameState.bullets.forEach(bullet => {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      
      if (bullet.lifetime) {
        bullet.lifetime -= deltaTime;
        if (bullet.lifetime <= 0) {
          bullet.alive = false;
        }
      }
      
      if (bullet.isFlame) {
        bullet.vx *= 0.95;
        bullet.vy *= 0.95;
      }
      
      if (bullet.x < 0 || bullet.x > this.gameState.mapWidth ||
          bullet.y < 0 || bullet.y > this.gameState.mapHeight) {
        bullet.alive = false;
      }
    });
    
    this.gameState.bullets = this.gameState.bullets.filter(b => b.alive !== false);
  }
  
  updateItems(deltaTime) {
    if (Math.random() < 0.005) {
      const types = ['health', 'ammo', 'weapon', 'grenade', 'trap'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      this.gameState.items.push({
        x: Math.random() * this.gameState.mapWidth,
        y: Math.random() * this.gameState.mapHeight,
        width: 20,
        height: 20,
        type: type,
        rotation: 0,
        bobOffset: Math.random() * Math.PI * 2
      });
    }
    
    this.gameState.items.forEach(item => {
      item.rotation += 0.02;
      item.bobOffset += 0.05;
    });
  }
  
  updateFlashlight() {
    const player = this.gameState.player;
    if (!player) return;
    
    if (this.gameState.darkOverlay > 0.8) {
      this.gameState.flashlight.on = true;
    }
  }
  
  updateObjective(deltaTime) {
    if (!this.gameState.currentObjective) return;
    
    this.gameState.objectiveTimer += deltaTime / 1000;
    
    switch (this.gameState.currentObjective.type) {
      case 'survive':
        if (this.gameState.objectiveTimer >= this.gameState.currentObjective.duration) {
          this.completeObjective();
        }
        break;
        
      case 'rescue':
        const rescued = this.gameState.survivors.filter(s => s.rescued).length;
        if (rescued >= this.gameState.currentObjective.count) {
          this.completeObjective();
        }
        break;
        
      case 'defend':
        if (this.gameState.objectiveTimer >= this.gameState.currentObjective.duration) {
          this.completeObjective();
        }
        const enemiesInZone = this.getZombiesInSafeZone().length;
        if (enemiesInZone === 0 && this.gameState.waveInProgress) {
          this.gameState.score += 100;
        }
        break;
        
      case 'clear':
        const killed = this.gameState.zombies.filter(z => !z.alive).length;
        if (killed >= this.gameState.currentObjective.count) {
          this.completeObjective();
        }
        break;
        
      case 'vehicle':
        if (player.hasVehicle) {
          this.completeObjective();
        }
        break;
        
      case 'escape':
        this.gameState.escapeTimer = this.gameState.currentObjective.duration - this.gameState.objectiveTimer;
        if (this.gameState.escapeTimer <= 0) {
          this.completeObjective();
        }
        break;
    }
  }
  
  completeObjective() {
    this.gameState.score += 1000;
    this.gameState.wave++;
    
    const nextIndex = this.gameState.wave % this.gameState.objectives.length;
    this.gameState.currentObjective = this.gameState.objectives[nextIndex];
    this.gameState.objectiveTimer = 0;
    
    this.playSound('objective');
    
    for (let i = 0; i < 10 + this.gameState.wave * 2; i++) {
      this.spawnZombie();
    }
    
    if (this.gameState.wave % 3 === 0) {
      this.spawnSpecialZombie();
    }
  }
  
  getZombiesInSafeZone() {
    const safeZone = this.gameState.safeZone;
    return this.gameState.zombies.filter(z => {
      const dist = Math.sqrt(
        Math.pow(z.x - safeZone.x, 2) + Math.pow(z.y - safeZone.y, 2)
      );
      return dist < safeZone.radius;
    });
  }
  
  checkCollisions() {
    const player = this.gameState.player;
    if (!player) return;
    
    this.gameState.bullets.forEach(bullet => {
      if (!bullet.alive) return;
      
      this.gameState.zombies.forEach(zombie => {
        if (!zombie.alive || !zombie.visible) return;
        
        if (this.checkCollision(bullet, zombie)) {
          bullet.alive = false;
          
          let damage = bullet.damage;
          if (bullet.type === 'shotgun') damage *= 0.8;
          if (bullet.type === 'rifle') damage *= 1.5;
          
          zombie.health -= damage;
          
          if (bullet.isFlame) {
            zombie.health -= 0.5;
          }
          
          this.createEffect(bullet.x, bullet.y, 'blood');
          
          if (zombie.health <= 0) {
            this.killZombie(zombie);
          }
        }
      });
      
      this.gameState.specialZombies.forEach(zombie => {
        if (!zombie.alive) return;
        
        if (this.checkCollision(bullet, zombie)) {
          bullet.alive = false;
          
          zombie.health -= bullet.damage;
          this.createEffect(bullet.x, bullet.y, 'blood');
          
          if (zombie.health <= 0) {
            this.killZombie(zombie, true);
          }
        }
      });
      
      this.gameState.items.forEach(item => {
        if (!item.alive) return;
        
        if (this.checkCollision(bullet, item)) {
          if (item.type === 'weapon' || item.type === 'ammo') {
            this.collectItem(item);
            item.alive = false;
          }
        }
      });
    });
    
    this.gameState.zombies.forEach(zombie => {
      if (!zombie.alive || !zombie.visible) return;
      
      if (this.checkCollision(player, zombie)) {
        if (!player.invincible) {
          this.attackPlayer(zombie);
        }
      }
    });
    
    this.gameState.items.forEach(item => {
      if (!item.alive) return;
      
      if (this.checkCollision(player, item)) {
        this.collectItem(item);
        item.alive = false;
      }
    });
  }
  
  checkCollision(a, b) {
    return Math.abs(a.x - b.x) < (a.width || a.radius * 2 || 10) / 2 + b.width / 2 &&
           Math.abs(a.y - b.y) < (a.height || a.radius * 2 || 10) / 2 + b.height / 2;
  }
  
  getDistance(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }
  
  killZombie(zombie, isSpecial = false) {
    zombie.alive = false;
    this.gameState.score += zombie.points;
    this.createExplosion(zombie.x, zombie.y, 10, '#880000');
    this.playSound('zombieDeath');
    
    if (Math.random() < 0.3) {
      this.dropItem(zombie.x, zombie.y);
    }
  }
  
  dropItem(x, y) {
    const types = ['health', 'ammo', 'weapon'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    this.gameState.items.push({
      x: x,
      y: y,
      width: 20,
      height: 20,
      type: type,
      rotation: 0,
      bobOffset: 0
    });
  }
  
  collectItem(item) {
    const player = this.gameState.player;
    if (!player) return;
    
    switch (item.type) {
      case 'health':
        player.health = Math.min(player.maxHealth, player.health + 25);
        break;
      case 'ammo':
        player.ammo = Math.min(player.maxAmmo, player.ammo + this.getMagazineSize(player.weapon));
        break;
      case 'weapon':
        if (player.weaponIndex < player.weapons.length - 1) {
          player.weaponIndex++;
          player.weapon = player.weapons[player.weaponIndex];
          player.shootDelay = this.getFireRate(player.weapon);
        }
        break;
    }
    
    this.createEffect(item.x, item.y, 'pickup');
    this.playSound('pickup');
  }
  
  createEffect(x, y, type) {
    for (let i = 0; i < 5; i++) {
      this.gameState.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        color: type === 'blood' ? '#880000' : type === 'pickup' ? '#00ff00' : '#ffff00',
        size: Math.random() * 4 + 2,
        lifetime: 500
      });
    }
  }
  
  createExplosion(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      this.gameState.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        color: color || '#ff8800',
        size: Math.random() * 8 + 2,
        lifetime: 800
      });
    }
  }
  
  spawnZombieIfNeeded() {
    const totalZombies = this.gameState.zombies.filter(z => z.alive).length +
                        this.gameState.specialZombies.filter(z => z.alive).length;
    
    const targetZombies = 15 + this.gameState.wave * 3;
    
    if (totalZombies < targetZombies && Math.random() < 0.02) {
      this.spawnZombie();
    }
  }
  
  checkWaveProgress() {
    this.gameState.darkOverlay = 0.7 + Math.sin(this.gameState.time / 5000) * 0.2;
    
    if (this.gameState.waveTimer > 120) {
      this.gameState.waveInProgress = true;
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
          shoot: 200,
          zombieDeath: 100,
          hit: 300,
          pickup: 800,
          objective: 1000,
          reload: 400
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
      localStorage.setItem('zombieApocalypseHighScore', this.gameState.highScore);
    }
  }
  
  render() {
    const ctx = this.ctx;
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    ctx.save();
    ctx.translate(-this.gameState.camera.x, -this.gameState.camera.y);
    
    this.renderWorld();
    this.renderSafeZone();
    this.renderBarricades();
    this.renderItems();
    this.renderZombies();
    this.renderSpecialZombies();
    this.renderPlayer();
    this.renderBullets();
    this.renderParticles();
    
    ctx.restore();
    
    this.renderFlashlight();
    this.renderDarkness();
    this.renderUI();
  }
  
  renderWorld() {
    const ctx = this.ctx;
    
    for (let x = 0; x < this.gameState.mapWidth; x += 100) {
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.gameState.mapHeight);
      ctx.stroke();
    }
    
    for (let y = 0; y < this.gameState.mapHeight; y += 100) {
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.gameState.mapWidth, y);
      ctx.stroke();
    }
    
    for (let i = 0; i < 50; i++) {
      const x = (i * 73) % this.gameState.mapWidth;
      const y = (i * 137) % this.gameState.mapHeight;
      
      ctx.fillStyle = '#333333';
      ctx.fillRect(x, y, 30 + (i % 5) * 10, 20 + (i % 3) * 10);
    }
  }
  
  renderSafeZone() {
    const safeZone = this.gameState.safeZone;
    const ctx = this.ctx;
    
    ctx.strokeStyle = '#004400';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.arc(safeZone.x, safeZone.y, safeZone.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillStyle = 'rgba(0, 50, 0, 0.2)';
    ctx.fill();
  }
  
  renderBarricades() {
    const ctx = this.ctx;
    
    this.gameState.barricades.forEach(barricade => {
      ctx.fillStyle = '#664422';
      ctx.fillRect(barricade.x - barricade.width / 2, barricade.y - barricade.height / 2,
                   barricade.width, barricade.height);
      
      ctx.fillStyle = '#553311';
      ctx.fillRect(barricade.x - barricade.width / 2 + 5, barricade.y - barricade.height / 2 + 5,
                   barricade.width - 10, barricade.height - 10);
    });
  }
  
  renderItems() {
    const ctx = this.ctx;
    
    this.gameState.items.forEach(item => {
      ctx.save();
      ctx.translate(item.x, item.y + Math.sin(item.bobOffset) * 3);
      ctx.rotate(item.rotation);
      
      const colors = {
        health: '#ff0000',
        ammo: '#ffff00',
        weapon: '#00ff00',
        grenade: '#888888',
        trap: '#ff8800'
      };
      
      ctx.fillStyle = colors[item.type] || '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const symbols = { health: '+', ammo: 'A', weapon: 'W', grenade: 'G', trap: 'T' };
      ctx.fillText(symbols[item.type] || '?', 0, 0);
      
      ctx.restore();
    });
  }
  
  renderZombies() {
    const ctx = this.ctx;
    
    this.gameState.zombies.forEach(zombie => {
      if (!zombie.alive || !zombie.visible) return;
      
      ctx.save();
      ctx.translate(zombie.x, zombie.y);
      
      const wobble = Math.sin(zombie.animationFrame * Math.PI / 2) * 3;
      ctx.rotate(wobble * 0.05);
      
      this.drawZombie(zombie);
      
      if (zombie.maxHealth > 3) {
        const healthPercent = zombie.health / zombie.maxHealth;
        ctx.fillStyle = '#333333';
        ctx.fillRect(-15, -zombie.height / 2 - 10, 30, 5);
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : '#ff0000';
        ctx.fillRect(-15, -zombie.height / 2 - 10, 30 * healthPercent, 5);
      }
      
      ctx.restore();
    });
  }
  
  drawZombie(zombie) {
    const ctx = this.ctx;
    
    const colors = {
      walker: '#558855',
      runner: '#667766',
      tank: '#444444',
      spitter: '#779977',
      lurker: '#556655',
      brute: '#333333'
    };
    
    ctx.fillStyle = colors[zombie.type] || '#558855';
    
    ctx.fillRect(-zombie.width / 2, -zombie.height / 2, zombie.width, zombie.height);
    
    ctx.fillStyle = '#222222';
    ctx.fillRect(-8, -zombie.height / 4, 6, 6);
    ctx.fillRect(2, -zombie.height / 4, 6, 6);
    
    ctx.fillStyle = '#aa0000';
    ctx.fillRect(-5, zombie.height / 8, 10, 4);
    
    if (zombie.isSpecial) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(-zombie.width / 2 - 2, -zombie.height / 2 - 2, zombie.width + 4, zombie.height + 4);
    }
  }
  
  renderSpecialZombies() {
    const ctx = this.ctx;
    
    this.gameState.specialZombies.forEach(zombie => {
      if (!zombie.alive) return;
      
      ctx.save();
      ctx.translate(zombie.x, zombie.y);
      
      this.drawSpecialZombie(zombie);
      
      const healthPercent = zombie.health / zombie.maxHealth;
      ctx.fillStyle = '#333333';
      ctx.fillRect(-20, -zombie.height / 2 - 10, 40, 6);
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(-20, -zombie.height / 2 - 10, 40 * healthPercent, 6);
      
      ctx.restore();
    });
  }
  
  drawSpecialZombie(zombie) {
    const ctx = this.ctx;
    
    const specialColors = {
      queen: '#880088',
      hunter: '#aa4400',
      witch: '#ffffff',
      boomer: '#88aa00'
    };
    
    ctx.fillStyle = specialColors[zombie.special] || '#ff0000';
    
    ctx.fillRect(-zombie.width / 2, -zombie.height / 2, zombie.width, zombie.height);
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(-10, -zombie.height / 4, 8, 8);
    ctx.fillRect(2, -zombie.height / 4, 8, 8);
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
    
    ctx.fillStyle = '#4488ff';
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#2255aa';
    ctx.fillRect(-10, -10, 20, 15);
    
    const worldMouseX = this.mousePos.x + this.gameState.camera.x;
    const worldMouseY = this.mousePos.y + this.gameState.camera.y;
    const angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);
    
    ctx.rotate(angle);
    ctx.fillStyle = '#666666';
    ctx.fillRect(10, -3, 20, 6);
    
    ctx.restore();
  }
  
  renderBullets() {
    const ctx = this.ctx;
    
    this.gameState.bullets.forEach(bullet => {
      if (bullet.type === 'flamethrower' || bullet.isFlame) {
        ctx.fillStyle = `rgba(255, ${100 + Math.random() * 100}, 0, 0.8)`;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (bullet.type === 'spit' || bullet.isAcid) {
        ctx.fillStyle = '#00ff00';
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }
  
  renderParticles() {
    const ctx = this.ctx;
    
    this.gameState.particles = this.gameState.particles || [];
    
    this.gameState.particles.forEach(particle => {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.lifetime / 800;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.globalAlpha = 1;
  }
  
  renderFlashlight() {
    if (!this.gameState.flashlight.on) return;
    
    const ctx = this.ctx;
    const player = this.gameState.player;
    if (!player) return;
    
    const gradient = ctx.createRadialGradient(
      player.x - this.gameState.camera.x,
      player.y - this.gameState.camera.y,
      50,
      player.x - this.gameState.camera.x,
      player.y - this.gameState.camera.y,
      400
    );
    
    gradient.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 200, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  renderDarkness() {
    const ctx = this.ctx;
    
    ctx.fillStyle = `rgba(0, 0, 0, ${this.gameState.darkOverlay})`;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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
    
    if (player) {
      ctx.fillStyle = '#333333';
      ctx.fillRect(20, 75, 150, 15);
      ctx.fillStyle = player.health > 30 ? '#00ff00' : '#ff0000';
      ctx.fillRect(20, 75, 150 * (player.health / player.maxHealth), 15);
      ctx.fillStyle = '#888888';
      ctx.fillText(`Health: ${player.health}`, 20, 105);
      
      ctx.fillStyle = '#333333';
      ctx.fillRect(this.canvas.width - 170, 75, 150, 15);
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(this.canvas.width - 170, 75, 150 * (player.ammo / player.maxAmmo), 15);
      ctx.fillStyle = '#888888';
      ctx.textAlign = 'right';
      ctx.fillText(`Ammo: ${player.ammo}`, this.canvas.width - 20, 105);
      
      ctx.textAlign = 'left';
      ctx.fillStyle = '#00aaff';
      ctx.fillText(`Weapon: ${player.weapon.replace('_', ' ').toUpperCase()}`, 20, 130);
    }
    
    if (this.gameState.currentObjective) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, this.canvas.height - 90, 300, 80);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Objective: ${this.gameState.currentObjective.name}`, 20, this.canvas.height - 65);
      
      let progress = 0;
      const type = this.gameState.currentObjective.type;
      
      if (type === 'survive') {
        progress = this.gameState.objectiveTimer / this.gameState.currentObjective.duration;
      } else if (type === 'clear') {
        const killed = this.gameState.zombies.filter(z => !z.alive).length;
        progress = killed / this.gameState.currentObjective.count;
      } else if (type === 'defend') {
        progress = this.gameState.objectiveTimer / this.gameState.currentObjective.duration;
      }
      
      ctx.fillStyle = '#333333';
      ctx.fillRect(20, this.canvas.height - 40, 260, 10);
      ctx.fillStyle = '#00aaff';
      ctx.fillRect(20, this.canvas.height - 40, 260 * Math.min(progress, 1), 10);
    }
    
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
    ctx.fillText(`Waves Survived: ${this.gameState.wave}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
    
    ctx.fillStyle = '#888888';
    ctx.font = '18px Arial';
    ctx.fillText('Press SPACE to restart', this.canvas.width / 2, this.canvas.height / 2 + 90);
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
      zombies: [],
      items: [],
      vehicles: [],
      barricades: this.gameState.barricades,
      survivors: this.gameState.survivors,
      objectives: this.gameState.objectives,
      currentObjective: this.gameState.objectives[0],
      objectiveTimer: 0,
      waveTimer: 0,
      waveInProgress: true,
      specialZombies: [],
      ambientZombies: [],
      darkOverlay: 0.7,
      flashlight: this.gameState.flashlight,
      camera: { x: 0, y: 0 },
      mapWidth: 2000,
      mapHeight: 1500,
      visitedAreas: [],
      safeZone: this.gameState.safeZone,
      escapeTimer: 0,
      debugMode: false,
      particles: []
    };
    
    this.start();
  }
  
  get keys() {
    return this._keys || {};
  }
  
  set keys(value) {
    this._keys = value;
  }
}

window.addEventListener('keydown', function(e) {
  if (window.zombieApocalypseGame) {
    window.zombieApocalypseGame.keys = window.zombieApocalypseGame.keys || {};
    window.zombieApocalypseGame.keys[e.code] = true;
  }
});

window.addEventListener('keyup', function(e) {
  if (window.zombieApocalypseGame) {
    window.zombieApocalypseGame.keys = window.zombieApocalypseGame.keys || {};
    window.zombieApocalypseGame.keys[e.code] = false;
  }
});

window.zombieApocalypseGame = null;

window.ZombieApocalypseGame = ZombieApocalypseGame;