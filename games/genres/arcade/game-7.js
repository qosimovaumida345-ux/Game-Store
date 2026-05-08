const BubbleBobble = {
    canvas: null,
    ctx: null,
    bubbles: [],
    shooter: null,
    particles: [],
    score: 0,
    lives: 3,
    level: 1,
    gameOver: false,
    paused: false,
    keys: {},
    frameCount: 0,
    colors: ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#00ffff', '#ff8844'],
    enemies: [],
    fruits: [],
    nextColor: null,
    explosionRadius: 0,

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = canvasId;
            this.canvas.width = 600;
            this.canvas.height = 700;
            document.body.appendChild(this.canvas);
        }
        this.ctx = this.canvas.getContext('2d');
        this.setupEventListeners();
        this.reset();
        this.gameLoop();
    },

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
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

    reset() {
        this.shooter = {
            x: 300,
            y: 620,
            radius: 15,
            angle: -Math.PI / 2,
            speed: 5,
            currentColor: this.getRandomColor(),
            moving: false
        };

        this.bubbles = [];
        this.enemies = [];
        this.particles = [];
        this.fruits = [];
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.frameCount = 0;
        this.nextColor = this.getRandomColor();

        this.spawnBubbleGrid();
        this.spawnEnemies();
    },

    getRandomColor() {
        return this.colors[Math.floor(Math.random() * this.colors.length)];
    },

    spawnBubbleGrid() {
        const rows = 8;
        const cols = 12;
        const startX = 50;
        const startY = 50;
        const spacing = 48;

        for (let row = 0; row < rows; row++) {
            const offset = row % 2 === 0 ? 0 : spacing / 2;
            const colCount = row % 2 === 0 ? cols : cols - 1;
            
            for (let col = 0; col < colCount; col++) {
                if (Math.random() < 0.85 || row < 2) {
                    this.bubbles.push({
                        x: startX + col * spacing + offset,
                        y: startY + row * (spacing * 0.866),
                        radius: 20,
                        color: this.colors[Math.floor(Math.random() * this.colors.length)],
                        falling: false,
                        vx: 0,
                        vy: 0,
                        matchId: row * cols + col
                    });
                }
            }
        }
    },

    spawnEnemies() {
        const count = Math.min(3 + this.level, 8);
        for (let i = 0; i < count; i++) {
            this.enemies.push({
                x: 100 + Math.random() * 400,
                y: 100 + Math.random() * 300,
                radius: 15,
                vx: (Math.random() < 0.5 ? 1 : -1) * (1 + this.level * 0.2),
                vy: (Math.random() < 0.5 ? 1 : -1) * (1 + this.level * 0.2),
                color: '#888888',
                captured: false,
                captureTimer: 0
            });
        }
    },

    shoot() {
        if (this.paused || this.gameOver) return;

        const bullet = {
            x: this.shooter.x,
            y: this.shooter.y - this.shooter.radius,
            vx: Math.cos(this.shooter.angle) * this.shooter.speed,
            vy: Math.sin(this.shooter.angle) * this.shooter.speed,
            radius: 20,
            color: this.shooter.currentColor,
            active: true
        };

        this.bubbles.push(bullet);
        this.shooter.currentColor = this.nextColor;
        this.nextColor = this.getRandomColor();
    },

    checkMatches(bubble) {
        const matches = [];
        const visited = new Set();

        const findMatches = (b) => {
            if (visited.has(b.matchId)) return;
            visited.add(b.matchId);

            if (b.color === bubble.color) {
                matches.push(b);
                this.bubbles.forEach(other => {
                    if (!visited.has(other.matchId) && this.getDistance(b, other) < 45) {
                        findMatches(other);
                    }
                });
            }
        };

        findMatches(bubble);

        return matches;
    },

    popBubbles(bubble) {
        const matches = this.checkMatches(bubble);
        
        if (matches.length >= 3) {
            const points = matches.length * 10 * this.level;
            this.score += points;

            matches.forEach(match => {
                this.createExplosion(match.x, match.y, match.color, 15);
                const index = this.bubbles.indexOf(match);
                if (index > -1) this.bubbles.splice(index, 1);
            });

            this.createExplosion(bubble.x, bubble.y, bubble.color, 20);

            const floatingBubbles = this.findFloatingBubbles();
            floatingBubbles.forEach(b => {
                b.falling = true;
                b.vy = 0;
                this.score += 5;
            });
        }
    },

    findFloatingBubbles() {
        const connected = new Set();
        const topBubbles = this.bubbles.filter(b => b.y < 80 && !b.falling);

        const visited = new Set();

        const floodFill = (bubble) => {
            if (visited.has(bubble.matchId)) return;
            visited.add(bubble.matchId);
            connected.add(bubble.matchId);

            this.bubbles.forEach(other => {
                if (!visited.has(other.matchId) && !other.falling && this.getDistance(bubble, other) < 45) {
                    floodFill(other);
                }
            });
        };

        topBubbles.forEach(b => floodFill(b));

        return this.bubbles.filter(b => !connected.has(b.matchId) && !b.falling);
    },

    createExplosion(x, y, color, count = 15) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: color,
                size: Math.random() * 4 + 2
            });
        }
    },

    getDistance(a, b) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    },

    snapToGrid(bubble) {
        const spacing = 48;
        let bestX = bubble.x;
        let bestY = bubble.y;
        let minDist = Infinity;

        for (let row = 0; row < 15; row++) {
            const offset = row % 2 === 0 ? 0 : spacing / 2;
            for (let col = 0; col < 12; col++) {
                const gridX = 50 + col * spacing + offset;
                const gridY = 50 + row * (spacing * 0.866);

                if (Math.abs(gridX - bubble.x) < 25 && Math.abs(gridY - bubble.y) < 25) {
                    const dist = this.getDistance(bubble, { x: gridX, y: gridY });
                    if (dist < minDist) {
                        minDist = dist;
                        bestX = gridX;
                        bestY = gridY;
                    }
                }
            }
        }

        bubble.x = bestX;
        bubble.y = bestY;
    },

    update() {
        if (this.gameOver || this.paused) return;

        this.frameCount++;

        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.shooter.x -= 6;
            this.shooter.moving = true;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.shooter.x += 6;
            this.shooter.moving = true;
        }
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.shooter.angle -= 0.1;
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.shooter.angle += 0.1;
        }

        this.shooter.x = Math.max(30, Math.min(570, this.shooter.x));
        this.shooter.angle = Math.max(-Math.PI + 0.2, Math.min(-0.2, this.shooter.angle));

        if (this.keys['Space']) {
            this.shoot();
        }

        this.bubbles.forEach((bubble, index) => {
            if (bubble.falling) {
                bubble.vy += 0.3;
                bubble.y += bubble.vy;
                bubble.x += bubble.vx;

                if (bubble.y > 700) {
                    this.bubbles.splice(index, 1);
                    this.createExplosion(bubble.x, 650, bubble.color, 10);
                }
            } else if (bubble.vx !== undefined) {
                bubble.x += bubble.vx;
                bubble.y += bubble.vy;

                if (bubble.y < 20) {
                    bubble.vy = Math.abs(bubble.vy);
                }
                if (bubble.y > 650) {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.gameOver = true;
                    } else {
                        this.resetLevel();
                    }
                    return;
                }

                if (bubble.x < 20 || bubble.x > 580) {
                    bubble.vx = -bubble.vx;
                    bubble.x = Math.max(20, Math.min(580, bubble.x));
                }

                let collided = false;
                this.bubbles.forEach(other => {
                    if (other !== bubble && !other.falling && !other.vx && this.getDistance(bubble, other) < 42) {
                        collided = true;
                    }
                });

                if (collided) {
                    bubble.vx = 0;
                    bubble.vy = 0;
                    this.snapToGrid(bubble);
                    bubble.matchId = this.bubbles.length;
                    this.popBubbles(bubble);
                }
            }
        });

        this.enemies.forEach(enemy => {
            if (enemy.captured) {
                enemy.captureTimer++;
                if (enemy.captureTimer > 180) {
                    const index = this.enemies.indexOf(enemy);
                    if (index > -1) this.enemies.splice(index, 1);
                    this.score += 500;
                    this.spawnFruit(enemy.x, enemy.y);
                }
                return;
            }

            enemy.x += enemy.vx;
            enemy.y += enemy.vy;

            if (enemy.x < 30 || enemy.x > 570) enemy.vx = -enemy.vx;
            if (enemy.y < 30 || enemy.y > 350) enemy.vy = -enemy.vy;

            this.bubbles.forEach(bubble => {
                if (!bubble.vx && !bubble.falling && this.getDistance(bubble, enemy) < bubble.radius + enemy.radius) {
                    enemy.captured = true;
                    enemy.color = bubble.color;
                    this.createExplosion(enemy.x, enemy.y, bubble.color, 20);
                    const index = this.bubbles.indexOf(bubble);
                    if (index > -1) this.bubbles.splice(index, 1);
                }
            });
        });

        this.particles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1;
            particle.life -= 0.02;
            if (particle.life <= 0) this.particles.splice(index, 1);
        });

        if (this.bubbles.length === 0) {
            this.level++;
            if (this.level > 10) {
                this.gameOver = true;
            } else {
                this.spawnBubbleGrid();
                this.spawnEnemies();
            }
        }
    },

    spawnFruit(x, y) {
        const fruitTypes = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '⭐', '💎'];
        this.fruits.push({
            x: x,
            y: y,
            type: fruitTypes[Math.floor(Math.random() * fruitTypes.length)],
            vy: -5,
            life: 180
        });
    },

    resetLevel() {
        this.bubbles = [];
        this.enemies = [];
        this.shooter.x = 300;
        this.shooter.angle = -Math.PI / 2;
        this.spawnBubbleGrid();
        this.spawnEnemies();
    },

    draw() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, 700);
        gradient.addColorStop(0, '#000033');
        gradient.addColorStop(1, '#000066');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, 600, 700);

        this.ctx.strokeStyle = '#333366';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(20, 30);
        this.ctx.lineTo(580, 30);
        this.ctx.lineTo(590, 620);
        this.ctx.lineTo(10, 620);
        this.ctx.closePath();
        this.ctx.stroke();

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.fillRect(0, 0, 600, 700);

        this.fruits.forEach((fruit, index) => {
            fruit.y += fruit.vy;
            fruit.vy += 0.2;
            fruit.life--;

            if (fruit.life <= 0) {
                this.fruits.splice(index, 1);
                return;
            }

            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(fruit.type, fruit.x, fruit.y);

            if (this.shooter.x > fruit.x - 30 && this.shooter.x < fruit.x + 30 &&
                this.shooter.y > fruit.y - 30 && this.shooter.y < fruit.y + 30) {
                this.score += 100;
                this.createExplosion(fruit.x, fruit.y, '#ffff00', 20);
                this.fruits.splice(index, 1);
            }
        });

        this.bubbles.forEach(bubble => {
            const gradient = this.ctx.createRadialGradient(
                bubble.x - bubble.radius * 0.3, bubble.y - bubble.radius * 0.3, 0,
                bubble.x, bubble.y, bubble.radius
            );
            gradient.addColorStop(0, this.lightenColor(bubble.color, 40));
            gradient.addColorStop(0.7, bubble.color);
            gradient.addColorStop(1, this.darkenColor(bubble.color, 30));

            this.ctx.fillStyle = gradient;
            this.ctx.shadowColor = bubble.color;
            this.ctx.shadowBlur = bubble.falling ? 5 : 15;
            this.ctx.beginPath();
            this.ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(bubble.x - bubble.radius * 0.3, bubble.y - bubble.radius * 0.3, bubble.radius * 0.25, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });

        this.enemies.forEach(enemy => {
            if (enemy.captured) {
                this.ctx.fillStyle = enemy.color;
                this.ctx.shadowColor = enemy.color;
                this.ctx.shadowBlur = 20;
            } else {
                this.ctx.fillStyle = '#666666';
                this.ctx.shadowBlur = 0;
            }

            this.ctx.beginPath();
            this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
            this.ctx.fill();

            if (!enemy.captured) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(enemy.x - 5, enemy.y - 3, 3, 0, Math.PI * 2);
                this.ctx.arc(enemy.x + 5, enemy.y - 3, 3, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#000000';
                this.ctx.beginPath();
                this.ctx.arc(enemy.x - 5, enemy.y - 3, 1.5, 0, Math.PI * 2);
                this.ctx.arc(enemy.x + 5, enemy.y - 3, 1.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
            this.ctx.shadowBlur = 0;
        });

        this.ctx.strokeStyle = this.shooter.currentColor;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(this.shooter.x, this.shooter.y);
        const lineLength = 40;
        this.ctx.lineTo(
            this.shooter.x + Math.cos(this.shooter.angle) * lineLength,
            this.shooter.y + Math.sin(this.shooter.angle) * lineLength
        );
        this.ctx.stroke();

        const shooterGradient = this.ctx.createRadialGradient(
            this.shooter.x - 3, this.shooter.y - 3, 0,
            this.shooter.x, this.shooter.y, this.shooter.radius
        );
        shooterGradient.addColorStop(0, '#ffffff');
        shooterGradient.addColorStop(1, this.shooter.currentColor);

        this.ctx.fillStyle = shooterGradient;
        this.ctx.shadowColor = this.shooter.currentColor;
        this.ctx.shadowBlur = 20;
        this.ctx.beginPath();
        this.ctx.arc(this.shooter.x, this.shooter.y, this.shooter.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(this.shooter.x - 5, this.shooter.y - 5, 5, 0, Math.PI * 2);
        this.ctx.fill();

        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color + Math.floor(particle.life * 255).toString(16).padStart(2, '0');
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 25);
        this.ctx.fillText(`Level: ${this.level}`, 20, 50);
        this.ctx.fillText(`Lives: ${'❤️'.repeat(this.lives)}`, 20, 75);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px Arial';
        this.ctx.fillText('Next:', 520, 620);
        this.ctx.fillStyle = this.nextColor;
        this.ctx.beginPath();
        this.ctx.arc(560, 640, 15, 0, Math.PI * 2);
        this.ctx.fill();

        if (this.paused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, 600, 700);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', 300, 350);
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Press P to continue', 300, 390);
        }

        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            this.ctx.fillRect(0, 0, 600, 700);
            this.ctx.fillStyle = '#ff4444';
            this.ctx.font = '36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', 300, 300);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, 300, 350);
            this.ctx.fillText(`Level: ${this.level}`, 300, 385);
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Click or press Enter to restart', 300, 450);
        }
    },

    lightenColor(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, (num >> 16) + amount);
        const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
        const b = Math.min(255, (num & 0x0000FF) + amount);
        return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
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
    module.exports = BubbleBobble;
}