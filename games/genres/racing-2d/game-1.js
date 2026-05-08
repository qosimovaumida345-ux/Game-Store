// Racing 2D Game 1 - Nitro Circuit
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        lap: 1,
        totalLaps: 5,
        time: 0,
        bestLap: Infinity,
        currentLapTime: 0,
        track: [],
        player: {
            x: 150,
            y: canvas.height / 2,
            angle: 0,
            speed: 0,
            maxSpeed: 12,
            acceleration: 0.15,
            friction: 0.98,
            turnSpeed: 0.05,
            width: 40,
            height: 20,
            nitro: 100,
            maxNitro: 100,
            boost: false,
            lapProgress: 0,
            checkpoints: []
        },
        opponents: [],
        obstacles: [],
        particles: [],
        cameraX: 0,
        trackLength: 3000,
        trackWidth: 200,
        finishLineX: 200,
        checkPoints: [],
        boostPads: []
    };

    class Opponent {
        constructor(x, y, difficulty) {
            this.x = x;
            this.y = y;
            this.angle = 0;
            this.speed = 8 + difficulty * 2;
            this.maxSpeed = this.speed;
            this.width = 40;
            this.height = 20;
            this.difficulty = difficulty;
            this.lapProgress = 0;
            this.lap = 1;
            this.offTrack = false;
        }
        
        update() {
            const targetX = game.player.x + Math.sin(this.lapProgress * Math.PI * 2) * 100;
            const targetY = game.player.y + Math.cos(this.lapProgress * Math.PI * 2) * 80;
            
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const targetAngle = Math.atan2(dy, dx);
            
            let angleDiff = targetAngle - this.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            this.angle += angleDiff * 0.05;
            
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
            
            this.offTrack = this.y < 50 || this.y > canvas.height - 50;
            if (this.offTrack) {
                this.speed *= 0.95;
            } else {
                this.speed = Math.min(this.maxSpeed, this.speed + 0.1);
            }
            
            this.lapProgress = (this.lapProgress + 0.0005 * this.difficulty) % 1;
            if (this.lapProgress < 0.1 && this.lastProgress > 0.9) {
                this.lap++;
            }
            this.lastProgress = this.lapProgress;
        }
        
        draw() {
            ctx.save();
            ctx.translate(this.x - game.cameraX, this.y);
            ctx.rotate(this.angle);
            
            const hue = this.difficulty * 60;
            ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
            ctx.fillRect(-20, -10, 40, 20);
            
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(-18, 12, 6, 0, Math.PI * 2);
            ctx.arc(18, 12, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }

    class Obstacle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.width = 30;
            this.height = 30;
            this.type = Math.random() < 0.5 ? 'oil' : 'box';
        }
        
        draw() {
            const screenX = this.x - game.cameraX;
            if (screenX < -50 || screenX > canvas.width + 50) return;
            
            if (this.type === 'oil') {
                ctx.fillStyle = '#1a1a1a';
                ctx.beginPath();
                ctx.ellipse(screenX, this.y, 20, 12, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.ellipse(screenX, this.y, 15, 8, 0, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = '#e74c3c';
                ctx.fillRect(screenX - 15, this.y - 15, 30, 30);
                ctx.fillStyle = '#fff';
                ctx.fillRect(screenX - 10, this.y - 10, 20, 20);
                ctx.fillStyle = '#e74c3c';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('!', screenX, this.y + 5);
            }
        }
    }

    class BoostPad {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.width = 40;
            this.active = true;
            this.pulsePhase = Math.random() * Math.PI * 2;
        }
        
        draw() {
            const screenX = this.x - game.cameraX;
            if (screenX < -50 || screenX > canvas.width + 50) return;
            
            const pulse = Math.sin(Date.now() / 200 + this.pulsePhase) * 0.3 + 0.7;
            ctx.fillStyle = this.active ? `rgba(241, 196, 15, ${pulse})` : '#555';
            ctx.fillRect(screenX - 20, this.y - 15, 40, 30);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('>>>', screenX, this.y + 4);
        }
    }

    class Particle {
        constructor(x, y, vx, vy, color) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.color = color;
            this.life = 30;
            this.size = 3 + Math.random() * 3;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.95;
            this.vy *= 0.95;
            this.life--;
        }
        
        draw() {
            ctx.globalAlpha = this.life / 30;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x - game.cameraX, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    function generateTrack() {
        game.checkPoints = [];
        game.boostPads = [];
        game.obstacles = [];
        
        const numCheckpoints = 10;
        for (let i = 0; i < numCheckpoints; i++) {
            const x = 150 + (game.trackLength / numCheckpoints) * i;
            const y = 100 + Math.sin(i * 0.8) * (canvas.height / 2 - 100);
            const width = 80;
            game.checkPoints.push({ x, y, width, passed: false });
        }
        
        for (let i = 0; i < 30; i++) {
            const x = 200 + Math.random() * (game.trackLength - 400);
            const y = 80 + Math.random() * (canvas.height - 160);
            game.obstacles.push(new Obstacle(x, y));
        }
        
        for (let i = 0; i < 15; i++) {
            const x = 300 + Math.random() * (game.trackLength - 600);
            const y = 80 + Math.random() * (canvas.height - 160);
            game.boostPads.push(new BoostPad(x, y));
        }
    }

    function handleInput(data) {
        if (game.state !== 'playing') return;
        
        if (data.tilt !== undefined) {
            game.player.angle += data.tilt * game.player.turnSpeed;
        }
        if (data.buttons) {
            if (data.buttons[0]) {
                game.player.speed += game.player.acceleration;
            }
            if (data.buttons[2]) {
                game.player.angle -= game.player.turnSpeed;
            }
            if (data.buttons[3]) {
                game.player.angle += game.player.turnSpeed;
            }
        }
        
        if (data.special && game.player.nitro > 0) {
            game.player.boost = true;
            game.player.nitro -= 1;
        } else {
            game.player.boost = false;
        }
        
        if (data.action) {
            game.player.speed += game.player.acceleration * 2;
        }
    }

    function update() {
        if (game.state !== 'playing') return;
        
        game.time += 1/60;
        game.currentLapTime += 1/60;
        
        const maxSpd = game.player.boost ? game.player.maxSpeed * 1.5 : game.player.maxSpeed;
        game.player.speed = Math.min(maxSpd, game.player.speed);
        game.player.speed *= game.player.friction;
        
        game.player.x += Math.cos(game.player.angle) * game.player.speed;
        game.player.y += Math.sin(game.player.angle) * game.player.speed;
        
        if (game.player.x < 50) game.player.x = 50;
        if (game.player.x > game.trackLength - 50) game.player.x = game.trackLength - 50;
        
        const onTrack = game.player.y > 50 && game.player.y < canvas.height - 50;
        if (!onTrack) {
            game.player.speed *= 0.95;
        }
        
        game.cameraX = game.player.x - 200;
        
        game.checkPoints.forEach((cp, i) => {
            if (!cp.passed && game.player.x > cp.x && game.player.x < cp.x + cp.width) {
                cp.passed = true;
                if (i === 0 && game.checkPoints.every(c => c.passed)) {
                    game.checkPoints.forEach(c => c.passed = false);
                }
            }
        });
        
        if (game.player.x > game.trackLength - 100) {
            if (game.player.lastX <= game.trackLength - 100) {
                if (game.currentLapTime < game.bestLap) {
                    game.bestLap = game.currentLapTime;
                }
                game.lap++;
                game.currentLapTime = 0;
                
                if (game.lap > game.totalLaps) {
                    game.state = 'finished';
                }
            }
        }
        game.player.lastX = game.player.x;
        
        const progress = (game.player.x / game.trackLength);
        game.player.lapProgress = ((game.lap - 1) + progress) / game.totalLaps;
        
        game.boostPads.forEach(bp => {
            const dx = bp.x - game.player.x;
            const dy = bp.y - game.player.y;
            if (Math.abs(dx) < 25 && Math.abs(dy) < 20 && bp.active) {
                game.player.speed = game.player.maxSpeed * 1.3;
                bp.active = false;
                setTimeout(() => bp.active = true, 3000);
            }
        });
        
        game.obstacles.forEach(obs => {
            const dx = obs.x - game.player.x;
            const dy = obs.y - game.player.y;
            if (Math.abs(dx) < 30 && Math.abs(dy) < 25) {
                game.player.speed *= 0.5;
                if (obs.type === 'oil') {
                    game.player.angle += (Math.random() - 0.5) * 0.5;
                }
            }
        });
        
        if (game.player.nitro < game.player.maxNitro && !game.player.boost) {
            game.player.nitro += 0.2;
        }
        
        game.opponents.forEach(op => op.update());
        
        game.particles = game.particles.filter(p => {
            p.update();
            return p.life > 0;
        });
        
        if (game.player.speed > 5) {
            for (let i = 0; i < 2; i++) {
                game.particles.push(new Particle(
                    game.player.x - Math.cos(game.player.angle) * 20,
                    game.player.y - Math.sin(game.player.angle) * 20,
                    -Math.cos(game.player.angle) * 2 + (Math.random() - 0.5),
                    -Math.sin(game.player.angle) * 2 + (Math.random() - 0.5),
                    game.player.boost ? '#f1c40f' : '#7f8c8d'
                ));
            }
        }
    }

    function draw() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(1, '#34495e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(0, 0, canvas.width, 50);
        ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
        
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(50 - game.cameraX % 20, 50, canvas.width, canvas.height - 100);
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.setLineDash([20, 20]);
        ctx.beginPath();
        ctx.moveTo(50, 50);
        ctx.lineTo(50, canvas.height - 50);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(canvas.width - 50, 50);
        ctx.lineTo(canvas.width - 50, canvas.height - 50);
        ctx.stroke();
        ctx.setLineDash([]);
        
        for (let i = 0; i < game.checkPoints.length; i++) {
            const cp = game.checkPoints[i];
            const screenX = cp.x - game.cameraX;
            ctx.fillStyle = cp.passed ? '#2ecc71' : 'rgba(231, 76, 60, 0.3)';
            ctx.fillRect(screenX, 50, 5, canvas.height - 100);
        }
        
        game.boostPads.forEach(bp => bp.draw());
        game.obstacles.forEach(obs => obs.draw());
        
        game.particles.forEach(p => p.draw());
        
        game.opponents.forEach(op => op.draw());
        
        ctx.save();
        ctx.translate(game.player.x - game.cameraX, game.player.y);
        ctx.rotate(game.player.angle);
        
        ctx.fillStyle = game.player.boost ? '#f39c12' : '#3498db';
        ctx.fillRect(-20, -10, 40, 20);
        
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(15, -8, 10, 16);
        
        if (game.player.boost) {
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.moveTo(-20, -10);
            ctx.lineTo(-35, 0);
            ctx.lineTo(-20, 10);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-15, 12, 7, 0, Math.PI * 2);
        ctx.arc(15, 12, 7, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 180, 130);
        
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(`Lap ${game.lap}/${game.totalLaps}`, 20, 35);
        
        ctx.font = '16px Arial';
        ctx.fillText(`Time: ${game.time.toFixed(1)}s`, 20, 58);
        ctx.fillText(`Lap Time: ${game.currentLapTime.toFixed(1)}s`, 20, 80);
        
        if (game.bestLap < Infinity) {
            ctx.fillText(`Best: ${game.bestLap.toFixed(1)}s`, 20, 102);
        }
        
        ctx.fillStyle = '#333';
        ctx.fillRect(20, 115, 150, 12);
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(20, 115, 150 * (game.player.nitro / game.player.maxNitro), 12);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText('NITRO', 175, 124);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(20, 132, 150, 12);
        const speedPercent = game.player.speed / game.player.maxSpeed;
        ctx.fillStyle = speedPercent > 0.8 ? '#e74c3c' : '#3498db';
        ctx.fillRect(20, 132, 150 * speedPercent, 12);
        
        if (game.state === 'finished') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = '#2ecc71';
            ctx.textAlign = 'center';
            ctx.fillText('RACE COMPLETE!', canvas.width/2, canvas.height/2 - 30);
            
            ctx.font = '25px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Total Time: ${game.time.toFixed(1)}s`, canvas.width/2, canvas.height/2 + 20);
            ctx.fillText(`Best Lap: ${game.bestLap.toFixed(1)}s`, canvas.width/2, canvas.height/2 + 55);
        }
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    generateTrack();
    game.opponents.push(new Opponent(150, canvas.height / 2 - 30, 1));
    game.opponents.push(new Opponent(150, canvas.height / 2 + 30, 2));
    
    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    gameLoop();
})();