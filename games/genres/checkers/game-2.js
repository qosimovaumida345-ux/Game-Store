class CheckersGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.board = [];
        this.selected = null;
        this.turn = 'red';
        this.validMoves = [];
        this.gameState = 'playing';
        this.score = 0;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resetBoard();
    }

    resetBoard() {
        this.board = [];
        for (let row = 0; row < 8; row++) {
            this.board[row] = [];
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 === 1) {
                    if (row < 3) this.board[row][col] = { player: 'black', king: false };
                    else if (row > 4) this.board[row][col] = { player: 'red', king: false };
                    else this.board[row][col] = null;
                } else {
                    this.board[row][col] = null;
                }
            }
        }
        this.turn = 'red';
        this.selected = null;
        this.validMoves = [];
    }

    start() {
        this.gameState = 'playing';
        this.score = 0;
        this.resetBoard();
    }

    update() {}

    getValidMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];

        const moves = [];
        const directions = piece.player === this.turn ? (piece.king ? [[-1,-1],[-1,1],[1,-1],[1,1]] : piece.player === 'red' ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]]) : [];

        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;

            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                if (!this.board[newRow][newCol]) {
                    moves.push({ row: newRow, col: newCol, jump: false });
                } else if (this.board[newRow][newCol].player !== piece.player) {
                    const jumpRow = newRow + dr;
                    const jumpCol = newCol + dc;
                    if (jumpRow >= 0 && jumpRow < 8 && jumpCol >= 0 && jumpCol < 8 && !this.board[jumpRow][jumpCol]) {
                        moves.push({ row: jumpRow, col: jumpCol, jump: true, captured: { row: newRow, col: newCol } });
                    }
                }
            }
        }
        return moves;
    }

    selectPiece(row, col) {
        if (this.gameState !== 'playing') return;

        const piece = this.board[row][col];
        if (!piece || piece.player !== this.turn) {
            if (this.selected) {
                for (const move of this.validMoves) {
                    if (move.row === row && move.col === col) {
                        this.executeMove(move);
                        return;
                    }
                }
            }
            return;
        }

        this.selected = { row, col };
        this.validMoves = this.getValidMoves(row, col);
    }

    executeMove(move) {
        const fromRow = this.selected.row;
        const fromCol = this.selected.col;
        const piece = this.board[fromRow][fromCol];

        this.board[move.row][move.col] = piece;
        this.board[fromRow][fromCol] = null;

        if (move.jump) {
            this.board[move.captured.row][move.captured.col] = null;
            this.score += 10;
        }

        if ((piece.player === 'red' && move.row === 0) || (piece.player === 'black' && move.row === 7)) {
            piece.king = true;
            this.score += 20;
        }

        this.selected = null;
        this.validMoves = [];
        this.turn = this.turn === 'red' ? 'black' : 'red';

        this.checkWin();
    }

    checkWin() {
        let redPieces = 0, blackPieces = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    if (piece.player === 'red') redPieces++;
                    else blackPieces++;
                }
            }
        }

        if (redPieces === 0) {
            this.gameState = 'blackWin';
            this.score += 100;
        } else if (blackPieces === 0) {
            this.gameState = 'redWin';
            this.score += 100;
        }
    }

    render() {
        this.ctx.fillStyle = '#dcb';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const cellSize = 60;
        const offsetX = 100;
        const offsetY = 40;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const x = offsetX + col * cellSize;
                const y = offsetY + row * cellSize;

                this.ctx.fillStyle = (row + col) % 2 === 0 ? '#ec8' : '#864';
                this.ctx.fillRect(x, y, cellSize, cellSize);

                if (this.selected && this.selected.row === row && this.selected.col === col) {
                    this.ctx.fillStyle = 'rgba(255,255,0,0.5)';
                    this.ctx.fillRect(x, y, cellSize, cellSize);
                }

                for (const move of this.validMoves) {
                    if (move.row === row && move.col === col) {
                        this.ctx.fillStyle = 'rgba(0,255,0,0.3)';
                        this.ctx.beginPath();
                        this.ctx.arc(x + cellSize / 2, y + cellSize / 2, 15, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                }

                const piece = this.board[row][col];
                if (piece) {
                    this.ctx.fillStyle = piece.player === 'red' ? '#d44' : '#222';
                    this.ctx.beginPath();
                    this.ctx.arc(x + cellSize / 2, y + cellSize / 2, 25, 0, Math.PI * 2);
                    this.ctx.fill();

                    this.ctx.fillStyle = piece.player === 'red' ? '#a33' : '#111';
                    this.ctx.beginPath();
                    this.ctx.arc(x + cellSize / 2, y + cellSize / 2, 20, 0, Math.PI * 2);
                    this.ctx.fill();

                    if (piece.king) {
                        this.ctx.fillStyle = '#ff0';
                        this.ctx.font = 'bold 20px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText('K', x + cellSize / 2, y + cellSize / 2 + 7);
                    }
                }
            }
        }

        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(600, 150, 180, 120);
        this.ctx.strokeStyle = '#888';
        this.ctx.strokeRect(600, 150, 180, 120);

        this.ctx.fillStyle = this.turn === 'red' ? '#d44' : '#222';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${this.turn.toUpperCase()}'s Turn`, 690, 185);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 690, 220);
        this.ctx.fillText('Click to select', 690, 245);
        this.ctx.fillText('Move to green', 690, 265);

        if (this.gameState !== 'playing') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            const winner = this.gameState === 'redWin' ? 'RED' : 'BLACK';
            this.ctx.fillText(`${winner} WINS!`, this.width / 2, this.height / 2);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 50);
        }
    }

    handleKeyDown(key) {
        if (key === ' ' && this.gameState !== 'playing') this.start();
    }

    handleKeyUp(key) {}

    getState() { return { turn: this.turn, score: this.score }; }

    setControllerData(data) {
        if (data.click) {
            const cellSize = 60;
            const col = Math.floor((data.x - 100) / cellSize);
            const row = Math.floor((data.y - 40) / cellSize);
            if (row >= 0 && row < 8 && col >= 0 && col < 8) {
                this.selectPiece(row, col);
            }
        }
    }
}

window.CheckersGame = CheckersGame;