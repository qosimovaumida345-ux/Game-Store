const PinballMagic = {
    canvas: null,
    ctx: null,
    ball: null,
    paddleLeft: null,
    paddleRight: null,
    bumpers: [],
    targets: [],
    flippers: [],
    score: 0,
    balls: 3,
    gameOver: false,
    paused: false,
    keys: {},
    lastTime: 0,
    frameCount: 0,
    gravity: 0.15,
    tableWidth: 500,
    tableHeight: 700,
    offsetX: 150,
    offsetY: 50,
    particles: [],
    trails: [],
    multiplier: 1,
    comboTimer: 0,

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = canvasId;
            this.canvas.width = 800;
            this.canvas.height = 800;
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
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys['leftPaddle'] = true;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys['rightPaddle'] = true;
            if (e.code === 'Space') e.preventDefault();
            if (e.code === 'KeyP') this.paused = !this.paused;
            if (e.code === 'Enter' && this.gameOver) this.reset();
        });
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys['leftPaddle'] = false;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys['rightPaddle'] = false;
        });
        this.canvas.addEventListener('click', () => {
            if (this.gameOver) this.reset();
        });
    },

    reset() {
        this.ball = {
            x: 400,
            y: 300,
            vx: (Math.random() - 0.5) * 4,
            vy: -3,
            radius: 8,
            launched: true
        };

        this.paddleLeft = {
            x: 200,
            y: 650,
            width: 80,
            height: 15,
            angle: 0.4,
            targetAngle: 0.4,
            speed: 0.15
        };

        this.paddleRight = {
            x: 600,
            y: 650,
            width: 80,
            height: 15,
            angle: Math.PI - 0.4,
            targetAngle: Math.PI - 0.4,
            speed: 0.15
        };

        this.bumpers = [];
        for (let i = 0; i < 8; i++) {
            this.bumpers.push({
                x: 200 + Math.random() * 400,
                y: 150 + Math.random() * 300,
                radius: 25 + Math.random() * 15,
                color: ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff'][i % 6],
                points: 50 + i * 10,
                flash: 0,
                hitCount: 0
            });
        }

        this.targets = [];
        for (let i = 0; i < 5; i++) {
            this.targets.push({
                x: 250 + i * 60,
                y: 100,
                width: 40,
                height: 20,
                active: true,
                points: 100 * (i + 1)
            });
        }

        this.flippers = [
            { x: 250, y: 650, angle: 0.5, targetAngle: 0.5, length: 60 },
            { x: 550, y: 650, angle: Math.PI - 0.5, targetAngle: Math.PI - 0.5, length: 60 }
        ];

        this.score = 0;
        this.balls = 3;
        this.gameOver = false;
        this.paused = false;
        this.particles = [];
        this.trails = [];
        this.multiplier = 1;
        this.comboTimer = 0;
        this.frameCount = 0;
    },

    createParticles(x, y, color, count = 10) {
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

    update(deltaTime) {
        if (this.gameOver || this.paused) return;

        this.frameCount++;

        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) {
                this.multiplier = 1;
            }
        }

        this.paddleLeft.targetAngle = this.keys['leftPaddle'] ? 0.1 : 0.5;
        this.paddleRight.targetAngle = this.keys['rightPaddle'] ? Math.PI - 0.1 : Math.PI - 0.5;

        this.paddleLeft.angle += (this.paddleLeft.targetAngle - this.paddleLeft.angle) * this.paddleLeft.speed * 60;
        this.paddleRight.angle += (this.paddleRight.targetAngle - this.paddleRight.angle) * this.paddleRight.speed * 60;

        this.flippers[0].angle += (this.flippers[0].targetAngle - this.flippers[0].angle) * 0.3;
        this.flippers[1].angle += (this.flippers[1].targetAngle - this.flippers[1].angle) * 0.3;

        if (this.keys['leftPaddle'] || this.keys['ArrowLeft']) {
            this.flippers[0].targetAngle = -0.3;
            this.flippers[1].targetAngle = Math.PI + 0.3;
        } else {
            this.flippers[0].targetAngle = 0.5;
            this.flippers[1].targetAngle = Math.PI - 0.5;
        }

        if (this.ball.launched) {
            this.ball.vy += this.gravity;
            this.ball.x += this.ball.vx;
            this.ball.y += this.ball.vy;

            if (this.ball.trail) {
                this.trails.push({
                    x: this.ball.x,
                    y: this.ball.y,
                    life: 1
                });
            }

            if (this.ball.x < this.offsetX + this.ball.radius) {
                this.ball.x = this.offsetX + this.ball.radius;
                this.ball.vx *= -0.9;
            }
            if (this.ball.x > this.offsetX + this.tableWidth - this.ball.radius) {
                this.ball.x = this.offsetX + this.tableWidth - this.ball.radius;
                this.ball.vx *= -0.9;
            }

            if (this.ball.y < this.offsetY + this.ball.radius) {
                this.ball.y = this.offsetY + this.ball.radius;
                this.ball.vy *= -0.9;
            }

            if (this.ball.y > this.offsetY + this.tableHeight) {
                this.balls--;
                this.createParticles(this.ball.x, this.ball.y, '#ff0000', 20);
                if (this.balls <= 0) {
                    this.gameOver = true;
                } else {
                    this.ball.x = 250 + Math.random() * 200;
                    this.ball.y = 200;
                    this.ball.vx = (Math.random() - 0.5) * 4;
                    this.ball.vy = -5;
                }
            }

            this.bumpers.forEach(bumper => {
                const dx = this.ball.x - bumper.x;
                const dy = this.ball.y - bumper.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < bumper.radius + this.ball.radius) {
                    const angle = Math.atan2(dy, dx);
                    const speed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);
                    const newSpeed = Math.min(speed * 1.2, 12);

                    this.ball.vx = Math.cos(angle) * newSpeed;
                    this.ball.vy = Math.sin(angle) * newSpeed;

                    this.ball.x = bumper.x + Math.cos(angle) * (bumper.radius + this.ball.radius + 1);
                    this.ball.y = bumper.y + Math.sin(angle) * (bumper.radius + this.ball.radius + 1);

                    bumper.flash = 10;
                    bumper.hitCount++;
                    this.score += bumper.points * this.multiplier;
                    this.comboTimer = 60;
                    this.createParticles(bumper.x, bumper.y, bumper.color, 15);
                }

                if (bumper.flash > 0) bumper.flash--;
            });

            this.targets.forEach(target => {
                if (target.active &&
                    this.ball.x > target.x && this.ball.x < target.x + target.width &&
                    this.ball.y > target.y && this.ball.y < target.y + target.height) {
                    
                    target.active = false;
                    this.score += target.points * this.multiplier;
                    this.multiplier = Math.min(5, this.multiplier + 0.5);
                    this.comboTimer = 120;
                    this.createParticles(target.x + target.width / 2, target.y + target.height / 2, '#ffff00', 20);

                    setTimeout(() => { target.active = true; }, 3000);
                }
            });

            const leftPaddleX = this.paddleLeft.x + Math.cos(this.paddleLeft.angle) * (this.paddleLeft.width / 2);
            const leftPaddleY = this.paddleLeft.y + Math.sin(this.paddleLeft.angle) * (this.paddleLeft.width / 2);
            
            if (this.checkPaddleCollision(leftPaddleX, leftPaddleY, this.paddleLeft, this.ball)) {
                const speed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);
                this.ball.vy = -Math.abs(this.ball.vy) - 3;
                this.ball.vx += (this.ball.x - this.paddleLeft.x) * 0.15;
                this.ball.vy = Math.min(this.ball.vy, -8);
                this.createParticles(this.ball.x, this.ball.y, '#00ff88', 10);
            }

            const rightPaddleX = this.paddleRight.x + Math.cos(this.paddleRight.angle) * (this.paddleRight.width / 2);
            const rightPaddleY = this.paddleRight.y + Math.sin(this.paddleRight.angle) * (this.paddleRight.width / 2);

            if (this.checkPaddleCollision(rightPaddleX, rightPaddleY, this.paddleRight, this.ball)) {
                const speed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);
                this.ball.vy = -Math.abs(this.ball.vy) - 3;
                this.ball.vx += (this.ball.x - this.paddleRight.x) * 0.15;
                this.ball.vy = Math.min(this.ball.vy, -8);
                this.createParticles(this.ball.x, this.ball.y, '#00ff88', 10);
            }

            this.flippers.forEach(flipper => {
                const flipperEndX = flipper.x + Math.cos(flipper.angle) * flipper.length;
                const flipperEndY = flipper.y + Math.sin(flipper.angle) * flipper.length;

                const dx = this.ball.x - flipper.x;
                const dy = this.ball.y - flipper.y;
                const length = Math.sqrt(dx * dx + dy * dy);

                if (length < flipper.length + this.ball.radius) {
                    const angle = Math.atan2(dy, dx);
                    const dotProduct = Math.cos(flipper.angle - angle);
                    
                    if (dotProduct > 0.5) {
                        const speed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);
                        const bounceSpeed = Math.min(speed * 1.1 + 3, 12);
                        
                        this.ball.vx = Math.cos(flipper.angle - 0.3) * bounceSpeed;
                        this.ball.vy = -Math.abs(Math.sin(flipper.angle - 0.3) * bounceSpeed) - 2;
                        
                        this.ball.y = flipper.y - this.ball.radius - 5;
                        this.createParticles(this.ball.x, this.ball.y, '#00ff88', 8);
                        this.score += 25 * this.multiplier;
                    }
                }
            });

            const drainLeftX = this.offsetX + 200;
            const drainLeftY = this.offsetY + this.tableHeight - 20;
            const drainRightX = this.offsetX + this.tableWidth - 200;
            const drainRightY = this.offsetY + this.tableHeight - 20;

            const betweenDrains = this.ball.x > drainLeftX && this.ball.x < drainRightX;
            if (betweenDrains && this.ball.y > drainLeftY) {
                this.balls--;
                this.createParticles(this.ball.x, this.ball.y, '#ff0000', 30);
                if (this.balls <= 0) {
                    this.gameOver = true;
                } else {
                    this.ball.x = 250 + Math.random() * 200;
                    this.ball.y = 200;
                    this.ball.vx = (Math.random() - 0.5) * 4;
                    this.ball.vy = -5;
                }
            }
        }

        this.particles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1;
            particle.life -= 0.02;
            if (particle.life <= 0) this.particles.splice(index, 1);
        });

        this.trails.forEach((trail, index) => {
            trail.life -= 0.05;
            if (trail.life <= 0) this.trails.splice(index, 1);
        });
    },

    checkPaddleCollision(paddleX, paddleY, paddle, ball) {
        const dx = ball.x - paddleX;
        const dy = ball.y - paddleY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        return dist < paddle.width / 2 + ball.radius && ball.vy > 0;
    },

    draw() {
        this.ctx.fillStyle = '#0a0a20';
        this.ctx.fillRect(0, 0, 800, 800);

        const tableGradient = this.ctx.createLinearGradient(this.offsetX, this.offsetY, this.offsetX, this.offsetY + this.tableHeight);
        tableGradient.addColorStop(0, '#1a1a4e');
        tableGradient.addColorStop(0.5, '#2a2a6e');
        tableGradient.addColorStop(1, '#1a1a4e');
        
        this.ctx.fillStyle = tableGradient;
        this.ctx.beginPath();
        this.ctx.roundRect(this.offsetX, this.offsetY, this.tableWidth, this.tableHeight, 20);
        this.ctx.fill();

        this.ctx.strokeStyle = '#4a4a8e';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 10; i++) {
            this.ctx.beginPath();
            this.ctx.arc(this.offsetX + this.tableWidth / 2, this.offsetY + this.tableHeight, 100 + i * 50, Math.PI, 0);
            this.ctx.stroke();
        }

        this.bumpers.forEach(bumper => {
            const flashIntensity = bumper.flash > 0 ? bumper.flash / 10 : 0;
            
            const gradient = this.ctx.createRadialGradient(bumper.x, bumper.y, 0, bumper.x, bumper.y, bumper.radius);
            gradient.addColorStop(0, bumper.color);
            gradient.addColorStop(1, this.darkenColor(bumper.color, 50));

            this.ctx.fillStyle = gradient;
            this.ctx.shadowColor = bumper.color;
            this.ctx.shadowBlur = 15 + flashIntensity * 20;
            this.ctx.beginPath();
            this.ctx.arc(bumper.x, bumper.y, bumper.radius, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.beginPath();
            this.ctx.arc(bumper.x - bumper.radius * 0.3, bumper.y - bumper.radius * 0.3, bumper.radius * 0.3, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(bumper.points, bumper.x, bumper.y + 5);
            this.ctx.shadowBlur = 0;
        });

        this.targets.forEach(target => {
            if (target.active) {
                this.ctx.fillStyle = '#ffff00';
                this.ctx.shadowColor = '#ffff00';
                this.ctx.shadowBlur = 10;
            } else {
                this.ctx.fillStyle = '#666666';
                this.ctx.shadowBlur = 0;
            }
            this.ctx.fillRect(target.x, target.y, target.width, target.height);
            
            if (target.active) {
                this.ctx.fillStyle = '#000000';
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(target.points, target.x + target.width / 2, target.y + 14);
            }
            this.ctx.shadowBlur = 0;
        });

        this.ctx.fillStyle = '#333355';
        this.ctx.beginPath();
        this.ctx.arc(this.offsetX + 250, this.offsetY + 200, 30, 0, Math.PI * 2);
        this.ctx.arc(this.offsetX + 350, this.offsetY + 250, 25, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 8;
        this.ctx.lineCap = 'round';

        this.ctx.save();
        this.ctx.translate(this.paddleLeft.x, this.paddleLeft.y);
        this.ctx.rotate(this.paddleLeft.angle);
        this.ctx.fillStyle = '#00ff88';
        this.ctx.shadowColor = '#00ff88';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.roundRect(-this.paddleLeft.width / 2, -this.paddleLeft.height / 2, this.paddleLeft.width, this.paddleLeft.height, 5);
        this.ctx.fill();
        this.ctx.restore();

        this.ctx.save();
        this.ctx.translate(this.paddleRight.x, this.paddleRight.y);
        this.ctx.rotate(this.paddleRight.angle);
        this.ctx.fillStyle = '#00ff88';
        this.ctx.shadowColor = '#00ff88';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.roundRect(-this.paddleRight.width / 2, -this.paddleRight.height / 2, this.paddleRight.width, this.paddleRight.height, 5);
        this.ctx.fill();
        this.ctx.restore();

        this.flippers.forEach(flipper => {
            this.ctx.save();
            this.ctx.translate(flipper.x, flipper.y);
            this.ctx.rotate(flipper.angle);

            const gradient = this.ctx.createLinearGradient(0, -5, 0, 5);
            gradient.addColorStop(0, '#00ff88');
            gradient.addColorStop(1, '#008844');

            this.ctx.fillStyle = gradient;
            this.ctx.shadowColor = '#00ff88';
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.roundRect(0, -5, flipper.length, 10, 3);
            this.ctx.fill();
            this.ctx.restore();
        });

        this.ctx.fillStyle = '#ff4444';
        this.ctx.beginPath();
        this.ctx.moveTo(this.offsetX + 220, this.offsetY + this.tableHeight - 50);
        this.ctx.lineTo(this.offsetX + 200, this.offsetY + this.tableHeight);
        this.ctx.lineTo(this.offsetX + 250, this.offsetY + this.tableHeight);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = '#ff4444';
        this.ctx.beginPath();
        this.ctx.moveTo(this.offsetX + this.tableWidth - 220, this.offsetY + this.tableHeight - 50);
        this.ctx.lineTo(this.offsetX + this.tableWidth - 200, this.offsetY + this.tableHeight);
        this.ctx.lineTo(this.offsetX + this.tableWidth - 250, this.offsetY + this.tableHeight);
        this.ctx.closePath();
        this.ctx.fill();

        this.trails.forEach(trail => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${trail.life * 0.5})`;
            this.ctx.beginPath();
            this.ctx.arc(trail.x, trail.y, 4 * trail.life, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color + Math.floor(particle.life * 255).toString(16).padStart(2, '0');
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
            this.ctx.fill();
        });

        if (this.ball.launched) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.shadowColor = '#ffffff';
            this.ctx.shadowBlur = 15;
            this.ctx.beginPath();
            this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.beginPath();
            this.ctx.arc(this.ball.x - 2, this.ball.y - 2, this.ball.radius / 2, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${Math.floor(this.score)}`, 20, 30);

        if (this.multiplier > 1) {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.fillText(`x${this.multiplier.toFixed(1)}`, 200, 30);
        }

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Balls: ${'🔴'.repeat(this.balls)}`, 20, 60);

        this.ctx.fillStyle = '#aaaaaa';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Controls: A/D or Arrow Keys to move paddle', 400, 780);

        if (this.paused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, 800, 800);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', 400, 380);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Press P to resume', 400, 430);
        }

        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            this.ctx.fillRect(0, 0, 800, 800);
            this.ctx.fillStyle = '#ff4444';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', 400, 350);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '28px Arial';
            this.ctx.fillText(`Final Score: ${Math.floor(this.score)}`, 400, 400);
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Click or press Enter to restart', 400, 460);
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
    module.exports = PinballMagic;
}