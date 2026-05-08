// Soccer Game 2 - World Cup
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing', score: { home: 0, away: 0 }, half: 1, time: 2700,
        player: { x: 200, y: 300, speed: 5, stamina: 100 },
        ball: { x: 300, y: 300, vx: 0, vy: 0 }, goals: [],
        homeTeam: [], awayTeam: []
    };

    function init() {
        for (let i = 0; i < 4; i++) {
            game.homeTeam.push({ x: 150 + i * 50, y: 200 + i * 60, role: i === 0 ? 'keeper' : 'player' });
            game.awayTeam.push({ x: 550 - i * 50, y: 200 + i * 60, role: i === 0 ? 'keeper' : 'player' });
        }
    }

    function handleInput(data) {
        const p = game.player;
        if (data.up) p.y -= p.speed;
        if (data.down) p.y += p.speed;
        if (data.left) p.x -= p.speed;
        if (data.right) p.x += p.speed;
        
        if (data.action) {
            const dx = game.ball.x - p.x, dy = game.ball.y - p.y;
            if (Math.sqrt(dx*dx+dy*dy) < 30) {
                game.ball.vx = 8; game.ball.vy = (Math.random() - 0.5) * 4;
            }
        }
        
        p.x = Math.max(50, Math.min(450, p.x));
        p.y = Math.max(100, Math.min(500, p.y));
    }

    function update() {
        game.time--;
        
        game.ball.x += game.ball.vx;
        game.ball.y += game.ball.vy;
        game.ball.vx *= 0.99;
        game.ball.vy *= 0.99;
        
        if (game.ball.y < 80 || game.ball.y > 520) game.ball.vy *= -0.8;
        if (game.ball.x < 30 || game.ball.x > 770) game.ball.vx *= -0.8;
        
        if (game.ball.x < 30 && game.ball.y > 220 && game.ball.y < 380) { game.score.away++; resetBall(); }
        if (game.ball.x > 770 && game.ball.y > 220 && game.ball.y < 380) { game.score.home++; resetBall(); }
        
        game.homeTeam.forEach(t => {
            t.x += (game.ball.x > 300 ? 1 : -1) * 0.5;
            t.y += (game.ball.y - t.y) * 0.01;
        });
        
        game.awayTeam.forEach(t => {
            t.x += (game.ball.x < 500 ? -1 : 1) * 0.5;
            t.y += (game.ball.y - t.y) * 0.01;
        });
        
        if (game.time <= 0) game.state = 'over';
    }

    function resetBall() {
        game.ball.x = 400; game.ball.y = 300; game.ball.vx = 0; game.ball.vy = 0;
    }

    function draw() {
        ctx.fillStyle = '#27ae60'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#2ecc71'; ctx.fillRect(50, 80, 20, 440); ctx.fillRect(730, 80, 20, 440);
        ctx.fillStyle = '#fff'; ctx.fillRect(50, 200, 20, 180); ctx.fillRect(730, 200, 20, 180);
        
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(400, 300, 50, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(400, 80); ctx.lineTo(400, 520); ctx.stroke();
        
        game.homeTeam.forEach(t => { ctx.fillStyle = '#3498db'; ctx.beginPath(); ctx.arc(t.x, t.y, 10, 0, Math.PI*2); ctx.fill(); });
        game.awayTeam.forEach(t => { ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(t.x, t.y, 10, 0, Math.PI*2); ctx.fill(); });
        
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(game.ball.x, game.ball.y, 8, 0, Math.PI*2); ctx.fill();
        
        const m = Math.floor(game.time / 60), s = game.time % 60;
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(10, 10, 180, 80);
        ctx.fillStyle = '#fff'; ctx.font = '25px Arial';
        ctx.fillText(`${game.score.home} - ${game.score.away}`, 20, 40);
        ctx.fillText(`${m}:${s.toString().padStart(2,'0')}`, 20, 70);
    }

    function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
    init();
    if (typeof window !== 'undefined') window.gameHandleInput = handleInput;
    gameLoop();
})();