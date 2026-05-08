// Off-Road Warriors - Terrain Racing with Mud, Rocks, and Environmental Hazards
class OffRoadWarriors {
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
      totalLaps: 3,
      maxSpeed: 12,
      acceleration: 0.12,
      braking: 0.3,
      turningSpeed: 0.07,
      mudPenalty: 0.7,
      rockPenalty: 0.85,
      hillClimbBonus: 1.1,
      waterDepth: 30,
      maxSpeedWater: 4,
      jumpForce: 0.25
    };

    this.gameState = {
      players: {},
      raceTime: 0,
      status: 'countdown',
      lap: 1,
      totalLaps: this.config.totalLaps,
      leaderboard: [],
      weather: 'sunny',
      mudPools: [],
      rockFields: [],
      waterCrossings: [],
      steepHills: [],
      checkpoints: []
    };

    this.track = this.generateOffroadTrack();
    this.cars = {};
    this.setupOffroadVehicles();
    this.particles = {
      mud: [],
      dust: [],
      splash: [],
      rocks: []
    };
    this.countdown = { value: 3, timer: 0 };
    this.camera = { x: 0, y: 0 };
    this.environments = this.generateEnvironments();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 1200;
    this.canvas.height = this.canvas.parentElement.clientHeight || 800;
  }

  generateOffroadTrack() {
    const points = [];
    const segments = 25;
    const baseLength = 60;

    let x = 150;
    let y = this.canvas.height / 2;
    let angle = 0;

    for (let i = 0; i < segments; i++) {
      const curvePattern = Math.sin(i * 0.3) + Math.cos(i * 0.2);
      angle += curvePattern * 0.25;

      const hillFactor = Math.sin(i * 0.4) * 20;

      x += Math.cos(angle) * 60;
      y += Math.sin(angle) * 40 + hillFactor;

      y = Math.max(100, Math.min(this.canvas.height - 100, y));

      points.push({
        x: x,
        y: y,
        angle: angle,
        width: 130 + Math.sin(i * 0.25) * 30,
        elevation: hillFactor,
        terrain: this.getTerrainType(i)
      });
    }

    return {
      points: points,
      width: 130,
      startPoint: { x: points[0].x, y: points[0].y + 20, angle: Math.PI / 2 },
      checkpoints: points.filter((_, i) => i % 5 === 0)
    };
  }

  getTerrainType(segmentIndex) {
    const types = ['grass', 'mud', 'gravel', 'rock', 'sand', 'grass', 'grass', 'rock'];
    return types[segmentIndex % types.length];
  }

  generateEnvironments() {
    const environments = {
      mudPools: [],
      rockFields: [],
      waterCrossings: [],
      steepHills: [],
      trees: [],
      bushes: []
    };

    const trackPoints = this.track.points;

    trackPoints.forEach((point, index) => {
      if (point.terrain === 'mud' && Math.random() < 0.3) {
        environments.mudPools.push({
          x: point.x + (Math.random() - 0.5) * 50,
          y: point.y + (Math.random() - 0.5) * 50,
          radius: 30 + Math.random() * 25,
          depth: 0.3 + Math.random() * 0.4
        });
      }

      if (point.terrain === 'rock' && Math.random() < 0.4) {
        environments.rockFields.push({
          x: point.x + (Math.random() - 0.5) * 60,
          y: point.y + (Math.random() - 0.5) * 60,
          size: 15 + Math.random() * 20,
          count: 3 + Math.floor(Math.random() * 5)
        });
      }

      if (Math.random() < 0.08) {
        environments.waterCrossings.push({
          x: point.x,
          y: point.y,
          width: 40 + Math.random() * 30,
          depth: 0.4 + Math.random() * 0.3
        });
      }

      if (Math.abs(point.elevation) > 15) {
        environments.steepHills.push({
          x: point.x,
          y: point.y,
          angle: point.angle,
          steepness: Math.abs(point.elevation) / 20
        });
      }

      if (Math.random() < 0.15) {
        environments.trees.push({
          x: point.x + (Math.random() - 0.5) * 150,
          y: point.y + (Math.random() - 0.5) * 100,
          height: 40 + Math.random() * 30
        });
      }
    });

    return environments;
  }

  setupOffroadVehicles() {
    const vehicleConfigs = [
      { color: '#8b4513', model: 'Jeep Wrangler', armor: 1.2, mudRating: 1.1 },
      { color: '#006400', model: 'Toyota 4Runner', armor: 1.0, mudRating: 1.0 },
      { color: '#000080', model: 'Land Rover', armor: 1.1, mudRating: 1.2 },
      { color: '#ff4500', model: 'Ford Bronco', armor: 0.95, mudRating: 0.95 },
      { color: '#4b0082', model: 'GMC Jimmy', armor: 1.0, mudRating: 0.9 },
      { color: '#ffd700', model: 'Chevrolet Blazer', armor: 0.9, mudRating: 1.0 },
      { color: '#800000', model: 'Dodge Ram', armor: 1.3, mudRating: 0.85 },
      { color: '#c0c0c0', model: 'Nissan Patrol', armor: 1.0, mudRating: 1.15 }
    ];

    this.players.forEach((player, index) => {
      const config = vehicleConfigs[index % vehicleConfigs.length];
      const startPoint = this.track.startPoint;

      this.cars[player] = {
        name: player,
        model: config.model,
        color: config.color,
        armor: config.armor,
        mudRating: config.mudRating,
        x: startPoint.x - index * 40,
        y: startPoint.y + 15 + index * 20,
        angle: startPoint.angle,
        speed: 0,
        maxSpeed: this.config.maxSpeed * (0.9 + Math.random() * 0.2),
        acceleration: this.config.acceleration,
        braking: this.config.braking,
        turningSpeed: this.config.turningSpeed,
        elevation: 0,
        verticalVelocity: 0,
        airborne: false,
        airborneTimer: 0,
        suspensionCompression: 0,
        damage: 0,
        inMud: false,
        inWater: false,
        onRock: false,
        lap: 0,
        currentCheckpoint: 0,
        lapTime: 0,
        bestLap: Infinity,
        lastLapTime: 0,
        position: index + 1,
        finished: false,
        finishingTime: 0
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

    Object.values(this.cars).forEach(car => {
      this.updateOffroadCar(car, deltaTime);
    });

    this.updateLeaderboard();
    this.checkRaceCompletion();
  }

  updateOffroadCar(car, deltaTime) {
    const input = this.gameState.players[car.name]?.input || {};
    const joystick = input.joystick || { x: 0, y: 0 };

    if (car.airborne) {
      car.airborneTimer += deltaTime;
      car.verticalVelocity += 0.2 * deltaTime;
      car.elevation += car.verticalVelocity * 50;

      if (car.elevation <= 0) {
        car.elevation = 0;
        car.airborne = false;
        car.airborneTimer = 0;
        car.verticalVelocity = 0;
        car.speed *= 0.5;
        this.createLandingEffect(car);
      }

      car.x += Math.cos(car.angle) * car.speed * 0.8;
      car.y += Math.sin(car.angle) * car.speed * 0.8;
      return;
    }

    const terrainData = this.getTerrainData(car);
    const terrainPenalty = this.getTerrainPenalty(car, terrainData);

    if (joystick.y < -0.15) {
      car.speed += car.acceleration * Math.abs(joystick.y) * terrainPenalty;
    }

    if (joystick.y > 0.15) {
      car.speed -= car.braking * joystick.y;
    }

    if (input.brake) {
      car.speed *= 0.97;
      if (car.speed > 5) {
        this.createDustCloud(car);
      }
    }

    if (Math.abs(joystick.x) > 0.1 && Math.abs(car.speed) > 0.3) {
      const turnAmount = joystick.x * car.turningSpeed * Math.min(1, car.speed / 5);
      car.angle += turnAmount;
    }

    car.speed = Math.max(0, Math.min(car.maxSpeed * terrainPenalty, car.speed));
    car.speed *= 0.995;

    if (terrainData.terrain === 'water') {
      car.inWater = true;
      car.speed = Math.min(car.speed, this.config.maxSpeedWater);
      this.createWaterSplash(car);
    } else {
      car.inWater = false;
    }

    if (terrainData.terrain === 'mud') {
      car.inMud = true;
      car.speed *= this.config.mudPenalty;
      car.suspensionCompression = Math.min(1, car.suspensionCompression + 0.02);
      this.createMudParticles(car);
    } else {
      car.inMud = false;
      car.suspensionCompression *= 0.95;
    }

    if (terrainData.onRock) {
      car.onRock = true;
      car.suspensionCompression += 0.03;
      this.createRockClatter(car);
    } else {
      car.onRock = false;
    }

    if (terrainData.steepHill > 0.5) {
      car.speed *= (1 + (terrainData.steepHill - 0.5) * this.config.hillClimbBonus);
    }

    if (terrainData.jump && car.speed > 8) {
      car.airborne = true;
      car.airborneTimer = 0;
      car.verticalVelocity = -car.speed * this.config.jumpForce;
      this.createJumpEffect(car);
    }

    car.x += Math.cos(car.angle) * car.speed;
    car.y += Math.sin(car.angle) * car.speed;

    car.damage += (1 - terrainPenalty) * deltaTime * 0.1;

    car.lapTime += deltaTime;
    this.checkCheckpoints(car);
  }

  getTerrainData(car) {
    let nearestPoint = null;
    let minDist = Infinity;
    let terrain = 'grass';

    this.track.points.forEach(point => {
      const dist = this.distance(car.x, car.y, point.x, point.y);
      if (dist < minDist) {
        minDist = dist;
        nearestPoint = point;
        terrain = point.terrain;
      }
    });

    const onRock = this.environments.rockFields.some(rock => this.distance(car.x, car.y, rock.x, rock.y) < rock.size);

    const inWater = this.environments.waterCrossings.some(water => {
      const dist = this.distance(car.x, car.y, water.x, water.y);
      return dist < water.width / 2;
    });

    const steepHill = this.environments.steepHills.find(hill => this.distance(car.x, car.y, hill.x, hill.y) < 50);

    const jump = nearestPoint && Math.abs(nearestPoint.elevation) > 12;

    return {
      terrain: inWater ? 'water' : terrain,
      onRock: onRock,
      steepHill: steepHill ? steepHill.steepness : 0,
      jump: jump
    };
  }

  getTerrainPenalty(car, terrainData) {
    let penalty = 1;

    if (car.inMud) {
      penalty *= 1 / car.mudRating;
    }

    if (car.inWater) {
      penalty *= 0.5;
    }

    if (car.onRock) {
      penalty *= this.config.rockPenalty;
    }

    if (car.damage > 0.3) {
      penalty *= (1 - car.damage * 0.2);
    }

    return penalty;
  }

  checkCheckpoints(car) {
    const nextCheckpoint = (car.currentCheckpoint + 1) % this.track.checkpoints.length;
    const checkpoint = this.track.checkpoints[nextCheckpoint];
    const dist = this.distance(car.x, car.y, checkpoint.x, checkpoint.y);

    if (dist < 70) {
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

  createMudParticles(car) {
    this.particles.mud.push({
      x: car.x - Math.cos(car.angle) * 15,
      y: car.y - Math.sin(car.angle) * 15,
      vx: -car.speed * 0.2 + (Math.random() - 0.5) * 3,
      vy: -car.speed * 0.2 + (Math.random() - 0.5) * 3,
      life: 1,
      size: 5 + Math.random() * 8,
      color: '#3d2817'
    });
  }

  createDustCloud(car) {
    this.particles.dust.push({
      x: car.x - Math.cos(car.angle) * 20,
      y: car.y - Math.sin(car.angle) * 20,
      vx: -car.velocityX * 0.15,
      vy: -car.velocityY * 0.15,
      life: 0.8,
      size: 15 + Math.random() * 15,
      color: '#d2b48c'
    });
  }

  createWaterSplash(car) {
    this.particles.splash.push({
      x: car.x + (Math.random() - 0.5) * 20,
      y: car.y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 4,
      vy: -Math.random() * 5,
      life: 0.6,
      size: 4 + Math.random() * 6,
      color: '#87ceeb'
    });
  }

  createRockClatter(car) {
    if (Math.random() < 0.3) {
      this.particles.rocks.push({
        x: car.x + (Math.random() - 0.5) * 20,
        y: car.y,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 6,
        life: 0.4,
        size: 2 + Math.random() * 4,
        color: '#696969'
      });
    }
  }

  createJumpEffect(car) {
    for (let i = 0; i < 8; i++) {
      this.particles.dust.push({
        x: car.x,
        y: car.y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 0.5,
        size: 10,
        color: '#d2b48c'
      });
    }
  }

  createLandingEffect(car) {
    for (let i = 0; i < 12; i++) {
      this.particles.mud.push({
        x: car.x + (Math.random() - 0.5) * 30,
        y: car.y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 0.6,
        size: 6 + Math.random() * 8,
        color: '#3d2817'
      });
    }
  }

  updateParticles(deltaTime) {
    this.particles.mud = this.particles.mud.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime;
      return p.life > 0;
    });

    this.particles.dust = this.particles.dust.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime * 0.8;
      p.size += deltaTime * 12;
      return p.life > 0;
    });

    this.particles.splash = this.particles.splash.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3;
      p.life -= deltaTime * 1.5;
      return p.life > 0;
    });

    this.particles.rocks = this.particles.rocks.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4;
      p.life -= deltaTime * 2;
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
      if (a.currentCheckpoint !== b.currentCheckpoint) return b.currentCheckpoint - a.currentCheckpoint;
      return this.distanceToNextCheckpoint(a) - this.distanceToNextCheckpoint(b);
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
    this.drawEnvironments();
    this.drawTrack();
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
    gradient.addColorStop(0.6, '#228b22');
    gradient.addColorStop(1, '#1a5c1a');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#006400';
    this.ctx.font = 'bold 80px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('OFF-ROAD', this.canvas.width / 2, this.canvas.height / 2 - 20);
    this.ctx.font = 'bold 50px Arial';
    this.ctx.fillText('WARRIORS', this.canvas.width / 2, this.canvas.height / 2 + 40);
  }

  drawEnvironments() {
    this.ctx.save();
    this.ctx.translate(-this.camera.x + this.canvas.width / 2, -this.camera.y + this.canvas.height / 2);

    this.environments.trees.forEach(tree => {
      this.ctx.fillStyle = '#8b4513';
      this.ctx.fillRect(tree.x - 5, tree.y - 10, 10, 20);

      this.ctx.fillStyle = '#228b22';
      this.ctx.beginPath();
      this.ctx.moveTo(tree.x, tree.y - tree.height);
      this.ctx.lineTo(tree.x - 20, tree.y - 10);
      this.ctx.lineTo(tree.x + 20, tree.y - 10);
      this.ctx.closePath();
      this.ctx.fill();
    });

    this.environments.mudPools.forEach(mud => {
      this.ctx.fillStyle = `rgba(61, 40, 23, ${0.6 + mud.depth * 0.4})`;
      this.ctx.beginPath();
      this.ctx.arc(mud.x, mud.y, mud.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.environments.waterCrossings.forEach(water => {
      this.ctx.fillStyle = 'rgba(100, 149, 237, 0.7)';
      this.ctx.fillRect(water.x - water.width / 2, water.y - 30, water.width, 60);
    });

    this.ctx.restore();
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

    this.ctx.fillStyle = '#6b8e23';
    this.ctx.fill();

    this.ctx.strokeStyle = '#556b2f';
    this.ctx.lineWidth = this.track.width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();

    this.ctx.strokeStyle = '#8fbc8f';
    this.ctx.lineWidth = 80;
    this.ctx.stroke();

    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([20, 15]);
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
    this.ctx.fillRect(-20, -50, 40, 100);

    this.ctx.fillStyle = '#000';
    const checkSize = 10;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 10; j++) {
        if ((i + j) % 2 === 0) {
          this.ctx.fillRect(-20 + i * checkSize, -50 + j * checkSize, checkSize, checkSize);
        }
      }
    }

    this.ctx.restore();
  }

  drawParticles() {
    this.ctx.save();
    this.ctx.translate(-this.camera.x + this.canvas.width / 2, -this.camera.y + this.canvas.height / 2);

    this.particles.mud.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life * 0.8;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.particles.dust.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life * 0.5;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.particles.splash.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life * 0.7;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.globalAlpha = 1;
    this.ctx.restore();
  }

  drawCars() {
    Object.values(this.cars).forEach(car => {
      this.drawOffroadCar(car);
    });
  }

  drawOffroadCar(car) {
    this.ctx.save();
    this.ctx.translate(car.x, car.y);
    this.ctx.rotate(car.angle);

    if (car.suspensionCompression > 0) {
      this.ctx.translate(0, car.suspensionCompression * 5);
    }

    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(-20, -10, 10, 5);
    this.ctx.fillRect(-20, 5, 10, 5);
    this.ctx.fillRect(12, -10, 10, 5);
    this.ctx.fillRect(12, 5, 10, 5);

    this.ctx.fillStyle = car.color;
    this.ctx.fillRect(-22, -12, 44, 24);

    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(-18, -15, 15, 5);
    this.ctx.fillRect(-18, 10, 15, 5);

    this.ctx.fillStyle = 'rgba(200, 220, 255, 0.4)';
    this.ctx.fillRect(-3, -7, 18, 14);

    this.ctx.fillStyle = '#222';
    this.ctx.fillRect(18, -10, 12, 8);
    this.ctx.fillRect(18, 2, 12, 8);

    this.ctx.restore();

    this.drawCarInfo(car);
  }

  drawCarInfo(car) {
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(car.name, car.x, car.y - 28);

    this.ctx.fillStyle = '#ccc';
    this.ctx.font = '11px Arial';
    this.ctx.fillText(`Lap ${car.lap}/${this.config.totalLaps}`, car.x, car.y + 30);

    const statusText = [];
    if (car.inMud) statusText.push('MUD');
    if (car.inWater) statusText.push('WATER');
    if (car.airborne) statusText.push('AIR');

    if (statusText.length > 0) {
      this.ctx.fillStyle = '#ff6600';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.fillText(statusText.join(' '), car.x, car.y - 40);
    }
  }

  drawUI() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(15, 15, 170, 100);
    this.ctx.strokeStyle = '#00ff00';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(15, 15, 170, 100);

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
      this.ctx.fillText(`Speed: ${Math.round(playerCar.speed * 10)} km/h`, 25, 100);
    }

    this.drawLeaderboard();
  }

  drawLeaderboard() {
    const lbWidth = 170;
    const lbHeight = 30 + Math.min(this.players.length, 4) * 20;
    const lbX = this.canvas.width - lbWidth - 15;
    const lbY = 15;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(lbX, lbY, lbWidth, lbHeight);
    this.ctx.strokeStyle = '#00ff00';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(lbX, lbY, lbWidth, lbHeight);

    this.ctx.fillStyle = '#00ff00';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('STANDINGS', lbX + lbWidth / 2, lbY + 22);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px Arial';

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

      this.ctx.fillStyle = '#00ff00';
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

      this.ctx.fillStyle = '#00ff00';
      this.ctx.font = 'bold 50px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('RACE COMPLETE', this.canvas.width / 2, 80);

      let yPos = 150;
      this.gameState.leaderboard.slice(0, 4).forEach((car, index) => {
        const medal = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;

        this.ctx.fillStyle = index === 0 ? '#ffd700' : '#fff';
        this.ctx.font = 'bold 28px Arial';
        this.ctx.fillText(`${medal} ${car.name}`, this.canvas.width / 2, yPos);

        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Time: ${this.formatTime(car.finishingTime)} | Best: ${this.formatTime(car.bestLap)}`, this.canvas.width / 2, yPos + 30);

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

window.OffRoadWarriors = OffRoadWarriors;