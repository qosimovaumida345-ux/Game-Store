class BoggleGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.board = [];
        this.foundWords = [];
        this.score = 0;
        this.time = 60;
        this.gameState = 'start';
        this.selected = [];
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.score = 0;
        this.time = 60;
        this.foundWords = [];
        this.selected = [];
        this.gameState = 'playing';

        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        this.board = [];
        for (let i = 0; i < 4; i++) {
            this.board[i] = [];
            for (let j = 0; j < 4; j++) {
                this.board[i][j] = letters[Math.floor(Math.random() * 26)];
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
    }

    update() {}

    handleClick(x, y) {
        if (this.gameState !== 'playing') return;

        const cellSize = 100;
        const offsetX = 150;
        const offsetY = 100;

        const col = Math.floor((x - offsetX) / cellSize);
        const row = Math.floor((y - offsetY) / cellSize);

        if (row < 0 || row > 3 || col < 0 || col > 3) return;

        if (this.selected.length > 0) {
            const last = this.selected[this.selected.length - 1];
            const dr = Math.abs(row - last.row);
            const dc = Math.abs(col - last.col);
            if (dr > 1 || dc > 1) return;

            for (const s of this.selected) {
                if (s.row === row && s.col === col) return;
            }
        }

        this.selected.push({ row, col, letter: this.board[row][col] });
    }

    submitWord() {
        if (this.selected.length < 3) {
            this.selected = [];
            return;
        }

        const word = this.selected.map(s => s.letter).join('');

        if (this.foundWords.includes(word)) {
            this.selected = [];
            return;
        }

        const validWords = ['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HAD', 'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW', 'ITS', 'MAY', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'WHO', 'BOY', 'DID', 'OWN', 'SAY', 'SHE', 'TOO', 'USE', 'CODE', 'GAME', 'PLAY', 'TEST', 'TYPE', 'FAST', 'WORD', 'TIME', 'DATA', 'LOOP', 'FUNC', 'ARRAY', 'CLASS', 'WHILE', 'CONST', 'BREAK', 'SWITCH', 'CATCH', 'RETURN', 'IMPORT', 'EXPORT', 'MODULE', 'DEFAULT', 'DELETE', 'FINALLY', 'CONTINUE', 'FUNCTION', 'VARIABLE', 'OBJECT', 'STRING', 'NUMBER', 'BOOLEAN'];

        if (validWords.includes(word)) {
            this.foundWords.push(word);
            this.score += word.length * 10;
            if (word.length >= 6) this.score += 20;
        }

        this.selected = [];
    }

    render() {
        this.ctx.fillStyle = '#f5deb3';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const cellSize = 100;
        const offsetX = 150;
        const offsetY = 100;

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const x = offsetX + j * cellSize;
                const y = offsetY + i * cellSize;

                let isSelected = false;
                for (const s of this.selected) {
                    if (s.row === i && s.col === j) isSelected = true;
                }

                this.ctx.fillStyle = isSelected ? '#dcb' : '#fff';
                this.ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);

                this.ctx.fillStyle = '#333';
                this.ctx.font = 'bold 40px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(this.board[i][j], x + cellSize / 2, y + cellSize / 2 + 15);
            }
        }

        const currentWord = this.selected.map(s => s.letter).join('');
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(150, 50, 400, 40);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(currentWord + '_', 350, 78);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
        this.ctx.fillText(`Time: ${this.time}s`, 20, 55);

        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(500, 100, 280, 400);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Found Words:', 510, 130);

        let wordY = 160;
        for (const word of this.foundWords) {
            this.ctx.fillText(word, 510, wordY);
            wordY += 25;
            if (wordY > 480) break;
        }

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('BOGGLE', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Click letters to form words', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        } else if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 30);
            this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 + 20);
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 60);
        }
    }

    handleKeyDown(key) {
        if (key === 'Enter' || key === 'z' || key === 'Z') this.submitWord();
        if (key === 'Escape' || key === 'x' || key === 'X') this.selected = [];
        if (key === ' ' && this.gameState !== 'playing') this.start();
    }

    handleKeyUp(key) {}

    getState() { return { score: this.score, time: this.time }; }

    setControllerData(data) {
        if (data.click) this.handleClick(data.x, data.y);
        if (data.action) this.submitWord();
    }
}

window.BoggleGame = BoggleGame;