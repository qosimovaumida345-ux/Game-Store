class FishingGame2 {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.fish = [];
        this.hook = { x: 400, y: 100, lineLength: 100 };
        this.score = 0;
        this.gameState = 'start';
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.fish = [];
        for (let i = 0; i < 8; i++) {
            this.fish.push({
                x: Math.random() * 700 + 50,
                y: 200 + Math.random() * 250,
                speed: 1 + Math.random() * 2,
                direction: Math.random() > 0.5 ? 1 : -1,
                size: 15 + Math.random() * 20,
                value: 10 + Math.floor(Math.random() * 30)
            });
        }
        this.hook = { x: 400, y: 100, lineLength: 100 };
        this.score = 0;
        this.gameState = 'playing';
    }

    update() {
        if (this.gameState !== 'playing') return;

        for (const f of this.fish) {
            f.x += f.speed * f.direction;
            if (f.x < 20 || f.x > 780) f.direction *= -1;
        }

        if (this.keys.down && this.hook.lineLength < 350) this.hook.lineLength += 2;
        if (this.keys.up && this.hook.lineLength > 100) this.hook.lineLength -= 2;

        this.hook.y = 100 + this.hook.lineLength;

        if (this.keys.action) {
            this.keys.action = false;
            for (let i = this.fish.length - 1; i >= 0; i--) {
                const f = this.fish[i];
                if (Math.hypot(f.x - this.hook.x, f.y - this.hook.y) < f.size + 20) {
                    this.score += f.value;
                    this.fish.splice(i, 1);
                    break;
                }
            }
        }

        if (this.fish.length === 0) this.gameState = 'win';
    }

    render() {
        this.ctx.fillStyle = '#4169E1';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(280, 20, 240, 60);
        this.ctx.fillStyle = '#A0522D';
        this.ctx.fillRect(340, 80, 120, 30);

        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(400, 110);
        this.ctx.lineTo(400, this.hook.y);
        this.ctx.stroke();

        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.moveTo(400 - 15, this.hook.y);
        this.ctx.lineTo(400 + 15, this.hook.y);
        this.ctx.lineTo(400, this.hook.y + 25);
        this.ctx.fill();

        for (const f of this.fish) {
            this.ctx.save();
            this.ctx.translate(f.x, f.y);
            this.ctx.scale(f.direction, 1);

            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
            this.ctx.fillStyle = colors[Math.floor(f.value / 10) % colors.length];
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, f.size, f.size * 0.5, 0, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc(f.size * 0.3, -f.size * 0.1, 3, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.moveTo(-f.size, 0);
            this.ctx.lineTo(-f.size - 10, -5);
            this.ctx.lineTo(-f.size - 10, 5);
            this.ctx.fill();

            this.ctx.restore();
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
        this.ctx.fillText(`Fish Left: ${this.fish.length}`, 20, 55);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('FISHING', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Up/Down: Depth | Z: Catch', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        } else if (this.gameState === 'win') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#2ecc71';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('YOU WIN!', this.width / 2, this.height / 2 - 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`Score: ${this.score}`, this.width / 2, this.height / 2 + 20);
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 60);
        }
    }

    handleKeyDown(key) {
        if (key === 'ArrowUp') this.keys.up = true;
        if (key === 'ArrowDown') this.keys.down = true;
        if (key === 'z' || key === 'Z') this.keys.action = true;
        if (key === ' ' && this.gameState !== 'playing') this.start();
    }

    handleKeyUp(key) {
        if (key === 'ArrowUp') this.keys.up = false;
        if (key === 'ArrowDown') this.keys.down = false;
        if (key === 'z' || key === 'Z') this.keys.action = false;
    }

    getState() { return { score: this.score, fish: this.fish.length }; }
    setControllerData(data) {
        if (data.keys) for (const k of data.keys) this.handleKeyDown(k);
        if (data.released) for (const k of data.released) this.handleKeyUp(k);
    }
}

window.FishingGame2 = FishingGame2;