class SnakeLadders3Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 600;
        this.height = 700;
        this.cellSize = 50;
        this.gridSize = 10;
        this.board = [];
        this.snakes = [];
        this.ladders = [];
        this.players = [];
        this.currentPlayer = 0;
        this.gameState = 'start';
        this.winner = null;
        this.diceValue = 0;
        this.rolling = false;
        this.animatingToken = null;
        this.particles = [];
        this.diceAnimationFrame = 0;
        this.moveHistory = [];
        this.turnCount = 0;
        this.snakeHeadImages = new Map();
        this.ladderRungs = [];
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.setupBoard();
        this.setupSnakesAndLadders();
        this.setupPlayers();
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
    }

    setupBoard() {
        this.board = [];
        let num = 1;
        for (let row = this.gridSize - 1; row >= 0; row--) {
            this.board[row] = [];
            if (row % 2 === 1) {
                for (let col = this.gridSize - 1; col >= 0; col--) {
                    this.board[row][col] = num++;
                }
            } else {
                for (let col = 0; col < this.gridSize; col++) {
                    this.board[row][col] = num++;
                }
            }
        }
    }

    setupSnakesAndLadders() {
        this.snakes = [
            { head: 99, tail: 54, color: '#ff4444' },
            { head: 70, tail: 55, color: '#ff6644' },
            { head: 52, tail: 29, color: '#ff8844' },
            { head: 25, tail: 2, color: '#ffaa44' },
            { head: 95, tail: 72, color: '#ff4466' },
            { head: 64, tail: 19, color: '#ff6688' },
            { head: 47, tail: 16, color: '#ff88aa' },
            { head: 76, tail: 58, color: '#ff4466' },
            { head: 38, tail: 20, color: '#ff6666' },
            { head: 88, tail: 67, color: '#ff8844' },
            { head: 91, tail: 73, color: '#ffaa66' },
            { head: 83, tail: 62, color: '#ff4466' }
        ];

        this.ladders = [
            { start: 4, end: 25, color: '#44aa44' },
            { start: 13, end: 31, color: '#44cc44' },
            { start: 21, end: 42, color: '#44ee44' },
            { start: 33, end: 52, color: '#66ff66' },
            { start: 40, end: 55, color: '#44aa44' },
            { start: 51, end: 67, color: '#44cc44' },
            { start: 62, end: 81, color: '#44ee44' },
            { start: 74, end: 93, color: '#66ff66' },
            { start: 79, end: 99, color: '#88ff88' },
            { start: 43, end: 58, color: '#44aa44' },
            { start: 27, end: 44, color: '#44cc44' },
            { start: 12, end: 32, color: '#44ee44' }
        ];

        this.calculateLadderRungs();
    }

    calculateLadderRungs() {
        this.ladderRungs = [];
        for (const ladder of this.ladders) {
            const startPos = this.getPositionFromNumber(ladder.start);
            const endPos = this.getPositionFromNumber(ladder.end);
            const numRungs = Math.abs(ladder.end - ladder.start) / 5 + 2;

            for (let i = 0; i <= numRungs; i++) {
                const t = i / numRungs;
                const x = startPos.x + (endPos.x - startPos.x) * t;
                const y = startPos.y + (endPos.y - startPos.y) * t;
                ladder.rungs = ladder.rungs || [];
                if (i === 0 || i === numRungs) {
                    ladder.rungs.push({ x, y });
                }
            }
        }
    }

    setupPlayers() {
        this.players = [
            { name: 'Player 1', color: '#3498db', position: 0, isHuman: true, history: [] },
            { name: 'Player 2', color: '#e74c3c', position: 0, isHuman: false, history: [] },
            { name: 'Player 3', color: '#2ecc71', position: 0, isHuman: true, history: [] },
            { name: 'Player 4', color: '#9b59b6', position: 0, isHuman: false, history: [] }
        ];
        this.currentPlayer = 0;
        this.turnCount = 0;
    }

    getPositionFromNumber(num) {
        if (num <= 0) {
            return { x: -1, y: -1 };
        }
        const row = Math.floor((num - 1) / this.gridSize);
        const colInRow = (num - 1) % this.gridSize;
        const actualCol = row % 2 === 0 ? colInRow : this.gridSize - 1 - colInRow;
        return {
            x: actualCol * this.cellSize + this.cellSize / 2,
            y: (this.gridSize - 1 - row) * this.cellSize + this.cellSize / 2
        };
    }

    handleClick(e) {
        if (this.gameState === 'start') {
            this.gameState = 'playing';
            return;
        }

        if (this.gameState === 'gameover') {
            this.resetGame();
            return;
        }

        if (this.gameState === 'rolling') return;

        const current = this.players[this.currentPlayer];
        if (!current.isHuman) return;

        this.rollDice();
    }

    rollDice() {
        this.rolling = true;
        this.diceAnimationFrame = 0;
        this.animateDiceRoll();
    }

    animateDiceRoll() {
        this.diceAnimationFrame++;
        this.diceValue = Math.floor(Math.random() * 6) + 1;

        if (this.diceAnimationFrame < 20) {
            requestAnimationFrame(() => this.animateDiceRoll());
        } else {
            this.rolling = false;
            this.movePlayer(this.currentPlayer);
        }
    }

    movePlayer(playerIndex) {
        const player = this.players[playerIndex];
        const newPosition = player.position + this.diceValue;

        if (newPosition > 100) {
            this.spawnParticles(this.getPositionFromNumber(100).x + 25, this.getPositionFromNumber(100).y + 100, '#ff0000');
            this.announceMessage('Need exact roll to win!');
            this.nextTurn();
            return;
        }

        player.position = newPosition;
        player.history.push({ roll: this.diceValue, position: newPosition });
        this.moveHistory.push({ player: playerIndex, position: newPosition });

        this.spawnParticles(
            this.getPositionFromNumber(newPosition).x + 25,
            this.getPositionFromNumber(newPosition).y + 100,
            player.color
        );

        const snake = this.snakes.find(s => s.head === newPosition);
        if (snake) {
            setTimeout(() => {
                player.position = snake.tail;
                player.history.push({ roll: 0, position: snake.tail, snakeSlides: true });
                this.spawnParticles(
                    this.getPositionFromNumber(snake.tail).x + 25,
                    this.getPositionFromNumber(snake.tail).y + 100,
                    '#ff4444'
                );
                this.announceMessage(`${player.name} hit a snake! Slides down to ${snake.tail}`);
                this.checkWinCondition();
                if (this.gameState === 'playing') this.nextTurn();
            }, 500);
            return;
        }

        const ladder = this.ladders.find(l => l.start === newPosition);
        if (ladder) {
            setTimeout(() => {
                player.position = ladder.end;
                player.history.push({ roll: 0, position: ladder.end, ladderClimbs: true });
                this.spawnParticles(
                    this.getPositionFromNumber(ladder.end).x + 25,
                    this.getPositionFromNumber(ladder.end).y + 100,
                    '#44ff44'
                );
                this.announceMessage(`${player.name} found a ladder! Climbs up to ${ladder.end}`);
                this.checkWinCondition();
                if (this.gameState === 'playing') this.nextTurn();
            }, 500);
            return;
        }

        this.checkWinCondition();
        if (this.gameState === 'playing') {
            this.nextTurn();
        }
    }

    announceMessage(msg) {
        this.currentMessage = msg;
        setTimeout(() => {
            if (this.currentMessage === msg) {
                this.currentMessage = null;
            }
        }, 2000);
    }

    checkWinCondition() {
        for (const player of this.players) {
            if (player.position === 100) {
                this.gameState = 'gameover';
                this.winner = player;
                this.spawnConfetti();
            }
        }
    }

    nextTurn() {
        this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
        this.turnCount++;

        if (this.currentPlayer !== 0 && !this.players[this.currentPlayer].isHuman) {
            setTimeout(() => this.rollDice(), 1000);
        }
    }

    resetGame() {
        for (const player of this.players) {
            player.position = 0;
            player.history = [];
        }
        this.currentPlayer = 0;
        this.turnCount = 0;
        this.diceValue = 0;
        this.winner = null;
        this.moveHistory = [];
        this.gameState = 'playing';
    }

    spawnParticles(x, y, color) {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                life: 1,
                decay: 0.02 + Math.random() * 0.02,
                size: 3 + Math.random() * 4,
                color
            });
        }
    }

    spawnConfetti() {
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * this.width;
            const colors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff'];
            this.particles.push({
                x, y: 0,
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * 3 + 1,
                life: 1,
                decay: 0.005,
                size: 5 + Math.random() * 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            if (p.rotation !== undefined) {
                p.rotation += p.rotationSpeed;
            }
            p.life -= p.decay;
            if (p.life <= 0 || p.y > this.height) {
                this.particles.splice(i, 1);
            }
        }
    }

    start() {
        this.setupBoard();
        this.setupSnakesAndLadders();
        this.setupPlayers();
        this.gameState = 'playing';
    }

    update() {
        if (this.gameState !== 'playing') return;
        this.updateParticles();

        if (!this.players[this.currentPlayer].isHuman && !this.rolling && this.gameState === 'playing') {
            if (this.diceValue === 0) {
                setTimeout(() => this.rollDice(), 1000);
            }
        }
    }

    render() {
        this.renderBoard();
        this.renderSnakes();
        this.renderLadders();
        this.renderNumbers();
        this.renderPlayers();
        this.renderUI();
        this.renderParticles();
    }

    renderBoard() {
        this.ctx.fillStyle = '#f5f5dc';
        this.ctx.fillRect(0, 0, this.width, this.height);

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const x = col * this.cellSize;
                const y = row * this.cellSize;

                if ((row + col) % 2 === 0) {
                    this.ctx.fillStyle = '#ffe4b5';
                } else {
                    this.ctx.fillStyle = '#deb887';
                }
                this.ctx.fillRect(x, y, this.cellSize, this.cellSize);

                this.ctx.strokeStyle = '#8b7355';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);
            }
        }
    }

    renderNumbers() {
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#666';

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const num = this.board[row][col];
                const pos = this.getPositionFromNumber(num);
                this.ctx.fillText(num.toString(), pos.x, pos.y);
            }
        }
    }

    renderSnakes() {
        for (const snake of this.snakes) {
            const startPos = this.getPositionFromNumber(snake.head);
            const endPos = this.getPositionFromNumber(snake.tail);

            this.ctx.beginPath();
            this.ctx.moveTo(startPos.x + this.cellSize / 2, startPos.y + 50);

            const midY = (startPos.y + endPos.y) / 2 + 50;
            const controlOffset = 50;

            this.ctx.quadraticCurveTo(
                startPos.x + this.cellSize / 2 + controlOffset,
                midY,
                endPos.x + this.cellSize / 2,
                endPos.y + 50
            );

            this.ctx.strokeStyle = snake.color;
            this.ctx.lineWidth = 8;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();

            this.ctx.strokeStyle = '#aa2222';
            this.ctx.lineWidth = 4;
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.arc(startPos.x + this.cellSize / 2, startPos.y + 50, 8, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ff6666';
            this.ctx.fill();
            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc(startPos.x + this.cellSize / 2 + 2, startPos.y + 48, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    renderLadders() {
        for (const ladder of this.ladders) {
            const startPos = this.getPositionFromNumber(ladder.start);
            const endPos = this.getPositionFromNumber(ladder.end);

            const dx = endPos.x - startPos.x;
            const dy = endPos.y - startPos.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const perpX = -dy / len * 10;
            const perpY = dx / len * 10;

            this.ctx.beginPath();
            this.ctx.moveTo(startPos.x + this.cellSize / 2 + perpX, startPos.y + 50 + perpY);
            this.ctx.lineTo(endPos.x + this.cellSize / 2 + perpX, endPos.y + 50 + perpY);
            this.ctx.strokeStyle = ladder.color;
            this.ctx.lineWidth = 4;
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(startPos.x + this.cellSize / 2 - perpX, startPos.y + 50 - perpY);
            this.ctx.lineTo(endPos.x + this.cellSize / 2 - perpX, endPos.y + 50 - perpY);
            this.ctx.stroke();

            const numRungs = 5;
            for (let i = 1; i < numRungs; i++) {
                const t = i / numRungs;
                const rungX = startPos.x + dx * t + this.cellSize / 2;
                const rungY = startPos.y + dy * t + 50;
                this.ctx.beginPath();
                this.ctx.moveTo(rungX + perpX, rungY + perpY);
                this.ctx.lineTo(rungX - perpX, rungY - perpY);
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
            }
        }
    }

    renderPlayers() {
        const playerOffsets = [
            { dx: -8, dy: -8 },
            { dx: 8, dy: -8 },
            { dx: -8, dy: 8 },
            { dx: 8, dy: 8 }
        ];

        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            const pos = this.getPositionFromNumber(player.position);
            const offset = playerOffsets[i];

            if (player.position > 0) {
                this.ctx.beginPath();
                this.ctx.arc(pos.x + 25 + offset.dx, pos.y + 50 + offset.dy, 12, 0, Math.PI * 2);
                this.ctx.fillStyle = player.color;
                this.ctx.fill();
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();

                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText((i + 1).toString(), pos.x + 25 + offset.dx, pos.y + 50 + offset.dy);
            } else {
                this.ctx.fillStyle = player.color;
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(player.name, 10, 520 + i * 15);
                this.ctx.beginPath();
                this.ctx.arc(5, 517 + i * 15, 5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }

    renderUI() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(0, this.height - 150, this.width, 150);

        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SNAKE & LADDER III', this.width / 2, this.height - 115);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Turn ${this.turnCount + 1}`, this.width / 2, this.height - 85);

        const current = this.players[this.currentPlayer];
        this.ctx.fillStyle = current.color;
        this.ctx.fillText(`${current.name}'s Turn`, this.width / 2, this.height - 60);

        this.ctx.fillStyle = '#aaa';
        this.ctx.font = '12px Arial';
        if (current.isHuman) {
            this.ctx.fillText('Click to Roll Dice', this.width / 2, this.height - 35);
        } else {
            this.ctx.fillText('AI is rolling...', this.width / 2, this.height - 35);
        }

        this.renderDice();

        if (this.currentMessage) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(this.width / 2 - 150, this.height / 2 - 30, 300, 60);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.currentMessage, this.width / 2, this.height / 2);
        }

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('SNAKE & LADDER III', this.width / 2, this.height / 2 - 80);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Classic board game with 4 players', this.width / 2, this.height / 2 - 30);
            this.ctx.fillText('Roll dice and move your token', this.width / 2, this.height / 2);
            this.ctx.fillText('Hit a ladder? Climb up!', this.width / 2, this.height / 2 + 30);
            this.ctx.fillText('Hit a snake? Slide down!', this.width / 2, this.height / 2 + 60);

            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Click to Start', this.width / 2, this.height / 2 + 110);
        }

        if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CONGRATULATIONS!', this.width / 2, this.height / 2 - 60);

            this.ctx.fillStyle = this.winner.color;
            this.ctx.font = 'bold 28px Arial';
            this.ctx.fillText(`${this.winner.name} WINS!`, this.width / 2, this.height / 2);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Completed in ${this.turnCount} turns`, this.width / 2, this.height / 2 + 40);

            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Click to Play Again', this.width / 2, this.height / 2 + 90);
        }
    }

    renderDice() {
        const diceX = this.width / 2 - 25;
        const diceY = this.height - 140;
        const diceSize = 50;

        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(diceX, diceY, diceSize, diceSize);
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(diceX, diceY, diceSize, diceSize);

        this.ctx.fillStyle = '#333';
        const dotRadius = 4;
        const dots = {
            1: [[0.5, 0.5]],
            2: [[0.25, 0.25], [0.75, 0.75]],
            3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
            4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
            5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
            6: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.5], [0.75, 0.5], [0.25, 0.75], [0.75, 0.75]]
        };

        for (const [px, py] of dots[this.diceValue]) {
            this.ctx.beginPath();
            this.ctx.arc(diceX + px * diceSize, diceY + py * diceSize, dotRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    renderParticles() {
        for (const p of this.particles) {
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            if (p.rotation !== undefined) {
                this.ctx.rotate(p.rotation);
            }
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            this.ctx.globalAlpha = 1;
            this.ctx.restore();
        }
    }
}

window.SnakeLadders3Game = SnakeLadders3Game;
