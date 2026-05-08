// Farm Simulation Game
class FarmSimulationGame {
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
      money: 500,
      day: 1,
      energy: 100,
      status: 'farming',
      selectedTool: null,
      plots: [],
      animals: [],
      inventory: [],
      weather: 'sunny',
      growthTimer: 0,
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        this.gameState.plots.push({
          x: 80 + col * 100,
          y: 120 + row * 90,
          width: 80,
          height: 70,
          crop: null,
          watered: false,
          growth: 0
        });
      }
    }
    
    this.gameState.animals = [
      { x: 600, y: 150, type: 'chicken', name: 'Clucky', health: 100, production: 0 },
      { x: 600, y: 230, type: 'cow', name: 'Moo', health: 100, production: 0 },
      { x: 600, y: 310, type: 'sheep', name: 'Wooly', health: 100, production: 0 }
    ];
    
    this.gameState.inventory = [
      { name: 'Seeds (Wheat)', count: 10, type: 'seed' },
      { name: 'Seeds (Corn)', count: 5, type: 'seed' },
      { name: 'Seeds (Tomato)', count: 3, type: 'seed' }
    ];
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
    this.gameState.growthTimer += deltaTime;
    
    if (this.gameState.growthTimer >= 5) {
      this.gameState.growthTimer = 0;
      this.growCrops();
    }
    
    this.gameState.animals.forEach(animal => {
      animal.production += deltaTime;
      
      if (animal.production >= 10) {
        if (animal.type === 'chicken') {
          this.gameState.inventory.push({ name: 'Egg', count: 1, type: 'product' });
        } else if (animal.type === 'cow') {
          this.gameState.inventory.push({ name: 'Milk', count: 1, type: 'product' });
        } else if (animal.type === 'sheep') {
          this.gameState.inventory.push({ name: 'Wool', count: 1, type: 'product' });
        }
        animal.production = 0;
      }
    });
  }
  
  growCrops() {
    this.gameState.plots.forEach(plot => {
      if (plot.crop && plot.growth < 100) {
        plot.growth += 10;
        
        if (plot.growth >= 100) {
          plot.crop.ready = true;
        }
      }
    });
  }
  
  selectTool(tool) {
    this.gameState.selectedTool = tool;
  }
  
  interactWithPlot(x, y) {
    if (this.gameState.energy <= 0) return;
    
    const plot = this.gameState.plots.find(p => 
      x >= p.x && x <= p.x + p.width &&
      y >= p.y && y <= p.y + p.height
    );
    
    if (!plot) return;
    
    const tool = this.gameState.selectedTool;
    
    if (tool === 'plant') {
      if (!plot.crop && this.gameState.inventory.find(i => i.type === 'seed' && i.count > 0)) {
        const seed = this.gameState.inventory.find(i => i.type === 'seed' && i.count > 0);
        seed.count--;
        
        plot.crop = {
          type: seed.name.includes('Wheat') ? 'wheat' : (seed.name.includes('Corn') ? 'corn' : 'tomato'),
          ready: false
        };
        plot.growth = 0;
        this.gameState.energy -= 10;
      }
    } else if (tool === 'water') {
      if (plot.crop) {
        plot.watered = true;
        this.gameState.energy -= 5;
      }
    } else if (tool === 'harvest') {
      if (plot.crop && plot.crop.ready) {
        let sellPrice = 0;
        
        if (plot.crop.type === 'wheat') sellPrice = 20;
        else if (plot.crop.type === 'corn') sellPrice = 30;
        else if (plot.crop.type === 'tomato') sellPrice = 40;
        
        this.gameState.money += sellPrice;
        plot.crop = null;
        plot.growth = 0;
        plot.watered = false;
        this.gameState.energy -= 5;
      }
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (input.a) this.selectTool('plant');
    if (input.b) this.selectTool('water');
    if (input.up) this.selectTool('harvest');
    if (input.action) {
      const mouseX = 400;
      const mouseY = 300;
      this.interactWithPlot(mouseX, mouseY);
    }
  }
  
  render() {
    this.drawBackground();
    this.drawFarm();
    this.drawPlots();
    this.drawAnimals();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(0.6, '#98d8c8');
    gradient.addColorStop(1, '#7dcea0');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawFarm() {
    this.ctx.fillStyle = '#8b4513';
    this.ctx.fillRect(30, 30, 150, 100);
    this.ctx.fillStyle = '#a0522d';
    this.ctx.beginPath();
    this.ctx.moveTo(30, 30);
    this.ctx.lineTo(105, -20);
    this.ctx.lineTo(180, 30);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(30, 500, 550, 100);
  }
  
  drawPlots() {
    this.gameState.plots.forEach(plot => {
      this.ctx.fillStyle = plot.watered ? '#5d4037' : '#8d6e63';
      this.ctx.fillRect(plot.x, plot.y, plot.width, plot.height);
      
      this.ctx.strokeStyle = '#5d4037';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(plot.x, plot.y, plot.width, plot.height);
      
      if (plot.crop) {
        const colors = { wheat: '#f1c40f', corn: '#e67e22', tomato: '#e74c3c' };
        const sizes = { wheat: 10, corn: 15, tomato: 12 };
        
        this.ctx.fillStyle = colors[plot.crop.type];
        
        if (plot.growth < 30) {
          this.ctx.beginPath();
          this.ctx.arc(plot.x + plot.width/2, plot.y + plot.height/2, 5, 0, Math.PI * 2);
          this.ctx.fill();
        } else if (plot.crop.type === 'corn') {
          this.ctx.fillRect(plot.x + 30, plot.y + 20, 20, 40);
        } else {
          for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.arc(plot.x + 25 + i * 20, plot.y + plot.height/2, sizes[plot.crop.type], 0, Math.PI * 2);
            this.ctx.fill();
          }
        }
        
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(plot.x + 5, plot.y + plot.height - 10, 70, 6);
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.fillRect(plot.x + 5, plot.y + plot.height - 10, 70 * (plot.growth / 100), 6);
      }
    });
  }
  
  drawAnimals() {
    const animalColors = { chicken: '#ecf0f1', cow: '#fff', sheep: '#bdc3c7' };
    const animalSizes = { chicken: 20, cow: 35, sheep: 25 };
    
    this.gameState.animals.forEach(animal => {
      this.ctx.fillStyle = animalColors[animal.type];
      this.ctx.beginPath();
      this.ctx.ellipse(animal.x, animal.y, animalSizes[animal.type], animalSizes[animal.type] * 0.7, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#333';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(animal.name, animal.x, animal.y + animalSizes[animal.type] + 15);
    });
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, 10, 140, 80);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Money: $${this.gameState.money}`, 20, 30);
    this.ctx.fillText(`Day: ${this.gameState.day}`, 20, 50);
    this.ctx.fillText(`Energy: ${Math.floor(this.gameState.energy)}%`, 20, 70);
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, 100, 120, 100);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';
    let invY = 120;
    this.gameState.inventory.slice(0, 5).forEach(item => {
      this.ctx.fillText(`${item.name}: ${item.count}`, 20, invY);
      invY += 15;
    });
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(this.canvas.width - 130, 10, 120, 90);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Tools:', this.canvas.width - 120, 30);
    
    const tools = ['plant', 'water', 'harvest'];
    const toolY = [50, 70, 90];
    
    tools.forEach((tool, i) => {
      const isSelected = this.gameState.selectedTool === tool;
      this.ctx.fillStyle = isSelected ? '#f1c40f' : '#fff';
      this.ctx.fillText(`${tool.toUpperCase()}: ${isSelected ? 'ON' : 'OFF'}`, this.canvas.width - 120, toolY[i]);
    });
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('FARM SIM', this.canvas.width / 2, 25);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('FARM COMPLETE', this.canvas.width / 2, this.canvas.height / 2);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Money: $${this.gameState.money}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.FarmSimulationGame = FarmSimulationGame;