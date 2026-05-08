// Action Game 1 - Blade Storm
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        score: 0,
        timeLeft: 60,
        combo: 0,
        maxCombo: 0,
        particles: [],
        enemies: [],
        powerUps: [],
        player: {
            x: canvas.width / 2,
            y: canvas.height - 100,
            width: 40,
            height: 60,
            speed: 8,
            attacking: false,
            attackFrame: 0,
            health: 100,
            maxHealth: 100,
            direction: 1,
            weapon: 'sword',
            specialReady: false,
            specialMeter: 0
        },
        groundY: canvas.height - 80,
        enemySpawnTimer: 0,
        enemySpawnRate: 60,
        difficulty: 1,
        scorePopup: [],
        screenShake: 0,
        lastTime: 0,
        deltaTime: 0
    };

    class Particle {
        constructor(x, y, color, size, velocity, life) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.size = size;
            this.vx = velocity.x;
            this.vy = velocity.y;
            this.life = life;
            this.maxLife = life;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.2;
            this.life--;
        }
        
        draw() {
            const alpha = this.life / this.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    class Enemy {
        constructor(type) {
            this.type = type;
            this.x = Math.random() < 0.5 ? -50 : canvas.width + 50;
            this.y = game.groundY - 50;
            this.width = 40;
            this.height = 60;
            this.speed = 2 + Math.random() * 2;
            this.health = 30 + type * 20;
            this.maxHealth = this.health;
            this.damage = 10 + type * 5;
            this.attackCooldown = 0;
            this.state = 'running';
            this.animFrame = 0;
            this.hitStun = 0;
            this.points = 100 * type;
        }
        
        update() {
            if (this.hitStun > 0) {
                this.hitStun--;
                return;
            }
            
            const dx = game.player.x - this.x;
            this.direction = dx > 0 ? 1 : -1;
            
            if (Math.abs(dx) > 60) {
                this.x += this.direction * this.speed;
                this.state = 'running';
            } else {
                this.state = 'attacking';
                if (this.attackCooldown <= 0) {
                    game.player.health -= this.damage;
                    game.screenShake = 10;
                    this.attackCooldown = 60;
                    createParticles(game.player.x, game.player.y, '#ff0000', 5);
                }
            }
            
            this.attackCooldown--;
            this.animFrame++;
        }
        
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.scale(this.direction, 1);
            
            if (this.hitStun > 0) {
                ctx.fillStyle = '#ff8888';
            } else {
                const hue = (this.type * 30) % 360;
                ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
            }
            
            ctx.fillRect(-this.width/2, -this.height, this.width, this.height);
            
            ctx.fillStyle = '#000';
            ctx.fillRect(-10, -50, 8, 8);
            ctx.fillRect(2, -50, 8, 8);
            
            if (this.state === 'attacking') {
                ctx.fillStyle = '#888';
                ctx.fillRect(15, -40, 30, 8);
            }
            
            const healthPercent = this.health / this.maxHealth;
            ctx.fillStyle = '#333';
            ctx.fillRect(-20, -this.height - 15, 40, 6);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(-19, -this.height - 14, 38 * healthPercent, 4);
            
            ctx.restore();
        }
    }

    class PowerUp {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type;
            this.size = 30;
            this.rotation = 0;
            this.bobOffset = Math.random() * Math.PI * 2;
        }
        
        update() {
            this.rotation += 0.05;
            this.y += Math.sin(Date.now() / 200 + this.bobOffset) * 0.3;
        }
        
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            
            switch(this.type) {
                case 'health':
                    ctx.fillStyle = '#00ff00';
                    ctx.fillRect(-15, -15, 30, 30);
                    ctx.fillStyle = '#fff';
                    ctx.font = '20px Arial';
                    ctx.fillText('+', -7, 7);
                    break;
                case 'special':
                    ctx.fillStyle = '#ffff00';
                    ctx.beginPath();
                    ctx.arc(0, 0, 15, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#000';
                    ctx.font = 'bold 16px Arial';
                    ctx.fillText('S', -6, 6);
                    break;
                case 'speed':
                    ctx.fillStyle = '#00ffff';
                    ctx.fillRect(-15, -15, 30, 30);
                    ctx.fillStyle = '#000';
                    ctx.font = '20px Arial';
                    ctx.fillText('>>>', -15, 7);
                    break;
            }
            
            ctx.restore();
        }
    }

    class ScorePopup {
        constructor(x, y, score, combo) {
            this.x = x;
            this.y = y;
            this.score = score;
            this.combo = combo;
            this.life = 60;
            this.vy = -2;
        }
        
        update() {
            this.y += this.vy;
            this.vy *= 0.95;
            this.life--;
        }
        
        draw() {
            const alpha = this.life / 60;
            ctx.globalAlpha = alpha;
            ctx.font = `bold ${20 + this.combo}px Arial`;
            ctx.fillStyle = '#ffff00';
            ctx.textAlign = 'center';
            ctx.fillText(`+${this.score}`, this.x, this.y);
            ctx.globalAlpha = 1;
        }
    }

    function createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            game.particles.push(new Particle(
                x, y, color,
                3 + Math.random() * 5,
                { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed - 2 },
                30 + Math.random() * 20
            ));
        }
    }

    function spawnEnemy() {
        const type = Math.min(5, Math.floor(game.difficulty));
        game.enemies.push(new Enemy(type));
    }

    function spawnPowerUp() {
        const types = ['health', 'special', 'speed'];
        const type = types[Math.floor(Math.random() * types.length)];
        const x = 100 + Math.random() * (canvas.width - 200);
        game.powerUps.push(new PowerUp(x, game.groundY - 50, type));
    }

    function handleInput(data) {
        if (game.state !== 'playing') return;
        
        if (data.left) game.player.x -= game.player.speed;
        if (data.right) game.player.x += game.player.speed;
        
        game.player.x = Math.max(30, Math.min(canvas.width - 30, game.player.x));
        
        if (data.action && !game.player.attacking) {
            game.player.attacking = true;
            game.player.attackFrame = 20;
            
            for (let i = game.enemies.length - 1; i >= 0; i--) {
                const enemy = game.enemies[i];
                const dx = enemy.x - game.player.x;
                const dy = Math.abs(enemy.y - game.player.y);
                
                if (Math.abs(dx) < 80 && dy < 60) {
                    const damage = 20 + game.combo * 2;
                    enemy.health -= damage;
                    enemy.hitStun = 15;
                    
                    createParticles(enemy.x, enemy.y, '#ff0000', 8);
                    
                    game.scorePopup.push(new ScorePopup(
                        enemy.x, enemy.y - 50,
                        enemy.points + game.combo * 10,
                        game.combo
                    ));
                    
                    game.combo++;
                    if (game.combo > game.maxCombo) game.maxCombo = game.combo;
                    
                    game.player.specialMeter += 10;
                    if (game.player.specialMeter >= 100) {
                        game.player.specialReady = true;
                    }
                    
                    if (enemy.health <= 0) {
                        game.enemies.splice(i, 1);
                        game.score += enemy.points;
                    }
                }
            }
        }
        
        if (data.special && game.player.specialReady) {
            game.player.specialReady = false;
            game.player.specialMeter = 0;
            
            for (let i = 0; i < 20; i++) {
                const angle = (i / 20) * Math.PI * 2;
                game.particles.push(new Particle(
                    game.player.x, game.player.y - 30,
                    '#ffff00', 5,
                    { x: Math.cos(angle) * 10, y: Math.sin(angle) * 10 },
                    40
                ));
            }
            
            for (let i = game.enemies.length - 1; i >= 0; i--) {
                const enemy = game.enemies[i];
                enemy.health -= 50;
                enemy.hitStun = 30;
                createParticles(enemy.x, enemy.y, '#ffff00', 10);
                
                if (enemy.health <= 0) {
                    game.enemies.splice(i, 1);
                    game.score += enemy.points * 2;
                }
            }
        }
    }

    function update(timestamp) {
        if (game.lastTime === 0) game.lastTime = timestamp;
        game.deltaTime = timestamp - game.lastTime;
        game.lastTime = timestamp;
        
        if (game.state !== 'playing') return;
        
        game.timeLeft -= game.deltaTime / 1000;
        if (game.timeLeft <= 0) {
            game.state = 'gameover';
        }
        
        if (game.player.health <= 0) {
            game.state = 'gameover';
        }
        
        game.enemySpawnTimer++;
        if (game.enemySpawnTimer >= game.enemySpawnRate) {
            spawnEnemy();
            game.enemySpawnTimer = 0;
            game.enemySpawnRate = Math.max(30, 60 - game.difficulty * 5);
        }
        
        game.difficulty = 1 + Math.floor(game.score / 500);
        
        if (Math.random() < 0.005) {
            spawnPowerUp();
        }
        
        game.enemies.forEach(enemy => enemy.update());
        
        for (let i = game.powerUps.length - 1; i >= 0; i--) {
            const pu = game.powerUps[i];
            pu.update();
            
            const dx = pu.x - game.player.x;
            const dy = pu.y - (game.player.y - 30);
            if (Math.sqrt(dx*dx + dy*dy) < 40) {
                switch(pu.type) {
                    case 'health':
                        game.player.health = Math.min(game.player.maxHealth, game.player.health + 30);
                        break;
                    case 'special':
                        game.player.specialReady = true;
                        game.player.specialMeter = 100;
                        break;
                    case 'speed':
                        game.player.speed = 12;
                        setTimeout(() => game.player.speed = 8, 5000);
                        break;
                }
                game.powerUps.splice(i, 1);
            }
        }
        
        game.particles = game.particles.filter(p => {
            p.update();
            return p.life > 0;
        });
        
        game.scorePopup = game.scorePopup.filter(sp => {
            sp.update();
            return sp.life > 0;
        });
        
        if (game.player.attacking) {
            game.player.attackFrame--;
            if (game.player.attackFrame <= 0) {
                game.player.attacking = false;
            }
        }
        
        if (game.screenShake > 0) {
            game.screenShake *= 0.9;
        }
        
        if (game.combo > 0 && game.enemySpawnTimer % 60 === 0) {
            game.combo = Math.max(0, game.combo - 1);
        }
    }

    function draw() {
        ctx.save();
        
        if (game.screenShake > 0.5) {
            ctx.translate(
                (Math.random() - 0.5) * game.screenShake,
                (Math.random() - 0.5) * game.screenShake
            );
        }
        
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#0a0a15';
        ctx.fillRect(0, game.groundY, canvas.width, canvas.height - game.groundY);
        ctx.strokeStyle = '#4a4a6a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, game.groundY);
        ctx.lineTo(canvas.width, game.groundY);
        ctx.stroke();
        
        game.powerUps.forEach(pu => pu.draw());
        
        ctx.save();
        ctx.translate(game.player.x, game.player.y);
        
        if (game.player.attacking) {
            ctx.fillStyle = '#8888ff';
            ctx.fillRect(10, -40, 40, 10);
        }
        
        ctx.fillStyle = '#3498db';
        ctx.fillRect(-20, -60, 40, 60);
        
        ctx.fillStyle = '#f1c40f';
        const headY = game.player.direction > 0 ? -65 : -55;
        ctx.beginPath();
        ctx.arc(0, headY, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        const eyeOffset = game.player.direction > 0 ? 5 : -5;
        ctx.fillRect(eyeOffset - 5, headY - 5, 4, 4);
        ctx.fillRect(eyeOffset + 2, headY - 5, 4, 4);
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-15, -45, 30, 8);
        
        ctx.restore();
        
        game.enemies.forEach(enemy => enemy.draw());
        
        game.particles.forEach(p => p.draw());
        
        game.scorePopup.forEach(sp => sp.draw());
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 250, 120);
        
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${game.score}`, 20, 40);
        
        ctx.fillStyle = '#ffff00';
        ctx.fillText(`Combo: x${game.combo}`, 20, 70);
        
        ctx.fillStyle = '#fff';
        ctx.fillText(`Time: ${Math.ceil(game.timeLeft)}s`, 20, 100);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(20, 115, 200, 15);
        const healthPercent = game.player.health / game.player.maxHealth;
        ctx.fillStyle = healthPercent > 0.3 ? '#00ff00' : '#ff0000';
        ctx.fillRect(20, 115, 200 * healthPercent, 15);
        
        if (game.player.specialReady) {
            ctx.fillStyle = '#ffff00';
            ctx.fillText('SPECIAL READY!', 20, 145);
        }
        
        if (game.state === 'gameover') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 60px Arial';
            ctx.fillStyle = '#ff0000';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 40);
            
            ctx.font = '30px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Final Score: ${game.score}`, canvas.width/2, canvas.height/2 + 20);
            ctx.fillText(`Max Combo: x${game.maxCombo}`, canvas.width/2, canvas.height/2 + 60);
        }
    }

    function gameLoop(timestamp) {
        update(timestamp);
        draw();
        requestAnimationFrame(gameLoop);
    }

    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
        window.gameState = () => game.state;
    }

    requestAnimationFrame(gameLoop);
})();