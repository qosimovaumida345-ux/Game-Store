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
      shots: 0,
      status: 'aiming',
      cannon: null,
      currentBubble: null,
      nextBubble: null,
      bubbles: [],
      particles: [],
      gameOver: false
    };
    
    this.config = {
      bubbleRadius: 18,
      bubbleDiameter: 36,
      gridRows: 10,
      gridCols: 12,
      shootSpeed: 15
    };
    
    this.colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 600;
    this.canvas.height = this.canvas.parentElement.clientHeight || 700;
  }
  
  initGame() {
    this.gameState.cannon = {
      x: this.canvas.width / 2,
      y: this.canvas.height - 50,
      angle: -Math.PI / 2
    };
    
    this.createBubbleGrid();
    this.gameState.currentBubble = this.createNewBubble();
    this.gameState.nextBubble = this.createNewBubble();
    this.gameState.particles = [];
  }
  
  createBubbleGrid() {
    this.gameState.bubbles = [];
    
    for (let row = 0; row < this.config.gridRows; row++) {
      this.gameState.bubbles[row] = [];
      
      for (let col = 0; col < this.config.gridCols; col++) {
        if (row < 5) {
          const offset = row % 2 === 1 ? this.config.bubbleRadius : 0;
          
          if (col < this.config.gridCols - (row % 2)) {
            this.gameState.bubbles[row][col] = {
              x: col * this.config.bubbleDiameter + this.config.bubbleRadius + offset,
              y: row * this.config.bubbleDiameter + this.config.bubbleRadius,
              color: this.colors[Math.floor(Math.random() * this.colors.length)],
              row: row,
              col: col,
              toRemove: false
            };
          } else {
            this.gameState.bubbles[row][col] = null;
          }
        } else {
          this.gameState.bubbles[row][col] = null;
        }
      }
    }
  }
  
  createNewBubble() {
    return {
      x: this.gameState.cannon.x,
      y: this.gameState.cannon.y,
      vx: 0,
      vy: 0,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      active: false
    };
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
    
    this.updateBubble();
    this.updateParticles();
    this.checkGameOver();
  }
  
  updateBubble() {
    const bubble = this.gameState.currentBubble;
    
    if (!bubble.active) return;
    
    bubble.x += bubble.vx;
    bubble.y += bubble.vy;
    
    if (bubble.x < this.config.bubbleRadius || bubble.x > this.canvas.width - this.config.bubbleRadius) {
      bubble.vx *= -1;
      bubble.x = Math.max(this.config.bubbleRadius, Math.min(this.canvas.width - this.config.bubbleRadius, bubble.x));
    }
    
    if (bubble.y < this.config.bubbleRadius) {
      this.snapBubbleToGrid();
      return;
    }
    
    this.checkBubbleCollision();
  }
  
  checkBubbleCollision() {
    const bubble = this.gameState.currentBubble;
    
    for (let row = 0; row < this.config.gridRows; row++) {
      for (let col = 0; col < this.config.gridCols; col++) {
        const gridBubble = this.gameState.bubbles[row][col];
        
        if (gridBubble) {
          const dx = bubble.x - gridBubble.x;
          const dy = bubble.y - gridBubble.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < this.config.bubbleDiameter - 5) {
            this.snapBubbleToGrid();
            return;
          }
        }
      }
    }
  }
  
  snapBubbleToGrid() {
    const bubble = this.gameState.currentBubble;
    bubble.active = false;
    this.gameState.shots++;
    
    let bestRow = 0;
    let bestCol = 0;
    let bestDist = Infinity;
    
    for (let row = 0; row < this.config.gridRows; row++) {
      for (let col = 0; col < this.config.gridCols; col++) {
        const offset = row % 2 === 1 ? this.config.bubbleRadius : 0;
        const x = col * this.config.bubbleDiameter + this.config.bubbleRadius + offset;
        const y = row * this.config.bubbleDiameter + this.config.bubbleRadius;
        
        const dx = bubble.x - x;
        const dy = bubble.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < bestDist) {
          const existing = this.gameState.bubbles[row] && this.gameState.bubbles[row][col];
          if (!existing && y < this.canvas.height - 100) {
            bestDist = dist;
            bestRow = row;
            bestCol = col;
          }
        }
      }
    }
    
    if (!this.gameState.bubbles[bestRow]) {
      this.gameState.bubbles[bestRow] = [];
    }
    
    const offset = bestRow % 2 === 1 ? this.config.bubbleRadius : 0;
    
    this.gameState.bubbles[bestRow][bestCol] = {
      x: bestCol * this.config.bubbleDiameter + this.config.bubbleRadius + offset,
      y: bestRow * this.config.bubbleDiameter + this.config.bubbleRadius,
      color: bubble.color,
      row: bestRow,
      col: bestCol,
      toRemove: false
    };
    
    this.gameState.score += 10;
    this.findFloatingBubbles(bestRow, bestCol, bubble.color);
    
    const temp = this.gameState.currentBubble;
    this.gameState.currentBubble = this.gameState.nextBubble;
    this.gameState.nextBubble = temp;
    this.gameState.currentBubble.x = this.gameState.cannon.x;
    this.gameState.currentBubble.y = this.gameState.cannon.y;
    this.gameState.currentBubble.vx = 0;
    this.gameState.currentBubble.vy = 0;
    this.gameState.currentBubble.active = false;
  }
  
  findFloatingBubbles(startRow, startCol, color) {
    const connected = [];
    const visited = new Set();
    
    const checkNeighbor = (row, col) => {
      const key = `${row},${col}`;
      if (visited.has(key)) return;
      
      const bubble = this.gameState.bubbles[row] && this.gameState.bubbles[row][col];
      if (!bubble) return;
      
      visited.add(key);
      connected.push(bubble);
      
      const neighbors = this.getNeighbors(row, col);
      neighbors.forEach(n => checkNeighbor(n.row, n.col));
    };
    
    checkNeighbor(startRow, startCol);
    
    const connectedColors = connected.filter(b => b.color === color);
    
    if (connectedColors.length >= 3) {
      connectedColors.forEach(b => {
        this.gameState.bubbles[b.row][b.col] = null;
        this.createParticles(b.x, b.y, b.color, 8);
        this.gameState.score += 20;
      });
      
      this.removeFloatingBubbles();
    }
  }
  
  removeFloatingBubbles() {
    const attached = new Set();
    
    for (let col = 0; col < this.config.gridCols; col++) {
      if (this.gameState.bubbles[0] && this.gameState.bubbles[0][col]) {
        const bfs = (row, col) => {
          const key = `${row},${col}`;
          if (attached.has(key)) return;
          
          const bubble = this.gameState.bubbles[row] && this.gameState.bubbles[row][col];
          if (!bubble) return;
          
          attached.add(key);
          
          const neighbors = this.getNeighbors(row, col);
          neighbors.forEach(n => bfs(n.row, n.col));
        };
        
        bfs(0, col);
      }
    }
    
    for (let row = 0; row < this.config.gridRows; row++) {
      for (let col = 0; col < this.config.gridCols; col++) {
        const bubble = this.gameState.bubbles[row] && this.gameState.bubbles[row][col];
        if (bubble && !attached.has(`${row},${col}`)) {
          this.gameState.bubbles[row][col] = null;
          this.createParticles(bubble.x, bubble.y, bubble.color, 8);
          this.gameState.score += 30;
        }
      }
    }
  }
  
  getNeighbors(row, col) {
    const neighbors = [];
    const isOddRow = row % 2 === 1;
    
    const offsets = isOddRow ? [
      [-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]
    ] : [
      [-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]
    ];
    
    offsets.forEach(([dr, dc]) => {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (newRow >= 0 && newRow < this.config.gridRows && 
          newCol >= 0 && newCol < this.config.gridCols) {
        neighbors.push({ row: newRow, col: newCol });
      }
    });
    
    return neighbors;
  }
  
  createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      this.gameState.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        radius: Math.random() * 5 + 3,
        color: color,
        life: 1
      });
    }
  }
  
  updateParticles() {
    this.gameState.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.03;
      p.vy += 0.2;
    });
    
    this.gameState.particles = this.gameState.particles.filter(p => p.life > 0);
  }
  
  shoot() {
    if (this.gameState.currentBubble.active) return;
    
    const angle = this.gameState.cannon.angle;
    this.gameState.currentBubble.vx = Math.cos(angle) * this.config.shootSpeed;
    this.gameState.currentBubble.vy = Math.sin(angle) * this.config.shootSpeed;
    this.gameState.currentBubble.active = true;
  }
  
  checkGameOver() {
    for (let col = 0; col < this.config.gridCols; col++) {
      const bottomRow = this.config.gridRows - 1;
      if (this.gameState.bubbles[bottomRow] && this.gameState.bubbles[bottomRow][col]) {
        this.gameState.gameOver = true;
        return;
      }
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    const cannon = this.gameState.cannon;
    
    if (input.left) {
      cannon.angle = Math.max(-Math.PI + 0.2, cannon.angle - 0.1);
    }
    if (input.right) {
      cannon.angle = Math.min(-0.2, cannon.angle + 0.1);
    }
    if (input.action) {
      this.shoot();
    }
  }
  
  render() {
    this.drawBackground();
    this.drawCannon();
    this.drawBubbles();
    this.drawNextBubble();
    this.drawParticles();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    this.ctx.lineWidth = 1;
    for (let y = 0; y < this.canvas.height; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }
  
  drawCannon() {
    const cannon = this.gameState.cannon;
    
    this.ctx.save();
    this.ctx.translate(cannon.x, cannon.y);
    this.ctx.rotate(cannon.angle);
    
    this.ctx.fillStyle = '#666';
    this.ctx.fillRect(-10, -30, 20, 40);
    
    this.ctx.fillStyle = '#888';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }
  
  drawBubbles() {
    for (let row = 0; row < this.config.gridRows; row++) {
      if (!this.gameState.bubbles[row]) continue;
      
      for (let col = 0; col < this.config.gridCols; col++) {
        const bubble = this.gameState.bubbles[row][col];
        
        if (bubble) {
          this.drawSingleBubble(bubble.x, bubble.y, bubble.color);
        }
      }
    }
  }
  
  drawNextBubble() {
    if (this.gameState.nextBubble) {
      this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Next:', 50, this.canvas.height - 25);
      
      this.drawSingleBubble(50, this.canvas.height - 10, this.gameState.nextBubble.color, 15);
    }
    
    const current = this.gameState.currentBubble;
    if (!current.active) {
      this.drawSingleBubble(current.x, current.y, current.color);
    } else {
      this.drawSingleBubble(current.x, current.y, current.color);
    }
  }
  
  drawSingleBubble(x, y, color, radius = this.config.bubbleRadius) {
    const gradient = this.ctx.createRadialGradient(x - radius/3, y - radius/3, 0, x, y, radius);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(0.3, color);
    gradient.addColorStop(1, this.darkenColor(color));
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius - 1, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius - 1, 0, Math.PI * 2);
    this.ctx.stroke();
  }
  
  darkenColor(color) {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 50);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 50);
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 50);
    return `rgb(${r},${g},${b})`;
  }
  
  drawParticles() {
    this.gameState.particles.forEach(p => {
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 120, 60);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    this.ctx.fillText(`Shots: ${this.gameState.shots}`, 20, 55);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BUBBLE SHOOTER', this.canvas.width / 2, 30);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.BubbleShooterGame = BubbleShooterGame;