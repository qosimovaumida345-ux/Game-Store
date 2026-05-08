// Tetris Complex Game
class TetrisComplexGame {
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
      lines: 0,
      level: 1,
      nextPiece: null,
      currentPiece: null,
      board: [],
      boardWidth: 10,
      boardHeight: 20,
      cellSize: 28,
      dropTimer: 0,
      dropInterval: 1,
      status: 'playing',
      gameOver: false,
      hold: null,
      canHold: true,
      ghostPiece: null,
      clearing: false,
      clearRows: [],
      clearTimer: 0
    };
    
    this.shapes = [
      { name: 'I', color: '#00f0f0', cells: [[1,1,1,1]] },
      { name: 'O', color: '#f0f000', cells: [[1,1],[1,1]] },
      { name: 'T', color: '#a000f0', cells: [[0,1,0],[1,1,1]] },
      { name: 'S', color: '#00f000', cells: [[0,1,1],[1,1,0]] },
      { name: 'Z', color: '#f00000', cells: [[1,1,0],[0,1,1]] },
      { name: 'J', color: '#0000f0', cells: [[1,0,0],[1,1,1]] },
      { name: 'L', color: '#f0a000', cells: [[0,0,1],[1,1,1]] }
    ];
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    for (let y = 0; y < this.gameState.boardHeight; y++) {
      this.gameState.board[y] = [];
      for (let x = 0; x < this.gameState.boardWidth; x++) {
        this.gameState.board[y][x] = null;
      }
    }
    
    this.gameState.currentPiece = this.createPiece();
    this.gameState.nextPiece = this.createPiece();
    this.updateGhost();
  }
  
  createPiece() {
    const shape = this.shapes[Math.floor(Math.random() * this.shapes.length)];
    return {
      shape: shape.name,
      color: shape.color,
      cells: JSON.parse(JSON.stringify(shape.cells)),
      x: 3,
      y: 0,
      rotation: 0
    };
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
    
    if (this.gameState.clearing) {
      this.gameState.clearTimer += deltaTime;
      if (this.gameState.clearTimer > 0.5) {
        this.clearRows();
        this.gameState.clearing = false;
        this.gameState.canHold = true;
      }
      return;
    }
    
    this.gameState.dropTimer += deltaTime;
    this.gameState.dropInterval = Math.max(0.1, 1 - this.gameState.level * 0.05);
    
    if (this.gameState.dropTimer >= this.gameState.dropInterval) {
      this.gameState.dropTimer = 0;
      this.moveDown();
    }
  }
  
  moveDown() {
    if (this.gameState.clearing) return;
    
    const piece = this.gameState.currentPiece;
    
    if (this.canMove(piece.x, piece.y + 1)) {
      piece.y++;
    } else {
      this.lockPiece();
    }
    
    this.updateGhost();
  }
  
  canMove(newX, newY) {
    const piece = this.gameState.currentPiece;
    
    for (let r = 0; r < piece.cells.length; r++) {
      for (let c = 0; c < piece.cells[r].length; c++) {
        if (piece.cells[r][c]) {
          const boardX = newX + c;
          const boardY = newY + r;
          
          if (boardX < 0 || boardX >= this.gameState.boardWidth || boardY >= this.gameState.boardHeight) {
            return false;
          }
          
          if (boardY >= 0 && this.gameState.board[boardY][boardX]) {
            return false;
          }
        }
      }
    }
    
    return true;
  }
  
  rotate() {
    if (this.gameState.clearing) return;
    
    const piece = this.gameState.currentPiece;
    const oldCells = piece.cells;
    const newCells = this.rotateCells(oldCells);
    
    piece.cells = newCells;
    
    if (!this.canMove(piece.x, piece.y)) {
      if (this.canMove(piece.x - 1, piece.y)) piece.x--;
      else if (this.canMove(piece.x + 1, piece.y)) piece.x++;
      else if (this.canMove(piece.x, piece.y - 1)) piece.y--;
      else piece.cells = oldCells;
    }
    
    this.updateGhost();
  }
  
  rotateCells(cells) {
    const rows = cells.length;
    const cols = cells[0].length;
    const rotated = [];
    
    for (let c = 0; c < cols; c++) {
      rotated[c] = [];
      for (let r = rows - 1; r >= 0; r--) {
        rotated[c].push(cells[r][c]);
      }
    }
    
    return rotated;
  }
  
  lockPiece() {
    const piece = this.gameState.currentPiece;
    
    for (let r = 0; r < piece.cells.length; r++) {
      for (let c = 0; c < piece.cells[r].length; c++) {
        if (piece.cells[r][c]) {
          const boardY = piece.y + r;
          const boardX = piece.x + c;
          
          if (boardY < 0) {
            this.gameState.gameOver = true;
            return;
          }
          
          this.gameState.board[boardY][boardX] = piece.color;
        }
      }
    }
    
    this.checkLines();
    
    this.gameState.currentPiece = this.gameState.nextPiece;
    this.gameState.nextPiece = this.createPiece();
    this.gameState.canHold = true;
    this.updateGhost();
  }
  
  checkLines() {
    const fullRows = [];
    
    for (let y = 0; y < this.gameState.boardHeight; y++) {
      let full = true;
      for (let x = 0; x < this.gameState.boardWidth; x++) {
        if (!this.gameState.board[y][x]) {
          full = false;
          break;
        }
      }
      if (full) fullRows.push(y);
    }
    
    if (fullRows.length > 0) {
      this.gameState.clearing = true;
      this.gameState.clearRows = fullRows;
      this.gameState.clearTimer = 0;
      
      this.gameState.score += fullRows.length * 100 * this.gameState.level;
      this.gameState.lines += fullRows.length;
      this.gameState.level = Math.floor(this.gameState.lines / 10) + 1;
    }
  }
  
  clearRows() {
    this.gameState.clearRows.forEach(row => {
      this.gameState.board.splice(row, 1);
      this.gameState.board.push(Array(this.gameState.boardWidth).fill(null));
    });
    
    this.gameState.clearRows = [];
  }
  
  updateGhost() {
    const piece = this.gameState.currentPiece;
    let ghostY = piece.y;
    
    while (this.canMove(piece.x, ghostY + 1)) {
      ghostY++;
    }
    
    this.gameState.ghostPiece = {
      cells: piece.cells,
      x: piece.x,
      y: ghostY,
      color: piece.color
    };
  }
  
  holdPiece() {
    if (!this.gameState.canHold || this.gameState.clearing) return;
    
    if (!this.gameState.hold) {
      this.gameState.hold = this.gameState.currentPiece;
      this.gameState.currentPiece = this.gameState.nextPiece;
      this.gameState.nextPiece = this.createPiece();
    } else {
      const temp = this.gameState.currentPiece;
      this.gameState.currentPiece = this.gameState.hold;
      this.gameState.hold = temp;
      this.gameState.currentPiece.x = 3;
      this.gameState.currentPiece.y = 0;
    }
    
    this.gameState.canHold = false;
    this.updateGhost();
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#0a0a1a';
    this.ctx.fillRect(0, 0, 800, 600);
    
    const boardX = 200;
    const boardY = 50;
    const cellSize = this.gameState.cellSize;
    
    this.ctx.fillStyle = '#1a1a2a';
    this.ctx.fillRect(boardX - 5, boardY - 5, this.gameState.boardWidth * cellSize + 10, this.gameState.boardHeight * cellSize + 10);
    
    for (let y = 0; y < this.gameState.boardHeight; y++) {
      for (let x = 0; x < this.gameState.boardWidth; x++) {
        const color = this.gameState.board[y][x];
        
        if (this.gameState.clearing && this.gameState.clearRows.includes(y)) {
          this.ctx.fillStyle = '#fff';
        } else if (color) {
          const gradient = this.ctx.createLinearGradient(boardX + x * cellSize, boardY + y * cellSize, boardX + x * cellSize + cellSize, boardY + y * cellSize + cellSize);
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, this.darkenColor(color, 30));
          this.ctx.fillStyle = gradient;
        } else {
          this.ctx.fillStyle = '#0f0f1a';
        }
        
        this.ctx.fillRect(boardX + x * cellSize + 1, boardY + y * cellSize + 1, cellSize - 2, cellSize - 2);
      }
    }
    
    if (this.gameState.ghostPiece) {
      const gp = this.gameState.ghostPiece;
      this.ctx.globalAlpha = 0.3;
      
      for (let r = 0; r < gp.cells.length; r++) {
        for (let c = 0; c < gp.cells[r].length; c++) {
          if (gp.cells[r][c]) {
            this.ctx.fillStyle = gp.color;
            this.ctx.fillRect(boardX + (gp.x + c) * cellSize + 1, boardY + (gp.y + r) * cellSize + 1, cellSize - 2, cellSize - 2);
          }
        }
      }
      
      this.ctx.globalAlpha = 1;
    }
    
    if (this.gameState.currentPiece) {
      const p = this.gameState.currentPiece;
      
      for (let r = 0; r < p.cells.length; r++) {
        for (let c = 0; c < p.cells[r].length; c++) {
          if (p.cells[r][c]) {
            const gradient = this.ctx.createLinearGradient(boardX + (p.x + c) * cellSize, boardY + (p.y + r) * cellSize, boardX + (p.x + c) * cellSize + cellSize, boardY + (p.y + r) * cellSize + cellSize);
            gradient.addColorStop(0, p.color);
            gradient.addColorStop(1, this.darkenColor(p.color, 30));
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(boardX + (p.x + c) * cellSize + 1, boardY + (p.y + r) * cellSize + 1, cellSize - 2, cellSize - 2);
          }
        }
      }
    }
    
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(550, 150, 100, 100);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '14px Arial';
    this.ctx.fillText('NEXT', 600, 140);
    
    if (this.gameState.nextPiece) {
      const np = this.gameState.nextPiece;
      const offsetX = 600 - (np.cells[0].length * 15) / 2;
      const offsetY = 185;
      
      for (let r = 0; r < np.cells.length; r++) {
        for (let c = 0; c < np.cells[r].length; c++) {
          if (np.cells[r][c]) {
            this.ctx.fillStyle = np.color;
            this.ctx.fillRect(offsetX + c * 15, offsetY + r * 15, 13, 13);
          }
        }
      }
    }
    
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(150, 150, 80, 80);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '14px Arial';
    this.ctx.fillText('HOLD', 190, 140);
    
    if (this.gameState.hold) {
      const hp = this.gameState.hold;
      const offsetX = 190 - (hp.cells[0].length * 15) / 2;
      const offsetY = 185;
      
      for (let r = 0; r < hp.cells.length; r++) {
        for (let c = 0; c < hp.cells[r].length; c++) {
          if (hp.cells[r][c]) {
            this.ctx.fillStyle = hp.color;
            this.ctx.fillRect(offsetX + c * 15, offsetY + r * 15, 13, 13);
          }
        }
      }
    }
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Score: ' + this.gameState.score, 20, 40);
    this.ctx.fillText('Lines: ' + this.gameState.lines, 20, 65);
    this.ctx.fillText('Level: ' + this.gameState.level, 20, 90);
    
    this.ctx.fillStyle = '#00f0f0';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('TETRIS', 400, 25);
    
    if (this.gameState.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, 800, 600);
      this.ctx.fillStyle = '#ff0000';
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillText('GAME OVER', 400, 300);
    }
  }
  
  darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    
    if (input.left) {
      if (this.canMove(this.gameState.currentPiece.x - 1, this.gameState.currentPiece.y)) {
        this.gameState.currentPiece.x--;
        this.updateGhost();
      }
    }
    if (input.right) {
      if (this.canMove(this.gameState.currentPiece.x + 1, this.gameState.currentPiece.y)) {
        this.gameState.currentPiece.x++;
        this.updateGhost();
      }
    }
    if (input.down) this.moveDown();
    if (input.up) this.rotate();
    if (input.action) this.holdPiece();
  }
}

window.TetrisComplexGame = TetrisComplexGame;