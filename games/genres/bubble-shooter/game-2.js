class BubbleShooter2Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 480;
        this.height = 640;
        this.bubbles = [];
        this.shooter = null;
        this.currentBubble = null;
        this.nextBubble = null;
        this.score = 0;
        this.highScore = 0;
        this.level = 1;
        this.lines = 0;
        this.gameState = 'start';
        this.particles = [];
        this.aimAngle = 0;
        this.shooting = false;
        this.projectile = null;
        this.combo = 0;
        this.lastPopTime = 0;
        this.bubbleColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800'];
        this.specialBubbles = [];
        this.screenShake = 0;
        this.stars = [];
        this.pulsingBubbles = [];
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.generateStars();
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
    }

    generateStars() {
        for (let i = 0; i < 50; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 1.5 + 0.5,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        this.aimAngle = Math.atan2(this.shooter.y - mouseY, this.shooter.x - mouseX + 20);
    }

    handleClick(e) {
        if (this.gameState === 'start') {
            this.start();
            return;
        }
        if (this.gameState === 'gameover') {
            this.start();
            return;
        }
        if (this.gameState === 'playing' && !this.shooting) {
            this.shoot();
        }
    }

    start() {
        this.bubbles = [];
        this.specialBubbles = [];
        this.particles = [];
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.combo = 0;
        this.shooting = false;
        this.projectile = null;

        this.shooter = {
            x: this.width / 2,
            y: this.height - 50,
            radius: 20
        };

        this.initGrid();
        this.spawnBubble();
        this.gameState = 'playing';
        this.lastUpdateTime = Date.now();
        this.gameLoop();
    }

    initGrid() {
        const rows = 5 + Math.floor(this.level / 2);
        const cols = 9;
        const bubbleRadius = 20;
        const spacing = bubbleRadius * 2 + 2;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const offset = row % 2 === 1 ? spacing / 2 : 0;
                const x = col * spacing + spacing / 2 + offset;
                const y = row * spacing + spacing / 2;

                if (x >= 0 && x < this.width) {
                    this.bubbles.push({
                        x, y,
                        radius: bubbleRadius,
                        color: this.bubbleColors[Math.floor(Math.random() * Math.min(this.level + 2, this.bubbleColors.length))],
                        row, col,
                        pulsing: Math.random() < 0.1,
                        pulseOffset: Math.random() * Math.PI * 2
                    });
                }
            }
        }
    }

    spawnBubble() {
        const availableColors = this.bubbleColors.slice(0, Math.min(this.level + 3, this.bubbleColors.length));

        this.currentBubble = {
            color: availableColors[Math.floor(Math.random() * availableColors.length)],
            radius: 20
        };

        if (!this.nextBubble) {
            this.nextBubble = {
                color: availableColors[Math.floor(Math.random() * availableColors.length)],
                radius: 20
            };
        }
    }

    shoot() {
        this.shooting = true;
        this.projectile = {
            x: this.shooter.x,
            y: this.shooter.y,
            radius: this.currentBubble.radius,
            color: this.currentBubble.color,
            vx: Math.cos(this.aimAngle) * 12,
            vy: -Math.sin(this.aimAngle) * 12
        };

        this.currentBubble = this.nextBubble;
        this.spawnBubble();
    }

    update() {
        const now = Date.now();
        if (now - this.lastUpdateTime < 16) return;
        this.lastUpdateTime = now;

        for (const star of this.stars) {
            star.twinkle += 0.03;
        }

        for (const bubble of this.bubbles) {
            if (bubble.pulsing) {
                bubble.pulseOffset += 0.05;
            }
        }

        if (this.projectile) {
            this.projectile.x += this.projectile.vx;
            this.projectile.y += this.projectile.vy;

            if (this.projectile.x < this.projectile.radius || this.projectile.x > this.width - this.projectile.radius) {
                this.projectile.vx *= -1;
            }

            if (this.projectile.y < this.projectile.radius) {
                this.attachBubble();
                return;
            }

            for (const bubble of this.bubbles) {
                const dx = this.projectile.x - bubble.x;
                const dy = this.projectile.y - bubble.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.projectile.radius + bubble.radius) {
                    this.attachBubble();
                    return;
                }
            }
        }

        if (this.screenShake > 0) this.screenShake--;

        this.updateParticles();
    }

    attachBubble() {
        const radius = 20;
        let bestDist = Infinity;
        let attachX = this.projectile.x;
        let attachY = this.radius;

        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 10; col++) {
                const offset = row % 2 === 1 ? radius : 0;
                const x = col * (radius * 2 + 2) + radius + offset;
                const y = row * (radius * 2 + 2) + radius;

                if (x < 0 || x > this.width) continue;

                let occupied = false;
                for (const b of this.bubbles) {
                    const dx = x - b.x;
                    const dy = y - b.y;
                    if (Math.sqrt(dx * dx + dy * dy) < radius * 1.8) {
                        occupied = true;
                        break;
                    }
                }

                if (!occupied) {
                    const dx = this.projectile.x - x;
                    const dy = this.projectile.y - y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < bestDist) {
                        bestDist = dist;
                        attachX = x;
                        attachY = y;
                    }
                }
            }
        }

        this.bubbles.push({
            x: attachX,
            y: attachY,
            radius: this.projectile.radius,
            color: this.projectile.color,
            row: Math.floor(attachY / (radius * 2 + 2)),
            col: Math.floor(attachX / (radius * 2 + 2)),
            pulsing: Math.random() < 0.1,
            pulseOffset: Math.random() * Math.PI * 2
        });

        this.projectile = null;
        this.shooting = false;

        this.checkMatches(attachX, attachY, this.projectile?.color || this.currentBubble.color);
        this.checkFloatingBubbles();
        this.checkLevelComplete();
    }

    checkMatches(x, y, color) {
        const matches = [];
        const visited = new Set();
        const stack = [{ x, y }];

        while (stack.length > 0) {
            const current = stack.pop();
            const key = `${current.x},${current.y}`;

            if (visited.has(key)) continue;
            visited.add(key);

            for (const bubble of this.bubbles) {
                const dx = bubble.x - current.x;
                const dy = bubble.y - current.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 50 && bubble.color === color && !matches.includes(bubble)) {
                    matches.push(bubble);
                    stack.push({ x: bubble.x, y: bubble.y });
                }
            }
        }

        if (matches.length >= 3) {
            this.combo++;
            this.score += matches.length * 10 * this.combo;
            this.lastPopTime = Date.now();

            for (const bubble of matches) {
                this.spawnPopParticles(bubble.x, bubble.y, bubble.color);
                const index = this.bubbles.indexOf(bubble);
                if (index > -1) {
                    this.bubbles.splice(index, 1);
                }
            }

            this.screenShake = 5;
        } else {
            this.combo = 0;
        }
    }

    checkFloatingBubbles() {
        const connected = new Set();
        const stack = [];

        for (const bubble of this.bubbles) {
            if (bubble.y < 50) {
                stack.push(bubble);
            }
        }

        while (stack.length > 0) {
            const current = stack.pop();
            const key = `${current.x},${current.y}`;

            if (connected.has(key)) continue;
            connected.add(key);

            for (const bubble of this.bubbles) {
                const dx = bubble.x - current.x;
                const dy = bubble.y - current.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 50 && !connected.has(`${bubble.x},${bubble.y}`)) {
                    stack.push(bubble);
                }
            }
        }

        const floating = this.bubbles.filter(b => !connected.has(`${b.x},${b.y}`));
        if (floating.length > 0) {
            this.score += floating.length * 20;
            this.combo += 2;

            for (const bubble of floating) {
                this.spawnPopParticles(bubble.x, bubble.y, bubble.color);
            }

            this.bubbles = this.bubbles.filter(b => connected.has(`${b.x},${b.y}`));
            this.screenShake = 8;
        }
    }

    checkLevelComplete() {
        if (this.bubbles.length === 0) {
            this.level++;
            this.lines++;
            this.initGrid();
            this.screenShake = 10;
        }

        let lowestY = 0;
        for (const bubble of this.bubbles) {
            if (bubble.y > lowestY) {
                lowestY = bubble.y;
            }
        }

        if (lowestY > this.height - 150) {
            this.gameState = 'gameover';
            if (this.score > this.highScore) {
                this.highScore = this.score;
            }
        }
    }

    spawnPopParticles(x, y, color) {
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
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

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
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
            this.ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
        }

        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#1a0a2e');
        gradient.addColorStop(0.5, '#2a1a4e');
        gradient.addColorStop(1, '#0a0a1e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        for (const star of this.stars) {
            const alpha = 0.3 + Math.sin(star.twinkle) * 0.3 + 0.3;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.fillStyle = 'rgba(50, 50, 80, 0.3)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        for (const bubble of this.bubbles) {
            let radius = bubble.radius;
            if (bubble.pulsing) {
                radius += Math.sin(bubble.pulseOffset) * 2;
            }

            const gradient = this.ctx.createRadialGradient(
                bubble.x - radius / 3, bubble.y - radius / 3, 0,
                bubble.x, bubble.y, radius
            );
            gradient.addColorStop(0, this.lightenColor(bubble.color, 50));
            gradient.addColorStop(0.7, bubble.color);
            gradient.addColorStop(1, this.darkenColor(bubble.color, 30));

            this.ctx.beginPath();
            this.ctx.arc(bubble.x, bubble.y, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            this.ctx.strokeStyle = this.darkenColor(bubble.color, 50);
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.beginPath();
            this.ctx.arc(bubble.x - radius / 3, bubble.y - radius / 3, radius / 4, 0, Math.PI * 2);
            this.ctx.fill();
        }

        for (const pu of this.specialBubbles) {
            this.ctx.save();
            this.ctx.translate(pu.x, pu.y);
            this.ctx.rotate(Date.now() / 200);
            this.ctx.fillStyle = pu.color;
            this.ctx.fillRect(-pu.radius, -pu.radius, pu.radius * 2, pu.radius * 2);
            this.ctx.restore();
        }

        if (this.projectile) {
            const gradient = this.ctx.createRadialGradient(
                this.projectile.x - this.projectile.radius / 3,
                this.projectile.y - this.projectile.radius / 3,
                0,
                this.projectile.x, this.projectile.y,
                this.projectile.radius
            );
            gradient.addColorStop(0, this.lightenColor(this.projectile.color, 50));
            gradient.addColorStop(1, this.projectile.color);

            this.ctx.beginPath();
            this.ctx.arc(this.projectile.x, this.projectile.y, this.projectile.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.shooter.x, this.shooter.y);
        this.ctx.lineTo(
            this.shooter.x + Math.cos(this.aimAngle) * 100,
            this.shooter.y - Math.sin(this.aimAngle) * 100
        );
        this.ctx.stroke();

        this.ctx.fillStyle = '#444';
        this.ctx.beginPath();
        this.ctx.arc(this.shooter.x, this.shooter.y, 30, 0, Math.PI, true);
        this.ctx.fill();

        if (this.currentBubble) {
            const gradient = this.ctx.createRadialGradient(
                this.shooter.x - 5, this.shooter.y - 5, 0,
                this.shooter.x, this.shooter.y, 20
            );
            gradient.addColorStop(0, this.lightenColor(this.currentBubble.color, 50));
            gradient.addColorStop(1, this.currentBubble.color);

            this.ctx.beginPath();
            this.ctx.arc(this.shooter.x, this.shooter.y, 20, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
        }

        if (this.nextBubble) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Next', this.width - 40, this.height - 70);

            const gradient = this.ctx.createRadialGradient(
                this.width - 40 - 5, this.height - 45 - 5, 0,
                this.width - 40, this.height - 45, 15
            );
            gradient.addColorStop(0, this.lightenColor(this.nextBubble.color, 50));
            gradient.addColorStop(1, this.nextBubble.color);

            this.ctx.beginPath();
            this.ctx.arc(this.width - 40, this.height - 45, 15, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
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

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, 50);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 15, 32);

        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Level ${this.level}`, this.width / 2, 32);

        this.ctx.textAlign = 'right';
        this.ctx.fillText(`High: ${this.highScore}`, this.width - 15, 32);

        if (this.combo > 1) {
            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Combo x${this.combo}`, this.width / 2, 48);
        }

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.fillStyle = '#ff00ff';
            this.ctx.font = 'bold 42px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('BUBBLE SHOOTER II', this.width / 2, this.height / 2 - 80);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Aim with mouse, click to shoot', this.width / 2, this.height / 2 - 20);
            this.ctx.fillText('Match 3+ bubbles of same color', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Clear floating bubbles for bonus', this.width / 2, this.height / 2 + 40);

            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Click to Start', this.width / 2, this.height / 2 + 100);
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
            this.ctx.fillText('Click to Restart', this.width / 2, this.height / 2 + 90);
        }

        this.ctx.restore();
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `rgb(${R}, ${G}, ${B})`;
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return `rgb(${R}, ${G}, ${B})`;
    }
}

window.BubbleShooter2Game = BubbleShooter2Game;
