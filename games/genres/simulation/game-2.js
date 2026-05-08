class FishingGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.hook = { x: 400, y: 150, depth: 150, angle: 0, state: 'idle' };
        this.fish = [];
        this.score = 0;
        this.caught = 0;
        this.gameState = 'start';
        this.bobTimer = 0;
        this.lineLength = 100;
        this.maxDepth = 400;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.gameState = 'playing';
        this.score = 0;
        this.caught = 0;
        this.hook = { x: 400, y: 150, depth: 150, angle: 0, state: 'idle' };
        this.lineLength = 100;
        this.fish = [];
        this.spawnFish(15);
    }

    spawnFish(count) {
        for (let i = 0; i < count; i++) {
            this.fish.push({
                x: Math.random() * this.width,
                y: 200 + Math.random() * 300,
                speed: 1 + Math.random() * 2,
                direction: Math.random() < 0.5 ? 1 : -1,
                size: 15 + Math.random() * 25,
                type: Math.floor(Math.random() * 5),
                value: 10 + Math.floor(Math.random() * 40),
                caught: false
            });
        }
    }

    update() {
        if (this.gameState !== 'playing') return;

        this.bobTimer += 0.05;
        this.hook.y = 150 + Math.sin(this.bobTimer) * 10;

        for (const f of this.fish) {
            if (f.caught) continue;

            f.x += f.speed * f.direction;
            if (f.x < -50) { f.x = this.width + 50; f.direction = -1; }
            if (f.x > this.width + 50) { f.x = -50; f.direction = 1; }
        }

        if (this.keys.down && this.lineLength < this.maxDepth) {
            this.lineLength += 2;
        }
        if (this.keys.up && this.lineLength > 100) {
            this.lineLength -= 2;
        }

        this.hook.y = 150 + this.lineLength;

        if (this.keys.action && this.hook.state === 'idle') {
            this.hook.state = 'reeling';
        }

        if (this.hook.state === 'reeling') {
            for (const f of this.fish) {
                if (f.caught) continue;

                const dx = f.x - this.hook.x;
                const dy = f.y - this.hook.y;
                const dist = Math.hypot(dx, dy);

                if (dist < f.size + 10) {
                    f.caught = true;
                    f.caughtX = f.x;
                    f.caughtY = f.y;
                    this.hook.state = 'caught';
                    this.hook.caughtFish = f;
                    break;
                }
            }

            if (this.hook.state === 'reeling' && this.hook.y > 500) {
                this.hook.state = 'idle';
                this.lineLength = 100;
            }
        }

        if (this.hook.state === 'caught') {
            const f = this.hook.caughtFish;
            f.caughtX = this.hook.x;
            f.caughtY = this.hook.y + 10;

            this.lineLength = Math.max(100, this.lineLength - 3);

            if (this.lineLength <= 100) {
                this.score += f.value;
                this.caught++;
                this.hook.state = 'idle';
                this.hook.caughtFish = null;
                this.fish = this.fish.filter(fish => !fish.caught);
                this.spawnFish(3);
            }
        }
    }

    render() {
        this.ctx.fillStyle = '#4ae';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = '#8b5';
        this.ctx.fillRect(0, 0, this.width, 80);

        this.ctx.fillStyle = '#a74';
        this.ctx.fillRect(300, 20, 200, 60);
        this.ctx.fillStyle = '#c96';
        this.ctx.beginPath();
        this.ctx.arc(400, 20, 30, Math.PI, 0);
        this.ctx.fill();

        this.ctx.strokeStyle = '#654';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(400, 80);
        this.ctx.lineTo(400, 150 + this.lineLength);
        this.ctx.stroke();

        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.moveTo(400 - 15, 150 + this.lineLength);
        this.ctx.lineTo(400 + 15, 150 + this.lineLength);
        this.ctx.lineTo(400, 150 + this.lineLength + 20);
        this.ctx.closePath();
        this.ctx.fill();

        for (const f of this.fish) {
            if (f.caught) continue;

            this.ctx.save();
            this.ctx.translate(f.x, f.y);
            this.ctx.scale(f.direction, 1);

            const colors = ['#f84', '#8f4', '#48f', '#f4f', '#ff4'];
            this.ctx.fillStyle = colors[f.type];
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, f.size, f.size * 0.5, 0, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(f.size * 0.3, -f.size * 0.1, f.size * 0.2, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc(f.size * 0.35, -f.size * 0.1, f.size * 0.1, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.moveTo(-f.size, 0);
            this.ctx.lineTo(-f.size - 10, -5);
            this.ctx.lineTo(-f.size - 10, 5);
            this.ctx.closePath();
            this.ctx.fill();

            this.ctx.restore();
        }

        if (this.hook.caughtFish) {
            const f = this.hook.caughtFish;
            this.ctx.save();
            this.ctx.translate(f.caughtX, f.caughtY);

            const colors = ['#f84', '#8f4', '#48f', '#f4f', '#ff4'];
            this.ctx.fillStyle = colors[f.type];
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, f.size, f.size * 0.5, 0, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);
        this.ctx.fillText(`Fish: ${this.caught}`, 10, 55);
        this.ctx.fillText(`Depth: ${this.lineLength}m`, 10, 80);

        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(this.width - 120, this.height - 40, 100, 30);
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        const depthPercent = Math.floor((this.lineLength - 100) / (this.maxDepth - 100) * 100);
        this.ctx.fillText(`Depth: ${depthPercent}%`, this.width - 70, this.height - 20);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('FISHING', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Up/Down: Depth | Z: Reel', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        }
    }

    handleKeyDown(key) {
        if (key === 'ArrowUp') this.keys.up = true;
        if (key === 'ArrowDown') this.keys.down = true;
        if (key === 'z' || key === 'Z') this.keys.action = true;

        if (key === ' ' && this.gameState !== 'playing') {
            this.start();
        }
    }

    handleKeyUp(key) {
        if (key === 'ArrowUp') this.keys.up = false;
        if (key === 'ArrowDown') this.keys.down = false;
        if (key === 'z' || key === 'Z') this.keys.action = false;
    }

    getState() {
        return { score: this.score, caught: this.caught };
    }

    setControllerData(data) {
        if (data.keys) {
            for (const key of data.keys) {
                this.handleKeyDown(key);
            }
        }
        if (data.released) {
            for (const key of data.released) {
                this.handleKeyUp(key);
            }
        }
    }
}

window.FishingGame = FishingGame;