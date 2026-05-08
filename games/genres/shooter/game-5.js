// Sniper Elite - Sniper Shooting Game
class SniperEliteGame {
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
    this.canvas.addEventListener('click', () => this.shoot());
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    
    this.gameState = {
      time: 0,
      score: 0,
      highScore: parseInt(localStorage.getItem('sniperEliteHighScore')) || 0,
      level: 1,
      lives: 3,
      status: 'playing',
      player: null,
      targets: [],
      bullets: [],
      shells: [],
      wind: 0,
      windDirection: 1,
      windTimer: 0,
      zoom: 1,
      isZoomed: false,
      scopePosition: { x: 0, y: 0 },
      heartRate: 60,
      breathControl: false,
      breathHeld: false,
      breathMeter: 100,
      recoil: 0,
      stability: 100,
      missions: [],
      currentMission: null,
      missionObjectives: [],
      enemies: [],
      civilians: [],
      vehicles: [],
      coverObjects: [],
      lastShotTime: 0,
      shotStreak: 0,
      longestStreak: 0,
      headshots: 0,
      bodyShots: 0,
      totalShots: 0,
      accuracy: 100,
      ammo: { rifle: 10, pistol: 6, grenade: 2 },
      currentWeapon: 'rifle',
      dayTime: 0.5,
      fogLevel: 0,
      difficulty: 'normal'
    };
    
    this.initLevel();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initLevel() {
    this.gameState.missions = [
      { name: 'Eliminate Target', targets: 5, time: 60, type: 'elimination' },
      { name: 'Headshot Challenge', targets: 10, time: 90, type: 'headshots' },
      { name: 'Time Trial', targets: 15, time: 120, type: 'speed' },
      { name: 'Long Range', distance: 500, targets: 8, type: 'range' },
      { name: 'Stealth Mission', targets: 6, time: 120, type: 'stealth' },
      { name: 'Vehicle Destroyer', targets: 5, time: 90, type: 'vehicles' }
    ];
    
    this.gameState.currentMission = this.gameState.missions[0];
    this.gameState.missionObjectives = this.gameState.currentMission.targets ? 
      Array(this.gameState.currentMission.targets).fill({ completed: false }) : [];
    
    this.generateLevel();
  }
  
  generateLevel() {
    this.gameState.targets = [];
    this.gameState.enemies = [];
    this.gameState.civilians = [];
    this.gameState.vehicles = [];
    this.gameState.coverObjects = [];
    
    for (let i = 0; i < 8; i++) {
      this.spawnTarget();
    }
    
    for (let i = 0; i < 3; i++) {
      this.spawnEnemy();
    }
    
    for (let i = 0; i < 2; i++) {
      this.spawnCivilian();
    }
    
    for (let i = 0; i < 2; i++) {
      this.spawnVehicle();
    }
    
    for (let i = 0; i < 10; i++) {
      this.gameState.coverObjects.push({
        x: Math.random() * this.canvas.width,
        y: 100 + Math.random() * (this.canvas.height - 200),
        width: 30 + Math.random() * 50,
        height: 30 + Math.random() * 40,
        type: ['wall', 'crate', 'barrel'][Math.floor(Math.random() * 3)]
      });
    }
  }
  
  spawnTarget() {
    const target = {
      x: 100 + Math.random() * (this.canvas.width - 200),
      y: 50 + Math.random() * (this.canvas.height - 150),
      width: 20,
      height: 40,
      type: 'target',
      health: 1,
      alive: true,
      stationary: Math.random() > 0.3,
      moving: Math.random() > 0.5,
      moveDirection: Math.random() > 0.5 ? 1 : -1,
      moveSpeed: 0.5 + Math.random() * 1.5,
      moveRange: 50 + Math.random() * 100,
      startX: 0,
      crouching: Math.random() > 0.7,
      visible: true,
      rank: ['private', 'corporal', 'sergeant', 'officer'][Math.floor(Math.random() * 4)],
      points: 100 + Math.floor(Math.random() * 400)
    };
    
    target.startX = target.x;
    this.gameState.targets.push(target);
  }
  
