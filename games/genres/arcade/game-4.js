class BalloonPopGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.balloons = [];
        this.score = 0;
        this.time = 45;
        this.gameState = 'start';
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.balloons = [];
        this.score = 0;
        this.time = 45;
        this.gameState = 'playing';

        const timer = setInterval(() => {
            if (this.gameState === 'playing') {
                this.time--;
                if (this.time <= 0) {
                    this.gameState = 'gameover';
                    clearInterval(timer);
                }
            }
        }, 1000);

        const spawn = setInterval(() => {
            if (this.gameState !== 'playing') {
                clearInterval(spawn);
                return;
            }

            const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'];
            this.balloons.push({
                x: Math.random() * (this.width - 100) + 50,
                y: 650,
                speed: 1 + Math.random() * 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 30 + Math.random() * 20,
                wobble: Math.random() * Math.PI * 2
            });
        }, 600);
    }

    update() {
        if (this.gameState !== 'playing') return;

        for (const balloon of this.balloons) {
            balloon.y -= balloon.speed;
            balloon.wobble += 0.1;
            balloon.x += Math.sin(balloon.wobble) * 0.5;

            if (balloon.y < -50) {
                this.balloons = this.balloons.filter(b => b !== balloon);
            }
        }
    }

    pop(x, y) {
        if (this.gameState !== 'playing') return;

        for (let i = this.balloons.length - 1; i >= 0; i--) {
            const b = this.balloons[i];
            if (Math.hypot(x - b.x, y - b.y) < b.size + 10) {
                this.balloons.splice(i, 1);
                this.score += 10;

                for (let j = 0; j < 8; j++) {
                    const angle = (Math.PI * 2 / 8) * j;
                    this.balloons.push({
                        x: b.x,
                        y: b.y,
                        speed: 3 + Math.random() * 2,
                        color: b.color,
                        size: b.size / 3,
                        isParticle: true,
                        vx: Math.cos(angle) * 4,
                        vy: Math.sin(angle) * 4
                    });
                }
                return;
            }
        }
    }

    render() {
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.width, this.height);

        for (let i = 0; i < 5; i++) {
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.ellipse(100 + i * 150, 80, 40, 30, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }

        for (const b of this.balloons) {
            if (b.isParticle) {
                b.x += b.vx;
                b.y += b.vy;
                b.vy += 0.2;
            }

            this.ctx.fillStyle = b.color;
            this.ctx.beginPath();
            this.ctx.ellipse(b.x, b.y, b.size, b.size * 1.3, 0, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.ellipse(b.x - b.size * 0.3, b.y - b.size * 0.5, b.size * 0.3, b.size * 0.4, -0.5, 0, Math.PI * 2);
            this.ctx.stroke();

            if (!b.isParticle) {
                this.ctx.strokeStyle = b.color;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(b.x, b.y + b.size * 1.3);
                this.ctx.lineTo(b.x, b.y + b.size * 1.3 + 30 + Math.sin(b.wobble) * 10);
                this.ctx.stroke();
            }
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 40);
        this.ctx.fillText(`Time: ${this.time}s`, 20, 70);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('BALLOON POP', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Click balloons to pop them!', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        } else if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#f1c40f';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('TIME UP!', this.width / 2, this.height / 2 - 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Score: ${this.score}`, this.width / 2, this.height / 2 + 20);
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 60);
        }
    }

    handleKeyDown(key) {
        if (key === ' ' && this.gameState !== 'playing') this.start();
    }

    handleKeyUp(key) {}

    getState() { return { score: this.score, time: this.time }; }
    setControllerData(data) {
        if (data.click) this.pop(data.x, data.y);
    }
}

window.BalloonPopGame = BalloonPopGame;