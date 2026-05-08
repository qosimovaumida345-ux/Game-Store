const DonkeyKong = {
    canvas: null,
    ctx: null,
    player: null,
    barrel: null,
    platforms: [],
    ladders: [],
    enemies: [],
    items: [],
    score: 0,
    lives: 3,
    level: 1,
    gameOver: false,
    paused: false,
    keys: {},
    frameCount: 0,
    gameState: 'playing',
    timer: 0,
    jumpHeight: 0,
    particles: [],
    animations: [],

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
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
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
        this.player = {
            x: 50,
            y: 620,
            width: 30,
            height: 40,
            vx: 0,
            vy: 0,
            direction: 1,
            onGround: true,
            onLadder: false,
            jumping: false,
            animFrame: 0
        };

        this.createLevel();
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.gameState = 'playing';
        this.frameCount = 0;
        this.timer = 240;
        this.particles = [];
        this.animations = [];
    },

    createLevel() {
        this.platforms = [];
        this.ladders = [];
        this.enemies = [];
        this.items = [];

        const platformData = [
            { x: 0, y: 650, width: 600, height: 30 },
            { x: 50, y: 550, width: 500, height: 20 },
            { x: 100, y: 450, width: 400, height: 20 },
            { x: 150, y: 350, width: 350, height: 20 },
            { x: 200, y: 250, width: 250, height: 20 },
            { x: 250, y: 150, width: 150, height: 20 }
        ];

        platformData.forEach((p, index) => {
            this.platforms.push({
                x: p.x,
                y: p.y,
                width: p.width,
                height: p.height,
                color: index % 2 === 0 ? '#884422' : '#aa6633'
            });
        });

        const ladderData = [
            { x: 80, y: 550, height: 100 },
            { x: 450, y: 450, height: 100 },
            { x: 150, y: 350, height: 100 },
            { x: 400, y: 250, height: 100 },
            { x: 300, y: 150, height: 100 }
        ];

        ladderData.forEach(l => {
            this.ladders.push({
                x: l.x,
                y: l.y,
                height: l.height,
                width: 30
            });
        });

        this.barrel = {
            x: 500,
            y: 100,
            vx: -2,
            vy: 0,
            radius: 15,
            active: true,
            type: 'normal'
        };

        this.enemies.push({
            x: 200,
            y: 645,
            vx: 1.5,
            vy: 0,
            width: 30,
            height: 30,
            type: 'fireball',
            animFrame: 0
        });

        this.items.push({
            x: 350,
            y: 400,
            type: 'hammer',
            active: true,
            timer: 300
        });

        this.items.push({
            x: 450,
            y: 250,
            type: 'bonus',
            active: true,
            timer: 180
        });
    },

    update() {
        if (this.gameOver || this.paused) return;

        this.frameCount++;
        this.timer = Math.max(0, this.timer - 0.016);

        if (this.timer <= 0 && this.gameState === 'playing') {
            this.lives--;
            if (this.lives <= 0) {
                this.gameOver = true;
            } else {
                this.player.x = 50;
                this.player.y = 620;
                this.timer = 240;
            }
        }

        const onLadder = this.checkOnLadder();

        if (onLadder) {
            this.player.onLadder = true;
            this.player.onGround = true;

            if (this.keys['ArrowUp'] || this.keys['KeyW']) {
                this.player.vy = -3;
                this.player.y += this.player.vy;
            } else if (this.keys['ArrowDown'] || this.keys['KeyS']) {
                this.player.vy = 3;
                this.player.y += this.player.vy;
            } else {
                this.player.vy = 0;
            }
        } else {
            this.player.onLadder = false;
        }

        if (!this.player.onLadder) {
            if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
                this.player.vx = -4;
                this.player.direction = -1;
            } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
                this.player.vx = 4;
                this.player.direction = 1;
            } else {
                this.player.vx = 0;
            }

            if ((this.keys['Space'] || this.keys['ArrowUp']) && this.player.onGround && !this.player.onLadder) {
                this.player.vy = -12;
                this.player.onGround = false;
                this.player.jumping = true;
            }
        }

        this.player.vy += 0.5;
        this.player.x += this.player.vx;
        this.player.y += this.player.vy;

        this.player.x = Math.max(20, Math.min(580, this.player.x));

        let onPlatform = false;
        this.platforms.forEach(platform => {
            if (this.player.vy > 0 &&
                this.player.x + this.player.width / 2 > platform.x &&
                this.player.x - this.player.width / 2 < platform.x + platform.width &&
                this.player.y + this.player.height / 2 > platform.y &&
                this.player.y + this.player.height / 2 < platform.y + platform.height + this.player.vy) {
                
                this.player.y = platform.y - this.player.height / 2;
                this.player.vy = 0;
                this.player.onGround = true;
                this.player.jumping = false;
                onPlatform = true;
            }
        });

        if (!onPlatform && this.player.vy > 0 && !this.player.onLadder) {
            this.player.onGround = false;
        }

        this.ladders.forEach(ladder => {
            if (this.player.x > ladder.x - 10 && this.player.x < ladder.x + ladder.width + 10 &&
                this.player.y + this.player.height / 2 > ladder.y &&
                this.player.y - this.player.height / 2 < ladder.y + ladder.height) {
                this.player.onLadder = true;
            }
        });

        this.enemies.forEach(enemy => {
            enemy.x += enemy.vx;
            enemy.animFrame++;

            if (enemy.x < 20 || enemy.x > 580) {
                enemy.vx = -enemy.vx;
            }

            if (this.checkCollision(this.player, enemy)) {
                this.lives--;
                this.createExplosion(this.player.x, this.player.y, '#ff0000', 20);
                if (this.lives <= 0) {
                    this.gameOver = true;
                } else {
                    this.player.x = 50;
                    this.player.y = 620;
                    this.timer = 240;
                }
            }
        });

        if (this.barrel.active) {
            this.barrel.x += this.barrel.vx;

            if (this.barrel.x < 30 || this.barrel.x > 570) {
                this.barrel.vx = -this.barrel.vx;
            }

            if (Math.random() < 0.005) {
                this.barrel.vy = 3;
            }

            if (this.barrel.vy > 0) {
                this.barrel.y += this.barrel.vy;

                this.platforms.forEach(platform => {
                    if (this.barrel.y + this.barrel.radius > platform.y &&
                        this.barrel.y < platform.y + platform.height &&
                        this.barrel.x > platform.x &&
                        this.barrel.x < platform.x + platform.width) {
                        
                        this.barrel.y = platform.y - this.barrel.radius;
                        this.barrel.vy = 0;
                        this.barrel.vx = Math.random() < 0.5 ? -3 : 3;
                    }
                });

                if (this.barrel.y > 700) {
                    this.barrel.y = 100;
                    this.barrel.x = Math.random() < 0.5 ? 500 : 100;
                    this.barrel.vx = -2;
                    this.barrel.vy = 0;
                }
            }

            if (this.checkBarrelCollision(this.player, this.barrel)) {
                this.lives--;
                this.createExplosion(this.player.x, this.player.y, '#ff0000', 25);
                if (this.lives <= 0) {
                    this.gameOver = true;
                } else {
                    this.player.x = 50;
                    this.player.y = 620;
                    this.timer = 240;
                }
            }
        }

        this.items.forEach((item, index) => {
            if (!item.active) return;

            item.timer--;

            if (item.timer <= 0) {
                this.items.splice(index, 1);
                return;
            }

            if (this.checkCollision(this.player, {
                x: item.x,
                y: item.y,
                width: 30,
                height: 30
            })) {
                item.active = false;
                if (item.type === 'bonus') {
                    this.score += 100;
                    this.createExplosion(item.x, item.y, '#ffff00', 15);
                }
            }
        });

        if (this.player.y < 100 && this.player.x > 200 && this.player.x < 350) {
            this.level++;
            this.score += 500;
            this.createLevel();
            this.player.x = 50;
            this.player.y = 620;
            this.timer = 240 + this.level * 10;
        }

        this.particles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;
            if (particle.life <= 0) this.particles.splice(index, 1);
        });

        this.animations.forEach((anim, index) => {
            anim.frame++;
            if (anim.frame > anim.maxFrames) {
                this.animations.splice(index, 1);
            }
        });
    },

    checkOnLadder() {
        for (const ladder of this.ladders) {
            if (this.player.x > ladder.x - 15 && this.player.x < ladder.x + ladder.width + 15 &&
                this.player.y + this.player.height / 2 > ladder.y &&
                this.player.y - this.player.height / 2 < ladder.y + ladder.height) {
                return true;
            }
        }
        return false;
    },

    checkCollision(player, obj) {
        const px = player.x - player.width / 2;
        const py = player.y - player.height / 2;
        const pw = player.width;
        const ph = player.height;

        let ox, oy, ow, oh;
        if (obj.width !== undefined) {
            ox = obj.x - obj.width / 2;
            oy = obj.y - obj.height / 2;
            ow = obj.width;
            oh = obj.height;
        } else {
            ox = obj.x - 15;
            oy = obj.y - 15;
            ow = 30;
            oh = 30;
        }

        return px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy;
    },

    checkBarrelCollision(player, barrel) {
        const px = player.x - player.width / 2;
        const py = player.y - player.height / 2;
        const pw = player.width;
        const ph = player.height;

        return px < barrel.x + barrel.radius && px + pw > barrel.x - barrel.radius &&
               py < barrel.y + barrel.radius && py + ph > barrel.y - barrel.radius;
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
                size: Math.random() * 5 + 2
            });
        }
    },

    draw() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, 700);
        gradient.addColorStop(0, '#1a0a2e');
        gradient.addColorStop(1, '#2a1a4e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, 600, 700);

        this.ctx.fillStyle = '#aa6633';
        this.ctx.font = 'bold 40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('DONKEY KONG', 300, 50);

        this.platforms.forEach(platform => {
            const gradient = this.ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
            gradient.addColorStop(0, platform.color);
            gradient.addColorStop(1, '#553311');

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.fillRect(platform.x, platform.y, platform.width, 3);
        });

        this.ladders.forEach(ladder => {
            this.ctx.fillStyle = '#886633';
            this.ctx.fillRect(ladder.x, ladder.y, 5, ladder.height);
            this.ctx.fillRect(ladder.x + ladder.width - 5, ladder.y, 5, ladder.height);

            for (let i = 0; i < ladder.height; i += 15) {
                this.ctx.fillStyle = '#aa8844';
                this.ctx.fillRect(ladder.x, ladder.y + i, ladder.width, 3);
            }
        });

        this.ctx.fillStyle = '#884422';
        this.ctx.font = 'bold 80px Arial';
        this.ctx.fillText('🐵', 480, 90);

        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = 'bold 30px Arial';
        this.ctx.fillText('🏆', 300, 130);

        this.items.forEach(item => {
            if (!item.active) return;

            const pulse = Math.sin(this.frameCount * 0.1) * 3;
            this.ctx.fillStyle = item.type === 'bonus' ? '#ffff00' : '#888888';
            this.ctx.shadowColor = this.ctx.fillStyle;
            this.ctx.shadowBlur = 10 + pulse;
            
            this.ctx.font = '25px Arial';
            this.ctx.fillText(item.type === 'hammer' ? '🔨' : '⭐', item.x, item.y);
            this.ctx.shadowBlur = 0;
        });

        this.enemies.forEach(enemy => {
            const bounce = Math.sin(enemy.animFrame * 0.2) * 3;
            this.ctx.fillStyle = '#ff4400';
            this.ctx.shadowColor = '#ff4400';
            this.ctx.shadowBlur = 15;
            this.ctx.font = '28px Arial';
            this.ctx.fillText('🔥', enemy.x, enemy.y + bounce);
            this.ctx.shadowBlur = 0;
        });

        if (this.barrel.active) {
            this.ctx.save();
            this.ctx.translate(this.barrel.x, this.barrel.y);
            this.ctx.rotate(this.frameCount * 0.2);

            this.ctx.fillStyle = '#8B4513';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.barrel.radius, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.strokeStyle = '#654321';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.barrel.radius - 3, 0, Math.PI * 2);
            this.ctx.stroke();

            this.ctx.restore();
        }

        const bobOffset = this.player.jumping ? 0 : Math.sin(this.frameCount * 0.3) * 2;
        
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.fillRect(
            this.player.x - this.player.width / 2 + 5,
            this.player.y - this.player.height / 2 + bobOffset,
            this.player.width - 10,
            this.player.height / 2
        );

        this.ctx.fillStyle = '#3366cc';
        this.ctx.fillRect(
            this.player.x - this.player.width / 2,
            this.player.y + bobOffset,
            this.player.width,
            this.player.height / 2
        );

        this.ctx.fillStyle = '#ffcc99';
        this.ctx.beginPath();
        this.ctx.arc(
            this.player.x + this.player.direction * 5,
            this.player.y - this.player.height / 2 + 8 + bobOffset,
            12,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(
            this.player.x + this.player.direction * 8,
            this.player.y - this.player.height / 2 + 6 + bobOffset,
            3,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color + Math.floor(particle.life * 255).toString(16).padStart(2, '0');
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 80);
        this.ctx.fillText(`Lives: ${'❤️'.repeat(this.lives)}`, 20, 105);
        this.ctx.fillText(`Level: ${this.level}`, 20, 130);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Time: ${Math.ceil(this.timer)}`, 580, 80);

        if (this.paused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, 600, 700);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', 300, 350);
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Press P to continue', 300, 400);
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
            this.ctx.fillText(`Level Reached: ${this.level}`, 300, 385);
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Click or press Enter to restart', 300, 450);
        }
    },

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DonkeyKong;
}