class SolitaireGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.deck = [];
        this.tableau = [];
        this.foundations = [[], [], [], []];
        this.stock = [];
        this.waste = [];
        this.score = 0;
        this.gameState = 'playing';
        this.selected = null;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.deck = [];
        const suits = ['♥', '♦', '♣', '♠'];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

        for (const suit of suits) {
            for (let i = 0; i < ranks.length; i++) {
                this.deck.push({ suit, rank: ranks[i], value: i + 1, faceUp: false });
            }
        }

        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }

        this.tableau = [];
        for (let col = 0; col < 7; col++) {
            this.tableau[col] = [];
            for (let row = 0; row <= col; row++) {
                const card = this.deck.pop();
                card.faceUp = row === col;
                this.tableau[col].push(card);
            }
        }

        this.stock = this.deck;
        this.waste = [];
        this.foundations = [[], [], [], []];
        this.score = 0;
        this.selected = null;
        this.gameState = 'playing';
    }

    update() {
        if (this.foundations.every(f => f.length === 13)) {
            this.gameState = 'win';
            this.score += 1000;
        }
    }

    handleClick(x, y) {
        if (y < 150 && x > 500) {
            if (this.stock.length > 0) {
                const card = this.stock.pop();
                card.faceUp = true;
                this.waste.push(card);
            } else if (this.waste.length > 0) {
                this.stock = this.waste.reverse().map(c => { c.faceUp = false; return c; });
                this.waste = [];
            }
            return;
        }

        for (let col = 0; col < 7; col++) {
            if (x > 50 + col * 100 && x < 130 + col * 100 && y > 150) {
                const stack = this.tableau[col];
                let clickY = 150;

                for (let i = 0; i < stack.length; i++) {
                    const card = stack[i];
                    if (!card.faceUp) {
                        clickY += 20;
                        continue;
                    }

                    if (y >= clickY && y <= clickY + 80) {
                        if (this.selected) {
                            this.tryMove(this.selected, { col, index: i });
                        } else {
                            this.selected = { col, index: i };
                        }
                        return;
                    }
                    clickY += 40;
                }
            }
        }

        for (let i = 0; i < 4; i++) {
            if (x > 550 + i * 60 && x < 600 + i * 60 && y > 20 && y < 120) {
                if (this.selected) {
                    this.tryMoveToFoundation(this.selected, i);
                }
                return;
            }
        }

        this.selected = null;
    }

    tryMove(from, to) {
        const fromStack = this.tableau[from.col];
        const fromCard = fromStack[from.index];
        const toStack = this.tableau[to.col];

        if (toStack.length === 0) {
            if (fromCard.value === 13) {
                const cards = fromStack.splice(from.index);
                this.tableau[to.col] = this.tableau[to.col].concat(cards);
                this.score += 5;
                if (fromStack.length > 0) fromStack[fromStack.length - 1].faceUp = true;
                this.selected = null;
            }
        } else {
            const toCard = toStack[toStack.length - 1];
            if (toCard.suit !== fromCard.suit && toCard.value === fromCard.value + 1) {
                const cards = fromStack.splice(from.index);
                this.tableau[to.col] = this.tableau[to.col].concat(cards);
                this.score += 10;
                if (fromStack.length > 0) fromStack[fromStack.length - 1].faceUp = true;
                this.selected = null;
            }
        }
    }

    tryMoveToFoundation(from, fIndex) {
        const fromStack = this.tableau[from.col];
        const card = fromStack[from.index];
        const foundation = this.foundations[fIndex];

        if (foundation.length === 0) {
            if (card.value === 1) {
                foundation.push(card);
                fromStack.splice(from.index);
                this.score += 10;
                if (fromStack.length > 0) fromStack[fromStack.length - 1].faceUp = true;
                this.selected = null;
            }
        } else {
            const top = foundation[foundation.length - 1];
            if (top.suit === card.suit && card.value === top.value + 1) {
                foundation.push(card);
                fromStack.splice(from.index);
                this.score += 10;
                if (fromStack.length > 0) fromStack[fromStack.length - 1].faceUp = true;
                this.selected = null;
            }
        }
    }

    render() {
        this.ctx.fillStyle = '#065a2e';
        this.ctx.fillRect(0, 0, this.width, this.height);

        for (let i = 0; i < 4; i++) {
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(550 + i * 60, 20, 50, 80);

            if (this.foundations[i].length > 0) {
                this.drawCard(this.foundations[i][this.foundations[i].length - 1], 550 + i * 60, 20);
            } else {
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '30px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.globalAlpha = 0.3;
                this.ctx.fillText(['♥', '♦', '♣', '♠'][i], 575 + i * 60, 65);
                this.ctx.globalAlpha = 1;
            }
        }

        if (this.stock.length > 0) {
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(650, 20, 50, 80);
            this.ctx.fillStyle = '#ccc';
            this.ctx.fillRect(653, 23, 44, 74);
        } else {
            this.ctx.strokeStyle = '#fff';
            this.ctx.strokeRect(650, 20, 50, 80);
        }

        if (this.waste.length > 0) {
            this.drawCard(this.waste[this.waste.length - 1], 720, 20);
        }

        for (let col = 0; col < 7; col++) {
            let y = 150;
            for (let i = 0; i < this.tableau[col].length; i++) {
                const card = this.tableau[col][i];
                this.drawCard(card, 50 + col * 100, y);

                if (this.selected && this.selected.col === col && this.selected.index === i) {
                    this.ctx.strokeStyle = '#ff0';
                    this.ctx.lineWidth = 3;
                    this.ctx.strokeRect(50 + col * 100 - 2, y - 2, 54, 84);
                }

                y += card.faceUp ? 40 : 20;
            }
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);

        if (this.gameState === 'win') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#ff0';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('YOU WIN!', this.width / 2, this.height / 2);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`Score: ${this.score}`, this.width / 2, this.height / 2 + 50);
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 100);
        }
    }

    drawCard(card, x, y) {
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(x, y, 50, 80);

        if (card.faceUp) {
            const color = card.suit === '♥' || card.suit === '♦' ? '#d00' : '#000';
            this.ctx.fillStyle = color;
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(card.rank, x + 5, y + 20);
            this.ctx.font = '24px Arial';
            this.ctx.fillText(card.suit, x + 5, y + 45);
            this.ctx.textAlign = 'center';
            this.ctx.font = '20px Arial';
            this.ctx.fillText(card.suit, x + 25, y + 65);
        } else {
            this.ctx.fillStyle = '#48f';
            this.ctx.fillRect(x + 3, y + 3, 44, 74);
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(x + 6, y + 6, 38, 68);
        }
    }

    handleKeyDown(key) {
        if (key === ' ' && this.gameState !== 'playing') this.start();
    }

    handleKeyUp(key) {}

    getState() { return { score: this.score }; }

    setControllerData(data) {
        if (data.click) this.handleClick(data.x, data.y);
    }
}

window.SolitaireGame = SolitaireGame;