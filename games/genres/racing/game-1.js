// Formula 1 Racing Game - Full Game Implementation
class Formula1Game {
  constructor(canvas, players, gameId) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.players = players;
    this.gameId = gameId;
    this.isRunning = false;
    this.lastTime = 0;
    
    // Canvas setup
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Game Configuration
    this.config = {
      laps: 3,
      pitStopTime: 3,
      maxSpeed: 15,
      acceleration: 0.15,
      braking: 0.3,
      turningSpeed: 0.08,
      trackWidth: 200,
      corneringSpeed: 0.7
    };
    
    // Game State
    this.gameState = {
      players: {},
      time: 0,
      raceTime: 0,
      status: 'waiting',
      lapTimes: {},
      checkpoints: {},
      weather: 'sunny',
      leaderboard: [],
      safetyCar: false
    };
    
    // Track
    this.track = this.generateTrack();
    
    // Cars
    this.cars = {};
    this.setupCars();
    
    // Particles for effects
    this.particles = [];
    this.tireSmoke = [];
    this.exhaustSmoke = [];
    
    // Weather effects
    this.weatherParticles = [];
    
    // UI
    this.camera = { x: 0, y: 0 };
    this.showLeaderboard = true;
    this.countdown = 3;
    this.countdownTimer = 0;
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  generateTrack() {
    const points = [];
    const numPoints = 20;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radiusX = this.canvas.width * 0.4;
    const radiusY = this.canvas.height * 0.4;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const variation = Math.sin(angle * 3) * 50 + Math.cos(angle * 2) * 30;
      points.push({
        x: centerX + Math.cos(angle) * (radiusX + variation),
        y: centerY + Math.sin(angle) * (radiusY + variation)
      });
    }
    
