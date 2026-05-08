// Stealth Action Game
class StealthGame {
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
      score: 0,
      detected: false,
      detectionLevel: 0,
      stealthKills: 0,
      status: 'sneaking',
      player: null,
      guards: [],
      objectives: [],
      obstacles: [],
      camera: null,
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = {
      x: 80,
      y: 300,
      width: 20,
      height: 30,
      speed: 2.5,
      visible: true,
      crouching: false
    };
    
    this.gameState.guards = [
      { x: 300, y: 200, angle: 0, fov: Math.PI / 3, range: 150, patrol: true, patrolDir: 1, idle: false },
      { x: 500, y: 400, angle: Math.PI, fov: Math.PI / 3, range: 150, patrol: true, patrolDir: -1, idle: false },
      { x: 600, y: 150, angle: Math.PI / 2, fov: Math.PI / 4, range: 200, patrol: false, idle: true },
      { x: 350, y: 450, angle: -Math.PI / 2, fov: Math.PI / 3, range: 150, patrol: true, patrolDir: 1, idle: false }
    ];
    
    this.gameState.objectives = [
      { x: 700, y: 100, collected: false },
      { x: 500, y: 300, collected: false },
      { x: 200, y: 500, collected: false }
    ];
    
    this.gameState.obstacles = [
      { x: 200, y: 150, width: 80, height: 60 },
      { x: 400, y: 300, width: 100, height: 40 },
      { x: 600, y: 400, width: 60, height: 80 },
      { x: 150, y: 400, width: 50, height: 50 },
      { x: 550, y: 200, width: 70, height: 50 }
    ];
    
    this.gameState.camera = { x: 0, y: 0 };
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
    
