// Adventure Game 10 - Island Explorer
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        player: {
            x: canvas.width / 2,
            y: canvas.height / 2,
            width: 40,
            height: 50,
            health: 100,
            maxHealth: 100,
            energy: 100,
            maxEnergy: 100,
            inventory: { food: 3, wood: 0, stone: 0, gold: 0, key: false },
            hunger: 100,
            direction: 1,
            swimming: false
        },
        map: [],
        mapWidth: 20,
        mapHeight: 15,
        tileSize: 50,
        cameraX: 0,
        cameraY: 0,
        time: 0,
        day: 1,
        weather: 'sunny',
        structures: [],
        NPCs: [],
        enemies: [],
        particles: [],
        fogOfWar: [],
        objectives: [],
        craftingOpen: false,
        questLog: []
    };

    const TILE_TYPES = {
        grass: { color: '#2ecc71', walkable: true },
        water: { color: '#3498db', walkable: false, swim: true },
        forest: { color: '#27ae60', walkable: true, resource: 'wood' },
        mountain: { color: '#7f8c8d', walkable: false },
        sand: { color: '#f1c40f', walkable: true },
        rock: { color: '#95a5a6', walkable: true, resource: 'stone' },
        cave: { color: '#2c3e50', walkable: false, enter: true },
        village: { color: '#e67e22', walkable: true, npc: true }
    };

    function initMap() {
        game.map = [];
        for (let y = 0; y < game.mapHeight; y++) {
            game.map[y] = [];
            for (let x = 0; x < game.mapWidth; x++) {
                if (x === 0 || x === game.mapWidth - 1 || y === 0 || y === game.mapHeight - 1) {
                    game.map[y][x] = 'water';
                } else if (Math.random() < 0.1) {
                    game.map[y][x] = 'water';
                } else if (Math.random() < 0.2) {
                    game.map[y][x] = 'forest';
                } else if (Math.random() < 0.1) {
                    game.map[y][x] = 'mountain';
                } else if (Math.random() < 0.05) {
                    game.map[y][x] = 'cave';
                } else if (Math.random() < 0.05) {
                    game.map[y][x] = 'rock';
                } else {
                    game.map[y][x] = 'grass';
                }
            }
        }
        
        game.map[7][10] = 'village';
        
        for (let i = 0; i < 3; i++) {
            game.structures.push({
                type: 'house',
                x: 8 + Math.floor(Math.random() * 4),
                y: 8 + Math.floor(Math.random() * 3)
            });
        }
        
        game.NPCs.push({ x: 10, y: 7, type: 'elder', dialogue: 'Welcome, adventurer!' });
        game.NPCs.push({ x: 12, y: 8, type: 'merchant', dialogue: 'Buy supplies here!' });
        
        game.enemies.push({ x: 5, y: 5, type: 'wolf', health: 30 });
        game.enemies.push({ x: 15, y: 10, type: 'goblin', health: 40 });
        
        game.objectives.push({ text: 'Explore the island', completed: false });
        game.objectives.push({ text: 'Find the village', completed: false });
    }

    function handleInput(data) {
        if (game.state !== 'playing') return;
        
        const speed = 4;
        let newX = game.player.x;
        let newY = game.player.y;
        
        if (data.left) newX -= speed;
        if (data.right) newX += speed;
        if (data.up) newY -= speed;
        if (data.down) newY += speed;
        
        const mapX = Math.floor(newX / game.tileSize);
        const mapY = Math.floor(newY / game.tileSize);
        
        if (mapX >= 0 && mapX < game.mapWidth && mapY >= 0 && mapY < game.mapHeight) {
            const tile = game.map[mapY][mapX];
            const tileData = TILE_TYPES[tile];
            
            if (tileData.walkable || (tileData.swim && game.player.swimming)) {
                game.player.x = newX;
                game.player.y = newY;
                
                if (tile === 'water') {
                    game.player.energy -= 0.1;
                }
                
                if (tile === 'forest' && data.action) {
                    game.player.inventory.wood += 2;
                    game.createParticles(game.player.x, game.player.y, '#27ae60', 5);
                }
                
                if (tile === 'rock' && data.action) {
                    game.player.inventory.stone += 1;
                    game.createParticles(game.player.x, game.player.y, '#95a5a6', 5);
                }
                
                if (tile === 'cave' && data.action) {
                    game.state = 'dungeon';
                }
                
                if (tile === 'village') {
                    game.objectives[1].completed = true;
                }
            }
        }
        
        game.player.direction = data.left ? -1 : 1;
        
        if (data.special && game.player.inventory.food > 0) {
            game.player.hunger = Math.min(100, game.player.hunger + 30);
            game.player.inventory.food--;
            game.player.health = Math.min(game.player.maxHealth, game.player.health + 20);
        }
    }

    game.createParticles = function(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4 - 2,
                color: color,
                life: 20
            });
        }
    };

    function update() {
        if (game.state !== 'playing') return;
        
        game.time += 1/60;
        
        if (game.time > 600) {
            game.day++;
            game.time = 0;
            if (Math.random() < 0.3) {
                game.weather = Math.random() < 0.5 ? 'rainy' : 'stormy';
            } else {
                game.weather = 'sunny';
            }
        }
        
        game.player.hunger -= 0.01;
        
        if (game.player.hunger <= 0) {
            game.player.health -= 0.1;
        }
        
        if (game.player.health <= 0) {
            game.state = 'gameover';
        }
        
        game.cameraX = game.player.x - canvas.width / 2;
        game.cameraY = game.player.y - canvas.height / 2;
        
        game.particles = game.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life--;
            return p.life > 0;
        });
        
        game.enemies.forEach(e => {
            const dx = game.player.x - e.x * game.tileSize;
            const dy = game.player.y - e.y * game.tileSize;
            if (Math.sqrt(dx*dx + dy*dy) < 80) {
                if (Math.random() < 0.02) {
                    game.player.health -= 10;
                    game.createParticles(game.player.x, game.player.y, '#e74c3c', 5);
                }
            }
        });
    }

    function draw() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        if (game.weather === 'sunny') {
            gradient.addColorStop(0, '#87ceeb');
            gradient.addColorStop(1, '#e0f7fa');
        } else if (game.weather === 'rainy') {
            gradient.addColorStop(0, '#5d6d7e');
            gradient.addColorStop(1, '#85929e');
        } else {
            gradient.addColorStop(0, '#2c3e50');
            gradient.addColorStop(1, '#4a235a');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        for (let y = 0; y < game.mapHeight; y++) {
            for (let x = 0; x < game.mapWidth; x++) {
                const screenX = x * game.tileSize - game.cameraX;
                const screenY = y * game.tileSize - game.cameraY;
                
                if (screenX < -game.tileSize || screenX > canvas.width) continue;
                
                const tile = game.map[y][x];
                const tileData = TILE_TYPES[tile];
                
                ctx.fillStyle = tileData.color;
                ctx.fillRect(screenX, screenY, game.tileSize, game.tileSize);
                
                if (tile === 'forest') {
                    ctx.fillStyle = '#1e8449';
                    ctx.beginPath();
                    ctx.moveTo(screenX + 25, screenY + 10);
                    ctx.lineTo(screenX + 10, screenY + 40);
                    ctx.lineTo(screenX + 40, screenY + 40);
                    ctx.fill();
                }
                
                if (tile === 'mountain') {
                    ctx.fillStyle = '#5d6d7e';
                    ctx.beginPath();
                    ctx.moveTo(screenX + 25, screenY + 5);
                    ctx.lineTo(screenX + 5, screenY + 45);
                    ctx.lineTo(screenX + 45, screenY + 45);
                    ctx.fill();
                }
            }
        }
        
        game.structures.forEach(s => {
            const screenX = s.x * game.tileSize - game.cameraX;
            const screenY = s.y * game.tileSize - game.cameraY;
            
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(screenX + 10, screenY + 20, 30, 25);
            ctx.fillStyle = '#a0522d';
            ctx.beginPath();
            ctx.moveTo(screenX + 5, screenY + 20);
            ctx.lineTo(screenX + 25, screenY + 5);
            ctx.lineTo(screenX + 45, screenY + 20);
            ctx.fill();
        });
        
        game.NPCs.forEach(npc => {
            const screenX = npc.x * game.tileSize - game.cameraX + 25;
            const screenY = npc.y * game.tileSize - game.cameraY + 25;
            
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(screenX, screenY - 10, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#3498db';
            ctx.fillRect(screenX - 12, screenY, 24, 25);
        });
        
        game.enemies.forEach(e => {
            const screenX = e.x * game.tileSize - game.cameraX + 25;
            const screenY = e.y * game.tileSize - game.cameraY + 25;
            
            ctx.fillStyle = e.type === 'wolf' ? '#7f8c8d' : '#27ae60';
            ctx.fillRect(screenX - 12, screenY - 15, 24, 30);
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(screenX - 8, screenY - 20, 6, 6);
            ctx.fillRect(screenX + 2, screenY - 20, 6, 6);
        });
        
        const playerScreenX = game.player.x - game.cameraX;
        const playerScreenY = game.player.y - game.cameraY;
        
        ctx.save();
        ctx.translate(playerScreenX, playerScreenY);
        
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(0, -25, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#3498db';
        ctx.fillRect(-15, -13, 30, 35);
        
        if (game.player.direction === -1) {
            ctx.scale(-1, 1);
        }
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(10, -8, 15, 6);
        
        ctx.restore();
        
        game.particles.forEach(p => {
            ctx.globalAlpha = p.life / 20;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x - game.cameraX, p.y - game.cameraY, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 180, 140);
        
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(`Day ${game.day}`, 20, 32);
        ctx.fillText(`Time: ${Math.floor(game.time / 60)}:${Math.floor(game.time % 60).toString().padStart(2, '0')}`, 20, 55);
        
        ctx.font = '14px Arial';
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(`Health: ${Math.ceil(game.player.health)}`, 20, 80);
        ctx.fillStyle = '#f39c12';
        ctx.fillText(`Hunger: ${Math.ceil(game.player.hunger)}`, 20, 100);
        
        ctx.fillStyle = '#3498db';
        ctx.fillText(`Wood: ${game.player.inventory.wood}`, 100, 80);
        ctx.fillText(`Stone: ${game.player.inventory.stone}`, 100, 100);
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`Gold: ${game.player.inventory.gold}`, 100, 120);
        
        ctx.fillStyle = game.weather === 'sunny' ? '#f1c40f' : '#95a5a6';
        ctx.fillText(`Weather: ${game.weather}`, 20, 122);
        
        if (game.state === 'gameover') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = '#e74c3c';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 20);
            
            ctx.font = '25px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`You survived ${game.day} days`, canvas.width/2, canvas.height/2 + 30);
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