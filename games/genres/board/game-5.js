class Connect4Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.board = [];
        this.currentPlayer = 1;
        this.gameState = 'playing';
        this.score = 0;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.board = Array(6).fill(null).map(() => Array(7).fill(0));
        this.currentPlayer = 1;
        this.gameState = 'playing';
        this.score = 0;
    }

    update() {}

    dropPiece(col) {
        if (this.gameState !== 'playing') return;

        for (let row = 5; row >= 0; row--) {
            if (this.board[row][col] === 0) {
                this.board[row][col] = this.currentPlayer;
                this.score += 10;

                if (this.checkWin(row, col)) {
                    this.gameState = 'win';
                    this.score += 100;
                } else if (this.checkDraw()) {
                    this.gameState = 'draw';
                } else {
                    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
                }
                return true;
            }
        }
        return false;
    }

    checkWin(row, col) {
        const player = this.board[row][col];
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

        for (const [dr, dc] of directions) {
            let count = 1;

            for (let i = 1; i < 4; i++) {
                const r = row + dr * i;
                const c = col + dc * i;
                if (r < 0 || r >= 6 || c < 0 || c >= 7 || this.board[r][c] !== player) break;
                count++;
            }

            for (let i = 1; i < 4; i++) {
                const r = row - dr * i;
                const c = col - dc * i;
                if (r < 0 || r >= 6 || c < 0 || c >= 7 || this.board[r][c] !== player) break;
                count++;
            }

            if (count >= 4) return true;
        }
        return false;
    }

    checkDraw() {
        return this.board[0].every(cell => cell !== 0);
    }

    render() {
        this.ctx.fillStyle = '#2980b9';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const cellSize = 70;
        const offsetX = 75;
        const offsetY = 50;

        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                const x = offsetX + col * cellSize;
                const y = offsetY + row * cellSize;

                this.ctx.fillStyle = '#3498db';
                this.ctx.beginPath();
                this.ctx.arc(x + cellSize / 2, y + cellSize / 2, 28, 0, Math.PI * 2);
                this.ctx.fill();

                if (this.board[row][col] === 1) {
                    this.ctx.fillStyle = '#e74c3c';
                    this.ctx.beginPath();
                    this.ctx.arc(x + cellSize / 2, y + cellSize / 2, 25, 0, Math.PI * 2);
                    this.ctx.fill();
                } else if (this.board[row][col] === 2) {
                    this.ctx.fillStyle = '#f1c40f';
                    this.ctx.beginPath();
                    this.ctx.arc(x + cellSize / 2, y + cellSize / 2, 25, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Player: ${this.currentPlayer === 1 ? 'Red' : 'Yellow'}`, 20, 30);
        this.ctx.fillText(`Score: ${this.score}`, 20, 55);

        if (this.gameState === 'win') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#2ecc71';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${this.currentPlayer === 1 ? 'RED' : 'YELLOW'} WINS!`, this.width / 2, this.height / 2);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 50);
        } else if (this.gameState === 'draw') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('DRAW!', this.width / 2, this.height / 2);
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 50);
        }
    }

    handleKeyDown(key) {
        if (key === ' ' && this.gameState !== 'playing') {
            this.start();
        } else if (this.gameState === 'playing') {
            const colMap = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6 };
            if (colMap[key] !== undefined) {
                this.dropPiece(colMap[key]);
            }
        }
    }

    handleKeyUp(key) {}

    getState() { return { player: this.currentPlayer, score: this.score }; }
    setControllerData(data) {
        if (data.col !== undefined) this.dropPiece(data.col);
    }
}

window.Connect4Game = Connect4Game;