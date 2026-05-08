// Volleyball Game 2 - Beach Pro
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing', score: 0, player: { x: 150, y: 350, jumps: 2 },
        ball: { x: 300, y: 100, vx: 2, vy: 0 }, team1: [], team2: [], serving: 1
    };

    function init() {
        game.team1.push({ x: 150, y: 350 }, { x: 100, y: 380 }, { x: 200, y: 380 });
        game.team2.push({ x: 450, y: 350 }, { x: 500, y: 380 }, { x: 400, y: 380 });
    }

    function handleInput(data) {
        const p = game.team1[0];
        if (data.up && p.jumps > 0) { p.y -= 15; p.jumps--; }
        if (data.down) p.y += 5;
        if (data.left) p.x -= 8;
        if (data.right) p.x += 8;
        p.y = Math.min(400, p.y + 3);
        p.x = Math.max(50, Math.min(250, p.x));
    }

    function update() {
        game.ball.x += game.ball.vx;
        game.ball.y += game.ball.vy;
        game.ball.vy += 0.2;
        
        if (game.ball.x < 300 && game.ball.y > 300) {
            game.team1.forEach(t => {
                const dx = game.ball.x - t.x, dy = game.ball.y - t.y;
                if (Math.sqrt(dx*dx + dy*dy) < 30) {
                    game.ball.vx = Math.abs(game.ball.vx) + 2 + Math.random() * 3;
                    game.ball.vy = -8 - Math.random() * 4;
                }
            });
        }
        
        if (game.ball.x > 300 && game.ball.y > 300) {
            const t = game.team2[Math.floor(Math.random() * 3)];
            const dx = game.ball.x - t.x, dy = game.ball.y - t.y;
            if (Math.sqrt(dx*dx + dy*dy) < 30) {
                game.ball.vx = -Math.abs(game.ball.vx) - 2 - Math.random() * 3;
                game.ball.vy = -8 - Math.random() * 4;
            }
        }
        
        if (game.ball.y > 500) {
            if (game.ball.x < 300) { game.score++; game.ball.x = 300; game.ball.y = 100; game.ball.vx = -2; }
            else { game.ball.x = 300; game.ball.y = 100; game.ball.vx = 2; }
        }
        
        if (game.ball.x < 0 || game.ball.x > 600) {
            game.ball.x = 300; game.ball.y = 100; game.ball.vx = Math.random() < 0.5 ? 2 : -2;
        }
    }

    function draw() {
        const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
        g.addColorStop(0, '#87ceeb'); g.addColorStop(1, '#f4d03f');
        ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#e67e22'; ctx.fillRect(0, 400, 300, 50);
        ctx.fillStyle = '#2ecc71'; ctx.fillRect(300, 400, 300, 50);
        
        game.team1.forEach(t => { ctx.fillStyle = '#3498db'; ctx.beginPath(); ctx.arc(t.x, t.y, 15, 0, Math.PI*2); ctx.fill(); });
        game.team2.forEach(t => { ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(t.x, t.y, 15, 0, Math.PI*2); ctx.fill(); });
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(game.ball.x, game.ball.y, 10, 0, Math.PI*2); ctx.fill();
        
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(10, 10, 100, 40);
        ctx.fillStyle = '#fff'; ctx.font = '25px Arial'; ctx.fillText(game.score, 20, 40);
    }

    function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
    init();
    if (typeof window !== 'undefined') window.gameHandleInput = handleInput;
    gameLoop();
})();