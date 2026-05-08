class AirportManager {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 1000;
        this.canvas.height = 750;
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '20px auto';
        this.canvas.style.border = '3px solid #3498db';
        this.canvas.style.borderRadius = '10px';
        this.canvas.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
        document.querySelector('#game-container')?.appendChild(this.canvas) || document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.money = 100000;
        this.reputation = 50;
        this.satisfaction = 70;
        this.totalPassengers = 0;
        this.day = 1;
        this.timeOfDay = 0;
        this.runways = [];
        this.gates = [];
        this.planes = [];
        this.pendingPlanes = [];
        this.shops = [];
        this.employees = [];
        this.fuel = 10000;
        this.maxFuel = 15000;
        this.security = 50;
        this.baggageSystem = 100;
        this.weather = 'clear';
        this.delayMultiplier = 1;
        this.lastTime = 0;
        this.dayTimer = 0;
        this.speed = 1;
        this.paused = false;
        this.selectedTab = 'overview';
        this.achievements = [];
        this.events = [];
        this.stats = { flights: 0, onTime: 0, delayed: 0, cancelled: 0 };
        this.initAirport();
        this.setupEventListeners();
        this.gameLoop = this.gameLoop.bind(this);
        this.gameLoop(0);
    }

    initAirport() {
        this.runways = [
            { id: 1, name: 'Runway 1', length: 3500, occupied: false, plane: null },
            { id: 2, name: 'Runway 2', length: 3000, occupied: false, plane: null }
        ];
        for (let i = 1; i <= 10; i++) {
            this.gates.push({
                id: i,
                name: `Gate ${i}`,
                occupied: false,
                plane: null,
                terminal: i <= 5 ? 1 : 2,
                shop: null,
                waitingPassengers: 0
            });
        }
        this.planes = [];
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
        if (y < 100) {
            const tabs = ['overview', 'gates', 'runways', 'shops', 'employees', 'flights'];
            const tabWidth = this.canvas.width / tabs.length;
            const tabIndex = Math.floor(x / tabWidth);
            if (tabIndex >= 0 && tabIndex < tabs.length) {
                this.selectedTab = tabs[tabIndex];
            }
        }
        if (this.selectedTab === 'gates' && y > 150 && y < 550) {
            const gateIndex = Math.floor((x - 100) / 80);
            if (gateIndex >= 0 && gateIndex < this.gates.length) {
                this.manageGate(gateIndex);
            }
        }
        if (this.selectedTab === 'shops' && y > 150 && y < 550) {
            const shopIndex = Math.floor((x - 100) / 100);
            if (shopIndex >= 0 && shopIndex < this.shops.length) {
                this.upgradeShop(shopIndex);
            }
        }
    }

    manageGate(gateIndex) {
        const gate = this.gates[gateIndex];
        if (!gate.shop && this.money >= 2000) {
            this.money -= 2000;
            gate.shop = { type: 'retail', level: 1, income: 100 };
        }
    }

    upgradeShop(shopIndex) {
        const shop = this.shops[shopIndex];
        if (shop && this.money >= shop.level * 3000) {
            this.money -= shop.level * 3000;
            shop.level++;
            shop.income *= 1.5;
        }
    }

    spawnPlane() {
        const planeTypes = [
            { name: 'Boeing 737', passengers: 150, fuel: 300, delay: 5, airline: 'Delta' },
            { name: 'Boeing 747', passengers: 400, fuel: 500, delay: 8, airline: 'United' },
            { name: 'Airbus A320', passengers: 180, fuel: 350, delay: 6, airline: 'American' },
            { name: 'Boeing 777', passengers: 350, fuel: 450, delay: 7, airline: 'Southwest' },
            { name: 'Embraer E190', passengers: 100, fuel: 200, delay: 4, airline: 'JetBlue' }
        ];
        if (this.pendingPlanes.length < 5) {
            const type = planeTypes[Math.floor(Math.random() * planeTypes.length)];
            const isArrival = Math.random() > 0.5;
            const gate = isArrival ? this.findAvailableGate() : null;
            const runway = this.findAvailableRunway();
            if (runway) {
                this.pendingPlanes.push({
                    ...type,
                    id: Date.now() + Math.random(),
                    isArrival,
                    status: 'waiting',
                    gate,
                    runway,
                    fuel: type.fuel,
                    passengers: Math.floor(type.passengers * (0.8 + Math.random() * 0.2)),
                    delay: type.delay,
                    airline: type.airline
                });
            }
        }
    }

    findAvailableGate() {
        return this.gates.find(g => !g.occupied) || null;
    }

    findAvailableRunway() {
        return this.runways.find(r => !r.occupied) || null;
    }

    assignPlaneToGate(plane) {
        if (plane.isArrival) {
            const gate = this.findAvailableGate();
            if (gate) {
                gate.occupied = true;
                gate.plane = plane;
                gate.waitingPassengers = plane.passengers;
                plane.gate = gate;
                plane.status = 'at_gate';
                return true;
            }
        }
        return false;
    }

    processPlaneLanding(plane) {
        if (!plane.runway || plane.runway.occupied) return;
        plane.runway.occupied = true;
        plane.status = 'landing';
        setTimeout(() => {
            plane.status = 'at_gate';
            this.assignPlaneToGate(plane);
            plane.runway.occupied = false;
        }, 3000 / this.speed);
    }

    processPlaneTakeoff(plane) {
        if (!plane.runway || plane.runway.occupied) return;
        if (!plane.gate || plane.gate.occupied) return;
        plane.runway.occupied = true;
        plane.gate.occupied = false;
        plane.gate.plane = null;
        plane.gate.waitingPassengers = 0;
        plane.status = 'takeoff';
        setTimeout(() => {
            plane.status = 'departed';
            plane.runway.occupied = false;
            this.totalPassengers += plane.passengers;
            this.stats.flights++;
            this.money += plane.passengers * 50;
            this.satisfaction = Math.min(100, this.satisfaction + 2);
        }, 3000 / this.speed);
    }

    updatePlanes(deltaTime) {
        this.pendingPlanes.forEach(plane => {
            if (plane.status === 'waiting') {
                if (plane.isArrival) {
                    this.processPlaneLanding(plane);
                } else {
                    if (plane.gate) {
                        this.processPlaneTakeoff(plane);
                    } else {
                        this.assignPlaneToGate(plane);
                    }
                }
            }
        });
        this.pendingPlanes = this.pendingPlanes.filter(p => p.status !== 'departed');
        this.gates.forEach(gate => {
            if (gate.plane && gate.plane.status === 'at_gate') {
                gate.waitingPassengers = Math.max(0, gate.waitingPassengers - deltaTime * 0.01);
            }
        });
    }

    updateShops(deltaTime) {
        this.gates.forEach(gate => {
            if (gate.shop) {
                this.money += gate.shop.income * (deltaTime / 60000) * gate.shop.level;
            }
        });
    }

    dailyUpdate() {
        this.day++;
        this.timeOfDay = 0;
        this.spawnPlane();
        this.spawnPlane();
        this.spawnPlane();
        const fuelCost = 500;
        const employeeCost = this.employees.length * 100;
        const maintenanceCost = 200;
        this.money -= fuelCost + employeeCost + maintenanceCost;
        if (this.weather === 'stormy') {
            this.pendingPlanes.forEach(p => {
                if (Math.random() < 0.3) {
                    p.delay += 10;
                    this.stats.delayed++;
                }
            });
        }
        if (this.security < 30) {
            this.satisfaction = Math.max(0, this.satisfaction - 10);
            this.events.push({ type: 'danger', text: 'Security alert! Satisfaction dropped.' });
        }
        if (this.pendingPlanes.length > 8) {
            this.satisfaction = Math.max(0, this.satisfaction - 5);
            this.stats.delayed++;
        }
        this.reputation = Math.floor((this.satisfaction + this.totalPassengers / 100) / 2);
        this.checkEvents();
    }

    checkEvents() {
        if (this.pendingPlanes.length > 10) {
            this.events.push({ type: 'warning', text: 'Too many planes waiting!' });
        }
        if (this.fuel < 2000) {
            this.events.push({ type: 'danger', text: 'Fuel running low!' });
        }
        if (this.events.length > 5) this.events.shift();
    }

    checkAchievements() {
        if (this.totalPassengers >= 1000 && !this.achievements.includes('busy_airport')) {
            this.achievements.push('busy_airport');
        }
        if (this.totalPassengers >= 10000 && !this.achievements.includes('major_hub')) {
            this.achievements.push('major_hub');
        }
        if (this.reputation >= 80 && !this.achievements.includes('top_rated')) {
            this.achievements.push('top_rated');
        }
        if (this.employees.length >= 20 && !this.achievements.includes('big_staff')) {
            this.achievements.push('big_staff');
        }
        if (this.day >= 30 && this.satisfaction > 80 && !this.achievements.includes('month_survivor')) {
            this.achievements.push('month_survivor');
        }
    }

    drawTopBar() {
        this.ctx.fillStyle = '#2980b9';
        this.ctx.fillRect(0, 0, this.canvas.width, 100);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Day ${this.day} | Time: ${Math.floor(this.timeOfDay)}:00`, 20, 25);
        this.ctx.fillText(`$${this.money.toLocaleString()}`, 200, 25);
        this.ctx.fillText(`Passengers: ${this.totalPassengers}`, 350, 25);
        this.ctx.fillText(`Reputation: ${this.reputation}`, 500, 25);
        this.ctx.fillText(`Satisfaction: ${this.satisfaction}%`, 650, 25);
        this.ctx.fillText(`Fuel: ${this.fuel}/${this.maxFuel}`, 800, 25);
        const tabs = ['Overview', 'Gates', 'Runways', 'Shops', 'Employees', 'Flights'];
        tabs.forEach((tab, i) => {
            const x = i * (this.canvas.width / tabs.length);
            this.ctx.fillStyle = this.selectedTab === tabs[i].toLowerCase() ? '#1a5276' : '#3498db';
            this.ctx.fillRect(x, 50, this.canvas.width / tabs.length, 50);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(tab, x + this.canvas.width / tabs.length / 2, 80);
        });
    }

    drawAirportView() {
        this.ctx.fillStyle = '#7f8c8d';
        this.ctx.fillRect(50, 120, 900, 400);
        this.ctx.fillStyle = '#34495e';
        this.ctx.fillRect(50, 120, 450, 200);
        this.ctx.fillRect(500, 120, 450, 200);
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Terminal 1', 275, 150);
        this.ctx.fillText('Terminal 2', 725, 150);
        this.runways.forEach((runway, i) => {
            this.ctx.fillStyle = '#1a1a2e';
            this.ctx.fillRect(100 + i * 350, 350, 300, 80);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '14px Arial';
            this.ctx.fillText(`${runway.name} - ${runway.occupied ? 'IN USE' : 'CLEAR'}`, 250 + i * 350, 395);
            this.ctx.fillText(`Length: ${runway.length}m`, 250 + i * 350, 415);
            if (runway.plane) {
                this.ctx.fillStyle = '#3498db';
                this.ctx.fillRect(200 + i * 350, 370, 100, 40);
                this.ctx.fillText(runway.plane.name, 250 + i * 350, 395);
            }
        });
        this.gates.forEach((gate, i) => {
            const terminal = gate.terminal === 1 ? 1 : 2;
            const x = 80 + (i % 5) * 80 + (terminal - 1) * 450;
            const y = 180 + Math.floor(i / 5) * 80;
            this.ctx.fillStyle = gate.occupied ? '#e74c3c' : '#27ae60';
            this.ctx.fillRect(x, y, 70, 60);
            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, 70, 60);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(gate.name, x + 35, y + 20);
            if (gate.plane) {
                this.ctx.fillText(gate.plane.airline, x + 35, y + 40);
            } else {
                this.ctx.fillText('Available', x + 35, y + 40);
            }
        });
        this.ctx.fillStyle = '#95a5a6';
        this.ctx.fillRect(50, 540, 900, 50);
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Runway Area', 20, 575);
        if (this.pendingPlanes.length > 0) {
            this.ctx.fillText(`Planes waiting: ${this.pendingPlanes.length}`, 450, 575);
        }
    }

    drawGatesTab() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 100, this.canvas.width, this.canvas.height - 100);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Gate Management', this.canvas.width / 2, 130);
        this.gates.forEach((gate, i) => {
            const x = 100 + (i % 5) * 80;
            const y = 160 + Math.floor(i / 5) * 150;
            this.ctx.fillStyle = gate.occupied ? '#c0392b' : '#27ae60';
            this.ctx.fillRect(x, y, 70, 120);
            this.ctx.strokeStyle = '#f1c40f';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, 70, 120);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(gate.name, x + 35, y + 20);
            if (gate.plane) {
                this.ctx.font = '12px Arial';
                this.ctx.fillText(gate.plane.name, x + 35, y + 50);
                this.ctx.fillText(gate.plane.airline, x + 35, y + 70);
                this.ctx.fillText(`${gate.plane.passengers} pax`, x + 35, y + 90);
            } else {
                this.ctx.font = '12px Arial';
                this.ctx.fillText('Click to', x + 35, y + 50);
                this.ctx.fillText('add shop', x + 35, y + 70);
                this.ctx.fillText('($2000)', x + 35, y + 90);
            }
            if (gate.shop) {
                this.ctx.fillStyle = '#f1c40f';
                this.ctx.fillText(`Shop Lv${gate.shop.level}`, x + 35, y + 110);
            }
        });
    }

    drawRunwaysTab() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 100, this.canvas.width, this.canvas.height - 100);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Runway Management', this.canvas.width / 2, 130);
        this.runways.forEach((runway, i) => {
            const x = 200 + i * 300;
            const y = 180;
            this.ctx.fillStyle = '#34495e';
            this.ctx.fillRect(x, y, 200, 200);
            this.ctx.strokeStyle = runway.occupied ? '#e74c3c' : '#2ecc71';
            this.ctx.lineWidth = 4;
            this.ctx.strokeRect(x, y, 200, 200);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillText(runway.name, x + 100, y + 40);
            this.ctx.font = '14px Arial';
            this.ctx.fillText(`Status: ${runway.occupied ? 'OCCUPIED' : 'CLEAR'}`, x + 100, y + 80);
            this.ctx.fillText(`Length: ${runway.length}m`, x + 100, y + 110);
            this.ctx.fillText(`Max Plane: Boeing 747`, x + 100, y + 140);
            this.ctx.fillText(`Maintenance: Good`, x + 100, y + 170);
        });
    }

    drawShopsTab() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 100, this.canvas.width, this.canvas.height - 100);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Airport Shops & Services', this.canvas.width / 2, 130);
        const shopTypes = [
            { name: 'Retail', icon: '🛍️', income: 100, cost: 2000 },
            { name: 'Restaurant', icon: '🍽️', income: 150, cost: 3000 },
            { name: 'Cafe', icon: '☕', income: 80, cost: 1500 },
            { name: 'Duty Free', icon: '🛒', income: 200, cost: 5000 },
            { name: 'Lounge', icon: '🛋️', income: 250, cost: 8000 },
            { name: 'Car Rental', icon: '🚗', income: 180, cost: 4000 }
        ];
        shopTypes.forEach((shop, i) => {
            const x = 100 + (i % 4) * 110;
            const y = 170 + Math.floor(i / 4) * 120;
            this.ctx.fillStyle = '#16a085';
            this.ctx.fillRect(x, y, 100, 100);
            this.ctx.strokeStyle = '#f1c40f';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, 100, 100);
            this.ctx.font = '30px Arial';
            this.ctx.fillText(shop.icon, x + 50, y + 40);
            this.ctx.font = '12px Arial';
            this.ctx.fillText(shop.name, x + 50, y + 60);
            this.ctx.fillText(`$${shop.income}/min`, x + 50, y + 75);
            this.ctx.fillText(`Cost: $${shop.cost}`, x + 50, y + 90);
        });
        this.ctx.fillText('Click on gates to add shops', 500, 450);
    }

    drawEmployeesTab() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 100, this.canvas.width, this.canvas.height - 100);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Employee Management', this.canvas.width / 2, 130);
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Employees: ${this.employees.length} | Payroll: $${this.employees.length * 100}/day`, 500, 160);
        const roles = [
            { name: 'Pilot', icon: '✈️', count: 0, salary: 500 },
            { name: 'Ground Crew', icon: '🔧', count: 0, salary: 100 },
            { name: 'Security', icon: '🔒', count: 0, salary: 150 },
            { name: 'Retail Staff', icon: '👔', count: 0, salary: 80 },
            { name: 'Cleaner', icon: '🧹', count: 0, salary: 70 },
            { name: 'Admin', icon: '📋', count: 0, salary: 200 }
        ];
        roles.forEach((role, i) => {
            const x = 100 + (i % 3) * 300;
            const y = 190 + Math.floor(i / 3) * 150;
            this.ctx.fillStyle = '#7f8c8d';
            this.ctx.fillRect(x, y, 250, 130);
            this.ctx.strokeStyle = '#f1c40f';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, 250, 130);
            this.ctx.font = '30px Arial';
            this.ctx.fillText(role.icon, x + 40, y + 50);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(role.name, x + 80, y + 30);
            this.ctx.font = '14px Arial';
            this.ctx.fillText(`Count: ${this.employees.filter(e => e.role === role.name).length}`, x + 80, y + 55);
            this.ctx.fillText(`Salary: $${role.salary}/day`, x + 80, y + 80);
            this.ctx.fillStyle = '#27ae60';
            this.ctx.fillText('Hire', x + 80, y + 115);
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.fillText('Fire', x + 150, y + 115);
        });
    }

    drawFlightsTab() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 100, this.canvas.width, this.canvas.height - 100);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Flight Status Board', this.canvas.width / 2, 130);
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`On Time: ${this.stats.onTime} | Delayed: ${this.stats.delayed} | Cancelled: ${this.stats.cancelled}`, 500, 160);
        this.pendingPlanes.forEach((plane, i) => {
            const y = 180 + i * 50;
            this.ctx.fillStyle = plane.status === 'landing' ? '#3498db' : plane.status === 'takeoff' ? '#2ecc71' : '#f39c12';
            this.ctx.fillRect(100, y, 800, 40);
            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.strokeRect(100, y, 800, 40);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`${plane.isArrival ? 'ARR' : 'DEP'} | ${plane.airline} | ${plane.name} | ${plane.passengers} pax | Status: ${plane.status}`, 110, y + 25);
        });
    }

    drawBottomPanel() {
        const panelY = this.canvas.height - 100;
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, panelY, this.canvas.width, 100);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Total Flights: ${this.stats.flights}`, 20, panelY + 25);
        this.ctx.fillText(`On-Time Rate: ${this.stats.flights > 0 ? Math.floor((this.stats.onTime / this.stats.flights) * 100) : 0}%`, 150, panelY + 25);
        this.ctx.fillText(`Security Level: ${this.security}%`, 300, panelY + 25);
        this.ctx.fillText(`Baggage System: ${this.baggageSystem}%`, 450, panelY + 25);
        this.ctx.fillText(`Weather: ${this.weather}`, 600, panelY + 25);
        this.ctx.fillText(`Planes in queue: ${this.pendingPlanes.length}`, 700, panelY + 25);
    }

    drawEvents() {
        if (this.events.length > 0) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(this.canvas.width - 220, 110, 210, 100);
            this.ctx.font = '12px Arial';
            this.events.slice(-3).forEach((ev, i) => {
                this.ctx.fillStyle = ev.type === 'danger' ? '#e74c3c' : '#f39c12';
                this.ctx.fillText(ev.text, this.canvas.width - 210, 130 + i * 25);
            });
        }
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        if (!this.paused) {
            this.timeOfDay += deltaTime * 0.001 * this.speed;
            this.dayTimer += deltaTime;
            if (this.dayTimer > 10000 / this.speed) {
                this.dayTimer = 0;
                this.dailyUpdate();
                this.checkAchievements();
            }
            if (Math.random() < 0.01 * this.speed) {
                this.spawnPlane();
            }
            this.updatePlanes(deltaTime);
            this.updateShops(deltaTime);
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawTopBar();
        if (this.selectedTab === 'overview') {
            this.drawAirportView();
        } else if (this.selectedTab === 'gates') {
            this.drawGatesTab();
        } else if (this.selectedTab === 'runways') {
            this.drawRunwaysTab();
        } else if (this.selectedTab === 'shops') {
            this.drawShopsTab();
        } else if (this.selectedTab === 'employees') {
            this.drawEmployeesTab();
        } else if (this.selectedTab === 'flights') {
            this.drawFlightsTab();
        }
        this.drawBottomPanel();
        this.drawEvents();
        if (this.money < -50000) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('BANKRUPT!', this.canvas.width / 2, this.canvas.height / 2);
        }
        requestAnimationFrame(this.gameLoop);
    }

    destroy() {
        this.canvas.remove();
    }
}

window.AirportManager = AirportManager;
