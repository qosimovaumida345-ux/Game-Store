// Pool Game 2 - 8-Ball Championship
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'aiming',
        player: 1,
        balls: [],
        cue: { x: 200, y: canvas.height / 2, angle: 0, power: 0 },
        table: {
            x: 50,
            y: 50,
            width: canvas.width - 100,
            height: canvas.height - 100,
            pockets: []
        },
        cueBall: null,
        scoredBalls: { 1: [], 2: [] },
        foul: false,
        ballInHand: false,
        shotCount: 0,
        gameType: '8-ball',
        score: { 1: 0, 2: 0 }
    };

    function initBalls() {
        const colors = [
            '#ffff00', '#0000ff', '#ff0000', '#800080', '#ff6600', '#008000',
            '#800000', '#000000', '#ffd700', '#006400', '#00008b', '#8b0000',
            '#ff00ff', '#00ffff', '#808080', '#c0c0c0'
        ];
        
        game.cueBall = { x: 200, y: canvas.height / 2, vx: 0, vy: 0, radius: 12 };
        
        const rackX = canvas.width - 250;
        const rackY = canvas.height / 2;
        
        let ballNum = 1;
        const positions = [
            [0, 0], [-20, -12], [-20, 12], [-40, -24], [-40, 0], [-40, 24],
            [-60, -36], [-60, -12], [-60, 12], [-60, 36], [-80, -48], [-80, -24],
            [-80, 0], [-80, 24], [-80, 48]
        ];
        
        game.balls = [];
        
        let ball8Index = Math.floor(Math.random() * 5) + 4;
        
        for (let i = 0; i < 15; i++) {
            const pos = positions[i];
            
            let colorIndex = i;
            if (i >= ball8Index) colorIndex = i + 1;
            if (i === 14) colorIndex = 8;
            
            game.balls.push({
                x: rackX + pos[0],
                y: rackY + pos[1],
                vx: 0,
                vy: 0,
                radius: 12,
                color: colors[colorIndex],
                number: colorIndex,
                pocketed: false
            });
        }
    }

    function handleInput(data) {
        if (game.state !== 'aiming') return;
        
        if (data.tilt !== undefined) {
            game.cue.angle = data.tilt * Math.PI;
        }
        
        if (data.buttons && data.buttons[0]) {
            game.cue.power = Math.min(100, game.cue.power + 2);
        }
        
        if (data.action && game.cue.power > 10) {
            shoot();
        }
        
        if (data.buttons && data.buttons[4]) {
            if (game.ballInHand) {
                game.cueBall.x = data.x || 200;
                game.cueBall.y = data.y || canvas.height / 2;
            }
        }
    }

    function shoot() {
        game.state = 'moving';
        game.shotCount++;
        
        const speed = game.cue.power / 10;
        game.cueBall.vx = Math.cos(game.cue.angle) * speed;
        game.cueBall.vy = Math.sin(game.cue.angle) * speed;
        
        game.cue.power = 0;
        
        game.balls.forEach(b => {
            if (b.pocketed) return;
            const dx = b.x - game.cueBall.x;
            const dy = b.y - game.cueBall.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 24) {
                const angle = Math.atan2(dy, dx);
                b.vx = Math.cos(angle) * speed * 0.8;
                b.vy = Math.sin(angle) * speed * 0.8;
            }
        });
    }

    function update() {
        if (game.state === 'moving') {
            let allStopped = true;
            
            updateBall(game.cueBall);
            
            if (game.cueBall.vx !== 0 || game.cueBall.vy !== 0) allStopped = false;
            
            game.balls.forEach(b => {
                if (b.pocketed) return;
                updateBall(b);
                if (b.vx !== 0 || b.vy !== 0) allStopped = false;
            });
            
            if (allStopped) {
                processShotResult();
                game.state = 'aiming';
            }
        }
        
        const dx = Math.cos(game.cue.angle);
        const dy = Math.sin(game.cue.angle);
        game.cue.x = game.cueBall.x - dx * 40;
        game.cue.y = game.cueBall.y - dy * 40;
    }

    function updateBall(ball) {
        ball.vx *= 0.985;
        ball.vy *= 0.985;
        
        if (Math.abs(ball.vx) < 0.1 && Math.abs(ball.vy) < 0.1) {
            ball.vx = 0;
            ball.vy = 0;
            return;
        }
        
        ball.x += ball.vx;
        ball.y += ball.vy;
        
        const table = game.table;
        
        if (ball.x < table.x + ball.radius) {
            ball.x = table.x + ball.radius;
            ball.vx *= -0.8;
        }
        if (ball.x > table.x + table.width - ball.radius) {
            ball.x = table.x + table.width - ball.radius;
            ball.vx *= -0.8;
        }
        if (ball.y < table.y + ball.radius) {
            ball.y = table.y + ball.radius;
            ball.vy *= -0.8;
        }
        if (ball.y > table.y + table.height - ball.radius) {
            ball.y = table.y + table.height - ball.radius;
            ball.vy *= -0.8;
        }
        
        game.balls.forEach(b => {
            if (b === ball || b.pocketed) return;
            
            const dx = b.x - ball.x;
            const dy = b.y - ball.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < ball.radius + b.radius) {
                const angle = Math.atan2(dy, dx);
                const overlap = ball.radius + b.radius - dist;
                
                ball.x -= Math.cos(angle) * overlap / 2;
                ball.y -= Math.sin(angle) * overlap / 2;
                b.x += Math.cos(angle) * overlap / 2;
                b.y += Math.sin(angle) * overlap / 2;
                
                const v1 = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                const v2 = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                
                ball.vx = Math.cos(angle) * v2 * 0.9;
                ball.vy = Math.sin(angle) * v2 * 0.9;
                b.vx = Math.cos(angle + Math.PI) * v1 * 0.9;
                b.vy = Math.sin(angle + Math.PI) * v1 * 0.9;
            }
        });
        
        checkPockets(ball);
    }

    function checkPockets(ball) {
        const pockets = [
            { x: table.x, y: table.y },
            { x: table.x + table.width / 2, y: table.y - 10 },
            { x: table.x + table.width, y: table.y },
            { x: table.x, y: table.y + table.height },
            { x: table.x + table.width / 2, y: table.y + table.height + 10 },
            { x: table.x + table.width, y: table.y + table.height }
        ];
        
        pockets.forEach(pocket => {
            const dx = ball.x - pocket.x;
            const dy = ball.y - pocket.y;
            if (Math.sqrt(dx * dx + dy * dy) < 25) {
                ball.pocketed = true;
                ball.vx = 0;
                ball.vy = 0;
                
                if (ball === game.cueBall) {
                    game.foul = true;
                    game.ballInHand = true;
                } else {
                    game.scoredBalls[game.player].push(ball.number);
                }
            }
        });
    }

    function processShotResult() {
        if (game.cueBall.pocketed) {
            game.foul = true;
            game.cueBall.pocketed = false;
            game.cueBall.x = 200;
            game.cueBall.y = canvas.height / 2;
            game.cueBall.vx = 0;
            game.cueBall.vy = 0;
            game.ballInHand = true;
        }
        
        game.balls.forEach(b => {
            if (b.pocketed && b.number === 8 && game.player === 1) {
                const myBalls = game.scoredBalls[1].filter(n => n !== 8);
                if (myBalls.length === 7) {
                    game.score[1]++;
                    game.state = 'win';
                } else {
                    game.state = 'lose';
                }
            }
            if (b.pocketed && b.number === 8 && game.player === 2) {
                const myBalls = game.scoredBalls[2].filter(n => n !== 8);
                if (myBalls.length === 7) {
                    game.score[2]++;
                    game.state = 'win';
                } else {
                    game.state = 'lose';
                }
            }
        });
        
        if (!game.foul) {
            const scored = game.scoredBalls[game.player].length > 0;
            if (!scored) {
                game.player = game.player === 1 ? 2 : 1;
            }
        }
        
        game.foul = false;
    }

    function draw() {
        ctx.fillStyle = '#1a472a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const table = game.table;
        
        ctx.fillStyle = '#2d5a3d';
        ctx.fillRect(table.x - 20, table.y - 20, table.width + 40, table.height + 40);
        
        ctx.fillStyle = '#0d3d28';
        ctx.fillRect(table.x, table.y, table.width, table.height);
        
        const pocketRadius = 20;
        const pocketPositions = [
            [table.x, table.y],
            [table.x + table.width / 2, table.y - 5],
            [table.x + table.width, table.y],
            [table.x, table.y + table.height],
            [table.x + table.width / 2, table.y + table.height + 5],
            [table.x + table.width, table.y + table.height]
        ];
        
        ctx.fillStyle = '#000';
        pocketPositions.forEach(p => {
            ctx.beginPath();
            ctx.arc(p[0], p[1], pocketRadius, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.strokeStyle = '#c9a959';
        ctx.lineWidth = 4;
        ctx.strokeRect(table.x, table.y, table.width, table.height);
        
        ctx.strokeStyle = '#c9a959';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(table.x + table.width * 0.25, table.y);
        ctx.lineTo(table.x + table.width * 0.25, table.y + 80);
        ctx.moveTo(table.x + table.width * 0.25, table.y + table.height - 80);
        ctx.lineTo(table.x + table.width * 0.25, table.y + table.height);
        ctx.moveTo(table.x + table.width * 0.75, table.y);
        ctx.lineTo(table.x + table.width * 0.75, table.y + 80);
        ctx.moveTo(table.x + table.width * 0.75, table.y + table.height - 80);
        ctx.lineTo(table.x + table.width * 0.75, table.y + table.height);
        ctx.stroke();
        
        if (!game.cueBall.pocketed) {
            drawBall(game.cueBall.x, game.cueBall.y, game.cueBall.radius, '#fff');
        }
        
        game.balls.forEach(b => {
            if (!b.pocketed) {
                drawBall(b.x, b.y, b.radius, b.color);
                if (b.number !== 8) {
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(b.number, b.x, b.y + 4);
                }
            }
        });
        
        if (game.state === 'aiming' && !game.cueBall.pocketed) {
            ctx.save();
            ctx.translate(game.cueBall.x, game.cueBall.y);
            ctx.rotate(game.cue.angle);
            
            const powerPercent = game.cue.power / 100;
            const cueOffset = 30 + powerPercent * 50;
            
            ctx.strokeStyle = '#8b4513';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(-cueOffset, 0);
            ctx.lineTo(-cueOffset + 40, 0);
            ctx.stroke();
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.moveTo(-cueOffset + i * 10, -3);
                ctx.lineTo(-cueOffset + i * 10, 3);
                ctx.stroke();
            }
            
            ctx.restore();
            
            if (game.ballInHand) {
                ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
                ctx.beginPath();
                ctx.arc(game.cueBall.x, game.cueBall.y, 20, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 140, 80);
        
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        
        ctx.fillStyle = game.player === 1 ? '#3498db' : '#e74c3c';
        ctx.fillText(`Player ${game.player}'s Turn`, 20, 35);
        
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`P1: ${game.scoredBalls[1].length}`, 20, 60);
        ctx.fillText(`P2: ${game.scoredBalls[2].length}`, 20, 85);
        
        if (game.state === 'win' || game.state === 'lose') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = game.state === 'win' ? '#2ecc71' : '#e74c3c';
            ctx.textAlign = 'center';
            ctx.fillText(game.state === 'win' ? 'You Win!' : 'You Lose!', canvas.width/2, canvas.height/2);
        }
    }

    function drawBall(x, y, r, color) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
    }

    const table = game.table;

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    initBalls();
    
    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    gameLoop();
})();