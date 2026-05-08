// Checkers
class CheckersGame {
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
      board: [],
      turn: 'red',
      selected: null,
      validMoves: [],
      time: 0,
      status: 'playing'
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 500;
    this.canvas.height = this.canvas.parentElement.clientHeight || 550;
  }
  
  initGame() {
    this.gameState.board = [];
    for (let row = 0; row < 8; row++) {
      this.gameState.board[row] = [];
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          if (row < 3) this.gameState.board[row][col] = { player: 'black', king: false };
          else if (row > 4) this.gameState.board[row][col] = { player: 'red', king: false };
          else this.gameState.board[row][col] = null;
        } else {
          this.gameState.board[row][col] = null;
        }
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
    this.gameState.time += deltaTime;
  }
  
  render() {
    this.ctx.fillStyle = '#d4a574';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const cellSize = 50;
    const startX = 50;
    const startY = 50;
    const { board, turn, selected } = this.gameState;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        this.ctx.fillStyle = (row + col) % 2 === 0 ? '#f5deb3' : '#8b4513';
        this.ctx.fillRect(startX + col * cellSize, startY + row * cellSize, cellSize, cellSize);
        
        if (selected && selected.row === row && selected.col === col) {
          this.ctx.strokeStyle = '#ffff00';
          this.ctx.lineWidth = 3;
          this.ctx.strokeRect(startX + col * cellSize, startY + row * cellSize, cellSize, cellSize);
        }
        
        const piece = board[row][col];
        if (piece) {
          this.ctx.fillStyle = piece.player === 'red' ? '#e74c3c' : '#000';
          this.ctx.beginPath();
          this.ctx.arc(startX + col * cellSize + cellSize/2, startY + row * cellSize + cellSize/2, 18, 0, Math.PI * 2);
          this.ctx.fill();
          
          if (piece.king) {
            this.ctx.fillStyle = '#f1c40f';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('♔', startX + col * cellSize + cellSize/2, startY + row * cellSize + cellSize/2 + 7);
          }
        }
      }
    }
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Turn: ${turn}`, this.canvas.width / 2, 30);
  }
  
  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.CheckersGame = CheckersGame;