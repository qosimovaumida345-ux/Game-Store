class TowerDefenseGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.map = [];
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.path = [];
        this.money = 200;
        this.lives = 20;
        this.wave = 1;
        this.waveInProgress = false;
        this.waveTimer = 0;
        this.enemiesToSpawn = 0;
        this.spawnTimer = 0;
        this.selectedTower = null;
        this.gameState = 'start';
        this.towerTypes = [
            { name: 'Archer', cost: 50, range: 120, damage: 10, fireRate: 40, color: '#0a0', projSpeed: 8 },
            { name: 'Cannon', cost: 100, range: 100, damage: 30, fireRate: 80, color: '#a00', projSpeed: 5 },
            { name: 'Ice', cost: 75, range: 90, damage: 5, fireRate: 30, color: '#0af', projSpeed: 6, slow: 0.5 },
            { name: 'Lightning', cost: 150, range: 150, damage: 15, fireRate: 20, color: '#ff0', projSpeed: 12 },
            { name: 'Poison', cost: 125, range: 100, damage: 8, fireRate: 35, color: '#0a8', projSpeed: 4, dot: 5 }
        ];
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.generateMap();
    }

    generateMap() {
        const pathPoints = [
            { x: 0, y: 100 },
            { x: 200, y: 100 },
            { x: 200, y: 400 },
            { x: 500, y: 400 },
            { x: 500, y: 200 },
            { x: 700, y: 200 },
            { x: 700, y: 500 },
            { x: 800, y: 500 }
        ];

        this.path = [];
        for (let i = 0; i < pathPoints.length - 1; i++) {
            const p1 = pathPoints[i];
            const p2 = pathPoints[i + 1];
            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            const steps = Math.ceil(dist / 10);

            for (let j = 0; j < steps; j++) {
                this.path.push({
                    x: p1.x + (p2.x - p1.x) * (j / steps),
                    y: p1.y + (p2.y - p1.y) * (j / steps)
                });
            }
        }

        this.map = [];
        for (let y = 0; y < this.height; y += 40) {
            this.map[y / 40] = [];
            for (let x = 0; x < this.width; x += 40) {
                let onPath = false;
                for (const p of this.path) {
                    if (Math.abs(p.x - (x + 20)) < 25 && Math.abs(p.y - (y + 20)) < 25) {
                        onPath = true;
                        break;
                    }
                }
                this.map[y / 40][x / 40] = onPath ? 1 : 0;
            }
        }
    }

    update() {
        if (this.gameState === 'start' || this.gameState === 'gameover') return;

        if (!this.waveInProgress && this.enemies.length === 0) {
            this.waveInProgress = true;
            this.enemiesToSpawn = 5 + this.wave * 2;
            this.spawnTimer = 0;
        }

        if (this.waveInProgress && this.enemiesToSpawn > 0) {
            this.spawnTimer--;
            if (this.spawnTimer <= 0) {
                this.spawnEnemy();
                this.enemiesToSpawn--;
                this.spawnTimer = 40 - Math.min(30, this.wave);
            }
        }

        if (this.waveInProgress && this.enemiesToSpawn === 0 && this.enemies.length === 0) {
            this.waveInProgress = false;
            this.wave++;
            this.money += 50 + this.wave * 10;
        }

        for (const enemy of this.enemies) {
            this.updateEnemy(enemy);
        }

        for (const tower of this.towers) {
            this.updateTower(tower);
        }

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;

            if (p.life <= 0) {
                this.projectiles.splice(i, 1);
                continue;
            }

            if (p.target && p.target.hp > 0) {
                const dist = Math.hypot(p.x - p.target.x, p.y - p.target.y);
                if (dist < 20) {
                    p.target.hp -= p.damage;
                    if (p.slow) p.target.slowTimer = 60;
                    if (p.dot) {
                        p.target.dotDamage = (p.target.dotDamage || 0) + p.dot;
                    }

                    this.projectiles.splice(i, 1);
                }
            } else {
                this.projectiles.splice(i, 1);
            }
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (e.hp <= 0) {
                this.money += e.reward;
                this.enemies.splice(i, 1);
            } else if (e.reachedEnd) {
                this.lives--;
                this.enemies.splice(i, 1);
                if (this.lives <= 0) {
                    this.gameState = 'gameover';
                }
            }
        }

        if (this.selectedTower && this.keys.action) {
            this.placeTower();
            this.keys.action = false;
        }
    }

    spawnEnemy() {
        const types = [
            { hp: 30 + this.wave * 5, speed: 1.5, reward: 10, color: '#f00', size: 12 },
            { hp: 50 + this.wave * 10, speed: 1, reward: 15, color: '#0a0', size: 15 },
            { hp: 80 + this.wave * 15, speed: 0.7, reward: 25, color: '#a0a', size: 18 },
            { hp: 20 + this.wave * 3, speed: 2.5, reward: 8, color: '#aa0', size: 10 }
        ];

        const typeIdx = Math.min(Math.floor(this.wave / 3), types.length - 1);
        const type = types[typeIdx];

        this.enemies.push({
            x: this.path[0].x,
            y: this.path[0].y,
            hp: type.hp,
            maxHp: type.hp,
            speed: type.speed,
            reward: type.reward,
            color: type.color,
            size: type.size,
            pathIndex: 0,
            slowTimer: 0,
            dotDamage: 0,
            reachedEnd: false
        });
    }

    updateEnemy(enemy) {
        if (enemy.slowTimer > 0) enemy.slowTimer--;
        if (enemy.dotDamage > 0) {
            enemy.hp -= 0.1;
            enemy.dotDamage -= 0.1;
        }

        let speed = enemy.speed;
        if (enemy.slowTimer > 0) speed *= 0.5;

        const targetPoint = this.path[Math.min(enemy.pathIndex + 1, this.path.length - 1)];
        if (!targetPoint) {
            enemy.reachedEnd = true;
            return;
        }

        const dx = targetPoint.x - enemy.x;
        const dy = targetPoint.y - enemy.y;
        const dist = Math.hypot(dx, dy);

        if (dist < speed) {
            enemy.pathIndex++;
            if (enemy.pathIndex >= this.path.length - 1) {
                enemy.reachedEnd = true;
            }
        } else {
            enemy.x += (dx / dist) * speed;
            enemy.y += (dy / dist) * speed;
        }
    }

    updateTower(tower) {
        if (tower.cooldown > 0) tower.cooldown--;

        if (tower.cooldown <= 0) {
            let target = null;
            let maxProgress = -1;

            for (const enemy of this.enemies) {
                const dist = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
                if (dist <= tower.range) {
                    const progress = enemy.pathIndex + (1 - dist / tower.range);
                    if (progress > maxProgress) {
                        maxProgress = progress;
                        target = enemy;
                    }
                }
            }

            if (target) {
                const angle = Math.atan2(target.y - tower.y, target.x - tower.x);
                this.projectiles.push({
                    x: tower.x,
                    y: tower.y,
                    vx: Math.cos(angle) * tower.projSpeed,
                    vy: Math.sin(angle) * tower.projSpeed,
                    damage: tower.damage,
                    target: target,
                    life: 60,
                    slow: tower.slow,
                    dot: tower.dot
                });
                tower.cooldown = tower.fireRate;
            }
        }
    }

    placeTower() {
        const tileX = Math.floor(this.mouseX / 40);
        const tileY = Math.floor(this.mouseY / 40);

        if (tileX < 0 || tileX >= 20 || tileY < 0 || tileY >= 15) return;
        if (this.map[tileY][tileX] === 1) return;
        if (this.money < this.selectedTower.cost) return;

        for (const t of this.towers) {
            if (Math.abs(t.x - (tileX * 40 + 20)) < 30 && Math.abs(t.y - (tileY * 40 + 20)) < 30) {
                return;
            }
        }

        this.towers.push({
            x: tileX * 40 + 20,
            y: tileY * 40 + 20,
            type: this.selectedTower.name,
            range: this.selectedTower.range,
            damage: this.selectedTower.damage,
            fireRate: this.selectedTower.fireRate,
            color: this.selectedTower.color,
            projSpeed: this.selectedTower.projSpeed,
            slow: this.selectedTower.slow || 0,
            dot: this.selectedTower.dot || 0,
            cooldown: 0
        });

        this.money -= this.selectedTower.cost;
    }

    render() {
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.width, this.height);

        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                if (this.map[y][x] === 1) {
                    this.ctx.fillStyle = '#543';
                    this.ctx.fillRect(x * 40, y * 40, 40, 40);
                } else {
                    this.ctx.fillStyle = '#343';
                    this.ctx.fillRect(x * 40, y * 40, 40, 40);
                    this.ctx.strokeStyle = '#232';
                    this.ctx.strokeRect(x * 40, y * 40, 40, 40);
                }
            }
        }

        for (const enemy of this.enemies) {
            const size = enemy.size;
            this.ctx.fillStyle = enemy.slowTimer > 0 ? '#0af' : enemy.color;
            this.ctx.beginPath();
            this.ctx.arc(enemy.x, enemy.y, size, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(enemy.x - size, enemy.y - size - 8, size * 2, 4);
            this.ctx.fillStyle = '#0f0';
            this.ctx.fillRect(enemy.x - size, enemy.y - size - 8, size * 2 * (enemy.hp / enemy.maxHp), 4);
        }

        for (const tower of this.towers) {
            this.ctx.fillStyle = '#666';
            this.ctx.beginPath();
            this.ctx.arc(tower.x, tower.y, 15, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = tower.color;
            this.ctx.beginPath();
            this.ctx.arc(tower.x, tower.y, 10, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.strokeStyle = tower.color;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(tower.x, tower.y);
            const time = Date.now() / 500;
            this.ctx.lineTo(tower.x + Math.cos(time) * 12, tower.y + Math.sin(time) * 12);
            this.ctx.stroke();
        }

        for (const p of this.projectiles) {
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for (let i = 0; i < this.path.length - 1; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.path[i].x, this.path[i].y);
            this.ctx.lineTo(this.path[i + 1].x, this.path[i + 1].y);
            this.ctx.stroke();
        }

        if (this.selectedTower && this.mouseX && this.mouseY) {
            const tileX = Math.floor(this.mouseX / 40);
            const tileY = Math.floor(this.mouseY / 40);
            if (tileX >= 0 && tileX < 20 && tileY >= 0 && tileY < 15) {
                const canPlace = this.map[tileY][tileX] === 0 && this.money >= this.selectedTower.cost;
                this.ctx.fillStyle = canPlace ? 'rgba(0,255,0,0.3)' : 'rgba(255,0,0,0.3)';
                this.ctx.fillRect(tileX * 40, tileY * 40, 40, 40);

                this.ctx.strokeStyle = this.selectedTower.color;
                this.ctx.globalAlpha = 0.3;
                this.ctx.beginPath();
                this.ctx.arc(tileX * 40 + 20, tileY * 40 + 20, this.selectedTower.range, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.globalAlpha = 1;
            }
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Money: $${this.money}`, 10, 25);
        this.ctx.fillText(`Lives: ${this.lives}`, 10, 45);
        this.ctx.fillText(`Wave: ${this.wave}`, 10, 65);

        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'right';
        const startX = this.width - 10;
        let y = 25;
        for (const tower of this.towerTypes) {
            const prefix = this.selectedTower === tower ? '> ' : '  ';
            const canAfford = this.money >= tower.cost ? '' : ' (too expensive)';
            this.ctx.fillStyle = canAfford ? '#888' : '#fff';
            this.ctx.fillText(`${prefix}${tower.name} ($${tower.cost})${canAfford}`, startX, y);
            y += 20;
        }

        this.ctx.fillStyle = '#ff0';
        this.ctx.textAlign = 'center';
        if (this.gameState === 'start') {
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2);
        } else if (this.gameState === 'gameover') {
            this.ctx.font = '40px Arial';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 20);
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`Reached Wave ${this.wave}`, this.width / 2, this.height / 2 + 20);
        }

        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Click tower type then click on map to place', 10, this.height - 10);
    }

    handleKeyDown(key) {
        if (key === ' ' && this.gameState !== 'playing') {
            this.start();
        }
    }

    handleKeyUp(key) {}

    start() {
        this.gameState = 'playing';
        this.money = 200;
        this.lives = 20;
        this.wave = 1;
        this.waveInProgress = false;
        this.enemies = [];
        this.towers = [];
        this.projectiles = [];
    }

    getState() {
        return { money: this.money, lives: this.lives, wave: this.wave };
    }

    setControllerData(data) {
        if (data.x !== undefined) this.mouseX = data.x;
        if (data.y !== undefined) this.mouseY = data.y;
        if (data.action) this.keys.action = true;
    }
}

window.TowerDefenseGame = TowerDefenseGame;