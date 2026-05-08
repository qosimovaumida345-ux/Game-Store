// Checkers Game
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
      time: 0,
      board: [],
      currentPlayer: 0,
      selectedPiece: null,
      validMoves: [],
      capturedPieces: [[], []],
      status: 'playing',
      winner: null,
      gameOver: false,
      mustCapture: false,
      multiJump: null
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 600;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.board = [];
    
    for (let r = 0; r < 8; r++) {
      this.gameState.board[r] = [];
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          if (r < 3) {
            this.gameState.board[r][c] = { player: 1, king: false };
          } else if (r > 4) {
            this.gameState.board[r][c] = { player: 0, king: false };
          } else {
            this.gameState.board[r][c] = null;
          }
        } else {
          this.gameState.board[r][c] = null;
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
  
  getValidMoves(row, col) {
    const piece = this.gameState.board[row][col];
    if (!piece) return [];
    
    const moves = [];
    const direction = piece.player === 0 ? 1 : -1;
    const king = piece.king;
    
    const checkMove = (r, c, isJump, jumpOver) => {
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        if (!this.gameState.board[r][c]) {
          if (isJump && jumpOver) {
            moves.push({ row: r, col: c, jump: true, captured: jumpOver });
          } else if (!isJump) {
            moves.push({ row: r, col: c, jump: false });
          }
        }
      }
    };
    
    const directions = king ? [[1, -1], [1, 1], [-1, -1], [-1, 1]] : [[direction, -1], [direction, 1]];
    
    directions.forEach(([dr, dc]) => {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const target = this.gameState.board[newRow][newCol];
        
        if (!target) {
          if (!this.gameState.mustCapture) {
            moves.push({ row: newRow, col: newCol, jump: false });
          }
        } else if (target.player !== piece.player) {
          const jumpRow = newRow + dr;
          const jumpCol = newCol + dc;
          
          if (jumpRow >= 0 && jumpRow < 8 && jumpCol >= 0 && jumpCol < 8 && !this.gameState.board[jumpRow][jumpCol]) {
            moves.push({ row: jumpRow, col: jumpCol, jump: true, captured: { row: newRow, col: newCol } });
          }
        }
      }
    });
    
    return moves;
  }
  
  hasCaptures(row, col) {
    const moves = this.getValidMoves(row, col);
    return moves.some(m => m.jump);
  }
  
  canCapture(player) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.gameState.board[r][c];
        if (piece && piece.player === player && this.hasCaptures(r, c)) {
          return true;
        }
      }
    }
    return false;
  }
  
  selectPiece(row, col) {
    const piece = this.gameState.board[row][col];
    if (!piece || piece.player !== this.gameState.currentPlayer) return;
    
    this.gameState.mustCapture = this.canCapture(this.gameState.currentPlayer);
    
    let moves = this.getValidMoves(row, col);
    
    if (this.gameState.mustCapture) {
      moves = moves.filter(m => m.jump);
    }
    
    if (this.gameState.multiJump) {
      const multiMoves = this.getValidMoves(row, col).filter(m => m.jump);
      if (multiMoves.length > 0) {
        moves = multiMoves;
      }
    }
    
    if (moves.length > 0) {
      this.gameState.selectedPiece = { row, col };
      this.gameState.validMoves = moves;
    }
  }
  
  movePiece(move) {
    const from = this.gameState.selectedPiece;
    const piece = this.gameState.board[from.row][from.col];
    const toRow = move.row;
    const toCol = move.col;
    
    this.gameState.board[toRow][toCol] = piece;
    this.gameState.board[from.row][from.col] = null;
    
    if ((piece.player === 0 && toRow === 7) || (piece.player === 1 && toRow === 0)) {
      piece.king = true;
    }
    
    if (move.jump && move.captured) {
      this.gameState.capturedPieces[this.gameState.currentPlayer].push(this.gameState.board[move.captured.row][move.captured.col]);
      this.gameState.board[move.captured.row][move.captured.col] = null;
    }
    
    this.gameState.selectedPiece = null;
    this.gameState.validMoves = [];
    
    if (move.jump && this.hasCaptures(toRow, toCol) && !piece.king) {
      const pieceAtNew = this.gameState.board[toRow][toCol];
      const direction = pieceAtNew.player === 0 ? 1 : -1;
      if (!pieceAtNew.king && ((pieceAtNew.player === 0 && direction === 1) || (pieceAtNew.player === 1 && direction === -1))) {
        this.gameState.multiJump = { row: toRow, col: toCol };
        return;
      }
    }
    
    this.gameState.multiJump = null;
    this.gameState.currentPlayer = 1 - this.gameState.currentPlayer;
    
    if (this.checkWin()) {
      this.gameState.gameOver = true;
      this.gameState.winner = this.players[1 - this.gameState.currentPlayer];
    }
  }
  
  checkWin() {
    let player0Pieces = 0;
    let player1Pieces = 0;
    let player0Moves = false;
    let player1Moves = false;
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.gameState.board[r][c];
        if (piece) {
          if (piece.player === 0) {
            player0Pieces++;
            if (!player0Moves && this.getValidMoves(r, c).length > 0) player0Moves = true;
          } else {
            player1Pieces++;
            if (!player1Moves && this.getValidMoves(r, c).length > 0) player1Moves = true;
          }
        }
      }
    }
    
    return player0Pieces === 0 || player1Pieces === 0 || (this.gameState.currentPlayer === 0 && !player0Moves) || (this.gameState.currentPlayer === 1 && !player1Moves);
  }
  
  render() {
    this.drawBoard();
    this.drawPieces();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBoard() {
    const size = this.canvas.width / 8;
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        this.ctx.fillStyle = (r + c) % 2 === 0 ? '#f5deb3' : '#8b4513';
        this.ctx.fillRect(c * size, r * size, size, size);
        
        if (this.gameState.selectedPiece && this.gameState.selectedPiece.row === r && this.gameState.selectedPiece.col === c) {
          this.ctx.fillStyle = 'rgba(255,255,0,0.5)';
          this.ctx.fillRect(c * size, r * size, size, size);
        }
        
        if (this.gameState.validMoves.some(m => m.row === r && m.col === c)) {
          this.ctx.fillStyle = 'rgba(0,255,0,0.4)';
          this.ctx.beginPath();
          this.ctx.arc(c * size + size / 2, r * size + size / 2, size / 6, 0, Math.PI * 2);
          this.ctx.fill();
          
          if (this.gameState.validMoves.find(m => m.row === r && m.col === c).jump) {
            this.ctx.strokeStyle = 'rgba(255,0,0,0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(c * size + size / 2, r * size + size / 2, size / 4, 0, Math.PI * 2);
            this.ctx.stroke();
          }
        }
      }
    }
  }
  
  drawPieces() {
    const size = this.canvas.width / 8;
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.gameState.board[r][c];
        if (piece) {
          const x = c * size + size / 2;
          const y = r * size + size / 2;
          
          const gradient = this.ctx.createRadialGradient(x - 5, y - 5, 0, x, y, size / 2 - 5);
          gradient.addColorStop(0, piece.player === 0 ? '#fff' : '#333');
          gradient.addColorStop(1, piece.player === 0 ? '#ccc' : '#000');
          
          this.ctx.fillStyle = gradient;
          this.ctx.beginPath();
          this.ctx.arc(x, y, size / 2 - 8, 0, Math.PI * 2);
          this.ctx.fill();
          
          this.ctx.strokeStyle = '#666';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(x, y, size / 2 - 8, 0, Math.PI * 2);
          this.ctx.stroke();
          
          if (piece.king) {
            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = `${size / 3}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('♔', x, y);
          }
        }
      }
    }
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 150, 60);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    
    const currentPlayer = this.players[this.gameState.currentPlayer];
    this.ctx.fillText(`Turn: ${currentPlayer}`, 20, 35);
    
    const captured0 = this.gameState.capturedPieces[0].length;
    const captured1 = this.gameState.capturedPieces[1].length;
    this.ctx.fillText(`Captured: ${captured0} / ${captured1}`, 20, 60);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('CHECKERS', this.canvas.width / 2, 25);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`${this.gameState.winner} wins!`, this.canvas.width / 2, this.canvas.height / 2 + 30);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.CheckersGame = CheckersGame;