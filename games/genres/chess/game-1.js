// Chess Game
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
      board: [],
      currentPlayer: 0,
      selectedPiece: null,
      validMoves: [],
      capturedPieces: [[], []],
      status: 'playing',
      check: false,
      checkmate: false,
      draw: false,
      winner: null,
      moveHistory: [],
      enPassant: null,
      castling: { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } }
    };
    
    this.pieces = {
      'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
      'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 600;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.board = [
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];
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
    const isWhite = piece === piece.toUpperCase();
    const playerColor = this.gameState.currentPlayer === 0 ? 'white' : 'black';
    
    if ((isWhite && playerColor !== 'white') || (!isWhite && playerColor !== 'black')) {
      return [];
    }
    
    const addMove = (r, c) => {
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const target = this.gameState.board[r][c];
        if (target === '' || (isWhite && target === target.toLowerCase()) || (!isWhite && target === target.toUpperCase())) {
          moves.push({ row: r, col: c });
        }
      }
    };
    
    const addSlide = (dr, dc) => {
      let r = row + dr, c = col + dc;
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const target = this.gameState.board[r][c];
        if (target === '') {
          moves.push({ row: r, col: c });
        } else if ((isWhite && target === target.toLowerCase()) || (!isWhite && target === target.toUpperCase())) {
          moves.push({ row: r, col: c });
          break;
        } else {
          break;
        }
        r += dr;
        c += dc;
      }
    };
    
    switch (piece.toLowerCase()) {
      case 'p':
        const direction = isWhite ? -1 : 1;
        const startRow = isWhite ? 6 : 1;
        
        if (this.gameState.board[row + direction][col] === '') {
          addMove(row + direction, col);
          if (row === startRow && this.gameState.board[row + 2 * direction][col] === '') {
            addMove(row + 2 * direction, col);
          }
        }
        
        [-1, 1].forEach(dc => {
          const r = row + direction, c = col + dc;
          if (r >= 0 && r < 8 && c >= 0 && c < 8) {
            const target = this.gameState.board[r][c];
            if (target && ((isWhite && target === target.toLowerCase()) || (!isWhite && target === target.toUpperCase()))) {
              moves.push({ row: r, col: c });
            }
          }
        });
        break;
        
      case 'r':
        addSlide(1, 0); addSlide(-1, 0); addSlide(0, 1); addSlide(0, -1);
        break;
        
      case 'b':
        addSlide(1, 1); addSlide(1, -1); addSlide(-1, 1); addSlide(-1, -1);
        break;
        
      case 'q':
        addSlide(1, 0); addSlide(-1, 0); addSlide(0, 1); addSlide(0, -1);
        addSlide(1, 1); addSlide(1, -1); addSlide(-1, 1); addSlide(-1, -1);
        break;
        
      case 'n':
        [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => addMove(row + dr, col + dc));
        break;
        
      case 'k':
        [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr, dc]) => addMove(row + dr, col + dc));
        break;
    }
    
    return moves.filter(move => !this.wouldBeInCheck(row, col, move.row, move.col));
  }
  
  wouldBeInCheck(fromRow, fromCol, toRow, toCol) {
    const board = this.gameState.board.map(row => [...row]);
    board[toRow][toCol] = board[fromRow][fromCol];
    board[fromRow][fromCol] = '';
    
    const isWhite = board[toRow][toCol] === board[toRow][toCol].toUpperCase();
    const kingColor = isWhite ? 'white' : 'black';
    
    let kingRow, kingCol;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && ((isWhite && p === 'K') || (!isWhite && p === 'k'))) {
          kingRow = r;
          kingCol = c;
          break;
        }
      }
    }
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && ((!isWhite && p === p.toUpperCase()) || (isWhite && p === p.toLowerCase()))) {
          const moves = this.getAttackingSquares(r, c, board);
          if (moves.some(m => m.row === kingRow && m.col === kingCol)) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  getAttackingSquares(row, col, board) {
    const piece = board[row][col];
    if (!piece) return [];
    
    const isWhite = piece === piece.toUpperCase();
    const moves = [];
    
    const addMove = (r, c) => {
      if (r >= 0 && r < 8 && c >= 0 && c < 8) moves.push({ row: r, col: c });
    };
    
    const addSlide = (dr, dc) => {
      let r = row + dr, c = col + dc;
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        moves.push({ row: r, col: c });
        if (board[r][c]) break;
        r += dr;
        c += dc;
      }
    };
    
    switch (piece.toLowerCase()) {
      case 'p':
        const direction = isWhite ? 1 : -1;
        addMove(row + direction, col - 1);
        addMove(row + direction, col + 1);
        break;
      case 'r': addSlide(1, 0); addSlide(-1, 0); addSlide(0, 1); addSlide(0, -1); break;
      case 'b': addSlide(1, 1); addSlide(1, -1); addSlide(-1, 1); addSlide(-1, -1); break;
      case 'q': addSlide(1, 0); addSlide(-1, 0); addSlide(0, 1); addSlide(0, -1); addSlide(1, 1); addSlide(1, -1); addSlide(-1, 1); addSlide(-1, -1); break;
      case 'n': [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => addMove(row + dr, col + dc)); break;
      case 'k': [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr, dc]) => addMove(row + dr, col + dc)); break;
    }
    
    return moves;
  }
  
  isInCheck() {
    const isWhite = this.gameState.currentPlayer === 0;
    let kingRow, kingCol;
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.gameState.board[r][c];
        if (p && ((isWhite && p === 'K') || (!isWhite && p === 'k'))) {
          kingRow = r;
          kingCol = c;
          break;
        }
      }
    }
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.gameState.board[r][c];
        if (p && ((isWhite && p === p.toLowerCase()) || (!isWhite && p === p.toUpperCase()))) {
          const attacks = this.getAttackingSquares(r, c, this.gameState.board);
          if (attacks.some(m => m.row === kingRow && m.col === kingCol)) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  selectPiece(row, col) {
    if (this.gameState.selectedPiece) {
      const moves = this.gameState.validMoves;
      if (moves.some(m => m.row === row && m.col === col)) {
        this.movePiece(this.gameState.selectedPiece.row, this.gameState.selectedPiece.col, row, col);
        return;
      }
    }
    
    this.gameState.selectedPiece = { row, col };
    this.gameState.validMoves = this.getValidMoves(row, col);
  }
  
  movePiece(fromRow, fromCol, toRow, toCol) {
    const piece = this.gameState.board[fromRow][fromCol];
    const captured = this.gameState.board[toRow][toCol];
    
    if (captured) {
      this.gameState.capturedPieces[this.gameState.currentPlayer].push(captured);
    }
    
    this.gameState.board[toRow][toCol] = piece;
    this.gameState.board[fromRow][fromCol] = '';
    
    this.gameState.moveHistory.push({ from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol }, piece });
    
    if (piece.toLowerCase() === 'p' && (toRow === 0 || toRow === 7)) {
      this.gameState.board[toRow][toCol] = this.gameState.currentPlayer === 0 ? 'Q' : 'q';
    }
    
    this.gameState.selectedPiece = null;
    this.gameState.validMoves = [];
    
    this.gameState.currentPlayer = 1 - this.gameState.currentPlayer;
    
    if (this.isInCheck()) {
      this.gameState.check = true;
      
      if (this.hasNoValidMoves()) {
        this.gameState.checkmate = true;
        this.gameState.winner = this.players[1 - this.gameState.currentPlayer];
      }
    } else {
      this.gameState.check = false;
      
      if (this.hasNoValidMoves()) {
        this.gameState.draw = true;
        this.gameState.winner = 'Draw';
      }
    }
  }
  
  hasNoValidMoves() {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.gameState.board[r][c];
        if (p) {
          const isWhite = p === p.toUpperCase();
          const currentIsWhite = this.gameState.currentPlayer === 0;
          if ((isWhite && currentIsWhite) || (!isWhite && !currentIsWhite)) {
            if (this.getValidMoves(r, c).length > 0) {
              return false;
            }
          }
        }
      }
    }
    return true;
  }
  
  render() {
    this.drawBoard();
    this.drawPieces();
    this.drawUI();
    if (this.gameState.checkmate || this.gameState.draw) this.drawGameOver();
  }
  
  drawBoard() {
    const size = this.canvas.width / 8;
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        this.ctx.fillStyle = (r + c) % 2 === 0 ? '#f0d9b5' : '#b58863';
        this.ctx.fillRect(c * size, r * size, size, size);
        
        if (this.gameState.selectedPiece && this.gameState.selectedPiece.row === r && this.gameState.selectedPiece.col === c) {
          this.ctx.fillStyle = 'rgba(255,255,0,0.5)';
          this.ctx.fillRect(c * size, r * size, size, size);
        }
        
        if (this.gameState.validMoves.some(m => m.row === r && m.col === c)) {
          this.ctx.fillStyle = 'rgba(0,255,0,0.3)';
          this.ctx.beginPath();
          this.ctx.arc(c * size + size / 2, r * size + size / 2, size / 5, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }
  }
  
  drawPieces() {
    const size = this.canvas.width / 8;
    
    this.ctx.font = `${size * 0.8}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.gameState.board[r][c];
        if (piece) {
          const isWhite = piece === piece.toUpperCase();
          this.ctx.fillStyle = isWhite ? '#fff' : '#000';
          this.ctx.fillText(this.pieces[piece], c * size + size / 2, r * size + size / 2 + 5);
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
    
    if (this.gameState.check) {
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillText('CHECK!', 20, 60);
    }
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('CHESS', this.canvas.width / 2, 25);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    
    if (this.gameState.checkmate) {
      this.ctx.fillText('CHECKMATE', this.canvas.width / 2, this.canvas.height / 2 - 30);
      this.ctx.fillText(`${this.gameState.winner} wins!`, this.canvas.width / 2, this.canvas.height / 2 + 30);
    } else {
      this.ctx.fillText('DRAW', this.canvas.width / 2, this.canvas.height / 2);
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.ChessGame = ChessGame;