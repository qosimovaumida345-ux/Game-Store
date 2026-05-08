class PongGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.paddle1 = { x: 50, y: 250, score: 0 };
        this.paddle2 = { x: 750, y: 250, score: 0 };
        this.ball = { x: 400, y: 300, vx: 5, vy: 3 };
        this.gameState = 'start';
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.paddle1.score = 0;
        this.paddle2.score = 0;
        this.resetBall();
        this.gameState = 'playing';
    }

    resetBall() {
        this.ball = { x: 400, y: 300, vx: (Math.random() > 0.5 ? 5 : -5), vy: (Math.random() - 0.5) * 6 };
    }

    update() {
        if (this.gameState !== 'playing') return;

        if (this.keys.w1) this.paddle1.y -= 8;
        if (this.keys.s1) this.paddle1.y += 8;
        if (this.keys.w2) this.paddle2.y -= 8;
        if (this.keys.s2) this.paddle2.y += 8;

        this.paddle1.y = Math.max(50, Math.min(500, this.paddle1.y));
        this.paddle2.y = Math.max(50, Math.min(500, this.paddle2.y));

        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;

        if (this.ball.y < 30 || this.ball.y > 570) {
            this.ball.vy *= -1;
            this.ball.y = Math.max(30, Math.min(570, this.ball.y));
        }

        if (this.ball.x < this.paddle1.x + 20 && this.ball.x > this.paddle1.x - 10 &&
            this.ball.y > this.paddle1.y - 40 && this.ball.y < this.paddle1.y + 90) {
            this.ball.vx = Math.abs(this.ball.vx) * 1.1;
            this.ball.vy += (this.ball.y - this.paddle1.y) * 0.1;
        }

        if (this.ball.x > this.paddle2.x - 20 && this.ball.x < this.paddle2.x + 10 &&
            this.ball.y > this.paddle2.y - 40 && this.ball.y < this.paddle2.y + 90) {
            this.ball.vx = -Math.abs(this.ball.vx) * 1.1;
            this.ball.vy += (this.ball.y - this.paddle2.y) * 0.1;
        }

        if (this.ball.x < 0) {
            this.paddle2.score++;
            this.resetBall();
        }
        if (this.ball.x > 800) {
            this.paddle1.score++;
            this.resetBall();
        }

        const maxSpeed = 15;
        this.ball.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.ball.vx));
        this.ball.vy = Math.max(-maxSpeed, Math.min(maxSpeed, this.ball.vy));
    }

    render() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.strokeStyle = '#fff';
        this.ctx.setLineDash([20, 15]);
        this.ctx.beginPath();
        this.ctx.moveTo(400, 0);
        this.ctx.lineTo(400, 600);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, 10, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillRect(this.paddle1.x - 10, this.paddle1.y - 40, 15, 80);
        this.ctx.fillRect(this.paddle2.x - 5, this.paddle2.y - 40, 15, 80);

        this.ctx.font = 'bold 40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.paddle1.score, 200, 50);
        this.ctx.fillText(this.paddle2.score, 600, 50);

        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#888';
        this.ctx.fillText('P1: W/S', 80, 550);
        this.ctx.fillText('P2: Arrow Up/Down', 720, 550);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.fillText('PONG', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 20);
        }
    }

    handleKeyDown(key) {
        if (key === 'w' || key === 'W') this.keys.w1 = true;
        if (key === 's' || key === 'S') this.keys.s1 = true;
        if (key === 'ArrowUp') this.keys.w2 = true;
        if (key === 'ArrowDown') this.keys.s2 = true;
        if (key === ' ' && this.gameState !== 'playing') this.start();
    }

    handleKeyUp(key) {
        if (key === 'w' || key === 'W') this.keys.w1 = false;
        if (key === 's' || key === 'S') this.keys.s1 = false;
        if (key === 'ArrowUp') this.keys.w2 = false;
        if (key === 'ArrowDown') this.keys.s2 = false;
    }

    getState() { return { p1: this.paddle1.score, p2: this.paddle2.score }; }
    setControllerData(data) {
        if (data.keys) for (const k of data.keys) this.handleKeyDown(k);
        if (data.released) for (const k of data.released) this.handleKeyUp(k);
    }
}

window.PongGame = PongGame;