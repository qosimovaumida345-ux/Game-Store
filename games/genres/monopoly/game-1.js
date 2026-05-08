// Monopoly-style Game
class MonopolyGame {
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
      positions: [0, 0],
      money: [1500, 1500],
      currentPlayer: 0,
      diceValue: 0,
      status: 'rolling',
      jailTurns: [0, 0],
      inJail: [false, false],
      properties: [[], []],
      turnPhase: 'roll',
      gameOver: false,
      winner: null
    };
    
    this.spaces = this.createSpaces();
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  createSpaces() {
    const names = [
      'GO', 'Mediterranean', 'Community Chest', 'Baltic', 'Income Tax', 'Railroad', 'Oriental',
      'Chance', 'Vermont', 'Connecticut', 'Jail', 'St. Charles', 'Electric Co.', 'States',
      'Virginia', 'Railroad', 'St. James', 'Community Chest', 'Tennessee', 'New York',
      'Free Parking', 'Kentucky', 'Chance', 'Indiana', 'Illinois', 'Railroad', 'Atlantic',
      'Ventnor', 'Water Works', 'Marvin Gardens', 'Go To Jail', 'Pacific', 'North Carolina',
      'Community Chest', 'Pennsylvania', 'Railroad', 'Chance', 'Park Place', 'Luxury Tax', 'Boardwalk'
    ];
    
    return names.map((name, i) => ({
      name,
      price: [0, 60, 0, 80, 200, 100, 120, 0, 140, 160, 0, 180, 150, 200, 220, 100, 240, 0, 260, 280, 0, 300, 0, 320, 350, 100, 400, 0, 120, 150, 0, 500, 0, 0, 550, 200, 600, 0, 350, 400][i] || 0,
      rent: [0, 2, 0, 4, 0, 25, 6, 0, 8, 10, 0, 12, 0, 14, 16, 25, 18, 0, 20, 22, 0, 24, 0, 26, 28, 25, 30, 0, 32, 35, 0, 40, 0, 0, 45, 50, 50, 0, 55, 60][i] || 0,
      type: ['go', 'property', 'chance', 'property', 'tax', 'railroad', 'property', 'chance', 'property', 'property', 'jail', 'property', 'utility', 'property', 'property', 'railroad', 'property', 'chance', 'property', 'property', 'parking', 'property', 'chance', 'property', 'property', 'railroad', 'property', 'chance', 'property', 'utility', 'property', 'jail', 'property', 'chance', 'property', 'railroad', 'property', 'chance', 'property', 'property', 'tax', 'property'][i],
      owner: null
    }));
  }
  
  initGame() {
    this.gameState.positions = [0, 0];
    this.gameState.money = [1500, 1500];
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
  
  rollDice() {
    if (this.gameState.status !== 'rolling') return;
    
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    this.gameState.diceValue = dice1 + dice2;
    
    if (this.gameState.inJail[this.gameState.currentPlayer]) {
      this.handleJailRoll(dice1, dice2);
    } else {
      this.movePlayer(this.gameState.diceValue);
    }
  }
  
  handleJailRoll(dice1, dice2) {
    const player = this.gameState.currentPlayer;
    this.gameState.jailTurns[player]++;
    
    if (dice1 === dice2 || this.gameState.jailTurns[player] >= 3) {
      this.gameState.inJail[player] = false;
      this.gameState.jailTurns[player] = 0;
      this.movePlayer(dice1 + dice2);
    } else {
      this.nextTurn();
    }
  }
  
  movePlayer(steps) {
    const player = this.gameState.currentPlayer;
    this.gameState.positions[player] = (this.gameState.positions[player] + steps) % 40;
    
    if (this.gameState.positions[player] < steps) {
      this.gameState.money[player] += 200;
    }
    
    this.processSpace();
  }
  
  processSpace() {
    const player = this.gameState.currentPlayer;
    const pos = this.gameState.positions[player];
    const space = this.spaces[pos];
    
    if (space.type === 'property' && space.owner === null && this.gameState.money[player] >= space.price) {
      this.gameState.status = 'buy';
    } else if (space.type === 'property' && space.owner !== null && space.owner !== player) {
      this.payRent();
    } else {
      this.nextTurn();
    }
  }
  
  buyProperty() {
    const player = this.gameState.currentPlayer;
    const pos = this.gameState.positions[player];
    const space = this.spaces[pos];
    
    if (this.gameState.money[player] >= space.price) {
      this.gameState.money[player] -= space.price;
      space.owner = player;
      this.gameState.properties[player].push(pos);
    }
    
    this.nextTurn();
  }
  
  payRent() {
    const player = this.gameState.currentPlayer;
    const pos = this.gameState.positions[player];
    const space = this.spaces[pos];
    const owner = space.owner;
    
    if (this.gameState.money[player] >= space.rent) {
      this.gameState.money[player] -= space.rent;
      this.gameState.money[owner] += space.rent;
    }
    
    this.nextTurn();
  }
  
  nextTurn() {
    this.gameState.currentPlayer = (this.gameState.currentPlayer + 1) % 2;
    this.gameState.status = 'rolling';
    this.gameState.diceValue = 0;
    
    this.checkBankruptcy();
  }
  
  checkBankruptcy() {
    this.players.forEach((player, i) => {
      if (this.gameState.money[i] <= 0) {
        this.gameState.properties[i].forEach(pos => {
          this.spaces[pos].owner = null;
        });
        this.gameState.money[i] = 0;
        this.gameState.positions[i] = -1;
        
        const otherPlayer = 1 - i;
        if (this.gameState.money[otherPlayer] > 0) {
          this.gameState.winner = this.players[otherPlayer];
          this.gameState.gameOver = true;
        }
      }
    });
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    const currentPlayer = this.players[this.gameState.currentPlayer];
    if (playerName !== currentPlayer) return;
    
    if (input.action && this.gameState.status === 'rolling') {
      this.rollDice();
    }
    
    if (input.a && this.gameState.status === 'buy') {
      this.buyProperty();
    }
  }
  
  render() {
    this.drawBoard();
    this.drawPlayers();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBoard() {
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const boardSize = 500;
    const startX = 150;
    const startY = 50;
    const spaceSize = boardSize / 10;
    
    for (let i = 0; i < 10; i++) {
      this.drawSpace(i, startX + i * spaceSize, startY, spaceSize, 'top');
      this.drawSpace(39 - i, startX + i * spaceSize, startY + boardSize, spaceSize, 'bottom');
    }
    
    for (let i = 1; i < 9; i++) {
      this.drawSpace(30 - i, startX, startY + i * spaceSize, spaceSize, 'left');
      this.drawSpace(10 + i, startX + boardSize, startY + i * spaceSize, spaceSize, 'right');
    }
    
    this.drawCenter();
  }
  
  drawSpace(index, x, y, size, side) {
    const space = this.spaces[index];
    
    this.ctx.fillStyle = space.owner !== null ? '#f39c12' : '#ecf0f1';
    this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
    this.ctx.strokeStyle = '#bdc3c7';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
    
    this.ctx.fillStyle = '#333';
    this.ctx.font = '8px Arial';
    this.ctx.textAlign = 'center';
    const shortName = space.name.substring(0, 8);
    this.ctx.fillText(shortName, x + size / 2, y + size / 2);
    
    if (space.price > 0) {
      this.ctx.fillStyle = '#666';
      this.ctx.font = '7px Arial';
      this.ctx.fillText(`$${space.price}`, x + size / 2, y + size / 2 + 10);
    }
  }
  
  drawCenter() {
    const cx = 400, cy = 300;
    
    this.ctx.fillStyle = '#27ae60';
    this.ctx.fillRect(cx - 100, cy - 100, 200, 200);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('MONOPOLY', cx, cy);
  }
  
  drawPlayers() {
    const boardSize = 500;
    const startX = 150;
    const startY = 50;
    const spaceSize = boardSize / 10;
    
    const colors = ['#3498db', '#e74c3c'];
    
    this.gameState.positions.forEach((pos, i) => {
      if (pos < 0) return;
      
      const getCoords = () => {
        const row = Math.floor(pos / 10);
        const col = pos % 10;
        
        if (row === 0) return { x: startX + col * spaceSize + spaceSize / 2, y: startY + 20 };
        if (row === 1) return { x: startX + 20, y: startY + (col + 1) * spaceSize - spaceSize / 2 };
        if (row === 2) return { x: startX + (9 - col) * spaceSize + spaceSize / 2, y: startY + boardSize - 20 };
        return { x: startX + boardSize - 20, y: startY + (10 - col) * spaceSize - spaceSize / 2 };
      };
      
      const coords = getCoords();
      const offset = i === 0 ? -8 : 8;
      
      this.ctx.fillStyle = colors[i];
      this.ctx.beginPath();
      this.ctx.arc(coords.x, coords.y + offset, 10, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, 10, 130, 80);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${this.players[0]}: $${this.gameState.money[0]}`, 20, 30);
    this.ctx.fillText(`${this.players[1]}: $${this.gameState.money[1]}`, 20, 50);
    
    const currentPlayer = this.players[this.gameState.currentPlayer];
    this.ctx.fillStyle = '#4ecdc4';
    this.ctx.fillText(`Turn: ${currentPlayer}`, 20, 70);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('MONOPOLY', this.canvas.width / 2, 20);
    
    if (this.gameState.status === 'rolling') {
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '12px Arial';
      this.ctx.fillText('Press ACTION to roll', this.canvas.width / 2, this.canvas.height - 20);
    }
    
    if (this.gameState.status === 'buy') {
      this.ctx.fillStyle = '#27ae60';
      this.ctx.font = '14px Arial';
      this.ctx.fillText('Press A to buy property', this.canvas.width / 2, this.canvas.height - 20);
    }
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
    this.ctx.fillText(`${this.gameState.winner} Wins!`, this.canvas.width / 2, this.canvas.height / 2 + 20);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.MonopolyGame = MonopolyGame;