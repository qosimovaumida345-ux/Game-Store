// Platformer Adventure Game
class PlatformerAdventureGame {
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
      coins: [],
      enemies: [],
      exit: null,
      camera: { x: 0, y: 0 },
      gameOver: false,
      levelComplete: false
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
      y: 300,
      vx: 0,
      vy: 0,
      width: 30,
      height: 40,
      onGround: false,
      facing: 1
    };
    
    this.generateLevel();
    this.gameState.camera.x = 0;
  }
  
  generateLevel() {
    this.gameState.platforms = [];
    this.gameState.coins = [];
    this.gameState.enemies = [];
    
    this.gameState.platforms.push(
      { x: 0, y: 550, width: 800, height: 50 },
      { x: 200, y: 450, width: 150, height: 20 },
      { x: 450, y: 380, width: 120, height: 20 },
      { x: 100, y: 300, width: 100, height: 20 },
      { x: 650, y: 300, width: 150, height: 20 },
      { x: 300, y: 220, width: 100, height: 20 },
      { x: 500, y: 150, width: 80, height: 20 },
      { x: 100, y: 120, width: 80, height: 20 },
      { x: 750, y: 450, width: 150, height: 20 },
      { x: 900, y: 400, width: 200, height: 20 },
      { x: 1100, y: 300, width: 100, height: 20 },
      { x: 1300, y: 350, width: 150, height: 20 },
      { x: 1500, y: 250, width: 120, height: 20 },
      { x: 1700, y: 200, width: 100, height: 20 },
      { x: 1900, y: 300, width: 200, height: 20 },
      { x: 2000, y: 150, width: 80, height: 20 }
    );
    
    for (let i = 0; i < 20; i++) {
      this.gameState.coins.push({
        x: 100 + Math.random() * 1900,
        y: 100 + Math.random() * 400,
        radius: 10,
        collected: false
      });
    }
    
    this.gameState.enemies = [
      { x: 400, y: 520, vx: 2, width: 30, height: 30, range: 100, startX: 400 },
      { x: 900, y: 370, vx: 1.5, width: 30, height: 30, range: 80, startX: 900 },
      { x: 1400, y: 320, vx: 2, width: 30, height: 30, range: 100, startX: 1400 },
      { x: 2000, y: 270, vx: 1, width: 30, height: 30, range: 50, startX: 2000 }
    ];
    
    this.gameState.exit = { x: 2050, y: 80, width: 40, height: 60 };
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
    if (this.gameState.gameOver || this.gameState.levelComplete) return;
    
    this.gameState.time += deltaTime;
    
    this.updatePlayer(deltaTime);
    this.updateEnemies(deltaTime);
    this.updateCamera();
    this.checkCollisions();
  }
  
  updatePlayer(deltaTime) {
    const player = this.gameState.player;
    const input = this.getPlayerInput(this.players[0]);
    const gravity = 0.8;
    const friction = 0.85;
    
    if (input.left) {
      player.vx -= 1;
      player.facing = -1;
    }
    if (input.right) {
      player.vx += 1;
      player.facing = 1;
    }
    
    player.vx = Math.max(-8, Math.min(8, player.vx));
    player.vx *= friction;
    
    if (input.up && player.onGround) {
      player.vy = -15;
      player.onGround = false;
    }
    
    player.vy += gravity;
    
    player.x += player.vx;
    player.y += player.vy;
    
    player.onGround = false;
    
    this.gameState.platforms.forEach(platform => {
      if (this.checkPlatformCollision(player, platform)) {
        if (player.vy > 0) {
          player.y = platform.y - player.height;
          player.vy = 0;
          player.onGround = true;
        } else if (player.vy < 0) {
          player.y = platform.y + platform.height;
          player.vy = 0;
        }
      }
    });
    
    if (player.y > 700) {
      this.gameState.lives--;
      
      if (this.gameState.lives <= 0) {
        this.gameState.gameOver = true;
      } else {
        player.x = 100;
        player.y = 300;
        player.vx = 0;
        player.vy = 0;
      }
    }
  }
  
  checkPlatformCollision(player, platform) {
    return player.x < platform.x + platform.width &&
           player.x + player.width > platform.x &&
           player.y < platform.y + platform.height &&
           player.y + player.height > platform.y;
  }
  
  updateEnemies(deltaTime) {
    this.gameState.enemies.forEach(enemy => {
      enemy.x += enemy.vx;
      
      if (enemy.x > enemy.startX + enemy.range || enemy.x < enemy.startX - enemy.range) {
        enemy.vx *= -1;
      }
    });
  }
  
  updateCamera() {
    const player = this.gameState.player;
    const targetX = player.x - this.canvas.width / 3;
    
    this.gameState.camera.x += (targetX - this.gameState.camera.x) * 0.1;
    this.gameState.camera.x = Math.max(0, this.gameState.camera.x);
  }
  
  checkCollisions() {
    const player = this.gameState.player;
    
    this.gameState.coins.forEach(coin => {
      if (coin.collected) return;
      
      const dx = player.x + player.width/2 - coin.x;
      const dy = player.y + player.height/2 - coin.y;
      
      if (Math.sqrt(dx*dx + dy*dy) < coin.radius + 20) {
        coin.collected = true;
        this.gameState.score += 50;
        this.gameState.coins++;
      }
    });
    
    this.gameState.enemies.forEach(enemy => {
      if (player.x < enemy.x + enemy.width &&
          player.x + player.width > enemy.x &&
          player.y < enemy.y + enemy.height &&
          player.y + player.height > enemy.y) {
        
        if (player.vy > 0 && player.y + player.height < enemy.y + enemy.height/2) {
          enemy.y = 1000;
          this.gameState.score += 100;
        } else {
          this.gameState.lives--;
          
          if (this.gameState.lives <= 0) {
            this.gameState.gameOver = true;
          } else {
            player.x = 100;
            player.y = 300;
            player.vx = 0;
            player.vy = 0;
          }
        }
      }
    });
    
    const exit = this.gameState.exit;
    if (player.x < exit.x + exit.width &&
        player.x + player.width > exit.x &&
        player.y < exit.y + exit.height &&
        player.y + player.height > exit.y) {
      this.gameState.levelComplete = true;
      this.gameState.score += 1000;
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.drawBackground();
    this.drawPlatforms();
    this.drawCoins();
    this.drawEnemies();
    this.drawExit();
    this.drawPlayer();
    this.drawUI();
    
    if (this.gameState.levelComplete) {
      this.drawLevelComplete();
    }
    
    if (this.gameState.gameOver) {
      this.drawGameOver();
    }
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F7FA');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#6495ED';
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width - 100, 80, 40, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  drawPlatforms() {
    this.ctx.fillStyle = '#8B4513';
    
    this.gameState.platforms.forEach(platform => {
      const x = platform.x - this.gameState.camera.x;
      
      this.ctx.fillRect(x, platform.y, platform.width, platform.height);
      
      this.ctx.fillStyle = '#228B22';
      this.ctx.fillRect(x, platform.y, platform.width, 8);
      this.ctx.fillStyle = '#8B4513';
    });
  }
  
  drawCoins() {
    this.ctx.fillStyle = '#FFD700';
    
    this.gameState.coins.forEach(coin => {
      if (coin.collected) return;
      
      const x = coin.x - this.gameState.camera.x;
      
      this.ctx.beginPath();
      this.ctx.arc(x, coin.y, coin.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.strokeStyle = '#FFA500';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(x, coin.y, coin.radius, 0, Math.PI * 2);
      this.ctx.stroke();
    });
  }
  
  drawEnemies() {
    this.ctx.fillStyle = '#e74c3c';
    
    this.gameState.enemies.forEach(enemy => {
      const x = enemy.x - this.gameState.camera.x;
      
      this.ctx.beginPath();
      this.ctx.arc(x + enemy.width/2, enemy.y + enemy.height/2, enemy.width/2, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.beginPath();
      this.ctx.arc(x + 10, enemy.y + 10, 4, 0, Math.PI * 2);
      this.ctx.arc(x + 20, enemy.y + 10, 4, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#e74c3c';
    });
  }
  
  drawExit() {
    const exit = this.gameState.exit;
    const x = exit.x - this.gameState.camera.x;
    
    this.ctx.fillStyle = '#4CAF50';
    this.ctx.fillRect(x, exit.y, exit.width, exit.height);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(x + 10, exit.y, exit.width - 20, exit.height - 20);
  }
  
  drawPlayer() {
    const player = this.gameState.player;
    const x = player.x - this.gameState.camera.x;
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(x, player.y, player.width, player.height);
    
    this.ctx.fillStyle = '#f5d0c5';
    this.ctx.fillRect(x + 5, player.y + 5, 20, 15);
    
    this.ctx.fillStyle = '#333';
    this.ctx.beginPath();
    this.ctx.arc(x + 10, player.y + 12, 3, 0, Math.PI * 2);
    this.ctx.arc(x + 20, player.y + 12, 3, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 130, 70);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    this.ctx.fillText(`Coins: ${this.gameState.coins}`, 20, 50);
    this.ctx.fillText(`Lives: ${this.gameState.lives}`, 20, 70);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PLATFORMER', this.canvas.width / 2, 30);
  }
  
  drawLevelComplete() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('LEVEL COMPLETE!', this.canvas.width / 2, this.canvas.height / 2);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.PlatformerAdventureGame = PlatformerAdventureGame;