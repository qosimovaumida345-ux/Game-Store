// Simon Memory Game
class SimonGame {
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
      sequence: [],
      playerSequence: [],
      round: 1,
      score: 0,
      status: 'watching',
      buttons: [],
      activeButton: null,
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.buttons = [
      { x: 250, y: 200, width: 150, height: 150, color: '#e74c3c', id: 0 },
      { x: 400, y: 200, width: 150, height: 150, color: '#3498db', id: 1 },
      { x: 250, y: 350, width: 150, height: 150, color: '#f1c40f', id: 2 },
      { x: 400, y: 350, width: 150, height: 150, color: '#2ecc71', id: 3 }
    ];
    this.addToSequence();
  }
  
  addToSequence() {
    this.gameState.sequence.push(Math.floor(Math.random() * 4));
  }
  
  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.playSequence();
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
  
  playSequence() {
    let i = 0;
    const playNext = () => {
      if (i >= this.gameState.sequence.length) {
        this.gameState.status = 'playing';
        return;
      }
      
      this.gameState.activeButton = this.gameState.sequence[i];
      this.gameState.time = 0;
      
      setTimeout(() => {
        this.gameState.activeButton = null;
        i++;
        setTimeout(playNext, 300);
      }, 500);
    };
    
    playNext();
  }
  
  pressButton(id) {
    if (this.gameState.status !== 'playing' || this.gameState.gameOver) return;
    
    this.gameState.playerSequence.push(id);
    
    if (this.gameState.playerSequence[this.gameState.playerSequence.length - 1] !== 
        this.gameState.sequence[this.gameState.playerSequence.length - 1]) {
      this.gameState.gameOver = true;
      return;
    }
    
    if (this.gameState.playerSequence.length === this.gameState.sequence.length) {
      this.gameState.score += this.gameState.round * 10;
      this.gameState.round++;
      this.gameState.playerSequence = [];
      this.addToSequence();
      
      setTimeout(() => this.playSequence(), 1000);
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (input.a) this.pressButton(0);
    if (input.b) this.pressButton(1);
    if (input.up) this.pressButton(2);
    if (input.down) this.pressButton(3);
  }
  
  render() {
    this.drawBackground();
    this.drawButtons();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawButtons() {
    this.gameState.buttons.forEach(btn => {
      this.ctx.fillStyle = btn.id === this.gameState.activeButton ? btn.color : btn.color + 'aa';
      this.ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);
    });
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, 10, 130, 60);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Round: ' + this.gameState.round, 20, 30);
    this.ctx.fillText('Score: ' + this.gameState.score, 20, 50);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('SIMON', this.canvas.width / 2, 25);
    if (this.gameState.status === 'watching') {
      this.ctx.font = '14px Arial';
      this.ctx.fillText('Watch the sequence...', this.canvas.width / 2, this.canvas.height - 30);
    }
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '24px Arial';
    this.ctx.fillText('Final Score: ' + this.gameState.score, this.canvas.width / 2, this.canvas.height / 2 + 40);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.SimonGame = SimonGame;