// Platformer Game 7 - Neon Sky Runner
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        score: 0,
        distance: 0,
        player: {
            x: 200,
            y: canvas.height - 150,
            width: 40,
            height: 40,
            velocityY: 0,
            jumpForce: -15,
            gravity: 0.8,
            onGround: false,
            color: '#00ffff',
            trail: [],
            boosting: false,
            shield: 0
        },
        platforms: [],
        obstacles: [],
        powerups: [],
        stars: [],
        particles: [],
        backgroundStars: [],
        speed: 6,
        maxSpeed: 15,
        boostTimer: 0,
        combo: 0,
        difficulty: 1
    };

    class Platform {
        constructor(x, y, width) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = 20;
            this.type = Math.random() < 0.3 ? 'moving' : 'normal';
            this.moveSpeed = this.type === 'moving' ? 2 : 0;
            this.moveDir = 1;
            this.moveRange = 50;
            this.startY = y;
            this.color = this.getColor();
        }
        
        getColor() {
            const colors = ['#ff00ff', '#00ff00', '#ffff00', '#ff6600'];
            return colors[Math.floor(Math.random() * colors.length)];
        }
        
        update() {
            if (this.type === 'moving') {
                this.y += this.moveSpeed * this.moveDir;
                if (this.y > this.startY + this.moveRange || this.y < this.startY - this.moveRange) {
                    this.moveDir *= -1;
                }
            }
        }
        
        draw() {
            const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(1, '#1a1a2e');
            ctx.fillStyle = gradient;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x, this.y, this.width, 3);
        }
    }

    class Obstacle {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type;
            this.width = type === 'spike' ? 30 : 25;
            this.height = type === 'spike' ? 25 : 40;
            this.rotation = 0;
        }
        
        update() {
            if (this.type === 'rotator') {
                this.rotation += 0.1;
            }
        }
        
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            
            if (this.type === 'spike') {
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.moveTo(0, -15);
                ctx.lineTo(-15, 15);
                ctx.lineTo(15, 15);
                ctx.closePath();
                ctx.fill();
            } else if (this.type === 'rotator') {
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(-12, -12, 24, 24);
                ctx.fillStyle = '#ffcc00';
                ctx.fillRect(0, -12, 12, 24);
                ctx.fillRect(-12, 0, 24, 12);
            } else if (this.type === 'saw') {
                ctx.fillStyle = '#888';
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(angle) * 20, Math.sin(angle) * 20);
                    ctx.lineTo(Math.cos(angle + 0.3) * 15, Math.sin(angle + 0.3) * 15);
                    ctx.closePath();
                    ctx.fill();
                }
            }
            
            ctx.restore();
        }
    }

    class PowerUp {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type;
            this.size = 25;
            this.bob = Math.random() * Math.PI * 2;
        }
        
        update() {
            this.bob += 0.1;
        }
        
        draw() {
            const yOffset = Math.sin(this.bob) * 5;
            
            ctx.save();
            ctx.translate(this.x, this.y + yOffset);
            
            if (this.type === 'coin') {
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(0, 0, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffaa00';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('$', 0, 5);
            } else if (this.type === 'shield') {
                ctx.fillStyle = '#00ff00';
                ctx.beginPath();
                ctx.arc(0, 0, 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else if (this.type === 'boost') {
                ctx.fillStyle = '#ff00ff';
                ctx.fillRect(-12, -12, 24, 24);
                ctx.fillStyle = '#fff';
                ctx.fillRect(-8, -8, 16, 16);
            }
            
            ctx.restore();
        }
    }

    class Star {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = 3 + Math.random() * 3;
            this.twinkle = Math.random() * Math.PI * 2;
        }
        
        update() {
            this.twinkle += 0.05;
        }
        
        draw() {
            const alpha = 0.5 + Math.sin(this.twinkle) * 0.5;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * 6;
            this.vy = (Math.random() - 0.5) * 6;
            this.color = color;
            this.life = 30;
            this.size = 3 + Math.random() * 4;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life--;
        }
        
        draw() {
            ctx.globalAlpha = this.life / 30;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    function initGame() {
        game.platforms = [];
        game.obstacles = [];
        game.powerups = [];
        game.stars = [];
        game.backgroundStars = [];
        
        game.platforms.push(new Platform(50, canvas.height - 80, 400));
        
        for (let i = 0; i < 50; i++) {
            game.backgroundStars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height * 0.7,
                size: Math.random() * 2,
                twinkle: Math.random() * Math.PI * 2
            });
        }
        
        for (let i = 0; i < 5; i++) {
            const x = 600 + i * 400;
            const y = canvas.height - 100 - Math.random() * 150;
            game.platforms.push(new Platform(x, y, 120 + Math.random() * 80));
        }
        
        for (let i = 0; i < 10; i++) {
            const x = 400 + i * 350;
            const y = canvas.height - 60;
            const types = ['spike', 'rotator', 'saw'];
            const type = types[Math.floor(Math.random() * types.length)];
            game.obstacles.push(new Obstacle(x, y, type));
        }
        
        for (let i = 0; i < 8; i++) {
            const x = 500 + i * 400;
            const y = canvas.height - 150 - Math.random() * 100;
            const types = ['coin', 'shield', 'boost'];
            const type = types[Math.floor(Math.random() * types.length)];
            game.powerups.push(new PowerUp(x, y, type));
        }
    }

    function handleInput(data) {
        if (game.state !== 'playing') return;
        
        if ((data.action || data.buttons && data.buttons[0]) && game.player.onGround) {
            game.player.velocityY = game.player.jumpForce;
            game.player.onGround = false;
            
            for (let i = 0; i < 8; i++) {
                game.particles.push(new Particle(
                    game.player.x, game.player.y + 20,
                    game.player.color
                ));
            }
        }
        
        if (data.special && game.boostTimer <= 0) {
            game.boostTimer = 120;
            game.player.boosting = true;
        }
    }

    function update() {
        if (game.state !== 'playing') return;
        
        if (game.boostTimer > 0) {
            game.boostTimer--;
            if (game.boostTimer <= 0) {
                game.player.boosting = false;
            }
        }
        
        const currentSpeed = game.player.boosting ? game.maxSpeed : game.speed;
        game.distance += currentSpeed;
        
        if (game.distance > 5000 * game.difficulty) {
            game.difficulty++;
            game.speed = Math.min(game.maxSpeed, game.speed + 0.5);
        }
        
        game.player.velocityY += game.player.gravity;
        game.player.y += game.player.velocityY;
        
        game.player.onGround = false;
        
        game.platforms.forEach(p => {
            p.update();
            
            if (game.player.x > p.x && game.player.x < p.x + p.width &&
                game.player.y + game.player.height > p.y && 
                game.player.y + game.player.height < p.y + p.height + 15 &&
                game.player.velocityY > 0) {
                game.player.y = p.y - game.player.height;
                game.player.velocityY = 0;
                game.player.onGround = true;
                
                if (p.type === 'moving') {
                    game.player.x += p.moveSpeed * p.moveDir;
                }
            }
        });
        
        if (game.player.y > canvas.height) {
            if (game.player.shield > 0) {
                game.player.shield--;
                game.player.y = canvas.height - 150;
                game.player.velocityY = 0;
            } else {
                game.state = 'gameover';
            }
        }
        
        game.obstacles.forEach(o => {
            o.update();
            
            const dx = Math.abs(o.x - game.player.x);
            const dy = Math.abs(o.y - game.player.y);
            
            if (dx < 25 && dy < 30) {
                if (game.player.shield > 0) {
                    game.player.shield--;
                    game.obstacles = game.obstacles.filter(ob => ob !== o);
                } else {
                    game.state = 'gameover';
                }
            }
        });
        
        game.powerups.forEach(p => {
            p.update();
            
            const dx = Math.abs(p.x - game.player.x);
            const dy = Math.abs(p.y - game.player.y);
            
            if (dx < 25 && dy < 25) {
                if (p.type === 'coin') {
                    game.score += 50;
                    game.combo++;
                } else if (p.type === 'shield') {
                    game.player.shield = 3;
                } else if (p.type === 'boost') {
                    game.boostTimer = 120;
                    game.player.boosting = true;
                }
                
                game.powerups = game.powerups.filter(pu => pu !== p);
                
                for (let i = 0; i < 10; i++) {
                    game.particles.push(new Particle(p.x, p.y, '#ffd700'));
                }
            }
        });
        
        game.platforms.forEach(p => {
            if (p.x + p.width < 0) {
                p.x = canvas.width + Math.random() * 200;
                p.y = canvas.height - 80 - Math.random() * 150;
                p.startY = p.y;
            }
        });
        
        game.obstacles.forEach(o => {
            if (o.x < -50) {
                o.x = canvas.width + Math.random() * 300;
            }
        });
        
        game.powerups.forEach(p => {
            if (p.x < -50) {
                p.x = canvas.width + Math.random() * 200;
            }
        });
        
        game.player.trail.unshift({ x: game.player.x, y: game.player.y });
        if (game.player.trail.length > 10) {
            game.player.trail.pop();
        }
        
        game.particles = game.particles.filter(p => {
            p.update();
            return p.life > 0;
        });
        
        game.backgroundStars.forEach(s => {
            s.x -= currentSpeed * 0.2;
            if (s.x < 0) s.x = canvas.width;
            s.twinkle += 0.02;
        });
    }

    function draw() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(0.5, '#1a0a2e');
        gradient.addColorStop(1, '#0a1a2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        game.backgroundStars.forEach(s => {
            ctx.globalAlpha = 0.3 + Math.sin(s.twinkle) * 0.3;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        game.platforms.forEach(p => p.draw());
        game.obstacles.forEach(o => o.draw());
        game.powerups.forEach(p => p.draw());
        
        ctx.strokeStyle = game.player.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        game.player.trail.forEach((pos, i) => {
            const alpha = 1 - i / game.player.trail.length;
            ctx.globalAlpha = alpha * 0.5;
            if (i === 0) {
                ctx.moveTo(pos.x, pos.y + 20);
            } else {
                ctx.lineTo(pos.x, pos.y + 20);
            }
        });
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        ctx.save();
        ctx.translate(game.player.x, game.player.y);
        
        if (game.player.boosting) {
            ctx.fillStyle = '#ff00ff';
            ctx.beginPath();
            ctx.moveTo(-30, 0);
            ctx.lineTo(-50, -8);
            ctx.lineTo(-50, 8);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.fillStyle = game.player.color;
        ctx.fillRect(-20, -20, 40, 40);
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(-12, -12, 24, 10);
        
        ctx.fillStyle = '#000';
        ctx.fillRect(-8, -8, 8, 6);
        ctx.fillRect(2, -8, 8, 6);
        
        if (game.player.shield > 0) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(0, 0, 35, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        
        ctx.restore();
        
        game.particles.forEach(p => p.draw());
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 180, 110);
        
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${game.score}`, 20, 35);
        ctx.fillText(`Distance: ${Math.floor(game.distance / 10)}m`, 20, 58);
        ctx.fillText(`Speed: ${Math.floor(game.distance / 10) % 100} km/h`, 20, 81);
        
        if (game.player.boosting) {
            ctx.fillStyle = '#ff00ff';
            ctx.fillText('BOOST!', 20, 104);
        } else if (game.player.shield > 0) {
            ctx.fillStyle = '#00ff00';
            ctx.fillText(`Shield: ${game.player.shield}`, 20, 104);
        }
        
        if (game.state === 'gameover') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = '#ff0000';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 30);
            
            ctx.font = '25px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Final Score: ${game.score}`, canvas.width/2, canvas.height/2 + 20);
            ctx.fillText(`Distance: ${Math.floor(game.distance / 10)}m`, canvas.width/2, canvas.height/2 + 55);
        }
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    initGame();
    
    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    gameLoop();
})();