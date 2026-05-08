// Blackjack Card Game
class BlackjackGame {
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
      playerMoney: 1000,
      bet: 100,
      status: 'betting',
      playerHand: [],
      dealerHand: [],
      deck: [],
      message: '',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.createDeck();
    this.shuffleDeck();
  }
  
  createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    for (let suit of suits) {
      for (let value of values) {
        this.gameState.deck.push({ suit, value });
      }
    }
  }
  
  shuffleDeck() {
    for (let i = this.gameState.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.gameState.deck[i], this.gameState.deck[j]] = [this.gameState.deck[j], this.gameState.deck[i]];
    }
  }
  
  dealCard() {
    return this.gameState.deck.pop();
  }
  
  calculateScore(hand) {
    let score = 0;
    let aces = 0;
    
    hand.forEach(card => {
      if (card.value === 'A') {
        aces++;
        score += 11;
      } else if (['K', 'Q', 'J'].includes(card.value)) {
        score += 10;
      } else {
        score += parseInt(card.value);
      }
    });
    
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }
    
    return score;
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
    if (this.gameState.gameOver) return;
    this.gameState.time += deltaTime;
  }
  
  placeBet() {
    if (this.gameState.bet > this.gameState.playerMoney) return;
    
    this.gameState.status = 'dealing';
    this.gameState.playerHand = [this.dealCard(), this.dealCard()];
    this.gameState.dealerHand = [this.dealCard(), this.dealCard()];
    
    this.checkInitialBust();
  }
  
  checkInitialBust() {
    const playerScore = this.calculateScore(this.gameState.playerHand);
    
    if (playerScore === 21) {
      this.blackjack();
    }
  }
  
  blackjack() {
    const playerScore = this.calculateScore(this.gameState.playerHand);
    const dealerScore = this.calculateScore(this.gameState.dealerHand);
    
    if (playerScore === 21 && this.gameState.playerHand.length === 2) {
      this.gameState.playerMoney += this.gameState.bet * 2.5;
      this.gameState.message = 'BLACKJACK! You win!';
      this.gameState.status = 'gameover';
    }
  }
  
  hit() {
    if (this.gameState.status !== 'playing') return;
    
    this.gameState.playerHand.push(this.dealCard());
    
    const score = this.calculateScore(this.gameState.playerHand);
    
    if (score > 21) {
      this.playerBust();
    } else if (score === 21) {
      this.stand();
    }
  }
  
  stand() {
    if (this.gameState.status !== 'playing') return;
    
    this.gameState.status = 'dealerTurn';
    this.dealerPlay();
  }
  
  dealerPlay() {
    let dealerScore = this.calculateScore(this.gameState.dealerHand);
    
    while (dealerScore < 17) {
      this.gameState.dealerHand.push(this.dealCard());
      dealerScore = this.calculateScore(this.gameState.dealerHand);
    }
    
    this.determineWinner();
  }
  
  playerBust() {
    this.gameState.playerMoney -= this.gameState.bet;
    this.gameState.message = 'BUST! You lose!';
    this.gameState.status = 'gameover';
  }
  
  determineWinner() {
    const playerScore = this.calculateScore(this.gameState.playerHand);
    const dealerScore = this.calculateScore(this.gameState.dealerHand);
    
    if (dealerScore > 21) {
      this.gameState.playerMoney += this.gameState.bet * 2;
      this.gameState.message = 'Dealer busts! You win!';
    } else if (playerScore > dealerScore) {
      this.gameState.playerMoney += this.gameState.bet * 2;
      this.gameState.message = 'You win!';
    } else if (playerScore < dealerScore) {
      this.gameState.playerMoney -= this.gameState.bet;
      this.gameState.message = 'Dealer wins!';
    } else {
      this.gameState.playerMoney += this.gameState.bet;
      this.gameState.message = 'Push!';
    }
    
    this.gameState.status = 'gameover';
  }
  
  newGame() {
    if (this.gameState.deck.length < 20) {
      this.createDeck();
      this.shuffleDeck();
    }
    
    this.gameState.playerHand = [];
    this.gameState.dealerHand = [];
    this.gameState.message = '';
    this.gameState.status = 'betting';
    this.gameState.gameOver = false;
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (input.a && this.gameState.status === 'betting') {
      this.placeBet();
      this.gameState.status = 'playing';
    }
    if (input.b && this.gameState.status === 'playing') {
      this.hit();
    }
    if (input.up && this.gameState.status === 'playing') {
      this.stand();
    }
    if (input.action && this.gameState.status === 'gameover') {
      this.newGame();
    }
  }
  
  render() {
    this.drawBackground();
    this.drawTable();
    this.drawCards();
    this.drawUI();
    if (this.gameState.gameOver) this.drawMessage();
  }
  
  drawBackground() {
    const gradient = this.ctx.createRadialGradient(this.canvas.width/2, this.canvas.height/2, 0, this.canvas.width/2, this.canvas.height/2, 400);
    gradient.addColorStop(0, '#1a472a');
    gradient.addColorStop(1, '#0d2818');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawTable() {
    this.ctx.fillStyle = '#27ae60';
    this.ctx.beginPath();
    this.ctx.ellipse(this.canvas.width/2, this.canvas.height/2, 350, 200, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#1e8449';
    this.ctx.lineWidth = 10;
    this.ctx.beginPath();
    this.ctx.ellipse(this.canvas.width/2, this.canvas.height/2, 340, 190, 0, 0, Math.PI * 2);
    this.ctx.stroke();
  }
  
  drawCards() {
    const dealerY = 180;
    const playerY = 400;
    const startX = this.canvas.width/2 - (this.gameState.dealerHand.length * 60) / 2;
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('DEALER', this.canvas.width/2, 130);
    
    this.gameState.dealerHand.forEach((card, i) => {
      const x = startX + i * 70;
      
      if (i === 0 && this.gameState.status !== 'gameover' && this.gameState.status !== 'dealerTurn') {
        this.drawCardBack(x, dealerY);
      } else {
        this.drawCard(x, dealerY, card);
      }
    });
    
    if (this.gameState.status === 'dealerTurn' || this.gameState.status === 'gameover') {
      const dealerScore = this.calculateScore(this.gameState.dealerHand);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.fillText(`Score: ${dealerScore}`, this.canvas.width/2, dealerY + 60);
    }
    
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText('YOUR HAND', this.canvas.width/2, 350);
    
    const playerStartX = this.canvas.width/2 - (this.gameState.playerHand.length * 60) / 2;
    this.gameState.playerHand.forEach((card, i) => {
      this.drawCard(playerStartX + i * 70, playerY, card);
    });
    
    if (this.gameState.status !== 'betting' && this.gameState.status !== 'dealing') {
      const playerScore = this.calculateScore(this.gameState.playerHand);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.fillText(`Score: ${playerScore}`, this.canvas.width/2, playerY + 60);
    }
  }
  
  drawCard(x, y, card) {
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(x, y, 60, 85);
    
    this.ctx.strokeStyle = '#ccc';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, 60, 85);
    
    const isRed = card.suit === '♥' || card.suit === '♦';
    this.ctx.fillStyle = isRed ? '#e74c3c' : '#2c3e50';
    
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(card.value, x + 5, y + 20);
    this.ctx.textAlign = 'center';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(card.suit, x + 30, y + 55);
  }
  
  drawCardBack(x, y) {
    this.ctx.fillStyle = '#c0392b';
    this.ctx.fillRect(x, y, 60, 85);
    
    this.ctx.strokeStyle = '#922b21';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(x, y, 60, 85);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.beginPath();
    this.ctx.moveTo(x + 15, y + 20);
    this.ctx.lineTo(x + 30, y + 40);
    this.ctx.lineTo(x + 45, y + 20);
    this.ctx.lineTo(x + 30, y + 60);
    this.ctx.closePath();
    this.ctx.fill();
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, 10, 140, 60);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Money: $${this.gameState.playerMoney}`, 20, 35);
    this.ctx.fillText(`Bet: $${this.gameState.bet}`, 20, 55);
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(this.canvas.width - 150, 10, 140, 70);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Controls:', this.canvas.width - 140, 30);
    this.ctx.fillText('A - Deal', this.canvas.width - 140, 48);
    this.ctx.fillText('B - Hit', this.canvas.width - 140, 64);
    this.ctx.fillText('↑ - Stand', this.canvas.width - 80, 64);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BLACKJACK', this.canvas.width/2, 30);
    
    if (this.gameState.status === 'betting') {
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 20px Arial';
      this.ctx.fillText('Press A to Deal', this.canvas.width/2, this.canvas.height - 50);
    } else if (this.gameState.status === 'playing') {
      this.ctx.fillStyle = '#2ecc71';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.fillText('B: Hit | ↑: Stand', this.canvas.width/2, this.canvas.height - 50);
    }
  }
  
  drawMessage() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(0, this.canvas.height - 120, this.canvas.width, 80);
    
    this.ctx.fillStyle = this.gameState.message.includes('win') ? '#2ecc71' : '#e74c3c';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.gameState.message, this.canvas.width/2, this.canvas.height - 75);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Press A for new game', this.canvas.width/2, this.canvas.height - 45);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.BlackjackGame = BlackjackGame;