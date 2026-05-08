// Board Game 6 - Backgammon Pro
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        turn: 1,
        dice: [0, 0],
        canMove: false,
        selectedPoint: null,
        playerPoints: [],
        aiPoints: [],
        bearOff: { player: 0, ai: 0 },
        captured: { player: 0, ai: 0 },
        movesLeft: [],
        score: 0,
        rounds: 0
    };

    function initBoard() {
        game.playerPoints = [
            { count: 2, player: 1 },
            { count: 0, player: 1 },
            { count: 0, player: 1 },
            { count: 0, player: 1 },
            { count: 0, player: 1 },
            { count: 5, player: 2 },
            { count: 0, player: 1 },
            { count: 3, player: 2 },
            { count: 0, player: 1 },
            { count: 0, player: 1 },
            { count: 0, player: 1 },
            { count: 0, player: 1 },
            { count: 0, player: 1 },
            { count: 0, player: 1 },
            { count: 0, player: 1 },
            { count: 0, player: 1 },
            { count: 5, player: 1 },
            { count: 0, player: 1 },
            { count: 0, player: 1 },
            { count: 0, player: 1 },
            { count: 3, player: 1 },
            { count: 0, player: 1 },
            { count: 5, player: 1 },
            { count: 0, player: 1 }
        ];
        
        game.aiPoints = [
            { count: 0, player: 2 },
            { count: 0, player: 2 },
            { count: 0, player: 2 },
            { count: 0, player: 2 },
            { count: 5, player: 1 },
            { count: 0, player: 2 },
            { count: 3, player: 1 },
            { count: 0, player: 2 },
            { count: 0, player: 2 },
            { count: 0, player: 2 },
            { count: 0, player: 2 },
            { count: 0, player: 2 },
            { count: 0, player: 2 },
            { count: 0, player: 2 },
            { count: 0, player: 2 },
            { count: 0, player: 2 },
            { count: 5, player: 2 },
            { count: 0, player: 2 },
            { count: 0, player: 2 },
            { count: 0, player: 2 },
            { count: 3, player: 2 },
            { count: 0, player: 2 },
            { count: 0, player: 2 },
            { count: 0, player: 2 }
        ];
        
        for (let i = 0; i < 24; i++) {
            game.playerPoints[i] = { count: game.playerPoints[i].count, player: 1 };
            game.aiPoints[i] = { count: game.aiPoints[i].count, player: 2 };
        }
    }

    function rollDice() {
        game.dice[0] = Math.floor(Math.random() * 6) + 1;
        game.dice[1] = Math.floor(Math.random() * 6) + 1;
        
        if (game.dice[0] === game.dice[1]) {
            game.movesLeft = [game.dice[0], game.dice[0], game.dice[0], game.dice[0]];
        } else {
            game.movesLeft = [game.dice[0], game.dice[1]];
        }
        
        game.canMove = true;
        game.rounds++;
        
        if (game.turn === 2) {
            setTimeout(aiMove, 1000);
        }
    }

    function canMove(from, to, player) {
        const direction = player === 1 ? 1 : -1;
        const validMoves = game.movesLeft.map(d => from + (d * direction));
        
        return validMoves.includes(to);
    }

    function movePiece(from, to, player) {
        const points = player === 1 ? game.playerPoints : game.aiPoints;
        
        if (points[from].count > 0) {
            let moveIndex = -1;
            
            const direction = player === 1 ? 1 : -1;
            
            for (let i = 0; i < game.movesLeft.length; i++) {
                const dest = from + (game.movesLeft[i] * direction);
                if (dest === to && dest >= 0 && dest < 24) {
                    moveIndex = i;
                    break;
                }
            }
            
            if (moveIndex !== -1) {
                points[from].count--;
                
                const destPoints = player === 1 ? game.playerPoints : game.aiPoints;
                
                if (destPoints[to].player === 0 || destPoints[to].player === player) {
                    destPoints[to].count++;
                    destPoints[to].player = player;
                } else if (destPoints[to].count === 1) {
                    const captured = player === 1 ? 'ai' : 'player';
                    game.captured[captured]++;
                    destPoints[to].count = 1;
                    destPoints[to].player = player;
                }
                
                game.movesLeft.splice(moveIndex, 1);
                
                if (game.movesLeft.length === 0) {
                    game.turn = game.turn === 1 ? 2 : 1;
                    setTimeout(rollDice, 500);
                }
                
                checkWin();
            }
        }
    }

    function aiMove() {
        if (game.turn !== 2 || game.movesLeft.length === 0) return;
        
        let moved = false;
        
        for (let i = 0; i < 24 && !moved; i++) {
            if (game.aiPoints[i].count > 0 && game.aiPoints[i].player === 2) {
                for (let j = 0; j < game.movesLeft.length && !moved; j++) {
                    const to = i - game.movesLeft[j];
                    
                    if (to >= 0 && to < 24) {
                        if (game.aiPoints[to].player === 0 || game.aiPoints[to].player === 2 || 
                            (game.aiPoints[to].player === 1 && game.aiPoints[to].count === 1)) {
                            movePiece(i, to, 2);
                            moved = true;
                        }
                    }
                }
            }
        }
        
        if (game.movesLeft.length > 0 && !moved) {
            game.turn = 1;
            setTimeout(rollDice, 500);
        } else if (game.movesLeft.length > 0) {
            setTimeout(aiMove, 1000);
        }
    }

    function handleInput(data) {
        if (game.state !== 'playing' || game.turn !== 1 || game.movesLeft.length === 0) return;
        
        if (data.tap) {
            const col = Math.floor((data.x - 50) / 50);
            const row = data.y < canvas.height / 2 ? 0 : 1;
            
            const pointIndex = row === 0 ? 23 - col : col;
            
            if (game.selectedPoint === null) {
                if (game.playerPoints[pointIndex].count > 0 && game.playerPoints[pointIndex].player === 1) {
                    game.selectedPoint = pointIndex;
                }
            } else {
                movePiece(game.selectedPoint, pointIndex, 1);
                game.selectedPoint = null;
            }
        }
        
        if (data.action) {
            game.selectedPoint = null;
        }
    }

    function checkWin() {
        const playerBorneOff = canBearOff(1) ? game.playerPoints.filter((p, i) => {
            return p.player === 1 && (i < 6 || i >= 18);
        }).reduce((sum, p) => sum + p.count, 0) + game.captured.player : 0;
        
        const aiBorneOff = canBearOff(2) ? game.aiPoints.filter((p, i) => {
            return p.player === 2 && (i >= 6 && i < 18);
        }).reduce((sum, p) => sum + p.count, 0) + game.captured.ai : 0;
        
        if (playerBorneOff === 15) {
            game.state = 'win';
            game.score += 100;
        } else if (aiBorneOff === 15) {
            game.state = 'lose';
        }
    }

    function canBearOff(player) {
        const points = player === 1 ? game.playerPoints : game.aiPoints;
        
        if (player === 1) {
            for (let i = 6; i < 18; i++) {
                if (points[i].player === 1 && points[i].count > 0) return false;
            }
        } else {
            for (let i = 0; i < 6; i++) {
                if (points[i].player === 2 && points[i].count > 0) return false;
            }
            for (let i = 18; i < 24; i++) {
                if (points[i].player === 2 && points[i].count > 0) return false;
            }
        }
        return true;
    }

    function update() {
        if (game.state === 'playing' && game.movesLeft.length === 0 && game.turn === 1) {
            rollDice();
        }
    }

    function draw() {
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#deb887';
        ctx.fillRect(0, canvas.height / 2 - 5, canvas.width, 10);
        
        for (let i = 0; i < 24; i++) {
            const x = 50 + i * 50;
            const isTop = i < 12;
            
            ctx.fillStyle = i % 2 === 0 ? '#8B4513' : '#DEB887';
            ctx.fillRect(x, isTop ? 0 : canvas.height / 2, 50, canvas.height / 2 - 5);
            
            const playerCount = game.playerPoints[i].count;
            const aiCount = game.aiPoints[i].count;
            const total = playerCount + aiCount;
            
            if (total > 0) {
                const maxShow = Math.min(total, 5);
                
                for (let j = 0; j < maxShow; j++) {
                    const y = isTop ? 
                        20 + j * ((canvas.height / 2 - 20) / 5) :
                        canvas.height - 20 - j * ((canvas.height / 2 - 20) / 5);
                    
                    ctx.fillStyle = playerCount > j ? '#2c3e50' : '#c0392b';
                    ctx.beginPath();
                    ctx.arc(x + 25, y, 15, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                
                if (total > 5) {
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 14px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(total, x + 25, isTop ? 50 : canvas.height / 2 - 50);
                }
            }
            
            if (game.selectedPoint === i) {
                ctx.strokeStyle = '#f1c40f';
                ctx.lineWidth = 3;
                ctx.strokeRect(x, isTop ? 0 : canvas.height / 2, 50, canvas.height / 2 - 5);
            }
        }
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 150, 100);
        
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        
        if (game.turn === 1) {
            ctx.fillStyle = '#2ecc71';
            ctx.fillText('Your Turn', 20, 35);
        } else {
            ctx.fillStyle = '#e74c3c';
            ctx.fillText('AI Turn', 20, 35);
        }
        
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`Dice: ${game.dice[0]} ${game.dice[1]}`, 20, 60);
        
        ctx.fillStyle = '#3498db';
        ctx.fillText(`Moves: ${game.movesLeft.length}`, 20, 85);
        
        ctx.fillStyle = '#fff';
        ctx.fillText(`Captured: ${game.captured.player}`, 20, 110);
        
        if (game.state === 'win') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = '#2ecc71';
            ctx.textAlign = 'center';
            ctx.fillText('YOU WIN!', canvas.width/2, canvas.height/2);
        } else if (game.state === 'lose') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = '#e74c3c';
            ctx.textAlign = 'center';
            ctx.fillText('YOU LOSE!', canvas.width/2, canvas.height/2);
        }
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    initBoard();
    rollDice();
    
    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    gameLoop();
})();