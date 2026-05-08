// Conway's Game of Life
class GameOfLifeGame {
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
      generation: 0,
      grid: [],
      width: 40,
      height: 30,
      speed: 0.1,
      running: true,
      pattern: 'random',
      status: 'simulating',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    for (let y = 0; y < this.gameState.height; y++) {
      this.gameState.grid[y] = [];
      for (let x = 0; x < this.gameState.width; x++) {
        this.gameState.grid[y][x] = Math.random() < 0.3 ? 1 : 0;
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
    if (!this.gameState.running) return;
    this.gameState.time += deltaTime;
    
    if (this.gameState.time > this.gameState.speed) {
      this.gameState.time = 0;
      this.computeNextGeneration();
    }
  }
  
  computeNextGeneration() {
    const newGrid = [];
    for (let y = 0; y < this.gameState.height; y++) {
      newGrid[y] = [];
      for (let x = 0; x < this.gameState.width; x++) {
        const neighbors = this.countNeighbors(x, y);
        const cell = this.gameState.grid[y][x];
        
        if (cell === 1 && (neighbors < 2 || neighbors > 3)) {
          newGrid[y][x] = 0;
        } else if (cell === 0 && neighbors === 3) {
          newGrid[y][x] = 1;
        } else {
          newGrid[y][x] = cell;
        }
      }
    }
    this.gameState.grid = newGrid;
    this.gameState.generation++;
  }
  
  countNeighbors(x, y) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx >= 0 && nx < this.gameState.width && ny >= 0 && ny < this.gameState.height) {
          count += this.gameState.grid[ny][nx];
        }
      }
    }
    return count;
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, 800, 600);
    
    const cellWidth = this.canvas.width / this.gameState.width;
    const cellHeight = this.canvas.height / this.gameState.height;
    
    for (let y = 0; y < this.gameState.height; y++) {
      for (let x = 0; x < this.gameState.width; x++) {
        if (this.gameState.grid[y][x] === 1) {
          const hue = (x * 5 + y * 5) % 360;
          this.ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
          this.ctx.fillRect(x * cellWidth + 1, y * cellHeight + 1, cellWidth - 2, cellHeight - 2);
        }
      }
    }
    
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= this.gameState.width; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * cellWidth, 0);
      this.ctx.lineTo(i * cellWidth, 600);
      this.ctx.stroke();
    }
    for (let i = 0; i <= this.gameState.height; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * cellHeight);
      this.ctx.lineTo(800, i * cellHeight);
      this.ctx.stroke();
    }
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Generation: ' + this.gameState.generation, 20, 30);
    this.ctx.fillText(this.gameState.running ? 'Running' : 'Paused', 200, 30);
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('CONWAY\'S GAME OF LIFE', 400, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    
    if (input.toggle !== undefined) {
      this.gameState.running = !this.gameState.running;
    }
    if (input.clear) {
      for (let y = 0; y < this.gameState.height; y++) {
        for (let x = 0; x < this.gameState.width; x++) {
          this.gameState.grid[y][x] = 0;
        }
      }
      this.gameState.generation = 0;
    }
    if (input.randomize) {
      this.initGame();
    }
    if (input.click) {
      const x = Math.floor(input.click.x / (this.canvas.width / this.gameState.width));
      const y = Math.floor(input.click.y / (this.canvas.height / this.gameState.height));
      if (x >= 0 && x < this.gameState.width && y >= 0 && y < this.gameState.height) {
        this.gameState.grid[y][x] = this.gameState.grid[y][x] ? 0 : 1;
      }
    }
  }
}

window.GameOfLifeGame = GameOfLifeGame;