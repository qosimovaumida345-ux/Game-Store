// Bowling Game 3 - Strike League
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'aiming', player: { x: 400, y: 500, angle: -Math.PI/2, power: 0, spin: 0 },
        ball: { x: 400, y: 500, vx: 0, vy: 0, radius: 12 }, pins: [], frame: 1, rolls: 0,
        score: 0, strikes: 0, spares: 0, gutter: false
    };

    function resetPins() {
        game.pins = [];
        const positions = [[0,0],[20,-15],[20,15],[40,-30],[40,0],[40,30],[60,-45],[60,-15],[60,15],[60]];
        positions.forEach((p, i) => game.pins.push({ x: 400 + p[0], y: 100 + (p[1] || 0), hit: false }));
    }

    function handleInput(data) {
        if (game.state === 'aiming') {
            if (data.up) game.player.angle -= 0.05;
            if (data.down) game.player.angle += 0.05;
            if (data.action && game.player.power < 100) game.player.power += 2;
            if (!data.action && game.player.power > 20) {
                const speed = game.player.power / 6;
                game.ball.vx = Math.cos(game.player.angle) * speed;
                game.ball.vy = Math.sin(game.player.angle) * speed;
                game.state = 'rolling';
            }
        }
    }

    function update() {
        if (game.state === 'rolling') {
            game.ball.x += game.ball.vx; game.ball.y += game.ball.vy;
            game.ball.vy += 0.02;
            game.ball.vx *= 0.995; game.ball.vy *= 0.995;
            
            if (game.ball.y < 80) {
                game.gutter = true;
                game.state = 'finished';
                setTimeout(() => { game.rolls++; checkFrame(); }, 1000);
            }
            
            game.pins.forEach(p => {
                if (!p.hit) {
                    const dx = game.ball.x - p.x, dy = game.ball.y - p.y;
                    if (Math.sqrt(dx*dx + dy*dy) < 20) {
                        p.hit = true;
                        const angle = Math.atan2(dy, dx);
                        p.vx = Math.cos(angle) * 5; p.vy = Math.sin(angle) * 5;
                    }
                } else if (p.vx !== 0 || p.vy !== 0) {
                    p.x += p.vx; p.y += p.vy;
                    p.vx *= 0.9; p.vy *= 0.9;
                    if (Math.abs(p.vx) < 0.1) p.vx = 0;
                }
            });
            
            const allStopped = game.pins.every(p => p.vx === 0 && p.vy === 0);
            if (allStopped && game.ball.vy < 0.5) {
                game.state = 'finished';
                const hitCount = game.pins.filter(p => p.hit).length;
                if (hitCount === 10) { game.strikes++; game.score += 30; }
                else if (game.rolls === 1 && hitCount < 10) { game.spares++; game.score += hitCount + 10; }
                else game.score += hitCount;
                setTimeout(() => { game.rolls++; checkFrame(); }, 1500);
            }
            
            if (game.ball.y < -50 || game.ball.x < 0 || game.ball.x > canvas.width) {
                game.state = 'finished';
                setTimeout(() => { game.rolls++; checkFrame(); }, 1000);
            }
        }
    }

    function checkFrame() {
        if (game.rolls >= 2 || game.pins.filter(p => p.hit).length === 10) {
            game.frame++; game.rolls = 0; game.gutter = false;
            if (game.frame > 10) { game.state = 'gameover'; return; }
        }
        game.ball.x = 400; game.ball.y = 500; game.ball.vx = 0; game.ball.vy = 0;
        game.player.power = 0; game.state = 'aiming';
        if (game.rolls === 0) resetPins();
    }

    function draw() {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(350, 0, 100, 50);
        ctx.fillStyle = '#000';
        for (let i = 0; i < 10; i++) ctx.fillRect(380, 40 + i * 4, 40, 2);
        
        game.pins.forEach(p => {
            if (p.y < 200) {
                ctx.fillStyle = p.hit ? '#666' : '#fff';
                ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#f00'; ctx.beginPath(); ctx.arc(p.x + 2, p.y - 3, 2, 0, Math.PI*2); ctx.fill();
            }
        });
        
        const gradient = ctx.createRadialGradient(game.ball.x, game.ball.y, 0, game.ball.x, game.ball.y, 12);
        gradient.addColorStop(0, '#fff'); gradient.addColorStop(1, '#aaa');
        ctx.fillStyle = gradient;
        ctx.beginPath(); ctx.arc(game.ball.x, game.ball.y, 12, 0, Math.PI*2); ctx.fill();
        
        if (game.state === 'aiming') {
            ctx.strokeStyle = '#f00'; ctx.lineWidth = 3;
            const len = game.player.power / 5;
            ctx.beginPath(); ctx.moveTo(game.ball.x, game.ball.y);
            ctx.lineTo(game.ball.x + Math.cos(game.player.angle) * len, game.ball.y + Math.sin(game.player.angle) * len); ctx.stroke();
        }
        
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(10, 10, 140, 100);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText(`Frame: ${game.frame}`, 20, 35);
        ctx.fillText(`Roll: ${game.rolls + 1}`, 20, 58);
        ctx.fillText(`Score: ${game.score}`, 20, 81);
        ctx.fillText(`Strikes: ${game.strikes}`, 100, 35);
        ctx.fillText(`Spares: ${game.spares}`, 100, 58);
    }

    function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
    resetPins();
    if (typeof window !== 'undefined') window.gameHandleInput = handleInput;
    gameLoop();
})();