// Solitaire Card Game
class SolitaireGame {
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
      score: 0,
      moves: 0,
      deck: [],
      tableau: [],
      foundation: [[], [], [], []],
      stock: [],
      waste: [],
      selected: null,
      status: 'playing',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    this.gameState.deck = [];
    suits.forEach(suit => {
      values.forEach((value, idx) => {
        this.gameState.deck.push({ suit, value, rank: idx + 1, color: (suit === '♥' || suit === '♦') ? 'red' : 'black' });
      });
    });
    
    for (let i = this.gameState.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.gameState.deck[i], this.gameState.deck[j]] = [this.gameState.deck[j], this.gameState.deck[i]];
    }
    
    for (let col = 0; col < 7; col++) {
      this.gameState.tableau[col] = [];
      for (let row = 0; row <= col; row++) {
        const card = this.gameState.deck.pop();
        if (row === col) card.flipped = true;
        this.gameState.tableau[col].push(card);
      }
    }
    
    this.gameState.stock = this.gameState.deck;
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
    
    let totalCards = 0;
    this.gameState.foundation.forEach(f => totalCards += f.length);
    if (totalCards === 52) {
      this.gameState.score = Math.max(0, 10000 - this.gameState.moves * 10 - Math.floor(this.gameState.time));
      this.gameState.gameOver = true;
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#0d5c0d';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const cardW = 70;
    const cardH = 100;
    
    for (let i = 0; i < 4; i++) {
      this.ctx.fillStyle = '#2d5a27';
      this.ctx.fillRect(50 + i * 90, 30, cardW, cardH);
      this.ctx.strokeStyle = '#fff';
      this.ctx.strokeRect(50 + i * 90, 30, cardW, cardH);
      
      if (this.gameState.foundation[i].length > 0) {
        const top = this.gameState.foundation[i][this.gameState.foundation[i].length - 1];
        this.drawCard(50 + i * 90, 30, top);
      }
    }
    
    this.ctx.fillStyle = '#2d5a27';
    this.ctx.fillRect(50, 150, cardW, cardH);
    this.ctx.strokeRect(50, 150, cardW, cardH);
    if (this.gameState.stock.length > 0) {
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.gameState.stock.length.toString(), 85, 205);
    }
    
    this.ctx.fillStyle = '#2d5a27';
    this.ctx.fillRect(50, 150 + cardH + 10, cardW, cardH);
    this.ctx.strokeRect(50, 150 + cardH + 10, cardW, cardH);
    if (this.gameState.waste.length > 0) {
      const top = this.gameState.waste[this.gameState.waste.length - 1];
      this.drawCard(50, 150 + cardH + 10, top);
    }
    
    for (let col = 0; col < 7; col++) {
      let y = 300;
      this.gameState.tableau[col].forEach(card => {
        this.ctx.fillStyle = card.flipped ? '#1a4d1a' : '#2d5a27';
        this.ctx.fillRect(50 + col * 100, y, cardW, cardH);
        this.ctx.strokeStyle = '#fff';
        this.ctx.strokeRect(50 + col * 100, y, cardW, cardH);
        
        if (card.flipped) this.drawCard(50 + col * 100, y, card);
        y += 25;
      });
    }
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Score: ' + this.gameState.score + ' | Moves: ' + this.gameState.moves + ' | Time: ' + Math.floor(this.gameState.time) + 's', 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('SOLITAIRE', this.canvas.width / 2, 20);
    
    if (this.gameState.gameOver) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#ffd93d';
      this.ctx.font = '40px Arial';
      this.ctx.fillText('YOU WIN!', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.fillStyle = '#fff';
      this.ctx.fillText('Score: ' + this.gameState.score, this.canvas.width / 2, this.canvas.height / 2 + 40);
    }
  }
  
  drawCard(x, y, card) {
    this.ctx.fillStyle = card.color === 'red' ? '#ffcccc' : '#ffffff';
    this.ctx.fillRect(x + 2, y + 2, 66, 96);
    
    this.ctx.fillStyle = card.color === 'red' ? '#e74c3c' : '#000';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(card.value, x + 5, y + 20);
    this.ctx.textAlign = 'center';
    this.ctx.font = '28px Arial';
    this.ctx.fillText(card.suit, x + 35, y + 60);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.SolitaireGame = SolitaireGame;