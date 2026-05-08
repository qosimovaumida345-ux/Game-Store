// Space Invaders - Shooter Game
class SpaceInvadersGame {
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
      lives: 3,
      wave: 1,
      status: 'playing',
      player: null,
      bullets: [],
      enemies: [],
      enemyBullets: [],
      powerups: [],
      particles: [],
      stars: []
    };
    
    this.initStars();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initStars() {
    for (let i = 0; i < 100; i++) {
      this.gameState.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 2 + 0.5
      });
    }
  }
  
  start() {
    const playerName = this.players[0] || 'Player';
    this.gameState.player = {
      name: playerName,
      x: this.canvas.width / 2 - 25,
      y: this.canvas.height - 80,
      width: 50,
      height: 40,
      speed: 8,
      color: '#00ff00',
      shield: 100,
      powerLevel: 1,
      bullets: [],
      lastShot: 0
    };
    
    this.spawnEnemies();
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }
  
  stop() { this.isRunning = false; }
  
  spawnEnemies() {
    this.gameState.enemies = [];
    const rows = 4 + Math.floor(this.gameState.wave / 2);
    const cols = 8;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.gameState.enemies.push({
          x: 50 + c * 70,
          y: 50 + r * 50,
          width: 40,
          height: 30,
          color: r === 0 ? '#ff0000' : r === 1 ? '#ff6600' : r === 2 ? '#ffff00' : '#00ff00',
          type: r,
          alive: true,
          direction: 1,
          moveTimer: 0,
          shootChance: 0.002 + this.gameState.wave * 0.0005
        });
      }
    }
  }
  
  gameLoop(currentTime) {
    if (!this.isRunning) return;
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    this.update(deltaTime);
    this.render();
    requestAnimationFrame((time) => this.gameLoop(time));
  }
  
  update(deltaTime) {
    this.gameState.time += deltaTime;
    
    const player = this.gameState.player;
    if (!player) return;
    
    const input = this.getPlayerInput(player.name);
    
    if (input.left) player.x = Math.max(0, player.x - player.speed);
    if (input.right) player.x = Math.min(this.canvas.width - player.width, player.x + player.speed);
    
    if (input.action && this.gameState.time - player.lastShot > 0.2) {
      this.firePlayerBullet();
      player.lastShot = this.gameState.time;
    }
    
    player.bullets.forEach((b, i) => {
      b.y -= 10;
      if (b.y < 0) player.bullets.splice(i, 1);
    });
    
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      
      enemy.moveTimer += deltaTime;
      if (enemy.moveTimer > 0.5 - this.gameState.wave * 0.02) {
        enemy.x += 20 * enemy.direction;
        enemy.moveTimer = 0;
      }
      
      if (enemy.x < 20 || enemy.x > this.canvas.width - 60) {
        enemy.direction *= -1;
        this.gameState.enemies.forEach(e => e.y += 20);
      }
      
      if (Math.random() < enemy.shootChance) {
        this.gameState.enemyBullets.push({
          x: enemy.x + enemy.width / 2,
          y: enemy.y + enemy.height,
          width: 5,
          height: 15,
          speed: 5,
          color: enemy.color
        });
      }
    });
    
    this.gameState.enemyBullets.forEach((b, i) => {
      b.y += b.speed;
      if (b.y > this.canvas.height) this.gameState.enemyBullets.splice(i, 1);
    });
    
    player.bullets.forEach((pb, pi) => {
      this.gameState.enemies.forEach((enemy, ei) => {
        if (!enemy.alive) return;
        if (pb.x < enemy.x + enemy.width && pb.x + pb.width > enemy.x &&
            pb.y < enemy.y + enemy.height && pb.y + pb.height > enemy.y) {
          enemy.alive = false;
          player.bullets.splice(pi, 1);
          this.gameState.score += (enemy.type + 1) * 10;
          this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color);
        }
      });
    });
    
    this.gameState.enemyBullets.forEach((eb, ei) => {
      if (eb.x < player.x + player.width && eb.x + eb.width > player.x &&
          eb.y < player.y + player.height && eb.y + eb.height > player.y) {
        this.gameState.enemyBullets.splice(ei, 1);
        player.shield -= 20;
        this.createExplosion(player.x + player.width / 2, player.y, '#ff0000');
        
        if (player.shield <= 0) {
          this.gameState.lives--;
          player.shield = 100;
          player.x = this.canvas.width / 2 - 25;
        }
      }
    });
    
    if (this.gameState.enemies.every(e => !e.alive)) {
      this.gameState.wave++;
      this.spawnEnemies();
      this.gameState.score += 100;
    }
    
    if (this.gameState.lives <= 0) {
      this.gameState.status = 'gameover';
    }
    
    this.gameState.stars.forEach(star => {
      star.y += star.speed;
      if (star.y > this.canvas.height) {
        star.y = 0;
        star.x = Math.random() * this.canvas.width;
      }
    });
    
    this.gameState.particles = this.gameState.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime;
      return p.life > 0;
    });
  }
  
  firePlayerBullet() {
    const player = this.gameState.player;
    player.bullets.push({
      x: player.x + player.width / 2 - 3,
      y: player.y,
      width: 6,
      height: 20,
      color: '#00ff00'
    });
  }
  
  createExplosion(x, y, color) {
    for (let i = 0; i < 20; i++) {
      this.gameState.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 0.5,
        color: color,
        size: Math.random() * 5 + 2
      });
    }
  }
  
  getPlayerInput(name) {
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.gameState.stars.forEach(star => {
      this.ctx.fillStyle = '#fff';
      this.ctx.globalAlpha = Math.random() * 0.5 + 0.5;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
    
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      this.ctx.fillStyle = enemy.color;
      this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(enemy.x + 8, enemy.y + 8, 8, 8);
      this.ctx.fillRect(enemy.x + 24, enemy.y + 8, 8, 8);
    });
    
    const player = this.gameState.player;
    if (player) {
      this.ctx.fillStyle = player.color;
      this.ctx.fillRect(player.x, player.y, player.width, player.height);
      this.ctx.fillStyle = '#006600';
      this.ctx.fillRect(player.x + 10, player.y + 10, 30, 20);
      
      player.bullets.forEach(b => {
        this.ctx.fillStyle = b.color;
        this.ctx.fillRect(b.x, b.y, b.width, b.height);
      });
    }
    
    this.gameState.enemyBullets.forEach(b => {
      this.ctx.fillStyle = b.color;
      this.ctx.fillRect(b.x, b.y, b.width, b.height);
    });
    
    this.gameState.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 150, 80);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    this.ctx.fillText(`Wave: ${this.gameState.wave}`, 20, 50);
    this.ctx.fillText(`Lives: ${this.gameState.lives}`, 20, 70);
    
    if (player) {
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(10, this.canvas.height - 30, 200, 15);
      this.ctx.fillStyle = '#00ff00';
      this.ctx.fillRect(10, this.canvas.height - 30, 200 * (player.shield / 100), 15);
    }
    
    if (this.gameState.status === 'gameover') {
      this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#ff0000';
      this.ctx.font = 'bold 60px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '30px Arial';
      this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
      this.ctx.fillText(`Waves: ${this.gameState.wave}`, this.canvas.width / 2, this.canvas.height / 2 + 90);
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.SpaceInvadersGame = SpaceInvadersGame;