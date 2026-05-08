// Domino Board Game
class DominoGame {
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
      currentPlayer: 1,
      p1Tiles: [],
      p2Tiles: [],
      table: [],
      selectedTile: null,
      playableValues: [],
      status: 'playing',
      winner: null,
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    const tiles = [];
    for (let i = 0; i <= 6; i++) {
      for (let j = i; j <= 6; j++) {
        tiles.push([i, j]);
      }
    }
    
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    
    this.gameState.p1Tiles = tiles.slice(0, 7);
    this.gameState.p2Tiles = tiles.slice(7, 14);
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
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (input.action && this.gameState.selectedTile !== null) {
      this.playTile();
    }
  }
  
  playTile() {
    if (this.gameState.selectedTile === null) return;
    
    const playerTiles = this.gameState.currentPlayer === 1 ? 
      this.gameState.p1Tiles : this.gameState.p2Tiles;
    const tile = playerTiles[this.gameState.selectedTile];
    
    if (this.gameState.table.length === 0) {
      this.gameState.table.push({ tile, position: 'left' });
      this.gameState.playableValues = [tile[0], tile[1]];
    } else {
      const leftVal = this.gameState.playableValues[0];
      const rightVal = this.gameState.playableValues[this.gameState.playableValues.length - 1];
      
      if (tile[0] === leftVal || tile[1] === leftVal) {
        const position = tile[0] === leftVal ? tile[1] : tile[0];
        this.gameState.table.unshift({ tile, position });
        this.gameState.playableValues.unshift(position);
      } else if (tile[0] === rightVal || tile[1] === rightVal) {
        const position = tile[0] === rightVal ? tile[1] : tile[0];
        this.gameState.table.push({ tile, position });
        this.gameState.playableValues.push(position);
      }
    }
    
    playerTiles.splice(this.gameState.selectedTile, 1);
    this.gameState.selectedTile = null;
    this.gameState.currentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;
    
    if (playerTiles.length === 0) {
      this.gameState.winner = this.gameState.currentPlayer;
      this.gameState.gameOver = true;
    }
  }
  
  render() {
    this.drawBackground();
    this.drawTable();
    this.drawPlayerTiles();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    this.ctx.fillStyle = '#27ae60';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawTable() {
    const startX = 200;
    const startY = 250;
    const tileWidth = 60;
    const tileHeight = 30;
    
    this.gameState.table.forEach((item, i) => {
      const x = startX + i * (tileWidth + 5);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.fillRect(x, startY, tileWidth, tileHeight);
      this.ctx.strokeStyle = '#333';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, startY, tileWidth, tileHeight);
      
      this.ctx.fillStyle = '#000';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(item.tile[0].toString(), x + 20, startY + 22);
      this.ctx.fillText(item.tile[1].toString(), x + 40, startY + 22);
    });
  }
  
  drawPlayerTiles() {
    const playerTiles = this.gameState.currentPlayer === 1 ? 
      this.gameState.p1Tiles : this.gameState.p2Tiles;
    const startX = 150;
    const y = 500;
    
    playerTiles.forEach((tile, i) => {
      const x = startX + i * 70;
      const selected = this.gameState.selectedTile === i;
      
      this.ctx.fillStyle = selected ? '#f1c40f' : '#fff';
      this.ctx.fillRect(x, y, 60, 30);
      this.ctx.strokeStyle = '#333';
      this.ctx.lineWidth = selected ? 3 : 1;
      this.ctx.strokeRect(x, y, 60, 30);
      
      this.ctx.fillStyle = '#000';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(tile[0] + '|' + tile[1], x + 30, y + 20);
    });
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, 10, 150, 60);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Player: ' + this.gameState.currentPlayer, 20, 30);
    this.ctx.fillText('Tiles: ' + (this.gameState.currentPlayer === 1 ? 
      this.gameState.p1Tiles.length : this.gameState.p2Tiles.length), 20, 50);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('DOMINO', this.canvas.width / 2, 25);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Player ' + this.gameState.winner + ' Wins!', this.canvas.width / 2, this.canvas.height / 2);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.DominoGame = DominoGame;