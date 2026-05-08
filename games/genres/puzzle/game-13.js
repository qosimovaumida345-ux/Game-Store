// Light Cycle Game
class LightCycleGame {
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
      p1Score: 0,
      p2Score: 0,
      p1: null,
      p2: null,
      trails: [],
      status: 'racing',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.p1 = { x: 100, y: 300, dx: 1, dy: 0, color: '#00ffff' };
    this.gameState.p2 = { x: 700, y: 300, dx: -1, dy: 0, color: '#ff00ff' };
    this.gameState.trails = [];
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
    
    const p1 = this.gameState.p1;
    const p2 = this.gameState.p2;
    
    this.gameState.trails.push(
      { x: p1.x, y: p1.y, color: p1.color },
      { x: p2.x, y: p2.y, color: p2.color }
    );
    
    p1.x += p1.dx * 200 * deltaTime;
    p1.y += p1.dy * 200 * deltaTime;
    p2.x += p2.dx * 200 * deltaTime;
    p2.y += p2.dy * 200 * deltaTime;
    
    if (p1.x < 0 || p1.x > 800 || p1.y < 0 || p1.y > 600) {
      this.gameState.p2Score++;
      this.resetRound();
    }
    if (p2.x < 0 || p2.x > 800 || p2.y < 0 || p2.y > 600) {
      this.gameState.p1Score++;
      this.resetRound();
    }
    
    this.gameState.trails.forEach(t => {
      const d1 = Math.sqrt((p1.x - t.x) ** 2 + (p1.y - t.y) ** 2);
      const d2 = Math.sqrt((p2.x - t.x) ** 2 + (p2.y - t.y) ** 2);
      if (d1 < 10 && t.color === p1.color && this.gameState.trails.indexOf(t) < this.gameState.trails.length - 20) {
        this.gameState.p2Score++;
        this.resetRound();
      }
      if (d2 < 10 && t.color === p2.color && this.gameState.trails.indexOf(t) < this.gameState.trails.length - 20) {
        this.gameState.p1Score++;
        this.resetRound();
      }
      if (Math.abs(p1.x - p2.x) < 10 && Math.abs(p1.y - p2.y) < 10) {
        this.gameState.p1Score++;
        this.gameState.p2Score++;
        this.resetRound();
      }
    });
  }
  
  resetRound() {
    this.gameState.p1 = { x: 100, y: 300, dx: 1, dy: 0, color: '#00ffff' };
    this.gameState.p2 = { x: 700, y: 300, dx: -1, dy: 0, color: '#ff00ff' };
    this.gameState.trails = [];
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput1(input) {
    const p1 = this.gameState.p1;
    if (input.up && p1.dy === 0) { p1.dx = 0; p1.dy = -1; }
    if (input.down && p1.dy === 0) { p1.dx = 0; p1.dy = 1; }
    if (input.left && p1.dx === 0) { p1.dx = -1; p1.dy = 0; }
    if (input.right && p1.dx === 0) { p1.dx = 1; p1.dy = 0; }
  }
  
  handleInput2(input) {
    const p2 = this.gameState.p2;
    if (input.up && p2.dy === 0) { p2.dx = 0; p2.dy = -1; }
    if (input.down && p2.dy === 0) { p2.dx = 0; p2.dy = 1; }
    if (input.left && p2.dx === 0) { p2.dx = -1; p2.dy = 0; }
    if (input.right && p2.dx === 0) { p2.dx = 1; p2.dy = 0; }
  }
  
  render() {
    this.ctx.fillStyle = '#0a0a23';
    this.ctx.fillRect(0, 0, 800, 600);
    
    this.ctx.strokeStyle = '#1a1a3a';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < 800; i += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, 600);
      this.ctx.stroke();
    }
    for (let i = 0; i < 600; i += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(800, i);
      this.ctx.stroke();
    }
    
    this.ctx.lineWidth = 6;
    this.ctx.lineCap = 'round';
    let currentColor = null;
    let currentPath = [];
    
    this.gameState.trails.forEach(t => {
      if (t.color !== currentColor) {
        if (currentPath.length > 0) {
          this.ctx.strokeStyle = currentColor;
          this.ctx.beginPath();
          this.ctx.moveTo(currentPath[0].x, currentPath[0].y);
          currentPath.forEach(p => this.ctx.lineTo(p.x, p.y));
          this.ctx.stroke();
        }
        currentColor = t.color;
        currentPath = [t];
      } else {
        currentPath.push(t);
      }
    });
    
    if (currentPath.length > 0) {
      this.ctx.strokeStyle = currentColor;
      this.ctx.beginPath();
      this.ctx.moveTo(currentPath[0].x, currentPath[0].y);
      currentPath.forEach(p => this.ctx.lineTo(p.x, p.y));
      this.ctx.stroke();
    }
    
    const p1 = this.gameState.p1;
    this.ctx.fillStyle = p1.color;
    this.ctx.shadowColor = p1.color;
    this.ctx.shadowBlur = 20;
    this.ctx.fillRect(p1.x - 8, p1.y - 8, 16, 16);
    this.ctx.shadowBlur = 0;
    
    const p2 = this.gameState.p2;
    this.ctx.fillStyle = p2.color;
    this.ctx.shadowColor = p2.color;
    this.ctx.shadowBlur = 20;
    this.ctx.fillRect(p2.x - 8, p2.y - 8, 16, 16);
    this.ctx.shadowBlur = 0;
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 30px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.gameState.p1Score + ' - ' + this.gameState.p2Score, 400, 50);
    this.ctx.font = '16px Arial';
    this.ctx.fillText('P1: WASD | P2: Arrows', 400, 80);
    this.ctx.fillStyle = '#00ffff';
    this.ctx.fillText('LIGHT CYCLE', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    if (name === 'player1') this.handleInput1(input);
    if (name === 'player2') this.handleInput2(input);
  }
}

window.LightCycleGame = LightCycleGame;