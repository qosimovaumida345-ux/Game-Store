// Action Game 2 - Urban Warfare
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        score: 0,
        wave: 1,
        waveTimer: 30,
        players: [],
        enemies: [],
        bullets: [],
        grenades: [],
        coverObjects: [],
        particles: [],
        totalEnemiesSpawned: 0,
        enemiesPerWave: 10,
        enemiesKilled: 0
    };

    class Player {
        constructor(id, x) {
            this.id = id;
            this.x = x;
            this.y = canvas.height - 80;
            this.width = 30;
            this.height = 50;
            this.health = 100;
            this.maxHealth = 100;
            this.angle = 0;
            this.sprinting = false;
            this.reloading = 0;
            this.ammo = 30;
            this.maxAmmo = 30;
            this.cover = null;
            this.kills = 0;
            this.headshots = 0;
        }
        
        update(keys) {
            if (this.health <= 0) return;
            
            if (this.reloading > 0) this.reloading--;
            
            let dx = 0, dy = 0;
            if (keys.up) dy = -1;
            if (keys.down) dy = 1;
            if (keys.left) dx = -1;
            if (keys.right) dx = 1;
            
            if (dx !== 0 || dy !== 0) {
                const speed = this.sprinting ? 5 : 3;
                this.x += dx * speed;
                this.y += dy * speed;
                
                this.x = Math.max(50, Math.min(canvas.width - 50, this.x));
                this.y = Math.max(100, Math.min(canvas.height - 100, this.y));
            }
            
            if (this.cover) {
                this.health = Math.min(this.maxHealth, this.health + 0.1);
            }
        }
        
        draw() {
            if (this.health <= 0) {
                ctx.globalAlpha = 0.3;
            }
            
            ctx.save();
            ctx.translate(this.x, this.y);
            
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(-15, -25, 30, 50);
            
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(0, -35, 12, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(-12, -25, 24, 8);
            
            ctx.fillStyle = '#3498db';
            const gunLength = this.sprinting ? 25 : 15;
            ctx.fillRect(10, -15, gunLength, 6);
            
            if (this.cover) {
                ctx.strokeStyle = '#2ecc71';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, 30, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            ctx.restore();
            
            if (this.health > 0) {
                ctx.fillStyle = '#333';
                ctx.fillRect(this.x - 25, this.y + 30, 50, 8);
                ctx.fillStyle = '#2ecc71';
                ctx.fillRect(this.x - 24, this.y + 31, 48 * (this.health / this.maxHealth), 6);
            }
            
            ctx.globalAlpha = 1;
        }
    }

    class Enemy {
        constructor(type) {
            this.x = Math.random() < 0.5 ? -20 : canvas.width + 20;
            this.y = 100 + Math.random() * (canvas.height - 200);
            this.type = type;
            this.width = 30;
            this.height = 50;
            this.health = 50 + type * 30;
            this.maxHealth = this.health;
            this.speed = 1 + type * 0.5;
            this.damage = 10 + type * 5;
            this.accuracy = 0.3 + type * 0.15;
            this.shootCooldown = 0;
            this.state = 'advancing';
            this.targetPlayer = null;
            this.headshotHeight = -35;
            this.crouching = false;
        }
        
        update(players) {
            if (this.health <= 0) return;
            
            this.shootCooldown--;
            
            const alivePlayers = players.filter(p => p.health > 0);
            if (alivePlayers.length > 0 && !this.targetPlayer) {
                this.targetPlayer = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
            }
            
            if (this.targetPlayer && this.targetPlayer.health <= 0) {
                this.targetPlayer = null;
                return;
            }
            
            if (this.targetPlayer) {
                const dx = this.targetPlayer.x - this.x;
                const dy = this.targetPlayer.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 200) {
                    this.x += (dx / dist) * this.speed;
                    this.y += (dy / dist) * this.speed;
                    this.state = 'advancing';
                } else if (dist > 100) {
                    this.state = 'positioning';
                    if (Math.random() < 0.02) {
                        this.crouching = !this.crouching;
                    }
                } else {
                    this.state = 'attacking';
                    
                    if (this.shootCooldown <= 0 && Math.random() < this.accuracy) {
                        const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.3;
                        game.bullets.push({
                            x: this.x,
                            y: this.y - (this.crouching ? 15 : 25),
                            vx: Math.cos(angle) * 8,
                            vy: Math.sin(angle) * 8,
                            damage: this.damage,
                            isEnemy: true,
                            owner: this
                        });
                        this.shootCooldown = 60;
                    }
                }
            }
        }
        
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            const bodyHeight = this.crouching ? 30 : 50;
            const bodyY = this.crouching ? -15 : -25;
            
            const hue = (this.type * 60) % 360;
            ctx.fillStyle = `hsl(${hue}, 60%, 30%)`;
            ctx.fillRect(-15, bodyY, 30, bodyHeight);
            
            ctx.fillStyle = '#000';
            const headY = this.crouching ? -20 : -35;
            ctx.beginPath();
            ctx.arc(0, headY, 10, 0, Math.PI * 2);
            ctx.fill();
            
            if (this.state === 'attacking') {
                ctx.fillStyle = '#555';
                ctx.fillRect(5, -20, 15, 5);
            }
            
            ctx.fillStyle = '#333';
            ctx.fillRect(-15, bodyY + bodyHeight + 5, 30, 6);
            ctx.fillStyle = '#2c2c2c';
            ctx.fillRect(-15, bodyY + bodyHeight + 10, 30, 6);
            
            ctx.restore();
            
            if (this.health < this.maxHealth) {
                ctx.fillStyle = '#333';
                ctx.fillRect(this.x - 20, this.y - 50, 40, 6);
                ctx.fillStyle = '#e74c3c';
                ctx.fillRect(-19, -49, 38 * (this.health / this.maxHealth), 4);
            }
        }
        
        getHeadshotBox() {
            return {
                x: this.x - 10,
                y: this.y - 45,
                width: 20,
                height: 20
            };
        }
    }

    class CoverObject {
        constructor(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.health = 100;
            this.maxHealth = 100;
            this.destructible = true;
        }
        
        draw() {
            ctx.fillStyle = this.health > 50 ? '#7f8c8d' : '#5d6d7e';
            ctx.fillRect(this.x - this.width/2, this.y - this.height, this.width, this.height);
            
            ctx.fillStyle = '#95a5a6';
            ctx.fillRect(this.x - this.width/2 + 5, this.y - this.height + 5, this.width - 10, 10);
            
            if (this.destructible && this.health < this.maxHealth) {
                ctx.fillStyle = '#333';
                ctx.fillRect(this.x - this.width/2, this.y - this.height - 10, this.width, 5);
                ctx.fillStyle = '#e67e22';
                ctx.fillRect(this.x - this.width/2, this.y - this.height - 10, this.width * (this.health / this.maxHealth), 5);
            }
        }
    }

    function spawnWave() {
        game.wave++;
        game.waveTimer = 30;
        game.enemiesPerWave += 5;
        game.totalEnemiesSpawned = 0;
        
        for (let i = 0; i < 3; i++) {
            game.coverObjects.push(new CoverObject(
                100 + i * 200 + Math.random() * 50,
                canvas.height - 150,
                60 + Math.random() * 40,
                40 + Math.random() * 30
            ));
        }
    }

    function handleInput(data) {
        if (game.state !== 'playing') return;
        
        const player = game.players[0];
        if (!player || player.health <= 0) return;
        
        const keys = { up: false, down: false, left: false, right: false };
        if (data.tilt) {
            keys.left = data.tilt < -0.3;
            keys.right = data.tilt > 0.3;
            keys.up = data.tiltY < -0.3;
            keys.down = data.tiltY > 0.3;
        }
        if (data.buttons) {
            keys.up = keys.up || data.buttons[0];
            keys.down = keys.down || data.buttons[1];
            keys.left = keys.left || data.buttons[2];
            keys.right = keys.right || data.buttons[3];
        }
        
        player.sprinting = data.sprint || false;
        
        player.update(keys);
        
        if (data.shoot && player.reloading <= 0 && player.ammo > 0) {
            const angle = data.angle || 0;
            game.bullets.push({
                x: player.x + Math.cos(angle) * 30,
                y: player.y - 15 + Math.sin(angle) * 30,
                vx: Math.cos(angle) * 15,
                vy: Math.sin(angle) * 15,
                damage: 20,
                isEnemy: false,
                owner: player
            });
            player.ammo--;
            if (player.ammo <= 0) {
                player.reloading = 120;
                player.ammo = player.maxAmmo;
            }
        }
        
        if (data.grenade) {
            const angle = data.angle || 0;
            game.grenades.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(angle) * 5,
                vy: -8,
                timer: 60
            });
        }
        
        game.coverObjects.forEach(cover => {
            const dx = player.x - cover.x;
            const dy = player.y - (cover.y - cover.height/2);
            if (Math.abs(dx) < 50 && Math.abs(dy) < 50) {
                player.cover = cover;
            }
        });
        if (!game.coverObjects.some(c => {
            const dx = player.x - c.x;
            const dy = player.y - (c.y - c.height/2);
            return Math.abs(dx) < 50 && Math.abs(dy) < 50;
        })) {
            player.cover = null;
        }
    }

    function update() {
        if (game.state !== 'playing') return;
        
        game.players.forEach(p => {
            if (p.health <= 0) {
                p.health = Math.max(0, p.health);
            }
        });
        
        const alivePlayers = game.players.filter(p => p.health > 0);
        if (alivePlayers.length === 0) {
            game.state = 'gameover';
            return;
        }
        
        if (game.totalEnemiesSpawned < game.enemiesPerWave && Math.random() < 0.03) {
            const type = Math.min(5, Math.floor(game.wave / 3));
            game.enemies.push(new Enemy(type));
            game.totalEnemiesSpawned++;
        }
        
        if (game.enemies.length === 0 && game.totalEnemiesSpawned >= game.enemiesPerWave) {
            spawnWave();
        }
        
        game.enemies.forEach(e => e.update(game.players));
        
        for (let i = game.bullets.length - 1; i >= 0; i--) {
            const b = game.bullets[i];
            b.x += b.vx;
            b.y += b.vy;
            
            if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
                game.bullets.splice(i, 1);
                continue;
            }
            
            if (!b.isEnemy) {
                for (let j = game.enemies.length - 1; j >= 0; j--) {
                    const e = game.enemies[j];
                    if (e.health <= 0) continue;
                    
                    const headBox = e.getHeadshotBox();
                    if (b.x > headBox.x && b.x < headBox.x + headBox.width &&
                        b.y > headBox.y && b.y < headBox.y + headBox.height) {
                        e.health -= b.damage * 2;
                        b.owner.headshots++;
                        b.owner.kills++;
                        game.score += 50;
                        if (e.health <= 0) {
                            game.enemies.splice(j, 1);
                            game.enemiesKilled++;
                            game.score += 100;
                        }
                        game.bullets.splice(i, 1);
                        break;
                    }
                    
                    if (b.x > e.x - 15 && b.x < e.x + 15 &&
                        b.y > e.y - 25 && b.y < e.y + 25) {
                        e.health -= b.damage;
                        b.owner.kills++;
                        if (e.health <= 0) {
                            game.enemies.splice(j, 1);
                            game.enemiesKilled++;
                            game.score += 100;
                        }
                        game.bullets.splice(i, 1);
                        break;
                    }
                }
            } else {
                for (let j = 0; j < game.players.length; j++) {
                    const p = game.players[j];
                    if (p.health <= 0) continue;
                    
                    if (b.x > p.x - 15 && b.x < p.x + 15 &&
                        b.y > p.y - 25 && b.y < p.y + 25) {
                        p.health -= b.damage;
                        if (p.cover) {
                            p.cover.health -= b.damage;
                            if (p.cover.health <= 0) {
                                p.cover = null;
                            }
                        }
                        game.bullets.splice(i, 1);
                        break;
                    }
                }
            }
        }
        
        for (let i = game.grenades.length - 1; i >= 0; i--) {
            const g = game.grenades[i];
            g.x += g.vx;
            g.y += g.vy;
            g.vy += 0.3;
            g.timer--;
            
            if (g.timer <= 0) {
                for (let j = game.enemies.length - 1; j >= 0; j--) {
                    const e = game.enemies[j];
                    const dx = e.x - g.x;
                    const dy = e.y - g.y;
                    if (Math.sqrt(dx*dx + dy*dy) < 100) {
                        e.health -= 50;
                        if (e.health <= 0) {
                            game.enemies.splice(j, 1);
                            game.enemiesKilled++;
                            game.score += 150;
                        }
                    }
                }
                game.grenades.splice(i, 1);
            }
        }
        
        game.coverObjects = game.coverObjects.filter(c => c.health > 0);
    }

    function draw() {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#2c3e50';
        for (let i = 0; i < 10; i++) {
            ctx.fillRect(i * 100, 0, 2, canvas.height);
        }
        for (let i = 0; i < 8; i++) {
            ctx.fillRect(0, i * 100, canvas.width, 2);
        }
        
        game.coverObjects.forEach(c => c.draw());
        
        game.enemies.forEach(e => e.draw());
        
        game.players.forEach(p => p.draw());
        
        ctx.fillStyle = '#e74c3c';
        game.bullets.forEach(b => {
            ctx.beginPath();
            ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.fillStyle = '#f39c12';
        game.grenades.forEach(g => {
            ctx.beginPath();
            ctx.arc(g.x, g.y, 8, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 200, 100);
        
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(`Wave: ${game.wave}`, 20, 35);
        ctx.fillText(`Score: ${game.score}`, 20, 60);
        ctx.fillText(`Enemies: ${game.enemies.length}`, 20, 85);
        
        const player = game.players[0];
        if (player) {
            ctx.fillStyle = '#fff';
            ctx.fillText(`Ammo: ${player.ammo}/${player.maxAmmo}`, 20, 110);
        }
        
        if (game.state === 'gameover') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 60px Arial';
            ctx.fillStyle = '#e74c3c';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 40);
            
            ctx.font = '30px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Final Score: ${game.score}`, canvas.width/2, canvas.height/2 + 20);
            ctx.fillText(`Wave Reached: ${game.wave}`, canvas.width/2, canvas.height/2 + 60);
            ctx.fillText(`Enemies Killed: ${game.enemiesKilled}`, canvas.width/2, canvas.height/2 + 100);
        }
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    game.players.push(new Player(1, canvas.width / 2));
    
    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    gameLoop();
})();