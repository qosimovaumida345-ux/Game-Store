// Side-Scrolling Shooter Game
class SideScrollShooterGame {
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
      health: 100,
      weaponLevel: 1,
      status: 'playing',
      player: null,
      projectiles: [],
      enemies: [],
      powerups: [],
      particles: [],
      boss: null,
      distance: 0,
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = {
      x: 150,
      y: this.canvas.height / 2,
      width: 40,
      height: 30,
      vx: 0,
      vy: 0,
      speed: 5,
      health: 100,
      maxHealth: 100,
      invulnerable: 0,
      shooting: false,
      shootCooldown: 0
    };
  }
  
  spawnEnemy() {
    const type = Math.random() > 0.8 ? 'heavy' : 'normal';
    
    this.gameState.enemies.push({
      x: this.canvas.width + 30,
      y: 50 + Math.random() * (this.canvas.height - 100),
      width: type === 'heavy' ? 50 : 35,
      height: type === 'heavy' ? 40 : 30,
      speed: 2 + Math.random() * 2,
      health: type === 'heavy' ? 40 : 15,
      maxHealth: type === 'heavy' ? 40 : 15,
      type: type,
      shootTimer: Math.random() * 2,
      angle: 0
    });
  }
  
  spawnBoss() {
    this.gameState.boss = {
      x: this.canvas.width + 100,
      y: this.canvas.height / 2,
      width: 100,
      height: 80,
      speed: 1.5,
      health: 300,
      maxHealth: 300,
      phase: 1,
      shootTimer: 0,
      type: 'boss'
    };
  }
  
  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.enemyTimer = 0;
    this.gameLoop(this.lastTime);
  }
  
  stop() { this.isRunning = false; }
  
  gameLoop(currentTime) {
    if (!this.isRunning) return;
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    this.update(deltaTime);
    this.render();
    requestAnimationFrame((time) => this.gameLoop(time));
  }
  
  update(deltaTime) {
    if (this.gameState.gameOver) return;
    
    this.gameState.time += deltaTime;
    this.gameState.distance += deltaTime * 100;
    
    this.updatePlayer(deltaTime);
    this.updateProjectiles(deltaTime);
    this.updateEnemies(deltaTime);
    this.updateBoss(deltaTime);
    this.checkCollisions();
    this.spawnEnemies();
    this.updateParticles(deltaTime);
  }
  
  updatePlayer(deltaTime) {
    const input = this.getPlayerInput(this.players[0]);
    const player = this.gameState.player;
    
    if (input.left) player.vy -= player.speed * 2;
    if (input.right) player.vy += player.speed * 2;
    if (input.up) player.vy -= player.speed * 2;
    if (input.down) player.vy += player.speed * 2;
    
    player.vy *= 0.9;
    player.y += player.vy;
    
    player.y = Math.max(30, Math.min(this.canvas.height - 30, player.y));
    
    if (player.invulnerable > 0) player.invulnerable -= deltaTime;
    if (player.shootCooldown > 0) player.shootCooldown -= deltaTime;
    
    player.shooting = input.action || input.a;
    
    if (player.shooting && player.shootCooldown <= 0) {
      this.fireProjectile();
    }
  }
  
  fireProjectile() {
    const player = this.gameState.player;
    const level = this.gameState.weaponLevel;
    
    player.shootCooldown = level === 1 ? 0.2 : (level === 2 ? 0.15 : 0.1);
    
    this.gameState.projectiles.push({
      x: player.x + 20,
      y: player.y,
      vx: 12,
      vy: 0,
      width: 15,
      height: 4,
      damage: 10 * level,
      player: true
    });
    
    if (level >= 2) {
      this.gameState.projectiles.push({
        x: player.x + 20,
        y: player.y - 10,
        vx: 12,
        vy: -2,
        width: 12,
        height: 3,
        damage: 8,
        player: true
      });
      this.gameState.projectiles.push({
        x: player.x + 20,
        y: player.y + 10,
        vx: 12,
        vy: 2,
        width: 12,
        height: 3,
        damage: 8,
        player: true
      });
    }
  }
  
  updateProjectiles(deltaTime) {
    this.gameState.projectiles = this.gameState.projectiles.filter(proj => {
      proj.x += proj.vx;
      proj.y += proj.vy;
      
      return proj.x > -20 && proj.x < this.canvas.width + 20 && proj.y > 0 && proj.y < this.canvas.height;
    });
  }
  
  spawnEnemies() {
    this.enemyTimer += 0.016;
    
    if (this.enemyTimer > 1.5) {
      this.enemyTimer = 0;
      this.spawnEnemy();
      
      if (this.gameState.distance > 2000 && !this.gameState.boss) {
        this.spawnBoss();
      }
    }
  }
  
  updateEnemies(deltaTime) {
    const player = this.gameState.player;
    
    this.gameState.enemies.forEach(enemy => {
      enemy.x -= enemy.speed;
      
      enemy.shootTimer -= deltaTime;
      if (enemy.shootTimer <= 0) {
        enemy.shootTimer = 1.5 + Math.random();
        
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        
        this.gameState.projectiles.push({
          x: enemy.x,
          y: enemy.y,
          vx: Math.cos(angle) * 5,
          vy: Math.sin(angle) * 5,
          width: 8,
          height: 8,
          damage: 10,
          player: false
        });
      }
    });
    
    this.gameState.enemies = this.gameState.enemies.filter(e => e.x > -50 && e.health > 0);
  }
  
  updateBoss(deltaTime) {
    if (!this.gameState.boss) return;
    
    const boss = this.gameState.boss;
    
    if (boss.x > this.canvas.width - 150) {
      boss.x -= 1;
    } else {
      boss.y += Math.sin(this.gameState.time * 2) * 2;
      boss.y = Math.max(100, Math.min(this.canvas.height - 100, boss.y));
    }
    
    boss.shootTimer -= deltaTime;
    
    if (boss.shootTimer <= 0) {
      boss.shootTimer = 0.5;
      
      for (let i = -2; i <= 2; i++) {
        this.gameState.projectiles.push({
          x: boss.x,
          y: boss.y,
          vx: -6,
          vy: i * 2,
          width: 10,
          height: 10,
          damage: 15,
          player: false
        });
      }
    }
  }
  
  checkCollisions() {
    const player = this.gameState.player;
    
    this.gameState.projectiles.forEach(proj => {
      if (proj.player) {
        this.gameState.enemies.forEach(enemy => {
          if (this.checkCollision(proj, enemy)) {
            enemy.health -= proj.damage;
            this.createParticles(enemy.x, enemy.y, '#e74c3c', 5);
            
            if (enemy.health <= 0) {
              this.gameState.score += enemy.type === 'heavy' ? 50 : 20;
              this.createParticles(enemy.x, enemy.y, '#f1c40f', 15);
            }
          }
        });
        
        if (this.gameState.boss && this.checkCollision(proj, this.gameState.boss)) {
          this.gameState.boss.health -= proj.damage;
          this.createParticles(this.gameState.boss.x, this.gameState.boss.y, '#9b59b6', 5);
          
          if (this.gameState.boss.health <= 0) {
            this.gameState.score += 500;
            this.gameState.gameOver = true;
            this.createParticles(this.gameState.boss.x, this.gameState.boss.y, '#9b59b6', 30);
          }
        }
      } else if (player.invulnerable <= 0 && this.checkCollision(proj, player)) {
        this.hitPlayer();
      }
    });
    
    this.gameState.enemies = this.gameState.enemies.filter(e => e.health > 0);
    
    this.gameState.enemies.forEach(enemy => {
      if (player.invulnerable <= 0 && this.checkCollision(player, enemy)) {
        this.hitPlayer();
      }
    });
  }
  
  checkCollision(a, b) {
    return a.x - a.width/2 < b.x + b.width/2 &&
           a.x + a.width/2 > b.x - b.width/2 &&
           a.y - a.height/2 < b.y + b.height/2 &&
           a.y + a.height/2 > b.y - b.height/2;
  }
  
  hitPlayer() {
    const player = this.gameState.player;
    
    player.health -= 20;
    player.invulnerable = 1;
    this.createParticles(player.x, player.y, '#e74c3c', 15);
    
    if (player.health <= 0) {
      this.gameState.gameOver = true;
    }
  }
  
  createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      this.gameState.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        color,
        size: 3 + Math.random() * 4
      });
    }
  }
  
  updateParticles(deltaTime) {
    this.gameState.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime * 2;
    });
    this.gameState.particles = this.gameState.particles.filter(p => p.life > 0);
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.drawBackground();
    this.drawStars();
    this.drawProjectiles();
    this.drawEnemies();
    this.drawBoss();
    this.drawPlayer();
    this.drawParticles();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    gradient.addColorStop(0, '#0a0a20');
    gradient.addColorStop(1, '#1a1a40');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawStars() {
    this.ctx.fillStyle = '#fff';
    for (let i = 0; i < 30; i++) {
      const x = (i * 97 + this.gameState.distance * 0.2) % this.canvas.width;
      const y = (i * 53) % this.canvas.height;
      const size = (i % 3) + 1;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  
  drawPlayer() {
    const player = this.gameState.player;
    
    if (player.invulnerable > 0 && Math.floor(this.gameState.time * 15) % 2 === 0) return;
    
    this.ctx.save();
    this.ctx.translate(player.x, player.y);
    
    this.ctx.fillStyle = '#3498db';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 25, 12, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#2980b9';
    this.ctx.beginPath();
    this.ctx.moveTo(-20, 0);
    this.ctx.lineTo(-30, -8);
    this.ctx.lineTo(-30, 8);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#f39c12';
    this.ctx.beginPath();
    this.ctx.arc(12, -3, 6, 0, Math.PI * 2);
    this.ctx.arc(12, 3, 6, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }
  
  drawEnemies() {
    this.gameState.enemies.forEach(enemy => {
      this.ctx.save();
      this.ctx.translate(enemy.x, enemy.y);
      
      const color = enemy.type === 'heavy' ? '#e74c3c' : '#9b59b6';
      this.ctx.fillStyle = color;
      
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, enemy.width/2, enemy.height/2, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.fillRect(-10, -5, 6, 4);
      this.ctx.fillRect(4, -5, 6, 4);
      
      if (enemy.type === 'heavy') {
        this.ctx.strokeStyle = '#c0392b';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, enemy.width/2 - 5, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      
      this.ctx.restore();
    });
  }
  
  drawBoss() {
    if (!this.gameState.boss) return;
    
    const boss = this.gameState.boss;
    
    this.ctx.save();
    this.ctx.translate(boss.x, boss.y);
    
    this.ctx.fillStyle = '#8e44ad';
    this.ctx.fillRect(-50, -40, 100, 80);
    
    this.ctx.fillStyle = '#9b59b6';
    this.ctx.fillRect(-40, -30, 80, 60);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.beginPath();
    this.ctx.arc(-20, -10, 15, 0, Math.PI * 2);
    this.ctx.arc(20, -10, 15, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(-20, -10, 6, 0, Math.PI * 2);
    this.ctx.arc(20, -10, 6, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(-45, -55, 90, 10);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(-45, -55, 90 * (boss.health / boss.maxHealth), 10);
    
    this.ctx.restore();
  }
  
  drawProjectiles() {
    this.gameState.projectiles.forEach(proj => {
      this.ctx.fillStyle = proj.player ? '#f1c40f' : '#e74c3c';
      this.ctx.beginPath();
      this.ctx.ellipse(proj.x, proj.y, proj.width/2, proj.height/2, 0, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawParticles() {
    this.gameState.particles.forEach(p => {
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 130, 60);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    this.ctx.fillText(`Dist: ${Math.floor(this.gameState.distance)}m`, 20, 50);
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(this.canvas.width - 120, 10, 110, 30);
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(this.canvas.width - 115, 18, 100, 8);
    this.ctx.fillStyle = player => player.health > 30 ? '#e74c3c' : '#e74c3c';
    this.ctx.fillRect(this.canvas.width - 115, 18, 100 * (this.gameState.player.health / 100), 8);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('SPACE COMBAT', this.canvas.width / 2, 25);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = this.gameState.boss && this.gameState.boss.health <= 0 ? '#2ecc71' : '#e74c3c';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.gameState.boss && this.gameState.boss.health <= 0 ? 'VICTORY!' : 'GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

var player;

window.SideScrollShooterGame = SideScrollShooterGame;