class SamuraiGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.player = null;
        this.enemies = [];
        this.gameState = 'start';
        this.score = 0;
        this.wave = 1;
        this.combo = 0;
        this.comboTimer = 0;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.gameState = 'playing';
        this.score = 0;
        this.wave = 1;
        this.combo = 0;
        this.player = { x: 200, y: 300, state: 'idle', facing: 1, attack: 0, block: false };
        this.enemies = [];
    }

    update() {
        if (this.gameState !== 'playing') return;

        if (this.keys.left) this.player.x -= 4;
        if (this.keys.right) this.player.x += 4;
        if (this.keys.up) this.player.y -= 4;
        if (this.keys.down) this.player.y += 4;

        this.player.x = Math.max(50, Math.min(this.width - 50, this.player.x));
        this.player.y = Math.max(100, Math.min(this.height - 100, this.player.y));

        if (this.keys.attack && this.player.attack === 0) {
            this.player.attack = 20;

            for (const e of this.enemies) {
                const dx = e.x - this.player.x;
                if (Math.abs(dx) < 80 && Math.abs(e.y - this.player.y) < 50 && Math.sign(dx) === this.player.facing) {
                    e.hp -= 25;
                    e.hitTimer = 15;
                    e.vx = this.player.facing * 10;
                    this.combo++;
                    this.comboTimer = 60;
                    this.score += 50 + this.combo * 10;

                    if (e.hp <= 0) {
                        this.enemies.splice(this.enemies.indexOf(e), 1);
                        this.score += 100;
                    }
                }
            }
        }

        if (this.player.attack > 0) this.player.attack--;

        if (this.player.block) {
            this.player.block = false;
            if (this.keys.block) this.player.block = true;
        } else if (this.keys.block) {
            this.player.block = true;
        }

        this.player.facing = this.keys.left ? -1 : 1;

        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer === 0) this.combo = 0;
        }

        if (this.enemies.length < 2 + this.wave) {
            this.enemies.push({
                x: 700 + Math.random() * 100,
                y: 150 + Math.random() * 300,
                hp: 40 + this.wave * 10,
                vx: 0,
                state: 'approach',
                attackTimer: 60,
                hitTimer: 0
            });
        }

        for (const e of this.enemies) {
            if (e.hitTimer > 0) {
                e.hitTimer--;
                e.x += e.vx;
                e.vx *= 0.9;
                continue;
            }

            const dx = this.player.x - e.x;
            const dy = e.y - this.player.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 60) {
                e.x += Math.sign(dx) * 2;
                e.y += Math.sign(dy) * 1;
            }

            e.attackTimer--;
            if (e.attackTimer <= 0 && dist < 80) {
                e.attackTimer = 80;

                if (this.player.block) {
                    this.score += 25;
                    e.vx = -this.player.facing * 8;
                } else {
                    this.player.hp = (this.player.hp || 100) - 15;
                    this.combo = 0;
                    if (this.player.hp <= 0) this.gameState = 'gameover';
                }
            }
        }

        if (this.score > this.wave * 500) this.wave++;
    }

    render() {
        this.ctx.fillStyle = '#2a1a0a';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = '#1a0a00';
        this.ctx.fillRect(0, 400, this.width, 200);

        for (const e of this.enemies) {
            this.ctx.save();
            this.ctx.translate(e.x, e.y);

            if (e.hitTimer > 0) {
                this.ctx.globalAlpha = 0.5 + Math.sin(e.hitTimer) * 0.5;
            }

            this.ctx.fillStyle = '#a33';
            this.ctx.fillRect(-15, -40, 30, 50);

            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(-12, -50, 24, 15);

            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(-8, -45, 8, 10);
            this.ctx.fillRect(0, -45, 8, 10);

            this.ctx.fillStyle = '#866';
            this.ctx.fillRect(-5, 10, 10, 35);

            this.ctx.globalAlpha = 1;
            this.ctx.restore();

            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(e.x - 20, e.y - 60, 40, 6);
            this.ctx.fillStyle = '#f00';
            this.ctx.fillRect(e.x - 20, e.y - 60, 40 * (e.hp / (40 + this.wave * 10)), 6);
        }

        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        this.ctx.scale(this.player.facing, 1);

        if (this.player.block) {
            this.ctx.fillStyle = '#668';
            this.ctx.fillRect(-5, -30, 5, 40);
        }

        this.ctx.fillStyle = '#c44';
        this.ctx.fillRect(-12, -35, 24, 45);

        this.ctx.fillStyle = '#fcc';
        this.ctx.beginPath();
        this.ctx.arc(0, -45, 12, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#444';
        this.ctx.fillRect(-8, -55, 6, 12);
        this.ctx.fillRect(2, -55, 6, 12);

        this.ctx.fillStyle = '#888';
        this.ctx.fillRect(-5, 10, 10, 30);

        if (this.player.attack > 10) {
            this.ctx.fillStyle = '#ccc';
            this.ctx.beginPath();
            this.ctx.moveTo(10, -10);
            this.ctx.lineTo(50, -15);
            this.ctx.lineTo(50, -5);
            this.ctx.lineTo(10, 0);
            this.ctx.fill();

            this.ctx.fillStyle = '#f00';
            this.ctx.globalAlpha = 0.5;
            this.ctx.beginPath();
            this.ctx.moveTo(15, -8);
            this.ctx.lineTo(40, -10);
            this.ctx.lineTo(40, -2);
            this.ctx.lineTo(15, 0);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }

        this.ctx.restore();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
        this.ctx.fillText(`Wave: ${this.wave}`, 20, 50);
        this.ctx.fillText(`HP: ${this.player.hp || 100}`, 20, 70);

        if (this.combo > 0) {
            this.ctx.fillStyle = '#ff0';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`${this.combo} COMBO!`, this.width - 20, 40);
        }

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('SAMURAI DUEL', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Arrows: Move | Z: Attack | X: Block', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        } else if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#f00';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('DEFEATED', this.width / 2, this.height / 2 - 30);
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
        if (key === 'z' || key === 'Z') this.keys.attack = true;
        if (key === 'x' || key === 'X') this.keys.block = true;
        if (key === ' ' && this.gameState !== 'playing') this.start();
    }

    handleKeyUp(key) {
        if (key === 'ArrowLeft') this.keys.left = false;
        if (key === 'ArrowRight') this.keys.right = false;
        if (key === 'ArrowUp') this.keys.up = false;
        if (key === 'ArrowDown') this.keys.down = false;
        if (key === 'z' || key === 'Z') this.keys.attack = false;
        if (key === 'x' || key === 'X') this.keys.block = false;
    }

    getState() { return { score: this.score, wave: this.wave }; }
    setControllerData(data) {
        if (data.keys) for (const k of data.keys) this.handleKeyDown(k);
        if (data.released) for (const k of data.released) this.handleKeyUp(k);
    }
}

window.SamuraiGame = SamuraiGame;