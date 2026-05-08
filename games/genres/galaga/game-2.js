class Galaga2Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 600;
        this.height = 800;
        this.player = null;
        this.enemies = [];
        this.enemyFormations = [];
        this.currentFormation = 0;
        this.playerBullets = [];
        this.enemyBullets = [];
        this.particles = [];
        this.powerUps = [];
        this.score = 0;
        this.highScore = 0;
        this.lives = 3;
        this.level = 1;
        this.gameState = 'start';
        this.shootCooldown = 0;
        this.enemyShootTimer = 0;
        this.formationPhase = 0;
        this.formationAngle = 0;
        this.screenShake = 0;
        this.combo = 0;
        this.lastHitTime = 0;
        this.boss = null;
        this.bossHealth = 0;
        this.bossPhase = 0;
        this.dualShot = false;
        this.dualShotTimer = 0;
        this.shield = false;
        this.shieldTimer = 0;
        this.tractorBeam = null;
        this.stars = [];
        this.trailParticles = [];
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.generateStars();
        this.canvas.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.canvas.addEventListener('keyup', (e) => this.handleKeyUp(e));
        this.keys = {};
        this.canvas.setAttribute('tabindex', '0');
        this.canvas.focus();
    }

    generateStars() {
        for (let i = 0; i < 150; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 2 + 0.5,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }

    handleKeyDown(e) {
        if (this.gameState === 'start' || this.gameState === 'gameover') {
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
            x: this.width / 2 - 20,
            y: this.height - 80,
            width: 40,
            height: 30,
            speed: 6
        };
        this.enemies = [];
        this.playerBullets = [];
        this.enemyBullets = [];
        this.particles = [];
        this.powerUps = [];
        this.trailParticles = [];
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.shootCooldown = 0;
        this.enemyShootTimer = 0;
        this.formationPhase = 0;
        this.formationAngle = 0;
        this.screenShake = 0;
        this.combo = 0;
        this.boss = null;
        this.dualShot = false;
        this.dualShotTimer = 0;
        this.shield = false;
        this.shieldTimer = 0;
        this.tractorBeam = null;

        this.spawnFormation();
        this.gameState = 'playing';
        this.lastUpdateTime = Date.now();
        this.gameLoop();
    }

    spawnFormation() {
        this.enemies = [];
        const formations = [
            this.createBeeFormation(),
            this.createButterflyFormation(),
            this.createVFormation(),
            this.createZigzagFormation(),
            this.createCircleFormation()
        ];

        const formation = formations[this.level % formations.length];

        for (let i = 0; i < formation.length; i++) {
            const e = formation[i];
            this.enemies.push({
                x: e.x,
                y: e.y,
                baseX: e.x,
                baseY: e.y,
                width: 35,
                height: 25,
                type: e.type,
                points: e.type === 'boss' ? 100 : e.type === 'butterfly' ? 50 : 30,
                state: 'entering',
                enterProgress: 0,
                diveProgress: 0,
                diveTarget: null,
                alive: true,
                color: e.type === 'boss' ? '#ff0000' : e.type === 'butterfly' ? '#ff00ff' : '#00ff00',
                animFrame: 0
            });
        }

        this.currentFormation = (this.currentFormation + 1) % formations.length;
    }

    createBeeFormation() {
        const enemies = [];
        const startY = -50;
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 8; col++) {
                enemies.push({
                    x: 100 + col * 50,
                    y: startY + row * 30,
                    type: 'bee'
                });
            }
        }
        return enemies;
    }

    createButterflyFormation() {
        const enemies = [];
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const radius = 150;
            enemies.push({
                x: this.width / 2 + Math.cos(angle) * radius,
                y: -50 + Math.sin(angle) * radius * 0.5,
                type: 'butterfly'
            });
        }
        return enemies;
    }

    createVFormation() {
        const enemies = [];
        for (let i = 0; i < 24; i++) {
            const row = Math.floor(i / 2);
            const side = i % 2 === 0 ? -1 : 1;
            enemies.push({
                x: this.width / 2 + side * (row * 40 + 20),
                y: -50 + row * 35,
                type: 'bee'
            });
        }
        return enemies;
    }

    createZigzagFormation() {
        const enemies = [];
        for (let i = 0; i < 30; i++) {
            enemies.push({
                x: 50 + (i % 10) * 50,
                y: -50 + Math.floor(i / 10) * 40 + (i % 2) * 20,
                type: 'butterfly'
            });
        }
        return enemies;
    }

    createCircleFormation() {
        const enemies = [];
        for (let i = 0; i < 32; i++) {
            const angle = (i / 32) * Math.PI * 2;
            enemies.push({
                x: this.width / 2 + Math.cos(angle) * 180,
                y: -100 + Math.sin(angle) * 180,
                type: 'bee'
            });
        }
        enemies.push({
            x: this.width / 2,
            y: -150,
            type: 'boss'
        });
        return enemies;
    }

    shoot() {
        if (this.shootCooldown > 0) return;
        this.shootCooldown = 10;

        const bulletX = this.player.x + this.player.width / 2 - 2;

        this.playerBullets.push({
            x: bulletX,
            y: this.player.y,
            width: 4,
            height: 12,
            speed: 12
        });

        if (this.dualShot) {
            this.playerBullets.push({
                x: bulletX - 15,
                y: this.player.y + 10,
                width: 4,
                height: 12,
                speed: 12
            });
            this.playerBullets.push({
                x: bulletX + 15,
                y: this.player.y + 10,
                width: 4,
                height: 12,
                speed: 12
            });
        }
    }

    spawnPowerUp(x, y) {
        if (Math.random() < 0.03) {
            const types = ['dual', 'shield', 'slow'];
            this.powerUps.push({
                x, y,
                width: 25,
                height: 25,
                type: types[Math.floor(Math.random() * types.length)],
                vy: 1.5,
                rotation: 0
            });
        }
    }

    applyPowerUp(type) {
        switch (type) {
            case 'dual':
                this.dualShot = true;
                this.dualShotTimer = 400;
                break;
            case 'shield':
                this.shield = true;
                this.shieldTimer = 300;
                break;
            case 'slow':
                this.enemyShootTimer *= 2;
                setTimeout(() => { this.enemyShootTimer /= 2; }, 5000);
                break;
        }
    }

    update() {
        const now = Date.now();
        if (now - this.lastUpdateTime < 16) return;
        this.lastUpdateTime = now;

        for (const star of this.stars) {
            star.y += star.speed;
            star.twinkle += 0.05;
            if (star.y > this.height) {
                star.y = 0;
                star.x = Math.random() * this.width;
            }
        }

        if (this.keys.left) {
            this.player.x = Math.max(0, this.player.x - this.player.speed);
        }
        if (this.keys.right) {
            this.player.x = Math.min(this.width - this.player.width, this.player.x + this.player.speed);
        }

        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.dualShotTimer > 0) {
            this.dualShotTimer--;
            if (this.dualShotTimer <= 0) this.dualShot = false;
        }
        if (this.shieldTimer > 0) {
            this.shieldTimer--;
            if (this.shieldTimer <= 0) this.shield = false;
        }

        this.formationPhase += 0.02;
        this.formationAngle += 0.01;

        for (const enemy of this.enemies) {
            if (!enemy.alive) continue;

            if (enemy.state === 'entering') {
                enemy.enterProgress += 0.02;
                enemy.y = -50 + (enemy.baseY + 50) * Math.min(enemy.enterProgress, 1);

                if (enemy.enterProgress >= 1) {
                    enemy.state = 'formation';
                }
            } else if (enemy.state === 'formation') {
                const wobble = Math.sin(this.formationAngle + enemy.baseX * 0.01) * 20;
                enemy.x = enemy.baseX + wobble;
                enemy.y = enemy.baseY + Math.sin(this.formationPhase + enemy.baseY * 0.01) * 15;

                if (Math.random() < 0.001 * this.level) {
                    enemy.state = 'diving';
                    enemy.diveProgress = 0;
                    enemy.diveTarget = { x: this.player.x, y: this.player.y };
                }
            } else if (enemy.state === 'diving') {
                enemy.diveProgress += 0.02;
                const t = enemy.diveProgress;

                if (t < 0.3) {
                    const diveAngle = t / 0.3 * Math.PI;
                    enemy.x = enemy.baseX + Math.cos(diveAngle) * 100;
                    enemy.y = enemy.baseY + Math.sin(diveAngle) * 80;
                } else if (t < 0.7) {
                    const diveAngle = (t - 0.3) / 0.4 * Math.PI * 2;
                    enemy.x = enemy.baseX + 100 + Math.cos(diveAngle - Math.PI) * (enemy.baseX - this.player.x);
                    enemy.y = enemy.baseY + 80 + (t - 0.3) * 400;
                } else {
                    enemy.state = 'returning';
                    enemy.diveProgress = 0;
                }

                if (enemy.y > this.height + 50) {
                    enemy.state = 'returning';
                }
            } else if (enemy.state === 'returning') {
                enemy.diveProgress += 0.03;
                const t = Math.min(enemy.diveProgress, 1);
                enemy.x = enemy.baseX + (this.player.x - enemy.baseX) * t;
                enemy.y = enemy.baseY * (1 - t);

                if (t >= 1) {
                    enemy.state = 'formation';
                }
            }

            enemy.animFrame = (enemy.animFrame + 1) % 10;
        }

        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const bullet = this.playerBullets[i];
            bullet.y -= bullet.speed;

            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (!enemy.alive) continue;

                if (bullet.x < enemy.x + enemy.width &&
                    bullet.x + bullet.width > enemy.x &&
                    bullet.y < enemy.y + enemy.height &&
                    bullet.y + bullet.height > enemy.y) {
                    enemy.alive = false;
                    this.playerBullets.splice(i, 1);
                    this.destroyEnemy(enemy);
                    break;
                }
            }

            if (bullet.y < -20) {
                this.playerBullets.splice(i, 1);
            }
        }

        this.enemyShootTimer++;
        if (this.enemyShootTimer > 60 - this.level * 5) {
            this.enemyShootTimer = 0;
            const aliveEnemies = this.enemies.filter(e => e.alive && e.state !== 'entering');
            if (aliveEnemies.length > 0) {
                const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
                this.enemyBullets.push({
                    x: shooter.x + shooter.width / 2 - 3,
                    y: shooter.y + shooter.height,
                    width: 6,
                    height: 10,
                    speed: 4 + this.level * 0.5,
                    targetX: this.player.x + this.player.width / 2,
                    targetY: this.player.y,
                    type: shooter.type === 'boss' ? 'homing' : 'straight'
                });
            }
        }

        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            bullet.y += bullet.speed;

            if (bullet.type === 'homing') {
                const dx = this.player.x + this.player.width / 2 - bullet.x;
                const dy = this.player.y - bullet.y;
                const angle = Math.atan2(dy, dx);
                bullet.x += Math.cos(angle) * 2;
                bullet.y += Math.sin(angle) * 2;
            }

            if (this.checkCollision(bullet, this.player)) {
                if (!this.shield) {
                    this.playerHit();
                }
                this.enemyBullets.splice(i, 1);
                continue;
            }

            if (bullet.y > this.height) {
                this.enemyBullets.splice(i, 1);
            }
        }

        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const pu = this.powerUps[i];
            pu.y += pu.vy;
            pu.rotation += 0.1;

            if (this.checkCollision(pu, this.player)) {
                this.applyPowerUp(pu.type);
                this.powerUps.splice(i, 1);
                continue;
            }

            if (pu.y > this.height) {
                this.powerUps.splice(i, 1);
            }
        }

        this.updateParticles();
        this.updateTrailParticles();

        if (this.screenShake > 0) this.screenShake--;

        if (this.enemies.filter(e => e.alive).length === 0) {
            this.levelComplete();
        }
    }

    destroyEnemy(enemy) {
        this.spawnExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color);
        this.combo++;
        this.score += enemy.points * this.combo;
        this.lastHitTime = Date.now();
        this.spawnPowerUp(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
    }

    spawnExplosion(x, y, color) {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.025,
                size: 3 + Math.random() * 4,
                color
            });
        }
    }

    spawnTrailParticle(x, y, color) {
        this.trailParticles.push({
            x, y,
            life: 1,
            decay: 0.05,
            size: 8,
            color
        });
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

    updateTrailParticles() {
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            this.trailParticles[i].life -= this.trailParticles[i].decay;
            if (this.trailParticles[i].life <= 0) {
                this.trailParticles.splice(i, 1);
            }
        }
    }

    playerHit() {
        this.lives--;
        this.screenShake = 20;
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

    levelComplete() {
        this.level++;
        this.screenShake = 10;
        setTimeout(() => this.spawnFormation(), 1000);
    }

    checkCollision(a, b) {
        return a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y;
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
        gradient.addColorStop(0, '#000022');
        gradient.addColorStop(1, '#000044');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        for (const star of this.stars) {
            const alpha = 0.3 + Math.sin(star.twinkle) * 0.3 + 0.3;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        for (const t of this.trailParticles) {
            this.ctx.globalAlpha = t.life;
            this.ctx.fillStyle = t.color;
            this.ctx.beginPath();
            this.ctx.arc(t.x, t.y, t.size * t.life, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;

        for (const enemy of this.enemies) {
            if (!enemy.alive) continue;

            this.ctx.save();
            this.ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);

            if (enemy.type === 'boss') {
                this.ctx.fillStyle = enemy.color;
                this.ctx.beginPath();
                this.ctx.moveTo(-enemy.width / 2, 0);
                this.ctx.lineTo(-enemy.width / 4, -enemy.height / 2);
                this.ctx.lineTo(enemy.width / 4, -enemy.height / 2);
                this.ctx.lineTo(enemy.width / 2, 0);
                this.ctx.lineTo(enemy.width / 4, enemy.height / 2);
                this.ctx.lineTo(-enemy.width / 4, enemy.height / 2);
                this.ctx.closePath();
                this.ctx.fill();

                this.ctx.fillStyle = '#ffff00';
                this.ctx.fillRect(-10, -5, 20, 5);
            } else if (enemy.type === 'butterfly') {
                const wingAngle = Math.sin(enemy.animFrame * 0.3) * 0.3;

                this.ctx.fillStyle = enemy.color;
                this.ctx.save();
                this.ctx.rotate(wingAngle);
                this.ctx.fillRect(-enemy.width / 2, -5, enemy.width / 2, 15);
                this.ctx.restore();
                this.ctx.save();
                this.ctx.rotate(-wingAngle);
                this.ctx.fillRect(0, -5, enemy.width / 2, 15);
                this.ctx.restore();

                this.ctx.fillStyle = '#fff';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 5, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                const wingAngle = Math.sin(enemy.animFrame * 0.5) * 0.4;

                this.ctx.fillStyle = enemy.color;
                this.ctx.save();
                this.ctx.rotate(wingAngle);
                this.ctx.fillRect(-enemy.width / 2, -3, enemy.width / 2, 10);
                this.ctx.restore();
                this.ctx.save();
                this.ctx.rotate(-wingAngle);
                this.ctx.fillRect(0, -3, enemy.width / 2, 10);
                this.ctx.restore();

                this.ctx.fillStyle = '#fff';
                this.ctx.fillRect(-5, -5, 4, 4);
                this.ctx.fillRect(1, -5, 4, 4);
            }

            this.ctx.restore();
        }

        for (const bullet of this.enemyBullets) {
            if (bullet.type === 'homing') {
                this.ctx.fillStyle = '#ff00ff';
            } else {
                this.ctx.fillStyle = '#ff4444';
            }
            this.ctx.beginPath();
            this.ctx.moveTo(bullet.x + bullet.width / 2, bullet.y);
            this.ctx.lineTo(bullet.x, bullet.y + bullet.height);
            this.ctx.lineTo(bullet.x + bullet.width, bullet.y + bullet.height);
            this.ctx.closePath();
            this.ctx.fill();
        }

        for (const bullet of this.playerBullets) {
            this.ctx.fillStyle = '#00ffff';
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

            const glow = this.ctx.createLinearGradient(bullet.x, 0, bullet.x + bullet.width, 0);
            glow.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
            glow.addColorStop(0.5, 'rgba(0, 255, 255, 0.6)');
            glow.addColorStop(1, 'rgba(0, 255, 255, 0.3)');
            this.ctx.fillStyle = glow;
            this.ctx.fillRect(bullet.x - 3, bullet.y, bullet.width + 6, bullet.height);
        }

        for (const pu of this.powerUps) {
            this.ctx.save();
            this.ctx.translate(pu.x + pu.width / 2, pu.y + pu.height / 2);
            this.ctx.rotate(pu.rotation);

            this.ctx.fillStyle = pu.type === 'dual' ? '#00ffff' :
                pu.type === 'shield' ? '#ffff00' : '#ff00ff';
            this.ctx.fillRect(-pu.width / 2, -pu.height / 2, pu.width, pu.height);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            const icons = { dual: 'D', shield: 'S', slow: '↓' };
            this.ctx.fillText(icons[pu.type], 0, 0);
            this.ctx.restore();
        }

        for (const p of this.particles) {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }

        if (this.shield) {
            this.ctx.beginPath();
            this.ctx.arc(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 30, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255, 255, 0, ${0.5 + Math.sin(Date.now() / 100) * 0.3})`;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }

        this.ctx.fillStyle = '#3498db';
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x + this.player.width / 2, this.player.y);
        this.ctx.lineTo(this.player.x, this.player.y + this.player.height);
        this.ctx.lineTo(this.player.x + this.player.width, this.player.y + this.player.height);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = '#2980b9';
        this.ctx.fillRect(this.player.x + 5, this.player.y + 15, this.player.width - 10, 5);

        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(this.player.x + 8, this.player.y + 5, 6, 4);
        this.ctx.fillRect(this.player.x + this.player.width - 14, this.player.y + 5, 6, 4);

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, 40);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 15, 26);

        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Level ${this.level}`, this.width / 2, 26);

        this.ctx.textAlign = 'right';
        this.ctx.fillText(`High: ${this.highScore}`, this.width - 15, 26);

        for (let i = 0; i < this.lives; i++) {
            this.ctx.fillStyle = '#3498db';
            this.ctx.beginPath();
            this.ctx.moveTo(this.width - 80 + i * 25, 20);
            this.ctx.lineTo(this.width - 90 + i * 25, 35);
            this.ctx.lineTo(this.width - 70 + i * 25, 35);
            this.ctx.closePath();
            this.ctx.fill();
        }

        if (this.combo > 1) {
            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Combo x${this.combo}`, this.width / 2, 38);
        }

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = 'bold 42px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GALAGA II', this.width / 2, this.height / 2 - 80);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Arrow Keys or A/D to move', this.width / 2, this.height / 2 - 20);
            this.ctx.fillText('SPACE to shoot', this.width / 2, this.height / 2 + 10);

            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Click or Press SPACE to Start', this.width / 2, this.height / 2 + 80);
        }

        if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = 'bold 42px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 50);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '22px Arial';
            this.ctx.fillText(`Score: ${this.score}`, this.width / 2, this.height / 2);

            if (this.score >= this.highScore) {
                this.ctx.fillStyle = '#ffd700';
                this.ctx.fillText('NEW HIGH SCORE!', this.width / 2, this.height / 2 + 35);
            }

            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Click or Press SPACE to Restart', this.width / 2, this.height / 2 + 90);
        }

        this.ctx.restore();
    }
}

window.Galaga2Game = Galaga2Game;
