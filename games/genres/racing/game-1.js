// Formula 1 Pro - Realistic F1 Racing with Pit Stops, Tire Management, and Weather
class Formula1Pro {
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
      totalLaps: 5,
      pitStopDuration: 2.5,
      maxSpeed: 18,
      acceleration: 0.12,
      braking: 0.35,
      turningSpeed: 0.065,
      corneringGrip: 0.75,
      tireDegradation: 0.008,
      fuelConsumption: 0.03,
      drsActivation: 1.15,
      ersActivation: 1.3
    };

    this.gameState = {
      players: {},
      raceTime: 0,
      status: 'countdown',
      weather: 'sunny',
      temperature: 25,
      humidity: 45,
      windSpeed: 5,
      rainIntensity: 0,
      safetyCar: false,
      safetyCarPosition: 0,
      flag: 'green',
      leaderboard: [],
      fastestLap: Infinity,
      fastestLapDriver: null
    };

    this.track = this.generateCircuit();
    this.cars = {};
    this.setupGrid();
    this.particles = {
      tireSmoke: [],
      waterSpray: [],
      debris: [],
      confetti: []
    };
    this.countdown = { value: 3, timer: 0 };
    this.camera = { x: 0, y: 0, targetX: 0, targetY: 0, zoom: 1 };
    this.timeOfDay = 0;
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 1200;
    this.canvas.height = this.canvas.parentElement.clientHeight || 800;
  }

  generateCircuit() {
    const points = [];
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const baseRadius = Math.min(this.canvas.width, this.canvas.height) * 0.38;

    const trackShape = [
      { r: 1.0, angle: 0 },
      { r: 1.1, angle: 0.3 },
      { r: 1.3, angle: 0.5 },
      { r: 1.2, angle: 0.7 },
      { r: 0.9, angle: 1.0 },
      { r: 0.7, angle: 1.3 },
      { r: 0.8, angle: 1.6 },
      { r: 1.1, angle: 1.9 },
      { r: 1.3, angle: 2.2 },
      { r: 1.2, angle: 2.5 },
      { r: 1.0, angle: 2.8 },
      { r: 0.85, angle: 3.1 },
      { r: 0.9, angle: 3.4 },
      { r: 1.1, angle: 3.7 },
      { r: 1.25, angle: 4.0 },
      { r: 1.15, angle: 4.3 },
      { r: 1.0, angle: 4.6 },
      { r: 0.8, angle: 4.9 },
      { r: 0.75, angle: 5.2 },
      { r: 0.9, angle: 5.5 },
      { r: 1.05, angle: 5.8 },
      { r: 1.15, angle: 6.0 }
    ];

    for (let i = 0; i < trackShape.length; i++) {
      const t = trackShape[i];
      const wobble = Math.sin(i * 2.5) * 20 + Math.cos(i * 1.7) * 15;
      points.push({
        x: cx + Math.cos(t.angle * Math.PI) * (baseRadius * t.r + wobble),
        y: cy + Math.sin(t.angle * Math.PI) * (baseRadius * t.r + wobble),
        cornerType: i % 3 === 0 ? 'fast' : i % 3 === 1 ? 'medium' : 'slow'
      });
    }

    const checkpoints = points.filter((_, i) => i % 4 === 0);
    const startLine = { x: points[0].x, y: points[0].y, angle: Math.atan2(points[1].y - points[0].y, points[1].x - points[0].x) };

    return {
      points: points,
      checkpoints: checkpoints,
      startLine: startLine,
      width: 180,
      infieldWidth: 250,
      totalLength: this.calculateTrackLength(points)
    };
  }

  calculateTrackLength(points) {
    let length = 0;
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      length += Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    }
    return length;
  }

  setupGrid() {
    const teamColors = [
      { primary: '#dc291e', secondary: '#ffffff', name: 'Ferrari' },
      { primary: '#00d2be', secondary: '#000000', name: 'Mercedes' },
      { primary: '#1e41ff', secondary: '#ffffff', name: 'Red Bull' },
      { primary: '#ff8700', secondary: '#000000', name: 'McLaren' },
      { primary: '#2d5a27', secondary: '#ffffff', name: 'Renault' },
      { primary: '#b06a00', secondary: '#ffffff', name: 'AlphaTauri' },
      { primary: '#5c5c5c', secondary: '#ffffff', name: 'Alpine' },
      { primary: '#9b1b30', secondary: '#ffffff', name: 'Aston Martin' }
    ];

    this.players.forEach((player, index) => {
      const team = teamColors[index % teamColors.length];
      const startOffset = index * 25;
      const gridRow = Math.floor(index / 2);
      const gridCol = index % 2;

      this.cars[player] = {
        name: player,
        team: team.name,
        color: team.primary,
        secondaryColor: team.secondary,
        x: this.track.startLine.x - 20 - gridCol * 40 - gridRow * 60,
        y: this.track.startLine.y + 20 + startOffset,
        angle: this.track.startLine.angle,
        speed: 0,
        velocity: { x: 0, y: 0 },
        maxSpeed: this.config.maxSpeed * (0.95 + Math.random() * 0.1),
        acceleration: this.config.acceleration * (0.95 + Math.random() * 0.1),
        braking: this.config.braking,
        turningSpeed: this.config.turningSpeed,
        corneringGrip: this.config.corneringGrip,
        lap: 0,
        currentCheckpoint: 0,
        lapTime: 0,
        lastLapTime: 0,
        bestLap: Infinity,
        pitStop: false,
        pitStopTimer: 0,
        tireWear: 0,
        tireType: 'medium',
        fuel: 100,
        engineMode: 'normal',
        drsEnabled: false,
        ersEnergy: 50,
        position: index + 1,
        finished: false,
        finishingTime: 0,
        offTrack: false,
        spinout: false,
        spinTimer: 0,
        collisionCooldown: 0,
        speedLoss: 0
      };

      this.gameState.players[player] = { input: {} };
    });
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
    this.timeOfDay += deltaTime * 0.01;

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
      this.updateCamera(deltaTime);
    }

    this.render();
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  update(deltaTime) {
    this.gameState.raceTime += deltaTime;

    this.updateWeather(deltaTime);
    this.updateParticles(deltaTime);

    const activePlayers = Object.values(this.cars).filter(car => !car.finished);

    activePlayers.forEach(car => {
      this.updateCar(car, deltaTime);
    });

    this.checkCollisions();
    this.updateLeaderboard();
    this.checkRaceCompletion();
  }

  updateWeather(deltaTime) {
    if (Math.random() < 0.002) {
      const weatherTypes = ['sunny', 'cloudy', 'rainy', 'stormy'];
      this.gameState.weather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    }

    if (this.gameState.weather === 'rainy' || this.gameState.weather === 'stormy') {
      this.gameState.rainIntensity = this.gameState.weather === 'stormy' ? 0.8 : 0.4;
      this.gameState.temperature -= deltaTime * 2;
    } else {
      this.gameState.rainIntensity = Math.max(0, this.gameState.rainIntensity - deltaTime * 0.1);
    }

    this.gameState.temperature = Math.max(10, Math.min(35, this.gameState.temperature));
  }

  updateCar(car, deltaTime) {
    if (car.spinout) {
      car.spinTimer -= deltaTime;
      car.angle += deltaTime * 8;
      car.speed *= 0.92;
      if (car.spinTimer <= 0) {
        car.spinout = false;
        car.spinTimer = 0;
      }
      return;
    }

    if (car.pitStop) {
      car.pitStopTimer += deltaTime;
      car.speed *= 0.9;
      car.x += Math.cos(car.angle) * car.speed * 0.3;
      car.y += Math.sin(car.angle) * car.speed * 0.3;

      if (car.pitStopTimer >= this.config.pitStopDuration) {
        car.pitStop = false;
        car.pitStopTimer = 0;
        car.tireWear = 0;
        car.fuel = Math.min(100, car.fuel + 40);
        car.tireType = car.tireType === 'soft' ? 'medium' : car.tireType === 'medium' ? 'hard' : 'soft';
      }
      return;
    }

    const input = this.gameState.players[car.name]?.input || {};
    const joystick = input.joystick || { x: 0, y: 0 };

    let acceleration = car.acceleration;

    if (input.nitro && car.ersEnergy > 10) {
      acceleration *= this.config.ersActivation;
      car.ersEnergy = Math.max(0, car.ersEnergy - 0.5);
      this.createErsEffect(car);
    }

    if (car.ersEnergy < 100) {
      car.ersEnergy += deltaTime * 2;
    }

    if (joystick.y < -0.15) {
      car.speed += acceleration * Math.abs(joystick.y);
    }

    if (joystick.y > 0.15) {
      car.speed -= car.braking * joystick.y;
    }

    if (input.brake) {
      car.speed *= 0.96;
    }

    if (Math.abs(joystick.x) > 0.1 && Math.abs(car.speed) > 0.5) {
      const gripMultiplier = this.getGripMultiplier(car);
      const turnAmount = joystick.x * car.turningSpeed * gripMultiplier * Math.min(1, car.speed / 8);
      car.angle += turnAmount;
    }

    car.drsEnabled = input.drs && car.speed > 200;

    const weatherPenalty = this.gameState.rainIntensity > 0.3 ? 0.7 : 1;
    let maxSpeed = car.maxSpeed * weatherPenalty;

    if (car.drsEnabled && !car.offTrack) {
      maxSpeed *= this.config.drsActivation;
    }

    car.speed = Math.max(0, Math.min(maxSpeed - car.speedLoss, car.speed));

    car.velocity.x = Math.cos(car.angle) * car.speed;
    car.velocity.y = Math.sin(car.angle) * car.speed;

    car.x += car.velocity.x;
    car.y += car.velocity.y;

    this.checkTrackPosition(car);

    if (car.offTrack) {
      car.tireWear += deltaTime * this.config.tireDegradation * 2;
      car.speed *= 0.98;
    } else {
      car.tireWear += car.speed * deltaTime * this.config.tireDegradation;
    }

    car.fuel = Math.max(0, car.fuel - car.speed * deltaTime * this.config.fuelConsumption);

    if (car.tireWear > 0.8 || this.gameState.rainIntensity > 0.5) {
      this.createTireSmoke(car);
    }

    if (this.gameState.rainIntensity > 0.3) {
      this.createWaterSpray(car);
    }

    car.lapTime += deltaTime;

    this.checkCheckpoints(car);
  }

  getGripMultiplier(car) {
    let grip = car.corneringGrip;
    grip *= (1 - car.tireWear * 0.3);
    grip *= (1 - this.gameState.rainIntensity * 0.4);
    grip *= this.getTireGrip(car.tireType);
    return grip;
  }

  getTireGrip(tireType) {
    switch (tireType) {
      case 'soft': return 1.2;
      case 'medium': return 1.0;
      case 'hard': return 0.85;
      default: return 1.0;
    }
  }

  checkTrackPosition(car) {
    const trackPoints = this.track.points;
    let minDistance = Infinity;
    let nearestPoint = null;
    let nearestIndex = 0;

    for (let i = 0; i < trackPoints.length; i++) {
      const dist = this.distance(car.x, car.y, trackPoints[i].x, trackPoints[i].y);
      if (dist < minDistance) {
        minDistance = dist;
        nearestPoint = trackPoints[i];
        nearestIndex = i;
      }
    }

    const trackWidthHalf = this.track.width / 2;

    if (minDistance > trackWidthHalf) {
      car.offTrack = true;
      if (minDistance > trackWidthHalf * 2) {
        const angle = Math.atan2(nearestPoint.y - car.y, nearestPoint.x - car.x);
        car.x += Math.cos(angle) * 3;
        car.y += Math.sin(angle) * 3;
      }
    } else {
      car.offTrack = false;
    }
  }

  checkCheckpoints(car) {
    const nextCheckpoint = (car.currentCheckpoint + 1) % this.track.checkpoints.length;
    const checkpoint = this.track.checkpoints[nextCheckpoint];
    const dist = this.distance(car.x, car.y, checkpoint.x, checkpoint.y);

    if (dist < 80) {
      car.currentCheckpoint = nextCheckpoint;

      if (nextCheckpoint === 0) {
        car.lap++;
        car.lastLapTime = car.lapTime;

        if (car.lapTime < car.bestLap) {
          car.bestLap = car.lapTime;
          if (car.lapTime < this.gameState.fastestLap) {
            this.gameState.fastestLap = car.lapTime;
            this.gameState.fastestLapDriver = car.name;
          }
        }

        if (car.lap >= this.config.totalLaps) {
          car.finished = true;
          car.finishingTime = this.gameState.raceTime;
        }

        car.lapTime = 0;
      }
    }
  }

  checkCollisions() {
    const carArray = Object.values(this.cars);

    for (let i = 0; i < carArray.length; i++) {
      for (let j = i + 1; j < carArray.length; j++) {
        const car1 = carArray[i];
        const car2 = carArray[j];

        const dist = this.distance(car1.x, car1.y, car2.x, car2.y);

        if (dist < 35) {
          this.handleCollision(car1, car2);
        }
      }
    }
  }

  handleCollision(car1, car2) {
    if (car1.collisionCooldown > 0 || car2.collisionCooldown > 0) return;

    const angle1 = Math.atan2(car1.y - car2.y, car1.x - car2.x);
    const angle2 = Math.atan2(car2.y - car1.y, car2.x - car1.x);

    car1.speed *= 0.7;
    car2.speed *= 0.7;

    car1.x += Math.cos(angle1) * 5;
    car1.y += Math.sin(angle1) * 5;
    car2.x += Math.cos(angle2) * 5;
    car2.y += Math.sin(angle2) * 5;

    if (Math.random() < 0.3) {
      if (Math.random() < 0.5) {
        car1.spinout = true;
        car1.spinTimer = 1.5;
      } else {
        car2.spinout = true;
        car2.spinTimer = 1.5;
      }
    }

    car1.collisionCooldown = 1;
    car2.collisionCooldown = 1;

    this.createDebris(car1.x, car1.y);
  }

  createTireSmoke(car) {
    this.particles.tireSmoke.push({
      x: car.x - Math.cos(car.angle) * 15,
      y: car.y - Math.sin(car.angle) * 15,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      life: 1,
      decay: 0.8 + Math.random() * 0.4,
      size: 8 + Math.random() * 12,
      color: this.gameState.rainIntensity > 0.3 ? 'rgba(180,180,180,0.6)' : 'rgba(200,200,200,0.5)'
    });
  }

  createWaterSpray(car) {
    this.particles.waterSpray.push({
      x: car.x - Math.cos(car.angle) * 10,
      y: car.y - Math.sin(car.angle) * 10,
      vx: -car.velocity.x * 0.3 + (Math.random() - 0.5) * 4,
      vy: -car.velocity.y * 0.3 + (Math.random() - 0.5) * 4,
      life: 0.5,
      size: 3 + Math.random() * 5
    });
  }

  createDebris(x, y) {
    for (let i = 0; i < 8; i++) {
      this.particles.debris.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 2,
        size: 2 + Math.random() * 4,
        color: ['#ff0000', '#ffffff', '#000000'][Math.floor(Math.random() * 3)]
      });
    }
  }

  createErsEffect(car) {
    this.particles.tireSmoke.push({
      x: car.x - Math.cos(car.angle) * 25,
      y: car.y - Math.sin(car.angle) * 25,
      vx: -car.velocity.x * 0.5,
      vy: -car.velocity.y * 0.5,
      life: 0.3,
      size: 15,
      color: 'rgba(100,200,255,0.6)'
    });
  }

  updateParticles(deltaTime) {
    this.particles.tireSmoke = this.particles.tireSmoke.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime * p.decay;
      p.size += deltaTime * 15;
      return p.life > 0;
    });

    this.particles.waterSpray = this.particles.waterSpray.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime * 3;
      return p.life > 0;
    });

    this.particles.debris = this.particles.debris.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life -= deltaTime;
      return p.life > 0;
    });

    Object.values(this.cars).forEach(car => {
      if (car.collisionCooldown > 0) {
        car.collisionCooldown -= deltaTime;
      }
    });
  }

  updateCamera(deltaTime) {
    const playerCar = this.cars[this.players[0]];
    if (playerCar) {
      this.camera.targetX = playerCar.x;
      this.camera.targetY = playerCar.y;
    }

    this.camera.x += (this.camera.targetX - this.camera.x) * 0.08;
    this.camera.y += (this.camera.targetY - this.camera.y) * 0.08;
  }

  updateLeaderboard() {
    this.gameState.leaderboard = Object.values(this.cars).sort((a, b) => {
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      if (a.finished && b.finished) return a.finishingTime - b.finishingTime;
      if (a.lap !== b.lap) return b.lap - a.lap;
      if (a.currentCheckpoint !== b.currentCheckpoint) return b.currentCheckpoint - a.currentCheckpoint;

      const aDist = this.distanceToNextCheckpoint(a);
      const bDist = this.distanceToNextCheckpoint(b);
      return aDist - bDist;
    });

    this.gameState.leaderboard.forEach((car, index) => {
      car.position = index + 1;
    });
  }

  distanceToNextCheckpoint(car) {
    const nextCheckpoint = (car.currentCheckpoint + 1) % this.track.checkpoints.length;
    const checkpoint = this.track.checkpoints[nextCheckpoint];
    return this.distance(car.x, car.y, checkpoint.x, checkpoint.y);
  }

  checkRaceCompletion() {
    const allFinished = Object.values(this.cars).every(car => car.finished);
    if (allFinished) {
      this.gameState.status = 'finished';
    }
  }

  distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  render() {
    this.drawBackground();
    this.drawTrack();
    this.drawParticles();
    this.drawCars();
    this.drawUI();
    this.drawCountdown();
    this.drawWeatherEffects();

    if (this.gameState.status === 'finished') {
      this.drawResults();
    }
  }

  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, this.getSkyColor());
    gradient.addColorStop(1, '#3d6b3d');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawGrassTexture();
    this.drawBackgroundElements();
  }

  getSkyColor() {
    const time = this.timeOfDay % 24;
    if (time < 6) return '#1a1a2e';
    if (time < 12) return '#87ceeb';
    if (time < 18) return '#add8e6';
    if (time < 22) return '#ff7f50';
    return '#1a1a2e';
  }

  drawGrassTexture() {
    this.ctx.fillStyle = 'rgba(34, 85, 34, 0.3)';
    for (let x = 0; x < this.canvas.width; x += 60) {
      for (let y = 0; y < this.canvas.height; y += 60) {
        if ((x + y) % 120 === 0) {
          this.ctx.fillRect(x, y, 60, 60);
        }
      }
    }
  }

  drawBackgroundElements() {
    this.ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
    this.ctx.font = 'bold 80px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('F1', this.canvas.width / 2, this.canvas.height / 2);
  }

  drawTrack() {
    const trackPoints = this.track.points;

    this.ctx.save();
    this.ctx.translate(-this.camera.x + this.canvas.width / 2, -this.camera.y + this.canvas.height / 2);

    this.ctx.beginPath();
    this.ctx.moveTo(trackPoints[0].x, trackPoints[0].y);
    for (let i = 1; i < trackPoints.length; i++) {
      this.ctx.lineTo(trackPoints[i].x, trackPoints[i].y);
    }
    this.ctx.closePath();

    this.ctx.fillStyle = '#4a4a4a';
    this.ctx.fill();

    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = this.track.width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();

    this.ctx.strokeStyle = this.gameState.rainIntensity > 0.3 ? '#555' : '#888';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([40, 30]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    if (this.gameState.rainIntensity > 0.2) {
      this.ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
      this.ctx.lineWidth = this.track.width - 20;
      this.ctx.stroke();
    }

    this.drawStartFinishLine();

    this.drawCornerMarkers();

    this.ctx.restore();
  }

  drawStartFinishLine() {
    const start = this.track.startLine;
    const width = this.track.width;

    this.ctx.save();
    this.ctx.translate(start.x, start.y);
    this.ctx.rotate(start.angle);

    const checkerSize = width / 10;
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 2; j++) {
        this.ctx.fillStyle = (i + j) % 2 === 0 ? '#fff' : '#000';
        this.ctx.fillRect(-10 + i * checkerSize, -width / 2 + j * checkerSize, checkerSize, checkerSize);
      }
    }

    this.ctx.restore();
  }

  drawCornerMarkers() {
    this.track.points.forEach((point, index) => {
      if (point.cornerType === 'fast') {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 15, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }

  drawParticles() {
    this.ctx.save();
    this.ctx.translate(-this.camera.x + this.canvas.width / 2, -this.camera.y + this.canvas.height / 2);

    this.particles.tireSmoke.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life * 0.6;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.particles.waterSpray.forEach(p => {
      this.ctx.fillStyle = `rgba(150, 180, 220, ${p.life})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.particles.debris.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life;
      this.ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    this.ctx.globalAlpha = 1;
    this.ctx.restore();
  }

  drawCars() {
    Object.values(this.cars).forEach(car => {
      this.ctx.save();
      this.ctx.translate(car.x, car.y);
      this.ctx.rotate(car.angle);

      this.ctx.fillStyle = '#111';
      this.ctx.fillRect(18, -12, 8, 4);
      this.ctx.fillRect(18, 8, 8, 4);
      this.ctx.fillRect(-18, -12, 8, 4);
      this.ctx.fillRect(-18, 8, 8, 4);

      this.ctx.fillStyle = car.color;
      this.ctx.fillRect(-20, -10, 40, 20);

      this.ctx.fillStyle = car.secondaryColor;
      this.ctx.fillRect(-20, -2, 40, 4);

      this.ctx.fillStyle = '#222';
      this.ctx.fillRect(-22, -16, 4, 32);

      this.ctx.fillStyle = car.secondaryColor;
      this.ctx.fillRect(-23, -17, 3, 4);
      this.ctx.fillRect(-23, 13, 3, 4);
      this.ctx.fillRect(-22, -16, 8, 3);
      this.ctx.fillRect(-22, 13, 8, 3);

      this.ctx.fillStyle = 'rgba(200, 220, 255, 0.4)';
      this.ctx.fillRect(-5, -6, 15, 12);

      this.ctx.fillStyle = car.color;
      this.ctx.beginPath();
      this.ctx.arc(8, 0, 4, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();

      this.drawCarInfo(car);
    });
  }

  drawCarInfo(car) {
    this.ctx.fillStyle = car.position === 1 ? '#ffd700' : car.position === 2 ? '#c0c0c0' : car.position === 3 ? '#cd7f32' : '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${car.position}`, car.x, car.y - 28);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '11px Arial';
    this.ctx.fillText(car.name, car.x, car.y + 35);

    const fuelBarWidth = 30;
    const fuelHeight = 4;
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(car.x - fuelBarWidth / 2, car.y + 42, fuelBarWidth, fuelHeight);
    this.ctx.fillStyle = car.fuel > 30 ? '#4caf50' : '#f44336';
    this.ctx.fillRect(car.x - fuelBarWidth / 2, car.y + 42, fuelBarWidth * (car.fuel / 100), fuelHeight);
  }

  drawUI() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    this.ctx.fillRect(15, 15, 180, 130);
    this.ctx.strokeStyle = '#ffd700';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(15, 15, 180, 130);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(this.formatTime(this.gameState.raceTime), 25, 40);

    const playerCar = this.cars[this.players[0]];
    if (playerCar) {
      this.ctx.fillStyle = '#ccc';
      this.ctx.font = '12px Arial';
      this.ctx.fillText(`Lap: ${playerCar.lap}/${this.config.totalLaps}`, 25, 60);
      this.ctx.fillText(`Pos: ${playerCar.position}`, 25, 78);
      this.ctx.fillText(`Best: ${playerCar.bestLap === Infinity ? '--' : this.formatTime(playerCar.bestLap)}`, 25, 96);
      this.ctx.fillText(`Fuel: ${Math.round(playerCar.fuel)}%`, 25, 114);
      this.ctx.fillText(`Tire: ${playerCar.tireType.toUpperCase()}`, 25, 132);
    }

    this.drawLeaderboard();
    this.drawWeatherInfo();
  }

  drawLeaderboard() {
    const lbWidth = 200;
    const lbHeight = 30 + this.players.length * 24;
    const lbX = this.canvas.width - lbWidth - 15;
    const lbY = 15;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    this.ctx.fillRect(lbX, lbY, lbWidth, lbHeight);
    this.ctx.strokeStyle = '#ffd700';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(lbX, lbY, lbWidth, lbHeight);

    this.ctx.fillStyle = '#ffd700';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('LEADERBOARD', lbX + lbWidth / 2, lbY + 22);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';

    this.gameState.leaderboard.forEach((car, index) => {
      const y = lbY + 45 + index * 22;
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${car.position}.`;

      this.ctx.fillStyle = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#fff';
      this.ctx.fillText(medal, lbX + 15, y);
      this.ctx.fillText(car.name, lbX + 45, y);
      this.ctx.textAlign = 'right';
      this.ctx.fillText(car.finished ? this.formatTime(car.finishingTime) : this.formatTime(this.gameState.raceTime), lbX + lbWidth - 15, y);
      this.ctx.textAlign = 'left';
    });
  }

  drawWeatherInfo() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(15, this.canvas.height - 55, 150, 45);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';

    const weatherIcons = { sunny: '☀️', cloudy: '☁️', rainy: '🌧️', stormy: '⛈️' };
    this.ctx.fillText(`${weatherIcons[this.gameState.weather]} ${this.gameState.weather.toUpperCase()}`, 25, this.canvas.height - 35);
    this.ctx.fillText(`Temp: ${Math.round(this.gameState.temperature)}°C`, 25, this.canvas.height - 18);

    if (this.gameState.rainIntensity > 0) {
      this.ctx.fillStyle = '#64b5f6';
      this.ctx.fillText(`Rain: ${Math.round(this.gameState.rainIntensity * 100)}%`, 100, this.canvas.height - 18);
    }
  }

  drawCountdown() {
    if (this.gameState.status === 'countdown' && this.countdown.value >= 0) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.fillStyle = '#ffd700';
      this.ctx.font = 'bold 180px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      const text = this.countdown.value > 0 ? this.countdown.value.toString() : 'GO!';
      const color = this.countdown.value > 0 ? '#ffd700' : '#00ff00';
      this.ctx.fillStyle = color;
      this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);

      this.ctx.textBaseline = 'alphabetic';
    }
  }

  drawWeatherEffects() {
    if (this.gameState.rainIntensity > 0) {
      this.ctx.fillStyle = `rgba(100, 150, 200, ${this.gameState.rainIntensity * 0.3})`;
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * this.canvas.width;
        const y = Math.random() * this.canvas.height;
        this.ctx.fillRect(x, y, 2, 15);
      }
    }
  }

  drawResults() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#ffd700';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('RACE FINISHED', this.canvas.width / 2, 80);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`Fastest Lap: ${this.formatTime(this.gameState.fastestLap)} by ${this.gameState.fastestLapDriver}`, this.canvas.width / 2, 130);

    let yPos = 180;
    this.gameState.leaderboard.forEach((car, index) => {
      const medal = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 4}.`;
      this.ctx.fillStyle = index === 0 ? '#ffd700' : '#fff';
      this.ctx.font = 'bold 28px Arial';
      this.ctx.fillText(`${medal} ${car.name}`, this.canvas.width / 2, yPos);

      this.ctx.font = '16px Arial';
      this.ctx.fillText(`Time: ${this.formatTime(car.finishingTime)} | Best Lap: ${this.formatTime(car.bestLap)}`, this.canvas.width / 2, yPos + 30);

      yPos += 70;
    });
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

window.Formula1Pro = Formula1Pro;