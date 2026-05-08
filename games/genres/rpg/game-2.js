// RPG Game 2 - Kingdom Under Siege
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        player: {
            name: 'Hero',
            level: 1,
            exp: 0,
            expToLevel: 100,
            health: 100,
            maxHealth: 100,
            mana: 50,
            maxMana: 50,
            strength: 10,
            defense: 5,
            speed: 5,
            gold: 0,
            x: canvas.width / 2,
            y: canvas.height - 100,
            width: 40,
            height: 50,
            attacking: false,
            attackFrame: 0,
            direction: 1,
            skills: ['fireball', 'heal'],
            equipment: { weapon: null, armor: null, accessory: null }
        },
        enemies: [],
        allies: [],
        items: [],
        map: [],
        currentZone: 'forest',
        zones: {
            forest: { name: 'Dark Forest', enemyLevel: 1, bg: '#1a472a' },
            cave: { name: 'Crystal Cave', enemyLevel: 3, bg: '#2c3e50' },
            dungeon: { name: 'Shadow Dungeon', enemyLevel: 5, bg: '#1a1a2e' },
            castle: { name: 'Enemy Castle', enemyLevel: 8, bg: '#4a1a1a' },
            boss: { name: 'Dragon Lair', enemyLevel: 10, bg: '#3d1a1a' }
        },
        quests: [],
        combat: null,
        shop: null,
        dialogue: null,
        particles: [],
        cameraX: 0,
        cameraY: 0
    };

    class Enemy {
        constructor(type, level) {
            this.type = type;
            this.level = level;
            this.name = type;
            this.maxHealth = 30 + level * 20;
            this.health = this.maxHealth;
            this.attack = 5 + level * 3;
            this.defense = 2 + level * 2;
            this.exp = 20 + level * 10;
            this.gold = 10 + level * 5;
            this.x = Math.random() < 0.5 ? -50 : canvas.width + 50;
            this.y = 100 + Math.random() * (canvas.height - 200);
            this.width = 40;
            this.height = 50;
            this.state = 'roaming';
            this.aiTimer = 0;
            this.hitStun = 0;
            this.element = this.getElement(type);
        }
        
        getElement(type) {
            const elements = { slime: 'water', goblin: 'earth', skeleton: 'dark', dragon: 'fire', demon: 'dark' };
            return elements[type] || 'neutral';
        }
        
        update() {
            if (this.health <= 0) return;
            if (this.hitStun > 0) {
                this.hitStun--;
                return;
            }
            
            this.aiTimer++;
            
            const dx = game.player.x - this.x;
            const dy = game.player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 150) {
                this.state = 'attacking';
                if (this.aiTimer % 60 === 0 && dist < 100) {
                    const damage = Math.max(1, this.attack - game.player.defense);
                    game.player.health -= damage;
                    game.createParticles(game.player.x, game.player.y, '#e74c3c', 5);
                }
            } else {
                this.state = 'roaming';
                if (this.aiTimer % 30 === 0) {
                    const moveAngle = Math.random() * Math.PI * 2;
                    this.x += Math.cos(moveAngle) * 30;
                    this.y += Math.sin(moveAngle) * 30;
                }
            }
            
            this.x = Math.max(50, Math.min(canvas.width - 50, this.x));
            this.y = Math.max(80, Math.min(canvas.height - 80, this.y));
        }
        
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            const colors = {
                slime: '#3498db',
                goblin: '#27ae60',
                skeleton: '#ecf0f1',
                dragon: '#e74c3c',
                demon: '#8e44ad'
            };
            
            ctx.fillStyle = colors[this.type] || '#95a5a6';
            ctx.fillRect(-20, -25, 40, 50);
            
            if (this.type === 'slime') {
                ctx.beginPath();
                ctx.arc(0, -10, 25, Math.PI, 0);
                ctx.fill();
            }
            
            ctx.fillStyle = '#000';
            ctx.fillRect(-10, -35, 6, 6);
            ctx.fillRect(4, -35, 6, 6);
            
            if (this.state === 'attacking') {
                ctx.fillStyle = '#e74c3c';
                ctx.fillRect(15, -30, 20, 8);
            }
            
            ctx.restore();
            
            const healthPercent = this.health / this.maxHealth;
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - 20, this.y - 60, 40, 6);
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(-19, -59, 38 * healthPercent, 4);
            
            ctx.fillStyle = '#f1c40f';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Lv.${this.level}`, this.x, this.y - 68);
        }
    }

    class Item {
        constructor(type, name, value) {
            this.type = type;
            this.name = name;
            this.value = value;
            this.x = 100 + Math.random() * (canvas.width - 200);
            this.y = 100 + Math.random() * (canvas.height - 200);
            this.size = 25;
        }
        
        draw() {
            const screenX = this.x;
            const screenY = this.y;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 15, 0, Math.PI * 2);
            ctx.fill();
            
            const colors = { potion: '#e74c3c', sword: '#95a5a6', shield: '#3498db', gold: '#f1c40f' };
            ctx.fillStyle = colors[this.type] || '#fff';
            
            if (this.type === 'potion') {
                ctx.fillRect(screenX - 8, screenY - 12, 16, 24);
            } else if (this.type === 'sword') {
                ctx.fillRect(screenX - 3, screenY - 18, 6, 36);
            } else if (this.type === 'shield') {
                ctx.fillRect(screenX - 12, screenY - 10, 24, 20);
            } else {
                ctx.beginPath();
                ctx.arc(screenX, screenY, 10, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.name, screenX, screenY + 25);
        }
    }

    class Particle {
        constructor(x, y, color, size, life) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.size = size;
            this.life = life;
            this.maxLife = life;
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = (Math.random() - 0.5) * 4 - 2;
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
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    function createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            game.particles.push(new Particle(x, y, color, 3 + Math.random() * 4, 20 + Math.random() * 10));
        }
    }

    function spawnEnemy() {
        const types = ['slime', 'goblin', 'skeleton'];
        const zone = game.zones[game.currentZone];
        const type = types[Math.floor(Math.random() * types.length)];
        game.enemies.push(new Enemy(type, zone.enemyLevel));
    }

    function spawnBoss() {
        game.enemies.push(new Enemy('dragon', zone.enemyLevel + 2));
    }

    function handleInput(data) {
        if (game.state !== 'playing') return;
        
        const speed = 4;
        if (data.left) game.player.x -= speed;
        if (data.right) game.player.x += speed;
        if (data.up) game.player.y -= speed;
        if (data.down) game.player.y += speed;
        
        game.player.x = Math.max(30, Math.min(canvas.width - 30, game.player.x));
        game.player.y = Math.max(80, Math.min(canvas.height - 80, game.player.y));
        
        if (data.action && !game.player.attacking) {
            game.player.attacking = true;
            game.player.attackFrame = 15;
            
            for (let i = game.enemies.length - 1; i >= 0; i--) {
                const enemy = game.enemies[i];
                const dx = enemy.x - game.player.x;
                const dy = enemy.y - game.player.y;
                if (Math.sqrt(dx * dx + dy * dy) < 60) {
                    const damage = Math.max(1, game.player.strength - enemy.defense);
                    enemy.health -= damage;
                    enemy.hitStun = 10;
                    createParticles(enemy.x, enemy.y, '#fff', 8);
                    
                    if (enemy.health <= 0) {
                        game.player.exp += enemy.exp;
                        game.player.gold += enemy.gold;
                        createParticles(enemy.x, enemy.y, '#f1c40f', 15);
                        game.enemies.splice(i, 1);
                        
                        if (game.player.exp >= game.player.expToLevel) {
                            levelUp();
                        }
                    }
                }
            }
        }
        
        if (data.special) {
            if (game.player.mana >= 20) {
                game.player.mana -= 20;
                
                for (let i = 0; i < 10; i++) {
                    game.particles.push(new Particle(
                        game.player.x, game.player.y - 20,
                        '#e74c3c', 5, 30
                    ));
                }
                
                for (let i = game.enemies.length - 1; i >= 0; i--) {
                    const enemy = game.enemies[i];
                    const dx = enemy.x - game.player.x;
                    const dy = enemy.y - game.player.y;
                    if (Math.sqrt(dx * dx + dy * dy) < 150) {
                        const damage = 15 + game.player.level * 5;
                        enemy.health -= damage;
                        enemy.hitStun = 20;
                        
                        if (enemy.health <= 0) {
                            game.player.exp += enemy.exp;
                            game.player.gold += enemy.gold;
                            game.enemies.splice(i, 1);
                        }
                    }
                }
            }
        }
        
        if (data.buttons && data.buttons[4]) {
            for (let i = game.items.length - 1; i >= 0; i--) {
                const item = game.items[i];
                const dx = item.x - game.player.x;
                const dy = item.y - game.player.y;
                if (Math.sqrt(dx * dx + dy * dy) < 40) {
                    if (item.type === 'potion') {
                        game.player.health = Math.min(game.player.maxHealth, game.player.health + 30);
                    }
                    game.player.gold += item.value;
                    game.items.splice(i, 1);
                    break;
                }
            }
        }
    }

    function levelUp() {
        game.player.level++;
        game.player.exp -= game.player.expToLevel;
        game.player.expToLevel = Math.floor(game.player.expToLevel * 1.5);
        
        game.player.maxHealth += 20;
        game.player.health = game.player.maxHealth;
        game.player.maxMana += 10;
        game.player.mana = game.player.maxMana;
        game.player.strength += 3;
        game.player.defense += 2;
        
        for (let i = 0; i < 20; i++) {
            game.particles.push(new Particle(
                game.player.x, game.player.y,
                '#f1c40f', 8, 40
            ));
        }
    }

    function update() {
        if (game.state !== 'playing') return;
        
        if (game.player.health <= 0) {
            game.state = 'gameover';
            return;
        }
        
        if (Math.random() < 0.02 && game.enemies.length < 3) {
            spawnEnemy();
        }
        
        game.enemies.forEach(e => e.update());
        
        game.particles = game.particles.filter(p => {
            p.update();
            return p.life > 0;
        });
        
        if (game.player.attacking) {
            game.player.attackFrame--;
            if (game.player.attackFrame <= 0) {
                game.player.attacking = false;
            }
        }
        
        if (game.player.mana < game.player.maxMana) {
            game.player.mana += 0.05;
        }
        
        if (Math.random() < 0.005) {
            const itemTypes = [
                { type: 'potion', name: 'Health Potion', value: 20 },
                { type: 'sword', name: 'Iron Sword', value: 50 },
                { type: 'shield', name: 'Wood Shield', value: 40 },
                { type: 'gold', name: 'Gold Coins', value: 15 }
            ];
            const itemData = itemTypes[Math.floor(Math.random() * itemTypes.length)];
            game.items.push(new Item(itemData.type, itemData.name, itemData.value));
        }
    }

    function draw() {
        const zone = game.zones[game.currentZone];
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, zone.bg);
        gradient.addColorStop(1, '#0a0a0a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < 50; i++) {
            const x = (i * 73 + game.cameraX * 0.1) % canvas.width;
            const y = (i * 47) % (canvas.height / 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${0.02 + Math.random() * 0.03})`;
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = '#2d2d2d';
        ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
        
        game.items.forEach(item => item.draw());
        game.enemies.forEach(enemy => enemy.draw());
        game.particles.forEach(p => p.draw());
        
        ctx.save();
        ctx.translate(game.player.x, game.player.y);
        
        ctx.fillStyle = '#3498db';
        ctx.fillRect(-20, -25, 40, 50);
        
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(0, -35, 14, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2980b9';
        ctx.fillRect(-20, -25, 40, 12);
        
        if (game.player.attacking) {
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(game.player.direction * 15, -20, 25, 8);
        }
        
        ctx.restore();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 220, 140);
        
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#f1c40f';
        ctx.textAlign = 'left';
        ctx.fillText(`${game.player.name} Lv.${game.player.level}`, 20, 32);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(20, 45, 180, 14);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(20, 45, 180 * (game.player.health / game.player.maxHealth), 14);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText(`${Math.ceil(game.player.health)}/${game.player.maxHealth}`, 200, 56);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(20, 65, 180, 14);
        ctx.fillStyle = '#3498db';
        ctx.fillRect(20, 65, 180 * (game.player.mana / game.player.maxMana), 14);
        ctx.fillText(`${Math.ceil(game.player.mana)}/${game.player.maxMana}`, 200, 76);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(20, 85, 180, 10);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(20, 85, 180 * (game.player.exp / game.player.expToLevel), 10);
        ctx.fillStyle = '#fff';
        ctx.fillText(`XP: ${game.player.exp}/${game.player.expToLevel}`, 20, 103);
        
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`Gold: ${game.player.gold}`, 20, 122);
        ctx.fillText(`STR: ${game.player.strength}`, 100, 122);
        ctx.fillText(`DEF: ${game.player.defense}`, 160, 122);
        
        ctx.fillStyle = '#9b59b6';
        ctx.font = '12px Arial';
        ctx.fillText(`Zone: ${zone.name}`, 20, 142);
        
        if (game.state === 'gameover') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = '#e74c3c';
            ctx.textAlign = 'center';
            ctx.fillText('YOU DIED', canvas.width/2, canvas.height/2 - 20);
            
            ctx.font = '25px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Level ${game.player.level}`, canvas.width/2, canvas.height/2 + 30);
            ctx.fillText(`Gold: ${game.player.gold}`, canvas.width/2, canvas.height/2 + 60);
        }
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    for (let i = 0; i < 3; i++) {
        game.items.push(new Item('potion', 'Health Potion', 20));
    }
    
    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    gameLoop();
})();