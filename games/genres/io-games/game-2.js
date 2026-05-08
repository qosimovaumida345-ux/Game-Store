// IO Game 2 - Agar Clone Pro
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        player: {
            x: canvas.width / 2,
            y: canvas.height / 2,
            radius: 20,
            speed: 5,
            color: '#3498db',
            name: 'Player'
        },
        bots: [],
        foods: [],
        viruses: [],
        mapSize: 3000,
        cameraX: 0,
        cameraY: 0,
        score: 0,
        leaderboard: [],
        particles: [],
        zoom: 1
    };

    function init() {
        for (let i = 0; i < 100; i++) {
            spawnFood();
        }
        
        for (let i = 0; i < 20; i++) {
            game.bots.push(createBot());
        }
        
        for (let i = 0; i < 10; i++) {
            game.viruses.push({
                x: Math.random() * game.mapSize,
                y: Math.random() * game.mapSize,
                radius: 25
            });
        }
    }

    function createBot() {
        return {
            x: Math.random() * game.mapSize,
            y: Math.random() * game.mapSize,
            radius: 15 + Math.random() * 25,
            speed: 4,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`,
            name: ['Bot', 'Player', 'Guest', 'Pro', 'Noob'][Math.floor(Math.random() * 5)] + Math.floor(Math.random() * 100),
            targetX: Math.random() * game.mapSize,
            targetY: Math.random() * game.mapSize
        };
    }

    function spawnFood() {
        game.foods.push({
            x: Math.random() * game.mapSize,
            y: Math.random() * game.mapSize,
            radius: 5 + Math.random() * 5,
            color: `hsl(${Math.random() * 360}, 80%, 60%)`
        });
    }

    function handleInput(data) {
        if (game.state !== 'playing') return;
        
        if (data.tilt !== undefined) {
            game.player.x += data.tilt * game.player.speed;
            game.player.y += data.tiltY * game.player.speed;
        }
        
        if (data.tap) {
            const worldX = (data.x - canvas.width / 2) / game.zoom + game.cameraX;
            const worldY = (data.y - canvas.height / 2) / game.zoom + game.cameraY;
            
            const dx = worldX - game.player.x;
            const dy = worldY - game.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                game.player.x += (dx / dist) * game.player.speed;
                game.player.y += (dy / dist) * game.player.speed;
            }
        }
        
        game.player.x = Math.max(game.player.radius, Math.min(game.mapSize - game.player.radius, game.player.x));
        game.player.y = Math.max(game.player.radius, Math.min(game.mapSize - game.player.radius, game.player.y));
    }

    function update() {
        if (game.state !== 'playing') return;
        
        game.player.radius = 20 + Math.sqrt(game.score / 10);
        game.player.speed = Math.max(2, 6 - game.player.radius / 20);
        
        game.cameraX = game.player.x - canvas.width / 2;
        game.cameraY = game.player.y - canvas.height / 2;
        
        game.zoom = Math.max(0.3, 1 - game.player.radius / 100);
        
        game.foods = game.foods.filter(f => {
            const dx = f.x - game.player.x;
            const dy = f.y - game.player.y;
            if (Math.sqrt(dx * dx + dy * dy) < game.player.radius) {
                game.score += Math.floor(f.radius);
                return false;
            }
            return true;
        });
        
        if (Math.random() < 0.1 && game.foods.length < 200) {
            spawnFood();
        }
        
        game.bots.forEach((bot, i) => {
            const dx = bot.targetX - bot.x;
            const dy = bot.targetY - bot.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 50) {
                bot.targetX = Math.random() * game.mapSize;
                bot.targetY = Math.random() * game.mapSize;
            }
            
            bot.x += (dx / dist) * bot.speed;
            bot.y += (dy / dist) * bot.speed;
            
            bot.x = Math.max(bot.radius, Math.min(game.mapSize - bot.radius, bot.x));
            bot.y = Math.max(bot.radius, Math.min(game.mapSize - bot.radius, bot.y));
            
            game.foods.forEach((f, fi) => {
                const fdx = f.x - bot.x;
                const fdy = f.y - bot.y;
                if (Math.sqrt(fdx * fdx + fdy * fdy) < bot.radius) {
                    game.foods.splice(fi, 1);
                    bot.radius += 1;
                }
            });
            
            game.bots.forEach((other, j) => {
                if (i === j) return;
                const odx = other.x - bot.x;
                const ody = other.y - bot.y;
                const odist = Math.sqrt(odx * odx + ody * ody);
                
                if (odist < bot.radius + other.radius) {
                    if (bot.radius > other.radius * 1.1) {
                        bot.radius += other.radius * 0.5;
                        game.bots.splice(j, 1);
                        game.bots.push(createBot());
                    }
                }
            });
            
            const pdx = game.player.x - bot.x;
            const pdy = game.player.y - bot.y;
            const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
            
            if (pdist < bot.radius + game.player.radius) {
                if (game.player.radius > bot.radius * 1.1) {
                    game.player.radius += bot.radius * 0.5;
                    game.score += Math.floor(bot.radius * 10);
                    game.bots.splice(i, 1);
                    game.bots.push(createBot());
                    
                    for (let k = 0; k < 15; k++) {
                        game.particles.push({
                            x: bot.x, y: bot.y,
                            vx: (Math.random() - 0.5) * 10,
                            vy: (Math.random() - 0.5) * 10,
                            color: bot.color,
                            life: 30
                        });
                    }
                } else if (bot.radius > game.player.radius * 1.1) {
                    game.state = 'gameover';
                }
            }
        });
        
        game.viruses.forEach(v => {
            const dx = game.player.x - v.x;
            const dy = game.player.y - v.y;
            if (Math.sqrt(dx * dx + dy * dy) < game.player.radius + v.radius) {
                game.player.radius = Math.max(20, game.player.radius - 10);
            }
        });
        
        game.particles = game.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.95;
            p.vy *= 0.95;
            p.life--;
            return p.life > 0;
        });
        
        game.leaderboard = [
            { name: game.player.name, score: Math.floor(game.score) },
            ...game.bots.map(b => ({ name: b.name, score: Math.floor(b.radius * 10) }))
        ].sort((a, b) => b.score - a.score).slice(0, 5);
    }

    function draw() {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const gridSize = 50;
        
        ctx.save();
        ctx.translate(-game.cameraX * game.zoom, -game.cameraY * game.zoom);
        ctx.scale(game.zoom, game.zoom);
        
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        
        const startX = Math.floor(game.cameraX / gridSize) * gridSize;
        const startY = Math.floor(game.cameraY / gridSize) * gridSize;
        
        for (let x = startX; x < startX + canvas.width / game.zoom + gridSize; x += gridSize) {
            for (let y = startY; y < startY + canvas.height / game.zoom + gridSize; y += gridSize) {
                ctx.strokeRect(x, y, gridSize, gridSize);
            }
        }
        
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 5;
        ctx.strokeRect(0, 0, game.mapSize, game.mapSize);
        
        game.foods.forEach(f => {
            ctx.fillStyle = f.color;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        
        game.viruses.forEach(v => {
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.arc(v.x, v.y, v.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#27ae60';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(v.x, v.y);
                ctx.lineTo(v.x + Math.cos(angle) * v.radius, v.y + Math.sin(angle) * v.radius);
                ctx.stroke();
            }
        });
        
        game.bots.forEach(b => {
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(b.name, b.x, b.y + b.radius + 15);
        });
        
        ctx.fillStyle = game.player.color;
        ctx.beginPath();
        ctx.arc(game.player.x, game.player.y, game.player.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(game.player.x - game.player.radius * 0.3, game.player.y - game.player.radius * 0.3, game.player.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(game.player.name, game.player.x, game.player.y + game.player.radius + 18);
        
        game.particles.forEach(p => {
            ctx.globalAlpha = p.life / 30;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        ctx.restore();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, 10, 120, 30);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${Math.floor(game.score)}`, 20, 32);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, 50, 150, 130);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Leaderboard', 20, 70);
        
        game.leaderboard.forEach((entry, i) => {
            ctx.fillStyle = i === 0 ? '#ffd700' : '#fff';
            ctx.font = '12px Arial';
            ctx.fillText(`${i + 1}. ${entry.name}: ${entry.score}`, 20, 95 + i * 22);
        });
        
        if (game.state === 'gameover') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = '#e74c3c';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 20);
            
            ctx.font = '30px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Final Score: ${Math.floor(game.score)}`, canvas.width/2, canvas.height/2 + 30);
            
            ctx.font = '20px Arial';
            ctx.fillText('Tap to restart', canvas.width/2, canvas.height/2 + 70);
        }
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    init();
    
    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    gameLoop();
})();