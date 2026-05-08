class HospitalSim {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 1000;
        this.canvas.height = 750;
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '20px auto';
        this.canvas.style.border = '3px solid #e74c3c';
        this.canvas.style.borderRadius = '10px';
        this.canvas.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
        document.querySelector('#game-container')?.appendChild(this.canvas) || document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.money = 50000;
        this.reputation = 50;
        this.day = 1;
        this.hour = 8;
        this.patients = [];
        this.patientsTreated = 0;
        this.patientsDied = 0;
        this.emergencyQueue = [];
        this.waitingRoom = [];
        this.rooms = [];
        this.doctors = [];
        this.nurses = [];
        this.equipment = [];
        this.medication = 100;
        this.beds = 20;
        this.occupiedBeds = 0;
        this.researchPoints = 0;
        this.satisfaction = 70;
        this.lastTime = 0;
        this.dayTimer = 0;
        this.speed = 1;
        this.paused = false;
        this.selectedTab = 'main';
        this.events = [];
        this.achievements = [];
        this.stats = { successful: 0, failed: 0, emergencies: 0 };
        this.diseases = [
            { name: 'Cold', severity: 1, treatmentTime: 10, cost: 100, recovery: 95, icon: '🤧' },
            { name: 'Flu', severity: 2, treatmentTime: 20, cost: 200, recovery: 90, icon: '😷' },
            { name: 'Broken Bone', severity: 3, treatmentTime: 40, cost: 500, recovery: 85, icon: '🦴' },
            { name: 'Appendicitis', severity: 5, treatmentTime: 60, cost: 1000, recovery: 80, icon: '🔪' },
            { name: 'Heart Condition', severity: 8, treatmentTime: 90, cost: 2000, recovery: 70, icon: '❤️‍🔥' },
            { name: 'Cancer', severity: 10, treatmentTime: 120, cost: 5000, recovery: 50, icon: '🎗️' },
            { name: 'Diabetes', severity: 4, treatmentTime: 30, cost: 800, recovery: 75, icon: '💉' },
            { name: 'Pneumonia', severity: 6, treatmentTime: 50, cost: 1500, recovery: 75, icon: '🫁' }
        ];
        this.initHospital();
        this.setupEventListeners();
        this.gameLoop = this.gameLoop.bind(this);
        this.gameLoop(0);
    }

    initHospital() {
        const roomTypes = ['reception', 'waiting', 'emergency', 'surgery', 'icu', 'pharmacy', 'lab', 'radiology'];
        roomTypes.forEach((type, i) => {
            this.rooms.push({
                type,
                name: type.charAt(0).toUpperCase() + type.slice(1),
                level: 1,
                capacity: type === 'waiting' ? 30 : type === 'icu' ? 5 : 10,
                occupied: 0,
                staff: [],
                equipment: []
            });
        });
        for (let i = 0; i < 3; i++) {
            this.doctors.push({
                name: this.generateName('doctor'),
                specialty: ['General', 'Surgeon', 'Cardiologist', 'Oncologist'][Math.floor(Math.random() * 4)],
                skill: 50 + Math.floor(Math.random() * 50),
                energy: 100,
                salary: 500,
                shift: 'day',
                treating: null
            });
        }
        for (let i = 0; i < 5; i++) {
            this.nurses.push({
                name: this.generateName('nurse'),
                skill: 30 + Math.floor(Math.random() * 40),
                energy: 100,
                salary: 200,
                shift: i < 3 ? 'day' : 'night',
                assisting: null
            });
        }
        this.equipment = [
            { name: 'MRI Scanner', level: 1, cost: 10000, effectiveness: 20 },
            { name: 'X-Ray Machine', level: 1, cost: 5000, effectiveness: 15 },
            { name: 'CT Scanner', level: 1, cost: 8000, effectiveness: 18 },
            { name: 'Ventilator', level: 1, cost: 3000, effectiveness: 10 },
            { name: 'Defibrillator', level: 1, cost: 2000, effectiveness: 8 }
        ];
    }

    generateName(role) {
        const first = ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Nurse Ann', 'Nurse Beth', 'Nurse Carol'][Math.floor(Math.random() * 6)];
        return first;
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
            const tabs = ['Main', 'Staff', 'Equipment', 'Research', 'Stats'];
            const tabWidth = this.canvas.width / tabs.length;
            const tabIndex = Math.floor(x / tabWidth);
            if (tabIndex >= 0 && tabIndex < tabs.length) {
                this.selectedTab = tabs[tabIndex].toLowerCase();
            }
        }
        if (this.selectedTab === 'staff' && y > 150 && y < 500) {
            const actionIndex = Math.floor((x - 50) / 150);
            if (actionIndex === 0 && this.money >= 10000) {
                this.hireDoctor();
            } else if (actionIndex === 1 && this.money >= 5000) {
                this.hireNurse();
            }
        }
    }

    hireDoctor() {
        if (this.money >= 10000) {
            this.money -= 10000;
            this.doctors.push({
                name: this.generateName('doctor'),
                specialty: ['General', 'Surgeon', 'Cardiologist', 'Oncologist'][Math.floor(Math.random() * 4)],
                skill: 50 + Math.floor(Math.random() * 50),
                energy: 100,
                salary: 500,
                shift: 'day',
                treating: null
            });
        }
    }

    hireNurse() {
        if (this.money >= 5000) {
            this.money -= 5000;
            this.nurses.push({
                name: this.generateName('nurse'),
                skill: 30 + Math.floor(Math.random() * 40),
                energy: 100,
                salary: 200,
                shift: 'day',
                assisting: null
            });
        }
    }

    spawnPatient() {
        const disease = this.diseases[Math.floor(Math.random() * this.diseases.length)];
        const isEmergency = disease.severity >= 5 || Math.random() < 0.15;
        const patient = {
            id: Date.now() + Math.random(),
            name: this.generatePatientName(),
            disease: disease.name,
            diseaseData: disease,
            severity: disease.severity,
            health: 100,
            urgency: isEmergency ? 'critical' : disease.severity >= 3 ? 'urgent' : 'normal',
            waitingTime: 0,
            treatmentProgress: 0,
            assignedDoctor: null,
            assignedRoom: null,
            treatmentCost: disease.cost,
            insurance: Math.random() > 0.3
        };
        if (isEmergency) {
            this.emergencyQueue.push(patient);
            this.stats.emergencies++;
        } else {
            this.waitingRoom.push(patient);
        }
    }

    generatePatientName() {
        const names = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Edward', 'Fiona', 'George', 'Helen'];
        return names[Math.floor(Math.random() * names.length)];
    }

    treatPatient(patient, doctor, deltaTime) {
        if (!doctor || doctor.energy <= 0) return;
        const treatmentSpeed = (doctor.skill / 100) * (1 + this.equipment.length * 0.1);
        patient.treatmentProgress += (deltaTime / 1000) * treatmentSpeed * this.speed;
        doctor.energy -= deltaTime * 0.005;
        if (patient.treatmentProgress >= patient.diseaseData.treatmentTime) {
            const successRate = patient.diseaseData.recovery + (doctor.skill * 0.3);
            if (Math.random() * 100 < successRate) {
                this.patientsTreated++;
                this.stats.successful++;
                this.money += patient.insurance ? patient.treatmentCost : patient.treatmentCost * 0.3;
                this.satisfaction = Math.min(100, this.satisfaction + 5);
                this.researchPoints += patient.diseaseData.severity * 5;
            } else {
                if (patient.diseaseData.severity >= 8 && Math.random() < 0.3) {
                    this.patientsDied++;
                    this.stats.failed++;
                    this.satisfaction = Math.max(0, this.satisfaction - 20);
                    this.events.push({ type: 'danger', text: `Patient ${patient.name} died!` });
                } else {
                    this.waitingRoom.push(patient);
                }
            }
            doctor.treating = null;
            return true;
        }
        return false;
    }

    updatePatients(deltaTime) {
        this.emergencyQueue.forEach((patient, i) => {
            const availableDoctor = this.doctors.find(d => !d.treating && d.energy > 20);
            if (availableDoctor) {
                availableDoctor.treating = patient;
                patient.assignedDoctor = availableDoctor;
                const completed = this.treatPatient(patient, availableDoctor, deltaTime);
                if (completed) {
                    this.emergencyQueue.splice(i, 1);
                }
            } else {
                patient.waitingTime += deltaTime;
                patient.health -= deltaTime * 0.01 * patient.severity;
                if (patient.health <= 0) {
                    this.emergencyQueue.splice(i, 1);
                    this.patientsDied++;
                    this.stats.failed++;
                    this.satisfaction = Math.max(0, this.satisfaction - 15);
                    this.events.push({ type: 'danger', text: `Emergency patient ${patient.name} died!` });
                }
            }
        });
        this.waitingRoom.forEach((patient, i) => {
            const availableDoctor = this.doctors.find(d => !d.treating && d.energy > 30);
            if (availableDoctor && this.waitingRoom.length > 10) {
                availableDoctor.treating = patient;
                patient.assignedDoctor = availableDoctor;
                const completed = this.treatPatient(patient, availableDoctor, deltaTime);
                if (completed) {
                    this.waitingRoom.splice(i, 1);
                }
            } else {
                patient.waitingTime += deltaTime;
                patient.health -= deltaTime * 0.005 * patient.severity;
                if (patient.health <= 0) {
                    this.waitingRoom.splice(i, 1);
                    this.patientsDied++;
                    this.stats.failed++;
                    this.satisfaction = Math.max(0, this.satisfaction - 10);
                }
            }
        });
        if (this.events.length > 5) this.events.shift();
    }

    dailyUpdate() {
        this.day++;
        this.hour = 8;
        const payroll = this.doctors.reduce((sum, d) => sum + d.salary, 0) + this.nurses.reduce((sum, n) => sum + n.salary, 0);
        this.money -= payroll + 200;
        this.medication = Math.max(0, this.medication - this.waitingRoom.length * 2);
        if (this.medication <= 10) {
            this.events.push({ type: 'warning', text: 'Medication supplies low!' });
        }
        this.doctors.forEach(d => {
            d.energy = Math.min(100, d.energy + 40);
        });
        this.nurses.forEach(n => {
            n.energy = Math.min(100, n.energy + 40);
        });
        this.reputation = Math.floor((this.satisfaction + this.patientsTreated / 10) / 2);
        this.checkAchievements();
    }

    checkAchievements() {
        if (this.patientsTreated >= 50 && !this.achievements.includes('healer')) {
            this.achievements.push('healer');
        }
        if (this.patientsTreated >= 500 && !this.achievements.includes('master_healer')) {
            this.achievements.push('master_healer');
        }
        if (this.researchPoints >= 1000 && !this.achievements.includes('researcher')) {
            this.achievements.push('researcher');
        }
        if (this.doctors.length >= 10 && !this.achievements.includes('large_staff')) {
            this.achievements.push('large_staff');
        }
        if (this.satisfaction >= 90 && !this.achievements.includes('patient_favorite')) {
            this.achievements.push('patient_favorite');
        }
        if (this.patientsDied < 5 && this.day >= 30 && !this.achievements.includes('safe_hospital')) {
            this.achievements.push('safe_hospital');
        }
    }

    drawTopBar() {
        this.ctx.fillStyle = '#c0392b';
        this.ctx.fillRect(0, 0, this.canvas.width, 80);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Day ${this.day} | ${this.hour}:00`, 20, 25);
        this.ctx.fillText(`$${this.money.toLocaleString()}`, 180, 25);
        this.ctx.fillText(`Reputation: ${this.reputation}`, 350, 25);
        this.ctx.fillText(`Satisfaction: ${this.satisfaction}%`, 500, 25);
        this.ctx.fillText(`Patients: ${this.patientsTreated}`, 680, 25);
        this.ctx.fillText(`Deaths: ${this.patientsDied}`, 820, 25);
        const tabs = ['Main', 'Staff', 'Equipment', 'Research', 'Stats'];
        tabs.forEach((tab, i) => {
            const x = i * (this.canvas.width / tabs.length);
            this.ctx.fillStyle = this.selectedTab === tab.toLowerCase() ? '#922b21' : '#e74c3c';
            this.ctx.fillRect(x, 50, this.canvas.width / tabs.length, 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(tab, x + this.canvas.width / tabs.length / 2, 70);
        });
    }

    drawHospitalLayout() {
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.fillRect(0, 80, this.canvas.width, this.canvas.height - 80);
        this.ctx.fillStyle = '#bdc3c7';
        this.ctx.font = '12px Arial';
        const roomWidth = 120;
        const roomHeight = 80;
        let roomIndex = 0;
        this.rooms.forEach((room, i) => {
            const row = Math.floor(i / 5);
            const col = i % 5;
            const x = 50 + col * (roomWidth + 20);
            const y = 100 + row * (roomHeight + 60);
            this.ctx.fillStyle = room.type === 'emergency' ? '#e74c3c' : room.type === 'icu' ? '#9b59b6' : '#3498db';
            this.ctx.fillRect(x, y, roomWidth, roomHeight);
            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, roomWidth, roomHeight);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(room.name, x + roomWidth / 2, y + 25);
            this.ctx.font = '10px Arial';
            this.ctx.fillText(`Cap: ${room.capacity}`, x + roomWidth / 2, y + 45);
            this.ctx.fillText(`Level: ${room.level}`, x + roomWidth / 2, y + 60);
        });
    }

    drawPatientQueues() {
        const queueX = 700;
        let y = 100;
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(queueX, y - 20, 150, 30);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Emergency Queue', queueX + 75, y);
        y += 20;
        this.emergencyQueue.slice(0, 5).forEach(patient => {
            this.ctx.fillStyle = '#ffeaa7';
            this.ctx.fillRect(queueX, y, 150, 40);
            this.ctx.strokeStyle = '#e74c3c';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(queueX, y, 150, 40);
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.font = '10px Arial';
            this.ctx.fillText(`${patient.name}`, queueX + 75, y + 15);
            this.ctx.fillText(`${patient.disease} - ${patient.urgency}`, queueX + 75, y + 30);
            y += 45;
        });
        y += 30;
        this.ctx.fillStyle = '#3498db';
        this.ctx.fillRect(queueX, y, 150, 30);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText('Waiting Room', queueX + 75, y + 20);
        y += 40;
        this.waitingRoom.slice(0, 8).forEach(patient => {
            this.ctx.fillStyle = '#d5f5e3';
            this.ctx.fillRect(queueX, y, 150, 35);
            this.ctx.strokeStyle = '#3498db';
            this.ctx.strokeRect(queueX, y, 150, 35);
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.font = '10px Arial';
            this.ctx.fillText(`${patient.name}`, queueX + 75, y + 15);
            this.ctx.fillText(`${patient.disease}`, queueX + 75, y + 28);
            y += 38;
        });
    }

    drawMainTab() {
        this.drawHospitalLayout();
        this.drawPatientQueues();
    }

    drawStaffTab() {
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 80, this.canvas.width, this.canvas.height - 80);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Staff Management', this.canvas.width / 2, 110);
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Doctors: ${this.doctors.length} | Nurses: ${this.nurses.length} | Payroll: $${this.doctors.reduce((sum, d) => sum + d.salary, 0) + this.nurses.reduce((sum, n) => sum + n.salary, 0)}/day`, 500, 140);
        this.ctx.fillStyle = '#27ae60';
        this.ctx.fillRect(50, 160, 150, 50);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText('Hire Doctor', 125, 190);
        this.ctx.fillText('($10000)', 125, 205);
        this.ctx.fillStyle = '#16a085';
        this.ctx.fillRect(220, 160, 150, 50);
        this.ctx.fillText('Hire Nurse', 295, 190);
        this.ctx.fillText('($5000)', 295, 205);
        let y = 230;
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Doctors:', 50, y);
        y += 30;
        this.doctors.forEach(doctor => {
            this.ctx.fillStyle = '#3498db';
            this.ctx.fillRect(50, y, 400, 60);
            this.ctx.strokeStyle = '#f1c40f';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(50, y, 400, 60);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText(`${doctor.name} | ${doctor.specialty}`, 60, y + 20);
            this.ctx.fillText(`Skill: ${doctor.skill} | Energy: ${Math.floor(doctor.energy)}%`, 60, y + 35);
            this.ctx.fillText(`Salary: $${doctor.salary}/day | Status: ${doctor.treating ? 'Treating' : 'Available'}`, 60, y + 50);
            y += 65;
        });
        y += 20;
        this.ctx.fillStyle = '#9b59b6';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText('Nurses:', 50, y);
        y += 30;
        this.nurses.forEach(nurse => {
            this.ctx.fillStyle = '#1abc9c';
            this.ctx.fillRect(50, y, 400, 50);
            this.ctx.strokeStyle = '#f1c40f';
            this.ctx.strokeRect(50, y, 400, 50);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`${nurse.name} | Skill: ${nurse.skill} | Energy: ${Math.floor(nurse.energy)}% | Salary: $${nurse.salary}/day`, 60, y + 30);
            y += 55;
        });
    }

    drawEquipmentTab() {
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 80, this.canvas.width, this.canvas.height - 80);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Medical Equipment', this.canvas.width / 2, 110);
        this.equipment.forEach((eq, i) => {
            const x = 100 + (i % 3) * 280;
            const y = 150 + Math.floor(i / 3) * 180;
            this.ctx.fillStyle = '#34495e';
            this.ctx.fillRect(x, y, 250, 160);
            this.ctx.strokeStyle = '#f1c40f';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, 250, 160);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillText(eq.name, x + 125, y + 30);
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`Level: ${eq.level}`, x + 125, y + 60);
            this.ctx.fillText(`Effectiveness: +${eq.effectiveness}%`, x + 125, y + 85);
            this.ctx.fillText(`Cost: $${eq.cost * eq.level}`, x + 125, y + 110);
            this.ctx.fillStyle = '#27ae60';
            this.ctx.fillText('Upgrade', x + 80, y + 140);
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.fillText('Repair', x + 170, y + 140);
        });
    }

    drawResearchTab() {
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 80, this.canvas.width, this.canvas.height - 80);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Research Lab', this.canvas.width / 2, 110);
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Research Points: ${this.researchPoints}`, 500, 140);
        const research = [
            { name: 'New Treatment', cost: 500, effect: 'Improve recovery rate' },
            { name: 'Better Equipment', cost: 800, effect: 'Enhance diagnostic' },
            { name: 'Training Program', cost: 300, effect: 'Boost staff skill' },
            { name: 'Drug Discovery', cost: 1000, effect: 'Unlock new cures' },
            { name: 'Telemedicine', cost: 600, effect: 'See more patients' }
        ];
        research.forEach((r, i) => {
            const y = 170 + i * 70;
            this.ctx.fillStyle = '#16a085';
            this.ctx.fillRect(150, y, 700, 60);
            this.ctx.strokeStyle = '#f1c40f';
            this.ctx.strokeRect(150, y, 700, 60);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(r.name, 170, y + 25);
            this.ctx.font = '12px Arial';
            this.ctx.fillText(r.effect, 170, y + 45);
            this.ctx.fillStyle = '#f1c40f';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`Cost: ${r.cost} RP`, 830, y + 35);
        });
    }

    drawStatsTab() {
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 80, this.canvas.width, this.canvas.height - 80);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Hospital Statistics', this.canvas.width / 2, 110);
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Total Days: ${this.day}`, 200, 160);
        this.ctx.fillText(`Patients Treated: ${this.patientsTreated}`, 200, 190);
        this.ctx.fillText(`Success Rate: ${this.patientsTreated > 0 ? Math.floor((this.stats.successful / this.patientsTreated) * 100) : 0}%`, 200, 220);
        this.ctx.fillText(`Deaths: ${this.patientsDied}`, 200, 250);
        this.ctx.fillText(`Emergency Cases: ${this.stats.emergencies}`, 200, 280);
        this.ctx.fillText(`Current Waiting: ${this.waitingRoom.length}`, 200, 310);
        this.ctx.fillText(`Emergency Queue: ${this.emergencyQueue.length}`, 200, 340);
        this.ctx.fillText(`Medication Stock: ${this.medication}`, 200, 370);
        this.ctx.fillText(`Beds Occupied: ${this.occupiedBeds}/${this.beds}`, 200, 400);
    }

    drawBottomPanel() {
        const panelY = this.canvas.height - 80;
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, panelY, this.canvas.width, 80);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Bed Capacity: ${this.beds} | Medication: ${this.medication}`, 20, panelY + 25);
        this.ctx.fillText(`Research: ${this.researchPoints} pts`, 250, panelY + 25);
        this.ctx.fillText(`Doctors: ${this.doctors.filter(d => d.treating).length}/${this.doctors.length} working`, 400, panelY + 25);
        this.ctx.fillText(`Nurses: ${this.nurses.length}`, 620, panelY + 25);
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
            if (Math.random() < 0.05 * this.speed) {
                this.spawnPatient();
            }
            this.updatePatients(deltaTime);
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawTopBar();
        if (this.selectedTab === 'main') {
            this.drawMainTab();
        } else if (this.selectedTab === 'staff') {
            this.drawStaffTab();
        } else if (this.selectedTab === 'equipment') {
            this.drawEquipmentTab();
        } else if (this.selectedTab === 'research') {
            this.drawResearchTab();
        } else if (this.selectedTab === 'stats') {
            this.drawStatsTab();
        }
        this.drawBottomPanel();
        this.drawEvents();
        if (this.money < -20000 || this.patientsDied > 20) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('HOSPITAL CLOSED', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Too many failures!', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }
        requestAnimationFrame(this.gameLoop);
    }

    destroy() {
        this.canvas.remove();
    }
}

window.HospitalSim = HospitalSim;
