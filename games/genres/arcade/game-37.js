// Pac-Man Style Game
class PacmanGame {
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
      lives: 3,
      player: null,
      ghosts: [],
      pellets: [],
      powerMode: false,
      powerTimer: 0,
      direction: { x: 0, y: 0 },
      nextDirection: { x: 0, y: 0 },
      map: [],
      cellSize: 20,
      status: 'playing',
      gameOver: false,
      won: false
    };
    
    this.ghostColors = ['#e74c3c', '#ffb8ff', '#00ffff', '#ffb852'];
    this.ghostNames = ['Blinky', 'Pinky', 'Inky', 'Clyde'];
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = { x: 10, y: 15, direction: { x: 0, y: 0 }, nextDir: { x: 0, y: 0 }, mouthOpen: 0, mouthSpeed: 0.2 };
    
    this.gameState.map = [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
      [1,2,1,1,1,2,1,1,2,1,1,2,1,1,2,1,1,1,2,1],
      [1,2,1,1,1,2,1,1,2,1,1,2,1,1,2,1,1,1,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,1,1,1,2,1,2,1,1,1,1,2,1,2,1,1,1,2,1],
      [1,2,2,2,2,2,1,2,2,1,1,2,2,1,2,2,2,2,2,1],
      [1,1,1,1,1,2,1,1,0,1,1,0,1,1,2,1,1,1,1,1],
      [0,0,0,0,1,2,1,0,0,0,0,0,0,1,2,1,0,0,0,0],
      [1,1,1,1,1,2,1,0,1,1,0,1,1,0,1,2,1,1,1,1],
      [0,0,0,0,0,2,0,0,1,0,0,0,1,0,0,2,0,0,0,0],
      [1,1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
      [0,0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
      [1,1,1,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,1,1],
      [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
      [1,2,1,1,1,2,1,1,2,1,1,2,1,1,2,1,1,1,2,1],
      [1,2,2,1,2,2,2,2,2,0,0,2,2,2,2,2,1,2,2,1],
      [1,1,2,1,1,2,1,2,1,1,1,1,2,1,2,1,1,2,1,1],
      [1,2,2,2,1,2,1,2,2,1,1,2,2,1,2,1,2,2,2,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];
    
    this.gameState.pellets = [];
    for (let y = 0; y < this.gameState.map.length; y++) {
      for (let x = 0; x < this.gameState.map[y].length; x++) {
        if (this.gameState.map[y][x] === 2) {
          this.gameState.pellets.push({ x, y, type: 'normal' });
        } else if (this.gameState.map[y][x] === 0) {
          this.gameState.pellets.push({ x, y, type: 'power' });
        }
      }
    }
    
    this.gameState.ghosts = [];
    const ghostStarts = [{ x: 9, y: 8 }, { x: 10, y: 8 }, { x: 9, y: 9 }, { x: 10, y: 9 }];
    for (let i = 0; i < 4; i++) {
      this.gameState.ghosts.push({
        x: ghostStarts[i].x,
        y: ghostStarts[i].y,
        color: this.ghostColors[i],
        name: this.ghostNames[i],
        direction: { x: 0, y: 0 },
        speed: 0.08,
        scared: false,
        scatterTarget: { x: i < 2 ? 0 : 19, y: i % 2 === 0 ? 0 : 19 }
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
    if (this.gameState.gameOver || this.gameState.won) return;
    this.gameState.time += deltaTime;
    
    if (this.gameState.powerTimer > 0) {
      this.gameState.powerTimer -= deltaTime;
      if (this.gameState.powerTimer <= 0) {
        this.gameState.powerMode = false;
        this.gameState.ghosts.forEach(g => g.scared = false);
      }
    }
    
    this.updatePlayer(deltaTime);
    this.updateGhosts(deltaTime);
    this.checkCollisions();
    
    if (this.gameState.pellets.length === 0) {
      this.gameState.won = true;
    }
  }
  
  updatePlayer(deltaTime) {
    const p = this.gameState.player;
    
    if (p.nextDir.x !== 0 || p.nextDir.y !== 0) {
      const newX = p.x + p.nextDir.x * 0.1;
      const newY = p.y + p.nextDir.y * 0.1;
      if (this.canMove(Math.round(newX), Math.round(newY))) {
        p.direction = { ...p.nextDir };
      }
    }
    
    const newX = p.x + p.direction.x * 0.1;
    const newY = p.y + p.direction.y * 0.1;
    
    if (this.canMove(Math.round(newX), Math.round(newY))) {
      p.x = newX;
      p.y = newY;
    }
    
    if (p.x < 0) p.x = 19;
    if (p.x > 19) p.x = 0;
    
    p.mouthOpen += p.mouthSpeed;
    if (p.mouthOpen > 1 || p.mouthOpen < 0) p.mouthSpeed *= -1;
    
    const gridX = Math.round(p.x);
    const gridY = Math.round(p.y);
    
    this.gameState.pellets = this.gameState.pellets.filter(pellet => {
      if (pellet.x === gridX && pellet.y === gridY) {
        if (pellet.type === 'power') {
          this.gameState.powerMode = true;
          this.gameState.powerTimer = 8;
          this.gameState.ghosts.forEach(g => g.scared = true);
          this.gameState.score += 50;
        } else {
          this.gameState.score += 10;
        }
        return false;
      }
      return true;
    });
  }
  
  canMove(x, y) {
    if (x < 0) return true;
    if (x > 19) return true;
    return this.gameState.map[y] && this.gameState.map[y][x] !== 1;
  }
  
  updateGhosts(deltaTime) {
    this.gameState.ghosts.forEach(ghost => {
      const target = ghost.scared ? this.getRandomCorner() : this.getGhostTarget(ghost);
      const dx = target.x - ghost.x;
      const dy = target.y - ghost.y;
      
      let bestDir = { x: 0, y: 0 };
      let bestDist = Infinity;
      
      const directions = [
        { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
      ];
      
      directions.forEach(dir => {
        if (dir.x === -ghost.direction.x && dir.y === -ghost.direction.y) return;
        
        const newX = Math.round(ghost.x) + dir.x;
        const newY = Math.round(ghost.y) + dir.y;
        
        if (this.canMove(newX, newY)) {
          const dist = Math.sqrt((newX - target.x) ** 2 + (newY - target.y) ** 2);
          if (dist < bestDist) {
            bestDist = dist;
            bestDir = dir;
          }
        }
      });
      
      ghost.direction = bestDir;
      
      const speed = ghost.scared ? ghost.speed * 0.5 : ghost.speed;
      ghost.x += ghost.direction.x * speed;
      ghost.y += ghost.direction.y * speed;
      
      if (ghost.x < 0) ghost.x = 19;
      if (ghost.x > 19) ghost.x = 0;
    });
  }
  
  getGhostTarget(ghost) {
    const p = this.gameState.player;
    return { x: p.x, y: p.y };
  }
  
  getRandomCorner() {
    const corners = [
      { x: 1, y: 1 }, { x: 18, y: 1 },
      { x: 1, y: 18 }, { x: 18, y: 18 }
    ];
    return corners[Math.floor(Math.random() * corners.length)];
  }
  
  checkCollisions() {
    const p = this.gameState.player;
    
    this.gameState.ghosts.forEach(ghost => {
      const dx = p.x - ghost.x;
      const dy = p.y - ghost.y;
      
      if (Math.sqrt(dx*dx + dy*dy) < 0.8) {
        if (ghost.scared) {
          ghost.x = 9;
          ghost.y = 8;
          ghost.scared = false;
          this.gameState.score += 200;
        } else {
          this.gameState.lives--;
          if (this.gameState.lives <= 0) {
            this.gameState.gameOver = true;
          } else {
            p.x = 10;
            p.y = 15;
            p.direction = { x: 0, y: 0 };
          }
        }
      }
    });
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, 800, 600);
    
    const cellSize = this.gameState.cellSize;
    const offsetX = (800 - 20 * cellSize) / 2;
    const offsetY = (600 - 20 * cellSize) / 2;
    
    this.ctx.fillStyle = '#000055';
    for (let y = 0; y < this.gameState.map.length; y++) {
      for (let x = 0; x < this.gameState.map[y].length; x++) {
        if (this.gameState.map[y][x] === 1) {
          this.ctx.fillRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize, cellSize);
          this.ctx.strokeStyle = '#000088';
          this.ctx.strokeRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize, cellSize);
        }
      }
    }
    
    this.gameState.pellets.forEach(pellet => {
      this.ctx.fillStyle = pellet.type === 'power' ? '#ffb8ae' : '#ffb897';
      if (pellet.type === 'power') {
        this.ctx.beginPath();
        this.ctx.arc(offsetX + pellet.x * cellSize + cellSize/2, offsetY + pellet.y * cellSize + cellSize/2, 8, 0, Math.PI*2);
        this.ctx.fill();
      } else {
        this.ctx.beginPath();
        this.ctx.arc(offsetX + pellet.x * cellSize + cellSize/2, offsetY + pellet.y * cellSize + cellSize/2, 3, 0, Math.PI*2);
        this.ctx.fill();
      }
    });
    
    const p = this.gameState.player;
    const px = offsetX + p.x * cellSize + cellSize/2;
    const py = offsetY + p.y * cellSize + cellSize/2;
    
    const mouthAngle = p.mouthOpen * 0.2 * Math.PI;
    const dirAngle = Math.atan2(p.direction.y, p.direction.x);
    
    this.ctx.fillStyle = '#ffff00';
    this.ctx.beginPath();
    this.ctx.moveTo(px, py);
    this.ctx.arc(px, py, cellSize/2 - 2, dirAngle + mouthAngle, dirAngle - mouthAngle + Math.PI*2);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.gameState.ghosts.forEach(ghost => {
      const gx = offsetX + ghost.x * cellSize + cellSize/2;
      const gy = offsetY + ghost.y * cellSize + cellSize/2;
      
      this.ctx.fillStyle = ghost.scared ? '#0000ff' : ghost.color;
      this.ctx.beginPath();
      this.ctx.arc(gx, gy - 2, cellSize/2 - 2, Math.PI, 0);
      this.ctx.lineTo(gx + cellSize/2 - 2, gy + cellSize/2 - 4);
      this.ctx.lineTo(gx - cellSize/2 + 2, gy + cellSize/2 - 4);
      this.ctx.closePath();
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.beginPath();
      this.ctx.arc(gx - 4, gy - 4, 4, 0, Math.PI*2);
      this.ctx.arc(gx + 4, gy - 4, 4, 0, Math.PI*2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#000';
      this.ctx.beginPath();
      this.ctx.arc(gx - 4 + ghost.direction.x * 2, gy - 4 + ghost.direction.y * 2, 2, 0, Math.PI*2);
      this.ctx.arc(gx + 4 + ghost.direction.x * 2, gy - 4 + ghost.direction.y * 2, 2, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Score: ' + this.gameState.score, 20, 30);
    this.ctx.fillText('Lives: ' + this.gameState.lives, 20, 55);
    
    if (this.gameState.powerMode) {
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fillText('POWER MODE!', 150, 30);
    }
    
    this.ctx.fillStyle = '#ffff00';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAC-MAN', 400, 25);
    
    if (this.gameState.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, 800, 600);
      this.ctx.fillStyle = '#ff0000';
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillText('GAME OVER', 400, 300);
    }
    
    if (this.gameState.won) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, 800, 600);
      this.ctx.fillStyle = '#ffff00';
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillText('YOU WIN!', 400, 300);
      this.ctx.font = '24px Arial';
      this.ctx.fillText('Score: ' + this.gameState.score, 400, 350);
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    
    if (input.up) this.gameState.player.nextDir = { x: 0, y: -1 };
    if (input.down) this.gameState.player.nextDir = { x: 0, y: 1 };
    if (input.left) this.gameState.player.nextDir = { x: -1, y: 0 };
    if (input.right) this.gameState.player.nextDir = { x: 1, y: 0 };
  }
}

window.PacmanGame = PacmanGame;