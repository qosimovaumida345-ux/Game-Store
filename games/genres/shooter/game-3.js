class SpaceShooterGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.player = null;
        this.enemies = [];
        this.playerBullets = [];
        this.enemyBullets = [];
        this.asteroids = [];
        this.score = 0;
        this.lives = 3;
        this.gameState = 'start';
        this.powerUp = null;
        this.powerLevel = 0;
        this.particles = [];
        this.wave = 1;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.gameState = 'playing';
        this.score = 0;
        this.lives = 3;
        this.wave = 1;
        this.powerLevel = 0;
        this.player = { x: this.width / 2, y: this.height - 80, speed: 5 };
        this.enemies = [];
        this.playerBullets = [];
        this.enemyBullets = [];
        this.asteroids = [];
        this.particles = [];
        this.powerUp = null;

        for (let i = 0; i < 5; i++) {
            this.spawnAsteroid();
        }
    }

    spawnAsteroid() {
        const size = 20 + Math.random() * 30;
        this.asteroids.push({
            x: Math.random() * this.width,
            y: -50,
            vx: (Math.random() - 0.5) * 2,
            vy: 1 + Math.random() * 2,
            size: size,
            rotation: 0,
            rotSpeed: (Math.random() - 0.5) * 0.1,
            hp: Math.floor(size / 10)
        });
    }

    spawnEnemy() {
        const types = ['scout', 'fighter', 'bomber'];
        const type = types[Math.floor(Math.random() * Math.min(types.length, Math.floor(this.wave / 3) + 1))];

        this.enemies.push({
            type: type,
            x: Math.random() * (this.width - 100) + 50,
            y: -30,
            vx: (Math.random() - 0.5) * 2,
            vy: type === 'scout' ? 3 : type === 'fighter' ? 2 : 1,
            hp: type === 'bomber' ? 30 : type === 'fighter' ? 15 : 8,
            maxHp: type === 'bomber' ? 30 : type === 'fighter' ? 15 : 8,
            shootTimer: 60 + Math.random() * 60,
            width: type === 'bomber' ? 50 : 35,
            height: type === 'bomber' ? 40 : 30
        });
    }

    update() {
        if (this.gameState !== 'playing') return;

        if (this.keys.left && this.player.x > 30) this.player.x -= this.player.speed;
        if (this.keys.right && this.player.x < this.width - 30) this.player.x += this.player.speed;
        if (this.keys.up && this.player.y > 30) this.player.y -= this.player.speed;
        if (this.keys.down && this.player.y < this.height - 30) this.player.y += this.player.speed;

        if (this.keys.shoot && Date.now() - (this.lastShot || 0) > 150) {
            this.shoot();
            this.lastShot = Date.now();
        }

        if (Math.random() < 0.02 + this.wave * 0.005) {
            this.spawnEnemy();
        }

        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const a = this.asteroids[i];
            a.x += a.vx;
            a.y += a.vy;
            a.rotation += a.rotSpeed;

            if (a.y > this.height + 50) {
                this.asteroids.splice(i, 1);
                continue;
            }

            for (let j = this.playerBullets.length - 1; j >= 0; j--) {
                const b = this.playerBullets[j];
                if (Math.hypot(b.x - a.x, b.y - a.y) < a.size) {
                    a.hp--;
                    this.playerBullets.splice(j, 1);

                    if (a.hp <= 0) {
                        this.score += 20;
                        this.createExplosion(a.x, a.y, '#888');
                        this.asteroids.splice(i, 1);
                    }
                    break;
                }
            }

            if (this.checkCollision(this.player, a, a.size)) {
                this.hitPlayer();
            }
        }

        for (const e of this.enemies) {
            e.x += e.vx;
            e.y += e.vy;

            if (e.x < 20 || e.x > this.width - 20) e.vx *= -1;

            if (e.shootTimer > 0) e.shootTimer--;
            else {
                e.shootTimer = 60 + Math.random() * 60;
                this.enemyBullets.push({
                    x: e.x,
                    y: e.y + e.height / 2,
                    vx: 0,
                    vy: 5,
                    damage: 10
                });
            }

            for (let i = this.playerBullets.length - 1; i >= 0; i--) {
                const b = this.playerBullets[i];
                if (Math.hypot(b.x - e.x, b.y - e.y) < e.width / 2) {
                    e.hp -= b.damage;
                    this.playerBullets.splice(i, 1);

                    if (e.hp <= 0) {
                        this.score += 50;
                        this.createExplosion(e.x, e.y, '#f00');
                        this.enemies.splice(this.enemies.indexOf(e), 1);

                        if (Math.random() < 0.1) {
                            this.powerUp = { x: e.x, y: e.y, vy: 2, type: 'power' };
                        }
                    }
                    break;
                }
            }

            if (this.checkCollision(this.player, e, 20)) {
                this.hitPlayer();
            }
        }

        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const b = this.playerBullets[i];
            b.y -= 10;
            if (b.y < -20) this.playerBullets.splice(i, 1);
        }

        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const b = this.enemyBullets[i];
            b.x += b.vx;
            b.y += b.vy;

            if (Math.hypot(b.x - this.player.x, b.y - this.player.y) < 20) {
                this.hitPlayer();
                this.enemyBullets.splice(i, 1);
            } else if (b.y > this.height + 20) {
                this.enemyBullets.splice(i, 1);
            }
        }

        if (this.powerUp) {
            this.powerUp.y += this.powerUp.vy;

            if (Math.hypot(this.powerUp.x - this.player.x, this.powerUp.y - this.player.y) < 30) {
                this.powerLevel = Math.min(3, this.powerLevel + 1);
                this.powerUp = null;
            } else if (this.powerUp.y > this.height + 20) {
                this.powerUp = null;
            }
        }

        for (const p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
        }
        this.particles = this.particles.filter(p => p.life > 0);

        if (this.asteroids.length < 3 + this.wave) {
            this.spawnAsteroid();
        }

        if (this.score > this.wave * 500) {
            this.wave++;
        }
    }

    shoot() {
        const spread = this.powerLevel > 0 ? 1 : 0;
        const damage = 10 + this.powerLevel * 5;

        for (let i = -spread; i <= spread; i++) {
            this.playerBullets.push({
                x: this.player.x + i * 10,
                y: this.player.y - 20,
                damage: damage
            });
        }
    }

    checkCollision(player, obj, radius) {
        return Math.hypot(player.x - obj.x, player.y - obj.y) < radius;
    }

    hitPlayer() {
        this.lives--;
        this.powerLevel = 0;
        this.createExplosion(this.player.x, this.player.y, '#f00');

        if (this.lives <= 0) {
            this.gameState = 'gameover';
        } else {
            this.player.x = this.width / 2;
            this.player.y = this.height - 80;
        }
    }

    createExplosion(x, y, color) {
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 30,
                color: color
            });
        }
    }

    render() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        for (let i = 0; i < 100; i++) {
            this.ctx.fillStyle = '#fff';
            const x = (i * 137 + this.wave * 10) % this.width;
            const y = (i * 241) % this.height;
            this.ctx.fillRect(x, y, 2, 2);
        }

        for (const p of this.particles) {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life / 30;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;

        for (const b of this.playerBullets) {
            this.ctx.fillStyle = '#0ff';
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        for (const b of this.enemyBullets) {
            this.ctx.fillStyle = '#f00';
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
            this.ctx.fill();
        }

        for (const a of this.asteroids) {
            this.ctx.save();
            this.ctx.translate(a.x, a.y);
            this.ctx.rotate(a.rotation);

            this.ctx.fillStyle = '#666';
            this.ctx.strokeStyle = '#444';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();

            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                const r = a.size * (0.8 + Math.sin(i * 3) * 0.2);
                if (i === 0) this.ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
                else this.ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.restore();
        }

        for (const e of this.enemies) {
            this.ctx.save();
            this.ctx.translate(e.x, e.y);

            if (e.type === 'scout') {
                this.ctx.fillStyle = '#f44';
                this.ctx.beginPath();
                this.ctx.moveTo(0, e.height / 2);
                this.ctx.lineTo(-e.width / 2, -e.height / 2);
                this.ctx.lineTo(e.width / 2, -e.height / 2);
                this.ctx.closePath();
                this.ctx.fill();
            } else if (e.type === 'fighter') {
                this.ctx.fillStyle = '#4f4';
                this.ctx.fillRect(-e.width / 2, -e.height / 2, e.width, e.height);
                this.ctx.fillStyle = '#242';
                this.ctx.fillRect(-e.width / 4, -e.height / 2 - 10, e.width / 2, 10);
            } else {
                this.ctx.fillStyle = '#44f';
                this.ctx.fillRect(-e.width / 2, -e.height / 2, e.width, e.height);
                this.ctx.fillStyle = '#222';
                this.ctx.beginPath();
                this.ctx.arc(0, e.height / 2 + 5, 10, 0, Math.PI);
                this.ctx.fill();
            }

            this.ctx.restore();
        }

        if (this.powerUp) {
            this.ctx.fillStyle = '#ff0';
            this.ctx.beginPath();
            this.ctx.arc(this.powerUp.x, this.powerUp.y, 15, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('P', this.powerUp.x, this.powerUp.y + 5);
        }

        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);

        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -20);
        this.ctx.lineTo(-15, 15);
        this.ctx.lineTo(0, 10);
        this.ctx.lineTo(15, 15);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = '#888';
        this.ctx.fillRect(-20, 5, 8, 15);
        this.ctx.fillRect(12, 5, 8, 15);

        if (this.powerLevel > 0) {
            this.ctx.fillStyle = '#0ff';
            this.ctx.globalAlpha = 0.5;
            for (let i = 0; i < this.powerLevel; i++) {
                this.ctx.beginPath();
                this.ctx.arc(-10 + i * 10, 0, 5, 0, Math.PI * 2);
                this.ctx.fill();
            }
            this.ctx.globalAlpha = 1;
        }

        this.ctx.restore();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 10, 25);
        this.ctx.fillText(`Lives: ${'O'.repeat(this.lives)}`, 10, 45);
        this.ctx.fillText(`Wave: ${this.wave}`, 10, 65);

        if (this.powerLevel > 0) {
            this.ctx.fillStyle = '#ff0';
            this.ctx.fillText(`Power: ${this.powerLevel}`, 10, 85);
        }

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('SPACE SHOOTER', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Arrow Keys: Move | Z: Shoot', this.width / 2, this.height / 2 + 10);
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
            this.ctx.fillText(`Wave: ${this.wave}`, this.width / 2, this.height / 2 + 50);
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 90);
        }
    }

    handleKeyDown(key) {
        if (key === 'ArrowLeft') this.keys.left = true;
        if (key === 'ArrowRight') this.keys.right = true;
        if (key === 'ArrowUp') this.keys.up = true;
        if (key === 'ArrowDown') this.keys.down = true;
        if (key === 'z' || key === 'Z') this.keys.shoot = true;

        if (key === ' ' && this.gameState !== 'playing') {
            this.start();
        }
    }

    handleKeyUp(key) {
        if (key === 'ArrowLeft') this.keys.left = false;
        if (key === 'ArrowRight') this.keys.right = false;
        if (key === 'ArrowUp') this.keys.up = false;
        if (key === 'ArrowDown') this.keys.down = false;
        if (key === 'z' || key === 'Z') this.keys.shoot = false;
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

window.SpaceShooterGame = SpaceShooterGame;