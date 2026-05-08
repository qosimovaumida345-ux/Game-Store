class ThemeParkSim {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 1000;
        this.canvas.height = 750;
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '20px auto';
        this.canvas.style.border = '3px solid #9b59b6';
        this.canvas.style.borderRadius = '10px';
        this.canvas.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
        document.querySelector('#game-container')?.appendChild(this.canvas) || document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.money = 50000;
        this.day = 1;
        this.hour = 8;
        this.ticketPrice = 30;
        this.guests = [];
        this.maxGuests = 100;
        this.reputation = 50;
        this.satisfaction = 70;
        this.totalVisitors = 0;
        this.totalRevenue = 0;
        this.rides = [];
        this.shops = [];
        this.attractions = [];
        this.employees = [];
        this.maintenanceQueue = [];
        this.gridSize = 50;
        this.cols = 16;
        this.rows = 10;
        this.parkMap = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));
        this.selectedRide = null;
        this.hoveredCell = null;
        this.entranceX = 8;
        this.entranceY = 9;
        this.paths = [];
        this.lastTime = 0;
        this.dayTimer = 0;
        this.speed = 1;
        this.paused = false;
        this.selectedTab = 'main';
        this.events = [];
        this.achievements = [];
        this.stats = { tickets: 0, ridesBroken: 0, incidents: 0, perfect: 0 };
        this.weather = 'sunny';
        this.maintenanceCost = 0;
        this.initPark();
        this.setupEventListeners();
        this.gameLoop = this.gameLoop.bind(this);
        this.gameLoop(0);
    }

    initPark() {
        this.rides = [
            { name: 'Roller Coaster', type: 'thrill', cost: 10000, capacity: 20, excitement: 90, intensity: 10, condition: 100, broken: false, maintenance: 500,运行时间: 0, popularity: 85, icon: '🎢' },
            { name: 'Ferris Wheel', type: 'family', cost: 5000, capacity: 40, excitement: 50, intensity: 3, condition: 100, broken: false, maintenance: 200,运行时间: 0, popularity: 75, icon: '🎡' },
            { name: 'Carousel', type: 'family', cost: 2000, capacity: 30, excitement: 30, intensity: 1, condition: 100, broken: false, maintenance: 100,运行时间: 0, popularity: 60, icon: '🎠' },
            { name: 'Drop Tower', type: 'thrill', cost: 8000, capacity: 16, excitement: 80, intensity: 9, condition: 100, broken: false, maintenance: 400,运行时间: 0, popularity: 80, icon: '🗼' },
            { name: 'Bumper Cars', type: 'family', cost: 3000, capacity: 24, excitement: 60, intensity: 4, condition: 100, broken: false, maintenance: 150,运行时间: 0, popularity: 70, icon: '🚗' },
            { name: 'Haunted House', type: 'scare', cost: 4000, capacity: 15, excitement: 70, intensity: 7, condition: 100, broken: false, maintenance: 250,运行时间: 0, popularity: 65, icon: '🏚️' },
            { name: 'Log Flume', type: 'water', cost: 6000, capacity: 20, excitement: 75, intensity: 6, condition: 100, broken: false, maintenance: 350,运行时间: 0, popularity: 78, icon: '🚣' },
            { name: 'Merry-go-round', type: 'family', cost: 1500, capacity: 25, excitement: 25, intensity: 1, condition: 100, broken: false, maintenance: 80,运行时间: 0, popularity: 55, icon: '🎠' },
            { name: 'Swing Ride', type: 'thrill', cost: 4000, capacity: 18, excitement: 65, intensity: 5, condition: 100, broken: false, maintenance: 200,运行时间: 0, popularity: 68, icon: '💫' },
            { name: 'Tea Cup Ride', type: 'family', cost: 2500, capacity: 20, excitement: 40, intensity: 2, condition: 100, broken: false, maintenance: 120,运行时间: 0, popularity: 62, icon: '☕' }
        ];
        this.shops = [
            { name: 'Ice Cream Shop', cost: 2000, income: 50, popularity: 80, icon: '🍦' },
            { name: 'Food Court', cost: 5000, income: 100, popularity: 85, icon: '🍔' },
            { name: 'Souvenir Shop', cost: 3000, income: 80, popularity: 75, icon: '🎁' },
            { name: 'Cotton Candy', cost: 1500, income: 40, popularity: 70, icon: '🍭' },
            { name: 'Hot Dog Stand', cost: 1800, income: 45, popularity: 72, icon: '🌭' }
        ];
        this.attractions = [
            { name: 'Zoo', cost: 15000, popularity: 90, visitors: 0, icon: '🦁' },
            { name: 'Aquarium', cost: 20000, popularity: 88, visitors: 0, icon: '🐠' },
            { name: 'Circus', cost: 10000, popularity: 82, visitors: 0, icon: '🎪' },
            { name: '4D Theater', cost: 12000, popularity: 78, visitors: 0, icon: '🎬' }
        ];
        for (let i = 0; i < 5; i++) {
            this.employees.push({
                name: ['Mike', 'Sarah', 'John', 'Lisa', 'Tom'][i],
                role: i < 2 ? 'maintenance' : i < 4 ? 'security' : 'cashier',
                salary: 100,
                energy: 100,
                active: true
            });
        }
        for (let i = 0; i < 3; i++) {
            this.paths.push({ x: 8, y: 8 - i, to: i === 0 ? 'entrance' : 'path' });
        }
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.hoveredCell = {
                col: Math.floor((x - 50) / this.gridSize),
                row: Math.floor((y - 80) / this.gridSize)
            };
        });

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleClick(x, y);
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.selectedRide = null;
        });
    }

    handleClick(x, y) {
        if (y < 80) {
            const tabs = ['Main', 'Rides', 'Shops', 'Staff', 'Stats'];
            const tabWidth = this.canvas.width / tabs.length;
            const tabIndex = Math.floor(x / tabWidth);
            if (tabIndex >= 0 && tabIndex < tabs.length) {
                this.selectedTab = tabs[tabIndex].toLowerCase();
            }
        }
        if (this.hoveredCell && this.hoveredCell.row >= 0 && this.hoveredCell.row < this.rows) {
            const mapX = this.hoveredCell.col;
            const mapY = this.hoveredCell.row;
            if (mapX >= 0 && mapX < this.cols && mapY >= 0 && mapY < this.rows) {
                if (this.selectedRide && this.parkMap[mapY][mapX] === null) {
                    this.buildRide(mapX, mapY);
                }
            }
        }
    }

    buildRide(x, y) {
        if (this.selectedRide && this.money >= this.selectedRide.cost) {
            this.money -= this.selectedRide.cost;
            this.parkMap[y][x] = { type: 'ride', data: this.selectedRide };
            this.maintenanceCost += this.selectedRide.maintenance;
        }
    }

    spawnGuest() {
        if (this.guests.length < this.maxGuests && Math.random() < 0.3) {
            const guest = {
                id: Date.now() + Math.random(),
                name: this.generateGuestName(),
                happiness: 70,
                energy: 100,
                hunger: 100,
                ridesVisited: 0,
                moneySpent: 0,
                x: this.entranceX,
                y: this.entranceY,
                ticketBought: false,
                targetRide: null
            };
            if (!guest.ticketBought && this.money > 0) {
                this.money -= this.ticketPrice;
                this.stats.tickets++;
                guest.ticketBought = true;
                this.guests.push(guest);
            }
        }
    }

    generateGuestName() {
        const names = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Blake'];
        return names[Math.floor(Math.random() * names.length)];
    }

    updateGuests(deltaTime) {
        this.guests.forEach(guest => {
            guest.energy -= deltaTime * 0.001;
            guest.hunger -= deltaTime * 0.002;
            if (guest.hunger < 30) {
                guest.happiness -= deltaTime * 0.01;
            }
            if (guest.energy < 20) {
                guest.happiness -= deltaTime * 0.01;
            }
            if (!guest.targetRide && Math.random() < 0.1) {
                const availableRides = this.rides.filter(r => !r.broken && r.condition > 50);
                if (availableRides.length > 0) {
                    guest.targetRide = availableRides[Math.floor(Math.random() * availableRides.length)];
                }
            }
            if (guest.targetRide && Math.random() < 0.05) {
                guest.happiness = Math.min(100, guest.happiness + 5);
                guest.ridesVisited++;
                this.totalRevenue += guest.targetRide.excitement * 0.5;
                guest.targetRide = null;
            }
            if (guest.happiness <= 0 || guest.energy <= 0) {
                const idx = this.guests.indexOf(guest);
                if (idx > -1) {
                    this.guests.splice(idx, 1);
                    this.stats.incidents++;
                }
            }
        });
    }

    updateRides(deltaTime) {
        this.rides.forEach(ride => {
            ride.运行时间 += deltaTime;
            if (ride.运行时间 > 60000) {
                ride.condition = Math.max(0, ride.condition - 5);
                ride.运行时间 = 0;
            }
            if (ride.condition < 30 && !ride.broken) {
                if (Math.random() < 0.1) {
                    ride.broken = true;
                    this.stats.ridesBroken++;
                    this.events.push({ type: 'danger', text: `${ride.name} broke down!` });
                }
            }
            if (ride.broken) {
                this.maintenanceQueue.push(ride);
            }
        });
    }

    repairRide(ride) {
        if (this.money >= ride.maintenance * 2) {
            this.money -= ride.maintenance * 2;
            ride.broken = false;
            ride.condition = 100;
            this.maintenanceQueue = this.maintenanceQueue.filter(r => r !== ride);
        }
    }

    dailyUpdate() {
        this.day++;
        this.hour = 8;
        const payroll = this.employees.reduce((sum, e) => sum + e.salary, 0);
        const maintenance = this.maintenanceCost;
        this.money -= payroll + maintenance + 100;
        this.guests = [];
        this.totalVisitors += this.stats.tickets;
        this.stats.tickets = 0;
        this.reputation = Math.floor((this.satisfaction + this.totalVisitors / 50) / 2);
        this.updateWeather();
        this.checkAchievements();
    }

    updateWeather() {
        const weathers = ['sunny', 'cloudy', 'rainy', 'hot'];
        this.weather = weathers[Math.floor(Math.random() * weathers.length)];
        if (this.weather === 'rainy') {
            this.satisfaction = Math.max(0, this.satisfaction - 5);
        } else if (this.weather === 'sunny') {
            this.satisfaction = Math.min(100, this.satisfaction + 3);
        }
    }

    checkAchievements() {
        if (this.totalVisitors >= 100 && !this.achievements.includes('first_visitors')) {
            this.achievements.push('first_visitors');
        }
        if (this.totalVisitors >= 1000 && !this.achievements.includes('popular_park')) {
            this.achievements.push('popular_park');
        }
        if (this.reputation >= 80 && !this.achievements.includes('top_park')) {
            this.achievements.push('top_park');
        }
        if (this.rides.filter(r => !r.broken).length >= 10 && !this.achievements.includes('ride_master')) {
            this.achievements.push('ride_master');
        }
        if (this.totalRevenue >= 50000 && !this.achievements.includes('rich_park')) {
            this.achievements.push('rich_park');
        }
        if (this.satisfaction >= 90 && !this.achievements.includes('happy_park')) {
            this.achievements.push('happy_park');
        }
    }

    drawTopBar() {
        this.ctx.fillStyle = '#8e44ad';
        this.ctx.fillRect(0, 0, this.canvas.width, 80);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Day ${this.day} | ${this.hour}:00`, 20, 25);
        this.ctx.fillText(`$${this.money.toLocaleString()}`, 180, 25);
        this.ctx.fillText(`Visitors: ${this.guests.length}/${this.maxGuests}`, 350, 25);
        this.ctx.fillText(`Reputation: ${this.reputation}`, 500, 25);
        this.ctx.fillText(`Satisfaction: ${this.satisfaction}%`, 650, 25);
        this.ctx.fillText(`Revenue: $${Math.floor(this.totalRevenue)}`, 800, 25);
        const tabs = ['Main', 'Rides', 'Shops', 'Staff', 'Stats'];
        tabs.forEach((tab, i) => {
            const x = i * (this.canvas.width / tabs.length);
            this.ctx.fillStyle = this.selectedTab === tab.toLowerCase() ? '#6c3483' : '#9b59b6';
            this.ctx.fillRect(x, 50, this.canvas.width / tabs.length, 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(tab, x + this.canvas.width / tabs.length / 2, 70);
        });
    }

    drawParkMap() {
        this.ctx.fillStyle = '#27ae60';
        this.ctx.fillRect(50, 80, this.cols * this.gridSize, this.rows * this.gridSize);
        this.ctx.strokeStyle = '#229954';
        this.ctx.lineWidth = 1;
        for (let r = 0; r <= this.rows; r++) {
            this.ctx.beginPath();
            this.ctx.moveTo(50, 80 + r * this.gridSize);
            this.ctx.lineTo(50 + this.cols * this.gridSize, 80 + r * this.gridSize);
            this.ctx.stroke();
        }
        for (let c = 0; c <= this.cols; c++) {
            this.ctx.beginPath();
            this.ctx.moveTo(50 + c * this.gridSize, 80);
            this.ctx.lineTo(50 + c * this.gridSize, 80 + this.rows * this.gridSize);
            this.ctx.stroke();
        }
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.parkMap[r][c]) {
                    const cell = this.parkMap[r][c];
                    const x = 50 + c * this.gridSize;
                    const y = 80 + r * this.gridSize;
                    if (cell.type === 'ride') {
                        this.ctx.fillStyle = cell.data.broken ? '#e74c3c' : '#3498db';
                        this.ctx.fillRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
                        this.ctx.strokeStyle = '#f1c40f';
                        this.ctx.lineWidth = 2;
                        this.ctx.strokeRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
                        this.ctx.font = '24px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText(cell.data.icon, x + this.gridSize / 2, y + this.gridSize / 2 + 8);
                    }
                }
            }
        }
        const entranceX = 50 + this.entranceX * this.gridSize;
        const entranceY = 80 + this.entranceY * this.gridSize;
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.fillRect(entranceX, entranceY, this.gridSize, this.gridSize);
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillText('🚪', entranceX + this.gridSize / 2, entranceY + this.gridSize / 2 + 4);
        if (this.hoveredCell && this.hoveredCell.row >= 0) {
            const x = 50 + this.hoveredCell.col * this.gridSize;
            const y = 80 + this.hoveredCell.row * this.gridSize;
            this.ctx.fillStyle = this.selectedRide ? 'rgba(46, 204, 113, 0.4)' : 'rgba(231, 76, 60, 0.4)';
            this.ctx.fillRect(x, y, this.gridSize, this.gridSize);
            this.ctx.strokeStyle = this.selectedRide ? '#2ecc71' : '#e74c3c';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, this.gridSize, this.gridSize);
        }
    }

    drawRideSelector() {
        const y = this.canvas.height - 200;
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, y, this.canvas.width, 200);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Select a ride to build:', 20, y + 20);
        let rx = 20;
        this.rides.forEach((ride, i) => {
            this.ctx.fillStyle = this.selectedRide === ride ? '#2ecc71' : '#34495e';
            this.ctx.fillRect(rx, y + 35, 90, 90);
            this.ctx.strokeStyle = this.selectedRide === ride ? '#f1c40f' : '#7f8c8d';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(rx, y + 35, 90, 90);
            this.ctx.font = '28px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(ride.icon, rx + 45, y + 70);
            this.ctx.font = '10px Arial';
            this.ctx.fillText(ride.name, rx + 45, y + 95);
            this.ctx.fillText(`$${ride.cost}`, rx + 45, y + 110);
            rx += 100;
        });
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText('Right-click to deselect', this.canvas.width - 20, y + 20);
    }

    drawMainTab() {
        this.drawParkMap();
        this.drawRideSelector();
    }

    drawRidesTab() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 80, this.canvas.width, this.canvas.height - 80);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Ride Management', this.canvas.width / 2, 110);
        this.rides.forEach((ride, i) => {
            const x = 50 + (i % 4) * 230;
            const y = 140 + Math.floor(i / 4) * 150;
            this.ctx.fillStyle = ride.broken ? '#c0392b' : ride.condition < 50 ? '#f39c12' : '#16a085';
            this.ctx.fillRect(x, y, 210, 130);
            this.ctx.strokeStyle = '#f1c40f';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, 210, 130);
            this.ctx.font = '28px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(ride.icon, x + 105, y + 45);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillText(ride.name, x + 105, y + 70);
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`Condition: ${ride.condition}%`, x + 105, y + 90);
            this.ctx.fillText(`Excitement: ${ride.excitement}`, x + 105, y + 110);
            if (ride.broken) {
                this.ctx.fillStyle = '#e74c3c';
                this.ctx.fillText('BROKEN!', x + 105, y + 125);
            }
        });
    }

    drawShopsTab() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 80, this.canvas.width, this.canvas.height - 80);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Park Shops', this.canvas.width / 2, 110);
        this.shops.forEach((shop, i) => {
            const x = 50 + (i % 3) * 310;
            const y = 150 + Math.floor(i / 3) * 180;
            this.ctx.fillStyle = '#16a085';
            this.ctx.fillRect(x, y, 280, 160);
            this.ctx.strokeStyle = '#f1c40f';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, 280, 160);
            this.ctx.font = '32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(shop.icon, x + 140, y + 50);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillText(shop.name, x + 140, y + 90);
            this.ctx.font = '14px Arial';
            this.ctx.fillText(`Cost: $${shop.cost}`, x + 140, y + 115);
            this.ctx.fillText(`Income: $${shop.income}/min`, x + 140, y + 140);
        });
    }

    drawStaffTab() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 80, this.canvas.width, this.canvas.height - 80);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Staff Management', this.canvas.width / 2, 110);
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Employees: ${this.employees.length} | Payroll: $${this.employees.reduce((sum, e) => sum + e.salary, 0)}/day`, 500, 140);
        let y = 170;
        this.employees.forEach((emp, i) => {
            const roles = { maintenance: '#e74c3c', security: '#3498db', cashier: '#27ae60' };
            this.ctx.fillStyle = roles[emp.role] || '#7f8c8d';
            this.ctx.fillRect(150, y, 700, 60);
            this.ctx.strokeStyle = '#f1c40f';
            this.ctx.strokeRect(150, y, 700, 60);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`${emp.name} | Role: ${emp.role}`, 170, y + 25);
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`Salary: $${emp.salary}/day | Energy: ${Math.floor(emp.energy)}%`, 170, y + 50);
            y += 70;
        });
    }

    drawStatsTab() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 80, this.canvas.width, this.canvas.height - 80);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Park Statistics', this.canvas.width / 2, 110);
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Total Days: ${this.day}`, 200, 160);
        this.ctx.fillText(`Total Visitors: ${this.totalVisitors}`, 200, 190);
        this.ctx.fillText(`Total Revenue: $${Math.floor(this.totalRevenue)}`, 200, 220);
        this.ctx.fillText(`Tickets Sold: ${this.stats.tickets}`, 200, 250);
        this.ctx.fillText(`Incidents: ${this.stats.incidents}`, 200, 280);
        this.ctx.fillText(`Rides Broken: ${this.stats.ridesBroken}`, 200, 310);
        this.ctx.fillText(`Weather: ${this.weather}`, 200, 340);
        this.ctx.fillText(`Maintenance Queue: ${this.maintenanceQueue.length}`, 200, 370);
    }

    drawBottomPanel() {
        const panelY = this.canvas.height - 50;
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, panelY, this.canvas.width, 50);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Ticket Price: $${this.ticketPrice}`, 20, panelY + 25);
        this.ctx.fillText(`Rides Built: ${this.rides.filter(r => this.parkMap.flat().some(c => c?.data === r)).length}`, 200, panelY + 25);
        this.ctx.fillText(`Weather: ${this.weather}`, 400, panelY + 25);
        this.ctx.fillText(`Employees: ${this.employees.length}`, 550, panelY + 25);
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
            if (Math.random() < 0.1 * this.speed) {
                this.spawnGuest();
            }
            this.updateGuests(deltaTime);
            this.updateRides(deltaTime);
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawTopBar();
        if (this.selectedTab === 'main') {
            this.drawMainTab();
        } else if (this.selectedTab === 'rides') {
            this.drawRidesTab();
        } else if (this.selectedTab === 'shops') {
            this.drawShopsTab();
        } else if (this.selectedTab === 'staff') {
            this.drawStaffTab();
        } else if (this.selectedTab === 'stats') {
            this.drawStatsTab();
        }
        this.drawBottomPanel();
        this.drawEvents();
        if (this.money < -20000) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PARK CLOSED!', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Your theme park went bankrupt!', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }
        requestAnimationFrame(this.gameLoop);
    }

    destroy() {
        this.canvas.remove();
    }
}

window.ThemeParkSim = ThemeParkSim;
