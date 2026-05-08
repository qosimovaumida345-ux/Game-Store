class RestaurantSim {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 1000;
        this.canvas.height = 750;
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '20px auto';
        this.canvas.style.border = '3px solid #e67e22';
        this.canvas.style.borderRadius = '10px';
        this.canvas.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
        document.querySelector('#game-container')?.appendChild(this.canvas) || document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.money = 10000;
        this.day = 1;
        this.hour = 8;
        this.reputation = 50;
        this.satisfaction = 70;
        this.totalServed = 0;
        this.totalRating = 0;
        this.ratingCount = 0;
        this.tables = [];
        this.menu = [];
        this.kitchen = { level: 1, speed: 1, quality: 50 };
        this.ingredients = { meat: 50, veg: 50, fish: 30, dairy: 40, grain: 60 };
        this.ingredientPrices = { meat: 20, veg: 5, fish: 25, dairy: 10, grain: 3 };
        this.cooks = [];
        this.servers = [];
        this.waitingCustomers = [];
        this.seatedCustomers = [];
        this.servedOrders = [];
        this.lastTime = 0;
        this.dayTimer = 0;
        this.speed = 1;
        this.paused = false;
        this.selectedTab = 'main';
        this.events = [];
        this.achievements = [];
        this.stats = { orders: 0, tips: 0, complaints: 0, perfect: 0 };
        this.atmosphere = 50;
        this.decorations = [];
        this.initRestaurant();
        this.setupEventListeners();
        this.gameLoop = this.gameLoop.bind(this);
        this.gameLoop(0);
    }

    initRestaurant() {
        for (let i = 0; i < 10; i++) {
            this.tables.push({
                id: i + 1,
                capacity: 4,
                occupied: false,
                seats: 0,
                customer: null,
                order: null,
                bill: 0,
                waitingTime: 0
            });
        }
        this.menu = [
            { name: 'Burger', price: 15, cookTime: 5, ingredients: { meat: 1, veg: 1, grain: 1 }, popularity: 80 },
            { name: 'Pizza', price: 18, cookTime: 7, ingredients: { veg: 2, dairy: 1, grain: 1 }, popularity: 85 },
            { name: 'Salad', price: 12, cookTime: 3, ingredients: { veg: 3 }, popularity: 60 },
            { name: 'Steak', price: 30, cookTime: 10, ingredients: { meat: 2, veg: 1 }, popularity: 75 },
            { name: 'Fish & Chips', price: 22, cookTime: 8, ingredients: { fish: 2, grain: 1 }, popularity: 70 },
            { name: 'Pasta', price: 16, cookTime: 6, ingredients: { grain: 2, dairy: 1, veg: 1 }, popularity: 78 },
            { name: 'Soup', price: 8, cookTime: 2, ingredients: { veg: 2, dairy: 1 }, popularity: 50 },
            { name: 'Dessert', price: 10, cookTime: 3, ingredients: { dairy: 2, grain: 1 }, popularity: 65 },
            { name: 'Soda', price: 4, cookTime: 1, ingredients: {}, popularity: 90 },
            { name: 'Coffee', price: 5, cookTime: 1, ingredients: { dairy: 1 }, popularity: 85 }
        ];
        for (let i = 0; i < 2; i++) {
            this.cooks.push({
                name: `Cook ${i + 1}`,
                skill: 50 + Math.floor(Math.random() * 50),
                energy: 100,
                salary: 150,
                cooking: null,
                speed: 1
            });
        }
        for (let i = 0; i < 2; i++) {
            this.servers.push({
                name: `Server ${i + 1}`,
                skill: 40 + Math.floor(Math.random() * 40),
                energy: 100,
                salary: 100,
                serving: null
            });
        }
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleClick(x, y);
        });
    }

    handleClick(x, y) {
        if (y < 80) {
            const tabs = ['Main', 'Menu', 'Kitchen', 'Staff', 'Stats'];
            const tabWidth = this.canvas.width / tabs.length;
            const tabIndex = Math.floor(x / tabWidth);
            if (tabIndex >= 0 && tabIndex < tabs.length) {
                this.selectedTab = tabs[tabIndex].toLowerCase();
            }
        }
        if (this.selectedTab === 'main' && y > 150 && y < 500) {
            const tableIndex = Math.floor((x - 100) / 80);
            if (tableIndex >= 0 && tableIndex < this.tables.length) {
                this.manageTable(tableIndex);
            }
        }
    }

    manageTable(index) {
        const table = this.tables[index];
        if (!table.occupied && this.waitingCustomers.length > 0) {
            const customer = this.waitingCustomers.shift();
            table.occupied = true;
            table.seats = customer.groupSize;
            table.customer = customer;
            table.waitingTime = 0;
            this.seatedCustomers.push(table);
        }
    }

    spawnCustomer() {
        const groupSize = 1 + Math.floor(Math.random() * 4);
        if (this.waitingCustomers.length < 10) {
            this.waitingCustomers.push({
                id: Date.now() + Math.random(),
                patience: 100,
                groupSize,
                mood: 'happy',
                maxWait: 60 + Math.floor(Math.random() * 40),
                order: null
            });
        }
    }

    takeOrder(table) {
        if (!table.order) {
            const menuItems = this.menu.filter(m => Math.random() * 100 < m.popularity);
            if (menuItems.length > 0) {
                const item = menuItems[Math.floor(Math.random() * menuItems.length)];
                table.order = { item, progress: 0, cook: null };
                const availableCook = this.cooks.find(c => !c.cooking);
                if (availableCook) {
                    table.order.cook = availableCook;
                    availableCook.cooking = table.order;
                }
                this.servedOrders.push(table.order);
            }
        }
    }

    cookOrder(order, deltaTime) {
        if (order && order.cook) {
            const cookSpeed = order.cook.skill / 100 * this.kitchen.speed;
            order.progress += (deltaTime / 1000) * cookSpeed * this.speed;
            if (order.progress >= order.item.cookTime) {
                order.ready = true;
                order.cook.cooking = null;
                order.cook = null;
            }
        }
    }

    serveOrder(table) {
        if (table.order && table.order.ready) {
            table.order.served = true;
            const tip = Math.floor(table.order.item.price * (table.customer.patience / 100) * (table.customer.mood === 'happy' ? 0.2 : 0.1));
            table.bill += table.order.item.price;
            this.money += table.order.item.price;
            this.stats.tips += tip;
            this.money += tip;
            this.totalServed++;
            this.stats.orders++;
            table.order = null;
        }
    }

    checkOut(table) {
        if (table.order === null && table.bill > 0) {
            table.customer = null;
            table.occupied = false;
            table.seats = 0;
            table.bill = 0;
            table.waitingTime = 0;
            this.seatedCustomers = this.seatedCustomers.filter(t => t !== table);
        }
    }

    updateCustomers(deltaTime) {
        this.waitingCustomers.forEach((customer, i) => {
            customer.patience -= deltaTime * 0.01;
            if (customer.patience <= 0) {
                this.waitingCustomers.splice(i, 1);
                this.stats.complaints++;
                this.satisfaction = Math.max(0, this.satisfaction - 5);
                this.events.push({ type: 'warning', text: `Customer left! Patience ran out.` });
            }
        });
        this.seatedCustomers.forEach(table => {
            table.waitingTime += deltaTime;
            table.customer.patience -= deltaTime * 0.005;
            if (table.waitingTime > table.customer.maxWait) {
                table.customer.mood = 'angry';
                table.customer.patience -= deltaTime * 0.02;
            }
            if (table.customer.patience <= 0) {
                table.occupied = false;
                table.customer = null;
                table.order = null;
                table.bill = 0;
                this.seatedCustomers = this.seatedCustomers.filter(t => t !== table);
                this.stats.complaints++;
                this.satisfaction = Math.max(0, this.satisfaction - 10);
            }
            if (table.order) {
                this.cookOrder(table.order, deltaTime);
            }
        });
        if (this.events.length > 5) this.events.shift();
    }

    useIngredients() {
        Object.keys(this.ingredients).forEach(ing => {
            if (this.ingredients[ing] <= 5 && this.money >= this.ingredientPrices[ing] * 10) {
                this.ingredients[ing] += 20;
                this.money -= this.ingredientPrices[ing] * 10;
            }
        });
    }

    dailyUpdate() {
        this.day++;
        this.hour = 8;
        const payroll = this.cooks.reduce((sum, c) => sum + c.salary, 0) + this.servers.reduce((sum, s) => sum + s.salary, 0);
        this.money -= payroll + 100;
        this.useIngredients();
        this.cooks.forEach(c => c.energy = Math.min(100, c.energy + 40));
        this.servers.forEach(s => s.energy = Math.min(100, s.energy + 40));
        this.reputation = Math.floor((this.satisfaction + this.totalServed / 20) / 2);
        if (this.ratingCount > 0) {
            this.reputation = Math.floor(this.totalRating / this.ratingCount);
        }
        this.checkAchievements();
    }

    checkAchievements() {
        if (this.totalServed >= 50 && !this.achievements.includes('busy_restaurant')) {
            this.achievements.push('busy_restaurant');
        }
        if (this.totalServed >= 500 && !this.achievements.includes('popular_spot')) {
            this.achievements.push('popular_spot');
        }
        if (this.satisfaction >= 90 && !this.achievements.includes('customer_favorite')) {
            this.achievements.push('customer_favorite');
        }
        if (this.reputation >= 80 && !this.achievements.includes('top_rated')) {
            this.achievements.push('top_rated');
        }
        if (this.kitchen.level >= 5 && !this.achievements.includes('master_chef')) {
            this.achievements.push('master_chef');
        }
        if (this.stats.perfect >= 10 && !this.achievements.includes('perfectionist')) {
            this.achievements.push('perfectionist');
        }
    }

    drawTopBar() {
        this.ctx.fillStyle = '#d35400';
        this.ctx.fillRect(0, 0, this.canvas.width, 80);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Day ${this.day} | ${this.hour}:00`, 20, 25);
        this.ctx.fillText(`$${this.money.toLocaleString()}`, 180, 25);
        this.ctx.fillText(`Reputation: ${this.reputation}`, 350, 25);
        this.ctx.fillText(`Satisfaction: ${this.satisfaction}%`, 500, 25);
        this.ctx.fillText(`Served: ${this.totalServed}`, 680, 25);
        this.ctx.fillText(`Tips: $${this.stats.tips}`, 800, 25);
        const tabs = ['Main', 'Menu', 'Kitchen', 'Staff', 'Stats'];
        tabs.forEach((tab, i) => {
            const x = i * (this.canvas.width / tabs.length);
            this.ctx.fillStyle = this.selectedTab === tab.toLowerCase() ? '#a04000' : '#e67e22';
            this.ctx.fillRect(x, 50, this.canvas.width / tabs.length, 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(tab, x + this.canvas.width / tabs.length / 2, 70);
        });
    }

    drawRestaurantFloor() {
        this.ctx.fillStyle = '#34495e';
        this.ctx.fillRect(50, 100, 600, 400);
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Restaurant Floor', 350, 130);
        const tableSize = 60;
        let tableIndex = 0;
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 5; col++) {
                if (tableIndex < this.tables.length) {
                    const table = this.tables[tableIndex];
                    const x = 80 + col * 110;
                    const y = 160 + row * 180;
                    this.ctx.fillStyle = table.occupied ? '#e74c3c' : '#27ae60';
                    this.ctx.fillRect(x, y, tableSize, tableSize);
                    this.ctx.strokeStyle = table.occupied ? '#c0392b' : '#1e8449';
                    this.ctx.lineWidth = 3;
                    this.ctx.strokeRect(x, y, tableSize, tableSize);
                    this.ctx.fillStyle = '#fff';
                    this.ctx.font = '10px Arial';
                    this.ctx.fillText(`T${table.id}`, x + tableSize / 2, y + 20);
                    if (table.occupied) {
                        this.ctx.fillText(`${table.customer.groupSize}👥`, x + tableSize / 2, y + 40);
                        if (table.order) {
                            this.ctx.fillText(table.order.ready ? '✓' : '⏳', x + tableSize / 2, y + 55);
                        }
                    } else {
                        this.ctx.fillText('Empty', x + tableSize / 2, y + 40);
                    }
                    tableIndex++;
                }
            }
        }
        this.ctx.fillStyle = '#7f8c8d';
        this.ctx.fillRect(80, 380, 520, 100);
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText('Kitchen', 340, 405);
        this.kitchen.orders = this.servedOrders.filter(o => !o.ready);
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`Orders: ${this.kitchen.orders.length} | Speed: ${this.kitchen.speed}x | Quality: ${this.kitchen.quality}%`, 340, 430);
        this.cooks.forEach((cook, i) => {
            this.ctx.fillText(`${cook.name}: ${cook.cooking ? cook.cooking.item.name : 'Idle'}`, 100 + i * 250, 460);
        });
    }

    drawWaitingArea() {
        const x = 700;
        this.ctx.fillStyle = '#f39c12';
        this.ctx.fillRect(x, 100, 280, 250);
        this.ctx.strokeStyle = '#d35400';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x, 100, 280, 250);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Waiting Area', x + 140, 125);
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`Waiting: ${this.waitingCustomers.length}`, x + 140, 150);
        this.waitingCustomers.forEach((customer, i) => {
            const cy = 170 + i * 22;
            this.ctx.fillStyle = customer.patience > 50 ? '#2ecc71' : customer.patience > 25 ? '#f39c12' : '#e74c3c';
            this.ctx.fillRect(x + 10, cy, 200 * (customer.patience / 100), 18);
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.font = '10px Arial';
            this.ctx.fillText(`Group ${customer.groupSize} | Patience: ${Math.floor(customer.patience)}%`, x + 110, cy + 13);
        });
    }

    drawIngredientsPanel() {
        const x = 700;
        this.ctx.fillStyle = '#27ae60';
        this.ctx.fillRect(x, 360, 280, 140);
        this.ctx.strokeStyle = '#1e8449';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, 360, 280, 140);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Ingredients', x + 140, 380);
        this.ctx.font = '11px Arial';
        let ingY = 400;
        Object.entries(this.ingredients).forEach(([ing, qty]) => {
            this.ctx.fillStyle = qty > 20 ? '#2ecc71' : '#e74c3c';
            this.ctx.fillText(`${ing}: ${qty}`, x + 70, ingY);
            this.ctx.fillText(`$${this.ingredientPrices[ing]}/unit`, x + 180, ingY);
            ingY += 20;
        });
    }

    drawMainTab() {
        this.drawRestaurantFloor();
        this.drawWaitingArea();
        this.drawIngredientsPanel();
    }

    drawMenuTab() {
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 80, this.canvas.width, this.canvas.height - 80);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Menu Management', this.canvas.width / 2, 110);
        this.menu.forEach((item, i) => {
            const x = 50 + (i % 4) * 230;
            const y = 140 + Math.floor(i / 4) * 120;
            this.ctx.fillStyle = '#16a085';
            this.ctx.fillRect(x, y, 210, 100);
            this.ctx.strokeStyle = '#f1c40f';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, 210, 100);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillText(item.name, x + 105, y + 25);
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`Price: $${item.price}`, x + 105, y + 50);
            this.ctx.fillText(`Cook Time: ${item.cookTime}s`, x + 105, y + 70);
            this.ctx.fillText(`Popularity: ${item.popularity}%`, x + 105, y + 90);
        });
    }

    drawKitchenTab() {
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 80, this.canvas.width, this.canvas.height - 80);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Kitchen Upgrades', this.canvas.width / 2, 110);
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Kitchen Level: ${this.kitchen.level} | Speed: ${this.kitchen.speed}x | Quality: ${this.kitchen.quality}%`, 500, 140);
        const upgrades = [
            { name: 'Better Equipment', cost: 2000, effect: '+0.2 speed', action: () => { this.kitchen.speed += 0.2; } },
            { name: 'Quality Ingredients', cost: 1500, effect: '+5 quality', action: () => { this.kitchen.quality = Math.min(100, this.kitchen.quality + 5); } },
            { name: 'Extra Burner', cost: 3000, effect: '+1 cook slot', action: () => { this.cooks.push({ name: `Cook ${this.cooks.length + 1}`, skill: 50, energy: 100, salary: 150, cooking: null }); } },
            { name: 'Kitchen Expansion', cost: 5000, effect: 'Level up', action: () => { this.kitchen.level++; this.kitchen.speed += 0.3; } }
        ];
        upgrades.forEach((up, i) => {
            const y = 170 + i * 80;
            this.ctx.fillStyle = '#7f8c8d';
            this.ctx.fillRect(150, y, 700, 65);
            this.ctx.strokeStyle = '#f1c40f';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(150, y, 700, 65);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(up.name, 170, y + 25);
            this.ctx.font = '12px Arial';
            this.ctx.fillText(up.effect, 170, y + 50);
            this.ctx.fillStyle = '#27ae60';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`Upgrade $${up.cost}`, 830, y + 40);
        });
    }

    drawStaffTab() {
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 80, this.canvas.width, this.canvas.height - 80);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Staff Management', this.canvas.width / 2, 110);
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Cooks: ${this.cooks.length} | Servers: ${this.servers.length}`, 500, 140);
        let y = 170;
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Cooks:', 50, y);
        y += 30;
        this.cooks.forEach(cook => {
            this.ctx.fillStyle = '#3498db';
            this.ctx.fillRect(50, y, 400, 60);
            this.ctx.strokeStyle = '#f1c40f';
            this.ctx.strokeRect(50, y, 400, 60);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText(`${cook.name} | Skill: ${cook.skill} | Energy: ${Math.floor(cook.energy)}%`, 60, y + 20);
            this.ctx.fillText(`Salary: $${cook.salary}/day | Status: ${cook.cooking ? 'Cooking ' + cook.cooking.item.name : 'Idle'}`, 60, y + 40);
            y += 65;
        });
        y += 20;
        this.ctx.fillStyle = '#9b59b6';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText('Servers:', 50, y);
        y += 30;
        this.servers.forEach(server => {
            this.ctx.fillStyle = '#1abc9c';
            this.ctx.fillRect(50, y, 400, 50);
            this.ctx.strokeStyle = '#f1c40f';
            this.ctx.strokeRect(50, y, 400, 50);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`${server.name} | Skill: ${server.skill} | Energy: ${Math.floor(server.energy)}% | Salary: $${server.salary}/day`, 60, y + 30);
            y += 55;
        });
    }

    drawStatsTab() {
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 80, this.canvas.width, this.canvas.height - 80);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Restaurant Statistics', this.canvas.width / 2, 110);
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Total Days: ${this.day}`, 200, 160);
        this.ctx.fillText(`Total Served: ${this.totalServed}`, 200, 190);
        this.ctx.fillText(`Total Tips: $${this.stats.tips}`, 200, 220);
        this.ctx.fillText(`Complaints: ${this.stats.complaints}`, 200, 250);
        this.ctx.fillText(`Orders Today: ${this.stats.orders}`, 200, 280);
        this.ctx.fillText(`Atmosphere: ${this.atmosphere}%`, 200, 310);
        this.ctx.fillText(`Average Rating: ${this.ratingCount > 0 ? (this.totalRating / this.ratingCount).toFixed(1) : 'N/A'}`, 200, 340);
    }

    drawBottomPanel() {
        const panelY = this.canvas.height - 80;
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, panelY, this.canvas.width, 80);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Seated: ${this.seatedCustomers.length}/${this.tables.length} | Orders: ${this.servedOrders.filter(o => o.ready).length} ready`, 20, panelY + 25);
        this.ctx.fillText(`Kitchen: ${this.cooks.filter(c => c.cooking).length}/${this.cooks.length} cooking`, 350, panelY + 25);
        this.ctx.fillText(`Payroll: $${this.cooks.reduce((sum, c) => sum + c.salary, 0) + this.servers.reduce((sum, s) => sum + s.salary, 0)}/day`, 600, panelY + 25);
        this.ctx.fillText(`Perfect Orders: ${this.stats.perfect}`, 800, panelY + 25);
    }

    drawEvents() {
        if (this.events.length > 0) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(this.canvas.width - 220, 90, 210, 100);
            this.ctx.font = '12px Arial';
            this.events.slice(-3).forEach((ev, i) => {
                this.ctx.fillStyle = ev.type === 'danger' ? '#e74c3c' : '#f39c12';
                this.ctx.fillText(ev.text, this.canvas.width - 210, 110 + i * 25);
            });
        }
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        if (!this.paused) {
            this.dayTimer += deltaTime;
            this.hour = 8 + Math.floor(this.dayTimer / 5000);
            if (this.dayTimer > 30000 / this.speed) {
                this.dayTimer = 0;
                this.dailyUpdate();
            }
            if (Math.random() < 0.08 * this.speed) {
                this.spawnCustomer();
            }
            this.updateCustomers(deltaTime);
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawTopBar();
        if (this.selectedTab === 'main') {
            this.drawMainTab();
        } else if (this.selectedTab === 'menu') {
            this.drawMenuTab();
        } else if (this.selectedTab === 'kitchen') {
            this.drawKitchenTab();
        } else if (this.selectedTab === 'staff') {
            this.drawStaffTab();
        } else if (this.selectedTab === 'stats') {
            this.drawStatsTab();
        }
        this.drawBottomPanel();
        this.drawEvents();
        if (this.money < -5000) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CLOSED!', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Your restaurant went bankrupt!', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }
        requestAnimationFrame(this.gameLoop);
    }

    destroy() {
        this.canvas.remove();
    }
}

window.RestaurantSim = RestaurantSim;
