// Super Mario Style Platformer
class MarioStyleGame {
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
      coins: 0,
      lives: 3,
      status: 'playing',
      player: null,
      platforms: [],
      enemies: [],
      coins: [],
      powerups: [],
      particles: [],
      camera: { x: 0, y: 0 },
      world: { width: 3000, height: 600 },
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
      x: 100,
      y: 400,
      vx: 0,
      vy: 0,
      width: 32,
      height: 32,
      speed: 5,
      jumpForce: 12,
      grounded: false,
      facing: 1,
      big: false,
      invulnerable: 0,
      state: 'idle'
    };
    
    this.generateLevel();
  }
  
  generateLevel() {
    this.gameState.platforms = [
      { x: 0, y: 550, width: 500, height: 50 },
      { x: 200, y: 420, width: 100, height: 20 },
      { x: 400, y: 350, width: 150, height: 20 },
      { x: 350, y: 500, width: 80, height: 20 },
      { x: 600, y: 550, width: 300, height: 50 },
      { x: 700, y: 400, width: 100, height: 20 },
      { x: 900, y: 320, width: 120, height: 20 },
      { x: 1100, y: 250, width: 100, height: 20 },
      { x: 1050, y: 550, width: 400, height: 50 },
      { x: 1300, y: 450, width: 80, height: 20 },
      { x: 1400, y: 380, width: 80, height: 20 },
      { x: 1500, y: 300, width: 150, height: 20 },
      { x: 1750, y: 550, width: 300, height: 50 },
      { x: 1800, y: 420, width: 100, height: 20 },
      { x: 2000, y: 350, width: 120, height: 20 },
      { x: 2200, y: 280, width: 100, height: 20 },
      { x: 2150, y: 550, width: 200, height: 50 },
      { x: 2400, y: 500, width: 150, height: 20 },
      { x: 2600, y: 450, width: 100, height: 20 },
      { x: 2800, y: 550, width: 200, height: 50 }
    ];
    
    this.gameState.enemies = [
      { x: 700, y: 520, vx: 1, width: 30, height: 30, type: 'goomba', health: 1 },
      { x: 1200, y: 520, vx: -1, width: 30, height: 30, type: 'goomba', health: 1 },
      { x: 1850, y: 390, vx: 1, width: 30, height: 30, type: 'goomba', health: 1 },
      { x: 2300, y: 250, vx: -1, width: 30, height: 30, type: 'goomba', health: 1 }
    ];
    
    const coinPositions = [
      { x: 240, y: 380 }, { x: 450, y: 310 }, { x: 740, y: 360 },
      { x: 950, y: 280 }, { x: 1340, y: 410 }, { x: 1540, y: 260 },
      { x: 2040, y: 310 }, { x: 2440, y: 460 }
    ];
    
    coinPositions.forEach(pos => {
      this.gameState.coins.push({
        x: pos.x,
        y: pos.y,
        width: 20,
        height: 20,
        collected: false,
        animOffset: Math.random() * Math.PI * 2
      });
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
    
    this.updatePlayer(deltaTime);
    this.updateEnemies(deltaTime);
    this.updateCoins(deltaTime);
    this.checkCollisions();
    this.updateCamera();
    this.updateParticles(deltaTime);
    
    if (this.gameState.player.y > this.gameState.world.height + 50) {
      this.playerDies();
    }
  }
  
  updatePlayer(deltaTime) {
    const input = this.getPlayerInput(this.players[0]);
    const player = this.gameState.player;
    
    if (input.left) {
      player.vx = -player.speed;
      player.facing = -1;
      player.state = 'walking';
    } else if (input.right) {
      player.vx = player.speed;
      player.facing = 1;
      player.state = 'walking';
    } else {
      player.vx = 0;
      if (player.grounded) player.state = 'idle';
    }
    
    if (input.up && player.grounded) {
      player.vy = -player.jumpForce;
      player.grounded = false;
      player.state = 'jumping';
      this.createParticles(player.x, player.y + player.height, '#fff', 5);
    }
    
    player.vy += 0.6;
    
    player.x += player.vx;
    player.y += player.vy;
    
    player.x = Math.max(20, Math.min(this.gameState.world.width - 20, player.x));
    
    this.checkPlatformCollisions(player);
    
    if (player.invulnerable > 0) player.invulnerable -= deltaTime;
  }
  
  checkPlatformCollisions(player) {
    player.grounded = false;
    
    this.gameState.platforms.forEach(platform => {
      if (player.x + player.width/2 > platform.x &&
          player.x - player.width/2 < platform.x + platform.width &&
          player.y + player.height > platform.y &&
          player.y + player.height < platform.y + platform.height + 20 &&
          player.vy >= 0) {
        
        player.y = platform.y - player.height;
        player.vy = 0;
        player.grounded = true;
        
        if (player.state === 'jumping') player.state = 'idle';
      }
    });
  }
  
  updateEnemies(deltaTime) {
    const player = this.gameState.player;
    
    this.gameState.enemies.forEach(enemy => {
      enemy.x += enemy.vx;
      
      if (enemy.x < 0 || enemy.x > this.gameState.world.width) {
        enemy.vx *= -1;
      }
      
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 35 && player.invulnerable <= 0) {
        if (player.vy > 0 && player.y < enemy.y) {
          enemy.health = 0;
          player.vy = -8;
          this.gameState.score += 100;
          this.createParticles(enemy.x, enemy.y, '#e74c3c', 10);
        } else {
          this.playerDies();
        }
      }
    });
    
    this.gameState.enemies = this.gameState.enemies.filter(e => e.health > 0);
  }
  
  updateCoins(deltaTime) {
    const player = this.gameState.player;
    
    this.gameState.coins.forEach(coin => {
      if (coin.collected) return;
      
      coin.y = coin.y + Math.sin(this.gameState.time * 3 + coin.animOffset) * 0.5;
      
      const dx = player.x - coin.x;
      const dy = player.y - coin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 30) {
        coin.collected = true;
        this.gameState.score += 50;
        this.gameState.coins++;
        this.createParticles(coin.x, coin.y, '#f1c40f', 5);
      }
    });
  }
  
  checkCollisions() {}
  
  playerDies() {
    this.gameState.lives--;
    
    if (this.gameState.lives <= 0) {
      this.gameState.gameOver = true;
    } else {
      this.gameState.player.x = 100;
      this.gameState.player.y = 400;
      this.gameState.player.vx = 0;
      this.gameState.player.vy = 0;
      this.gameState.player.invulnerable = 2;
    }
  }
  
  createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      this.gameState.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 2,
        life: 1,
        color,
        size: 3 + Math.random() * 3
      });
    }
  }
  
  updateParticles(deltaTime) {
    this.gameState.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 3 * deltaTime;
      p.life -= deltaTime * 2;
    });
    this.gameState.particles = this.gameState.particles.filter(p => p.life > 0);
  }
  
  updateCamera() {
    const player = this.gameState.player;
    const targetX = player.x - this.canvas.width / 3;
    
    this.gameState.camera.x += (targetX - this.gameState.camera.x) * 0.1;
    this.gameState.camera.x = Math.max(0, Math.min(this.gameState.world.width - this.canvas.width, this.gameState.camera.x));
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.drawBackground();
    this.drawPlatforms();
    this.drawCoins();
    this.drawEnemies();
    this.drawPlayer();
    this.drawParticles();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1e90ff');
    gradient.addColorStop(0.5, '#87ceeb');
    gradient.addColorStop(1, '#90ee90');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const cam = this.gameState.camera.x;
    
    this.ctx.fillStyle = '#228b22';
    this.ctx.fillRect(-cam * 0.5, 200, 600, 150);
    this.ctx.fillRect(400 - cam * 0.3, 150, 400, 200);
    this.ctx.fillRect(900 - cam * 0.4, 180, 350, 170);
    this.ctx.fillRect(1500 - cam * 0.2, 160, 500, 190);
    
    this.ctx.fillStyle = '#f5f5dc';
    this.ctx.fillRect(100 - cam * 0.1, 250, 80, 100);
    this.ctx.fillRect(95 - cam * 0.1, 200, 90, 50);
    this.ctx.fillStyle = '#8b4513';
    this.ctx.fillRect(130 - cam * 0.1, 210, 20, 40);
  }
  
  drawPlatforms() {
    const cam = this.gameState.camera.x;
    
    this.gameState.platforms.forEach(platform => {
      this.ctx.fillStyle = '#8b4513';
      this.ctx.fillRect(platform.x - cam, platform.y, platform.width, platform.height);
      
      this.ctx.fillStyle = '#228b22';
      this.ctx.fillRect(platform.x - cam, platform.y, platform.width, 8);
      
      this.ctx.fillStyle = '#90ee90';
      for (let i = 0; i < platform.width; i += 20) {
        if (i % 40 === 0) {
          this.ctx.beginPath();
          this.ctx.arc(platform.x - cam + i + 10, platform.y, 5, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    });
  }
  
  drawCoins() {
    const cam = this.gameState.camera.x;
    
    this.gameState.coins.forEach(coin => {
      if (coin.collected) return;
      
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.beginPath();
      this.ctx.arc(coin.x - cam, coin.y, 10, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 8px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('$', coin.x - cam, coin.y + 3);
    });
  }
  
  drawEnemies() {
    const cam = this.gameState.camera.x;
    
    this.gameState.enemies.forEach(enemy => {
      this.ctx.fillStyle = '#8b4513';
      this.ctx.beginPath();
      this.ctx.arc(enemy.x - cam, enemy.y + 10, 15, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#d2691e';
      this.ctx.fillRect(enemy.x - 15 - cam, enemy.y, 30, 15);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.beginPath();
      this.ctx.arc(enemy.x - 5 - cam, enemy.y + 5, 4, 0, Math.PI * 2);
      this.ctx.arc(enemy.x + 5 - cam, enemy.y + 5, 4, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#000';
      this.ctx.beginPath();
      this.ctx.arc(enemy.x - 5 - cam, enemy.y + 5, 2, 0, Math.PI * 2);
      this.ctx.arc(enemy.x + 5 - cam, enemy.y + 5, 2, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawPlayer() {
    const player = this.gameState.player;
    const cam = this.gameState.camera.x;
    const screenX = player.x - cam;
    
    if (player.invulnerable > 0 && Math.floor(this.gameState.time * 15) % 2 === 0) return;
    
    this.ctx.save();
    this.ctx.translate(screenX, player.y);
    this.ctx.scale(player.facing, 1);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(-12, 0, 24, 24);
    
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillRect(-10, 0, 8, 12);
    
    this.ctx.fillStyle = '#f5d0c5';
    this.ctx.beginPath();
    this.ctx.arc(0, -6, 8, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(-4, -8, 4, 4);
    this.ctx.fillRect(2, -8, 4, 4);
    
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(-4, -7, 2, 2);
    this.ctx.fillRect(2, -7, 2, 2);
    
    this.ctx.fillStyle = '#8b4513';
    this.ctx.fillRect(-12, 22, 8, 10);
    this.ctx.fillRect(4, 22, 8, 10);
    
    this.ctx.restore();
  }
  
  drawParticles() {
    const cam = this.gameState.camera.x;
    
    this.gameState.particles.forEach(p => {
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x - cam, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 140, 60);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    this.ctx.fillText(`Coins: ${this.gameState.coins}`, 20, 50);
    
    this.ctx.fillText('Lives:', this.canvas.width - 70, 30);
    for (let i = 0; i < this.gameState.lives; i++) {
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.beginPath();
      this.ctx.arc(this.canvas.width - 50 + i * 15, 25, 6, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('SUPER PLATFORMER', this.canvas.width / 2, 25);
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
  }
}

window.MarioStyleGame = MarioStyleGame;