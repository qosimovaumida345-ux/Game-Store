class BeatEmUpGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.player = null;
        this.enemies = [];
        this.score = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.gameState = 'start';
        this.stage = 1;
        this.backgroundObjects = [];
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.setupStage();
    }

    setupStage() {
        this.player = {
            x: 100,
            y: 300,
            vx: 0,
            vy: 0,
            hp: 100,
            maxHp: 100,
            state: 'idle',
            facing: 1,
            attackTimer: 0,
            attackCooldown: 0,
            hitStun: 0,
            width: 40,
            height: 80
        };

        this.enemies = [];
        this.backgroundObjects = [];

        for (let i = 0; i < 5 + this.stage * 2; i++) {
            this.spawnEnemy();
        }

        for (let i = 0; i < 20; i++) {
            this.backgroundObjects.push({
                x: Math.random() * this.width,
                y: 450 + Math.random() * 100,
                width: 30 + Math.random() * 40,
                height: 10 + Math.random() * 20,
                color: `hsl(${Math.random() * 60 + 20}, 50%, 40%)`
            });
        }
    }

    spawnEnemy() {
        const types = ['thug', 'biker', 'brute'];
        const typeIdx = Math.min(Math.floor((this.stage - 1) / 2), types.length - 1);
        const type = types[typeIdx];

        this.enemies.push({
            type: type,
            x: 600 + Math.random() * 200,
            y: 250 + Math.random() * 200,
            vx: 0,
            vy: 0,
            hp: type === 'brute' ? 60 : type === 'biker' ? 40 : 25,
            maxHp: type === 'brute' ? 60 : type === 'biker' ? 40 : 25,
            attack: type === 'brute' ? 15 : type === 'biker' ? 10 : 5,
            state: 'chase',
            attackTimer: 0,
            hitStun: 0,
            facing: -1,
            width: type === 'brute' ? 50 : 40,
            height: type === 'brute' ? 90 : 80,
            dead: false
        });
    }

    update() {
        if (this.gameState !== 'playing') return;

        if (this.player.hitStun > 0) this.player.hitStun--;
        if (this.player.attackCooldown > 0) this.player.attackCooldown--;
        if (this.player.attackTimer > 0) this.player.attackTimer--;

        if (this.player.hitStun <= 0) {
            if (this.keys.left) {
                this.player.x -= 4;
                this.player.facing = -1;
            }
            if (this.keys.right) {
                this.player.x += 4;
                this.player.facing = 1;
            }
            if (this.keys.up) this.player.y -= 3;
            if (this.keys.down) this.player.y += 3;
        }

        this.player.x = Math.max(20, Math.min(this.width - 20, this.player.x));
        this.player.y = Math.max(150, Math.min(this.height - 100, this.player.y));

        if (this.keys.attack && this.player.attackCooldown <= 0 && this.player.hitStun <= 0) {
            this.player.state = 'attack';
            this.player.attackTimer = 20;
            this.player.attackCooldown = 30;

            for (const e of this.enemies) {
                if (e.dead) continue;

                const dx = e.x - this.player.x;
                const dy = Math.abs(e.y - this.player.y);
                const attackRange = 80;

                if (Math.abs(dx) < attackRange && dy < 40 && Math.sign(dx) === this.player.facing) {
                    const damage = 15 + Math.floor(Math.random() * 10);
                    e.hp -= damage;
                    e.hitStun = 30;
                    e.vx = this.player.facing * 8;

                    this.combo++;
                    this.comboTimer = 60;
                    this.score += damage + this.combo * 5;

                    if (e.hp <= 0) {
                        e.dead = true;
                        this.score += 100;
                    }
                    break;
                }
            }
        }

        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }

        for (const e of this.enemies) {
            if (e.dead) continue;

            if (e.hitStun > 0) {
                e.hitStun--;
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
                e.facing = Math.sign(dx);
            } else {
                e.attackTimer++;
                if (e.attackTimer > 60) {
                    e.attackTimer = 0;

                    if (this.player.hitStun <= 0) {
                        const damage = Math.max(1, e.attack - 5);
                        this.player.hp -= damage;
                        this.player.hitStun = 20;
                        this.combo = 0;

                        if (this.player.hp <= 0) {
                            this.gameState = 'gameover';
                        }
                    }
                }
            }

            e.x = Math.max(20, Math.min(this.width - 20, e.x));
            e.y = Math.max(150, Math.min(this.height - 100, e.y));
        }

        this.enemies = this.enemies.filter(e => !e.dead);

        if (this.enemies.length === 0) {
            this.stage++;
            this.score += 500;
            this.setupStage();
        }
    }

    render() {
        this.ctx.fillStyle = '#345';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = '#456';
        this.ctx.fillRect(0, 420, this.width, 180);

        for (const obj of this.backgroundObjects) {
            this.ctx.fillStyle = obj.color;
            this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        }

        for (const e of this.enemies) {
            this.ctx.save();
            this.ctx.translate(e.x, e.y);
            this.ctx.scale(e.facing, 1);

            this.ctx.fillStyle = e.hitStun > 0 ? '#fff' : '#a44';
            this.ctx.fillRect(-e.width / 2, -e.height / 2, e.width, e.height);

            this.ctx.fillStyle = '#888';
            this.ctx.fillRect(-8, -e.height / 2 - 15, 16, 15);

            this.ctx.fillStyle = e.type === 'brute' ? '#333' : '#a44';
            this.ctx.fillRect(-e.width / 2 + 5, -e.height / 2, e.width - 10, e.height / 2);

            if (e.attackTimer > 50) {
                this.ctx.fillStyle = '#ff0';
                this.ctx.beginPath();
                this.ctx.arc(e.width / 2 + 10, 0, 15, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();

            const hpBarWidth = e.width;
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(e.x - hpBarWidth / 2, e.y - e.height / 2 - 25, hpBarWidth, 6);
            this.ctx.fillStyle = '#f00';
            this.ctx.fillRect(e.x - hpBarWidth / 2, e.y - e.height / 2 - 25, hpBarWidth * (e.hp / e.maxHp), 6);
        }

        if (this.player.hitStun <= 0 || Math.floor(this.player.hitStun / 3) % 2 === 0) {
            this.ctx.save();
            this.ctx.translate(this.player.x, this.player.y);
            this.ctx.scale(this.player.facing, 1);

            this.ctx.fillStyle = '#48f';
            this.ctx.fillRect(-this.player.width / 2, -this.player.height / 2, this.player.width, this.player.height);

            this.ctx.fillStyle = '#fcc';
            this.ctx.beginPath();
            this.ctx.arc(0, -this.player.height / 2 - 10, 15, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#444';
            this.ctx.fillRect(-5, -this.player.height / 2 - 5, 10, 5);

            if (this.player.attackTimer > 0) {
                this.ctx.fillStyle = '#ff0';
                const attackX = this.player.width / 2 + 10;
                this.ctx.beginPath();
                this.ctx.arc(attackX, 0, 20, -0.5, 0.5);
                this.ctx.lineTo(this.player.width / 2, 0);
                this.ctx.closePath();
                this.ctx.fill();
            }

            this.ctx.restore();
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`HP: ${this.player.hp}`, 10, 25);
        this.ctx.fillText(`Score: ${this.score}`, 10, 45);
        this.ctx.fillText(`Stage: ${this.stage}`, 10, 65);

        if (this.combo > 0) {
            this.ctx.fillStyle = '#ff0';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`${this.combo} COMBO!`, this.width - 20, 35);
        }

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('BEAT EM UP', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Arrow Keys: Move | Z: Attack', this.width / 2, this.height / 2 + 10);
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
            this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 + 20);
            this.ctx.fillText(`Reached Stage ${this.stage}`, this.width / 2, this.height / 2 + 50);
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 90);
        }
    }

    handleKeyDown(key) {
        if (key === 'ArrowLeft') this.keys.left = true;
        if (key === 'ArrowRight') this.keys.right = true;
        if (key === 'ArrowUp') this.keys.up = true;
        if (key === 'ArrowDown') this.keys.down = true;
        if (key === 'z' || key === 'Z') this.keys.attack = true;

        if (key === ' ' && this.gameState !== 'playing') {
            this.start();
        }
    }

    handleKeyUp(key) {
        if (key === 'ArrowLeft') this.keys.left = false;
        if (key === 'ArrowRight') this.keys.right = false;
        if (key === 'ArrowUp') this.keys.up = false;
        if (key === 'ArrowDown') this.keys.down = false;
        if (key === 'z' || key === 'Z') this.keys.attack = false;
    }

    start() {
        this.gameState = 'playing';
        this.score = 0;
        this.combo = 0;
        this.stage = 1;
        this.keys = {};
        this.setupStage();
    }

    getState() {
        return { score: this.score, stage: this.stage, hp: this.player.hp };
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

window.BeatEmUpGame = BeatEmUpGame;