    this.updatePlayer(deltaTime);
    this.updateGuards(deltaTime);
    this.checkDetection();
    this.checkObjective();
    this.updateCamera();
  }
  
  updatePlayer(deltaTime) {
    const input = this.getPlayerInput(this.players[0]);
    const player = this.gameState.player;
    
    if (input.b) player.crouching = true;
    else player.crouching = false;
    
    const speed = player.crouching ? player.speed * 0.5 : player.speed;
    
    let vx = 0, vy = 0;
    if (input.left) vx = -speed;
    if (input.right) vx = speed;
    if (input.up) vy = -speed;
    if (input.down) vy = speed;
    
    let newX = player.x + vx;
    let newY = player.y + vy;
    
    this.gameState.obstacles.forEach(obs => {
      if (newX + player.width/2 > obs.x && newX - player.width/2 < obs.x + obs.width &&
          newY + player.height/2 > obs.y && newY - player.height/2 < obs.y + obs.height) {
        newX = player.x;
        newY = player.y;
      }
    });
    
    player.x = Math.max(30, Math.min(this.canvas.width - 30, newX));
    player.y = Math.max(50, Math.min(this.canvas.height - 50, newY));
    
    if (input.action && player.crouching) {
      this.attemptStealthKill();
    }
  }
  
  attemptStealthKill() {
    const player = this.gameState.player;
    
    this.gameState.guards.forEach(guard => {
      const dx = guard.x - player.x;
      const dy = guard.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 40) {
        guard.dead = true;
        this.gameState.stealthKills++;
        this.gameState.score += 200;
      }
    });
    
    this.gameState.guards = this.gameState.guards.filter(g => !g.dead);
  }
  
  updateGuards(deltaTime) {
    this.gameState.guards.forEach(guard => {
      if (guard.patrol) {
        guard.x += guard.patrolDir * 0.5;
        
        if (guard.x < 150 || guard.x > 650) {
          guard.patrolDir *= -1;
          guard.angle = guard.patrolDir > 0 ? 0 : Math.PI;
        }
      }
      
      if (guard.idle) {
        guard.angle += Math.sin(this.gameState.time * 2) * 0.02;
      }
    });
  }
  
  checkDetection() {
    const player = this.gameState.player;
    
    this.gameState.guards.forEach(guard => {
      const dx = player.x - guard.x;
      const dy = player.y - guard.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < guard.range) {
        const angleToPlayer = Math.atan2(dy, dx);
        let angleDiff = angleToPlayer - guard.angle;
        
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        if (Math.abs(angleDiff) < guard.fov / 2) {
          let visibility = 1;
          
          this.gameState.obstacles.forEach(obs => {
            if (this.lineIntersectsObstacle(guard.x, guard.y, player.x, player.y, obs)) {
              visibility = 0;
            }
          });
          
          if (player.crouching) visibility *= 0.5;
          
          this.gameState.detectionLevel += visibility * deltaTime * 0.5;
        }
      }
    });
    
    if (this.gameState.detectionLevel >= 10) {
      this.gameState.gameOver = true;
      this.gameState.detected = true;
    }
    
    this.gameState.detectionLevel = Math.max(0, this.gameState.detectionLevel - deltaTime * 0.3);
  }
  
  lineIntersectsObstacle(x1, y1, x2, y2, obs) {
    const left = obs.x;
    const right = obs.x + obs.width;
    const top = obs.y;
    const bottom = obs.y + obs.height;
    
    return (x1 > left && x1 < right && y1 > top && y1 < bottom) ||
           (x2 > left && x2 < right && y2 > top && y2 < bottom);
  }
  
  checkObjective() {
    const player = this.gameState.player;
    
    this.gameState.objectives.forEach(obj => {
      if (obj.collected) return;
      
      const dx = player.x - obj.x;
      const dy = player.y - obj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 30) {
        obj.collected = true;
        this.gameState.score += 100;
      }
    });
    
    const allCollected = this.gameState.objectives.every(o => o.collected);
    if (allCollected) {
      this.gameState.score += 500;
      this.gameState.gameOver = true;
    }
  }
  
  updateCamera() {
    const player = this.gameState.player;
    const cam = this.gameState.camera;
    
    cam.x += (player.x - cam.x) * 0.1;
    cam.y += (player.y - cam.y) * 0.1;
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.drawBackground();
    this.drawObstacles();
    this.drawObjectives();
    this.drawGuards();
    this.drawPlayer();
    this.drawDetectionMeter();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#2c3e50');
    gradient.addColorStop(1, '#34495e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#95a5a6';
    this.ctx.fillRect(50, 50, 700, 30);
    this.ctx.fillRect(50, 520, 700, 30);
    
    this.ctx.fillStyle = '#7f8c8d';
    this.ctx.fillRect(50, 50, 30, 500);
    this.ctx.fillRect(720, 50, 30, 500);
  }
  
  drawObstacles() {
    this.gameState.obstacles.forEach(obs => {
      this.ctx.fillStyle = '#5d6d7e';
      this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      
      this.ctx.fillStyle = '#4a5568';
      this.ctx.fillRect(obs.x + 5, obs.y + 5, obs.width - 10, obs.height - 10);
    });
  }
  
  drawObjectives() {
    this.gameState.objectives.forEach(obj => {
      if (obj.collected) return;
      
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.beginPath();
      this.ctx.moveTo(obj.x, obj.y - 15);
      this.ctx.lineTo(obj.x + 12, obj.y);
      this.ctx.lineTo(obj.x, obj.y + 15);
      this.ctx.lineTo(obj.x - 12, obj.y);
      this.ctx.closePath();
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('?', obj.x, obj.y + 4);
    });
  }
  
  drawGuards() {
    this.gameState.guards.forEach(guard => {
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.beginPath();
      this.ctx.arc(guard.x, guard.y, 15, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#c0392b';
      this.ctx.beginPath();
      this.ctx.arc(guard.x, guard.y - 10, 10, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawPlayer() {
    const player = this.gameState.player;
    
    this.ctx.fillStyle = player.crouching ? '#27ae60' : '#2ecc71';
    this.ctx.fillRect(player.x - player.width/2, player.y - player.height/2, player.width, player.height);
    
    this.ctx.fillStyle = '#f5d0c5';
    this.ctx.beginPath();
    this.ctx.arc(player.x, player.y - player.height/2 + 5, 8, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  drawDetectionMeter() {
    const level = this.gameState.detectionLevel;
    const maxLevel = 10;
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
    this.ctx.fillRect(this.canvas.width/2 - 60, 60, 120, 15);
    
    const gradient = this.ctx.createLinearGradient(0, 0, 120 * (level/maxLevel), 0);
    gradient.addColorStop(0, '#2ecc71');
    gradient.addColorStop(0.5, '#f1c40f');
    gradient.addColorStop(1, '#e74c3c');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(this.canvas.width/2 - 58, 62, 116 * (level/maxLevel), 11);
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, 10, 120, 70);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    this.ctx.fillText(`Kills: ${this.gameState.stealthKills}`, 20, 50);
    
    const objs = this.gameState.objectives.filter(o => o.collected).length;
    this.ctx.fillText(`Obj: ${objs}/${this.gameState.objectives.length}`, 20, 70);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('STEALTH MISSION', this.canvas.width / 2, 25);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (this.gameState.detected) {
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.font = 'bold 50px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('DETECTED!', this.canvas.width / 2, this.canvas.height / 2 - 20);
    } else {
      this.ctx.fillStyle = '#2ecc71';
      this.ctx.font = 'bold 50px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('MISSION COMPLETE', this.canvas.width / 2, this.canvas.height / 2 - 20);
    }
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.StealthGame = StealthGame;