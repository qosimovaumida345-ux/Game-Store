class BrickBreakerGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.paddle = { x: 350, width: 100 };
        this.ball = { x: 400, y: 500, vx: 4, vy: -4 };
        this.bricks = [];
        this.score = 0;
        this.lives = 3;
        this.gameState = 'start';
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.score = 0;
        this.lives = 3;
        this.paddle = { x: 350, width: 100 };
        this.resetBall();
        this.createBricks();
        this.gameState = 'playing';
    }

    resetBall() {
        this.ball = { x: 400, y: 500, vx: 4 * (Math.random() > 0.5 ? 1 : -1), vy: -4 };
    }

    createBricks() {
        this.bricks = [];
        const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 10; col++) {
                this.bricks.push({
                    x: 60 + col * 70,
                    y: 80 + row * 30,
                    w: 60,
                    h: 20,
                    color: colors[row],
                    active: true
                });
            }
        }
    }

    update() {
        if (this.gameState !== 'playing') return;

        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;

        if (this.ball.x < 10 || this.ball.x > 790) {
            this.ball.vx *= -1;
            this.ball.x = Math.max(10, Math.min(790, this.ball.x));
        }

        if (this.ball.y < 10) {
            this.ball.vy *= -1;
        }

        if (this.ball.y > 600) {
            this.lives--;
            if (this.lives <= 0) {
                this.gameState = 'gameover';
            } else {
                this.resetBall();
            }
        }

        if (this.ball.y > this.paddle.x - 10 && this.ball.y < this.paddle.x + this.paddle.width + 10 &&
            this.ball.y > 560 && this.ball.y < 580) {
            const hitPos = (this.ball.x - this.paddle.x) / this.paddle.width;
            this.ball.vx = (hitPos - 0.5) * 10;
            this.ball.vy = -Math.abs(this.ball.vy);
        }

        for (const brick of this.bricks) {
            if (!brick.active) continue;
            if (this.ball.x > brick.x && this.ball.x < brick.x + brick.w &&
                this.ball.y > brick.y && this.ball.y < brick.y + brick.h) {
                brick.active = false;
                this.ball.vy *= -1;
                this.score += 10;
            }
        }

        if (this.bricks.every(b => !b.active)) {
            this.createBricks();
            this.ball.vx *= 1.2;
            this.ball.vy *= 1.2;
        }

        if (this.keys.left && this.paddle.x > 20) this.paddle.x -= 8;
        if (this.keys.right && this.paddle.x < 680) this.paddle.x += 8;
    }

    render() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.width, this.height);

        for (const brick of this.bricks) {
            if (!brick.active) continue;
            this.ctx.fillStyle = brick.color;
            this.ctx.fillRect(brick.x, brick.y, brick.w - 2, brick.h - 2);
        }

        this.ctx.fillStyle = '#3498db';
        this.ctx.fillRect(this.paddle.x, 570, this.paddle.width, 15);

        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, 8, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
        this.ctx.fillText(`Lives: ${'❤️'.repeat(this.lives)}`, 20, 55);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('BRICK BREAKER', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Arrows to move', this.width / 2, this.height / 2 + 10);
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
        if (key === ' ' && this.gameState !== 'playing') this.start();
    }

    handleKeyUp(key) {
        if (key === 'ArrowLeft') this.keys.left = false;
        if (key === 'ArrowRight') this.keys.right = false;
    }

    getState() { return { score: this.score, lives: this.lives }; }
    setControllerData(data) {
        if (data.keys) for (const k of data.keys) this.handleKeyDown(k);
        if (data.released) for (const k of data.released) this.handleKeyUp(k);
    }
}

window.BrickBreakerGame = BrickBreakerGame;