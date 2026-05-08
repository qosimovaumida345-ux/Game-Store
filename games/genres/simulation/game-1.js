class CityBuilder {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 1000;
        this.canvas.height = 700;
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '20px auto';
        this.canvas.style.border = '3px solid #2c3e50';
        this.canvas.style.borderRadius = '10px';
        this.canvas.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
        document.querySelector('#game-container')?.appendChild(this.canvas) || document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.money = 100000;
        this.population = 0;
        this.happiness = 50;
        this.electricity = 100;
        this.water = 100;
        this.pollution = 0;
        this.unemployment = 0;
        this.trees = 50;
        this.gridSize = 50;
        this.cols = Math.floor(this.canvas.width / this.gridSize);
        this.rows = Math.floor(this.canvas.height / this.gridSize) - 3;
        this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));
        this.buildings = [];
        this.buildingTypes = {
            house: { name: 'House', cost: 500, population: 10, happiness: 5, electricity: 5, water: 3, pollution: 2, income: 0 },
            apartment: { name: 'Apartment', cost: 2000, population: 50, happiness: 3, electricity: 15, water: 10, pollution: 5, income: 0 },
            shop: { name: 'Shop', cost: 1000, population: 0, happiness: 8, electricity: 10, water: 5, pollution: 3, income: 50 },
            office: { name: 'Office', cost: 3000, population: 0, happiness: -2, electricity: 20, water: 8, pollution: 8, income: 100 },
            park: { name: 'Park', cost: 800, population: 0, happiness: 15, electricity: 2, water: 10, pollution: -5, income: 0 },
            hospital: { name: 'Hospital', cost: 5000, population: 0, happiness: 20, electricity: 30, water: 20, pollution: 10, income: 0 },
            school: { name: 'School', cost: 3000, population: 0, happiness: 12, electricity: 15, water: 8, pollution: 5, income: 0 },
            factory: { name: 'Factory', cost: 4000, population: 0, happiness: -10, electricity: 40, water: 25, pollution: 25, income: 200 },
            powerPlant: { name: 'Power Plant', cost: 8000, population: 0, happiness: -5, electricity: 0, water: 15, pollution: 30, income: 0 },
            waterTower: { name: 'Water Tower', cost: 2500, population: 0, happiness: 5, electricity: 10, water: 0, pollution: 2, income: 0 },
            road: { name: 'Road', cost: 50, population: 0, happiness: 2, electricity: 0, water: 0, pollution: 1, income: 0 },
            tree: { name: 'Tree', cost: 20, population: 0, happiness: 3, electricity: 0, water: 1, pollution: -3, income: 0 },
            stadium: { name: 'Stadium', cost: 10000, population: 0, happiness: 25, electricity: 50, water: 30, pollution: 15, income: 500 },
            church: { name: 'Church', cost: 2000, population: 0, happiness: 18, electricity: 5, water: 2, pollution: 1, income: 0 },
            gasStation: { name: 'Gas Station', cost: 1500, population: 0, happiness: -3, electricity: 15, water: 5, pollution: 15, income: 80 },
            police: { name: 'Police Station', cost: 2000, population: 0, happiness: 15, electricity: 10, water: 5, pollution: 3, income: 0 },
            fireStation: { name: 'Fire Station', cost: 2000, population: 0, happiness: 12, electricity: 10, water: 8, pollution: 3, income: 0 },
            library: { name: 'Library', cost: 2500, population: 0, happiness: 20, electricity: 8, water: 3, pollution: 2, income: 0 },
            cemetery: { name: 'Cemetery', cost: 500, population: 0, happiness: 5, electricity: 1, water: 2, pollution: -2, income: 0 },
            landfill: { name: 'Landfill', cost: 1000, population: 0, happiness: -15, electricity: 5, water: 5, pollution: 20, income: -20 }
        };
        this.selectedBuilding = null;
        this.hoveredCell = null;
        this.monthlyTimer = 0;
        this.lastTime = 0;
        this.income = 0;
        this.expense = 0;
        this.totalBuildings = 0;
        this.history = [];
        this.speed = 1;
        this.paused = false;
        this.statHistory = { population: [], happiness: [], money: [], pollution: [] };
        this.achievements = [];
        this.buildingColors = {
            house: '#e74c3c',
            apartment: '#c0392b',
            shop: '#9b59b6',
            office: '#8e44ad',
            park: '#27ae60',
            hospital: '#e91e63',
            school: '#3498db',
            factory: '#7f8c8d',
            powerPlant: '#f39c12',
            waterTower: '#16a085',
            road: '#95a5a6',
            tree: '#2ecc71',
            stadium: '#e67e22',
            church: '#d35400',
            gasStation: '#95a5a6',
            police: '#2980b9',
            fireStation: '#c0392b',
            library: '#34495e',
            cemetery: '#7f8c8d',
            landfill: '#1abc9c'
        };
        this.setupEventListeners();
        this.gameLoop = this.gameLoop.bind(this);
        this.calculateStats();
        this.gameLoop(0);
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.hoveredCell = {
                col: Math.floor(x / this.gridSize),
                row: Math.floor(y / this.gridSize)
            };
        });

        this.canvas.addEventListener('click', (e) => {
            if (!this.hoveredCell) return;
            if (this.hoveredCell.row >= this.rows) return;
            const { col, row } = this.hoveredCell;
            if (this.selectedBuilding && this.grid[row][col] === null) {
                this.placeBuilding(col, row);
            } else if (this.grid[row][col] !== null) {
                this.removeBuilding(col, row);
            }
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.selectedBuilding = null;
        });
    }

    placeBuilding(col, row) {
        const building = this.buildingTypes[this.selectedBuilding];
        if (this.money >= building.cost) {
            this.money -= building.cost;
            this.grid[row][col] = this.selectedBuilding;
            this.buildings.push({ type: this.selectedBuilding, col, row, age: 0 });
            this.totalBuildings++;
            this.calculateStats();
            this.checkAchievements();
        }
    }

    removeBuilding(col, row) {
        const buildingType = this.grid[row][col];
        if (buildingType) {
            const building = this.buildingTypes[buildingType];
            this.money += Math.floor(building.cost * 0.5);
            this.grid[row][col] = null;
            this.buildings = this.buildings.filter(b => !(b.col === col && b.row === row));
            this.totalBuildings--;
            this.calculateStats();
        }
    }

    calculateStats() {
        let pop = 0, happy = 50, elec = 0, water = 0, poll = 0, inc = 0, exp = 0;
        let unemp = 0;
        this.buildings.forEach(b => {
            const type = this.buildingTypes[b.type];
            pop += type.population;
            happy += type.happiness;
            elec += type.electricity;
            water += type.water;
            poll += type.pollution;
            inc += type.income;
        });
        this.population = pop;
        this.income = inc;
        this.expense = Math.floor(elec * 2 + water * 1.5 + this.population * 0.5);
        this.pollution = poll;
        this.happiness = Math.max(0, Math.min(100, 50 + happy));
        this.electricity = Math.max(0, 100 - elec);
        this.water = Math.max(0, 100 - water);
        this.unemployment = this.population > 0 ? Math.max(0, Math.floor((Math.random() * 10))) : 0;
    }

    monthlyUpdate(deltaTime) {
        this.monthlyTimer += deltaTime;
        if (this.monthlyTimer > 5000 / this.speed) {
            this.monthlyTimer = 0;
            this.money += this.income - this.expense;
            this.statHistory.population.push(this.population);
            this.statHistory.happiness.push(this.happiness);
            this.statHistory.money.push(this.money);
            this.statHistory.pollution.push(this.pollution);
            if (this.statHistory.population.length > 50) {
                this.statHistory.population.shift();
                this.statHistory.happiness.shift();
                this.statHistory.money.shift();
                this.statHistory.pollution.shift();
            }
            this.buildings.forEach(b => b.age++);
            this.checkEvents();
        }
    }

    checkEvents() {
        if (this.pollution > 100 && Math.random() < 0.2) {
            const idx = Math.floor(Math.random() * this.buildings.length);
            if (idx >= 0 && this.buildings[idx]) {
                const b = this.buildings[idx];
                this.grid[b.row][b.col] = null;
                this.buildings.splice(idx, 1);
                this.money -= 500;
                this.totalBuildings--;
                this.calculateStats();
            }
        }
        if (this.happiness < 20 && Math.random() < 0.15) {
            const idx = Math.floor(Math.random() * this.buildings.filter(b => this.buildingTypes[b.type].population > 0).length);
            const house = this.buildings.filter(b => this.buildingTypes[b.type].population > 0)[idx];
            if (house) {
                this.grid[house.row][house.col] = null;
                this.buildings = this.buildings.filter(b => b !== house);
                this.totalBuildings--;
                this.calculateStats();
            }
        }
    }

    checkAchievements() {
        if (this.population >= 100 && !this.achievements.includes('small_town')) {
            this.achievements.push('small_town');
        }
        if (this.population >= 1000 && !this.achievements.includes('city')) {
            this.achievements.push('city');
        }
        if (this.happiness >= 90 && !this.achievements.includes('utopia')) {
            this.achievements.push('utopia');
        }
        if (this.totalBuildings >= 50 && !this.achievements.includes('metropolis')) {
            this.achievements.push('metropolis');
        }
        if (this.pollution === 0 && !this.achievements.includes('eco_friendly')) {
            this.achievements.push('eco_friendly');
        }
        if (this.money >= 500000 && !this.achievements.includes('wealthy')) {
            this.achievements.push('wealthy');
        }
    }

    drawGrid() {
        this.ctx.fillStyle = '#c8e6c9';
        this.ctx.fillRect(0, 0, this.canvas.width, this.rows * this.gridSize);
        this.ctx.strokeStyle = '#a5d6a7';
        this.ctx.lineWidth = 1;
        for (let r = 0; r <= this.rows; r++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, r * this.gridSize);
            this.ctx.lineTo(this.canvas.width, r * this.gridSize);
            this.ctx.stroke();
        }
        for (let c = 0; c <= this.cols; c++) {
            this.ctx.beginPath();
            this.ctx.moveTo(c * this.gridSize, 0);
            this.ctx.lineTo(c * this.gridSize, this.rows * this.gridSize);
            this.ctx.stroke();
        }
    }

    drawBuildings() {
        this.buildings.forEach(b => {
            const x = b.col * this.gridSize;
            const y = b.row * this.gridSize;
            const color = this.buildingColors[b.type];
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
            this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(this.getBuildingIcon(b.type), x + this.gridSize / 2, y + this.gridSize / 2);
        });
    }

    getBuildingIcon(type) {
        const icons = {
            house: '🏠', apartment: '🏢', shop: '🏪', office: '🏛️', park: '🌳',
            hospital: '🏥', school: '🏫', factory: '🏭', powerPlant: '⚡', waterTower: '💧',
            road: '🛤️', tree: '🌲', stadium: '🏟️', church: '⛪', gasStation: '⛽',
            police: '🚔', fireStation: '🚒', library: '📚', cemetery: '⚰️', landfill: '🗑️'
        };
        return icons[type] || '🏠';
    }

    drawHover() {
        if (this.hoveredCell && this.hoveredCell.row < this.rows) {
            const x = this.hoveredCell.col * this.gridSize;
            const y = this.hoveredCell.row * this.gridSize;
            this.ctx.fillStyle = this.selectedBuilding ? 'rgba(76, 175, 80, 0.4)' : 'rgba(244, 67, 54, 0.4)';
            this.ctx.fillRect(x, y, this.gridSize, this.gridSize);
            this.ctx.strokeStyle = this.selectedBuilding ? '#4caf50' : '#f44336';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, this.gridSize, this.gridSize);
        }
    }

    drawUI() {
        const uiY = this.rows * this.gridSize;
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, uiY, this.canvas.width, this.canvas.height - uiY);
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Money: $${this.money.toLocaleString()} | Population: ${this.population} | Happiness: ${this.happiness}%`, 20, uiY + 30);
        this.ctx.fillText(`Electricity: ${100 - this.electricity}/${100} | Water: ${100 - this.water}/${100} | Pollution: ${this.pollution}`, 20, uiY + 50);
        this.ctx.fillText(`Income: $${this.income}/mo | Expenses: $${this.expense}/mo | Buildings: ${this.totalBuildings}`, 20, uiY + 70);
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Right-click to deselect', this.canvas.width / 2, uiY + 25);
        if (this.selectedBuilding) {
            const b = this.buildingTypes[this.selectedBuilding];
            this.ctx.fillStyle = '#2ecc71';
            this.ctx.fillText(`Selected: ${b.name} (Cost: $${b.cost})`, this.canvas.width / 2, uiY + 45);
        }
    }

    drawToolbar() {
        const toolbarY = uiY - 80;
        this.ctx.fillStyle = '#34495e';
        this.ctx.fillRect(0, toolbarY - 5, this.canvas.width, 85);
        let x = 10;
        Object.entries(this.buildingTypes).forEach(([key, b]) => {
            const isSelected = this.selectedBuilding === key;
            this.ctx.fillStyle = isSelected ? '#2ecc71' : this.buildingColors[key];
            this.ctx.fillRect(x, toolbarY, 70, 70);
            this.ctx.strokeStyle = isSelected ? '#f1c40f' : 'rgba(0,0,0,0.3)';
            this.ctx.lineWidth = isSelected ? 3 : 1;
            this.ctx.strokeRect(x, toolbarY, 70, 70);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.getBuildingIcon(key), x + 35, toolbarY + 30);
            this.ctx.font = '10px Arial';
            this.ctx.fillText(b.name, x + 35, toolbarY + 55);
            this.ctx.fillText(`$${b.cost}`, x + 35, toolbarY + 68);
            x += 75;
            if (x > this.canvas.width - 80) return;
        });
    }

    drawGraphs() {
        const graphY = 10;
        const graphX = this.canvas.width - 210;
        this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
        this.ctx.fillRect(graphX, graphY, 200, 150);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(graphX, graphY, 200, 150);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'left';
        const maxPop = Math.max(...this.statHistory.population, 1);
        if (this.statHistory.population.length > 1) {
            this.ctx.strokeStyle = '#3498db';
            this.ctx.beginPath();
            this.statHistory.population.forEach((v, i) => {
                const px = graphX + 10 + (i / 50) * 180;
                const py = graphY + 130 - (v / maxPop) * 100;
                i === 0 ? this.ctx.moveTo(px, py) : this.ctx.lineTo(px, py);
            });
            this.ctx.stroke();
        }
    }

    drawAchievements() {
        if (this.achievements.length > 0) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(this.canvas.width - 160, this.canvas.height - 40, 150, 30);
            this.ctx.fillStyle = '#f1c40f';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`🏆 ${this.achievements.length}`, this.canvas.width - 10, this.canvas.height - 20);
        }
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        if (!this.paused) {
            this.monthlyUpdate(deltaTime);
        }
        const uiY = this.rows * this.gridSize;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        this.drawBuildings();
        this.drawHover();
        this.drawToolbar();
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, uiY, this.canvas.width, this.canvas.height - uiY);
        this.drawUI();
        this.drawGraphs();
        this.drawAchievements();
        if (this.money < -10000) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('BANKRUPT!', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Your city has gone bankrupt!', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }
        requestAnimationFrame(this.gameLoop);
    }

    destroy() {
        this.canvas.remove();
    }
}

window.CityBuilder = CityBuilder;
