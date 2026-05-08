// Skiing Game 1 - Alpine Rush
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        player: { x: 200, y: 100, speed: 0, angle: 0, score: 0, tricks: 0 },
        obstacles: [],
        flags: [],
        particles: [],
        trees: [],
        snowflakes: [],
        cameraY: 0,
        distance: 0,
        difficulty: 1
    };

    function init() {
        for (let i = 0; i < 30; i++) {
            game.trees.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height * 2,
                size: 20 + Math.random() * 30
            });
        }
        for (let i = 0; i < 50; i++) {
            game.snowflakes.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 3,
                speed: 1 + Math.random() * 2
            });
        }
    }

    function handleInput(data) {
        if (data.left) game.player.angle -= 0.1;
        if (data.right) game.player.angle += 0.1;
        if (data.action) game.player.speed = 15;
    }

    function update() {
        game.player.speed = Math.min(12, game.player.speed + 0.1);
        game.player.y += game.player.speed;
        game.player.x += Math.sin(game.player.angle) * game.player.speed * 0.5;
        game.player.x = Math.max(30, Math.min(canvas.width - 30, game.player.x));
        
        game.distance += game.player.speed;
        
        if (Math.random() < 0.05) {
            game.obstacles.push({ x: Math.random() * canvas.width, y: -30, type: 'rock' });
            game.flags.push({ x: Math.random() * canvas.width, y: -30, passed: false });
        }
        
        game.obstacles.forEach(o => { o.y += game.player.speed; });
        game.flags.forEach(f => { f.y += game.player.speed; });
        
        game.obstacles = game.obstacles.filter(o => {
            const dx = Math.abs(o.x - game.player.x);
            const dy = Math.abs(o.y - game.player.y);
            if (dx < 30 && dy < 30) {
                game.player.speed *= 0.5;
                return false;
            }
            return o.y < canvas.height + 50;
        });
        
        game.flags = game.flags.filter(f => {
            if (!f.passed && f.y > game.player.y) {
                f.passed = true;
                game.player.score += 100;
            }
            return f.y < canvas.height + 50;
        });
        
        game.snowflakes.forEach(s => {
            s.y += s.speed + game.player.speed * 0.5;
            if (s.y > canvas.height) {
                s.y = -10;
                s.x = Math.random() * canvas.width;
            }
        });
    }

    function draw() {
        ctx.fillStyle = '#ecf0f1';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#bdc3c7';
        game.trees.forEach(t => ctx.fillRect(t.x, t.y - t.size, t.size/2, t.size));
        
        game.flags.forEach(f => {
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(f.x - 2, f.y - 30, 4, 30);
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.moveTo(f.x + 2, f.y - 30);
            ctx.lineTo(f.x + 25, f.y - 25);
            ctx.lineTo(f.x + 2, f.y - 20);
            ctx.fill();
        });
        
        game.obstacles.forEach(o => {
            ctx.fillStyle = '#7f8c8d';
            ctx.beginPath();
            ctx.arc(o.x, o.y, 15, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.save();
        ctx.translate(game.player.x, game.player.y);
        ctx.rotate(game.player.angle);
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(-15, 20);
        ctx.lineTo(15, 20);
        ctx.fill();
        ctx.restore();
        
        ctx.fillStyle = '#fff';
        game.snowflakes.forEach(s => {
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(10, 10, 120, 60);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText(`Score: ${game.player.score}`, 20, 35);
        ctx.fillText(`Dist: ${Math.floor(game.distance/10)}m`, 20, 60);
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
    
    init();
    if (typeof window !== 'undefined') window.gameHandleInput = handleInput;
    gameLoop();
})();