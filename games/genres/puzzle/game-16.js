// Match-3 Jewel Game
class Match3JewelGame {
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
      moves: 30,
      grid: [],
      selected: null,
      swapping: false,
      animating: false,
      cols: 8,
      rows: 8,
      jewelSize: 50,
      jewelTypes: 6,
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
    const jewelColors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'];
    
    for (let row = 0; row < this.gameState.rows; row++) {
      this.gameState.grid[row] = [];
      for (let col = 0; col < this.gameState.cols; col++) {
        let type;
        do {
          type = Math.floor(Math.random() * this.gameState.jewelTypes);
        } while (this.hasMatch(row, col, type));
        
        this.gameState.grid[row][col] = { type: type, color: jewelColors[type], animY: 0 };
      }
    }
  }
  
  hasMatch(row, col, type) {
    if (col >= 2 && this.gameState.grid[row][col-1]?.type === type && 
        this.gameState.grid[row][col-2]?.type === type) return true;
    if (row >= 2 && this.gameState.grid[row-1][col]?.type === type && 
        this.gameState.grid[row-2][col]?.type === type) return true;
    return false;
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
    
    if (this.gameState.swapping) return;
    
    let matches = this.findMatches();
    if (matches.length > 0) {
      this.gameState.animating = true;
      this.removeMatches(matches);
      this.gameState.score += matches.length * 10;
      
      setTimeout(() => this.dropJewels(), 200);
    } else {
      this.gameState.animating = false;
    }
    
    if (this.gameState.moves <= 0) {
      this.gameState.gameOver = true;
    }
  }
  
  findMatches() {
    const matches = [];
    
    for (let row = 0; row < this.gameState.rows; row++) {
      for (let col = 0; col < this.gameState.cols - 2; col++) {
        const type = this.gameState.grid[row][col]?.type;
        if (type !== undefined && 
            this.gameState.grid[row][col+1]?.type === type && 
            this.gameState.grid[row][col+2]?.type === type) {
          matches.push({ row, col });
        }
      }
    }
    
    for (let col = 0; col < this.gameState.cols; col++) {
      for (let row = 0; row < this.gameState.rows - 2; row++) {
        const type = this.gameState.grid[row][col]?.type;
        if (type !== undefined && 
            this.gameState.grid[row+1][col]?.type === type && 
            this.gameState.grid[row+2][col]?.type === type) {
          if (!matches.some(m => m.row === row && m.col === col)) {
            matches.push({ row, col });
          }
        }
      }
    }
    
    return matches;
  }
  
  removeMatches(matches) {
    const toRemove = new Set();
    
    matches.forEach(m => {
      const type = this.gameState.grid[m.row][m.col]?.type;
      if (type === undefined) return;
      
      toRemove.add(m.row + ',' + m.col);
      
      if (m.col + 2 < this.gameState.cols && 
          this.gameState.grid[m.row][m.col+1]?.type === type && 
          this.gameState.grid[m.row][m.col+2]?.type === type) {
        toRemove.add(m.row + ',' + (m.col + 1));
        toRemove.add(m.row + ',' + (m.col + 2));
      }
      
      if (m.row + 2 < this.gameState.rows && 
          this.gameState.grid[m.row+1][m.col]?.type === type && 
          this.gameState.grid[m.row+2][m.col]?.type === type) {
        toRemove.add((m.row + 1) + ',' + m.col);
        toRemove.add((m.row + 2) + ',' + m.col);
      }
    });
    
    toRemove.forEach(key => {
      const [row, col] = key.split(',').map(Number);
      this.gameState.grid[row][col] = null;
    });
  }
  
  dropJewels() {
    for (let col = 0; col < this.gameState.cols; col++) {
      let emptyRow = this.gameState.rows - 1;
      
      for (let row = this.gameState.rows - 1; row >= 0; row--) {
        if (this.gameState.grid[row][col]) {
          if (row !== emptyRow) {
            this.gameState.grid[emptyRow][col] = this.gameState.grid[row][col];
            this.gameState.grid[row][col] = null;
          }
          emptyRow--;
        }
      }
      
      for (let row = emptyRow; row >= 0; row--) {
        this.gameState.grid[row][col] = {
          type: Math.floor(Math.random() * this.gameState.jewelTypes),
          color: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'][Math.floor(Math.random() * 6)],
          animY: -row * 50
        };
      }
    }
    
    this.gameState.swapping = false;
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  selectJewel(row, col) {
    if (this.gameState.animating || this.gameState.gameOver) return;
    
    if (!this.gameState.selected) {
      this.gameState.selected = { row, col };
    } else {
      const s = this.gameState.selected;
      const dr = Math.abs(row - s.row);
      const dc = Math.abs(col - s.col);
      
      if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        this.swapJewels(s.row, s.col, row, col);
      }
      
      this.gameState.selected = null;
    }
  }
  
  swapJewels(r1, c1, r2, c2) {
    const temp = this.gameState.grid[r1][c1];
    this.gameState.grid[r1][c1] = this.gameState.grid[r2][c2];
    this.gameState.grid[r2][c2] = temp;
    
    this.gameState.moves--;
    this.gameState.swapping = true;
    
    if (this.findMatches().length === 0) {
      setTimeout(() => {
        const temp2 = this.gameState.grid[r1][c1];
        this.gameState.grid[r1][c1] = this.gameState.grid[r2][c2];
        this.gameState.grid[r2][c2] = temp2;
        this.gameState.moves++;
        this.gameState.swapping = false;
      }, 300);
    }
  }
  
  render() {
    const grad = this.ctx.createLinearGradient(0, 0, 0, 600);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(1, '#16213e');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, 800, 600);
    
    const offsetX = 160;
    const offsetY = 80;
    const size = this.gameState.jewelSize;
    
    for (let row = 0; row < this.gameState.rows; row++) {
      for (let col = 0; col < this.gameState.cols; col++) {
        const jewel = this.gameState.grid[row][col];
        if (!jewel) continue;
        
        const x = offsetX + col * size;
        const y = offsetY + row * size + jewel.animY;
        
        if (this.gameState.selected?.row === row && this.gameState.selected?.col === col) {
          this.ctx.strokeStyle = '#fff';
          this.ctx.lineWidth = 3;
          this.ctx.strokeRect(x - 5, y - 5, size + 10, size + 10);
        }
        
        const gradient = this.ctx.createRadialGradient(x + size/3, y + size/3, 0, x + size/2, y + size/2, size/2);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.3, jewel.color);
        gradient.addColorStop(1, this.darkenColor(jewel.color, 40));
        
        this.ctx.fillStyle = gradient;
        
        if (jewel.type === 0) {
          this.ctx.beginPath();
          this.ctx.arc(x + size/2, y + size/2, size/2 - 3, 0, Math.PI*2);
          this.ctx.fill();
        } else if (jewel.type === 1) {
          this.ctx.fillRect(x + 5, y + 5, size - 10, size - 10);
        } else if (jewel.type === 2) {
          this.ctx.beginPath();
          this.ctx.moveTo(x + size/2, y + 5);
          this.ctx.lineTo(x + size - 5, y + size - 5);
          this.ctx.lineTo(x + 5, y + size - 5);
          this.ctx.closePath();
          this.ctx.fill();
        } else if (jewel.type === 3) {
          this.ctx.beginPath();
          this.ctx.moveTo(x + size/2, y + 5);
          this.ctx.lineTo(x + size - 5, y + size/2);
          this.ctx.lineTo(x + size/2, y + size - 5);
          this.ctx.lineTo(x + 5, y + size/2);
          this.ctx.closePath();
          this.ctx.fill();
        } else if (jewel.type === 4) {
          this.ctx.beginPath();
          this.ctx.rect(x + 10, y + 10, size - 20, size - 20);
          this.ctx.fill();
        } else {
          this.ctx.beginPath();
          this.ctx.arc(x + size/2, y + size/2, size/2 - 5, 0, Math.PI*2);
          this.ctx.fill();
          this.ctx.beginPath();
          this.ctx.arc(x + size/2, y + size/2, size/4, 0, Math.PI*2);
          this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
          this.ctx.fill();
        }
      }
    }
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Score: ' + this.gameState.score, 20, 40);
    this.ctx.fillText('Moves: ' + this.gameState.moves, 20, 70);
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('MATCH-3 JEWELS', 400, 30);
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
    if (input.select) {
      this.selectJewel(input.select.row, input.select.col);
    }
  }
}

window.Match3JewelGame = Match3JewelGame;