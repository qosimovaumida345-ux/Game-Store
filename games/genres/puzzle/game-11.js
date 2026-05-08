// Color Match Game
class ColorMatchGame {
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
      targetColor: null,
      colors: [],
      round: 1,
      rounds: 10,
      status: 'playing',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.colors = [
      { name: 'Red', hex: '#e74c3c' },
      { name: 'Blue', hex: '#3498db' },
      { name: 'Green', hex: '#2ecc71' },
      { name: 'Yellow', hex: '#f1c40f' },
      { name: 'Purple', hex: '#9b59b6' },
      { name: 'Orange', hex: '#e67e22' }
    ];
    this.nextRound();
  }
  
  nextRound() {
    this.gameState.targetColor = this.gameState.colors[Math.floor(Math.random() * this.gameState.colors.length)];
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
  
  selectColor(index) {
    const selected = this.gameState.colors[index];
    if (selected.name === this.gameState.targetColor.name) {
      this.gameState.score += 100;
    } else {
      this.gameState.score = Math.max(0, this.gameState.score - 20);
    }
    this.gameState.round++;
    if (this.gameState.round > this.gameState.rounds) {
      this.gameState.gameOver = true;
    } else {
      this.nextRound();
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input) {
    if (input.a) this.selectColor(0);
    if (input.b) this.selectColor(1);
    if (input.up) this.selectColor(2);
    if (input.down) this.selectColor(3);
    if (input.left) this.selectColor(4);
    if (input.right) this.selectColor(5);
  }
  
  render() {
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Find: ' + this.gameState.targetColor.name, this.canvas.width/2, 150);
    
    const cellSize = 80;
    const startX = 200;
    const startY = 250;
    this.gameState.colors.forEach((c, i) => {
      this.ctx.fillStyle = c.hex;
      this.ctx.fillRect(startX + (i%3) * 120, startY + Math.floor(i/3) * 100, cellSize, cellSize);
    });
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Score: ' + this.gameState.score + ' | Round: ' + this.gameState.round + '/' + this.gameState.rounds, 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.fillText('COLOR MATCH', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input);
  }
}

window.ColorMatchGame = ColorMatchGame;