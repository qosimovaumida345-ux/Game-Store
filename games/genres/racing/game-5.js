// Drift Kings - Drift Racing with Scoring, Combo System, and Tire Smoke
class DriftKings {
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
      totalTime: 120,
      maxSpeed: 14,
      acceleration: 0.15,
      braking: 0.35,
      driftGrip: 0.4,
      maxDriftAngle: 70,
      comboMultiplier: 1.5,
      angleScoreMultiplier: 3,
      speedScoreMultiplier: 2,
      gripRecoveryRate: 0.02,
      handbrakeDriftBonus: 1.2
    };

    this.gameState = {
      players: {},
      gameTime: 0,
      status: 'countdown',
      score: 0,
      currentCombo: 0,
      maxCombo: 0,
      totalScore: 0,
      leaderboard: [],
      checkpoints: [],
      driftZones: [],
      judgeScores: []
    };

    this.track = this.generateDriftTrack();
    this.cars = {};
    this.setupDriftCars();
    this.particles = {
      tireSmoke: [],
      sparks: [],
      tireMarks: []
    };
    this.countdown = { value: 3, timer: 0 };
    this.camera = { x: 0, y: 0, angle: 0 };
    this.driftSession = null;
    this.gamePhase = 'countdown';
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 1200;
    this.canvas.height = this.canvas.parentElement.clientHeight || 800;
  }

  generateDriftTrack() {
    const points = [];
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = Math.min(this.canvas.width, this.canvas.height) * 0.35;

    const trackShape = [
      { r: 1.0, a: 0 }, { r: 1.2, a: 0.5 }, { r: 1.4, a: 1.0 },
      { r: 1.3, a: 1.5 }, { r: 1.0, a: 2.0 }, { r: 0.7, a: 2.5 },
      { r: 0.8, a: 3.0 }, { r: 1.2, a: 3.5 }, { r: 1.4, a: 4.0 },
      { r: 1.2, a: 4.5 }, { r: 0.9, a: 5.0 }, { r: 0.7, a: 5.5 },
      { r: 0.9, a: 6.0 }
    ];

    trackShape.forEach(t => {
      points.push({
        x: centerX + Math.cos(t.a) * radius * t.r,
        y: centerY + Math.sin(t.a) * radius * t.r,
        angle: t.a
      });
    });

    const driftZones = this.generateDriftZones(points);

    return {
      points: points,
      width: 150,
      driftZones: driftZones,
      startPoint: { x: points[0].x, y: points[0].y + 30, angle: Math.PI / 2 }
    };
  }

  generateDriftZones(trackPoints) {
    const zones = [];
    const zoneCount = 8;

    for (let i = 0; i < zoneCount; i++) {
      const pointIndex = Math.floor((i / zoneCount) * trackPoints.length * 0.8) + 10;
      const point = trackPoints[pointIndex % trackPoints.length];
      const nextPoint = trackPoints[(pointIndex + 1) % trackPoints.length];

      zones.push({
        x: point.x,
        y: point.y,
        radius: 60 + Math.random() * 30,
        angle: Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x),
        multiplier: 1 + Math.random() * 1.5,
        type: i % 3 === 0 ? 'hairpin' : i % 3 === 1 ? 'sweeper' : 'chicane',
        bonusText: i % 3 === 0 ? 'Hairpin!' : i % 3 === 1 ? 'Sweeper!' : 'Chicane!'
      });
    }

    return zones;
  }

  setupDriftCars() {
    const carConfigs = [
      { color: '#ff0000', model: 'Nissan 350Z', driftRating: 95 },
      { color: '#ff6600', model: 'Toyota Supra', driftRating: 92 },
      { color: '#0000ff', model: 'Mazda RX-7', driftRating: 90 },
      { color: '#00ff00', model: 'BMW M3', driftRating: 88 },
      { color: '#ffff00', model: 'Ford Mustang', driftRating: 85 },
      { color: '#ff00ff', model: 'Honda S2000', driftRating: 87 },
      { color: '#00ffff', model: 'Nissan Silvia', driftRating: 94 },
      { color: '#ff9900', model: 'Chevrolet Camaro', driftRating: 82 }
    ];

    this.players.forEach((player, index) => {
      const config = carConfigs[index % carConfigs.length];
      const startPoint = this.track.startPoint;

      this.cars[player] = {
        name: player,
        model: config.model,
        color: config.color,
        driftRating: config.driftRating,
        x: startPoint.x - index * 40,
        y: startPoint.y + 20,
        angle: startPoint.angle,
        velocity: { x: 0, y: 0 },
        speed: 0,
        maxSpeed: this.config.maxSpeed * (0.9 + Math.random() * 0.2),
        driftAngle: 0,
        isDrifting: false,
        driftScore: 0,
        currentCombo: 0,
        comboTimer: 0,
        totalScore: 0,
        handbrake: false,
        grip: 1,
        position: index + 1,
        spinout: false,
        spinTimer: 0,
        checkpointsPassed: 0,
        bestDrift: 0
      };

      this.gameState.players[player] = { input: {} };
    });

    this.gameState.driftZones = this.track.driftZones;
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameState.status = 'countdown';
    this.gamePhase = 'countdown';
    this.gameLoop(this.lastTime);
  }

  stop() {
    this.isRunning = false;
  }

  gameLoop(currentTime) {
    if (!this.isRunning) return;

    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;

    if (this.gamePhase === 'countdown') {
      this.countdown.timer += deltaTime;
      if (this.countdown.timer >= 1) {
        this.countdown.timer = 0;
        this.countdown.value--;
        if (this.countdown.value < 0) {
          this.gamePhase = 'racing';
          this.gameState.status = 'racing';
        }
      }
    }

    if (this.gamePhase === 'racing') {
      this.update(deltaTime);
      this.updateCamera();
    }

    this.render();
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  update(deltaTime) {
    this.gameState.gameTime += deltaTime;

    if (this.gameState.gameTime >= this.config.totalTime) {
      this.gamePhase = 'finished';
      this.gameState.status = 'finished';
    }

    this.updateParticles(deltaTime);

    Object.values(this.cars).forEach(car => {
      this.updateDriftCar(car, deltaTime);
    });

    this.updateLeaderboard();
  }

  updateDriftCar(car, deltaTime) {
    if (car.spinout) {
      car.spinTimer -= deltaTime;
      car.speed *= 0.92;
      car.angle += deltaTime * 5 * (car.spinout === 'left' ? 1 : -1);

      if (car.spinTimer <= 0) {
        car.spinout = false;
        car.spinTimer = 0;
      }
      return;
    }

    const input = this.gameState.players[car.name]?.input || {};
    const joystick = input.joystick || { x: 0, y: 0 };

    if (joystick.y < -0.1) {
      car.speed += this.config.acceleration * Math.abs(joystick.y) * car.grip;
    }

    if (joystick.y > 0.1) {
      car.speed -= this.config.braking * joystick.y;
    }

    if (input.brake || input.handbrake) {
      car.handbrake = true;
    } else {
      car.handbrake = false;
    }

    if (Math.abs(joystick.x) > 0.05) {
      const turnRate = 0.06 * Math.abs(joystick.x);

      if (car.handbrake && car.speed > 3) {
        const driftBonus = this.config.handbrakeDriftBonus;
        car.angle += turnRate * driftBonus * Math.sign(joystick.x);
        car.driftAngle = Math.max(-this.config.maxDriftAngle, Math.min(this.config.maxDriftAngle, car.driftAngle + joystick.x * 40));
      } else {
        car.angle += turnRate * Math.sign(joystick.x);
        car.driftAngle = car.driftAngle * 0.9;
      }
    } else {
      car.driftAngle *= 0.92;
    }

    car.speed = Math.max(0, Math.min(car.maxSpeed, car.speed));

    if (car.handbrake && car.speed > 5) {
      car.isDrifting = true;
      car.grip = this.config.driftGrip;
      car.driftAngle = Math.max(-this.config.maxDriftAngle, Math.min(this.config.maxDriftAngle, car.driftAngle + joystick.x * 30));
    } else {
      car.isDrifting = Math.abs(car.driftAngle) > 15 && car.speed > 5;
      car.grip = Math.min(1, car.grip + this.config.gripRecoveryRate);
    }

    car.velocity.x = Math.cos(car.angle) * car.speed + Math.sin(car.driftAngle * Math.PI / 180) * car.speed * 0.3;
    car.velocity.y = Math.sin(car.angle) * car.speed - Math.cos(car.driftAngle * Math.PI / 180) * car.speed * 0.3;

    car.x += car.velocity.x;
    car.y += car.velocity.y;

    if (car.isDrifting) {
      this.createTireSmoke(car);
      this.createTireMarks(car);
      this.calculateDriftScore(car, deltaTime);
    }

    if (Math.abs(car.driftAngle) > 60 && Math.random() < 0.02) {
      this.initiateSpinout(car);
    }

    this.checkDriftZones(car);
    this.checkTrackBoundaries(car);
  }

  calculateDriftScore(car, deltaTime) {
    const angleScore = Math.abs(car.driftAngle) / this.config.maxDriftAngle;
    const speedScore = car.speed / car.maxSpeed;
    const comboMultiplier = 1 + (car.currentCombo / 10);

    const frameScore = (angleScore * this.config.angleScoreMultiplier + speedScore * this.config.speedScoreMultiplier) * comboMultiplier * deltaTime * 10;

    car.driftScore += frameScore;

    if (car.driftScore > 100) {
      car.currentCombo++;
      car.driftScore = 0;
      car.comboTimer = 2;
      car.maxCombo = Math.max(car.maxCombo, car.currentCombo);
      car.bestDrift = Math.max(car.bestDrift, frameScore);
    }

    if (car.comboTimer > 0) {
      car.comboTimer -= deltaTime;
    } else {
      car.totalScore += car.currentCombo * 100;
      car.currentCombo = 0;
      car.driftScore = 0;
    }
  }

  initiateSpinout(car) {
    car.spinout = Math.random() < 0.5 ? 'left' : 'right';
    car.spinTimer = 1.5;
    car.currentCombo = 0;
    car.driftScore = 0;
  }

  checkDriftZones(car) {
    this.gameState.driftZones.forEach(zone => {
      const dist = this.distance(car.x, car.y, zone.x, zone.y);

      if (dist < zone.radius && car.isDrifting) {
        car.driftScore *= (1 + zone.multiplier * 0.01);
      }
    });
  }

  checkTrackBoundaries(car) {
    let minDist = Infinity;

    this.track.points.forEach(point => {
      const dist = this.distance(car.x, car.y, point.x, point.y);
      minDist = Math.min(minDist, dist);
    });

    if (minDist > this.track.width && car.speed > 8) {
      car.speed *= 0.97;
    }
  }

  createTireSmoke(car) {
    const smokeAmount = Math.abs(car.driftAngle) / 30;

    for (let i = 0; i < smokeAmount; i++) {
      this.particles.tireSmoke.push({
        x: car.x - Math.cos(car.angle) * 15 + (Math.random() - 0.5) * 10,
        y: car.y - Math.sin(car.angle) * 15 + (Math.random() - 0.5) * 10,
        vx: -car.velocity.x * 0.1 + (Math.random() - 0.5) * 2,
        vy: -car.velocity.y * 0.1 + (Math.random() - 0.5) * 2,
        life: 1.5,
        size: 8 + Math.random() * 12,
        color: `rgba(${150 + Math.random() * 50}, ${150 + Math.random() * 50}, ${150}, 0.6)`
      });
    }
  }

  createTireMarks(car) {
    if (car.speed > 3) {
      this.particles.tireMarks.push({
        x: car.x - 10,
        y: car.y,
        angle: car.angle,
        life: 10,
        opacity: Math.min(1, Math.abs(car.driftAngle) / 45)
      });
    }
  }

  updateParticles(deltaTime) {
    this.particles.tireSmoke = this.particles.tireSmoke.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime * 0.8;
      p.size += deltaTime * 10;
      return p.life > 0;
    });

    this.particles.tireMarks = this.particles.tireMarks.filter(p => {
      p.life -= deltaTime * 0.1;
      return p.life > 0;
    });
  }

  updateCamera() {
    const playerCar = this.cars[this.players[0]];
    if (playerCar) {
      const targetX = playerCar.x;
      const targetY = playerCar.y;

      this.camera.x += (targetX - this.camera.x) * 0.08;
      this.camera.y += (targetY - this.camera.y) * 0.08;
    }
  }

  updateLeaderboard() {
    this.gameState.leaderboard = Object.values(this.cars).sort((a, b) => {
      return b.totalScore - a.totalScore;
    });

    this.gameState.leaderboard.forEach((car, index) => {
      car.position = index + 1;
    });

    const playerCar = this.cars[this.players[0]];
    if (playerCar) {
      this.gameState.score = playerCar.totalScore;
      this.gameState.currentCombo = playerCar.currentCombo;
    }
  }

  distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  render() {
    this.drawBackground();
    this.drawTrack();
    this.drawTireMarks();
    this.drawDriftZones();
    this.drawParticles();
    this.drawCars();
    this.drawUI();
    this.drawCountdown();
    this.drawResults();
  }

  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#2c3e50');
    gradient.addColorStop(1, '#1a252f');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#34495e';
    for (let x = 0; x < this.canvas.width; x += 50) {
      for (let y = 0; y < this.canvas.height; y += 50) {
        this.ctx.beginPath();
        this.ctx.arc(x + 25, y + 25, 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    this.ctx.fillStyle = '#f39c12';
    this.ctx.font = 'bold 100px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('DRIFT', this.canvas.width / 2, this.canvas.height / 2 - 20);
    this.ctx.font = 'bold 60px Arial';
    this.ctx.fillText('KINGS', this.canvas.width / 2, this.canvas.height / 2 + 50);
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

    this.ctx.fillStyle = '#4a4a4a';
    this.ctx.fill();

    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = this.track.width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();

    this.ctx.strokeStyle = '#888';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([25, 15]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    this.ctx.restore();
  }

  drawTireMarks() {
    this.ctx.save();
    this.ctx.translate(-this.camera.x + this.canvas.width / 2, -this.camera.y + this.canvas.height / 2);

    this.particles.tireMarks.forEach(mark => {
      this.ctx.fillStyle = `rgba(30, 30, 30, ${mark.opacity * 0.5})`;
      this.ctx.beginPath();
      this.ctx.arc(mark.x, mark.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.restore();
  }

  drawDriftZones() {
    this.ctx.save();
    this.ctx.translate(-this.camera.x + this.canvas.width / 2, -this.camera.y + this.canvas.height / 2);

    this.gameState.driftZones.forEach(zone => {
      const gradient = this.ctx.createRadialGradient(zone.x, zone.y, 0, zone.x, zone.y, zone.radius);
      gradient.addColorStop(0, `rgba(255, 200, 0, ${0.2 * zone.multiplier})`);
      gradient.addColorStop(0.7, `rgba(255, 100, 0, ${0.1 * zone.multiplier})`);
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#ffd700';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(zone.bonusText, zone.x, zone.y - zone.radius - 10);
    });

    this.ctx.restore();
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

    this.ctx.globalAlpha = 1;
    this.ctx.restore();
  }

  drawCars() {
    Object.values(this.cars).forEach(car => {
      this.drawDriftCar(car);
    });
  }

  drawDriftCar(car) {
    this.ctx.save();
    this.ctx.translate(car.x, car.y);
    this.ctx.rotate(car.angle);

    if (car.isDrifting) {
      this.ctx.rotate(car.driftAngle * Math.PI / 180);
    }

    this.ctx.fillStyle = '#222';
    this.ctx.fillRect(-18, -9, 8, 4);
    this.ctx.fillRect(-18, 5, 8, 4);
    this.ctx.fillRect(12, -9, 8, 4);
    this.ctx.fillRect(12, 5, 8, 4);

    this.ctx.fillStyle = car.color;
    this.ctx.beginPath();
    this.ctx.moveTo(-22, -8);
    this.ctx.lineTo(15, -8);
    this.ctx.lineTo(20, -5);
    this.ctx.lineTo(20, 5);
    this.ctx.lineTo(15, 8);
    this.ctx.lineTo(-22, 8);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(-20, -12, 25, 3);
    this.ctx.fillRect(-20, 9, 25, 3);

    this.ctx.fillStyle = 'rgba(200, 200, 255, 0.4)';
    this.ctx.fillRect(-5, -5, 15, 10);

    this.ctx.restore();

    this.drawCarInfo(car);
  }

  drawCarInfo(car) {
    this.ctx.fillStyle = car.isDrifting ? '#ffd700' : '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${car.totalScore}`, car.x, car.y - 28);

    this.ctx.fillStyle = '#ccc';
    this.ctx.font = '11px Arial';
    this.ctx.fillText(car.name, car.x, car.y + 25);

    if (car.currentCombo > 0) {
      this.ctx.fillStyle = '#00ff00';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.fillText(`x${car.currentCombo}`, car.x, car.y - 40);
    }

    if (car.isDrifting) {
      this.ctx.fillStyle = '#ffd700';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.fillText('DRIFTING!', car.x, car.y + 38);
    }
  }

  drawUI() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(15, 15, 180, 100);
    this.ctx.strokeStyle = '#ffd700';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(15, 15, 180, 100);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';

    const timeLeft = Math.max(0, this.config.totalTime - this.gameState.gameTime);
    this.ctx.fillText(`Time: ${Math.floor(timeLeft)}s`, 25, 38);

    const playerCar = this.cars[this.players[0]];
    if (playerCar) {
      this.ctx.fillStyle = '#ffd700';
      this.ctx.font = 'bold 24px Arial';
      this.ctx.fillText(`Score: ${playerCar.totalScore}`, 25, 65);

      this.ctx.fillStyle = '#00ff00';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.fillText(`Combo: x${playerCar.currentCombo}`, 25, 90);

      this.ctx.fillStyle = '#ff0000';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.fillText(`Best: ${Math.floor(playerCar.bestDrift)}`, 120, 90);
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
    this.ctx.strokeStyle = '#ffd700';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(lbX, lbY, lbWidth, lbHeight);

    this.ctx.fillStyle = '#ffd700';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('LEADERBOARD', lbX + lbWidth / 2, lbY + 22);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px Arial';

    this.gameState.leaderboard.slice(0, 4).forEach((car, index) => {
      const y = lbY + 42 + index * 18;
      this.ctx.fillStyle = index === 0 ? '#ffd700' : '#fff';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`${car.position}. ${car.name}`, lbX + 10, y);
      this.ctx.textAlign = 'right';
      this.ctx.fillText(`${car.totalScore}`, lbX + lbWidth - 10, y);
      this.ctx.textAlign = 'left';
    });
  }

  drawCountdown() {
    if (this.gamePhase === 'countdown' && this.countdown.value >= 0) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.fillStyle = '#ffd700';
      this.ctx.font = 'bold 180px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      const text = this.countdown.value > 0 ? this.countdown.value.toString() : 'GO!';
      this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);

      this.ctx.textBaseline = 'alphabetic';
    }
  }

  drawResults() {
    if (this.gamePhase === 'finished') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.fillStyle = '#ffd700';
      this.ctx.font = 'bold 50px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('FINAL RESULTS', this.canvas.width / 2, 80);

      let yPos = 150;
      this.gameState.leaderboard.forEach((car, index) => {
        const medal = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;

        this.ctx.fillStyle = index === 0 ? '#ffd700' : '#fff';
        this.ctx.font = 'bold 30px Arial';
        this.ctx.fillText(`${medal} ${car.name}`, this.canvas.width / 2, yPos);

        this.ctx.font = '18px Arial';
        this.ctx.fillText(`Score: ${car.totalScore} | Max Combo: x${car.maxCombo}`, this.canvas.width / 2, yPos + 35);

        yPos += 80;
      });
    }
  }

  updatePlayerInput(playerName, input) {
    if (this.gameState.players[playerName]) {
      this.gameState.players[playerName].input = input;
    }
  }
}

window.DriftKings = DriftKings;