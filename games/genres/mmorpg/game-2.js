// MMORPG Game 2 - Realm of Legends
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        player: {
            name: 'Hero',
            x: canvas.width / 2,
            y: canvas.height / 2,
            level: 1,
            exp: 0,
            expToLevel: 200,
            health: 100,
            maxHealth: 100,
            mana: 50,
            maxMana: 50,
            strength: 10,
            agility: 10,
            intelligence: 10,
            gold: 0,
            inventory: [],
            equipment: { weapon: null, armor: null, accessory: null },
            skills: [],
            quests: []
        },
        map: {
            width: 30,
            height: 20,
            tiles: [],
            entities: []
        },
        camera: { x: 0, y: 0 },
        players: [],
        monsters: [],
        npcs: [],
        chat: [],
        ui: 'game',
        target: null,
        time: 0,
        particles: [],
        effects: []
    };

    const TILE = {
        GRASS: 0,
        FOREST: 1,
        MOUNTAIN: 2,
        WATER: 3,
        DUNGEON: 4,
        TOWN: 5
    };

    function initMap() {
        game.map.tiles = [];
        for (let y = 0; y < game.map.height; y++) {
            game.map.tiles[y] = [];
            for (let x = 0; x < game.map.width; x++) {
                if (x === 0 || x === game.map.width - 1 || y === 0 || y === game.map.height - 1) {
                    game.map.tiles[y][x] = TILE.MOUNTAIN;
                } else if (Math.random() < 0.15) {
                    game.map.tiles[y][x] = TILE.FOREST;
                } else if (Math.random() < 0.05) {
                    game.map.tiles[y][x] = TILE.WATER;
                } else if (x > 2 && x < 6 && y > 2 && y < 6) {
                    game.map.tiles[y][x] = TILE.TOWN;
                } else {
                    game.map.tiles[y][x] = TILE.GRASS;
                }
            }
        }
        
        game.map.tiles[4][4] = TILE.TOWN;
        
        const monsterTypes = [
            { name: 'Slime', health: 30, exp: 15, gold: 5, level: 1 },
            { name: 'Wolf', health: 50, exp: 25, gold: 10, level: 2 },
            { name: 'Goblin', health: 40, exp: 20, gold: 8, level: 2 },
            { name: 'Orc', health: 80, exp: 40, gold: 20, level: 4 },
            { name: 'Dragon', health: 200, exp: 150, gold: 100, level: 10 }
        ];
        
        for (let i = 0; i < 20; i++) {
            const type = monsterTypes[Math.floor(Math.random() * 3)];
            game.monsters.push({
                name: type.name,
                x: Math.random() * (game.map.width - 4) + 2,
                y: Math.random() * (game.map.height - 4) + 2,
                health: type.health,
                maxHealth: type.health,
                exp: type.exp,
                gold: type.gold,
                level: type.level,
                attack: type.level * 5,
                state: 'roaming',
                patrolDir: Math.random() < 0.5 ? 1 : -1
            });
        }
        
        game.npcs.push({
            name: 'Quest Giver',
            x: 4,
            y: 4,
            type: 'quest',
            quest: { name: 'Slime Hunter', target: 'Slime', count: 5, reward: 50 }
        });
        
        game.npcs.push({
            name: 'Merchant',
            x: 5,
            y: 5,
            type: 'shop',
            items: [
                { name: 'Sword', cost: 100 },
                { name: 'Armor', cost: 150 },
                { name: 'Potion', cost: 20 }
            ]
        });
    }

    function handleInput(data) {
        if (game.state !== 'playing') return;
        
        const speed = 0.15;
        
        if (data.left) game.player.x -= speed;
        if (data.right) game.player.x += speed;
        if (data.up) game.player.y -= speed;
        if (data.down) game.player.y += speed;
        
        game.player.x = Math.max(1, Math.min(game.map.width - 1, game.player.x));
        game.player.y = Math.max(1, Math.min(game.map.height - 1, game.player.y));
        
        if (data.action) {
            const tileX = Math.floor(game.player.x);
            const tileY = Math.floor(game.player.y);
            
            for (let i = game.monsters.length - 1; i >= 0; i--) {
                const m = game.monsters[i];
                const dx = Math.abs(m.x - game.player.x);
                const dy = Math.abs(m.y - game.player.y);
                
                if (dx < 0.8 && dy < 0.8) {
                    const damage = game.player.strength + Math.floor(game.player.level * 2);
                    m.health -= damage;
                    
                    game.effects.push({
                        type: 'damage',
                        x: m.x * 40,
                        y: m.y * 40 - 20,
                        value: damage,
                        life: 30
                    });
                    
                    if (m.health <= 0) {
                        game.player.exp += m.exp;
                        game.player.gold += m.gold;
                        game.monsters.splice(i, 1);
                        
                        game.chat.push({ text: `Defeated ${m.name}! +${m.exp} XP`, color: '#f1c40f' });
                        
                        if (game.player.exp >= game.player.expToLevel) {
                            levelUp();
                        }
                    }
                    return;
                }
            }
            
            game.npcs.forEach(npc => {
                const dx = Math.abs(npc.x - game.player.x);
                const dy = Math.abs(npc.y - game.player.y);
                if (dx < 1 && dy < 1) {
                    if (npc.type === 'quest') {
                        game.player.quests.push({ ...npc.quest, progress: 0 });
                        game.chat.push({ text: `Quest: ${npc.quest.name} accepted!`, color: '#3498db' });
                    }
                }
            });
        }
        
        if (data.special) {
            if (game.player.mana >= 20) {
                game.player.mana -= 20;
                
                game.monsters.forEach(m => {
                    const dx = m.x - game.player.x;
                    const dy = m.y - game.player.y;
                    if (Math.sqrt(dx * dx + dy * dy) < 3) {
                        const damage = game.player.intelligence * 3;
                        m.health -= damage;
                        if (m.health <= 0) {
                            game.player.exp += m.exp;
                            game.player.gold += m.gold;
                        }
                    }
                });
                
                game.effects.push({
                    type: 'spell',
                    x: game.player.x * 40,
                    y: game.player.y * 40,
                    color: '#9b59b6',
                    life: 20
                });
            }
        }
    }

    function levelUp() {
        game.player.level++;
        game.player.exp -= game.player.expToLevel;
        game.player.expToLevel = Math.floor(game.player.expToLevel * 1.5);
        
        game.player.maxHealth += 20;
        game.player.maxMana += 10;
        game.player.health = game.player.maxHealth;
        game.player.mana = game.player.maxMana;
        game.player.strength += 2;
        game.player.agility += 1;
        game.player.intelligence += 2;
        
        game.chat.push({ text: `LEVEL UP! Now level ${game.player.level}`, color: '#ffd700' });
        
        for (let i = 0; i < 20; i++) {
            game.particles.push({
                x: game.player.x * 40,
                y: game.player.y * 40,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5 - 3,
                color: '#ffd700',
                life: 40
            });
        }
    }

    function update() {
        if (game.state !== 'playing') return;
        
        game.time += 1/60;
        
        game.monsters.forEach(m => {
            if (m.state === 'roaming') {
                if (Math.random() < 0.02) {
                    m.x += m.patrolDir * 0.5;
                }
                if (Math.random() < 0.02) {
                    m.y += (Math.random() - 0.5);
                }
                m.x = Math.max(1, Math.min(game.map.width - 1, m.x));
                m.y = Math.max(1, Math.min(game.map.height - 1, m.y));
            }
            
            const dx = game.player.x - m.x;
            const dy = game.player.y - m.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 1.5) {
                if (Math.random() < 0.02) {
                    const damage = m.attack - game.player.level;
                    game.player.health -= Math.max(1, damage);
                    game.effects.push({
                        type: 'damage',
                        x: game.player.x * 40,
                        y: game.player.y * 40 - 30,
                        value: Math.max(1, damage),
                        color: '#e74c3c',
                        life: 30
                    });
                }
            }
        });
        
        if (Math.random() < 0.005 && game.monsters.length < 25) {
            const types = [
                { name: 'Slime', health: 30, exp: 15, gold: 5, level: 1 },
                { name: 'Wolf', health: 50, exp: 25, gold: 10, level: 2 }
            ];
            const type = types[Math.floor(Math.random() * types.length)];
            game.monsters.push({
                name: type.name,
                x: Math.random() * (game.map.width - 4) + 2,
                y: Math.random() * (game.map.height - 4) + 2,
                health: type.health,
                maxHealth: type.health,
                exp: type.exp,
                gold: type.gold,
                level: type.level,
                attack: type.level * 5,
                state: 'roaming',
                patrolDir: Math.random() < 0.5 ? 1 : -1
            });
        }
        
        game.camera.x = Math.floor(game.player.x * 40 - canvas.width / 2);
        game.camera.y = Math.floor(game.player.y * 40 - canvas.height / 2);
        
        game.effects = game.effects.filter(e => {
            e.life--;
            if (e.type === 'spell') {
                e.y -= 1;
            }
            return e.life > 0;
        });
        
        game.particles = game.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life--;
            return p.life > 0;
        });
        
        if (game.player.health <= 0) {
            game.player.health = game.player.maxHealth;
            game.player.x = 4;
            game.player.y = 4;
            game.player.gold = Math.floor(game.player.gold * 0.9);
        }
        
        game.chat = game.chat.filter(c => {
            c.life = (c.life || 180) - 1;
            return c.life > 0;
        });
    }

    function draw() {
        const colors = {
            [TILE.GRASS]: '#2ecc71',
            [TILE.FOREST]: '#27ae60',
            [TILE.MOUNTAIN]: '#7f8c8d',
            [TILE.WATER]: '#3498db',
            [TILE.DUNGEON]: '#2c3e50',
            [TILE.TOWN]: '#e67e22'
        };
        
        for (let y = 0; y < game.map.height; y++) {
            for (let x = 0; x < game.map.width; x++) {
                const screenX = x * 40 - game.camera.x;
                const screenY = y * 40 - game.camera.y;
                
                if (screenX < -40 || screenX > canvas.width) continue;
                
                ctx.fillStyle = colors[game.map.tiles[y][x]];
                ctx.fillRect(screenX, screenY, 40, 40);
                
                if (game.map.tiles[y][x] === TILE.FOREST) {
                    ctx.fillStyle = '#1e8449';
                    ctx.beginPath();
                    ctx.moveTo(screenX + 20, screenY + 5);
                    ctx.lineTo(screenX + 5, screenY + 35);
                    ctx.lineTo(screenX + 35, screenY + 35);
                    ctx.fill();
                }
                
                if (game.map.tiles[y][x] === TILE.TOWN) {
                    ctx.fillStyle = '#d35400';
                    ctx.fillRect(screenX + 5, screenY + 20, 30, 20);
                    ctx.fillStyle = '#e74c3c';
                    ctx.beginPath();
                    ctx.moveTo(screenX + 5, screenY + 20);
                    ctx.lineTo(screenX + 20, screenY + 5);
                    ctx.lineTo(screenX + 35, screenY + 20);
                    ctx.fill();
                }
            }
        }
        
        game.npcs.forEach(npc => {
            const screenX = npc.x * 40 - game.camera.x;
            const screenY = npc.y * 40 - game.camera.y;
            
            ctx.fillStyle = '#9b59b6';
            ctx.beginPath();
            ctx.arc(screenX + 20, screenY + 20, 15, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('!', screenX + 20, screenY + 15);
        });
        
        game.monsters.forEach(m => {
            const screenX = m.x * 40 - game.camera.x;
            const screenY = m.y * 40 - game.camera.y;
            
            const hp = m.health / m.maxHealth;
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(screenX + 10, screenY, 20, 4);
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(10, screenY, 20 * hp, 4);
            
            ctx.fillStyle = '#c0392b';
            ctx.beginPath();
            ctx.arc(screenX + 20, screenY + 20, 12, 0, Math.PI * 2);
            ctx.fill();
        });
        
        const pScreenX = game.player.x * 40 - game.camera.x;
        const pScreenY = game.player.y * 40 - game.camera.y;
        
        ctx.fillStyle = '#3498db';
        ctx.fillRect(pScreenX + 12, pScreenY + 20, 16, 25);
        
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(pScreenX + 20, pScreenY + 15, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2980b9';
        ctx.fillRect(pScreenX + 12, pScreenY + 20, 16, 8);
        
        game.particles.forEach(p => {
            ctx.globalAlpha = p.life / 40;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x - game.camera.x, p.y - game.camera.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        game.effects.forEach(e => {
            ctx.globalAlpha = e.life / 30;
            if (e.type === 'damage') {
                ctx.fillStyle = e.color || '#fff';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(e.value, e.x - game.camera.x, e.y - game.camera.y);
            } else if (e.type === 'spell') {
                ctx.fillStyle = e.color || '#9b59b6';
                ctx.beginPath();
                ctx.arc(e.x - game.camera.x, e.y - game.camera.y, 30 * (1 - e.life / 20), 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.globalAlpha = 1;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 200, 130);
        
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'left';
        ctx.fillText(`${game.player.name} Lv.${game.player.level}`, 20, 35);
        
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
        ctx.font = '16px Arial';
        ctx.fillText(`Gold: ${game.player.gold}`, 20, 115);
        ctx.fillText(`STR: ${game.player.strength}`, 100, 115);
        
        if (game.chat.length > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(10, canvas.height - 120, 300, 100);
            
            game.chat.slice(-3).forEach((msg, i) => {
                ctx.fillStyle = msg.color;
                ctx.font = '14px Arial';
                ctx.fillText(msg.text, 20, canvas.height - 100 + i * 25);
            });
        }
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    initMap();
    
    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    gameLoop();
})();