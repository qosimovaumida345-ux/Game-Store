class BowlingGame2 {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.ball = { x: 400, y: 500, vx: 0 };
        this.pins = [];
        this.score = 0;
        this.frame = 1;
        this.throw = 1;
        this.gameState = 'start';
        this.aimAngle = 0;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.ball = { x: 400, y: 500, vx: 0 };
        this.score = 0;
        this.frame = 1;
        this.throw = 1;
        this.gameState = 'playing';
        this.aimAngle = 0;
        this.resetPins();
    }

    resetPins() {
        this.pins = [];
        const positions = [
            { x: 400, y: 150 },
            { x: 385, y: 165 }, { x: 400, y: 165 }, { x: 415, y: 165 },
            { x: 370, y: 180 }, { x: 385, y: 180 }, { x: 400, y: 180 }, { x: 415, y: 180 }, { x: 430, y: 180 },
            { x: 355, y: 195 }
        ];
        for (const p of positions) {
            this.pins.push({ x: p.x, y: p.y, hit: false, fallAngle: 0 });
        }
    }

    update() {
        if (this.gameState !== 'playing') return;

        if (this.keys.left && this.ball.vx === 0 && this.aimAngle > -0.5) this.aimAngle -= 0.02;
        if (this.keys.right && this.ball.vx === 0 && this.aimAngle < 0.5) this.aimAngle += 0.02;

        if (this.keys.action && this.ball.vx === 0) {
            this.keys.action = false;
            this.ball.vx = 8 + this.aimAngle * 2;
        }

        if (this.ball.vx !== 0) {
            this.ball.x += this.ball.vx;
            this.ball.vx *= 0.995;

            for (const pin of this.pins) {
                if (!pin.hit && Math.abs(this.ball.x - pin.x) < 20 && Math.abs(this.ball.y - pin.y) < 30) {
                    pin.hit = true;
                    pin.fallAngle = Math.random() * Math.PI;
                    this.score++;
                }
            }

            if (this.ball.y > 100) this.ball.y -= 5;
            if (this.ball.y <= 100) {
                this.ball.vx = 0;
                this.throw++;

                if (this.throw > 2 || this.pins.every(p => p.hit)) {
                    this.frame++;
                    this.throw = 1;
                    if (this.frame > 10) {
                        this.gameState = 'gameover';
                    } else {
                        this.ball = { x: 400, y: 500, vx: 0 };
                        this.aimAngle = 0;
                        this.resetPins();
                    }
                } else {
                    this.ball = { x: 400, y: 500, vx: 0 };
                    this.aimAngle = 0;
                    for (const pin of this.pins) pin.hit = false;
                }
            }
        }
    }

    render() {
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(50, 550, 700, 20);

        this.ctx.fillStyle = '#d4a574';
        this.ctx.fillRect(100, 100, 600, 10);

        for (let i = 0; i < 10; i++) {
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(150 + i * 50, 115, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }

        for (const pin of this.pins) {
            if (pin.hit) {
                this.ctx.save();
                this.ctx.translate(pin.x, pin.y);
                this.ctx.rotate(pin.fallAngle);
                this.ctx.fillStyle = '#fff';
                this.ctx.fillRect(-5, -15, 10, 30);
                this.ctx.restore();
            } else {
                this.ctx.fillStyle = '#fff';
                this.ctx.beginPath();
                this.ctx.arc(pin.x, pin.y, 8, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#f00';
                this.ctx.beginPath();
                this.ctx.arc(pin.x, pin.y, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, 15, 0, Math.PI * 2);
        this.ctx.fill();

        if (this.ball.vx === 0) {
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(this.ball.x, this.ball.y);
            this.ctx.lineTo(this.ball.x + Math.cos(this.aimAngle) * 100, this.ball.y - 100);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
        this.ctx.fillText(`Frame: ${this.frame}/10`, 20, 55);
        this.ctx.fillText(`Throw: ${this.throw}/2`, 20, 80);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('BOWLING', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Left/Right: Aim | Z: Throw', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        } else if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#f1c40f';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 + 20);
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 60);
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

    getState() { return { score: this.score, frame: this.frame }; }
    setControllerData(data) {
        if (data.keys) for (const k of data.keys) this.handleKeyDown(k);
        if (data.released) for (const k of data.released) this.handleKeyUp(k);
    }
}

window.BowlingGame2 = BowlingGame2;