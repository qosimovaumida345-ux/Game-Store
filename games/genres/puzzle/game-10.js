// Crossword Puzzle Game
class CrosswordPuzzleGame {
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
      grid: [],
      clues: ['HTML', 'JAVA', 'CODE', 'GAME', 'WEB', 'DATA', 'NODE', 'JAVA'],
      answers: ['HTML', 'JAVA', 'CODE', 'GAME', 'WEB', 'DATA', 'NODE', 'JAVA'],
      currentWord: 0,
      currentLetter: 0,
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    const size = 8;
    this.gameState.grid = Array(size).fill(null).map(() => Array(size).fill(''));
    this.gameState.clues.forEach((word, i) => {
      const row = i;
      word.split('').forEach((letter, j) => {
        this.gameState.grid[row][j] = letter;
      });
    });
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
  
  render() {
    this.ctx.fillStyle = '#f5f5dc';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const cellSize = 40;
    const offsetX = 200;
    const offsetY = 80;
    
    this.gameState.grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        this.ctx.fillStyle = cell !== '' ? '#fff' : '#333';
        this.ctx.fillRect(offsetX + c * cellSize, offsetY + r * cellSize, cellSize, cellSize);
        this.ctx.strokeStyle = '#666';
        this.ctx.strokeRect(offsetX + c * cellSize, offsetY + r * cellSize, cellSize, cellSize);
        if (cell !== '') {
          this.ctx.fillStyle = '#000';
          this.ctx.font = 'bold 20px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(cell, offsetX + c * cellSize + cellSize/2, offsetY + r * cellSize + cellSize/2 + 7);
        }
      });
    });
    
    this.ctx.fillStyle = '#000';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Across:', 20, 100);
    this.gameState.answers.slice(0, 4).forEach((word, i) => {
      this.ctx.fillText((i+1) + '. ' + word, 20, 130 + i * 20);
    });
    
    this.ctx.fillText('Down:', 600, 100);
    this.gameState.answers.slice(4).forEach((word, i) => {
      this.ctx.fillText((i+5) + '. ' + word, 600, 130 + i * 20);
    });
    
    this.ctx.fillStyle = '#000';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Time: ' + Math.floor(this.gameState.time) + 's', 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.fillText('CROSSWORD', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.CrosswordPuzzleGame = CrosswordPuzzleGame;