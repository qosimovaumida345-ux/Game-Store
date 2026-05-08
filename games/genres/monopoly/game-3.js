class Monopoly3Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 900;
        this.height = 700;
        this.board = [];
        this.properties = [];
        this.players = [];
        this.currentPlayer = 0;
        this.gameState = 'start';
        this.diceValue = [0, 0];
        this.rolling = false;
        this.diceAnimationFrame = 0;
        this.turnCount = 0;
        this.bankruptPlayers = [];
        this.particles = [];
        this.mortgageProperties = [];
        this.houses = [];
        this.hotels = [];
        this.jailTurns = {};
        this.getOutOfJailCards = { 0: 0, 1: 0 };
        this.communityChestCards = [];
        this.chanceCards = [];
        this.currentCard = null;
        this.cardDisplayTimer = 0;
        this.tradeOffer = null;
        this.currentAuction = null;
        this.auctionBids = [];
        this.aiDifficulty = 'medium';
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.setupProperties();
        this.setupPlayers();
        this.setupCards();
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
    }

    setupProperties() {
        this.properties = [
            { name: 'Mediterranean Avenue', price: 60, rent: [2, 10, 30, 90, 160, 250], color: '#8B4513', group: 1, houseCost: 50 },
            { name: 'Baltic Avenue', price: 60, rent: [4, 20, 60, 180, 320, 450], color: '#8B4513', group: 1, houseCost: 50 },
            { name: 'Oriental Avenue', price: 100, rent: [6, 30, 90, 270, 400, 550], color: '#87CEEB', group: 2, houseCost: 50 },
            { name: 'Vermont Avenue', price: 100, rent: [6, 30, 90, 270, 400, 550], color: '#87CEEB', group: 2, houseCost: 50 },
            { name: 'Connecticut Avenue', price: 120, rent: [8, 40, 100, 300, 450, 600], color: '#87CEEB', group: 2, houseCost: 50 },
            { name: 'St. Charles Place', price: 140, rent: [10, 50, 150, 450, 625, 750], color: '#9932CC', group: 3, houseCost: 100 },
            { name: 'States Avenue', price: 140, rent: [10, 50, 150, 450, 625, 750], color: '#9932CC', group: 3, houseCost: 100 },
            { name: 'Virginia Avenue', price: 160, rent: [12, 60, 180, 500, 700, 900], color: '#9932CC', group: 3, houseCost: 100 },
            { name: 'St. James Place', price: 180, rent: [14, 70, 200, 550, 750, 950], color: '#FF8C00', group: 4, houseCost: 100 },
            { name: 'Tennessee Avenue', price: 180, rent: [14, 70, 200, 550, 750, 950], color: '#FF8C00', group: 4, houseCost: 100 },
            { name: 'New York Avenue', price: 200, rent: [16, 80, 220, 600, 800, 1000], color: '#FF8C00', group: 4, houseCost: 100 },
            { name: 'Kentucky Avenue', price: 220, rent: [18, 90, 250, 700, 875, 1050], color: '#FF0000', group: 5, houseCost: 150 },
            { name: 'Indiana Avenue', price: 220, rent: [18, 90, 250, 700, 875, 1050], color: '#FF0000', group: 5, houseCost: 150 },
            { name: 'Illinois Avenue', price: 240, rent: [20, 100, 300, 750, 925, 1100], color: '#FF0000', group: 5, houseCost: 150 },
            { name: 'Atlantic Avenue', price: 260, rent: [22, 110, 330, 800, 975, 1150], color: '#FFFF00', group: 6, houseCost: 150 },
            { name: 'Ventnor Avenue', price: 260, rent: [22, 110, 330, 800, 975, 1150], color: '#FFFF00', group: 6, houseCost: 150 },
            { name: 'Marvin Gardens', price: 280, rent: [24, 120, 360, 850, 1025, 1200], color: '#FFFF00', group: 6, houseCost: 150 },
            { name: 'Pacific Avenue', price: 300, rent: [26, 130, 390, 900, 1100, 1275], color: '#00FF00', group: 7, houseCost: 200 },
            { name: 'North Carolina Avenue', price: 300, rent: [26, 130, 390, 900, 1100, 1275], color: '#00FF00', group: 7, houseCost: 200 },
            { name: 'Pennsylvania Avenue', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], color: '#00FF00', group: 7, houseCost: 200 },
            { name: 'Park Place', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], color: '#0000FF', group: 8, houseCost: 200 },
            { name: 'Boardwalk', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], color: '#0000FF', group: 8, houseCost: 200 }
        ];

        for (let i = 0; i < 40; i++) {
            this.board[i] = { type: 'empty', index: i };
        }

        this.board[1] = { type: 'property', index: 0 };
        this.board[3] = { type: 'communityChest', index: 0 };
        this.board[6] = { type: 'property', index: 1 };
        this.board[9] = { type: 'chance', index: 0 };
        this.board[11] = { type: 'property', index: 2 };
        this.board[13] = { type: 'property', index: 3 };
        this.board[14] = { type: 'property', index: 4 };
        this.board[16] = { type: 'property', index: 5 };
        this.board[18] = { type: 'communityChest', index: 1 };
        this.board[19] = { type: 'property', index: 6 };
        this.board[21] = { type: 'property', index: 7 };
        this.board[23] = { type: 'property', index: 8 };
        this.board[24] = { type: 'property', index: 9 };
        this.board[26] = { type: 'property', index: 10 };
        this.board[27] = { type: 'chance', index: 1 };
        this.board[29] = { type: 'property', index: 11 };
        this.board[31] = { type: 'property', index: 12 };
        this.board[32] = { type: 'property', index: 13 };
        this.board[34] = { type: 'communityChest', index: 2 };
        this.board[35] = { type: 'property', index: 14 };
        this.board[37] = { type: 'chance', index: 2 };
        this.board[39] = { type: 'property', index: 15 };
        this.board[4] = { type: 'incomeTax', index: 0 };
        this.board[38] = { type: 'luxuryTax', index: 0 };
    }

    setupPlayers() {
        this.players = [
            { name: 'Player 1', color: '#3498db', money: 1500, position: 0, isHuman: true, properties: [], inJail: false, jailTurns: 0, getOutOfJailFree: 0 },
            { name: 'Player 2', color: '#e74c3c', money: 1500, position: 0, isHuman: false, properties: [], inJail: false, jailTurns: 0, getOutOfJailFree: 0 },
            { name: 'Player 3', color: '#2ecc71', money: 1500, position: 0, isHuman: false, properties: [], inJail: false, jailTurns: 0, getOutOfJailFree: 0 },
            { name: 'Player 4', color: '#9b59b6', money: 1500, position: 0, isHuman: false, properties: [], inJail: false, jailTurns: 0, getOutOfJailFree: 0 }
        ];
        this.currentPlayer = 0;
        this.turnCount = 0;
    }

    setupCards() {
        this.communityChestCards = [
            { text: 'Advance to Go', action: 'go' },
            { text: 'Bank error in your favor', action: 'money', amount: 200 },
            { text: 'Doctor fees', action: 'money', amount: -50 },
            { text: 'Get out of Jail free', action: 'jailFree' },
            { text: 'Go to Jail', action: 'jail' },
            { text: 'Holiday fund matures', action: 'money', amount: 100 },
            { text: 'Income tax refund', action: 'money', amount: 20 },
            { text: 'Life insurance matures', action: 'money', amount: 100 },
            { text: 'Hospital fees', action: 'money', amount: -100 },
            { text: 'School fees', action: 'money', amount: -50 },
            { text: 'Receive $25 consultancy fee', action: 'money', amount: 25 },
            { text: 'You inherit', action: 'money', amount: 100 },
            { text: 'From sale of stock', action: 'money', amount: 50 }
        ];

        this.chanceCards = [
            { text: 'Advance to Go', action: 'go' },
            { text: 'Advance to Illinois Ave', action: 'position', pos: 24 },
            { text: 'Advance to St. Charles Place', action: 'position', pos: 11 },
            { text: 'Bank pays you dividend', action: 'money', amount: 50 },
            { text: 'Get out of Jail free', action: 'jailFree' },
            { text: 'Go back 3 spaces', action: 'move', amount: -3 },
            { text: 'Go to Jail', action: 'jail' },
            { text: 'Make general repairs', action: 'repairs', amount: 25 },
            { text: 'Speeding fine', action: 'money', amount: -15 },
            { text: 'Your building loan matures', action: 'money', amount: 150 },
            { text: 'Get $50 from bank', action: 'money', amount: 50 },
            { text: 'Go to nearest utility', action: 'nearestUtility' },
            { text: 'Go to nearest railroad', action: 'nearestRailroad' }
        ];
    }

    handleClick(e) {
        if (this.gameState === 'start') {
            this.gameState = 'playing';
            return;
        }

        if (this.gameState === 'gameover') {
            this.setupPlayers();
            this.setupProperties();
            this.gameState = 'playing';
            return;
        }

        if (this.currentCard) return;
        if (this.tradeOffer) return;
        if (this.currentAuction) return;

        const current = this.players[this.currentPlayer];
        if (!current.isHuman) return;

        if (this.rolling) return;
        if (current.inJail) {
            this.handleJailOptions();
        } else {
            this.rollDice();
        }
    }

    handleJailOptions() {
        const current = this.players[this.currentPlayer];
        if (current.getOutOfJailFree > 0) {
            current.getOutOfJailFree--;
            current.inJail = false;
            current.jailTurns = 0;
            this.rollDice();
        } else if (current.money >= 50) {
            current.money -= 50;
            current.inJail = false;
            current.jailTurns = 0;
            this.rollDice();
        } else {
            current.jailTurns++;
            if (current.jailTurns >= 3) {
                current.inJail = false;
                current.jailTurns = 0;
                this.rollDice();
            } else {
                this.nextTurn();
            }
        }
    }

    rollDice() {
        this.rolling = true;
        this.diceAnimationFrame = 0;
        this.animateDiceRoll();
    }

    animateDiceRoll() {
        this.diceAnimationFrame++;
        this.diceValue = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];

        if (this.diceAnimationFrame < 15) {
            requestAnimationFrame(() => this.animateDiceRoll());
        } else {
            this.rolling = false;
            this.moveCurrentPlayer();
        }
    }

    moveCurrentPlayer() {
        const current = this.players[this.currentPlayer];
        const diceTotal = this.diceValue[0] + this.diceValue[1];

        current.position = (current.position + diceTotal) % 40;

        if (current.position < (current.position - diceTotal + 40) % 40 || diceTotal > current.position) {
            current.money += 200;
            this.spawnParticles(this.width / 2, 200, '#ffd700');
        }

        this.processSquare();

        if (this.diceValue[0] === this.diceValue[1] && current.money > 0) {
            setTimeout(() => this.rollDice(), 1000);
        } else {
            this.nextTurn();
        }
    }

    processSquare() {
        const current = this.players[this.currentPlayer];
        const square = this.board[current.position];

        switch (square.type) {
            case 'property':
                this.processProperty(square.index);
                break;
            case 'chance':
                this.drawChanceCard();
                break;
            case 'communityChest':
                this.drawCommunityChestCard();
                break;
            case 'incomeTax':
                current.money -= 200;
                this.spawnParticles(this.width / 2, 200, '#ff4444');
                break;
            case 'luxuryTax':
                current.money -= 100;
                this.spawnParticles(this.width / 2, 200, '#ff4444');
                break;
        }

        if (current.money <= 0) {
            this.handleBankruptcy();
        }
    }

    processProperty(index) {
        const property = this.properties[index];
        const current = this.players[this.currentPlayer];

        if (property.owner !== undefined && property.owner !== this.currentPlayer) {
            const owner = this.players[property.owner];
            let rent = property.rent[0];

            if (property.houses > 0) {
                rent = property.rent[property.houses];
            } else if (property.hotel) {
                rent = property.rent[5];
            } else if (this.is monopoly(property.group)) {
                rent *= 2;
            }

            current.money -= rent;
            owner.money += rent;
            this.spawnParticles(this.width / 2, 200, '#ff6666');
        } else if (property.owner === undefined) {
            if (current.money >= property.price) {
                property.owner = this.currentPlayer;
                current.money -= property.price;
                current.properties.push(index);
                this.spawnParticles(this.width / 2, 200, '#44ff44');
            }
        }
    }

    isMonopoly(group) {
        const groupProperties = this.properties.filter(p => p.group === group);
        return groupProperties.every(p => p.owner !== undefined && p.owner === this.currentPlayer);
    }

    drawChanceCard() {
        const card = this.chanceCards[Math.floor(Math.random() * this.chanceCards.length)];
        this.showCard(card);
    }

    drawCommunityChestCard() {
        const card = this.communityChestCards[Math.floor(Math.random() * this.communityChestCards.length)];
        this.showCard(card);
    }

    showCard(card) {
        this.currentCard = card;
        this.cardDisplayTimer = 120;
        this.executeCardAction(card);
    }

    executeCardAction(card) {
        const current = this.players[this.currentPlayer];

        switch (card.action) {
            case 'go':
                current.position = 0;
                current.money += 200;
                break;
            case 'jail':
                current.position = 10;
                current.inJail = true;
                break;
            case 'jailFree':
                current.getOutOfJailFree++;
                break;
            case 'money':
                current.money += card.amount;
                if (card.amount > 0) {
                    this.spawnParticles(this.width / 2, 200, '#44ff44');
                } else {
                    this.spawnParticles(this.width / 2, 200, '#ff4444');
                }
                break;
            case 'position':
                current.position = card.pos;
                break;
            case 'move':
                current.position = (current.position + card.amount + 40) % 40;
                break;
            case 'repairs':
                let repairCost = 0;
                for (const propIndex of current.properties) {
                    const prop = this.properties[propIndex];
                    repairCost += prop.houses * card.amount + (prop.hotel ? card.amount * 5 : 0);
                }
                current.money -= repairCost;
                break;
            case 'nearestUtility':
                if (current.position < 12 || current.position > 28) {
                    current.position = 12;
                } else if (current.position < 28) {
                    current.position = 28;
                }
                break;
            case 'nearestRailroad':
                const railroads = [5, 15, 25, 35];
                let nearest = railroads[0];
                for (const r of railroads) {
                    if (Math.abs(current.position - r) < Math.abs(current.position - nearest)) {
                        nearest = r;
                    }
                }
                current.position = nearest;
                break;
        }
    }

    handleBankruptcy() {
        const current = this.players[this.currentPlayer];
        this.bankruptPlayers.push(this.currentPlayer);

        for (const propIndex of current.properties) {
            this.properties[propIndex].owner = undefined;
        }

        if (this.bankruptPlayers.length >= 3) {
            this.gameState = 'gameover';
            for (const player of this.players) {
                if (!this.bankruptPlayers.includes(this.players.indexOf(player))) {
                    this.winner = player;
                }
            }
        }
    }

    nextTurn() {
        do {
            this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
        } while (this.bankruptPlayers.includes(this.currentPlayer));

        this.turnCount++;

        const current = this.players[this.currentPlayer];
        if (!current.isHuman && this.gameState === 'playing') {
            setTimeout(() => this.aiTurn(), 1000);
        }
    }

    aiTurn() {
        if (this.gameState !== 'playing') return;
        const current = this.players[this.currentPlayer];

        if (current.inJail) {
            if (current.getOutOfJailFree > 0) {
                current.getOutOfJailFree--;
                current.inJail = false;
            } else if (current.money >= 50) {
                current.money -= 50;
                current.inJail = false;
            } else {
                current.jailTurns++;
                if (current.jailTurns >= 3) {
                    current.inJail = false;
                    current.jailTurns = 0;
                }
                this.nextTurn();
                return;
            }
        }

        this.rollDice();
    }

    spawnParticles(x, y, color) {
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 2;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.02,
                size: 4 + Math.random() * 3,
                color
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05;
            p.life -= p.decay;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    start() {
        this.setupProperties();
        this.setupPlayers();
        this.gameState = 'playing';
    }

    update() {
        if (this.gameState !== 'playing') return;

        this.updateParticles();

        if (this.currentCard) {
            this.cardDisplayTimer--;
            if (this.cardDisplayTimer <= 0) {
                this.currentCard = null;
            }
        }
    }

    render() {
        this.renderBoard();
        this.renderPlayers();
        this.renderUI();
        this.renderParticles();
    }

    renderBoard() {
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const boardX = 50;
        const boardY = 50;
        const spaceWidth = 50;
        const spaceHeight = 50;

        for (let i = 0; i < 40; i++) {
            let x, y, w, h;
            if (i < 10) {
                x = boardX + (9 - i) * spaceWidth;
                y = boardY;
                w = spaceWidth;
                h = spaceHeight;
            } else if (i < 20) {
                x = boardX;
                y = boardY + (i - 10) * spaceHeight;
                w = spaceWidth;
                h = spaceHeight;
            } else if (i < 30) {
                x = boardX + (i - 20) * spaceWidth;
                y = boardY + 9 * spaceHeight;
                w = spaceWidth;
                h = spaceHeight;
            } else {
                x = boardX + 9 * spaceWidth;
                y = boardY + (29 - i) * spaceHeight;
                w = spaceWidth;
                h = spaceHeight;
            }

            this.ctx.fillStyle = '#ecf0f1';
            this.ctx.fillRect(x + 1, y + 1, w - 2, h - 2);

            const square = this.board[i];
            if (square.type === 'property' && this.properties[square.index]) {
                const prop = this.properties[square.index];
                this.ctx.fillStyle = prop.color;
                this.ctx.fillRect(x + 2, y + 2, w - 4, 15);
            }

            this.ctx.fillStyle = '#333';
            this.ctx.font = '8px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText((i + 1).toString(), x + w - 8, y + h - 3);
        }
    }

    renderPlayers() {
        const boardX = 50;
        const boardY = 50;
        const spaceWidth = 50;
        const spaceHeight = 50;

        for (let i = 0; i < this.players.length; i++) {
            if (this.bankruptPlayers.includes(i)) continue;

            const player = this.players[i];
            const pos = player.position;

            let x, y;
            if (pos < 10) {
                x = boardX + (9 - pos) * spaceWidth + 25;
                y = boardY + 55;
            } else if (pos < 20) {
                x = boardX + 5;
                y = boardY + (pos - 10) * spaceHeight + 25;
            } else if (pos < 30) {
                x = boardX + (pos - 20) * spaceWidth + 25;
                y = boardY + 9 * spaceHeight + 25;
            } else {
                x = boardX + 9 * spaceWidth + 25;
                y = boardY + (29 - pos) * spaceHeight + 25;
            }

            this.ctx.beginPath();
            this.ctx.arc(x + (i % 2) * 10 - 5, y + Math.floor(i / 2) * 10 - 5, 8, 0, Math.PI * 2);
            this.ctx.fillStyle = player.color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    renderUI() {
        const uiY = this.height - 80;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(0, uiY, this.width, 80);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';

        const current = this.players[this.currentPlayer];
        this.ctx.fillStyle = current.color;
        this.ctx.fillText(`${current.name}'s Turn`, 20, uiY + 25);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(`Money: $${current.money}`, 20, uiY + 50);

        this.ctx.fillText(`Position: ${current.position + 1}`, 200, uiY + 25);
        this.ctx.fillText(`Properties: ${current.properties.length}`, 200, uiY + 50);

        if (this.rolling) {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.fillText('Rolling...', 400, uiY + 35);
        } else if (current.isHuman) {
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillText('Click to Roll', 400, uiY + 35);
        }

        this.renderDice(700, uiY + 20);

        if (this.currentCard) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            this.ctx.fillRect(this.width / 2 - 200, this.height / 2 - 100, 400, 200);

            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.currentCard.text, this.width / 2, this.height / 2);
        }

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('MONOPOLY III', this.width / 2, this.height / 2 - 80);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('4 Players - 2 Human, 2 AI', this.width / 2, this.height / 2 - 30);
            this.ctx.fillText('Buy properties, collect rent', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Build houses and hotels', this.width / 2, this.height / 2 + 40);
            this.ctx.fillText('Last player standing wins!', this.width / 2, this.height / 2 + 70);

            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Click to Start', this.width / 2, this.height / 2 + 120);
        }

        if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 50);

            this.ctx.fillStyle = this.winner.color;
            this.ctx.font = 'bold 28px Arial';
            this.ctx.fillText(`${this.winner.name} WINS!`, this.width / 2, this.height / 2 + 10);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Final money: $${this.winner.money}`, this.width / 2, this.height / 2 + 50);
            this.ctx.fillText(`Properties owned: ${this.winner.properties.length}`, this.width / 2, this.height / 2 + 80);

            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Click to Play Again', this.width / 2, this.height / 2 + 130);
        }
    }

    renderDice(x, y) {
        const diceSize = 30;
        const spacing = 40;

        for (let i = 0; i < 2; i++) {
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(x + i * spacing, y, diceSize, diceSize);
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x + i * spacing, y, diceSize, diceSize);

            this.ctx.fillStyle = '#333';
            const value = this.diceValue[i] || 1;
            const dots = {
                1: [[0.5, 0.5]],
                2: [[0.25, 0.25], [0.75, 0.75]],
                3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
                4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
                5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
                6: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.5], [0.75, 0.5], [0.25, 0.75], [0.75, 0.75]]
            };

            for (const [px, py] of dots[value]) {
                this.ctx.beginPath();
                this.ctx.arc(x + i * spacing + px * diceSize, y + py * diceSize, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }

    renderParticles() {
        for (const p of this.particles) {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
    }
}

window.Monopoly3Game = Monopoly3Game;
