class SnakeGame2 {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.snake = [];
        this.food = null;
        this.score = 0;
        this.gameState = 'start';
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.snake = [
            { x: 400, y: 300 },
            { x: 380, y: 300 },
            { x: 360, y: 300 }
        ];
        this.food = this.spawnFood();
        this.score = 0;
        this.gameState = 'playing';
        this.direction = { x: 1, y: 0 };
    }

    spawnFood() {
        return {
            x: 50 + Math.floor(Math.random() * 15) * 50,
            y: 50 + Math.floor(Math.random() * 11) * 50
        };
    }

    update() {
        if (this.gameState !== 'playing') return;

        if (this.keys.left && this.direction.x !== 1) this.direction = { x: -1, y: 0 };
        if (this.keys.right && this.direction.x !== -1) this.direction = { x: 1, y: 0 };
        if (this.keys.up && this.direction.y !== 1) this.direction = { x: 0, y: -1 };
        if (this.keys.down && this.direction.y !== -1) this.direction = { x: 0, y: 1 };

        const head = { x: this.snake[0].x + this.direction.x * 20, y: this.snake[0].y + this.direction.y * 20 };

        if (head.x < 20 || head.x > 780 || head.y < 20 || head.y > 580) {
            this.gameState = 'gameover';
            return;
        }

        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                this.gameState = 'gameover';
                return;
            }
        }

        this.snake.unshift(head);

        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.food = this.spawnFood();
        } else {
            this.snake.pop();
        }
    }

    render() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        for (let x = 20; x < 800; x += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, 600);
            this.ctx.stroke();
        }
        for (let y = 20; y < 600; y += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(800, y);
            this.ctx.stroke();
        }

        for (let i = 0; i < this.snake.length; i++) {
            this.ctx.fillStyle = i === 0 ? '#2ecc71' : '#27ae60';
            this.ctx.beginPath();
            this.ctx.arc(this.snake[i].x + 10, this.snake[i].y + 10, 8, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(this.snake[i].x + 10, this.snake[i].y + 10, 5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.arc(this.food.x + 10, this.food.y + 10, 8, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('SNAKE', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Arrow Keys to Move', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
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
        if (key === 'ArrowLeft') this.keys.left = true;
        if (key === 'ArrowRight') this.keys.right = true;
        if (key === 'ArrowUp') this.keys.up = true;
        if (key === 'ArrowDown') this.keys.down = true;
        if (key === ' ' && this.gameState !== 'playing') this.start();
    }

    handleKeyUp(key) {
        if (key === 'ArrowLeft') this.keys.left = false;
        if (key === 'ArrowRight') this.keys.right = false;
        if (key === 'ArrowUp') this.keys.up = false;
        if (key === 'ArrowDown') this.keys.down = false;
    }

    getState() { return { score: this.score }; }
    setControllerData(data) {
        if (data.keys) for (const k of data.keys) this.handleKeyDown(k);
    }
}

window.SnakeGame2 = SnakeGame2;