  spawnEnemy() {
    const enemy = {
      x: Math.random() * this.canvas.width,
      y: 50 + Math.random() * 300,
      width: 25,
      height: 45,
      type: 'enemy',
      health: 1,
      alive: true,
      alert: false,
      patrol: Math.random() > 0.5,
      patrolStart: 0,
      patrolEnd: 0,
      patrolDirection: 1,
      scanning: false,
      scanningAngle: 0
    };
    
    enemy.patrolStart = enemy.x - 100;
    enemy.patrolEnd = enemy.x + 100;
    this.gameState.enemies.push(enemy);
  }
  
  spawnCivilian() {
    const civilian = {
      x: Math.random() * this.canvas.width,
      y: 200 + Math.random() * 300,
      width: 20,
      height: 45,
      type: 'civilian',
      health: 1,
      alive: true,
      moving: Math.random() > 0.5,
      direction: Math.random() > 0.5 ? 1 : -1,
      speed: 0.5
    };
    
    this.gameState.civilians.push(civilian);
  }
  
  spawnVehicle() {
    const vehicle = {
      x: Math.random() * this.canvas.width,
      y: 150 + Math.random() * 300,
      width: 60,
      height: 40,
      type: 'vehicle',
      health: 3,
      alive: true,
      moving: Math.random() > 0.5,
      direction: Math.random() > 0.5 ? 1 : -1,
      speed: 1,
      vehicleType: ['jeep', 'truck', 'tank'][Math.floor(Math.random() * 3)]
    };
    
    this.gameState.vehicles.push(vehicle);
  }
  
  start() {
    const playerName = this.players[0] || 'Sniper';
    this.gameState.player = {
      x: this.canvas.width / 2,
      y: this.canvas.height - 50,
      width: 30,
      height: 30,
      angle: -Math.PI / 2,
      stability: 100,
      breathControl: true,
      steady: false,
      heartbeat: 60,
      aimSpeed: 3
    };
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
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
    
    this.updateWind(deltaTime);
    this.updatePlayer(deltaTime);
    this.updateTargets(deltaTime);
    this.updateEnemies(deltaTime);
    this.updateCivilians(deltaTime);
    this.updateVehicles(deltaTime);
    this.updateBullets(deltaTime);
    this.updateShells(deltaTime);
    this.updateBreath(deltaTime);
    this.updateMission(deltaTime);
    this.checkCollisions();
  }
  
  updateWind(deltaTime) {
    this.gameState.windTimer += deltaTime;
    
    if (this.gameState.windTimer > 3000) {
      this.gameState.wind = (Math.random() - 0.5) * 10;
      this.gameState.windDirection = this.gameState.wind > 0 ? 1 : -1;
      this.gameState.windTimer = 0;
    }
  }
  
  updatePlayer(deltaTime) {
    const player = this.gameState.player;
    if (!player) return;
    
    const worldMouseX = (this.mousePos.x - this.canvas.width / 2) / this.gameState.zoom + this.canvas.width / 2;
    const worldMouseY = (this.mousePos.y - this.canvas.height / 2) / this.gameState.zoom + this.canvas.height / 2;
    
    player.angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);
    
    if (this.mouseDown) {
      player.steady = true;
      player.aimSpeed = 1;
    } else {
      player.steady = false;
      player.aimSpeed = 3;
    }
    
    if (this.keys['ShiftLeft']) {
      this.gameState.breathHeld = true;
    } else {
      this.gameState.breathHeld = false;
    }
    
    if (this.keys['Space']) {
      this.gameState.isZoomed = !this.gameState.isZoomed;
      this.gameState.zoom = this.gameState.isZoomed ? 4 : 1;
      this.keys['Space'] = false;
    }
    
    if (this.keys['KeyQ']) {
      this.gameState.currentWeapon = this.gameState.currentWeapon === 'rifle' ? 'pistol' : 'rifle';
      this.keys['KeyQ'] = false;
    }
    
    player.heartbeat = 60 + Math.sin(this.gameState.time / 500) * 10 + (this.gameState.breathHeld ? 20 : 0);
    this.gameState.heartRate = player.heartbeat;
    
