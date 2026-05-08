// NASCAR Legends - Oval Stock Car Racing with Pit Strategy, Drafting, and Multi-Lap Strategy
class NASCARLegends {
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
      totalLaps: 50,
      pitStopTime: 3,
      fuelTankSize: 80,
      tireLife: 45,
      draftMultiplier: 1.15,
      maxSpeed: 16,
      acceleration: 0.08,
      braking: 0.25,
      bumpDraftBonus: 1.1,
      cautionLaps: 3
    };

    this.gameState = {
      players: {},
      raceTime: 0,
      status: 'countdown',
      lap: 1,
      totalLaps: this.config.totalLaps,
      leaderboard: [],
      fastestLap: Infinity,
      caution: false,
      cautionLapsRemaining: 0,
      pitWindow: { start: 15, end: 35 },
      fuelHistory: [],
      tireStrategy: {},
      draftZones: [],
      racePosition: 0
    };

    this.track = this.generateOvalTrack();
    this.cars = {};
    this.setupStockCars();
    this.particles = {
      rubber: [],
      smoke: [],
      sparks: [],
      fire: []
    };
    this.countdown = { value: 3, timer: 0 };
    this.camera = { x: 0, y: 0, target: null, offset: { x: 0, y: 0 } };
    this.raceControl = { pitRoadOpen: true, scoringTransponder: {} };
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 1200;
    this.canvas.height = this.canvas.parentElement.clientHeight || 800;
  }

  generateOvalTrack() {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const radiusX = this.canvas.width * 0.4;
    const radiusY = this.canvas.height * 0.3;

    const points = [];
    const segments = 100;

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const variation = Math.sin(angle * 8) * 15;
      points.push({
        x: cx + Math.cos(angle) * (radiusX + variation),
        y: cy + Math.sin(angle) * (radiusY + variation),
        angle: angle,
        banking: Math.abs(Math.sin(angle)) * 25,
        zone: this.getTrackZone(angle)
      });
    }

    const startLine = { x: points[0].x, y: points[0].y, angle: Math.atan2(points[1].y - points[0].y, points[1].x - points[0].x) };

    return {
      points: points,
      startLine: startLine,
      width: 140,
      apronWidth: 80,
      pitLane: this.generatePitLane(cx + radiusX + 80, cy),
      infield: { x: cx, y: cy, radiusX: radiusX * 0.4, radiusY: radiusY * 0.4 }
    };
  }

  getTrackZone(angle) {
    const normalized = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    if (normalized < Math.PI / 4 || normalized > Math.PI * 7 / 4) return 'backstretch';
    if (normalized < Math.PI * 3 / 4) return 'turn1';
    if (normalized < Math.PI * 5 / 4) return 'frontstretch';
    return 'turn2';
  }

  generatePitLane(px, py) {
    return {
      x: px,
      y: py - 60,
      width: 30,
      length: 150,
      entryAngle: 0,
      exitAngle: Math.PI
    };
  }

  setupStockCars() {
    const teamConfigs = [
      { color: '#ff0000', number: '3', team: 'Richard Childress', make: 'Chevrolet' },
      { color: '#0000ff', number: '2', team: 'Penske', make: 'Ford' },
      { color: '#ff6600', number: '4', team: 'Stewart-Haas', make: 'Ford' },
      { color: '#00cc00', number: '11', team: 'Joe Gibbs', make: 'Toyota' },
      { color: '#ffff00', number: '22', team: 'Penske', make: 'Ford' },
      { color: '#ff00ff', number: '10', team: 'Stewart-Haas', make: 'Ford' },
      { color: '#00ffff', number: '48', team: 'Hendrick', make: 'Chevrolet' },
      { color: '#ff9900', number: '24', team: 'Hendrick', make: 'Chevrolet' }
    ];

    this.players.forEach((player, index) => {
      const config = teamConfigs[index % teamConfigs.length];
      const startPos = this.track.startLine;

      this.cars[player] = {
        name: player,
        number: config.number,
        team: config.team,
        make: config.make,
        color: config.color,
        x: startPos.x - 30 - index * 25,
        y: startPos.y + 15 + index * 20,
        angle: startPos.angle,
        speed: 0,
        maxSpeed: this.config.maxSpeed * (0.95 + Math.random() * 0.1),
        acceleration: this.config.acceleration,
        braking: this.config.braking,
        lap: 0,
        currentCheckpoint: 0,
        lapTime: 0,
        bestLap: Infinity,
        lastLapTime: 0,
        position: index + 1,
        finished: false,
        finishingTime: 0,
        pitStop: false,
        pitStopTimer: 0,
        fuel: this.config.fuelTankSize,
        fuelLapsRemaining: 40,
        tireWear: 0,
        tireLifeRemaining: this.config.tireLife,
        pitStrategy: '2stop',
        pitStops: 0,
        inPitLane: false,
        pitProgress: 0,
        draftPosition: null,
        isDrafting: false,
        bumpDraft: false,
        onLeadLap: true,
        lapped: false,
        catchingUp: false,
        caughtUp: false,
        incident: null,
        incidentTimer: 0
      };

      this.gameState.players[player] = { input: {} };
      this.gameState.tireStrategy[player] = { startLap: 1, stintLength: 20, predictedStop: 20 };
    });

    this.calculateDraftZones();
  }

  calculateDraftZones() {
    const zones = [];
    const track = this.track.points;

    for (let i = 0; i < track.length; i += 10) {
      const p = track[i];
      if (p.zone === 'frontstretch' || p.zone === 'backstretch') {
        zones.push({ x: p.x, y: p.y, width: 60, length: 150 });
      }
    }

    this.gameState.draftZones = zones;
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameState.status = 'countdown';
    this.gameLoop(this.lastTime);
  }

  stop() {
    this.isRunning = false;
  }

  gameLoop(currentTime) {
    if (!this.isRunning) return;

    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;

    if (this.gameState.status === 'countdown') {
      this.countdown.timer += deltaTime;
      if (this.countdown.timer >= 1) {
        this.countdown.timer = 0;
        this.countdown.value--;
        if (this.countdown.value < 0) {
          this.gameState.status = 'racing';
        }
      }
    }

    if (this.gameState.status === 'racing') {
      this.update(deltaTime);
      this.updateCamera();
    }

    this.render();
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  update(deltaTime) {
    this.gameState.raceTime += deltaTime;

    if (this.gameState.caution) {
      this.gameState.cautionLapsRemaining -= deltaTime;
      if (this.gameState.cautionLapsRemaining <= 0) {
        this.gameState.caution = false;
        this.gameState.pitRoadOpen = true;
      }
    }

    this.updateParticles(deltaTime);

    const activeCars = Object.values(this.cars).filter(car => !car.finished);

    activeCars.forEach(car => {
      this.updateStockCar(car, deltaTime);
    });

    this.updateDrafting();
    this.updatePitStrategy();
    this.updateLeaderboard();
    this.checkRaceCompletion();
  }

  updateStockCar(car, deltaTime) {
    if (car.incident) {
      car.incidentTimer -= deltaTime;
      car.speed *= 0.95;
      if (car.incidentTimer <= 0) {
        car.incident = null;
        car.incidentTimer = 0;
      }
      return;
    }

    if (car.pitStop) {
      car.pitStopTimer += deltaTime;
      car.speed *= 0.85;
      car.x += Math.cos(car.angle) * car.speed * 0.2;
      car.y += Math.sin(car.angle) * car.speed * 0.2;

      if (car.pitStopTimer >= this.config.pitStopTime) {
        this.completePitStop(car);
      }
      return;
    }

    if (car.inPitLane) {
      this.updatePitLane(car, deltaTime);
      return;
    }

    const input = this.gameState.players[car.name]?.input || {};
    const joystick = input.joystick || { x: 0, y: 0 };

    if (this.gameState.caution) {
      car.speed *= 0.98;
      car.targetSpeed = 8;
    }

    if (joystick.y < -0.15 && !this.gameState.caution) {
      car.speed += car.acceleration * Math.abs(joystick.y);
    }

    if (joystick.y > 0.15) {
      car.speed -= car.braking * joystick.y;
    }

    if (input.brake) {
      car.speed *= 0.96;
    }

    if (Math.abs(joystick.x) > 0.1 && Math.abs(car.speed) > 1) {
      const turnAmount = joystick.x * 0.04 * Math.min(1, car.speed / 8);
      car.angle += turnAmount;
    }

    let maxSpeed = car.maxSpeed;

    if (car.isDrafting) {
      maxSpeed *= this.config.draftMultiplier;
    }

    if (car.bumpDraft) {
      maxSpeed *= this.config.bumpDraftBonus;
    }

    const trackData = this.getTrackData(car);
    if (trackData.banking > 15) {
      maxSpeed *= 1.1;
    }

    const tirePenalty = 1 - (car.tireWear * 0.4);
    maxSpeed *= tirePenalty;

    car.speed = Math.max(2, Math.min(maxSpeed, car.speed));

    car.x += Math.cos(car.angle) * car.speed;
    car.y += Math.sin(car.angle) * car.speed;

    this.checkTrackBoundaries(car);
    this.updateCarPhysics(car, deltaTime);
    this.checkCheckpoints(car);

    if (car.speed > 10 && car.tireWear > 0.5) {
      this.createTireSmoke(car);
    }
  }

  getTrackData(car) {
    let nearestPoint = null;
    let minDist = Infinity;

    for (const point of this.track.points) {
      const dist = this.distance(car.x, car.y, point.x, point.y);
      if (dist < minDist) {
        minDist = dist;
        nearestPoint = point;
      }
    }

    return nearestPoint || { banking: 10, zone: 'frontstretch' };
  }

  checkTrackBoundaries(car) {
    let onTrack = false;
    let minDist = Infinity;

    for (const point of this.track.points) {
      const dist = this.distance(car.x, car.y, point.x, point.y);
      if (dist < minDist) minDist = dist;

      if (dist < this.track.width / 2) {
        onTrack = true;
      }
    }

    if (!onTrack && minDist > this.track.width) {
      car.speed *= 0.95;
    }
  }

  updateCarPhysics(car, deltaTime) {
    car.fuel = Math.max(0, car.fuel - car.speed * deltaTime * 0.01);

    if (car.fuel < 15 && !car.pitStop) {
      this.suggestPitStop(car);
    }

    car.tireWear = car.speed * deltaTime * 0.008;

    car.lapTime += deltaTime;

    if (car.fuel <= 0 || car.tireWear >= 1) {
      car.incident = 'debris';
      car.incidentTimer = 2;
    }
  }

  checkCheckpoints(car) {
    const nextCheckpoint = (car.currentCheckpoint + 1) % this.track.points.length;
    const checkpoint = this.track.points[nextCheckpoint];
    const dist = this.distance(car.x, car.y, checkpoint.x, checkpoint.y);

    if (dist < 60) {
      car.currentCheckpoint = nextCheckpoint;

      if (nextCheckpoint === 0) {
        this.completeLap(car);
      }
    }
  }

  completeLap(car) {
    car.lap++;
    car.lastLapTime = car.lapTime;

    if (car.lastLapTime < car.bestLap) {
      car.bestLap = car.lastLapTime;
      if (car.lastLapTime < this.gameState.fastestLap) {
        this.gameState.fastestLap = car.lastLapTime;
      }
    }

    if (car.lap >= this.config.totalLaps) {
      car.finished = true;
      car.finishingTime = this.gameState.raceTime;
    }

    car.lapTime = 0;
    car.onLeadLap = car.position <= 4;
  }

  suggestPitStop(car) {
    const strategy = this.gameState.tireStrategy[car.name];

    if (car.lap >= strategy.predictedStop && !car.pitStop && car.fuel > 20) {
      car.pitStrategy = '2stop';
      strategy.predictedStop = car.lap + 20;
    }

    if (car.tireWear > 0.7) {
      this.enterPitLane(car);
    }
  }

  enterPitLane(car) {
    car.inPitLane = true;
    car.pitProgress = 0;
    car.pitStop = false;
    this.gameState.pitRoadOpen = false;
  }

  updatePitLane(car, deltaTime) {
    const pitLane = this.track.pitLane;
    car.pitProgress += deltaTime * 30;

    car.x = pitLane.x;
    car.y = pitLane.y + car.pitProgress;

    if (car.pitProgress > 100 && !car.pitStop) {
      car.pitStop = true;
      car.pitStopTimer = 0;
    }

    if (car.pitProgress >= pitLane.length) {
      this.exitPitLane(car);
    }
  }

  exitPitLane(car) {
    car.inPitLane = false;
    car.pitStop = false;
    car.pitStops++;
    car.fuel = this.config.fuelTankSize;
    car.tireWear = 0;
    car.tireLifeRemaining = this.config.tireLife;
    car.pitProgress = 0;
    this.gameState.pitRoadOpen = true;
  }

  completePitStop(car) {
    car.pitStop = false;
    car.pitStopTimer = 0;
  }

  updateDrafting() {
    const carArray = Object.values(this.cars).filter(car => !car.finished);

    for (let i = 0; i < carArray.length; i++) {
      const car = carArray[i];
      car.isDrafting = false;
      car.bumpDraft = false;

      for (let j = 0; j < carArray.length; j++) {
        if (i === j) continue;

        const other = carArray[j];
        const dist = this.distance(car.x, car.y, other.x, other.y);

        if (dist < 50) {
          const inDraftZone = this.isInDraftZone(car);

          if (inDraftZone && other.position < car.position) {
            car.isDrafting = true;
            car.draftPosition = other.name;

            if (dist < 25 && Math.abs(car.speed - other.speed) < 2) {
              car.bumpDraft = true;
            }
          }
        }
      }
    }
  }

  isInDraftZone(car) {
    return this.gameState.draftZones.some(zone => {
      return this.distance(car.x, car.y, zone.x, zone.y) < zone.width;
    });
  }

  updatePitStrategy() {
    const strategy = this.gameState.tireStrategy;

    Object.keys(strategy).forEach(player => {
      const car = this.cars[player];
      if (!car || car.finished) return;

      const currentStrategy = strategy[player];
      const remainingLaps = this.config.totalLaps - car.lap;
      const fuelLaps = car.fuel / (car.speed * 0.01);
      const tireLaps = (1 - car.tireWear) * this.config.tireLife;

      if (fuelLaps < 10 || tireLaps < 15) {
        this.enterPitLane(car);
      }
    });
  }

  updateLeaderboard() {
    this.gameState.leaderboard = Object.values(this.cars).sort((a, b) => {
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      if (a.finished && b.finished) return a.finishingTime - b.finishingTime;
      if (a.lap !== b.lap) return b.lap - a.lap;
      if (a.currentCheckpoint !== b.currentCheckpoint) return b.currentCheckpoint - a.currentCheckpoint;
      return this.distanceToNextCheckpoint(a) - this.distanceToNextCheckpoint(b);
    });

    this.gameState.leaderboard.forEach((car, index) => {
      car.position = index + 1;
    });
  }

  distanceToNextCheckpoint(car) {
    const nextCheckpoint = (car.currentCheckpoint + 1) % this.track.points.length;
    const checkpoint = this.track.points[nextCheckpoint];
    return this.distance(car.x, car.y, checkpoint.x, checkpoint.y);
  }

  checkRaceCompletion() {
    const allFinished = Object.values(this.cars).every(car => car.finished);
    if (allFinished) {
      this.gameState.status = 'finished';
    }
  }

  createTireSmoke(car) {
    this.particles.smoke.push({
      x: car.x - Math.cos(car.angle) * 15,
      y: car.y - Math.sin(car.angle) * 15,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 0.8,
      size: 10 + Math.random() * 10
    });
  }

  updateParticles(deltaTime) {
    this.particles.smoke = this.particles.smoke.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime;
      p.size += deltaTime * 8;
      return p.life > 0;
    });
  }

  updateCamera() {
    const playerCar = this.cars[this.players[0]];
    if (playerCar) {
      this.camera.target = playerCar;
      this.camera.x += (playerCar.x - this.camera.x) * 0.06;
      this.camera.y += (playerCar.y - this.camera.y) * 0.06;
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
    this.drawUI();
    this.drawCountdown();
    this.drawResults();
  }

  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1a472a');
    gradient.addColorStop(1, '#2d5a27');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#228b22';
    for (let x = 0; x < this.canvas.width; x += 30) {
      for (let y = 0; y < this.canvas.height; y += 30) {
        if ((x + y) % 60 === 0) {
          this.ctx.fillRect(x, y, 15, 15);
        }
      }
    }

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 120px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('NASCAR', this.canvas.width / 2, this.canvas.height / 2 + 40);
    this.ctx.font = 'bold 60px Arial';
    this.ctx.fillText('LEGENDS', this.canvas.width / 2, this.canvas.height / 2 + 100);
  }

  drawTrack() {
    this.ctx.save();
    this.ctx.translate(-this.camera.x + this.canvas.width / 2, -this.camera.y + this.canvas.height / 2);

    const track = this.track.points;

    this.ctx.beginPath();
    this.ctx.moveTo(track[0].x, track[0].y);
    for (let i = 1; i < track.length; i++) {
      this.ctx.lineTo(track[i].x, track[i].y);
    }
    this.ctx.closePath();

    this.ctx.fillStyle = '#333';
    this.ctx.fill();

    this.ctx.strokeStyle = '#555';
    this.ctx.lineWidth = this.track.width + 20;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();

    this.ctx.strokeStyle = '#444';
    this.ctx.lineWidth = this.track.width;
    this.ctx.stroke();

    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([30, 20]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    this.ctx.fillStyle = '#666';
    this.ctx.fillRect(this.track.pitLane.x - 5, this.track.pitLane.y - 10, 20, this.track.pitLane.length + 20);

    this.ctx.fillStyle = '#333';
    for (let i = 0; i < this.track.pitLane.length; i += 15) {
      this.ctx.fillRect(this.track.pitLane.x - 5, this.track.pitLane.y + i, 20, 10);
    }

    this.drawStartFinishLine();

    this.ctx.restore();
  }

  drawStartFinishLine() {
    const start = this.track.startLine;
    this.ctx.save();
    this.ctx.translate(start.x, start.y);
    this.ctx.rotate(start.angle);

    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(-15, -this.track.width / 2, 30, this.track.width);

    const checkerSize = this.track.width / 10;
    this.ctx.fillStyle = '#000';
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 2; j++) {
        if ((i + j) % 2 === 0) {
          this.ctx.fillRect(-15 + i * checkerSize, -this.track.width / 2 + j * checkerSize, checkerSize, checkerSize);
        }
      }
    }

    this.ctx.restore();
  }

  drawTrackDetails() {
    this.ctx.save();
    this.ctx.translate(-this.camera.x + this.canvas.width / 2, -this.camera.y + this.canvas.height / 2);

    this.ctx.fillStyle = '#ffd700';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PIT ROAD', this.track.pitLane.x + 15, this.track.pitLane.y - 20);

    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillText('PIT ENTRY', this.track.pitLane.x + 15, this.track.pitLane.y);
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fillText('PIT EXIT', this.track.pitLane.x + 15, this.track.pitLane.y + this.track.pitLane.length);

    this.ctx.restore();
  }

  drawParticles() {
    this.ctx.save();
    this.ctx.translate(-this.camera.x + this.canvas.width / 2, -this.camera.y + this.canvas.height / 2);

    this.particles.smoke.forEach(p => {
      this.ctx.fillStyle = `rgba(150, 150, 150, ${p.life * 0.5})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.restore();
  }

  drawCars() {
    Object.values(this.cars).forEach(car => {
      this.drawStockCar(car);
    });
  }

  drawStockCar(car) {
    this.ctx.save();
    this.ctx.translate(car.x, car.y);
    this.ctx.rotate(car.angle);

    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(-20, -10, 8, 4);
    this.ctx.fillRect(-20, 6, 8, 4);
    this.ctx.fillRect(12, -10, 8, 4);
    this.ctx.fillRect(12, 6, 8, 4);

    this.ctx.fillStyle = car.color;
    this.ctx.fillRect(-22, -10, 44, 20);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(car.number, 0, 5);

    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(-23, -8, 12, 4);
    this.ctx.fillRect(-23, 4, 12, 4);

    this.ctx.restore();

    this.drawCarInfo(car);
  }

  drawCarInfo(car) {
    this.ctx.fillStyle = car.position === 1 ? '#ffd700' : '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(car.name, car.x, car.y - 25);

    this.ctx.fillStyle = '#aaa';
    this.ctx.font = '11px Arial';
    this.ctx.fillText(`Lap: ${car.lap}`, car.x, car.y + 28);

    if (car.isDrafting) {
      this.ctx.fillStyle = '#00ff00';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.fillText('DRAFTING', car.x, car.y - 35);
    }
  }

  drawUI() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(15, 15, 170, 110);
    this.ctx.strokeStyle = '#ff0000';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(15, 15, 170, 110);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Lap ${this.gameState.lap}/${this.config.totalLaps}`, 25, 35);
    this.ctx.fillText(this.formatTime(this.gameState.raceTime), 25, 55);

    const playerCar = this.cars[this.players[0]];
    if (playerCar) {
      this.ctx.fillStyle = '#ccc';
      this.ctx.font = '12px Arial';
      this.ctx.fillText(`Pos: ${playerCar.position}`, 25, 80);
      this.ctx.fillText(`Fuel: ${Math.round(playerCar.fuel / this.config.fuelTankSize * 100)}%`, 25, 100);
      this.ctx.fillText(`Tire: ${Math.round((1 - playerCar.tireWear) * 100)}%`, 100, 100);
    }

    if (this.gameState.caution) {
      this.ctx.fillStyle = 'rgba(255, 165, 0, 0.9)';
      this.ctx.fillRect(this.canvas.width / 2 - 80, 15, 160, 40);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 20px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('⚠ CAUTION ⚠', this.canvas.width / 2, 42);
    }

    this.drawLeaderboard();
  }

  drawLeaderboard() {
    const lbWidth = 180;
    const lbHeight = 30 + Math.min(this.players.length, 4) * 20;
    const lbX = this.canvas.width - lbWidth - 15;
    const lbY = 15;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(lbX, lbY, lbWidth, lbHeight);
    this.ctx.strokeStyle = '#ff0000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(lbX, lbY, lbWidth, lbHeight);

    this.ctx.fillStyle = '#ff0000';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('STANDINGS', lbX + lbWidth / 2, lbY + 22);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '11px Arial';

    this.gameState.leaderboard.slice(0, 4).forEach((car, index) => {
      const y = lbY + 42 + index * 18;
      this.ctx.fillStyle = index === 0 ? '#ffd700' : '#fff';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`${car.position}. ${car.name}`, lbX + 10, y);
    });
  }

  drawCountdown() {
    if (this.gameState.status === 'countdown' && this.countdown.value >= 0) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.fillStyle = '#ff0000';
      this.ctx.font = 'bold 180px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      const text = this.countdown.value > 0 ? this.countdown.value.toString() : 'GO!';
      this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);

      this.ctx.textBaseline = 'alphabetic';
    }
  }

  drawResults() {
    if (this.gameState.status === 'finished') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.fillStyle = '#ffd700';
      this.ctx.font = 'bold 50px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('RACE COMPLETE', this.canvas.width / 2, 80);

      this.ctx.fillStyle = '#fff';
      this.ctx.font = '18px Arial';
      this.ctx.fillText(`Fastest Lap: ${this.formatTime(this.gameState.fastestLap)}`, this.canvas.width / 2, 120);

      let yPos = 170;
      this.gameState.leaderboard.slice(0, 4).forEach((car, index) => {
        const medal = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;

        this.ctx.fillStyle = index === 0 ? '#ffd700' : '#fff';
        this.ctx.font = 'bold 28px Arial';
        this.ctx.fillText(`${medal} ${car.name}`, this.canvas.width / 2, yPos);

        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Time: ${this.formatTime(car.finishingTime)} | Stops: ${car.pitStops}`, this.canvas.width / 2, yPos + 30);

        yPos += 70;
      });
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  updatePlayerInput(playerName, input) {
    if (this.gameState.players[playerName]) {
      this.gameState.players[playerName].input = input;
    }
  }
}

window.NASCARLegends = NASCARLegends;