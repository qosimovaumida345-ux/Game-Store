// Tennis Game 2 - Grand Slam Championship
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        player1: {
            x: 200,
            y: canvas.height / 2,
            score: 0,
            games: 0,
            sets: 0,
            serving: true,
            speed: 6,
            reach: 50
        },
        player2: {
            x: canvas.width - 200,
            y: canvas.height / 2,
            score: 0,
            games: 0,
            sets: 0,
            serving: false,
            speed: 5,
            reach: 45
        },
        ball: {
            x: canvas.width / 2,
            y: canvas.height / 2,
            vx: 0,
            vy: 0,
            speed: 8,
            rotation: 0
        },
        court: {
            width: canvas.width - 100,
            height: canvas.height - 100,
            netY: canvas.height / 2
        },
        server: 1,
        pointInPlay: false,
        rallyCount: 0,
        winner: null,
        matchTime: 0,
        scoreDisplay: '0 - 0',
        firstServe: true,
        faultCount: 0,
        letCount: 0
    };

    const POINTS = ['0', '15', '30', '40', 'AD'];

    function handleInput(data) {
        if (game.state !== 'playing') return;
        
        const p1 = game.player1;
        
        if (data.up) p1.y -= p1.speed;
        if (data.down) p1.y += p1.speed;
        
        p1.y = Math.max(80, Math.min(canvas.height - 80, p1.y));
        
        if (data.action && !game.pointInPlay && game.server === 1) {
            serveBall(1);
        }
        
        if (data.special && game.pointInPlay) {
            const dx = game.ball.x - p1.x;
            const dy = game.ball.y - p1.y;
            if (Math.sqrt(dx * dx + dy * dy) < p1.reach) {
                smashBall(1);
            }
        }
    }

    function serveBall(server) {
        const p = server === 1 ? game.player1 : game.player2;
        
        game.ball.x = p.x + (server === 1 ? 30 : -30);
        game.ball.y = p.y;
        
        const targetY = 100 + Math.random() * (canvas.height - 200);
        const angle = Math.atan2(targetY - p.y, (server === 1 ? canvas.width - 100 : 100) - p.x);
        
        game.ball.vx = Math.cos(angle) * game.ball.speed;
        game.ball.vy = Math.sin(angle) * game.ball.speed;
        
        game.pointInPlay = true;
        game.rallyCount = 0;
    }

    function smashBall(player) {
        const targetX = player === 1 ? canvas.width - 150 : 150;
        const targetY = 100 + Math.random() * (canvas.height - 200);
        
        const angle = Math.atan2(targetY - game.ball.y, targetX - game.ball.x);
        
        game.ball.vx = Math.cos(angle) * 15;
        game.ball.vy = Math.sin(angle) * 10;
        
        game.rallyCount += 3;
    }

    function aiUpdate() {
        const p2 = game.player2;
        
        if (!game.pointInPlay && game.server === 2) {
            const ready = Math.random() < 0.02;
            if (ready) serveBall(2);
            return;
        }
        
        const targetY = game.ball.y;
        const yDiff = targetY - p2.y;
        
        if (Math.abs(yDiff) > 10) {
            p2.y += Math.sign(yDiff) * p2.speed;
        }
        
        p2.y = Math.max(80, Math.min(canvas.height - 80, p2.y));
        
        if (game.pointInPlay && game.ball.vx < 0) {
            const dx = game.ball.x - p2.x;
            const dy = game.ball.y - p2.y;
            if (Math.sqrt(dx * dx + dy * dy) < p2.reach && Math.random() < 0.1) {
                const targetX = 150;
                const targetY = 100 + Math.random() * (canvas.height - 200);
                
                const angle = Math.atan2(targetY - p2.y, targetX - p2.x);
                game.ball.vx = Math.cos(angle) * game.ball.speed;
                game.ball.vy = Math.sin(angle) * game.ball.speed;
                
                game.rallyCount++;
            }
        }
    }

    function update() {
        if (game.state !== 'playing') return;
        
        game.matchTime += 1/60;
        
        aiUpdate();
        
        if (!game.pointInPlay) return;
        
        game.ball.x += game.ball.vx;
        game.ball.y += game.ball.vy;
        
        game.ball.vy += 0.15;
        
        if (game.ball.y < 50 || game.ball.y > canvas.height - 50) {
            if (game.ball.vx > 0) {
                scorePoint(1);
            } else {
                scorePoint(2);
            }
        }
        
        if (game.ball.x < 80) {
            const p1 = game.player1;
            const dx = game.ball.x - p1.x;
            const dy = game.ball.y - p1.y;
            
            if (Math.abs(dx) < 30 && Math.abs(dy) < p1.reach) {
                const targetX = canvas.width - 150;
                const targetY = 100 + Math.random() * (canvas.height - 200);
                
                const angle = Math.atan2(targetY - p1.y, targetX - p1.x);
                game.ball.vx = Math.cos(angle) * game.ball.speed;
                game.ball.vy = Math.sin(angle) * game.ball.speed;
                
                game.rallyCount++;
            }
        }
        
        if (game.ball.x > canvas.width - 80) {
            const p2 = game.player2;
            const dx = game.ball.x - p2.x;
            const dy = game.ball.y - p2.y;
            
            if (Math.abs(dx) < 30 && Math.abs(dy) < p2.reach) {
                const targetX = 150;
                const targetY = 100 + Math.random() * (canvas.height - 200);
                
                const angle = Math.atan2(targetY - p2.y, targetX - p2.x);
                game.ball.vx = Math.cos(angle) * game.ball.speed;
                game.ball.vy = Math.sin(angle) * game.ball.speed;
                
                game.rallyCount++;
            }
        }
    }

    function scorePoint(winner) {
        game.pointInPlay = false;
        
        const p1 = game.player1;
        const p2 = game.player2;
        
        if (winner === 1) {
            if (p1.score < 3) {
                p1.score++;
            } else if (p1.score === 3 && p2.score < 3) {
                p1.score = 4;
            } else if (p1.score === 3 && p2.score === 3) {
                p1.score = 4;
            } else if (p2.score === 4) {
                p1.score = 3;
                p2.score = 3;
            } else {
                p1.games++;
                p1.score = 0;
                p2.score = 0;
                game.server = game.server === 1 ? 2 : 1;
                
                if (p1.games >= 6 && p1.games - p2.games >= 2) {
                    p1.sets++;
                    p1.games = 0;
                    p2.games = 0;
                }
            }
        } else {
            if (p2.score < 3) {
                p2.score++;
            } else if (p2.score === 3 && p1.score < 3) {
                p2.score = 4;
            } else if (p2.score === 3 && p1.score === 3) {
                p2.score = 4;
            } else if (p1.score === 4) {
                p2.score = 3;
                p1.score = 3;
            } else {
                p2.games++;
                p1.score = 0;
                p2.score = 0;
                game.server = game.server === 1 ? 2 : 1;
                
                if (p2.games >= 6 && p2.games - p1.games >= 2) {
                    p2.sets++;
                    p1.games = 0;
                    p2.games = 0;
                }
            }
        }
        
        game.scoreDisplay = `${POINTS[p1.score]} - ${POINTS[p2.score]}`;
        
        if (p1.sets >= 3 || p2.sets >= 3) {
            game.state = 'finished';
            game.winner = p1.sets >= 3 ? 'Player' : 'AI';
        }
        
        resetBall();
    }

    function resetBall() {
        game.ball.x = canvas.width / 2;
        game.ball.y = canvas.height / 2;
        game.ball.vx = 0;
        game.ball.vy = 0;
        
        game.firstServe = true;
    }

    function draw() {
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#8dc63f';
        ctx.fillRect(0, 50, canvas.width, canvas.height - 100);
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        
        ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);
        
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 50);
        ctx.lineTo(canvas.width / 2, canvas.height - 50);
        ctx.stroke();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(50, canvas.height / 2);
        ctx.lineTo(canvas.width - 50, canvas.height / 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(game.player1.x, game.player1.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(game.player2.x, game.player2.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(game.ball.x, game.ball.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, 10, 150, 100);
        
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(game.scoreDisplay, 20, 40);
        
        ctx.font = '16px Arial';
        ctx.fillText(`Games: ${game.player1.games} - ${game.player2.games}`, 20, 65);
        ctx.fillText(`Sets: ${game.player1.sets} - ${game.player2.sets}`, 20, 88);
        
        ctx.fillStyle = game.server === 1 ? '#3498db' : '#e74c3c';
        ctx.fillText(game.server === 1 ? 'Your serve' : 'AI serve', 20, 111);
        
        if (game.state === 'finished') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = '#ffd700';
            ctx.textAlign = 'center';
            ctx.fillText(`${game.winner} Wins!`, canvas.width/2, canvas.height/2 - 20);
        }
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    gameLoop();
})();