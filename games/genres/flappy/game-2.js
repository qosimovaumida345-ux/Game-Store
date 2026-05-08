class FlappyBird2Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 400;
        this.height = 600;
        this.bird = null;
        this.pipes = [];
        this.clouds = [];
        this.clouds2 = [];
        this.particles = [];
        this.score = 0;
        this.highScore = 0;
        this.gameState = 'start';
        this.pipeSpeed = 3;
        this.gravity = 0.4;
        this.jumpStrength = -8;
        this.wind = 0;
        this.windTimer = 0;
        this.cloudOffset = 0;
        this.powerUp = null;
        this.shield = false;
        this.shieldTimer = 0;
        this.magnet = false;
        this.magnetTimer = 0;
        this.birdTrail = [];
        this.screenShake = 0;
        this.dayNightCycle = 0;
        this.isNight = false;
        this.stars = [];
        this.levels = [];
        this.currentLevel = 0;
        this.levelProgress = 0;
        this.birdRotation = 0;
        this.wingAngle = 0;
        this.achievements = [];
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.generateStars();
        this.generateLevels();
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    generateStars() {
        for (let i = 0; i < 50; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * (this.height - 200),
                size: Math.random() * 2 + 0.5,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }

    generateLevels() {
        this.levels = [
            { gapSize: 140, pipeSpeed: 3, cloudSpeed: 0.5, name: 'Easy' },
            { gapSize: 130, pipeSpeed: 3.5, cloudSpeed: 0.7, name: 'Medium' },
            { gapSize: 120, pipeSpeed: 4, cloudSpeed: 0.9, name: 'Hard' },
            { gapSize: 110, pipeSpeed: 4.5, cloudSpeed: 1.1, name: 'Expert' },
            { gapSize: 100, pipeSpeed: 5, cloudSpeed: 1.3, name: 'Master' }
        ];
    }

    handleClick(e) {
        if (this.gameState === 'start') {
            this.start();
        } else if (this.gameState === 'playing') {
            this.jump();
        } else if (this.gameState === 'gameover') {
            this.start();
        }
    }

    handleKeyDown(e) {
        if (e.key === ' ' || e.key === 'ArrowUp') {
            if (this.gameState === 'playing') {
                this.jump();
            } else {
                this.start();
            }
        }
    }

    jump() {
        if (this.bird) {
            this.bird.velocity = this.jumpStrength;
            this.bird.isJumping = true;
            this.spawnJumpParticles();
        }
    }

    start() {
        this.bird = {
            x: 80,
            y: this.height / 2,
            width: 40,
            height: 30,
            velocity: 0,
            isJumping: false,
            color: '#ff6b6b'
        };
        this.pipes = [];
        this.particles = [];
        this.score = 0;
        this.wind = 0;
        this.windTimer = 0;
        this.powerUp = null;
        this.shield = false;
        this.shieldTimer = 0;
        this.magnet = false;
        this.magnetTimer = 0;
        this.birdTrail = [];
        this.screenShake = 0;
        this.levelProgress = 0;
        this.currentLevel = 0;

        for (let i = 0; i < 3; i++) {
            this.spawnPipe(300 + i * 200);
        }

        this.initClouds();
        this.gameState = 'playing';
        this.lastUpdateTime = Date.now();
        this.gameLoop();
    }

    initClouds() {
        this.clouds = [];
        this.clouds2 = [];
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * this.width,
                y: 50 + Math.random() * 100,
                width: 80 + Math.random() * 60,
                height: 40 + Math.random() * 20
            });
        }
        for (let i = 0; i < 4; i++) {
            this.clouds2.push({
                x: Math.random() * this.width,
                y: 150 + Math.random() * 100,
                width: 60 + Math.random() * 40,
                height: 30 + Math.random() * 15
            });
        }
    }

    spawnPipe(x) {
        const level = this.levels[this.currentLevel];
        const gapY = 100 + Math.random() * (this.height - 250 - level.gapSize);
        this.pipes.push({
            x: x || this.width,
            gapY: gapY,
            gapSize: level.gapSize,
            passed: false,
            hasPowerUp: Math.random() < 0.15,
            powerUpY: gapY + level.gapSize / 2,
            isDark: Math.random() < 0.2
        });
    }

    spawnPowerUp() {
        if (this.powerUp === null && Math.random() < 0.005) {
            const types = ['shield', 'magnet', 'slow'];
            this.powerUp = {
                x: this.width,
                y: 100 + Math.random() * (this.height - 300),
                type: types[Math.floor(Math.random() * types.length)],
                width: 30,
                height: 30
            };
        }
    }

    spawnJumpParticles() {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.bird.x,
                y: this.bird.y + this.bird.height / 2,
                vx: (Math.random() - 0.5) * 3,
                vy: Math.random() * 2 + 1,
                life: 1,
                size: 3 + Math.random() * 3,
                color: '#fff'
            });
        }
    }

    update() {
        const now = Date.now();
        if (now - this.lastUpdateTime < 16) return;
        this.lastUpdateTime = now;

        const level = this.levels[this.currentLevel];

        this.dayNightCycle += 0.001;
        this.isNight = Math.sin(this.dayNightCycle) > 0.3;

        this.wingAngle += 0.3;

        this.birdTrail.push({ x: this.bird.x, y: this.bird.y, life: 15 });
        if (this.birdTrail.length > 20) this.birdTrail.shift();
        for (const t of this.birdTrail) {
            t.life--;
        }

        if (this.windTimer > 0) {
            this.windTimer--;
        } else {
            if (Math.random() < 0.01) {
                this.wind = (Math.random() - 0.5) * 2;
                this.windTimer = 120;
            }
        }

        this.bird.velocity += this.gravity;
        this.bird.y += this.bird.velocity;

        if (this.bird.isJumping) {
            this.bird.isJumping = false;
        }

        if (this.bird.y < 20 || this.bird.y > this.height - 80) {
            if (!this.shield) {
                this.gameOver();
                return;
            } else {
                this.bird.y = this.bird.y < 20 ? 20 : this.height - 80;
                this.bird.velocity = 0;
            }
        }

        for (const pipe of this.pipes) {
            pipe.x -= level.pipeSpeed;
            pipe.x += this.wind * 0.5;

            if (this.magnet && pipe.x > this.bird.x) {
                pipe.x -= 1;
            }

            if (!pipe.passed && pipe.x + 60 < this.bird.x) {
                pipe.passed = true;
                this.score++;
                this.levelProgress++;

                if (this.levelProgress >= 5 && this.currentLevel < this.levels.length - 1) {
                    this.currentLevel++;
                    this.levelProgress = 0;
                    this.screenShake = 5;
                }

                if (this.score % 10 === 0) {
                    this.spawnScoreParticles();
                }
            }

            if (this.bird.x + this.bird.width > pipe.x &&
                this.bird.x < pipe.x + 60 &&
                (this.bird.y < pipe.gapY || this.bird.y + this.bird.height > pipe.gapY + pipe.gapSize)) {
                if (!this.shield) {
                    this.gameOver();
                    return;
                } else {
                    this.shield = false;
                    this.shieldTimer = 0;
                    this.screenShake = 10;
                    this.spawnShieldBreakParticles();
                }
            }

            if (pipe.hasPowerUp && pipe.x < this.powerUp?.x + 30 && pipe.x + 60 > this.powerUp?.x) {
            }
        }

        if (this.powerUp) {
            this.powerUp.x -= level.pipeSpeed;
            if (this.powerUp.x < -30) {
                this.powerUp = null;
            }

            if (this.bird.x < this.powerUp.x + this.powerUp.width &&
                this.bird.x + this.bird.width > this.powerUp.x &&
                this.bird.y < this.powerUp.y + this.powerUp.height &&
                this.bird.y + this.bird.height > this.powerUp.y) {
                this.applyPowerUp(this.powerUp.type);
                this.powerUp = null;
            }
        }

        this.pipes = this.pipes.filter(p => p.x > -60);
        while (this.pipes.length < 3) {
            this.spawnPipe();
        }

        for (let i = this.clouds.length - 1; i >= 0; i--) {
            this.clouds[i].x -= level.cloudSpeed;
            if (this.clouds[i].x < -this.clouds[i].width) {
                this.clouds[i].x = this.width + Math.random() * 100;
            }
        }
        for (let i = this.clouds2.length - 1; i >= 0; i--) {
            this.clouds2[i].x -= level.cloudSpeed * 0.7;
            if (this.clouds2[i].x < -this.clouds2[i].width) {
                this.clouds2[i].x = this.width + Math.random() * 100;
            }
        }

        if (this.shieldTimer > 0) {
            this.shieldTimer--;
            if (this.shieldTimer <= 0) {
                this.shield = false;
            }
        }

        if (this.magnetTimer > 0) {
            this.magnetTimer--;
            if (this.magnetTimer <= 0) {
                this.magnet = false;
            }
        }

        this.spawnPowerUp();
        this.updateParticles();

        if (this.screenShake > 0) this.screenShake--;
    }

    applyPowerUp(type) {
        switch (type) {
            case 'shield':
                this.shield = true;
                this.shieldTimer = 300;
                this.spawnParticles(this.bird.x + 20, this.bird.y + 15, '#00ffff');
                break;
            case 'magnet':
                this.magnet = true;
                this.magnetTimer = 200;
                this.spawnParticles(this.bird.x + 20, this.bird.y + 15, '#ff69b4');
                break;
            case 'slow':
                this.pipeSpeed *= 0.7;
                setTimeout(() => { this.pipeSpeed /= 0.7; }, 3000);
                this.spawnParticles(this.bird.x + 20, this.bird.y + 15, '#ffff00');
                break;
        }
    }

    spawnParticles(x, y, color) {
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.03,
                size: 4 + Math.random() * 4,
                color
            });
        }
    }

    spawnShieldBreakParticles() {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 4;
            this.particles.push({
                x: this.bird.x + 20,
                y: this.bird.y + 15,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.02,
                size: 5 + Math.random() * 5,
                color: '#00ffff'
            });
        }
    }

    spawnScoreParticles() {
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            this.particles.push({
                x: this.width / 2,
                y: this.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.02,
                size: 4 + Math.random() * 3,
                color: '#ffd700'
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

    gameOver() {
        this.gameState = 'gameover';
        if (this.score > this.highScore) {
            this.highScore = this.score;
        }
        this.screenShake = 15;
        this.spawnDeathParticles();
    }

    spawnDeathParticles() {
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            this.particles.push({
                x: this.bird.x + 20,
                y: this.bird.y + 15,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.015,
                size: 4 + Math.random() * 5,
                color: this.bird.color
            });
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

        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        if (this.isNight) {
            skyGradient.addColorStop(0, '#0a0a2e');
            skyGradient.addColorStop(0.5, '#1a1a4e');
            skyGradient.addColorStop(1, '#2a2a5e');
        } else {
            skyGradient.addColorStop(0, '#87CEEB');
            skyGradient.addColorStop(0.5, '#98d8ea');
            skyGradient.addColorStop(1, '#c9f0ff');
        }
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (this.isNight) {
            for (const star of this.stars) {
                star.twinkle += 0.05;
                const alpha = 0.3 + Math.sin(star.twinkle) * 0.3 + 0.3;
                this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                this.ctx.beginPath();
                this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        for (const cloud of this.clouds) {
            this.ctx.fillStyle = this.isNight ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.8)';
            this.drawCloud(cloud.x, cloud.y, cloud.width, cloud.height);
        }

        for (const cloud of this.clouds2) {
            this.ctx.fillStyle = this.isNight ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.6)';
            this.drawCloud(cloud.x, cloud.y, cloud.width, cloud.height);
        }

        for (const pipe of this.pipes) {
            const gradient = this.ctx.createLinearGradient(pipe.x, 0, pipe.x + 60, 0);
            if (pipe.isDark) {
                gradient.addColorStop(0, '#2a2a2a');
                gradient.addColorStop(0.5, '#4a4a4a');
                gradient.addColorStop(1, '#2a2a2a');
            } else {
                gradient.addColorStop(0, '#228B22');
                gradient.addColorStop(0.5, '#32CD32');
                gradient.addColorStop(1, '#228B22');
            }

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(pipe.x, 0, 60, pipe.gapY);
            this.ctx.fillRect(pipe.x, pipe.gapY + pipe.gapSize, 60, this.height - pipe.gapY - pipe.gapSize);

            this.ctx.fillStyle = pipe.isDark ? '#3a3a3a' : '#006400';
            this.ctx.fillRect(pipe.x + 5, 0, 10, pipe.gapY);
            this.ctx.fillRect(pipe.x + 5, pipe.gapY + pipe.gapSize, 10, this.height - pipe.gapY - pipe.gapSize);

            this.ctx.fillStyle = pipe.isDark ? '#1a1a1a' : '#004400';
            this.ctx.fillRect(pipe.x - 5, pipe.gapY - 10, 70, 15);
            this.ctx.fillRect(pipe.x - 5, pipe.gapY + pipe.gapSize - 5, 70, 15);
        }

        if (this.powerUp) {
            this.ctx.save();
            this.ctx.translate(this.powerUp.x + 15, this.powerUp.y + 15);
            this.ctx.rotate(Date.now() / 200);

            this.ctx.fillStyle = this.powerUp.type === 'shield' ? '#00ffff' :
                this.powerUp.type === 'magnet' ? '#ff69b4' : '#ffff00';
            this.ctx.fillRect(-15, -15, 30, 30);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(this.powerUp.type === 'shield' ? '🛡' : this.powerUp.type === 'magnet' ? '🧲' : '⏱', 0, 0);
            this.ctx.restore();
        }

        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.height - 60, this.width, 60);

        for (const t of this.birdTrail) {
            this.ctx.globalAlpha = t.life / 15 * 0.3;
            this.ctx.fillStyle = this.bird.color;
            this.ctx.beginPath();
            this.ctx.arc(t.x + 20, t.y + 15, 10, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;

        this.ctx.save();
        this.ctx.translate(this.bird.x + 20, this.bird.y + 15);

        if (this.bird.velocity > 2) {
            this.birdRotation = Math.min(this.birdRotation + 0.1, 0.5);
        } else if (this.bird.velocity < -2) {
            this.birdRotation = Math.max(this.birdRotation - 0.15, -0.5);
        } else {
            this.birdRotation *= 0.9;
        }
        this.ctx.rotate(this.birdRotation);

        if (this.shield) {
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 25, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 + Math.sin(Date.now() / 100) * 0.3})`;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }

        this.ctx.fillStyle = this.bird.color;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 20, 15, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(8, -5, 5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(10, -5, 2.5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#ffcc00';
        this.ctx.beginPath();
        this.ctx.moveTo(15, 0);
        this.ctx.lineTo(25, 3);
        this.ctx.lineTo(25, -3);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.moveTo(-15, Math.sin(this.wingAngle) * 5);
        this.ctx.lineTo(-5, Math.sin(this.wingAngle) * 10);
        this.ctx.lineTo(-5, Math.sin(this.wingAngle) * 5);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();

        for (const p of this.particles) {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.width, 50);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Score: ${this.score}`, this.width / 2, 32);

        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`High: ${this.highScore}`, 10, 32);

        this.ctx.textAlign = 'right';
        this.ctx.fillText(this.levels[this.currentLevel].name, this.width - 10, 32);

        if (this.wind !== 0) {
            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Wind: ${this.wind > 0 ? '→' : '←'} ${Math.abs(this.wind).toFixed(1)}`, this.width / 2, 45);
        }

        if (this.shield) {
            this.ctx.fillStyle = '#00ffff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText('🛡 SHIELD', 10, 45);
        }

        if (this.magnet) {
            this.ctx.fillStyle = '#ff69b4';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText('🧲 MAGNET', this.shield ? 80 : 10, 45);
        }

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('FLAPPY BIRD II', this.width / 2, this.height / 2 - 80);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Click or SPACE to flap', this.width / 2, this.height / 2 - 20);
            this.ctx.fillText('Avoid the pipes!', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Collect power-ups for shields', this.width / 2, this.height / 2 + 40);

            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Click to Start', this.width / 2, this.height / 2 + 100);
        }

        if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.fillStyle = '#ff4444';
            this.ctx.font = 'bold 36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 50);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Score: ${this.score}`, this.width / 2, this.height / 2);

            if (this.score > this.highScore - 1) {
                this.ctx.fillStyle = '#ffd700';
                this.ctx.fillText('NEW HIGH SCORE!', this.width / 2, this.height / 2 + 35);
            }

            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Click to Restart', this.width / 2, this.height / 2 + 90);
        }

        this.ctx.restore();
    }

    drawCloud(x, y, width, height) {
        this.ctx.beginPath();
        this.ctx.arc(x + width * 0.3, y + height * 0.5, height * 0.4, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.5, y + height * 0.3, height * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.7, y + height * 0.5, height * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
    }
}

window.FlappyBird2Game = FlappyBird2Game;
