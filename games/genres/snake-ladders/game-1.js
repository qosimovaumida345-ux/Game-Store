// Snakes and Ladders Game
class SnakesLaddersGame {
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
      positions: [1, 1],
      currentPlayer: 0,
      diceValue: 0,
      status: 'rolling',
      diceRolling: false,
      rollTimer: 0,
      gameOver: false,
      winner: null
    };
    
    this.snakes = {
      16: 6, 46: 25, 49: 11, 62: 19, 64: 60, 74: 53, 89: 68, 92: 88, 95: 75, 99: 80
    };
    
    this.ladders = {
      2: 38, 7: 14, 8: 31, 15: 26, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 78: 98, 87: 94
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 600;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.positions = [1, 1];
    this.gameState.currentPlayer = 0;
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
    
    if (this.gameState.diceRolling) {
      this.gameState.rollTimer -= deltaTime;
      
      if (this.gameState.rollTimer <= 0) {
        this.finishRoll();
      }
    }
  }
  
  rollDice() {
    if (this.gameState.status !== 'rolling') return;
    
    this.gameState.diceRolling = true;
    this.gameState.rollTimer = 1;
  }
  
  finishRoll() {
    this.gameState.diceRolling = false;
    this.gameState.diceValue = Math.floor(Math.random() * 6) + 1;
    
    const currentPos = this.gameState.positions[this.gameState.currentPlayer];
    let newPos = currentPos + this.gameState.diceValue;
    
    if (newPos > 100) {
      newPos = 100 - (newPos - 100);
    }
    
    this.gameState.positions[this.gameState.currentPlayer] = newPos;
    
    if (newPos === 100) {
      this.gameState.winner = this.players[this.gameState.currentPlayer];
      this.gameState.gameOver = true;
      return;
    }
    
    if (this.snakes[newPos]) {
      setTimeout(() => {
        this.gameState.positions[this.gameState.currentPlayer] = this.snakes[newPos];
      }, 500);
    } else if (this.ladders[newPos]) {
      setTimeout(() => {
        this.gameState.positions[this.gameState.currentPlayer] = this.ladders[newPos];
      }, 500);
    }
    
    this.gameState.currentPlayer = (this.gameState.currentPlayer + 1) % 2;
    this.gameState.status = 'rolling';
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    const currentPlayer = this.players[this.gameState.currentPlayer];
    if (playerName !== currentPlayer) return;
    
    if (input.action) {
      this.rollDice();
    }
  }
  
  getPositionCoords(position) {
    const row = Math.floor((position - 1) / 10);
    const col = (position - 1) % 10;
    
    const isLeftToRight = row % 2 === 0;
    const x = isLeftToRight ? col : 9 - col;
    const y = 9 - row;
    
    return { x: x * 55 + 45, y: y * 55 + 45 };
  }
  
  render() {
    this.drawBoard();
    this.drawSnakesLadders();
    this.drawPlayers();
    this.drawDice();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBoard() {
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const isEven = (row + col) % 2 === 0;
        this.ctx.fillStyle = isEven ? '#f5deb3' : '#8b4513';
        this.ctx.fillRect(col * 55 + 25, row * 55 + 25, 55, 55);
        
        const num = (9 - row) * 10 + (row % 2 === 0 ? col + 1 : 10 - col);
        this.ctx.fillStyle = isEven ? '#333' : '#fff';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(num, col * 55 + 52, row * 55 + 40);
      }
    }
  }
  
  drawSnakesLadders() {
    this.ctx.lineWidth = 4;
    
    Object.entries(this.ladders).forEach(([start, end]) => {
      const startPos = this.getPositionCoords(parseInt(start));
      const endPos = this.getPositionCoords(end);
      
      this.ctx.strokeStyle = '#27ae60';
      this.ctx.beginPath();
      this.ctx.moveTo(startPos.x, startPos.y);
      this.ctx.lineTo(endPos.x, endPos.y);
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#27ae60';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.fillText('L', startPos.x, startPos.y);
    });
    
    Object.entries(this.snakes).forEach(([start, end]) => {
      const startPos = this.getPositionCoords(parseInt(start));
      const endPos = this.getPositionCoords(end);
      
      this.ctx.strokeStyle = '#e74c3c';
      this.ctx.beginPath();
      this.ctx.moveTo(startPos.x, startPos.y);
      this.ctx.quadraticCurveTo(
        (startPos.x + endPos.x) / 2, startPos.y + 30,
        endPos.x, endPos.y
      );
      this.ctx.stroke();
    });
  }
  
  drawPlayers() {
    const colors = ['#3498db', '#e74c3c'];
    
    this.gameState.positions.forEach((pos, i) => {
      const coords = this.getPositionCoords(pos);
      const offset = i === 0 ? -10 : 10;
      
      this.ctx.fillStyle = colors[i];
      this.ctx.beginPath();
      this.ctx.arc(coords.x + offset, coords.y, 12, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`P${i + 1}`, coords.x + offset, coords.y + 4);
    });
  }
  
  drawDice() {
    const x = this.canvas.width / 2;
    const y = this.canvas.height - 60;
    
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(x - 30, y - 30, 60, 60);
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x - 30, y - 30, 60, 60);
    
    if (this.gameState.diceRolling) {
      this.ctx.fillStyle = '#666';
      this.ctx.font = 'bold 30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('...', x, y + 10);
    } else if (this.gameState.diceValue > 0) {
      this.ctx.fillStyle = '#000';
      this.ctx.font = 'bold 30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.gameState.diceValue, x, y + 10);
    } else {
      this.ctx.fillStyle = '#666';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Click to roll', x, y + 5);
    }
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 140, 70);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${this.players[0]}: Square ${this.gameState.positions[0]}`, 20, 30);
    this.ctx.fillText(`${this.players[1]}: Square ${this.gameState.positions[1]}`, 20, 50);
    
    const currentPlayer = this.players[this.gameState.currentPlayer];
    this.ctx.fillStyle = '#4ecdc4';
    this.ctx.fillText(`Turn: ${currentPlayer}`, 20, 70);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('SNAKES & LADDERS', this.canvas.width / 2, 20);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('WINNER!', this.canvas.width / 2, this.canvas.height / 2 - 20);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(this.gameState.winner, this.canvas.width / 2, this.canvas.height / 2 + 30);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.SnakesLaddersGame = SnakesLaddersGame;