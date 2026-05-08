// RollerCoaster Tycoon Style Game
class RollerCoasterTycoonGame {
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
      money: 5000,
      guests: 0,
      happiness: 50,
      rides: [],
      shops: [],
      selectedRide: null,
      gridSize: 20,
      cols: 30,
      rows: 20,
      pathTiles: [],
      selectedTool: null,
      status: 'building',
      gameOver: false,
      stats: { totalEarned: 0, visitors: 0 }
    };
    
    this.rideTypes = [
      { name: 'Ferris Wheel', cost: 500, income: 15, maintenance: 10, size: 4, color: '#e74c3c' },
      { name: 'Carousel', cost: 400, income: 12, maintenance: 8, size: 3, color: '#f1c40f' },
      { name: 'Bumper Cars', cost: 600, income: 20, maintenance: 15, size: 3, color: '#3498db' },
      { name: 'Haunted House', cost: 800, income: 25, maintenance: 20, size: 4, color: '#9b59b6' },
      { name: 'Roller Coaster', cost: 2000, income: 50, maintenance: 40, size: 6, color: '#2ecc71' }
    ];
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    for (let x = 0; x < this.gameState.cols; x++) {
      this.gameState.pathTiles[x] = [];
      for (let y = 0; y < this.gameState.rows; y++) {
        this.gameState.pathTiles[x][y] = { type: 'grass', hasPath: false };
      }
    }
    
    for (let x = 5; x < 25; x++) {
      this.gameState.pathTiles[x][10].hasPath = true;
    }
    for (let y = 5; y < 15; y++) {
      this.gameState.pathTiles[5][y].hasPath = true;
    }
    this.gameState.pathTiles[5][10].hasPath = true;
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
    
    this.gameState.rides.forEach(ride => {
      ride.earnings += ride.income * (ride.happiness / 100) * deltaTime;
    });
    
    if (this.gameState.time > 1) {
      this.gameState.time = 0;
      this.gameState.guests += Math.floor(this.gameState.rides.length * 2);
      this.gameState.stats.visitors += this.gameState.guests;
      
      let totalIncome = 0;
      this.gameState.rides.forEach(ride => {
        totalIncome += ride.earnings;
        this.gameState.money += ride.earnings;
        this.gameState.stats.totalEarned += ride.earnings;
        ride.earnings = 0;
        
        ride.happiness = Math.max(0, Math.min(100, ride.happiness + (Math.random() - 0.5) * 10));
        ride.maintenance = Math.max(0, ride.maintenance - 0.1);
        
        if (ride.maintenance <= 0) {
          ride.happiness = Math.max(0, ride.happiness - 20);
        }
      });
      
      this.gameState.happiness = this.gameState.rides.length > 0 
        ? this.gameState.rides.reduce((sum, r) => sum + r.happiness, 0) / this.gameState.rides.length 
        : 50;
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  buildRide(rideType) {
    if (this.gameState.money >= rideType.cost) {
      this.gameState.money -= rideType.cost;
      this.gameState.rides.push({
        ...rideType,
        x: 10,
        y: 5,
        happiness: 80,
        earnings: 0,
        built: true
      });
    }
  }
  
  selectTool(tool) {
    this.gameState.selectedTool = tool;
  }
  
  render() {
    this.ctx.fillStyle = '#27ae60';
    this.ctx.fillRect(0, 0, 800, 600);
    
    const cellSize = 25;
    const offsetX = 50;
    const offsetY = 50;
    
    for (let x = 0; x < this.gameState.cols; x++) {
      for (let y = 0; y < this.gameState.rows; y++) {
        if (this.gameState.pathTiles[x][y].hasPath) {
          this.ctx.fillStyle = '#95a5a6';
        } else {
          this.ctx.fillStyle = '#27ae60';
        }
        this.ctx.fillRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize - 2, cellSize - 2);
      }
    }
    
    this.gameState.rides.forEach((ride, index) => {
      const rx = offsetX + ride.x * cellSize;
      const ry = offsetY + ride.y * cellSize;
      const size = ride.size * cellSize;
      
      this.ctx.fillStyle = ride.color;
      this.ctx.fillRect(rx, ry, size, size);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '10px Arial';
      this.ctx.fillText(ride.name.substring(0, 8), rx + 5, ry + 15);
      
      this.ctx.fillStyle = '#2ecc71';
      this.ctx.fillRect(rx, ry + size - 8, size * (ride.happiness/100), 4);
    });
    
    this.ctx.fillStyle = '#34495e';
    this.ctx.fillRect(20, 50, 25, 500);
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(25, 55, 15, 490);
    
    this.rideTypes.forEach((ride, index) => {
      this.ctx.fillStyle = ride.color;
      this.ctx.fillRect(30, 60 + index * 95, 25, 25);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '12px Arial';
      this.ctx.fillText(ride.name, 60, 75 + index * 95);
      this.ctx.fillText('Cost: $' + ride.cost, 60, 90 + index * 95);
      this.ctx.fillText('Income: $' + ride.income + '/s', 60, 105 + index * 95);
    });
    
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillRect(30, 520, 25, 25);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px Arial';
    this.ctx.fillText('PATH', 60, 540);
    
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(720, 50, 60, 500);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('MONEY: $' + Math.floor(this.gameState.money), 730, 70);
    this.ctx.fillText('Guests: ' + this.gameState.guests, 730, 95);
    this.ctx.fillText('Happiness: ' + Math.floor(this.gameState.happiness) + '%', 730, 120);
    this.ctx.fillText('Rides: ' + this.gameState.rides.length, 730, 145);
    this.ctx.fillText('Total: $' + Math.floor(this.gameState.stats.totalEarned), 730, 170);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('TYCOON', 400, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    
    if (input.select === 1) this.selectTool('path');
    if (input.select === 2) this.buildRide(this.rideTypes[0]);
    if (input.select === 3) this.buildRide(this.rideTypes[1]);
    if (input.select === 4) this.buildRide(this.rideTypes[2]);
    if (input.select === 5) this.buildRide(this.rideTypes[3]);
    if (input.select === 6) this.buildRide(this.rideTypes[4]);
  }
}

window.RollerCoasterTycoonGame = RollerCoasterTycoonGame;