    return {
      points: points,
      width: this.config.trackWidth,
      startLine: { x: points[0].x, y: points[0].y, angle: this.getAngle(points[1], points[0]) },
      checkpoints: points.map((p, i) => ({ x: p.x, y: p.y, passed: false }))
    };
  }
  
  getAngle(p1, p2) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  }
  
  setupCars() {
    const carColors = ['#ff0000', '#0066cc', '#ff6600', '#00cc00', '#cc00ff', '#ffff00', '#00ffff', '#ff00ff'];
    const carModels = ['Ferrari', 'Mercedes', 'Red Bull', 'McLaren', 'Ferrari', 'Mercedes', 'Red Bull', 'McLaren'];
    
    this.players.forEach((player, index) => {
      const startPos = this.track.points[0];
      this.cars[player] = {
        name: player,
        x: startPos.x - (index * 30) - 30,
        y: startPos.y + 20,
        angle: this.track.startLine.angle,
        speed: 0,
        maxSpeed: this.config.maxSpeed,
        acceleration: this.config.acceleration,
        braking: this.config.braking,
        turningSpeed: this.config.turningSpeed,
        color: carColors[index % carColors.length],
        model: carModels[index % carModels.length],
        lap: 0,
        currentCheckpoint: 0,
        lapTimes: [],
        bestLap: Infinity,
        lastLapTime: 0,
        pitStop: false,
        pitStopTimer: 0,
        tireWear: 0,
        fuel: 100,
        engineTemperature: 0,
        position: index + 1,
        finished: false,
        finishingTime: 0
      };
      
      this.gameState.players[player] = player;
      this.gameState.lapTimes[player] = [];
      this.gameState.checkpoints[player] = new Array(this.track.checkpoints.length).fill(false);
    });
  }
  
  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameState.status = 'countdown';
    this.countdownTimer = 0;
    this.gameLoop(this.lastTime);
  }
  
  stop() {
    this.isRunning = false;
  }
  
  gameLoop(currentTime) {
    if (!this.isRunning) return;
    
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    if (this.gameState.status === 'countdown') {
      this.countdownTimer += deltaTime;
      if (this.countdownTimer >= 1) {
        this.countdownTimer = 0;
        this.countdown--;
        if (this.countdown <= 0) {
          this.gameState.status = 'racing';
        }
      }
    }
    
    if (this.gameState.status === 'racing') {
      this.update(deltaTime);
    }
    
    this.render();
    
    requestAnimationFrame((time) => this.gameLoop(time));
  }
  
  update(deltaTime) {
    this.gameState.time += deltaTime;
    this.gameState.raceTime += deltaTime;
    
    // Update each car
    Object.values(this.cars).forEach(car => {
      this.updateCar(car, deltaTime);
    });
    
    // Update particles
    this.updateParticles(deltaTime);
    
    // Update leaderboard
    this.updateLeaderboard();
    
    // Check for race finish
    this.checkRaceFinish();
  }
  
  updateCar(car, deltaTime) {
    if (car.finished) return;
    
    if (car.pitStop) {
      car.pitStopTimer += deltaTime;
      car.speed *= 0.95;
      if (car.pitStopTimer >= this.config.pitStopTime) {
        car.pitStop = false;
        car.pitStopTimer = 0;
        car.fuel = 100;
        car.tireWear = 0;
      }
      return;
    }
    
    // Get player input
    const player = this.gameState.players[car.name];
    const input = this.getPlayerInput(car.name);
    
    // Acceleration / Braking
    if (input.joystick) {
      if (input.joystick.y < -0.2) {
        car.speed += car.acceleration * Math.abs(input.joystick.y);
      }
      if (input.joystick.y > 0.2) {
        car.speed -= car.braking * input.joystick.y;
      }
      
      // Turning
      if (Math.abs(input.joystick.x) > 0.2) {
        const turnAmount = input.joystick.x * car.turningSpeed * (car.speed / car.maxSpeed);
        car.angle += turnAmount;
      }
    }
    
    if (input.brake) {
      car.speed *= 0.95;
    }
    
    if (input.nitro && car.fuel > 0) {
      car.speed += car.acceleration * 1.5;
      car.fuel -= 0.5;
      this.createExhaustSmoke(car);
    }
    
    // Speed limits
    car.speed = Math.max(0, Math.min(car.maxSpeed, car.speed));
    
    // Apply movement
    car.x += Math.cos(car.angle) * car.speed;
    car.y += Math.sin(car.angle) * car.speed;
    
    // Track boundary check
    this.checkTrackBoundaries(car);
    
    // Checkpoint detection
    this.checkCheckpoints(car);
    
    // Tire wear and temperature
    car.tireWear += car.speed * deltaTime * 0.01;
    car.engineTemperature += car.speed * deltaTime * 0.5;
    
    // Create tire smoke
    if (car.tireWear > 0.5 || Math.abs(car.speed) > 10) {
      this.createTireSmoke(car);
    }
    
    // Lap timing
    car.lastLapTime += deltaTime;
  }
  
  getPlayerInput(playerName) {
    const input = this.gameState.players[playerName];
    return input ? input.input || {} : {};
  }
  
  checkTrackBoundaries(car) {
    let onTrack = false;
    const carPoint = { x: car.x, y: car.y };
    
    for (let i = 0; i < this.track.points.length; i++) {
      const p1 = this.track.points[i];
      const p2 = this.track.points[(i + 1) % this.track.points.length];
      const dist = this.pointToLineDistance(carPoint, p1, p2);
      
      if (dist < this.track.width / 2) {
        onTrack = true;
        break;
      }
    }
    
    if (!onTrack) {
      car.speed *= 0.9;
    }
  }
  
  pointToLineDistance(point, lineStart, lineEnd) {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }
    
    return Math.sqrt((point.x - xx) ** 2 + (point.y - yy) ** 2);
  }
  
  checkCheckpoints(car) {
    const nextCheckpoint = (car.currentCheckpoint + 1) % this.track.checkpoints.length;
    const checkpoint = this.track.checkpoints[nextCheckpoint];
    const dist = this.distance(car.x, car.y, checkpoint.x, checkpoint.y);
    
    if (dist < 50) {
      car.currentCheckpoint = nextCheckpoint;
      
      if (nextCheckpoint === 0) {
        car.lap++;
        car.lapTimes.push(car.lastLapTime);
        this.gameState.lapTimes[car.name].push(car.lastLapTime);
        
        if (car.lastLapTime < car.bestLap) {
          car.bestLap = car.lastLapTime;
        }
        
        if (car.lap >= this.config.laps) {
          car.finished = true;
          car.finishingTime = this.gameState.raceTime;
        }
        
        car.lastLapTime = 0;
      }
    }
  }
  
  updateLeaderboard() {
    this.gameState.leaderboard = Object.values(this.cars).sort((a, b) => {
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      if (a.finished && b.finished) return a.finishingTime - b.finishingTime;
      if (a.lap !== b.lap) return b.lap - a.lap;
      return b.currentCheckpoint - a.currentCheckpoint;
    });
    
    this.gameState.leaderboard.forEach((car, index) => {
      car.position = index + 1;
    });
  }
  
  checkRaceFinish() {
    const allFinished = Object.values(this.cars).every(car => car.finished);
    if (allFinished) {
      this.gameState.status = 'finished';
      this.renderGameOver();
    }
  }
  
  createTireSmoke(car) {
    this.tireSmoke.push({
      x: car.x - Math.cos(car.angle) * 15,
      y: car.y - Math.sin(car.angle) * 15,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 1,
      size: Math.random() * 10 + 5
    });
  }
  
  createExhaustSmoke(car) {
    this.exhaustSmoke.push({
      x: car.x - Math.cos(car.angle) * 25,
      y: car.y - Math.sin(car.angle) * 25,
      vx: -Math.cos(car.angle) * 5,
      vy: -Math.sin(car.angle) * 5,
      life: 0.5,
      size: Math.random() * 8 + 3
    });
  }
  
  updateParticles(deltaTime) {
    this.tireSmoke = this.tireSmoke.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime;
      p.size += deltaTime * 5;
      return p.life > 0;
    });
    
    this.exhaustSmoke = this.exhaustSmoke.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime * 2;
      p.size += deltaTime * 3;
      return p.life > 0;
    });
  }
  
  distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }
  
  render() {
    // Clear and draw background
    this.ctx.fillStyle = '#2d5a27';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grass pattern
    this.drawGrassPattern();
    
    // Draw track
    this.drawTrack();
    
    // Draw particles
    this.drawParticles();
    
    // Draw cars
    Object.values(this.cars).forEach(car => this.drawCar(car));
    
    // Draw UI
    this.drawUI();
    
    // Draw countdown
    if (this.gameState.status === 'countdown') {
      this.drawCountdown();
    }
  }
  
  drawGrassPattern() {
    this.ctx.fillStyle = '#1e4d1a';
    for (let x = 0; x < this.canvas.width; x += 40) {
      for (let y = 0; y < this.canvas.height; y += 40) {
        if ((x + y) % 80 === 0) {
          this.ctx.fillRect(x, y, 40, 40);
        }
      }
    }
  }
  
  drawTrack() {
    // Draw track surface
    this.ctx.beginPath();
    this.ctx.moveTo(this.track.points[0].x, this.track.points[0].y);
    
    for (let i = 1; i < this.track.points.length; i++) {
      this.ctx.lineTo(this.track.points[i].x, this.track.points[i].y);
    }
    this.ctx.closePath();
    
    this.ctx.strokeStyle = '#555';
    this.ctx.lineWidth = this.track.width;
    this.ctx.stroke();
    
    // Draw track lines
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([30, 20]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    
    // Draw start/finish line
    const start = this.track.points[0];
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(start.x - 10, start.y - this.track.width / 2, 20, this.track.width);
    
    // Draw checkered pattern on start line
    this.ctx.fillStyle = '#000';
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 2; j++) {
        if ((i + j) % 2 === 0) {
          this.ctx.fillRect(start.x - 10 + i * 5, start.y - this.track.width / 2 + j * (this.track.width / 8), 5, this.track.width / 8);
        }
      }
    }
  }
  
  drawParticles() {
    // Draw tire smoke
    this.tireSmoke.forEach(p => {
      this.ctx.fillStyle = `rgba(150, 150, 150, ${p.life * 0.5})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    // Draw exhaust smoke
    this.exhaustSmoke.forEach(p => {
      this.ctx.fillStyle = `rgba(100, 100, 100, ${p.life * 0.7})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawCar(car) {
    this.ctx.save();
    this.ctx.translate(car.x, car.y);
    this.ctx.rotate(car.angle);
    
    // Car body
    this.ctx.fillStyle = car.color;
    this.ctx.fillRect(-20, -10, 40, 20);
    
    // Front wing
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(15, -12, 10, 4);
    this.ctx.fillRect(15, 8, 10, 4);
    
    // Rear wing
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(-20, -14, 5, 28);
    this.ctx.fillRect(-22, -14, 7, 3);
    this.ctx.fillRect(-22, 11, 7, 3);
    
    // Wheels
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(10, -12, 8, 4);
    this.ctx.fillRect(10, 8, 8, 4);
    this.ctx.fillRect(-15, -12, 8, 4);
    this.ctx.fillRect(-15, 8, 8, 4);
    
    // Driver helmet
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 5, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Position number
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.fillText(car.position, -5, 4);
    
    this.ctx.restore();
    
    // Player name
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(car.name, car.x, car.y - 25);
    
    // Lap counter
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = '12px Arial';
    this.ctx.fillText(`Lap: ${car.lap}/${this.config.laps}`, car.x, car.y + 30);
  }
  
  drawUI() {
    // Race time
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 10, 150, 40);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Vaqt: ${this.formatTime(this.gameState.raceTime)}`, 20, 38);
    
    // Leaderboard
    if (this.showLeaderboard) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(this.canvas.width - 200, 10, 190, 30 + this.players.length * 25);
      
      this.ctx.fillStyle = '#ffd93d';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.textAlign = 'right';
      this.ctx.fillText('Liderlar:', this.canvas.width - 20, 32);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '14px Arial';
      
      this.gameState.leaderboard.forEach((car, index) => {
        const y = 55 + index * 22;
        this.ctx.fillStyle = index === 0 ? '#ffd93d' : '#fff';
        this.ctx.fillText(`${car.position}. ${car.name}`, this.canvas.width - 20, y);
        this.ctx.fillText(this.formatTime(car.finished ? car.finishingTime : this.gameState.raceTime), this.canvas.width - 150, y);
      });
    }
  }
  
  drawCountdown() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 150px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.countdown > 0 ? this.countdown : 'GO!', this.canvas.width / 2, this.canvas.height / 2 + 50);
  }
  
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }
  
  renderGameOver() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 60px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Poyga Tugadi!', this.canvas.width / 2, 100);
    
    let y = 180;
    this.gameState.leaderboard.forEach((car, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      this.ctx.fillStyle = index === 0 ? '#ffd93d' : '#fff';
      this.ctx.font = 'bold 30px Arial';
      this.ctx.fillText(`${medal} ${car.name}`, this.canvas.width / 2, y);
      
      this.ctx.font = '20px Arial';
      this.ctx.fillText(`Vaqt: ${this.formatTime(car.finishingTime)} | Lap: ${car.lap}`, this.canvas.width / 2, y + 35);
      
      y += 80;
    });
  }
  
  updatePlayerInput(playerName, input) {
    this.gameState.players[playerName] = { name: playerName, input: input };
  }
}

window.Formula1Game = Formula1Game;