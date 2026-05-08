class GolfGame2 {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.ball = { x: 100, y: 500 };
        this.hole = { x: 700, y: 100 };
        this.aimAngle = 0;
        this.power = 50;
        this.strokes = 0;
        this.gameState = 'start';
        this.shot = false;
        this.vx = 0;
        this.vy = 0;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.ball = { x: 100, y: 500 };
        this.hole = { x: 700, y: 100 };
        this.strokes = 0;
        this.gameState = 'playing';
        this.vx = 0;
        this.vy = 0;
    }

    update() {
        if (this.gameState !== 'playing') return;

        if (!this.shot) {
            if (this.keys.left) this.aimAngle -= 0.05;
            if (this.keys.right) this.aimAngle += 0.05;
            if (this.keys.up && this.power < 100) this.power += 1;
            if (this.keys.down && this.power > 10) this.power -= 1;
        } else {
            this.ball.x += this.vx;
            this.ball.y += this.vy;
            this.vx *= 0.98;
            this.vy *= 0.98;

            if (Math.abs(this.vx) < 0.1 && Math.abs(this.vy) < 0.1) {
                this.shot = false;
            }

            if (Math.hypot(this.ball.x - this.hole.x, this.ball.y - this.hole.y) < 15) {
                this.gameState = 'win';
            }
        }

        if (this.keys.action && !this.shot) {
            this.keys.action = false;
            this.vx = Math.cos(this.aimAngle) * this.power * 0.15;
            this.vy = Math.sin(this.aimAngle) * this.power * 0.15;
            this.strokes++;
            this.shot = true;
        }
    }

    render() {
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = '#27ae60';
        for (let i = 0; i < 10; i++) {
            this.ctx.beginPath();
            this.ctx.arc(100 + i * 70, 400 + (i % 2) * 20, 30, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(this.hole.x, this.hole.y, 15, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(this.hole.x, this.hole.y, 10, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, 8, 0, Math.PI * 2);
        this.ctx.fill();

        if (!this.shot) {
            const lineLength = this.power * 1.5;
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(this.ball.x, this.ball.y);
            this.ctx.lineTo(this.ball.x + Math.cos(this.aimAngle) * lineLength, this.ball.y + Math.sin(this.aimAngle) * lineLength);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Strokes: ${this.strokes}`, 20, 30);
        this.ctx.fillText(`Power: ${this.power}%`, 20, 55);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('MINI GOLF', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Arrows: Aim/Power | Z: Shoot', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        } else if (this.gameState === 'win') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#f1c40f';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('HOLE IN ONE!', this.width / 2, this.height / 2 - 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Strokes: ${this.strokes}`, this.width / 2, this.height / 2 + 20);
            this.ctx.fillText('Press SPACE to Play Again', this.width / 2, this.height / 2 + 60);
        }
    }

    handleKeyDown(key) {
        if (key === 'ArrowLeft') this.keys.left = true;
        if (key === 'ArrowRight') this.keys.right = true;
        if (key === 'ArrowUp') this.keys.up = true;
        if (key === 'ArrowDown') this.keys.down = true;
        if (key === 'z' || key === 'Z') this.keys.action = true;
        if (key === ' ' && this.gameState !== 'playing') this.start();
    }

    handleKeyUp(key) {
        if (key === 'ArrowLeft') this.keys.left = false;
        if (key === 'ArrowRight') this.keys.right = false;
        if (key === 'ArrowUp') this.keys.up = false;
        if (key === 'ArrowDown') this.keys.down = false;
        if (key === 'z' || key === 'Z') this.keys.action = false;
    }

    getState() { return { strokes: this.strokes }; }
    setControllerData(data) {
        if (data.keys) for (const k of data.keys) this.handleKeyDown(k);
        if (data.released) for (const k of data.released) this.handleKeyUp(k);
    }
}

window.GolfGame2 = GolfGame2;