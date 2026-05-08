// Simulation Game 6 - Theme Park Tycoon
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        money: 5000,
        day: 1,
        visitors: 0,
        reputation: 50,
        buildings: [],
        employees: [],
        attractions: [],
        path: [],
        grid: [],
        gridSize: 15,
        cellSize: 40,
        cameraX: 0,
        cameraY: 0,
        selectedBuild: null,
        time: 0,
        totalEarnings: 0,
        maintenance: 0
    };

    const BUILDING_TYPES = {
        entrance: { cost: 500, width: 2, height: 1, name: 'Entrance', income: 0, visitors: 10 },
        coaster: { cost: 2000, width: 3, height: 2, name: 'Roller Coaster', income: 200, visitors: 50 },
        ferris: { cost: 1000, width: 2, height: 2, name: 'Ferris Wheel', income: 80, visitors: 30 },
        carousel: { cost: 600, width: 2, height: 1, name: 'Carousel', income: 50, visitors: 20 },
        food: { cost: 400, width: 1, height: 1, name: 'Food Court', income: 100, visitors: 0 },
        shop: { cost: 300, width: 1, height: 1, name: 'Gift Shop', income: 60, visitors: 0 },
        restroom: { cost: 200, width: 1, height: 1, name: 'Restroom', income: 0, visitors: 0 },
        lawn: { cost: 50, width: 1, height: 1, name: 'Grass', income: 0, visitors: 0 },
        path: { cost: 20, width: 1, height: 1, name: 'Path', income: 0, visitors: 0 }
    };

    function initGrid() {
        game.grid = [];
        for (let y = 0; y < game.gridSize; y++) {
            game.grid[y] = [];
            for (let x = 0; x < game.gridSize; x++) {
                game.grid[y][x] = { type: 'empty', building: null };
            }
        }
        
        game.grid[7][1] = { type: 'entrance', building: { type: 'entrance' } };
        game.grid[7][2] = { type: 'path', building: { type: 'path' } };
    }

    function handleInput(data) {
        if (game.state !== 'playing') return;
        
        if (data.tap && game.selectedBuild) {
            const gridX = Math.floor((data.x + game.cameraX) / game.cellSize);
            const gridY = Math.floor((data.y + game.cameraY) / game.cellSize);
            
            if (gridX >= 0 && gridX < game.gridSize && gridY >= 0 && gridY < game.gridSize) {
                const building = BUILDING_TYPES[game.selectedBuild];
                
                if (game.money >= building.cost) {
                    let canPlace = true;
                    
                    for (let dy = 0; dy < building.height && canPlace; dy++) {
                        for (let dx = 0; dx < building.width && canPlace; dx++) {
                            if (gridY + dy >= game.gridSize || gridX + dx >= game.gridSize) {
                                canPlace = false;
                            } else if (game.grid[gridY + dy][gridX + dx].type !== 'empty') {
                                canPlace = false;
                            }
                        }
                    }
                    
                    if (canPlace) {
                        for (let dy = 0; dy < building.height; dy++) {
                            for (let dx = 0; dx < building.width; dx++) {
                                game.grid[gridY + dy][gridX + dx] = {
                                    type: game.selectedBuild,
                                    building: { type: game.selectedBuild, x: gridX + dx, y: gridY + dy }
                                };
                            }
                        }
                        
                        game.buildings.push({
                            type: game.selectedBuild,
                            x: gridX,
                            y: gridY,
                            health: 100,
                            visitors: building.visitors,
                            income: building.income
                        });
                        
                        game.money -= building.cost;
                    }
                }
            }
        }
        
        if (data.left) game.cameraX = Math.max(0, game.cameraX - 30);
        if (data.right) game.cameraX = Math.min(game.gridSize * game.cellSize - canvas.width, game.cameraX + 30);
        if (data.up) game.cameraY = Math.max(0, game.cameraY - 30);
        if (data.down) game.cameraY = Math.min(game.gridSize * game.cellSize - canvas.height, game.cameraY + 30);
        
        const keys = ['entrance', 'coaster', 'ferris', 'carousel', 'food', 'shop', 'restroom', 'lawn', 'path'];
        if (data.buttons) {
            keys.forEach((key, i) => {
                if (data.buttons[i]) game.selectedBuild = key;
            });
        }
    }

    function update() {
        if (game.state !== 'playing') return;
        
        game.time += 1/60;
        
        if (game.time > 60) {
            game.day++;
            game.time = 0;
            
            game.buildings.forEach(b => {
                const type = BUILDING_TYPES[b.type];
                const earnings = type.income * (1 + game.reputation / 200);
                game.money += earnings;
                game.totalEarnings += earnings;
            });
            
            game.maintenance = game.buildings.length * 10;
            game.money -= game.maintenance;
            
            const totalVisitors = game.buildings.reduce((sum, b) => sum + (b.visitors || 0), 0);
            game.visitors = Math.floor(totalVisitors * (game.reputation / 100));
            
            game.reputation = Math.min(100, Math.max(0, game.reputation + (Math.random() - 0.4) * 5));
            
            if (game.money < 0) {
                game.reputation -= 10;
            }
        }
    }

    function draw() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#a8e6cf');
        gradient.addColorStop(1, '#dcedc1');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        for (let y = 0; y < game.gridSize; y++) {
            for (let x = 0; x < game.gridSize; x++) {
                const screenX = x * game.cellSize - game.cameraX;
                const screenY = y * game.cellSize - game.cameraY;
                
                if (screenX < -game.cellSize || screenX > canvas.width) continue;
                
                const cell = game.grid[y][x];
                
                if (cell.type === 'empty' || cell.type === 'lawn') {
                    ctx.fillStyle = cell.type === 'lawn' ? '#7cb342' : '#81c784';
                    ctx.fillRect(screenX, screenY, game.cellSize, game.cellSize);
                    
                    ctx.fillStyle = '#66bb6a';
                    ctx.beginPath();
                    ctx.arc(screenX + 10, screenY + 10, 5, 0, Math.PI * 2);
                    ctx.arc(screenX + 30, screenY + 25, 4, 0, Math.PI * 2);
                    ctx.fill();
                } else if (cell.type === 'path') {
                    ctx.fillStyle = '#bdbdbd';
                    ctx.fillRect(screenX, screenY, game.cellSize, game.cellSize);
                } else {
                    const colors = {
                        entrance: '#ff9800',
                        coaster: '#e91e63',
                        ferris: '#00bcd4',
                        carousel: '#9c27b0',
                        food: '#ff5722',
                        shop: '#795548',
                        restroom: '#607d8b'
                    };
                    
                    ctx.fillStyle = colors[cell.type] || '#9e9e9e';
                    ctx.fillRect(screenX + 2, screenY + 2, game.cellSize - 4, game.cellSize - 4);
                    
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.fillRect(screenX + 5, screenY + 5, game.cellSize - 10, 10);
                }
                
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.lineWidth = 1;
                ctx.strokeRect(screenX, screenY, game.cellSize, game.cellSize);
            }
        }
        
        if (game.selectedBuild) {
            ctx.fillStyle = 'rgba(255, 235, 59, 0.3)';
            ctx.fillRect(10, canvas.height - 60, 200, 50);
            
            ctx.font = '16px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'left';
            const type = BUILDING_TYPES[game.selectedBuild];
            ctx.fillText(`${type.name}: $${type.cost}`, 20, canvas.height - 35);
        }
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(10, 10, 180, 140);
        
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(`Day ${game.day}`, 20, 35);
        
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`$${Math.floor(game.money)}`, 20, 60);
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(`Visitors: ${game.visitors}`, 20, 85);
        
        ctx.fillStyle = '#3498db';
        ctx.fillText(`Reputation: ${Math.floor(game.reputation)}%`, 20, 110);
        
        ctx.fillStyle = '#95a5a6';
        ctx.font = '14px Arial';
        ctx.fillText(`Income: $${Math.floor(game.totalEarnings / game.day || 0)}/day`, 20, 135);
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    initGrid();
    
    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    gameLoop();
})();