class SnakeLaddersGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.players = [];
        this.currentPlayer = 0;
        this.diceValue = 0;
        this.diceRolling = false;
        this.gameState = 'start';
        this.score = 0;
        this.snakes = { 99: 10, 70: 30, 52: 20, 25: 5, 95: 40, 80: 20 };
        this.ladders = { 3: 20, 8: 30, 15: 40, 22: 55, 35: 70, 50: 80, 65: 90, 42: 60 };
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.players = [
            { pos: 1, x: 0, y: 0, color: '#f44', name: 'P1' },
            { pos: 1, x: 0, y: 0, color: '#44f', name: 'P2' }
        ];
        this.currentPlayer = 0;
        this.diceValue = 0;
        this.gameState = 'playing';
        this.updatePositions();
    }

    update() {}

    rollDice() {
        if (this.diceRolling) return;
        this.diceRolling = true;
        this.diceValue = 0;

        let rolls = 0;
        const rollInterval = setInterval(() => {
            this.diceValue = Math.floor(Math.random() * 6) + 1;
            rolls++;
            if (rolls >= 10) {
                clearInterval(rollInterval);
                this.diceRolling = false;
                this.movePlayer();
            }
        }, 100);
    }

    movePlayer() {
        const player = this.players[this.currentPlayer];
        player.pos += this.diceValue;

        if (player.pos >= 100) {
            player.pos = 100;
            this.gameState = 'win';
            this.score = 1000;
            return;
        }

        if (this.snakes[player.pos]) {
            player.pos = this.snakes[player.pos];
        } else if (this.ladders[player.pos]) {
            player.pos = this.ladders[player.pos];
        }

        this.updatePositions();
        this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
    }

    updatePositions() {
        for (const p of this.players) {
            const row = Math.floor((p.pos - 1) / 10);
            const col = (p.pos - 1) % 10;
            p.y = 520 - row * 50;
            p.x = (row % 2 === 0) ? 50 + col * 70 : 750 - col * 70;
        }
    }

    render() {
        this.ctx.fillStyle = '#264';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const cellSize = 70;
        const offsetX = 50;
        const offsetY = 30;

        for (let i = 0; i < 100; i++) {
            const row = Math.floor(i / 10);
            const col = i % 10;
            const x = (row % 2 === 0) ? offsetX + col * cellSize : offsetX + (9 - col) * cellSize;
            const y = offsetY + row * 50;

            this.ctx.fillStyle = (i + 1) % 2 === 0 ? '#375' : '#486';
            this.ctx.fillRect(x, y, cellSize - 2, 48);

            if (this.snakes[i + 1]) {
                this.ctx.fillStyle = '#f00';
                this.ctx.beginPath();
                this.ctx.moveTo(x + cellSize / 2, y + 48);
                this.ctx.lineTo(x + 10, y);
                this.ctx.lineTo(x + cellSize - 10, y);
                this.ctx.fill();
            }

            if (this.ladders[i + 1]) {
                this.ctx.fillStyle = '#0a0';
                this.ctx.fillRect(x + cellSize / 2 - 3, y, 6, 48);
                for (let r = 0; r < 4; r++) {
                    this.ctx.strokeStyle = '#0a0';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(x + cellSize / 2 - 3, y + r * 12);
                    this.ctx.lineTo(x + cellSize / 2 + (r % 2 === 0 ? 15 : -15), y + 6 + r * 12);
                    this.ctx.stroke();
                }
            }

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(i + 1, x + cellSize / 2, y + 44);
        }

        for (const p of this.players) {
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x + cellSize / 2 - 15, p.y + 24, 12, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.fillText(p.name, p.x + cellSize / 2 - 15, p.y + 28);
        }

        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(600, 50, 180, 200);
        this.ctx.strokeStyle = '#888';
        this.ctx.strokeRect(600, 50, 180, 200);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Current: ${this.players[this.currentPlayer].name}`, 690, 80);

        this.ctx.fillStyle = '#ccc';
        this.ctx.fillRect(630, 120, 120, 60);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 40px Arial';
        this.ctx.fillText(this.diceValue || '🎲', 690, 165);

        this.ctx.fillStyle = '#4a4';
        this.ctx.fillRect(630, 200, 120, 40);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('ROLL (Z)', 690, 225);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('SNAKE & LADDER', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 20);
        } else if (this.gameState === 'win') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#ff0';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            const winner = this.players[this.currentPlayer];
            this.ctx.fillText(`${winner.name} WINS!`, this.width / 2, this.height / 2 - 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 30);
        }
    }

    handleKeyDown(key) {
        if ((key === 'z' || key === 'Z' || key === ' ') && this.gameState === 'playing' && !this.diceRolling) {
            this.rollDice();
        }
        if (key === ' ' && this.gameState !== 'playing') {
            this.start();
        }
    }

    handleKeyUp(key) {}

    getState() { return { players: this.players }; }
    setControllerData(data) {
        if (data.action) this.handleKeyDown('z');
    }
}

window.SnakeLaddersGame = SnakeLaddersGame;