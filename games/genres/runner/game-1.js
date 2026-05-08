// Endless Runner Game
class EndlessRunnerGame {
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
      distance: 0,
      speed: 6,
      status: 'playing',
      player: null,
      obstacles: [],
      coins: [],
      groundY: 500,
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
      y: this.gameState.groundY - 60,
      vy: 0,
      width: 40,
      height: 60,
      jumping: false,
      doubleJump: false,
      slide: false,
      slideTimer: 0
    };
    
    this.gameState.obstacles = [];
    this.gameState.coins = [];
    this.gameState.score = 0;
    this.gameState.distance = 0;
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
    this.gameState.distance += this.gameState.speed;
    this.gameState.score = Math.floor(this.gameState.distance / 10);
    this.gameState.speed = 6 + this.gameState.score / 500;
    
    this.updatePlayer(deltaTime);
    this.updateObstacles(deltaTime);
    this.updateCoins(deltaTime);
    this.checkCollisions();
    this.spawnObjects();
  }
  
  updatePlayer(deltaTime) {
    const player = this.gameState.player;
    const input = this.getPlayerInput(this.players[0]);
    
    if (input.up && !player.jumping) {
      player.vy = -15;
      player.jumping = true;
      player.doubleJump = true;
    } else if (input.up && player.doubleJump && player.jumping) {
      player.vy = -12;
      player.doubleJump = false;
    }
    
    if (input.down && !player.jumping) {
      player.slide = true;
      player.slideTimer = 0.8;
      player.height = 30;
    }
    
    if (player.slide) {
      player.slideTimer -= deltaTime;
      if (player.slideTimer <= 0) {
        player.slide = false;
        player.height = 60;
      }
    }
    
    player.vy += 0.8;
    player.y += player.vy;
    
    if (player.y > this.gameState.groundY - player.height) {
      player.y = this.gameState.groundY - player.height;
      player.vy = 0;
      player.jumping = false;
    }
  }
  
  updateObstacles(deltaTime) {
    this.gameState.obstacles.forEach(obs => {
      obs.x -= this.gameState.speed;
    });
    
    this.gameState.obstacles = this.gameState.obstacles.filter(obs => obs.x > -100);
  }
  
  updateCoins(deltaTime) {
    this.gameState.coins.forEach(coin => {
      coin.x -= this.gameState.speed;
      coin.rotation += 0.1;
    });
    
    this.gameState.coins = this.gameState.coins.filter(coin => coin.x > -50);
  }
  
  spawnObjects() {
    if (Math.random() < 0.02) {
      const type = Math.random() < 0.3 ? 'tall' : 'short';
      const height = type === 'tall' ? 50 : 30;
      
      this.gameState.obstacles.push({
        x: this.canvas.width + 50,
        y: this.gameState.groundY - height,
        width: 30,
        height: height,
        type: type
      });
    }
    
    if (Math.random() < 0.03) {
      this.gameState.coins.push({
        x: this.canvas.width + 50,
        y: this.gameState.groundY - 80 - Math.random() * 60,
        radius: 12,
        rotation: 0
      });
    }
  }
  
  checkCollisions() {
    const player = this.gameState.player;
    
    this.gameState.obstacles.forEach(obs => {
      if (player.x < obs.x + obs.width &&
          player.x + player.width > obs.x &&
          player.y < obs.y + obs.height &&
          player.y + player.height > obs.y) {
        this.gameState.gameOver = true;
      }
    });
    
    this.gameState.coins = this.gameState.coins.filter(coin => {
      const dx = player.x + player.width/2 - coin.x;
      const dy = player.y + player.height/2 - coin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < coin.radius + 20) {
        this.gameState.score += 10;
        return false;
      }
      return true;
    });
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.drawBackground();
    this.drawGround();
    this.drawPlayer();
    this.drawObstacles();
    this.drawCoins();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F7FA');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
    this.ctx.beginPath();
    this.ctx.arc(100, 80, 40, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  drawGround() {
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(0, this.gameState.groundY, this.canvas.width, 100);
    
    this.ctx.strokeStyle = '#654321';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.gameState.groundY);
    this.ctx.lineTo(this.canvas.width, this.gameState.groundY);
    this.ctx.stroke();
  }
  
  drawPlayer() {
    const player = this.gameState.player;
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(player.x, player.y, player.width, player.height);
    
    this.ctx.fillStyle = '#f5d0c5';
    this.ctx.beginPath();
    this.ctx.arc(player.x + player.width/2, player.y + 10, 12, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(player.x + 5, player.y + 8, 8, 4);
    this.ctx.fillRect(player.x + player.width - 13, player.y + 8, 8, 4);
    
    if (player.slide) {
      this.ctx.fillStyle = '#3498db';
      this.ctx.fillRect(player.x, player.y + player.height - 10, player.width + 10, 10);
    }
  }
  
  drawObstacles() {
    this.gameState.obstacles.forEach(obs => {
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(obs.x + 2, obs.y + 2, 4, obs.height - 4);
      this.ctx.fillRect(obs.x + obs.width - 6, obs.y + 2, 4, obs.height - 4);
    });
  }
  
  drawCoins() {
    this.gameState.coins.forEach(coin => {
      this.ctx.fillStyle = '#ffd700';
      this.ctx.beginPath();
      this.ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.strokeStyle = '#ffea00';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(coin.x, coin.y, coin.radius - 2, 0, Math.PI * 2);
      this.ctx.stroke();
    });
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 120, 60);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 35);
    this.ctx.fillText(`Speed: ${this.gameState.speed.toFixed(1)}`, 20, 60);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('ENDLESS RUNNER', this.canvas.width / 2, 30);
    
    this.ctx.fillStyle = '#4ecdc4';
    this.ctx.font = '12px Arial';
    this.ctx.fillText('UP: Jump | DOWN: Slide', this.canvas.width / 2, this.canvas.height - 20);
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
  }
}

window.EndlessRunnerGame = EndlessRunnerGame;