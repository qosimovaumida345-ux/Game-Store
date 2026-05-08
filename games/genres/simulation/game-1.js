// City Builder - Simulation Game
class CityBuilderGame {
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
      money: 1000,
      population: 0,
      happiness: 100,
      day: 1,
      status: 'playing',
      gridSize: 40,
      grid: [],
      buildings: [],
      resources: { wood: 100, stone: 100, food: 100 },
      selectedTool: null,
      width: 20,
      height: 15
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.gameState.width * this.gameState.gridSize;
    this.canvas.height = this.gameState.height * this.gameState.gridSize;
  }
  
  initGame() {
    for (let y = 0; y < this.gameState.height; y++) {
      this.gameState.grid[y] = [];
      for (let x = 0; x < this.gameState.width; x++) {
        this.gameState.grid[y][x] = {
          type: 'grass',
          building: null,
          x, y
        };
      }
    }
    
    // Starting buildings
    this.placeBuilding(10, 7, 'house');
    this.placeBuilding(10, 8, 'farm');
  }
  
  placeBuilding(gridX, gridY, type) {
    const buildingTypes = {
      house: { cost: 100, pop: 10, happy: 5, color: '#e74c3c', width: 1, height: 1 },
      farm: { cost: 150, food: 20, happy: -5, color: '#27ae60', width: 1, height: 1 },
      mine: { cost: 200, stone: 10, happy: -10, color: '#7f8c8d', width: 1, height: 1 },
      factory: { cost: 300, money: 50, happy: -20, color: '#34495e', width: 2, height: 1 },
      park: { cost: 100, happy: 15, color: '#2ecc71', width: 1, height: 1 },
      school: { cost: 250, happy: 10, color: '#f39c12', width: 1, height: 1 },
      hospital: { cost: 400, happy: 20, color: '#ecf0f1', width: 2, height: 2 },
      store: { cost: 200, money: 30, happy: 5, color: '#9b59b6', width: 1, height: 1 }
    };
    
    const building = buildingTypes[type];
    if (!building || this.gameState.money < building.cost) return false;
    
    const cell = this.gameState.grid[gridY][gridX];
    if (cell.building) return false;
    
    this.gameState.money -= building.cost;
    cell.building = { ...building, type, gridX, gridY };
    this.gameState.buildings.push(cell.building);
    
    return true;
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
    
    // Day cycle (every 10 seconds)
    if (Math.floor(this.gameState.time) % 10 === 0 && Math.floor(this.gameState.time) !== Math.floor(this.gameState.lastTime || 0)) {
      this.gameState.day++;
      
      // Resource generation
      this.gameState.buildings.forEach(b => {
        if (b.food) this.gameState.resources.food += b.food;
        if (b.stone) this.gameState.resources.stone += b.stone;
        if (b.money) this.gameState.money += b.money;
      });
      
      // Population growth
      const houses = this.gameState.buildings.filter(b => b.type === 'house').length;
      this.gameState.population = houses * 10 + Math.floor(this.gameState.day / 5);
      
      // Happiness calculation
      let happyChange = 0;
      this.gameState.buildings.forEach(b => {
        if (b.happy) happyChange += b.happy;
      });
      
      this.gameState.happiness = Math.max(0, Math.min(100, 100 + happyChange));
      
      // Resource consumption
      this.gameState.resources.food = Math.max(0, this.gameState.resources.food - this.gameState.population * 0.1);
      
      if (this.gameState.resources.food < 10) {
        this.gameState.happiness -= 10;
      }
      
      // Check win condition
      if (this.gameState.population >= 500 && this.gameState.happiness >= 80) {
        this.gameState.status = 'won';
      }
    }
    
    this.gameState.lastTime = this.gameState.time;
  }
  
  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#27ae60';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const { gridSize, grid } = this.gameState;
    
    // Draw grid
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];
        
        if (cell.building) {
          this.ctx.fillStyle = cell.building.color;
          this.ctx.fillRect(x * gridSize + 2, y * gridSize + 2, gridSize - 4, gridSize - 4);
          
          this.ctx.fillStyle = '#fff';
          this.ctx.font = '10px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(cell.building.type[0].toUpperCase(), x * gridSize + gridSize/2, y * gridSize + gridSize/2 + 4);
        } else {
          this.ctx.fillStyle = cell.type === 'grass' ? '#2ecc71' : '#3498db';
          this.ctx.fillRect(x * gridSize + 1, y * gridSize + 1, gridSize - 2, gridSize - 2);
        }
      }
    }
    
    // Grid lines
    this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x <= this.gameState.width; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * gridSize, 0);
      this.ctx.lineTo(x * gridSize, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y <= this.gameState.height; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * gridSize);
      this.ctx.lineTo(this.canvas.width, y * gridSize);
      this.ctx.stroke();
    }
    
    // UI - Stats panel
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, 10, 150, 120);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Day: ${this.gameState.day}`, 20, 30);
    this.ctx.fillText(`Money: $${Math.floor(this.gameState.money)}`, 20, 50);
    this.ctx.fillText(`Population: ${this.gameState.population}`, 20, 70);
    this.ctx.fillText(`Happiness: ${this.gameState.happiness}%`, 20, 90);
    
    // Resources
    this.ctx.fillStyle = '#8b4513';
    this.ctx.fillText(`Wood: ${this.gameState.resources.wood}`, 20, 110);
    this.ctx.fillStyle = '#7f8c8d';
    this.ctx.fillText(`Stone: ${this.gameState.resources.stone}`, 90, 110);
    
    // Toolbar
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(this.canvas.width - 120, 10, 110, 200);
    
    const tools = [
      { key: '1', name: 'House', cost: 100 },
      { key: '2', name: 'Farm', cost: 150 },
      { key: '3', name: 'Mine', cost: 200 },
      { key: '4', name: 'Factory', cost: 300 },
      { key: '5', name: 'Park', cost: 100 },
      { key: '6', name: 'School', cost: 250 }
    ];
    
    tools.forEach((t, i) => {
      this.ctx.fillStyle = this.gameState.selectedTool === t.name ? '#f1c40f' : '#34495e';
      this.ctx.fillRect(this.canvas.width - 110, 20 + i * 30, 90, 25);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '12px Arial';
      this.ctx.fillText(`${t.key}: ${t.name}`, this.canvas.width - 100, 38 + i * 30);
    });
    
    if (this.gameState.status === 'won') {
      this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#2ecc71';
      this.ctx.font = 'bold 50px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('CITY COMPLETE!', this.canvas.width / 2, this.canvas.height / 2);
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.CityBuilderGame = CityBuilderGame;