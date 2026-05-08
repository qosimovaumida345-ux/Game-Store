// Monster Truck Mania - Giant Truck Racing with Jumps, Stunts, and Obstacles
class MonsterTruckMania {
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
      totalLaps: 2,
      maxSpeed: 11,
      acceleration: 0.1,
      braking: 0.25,
      turningSpeed: 0.05,
      bigAirThreshold: 3,
      stuntScoreMultiplier: 2,
      crushBonus: 50,
      jumpForce: 0.35,
      gravity: 0.5,
      suspensionStiffness: 0.3
    };

    this.gameState = {
      players: {},
      raceTime: 0,
      status: 'countdown',
      lap: 1,
      totalLaps: this.config.totalLaps,
      leaderboard: [],
      obstacles: [],
      stuntZones: [],
      crushObjects: [],
      score: 0,
      currentStunt: null,
      jumpCount: 0,
      bigAirCount: 0,
      crushCount: 0
    };

    this.track = this.generateMonsterTrack();
    this.cars = {};
    this.setupMonsterTrucks();
    this.particles = {
      dust: [],
      debris: [],
      crush: [],
      flames: []
    };
    this.countdown = { value: 3, timer: 0 };
    this.camera = { x: 0, y: 0 };
    this.obstacles = this.generateObstacles();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 1200;
    this.canvas.height = this.canvas.parentElement.clientHeight || 800;
  }

  generateMonsterTrack() {
    const points = [];
    const segments = 20;

    let x = 100;
    let y = this.canvas.height / 2;
    let angle = 0;

    for (let i = 0; i < segments; i++) {
      const curve = Math.sin(i * 0.4) * 0.3;
      angle += curve;

      const rampHeight = Math.sin(i * 0.3) * 25;
      const jumpTrigger = Math.random() < 0.15;

      x += Math.cos(angle) * 80;
      y += Math.sin(angle) * 50 + rampHeight;

      y = Math.max(100, Math.min(this.canvas.height - 100, y));

      points.push({
        x: x,
        y: y,
        angle: angle,
        width: 180 + Math.sin(i * 0.2) * 30,
        elevation: rampHeight,
        isRamp: Math.abs(rampHeight) > 15,
        isJump: jumpTrigger,
        hasObstacle: Math.random() < 0.2
      });
    }

    return {
      points: points,
      width: 180,
      startPoint: { x: points[0].x, y: points[0].y + 40, angle: Math.PI / 2 },
      checkpoints: points.filter((_, i) => i % 4 === 0),
      obstaclePositions: points.filter(p => p.hasObstacle)
    };
  }

  generateObstacles() {
    const obstacles = {
      ramps: [],
      cars: [],
      buses: [],
      caravans: [],
      jumps: []
    };

    this.track.obstaclePositions.forEach(point => {
      const obstacleType = Math.random();

      if (obstacleType < 0.3) {
        obstacles.cars.push({
          x: point.x + (Math.random() - 0.5) * 50,
          y: point.y + 20,
          size: 30 + Math.random() * 15,
          crushed: false
        });
      } else if (obstacleType < 0.5) {
        obstacles.buses.push({
          x: point.x + (Math.random() - 0.5) * 50,
          y: point.y + 15,
          size: 50 + Math.random() * 20,
          crushed: false
        });
      } else if (obstacleType < 0.7) {
        obstacles.caravans.push({
          x: point.x + (Math.random() - 0.5) * 50,
          y: point.y + 25,
          size: 25 + Math.random() * 10,
          crushed: false
        });
      } else {
        obstacles.ramps.push({
          x: point.x,
          y: point.y,
          width: 40,
          height: 20
        });
      }
    });

    return obstacles;
  }

  setupMonsterTrucks() {
    const truckConfigs = [
      { color: '#ff0000', name: 'Grave Digger', special: 'purple_flames' },
      { color: '#0000ff', name: 'Bigfoot', special: 'blue_flames' },
      { color: '#ffff00', name: 'Gravedigger', special: 'orange_flames' },
      { color: '#ff6600', name: 'Monster Mash', special: 'green_flames' },
      { color: '#800080', name: 'Thunderfoot', special: 'red_flames' },
      { color: '#00ffff', name: 'Ice Cream', special: 'white_flames' },
      { color: '#ff00ff', name: 'El Toro Loco', special: 'yellow_flames' },
      { color: '#00ff00', name: 'Barbarian', special: 'blue_flames' }
    ];

    this.players.forEach((player, index) => {
      const config = truckConfigs[index % truckConfigs.length];
      const startPoint = this.track.startPoint;

      this.cars[player] = {
        name: player,
        truckName: config.name,
        color: config.color,
        flameColor: config.special,
        x: startPoint.x - index * 50,
        y: startPoint.y + 25 + index * 25,
        angle: startPoint.angle,
        speed: 0,
        maxSpeed: this.config.maxSpeed * (0.9 + Math.random() * 0.2),
        acceleration: this.config.acceleration,
        braking: this.config.braking,
        turningSpeed: this.config.turningSpeed,
        verticalPosition: 0,
        verticalVelocity: 0,
        isAirborne: false,
        airborneTime: 0,
        suspensionCompression: 0,
        wheelRotation: 0,
        bodyTilt: 0,
        flipped: false,
        flipTimer: 0,
        stunts: [],
        currentStunt: null,
        stuntScore: 0,
        totalScore: 0,
        crushes: 0,
        jumpCount: 0,
        lap: 0,
        currentCheckpoint: 0,
        lapTime: 0,
        bestLap: Infinity,
        position: index + 1,
        finished: false,
        finishingTime: 0
      };

      this.gameState.players[player] = { input: {} };
    });

    this.gameState.obstacles = this.obstacles;
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

    Object.values(this.cars).forEach(car => {
      this.updateMonsterTruck(car, deltaTime);
    });

    this.checkObstacleCollisions();
    this.updateLeaderboard();
    this.checkRaceCompletion();
  }

  updateMonsterTruck(car, deltaTime) {
    if (car.flipped) {
      car.flipTimer -= deltaTime;
      car.speed *= 0.9;

      if (car.flipTimer <= 0) {
        car.flipped = false;
        car.flipTimer = 0;
        car.bodyTilt = 0;
      }
      return;
    }

    const input = this.gameState.players[car.name]?.input || {};
    const joystick = input.joystick || { x: 0, y: 0 };

    if (car.isAirborne) {
      car.airborneTime += deltaTime;
      car.verticalVelocity -= this.config.gravity;
      car.verticalPosition += car.verticalVelocity;

      car.wheelRotation += car.speed * deltaTime * 3;

      if (car.verticalPosition <= 0) {
        this.landTruck(car);
      }

      this.performAirStunts(car, input);
      return;
    }

    if (joystick.y < -0.15) {
      car.speed += car.acceleration * Math.abs(joystick.y);
    }

    if (joystick.y > 0.15) {
      car.speed -= car.braking * joystick.y;
    }

    if (input.brake) {
      car.speed *= 0.96;
    }

    if (Math.abs(joystick.x) > 0.1 && Math.abs(car.speed) > 0.5) {
      const turnAmount = joystick.x * car.turningSpeed * Math.min(1, car.speed / 5);
      car.angle += turnAmount;
      car.bodyTilt = joystick.x * 15;
    } else {
      car.bodyTilt *= 0.9;
    }

    car.speed = Math.max(0, Math.min(car.maxSpeed, car.speed));
    car.speed *= 0.99;

    car.wheelRotation += car.speed * deltaTime * 5;

    const trackData = this.getTrackData(car);

    if (trackData.isRamp || trackData.isJump) {
      if (car.speed > 7) {
        this.launchTruck(car, trackData);
      }
    }

    car.suspensionCompression = trackData.isRamp ? 0.5 : 0;

    car.x += Math.cos(car.angle) * car.speed;
    car.y += Math.sin(car.angle) * car.speed;

    car.lapTime += deltaTime;
    this.checkCheckpoints(car);
  }

  getTrackData(car) {
    let nearestPoint = null;
    let minDist = Infinity;

    this.track.points.forEach(point => {
      const dist = this.distance(car.x, car.y, point.x, point.y);
      if (dist < minDist) {
        minDist = dist;
        nearestPoint = point;
      }
    });

    return nearestPoint || { isRamp: false, isJump: false, elevation: 0 };
  }

  launchTruck(car, trackData) {
    car.isAirborne = true;
    car.airborneTime = 0;
    car.verticalVelocity = car.speed * this.config.jumpForce;
    car.jumpCount++;
    this.gameState.jumpCount++;

    if (car.speed > 10) {
      this.createLaunchEffect(car);
    }
  }

  performAirStunts(car, input) {
    if (car.currentStunt) return;

    if (input.brake && Math.abs(input.joystick?.x || 0) > 0.3) {
      const stuntType = input.joystick.x > 0 ? 'flip' : 'barrel';
      car.currentStunt = {
        type: stuntType,
        progress: 0,
        score: 100
      };
    }
  }

  completeStunt(car) {
    if (car.currentStunt) {
      car.stuntScore += car.currentStunt.score * this.config.stuntScoreMultiplier;
      car.stunts.push(car.currentStunt);
      car.totalScore += car.currentStunt.score;
      this.gameState.score += car.currentStunt.score;

      if (car.airborneTime > this.config.bigAirThreshold) {
        car.totalScore += 100;
        this.gameState.bigAirCount++;
      }

      car.currentStunt = null;
    }
  }

  landTruck(car) {
    car.isAirborne = false;
    car.verticalPosition = 0;
    car.verticalVelocity = 0;

    this.completeStunt(car);

    if (car.airborneTime > this.config.bigAirThreshold) {
      this.createLandingEffect(car);
      car.speed *= 0.6;
    }

    if (Math.random() < 0.15 && Math.abs(car.bodyTilt) > 20) {
      this.flipTruck(car);
    }

    car.airborneTime = 0;
    car.bodyTilt = 0;
  }

  flipTruck(car) {
    car.flipped = true;
    car.flipTimer = 2;
    car.speed = 0;
  }

  checkObstacleCollisions() {
    Object.values(this.cars).forEach(car => {
      if (car.isAirborne) return;

      this.obstacles.cars.forEach(carOb => {
        if (!carOb.crushed && this.distance(car.x, car.y, carOb.x, carOb.y) < carOb.size + 20) {
          if (car.speed > 5) {
            this.crushObstacle(car, carOb, 'car');
          }
        }
      });

      this.obstacles.buses.forEach(bus => {
        if (!bus.crushed && this.distance(car.x, car.y, bus.x, bus.y) < bus.size + 30) {
          if (car.speed > 4) {
            this.crushObstacle(car, bus, 'bus');
          }
        }
      });

      this.obstacles.caravans.forEach(caravan => {
        if (!caravan.crushed && this.distance(car.x, car.y, caravan.x, caravan.y) < caravan.size + 25) {
          if (car.speed > 4) {
            this.crushObstacle(car, caravan, 'caravan');
          }
        }
      });
    });
  }

  crushObstacle(car, obstacle, type) {
    obstacle.crushed = true;
    car.crushes++;
    this.gameState.crushCount++;

    const bonus = type === 'bus' ? 150 : type === 'caravan' ? 80 : this.config.crushBonus;
    car.totalScore += bonus;
    this.gameState.score += bonus;

    car.speed *= 0.85;

    this.createCrushEffect(obstacle.x, obstacle.y);
  }

  createLaunchEffect(car) {
    for (let i = 0; i < 15; i++) {
      this.particles.dust.push({
        x: car.x + (Math.random() - 0.5) * 30,
        y: car.y + 20,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 8,
        life: 0.8,
        size: 8 + Math.random() * 12,
        color: '#d2b48c'
      });
    }
  }

  createLandingEffect(car) {
    for (let i = 0; i < 20; i++) {
      this.particles.dust.push({
        x: car.x + (Math.random() - 0.5) * 50,
        y: car.y + 20,
        vx: (Math.random() - 0.5) * 10,
        vy: -Math.random() * 6,
        life: 1,
        size: 10 + Math.random() * 15,
        color: '#8b4513'
      });

      this.particles.debris.push({
        x: car.x,
        y: car.y,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 10,
        life: 1.5,
        size: 3 + Math.random() * 5,
        color: '#696969'
      });
    }
  }

  createCrushEffect(x, y) {
    for (let i = 0; i < 15; i++) {
      this.particles.crush.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y,
        vx: (Math.random() - 0.5) * 15,
        vy: -Math.random() * 12,
        life: 1.2,
        size: 4 + Math.random() * 6,
        color: Math.random() < 0.5 ? '#ff0000' : '#ffff00'
      });
    }
  }

  checkCheckpoints(car) {
    const nextCheckpoint = (car.currentCheckpoint + 1) % this.track.checkpoints.length;
    const checkpoint = this.track.checkpoints[nextCheckpoint];
    const dist = this.distance(car.x, car.y, checkpoint.x, checkpoint.y);

    if (dist < 80) {
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
    }

    if (car.lap >= this.config.totalLaps) {
      car.finished = true;
      car.finishingTime = this.gameState.raceTime;
    }

    car.lapTime = 0;
  }

  updateParticles(deltaTime) {
    this.particles.dust = this.particles.dust.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime * 0.8;
      p.size += deltaTime * 10;
      return p.life > 0;
    });

    this.particles.debris = this.particles.debris.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3;
      p.life -= deltaTime;
      return p.life > 0;
    });

    this.particles.crush = this.particles.crush.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4;
      p.life -= deltaTime * 1.5;
      return p.life > 0;
    });
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
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      if (a.finished && b.finished) return a.finishingTime - b.finishingTime;
      if (a.lap !== b.lap) return b.lap - a.lap;
      return b.totalScore - a.totalScore;
    });

    this.gameState.leaderboard.forEach((car, index) => {
      car.position = index + 1;
    });
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
    this.drawObstacles();
    this.drawParticles();
    this.drawCars();
    this.drawUI();
    this.drawCountdown();
    this.drawResults();
  }

  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(0.3, '#98d1dc');
    gradient.addColorStop(0.6, '#8b4513');
    gradient.addColorStop(1, '#654321');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#ff4500';
    this.ctx.font = 'bold 80px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('MONSTER', this.canvas.width / 2, this.canvas.height / 2 - 20);
    this.ctx.font = 'bold 60px Arial';
    this.ctx.fillText('TRUCK MANIA', this.canvas.width / 2, this.canvas.height / 2 + 50);
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

    this.ctx.fillStyle = '#cd853f';
    this.ctx.fill();

    this.ctx.strokeStyle = '#8b4513';
    this.ctx.lineWidth = this.track.width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();

    this.ctx.strokeStyle = '#deb887';
    this.ctx.lineWidth = this.track.width - 40;
    this.ctx.stroke();

    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([30, 20]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    points.forEach(point => {
      if (point.isRamp) {
        this.ctx.fillStyle = '#ff4500';
        this.ctx.beginPath();
        this.ctx.moveTo(point.x - 20, point.y);
        this.ctx.lineTo(point.x + 20, point.y - 30);
        this.ctx.lineTo(point.x + 20, point.y);
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
    this.ctx.fillRect(-25, -60, 50, 120);

    this.ctx.fillStyle = '#000';
    const checkSize = 12;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 10; j++) {
        if ((i + j) % 2 === 0) {
          this.ctx.fillRect(-25 + i * checkSize, -60 + j * checkSize, checkSize, checkSize);
        }
      }
    }

    this.ctx.restore();
  }

  drawObstacles() {
    this.ctx.save();
    this.ctx.translate(-this.camera.x + this.canvas.width / 2, -this.camera.y + this.canvas.height / 2);

    this.obstacles.cars.forEach(ob => {
      this.ctx.fillStyle = ob.crushed ? '#555' : this.getRandomCarColor();
      this.ctx.fillRect(ob.x - ob.size / 2, ob.y - ob.size / 3, ob.size, ob.size / 1.5);

      if (ob.crushed) {
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(ob.x - ob.size / 2, ob.y - ob.size / 6, ob.size, ob.size / 4);
      }
    });

    this.obstacles.buses.forEach(bus => {
      this.ctx.fillStyle = bus.crushed ? '#444' : '#006400';
      this.ctx.fillRect(bus.x - bus.size / 2, bus.y - bus.size / 3, bus.size, bus.size / 2);

      this.ctx.fillStyle = '#87ceeb';
      if (!bus.crushed) {
        this.ctx.fillRect(bus.x - bus.size / 3, bus.y - bus.size / 4, bus.size / 2, bus.size / 6);
      }
    });

    this.obstacles.caravans.forEach(caravan => {
      this.ctx.fillStyle = caravan.crushed ? '#666' : '#4169e1';
      this.ctx.beginPath();
      this.ctx.moveTo(caravan.x - caravan.size / 2, caravan.y);
      this.ctx.lineTo(caravan.x + caravan.size / 2, caravan.y);
      this.ctx.lineTo(caravan.x + caravan.size / 2, caravan.y - caravan.size / 2);
      this.ctx.lineTo(caravan.x - caravan.size / 3, caravan.y - caravan.size / 2);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.fillStyle = '#87ceeb';
      this.ctx.fillRect(caravan.x - caravan.size / 4, caravan.y - caravan.size / 2 + 5, caravan.size / 2, caravan.size / 4);
    });

    this.ctx.restore();
  }

  getRandomCarColor() {
    const colors = ['#ff0000', '#0000ff', '#006400', '#800000', '#000080', '#ff6600'];
    return colors[Math.floor(Math.random() * colors.length)];
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

    this.particles.debris.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.particles.crush.forEach(p => {
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
      this.drawMonsterTruck(car);
    });
  }

  drawMonsterTruck(car) {
    this.ctx.save();
    this.ctx.translate(car.x, car.y);
    this.ctx.rotate(car.angle);

    this.ctx.translate(0, -car.verticalPosition);

    this.ctx.rotate(car.bodyTilt * Math.PI / 180);

    if (car.isAirborne) {
      const rotation = car.airborneTime * 2;
      this.ctx.rotate(car.bodyTilt > 0 ? rotation : -rotation);
    }

    this.ctx.fillStyle = '#222';
    this.ctx.fillRect(-25, 12, 10, 8);
    this.ctx.fillRect(-25, -8, 10, 8);
    this.ctx.fillRect(18, 12, 10, 8);
    this.ctx.fillRect(18, -8, 10, 8);

    this.ctx.fillStyle = car.color;
    this.ctx.fillRect(-28, -18, 56, 36);

    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(-30, -25, 35, 10);
    this.ctx.fillRect(-30, 15, 35, 10);

    this.ctx.fillStyle = '#444';
    this.ctx.beginPath();
    this.ctx.arc(-20, 15, 12, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(20, 15, 12, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(-20, -15, 12, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(20, -15, 12, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(-28, -18, 28, 14);

    if (car.speed > 2) {
      const flameColors = {
        purple_flames: '#9400d3',
        blue_flames: '#00bfff',
        orange_flames: '#ff4500',
        green_flames: '#32cd32',
        red_flames: '#ff0000',
        white_flames: '#ffffff',
        yellow_flames: '#ffff00'
      };
      this.ctx.fillStyle = flameColors[car.flameColor] || '#ff4500';

      for (let i = 0; i < 3; i++) {
        this.ctx.beginPath();
        this.ctx.moveTo(28, -6 + i * 4);
        this.ctx.lineTo(38 + Math.random() * 8, -2 + i * 4);
        this.ctx.lineTo(28, 2 + i * 4);
        this.ctx.closePath();
        this.ctx.fill();
      }
    }

    this.ctx.restore();

    this.drawCarInfo(car);
  }

  drawCarInfo(car) {
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${car.totalScore}`, car.x, car.y - 35);

    this.ctx.fillStyle = '#ccc';
    this.ctx.font = '11px Arial';
    this.ctx.fillText(car.name, car.x, car.y + 40);

    this.ctx.fillStyle = '#ffd700';
    this.ctx.font = 'bold 10px Arial';
    const statusText = [];
    if (car.isAirborne) statusText.push('AIR');
    if (car.flipped) statusText.push('FLIPPED');
    if (car.crushes > 0) statusText.push(`${car.crushes}x CRUSH`);

    if (statusText.length > 0) {
      this.ctx.fillText(statusText.join(' '), car.x, car.y - 48);
    }
  }

  drawUI() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(15, 15, 180, 110);
    this.ctx.strokeStyle = '#ff4500';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(15, 15, 180, 110);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Lap ${this.gameState.lap}/${this.config.totalLaps}`, 25, 38);
    this.ctx.fillText(this.formatTime(this.gameState.raceTime), 25, 58);

    const playerCar = this.cars[this.players[0]];
    if (playerCar) {
      this.ctx.fillStyle = '#ffd700';
      this.ctx.font = 'bold 20px Arial';
      this.ctx.fillText(`Score: ${playerCar.totalScore}`, 25, 85);

      this.ctx.fillStyle = '#ccc';
      this.ctx.font = '12px Arial';
      this.ctx.fillText(`Jumps: ${playerCar.jumpCount}`, 25, 108);
      this.ctx.fillText(`Crushes: ${playerCar.crushes}`, 110, 108);
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
    this.ctx.strokeStyle = '#ff4500';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(lbX, lbY, lbWidth, lbHeight);

    this.ctx.fillStyle = '#ff4500';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('STANDINGS', lbX + lbWidth / 2, lbY + 22);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px Arial';

    this.gameState.leaderboard.slice(0, 4).forEach((car, index) => {
      const y = lbY + 44 + index * 20;
      this.ctx.fillStyle = index === 0 ? '#ffd700' : '#fff';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`${car.position}. ${car.name}`, lbX + 10, y);
      this.ctx.textAlign = 'right';
      this.ctx.fillText(`${car.totalScore}`, lbX + lbWidth - 10, y);
      this.ctx.textAlign = 'left';
    });
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
    if (this.gameState.status === 'finished') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.fillStyle = '#ff4500';
      this.ctx.font = 'bold 50px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('RACE COMPLETE', this.canvas.width / 2, 80);

      this.ctx.fillStyle = '#ffd700';
      this.ctx.font = '20px Arial';
      this.ctx.fillText(`Total Jumps: ${this.gameState.jumpCount} | Crushes: ${this.gameState.crushCount}`, this.canvas.width / 2, 120);

      let yPos = 170;
      this.gameState.leaderboard.forEach((car, index) => {
        const medal = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;

        this.ctx.fillStyle = index === 0 ? '#ffd700' : '#fff';
        this.ctx.font = 'bold 28px Arial';
        this.ctx.fillText(`${medal} ${car.name}`, this.canvas.width / 2, yPos);

        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Score: ${car.totalScore} | Jumps: ${car.jumpCount} | Crushes: ${car.crushes}`, this.canvas.width / 2, yPos + 30);

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

window.MonsterTruckMania = MonsterTruckMania;