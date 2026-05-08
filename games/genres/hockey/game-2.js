// Hockey Game 2 - Ice Arena
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing', player: { x: 150, y: 300, speed: 6, holding: true },
        pucks: [], players: [], score: { home: 0, away: 0 }, period: 1, time: 1200
    };

    function init() {
        game.players.push({ x: 150, y: 300, team: 'home' });
        for (let i = 0; i < 4; i++) game.players.push({ x: 300 + i * 150, y: 150 + Math.random() * 300, team: 'away' });
    }

    function handleInput(data) {
        const p = game.player;
        if (data.up) p.y -= p.speed;
        if (data.down) p.y += p.speed;
        if (data.left) p.x -= p.speed;
        if (data.right) p.x += p.speed;
        p.x = Math.max(50, Math.min(canvas.width - 50, p.x));
        p.y = Math.max(80, Math.min(canvas.height - 80, p.y));
    }

    function update() {
        game.time--;
        game.players.forEach(p => {
            if (p.team === 'away' && Math.random() < 0.02) {
                const target = game.players[0];
                p.x += (target.x - p.x) * 0.02;
                p.y += (target.y - p.y) * 0.02;
            }
            p.x = Math.max(50, Math.min(canvas.width - 50, p.x));
            p.y = Math.max(80, Math.min(canvas.height - 80, p.y));
        });

        if (game.player.holding) {
            game.pucks.push({ x: game.player.x + 20, y: game.player.y, vx: 8, vy: 0 });
            game.player.holding = false;
            setTimeout(() => game.player.holding = true, 500);
        }
        
        game.pucks = game.pucks.filter(p => {
            p.x += p.vx; p.y += p.vy;
            p.vy += 0.1; p.vx *= 0.99;
            if (p.y < 80 || p.y > canvas.height - 80 || p.x < 50 || p.x > canvas.width - 50) return false;
            if (p.x > canvas.width - 70) { game.score.home++; game.pucks = []; }
            if (p.x < 70) { game.score.away++; game.pucks = []; }
            return true;
        });
    }

    function draw() {
        ctx.fillStyle = '#ecf0f1'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#e74c3c'; ctx.fillRect(50, 80, 20, canvas.height - 160);
        ctx.fillStyle = '#3498db'; ctx.fillRect(canvas.width - 70, 80, 20, canvas.height - 160);
        ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(100, canvas.height/2, 40, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(canvas.width - 100, canvas.height/2, 40, 0, Math.PI*2); ctx.stroke();
        
        game.players.forEach(p => {
            ctx.fillStyle = p.team === 'home' ? '#3498db' : '#e74c3c';
            ctx.beginPath(); ctx.arc(p.x, p.y, 15, 0, Math.PI*2); ctx.fill();
        });
        
        ctx.fillStyle = '#000'; game.pucks.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI*2); ctx.fill(); });
        
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(10, 10, 120, 70);
        ctx.fillStyle = '#fff'; ctx.font = '20px Arial';
        ctx.fillText(`${game.score.home} - ${game.score.away}`, 20, 35);
        ctx.fillText(`Period: ${game.period}`, 20, 60);
    }

    function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
    init();
    if (typeof window !== 'undefined') window.gameHandleInput = handleInput;
    gameLoop();
})();