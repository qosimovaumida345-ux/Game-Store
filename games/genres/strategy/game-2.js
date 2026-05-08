// Strategy Game 2 - Tower Defense Legend
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        wave: 1,
        money: 200,
        lives: 20,
        score: 0,
        towers: [],
        enemies: [],
        path: [],
        projectiles: [],
        particles: [],
        selectedTower: null,
        placingTower: null,
        enemySpawnTimer: 0,
        enemiesPerWave: 10,
        enemiesSpawned: 0,
        pathWidth: 40,
        gold: 0
    };

    const TOWER_TYPES = {
        archer: { cost: 50, range: 120, damage: 15, fireRate: 30, color: '#27ae60', name: 'Archer' },
        cannon: { cost: 100, range: 100, damage: 40, fireRate: 90, color: '#e74c3c', name: 'Cannon' },
        ice: { cost: 75, range: 100, damage: 5, fireRate: 20, color: '#3498db', name: 'Ice' },
        lightning: { cost: 150, range: 150, damage: 25, fireRate: 45, color: '#f1c40f', name: 'Lightning' },
        poison: { cost: 125, range: 90, damage: 10, fireRate: 15, color: '#9b59b6', name: 'Poison' }
    };

    const ENEMY_TYPES = {
        goblin: { health: 30, speed: 2, reward: 10, color: '#27ae60' },
        orc: { health: 60, speed: 1.5, reward: 20, color: '#e67e22' },
        troll: { health: 120, speed: 1, reward: 35, color: '#8e44ad' },
        dragon: { health: 300, speed: 0.8, reward: 100, color: '#e74c3c' }
    };

    function generatePath() {
        game.path = [];
        const points = [
            { x: 0, y: 150 },
            { x: 200, y: 150 },
            { x: 200, y: 350 },
            { x: 400, y: 350 },
            { x: 400, y: 150 },
            { x: 600, y: 150 },
            { x: 600, y: 400 },
            { x: 300, y: 400 },
            { x: 300, y: 500 },
            { x: 750, y: 500 }
        ];
        
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const steps = 20;
            for (let j = 0; j < steps; j++) {
                game.path.push({
                    x: p1.x + (p2.x - p1.x) * (j / steps),
                    y: p1.y + (p2.y - p1.y) * (j / steps)
                });
            }
        }
    }

    function handleInput(data) {
        if (game.state !== 'playing') return;
        
        if (data.tap) {
            const towerType = data.towerType || 'archer';
            
            if (game.placingTower) {
                const canPlace = canPlaceTower(data.x, data.y);
                if (canPlace && game.money >= TOWER_TYPES[game.placingTower].cost) {
                    game.towers.push({
                        x: data.x,
                        y: data.y,
                        type: game.placingTower,
                        ...TOWER_TYPES[game.placingTower],
                        level: 1,
                        target: null,
                        fireCooldown: 0,
                        angle: 0
                    });
                    game.money -= TOWER_TYPES[game.placingTower].cost;
                    game.placingTower = null;
                }
            } else {
                for (let tower of game.towers) {
                    const dx = tower.x - data.x;
                    const dy = tower.y - data.y;
                    if (Math.sqrt(dx*dx + dy*dy) < 30) {
                        game.selectedTower = tower;
                        return;
                    }
                }
                game.selectedTower = null;
            }
        }
        
        if (data.action) {
            game.placingTower = game.placingTower ? null : 'archer';
        }
        
        if (data.buttons) {
            const types = Object.keys(TOWER_TYPES);
            for (let i = 0; i < types.length; i++) {
                if (data.buttons[i] && game.money >= TOWER_TYPES[types[i]].cost) {
                    game.placingTower = types[i];
                }
            }
        }
    }

    function canPlaceTower(x, y) {
        for (let tower of game.towers) {
            const dx = tower.x - x;
            const dy = tower.y - y;
            if (Math.sqrt(dx*dx + dy*dy) < 40) return false;
        }
        
        for (let i = 0; i < game.path.length; i++) {
            const p = game.path[i];
            const dx = p.x - x;
            const dy = p.y - y;
            if (Math.sqrt(dx*dx + dy*dy) < game.pathWidth) return false;
        }
        
        return true;
    }

    function spawnEnemy() {
        const types = ['goblin', 'goblin', 'orc', 'orc', 'troll', 'dragon'];
        let type = 'goblin';
        
        if (game.wave > 3) type = types[Math.floor(Math.random() * 4)];
        if (game.wave > 5) type = types[Math.floor(Math.random() * 5)];
        
        const enemyData = ENEMY_TYPES[type];
        const pathIndex = Math.floor(Math.random() * 10);
        
        game.enemies.push({
            x: game.path[0].x,
            y: game.path[0].y,
            type: type,
            health: enemyData.health * (1 + game.wave * 0.2),
            maxHealth: enemyData.health * (1 + game.wave * 0.2),
            speed: enemyData.speed,
            reward: enemyData.reward,
            pathIndex: 0,
            frozen: 0,
            poisoned: 0
        });
        
        game.enemiesSpawned++;
    }

    function update() {
        if (game.state !== 'playing') return;
        
        if (game.enemiesSpawned < game.enemiesPerWave) {
            game.enemySpawnTimer++;
            if (game.enemySpawnTimer >= 60 - game.wave * 3) {
                spawnEnemy();
                game.enemySpawnTimer = 0;
            }
        }
        
        if (game.enemies.length === 0 && game.enemiesSpawned >= game.enemiesPerWave) {
            game.wave++;
            game.enemiesSpawned = 0;
            game.enemiesPerWave += 3;
            game.money += 50;
        }
        
        for (let i = game.enemies.length - 1; i >= 0; i--) {
            const enemy = game.enemies[i];
            
            if (enemy.frozen > 0) enemy.frozen--;
            if (enemy.poisoned > 0) {
                enemy.poisoned--;
                enemy.health -= 0.5;
            }
            
            if (enemy.health <= 0) {
                game.money += enemy.reward;
                game.score += enemy.reward;
                game.createParticles(enemy.x, enemy.y, '#f1c40f', 10);
                game.enemies.splice(i, 1);
                continue;
            }
            
            let speed = enemy.speed;
            if (enemy.frozen > 0) speed *= 0.5;
            
            if (enemy.pathIndex < game.path.length - 1) {
                const target = game.path[enemy.pathIndex + 1];
                const dx = target.x - enemy.x;
                const dy = target.y - enemy.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < speed) {
                    enemy.pathIndex++;
                } else {
                    enemy.x += (dx / dist) * speed;
                    enemy.y += (dy / dist) * speed;
                }
            } else {
                game.lives--;
                game.enemies.splice(i, 1);
                
                if (game.lives <= 0) {
                    game.state = 'gameover';
                }
            }
        }
        
        game.towers.forEach(tower => {
            if (tower.fireCooldown > 0) tower.fireCooldown--;
            
            let target = null;
            let minDist = Infinity;
            
            for (let enemy of game.enemies) {
                const dx = enemy.x - tower.x;
                const dy = enemy.y - tower.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist <= tower.range && dist < minDist) {
                    minDist = dist;
                    target = enemy;
                }
            }
            
            tower.target = target;
            
            if (target && tower.fireCooldown <= 0) {
                tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
                
                game.projectiles.push({
                    x: tower.x,
                    y: tower.y,
                    target: target,
                    damage: tower.damage,
                    speed: 8,
                    type: tower.type,
                    color: tower.color
                });
                
                tower.fireCooldown = tower.fireRate;
            }
        });
        
        for (let i = game.projectiles.length - 1; i >= 0; i--) {
            const p = game.projectiles[i];
            
            if (!p.target || p.target.health <= 0) {
                game.projectiles.splice(i, 1);
                continue;
            }
            
            const dx = p.target.x - p.x;
            const dy = p.target.y - p.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < p.speed) {
                p.target.health -= p.damage;
                
                if (p.type === 'ice') p.target.frozen = 60;
                if (p.type === 'poison') p.target.poisoned = 120;
                if (p.type === 'lightning') {
                    const nearby = game.enemies.filter(e => {
                        const d = Math.sqrt((e.x - p.target.x)**2 + (e.y - p.target.y)**2);
                        return d < 80 && e !== p.target;
                    });
                    nearby.forEach(e => e.health -= p.damage * 0.5);
                }
                
                game.projectiles.splice(i, 1);
            } else {
                p.x += (dx / dist) * p.speed;
                p.y += (dy / dist) * p.speed;
            }
        }
        
        game.particles = game.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            return p.life > 0;
        });
    }

    game.createParticles = function(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                color: color,
                life: 20
            });
        }
    };

    function draw() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a472a');
        gradient.addColorStop(1, '#0d2818');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#2d5a3d';
        ctx.lineWidth = game.pathWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(game.path[0].x, game.path[0].y);
        for (let i = 1; i < game.path.length; i++) {
            ctx.lineTo(game.path[i].x, game.path[i].y);
        }
        ctx.stroke();
        
        ctx.strokeStyle = '#4a7c59';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 10]);
        ctx.beginPath();
        ctx.moveTo(game.path[0].x, game.path[0].y);
        for (let i = 1; i < game.path.length; i++) {
            ctx.lineTo(game.path[i].x, game.path[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        
        game.towers.forEach(tower => {
            ctx.fillStyle = '#34495e';
            ctx.beginPath();
            ctx.arc(tower.x, tower.y, 20, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = tower.color;
            ctx.beginPath();
            ctx.arc(tower.x, tower.y, 15, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.save();
            ctx.translate(tower.x, tower.y);
            ctx.rotate(tower.angle);
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(10, -4, 15, 8);
            ctx.restore();
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
            ctx.stroke();
        });
        
        game.enemies.forEach(enemy => {
            const color = ENEMY_TYPES[enemy.type].color;
            const size = enemy.type === 'dragon' ? 25 : 15;
            
            if (enemy.frozen > 0) {
                ctx.fillStyle = '#a9dfbf';
            } else if (enemy.poisoned > 0) {
                ctx.fillStyle = '#9b59b6';
            } else {
                ctx.fillStyle = color;
            }
            
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, size, 0, Math.PI * 2);
            ctx.fill();
            
            const healthPercent = enemy.health / enemy.maxHealth;
            ctx.fillStyle = '#333';
            ctx.fillRect(enemy.x - 15, enemy.y - size - 10, 30, 5);
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(enemy.x - 14, enemy.y - size - 9, 28 * healthPercent, 3);
        });
        
        game.projectiles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fill();
        });
        
        game.particles.forEach(p => {
            ctx.globalAlpha = p.life / 20;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        if (game.placingTower) {
            ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
            ctx.fillRect(550, 60, 180, 180);
            
            const types = Object.keys(TOWER_TYPES);
            ctx.font = '14px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'left';
            types.forEach((type, i) => {
                const cost = TOWER_TYPES[type].cost;
                const canAfford = game.money >= cost;
                ctx.fillStyle = canAfford ? '#fff' : '#888';
                ctx.fillText(`${type}: $${cost}`, 560, 90 + i * 25);
            });
        }
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 150, 100);
        
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(`Wave: ${game.wave}`, 20, 35);
        ctx.fillText(`Lives: ${game.lives}`, 20, 60);
        
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`$${game.money}`, 20, 85);
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(`Score: ${game.score}`, 20, 110);
        
        if (game.state === 'gameover') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = '#e74c3c';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 20);
            
            ctx.font = '25px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Wave: ${game.wave}`, canvas.width/2, canvas.height/2 + 30);
            ctx.fillText(`Score: ${game.score}`, canvas.width/2, canvas.height/2 + 60);
        }
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    generatePath();
    
    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    gameLoop();
})();