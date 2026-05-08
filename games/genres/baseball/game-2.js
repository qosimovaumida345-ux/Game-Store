// Baseball Game 2 - Home Run Derby
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        player: {
            x: 150,
            y: canvas.height / 2,
            hits: 0,
            homers: 0,
            totalBases: 0,
            strikeouts: 0,
            pitchCount: 0,
            contact: 70,
            power: 50
        },
        pitcher: {
            x: canvas.width - 150,
            y: 150,
            speed: 5,
            location: 0,
            type: 'fastball'
        },
        ball: {
            x: canvas.width - 150,
            y: 150,
            vx: 0,
            vy: 0,
            spin: 0,
            hit: false
        },
        field: {
            homePlate: { x: 150, y: canvas.height / 2 },
            outfield: canvas.height / 2 - 200
        },
        score: 0,
        inning: 1,
        outs: 0,
        bases: [false, false, false],
        pitches: [],
        ballHistory: [],
        cameraX: 0,
        flyBall: false,
        ballPosition: 0
    };

    const PITCH_TYPES = [
        { name: 'fastball', speed: 12, movement: 0, probability: 0.4 },
        { name: 'curveball', speed: 9, movement: 2, probability: 0.25 },
        { name: 'slider', speed: 10, movement: 1.5, probability: 0.2 },
        { name: 'changeup', speed: 7, movement: 0, probability: 0.15 }
    ];

    function handleInput(data) {
        if (game.state !== 'playing') return;
        
        if (data.action && !game.ball.hit && game.ball.vx === 0) {
            pitchBall();
        }
        
        if (data.special && game.ball.hit) {
            game.player.power = Math.min(100, game.player.power + 10);
        }
        
        if (data.tap && !game.ball.hit) {
            const swingQuality = Math.random() * 100;
            
            if (swingQuality < game.player.contact) {
                hitBall(swingQuality);
            } else {
                strike();
            }
        }
    }

    function pitchBall() {
        const pitchType = PITCH_TYPES[Math.floor(Math.random() * PITCH_TYPES.length)];
        game.pitcher.type = pitchType.name;
        
        const targetY = 150 + Math.random() * (canvas.height - 300);
        
        const dx = game.field.homePlate.x - game.pitcher.x;
        const dy = targetY - game.pitcher.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        game.ball.vx = -(dx / dist) * pitchType.speed;
        game.ball.vy = (dy / dist) * pitchType.speed * 0.3;
        game.ball.spin = pitchType.movement;
        
        game.player.pitchCount++;
    }

    function hitBall(quality) {
        game.ball.hit = true;
        
        const power = (game.player.power + quality) / 2;
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
        
        const hitSpeed = 8 + (power / 100) * 12;
        
        game.ball.vx = Math.cos(angle) * hitSpeed;
        game.ball.vy = Math.sin(angle) * hitSpeed;
        
        game.player.hits++;
        
        const distance = Math.sqrt(game.ball.vx * game.ball.vx + game.ball.vy * game.ball.vy);
        
        if (distance > 15) {
            game.player.homers++;
            game.score += 4;
            game.player.totalBases += 4;
            
            for (let i = 0; i < 30; i++) {
                game.pitches.push({
                    x: game.ball.x, y: game.ball.y,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    color: '#ffd700',
                    life: 40
                });
            }
        } else if (distance > 10) {
            game.score += 2;
            game.player.totalBases += 2;
        } else if (distance > 7) {
            game.score += 1;
            game.player.totalBases += 1;
        } else {
            const bases = Math.floor(Math.random() * 3) + 1;
            game.score += bases;
            game.player.totalBases += bases;
        }
        
        game.flyBall = true;
    }

    function strike() {
        game.player.strikeouts++;
        game.outs++;
        
        game.pitches.push({
            x: game.ball.x, y: game.ball.y,
            vx: 0, vy: 0,
            color: '#e74c3c',
            life: 30
        });
        
        if (game.outs >= 3) {
            game.inning++;
            game.outs = 0;
            game.bases = [false, false, false];
        }
        
        resetBall();
    }

    function resetBall() {
        game.ball.x = game.pitcher.x;
        game.ball.y = game.pitcher.y;
        game.ball.vx = 0;
        game.ball.vy = 0;
        game.ball.hit = false;
        game.ball.spin = 0;
    }

    function update() {
        if (game.state !== 'playing') return;
        
        if (game.ball.vx !== 0 || game.ball.vy !== 0) {
            game.ball.x += game.ball.vx;
            game.ball.y += game.ball.vy;
            
            if (game.ball.hit) {
                game.ball.vy += 0.15;
            }
            
            const dist = Math.sqrt(game.ball.vx * game.ball.vx + game.ball.vy * game.ball.vy);
            game.ball.vx *= 0.99;
            game.ball.vy *= 0.99;
            
            if (game.ball.hit) {
                const maxDist = Math.sqrt(Math.pow(canvas.width, 2) + Math.pow(canvas.height, 2));
                const travelDist = Math.sqrt(Math.pow(game.ball.x - game.field.homePlate.x, 2) + Math.pow(game.ball.y - game.field.homePlate.y, 2));
                
                if (travelDist > 400) {
                    game.flyBall = false;
                    if (travelDist > 600) {
                        game.score += 4;
                        game.player.homers++;
                    } else if (travelDist > 400) {
                        game.score += 2;
                    }
                    
                    setTimeout(resetBall, 1000);
                }
            } else {
                if (Math.abs(game.ball.x - game.field.homePlate.x) < 20 && Math.abs(game.ball.y - game.field.homePlate.y) < 30) {
                    const swingQuality = Math.random() * 100;
                    
                    if (swingQuality < game.player.contact) {
                        hitBall(swingQuality);
                    } else {
                        strike();
                    }
                }
                
                if (game.ball.x < 50 || game.ball.y < 50 || game.ball.y > canvas.height - 50) {
                    if (!game.ball.hit) {
                        strike();
                    }
                }
            }
            
            if (dist < 0.5 && game.ball.hit) {
                game.ball.vx = 0;
                game.ball.vy = 0;
                
                setTimeout(resetBall, 1000);
            }
        }
        
        game.pitcher.y = 150 + Math.sin(Date.now() / 1000) * 50;
        
        game.pitches = game.pitches.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life--;
            return p.life > 0;
        });
        
        game.player.power = Math.min(100, game.player.power + 0.05);
    }

    function draw() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87ceeb');
        gradient.addColorStop(0.5, '#32cd32');
        gradient.addColorStop(1, '#228b22');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#deb887';
        
        ctx.beginPath();
        ctx.moveTo(50, canvas.height / 2);
        ctx.lineTo(150, canvas.height / 2 + 30);
        ctx.lineTo(150, canvas.height / 2 - 30);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(50, canvas.height / 2 - 100);
        ctx.lineTo(50, canvas.height / 2 + 100);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(50 + 90, canvas.height / 2 - 50);
        ctx.lineTo(50 + 90, canvas.height / 2 + 50);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(150, canvas.height / 2, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(80, canvas.height / 2 - 30, 30, 60);
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(115, canvas.height / 2 - 20, 30, 40);
        ctx.fillRect(115, canvas.height / 2 + 15, 30, 5);
        
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(game.pitcher.x, game.pitcher.y, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(game.ball.x, game.ball.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        game.pitches.forEach(p => {
            ctx.globalAlpha = p.life / 40;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 160, 120);
        
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`Score: ${game.score}`, 20, 35);
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(`HR: ${game.player.homers}`, 20, 58);
        
        ctx.fillStyle = '#3498db';
        ctx.fillText(`Hits: ${game.player.hits}`, 20, 81);
        
        ctx.fillStyle = '#2ecc71';
        ctx.fillText(`Power: ${Math.floor(game.player.power)}%`, 20, 104);
        
        ctx.fillStyle = '#95a5a6';
        ctx.fillText(`Inning: ${game.inning}`, 100, 35);
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(`Outs: ${game.outs}`, 100, 58);
        
        if (game.state === 'gameover') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = '#ffd700';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
            
            ctx.font = '30px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Final Score: ${game.score}`, canvas.width/2, canvas.height/2 + 50);
            ctx.fillText(`Home Runs: ${game.player.homers}`, canvas.width/2, canvas.height/2 + 85);
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