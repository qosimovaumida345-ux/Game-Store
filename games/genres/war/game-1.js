// War Card Game
class WarCardGame {
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
      piles: [[], []],
      scores: [0, 0],
      currentCard: [null, null],
      status: 'playing',
      warPile: [],
      warActive: false,
      roundWinner: null,
      gameOver: false,
      winner: null,
      roundsPlayed: 0
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.createDeck();
    this.shuffleDeck();
    this.dealCards();
  }
  
  createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    
    this.gameState.deck = [];
    suits.forEach(suit => {
      ranks.forEach((rank, index) => {
        this.gameState.deck.push({
          suit,
          rank,
          value: index + 2,
          color: suit === '♥' || suit === '♦' ? '#e74c3c' : '#000'
        });
      });
    });
  }
  
  shuffleDeck() {
    for (let i = this.gameState.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.gameState.deck[i], this.gameState.deck[j]] = [this.gameState.deck[j], this.gameState.deck[i]];
    }
  }
  
  dealCards() {
    while (this.gameState.deck.length > 0) {
      this.gameState.hands[0].push(this.gameState.deck.pop());
      if (this.gameState.deck.length > 0) {
        this.gameState.hands[1].push(this.gameState.deck.pop());
      }
    }
  }
  
  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
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
  
  playRound() {
    if (this.gameState.hands[0].length === 0 || this.gameState.hands[1].length === 0) {
      this.endGame();
      return;
    }
    
    const card1 = this.gameState.hands[0].shift();
    const card2 = this.gameState.hands[1].shift();
    
    this.gameState.currentCard = [card1, card2];
    this.gameState.roundsPlayed++;
    
    if (card1.value > card2.value) {
      this.gameState.piles[0].push(card1, card2);
      this.gameState.roundWinner = this.players[0];
      this.gameState.scores[0] += 1;
    } else if (card2.value > card1.value) {
      this.gameState.piles[1].push(card1, card2);
      this.gameState.roundWinner = this.players[1];
      this.gameState.scores[1] += 1;
    } else {
      this.war(card1, card2);
    }
    
    if (this.gameState.hands[0].length === 0 && this.gameState.hands[1].length === 0) {
      this.collectPiles();
    }
  }
  
  war(card1, card2) {
    this.gameState.warActive = true;
    this.gameState.warPile.push(card1, card2);
    
    if (this.gameState.hands[0].length >= 4 && this.gameState.hands[1].length >= 4) {
      for (let i = 0; i < 3; i++) {
        this.gameState.warPile.push(this.gameState.hands[0].shift());
        this.gameState.warPile.push(this.gameState.hands[1].shift());
      }
      
      const warCard1 = this.gameState.hands[0].shift();
      const warCard2 = this.gameState.hands[1].shift();
      
      this.gameState.currentCard = [warCard1, warCard2];
      this.gameState.warPile.push(warCard1, warCard2);
      
      if (warCard1.value > warCard2.value) {
        this.gameState.piles[0].push(...this.gameState.warPile);
        this.gameState.roundWinner = this.players[0];
        this.gameState.scores[0] += this.gameState.warPile.length;
        this.gameState.warPile = [];
        this.gameState.warActive = false;
      } else if (warCard2.value > warCard1.value) {
        this.gameState.piles[1].push(...this.gameState.warPile);
        this.gameState.roundWinner = this.players[1];
        this.gameState.scores[1] += this.gameState.warPile.length;
        this.gameState.warPile = [];
        this.gameState.warActive = false;
      }
    } else {
      if (this.gameState.hands[0].length > 0) {
        this.gameState.piles[0].push(...this.gameState.warPile, ...this.gameState.hands[0]);
        this.gameState.hands[0] = [];
      }
      if (this.gameState.hands[1].length > 0) {
        this.gameState.piles[1].push(...this.gameState.warPile, ...this.gameState.hands[1]);
        this.gameState.hands[1] = [];
      }
      this.gameState.warPile = [];
      this.gameState.warActive = false;
    }
  }
  
  collectPiles() {
    if (this.gameState.piles[0].length > 0) {
      this.gameState.hands[0].push(...this.gameState.piles[0].sort(() => Math.random() - 0.5));
      this.gameState.piles[0] = [];
    }
    if (this.gameState.piles[1].length > 0) {
      this.gameState.hands[1].push(...this.gameState.piles[1].sort(() => Math.random() - 0.5));
      this.gameState.piles[1] = [];
    }
  }
  
  endGame() {
    if (this.gameState.hands[0].length > this.gameState.hands[1].length) {
      this.gameState.winner = this.players[0];
    } else if (this.gameState.hands[1].length > this.gameState.hands[0].length) {
      this.gameState.winner = this.players[1];
    } else {
      this.gameState.winner = 'Draw';
    }
    this.gameState.gameOver = true;
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (input.action && !this.gameState.gameOver) {
      this.playRound();
    }
  }
  
  render() {
    this.drawBackground();
    this.drawCards();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    this.ctx.fillStyle = '#27ae60';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    this.ctx.lineWidth = 2;
    for (let x = 0; x < this.canvas.width; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }
  
  drawCards() {
    this.players.forEach((player, i) => {
      const x = 150 + i * 450;
      const y = 100;
      
      this.ctx.fillStyle = '#fff';
      this.ctx.fillRect(x - 60, y - 80, 120, 160);
      this.ctx.strokeStyle = '#333';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x - 60, y - 80, 120, 160);
      
      this.ctx.fillStyle = '#333';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Cards', x, y - 60);
      this.ctx.font = 'bold 24px Arial';
      this.ctx.fillText(this.gameState.hands[i].length, x, y);
      
      this.ctx.fillStyle = '#888';
      this.ctx.font = '12px Arial';
      this.ctx.fillText('Click to play', x, y + 90);
    });
    
    if (this.gameState.currentCard[0] && this.gameState.currentCard[1]) {
      this.drawCard(this.gameState.currentCard[0], 280, 280);
      this.drawCard(this.gameState.currentCard[1], 460, 280);
      
      if (this.gameState.roundWinner) {
        this.ctx.fillStyle = '#ffd93d';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${this.gameState.roundWinner} wins!`, 400, 420);
      }
    }
    
    if (this.gameState.warActive) {
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.font = 'bold 30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('WAR!', 400, 150);
      this.ctx.fillText(`War pile: ${this.gameState.warPile.length} cards`, 400, 190);
    }
  }
  
  drawCard(card, x, y) {
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(x - 40, y - 60, 80, 120);
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x - 40, y - 60, 80, 120);
    
    this.ctx.fillStyle = card.color;
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(card.rank + card.suit, x, y - 30);
    this.ctx.font = 'bold 36px Arial';
    this.ctx.fillText(card.suit, x, y + 20);
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 180, 80);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${this.players[0]}: ${this.gameState.scores[0]}`, 20, 30);
    this.ctx.fillText(`${this.players[1]}: ${this.gameState.scores[1]}`, 20, 55);
    this.ctx.fillText(`Rounds: ${this.gameState.roundsPlayed}`, 20, 80);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('WAR', this.canvas.width / 2, 30);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Winner: ${this.gameState.winner}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
    this.ctx.fillText(`Rounds: ${this.gameState.roundsPlayed}`, this.canvas.width / 2, this.canvas.height / 2 + 70);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.WarCardGame = WarCardGame;