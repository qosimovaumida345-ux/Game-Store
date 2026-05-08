class TetrisGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.grid = [];
        this.score = 0;
        this.gameState = 'start';
        this.currentPiece = null;
        this.gameOver = false;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resetGame();
    }

    resetGame() {
        this.grid = [];
        for (let y = 0; y < 20; y++) {
            this.grid[y] = [];
            for (let x = 0; x < 10; x++) {
                this.grid[y][x] = 0;
            }
        }
        this.score = 0;
        this.gameOver = false;
    }

    start() {
        this.gameState = 'playing';
        this.resetGame();
        this.spawnPiece();
    }

    spawnPiece() {
        const shapes = [
            [[1, 1, 1, 1]],
            [[1, 1], [1, 1]],
            [[1, 1, 1], [0, 1, 0]],
            [[1, 1, 1], [1, 0, 0]],
            [[1, 1, 1], [0, 0, 1]],
            [[1, 1, 0], [0, 1, 1]],
            [[0, 1, 1], [1, 1, 0]]
        ];
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c'];

        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];

        this.currentPiece = {
            shape: shape,
            color: color,
            x: 3,
            y: 0
        };

        if (this.checkCollision(0, 0)) {
            this.gameOver = true;
            this.gameState = 'gameover';
        }
    }

    checkCollision(dx, dy) {
        const piece = this.currentPiece;
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const newX = piece.x + x + dx;
                    const newY = piece.y + y + dy;

                    if (newX < 0 || newX >= 10 || newY >= 20) return true;
                    if (newY >= 0 && this.grid[newY][newX]) return true;
                }
            }
        }
        return false;
    }

    rotate() {
        const oldShape = this.currentPiece.shape;
        const newShape = oldShape[0].map((_, i) => oldShape.map(row => row[i]).reverse());

        const oldX = this.currentPiece.x;
        this.currentPiece.shape = newShape;

        if (this.checkCollision(0, 0)) {
            this.currentPiece.x = oldX;
            this.currentPiece.shape = oldShape;
        }
    }

    move(dx) {
        if (!this.checkCollision(dx, 0)) {
            this.currentPiece.x += dx;
        }
    }

    drop() {
        if (!this.checkCollision(0, 1)) {
            this.currentPiece.y++;
        } else {
            this.lockPiece();
            this.clearLines();
            this.spawnPiece();
        }
    }

    lockPiece() {
        const piece = this.currentPiece;
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const gridY = piece.y + y;
                    const gridX = piece.x + x;
                    if (gridY >= 0) {
                        this.grid[gridY][gridX] = piece.color;
                    }
                }
            }
        }
    }

    clearLines() {
        for (let y = 19; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== 0)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(10).fill(0));
                this.score += 100;
                y++;
            }
        }
    }

    update() {
        if (this.gameState !== 'playing' || this.gameOver) return;
    }

    render() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const cellSize = 30;
        const offsetX = 50;
        const offsetY = 30;

        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                if (this.grid[y][x]) {
                    this.ctx.fillStyle = this.grid[y][x];
                    this.ctx.fillRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize - 2, cellSize - 2);
                } else {
                    this.ctx.fillStyle = '#16213e';
                    this.ctx.fillRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize - 2, cellSize - 2);
                }
            }
        }

        if (this.currentPiece && !this.gameOver) {
            const piece = this.currentPiece;
            for (let y = 0; y < piece.shape.length; y++) {
                for (let x = 0; x < piece.shape[y].length; x++) {
                    if (piece.shape[y][x]) {
                        this.ctx.fillStyle = piece.color;
                        this.ctx.fillRect(offsetX + (piece.x + x) * cellSize, offsetY + (piece.y + y) * cellSize, cellSize - 2, cellSize - 2);
                    }
                }
            }
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 400, 50);

        this.ctx.fillStyle = '#aaa';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Controls:', 400, 100);
        this.ctx.fillText('← → : Move', 400, 130);
        this.ctx.fillText('↑ : Rotate', 400, 155);
        this.ctx.fillText('↓ : Drop', 400, 180);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('TETRIS', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 20);
        } else if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`Score: ${this.score}`, this.width / 2, this.height / 2 + 20);
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 60);
        }
    }

    handleKeyDown(key) {
        if (key === ' ' && this.gameState !== 'playing') {
            this.start();
            return;
        }

        if (this.gameState !== 'playing' || this.gameOver) return;

        if (key === 'ArrowLeft') this.move(-1);
        if (key === 'ArrowRight') this.move(1);
        if (key === 'ArrowDown') this.drop();
        if (key === 'ArrowUp') this.rotate();
    }

    handleKeyUp(key) {}

    getState() { return { score: this.score }; }
    setControllerData(data) {
        if (data.keys) for (const k of data.keys) this.handleKeyDown(k);
    }
}

window.TetrisGame = TetrisGame;