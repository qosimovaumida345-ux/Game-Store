// Falling Objects Game
class FallingObjectsGame {
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
      player: null,
      objects: [],
      status: 'playing',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = { x: 400, y: 550, width: 60, height: 20 };
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
    
    const input = this.getPlayerInput(this.players[0]);
    const p = this.gameState.player;
    if (input.left) p.x = Math.max(30, p.x - 8);
    if (input.right) p.x = Math.min(770, p.x + 8);
    
    if (Math.random() < 0.03) {
      this.gameState.objects.push({
        x: 50 + Math.random() * 700,
        y: -30,
        type: Math.random() < 0.3 ? 'good' : 'bad',
        size: 15 + Math.random() * 15,
        speed: 2 + Math.random() * 3
      });
    }
    
    this.gameState.objects.forEach(o => o.y += o.speed * 60 * deltaTime);
    
    this.gameState.objects = this.gameState.objects.filter(o => {
      const dx = p.x - o.x;
      const dy = p.y - o.y;
      if (Math.abs(dx) < p.width/2 + o.size/2 && o.y > 500) {
        if (o.type === 'good') this.gameState.score += 10;
        else { this.gameState.lives--; if (this.gameState.lives <= 0) this.gameState.gameOver = true; }
        return false;
      }
      return o.y < 650;
    });
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const p = this.gameState.player;
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillRect(p.x - p.width/2, p.y, p.width, p.height);
    
    this.gameState.objects.forEach(o => {
      this.ctx.fillStyle = o.type === 'good' ? '#2ecc71' : '#e74c3c';
      this.ctx.beginPath();
      this.ctx.arc(o.x, o.y, o.size, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Score: ' + this.gameState.score + ' | Lives: ' + this.gameState.lives, 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('CATCH FALLING', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.FallingObjectsGame = FallingObjectsGame;