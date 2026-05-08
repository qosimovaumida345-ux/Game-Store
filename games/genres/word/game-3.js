class HangmanGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.words = ['JAVASCRIPT', 'PROGRAMMING', 'DEVELOPER', 'COMPUTER', 'KEYBOARD', 'MONITOR', 'SOFTWARE', 'FUNCTION', 'VARIABLE', 'DATABASE'];
        this.targetWord = '';
        this.guessedLetters = [];
        this.wrongGuesses = 0;
        this.maxWrong = 6;
        this.score = 0;
        this.gameState = 'start';
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.targetWord = this.words[Math.floor(Math.random() * this.words.length)];
        this.guessedLetters = [];
        this.wrongGuesses = 0;
        this.score = 0;
        this.gameState = 'playing';
    }

    update() {}

    guessLetter(letter) {
        if (this.gameState !== 'playing') return;
        if (this.guessedLetters.includes(letter)) return;

        this.guessedLetters.push(letter);

        if (!this.targetWord.includes(letter)) {
            this.wrongGuesses++;
            if (this.wrongGuesses >= this.maxWrong) {
                this.gameState = 'lose';
            }
        } else {
            this.score += 20;
            const allRevealed = this.targetWord.split('').every(l => this.guessedLetters.includes(l));
            if (allRevealed) {
                this.score += 100;
                this.gameState = 'win';
            }
        }
    }

    render() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(100, 550);
        this.ctx.lineTo(100, 50);
        this.ctx.lineTo(250, 50);
        this.ctx.lineTo(250, 100);
        this.ctx.stroke();

        if (this.wrongGuesses >= 1) {
            this.ctx.beginPath();
            this.ctx.arc(250, 150, 50, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        if (this.wrongGuesses >= 2) {
            this.ctx.beginPath();
            this.ctx.moveTo(250, 200);
            this.ctx.lineTo(250, 350);
            this.ctx.stroke();
        }
        if (this.wrongGuesses >= 3) {
            this.ctx.beginPath();
            this.ctx.moveTo(250, 250);
            this.ctx.lineTo(200, 300);
            this.ctx.stroke();
        }
        if (this.wrongGuesses >= 4) {
            this.ctx.beginPath();
            this.ctx.moveTo(250, 250);
            this.ctx.lineTo(300, 300);
            this.ctx.stroke();
        }
        if (this.wrongGuesses >= 5) {
            this.ctx.beginPath();
            this.ctx.moveTo(250, 350);
            this.ctx.lineTo(200, 450);
            this.ctx.stroke();
        }
        if (this.wrongGuesses >= 6) {
            this.ctx.beginPath();
            this.ctx.moveTo(250, 350);
            this.ctx.lineTo(300, 450);
            this.ctx.stroke();
        }

        const letterWidth = 40;
        const startX = (this.width - this.targetWord.length * letterWidth) / 2;

        for (let i = 0; i < this.targetWord.length; i++) {
            const letter = this.targetWord[i];
            const x = startX + i * letterWidth;

            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 450);
            this.ctx.lineTo(x + letterWidth, 450);
            this.ctx.stroke();

            if (this.guessedLetters.includes(letter)) {
                this.ctx.fillStyle = '#0f0';
                this.ctx.font = 'bold 24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(letter, x + letterWidth / 2, 440);
            }
        }

        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let row = 0;
        let col = 0;
        const letterSize = 35;
        const startKeyX = 80;
        const startKeyY = 500;

        for (let i = 0; i < alphabet.length; i++) {
            const letter = alphabet[i];
            const x = startKeyX + col * letterSize + 10;
            const y = startKeyY + row * 40;

            const isGuessed = this.guessedLetters.includes(letter);
            const inWord = this.targetWord.includes(letter);

            if (isGuessed) {
                this.ctx.fillStyle = inWord ? '#0a0' : '#a00';
            } else {
                this.ctx.fillStyle = '#444';
            }

            this.ctx.fillRect(x, y, 30, 30);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(letter, x + 15, y + 20);

            col++;
            if (col > 8) {
                col = 0;
                row++;
            }
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
        this.ctx.fillText(`Wrong: ${this.wrongGuesses}/${this.maxWrong}`, 20, 55);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('HANGMAN', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Press A-Z to guess letters', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        } else if (this.gameState === 'win') {
            this.ctx.fillStyle = '#0a0';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('YOU WIN!', this.width / 2, this.height / 2 - 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(`Score: ${this.score}`, this.width / 2, this.height / 2 + 20);
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 60);
        } else if (this.gameState === 'lose') {
            this.ctx.fillStyle = '#a00';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(`Word: ${this.targetWord}`, this.width / 2, this.height / 2 + 20);
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 60);
        }
    }

    handleKeyDown(key) {
        if (key === ' ' && this.gameState !== 'playing') {
            this.start();
        } else if (this.gameState === 'playing' && key.length === 1 && key.match(/[A-Z]/i)) {
            this.guessLetter(key.toUpperCase());
        }
    }

    handleKeyUp(key) {}

    getState() { return { score: this.score, wrong: this.wrongGuesses }; }
    setControllerData(data) {
        if (data.key) this.handleKeyDown(data.key.toUpperCase());
    }
}

window.HangmanGame = HangmanGame;