// Plants vs Zombies Style Game
class PlantsVsZombiesGame {
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
      sun: 100,
      level: 1,
      score: 0,
      waves: 1,
      currentWave: 0,
      waveTimer: 0,
      lawn: [],
      plants: [],
      zombies: [],
      projectiles: [],
      sunParticles: [],
      selectedPlant: null,
      gridCols: 9,
      gridRows: 5,
      cellSize: 80,
      status: 'defending',
      gameOver: false
    };
    
    this.plantTypes = [
      { name: 'Sunflower', cost: 50, health: 100, sunRate: 5, color: '#f1c40f', range: 0 },
      { name: 'Peashooter', cost: 100, health: 100, damage: 20, fireRate: 1.5, color: '#2ecc71', range: 9 },
      { name: 'Wall Nut', cost: 50, health: 400, color: '#e67e22', range: 0 },
      { name: 'Cherry Bomb', cost: 150, health: 100, damage: 1800, color: '#e74c3c', range: 2 },
      { name: 'Ice Pea', cost: 175, health: 100, damage: 20, fireRate: 1.5, color: '#3498db', range: 9, slow: true }
    ];
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    for (let row = 0; row < this.gameState.gridRows; row++) {
      this.gameState.lawn[row] = [];
      for (let col = 0; col < this.gameState.gridCols; col++) {
        this.gameState.lawn[row][col] = null;
      }
    }
    
    this.gameState.waveTimer = 10;
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
    
    this.gameState.waveTimer -= deltaTime;
    if (this.gameState.waveTimer <= 0 && this.gameState.currentWave < this.gameState.waves) {
      this.spawnWave();
      this.gameState.currentWave++;
      this.gameState.waveTimer = 15;
    }
    
    this.gameState.sun += deltaTime * 2;
    
    this.gameState.plants.forEach(plant => {
      if (plant.type === 'Sunflower' && plant.timer <= 0) {
        this.gameState.sunParticles.push({
          x: plant.col * this.gameState.cellSize + 120 + Math.random() * 40,
          y: plant.row * this.gameState.cellSize + 80,
          targetX: 40,
          targetY: 30,
          value: 25
        });
        plant.timer = plant.sunRate;
      } else if (plant.type === 'Sunflower') {
        plant.timer -= deltaTime;
      }
      
      if (plant.type === 'Peashooter' || plant.type === 'Ice Pea') {
        plant.timer -= deltaTime;
        if (plant.timer <= 0) {
          const zombieInRow = this.gameState.zombies.some(z => z.row === plant.row && z.x > plant.col * this.gameState.cellSize);
          if (zombieInRow) {
            this.gameState.projectiles.push({
              x: plant.col * this.gameState.cellSize + 70,
              y: plant.row * this.gameState.cellSize + 50,
              vx: 300,
              damage: plant.damage,
              slow: plant.slow || false,
              row: plant.row
            });
            plant.timer = plant.fireRate;
          }
        }
      }
    });
    
    this.gameState.zombies.forEach(zombie => {
      zombie.x -= zombie.speed * deltaTime;
      
      if (zombie.eating) {
        zombie.eatTimer -= deltaTime;
        if (zombie.eatTimer <= 0) {
          zombie.eating = false;
        }
        
        this.gameState.plants.forEach((plant, pi) => {
          if (plant.row === zombie.row && Math.abs(plant.col * this.gameState.cellSize - zombie.x) < 40) {
            plant.health -= 10 * deltaTime;
            if (plant.health <= 0) {
              this.gameState.plants.splice(pi, 1);
              zombie.eating = false;
            }
          }
        });
      } else {
        this.gameState.plants.forEach(plant => {
          if (plant.row === zombie.row && Math.abs(plant.col * this.gameState.cellSize - zombie.x) < 40) {
            zombie.eating = true;
            zombie.eatTimer = 1;
          }
        });
      }
      
      if (zombie.x < -20) {
        this.gameState.gameOver = true;
      }
    });
    
    this.gameState.projectiles = this.gameState.projectiles.filter(proj => {
      proj.x += proj.vx * deltaTime;
      
      if (proj.x > 800) return false;
      
      this.gameState.zombies.forEach((zombie, zi) => {
        if (zombie.row === proj.row && Math.abs(zombie.x - proj.x) < 30) {
          zombie.health -= proj.damage;
          if (proj.slow) zombie.speed = 20;
          if (zombie.health <= 0) {
            this.gameState.score += 100;
            this.gameState.zombies.splice(zi, 1);
          }
          return false;
        }
      });
      
      return true;
    });
    
    this.gameState.sunParticles.forEach((sun, si) => {
      sun.x += (sun.targetX - sun.x) * 0.05;
      sun.y += (sun.targetY - sun.y) * 0.05;
      
      if (Math.abs(sun.x - sun.targetX) < 5 && Math.abs(sun.y - sun.targetY) < 5) {
        this.gameState.sun += sun.value;
        this.gameState.sunParticles.splice(si, 1);
      }
    });
  }
  
  spawnWave() {
    const zombiesPerWave = 5 + this.gameState.level * 2;
    for (let i = 0; i < zombiesPerWave; i++) {
      setTimeout(() => {
        if (!this.gameState.gameOver) {
          const row = Math.floor(Math.random() * 5);
          this.gameState.zombies.push({
            x: 820,
            y: row * this.gameState.cellSize + 80,
            row: row,
            health: 100 + this.gameState.level * 20,
            speed: 30 + Math.random() * 20,
            eating: false,
            eatTimer: 0
          });
        }
      }, i * 2000);
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  placePlant(plantType, col, row) {
    if (this.gameState.sun >= plantType.cost && !this.gameState.lawn[row][col]) {
      this.gameState.sun -= plantType.cost;
      this.gameState.plants.push({
        type: plantType.name,
        col: col,
        row: row,
        health: plantType.health,
        damage: plantType.damage,
        fireRate: plantType.fireRate,
        sunRate: plantType.sunRate,
        timer: 0,
        slow: plantType.slow || false
      });
      this.gameState.lawn[row][col] = plantType;
    }
  }
  
  render() {
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, 80);
    skyGrad.addColorStop(0, '#87ceeb');
    skyGrad.addColorStop(1, '#b0e0e6');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, 800, 600);
    
    this.ctx.fillStyle = '#8b4513';
    this.ctx.fillRect(90, 70, 640, 420);
    
    this.ctx.fillStyle = '#27ae60';
    for (let row = 0; row < this.gameState.gridRows; row++) {
      for (let col = 0; col < this.gameState.gridCols; col++) {
        if ((row + col) % 2 === 0) {
          this.ctx.fillStyle = '#2ecc71';
        } else {
          this.ctx.fillStyle = '#27ae60';
        }
        this.ctx.fillRect(95 + col * this.gameState.cellSize, 75 + row * this.gameState.cellSize, this.gameState.cellSize - 5, this.gameState.cellSize - 5);
      }
    }
    
    this.gameState.plants.forEach(plant => {
      const px = 95 + plant.col * this.gameState.cellSize + 40;
      const py = 75 + plant.row * this.gameState.cellSize + 40;
      
      if (plant.type === 'Sunflower') {
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.beginPath();
        this.ctx.arc(px, py, 25, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.beginPath();
        this.ctx.arc(px, py, 12, 0, Math.PI*2);
        this.ctx.fill();
      } else if (plant.type === 'Peashooter') {
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.fillRect(px - 15, py - 25, 30, 50);
        this.ctx.fillStyle = '#27ae60';
        this.ctx.beginPath();
        this.ctx.arc(px + 20, py - 10, 15, 0, Math.PI*2);
        this.ctx.fill();
      } else if (plant.type === 'Wall Nut') {
        this.ctx.fillStyle = '#e67e22';
        this.ctx.beginPath();
        this.ctx.ellipse(px, py, 20, 28, 0, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.fillStyle = '#d35400';
        this.ctx.beginPath();
        this.ctx.ellipse(px, py + 5, 12, 18, 0, 0, Math.PI*2);
        this.ctx.fill();
      } else if (plant.type === 'Cherry Bomb') {
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.arc(px, py, 20, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.fillStyle = '#c0392b';
        this.ctx.beginPath();
        this.ctx.arc(px - 5, py - 5, 8, 0, Math.PI*2);
        this.ctx.arc(px + 5, py + 5, 8, 0, Math.PI*2);
        this.ctx.fill();
      } else if (plant.type === 'Ice Pea') {
        this.ctx.fillStyle = '#3498db';
        this.ctx.fillRect(px - 15, py - 25, 30, 50);
        this.ctx.fillStyle = '#2980b9';
        this.ctx.beginPath();
        this.ctx.arc(px + 20, py - 10, 15, 0, Math.PI*2);
        this.ctx.fill();
      }
    });
    
    this.gameState.zombies.forEach(zombie => {
      this.ctx.fillStyle = '#7f8c8d';
      this.ctx.fillRect(zombie.x, zombie.y, 40, 70);
      this.ctx.fillStyle = '#95a5a6';
      this.ctx.fillRect(zombie.x + 5, zombie.y, 30, 15);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(zombie.x + 10, zombie.y - 15, 20, 10);
      this.ctx.fillStyle = '#fff';
      this.ctx.fillRect(zombie.x + 12, zombie.y - 12, 5, 5);
      this.ctx.fillRect(zombie.x + 23, zombie.y - 12, 5, 5);
    });
    
    this.gameState.projectiles.forEach(proj => {
      this.ctx.fillStyle = proj.slow ? '#3498db' : '#2ecc71';
      this.ctx.beginPath();
      this.ctx.arc(proj.x, proj.y, 8, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    this.gameState.sunParticles.forEach(sun => {
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.beginPath();
      this.ctx.arc(sun.x, sun.y, 20, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.fillStyle = '#f39c12';
      this.ctx.beginPath();
      this.ctx.arc(sun.x, sun.y, 12, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.fillRect(10, 10, 120, 50);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 30px Arial';
    this.ctx.fillText(Math.floor(this.gameState.sun), 70, 45);
    this.ctx.font = '12px Arial';
    this.ctx.fillText('SUN', 70, 25);
    
    this.ctx.fillStyle = '#2c3e50';
    for (let i = 0; i < this.plantTypes.length; i++) {
      const p = this.plantTypes[i];
      this.ctx.fillRect(10, 70 + i * 55, 70, 45);
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(45, 92 + i * 55, 15, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '10px Arial';
      this.ctx.fillText(p.name.substring(0, 8), 45, 112 + i * 55);
      this.ctx.fillText('$' + p.cost, 45, 125 + i * 55);
      this.ctx.fillStyle = '#2c3e50';
    }
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Score: ' + this.gameState.score, 150, 30);
    this.ctx.fillText('Wave: ' + this.gameState.currentWave + '/' + this.gameState.waves, 300, 30);
    this.ctx.fillText('Next: ' + Math.ceil(this.gameState.waveTimer) + 's', 450, 30);
    
    this.ctx.fillStyle = '#27ae60';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PLANTS VS ZOMBIES', 400, 25);
    
    if (this.gameState.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, 800, 600);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillText('GAME OVER', 400, 300);
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    
    if (input.select !== undefined) {
      this.gameState.selectedPlant = this.plantTypes[input.select];
    }
    
    if (input.place) {
      this.placePlant(this.gameState.selectedPlant, input.place.col, input.place.row);
    }
  }
}

window.PlantsVsZombiesGame = PlantsVsZombiesGame;