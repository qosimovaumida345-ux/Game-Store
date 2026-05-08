// Zombie Game 4 - Dead Zone Survival
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        player: {
            x: 100,
            y: 300,
            health: 100,
            maxHealth: 100,
            stamina: 100,
            maxStamina: 100,
            speed: 4,
            attack: 15,
            defense: 5,
            weapon: 'bat',
            ammo: 30,
            supplies: 5,
            survivors: 0
        },
        zombies: [],
        items: [],
        map: {
            width: 50,
            height: 30,
            tiles: []
        },
        camera: { x: 0, y: 0 },
        day: 1,
        time: 0,
        darkness: false,
        score: 0,
        wave: 1,
        zombiesKilled: 0,
        safeZone: { x: 50, y: 250, radius: 80 },
        barricades: []
    };

    function initMap() {
        game.map.tiles = [];
        for (let y = 0; y < game.map.height; y++) {
            game.map.tiles[y] = [];
            for (let x = 0; x < game.map.width; x++) {
                if (x === 0 || x === game.map.width - 1 || y === 0 || y === game.map.height - 1) {
                    game.map.tiles[y][x] = 'building';
                } else if (Math.random() < 0.2) {
                    game.map.tiles[y][x] = 'building';
                } else if (Math.random() < 0.1) {
                    game.map.tiles[y][x] = 'car';
                } else {
                    game.map.tiles[y][x] = 'ground';
                }
            }
        }
        
        game.map.tiles[5][5] = 'safe';
        game.map.tiles[5][6] = 'safe';
        game.map.tiles[6][5] = 'safe';
        game.map.tiles[6][6] = 'safe';
    }

    function handleInput(data) {
        if (game.state !== 'playing') return;
        
        const p = game.player;
        
        if (data.up) p.y -= p.speed;
        if (data.down) p.y += p.speed;
        if (data.left) p.x -= p.speed;
        if (data.right) p.x += p.speed;
        
        p.x = Math.max(20, Math.min(game.map.width * 20 - 20, p.x));
        p.y = Math.max(20, Math.min(game.map.height * 20 - 20, p.y));
        
        if (data.action && p.stamina > 10) {
            attackZombie();
            p.stamina -= 10;
        }
        
        if (data.special && p.ammo > 0) {
            shoot();
            p.ammo--;
        }
        
        if (data.block) {
            p.stamina -= 0.5;
        } else {
            p.stamina = Math.min(p.maxStamina, p.stamina + 0.2);
        }
    }

    function spawnZombie() {
        const types = [
            { name: 'Walker', hp: 30, atk: 8, speed: 1.5, exp: 10 },
            { name: 'Runner', hp: 20, atk: 12, speed: 3, exp: 20 },
            { name: 'Tank', hp: 80, atk: 20, speed: 0.8, exp: 50 },
            { name: 'Fetcher', hp: 15, atk: 5, speed: 2, exp: 5 }
        ];
        
        const typeIndex = Math.min(types.length - 1, Math.floor(game.wave / 2) + Math.floor(Math.random() * 2));
        const type = types[typeIndex];
        
        let x, y;
        
        do {
            x = Math.random() * game.map.width;
            y = Math.random() * game.map.height;
            
            const dx = x - game.player.x;
            const dy = y - game.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 300 && game.map.tiles[Math.floor(y/20)][Math.floor(x/20)] !== 'building') {
                break;
            }
        } while (true);
        
        game.zombies.push({
            x: x,
            y: y,
            hp: type.hp + game.wave * 5,
            maxHp: type.hp + game.wave * 5,
            atk: type.atk + Math.floor(game.wave / 2),
            speed: type.speed,
            exp: type.exp,
            name: type.name,
            state: 'chase'
        });
    }

    function attackZombie() {
        const p = game.player;
        
        for (let i = 0; i < game.zombies.length; i++) {
            const z = game.zombies[i];
            const dx = z.x - p.x;
            const dy = z.y - p.y;
            
            if (Math.sqrt(dx * dx + dy * dy) < 40) {
                const damage = p.attack + Math.floor(Math.random() * 8);
                z.hp -= damage;
                
                const angle = Math.atan2(dy, dx);
                z.x += Math.cos(angle) * 30;
                z.y += Math.sin(angle) * 30;
                
                if (z.hp <= 0) {
                    game.zombies.splice(i, 1);
                    p.exp += z.exp;
                    game.score += z.exp;
                    game.zombiesKilled++;
                    p.supplies += Math.floor(Math.random() * 2);
                    
                    if (p.exp >= p.expToLevel) {
                        levelUp();
                    }
                }
                
                return;
            }
        }
    }

    function shoot() {
        const p = game.player;
        
        for (let i = 0; i < game.zombies.length; i++) {
            const z = game.zombies[i];
            const dx = z.x - p.x;
            const dy = z.y - p.y;
            
            if (Math.sqrt(dx * dx + dy * dy) < 200) {
                const damage = 25 + Math.floor(Math.random() * 15);
                z.hp -= damage;
                
                if (z.hp <= 0) {
                    game.zombies.splice(i, 1);
                    p.exp += z.exp;
                    game.score += z.exp;
                    game.zombiesKilled++;
                }
                
                return;
            }
        }
    }

    function levelUp() {
        game.player.level++;
        game.player.exp = 0;
        game.player.expToLevel = Math.floor(game.player.expToLevel * 1.5);
        
        game.player.maxHealth += 15;
        game.player.health = game.player.maxHealth;
        game.player.attack += 5;
        game.player.defense += 2;
    }

    function update() {
        if (game.state !== 'playing') return;
        
        game.time++;
        
        if (game.time > 600) {
            game.day++;
            game.time = 0;
            game.wave++;
            
            for (let i = 0; i < 3 + game.wave; i++) {
                spawnZombie();
            }
        }
        
        game.zombies.forEach(z => {
            const dx = game.player.x - z.x;
            const dy = game.player.y - z.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 300) {
                z.x += (dx / dist) * z.speed;
                z.y += (dy / dist) * z.speed;
                
                if (dist < 30) {
                    const damage = Math.max(1, z.atk - game.player.defense + Math.floor(Math.random() * 3));
                    game.player.health -= damage;
                    
                    game.player.stamina -= 5;
                }
            }
            
            z.x = Math.max(10, Math.min(game.map.width * 20 - 10, z.x));
            z.y = Math.max(10, Math.min(game.map.height * 20 - 10, z.y));
        });
        
        if (Math.random() < 0.005 * game.wave && game.zombies.length < 30 + game.wave * 5) {
            spawnZombie();
        }
        
        const inSafeZone = Math.sqrt(
            Math.pow(game.player.x - game.safeZone.x, 2) + 
            Math.pow(game.player.y - game.safeZone.y, 2)
        ) < game.safeZone.radius;
        
        if (inSafeZone) {
            game.player.health = Math.min(game.player.maxHealth, game.player.health + 0.3);
        }
        
        game.player.health = Math.min(game.player.maxHealth, game.player.health);
        
        if (game.player.health <= 0 || game.player.stamina <= 0) {
            game.state = 'gameover';
        }
        
        game.camera.x = game.player.x - canvas.width / 2;
        game.camera.y = game.player.y - canvas.height / 2;
    }

    function draw() {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const tileSize = 20;
        
        for (let y = 0; y < game.map.height; y++) {
            for (let x = 0; x < game.map.width; x++) {
                const screenX = x * tileSize - game.camera.x;
                const screenY = y * tileSize - game.camera.y;
                
                if (screenX < -tileSize || screenX > canvas.width) continue;
                
                const tile = game.map.tiles[y][x];
                
                if (tile === 'ground') {
                    ctx.fillStyle = '#2c2c2c';
                    ctx.fillRect(screenX, screenY, tileSize, tileSize);
                } else if (tile === 'building') {
                    ctx.fillStyle = '#3d3d3d';
                    ctx.fillRect(screenX, screenY, tileSize, tileSize);
                } else if (tile === 'car') {
                    ctx.fillStyle = '#4a4a4a';
                    ctx.fillRect(screenX, screenY, tileSize, tileSize);
                } else if (tile === 'safe') {
                    ctx.fillStyle = '#27ae60';
                    ctx.fillRect(screenX, screenY, tileSize, tileSize);
                }
            }
        }
        
        ctx.strokeStyle = 'rgba(46, 204, 113, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(game.safeZone.x - game.camera.x, game.safeZone.y - game.camera.y, game.safeZone.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        game.zombies.forEach(z => {
            const screenX = z.x - game.camera.x;
            const screenY = z.y - game.camera.y;
            
            if (screenX < -20 || screenX > canvas.width + 20) return;
            
            ctx.fillStyle = z.name === 'Tank' ? '#8e44ad' : z.name === 'Runner' ? '#e67e22' : '#27ae60';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 12, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(screenX - 3, screenY - 2, 2, 0, Math.PI * 2);
            ctx.arc(screenX + 3, screenY - 2, 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#333';
            ctx.fillRect(screenX - 10, screenY - 18, 20, 4);
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(-9, -17, 18 * (z.hp / z.maxHp), 2);
        });
        
        const playerScreenX = game.player.x - game.camera.x;
        const playerScreenY = game.player.y - game.camera.y;
        
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(playerScreenX, playerScreenY, 14, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(playerScreenX - 4, playerScreenY - 4, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 160, 120);
        
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(`Day ${game.day}`, 20, 32);
        
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`Score: ${game.score}`, 20, 55);
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(20, 70, 130, 12);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(20, 70, 130 * (game.player.health / game.player.maxHealth), 12);
        
        ctx.fillStyle = '#3498db';
        ctx.fillRect(20, 90, 130, 12);
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(20, 90, 130 * (game.player.stamina / game.player.maxStamina), 12);
        
        ctx.fillStyle = '#95a5a6';
        ctx.fillText(`Wave: ${game.wave}`, 20, 118);
        
        ctx.fillStyle = '#e67e22';
        ctx.fillText(`Ammo: ${game.player.ammo}`, 90, 32);
        
        ctx.fillStyle = '#2ecc71';
        ctx.fillText(`Supplies: ${game.player.supplies}`, 90, 55);
        
        if (game.state === 'gameover') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = '#e74c3c';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 20);
            
            ctx.font = '30px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Day: ${game.day}`, canvas.width/2, canvas.height/2 + 30);
            ctx.fillText(`Kills: ${game.zombiesKilled}`, canvas.width/2, canvas.height/2 + 65);
            ctx.fillText(`Score: ${game.score}`, canvas.width/2, canvas.height/2 + 100);
        }
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    game.player.expToLevel = 50;
    
    initMap();
    
    for (let i = 0; i < 10; i++) {
        spawnZombie();
    }
    
    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    gameLoop();
})();