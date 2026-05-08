// Crossy Road Game
class CrossyRoadGame {
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
      player: null,
      lanes: [],
      viewOffset: 0,
      maxViewOffset: 0,
      currentLane: 0,
      lanesCount: 15,
      status: 'crossing',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = { lane: 0, position: 0, y: 500, moving: false };
    
    const laneTypes = ['grass', 'road', 'water', 'grass', 'road', 'water', 'grass'];
    
    for (let i = 0; i < this.gameState.lanesCount; i++) {
      const type = laneTypes[i % laneTypes.length];
      const lane = { type: type, y: 550 - i * 40, cars: [], logs: [], direction: Math.random() < 0.5 ? 1 : -1 };
      
      if (type === 'road') {
        for (let j = 0; j < 2; j++) {
          lane.cars.push({
            x: 100 + j * 300 + Math.random() * 100,
            speed: 50 + Math.random() * 100
          });
        }
      } else if (type === 'water') {
        for (let j = 0; j < 3; j++) {
          lane.logs.push({
            x: 50 + j * 250 + Math.random() * 50,
            width: 80 + Math.random() * 60,
            speed: 40 + Math.random() * 60
          });
        }
      }
      
      this.gameState.lanes.push(lane);
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
    if (this.gameState.gameOver) return;
    this.gameState.time += deltaTime;
    
    const player = this.gameState.player;
    
    if (player.moving) {
      const targetY = 550 - player.lane * 40;
      if (Math.abs(player.y - targetY) > 5) {
        player.y += (targetY - player.y) * 0.2;
      } else {
        player.y = targetY;
        player.moving = false;
      }
    }
    
    this.gameState.lanes.forEach((lane, index) => {
      if (lane.type === 'road') {
        lane.cars.forEach(car => {
          car.x += car.speed * lane.direction * deltaTime;
          if (car.x > 850) car.x = -50;
          if (car.x < -50) car.x = 850;
          
          if (player.lane === index && Math.abs(player.position - car.x) < 30) {
            this.gameState.gameOver = true;
          }
        });
      } else if (lane.type === 'water') {
        let onLog = false;
        lane.logs.forEach(log => {
          log.x += log.speed * lane.direction * deltaTime;
          if (log.x > 850) log.x = -log.width;
          if (log.x + log.width < 0) log.x = 850;
          
          if (player.lane === index && player.position > log.x && player.position < log.x + log.width) {
            onLog = true;
            player.position += log.speed * lane.direction * deltaTime;
          }
        });
        
        if (player.lane === index && !onLog && !player.moving) {
          this.gameState.gameOver = true;
        }
      }
    });
    
    player.position = Math.max(20, Math.min(780, player.position));
    
    if (player.lane > this.gameState.maxViewOffset) {
      this.gameState.maxViewOffset = player.lane;
      this.gameState.score += 10;
    }
    
    this.gameState.viewOffset = Math.min(this.gameState.maxViewOffset, 5);
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  movePlayer(direction) {
    const player = this.gameState.player;
    if (player.moving || this.gameState.gameOver) return;
    
    if (direction === 'up' && player.lane < this.gameState.lanesCount - 1) {
      player.lane++;
      player.moving = true;
    } else if (direction === 'down' && player.lane > 0) {
      player.lane--;
      player.moving = true;
    } else if (direction === 'left') {
      player.position -= 30;
    } else if (direction === 'right') {
      player.position += 30;
    }
  }
  
  render() {
    const grad = this.ctx.createLinearGradient(0, 0, 0, 600);
    grad.addColorStop(0, '#87ceeb');
    grad.addColorStop(1, '#228b22');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, 800, 600);
    
    const startLane = Math.max(0, this.gameState.viewOffset - 2);
    const endLane = Math.min(this.gameState.lanesCount, this.gameState.viewOffset + 8);
    
    for (let i = startLane; i < endLane; i++) {
      const lane = this.gameState.lanes[i];
      const y = 550 - (i - this.gameState.viewOffset) * 40;
      
      if (lane.type === 'grass') {
        this.ctx.fillStyle = '#7cba6e';
        this.ctx.fillRect(0, y, 800, 40);
        
        if (i % 2 === 0) {
          this.ctx.fillStyle = '#228b22';
          for (let x = 0; x < 800; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, y + 40);
            this.ctx.lineTo(x + 5, y + 25);
            this.ctx.lineTo(x + 10, y + 40);
            this.ctx.fill();
          }
        }
      } else if (lane.type === 'road') {
        this.ctx.fillStyle = '#4a4a4a';
        this.ctx.fillRect(0, y, 800, 40);
        
        this.ctx.strokeStyle = '#f1c40f';
        this.ctx.setLineDash([20, 20]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, y + 20);
        this.ctx.lineTo(800, y + 20);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        lane.cars.forEach(car => {
          this.ctx.fillStyle = ['#e74c3c', '#3498db', '#f1c40f'][Math.floor(Math.random() * 3)];
          this.ctx.fillRect(car.x - 15, y + 10, 30, 20);
          this.ctx.fillStyle = '#000';
          this.ctx.beginPath();
          this.ctx.arc(car.x - 10, y + 30, 5, 0, Math.PI*2);
          this.ctx.arc(car.x + 10, y + 30, 5, 0, Math.PI*2);
          this.ctx.fill();
        });
      } else if (lane.type === 'water') {
        this.ctx.fillStyle = '#3498db';
        this.ctx.fillRect(0, y, 800, 40);
        
        lane.logs.forEach(log => {
          this.ctx.fillStyle = '#8b4513';
          this.ctx.fillRect(log.x, y + 12, log.width, 16);
          this.ctx.fillStyle = '#654321';
          this.ctx.fillRect(log.x + 5, y + 14, log.width - 10, 12);
        });
      }
    }
    
    const p = this.gameState.player;
    const px = p.position;
    const py = 550 - (p.lane - this.gameState.viewOffset) * 40;
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(px - 10, py - 15, 20, 20);
    this.ctx.fillStyle = '#f5d0c5';
    this.ctx.beginPath();
    this.ctx.arc(px, py - 20, 8, 0, Math.PI*2);
    this.ctx.fill();
    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(px - 3, py - 22, 2, 0, Math.PI*2);
    this.ctx.arc(px + 3, py - 22, 2, 0, Math.PI*2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Score: ' + this.gameState.score, 20, 30);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillText('CROSSY ROAD', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    if (input.up) this.movePlayer('up');
    if (input.down) this.movePlayer('down');
    if (input.left) this.movePlayer('left');
    if (input.right) this.movePlayer('right');
  }
}

window.CrossyRoadGame = CrossyRoadGame;