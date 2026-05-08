// Puzzle Game 2 - Block Builder
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        score: 0,
        moves: 30,
        time: 120,
        blocks: [],
        selected: null,
        gridSize: 8,
        blockSize: 50,
        grid: [],
        matched: [],
        falling: [],
        particles: [],
        combo: 0,
        target: { color: '#e74c3c', count: 15 }
    };

    const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6'];

    function initGrid() {
        game.grid = [];
        for (let r = 0; r < game.gridSize; r++) {
            game.grid[r] = [];
            for (let c = 0; c < game.gridSize; c++) {
                game.grid[r][c] = {
                    color: COLORS[Math.floor(Math.random() * 5)],
                    x: c * game.blockSize + 75,
                    y: r * game.blockSize + 60,
                    targetY: r * game.blockSize + 60,
                    scale: 1,
                    selected: false
                };
            }
        }
        
        while (findMatches().length > 0) {
            for (let r = 0; r < game.gridSize; r++) {
                for (let c = 0; c < game.gridSize; c++) {
                    game.grid[r][c].color = COLORS[Math.floor(Math.random() * 5)];
                }
            }
        }
    }

    function findMatches() {
        let matches = [];
        
        for (let r = 0; r < game.gridSize; r++) {
            for (let c = 0; c < game.gridSize - 2; c++) {
                let match = [game.grid[r][c]];
                let color = game.grid[r][c].color;
                let k = c + 1;
                while (k < game.gridSize && game.grid[r][k].color === color) {
                    match.push(game.grid[r][k]);
                    k++;
                }
                if (match.length >= 3) {
                    matches.push({ type: 'horizontal', blocks: match });
                    c = k - 1;
                }
            }
        }
        
        for (let c = 0; c < game.gridSize; c++) {
            for (let r = 0; r < game.gridSize - 2; r++) {
                let match = [game.grid[r][c]];
                let color = game.grid[r][c].color;
                let k = r + 1;
                while (k < game.gridSize && game.grid[k][c].color === color) {
                    match.push(game.grid[k][c]);
                    k++;
                }
                if (match.length >= 3) {
                    matches.push({ type: 'vertical', blocks: match });
                    r = k - 1;
                }
            }
        }
        
        return matches;
    }

    function handleInput(data) {
        if (game.state !== 'playing') return;
        
        if (data.tap) {
            const col = Math.floor((data.x - 75) / game.blockSize);
            const row = Math.floor((data.y - 60) / game.blockSize);
            
            if (row >= 0 && row < game.gridSize && col >= 0 && col < game.gridSize) {
                if (game.selected) {
                    const dx = Math.abs(game.selected.col - col);
                    const dy = Math.abs(game.selected.row - row);
                    
                    if (dx + dy === 1) {
                        swap(game.selected.row, game.selected.col, row, col);
                        game.selected = null;
                    } else {
                        game.selected = { row, col };
                    }
                } else {
                    game.selected = { row, col };
                }
            }
        }
    }

    function swap(r1, c1, r2, c2) {
        const temp = game.grid[r1][c1].color;
        game.grid[r1][c1].color = game.grid[r2][c2].color;
        game.grid[r2][c2].color = temp;
        
        game.moves--;
        
        let matches = findMatches();
        if (matches.length > 0) {
            processMatches(matches);
        } else {
            const temp2 = game.grid[r1][c1].color;
            game.grid[r1][c1].color = game.grid[r2][c2].color;
            game.grid[r2][c2].color = temp2;
        }
    }

    function processMatches(matches) {
        matches.forEach(m => {
            m.blocks.forEach(block => {
                const r = (block.y - 60) / game.blockSize;
                const c = (block.x - 75) / game.blockSize;
                
                if (block.color === game.target.color) {
                    game.target.count--;
                }
                
                for (let i = 0; i < 5; i++) {
                    game.particles.push({
                        x: block.x + game.blockSize/2,
                        y: block.y + game.blockSize/2,
                        vx: (Math.random() - 0.5) * 6,
                        vy: (Math.random() - 0.5) * 6,
                        color: block.color,
                        life: 25
                    });
                }
                
                game.grid[Math.floor(r)][Math.floor(c)].color = null;
                game.score += 10 * (game.combo + 1);
            });
        });
        
        game.combo++;
        
        setTimeout(() => dropBlocks(), 150);
    }

    function dropBlocks() {
        for (let c = 0; c < game.gridSize; c++) {
            let empty = 0;
            for (let r = game.gridSize - 1; r >= 0; r--) {
                if (game.grid[r][c].color === null) {
                    empty++;
                } else if (empty > 0) {
                    const newR = r + empty;
                    game.grid[newR][c].color = game.grid[r][c].color;
                    game.grid[newR][c].targetY = newR * game.blockSize + 60;
                    game.grid[r][c].color = null;
                }
            }
            
            for (let i = 0; i < empty; i++) {
                const r = empty - 1 - i;
                game.grid[r][c].color = COLORS[Math.floor(Math.random() * 5)];
                game.grid[r][c].y = -game.blockSize * (i + 1);
            }
        }
        
        setTimeout(() => {
            const newMatches = findMatches();
            if (newMatches.length > 0) {
                processMatches(newMatches);
            } else {
                game.combo = 0;
            }
        }, 200);
    }

    function update() {
        if (game.state !== 'playing') return;
        
        game.time -= 1/60;
        
        if (game.time <= 0 || game.moves <= 0) {
            game.state = 'gameover';
        }
        
        if (game.target.count <= 0) {
            game.score += 500;
            game.target.count = 15;
        }
        
        for (let r = 0; r < game.gridSize; r++) {
            for (let c = 0; c < game.gridSize; c++) {
                const b = game.grid[r][c];
                if (b.y < b.targetY) {
                    b.y += 8;
                    if (b.y > b.targetY) b.y = b.targetY;
                }
            }
        }
        
        game.particles = game.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            return p.life > 0;
        });
    }

    function draw() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(1, '#1a252f');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        for (let i = 0; i < game.gridSize; i++) {
            for (let j = 0; j < game.gridSize; j++) {
                if ((i + j) % 2 === 0) {
                    ctx.fillRect(70 + i * game.blockSize, 55 + j * game.blockSize, game.blockSize, game.blockSize);
                }
            }
        }
        
        for (let r = 0; r < game.gridSize; r++) {
            for (let c = 0; c < game.gridSize; c++) {
                const b = game.grid[r][c];
                if (b.color) {
                    ctx.fillStyle = '#34495e';
                    ctx.fillRect(73 + c * game.blockSize, 58 + r * game.blockSize, game.blockSize - 6, game.blockSize - 6);
                    
                    const g = ctx.createRadialGradient(
                        b.x + game.blockSize/2, b.y + game.blockSize/2, 0,
                        b.x + game.blockSize/2, b.y + game.blockSize/2, game.blockSize/2
                    );
                    g.addColorStop(0, lighten(b.color, 30));
                    g.addColorStop(1, b.color);
                    ctx.fillStyle = g;
                    ctx.fillRect(75 + c * game.blockSize, 60 + r * game.blockSize, game.blockSize - 10, game.blockSize - 10);
                    
                    if (game.selected && game.selected.row === r && game.selected.col === c) {
                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = 3;
                        ctx.strokeRect(73 + c * game.blockSize, 58 + r * game.blockSize, game.blockSize - 6, game.blockSize - 6);
                    }
                }
            }
        }
        
        game.particles.forEach(p => {
            ctx.globalAlpha = p.life / 25;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 180, 120);
        
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${game.score}`, 20, 35);
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(`Target: ${game.target.count}`, 20, 60);
        
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`Moves: ${game.moves}`, 20, 85);
        
        ctx.fillStyle = '#3498db';
        ctx.fillText(`Time: ${Math.ceil(game.time)}s`, 20, 110);
        
        ctx.fillStyle = game.target.color;
        ctx.fillRect(140, 45, 20, 20);
        
        if (game.state === 'gameover') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = '#e74c3c';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 20);
            
            ctx.font = '25px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Final Score: ${game.score}`, canvas.width/2, canvas.height/2 + 30);
        }
    }

    function lighten(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, (num >> 8 & 0xFF) + amt);
        const B = Math.min(255, (num & 0xFF) + amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    initGrid();
    
    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    gameLoop();
})();