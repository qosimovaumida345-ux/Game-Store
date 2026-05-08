// Word Search Puzzle Game
class WordSearchGame {
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
      words: ['JAVASCRIPT', 'BROWSER', 'GAMING', 'CONTROLLER', 'SCREEN', 'WEBSOCKET', 'MULTIPLAYER'],
      foundWords: [],
      grid: [],
      selected: [],
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
    const gridSize = 12;
    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));
    const directions = [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1], [-1, 1]];
    
    this.gameState.words.forEach(word => {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 100) {
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const startRow = Math.floor(Math.random() * gridSize);
        const startCol = Math.floor(Math.random() * gridSize);
        
        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          const r = startRow + dir[0] * i;
          const c = startCol + dir[1] * i;
          if (r < 0 || r >= gridSize || c < 0 || c >= gridSize || (grid[r][c] !== '' && grid[r][c] !== word[i])) {
            canPlace = false;
            break;
          }
        }
        
        if (canPlace) {
          for (let i = 0; i < word.length; i++) {
            grid[startRow + dir[0] * i][startCol + dir[1] * i] = word[i];
          }
          placed = true;
        }
        attempts++;
      }
    });
    
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (grid[r][c] === '') grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
    }
    
    this.gameState.grid = grid;
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
    
    if (this.gameState.foundWords.length === this.gameState.words.length) {
      this.gameState.score = Math.max(0, 10000 - Math.floor(this.gameState.time * 10));
      this.gameState.gameOver = true;
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#f5f5dc';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const cellSize = 40;
    const offsetX = 100;
    const offsetY = 80;
    
    this.gameState.grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(offsetX + c * cellSize, offsetY + r * cellSize, cellSize, cellSize);
        this.ctx.strokeStyle = '#333';
        this.ctx.strokeRect(offsetX + c * cellSize, offsetY + r * cellSize, cellSize, cellSize);
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(cell, offsetX + c * cellSize + cellSize/2, offsetY + r * cellSize + cellSize/2 + 6);
      });
    });
    
    this.ctx.fillStyle = '#000';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Words to find:', 20, 100);
    this.gameState.words.forEach((word, i) => {
      const found = this.gameState.foundWords.includes(word);
      this.ctx.fillStyle = found ? '#2ecc71' : '#e74c3c';
      this.ctx.fillText((found ? '✓ ' : '○ ') + word, 20, 130 + i * 20);
    });
    
    this.ctx.fillStyle = '#000';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Time: ' + Math.floor(this.gameState.time) + 's | Found: ' + this.gameState.foundWords.length + '/' + this.gameState.words.length, 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.fillText('WORD SEARCH', this.canvas.width / 2, 25);
    
    if (this.gameState.gameOver) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#2ecc71';
      this.ctx.font = '40px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('COMPLETE!', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.fillStyle = '#fff';
      this.ctx.fillText('Score: ' + this.gameState.score, this.canvas.width / 2, this.canvas.height / 2 + 40);
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.WordSearchGame = WordSearchGame;