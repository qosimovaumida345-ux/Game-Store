// War Game 2 - Modern Tactics
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        money: 500,
        score: 0,
        wave: 1,
        player: {
            x: canvas.width / 2,
            y: canvas.height - 100,
            health: 100,
            maxHealth: 100,
            unit: 'soldier',
            units: [],
            selectedUnit: null
        },
        enemies: [],
        bullets: [],
        particles: [],
        map: [],
        cover: [],
        objectives: [],
        gameTime: 0
    };

    class Unit {
        constructor(x, y, type, team) {
            this.x = x;
            this.y = y;
            this.type = type;
            this.team = team;
            
            const stats = {
                soldier: { health: 50, damage: 10, range: 150, speed: 2, cost: 50 },
                tank: { health: 150, damage: 25, range: 100, speed: 1, cost: 150 },
                medic: { health: 40, damage: 5, range: 80, speed: 2.5, cost: 75 },
                sniper: { health: 30, damage: 40, range: 250, speed: 1.5, cost: 100 }
            };
            
            const s = stats[type];
            this.health = s.health;
            this.maxHealth = s.health;
            this.damage = s.damage;
            this.range = s.range;
            this.speed = s.speed;
            this.cost = s.cost;
            
            this.target = null;
            this.state = 'idle';
            this.attackCooldown = 0;
        }
        
        update() {
            if (this.health <= 0) return;
            if (this.attackCooldown > 0) this.attackCooldown--;
            
            const enemies = this.team === 'player' ? game.enemies : game.player.units;
            let nearestEnemy = null;
            let nearestDist = Infinity;
            
            enemies.forEach(e => {
                if (e.health <= 0) return;
                const dx = e.x - this.x;
                const dy = e.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestEnemy = e;
                }
            });
            
            this.target = nearestEnemy;
            
            if (this.target) {
                if (nearestDist > this.range) {
                    const dx = this.target.x - this.x;
                    const dy = this.target.y - this.y;
                    this.x += (dx / nearestDist) * this.speed;
                    this.y += (dy / nearestDist) * this.speed;
                    this.state = 'moving';
                } else {
                    this.state = 'attacking';
                    if (this.attackCooldown <= 0) {
                        game.bullets.push({
                            x: this.x,
                            y: this.y - 15,
                            targetX: this.target.x,
                            targetY: this.target.y - 15,
                            damage: this.damage,
                            team: this.team
                        });
                        this.attackCooldown = 40;
                    }
                }
            }
            
            this.x = Math.max(30, Math.min(canvas.width - 30, this.x));
            this.y = Math.max(80, Math.min(canvas.height - 50, this.y));
        }
        
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            const colors = this.team === 'player' ? 
                { soldier: '#3498db', tank: '#2ecc71', medic: '#e74c3c', sniper: '#9b59b6' } :
                { soldier: '#e67e22', tank: '#c0392b', medic: '#f39c12', sniper: '#8e44ad' };
            
            ctx.fillStyle = colors[this.type];
            
            if (this.type === 'tank') {
                ctx.fillRect(-20, -15, 40, 30);
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(10, -10, 25, 15);
            } else if (this.type === 'medic') {
                ctx.fillRect(-12, -20, 24, 40);
                ctx.fillStyle = '#fff';
                ctx.fillRect(-8, -15, 16, 8);
            } else if (this.type === 'sniper') {
                ctx.fillRect(-10, -25, 20, 50);
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(5, -20, 25, 4);
            } else {
                ctx.fillRect(-10, -20, 20, 40);
            }
            
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(0, -30, 8, 0, Math.PI * 2);
            ctx.fill();
            
            if (this.target) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(0, 0, this.range, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            ctx.restore();
            
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - 15, this.y - 35, 30, 5);
            ctx.fillStyle = this.team === 'player' ? '#2ecc71' : '#e74c3c';
            ctx.fillRect(-14, -34, 28 * (this.health / this.maxHealth), 3);
        }
    }

    function handleInput(data) {
        if (game.state !== 'playing') return;
        
        if (data.tap) {
            game.player.units.forEach(u => {
                const dx = u.x - data.x;
                const dy = u.y - data.y;
                if (Math.sqrt(dx * dx + dy * dy) < 30) {
                    game.player.selectedUnit = u;
                }
            });
        }
        
        if (data.action && game.player.selectedUnit) {
            game.player.selectedUnit.targetX = data.x;
            game.player.selectedUnit.targetY = data.y;
        }
        
        const unitTypes = ['soldier', 'tank', 'medic', 'sniper'];
        if (data.buttons) {
            unitTypes.forEach((type, i) => {
                if (data.buttons[i] && game.money >= Unit.prototype.cost) {
                    const u = new Unit(100 + game.player.units.length * 50, canvas.height - 60, type, 'player');
                    game.player.units.push(u);
                    game.money -= u.cost;
                }
            });
        }
    }

    function update() {
        if (game.state !== 'playing') return;
        
        game.gameTime += 1/60;
        
        if (Math.random() < 0.01 * game.wave && game.enemies.length < 5 + game.wave) {
            const types = ['soldier', 'soldier', 'tank'];
            const type = types[Math.floor(Math.random() * types.length)];
            game.enemies.push(new Unit(canvas.width - 100, 100 + Math.random() * 300, type, 'enemy'));
        }
        
        game.player.units.forEach(u => u.update());
        game.enemies.forEach(e => e.update());
        
        game.bullets = game.bullets.filter(b => {
            const dx = b.targetX - b.x;
            const dy = b.targetY - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 10) {
                const targets = b.team === 'player' ? game.enemies : game.player.units;
                targets.forEach(t => {
                    const tdx = t.x - b.x;
                    const tdy = t.y - b.y;
                    if (Math.sqrt(tdx * tdx + tdy * tdy) < 30) {
                        t.health -= b.damage;
                        if (t.health <= 0 && b.team === 'player') {
                            game.score += 50;
                            game.money += 25;
                        }
                    }
                });
                return false;
            }
            
            b.x += (dx / dist) * 15;
            b.y += (dy / dist) * 15;
            return true;
        });
        
        game.player.units = game.player.units.filter(u => u.health > 0);
        game.enemies = game.enemies.filter(e => e.health > 0);
        
        if (game.enemies.length === 0) {
            game.wave++;
            game.money += 100;
        }
    }

    function draw() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#3d3d3d');
        gradient.addColorStop(1, '#2c2c2c');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#555';
        for (let i = 0; i < 20; i++) {
            const x = (i * 60) % canvas.width;
            ctx.fillRect(x, 0, 2, canvas.height);
        }
        
        game.player.units.forEach(u => u.draw());
        game.enemies.forEach(e => e.draw());
        
        ctx.fillStyle = '#000';
        game.bullets.forEach(b => {
            ctx.beginPath();
            ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 160, 100);
        
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(`Wave: ${game.wave}`, 20, 35);
        ctx.fillText(`Score: ${game.score}`, 20, 58);
        
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`$${game.money}`, 20, 81);
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(`Units: ${game.player.units.length}`, 20, 104);
        
        if (game.player.units.length === 0 && game.enemies.length > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = '#e74c3c';
            ctx.textAlign = 'center';
            ctx.fillText('DEFEAT', canvas.width/2, canvas.height/2);
        }
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    game.player.units.push(new Unit(150, canvas.height - 80, 'soldier', 'player'));
    
    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    gameLoop();
})();