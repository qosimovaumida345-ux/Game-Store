// Puzzle Game 1 - Color Match Mania
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        score: 0,
        moves: 0,
        time: 60,
        level: 1,
        grid: [],
        gridSize: 6,
        cellSize: 60,
        selected: null,
        matches: [],
        falling: [],
        spawning: [],
        animations: [],
        particles: [],
        combo: 0,
        maxCombo: 0,
        targetScore: 500,
        boardColors: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22']
    };

    function initBoard() {
        game.grid = [];
        for (let row = 0; row < game.gridSize; row++) {
            game.grid[row] = [];
            for (let col = 0; col < game.gridSize; col++) {
                game.grid[row][col] = {
                    color: game.boardColors[Math.floor(Math.random() * 4)],
                    x: col * game.cellSize + 100,
                    y: row * game.cellSize + 80,
                    targetY: row * game.cellSize + 80,
                    scale: 1,
                    alpha: 1,
                    matched: false
                };
            }
        }
        
        while (findMatches().length > 0) {
            for (let row = 0; row < game.gridSize; row++) {
                for (let col = 0; col < game.gridSize; col++) {
                    game.grid[row][col].color = game.boardColors[Math.floor(Math.random() * 4)];
                }
            }
        }
    }

    function findMatches() {
        const matches = [];
        
        for (let row = 0; row < game.gridSize; row++) {
            for (let col = 0; col < game.gridSize - 2; col++) {
                const c1 = game.grid[row][col].color;
                const c2 = game.grid[row][col + 1].color;
                const c3 = game.grid[row][col + 2].color;
                if (c1 === c2 && c2 === c3 && c1 !== null) {
                    matches.push({ type: 'horizontal', row, col, length: 3 });
                    let k = col + 3;
                    while (k < game.gridSize && game.grid[row][k].color === c1) {
                        matches[matches.length - 1].length++;
                        k++;
                    }
                }
            }
        }
        
        for (let col = 0; col < game.gridSize; col++) {
            for (let row = 0; row < game.gridSize - 2; row++) {
                const c1 = game.grid[row][col].color;
                const c2 = game.grid[row + 1][col].color;
                const c3 = game.grid[row + 2][col].color;
                if (c1 === c2 && c2 === c3 && c1 !== null) {
                    matches.push({ type: 'vertical', row, col, length: 3 });
                    let k = row + 3;
                    while (k < game.gridSize && game.grid[k][col].color === c1) {
                        matches[matches.length - 1].length++;
                        k++;
                    }
                }
            }
        }
        
        return matches;
    }

    function handleInput(data) {
        if (game.state !== 'playing') return;
        
        if (data.tap) {
            const cellX = Math.floor((data.x - 100) / game.cellSize);
            const cellY = Math.floor((data.y - 80) / game.cellSize);
            
            if (cellX >= 0 && cellX < game.gridSize && cellY >= 0 && cellY < game.gridSize) {
                if (game.selected) {
                    const dx = Math.abs(game.selected.col - cellX);
                    const dy = Math.abs(game.selected.row - cellY);
                    
                    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
                        swapCells(game.selected.row, game.selected.col, cellY, cellX);
                        game.selected = null;
                    } else {
                        game.selected = { row: cellY, col: cellX };
                    }
                } else {
                    game.selected = { row: cellY, col: cellX };
                }
            }
        }
        
        if (data.action) {
            initBoard();
            game.score = 0;
            game.moves = 0;
            game.time = 60;
        }
    }

    function swapCells(r1, c1, r2, c2) {
        const temp = game.grid[r1][c1].color;
        game.grid[r1][c1].color = game.grid[r2][c2].color;
        game.grid[r2][c2].color = temp;
        
        game.moves++;
        
        const newMatches = findMatches();
        if (newMatches.length > 0) {
            processMatches(newMatches);
        } else {
            const temp2 = game.grid[r1][c1].color;
            game.grid[r1][c1].color = game.grid[r2][c2].color;
            game.grid[r2][c2].color = temp2;
        }
    }

    function processMatches(matches) {
        let matchedCells = [];
        
        matches.forEach(m => {
            for (let i = 0; i < m.length; i++) {
                if (m.type === 'horizontal') {
                    matchedCells.push({ row: m.row, col: m.col + i });
                } else {
                    matchedCells.push({ row: m.row + i, col: m.col });
                }
            }
        });
        
        matchedCells = matchedCells.filter((cell, index, self) => 
            index === self.findIndex(c => c.row === cell.row && c.col === cell.col)
        );
        
        matchedCells.forEach(cell => {
            const color = game.grid[cell.row][cell.col].color;
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                game.particles.push({
                    x: cell.col * game.cellSize + 100 + game.cellSize / 2,
                    y: cell.row * game.cellSize + 80 + game.cellSize / 2,
                    vx: Math.cos(angle) * 4,
                    vy: Math.sin(angle) * 4,
                    color: color,
                    life: 30
                });
            }
            
            game.grid[cell.row][cell.col].color = null;
            game.grid[cell.row][cell.col].matched = true;
            game.score += 10 * (game.combo + 1);
        });
        
        game.combo++;
        if (game.combo > game.maxCombo) game.maxCombo = game.combo;
        
        setTimeout(() => {
            dropCells();
        }, 200);
    }

    function dropCells() {
        for (let col = 0; col < game.gridSize; col++) {
            let emptySpaces = 0;
            
            for (let row = game.gridSize - 1; row >= 0; row--) {
                if (game.grid[row][col].color === null) {
                    emptySpaces++;
                } else if (emptySpaces > 0) {
                    const newRow = row + emptySpaces;
                    game.grid[newRow][col].color = game.grid[row][col].color;
                    game.grid[newRow][col].targetY = newRow * game.cellSize + 80;
                    game.grid[row][col].color = null;
                }
            }
            
            for (let i = 0; i < emptySpaces; i++) {
                const row = emptySpaces - 1 - i;
                game.grid[row][col].color = game.boardColors[Math.floor(Math.random() * game.boardColors.length)];
                game.grid[row][col].y = -game.cellSize * (i + 1);
                game.grid[row][col].targetY = row * game.cellSize + 80;
            }
        }
        
        setTimeout(() => {
            const newMatches = findMatches();
            if (newMatches.length > 0) {
                processMatches(newMatches);
            } else {
                game.combo = 0;
            }
        }, 300);
    }

    function update() {
        if (game.state !== 'playing') return;
        
        game.time -= 1/60;
        if (game.time <= 0) {
            game.state = 'gameover';
        }
        
        if (game.score >= game.targetScore) {
            game.level++;
            game.targetScore = Math.floor(game.targetScore * 1.5);
            game.time += 30;
            game.gridSize = Math.min(8, game.gridSize + 1);
            initBoard();
        }
        
        for (let row = 0; row < game.gridSize; row++) {
            for (let col = 0; col < game.gridSize; col++) {
                const cell = game.grid[row][col];
                if (cell.y < cell.targetY) {
                    cell.y += 8;
                    if (cell.y > cell.targetY) cell.y = cell.targetY;
                }
            }
        }
        
        game.particles = game.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life--;
            return p.life > 0;
        });
    }

    function draw() {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 8; j++) {
                if ((i + j) % 2 === 0) {
                    ctx.fillRect(90 + i * game.cellSize, 70 + j * game.cellSize, game.cellSize, game.cellSize);
                }
            }
        }
        
        for (let row = 0; row < game.gridSize; row++) {
            for (let col = 0; col < game.gridSize; col++) {
                const cell = game.grid[row][col];
                
                if (cell.color) {
                    ctx.fillStyle = '#2c3e50';
                    ctx.beginPath();
                    ctx.roundRect(95 + col * game.cellSize, 75 + row * game.cellSize, game.cellSize - 10, game.cellSize - 10, 8);
                    ctx.fill();
                    
                    const colorGradient = ctx.createRadialGradient(
                        cell.x + game.cellSize/2, cell.y + game.cellSize/2, 0,
                        cell.x + game.cellSize/2, cell.y + game.cellSize/2, game.cellSize/2
                    );
                    colorGradient.addColorStop(0, lightenColor(cell.color, 30));
                    colorGradient.addColorStop(1, cell.color);
                    
                    ctx.fillStyle = colorGradient;
                    ctx.beginPath();
                    ctx.roundRect(98 + col * game.cellSize, 78 + row * game.cellSize, game.cellSize - 16, game.cellSize - 16, 6);
                    ctx.fill();
                    
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.beginPath();
                    ctx.roundRect(100 + col * game.cellSize, 80 + row * game.cellSize, game.cellSize - 20, (game.cellSize - 20) / 2, 4);
                    ctx.fill();
                }
                
                if (game.selected && game.selected.row === row && game.selected.col === col) {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.roundRect(93 + col * game.cellSize, 73 + row * game.cellSize, game.cellSize - 6, game.cellSize - 6, 8);
                    ctx.stroke();
                }
            }
        }
        
        game.particles.forEach(p => {
            ctx.globalAlpha = p.life / 30;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 180, 130);
        
        ctx.font = 'bold 22px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${game.score}`, 20, 38);
        
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`Target: ${game.targetScore}`, 20, 65);
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(`Time: ${Math.ceil(game.time)}s`, 20, 92);
        
        ctx.fillStyle = '#3498db';
        ctx.fillText(`Level: ${game.level}`, 20, 119);
        
        ctx.fillStyle = '#2ecc71';
        ctx.font = '16px Arial';
        ctx.fillText(`Moves: ${game.moves}`, 120, 38);
        ctx.fillText(`Combo: x${game.maxCombo}`, 120, 65);
        
        if (game.state === 'gameover') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = '#e74c3c';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 30);
            
            ctx.font = '30px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Final Score: ${game.score}`, canvas.width/2, canvas.height/2 + 25);
            ctx.fillText(`Level: ${game.level}`, canvas.width/2, canvas.height/2 + 60);
        }
    }

    function lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    initBoard();
    
    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    gameLoop();
})();