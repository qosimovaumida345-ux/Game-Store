// Formula Racing Game
class FormulaRacingGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.players = players;
    this.gameId = gameId;
    this.isRunning = false;
    this.lastTime = 0;
    
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    this.gameState = {
      time: 0,
      laps: 3,
      currentLap: 1,
      lapTimes: [],
      status: 'racing',
      cars: [
        { x: 400, y: 550, angle: -Math.PI/2, speed: 0, lap: 1, checkpoint: 0, bestLap: Infinity },
        { x: 400, y: 590, angle: -Math.PI/2, speed: 0, lap: 1, checkpoint: 0, bestLap: Infinity }
      ],
      track: [],
      gameOver: false,
      winner: null
    };
    
    this.config = {
      maxSpeed: 10,
      acceleration: 0.2,
      braking: 0.3,
      turnSpeed: 0.04,
      friction: 0.98
    };
    
    this.generateTrack();
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  generateTrack() {
    this.gameState.track = [];
    
    const trackPoints = [
      { x: 400, y: 550, cp: 0 }, { x: 650, y: 500, cp: 0 }, { x: 750, y: 350, cp: 0 },
      { x: 700, y: 200, cp: 1 }, { x: 500, y: 100, cp: 1 }, { x: 300, y: 100, cp: 1 },
      { x: 100, y: 200, cp: 2 }, { x: 50, y: 350, cp: 2 }, { x: 100, y: 500, cp: 2 },
      { x: 250, y: 550, cp: 2 }, { x: 400, y: 550, cp: 3 }
    ];
    
    for (let i = 0; i < trackPoints.length; i++) {
      const p1 = trackPoints[i];
      const p2 = trackPoints[(i + 1) % trackPoints.length];
      
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.floor(dist / 5);
      
      for (let j = 0; j < steps; j++) {
        const t = j / steps;
        this.gameState.track.push({
          x: p1.x + dx * t,
          y: p1.y + dy * t,
          cp: p1.cp,
          angle: Math.atan2(dy, dx),
          index: i * steps + j
        });
      }
    }
  }
  
  initGame() {
    this.gameState.cars[0].x = 380;
    this.gameState.cars[0].y = 520;
    this.gameState.cars[1].x = 380;
    this.gameState.cars[1].y = 580;
  }
  
  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }
  
  stop() { this.isRunning = false; }
  
  gameLoop(currentTime) {
    if (!this.isRunning) return;
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    this.update(deltaTime);
    this.render();
    requestAnimationFrame((time) => this.gameLoop(time));
  }
  
  update(deltaTime) {
    if (this.gameState.gameOver) return;
    
    this.gameState.time += deltaTime;
    
    this.gameState.cars.forEach((car, i) => {
      const input = this.getPlayerInput(this.players[i]);
      
      if (input.up) car.speed += this.config.acceleration;
      if (input.down) car.speed -= this.config.braking;
      
      car.speed = Math.max(0, Math.min(this.config.maxSpeed, car.speed));
      car.speed *= this.config.friction;
      
      if (Math.abs(car.speed) > 0.5) {
        if (input.left) car.angle -= this.config.turnSpeed;
        if (input.right) car.angle += this.config.turnSpeed;
      }
      
      car.x += Math.cos(car.angle) * car.speed;
      car.y += Math.sin(car.angle) * car.speed;
      
      this.checkTrackLimits(car);
      this.checkCheckpoints(car);
    });
  }
  
  checkTrackLimits(car) {
    let minDist = Infinity;
    let trackPoint = null;
    
    this.gameState.track.forEach(point => {
      const dx = car.x - point.x;
      const dy = car.y - point.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist) {
        minDist = dist;
        trackPoint = point;
      }
    });
    
    if (minDist > 60) {
      car.speed *= 0.8;
      
      if (trackPoint) {
        const dx = trackPoint.x - car.x;
        const dy = trackPoint.y - car.y;
        const angle = Math.atan2(dy, dx);
        car.x += Math.cos(angle) * 3;
        car.y += Math.sin(angle) * 3;
      }
    }
  }
  
  checkCheckpoints(car) {
    const trackIndex = this.findNearestTrackIndex(car);
    const currentCp = this.gameState.track[trackIndex]?.cp || 0;
    
    if (currentCp === (car.checkpoint + 1) % 4) {
      car.checkpoint = currentCp;
      
      if (car.checkpoint === 0 && car.lap < this.gameState.laps) {
        car.lap++;
        
        const lapTime = this.gameState.time - (car.lap - 1) * 30;
        if (lapTime < car.bestLap) car.bestLap = lapTime;
        
        if (car.lap > this.gameState.laps) {
          this.finishRace(car, i);
        }
      }
    }
  }
  
  findNearestTrackIndex(car) {
    let minDist = Infinity;
    let index = 0;
    
    this.gameState.track.forEach((point, i) => {
      const dx = car.x - point.x;
      const dy = car.y - point.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist) {
        minDist = dist;
        index = i;
      }
    });
    
    return index;
  }
  
  finishRace(car, carIndex) {
    car.finished = true;
    
    if (this.gameState.cars.every(c => c.finished)) {
      const winner = this.gameState.cars[0].bestLap < this.gameState.cars[1].bestLap ? this.players[0] : this.players[1];
      this.gameState.winner = winner;
      this.gameState.gameOver = true;
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.drawTrack();
    this.drawCars();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawTrack() {
    this.ctx.fillStyle = '#2d5a27';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (this.gameState.track.length > 0) {
      this.ctx.strokeStyle = '#555';
      this.ctx.lineWidth = 80;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      
      this.ctx.beginPath();
      this.gameState.track.forEach((point, i) => {
        if (i === 0) this.ctx.moveTo(point.x, point.y);
        else this.ctx.lineTo(point.x, point.y);
      });
      this.ctx.closePath();
      this.ctx.stroke();
      
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([20, 20]);
      
      this.ctx.beginPath();
      this.gameState.track.forEach((point, i) => {
        if (i === 0) this.ctx.moveTo(point.x, point.y);
        else this.ctx.lineTo(point.x, point.y);
      });
      this.ctx.closePath();
      this.ctx.stroke();
      this.ctx.setLineDash([]);
      
      const start = this.gameState.track[0];
      this.ctx.fillStyle = '#fff';
      this.ctx.fillRect(start.x - 25, start.y - 15, 50, 30);
      this.ctx.fillStyle = '#000';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('START', start.x, start.y + 4);
    }
  }
  
  drawCars() {
    const colors = ['#e74c3c', '#3498db'];
    const names = ['P1', 'P2'];
    
    this.gameState.cars.forEach((car, i) => {
      this.ctx.save();
      this.ctx.translate(car.x, car.y);
      this.ctx.rotate(car.angle);
      
      this.ctx.fillStyle = colors[i];
      this.ctx.fillRect(-25, -12, 50, 24);
      
      this.ctx.fillStyle = '#111';
      this.ctx.fillRect(-20, -14, 10, 4);
      this.ctx.fillRect(10, -14, 10, 4);
      this.ctx.fillRect(-20, 10, 10, 4);
      this.ctx.fillRect(10, 10, 10, 4);
      
      this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
      this.ctx.fillRect(-5, -8, 20, 16);
      
      this.ctx.restore();
    });
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 150, 70);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Lap: ${this.gameState.currentLap}/${this.gameState.laps}`, 20, 30);
    
    this.gameState.cars.forEach((car, i) => {
      const best = car.bestLap === Infinity ? '--' : car.bestLap.toFixed(1) + 's';
      this.ctx.fillText(`${this.players[i]}: ${best}`, 20, 50 + i * 20);
    });
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('FORMULA RACING', this.canvas.width / 2, 30);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('RACE COMPLETE', this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Winner: ${this.gameState.winner}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.FormulaRacingGame = FormulaRacingGame;