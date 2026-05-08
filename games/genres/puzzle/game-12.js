// Pipe Connector Game
class PipeConnectorGame {
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
      start: null,
      end: null,
      selected: null,
      status: 'connecting',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    const pipeTypes = ['straight', 'curve', 'tshape', 'cross'];
    for (let y = 0; y < 8; y++) {
      this.gameState.grid[y] = [];
      for (let x = 0; x < 10; x++) {
        this.gameState.grid[y][x] = {
          type: pipeTypes[Math.floor(Math.random() * pipeTypes.length)],
          rotation: Math.floor(Math.random() * 4) * 90,
          connected: false
        };
      }
    }
    this.gameState.start = { x: 0, y: 3 };
    this.gameState.end = { x: 9, y: 4 };
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
    
    this.checkConnections();
    
    const input = this.getPlayerInput(this.players[0]);
    if (input.action) {
      const gx = Math.floor((this.gameState.selected?.x || 400) / 80);
      const gy = Math.floor((this.gameState.selected?.y || 300) / 75);
      if (gx >= 0 && gx < 10 && gy >= 0 && gy < 8) {
        this.gameState.grid[gy][gx].rotation = (this.gameState.grid[gy][gx].rotation + 90) % 360;
        this.gameState.score += 5;
      }
    }
    
    if (this.checkWin()) {
      this.gameState.score += 500;
      this.gameState.gameOver = true;
    }
  }
  
  checkConnections() {
    this.gameState.grid.forEach(row => row.forEach(cell => cell.connected = false));
    
    const visited = new Set();
    const stack = [this.gameState.start];
    
    while (stack.length > 0) {
      const current = stack.pop();
      const key = current.x + ',' + current.y;
      
      if (visited.has(key)) continue;
      visited.add(key);
      
      this.gameState.grid[current.y][current.x].connected = true;
      
      const neighbors = this.getConnectedNeighbors(current);
      neighbors.forEach(n => {
        if (!visited.has(n.x + ',' + n.y)) {
          stack.push(n);
        }
      });
    }
  }
  
  getConnectedNeighbors(pos) {
    const neighbors = [];
    const cell = this.gameState.grid[pos.y][pos.x];
    const rot = cell.rotation / 90;
    
    if (this.hasConnection(cell, 'top') && pos.y > 0) {
      const above = this.gameState.grid[pos.y - 1][pos.x];
      if (this.hasConnection(above, 'bottom')) {
        neighbors.push({ x: pos.x, y: pos.y - 1 });
      }
    }
    if (this.hasConnection(cell, 'bottom') && pos.y < 7) {
      const below = this.gameState.grid[pos.y + 1][pos.x];
      if (this.hasConnection(below, 'top')) {
        neighbors.push({ x: pos.x, y: pos.y + 1 });
      }
    }
    if (this.hasConnection(cell, 'left') && pos.x > 0) {
      const left = this.gameState.grid[pos.y][pos.x - 1];
      if (this.hasConnection(left, 'right')) {
        neighbors.push({ x: pos.x - 1, y: pos.y });
      }
    }
    if (this.hasConnection(cell, 'right') && pos.x < 9) {
      const right = this.gameState.grid[pos.y][pos.x + 1];
      if (this.hasConnection(right, 'left')) {
        neighbors.push({ x: pos.x + 1, y: pos.y });
      }
    }
    
    return neighbors;
  }
  
  hasConnection(cell, direction) {
    const connections = {
      straight: { top: [0, 2], bottom: [0, 2], left: [1, 3], right: [1, 3] },
      curve: { top: [1, 2], bottom: [0, 3], left: [0, 1], right: [2, 3] },
      tshape: { top: [0, 1, 3], bottom: [0, 1, 2], left: [0, 2, 3], right: [1, 2, 3] },
      cross: { top: [0, 1, 2, 3], bottom: [0, 1, 2, 3], left: [0, 1, 2, 3], right: [0, 1, 2, 3] }
    };
    
    const rot = Math.floor(cell.rotation / 90);
    const dirs = { top: 0, bottom: 2, left: 1, right: 3 };
    const d = (dirs[direction] + rot) % 4;
    
    return connections[cell.type][direction].includes(rot);
  }
  
  checkWin() {
    return this.gameState.grid[this.gameState.end.y][this.gameState.end.x].connected;
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    const grad = this.ctx.createLinearGradient(0, 0, 0, 600);
    grad.addColorStop(0, '#34495e');
    grad.addColorStop(1, '#2c3e50');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, 800, 600);
    
    const cellWidth = 70;
    const cellHeight = 65;
    const offsetX = 55;
    const offsetY = 40;
    
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 10; x++) {
        const cell = this.gameState.grid[y][x];
        const cx = offsetX + x * cellWidth;
        const cy = offsetY + y * cellHeight;
        
        this.ctx.fillStyle = cell.connected ? '#27ae60' : '#7f8c8d';
        this.ctx.fillRect(cx, cy, cellWidth - 5, cellHeight - 5);
        
        this.ctx.save();
        this.ctx.translate(cx + cellWidth/2 - 2, cy + cellHeight/2 - 2);
        this.ctx.rotate(cell.rotation * Math.PI / 180);
        
        this.ctx.strokeStyle = '#3498db';
        this.ctx.lineWidth = 8;
        this.ctx.lineCap = 'round';
        
        if (cell.type === 'straight') {
          this.ctx.beginPath();
          this.ctx.moveTo(0, -20);
          this.ctx.lineTo(0, 20);
          this.ctx.stroke();
        } else if (cell.type === 'curve') {
          this.ctx.beginPath();
          this.ctx.moveTo(0, -20);
          this.ctx.quadraticCurveTo(20, -20, 20, 0);
          this.ctx.stroke();
        } else if (cell.type === 'tshape') {
          this.ctx.beginPath();
          this.ctx.moveTo(0, -20);
          this.ctx.lineTo(0, 20);
          this.ctx.moveTo(0, 0);
          this.ctx.lineTo(20, 0);
          this.ctx.stroke();
        } else if (cell.type === 'cross') {
          this.ctx.beginPath();
          this.ctx.moveTo(0, -20);
          this.ctx.lineTo(0, 20);
          this.ctx.moveTo(-20, 0);
          this.ctx.lineTo(20, 0);
          this.ctx.stroke();
        }
        
        this.ctx.restore();
      }
    }
    
    const sx = offsetX + this.gameState.start.x * cellWidth + cellWidth/2 - 2;
    const sy = offsetY + this.gameState.start.y * cellHeight + cellHeight/2 - 2;
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.beginPath();
    this.ctx.arc(sx, sy, 15, 0, Math.PI*2);
    this.ctx.fill();
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('S', sx, sy + 5);
    
    const ex = offsetX + this.gameState.end.x * cellWidth + cellWidth/2 - 2;
    const ey = offsetY + this.gameState.end.y * cellHeight + cellHeight/2 - 2;
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.beginPath();
    this.ctx.arc(ex, ey, 15, 0, Math.PI*2);
    this.ctx.fill();
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText('E', ex, ey + 5);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Score: ' + this.gameState.score + ' | Connect S to E', 20, 30);
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillText('PIPE CONNECTOR', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.PipeConnectorGame = PipeConnectorGame;