// Tetris Blitz - Arcade Game
class TetrisBlitzGame {
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
      boards: {},
      currentPieces: {},
      gameOver: false
    };
    
    this.config = {
      cols: 10,
      rows: 20,
      blockSize: 25,
      dropInterval: 1000,
      fastDropInterval: 50
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
    
    this.players.forEach(p => this.initPlayer(p));
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initPlayer(player) {
    const board = Array(this.config.rows).fill(null).map(() => Array(this.config.cols).fill(0));
    
    this.gameState.boards[player] = board;
    this.gameState.currentPieces[player] = this.createNewPiece();
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
    this.gameState.time += deltaTime;
    
    const dropInterval = this.config.dropInterval - (this.gameState.level - 1) * 100;
    this.dropTimer += deltaTime * 1000;
    
    if (this.dropTimer >= Math.max(100, dropInterval)) {
      this.dropPieces();
      this.dropTimer = 0;
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  movePiece(playerName, direction) {
    const piece = this.gameState.currentPieces[playerName];
    const board = this.gameState.boards[playerName];
    
    if (direction === 'left') piece.x = Math.max(0, piece.x - 1);
    if (direction === 'right') piece.x = Math.min(this.config.cols - piece.shape[0].length, piece.x + 1);
    if (direction === 'down') this.dropPieces();
    if (direction === 'rotate') this.rotatePiece(piece);
  }
  
  rotatePiece(piece) {
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
    
    if (this.checkCollision(piece, this.gameState.boards[this.players[0]])) {
      piece.shape = original;
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
  
  lockPiece(playerName) {
    const piece = this.gameState.currentPieces[playerName];
    const board = this.gameState.boards[playerName];
    
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          const y = piece.y + r;
          const x = piece.x + c;
          if (y >= 0) board[y][x] = piece.color;
        }
      }
    }
    
    this.clearLines(board);
    this.gameState.currentPieces[playerName] = this.createNewPiece();
    
    if (this.checkCollision(this.gameState.currentPieces[playerName], board)) {
      this.gameState.gameOver = true;
    }
  }
  
  clearLines(board) {
    let linesCleared = 0;
    
    for (let r = this.config.rows - 1; r >= 0; r--) {
      if (board[r].every(cell => cell !== 0)) {
        board.splice(r, 1);
        board.unshift(Array(this.config.cols).fill(0));
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
  
  dropPieces() {
    this.players.forEach(player => {
      const piece = this.gameState.currentPieces[player];
      piece.y++;
      
      if (this.checkCollision(piece, this.gameState.boards[player])) {
        piece.y--;
        this.lockPiece(player);
      }
    });
  }
  
  render() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const boardWidth = this.config.cols * this.config.blockSize;
    const boardHeight = this.config.rows * this.config.blockSize;
    const totalBoards = this.players.length;
    const boardSpacing = 20;
    const totalWidth = totalBoards * boardWidth + (totalBoards - 1) * boardSpacing;
    const startX = (this.canvas.width - totalWidth) / 2;
    
    this.players.forEach((player, index) => {
      const boardX = startX + index * (boardWidth + boardSpacing);
      const boardY = 50;
      
      this.drawBoard(this.gameState.boards[player], boardX, boardY);
      this.drawPiece(this.gameState.currentPieces[player], boardX, boardY);
      this.drawPlayerInfo(player, boardX, boardY, boardHeight);
    });
    
    this.drawUI();
    
    if (this.gameState.gameOver) {
      this.drawGameOver();
    }
  }
  
  drawBoard(board, x, y) {
    for (let r = 0; r < this.config.rows; r++) {
      for (let c = 0; c < this.config.cols; c++) {
        const cell = board[r][c];
        
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x + c * this.config.blockSize, y + r * this.config.blockSize, this.config.blockSize, this.config.blockSize);
        
        if (cell) {
          this.ctx.fillStyle = cell;
          this.ctx.fillRect(x + c * this.config.blockSize + 1, y + r * this.config.blockSize + 1, this.config.blockSize - 2, this.config.blockSize - 2);
          
          this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
          this.ctx.fillRect(x + c * this.config.blockSize + 1, y + r * this.config.blockSize + 1, this.config.blockSize - 2, 5);
        }
      }
    }
  }
  
  drawPiece(piece, boardX, boardY) {
    this.ctx.fillStyle = piece.color;
    
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          this.ctx.fillRect(
            boardX + (piece.x + c) * this.config.blockSize + 1,
            boardY + (piece.y + r) * this.config.blockSize + 1,
            this.config.blockSize - 2,
            this.config.blockSize - 2
          );
        }
      }
    }
  }
  
  drawPlayerInfo(player, boardX, boardY, boardHeight) {
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(player, boardX + this.config.cols * this.config.blockSize / 2, boardY + boardHeight + 25);
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 150, 80);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    this.ctx.fillText(`Level: ${this.gameState.level}`, 20, 50);
    this.ctx.fillText(`Lines: ${this.gameState.lines}`, 20, 70);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('TETRIS BLITZ', this.canvas.width / 2, 30);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ff0000';
    this.ctx.font = 'bold 60px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    
    if (input.left) this.movePiece(name, 'left');
    if (input.right) this.movePiece(name, 'right');
    if (input.down) this.dropPieces();
    if (input.up) this.movePiece(name, 'rotate');
  }
}

window.TetrisBlitzGame = TetrisBlitzGame;