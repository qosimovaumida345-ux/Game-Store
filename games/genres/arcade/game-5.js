class FruitNinjaGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.fruits = [];
        this.particles = [];
        this.score = 0;
        this.lives = 3;
        this.gameState = 'start';
        this.blade = [];
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.fruits = [];
        this.particles = [];
        this.score = 0;
        this.lives = 3;
        this.blade = [];
        this.gameState = 'playing';
    }

    update() {
        if (this.gameState !== 'playing') return;

        if (Math.random() < 0.03) {
            const fruits = ['🍎', '🍌', '🍉', '🍊', '🍇', '🍓', '🍍'];
            const fruit = fruits[Math.floor(Math.random() * fruits.length)];
            this.fruits.push({
                x: Math.random() * 600 + 100,
                y: 650,
                vx: (Math.random() - 0.5) * 4,
                vy: -12 - Math.random() * 4,
                rotation: 0,
                rotSpeed: (Math.random() - 0.5) * 0.3,
                type: fruit,
                sliced: false
            });
        }

        for (const f of this.fruits) {
            f.vy += 0.25;
            f.x += f.vx;
            f.y += f.vy;
            f.rotation += f.rotSpeed;

            if (f.y > 700 && !f.sliced) {
                this.lives--;
                if (this.lives <= 0) this.gameState = 'gameover';
            }
        }

        for (const p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.3;
            p.life--;
        }

        this.fruits = this.fruits.filter(f => f.y < 750);
        this.particles = this.particles.filter(p => p.life > 0);
    }

    slice(x, y) {
        this.blade.push({ x, y, life: 10 });

        if (this.gameState !== 'playing') return;

        for (const f of this.fruits) {
            if (!f.sliced && Math.abs(x - f.x) < 40 && Math.abs(y - f.y) < 40) {
                f.sliced = true;
                this.score += 10;

                for (let i = 0; i < 8; i++) {
                    this.particles.push({
                        x: f.x,
                        y: f.y,
                        vx: (Math.random() - 0.5) * 8,
                        vy: (Math.random() - 0.5) * 8,
                        color: '#' + Math.floor(Math.random() * 16777215).toString(16),
                        life: 30
                    });
                }
            }
        }
    }

    render() {
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = '#2d2d2d';
        for (let i = 0; i < 20; i++) {
            this.ctx.fillRect(i * 50, 0, 2, this.height);
        }
        for (let i = 0; i < 15; i++) {
            this.ctx.fillRect(0, i * 50, this.width, 2);
        }

        for (const f of this.fruits) {
            this.ctx.save();
            this.ctx.translate(f.x, f.y);
            this.ctx.rotate(f.rotation);
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(f.type, 0, 10);
            this.ctx.restore();
        }

        for (const p of this.particles) {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life / 30;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;

        if (this.blade.length > 1) {
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 4;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(this.blade[0].x, this.blade[0].y);
            for (let i = 1; i < this.blade.length; i++) {
                this.ctx.lineTo(this.blade[i].x, this.blade[i].y);
            }
            this.ctx.stroke();
        }

        for (let i = this.blade.length - 1; i >= 0; i--) {
            this.blade[i].life--;
            if (this.blade[i].life <= 0) this.blade.splice(i, 1);
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 40);
        this.ctx.fillText(`Lives: ${'❤️'.repeat(this.lives)}`, 20, 70);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('FRUIT NINJA', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Swipe to slice fruits!', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        } else if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 30);
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

    getState() { return { score: this.score, lives: this.lives }; }
    setControllerData(data) {
        if (data.x !== undefined && data.y !== undefined) {
            this.slice(data.x, data.y);
        }
    }
}

window.FruitNinjaGame = FruitNinjaGame;