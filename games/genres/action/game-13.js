class BulletHellGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.player = null;
        this.bullets = [];
        this.enemies = [];
        this.score = 0;
        this.lives = 3;
        this.gameState = 'start';
        this.wave = 1;
        this.particles = [];
        this.powerUps = [];
        this.grazes = 0;
        this.bombCount = 2;
        this.lastShot = 0;
        this.hitboxSize = 3;
        this.difficulty = 1;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.player = {
            x: this.width / 2,
            y: this.height - 80,
            speed: 5,
            angle: 0,
            shootDelay: 5,
            power: 1,
            lives: 3,
            invincible: 0,
            focus: false
        };
    }

    update() {
        if (this.gameState !== 'playing') return;

        if (this.player.invincible > 0) this.player.invincible--;

        if (this.keys.up && this.player.y > 20) this.player.y -= this.player.speed;
        if (this.keys.down && this.player.y < this.height - 20) this.player.y += this.player.speed;
        if (this.keys.left && this.player.x > 20) this.player.x -= this.player.speed;
        if (this.keys.right && this.player.x < this.width - 20) this.player.x += this.player.speed;

        if (this.player.focus) {
            this.player.speed = 2;
        } else {
            this.player.speed = 5;
        }

        if (this.keys.shoot && Date.now() - this.lastShot > 50) {
            this.shoot();
            this.lastShot = Date.now();
        }

        if (this.keys.bomb && this.bombCount > 0) {
            this.useBomb();
        }

        this.updateBullets();
        this.updateEnemies();
        this.updateParticles();
        this.updatePowerUps();
        this.spawnEnemies();
        this.checkCollisions();

        if (this.enemies.length === 0 && this.bullets.length === 0) {
            this.wave++;
            this.difficulty += 0.2;
        }
    }

    shoot() {
        const spread = this.player.focus ? 1 : 3;
        const damage = 10 * this.player.power;

        for (let i = -spread; i <= spread; i++) {
            this.bullets.push({
                x: this.player.x + i * 8,
                y: this.player.y - 20,
                vx: i * 0.5,
                vy: -12,
                damage: damage,
                isPlayer: true,
                color: this.player.power >= 3 ? '#ff0' : '#0ff',
                size: this.player.power >= 3 ? 8 : 5
            });
        }
    }

    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.x += b.vx;
            b.y += b.vy;

            if (b.y < -20 || b.y > this.height + 20 || 
                b.x < -20 || b.x > this.width + 20) {
                this.bullets.splice(i, 1);
            }
        }
    }

    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.x += e.vx;
            e.y += e.vy;

            if (e.angle !== undefined) {
                e.angle += e.angularSpeed;
            }

            if (e.shootTimer !== undefined) {
                e.shootTimer--;
                if (e.shootTimer <= 0) {
                    this.enemyShoot(e);
                    e.shootTimer = e.fireRate;
                }
            }

            if (e.y > this.height + 50) {
                this.enemies.splice(i, 1);
            }
        }
    }

    enemyShoot(enemy) {
        const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
        const speed = 4 + this.difficulty;

        if (enemy.type === 'spiral') {
            for (let i = 0; i < 8; i++) {
                const a = (Math.PI * 2 / 8) * i + enemy.angle;
                this.bullets.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(a) * speed,
                    vy: Math.sin(a) * speed,
                    damage: 10,
                    isPlayer: false,
                    color: '#f0f',
                    size: 6
                });
            }
        } else if (enemy.type === 'aimed') {
            this.bullets.push({
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                damage: 15,
                isPlayer: false,
                color: '#f00',
                size: 8
            });
        } else if (enemy.type === 'burst') {
            for (let i = 0; i < 5; i++) {
                const a = angle + (i - 2) * 0.3;
                this.bullets.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(a) * (speed * 0.8),
                    vy: Math.sin(a) * (speed * 0.8),
                    damage: 8,
                    isPlayer: false,
                    color: '#fa0',
                    size: 5
                });
            }
        } else {
            this.bullets.push({
                x: enemy.x,
                y: enemy.y,
                vx: 0,
                vy: speed,
                damage: 10,
                isPlayer: false,
                color: '#f00',
                size: 5
            });
        }
    }

    spawnEnemies() {
        if (this.enemies.length < 5 + this.wave * 2) {
            const types = ['basic', 'spiral', 'aimed', 'burst'];
            const type = types[Math.floor(Math.random() * types.length)];
            const x = 50 + Math.random() * (this.width - 100);

            const enemy = {
                x: x,
                y: -30,
                vx: Math.random() * 2 - 1,
                vy: 1 + this.difficulty * 0.5,
                type: type,
                hp: 50 + this.wave * 20,
                maxHp: 50 + this.wave * 20,
                size: 20,
                angle: 0,
                angularSpeed: 0.1,
                shootTimer: 60,
                fireRate: 60 + Math.random() * 30
            };
            this.enemies.push(enemy);
        }
    }

    checkCollisions() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];

            if (b.isPlayer) {
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const e = this.enemies[j];
                    const dist = Math.hypot(b.x - e.x, b.y - e.y);

                    if (dist < e.size + b.size) {
                        e.hp -= b.damage;
                        this.bullets.splice(i, 1);

                        for (let p = 0; p < 5; p++) {
                            this.particles.push({
                                x: e.x,
                                y: e.y,
                                vx: Math.random() * 4 - 2,
                                vy: Math.random() * 4 - 2,
                                life: 20,
                                color: '#ff0'
                            });
                        }

                        if (e.hp <= 0) {
                            this.score += e.maxHp;
                            this.createExplosion(e.x, e.y);

                            if (Math.random() < 0.2) {
                                this.powerUps.push({
                                    x: e.x,
                                    y: e.y,
                                    type: Math.random() < 0.5 ? 'power' : 'life',
                                    vy: 1
                                });
                            }
                            this.enemies.splice(j, 1);
                        }
                        break;
                    }
                }
            } else {
                const playerHitbox = this.player.focus ? this.hitboxSize : 8;
                const dist = Math.hypot(b.x - this.player.x, b.y - this.player.y);

                if (dist < playerHitbox + b.size) {
                    if (this.player.invincible <= 0) {
                        this.lives--;
                        this.player.invincible = 120;
                        this.createExplosion(this.player.x, this.player.y, '#f00');

                        if (this.lives <= 0) {
                            this.gameState = 'gameover';
                        }
                    }
                    this.bullets.splice(i, 1);
                } else if (dist < playerHitbox + b.size + 15) {
                    this.grazes++;
                }
            }
        }

        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const p = this.powerUps[i];
            p.y += p.vy;

            const dist = Math.hypot(p.x - this.player.x, p.y - this.player.y);
            if (dist < 30) {
                if (p.type === 'power') {
                    this.player.power = Math.min(3, this.player.power + 0.5);
                } else if (p.type === 'life') {
                    this.lives = Math.min(5, this.lives + 1);
                }
                this.powerUps.splice(i, 1);
            } else if (p.y > this.height + 20) {
                this.powerUps.splice(i, 1);
            }
        }
    }

    useBomb() {
        this.bombCount--;
        this.player.invincible = 180;

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            if (!this.bullets[i].isPlayer) {
                this.score += 100;
                this.createExplosion(this.bullets[i].x, this.bullets[i].y, '#0ff');
                this.bullets.splice(i, 1);
            }
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            this.enemies[i].hp -= 100;
            if (this.enemies[i].hp <= 0) {
                this.score += this.enemies[i].maxHp;
                this.createExplosion(this.enemies[i].x, this.enemies[i].y);
                this.enemies.splice(i, 1);
            }
        }
    }

    createExplosion(x, y, color = '#fa0') {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 30 + Math.random() * 20,
                color: color
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.95;
            p.vy *= 0.95;
            p.life--;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    updatePowerUps() {
        // handled in checkCollisions
    }

    render() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('BULLET HELL', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Arrow Keys: Move | Z: Shoot | Shift: Focus | X: Bomb', this.width / 2, this.height / 2 + 20);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 60);
            return;
        }

        if (this.gameState === 'gameover') {
            this.ctx.fillStyle = '#f00';
            this.ctx.font = '50px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.fillText(`Score: ${this.score}`, this.width / 2, this.height / 2 + 20);
            this.ctx.fillText(`Wave: ${this.wave}`, this.width / 2, this.height / 2 + 60);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 100);
            return;
        }

        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.restore();

        for (const p of this.particles) {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life / 50;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;

        for (const b of this.bullets) {
            this.ctx.fillStyle = b.color;
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#fff';
            this.ctx.globalAlpha = 0.5;
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.size * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }

        for (const p of this.powerUps) {
            this.ctx.fillStyle = p.type === 'power' ? '#ff0' : '#0f0';
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(p.type === 'power' ? 'P' : 'L', p.x, p.y + 4);
        }

        for (const e of this.enemies) {
            this.ctx.save();
            this.ctx.translate(e.x, e.y);
            if (e.angle !== undefined) {
                this.ctx.rotate(e.angle);
            }

            const hpRatio = e.hp / e.maxHp;
            this.ctx.fillStyle = '#f0f';
            if (e.type === 'spiral') {
                for (let i = 0; i < 6; i++) {
                    const a = (Math.PI * 2 / 6) * i;
                    this.ctx.fillRect(Math.cos(a) * 15 - 5, Math.sin(a) * 15 - 5, 10, 10);
                }
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (e.type === 'aimed') {
                this.ctx.fillRect(-15, -15, 30, 30);
                this.ctx.fillStyle = '#f00';
                this.ctx.fillRect(-5, -5, 10, 10);
            } else {
                this.ctx.beginPath();
                this.ctx.moveTo(0, -e.size);
                this.ctx.lineTo(e.size, e.size);
                this.ctx.lineTo(-e.size, e.size);
                this.ctx.closePath();
                this.ctx.fill();
            }

            if (hpRatio < 1) {
                this.ctx.fillStyle = '#333';
                this.ctx.fillRect(-20, -e.size - 10, 40, 5);
                this.ctx.fillStyle = '#0f0';
                this.ctx.fillRect(-20, -e.size - 10, 40 * hpRatio, 5);
            }

            this.ctx.restore();
        }

        if (this.player.invincible > 0 && Math.floor(this.player.invincible / 5) % 2 === 0) {
            return;
        }

        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);

        this.ctx.fillStyle = '#0af';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -15);
        this.ctx.lineTo(10, 10);
        this.ctx.lineTo(-10, 10);
        this.ctx.closePath();
        this.ctx.fill();

        if (this.player.focus) {
            this.ctx.fillStyle = '#f00';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.hitboxSize, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        this.ctx.restore();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 10, 25);
        this.ctx.fillText(`Lives: ${this.lives}`, 10, 45);
        this.ctx.fillText(`Bomb: ${this.bombCount}`, 10, 65);
        this.ctx.fillText(`Wave: ${this.wave}`, 10, 85);
        this.ctx.fillText(`Graze: ${this.grazes}`, 10, 105);
        this.ctx.fillText(`Power: ${this.player.power.toFixed(1)}`, 10, 125);
    }

    handleKeyDown(key) {
        if (key === 'ArrowUp') this.keys.up = true;
        if (key === 'ArrowDown') this.keys.down = true;
        if (key === 'ArrowLeft') this.keys.left = true;
        if (key === 'ArrowRight') this.keys.right = true;
        if (key === 'z' || key === 'Z') this.keys.shoot = true;
        if (key === 'Shift') this.player.focus = true;
        if (key === 'x' || key === 'X') this.keys.bomb = true;

        if (key === ' ' && this.gameState !== 'playing') {
            this.start();
        }
    }

    handleKeyUp(key) {
        if (key === 'ArrowUp') this.keys.up = false;
        if (key === 'ArrowDown') this.keys.down = false;
        if (key === 'ArrowLeft') this.keys.left = false;
        if (key === 'ArrowRight') this.keys.right = false;
        if (key === 'z' || key === 'Z') this.keys.shoot = false;
        if (key === 'Shift') this.player.focus = false;
        if (key === 'x' || key === 'X') this.keys.bomb = false;
    }

    start() {
        this.gameState = 'playing';
        this.score = 0;
        this.lives = 3;
        this.wave = 1;
        this.difficulty = 1;
        this.bombCount = 2;
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.powerUps = [];
        this.grazes = 0;
        this.player = {
            x: this.width / 2,
            y: this.height - 80,
            speed: 5,
            angle: 0,
            shootDelay: 5,
            power: 1,
            lives: 3,
            invincible: 0,
            focus: false
        };
        this.keys = { up: false, down: false, left: false, right: false, shoot: false, bomb: false };
    }

    getState() {
        return { score: this.score, lives: this.lives, wave: this.wave };
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

window.BulletHellGame = BulletHellGame;