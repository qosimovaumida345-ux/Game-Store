class Tank2Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.player = null;
        this.enemies = [];
        this.walls = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.particles = [];
        this.powerUps = [];
        this.score = 0;
        this.highScore = 0;
        this.level = 1;
        this.lives = 3;
        this.gameState = 'start';
        this.keys = {};
        this.screenShake = 0;
        this.minimap = null;
        this.explosions = [];
        this.turrets = [];
        this.healthPacks = [];
        this.shieldTimer = 0;
        this.rapidFire = false;
        this.rapidFireTimer = 0;
        this.shootCooldown = 0;
        this.aiDifficulty = 1;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.setupControls();
        this.canvas.setAttribute('tabindex', '0');
        this.canvas.focus();
    }

    setupControls() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            shoot: false
        };

        this.canvas.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.canvas.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    handleKeyDown(e) {
        if (this.gameState === 'start' || this.gameState === 'gameover') {
            this.start();
            return;
        }

        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.keys.up = true;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.keys.down = true;
                break;
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
                this.keys.shoot = true;
                break;
        }
    }

    handleKeyUp(e) {
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.keys.up = false;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.keys.down = false;
                break;
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
            case ' ':
                this.keys.shoot = false;
                break;
        }
    }

    start() {
        this.player = {
            x: 100,
            y: this.height / 2,
            width: 40,
            height: 50,
            speed: 4,
            angle: 0,
            health: 100,
            maxHealth: 100,
            ammo: 30,
            maxAmmo: 30,
            reloadTimer: 0
        };
        this.enemies = [];
        this.walls = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.particles = [];
        this.powerUps = [];
        this.explosions = [];
        this.turrets = [];
        this.healthPacks = [];
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.shieldTimer = 0;
        this.rapidFire = false;
        this.rapidFireTimer = 0;
        this.shootCooldown = 0;
        this.aiDifficulty = 1;

        this.generateMap();
        this.spawnEnemies();
        this.gameState = 'playing';
        this.lastUpdateTime = Date.now();
        this.gameLoop();
    }

    generateMap() {
        this.walls = [];
        const wallCount = 10 + this.level * 3;

        for (let i = 0; i < wallCount; i++) {
            const isHorizontal = Math.random() < 0.5;
            this.walls.push({
                x: Math.random() * (this.width - 100) + 50,
                y: Math.random() * (this.height - 200) + 100,
                width: isHorizontal ? 60 + Math.random() * 40 : 20,
                height: isHorizontal ? 20 : 60 + Math.random() * 40,
                destructible: Math.random() < 0.3,
                health: Math.random() < 0.3 ? 3 : 999
            });
        }

        for (let i = 0; i < 3; i++) {
            this.turrets.push({
                x: 150 + Math.random() * (this.width - 300),
                y: 150 + Math.random() * (this.height - 300),
                angle: Math.random() * Math.PI * 2,
                shootTimer: 0,
                health: 50
            });
        }
    }

    spawnEnemies() {
        const enemyCount = 2 + this.level;

        for (let i = 0; i < enemyCount; i++) {
            let x, y;
            do {
                x = 400 + Math.random() * (this.width - 450);
                y = 50 + Math.random() * (this.height - 100);
            } while (this.checkWallCollision(x, y, 40, 50));

            this.enemies.push({
                x, y,
                width: 40,
                height: 50,
                speed: 1 + this.level * 0.2,
                angle: Math.PI,
                health: 50 + this.level * 10,
                maxHealth: 50 + this.level * 10,
                shootTimer: Math.random() * 100,
                type: Math.random() < 0.3 ? 'fast' : 'normal',
                aiState: 'patrol',
                patrolTarget: { x, y },
                stunnedTimer: 0
            });
        }
    }

    checkWallCollision(x, y, width, height) {
        for (const wall of this.walls) {
            if (x < wall.x + wall.width &&
                x + width > wall.x &&
                y < wall.y + wall.height &&
                y + height > wall.y) {
                return true;
            }
        }
        return false;
    }

    update() {
        const now = Date.now();
        if (now - this.lastUpdateTime < 16) return;
        this.lastUpdateTime = now;

        this.updatePlayer();
        this.updateEnemies();
        this.updateBullets();
        this.updateTurrets();
        this.updateParticles();
        this.updatePowerUps();
        this.updateExplosions();

        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.shieldTimer > 0) this.shieldTimer--;
        if (this.rapidFireTimer > 0) {
            this.rapidFireTimer--;
            if (this.rapidFireTimer <= 0) this.rapidFire = false;
        }

        if (this.enemies.length === 0) {
            this.levelComplete();
        }

        if (this.screenShake > 0) this.screenShake--;

        if (this.player.health <= 0) {
            this.playerHit();
        }
    }

    updatePlayer() {
        if (this.keys.up) {
            this.player.y -= this.player.speed;
            this.player.angle = 0;
        }
        if (this.keys.down) {
            this.player.y += this.player.speed;
            this.player.angle = Math.PI;
        }
        if (this.keys.left) {
            this.player.x -= this.player.speed;
            this.player.angle = -Math.PI / 2;
        }
        if (this.keys.right) {
            this.player.x += this.player.speed;
            this.player.angle = Math.PI / 2;
        }

        this.player.x = Math.max(20, Math.min(this.width - 60, this.player.x));
        this.player.y = Math.max(60, Math.min(this.height - 70, this.player.y));

        for (const wall of this.walls) {
            if (this.checkCollision(this.player, wall)) {
                if (this.keys.up) this.player.y += this.player.speed;
                if (this.keys.down) this.player.y -= this.player.speed;
                if (this.keys.left) this.player.x += this.player.speed;
                if (this.keys.right) this.player.x -= this.player.speed;
            }
        }

        if (this.keys.shoot && this.shootCooldown <= 0 && this.player.ammo > 0) {
            this.playerShoot();
        }

        if (this.player.reloadTimer > 0) {
            this.player.reloadTimer--;
            if (this.player.reloadTimer <= 0) {
                this.player.ammo = this.player.maxAmmo;
            }
        }
    }

    playerShoot() {
        const cooldown = this.rapidFire ? 5 : 15;
        this.shootCooldown = cooldown;
        this.player.ammo--;

        const speed = 10;
        this.bullets.push({
            x: this.player.x + 20,
            y: this.player.y + 25,
            vx: Math.cos(this.player.angle - Math.PI / 2) * speed,
            vy: Math.sin(this.player.angle - Math.PI / 2) * speed,
            radius: 5,
            damage: 25
        });

        this.spawnParticles(this.player.x + 20, this.player.y + 25, '#ffff00', 3);

        if (this.player.ammo <= 0) {
            this.player.reloadTimer = 60;
        }
    }

    updateEnemies() {
        for (const enemy of this.enemies) {
            if (enemy.stunnedTimer > 0) {
                enemy.stunnedTimer--;
                continue;
            }

            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = enemy.type === 'fast' ? enemy.speed * 1.5 : enemy.speed;

            if (dist < 300) {
                enemy.aiState = 'chase';
            } else if (dist > 400) {
                enemy.aiState = 'patrol';
            }

            if (enemy.aiState === 'chase') {
                const targetAngle = Math.atan2(dy, dx);
                enemy.angle = targetAngle;

                let newX = enemy.x + Math.cos(targetAngle) * speed;
                let newY = enemy.y + Math.sin(targetAngle) * speed;

                if (!this.checkWallCollision(newX, enemy.y, enemy.width, enemy.height)) {
                    enemy.x = newX;
                }
                if (!this.checkWallCollision(enemy.x, newY, enemy.width, enemy.height)) {
                    enemy.y = newY;
                }

                enemy.shootTimer++;
                if (enemy.shootTimer > 80 - this.level * 5) {
                    enemy.shootTimer = 0;
                    this.enemyShoot(enemy);
                }
            } else if (enemy.aiState === 'patrol') {
                const dx = enemy.patrolTarget.x - enemy.x;
                const dy = enemy.patrolTarget.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 20) {
                    enemy.patrolTarget = {
                        x: 100 + Math.random() * (this.width - 200),
                        y: 100 + Math.random() * (this.height - 200)
                    };
                } else {
                    enemy.x += (dx / dist) * speed * 0.5;
                    enemy.y += (dy / dist) * speed * 0.5;
                }
            }
        }
    }

    enemyShoot(enemy) {
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const angle = Math.atan2(dy, dx);

        this.enemyBullets.push({
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height / 2,
            vx: Math.cos(angle) * 5,
            vy: Math.sin(angle) * 5,
            radius: 6,
            damage: 10
        });
    }

    updateTurrets() {
        for (const turret of this.turrets) {
            const dx = this.player.x - turret.x;
            const dy = this.player.y - turret.y;
            turret.angle = Math.atan2(dy, dx);

            turret.shootTimer++;
            if (turret.shootTimer > 100) {
                turret.shootTimer = 0;
                this.enemyBullets.push({
                    x: turret.x,
                    y: turret.y,
                    vx: Math.cos(turret.angle) * 4,
                    vy: Math.sin(turret.angle) * 4,
                    radius: 8,
                    damage: 15
                });
            }
        }
    }

    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;

            if (bullet.x < 0 || bullet.x > this.width || bullet.y < 0 || bullet.y > this.height) {
                this.bullets.splice(i, 1);
                continue;
            }

            for (const wall of this.walls) {
                if (bullet.x > wall.x && bullet.x < wall.x + wall.width &&
                    bullet.y > wall.y && bullet.y < wall.y + wall.height) {
                    if (wall.destructible) {
                        wall.health--;
                        if (wall.health <= 0) {
                            this.walls.splice(this.walls.indexOf(wall), 1);
                            this.score += 10;
                        }
                    }
                    this.bullets.splice(i, 1);
                    break;
                }
            }

            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (bullet.x > enemy.x && bullet.x < enemy.x + enemy.width &&
                    bullet.y > enemy.y && bullet.y < enemy.y + enemy.height) {
                    enemy.health -= bullet.damage;
                    this.bullets.splice(i, 1);

                    if (enemy.health <= 0) {
                        this.destroyEnemy(enemy);
                        this.enemies.splice(j, 1);
                    }
                    break;
                }
            }

            for (let j = this.turrets.length - 1; j >= 0; j--) {
                const turret = this.turrets[j];
                const dx = bullet.x - turret.x;
                const dy = bullet.y - turret.y;
                if (Math.sqrt(dx * dx + dy * dy) < 20) {
                    turret.health -= bullet.damage;
                    this.bullets.splice(i, 1);

                    if (turret.health <= 0) {
                        this.turrets.splice(j, 1);
                        this.score += 30;
                    }
                    break;
                }
            }
        }

        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;

            if (bullet.x < 0 || bullet.x > this.width || bullet.y < 0 || bullet.y > this.height) {
                this.enemyBullets.splice(i, 1);
                continue;
            }

            if (bullet.x > this.player.x && bullet.x < this.player.x + this.player.width &&
                bullet.y > this.player.y && bullet.y < this.player.y + this.player.height) {
                if (this.shieldTimer <= 0) {
                    this.player.health -= bullet.damage;
                }
                this.enemyBullets.splice(i, 1);
                this.screenShake = 5;
            }

            for (const wall of this.walls) {
                if (bullet.x > wall.x && bullet.x < wall.x + wall.width &&
                    bullet.y > wall.y && bullet.y < wall.y + wall.height) {
                    this.enemyBullets.splice(i, 1);
                    break;
                }
            }
        }
    }

    updatePowerUps() {
        if (Math.random() < 0.005) {
            const types = ['health', 'ammo', 'shield', 'rapid'];
            this.powerUps.push({
                x: 50 + Math.random() * (this.width - 100),
                y: 50 + Math.random() * (this.height - 100),
                width: 25,
                height: 25,
                type: types[Math.floor(Math.random() * types.length)],
                vy: 0.5,
                rotation: 0
            });
        }

        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const pu = this.powerUps[i];
            pu.rotation += 0.05;

            if (this.checkCollision(this.player, pu)) {
                this.applyPowerUp(pu.type);
                this.powerUps.splice(i, 1);
                continue;
            }

            if (pu.y > this.height) {
                this.powerUps.splice(i, 1);
            }
        }
    }

    applyPowerUp(type) {
        switch (type) {
            case 'health':
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 30);
                this.spawnParticles(this.player.x + 20, this.player.y + 25, '#00ff00', 10);
                break;
            case 'ammo':
                this.player.ammo = this.player.maxAmmo;
                this.player.reloadTimer = 0;
                this.spawnParticles(this.player.x + 20, this.player.y + 25, '#ffff00', 10);
                break;
            case 'shield':
                this.shieldTimer = 300;
                this.spawnParticles(this.player.x + 20, this.player.y + 25, '#00ffff', 15);
                break;
            case 'rapid':
                this.rapidFire = true;
                this.rapidFireTimer = 300;
                this.spawnParticles(this.player.x + 20, this.player.y + 25, '#ff00ff', 15);
                break;
        }
    }

    destroyEnemy(enemy) {
        this.spawnExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
        this.score += 20;

        if (Math.random() < 0.2) {
            const types = ['health', 'ammo', 'shield', 'rapid'];
            this.powerUps.push({
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                width: 25,
                height: 25,
                type: types[Math.floor(Math.random() * types.length)],
                vy: 0,
                rotation: 0
            });
        }
    }

    spawnExplosion(x, y) {
        this.explosions.push({
            x, y,
            radius: 5,
            maxRadius: 40,
            alpha: 1
        });

        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.03,
                size: 4 + Math.random() * 5,
                color: Math.random() < 0.5 ? '#ff6600' : '#ffcc00'
            });
        }
    }

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.05,
                size: 3 + Math.random() * 3,
                color
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.98;
            p.vy *= 0.98;
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    updateExplosions() {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const exp = this.explosions[i];
            exp.radius += 2;
            exp.alpha -= 0.05;
            if (exp.alpha <= 0) {
                this.explosions.splice(i, 1);
            }
        }
    }

    playerHit() {
        this.lives--;
        this.screenShake = 15;
        this.spawnExplosion(this.player.x + 20, this.player.y + 25);

        if (this.lives <= 0) {
            this.gameState = 'gameover';
            if (this.score > this.highScore) {
                this.highScore = this.score;
            }
        } else {
            this.player.health = this.player.maxHealth;
        }
    }

    levelComplete() {
        this.level++;
        this.generateMap();
        this.spawnEnemies();
        this.screenShake = 10;
    }

    checkCollision(a, b) {
        return a.x < b.x + (b.width || 20) &&
            a.x + a.width > b.x &&
            a.y < b.y + (b.height || 20) &&
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

        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.width, this.height);

        for (let x = 0; x < this.width; x += 40) {
            for (let y = 0; y < this.height; y += 40) {
                if ((x + y) % 80 === 0) {
                    this.ctx.fillStyle = '#222';
                    this.ctx.fillRect(x, y, 40, 40);
                }
            }
        }

        for (const wall of this.walls) {
            this.ctx.fillStyle = wall.destructible ? '#8B4513' : '#555';
            this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

            this.ctx.strokeStyle = wall.destructible ? '#5a2d0a' : '#333';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
        }

        for (const turret of this.turrets) {
            this.ctx.fillStyle = '#666';
            this.ctx.beginPath();
            this.ctx.arc(turret.x, turret.y, 15, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.save();
            this.ctx.translate(turret.x, turret.y);
            this.ctx.rotate(turret.angle);
            this.ctx.fillStyle = '#444';
            this.ctx.fillRect(0, -5, 25, 10);
            this.ctx.restore();

            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillRect(turret.x - 10, turret.y - 20, 20, 5);
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(turret.x - 10, turret.y - 20, 20 * (turret.health / 50), 5);
        }

        for (const enemy of this.enemies) {
            this.ctx.save();
            this.ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            this.ctx.rotate(enemy.angle);

            this.ctx.fillStyle = enemy.stunnedTimer > 0 ? '#888' : '#cc0000';
            this.ctx.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);

            this.ctx.fillStyle = '#880000';
            this.ctx.fillRect(-enemy.width / 2, -5, 10, 10);

            this.ctx.restore();

            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 5);
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(enemy.x, enemy.y - 10, enemy.width * (enemy.health / enemy.maxHealth), 5);
        }

        for (const bullet of this.bullets) {
            const gradient = this.ctx.createRadialGradient(bullet.x, bullet.y, 0, bullet.x, bullet.y, bullet.radius);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(1, '#ffff00');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }

        for (const bullet of this.enemyBullets) {
            this.ctx.fillStyle = '#ff4444';
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }

        for (const pu of this.powerUps) {
            this.ctx.save();
            this.ctx.translate(pu.x + pu.width / 2, pu.y + pu.height / 2);
            this.ctx.rotate(pu.rotation);

            this.ctx.fillStyle = pu.type === 'health' ? '#00ff00' :
                pu.type === 'ammo' ? '#ffff00' :
                    pu.type === 'shield' ? '#00ffff' : '#ff00ff';
            this.ctx.fillRect(-pu.width / 2, -pu.height / 2, pu.width, pu.height);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            const icons = { health: '+', ammo: 'A', shield: 'S', rapid: 'R' };
            this.ctx.fillText(icons[pu.type], 0, 0);
            this.ctx.restore();
        }

        for (const exp of this.explosions) {
            this.ctx.beginPath();
            this.ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 100, 0, ${exp.alpha})`;
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.arc(exp.x, exp.y, exp.radius * 0.6, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 200, 0, ${exp.alpha})`;
            this.ctx.fill();
        }

        for (const p of this.particles) {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }

        if (this.shieldTimer > 0) {
            this.ctx.beginPath();
            this.ctx.arc(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 35, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 + Math.sin(Date.now() / 100) * 0.3})`;
            this.ctx.lineWidth = 4;
            this.ctx.stroke();
        }

        this.ctx.save();
        this.ctx.translate(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
        this.ctx.rotate(this.player.angle);

        this.ctx.fillStyle = '#3498db';
        this.ctx.fillRect(-this.player.width / 2, -this.player.height / 2, this.player.width, this.player.height);

        this.ctx.fillStyle = '#2980b9';
        this.ctx.fillRect(-this.player.width / 2, -5, this.player.width, 10);

        this.ctx.fillStyle = '#1abc9c';
        this.ctx.fillRect(this.player.width / 2 - 5, -3, 20, 6);

        this.ctx.restore();

        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(this.player.x, this.player.y - 15, this.player.width, 8);
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(this.player.x, this.player.y - 15, this.player.width * (this.player.health / this.player.maxHealth), 8);

        this.ctx.fillStyle = '#ffd700';
        this.ctx.fillRect(this.player.x, this.player.y - 5, this.player.width, 5);
        this.ctx.fillStyle = this.player.ammo > 0 ? '#ff6600' : '#ff0000';
        this.ctx.fillRect(this.player.x, this.player.y - 5, this.player.width * (this.player.ammo / this.player.maxAmmo), 5);

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, 45);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 15, 28);

        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Level ${this.level}`, this.width / 2, 28);

        this.ctx.textAlign = 'right';
        this.ctx.fillText(`High: ${this.highScore}`, 200, 28);

        for (let i = 0; i < this.lives; i++) {
            this.ctx.fillStyle = '#3498db';
            this.ctx.fillRect(this.width - 80 + i * 25, 10, 20, 20);
        }

        if (this.rapidFire) {
            this.ctx.fillStyle = '#ff00ff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText('RAPID FIRE', 10, 42);
        }

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = 'bold 42px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('TANK BATTLE II', this.width / 2, this.height / 2 - 80);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('WASD or Arrow Keys to move', this.width / 2, this.height / 2 - 20);
            this.ctx.fillText('SPACE to shoot', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Destroy enemies and turrets', this.width / 2, this.height / 2 + 40);

            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 100);
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
            this.ctx.fillText(`Level: ${this.level}`, this.width / 2, this.height / 2 + 35);

            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 90);
        }

        this.ctx.restore();
    }
}

window.Tank2Game = Tank2Game;
