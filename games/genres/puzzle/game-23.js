class MinesweeperGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.grid = [];
        this.revealed = [];
        this.flagged = [];
        this.gameState = 'start';
        this.mineCount = 10;
        this.width = 9;
        this.height = 9;
        this.score = 0;
        this.time = 0;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resetGame();
    }

    resetGame() {
        this.grid = [];
        this.revealed = [];
        this.flagged = [];

        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            this.revealed[y] = [];
            this.flagged[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x] = 0;
                this.revealed[y][x] = false;
                this.flagged[y][x] = false;
            }
        }

        let placed = 0;
        while (placed < this.mineCount) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            if (this.grid[y][x] !== -1) {
                this.grid[y][x] = -1;
                placed++;
            }
        }

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x] === -1) continue;
                let count = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const ny = y + dy;
                        const nx = x + dx;
                        if (ny >= 0 && ny < this.height && nx >= 0 && nx < this.width && this.grid[ny][nx] === -1) {
                            count++;
                        }
                    }
                }
                this.grid[y][x] = count;
            }
        }

        this.score = 0;
        this.time = 0;
    }

    update() {
        if (this.gameState === 'playing') {
            this.time++;
        }
    }

    reveal(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
        if (this.revealed[y][x] || this.flagged[y][x]) return;

        this.revealed[y][x] = true;

        if (this.grid[y][x] === -1) {
            this.gameState = 'gameover';
            for (let row = 0; row < this.height; row++) {
                for (let col = 0; col < this.width; col++) {
                    if (this.grid[row][col] === -1) {
                        this.revealed[row][col] = true;
                    }
                }
            }
            return;
        }

        if (this.grid[y][x] === 0) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    this.reveal(x + dx, y + dy);
                }
            }
        }

        this.checkWin();
    }

    toggleFlag(x, y) {
        if (this.revealed[y][x]) return;
        this.flagged[y][x] = !this.flagged[y][x];
    }

    checkWin() {
        let revealedCount = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.revealed[y][x]) revealedCount++;
            }
        }

        if (revealedCount === this.width * this.height - this.mineCount) {
            this.gameState = 'win';
            this.score = Math.max(0, 10000 - this.time * 10);
        }
    }

    handleClick(x, y, isRightClick) {
        if (this.gameState !== 'playing') return;

        const cellSize = 40;
        const gridX = Math.floor((x - 100) / cellSize);
        const gridY = Math.floor((y - 100) / cellSize);

        if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) return;

        if (isRightClick) {
            this.toggleFlag(gridX, gridY);
        } else {
            this.reveal(gridX, gridY);
        }
    }

    render() {
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const cellSize = 40;
        const offsetX = (this.canvas.width - this.width * cellSize) / 2;
        const offsetY = (this.canvas.height - this.height * cellSize) / 2;

        this.ctx.fillStyle = '#888';
        this.ctx.fillRect(offsetX - 10, offsetY - 10, this.width * cellSize + 20, this.height * cellSize + 20);

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cx = offsetX + x * cellSize;
                const cy = offsetY + y * cellSize;

                if (this.revealed[y][x]) {
                    this.ctx.fillStyle = '#ccc';
                    this.ctx.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);

                    if (this.grid[y][x] > 0) {
                        const colors = ['', '#00f', '#0a0', '#f00', '#00a', '#a00', '#0aa', '#000', '#888'];
                        this.ctx.fillStyle = colors[this.grid[y][x]];
                        this.ctx.font = 'bold 20px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText(this.grid[y][x], cx + cellSize / 2, cy + cellSize / 2 + 7);
                    } else if (this.grid[y][x] === -1) {
                        this.ctx.fillStyle = '#f00';
                        this.ctx.beginPath();
                        this.ctx.arc(cx + cellSize / 2, cy + cellSize / 2, 12, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                } else {
                    this.ctx.fillStyle = '#888';
                    this.ctx.fillRect(cx, cy, cellSize, cellSize);
                    this.ctx.fillStyle = '#aaa';
                    this.ctx.fillRect(cx, cy, cellSize - 2, cellSize - 2);

                    if (this.flagged[y][x]) {
                        this.ctx.fillStyle = '#f00';
                        this.ctx.font = '20px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText('🚩', cx + cellSize / 2, cy + cellSize / 2 + 7);
                    }
                }
            }
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Time: ${Math.floor(this.time / 60)}s`, 20, 30);
        this.ctx.fillText(`Score: ${this.score}`, 20, 50);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('MINESWEEPER', this.canvas.width / 2, this.canvas.height / 2 - 40);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Click to reveal | Right-click to flag', this.canvas.width / 2, this.canvas.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.canvas.width / 2, this.canvas.height / 2 + 50);
        } else if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#f00';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Press SPACE to Restart', this.canvas.width / 2, this.canvas.height / 2 + 30);
        } else if (this.gameState === 'win') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#0f0';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('YOU WIN!', this.canvas.width / 2, this.canvas.height / 2 - 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
            this.ctx.fillText('Press SPACE to Restart', this.canvas.width / 2, this.canvas.height / 2 + 60);
        }
    }

    handleKeyDown(key) {
        if (key === ' ' && this.gameState !== 'playing') {
            this.gameState = 'playing';
            this.resetGame();
        }
    }

    handleKeyUp(key) {}

    getState() { return { revealed: this.revealed.flat().filter(Boolean).length }; }

    setControllerData(data) {
        if (data.click !== undefined) {
            this.handleClick(data.x, data.y, data.rightClick);
        }
    }

    start() {
        this.gameState = 'playing';
        this.resetGame();
    }
}

window.MinesweeperGame = MinesweeperGame;