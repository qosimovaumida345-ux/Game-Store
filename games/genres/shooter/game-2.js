// Shooter Game 2 - Space Invaders Revolution
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        score: 0,
        lives: 3,
        wave: 1,
        player: {
            x: canvas.width / 2,
            y: canvas.height - 60,
            width: 50,
            height: 40,
            speed: 7,
            shootCooldown: 0,
            shield: 0,
            weaponLevel: 1
        },
        playerBullets: [],
        enemyBullets: [],
        enemies: [],
        particles: [],
        powerups: [],
        asteroids: [],
        boss: null,
        bossTimer: 0,
        combo: 0,
        multiplier: 1
    };

    class Enemy {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type;
            this.width = 40;
            this.height = 35;
            this.health = type === 'elite' ? 3 : 1;
            this.points = type === 'elite' ? 30 : 10;
            this.shootChance = type === 'elite' ? 0.02 : 0.005;
            this.moveSpeed = 2;
            this.moveDir = 1;
            this.angle = 0;
        }
        
        update() {
            this.angle = Math.sin(Date.now() / 500 + this.x) * 0.2;
            
            this.x += this.moveSpeed * this.moveDir;
            if (this.x > canvas.width - 50 || this.x < 50) {
                this.moveDir *= -1;
            }
            
            if (Math.random() < this.shootChance) {
                game.enemyBullets.push({
                    x: this.x,
                    y: this.y + 20,
                    vx: 0,
                    vy: 5,
                    damage: 1
                });
            }
        }
        
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            
            if (this.type === 'elite') {
                ctx.fillStyle = '#9b59b6';
            } else if (this.type === 'scout') {
                ctx.fillStyle = '#3498db';
            } else {
                ctx.fillStyle = '#e74c3c';
            }
            
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(-20, 15);
            ctx.lineTo(20, 15);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#000';
            ctx.fillRect(-8, -5, 6, 6);
            ctx.fillRect(2, -5, 6, 6);
            
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(0, 8, 5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }

    class Boss {
        constructor() {
            this.x = canvas.width / 2;
            this.y = -100;
            this.targetY = 100;
            this.width = 120;
            this.height = 80;
            this.health = 100;
            this.maxHealth = 100;
            this.phase = 1;
            this.shootTimer = 0;
            this.angle = 0;
        }
        
        update() {
            if (this.y < this.targetY) {
                this.y += 2;
                return;
            }
            
            this.angle += 0.02;
            this.x = canvas.width / 2 + Math.sin(this.angle) * 200;
            
            this.shootTimer++;
            
            if (this.phase === 1 && this.shootTimer % 30 === 0) {
                for (let i = -2; i <= 2; i++) {
                    game.enemyBullets.push({
                        x: this.x + i * 20,
                        y: this.y + 40,
                        vx: i * 0.5,
                        vy: 6,
                        damage: 2
                    });
                }
            }
            
            if (this.phase === 2 && this.shootTimer % 15 === 0) {
                const angle = Math.atan2(game.player.y - this.y, game.player.x - this.x);
                game.enemyBullets.push({
                    x: this.x,
                    y: this.y + 40,
                    vx: Math.cos(angle) * 8,
                    vy: Math.sin(angle) * 8,
                    damage: 3
                });
            }
            
            if (this.health < this.maxHealth * 0.5 && this.phase === 1) {
                this.phase = 2;
            }
        }
        
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(-60, -40, 120, 80);
            
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.moveTo(-60, -40);
            ctx.lineTo(0, -60);
            ctx.lineTo(60, -40);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#3498db';
            ctx.beginPath();
            ctx.arc(-25, 10, 15, 0, Math.PI * 2);
            ctx.arc(25, 10, 15, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.arc(-25, 10, 8, 0, Math.PI * 2);
            ctx.arc(25, 10, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#e74c3c';
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(-40 + i * 40, -30, 6, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
            
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - 60, this.y - 70, 120, 10);
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(this.x - 59, this.y - 69, 118 * (this.health / this.maxHealth), 8);
        }
    }

    function spawnWave() {
        game.enemies = [];
        const rows = 3 + Math.floor(game.wave / 2);
        const cols = 8;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                let type = 'basic';
                if (row === 0) type = 'elite';
                else if (col === 0 || col === cols - 1) type = 'scout';
                
                game.enemies.push(new Enemy(
                    80 + col * 60,
                    60 + row * 50,
                    type
                ));
            }
        }
        
        game.bossTimer = 300 + game.wave * 60;
    }

    function handleInput(data) {
        if (game.state !== 'playing') return;
        
        const p = game.player;
        
        if (data.left) p.x -= p.speed;
        if (data.right) p.x += p.speed;
        
        p.x = Math.max(25, Math.min(canvas.width - 25, p.x));
        
        if (data.action && p.shootCooldown <= 0) {
            game.playerBullets.push({
                x: p.x,
                y: p.y - 20,
                vx: 0,
                vy: -10,
                damage: 1
            });
            
            if (p.weaponLevel >= 2) {
                game.playerBullets.push({ x: p.x - 15, y: p.y, vx: -1, vy: -9, damage: 1 });
                game.playerBullets.push({ x: p.x + 15, y: p.y, vx: 1, vy: -9, damage: 1 });
            }
            
            if (p.weaponLevel >= 3) {
                game.playerBullets.push({ x: p.x, y: p.y - 10, vx: 0, vy: -12, damage: 2 });
            }
            
            p.shootCooldown = p.weaponLevel >= 3 ? 8 : 15;
        }
        
        p.shootCooldown--;
    }

    function update() {
        if (game.state !== 'playing') return;
        
        if (game.enemies.length === 0 && !game.boss && game.bossTimer <= 0) {
            game.boss = new Boss();
            game.bossTimer = 999999;
        }
        
        game.bossTimer--;
        
        if (game.boss) {
            game.boss.update();
            
            if (game.boss.health <= 0) {
                game.score += 1000 * game.wave;
                game.boss = null;
                game.wave++;
                game.bossTimer = 300 + game.wave * 60;
                
                for (let i = 0; i < 30; i++) {
                    game.particles.push({
                        x: game.boss.x, y: game.boss.y,
                        vx: (Math.random() - 0.5) * 10,
                        vy: (Math.random() - 0.5) * 10,
                        color: ['#f1c40f', '#e74c3c', '#3498db'][Math.floor(Math.random() * 3)],
                        life: 40
                    });
                }
                
                setTimeout(spawnWave, 2000);
            }
        }
        
        game.enemies.forEach(e => e.update());
        
        game.playerBullets = game.playerBullets.filter(b => {
            b.x += b.vx;
            b.y += b.vy;
            
            if (b.y < 0) return false;
            
            if (game.boss) {
                if (Math.abs(b.x - game.boss.x) < 60 && Math.abs(b.y - game.boss.y) < 40) {
                    game.boss.health -= b.damage;
                    game.score += 10;
                    game.combo++;
                    return false;
                }
            }
            
            for (let i = game.enemies.length - 1; i >= 0; i--) {
                const e = game.enemies[i];
                if (Math.abs(b.x - e.x) < 25 && Math.abs(b.y - e.y) < 20) {
                    e.health--;
                    if (e.health <= 0) {
                        game.enemies.splice(i, 1);
                        game.score += e.points * game.multiplier;
                        game.combo++;
                    }
                    return false;
                }
            }
            
            return true;
        });
        
        game.enemyBullets = game.enemyBullets.filter(b => {
            b.x += b.vx;
            b.y += b.vy;
            
            if (b.y > canvas.height || b.x < 0 || b.x > canvas.width) return false;
            
            const p = game.player;
            if (Math.abs(b.x - p.x) < 25 && Math.abs(b.y - p.y) < 20) {
                if (p.shield > 0) {
                    p.shield--;
                } else {
                    game.lives--;
                    game.combo = 0;
                    if (game.lives <= 0) {
                        game.state = 'gameover';
                    }
                }
                return false;
            }
            
            return true;
        });
        
        game.combo = Math.min(10, game.combo);
        game.multiplier = 1 + Math.floor(game.combo / 3);
        
        if (Math.random() < 0.005) {
            const types = ['spread', 'shield', 'speed'];
            const type = types[Math.floor(Math.random() * types.length)];
            game.powerups.push({
                x: Math.random() * (canvas.width - 40) + 20,
                y: -20,
                type: type,
                vy: 2
            });
        }
        
        game.powerups = game.powerups.filter(p => {
            p.y += p.vy;
            
            if (p.y > canvas.height) return false;
            
            const dx = p.x - game.player.x;
            const dy = p.y - game.player.y;
            if (Math.abs(dx) < 30 && Math.abs(dy) < 30) {
                if (p.type === 'spread') game.player.weaponLevel = Math.min(3, game.player.weaponLevel + 1);
                if (p.type === 'shield') game.player.shield = 3;
                if (p.type === 'speed') game.player.speed = 12;
                game.score += 50;
                return false;
            }
            
            return true;
        });
        
        if (game.player.shield > 0) {
            game.player.shield -= 0.01;
        }
        
        game.particles = game.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            return p.life > 0;
        });
        
        if (Math.random() < 0.01) {
            game.asteroids.push({
                x: Math.random() * canvas.width,
                y: -30,
                size: 20 + Math.random() * 30,
                speed: 2 + Math.random() * 3,
                rotation: Math.random() * Math.PI * 2
            });
        }
        
        game.asteroids = game.asteroids.filter(a => {
            a.y += a.speed;
            a.rotation += 0.02;
            return a.y < canvas.height + 50;
        });
    }

    function draw() {
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 73 + Date.now() / 100) % canvas.width;
            const y = (i * 47) % canvas.height;
            ctx.globalAlpha = 0.3 + Math.random() * 0.3;
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        
        game.asteroids.forEach(a => {
            ctx.save();
            ctx.translate(a.x, a.y);
            ctx.rotate(a.rotation);
            ctx.fillStyle = '#5d6d7e';
            ctx.beginPath();
            ctx.moveTo(0, -a.size/2);
            ctx.lineTo(a.size/2, 0);
            ctx.lineTo(0, a.size/2);
            ctx.lineTo(-a.size/2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });
        
        game.enemies.forEach(e => e.draw());
        
        if (game.boss) game.boss.draw();
        
        game.powerups.forEach(p => {
            ctx.fillStyle = p.type === 'spread' ? '#2ecc71' : p.type === 'shield' ? '#3498db' : '#f1c40f';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(p.type[0].toUpperCase(), p.x, p.y + 4);
        });
        
        const p = game.player;
        ctx.save();
        ctx.translate(p.x, p.y);
        
        if (p.shield > 0) {
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 3;
            ctx.globalAlpha = p.shield / 3;
            ctx.beginPath();
            ctx.arc(0, 0, 35, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(-25, 20);
        ctx.lineTo(25, 20);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(0, -25, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-15, -10, 30, 10);
        
        ctx.restore();
        
        ctx.fillStyle = '#e74c3c';
        game.playerBullets.forEach(b => {
            ctx.beginPath();
            ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.fillStyle = '#ff6b6b';
        game.enemyBullets.forEach(b => {
            ctx.beginPath();
            ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.fillStyle = '#fff';
        game.particles.forEach(p => {
            ctx.globalAlpha = p.life / 40;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 180, 100);
        
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${game.score}`, 20, 35);
        ctx.fillText(`Wave: ${game.wave}`, 20, 60);
        ctx.fillText(`Lives: ${game.lives}`, 20, 85);
        
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`x${game.multiplier}`, 150, 35);
        
        if (game.state === 'gameover') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = '#e74c3c';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 20);
            
            ctx.font = '25px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Score: ${game.score}`, canvas.width/2, canvas.height/2 + 30);
            ctx.fillText(`Wave: ${game.wave}`, canvas.width/2, canvas.height/2 + 60);
        }
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    spawnWave();
    
    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    gameLoop();
})();