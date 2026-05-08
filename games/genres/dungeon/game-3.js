// Dungeon Game 3 - Temple of Doom
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        player: {
            x: 5,
            y: 5,
            health: 100,
            maxHealth: 100,
            attack: 8,
            defense: 3,
            speed: 4,
            exp: 0,
            level: 1,
            expToLevel: 50,
            gold: 0,
            weapon: 'fists',
            armor: 'cloth',
            potions: 2,
            torches: 3,
            map: [],
            fog: [],
            visited: []
        },
        map: {
            width: 25,
            height: 20,
            tiles: [],
            rooms: [],
            enemies: [],
            items: [],
            traps: [],
            exit: null
        },
        camera: { x: 0, y: 0 },
        time: 0,
        darkness: true,
        lightRadius: 4,
        score: 0,
        enemiesKilled: 0
    };

    const TILES = {
        FLOOR: 0,
        WALL: 1,
        DOOR: 2,
        STAIRS: 3,
        TRAP: 4,
        WATER: 5,
        CHEST: 6
    };

    function generateMap() {
        game.map.tiles = [];
        for (let y = 0; y < game.map.height; y++) {
            game.map.tiles[y] = [];
            game.player.fog[y] = [];
            game.player.visited[y] = [];
            for (let x = 0; x < game.map.width; x++) {
                game.map.tiles[y][x] = TILES.WALL;
                game.player.fog[y][x] = true;
                game.player.visited[y][x] = false;
            }
        }
        
        const numRooms = 10;
        game.map.rooms = [];
        
        for (let i = 0; i < numRooms; i++) {
            const room = {
                x: Math.floor(Math.random() * (game.map.width - 8)) + 2,
                y: Math.floor(Math.random() * (game.map.height - 8)) + 2,
                w: 4 + Math.floor(Math.random() * 6),
                h: 4 + Math.floor(Math.random() * 5)
            };
            
            for (let y = room.y; y < room.y + room.h && y < game.map.height - 1; y++) {
                for (let x = room.x; x < room.x + room.w && x < game.map.width - 1; x++) {
                    game.map.tiles[y][x] = TILES.FLOOR;
                }
            }
            
            game.map.rooms.push(room);
        }
        
        for (let i = 0; i < numRooms - 1; i++) {
            const r1 = game.map.rooms[i];
            const r2 = game.map.rooms[i + 1];
            
            const x1 = Math.floor(r1.x + r1.w / 2);
            const y1 = Math.floor(r1.y + r1.h / 2);
            const x2 = Math.floor(r2.x + r2.w / 2);
            const y2 = Math.floor(r2.y + r2.h / 2);
            
            let cx = x1;
            while (cx !== x2) {
                game.map.tiles[y1][cx] = TILES.FLOOR;
                cx += x2 > x1 ? 1 : -1;
            }
            
            let cy = y1;
            while (cy !== y2) {
                game.map.tiles[cy][x2] = TILES.FLOOR;
                cy += y2 > y1 ? 1 : -1;
            }
        }
        
        const startRoom = game.map.rooms[0];
        game.player.x = Math.floor(startRoom.x + startRoom.w / 2);
        game.player.y = Math.floor(startRoom.y + startRoom.h / 2);
        
        const endRoom = game.map.rooms[game.map.rooms.length - 1];
        game.map.exit = {
            x: Math.floor(endRoom.x + endRoom.w / 2),
            y: Math.floor(endRoom.y + endRoom.h / 2)
        };
        game.map.tiles[game.map.exit.y][game.map.exit.x] = TILES.STAIRS;
        
        for (let i = 2; i < game.map.rooms.length - 1; i++) {
            const room = game.map.rooms[i];
            
            if (Math.random() < 0.4) {
                game.map.items.push({
                    x: Math.floor(room.x + room.w / 2),
                    y: Math.floor(room.y + room.h / 2),
                    type: Math.random() < 0.5 ? 'gold' : 'potion'
                });
            }
            
            if (Math.random() < 0.3) {
                game.map.traps.push({
                    x: Math.floor(room.x + Math.random() * room.w),
                    y: Math.floor(room.y + Math.random() * room.h),
                    triggered: false
                });
            }
        }
        
        const enemyTypes = [
            { name: 'Rat', hp: 15, atk: 4, exp: 5 },
            { name: 'Bat', hp: 10, atk: 3, exp: 4 },
            { name: 'Spider', hp: 25, atk: 6, exp: 10 },
            { name: 'Skeleton', hp: 30, atk: 8, exp: 15 },
            { name: 'Troll', hp: 50, atk: 12, exp: 30 }
        ];
        
        for (let i = 3; i < game.map.rooms.length - 1; i++) {
            const room = game.map.rooms[i];
            const type = enemyTypes[Math.min(i - 2, enemyTypes.length - 1)];
            
            game.map.enemies.push({
                x: Math.floor(room.x + room.w / 2),
                y: Math.floor(room.y + room.h / 2),
                name: type.name,
                hp: type.hp,
                maxHp: type.hp,
                atk: type.atk,
                exp: type.exp,
                state: 'idle'
            });
        }
        
        updateFog();
    }

    function updateFog() {
        for (let y = 0; y < game.map.height; y++) {
            for (let x = 0; x < game.map.width; x++) {
                const dx = x - game.player.x;
                const dy = y - game.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < game.lightRadius) {
                    game.player.fog[y][x] = false;
                    game.player.visited[y][x] = true;
                }
            }
        }
    }

    function handleInput(data) {
        if (game.state !== 'playing') return;
        
        let dx = 0, dy = 0;
        
        if (data.up) dy = -1;
        if (data.down) dy = 1;
        if (data.left) dx = -1;
        if (data.right) dx = 1;
        
        if (dx !== 0 || dy !== 0) {
            movePlayer(dx, dy);
        }
        
        if (data.action && game.player.potions > 0) {
            game.player.health = Math.min(game.player.maxHealth, game.player.health + 25);
            game.player.potions--;
            game.score += 10;
        }
    }

    function movePlayer(dx, dy) {
        const newX = game.player.x + dx;
        const newY = game.player.y + dy;
        
        if (newX < 0 || newX >= game.map.width || newY < 0 || newY >= game.map.height) return;
        
        const tile = game.map.tiles[newY][newX];
        
        if (tile === TILES.WALL) return;
        
        if (tile === TILES.STAIRS) {
            game.score += 500;
            game.state = 'victory';
            return;
        }
        
        for (let i = 0; i < game.map.enemies.length; i++) {
            const e = game.map.enemies[i];
            if (e.x === newX && e.y === newY) {
                attack(i);
                return;
            }
        }
        
        for (let i = 0; i < game.map.traps.length; i++) {
            const t = game.map.traps[i];
            if (t.x === newX && t.y === newY && !t.triggered) {
                game.player.health -= 20;
                t.triggered = true;
                game.score -= 20;
            }
        }
        
        for (let i = 0; i < game.map.items.length; i++) {
            const item = game.map.items[i];
            if (item.x === newX && item.y === newY) {
                if (item.type === 'gold') {
                    const amount = 10 + Math.floor(Math.random() * 30);
                    game.player.gold += amount;
                    game.score += amount;
                } else if (item.type === 'potion') {
                    game.player.potions++;
                }
                game.map.items.splice(i, 1);
            }
        }
        
        game.player.x = newX;
        game.player.y = newY;
        
        updateFog();
        
        game.map.enemies.forEach(e => {
            const dist = Math.sqrt(Math.pow(e.x - game.player.x, 2) + Math.pow(e.y - game.player.y, 2));
            
            if (dist < 6 && Math.random() < 0.3) {
                if (dist > 1) {
                    const edx = game.player.x - e.x;
                    const edy = game.player.y - e.y;
                    const angle = Math.atan2(edy, edx);
                    
                    let ex = Math.round(e.x + Math.cos(angle));
                    let ey = Math.round(e.y + Math.sin(angle));
                    
                    if (ex >= 0 && ex < game.map.width && ey >= 0 && ey < game.map.height &&
                        game.map.tiles[ey][ex] !== TILES.WALL) {
                        e.x = ex;
                        e.y = ey;
                    }
                } else {
                    const damage = Math.max(1, e.atk - game.player.defense + Math.floor(Math.random() * 3));
                    game.player.health -= damage;
                }
            }
        });
        
        if (game.player.health <= 0) {
            game.state = 'gameover';
        }
    }

    function attack(enemyIndex) {
        const e = game.map.enemies[enemyIndex];
        
        const damage = game.player.attack + Math.floor(Math.random() * 5);
        e.hp -= damage;
        
        if (e.hp <= 0) {
            game.player.exp += e.exp;
            game.player.gold += e.exp;
            game.score += e.exp * 2;
            game.enemiesKilled++;
            game.map.enemies.splice(enemyIndex, 1);
            
            if (game.player.exp >= game.player.expToLevel) {
                levelUp();
            }
        } else {
            const enemyDamage = Math.max(1, e.atk - game.player.defense + Math.floor(Math.random() * 2));
            game.player.health -= enemyDamage;
        }
        
        if (game.player.health <= 0) {
            game.state = 'gameover';
        }
    }

    function levelUp() {
        game.player.level++;
        game.player.exp -= game.player.expToLevel;
        game.player.expToLevel = Math.floor(game.player.expToLevel * 1.5);
        
        game.player.maxHealth += 15;
        game.player.health = game.player.maxHealth;
        game.player.attack += 3;
        game.player.defense += 1;
        game.player.speed += 0.5;
    }

    function update() {
        if (game.state !== 'playing') return;
        
        game.time++;
    }

    function draw() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#000');
        gradient.addColorStop(1, '#111');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const tileSize = 28;
        const offsetX = canvas.width / 2 - game.player.x * tileSize;
        const offsetY = canvas.height / 2 - game.player.y * tileSize;
        
        for (let y = 0; y < game.map.height; y++) {
            for (let x = 0; x < game.map.width; x++) {
                const screenX = x * tileSize + offsetX;
                const screenY = y * tileSize + offsetY;
                
                if (screenX < -tileSize || screenX > canvas.width) continue;
                
                if (game.player.fog[y][x]) {
                    ctx.fillStyle = '#000';
                    ctx.fillRect(screenX, screenY, tileSize, tileSize);
                    continue;
                }
                
                const tile = game.map.tiles[y][x];
                
                const colors = {
                    [TILES.FLOOR]: '#222',
                    [TILES.WALL]: '#444',
                    [TILES.STAIRS]: '#f39c12',
                    [TILES.TRAP]: '#e74c3c',
                    [TILES.CHEST]: '#9b59b6'
                };
                
                ctx.fillStyle = colors[tile] || '#222';
                ctx.fillRect(screenX + 1, screenY + 1, tileSize - 2, tileSize - 2);
                
                if (tile === TILES.TRAP) {
                    ctx.fillStyle = '#c0392b';
                    ctx.beginPath();
                    ctx.moveTo(screenX + tileSize/2, screenY + 5);
                    ctx.lineTo(screenX + 5, screenY + tileSize - 5);
                    ctx.lineTo(screenX + tileSize - 5, screenY + tileSize - 5);
                    ctx.fill();
                }
            }
        }
        
        game.map.items.forEach(item => {
            const screenX = item.x * tileSize + offsetX + tileSize/2;
            const screenY = item.y * tileSize + offsetY + tileSize/2;
            
            if (game.player.fog[item.y][item.x]) return;
            
            ctx.fillStyle = item.type === 'gold' ? '#f1c40f' : '#e74c3c';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 8, 0, Math.PI * 2);
            ctx.fill();
        });
        
        game.map.enemies.forEach(e => {
            const screenX = e.x * tileSize + offsetX + tileSize/2;
            const screenY = e.y * tileSize + offsetY + tileSize/2;
            
            if (game.player.fog[e.y][e.x]) return;
            
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 10, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#333';
            ctx.fillRect(screenX - 10, screenY - 14, 20, 4);
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(-9, -13, 18 * (e.hp / e.maxHp), 2);
        });
        
        const playerScreenX = game.player.x * tileSize + offsetX + tileSize/2;
        const playerScreenY = game.player.y * tileSize + offsetY + tileSize/2;
        
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(playerScreenX, playerScreenY, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(playerScreenX - 3, playerScreenY - 3, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 140, 100);
        
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(`HP: ${game.player.health}/${game.player.maxHealth}`, 20, 30);
        
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`Gold: ${game.player.gold}`, 20, 52);
        
        ctx.fillStyle = '#3498db';
        ctx.fillText(`Level: ${game.player.level}`, 20, 74);
        
        ctx.fillStyle = '#2ecc71';
        ctx.fillText(`Potions: ${game.player.potions}`, 20, 96);
        
        ctx.fillStyle = '#95a5a6';
        ctx.font = '12px Arial';
        ctx.fillText(`XP: ${game.player.exp}/${game.player.expToLevel}`, 90, 30);
        
        if (game.state === 'gameover') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = '#e74c3c';
            ctx.textAlign = 'center';
            ctx.fillText('YOU DIED', canvas.width/2, canvas.height/2);
            
            ctx.font = '25px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Score: ${game.score}`, canvas.width/2, canvas.height/2 + 45);
        }
        
        if (game.state === 'victory') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = '#ffd700';
            ctx.textAlign = 'center';
            ctx.fillText('TEMPLE CLEARED!', canvas.width/2, canvas.height/2 - 20);
            
            ctx.font = '25px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Score: ${game.score}`, canvas.width/2, canvas.height/2 + 30);
            ctx.fillText(`Enemies: ${game.enemiesKilled}`, canvas.width/2, canvas.height/2 + 60);
        }
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    generateMap();
    
    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    gameLoop();
})();