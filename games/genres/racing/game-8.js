// MotoGP Racer - Professional Motorcycle Racing with Lean Mechanics and Lap Times
class MotoGPRacer {
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
      totalLaps: 6,
      maxSpeed: 20,
      acceleration: 0.2,
      braking: 0.4,
      turningSpeed: 0.08,
      leanAngle: 45,
      leanSpeed: 0.15,
      leanRecovery: 0.1,
      cornerSpeed: 0.75,
      wheelieThreshold: 12,
      wheelieBalance: 0.05,
      pitStopTime: 2
    };

    this.gameState = {
      players: {},
      raceTime: 0,
      status: 'countdown',
      lap: 1,
      totalLaps: this.config.totalLaps,
      leaderboard: [],
      fastestLap: Infinity,
      sectorTimes: [],
      tireTemperature: 80,
      brakeTemperature: 70,
      weather: 'dry',
      trackTemperature: 30
    };

    this.track = this.generateMotogpTrack();
    this.bikes = {};
    this.setupMotorcycles();
    this.particles = {
      tireSmoke: [],
      sparks: [],
      rain: []
    };
    this.countdown = { value: 3, timer: 0 };
    this.camera = { x: 0, y: 0, angle: 0 };
    this.weatherEffects = this.generateWeatherEffects();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 1200;
    this.canvas.height = this.canvas.parentElement.clientHeight || 800;
  }

  generateMotogpTrack() {
    const points = [];
    const segments = 22;

    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const radius = Math.min(this.canvas.width, this.canvas.height) * 0.38;

    const trackShape = [
      { r: 1.0, a: 0 }, { r: 1.15, a: 0.4 }, { r: 1.35, a: 0.7 },
      { r: 1.25, a: 1.0 }, { r: 1.0, a: 1.3 }, { r: 0.75, a: 1.7 },
      { r: 0.8, a: 2.0 }, { r: 1.1, a: 2.4 }, { r: 1.3, a: 2.8 },
      { r: 1.2, a: 3.2 }, { r: 0.9, a: 3.6 }, { r: 0.7, a: 4.0 },
      { r: 0.85, a: 4.4 }, { r: 1.1, a: 4.8 }, { r: 1.25, a: 5.2 },
      { r: 1.15, a: 5.6 }, { r: 0.95, a: 6.0 }
    ];

    trackShape.forEach(t => {
      const wobble = Math.sin(t.a * 3) * 15 + Math.cos(t.a * 2) * 10;
      points.push({
        x: cx + Math.cos(t.a) * (radius * t.r + wobble),
        y: cy + Math.sin(t.a) * (radius * t.r + wobble),
        angle: t.a,
        width: 100 + Math.sin(t.a * 2) * 20,
        cornerType: this.getCornerType(t.a),
        elevation: Math.sin(t.a * 2) * 10
      });
    });

    return {
      points: points,
      width: 100,
      startPoint: { x: points[0].x, y: points[0].y + 20, angle: Math.PI },
      checkpoints: points.filter((_, i) => i % 5 === 0)
    };
  }

  getCornerType(angle) {
    const normalized = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    if (normalized < Math.PI / 6 || normalized > Math.PI * 11 / 6) return 'hairpin';
    if (normalized < Math.PI / 3 || normalized > Math.PI * 5 / 3) return 'fast';
    return 'medium';
  }

  generateWeatherEffects() {
    return {
      rainDrops: [],
      windParticles: [],
      sunGlare: []
    };
  }

  setupMotorcycles() {
    const bikeConfigs = [
      { color: '#ff0000', team: 'Ducati', rider: 'Bagnaia' },
      { color: '#0000ff', team: 'Yamaha', rider: 'Quartararo' },
      { color: '#0066cc', team: 'Honda', rider: 'Marquez' },
      { color: '#ff6600', team: 'KTM', rider: 'Miller' },
      { color: '#00cc00', team: 'Suzuki', rider: 'Vinales' },
      { color: '#800080', team: 'Aprilia', rider: 'Espargaro' },
      { color: '#ff00ff', team: 'KTM', rider: 'Binder' },
      { color: '#008800', team: 'Honda', rider: 'Mir' }
    ];

    this.players.forEach((player, index) => {
      const config = bikeConfigs[index % bikeConfigs.length];
      const startPoint = this.track.startPoint;

      this.bikes[player] = {
        name: player,
        team: config.team,
        rider: config.rider,
        color: config.color,
        x: startPoint.x - 30 - index * 25,
        y: startPoint.y + 15 + index * 18,
        angle: startPoint.angle,
        speed: 0,
        maxSpeed: this.config.maxSpeed * (0.92 + Math.random() * 0.16),
        acceleration: this.config.acceleration,
        braking: this.config.braking,
        turningSpeed: this.config.turningSpeed,
        leanAngle: 0,
        targetLean: 0,
        wheelieAngle: 0,
        isWheelie: false,
        wheelieTimer: 0,
        lap: 0,
        currentCheckpoint: 0,
        lapTime: 0,
        bestLap: Infinity,
        lastLapTime: 0,
        sectorTimes: [],
        position: index + 1,
        finished: false,
        finishingTime: 0,
        offTrack: false,
        crash: false,
        crashTimer: 0,
        pitStop: false,
        pitStopTimer: 0,
        tireTemp: 80,
        brakeTemp: 70,
        overtake: false,
        overtakeTimer: 0
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

    this.updateParticles(deltaTime);

    Object.values(this.bikes).forEach(bike => {
      this.updateMotorcycle(bike, deltaTime);
    });

    this.checkOvertakes();
    this.updateLeaderboard();
    this.checkRaceCompletion();
  }

  updateMotorcycle(bike, deltaTime) {
    if (bike.crash) {
      bike.crashTimer -= deltaTime;
      bike.speed *= 0.95;

      if (bike.crashTimer <= 0) {
        bike.crash = false;
        bike.crashTimer = 0;
        bike.leanAngle = 0;
      }
      return;
    }

    if (bike.pitStop) {
      bike.pitStopTimer += deltaTime;
      bike.speed *= 0.9;
      bike.x += Math.cos(bike.angle) * bike.speed * 0.2;
      bike.y += Math.sin(bike.angle) * bike.speed * 0.2;

      if (bike.pitStopTimer >= this.config.pitStopTime) {
        bike.pitStop = false;
        bike.pitStopTimer = 0;
        bike.tireTemp = 80;
      }
      return;
    }

    const input = this.gameState.players[bike.name]?.input || {};
    const joystick = input.joystick || { x: 0, y: 0 };

    if (joystick.y < -0.15) {
      bike.speed += bike.acceleration * Math.abs(joystick.y);
    }

    if (joystick.y > 0.15) {
      bike.speed -= bike.braking * joystick.y;
      bike.brakeTemp += deltaTime * 10;
    } else {
      bike.brakeTemp = Math.max(30, bike.brakeTemp - deltaTime * 3);
    }

    if (input.brake) {
      bike.speed *= 0.97;
    }

    if (Math.abs(joystick.x) > 0.05) {
      bike.targetLean = joystick.x * this.config.leanAngle;
    } else {
      bike.targetLean = 0;
    }

    const leanSpeed = bike.speed / bike.maxSpeed;
    bike.leanAngle += (bike.targetLean - bike.leanAngle) * this.config.leanSpeed * leanSpeed;
    bike.leanAngle *= (1 - this.config.leanRecovery);

    if (Math.abs(joystick.x) > 0.1 && bike.speed > 3) {
      const cornerGrip = this.config.cornerSpeed * (1 - Math.abs(bike.leanAngle) / this.config.leanAngle * 0.3);
      const turnAmount = joystick.x * bike.turningSpeed * cornerGrip * Math.min(1, bike.speed / 8);
      bike.angle += turnAmount;
    }

    bike.speed = Math.max(0, Math.min(bike.maxSpeed, bike.speed));
    bike.speed *= 0.998;

    if (bike.speed > this.config.wheelieThreshold && joystick.y < -0.2) {
      if (!bike.isWheelie) {
        bike.isWheelie = true;
        bike.wheelieTimer = 0;
      }
      bike.wheelieAngle = Math.min(30, bike.wheelieAngle + this.config.wheelieBalance * 10);
    } else {
      bike.isWheelie = false;
      bike.wheelieAngle = Math.max(0, bike.wheelieAngle - this.config.leanRecovery * 2);
    }

    if (bike.isWheelie) {
      bike.wheelieTimer += deltaTime;
    }

    bike.x += Math.cos(bike.angle) * bike.speed;
    bike.y += Math.sin(bike.angle) * bike.speed;

    const trackData = this.getTrackData(bike);
    bike.offTrack = trackData.offTrack;

    if (bike.offTrack && bike.speed > 10) {
      bike.speed *= 0.97;
    }

    bike.tireTemp += bike.speed * deltaTime * 0.05;
    bike.tireTemp = Math.min(120, Math.max(60, bike.tireTemp));

    if (Math.abs(bike.leanAngle) > 40 && bike.speed > 12 && Math.random() < 0.005) {
      this.crashBike(bike);
    }

    if (trackData.cornerType === 'hairpin' && bike.speed > 15) {
      this.createCornerSparks(bike);
    }

    bike.lapTime += deltaTime;
    this.checkCheckpoints(bike);
  }

  getTrackData(bike) {
    let nearestPoint = null;
    let minDist = Infinity;
    let offTrack = false;

    this.track.points.forEach(point => {
      const dist = this.distance(bike.x, bike.y, point.x, point.y);
      if (dist < minDist) {
        minDist = dist;
        nearestPoint = point;
        offTrack = dist > this.track.width / 2;
      }
    });

    return {
      cornerType: nearestPoint?.cornerType || 'medium',
      offTrack: offTrack
    };
  }

  crashBike(bike) {
    bike.crash = true;
    bike.crashTimer = 3;
    bike.speed *= 0.3;
    bike.isWheelie = false;
    bike.wheelieAngle = 0;

    this.createCrashEffect(bike);
  }

  createCrashEffect(bike) {
    for (let i = 0; i < 20; i++) {
      this.particles.sparks.push({
        x: bike.x,
        y: bike.y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 1,
        size: 3 + Math.random() * 5,
        color: '#ff6b35'
      });
    }
  }

  createCornerSparks(bike) {
    if (Math.random() < 0.3) {
      this.particles.sparks.push({
        x: bike.x - Math.cos(bike.angle) * 15,
        y: bike.y - Math.sin(bike.angle) * 15,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 0.3,
        size: 2,
        color: '#ffff00'
      });
    }
  }

  checkOvertakes() {
    const bikeArray = Object.values(this.bikes);

    for (let i = 0; i < bikeArray.length; i++) {
      for (let j = i + 1; j < bikeArray.length; j++) {
        const b1 = bikeArray[i];
        const b2 = bikeArray[j];

        const dist = this.distance(b1.x, b1.y, b2.x, b2.y);

        if (dist < 25) {
          const speedDiff = b1.speed - b2.speed;

          if (speedDiff > 3 && b1.x > b2.x) {
            b1.overtake = true;
            b1.overtakeTimer = 2;
          } else if (speedDiff < -3 && b2.x > b1.x) {
            b2.overtake = true;
            b2.overtakeTimer = 2;
          }
        }
      }
    }

    Object.values(this.bikes).forEach(bike => {
      if (bike.overtakeTimer > 0) {
        bike.overtakeTimer -= 0.016;
      } else {
        bike.overtake = false;
      }
    });
  }

  checkCheckpoints(bike) {
    const nextCheckpoint = (bike.currentCheckpoint + 1) % this.track.checkpoints.length;
    const checkpoint = this.track.checkpoints[nextCheckpoint];
    const dist = this.distance(bike.x, bike.y, checkpoint.x, checkpoint.y);

    if (dist < 50) {
      bike.currentCheckpoint = nextCheckpoint;

      if (nextCheckpoint === 0) {
        this.completeLap(bike);
      }
    }
  }

  completeLap(bike) {
    bike.lap++;
    bike.lastLapTime = bike.lapTime;

    if (bike.lastLapTime < bike.bestLap) {
      bike.bestLap = bike.lastLapTime;
      if (bike.bestLap < this.gameState.fastestLap) {
        this.gameState.fastestLap = bike.bestLap;
      }
    }

    if (bike.lap >= this.config.totalLaps) {
      bike.finished = true;
      bike.finishingTime = this.gameState.raceTime;
    }

    bike.lapTime = 0;
  }

  updateParticles(deltaTime) {
    this.particles.tireSmoke = this.particles.tireSmoke.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime;
      p.size += deltaTime * 8;
      return p.life > 0;
    });

    this.particles.sparks = this.particles.sparks.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life -= deltaTime * 2;
      return p.life > 0;
    });
  }

  updateCamera() {
    const playerBike = this.bikes[this.players[0]];
    if (playerBike) {
      this.camera.x += (playerBike.x - this.camera.x) * 0.1;
      this.camera.y += (playerBike.y - this.camera.y) * 0.1;
    }
  }

  updateLeaderboard() {
    this.gameState.leaderboard = Object.values(this.bikes).sort((a, b) => {
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      if (a.finished && b.finished) return a.finishingTime - b.finishingTime;
      if (a.lap !== b.lap) return b.lap - a.lap;
      if (a.currentCheckpoint !== b.currentCheckpoint) return b.currentCheckpoint - a.currentCheckpoint;
      return this.distanceToNextCheckpoint(a) - this.distanceToNextCheckpoint(b);
    });

    this.gameState.leaderboard.forEach((bike, index) => {
      bike.position = index + 1;
    });
  }

  distanceToNextCheckpoint(bike) {
    const nextCheckpoint = (bike.currentCheckpoint + 1) % this.track.checkpoints.length;
    const checkpoint = this.track.checkpoints[nextCheckpoint];
    return this.distance(bike.x, bike.y, checkpoint.x, checkpoint.y);
  }

  checkRaceCompletion() {
    const allFinished = Object.values(this.bikes).every(bike => bike.finished);
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
    this.drawTrackDetails();
    this.drawParticles();
    this.drawBikes();
    this.drawUI();
    this.drawCountdown();
    this.drawResults();
  }

  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.4, '#E0F7FA');
    gradient.addColorStop(0.6, '#4CAF50');
    gradient.addColorStop(1, '#2E7D32');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 80px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('MotoGP', this.canvas.width / 2, this.canvas.height / 2 - 20);
    this.ctx.font = 'bold 50px Arial';
    this.ctx.fillText('RACER', this.canvas.width / 2, this.canvas.height / 2 + 40);
  }

  drawTrack() {
    this.ctx.save();
    this.ctx.translate(-this.camera.x + this.canvas.width / 2, -this.camera.y + this.canvas.height / 2);

    const points = this.track.points;

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    this.ctx.closePath();

    this.ctx.fillStyle = '#333';
    this.ctx.fill();

    this.ctx.strokeStyle = '#555';
    this.ctx.lineWidth = this.track.width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();

    this.ctx.strokeStyle = '#777';
    this.ctx.lineWidth = this.track.width - 20;
    this.ctx.stroke();

    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([25, 15]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    this.drawStartFinish();

    this.ctx.restore();
  }

  drawStartFinish() {
    const start = this.track.startPoint;
    this.ctx.save();
    this.ctx.translate(start.x, start.y);
    this.ctx.rotate(start.angle);

    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(-15, -40, 30, 80);

    this.ctx.fillStyle = '#000';
    const checkSize = 10;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 8; j++) {
        if ((i + j) % 2 === 0) {
          this.ctx.fillRect(-15 + i * checkSize, -40 + j * checkSize, checkSize, checkSize);
        }
      }
    }

    this.ctx.restore();
  }

  drawTrackDetails() {
    this.ctx.save();
    this.ctx.translate(-this.camera.x + this.canvas.width / 2, -this.camera.y + this.canvas.height / 2);

    this.track.points.forEach((point, index) => {
      if (point.cornerType === 'hairpin') {
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 20, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('T1', point.x, point.y - 25);
      }
    });

    this.ctx.restore();
  }

  drawParticles() {
    this.ctx.save();
    this.ctx.translate(-this.camera.x + this.canvas.width / 2, -this.camera.y + this.canvas.height / 2);

    this.particles.sparks.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.globalAlpha = 1;
    this.ctx.restore();
  }

  drawBikes() {
    Object.values(this.bikes).forEach(bike => {
      this.drawMotorcycle(bike);
    });
  }

  drawMotorcycle(bike) {
    this.ctx.save();
    this.ctx.translate(bike.x, bike.y);
    this.ctx.rotate(bike.angle);

    this.ctx.rotate(bike.leanAngle * Math.PI / 180);

    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(-12, -6, 8, 4);
    this.ctx.fillRect(-12, 2, 8, 4);
    this.ctx.fillRect(8, -6, 8, 4);
    this.ctx.fillRect(8, 2, 8, 4);

    this.ctx.fillStyle = bike.color;
    this.ctx.beginPath();
    this.ctx.moveTo(-15, -5);
    this.ctx.lineTo(10, -5);
    this.ctx.lineTo(15, 0);
    this.ctx.lineTo(10, 5);
    this.ctx.lineTo(-15, 5);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#222';
    this.ctx.fillRect(-18, -8, 12, 4);
    this.ctx.fillRect(-18, 4, 12, 4);

    this.ctx.fillStyle = '#333';
    this.ctx.beginPath();
    this.ctx.arc(-8, -6, 5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(-8, 6, 5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(10, -6, 5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(10, 6, 5, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
    this.ctx.fill();

    if (bike.wheelieAngle > 0) {
      this.ctx.fillStyle = '#ff0000';
      this.ctx.font = 'bold 8px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('!', -5, -10);
    }

    this.ctx.restore();

    this.drawBikeInfo(bike);
  }

  drawBikeInfo(bike) {
    this.ctx.fillStyle = bike.position === 1 ? '#ffd700' : '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(bike.name, bike.x, bike.y - 25);

    this.ctx.fillStyle = '#ccc';
    this.ctx.font = '11px Arial';
    this.ctx.fillText(`Lap ${bike.lap}/${this.config.totalLaps}`, bike.x, bike.y + 25);

    if (bike.overtake) {
      this.ctx.fillStyle = '#00ff00';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.fillText('PASS!', bike.x, bike.y - 35);
    }

    if (bike.crash) {
      this.ctx.fillStyle = '#ff0000';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.fillText('CRASH!', bike.x, bike.y - 35);
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
    this.ctx.fillText(`Lap ${this.gameState.lap}/${this.config.totalLaps}`, 25, 38);
    this.ctx.fillText(this.formatTime(this.gameState.raceTime), 25, 58);

    const playerBike = this.bikes[this.players[0]];
    if (playerBike) {
      this.ctx.fillStyle = '#ccc';
      this.ctx.font = '12px Arial';
      this.ctx.fillText(`Pos: ${playerBike.position}`, 25, 80);
      this.ctx.fillText(`Speed: ${Math.round(playerBike.speed * 18)} km/h`, 25, 100);

      this.ctx.fillStyle = playerBike.tireTemp > 100 ? '#ff4444' : '#4caf50';
      this.ctx.fillText(`Tire: ${Math.round(playerBike.tireTemp)}°C`, 110, 80);

      this.ctx.fillStyle = playerBike.brakeTemp > 90 ? '#ff4444' : '#4caf50';
      this.ctx.fillText(`Brake: ${Math.round(playerBike.brakeTemp)}°C`, 110, 100);
    }

    this.drawLeaderboard();
  }

  drawLeaderboard() {
    const lbWidth = 180;
    const lbHeight = 30 + Math.min(this.players.length, 4) * 22;
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
    this.ctx.font = '12px Arial';

    this.gameState.leaderboard.slice(0, 4).forEach((bike, index) => {
      const y = lbY + 44 + index * 20;
      this.ctx.fillStyle = index === 0 ? '#ffd700' : '#fff';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`${bike.position}. ${bike.name}`, lbX + 10, y);
      this.ctx.textAlign = 'right';
      this.ctx.fillText(bike.bestLap === Infinity ? '--:--' : this.formatTime(bike.bestLap), lbX + lbWidth - 10, y);
      this.ctx.textAlign = 'left';
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

      this.ctx.fillStyle = '#ff0000';
      this.ctx.font = 'bold 50px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('RACE COMPLETE', this.canvas.width / 2, 80);

      this.ctx.fillStyle = '#fff';
      this.ctx.font = '18px Arial';
      this.ctx.fillText(`Fastest Lap: ${this.formatTime(this.gameState.fastestLap)}`, this.canvas.width / 2, 120);

      let yPos = 170;
      this.gameState.leaderboard.slice(0, 4).forEach((bike, index) => {
        const medal = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;

        this.ctx.fillStyle = index === 0 ? '#ffd700' : '#fff';
        this.ctx.font = 'bold 28px Arial';
        this.ctx.fillText(`${medal} ${bike.name}`, this.canvas.width / 2, yPos);

        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Team: ${bike.team} | Best: ${this.formatTime(bike.bestLap)}`, this.canvas.width / 2, yPos + 30);

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

window.MotoGPRacer = MotoGPRacer;