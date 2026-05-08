// Connect Four Game
class ConnectFourGame {
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
      currentPlayer: 1,
      board: [],
      selectedColumn: 0,
      winner: null,
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
    for (let row = 0; row < 6; row++) {
      this.gameState.board[row] = [];
      for (let col = 0; col < 7; col++) {
        this.gameState.board[row][col] = 0;
      }
    }
  }
  
  dropPiece(col) {
    if (this.gameState.gameOver || this.gameState.winner) return false;
    
    for (let row = 5; row >= 0; row--) {
      if (this.gameState.board[row][col] === 0) {
        this.gameState.board[row][col] = this.gameState.currentPlayer;
        
        if (this.checkWin(row, col)) {
          this.gameState.winner = this.gameState.currentPlayer;
          this.gameState.gameOver = true;
        } else {
          this.gameState.currentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;
        }
        
        return true;
      }
    }
    
    return false;
  }
  
  checkWin(row, col) {
    const player = this.gameState.board[row][col];
    const directions = [
      { dr: 0, dc: 1 },
      { dr: 1, dc: 0 },
      { dr: 1, dc: 1 },
      { dr: 1, dc: -1 }
    ];
    
    for (const { dr, dc } of directions) {
      let count = 1;
      
      for (let i = 1; i < 4; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        
        if (r < 0 || r >= 6 || c < 0 || c >= 7 || this.gameState.board[r][c] !== player) break;
        count++;
      }
      
      for (let i = 1; i < 4; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        
        if (r < 0 || r >= 6 || c < 0 || c >= 7 || this.gameState.board[r][c] !== player) break;
        count++;
      }
      
      if (count >= 4) return true;
    }
    
    return false;
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
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (input.left) {
      this.gameState.selectedColumn = Math.max(0, this.gameState.selectedColumn - 1);
    }
    if (input.right) {
      this.gameState.selectedColumn = Math.min(6, this.gameState.selectedColumn + 1);
    }
    if (input.action || input.a || input.b) {
      this.dropPiece(this.gameState.selectedColumn);
    }
  }
  
  render() {
    this.drawBackground();
    this.drawBoard();
    this.drawPieces();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#2c3e50');
    gradient.addColorStop(1, '#34495e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawBoard() {
    const boardX = 100;
    const boardY = 80;
    const cellSize = 60;
    const boardWidth = 7 * cellSize;
    const boardHeight = 6 * cellSize;
    
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillRect(boardX - 10, boardY - 10, boardWidth + 20, boardHeight + 20);
    
    this.ctx.fillStyle = '#2980b9';
    this.ctx.fillRect(boardX, boardY, boardWidth, boardHeight);
    
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        const x = boardX + col * cellSize;
        const y = boardY + row * cellSize;
        
        this.ctx.fillStyle = '#2980b9';
        this.ctx.beginPath();
        this.ctx.arc(x + cellSize/2, y + cellSize/2, cellSize/2 - 5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }
  
  drawPieces() {
    const boardX = 100;
    const boardY = 80;
    const cellSize = 60;
    
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        const cell = this.gameState.board[row][col];
        
        if (cell === 0) continue;
        
        const x = boardX + col * cellSize + cellSize/2;
        const y = boardY + row * cellSize + cellSize/2;
        
        const gradient = this.ctx.createRadialGradient(x - 10, y - 10, 0, x, y, 25);
        
        if (cell === 1) {
          gradient.addColorStop(0, '#e74c3c');
          gradient.addColorStop(1, '#c0392b');
        } else {
          gradient.addColorStop(0, '#f1c40f');
          gradient.addColorStop(1, '#f39c12');
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 22, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    
    const selectorX = 100 + this.gameState.selectedColumn * cellSize + cellSize/2;
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(selectorX, 60, 20, 0, Math.PI * 2);
    this.ctx.stroke();
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, 10, 150, 60);
    
    const player = this.gameState.currentPlayer;
    this.ctx.fillStyle = player === 1 ? '#e74c3c' : '#f1c40f';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Player ${player}'s Turn`, 20, 35);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('CONNECT 4', this.canvas.width / 2, 25);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const winner = this.gameState.winner;
    const color = winner === 1 ? '#e74c3c' : '#f1c40f';
    
    this.ctx.fillStyle = color;
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Player ${winner} Wins!`, this.canvas.width / 2, this.canvas.height / 2);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.ConnectFourGame = ConnectFourGame;