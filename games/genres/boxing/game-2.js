// Boxing Game 2 - Heavyweight Championship
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'fighting',
        round: 1,
        maxRounds: 12,
        timeInRound: 180,
        player: {
            x: 200,
            y: canvas.height / 2,
            health: 100,
            maxHealth: 100,
            stamina: 100,
            punchPower: 20,
            defense: 50,
            speed: 5,
            combo: 0,
            isPunching: false,
            punchType: null,
            isBlocking: false,
            isDodging: false,
            name: 'Champion'
        },
        opponent: {
            x: canvas.width - 200,
            y: canvas.height / 2,
            health: 100,
            maxHealth: 100,
            stamina: 100,
            punchPower: 18,
            defense: 45,
            speed: 4,
            combo: 0,
            isPunching: false,
            punchType: null,
            isBlocking: false,
            isDodging: false,
            name: 'Challenger',
            aggression: 0.7,
            pattern: 'aggressive'
        },
        fightStats: {
            punchesLanded: 0,
            punchesThrown: 0,
            accuracy: 0,
            knockdowns: 0
        },
        crowd: [],
        bell: { ringing: false, volume: 0 },
        referee: { x: canvas.width / 2, y: 80 },
        knockdown: false,
        knockout: false,
        winner: null,
        roundWinner: null,
        fightTime: 0
    };

    class Fighter {
        constructor(x, y, isPlayer) {
            this.x = x;
            this.y = y;
            this.isPlayer = isPlayer;
            this.health = 100;
            this.stamina = 100;
            this.combo = 0;
            this.action = 'idle';
            this.actionTimer = 0;
            this.punchTarget = null;
        }
        
        draw() {
            const fighter = this.isPlayer ? game.player : game.opponent;
            
            ctx.save();
            ctx.translate(this.x, this.y);
            
            const scaleX = this.isPlayer ? 1 : -1;
            ctx.scale(scaleX, 1);
            
            ctx.fillStyle = this.isPlayer ? '#e74c3c' : '#3498db';
            ctx.fillRect(-20, -60, 40, 70);
            
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(0, -75, 16, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000';
            ctx.fillRect(-8, -80, 6, 6);
            ctx.fillRect(2, -80, 6, 6);
            
            if (fighter.isPunching) {
                ctx.fillStyle = '#f1c40f';
                if (fighter.punchType === 'jab') {
                    ctx.fillRect(20, -55, 25, 8);
                } else if (fighter.punchType === 'hook') {
                    ctx.fillRect(15, -50, 20, 15);
                } else if (fighter.punchType === 'uppercut') {
                    ctx.fillRect(10, -20, 15, 20);
                }
            }
            
            if (fighter.isBlocking) {
                ctx.strokeStyle = '#3498db';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.arc(0, -40, 25, Math.PI, 0);
                ctx.stroke();
            }
            
            if (fighter.isDodging) {
                ctx.fillStyle = '#2ecc71';
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.arc(0, -20, 30, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
            
            ctx.restore();
            
            const healthPercent = fighter.health / fighter.maxHealth;
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - 30, this.y - 95, 60, 8);
            ctx.fillStyle = healthPercent > 0.3 ? '#2ecc71' : '#e74c3c';
            ctx.fillRect(this.x - 29, this.y - 94, 58 * healthPercent, 6);
            
            if (fighter.combo > 1) {
                ctx.fillStyle = '#ffd700';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${fighter.combo} COMBO!`, this.x, this.y - 110);
            }
        }
    }

    function handleInput(data) {
        if (game.state !== 'fighting') return;
        
        const p = game.player;
        
        if (data.up || data.down) {
            p.y += (data.up ? -1 : 1) * p.speed;
            p.y = Math.max(100, Math.min(canvas.height - 100, p.y));
        }
        
        if (data.left) p.x -= p.speed * 0.7;
        if (data.right) p.x += p.speed * 0.5;
        p.x = Math.max(100, Math.min(canvas.width - 150, p.x));
        
        if (data.action && !p.isPunching && p.stamina > 10) {
            const punchTypes = ['jab', 'hook', 'uppercut'];
            p.punchType = punchTypes[Math.floor(Math.random() * punchTypes.length)];
            p.isPunching = true;
            p.actionTimer = 20;
            p.stamina -= 8;
            game.fightStats.punchesThrown++;
            
            setTimeout(() => checkPunchHit(p, p.punchType), 100);
        }
        
        if (data.block) {
            p.isBlocking = true;
            p.stamina -= 0.5;
        } else {
            p.isBlocking = false;
        }
        
        if (data.dodge && !p.isDodging && p.stamina > 15) {
            p.isDodging = true;
            p.actionTimer = 15;
            p.stamina -= 15;
            
            const dodgeDir = Math.random() < 0.5 ? -30 : 30;
            p.x += dodgeDir;
            
            setTimeout(() => { p.isDodging = false; }, 500);
        }
    }

    function checkPunchHit(attacker, punchType) {
        const target = attacker === game.player ? game.opponent : game.player;
        const dx = Math.abs(attacker.x - target.x);
        const dy = Math.abs(attacker.y - target.y);
        
        let hitChance = 0.7;
        
        if (target.isBlocking) hitChance = 0.2;
        if (target.isDodging) hitChance = 0.1;
        if (dx > 80 || dy > 60) hitChance = 0;
        
        if (Math.random() < hitChance) {
            const damage = punchType === 'uppercut' ? 15 : punchType === 'hook' ? 12 : 8;
            
            target.health -= damage;
            attacker.combo++;
            
            game.fightStats.punchesLanded++;
            
            for (let i = 0; i < 8; i++) {
                game.crowd.push({
                    x: target.x, y: target.y,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    color: '#e74c3c',
                    life: 25
                });
            }
            
            if (target.health <= 0 && !game.knockout) {
                game.knockdown = true;
                setTimeout(() => {
                    if (target.health <= 0) {
                        game.knockout = true;
                        game.winner = attacker === game.player ? 'player' : 'opponent';
                        game.state = 'finished';
                    }
                }, 1000);
            }
        }
        
        attacker.isPunching = false;
        attacker.punchType = null;
    }

    function aiUpdate() {
        const ai = game.opponent;
        const p = game.player;
        
        if (game.knockdown || game.knockout) return;
        
        if (Math.random() < 0.1) {
            const distance = Math.sqrt(Math.pow(ai.x - p.x, 2) + Math.pow(ai.y - p.y, 2));
            
            if (distance > 100) {
                const dx = p.x - ai.x;
                const dy = p.y - ai.y;
                const angle = Math.atan2(dy, dx);
                ai.x += Math.cos(angle) * ai.speed;
                ai.y += Math.sin(angle) * ai.speed;
            } else {
                if (ai.stamina > 10 && !ai.isPunching && Math.random() < 0.15) {
                    ai.punchType = Math.random() < 0.5 ? 'jab' : 'hook';
                    ai.isPunching = true;
                    ai.stamina -= 8;
                    
                    setTimeout(() => checkPunchHit(ai, ai.punchType), 100);
                } else if (ai.stamina > 15 && Math.random() < 0.05) {
                    ai.isDodging = true;
                    ai.x += (Math.random() < 0.5 ? -20 : 20);
                    setTimeout(() => { ai.isDodging = false; }, 400);
                }
            }
            
            ai.y = Math.max(100, Math.min(canvas.height - 100, ai.y));
            ai.x = Math.max(180, Math.min(canvas.width - 80, ai.x));
        }
        
        if (p.isPunching && Math.random() < 0.3 && ai.stamina > 10) {
            ai.isBlocking = true;
            setTimeout(() => { ai.isBlocking = false; }, 300);
        }
    }

    function update() {
        if (game.state !== 'fighting') return;
        
        game.fightTime++;
        
        game.timeInRound -= 1/60;
        
        if (game.timeInRound <= 0) {
            endRound();
        }
        
        aiUpdate();
        
        game.player.stamina = Math.min(100, game.player.stamina + 0.1);
        game.opponent.stamina = Math.min(100, game.opponent.stamina + 0.1);
        
        if (game.player.combo > 0) {
            game.player.combo = Math.max(0, game.player.combo - 0.02);
        }
        if (game.opponent.combo > 0) {
            game.opponent.combo = Math.max(0, game.opponent.combo - 0.02);
        }
        
        game.crowd = game.crowd.filter(c => {
            c.x += c.vx;
            c.y += c.vy;
            c.vy += 0.3;
            c.life--;
            return c.life > 0;
        });
        
        if (Math.random() < 0.01) {
            game.crowd.push({
                x: Math.random() * canvas.width,
                y: 0,
                vx: (Math.random() - 0.5) * 2,
                vy: 2 + Math.random() * 2,
                color: ['#e74c3c', '#3498db', '#f1c40f', '#fff'][Math.floor(Math.random() * 4)],
                life: 60
            });
        }
        
        if (game.player.health <= 0 || game.opponent.health <= 0) {
            if (!game.knockout) {
                game.knockdown = true;
            }
        }
    }

    function endRound() {
        if (game.player.health > game.opponent.health) {
            game.roundWinner = 'player';
        } else if (game.opponent.health > game.player.health) {
            game.roundWinner = 'opponent';
        } else {
            game.roundWinner = 'draw';
        }
        
        game.round++;
        
        if (game.round > game.maxRounds) {
            if (game.player.health > game.opponent.health) {
                game.winner = 'player';
            } else if (game.opponent.health > game.player.health) {
                game.winner = 'opponent';
            } else {
                game.winner = 'draw';
            }
            game.state = 'finished';
        } else {
            game.timeInRound = 180;
            game.player.health = Math.min(100, game.player.health + 20);
            game.opponent.health = Math.min(100, game.opponent.health + 20);
            game.player.x = 200;
            game.opponent.x = canvas.width - 200;
        }
        
        if (game.winner) {
            game.state = 'finished';
        }
    }

    function draw() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(1, '#1a252f');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(50, 100, 10, canvas.height - 200);
        ctx.fillRect(canvas.width - 60, 100, 10, canvas.height - 200);
        
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(55, 90, canvas.width - 110, 20);
        
        game.crowd.forEach(c => {
            ctx.globalAlpha = c.life / 60;
            ctx.fillStyle = c.color;
            ctx.beginPath();
            ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(game.referee.x - 5, game.referee.y, 10, 20);
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(game.referee.x, game.referee.y - 5, 8, 0, Math.PI * 2);
        ctx.fill();
        
        const playerFighter = new Fighter(game.player.x, game.player.y, true);
        playerFighter.draw();
        
        const oppFighter = new Fighter(game.opponent.x, game.opponent.y, false);
        oppFighter.draw();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 180, 100);
        
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        
        const mins = Math.floor((game.maxRounds * 180 - game.fightTime) / 60);
        const secs = Math.floor((game.maxRounds * 180 - game.fightTime) % 60);
        ctx.fillText(`Round ${game.round}/${game.maxRounds}`, 20, 35);
        ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, 20, 60);
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(20, 75, 150, 12);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(20, 75, 150 * (game.player.health / game.player.maxHealth), 12);
        
        ctx.fillStyle = '#3498db';
        ctx.fillRect(20, 95, 150, 12);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(20, 95, 150 * (game.opponent.health / game.opponent.maxHealth), 12);
        
        ctx.font = '12px Arial';
        ctx.fillStyle = '#ccc';
        ctx.fillText('YOU', 20, 72);
        ctx.fillText('OPP', 20, 92);
        
        if (game.knockdown) {
            ctx.fillStyle = '#e74c3c';
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('KNOCKDOWN!', canvas.width/2, canvas.height/2 - 50);
        }
        
        if (game.state === 'finished') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = game.winner === 'player' ? '#ffd700' : game.winner === 'opponent' ? '#e74c3c' : '#95a5a6';
            ctx.fillText(game.winner === 'player' ? 'YOU WIN!' : game.winner === 'opponent' ? 'KO!' : 'DRAW', canvas.width/2, canvas.height/2);
            
            ctx.font = '25px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Punches: ${game.fightStats.punchesLanded}/${game.fightStats.punchesThrown}`, canvas.width/2, canvas.height/2 + 50);
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