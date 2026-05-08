class BasketballGame2 {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.ball = { x: 400, y: 400, vx: 0, vy: 0 };
        this.score = 0;
        this.attempts = 0;
        this.gameState = 'start';
        this.hoop = { x: 700, y: 250 };
        this.hasBall = true;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.ball = { x: 400, y: 400, vx: 0, vy: 0 };
        this.score = 0;
        this.attempts = 0;
        this.gameState = 'playing';
        this.hasBall = true;
    }

    update() {
        if (this.gameState !== 'playing') return;

        if (this.hasBall) {
            if (this.keys.left && this.ball.x > 50) this.ball.x -= 5;
            if (this.keys.right && this.ball.x < 250) this.ball.x += 5;

            if (this.keys.action) {
                this.keys.action = false;
                this.ball.vx = 5;
                this.ball.vy = -12;
                this.hasBall = false;
                this.attempts++;
            }
        } else {
            this.ball.x += this.ball.vx;
            this.ball.y += this.ball.vy;
            this.ball.vy += 0.4;

            if (this.ball.x > this.hoop.x - 30 && this.ball.x < this.hoop.x + 30 &&
                this.ball.y > this.hoop.y - 10 && this.ball.y < this.hoop.y + 10) {
                this.score++;
                this.resetBall();
            }

            if (this.ball.y > 600 || this.ball.x > 850) {
                this.resetBall();
            }
        }
    }

    resetBall() {
        this.ball = { x: 400, y: 400, vx: 0, vy: 0 };
        this.hasBall = true;
    }

    render() {
        this.ctx.fillStyle = '#f4a460';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(650, 200, 10, 150);
        this.ctx.fillRect(750, 200, 10, 150);

        this.ctx.fillStyle = '#e67e22';
        this.ctx.beginPath();
        this.ctx.arc(700, 250, 30, 0, Math.PI, false);
        this.ctx.fill();

        this.ctx.fillStyle = '#e67e22';
        this.ctx.beginPath();
        this.ctx.ellipse(700, 280, 25, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#f1c40f';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, 15, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = '#d35400';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, 15, -0.5, 0.5);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, 15, 2.5, 3.5);
        this.ctx.stroke();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
        this.ctx.fillText(`Attempts: ${this.attempts}`, 20, 55);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('BASKETBALL', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Arrows: Move | Z: Shoot', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        }
    }

    handleKeyDown(key) {
        if (key === 'ArrowLeft') this.keys.left = true;
        if (key === 'ArrowRight') this.keys.right = true;
        if (key === 'z' || key === 'Z') this.keys.action = true;
        if (key === ' ' && this.gameState !== 'playing') this.start();
    }

    handleKeyUp(key) {
        if (key === 'ArrowLeft') this.keys.left = false;
        if (key === 'ArrowRight') this.keys.right = false;
        if (key === 'z' || key === 'Z') this.keys.action = false;
    }

    getState() { return { score: this.score, attempts: this.attempts }; }
    setControllerData(data) {
        if (data.keys) for (const k of data.keys) this.handleKeyDown(k);
        if (data.released) for (const k of data.released) this.handleKeyUp(k);
    }
}

window.BasketballGame2 = BasketballGame2;