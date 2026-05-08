class WordleGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.guesses = [];
        this.currentGuess = '';
        this.targetWord = 'GAME';
        this.gameState = 'playing';
        this.score = 0;
        this.maxGuesses = 6;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.start();
    }

    start() {
        const words = ['CODE', 'GAME', 'PLAY', 'TEST', 'WORD', 'TIME', 'DATA', 'LOOP', 'FUNC', 'ARRAY', 'CLASS', 'OBJECT', 'STRING', 'NUMBER', 'INPUT', 'OUTPUT', 'PIXEL', 'SOUND', 'IMAGE', 'FRAME'];
        this.targetWord = words[Math.floor(Math.random() * words.length)];
        this.guesses = [];
        this.currentGuess = '';
        this.gameState = 'playing';
        this.score = 0;
    }

    update() {}

    handleKey(key) {
        if (this.gameState !== 'playing') return;

        if (key.length === 1 && key.match(/[A-Z]/) && this.currentGuess.length < 5) {
            this.currentGuess += key;
        } else if (key === 'Backspace') {
            this.currentGuess = this.currentGuess.slice(0, -1);
        } else if (key === 'Enter' && this.currentGuess.length === 5) {
            this.guesses.push(this.currentGuess);

            if (this.currentGuess === this.targetWord) {
                this.gameState = 'win';
                this.score = (this.maxGuesses - this.guesses.length + 1) * 100;
            } else if (this.guesses.length >= this.maxGuesses) {
                this.gameState = 'lose';
            }

            this.currentGuess = '';
        }
    }

    getLetterColor(letter, pos) {
        if (this.targetWord[pos] === letter) return '#6aaa64';
        if (this.targetWord.includes(letter)) return '#c9b458';
        return '#787c7e';
    }

    render() {
        this.ctx.fillStyle = '#121213';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const cellSize = 50;
        const startX = 275;
        const startY = 100;

        for (let i = 0; i < this.maxGuesses; i++) {
            for (let j = 0; j < 5; j++) {
                const guess = this.guesses[i] || (i === this.guesses.length ? this.currentGuess : '');
                const letter = guess[j] || '';
                const x = startX + j * (cellSize + 5);
                const y = startY + i * (cellSize + 5);

                let bgColor = '#3a3a3c';
                if (i < this.guesses.length) {
                    bgColor = this.getLetterColor(letter, j);
                } else if (i === this.guesses.length && letter) {
                    bgColor = '#565758';
                }

                this.ctx.fillStyle = bgColor;
                this.ctx.fillRect(x, y, cellSize, cellSize);

                if (letter) {
                    this.ctx.fillStyle = '#fff';
                    this.ctx.font = 'bold 28px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(letter, x + cellSize / 2, y + cellSize / 2 + 10);
                }
            }
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);

        if (this.gameState === 'win') {
            this.ctx.fillStyle = '#6aaa64';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('YOU WIN!', this.width / 2, this.height - 80);
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Score: ${this.score}`, this.width / 2, this.height - 40);
        } else if (this.gameState === 'lose') {
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height - 80);
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Word: ${this.targetWord}`, this.width / 2, this.height - 40);
        }

        if (this.gameState !== 'playing') {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height - 15);
        }
    }

    handleKeyDown(key) {
        if (key === ' ' && this.gameState !== 'playing') {
            this.start();
        } else {
            this.handleKey(key.toUpperCase());
        }
    }

    handleKeyUp(key) {}

    getState() { return { score: this.score }; }
    setControllerData(data) {
        if (data.key) this.handleKeyDown(data.key.toUpperCase());
    }
}

window.WordleGame = WordleGame;