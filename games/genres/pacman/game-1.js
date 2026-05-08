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
      dots: [],
      powerPellets: [],
      ghosts: [],
      player: null,
      direction: 'right',
      nextDirection: 'right',
      status: 'playing',
      invincible: false,
      invincibleTimer: 0,
      gameOver: false
    };
    
    this.map = this.createMap();
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 600;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  createMap() {
    return [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,1],
      [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,1],
      [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,1],
      [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,1,1,2,1,2,1,1,1,1,1,1,2,1,2,1,1,1],
      [1,2,2,2,2,1,2,2,2,1,1,2,2,2,1,2,2,2,1],
      [1,1,1,1,2,1,1,1,0,1,1,0,1,1,1,2,1,1,1],
      [0,0,0,1,2,1,0,0,0,0,0,0,0,0,1,2,1,0,0],
      [1,1,1,1,2,1,0,1,1,0,0,1,1,0,1,2,1,1,1],
      [1,2,2,2,2,0,0,1,0,0,0,0,1,0,0,2,2,2,1],
      [1,2,1,1,2,1,0,1,1,1,1,1,1,0,1,2,1,1,1],
      [1,2,2,2,2,1,2,2,2,1,1,2,2,2,1,2,2,2,1],
      [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,1],
      [1,2,2,2,2,2,2,2,2,3,3,2,2,2,2,2,2,2,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];
  }
  
  initGame() {
    const cellSize = 28;
    const offsetX = 40;
    const offsetY = 30;
    
    this.gameState.dots = [];
    this.gameState.powerPellets = [];
    this.gameState.ghosts = [];
    
    for (let row = 0; row < this.map.length; row++) {
      for (let col = 0; col < this.map[row].length; col++) {
        const cell = this.map[row][col];
        const x = offsetX + col * cellSize + cellSize / 2;
        const y = offsetY + row * cellSize + cellSize / 2;
        
        if (cell === 2) {
          this.gameState.dots.push({ x, y, eaten: false });
        } else if (cell === 3) {
          this.gameState.powerPellets.push({ x, y, eaten: false });
        }
      }
    }
    
    this.gameState.player = {
      x: offsetX + 9 * cellSize + cellSize / 2,
      y: offsetY + 13 * cellSize + cellSize / 2,
      radius: 12,
      speed: 3
    };
    
    const ghostColors = ['#e74c3c', '#ffb8b8', '#ffb852', '#ffdb76'];
    
    const ghostPositions = [
      { col: 8, row: 7 },
      { col: 9, row: 7 },
      { col: 10, row: 7 }
    ];
    
    ghostPositions.forEach((pos, i) => {
      this.gameState.ghosts.push({
        x: offsetX + pos.col * cellSize + cellSize / 2,
        y: offsetY + pos.row * cellSize + cellSize / 2,
        radius: 12,
        speed: 2,
        color: ghostColors[i],
        direction: 'up',
        homeX: offsetX + pos.col * cellSize + cellSize / 2,
        homeY: offsetY + pos.row * cellSize + cellSize / 2
      });
    });
    
    this.cellSize = cellSize;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
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
    
    if (this.gameState.invincible) {
      this.gameState.invincibleTimer -= deltaTime;
      if (this.gameState.invincibleTimer <= 0) {
        this.gameState.invincible = false;
      }
    }
    
    this.updatePlayer();
    this.updateGhosts();
    this.checkCollisions();
    this.checkWin();
  }
  
  updatePlayer() {
    const player = this.gameState.player;
    const input = this.getPlayerInput(this.players[0]);
    const cellSize = this.cellSize;
    
    if (input.left) this.gameState.nextDirection = 'left';
    if (input.right) this.gameState.nextDirection = 'right';
    if (input.up) this.gameState.nextDirection = 'up';
    if (input.down) this.gameState.nextDirection = 'down';
    
    const currentGridX = Math.floor((player.x - this.offsetX) / cellSize);
    const currentGridY = Math.floor((player.y - this.offsetY) / cellSize);
    
    const canMove = (dir) => {
      const col = Math.floor((player.x - this.offsetX) / cellSize);
      const row = Math.floor((player.y - this.offsetY) / cellSize);
      
      let newCol = col, newRow = row;
      
      if (dir === 'left') newCol = col - 1;
      if (dir === 'right') newCol = col + 1;
      if (dir === 'up') newRow = row - 1;
      if (dir === 'down') newRow = row + 1;
      
      if (newRow >= 0 && newRow < this.map.length && 
          newCol >= 0 && newCol < this.map[0].length) {
        return this.map[newRow][newCol] !== 1;
      }
      return false;
    };
    
    if (canMove(this.gameState.nextDirection)) {
      this.gameState.direction = this.gameState.nextDirection;
    }
    
    if (!canMove(this.gameState.direction)) {
      return;
    }
    
    const speed = player.speed;
    
    if (this.gameState.direction === 'left') player.x -= speed;
    if (this.gameState.direction === 'right') player.x += speed;
    if (this.gameState.direction === 'up') player.y -= speed;
    if (this.gameState.direction === 'down') player.y += speed;
    
    if (player.x < 0) player.x = this.canvas.width;
    if (player.x > this.canvas.width) player.x = 0;
    
    this.gameState.dots.forEach(dot => {
      if (!dot.eaten) {
        const dx = player.x - dot.x;
        const dy = player.y - dot.y;
        if (Math.sqrt(dx * dx + dy * dy) < player.radius + 4) {
          dot.eaten = true;
          this.gameState.score += 10;
        }
      }
    });
    
    this.gameState.powerPellets.forEach(pellet => {
      if (!pellet.eaten) {
        const dx = player.x - pellet.x;
        const dy = player.y - pellet.y;
        if (Math.sqrt(dx * dx + dy * dy) < player.radius + 6) {
          pellet.eaten = true;
          this.gameState.score += 50;
          this.gameState.invincible = true;
          this.gameState.invincibleTimer = 8;
        }
      }
    });
  }
  
  updateGhosts() {
    this.gameState.ghosts.forEach(ghost => {
      const directions = ['up', 'down', 'left', 'right'];
      
      if (Math.random() < 0.03) {
        const validDirections = directions.filter(dir => {
          return this.canGhostMove(ghost, dir);
        });
        
        if (validDirections.length > 0) {
          ghost.direction = validDirections[Math.floor(Math.random() * validDirections.length)];
        }
      }
      
      if (this.canGhostMove(ghost, ghost.direction)) {
        if (ghost.direction === 'left') ghost.x -= ghost.speed;
        if (ghost.direction === 'right') ghost.x += ghost.speed;
        if (ghost.direction === 'up') ghost.y -= ghost.speed;
        if (ghost.direction === 'down') ghost.y += ghost.speed;
      }
    });
  }
  
  canGhostMove(ghost, direction) {
    const cellSize = this.cellSize;
    const col = Math.floor((ghost.x - this.offsetX) / cellSize);
    const row = Math.floor((ghost.y - this.offsetY) / cellSize);
    
    let newCol = col, newRow = row;
    
    if (direction === 'left') newCol = col - 1;
    if (direction === 'right') newCol = col + 1;
    if (direction === 'up') newRow = row - 1;
    if (direction === 'down') newRow = row + 1;
    
    if (newRow >= 0 && newRow < this.map.length && 
        newCol >= 0 && newCol < this.map[0].length) {
      return this.map[newRow][newCol] !== 1;
    }
    return false;
  }
  
  checkCollisions() {
    const player = this.gameState.player;
    
    this.gameState.ghosts.forEach(ghost => {
      const dx = player.x - ghost.x;
      const dy = player.y - ghost.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < player.radius + ghost.radius - 4) {
        if (this.gameState.invincible) {
          ghost.x = ghost.homeX;
          ghost.y = ghost.homeY;
          this.gameState.score += 200;
        } else {
          this.gameState.lives--;
          
          if (this.gameState.lives <= 0) {
            this.gameState.gameOver = true;
          } else {
            this.resetPlayerPosition();
          }
        }
      }
    });
  }
  
  resetPlayerPosition() {
    this.gameState.player.x = this.offsetX + 9 * this.cellSize + this.cellSize / 2;
    this.gameState.player.y = this.offsetY + 13 * this.cellSize + this.cellSize / 2;
    this.gameState.direction = 'right';
    this.gameState.nextDirection = 'right';
    this.gameState.invincible = false;
  }
  
  checkWin() {
    const allDotsEaten = this.gameState.dots.every(d => d.eaten);
    const allPelletsEaten = this.gameState.powerPellets.every(p => p.eaten);
    
    if (allDotsEaten && allPelletsEaten) {
      this.gameState.score += 1000;
      this.resetGame();
    }
  }
  
  resetGame() {
    this.gameState.dots.forEach(d => d.eaten = false);
    this.gameState.powerPellets.forEach(p => p.eaten = false);
    this.gameState.ghosts.forEach(g => {
      g.x = g.homeX;
      g.y = g.homeY;
    });
    this.resetPlayerPosition();
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.drawBackground();
    this.drawMap();
    this.drawDots();
    this.drawPowerPellets();
    this.drawPlayer();
    this.drawGhosts();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawMap() {
    const cellSize = this.cellSize;
    
    this.map.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell === 1) {
          this.ctx.fillStyle = '#1919a6';
          this.ctx.fillRect(
            this.offsetX + colIndex * cellSize,
            this.offsetY + rowIndex * cellSize,
            cellSize,
            cellSize
          );
          
          this.ctx.fillStyle = '#000';
          this.ctx.fillRect(
            this.offsetX + colIndex * cellSize + 4,
            this.offsetY + rowIndex * cellSize + 4,
            cellSize - 8,
            cellSize - 8
          );
        }
      });
    });
  }
  
  drawDots() {
    this.ctx.fillStyle = '#ffb8ae';
    this.gameState.dots.forEach(dot => {
      if (!dot.eaten) {
        this.ctx.beginPath();
        this.ctx.arc(dot.x, dot.y, 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }
  
  drawPowerPellets() {
    this.gameState.powerPellets.forEach(pellet => {
      if (!pellet.eaten) {
        const pulse = Math.sin(this.gameState.time * 5) * 0.3 + 0.7;
        
        this.ctx.fillStyle = `rgba(255, 255, 0, ${pulse})`;
        this.ctx.beginPath();
        this.ctx.arc(pellet.x, pellet.y, 8, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }
  
  drawPlayer() {
    const player = this.gameState.player;
    
    let angle = 0;
    if (this.gameState.direction === 'right') angle = 0;
    if (this.gameState.direction === 'down') angle = Math.PI / 2;
    if (this.gameState.direction === 'left') angle = Math.PI;
    if (this.gameState.direction === 'up') angle = -Math.PI / 2;
    
    this.ctx.fillStyle = '#ffff00';
    this.ctx.beginPath();
    this.ctx.arc(player.x, player.y, player.radius, angle + 0.2 * Math.PI, angle + 1.8 * Math.PI);
    this.ctx.lineTo(player.x, player.y);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(player.x + Math.cos(angle) * 4, player.y + Math.sin(angle) * 4, 3, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  drawGhosts() {
    this.gameState.ghosts.forEach(ghost => {
      if (this.gameState.invincible) {
        this.ctx.fillStyle = '#0000ff';
      } else {
        this.ctx.fillStyle = ghost.color;
      }
      
      this.ctx.beginPath();
      this.ctx.arc(ghost.x, ghost.y - 2, ghost.radius, Math.PI, 0);
      this.ctx.lineTo(ghost.x + ghost.radius, ghost.y + ghost.radius);
      this.ctx.lineTo(ghost.x - ghost.radius, ghost.y + ghost.radius);
      this.ctx.closePath();
      this.ctx.fill();
      
      this.ctx.fillStyle = this.gameState.invincible ? '#fff' : '#000';
      this.ctx.beginPath();
      this.ctx.arc(ghost.x - 4, ghost.y - 2, 3, 0, Math.PI * 2);
      this.ctx.arc(ghost.x + 4, ghost.y - 2, 3, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 120, 60);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    this.ctx.fillText(`Lives: ${this.gameState.lives}`, 20, 50);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAC-MAN', this.canvas.width / 2, 25);
    
    if (this.gameState.invincible) {
      this.ctx.fillStyle = '#ff0';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.fillText('POWER MODE!', this.canvas.width / 2, this.canvas.height - 15);
    }
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.PacmanGame = PacmanGame;