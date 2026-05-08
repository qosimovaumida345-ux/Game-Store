const SpaceShooter = {
    canvas: null,
    ctx: null,
    player: null,
    bullets: [],
    enemies: [],
    particles: [],
    powerups: [],
    stars: [],
    score: 0,
    highScore: 0,
    lives: 3,
    level: 1,
    waveCount: 0,
    gameOver: false,
    paused: false,
    keys: {},
    lastShot: 0,
    lastEnemySpawn: 0,
    enemySpawnInterval: 2000,
    colors: ['#00ff88', '#ff00ff', '#00ffff', '#ffff00'],
    shootSound: null,
    explodeSound: null,
    bgMusic: null,
    frameCount: 0,

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
        this.loadSounds();
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

    loadSounds() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.shootSound = () => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.frequency.setValueAtTime(800, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.1);
            };
            this.explodeSound = () => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.frequency.setValueAtTime(150, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.3);
            };
        } catch (e) {
            console.log('Audio not available');
        }
    },

    reset() {
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            width: 40,
            height: 40,
            speed: 6,
            shield: false,
            shieldTime: 0,
            rapidFire: false,
            rapidFireTime: 0
        };
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.powerups = [];
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.waveCount = 0;
        this.gameOver = false;
        this.paused = false;
        this.lastEnemySpawn = Date.now();
        this.enemySpawnInterval = 2000;
        this.frameCount = 0;
    },

    createStars() {
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * 800,
                y: Math.random() * 600,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 2 + 0.5,
                brightness: Math.random()
            });
        }
    },

    spawnEnemy() {
        const now = Date.now();
        if (now - this.lastEnemySpawn < this.enemySpawnInterval) return;
        
        const type = Math.random();
        const enemy = {
            x: Math.random() * (this.canvas.width - 40) + 20,
            y: -40,
            width: 35,
            height: 35,
            speed: 1.5 + Math.random() * 2 + this.level * 0.3,
            health: type < 0.3 ? 2 : 1,
            type: type < 0.3 ? 'heavy' : type < 0.6 ? 'fast' : 'normal',
            color: type < 0.3 ? '#ff4444' : type < 0.6 ? '#44ff44' : '#4444ff',
            shootTimer: 0,
            canShoot: type < 0.3
        };
        this.enemies.push(enemy);
        this.waveCount++;
        this.lastEnemySpawn = now;

        if (this.waveCount >= 10 + this.level * 5) {
            this.level++;
            this.waveCount = 0;
            this.enemySpawnInterval = Math.max(500, 2000 - this.level * 200);
        }
    },

    shoot() {
        const now = Date.now();
        const shootDelay = this.player.rapidFire ? 100 : 250;
        if (now - this.lastShot < shootDelay) return;
        
        if (this.shootSound) this.shootSound();
        this.lastShot = now;

        if (this.player.rapidFire) {
            this.bullets.push({
                x: this.player.x - 15,
                y: this.player.y,
                speed: -12,
                width: 4,
                height: 12
            });
            this.bullets.push({
                x: this.player.x + 15,
                y: this.player.y,
                speed: -12,
                width: 4,
                height: 12
            });
        } else {
            this.bullets.push({
                x: this.player.x,
                y: this.player.y,
                speed: -10,
                width: 6,
                height: 15
            });
        }
    },

    spawnPowerup(x, y) {
        if (Math.random() < 0.15) {
            const types = ['shield', 'rapid', 'life'];
            const type = types[Math.floor(Math.random() * types.length)];
            this.powerups.push({
                x: x,
                y: y,
                width: 25,
                height: 25,
                speed: 2,
                type: type,
                rotation: 0
            });
        }
    },

    createExplosion(x, y, color, count = 15) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const speed = Math.random() * 4 + 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: Math.random() * 0.03 + 0.02,
                color: color,
                size: Math.random() * 6 + 2
            });
        }
    },

    update(deltaTime) {
        if (this.gameOver || this.paused) return;
        
        this.frameCount++;

        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.x += this.player.speed;
        }
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.player.y -= this.player.speed;
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.player.y += this.player.speed;
        }
        if (this.keys['Space']) {
            this.shoot();
        }

        this.player.x = Math.max(this.player.width / 2, Math.min(this.canvas.width - this.player.width / 2, this.player.x));
        this.player.y = Math.max(this.player.height / 2, Math.min(this.canvas.height - this.player.height / 2, this.player.y));

        if (this.player.shieldTime > 0) {
            this.player.shieldTime -= deltaTime;
            if (this.player.shieldTime <= 0) this.player.shield = false;
        }
        if (this.player.rapidFireTime > 0) {
            this.player.rapidFireTime -= deltaTime;
            if (this.player.rapidFireTime <= 0) this.player.rapidFire = false;
        }

        this.bullets.forEach((bullet, index) => {
            bullet.y += bullet.speed;
            if (bullet.y < -20) this.bullets.splice(index, 1);
        });

        this.enemies.forEach((enemy, eIndex) => {
            enemy.y += enemy.speed;
            if (enemy.type === 'fast') {
                enemy.x += Math.sin(enemy.y * 0.05) * 2;
            }

            if (enemy.canShoot) {
                enemy.shootTimer += deltaTime;
                if (enemy.shootTimer > 2000) {
                    enemy.shootTimer = 0;
                    this.bullets.push({
                        x: enemy.x,
                        y: enemy.y + enemy.height,
                        speed: 5,
                        width: 5,
                        height: 10,
                        enemy: true,
                        color: '#ff6666'
                    });
                }
            }

            if (enemy.y > this.canvas.height + 50) {
                this.enemies.splice(eIndex, 1);
            }

            this.bullets.forEach((bullet, bIndex) => {
                if (bullet.enemy && this.checkCollision(bullet, this.player)) {
                    if (!this.player.shield) {
                        this.lives--;
                        this.createExplosion(this.player.x, this.player.y, '#00ffff', 20);
                        if (this.explodeSound) this.explodeSound();
                        if (this.lives <= 0) this.gameOver = true;
                    }
                    this.bullets.splice(bIndex, 1);
                }
            });
        });

        this.bullets.forEach((bullet, bIndex) => {
            if (bullet.enemy) return;
            this.enemies.forEach((enemy, eIndex) => {
                if (this.checkCollision(bullet, enemy)) {
                    enemy.health--;
                    this.bullets.splice(bIndex, 1);
                    this.createExplosion(bullet.x, bullet.y, enemy.color, 5);

                    if (enemy.health <= 0) {
                        this.createExplosion(enemy.x, enemy.y, enemy.color, 20);
                        this.score += enemy.type === 'heavy' ? 30 : enemy.type === 'fast' ? 20 : 10;
                        this.spawnPowerup(enemy.x, enemy.y);
                        if (this.explodeSound) this.explodeSound();
                        this.enemies.splice(eIndex, 1);
                    }
                }
            });
        });

        if (this.checkCollision(this.player, { x: this.player.x, y: this.canvas.height + 100, width: 800, height: 50 })) {
            this.lives--;
            this.createExplosion(this.player.x, this.player.y, '#ff0000', 30);
            if (this.explodeSound) this.explodeSound();
            this.player.x = this.canvas.width / 2;
            this.player.y = this.canvas.height - 50;
            this.player.shield = true;
            this.player.shieldTime = 2000;
            if (this.lives <= 0) this.gameOver = true;
        }

        this.powerups.forEach((powerup, index) => {
            powerup.y += powerup.speed;
            powerup.rotation += 0.1;

            if (this.checkCollision(powerup, this.player)) {
                if (powerup.type === 'shield') {
                    this.player.shield = true;
                    this.player.shieldTime = 5000;
                } else if (powerup.type === 'rapid') {
                    this.player.rapidFire = true;
                    this.player.rapidFireTime = 5000;
                } else if (powerup.type === 'life' && this.lives < 5) {
                    this.lives++;
                }
                this.powerups.splice(index, 1);
            }

            if (powerup.y > this.canvas.height + 30) {
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
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
        });

        this.spawnEnemy();
    },

    checkCollision(a, b) {
        return a.x - a.width / 2 < b.x + b.width / 2 &&
               a.x + a.width / 2 > b.x - b.width / 2 &&
               a.y - a.height / 2 < b.y + b.height / 2 &&
               a.y + a.height / 2 > b.y - b.height / 2;
    },

    draw() {
        this.ctx.fillStyle = '#0a0a20';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.stars.forEach(star => {
            const alpha = 0.3 + star.brightness * 0.7 + Math.sin(this.frameCount * 0.1 + star.x) * 0.2;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.powerups.forEach(powerup => {
            this.ctx.save();
            this.ctx.translate(powerup.x, powerup.y);
            this.ctx.rotate(powerup.rotation);
            
            const colors = { shield: '#00ffff', rapid: '#ffff00', life: '#00ff00' };
            this.ctx.strokeStyle = colors[powerup.type] || '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -powerup.height / 2);
            this.ctx.lineTo(powerup.width / 2, powerup.height / 2);
            this.ctx.lineTo(-powerup.width / 2, powerup.height / 2);
            this.ctx.closePath();
            this.ctx.stroke();
            
            this.ctx.fillStyle = colors[powerup.type] + '40';
            this.ctx.fill();
            this.ctx.restore();
        });

        this.bullets.forEach(bullet => {
            if (bullet.enemy) {
                this.ctx.fillStyle = bullet.color || '#ff0000';
                this.ctx.shadowColor = '#ff0000';
                this.ctx.shadowBlur = 10;
            } else {
                this.ctx.fillStyle = '#00ffff';
                this.ctx.shadowColor = '#00ffff';
                this.ctx.shadowBlur = 10;
            }
            this.ctx.fillRect(bullet.x - bullet.width / 2, bullet.y - bullet.height / 2, bullet.width, bullet.height);
            this.ctx.shadowBlur = 0;
        });

        this.enemies.forEach(enemy => {
            this.ctx.save();
            this.ctx.translate(enemy.x, enemy.y);

            this.ctx.fillStyle = enemy.color;
            this.ctx.shadowColor = enemy.color;
            this.ctx.shadowBlur = 15;

            if (enemy.type === 'heavy') {
                this.ctx.beginPath();
                this.ctx.moveTo(0, -enemy.height / 2);
                this.ctx.lineTo(enemy.width / 2, enemy.height / 2);
                this.ctx.lineTo(-enemy.width / 2, enemy.height / 2);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(-5, -5, 10, 10);
            } else if (enemy.type === 'fast') {
                this.ctx.beginPath();
                this.ctx.arc(0, 0, enemy.width / 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#000000';
                this.ctx.beginPath();
                this.ctx.arc(-5, -3, 4, 0, Math.PI * 2);
                this.ctx.arc(5, -3, 4, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                this.ctx.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(-8, -5, 4, 4);
                this.ctx.fillRect(4, -5, 4, 4);
            }

            this.ctx.shadowBlur = 0;
            this.ctx.restore();
        });

        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);

        if (this.player.shield) {
            this.ctx.strokeStyle = '#00ffff';
            this.ctx.lineWidth = 3;
            this.ctx.shadowColor = '#00ffff';
            this.ctx.shadowBlur = 20;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 30, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }

        this.ctx.fillStyle = '#00ff88';
        this.ctx.shadowColor = '#00ff88';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -this.player.height / 2);
        this.ctx.lineTo(-this.player.width / 2, this.player.height / 2);
        this.ctx.lineTo(this.player.width / 2, this.player.height / 2);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = '#004422';
        this.ctx.fillRect(-8, -5, 16, 10);
        this.ctx.shadowBlur = 0;
        this.ctx.restore();

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
        this.ctx.fillText(`Lives: ${'❤️'.repeat(this.lives)}`, 20, 60);
        this.ctx.fillText(`Level: ${this.level}`, 20, 90);

        if (this.paused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Press P to resume', this.canvas.width / 2, this.canvas.height / 2 + 40);
        }

        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ff4444';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 40);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
            this.ctx.fillText('Click or press Enter to restart', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }

        this.ctx.textAlign = 'left';
    },

    gameLoop() {
        const now = Date.now();
        const deltaTime = 16;
        this.update(deltaTime);
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpaceShooter;
}