    const movement = this.mouseDown ? 0.2 : 1;
    this.gameState.recoil = Math.max(0, this.gameState.recoil - deltaTime * 0.1);
  }
  
  shoot() {
    const player = this.gameState.player;
    if (!player) return;
    
    if (this.gameState.ammo.rifle <= 0 && this.gameState.currentWeapon === 'rifle') {
      return;
    }
    
    this.gameState.totalShots++;
    
    if (this.gameState.currentWeapon === 'rifle') {
      this.gameState.ammo.rifle--;
    } else {
      this.gameState.ammo.pistol--;
    }
    
    const stability = this.calculateStability();
    const spread = (100 - stability) / 500;
    
    const windEffect = this.gameState.wind * 0.05;
    
    const aimX = this.mousePos.x + (Math.random() - 0.5) * spread * 100 + windEffect;
    const aimY = this.mousePos.y + (Math.random() - 0.5) * spread * 100;
    
    const bullet = {
      x: player.x,
      y: player.y - 20,
      vx: Math.cos(player.angle) * 30,
      vy: Math.sin(player.angle) * 30,
      endX: aimX,
      endY: aimY,
      damage: this.gameState.currentWeapon === 'rifle' ? 100 : 50,
      type: this.gameState.currentWeapon,
      distance: Math.sqrt(Math.pow(aimX - player.x, 2) + Math.pow(aimY - player.y, 2)),
      windAffected: Math.abs(this.gameState.wind) > 5
    };
    
    this.gameState.bullets.push(bullet);
    this.gameState.recoil = 20;
    this.gameState.lastShotTime = this.gameState.time;
    this.gameState.shotStreak = 0;
    
    for (let i = 0; i < 3; i++) {
      this.gameState.shells.push({
        x: player.x,
        y: player.y - 10,
        vx: (Math.random() - 0.5) * 5,
        vy: -Math.random() * 3 - 2,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.3
      });
    }
    
    this.playSound('shoot');
  }
  
  calculateStability() {
    let stability = 100;
    
    if (this.mouseDown) stability += 20;
    if (this.gameState.breathHeld) stability += 30;
    if (this.gameState.isZoomed) stability += 40;
    
    stability -= this.gameState.recoil;
    stability = Math.max(0, Math.min(100, stability));
    
    return stability;
  }
  
  updateTargets(deltaTime) {
    this.gameState.targets.forEach(target => {
      if (!target.alive) return;
      
      if (target.moving && !target.stationary) {
        target.x += target.moveDirection * target.moveSpeed;
        
        if (target.x > target.startX + target.moveRange || target.x < target.startX - target.moveRange) {
          target.moveDirection *= -1;
        }
      }
      
      if (target.crouching && Math.random() < 0.01) {
        target.crouching = false;
        setTimeout(() => target.crouching = true, 2000 + Math.random() * 3000);
      }
    });
  }
  
  updateEnemies(deltaTime) {
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      
      if (enemy.patrol) {
        enemy.x += enemy.patrolDirection * 1;
        
        if (enemy.x > enemy.patrolEnd || enemy.x < enemy.patrolStart) {
          enemy.patrolDirection *= -1;
        }
      }
      
      if (enemy.scanning) {
        enemy.scanningAngle += 0.02;
      }
    });
  }
  
  updateCivilians(deltaTime) {
    this.gameState.civilians.forEach(civilian => {
      if (!civilian.alive || !civilian.moving) return;
      
      civilian.x += civilian.direction * civilian.speed;
      
      if (civilian.x < 0 || civilian.x > this.canvas.width) {
        civilian.direction *= -1;
      }
    });
  }
  
  updateVehicles(deltaTime) {
    this.gameState.vehicles.forEach(vehicle => {
      if (!vehicle.alive || !vehicle.moving) return;
      
      vehicle.x += vehicle.direction * vehicle.speed;
      
      if (vehicle.x < -50 || vehicle.x > this.canvas.width + 50) {
        vehicle.moving = false;
      }
    });
  }
  
  updateBullets(deltaTime) {
    this.gameState.bullets.forEach(bullet => {
      bullet.active = true;
    });
    
    this.gameState.bullets = this.gameState.bullets.filter(b => b.active);
  }
  
  updateShells(deltaTime) {
    this.gameState.shells.forEach(shell => {
      shell.x += shell.vx;
      shell.y += shell.vy;
      shell.vy += 0.2;
      shell.rotation += shell.rotationSpeed;
      
      if (shell.y > this.canvas.height) {
        shell.active = false;
      }
    });
    
    this.gameState.shells = this.gameState.shells.filter(s => s.active !== false);
  }
  
  updateBreath(deltaTime) {
    if (this.gameState.breathHeld) {
      this.gameState.breathMeter = Math.max(0, this.gameState.breathMeter - deltaTime * 0.1);
    } else {
      this.gameState.breathMeter = Math.min(100, this.gameState.breathMeter + deltaTime * 0.05);
    }
  }
  
  updateMission(deltaTime) {
    if (this.gameState.currentMission.type === 'elimination' || 
        this.gameState.currentMission.type === 'headshots' ||
        this.gameState.currentMission.type === 'speed') {
      const targetsLeft = this.gameState.targets.filter(t => t.alive).length;
      if (targetsLeft === 0) {
        this.completeMission();
      }
    }
  }
  
  completeMission() {
    this.gameState.score += 1000 * this.gameState.level;
    this.gameState.level++;
    
    const nextIndex = this.gameState.level % this.gameState.missions.length;
    this.gameState.currentMission = this.gameState.missions[nextIndex];
    
    if (this.gameState.currentMission.targets) {
      this.gameState.missionObjectives = Array(this.gameState.currentMission.targets).fill({ completed: false });
    }
    
    this.gameState.ammo.rifle += 5;
    this.gameState.ammo.pistol += 3;
    
    this.generateLevel();
    
    this.playSound('missionComplete');
  }
  
  checkCollisions() {
    this.gameState.bullets.forEach(bullet => {
      if (!bullet.active) return;
      
      this.gameState.targets.forEach(target => {
        if (!target.alive) return;
        
        const crouchFactor = target.crouching ? 0.7 : 1;
        
        if (this.checkPointInRect(bullet.endX, bullet.endY, 
            target.x - target.width / 2, target.y - target.height / 2 * crouchFactor,
            target.width, target.height * crouchFactor)) {
          bullet.active = false;
          target.alive = false;
          
          const isHeadshot = bullet.endY < target.y - target.height / 2 * crouchFactor + 10;
          
          if (isHeadshot) {
            this.gameState.headshots++;
            this.gameState.score += target.points * 2;
            this.gameState.shotStreak++;
          } else {
            this.gameState.bodyShots++;
            this.gameState.score += target.points;
            this.gameState.shotStreak++;
          }
          
          if (this.gameState.shotStreak > this.gameState.longestStreak) {
            this.gameState.longestStreak = this.gameState.shotStreak;
          }
          
          this.updateAccuracy();
          this.createHitEffect(bullet.endX, bullet.endY, isHeadshot);
        }
      });
      
      this.gameState.enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        if (this.checkPointInRect(bullet.endX, bullet.endY,
            enemy.x - enemy.width / 2, enemy.y - enemy.height / 2,
            enemy.width, enemy.height)) {
          bullet.active = false;
          enemy.alive = false;
          this.gameState.score += 150;
          this.createHitEffect(bullet.endX, bullet.endY, false);
        }
      });
      
      this.gameState.civilians.forEach(civilian => {
        if (!civilian.alive) return;
        
        if (this.checkPointInRect(bullet.endX, bullet.endY,
            civilian.x - civilian.width / 2, civilian.y - civilian.height / 2,
            civilian.width, civilian.height)) {
          bullet.active = false;
          civilian.alive = false;
          this.gameState.score -= 500;
          this.gameState.lives--;
          
          if (this.gameState.lives <= 0) {
            this.gameOver();
          }
        }
      });
      
      this.gameState.vehicles.forEach(vehicle => {
        if (!vehicle.alive) return;
        
        if (this.checkPointInRect(bullet.endX, bullet.endY,
            vehicle.x - vehicle.width / 2, vehicle.y - vehicle.height / 2,
            vehicle.width, vehicle.height)) {
          bullet.active = false;
          vehicle.health--;
          
          if (vehicle.health <= 0) {
            vehicle.alive = false;
            this.gameState.score += 300;
          }
        }
      });
      
      this.gameState.coverObjects.forEach(cover => {
        if (this.checkPointInRect(bullet.endX, bullet.endY,
            cover.x - cover.width / 2, cover.y - cover.height / 2,
            cover.width, cover.height)) {
          bullet.active = false;
        }
      });
    });
  }
  
  checkPointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }
  
  updateAccuracy() {
    if (this.gameState.totalShots > 0) {
      const hits = this.gameState.headshots + this.gameState.bodyShots;
      this.gameState.accuracy = Math.round((hits / this.gameState.totalShots) * 100);
    }
  }
  
  createHitEffect(x, y, isHeadshot) {
    this.gameState.particles = this.gameState.particles || [];
    
    for (let i = 0; i < 8; i++) {
      this.gameState.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        color: isHeadshot ? '#ff0000' : '#880000',
        size: 3,
        lifetime: 300
      });
    }
    
    if (isHeadshot) {
      this.gameState.particles.push({
        x: x,
        y: y - 20,
        text: 'HEADSHOT!',
        color: '#ffff00',
        lifetime: 500
      });
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
          missionComplete: 800
        };
        
        oscillator.frequency.value = frequencies[type] || 440;
        oscillator.type = 'square';
        gainNode.gain.value = 0.05;
        
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        oscillator.stop(audioCtx.currentTime + 0.15);
      } catch (e) {}
    }
  }
  
  gameOver() {
    this.gameState.status = 'gameover';
    this.isRunning = false;
    
    if (this.gameState.score > this.gameState.highScore) {
      this.gameState.highScore = this.gameState.score;
      localStorage.setItem('sniperEliteHighScore', this.gameState.highScore);
    }
  }
  
  render() {
    const ctx = this.ctx;
    
    const dayColor = `rgb(${50 + this.gameState.dayTime * 100}, ${80 + this.gameState.dayTime * 80}, ${120 + this.gameState.dayTime * 100})`;
    ctx.fillStyle = dayColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.renderBackground();
    this.renderCoverObjects();
    this.renderCivilians();
    this.renderTargets();
    this.renderEnemies();
    this.renderVehicles();
    this.renderPlayer();
    this.renderShells();
    this.renderBullets();
    this.renderParticles();
    
    if (this.gameState.isZoomed) {
      this.renderScope();
    }
    
    this.renderUI();
  }
  
  renderBackground() {
    const ctx = this.ctx;
    
    ctx.fillStyle = '#445544';
    for (let i = 0; i < 5; i++) {
      const x = (i * 200 + this.gameState.wind * this.gameState.time * 0.01) % (this.canvas.width + 200) - 100;
      ctx.beginPath();
      ctx.moveTo(x, 150 + i * 30);
      ctx.lineTo(x + 100, 180 + i * 30);
      ctx.lineTo(x + 50, 250);
      ctx.fill();
    }
    
    ctx.fillStyle = '#556655';
    ctx.fillRect(0, this.canvas.height - 100, this.canvas.width, 100);
  }
  
  renderCoverObjects() {
    const ctx = this.ctx;
    
    this.gameState.coverObjects.forEach(cover => {
      ctx.fillStyle = '#666666';
      ctx.fillRect(cover.x - cover.width / 2, cover.y - cover.height / 2, cover.width, cover.height);
      
      ctx.fillStyle = '#555555';
      if (cover.type === 'crate') {
        ctx.fillRect(cover.x - cover.width / 2 + 5, cover.y - cover.height / 2 + 5, cover.width - 10, cover.height - 10);
      } else if (cover.type === 'barrel') {
        ctx.beginPath();
        ctx.arc(cover.x, cover.y, cover.width / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }
  
  renderCivilians() {
    const ctx = this.ctx;
    
    this.gameState.civilians.forEach(civilian => {
      if (!civilian.alive) return;
      
      ctx.fillStyle = '#88aaff';
      ctx.fillRect(civilian.x - civilian.width / 2, civilian.y - civilian.height / 2, civilian.width, civilian.height);
      
      ctx.fillStyle = '#ffccaa';
      ctx.beginPath();
      ctx.arc(civilian.x, civilian.y - civilian.height / 2 - 5, 8, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  
  renderTargets() {
    const ctx = this.ctx;
    
    this.gameState.targets.forEach(target => {
      if (!target.alive) return;
      
      const crouchFactor = target.crouching ? 0.7 : 1;
      
      ctx.fillStyle = '#445544';
      ctx.fillRect(target.x - target.width / 2, target.y - target.height / 2 * crouchFactor, 
                   target.width, target.height * crouchFactor);
      
      ctx.fillStyle = '#664422';
      ctx.fillRect(target.x - 5, target.y - target.height / 2 * crouchFactor - 15, 10, 15);
      
      ctx.fillStyle = '#333333';
      ctx.fillRect(target.x - 6, target.y - target.height / 2 * crouchFactor - 12, 4, 4);
      ctx.fillRect(target.x + 2, target.y - target.height / 2 * crouchFactor - 12, 4, 4);
      
      if (target.rank === 'officer') {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(target.x - target.width / 2, target.y - target.height * crouchFactor - 5, target.width, 3);
      }
    });
  }
  
  renderEnemies() {
    const ctx = this.ctx;
    
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      
      ctx.fillStyle = enemy.alert ? '#aa4444' : '#556644';
      ctx.fillRect(enemy.x - enemy.width / 2, enemy.y - enemy.height / 2, enemy.width, enemy.height);
      
      ctx.fillStyle = '#665544';
      ctx.fillRect(enemy.x - 6, enemy.y - enemy.height / 2 - 12, 12, 12);
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(enemy.x - 4, enemy.y - enemy.height / 2 - 10, 3, 3);
      ctx.fillRect(enemy.x + 1, enemy.y - enemy.height / 2 - 10, 3, 3);
      
      if (enemy.scanning) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y - 10);
        ctx.lineTo(enemy.x + Math.cos(enemy.scanningAngle) * 50, 
                   enemy.y - 10 + Math.sin(enemy.scanningAngle) * 20);
        ctx.stroke();
      }
    });
  }
  
  renderVehicles() {
    const ctx = this.ctx;
    
    this.gameState.vehicles.forEach(vehicle => {
      if (!vehicle.alive) return;
      
      ctx.fillStyle = '#555566';
      ctx.fillRect(vehicle.x - vehicle.width / 2, vehicle.y - vehicle.height / 2, vehicle.width, vehicle.height);
      
      if (vehicle.vehicleType === 'tank') {
        ctx.fillStyle = '#444455';
        ctx.fillRect(vehicle.x - 10, vehicle.y - vehicle.height / 2 - 10, 20, 15);
      }
      
      ctx.fillStyle = '#222233';
      ctx.fillRect(vehicle.x - vehicle.width / 2 + 5, vehicle.y - vehicle.height / 2 + 5, 20, 15);
      ctx.fillRect(vehicle.x + vehicle.width / 2 - 25, vehicle.y - vehicle.height / 2 + 5, 20, 15);
    });
  }
  
  renderPlayer() {
    const ctx = this.ctx;
    const player = this.gameState.player;
    if (!player) return;
    
    ctx.save();
    ctx.translate(player.x, player.y);
    
    ctx.fillStyle = '#445544';
    ctx.fillRect(-15, -15, 30, 30);
    
    ctx.fillStyle = '#665544';
    ctx.beginPath();
    ctx.arc(0, -25, 12, 0, Math.PI * 2);
    ctx.fill();
    
    const weaponX = Math.cos(player.angle) * 20;
    const weaponY = Math.sin(player.angle) * 20;
    
    ctx.save();
    ctx.translate(weaponX, weaponY);
    ctx.rotate(player.angle);
    
    ctx.fillStyle = '#333333';
    if (this.gameState.currentWeapon === 'rifle') {
      ctx.fillRect(-5, -2, 35, 4);
      ctx.fillRect(25, -3, 10, 6);
    } else {
      ctx.fillRect(-3, -2, 15, 4);
    }
    
    ctx.restore();
    ctx.restore();
  }
  
  renderShells() {
    const ctx = this.ctx;
    
    this.gameState.shells.forEach(shell => {
      ctx.save();
      ctx.translate(shell.x, shell.y);
      ctx.rotate(shell.rotation);
      
      ctx.fillStyle = '#ccaa66';
      ctx.fillRect(-3, -2, 6, 4);
      
      ctx.restore();
    });
  }
  
  renderBullets() {
    const ctx = this.ctx;
    
    this.gameState.bullets.forEach(bullet => {
      if (!bullet.active) return;
      
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bullet.x, bullet.y);
      ctx.lineTo(bullet.endX, bullet.endY);
      ctx.stroke();
      
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(bullet.endX, bullet.endY, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  
  renderParticles() {
    const ctx = this.ctx;
    this.gameState.particles = this.gameState.particles || [];
    
    this.gameState.particles.forEach(particle => {
      if (particle.text) {
        ctx.fillStyle = particle.color;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.globalAlpha = particle.lifetime / 500;
        ctx.fillText(particle.text, particle.x, particle.y);
      } else {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.lifetime / 300;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    ctx.globalAlpha = 1;
  }
  
  renderScope() {
    const ctx = this.ctx;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    ctx.save();
    ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    ctx.scale(1 / this.gameState.zoom, 1 / this.gameState.zoom);
    ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
    
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.renderBackground();
    this.renderCoverObjects();
    this.renderTargets();
    this.renderEnemies();
    this.renderVehicles();
    this.renderCivilians();
    this.renderPlayer();
    
    ctx.restore();
    
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(this.canvas.width / 2 - 100, this.canvas.height / 2);
    ctx.lineTo(this.canvas.width / 2 - 20, this.canvas.height / 2);
    ctx.moveTo(this.canvas.width / 2 + 20, this.canvas.height / 2);
    ctx.lineTo(this.canvas.width / 2 + 100, this.canvas.height / 2);
    ctx.moveTo(this.canvas.width / 2, this.canvas.height / 2 - 100);
    ctx.lineTo(this.canvas.width / 2, this.canvas.height / 2 - 20);
    ctx.moveTo(this.canvas.width / 2, this.canvas.height / 2 + 20);
    ctx.lineTo(this.canvas.width / 2, this.canvas.height / 2 + 100);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 30, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 60, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 100, 0, Math.PI * 2);
    ctx.stroke();
    
    const wind = this.gameState.wind;
    ctx.fillStyle = '#00ff00';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Wind: ${Math.abs(wind).toFixed(1)} ${wind > 0 ? 'R' : 'L'}`, 30, 50);
    
    const distance = Math.sqrt(Math.pow(this.mousePos.x - this.canvas.width / 2, 2) + 
                              Math.pow(this.mousePos.y - this.canvas.height / 2, 2));
    const range = Math.floor(distance * 10);
    ctx.fillText(`Range: ${range}m`, 30, 70);
    
    this.renderScopeUI();
  }
  
  renderScopeUI() {
    const ctx = this.ctx;
    
    ctx.fillStyle = '#333333';
    ctx.fillRect(20, this.canvas.height - 80, 200, 60);
    
    ctx.fillStyle = '#00ff00';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Stability: ${Math.floor(this.gameState.stability)}%`, 30, this.canvas.height - 60);
    
    ctx.fillStyle = '#333333';
    ctx.fillRect(30, this.canvas.height - 50, 150, 10);
    ctx.fillStyle = this.gameState.breathMeter > 30 ? '#00ff00' : '#ff0000';
    ctx.fillRect(30, this.canvas.height - 50, 150 * (this.gameState.breathMeter / 100), 10);
    
    ctx.fillStyle = '#00ff00';
    ctx.fillText(`Heart Rate: ${this.gameState.heartRate}`, 30, this.canvas.height - 30);
  }
  
  renderUI() {
    const ctx = this.ctx;
    
    if (this.gameState.isZoomed) return;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    ctx.fillText(`Level: ${this.gameState.level}`, 20, 55);
    
    ctx.textAlign = 'right';
    ctx.fillText(`High: ${this.gameState.highScore}`, this.canvas.width - 20, 30);
    ctx.fillText(`Lives: ${this.gameState.lives}`, this.canvas.width - 20, 55);
    
    ctx.fillStyle = '#888888';
    ctx.fillText(`Rifle: ${this.gameState.ammo.rifle}`, 20, 80);
    ctx.fillText(`Pistol: ${this.gameState.ammo.pistol}`, this.canvas.width - 20, 80);
    
    ctx.fillText(`Accuracy: ${this.gameState.accuracy}%`, 20, 105);
    ctx.fillText(`Headshots: ${this.gameState.headshots}`, this.canvas.width - 20, 105);
    
    ctx.fillStyle = '#666666';
    ctx.fillRect(20, 120, 150, 15);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(20, 120, 150 * (this.gameState.stability / 100), 15);
    ctx.fillStyle = '#888888';
    ctx.fillText('Stability', 20, 150);
    
    const wind = this.gameState.wind;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`Wind: ${Math.abs(wind).toFixed(1)} ${wind > 0 ? '→' : '←'}`, this.canvas.width / 2, 30);
    
    if (this.gameState.currentMission) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(10, 10, 220, 60);
      
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(`Mission: ${this.gameState.currentMission.name}`, 20, 30);
      
      const targetsLeft = this.gameState.targets.filter(t => t.alive).length;
      ctx.fillText(`Targets: ${targetsLeft}`, 20, 50);
    }
    
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'left';
    ctx.fillText('SPACE: Zoom | SHIFT: Hold Breath | Q: Switch Weapon', 20, this.canvas.height - 20);
    
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
    ctx.fillText('MISSION FAILED', this.canvas.width / 2, this.canvas.height / 2 - 60);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2);
    ctx.fillText(`Accuracy: ${this.gameState.accuracy}%`, this.canvas.width / 2, this.canvas.height / 2 + 40);
    ctx.fillText(`Headshots: ${this.gameState.headshots}`, this.canvas.width / 2, this.canvas.height / 2 + 80);
    
    ctx.fillStyle = '#888888';
    ctx.font = '18px Arial';
    ctx.fillText('Click to restart', this.canvas.width / 2, this.canvas.height / 2 + 130);
  }
  
  restart() {
    this.gameState.time = 0;
    this.gameState.score = 0;
    this.gameState.level = 1;
    this.gameState.lives = 3;
    this.gameState.status = 'playing';
    this.gameState.ammo = { rifle: 10, pistol: 6, grenade: 2 };
    this.gameState.headshots = 0;
    this.gameState.bodyShots = 0;
    this.gameState.totalShots = 0;
    this.gameState.accuracy = 100;
    this.gameState.shotStreak = 0;
    this.gameState.longestStreak = 0;
    this.gameState.currentMission = this.gameState.missions[0];
    
    this.generateLevel();
    this.start();
  }
}

window.SniperEliteGame = SniperEliteGame;

window.addEventListener('keydown', function(e) {
  if (window.sniperEliteGameInstance) {
    window.sniperEliteGameInstance.keys = window.sniperEliteGameInstance.keys || {};
    window.sniperEliteGameInstance.keys[e.code] = true;
  }
});

window.addEventListener('keyup', function(e) {
  if (window.sniperEliteGameInstance) {
    window.sniperEliteGameInstance.keys = window.sniperEliteGameInstance.keys || {};
    window.sniperEliteGameInstance.keys[e.code] = false;
  }
});

window.sniperEliteGameInstance = null;
window.SniperEliteGame = SniperEliteGame;