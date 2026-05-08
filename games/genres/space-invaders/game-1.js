// Space Invaders Game
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
      level: 1,
      status: 'playing',
      player: null,
      bullets: [],
      enemyBullets: [],
      enemies: [],
      shields: [],
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
      x: 400,
      y: this.canvas.height - 50,
      width: 40,
      height: 30,
      speed: 5
    };
    
    this.createEnemies();
    this.createShields();
    this.gameState.bullets = [];
    this.gameState.enemyBullets = [];
  }
  
  createEnemies() {
    this.gameState.enemies = [];
    
    const rows = 5;
    const cols = 10;
    const enemyWidth = 35;
    const enemyHeight = 25;
    const startX = 100;
    const startY = 80;
    const spacing = 15;
    
    const colors = ['#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#9b59b6'];
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.gameState.enemies.push({
          x: startX + col * (enemyWidth + spacing),
          y: startY + row * (enemyHeight + spacing),
          width: enemyWidth,
          height: enemyHeight,
          color: colors[row],
          points: (rows - row) * 10,
          direction: 1,
          moveTimer: 0
        });
      }
    }
  }
  
  createShields() {
    this.gameState.shields = [];
    
    const shieldPositions = [150, 300, 500, 650];
    
    shieldPositions.forEach(x => {
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
          this.gameState.shields.push({
            x: x + col * 8,
            y: 420 + row * 8,
            width: 8,
            height: 8,
            health: 1
          });
        }
      }
    });
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
    
    this.updatePlayer();
    this.updateBullets();
    this.updateEnemies(deltaTime);
    this.updateEnemyBullets();
    this.checkCollisions();
    this.checkWin();
  }
  
  updatePlayer() {
    const input = this.getPlayerInput(this.players[0]);
    const player = this.gameState.player;
    
    if (input.left) player.x -= player.speed;
    if (input.right) player.x += player.speed;
    
    player.x = Math.max(20, Math.min(this.canvas.width - 20 - player.width, player.x));
  }
  
  shoot() {
    this.gameState.bullets.push({
      x: this.gameState.player.x + this.gameState.player.width / 2 - 3,
      y: this.gameState.player.y,
      width: 6,
      height: 15,
      speed: 8
    });
  }
  
  updateBullets() {
    this.gameState.bullets.forEach(bullet => {
      bullet.y -= bullet.speed;
    });
    
    this.gameState.bullets = this.gameState.bullets.filter(bullet => bullet.y > 0);
  }
  
  updateEnemies(deltaTime) {
    let moveDown = false;
    
    this.gameState.enemies.forEach(enemy => {
      enemy.moveTimer += deltaTime;
      
      if (enemy.moveTimer > 0.5) {
        enemy.x += enemy.direction * 10;
        enemy.moveTimer = 0;
        
        if (enemy.x < 50 || enemy.x > this.canvas.width - 50) {
          moveDown = true;
        }
      }
    });
    
    if (moveDown) {
      this.gameState.enemies.forEach(enemy => {
        enemy.direction *= -1;
        enemy.y += 20;
        
        if (enemy.y > this.gameState.player.y - 50) {
          this.gameOver();
        }
      });
    }
    
    if (Math.random() < 0.02 + this.gameState.level * 0.005) {
      const activeEnemies = this.gameState.enemies;
      if (activeEnemies.length > 0) {
        const shooter = activeEnemies[Math.floor(Math.random() * activeEnemies.length)];
        this.gameState.enemyBullets.push({
          x: shooter.x + shooter.width / 2 - 3,
          y: shooter.y + shooter.height,
          width: 6,
          height: 15,
          speed: 4
        });
      }
    }
  }
  
  updateEnemyBullets() {
    this.gameState.enemyBullets.forEach(bullet => {
      bullet.y += bullet.speed;
    });
    
    this.gameState.enemyBullets = this.gameState.enemyBullets.filter(bullet => bullet.y < this.canvas.height);
  }
  
  checkCollisions() {
    const player = this.gameState.player;
    
    this.gameState.bullets.forEach((bullet, bi) => {
      this.gameState.enemies.forEach((enemy, ei) => {
        if (this.rectCollision(bullet, enemy)) {
          this.gameState.score += enemy.points;
          this.gameState.enemies.splice(ei, 1);
          this.gameState.bullets.splice(bi, 1);
        }
      });
      
      this.gameState.shields.forEach((shield, si) => {
        if (this.rectCollision(bullet, shield)) {
          this.gameState.shields.splice(si, 1);
          this.gameState.bullets.splice(bi, 1);
        }
      });
    });
    
    this.gameState.enemyBullets.forEach((bullet, bi) => {
      if (this.rectCollision(bullet, player)) {
        this.gameState.lives--;
        this.gameState.enemyBullets.splice(bi, 1);
        
        if (this.gameState.lives <= 0) {
          this.gameOver();
        }
      }
      
      this.gameState.shields.forEach((shield, si) => {
        if (this.rectCollision(bullet, shield)) {
          this.gameState.shields.splice(si, 1);
          this.gameState.enemyBullets.splice(bi, 1);
        }
      });
    });
  }
  
  rectCollision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }
  
  checkWin() {
    if (this.gameState.enemies.length === 0) {
      this.gameState.level++;
      this.gameState.score += 500;
      this.createEnemies();
      this.createShields();
    }
  }
  
  gameOver() {
    this.gameState.gameOver = true;
    this.gameState.status = 'gameover';
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (input.action) {
      this.shoot();
    }
  }
  
  render() {
    this.drawBackground();
    this.drawPlayer();
    this.drawEnemies();
    this.drawBullets();
    this.drawEnemyBullets();
    this.drawShields();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (let i = 0; i < 50; i++) {
      this.ctx.beginPath();
      this.ctx.arc(
        (i * 137) % this.canvas.width,
        (i * 89) % this.canvas.height,
        Math.random() * 2,
        0, Math.PI * 2
      );
      this.ctx.fill();
    }
  }
  
  drawPlayer() {
    const player = this.gameState.player;
    
    this.ctx.fillStyle = '#0f0';
    this.ctx.fillRect(player.x, player.y + 10, player.width, player.height - 10);
    this.ctx.fillRect(player.x + 15, player.y, 10, 10);
  }
  
  drawEnemies() {
    this.gameState.enemies.forEach(enemy => {
      this.ctx.fillStyle = enemy.color;
      
      this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(enemy.x + 8, enemy.y + 8, 6, 6);
      this.ctx.fillRect(enemy.x + enemy.width - 14, enemy.y + 8, 6, 6);
      
      this.ctx.fillRect(enemy.x + 5, enemy.y + enemy.height - 8, enemy.width - 10, 4);
    });
  }
  
  drawBullets() {
    this.ctx.fillStyle = '#ff0';
    this.gameState.bullets.forEach(bullet => {
      this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
  }
  
  drawEnemyBullets() {
    this.ctx.fillStyle = '#f00';
    this.gameState.enemyBullets.forEach(bullet => {
      this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
  }
  
  drawShields() {
    this.ctx.fillStyle = '#3498db';
    this.gameState.shields.forEach(shield => {
      this.ctx.fillRect(shield.x, shield.y, shield.width, shield.height);
    });
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 150, 70);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    this.ctx.fillText(`Lives: ${this.gameState.lives}`, 20, 50);
    this.ctx.fillText(`Level: ${this.gameState.level}`, 20, 70);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('SPACE INVADERS', this.canvas.width / 2, 30);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
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

window.SpaceInvadersGame = SpaceInvadersGame;