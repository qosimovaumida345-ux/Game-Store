// Number Puzzle Game (2048 style)
class NumberPuzzleGame {
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
      board: [],
      size: 4,
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
    this.gameState.board = Array(4).fill(null).map(() => Array(4).fill(0));
    this.spawnTile();
    this.spawnTile();
  }
  
  spawnTile() {
    const empty = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (this.gameState.board[r][c] === 0) empty.push({ r, c });
      }
    }
    if (empty.length > 0) {
      const { r, c } = empty[Math.floor(Math.random() * empty.length)];
      this.gameState.board[r][c] = Math.random() < 0.9 ? 2 : 4;
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
    if (this.gameState.gameOver) return;
    this.gameState.time += deltaTime;
  }
  
  move(direction) {
    const board = this.gameState.board;
    let moved = false;
    
    const rotate = (times) => {
      for (let t = 0; t < times; t++) {
        const newBoard = board[0].map((_, i) => board.map(row => row[i]).reverse());
        for (let r = 0; r < 4; r++) board[r] = [...newBoard[r]];
      }
    };
    
    const compress = () => {
      for (let r = 0; r < 4; r++) {
        let arr = board[r].filter(x => x !== 0);
        for (let i = 0; i < arr.length - 1; i++) {
          if (arr[i] === arr[i + 1]) {
            arr[i] *= 2;
            this.gameState.score += arr[i];
            arr.splice(i + 1, 1);
          }
        }
        while (arr.length < 4) arr.push(0);
        if (board[r].join(',') !== arr.join(',')) moved = true;
        board[r] = arr;
      }
    };
    
    const dirs = { left: 0, down: 1, right: 2, up: 3 };
    rotate(dirs[direction]);
    compress();
    rotate(4 - dirs[direction]);
    
    if (moved) {
      this.spawnTile();
      if (this.checkFull()) this.gameState.gameOver = true;
    }
  }
  
  checkFull() {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (this.gameState.board[r][c] === 0) return false;
        if (c < 3 && this.gameState.board[r][c] === this.gameState.board[r][c + 1]) return false;
        if (r < 3 && this.gameState.board[r][c] === this.gameState.board[r + 1][c]) return false;
      }
    }
    return true;
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input) {
    if (input.left) this.move('left');
    if (input.right) this.move('right');
    if (input.up) this.move('up');
    if (input.down) this.move('down');
  }
  
  render() {
    this.ctx.fillStyle = '#faf8ef';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const cellSize = 80;
    const gap = 10;
    const offsetX = 200;
    const offsetY = 100;
    const colors = { 0: '#cdc1b4', 2: '#eee4da', 4: '#ede0c8', 8: '#f2b179', 16: '#f59563', 32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72', 256: '#edcc61', 512: '#edc850', 1024: '#edc53f', 2048: '#edc22e' };
    
    this.ctx.fillStyle = '#bbada0';
    this.ctx.fillRect(offsetX - 10, offsetY - 10, cellSize * 4 + gap * 3 + 20, cellSize * 4 + gap * 3 + 20);
    
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = this.gameState.board[r][c];
        this.ctx.fillStyle = colors[val] || '#3c3a32';
        this.ctx.fillRect(offsetX + c * (cellSize + gap), offsetY + r * (cellSize + gap), cellSize, cellSize);
        if (val > 0) {
          this.ctx.fillStyle = val > 4 ? '#f9f6f2' : '#776e65';
          this.ctx.font = 'bold ' + (val > 99 ? '20' : '28') + 'px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(val.toString(), offsetX + c * (cellSize + gap) + cellSize / 2, offsetY + r * (cellSize + gap) + cellSize / 2 + 8);
        }
      }
    }
    
    this.ctx.fillStyle = '#776e65';
    this.ctx.font = '18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Score: ' + this.gameState.score, 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('2048', this.canvas.width / 2, 30);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input);
  }
}

window.NumberPuzzleGame = NumberPuzzleGame;