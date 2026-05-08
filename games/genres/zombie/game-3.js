// Zombie Survival Game
class ZombieSurvivalGame {
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
      ammo: 30,
      health: 100,
      status: 'playing',
      player: null,
      bullets: [],
      zombies: [],
      pickups: [],
      particles: [],
      reloadTimer: 0,
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
      angle: 0,
      speed: 3
    };
    
    this.gameState.zombies = [];
    this.gameState.bullets = [];
    this.gameState.pickups = [];
    this.gameState.particles = [];
  }
  
  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
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
    
    if (this.gameState.reloadTimer > 0) {
      this.gameState.reloadTimer -= deltaTime;
    }
    
    this.updatePlayer();
    this.updateBullets();
    this.updateZombies(deltaTime);
    this.updatePickups();
    this.updateParticles();
    this.spawnZombies();
    this.checkCollisions();
  }
  
  updatePlayer() {
    const input = this.getPlayerInput(this.players[0]);
    const player = this.gameState.player;
    
    if (input.left) player.x -= player.speed;
    if (input.right) player.x += player.speed;
    if (input.up) player.y -= player.speed;
    if (input.down) player.y += player.speed;
    
    player.x = Math.max(player.radius, Math.min(this.canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(this.canvas.height - player.radius, player.y));
    
    const dx = input.left ? -1 : (input.right ? 1 : 0);
    const dy = input.up ? -1 : (input.down ? 1 : 0);
    
    if (dx !== 0 || dy !== 0) {
      player.angle = Math.atan2(dy, dx);
    }
  }
  
  shoot() {
    if (this.gameState.ammo <= 0 || this.gameState.reloadTimer > 0) return;
    
    const player = this.gameState.player;
    
    this.gameState.bullets.push({
      x: player.x + Math.cos(player.angle) * 20,
      y: player.y + Math.sin(player.angle) * 20,
      vx: Math.cos(player.angle) * 15,
      vy: Math.sin(player.angle) * 15,
      radius: 4
    });
    
    this.gameState.ammo--;
    this.gameState.score -= 1;
  }
  
  reload() {
    this.gameState.reloadTimer = 2;
    this.gameState.ammo = 30;
  }
  
  updateBullets() {
    this.gameState.bullets.forEach(bullet => {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
    });
    
    this.gameState.bullets = this.gameState.bullets.filter(bullet => 
      bullet.x > 0 && bullet.x < this.canvas.width &&
      bullet.y > 0 && bullet.y < this.canvas.height
    );
  }
  
  spawnZombies() {
    if (this.gameState.zombies.length < 5 + this.gameState.wave * 2) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 400 + Math.random() * 100;
      
      this.gameState.zombies.push({
        x: this.canvas.width / 2 + Math.cos(angle) * dist,
        y: this.canvas.height / 2 + Math.sin(angle) * dist,
        radius: 12,
        speed: 1 + Math.random() * 1.5,
        health: 2 + Math.floor(this.gameState.wave / 2),
        angle: 0
      });
    }
  }
  
  updateZombies(deltaTime) {
    const player = this.gameState.player;
    
    this.gameState.zombies.forEach(zombie => {
      const dx = player.x - zombie.x;
      const dy = player.y - zombie.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      zombie.angle = Math.atan2(dy, dx);
      zombie.x += Math.cos(zombie.angle) * zombie.speed;
      zombie.y += Math.sin(zombie.angle) * zombie.speed;
      
      if (Math.random() < 0.02) {
        this.createParticles(zombie.x, zombie.y, '#27ae60', 1);
      }
    });
  }
  
  updatePickups() {
    this.gameState.pickups = this.gameState.pickups.filter(pickup => {
      const player = this.gameState.player;
      const dx = player.x - pickup.x;
      const dy = player.y - pickup.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < player.radius + pickup.radius) {
        if (pickup.type === 'ammo') {
          this.gameState.ammo += 15;
        } else if (pickup.type === 'health') {
          this.gameState.health = Math.min(100, this.gameState.health + 25);
        }
        return false;
      }
      return true;
    });
  }
  
  updateParticles() {
    this.gameState.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.03;
    });
    
    this.gameState.particles = this.gameState.particles.filter(p => p.life > 0);
  }
  
  createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      this.gameState.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        radius: Math.random() * 3 + 2,
        color: color,
        life: 1
      });
    }
  }
  
  checkCollisions() {
    const player = this.gameState.player;
    
    this.gameState.bullets.forEach((bullet, bi) => {
      this.gameState.zombies.forEach((zombie, zi) => {
        const dx = bullet.x - zombie.x;
        const dy = bullet.y - zombie.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < bullet.radius + zombie.radius) {
          zombie.health--;
          this.gameState.bullets.splice(bi, 1);
          this.createParticles(zombie.x, zombie.y, '#e74c3c', 3);
          
          if (zombie.health <= 0) {
            this.gameState.zombies.splice(zi, 1);
            this.gameState.score += 50;
            this.createParticles(zombie.x, zombie.y, '#8e44ad', 8);
            
            if (Math.random() < 0.3) {
              this.gameState.pickups.push({
                x: zombie.x,
                y: zombie.y,
                radius: 10,
                type: Math.random() < 0.7 ? 'ammo' : 'health'
              });
            }
          }
        }
      });
    });
    
    this.gameState.zombies.forEach(zombie => {
      const dx = player.x - zombie.x;
      const dy = player.y - zombie.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < player.radius + zombie.radius) {
        this.gameState.health -= 1;
        
        if (this.gameState.health <= 0) {
          this.gameState.gameOver = true;
        }
      }
    });
    
    if (this.gameState.zombies.length === 0 && this.gameState.wave < 10) {
      this.gameState.wave++;
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (input.action) this.shoot();
    if (input.b) this.reload();
  }
  
  render() {
    this.drawBackground();
    this.drawPickups();
    this.drawZombies();
    this.drawBullets();
    this.drawPlayer();
    this.drawParticles();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    const gradient = this.ctx.createRadialGradient(400, 300, 0, 400, 300, 500);
    gradient.addColorStop(0, '#2c3e50');
    gradient.addColorStop(1, '#1a252f');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawPickups() {
    this.gameState.pickups.forEach(pickup => {
      this.ctx.fillStyle = pickup.type === 'ammo' ? '#f39c12' : '#e74c3c';
      this.ctx.beginPath();
      this.ctx.arc(pickup.x, pickup.y, pickup.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(pickup.type === 'ammo' ? 'A' : 'H', pickup.x, pickup.y + 4);
    });
  }
  
  drawZombies() {
    this.gameState.zombies.forEach(zombie => {
      this.ctx.save();
      this.ctx.translate(zombie.x, zombie.y);
      this.ctx.rotate(zombie.angle);
      
      this.ctx.fillStyle = '#27ae60';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, zombie.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#1e8449';
      this.ctx.beginPath();
      this.ctx.arc(-3, -3, 6, 0, Math.PI * 2);
      this.ctx.arc(3, -3, 6, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#c0392b';
      this.ctx.beginPath();
      this.ctx.moveTo(-8, 5);
      this.ctx.lineTo(0, 10);
      this.ctx.lineTo(8, 5);
      this.ctx.closePath();
      this.ctx.fill();
      
      this.ctx.restore();
    });
  }
  
  drawBullets() {
    this.ctx.fillStyle = '#ffff00';
    this.gameState.bullets.forEach(bullet => {
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
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
    this.ctx.fillRect(10, -3, 15, 6);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(5, -4, 3, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }
  
  drawParticles() {
    this.gameState.particles.forEach(p => {
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 140, 80);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    this.ctx.fillText(`Wave: ${this.gameState.wave}`, 20, 50);
    
    this.ctx.fillStyle = this.gameState.ammo > 0 ? '#f39c12' : '#e74c3c';
    this.ctx.fillText(`Ammo: ${this.gameState.ammo}`, 20, 70);
    
    this.ctx.fillStyle = 'rgba(231, 76, 60, 0.5)';
    this.ctx.fillRect(this.canvas.width - 110, 10, 100, 15);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(this.canvas.width - 110, 10, 100 * (this.gameState.health / 100), 15);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('Health', this.canvas.width - 115, 22);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('ZOMBIE SURVIVAL', this.canvas.width / 2, 30);
    
    if (this.gameState.reloadTimer > 0) {
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.font = '14px Arial';
      this.ctx.fillText('RELOADING...', this.canvas.width / 2, this.canvas.height - 15);
    }
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('YOU DIED', this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
    this.ctx.fillText(`Wave: ${this.gameState.wave}`, this.canvas.width / 2, this.canvas.height / 2 + 70);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.ZombieSurvivalGame = ZombieSurvivalGame;