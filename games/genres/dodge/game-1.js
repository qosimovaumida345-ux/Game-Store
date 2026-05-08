class DodgeGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.player = { x: 400, y: 500 };
        this.enemies = [];
        this.score = 0;
        this.gameState = 'start';
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.player = { x: 400, y: 500 };
        this.enemies = [];
        this.score = 0;
        this.gameState = 'playing';
    }

    update() {
        if (this.gameState !== 'playing') return;

        if (this.keys.left && this.player.x > 30) this.player.x -= 6;
        if (this.keys.right && this.player.x < 770) this.player.x += 6;
        if (this.keys.up && this.player.y > 30) this.player.y -= 6;
        if (this.keys.down && this.player.y < 570) this.player.y += 6;

        this.score++;

        if (Math.random() < 0.08) {
            this.enemies.push({
                x: Math.random() * 760 + 20,
                y: -30,
                size: 20 + Math.random() * 20,
                speed: 3 + Math.random() * 4
            });
        }

        for (const e of this.enemies) {
            e.y += e.speed;

            if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < e.size + 20) {
                this.gameState = 'gameover';
            }
        }

        this.enemies = this.enemies.filter(e => e.y < 650);
    }

    render() {
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.width, this.height);

        for (let i = 0; i < 30; i++) {
            this.ctx.fillStyle = '#333';
            const x = (i * 97) % 800;
            const y = (i * 73) % 600;
            this.ctx.fillRect(x, y, 4, 4);
        }

        for (const e of this.enemies) {
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.beginPath();
            this.ctx.moveTo(e.x, e.y - e.size);
            this.ctx.lineTo(e.x + e.size, e.y + e.size);
            this.ctx.lineTo(e.x - e.size, e.y + e.size);
            this.ctx.closePath();
            this.ctx.fill();
        }

        this.ctx.fillStyle = '#2ecc71';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, 20, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 35);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('DODGE', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Arrow Keys to Move', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        } else if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 30);
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
        if (key === ' ' && this.gameState !== 'playing') this.start();
    }

    handleKeyUp(key) {
        if (key === 'ArrowLeft') this.keys.left = false;
        if (key === 'ArrowRight') this.keys.right = false;
        if (key === 'ArrowUp') this.keys.up = false;
        if (key === 'ArrowDown') this.keys.down = false;
    }

    getState() { return { score: this.score }; }
    setControllerData(data) {
        if (data.keys) for (const k of data.keys) this.handleKeyDown(k);
        if (data.released) for (const k of data.released) this.handleKeyUp(k);
    }
}

window.DodgeGame = DodgeGame;