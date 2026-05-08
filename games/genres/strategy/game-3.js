// Tic Tac Toe
class TicTacToeGame {
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
      board: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null,
      time: 0,
      status: 'playing'
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 400;
    this.canvas.height = this.canvas.parentElement.clientHeight || 450;
  }
  
  initGame() {}
  
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
  
  play(index) {
    if (this.gameState.board[index] || this.gameState.winner) return;
    
    this.gameState.board[index] = this.gameState.currentPlayer;
    this.checkWin();
    this.gameState.currentPlayer = this.gameState.currentPlayer === 'X' ? 'O' : 'X';
  }
  
  checkWin() {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    const board = this.gameState.board;
    
    for (let [a,b,c] of wins) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        this.gameState.winner = board[a];
        this.gameState.status = 'won';
      }
    }
    
    if (!this.gameState.winner && !board.includes(null)) {
      this.gameState.status = 'draw';
    }
  }
  
  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const { board, currentPlayer, winner } = this.gameState;
    const cellSize = 100;
    const startX = 50;
    const startY = 80;
    
    // Grid
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 5;
    for (let i = 0; i <= 3; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(startX + i * cellSize, startY);
      this.ctx.lineTo(startX + i * cellSize, startY + cellSize * 3);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY + i * cellSize);
      this.ctx.lineTo(startX + cellSize * 3, startY + i * cellSize);
      this.ctx.stroke();
    }
    
    // X and O
    board.forEach((cell, i) => {
      if (!cell) return;
      const x = startX + (i % 3) * cellSize + cellSize / 2;
      const y = startY + Math.floor(i / 3) * cellSize + cellSize / 2;
      
      this.ctx.font = 'bold 60px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillStyle = cell === 'X' ? '#e74c3c' : '#3498db';
      this.ctx.fillText(cell, x, y);
    });
    
    // UI
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    if (winner) {
      this.ctx.fillText(`Winner: ${winner}!`, this.canvas.width / 2, 40);
    } else {
      this.ctx.fillText(`Turn: Player ${currentPlayer}`, this.canvas.width / 2, 40);
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.TicTacToeGame = TicTacToeGame;