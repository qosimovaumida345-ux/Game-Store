// Paper Plane Flying Game
class PaperPlaneGame {
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
      altitude: 300,
      plane: null,
      obstacles: [],
      coins: [],
      particles: [],
      wind: 0,
      status: 'playing',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.plane = { x: 150, y: 300, vx: 3, vy: 0, angle: 0 };
    this.gameState.wind = (Math.random() - 0.5) * 2;
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
    this.gameState.distance += this.gameState.plane.vx * 10;
    this.gameState.score = Math.floor(this.gameState.distance / 10);
    
    const input = this.getPlayerInput(this.players[0]);
    const plane = this.gameState.plane;
    
    if (input.up) plane.vy -= 3 * deltaTime;
    if (input.down) plane.vy += 3 * deltaTime;
    if (input.left) plane.angle -= 2 * deltaTime;
    if (input.right) plane.angle += 2 * deltaTime;
    
    plane.vy += 0.5 * deltaTime;
    plane.vy = Math.max(-5, Math.min(5, plane.vy));
    
    plane.y += plane.vy;
    plane.y = Math.max(50, Math.min(this.canvas.height - 50, plane.y));
    
    if (Math.random() < 0.03) {
      this.gameState.obstacles.push({
        x: this.canvas.width + 50,
        y: 100 + Math.random() * 400,
        width: 30,
        height: 30
      });
    }
    
    if (Math.random() < 0.02) {
      this.gameState.coins.push({ x: this.canvas.width + 50, y: 100 + Math.random() * 400 });
    }
    
    this.gameState.obstacles.forEach(o => o.x -= 4);
    this.gameState.coins.forEach(c => c.x -= 4);
    
    this.gameState.obstacles = this.gameState.obstacles.filter(o => o.x > -50);
    this.gameState.coins = this.gameState.coins.filter(c => c.x > -50);
    
    const planeR = 20;
    this.gameState.obstacles.forEach(o => {
      if (plane.x + planeR > o.x && plane.x - planeR < o.x + o.width &&
          plane.y + planeR > o.y && plane.y - planeR < o.y + o.height) {
        this.gameState.gameOver = true;
      }
    });
    
    this.gameState.coins = this.gameState.coins.filter(c => {
      if (Math.abs(plane.x - c.x) < 30 && Math.abs(plane.y - c.y) < 30) {
        this.gameState.score += 50;
        return false;
      }
      return true;
    });
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, '#87ceeb');
    grad.addColorStop(1, '#e0f7fa');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
    
    this.ctx.fillStyle = '#f1c40f';
    this.gameState.coins.forEach(c => {
      this.ctx.beginPath();
      this.ctx.arc(c.x, c.y, 15, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    this.ctx.fillStyle = '#8b4513';
    this.gameState.obstacles.forEach(o => {
      this.ctx.fillRect(o.x, o.y, o.width, o.height);
    });
    
    const p = this.gameState.plane;
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.angle);
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.moveTo(20, 0);
    this.ctx.lineTo(-15, -10);
    this.ctx.lineTo(-10, 0);
    this.ctx.lineTo(-15, 10);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.restore();
    
    this.ctx.fillStyle = '#000';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Distance: ' + Math.floor(this.gameState.distance) + 'm | Score: ' + this.gameState.score, 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.fillText('PAPER PLANE', this.canvas.width / 2, 25);
    
    if (this.gameState.gameOver) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.font = '40px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.PaperPlaneGame = PaperPlaneGame;