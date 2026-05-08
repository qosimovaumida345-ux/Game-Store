// Falling Sand Game
class FallingSandGame {
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
      grid: [],
      width: 80,
      height: 60,
      brushSize: 3,
      currentElement: 'sand',
      elements: {
        sand: { color: '#f4d03f', density: 3 },
        water: { color: '#3498db', density: 2 },
        stone: { color: '#7f8c8d', density: 100 },
        fire: { color: '#e74c3c', density: 1 },
        smoke: { color: '#95a5a6', density: 0.5 }
      },
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
        this.gameState.grid[y][x] = null;
      }
    }
    
    for (let x = 0; x < this.gameState.width; x++) {
      this.gameState.grid[this.gameState.height - 1][x] = 'stone';
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
    this.gameState.score = Math.floor(this.gameState.time * 10);
    
    const newGrid = [];
    for (let y = 0; y < this.gameState.height; y++) {
      newGrid[y] = [];
      for (let x = 0; x < this.gameState.width; x++) {
        newGrid[y][x] = this.gameState.grid[y][x];
      }
    }
    
    for (let y = this.gameState.height - 2; y >= 0; y--) {
      for (let x = 0; x < this.gameState.width; x++) {
        const cell = this.gameState.grid[y][x];
        if (!cell || cell === 'stone') continue;
        
        const elem = this.gameState.elements[cell];
        if (!elem) continue;
        
        if (cell === 'fire') {
          if (Math.random() < 0.1) {
            newGrid[y][x] = Math.random() < 0.5 ? 'smoke' : null;
          }
          continue;
        }
        
        if (cell === 'water') {
          const canMoveDown = y + 1 < this.gameState.height && !newGrid[y + 1][x];
          const canMoveLeft = x > 0 && !newGrid[y][x - 1];
          const canMoveRight = x < this.gameState.width - 1 && !newGrid[y][x + 1];
          
          if (canMoveDown) {
            newGrid[y + 1][x] = 'water';
            newGrid[y][x] = null;
          } else if (canMoveLeft && canMoveRight) {
            newGrid[y][x + (Math.random() < 0.5 ? -1 : 1)] = 'water';
            newGrid[y][x] = null;
          } else if (canMoveLeft) {
            newGrid[y][x - 1] = 'water';
            newGrid[y][x] = null;
          } else if (canMoveRight) {
            newGrid[y][x + 1] = 'water';
            newGrid[y][x] = null;
          }
          continue;
        }
        
        const canMoveDown = y + 1 < this.gameState.height && !newGrid[y + 1][x];
        const canMoveLeftDown = x > 0 && y + 1 < this.gameState.height && !newGrid[y + 1][x - 1];
        const canMoveRightDown = x < this.gameState.width - 1 && y + 1 < this.gameState.height && !newGrid[y + 1][x + 1];
        
        if (canMoveDown) {
          newGrid[y + 1][x] = cell;
          newGrid[y][x] = null;
        } else if (canMoveLeftDown && canMoveRightDown) {
          const dir = Math.random() < 0.5 ? -1 : 1;
          newGrid[y + 1][x + dir] = cell;
          newGrid[y][x] = null;
        } else if (canMoveLeftDown) {
          newGrid[y + 1][x - 1] = cell;
          newGrid[y][x] = null;
        } else if (canMoveRightDown) {
          newGrid[y + 1][x + 1] = cell;
          newGrid[y][x] = null;
        }
      }
    }
    
    this.gameState.grid = newGrid;
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  addElement(x, y, element) {
    const gx = Math.floor(x / (this.canvas.width / this.gameState.width));
    const gy = Math.floor(y / (this.canvas.height / this.gameState.height));
    
    if (gx >= 0 && gx < this.gameState.width && gy >= 0 && gy < this.gameState.height) {
      for (let dy = -this.gameState.brushSize + 1; dy < this.gameState.brushSize; dy++) {
        for (let dx = -this.gameState.brushSize + 1; dx < this.gameState.brushSize; dx++) {
          const nx = gx + dx;
          const ny = gy + dy;
          if (nx >= 0 && nx < this.gameState.width && ny >= 0 && ny < this.gameState.height) {
            if (Math.random() < 0.7) {
              this.gameState.grid[ny][nx] = element;
            }
          }
        }
      }
    }
  }
  
  render() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const cellWidth = this.canvas.width / this.gameState.width;
    const cellHeight = this.canvas.height / this.gameState.height;
    
    for (let y = 0; y < this.gameState.height; y++) {
      for (let x = 0; x < this.gameState.width; x++) {
        const cell = this.gameState.grid[y][x];
        if (cell && this.gameState.elements[cell]) {
          this.ctx.fillStyle = this.gameState.elements[cell].color;
          this.ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
        }
      }
    }
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Time: ' + Math.floor(this.gameState.time) + 's', 20, 25);
    this.ctx.fillText('Element: ' + this.gameState.currentElement.toUpperCase(), 150, 25);
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('FALLING SAND', this.canvas.width/2, 25);
    
    this.ctx.textAlign = 'left';
    this.ctx.fillStyle = '#7f8c8d';
    this.ctx.fillText('[1] Sand [2] Water [3] Stone [4] Fire [5] Smoke', 20, 585);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    
    if (input.element) {
      this.gameState.currentElement = input.element;
    }
    if (input.draw && input.draw.x !== undefined && input.draw.y !== undefined) {
      this.addElement(input.draw.x, input.draw.y, this.gameState.currentElement);
    }
  }
}

window.FallingSandGame = FallingSandGame;