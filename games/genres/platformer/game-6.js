class PlatformerGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.player = null;
        this.platforms = [];
        this.enemies = [];
        this.coins = [];
        this.score = 0;
        this.lives = 3;
        this.gameState = 'start';
        this.keys = {};
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.gameState = 'playing';
        this.score = 0;
        this.lives = 3;

        this.player = { x: 100, y: 500, vx: 0, vy: 0, onGround: false, facing: 1, width: 30, height: 40 };

        this.platforms = [
            { x: 0, y: 550, w: 800, h: 50 },
            { x: 200, y: 450, w: 150, h: 20 },
            { x: 450, y: 380, w: 150, h: 20 },
            { x: 100, y: 300, w: 120, h: 20 },
            { x: 350, y: 220, w: 100, h: 20 },
            { x: 600, y: 280, w: 150, h: 20 },
            { x: 250, y: 150, w: 200, h: 20 }
        ];

        this.enemies = [
            { x: 300, y: 520, vx: 1, w: 30, h: 30 },
            { x: 500, y: 350, vx: 1.5, w: 30, h: 30 },
            { x: 400, y: 120, vx: 2, w: 30, h: 30 }
        ];

        this.coins = [
            { x: 250, y: 420, collected: false },
            { x: 500, y: 350, collected: false },
            { x: 150, y: 270, collected: false },
            { x: 400, y: 190, collected: false },
            { x: 650, y: 250, collected: false },
            { x: 350, y: 120, collected: false }
        ];
    }

    update() {
        if (this.gameState !== 'playing') return;

        if (this.keys.left) { this.player.vx -= 0.8; this.player.facing = -1; }
        if (this.keys.right) { this.player.vx += 0.8; this.player.facing = 1; }

        this.player.vx *= 0.9;
        this.player.vy += 0.6;

        this.player.x += this.player.vx;
        this.player.y += this.player.vy;

        this.player.onGround = false;
        for (const plat of this.platforms) {
            if (this.player.x + this.player.width > plat.x && this.player.x < plat.x + plat.w &&
                this.player.y + this.player.height > plat.y && this.player.y + this.player.height < plat.y + plat.h + 20 &&
                this.player.vy >= 0) {
                this.player.y = plat.y - this.player.height;
                this.player.vy = 0;
                this.player.onGround = true;
            }
        }

        if (this.keys.jump && this.player.onGround) {
            this.player.vy = -14;
        }

        this.player.x = Math.max(0, Math.min(this.width - this.player.width, this.player.x));

        if (this.player.y > this.height) {
            this.lives--;
            if (this.lives <= 0) this.gameState = 'gameover';
            else { this.player.x = 100; this.player.y = 500; this.player.vx = 0; this.player.vy = 0; }
        }

        for (const e of this.enemies) {
            e.x += e.vx;
            if (e.x < 100 || e.x > 700) e.vx *= -1;

            if (Math.abs(this.player.x + 15 - e.x - 15) < 25 && Math.abs(this.player.y + 40 - e.y - 15) < 25) {
                if (this.player.vy > 0 && this.player.y < e.y) {
                    this.enemies.splice(this.enemies.indexOf(e), 1);
                    this.player.vy = -10;
                    this.score += 50;
                } else {
                    this.lives--;
                    if (this.lives <= 0) this.gameState = 'gameover';
                    else { this.player.x = 100; this.player.y = 500; this.player.vx = 0; this.player.vy = 0; }
                }
            }
        }

        for (const c of this.coins) {
            if (!c.collected && Math.abs(this.player.x + 15 - c.x) < 20 && Math.abs(this.player.y + 20 - c.y) < 20) {
                c.collected = true;
                this.score += 100;
            }
        }
    }

    render() {
        this.ctx.fillStyle = '#4a8';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = '#3a7';
        this.ctx.fillRect(0, 0, this.width, 50);

        for (const plat of this.platforms) {
            this.ctx.fillStyle = '#852';
            this.ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
            this.ctx.fillStyle = '#964';
            this.ctx.fillRect(plat.x, plat.y, plat.w, 5);
        }

        for (const c of this.coins) {
            if (c.collected) continue;
            this.ctx.fillStyle = '#ff0';
            this.ctx.beginPath();
            this.ctx.arc(c.x, c.y, 12, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#da0';
            this.ctx.beginPath();
            this.ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
            this.ctx.fill();
        }

        for (const e of this.enemies) {
            this.ctx.fillStyle = '#a44';
            this.ctx.beginPath();
            this.ctx.arc(e.x + 15, e.y + 15, 15, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(e.x + 8, e.y + 8, 5, 5);
            this.ctx.fillRect(e.x + 17, e.y + 8, 5, 5);
        }

        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);

        this.ctx.fillStyle = '#f84';
        this.ctx.fillRect(0, 0, this.player.width, this.player.height);

        this.ctx.fillStyle = '#fcc';
        this.ctx.beginPath();
        this.ctx.arc(this.player.width / 2, -5, 12, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#444';
        this.ctx.fillRect(5, -18, 8, 10);
        this.ctx.fillRect(17, -18, 8, 10);

        this.ctx.restore();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
        this.ctx.fillText(`Lives: ${'♥'.repeat(this.lives)}`, 20, 55);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PLATFORMER', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Arrows: Move | Up: Jump', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        } else if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#f00';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Score: ${this.score}`, this.width / 2, this.height / 2 + 20);
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 60);
        }
    }

    handleKeyDown(key) {
        if (key === 'ArrowLeft') this.keys.left = true;
        if (key === 'ArrowRight') this.keys.right = true;
        if (key === 'ArrowUp' || key === ' ') this.keys.jump = true;
        if (key === ' ' && this.gameState !== 'playing') this.start();
    }

    handleKeyUp(key) {
        if (key === 'ArrowLeft') this.keys.left = false;
        if (key === 'ArrowRight') this.keys.right = false;
        if (key === 'ArrowUp' || key === ' ') this.keys.jump = false;
    }

    getState() { return { score: this.score, lives: this.lives }; }
    setControllerData(data) {
        if (data.keys) for (const k of data.keys) this.handleKeyDown(k);
        if (data.released) for (const k of data.released) this.handleKeyUp(k);
    }
}

window.PlatformerGame = PlatformerGame;