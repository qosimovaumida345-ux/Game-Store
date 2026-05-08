// Sports Game 2 - Olympic Athletics
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        event: 'sprint',
        score: 0,
        player: {
            x: 100,
            y: canvas.height - 150,
            speed: 0,
            maxSpeed: 12,
            fatigue: 0,
            energy: 100,
            technique: 50,
            form: 0,
            position: 0,
            stamina: 100
        },
        opponents: [],
        finishLine: 800,
        distance: 0,
        cameraX: 0,
        time: 0,
        bestTime: Infinity,
        lap: 1,
        totalLaps: 3,
        hurdles: [],
        jumping: false,
        jumpHeight: 0,
        keys: { q: false, w: false, e: false }
    };

    class Opponent {
        constructor(x, speed) {
            this.x = x;
            this.y = canvas.height - 150;
            this.speed = speed;
            this.fatigue = 0;
            this.position = 0;
        }
        
        update() {
            this.fatigue += 0.01;
            const effectiveSpeed = this.speed * (1 - this.fatigue / 200);
            this.x += effectiveSpeed;
            this.position = this.x;
        }
        
        draw() {
            ctx.save();
            ctx.translate(this.x - game.cameraX, this.y);
            
            ctx.fillStyle = '#3498db';
            ctx.fillRect(-15, -35, 30, 35);
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(0, -45, 10, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#e74c3c';
            const legAngle = Math.sin(Date.now() / 100) * 0.5;
            ctx.save();
            ctx.translate(5, 0);
            ctx.rotate(legAngle);
            ctx.fillRect(-3, 0, 6, 25);
            ctx.restore();
            
            ctx.restore();
        }
    }

    function initEvent() {
        game.opponents = [];
        for (let i = 0; i < 5; i++) {
            game.opponents.push(new Opponent(80 + i * 30, 7 + Math.random() * 4));
        }
        
        if (game.event === 'hurdles') {
            game.hurdles = [];
            for (let i = 0; i < 8; i++) {
                game.hurdles.push({
                    x: 300 + i * 150,
                    height: 30
                });
            }
        }
    }

    function handleInput(data) {
        if (game.state !== 'playing') return;
        
        if (data.keys) {
            game.keys = data.keys;
        }
        
        if (data.action) {
            if (game.player.fatigue < 80) {
                game.player.speed = Math.min(game.player.maxSpeed, game.player.speed + 0.5);
                game.player.fatigue += 0.1;
            }
        }
        
        if (data.special) {
            if (game.player.energy >= 20) {
                game.player.speed = game.player.maxSpeed * 1.2;
                game.player.energy -= 20;
            }
        }
        
        if (game.event === 'hurdles' && data.up && !game.jumping) {
            game.jumping = true;
            game.player.jumpVelocity = 12;
        }
    }

    function update() {
        if (game.state !== 'playing') return;
        
        game.time += 1/60;
        
        const fatigueFactor = 1 - game.player.fatigue / 100;
        const speedMultiplier = game.keys.q ? 1.2 : game.keys.w ? 0.9 : 1;
        
        if (game.player.speed > 0) {
            game.player.x += game.player.speed * fatigueFactor * speedMultiplier;
            game.player.position = game.player.x;
        }
        
        if (game.jumping) {
            game.player.jumpVelocity -= 0.6;
            game.jumpHeight += game.player.jumpVelocity;
            
            if (game.jumpHeight <= 0) {
                game.jumpHeight = 0;
                game.jumping = false;
            }
            
            if (game.event === 'hurdles') {
                for (let h of game.hurdles) {
                    if (Math.abs(game.player.x - h.x) < 30 && game.jumpHeight < h.height) {
                        game.player.speed *= 0.5;
                        game.player.fatigue += 10;
                    }
                }
            }
        }
        
        game.player.fatigue = Math.min(100, game.player.fatigue + 0.02);
        game.player.energy = Math.min(100, game.player.energy + 0.1);
        
        if (game.keys.q) {
            game.player.technique = Math.min(100, game.player.technique + 0.1);
        }
        
        game.cameraX = Math.max(0, game.player.x - 200);
        
        game.opponents.forEach(op => op.update());
        
        if (game.player.x >= game.finishLine) {
            if (game.lap < game.totalLaps) {
                game.lap++;
                game.player.x = 100;
                game.player.speed = 0;
                game.cameraX = 0;
            } else {
                game.state = 'finished';
                if (game.time < game.bestTime) {
                    game.bestTime = game.time;
                }
            }
        }
        
        let lastPlace = true;
        game.opponents.forEach(op => {
            if (op.x > game.player.x) lastPlace = false;
        });
        
        if (lastPlace && game.player.fatigue > 80) {
            game.player.speed *= 0.98;
        }
    }

    function draw() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87ceeb');
        gradient.addColorStop(1, '#e0f7fa');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#d4a574';
        ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 20]);
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 80);
        ctx.lineTo(canvas.width, canvas.height - 80);
        ctx.stroke();
        ctx.setLineDash([]);
        
        const finishScreenX = game.finishLine - game.cameraX;
        ctx.fillStyle = '#fff';
        ctx.fillRect(finishScreenX, canvas.height - 80, 5, 80);
        
        for (let i = 0; i < 20; i++) {
            const x = (i * 50 - game.cameraX * 0.5) % canvas.width;
            if (x > -50) {
                ctx.fillStyle = '#2ecc71';
                ctx.fillRect(x, canvas.height - 75, 30, 5);
            }
        }
        
        if (game.event === 'hurdles') {
            game.hurdles.forEach(h => {
                const screenX = h.x - game.cameraX;
                if (screenX > -50 && screenX < canvas.width + 50) {
                    ctx.fillStyle = '#e74c3c';
                    ctx.fillRect(screenX, canvas.height - 80 - h.height, 5, h.height);
                    ctx.fillRect(screenX - 10, canvas.height - 80 - h.height, 25, 8);
                }
            });
        }
        
        game.opponents.forEach(op => op.draw());
        
        ctx.save();
        ctx.translate(game.player.x - game.cameraX, game.player.y - game.jumpHeight);
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-15, -35, 30, 35);
        
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(0, -45, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#3498db';
        ctx.fillRect(-20, -35, 40, 10);
        
        if (game.player.speed > 0) {
            const legAngle = Math.sin(Date.now() / 80) * 0.6;
            ctx.fillStyle = '#c0392b';
            
            ctx.save();
            ctx.translate(5, 0);
            ctx.rotate(legAngle);
            ctx.fillRect(-3, 0, 6, 25);
            ctx.restore();
            
            ctx.save();
            ctx.translate(-5, 0);
            ctx.rotate(-legAngle);
            ctx.fillRect(-3, 0, 6, 25);
            ctx.restore();
        }
        
        if (game.jumping) {
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(-5, -55, 10, 20);
        }
        
        ctx.restore();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 180, 130);
        
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(`Time: ${game.time.toFixed(2)}s`, 20, 35);
        ctx.fillText(`Lap: ${game.lap}/${game.totalLaps}`, 20, 58);
        
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`Speed: ${game.player.speed.toFixed(1)}`, 20, 81);
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(20, 95, 150, 10);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(20, 95, 150 * (1 - game.player.fatigue / 100), 10);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText('Stamina', 180, 103);
        
        ctx.fillStyle = '#3498db';
        ctx.fillRect(20, 115, 150, 10);
        ctx.fillRect(20, 115, 150 * (game.player.energy / 100), 10);
        ctx.fillText('Energy', 180, 123);
        
        if (game.state === 'finished') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = '#f1c40f';
            ctx.textAlign = 'center';
            ctx.fillText('FINISHED!', canvas.width/2, canvas.height/2 - 30);
            
            ctx.font = '30px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Time: ${game.time.toFixed(2)}s`, canvas.width/2, canvas.height/2 + 20);
            
            const rank = game.opponents.filter(op => op.x > game.player.x).length + 1;
            ctx.fillText(`Place: ${rank}`, canvas.width/2, canvas.height/2 + 55);
        }
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    initEvent();
    
    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    gameLoop();
})();