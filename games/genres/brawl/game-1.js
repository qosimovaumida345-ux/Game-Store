// Brawl Game 1 - Arena Combat
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing', score: 0, kills: 0, player: { x: 300, y: 400, health: 100, weapon: 'sword', combo: 0 },
        enemies: [], powerups: [], particles: [], arena: { width: 600, height: 500 }, time: 0
    };

    function init() {
        spawnEnemy();
    }

    function spawnEnemy() {
        game.enemies.push({
            x: Math.random() * 500 + 50, y: 100,
            health: 30 + Math.floor(game.kills / 5) * 10,
            maxHealth: 30 + Math.floor(game.kills / 5) * 10,
            type: ['orc', 'goblin', 'troll'][Math.floor(Math.random() * 3)]
        });
    }

    function handleInput(data) {
        const p = game.player;
        if (data.up) p.y -= 5;
        if (data.down) p.y += 5;
        if (data.left) p.x -= 5;
        if (data.right) p.x += 5;
        
        if (data.action && !data.holding) {
            game.player.combo = (game.player.combo + 1) % 4;
            data.holding = true;
            setTimeout(() => data.holding = false, 200);
            
            const damage = 10 + game.player.combo * 5;
            game.enemies.forEach(e => {
                const dx = e.x - p.x, dy = e.y - p.y;
                if (Math.sqrt(dx*dx+dy*dy) < 60) {
                    e.health -= damage;
                    for (let i = 0; i < 8; i++) game.particles.push({ x: e.x, y: e.y, vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6, color: '#e74c3c', life: 20 });
                }
            });
        }
        
        p.x = Math.max(20, Math.min(580, p.x));
        p.y = Math.max(20, Math.min(480, p.y));
    }

    function update() {
        game.time++;
        
        if (game.time % 180 === 0) spawnEnemy();
        
        game.enemies = game.enemies.filter(e => {
            if (e.health <= 0) {
                game.kills++;
                game.score += 100;
                game.player.health = Math.min(100, game.player.health + 10);
                return false;
            }
            
            const dx = game.player.x - e.x, dy = game.player.y - e.y;
            if (Math.sqrt(dx*dx+dy*dy) < 200) {
                e.x += (dx > 0 ? 1 : -1) * 1.5;
                e.y += (dy > 0 ? 1 : -1) * 1.5;
                if (Math.sqrt(dx*dx+dy*dy) < 30) game.player.health -= 5;
            }
            
            e.x = Math.max(20, Math.min(580, e.x));
            e.y = Math.max(20, Math.min(480, e.y));
            return true;
        });
        
        game.particles = game.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.life--; return p.life > 0; });
        
        if (game.player.health <= 0) game.state = 'gameover';
    }

    function draw() {
        ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 3;
        ctx.strokeRect(20, 20, 580, 480);
        
        game.enemies.forEach(e => {
            ctx.fillStyle = e.type === 'troll' ? '#8e44ad' : e.type === 'orc' ? '#27ae60' : '#f39c12';
            ctx.fillRect(e.x - 15, e.y - 20, 30, 40);
            ctx.fillStyle = '#fff'; ctx.fillRect(e.x - 8, e.y - 25, 4, 4); ctx.fillRect(e.x + 4, e.y - 25, 4, 4);
            ctx.fillStyle = '#333'; ctx.fillRect(e.x - 15, e.y - 30, 30, 5);
            ctx.fillStyle = '#e74c3c'; ctx.fillRect(-14, -29, 28 * (e.health/e.maxHealth), 3);
        });
        
        ctx.fillStyle = '#3498db'; ctx.fillRect(game.player.x - 15, game.player.y - 20, 30, 40);
        ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.arc(game.player.x, game.player.y - 25, 12, 0, Math.PI*2); ctx.fill();
        
        if (game.player.combo > 0) {
            ctx.fillStyle = '#ffd700'; ctx.font = 'bold 14px Arial';
            ctx.fillText(`${game.player.combo}x`, game.player.x - 10, game.player.y - 45);
        }
        
        ctx.fillStyle = '#fff'; game.particles.forEach(p => {
            ctx.globalAlpha = p.life/20;
            ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill();
        }); ctx.globalAlpha = 1;
        
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(10, 10, 130, 70);
        ctx.fillStyle = '#fff'; ctx.font = '20px Arial';
        ctx.fillText(`Kills: ${game.kills}`, 20, 35);
        ctx.fillText(`Score: ${game.score}`, 20, 60);
    }

    function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
    init();
    if (typeof window !== 'undefined') window.gameHandleInput = handleInput;
    gameLoop();
})();