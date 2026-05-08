class Chess3Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 640;
        this.height = 740;
        this.boardSize = 8;
        this.tileSize = 80;
        this.board = [];
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.validMoves = [];
        this.gameState = 'start';
        this.winner = null;
        this.moveCount = 0;
        this.capturedPieces = { white: [], black: [] };
        this.moveHistory = [];
        this.kingMoved = { white: false, black: false };
        this.rookMoved = { white: { left: false, right: false }, black: { left: false, right: false } };
        this.lastMove = null;
        this.particles = [];
        this.hoveredSquare = null;
        this.promotionPending = null;
        this.aiThinking = false;
        this.difficulty = 'medium';
        this.enPassantTarget = null;
        this.castlingRights = { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } };
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.setupBoard();
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }

    setupBoard() {
        this.board = [];
        const backRow = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

        for (let row = 0; row < this.boardSize; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.boardSize; col++) {
                if (row === 0) {
                    this.board[row][col] = { type: backRow[col], player: 'black', hasMoved: false };
                } else if (row === 1) {
                    this.board[row][col] = { type: 'pawn', player: 'black', hasMoved: false };
                } else if (row === 6) {
                    this.board[row][col] = { type: 'pawn', player: 'white', hasMoved: false };
                } else if (row === 7) {
                    this.board[row][col] = { type: backRow[col], player: 'white', hasMoved: false };
                } else {
                    this.board[row][col] = null;
                }
            }
        }

        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.validMoves = [];
        this.moveCount = 0;
        this.capturedPieces = { white: [], black: [] };
        this.moveHistory = [];
        this.kingMoved = { white: false, black: false };
        this.rookMoved = { white: { left: false, right: false }, black: { left: false, right: false } };
        this.lastMove = null;
        this.particles = [];
        this.enPassantTarget = null;
        this.castlingRights = { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } };
    }

    handleClick(e) {
        if (this.gameState === 'start') {
            this.gameState = 'playing';
            return;
        }

        if (this.gameState === 'gameover') {
            this.setupBoard();
            this.gameState = 'playing';
            return;
        }

        if (this.promotionPending) {
            this.handlePromotionClick(e);
            return;
        }

        if (this.aiThinking) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);

        if (!this.isValidPosition(row, col)) return;

        if (this.selectedPiece) {
            const move = this.validMoves.find(m => m.row === row && m.col === col);
            if (move) {
                this.executeMove(move);
            } else {
                this.selectedPiece = null;
                this.validMoves = [];
                const piece = this.board[row][col];
                if (piece && piece.player === this.currentPlayer) {
                    this.selectPiece(row, col);
                }
            }
        } else {
            const piece = this.board[row][col];
            if (piece && piece.player === this.currentPlayer) {
                this.selectPiece(row, col);
            }
        }
    }

    handlePromotionClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);

        if (row === this.promotionPending.row && col >= 0 && col <= 7) {
            let pieceType;
            if (col === 0) pieceType = 'queen';
            else if (col === 1) pieceType = 'rook';
            else if (col === 2) pieceType = 'bishop';
            else if (col === 3) pieceType = 'knight';
            else return;

            this.board[this.promotionPending.row][this.promotionPending.col] = {
                type: pieceType,
                player: this.promotionPending.player,
                hasMoved: true
            };
            this.promotionPending = null;
            this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
            this.selectedPiece = null;
            this.validMoves = [];

            if (this.currentPlayer === 'black' && this.gameState === 'playing') {
                this.aiThinking = true;
                setTimeout(() => this.makeAIMove(), 500);
            }
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        const col = Math.floor(this.mouseX / this.tileSize);
        const row = Math.floor(this.mouseY / this.tileSize);
        this.hoveredSquare = this.isValidPosition(row, col) ? { row, col } : null;
    }

    selectPiece(row, col) {
        this.selectedPiece = { row, col };
        this.calculateValidMoves(row, col);
    }

    calculateValidMoves(row, col) {
        this.validMoves = [];
        const piece = this.board[row][col];
        if (!piece) return;

        switch (piece.type) {
            case 'pawn':
                this.calculatePawnMoves(row, col, piece);
                break;
            case 'rook':
                this.calculateRookMoves(row, col, piece);
                break;
            case 'knight':
                this.calculateKnightMoves(row, col, piece);
                break;
            case 'bishop':
                this.calculateBishopMoves(row, col, piece);
                break;
            case 'queen':
                this.calculateQueenMoves(row, col, piece);
                break;
            case 'king':
                this.calculateKingMoves(row, col, piece);
                break;
        }

        this.validMoves = this.validMoves.filter(move => !this.wouldBeInCheck(row, col, move));
    }

    calculatePawnMoves(row, col, piece) {
        const direction = piece.player === 'white' ? -1 : 1;
        const startRow = piece.player === 'white' ? 6 : 1;

        const oneStep = row + direction;
        if (this.isValidPosition(oneStep, col) && !this.board[oneStep][col]) {
            this.validMoves.push({ row: oneStep, col, isCapture: false });
            if (row === startRow) {
                const twoStep = row + direction * 2;
                if (!this.board[twoStep][col]) {
                    this.validMoves.push({ row: twoStep, col, isCapture: false, isDoubleMove: true });
                }
            }
        }

        for (const dc of [-1, 1]) {
            const newCol = col + dc;
            if (this.isValidPosition(oneStep, newCol)) {
                const target = this.board[oneStep][newCol];
                if (target && target.player !== piece.player) {
                    this.validMoves.push({ row: oneStep, col: newCol, isCapture: true });
                }
                if (this.enPassantTarget && this.enPassantTarget.row === oneStep && this.enPassantTarget.col === newCol) {
                    this.validMoves.push({ row: oneStep, col: newCol, isCapture: true, isEnPassant: true });
                }
            }
        }
    }

    calculateRookMoves(row, col, piece) {
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        this.calculateSlidingMoves(row, col, piece, directions);
    }

    calculateBishopMoves(row, col, piece) {
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        this.calculateSlidingMoves(row, col, piece, directions);
    }

    calculateKnightMoves(row, col, piece) {
        const moves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        for (const [dr, dc] of moves) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (this.isValidPosition(newRow, newCol)) {
                const target = this.board[newRow][newCol];
                if (!target || target.player !== piece.player) {
                    this.validMoves.push({ row: newRow, col: newCol, isCapture: !!target });
                }
            }
        }
    }

    calculateQueenMoves(row, col, piece) {
        this.calculateRookMoves(row, col, piece);
        this.calculateBishopMoves(row, col, piece);
    }

    calculateKingMoves(row, col, piece) {
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (this.isValidPosition(newRow, newCol)) {
                const target = this.board[newRow][newCol];
                if (!target || target.player !== piece.player) {
                    this.validMoves.push({ row: newRow, col: newCol, isCapture: !!target });
                }
            }
        }

        if (!piece.hasMoved && !this.isInCheck(piece.player)) {
            const kingSide = this.castlingRights[piece.player].kingSide;
            const queenSide = this.castlingRights[piece.player].queenSide;
            const backRow = piece.player === 'white' ? 7 : 0;

            if (kingSide && this.canCastle(row, col, 'kingSide')) {
                this.validMoves.push({ row: backRow, col: 6, isCastling: true, castlingType: 'kingSide' });
            }
            if (queenSide && this.canCastle(row, col, 'queenSide')) {
                this.validMoves.push({ row: backRow, col: 2, isCastling: true, castlingType: 'queenSide' });
            }
        }
    }

    canCastle(row, col, side) {
        const piece = this.board[row][col];
        if (!piece || piece.hasMoved) return false;

        const backRow = piece.player === 'white' ? 7 : 0;
        if (row !== backRow) return false;

        const rookCol = side === 'kingSide' ? 7 : 0;
        const rook = this.board[backRow][rookCol];
        if (!rook || rook.type !== 'rook' || rook.hasMoved) return false;

        const startCol = 4;
        const direction = side === 'kingSide' ? 1 : -1;

        for (let c = startCol + direction; side === 'kingSide' ? c <= 6 : c >= 2; c += direction) {
            if (this.board[row][c]) return false;
        }

        const checkCols = side === 'kingSide' ? [5, 6] : [2, 3];
        for (const c of checkCols) {
            if (this.isSquareAttacked(row, c, piece.player === 'white' ? 'black' : 'white')) {
                return false;
            }
        }

        return true;
    }

    calculateSlidingMoves(row, col, piece, directions) {
        for (const [dr, dc] of directions) {
            let newRow = row + dr;
            let newCol = col + dc;

            while (this.isValidPosition(newRow, newCol)) {
                const target = this.board[newRow][newCol];
                if (!target) {
                    this.validMoves.push({ row: newRow, col: newCol, isCapture: false });
                } else {
                    if (target.player !== piece.player) {
                        this.validMoves.push({ row: newRow, col: newCol, isCapture: true });
                    }
                    break;
                }
                newRow += dr;
                newCol += dc;
            }
        }
    }

    wouldBeInCheck(fromRow, fromCol, move) {
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[move.row][move.col];

        this.board[move.row][move.col] = piece;
        this.board[fromRow][fromCol] = null;

        if (move.isEnPassant) {
            const captureRow = piece.player === 'white' ? move.row + 1 : move.row - 1;
            this.board[captureRow][move.col] = null;
        }

        const inCheck = this.isInCheck(piece.player);

        this.board[fromRow][fromCol] = piece;
        this.board[move.row][move.col] = capturedPiece;

        if (move.isEnPassant) {
            const captureRow = piece.player === 'white' ? move.row + 1 : move.row - 1;
            this.board[captureRow][move.col] = { type: 'pawn', player: piece.player === 'white' ? 'black' : 'white', hasMoved: true };
        }

        return inCheck;
    }

    isInCheck(player) {
        const kingPos = this.findKing(player);
        if (!kingPos) return false;

        const opponent = player === 'white' ? 'black' : 'white';
        return this.isSquareAttacked(kingPos.row, kingPos.col, opponent);
    }

    isSquareAttacked(row, col, byPlayer) {
        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                const piece = this.board[r][c];
                if (piece && piece.player === byPlayer) {
                    const moves = this.getAttackSquares(r, c, piece);
                    if (moves.some(m => m.row === row && m.col === col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    getAttackSquares(row, col, piece) {
        const attacks = [];
        switch (piece.type) {
            case 'pawn':
                const direction = piece.player === 'white' ? -1 : 1;
                attacks.push({ row: row + direction, col: col - 1 });
                attacks.push({ row: row + direction, col: col + 1 });
                break;
            case 'knight':
                const knightMoves = [
                    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
                    [1, -2], [1, 2], [2, -1], [2, 1]
                ];
                for (const [dr, dc] of knightMoves) {
                    attacks.push({ row: row + dr, col: col + dc });
                }
                break;
            case 'bishop':
                this.addSlidingAttacks(attacks, row, col, [[1, 1], [1, -1], [-1, 1], [-1, -1]]);
                break;
            case 'rook':
                this.addSlidingAttacks(attacks, row, col, [[0, 1], [0, -1], [1, 0], [-1, 0]]);
                break;
            case 'queen':
                this.addSlidingAttacks(attacks, row, col, [
                    [0, 1], [0, -1], [1, 0], [-1, 0],
                    [1, 1], [1, -1], [-1, 1], [-1, -1]
                ]);
                break;
            case 'king':
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr !== 0 || dc !== 0) {
                            attacks.push({ row: row + dr, col: col + dc });
                        }
                    }
                }
                break;
        }
        return attacks.filter(a => this.isValidPosition(a.row, a.col));
    }

    addSlidingAttacks(attacks, row, col, directions) {
        for (const [dr, dc] of directions) {
            let r = row + dr;
            let c = col + dc;
            while (this.isValidPosition(r, c)) {
                attacks.push({ row: r, col: c });
                if (this.board[r][c]) break;
                r += dr;
                c += dc;
            }
        }
    }

    findKing(player) {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'king' && piece.player === player) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    executeMove(move) {
        const fromRow = this.selectedPiece.row;
        const fromCol = this.selectedPiece.col;
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[move.row][move.col];

        this.moveHistory.push({
            from: { row: fromRow, col: fromCol },
            to: { row: move.row, col: move.col },
            piece: { ...piece },
            captured: capturedPiece ? { ...capturedPiece } : null
        });

        if (move.isCastling) {
            const backRow = piece.player === 'white' ? 7 : 0;
            if (move.castlingType === 'kingSide') {
                this.board[backRow][5] = this.board[backRow][7];
                this.board[backRow][7] = null;
            } else {
                this.board[backRow][3] = this.board[backRow][0];
                this.board[backRow][0] = null;
            }
        }

        if (move.isEnPassant) {
            const captureRow = piece.player === 'white' ? move.row + 1 : move.row - 1;
            const captured = this.board[captureRow][move.col];
            this.capturedPieces[captured.player].push(captured);
            this.board[captureRow][move.col] = null;
        }

        this.board[move.row][move.col] = piece;
        this.board[fromRow][fromCol] = null;
        piece.hasMoved = true;

        if (capturedPiece) {
            this.capturedPieces[capturedPiece.player].push(capturedPiece);
        }

        if (move.isDoubleMove) {
            this.enPassantTarget = {
                row: piece.player === 'white' ? move.row + 1 : move.row - 1,
                col: move.col
            };
        } else {
            this.enPassantTarget = null;
        }

        if (piece.type === 'king') {
            this.kingMoved[piece.player] = true;
            this.castlingRights[piece.player].kingSide = false;
            this.castlingRights[piece.player].queenSide = false;
        }

        if (piece.type === 'rook') {
            if (fromCol === 0) {
                this.castlingRights[piece.player].queenSide = false;
            } else if (fromCol === 7) {
                this.castlingRights[piece.player].kingSide = false;
            }
        }

        if (piece.type === 'pawn' && (move.row === 0 || move.row === 7)) {
            this.promotionPending = { row: move.row, col: move.col, player: piece.player };
        }

        this.lastMove = { from: { row: fromRow, col: fromCol }, to: { row: move.row, col: move.col } };
        this.selectedPiece = null;
        this.validMoves = [];
        this.moveCount++;

        if (!this.promotionPending) {
            this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
            this.checkGameEnd();

            if (this.currentPlayer === 'black' && this.gameState === 'playing') {
                this.aiThinking = true;
                setTimeout(() => this.makeAIMove(), 500);
            }
        }
    }

    checkGameEnd() {
        if (this.isInCheck(this.currentPlayer)) {
            const hasLegalMoves = this.hasAnyLegalMoves(this.currentPlayer);
            if (!hasLegalMoves) {
                this.gameState = 'gameover';
                this.winner = this.currentPlayer === 'white' ? 'black' : 'white';
            }
        } else {
            const hasLegalMoves = this.hasAnyLegalMoves(this.currentPlayer);
            if (!hasLegalMoves) {
                this.gameState = 'gameover';
                this.winner = 'draw';
            }
        }
    }

    hasAnyLegalMoves(player) {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const piece = this.board[row][col];
                if (piece && piece.player === player) {
                    this.selectedPiece = { row, col };
                    this.calculateValidMoves(row, col);
                    if (this.validMoves.length > 0) {
                        this.selectedPiece = null;
                        this.validMoves = [];
                        return true;
                    }
                }
            }
        }
        this.selectedPiece = null;
        this.validMoves = [];
        return false;
    }

    makeAIMove() {
        if (this.gameState !== 'playing') {
            this.aiThinking = false;
            return;
        }

        let bestMoves = [];
        let bestScore = -Infinity;

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const piece = this.board[row][col];
                if (piece && piece.player === 'black') {
                    this.selectedPiece = { row, col };
                    this.calculateValidMoves(row, col);

                    for (const move of this.validMoves) {
                        const score = this.evaluateMove(row, col, move, piece);
                        if (score > bestScore) {
                            bestScore = score;
                            bestMoves = [{ from: { row, col }, move }];
                        } else if (score === bestScore) {
                            bestMoves.push({ from: { row, col }, move });
                        }
                    }
                }
            }
        }

        this.selectedPiece = null;
        this.validMoves = [];

        if (bestMoves.length > 0) {
            const chosen = bestMoves[Math.floor(Math.random() * bestMoves.length)];
            this.selectedPiece = chosen.from;
            this.executeMove(chosen.move);
        }

        this.aiThinking = false;
    }

    evaluateMove(fromRow, fromCol, move, piece) {
        let score = 0;

        if (move.isCapture) {
            const target = this.board[move.row][move.col];
            score += this.getPieceValue(target) * 10;
        }

        const centerBonus = this.getPieceValue(piece) * 0.1;
        const centerDistance = Math.abs(3.5 - move.col) + Math.abs(3.5 - move.row);
        score += centerBonus * (7 - centerDistance) / 7;

        if (this.isInCheck(this.currentPlayer === 'black' ? 'white' : 'black')) {
            score += 5;
        }

        const captureValue = move.isCapture ? this.getPieceValue(this.board[move.row]?.[move.col]) : 0;
        score += captureValue;

        if (this.difficulty === 'hard') {
            if (move.isCastling) score += 3;
            if (move.row === 3 && move.col === 3) score += 0.5;
        }

        return score + Math.random() * 0.5;
    }

    getPieceValue(piece) {
        if (!piece) return 0;
        const values = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 100 };
        return values[piece.type] || 0;
    }

    isValidPosition(row, col) {
        return row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize;
    }

    start() {
        this.setupBoard();
        this.gameState = 'playing';
    }

    update() {
        this.updateParticles();
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= p.decay;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    render() {
        this.renderBoard();
        this.renderHighlights();
        this.renderPieces();
        this.renderUI();
        this.renderParticles();
    }

    renderBoard() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const x = col * this.tileSize;
                const y = row * this.tileSize;

                if ((row + col) % 2 === 0) {
                    this.ctx.fillStyle = '#f0d9b5';
                } else {
                    this.ctx.fillStyle = '#b58863';
                }
                this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
            }
        }
    }

    renderHighlights() {
        if (this.selectedPiece) {
            const x = this.selectedPiece.col * this.tileSize;
            const y = this.selectedPiece.row * this.tileSize;
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
            this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
        }

        for (const move of this.validMoves) {
            const x = move.col * this.tileSize;
            const y = move.row * this.tileSize;

            if (move.isCapture || move.isCastling) {
                this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
                this.ctx.lineWidth = 4;
                this.ctx.strokeRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);
            }

            this.ctx.beginPath();
            this.ctx.arc(x + this.tileSize / 2, y + this.tileSize / 2, 10, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
            this.ctx.fill();
        }

        if (this.lastMove) {
            this.ctx.fillStyle = 'rgba(255, 165, 0, 0.2)';
            this.ctx.fillRect(
                this.lastMove.from.col * this.tileSize,
                this.lastMove.from.row * this.tileSize,
                this.tileSize, this.tileSize
            );
            this.ctx.fillRect(
                this.lastMove.to.col * this.tileSize,
                this.lastMove.to.row * this.tileSize,
                this.tileSize, this.tileSize
            );
        }

        if (this.hoveredSquare) {
            const x = this.hoveredSquare.col * this.tileSize;
            const y = this.hoveredSquare.row * this.tileSize;
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, this.tileSize, this.tileSize);
        }

        if (this.promotionPending) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Select Promotion', this.width / 2, this.height / 2 - 100);

            const pieces = ['queen', 'rook', 'bishop', 'knight'];
            for (let i = 0; i < pieces.length; i++) {
                const x = this.tileSize * i + this.tileSize / 2;
                const y = this.height / 2;
                this.ctx.fillStyle = '#f0d9b5';
                this.ctx.fillRect(this.tileSize * i, this.height / 2 - this.tileSize / 2, this.tileSize, this.tileSize);
                this.renderPiece({ type: pieces[i], player: this.promotionPending.player }, x, y);
            }
        }
    }

    renderPieces() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const piece = this.board[row][col];
                if (!piece) continue;

                const centerX = col * this.tileSize + this.tileSize / 2;
                const centerY = row * this.tileSize + this.tileSize / 2;
                this.renderPiece(piece, centerX, centerY);
            }
        }
    }

    renderPiece(piece, x, y) {
        const size = this.tileSize * 0.4;
        const symbols = {
            king: { white: '♔', black: '♚' },
            queen: { white: '♕', black: '♛' },
            rook: { white: '♖', black: '♜' },
            bishop: { white: '♗', black: '♝' },
            knight: { white: '♘', black: '♞' },
            pawn: { white: '♙', black: '♟' }
        };

        this.ctx.font = `bold ${size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        this.ctx.fillStyle = piece.player === 'white' ? '#fff' : '#000';
        this.ctx.strokeStyle = piece.player === 'white' ? '#666' : '#222';
        this.ctx.lineWidth = 2;

        this.ctx.strokeText(symbols[piece.type][piece.player], x, y);
        this.ctx.fillText(symbols[piece.type][piece.player], x, y);
    }

    renderUI() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, this.height - 60, this.width, 60);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Move: ${this.moveCount}`, 20, this.height - 35);

        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = this.currentPlayer === 'white' ? '#fff' : '#666';
        this.ctx.fillText(`${this.currentPlayer.toUpperCase()}'s Turn`, this.width / 2, this.height - 35);

        if (this.isInCheck(this.currentPlayer)) {
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillText('CHECK!', this.width / 2, this.height - 15);
        }

        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Captured: ${this.capturedPieces.white.map(p => this.getPieceSymbol(p)).join(' ')}`, this.width - 20, this.height - 35);
        this.ctx.fillText(`Captured: ${this.capturedPieces.black.map(p => this.getPieceSymbol(p)).join(' ')}`, this.width - 20, this.height - 15);

        if (this.aiThinking) {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('AI Thinking...', this.width / 2, 20);
        }

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(this.width / 2 - 200, this.height / 2 - 120, 400, 240);

            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CHESS III', this.width / 2, this.height / 2 - 70);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Classic chess with AI opponent', this.width / 2, this.height / 2 - 30);
            this.ctx.fillText('Click to select, click to move', this.width / 2, this.height / 2);
            this.ctx.fillText('Green dots = valid moves', this.width / 2, this.height / 2 + 30);
            this.ctx.fillText('Red border = capture', this.width / 2, this.height / 2 + 60);

            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillText('Click to Start', this.width / 2, this.height / 2 + 100);
        }

        if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(this.width / 2 - 200, this.height / 2 - 100, 400, 200);

            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 50);

            if (this.winner === 'draw') {
                this.ctx.fillStyle = '#fff';
                this.ctx.fillText('DRAW!', this.width / 2, this.height / 2);
            } else {
                this.ctx.fillStyle = this.winner === 'white' ? '#fff' : '#666';
                this.ctx.fillText(`${this.winner.toUpperCase()} WINS!`, this.width / 2, this.height / 2);
            }

            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Click to Play Again', this.width / 2, this.height / 2 + 50);
        }
    }

    getPieceSymbol(piece) {
        const symbols = { king: 'K', queen: 'Q', rook: 'R', bishop: 'B', knight: 'N', pawn: 'P' };
        return symbols[piece.type];
    }

    renderParticles() {
        for (const p of this.particles) {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
    }
}

window.Chess3Game = Chess3Game;
