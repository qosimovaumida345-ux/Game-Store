// Arcade Game 50 - Neon Racer
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        score: 0,
        speed: 0,
        distance: 0,
        player: {
            x: canvas.width / 2,
            y: canvas.height - 120,
            width: 40,
            height: 60,
            tilt: 0
        },
        obstacles: [],
        coins: [],
        powerups: [],
        laneWidth: 80,
        lanes: [canvas.width/2 - 120, canvas.width/2 - 40, canvas.width/2 + 40, canvas.width/2 + 120],
        currentLane: 1,
        boost: 0,
        combo: 0,
        particles: []
    };

    function handleInput(data) {
        if (game.state !== 'playing') return;
        
        if (data.left && game.currentLane > 0) {
            game.currentLane--;
            game.player.x = game.lanes[game.currentLane];
        }
        
        if (data.right && game.currentLane < 3) {
            game.currentLane++;
            game.player.x = game.lanes[game.currentLane];
        }
        
        if (data.action) {
            game.speed = 15;
            game.boost = 60;
        }
    }

    function update() {
        if (game.state !== 'playing') return;
        
        game.speed = Math.min(12, game.speed + 0.1);
        game.distance += game.speed;
        
        if (game.boost > 0) {
            game.boost--;
            game.speed = 18;
        }
        
        if (Math.random() < 0.03) {
            const lane = Math.floor(Math.random() * 4);
            game.obstacles.push({
                x: game.lanes[lane],
                y: -50,
                type: Math.random() < 0.5 ? 'car' : 'barrier',
                width: 40,
                height: 40
            });
        }
        
        if (Math.random() < 0.02) {
            game.coins.push({
                x: game.lanes[Math.floor(Math.random() * 4)],
                y: -30,
                angle: 0
            });
        }
        
        game.obstacles.forEach(o => {
            o.y += game.speed;
            
            const dx = Math.abs(o.x - game.player.x);
            const dy = Math.abs(o.y - game.player.y);
            
            if (dx < 35 && dy < 50) {
                game.state = 'gameover';
            }
        });
        
        game.coins = game.coins.filter(c => {
            c.y += game.speed;
            c.angle += 0.1;
            
            const dx = Math.abs(c.x - game.player.x);
            const dy = Math.abs(c.y - game.player.y);
            
            if (dx < 30 && dy < 40) {
                game.score += 10;
                game.combo++;
                return false;
            }
            
            return c.y < canvas.height + 50;
        });
        
        game.obstacles = game.obstacles.filter(o => o.y < canvas.height + 50);
    }

    function draw() {
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 3;
        game.lanes.forEach(lane => {
            ctx.setLineDash([20, 30]);
            ctx.beginPath();
            ctx.moveTo(lane, 0);
            ctx.lineTo(lane, canvas.height);
            ctx.stroke();
        });
        ctx.setLineDash([]);
        
        for (let i = 0; i < 10; i++) {
            const offset = (game.distance * 0.5 + i * 100) % canvas.height;
            ctx.fillStyle = `rgba(0, 255, 255, ${0.1 + Math.random() * 0.1})`;
            ctx.fillRect(50, canvas.height - offset, canvas.width - 100, 2);
        }
        
        game.coins.forEach(c => {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(c.x, c.y, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffaa00';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('$', c.x, c.y + 4);
        });
        
        game.obstacles.forEach(o => {
            if (o.type === 'car') {
                ctx.fillStyle = '#e74c3c';
                ctx.fillRect(o.x - 15, o.y - 15, 30, 40);
                ctx.fillStyle = '#333';
                ctx.fillRect(o.x - 12, o.y + 20, 10, 10);
                ctx.fillRect(o.x + 2, o.y + 20, 10, 10);
            } else {
                ctx.fillStyle = '#f39c12';
                ctx.fillRect(o.x - 18, o.y - 10, 36, 20);
            }
        });
        
        ctx.save();
        ctx.translate(game.player.x, game.player.y);
        
        if (game.boost > 0) {
            ctx.fillStyle = '#ff00ff';
            ctx.beginPath();
            ctx.moveTo(-25, 15);
            ctx.lineTo(-40, 0);
            ctx.lineTo(-40, 30);
            ctx.fill();
        }
        
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(-18, -25, 36, 50);
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, -35, 14, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.fillRect(-8, -38, 6, 6);
        ctx.fillRect(2, -38, 6, 6);
        
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(-18, -20, 36, 8);
        
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-12, 28, 8, 0, Math.PI * 2);
        ctx.arc(12, 28, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 150, 80);
        
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${game.score}`, 20, 35);
        ctx.fillText(`Distance: ${Math.floor(game.distance / 10)}m`, 20, 58);
        
        if (game.boost > 0) {
            ctx.fillStyle = '#ff00ff';
            ctx.fillText('BOOST!', 20, 81);
        }
        
        if (game.state === 'gameover') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = '#e74c3c';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
        }
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    gameLoop();
})();