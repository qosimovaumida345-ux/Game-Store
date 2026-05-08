const GalagaStar = {
    canvas: null,
    ctx: null,
    player: null,
    bullets: [],
    enemies: [],
    enemyBullets: [],
    particles: [],
    powerups: [],
    stars: [],
    score: 0,
    highScore: 0,
    lives: 3,
    level: 1,
    wave: 0,
    gameOver: false,
    paused: false,
    keys: {},
    lastShot: 0,
    frameCount: 0,
    enemyFormation: [],
    formationX: 400,
    formationDirection: 1,

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = canvasId;
            this.canvas.width = 800;
            this.canvas.height = 600;
            document.body.appendChild(this.canvas);
        }
        this.ctx = this.canvas.getContext('2d');
        this.setupEventListeners();
        this.createStars();
        this.reset();
        this.gameLoop();
    },

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') e.preventDefault();
            if (e.code === 'KeyP') this.paused = !this.paused;
            if (e.code === 'Enter' && this.gameOver) this.reset();
        });
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        this.canvas.addEventListener('click', () => {
            if (this.gameOver) this.reset();
        });
    },

    createStars() {
        this.stars = [];
        for (let i = 0; i < 120; i++) {
            this.stars.push({
                x: Math.random() * 800,
                y: Math.random() * 600,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 3 + 1,
                brightness: Math.random()
            });
        }
    },

    reset() {
        this.player = {
            x: 400,
            y: 550,
            width: 40,
            height: 40,
            speed: 5,
            invulnerable: false,
            invulnerableTimer: 0,
            special: false,
            specialTimer: 0
        };

        this.bullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.particles = [];
        this.powerups = [];
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.wave = 0;
        this.gameOver = false;
        this.paused = false;
        this.frameCount = 0;
        this.formationX = 400;
        this.formationDirection = 1;

        this.spawnWave();
    },

    spawnWave() {
        this.wave++;
        this.formationX = 400;
        this.formationDirection = 1;

        const rows = Math.min(3 + Math.floor(this.level / 2), 5);
        const cols = Math.min(8 + this.level, 12);

        this.enemyFormation = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const type = row === 0 ? 'boss' : row === 1 ? 'elite' : 'normal';
                const color = type === 'boss' ? '#ff00ff' : type === 'elite' ? '#00ffff' : '#ffff00';
                const points = type === 'boss' ? 150 : type === 'elite' ? 100 : 50;
                const health = type === 'boss' ? 3 : type === 'elite' ? 2 : 1;

                this.enemyFormation.push({
                    row: row,
                    col: col,
                    type: type,
                    color: color,
                    points: points,
                    health: health,
                    captured: false,
                    attacking: false,
                    attackTimer: 0,
                    startX: col * 50 + 200,
                    startY: row * 40 + 50
                });
            }
        }

        this.enemies = this.enemyFormation.map(e => ({
            x: e.startX,
            y: e.startY - 100,
            targetX: e.startX,
            targetY: e.startY,
            width: 30,
            height: 30,
            type: e.type,
            color: e.color,
            points: e.points,
            health: e.health,
            maxHealth: e.health,
            captured: false,
            attacking: false,
            attackTimer: 0,
            enterTimer: 60 + e.row * 10,
            angle: 0,
            swoopAngle: 0
        }));
    },

    shoot() {
        const now = Date.now();
        const shootDelay = this.player.special ? 80 : 200;
        if (now - this.lastShot < shootDelay) return;
        this.lastShot = now;

        if (this.player.special) {
            for (let i = -1; i <= 1; i++) {
                this.bullets.push({
                    x: this.player.x + i * 10,
                    y: this.player.y - 20,
                    vx: i * 0.5,
                    vy: -12,
                    width: 4,
                    height: 15,
                    damage: 1
                });
            }
        } else {
            this.bullets.push({
                x: this.player.x,
                y: this.player.y - 20,
                vx: 0,
                vy: -10,
                width: 5,
                height: 12,
                damage: 1
            });
        }
    },

    createExplosion(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: Math.random() * 0.03 + 0.02,
                color: color,
                size: Math.random() * 5 + 2
            });
        }
    },

    spawnPowerup(x, y) {
        if (Math.random() < 0.1) {
            this.powerups.push({
                x: x,
                y: y,
                vy: 1.5,
                type: Math.random() < 0.5 ? 'special' : 'life',
                color: Math.random() < 0.5 ? '#ff00ff' : '#00ff00',
                rotation: 0
            });
        }
    },

    update() {
        if (this.gameOver || this.paused) return;

        this.frameCount++;

        if (this.player.invulnerable) {
            this.player.invulnerableTimer--;
            if (this.player.invulnerableTimer <= 0) {
                this.player.invulnerable = false;
            }
        }

        if (this.player.special) {
            this.player.specialTimer--;
            if (this.player.specialTimer <= 0) {
                this.player.special = false;
            }
        }

        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.x += this.player.speed;
        }
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.player.y -= this.player.speed * 0.7;
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.player.y += this.player.speed * 0.7;
        }
        if (this.keys['Space']) {
            this.shoot();
        }

        this.player.x = Math.max(30, Math.min(770, this.player.x));
        this.player.y = Math.max(100, Math.min(570, this.player.y));

        this.bullets.forEach((bullet, index) => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;

            if (bullet.y < -20) {
                this.bullets.splice(index, 1);
            }
        });

        this.formationX += this.formationDirection * (1 + this.level * 0.2);
        if (this.formationX > 500 || this.formationX < 300) {
            this.formationDirection = -this.formationDirection;
        }

        this.enemies.forEach(enemy => {
            if (enemy.enterTimer > 0) {
                enemy.enterTimer--;
                enemy.y += (enemy.targetY - enemy.y) * 0.05;
                enemy.x += (this.formationX - enemy.x) * 0.05;
                return;
            }

            if (!enemy.attacking) {
                enemy.x = enemy.targetX + Math.sin(this.frameCount * 0.05 + enemy.row) * 10;
                enemy.y = enemy.targetY + Math.cos(this.frameCount * 0.03 + enemy.col) * 5;

                enemy.attackTimer++;
                const attackChance = 0.005 + this.level * 0.001;

                if (enemy.attackTimer > 60 && Math.random() < attackChance && this.enemies.filter(e => !e.attacking).length < 3) {
                    enemy.attacking = true;
                    enemy.swoopAngle = 0;
                    enemy.attackTimer = 0;
                }
            } else {
                enemy.swoopAngle += 0.05;
                enemy.x = this.player.x + Math.cos(enemy.swoopAngle) * 200;
                enemy.y = enemy.targetY + 100 + Math.sin(enemy.swoopAngle * 2) * 80;

                if (Math.random() < 0.03) {
                    this.enemyBullets.push({
                        x: enemy.x,
                        y: enemy.y + 15,
                        vx: (Math.random() - 0.5) * 2,
                        vy: 4 + Math.random() * 2,
                        radius: 4
                    });
                }

                if (enemy.y > 550) {
                    enemy.attacking = false;
                    enemy.x = enemy.targetX;
                    enemy.y = enemy.targetY - 20;
                }
            }

            enemy.angle = Math.sin(this.frameCount * 0.1) * 0.1;

            if (Math.random() < 0.01) {
                this.enemyBullets.push({
                    x: enemy.x,
                    y: enemy.y + 15,
                    vx: (Math.random() - 0.5) * 2,
                    vy: 3 + Math.random() * 2,
                    radius: 4
                });
            }
        });

        this.enemyBullets.forEach((bullet, index) => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;

            if (bullet.y > 620) {
                this.enemyBullets.splice(index, 1);
                return;
            }

            if (!this.player.invulnerable && 
                Math.abs(bullet.x - this.player.x) < 20 && 
                Math.abs(bullet.y - this.player.y) < 20) {
                this.lives--;
                this.createExplosion(this.player.x, this.player.y, '#ff0000', 30);
                this.enemyBullets.splice(index, 1);
                if (this.lives <= 0) {
                    this.gameOver = true;
                } else {
                    this.player.invulnerable = true;
                    this.player.invulnerableTimer = 180;
                }
            }
        });

        this.bullets.forEach((bullet, bIndex) => {
            this.enemies.forEach((enemy, eIndex) => {
                if (Math.abs(bullet.x - enemy.x) < 25 && Math.abs(bullet.y - enemy.y) < 25) {
                    enemy.health -= bullet.damage;
                    this.bullets.splice(bIndex, 1);

                    if (enemy.health <= 0) {
                        this.createExplosion(enemy.x, enemy.y, enemy.color, 25);
                        this.score += enemy.points;
                        this.spawnPowerup(enemy.x, enemy.y);
                        this.enemies.splice(eIndex, 1);
                    } else {
                        this.createExplosion(bullet.x, bullet.y, enemy.color, 5);
                    }
                }
            });
        });

        if (!this.player.invulnerable) {
            this.enemies.forEach((enemy, eIndex) => {
                if (Math.abs(this.player.x - enemy.x) < 25 && Math.abs(this.player.y - enemy.y) < 25) {
                    this.lives--;
                    this.createExplosion(enemy.x, enemy.y, enemy.color, 25);
                    this.enemies.splice(eIndex, 1);
                    if (this.lives <= 0) {
                        this.gameOver = true;
                    } else {
                        this.player.invulnerable = true;
                        this.player.invulnerableTimer = 180;
                    }
                }
            });
        }

        this.powerups.forEach((powerup, index) => {
            powerup.y += powerup.vy;
            powerup.rotation += 0.1;

            if (Math.abs(powerup.x - this.player.x) < 25 && Math.abs(powerup.y - this.player.y) < 25) {
                if (powerup.type === 'special') {
                    this.player.special = true;
                    this.player.specialTimer = 600;
                } else if (powerup.type === 'life' && this.lives < 5) {
                    this.lives++;
                }
                this.createExplosion(powerup.x, powerup.y, powerup.color, 15);
                this.powerups.splice(index, 1);
            }

            if (powerup.y > 620) {
                this.powerups.splice(index, 1);
            }
        });

        this.particles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            if (particle.life <= 0) this.particles.splice(index, 1);
        });

        this.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > 600) {
                star.y = 0;
                star.x = Math.random() * 800;
            }
        });

        if (this.enemies.length === 0) {
            this.level++;
            this.spawnWave();
        }
    },

    draw() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, 600);
        gradient.addColorStop(0, '#000033');
        gradient.addColorStop(1, '#000066');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, 800, 600);

        this.stars.forEach(star => {
            const alpha = 0.4 + star.brightness * 0.6;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.enemies.forEach(enemy => {
            this.ctx.save();
            this.ctx.translate(enemy.x, enemy.y);
            this.ctx.rotate(enemy.angle);

            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
            gradient.addColorStop(0, enemy.color);
            gradient.addColorStop(1, this.darkenColor(enemy.color, 50));

            this.ctx.fillStyle = gradient;
            this.ctx.shadowColor = enemy.color;
            this.ctx.shadowBlur = 15;

            this.ctx.beginPath();
            this.ctx.moveTo(0, -enemy.height / 2);
            this.ctx.lineTo(enemy.width / 2, enemy.height / 3);
            this.ctx.lineTo(enemy.width / 4, enemy.height / 2);
            this.ctx.lineTo(-enemy.width / 4, enemy.height / 2);
            this.ctx.lineTo(-enemy.width / 2, enemy.height / 3);
            this.ctx.closePath();
            this.ctx.fill();

            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.arc(-5, -3, 4, 0, Math.PI * 2);
            this.ctx.arc(5, -3, 4, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();

            if (enemy.health < enemy.maxHealth) {
                const healthPercent = enemy.health / enemy.maxHealth;
                this.ctx.fillStyle = '#333333';
                this.ctx.fillRect(enemy.x - 15, enemy.y - 25, 30, 4);
                this.ctx.fillStyle = '#00ff00';
                this.ctx.fillRect(enemy.x - 15, enemy.y - 25, 30 * healthPercent, 4);
            }
        });

        this.enemyBullets.forEach(bullet => {
            this.ctx.fillStyle = '#ff6666';
            this.ctx.shadowColor = '#ff6666';
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });

        this.bullets.forEach(bullet => {
            this.ctx.fillStyle = this.player.special ? '#ff00ff' : '#00ffff';
            this.ctx.shadowColor = this.ctx.fillStyle;
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(bullet.x - bullet.width / 2, bullet.y - bullet.height / 2, bullet.width, bullet.height);
            this.ctx.shadowBlur = 0;
        });

        this.powerups.forEach(powerup => {
            this.ctx.save();
            this.ctx.translate(powerup.x, powerup.y);
            this.ctx.rotate(powerup.rotation);

            this.ctx.strokeStyle = powerup.color;
            this.ctx.lineWidth = 3;
            this.ctx.shadowColor = powerup.color;
            this.ctx.shadowBlur = 15;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -12);
            this.ctx.lineTo(10, 12);
            this.ctx.lineTo(-10, 12);
            this.ctx.closePath();
            this.ctx.stroke();

            this.ctx.restore();
        });

        const playerVisible = !this.player.invulnerable || this.frameCount % 10 < 5;

        if (playerVisible) {
            this.ctx.save();
            this.ctx.translate(this.player.x, this.player.y);

            if (this.player.special) {
                this.ctx.strokeStyle = '#ff00ff';
                this.ctx.lineWidth = 2;
                this.ctx.shadowColor = '#ff00ff';
                this.ctx.shadowBlur = 20;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 25, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            this.ctx.fillStyle = '#00ff88';
            this.ctx.shadowColor = '#00ff88';
            this.ctx.shadowBlur = 15;

            this.ctx.beginPath();
            this.ctx.moveTo(0, -this.player.height / 2);
            this.ctx.lineTo(-this.player.width / 2, this.player.height / 2);
            this.ctx.lineTo(0, this.player.height / 3);
            this.ctx.lineTo(this.player.width / 2, this.player.height / 2);
            this.ctx.closePath();
            this.ctx.fill();

            this.ctx.fillStyle = '#004422';
            this.ctx.fillRect(-6, -5, 12, 8);

            this.ctx.restore();
        }

        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color + Math.floor(particle.life * 255).toString(16).padStart(2, '0');
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
        this.ctx.fillText(`Lives: ${'🚀'.repeat(this.lives)}`, 20, 60);
        this.ctx.fillText(`Level: ${this.level}`, 20, 90);
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`High: ${this.highScore}`, 780, 30);

        if (this.player.special) {
            this.ctx.fillStyle = '#ff00ff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillText('SPECIAL!', 650, 90);
        }

        if (this.paused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, 800, 600);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', 400, 280);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Press P to resume', 400, 330);
        }

        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            this.ctx.fillRect(0, 0, 800, 600);
            this.ctx.fillStyle = '#ff4444';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', 400, 250);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, 400, 310);
            this.ctx.fillText(`Level: ${this.level} | Wave: ${this.wave}`, 400, 350);
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Click or press Enter to restart', 400, 420);
        }
    },

    darkenColor(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, (num >> 16) - amount);
        const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
        const b = Math.max(0, (num & 0x0000FF) - amount);
        return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    },

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GalagaStar;
}