const BreakoutHD = {
    canvas: null,
    ctx: null,
    paddle: null,
    ball: null,
    bricks: [],
    particles: [],
    powerups: [],
    score: 0,
    lives: 3,
    level: 1,
    gameOver: false,
    paused: false,
    keys: {},
    lastTime: 0,
    frameCount: 0,
    combo: 0,
    maxCombo: 0,
    totalBricks: 0,
    destroyedBricks: 0,
    brickColors: ['#ff4444', '#ff8844', '#ffff44', '#88ff44', '#44ffff', '#8844ff', '#ff44ff'],
    brickPatterns: [
        this.createStandardPattern(),
        this.createDiamondPattern(),
        this.createHeartPattern(),
        this.createPyramidPattern()
    ],

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

    createStandardPattern() {
        const pattern = [];
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 10; col++) {
                pattern.push({ row, col, color: this.brickColors[row % 7] });
            }
        }
        return pattern;
    },

    createDiamondPattern() {
        const pattern = [];
        for (let row = 0; row < 6; row++) {
            const offset = Math.abs(3 - row);
            for (let col = offset; col < 10 - offset; col++) {
                pattern.push({ row, col, color: this.brickColors[(row + col) % 7] });
            }
        }
        return pattern;
    },

    createHeartPattern() {
        const pattern = [];
        const heartShape = [
            [0,0,1,1,0,0,1,1,0,0],
            [0,1,1,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1],
            [0,1,1,1,1,1,1,1,1,0],
            [0,0,1,1,1,1,1,1,0,0],
            [0,0,0,1,1,1,1,0,0,0],
            [0,0,0,0,1,1,0,0,0,0]
        ];
        for (let row = 0; row < heartShape.length; row++) {
            for (let col = 0; col < heartShape[row].length; col++) {
                if (heartShape[row][col]) {
                    pattern.push({ row, col, color: this.brickColors[row % 7] });
                }
            }
        }
        return pattern;
    },

    createPyramidPattern() {
        const pattern = [];
        for (let row = 0; row < 6; row++) {
            const startCol = row;
            const endCol = 10 - row;
            for (let col = startCol; col < endCol; col++) {
                pattern.push({ row, col, color: this.brickColors[(row + col) % 7] });
            }
        }
        return pattern;
    },

    reset() {
        this.paddle = {
            x: 400,
            y: 550,
            width: 100,
            height: 15,
            speed: 8,
            color: '#00ff88'
        };

        this.ball = {
            x: 400,
            y: 540,
            radius: 10,
            vx: 4 * (Math.random() < 0.5 ? 1 : -1),
            vy: -5,
            speed: 5,
            maxSpeed: 12,
            attached: true,
            color: '#ffffff'
        };

        this.bricks = [];
        this.particles = [];
        this.powerups = [];
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.combo = 0;
        this.maxCombo = 0;
        this.frameCount = 0;

        this.loadLevel(this.level);
    },

    loadLevel(levelNum) {
        this.bricks = [];
        const patternIndex = (levelNum - 1) % this.brickPatterns.length;
        const pattern = this.brickPatterns[patternIndex];

        this.totalBricks = pattern.length;
        this.destroyedBricks = 0;

        const brickWidth = 70;
        const brickHeight = 25;
        const offsetX = (800 - 10 * brickWidth) / 2;
        const offsetY = 60;

        pattern.forEach(brick => {
            this.bricks.push({
                x: offsetX + brick.col * brickWidth + 5,
                y: offsetY + brick.row * brickHeight + 5,
                width: brickWidth - 10,
                height: brickHeight - 5,
                color: brick.color,
                health: levelNum > 3 ? 2 : 1,
                points: (pattern.length - brick.row) * 10,
                pattern: Math.random() < 0.1
            });
        });
    },

    createParticles(x, y, color, count = 15) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 6 + 2;
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
        if (Math.random() < 0.15) {
            const types = ['expand', 'multi', 'slow', 'laser'];
            const type = types[Math.floor(Math.random() * types.length)];
            this.powerups.push({
                x: x,
                y: y,
                width: 30,
                height: 15,
                vy: 2,
                type: type,
                color: type === 'expand' ? '#00ff00' :
                      type === 'multi' ? '#ffff00' :
                      type === 'slow' ? '#00ffff' : '#ff0000'
            });
        }
    },

    update(deltaTime) {
        if (this.gameOver || this.paused) return;

        this.frameCount++;

        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.paddle.x -= this.paddle.speed;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.paddle.x += this.paddle.speed;
        }

        this.paddle.x = Math.max(this.paddle.width / 2, Math.min(800 - this.paddle.width / 2, this.paddle.x));

        if (this.ball.attached) {
            this.ball.x = this.paddle.x;
            this.ball.y = this.paddle.y - this.paddle.height / 2 - this.ball.radius;

            if (this.keys['Space']) {
                this.ball.attached = false;
                this.ball.vx = (Math.random() - 0.5) * 4;
                this.ball.vy = -this.ball.speed;
            }
        } else {
            this.ball.x += this.ball.vx;
            this.ball.y += this.ball.vy;

            if (this.ball.x - this.ball.radius < 0) {
                this.ball.x = this.ball.radius;
                this.ball.vx = Math.abs(this.ball.vx);
            }
            if (this.ball.x + this.ball.radius > 800) {
                this.ball.x = 800 - this.ball.radius;
                this.ball.vx = -Math.abs(this.ball.vx);
            }

            if (this.ball.y - this.ball.radius < 0) {
                this.ball.y = this.ball.radius;
                this.ball.vy = Math.abs(this.ball.vy);
            }

            if (this.ball.y + this.ball.radius > 600) {
                this.lives--;
                this.createParticles(this.ball.x, this.ball.y, '#ff0000', 20);
                if (this.lives <= 0) {
                    this.gameOver = true;
                } else {
                    this.ball.attached = true;
                    this.ball.vx = 4 * (Math.random() < 0.5 ? 1 : -1);
                    this.ball.vy = -this.ball.speed;
                }
            }

            if (this.ball.y + this.ball.radius > this.paddle.y - this.paddle.height / 2 &&
                this.ball.y - this.ball.radius < this.paddle.y + this.paddle.height / 2 &&
                this.ball.x > this.paddle.x - this.paddle.width / 2 &&
                this.ball.x < this.paddle.x + this.paddle.width / 2 &&
                this.ball.vy > 0) {

                this.ball.y = this.paddle.y - this.paddle.height / 2 - this.ball.radius;
                
                const hitPos = (this.ball.x - this.paddle.x) / (this.paddle.width / 2);
                this.ball.vx = hitPos * 7;
                this.ball.vy = -Math.abs(this.ball.vy);
                this.ball.speed = Math.min(this.ball.maxSpeed, this.ball.speed + 0.05);

                this.combo = 0;
                this.createParticles(this.ball.x, this.ball.y, '#00ffff', 5);
            }

            this.bricks.forEach((brick, index) => {
                if (this.ball.x + this.ball.radius > brick.x &&
                    this.ball.x - this.ball.radius < brick.x + brick.width &&
                    this.ball.y + this.ball.radius > brick.y &&
                    this.ball.y - this.ball.radius < brick.y + brick.height) {

                    const overlapLeft = this.ball.x + this.ball.radius - brick.x;
                    const overlapRight = brick.x + brick.width - (this.ball.x - this.ball.radius);
                    const overlapTop = this.ball.y + this.ball.radius - brick.y;
                    const overlapBottom = brick.y + brick.height - (this.ball.y - this.ball.radius);

                    const minOverlapX = Math.min(overlapLeft, overlapRight);
                    const minOverlapY = Math.min(overlapTop, overlapBottom);

                    if (minOverlapX < minOverlapY) {
                        this.ball.vx = -this.ball.vx;
                    } else {
                        this.ball.vy = -this.ball.vy;
                    }

                    this.combo++;
                    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

                    brick.health--;
                    this.createParticles(this.ball.x, this.ball.y, brick.color, 8);

                    if (brick.health <= 0) {
                        this.score += brick.points * (1 + this.combo * 0.1);
                        this.destroyedBricks++;
                        this.spawnPowerup(brick.x + brick.width / 2, brick.y + brick.height / 2);
                        this.bricks.splice(index, 1);
                        this.createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 20);
                    }

                    return;
                }
            });

            if (this.bricks.length === 0) {
                this.level++;
                this.loadLevel(this.level);
                this.ball.attached = true;
                this.ball.speed = Math.min(10, 5 + this.level * 0.5);
            }
        }

        this.powerups.forEach((powerup, index) => {
            powerup.y += powerup.vy;

            if (powerup.y > 600) {
                this.powerups.splice(index, 1);
                return;
            }

            if (powerup.x > this.paddle.x - this.paddle.width / 2 &&
                powerup.x < this.paddle.x + this.paddle.width / 2 &&
                powerup.y > this.paddle.y - this.paddle.height / 2 &&
                powerup.y < this.paddle.y + this.paddle.height / 2) {

                if (powerup.type === 'expand') {
                    this.paddle.width = Math.min(200, this.paddle.width + 20);
                    setTimeout(() => { this.paddle.width = Math.max(60, this.paddle.width - 20); }, 5000);
                } else if (powerup.type === 'multi') {
                    for (let i = 0; i < 2; i++) {
                        this.balls = this.balls || [{ ball: this.ball }];
                    }
                } else if (powerup.type === 'slow') {
                    this.ball.vx *= 0.8;
                    this.ball.vy *= 0.8;
                }

                this.powerups.splice(index, 1);
                this.createParticles(powerup.x, powerup.y, powerup.color, 15);
            }
        });

        this.particles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1;
            particle.life -= particle.decay;
            if (particle.life <= 0) this.particles.splice(index, 1);
        });
    },

    draw() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, 600);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, 800, 600);

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 40; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * 15);
            this.ctx.lineTo(800, i * 15);
            this.ctx.stroke();
        }

        this.bricks.forEach(brick => {
            const gradient = this.ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
            gradient.addColorStop(0, brick.color);
            gradient.addColorStop(1, this.darkenColor(brick.color, 30));
            
            this.ctx.fillStyle = gradient;
            this.ctx.shadowColor = brick.color;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
            this.ctx.fill();
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(brick.x + 2, brick.y + 2, brick.width - 4, brick.height / 3);
            
            this.ctx.shadowBlur = 0;

            if (brick.health > 1) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(brick.health, brick.x + brick.width / 2, brick.y + brick.height / 2 + 4);
            }
        });

        this.powerups.forEach(powerup => {
            const pulse = Math.sin(this.frameCount * 0.1) * 2;
            this.ctx.fillStyle = powerup.color;
            this.ctx.shadowColor = powerup.color;
            this.ctx.shadowBlur = 15 + pulse;
            this.ctx.beginPath();
            this.ctx.roundRect(powerup.x - powerup.width / 2, powerup.y, powerup.width, powerup.height, 5);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            this.ctx.fillStyle = '#000000';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            const labels = { expand: 'W', multi: 'M', slow: 'S', laser: 'L' };
            this.ctx.fillText(labels[powerup.type] || '?', powerup.x, powerup.y + 10);
        });

        const paddleGradient = this.ctx.createLinearGradient(
            this.paddle.x - this.paddle.width / 2, this.paddle.y,
            this.paddle.x + this.paddle.width / 2, this.paddle.y
        );
        paddleGradient.addColorStop(0, '#006644');
        paddleGradient.addColorStop(0.5, '#00ff88');
        paddleGradient.addColorStop(1, '#006644');

        this.ctx.fillStyle = paddleGradient;
        this.ctx.shadowColor = '#00ff88';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.roundRect(
            this.paddle.x - this.paddle.width / 2,
            this.paddle.y - this.paddle.height / 2,
            this.paddle.width,
            this.paddle.height,
            5
        );
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        this.ctx.fillStyle = this.ball.color;
        this.ctx.shadowColor = this.ball.color;
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x - 3, this.ball.y - 3, this.ball.radius / 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color + Math.floor(particle.life * 255).toString(16).padStart(2, '0');
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${Math.floor(this.score)}`, 20, 30);
        this.ctx.fillText(`Lives: ${'❤️'.repeat(this.lives)}`, 20, 60);
        this.ctx.fillText(`Level: ${this.level}`, 20, 90);

        if (this.combo > 1) {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillText(`Combo x${this.combo}!`, 400, 30);
        }

        const progress = this.totalBricks > 0 ? this.destroyedBricks / this.totalBricks : 0;
        this.ctx.fillStyle = '#333344';
        this.ctx.fillRect(600, 20, 180, 15);
        this.ctx.fillStyle = '#00ff88';
        this.ctx.fillRect(600, 20, 180 * progress, 15);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`${Math.floor(progress * 100)}%`, 690, 33);

        if (this.ball.attached) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Press SPACE to launch', 400, 400);
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
            this.ctx.fillText(`Final Score: ${Math.floor(this.score)}`, 400, 300);
            this.ctx.fillText(`Level: ${this.level} | Max Combo: ${this.maxCombo}`, 400, 340);
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Click or press Enter to restart', 400, 400);
        }
    },

    darkenColor(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, (num >> 16) - amount);
        const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
        const b = Math.max(0, (num & 0x0000FF) - amount);
        return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    },

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime || 16;
        this.lastTime = timestamp;
        this.update(deltaTime);
        this.draw();
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BreakoutHD;
}