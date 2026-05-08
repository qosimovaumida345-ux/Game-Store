const SnakeClassic = {
    canvas: null,
    ctx: null,
    gridSize: 20,
    snake: [],
    food: null,
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    score: 0,
    highScore: 0,
    lives: 3,
    gameOver: false,
    paused: false,
    keys: {},
    gameSpeed: 100,
    lastMove: 0,
    obstacles: [],
    powerups: [],
    particles: [],
    frameCount: 0,
    bonusFood: null,
    levels: 1,
    scoreNeeded: 50,

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = canvasId;
            this.canvas.width = 600;
            this.canvas.height = 600;
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
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
            if (e.code === 'ArrowUp' || e.code === 'KeyW') {
                if (this.direction.y === 0) this.nextDirection = { x: 0, y: -1 };
            }
            if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                if (this.direction.y === 0) this.nextDirection = { x: 0, y: 1 };
            }
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                if (this.direction.x === 0) this.nextDirection = { x: -1, y: 0 };
            }
            if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                if (this.direction.x === 0) this.nextDirection = { x: 1, y: 0 };
            }
            if (e.code === 'KeyP') this.paused = !this.paused;
            if (e.code === 'Enter' && this.gameOver) this.reset();
        });
        this.canvas.addEventListener('click', () => {
            if (this.gameOver) this.reset();
        });
    },

    reset() {
        const startX = Math.floor(this.gridSize / 2);
        const startY = Math.floor(this.gridSize / 2);
        this.snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.spawnFood();
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.paused = false;
        this.obstacles = [];
        this.powerups = [];
        this.particles = [];
        this.levels = 1;
        this.gameSpeed = 100;
        this.bonusFood = null;
        this.frameCount = 0;
        this.scoreNeeded = 50;
    },

    spawnFood() {
        let validPosition = false;
        let x, y;
        while (!validPosition) {
            x = Math.floor(Math.random() * (this.gridSize - 2)) + 1;
            y = Math.floor(Math.random() * (this.gridSize - 2)) + 1;
            validPosition = !this.snake.some(seg => seg.x === x && seg.y === y) &&
                          !this.obstacles.some(obs => obs.x === x && obs.y === y);
        }
        this.food = { x: x, y: y, type: 'normal' };

        if (Math.random() < 0.1 && this.powerups.length === 0) {
            let bx, by;
            let validBonus = false;
            while (!validBonus) {
                bx = Math.floor(Math.random() * (this.gridSize - 2)) + 1;
                by = Math.floor(Math.random() * (this.gridSize - 2)) + 1;
                validBonus = !this.snake.some(seg => seg.x === bx && seg.y === by) &&
                            !this.obstacles.some(obs => obs.x === bx && obs.y === by);
            }
            this.bonusFood = { x: bx, y: by, timer: 300, type: Math.random() < 0.5 ? 'slow' : 'double' };
        }

        if (Math.random() < 0.2 && this.score > 30) {
            let px, py;
            let validPowerup = false;
            while (!validPowerup) {
                px = Math.floor(Math.random() * (this.gridSize - 2)) + 1;
                py = Math.floor(Math.random() * (this.gridSize - 2)) + 1;
                validPowerup = !this.snake.some(seg => seg.x === px && seg.y === py) &&
                              !this.obstacles.some(obs => obs.x === px && obs.y === py);
            }
            this.powerups.push({ x: px, y: py, type: 'shrink', timer: 200 });
        }
    },

    spawnObstacles() {
        if (this.levels > 1 && this.obstacles.length < 5) {
            const count = Math.min(this.levels * 2, 10);
            while (this.obstacles.length < count) {
                const x = Math.floor(Math.random() * (this.gridSize - 2)) + 1;
                const y = Math.floor(Math.random() * (this.gridSize - 2)) + 1;
                if (!this.snake.some(seg => seg.x === x && seg.y === y) &&
                    !this.obstacles.some(obs => obs.x === x && obs.y === y)) {
                    this.obstacles.push({ x, y });
                }
            }
        }
    },

    createParticles(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1,
                color: color,
                size: Math.random() * 4 + 2
            });
        }
    },

    update(timestamp) {
        if (this.gameOver || this.paused) return;

        this.frameCount++;
        this.direction = this.nextDirection;

        if (timestamp - this.lastMove < this.gameSpeed) return;
        this.lastMove = timestamp;

        const head = this.snake[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };

        if (newHead.x < 0 || newHead.x >= this.gridSize || newHead.y < 0 || newHead.y >= this.gridSize) {
            this.lives--;
            this.createParticles(head.x * 30 + 15, head.y * 30 + 15, '#ff0000', 15);
            if (this.lives <= 0) {
                this.gameOver = true;
            } else {
                this.snake.unshift(newHead);
                this.snake.pop();
                this.direction = { x: -this.direction.x, y: -this.direction.y };
                this.nextDirection = this.direction;
            }
            return;
        }

        if (this.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
            this.lives--;
            this.createParticles(newHead.x * 30 + 15, newHead.y * 30 + 15, '#ff0000', 15);
            if (this.lives <= 0) {
                this.gameOver = true;
            } else {
                this.direction = { x: -this.direction.x, y: -this.direction.y };
                this.nextDirection = this.direction;
            }
            return;
        }

        if (this.obstacles.some(obs => obs.x === newHead.x && obs.y === newHead.y)) {
            this.lives--;
            this.createParticles(newHead.x * 30 + 15, newHead.y * 30 + 15, '#ff0000', 15);
            if (this.lives <= 0) {
                this.gameOver = true;
            } else {
                this.direction = { x: -this.direction.x, y: -this.direction.y };
                this.nextDirection = this.direction;
            }
            return;
        }

        this.snake.unshift(newHead);

        let ate = false;
        if (newHead.x === this.food.x && newHead.y === this.food.y) {
            this.score += 10;
            ate = true;
            this.createParticles(this.food.x * 30 + 15, this.food.y * 30 + 15, '#00ff00', 20);
            this.spawnFood();
            this.checkLevelUp();
        }

        if (this.bonusFood && newHead.x === this.bonusFood.x && newHead.y === this.bonusFood.y) {
            if (this.bonusFood.type === 'slow') {
                this.gameSpeed = Math.min(200, this.gameSpeed + 30);
            } else {
                this.score += 25;
            }
            this.createParticles(this.bonusFood.x * 30 + 15, this.bonusFood.y * 30 + 15, '#ffff00', 25);
            this.bonusFood = null;
            ate = true;
        }

        if (!ate) {
            this.snake.pop();
        }

        this.powerups.forEach((powerup, index) => {
            if (newHead.x === powerup.x && newHead.y === powerup.y) {
                if (powerup.type === 'shrink' && this.snake.length > 3) {
                    for (let i = 0; i < 3; i++) {
                        const tail = this.snake.pop();
                        this.createParticles(tail.x * 30 + 15, tail.y * 30 + 15, '#00ffff', 5);
                    }
                }
                this.powerups.splice(index, 1);
            }
            powerup.timer--;
            if (powerup.timer <= 0) {
                this.powerups.splice(index, 1);
            }
        });

        if (this.bonusFood) {
            this.bonusFood.timer--;
            if (this.bonusFood.timer <= 0) {
                this.bonusFood = null;
            }
        }

        this.particles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;
            if (particle.life <= 0) this.particles.splice(index, 1);
        });
    },

    checkLevelUp() {
        if (this.score >= this.scoreNeeded) {
            this.levels++;
            this.gameSpeed = Math.max(50, 100 - this.levels * 10);
            this.scoreNeeded += this.levels * 50;
            this.spawnObstacles();
            this.createParticles(this.canvas.width / 2, this.canvas.height / 2, '#ffffff', 50);
        }
    },

    draw() {
        const cellSize = this.canvas.width / this.gridSize;

        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.gridSize; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * cellSize, 0);
            this.ctx.lineTo(i * cellSize, this.canvas.height);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * cellSize);
            this.ctx.lineTo(this.canvas.width, i * cellSize);
            this.ctx.stroke();
        }

        this.obstacles.forEach(obs => {
            this.ctx.fillStyle = '#444466';
            this.ctx.fillRect(obs.x * cellSize + 2, obs.y * cellSize + 2, cellSize - 4, cellSize - 4);
            this.ctx.fillStyle = '#666688';
            this.ctx.fillRect(obs.x * cellSize + 5, obs.y * cellSize + 5, cellSize - 10, cellSize - 10);
        });

        this.powerups.forEach(powerup => {
            const pulse = Math.sin(this.frameCount * 0.1) * 2;
            this.ctx.fillStyle = '#00ffff';
            this.ctx.shadowColor = '#00ffff';
            this.ctx.shadowBlur = 10 + pulse;
            this.ctx.beginPath();
            this.ctx.arc(powerup.x * cellSize + cellSize / 2, powerup.y * cellSize + cellSize / 2, cellSize / 3 + pulse, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });

        if (this.bonusFood) {
            const pulse = Math.sin(this.frameCount * 0.15) * 3;
            this.ctx.fillStyle = '#ffff00';
            this.ctx.shadowColor = '#ffff00';
            this.ctx.shadowBlur = 15 + pulse;
            this.ctx.beginPath();
            this.ctx.arc(this.bonusFood.x * cellSize + cellSize / 2, this.bonusFood.y * cellSize + cellSize / 2, cellSize / 2.5 + pulse, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            const remaining = Math.ceil(this.bonusFood.timer / 60);
            this.ctx.fillStyle = '#000000';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(remaining, this.bonusFood.x * cellSize + cellSize / 2, this.bonusFood.y * cellSize + cellSize / 2 + 4);
        }

        if (this.food) {
            const pulse = Math.sin(this.frameCount * 0.1) * 2;
            this.ctx.fillStyle = '#ff4444';
            this.ctx.shadowColor = '#ff4444';
            this.ctx.shadowBlur = 10 + pulse;
            this.ctx.beginPath();
            this.ctx.arc(this.food.x * cellSize + cellSize / 2, this.food.y * cellSize + cellSize / 2, cellSize / 3 + pulse, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(this.food.x * cellSize + cellSize / 2 - 2, this.food.y * cellSize + cellSize / 2 - 2, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.snake.forEach((segment, index) => {
            const isHead = index === 0;
            const hue = 120 - (index / this.snake.length) * 60;
            this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            this.ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
            this.ctx.shadowBlur = isHead ? 15 : 5;

            const padding = isHead ? 1 : 2;
            this.ctx.beginPath();
            this.ctx.roundRect(
                segment.x * cellSize + padding,
                segment.y * cellSize + padding,
                cellSize - padding * 2,
                cellSize - padding * 2,
                4
            );
            this.ctx.fill();

            if (isHead) {
                this.ctx.fillStyle = '#000000';
                const eyeOffset = this.direction.x !== 0 ? { x: 0, y: 3 } : { x: 3, y: 0 };
                this.ctx.beginPath();
                this.ctx.arc(
                    segment.x * cellSize + cellSize / 2 + eyeOffset.x * (this.direction.x !== 0 ? 1 : -1),
                    segment.y * cellSize + cellSize / 2 + eyeOffset.y * (this.direction.y !== 0 ? 1 : -1),
                    3, 0, Math.PI * 2
                );
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(
                    segment.x * cellSize + cellSize / 2 - eyeOffset.x * (this.direction.x !== 0 ? 1 : -1),
                    segment.y * cellSize + cellSize / 2 - eyeOffset.y * (this.direction.y !== 0 ? 1 : -1),
                    3, 0, Math.PI * 2
                );
                this.ctx.fill();
            }

            this.ctx.shadowBlur = 0;
        });

        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color + Math.floor(particle.life * 255).toString(16).padStart(2, '0');
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
        this.ctx.fillText(`Lives: ${'❤️'.repeat(this.lives)}`, 20, 55);
        this.ctx.fillText(`Level: ${this.levels}`, 20, 80);

        const progress = this.score / this.scoreNeeded;
        this.ctx.fillStyle = '#333344';
        this.ctx.fillRect(20, 100, 150, 10);
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(20, 100, 150 * progress, 10);

        if (this.paused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Press P to continue', this.canvas.width / 2, this.canvas.height / 2 + 30);
        }

        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ff4444';
            this.ctx.font = '36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Click or press Enter to restart', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }

        this.ctx.textAlign = 'left';
    },

    gameLoop(timestamp) {
        this.update(timestamp);
        this.draw();
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SnakeClassic;
}