class SteampunkGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.score = 0;
        this.gameState = 'start';
        this.wave = 1;
        this.gears = [];
        this.particles = [];
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.start();
    }

    start() {
        this.gameState = 'playing';
        this.score = 0;
        this.wave = 1;
        this.player = { x: 400, y: 500, angle: 0, cooldown: 0 };
        this.enemies = [];
        this.bullets = [];
        this.gears = [];
        this.particles = [];

        for (let i = 0; i < 10; i++) {
            this.gears.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: 20 + Math.random() * 40,
                rotation: 0,
                speed: (Math.random() - 0.5) * 0.02
            });
        }
    }

    update() {
        if (this.gameState !== 'playing') return;

        this.player.angle += 0.02;

        if (this.keys.left && this.player.x > 30) this.player.x -= 5;
        if (this.keys.right && this.player.x < this.width - 30) this.player.x += 5;

        if (this.keys.shoot && this.player.cooldown <= 0) {
            this.bullets.push({
                x: this.player.x,
                y: this.player.y - 20,
                vx: Math.sin(this.player.angle) * 10,
                vy: -Math.cos(this.player.angle) * 10
            });
            this.player.cooldown = 15;

            for (let i = 0; i < 3; i++) {
                this.particles.push({
                    x: this.player.x,
                    y: this.player.y - 20,
                    vx: (Math.random() - 0.5) * 3,
                    vy: Math.random() * 3,
                    life: 20,
                    color: '#fa0'
                });
            }
        }
        if (this.player.cooldown > 0) this.player.cooldown--;

        if (Math.random() < 0.02 + this.wave * 0.005) {
            this.enemies.push({
                x: Math.random() * this.width,
                y: -30,
                type: Math.random() < 0.5 ? 'drone' : 'airship',
                hp: 20 + this.wave * 5,
                vx: (Math.random() - 0.5) * 2,
                vy: 1 + this.wave * 0.2,
                angle: 0
            });
        }

        for (const e of this.enemies) {
            e.y += e.vy;
            e.x += e.vx;
            e.angle += 0.05;

            if (Math.random() < 0.02) {
                this.bullets.push({
                    x: e.x,
                    y: e.y + 20,
                    vx: 0,
                    vy: 4,
                    isEnemy: true
                });
            }
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.x += b.vx;
            b.y += b.vy;

            if (b.y < -20 || b.y > this.height + 20) {
                this.bullets.splice(i, 1);
                continue;
            }

            if (b.isEnemy) {
                if (Math.hypot(b.x - this.player.x, b.y - this.player.y) < 25) {
                    this.gameState = 'gameover';
                }
            } else {
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const e = this.enemies[j];
                    if (Math.hypot(b.x - e.x, b.y - e.y) < 30) {
                        e.hp -= 10;
                        this.bullets.splice(i, 1);

                        for (let p = 0; p < 5; p++) {
                            this.particles.push({
                                x: e.x, y: e.y,
                                vx: (Math.random() - 0.5) * 4,
                                vy: (Math.random() - 0.5) * 4,
                                life: 15, color: '#f84'
                            });
                        }

                        if (e.hp <= 0) {
                            this.score += 50;
                            this.enemies.splice(j, 1);
                        }
                        break;
                    }
                }
            }
        }

        for (const g of this.gears) {
            g.rotation += g.speed;
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        if (this.score > this.wave * 500) this.wave++;
    }

    render() {
        this.ctx.fillStyle = '#2a1a0a';
        this.ctx.fillRect(0, 0, this.width, this.height);

        for (const g of this.gears) {
            this.ctx.save();
            this.ctx.translate(g.x, g.y);
            this.ctx.rotate(g.rotation);

            this.ctx.fillStyle = '#876';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, g.radius, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#543';
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                this.ctx.fillRect(
                    Math.cos(angle) * g.radius * 0.3 - 8,
                    Math.sin(angle) * g.radius * 0.3 - 8,
                    16, 16
                );
            }

            this.ctx.fillStyle = '#2a1a0a';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, g.radius * 0.2, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        }

        this.ctx.save();
        this.ctx.translate(0, this.height - 100);
        this.ctx.fillStyle = '#654';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 100);
        for (let x = 0; x <= this.width; x += 20) {
            this.ctx.lineTo(x, 80 + Math.sin(x * 0.02) * 20);
        }
        this.ctx.lineTo(this.width, 100);
        this.ctx.fill();
        this.ctx.restore();

        for (const e of this.enemies) {
            this.ctx.save();
            this.ctx.translate(e.x, e.y);

            if (e.type === 'drone') {
                this.ctx.fillStyle = '#556';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 15, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#334';
                this.ctx.fillRect(-20, -5, 40, 10);
            } else {
                this.ctx.fillStyle = '#756';
                this.ctx.fillRect(-25, -15, 50, 30);

                this.ctx.fillStyle = '#534';
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, 30, 15, 0, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#a87';
                this.ctx.beginPath();
                this.ctx.ellipse(0, 10, 15, 8, 0, 0, Math.PI);
                this.ctx.fill();
            }

            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(-15, -25, 30, 5);
            this.ctx.fillStyle = '#f00';
            this.ctx.fillRect(-15, -25, 30 * (e.hp / (20 + this.wave * 5)), 5);

            this.ctx.restore();
        }

        for (const b of this.bullets) {
            this.ctx.fillStyle = b.isEnemy ? '#f44' : '#fa0';
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        for (const p of this.particles) {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life / 20;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;

        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);

        this.ctx.rotate(this.player.angle);

        this.ctx.fillStyle = '#876';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#a98';
        this.ctx.fillRect(-8, -30, 16, 20);

        this.ctx.fillStyle = '#654';
        this.ctx.fillRect(-25, 5, 50, 10);

        this.ctx.fillStyle = '#f84';
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI * 2 / 4) * i;
            this.ctx.fillRect(Math.cos(angle) * 25 - 3, Math.sin(angle) * 25 - 3, 6, 6);
        }

        this.ctx.restore();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 10, 25);
        this.ctx.fillText(`Wave: ${this.wave}`, 10, 45);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#dcb';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('STEAMPUNK BATTLE', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Arrow Keys: Move | Z: Fire', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        } else if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#f44';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 30);
            this.ctx.fillStyle = '#dcb';
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`Score: ${this.score}`, this.width / 2, this.height / 2 + 20);
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 60);
        }
    }

    handleKeyDown(key) {
        if (key === 'ArrowLeft') this.keys.left = true;
        if (key === 'ArrowRight') this.keys.right = true;
        if (key === 'z' || key === 'Z') this.keys.shoot = true;
        if (key === ' ' && this.gameState !== 'playing') this.start();
    }

    handleKeyUp(key) {
        if (key === 'ArrowLeft') this.keys.left = false;
        if (key === 'ArrowRight') this.keys.right = false;
        if (key === 'z' || key === 'Z') this.keys.shoot = false;
    }

    getState() {
        return { score: this.score, wave: this.wave };
    }

    setControllerData(data) {
        if (data.keys) {
            for (const key of data.keys) this.handleKeyDown(key);
        }
        if (data.released) {
            for (const key of data.released) this.handleKeyUp(key);
        }
    }
}

window.SteampunkGame = SteampunkGame;