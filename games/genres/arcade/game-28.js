// Treasure Hunt Game
class TreasureHuntGame {
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
      keys: 0,
      player: null,
      treasure: null,
      enemies: [],
      walls: [],
      status: 'exploring',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = { x: 50, y: 300, size: 20 };
    this.gameState.treasure = { x: 700, y: 300, size: 30 };
    
    for (let i = 0; i < 8; i++) {
      this.gameState.walls.push({
        x: 100 + Math.floor(Math.random() * 10) * 60,
        y: 50 + Math.floor(Math.random() * 8) * 70,
        width: 40,
        height: 40
      });
    }
    
    for (let i = 0; i < 6; i++) {
      this.gameState.enemies.push({
        x: 150 + Math.random() * 600,
        y: 50 + Math.random() * 500,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3
      });
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
    
    const input = this.getPlayerInput(this.players[0]);
    const p = this.gameState.player;
    const speed = 5;
    if (input.up) p.y = Math.max(p.size, p.y - speed);
    if (input.down) p.y = Math.min(600 - p.size, p.y + speed);
    if (input.left) p.x = Math.max(p.size, p.x - speed);
    if (input.right) p.x = Math.min(800 - p.size, p.x + speed);
    
    this.gameState.walls.forEach(w => {
      if (this.checkCollision(p, w)) {
        if (input.up) p.y = w.y + w.height + p.size;
        if (input.down) p.y = w.y - p.size;
        if (input.left) p.x = w.x + w.width + p.size;
        if (input.right) p.x = w.x - p.size;
      }
    });
    
    this.gameState.enemies.forEach(e => {
      e.x += e.vx;
      e.y += e.vy;
      if (e.x < 20 || e.x > 780) e.vx *= -1;
      if (e.y < 20 || e.y > 580) e.vy *= -1;
      
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      if (Math.sqrt(dx*dx + dy*dy) < p.size + 15) {
        this.gameState.gameOver = true;
      }
    });
    
    const dx = p.x - this.gameState.treasure.x;
    const dy = p.y - this.gameState.treasure.y;
    if (Math.sqrt(dx*dx + dy*dy) < p.size + this.gameState.treasure.size) {
      this.gameState.score += 1000;
      this.gameState.gameOver = true;
    }
  }
  
  checkCollision(player, wall) {
    return player.x + player.size > wall.x && 
           player.x - player.size < wall.x + wall.width &&
           player.y + player.size > wall.y && 
           player.y - player.size < wall.y + wall.height;
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    const grad = this.ctx.createLinearGradient(0, 0, 0, 600);
    grad.addColorStop(0, '#2c3e50');
    grad.addColorStop(1, '#1a252f');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, 800, 600);
    
    this.ctx.fillStyle = '#7f8c8d';
    this.gameState.walls.forEach(w => {
      this.ctx.fillRect(w.x, w.y, w.width, w.height);
      this.ctx.strokeStyle = '#95a5a6';
      this.ctx.strokeRect(w.x, w.y, w.width, w.height);
    });
    
    this.ctx.fillStyle = '#f1c40f';
    const t = this.gameState.treasure;
    this.ctx.beginPath();
    this.ctx.moveTo(t.x, t.y - t.size);
    this.ctx.lineTo(t.x + t.size, t.y);
    this.ctx.lineTo(t.x, t.y + t.size);
    this.ctx.lineTo(t.x - t.size, t.y);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.fillStyle = '#e67e22';
    this.ctx.beginPath();
    this.ctx.arc(t.x, t.y, t.size * 0.5, 0, Math.PI*2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#e74c3c';
    this.gameState.enemies.forEach(e => {
      this.ctx.beginPath();
      this.ctx.arc(e.x, e.y, 15, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(e.x - 5, e.y - 3, 4, 4);
      this.ctx.fillRect(e.x + 1, e.y - 3, 4, 4);
      this.ctx.fillStyle = '#e74c3c';
    });
    
    const p = this.gameState.player;
    this.ctx.fillStyle = '#3498db';
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    this.ctx.fill();
    this.ctx.fillStyle = '#ecf0f1';
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y - 5, 8, 0, Math.PI*2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Score: ' + this.gameState.score + ' | Find the treasure!', 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.fillText('TREASURE HUNT', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.TreasureHuntGame = TreasureHuntGame;