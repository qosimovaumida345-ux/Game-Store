// Poker Game
class PokerGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.players = players;
    this.gameId = gameId;
    this.isRunning = false;
    this.lastTime = 0;
    
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    this.gameState = {
      time: 0,
      deck: [],
      hands: [[], []],
      communityCards: [],
      pot: 0,
      bets: [0, 0],
      currentPlayer: 0,
      status: 'dealing',
      round: 'preflop',
      playerFolded: [false, false],
      showdown: false,
      winner: null,
      gameOver: false
    };
    
    this.suits = ['♠', '♥', '♦', '♣'];
    this.ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  createDeck() {
    const deck = [];
    this.suits.forEach(suit => {
      this.ranks.forEach((rank, value) => {
        deck.push({ suit, rank, value, color: suit === '♥' || suit === '♦' ? '#e74c3c' : '#000' });
      });
    });
    return deck;
  }
  
  shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }
  
  initGame() {
    this.gameState.deck = this.shuffleDeck(this.createDeck());
    this.gameState.hands = [[], []];
    this.gameState.communityCards = [];
    this.gameState.pot = 20;
    this.gameState.bets = [10, 10];
    this.gameState.playerFolded = [false, false];
    this.gameState.showdown = false;
    this.gameState.winner = null;
  }
  
  dealCards() {
    this.gameState.deck = this.shuffleDeck(this.createDeck());
    
    this.gameState.hands[0] = [this.gameState.deck.pop(), this.gameState.deck.pop()];
    this.gameState.hands[1] = [this.gameState.deck.pop(), this.gameState.deck.pop()];
    
    this.gameState.status = 'playing';
    this.gameState.round = 'flop';
  }
  
  dealFlop() {
    this.gameState.deck.pop();
    this.gameState.communityCards.push(this.gameState.deck.pop(), this.gameState.deck.pop(), this.gameState.deck.pop());
    this.gameState.round = 'turn';
  }
  
  dealTurn() {
    this.gameState.deck.pop();
    this.gameState.communityCards.push(this.gameState.deck.pop());
    this.gameState.round = 'river';
  }
  
  dealRiver() {
    this.gameState.deck.pop();
    this.gameState.communityCards.push(this.gameState.deck.pop());
    this.gameState.round = 'showdown';
  }
  
  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.dealCards();
    this.gameLoop(this.lastTime);
  }
  
  stop() { this.isRunning = false; }
  
  gameLoop(currentTime) {
    if (!this.isRunning) return;
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    this.update(deltaTime);
    this.render();
    requestAnimationFrame((time) => this.gameLoop(time));
  }
  
  update(deltaTime) {
    this.gameState.time += deltaTime;
  }
  
  playerAction(action) {
    const player = this.gameState.currentPlayer;
    const opponent = 1 - player;
    
    switch (action) {
      case 'fold':
        this.gameState.playerFolded[player] = true;
        this.gameState.winner = this.players[opponent];
        this.gameState.showdown = true;
        break;
        
      case 'check':
        if (this.gameState.bets[player] === this.gameState.bets[opponent]) {
          this.nextStage();
        }
        break;
        
      case 'bet':
        this.gameState.bets[player] += 20;
        this.gameState.pot += 20;
        break;
        
      case 'call':
        const diff = this.gameState.bets[opponent] - this.gameState.bets[player];
        this.gameState.bets[player] += diff;
        this.gameState.pot += diff;
        break;
    }
    
    this.gameState.currentPlayer = 1 - this.gameState.currentPlayer;
  }
  
  nextStage() {
    this.gameState.bets = [0, 0];
    
    switch (this.gameState.round) {
      case 'preflop':
        this.dealFlop();
        break;
      case 'flop':
        this.dealTurn();
        break;
      case 'turn':
        this.dealRiver();
        break;
      case 'river':
        this.showDown();
        break;
    }
  }
  
  showDown() {
    this.gameState.showdown = true;
    
    const hand1 = this.evaluateHand(this.gameState.hands[0], this.gameState.communityCards);
    const hand2 = this.evaluateHand(this.gameState.hands[1], this.gameState.communityCards);
    
    if (hand1.score > hand2.score) {
      this.gameState.winner = this.players[0];
    } else if (hand2.score > hand1.score) {
      this.gameState.winner = this.players[1];
    } else {
      this.gameState.winner = 'Split';
    }
  }
  
  evaluateHand(hand, community) {
    const allCards = [...hand, ...community];
    const values = allCards.map(c => c.value).sort((a, b) => b - a);
    const suits = allCards.map(c => c.suit);
    
    const counts = {};
    values.forEach(v => counts[v] = (counts[v] || 0) + 1);
    const countValues = Object.values(counts).sort((a, b) => b - a);
    
    const suitCounts = {};
    suits.forEach(s => suitCounts[s] = (suitCounts[s] || 0) + 1);
    const flushSuit = Object.entries(suitCounts).find(([s, c]) => c >= 5);
    
    let isStraight = false;
    const uniqueValues = [...new Set(values)];
    for (let i = 0; i <= uniqueValues.length - 5; i++) {
      if (uniqueValues[i] - uniqueValues[i + 4] === 4) {
        isStraight = true;
        break;
      }
    }
    
    let score = 0;
    let handName = 'High Card';
    
    if (countValues[0] === 4) {
      score = 8;
      handName = 'Four of a Kind';
    } else if (countValues[0] === 3 && countValues[1] === 2) {
      score = 7;
      handName = 'Full House';
    } else if (flushSuit) {
      score = 6;
      handName = 'Flush';
    } else if (isStraight) {
      score = 5;
      handName = 'Straight';
    } else if (countValues[0] === 3) {
      score = 4;
      handName = 'Three of a Kind';
    } else if (countValues[0] === 2 && countValues[1] === 2) {
      score = 3;
      handName = 'Two Pairs';
    } else if (countValues[0] === 2) {
      score = 2;
      handName = 'One Pair';
    } else {
      score = 1;
      handName = 'High Card';
    }
    
    return { score, handName, highValue: values[0] };
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    const currentPlayer = this.players[this.gameState.currentPlayer];
    if (playerName !== currentPlayer) return;
    
    if (this.gameState.playerFolded[this.gameState.currentPlayer]) return;
    
    if (input.a) this.playerAction('fold');
    if (input.b) this.playerAction('check');
    if (input.up) this.playerAction('bet');
    if (input.down) this.playerAction('call');
  }
  
  render() {
    this.drawBackground();
    this.drawCommunityCards();
    this.drawPlayerHands();
    this.drawPot();
    this.drawUI();
    if (this.gameState.showdown) this.drawResult();
  }
  
  drawBackground() {
    const gradient = this.ctx.createRadialGradient(400, 300, 0, 400, 300, 400);
    gradient.addColorStop(0, '#1a472a');
    gradient.addColorStop(1, '#0d2818');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawCommunityCards() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this.ctx.fillRect(150, 180, 500, 120);
    
    this.gameState.communityCards.forEach((card, i) => {
      this.drawCard(card, 200 + i * 100, 200);
    });
    
    if (this.gameState.communityCards.length === 0) {
      this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
      this.ctx.font = '16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Community Cards', 400, 240);
    }
  }
  
  drawPlayerHands() {
    this.players.forEach((player, i) => {
      const y = i === 0 ? 80 : 420;
      const folded = this.gameState.playerFolded[i];
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(player, 400, y - 30);
      
      if (folded) {
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText('FOLDED', 400, y + 30);
      } else {
        this.gameState.hands[i].forEach((card, j) => {
          this.drawCard(card, 300 + j * 80, y);
        });
      }
    });
  }
  
  drawCard(card, x, y) {
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(x, y, 70, 100);
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, 70, 100);
    
    this.ctx.fillStyle = card.color;
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(card.rank + card.suit, x + 35, y + 50);
    this.ctx.font = '30px Arial';
    this.ctx.fillText(card.suit, x + 35, y + 80);
  }
  
  drawPot() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(300, 310, 200, 40);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Pot: $${this.gameState.pot}`, 400, 338);
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 150, 60);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${this.players[0]} Bet: $${this.gameState.bets[0]}`, 20, 30);
    this.ctx.fillText(`${this.players[1]} Bet: $${this.gameState.bets[1]}`, 20, 55);
    
    const currentPlayer = this.players[this.gameState.currentPlayer];
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('POKER', this.canvas.width / 2, 30);
    
    this.ctx.fillStyle = '#4ecdc4';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`Turn: ${currentPlayer}`, this.canvas.width - 80, 30);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px Arial';
    this.ctx.fillText('A=Fold B=Check UP=Bet DOWN=Call', this.canvas.width / 2, this.canvas.height - 20);
  }
  
  drawResult() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(200, 320, 400, 60);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Winner: ${this.gameState.winner}`, 400, 360);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.PokerGame = PokerGame;