// Roguelike Game 4 - Dungeon Crawler
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'exploring',
        player: {
            x: 0,
            y: 0,
            health: 100,
            maxHealth: 100,
            attack: 10,
            defense: 5,
            gold: 0,
            level: 1,
            exp: 0,
            expToLevel: 100,
            inventory: [],
            equipment: { weapon: null, armor: null },
            potions: 3,
            keys: 0
        },
        dungeon: {
            floors: [],
            currentFloor: 1,
            maxFloors: 5,
            roomSize: 10,
            rooms: []
        },
        enemies: [],
        items: [],
        map: [],
        mapWidth: 30,
        mapHeight: 20,
        cameraX: 0,
        cameraY: 0,
        turn: 0,
        score: 0,
        time: 0
    };

    const TILE_TYPES = {
        FLOOR: '.',
        WALL: '#',
        DOOR: 'D',
        STAIRS: '>',
        CHEST: 'C',
        TRAP: '^',
        WATER: '~'
    };

    function generateDungeon() {
        game.map = [];
        for (let y = 0; y < game.mapHeight; y++) {
            game.map[y] = [];
            for (let x = 0; x < game.mapWidth; x++) {
                game.map[y][x] = TILE_TYPES.WALL;
            }
        }
        
        const numRooms = 8 + Math.floor(Math.random() * 4);
        game.dungeon.rooms = [];
        
        for (let i = 0; i < numRooms; i++) {
            const room = {
                x: Math.floor(Math.random() * (game.mapWidth - 8)) + 2,
                y: Math.floor(Math.random() * (game.mapHeight - 6)) + 2,
                width: 4 + Math.floor(Math.random() * 6),
                height: 4 + Math.floor(Math.random() * 4)
            };
            
            for (let y = room.y; y < room.y + room.height && y < game.mapHeight - 1; y++) {
                for (let x = room.x; x < room.x + room.width && x < game.mapWidth - 1; x++) {
                    game.map[y][x] = TILE_TYPES.FLOOR;
                }
            }
            
            game.dungeon.rooms.push(room);
        }
        
        for (let i = 0; i < numRooms - 1; i++) {
            const r1 = game.dungeon.rooms[i];
            const r2 = game.dungeon.rooms[i + 1];
            
            const x1 = Math.floor(r1.x + r1.width / 2);
            const y1 = Math.floor(r1.y + r1.height / 2);
            const x2 = Math.floor(r2.x + r2.width / 2);
            const y2 = Math.floor(r2.y + r2.height / 2);
            
            let cx = x1;
            while (cx !== x2) {
                game.map[y1][cx] = TILE_TYPES.FLOOR;
                cx += x2 > x1 ? 1 : -1;
            }
            
            let cy = y1;
            while (cy !== y2) {
                game.map[cy][x2] = TILE_TYPES.FLOOR;
                cy += y2 > y1 ? 1 : -1;
            }
        }
        
        const startRoom = game.dungeon.rooms[0];
        game.player.x = Math.floor(startRoom.x + startRoom.width / 2);
        game.player.y = Math.floor(startRoom.y + startRoom.height / 2);
        
        if (game.dungeon.rooms.length > 1) {
            const endRoom = game.dungeon.rooms[game.dungeon.rooms.length - 1];
            const ex = Math.floor(endRoom.x + endRoom.width / 2);
            const ey = Math.floor(endRoom.y + endRoom.height / 2);
            game.map[ey][ex] = TILE_TYPES.STAIRS;
        }
        
        for (let i = 2; i < game.dungeon.rooms.length - 1; i++) {
            const room = game.dungeon.rooms[i];
            if (Math.random() < 0.3) {
                game.map[Math.floor(room.y + room.height / 2)][Math.floor(room.x + room.width / 2)] = TILE_TYPES.CHEST;
            }
        }
        
        spawnEnemies();
    }

    function spawnEnemies() {
        game.enemies = [];
        
        for (let i = 0; i < 5 + game.dungeon.currentFloor * 2; i++) {
            const room = game.dungeon.rooms[Math.floor(Math.random() * game.dungeon.rooms.length)];
            
            const enemyTypes = [
                { name: 'Rat', health: 20, attack: 5, exp: 10, gold: 5 },
                { name: 'Goblin', health: 30, attack: 8, exp: 20, gold: 10 },
                { name: 'Skeleton', health: 40, attack: 10, exp: 30, gold: 15 },
                { name: 'Orc', health: 50, attack: 15, exp: 50, gold: 25 },
                { name: 'Troll', health: 80, attack: 20, exp: 100, gold: 50 }
            ];
            
            const typeIndex = Math.min(enemyTypes.length - 1, Math.floor(Math.random() * (game.dungeon.currentFloor + 1)));
            const type = enemyTypes[typeIndex];
            
            game.enemies.push({
                x: Math.floor(room.x + Math.random() * room.width),
                y: Math.floor(room.y + Math.random() * room.height),
                name: type.name,
                health: type.health,
                maxHealth: type.health,
                attack: type.attack,
                exp: type.exp,
                gold: type.gold,
                ai: 'patrol',
                direction: Math.floor(Math.random() * 4)
            });
        }
    }

    function handleInput(data) {
        if (game.state !== 'exploring') return;
        
        let dx = 0, dy = 0;
        
        if (data.up) dy = -1;
        if (data.down) dy = 1;
        if (data.left) dx = -1;
        if (data.right) dx = 1;
        
        if (dx !== 0 || dy !== 0) {
            movePlayer(dx, dy);
        }
        
        if (data.action && game.player.potions > 0) {
            game.player.health = Math.min(game.player.maxHealth, game.player.health + 30);
            game.player.potions--;
        }
    }

    function movePlayer(dx, dy) {
        const newX = game.player.x + dx;
        const newY = game.player.y + dy;
        
        if (newX < 0 || newX >= game.mapWidth || newY < 0 || newY >= game.mapHeight) return;
        
        const tile = game.map[newY][newX];
        
        if (tile === TILE_TYPES.WALL) return;
        
        if (tile === TILE_TYPES.STAIRS) {
            nextFloor();
            return;
        }
        
        if (tile === TILE_TYPES.CHEST) {
            game.map[newY][newX] = TILE_TYPES.FLOOR;
            const gold = 10 + Math.floor(Math.random() * 40);
            game.player.gold += gold;
            game.score += gold;
        }
        
        for (let i = 0; i < game.enemies.length; i++) {
            if (game.enemies[i].x === newX && game.enemies[i].y === newY) {
                attackEnemy(i);
                return;
            }
        }
        
        game.player.x = newX;
        game.player.y = newY;
        
        game.turn++;
        
        if (game.turn % 2 === 0) {
            moveEnemies();
        }
    }

    function attackEnemy(index) {
        const enemy = game.enemies[index];
        
        const damage = game.player.attack + Math.floor(Math.random() * 5);
        enemy.health -= damage;
        
        if (enemy.health <= 0) {
            game.player.exp += enemy.exp;
            game.player.gold += enemy.gold;
            game.score += enemy.exp;
            game.enemies.splice(index, 1);
            
            if (game.player.exp >= game.player.expToLevel) {
                levelUp();
            }
        }
        
        const enemyDamage = Math.max(1, enemy.attack - game.player.defense + Math.floor(Math.random() * 3));
        game.player.health -= enemyDamage;
        
        if (game.player.health <= 0) {
            game.state = 'gameover';
        }
        
        game.turn++;
        
        if (game.turn % 2 === 0) {
            moveEnemies();
        }
    }

    function levelUp() {
        game.player.level++;
        game.player.exp -= game.player.expToLevel;
        game.player.expToLevel = Math.floor(game.player.expToLevel * 1.5);
        
        game.player.maxHealth += 20;
        game.player.health = game.player.maxHealth;
        game.player.attack += 3;
        game.player.defense += 2;
    }

    function moveEnemies() {
        game.enemies.forEach(enemy => {
            if (Math.random() < 0.5) return;
            
            const dx = game.player.x - enemy.x;
            const dy = game.player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            let moveX = 0, moveY = 0;
            
            if (dist < 8) {
                if (dist > 1) {
                    moveX = dx > 0 ? 1 : -1;
                    moveY = dy > 0 ? 1 : -1;
                } else {
                    const damage = Math.max(1, enemy.attack - game.player.defense + Math.floor(Math.random() * 3));
                    game.player.health -= damage;
                    if (game.player.health <= 0) game.state = 'gameover';
                    return;
                }
            } else {
                const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                const dir = directions[Math.floor(Math.random() * 4)];
                moveX = dir[0];
                moveY = dir[1];
            }
            
            const newX = enemy.x + moveX;
            const newY = enemy.y + moveY;
            
            if (newX >= 0 && newX < game.mapWidth && newY >= 0 && newY < game.mapHeight) {
                const tile = game.map[newY][newX];
                if (tile === TILE_TYPES.FLOOR || tile === TILE_TYPES.STAIRS) {
                    const occupied = game.enemies.some(e => e !== enemy && e.x === newX && e.y === newY) ||
                                     (game.player.x === newX && game.player.y === newY);
                    
                    if (!occupied) {
                        enemy.x = newX;
                        enemy.y = newY;
                    }
                }
            }
        });
    }

    function nextFloor() {
        game.dungeon.currentFloor++;
        
        if (game.dungeon.currentFloor > game.dungeon.maxFloors) {
            game.state = 'victory';
            return;
        }
        
        generateDungeon();
        game.turn = 0;
    }

    function update() {
        if (game.state !== 'exploring') return;
        
        game.time++;
        
        game.cameraX = game.player.x * 30 - canvas.width / 2;
        game.cameraY = game.player.y * 30 - canvas.height / 2;
        
        if (game.player.health <= 0) {
            game.state = 'gameover';
        }
    }

    function draw() {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const tileSize = 30;
        
        for (let y = 0; y < game.mapHeight; y++) {
            for (let x = 0; x < game.mapWidth; x++) {
                const screenX = x * tileSize - game.cameraX;
                const screenY = y * tileSize - game.cameraY;
                
                if (screenX < -tileSize || screenX > canvas.width) continue;
                
                const tile = game.map[y][x];
                
                if (tile === TILE_TYPES.WALL) {
                    ctx.fillStyle = '#333';
                    ctx.fillRect(screenX, screenY, tileSize, tileSize);
                } else if (tile === TILE_TYPES.FLOOR) {
                    ctx.fillStyle = '#1a1a1a';
                    ctx.fillRect(screenX, screenY, tileSize, tileSize);
                    ctx.strokeStyle = '#2a2a2a';
                    ctx.strokeRect(screenX, screenY, tileSize, tileSize);
                } else if (tile === TILE_TYPES.STAIRS) {
                    ctx.fillStyle = '#f1c40f';
                    ctx.fillRect(screenX, screenY, tileSize, tileSize);
                } else if (tile === TILE_TYPES.CHEST) {
                    ctx.fillStyle = '#8e44ad';
                    ctx.fillRect(screenX + 5, screenY + 5, 20, 20);
                }
            }
        }
        
        game.enemies.forEach(enemy => {
            const screenX = enemy.x * tileSize - game.cameraX;
            const screenY = enemy.y * tileSize - game.cameraY;
            
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(screenX + tileSize / 2, screenY + tileSize / 2, 12, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(enemy.name[0], screenX + tileSize / 2, screenY + tileSize / 2 + 4);
        });
        
        const playerScreenX = game.player.x * tileSize - game.cameraX + tileSize / 2;
        const playerScreenY = game.player.y * tileSize - game.cameraY + tileSize / 2;
        
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(playerScreenX, playerScreenY, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(playerScreenX - 3, playerScreenY - 3, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 150, 120);
        
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(`HP: ${game.player.health}/${game.player.maxHealth}`, 20, 35);
        
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`Gold: ${game.player.gold}`, 20, 60);
        
        ctx.fillStyle = '#3498db';
        ctx.fillText(`Level: ${game.player.level}`, 20, 85);
        
        ctx.fillStyle = '#95a5a6';
        ctx.fillText(`Floor: ${game.dungeon.currentFloor}/${game.dungeon.maxFloors}`, 20, 110);
        
        ctx.fillStyle = '#2ecc71';
        ctx.fillText(`Potions: ${game.player.potions}`, 100, 35);
        
        if (game.state === 'gameover') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = '#e74c3c';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 20);
            
            ctx.font = '30px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Final Score: ${game.score}`, canvas.width/2, canvas.height/2 + 30);
        }
        
        if (game.state === 'victory') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = '#ffd700';
            ctx.textAlign = 'center';
            ctx.fillText('VICTORY!', canvas.width/2, canvas.height/2 - 20);
            
            ctx.font = '30px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Final Score: ${game.score}`, canvas.width/2, canvas.height/2 + 30);
            ctx.fillText(`Level: ${game.player.level}`, canvas.width/2, canvas.height/2 + 65);
        }
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    generateDungeon();
    
    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    gameLoop();
})();