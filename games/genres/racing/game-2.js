// Rally Championship - Dirt Track Racing with Co-Driver System, Stages, and Weather
class RallyChampionship {
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
      stages: 3,
      stageLength: 800,
      maxSpeed: 14,
      acceleration: 0.18,
      braking: 0.4,
      turningSpeed: 0.075,
      handbrakeTurn: 0.15,
      surfaceGrip: 0.65,
      jumpForce: 0.3
    };

    this.gameState = {
      players: {},
      totalTime: 0,
      currentStage: 1,
      stageTime: 0,
      status: 'countdown',
      weather: 'dry',
      surfaceCondition: 1.0,
      stageTimes: {},
      totalTimes: {},
      leaderboard: [],
      checkpoints: [],
      stageComplete: false,
      rallyComplete: false,
      currentCheckpoint: 0,
      stageLength: 0,
      distanceTraveled: 0
    };

    this.track = this.generateStage();
    this.cars = {};
    this.setupRallyCars();
    this.particles = {
      dust: [],
      mud: [],
      sparks: [],
      rain: []
    };
    this.countdown = { value: 3, timer: 0 };
    this.terrainEffects = this.generateTerrainEffects();
    this.camera = { x: 0, y: 0 };
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 1200;
    this.canvas.height = this.canvas.parentElement.clientHeight || 800;
  }

  generateStage() {
    const points = [];
    const length = 60;

    let x = 100;
    let y = this.canvas.height / 2;
    let angle = 0;

    for (let i = 0; i < length; i++) {
      const curveIntensity = Math.sin(i * 0.15) * Math.cos(i * 0.1);
      const hillIntensity = Math.sin(i * 0.2) * 30;

      angle += curveIntensity * 0.08;

      x += Math.cos(angle) * 40;
      y += Math.sin(angle) * 40 + Math.sin(i * 0.3) * 5;

      y = Math.max(100, Math.min(this.canvas.height - 100, y));

      points.push({
        x: x,
        y: y,
        angle: angle,
        width: 120 + Math.sin(i * 0.2) * 30,
        elevation: hillIntensity,
        surface: i % 5 < 2 ? 'gravel' : i % 5 < 4 ? 'dirt' : 'mud',
        hazard: i % 15 === 0,
        jump: i % 25 === 0
      });
    }

    const checkpoints = points.filter((_, i) => i % 10 === 0);

    return {
      points: points,
      checkpoints: checkpoints,
      startPoint: { x: points[0].x, y: points[0].y, angle: points[0].angle },
      width: 120,
      totalLength: length * 40
    };
  }

  generateTerrainEffects() {
    const effects = [];
    for (let i = 0; i < 50; i++) {
      effects.push({
        x: Math.random() * 2000,
        y: Math.random() * this.canvas.height,
        type: Math.random() < 0.3 ? 'rock' : Math.random() < 0.6 ? 'bump' : 'puddle',
        size: 5 + Math.random() * 15
      });
    }
    return effects;
  }

  setupRallyCars() {
    const carConfigs = [
      { color: '#e63946', model: 'Subaru WRX', driver: ' Sébastien Loeb' },
      { color: '#2a9d8f', model: 'Ford Fiesta', driver: ' Sébastien Ogier' },
      { color: '#f4a261', model: 'Toyota Yaris', driver: ' Kalle Rovanperä' },
      { color: '#264653', model: 'Hyundai i20', driver: ' Thierry Neuville' },
      { color: '#e9c46a', model: 'Citroën C3', driver: ' Ott Tänak' },
      { color: '#8d99ae', model: 'Volkswagen Polo', driver: ' Sébastien Loeb' },
      { color: '#d62828', model: 'Mini Countryman', driver: ' Dani Sordo' },
      { color: '#003049', model: 'Toyota Corolla', driver: ' Elfyn Evans' }
    ];

    this.players.forEach((player, index) => {
      const config = carConfigs[index % carConfigs.length];
      const startPos = this.track.startPoint;

      this.cars[player] = {
        name: player,
        model: config.model,
        color: config.color,
        driver: config.driver,
        x: startPos.x - 50 - index * 40,
        y: startPos.y + 20 + index * 25,
        angle: startPos.angle,
        speed: 0,
        maxSpeed: this.config.maxSpeed * (0.92 + Math.random() * 0.16),
        acceleration: this.config.acceleration,
        braking: this.config.braking,
        turningSpeed: this.config.turningSpeed,
        stage: 1,
        stageTime: 0,
        totalTime: 0,
        checkpointsPassed: 0,
        currentCheckpoint: 0,
        airborne: false,
        airborneTime: 0,
        landingAngle: 0,
        handbrake: false,
        spin: 0,
        spinTimer: 0,
        damage: 0,
        offTrack: false,
        stageFinished: false,
        stageFinishTime: 0,
        bestStage: Infinity,
        position: index + 1,
        finishOrder: 0,
        codriverMessage: '',
        codriverTimer: 0
      };

      this.gameState.players[player] = { input: {} };
      this.gameState.stageTimes[player] = [];
      this.gameState.totalTimes[player] = 0;
    });

    this.gameState.stageLength = this.track.totalLength;
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
    this.gameState.totalTime += deltaTime;
    this.gameState.stageTime += deltaTime;

    this.updateWeather(deltaTime);
    this.updateParticles(deltaTime);

    const activeCars = Object.values(this.cars).filter(car => !car.stageFinished);

    activeCars.forEach(car => {
      this.updateCar(car, deltaTime);
    });

    this.updateCoDriverMessages();
    this.updateLeaderboard();
    this.checkStageCompletion();
  }

  updateWeather(deltaTime) {
    if (Math.random() < 0.005) {
      const weathers = ['dry', 'light_rain', 'heavy_rain', 'fog'];
      this.gameState.weather = weathers[Math.floor(Math.random() * weathers.length)];
    }

    switch (this.gameState.weather) {
      case 'light_rain':
        this.gameState.surfaceCondition = 0.8;
        break;
      case 'heavy_rain':
        this.gameState.surfaceCondition = 0.6;
        break;
      case 'fog':
        this.gameState.surfaceCondition = 0.9;
        break;
      default:
        this.gameState.surfaceCondition = Math.min(1, this.gameState.surfaceCondition + deltaTime * 0.1);
    }
  }

  updateCar(car, deltaTime) {
    const input = this.gameState.players[car.name]?.input || {};
    const joystick = input.joystick || { x: 0, y: 0 };

    if (car.spinTimer > 0) {
      car.spinTimer -= deltaTime;
      car.angle += car.spin * deltaTime * 5;
      car.speed *= 0.92;
      return;
    }

    let acceleration = car.acceleration;
    const surfaceGrip = this.getSurfaceGrip(car);

    if (car.airborne) {
      car.airborneTime += deltaTime;
      car.landingAngle = car.angle;

      if (joystick.y > 0.3) {
        car.speed += acceleration * 0.5;
      }

      car.x += Math.cos(car.angle) * car.speed;
      car.y += Math.sin(car.angle) * car.speed;

      if (car.airborneTime > 0.8 || this.getTrackHeight(car) <= 0) {
        car.airborne = false;
        car.airborneTime = 0;
        car.speed *= 0.6;
        if (car.landingAngle !== car.angle) {
          this.createLandingEffect(car);
        }
      }
      return;
    }

    const trackData = this.getTrackData(car);

    if (trackData.jump && car.speed > 10) {
      car.airborne = true;
      car.airborneTime = 0;
      car.speed += this.config.jumpForce * car.speed;
      this.createJumpEffect(car);
    }

    if (trackData.surface === 'gravel') {
      acceleration *= 1.1;
    } else if (trackData.surface === 'mud') {
      acceleration *= 0.7;
    }

    if (joystick.y < -0.15) {
      car.speed += acceleration * Math.abs(joystick.y) * surfaceGrip;
    }

    if (joystick.y > 0.15) {
      car.speed -= car.braking * joystick.y;
    }

    if (input.handbrake || input.brake) {
      car.handbrake = true;
      car.speed *= 0.97;
      this.createDustParticles(car);
    } else {
      car.handbrake = false;
    }

    if (Math.abs(joystick.x) > 0.1 && Math.abs(car.speed) > 0.3) {
      const turnMultiplier = car.handbrake ? this.config.handbrakeTurn : 1;
      const turnAmount = joystick.x * car.turningSpeed * turnMultiplier * surfaceGrip * Math.min(1, car.speed / 6);
      car.angle += turnAmount;
    }

    car.speed = Math.max(0, Math.min(car.maxSpeed, car.speed));
    car.speed *= (0.99 - (1 - surfaceGrip) * 0.02);

    car.x += Math.cos(car.angle) * car.speed;
    car.y += Math.sin(car.angle) * car.speed;

    this.checkTrackBounds(car, trackData);

    if (trackData.hazard && car.speed > 5) {
      this.createHazardEffect(car);
    }

    if (car.speed > 8) {
      this.createDustParticles(car);
    }

    if (trackData.surface === 'mud' && car.speed > 3) {
      this.createMudParticles(car);
    }

    if (this.gameState.weather === 'heavy_rain') {
      this.createRainSplash(car);
    }

    car.stageTime += deltaTime;
    this.gameState.distanceTraveled = Math.max(this.gameState.distanceTraveled, this.calculateDistance(car));

    this.updateCoDriver(car);
    this.checkStageProgress(car);
  }

  getTrackData(car) {
    let nearestPoint = null;
    let minDist = Infinity;
    let index = 0;

    for (let i = 0; i < this.track.points.length; i++) {
      const dist = this.distance(car.x, car.y, this.track.points[i].x, this.track.points[i].y);
      if (dist < minDist) {
        minDist = dist;
        nearestPoint = this.track.points[i];
        index = i;
      }
    }

    return nearestPoint || { surface: 'dirt', hazard: false, jump: false };
  }

  getTrackHeight(car) {
    const data = this.getTrackData(car);
    return data.elevation || 0;
  }

  getSurfaceGrip(car) {
    const trackData = this.getTrackData(car);
    let grip = this.config.surfaceGrip;

    switch (trackData.surface) {
      case 'gravel':
        grip = 0.75;
        break;
      case 'dirt':
        grip = 0.65;
        break;
      case 'mud':
        grip = 0.4;
        break;
    }

    grip *= this.gameState.surfaceCondition;
    grip *= (1 - car.damage * 0.3);

    return grip;
  }

  checkTrackBounds(car, trackData) {
    if (trackData) {
      car.offTrack = false;
    } else {
      car.offTrack = true;
      car.speed *= 0.95;
    }

    car.x = Math.max(50, Math.min(this.track.points[this.track.points.length - 1].x + 100, car.x));
    car.y = Math.max(50, Math.min(this.canvas.height - 50, car.y));
  }

  calculateDistance(car) {
    let distance = 0;
    for (let i = 0; i < this.track.points.length - 1; i++) {
      const p1 = this.track.points[i];
      const p2 = this.track.points[i + 1];
      distance += this.distance(car.x, car.y, p1.x, p1.y);
    }
    return distance;
  }

  checkStageProgress(car) {
    const nextCheckpoint = (car.currentCheckpoint + 1) % this.track.checkpoints.length;
    const checkpoint = this.track.checkpoints[nextCheckpoint];
    const dist = this.distance(car.x, car.y, checkpoint.x, checkpoint.y);

    if (dist < 60) {
      car.currentCheckpoint = nextCheckpoint;
      car.checkpointsPassed++;
    }

    const lastPoint = this.track.points[this.track.points.length - 1];
    if (this.distance(car.x, car.y, lastPoint.x, lastPoint.y) < 100) {
      this.finishStage(car);
    }
  }

  finishStage(car) {
    car.stageFinished = true;
    car.stageFinishTime = car.stageTime;
    car.bestStage = Math.min(car.bestStage, car.stageTime);

    this.gameState.stageTimes[player].push(car.stageTime);
    this.gameState.totalTimes[car.name] += car.stageTime;

    car.finishOrder = Object.values(this.cars).filter(c => c.stageFinished).length;

    if (this.gameState.currentStage < this.config.stages) {
      this.nextStage();
    } else {
      this.checkRallyCompletion();
    }
  }

  nextStage() {
    this.gameState.currentStage++;
    this.gameState.stageTime = 0;

    Object.values(this.cars).forEach(car => {
      car.stage = this.gameState.currentStage;
      car.stageTime = 0;
      car.stageFinished = false;
      car.currentCheckpoint = 0;
      car.checkpointsPassed = 0;

      const startPos = this.track.startPoint;
      car.x = startPos.x - 50 - (Object.keys(this.cars).indexOf(car.name)) * 40;
      car.y = startPos.y + 20 + (Object.keys(this.cars).indexOf(car.name)) * 25;
      car.angle = startPos.angle;
      car.speed = 0;
    });
  }

  checkStageCompletion() {
    const allFinished = Object.values(this.cars).every(car => car.stageFinished);
    if (allFinished) {
      if (this.gameState.currentStage < this.config.stages) {
        this.nextStage();
      } else {
        this.gameState.rallyComplete = true;
      }
    }
  }

  checkRallyCompletion() {
    this.gameState.status = 'finished';
  }

  updateCoDriver(car) {
    const trackData = this.getTrackData(car);
    let message = '';

    const nextCheckpoint = this.track.checkpoints[Math.min(car.currentCheckpoint + 2, this.track.checkpoints.length - 1)];
    if (nextCheckpoint) {
      const dist = this.distance(car.x, car.y, nextCheckpoint.x, nextCheckpoint.y);
      if (dist < 200 && dist > 50) {
        message = dist < 100 ? 'Approaching checkpoint' : 'Checkpoint ahead';
      }
    }

    if (trackData.jump) {
      message = car.speed > 8 ? 'Jump!' : 'Bump';
    }

    if (trackData.surface === 'mud') {
      message = 'Mud - careful!';
    }

    if (car.offTrack) {
      message = 'Off track!';
    }

    if (message) {
      car.codriverMessage = message;
      car.codriverTimer = 1.5;
    }

    if (car.codriverTimer > 0) {
      car.codriverTimer -= 0.016;
    }
  }

  updateCoDriverMessages() {
    Object.values(this.cars).forEach(car => {
      if (car.codriverTimer > 0) {
        car.codriverTimer -= 0.016;
      }
    });
  }

  createDustParticles(car) {
    this.particles.dust.push({
      x: car.x - Math.cos(car.angle) * 15,
      y: car.y - Math.sin(car.angle) * 15,
      vx: -car.speed * 0.2 + (Math.random() - 0.5) * 3,
      vy: -car.speed * 0.2 + (Math.random() - 0.5) * 3,
      life: 1.2,
      size: 5 + Math.random() * 10,
      color: this.gameState.surfaceCondition < 0.7 ? '#8b4513' : '#d4a574'
    });
  }

  createMudParticles(car) {
    this.particles.mud.push({
      x: car.x - Math.cos(car.angle) * 10,
      y: car.y - Math.sin(car.angle) * 10,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 0.8,
      size: 3 + Math.random() * 6,
      color: '#5c4033'
    });
  }

  createJumpEffect(car) {
    for (let i = 0; i < 10; i++) {
      this.particles.dust.push({
        x: car.x,
        y: car.y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 0.6,
        size: 8,
        color: '#d4a574'
      });
    }
  }

  createLandingEffect(car) {
    for (let i = 0; i < 15; i++) {
      this.particles.sparks.push({
        x: car.x,
        y: car.y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 0.5,
        size: 2 + Math.random() * 3,
        color: '#ff6b35'
      });
    }
  }

  createHazardEffect(car) {
    this.particles.sparks.push({
      x: car.x,
      y: car.y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 0.4,
      size: 3,
      color: '#ff0000'
    });
  }

  createRainSplash(car) {
    this.particles.dust.push({
      x: car.x + (Math.random() - 0.5) * 20,
      y: car.y + (Math.random() - 0.5) * 20,
      vx: -car.velocityX * 0.2,
      vy: -car.velocityY * 0.2,
      life: 0.3,
      size: 4,
      color: '#6495ed'
    });
  }

  updateParticles(deltaTime) {
    this.particles.dust = this.particles.dust.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime * 0.8;
      p.size += deltaTime * 8;
      return p.life > 0;
    });

    this.particles.mud = this.particles.mud.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime * 1.5;
      return p.life > 0;
    });

    this.particles.sparks = this.particles.sparks.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3;
      p.life -= deltaTime * 2;
      return p.life > 0;
    });

    if (this.gameState.weather === 'heavy_rain') {
      for (let i = 0; i < 3; i++) {
        this.particles.dust.push({
          x: this.camera.x - this.canvas.width / 2 + Math.random() * this.canvas.width,
          y: this.camera.y - this.canvas.height / 2 - 20,
          vx: 2 + Math.random() * 3,
          vy: 8 + Math.random() * 5,
          life: 0.5,
          size: 1,
          color: '#6495ed'
        });
      }
    }
  }

  updateCamera() {
    const playerCar = this.cars[this.players[0]];
    if (playerCar) {
      this.camera.x += (playerCar.x - this.camera.x) * 0.08;
      this.camera.y += (playerCar.y - this.camera.y) * 0.08;
    }
  }

  updateLeaderboard() {
    this.gameState.leaderboard = Object.values(this.cars).sort((a, b) => {
      if (a.stageFinished && !b.stageFinished) return 1;
      if (!a.stageFinished && b.stageFinished) return -1;
      if (a.stageFinished && b.stageFinished) return a.stageFinishTime - b.stageFinishTime;

      if (a.checkpointsPassed !== b.checkpointsPassed) {
        return b.checkpointsPassed - a.checkpointsPassed;
      }

      return a.stageTime - b.stageTime;
    });

    this.gameState.leaderboard.forEach((car, index) => {
      car.position = index + 1;
    });
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

    if (this.gameState.status === 'finished') {
      this.drawResults();
    }
  }

  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#98d1dc');
    gradient.addColorStop(1, '#6b8e23');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#556b2f';
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 10; j++) {
        const x = i * 80 + (j % 2) * 40;
        const y = j * 100;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + 40);
        this.ctx.lineTo(x + 10, y);
        this.ctx.lineTo(x + 20, y + 40);
        this.ctx.fill();
      }
    }

    if (this.gameState.weather === 'fog') {
      this.ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  drawTrack() {
    this.ctx.save();
    this.ctx.translate(-this.camera.x + this.canvas.width / 2, -this.camera.y + this.canvas.height / 2);

    this.ctx.strokeStyle = '#8b7355';
    this.ctx.lineWidth = 100;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();
    this.ctx.moveTo(this.track.points[0].x, this.track.points[0].y);
    for (let i = 1; i < this.track.points.length; i++) {
      const p = this.track.points[i];
      this.ctx.lineTo(p.x, p.y);
    }
    this.ctx.stroke();

    this.ctx.strokeStyle = '#a08060';
    this.ctx.lineWidth = 80;
    this.ctx.stroke();

    this.ctx.strokeStyle = '#654321';
    this.ctx.lineWidth = 60;
    this.ctx.stroke();

    this.ctx.strokeStyle = '#c4a574';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([20, 15]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    this.track.points.forEach((point, index) => {
      if (point.jump) {
        this.ctx.fillStyle = '#ff6347';
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
        this.ctx.fill();
      }

      if (point.hazard) {
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        this.ctx.beginPath();
        this.ctx.moveTo(point.x, point.y - 15);
        this.ctx.lineTo(point.x + 10, point.y);
        this.ctx.lineTo(point.x, point.y + 15);
        this.ctx.lineTo(point.x - 10, point.y);
        this.ctx.closePath();
        this.ctx.fill();
      }
    });

    this.drawStartFinish();

    this.ctx.restore();
  }

  drawStartFinish() {
    const start = this.track.startPoint;
    this.ctx.save();
    this.ctx.translate(start.x, start.y);
    this.ctx.rotate(start.angle);

    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(-30, -40, 60, 80);

    this.ctx.fillStyle = '#000';
    const checkSize = 10;
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 8; j++) {
        if ((i + j) % 2 === 0) {
          this.ctx.fillRect(-30 + i * checkSize, -40 + j * checkSize, checkSize, checkSize);
        }
      }
    }

    this.ctx.fillStyle = '#ffd700';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('STAGE START', 0, -50);

    this.ctx.restore();
  }

  drawParticles() {
    this.ctx.save();
    this.ctx.translate(-this.camera.x + this.canvas.width / 2, -this.camera.y + this.canvas.height / 2);

    this.particles.dust.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life * 0.6;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.particles.mud.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life * 0.8;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

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

  drawCars() {
    Object.values(this.cars).forEach(car => {
      this.ctx.save();
      this.ctx.translate(car.x, car.y);
      this.ctx.rotate(car.angle);

      if (car.airborne) {
        const tilt = (car.airborneTime % 0.4) * Math.PI * 2;
        this.ctx.rotate(tilt * 0.1);
      }

      this.ctx.fillStyle = '#222';
      this.ctx.fillRect(-18, -10, 8, 6);
      this.ctx.fillRect(-18, 4, 8, 6);
      this.ctx.fillRect(12, -10, 8, 6);
      this.ctx.fillRect(12, 4, 8, 6);

      this.ctx.fillStyle = car.color;
      this.ctx.beginPath();
      this.ctx.moveTo(-22, -8);
      this.ctx.lineTo(15, -8);
      this.ctx.lineTo(20, -6);
      this.ctx.lineTo(20, 6);
      this.ctx.lineTo(15, 8);
      this.ctx.lineTo(-22, 8);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(-20, -12, 15, 4);
      this.ctx.fillRect(-20, 8, 15, 4);

      this.ctx.fillStyle = car.color;
      this.ctx.fillRect(-22, -14, 8, 3);
      this.ctx.fillRect(-22, 11, 8, 3);

      this.ctx.fillStyle = '#111';
      this.ctx.beginPath();
      this.ctx.moveTo(5, -5);
      this.ctx.lineTo(15, 0);
      this.ctx.lineTo(5, 5);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.restore();

      this.drawCarInfo(car);
    });
  }

  drawCarInfo(car) {
    this.ctx.fillStyle = '#ffd700';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(car.name, car.x, car.y - 25);

    if (car.codriverTimer > 0 && car.codriverMessage) {
      this.ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.fillText(car.codriverMessage, car.x, car.y - 40);
    }

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '11px Arial';
    this.ctx.fillText(`Stage ${car.stage}`, car.x, car.y + 30);
  }

  drawUI() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    this.ctx.fillRect(15, 15, 180, 120);
    this.ctx.strokeStyle = '#ff4500';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(15, 15, 180, 120);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Stage ${this.gameState.currentStage}/${this.config.stages}`, 25, 40);
    this.ctx.fillText(this.formatTime(this.gameState.stageTime), 25, 65);

    const playerCar = this.cars[this.players[0]];
    if (playerCar) {
      this.ctx.fillStyle = '#ccc';
      this.ctx.font = '12px Arial';
      this.ctx.fillText(`Pos: ${playerCar.position}`, 25, 90);
      this.ctx.fillText(`Speed: ${Math.round(playerCar.speed * 10)} km/h`, 25, 110);
      this.ctx.fillText(`Checkpoints: ${playerCar.checkpointsPassed}`, 25, 128);
    }

    this.drawLeaderboard();
    this.drawWeatherUI();
    this.drawProgressBar();
  }

  drawLeaderboard() {
    const lbWidth = 180;
    const lbHeight = 30 + Math.min(this.players.length, 4) * 22;
    const lbX = this.canvas.width - lbWidth - 15;
    const lbY = 15;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    this.ctx.fillRect(lbX, lbY, lbWidth, lbHeight);
    this.ctx.strokeStyle = '#ff4500';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(lbX, lbY, lbWidth, lbHeight);

    this.ctx.fillStyle = '#ff4500';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('STANDINGS', lbX + lbWidth / 2, lbY + 20);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';

    this.gameState.leaderboard.slice(0, 4).forEach((car, index) => {
      const y = lbY + 42 + index * 20;
      this.ctx.fillStyle = index === 0 ? '#ffd700' : '#fff';
      this.ctx.fillText(`${car.position}. ${car.name}`, lbX + 10, y);
      this.ctx.textAlign = 'right';
      this.ctx.fillText(this.formatTime(car.stageTime), lbX + lbWidth - 10, y);
      this.ctx.textAlign = 'left';
    });
  }

  drawWeatherUI() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(15, this.canvas.height - 50, 160, 40);

    const weatherText = {
      'dry': '☀️ Dry',
      'light_rain': '🌧️ Light Rain',
      'heavy_rain': '⛈️ Heavy Rain',
      'fog': '🌫️ Fog'
    };

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(weatherText[this.gameState.weather], 25, this.canvas.height - 30);

    const gripText = `Grip: ${Math.round(this.gameState.surfaceCondition * 100)}%`;
    this.ctx.fillText(gripText, 25, this.canvas.height - 12);
  }

  drawProgressBar() {
    const barWidth = 300;
    const barHeight = 12;
    const barX = (this.canvas.width - barWidth) / 2;
    const barY = 15;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(barX - 10, barY - 5, barWidth + 20, barHeight + 20);

    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    const progress = Math.min(1, this.gameState.distanceTraveled / this.gameState.stageLength);
    const progressColor = this.gameState.surfaceCondition < 0.7 ? '#ff4500' : '#ffd700';
    this.ctx.fillStyle = progressColor;
    this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${Math.round(progress * 100)}%`, barX + barWidth / 2, barY + 10);
  }

  drawCountdown() {
    if (this.gameState.status === 'countdown' && this.countdown.value >= 0) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.fillStyle = '#ff4500';
      this.ctx.font = 'bold 180px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      const text = this.countdown.value > 0 ? this.countdown.value.toString() : 'GO!';
      this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);

      this.ctx.textBaseline = 'alphabetic';
    }
  }

  drawResults() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#ff4500';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('RALLY COMPLETE!', this.canvas.width / 2, 80);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '20px Arial';
    this.ctx.fillText('Final Results', this.canvas.width / 2, 130);

    let yPos = 180;
    this.gameState.leaderboard.forEach((car, index) => {
      const medal = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;

      this.ctx.fillStyle = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#fff';
      this.ctx.font = 'bold 28px Arial';
      this.ctx.fillText(`${medal} ${car.name}`, this.canvas.width / 2, yPos);

      this.ctx.font = '16px Arial';
      const totalTime = this.gameState.totalTimes[car.name];
      this.ctx.fillText(`Total Time: ${this.formatTime(totalTime)} | Best Stage: ${this.formatTime(car.bestStage)}`, this.canvas.width / 2, yPos + 30);

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

window.RallyChampionship = RallyChampionship;