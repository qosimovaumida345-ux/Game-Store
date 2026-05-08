class TypingGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.words = [];
        this.score = 0;
        this.lives = 5;
        this.gameState = 'start';
        this.currentInput = '';
        this.wordSpawnTimer = 0;
        this.level = 1;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.gameState = 'playing';
        this.score = 0;
        this.lives = 5;
        this.level = 1;
        this.words = [];
        this.currentInput = '';
        this.wordSpawnTimer = 0;
    }

    update() {
        if (this.gameState !== 'playing') return;

        this.wordSpawnTimer++;
        const spawnRate = Math.max(30, 120 - this.level * 10);

        if (this.wordSpawnTimer > spawnRate) {
            this.wordSpawnTimer = 0;
            const wordList = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'own', 'say', 'she', 'too', 'use', 'code', 'game', 'play', 'test', 'type', 'fast', 'quick', 'word', 'task', 'work', 'time', 'data', 'byte', 'loop', 'func', 'array', 'class', 'async', 'await', 'export', 'import', 'module', 'return', 'switch', 'catch', 'while', 'const', 'break', 'default', 'delete', 'export', 'finally'];
            const word = wordList[Math.floor(Math.random() * wordList.length)];
            this.words.push({
                word: word,
                x: Math.random() * (this.width - 150) + 50,
                y: -30,
                speed: 1 + this.level * 0.2
            });
        }

        for (const w of this.words) {
            w.y += w.speed;
        }

        for (let i = this.words.length - 1; i >= 0; i--) {
            const w = this.words[i];
            if (w.y > this.height) {
                this.lives--;
                this.words.splice(i, 1);
                if (this.lives <= 0) this.gameState = 'gameover';
            } else if (this.currentInput === w.word) {
                this.score += w.word.length * 10;
                this.words.splice(i, 1);
                this.currentInput = '';

                if (this.score > this.level * 200) this.level++;
            } else if (this.currentInput.length > 0 && w.word.startsWith(this.currentInput)) {
                w.highlight = true;
            } else {
                w.highlight = false;
            }
        }
    }

    render() {
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 2;
        for (let x = 0; x < this.width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.height; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }

        for (const w of this.words) {
            this.ctx.font = 'bold 24px monospace';
            const highlightColor = w.highlight ? '#0f0' : '#fff';
            this.ctx.fillStyle = highlightColor;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(w.word, w.x, w.y);
        }

        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, this.height - 60, this.width, 60);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 32px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.currentInput + '_', this.width / 2, this.height - 20);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 35);
        this.ctx.fillText(`Level: ${this.level}`, 20, 60);

        this.ctx.fillStyle = '#f00';
        this.ctx.fillText(`Lives: ${'♥'.repeat(this.lives)}`, this.width - 150, 35);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('TYPING GAME', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Type the falling words!', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        } else if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#f00';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`Score: ${this.score}`, this.width / 2, this.height / 2 + 20);
            this.ctx.fillText(`Level: ${this.level}`, this.width / 2, this.height / 2 + 50);
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 90);
        }
    }

    handleKeyDown(key) {
        if (key === ' ' && this.gameState !== 'playing') {
            this.start();
            return;
        }

        if (this.gameState !== 'playing') return;

        if (key.length === 1 && key.match(/[a-zA-Z]/)) {
            this.currentInput += key.toLowerCase();
        } else if (key === 'Backspace') {
            this.currentInput = this.currentInput.slice(0, -1);
        } else if (key === 'Escape') {
            this.currentInput = '';
        }
    }

    handleKeyUp(key) {}

    getState() { return { score: this.score, level: this.level, lives: this.lives }; }
    setControllerData(data) {
        if (data.key) this.handleKeyDown(data.key);
    }
}

window.TypingGame = TypingGame;