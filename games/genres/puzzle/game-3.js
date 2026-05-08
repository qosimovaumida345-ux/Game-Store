// Minesweeper Puzzle Game
class MinesweeperGame {
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
      flags: 0,
      status: 'playing',
      cells: [],
      revealed: [],
      flagged: [],
      mines: 15,
      totalMines: 15,
      safeCells: 0,
      revealedCount: 0,
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    const rows = 12;
    const cols = 16;
    this.gameState.rows = rows;
    this.gameState.cols = cols;
    this.gameState.safeCells = rows * cols - this.gameState.totalMines;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.gameState.cells.push({ row: r, col: c, mine: false, neighborMines: 0 });
        this.gameState.revealed.push(false);
        this.gameState.flagged.push(false);
      }
    }
    
    this.placeMines();
    this.calculateNeighbors();
  }
  
  placeMines() {
    let placed = 0;
    const rows = this.gameState.rows;
    const cols = this.gameState.cols;
    
    while (placed < this.gameState.totalMines) {
      const idx = Math.floor(Math.random() * (rows * cols));
      
      if (!this.gameState.cells[idx].mine) {
        this.gameState.cells[idx].mine = true;
        placed++;
      }
    }
  }
  
  calculateNeighbors() {
    const rows = this.gameState.rows;
    const cols = this.gameState.cols;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        
        if (this.gameState.cells[idx].mine) continue;
        
        let count = 0;
        
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            
            const nr = r + dr;
            const nc = c + dc;
            
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              const nIdx = nr * cols + nc;
              if (this.gameState.cells[nIdx].mine) count++;
            }
          }
        }
        
        this.gameState.cells[idx].neighborMines = count;
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
    
    if (this.gameState.revealedCount === this.gameState.safeCells) {
      this.gameState.gameOver = true;
      this.gameState.score = Math.max(0, 10000 - Math.floor(this.gameState.time * 10));
    }
  }
  
  revealCell(row, col) {
    if (this.gameState.gameOver) return;
    
    const idx = row * this.gameState.cols + col;
    
    if (this.gameState.flagged[idx] || this.gameState.revealed[idx]) return;
    
    this.gameState.revealed[idx] = true;
    this.gameState.revealedCount++;
    
    const cell = this.gameState.cells[idx];
    
    if (cell.mine) {
      this.gameState.gameOver = true;
      this.revealAllMines();
      return;
    }
    
    if (cell.neighborMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = row + dr;
          const nc = col + dc;
          
          if (nr >= 0 && nr < this.gameState.rows && nc >= 0 && nc < this.gameState.cols) {
            if (!this.gameState.revealed[nr * this.gameState.cols + nc]) {
              this.revealCell(nr, nc);
            }
          }
        }
      }
    }
  }
  
  toggleFlag(row, col) {
    if (this.gameState.gameOver) return;
    
    const idx = row * this.gameState.cols + col;
    
    if (this.gameState.revealed[idx]) return;
    
    this.gameState.flagged[idx] = !this.gameState.flagged[idx];
    this.gameState.flags += this.gameState.flagged[idx] ? 1 : -1;
  }
  
  revealAllMines() {
    this.gameState.cells.forEach((cell, idx) => {
      if (cell.mine) {
        this.gameState.revealed[idx] = true;
      }
    });
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (input.action) {
      const row = Math.floor(Math.random() * this.gameState.rows);
      const col = Math.floor(Math.random() * this.gameState.cols);
      this.revealCell(row, col);
    }
    if (input.up) {
      const row = Math.floor(Math.random() * this.gameState.rows);
      const col = Math.floor(Math.random() * this.gameState.cols);
      this.toggleFlag(row, col);
    }
  }
  
  render() {
    this.drawBackground();
    this.drawGrid();
    this.drawCells();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#2c3e50');
    gradient.addColorStop(1, '#1a252f');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawGrid() {
    const cellSize = 35;
    const offsetX = (this.canvas.width - this.gameState.cols * cellSize) / 2;
    const offsetY = (this.canvas.height - this.gameState.rows * cellSize) / 2 + 30;
    
    this.gameState.offsetX = offsetX;
    this.gameState.offsetY = offsetY;
    this.gameState.cellSize = cellSize;
  }
  
  drawCells() {
    const { rows, cols, cells, revealed, flagged, offsetX, offsetY, cellSize } = this.gameState;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const x = offsetX + c * cellSize;
        const y = offsetY + r * cellSize;
        
        if (revealed[idx]) {
          if (cells[idx].mine) {
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.fillRect(x, y, cellSize, cellSize);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('💣', x + cellSize/2, y + cellSize/2 + 5);
          } else {
            this.ctx.fillStyle = '#ecf0f1';
            this.ctx.fillRect(x, y, cellSize, cellSize);
            
            if (cells[idx].neighborMines > 0) {
              const colors = ['', '#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#f1c40f', '#e67e22', '#1abc9c', '#34495e'];
              this.ctx.fillStyle = colors[cells[idx].neighborMines];
              this.ctx.font = 'bold 16px Arial';
              this.ctx.textAlign = 'center';
              this.ctx.fillText(cells[idx].neighborMines.toString(), x + cellSize/2, y + cellSize/2 + 6);
            }
          }
        } else {
          this.ctx.fillStyle = flagged[idx] ? '#95a5a6' : '#7f8c8d';
          this.ctx.fillRect(x, y, cellSize, cellSize);
          
          this.ctx.strokeStyle = '#5d6d7e';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(x, y, cellSize, cellSize);
          
          if (flagged[idx]) {
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🚩', x + cellSize/2, y + cellSize/2 + 5);
          }
        }
      }
    }
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, 10, 120, 60);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Time: ${Math.floor(this.gameState.time)}s`, 20, 30);
    this.ctx.fillText(`Mines: ${this.gameState.totalMines - this.gameState.flags}`, 20, 50);
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(this.canvas.width - 130, 10, 120, 40);
    
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Safe: ${this.gameState.safeCells - this.gameState.revealedCount}`, this.canvas.width - 70, 35);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('MINESWEEPER', this.canvas.width / 2, 25);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const won = this.gameState.revealedCount === this.gameState.safeCells;
    
    this.ctx.fillStyle = won ? '#2ecc71' : '#e74c3c';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(won ? 'YOU WIN!' : 'GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
    
    if (won) {
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '30px Arial';
      this.ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.MinesweeperGame = MinesweeperGame;