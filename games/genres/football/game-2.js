// Football Game 2 - Touchdown Blitz
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        quarter: 1,
        time: 900,
        player: {
            x: 150,
            y: canvas.height / 2,
            speed: 5,
            hasBall: true,
            health: 100,
            energy: 100,
            tackles: 0,
            touchdowns: 0,
            passing: 0,
            accuracy: 0
        },
        team: [],
        opponents: [],
        ball: { x: 150, y: canvas.height / 2, inAir: false, vx: 0, vy: 0 },
        field: { startX: 100, endX: 700, lineOfScrimmage: 200, firstDown: 300 },
        score: { player: 0, opponent: 0 },
        downs: 1,
        yardsToGo: 10,
        ballPosition: 200,
        coins: [],
        powerups: [],
        particles: []
    };

    class Player {
        constructor(x, y, isPlayer) {
            this.x = x;
            this.y = y;
            this.isPlayer = isPlayer;
            this.speed = isPlayer ? 5 : 4;
            this.radius = 15;
            this.health = 100;
            this.hasBall = !isPlayer;
        }
        
        update() {
            if (this.isPlayer) return;
            
            const dx = game.player.x - this.x;
            const dy = game.player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 100) {
                this.x += (dx / dist) * this.speed * 0.8;
                this.y += (dy / dist) * this.speed * 0.8;
            } else {
                this.x += (Math.random() - 0.5) * 2;
                this.y += (Math.random() - 0.5) * 2;
            }
            
            this.x = Math.max(100, Math.min(700, this.x));
            this.y = Math.max(50, Math.min(canvas.height - 50, this.y));
        }
        
        draw() {
            ctx.fillStyle = this.isPlayer ? '#3498db' : '#e74c3c';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(this.x, this.y - 5, 8, 0, Math.PI * 2);
            ctx.fill();
            
            if (this.hasBall) {
                ctx.fillStyle = '#f1c40f';
                ctx.beginPath();
                ctx.arc(this.x + 12, this.y, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    function initTeam() {
        game.team.push(new Player(150, canvas.height / 2 - 50, true));
        game.team.push(new Player(120, canvas.height / 2 + 50, true));
        game.team.push(new Player(180, canvas.height / 2 - 80, true));
        
        for (let i = 0; i < 6; i++) {
            game.opponents.push(new Player(
                400 + Math.random() * 200,
                100 + Math.random() * (canvas.height - 200),
                false
            ));
        }
    }

    function handleInput(data) {
        if (game.state !== 'playing') return;
        
        const p = game.player;
        
        if (data.up) p.y -= p.speed;
        if (data.down) p.y += p.speed;
        if (data.left) p.x -= p.speed;
        if (data.right) p.x += p.speed;
        
        p.x = Math.max(100, Math.min(700, p.x));
        p.y = Math.max(50, Math.min(canvas.height - 50, p.y));
        
        if (data.action && p.hasBall && !game.ball.inAir) {
            throwBall();
        }
        
        if (data.special && p.hasBall) {
            lateralPass();
        }
    }

    function throwBall() {
        const p = game.player;
        
        let targetX = 300;
        let targetY = canvas.height / 2;
        
        if (data.tilt !== undefined) {
            targetY += data.tilt * 100;
        }
        
        const distance = Math.sqrt(Math.pow(targetX - p.x, 2) + Math.pow(targetY - p.y, 2));
        const speed = Math.min(15, distance / 20);
        
        const angle = Math.atan2(targetY - p.y, targetX - p.x);
        
        game.ball.x = p.x;
        game.ball.y = p.y - 10;
        game.ball.vx = Math.cos(angle) * speed;
        game.ball.vy = Math.sin(angle) * speed;
        game.ball.inAir = true;
        
        p.hasBall = false;
        p.passing++;
        
        const teammates = game.team.filter(t => t !== p);
        if (teammates.length > 0) {
            const closest = teammates.reduce((min, t) => {
                const d = Math.sqrt(Math.pow(t.x - p.x, 2) + Math.pow(t.y - p.y, 2));
                return d < min.dist ? { t, dist: d } : min;
            }, { t: null, dist: Infinity });
            
            if (closest.dist < 200) {
                const target = closest.t;
                const catchChance = 0.7 - (closest.dist / 400);
                if (Math.random() < catchChance) {
                    game.ball.vx = 0;
                    game.ball.vy = 0;
                    game.ball.inAir = false;
                    target.hasBall = true;
                    game.player.hasBall = true;
                    game.player.accuracy = (game.player.accuracy * 0.7 + 1 * 0.3);
                }
            }
        }
    }

    function lateralPass() {
        const p = game.player;
        
        let targetX = p.x - 20;
        let targetY = p.y;
        
        const closest = game.team.reduce((min, t) => {
            if (t === p) return min;
            const d = Math.sqrt(Math.pow(t.x - p.x, 2) + Math.pow(t.y - p.y, 2));
            return d < min.dist ? { t, dist: d } : min;
        }, { t: null, dist: Infinity });
        
        if (closest.t && closest.dist < 100) {
            game.ball.x = p.x;
            game.ball.y = p.y;
            game.ball.vx = -5;
            game.ball.vy = 0;
            game.ball.inAir = true;
            
            p.hasBall = false;
            closest.t.hasBall = true;
            
            setTimeout(() => {
                if (game.ball.inAir) {
                    closest.t.hasBall = true;
                    game.ball.inAir = false;
                }
            }, 500);
        }
    }

    function update() {
        if (game.state !== 'playing') return;
        
        game.time--;
        
        if (game.time <= 0) {
            game.state = 'gameover';
            return;
        }
        
        game.opponents.forEach(op => op.update());
        
        if (game.ball.inAir) {
            game.ball.x += game.ball.vx;
            game.ball.y += game.ball.vy;
            
            game.ball.vy += 0.3;
            
            if (game.ball.y > canvas.height - 50) {
                game.ball.inAir = false;
                game.player.hasBall = true;
                incompletePass();
            }
            
            game.team.forEach(teammate => {
                if (!teammate.hasBall && !game.player.hasBall) {
                    const dx = game.ball.x - teammate.x;
                    const dy = game.ball.y - teammate.y;
                    if (Math.sqrt(dx * dx + dy * dy) < 30) {
                        teammate.hasBall = true;
                        game.ball.inAir = false;
                        game.ball.vx = 0;
                        game.ball.vy = 0;
                    }
                }
            });
        }
        
        if (game.player.hasBall) {
            const dx = game.field.endX - game.player.x;
            if (dx < 0) {
                scoreTouchdown();
            }
            
            game.opponents.forEach(op => {
                const d = Math.sqrt(Math.pow(op.x - game.player.x, 2) + Math.pow(op.y - game.player.y, 2));
                if (d < 30) {
                    tackle();
                }
            });
        }
        
        if (Math.random() < 0.02) {
            game.coins.push({
                x: Math.random() * (canvas.width - 150) + 100,
                y: Math.random() * (canvas.height - 150) + 50,
                vx: 0,
                vy: 2
            });
        }
        
        game.coins = game.coins.filter(c => {
            c.y += c.vy;
            if (c.y > canvas.height) return false;
            
            const d = Math.sqrt(Math.pow(c.x - game.player.x, 2) + Math.pow(c.y - game.player.y, 2));
            if (d < 30) {
                game.score.player += 7;
                return false;
            }
            return true;
        });
    }

    function incompletePass() {
        game.downs++;
        if (game.downs > 4) {
            turnover();
        }
    }

    function scoreTouchdown() {
        game.score.player += 7;
        game.player.touchdowns++;
        
        for (let i = 0; i < 20; i++) {
            game.particles.push({
                x: game.player.x, y: game.player.y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                color: '#ffd700',
                life: 40
            });
        }
        
        resetAfterScore();
    }

    function tackle() {
        game.player.health -= 20;
        game.player.energy -= 20;
        game.player.hasBall = false;
        
        game.ball.x = game.player.x;
        game.ball.y = game.player.y;
        game.ball.inAir = false;
        
        game.downs++;
        game.player.tackles++;
        
        if (game.downs > 4) {
            turnover();
        }
        
        if (game.player.health <= 0) {
            game.state = 'gameover';
        }
    }

    function turnover() {
        game.downs = 1;
        game.ballPosition = 200;
        game.player.x = 150;
        
        game.opponents.forEach(op => {
            op.x = 400 + Math.random() * 200;
            op.hasBall = true;
        });
        
        game.player.hasBall = false;
    }

    function resetAfterScore() {
        game.downs = 1;
        game.ballPosition = 200;
        game.player.x = 150;
        game.player.y = canvas.height / 2;
        game.player.hasBall = true;
        
        game.time = 900;
        
        game.opponents.forEach(op => {
            op.x = 400 + Math.random() * 200;
            op.y = 100 + Math.random() * (canvas.height - 200);
            op.hasBall = false;
        });
    }

    function draw() {
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 15; i++) {
            const x = 100 + i * 50;
            ctx.beginPath();
            ctx.moveTo(x, 50);
            ctx.lineTo(x, canvas.height - 50);
            ctx.stroke();
        }
        
        ctx.fillStyle = '#1e8449';
        ctx.fillRect(680, 50, 30, canvas.height - 100);
        
        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('END ZONE', 695, canvas.height / 2);
        
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(95, canvas.height / 2 - 40, 10, 80);
        
        game.team.forEach(t => t.draw());
        game.opponents.forEach(o => o.draw());
        
        if (game.player.hasBall) {
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(game.player.x + 12, game.player.y - 5, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (game.ball.inAir) {
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(game.ball.x, game.ball.y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        game.coins.forEach(c => {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 150, 120);
        
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        
        const minutes = Math.floor(game.time / 60);
        const seconds = game.time % 60;
        ctx.fillText(`Q${game.quarter} ${minutes}:${seconds.toString().padStart(2, '0')}`, 20, 35);
        
        ctx.fillStyle = '#3498db';
        ctx.fillText(`You: ${game.score.player}`, 20, 60);
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(`CPU: ${game.score.opponent}`, 20, 85);
        
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`Down: ${game.downs}`, 20, 110);
        ctx.fillText(`YTG: 10`, 100, 110);
        
        if (game.state === 'gameover') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = game.score.player > game.score.opponent ? '#2ecc71' : '#e74c3c';
            ctx.fillText(game.score.player > game.score.opponent ? 'YOU WIN!' : 'GAME OVER', canvas.width/2, canvas.height/2);
        }
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    initTeam();
    
    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    gameLoop();
})();