// Sliding Puzzle Game
class SlidingPuzzleGame {
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
      moves: 0,
      bestMoves: 0,
      status: 'playing',
      tiles: [],
      size: 4,
      emptyPos: { x: 3, y: 3 },
      solved: false,
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.tiles = [];
    
    let num = 1;
    for (let y = 0; y < this.gameState.size; y++) {
      for (let x = 0; x < this.gameState.size; x++) {
        if (x === this.gameState.size - 1 && y === this.gameState.size - 1) {
          this.gameState.tiles.push(null);
        } else {
          this.gameState.tiles.push({ value: num, x, y });
        }
        num++;
      }
    }
    
    this.shuffleTiles();
  }
  
  shuffleTiles() {
    for (let i = 0; i < 1000; i++) {
      const empty = this.gameState.emptyPos;
      const moves = [
        { x: empty.x - 1, y: empty.y },
        { x: empty.x + 1, y: empty.y },
        { x: empty.x, y: empty.y - 1 },
        { x: empty.x, y: empty.y + 1 }
      ].filter(m => m.x >= 0 && m.x < this.gameState.size && m.y >= 0 && m.y < this.gameState.size);
      
      const move = moves[Math.floor(Math.random() * moves.length)];
      this.swapTiles(move.x, move.y);
    }
  }
  
  swapTiles(x, y) {
    const empty = this.gameState.emptyPos;
    
    this.gameState.tiles.forEach(tile => {
      if (tile) {
        if (tile.x === x && tile.y === y) {
          tile.x = empty.x;
          tile.y = empty.y;
        }
      }
    });
    
    this.gameState.emptyPos = { x, y };
  }
  
  canMove(x, y) {
    const empty = this.gameState.emptyPos;
    return Math.abs(x - empty.x) + Math.abs(y - empty.y) === 1;
  }
  
  moveTile(x, y) {
    if (!this.canMove(x, y) || this.gameState.solved) return;
    
    this.swapTiles(x, y);
    this.gameState.moves++;
    
    this.checkWin();
  }
  
  checkWin() {
    let expected = 1;
    
    for (let y = 0; y < this.gameState.size; y++) {
      for (let x = 0; x < this.gameState.size; x++) {
        const idx = y * this.gameState.size + x;
        const tile = this.gameState.tiles[idx];
        
        if (tile) {
          if (tile.value !== expected) return;
        } else if (expected !== this.gameState.size * this.gameState.size) {
          return;
        }
        expected++;
      }
    }
    
    this.gameState.solved = true;
    this.gameState.gameOver = true;
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
    const empty = this.gameState.emptyPos;
    
    if (input.up && empty.y < this.gameState.size - 1) {
      this.moveTile(empty.x, empty.y + 1);
    }
    if (input.down && empty.y > 0) {
      this.moveTile(empty.x, empty.y - 1);
    }
    if (input.left && empty.x < this.gameState.size - 1) {
      this.moveTile(empty.x + 1, empty.y);
    }
    if (input.right && empty.x > 0) {
      this.moveTile(empty.x - 1, empty.y);
    }
    if (input.action && this.gameState.solved) {
      this.initGame();
    }
  }
  
  render() {
    this.drawBackground();
    this.drawPuzzle();
    this.drawUI();
    if (this.gameState.gameOver) this.drawWin();
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1e3c72');
    gradient.addColorStop(1, '#2a5298');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawPuzzle() {
    const size = this.gameState.size;
    const padding = 50;
    const tileSize = Math.min(120, (this.canvas.width - padding * 2) / size);
    const gap = 5;
    const totalSize = size * tileSize + (size - 1) * gap;
    const offsetX = (this.canvas.width - totalSize) / 2;
    const offsetY = (this.canvas.height - totalSize) / 2;
    
    this.gameState.tiles.forEach((tile, idx) => {
      if (!tile) return;
      
      const x = offsetX + tile.x * (tileSize + gap);
      const y = offsetY + tile.y * (tileSize + gap);
      
      const colors = [
        '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71',
        '#3498db', '#9b59b6', '#1abc9c', '#34495e',
        '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71',
        '#3498db', '#9b59b6', '#1abc9c', '#34495e'
      ];
      
      const gradient = this.ctx.createLinearGradient(x, y, x + tileSize, y + tileSize);
      gradient.addColorStop(0, colors[tile.value - 1]);
      gradient.addColorStop(1, this.shadeColor(colors[tile.value - 1], -20));
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.roundRect(x, y, tileSize, tileSize, 10);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 36px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(tile.value.toString(), x + tileSize/2, y + tileSize/2);
    });
  }
  
  shadeColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, 10, 120, 60);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Moves: ${this.gameState.moves}`, 20, 35);
    this.ctx.fillText(`Time: ${Math.floor(this.gameState.time)}s`, 20, 55);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('SLIDING PUZZLE', this.canvas.width / 2, 25);
  }
  
  drawWin() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('SOLVED!', this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Moves: ${this.gameState.moves}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    this.ctx.fillText(`Time: ${Math.floor(this.gameState.time)}s`, this.canvas.width / 2, this.canvas.height / 2 + 60);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.SlidingPuzzleGame = SlidingPuzzleGame;