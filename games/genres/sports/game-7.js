// Fishing Game
class FishingGame {
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
      fishCount: 0,
      bait: 10,
      lineLength: 100,
      hook: null,
      fish: [],
      status: 'casting',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.hook = { x: 150, y: 200, vx: 0, vy: 0 };
    for (let i = 0; i < 8; i++) {
      this.spawnFish();
    }
  }
  
  spawnFish() {
    this.gameState.fish.push({
      x: 400 + Math.random() * 400,
      y: 350 + Math.random() * 200,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 0.5,
      type: ['bass', 'trout', 'salmon', 'carp'][Math.floor(Math.random() * 4)],
      value: 10 + Math.floor(Math.random() * 40)
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
    
    const input = this.getPlayerInput(this.players[0]);
    const hook = this.gameState.hook;
    
    if (this.gameState.status === 'casting') {
      if (input.action) {
        hook.vx = 5;
        hook.vy = 2;
        this.gameState.status = 'falling';
        this.gameState.bait--;
      }
    } else if (this.gameState.status === 'falling') {
      hook.vy += 0.2;
      hook.x += hook.vx;
      hook.y += hook.vy;
      
      if (hook.y > 550) {
        this.gameState.status = 'reeling';
        hook.vx = -hook.vx * 0.3;
      }
    } else if (this.gameState.status === 'reeling') {
      hook.x += hook.vx;
      hook.y += hook.vy;
      hook.vx *= 0.98;
      hook.vy *= 0.98;
      
      if (Math.abs(hook.vx) < 0.1 && Math.abs(hook.vy) < 0.1) {
        hook.x = 150;
        hook.y = 200;
        hook.vx = 0;
        hook.vy = 0;
        if (this.gameState.bait > 0) this.gameState.status = 'casting';
        else this.gameState.gameOver = true;
      }
    }
    
    this.gameState.fish.forEach(f => {
      f.x += f.vx;
      f.y += f.vy;
      if (f.x < 300 || f.x > 780) f.vx *= -1;
      if (f.y < 350 || f.y > 550) f.vy *= -1;
      
      const dx = hook.x - f.x;
      const dy = hook.y - f.y;
      if (Math.sqrt(dx*dx + dy*dy) < 20 && this.gameState.status === 'falling') {
        this.gameState.score += f.value;
        this.gameState.fishCount++;
        f.x = 1000;
        this.spawnFish();
      }
    });
    
    this.gameState.fish = this.gameState.fish.filter(f => f.x < 900);
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, '#87ceeb');
    grad.addColorStop(0.3, '#b0e0e6');
    grad.addColorStop(1, '#1e90ff');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#228b22';
    this.ctx.fillRect(0, 320, 150, 80);
    this.ctx.fillStyle = '#8b4513';
    this.ctx.fillRect(130, 250, 40, 70);
    
    this.ctx.fillStyle = '#1e90ff';
    this.ctx.fillRect(150, 320, 650, 280);
    
    this.gameState.fish.forEach(f => {
      this.ctx.fillStyle = f.type === 'salmon' ? '#ff6b6b' : (f.type === 'bass' ? '#4ecdc4' : '#ffe66d');
      this.ctx.beginPath();
      this.ctx.ellipse(f.x, f.y, 20, 10, 0, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    if (this.gameState.status !== 'casting') {
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(150, 250);
      this.ctx.lineTo(this.gameState.hook.x, this.gameState.hook.y);
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.beginPath();
      this.ctx.arc(this.gameState.hook.x, this.gameState.hook.y, 8, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    this.ctx.fillStyle = '#000';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Score: ' + this.gameState.score + ' | Fish: ' + this.gameState.fishCount + ' | Bait: ' + this.gameState.bait, 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.fillText('FISHING', this.canvas.width / 2, 25);
    if (this.gameState.status === 'casting') {
      this.ctx.fillStyle = '#fff';
      this.ctx.fillText('Press Action to cast!', this.canvas.width / 2, this.canvas.height - 20);
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.FishingGame = FishingGame;