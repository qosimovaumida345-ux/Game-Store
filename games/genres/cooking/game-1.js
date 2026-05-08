// Cooking Master Game
class CookingMasterGame {
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
      currentOrder: null,
      orders: [],
      completedOrders: 0,
      status: 'taking_order',
      stations: {
        cutting: { ingredient: null, progress: 0, done: false },
        cooking: { ingredient: null, progress: 0, done: false },
        plating: { dish: null, progress: 0, done: false }
      },
      ingredients: [
        { name: 'Tomato', icon: '🍅', cooked: false, cut: false },
        { name: 'Lettuce', icon: '🥬', cooked: false, cut: false },
        { name: 'Meat', icon: '🥩', cooked: false, cut: true },
        { name: 'Cheese', icon: '🧀', cooked: false, cut: true },
        { name: 'Bread', icon: '🍞', cooked: false, cut: true }
      ],
      currentStation: 0,
      timer: 0,
      orderTimer: 30,
      gameOver: false
    };
    
    this.config = {
      stationCount: 3,
      cookingTime: 5,
      cuttingTime: 3,
      platingTime: 3,
      maxOrders: 10
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.generateOrder();
  }
  
  generateOrder() {
    const recipes = [
      { name: 'Burger', ingredients: ['Bread', 'Meat', 'Cheese', 'Tomato', 'Lettuce'] },
      { name: 'Salad', ingredients: ['Lettuce', 'Tomato', 'Cheese'] },
      { name: 'Sandwich', ingredients: ['Bread', 'Meat', 'Cheese', 'Lettuce'] },
      { name: 'Special Burger', ingredients: ['Bread', 'Meat', 'Tomato', 'Cheese', 'Lettuce', 'Meat'] }
    ];
    
    this.gameState.currentOrder = recipes[Math.floor(Math.random() * recipes.length)];
    this.gameState.status = 'cooking';
    this.gameState.orderTimer = 30;
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
    this.gameState.orderTimer -= deltaTime;
    
    if (this.gameState.orderTimer <= 0) {
      this.gameState.score -= 50;
      this.gameState.orderTimer = 30;
    }
    
    this.updateStations(deltaTime);
  }
  
  updateStations(deltaTime) {
    const stations = ['cutting', 'cooking', 'plating'];
    const current = stations[this.gameState.currentStation];
    const station = this.gameState.stations[current];
    
    if (station.ingredient || station.dish) {
      station.progress += deltaTime;
      
      let requiredTime;
      if (current === 'cutting') requiredTime = this.config.cuttingTime;
      else if (current === 'cooking') requiredTime = this.config.cookingTime;
      else requiredTime = this.config.platingTime;
      
      if (station.progress >= requiredTime) {
        station.done = true;
        station.progress = requiredTime;
      }
    }
  }
  
  selectStation(index) {
    this.gameState.currentStation = index;
  }
  
  addIngredient(ingredientName) {
    const station = this.gameState.currentStation;
    
    if (station === 0) {
      this.gameState.stations.cutting.ingredient = ingredientName;
      this.gameState.stations.cutting.progress = 0;
      this.gameState.stations.cutting.done = false;
    } else if (station === 1) {
      this.gameState.stations.cooking.ingredient = ingredientName;
      this.gameState.stations.cooking.progress = 0;
      this.gameState.stations.cooking.done = false;
    }
  }
  
  plateDish() {
    const cutting = this.gameState.stations.cutting;
    const cooking = this.gameState.stations.cooking;
    
    if (!cutting.done || !cooking.done) return;
    
    const dish = {
      ingredients: [cutting.ingredient, cooking.ingredient],
      complete: true
    };
    
    this.gameState.stations.plating.dish = dish;
    this.gameState.stations.plating.progress = 0;
    this.gameState.stations.plating.done = false;
  }
  
  serveDish() {
    const plating = this.gameState.stations.plating;
    
    if (!plating.done) return;
    
    const order = this.gameState.currentOrder;
    const hasAllIngredients = order.ingredients.every(ing => 
      plating.dish.ingredients.includes(ing)
    );
    
    if (hasAllIngredients) {
      const timeBonus = Math.floor(this.gameState.orderTimer * 2);
      const orderBonus = 100 + timeBonus;
      this.gameState.score += orderBonus;
      this.gameState.completedOrders++;
    } else {
      this.gameState.score -= 30;
    }
    
    this.resetStations();
    
    if (this.gameState.completedOrders >= this.config.maxOrders) {
      this.gameState.gameOver = true;
    } else {
      this.generateOrder();
    }
  }
  
  resetStations() {
    this.gameState.stations.cutting = { ingredient: null, progress: 0, done: false };
    this.gameState.stations.cooking = { ingredient: null, progress: 0, done: false };
    this.gameState.stations.plating = { dish: null, progress: 0, done: false };
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (this.gameState.currentStation === 0) {
      if (input.a) this.addIngredient('Tomato');
      if (input.b) this.addIngredient('Lettuce');
      if (input.up) this.addIngredient('Meat');
      if (input.down) this.addIngredient('Cheese');
    } else if (this.gameState.currentStation === 1) {
      if (input.a || input.b) {
        this.gameState.stations.cooking.ingredient = this.gameState.stations.cutting.ingredient;
        this.gameState.stations.cooking.progress = 0;
        this.gameState.stations.cooking.done = false;
      }
    } else if (this.gameState.currentStation === 2) {
      if (input.action) this.plateDish();
    }
    
    if (input.left) {
      this.gameState.currentStation = Math.max(0, this.gameState.currentStation - 1);
    }
    if (input.right) {
      this.gameState.currentStation = Math.min(2, this.gameState.currentStation + 1);
    }
    if (input.up || input.down) {
      this.serveDish();
    }
  }
  
  render() {
    this.drawKitchen();
    this.drawStations();
    this.drawOrder();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawKitchen() {
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#34495e';
    this.ctx.fillRect(0, 200, this.canvas.width, 300);
    
    for (let x = 0; x < this.canvas.width; x += 100) {
      this.ctx.strokeStyle = '#7f8c8d';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 200);
      this.ctx.lineTo(x, 500);
      this.ctx.stroke();
    }
  }
  
  drawStations() {
    const stations = ['cutting', 'cooking', 'plating'];
    const labels = ['CUTTING', 'COOKING', 'PLATING'];
    const colors = ['#e74c3c', '#f39c12', '#2ecc71'];
    
    stations.forEach((station, i) => {
      const x = 100 + i * 250;
      const y = 250;
      const isSelected = this.gameState.currentStation === i;
      
      this.ctx.fillStyle = isSelected ? '#fff' : colors[i];
      this.ctx.fillRect(x, y, 200, 200);
      
      if (isSelected) {
        this.ctx.strokeStyle = '#ffd93d';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(x, y, 200, 200);
      }
      
      this.ctx.fillStyle = '#000';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(labels[i], x + 100, y + 25);
      
      const st = this.gameState.stations[station];
      if (st.ingredient || st.dish) {
        this.ctx.fillStyle = '#333';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(st.ingredient || st.dish.name || '', x + 100, y + 80);
        
        this.ctx.fillStyle = '#666';
        this.ctx.fillRect(x + 20, y + 120, 160, 20);
        this.ctx.fillStyle = colors[i];
        
        let progress = 0;
        if (station === 'cutting') progress = st.progress / this.config.cuttingTime;
        else if (station === 'cooking') progress = st.progress / this.config.cookingTime;
        else progress = st.progress / this.config.platingTime;
        
        this.ctx.fillRect(x + 20, y + 120, 160 * Math.min(progress, 1), 20);
        
        if (st.done) {
          this.ctx.fillStyle = '#0f0';
          this.ctx.font = 'bold 20px Arial';
          this.ctx.fillText('DONE!', x + 100, y + 160);
        }
      }
    });
  }
  
  drawOrder() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(50, 50, 300, 120);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Current Order:', 70, 80);
    
    const order = this.gameState.currentOrder;
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(order.name, 70, 105);
    
    this.ctx.fillStyle = '#aaa';
    this.ctx.font = '12px Arial';
    order.ingredients.forEach((ing, i) => {
      this.ctx.fillText(ing, 70 + (i % 3) * 90, 125 + Math.floor(i / 3) * 15);
    });
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(this.canvas.width - 150, 10, 140, 60);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width - 140, 30);
    this.ctx.fillText(`Orders: ${this.gameState.completedOrders}/${this.config.maxOrders}`, this.canvas.width - 140, 55);
    
    this.ctx.fillStyle = '#ff4444';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Time: ${Math.ceil(this.gameState.orderTimer)}s`, 200, 80);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText('COOKING MASTER', this.canvas.width / 2, 30);
    
    this.ctx.fillStyle = '#4ecdc4';
    this.ctx.font = '12px Arial';
    this.ctx.fillText('← → Select Station | A/B Add Ingredient | UP/DOWN Serve', this.canvas.width / 2, 550);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('KITCHEN CLOSED!', this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
    this.ctx.fillText(`Orders: ${this.gameState.completedOrders}`, this.canvas.width / 2, this.canvas.height / 2 + 70);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.CookingMasterGame = CookingMasterGame;