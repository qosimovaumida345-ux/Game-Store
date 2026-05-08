// Game Framework Base - Barcha o'yinlar uchun asos
class GameFrameworkBase {
  constructor(canvas, players, gameId) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.players = players || [];
    this.gameId = gameId;
    this.isRunning = false;
    this.lastTime = 0;
    this.deltaTime = 0;
    
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Game state
    this.gameState = {
      players: {},
      score: {},
      time: 0,
      status: 'playing',
      level: 1,
      wave: 1
    };
    
    this.initPlayers();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initPlayers() {
    this.players.forEach((player, index) => {
      this.gameState.players[player] = {
        name: player,
        x: this.canvas.width / 2,
        y: this.canvas.height / 2,
        vx: 0,
        vy: 0,
        width: 40,
        height: 40,
        color: this.getPlayerColor(index),
        score: 0,
        health: 100,
        energy: 100,
        lives: 3,
        level: 1,
        experience: 0,
        speed: 5,
        input: {},
        direction: 1,
        state: 'idle',
        animationFrame: 0,
        animationTimer: 0
      };
      this.gameState.score[player] = 0;
    });
  }
  
  getPlayerColor(index) {
    const colors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24',
      '#a29bfe', '#fd79a8', '#00b894', '#e17055'
    ];
    return colors[index % colors.length];
  }
  
  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }
  
  stop() {
    this.isRunning = false;
  }
  
  gameLoop(currentTime) {
    if (!this.isRunning) return;
    
    this.deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    this.update(this.deltaTime);
    this.render();
    
    requestAnimationFrame((time) => this.gameLoop(time));
  }
  
  update(deltaTime) {
    this.gameState.time += deltaTime;
    
    // Update all player animations
    Object.values(this.gameState.players).forEach(player => {
      if (player.state !== 'idle') {
        player.animationTimer += deltaTime;
        if (player.animationTimer > 0.1) {
          player.animationFrame = (player.animationFrame + 1) % 4;
          player.animationTimer = 0;
        }
      }
    });
  }
  
  render() {
    // Clear canvas with background
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Default message
    this.ctx.fillStyle = 'white';
    this.ctx.font = '30px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('O\'yin Yuklanmoqda...', this.canvas.width / 2, this.canvas.height / 2);
  }
  
  updatePlayerInput(playerName, input) {
    if (this.gameState.players[playerName]) {
      this.gameState.players[playerName].input = input;
    }
  }
  
  updateScore(playerName, score) {
    this.gameState.score[playerName] = score;
    if (this.gameState.players[playerName]) {
      this.gameState.players[playerName].score = score;
    }
  }
  
  updateHealth(playerName, health) {
    if (this.gameState.players[playerName]) {
      this.gameState.players[playerName].health = Math.max(0, health);
    }
  }
  
  gameOver() {
    this.gameState.status = 'finished';
    this.renderGameOver();
  }
  
  renderGameOver() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 60px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('O\'yin Tugadi!', this.canvas.width / 2, this.canvas.height / 2 - 80);
    
    // Show scores
    let y = this.canvas.height / 2;
    Object.entries(this.gameState.score).forEach(([name, score]) => {
      this.ctx.fillStyle = 'white';
      this.ctx.font = '30px Arial';
      this.ctx.fillText(`${name}: ${score} ball`, this.canvas.width / 2, y);
      y += 50;
    });
  }
  
  // Utility methods
  checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }
  
  distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }
  
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
  
  random(min, max) {
    return Math.random() * (max - min) + min;
  }
  
  randomInt(min, max) {
    return Math.floor(this.random(min, max + 1));
  }
  
  getDirection(fromX, fromY, toX, toY) {
    return Math.atan2(toY - fromY, toX - fromX);
  }
}

window.GameFrameworkBase = GameFrameworkBase;