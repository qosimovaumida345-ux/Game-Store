// Jigsaw Puzzle Game
class JigsawPuzzleGame {
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
      pieces: [],
      correctPositions: [],
      selectedPiece: null,
      placedPieces: [],
      gridSize: 4,
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
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#34495e', '#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'];
    for (let i = 0; i < 16; i++) {
      this.gameState.pieces.push({
        id: i,
        x: 50 + (i % 4) * 30,
        y: 50 + Math.floor(i / 4) * 30 + (i < 8 ? 0 : 200),
        correctX: 200 + (i % 4) * 120,
        correctY: 100 + Math.floor(i / 4) * 100,
        color: colors[i],
        placed: false
      });
    }
    this.gameState.correctPositions = this.gameState.pieces.map(p => ({ x: p.correctX, y: p.correctY }));
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
    if (this.gameState.placedPieces.length === 16) {
      this.gameState.score = Math.max(0, 10000 - Math.floor(this.gameState.time * 10));
      this.gameState.gameOver = true;
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#34495e';
    this.ctx.fillRect(180, 80, 500, 420);
    this.ctx.strokeStyle = '#fff';
    this.ctx.strokeRect(180, 80, 500, 420);
    
    this.gameState.pieces.forEach(p => {
      if (p.placed) return;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x, p.y, 28, 28);
      this.ctx.strokeStyle = '#fff';
      this.ctx.strokeRect(p.x, p.y, 28, 28);
    });
    
    this.gameState.placedPieces.forEach((p, idx) => {
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(200 + (idx % 4) * 120, 100 + Math.floor(idx / 4) * 100, 115, 95);
    });
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Time: ' + Math.floor(this.gameState.time) + 's | Placed: ' + this.gameState.placedPieces.length + '/16', 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('JIGSAW PUZZLE', this.canvas.width / 2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.JigsawPuzzleGame = JigsawPuzzleGame;