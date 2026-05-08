// Top-Down Twin Stick Shooter
class TwinStickShooterGame {
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
      wave: 1,
      health: 100,
      status: 'playing',
      player: null,
      enemies: [],
      bullets: [],
      powerups: [],
      particles: [],
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
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      radius: 15,
      speed: 4,
      angle: 0,
      shootCooldown: 0,
      fireRate: 0.15
    };
  }
  
  spawnEnemy() {
    const types = ['basic', 'fast', 'tank', 'shooter'];
    const type = types[Math.floor(Math.random() * types.length)];
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    if (side === 0) { x = Math.random() * this.canvas.width; y = -30; }
    else if (side === 1) { x = this.canvas.width + 30; y = Math.random() * this.canvas.height; }
    else if (side === 2) { x = Math.random() * this.canvas.width; y = this.canvas.height + 30; }
    else { x = -30; y = Math.random() * this.canvas.height; }
    
    const stats = {
      basic: { health: 20, speed: 2, radius: 15, score: 10 },
      fast: { health: 10, speed: 4, radius: 10, score: 20 },
      tank: { health: 50, speed: 1, radius: 25, score: 30 },
      shooter: { health: 15, speed: 1.5, radius: 12, score: 25, shoots: true }
    };
    
    const s = stats[type];
    this.gameState.enemies.push({
      x, y,
      type,
      health: s.health + this.gameState.wave * 2,
      maxHealth: s.health + this.gameState.wave * 2,
      speed: s.speed,
      radius: s.radius,
      score: s.score,
      shoots: s.shoots || false,
      shootTimer: Math.random() * 2
    });
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
    
    this.updatePlayer(deltaTime);
    this.updateBullets(deltaTime);
    this.updateEnemies(deltaTime);
    this.checkCollisions();
    this.spawnEnemies();
    this.updateParticles(deltaTime);
    
    if (this.gameState.enemies.length === 0) {
      this.gameState.wave++;
    }
  }
  
  updatePlayer(deltaTime) {
    const input = this.getPlayerInput(this.players[0]);
    const player = this.gameState.player;
    
    let moveX = 0, moveY = 0;
    if (input.left) moveX = -1;
    if (input.right) moveX = 1;
    if (input.up) moveY = -1;
    if (input.down) moveY = 1;
    
    if (moveX !== 0 || moveY !== 0) {
      const len = Math.sqrt(moveX * moveX + moveY * moveY);
      moveX /= len;
      moveY /= len;
      player.x += moveX * player.speed;
      player.y += moveY * player.speed;
    }
    
    player.x = Math.max(20, Math.min(this.canvas.width - 20, player.x));
    player.y = Math.max(20, Math.min(this.canvas.height - 20, player.y));
    
    let aimX = 0, aimY = 0;
    if (input.a) aimX = -1;
    if (input.b) aimX = 1;
    if (input.up) aimY = -1;
    if (input.down) aimY = 1;
    
    if (aimX !== 0 || aimY !== 0) {
      player.angle = Math.atan2(aimY, aimX);
    }
    
    if (player.shootCooldown > 0) player.shootCooldown -= deltaTime;
    
    if (input.action || input.a || input.b) {
      if (player.shootCooldown <= 0) {
        this.fireBullet();
        player.shootCooldown = player.fireRate;
      }
    }
  }
  
  fireBullet() {
    const player = this.gameState.player;
    
    this.gameState.bullets.push({
      x: player.x + Math.cos(player.angle) * 20,
      y: player.y + Math.sin(player.angle) * 20,
      vx: Math.cos(player.angle) * 12,
      vy: Math.sin(player.angle) * 12,
      radius: 5,
      damage: 10,
      player: true
    });
  }
  
  updateBullets(deltaTime) {
    this.gameState.bullets = this.gameState.bullets.filter(b => {
      b.x += b.vx * deltaTime * 60;
      b.y += b.vy * deltaTime * 60;
      
      return b.x > -20 && b.x < this.canvas.width + 20 &&
             b.y > -20 && b.y < this.canvas.height + 20;
    });
  }
  
  spawnEnemies() {
    this.enemyTimer += 0.016;
    
    if (this.enemyTimer > 2 - this.gameState.wave * 0.1) {
      this.enemyTimer = 0;
      this.spawnEnemy();
    }
  }
  
  updateEnemies(deltaTime) {
    const player = this.gameState.player;
    
    this.gameState.enemies.forEach(enemy => {
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      enemy.x += (dx / dist) * enemy.speed;
      enemy.y += (dy / dist) * enemy.speed;
      
      if (enemy.shoots) {
        enemy.shootTimer -= deltaTime;
        
        if (enemy.shootTimer <= 0) {
          enemy.shootTimer = 2;
          
          const angle = Math.atan2(dy, dx);
          this.gameState.bullets.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angle) * 4,
            vy: Math.sin(angle) * 4,
            radius: 4,
            damage: 10,
            player: false
          });
        }
      }
    });
  }
  
  checkCollisions() {
    const player = this.gameState.player;
    
    this.gameState.bullets.forEach(bullet => {
      if (bullet.player) {
        this.gameState.enemies.forEach(enemy => {
          const dx = enemy.x - bullet.x;
          const dy = enemy.y - bullet.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < enemy.radius + bullet.radius) {
            enemy.health -= bullet.damage;
            this.createParticles(bullet.x, bullet.y, '#f1c40f', 5);
            
            if (enemy.health <= 0) {
              this.gameState.score += enemy.score;
              this.createParticles(enemy.x, enemy.y, '#e74c3c', 10);
            }
            
            bullet.x = -100;
          }
        });
      } else {
        const dx = player.x - bullet.x;
        const dy = player.y - bullet.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.radius + bullet.radius) {
          this.gameState.health -= 10;
          this.createParticles(bullet.x, bullet.y, '#e74c3c', 8);
          bullet.x = -100;
          
          if (this.gameState.health <= 0) {
            this.gameState.gameOver = true;
          }
        }
      }
    });
    
    this.gameState.enemies = this.gameState.enemies.filter(e => e.health > 0);
    
    this.gameState.enemies.forEach(enemy => {
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < player.radius + enemy.radius) {
        this.gameState.health -= 1;
        this.createParticles(player.x, player.y, '#e74c3c', 3);
        
        if (this.gameState.health <= 0) {
          this.gameState.gameOver = true;
        }
      }
    });
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
    this.drawBullets();
    this.drawEnemies();
    this.drawPlayer();
    this.drawParticles();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#0a0a15');
    gradient.addColorStop(1, '#1a1a25');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.canvas.width; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }
  
  drawPlayer() {
    const player = this.gameState.player;
    
    this.ctx.save();
    this.ctx.translate(player.x, player.y);
    this.ctx.rotate(player.angle);
    
    this.ctx.fillStyle = '#3498db';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#2980b9';
    this.ctx.fillRect(0, -4, 20, 8);
    
    this.ctx.fillStyle = '#f39c12';
    this.ctx.beginPath();
    this.ctx.arc(5, 0, 4, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }
  
  drawEnemies() {
    const colors = { basic: '#e74c3c', fast: '#9b59b6', tank: '#e67e22', shooter: '#1abc9c' };
    
    this.gameState.enemies.forEach(enemy => {
      this.ctx.fillStyle = colors[enemy.type];
      this.ctx.beginPath();
      this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
      this.ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 8, enemy.radius * 2, 5);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 8, enemy.radius * 2 * (enemy.health / enemy.maxHealth), 5);
    });
  }
  
  drawBullets() {
    this.gameState.bullets.forEach(bullet => {
      this.ctx.fillStyle = bullet.player ? '#f1c40f' : '#e74c3c';
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
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
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, 10, 120, 60);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    this.ctx.fillText(`Wave: ${this.gameState.wave}`, 20, 50);
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(this.canvas.width - 120, 10, 110, 30);
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(this.canvas.width - 115, 18, 100, 8);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(this.canvas.width - 115, 18, 100 * (this.gameState.health / 100), 8);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('TWIN STICK', this.canvas.width / 2, 25);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
    this.ctx.fillText(`Wave: ${this.gameState.wave}`, this.canvas.width / 2, this.canvas.height / 2 + 80);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.TwinStickShooterGame = TwinStickShooterGame;