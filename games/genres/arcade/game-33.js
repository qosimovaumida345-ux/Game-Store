// Snake Evolution Game
class SnakeEvolutionGame {
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
      snake: [],
      food: null,
      powerUp: null,
      direction: { x: 1, y: 0 },
      nextDirection: { x: 1, y: 0 },
      gridSize: 20,
      status: 'playing',
      gameOver: false,
      evolution: 0,
      abilities: []
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    this.spawnFood();
  }
  
  spawnFood() {
    this.gameState.food = {
      x: Math.floor(Math.random() * (this.canvas.width / this.gameState.gridSize)),
      y: Math.floor(Math.random() * (this.canvas.height / this.gameState.gridSize)),
      type: 'normal'
    };
    
    if (Math.random() < 0.2) {
      this.gameState.food.type = 'golden';
    }
  }
  
  spawnPowerUp() {
    const types = ['speed', 'ghost', 'double'];
    this.gameState.powerUp = {
      x: Math.floor(Math.random() * (this.canvas.width / this.gameState.gridSize)),
      y: Math.floor(Math.random() * (this.canvas.height / this.gameState.gridSize)),
      type: types[Math.floor(Math.random() * types.length)]
    };
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
    
    const baseSpeed = 0.1;
    const speedMod = this.gameState.abilities.includes('speed') ? 0.7 : 1;
    
    if (this.gameState.time > baseSpeed * speedMod) {
      this.gameState.time = 0;
      this.gameState.direction = this.gameState.nextDirection;
      
      const head = { 
        x: this.gameState.snake[0].x + this.gameState.direction.x,
        y: this.gameState.snake[0].y + this.gameState.direction.y
      };
      
      if (head.x < 0 || head.x >= this.canvas.width / this.gameState.gridSize ||
          head.y < 0 || head.y >= this.canvas.height / this.gameState.gridSize) {
        this.gameState.gameOver = true;
        return;
      }
      
      if (!this.gameState.abilities.includes('ghost')) {
        for (let i = 0; i < this.gameState.snake.length; i++) {
          if (head.x === this.gameState.snake[i].x && head.y === this.gameState.snake[i].y) {
            this.gameState.gameOver = true;
            return;
          }
        }
      }
      
      this.gameState.snake.unshift(head);
      
      if (this.gameState.food && head.x === this.gameState.food.x && head.y === this.gameState.food.y) {
        if (this.gameState.food.type === 'golden') {
          this.gameState.score += 50;
          this.gameState.evolution++;
          if (this.gameState.evolution % 3 === 0) {
            const abilityTypes = ['speed', 'ghost', 'double'];
            const newAbility = abilityTypes[Math.floor(Math.random() * abilityTypes.length)];
            if (!this.gameState.abilities.includes(newAbility)) {
              this.gameState.abilities.push(newAbility);
            }
          }
        } else {
          this.gameState.score += 10;
        }
        this.spawnFood();
      } else {
        this.gameState.snake.pop();
      }
      
      if (this.gameState.powerUp && head.x === this.gameState.powerUp.x && head.y === this.gameState.powerUp.y) {
        if (!this.gameState.abilities.includes(this.gameState.powerUp.type)) {
          this.gameState.abilities.push(this.gameState.powerUp.type);
        }
        this.gameState.powerUp = null;
      }
      
      if (!this.gameState.powerUp && Math.random() < 0.05) {
        this.spawnPowerUp();
      }
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input) {
    if (input.up && this.gameState.direction.y === 0) {
      this.gameState.nextDirection = { x: 0, y: -1 };
    } else if (input.down && this.gameState.direction.y === 0) {
      this.gameState.nextDirection = { x: 0, y: 1 };
    } else if (input.left && this.gameState.direction.x === 0) {
      this.gameState.nextDirection = { x: -1, y: 0 };
    } else if (input.right && this.gameState.direction.x === 0) {
      this.gameState.nextDirection = { x: 1, y: 0 };
    }
  }
  
  render() {
    this.ctx.fillStyle = '#0a0a1a';
    this.ctx.fillRect(0, 0, 800, 600);
    
    this.ctx.strokeStyle = '#1a1a2a';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < 800; i += this.gameState.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, 600);
      this.ctx.stroke();
    }
    for (let i = 0; i < 600; i += this.gameState.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(800, i);
      this.ctx.stroke();
    }
    
    if (this.gameState.food) {
      const fx = this.gameState.food.x * this.gameState.gridSize + this.gameState.gridSize/2;
      const fy = this.gameState.food.y * this.gameState.gridSize + this.gameState.gridSize/2;
      
      if (this.gameState.food.type === 'golden') {
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.shadowColor = '#f1c40f';
        this.ctx.shadowBlur = 15;
      } else {
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.shadowBlur = 0;
      }
      
      this.ctx.beginPath();
      this.ctx.arc(fx, fy, this.gameState.gridSize/2 - 2, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }
    
    if (this.gameState.powerUp) {
      const px = this.gameState.powerUp.x * this.gameState.gridSize + this.gameState.gridSize/2;
      const py = this.gameState.powerUp.y * this.gameState.gridSize + this.gameState.gridSize/2;
      
      const color = this.gameState.powerUp.type === 'speed' ? '#3498db' : 
                   this.gameState.powerUp.type === 'ghost' ? '#9b59b6' : '#2ecc71';
      
      this.ctx.fillStyle = color;
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(px, py, this.gameState.gridSize/2 - 2, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }
    
    this.gameState.snake.forEach((segment, index) => {
      const x = segment.x * this.gameState.gridSize;
      const y = segment.y * this.gameState.gridSize;
      
      if (index === 0) {
        this.ctx.fillStyle = '#2ecc71';
      } else {
        const shade = Math.max(0.3, 1 - index * 0.05);
        this.ctx.fillStyle = `rgba(46, 204, 113, ${shade})`;
      }
      
      this.ctx.fillRect(x + 1, y + 1, this.gameState.gridSize - 2, this.gameState.gridSize - 2);
    });
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Score: ' + this.gameState.score, 20, 30);
    this.ctx.fillText('Evolution: ' + this.gameState.evolution, 150, 30);
    
    if (this.gameState.abilities.length > 0) {
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.fillText('Abilities: ' + this.gameState.abilities.join(', '), 20, 55);
    }
    
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('SNAKE EVOLUTION', 400, 25);
    
    if (this.gameState.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, 800, 600);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 40px Arial';
      this.ctx.fillText('GAME OVER', 400, 280);
      this.ctx.font = '20px Arial';
      this.ctx.fillText('Final Score: ' + this.gameState.score, 400, 330);
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input);
  }
}

window.SnakeEvolutionGame = SnakeEvolutionGame;