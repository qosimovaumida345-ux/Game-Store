// Chess Grandmaster - Strategy Game
class ChessGame {
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
      turn: 'white',
      selectedPiece: null,
      validMoves: [],
      captured: [],
      status: 'playing',
      board: [],
      lastMove: null,
      check: false,
      movesHistory: []
    };
    
    this.setupBoard();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  setupBoard() {
    const initialBoard = [
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];
    
    this.gameState.board = initialBoard.map(row => row.map(piece => piece ? { type: piece, hasMoved: false } : null));
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
  
  getPieceColor(piece) {
    return piece && piece.type === piece.type.toUpperCase() ? 'white' : 'black';
  }
  
  isValidMove(fromRow, fromCol, toRow, toCol) {
    const piece = this.gameState.board[fromRow][fromCol];
    if (!piece) return false;
    
    const target = this.gameState.board[toRow][toCol];
    if (target && this.getPieceColor(target) === this.getPieceColor(piece)) return false;
    
    const color = this.getPieceColor(piece);
    if (this.gameState.turn !== color) return false;
    
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    const pieceType = piece.type.toLowerCase();
    
    const moves = {
      p: () => {
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;
        
        if (colDiff === 0 && !target) {
          if (rowDiff === direction) return true;
          if (fromRow === startRow && rowDiff === 2 * direction && !this.gameState.board[fromRow + direction][fromCol]) return true;
        }
        if (Math.abs(colDiff) === 1 && rowDiff === direction && target) return true;
        return false;
      },
      r: () => this.isStraightMove(fromRow, fromCol, toRow, toCol),
      n: () => (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 1) || (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 2),
      b: () => this.isDiagonalMove(fromRow, fromCol, toRow, toCol),
      q: () => this.isStraightMove(fromRow, fromCol, toRow, toCol) || this.isDiagonalMove(fromRow, fromCol, toRow, toCol),
      k: () => Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1
    };
    
    return moves[pieceType] ? moves[pieceType]() : false;
  }
  
  isStraightMove(fromRow, fromCol, toRow, toCol) {
    if (fromRow !== toRow && fromCol !== toCol) return false;
    
    const rowStep = fromRow === toRow ? 0 : (toRow > fromRow ? 1 : -1);
    const colStep = fromCol === toCol ? 0 : (toCol > fromCol ? 1 : -1);
    
    let r = fromRow + rowStep;
    let c = fromCol + colStep;
    
    while (r !== toRow || c !== toCol) {
      if (this.gameState.board[r][c]) return false;
      r += rowStep;
      c += colStep;
    }
    return true;
  }
  
  isDiagonalMove(fromRow, fromCol, toRow, toCol) {
    if (Math.abs(rowDiff) !== Math.abs(colDiff)) return false;
    
    const rowStep = toRow > fromRow ? 1 : -1;
    const colStep = toCol > fromCol ? 1 : -1;
    
    let r = fromRow + rowStep;
    let c = fromCol + colStep;
    
    while (r !== toRow && c !== toCol) {
      if (this.gameState.board[r][c]) return false;
      r += rowStep;
      c += colStep;
    }
    return true;
  }
  
  movePiece(fromRow, fromCol, toRow, toCol) {
    const piece = this.gameState.board[fromRow][fromCol];
    const target = this.gameState.board[toRow][toCol];
    
    if (target) {
      this.gameState.captured.push(target.type);
    }
    
    this.gameState.board[toRow][toCol] = piece;
    this.gameState.board[fromRow][fromCol] = null;
    piece.hasMoved = true;
    
    this.gameState.lastMove = { from: { r: fromRow, c: fromCol }, to: { r: toRow, c: toCol } };
    this.gameState.movesHistory.push({ from: fromRow + ',' + fromCol, to: toRow + ',' + toCol });
    
    this.gameState.turn = this.gameState.turn === 'white' ? 'black' : 'white';
  }
  
  handleClick(row, col) {
    if (this.gameState.status !== 'playing') return;
    
    if (this.gameState.selectedPiece) {
      const { row: fromRow, col: fromCol } = this.gameState.selectedPiece;
      
      if (this.isValidMove(fromRow, fromCol, row, col)) {
        this.movePiece(fromRow, fromCol, row, col);
        this.gameState.selectedPiece = null;
        this.gameState.validMoves = [];
        
        this.checkCheck();
        
        if (this.isCheckmate()) {
          this.gameState.status = 'checkmate';
        }
      } else {
        this.gameState.selectedPiece = null;
        this.gameState.validMoves = [];
      }
    }
    
    const piece = this.gameState.board[row][col];
    if (piece && this.getPieceColor(piece) === this.gameState.turn) {
      this.gameState.selectedPiece = { row, col };
      this.gameState.validMoves = this.getAllValidMoves(row, col);
    }
  }
  
  getAllValidMoves(row, col) {
    const moves = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.isValidMove(row, col, r, c)) {
          moves.push({ row: r, col: c });
        }
      }
    }
    return moves;
  }
  
  checkCheck() {
    const kingColor = this.gameState.turn;
    const kingPos = this.findKing(kingColor);
    if (!kingPos) return;
    
    const opponentColor = kingColor === 'white' ? 'black' : 'white';
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.gameState.board[r][c];
        if (piece && this.getPieceColor(piece) === opponentColor) {
          if (this.isValidMove(r, c, kingPos.row, kingPos.col)) {
            this.gameState.check = true;
            return;
          }
        }
      }
    }
    this.gameState.check = false;
  }
  
  findKing(color) {
    const kingType = color === 'white' ? 'K' : 'k';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.gameState.board[r][c];
        if (piece && piece.type === kingType) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }
  
  isCheckmate() {
    if (!this.gameState.check) return false;
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.gameState.board[r][c];
        if (piece && this.getPieceColor(piece) === this.gameState.turn) {
          const moves = this.getAllValidMoves(r, c);
          if (moves.length > 0) return false;
        }
      }
    }
    return true;
  }
  
  render() {
    this.ctx.fillStyle = '#2d2d2d';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const boardSize = Math.min(this.canvas.width, this.canvas.height) - 100;
    const cellSize = boardSize / 8;
    const offsetX = (this.canvas.width - boardSize) / 2;
    const offsetY = 50;
    
    this.drawBoard(cellSize, offsetX, offsetY);
    this.drawPieces(cellSize, offsetX, offsetY);
    this.drawValidMoves(cellSize, offsetX, offsetY);
    this.drawUI();
    
    if (this.gameState.status === 'checkmate') {
      this.drawCheckmate();
    }
  }
  
  drawBoard(cellSize, offsetX, offsetY) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        this.ctx.fillStyle = (r + c) % 2 === 0 ? '#f0d9b5' : '#b58863';
        this.ctx.fillRect(offsetX + c * cellSize, offsetY + r * cellSize, cellSize, cellSize);
      }
    }
  }
  
  drawPieces(cellSize, offsetX, offsetY) {
    const pieces = {
      'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
      'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
    };
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.gameState.board[r][c];
        if (!piece) continue;
        
        const isWhite = piece.type === piece.type.toUpperCase();
        
        this.ctx.fillStyle = isWhite ? '#fff' : '#000';
        this.ctx.strokeStyle = isWhite ? '#000' : '#fff';
        this.ctx.lineWidth = 2;
        
        if (this.gameState.check) {
          const kingPos = this.findKing(this.gameState.turn);
          if (kingPos && kingPos.row === r && kingPos.col === c) {
            this.ctx.fillStyle = '#ff0000';
          }
        }
        
        this.ctx.font = `${cellSize * 0.8}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(pieces[piece.type], offsetX + c * cellSize + cellSize / 2, offsetY + r * cellSize + cellSize / 2);
        
        if (this.gameState.selectedPiece && this.gameState.selectedPiece.row === r && this.gameState.selectedPiece.col === c) {
          this.ctx.strokeStyle = '#ffd93d';
          this.ctx.strokeRect(offsetX + c * cellSize + 2, offsetY + r * cellSize + 2, cellSize - 4, cellSize - 4);
        }
      }
    }
  }
  
  drawValidMoves(cellSize, offsetX, offsetY) {
    if (!this.gameState.validMoves.length) return;
    
    this.ctx.fillStyle = 'rgba(100, 200, 100, 0.5)';
    this.gameState.validMoves.forEach(move => {
      this.ctx.beginPath(
        offsetX + move.col * cellSize + cellSize / 2,
        offsetY + move.row * cellSize + cellSize / 2,
        cellSize * 0.3
      );
      this.ctx.arc(offsetX + move.col * cellSize + cellSize / 2, offsetY + move.row * cellSize + cellSize / 2, cellSize * 0.2, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawUI() {
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('CHESS', this.canvas.width / 2, 30);
    
    this.ctx.font = '18px Arial';
    this.ctx.fillStyle = this.gameState.turn === 'white' ? '#fff' : '#aaa';
    this.ctx.fillText(`Turn: ${this.gameState.turn.toUpperCase()}`, this.canvas.width - 100, 30);
    
    if (this.gameState.captured.length > 0) {
      this.ctx.fillStyle = '#ffd93d';
      this.ctx.font = '14px Arial';
      this.ctx.fillText(`Captured: ${this.gameState.captured.join(' ')}`, 100, 30);
    }
  }
  
  drawCheckmate() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ff0000';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('CHECKMATE!', this.canvas.width / 2, this.canvas.height / 2);
    
    const winner = this.gameState.turn === 'white' ? 'BLACK' : 'WHITE';
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`${winner} WINS!`, this.canvas.width / 2, this.canvas.height / 2 + 50);
  }
  
  updatePlayerInput(name, input) {}
}

window.ChessGame = ChessGame;