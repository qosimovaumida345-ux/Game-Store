const AsteroidsSpace = {
    canvas: null,
    ctx: null,
    ship: null,
    asteroids: [],
    bullets: [],
    particles: [],
    stars: [],
    score: 0,
    highScore: 0,
    lives: 3,
    level: 1,
    waveNumber: 1,
    gameOver: false,
    paused: false,
    keys: {},
    lastShot: 0,
    frameCount: 0,
    screenShake: 0,
    thrusterParticles: [],

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

    reset() {
        this.ship = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: 15,
            angle: -Math.PI / 2,
            speed: 0,
            maxSpeed: 7,
            acceleration: 0.15,
            friction: 0.99,
            rotationSpeed: 0.08,
            thrusting: false,
            invulnerable: false,
            invulnerableTimer: 0
        };
        this.bullets = [];
        this.particles = [];
        this.thrusterParticles = [];
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.waveNumber = 1;
        this.gameOver = false;
        this.paused = false;
        this.lastShot = 0;
        this.frameCount = 0;
        this.screenShake = 0;
        this.spawnWave();
    },

    createStars() {
        this.stars = [];
        for (let i = 0; i < 150; i++) {
            this.stars.push({
                x: Math.random() * 800,
                y: Math.random() * 600,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 0.5 + 0.2,
                brightness: Math.random()
            });
        }
    },

    spawnWave() {
        const count = 3 + this.level * 2;
        for (let i = 0; i < count; i++) {
            let x, y;
            const edge = Math.floor(Math.random() * 4);
            if (edge === 0) { x = Math.random() * 800; y = -30; }
            else if (edge === 1) { x = 800 + 30; y = Math.random() * 600; }
            else if (edge === 2) { x = Math.random() * 800; y = 600 + 30; }
            else { x = -30; y = Math.random() * 600; }

            const size = Math.random() < 0.3 ? 'large' : Math.random() < 0.6 ? 'medium' : 'small';
            const radius = size === 'large' ? 50 : size === 'medium' ? 30 : 15;
            
            this.asteroids.push({
                x: x,
                y: y,
                radius: radius,
                speed: Math.random() * 2 + 1 + this.level * 0.3,
                angle: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.05,
                vertices: this.generateAsteroidVertices(radius),
                size: size
            });
        }
    },

    generateAsteroidVertices(radius) {
        const vertices = [];
        const numVertices = Math.floor(Math.random() * 5) + 8;
        for (let i = 0; i < numVertices; i++) {
            const angle = (Math.PI * 2 / numVertices) * i;
            const variance = 0.7 + Math.random() * 0.6;
            vertices.push({
                x: Math.cos(angle) * radius * variance,
                y: Math.sin(angle) * radius * variance
            });
        }
        return vertices;
    },

    shoot() {
        const now = Date.now();
        if (now - this.lastShot < 200) return;
        this.lastShot = now;

        this.bullets.push({
            x: this.ship.x + Math.cos(this.ship.angle) * 20,
            y: this.ship.y + Math.sin(this.ship.angle) * 20,
            vx: Math.cos(this.ship.angle) * 10 + this.ship.speed * 0.5,
            vy: Math.sin(this.ship.angle) * 10 + this.ship.speed * 0.5,
            life: 60,
            radius: 3
        });
    },

    createExplosion(x, y, radius, color, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: Math.random() * 0.02 + 0.01,
                color: color,
                size: Math.random() * 4 + 2
            });
        }
        this.screenShake = radius * 0.3;
    },

    createThrusterParticle() {
        const offset = -25;
        this.thrusterParticles.push({
            x: this.ship.x + Math.cos(this.ship.angle + Math.PI) * 10,
            y: this.ship.y + Math.sin(this.ship.angle + Math.PI) * 10,
            vx: Math.cos(this.ship.angle + Math.PI + (Math.random() - 0.5)) * 3,
            vy: Math.sin(this.ship.angle + Math.PI + (Math.random() - 0.5)) * 3,
            life: 1,
            decay: 0.05,
            size: Math.random() * 3 + 1,
            color: Math.random() < 0.5 ? '#ff6600' : '#ffff00'
        });
    },

    update() {
        if (this.gameOver || this.paused) return;

        this.frameCount++;

        if (this.ship.invulnerable) {
            this.ship.invulnerableTimer--;
            if (this.ship.invulnerableTimer <= 0) {
                this.ship.invulnerable = false;
            }
        }

        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.ship.angle -= this.ship.rotationSpeed;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.ship.angle += this.ship.rotationSpeed;
        }

        this.ship.thrusting = false;
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.ship.thrusting = true;
            this.ship.speed += this.ship.acceleration;
            if (this.ship.speed > this.ship.maxSpeed) {
                this.ship.speed = this.ship.maxSpeed;
            }
            if (this.frameCount % 2 === 0) {
                this.createThrusterParticle();
            }
        } else {
            this.ship.speed *= this.ship.friction;
        }

        if (this.keys['Space']) {
            this.shoot();
        }

        this.ship.x += Math.cos(this.ship.angle) * this.ship.speed;
        this.ship.y += Math.sin(this.ship.angle) * this.ship.speed;

        if (this.ship.x < -20) this.ship.x = 820;
        if (this.ship.x > 820) this.ship.x = -20;
        if (this.ship.y < -20) this.ship.y = 620;
        if (this.ship.y > 620) this.ship.y = -20;

        this.bullets.forEach((bullet, index) => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.life--;

            if (bullet.x < 0 || bullet.x > 800 || bullet.y < 0 || bullet.y > 600 || bullet.life <= 0) {
                this.bullets.splice(index, 1);
            }
        });

        this.asteroids.forEach((asteroid, aIndex) => {
            asteroid.x += Math.cos(asteroid.angle) * asteroid.speed;
            asteroid.y += Math.sin(asteroid.angle) * asteroid.speed;
            asteroid.angle += asteroid.rotationSpeed;

            if (asteroid.x < -60) asteroid.x = 860;
            if (asteroid.x > 860) asteroid.x = -60;
            if (asteroid.y < -60) asteroid.y = 660;
            if (asteroid.y > 660) asteroid.y = -60;

            if (!this.ship.invulnerable && this.checkCollision(this.ship, asteroid)) {
                this.lives--;
                this.createExplosion(this.ship.x, this.ship.y, 30, '#00ffff', 30);
                this.screenShake = 20;
                if (this.lives <= 0) {
                    this.gameOver = true;
                } else {
                    this.ship.x = this.canvas.width / 2;
                    this.ship.y = this.canvas.height / 2;
                    this.ship.speed = 0;
                    this.ship.angle = -Math.PI / 2;
                    this.ship.invulnerable = true;
                    this.ship.invulnerableTimer = 180;
                }
            }

            this.bullets.forEach((bullet, bIndex) => {
                if (this.checkCollision(bullet, asteroid)) {
                    this.createExplosion(asteroid.x, asteroid.y, asteroid.radius, '#ff8844', 15);
                    this.bullets.splice(bIndex, 1);

                    const points = asteroid.size === 'large' ? 20 : asteroid.size === 'medium' ? 50 : 100;
                    this.score += points;

                    if (asteroid.size === 'large') {
                        for (let i = 0; i < 2; i++) {
                            const newSize = 'medium';
                            const newRadius = 30;
                            this.asteroids.push({
                                x: asteroid.x + (Math.random() - 0.5) * 20,
                                y: asteroid.y + (Math.random() - 0.5) * 20,
                                radius: newRadius,
                                speed: asteroid.speed + 1,
                                angle: asteroid.angle + (Math.random() - 0.5),
                                rotationSpeed: (Math.random() - 0.5) * 0.08,
                                vertices: this.generateAsteroidVertices(newRadius),
                                size: newSize
                            });
                        }
                    } else if (asteroid.size === 'medium') {
                        for (let i = 0; i < 2; i++) {
                            const newSize = 'small';
                            const newRadius = 15;
                            this.asteroids.push({
                                x: asteroid.x + (Math.random() - 0.5) * 20,
                                y: asteroid.y + (Math.random() - 0.5) * 20,
                                radius: newRadius,
                                speed: asteroid.speed + 1,
                                angle: asteroid.angle + (Math.random() - 0.5),
                                rotationSpeed: (Math.random() - 0.5) * 0.1,
                                vertices: this.generateAsteroidVertices(newRadius),
                                size: newSize
                            });
                        }
                    }

                    this.asteroids.splice(aIndex, 1);
                }
            });
        });

        this.particles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            particle.life -= particle.decay;
            if (particle.life <= 0) this.particles.splice(index, 1);
        });

        this.thrusterParticles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            if (particle.life <= 0) this.thrusterParticles.splice(index, 1);
        });

        if (this.asteroids.length === 0) {
            this.waveNumber++;
            this.level = Math.floor(this.waveNumber / 3) + 1;
            this.spawnWave();
        }

        if (this.screenShake > 0) {
            this.screenShake *= 0.9;
            if (this.screenShake < 0.5) this.screenShake = 0;
        }

        this.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * 800;
            }
        });
    },

    checkCollision(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < obj1.radius + obj2.radius;
    },

    draw() {
        this.ctx.save();

        if (this.screenShake > 0) {
            this.ctx.translate(
                (Math.random() - 0.5) * this.screenShake * 2,
                (Math.random() - 0.5) * this.screenShake * 2
            );
        }

        const gradient = this.ctx.createRadialGradient(400, 300, 0, 400, 300, 600);
        gradient.addColorStop(0, '#0a0a15');
        gradient.addColorStop(1, '#000005');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.stars.forEach(star => {
            const alpha = 0.4 + star.brightness * 0.6;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.thrusterParticles.forEach(particle => {
            this.ctx.fillStyle = particle.color + Math.floor(particle.life * 255).toString(16).padStart(2, '0');
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.asteroids.forEach(asteroid => {
            this.ctx.save();
            this.ctx.translate(asteroid.x, asteroid.y);
            this.ctx.rotate(asteroid.angle);

            this.ctx.strokeStyle = '#888899';
            this.ctx.lineWidth = 2;
            this.ctx.fillStyle = '#333340';
            this.ctx.shadowColor = '#888899';
            this.ctx.shadowBlur = 5;

            this.ctx.beginPath();
            this.ctx.moveTo(asteroid.vertices[0].x, asteroid.vertices[0].y);
            asteroid.vertices.forEach(vertex => {
                this.ctx.lineTo(vertex.x, vertex.y);
            });
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.restore();
        });

        this.bullets.forEach(bullet => {
            this.ctx.fillStyle = '#00ffff';
            this.ctx.shadowColor = '#00ffff';
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });

        if (!this.gameOver) {
            const visible = !this.ship.invulnerable || this.frameCount % 10 < 5;
            if (visible) {
                this.ctx.save();
                this.ctx.translate(this.ship.x, this.ship.y);
                this.ctx.rotate(this.ship.angle);

                this.ctx.fillStyle = '#00ff88';
                this.ctx.strokeStyle = '#00ffff';
                this.ctx.lineWidth = 2;
                this.ctx.shadowColor = '#00ff88';
                this.ctx.shadowBlur = 15;

                this.ctx.beginPath();
                this.ctx.moveTo(20, 0);
                this.ctx.lineTo(-15, -12);
                this.ctx.lineTo(-10, 0);
                this.ctx.lineTo(-15, 12);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();

                if (this.ship.thrusting) {
                    this.ctx.fillStyle = '#ff6600';
                    this.ctx.beginPath();
                    this.ctx.moveTo(-12, -5);
                    this.ctx.lineTo(-25 - Math.random() * 10, 0);
                    this.ctx.lineTo(-12, 5);
                    this.ctx.closePath();
                    this.ctx.fill();
                }

                this.ctx.restore();
            }
        }

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
        this.ctx.fillText(`Lives: ${'🚀'.repeat(this.lives)}`, 20, 60);
        this.ctx.fillText(`Wave: ${this.waveNumber}`, 20, 90);
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`High: ${this.highScore}`, this.canvas.width - 20, 30);

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
            this.ctx.fillText(`Wave: ${this.waveNumber}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Click or press Enter to restart', this.canvas.width / 2, this.canvas.height / 2 + 80);
        }

        this.ctx.restore();
    },

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AsteroidsSpace;
}