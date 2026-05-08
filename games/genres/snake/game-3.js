class Snake3Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 600;
        this.height = 600;
        this.cellSize = 15;
        this.gridWidth = 40;
        this.gridHeight = 40;
        this.snake = [];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.food = null;
        this.powerUps = [];
        this.superFood = null;
        this.obstacles = [];
        this.score = 0;
        this.highScore = 0;
        this.level = 1;
        this.gameState = 'start';
        this.speed = 100;
        this.particles = [];
        this.trail = [];
        this.screenShake = 0;
        this.combo = 0;
        this.lastEatTime = 0;
        this.portalPositions = [];
        this.boostMode = false;
        this.boostTimer = 0;
        this.ghostMode = false;
        this.ghostTimer = 0;
        this.ghosts = [];
        this.snakeColors = ['#00ff00', '#00cc00', '#009900'];
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.setupControls();
        this.canvas.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.canvas.setAttribute('tabindex', '0');
        this.canvas.focus();
    }

    setupControls() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            boost: false
        };
    }

    handleKeyDown(e) {
        if (this.gameState !== 'playing') return;

        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (this.direction.y === 0) {
                    this.nextDirection = { x: 0, y: -1 };
                }
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (this.direction.y === 0) {
                    this.nextDirection = { x: 0, y: 1 };
                }
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (this.direction.x === 0) {
                    this.nextDirection = { x: -1, y: 0 };
                }
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (this.direction.x === 0) {
                    this.nextDirection = { x: 1, y: 0 };
                }
                break;
            case 'Shift':
                this.boostMode = true;
                break;
            case ' ':
                if (this.gameState === 'start' || this.gameState === 'gameover') {
                    this.start();
                }
                break;
        }
    }

    start() {
        this.snake = [
            { x: 20, y: 20 },
            { x: 19, y: 20 },
            { x: 18, y: 20 }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.level = 1;
        this.speed = 100;
        this.powerUps = [];
        this.obstacles = [];
        this.portalPositions = [];
        this.ghosts = [];
        this.boostMode = false;
        this.boostTimer = 0;
        this.ghostMode = false;
        this.ghostTimer = 0;
        this.combo = 0;
        this.trail = [];
        this.spawnFood();
        this.spawnObstacles();
        this.gameState = 'playing';
        this.lastUpdateTime = Date.now();
        this.gameLoop();
    }

    spawnFood() {
        do {
            this.food = {
                x: Math.floor(Math.random() * this.gridWidth),
                y: Math.floor(Math.random() * this.gridHeight)
            };
        } while (this.isOnSnake(this.food) || this.isOnObstacle(this.food));
    }

    spawnSuperFood() {
        if (this.superFood === null && Math.random() < 0.1) {
            do {
                this.superFood = {
                    x: Math.floor(Math.random() * this.gridWidth),
                    y: Math.floor(Math.random() * this.gridHeight)
                };
            } while (this.isOnSnake(this.superFood) || this.isOnObstacle(this.superFood));
        }
    }

    spawnPowerUp() {
        if (this.powerUps.length < 2 && Math.random() < 0.05) {
            const types = ['speed', 'ghost', 'reverse', 'magnet'];
            const type = types[Math.floor(Math.random() * types.length)];

            let pos;
            do {
                pos = {
                    x: Math.floor(Math.random() * this.gridWidth),
                    y: Math.floor(Math.random() * this.gridHeight)
                };
            } while (this.isOnSnake(pos) || this.isOnObstacle(pos) || this.isOnFood(pos));

            this.powerUps.push({
                ...pos,
                type,
                life: 300,
                color: type === 'speed' ? '#ffff00' : type === 'ghost' ? '#9932CC' : type === 'reverse' ? '#00ffff' : '#ff69b4'
            });
        }
    }

    spawnObstacles() {
        for (let i = 0; i < 10; i++) {
            let pos;
            do {
                pos = {
                    x: Math.floor(Math.random() * this.gridWidth),
                    y: Math.floor(Math.random() * this.gridHeight)
                };
            } while (this.isOnSnake(pos) || (pos.x < 5 && pos.y < 5));
            this.obstacles.push(pos);
        }
    }

    isOnSnake(pos) {
        return this.snake.some(s => s.x === pos.x && s.y === pos.y);
    }

    isOnObstacle(pos) {
        return this.obstacles.some(o => o.x === pos.x && o.y === pos.y);
    }

    isOnFood(pos) {
        return (this.food && this.food.x === pos.x && this.food.y === pos.y) ||
            (this.superFood && this.superFood.x === pos.x && this.superFood.y === pos.y);
    }

    update() {
        const now = Date.now();
        const currentSpeed = this.boostMode && this.boostTimer > 0 ? this.speed / 2 : this.speed;

        if (now - this.lastUpdateTime < currentSpeed) return;
        this.lastUpdateTime = now;

        this.direction = this.nextDirection;

        const head = this.snake[0];
        let newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };

        if (this.portalPositions.length >= 2) {
            for (const portal of this.portalPositions) {
                if (newHead.x === portal.x && newHead.y === portal.y) {
                    const otherPortal = this.portalPositions.find(p => p !== portal);
                    if (otherPortal) {
                        newHead.x = otherPortal.x + this.direction.x;
                        newHead.y = otherPortal.y + this.direction.y;
                        this.spawnParticles(head.x * this.cellSize + this.cellSize / 2, head.y * this.cellSize + this.cellSize / 2, '#ff00ff');
                    }
                }
            }
        }

        if (this.ghostMode) {
            newHead.x = (newHead.x + this.gridWidth) % this.gridWidth;
            newHead.y = (newHead.y + this.gridHeight) % this.gridHeight;
        } else {
            if (newHead.x < 0 || newHead.x >= this.gridWidth || newHead.y < 0 || newHead.y >= this.gridHeight) {
                this.spawnParticles(head.x * this.cellSize + this.cellSize / 2, head.y * this.cellSize + this.cellSize / 2, '#ff0000');
                this.gameState = 'gameover';
                return;
            }

            if (this.isOnObstacle(newHead)) {
                this.spawnParticles(head.x * this.cellSize + this.cellSize / 2, head.y * this.cellSize + this.cellSize / 2, '#ff0000');
                this.gameState = 'gameover';
                return;
            }
        }

        for (let i = 1; i < this.snake.length; i++) {
            if (this.snake[i].x === newHead.x && this.snake[i].y === newHead.y) {
                this.spawnParticles(head.x * this.cellSize + this.cellSize / 2, head.y * this.cellSize + this.cellSize / 2, '#ff0000');
                this.gameState = 'gameover';
                return;
            }
        }

        this.snake.unshift(newHead);
        this.trail.push({ ...head, life: 20 });
        if (this.trail.length > 20) this.trail.shift();

        if (newHead.x === this.food?.x && newHead.y === this.food?.y) {
            this.score += 10 * this.combo;
            this.combo++;
            this.lastEatTime = now;
            this.spawnParticles(this.food.x * this.cellSize + this.cellSize / 2, this.food.y * this.cellSize + this.cellSize / 2, '#ff0000');
            this.spawnFood();

            if (this.score >= this.level * 100) {
                this.levelUp();
            }
        } else if (this.superFood && newHead.x === this.superFood.x && newHead.y === this.superFood.y) {
            this.score += 50 * this.combo;
            this.combo = Math.min(this.combo + 3, 10);
            this.spawnParticles(this.superFood.x * this.cellSize + this.cellSize / 2, this.superFood.y * this.cellSize + this.cellSize / 2, '#ffd700');
            this.superFood = null;

            if (Math.random() < 0.3 && this.portalPositions.length < 2) {
                const portalCount = this.portalPositions.length;
                let pos;
                do {
                    pos = {
                        x: Math.floor(Math.random() * this.gridWidth),
                        y: Math.floor(Math.random() * this.gridHeight)
                    };
                } while (this.isOnSnake(pos));
                this.portalPositions.push(pos);
            }
        } else {
            this.snake.pop();
            if (now - this.lastEatTime > 3000) {
                this.combo = Math.max(0, this.combo - 1);
            }
        }

        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const pu = this.powerUps[i];
            pu.life--;
            if (pu.life <= 0) {
                this.powerUps.splice(i, 1);
                continue;
            }

            if (newHead.x === pu.x && newHead.y === pu.y) {
                this.applyPowerUp(pu);
                this.powerUps.splice(i, 1);
            }
        }

        this.spawnSuperFood();
        this.spawnPowerUp();

        if (this.boostTimer > 0) {
            this.boostTimer--;
            if (this.boostTimer <= 0) this.boostMode = false;
        }

        if (this.ghostTimer > 0) {
            this.ghostTimer--;
            if (this.ghostTimer <= 0) this.ghostMode = false;
        }

        this.updateParticles();
        this.updateTrails();

        for (let i = this.ghosts.length - 1; i >= 0; i--) {
            const ghost = this.ghosts[i];
            ghost.life--;
            if (ghost.life <= 0) {
                this.ghosts.splice(i, 1);
                continue;
            }

            const dx = head.x - ghost.x;
            const dy = head.y - ghost.y;
            if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
                if (!this.ghostMode) {
                    this.spawnParticles(head.x * this.cellSize + this.cellSize / 2, head.y * this.cellSize + this.cellSize / 2, '#ff0000');
                    this.gameState = 'gameover';
                }
            }
        }

        if (Math.random() < 0.01 && this.level >= 3) {
            this.spawnGhost();
        }

        if (this.screenShake > 0) this.screenShake--;
    }

    spawnGhost() {
        let pos;
        do {
            pos = {
                x: Math.floor(Math.random() * this.gridWidth),
                y: Math.floor(Math.random() * this.gridHeight)
            };
        } while (this.isOnSnake(pos) || this.isOnObstacle(pos));

        this.ghosts.push({
            ...pos,
            dx: Math.random() < 0.5 ? 1 : -1,
            dy: Math.random() < 0.5 ? 1 : -1,
            life: 300,
            color: '#9932CC'
        });
    }

    applyPowerUp(pu) {
        this.spawnParticles(pu.x * this.cellSize + this.cellSize / 2, pu.y * this.cellSize + this.cellSize / 2, pu.color);

        switch (pu.type) {
            case 'speed':
                this.boostTimer = 200;
                this.boostMode = true;
                break;
            case 'ghost':
                this.ghostTimer = 150;
                this.ghostMode = true;
                break;
            case 'reverse':
                this.direction = { x: -this.direction.x, y: -this.direction.y };
                this.nextDirection = this.direction;
                break;
            case 'magnet':
                const head = this.snake[0];
                if (this.food) {
                    const dx = this.food.x - head.x;
                    const dy = this.food.y - head.y;
                    this.nextDirection = {
                        x: dx > 0 ? 1 : dx < 0 ? -1 : 0,
                        y: dy > 0 ? 1 : dy < 0 ? -1 : 0
                    };
                }
                break;
        }
    }

    levelUp() {
        this.level++;
        this.speed = Math.max(30, 100 - (this.level - 1) * 10);

        for (let i = 0; i < this.level; i++) {
            let pos;
            do {
                pos = {
                    x: Math.floor(Math.random() * this.gridWidth),
                    y: Math.floor(Math.random() * this.gridHeight)
                };
            } while (this.isOnSnake(pos) || this.isOnObstacle(pos) || this.isOnFood(pos));
            this.obstacles.push(pos);
        }

        this.spawnParticles(this.width / 2, this.height / 2, '#00ffff');
        this.screenShake = 10;
    }

    spawnParticles(x, y, color) {
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.02,
                size: 3 + Math.random() * 4,
                color
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05;
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    updateTrails() {
        for (let i = this.trail.length - 1; i >= 0; i--) {
            this.trail[i].life--;
            if (this.trail[i].life <= 0) {
                this.trail.splice(i, 1);
            }
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
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(shakeX, shakeY);
        }

        const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
        gradient.addColorStop(0, '#001133');
        gradient.addColorStop(1, '#000022');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            this.ctx.globalAlpha = t.life / 20;
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillRect(
                t.x * this.cellSize,
                t.y * this.cellSize,
                this.cellSize,
                this.cellSize
            );
        }
        this.ctx.globalAlpha = 1;

        this.ctx.fillStyle = '#333';
        for (const obs of this.obstacles) {
            this.ctx.fillRect(
                obs.x * this.cellSize,
                obs.y * this.cellSize,
                this.cellSize,
                this.cellSize
            );
        }

        for (const portal of this.portalPositions) {
            const gradient = this.ctx.createRadialGradient(
                portal.x * this.cellSize + this.cellSize / 2,
                portal.y * this.cellSize + this.cellSize / 2,
                0,
                portal.x * this.cellSize + this.cellSize / 2,
                portal.y * this.cellSize + this.cellSize / 2,
                this.cellSize
            );
            gradient.addColorStop(0, '#ff00ff');
            gradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(
                portal.x * this.cellSize - 5,
                portal.y * this.cellSize - 5,
                this.cellSize + 10,
                this.cellSize + 10
            );
        }

        if (this.food) {
            this.ctx.fillStyle = '#ff4444';
            this.ctx.beginPath();
            this.ctx.arc(
                this.food.x * this.cellSize + this.cellSize / 2,
                this.food.y * this.cellSize + this.cellSize / 2,
                this.cellSize / 2,
                0, Math.PI * 2
            );
            this.ctx.fill();
        }

        if (this.superFood) {
            this.ctx.save();
            this.ctx.translate(
                this.superFood.x * this.cellSize + this.cellSize / 2,
                this.superFood.y * this.cellSize + this.cellSize / 2
            );
            this.ctx.rotate(Date.now() / 200);
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillRect(-this.cellSize / 2, -this.cellSize / 2, this.cellSize, this.cellSize);
            this.ctx.restore();
        }

        for (const pu of this.powerUps) {
            this.ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.3;
            this.ctx.fillStyle = pu.color;
            this.ctx.fillRect(
                pu.x * this.cellSize,
                pu.y * this.cellSize,
                this.cellSize,
                this.cellSize
            );
            this.ctx.globalAlpha = 1;
        }

        for (const ghost of this.ghosts) {
            this.ctx.globalAlpha = 0.7;
            this.ctx.fillStyle = ghost.color;
            this.ctx.beginPath();
            this.ctx.arc(
                ghost.x * this.cellSize + this.cellSize / 2,
                ghost.y * this.cellSize + this.cellSize / 2,
                this.cellSize / 2,
                0, Math.PI * 2
            );
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }

        for (let i = 0; i < this.snake.length; i++) {
            const segment = this.snake[i];
            const colorIndex = Math.min(Math.floor(i / 3), this.snakeColors.length - 1);

            this.ctx.globalAlpha = this.boostMode ? 0.7 : 1;
            this.ctx.fillStyle = this.ghostMode ? '#9932CC' : this.snakeColors[colorIndex];

            if (i === 0) {
                this.ctx.fillRect(
                    segment.x * this.cellSize,
                    segment.y * this.cellSize,
                    this.cellSize + 2,
                    this.cellSize + 2
                );

                this.ctx.fillStyle = '#fff';
                this.ctx.fillRect(
                    segment.x * this.cellSize + 2,
                    segment.y * this.cellSize + 2,
                    4, 4
                );
                this.ctx.fillRect(
                    segment.x * this.cellSize + 8,
                    segment.y * this.cellSize + 2,
                    4, 4
                );
            } else {
                this.ctx.fillRect(
                    segment.x * this.cellSize,
                    segment.y * this.cellSize,
                    this.cellSize,
                    this.cellSize
                );
            }
        }
        this.ctx.globalAlpha = 1;

        for (const p of this.particles) {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, 60);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 35);
        this.ctx.fillText(`Level: ${this.level}`, 180, 35);
        this.ctx.fillText(`High: ${this.highScore}`, 300, 35);

        if (this.combo > 1) {
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillText(`Combo x${this.combo}`, 450, 35);
        }

        if (this.boostTimer > 0) {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.fillText('BOOST!', 20, 55);
        }

        if (this.ghostTimer > 0) {
            this.ctx.fillStyle = '#9932CC';
            this.ctx.fillText('GHOST MODE!', 120, 55);
        }

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('SNAKE III', this.width / 2, this.height / 2 - 80);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Use Arrow Keys or WASD to move', this.width / 2, this.height / 2 - 20);
            this.ctx.fillText('Hold SHIFT for speed boost', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Collect power-ups for special abilities', this.width / 2, this.height / 2 + 40);

            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 100);
        }

        if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 50);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2);
            this.ctx.fillText(`Level: ${this.level}`, this.width / 2, this.height / 2 + 35);

            if (this.score > this.highScore) {
                this.highScore = this.score;
                this.ctx.fillStyle = '#ffd700';
                this.ctx.fillText('NEW HIGH SCORE!', this.width / 2, this.height / 2 + 70);
            }

            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 120);
        }

        this.ctx.restore();
    }
}

window.Snake3Game = Snake3Game;
