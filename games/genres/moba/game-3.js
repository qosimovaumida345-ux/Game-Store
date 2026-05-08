// MOBA Game 3 - Arena Legends
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing', player: { x: 100, y: 300, health: 100, level: 1, exp: 0, gold: 0, skills: [0,0,0] },
        allies: [], enemies: [], towers: [], minions: [], score: 0, time: 0
    };

    function init() {
        game.allies.push({ x: 80, y: 280, health: 80, type: 'tank' }, { x: 80, y: 320, health: 60, type: 'mage' });
        game.enemies.push({ x: 700, y: 280, health: 80, type: 'tank' }, { x: 700, y: 320, health: 60, type: 'mage' });
        game.towers.push({ x: 200, y: 300, health: 200, team: 'ally' }, { x: 600, y: 300, health: 200, team: 'enemy' });
    }

    function handleInput(data) {
        const p = game.player;
        if (data.up) p.y -= 5;
        if (data.down) p.y += 5;
        if (data.left) p.x -= 5;
        if (data.right) p.x += 5;
        
        if (data.action && p.skills[0] > 30) { p.skills[0] = 0; attackNearby(); }
        if (data.special && p.skills[1] > 50) { p.skills[1] = 0; useUlt(); }
        
        p.x = Math.max(50, Math.min(750, p.x));
        p.y = Math.max(50, Math.min(550, p.y));
    }

    function attackNearby() {
        const p = game.player;
        [...game.enemies, ...game.minions].forEach(e => {
            const dx = e.x - p.x, dy = e.y - p.y;
            if (Math.sqrt(dx*dx+dy*dy) < 80) e.health -= 30 + p.level * 10;
        });
    }

    function useUlt() {
        const p = game.player;
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 150);
        gradient.addColorStop(0, 'rgba(255,255,255,0.5)');
        ctx.fillStyle = gradient; ctx.fillRect(0,0,canvas.width,canvas.height);
        
        [...game.enemies, ...game.minions].forEach(e => {
            const dx = e.x - p.x, dy = e.y - p.y;
            if (Math.sqrt(dx*dx+dy*dy) < 150) e.health -= 100 + p.level * 20;
        });
    }

    function update() {
        game.time++;
        
        game.player.skills[0] = Math.min(100, game.player.skills[0] + 0.5);
        game.player.skills[1] = Math.min(100, game.player.skills[1] + 0.2);
        
        if (Math.random() < 0.02) {
            game.minions.push({ x: 50, y: 250 + Math.random()*100, health: 40, team: 'ally', speed: 2 });
            game.minions.push({ x: 750, y: 250 + Math.random()*100, health: 40, team: 'enemy', speed: 2 });
        }
        
        game.minions.forEach(m => {
            const target = m.team === 'ally' ? game.enemies : game.allies;
            if (target.length > 0) {
                const t = target[0];
                m.x += (t.x - m.x) * 0.02;
                m.y += (t.y - m.y) * 0.02;
            }
        });
        
        const allDead = e => e.health <= 0;
        if (game.enemies.every(allDead)) { game.score += 500; game.player.gold += 200; game.player.exp += 100; }
    }

    function draw() {
        ctx.fillStyle = '#27ae60'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#2ecc71'; ctx.fillRect(0, 200, 250, 10); ctx.fillStyle = '#e74c3c'; ctx.fillRect(550, 200, 250, 10);
        
        game.towers.forEach(t => {
            ctx.fillStyle = t.team === 'ally' ? '#3498db' : '#e74c3c';
            ctx.fillRect(t.x - 20, t.y - 40, 40, 60);
            ctx.fillStyle = '#333'; ctx.fillRect(t.x - 15, t.y - 35, 30, 8);
            ctx.fillStyle = t.health > 50 ? '#2ecc71' : '#e74c3c'; ctx.fillRect(t.x-14, t.y-34, 28*(t.health/200), 6);
        });
        
        game.minions.forEach(m => {
            ctx.fillStyle = m.team === 'ally' ? '#3498db' : '#e74c3c';
            ctx.beginPath(); ctx.arc(m.x, m.y, 8, 0, Math.PI*2); ctx.fill();
        });
        
        game.allies.forEach(a => { ctx.fillStyle = '#3498db'; ctx.beginPath(); ctx.arc(a.x, a.y, 15, 0, Math.PI*2); ctx.fill(); });
        game.enemies.forEach(e => { ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(e.x, e.y, 15, 0, Math.PI*2); ctx.fill(); });
        
        ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.arc(game.player.x, game.player.y, 18, 0, Math.PI*2); ctx.fill();
        
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(10, 10, 130, 100);
        ctx.fillStyle = '#fff'; ctx.font = '18px Arial';
        ctx.fillText(`Lvl: ${game.player.level}`, 20, 30);
        ctx.fillText(`Gold: ${game.player.gold}`, 20, 55);
        ctx.fillText(`Q: ${Math.floor(game.player.skills[0])}%`, 20, 80);
        ctx.fillText(`R: ${Math.floor(game.player.skills[1])}%`, 80, 80);
    }

    function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
    init();
    if (typeof window !== 'undefined') window.gameHandleInput = handleInput;
    gameLoop();
})();