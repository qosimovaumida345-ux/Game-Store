// Horror Game 3 - Midnight Manor
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing', player: { x: 400, y: 300, health: 100, flashlight: true, battery: 100 },
        enemies: [], items: [], rooms: [], currentRoom: 0, time: 0, score: 0, sanity: 100
    };

    function init() {
        for (let i = 0; i < 5; i++) game.rooms.push({ x: i * 200, y: 0, enemies: Math.floor(Math.random() * 3), searched: false });
        game.enemies.push({ x: 600, y: 100, state: 'patrol', speed: 1 });
    }

    function handleInput(data) {
        const p = game.player;
        if (data.up) p.y -= 3;
        if (data.down) p.y += 3;
        if (data.left) p.x -= 3;
        if (data.right) p.x += 3;
        p.x = Math.max(50, Math.min(750, p.x));
        p.y = Math.max(50, Math.min(550, p.y));
        
        if (data.action && p.flashlight) {
            p.battery -= 5;
            game.enemies.forEach(e => {
                const dx = e.x - p.x, dy = e.y - p.y;
                if (Math.sqrt(dx*dx+dy*dy) < 150 && (data.left || data.right || data.up || data.down)) e.state = 'flee';
            });
        }
    }

    function update() {
        game.time++;
        game.player.battery = Math.max(0, game.player.battery - 0.02);
        
        if (game.player.battery <= 0) game.player.flashlight = false;
        
        game.enemies.forEach(e => {
            if (e.state === 'patrol') {
                e.x += (game.player.x - e.x) * 0.001;
                e.y += (game.player.y - e.y) * 0.001;
            }
            
            const dx = e.x - game.player.x, dy = e.y - game.player.y;
            if (Math.sqrt(dx*dx + dy*dy) < 30) {
                game.player.health -= 10;
                game.player.sanity -= 15;
            }
        });
        
        if (game.player.sanity <= 0 || game.player.health <= 0) game.state = 'gameover';
    }

    function draw() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const light = game.player.flashlight ? 150 : 30;
        
        game.rooms.forEach(r => {
            const inRoom = game.player.x > r.x && game.player.x < r.x + 180;
            ctx.fillStyle = inRoom ? '#2c2c2c' : '#1a1a1a';
            ctx.fillRect(r.x + 10, 50, 180, 200);
        });
        
        if (game.player.flashlight) {
            const gradient = ctx.createRadialGradient(game.player.x, game.player.y, 0, game.player.x, game.player.y, light);
            gradient.addColorStop(0, 'rgba(255,255,200,0.3)');
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.fillStyle = '#3498db';
        ctx.beginPath(); ctx.arc(game.player.x, game.player.y, 10, 0, Math.PI*2); ctx.fill();
        
        game.enemies.forEach(e => {
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath(); ctx.arc(e.x, e.y, 12, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.fillRect(e.x-3, e.y-5, 6, 4); ctx.fillRect(e.x+1, e.y-5, 6, 4);
        });
        
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(10, 10, 150, 90);
        ctx.fillStyle = '#e74c3c'; ctx.fillText(`Health: ${game.player.health}%`, 20, 30);
        ctx.fillStyle = '#f1c40f'; ctx.fillText(`Battery: ${Math.floor(game.player.battery)}%`, 20, 55);
        ctx.fillStyle = '#9b59b6'; ctx.fillText(`Sanity: ${game.player.sanity}%`, 20, 80);
    }

    function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
    init();
    if (typeof window !== 'undefined') window.gameHandleInput = handleInput;
    gameLoop();
})();