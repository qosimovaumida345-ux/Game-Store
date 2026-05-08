// Golf Game 2 - Island Links
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'aiming', player: { x: 100, y: 400, power: 0, angle: 0, strokes: 0 },
        hole: { x: 700, y: 100, radius: 15 }, wind: 5, holes: 1, score: 0,
        ball: { x: 100, y: 400, vx: 0, vy: 0, moving: false },
        water: [{ x: 300, y: 200, width: 100, height: 150 }],
        sand: [{ x: 500, y: 300, width: 60, height: 40 }],
        trees: [], camera: { x: 0, y: 0 }
    };

    function init() {
        for (let i = 0; i < 15; i++) game.trees.push({ x: Math.random() * 750, y: Math.random() * 500, r: 15 + Math.random() * 10 });
    }

    function handleInput(data) {
        if (game.state === 'aiming') {
            if (data.action && game.player.power < 100) game.player.power += 2;
            if (!data.action && game.player.power > 10) {
                game.ball.vx = Math.cos(game.player.angle) * game.player.power / 8;
                game.ball.vy = Math.sin(game.player.angle) * game.player.power / 8;
                game.ball.moving = true;
                game.state = 'moving';
                game.player.strokes++;
            }
            if (data.left) game.player.angle -= 0.05;
            if (data.right) game.player.angle += 0.05;
        }
    }

    function update() {
        if (!game.ball.moving) return;
        
        game.ball.x += game.ball.vx;
        game.ball.y += game.ball.vy;
        game.ball.vx *= 0.98;
        game.ball.vy *= 0.98;
        game.ball.vy += 0.1;
        
        if (Math.abs(game.ball.vx) < 0.1 && Math.abs(game.ball.vy) < 0.1) {
            game.ball.moving = false;
            game.ball.vx = 0; game.ball.vy = 0;
            game.state = 'aiming';
            game.player.x = game.ball.x;
            game.player.y = game.ball.y;
        }
        
        const dx = game.ball.x - game.hole.x;
        const dy = game.ball.y - game.hole.y;
        if (Math.sqrt(dx * dx + dy * dy) < game.hole.radius) {
            game.score += game.player.strokes;
            game.holes++;
            game.player.strokes = 0;
            game.ball.x = 100; game.ball.y = 400;
            game.wind = (Math.random() - 0.5) * 10;
        }
        
        game.water.forEach(w => {
            if (game.ball.x > w.x && game.ball.x < w.x + w.width && game.ball.y > w.y && game.ball.y < w.y + w.height) {
                game.ball.x = game.player.x; game.ball.y = game.player.y;
                game.ball.moving = false; game.state = 'aiming';
                game.player.strokes++;
            }
        });
    }

    function draw() {
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#3498db';
        game.water.forEach(w => ctx.fillRect(w.x, w.y, w.width, w.height));
        
        ctx.fillStyle = '#f1c40f';
        game.sand.forEach(s => ctx.beginPath(), ctx.arc(s.x + s.width/2, s.y + s.height/2, s.width/2, 0, Math.PI*2), ctx.fill());
        
        game.trees.forEach(t => { ctx.fillStyle = '#2ecc71'; ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI*2); ctx.fill(); });
        
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(game.hole.x, game.hole.y, game.hole.radius, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(game.hole.x, game.hole.y, game.hole.radius - 3, 0, Math.PI*2); ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(game.ball.x, game.ball.y, 8, 0, Math.PI*2); ctx.fill();
        
        ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(game.ball.x, game.ball.y);
        const pw = game.player.power / 8;
        ctx.lineTo(game.ball.x + Math.cos(game.player.angle) * pw * 5, game.ball.y + Math.sin(game.player.angle) * pw * 5); ctx.stroke();
        
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(10, 10, 150, 80);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText(`Hole: ${game.holes}`, 20, 35);
        ctx.fillText(`Strokes: ${game.player.strokes}`, 20, 60);
        ctx.fillText(`Wind: ${game.wind.toFixed(1)}`, 20, 85);
    }

    function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
    init();
    if (typeof window !== 'undefined') window.gameHandleInput = handleInput;
    gameLoop();
})();