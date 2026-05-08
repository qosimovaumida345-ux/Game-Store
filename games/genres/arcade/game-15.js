// Tetris Classic Game
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
      lines: 0,
      level: 1,
      board: [],
      currentPiece: null,
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
    this.gameState.board = Array(20).fill(null).map(() => Array(10).fill(0));
    this.spawnPiece();
  }
  
  spawnPiece() {
    const shapes = [
      [[1,1,1,1]],
      [[1,1],[1,1]],
      [[1,1,1],[0,1,0]],
      [[1,1,1],[1,0,0]],
      [[1,1,1],[0,0,1]],
      [[1,1,0],[0,1,1]],
      [[0,1,1],[1,1,0]]
    ];
    const colors = [1,2,3,4,5,6,7];
    const idx = Math.floor(Math.random() * shapes.length);
    this.gameState.currentPiece = {
      shape: shapes[idx],
      color: colors[idx],
      x: 3,
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
    this.dropTimer += deltaTime;
    
    const dropSpeed = Math.max(0.1, 1 - this.gameState.level * 0.1);
    if (this.dropTimer >= dropSpeed) {
      this.dropTimer = 0;
      this.movePiece(0, 1);
    }
  }
  
  movePiece(dx, dy) {
    const piece = this.gameState.currentPiece;
    if (!this.canMove(piece.x + dx, piece.y + dy)) {
      if (dy > 0) this.lockPiece();
      return false;
    }
    piece.x += dx;
    piece.y += dy;
    return true;
  }
  
  canMove(newX, newY) {
    const piece = this.gameState.currentPiece;
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          const x = newX + c;
          const y = newY + r;
          if (x < 0 || x >= 10 || y >= 20) return false;
          if (y >= 0 && this.gameState.board[y][x]) return false;
        }
      }
    }
    return true;
  }
  
  lockPiece() {
    const piece = this.gameState.currentPiece;
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          const y = piece.y + r;
          if (y < 0) { this.gameState.gameOver = true; return; }
          this.gameState.board[y][piece.x + c] = piece.color;
        }
      }
    }
    this.clearLines();
    this.spawnPiece();
  }
  
  clearLines() {
    for (let y = 19; y >= 0; y--) {
      if (this.gameState.board[y].every(cell => cell !== 0)) {
        this.gameState.board.splice(y, 1);
        this.gameState.board.unshift(Array(10).fill(0));
        this.gameState.score += 100 * this.gameState.level;
        this.gameState.lines++;
        if (this.gameState.lines % 10 === 0) this.gameState.level++;
        y++;
      }
    }
  }
  
  rotatePiece() {
    const piece = this.gameState.currentPiece;
    const rotated = piece.shape[0].map((_, i) => piece.shape.map(row => row[i]).reverse());
    const oldShape = piece.shape;
    piece.shape = rotated;
    if (!this.canMove(piece.x, piece.y)) piece.shape = oldShape;
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input) {
    if (input.left) this.movePiece(-1, 0);
    if (input.right) this.movePiece(1, 0);
    if (input.down) this.movePiece(0, 1);
    if (input.action || input.a) this.rotatePiece();
  }
  
  render() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const offsetX = 150;
    const cellSize = 25;
    
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(offsetX, 20, cellSize * 10, cellSize * 20);
    this.ctx.strokeStyle = '#fff';
    this.ctx.strokeRect(offsetX, 20, cellSize * 10, cellSize * 20);
    
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 10; x++) {
        if (this.gameState.board[y][x]) {
          this.ctx.fillStyle = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#1abc9c'][this.gameState.board[y][x] - 1];
          this.ctx.fillRect(offsetX + x * cellSize + 1, 20 + y * cellSize + 1, cellSize - 2, cellSize - 2);
        }
      }
    }
    
    const piece = this.gameState.currentPiece;
    piece.shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          this.ctx.fillStyle = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#1abc9c'][piece.color - 1];
          this.ctx.fillRect(offsetX + (piece.x + c) * cellSize + 1, 20 + (piece.y + r) * cellSize + 1, cellSize - 2, cellSize - 2);
        }
      });
    });
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Score: ' + this.gameState.score, 20, 40);
    this.ctx.fillText('Lines: ' + this.gameState.lines, 20, 60);
    this.ctx.fillText('Level: ' + this.gameState.level, 20, 80);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('TETRIS', this.canvas.width / 2, 25);
    
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
    this.handleInput(input);
  }
}

window.TetrisClassicGame = TetrisClassicGame;