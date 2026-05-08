class DuckHuntGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.ducks = [];
        this.score = 0;
        this.misses = 0;
        this.maxMisses = 3;
        this.gameState = 'start';
        this.round = 1;
        this.bullets = 3;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.score = 0;
        this.misses = 0;
        this.round = 1;
        this.bullets = 3;
        this.ducks = [];
        this.gameState = 'playing';
    }

    update() {
        if (this.gameState !== 'playing') return;

        if (Math.random() < 0.02 && this.ducks.length < 3) {
            this.ducks.push({
                x: Math.random() * (this.width - 200) + 100,
                y: 450,
                vx: 2 + Math.random() * 2,
                vy: -2 - Math.random() * 2,
                state: 'flying',
                type: Math.random() < 0.5 ? 'fast' : 'slow'
            });
        }

        for (const duck of this.ducks) {
            if (duck.state === 'flying') {
                duck.x += duck.vx;
                duck.y += duck.vy;

                if (Math.random() < 0.05) {
                    duck.vy = -duck.vy;
                    duck.vx = -duck.vx;
                }

                if (duck.x < 0 || duck.x > this.width || duck.y < -50) {
                    if (duck.state === 'flying') {
                        this.misses++;
                        if (this.misses >= this.maxMisses) {
                            this.gameState = 'gameover';
                        }
                    }
                    this.ducks = this.ducks.filter(d => d !== duck);
                }
            }
        }

        if (this.ducks.length === 0 && this.misses < this.maxMisses) {
            this.round++;
            this.bullets = 3;
        }
    }

    shoot(x, y) {
        if (this.gameState !== 'playing' || this.bullets <= 0) return;

        this.bullets--;

        for (const duck of this.ducks) {
            if (Math.hypot(x - duck.x, y - duck.y) < 40) {
                duck.state = 'shot';
                this.score += 100 * (duck.type === 'fast' ? 2 : 1);
                this.ducks = this.ducks.filter(d => d !== duck);
                return;
            }
        }

        if (this.bullets === 0 && this.ducks.length > 0) {
            for (const duck of this.ducks) {
                duck.vx *= 3;
                duck.vy *= 3;
            }
        }
    }

    render() {
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = '#2ecc71';
        this.ctx.fillRect(0, 400, this.width, 200);

        this.ctx.fillStyle = '#27ae60';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 400);
        for (let x = 0; x <= this.width; x += 50) {
            this.ctx.lineTo(x, 380 + Math.sin(x * 0.02) * 20);
        }
        this.ctx.lineTo(this.width, 400);
        this.ctx.fill();

        for (const tree of [{x: 100, h: 150}, {x: 300, h: 180}, {x: 600, h: 140}]) {
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(tree.x, 400 - tree.h, 20, tree.h);
            this.ctx.fillStyle = '#228B22';
            this.ctx.beginPath();
            this.ctx.arc(tree.x + 10, 400 - tree.h, 40, 0, Math.PI * 2);
            this.ctx.fill();
        }

        for (const duck of this.ducks) {
            this.ctx.save();
            this.ctx.translate(duck.x, duck.y);
            if (duck.vx < 0) this.ctx.scale(-1, 1);

            this.ctx.fillStyle = '#8B4513';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, 25, 15, 0, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc(15, -5, 3, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(-10, -10, 12, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(-10, -20, 20, 5);
            this.ctx.fillRect(-10, -25, 5, 10);

            this.ctx.fillStyle = '#ff6600';
            this.ctx.beginPath();
            this.ctx.moveTo(20, 0);
            this.ctx.lineTo(35, 5);
            this.ctx.lineTo(20, 10);
            this.ctx.fill();

            this.ctx.restore();
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
        this.ctx.fillText(`Round: ${this.round}`, 20, 55);
        this.ctx.fillText(`Misses: ${this.misses}/${this.maxMisses}`, 20, 80);

        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(20, 100, 100, 30);
        for (let i = 0; i < this.bullets; i++) {
            this.ctx.fillStyle = '#f1c40f';
            this.ctx.beginPath();
            this.ctx.arc(40 + i * 25, 115, 8, 0, Math.PI * 2);
            this.ctx.fill();
        }

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('DUCK HUNT', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Click to shoot ducks', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        } else if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 + 20);
            this.ctx.fillText(`Round: ${this.round}`, this.width / 2, this.height / 2 + 50);
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 90);
        }
    }

    handleKeyDown(key) {
        if (key === ' ' && this.gameState !== 'playing') this.start();
    }

    handleKeyUp(key) {}

    getState() { return { score: this.score, round: this.round }; }
    setControllerData(data) {
        if (data.click) this.shoot(data.x, data.y);
    }
}

window.DuckHuntGame = DuckHuntGame;