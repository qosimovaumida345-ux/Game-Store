class PinballGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.ball = { x: 400, y: 550, vx: 0, vy: 0 };
        this.flippers = [];
        this.bumpers = [];
        this.score = 0;
        this.gameState = 'start';
        this.launched = false;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.reset();
    }

    reset() {
        this.ball = { x: 650, y: 500, vx: 0, vy: 0 };
        this.flippers = [
            { x: 200, y: 550, angle: 0.4, targetAngle: 0.4, side: 'left' },
            { x: 600, y: 550, angle: 2.7, targetAngle: 2.7, side: 'right' }
        ];
        this.bumpers = [
            { x: 400, y: 200, r: 20, hit: 0 },
            { x: 300, y: 300, r: 15, hit: 0 },
            { x: 500, y: 300, r: 15, hit: 0 },
            { x: 400, y: 400, r: 25, hit: 0 }
        ];
        this.score = 0;
        this.launched = false;
    }

    start() {
        this.gameState = 'playing';
        this.reset();
    }

    update() {
        if (this.gameState !== 'playing') return;

        if (!this.launched && this.keys.action) {
            this.ball.vy = -18;
            this.launched = true;
        }

        if (this.keys.leftFlip) {
            this.flippers[0].targetAngle = -0.4;
        } else {
            this.flippers[0].targetAngle = 0.4;
        }

        if (this.keys.rightFlip) {
            this.flippers[1].targetAngle = 3.5;
        } else {
            this.flippers[1].targetAngle = 2.7;
        }

        for (const f of this.flippers) {
            f.angle += (f.targetAngle - f.angle) * 0.4;
        }

        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;
        this.ball.vx *= 0.995;
        this.ball.vy *= 0.995;
        this.ball.vy += 0.3;

        if (this.ball.x < 20 || this.ball.x > 780) {
            this.ball.vx *= -0.8;
            this.ball.x = Math.max(20, Math.min(780, this.ball.x));
        }

        if (this.ball.y < 20) {
            this.ball.vy = Math.abs(this.ball.vy) * 0.8;
        }

        for (const b of this.bumpers) {
            const dx = this.ball.x - b.x;
            const dy = this.ball.y - b.y;
            const dist = Math.hypot(dx, dy);

            if (dist < b.r + 10) {
                const angle = Math.atan2(dy, dx);
                this.ball.vx = Math.cos(angle) * 15;
                this.ball.vy = Math.sin(angle) * 15;
                this.score += 100;
                b.hit = 10;
            }

            if (b.hit > 0) b.hit--;
        }

        for (const f of this.flippers) {
            const fx = f.side === 'left' ? 200 : 600;
            const dx = this.ball.x - fx;
            const dy = this.ball.y - f.y;

            if (dy > 0 && dy < 80 && Math.abs(dx) < 30) {
                const flipAngle = f.side === 'left' ? f.angle : f.angle;
                const normalY = Math.cos(flipAngle);
                const normalX = -Math.sin(flipAngle);

                const dot = this.ball.vx * normalX + this.ball.vy * normalY;
                if (dot < 0) {
                    this.ball.vx -= 2 * dot * normalX + (this.keys[f.side === 'left' ? 'leftFlip' : 'rightFlip'] ? 10 : 0);
                    this.ball.vy -= 2 * dot * normalY;
                    this.ball.x += normalX * 5;
                    this.ball.y += normalY * 5;
                }
            }
        }

        if (this.ball.y > 650) {
            this.launched = false;
            this.ball = { x: 650, y: 500, vx: 0, vy: 0 };
        }
    }

    render() {
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = '#444';
        this.ctx.fillRect(50, 100, 20, 500);
        this.ctx.fillRect(730, 100, 20, 500);

        for (const b of this.bumpers) {
            this.ctx.fillStyle = b.hit > 0 ? '#ff0' : '#f44';
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('100', b.x, b.y + 5);
        }

        this.ctx.fillStyle = '#666';
        this.ctx.fillRect(65, 150, 10, 400);
        this.ctx.fillRect(725, 150, 10, 400);

        for (const f of this.flippers) {
            this.ctx.save();
            this.ctx.translate(f.x, f.y);
            this.ctx.rotate(f.angle);

            this.ctx.fillStyle = '#f44';
            this.ctx.fillRect(-60, -8, 80, 16);

            this.ctx.restore();
        }

        this.ctx.fillStyle = '#ccc';
        this.ctx.beginPath();
        this.ctx.arc(650, 500, 15, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#888';
        this.ctx.fillRect(600, 450, 100, 20);

        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, 10, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);

        this.ctx.textAlign = 'right';
        if (!this.launched) {
            this.ctx.fillText('Press Z to launch', this.width - 20, 30);
        }

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PINBALL', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Left Flipper: A | Right Flipper: D | Launch: Z', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        }
    }

    handleKeyDown(key) {
        if (key === 'a' || key === 'A') this.keys.leftFlip = true;
        if (key === 'd' || key === 'D') this.keys.rightFlip = true;
        if (key === 'z' || key === 'Z') this.keys.action = true;
        if (key === ' ' && this.gameState !== 'playing') this.start();
    }

    handleKeyUp(key) {
        if (key === 'a' || key === 'A') this.keys.leftFlip = false;
        if (key === 'd' || key === 'D') this.keys.rightFlip = false;
        if (key === 'z' || key === 'Z') this.keys.action = false;
    }

    getState() { return { score: this.score }; }
    setControllerData(data) {
        if (data.keys) for (const k of data.keys) this.handleKeyDown(k);
        if (data.released) for (const k of data.released) this.handleKeyUp(k);
    }
}

window.PinballGame = PinballGame;