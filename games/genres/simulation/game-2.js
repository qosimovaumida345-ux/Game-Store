class FarmTycoon {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 1000;
        this.canvas.height = 750;
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '20px auto';
        this.canvas.style.border = '3px solid #27ae60';
        this.canvas.style.borderRadius = '10px';
        this.canvas.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
        document.querySelector('#game-container')?.appendChild(this.canvas) || document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.money = 10000;
        this.day = 1;
        this.season = 'Spring';
        this.year = 1;
        this.experience = 0;
        this.level = 1;
        this.reputation = 50;
        this.energy = 100;
        this.maxEnergy = 100;
        this.hunger = 100;
        this.health = 100;
        this.animals = [];
        this.crops = [];
        this.inventory = {
            wheat: 0, corn: 0, tomato: 0, potato: 0, carrot: 0,
            milk: 0, eggs: 0, wool: 0, meat: 0, cheese: 0
        };
        this.equipment = {
            tractor: false, irrigation: false, silo: false, barn: false,
            greenhouse: false, windmill: false, fencing: true
        };
        this.equipmentCosts = {
            tractor: 5000, irrigation: 2000, silo: 3000, barn: 8000,
            greenhouse: 10000, windmill: 4000
        };
        this.gridSize = 60;
        this.farmCols = 10;
        this.farmRows = 7;
        this.plotWidth = 80;
        this.plotHeight = 60;
        this.plots = [];
        this.selectedTool = null;
        this.hoveredPlot = null;
        this.marketPrices = this.generateMarketPrices();
        this.dailyIncome = 0;
        this.totalEarned = 0;
        this.animalsMax = 5;
        this.barnCapacity = 20;
        this.lastTime = 0;
        this.dayTimer = 0;
        this.speed = 1;
        this.paused = false;
        this.events = [];
        this.achievements = [];
        this.weather = 'sunny';
        this.temperature = 20;
        this.rainfall = 0;
        this.initPlots();
        this.setupEventListeners();
        this.gameLoop = this.gameLoop.bind(this);
        this.gameLoop(0);
    }

    initPlots() {
        for (let r = 0; r < this.farmRows; r++) {
            for (let c = 0; c < this.farmCols; c++) {
                this.plots.push({
                    row: r, col: c,
                    crop: null,
                    fertilized: false,
                    watered: false,
                    healthy: true,
                    growthStage: 0
                });
            }
        }
    }

    generateMarketPrices() {
        return {
            wheat: 20 + Math.floor(Math.random() * 10),
            corn: 30 + Math.floor(Math.random() * 15),
            tomato: 40 + Math.floor(Math.random() * 20),
            potato: 15 + Math.floor(Math.random() * 8),
            carrot: 25 + Math.floor(Math.random() * 12),
            milk: 50 + Math.floor(Math.random() * 20),
            eggs: 30 + Math.floor(Math.random() * 15),
            wool: 80 + Math.floor(Math.random() * 30),
            meat: 100 + Math.floor(Math.random() * 40),
            cheese: 150 + Math.floor(Math.random() * 50)
        };
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const offsetY = 90;
            if (y > offsetY && y < offsetY + this.farmRows * this.plotHeight) {
                this.hoveredPlot = {
                    col: Math.floor((x - 50) / this.plotWidth),
                    row: Math.floor((y - offsetY) / this.plotHeight)
                };
            } else {
                this.hoveredPlot = null;
            }
        });

        this.canvas.addEventListener('click', (e) => {
            if (this.hoveredPlot) {
                this.handlePlotClick(this.hoveredPlot.row, this.hoveredPlot.col);
            }
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.selectedTool = null;
        });
    }

    handlePlotClick(row, col) {
        const plotIndex = row * this.farmCols + col;
        const plot = this.plots[plotIndex];
        if (!plot) return;
        if (this.selectedTool === 'plant' && !plot.crop) {
            this.plantCrop(plotIndex);
        } else if (this.selectedTool === 'water') {
            plot.watered = true;
            this.energy -= 5;
        } else if (this.selectedTool === 'harvest') {
            this.harvestCrop(plotIndex);
        } else if (this.selectedTool === 'fertilize') {
            if (this.money >= 50) {
                plot.fertilized = true;
                this.money -= 50;
            }
        }
    }

    plantCrop(plotIndex) {
        const cropTypes = {
            wheat: { cost: 20, harvestDays: 10, baseYield: 20, exp: 10 },
            corn: { cost: 35, harvestDays: 15, baseYield: 15, exp: 15 },
            tomato: { cost: 50, harvestDays: 20, baseYield: 12, exp: 20 },
            potato: { cost: 25, harvestDays: 12, baseYield: 25, exp: 12 },
            carrot: { cost: 30, harvestDays: 14, baseYield: 18, exp: 14 }
        };
        if (this.selectedCrop && cropTypes[this.selectedCrop]) {
            const crop = cropTypes[this.selectedCrop];
            if (this.money >= crop.cost) {
                this.money -= crop.cost;
                this.plots[plotIndex].crop = this.selectedCrop;
                this.plots[plotIndex].growthStage = 0;
                this.plots[plotIndex].daysPlanted = 0;
                this.plots[plotIndex].daysToGrow = crop.harvestDays;
                this.plots[plotIndex].expectedYield = crop.baseYield;
                this.plots[plotIndex].expValue = crop.exp;
                this.energy -= 10;
            }
        }
    }

    harvestCrop(plotIndex) {
        const plot = this.plots[plotIndex];
        if (plot.crop && plot.growthStage >= 100) {
            const yield_ = Math.floor(plot.expectedYield * (plot.fertilized ? 1.5 : 1) * (this.weather === 'sunny' ? 1.2 : 0.8));
            this.inventory[plot.crop] += yield_;
            this.experience += plot.expValue;
            this.checkLevelUp();
            plot.crop = null;
            plot.fertilized = false;
            plot.watered = false;
            plot.growthStage = 0;
        }
    }

    buyAnimal(type) {
        const animalCosts = { cow: 500, chicken: 100, sheep: 300, pig: 400 };
        if (this.money >= animalCosts[type] && this.animals.length < this.animalsMax) {
            this.money -= animalCosts[type];
            this.animals.push({
                type,
                health: 100,
                happiness: 80,
                age: 0,
                daysToProduce: this.getAnimalProductionDays(type),
                daysProduced: 0
            });
        }
    }

    getAnimalProductionDays(type) {
        const days = { cow: 7, chicken: 2, sheep: 14, pig: 10 };
        return days[type] || 7;
    }

    feedAnimals() {
        const feedCosts = { cow: 20, chicken: 5, sheep: 10, pig: 15 };
        this.animals.forEach(animal => {
            if (this.money >= feedCosts[animal.type]) {
                this.money -= feedCosts[animal.type];
                animal.happiness = Math.min(100, animal.happiness + 20);
                animal.health = Math.min(100, animal.health + 10);
                this.energy -= 5;
            }
        });
    }

    collectAnimalProducts() {
        this.animals.forEach(animal => {
            animal.daysProduced++;
            if (animal.daysProduced >= animal.daysToProduce && animal.health > 50) {
                if (animal.type === 'cow') this.inventory.milk += 5;
                else if (animal.type === 'chicken') this.inventory.eggs += 10;
                else if (animal.type === 'sheep') this.inventory.wool += 3;
                else if (animal.type === 'pig') this.inventory.meat += 2;
                animal.daysProduced = 0;
                animal.happiness = Math.max(0, animal.happiness - 10);
            }
        });
    }

    sellProducts() {
        let total = 0;
        Object.entries(this.inventory).forEach(([item, qty]) => {
            const price = this.marketPrices[item] * (this.reputation / 50);
            total += qty * price;
            this.inventory[item] = 0;
        });
        this.money += total;
        this.totalEarned += total;
        this.dailyIncome = total;
        this.marketPrices = this.generateMarketPrices();
        return total;
    }

    buyEquipment(type) {
        if (this.equipment[type] === false && this.money >= this.equipmentCosts[type]) {
            this.money -= this.equipmentCosts[type];
            this.equipment[type] = true;
        }
    }

    updateCrops(deltaTime) {
        const growthRate = (deltaTime / 1000) * 0.1 * this.speed;
        this.plots.forEach(plot => {
            if (plot.crop) {
                plot.daysPlanted++;
                const waterBonus = plot.watered ? 1.5 : 1;
                const fertBonus = plot.fertilized ? 1.2 : 1;
                const weatherBonus = this.weather === 'rainy' ? 1.3 : this.weather === 'sunny' ? 1 : 0.7;
                plot.growthStage = Math.min(100, (plot.daysPlanted / plot.daysToGrow) * 100 * waterBonus * fertBonus * weatherBonus);
                if (this.equipment.irrigation) {
                    plot.watered = true;
                }
                if (this.equipment.greenhouse) {
                    plot.growthStage *= 1.2;
                }
                if (this.temperature < 0 && !this.equipment.greenhouse) {
                    plot.healthy = Math.random() > 0.1;
                }
                if (Math.random() < 0.01) {
                    plot.watered = false;
                }
            }
        });
    }

    updateWeather() {
        const weathers = ['sunny', 'cloudy', 'rainy', 'stormy'];
        const weights = [0.4, 0.3, 0.2, 0.1];
        const rand = Math.random();
        let cumulative = 0;
        for (let i = 0; i < weathers.length; i++) {
            cumulative += weights[i];
            if (rand < cumulative) {
                this.weather = weathers[i];
                break;
            }
        }
        if (this.season === 'Winter') {
            this.temperature = -10 + Math.floor(Math.random() * 10);
        } else if (this.season === 'Spring') {
            this.temperature = 10 + Math.floor(Math.random() * 15);
        } else if (this.season === 'Summer') {
            this.temperature = 25 + Math.floor(Math.random() * 15);
        } else {
            this.temperature = 5 + Math.floor(Math.random() * 15);
        }
    }

    dailyUpdate() {
        this.day++;
        this.energy = Math.min(this.maxEnergy, this.energy + 30);
        this.hunger = Math.min(100, this.hunger + 10);
        if (this.hunger < 20) this.health -= 5;
        this.updateWeather();
        this.collectAnimalProducts();
        this.updateCrops(86400000 / this.speed);
        if (this.day % 30 === 0) {
            this.updateSeason();
        }
        if (this.day % 7 === 0) {
            this.sellProducts();
        }
        if (this.energy < 20) {
            this.health -= 2;
        }
        this.checkEvents();
    }

    updateSeason() {
        const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
        const idx = seasons.indexOf(this.season);
        this.season = seasons[(idx + 1) % 4];
        if (this.season === 'Spring') {
            this.year++;
        }
        this.generateMarketPrices();
    }

    checkLevelUp() {
        const expNeeded = this.level * 100;
        if (this.experience >= expNeeded) {
            this.level++;
            this.maxEnergy += 10;
            this.energy = this.maxEnergy;
            this.reputation = Math.min(100, this.reputation + 5);
        }
    }

    checkEvents() {
        if (this.weather === 'stormy' && Math.random() < 0.3) {
            const idx = Math.floor(Math.random() * this.plots.length);
            if (this.plots[idx].crop) {
                this.plots[idx].crop = null;
                this.events.push({ type: 'storm', text: 'A storm destroyed a crop!' });
            }
        }
        if (this.health < 30) {
            this.events.push({ type: 'warning', text: 'Your health is low! Rest or eat.' });
        }
        if (this.money < 100) {
            this.events.push({ type: 'danger', text: 'You are running out of money!' });
        }
        if (this.events.length > 5) this.events.shift();
    }

    checkAchievements() {
        if (this.totalEarned >= 10000 && !this.achievements.includes('first_1k')) {
            this.achievements.push('first_1k');
        }
        if (this.totalEarned >= 100000 && !this.achievements.includes('rich_farmer')) {
            this.achievements.push('rich_farmer');
        }
        if (this.level >= 10 && !this.achievements.includes('expert_farmer')) {
            this.achievements.push('expert_farmer');
        }
        if (this.animals.length >= this.animalsMax && !this.achievements.includes('animal lover')) {
            this.achievements.push('animal_lover');
        }
        if (this.plots.filter(p => p.crop).length >= 50 && !this.achievements.includes('green_thumb')) {
            this.achievements.push('green_thumb');
        }
        if (this.year >= 5 && !this.achievements.includes('veteran')) {
            this.achievements.push('veteran');
        }
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98D8C8');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, 100);
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, 90, this.canvas.width, this.canvas.height - 90);
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, 90, this.canvas.width, 5);
    }

    drawPlots() {
        const startX = 50;
        const startY = 100;
        this.plots.forEach((plot, i) => {
            const x = startX + (i % this.farmCols) * this.plotWidth;
            const y = startY + Math.floor(i / this.farmCols) * this.plotHeight;
            this.ctx.fillStyle = plot.watered ? '#5D4037' : '#795548';
            this.ctx.fillRect(x, y, this.plotWidth - 2, this.plotHeight - 2);
            this.ctx.strokeStyle = '#3E2723';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, this.plotWidth - 2, this.plotHeight - 2);
            if (plot.crop) {
                this.drawCrop(x + this.plotWidth / 2, y + this.plotHeight / 2, plot);
            }
            if (plot.fertilized) {
                this.ctx.fillStyle = '#FF5722';
                this.ctx.fillRect(x + 2, y + 2, 8, 8);
            }
        });
        if (this.hoveredPlot) {
            const idx = this.hoveredPlot.row * this.farmCols + this.hoveredPlot.col;
            const x = startX + (idx % this.farmCols) * this.plotWidth;
            const y = startY + Math.floor(idx / this.farmCols) * this.plotHeight;
            this.ctx.strokeStyle = '#f1c40f';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x, y, this.plotWidth - 2, this.plotHeight - 2);
        }
    }

    drawCrop(x, y, plot) {
        const emoji = { wheat: '🌾', corn: '🌽', tomato: '🍅', potato: '🥔', carrot: '🥕' };
        const color = { wheat: '#f1c40f', corn: '#f39c12', tomato: '#e74c3c', potato: '#8d6e63', carrot: '#ff9800' };
        const stage = Math.floor(plot.growthStage / 33);
        this.ctx.font = `${16 + stage * 4}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(emoji[plot.crop] || '🌱', x, y);
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.fillRect(x - 25, y + 15, 50 * (plot.growthStage / 100), 5);
        this.ctx.strokeStyle = '#27ae60';
        this.ctx.strokeRect(x - 25, y + 15, 50, 5);
    }

    drawToolbar() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 90, 50, this.canvas.height - 90);
        const tools = [
            { id: 'plant', icon: '🌱' }, { id: 'water', icon: '💧' },
            { id: 'harvest', icon: '🧺' }, { id: 'fertilize', icon: '🧪' }
        ];
        tools.forEach((tool, i) => {
            const y = 100 + i * 60;
            this.ctx.fillStyle = this.selectedTool === tool.id ? '#16a085' : '#16213e';
            this.ctx.fillRect(2, y, 46, 50);
            this.ctx.strokeStyle = this.selectedTool === tool.id ? '#f1c40f' : '#0f3460';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(2, y, 46, 50);
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(tool.icon, 25, y + 28);
        });
    }

    drawTopBar() {
        this.ctx.fillStyle = '#27ae60';
        this.ctx.fillRect(0, 0, this.canvas.width, 40);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Day ${this.day} | Year ${this.year} | ${this.season}`, 20, 25);
        this.ctx.fillText(`$${this.money.toLocaleString()}`, 200, 25);
        this.ctx.fillText(`Energy: ${Math.floor(this.energy)}/${this.maxEnergy}`, 350, 25);
        this.ctx.fillText(`Level ${this.level} (${this.experience}/${this.level * 100} XP)`, 500, 25);
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Weather: ${this.weather} | Temp: ${this.temperature}°C | Rep: ${this.reputation}`, this.canvas.width - 20, 25);
    }

    drawBottomPanel() {
        const panelY = this.canvas.height - 160;
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, panelY, this.canvas.width, 160);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Inventory:', 20, panelY + 25);
        let invY = panelY + 45;
        let col = 0;
        Object.entries(this.inventory).forEach(([item, qty]) => {
            if (qty > 0) {
                this.ctx.fillText(`${item}: ${qty} ($${Math.floor(this.marketPrices[item.replace(/s$/, '')] || this.marketPrices[item] || 0)})`, 20 + col * 150, invY);
                col++;
                if (col > 5) {
                    col = 0;
                    invY += 20;
                }
            }
        });
        this.ctx.fillText('Animals:', 20, panelY + 100);
        this.ctx.font = '14px Arial';
        const animalCounts = {};
        this.animals.forEach(a => {
            animalCounts[a.type] = (animalCounts[a.type] || 0) + 1;
        });
        let animalY = panelY + 120;
        col = 0;
        Object.entries(animalCounts).forEach(([type, count]) => {
            this.ctx.fillText(`${type}: ${count}`, 20 + col * 120, animalY);
            col++;
        });
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Daily Income: $${Math.floor(this.dailyIncome)}`, this.canvas.width - 20, panelY + 25);
        this.ctx.fillText(`Equipment: ${Object.values(this.equipment).filter(v => v).length}/${Object.keys(this.equipment).length}`, this.canvas.width - 20, panelY + 45);
    }

    drawEvents() {
        if (this.events.length > 0) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(this.canvas.width - 220, 50, 210, 100);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'left';
            this.events.slice(-3).forEach((ev, i) => {
                this.ctx.fillStyle = ev.type === 'danger' ? '#e74c3c' : ev.type === 'warning' ? '#f39c12' : '#3498db';
                this.ctx.fillText(ev.text, this.canvas.width - 210, 70 + i * 25);
            });
        }
    }

    drawMarketPrices() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
        this.ctx.fillRect(this.canvas.width - 220, this.canvas.height - 290, 210, 130);
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Market Prices:', this.canvas.width - 210, this.canvas.height - 275);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '11px Arial';
        let row = 0, col = 0;
        Object.entries(this.marketPrices).forEach(([item, price]) => {
            this.ctx.fillText(`${item}: $${Math.floor(price)}`, this.canvas.width - 210 + col * 100, this.canvas.height - 255 + row * 18);
            col++;
            if (col > 1) {
                col = 0;
                row++;
            }
        });
    }

    drawAchievements() {
        if (this.achievements.length > 0) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(10, 50, 150, 30);
            this.ctx.fillStyle = '#f1c40f';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`🏆 ${this.achievements.length} Achievements`, 20, 70);
        }
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        if (!this.paused) {
            this.dayTimer += deltaTime;
            if (this.dayTimer > 3000 / this.speed) {
                this.dayTimer = 0;
                this.dailyUpdate();
                this.checkAchievements();
            }
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBackground();
        this.drawTopBar();
        this.drawPlots();
        this.drawToolbar();
        this.drawBottomPanel();
        this.drawMarketPrices();
        this.drawEvents();
        this.drawAchievements();
        if (this.health <= 0 || this.money < -5000) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Your farm has failed!', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }
        requestAnimationFrame(this.gameLoop);
    }

    destroy() {
        this.canvas.remove();
    }
}

window.FarmTycoon = FarmTycoon;
