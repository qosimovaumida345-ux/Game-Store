class TankBattleGame {
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
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.player = { x: 400, y: 500, angle: -Math.PI / 2, angleTarget: -Math.PI / 2 };
        this.enemies = [];
        this.bullets = [];
        this.score = 0;
        this.gameState = 'playing';
    }

    update() {
        if (this.gameState !== 'playing') return;

        if (this.keys.left) this.player.angleTarget -= 0.08;
        if (this.keys.right) this.player.angleTarget += 0.08;

        let diff = this.player.angleTarget - this.player.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.player.angle += diff * 0.2;

        if (this.keys.up) {
            this.player.x += Math.cos(this.player.angle) * 3;
            this.player.y += Math.sin(this.player.angle) * 3;
        }
        if (this.keys.down) {
            this.player.x -= Math.cos(this.player.angle) * 2;
            this.player.y -= Math.sin(this.player.angle) * 2;
        }

        this.player.x = Math.max(30, Math.min(770, this.player.x));
        this.player.y = Math.max(30, Math.min(570, this.player.y));

        if (this.keys.shoot) {
            this.keys.shoot = false;
            this.bullets.push({
                x: this.player.x + Math.cos(this.player.angle) * 30,
                y: this.player.y + Math.sin(this.player.angle) * 30,
                vx: Math.cos(this.player.angle) * 8,
                vy: Math.sin(this.player.angle) * 8,
                isPlayer: true
            });
        }

        if (Math.random() < 0.02) {
            const angle = Math.random() * Math.PI * 2;
            this.enemies.push({
                x: 400 + Math.cos(angle) * 300,
                y: 300 + Math.sin(angle) * 200,
                angle: 0,
                hp: 3
            });
        }

        for (const e of this.enemies) {
            const dx = this.player.x - e.x;
            const dy = this.player.y - e.y;
            e.angle = Math.atan2(dy, dx);

            if (Math.random() < 0.02) {
                this.bullets.push({
                    x: e.x + Math.cos(e.angle) * 20,
                    y: e.y + Math.sin(e.angle) * 20,
                    vx: Math.cos(e.angle) * 5,
                    vy: Math.sin(e.angle) * 5,
                    isPlayer: false
                });
            }
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.x += b.vx;
            b.y += b.vy;

            if (b.x < 0 || b.x > 800 || b.y < 0 || b.y > 600) {
                this.bullets.splice(i, 1);
                continue;
            }

            if (b.isPlayer) {
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const e = this.enemies[j];
                    if (Math.hypot(b.x - e.x, b.y - e.y) < 25) {
                        e.hp--;
                        this.bullets.splice(i, 1);
                        if (e.hp <= 0) {
                            this.enemies.splice(j, 1);
                            this.score += 50;
                        }
                        break;
                    }
                }
            } else {
                if (Math.hypot(b.x - this.player.x, b.y - this.player.y) < 20) {
                    this.gameState = 'gameover';
                }
            }
        }
    }

    render() {
        this.ctx.fillStyle = '#3d5c3d';
        this.ctx.fillRect(0, 0, this.width, this.height);

        for (let x = 0; x < 20; x++) {
            for (let y = 0; y < 15; y++) {
                if ((x + y) % 2 === 0) {
                    this.ctx.fillStyle = '#4a6b4a';
                    this.ctx.fillRect(x * 40, y * 40, 40, 40);
                }
            }
        }

        for (const e of this.enemies) {
            this.ctx.save();
            this.ctx.translate(e.x, e.y);
            this.ctx.rotate(e.angle);

            this.ctx.fillStyle = '#8b0000';
            this.ctx.fillRect(-15, -15, 30, 30);

            this.ctx.fillStyle = '#5c0000';
            this.ctx.fillRect(0, -5, 25, 10);

            this.ctx.fillStyle = '#333';
            this.ctx.beginPath();
            this.ctx.arc(-10, -10, 6, 0, Math.PI * 2);
            this.ctx.arc(0, -10, 6, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        }

        for (const b of this.bullets) {
            this.ctx.fillStyle = b.isPlayer ? '#ffff00' : '#ff6600';
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        this.ctx.rotate(this.player.angle);

        this.ctx.fillStyle = '#2e5a2e';
        this.ctx.fillRect(-15, -15, 30, 30);

        this.ctx.fillStyle = '#1a3a1a';
        this.ctx.fillRect(0, -6, 35, 12);

        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(-10, -10, 7, 0, Math.PI * 2);
        this.ctx.arc(0, -10, 7, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
        this.ctx.fillText(`Enemies: ${this.enemies.length}`, 20, 55);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('TANK BATTLE', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Arrows: Move | Z: Fire', this.width / 2, this.height / 2 + 10);
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

    getState() { return { score: this.score }; }
    setControllerData(data) {
        if (data.keys) for (const k of data.keys) this.handleKeyDown(k);
        if (data.released) for (const k of data.released) this.handleKeyUp(k);
    }
}

window.TankBattleGame = TankBattleGame;