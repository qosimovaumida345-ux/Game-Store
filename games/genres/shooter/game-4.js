class SniperGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.targets = [];
        this.score = 0;
        this.timeLeft = 60;
        this.gameState = 'start';
        this.crosshair = { x: 400, y: 300 };
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.targets = [];
        this.score = 0;
        this.timeLeft = 60;
        this.gameState = 'playing';
        this.crosshair = { x: 400, y: 300 };

        const timer = setInterval(() => {
            if (this.gameState !== 'playing') {
                clearInterval(timer);
                return;
            }
            this.timeLeft--;
            if (this.timeLeft <= 0) {
                this.gameState = 'gameover';
                clearInterval(timer);
            }
        }, 1000);

        const spawn = setInterval(() => {
            if (this.gameState !== 'playing') {
                clearInterval(spawn);
                return;
            }
            this.targets.push({
                x: 100 + Math.random() * 600,
                y: 100 + Math.random() * 400,
                size: 15 + Math.random() * 15,
                life: 150
            });
        }, 800);
    }

    update() {
        if (this.gameState !== 'playing') return;

        if (this.keys.left && this.crosshair.x > 20) this.crosshair.x -= 8;
        if (this.keys.right && this.crosshair.x < 780) this.crosshair.x += 8;
        if (this.keys.up && this.crosshair.y > 20) this.crosshair.y -= 8;
        if (this.keys.down && this.crosshair.y < 580) this.crosshair.y += 8;

        if (this.keys.shoot) {
            this.keys.shoot = false;
            for (let i = this.targets.length - 1; i >= 0; i--) {
                const t = this.targets[i];
                if (Math.hypot(t.x - this.crosshair.x, t.y - this.crosshair.y) < t.size + 10) {
                    this.targets.splice(i, 1);
                    this.score += 100;
                    break;
                }
            }
        }

        for (const t of this.targets) {
            t.life--;
        }
        this.targets = this.targets.filter(t => t.life > 0);
    }

    render() {
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        for (let x = 0; x < 800; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, 600);
            this.ctx.stroke();
        }
        for (let y = 0; y < 600; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(800, y);
            this.ctx.stroke();
        }

        for (const t of this.targets) {
            const alpha = Math.min(1, t.life / 50);
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.beginPath();
            this.ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(t.x - 5, t.y - 3, 3, 0, Math.PI * 2);
            this.ctx.arc(t.x + 5, t.y - 3, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;

        this.ctx.strokeStyle = '#0f0';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.crosshair.x - 20, this.crosshair.y);
        this.ctx.lineTo(this.crosshair.x - 5, this.crosshair.y);
        this.ctx.moveTo(this.crosshair.x + 5, this.crosshair.y);
        this.ctx.lineTo(this.crosshair.x + 20, this.crosshair.y);
        this.ctx.moveTo(this.crosshair.x, this.crosshair.y - 20);
        this.ctx.lineTo(this.crosshair.x, this.crosshair.y - 5);
        this.ctx.moveTo(this.crosshair.x, this.crosshair.y + 5);
        this.ctx.lineTo(this.crosshair.x, this.crosshair.y + 20);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(this.crosshair.x, this.crosshair.y, 25, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
        this.ctx.fillText(`Time: ${this.timeLeft}s`, 20, 55);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('SNIPER', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Arrows: Aim | Z: Shoot', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        } else if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('TIME UP!', this.width / 2, this.height / 2 - 30);
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
        if (key === 'z' || key === 'Z') this.keys.shoot = true;
        if (key === ' ' && this.gameState !== 'playing') this.start();
    }

    handleKeyUp(key) {
        if (key === 'ArrowLeft') this.keys.left = false;
        if (key === 'ArrowRight') this.keys.right = false;
        if (key === 'ArrowUp') this.keys.up = false;
        if (key === 'ArrowDown') this.keys.down = false;
        if (key === 'z' || key === 'Z') this.keys.shoot = false;
    }

    getState() { return { score: this.score, time: this.timeLeft }; }
    setControllerData(data) {
        if (data.keys) for (const k of data.keys) this.handleKeyDown(k);
        if (data.released) for (const k of data.released) this.handleKeyUp(k);
    }
}

window.SniperGame = SniperGame;