class MazeRunnerGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.player = { x: 1, y: 1 };
        this.exit = { x: 18, y: 18 };
        this.maze = [];
        this.gameState = 'start';
        this.score = 0;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.generateMaze();
        this.player = { x: 1, y: 1 };
        this.gameState = 'playing';
        this.score = 0;
    }

    generateMaze() {
        this.maze = [];
        for (let y = 0; y < 20; y++) {
            this.maze[y] = [];
            for (let x = 0; x < 20; x++) {
                this.maze[y][x] = 1;
            }
        }

        const stack = [{ x: 1, y: 1 }];
        this.maze[1][1] = 0;

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]].sort(() => Math.random() - 0.5);
            let found = false;

            for (const [dx, dy] of dirs) {
                const nx = current.x + dx;
                const ny = current.y + dy;
                if (nx > 0 && nx < 19 && ny > 0 && ny < 19 && this.maze[ny][nx] === 1) {
                    this.maze[ny][nx] = 0;
                    this.maze[current.y + dy / 2][current.x + dx / 2] = 0;
                    stack.push({ x: nx, y: ny });
                    found = true;
                    break;
                }
            }
            if (!found) stack.pop();
        }

        this.exit = { x: 18, y: 18 };
    }

    update() {
        if (this.gameState !== 'playing') return;

        this.score++;

        if (this.keys.up && this.player.y > 0 && this.maze[this.player.y - 1][this.player.x] === 0) this.player.y--;
        if (this.keys.down && this.player.y < 19 && this.maze[this.player.y + 1][this.player.x] === 0) this.player.y++;
        if (this.keys.left && this.player.x > 0 && this.maze[this.player.y][this.player.x - 1] === 0) this.player.x--;
        if (this.keys.right && this.player.x < 19 && this.maze[this.player.y][this.player.x + 1] === 0) this.player.x++;

        if (this.player.x === this.exit.x && this.player.y === this.exit.y) {
            this.gameState = 'win';
        }
    }

    render() {
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const cellSize = 30;
        const offsetX = (this.width - 20 * cellSize) / 2;
        const offsetY = (this.height - 20 * cellSize) / 2;

        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 20; x++) {
                if (this.maze[y][x] === 1) {
                    this.ctx.fillStyle = '#444';
                    this.ctx.fillRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize - 1, cellSize - 1);
                }
            }
        }

        this.ctx.fillStyle = '#2ecc71';
        this.ctx.fillRect(offsetX + this.exit.x * cellSize + 5, offsetY + this.exit.y * cellSize + 5, cellSize - 10, cellSize - 10);

        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.arc(offsetX + this.player.x * cellSize + cellSize / 2, offsetY + this.player.y * cellSize + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Time: ${this.score}`, 20, 30);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('MAZE RUNNER', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Arrow Keys to Move', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        } else if (this.gameState === 'win') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#2ecc71';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('YOU ESCAPED!', this.width / 2, this.height / 2 - 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Time: ${this.score}`, this.width / 2, this.height / 2 + 20);
            this.ctx.fillText('Press SPACE for new maze', this.width / 2, this.height / 2 + 60);
        }
    }

    handleKeyDown(key) {
        if (key === 'ArrowUp') this.keys.up = true;
        if (key === 'ArrowDown') this.keys.down = true;
        if (key === 'ArrowLeft') this.keys.left = true;
        if (key === 'ArrowRight') this.keys.right = true;
        if (key === ' ' && this.gameState !== 'playing') this.start();
    }

    handleKeyUp(key) {
        if (key === 'ArrowUp') this.keys.up = false;
        if (key === 'ArrowDown') this.keys.down = false;
        if (key === 'ArrowLeft') this.keys.left = false;
        if (key === 'ArrowRight') this.keys.right = false;
    }

    getState() { return { score: this.score }; }
    setControllerData(data) {
        if (data.keys) for (const k of data.keys) this.handleKeyDown(k);
    }
}

window.MazeRunnerGame = MazeRunnerGame;