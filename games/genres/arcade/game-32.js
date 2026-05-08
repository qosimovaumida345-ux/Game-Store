// Bubble Shooter Game
class BubbleShooterGame {
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
      currentBubble: null,
      nextBubble: null,
      bullet: null,
      cols: 12,
      rows: 8,
      bubbleRadius: 15,
      angle: Math.PI / 2,
      status: 'aiming',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6'];
    
    for (let row = 0; row < this.gameState.rows; row++) {
      this.gameState.grid[row] = [];
      for (let col = 0; col < this.gameState.cols; col++) {
        if (row < 4) {
          this.gameState.grid[row][col] = {
            color: colors[Math.floor(Math.random() * colors.length)],
            active: true
          };
        } else {
          this.gameState.grid[row][col] = null;
        }
      }
    }
    
    this.gameState.currentBubble = { color: colors[Math.floor(Math.random() * colors.length)] };
    this.gameState.nextBubble = { color: colors[Math.floor(Math.random() * colors.length)] };
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
    
    if (this.gameState.bullet) {
      const b = this.gameState.bullet;
      b.x += Math.cos(b.angle) * 400 * deltaTime;
      b.y += Math.sin(b.angle) * 400 * deltaTime;
      
      if (b.x < 20 || b.x > 780) {
        b.angle = Math.PI - b.angle;
        b.x = Math.max(20, Math.min(780, b.x));
      }
      
      if (b.y < 20) {
        this.snapBubble(b);
        return;
      }
      
      for (let row = 0; row < this.gameState.rows; row++) {
        for (let col = 0; col < this.gameState.cols; col++) {
          const cell = this.gameState.grid[row][col];
          if (cell && cell.active) {
            const bx = col * 32 + 20;
            const by = row * 32 + 20;
            const dist = Math.sqrt((b.x - bx) ** 2 + (b.y - by) ** 2);
            if (dist < this.gameState.bubbleRadius * 2) {
              this.snapBubble(b);
              return;
            }
          }
        }
      }
    }
  }
  
  snapBubble(bullet) {
    const col = Math.floor((bullet.x - 20) / 32);
    const row = Math.floor((bullet.y - 20) / 32);
    
    const finalCol = Math.max(0, Math.min(this.gameState.cols - 1, col));
    const finalRow = Math.max(0, Math.min(this.gameState.rows - 1, row));
    
    if (!this.gameState.grid[finalRow][finalCol]) {
      this.gameState.grid[finalRow][finalCol] = { color: bullet.color, active: true };
      this.gameState.score += 10;
      
      this.findAndRemoveMatches(finalRow, finalCol, bullet.color);
      this.dropFloatingBubbles();
      
      if (this.checkGameOver()) {
        this.gameState.gameOver = true;
      }
    }
    
    this.gameState.bullet = null;
    this.gameState.currentBubble = this.gameState.nextBubble;
    this.gameState.nextBubble = { color: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6'][Math.floor(Math.random() * 5)] };
  }
  
  findAndRemoveMatches(row, col, color) {
    const visited = new Set();
    const matches = [];
    
    const dfs = (r, c) => {
      const key = r + ',' + c;
      if (visited.has(key)) return;
      visited.add(key);
      
      const cell = this.gameState.grid[r] && this.gameState.grid[r][c];
      if (!cell || !cell.active || cell.color !== color) return;
      
      matches.push({ r, c });
      
      const neighbors = this.getNeighbors(r, c);
      neighbors.forEach(n => dfs(n.r, n.c));
    };
    
    dfs(row, col);
    
    if (matches.length >= 3) {
      matches.forEach(m => {
        this.gameState.grid[m.r][m.c] = null;
        this.gameState.score += 20;
      });
    }
  }
  
  getNeighbors(row, col) {
    const neighbors = [];
    const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    offsets.forEach(([dr, dc]) => {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < this.gameState.rows && nc >= 0 && nc < this.gameState.cols) {
        neighbors.push({ r: nr, c: nc });
      }
    });
    
    return neighbors;
  }
  
  dropFloatingBubbles() {
    const attached = new Set();
    
    for (let col = 0; col < this.gameState.cols; col++) {
      if (this.gameState.grid[0][col] && this.gameState.grid[0][col].active) {
        this.dfsAttach(0, col, attached);
      }
    }
    
    for (let row = 0; row < this.gameState.rows; row++) {
      for (let col = 0; col < this.gameState.cols; col++) {
        const key = row + ',' + col;
        if (this.gameState.grid[row][col] && this.gameState.grid[row][col].active && !attached.has(key)) {
          this.gameState.grid[row][col] = null;
          this.gameState.score += 30;
        }
      }
    }
  }
  
  dfsAttach(row, col, attached) {
    const key = row + ',' + col;
    if (attached.has(key)) return;
    attached.add(key);
    
    const neighbors = this.getNeighbors(row, col);
    neighbors.forEach(n => {
      const cell = this.gameState.grid[n.r] && this.gameState.grid[n.r][n.c];
      if (cell && cell.active) {
        this.dfsAttach(n.r, n.c, attached);
      }
    });
  }
  
  checkGameOver() {
    for (let col = 0; col < this.gameState.cols; col++) {
      if (this.gameState.grid[this.gameState.rows - 1][col] && this.gameState.grid[this.gameState.rows - 1][col].active) {
        return true;
      }
    }
    return false;
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  fire(angle) {
    if (!this.gameState.bullet && !this.gameState.gameOver) {
      this.gameState.bullet = {
        x: 400,
        y: 560,
        angle: angle,
        color: this.gameState.currentBubble.color
      };
    }
  }
  
  render() {
    const grad = this.ctx.createLinearGradient(0, 0, 0, 600);
    grad.addColorStop(0, '#2c3e50');
    grad.addColorStop(1, '#1a252f');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, 800, 600);
    
    this.ctx.fillStyle = '#34495e';
    this.ctx.fillRect(0, 0, 800, 20);
    
    for (let row = 0; row < this.gameState.rows; row++) {
      for (let col = 0; col < this.gameState.cols; col++) {
        const cell = this.gameState.grid[row][col];
        if (cell && cell.active) {
          const x = col * 32 + 20;
          const y = row * 32 + 20;
          
          const gradient = this.ctx.createRadialGradient(x - 5, y - 5, 0, x, y, 15);
          gradient.addColorStop(0, '#fff');
          gradient.addColorStop(0.3, cell.color);
          gradient.addColorStop(1, this.darkenColor(cell.color, 30));
          
          this.ctx.fillStyle = gradient;
          this.ctx.beginPath();
          this.ctx.arc(x, y, 14, 0, Math.PI*2);
          this.ctx.fill();
        }
      }
    }
    
    if (this.gameState.bullet) {
      const b = this.gameState.bullet;
      const gradient = this.ctx.createRadialGradient(b.x - 5, b.y - 5, 0, b.x, b.y, 15);
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(0.3, b.color);
      gradient.addColorStop(1, this.darkenColor(b.color, 30));
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, 14, 0, Math.PI*2);
      this.ctx.fill();
    }
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Score: ' + this.gameState.score, 20, 50);
    this.ctx.fillText('Next:', 650, 50);
    
    const gradient = this.ctx.createRadialGradient(680 - 5, 40 - 5, 0, 680, 40, 15);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(0.3, this.gameState.nextBubble.color);
    gradient.addColorStop(1, this.darkenColor(this.gameState.nextBubble.color, 30));
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(680, 40, 14, 0, Math.PI*2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BUBBLE SHOOTER', 400, 15);
  }
  
  darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    if (input.angle !== undefined) {
      this.gameState.angle = input.angle;
    }
    if (input.fire) {
      this.fire(this.gameState.angle);
    }
  }
}

window.BubbleShooterGame = BubbleShooterGame;