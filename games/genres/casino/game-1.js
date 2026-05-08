// Slots - Casino Game
class SlotsGame {
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
      balance: 100,
      bet: 10,
      spin: false,
      reels: [[], [], []],
      symbols: ['🍒', '🍋', '🍊', '🍇', '🔔', '💎', '7️⃣'],
      status: 'ready',
      win: 0,
      lastWin: 0
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 400;
    this.canvas.height = this.canvas.parentElement.clientHeight || 500;
  }
  
  initGame() {
    const { symbols, reels } = this.gameState;
    for (let r = 0; r < 3; r++) {
      reels[r] = [];
      for (let i = 0; i < 5; i++) {
        reels[r].push(symbols[Math.floor(Math.random() * symbols.length)]);
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
    
    if (this.gameState.spin) {
      const { reels, symbols } = this.gameState;
      
      for (let r = 0; r < 3; r++) {
        if (Math.random() < 0.3) {
          reels[r].shift();
          reels[r].push(symbols[Math.floor(Math.random() * symbols.length)]);
        }
      }
    }
  }
  
  spin() {
    if (this.gameState.balance < this.gameState.bet || this.gameState.spin) return;
    
    this.gameState.balance -= this.gameState.bet;
    this.gameState.spin = true;
    this.gameState.win = 0;
    this.gameState.status = 'spinning';
    
    setTimeout(() => {
      this.gameState.spin = false;
      this.checkWin();
      this.gameState.status = 'ready';
    }, 2000);
  }
  
  checkWin() {
    const { reels, bet } = this.gameState;
    const center = [reels[0][2], reels[1][2], reels[2][2]];
    
    if (center[0] === center[1] && center[1] === center[2]) {
      const symbol = center[0];
      const payouts = { '🍒': 5, '🍋': 3, '🍊': 4, '🍇': 6, '🔔': 10, '💎': 20, '7️⃣': 50 };
      this.gameState.win = bet * (payouts[symbol] || 10);
      this.gameState.balance += this.gameState.win;
      this.gameState.lastWin = this.gameState.win;
    }
  }
  
  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const { reels, balance, bet, win, lastWin } = this.gameState;
    const symbolSize = 60;
    const startX = 50;
    const startY = 100;
    
    // Machine frame
    this.ctx.fillStyle = '#8e44ad';
    this.ctx.fillRect(20, 30, this.canvas.width - 40, 350);
    
    // Reels
    for (let r = 0; r < 3; r++) {
      this.ctx.fillStyle = '#ecf0f1';
      this.ctx.fillRect(startX + r * 110, startY, 100, symbolSize * 3);
      
      for (let i = 0; i < 5; i++) {
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = '40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(reels[r][i], startX + r * 110 + 50, startY + 45 + i * 60);
      }
      
      // Center highlight
      this.ctx.strokeStyle = '#f1c40f';
      this.ctx.lineWidth = 4;
      this.ctx.strokeRect(startX + r * 110 + 5, startY + 60, 90, 55);
    }
    
    // UI
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Balance: $${balance}`, 30, 420);
    this.ctx.fillText(`Bet: $${bet}`, 30, 450);
    
    if (lastWin > 0) {
      this.ctx.fillStyle = '#2ecc71';
      this.ctx.font = 'bold 24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`WIN: $${lastWin}`, this.canvas.width / 2, 50);
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.SlotsGame = SlotsGame;