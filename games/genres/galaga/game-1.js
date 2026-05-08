// Galaga Style Shooter Game
class GalagaShooterGame {
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
      enemies: [],
      enemyBullets: [],
      enemyFormation: [],
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
      y: this.canvas.height - 80,
      width: 30,
      height: 30,
      speed: 5,
      invincible: false,
      invincibleTimer: 0
    };
    
    this.createEnemyFormation();
    this.gameState.bullets = [];
    this.gameState.enemyBullets = [];
  }
  
  createEnemyFormation() {
    this.gameState.enemies = [];
    
    const rows = 4;
    const cols = 8;
    const startX = 150;
    const startY = 60;
    const spacingX = 60;
    const spacingY = 50;
    
    const types = [
      { color: '#e74c3c', points: 50, pattern: 'butterfly' },
      { color: '#3498db', points: 80, pattern: 'bee' },
      { color: '#2ecc71', points: 100, pattern: 'boss' }
    ];
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const type = types[row % types.length];
        
        this.gameState.enemies.push({
          x: startX + col * spacingX,
          y: startY + row * spacingY,
          width: 25,
          height: 25,
          color: type.color,
          points: type.points,
          pattern: type.pattern,
          alive: true,
          phase: 0,
          baseX: startX + col * spacingX,
          baseY: startY + row * spacingY
        });
      }
    }
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
    this.checkLevelComplete();
    
    if (this.gameState.player.invincible) {
      this.gameState.player.invincibleTimer -= deltaTime;
      if (this.gameState.player.invincibleTimer <= 0) {
        this.gameState.player.invincible = false;
      }
    }
  }
  
  updatePlayer() {
    const input = this.getPlayerInput(this.players[0]);
    const player = this.gameState.player;
    
    if (input.left) player.x -= player.speed;
    if (input.right) player.x += player.speed;
    if (input.up) player.y -= player.speed;
    if (input.down) player.y += player.speed;
    
    player.x = Math.max(20, Math.min(this.canvas.width - 20 - player.width, player.x));
    player.y = Math.max(100, Math.min(this.canvas.height - 20 - player.height, player.y));
  }
  
  shoot() {
    this.gameState.bullets.push({
      x: this.gameState.player.x + this.gameState.player.width / 2 - 3,
      y: this.gameState.player.y,
      width: 6,
      height: 15,
      speed: 10,
      type: 'player'
    });
  }
  
  updateBullets() {
    this.gameState.bullets.forEach(bullet => {
      bullet.y -= bullet.speed;
    });
    
    this.gameState.bullets = this.gameState.bullets.filter(bullet => bullet.y > 0);
  }
  
  updateEnemies(deltaTime) {
    const time = this.gameState.time;
    
    this.gameState.enemies.forEach((enemy, i) => {
      if (!enemy.alive) return;
      
      enemy.phase += deltaTime;
      
      enemy.x = enemy.baseX + Math.sin(enemy.phase * 2) * 20;
      enemy.y = enemy.baseY + Math.cos(enemy.phase * 1.5) * 10;
      
      if (Math.random() < 0.005 + this.gameState.level * 0.002) {
        this.gameState.enemyBullets.push({
          x: enemy.x + enemy.width / 2 - 3,
          y: enemy.y + enemy.height,
          width: 6,
          height: 12,
          speed: 5,
          color: enemy.color
        });
      }
    });
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
        if (!enemy.alive) return;
        
        if (this.rectCollision(bullet, enemy)) {
          enemy.alive = false;
          this.gameState.score += enemy.points;
          this.gameState.bullets.splice(bi, 1);
        }
      });
    });
    
    if (!player.invincible) {
      this.gameState.enemyBullets.forEach((bullet, bi) => {
        if (this.rectCollision(bullet, player)) {
          this.gameState.lives--;
          this.gameState.enemyBullets.splice(bi, 1);
          player.invincible = true;
          player.invincibleTimer = 3;
          
          if (this.gameState.lives <= 0) {
            this.gameState.gameOver = true;
          }
        }
      });
    }
  }
  
  rectCollision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }
  
  checkLevelComplete() {
    if (this.gameState.enemies.every(e => !e.alive)) {
      this.gameState.level++;
      this.gameState.score += 1000;
      this.createEnemyFormation();
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (input.action) this.shoot();
  }
  
  render() {
    this.drawBackground();
    this.drawPlayer();
    this.drawEnemies();
    this.drawBullets();
    this.drawEnemyBullets();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    for (let y = 0; y < this.canvas.height; y += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
    for (let x = 0; x < this.canvas.width; x += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
  }
  
  drawPlayer() {
    const player = this.gameState.player;
    
    if (player.invincible && Math.floor(this.gameState.time * 10) % 2 === 0) return;
    
    this.ctx.fillStyle = '#0f0';
    this.ctx.beginPath();
    this.ctx.moveTo(player.x + player.width / 2, player.y);
    this.ctx.lineTo(player.x + player.width, player.y + player.height);
    this.ctx.lineTo(player.x + player.width / 2, player.y + player.height - 10);
    this.ctx.lineTo(player.x, player.y + player.height);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(player.x + 8, player.y + 5, 6, 6);
    this.ctx.fillRect(player.x + player.width - 14, player.y + 5, 6, 6);
  }
  
  drawEnemies() {
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      
      this.ctx.fillStyle = enemy.color;
      
      if (enemy.pattern === 'butterfly') {
        this.ctx.beginPath();
        this.ctx.moveTo(enemy.x + enemy.width / 2, enemy.y);
        this.ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height / 2);
        this.ctx.lineTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
        this.ctx.lineTo(enemy.x, enemy.y + enemy.height / 2);
        this.ctx.closePath();
        this.ctx.fill();
      } else if (enemy.pattern === 'bee') {
        this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(enemy.x + 5, enemy.y + 5, enemy.width - 10, 5);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width / 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }
  
  drawBullets() {
    this.ctx.fillStyle = '#ff0';
    this.gameState.bullets.forEach(bullet => {
      this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
  }
  
  drawEnemyBullets() {
    this.gameState.enemyBullets.forEach(bullet => {
      this.ctx.fillStyle = bullet.color || '#f00';
      this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
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
    this.ctx.fillText('GALAGA', this.canvas.width / 2, 30);
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

window.GalagaShooterGame = GalagaShooterGame;