class WhackAMoleGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.moles = [];
        this.score = 0;
        this.time = 30;
        this.gameState = 'start';
        this.gridSize = 3;
        this.holes = [];
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.score = 0;
        this.time = 30;
        this.moles = [];
        this.gameState = 'playing';
        this.holes = [];

        for (let row = 0; row < this.gridSize; row++) {
            this.holes[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.holes[row][col] = { hasMole: false, up: false };
            }
        }

        const timer = setInterval(() => {
            if (this.gameState === 'playing') {
                this.time--;
                if (this.time <= 0) {
                    this.gameState = 'gameover';
                    clearInterval(timer);
                }
            }
        }, 1000);

        const spawn = setInterval(() => {
            if (this.gameState !== 'playing') {
                clearInterval(spawn);
                return;
            }

            const row = Math.floor(Math.random() * this.gridSize);
            const col = Math.floor(Math.random() * this.gridSize);

            if (!this.holes[row][col].hasMole) {
                this.holes[row][col].hasMole = true;
                this.holes[row][col].up = true;

                setTimeout(() => {
                    if (this.holes[row] && this.holes[row][col]) {
                        this.holes[row][col].up = false;
                    }
                }, 1500 - this.score * 0.01);
            }
        }, 800);
    }

    whack(row, col) {
        if (this.gameState !== 'playing') return;

        if (this.holes[row][col].up) {
            this.holes[row][col].up = false;
            this.holes[row][col].hasMole = false;
            this.score += 10;
        }
    }

    update() {}

    render() {
        this.ctx.fillStyle = '#27ae60';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const cellSize = 150;
        const startX = 100;
        const startY = 100;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const x = startX + col * cellSize;
                const y = startY + row * cellSize;

                this.ctx.fillStyle = '#8B4513';
                this.ctx.beginPath();
                this.ctx.ellipse(x + cellSize / 2, y + cellSize - 20, 50, 20, 0, 0, Math.PI * 2);
                this.ctx.fill();

                const hole = this.holes[row][col];
                if (hole.up) {
                    this.ctx.save();
                    this.ctx.translate(x + cellSize / 2, y + cellSize - 40);

                    this.ctx.fillStyle = '#D2691E';
                    this.ctx.beginPath();
                    this.ctx.ellipse(0, 0, 30, 40, 0, 0, Math.PI * 2);
                    this.ctx.fill();

                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.beginPath();
                    this.ctx.ellipse(0, -30, 20, 15, 0, 0, Math.PI * 2);
                    this.ctx.fill();

                    this.ctx.fillStyle = '#000';
                    this.ctx.beginPath();
                    this.ctx.arc(-8, -35, 4, 0, Math.PI * 2);
                    this.ctx.arc(8, -35, 4, 0, Math.PI * 2);
                    this.ctx.fill();

                    this.ctx.fillStyle = '#ff6666';
                    this.ctx.beginPath();
                    this.ctx.arc(0, -20, 5, 0, Math.PI * 2);
                    this.ctx.fill();

                    this.ctx.restore();
                }

                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(x, y, cellSize, cellSize);
            }
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 40);
        this.ctx.fillText(`Time: ${this.time}s`, 20, 70);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('WHACK-A-MOLE', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Click on moles to whack them!', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        } else if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#f1c40f';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER!', this.width / 2, this.height / 2 - 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 + 20);
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 60);
        }
    }

    handleKeyDown(key) {
        if (key === ' ' && this.gameState !== 'playing') this.start();
    }

    handleKeyUp(key) {}

    getState() { return { score: this.score, time: this.time }; }
    setControllerData(data) {
        if (data.click) {
            const cellSize = 150;
            const row = Math.floor((data.y - 100) / cellSize);
            const col = Math.floor((data.x - 100) / cellSize);
            if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
                this.whack(row, col);
            }
        }
    }
}

window.WhackAMoleGame = WhackAMoleGame;