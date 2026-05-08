// Treasure Hunter - Adventure Game
class TreasureHunterGame {
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
      gems: 0,
      level: 1,
      status: 'playing',
      player: null,
      map: [],
      treasure: [],
      traps: [],
      enemies: [],
      width: 30,
      height: 20,
      tileSize: 25
    };
    
    this.generateLevel();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 750;
    this.canvas.height = this.canvas.parentElement.clientHeight || 500;
  }
  
  generateLevel() {
    const { width, height, tileSize } = this.gameState;
    this.canvas.width = width * tileSize;
    this.canvas.height = height * tileSize;
    
    // Generate maze
    this.gameState.map = Array(height).fill(null).map(() => Array(width).fill('wall'));
    
    // Simple maze generation
    const stack = [{x: 1, y: 1}];
    this.gameState.map[1][1] = 'floor';
    
    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = [];
      
      [[0,-2], [0,2], [-2,0], [2,0]].forEach(([dx, dy]) => {
        const nx = current.x + dx;
        const ny = current.y + dy;
        if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && this.gameState.map[ny][nx] === 'wall') {
          neighbors.push({x: nx, y: ny, mx: current.x + dx/2, my: current.y + dy/2});
        }
      });
      
      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        this.gameState.map[next.my][next.mx] = 'floor';
        this.gameState.map[next.y][next.x] = 'floor';
        stack.push({x: next.x, y: next.y});
      } else {
        stack.pop();
      }
    }
    
    // Add treasures
    this.gameState.treasure = [];
    for (let i = 0; i < 10; i++) {
      let x, y;
      do {
        x = Math.floor(Math.random() * (width - 2)) + 1;
        y = Math.floor(Math.random() * (height - 2)) + 1;
      } while (this.gameState.map[y][x] !== 'floor' || (x === 1 && y === 1));
      
      this.gameState.treasure.push({x, y, collected: false});
    }
    
    // Add traps
    this.gameState.traps = [];
    for (let i = 0; i < 5; i++) {
      let x, y;
      do {
        x = Math.floor(Math.random() * (width - 2)) + 1;
        y = Math.floor(Math.random() * (height - 2)) + 1;
      } while (this.gameState.map[y][x] !== 'floor' || (x === 1 && y === 1));
      
      this.gameState.traps.push({x, y, triggered: false});
    }
    
    // Add enemies
    this.gameState.enemies = [];
    for (let i = 0; i < 3; i++) {
      let x, y;
      do {
        x = Math.floor(Math.random() * (width - 2)) + 1;
        y = Math.floor(Math.random() * (height - 2)) + 1;
      } while (this.gameState.map[y][x] !== 'floor' || (x === 1 && y === 1));
      
      this.gameState.enemies.push({x, y, pathIndex: 0});
    }
    
    this.gameState.player = { x: 1, y: 1, health: 3 };
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
    this.gameState.time += deltaTime;
    
    const input = this.getPlayerInput();
    const { tileSize } = this.gameState;
    const p = this.gameState.player;
    
    let newX = p.x;
    let newY = p.y;
    
    if (input.left) newX--;
    if (input.right) newX++;
    if (input.up) newY--;
    if (input.down) newY++;
    
    if (this.gameState.map[newY] && this.gameState.map[newY][newX] === 'floor') {
      p.x = newX;
      p.y = newY;
    }
    
    // Collect treasure
    this.gameState.treasure.forEach(t => {
      if (!t.collected && t.x === p.x && t.y === p.y) {
        t.collected = true;
        this.gameState.gems++;
        this.gameState.score += 50;
      }
    });
    
    // Trigger traps
    this.gameState.traps.forEach(trap => {
      if (!trap.triggered && trap.x === p.x && trap.y === p.y) {
        trap.triggered = true;
        p.health--;
      }
    });
    
    // Move enemies (simple patrol)
    this.gameState.enemies.forEach(e => {
      const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
      const dir = dirs[Math.floor(this.gameState.time * 2 + e.pathIndex) % 4];
      
      const nx = e.x + dir[0];
      const ny = e.y + dir[1];
      
      if (this.gameState.map[ny] && this.gameState.map[ny][nx] === 'floor') {
        e.x = nx;
        e.y = ny;
      }
      
      if (e.x === p.x && e.y === p.y) {
        p.health--;
      }
    });
    
    // Check win/lose
    if (p.health <= 0) {
      this.gameState.status = 'gameover';
    }
    
    if (this.gameState.treasure.every(t => t.collected)) {
      this.gameState.level++;
      this.gameState.score += 100;
      this.generateLevel();
    }
  }
  
  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const { tileSize, map, treasure, traps, enemies, player } = this.gameState;
    
    // Draw map
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        if (map[y][x] === 'wall') {
          this.ctx.fillStyle = '#2c3e50';
          this.ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        } else {
          this.ctx.fillStyle = '#34495e';
          this.ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
      }
    }
    
    // Treasure
    treasure.forEach(t => {
      if (!t.collected) {
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.beginPath();
        this.ctx.moveTo(t.x * tileSize + tileSize/2, t.y * tileSize + 5);
        this.ctx.lineTo(t.x * tileSize + tileSize - 5, t.y * tileSize + tileSize/2);
        this.ctx.lineTo(t.x * tileSize + tileSize/2, t.y * tileSize + tileSize - 5);
        this.ctx.lineTo(t.x * tileSize + 5, t.y * tileSize + tileSize/2);
        this.ctx.fill();
      }
    });
    
    // Traps
    traps.forEach(t => {
      this.ctx.fillStyle = t.triggered ? '#e74c3c' : '#95a5a6';
      this.ctx.fillRect(t.x * tileSize + 5, t.y * tileSize + 5, tileSize - 10, tileSize - 10);
    });
    
    // Enemies
    enemies.forEach(e => {
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(e.x * tileSize + 3, e.y * tileSize + 3, tileSize - 6, tileSize - 6);
    });
    
    // Player
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(player.x * tileSize + 3, player.y * tileSize + 3, tileSize - 6, tileSize - 6);
    
    // UI
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(5, 5, 120, 50);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Gems: ${this.gameState.gems}`, 10, 22);
    this.ctx.fillText(`Level: ${this.gameState.level}`, 10, 40);
    this.ctx.fillText(`HP: ${player.health}`, 70, 40);
    
    if (this.gameState.status === 'gameover') {
      this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.font = 'bold 40px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.TreasureHunterGame = TreasureHunterGame;