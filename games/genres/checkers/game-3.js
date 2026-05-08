class Checkers3Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 800;
        this.boardSize = 8;
        this.tileSize = 100;
        this.board = [];
        this.currentPlayer = 'red';
        this.selectedPiece = null;
        this.validMoves = [];
        this.mustCapture = [];
        this.gameState = 'playing';
        this.winner = null;
        this.moveCount = 0;
        this.redCaptured = 0;
        this.blackCaptured = 0;
        this.moveHistory = [];
        this.animatingPiece = null;
        this.particles = [];
        this.soundEnabled = true;
        this.difficulty = 'medium';
        this.aiThinking = false;
        this.lastMoveFrom = null;
        this.lastMoveTo = null;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.setupBoard();
        this.setupEventListeners();
    }

    setupBoard() {
        this.board = [];
        for (let row = 0; row < this.boardSize; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.boardSize; col++) {
                if ((row + col) % 2 === 1) {
                    if (row < 3) {
                        this.board[row][col] = { player: 'black', isKing: false, isCapture: false };
                    } else if (row > 4) {
                        this.board[row][col] = { player: 'red', isKing: false, isCapture: false };
                    } else {
                        this.board[row][col] = null;
                    }
                } else {
                    this.board[row][col] = null;
                }
            }
        }
        this.currentPlayer = 'red';
        this.selectedPiece = null;
        this.validMoves = [];
        this.mustCapture = [];
        this.moveCount = 0;
        this.redCaptured = 0;
        this.blackCaptured = 0;
        this.moveHistory = [];
        this.gameState = 'playing';
        this.winner = null;
        this.particles = [];
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }

    handleClick(e) {
        if (this.gameState !== 'playing' || this.aiThinking) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);

        if (this.selectedPiece) {
            const move = this.validMoves.find(m => m.row === row && m.col === col);
            if (move) {
                this.executeMove(move);
            } else {
                this.selectedPiece = null;
                this.validMoves = [];
            }
        }

        const piece = this.board[row]?.[col];
        if (piece && piece.player === this.currentPlayer) {
            this.selectPiece(row, col);
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
    }

    selectPiece(row, col) {
        this.selectedPiece = { row, col };
        this.calculateValidMoves(row, col);
        this.checkForCaptures();
        if (this.mustCapture.length > 0 && !this.mustCapture.some(c => c.row === row && c.col === col)) {
            this.validMoves = [];
            return;
        }
    }

    calculateValidMoves(row, col) {
        this.validMoves = [];
        const piece = this.board[row][col];
        if (!piece) return;

        const directions = piece.player === 'red' ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]];
        if (piece.isKing) {
            directions.push(...directions.slice(0, 2));
        }

        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (this.isValidPosition(newRow, newCol) && !this.board[newRow][newCol]) {
                this.validMoves.push({ row: newRow, col: newCol, isCapture: false });
            }
        }

        this.calculateCaptureMoves(row, col, piece, directions);
    }

    calculateCaptureMoves(row, col, piece, directions, capturedSoFar = []) {
        let hasCaptures = false;

        for (const [dr, dc] of directions) {
            const captureRow = row + dr;
            const captureCol = col + dc;
            const landRow = row + dr * 2;
            const landCol = col + dc * 2;

            if (!this.isValidPosition(landRow, landCol)) continue;

            const targetPiece = this.board[captureRow]?.[captureCol];
            if (targetPiece && targetPiece.player !== piece.player) {
                const alreadyCaptured = capturedSoFar.some(c => c.row === captureRow && c.col === captureCol);
                if (!alreadyCaptured && !this.board[landRow][landCol]) {
                    hasCaptures = true;
                    this.validMoves.push({
                        row: landRow,
                        col: landCol,
                        isCapture: true,
                        captured: [{ row: captureRow, col: captureCol }],
                        chain: [...capturedSoFar, { row: captureRow, col: captureCol }]
                    });
                }
            }
        }

        if (hasCaptures) {
            this.validMoves = this.validMoves.filter(m => m.isCapture);
        }
    }

    checkForCaptures() {
        this.mustCapture = [];
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const piece = this.board[row][col];
                if (piece && piece.player === this.currentPlayer) {
                    const directions = piece.player === 'red' ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]];
                    if (piece.isKing) {
                        directions.push(...directions.slice(0, 2));
                    }
                    for (const [dr, dc] of directions) {
                        const captureRow = row + dr;
                        const captureCol = col + dc;
                        const landRow = row + dr * 2;
                        const landCol = col + dc * 2;
                        if (!this.isValidPosition(landRow, landCol)) continue;
                        const targetPiece = this.board[captureRow]?.[captureCol];
                        if (targetPiece && targetPiece.player !== piece.player && !this.board[landRow][landCol]) {
                            this.mustCapture.push({ row, col });
                        }
                    }
                }
            }
        }
    }

    isValidPosition(row, col) {
        return row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize;
    }

    executeMove(move) {
        const fromRow = this.selectedPiece.row;
        const fromCol = this.selectedPiece.col;
        const piece = this.board[fromRow][fromCol];

        this.lastMoveFrom = { row: fromRow, col: fromCol };
        this.lastMoveTo = { row: move.row, col: move.col };

        this.moveHistory.push({
            from: { row: fromRow, col: fromCol },
            to: { row: move.row, col: move.col },
            captured: move.captured
        });

        this.board[move.row][move.col] = piece;
        this.board[fromRow][fromCol] = null;

        if (move.captured) {
            for (const cap of move.captured) {
                this.board[cap.row][cap.col] = null;
                if (piece.player === 'red') {
                    this.blackCaptured++;
                } else {
                    this.redCaptured++;
                }
                this.spawnCaptureParticles(cap.row, cap.col);
            }
        }

        if ((piece.player === 'red' && move.row === this.boardSize - 1) ||
            (piece.player === 'black' && move.row === 0)) {
            if (!piece.isKing) {
                piece.isKing = true;
                this.spawnKingParticles(move.row, move.col);
            }
        }

        if (move.isCapture && this.canChainCapture(move.row, move.col, piece, move.captured)) {
            this.selectedPiece = { row: move.row, col: move.col };
            this.calculateValidMoves(move.row, move.col);
            this.validMoves = this.validMoves.filter(m => m.isCapture);
            if (this.validMoves.length > 0) {
                return;
            }
        }

        this.selectedPiece = null;
        this.validMoves = [];
        this.currentPlayer = this.currentPlayer === 'red' ? 'black' : 'red';
        this.moveCount++;
        this.checkForCaptures();
        this.checkWinCondition();

        if (this.currentPlayer === 'black' && this.gameState === 'playing') {
            this.aiThinking = true;
            setTimeout(() => this.makeAIMove(), 500);
        }
    }

    canChainCapture(row, col, piece, captured) {
        const directions = piece.player === 'red' ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]];
        if (piece.isKing) {
            directions.push(...directions.slice(0, 2));
        }
        for (const [dr, dc] of directions) {
            const captureRow = row + dr;
            const captureCol = col + dc;
            const landRow = row + dr * 2;
            const landCol = col + dc * 2;
            if (!this.isValidPosition(landRow, landCol)) continue;
            const targetPiece = this.board[captureRow]?.[captureCol];
            const alreadyCaptured = captured.some(c => c.row === captureRow && c.col === captureCol);
            if (targetPiece && targetPiece.player !== piece.player && !this.board[landRow][landCol] && !alreadyCaptured) {
                return true;
            }
        }
        return false;
    }

    makeAIMove() {
        if (this.gameState !== 'playing') {
            this.aiThinking = false;
            return;
        }

        this.checkForCaptures();
        let bestMove = null;
        let bestScore = -Infinity;

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const piece = this.board[row][col];
                if (piece && piece.player === 'black') {
                    this.selectedPiece = { row, col };
                    this.calculateValidMoves(row, col);
                    if (this.mustCapture.length > 0 && !this.mustCapture.some(c => c.row === row && c.col === col)) {
                        continue;
                    }
                    for (const move of this.validMoves) {
                        const score = this.evaluateMove(row, col, move);
                        if (score > bestScore) {
                            bestScore = score;
                            bestMove = { from: { row, col }, move };
                        }
                    }
                }
            }
        }

        this.selectedPiece = null;
        this.validMoves = [];

        if (bestMove) {
            this.selectedPiece = bestMove.from;
            this.executeMove(bestMove.move);
        } else {
            this.checkWinCondition();
        }

        this.aiThinking = false;
    }

    evaluateMove(fromRow, fromCol, move) {
        let score = 0;

        if (move.isCapture) {
            score += 10;
        }

        const piece = this.board[fromRow][fromCol];
        const centerDistance = Math.abs(3.5 - move.col);
        score += (3.5 - centerDistance) * 0.5;

        if (move.row === 0 && !piece.isKing) {
            score += 5;
        }

        if (this.difficulty === 'hard') {
            if (move.row < fromRow && piece.player === 'black') {
                score += 0.3;
            }
            const adjacentPieces = this.countAdjacentPieces(move.row, move.col, piece.player);
            if (adjacentPieces > 0) {
                score += 0.2;
            }
        }

        return score;
    }

    countAdjacentPieces(row, col, player) {
        let count = 0;
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [dr, dc] of directions) {
            const r = row + dr;
            const c = col + dc;
            if (this.isValidPosition(r, c) && this.board[r][c]?.player === player) {
                count++;
            }
        }
        return count;
    }

    spawnCaptureParticles(row, col) {
        const centerX = col * this.tileSize + this.tileSize / 2;
        const centerY = row * this.tileSize + this.tileSize / 2;
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.02 + Math.random() * 0.02,
                size: 3 + Math.random() * 4,
                color: this.board[row]?.[col]?.player === 'red' ? '#ff4444' : '#444466'
            });
        }
    }

    spawnKingParticles(row, col) {
        const centerX = col * this.tileSize + this.tileSize / 2;
        const centerY = row * this.tileSize + this.tileSize / 2;
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.015 + Math.random() * 0.01,
                size: 4 + Math.random() * 3,
                color: '#ffd700'
            });
        }
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

    checkWinCondition() {
        let redPieces = 0;
        let blackPieces = 0;
        let redCanMove = false;
        let blackCanMove = false;

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    if (piece.player === 'red') {
                        redPieces++;
                    } else {
                        blackPieces++;
                    }
                    const directions = piece.player === 'red' ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]];
                    if (piece.isKing) {
                        directions.push(...directions.slice(0, 2));
                    }
                    for (const [dr, dc] of directions) {
                        const newRow = row + dr;
                        const newCol = col + dc;
                        const landRow = row + dr * 2;
                        const landCol = col + dc * 2;
                        if (this.isValidPosition(newRow, newCol) && !this.board[newRow][newCol]) {
                            if (piece.player === 'red') redCanMove = true;
                            else blackCanMove = true;
                        }
                        if (this.isValidPosition(landRow, landCol)) {
                            const targetPiece = this.board[newRow]?.[newCol];
                            if (targetPiece && targetPiece.player !== piece.player && !this.board[landRow][landCol]) {
                                if (piece.player === 'red') redCanMove = true;
                                else blackCanMove = true;
                            }
                        }
                    }
                }
            }
        }

        if (redPieces === 0 || (this.currentPlayer === 'red' && !redCanMove)) {
            this.gameState = 'gameover';
            this.winner = 'black';
        }
        if (blackPieces === 0 || (this.currentPlayer === 'black' && !blackCanMove)) {
            this.gameState = 'gameover';
            this.winner = 'red';
        }
    }

    start() {
        this.setupBoard();
        this.gameState = 'playing';
    }

    update() {
        if (this.gameState !== 'playing') return;
        this.updateParticles();
    }

    render() {
        this.renderBoard();
        this.renderPieces();
        this.renderHighlights();
        this.renderParticles();
        this.renderUI();
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

        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.boardSize; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.tileSize, 0);
            this.ctx.lineTo(i * this.tileSize, this.height);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.tileSize);
            this.ctx.lineTo(this.width, i * this.tileSize);
            this.ctx.stroke();
        }
    }

    renderPieces() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const piece = this.board[row][col];
                if (!piece) continue;

                const centerX = col * this.tileSize + this.tileSize / 2;
                const centerY = row * this.tileSize + this.tileSize / 2;
                const radius = this.tileSize / 2 - 10;

                const gradient = this.ctx.createRadialGradient(
                    centerX - 10, centerY - 10, 0,
                    centerX, centerY, radius
                );

                if (piece.player === 'red') {
                    gradient.addColorStop(0, '#ff6666');
                    gradient.addColorStop(1, '#cc0000');
                } else {
                    gradient.addColorStop(0, '#6666aa');
                    gradient.addColorStop(1, '#333366');
                }

                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.ctx.fillStyle = gradient;
                this.ctx.fill();

                this.ctx.strokeStyle = piece.player === 'red' ? '#880000' : '#222244';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();

                this.ctx.beginPath();
                this.ctx.arc(centerX - 5, centerY - 5, radius * 0.3, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.fill();

                if (piece.isKing) {
                    this.ctx.fillStyle = '#ffd700';
                    this.ctx.font = `bold ${radius * 0.8}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText('♔', centerX, centerY + 2);
                }
            }
        }
    }

    renderHighlights() {
        if (this.selectedPiece) {
            const x = this.selectedPiece.col * this.tileSize;
            const y = this.selectedPiece.row * this.tileSize;
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
            this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
        }

        for (const move of this.validMoves) {
            const x = move.col * this.tileSize;
            const y = move.row * this.tileSize;

            if (move.isCapture) {
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
            }

            this.ctx.beginPath();
            this.ctx.arc(
                x + this.tileSize / 2,
                y + this.tileSize / 2,
                15,
                0, Math.PI * 2
            );
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.6)';
            this.ctx.fill();
        }

        if (this.lastMoveFrom && this.lastMoveTo) {
            this.ctx.fillStyle = 'rgba(255, 165, 0, 0.2)';
            this.ctx.fillRect(
                this.lastMoveFrom.col * this.tileSize,
                this.lastMoveFrom.row * this.tileSize,
                this.tileSize, this.tileSize
            );
            this.ctx.fillRect(
                this.lastMoveTo.col * this.tileSize,
                this.lastMoveTo.row * this.tileSize,
                this.tileSize, this.tileSize
            );
        }
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

    renderUI() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, this.height - 60, this.width, 60);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Red Captured: ${this.redCaptured}`, 20, this.height - 25);
        this.ctx.fillText(`Black Captured: ${this.blackCaptured}`, 200, this.height - 25);
        this.ctx.fillText(`Move: ${this.moveCount}`, 400, this.height - 25);

        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = this.currentPlayer === 'red' ? '#ff6666' : '#6666aa';
        this.ctx.fillText(`${this.currentPlayer.toUpperCase()}'s Turn`, this.width / 2, 35);

        if (this.aiThinking) {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.fillText('AI Thinking...', this.width / 2, 60);
        }

        if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(this.width / 2 - 200, this.height / 2 - 80, 400, 160);

            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 30);

            this.ctx.fillStyle = this.winner === 'red' ? '#ff6666' : '#6666aa';
            this.ctx.font = '28px Arial';
            this.ctx.fillText(`${this.winner.toUpperCase()} WINS!`, this.width / 2, this.height / 2 + 10);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Click to Play Again', this.width / 2, this.height / 2 + 50);

            this.canvas.onclick = () => this.start();
        }

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(this.width / 2 - 200, this.height / 2 - 100, 400, 200);

            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CHECKERS III', this.width / 2, this.height / 2 - 50);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Click a piece to select', this.width / 2, this.height / 2 - 10);
            this.ctx.fillText('Green dots show valid moves', this.width / 2, this.height / 2 + 15);
            this.ctx.fillText('Red pieces capture black pieces', this.width / 2, this.height / 2 + 40);

            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillText('Click to Start', this.width / 2, this.height / 2 + 75);

            this.canvas.onclick = () => this.start();
        }
    }
}

window.Checkers3Game = Checkers3Game;
