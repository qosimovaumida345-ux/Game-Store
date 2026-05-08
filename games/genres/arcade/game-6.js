// Snake Classic Game
class SnakeClassicGame {
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
      length: 5,
      direction: { x: 1, y: 0 },
      nextDirection: { x: 1, y: 0 },
      snake: [],
      food: null,
      obstacles: [],
      status: 'playing',
      speed: 150,
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    const gridSize = 20;
    const startX = Math.floor((this.canvas.width / gridSize) / 2);
    const startY = Math.floor((this.canvas.height / gridSize) / 2);
    
    this.gameState.snake = [];
    for (let i = 0; i < 5; i++) {
      this.gameState.snake.push({
        x: startX - i,
        y: startY
      });
    }
    
    this.spawnFood();
    this.gameState.gridSize = gridSize;
  }
  
  spawnFood() {
    const gridSize = this.gameState.gridSize;
    const cols = Math.floor(this.canvas.width / gridSize);
    const rows = Math.floor(this.canvas.height / gridSize);
    
    let validPosition = false;
    let x, y;
    
    while (!validPosition) {
      x = Math.floor(Math.random() * cols);
      y = Math.floor(Math.random() * rows);
      
      validPosition = !this.gameState.snake.some(seg => seg.x === x && seg.y === y);
    }
    
    this.gameState.food = { x, y };
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
    
    if (this.gameState.time >= this.gameState.speed / 1000) {
      this.gameState.time = 0;
      this.moveSnake();
    }
  }
  
  moveSnake() {
    this.gameState.direction = { ...this.gameState.nextDirection };
    
    const head = {
      x: this.gameState.snake[0].x + this.gameState.direction.x,
      y: this.gameState.snake[0].y + this.gameState.direction.y
    };
    
    const gridSize = this.gameState.gridSize;
    const cols = Math.floor(this.canvas.width / gridSize);
    const rows = Math.floor(this.canvas.height / gridSize);
    
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
      this.gameState.gameOver = true;
      return;
    }
    
    if (this.gameState.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
      this.gameState.gameOver = true;
      return;
    }
    
    this.gameState.snake.unshift(head);
    
    if (this.gameState.food && head.x === this.gameState.food.x && head.y === this.gameState.food.y) {
      this.gameState.score += 10;
      this.gameState.length++;
      
      if (this.gameState.score % 50 === 0) {
        this.gameState.speed = Math.max(50, this.gameState.speed - 10);
      }
      
      this.spawnFood();
    } else {
      this.gameState.snake.pop();
    }
  }
  
  changeDirection(dir) {
    const current = this.gameState.direction;
    
    if (dir.x !== -current.x && dir.y !== -current.y) {
      this.gameState.nextDirection = dir;
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (input.up) this.changeDirection({ x: 0, y: -1 });
    if (input.down) this.changeDirection({ x: 0, y: 1 });
    if (input.left) this.changeDirection({ x: -1, y: 0 });
    if (input.right) this.changeDirection({ x: 1, y: 0 });
    if (input.action && this.gameState.gameOver) this.resetGame();
  }
  
  resetGame() {
    this.gameState.score = 0;
    this.gameState.length = 5;
    this.gameState.direction = { x: 1, y: 0 };
    this.gameState.nextDirection = { x: 1, y: 0 };
    this.gameState.speed = 150;
    this.gameState.gameOver = false;
    
    const gridSize = this.gameState.gridSize;
    const startX = Math.floor((this.canvas.width / gridSize) / 2);
    const startY = Math.floor((this.canvas.height / gridSize) / 2);
    
    this.gameState.snake = [];
    for (let i = 0; i < 5; i++) {
      this.gameState.snake.push({
        x: startX - i,
        y: startY
      });
    }
    
    this.spawnFood();
  }
  
  render() {
    this.drawBackground();
    this.drawGrid();
    this.drawFood();
    this.drawSnake();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawGrid() {
    const gridSize = this.gameState.gridSize;
    
    this.ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    this.ctx.lineWidth = 1;
    
    for (let x = 0; x <= this.canvas.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    
    for (let y = 0; y <= this.canvas.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }
  
  drawFood() {
    if (!this.gameState.food) return;
    
    const gridSize = this.gameState.gridSize;
    const x = this.gameState.food.x * gridSize;
    const y = this.gameState.food.y * gridSize;
    
    const gradient = this.ctx.createRadialGradient(
      x + gridSize/2, y + gridSize/2, 0,
      x + gridSize/2, y + gridSize/2, gridSize/2
    );
    gradient.addColorStop(0, '#e74c3c');
    gradient.addColorStop(1, '#c0392b');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x + gridSize/2, y + gridSize/2, gridSize/2 - 2, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
    this.ctx.beginPath();
    this.ctx.arc(x + gridSize/3, y + gridSize/3, 3, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  drawSnake() {
    const gridSize = this.gameState.gridSize;
    
    this.gameState.snake.forEach((segment, i) => {
      const x = segment.x * gridSize;
      const y = segment.y * gridSize;
      
      if (i === 0) {
        const gradient = this.ctx.createLinearGradient(x, y, x + gridSize, y + gridSize);
        gradient.addColorStop(0, '#2ecc71');
        gradient.addColorStop(1, '#27ae60');
        this.ctx.fillStyle = gradient;
      } else {
        const alpha = 1 - (i / this.gameState.snake.length) * 0.5;
        this.ctx.fillStyle = `rgba(46, 204, 113, ${alpha})`;
      }
      
      this.ctx.beginPath();
      this.ctx.roundRect(x + 1, y + 1, gridSize - 2, gridSize - 2, 4);
      this.ctx.fill();
      
      if (i === 0) {
        this.ctx.fillStyle = '#fff';
        const dir = this.gameState.direction;
        const eyeOffset = 6;
        const eyeX1 = x + gridSize/2 - dir.y * eyeOffset;
        const eyeY1 = y + gridSize/2 - dir.x * eyeOffset;
        const eyeX2 = x + gridSize/2 + dir.y * eyeOffset;
        const eyeY2 = y + gridSize/2 + dir.x * eyeOffset;
        
        this.ctx.beginPath();
        this.ctx.arc(eyeX1, eyeY1, 3, 0, Math.PI * 2);
        this.ctx.arc(eyeX2, eyeY2, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(eyeX1 + dir.x, eyeY1 + dir.y, 1.5, 0, Math.PI * 2);
        this.ctx.arc(eyeX2 + dir.x, eyeY2 + dir.y, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, 10, 120, 50);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 35);
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(this.canvas.width - 100, 10, 90, 40);
    
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Length: ${this.gameState.length}`, this.canvas.width - 55, 35);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.fillText('SNAKE', this.canvas.width / 2, 25);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = '20px Arial';
    this.ctx.fillText('Press Action to Restart', this.canvas.width / 2, this.canvas.height / 2 + 70);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.SnakeClassicGame = SnakeClassicGame;