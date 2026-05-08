class SciFiGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.planets = [];
        this.stars = [];
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.score = 0;
        this.gameState = 'start';
        this.wave = 1;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.stars = [];
        for (let i = 0; i < 200; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2,
                brightness: Math.random()
            });
        }
    }

    start() {
        this.gameState = 'playing';
        this.score = 0;
        this.wave = 1;
        this.player = { x: 400, y: 500, vx: 0, vy: 0, angle: 0 };
        this.planets = [];
        for (let i = 0; i < 3; i++) {
            this.planets.push({
                x: 150 + i * 250,
                y: 300,
                radius: 40 + Math.random() * 30,
                color: `hsl(${Math.random() * 360}, 60%, 50%)`
            });
        }
        this.enemies = [];
        this.bullets = [];
    }

    update() {
        if (this.gameState !== 'playing') return;

        if (this.keys.left) this.player.vx -= 0.3;
        if (this.keys.right) this.player.vx += 0.3;
        if (this.keys.up) this.player.vy -= 0.3;
        if (this.keys.down) this.player.vy += 0.3;

        this.player.vx *= 0.98;
        this.player.vy *= 0.98;
        this.player.x += this.player.vx;
        this.player.y += this.player.vy;

        this.player.x = Math.max(20, Math.min(this.width - 20, this.player.x));
        this.player.y = Math.max(20, Math.min(this.height - 20, this.player.y));

        this.player.angle = Math.atan2(this.player.vx, -this.player.vy);

        if (this.keys.shoot) {
            this.keys.shoot = false;
            const ax = Math.cos(this.player.angle) * 8;
            const ay = Math.sin(this.player.angle) * 8;
            this.bullets.push({ x: this.player.x, y: this.player.y, vx: ax, vy: ay });
        }

        if (Math.random() < 0.02 + this.wave * 0.005) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 450;
            this.enemies.push({
                x: this.player.x + Math.cos(angle) * dist,
                y: this.player.y + Math.sin(angle) * dist,
                hp: 15 + this.wave * 5,
                angle: 0
            });
        }

        for (const e of this.enemies) {
            const dx = this.player.x - e.x;
            const dy = this.player.y - e.y;
            e.angle = Math.atan2(dy, dx);
            e.x += Math.cos(e.angle) * 2;
            e.y += Math.sin(e.angle) * 2;
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.x += b.vx;
            b.y += b.vy;

            if (b.x < 0 || b.x > this.width || b.y < 0 || b.y > this.height) {
                this.bullets.splice(i, 1);
                continue;
            }

            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const e = this.enemies[j];
                if (Math.hypot(b.x - e.x, b.y - e.y) < 25) {
                    e.hp -= 10;
                    this.bullets.splice(i, 1);

                    if (e.hp <= 0) {
                        this.score += 30;
                        this.enemies.splice(j, 1);
                    }
                    break;
                }
            }
        }

        for (const e of this.enemies) {
            if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < 30) {
                this.gameState = 'gameover';
            }
        }

        if (this.score > this.wave * 300) this.wave++;
    }

    render() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        for (const s of this.stars) {
            this.ctx.fillStyle = `rgba(255,255,255,${s.brightness})`;
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        for (const p of this.planets) {
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
            this.ctx.beginPath();
            this.ctx.arc(p.x + p.radius * 0.3, p.y, p.radius * 0.7, 0, Math.PI * 2);
            this.ctx.fill();
        }

        for (const b of this.bullets) {
            this.ctx.fillStyle = '#0ff';
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }

        for (const e of this.enemies) {
            this.ctx.save();
            this.ctx.translate(e.x, e.y);
            this.ctx.rotate(e.angle);

            this.ctx.fillStyle = '#f0f';
            this.ctx.beginPath();
            this.ctx.moveTo(20, 0);
            this.ctx.lineTo(-10, 10);
            this.ctx.lineTo(-5, 0);
            this.ctx.lineTo(-10, -10);
            this.ctx.closePath();
            this.ctx.fill();

            this.ctx.restore();
        }

        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        this.ctx.rotate(this.player.angle);

        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.moveTo(20, 0);
        this.ctx.lineTo(-15, 12);
        this.ctx.lineTo(-10, 0);
        this.ctx.lineTo(-15, -12);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = '#888';
        this.ctx.fillRect(-8, -5, 16, 10);

        this.ctx.fillStyle = '#0ff';
        this.ctx.globalAlpha = 0.5;
        this.ctx.beginPath();
        this.ctx.arc(-5, 0, 5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;

        this.ctx.restore();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 10, 25);
        this.ctx.fillText(`Wave: ${this.wave}`, 10, 45);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('SPACE COMBAT', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Arrows: Move | Z: Fire', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        } else if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#f00';
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

    getState() { return { score: this.score, wave: this.wave }; }
    setControllerData(data) {
        if (data.keys) for (const k of data.keys) this.handleKeyDown(k);
        if (data.released) for (const k of data.released) this.handleKeyUp(k);
    }
}

window.SciFiGame = SciFiGame;