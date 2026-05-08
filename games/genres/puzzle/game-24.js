class MazeGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.maze = [];
        this.player = { x: 1, y: 1 };
        this.exit = { x: 0, y: 0 };
        this.gameState = 'start';
        this.time = 0;
        this.mazeSize = 15;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.generateMaze();
        this.gameState = 'playing';
        this.time = 0;
        this.player = { x: 1, y: 1 };
    }

    generateMaze() {
        this.maze = [];
        for (let y = 0; y < this.mazeSize; y++) {
            this.maze[y] = [];
            for (let x = 0; x < this.mazeSize; x++) {
                this.maze[y][x] = 1;
            }
        }

        const stack = [{ x: 1, y: 1 }];
        this.maze[1][1] = 0;

        const directions = [[0, -2], [0, 2], [-2, 0], [2, 0]];

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const shuffled = directions.slice().sort(() => Math.random() - 0.5);
            let found = false;

            for (const [dx, dy] of shuffled) {
                const nx = current.x + dx;
                const ny = current.y + dy;

                if (nx > 0 && nx < this.mazeSize - 1 && ny > 0 && ny < this.mazeSize - 1 && this.maze[ny][nx] === 1) {
                    this.maze[ny][nx] = 0;
                    this.maze[current.y + dy / 2][current.x + dx / 2] = 0;
                    stack.push({ x: nx, y: ny });
                    found = true;
                    break;
                }
            }

            if (!found) stack.pop();
        }

        this.exit = { x: this.mazeSize - 2, y: this.mazeSize - 2 };
        while (this.maze[this.exit.y][this.exit.x] === 1) {
            this.exit.x--;
        }
    }

    update() {
        if (this.gameState !== 'playing') return;

        this.time++;

        if (this.keys.up && this.player.y > 0 && this.maze[this.player.y - 1][this.player.x] === 0) this.player.y--;
        if (this.keys.down && this.player.y < this.mazeSize - 1 && this.maze[this.player.y + 1][this.player.x] === 0) this.player.y++;
        if (this.keys.left && this.player.x > 0 && this.maze[this.player.y][this.player.x - 1] === 0) this.player.x--;
        if (this.keys.right && this.player.x < this.mazeSize - 1 && this.maze[this.player.y][this.player.x + 1] === 0) this.player.x++;

        if (this.player.x === this.exit.x && this.player.y === this.exit.y) {
            this.gameState = 'win';
        }
    }

    render() {
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const cellSize = Math.min(40, 700 / this.mazeSize);
        const offsetX = (this.width - this.mazeSize * cellSize) / 2;
        const offsetY = (this.height - this.mazeSize * cellSize) / 2;

        for (let y = 0; y < this.mazeSize; y++) {
            for (let x = 0; x < this.mazeSize; x++) {
                const cx = offsetX + x * cellSize;
                const cy = offsetY + y * cellSize;

                if (this.maze[y][x] === 1) {
                    this.ctx.fillStyle = '#444';
                    this.ctx.fillRect(cx, cy, cellSize - 1, cellSize - 1);
                } else {
                    this.ctx.fillStyle = '#333';
                    this.ctx.fillRect(cx, cy, cellSize - 1, cellSize - 1);
                }
            }
        }

        this.ctx.fillStyle = '#0f0';
        this.ctx.beginPath();
        this.ctx.arc(offsetX + this.exit.x * cellSize + cellSize / 2, offsetY + this.exit.y * cellSize + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#f44';
        this.ctx.beginPath();
        this.ctx.arc(offsetX + this.player.x * cellSize + cellSize / 2, offsetY + this.player.y * cellSize + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Time: ${Math.floor(this.time / 60)}s`, 20, 30);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('MAZE RUNNER', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Arrow Keys: Move', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        } else if (this.gameState === 'win') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#0f0';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('YOU WIN!', this.width / 2, this.height / 2 - 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Time: ${Math.floor(this.time / 60)}s`, this.width / 2, this.height / 2 + 20);
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

    getState() { return { time: this.time }; }
    setControllerData(data) {
        if (data.keys) for (const k of data.keys) this.handleKeyDown(k);
        if (data.released) for (const k of data.released) this.handleKeyUp(k);
    }
}

window.MazeGame = MazeGame;