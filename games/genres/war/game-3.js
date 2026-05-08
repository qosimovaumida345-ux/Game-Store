// War Game 3 - Naval Battles
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing', player: { x: 100, y: 300, health: 100, angle: 0 },
        enemy: { x: 500, y: 300, health: 100, angle: Math.PI },
        bullets: [], explosions: [], turn: 1, score: 0
    };

    function handleInput(data) {
        if (data.left) game.player.angle -= 0.05;
        if (data.right) game.player.angle += 0.05;
        if (data.up) { game.player.x += Math.cos(game.player.angle) * 3; game.player.y += Math.sin(game.player.angle) * 3; }
        if (data.action) {
            game.bullets.push({ x: game.player.x, y: game.player.y, vx: Math.cos(game.player.angle) * 10, vy: Math.sin(game.player.angle) * 10 });
        }
        game.player.x = Math.max(50, Math.min(canvas.width - 50, game.player.x));
    }

    function update() {
        if (Math.random() < 0.02) {
            const angle = Math.atan2(game.player.y - game.enemy.y, game.player.x - game.enemy.x);
            game.bullets.push({ x: game.enemy.x, y: game.enemy.y, vx: Math.cos(angle) * 6, vy: Math.sin(angle) * 6, enemy: true });
        }
        
        game.bullets = game.bullets.filter(b => {
            b.x += b.vx; b.y += b.vy;
            if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) return false;
            
            const target = b.enemy ? game.player : game.enemy;
            const dx = b.x - target.x, dy = b.y - target.y;
            if (Math.sqrt(dx*dx + dy*dy) < 30) {
                target.health -= 10;
                game.explosions.push({ x: b.x, y: b.y, life: 20 });
                if (target.health <= 0) game.state = 'win';
                return false;
            }
            return true;
        });
        
        game.explosions = game.explosions.filter(e => { e.life--; return e.life > 0; });
    }

    function draw() {
        ctx.fillStyle = '#1e3799'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath(); ctx.arc(100, 500, 80, 0, Math.PI*2); ctx.fill();
        
        ctx.fillStyle = game.player.health > 30 ? '#2ecc71' : '#e74c3c';
        ctx.fillRect(50, 20, 100 * (game.player.health/100), 10);
        
        ctx.fillStyle = game.enemy.health > 30 ? '#2ecc71' : '#e74c3c';
        ctx.fillRect(450, 20, 100 * (game.enemy.health/100), 10);
        
        ctx.save(); ctx.translate(game.player.x, game.player.y); ctx.rotate(game.player.angle);
        ctx.fillStyle = '#3498db'; ctx.fillRect(-20, -10, 40, 20); ctx.fillStyle = '#f1c40f'; ctx.fillRect(20, -5, 15, 10); ctx.restore();
        
        ctx.save(); ctx.translate(game.enemy.x, game.enemy.y); ctx.rotate(game.enemy.angle);
        ctx.fillStyle = '#e74c3c'; ctx.fillRect(-20, -10, 40, 20); ctx.fillStyle = '#f1c40f'; ctx.fillRect(-35, -5, 15, 10); ctx.restore();
        
        ctx.fillStyle = '#000'; game.bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI*2); ctx.fill(); });
        ctx.fillStyle = '#f39c12'; game.explosions.forEach(e => { ctx.globalAlpha = e.life/20; ctx.beginPath(); ctx.arc(e.x, e.y, 15, 0, Math.PI*2); ctx.fill(); });
        ctx.globalAlpha = 1;
    }

    function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
    if (typeof window !== 'undefined') window.gameHandleInput = handleInput;
    gameLoop();
})();