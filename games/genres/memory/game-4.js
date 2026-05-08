class MemoryMatchGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.cards = [];
        this.flipped = [];
        this.matched = [];
        this.score = 0;
        this.moves = 0;
        this.gameState = 'start';
        this.pairs = 8;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.score = 0;
        this.moves = 0;
        this.flipped = [];
        this.matched = [];
        this.gameState = 'playing';

        const symbols = ['🍎', '🍌', '🍇', '🍊', '🍓', '🍑', '🥝', '🍒'];
        this.cards = [];

        for (let i = 0; i < this.pairs; i++) {
            this.cards.push({ id: i, symbol: symbols[i], matched: false, reveal: 0 });
            this.cards.push({ id: i, symbol: symbols[i], matched: false, reveal: 0 });
        }

        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    update() {
        if (this.gameState !== 'playing') return;

        for (const card of this.cards) {
            if (card.reveal > 0) card.reveal--;
        }

        if (this.flipped.length === 2) {
            const [c1, c2] = this.flipped;

            if (c1.symbol === c2.symbol) {
                c1.matched = true;
                c2.matched = true;
                this.matched.push(c1, c2);
                this.score += 100;
                this.flipped = [];
            } else {
                setTimeout(() => {
                    c1.reveal = 0;
                    c2.reveal = 0;
                    this.flipped = [];
                }, 1000);
            }

            this.moves++;

            if (this.matched.length === this.cards.length) {
                this.gameState = 'win';
                this.score += Math.max(0, 500 - this.moves * 10);
            }
        }
    }

    handleClick(x, y) {
        if (this.gameState !== 'playing' || this.flipped.length >= 2) return;

        const cardWidth = 80;
        const cardHeight = 100;
        const offsetX = 80;
        const offsetY = 100;
        const gap = 20;

        for (let i = 0; i < this.cards.length; i++) {
            const col = i % 4;
            const row = Math.floor(i / 4);

            const cx = offsetX + col * (cardWidth + gap);
            const cy = offsetY + row * (cardHeight + gap);

            if (x > cx && x < cx + cardWidth && y > cy && y < cy + cardHeight) {
                const card = this.cards[i];
                if (!card.matched && card.reveal === 0) {
                    card.reveal = 1;
                    this.flipped.push(card);
                }
                break;
            }
        }
    }

    render() {
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const cardWidth = 80;
        const cardHeight = 100;
        const offsetX = 80;
        const offsetY = 100;
        const gap = 20;

        for (let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i];
            const col = i % 4;
            const row = Math.floor(i / 4);

            const cx = offsetX + col * (cardWidth + gap);
            const cy = offsetY + row * (cardHeight + gap);

            this.ctx.fillStyle = card.reveal === 1 || card.matched ? '#ecf0f1' : '#3498db';
            this.ctx.fillRect(cx, cy, cardWidth, cardHeight);

            if (card.reveal === 1 || card.matched) {
                this.ctx.fillStyle = '#e74c3c';
                this.ctx.font = '40px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(card.symbol, cx + cardWidth / 2, cy + cardHeight / 2 + 15);
            } else {
                this.ctx.fillStyle = '#2980b9';
                this.ctx.fillRect(cx + 10, cy + 35, cardWidth - 20, 30);
            }
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
        this.ctx.fillText(`Moves: ${this.moves}`, 20, 55);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('MEMORY MATCH', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Click cards to find matching pairs', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        } else if (this.gameState === 'win') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#2ecc71';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('YOU WIN!', this.width / 2, this.height / 2 - 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Score: ${this.score}`, this.width / 2, this.height / 2 + 20);
            this.ctx.fillText(`Moves: ${this.moves}`, this.width / 2, this.height / 2 + 50);
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 90);
        }
    }

    handleKeyDown(key) {
        if (key === ' ' && this.gameState !== 'playing') this.start();
    }

    handleKeyUp(key) {}

    getState() { return { score: this.score, moves: this.moves }; }

    setControllerData(data) {
        if (data.click) this.handleClick(data.x, data.y);
    }
}

window.MemoryMatchGame = MemoryMatchGame;