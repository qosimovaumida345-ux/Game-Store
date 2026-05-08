// Alien Invasion - Alien Shooter
class AlienInvasionGame {
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
      highScore: parseInt(localStorage.getItem('alienInvasionHighScore')) || 0,
      level: 1,
      lives: 3,
      status: 'playing',
      player: null,
      bullets: [],
      aliens: [],
      alienBullets: [],
      UFOs: [],
      motherships: [],
      beams: [],
      portals: [],
      craftings: [],
      resources: [],
      upgrades: [],
      unlockedUpgrades: [],
      techLevel: 1,
      abductTimer: 0,
      invasionProgress: 0,
      humanity: 100,
      dayNight: 0,
      weather: 'clear',
      worldBuildings: [],
      destroyedBuildings: [],
      objectives: [],
      currentMission: null,
      missionTimer: 0,
      bossActive: false,
      boss: null,
      bossPhase: 0,
      combo: 0,
      multiplier: 1,
      specialReady: false,
      specialCooldown: 0
    };
    
    this.initWorld();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initWorld() {
    for (let i = 0; i < 20; i++) {
      this.gameState.worldBuildings.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height * 0.6,
        width: 40 + Math.random() * 40,
        height: 60 + Math.random() * 60,
        type: ['skyscraper', 'house', 'factory', 'radar'][Math.floor(Math.random() * 4)],
        health: 100,
        intact: true
      });
    }
    
    this.gameState.objectives = [
      { name: 'Defend City', type: 'defend', target: 5, progress: 0 },
      { name: 'Destroy Mothership', type: 'destroy_mothership', target: 1, progress: 0 },
      { name: 'Collect Resources', type: 'collect', target: 10, progress: 0 },
      { name: 'Research Alien Tech', type: 'research', target: 100, progress: 0 },
      { name: 'Close Portals', type: 'close_portals', target: 3, progress: 0 },
      { name: 'Invasion Defense', type: 'invasion', target: 60, progress: 0 }
    ];
    
    this.gameState.currentMission = this.gameState.objectives[0];
    
    this.gameState.upgrades = [
      { name: 'Plasma Rifle', type: 'weapon', level: 1, cost: 5, unlocked: false },
      { name: 'Force Field', type: 'defense', level: 1, cost: 8, unlocked: false },
      { name: 'Teleporter', type: 'mobility', level: 1, cost: 10, unlocked: false },
      { name: 'Alien Scanner', type: 'scanner', level: 1, cost: 6, unlocked: false },
      { name: 'Orbital Strike', type: 'special', level: 1, cost: 15, unlocked: false },
      { name: 'Time Slow', type: 'special', level: 1, cost: 20, unlocked: false }
    ];
  }
  
  start() {
    const playerName = this.players[0] || 'Commander';
    this.gameState.player = {
      x: this.canvas.width / 2,
      y: this.canvas.height - 80,
      width: 40,
      height: 40,
      speed: 5,
      health: 100,
      maxHealth: 100,
      shield: 50,
      maxShield: 50,
      energy: 100,
      maxEnergy: 100,
      weapon: 'blaster',
      weapons: ['blaster', 'plasma', 'railgun', 'missile'],
      weaponIndex: 0,
      shootCooldown: 0,
      shootDelay: 300,
      specialReady: false,
      specialActive: false,
      specialTimer: 0,
      invincible: false,
      invincibleTimer: 0,
      jetpack: false,
      jetpackFuel: 100,
      hasOrbital: false,
      hasShield: false
    };
    
    this.spawnInitialAliens();
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }
  
  spawnInitialAliens() {
    for (let i = 0; i < 15; i++) {
      this.spawnAlien();
    }
  }
  
  spawnAlien() {
    const types = ['grunt', 'shooter', 'stealth', 'tank', 'brain', 'harvester'];
    const weights = [0.35, 0.25, 0.15, 0.15, 0.05, 0.05];
    
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
    const alien = this.createAlienByType(type);
    
    alien.x = Math.random() * this.canvas.width;
    alien.y = -50 - Math.random() * 200;
    alien.alive = true;
    
    this.gameState.aliens.push(alien);
  }
  
  createAlienByType(type) {
    const baseProps = {
      grunt: { width: 30, height: 40, health: 3, speed: 2, damage: 10, points: 10, shootChance: 0.01 },
      shooter: { width: 25, height: 35, health: 2, speed: 1.5, damage: 15, points: 15, shootChance: 0.03, ranged: true },
      stealth: { width: 25, height: 30, health: 1, speed: 4, damage: 20, points: 25, invisible: true },
      tank: { width: 50, height: 50, health: 10, speed: 0.8, damage: 25, points: 40, AoE: true },
      brain: { width: 35, height: 35, health: 5, speed: 1, damage: 5, points: 30, buff: true },
      harvester: { width: 40, height: 40, health: 8, speed: 1, damage: 0, points: 50, harvest: true }
    };
    
    const props = baseProps[type];
    const levelMultiplier = 1 + this.gameState.level * 0.15;
    
    return {
      type: type,
      x: 0,
      y: 0,
      width: props.width,
      height: props.height,
      health: Math.floor(props.health * levelMultiplier),
      maxHealth: Math.floor(props.health * levelMultiplier),
      speed: props.speed,
      damage: props.damage,
      points: Math.floor(props.points * levelMultiplier),
      shootChance: props.shootChance,
      ranged: props.ranged || false,
      invisible: props.invisible || false,
      AoE: props.AoE || false,
      buff: props.buff || false,
      harvest: props.harvest || false,
      lastShot: Math.random() * 2000,
      animationFrame: 0,
      animationTimer: 0,
      visible: true,
      buffedBy: [],
      harvesting: false,
      harvestTarget: null
    };
  }
  
  spawnMothership() {
    const mothership = {
      x: this.canvas.width / 2,
      y: -150,
      width: 200,
      height: 100,
      health: 100 + this.gameState.level * 20,
      maxHealth: 100 + this.gameState.level * 20,
      speed: 0.5,
      points: 500,
      active: true,
      spawning: false,
      spawnTimer: 0,
      shields: 100,
      maxShields: 100,
      phase: 'descend'
    };
    
    this.gameState.motherships.push(mothership);
  }
  
  spawnPortal() {
    const portal = {
      x: Math.random() * (this.canvas.width - 100) + 50,
      y: Math.random() * (this.canvas.height * 0.5),
      radius: 30,
      active: true,
      spawning: false,
      openProgress: 0,
      maxProgress: 10
    };
    
    this.gameState.portals.push(portal);
  }
  
  spawnUFO() {
    const ufo = {
      x: -50,
      y: Math.random() * 150 + 50,
      width: 60,
      height: 30,
      speed: 3,
      health: 5,
      maxHealth: 5,
      points: 100,
      active: true,
      direction: 1,
      abducting: false,
      abductTarget: null
    };
    
    this.gameState.UFOs.push(ufo);
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
    this.gameState.dayNight = (Math.sin(this.gameState.time / 30000) + 1) / 2;
    
    if (Math.random() < 0.001) {
      this.gameState.weather = ['clear', 'rain', 'storm'][Math.floor(Math.random() * 3)];
    }
    
    this.updatePlayer(deltaTime);
    this.updateAliens(deltaTime);
    this.updateMotherships(deltaTime);
    this.updatePortals(deltaTime);
    this.updateUFOs(deltaTime);
    this.updateBullets(deltaTime);
    this.updateBeams(deltaTime);
    this.updateResources(deltaTime);
    this.updateMission(deltaTime);
    this.checkCollisions();
    this.spawnAlienIfNeeded();
    
    this.gameState.invasionProgress += deltaTime * 0.001;
    if (this.gameState.invasionProgress > 100) {
      this.gameState.humanity -= 1;
      this.gameState.invasionProgress = 0;
    }
    
    if (this.gameState.humanity <= 0) {
      this.gameOver();
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
    
    if (inputX !== 0 || inputY !== 0) {
      player.x += inputX * player.speed;
      player.y += inputY * player.speed;
    }
    
    if (this.keys['ShiftLeft']) {
      if (player.jetpackFuel > 0) {
        player.jetpack = true;
        player.jetpackFuel -= 0.5;
        
        if (inputY < 0) player.y -= 3;
      }
    } else {
      player.jetpack = false;
      if (player.jetpackFuel < 100) player.jetpackFuel += 0.2;
    }
    
    if (this.keys['KeyQ']) {
      player.weaponIndex = (player.weaponIndex + 1) % player.weapons.length;
      player.weapon = player.weapons[player.weaponIndex];
      player.shootDelay = this.getFireRate(player.weapon);
      this.keys['KeyQ'] = false;
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
    
    if (player.specialActive) {
      player.specialTimer -= deltaTime;
      if (player.specialTimer <= 0) {
        player.specialActive = false;
      }
    }
    
    player.x = Math.max(0, Math.min(this.canvas.width, player.x));
    player.y = Math.max(0, Math.min(this.canvas.height, player.y));
    
    if ((this.keys['Space'] || this.keys['KeyZ']) && player.shootCooldown <= 0) {
      this.shoot();
      player.shootCooldown = player.shootDelay;
    }
    
    if (player.shootCooldown > 0) {
      player.shootCooldown -= deltaTime;
    }
    
    player.energy = Math.min(player.maxEnergy, player.energy + 0.1);
    
    if (player.shield < player.maxShield && Math.random() < 0.01) {
      player.shield++;
    }
  }
  
  getFireRate(weapon) {
    const fireRates = { blaster: 300, plasma: 200, railgun: 800, missile: 1000 };
    return fireRates[weapon] || 300;
  }
  
  shoot() {
    const player = this.gameState.player;
    
    this.gameState.bullets.push({
      x: player.x,
      y: player.y - 20,
      vx: 0,
      vy: -12,
      damage: this.getWeaponDamage(player.weapon),
      type: player.weapon,
      width: 8,
      height: 20,
      special: player.specialActive
    });
    
    this.playSound('shoot');
  }
  
  getWeaponDamage(weapon) {
    const damages = { blaster: 15, plasma: 25, railgun: 50, missile: 100 };
    return damages[weapon] || 15;
  }
  
  activateSpecial() {
    const player = this.gameState.player;
    
    if (player.hasOrbital) {
      this.callOrbitalStrike();
    } else if (player.hasShield) {
      player.specialActive = true;
      player.specialTimer = 5000;
      player.specialCooldown = 15000;
    } else {
      player.specialActive = true;
      player.specialTimer = 3000;
      player.specialCooldown = 10000;
    }
    
    this.gameState.specialReady = false;
    this.playSound('special');
  }
  
  callOrbitalStrike() {
    const player = this.gameState.player;
    
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const dist = 100 + Math.random() * 200;
      
      this.gameState.bullets.push({
        x: player.x + Math.cos(angle) * dist,
        y: player.y - 500 - Math.random() * 200,
        vx: 0,
        vy: 20,
        damage: 30,
        type: 'orbital',
        width: 20,
        height: 40
      });
    }
    
    player.specialCooldown = 30000;
  }
  
  updateAliens(deltaTime) {
    const player = this.gameState.player;
    if (!player) return;
    
    this.gameState.aliens.forEach(alien => {
      if (!alien.alive) return;
      
      if (alien.invisible && !alien.visible) {
        if (Math.random() < 0.01) {
          alien.visible = true;
          setTimeout(() => alien.visible = false, 2000);
        }
      } else {
        alien.visible = true;
      }
      
      if (alien.harvest && !alien.harvesting) {
        const resource = this.findNearestResource(alien);
        if (resource) {
          alien.harvestTarget = resource;
          alien.harvesting = true;
        }
      }
      
      if (alien.harvesting && alien.harvestTarget) {
        const dx = alien.harvestTarget.x - alien.x;
        const dy = alien.harvestTarget.y - alien.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 50) {
          alien.x += (dx / dist) * alien.speed;
          alien.y += (dy / dist) * alien.speed;
        } else {
          alien.harvestTarget.amount -= 0.1;
          if (alien.harvestTarget.amount <= 0) {
            alien.harvesting = false;
            alien.harvestTarget = null;
          }
        }
      } else {
        const dx = player.x - alien.x;
        const dy = player.y - alien.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 30) {
          alien.x += (dx / dist) * alien.speed;
          alien.y += (dy / dist) * alien.speed;
        }
      }
      
      alien.animationTimer += deltaTime;
      if (alien.animationTimer > 150) {
        alien.animationFrame = (alien.animationFrame + 1) % 4;
        alien.animationTimer = 0;
      }
      
      if (alien.ranged && dist > 100) {
        alien.lastShot -= deltaTime;
        if (alien.lastShot <= 0 && Math.random() < alien.shootChance) {
          this.spawnAlienBullet(alien);
          alien.lastShot = 2000;
        }
      }
      
      if (alien.buff) {
        this.buffNearbyAliens(alien);
      }
    });
  }
  
  buffNearbyAliens(alien) {
    this.gameState.aliens.forEach(other => {
      if (other === alien || !other.alive) return;
      
      const dx = other.x - alien.x;
      const dy = other.y - alien.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 100 && !other.buffedBy.includes(alien)) {
        other.speed *= 1.2;
        other.damage *= 1.3;
        other.buffedBy.push(alien);
      }
    });
  }
  
  findNearestResource(alien) {
    const resources = this.gameState.resources.filter(r => r.amount > 0);
    if (resources.length === 0) return null;
    
    let nearest = resources[0];
    let minDist = Infinity;
    
    resources.forEach(resource => {
      const dx = resource.x - alien.x;
      const dy = resource.y - alien.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearest = resource;
      }
    });
    
    return nearest;
  }
  
  spawnAlienBullet(alien) {
    const player = this.gameState.player;
    if (!player) return;
    
    const dx = player.x - alien.x;
    const dy = player.y - alien.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    this.gameState.alienBullets.push({
      x: alien.x,
      y: alien.y + alien.height / 2,
      vx: (dx / dist) * 5,
      vy: (dy / dist) * 5,
      damage: alien.damage,
      type: alien.type,
      width: 8,
      height: 8
    });
  }
  
  updateMotherships(deltaTime) {
    this.gameState.motherships.forEach(ship => {
      if (!ship.active) return;
      
      switch (ship.phase) {
        case 'descend':
          ship.y += ship.speed;
          if (ship.y > 50) {
            ship.phase = 'attack';
          }
          break;
          
        case 'attack':
          ship.x = this.canvas.width / 2 + Math.sin(this.gameState.time / 2000) * 200;
          
          ship.spawnTimer += deltaTime;
          if (ship.spawnTimer > 3000 && !ship.spawning) {
            ship.spawning = true;
            setTimeout(() => {
              this.spawnAlien();
              ship.spawning = false;
              ship.spawnTimer = 0;
            }, 1000);
          }
          
          if (ship.shields > 0) {
            ship.shields -= 0.05;
          }
          break;
          
        case 'retreat':
          ship.y -= ship.speed;
          if (ship.y < -150) {
            ship.active = false;
          }
          break;
      }
    });
  }
  
  updatePortals(deltaTime) {
    if (Math.random() < 0.002 && this.gameState.portals.length < 3) {
      this.spawnPortal();
    }
    
    this.gameState.portals.forEach(portal => {
      if (!portal.active) return;
      
      portal.openProgress += 0.01;
      
      if (portal.openProgress >= portal.maxProgress && Math.random() < 0.01) {
        this.spawnAlien();
      }
    });
  }
  
  updateUFOs(deltaTime) {
    if (Math.random() < 0.005) {
      this.spawnUFO();
    }
    
    this.gameState.UFOs.forEach(ufo => {
      if (!ufo.active) return;
      
      ufo.x += ufo.speed * ufo.direction;
      
      if (ufo.x > this.canvas.width + 50 || ufo.x < -50) {
        ufo.active = false;
      }
      
      if (!ufo.abducting) {
        const player = this.gameState.player;
        if (player) {
          const dx = player.x - ufo.x;
          const dy = player.y - ufo.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 200 && Math.random() < 0.01) {
            ufo.abducting = true;
            ufo.abductTarget = player;
          }
        }
      }
      
      if (ufo.abducting && ufo.abductTarget) {
        const dx = ufo.x - ufo.abductTarget.x;
        const dy = ufo.y + 50 - ufo.abductTarget.y;
        
        ufo.abductTarget.x += dx * 0.05;
        ufo.abductTarget.y += dy * 0.05;
        
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
          this.gameState.lives--;
          ufo.abducting = false;
          ufo.active = false;
          
          if (this.gameState.lives <= 0) {
            this.gameOver();
          }
        }
      }
    });
  }
  
  updateBullets(deltaTime) {
    this.gameState.bullets.forEach(bullet => {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      
      if (bullet.y < -50 || bullet.y > this.canvas.height + 50 ||
          bullet.x < -50 || bullet.x > this.canvas.width + 50) {
        bullet.alive = false;
      }
    });
    
    this.gameState.bullets = this.gameState.bullets.filter(b => b.alive !== false);
    
    this.gameState.alienBullets.forEach(bullet => {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      
      if (bullet.y > this.canvas.height + 20 || bullet.y < -20) {
        bullet.alive = false;
      }
    });
    
    this.gameState.alienBullets = this.gameState.alienBullets.filter(b => b.alive !== false);
  }
  
  updateBeams(deltaTime) {
    this.gameState.beams.forEach(beam => {
      beam.duration -= deltaTime;
      
      beam.targets.forEach(target => {
        if (target.health > 0) {
          target.health -= beam.damage * 0.1;
        }
      });
    });
    
    this.gameState.beams = this.gameState.beams.filter(b => b.duration > 0);
  }
  
  updateResources(deltaTime) {
    if (Math.random() < 0.01) {
      this.gameState.resources.push({
        x: Math.random() * (this.canvas.width - 40) + 20,
        y: Math.random() * (this.canvas.height - 40) + 20,
        amount: 10,
        type: ['metal', 'crystal', 'energy'][Math.floor(Math.random() * 3)],
        radius: 15
      });
    }
    
    this.gameState.resources = this.gameState.resources.filter(r => r.amount > 0);
  }
  
  updateMission(deltaTime) {
    if (!this.gameState.currentMission) return;
    
    switch (this.gameState.currentMission.type) {
      case 'defend':
        break;
        
      case 'destroy_mothership':
        this.gameState.currentMission.progress = this.gameState.motherships.filter(s => !s.active).length;
        break;
        
      case 'collect':
        this.gameState.currentMission.progress = this.gameState.resources.filter(r => r.collected || false).length;
        break;
        
      case 'research':
        this.gameState.currentMission.progress = this.gameState.techLevel;
        break;
        
      case 'close_portals':
        this.gameState.currentMission.progress = this.gameState.portals.filter(p => !p.active).length;
        break;
        
      case 'invasion':
        this.gameState.currentMission.progress = this.gameState.missionTimer;
        break;
    }
    
    if (this.gameState.currentMission.progress >= this.gameState.currentMission.target) {
      this.completeMission();
    }
  }
  
  completeMission() {
    this.gameState.score += 2000;
    this.gameState.level++;
    
    const nextIndex = this.gameState.level % this.gameState.objectives.length;
    this.gameState.currentMission = this.gameState.objectives[nextIndex];
    this.gameState.missionTimer = 0;
    
    this.playSound('missionComplete');
    
    if (this.gameState.level % 3 === 0) {
      this.spawnMothership();
    }
  }
  
  checkCollisions() {
    const player = this.gameState.player;
    if (!player) return;
    
    this.gameState.bullets.forEach(bullet => {
      if (!bullet.alive) return;
      
      this.gameState.aliens.forEach(alien => {
        if (!alien.alive || !alien.visible) return;
        
        if (this.checkCollision(bullet, alien)) {
          bullet.alive = false;
          alien.health -= bullet.damage;
          
          if (alien.health <= 0) {
            this.killAlien(alien);
          }
        }
      });
      
      this.gameState.UFOs.forEach(ufo => {
        if (!ufo.active) return;
        
        if (this.checkCollision(bullet, ufo)) {
          bullet.alive = false;
          ufo.health -= bullet.damage;
          
          if (ufo.health <= 0) {
            ufo.active = false;
            this.gameState.score += ufo.points;
            this.createExplosion(ufo.x, ufo.y, 15, '#00ff00');
          }
        }
      });
      
      this.gameState.motherships.forEach(ship => {
        if (!ship.active) return;
        
        if (this.checkCollision(bullet, ship)) {
          if (ship.shields <= 0) {
            bullet.alive = false;
            ship.health -= bullet.damage;
            
            if (ship.health <= 0) {
              ship.active = false;
              ship.phase = 'destroyed';
              this.gameState.score += ship.points;
              this.createExplosion(ship.x, ship.y, 30, '#ff00ff');
              
              if (this.gameState.currentMission.type === 'destroy_mothership') {
                this.gameState.currentMission.progress++;
              }
            }
          }
        }
      });
      
      this.gameState.resources.forEach(resource => {
        if (!resource.collected && this.checkCollision(bullet, resource)) {
          resource.collected = true;
          this.gameState.techLevel += 1;
          
          if (this.gameState.currentMission.type === 'collect') {
            this.gameState.currentMission.progress++;
          }
        }
      });
    });
    
    this.gameState.alienBullets.forEach(bullet => {
      if (!bullet.alive) return;
      
      if (this.checkCollision(bullet, player)) {
        bullet.alive = false;
        this.damagePlayer(bullet.damage);
      }
    });
    
    this.gameState.aliens.forEach(alien => {
      if (!alien.alive || !alien.visible) return;
      
      if (this.checkCollision(player, alien)) {
        this.damagePlayer(alien.damage);
      }
    });
    
    this.gameState.resources.forEach(resource => {
      if (resource.collected) return;
      
      if (this.checkCollision(player, resource)) {
        resource.collected = true;
        resource.amount = 0;
        this.gameState.techLevel += 2;
        
        if (this.gameState.currentMission.type === 'collect') {
          this.gameState.currentMission.progress++;
        }
        
        this.createEffect(resource.x, resource.y, 'collect');
      }
    });
  }
  
  checkCollision(a, b) {
    return Math.abs(a.x - b.x) < (a.width || 10) / 2 + b.width / 2 &&
           Math.abs(a.y - b.y) < (a.height || 10) / 2 + b.height / 2;
  }
  
  killAlien(alien) {
    alien.alive = false;
    this.gameState.combo++;
    const multiplier = Math.min(this.gameState.combo, 10);
    this.gameState.score += alien.points * multiplier;
    this.createExplosion(alien.x, alien.y, 12, this.getAlienColor(alien.type));
    this.playSound('alienDeath');
    
    if (Math.random() < 0.2) {
      this.gameState.resources.push({
        x: alien.x,
        y: alien.y,
        amount: 5,
        type: ['metal', 'crystal', 'energy'][Math.floor(Math.random() * 3)],
        radius: 10
      });
    }
  }
  
  getAlienColor(type) {
    const colors = {
      grunt: '#00ff00',
      shooter: '#00ffff',
      stealth: '#888888',
      tank: '#ff8800',
      brain: '#ff00ff',
      harvester: '#ffff00'
    };
    return colors[type] || '#ffffff';
  }
  
  damagePlayer(damage) {
    const player = this.gameState.player;
    if (!player || player.invincible) return;
    
    let finalDamage = damage;
    
    if (player.specialActive && player.hasShield) {
      finalDamage *= 0.2;
    }
    
    if (player.specialActive) {
      return;
    }
    
    player.health -= finalDamage;
    player.invincible = true;
    player.invincibleTimer = 1000;
    
    this.createEffect(player.x, player.y, 'damage');
    this.playSound('hit');
    
    if (player.health <= 0) {
      this.gameState.lives--;
      player.health = player.maxHealth;
      player.invincible = true;
      player.invincibleTimer = 3000;
      
      if (this.gameState.lives <= 0) {
        this.gameOver();
      }
    }
  }
  
  createExplosion(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      this.gameState.particles = this.gameState.particles || [];
      this.gameState.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        color: color || '#ff8800',
        size: Math.random() * 6 + 2,
        lifetime: 600
      });
    }
  }
  
  createEffect(x, y, type) {
    const colors = { damage: '#ff0000', collect: '#00ff00' };
    this.createExplosion(x, y, 5, colors[type] || '#ffffff');
  }
  
  spawnAlienIfNeeded() {
    const totalAliens = this.gameState.aliens.filter(a => a.alive).length;
    const targetAliens = 10 + this.gameState.level * 2;
    
    if (totalAliens < targetAliens && Math.random() < 0.03) {
      this.spawnAlien();
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
          shoot: 440,
          alienDeath: 150,
          hit: 300,
          special: 880,
          missionComplete: 1000
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
      localStorage.setItem('alienInvasionHighScore', this.gameState.highScore);
    }
  }
  
  render() {
    const ctx = this.ctx;
    
    const skyColor = this.gameState.dayNight < 0.5 ?
      `rgb(${20 + this.gameState.dayNight * 100}, ${20 + this.gameState.dayNight * 50}, ${40 + this.gameState.dayNight * 80})` :
      `rgb(${40 + (1 - this.gameState.dayNight) * 50}, ${60 + (1 - this.gameState.dayNight) * 50}, ${100 + (1 - this.gameState.dayNight) * 50})`;
    
    ctx.fillStyle = skyColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.renderCity();
    this.renderResources();
    this.renderPortals();
    this.renderMotherships();
    this.renderUFOs();
    this.renderAliens();
    this.renderPlayer();
    this.renderBullets();
    this.renderAlienBullets();
    this.renderBeams();
    this.renderParticles();
    this.renderWeather();
    this.renderUI();
  }
  
  renderCity() {
    const ctx = this.ctx;
    
    this.gameState.worldBuildings.forEach(building => {
      if (!building.intact) return;
      
      ctx.fillStyle = '#333344';
      ctx.fillRect(building.x - building.width / 2, building.y - building.height,
                   building.width, building.height);
      
      ctx.fillStyle = this.gameState.dayNight > 0.5 ? '#666688' : '#222233';
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 4; j++) {
          if (Math.random() > 0.3) {
            ctx.fillRect(building.x - building.width / 2 + 5 + j * 10,
                        building.y - building.height + 10 + i * 15, 6, 8);
          }
        }
      }
    });
  }
  
  renderResources() {
    const ctx = this.ctx;
    
    this.gameState.resources.forEach(resource => {
      if (resource.collected) return;
      
      ctx.save();
      ctx.translate(resource.x, resource.y);
      
      const colors = { metal: '#888888', crystal: '#00ffff', energy: '#ffff00' };
      ctx.fillStyle = colors[resource.type];
      
      ctx.beginPath();
      ctx.moveTo(0, -resource.radius);
      ctx.lineTo(resource.radius, 0);
      ctx.lineTo(0, resource.radius);
      ctx.lineTo(-resource.radius, 0);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(Math.floor(resource.amount), 0, 3);
      
      ctx.restore();
    });
  }
  
  renderPortals() {
    const ctx = this.ctx;
    
    this.gameState.portals.forEach(portal => {
      if (!portal.active) return;
      
      ctx.save();
      ctx.translate(portal.x, portal.y);
      
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, portal.radius);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.5, '#ff00ff');
      gradient.addColorStop(1, '#440044');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, portal.radius * portal.openProgress / portal.maxProgress, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, portal.radius * (0.3 + i * 0.3), 0, Math.PI * 2);
        ctx.stroke();
      }
      
      ctx.restore();
    });
  }
  
  renderMotherships() {
    const ctx = this.ctx;
    
    this.gameState.motherships.forEach(ship => {
      if (!ship.active && ship.phase !== 'destroyed') return;
      
      ctx.save();
      ctx.translate(ship.x, ship.y);
      
      ctx.fillStyle = '#440044';
      ctx.beginPath();
      ctx.ellipse(0, 0, ship.width / 2, ship.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#880088';
      ctx.beginPath();
      ctx.ellipse(0, -10, ship.width / 3, ship.height / 3, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ff00ff';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(-30 + i * 20, -20, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      
      if (ship.shields > 0) {
        ctx.strokeStyle = `rgba(0, 200, 255, ${ship.shields / ship.maxShields})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, ship.width / 2 + 10, ship.height / 2 + 10, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      ctx.fillStyle = '#333333';
      ctx.fillRect(-ship.width / 2, ship.height / 2 - 10, ship.width, 10);
      
      const healthPercent = ship.health / ship.maxHealth;
      ctx.fillStyle = '#333333';
      ctx.fillRect(-50, ship.height / 2 + 10, 100, 8);
      ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : '#ff0000';
      ctx.fillRect(-50, ship.height / 2 + 10, 100 * healthPercent, 8);
      
      ctx.restore();
    });
  }
  
  renderUFOs() {
    const ctx = this.ctx;
    
    this.gameState.UFOs.forEach(ufo => {
      if (!ufo.active) return;
      
      ctx.save();
      ctx.translate(ufo.x, ufo.y);
      
      ctx.fillStyle = '#444444';
      ctx.beginPath();
      ctx.ellipse(0, 0, ufo.width / 2, ufo.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#00ff00';
      ctx.beginPath();
      ctx.ellipse(0, -5, 20, 10, 0, 0, Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(-10, -15, 6, 6);
      ctx.fillRect(4, -15, 6, 6);
      
      ctx.restore();
    });
  }
  
  renderAliens() {
    const ctx = this.ctx;
    
    this.gameState.aliens.forEach(alien => {
      if (!alien.alive || !alien.visible) return;
      
      ctx.save();
      ctx.translate(alien.x, alien.y);
      
      ctx.fillStyle = this.getAlienColor(alien.type);
      
      ctx.fillRect(-alien.width / 2, -alien.height / 2, alien.width, alien.height);
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(-8, -alien.height / 4, 6, 6);
      ctx.fillRect(2, -alien.height / 4, 6, 6);
      
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(-4, alien.height / 8, 8, 4);
      
      if (alien.invisible && !alien.visible) {
        ctx.globalAlpha = 0.3;
      }
      
      ctx.restore();
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
    
    ctx.fillStyle = '#4488ff';
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(-15, 15);
    ctx.lineTo(15, 15);
    ctx.closePath();
    ctx.fill();
    
    if (player.specialActive) {
      ctx.strokeStyle = player.hasShield ? '#00ffff' : '#ff00ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    if (player.jetpack) {
      ctx.fillStyle = '#ff8800';
      ctx.beginPath();
      ctx.moveTo(-8, 15);
      ctx.lineTo(0, 25 + Math.random() * 10);
      ctx.lineTo(8, 15);
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  renderBullets() {
    const ctx = this.ctx;
    
    this.gameState.bullets.forEach(bullet => {
      ctx.fillStyle = bullet.type === 'orbital' ? '#ff0000' :
                     bullet.type === 'missile' ? '#ff8800' :
                     bullet.type === 'railgun' ? '#00ffff' : '#00ff00';
      
      ctx.fillRect(bullet.x - bullet.width / 2, bullet.y - bullet.height / 2,
                   bullet.width, bullet.height);
    });
  }
  
  renderAlienBullets() {
    const ctx = this.ctx;
    
    this.gameState.alienBullets.forEach(bullet => {
      ctx.fillStyle = '#ff00ff';
      ctx.shadowColor = '#ff00ff';
      ctx.shadowBlur = 10;
      
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
    });
  }
  
  renderBeams() {
    const ctx = this.ctx;
    
    this.gameState.beams.forEach(beam => {
      ctx.strokeStyle = `rgba(255, 0, 255, ${beam.duration / 1000})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(beam.x, beam.y);
      ctx.lineTo(beam.targetX, beam.targetY);
      ctx.stroke();
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
  
  renderWeather() {
    if (this.gameState.weather !== 'clear') {
      const ctx = this.ctx;
      
      ctx.fillStyle = this.gameState.weather === 'rain' ?
        'rgba(100, 150, 200, 0.3)' : 'rgba(50, 50, 80, 0.5)';
      
      for (let i = 0; i < 50; i++) {
        const x = (i * 73 + this.gameState.time * 0.5) % this.canvas.width;
        const y = (i * 137 + this.gameState.time * 2) % this.canvas.height;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 2, y + 10);
        ctx.stroke();
      }
    }
  }
  
  renderUI() {
    const ctx = this.ctx;
    const player = this.gameState.player;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    ctx.fillText(`Level: ${this.gameState.level}`, 20, 55);
    
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
      ctx.fillRect(20, 115, 150, 15);
      ctx.fillStyle = '#00aaff';
      ctx.fillRect(20, 115, 150 * (player.shield / player.maxShield), 15);
      ctx.fillText('Shield', 20, 145);
      
      ctx.fillStyle = '#333333';
      ctx.fillRect(20, 160, 150, 15);
      ctx.fillStyle = '#ff8800';
      ctx.fillRect(20, 160, 150 * (player.jetpackFuel / 100), 15);
      ctx.fillText('Jetpack', 20, 190);
      
      ctx.fillStyle = '#00ff00';
      ctx.fillText(`Tech: ${this.gameState.techLevel}`, this.canvas.width - 20, 80);
      ctx.fillText(`Weapon: ${player.weapon.toUpperCase()}`, this.canvas.width - 20, 100);
      
      if (this.gameState.specialReady) {
        ctx.fillStyle = '#ff00ff';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('SPECIAL READY (X)', this.canvas.width - 20, 125);
      }
    }
    
    ctx.fillStyle = '#ff4444';
    ctx.font = '16px Arial';
    ctx.fillText(`Humanity: ${this.gameState.humanity}%`, 20, this.canvas.height - 30);
    
    if (this.gameState.currentMission) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(10, 10, 250, 70);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Mission: ${this.gameState.currentMission.name}`, 20, 30);
      
      const progress = this.gameState.currentMission.progress / this.gameState.currentMission.target;
      ctx.fillStyle = '#333333';
      ctx.fillRect(20, 45, 200, 10);
      ctx.fillStyle = '#00aaff';
      ctx.fillRect(20, 45, 200 * Math.min(progress, 1), 10);
    }
    
    if (this.gameState.combo > 1) {
      ctx.fillStyle = '#ff8800';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.gameState.combo}x COMBO`, this.canvas.width / 2, this.canvas.height - 50);
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
    ctx.fillText(`Level: ${this.gameState.level}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
    ctx.fillText(`Humanity: ${this.gameState.humanity}%`, this.canvas.width / 2, this.canvas.height / 2 + 80);
  }
  
  restart() {
    this.gameState = {
      time: 0,
      score: 0,
      highScore: this.gameState.highScore,
      level: 1,
      lives: 3,
      status: 'playing',
      player: null,
      bullets: [],
      aliens: [],
      alienBullets: [],
      UFOs: [],
      motherships: [],
      beams: [],
      portals: [],
      craftings: [],
      resources: [],
      upgrades: this.gameState.upgrades,
      unlockedUpgrades: [],
      techLevel: 1,
      abductTimer: 0,
      invasionProgress: 0,
      humanity: 100,
      dayNight: 0,
      weather: 'clear',
      worldBuildings: this.gameState.worldBuildings,
      destroyedBuildings: [],
      objectives: this.gameState.objectives,
      currentMission: this.gameState.objectives[0],
      missionTimer: 0,
      bossActive: false,
      boss: null,
      bossPhase: 0,
      combo: 0,
      multiplier: 1,
      specialReady: false,
      specialCooldown: 0,
      particles: []
    };
    
    this.start();
  }
}

window.AlienInvasionGame = AlienInvasionGame;