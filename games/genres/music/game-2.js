// Music Game 2 - Beat Rush
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        score: 0,
        combo: 0,
        maxCombo: 0,
        accuracy: 100,
        perfect: 0,
        good: 0,
        miss: 0,
        bpm: 120,
        beatInterval: 60 / 120,
        time: 0,
        notes: [],
        lanes: [
            { x: 100, color: '#e74c3c', key: 'left' },
            { x: 200, color: '#3498db', key: 'up' },
            { x: 300, color: '#2ecc71', key: 'down' },
            { x: 400, color: '#f1c40f', key: 'right' }
        ],
        targets: [],
        hits: [],
        particles: [],
        comboEffects: [],
        background: {
            bars: [],
            circles: []
        },
        gameTime: 0,
        difficulty: 'medium'
    };

    const NOTE_TYPES = {
        single: { duration: 1 },
        hold: { duration: 2 },
        double: { duration: 1 }
    };

    function initBackground() {
        for (let i = 0; i < 20; i++) {
            game.background.bars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                width: 3 + Math.random() * 5,
                height: 30 + Math.random() * 50,
                color: `hsl(${Math.random() * 360}, 70%, 50%)`,
                speed: 1 + Math.random() * 2
            });
        }
        
        for (let i = 0; i < 15; i++) {
            game.background.circles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: 20 + Math.random() * 40,
                color: `hsl(${Math.random() * 360}, 70%, 50%)`,
                pulse: Math.random() * Math.PI * 2
            });
        }
    }

    function spawnNote() {
        const laneIndex = Math.floor(Math.random() * 4);
        const lane = game.lanes[laneIndex];
        
        const noteTypes = ['single', 'single', 'single', 'hold', 'double'];
        const type = noteTypes[Math.floor(Math.random() * noteTypes.length)];
        
        game.notes.push({
            lane: laneIndex,
            x: lane.x,
            y: -50,
            targetY: canvas.height - 80,
            type: type,
            hit: false,
            hitTime: 0,
            color: lane.color,
            holdLength: type === 'hold' ? 100 : 0,
            holdProgress: 0
        });
        
        if (type === 'double') {
            const otherLane = (laneIndex + 1) % 4;
            game.notes.push({
                lane: otherLane,
                x: game.lanes[otherLane].x,
                y: -50,
                targetY: canvas.height - 80,
                type: 'single',
                hit: false,
                hitTime: 0,
                color: game.lanes[otherLane].color,
                holdLength: 0,
                holdProgress: 0
            });
        }
    }

    function handleInput(data) {
        if (game.state !== 'playing') return;
        
        const keys = ['left', 'up', 'down', 'right'];
        
        keys.forEach((key, i) => {
            let pressed = false;
            
            if (data.buttons && data.buttons[i]) pressed = true;
            if (data[key]) pressed = true;
            
            if (pressed) {
                checkHit(i);
            }
        });
    }

    function checkHit(laneIndex) {
        const targetY = canvas.height - 80;
        const hitWindow = 50;
        
        for (let i = 0; i < game.notes.length; i++) {
            const note = game.notes[i];
            
            if (note.lane === laneIndex && !note.hit) {
                const distance = Math.abs(note.y - targetY);
                
                if (distance < hitWindow) {
                    note.hit = true;
                    note.hitTime = game.time;
                    
                    if (distance < 15) {
                        game.perfect++;
                        game.combo++;
                        game.score += 100 * (1 + game.combo / 10);
                        createHitEffect(note.x, note.y, 'PERFECT!', '#ffd700');
                        createParticles(note.x, note.y, note.color, 15);
                    } else if (distance < 30) {
                        game.good++;
                        game.combo++;
                        game.score += 50 * (1 + game.combo / 10);
                        createHitEffect(note.x, note.y, 'GOOD', '#2ecc71');
                        createParticles(note.x, note.y, note.color, 8);
                    } else {
                        game.combo = 0;
                        createHitEffect(note.x, note.y, 'BAD', '#e74c3c');
                    }
                    
                    game.accuracy = ((game.perfect + game.good) / (game.perfect + game.good + game.miss + 1)) * 100;
                    
                    return;
                }
            }
        }
        
        game.combo = 0;
    }

    function createHitEffect(x, y, text, color) {
        game.hits.push({
            x: x,
            y: y,
            text: text,
            color: color,
            life: 30,
            vy: -2
        });
    }

    function createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            game.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                color: color,
                life: 30,
                size: 3 + Math.random() * 4
            });
        }
    }

    function update() {
        if (game.state !== 'playing') return;
        
        game.gameTime += 1/60;
        
        const beatTime = 60 / game.bpm;
        
        if (game.time % beatTime < 1/60) {
            if (Math.random() < 0.8) {
                spawnNote();
            }
        }
        
        game.time += 1/60;
        
        const speed = 5;
        
        game.notes.forEach((note, i) => {
            if (!note.hit) {
                note.y += speed;
                
                if (note.y > canvas.height + 50) {
                    game.miss++;
                    game.combo = 0;
                    game.notes.splice(i, 1);
                }
            }
        });
        
        game.notes = game.notes.filter(n => !n.hit || n.type !== 'hold' || n.holdProgress < n.holdLength);
        
        game.hits = game.hits.filter(h => {
            h.y += h.vy;
            h.life--;
            return h.life > 0;
        });
        
        game.particles = game.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life--;
            return p.life > 0;
        });
        
        game.background.bars.forEach(bar => {
            bar.y += bar.speed;
            if (bar.y > canvas.height) {
                bar.y = -50;
                bar.x = Math.random() * canvas.width;
            }
        });
        
        game.background.circles.forEach(circle => {
            circle.pulse += 0.05;
        });
        
        game.maxCombo = Math.max(game.maxCombo, game.combo);
    }

    function draw() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        game.background.circles.forEach(circle => {
            const scale = 1 + Math.sin(circle.pulse) * 0.2;
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = circle.color;
            ctx.beginPath();
            ctx.arc(circle.x, circle.y, circle.radius * scale, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        game.background.bars.forEach(bar => {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = bar.color;
            ctx.fillRect(bar.x, bar.y, bar.width, bar.height);
        });
        ctx.globalAlpha = 1;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        
        game.lanes.forEach(lane => {
            ctx.beginPath();
            ctx.moveTo(lane.x, 0);
            ctx.lineTo(lane.x, canvas.height);
            ctx.stroke();
        });
        
        game.lanes.forEach(lane => {
            ctx.fillStyle = lane.color;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(lane.x, canvas.height - 80, 25, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            
            ctx.strokeStyle = lane.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(lane.x, canvas.height - 80, 25, 0, Math.PI * 2);
            ctx.stroke();
        });
        
        game.notes.forEach(note => {
            ctx.fillStyle = note.color;
            ctx.beginPath();
            ctx.arc(note.x, note.y, 18, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(note.x, note.y, 8, 0, Math.PI * 2);
            ctx.fill();
            
            if (note.type === 'hold' && note.holdProgress > 0) {
                ctx.fillStyle = note.color;
                ctx.globalAlpha = 0.5;
                ctx.fillRect(note.x - 8, note.y, 16, note.holdProgress);
                ctx.globalAlpha = 1;
            }
        });
        
        game.hits.forEach(hit => {
            ctx.globalAlpha = hit.life / 30;
            ctx.fillStyle = hit.color;
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(hit.text, hit.x, hit.y);
        });
        ctx.globalAlpha = 1;
        
        game.particles.forEach(p => {
            ctx.globalAlpha = p.life / 30;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        const pulse = Math.sin(game.time * 10) * 0.2 + 0.8;
        
        game.lanes.forEach((lane, i) => {
            const keyLabels = ['←', '↑', '↓', '→'];
            ctx.fillStyle = lane.color;
            ctx.globalAlpha = pulse;
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(keyLabels[i], lane.x, canvas.height - 50);
        });
        ctx.globalAlpha = 1;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 150, 130);
        
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        
        ctx.fillStyle = '#ffd700';
        ctx.fillText(`Score: ${game.score}`, 20, 35);
        
        if (game.combo > 0) {
            ctx.fillStyle = '#f1c40f';
            ctx.fillText(`Combo: ${game.combo}`, 20, 60);
        }
        
        ctx.fillStyle = '#2ecc71';
        ctx.fillText(`Perfect: ${game.perfect}`, 20, 85);
        
        ctx.fillStyle = '#3498db';
        ctx.fillText(`Good: ${game.good}`, 20, 110);
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(`Miss: ${game.miss}`, 110, 35);
        
        ctx.fillStyle = '#95a5a6';
        ctx.fillText(`Acc: ${game.accuracy.toFixed(1)}%`, 110, 60);
        
        if (game.maxCombo > 0) {
            ctx.fillStyle = '#9b59b6';
            ctx.fillText(`Max: ${game.maxCombo}`, 110, 85);
        }
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    initBackground();
    
    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    gameLoop();
})();