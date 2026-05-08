// Tetris Game
class TetrisClassicGame {
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
      level: 1,
      lines: 0,
      status: 'playing',
      board: [],
      currentPiece: null,
      gameOver: false
    };
    
    this.config = {
      cols: 10,
      rows: 20,
      blockSize: 25,
      dropInterval: 1000
    };
    
    this.pieces = [
      { shape: [[1,1,1,1]], color: '#00ffff' },
      { shape: [[1,1],[1,1]], color: '#ffff00' },
      { shape: [[0,1,1],[1,1,0]], color: '#00ff00' },
      { shape: [[1,1,0],[0,1,1]], color: '#ff0000' },
      { shape: [[1,0,0],[1,1,1]], color: '#0000ff' },
      { shape: [[0,0,1],[1,1,1]], color: '#ff8800' },
      { shape: [[0,1,0],[1,1,1]], color: '#8800ff' }
    ];
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 400;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.board = Array(this.config.rows).fill(null).map(() => 
      Array(this.config.cols).fill(0)
    );
    
    this.gameState.currentPiece = this.createNewPiece();
  }
  
  createNewPiece() {
    const piece = this.pieces[Math.floor(Math.random() * this.pieces.length)];
    return {
      shape: piece.shape.map(row => [...row]),
      color: piece.color,
      x: Math.floor((this.config.cols - piece.shape[0].length) / 2),
      y: 0
    };
  }
  
  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.dropTimer = 0;
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
    
    const dropInterval = Math.max(100, this.config.dropInterval - (this.gameState.level - 1) * 100);
    this.dropTimer += deltaTime * 1000;
    
    if (this.dropTimer >= dropInterval) {
      this.dropPiece();
      this.dropTimer = 0;
    }
  }
  
  dropPiece() {
    const piece = this.gameState.currentPiece;
    piece.y++;
    
    if (this.checkCollision(piece, this.gameState.board)) {
      piece.y--;
      this.lockPiece();
      this.clearLines();
      
      this.gameState.currentPiece = this.createNewPiece();
      
      if (this.checkCollision(this.gameState.currentPiece, this.gameState.board)) {
        this.gameState.gameOver = true;
      }
    }
  }
  
  checkCollision(piece, board) {
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          const newX = piece.x + c;
          const newY = piece.y + r;
          
          if (newX < 0 || newX >= this.config.cols || newY >= this.config.rows) return true;
          if (newY >= 0 && board[newY][newX]) return true;
        }
      }
    }
    return false;
  }
  
  lockPiece() {
    const piece = this.gameState.currentPiece;
    const board = this.gameState.board;
    
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          const y = piece.y + r;
          const x = piece.x + c;
          if (y >= 0) board[y][x] = piece.color;
        }
      }
    }
  }
  
  clearLines() {
    let linesCleared = 0;
    
    for (let r = this.config.rows - 1; r >= 0; r--) {
      if (this.gameState.board[r].every(cell => cell !== 0)) {
        this.gameState.board.splice(r, 1);
        this.gameState.board.unshift(Array(this.config.cols).fill(0));
        linesCleared++;
        r++;
      }
    }
    
    if (linesCleared > 0) {
      this.gameState.lines += linesCleared;
      this.gameState.score += linesCleared * 100 * this.gameState.level;
      this.gameState.level = Math.floor(this.gameState.lines / 10) + 1;
    }
  }
  
  movePiece(direction) {
    const piece = this.gameState.currentPiece;
    
    if (direction === 'left') piece.x = Math.max(0, piece.x - 1);
    if (direction === 'right') piece.x = Math.min(this.config.cols - piece.shape[0].length, piece.x + 1);
    if (direction === 'down') this.dropPiece();
    
    if (this.checkCollision(piece, this.gameState.board)) {
      if (direction === 'left') piece.x++;
      if (direction === 'right') piece.x--;
      if (direction === 'down') piece.y--;
    }
  }
  
  rotatePiece() {
    const piece = this.gameState.currentPiece;
    const rows = piece.shape.length;
    const cols = piece.shape[0].length;
    const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0));
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        rotated[c][rows - 1 - r] = piece.shape[r][c];
      }
    }
    
    const original = piece.shape;
    piece.shape = rotated;
    
    if (this.checkCollision(piece, this.gameState.board)) {
      piece.shape = original;
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (input.left) this.movePiece('left');
    if (input.right) this.movePiece('right');
    if (input.down) this.movePiece('down');
    if (input.up) this.rotatePiece();
  }
  
  render() {
    this.drawBackground();
    this.drawBoard();
    this.drawCurrentPiece();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawBoard() {
    const board = this.gameState.board;
    const blockSize = this.config.blockSize;
    const offsetX = 25;
    const offsetY = 50;
    
    for (let r = 0; r < this.config.rows; r++) {
      for (let c = 0; c < this.config.cols; c++) {
        const cell = board[r][c];
        
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(offsetX + c * blockSize, offsetY + r * blockSize, blockSize, blockSize);
        
        if (cell) {
          this.ctx.fillStyle = cell;
          this.ctx.fillRect(offsetX + c * blockSize + 1, offsetY + r * blockSize + 1, blockSize - 2, blockSize - 2);
          
          this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
          this.ctx.fillRect(offsetX + c * blockSize + 1, offsetY + r * blockSize + 1, blockSize - 2, 5);
        }
      }
    }
  }
  
  drawCurrentPiece() {
    const piece = this.gameState.currentPiece;
    const blockSize = this.config.blockSize;
    const offsetX = 25;
    const offsetY = 50;
    
    this.ctx.fillStyle = piece.color;
    
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          this.ctx.fillRect(
            offsetX + (piece.x + c) * blockSize + 1,
            offsetY + (piece.y + r) * blockSize + 1,
            blockSize - 2,
            blockSize - 2
          );
          
          this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
          this.ctx.fillRect(
            offsetX + (piece.x + c) * blockSize + 1,
            offsetY + (piece.y + r) * blockSize + 1,
            blockSize - 2,
            5
          );
          
          this.ctx.fillStyle = piece.color;
        }
      }
    }
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 120, 70);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    this.ctx.fillText(`Level: ${this.gameState.level}`, 20, 50);
    this.ctx.fillText(`Lines: ${this.gameState.lines}`, 20, 70);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('TETRIS', this.canvas.width / 2, 30);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.TetrisClassicGame = TetrisClassicGame;