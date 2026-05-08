// Action Game 3 - Desert Commando
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        score: 0,
        timeLeft: 90,
        player: {
            x: 100,
            y: canvas.height - 150,
            width: 40,
            height: 60,
            health: 100,
            maxHealth: 100,
            speed: 4,
            fuel: 100,
            maxFuel: 100,
            jetpack: false,
            shield: 0,
            maxShield: 50,
            kills: 0
        },
        vehicles: [],
        enemies: [],
        bullets: [],
        missiles: [],
        explosions: [],
        terrain: [],
        currentVehicle: null,
        pickupItems: [],
        mission: 1,
        objectives: []
    };

    class Enemy {
        constructor(type) {
            this.type = type;
            this.x = Math.random() < 0.3 ? -50 : canvas.width + 50;
            this.y = 50 + Math.random() * (canvas.height - 200);
            this.width = type === 'tank' ? 60 : 40;
            this.height = type === 'tank' ? 40 : 50;
            this.health = type === 'tank' ? 150 : 40;
            this.maxHealth = this.health;
            this.speed = type === 'tank' ? 1 : 3;
            this.damage = type === 'tank' ? 25 : 10;
            this.points = type === 'tank' ? 300 : 100;
            this.shootCooldown = 0;
            this.angle = 0;
        }
        
        update() {
            if (this.health <= 0) return;
            
            const target = game.player;
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            this.angle = Math.atan2(dy, dx);
            
            if (this.type === 'tank') {
                if (Math.abs(dx) > 200 || Math.abs(dy) > 150) {
                    this.x += Math.cos(this.angle) * this.speed;
                    this.y += Math.sin(this.angle) * this.speed;
                }
                
                if (this.shootCooldown <= 0) {
                    game.missiles.push({
                        x: this.x,
                        y: this.y,
                        vx: Math.cos(this.angle) * 5,
                        vy: Math.sin(this.angle) * 5,
                        damage: this.damage,
                        isEnemy: true
                    });
                    this.shootCooldown = 120;
                }
            } else {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 150) {
                    this.x += (dx / dist) * this.speed;
                    this.y += (dy / dist) * this.speed;
                }
                
                if (this.shootCooldown <= 0 && dist < 300) {
                    game.bullets.push({
                        x: this.x,
                        y: this.y - 20,
                        vx: Math.cos(this.angle) * 8,
                        vy: Math.sin(this.angle) * 8,
                        damage: this.damage,
                        isEnemy: true
                    });
                    this.shootCooldown = 45;
                }
            }
            
            this.shootCooldown--;
        }
        
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            if (this.type === 'tank') {
                ctx.fillStyle = '#5d6d7e';
                ctx.fillRect(-30, -20, 60, 40);
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(10, -10, 35, 15);
                ctx.fillStyle = '#7f8c8d';
                ctx.beginPath();
                ctx.arc(-20, 20, 12, 0, Math.PI * 2);
                ctx.arc(0, 20, 12, 0, Math.PI * 2);
                ctx.arc(20, 20, 12, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = '#c0392b';
                ctx.fillRect(-20, -25, 40, 50);
                ctx.fillStyle = '#e74c3c';
                ctx.beginPath();
                ctx.arc(0, -35, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(-30, -20, 15, 10);
            }
            
            ctx.restore();
            
            if (this.health < this.maxHealth) {
                ctx.fillStyle = '#333';
                ctx.fillRect(this.x - 25, this.y - this.height - 10, 50, 6);
                ctx.fillStyle = '#e74c3c';
                ctx.fillRect(-24, -9, 48 * (this.health / this.maxHealth), 4);
            }
        }
    }

    class Vehicle {
        constructor(type, x, y) {
            this.type = type;
            this.x = x;
            this.y = y;
            this.width = type === 'jeep' ? 80 : 100;
            this.height = type === 'jeep' ? 40 : 50;
            this.health = type === 'jeep' ? 200 : 300;
            this.maxHealth = this.health;
            this.speed = type === 'jeep' ? 6 : 4;
            this.passengers = [];
            this.ammo = type === 'jeep' ? 100 : 50;
            this.weaponCooldown = 0;
        }
        
        update(keys) {
            if (keys.left) this.x -= this.speed;
            if (keys.right) this.x += this.speed;
            if (keys.up) this.y -= this.speed;
            if (keys.down) this.y += this.speed;
            
            this.x = Math.max(50, Math.min(canvas.width - 50, this.x));
            this.y = Math.max(100, Math.min(canvas.height - 100, this.y));
            
            this.passengers = this.passengers.filter(p => p !== null);
            
            if (keys.shoot && this.weaponCooldown <= 0 && this.ammo > 0) {
                if (this.type === 'jeep') {
                    game.bullets.push({
                        x: this.x + 40,
                        y: this.y,
                        vx: 12,
                        vy: 0,
                        damage: 15,
                        isEnemy: false,
                        fromVehicle: true
                    });
                } else {
                    game.missiles.push({
                        x: this.x + 50,
                        y: this.y,
                        vx: 8,
                        vy: -2,
                        damage: 40,
                        isEnemy: false,
                        fromVehicle: true
                    });
                }
                this.ammo--;
                this.weaponCooldown = this.type === 'jeep' ? 10 : 30;
            }
            
            this.weaponCooldown--;
        }
        
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            if (this.type === 'jeep') {
                ctx.fillStyle = '#d35400';
                ctx.fillRect(-40, -20, 80, 40);
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(-35, -30, 25, 15);
                ctx.fillRect(10, -30, 25, 15);
                ctx.fillStyle = '#1a1a1a';
                ctx.beginPath();
                ctx.arc(-25, 20, 12, 0, Math.PI * 2);
                ctx.arc(25, 20, 12, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = '#27ae60';
                ctx.fillRect(-50, -25, 100, 50);
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(-45, -35, 30, 15);
                ctx.fillRect(15, -35, 30, 15);
                ctx.fillStyle = '#f1c40f';
                ctx.fillRect(50, -10, 15, 8);
                ctx.fillStyle = '#1a1a1a';
                ctx.beginPath();
                ctx.arc(-30, 25, 15, 0, Math.PI * 2);
                ctx.arc(30, 25, 15, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
            
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - 40, this.y - this.height - 10, 80, 6);
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(-39, -9, 78 * (this.health / this.maxHealth), 4);
        }
    }

    class PickupItem {
        constructor(type, x, y) {
            this.type = type;
            this.x = x;
            this.y = y;
            this.size = 25;
            this.rotation = 0;
        }
        
        update() {
            this.rotation += 0.03;
            this.y += Math.sin(Date.now() / 300) * 0.2;
        }
        
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            
            switch(this.type) {
                case 'health':
                    ctx.fillStyle = '#e74c3c';
                    ctx.fillRect(-15, -15, 30, 30);
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(-5, -15, 10, 30);
                    ctx.fillRect(-15, -5, 30, 10);
                    break;
                case 'ammo':
                    ctx.fillStyle = '#f1c40f';
                    ctx.fillRect(-12, -18, 24, 36);
                    ctx.fillStyle = '#000';
                    ctx.font = 'bold 20px Arial';
                    ctx.fillText('A', -7, 7);
                    break;
                case 'fuel':
                    ctx.fillStyle = '#3498db';
                    ctx.fillRect(-10, -20, 20, 40);
                    ctx.fillStyle = '#2980b9';
                    ctx.fillRect(-8, -18, 16, 15);
                    break;
                case 'shield':
                    ctx.fillStyle = '#9b59b6';
                    ctx.beginPath();
                    ctx.arc(0, 0, 18, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    break;
            }
            
            ctx.restore();
        }
    }

    class Explosion {
        constructor(x, y, size) {
            this.x = x;
            this.y = y;
            this.size = size;
            this.life = 30;
            this.maxLife = 30;
            this.particles = [];
            
            for (let i = 0; i < 20; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 5;
                this.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 3 + Math.random() * 8,
                    color: Math.random() < 0.5 ? '#e74c3c' : '#f39c12'
                });
            }
        }
        
        update() {
            this.life--;
            this.particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.2;
                p.size *= 0.95;
            });
        }
        
        draw() {
            const alpha = this.life / this.maxLife;
            this.particles.forEach(p => {
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;
        }
    }

    function spawnEnemy() {
        const types = ['soldier', 'soldier', 'soldier', 'tank'];
        const type = types[Math.floor(Math.random() * types.length)];
        game.enemies.push(new Enemy(type));
    }

    function handleInput(data) {
        if (game.state !== 'playing') return;
        
        const keys = { up: false, down: false, left: false, right: false, shoot: false };
        
        if (data.tilt) {
            keys.left = data.tilt < -0.3;
            keys.right = data.tilt > 0.3;
        }
        if (data.buttons) {
            keys.up = data.buttons[0];
            keys.down = data.buttons[1];
            keys.left = keys.left || data.buttons[2];
            keys.right = keys.right || data.buttons[3];
            keys.shoot = data.buttons[4];
        }
        
        if (data.action === 'jetpack') {
            if (game.player.fuel > 0) {
                game.player.jetpack = true;
                game.player.fuel -= 0.5;
            }
        }
        
        if (game.currentVehicle) {
            game.currentVehicle.update(keys);
        } else {
            if (keys.left) game.player.x -= game.player.speed;
            if (keys.right) game.player.x += game.player.speed;
            
            if (game.player.jetpack) {
                if (keys.up) game.player.y -= 6;
                if (keys.down) game.player.y += 3;
                game.player.jetpack = false;
            } else {
                if (keys.up) game.player.y -= game.player.speed;
                if (keys.down) game.player.y += game.player.speed;
            }
            
            game.player.x = Math.max(30, Math.min(canvas.width - 30, game.player.x));
            game.player.y = Math.max(50, Math.min(canvas.height - 80, game.player.y));
            
            if (keys.shoot) {
                const angle = data.angle || 0;
                game.bullets.push({
                    x: game.player.x + Math.cos(angle) * 30,
                    y: game.player.y - 30 + Math.sin(angle) * 30,
                    vx: Math.cos(angle) * 12,
                    vy: Math.sin(angle) * 12,
                    damage: 20,
                    isEnemy: false
                });
            }
            
            if (data.special) {
                if (game.player.shield > 0) {
                    game.player.shield = 0;
                    game.player.health = game.player.maxHealth;
                }
            }
        }
    }

    function update() {
        if (game.state !== 'playing') return;
        
        game.timeLeft -= 1/60;
        if (game.timeLeft <= 0) {
            game.state = 'victory';
        }
        
        if (game.player.health <= 0) {
            game.state = 'gameover';
        }
        
        if (Math.random() < 0.02) spawnEnemy();
        
        game.enemies.forEach(e => e.update());
        
        game.bullets = game.bullets.filter(b => {
            b.x += b.vx;
            b.y += b.vy;
            
            if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) return false;
            
            if (!b.isEnemy) {
                for (let i = game.enemies.length - 1; i >= 0; i--) {
                    const e = game.enemies[i];
                    if (b.x > e.x - e.width/2 && b.x < e.x + e.width/2 &&
                        b.y > e.y - e.height && b.y < e.y) {
                        e.health -= b.damage;
                        if (e.health <= 0) {
                            game.enemies.splice(i, 1);
                            game.player.kills++;
                            game.score += e.points;
                            game.explosions.push(new Explosion(e.x, e.y, 30));
                        }
                        return false;
                    }
                }
                
                game.vehicles.forEach(v => {
                    if (b.x > v.x - v.width/2 && b.x < v.x + v.width/2 &&
                        b.y > v.y - v.height && b.y < v.y) {
                        v.health -= b.damage;
                        return false;
                    }
                });
            } else {
                if (game.currentVehicle) {
                    if (b.x > game.currentVehicle.x - game.currentVehicle.width/2 &&
                        b.x < game.currentVehicle.x + game.currentVehicle.width/2 &&
                        b.y > game.currentVehicle.y - game.currentVehicle.height &&
                        b.y < game.currentVehicle.y) {
                        game.currentVehicle.health -= b.damage;
                        return false;
                    }
                } else {
                    if (b.x > game.player.x - 20 && b.x < game.player.x + 20 &&
                        b.y > game.player.y - 30 && b.y < game.player.y + 30) {
                        const damage = b.damage;
                        if (game.player.shield > 0) {
                            game.player.shield = Math.max(0, game.player.shield - damage);
                        } else {
                            game.player.health -= damage;
                        }
                        return false;
                    }
                }
            }
            return true;
        });
        
        game.missiles = game.missiles.filter(m => {
            m.x += m.vx;
            m.y += m.vy;
            m.vy += 0.05;
            
            if (m.x < 0 || m.x > canvas.width || m.y < 0 || m.y > canvas.height) return false;
            
            let hit = false;
            
            if (!m.isEnemy) {
                for (let i = game.enemies.length - 1; i >= 0; i--) {
                    const e = game.enemies[i];
                    if (m.x > e.x - e.width/2 && m.x < e.x + e.width/2 &&
                        m.y > e.y - e.height && m.y < e.y) {
                        e.health -= m.damage;
                        if (e.health <= 0) {
                            game.enemies.splice(i, 1);
                            game.player.kills++;
                            game.score += e.points;
                        }
                        game.explosions.push(new Explosion(m.x, m.y, 50));
                        hit = true;
                        break;
                    }
                }
            } else {
                if (game.currentVehicle) {
                    if (m.x > game.currentVehicle.x - game.currentVehicle.width/2 &&
                        m.x < game.currentVehicle.x + game.currentVehicle.width/2 &&
                        m.y > game.currentVehicle.y - game.currentVehicle.height &&
                        m.y < game.currentVehicle.y) {
                        game.currentVehicle.health -= m.damage;
                        game.explosions.push(new Explosion(m.x, m.y, 50));
                        hit = true;
                    }
                } else {
                    if (m.x > game.player.x - 20 && m.x < game.player.x + 20 &&
                        m.y > game.player.y - 30 && m.y < game.player.y + 30) {
                        const damage = m.damage;
                        if (game.player.shield > 0) {
                            game.player.shield = Math.max(0, game.player.shield - damage);
                        } else {
                            game.player.health -= damage;
                        }
                        game.explosions.push(new Explosion(m.x, m.y, 50));
                        hit = true;
                    }
                }
            }
            
            return !hit;
        });
        
        game.explosions = game.explosions.filter(e => {
            e.update();
            return e.life > 0;
        });
        
        game.pickupItems.forEach(p => p.update());
        
        for (let i = game.pickupItems.length - 1; i >= 0; i--) {
            const p = game.pickupItems[i];
            const dx = p.x - game.player.x;
            const dy = p.y - game.player.y;
            if (Math.sqrt(dx*dx + dy*dy) < 40) {
                switch(p.type) {
                    case 'health':
                        game.player.health = Math.min(game.player.maxHealth, game.player.health + 30);
                        break;
                    case 'ammo':
                        game.score += 50;
                        break;
                    case 'fuel':
                        game.player.fuel = game.player.maxFuel;
                        break;
                    case 'shield':
                        game.player.shield = game.player.maxShield;
                        break;
                }
                game.pickupItems.splice(i, 1);
            }
        }
        
        game.vehicles = game.vehicles.filter(v => v.health > 0);
        
        if (game.currentVehicle && game.currentVehicle.health <= 0) {
            game.currentVehicle = null;
        }
        
        for (let i = game.vehicles.length - 1; i >= 0; i--) {
            const v = game.vehicles[i];
            const dx = v.x - game.player.x;
            const dy = v.y - game.player.y;
            if (Math.sqrt(dx*dx + dy*dy) < 60) {
                game.currentVehicle = v;
                game.vehicles.splice(i, 1);
                break;
            }
        }
        
        if (Math.random() < 0.01) {
            const types = ['health', 'ammo', 'fuel', 'shield'];
            const type = types[Math.floor(Math.random() * types.length)];
            game.pickupItems.push(new PickupItem(type, 100 + Math.random() * (canvas.width - 200), canvas.height - 150));
        }
        
        game.player.fuel = Math.min(game.player.maxFuel, game.player.fuel + 0.1);
    }

    function draw() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#e67e22');
        gradient.addColorStop(0.5, '#f39c12');
        gradient.addColorStop(1, '#d35400');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#c0392b';
        for (let i = 0; i < 20; i++) {
            const x = (i * 80 + Math.sin(i) * 20) % canvas.width;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + 20, 60);
            ctx.lineTo(x + 10, 60);
            ctx.lineTo(x - 10, 0);
            ctx.fill();
        }
        
        game.vehicles.forEach(v => v.draw());
        game.enemies.forEach(e => e.draw());
        
        if (!game.currentVehicle) {
            ctx.save();
            ctx.translate(game.player.x, game.player.y);
            
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(-20, -30, 40, 60);
            
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(0, -40, 14, 0, Math.PI * 2);
            ctx.fill();
            
            if (game.player.jetpack) {
                ctx.fillStyle = '#3498db';
                ctx.fillRect(-10, 30, 20, 20);
            }
            
            if (game.player.shield > 0) {
                ctx.strokeStyle = '#9b59b6';
                ctx.lineWidth = 3;
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.arc(0, 0, 45, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
            
            ctx.restore();
        }
        
        game.pickupItems.forEach(p => p.draw());
        
        ctx.fillStyle = '#e74c3c';
        game.bullets.forEach(b => {
            ctx.beginPath();
            ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.fillStyle = '#9b59b6';
        game.missiles.forEach(m => {
            ctx.beginPath();
            ctx.ellipse(m.x, m.y, 10, 5, Math.atan2(m.vy, m.vx), 0, Math.PI * 2);
            ctx.fill();
        });
        
        game.explosions.forEach(e => e.draw());
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 220, 130);
        
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${game.score}`, 20, 35);
        ctx.fillText(`Time: ${Math.ceil(game.timeLeft)}s`, 20, 60);
        ctx.fillText(`Kills: ${game.player.kills}`, 20, 85);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(20, 100, 150, 12);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(20, 100, 150 * (game.player.health / game.player.maxHealth), 12);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(20, 118, 150, 12);
        ctx.fillStyle = '#3498db';
        ctx.fillRect(20, 118, 150 * (game.player.fuel / game.player.maxFuel), 12);
        
        if (game.player.shield > 0) {
            ctx.fillStyle = '#9b59b6';
            ctx.fillText(`Shield: ${Math.ceil(game.player.shield)}`, 180, 35);
        }
        
        if (game.currentVehicle) {
            ctx.fillStyle = '#27ae60';
            ctx.fillText('In Vehicle', 180, 60);
        }
        
        if (game.state === 'gameover') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 60px Arial';
            ctx.fillStyle = '#e74c3c';
            ctx.textAlign = 'center';
            ctx.fillText('MISSION FAILED', canvas.width/2, canvas.height/2 - 40);
            
            ctx.font = '30px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Final Score: ${game.score}`, canvas.width/2, canvas.height/2 + 20);
        }
        
        if (game.state === 'victory') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 60px Arial';
            ctx.fillStyle = '#2ecc71';
            ctx.textAlign = 'center';
            ctx.fillText('MISSION COMPLETE', canvas.width/2, canvas.height/2 - 40);
            
            ctx.font = '30px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Final Score: ${game.score}`, canvas.width/2, canvas.height/2 + 20);
        }
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    game.vehicles.push(new Vehicle('jeep', 200, canvas.height - 120));
    game.vehicles.push(new Vehicle('tank', canvas.width - 200, canvas.height - 120));
    
    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    gameLoop();
})();