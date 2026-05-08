// Frogger Style Game
class FroggerGame {
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
      frog: null,
      cars: [],
      logs: [],
      waterLevel: 150,
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
    this.gameState.frog = { x: 400, y: 570, size: 20 };
    
    for (let lane = 0; lane < 4; lane++) {
      const speed = 2 + lane * 0.5;
      const direction = lane % 2 === 0 ? 1 : -1;
      for (let i = 0; i < 3; i++) {
        this.gameState.cars.push({
          x: i * 250 + lane * 50,
          y: 480 - lane * 70,
          width: 50,
          height: 30,
          speed: speed * direction,
          color: ['#e74c3c', '#3498db', '#f1c40f', '#9b59b6'][lane]
        });
      }
    }
    
    for (let lane = 0; lane < 3; lane++) {
      const speed = 1.5 + lane * 0.5;
      for (let i = 0; i < 2; i++) {
        this.gameState.logs.push({
          x: i * 350 + lane * 30,
          y: 230 - lane * 50,
          width: 80,
          height: 30,
          speed: speed
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
    
    const input = this.getPlayerInput(this.players[0]);
    const frog = this.gameState.frog;
    const step = 30;
    if (input.up) frog.y = Math.max(0, frog.y - step);
    if (input.down) frog.y = Math.min(580, frog.y + step);
    if (input.left) frog.x = Math.max(20, frog.x - step);
    if (input.right) frog.x = Math.min(780, frog.x + step);
    
    this.gameState.cars.forEach(car => {
      car.x += car.speed;
      if (car.speed > 0 && car.x > 850) car.x = -50;
      if (car.speed < 0 && car.x < -50) car.x = 850;
      
      if (Math.abs(frog.x - car.x - car.width/2) < car.width/2 && Math.abs(frog.y - car.y - car.height/2) < car.height/2) {
        this.gameState.lives--;
        frog.x = 400;
        frog.y = 570;
        if (this.gameState.lives <= 0) this.gameState.gameOver = true;
      }
    });
    
    this.gameState.logs.forEach(log => {
      log.x += log.speed;
      if (log.x > 850) log.x = -log.width;
      if (log.x < -log.width) log.x = 850;
    });
    
    if (frog.y < this.gameState.waterLevel && frog.y > 50) {
      let onLog = false;
      this.gameState.logs.forEach(log => {
        if (frog.x > log.x && frog.x < log.x + log.width) onLog = true;
      });
      if (!onLog) {
        this.gameState.lives--;
        frog.x = 400;
        frog.y = 570;
        if (this.gameState.lives <= 0) this.gameState.gameOver = true;
      }
    }
    
    if (frog.y < 60) {
      this.gameState.score += 100;
      frog.x = 400;
      frog.y = 570;
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillRect(0, 50, 800, 200);
    
    this.ctx.fillStyle = '#27ae60';
    this.ctx.fillRect(0, 250, 800, 50);
    this.ctx.fillRect(0, 450, 800, 50);
    
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 300, 800, 150);
    
    this.gameState.logs.forEach(log => {
      this.ctx.fillStyle = '#8b4513';
      this.ctx.fillRect(log.x, log.y, log.width, log.height);
    });
    
    this.gameState.cars.forEach(car => {
      this.ctx.fillStyle = car.color;
      this.ctx.fillRect(car.x, car.y, car.width, car.height);
    });
    
    const frog = this.gameState.frog;
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.beginPath();
    this.ctx.arc(frog.x, frog.y, frog.size, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#27ae60';
    this.ctx.beginPath();
    this.ctx.arc(frog.x, frog.y, frog.size - 5, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Score: ' + this.gameState.score + ' | Lives: ' + this.gameState.lives, 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('FROGGER', this.canvas.width / 2, 25);
    
    if (this.gameState.gameOver) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.font = '40px Arial';
      this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.FroggerGame = FroggerGame;