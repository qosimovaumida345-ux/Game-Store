// Chess Game 2 - Grandmaster Duel
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        board: [], turn: 'white', selected: null, moves: [], captured: [],
        player: 'white', aiThinking: false, score: 0, time: { white: 600, black: 600 }
    };

    const PIECES = { 'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙', 'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟' };

    function initBoard() {
        const setup = ['r','n','b','q','k','b','n','r','p','p','p','p','p','p','p','p','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','P','P','P','P','P','P','P','P','R','N','B','Q','K','B','N','R'];
        game.board = [];
        for (let i = 0; i < 64; i++) game.board.push(setup[i]);
    }

    function getValidMoves(index) {
        const piece = game.board[index];
        if (!piece || (piece === piece.toUpperCase()) !== (game.turn === 'white')) return [];
        const moves = [];
        const row = Math.floor(index / 8), col = index % 8;
        
        const directions = { 'p': [[0,-1],[0,-2],[1,-1],[-1,-1]], 'n':[[1,-2],[2,-1],[2,1],[1,2],[-1,2],[-2,1],[-2,-1],[-1,-2]], 'b':[[1,1],[1,-1],[-1,1],[-1,-1]], 'r':[[1,0],[-1,0],[0,1],[0,-1]], 'q':[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]], 'K':[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]] };
        
        const type = piece.toLowerCase();
        const dirs = directions[type] || [];
        
        dirs.forEach(([dc, dr]) => {
            if (type === 'p') {
                const forward = game.turn === 'white' ? -1 : 1;
                const startRow = game.turn === 'white' ? 6 : 1;
                let nr = row + forward + dr, nc = col + dc;
                if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                    const target = game.board[nr * 8 + nc];
                    if (!target || (dr !== 0) === (target !== '.' && (target === target.toUpperCase()) !== (game.turn === 'white'))) moves.push(nr * 8 + nc);
                    if (row === startRow && !game.board[(row + forward) * 8 + nc] && !target) moves.push((row + forward * 2) * 8 + nc);
                }
            } else {
                let steps = type === 'n' || type === 'k' ? 1 : 8;
                for (let s = 1; s <= steps; s++) {
                    let nr = row + dr * s, nc = col + dc * s;
                    if (nr < 0 || nr > 7 || nc < 0 || nc > 7) break;
                    const target = game.board[nr * 8 + nc];
                    if (!target) moves.push(nr * 8 + nc);
                    else if ((target === target.toUpperCase()) !== (game.turn === 'white')) { moves.push(nr * 8 + nc); break; }
                    else break;
                }
            }
        });
        return moves;
    }

    function handleInput(data) {
        if (game.turn !== game.player || game.aiThinking) return;
        if (data.tap) {
            const col = Math.floor((data.x - 50) / 60);
            const row = Math.floor((data.y - 50) / 60);
            const index = row * 8 + col;
            if (row >= 0 && row < 8 && col >= 0 && col < 8) {
                if (game.selected !== null) {
                    if (game.moves.includes(index)) {
                        movePiece(game.selected, index);
                    } else {
                        game.selected = index;
                        game.moves = getValidMoves(index);
                    }
                } else {
                    game.selected = index;
                    game.moves = getValidMoves(index);
                }
            }
        }
    }

    function movePiece(from, to) {
        const piece = game.board[from];
        const target = game.board[to];
        if (target !== '.') game.captured.push(target);
        game.board[to] = piece;
        game.board[from] = '.';
        game.turn = game.turn === 'white' ? 'black' : 'white';
        game.selected = null;
        game.moves = [];
        
        if (game.turn !== game.player) setTimeout(aiMove, 500);
    }

    function aiMove() {
        let bestScore = -Infinity, bestMove = null;
        const pieces = game.board.map((p, i) => p !== '.' && ((p === p.toUpperCase()) === (game.turn === 'white')) ? i : -1).filter(i => i >= 0);
        
        pieces.forEach(from => {
            const moves = getValidMoves(from);
            moves.forEach(to => {
                const piece = game.board[from], target = game.board[to];
                const score = (target !== '.' ? 9 : 0) + Math.random() * 0.1;
                if (score > bestScore) { bestScore = score; bestMove = { from, to }; }
            });
        });
        
        if (bestMove) movePiece(bestMove.from, bestMove.to);
    }

    function update() {
        game.time[game.turn] -= 1/60;
        if (game.time[game.turn] <= 0) game.state = 'gameover';
    }

    function draw() {
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                ctx.fillStyle = (r + c) % 2 === 0 ? '#f0d9b5' : '#b58863';
                ctx.fillRect(50 + c * 60, 50 + r * 60, 60, 60);
                
                const piece = game.board[r * 8 + c];
                if (piece !== '.') {
                    ctx.fillStyle = piece === piece.toUpperCase() ? '#fff' : '#000';
                    ctx.font = '40px Arial';
                    ctx.fillText(PIECES[piece], 60 + c * 60, 95 + r * 60);
                }
            }
        }
        
        if (game.selected !== null) {
            ctx.strokeStyle = '#f00';
            ctx.lineWidth = 3;
            const sr = Math.floor(game.selected / 8), sc = game.selected % 8;
            ctx.strokeRect(50 + sc * 60, 50 + sr * 60, 60, 60);
        }
        
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(10, 10, 150, 80);
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText(`${game.turn}'s turn - ${Math.ceil(game.time[game.turn])}s`, 20, 30);
        ctx.fillText(`Captured: ${game.captured.length}`, 20, 55);
        ctx.fillText(`Turn: ${game.player}`, 20, 80);
    }

    function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
    initBoard();
    if (typeof window !== 'undefined') window.gameHandleInput = handleInput;
    gameLoop();
})();