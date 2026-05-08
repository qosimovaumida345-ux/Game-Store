// Bunker Defense - Tower Defense Shooter
class BunkerDefenseGame {
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
      highScore: parseInt(localStorage.getItem('bunkerDefenseHighScore')) || 0,
      wave: 1,
      lives: 20,
      money: 500,
      energy: 100,
      maxEnergy: 100,
      status: 'playing',
      bunker: null,
      turrets: [],
      walls: [],
      enemies: [],
      enemySpawns: [],
      bullets: [],
      towers: [],
      towerTypes: [],
      upgrades: [],
      mapWidth: 1200,
      mapHeight: 800,
      camera: { x: 0, y: 0 },
      selectedTower: null,
      buildMode: false,
      waveInProgress: false,
      waveTimer: 0,
      enemiesRemaining: 0,
      totalEnemiesSpawned: 0,
      combo: 0,
      lastKillTime: 0
    };
    
    this.initLevel();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initLevel() {
    this.gameState.bunker = {
      x: this.gameState.mapWidth / 2,
      y: this.gameState.mapHeight - 80,
      width: 80,
      height: 60,
      health: 1000,
      maxHealth: 1000,
      energy: 100,
      maxEnergy: 200,
      defense: 0,
      repairs: []
    };
    
    this.gameState.enemySpawns = [
      { x: 100, y: 50, active: true },
      { x: this.gameState.mapWidth / 2, y: 30, active: true },
      { x: this.gameState.mapWidth - 100, y: 50, active: true }
    ];
    
    this.gameState.towerTypes = [
      { name: 'Machine Gun', cost: 100, damage: 10, range: 150, fireRate: 100, type: 'rapid' },
      { name: 'Sniper Tower', cost: 200, damage: 50, range: 300, fireRate: 1000, type: 'sniper' },
      { name: 'Cannon', cost: 300, damage: 40, range: 120, fireRate: 800, type: 'area' },
      { name: 'Laser', cost: 400, damage: 25, range: 180, fireRate: 50, type: 'laser' },
      { name: 'Tesla Coil', cost: 500, damage: 30, range: 140, fireRate: 200, type: 'chain' },
      { name: 'Missile Launcher', cost: 600, damage: 80, range: 250, fireRate: 1500, type: 'missile' }
    ];
    
    this.gameState.walls = this.generateWalls();
    
    this.gameState.turrets = [
      this.createTurret(this.gameState.bunker.x - 40, this.gameState.bunker.y, 'machine_gun'),
      this.createTurret(this.gameState.bunker.x + 40, this.gameState.bunker.y, 'machine_gun')
    ];
  }
  
  generateWalls() {
    const walls = [];
    
    const bunkerLeft = this.gameState.bunker.x - 100;
    const bunkerRight = this.gameState.bunker.x + 100;
    const bunkerY = this.gameState.bunker.y - 30;
    
    for (let i = 0; i < 5; i++) {
      walls.push({
        x: bunkerLeft - 30 - i * 20,
        y: bunkerY - i * 10,
        width: 30,
        height: 30,
        health: 100,
        maxHealth: 100
      });
      
      walls.push({
        x: bunkerRight + 30 + i * 20,
        y: bunkerY - i * 10,
        width: 30,
        height: 30,
        health: 100,
        maxHealth: 100
      });
    }
    
    walls.push({
      x: this.gameState.mapWidth / 2,
      y: 200,
      width: 200,
      height: 20,
      health: 200,
      maxHealth: 200
    });
    
    return walls;
  }
  
  createTurret(x, y, type) {
    return {
      x: x,
      y: y,
      type: type,
      angle: -Math.PI / 2,
      cooldown: 0,
      level: 1,
      damage: 10,
      range: 150,
      fireRate: 200
    };
  }
  
  start() {
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
    
    this.updateWave(deltaTime);
    this.updateTurrets(deltaTime);
    this.updateTowers(deltaTime);
    this.updateEnemies(deltaTime);
    this.updateBullets(deltaTime);
    this.updateBunker(deltaTime);
    this.updateEnergy(deltaTime);
    this.checkCollisions();
    this.updateCamera();
  }
  
  updateWave(deltaTime) {
    if (!this.gameState.waveInProgress) {
      this.gameState.waveTimer += deltaTime;
      
      if (this.gameState.waveTimer > 10000) {
        this.startWave();
      }
    }
    
    if (this.gameState.waveInProgress) {
      const spawnRate = Math.max(500, 2000 - this.gameState.wave * 100);
      
      if (this.gameState.totalEnemiesSpawned < this.gameState.wave * 10 + 5 &&
          Math.random() < deltaTime / spawnRate) {
        this.spawnEnemy();
        this.gameState.totalEnemiesSpawned++;
      }
      
      const aliveEnemies = this.gameState.enemies.filter(e => e.alive).length;
      if (aliveEnemies === 0 && this.gameState.totalEnemiesSpawned >= this.gameState.wave * 10 + 5) {
        this.endWave();
      }
    }
  }
  
  startWave() {
    this.gameState.waveInProgress = true;
    this.gameState.waveTimer = 0;
    this.gameState.totalEnemiesSpawned = 0;
    this.gameState.enemiesRemaining = this.gameState.wave * 10 + 5;
  }
  
  endWave() {
    this.gameState.waveInProgress = false;
    this.gameState.wave++;
    this.gameState.money += 200 * this.gameState.wave;
    this.gameState.score += 1000 * this.gameState.wave;
    
    this.playSound('waveComplete');
  }
  
  spawnEnemy() {
    const spawn = this.gameState.enemySpawns[Math.floor(Math.random() * this.gameState.enemySpawns.length)];
    
    const types = ['grunt', 'fast', 'tank', 'ranged', 'swarm'];
    const weights = [0.4, 0.25, 0.15, 0.1, 0.1];
    
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
    
    enemy.x = spawn.x + (Math.random() - 0.5) * 50;
    enemy.y = spawn.y;
    enemy.alive = true;
    
    this.gameState.enemies.push(enemy);
  }
  
  createEnemyByType(type) {
    const baseProps = {
      grunt: { health: 20, speed: 1.5, damage: 5, points: 10, reward: 15 },
      fast: { health: 10, speed: 3, damage: 3, points: 15, reward: 20 },
      tank: { health: 80, speed: 0.8, damage: 15, points: 30, reward: 50 },
      ranged: { health: 15, speed: 1.2, damage: 10, points: 20, reward: 25 },
      swarm: { health: 5, speed: 2, damage: 2, points: 5, reward: 8 }
    };
    
    const props = baseProps[type];
    const waveMultiplier = 1 + this.gameState.wave * 0.15;
    
    return {
      type: type,
      x: 0,
      y: 0,
      width: type === 'tank' ? 40 : type === 'swarm' ? 15 : 25,
      height: type === 'tank' ? 40 : type === 'swarm' ? 15 : 30,
      health: Math.floor(props.health * waveMultiplier),
      maxHealth: Math.floor(props.health * waveMultiplier),
      speed: props.speed,
      damage: props.damage,
      points: props.points,
      reward: props.reward,
      alive: true,
      path: this.findPath()
    };
  }
  
  findPath() {
    return {
      startX: this.gameState.enemySpawns[0].x,
      startY: 0,
      endX: this.gameState.bunker.x,
      endY: this.gameState.bunker.y
    };
  }
  
  updateTurrets(deltaTime) {
    this.gameState.turrets.forEach(turret => {
      turret.cooldown -= deltaTime;
      
      const target = this.findTarget(turret);
      if (target) {
        turret.angle = Math.atan2(target.y - turret.y, target.x - turret.x);
        
        if (turret.cooldown <= 0) {
          this.shootFromTurret(turret);
          turret.cooldown = turret.fireRate;
        }
      }
    });
  }
  
  updateTowers(deltaTime) {
    this.gameState.towers.forEach(tower => {
      tower.cooldown -= deltaTime;
      
      if (tower.cooldown <= 0) {
        const target = this.findTarget(tower);
        if (target) {
          this.fireTower(tower, target);
          tower.cooldown = tower.fireRate;
        }
      }
    });
  }
  
  findTarget(turret) {
    let closest = null;
    let minDist = turret.range;
    
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      
      const dist = Math.sqrt(Math.pow(enemy.x - turret.x, 2) + Math.pow(enemy.y - turret.y, 2));
      if (dist < minDist) {
        minDist = dist;
        closest = enemy;
      }
    });
    
    return closest;
  }
  
  shootFromTurret(turret) {
    this.gameState.bullets.push({
      x: turret.x + Math.cos(turret.angle) * 20,
      y: turret.y + Math.sin(turret.angle) * 20,
      vx: Math.cos(turret.angle) * 12,
      vy: Math.sin(turret.angle) * 12,
      damage: turret.damage,
      type: 'turret',
      radius: 4,
      life: 1000
    });
  }
  
  fireTower(tower, target) {
    switch (tower.type) {
      case 'sniper':
        this.gameState.bullets.push({
          x: tower.x,
          y: tower.y,
          vx: (target.x - tower.x) * 0.2,
          vy: (target.y - tower.y) * 0.2,
          damage: tower.damage,
          type: 'sniper',
          radius: 6,
          life: 2000,
          piercing: true
        });
        break;
        
      case 'area':
        this.gameState.bullets.push({
          x: tower.x,
          y: tower.y,
          vx: (target.x - tower.x) * 0.1,
          vy: (target.y - tower.y) * 0.1,
          damage: tower.damage,
          type: 'cannon',
          radius: 8,
          life: 1500,
          explosive: true,
          explosionRadius: 60
        });
        break;
        
      case 'laser':
        this.gameState.bullets.push({
          x: tower.x,
          y: tower.y,
          targetX: target.x,
          targetY: target.y,
          damage: tower.damage,
          type: 'laser',
          radius: 2,
          life: 100
        });
        break;
        
      case 'chain':
        this.gameState.bullets.push({
          x: tower.x,
          y: tower.y,
          targetX: target.x,
          targetY: target.y,
          damage: tower.damage,
          type: 'tesla',
          radius: 3,
          life: 200,
          chain: true,
          chainTargets: 3
        });
        break;
        
      case 'missile':
        this.gameState.bullets.push({
          x: tower.x,
          y: tower.y,
          targetX: target.x,
          targetY: target.y,
          vx: (target.x - tower.x) * 0.05,
          vy: (target.y - tower.y) * 0.05,
          damage: tower.damage,
          type: 'missile',
          radius: 10,
          life: 3000,
          homing: true,
          explosive: true,
          explosionRadius: 80
        });
        break;
        
      default:
        this.gameState.bullets.push({
          x: tower.x,
          y: tower.y,
          vx: (target.x - tower.x) * 0.15,
          vy: (target.y - tower.y) * 0.15,
          damage: tower.damage,
          type: 'bullet',
          radius: 4,
          life: 1000
        });
    }
  }
  
  updateEnemies(deltaTime) {
    const bunker = this.gameState.bunker;
    
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      
      const targetX = bunker.x;
      const targetY = bunker.y;
      
      const dx = targetX - enemy.x;
      const dy = targetY - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 50) {
        enemy.x += (dx / dist) * enemy.speed;
        enemy.y += (dy / dist) * enemy.speed;
      } else {
        this.damageBunker(enemy.damage);
        enemy.alive = false;
      }
      
      this.gameState.walls.forEach(wall => {
        if (this.checkCollision(enemy, wall)) {
          const wallDx = wall.x - enemy.x;
          const wallDy = wall.y - enemy.y;
          const wallDist = Math.sqrt(wallDx * wallDx + wallDy * wallDy);
          
          if (wallDist > 0) {
            enemy.x -= (wallDx / wallDist) * enemy.speed;
            enemy.y -= (wallDy / wallDist) * enemy.speed;
          }
          
          wall.health -= 0.5;
          if (wall.health <= 0) {
            wall.active = false;
          }
        }
      });
    });
    
    this.gameState.enemies = this.gameState.enemies.filter(e => e.alive !== false);
    this.gameState.walls = this.gameState.walls.filter(w => w.active !== false && w.health > 0);
  }
  
  updateBullets(deltaTime) {
    this.gameState.bullets.forEach(bullet => {
      if (bullet.type === 'laser' || bullet.type === 'tesla') {
        bullet.life -= deltaTime;
        return;
      }
      
      if (bullet.homing && bullet.targetX !== undefined) {
        const dx = bullet.targetX - bullet.x;
        const dy = bullet.targetY - bullet.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 5) {
          bullet.vx = (dx / dist) * 8;
          bullet.vy = (dy / dist) * 8;
        }
      }
      
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      bullet.life -= deltaTime;
      
      if (bullet.life <= 0 || 
          bullet.x < 0 || bullet.x > this.gameState.mapWidth ||
          bullet.y < 0 || bullet.y > this.gameState.mapHeight) {
        bullet.active = false;
      }
    });
    
    this.gameState.bullets = this.gameState.bullets.filter(b => b.active !== false);
  }
  
  damageBunker(damage) {
    this.gameState.bunker.health -= damage;
    this.gameState.lives--;
    
    this.playSound('bunkerHit');
    
    if (this.gameState.bunker.health <= 0 || this.gameState.lives <= 0) {
      this.gameOver();
    }
  }
  
  updateBunker(deltaTime) {
    const bunker = this.gameState.bunker;
    
    if (bunker.repairs.length > 0) {
      bunker.health = Math.min(bunker.maxHealth, bunker.health + bunker.repairs.length * 2);
    }
    
    bunker.energy = Math.min(bunker.maxEnergy, bunker.energy + deltaTime * 0.01);
  }
  
  updateEnergy(deltaTime) {
    this.gameState.energy = 0;
    
    this.gameState.turrets.forEach(() => {
      this.gameState.energy += 5;
    });
    
    this.gameState.towers.forEach(tower => {
      const cost = tower.type === 'missile' ? 15 : tower.type === 'tesla' ? 12 : 8;
      this.gameState.energy -= cost;
    });
    
    this.gameState.energy = Math.max(0, this.gameState.energy);
  }
  
  checkCollisions() {
    this.gameState.bullets.forEach(bullet => {
      if (!bullet.active) return;
      
      if (bullet.explosive) {
        this.gameState.enemies.forEach(enemy => {
          if (!enemy.alive) return;
          
          const dist = Math.sqrt(Math.pow(enemy.x - bullet.x, 2) + Math.pow(enemy.y - bullet.y, 2));
          if (dist < bullet.explosionRadius) {
            enemy.health -= bullet.damage * (1 - dist / bullet.explosionRadius);
            
            if (enemy.health <= 0) {
              this.killEnemy(enemy);
            }
          }
        });
        
        if (bullet.active !== false) {
          this.createExplosion(bullet.x, bullet.y, bullet.explosionRadius);
          bullet.active = false;
        }
        return;
      }
      
      this.gameState.enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        const dist = Math.sqrt(Math.pow(enemy.x - bullet.x, 2) + Math.pow(enemy.y - bullet.y, 2));
        if (dist < enemy.width / 2 + bullet.radius) {
          enemy.health -= bullet.damage;
          bullet.active = false;
          
          if (bullet.type === 'laser' || bullet.type === 'tesla') {
            bullet.active = true;
          }
          
          if (enemy.health <= 0) {
            this.killEnemy(enemy);
          }
        }
      });
    });
  }
  
  killEnemy(enemy) {
    enemy.alive = false;
    
    this.gameState.combo++;
    const multiplier = Math.min(this.gameState.combo, 5);
    this.gameState.score += enemy.points * multiplier;
    this.gameState.money += enemy.reward * multiplier;
    
    this.createExplosion(enemy.x, enemy.y, 20, '#ff0000');
    this.playSound('enemyDeath');
  }
  
  createExplosion(x, y, radius) {
    for (let i = 0; i < 15; i++) {
      this.gameState.particles = this.gameState.particles || [];
      this.gameState.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color: '#ff8800',
        size: Math.random() * 6 + 2,
        lifetime: 500
      });
    }
  }
  
  updateCamera() {
    const targetX = this.gameState.mapWidth / 2 - this.canvas.width / 2;
    const targetY = this.gameState.mapHeight / 2 - this.canvas.height / 2;
    
    this.gameState.camera.x += (targetX - this.gameState.camera.x) * 0.1;
    this.gameState.camera.y += (targetY - this.gameState.camera.y) * 0.1;
  }
  
  buildTower(type) {
    if (this.gameState.money < type.cost) return;
    
    const mouseWorldX = this.mousePos.x + this.gameState.camera.x;
    const mouseWorldY = this.mousePos.y + this.gameState.camera.y;
    
    this.gameState.money -= type.cost;
    
    this.gameState.towers.push({
      x: mouseWorldX,
      y: mouseWorldY,
      type: type.type,
      damage: type.damage,
      range: type.range,
      fireRate: type.fireRate,
      cooldown: 0,
      level: 1,
      angle: 0
    });
    
    this.gameState.buildMode = false;
    this.gameState.selectedTower = null;
    
    this.playSound('build');
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
          enemyDeath: 100,
          bunkerHit: 200,
          waveComplete: 500,
          build: 800
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
  
  checkCollision(a, b) {
    return Math.abs(a.x - b.x) < (a.width || 20) / 2 + (b.width || 20) / 2 &&
           Math.abs(a.y - b.y) < (a.height || 20) / 2 + (b.height || 20) / 2;
  }
  
  gameOver() {
    this.gameState.status = 'gameover';
    this.isRunning = false;
    
    if (this.gameState.score > this.gameState.highScore) {
      this.gameState.highScore = this.gameState.score;
      localStorage.setItem('bunkerDefenseHighScore', this.gameState.highScore);
    }
  }
  
  render() {
    const ctx = this.ctx;
    
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    ctx.save();
    ctx.translate(-this.gameState.camera.x, -this.gameState.camera.y);
    
    this.renderMap();
    this.renderWalls();
    this.renderBunker();
    this.renderTurrets();
    this.renderTowers();
    this.renderEnemies();
    this.renderBullets();
    this.renderParticles();
    this.renderRangeIndicators();
    
    ctx.restore();
    
    this.renderUI();
    this.renderBuildMenu();
  }
  
  renderMap() {
    const ctx = this.ctx;
    
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, this.gameState.mapWidth, this.gameState.mapHeight);
    
    ctx.strokeStyle = '#222222';
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
  
  renderWalls() {
    const ctx = this.ctx;
    
    this.gameState.walls.forEach(wall => {
      const healthPercent = wall.health / wall.maxHealth;
      
      ctx.fillStyle = healthPercent > 0.5 ? '#666666' : healthPercent > 0.25 ? '#666633' : '#663333';
      ctx.fillRect(wall.x - wall.width / 2, wall.y - wall.height / 2, wall.width, wall.height);
      
      ctx.fillStyle = '#444444';
      ctx.fillRect(wall.x - wall.width / 2 + 3, wall.y - wall.height / 2 + 3, 
                   wall.width - 6, wall.height - 6);
    });
  }
  
  renderBunker() {
    const bunker = this.gameState.bunker;
    const ctx = this.ctx;
    
    ctx.fillStyle = '#224466';
    ctx.fillRect(bunker.x - bunker.width / 2, bunker.y - bunker.height / 2, 
                 bunker.width, bunker.height);
    
    ctx.fillStyle = '#113355';
    ctx.fillRect(bunker.x - bunker.width / 2 + 5, bunker.y - bunker.height / 2 + 5,
                 bunker.width - 10, bunker.height - 20);
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(bunker.x, bunker.y - 10, 15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = bunker.energy > 0 ? '#00aaff' : '#333333';
    ctx.beginPath();
    ctx.arc(bunker.x, bunker.y - 10, 10, 0, Math.PI * 2);
    ctx.fill();
    
    const healthPercent = bunker.health / bunker.maxHealth;
    ctx.fillStyle = '#333333';
    ctx.fillRect(bunker.x - 40, bunker.y - bunker.height / 2 - 15, 80, 8);
    ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : '#ff0000';
    ctx.fillRect(bunker.x - 40, bunker.y - bunker.height / 2 - 15, 80 * healthPercent, 8);
  }
  
  renderTurrets() {
    const ctx = this.ctx;
    
    this.gameState.turrets.forEach(turret => {
      ctx.save();
      ctx.translate(turret.x, turret.y);
      
      ctx.fillStyle = '#445566';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.rotate(turret.angle);
      ctx.fillStyle = '#333333';
      ctx.fillRect(0, -4, 25, 8);
      
      ctx.restore();
    });
  }
  
  renderTowers() {
    const ctx = this.ctx;
    
    this.gameState.towers.forEach(tower => {
      ctx.save();
      ctx.translate(tower.x, tower.y);
      
      const colors = {
        rapid: '#448844',
        sniper: '#884488',
        area: '#884444',
        laser: '#4488ff',
        chain: '#ffff44',
        missile: '#ff4444'
      };
      
      ctx.fillStyle = colors[tower.type] || '#666666';
      ctx.fillRect(-15, -15, 30, 30);
      
      ctx.fillStyle = '#222222';
      ctx.fillRect(-8, -20, 16, 15);
      
      if (tower.type === 'missile') {
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.arc(0, -25, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      
      const healthPercent = tower.health / tower.maxHealth;
      if (healthPercent < 1) {
        ctx.fillStyle = '#333333';
        ctx.fillRect(-15, 20, 30, 4);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(-15, 20, 30 * healthPercent, 4);
      }
      
      ctx.restore();
    });
  }
  
  renderEnemies() {
    const ctx = this.ctx;
    
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      
      const colors = {
        grunt: '#44aa44',
        fast: '#aaaa44',
        tank: '#884444',
        ranged: '#44aaaa',
        swarm: '#aa4444'
      };
      
      ctx.fillStyle = colors[enemy.type];
      ctx.fillRect(enemy.x - enemy.width / 2, enemy.y - enemy.height / 2, 
                   enemy.width, enemy.height);
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(enemy.x - 4, enemy.y - enemy.height / 2 - 5, 3, 3);
      ctx.fillRect(enemy.x + 1, enemy.y - enemy.height / 2 - 5, 3, 3);
      
      if (enemy.maxHealth > 15) {
        ctx.fillStyle = '#333333';
        ctx.fillRect(enemy.x - 15, enemy.y - enemy.height / 2 - 10, 30, 4);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(enemy.x - 15, enemy.y - enemy.height / 2 - 10, 
                     30 * (enemy.health / enemy.maxHealth), 4);
      }
    });
  }
  
  renderBullets() {
    const ctx = this.ctx;
    
    this.gameState.bullets.forEach(bullet => {
      if (!bullet.active) return;
      
      if (bullet.type === 'laser') {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.globalAlpha = bullet.life / 100;
        ctx.beginPath();
        ctx.moveTo(bullet.x, bullet.y);
        ctx.lineTo(bullet.targetX, bullet.targetY);
        ctx.stroke();
        ctx.globalAlpha = 1;
        return;
      }
      
      if (bullet.type === 'tesla') {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.globalAlpha = bullet.life / 200;
        ctx.beginPath();
        ctx.moveTo(bullet.x, bullet.y);
        ctx.lineTo(bullet.targetX, bullet.targetY);
        ctx.stroke();
        ctx.globalAlpha = 1;
        return;
      }
      
      const colors = {
        turret: '#ffff00',
        sniper: '#00ff00',
        cannon: '#ff8800',
        missile: '#ff0000'
      };
      
      ctx.fillStyle = colors[bullet.type] || '#ffffff';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
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
  
  renderRangeIndicators() {
    if (!this.gameState.buildMode) return;
    
    const ctx = this.ctx;
    const type = this.gameState.selectedTower;
    if (!type) return;
    
    const mouseX = this.mousePos.x + this.gameState.camera.x;
    const mouseY = this.mousePos.y + this.gameState.camera.y;
    
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, type.range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  
  renderUI() {
    const ctx = this.ctx;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    ctx.fillText(`Wave: ${this.gameState.wave}`, 20, 55);
    
    ctx.textAlign = 'right';
    ctx.fillText(`High: ${this.gameState.highScore}`, this.canvas.width - 20, 30);
    ctx.fillText(`Lives: ${this.gameState.lives}`, this.canvas.width - 20, 55);
    
    ctx.fillStyle = '#00ff00';
    ctx.fillText(`$${this.gameState.money}`, 20, 80);
    
    ctx.fillStyle = '#00aaff';
    ctx.fillText(`Energy: ${Math.floor(this.gameState.energy)}%`, this.canvas.width - 120, 80);
    
    const bunker = this.gameState.bunker;
    ctx.fillStyle = '#333333';
    ctx.fillRect(20, 100, 200, 20);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(20, 100, 200 * (bunker.health / bunker.maxHealth), 20);
    ctx.fillStyle = '#888888';
    ctx.fillText('Bunker Health', 20, 135);
    
    if (this.gameState.waveInProgress) {
      ctx.fillStyle = '#ff8800';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Wave ${this.gameState.wave} IN PROGRESS`, this.canvas.width / 2, 30);
    } else {
      ctx.fillStyle = '#888888';
      ctx.textAlign = 'center';
      const nextWave = Math.ceil((10 - this.gameState.waveTimer / 1000));
      ctx.fillText(`Next wave in: ${Math.max(0, nextWave)}s`, this.canvas.width / 2, 30);
    }
    
    if (this.gameState.combo > 1) {
      ctx.fillStyle = '#ff8800';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`${this.gameState.combo}x COMBO!`, this.canvas.width / 2, 55);
    }
  }
  
  renderBuildMenu() {
    if (!this.gameState.buildMode) {
      ctx.fillStyle = '#333333';
      ctx.fillRect(10, this.canvas.height - 150, 200, 140);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Press 1-6 to build towers', 20, this.canvas.height - 125);
      ctx.fillText('1: Machine Gun ($100)', 20, this.canvas.height - 100);
      ctx.fillText('2: Sniper ($200)', 20, this.canvas.height - 80);
      ctx.fillText('3: Cannon ($300)', 20, this.canvas.height - 60);
      ctx.fillText('4: Laser ($400)', 20, this.canvas.height - 40);
      return;
    }
    
    const ctx = this.ctx;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(this.canvas.width - 220, 150, 200, 250);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Build Mode', this.canvas.width - 210, 175);
    ctx.fillText('Click to place tower', this.canvas.width - 210, 195);
    ctx.fillText('ESC to cancel', this.canvas.width - 210, 215);
  }
  
  restart() {
    this.gameState = {
      time: 0,
      score: 0,
      highScore: this.gameState.highScore,
      wave: 1,
      lives: 20,
      money: 500,
      energy: 100,
      maxEnergy: 100,
      status: 'playing',
      bunker: null,
      turrets: [],
      walls: [],
      enemies: [],
      enemySpawns: [],
      bullets: [],
      towers: [],
      towerTypes: this.gameState.towerTypes,
      upgrades: [],
      mapWidth: 1200,
      mapHeight: 800,
      camera: { x: 0, y: 0 },
      selectedTower: null,
      buildMode: false,
      waveInProgress: false,
      waveTimer: 0,
      enemiesRemaining: 0,
      totalEnemiesSpawned: 0,
      combo: 0,
      lastKillTime: 0,
      particles: []
    };
    
    this.initLevel();
    this.start();
  }
}

window.BunkerDefenseGame = BunkerDefenseGame;