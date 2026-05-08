class SpaceInvaders2Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.player = null;
        this.enemies = [];
        this.enemyBullets = [];
        this.playerBullets = [];
        this.powerUps = [];
        this.barriers = [];
        this.particles = [];
        this.score = 0;
        this.highScore = 0;
        this.lives = 3;
        this.level = 1;
        this.gameState = 'start';
        this.enemyDirection = 1;
        this.enemySpeed = 1;
        this.lastEnemyMoveTime = 0;
        this.enemyMoveInterval = 800;
        this.shootCooldown = 0;
        this.specialWeapon = null;
        this.specialWeaponTimer = 0;
        this.shield = false;
        this.shieldTimer = 0;
        this.tripleShot = false;
        this.tripleShotTimer = 0;
        this.screenShake = 0;
        this.explosionAnimations = [];
        this.combo = 0;
        this.lastHitTime = 0;
        this.formationType = 'classic';
        this.ufo = null;
        this.ufoTimer = 0;
        this.asteroids = [];
        this.boss = null;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.canvas.addEventListener('keyup', (e) => this.handleKeyUp(e));
        this.keys = {};
        this.canvas.setAttribute('tabindex', '0');
        this.canvas.focus();
    }

    handleKeyDown(e) {
        if (this.gameState === 'start') {
            this.start();
            return;
        }
        if (this.gameState === 'gameover') {
            this.start();
            return;
        }

        switch (e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.keys.left = true;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.keys.right = true;
                break;
            case ' ':
                this.shoot();
                break;
            case 'Shift':
                this.useSpecialWeapon();
                break;
        }
    }

    handleKeyUp(e) {
        switch (e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.keys.left = false;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.keys.right = false;
                break;
        }
    }

    start() {
        this.player = {
            x: this.width / 2 - 25,
            y: this.height - 80,
            width: 50,
            height: 40,
            speed: 5
        };
        this.enemies = [];
        this.enemyBullets = [];
        this.playerBullets = [];
        this.powerUps = [];
        this.barriers = [];
        this.particles = [];
        this.explosionAnimations = [];
        this.asteroids = [];
        this.boss = null;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.enemyDirection = 1;
        this.enemySpeed = 1;
        this.enemyMoveInterval = 800;
        this.shootCooldown = 0;
        this.specialWeapon = null;
        this.specialWeaponTimer = 0;
        this.shield = false;
        this.shieldTimer = 0;
        this.tripleShot = false;
        this.tripleShotTimer = 0;
        this.screenShake = 0;
        this.combo = 0;
        this.ufo = null;
        this.ufoTimer = 0;

        this.spawnEnemies();
        this.spawnBarriers();
        this.gameState = 'playing';
        this.lastUpdateTime = Date.now();
        this.gameLoop();
    }

    spawnEnemies() {
        this.formationType = ['classic', 'v', 'diamond', 'grid'][this.level % 4];

        const rows = 5;
        const cols = 10;
        const enemyWidth = 40;
        const enemyHeight = 30;
        const spacingX = 60;
        const spacingY = 45;
        const startX = (this.width - cols * spacingX) / 2;
        const startY = 60;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                let x = startX + col * spacingX;
                let y = startY + row * spacingY;

                if (this.formationType === 'v') {
                    const offset = Math.abs(col - cols / 2) * 15;
                    y += offset;
                } else if (this.formationType === 'diamond') {
                    const centerDist = Math.abs(col - cols / 2) + Math.abs(row - rows / 2);
                    if (centerDist > 2) {
                        continue;
                    }
                    x = startX + (this.width - startX) / 2 + (col - cols / 2) * spacingX;
                    y = startY + (row - rows / 2) * spacingY;
                }

                const type = row < 1 ? 'elite' : row < 3 ? 'medium' : 'basic';
                const points = type === 'elite' ? 30 : type === 'medium' ? 20 : 10;

                this.enemies.push({
                    x, y,
                    width: enemyWidth,
                    height: enemyHeight,
                    type,
                    points,
                    animFrame: 0,
                    alive: true,
                    color: type === 'elite' ? '#ff00ff' : type === 'medium' ? '#00ff00' : '#00ffff'
                });
            }
        }
    }

    spawnBarriers() {
        const barrierCount = 4;
        const spacing = this.width / (barrierCount + 1);

        for (let i = 0; i < barrierCount; i++) {
            const x = spacing * (i + 1) - 30;
            const barrierBlocks = [];

            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 4; col++) {
                    barrierBlocks.push({
                        x: col * 15,
                        y: row * 12,
                        width: 15,
                        height: 12,
                        health: 1
                    });
                }
            }

            this.barriers.push({
                x, y: this.height - 150,
                blocks: barrierBlocks
            });
        }
    }

    shoot() {
        if (this.shootCooldown > 0) return;

        this.shootCooldown = 20;

        if (this.tripleShot) {
            this.playerBullets.push({
                x: this.player.x + 23,
                y: this.player.y,
                width: 4,
                height: 15,
                speed: 10,
                dx: 0
            });
            this.playerBullets.push({
                x: this.player.x + 23,
                y: this.player.y,
                width: 4,
                height: 15,
                speed: 10,
                dx: -2
            });
            this.playerBullets.push({
                x: this.player.x + 23,
                y: this.player.y,
                width: 4,
                height: 15,
                speed: 10,
                dx: 2
            });
        } else {
            this.playerBullets.push({
                x: this.player.x + 23,
                y: this.player.y,
                width: 4,
                height: 15,
                speed: 10,
                dx: 0
            });
        }

        if (this.specialWeapon === 'laser') {
            this.playerBullets.push({
                x: this.player.x,
                y: this.player.y,
                width: this.player.width,
                height: 5,
                speed: 15,
                dx: 0,
                isLaser: true
            });
            this.specialWeapon = null;
        }
    }

    useSpecialWeapon() {
        if (this.specialWeapon === 'bomb') {
            for (const enemy of this.enemies) {
                if (enemy.alive) {
                    this.destroyEnemy(enemy);
                    this.score += enemy.points;
                }
            }
            this.specialWeapon = null;
            this.screenShake = 10;
        }
    }

    spawnPowerUp(x, y) {
        if (Math.random() < 0.02) {
            const types = ['shield', 'triple', 'bomb', 'laser', 'speed'];
            this.powerUps.push({
                x, y,
                width: 25,
                height: 25,
                type: types[Math.floor(Math.random() * types.length)],
                vy: 1
            });
        }
    }

    applyPowerUp(type) {
        switch (type) {
            case 'shield':
                this.shield = true;
                this.shieldTimer = 600;
                break;
            case 'triple':
                this.tripleShot = true;
                this.tripleShotTimer = 400;
                break;
            case 'bomb':
                this.specialWeapon = 'bomb';
                break;
            case 'laser':
                this.specialWeapon = 'laser';
                break;
            case 'speed':
                this.player.speed = 8;
                setTimeout(() => { this.player.speed = 5; }, 5000);
                break;
        }
    }

    spawnUFO() {
        if (!this.ufo && Math.random() < 0.003) {
            this.ufo = {
                x: Math.random() < 0.5 ? -50 : this.width + 50,
                y: 40,
                width: 60,
                height: 30,
                direction: Math.random() < 0.5 ? 1 : -1,
                speed: 2
            };
        }
    }

    destroyEnemy(enemy) {
        enemy.alive = false;
        this.spawnExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color);
        this.combo++;
        this.score += enemy.points * this.combo;
        this.lastHitTime = Date.now();
        this.spawnPowerUp(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
    }

    spawnExplosion(x, y, color) {
        this.explosionAnimations.push({
            x, y,
            frame: 0,
            maxFrames: 20,
            color
        });

        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.03,
                size: 3 + Math.random() * 4,
                color
            });
        }
    }

    update() {
        const now = Date.now();
        if (now - this.lastUpdateTime < 16) return;
        this.lastUpdateTime = now;

        if (this.keys.left) {
            this.player.x = Math.max(0, this.player.x - this.player.speed);
        }
        if (this.keys.right) {
            this.player.x = Math.min(this.width - this.player.width, this.player.x + this.player.speed);
        }

        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.specialWeaponTimer > 0) this.specialWeaponTimer--;
        if (this.shieldTimer > 0) {
            this.shieldTimer--;
            if (this.shieldTimer <= 0) this.shield = false;
        }
        if (this.tripleShotTimer > 0) {
            this.tripleShotTimer--;
            if (this.tripleShotTimer <= 0) this.tripleShot = false;
        }

        if (now - this.lastHitTime > 2000) {
            this.combo = Math.max(0, this.combo - 1);
        }

        if (now - this.lastEnemyMoveTime > this.enemyMoveInterval) {
            this.lastEnemyMoveTime = now;
            this.moveEnemies();
        }

        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            bullet.y += bullet.speed;

            if (this.shield && this.checkCollision(bullet, { ...this.player, width: 60, height: 60 })) {
                this.enemyBullets.splice(i, 1);
                continue;
            }

            if (this.checkCollision(bullet, this.player)) {
                this.playerHit();
                this.enemyBullets.splice(i, 1);
                continue;
            }

            if (bullet.y > this.height) {
                this.enemyBullets.splice(i, 1);
            }
        }

        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const bullet = this.playerBullets[i];
            bullet.y -= bullet.speed;
            bullet.x += bullet.dx || 0;

            for (const barrier of this.barriers) {
                for (let j = barrier.blocks.length - 1; j >= 0; j--) {
                    const block = barrier.blocks[j];
                    if (bullet.x < barrier.x + block.x + block.width &&
                        bullet.x + bullet.width > barrier.x + block.x &&
                        bullet.y < barrier.y + block.y + block.height &&
                        bullet.y + bullet.height > barrier.y + block.y) {
                        block.health--;
                        if (block.health <= 0) {
                            barrier.blocks.splice(j, 1);
                        }
                        this.playerBullets.splice(i, 1);
                        break;
                    }
                }
            }

            if (this.boss) {
                if (bullet.x < this.boss.x + this.boss.width &&
                    bullet.x + bullet.width > this.boss.x &&
                    bullet.y < this.boss.y + this.boss.height &&
                    bullet.y + bullet.height > this.boss.y) {
                    this.boss.health -= bullet.isLaser ? 3 : 1;
                    this.playerBullets.splice(i, 1);

                    if (this.boss.health <= 0) {
                        this.spawnExplosion(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, '#ff0000');
                        this.score += 500;
                        this.boss = null;
                        this.levelComplete();
                    }
                    continue;
                }
            }

            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (!enemy.alive) continue;

                if (bullet.x < enemy.x + enemy.width &&
                    bullet.x + bullet.width > enemy.x &&
                    bullet.y < enemy.y + enemy.height &&
                    bullet.y + bullet.height > enemy.y) {
                    this.destroyEnemy(enemy);
                    this.enemies.splice(j, 1);
                    this.playerBullets.splice(i, 1);
                    break;
                }
            }

            if (this.ufo && bullet.x < this.ufo.x + this.ufo.width &&
                bullet.x + bullet.width > this.ufo.x &&
                bullet.y < this.ufo.y + this.ufo.height &&
                bullet.y + bullet.height > this.ufo.y) {
                this.spawnExplosion(this.ufo.x + this.ufo.width / 2, this.ufo.y + this.ufo.height / 2, '#ff00ff');
                this.score += 100;
                this.ufo = null;
                this.playerBullets.splice(i, 1);
            }

            if (bullet.y < -10) {
                this.playerBullets.splice(i, 1);
            }
        }

        if (this.ufo) {
            this.ufo.x += this.ufo.direction * this.ufo.speed;
            if (this.ufo.x < -100 || this.ufo.x > this.width + 100) {
                this.ufo = null;
            }
        }

        this.spawnUFO();

        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const pu = this.powerUps[i];
            pu.y += pu.vy;

            if (this.checkCollision(pu, this.player)) {
                this.applyPowerUp(pu.type);
                this.powerUps.splice(i, 1);
                continue;
            }

            if (pu.y > this.height) {
                this.powerUps.splice(i, 1);
            }
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (!enemy.alive) continue;

            if (Math.random() < 0.02) {
                this.enemyBullets.push({
                    x: enemy.x + enemy.width / 2 - 3,
                    y: enemy.y + enemy.height,
                    width: 6,
                    height: 12,
                    speed: 4 + this.level * 0.5
                });
            }
        }

        this.updateParticles();

        for (let i = this.explosionAnimations.length - 1; i >= 0; i--) {
            this.explosionAnimations[i].frame++;
            if (this.explosionAnimations[i].frame >= this.explosionAnimations[i].maxFrames) {
                this.explosionAnimations.splice(i, 1);
            }
        }

        if (this.screenShake > 0) this.screenShake--;

        if (this.enemies.filter(e => e.alive).length === 0) {
            if (this.level % 3 === 0 && !this.boss) {
                this.spawnBoss();
            } else {
                this.levelComplete();
            }
        }

        const lowestEnemy = Math.max(...this.enemies.filter(e => e.alive).map(e => e.y + e.height));
        if (lowestEnemy > this.player.y - 20) {
            this.playerHit();
        }
    }

    moveEnemies() {
        let shouldDescend = false;
        const aliveEnemies = this.enemies.filter(e => e.alive);

        for (const enemy of aliveEnemies) {
            enemy.x += this.enemyDirection * this.enemySpeed * 10;
            enemy.animFrame = (enemy.animFrame + 1) % 2;

            if (enemy.x <= 0 || enemy.x + enemy.width >= this.width) {
                shouldDescend = true;
            }
        }

        if (shouldDescend) {
            this.enemyDirection *= -1;
            for (const enemy of aliveEnemies) {
                enemy.y += 20;
            }
            this.enemySpeed = Math.min(this.enemySpeed + 0.1, 3);
            this.enemyMoveInterval = Math.max(200, this.enemyMoveInterval - 20);
        }
    }

    spawnBoss() {
        this.boss = {
            x: this.width / 2 - 75,
            y: 30,
            width: 150,
            height: 60,
            health: 50 + this.level * 10,
            maxHealth: 50 + this.level * 10,
            pattern: 'sine',
            patternTime: 0
        };
    }

    levelComplete() {
        this.level++;
        this.enemySpeed = 1 + this.level * 0.2;
        this.enemyMoveInterval = Math.max(400, 800 - this.level * 50);
        this.spawnEnemies();
        this.screenShake = 5;
    }

    playerHit() {
        this.lives--;
        this.screenShake = 15;
        this.spawnExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#ff6600');

        if (this.lives <= 0) {
            this.gameState = 'gameover';
            if (this.score > this.highScore) {
                this.highScore = this.score;
            }
        } else {
            this.shield = true;
            this.shieldTimer = 120;
        }
    }

    checkCollision(a, b) {
        return a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y;
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    gameLoop() {
        if (this.gameState !== 'playing') return;
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    render() {
        this.ctx.save();

        if (this.screenShake > 0) {
            this.ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
        }

        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#000033');
        gradient.addColorStop(1, '#000011');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        for (let i = 0; i < 100; i++) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`;
            this.ctx.fillRect(Math.random() * this.width, Math.random() * this.height, 1, 1);
        }

        for (const barrier of this.barriers) {
            this.ctx.fillStyle = '#00ff00';
            for (const block of barrier.blocks) {
                this.ctx.fillRect(barrier.x + block.x, barrier.y + block.y, block.width - 2, block.height - 2);
            }
        }

        if (this.boss) {
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(this.boss.x, this.boss.y, this.boss.width, this.boss.height);
            this.ctx.fillStyle = '#880000';
            this.ctx.fillRect(this.boss.x + 5, this.boss.y + 5, this.boss.width - 10, 10);

            const healthPercent = this.boss.health / this.boss.maxHealth;
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillRect(this.boss.x, this.boss.y - 15, this.boss.width * healthPercent, 10);
        }

        for (const enemy of this.enemies) {
            if (!enemy.alive) continue;

            this.ctx.fillStyle = enemy.color;
            this.ctx.fillRect(enemy.x + 5, enemy.y + 5, enemy.width - 10, enemy.height - 10);

            if (enemy.animFrame === 0) {
                this.ctx.fillRect(enemy.x, enemy.y + 10, 5, enemy.height - 10);
                this.ctx.fillRect(enemy.x + enemy.width - 5, enemy.y + 10, 5, enemy.height - 10);
            } else {
                this.ctx.fillRect(enemy.x, enemy.y + 10, 5, enemy.height - 15);
                this.ctx.fillRect(enemy.x + enemy.width - 5, enemy.y + 10, 5, enemy.height - 15);
            }

            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(enemy.x + 10, enemy.y + 10, 5, 5);
            this.ctx.fillRect(enemy.x + enemy.width - 15, enemy.y + 10, 5, 5);
        }

        if (this.ufo) {
            this.ctx.fillStyle = '#ff00ff';
            this.ctx.beginPath();
            this.ctx.ellipse(this.ufo.x + this.ufo.width / 2, this.ufo.y + this.ufo.height / 2, this.ufo.width / 2, this.ufo.height / 2, 0, 0, Math.PI * 2);
            this.ctx.fill();

            const glow = this.ctx.createRadialGradient(
                this.ufo.x + this.ufo.width / 2, this.ufo.y + this.ufo.height / 2, 0,
                this.ufo.x + this.ufo.width / 2, this.ufo.y + this.ufo.height / 2, this.ufo.width / 2
            );
            glow.addColorStop(0, 'rgba(255, 0, 255, 0.3)');
            glow.addColorStop(1, 'transparent');
            this.ctx.fillStyle = glow;
            this.ctx.fillRect(this.ufo.x - 10, this.ufo.y - 10, this.ufo.width + 20, this.ufo.height + 20);
        }

        for (const bullet of this.enemyBullets) {
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            this.ctx.fillStyle = '#ff6666';
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, 3);
        }

        for (const bullet of this.playerBullets) {
            if (bullet.isLaser) {
                this.ctx.fillStyle = '#00ffff';
                this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

                const glow = this.ctx.createLinearGradient(bullet.x, 0, bullet.x + bullet.width, 0);
                glow.addColorStop(0, 'rgba(0, 255, 255, 0.5)');
                glow.addColorStop(0.5, 'rgba(0, 255, 255, 0.8)');
                glow.addColorStop(1, 'rgba(0, 255, 255, 0.5)');
                this.ctx.fillStyle = glow;
                this.ctx.fillRect(bullet.x - 5, bullet.y, bullet.width + 10, bullet.height);
            } else {
                this.ctx.fillStyle = '#00ff00';
                this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            }
        }

        for (const pu of this.powerUps) {
            this.ctx.save();
            this.ctx.translate(pu.x + pu.width / 2, pu.y + pu.height / 2);
            this.ctx.rotate(Date.now() / 200);

            this.ctx.fillStyle = pu.type === 'shield' ? '#00ffff' :
                pu.type === 'triple' ? '#ffff00' :
                    pu.type === 'bomb' ? '#ff0000' :
                        pu.type === 'laser' ? '#ff00ff' : '#00ff00';
            this.ctx.fillRect(-pu.width / 2, -pu.height / 2, pu.width, pu.height);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            const icons = { shield: 'S', triple: 'T', bomb: 'B', laser: 'L', speed: '↑' };
            this.ctx.fillText(icons[pu.type], 0, 0);
            this.ctx.restore();
        }

        if (this.shield) {
            this.ctx.beginPath();
            this.ctx.arc(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 35, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 + Math.sin(Date.now() / 100) * 0.3})`;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }

        this.ctx.fillStyle = '#3498db';
        this.ctx.fillRect(this.player.x, this.player.y + 10, this.player.width, this.player.height - 10);
        this.ctx.fillRect(this.player.x + 20, this.player.y, 10, 15);

        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(this.player.x + 5, this.player.y + 15, 10, 5);
        this.ctx.fillRect(this.player.x + this.player.width - 15, this.player.y + 15, 10, 5);

        for (const exp of this.explosionAnimations) {
            const progress = exp.frame / exp.maxFrames;
            const radius = 30 * progress;
            this.ctx.beginPath();
            this.ctx.arc(exp.x, exp.y, radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = exp.color;
            this.ctx.lineWidth = 3 * (1 - progress);
            this.ctx.stroke();
        }

        for (const p of this.particles) {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, 45);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 28);
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`High: ${this.highScore}`, 200, 28);

        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Level ${this.level}`, this.width / 2, 28);

        for (let i = 0; i < this.lives; i++) {
            this.ctx.fillStyle = '#3498db';
            this.ctx.fillRect(this.width - 100 + i * 30, 10, 20, 15);
        }

        if (this.combo > 1) {
            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Combo x${this.combo}`, this.width / 2, 42);
        }

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('SPACE INVADERS II', this.width / 2, this.height / 2 - 80);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Arrow Keys or A/D to move', this.width / 2, this.height / 2 - 20);
            this.ctx.fillText('SPACE to shoot', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('SHIFT to use special weapon', this.width / 2, this.height / 2 + 40);

            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '22px Arial';
            this.ctx.fillText('Click or Press SPACE to Start', this.width / 2, this.height / 2 + 100);
        }

        if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 50);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2);
            this.ctx.fillText(`Level Reached: ${this.level}`, this.width / 2, this.height / 2 + 35);

            if (this.score >= this.highScore) {
                this.ctx.fillStyle = '#ffd700';
                this.ctx.fillText('NEW HIGH SCORE!', this.width / 2, this.height / 2 + 70);
            }

            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Click or Press SPACE to Restart', this.width / 2, this.height / 2 + 120);
        }

        this.ctx.restore();
    }
}

window.SpaceInvaders2Game = SpaceInvaders2Game;
