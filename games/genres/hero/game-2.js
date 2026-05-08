// Hero Game 2 - Legend of the Dragon
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        player: {
            x: canvas.width / 2,
            y: canvas.height / 2,
            width: 40,
            height: 60,
            health: 100,
            maxHealth: 100,
            mana: 100,
            maxMana: 100,
            level: 1,
            exp: 0,
            expToLevel: 100,
            gold: 0,
            attack: 10,
            defense: 5,
            speed: 5,
            skills: ['fireball', 'heal', 'shield'],
            weapon: 'sword',
            armor: 'leather'
        },
        enemies: [],
        loot: [],
        particles: [],
        quest: { active: true, target: 'dragon', count: 0, required: 1 },
        map: 'forest',
        cameraX: 0,
        cameraY: 0,
        time: 0,
        dayNight: 0,
        NPCs: [],
        dialogActive: false,
        dialogText: '',
        shop: null
    };

    class Enemy {
        constructor(type) {
            this.type = type;
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.width = 40;
            this.height = 50;
            
            const stats = {
                goblin: { health: 30, attack: 8, exp: 20, gold: 10 },
                orc: { health: 60, attack: 15, exp: 40, gold: 25 },
                dragon: { health: 200, attack: 30, exp: 200, gold: 100 }
            };
            
            const s = stats[type];
            this.health = s.health;
            this.maxHealth = s.health;
            this.attack = s.attack;
            this.exp = s.exp;
            this.gold = s.gold;
            
            this.state = 'roaming';
            this.aiTimer = 0;
        }
        
        update() {
            if (this.health <= 0) return;
            
            const dx = game.player.x - this.x;
            const dy = game.player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 150) {
                this.state = 'chasing';
            } else {
                this.state = 'roaming';
            }
            
            this.aiTimer++;
            
            if (this.state === 'chasing') {
                this.x += (dx / dist) * 2;
                this.y += (dy / dist) * 2;
                
                if (dist < 40 && this.aiTimer % 60 === 0) {
                    game.player.health -= this.attack;
                }
            } else if (this.aiTimer % 120 === 0) {
                this.x += (Math.random() - 0.5) * 100;
                this.y += (Math.random() - 0.5) * 100;
            }
            
            this.x = Math.max(30, Math.min(canvas.width - 30, this.x));
            this.y = Math.max(30, Math.min(canvas.height - 30, this.y));
        }
        
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            const colors = { goblin: '#4caf50', orc: '#ff5722', dragon: '#f44336' };
            ctx.fillStyle = colors[this.type];
            ctx.fillRect(-20, -25, 40, 50);
            
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(0, -35, 12, 0, Math.PI * 2);
            ctx.fill();
            
            if (this.state === 'chasing') {
                ctx.fillStyle = '#000';
                ctx.fillRect(-5, -38, 4, 4);
                ctx.fillRect(2, -38, 4, 4);
            }
            
            ctx.restore();
            
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - 20, this.y - 60, 40, 6);
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(-19, -59, 38 * (this.health / this.maxHealth), 4);
        }
    }

    function handleInput(data) {
        if (game.state !== 'playing') return;
        
        const speed = game.player.speed;
        
        if (data.left) game.player.x -= speed;
        if (data.right) game.player.x += speed;
        if (data.up) game.player.y -= speed;
        if (data.down) game.player.y += speed;
        
        game.player.x = Math.max(30, Math.min(canvas.width - 30, game.player.x));
        game.player.y = Math.max(30, Math.min(canvas.height - 30, game.player.y));
        
        if (data.action) {
            game.enemies.forEach((enemy, i) => {
                const dx = enemy.x - game.player.x;
                const dy = enemy.y - game.player.y;
                if (Math.sqrt(dx * dx + dy * dy) < 60) {
                    enemy.health -= game.player.attack;
                    createParticles(enemy.x, enemy.y, '#fff', 5);
                    
                    if (enemy.health <= 0) {
                        game.player.exp += enemy.exp;
                        game.player.gold += enemy.gold;
                        game.quest.count++;
                        createParticles(enemy.x, enemy.y, '#ffd700', 15);
                        game.enemies.splice(i, 1);
                    }
                }
            });
        }
        
        if (data.special) {
            if (game.player.mana >= 30) {
                game.player.mana -= 30;
                
                game.enemies.forEach(enemy => {
                    const dx = enemy.x - game.player.x;
                    const dy = enemy.y - game.player.y;
                    if (Math.sqrt(dx * dx + dy * dy) < 150) {
                        enemy.health -= 30;
                        if (enemy.health <= 0) {
                            game.player.exp += enemy.exp;
                            game.player.gold += enemy.gold;
                            game.quest.count++;
                        }
                    }
                });
                
                createParticles(game.player.x, game.player.y - 30, '#e74c3c', 20);
            }
        }
    }

    function createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            game.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color,
                life: 25
            });
        }
    }

    function update() {
        if (game.state !== 'playing') return;
        
        game.time += 1/60;
        game.dayNight = (game.dayNight + 0.01) % 1;
        
        if (game.player.exp >= game.player.expToLevel) {
            levelUp();
        }
        
        if (game.quest.count >= game.quest.required) {
            game.player.gold += 500;
            game.quest.count = 0;
        }
        
        if (Math.random() < 0.02 && game.enemies.length < 5) {
            const types = ['goblin', 'goblin', 'orc'];
            const type = types[Math.floor(Math.random() * types.length)];
            game.enemies.push(new Enemy(type));
        }
        
        game.enemies.forEach(e => e.update());
        
        game.particles = game.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            return p.life > 0;
        });
        
        game.player.mana = Math.min(game.player.maxMana, game.player.mana + 0.1);
    }

    function levelUp() {
        game.player.level++;
        game.player.exp -= game.player.expToLevel;
        game.player.expToLevel = Math.floor(game.player.expToLevel * 1.5);
        
        game.player.maxHealth += 20;
        game.player.health = game.player.maxHealth;
        game.player.maxMana += 10;
        game.player.mana = game.player.maxMana;
        game.player.attack += 5;
        game.player.defense += 2;
        
        createParticles(game.player.x, game.player.y, '#ffd700', 20);
    }

    function draw() {
        const isNight = game.dayNight > 0.7 || game.dayNight < 0.3;
        
        if (isNight) {
            ctx.fillStyle = '#1a1a2e';
        } else {
            ctx.fillStyle = '#2ecc71';
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (!isNight) {
            for (let i = 0; i < 20; i++) {
                ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
                ctx.beginPath();
                ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height * 0.6, 30 + Math.random() * 20, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        game.enemies.forEach(e => e.draw());
        
        ctx.save();
        ctx.translate(game.player.x, game.player.y);
        
        ctx.fillStyle = '#3498db';
        ctx.fillRect(-20, -30, 40, 60);
        
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(0, -40, 14, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2980b9';
        ctx.fillRect(-20, -30, 40, 12);
        
        ctx.restore();
        
        game.particles.forEach(p => {
            ctx.globalAlpha = p.life / 25;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 180, 140);
        
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'left';
        ctx.fillText(`Lv.${game.player.level} Hero`, 20, 35);
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(20, 50, 150, 12);
        ctx.fillRect(20, 50, 150 * (game.player.health / game.player.maxHealth), 12);
        
        ctx.fillStyle = '#3498db';
        ctx.fillRect(20, 70, 150, 12);
        ctx.fillRect(20, 70, 150 * (game.player.mana / game.player.maxMana), 12);
        
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(20, 90, 150, 10);
        ctx.fillRect(20, 90, 150 * (game.player.exp / game.player.expToLevel), 10);
        
        ctx.fillStyle = '#fff';
        ctx.fillText(`Gold: ${game.player.gold}`, 20, 115);
        ctx.fillText(`ATK: ${game.player.attack}`, 100, 115);
        ctx.fillText(`DEF: ${game.player.defense}`, 140, 115);
        
        if (game.quest.active) {
            ctx.fillStyle = '#f1c40f';
            ctx.fillText(`Quest: ${game.quest.count}/${game.quest.required}`, 20, 135);
        }
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    game.enemies.push(new Enemy('goblin'));
    
    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    gameLoop();
})();