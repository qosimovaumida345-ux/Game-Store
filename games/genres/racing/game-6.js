// F-Zero Style Racing Game
class FZeroRacingGame {
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
      lap: 1,
      totalLaps: 3,
      checkpoints: [],
      currentCheckpoint: 0,
      player: null,
      aiRacers: [],
      track: [],
      trackLength: 3000,
      cameraZ: 0,
      speed: 0,
      boost: 100,
      status: 'racing',
      gameOver: false,
      finished: false
    };
    
    this.physics = {
      maxSpeed: 800,
      acceleration: 200,
      deceleration: 100,
      turnSpeed: 150,
      boostSpeed: 1200
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = {
      x: 0, y: 0, z: 0,
      speed: 0,
      angle: 0,
      trackPosition: 0,
      color: '#3498db'
    };
    
    const colors = ['#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6'];
    this.gameState.aiRacers = [];
    for (let i = 0; i < 3; i++) {
      this.gameState.aiRacers.push({
        x: (i + 1) * 2, y: 0, z: -2 - i * 2,
        speed: 0,
        angle: 0,
        trackPosition: 0,
        color: colors[i],
        skill: 0.8 + Math.random() * 0.2
      });
    }
    
    this.gameState.checkpoints = [];
    for (let i = 0; i < 8; i++) {
      this.gameState.checkpoints.push({
        position: i * (this.gameState.trackLength / 8),
        x: Math.cos(i * Math.PI / 4) * 50,
        z: Math.sin(i * Math.PI / 4) * 50
      });
    }
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
    if (this.gameState.finished) return;
    this.gameState.time += deltaTime;
    
    const input = this.getPlayerInput(this.players[0]);
    const p = this.gameState.player;
    
    if (input.up) {
      p.speed += this.physics.acceleration * deltaTime;
    } else if (input.down) {
      p.speed -= this.physics.deceleration * deltaTime;
    } else {
      p.speed *= 0.99;
    }
    
    p.speed = Math.max(0, Math.min(this.physics.maxSpeed, p.speed));
    
    if (input.left) p.angle -= this.physics.turnSpeed * deltaTime;
    if (input.right) p.angle += this.physics.turnSpeed * deltaTime;
    
    if (input.boost && this.gameState.boost > 0) {
      p.speed = Math.min(p.speed + 300, this.physics.boostSpeed);
      this.gameState.boost -= deltaTime * 30;
    } else {
      this.gameState.boost = Math.min(100, this.gameState.boost + deltaTime * 10);
    }
    
    p.x += Math.sin(p.angle) * p.speed * deltaTime;
    p.z += Math.cos(p.angle) * p.speed * deltaTime;
    
    p.trackPosition += p.speed * deltaTime;
    
    if (p.trackPosition >= this.gameState.trackLength) {
      p.trackPosition -= this.gameState.trackLength;
      this.gameState.lap++;
      if (this.gameState.lap > this.gameState.totalLaps) {
        this.gameState.finished = true;
      }
    }
    
    const dist = Math.sqrt(p.x * p.x + p.z * p.z);
    if (dist > 80) {
      p.speed *= 0.95;
    }
    
    this.gameState.aiRacers.forEach(ai => {
      ai.speed += (ai.skill * this.physics.acceleration - ai.speed) * deltaTime;
      ai.angle += (Math.random() - 0.5) * ai.skill * 50 * deltaTime;
      ai.x += Math.sin(ai.angle) * ai.speed * deltaTime;
      ai.z += Math.cos(ai.angle) * ai.speed * deltaTime;
      ai.trackPosition += ai.speed * deltaTime;
      
      if (ai.trackPosition >= this.gameState.trackLength) {
        ai.trackPosition -= this.gameState.trackLength;
      }
    });
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#0a0a1a';
    this.ctx.fillRect(0, 0, 800, 600);
    
    const gradient = this.ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, '#1a0a2e');
    gradient.addColorStop(1, '#0a1a2e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, 800, 300);
    
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 350, 800, 250);
    
    this.drawTrack();
    this.drawRacers();
    this.drawUI();
  }
  
  drawTrack() {
    this.ctx.save();
    this.ctx.translate(400, 300);
    this.ctx.scale(1, 0.3);
    
    this.ctx.strokeStyle = '#2c3e50';
    this.ctx.lineWidth = 160;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 100, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.strokeStyle = '#f1c40f';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 100, 0, Math.PI * 2);
    this.ctx.stroke();
    
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      this.ctx.strokeStyle = '#e74c3c';
      this.ctx.lineWidth = 8;
      this.ctx.beginPath();
      this.ctx.moveTo(Math.cos(angle) * 70, Math.sin(angle) * 70);
      this.ctx.lineTo(Math.cos(angle) * 130, Math.sin(angle) * 130);
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }
  
  drawRacers() {
    const p = this.gameState.player;
    const angle = p.angle;
    
    this.ctx.save();
    this.ctx.translate(400, 350);
    this.ctx.rotate(-angle);
    this.ctx.translate(-p.x, p.z * 0.3);
    
    this.ctx.fillStyle = p.color;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -20);
    this.ctx.lineTo(15, 10);
    this.ctx.lineTo(5, 10);
    this.ctx.lineTo(5, 20);
    this.ctx.lineTo(-5, 20);
    this.ctx.lineTo(-5, 10);
    this.ctx.lineTo(-15, 10);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.restore();
    
    this.gameState.aiRacers.forEach(ai => {
      const dx = ai.x - p.x;
      const dz = ai.z - p.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist < 200) {
        const screenX = 400 + dx * 2;
        const screenY = 350 - dz * 0.6;
        
        this.ctx.fillStyle = ai.color;
        this.ctx.beginPath();
        this.ctx.moveTo(screenX, screenY - 15);
        this.ctx.lineTo(screenX + 10, screenY + 8);
        this.ctx.lineTo(screenX - 10, screenY + 8);
        this.ctx.closePath();
        this.ctx.fill();
      }
    });
  }
  
  drawUI() {
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(20, 550, 200, 20);
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.fillRect(20, 550, 200 * (this.gameState.boost/100), 20);
    this.ctx.strokeStyle = '#fff';
    this.ctx.strokeRect(20, 550, 200, 20);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('LAP: ' + this.gameState.lap + '/' + this.gameState.totalLaps, 20, 30);
    this.ctx.fillText('BOOST', 25, 545);
    this.ctx.fillText('SPEED: ' + Math.floor(this.gameState.player.speed), 250, 30);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('F-ZERO', 400, 25);
    
    if (this.gameState.finished) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, 800, 600);
      this.ctx.fillStyle = '#2ecc71';
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillText('FINISH!', 400, 300);
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.FZeroRacingGame = FZeroRacingGame;