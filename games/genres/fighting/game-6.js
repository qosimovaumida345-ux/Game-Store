// Fighting Game 6 - Street Combat Pro
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        round: 1,
        player1: {
            x: 150,
            y: canvas.height - 100,
            width: 50,
            height: 80,
            health: 100,
            maxHealth: 100,
            energy: 100,
            state: 'idle',
            direction: 1,
            attackFrame: 0,
            blockFrame: 0,
            hitStun: 0,
            combo: 0,
            score: 0
        },
        player2: {
            x: canvas.width - 150,
            y: canvas.height - 100,
            width: 50,
            height: 80,
            health: 100,
            maxHealth: 100,
            energy: 100,
            state: 'idle',
            direction: -1,
            attackFrame: 0,
            blockFrame: 0,
            hitStun: 0,
            combo: 0,
            score: 0,
            ai: true
        },
        timer: 99,
        particles: [],
        effects: [],
        announcer: null,
        winner: null,
        roundOver: false
    };

    function handleInput(data) {
        if (game.state !== 'playing' || game.roundOver) return;
        
        const p1 = game.player1;
        
        if (data.left) {
            p1.x -= 5;
            p1.state = 'walking';
        }
        if (data.right) {
            p1.x += 5;
            p1.state = 'walking';
        }
        
        if (!data.left && !data.right) {
            p1.state = 'idle';
        }
        
        p1.x = Math.max(50, Math.min(canvas.width - 50, p1.x));
        
        const p2 = game.player2;
        p1.direction = p2.x > p1.x ? 1 : -1;
        
        if (data.action && p1.attackFrame === 0 && p1.hitStun === 0) {
            p1.state = 'punch';
            p1.attackFrame = 15;
            
            const dx = p2.x - p1.x;
            const dy = Math.abs(p2.y - p1.y);
            if (Math.abs(dx) < 80 && dy < 60) {
                if (p2.blockFrame > 0) {
                    p2.energy -= 10;
                    createEffect(p2.x, p2.y, 'block');
                } else {
                    const damage = 8 + p1.combo * 2;
                    p2.health -= damage;
                    p2.hitStun = 20;
                    p1.combo++;
                    p1.score += 10 * p1.combo;
                    createParticles(p2.x, p2.y, '#e74c3c', 8);
                    
                    if (p1.combo >= 3) {
                        p1.energy = Math.min(100, p1.energy + 20);
                    }
                }
            }
        }
        
        if (data.special && p1.energy >= 30 && p1.attackFrame === 0) {
            p1.state = 'special';
            p1.attackFrame = 30;
            p1.energy -= 30;
            
            setTimeout(() => {
                if (Math.abs(p2.x - p1.x) < 150) {
                    p2.health -= 25;
                    p2.hitStun = 30;
                    createEffect(p2.x, p2.y, 'special');
                    createParticles(p2.x, p2.y, '#f1c40f', 15);
                }
            }, 300);
        }
        
        if (data.block) {
            p1.blockFrame = 10;
        }
    }

    function aiUpdate() {
        const p1 = game.player1;
        const p2 = game.player2;
        
        if (p2.hitStun > 0) {
            p2.hitStun--;
            return;
        }
        
        const dx = p1.x - p2.x;
        
        if (Math.abs(dx) > 70) {
            p2.x += (dx > 0 ? 1 : -1) * 3;
            p2.state = 'walking';
        } else {
            p2.state = 'idle';
            
            if (Math.random() < 0.05 && p2.attackFrame === 0) {
                p2.state = 'punch';
                p2.attackFrame = 15;
                
                if (Math.abs(dx) < 80) {
                    if (p1.blockFrame > 0) {
                        p1.energy -= 5;
                    } else {
                        p1.health -= 6 + p2.combo;
                        p1.hitStun = 15;
                        p2.combo++;
                        createParticles(p1.x, p1.y, '#3498db', 5);
                    }
                }
            }
            
            if (Math.random() < 0.02 && p2.energy >= 25) {
                p2.state = 'special';
                p2.attackFrame = 25;
                p2.energy -= 25;
                
                setTimeout(() => {
                    if (Math.abs(dx) < 150) {
                        p1.health -= 20;
                        p1.hitStun = 25;
                        createEffect(p1.x, p1.y, 'special');
                    }
                }, 250);
            }
            
            if (p1.attackFrame > 10 && Math.random() < 0.3) {
                p2.blockFrame = 8;
            }
        }
        
        p2.x = Math.max(50, Math.min(canvas.width - 50, p2.x));
        p2.direction = dx > 0 ? -1 : 1;
        
        if (p2.blockFrame > 0) p2.blockFrame--;
    }

    function createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            game.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 2,
                color: color,
                life: 25,
                size: 4 + Math.random() * 4
            });
        }
    }

    function createEffect(x, y, type) {
        game.effects.push({
            x: x, y: y,
            type: type,
            life: type === 'special' ? 30 : 15
        });
    }

    function update() {
        if (game.state !== 'playing') return;
        
        game.timer -= 1/60;
        
        if (game.timer <= 0) {
            game.state = 'roundover';
            game.winner = game.player1.health > game.player2.health ? 1 : 2;
            return;
        }
        
        if (game.player1.health <= 0 || game.player2.health <= 0) {
            game.state = 'roundover';
            game.winner = game.player1.health > 0 ? 1 : 2;
            return;
        }
        
        if (game.player1.attackFrame > 0) {
            game.player1.attackFrame--;
            if (game.player1.attackFrame === 0) {
                game.player1.state = 'idle';
                if (game.player1.combo > 0) game.player1.combo = 0;
            }
        }
        
        if (game.player2.attackFrame > 0) {
            game.player2.attackFrame--;
            if (game.player2.attackFrame === 0) {
                game.player2.state = 'idle';
                if (game.player2.combo > 0) game.player2.combo = 0;
            }
        }
        
        if (game.player1.blockFrame > 0) game.player1.blockFrame--;
        if (game.player2.blockFrame > 0) game.player2.blockFrame--;
        
        aiUpdate();
        
        game.particles = game.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life--;
            return p.life > 0;
        });
        
        game.effects = game.effects.filter(e => {
            e.life--;
            return e.life > 0;
        });
        
        game.player1.energy = Math.min(100, game.player1.energy + 0.1);
        game.player2.energy = Math.min(100, game.player2.energy + 0.1);
    }

    function drawCharacter(p, color) {
        ctx.save();
        ctx.translate(p.x, p.y);
        
        if (p.direction === -1) ctx.scale(-1, 1);
        
        if (p.hitStun > 0) {
            ctx.globalAlpha = 0.7;
        }
        
        ctx.fillStyle = p.blockFrame > 0 ? '#3498db' : color;
        ctx.fillRect(-20, -40, 40, 80);
        
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(0, -50, 14, 0, Math.PI * 2);
        ctx.fill();
        
        if (p.state === 'punch') {
            ctx.fillStyle = color;
            ctx.fillRect(20, -30, 30, 12);
        }
        
        if (p.state === 'special') {
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(30, 0, 20, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        
        const healthWidth = 80;
        ctx.fillStyle = '#333';
        ctx.fillRect(p.x - healthWidth/2, p.y - 70, healthWidth, 8);
        ctx.fillStyle = p === game.player1 ? '#2ecc71' : '#e74c3c';
        ctx.fillRect(p.x - healthWidth/2, p.y - 70, healthWidth * (p.health / p.maxHealth), 8);
        
        if (p.combo > 1) {
            ctx.fillStyle = '#f1c40f';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${p.combo} HIT!`, p.x, p.y - 80);
        }
    }

    function draw() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(1, '#1a252f');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#34495e';
        ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
        
        game.particles.forEach(p => {
            ctx.globalAlpha = p.life / 25;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        game.effects.forEach(e => {
            ctx.globalAlpha = e.life / 30;
            if (e.type === 'special') {
                ctx.fillStyle = '#f1c40f';
                ctx.beginPath();
                ctx.arc(e.x, e.y, 40, 0, Math.PI * 2);
                ctx.fill();
            } else if (e.type === 'block') {
                ctx.strokeStyle = '#3498db';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(e.x, e.y, 30, 0, Math.PI * 2);
                ctx.stroke();
            }
        });
        ctx.globalAlpha = 1;
        
        drawCharacter(game.player1, '#e74c3c');
        drawCharacter(game.player2, '#3498db');
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 120, 80);
        ctx.fillRect(canvas.width - 130, 10, 120, 80);
        
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText('P1', 20, 30);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(20, 40, 100, 10);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(20, 40, 100 * (game.player1.health / game.player1.maxHealth), 10);
        
        ctx.fillStyle = '#3498db';
        ctx.fillRect(20, 58, 100 * (game.player1.energy / 100), 8);
        
        ctx.textAlign = 'right';
        ctx.fillText('P2', canvas.width - 20, 30);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(canvas.width - 120, 40, 100, 10);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(canvas.width - 120, 40, 100 * (game.player2.health / game.player2.maxHealth), 10);
        
        ctx.fillStyle = '#3498db';
        ctx.fillRect(canvas.width - 120, 58, 100 * (game.player2.energy / 100), 8);
        
        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = '#f1c40f';
        ctx.textAlign = 'center';
        ctx.fillText(Math.ceil(game.timer), canvas.width/2, 50);
        
        ctx.font = 'bold 30px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText(`ROUND ${game.round}`, canvas.width/2, 90);
        
        if (game.state === 'roundover') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 60px Arial';
            ctx.fillStyle = game.winner === 1 ? '#2ecc71' : '#e74c3c';
            ctx.fillText(`P${game.winner} WINS!`, canvas.width/2, canvas.height/2);
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