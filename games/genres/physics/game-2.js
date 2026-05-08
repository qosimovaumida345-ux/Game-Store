class PhysicsPuzzleGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.balls = [];
        this.gameState = 'playing';
        this.score = 0;
        this.gravity = 0.3;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.balls = [];
        this.score = 0;
        this.gameState = 'playing';
    }

    update() {
        if (this.gameState !== 'playing') return;

        for (const ball of this.balls) {
            ball.vy += this.gravity;
            ball.x += ball.vx;
            ball.y += ball.vy;

            if (ball.x < 20 || ball.x > this.width - 20) {
                ball.vx *= -0.8;
                ball.x = Math.max(20, Math.min(this.width - 20, ball.x));
            }

            if (ball.y > this.height - 20) {
                ball.y = this.height - 20;
                ball.vy *= -0.7;
                ball.vx *= 0.95;
            }

            if (Math.abs(ball.vx) < 0.1 && Math.abs(ball.vy) < 0.5 && ball.y > this.height - 30) {
                ball.settled = true;
            }
        }

        for (let i = 0; i < this.balls.length; i++) {
            for (let j = i + 1; j < this.balls.length; j++) {
                const b1 = this.balls[i];
                const b2 = this.balls[j];
                const dx = b2.x - b1.x;
                const dy = b2.y - b1.y;
                const dist = Math.hypot(dx, dy);

                if (dist < 40) {
                    const angle = Math.atan2(dy, dx);
                    const overlap = 40 - dist;

                    b1.x -= Math.cos(angle) * overlap / 2;
                    b1.y -= Math.sin(angle) * overlap / 2;
                    b2.x += Math.cos(angle) * overlap / 2;
                    b2.y += Math.sin(angle) * overlap / 2;

                    const v1 = Math.hypot(b1.vx, b1.vy);
                    const v2 = Math.hypot(b2.vx, b2.vy);

                    b1.vx -= Math.cos(angle) * 0.5;
                    b1.vy -= Math.sin(angle) * 0.5;
                    b2.vx += Math.cos(angle) * 0.5;
                    b2.vy += Math.sin(angle) * 0.5;
                }
            }
        }

        const allSettled = this.balls.length > 0 && this.balls.every(b => b.settled);
        if (allSettled && this.balls.length > 0) {
            this.score = this.balls.length * 10;
        }
    }

    spawnBall(x, y) {
        this.balls.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            radius: 15,
            color: `hsl(${Math.random() * 360}, 70%, 60%)`,
            settled: false
        });
    }

    render() {
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, this.height - 20, this.width, 20);

        for (const ball of this.balls) {
            this.ctx.fillStyle = ball.color;
            this.ctx.beginPath();
            this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
            this.ctx.beginPath();
            this.ctx.arc(ball.x - 5, ball.y - 5, ball.radius * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Balls: ${this.balls.length}`, 20, 30);
        this.ctx.fillText(`Score: ${this.score}`, 20, 55);

        this.ctx.textAlign = 'right';
        this.ctx.fillText('Click to spawn balls', this.width - 20, 30);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PHYSICS BALLS', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Click to spawn balls', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        }
    }

    handleKeyDown(key) {
        if (key === ' ' && this.gameState !== 'playing') this.start();
    }

    handleKeyUp(key) {}

    getState() { return { balls: this.balls.length, score: this.score }; }

    setControllerData(data) {
        if (data.click) this.spawnBall(data.x, data.y);
    }
}

window.PhysicsPuzzleGame = PhysicsPuzzleGame;