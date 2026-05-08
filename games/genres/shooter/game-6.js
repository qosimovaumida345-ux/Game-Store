// Bullet Hell Shooter Game
class BulletHellGame {
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
      power: 1,
      status: 'playing',
      player: null,
      bullets: [],
      enemies: [],
      patterns: [],
      currentPattern: 0,
      patternTimer: 0,
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
      y: this.canvas.height - 80,
      width: 20,
      height: 20,
      speed: 4,
      invulnerable: 0,
      focus: false
    };
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
    
    this.updatePlayer(deltaTime);
    this.updateBullets(deltaTime);
    this.updateEnemies(deltaTime);
    this.checkCollisions();
    this.updatePatterns(deltaTime);
  }
  
  updatePlayer(deltaTime) {
    const input = this.getPlayerInput(this.players[0]);
    const player = this.gameState.player;
    
    const speed = player.focus ? player.speed * 0.5 : player.speed;
    
    if (input.left) player.x -= speed;
    if (input.right) player.x += speed;
    if (input.up) player.y -= speed;
    if (input.down) player.y += speed;
    
    player.x = Math.max(20, Math.min(this.canvas.width - 20, player.x));
    player.y = Math.max(100, Math.min(this.canvas.height - 20, player.y));
    
    if (player.invulnerable > 0) player.invulnerable -= deltaTime;
  }
  
  updateBullets(deltaTime) {
    this.gameState.bullets = this.gameState.bullets.filter(bullet => {
      bullet.x += bullet.vx * deltaTime * 60;
      bullet.y += bullet.vy * deltaTime * 60;
      
      return bullet.x > -20 && bullet.x < this.canvas.width + 20 &&
             bullet.y > -20 && bullet.y < this.canvas.height + 20;
    });
  }
  
  updateEnemies(deltaTime) {
    this.gameState.enemies.forEach(enemy => {
      enemy.x += enemy.vx * deltaTime * 60;
      enemy.y += enemy.vy * deltaTime * 60;
      
      if (enemy.shootTimer > 0) enemy.shootTimer -= deltaTime;
      
      if (enemy.shootTimer <= 0 && enemy.shooting) {
        this.fireEnemyBullet(enemy);
        enemy.shootTimer = enemy.fireRate;
      }
    });
    
    this.gameState.enemies = this.gameState.enemies.filter(e => 
      e.x > -50 && e.x < this.canvas.width + 50 && e.health > 0
    );
  }
  
  fireEnemyBullet(enemy) {
    const player = this.gameState.player;
    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    
    this.gameState.bullets.push({
      x: enemy.x,
      y: enemy.y,
      vx: Math.cos(angle) * 3,
      vy: Math.sin(angle) * 3,
      radius: 5,
      damage: 10,
      enemy: true
    });
  }
  
  updatePatterns(deltaTime) {
    this.gameState.patternTimer += deltaTime;
    
    if (this.gameState.patternTimer > 3) {
      this.gameState.patternTimer = 0;
      this.gameState.currentPattern = (this.gameState.currentPattern + 1) % 4;
      this.executePattern(this.gameState.currentPattern);
    }
  }
  
  executePattern(pattern) {
    const cx = this.canvas.width / 2;
    const cy = 100;
    
    if (pattern === 0) {
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        this.gameState.bullets.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * 3,
          vy: Math.sin(angle) * 3,
          radius: 6,
          damage: 8,
          enemy: true
        });
      }
    } else if (pattern === 1) {
      for (let i = 0; i < 8; i++) {
        this.gameState.enemies.push({
          x: 100 + i * 80,
          y: -30,
          vx: 0,
          vy: 1,
          health: 20,
          radius: 20,
          shooting: true,
          shootTimer: i * 0.3,
          fireRate: 1
        });
      }
    } else if (pattern === 2) {
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI;
        this.gameState.bullets.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * 2.5,
          vy: Math.sin(angle) * 2.5,
          radius: 8,
          damage: 10,
          enemy: true
        });
      }
    } else if (pattern === 3) {
      for (let i = 0; i < 5; i++) {
        this.gameState.enemies.push({
          x: 200 + i * 100,
          y: -30,
          vx: Math.sin(i) * 0.5,
          vy: 1.5,
          health: 30,
          radius: 25,
          shooting: true,
          shootTimer: i * 0.5,
          fireRate: 0.8
        });
      }
    }
  }
  
  checkCollisions() {
    const player = this.gameState.player;
    
    this.gameState.bullets.forEach(bullet => {
      if (bullet.enemy) {
        if (player.invulnerable <= 0) {
          const dx = player.x - bullet.x;
          const dy = player.y - bullet.y;
          const hitRadius = bullet.radius + 10;
          
          if (Math.sqrt(dx * dx + dy * dy) < hitRadius) {
            player.invulnerable = 2;
            this.gameState.lives--;
            
            if (this.gameState.lives <= 0) {
              this.gameState.gameOver = true;
            }
          }
        }
      }
    });
    
    this.gameState.enemies.forEach(enemy => {
      this.gameState.bullets.forEach(bullet => {
        if (!bullet.enemy) {
          const dx = enemy.x - bullet.x;
          const dy = enemy.y - bullet.y;
          
          if (Math.sqrt(dx * dx + dy * dy) < enemy.radius + bullet.radius) {
            enemy.health -= bullet.damage;
            this.gameState.score += 10;
            
            bullet.y = this.canvas.height + 50;
          }
        }
      });
    });
    
    this.gameState.enemies = this.gameState.enemies.filter(e => e.health > 0);
    this.gameState.bullets = this.gameState.bullets.filter(b => b.y < this.canvas.height + 30);
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (input.b) this.gameState.player.focus = true;
    if (!input.b) this.gameState.player.focus = false;
  }
  
  render() {
    this.drawBackground();
    this.drawBullets();
    this.drawEnemies();
    this.drawPlayer();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#0a0a20');
    gradient.addColorStop(1, '#1a1a35');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
    for (let i = 0; i < 30; i++) {
      const x = (i * 73 + this.gameState.time * 5) % this.canvas.width;
      const y = (i * 47) % this.canvas.height;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 2, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  
  drawPlayer() {
    const player = this.gameState.player;
    
    if (player.invulnerable > 0 && Math.floor(this.gameState.time * 20) % 2 === 0) return;
    
    this.ctx.fillStyle = '#3498db';
    this.ctx.beginPath();
    this.ctx.moveTo(player.x, player.y - 15);
    this.ctx.lineTo(player.x - 12, player.y + 10);
    this.ctx.lineTo(player.x + 12, player.y + 10);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.fillStyle = '#f39c12';
    this.ctx.beginPath();
    this.ctx.arc(player.x, player.y + 3, 5, 0, Math.PI * 2);
    this.ctx.fill();
    
    if (player.focus) {
      this.ctx.strokeStyle = '#e74c3c';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(player.x, player.y, 8, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }
  
  drawEnemies() {
    this.gameState.enemies.forEach(enemy => {
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.beginPath();
      this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#c0392b';
      this.ctx.fillRect(enemy.x - enemy.radius/2, enemy.y - enemy.radius/2, enemy.radius, enemy.radius);
    });
  }
  
  drawBullets() {
    this.gameState.bullets.forEach(bullet => {
      if (bullet.enemy) {
        this.ctx.fillStyle = '#e74c3c';
      } else {
        this.ctx.fillStyle = '#f1c40f';
      }
      
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 120, 60);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    this.ctx.fillText(`Lives: ${this.gameState.lives}`, 20, 50);
    
    this.ctx.fillText('Lives:', this.canvas.width - 70, 30);
    for (let i = 0; i < this.gameState.lives; i++) {
      this.ctx.fillStyle = '#3498db';
      this.ctx.beginPath();
      this.ctx.arc(this.canvas.width - 50 + i * 15, 25, 5, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BULLET HELL', this.canvas.width / 2, 25);
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
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.BulletHellGame = BulletHellGame;