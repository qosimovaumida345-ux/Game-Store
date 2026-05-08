// Survival Game 1 - Arctic Expedition
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        day: 1,
        timeOfDay: 0,
        temperature: -20,
        score: 0,
        player: {
            x: canvas.width / 2,
            y: canvas.height - 150,
            width: 40,
            height: 60,
            health: 100,
            maxHealth: 100,
            energy: 100,
            maxEnergy: 100,
            hunger: 100,
            thirst: 100,
            warmth: 100,
            inventory: {
                food: 5,
                water: 3,
                wood: 0,
                medicine: 1,
                battery: 2,
                flashlight: 1
            },
            equipped: null,
            shelter: null,
            campfire: null
        },
        resources: [],
        animals: [],
        weather: {
            type: 'clear',
            intensity: 0,
            windSpeed: 0
        },
        camp: null,
        particles: [],
        enemies: [],
        dayDuration: 600,
        nightDuration: 300
    };

    class Resource {
        constructor(type) {
            this.type = type;
            this.x = 50 + Math.random() * (canvas.width - 100);
            this.y = 80 + Math.random() * (canvas.height - 180);
            this.size = type === 'tree' ? 40 : type === 'rock' ? 30 : 25;
            this.health = type === 'tree' ? 3 : type === 'rock' ? 5 : 2;
            this.resourceAmount = type === 'tree' ? { wood: 5, food: 0 } : 
                                type === 'rock' ? { wood: 0, food: 0 } : 
                                type === 'berry' ? { wood: 0, food: 2 } : { wood: 0, food: 1 };
            this.regrowTimer = 0;
        }
        
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            switch(this.type) {
                case 'tree':
                    ctx.fillStyle = '#5d4037';
                    ctx.fillRect(-5, -10, 10, 40);
                    ctx.fillStyle = '#2e7d32';
                    ctx.beginPath();
                    ctx.moveTo(0, -40);
                    ctx.lineTo(-20, -10);
                    ctx.lineTo(20, -10);
                    ctx.closePath();
                    ctx.fill();
                    break;
                case 'rock':
                    ctx.fillStyle = '#7f8c8d';
                    ctx.beginPath();
                    ctx.moveTo(-15, 10);
                    ctx.lineTo(-20, -10);
                    ctx.lineTo(0, -20);
                    ctx.lineTo(20, -10);
                    ctx.lineTo(15, 10);
                    ctx.closePath();
                    ctx.fill();
                    break;
                case 'berry':
                    ctx.fillStyle = '#8bc34a';
                    ctx.fillRect(-5, -20, 10, 25);
                    ctx.fillStyle = '#e91e63';
                    for (let i = 0; i < 5; i++) {
                        ctx.beginPath();
                        ctx.arc(-8 + i * 4, -10, 4, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    break;
                case 'fish':
                    ctx.fillStyle = '#2196f3';
                    ctx.beginPath();
                    ctx.ellipse(0, 0, 20, 8, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#ff5722';
                    ctx.beginPath();
                    ctx.moveTo(20, 0);
                    ctx.lineTo(28, -5);
                    ctx.lineTo(28, 5);
                    ctx.closePath();
                    ctx.fill();
                    break;
            }
            
            ctx.restore();
        }
    }

    class Animal {
        constructor(type) {
            this.type = type;
            this.x = Math.random() < 0.5 ? -50 : canvas.width + 50;
            this.y = 100 + Math.random() * (canvas.height - 200);
            this.width = type === 'bear' ? 60 : 40;
            this.height = type === 'bear' ? 50 : 30;
            this.health = type === 'bear' ? 100 : 30;
            this.speed = type === 'bear' ? 1.5 : 3;
            this.damage = type === 'bear' ? 25 : 10;
            this.foodValue = type === 'bear' ? 15 : 8;
            this.state = 'roaming';
            this.targetX = Math.random() * canvas.width;
            this.attackCooldown = 0;
        }
        
        update() {
            if (this.health <= 0) return;
            
            this.attackCooldown--;
            
            const dx = game.player.x - this.x;
            const dy = game.player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 100 && this.type === 'bear') {
                this.state = 'attacking';
            } else if (dist > 200) {
                this.state = 'roaming';
            }
            
            if (this.state === 'roaming') {
                const tdx = this.targetX - this.x;
                if (Math.abs(tdx) < 10) {
                    this.targetX = Math.random() * canvas.width;
                }
                this.x += (tdx > 0 ? 1 : -1) * this.speed;
                this.y += Math.sin(Date.now() / 1000 + this.x) * 0.5;
            } else if (this.state === 'attacking') {
                this.x += (dx / dist) * this.speed * 2;
                this.y += (dy / dist) * this.speed * 2;
                
                if (dist < 40 && this.attackCooldown <= 0) {
                    game.player.health -= this.damage;
                    game.player.warmth -= 10;
                    this.attackCooldown = 60;
                }
            }
            
            this.x = Math.max(30, Math.min(canvas.width - 30, this.x));
            this.y = Math.max(80, Math.min(canvas.height - 80, this.y));
        }
        
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            if (this.type === 'bear') {
                ctx.fillStyle = '#5d4037';
                ctx.fillRect(-30, -25, 60, 50);
                ctx.fillStyle = '#3e2723';
                ctx.beginPath();
                ctx.arc(-10, -35, 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000';
                ctx.fillRect(-15, -40, 4, 4);
                ctx.fillRect(-5, -40, 4, 4);
            } else {
                ctx.fillStyle = '#ecf0f1';
                ctx.fillRect(-20, -15, 40, 30);
                ctx.beginPath();
                ctx.arc(15, -5, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#e74c3c';
                ctx.beginPath();
                ctx.moveTo(25, -5);
                ctx.lineTo(35, -10);
                ctx.lineTo(35, 0);
                ctx.closePath();
                ctx.fill();
            }
            
            ctx.restore();
        }
    }

    class Camp {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.tent = false;
            this.fire = false;
            this.fireLevel = 0;
            this.foodStored = 0;
        }
        
        update() {
            if (this.fire && this.fireLevel > 0) {
                this.fireLevel -= 0.02;
                if (game.player.x > this.x - 60 && game.player.x < this.x + 60 &&
                    game.player.y > this.y - 60 && game.player.y < this.y + 60) {
                    game.player.warmth = Math.min(100, game.player.warmth + 0.5);
                }
            }
        }
        
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            if (this.tent) {
                ctx.fillStyle = '#f39c12';
                ctx.beginPath();
                ctx.moveTo(0, -40);
                ctx.lineTo(-30, 20);
                ctx.lineTo(30, 20);
                ctx.closePath();
                ctx.fill();
            }
            
            if (this.fire) {
                ctx.fillStyle = '#e74c3c';
                ctx.beginPath();
                ctx.arc(0, 10, 15, 0, Math.PI * 2);
                ctx.fill();
                
                for (let i = 0; i < 5; i++) {
                    const angle = Math.random() * Math.PI;
                    const len = 10 + Math.random() * 15;
                    ctx.strokeStyle = i % 2 === 0 ? '#f39c12' : '#e74c3c';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(0, 10);
                    ctx.lineTo(Math.cos(angle) * len, 10 - Math.sin(angle) * len - 10);
                    ctx.stroke();
                }
            }
            
            ctx.restore();
        }
    }

    function spawnResources() {
        for (let i = 0; i < 10; i++) {
            game.resources.push(new Resource('tree'));
        }
        for (let i = 0; i < 8; i++) {
            game.resources.push(new Resource('rock'));
        }
        for (let i = 0; i < 5; i++) {
            game.resources.push(new Resource('berry'));
        }
        game.resources.push(new Resource('fish'));
    }

    function spawnAnimals() {
        game.animals.push(new Animal('rabbit'));
        game.animals.push(new Animal('rabbit'));
        game.animals.push(new Animal('bear'));
    }

    function handleInput(data) {
        if (game.state !== 'playing') return;
        
        if (data.left) game.player.x -= 3;
        if (data.right) game.player.x += 3;
        if (data.up) game.player.y -= 3;
        if (data.down) game.player.y += 3;
        
        game.player.x = Math.max(30, Math.min(canvas.width - 30, game.player.x));
        game.player.y = Math.max(80, Math.min(canvas.height - 80, game.player.y));
        
        if (data.action) {
            for (let i = game.resources.length - 1; i >= 0; i--) {
                const r = game.resources[i];
                const dx = r.x - game.player.x;
                const dy = r.y - game.player.y;
                if (Math.sqrt(dx * dx + dy * dy) < 50) {
                    if (r.type === 'tree' && game.player.inventory.wood !== undefined) {
                        game.player.inventory.wood += r.resourceAmount.wood;
                        game.score += 10;
                    } else if (r.type === 'berry') {
                        game.player.inventory.food += r.resourceAmount.food;
                        game.player.hunger = Math.min(100, game.player.hunger + 20);
                        game.score += 15;
                    } else if (r.type === 'fish') {
                        game.player.inventory.food += r.resourceAmount.food;
                        game.player.hunger = Math.min(100, game.player.hunger + 25);
                        game.score += 20;
                    }
                    game.resources.splice(i, 1);
                    break;
                }
            }
            
            for (let i = game.animals.length - 1; i >= 0; i--) {
                const a = game.animals[i];
                const dx = a.x - game.player.x;
                const dy = a.y - game.player.y;
                if (Math.sqrt(dx * dx + dy * dy) < 60) {
                    a.health -= 30;
                    if (a.health <= 0) {
                        game.player.inventory.food += a.foodValue;
                        game.player.hunger = Math.min(100, game.player.hunger + a.foodValue * 3);
                        game.animals.splice(i, 1);
                        game.score += 50;
                    }
                    break;
                }
            }
        }
        
        if (data.special) {
            if (!game.camp) {
                game.camp = new Camp(game.player.x, game.player.y);
            }
            game.camp.fire = true;
            game.camp.fireLevel = 100;
        }
    }

    function update() {
        if (game.state !== 'playing') return;
        
        game.timeOfDay++;
        
        if (game.timeOfDay > game.dayDuration + game.nightDuration) {
            game.day++;
            game.timeOfDay = 0;
            spawnResources();
            spawnAnimals();
            game.score += 100;
        }
        
        if (game.timeOfDay > game.dayDuration) {
            game.weather.type = 'night';
            game.temperature = -30;
            game.player.warmth -= 0.1;
        } else {
            game.weather.type = 'day';
            game.temperature = -15 + Math.random() * 5;
        }
        
        game.player.hunger -= 0.02;
        game.player.thirst -= 0.03;
        
        if (game.player.warmth < 30) {
            game.player.health -= 0.1;
        }
        
        if (game.player.hunger <= 0 || game.player.thirst <= 0) {
            game.player.health -= 0.2;
        }
        
        if (game.player.health <= 0) {
            game.state = 'gameover';
        }
        
        if (game.camp) {
            game.camp.update();
        }
        
        game.animals.forEach(a => a.update());
        
        game.player.energy = Math.min(game.player.maxEnergy, game.player.energy + 0.05);
    }

    function draw() {
        const isNight = game.timeOfDay > game.dayDuration;
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        
        if (isNight) {
            gradient.addColorStop(0, '#0d1b2a');
            gradient.addColorStop(1, '#1b263b');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#fff';
            for (let i = 0; i < 50; i++) {
                const x = (i * 73) % canvas.width;
                const y = (i * 47) % (canvas.height / 2);
                ctx.beginPath();
                ctx.arc(x, y, 1 + Math.random(), 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            gradient.addColorStop(0, '#81d4fa');
            gradient.addColorStop(1, '#e1f5fe');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        for (let x = 0; x <= canvas.width; x += 20) {
            ctx.lineTo(x, canvas.height - 30 + Math.sin(x / 50) * 10);
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.fill();
        
        game.resources.forEach(r => r.draw());
        
        if (game.camp) game.camp.draw();
        
        game.animals.forEach(a => a.draw());
        
        ctx.save();
        ctx.translate(game.player.x, game.player.y);
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-20, -30, 40, 60);
        
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(0, -40, 14, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#3498db';
        ctx.fillRect(-20, -30, 40, 15);
        
        ctx.restore();
        
        const barWidth = 150;
        const barHeight = 12;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 200, 180);
        
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(`Day ${game.day}`, 20, 32);
        ctx.fillText(`Score: ${game.score}`, 20, 55);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(20, 70, barWidth, barHeight);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(20, 70, barWidth * (game.player.health / game.player.maxHealth), barHeight);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText('Health', 175, 80);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(20, 90, barWidth, barHeight);
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(20, 90, barWidth * (game.player.hunger / 100), barHeight);
        ctx.fillText('Hunger', 175, 100);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(20, 110, barWidth, barHeight);
        ctx.fillStyle = '#3498db';
        ctx.fillRect(20, 110, barWidth * (game.player.thirst / 100), barHeight);
        ctx.fillText('Thirst', 175, 120);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(20, 130, barWidth, barHeight);
        ctx.fillStyle = '#e91e63';
        ctx.fillRect(20, 130, barWidth * (game.player.warmth / 100), barHeight);
        ctx.fillText('Warmth', 175, 140);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(20, 150, barWidth, barHeight);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(20, 150, barWidth * (game.player.energy / game.player.maxEnergy), barHeight);
        ctx.fillText('Energy', 175, 160);
        
        ctx.font = '14px Arial';
        ctx.fillText(`Temp: ${Math.round(game.temperature)}°C`, 20, 180);
        
        if (isNight) {
            ctx.fillStyle = '#e74c3c';
            ctx.fillText('NIGHT', 160, 32);
        }
        
        if (game.state === 'gameover') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = '#e74c3c';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 30);
            
            ctx.font = '25px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`You survived ${game.day} days`, canvas.width/2, canvas.height/2 + 20);
            ctx.fillText(`Final Score: ${game.score}`, canvas.width/2, canvas.height/2 + 55);
        }
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    spawnResources();
    spawnAnimals();
    
    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    gameLoop();
})();