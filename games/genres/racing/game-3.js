// Drag Racing - Street Drag Racing with Nitro, Gear Shifting, and Reaction Times
class DragRacing {
  constructor(canvas, players, gameId) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.players = players;
    this.gameId = gameId;
    this.isRunning = false;
    this.lastTime = 0;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.config = {
      trackLength: 1200,
      gearCount: 5,
      maxRPM: 8000,
      perfectShiftBonus: 1.05,
      nitroDuration: 3,
      nitroBoost: 1.4,
      reactionTimeWeight: 0.3,
      distanceWeight: 0.7
    };

    this.gameState = {
      players: {},
      raceTime: 0,
      status: 'staging',
      round: 1,
      racesInRound: 0,
      winners: [],
      standings: [],
      currentRace: null,
      nitroActive: false,
      finishLinePosition: 0,
      crowds: [],
      judgeCalls: []
    };

    this.track = this.generateTrack();
    this.cars = {};
    this.setupDragCars();
    this.particles = {
      exhaust: [],
      tireSmoke: [],
      nitro: [],
      sparks: []
    };
    this.camera = { x: 0, y: 0 };
    this.countdown = { value: 0, timer: 0, stage: 'ready' };
    this.gamePhase = 'staging';
    this.raceResult = null;
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 1200;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }

  generateTrack() {
    return {
      startX: 100,
      endX: this.config.trackLength + 100,
      startY: this.canvas.height / 2,
      laneWidth: 80,
      totalDistance: this.config.trackLength,
      lanes: [
        { y: this.canvas.height / 2 - 50, name: 'Left' },
        { y: this.canvas.height / 2 + 50, name: 'Right' }
      ],
      finishLine: { x: this.config.trackLength + 100 },
      stagingArea: { startX: 80, endX: 150 }
    };
  }

  setupDragCars() {
    const carConfigs = [
      { name: 'Dodge Charger', color: '#1a1a1a', hp: 707, quarterMile: 10.5 },
      { name: 'Ford Mustang', color: '#ff0000', hp: 720, quarterMile: 10.3 },
      { name: 'Chevrolet Camaro', color: '#0066cc', hp: 650, quarterMile: 10.8 },
      { name: 'Nissan GT-R', color: '#c0c0c0', hp: 600, quarterMile: 10.9 },
      { name: 'Toyota Supra', color: '#ff6600', hp: 700, quarterMile: 10.4 },
      { name: 'Mazda RX-7', color: '#ffffff', hp: 550, quarterMile: 11.2 },
      { name: 'Pontiac GTO', color: '#0000ff', hp: 680, quarterMile: 10.6 },
      { name: 'Plymouth Barracuda', color: '#660066', hp: 640, quarterMile: 10.7 }
    ];

    this.players.forEach((player, index) => {
      const config = carConfigs[index % carConfigs.length];
      const lane = this.track.lanes[index % 2];
      const startX = 120 + (index % 2) * 60;

      this.cars[player] = {
        name: player,
        model: config.name,
        color: config.color,
        hp: config.hp,
        quarterMileBase: config.quarterMile,
        x: startX,
        y: lane.y,
        velocity: 0,
        acceleration: 0,
        rpm: 0,
        gear: 1,
        maxGear: this.config.gearCount,
        speed: 0,
        nitro: 100,
        nitroActive: false,
        nitroTimer: 0,
        reactionTime: 0,
        reactionStart: 0,
        staged: false,
        racing: false,
        finished: false,
        finishTime: 0,
        finishPosition: 0,
        perfectShifts: 0,
        badShifts: 0,
        shiftPoints: 100,
        lightStatus: 'off',
        lane: index % 2,
        wheelSpin: 0,
        clutchReleased: false,
        clutchTimer: 0,
        brakeTimer: 0
      };

      this.gameState.players[player] = { input: {} };
    });

    this.gameState.currentRace = this.players.slice(0, 2);
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameState.status = 'staging';
    this.gamePhase = 'staging';
    this.gameLoop(this.lastTime);
  }

  stop() {
    this.isRunning = false;
  }

  gameLoop(currentTime) {
    if (!this.isRunning) return;

    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.updateCamera();

    this.render();
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  update(deltaTime) {
    this.gameState.raceTime += deltaTime;

    this.updateParticles(deltaTime);
    this.updateTrafficLights();

    if (this.gamePhase === 'staging') {
      this.updateStaging(deltaTime);
    } else if (this.gamePhase === 'countdown') {
      this.updateCountdown(deltaTime);
    } else if (this.gamePhase === 'racing') {
      this.updateRacing(deltaTime);
    } else if (this.gamePhase === 'results') {
      this.updateResults(deltaTime);
    }
  }

  updateStaging(deltaTime) {
    const activeCars = Object.values(this.cars).filter(car => this.gameState.currentRace.includes(car.name));

    activeCars.forEach(car => {
      const input = this.gameState.players[car.name]?.input || {};

      if (input.brake && !car.staged) {
        car.staged = true;
        car.lightStatus = 'staged';
        car.reactionStart = this.gameState.raceTime;
      }

      if (car.staged && !input.brake) {
        car.staged = false;
        car.lightStatus = 'off';
      }

      if (car.staged) {
        car.rpm += deltaTime * 1000;
        car.rpm = Math.min(car.rpm, 3000);
      }
    });

    const allStaged = activeCars.every(car => car.staged);
    if (allStaged && activeCars.length === 2) {
      this.startCountdown();
    }
  }

  updateCountdown(deltaTime) {
    if (this.countdown.stage === 'ready') {
      this.countdown.timer += deltaTime;
      if (this.countdown.timer >= 0.5) {
        this.countdown.stage = 'staging';
        this.countdown.timer = 0;
        this.countdown.value = 3;
      }
    } else if (this.countdown.stage === 'staging') {
      this.countdown.timer += deltaTime;
      if (this.countdown.timer >= 1) {
        this.countdown.timer = 0;
        this.countdown.value--;
        if (this.countdown.value <= 0) {
          this.countdown.stage = 'go';
        }
      }
    } else if (this.countdown.stage === 'go') {
      this.beginRace();
    }
  }

  startCountdown() {
    this.gamePhase = 'countdown';
    this.countdown = { value: 3, timer: 0, stage: 'ready' };
  }

  beginRace() {
    this.gamePhase = 'racing';
    this.gameState.status = 'racing';

    const racers = Object.values(this.cars).filter(car => this.gameState.currentRace.includes(car.name));
    racers.forEach(car => {
      car.racing = true;
      car.reactionTime = this.gameState.raceTime - car.reactionStart;
    });
  }

  updateRacing(deltaTime) {
    const racers = Object.values(this.cars).filter(car => this.gameState.currentRace.includes(car.name));

    racers.forEach(car => {
      this.updateDragCar(car, deltaTime);
    });

    this.updateRaceProgress(racers);

    const finishedCars = racers.filter(car => car.finished);
    if (finishedCars.length === 2) {
      this.finishRace(finishedCars);
    }
  }

  updateDragCar(car, deltaTime) {
    if (car.finished) return;

    const input = this.gameState.players[car.name]?.input || {};
    const joystick = input.joystick || { x: 0, y: 0 };

    if (!car.clutchReleased && input.throttle) {
      car.clutchReleased = true;
    }

    if (car.clutchReleased) {
      const gearRatio = this.getGearRatio(car.gear);
      const enginePower = this.calculateEnginePower(car);
      const gripFactor = 1 - (car.wheelSpin * 0.3);

      car.acceleration = enginePower * gearRatio * gripFactor;

      if (car.nitroActive) {
        car.acceleration *= this.config.nitroBoost;
        car.nitroTimer -= deltaTime;
        if (car.nitroTimer <= 0) {
          car.nitroActive = false;
        }
        this.createNitroEffect(car);
      }

      car.velocity += car.acceleration * deltaTime;
      car.velocity = Math.min(car.velocity, 50 + car.hp / 20);

      if (car.velocity > 5 && Math.random() < 0.1) {
        car.wheelSpin = Math.min(1, car.velocity / 30);
        this.createTireSmoke(car);
      } else {
        car.wheelSpin *= 0.95;
      }

      car.rpm += car.velocity * 50 * gearRatio;
      car.rpm = Math.min(car.rpm, this.config.maxRPM);

      if (input.shiftUp && car.gear < car.maxGear) {
        this.shiftGear(car, 1);
      } else if (input.shiftDown && car.gear > 1) {
        this.shiftGear(car, -1);
      }

      if (input.nitro && car.nitro > 0 && !car.nitroActive) {
        car.nitroActive = true;
        car.nitroTimer = this.config.nitroDuration;
        car.nitro -= 25;
      }

      car.nitro = Math.min(100, car.nitro + deltaTime * 5);

      car.speed = car.velocity * 3.6;
      car.x += car.velocity * deltaTime * 60;

      this.createExhaust(car);
    }

    car.brakeTimer = input.brake ? car.brakeTimer + deltaTime : 0;
  }

  getGearRatio(gear) {
    const ratios = [0, 3.5, 2.5, 1.8, 1.4, 1.1];
    return ratios[gear] || 1;
  }

  calculateEnginePower(car) {
    const basePower = car.hp / 100;
    const rpmFactor = Math.sin((car.rpm / this.config.maxRPM) * Math.PI);
    const gearMultiplier = 1 + (car.gear - 1) * 0.15;
    return basePower * rpmFactor * gearMultiplier * 0.15;
  }

  shiftGear(car, direction) {
    const newGear = car.gear + direction;
    const perfectShiftRange = { min: 7000, max: 7800 };
    const goodShiftRange = { min: 5500, max: 8000 };

    if (car.rpm >= perfectShiftRange.min && car.rpm <= perfectShiftRange.max) {
      car.perfectShifts++;
      car.shiftPoints += 10;
      car.velocity *= this.config.perfectShiftBonus;
    } else if (car.rpm >= goodShiftRange.min) {
      car.badShifts++;
      car.shiftPoints -= 5;
      car.velocity *= 0.95;
    } else {
      car.shiftPoints -= 10;
      car.velocity *= 0.85;
    }

    car.gear = Math.max(1, Math.min(car.maxGear, newGear));
    car.rpm = car.rpm * 0.6;
  }

  updateRaceProgress(racers) {
    racers.forEach(car => {
      if (car.x >= this.track.finishLine.x && !car.finished) {
        car.finished = true;
        car.finishTime = this.gameState.raceTime - 0.5;
        car.finishPosition = racers.filter(c => c.finished).length;
      }
    });
  }

  finishRace(finishedCars) {
    this.gamePhase = 'results';
    this.gameState.status = 'results';

    const sorted = finishedCars.sort((a, b) => a.finishTime - b.finishTime);
    const winner = sorted[0];
    const loser = sorted[1];

    winner.position = 1;
    loser.position = 2;

    this.raceResult = {
      winner: winner,
      loser: loser,
      winnerTime: winner.finishTime,
      loserTime: loser.finishTime,
      delta: loser.finishTime - winner.finishTime
    };

    this.gameState.winners.push(winner.name);
  }

  updateResults(deltaTime) {
    if (this.raceResult && this.gameState.raceTime - this.raceResult.winner.finishTime > 3) {
      this.resetForNextRace();
    }
  }

  resetForNextRace() {
    const nextRacers = this.players.slice(2, 4);
    if (nextRacers.length < 2) {
      this.gameState.status = 'championship_complete';
      return;
    }

    this.gameState.currentRace = nextRacers;
    this.gamePhase = 'staging';
    this.gameState.raceTime = 0;

    Object.values(this.cars).forEach(car => {
      car.x = 120 + car.lane * 60;
      car.velocity = 0;
      car.acceleration = 0;
      car.rpm = 0;
      car.gear = 1;
      car.speed = 0;
      car.nitroActive = false;
      car.nitroTimer = 0;
      car.staged = false;
      car.racing = false;
      car.finished = false;
      car.finishTime = 0;
      car.finishPosition = 0;
      car.clutchReleased = false;
      car.wheelSpin = 0;
      car.lightStatus = 'off';
    });

    this.countdown = { value: 0, timer: 0, stage: 'ready' };
  }

  updateTrafficLights() {
    Object.values(this.cars).forEach(car => {
      if (!this.gameState.currentRace?.includes(car.name)) return;

      if (this.countdown.stage === 'ready') {
        car.lightStatus = 'amber';
      } else if (this.countdown.stage === 'staging') {
        car.lightStatus = this.countdown.value > 0 ? 'amber' : 'red';
      } else if (this.countdown.stage === 'go') {
        car.lightStatus = 'green';
      }
    });
  }

  createExhaust(car) {
    if (car.velocity > 5) {
      this.particles.exhaust.push({
        x: car.x - 30,
        y: car.y + (Math.random() - 0.5) * 10,
        vx: -car.velocity * 0.3,
        vy: (Math.random() - 0.5) * 2,
        life: 0.5,
        size: 3 + Math.random() * 5,
        color: car.nitroActive ? '#ff6600' : '#555'
      });
    }
  }

  createTireSmoke(car) {
    this.particles.tireSmoke.push({
      x: car.x - 20,
      y: car.y + (Math.random() - 0.5) * 20,
      vx: -car.velocity * 0.2,
      vy: (Math.random() - 0.5) * 3,
      life: 0.8,
      size: 10 + Math.random() * 15,
      opacity: car.wheelSpin
    });
  }

  createNitroEffect(car) {
    this.particles.nitro.push({
      x: car.x - 40,
      y: car.y,
      vx: -car.velocity * 0.5,
      vy: (Math.random() - 0.5) * 5,
      life: 0.3,
      size: 20 + Math.random() * 15,
      color: Math.random() < 0.5 ? '#ff4400' : '#ffff00'
    });
  }

  updateParticles(deltaTime) {
    this.particles.exhaust = this.particles.exhaust.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime * 2;
      p.size += deltaTime * 5;
      return p.life > 0;
    });

    this.particles.tireSmoke = this.particles.tireSmoke.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime * 1.2;
      p.size += deltaTime * 10;
      return p.life > 0;
    });

    this.particles.nitro = this.particles.nitro.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime * 4;
      p.size += deltaTime * 20;
      return p.life > 0;
    });
  }

  updateCamera() {
    const racers = Object.values(this.cars).filter(car => this.gameState.currentRace?.includes(car.name));
    if (racers.length > 0) {
      const leadCar = racers.reduce((a, b) => a.x > b.x ? a : b);
      this.camera.x += (leadCar.x - 200 - this.camera.x) * 0.1;
      this.camera.y += (this.canvas.height / 2 - this.camera.y) * 0.05;
    }
  }

  distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  render() {
    this.drawBackground();
    this.drawTrack();
    this.drawTrackDetails();
    this.drawParticles();
    this.drawCars();
    this.drawTrafficLights();
    this.drawUI();
    this.drawResults();
  }

  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#0f0f1a';
    for (let x = 0; x < this.canvas.width; x += 100) {
      for (let y = 0; y < this.canvas.height; y += 50) {
        if ((x + y) % 200 === 0) {
          this.ctx.fillRect(x, y, 50, 25);
        }
      }
    }

    this.drawCrowd();
  }

  drawCrowd() {
    for (let x = 0; x < this.canvas.width; x += 30) {
      const personHeight = 15 + Math.random() * 20;
      const personWidth = 8 + Math.random() * 6;

      this.ctx.fillStyle = `hsl(${Math.random() * 360}, 50%, 40%)`;
      this.ctx.fillRect(x, this.canvas.height - 40 - personHeight, personWidth, personHeight);

      this.ctx.fillStyle = '#ffe4c4';
      this.ctx.beginPath();
      this.ctx.arc(x + personWidth / 2, this.canvas.height - 40 - personHeight - 5, 5, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawTrack() {
    this.ctx.save();
    this.ctx.translate(-this.camera.x + 200, 0);

    this.ctx.fillStyle = '#2d2d2d';
    this.ctx.fillRect(0, 0, this.track.totalDistance + 300, this.canvas.height);

    this.ctx.strokeStyle = '#444';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([40, 20]);
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.canvas.height / 2);
    this.ctx.lineTo(this.track.totalDistance + 200, this.canvas.height / 2);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    this.ctx.strokeStyle = '#ff0000';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 100);
    this.ctx.lineTo(0, this.canvas.height - 100);
    this.ctx.stroke();

    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(this.track.finishLine.x, 80, 10, this.canvas.height - 160);

    this.ctx.fillStyle = '#000';
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 8; j++) {
        if ((i + j) % 2 === 0) {
          this.ctx.fillRect(this.track.finishLine.x, 100 + i * 15, 10, 15);
        }
      }
    }

    this.ctx.fillStyle = '#ffd700';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('FINISH', this.track.finishLine.x + 30, 70);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    for (let d = 200; d <= this.track.totalDistance; d += 200) {
      const distFeet = Math.round(d * 3.28);
      const distMiles = (distFeet / 5280).toFixed(2);
      this.ctx.fillText(`${distFeet}'`, d, 95);
    }

    this.ctx.restore();
  }

  drawTrackDetails() {
    this.ctx.save();
    this.ctx.translate(-this.camera.x + 200, 0);

    this.ctx.fillStyle = '#ffff00';
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('DRAG STRIP', this.canvas.width / 2 + 100, 50);

    this.ctx.restore();
  }

  drawParticles() {
    this.ctx.save();
    this.ctx.translate(-this.camera.x + 200, 0);

    this.particles.exhaust.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life * 0.7;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.particles.tireSmoke.forEach(p => {
      this.ctx.fillStyle = `rgba(150, 150, 150, ${p.life * p.opacity * 0.5})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.particles.nitro.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life * 0.8;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.globalAlpha = 1;
    this.ctx.restore();
  }

  drawCars() {
    const racers = Object.values(this.cars).filter(car => this.gameState.currentRace?.includes(car.name));

    racers.forEach(car => {
      this.drawDragCar(car);
    });
  }

  drawDragCar(car) {
    this.ctx.save();
    this.ctx.translate(car.x, car.y);

    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(-22, -8, 10, 4);
    this.ctx.fillRect(-22, 4, 10, 4);
    this.ctx.fillRect(14, -8, 10, 4);
    this.ctx.fillRect(14, 4, 10, 4);

    this.ctx.fillStyle = car.color;
    this.ctx.beginPath();
    this.ctx.moveTo(-25, -9);
    this.ctx.lineTo(10, -9);
    this.ctx.lineTo(20, -6);
    this.ctx.lineTo(25, -3);
    this.ctx.lineTo(25, 3);
    this.ctx.lineTo(20, 6);
    this.ctx.lineTo(10, 9);
    this.ctx.lineTo(-25, 9);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#222';
    this.ctx.beginPath();
    this.ctx.moveTo(5, -6);
    this.ctx.lineTo(22, 0);
    this.ctx.lineTo(5, 6);
    this.ctx.closePath();
    this.ctx.fill();

    if (car.nitroActive) {
      this.ctx.fillStyle = '#ff6600';
      this.ctx.fillRect(25, -4, 8, 8);
      this.ctx.fillRect(33, -3, 6, 6);
      this.ctx.fillStyle = '#ffff00';
      this.ctx.beginPath();
      this.ctx.arc(38, 0, 4, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();

    this.drawCarHud(car);
  }

  drawCarHud(car) {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(car.x - 40, car.y - 50, 80, 45);

    this.ctx.fillStyle = car.lightStatus === 'green' ? '#00ff00' : car.lightStatus === 'red' ? '#ff0000' : '#ffa500';
    this.ctx.beginPath();
    this.ctx.arc(car.x, car.y - 42, 6, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#00ff00';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${car.speed.toFixed(0)} km/h`, car.x, car.y - 28);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`Gear: ${car.gear}`, car.x - 30, car.y - 15);
    this.ctx.fillText(`RPM: ${Math.round(car.rpm / 100)}`, car.x, car.y - 15);
    this.ctx.fillText(`Nitro: ${Math.round(car.nitro)}%`, car.x + 30, car.y - 15);

    this.ctx.fillStyle = car.position === 1 ? '#ffd700' : '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.fillText(car.name, car.x, car.y + 25);
  }

  drawTrafficLights() {
    this.ctx.save();

    const lightPositions = [
      { x: 80, y: this.track.lanes[0].y - 60 },
      { x: 80, y: this.track.lanes[1].y + 60 }
    ];

    lightPositions.forEach((pos, index) => {
      const car = Object.values(this.cars).find(c => c.lane === index && this.gameState.currentRace?.includes(c.name));
      if (!car) return;

      this.ctx.fillStyle = '#222';
      this.ctx.fillRect(pos.x - 15, pos.y - 25, 30, 50);

      const lightColors = {
        'off': '#333',
        'amber': '#ffa500',
        'red': '#ff0000',
        'green': '#00ff00'
      };

      const colors = ['#ff0000', '#ffa500', '#00ff00'];
      const activeIndex = car.lightStatus === 'green' ? 2 : car.lightStatus === 'red' ? 1 : car.lightStatus === 'amber' ? 1 : -1;

      colors.forEach((color, i) => {
        this.ctx.fillStyle = i <= activeIndex ? color : '#444';
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y - 15 + i * 18, 8, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = i === activeIndex ? color : '#333';
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y - 15 + i * 18, 6, 0, Math.PI * 2);
        this.ctx.fill();
      });
    });

    this.ctx.restore();
  }

  drawUI() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(15, 15, 160, 80);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('DRAG RACING', 25, 35);

    this.ctx.fillStyle = '#ff6600';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText(this.gamePhase.toUpperCase(), 25, 60);

    this.ctx.fillStyle = '#ffd700';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(`Race: ${this.gameState.currentRace?.join(' vs ')}`, 25, 85);

    this.drawInstructions();
  }

  drawInstructions() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(15, this.canvas.height - 90, 200, 75);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '11px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Controls:', 25, this.canvas.height - 70);
    this.ctx.fillText('⬆ Throttle', 25, this.canvas.height - 55);
    this.ctx.fillText('⬇ Brake', 25, this.canvas.height - 40);
    this.ctx.fillText('⬅/➡ Shift', 25, this.canvas.height - 25);
    this.ctx.fillText('SPACE Nitro', 25, this.canvas.height - 10);
  }

  drawResults() {
    if (this.gamePhase === 'results' && this.raceResult) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(this.canvas.width / 2 - 150, this.canvas.height / 2 - 80, 300, 160);

      this.ctx.fillStyle = '#ffd700';
      this.ctx.font = 'bold 30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('RACE RESULTS', this.canvas.width / 2, this.canvas.height / 2 - 50);

      const winner = this.raceResult.winner;
      const loser = this.raceResult.loser;

      this.ctx.fillStyle = '#00ff00';
      this.ctx.font = 'bold 24px Arial';
      this.ctx.fillText(`🏆 ${winner.name}`, this.canvas.width / 2, this.canvas.height / 2 - 10);

      this.ctx.fillStyle = '#fff';
      this.ctx.font = '18px Arial';
      this.ctx.fillText(`Time: ${winner.finishTime.toFixed(3)}s`, this.canvas.width / 2, this.canvas.height / 2 + 20);

      this.ctx.fillStyle = '#ff4444';
      this.ctx.fillText(`${loser.name}: ${loser.finishTime.toFixed(3)}s`, this.canvas.width / 2, this.canvas.height / 2 + 50);

      this.ctx.fillStyle = '#ffa500';
      this.ctx.font = '14px Arial';
      this.ctx.fillText(`Delta: -${this.raceResult.delta.toFixed(3)}s`, this.canvas.width / 2, this.canvas.height / 2 + 70);
    }

    if (this.gameState.status === 'championship_complete') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.fillStyle = '#ffd700';
      this.ctx.font = 'bold 50px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('CHAMPIONSHIP COMPLETE!', this.canvas.width / 2, this.canvas.height / 2 - 30);

      const champion = this.gameState.winners[0];
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '30px Arial';
      this.ctx.fillText(`Champion: ${champion}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
    }
  }

  updatePlayerInput(playerName, input) {
    if (this.gameState.players[playerName]) {
      this.gameState.players[playerName].input = input;
    }
  }
}

window.DragRacing = DragRacing;