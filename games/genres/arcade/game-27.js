// Firefighter Game
class FirefighterGame {
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
      water: 100,
      fires: [],
      player: null,
      status: 'putting',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = { x: 400, y: 500 };
    for (let i = 0; i < 6; i++) {
      this.gameState.fires.push({
        x: 100 + Math.random() * 600,
        y: 100 + Math.random() * 350,
        size: 20 + Math.random() * 20,
        health: 100
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
    if (input.left) p.x = Math.max(30, p.x - 6);
    if (input.right) p.x = Math.min(770, p.x + 6);
    
    if (input.action && this.gameState.water > 0) {
      this.gameState.water -= deltaTime * 5;
      this.gameState.fires.forEach(f => {
        const dx = p.x - f.x;
        const dy = 450 - f.y;
        if (Math.sqrt(dx*dx+dy*dy) < 80) {
          f.health -= deltaTime * 30;
          this.gameState.score += 5;
        }
      });
    } else if (!input.action) {
      this.gameState.water = Math.min(100, this.gameState.water + deltaTime * 2);
    }
    
    this.gameState.fires = this.gameState.fires.filter(f => f.health > 0);
    if (this.gameState.fires.length === 0) this.gameState.gameOver = true;
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(0, 0, 800, 600);
    
    this.gameState.fires.forEach(f => {
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.beginPath();
      this.ctx.arc(f.x, f.y, f.size * (f.health/100), 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.beginPath();
      this.ctx.arc(f.x, f.y, f.size * (f.health/100) * 0.6, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    const p = this.gameState.player;
    this.ctx.fillStyle = '#e67e22';
    this.ctx.fillRect(p.x - 20, 480, 40, 20);
    this.ctx.fillStyle = '#3498db';
    this.ctx.beginPath();
    this.ctx.moveTo(p.x, 480);
    this.ctx.lineTo(p.x - 30, 450);
    this.ctx.lineTo(p.x - 20, 480);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Score: ' + this.gameState.score + ' | Water: ' + Math.floor(this.gameState.water) + '%', 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.fillText('FIREFIGHTER', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.FirefighterGame = FirefighterGame;