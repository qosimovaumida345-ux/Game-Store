// Angry Birds Style Game
class AngryBirdsGame {
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
      level: 1,
      birds: [],
      currentBird: null,
      slingPos: { x: 150, y: 450 },
      dragging: false,
      dragStart: null,
      velocity: { x: 0, y: 0 },
      trajectory: [],
      enemies: [],
      blocks: [],
      ground: 520,
      status: 'aiming',
      gameOver: false,
      won: false
    };
    
    this.physics = {
      gravity: 800,
      friction: 0.99,
      bounce: 0.5
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.birds = [
      { color: '#e74c3c', radius: 15, damage: 30, special: null },
      { color: '#f1c40f', radius: 15, damage: 25, special: 'speed' },
      { color: '#2ecc71', radius: 15, damage: 20, special: 'explode' },
      { color: '#3498db', radius: 15, damage: 35, special: null },
      { color: '#9b59b6', radius: 15, damage: 40, special: null }
    ];
    
    this.gameState.currentBird = this.gameState.birds[0];
    
    this.gameState.blocks = [
      { x: 550, y: 480, width: 30, height: 40, health: 30, type: 'wood' },
      { x: 580, y: 480, width: 30, height: 40, health: 30, type: 'wood' },
      { x: 565, y: 445, width: 60, height: 15, health: 20, type: 'wood' },
      { x: 560, y: 420, width: 40, height: 40, health: 40, type: 'stone' },
      { x: 600, y: 420, width: 40, height: 40, health: 40, type: 'stone' },
      { x: 575, y: 380, width: 40, height: 15, health: 15, type: 'wood' },
      { x: 650, y: 480, width: 20, height: 40, health: 20, type: 'wood' },
      { x: 670, y: 480, width: 20, height: 40, health: 20, type: 'wood' },
      { x: 660, y: 450, width: 40, height: 15, health: 15, type: 'wood' }
    ];
    
    this.gameState.enemies = [
      { x: 565, y: 400, radius: 15, health: 50 },
      { x: 660, y: 430, radius: 15, health: 50 },
      { x: 660, y: 350, radius: 15, health: 50 }
    ];
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
    
    if (this.gameState.status === 'flying') {
      const bird = this.gameState.currentBird;
      bird.vx += bird.ax * deltaTime;
      bird.vy += bird.ay * deltaTime;
      bird.vy += this.physics.gravity * deltaTime;
      
      bird.x += bird.vx * deltaTime;
      bird.y += bird.vy * deltaTime;
      
      if (bird.x > 800 || bird.x < 0 || bird.y > this.gameState.ground + 50) {
        this.nextBird();
      }
      
      this.gameState.blocks.forEach((block, bi) => {
        if (this.checkBirdBlockCollision(bird, block)) {
          const speed = Math.sqrt(bird.vx * bird.vx + bird.vy * bird.vy);
          block.health -= bird.damage * speed / 100;
          
          bird.vx *= -0.3;
          bird.vy *= -0.3;
          
          if (block.health <= 0) {
            this.gameState.score += 50;
            this.gameState.blocks.splice(bi, 1);
          }
        }
      });
      
      this.gameState.enemies = this.gameState.enemies.filter(enemy => {
        const dx = bird.x - enemy.x;
        const dy = bird.y - enemy.y;
        if (Math.sqrt(dx*dx + dy*dy) < bird.radius + enemy.radius) {
          enemy.health -= bird.damage;
          if (enemy.health <= 0) {
            this.gameState.score += 500;
            return false;
          }
        }
        return true;
      });
      
      if (this.gameState.enemies.length === 0 && this.gameState.blocks.length === 0) {
        this.gameState.won = true;
        this.gameState.score += 1000;
      }
    }
  }
  
  checkBirdBlockCollision(bird, block) {
    return bird.x + bird.radius > block.x && 
           bird.x - bird.radius < block.x + block.width &&
           bird.y + bird.radius > block.y &&
           bird.y - bird.radius < block.y + block.height;
  }
  
  launchBird(power, angle) {
    if (this.gameState.status !== 'aiming') return;
    
    const bird = this.gameState.currentBird;
    bird.x = this.gameState.slingPos.x;
    bird.y = this.gameState.slingPos.y;
    bird.vx = Math.cos(angle) * power * 3;
    bird.vy = Math.sin(angle) * power * 3;
    bird.ax = 0;
    bird.ay = 0;
    
    this.gameState.status = 'flying';
  }
  
  nextBird() {
    this.gameState.birds.shift();
    if (this.gameState.birds.length === 0) {
      if (this.gameState.enemies.length > 0) {
        this.gameState.gameOver = true;
      } else {
        this.gameState.won = true;
      }
    } else {
      this.gameState.currentBird = this.gameState.birds[0];
      this.gameState.status = 'aiming';
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, 600);
    skyGrad.addColorStop(0, '#87ceeb');
    skyGrad.addColorStop(0.5, '#b0e0e6');
    skyGrad.addColorStop(1, '#7cfc00');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, 800, 600);
    
    this.ctx.fillStyle = '#228b22';
    this.ctx.fillRect(0, this.gameState.ground, 800, 80);
    
    this.ctx.fillStyle = '#8b4513';
    this.ctx.beginPath();
    this.ctx.moveTo(120, this.gameState.ground);
    this.ctx.lineTo(150, 350);
    this.ctx.lineTo(180, this.gameState.ground);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#654321';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(150, 450);
    this.ctx.lineTo(150, this.gameState.ground);
    this.ctx.stroke();
    
    if (this.gameState.status === 'aiming' && this.gameState.currentBird) {
      const input = this.getPlayerInput(this.players[0]);
      const power = input.power || 50;
      const angle = (input.angle || 0) * Math.PI;
      
      this.ctx.strokeStyle = '#8b4513';
      this.ctx.lineWidth = 8;
      this.ctx.beginPath();
      this.ctx.moveTo(150, 450);
      this.ctx.lineTo(150 - Math.cos(angle) * power, 450 - Math.sin(angle) * power);
      this.ctx.stroke();
    }
    
    this.gameState.blocks.forEach(block => {
      if (block.type === 'wood') {
        this.ctx.fillStyle = '#d35400';
      } else {
        this.ctx.fillStyle = '#7f8c8d';
      }
      this.ctx.fillRect(block.x, block.y, block.width, block.height);
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(block.x, block.y, block.width, block.height);
    });
    
    this.gameState.enemies.forEach(enemy => {
      this.ctx.fillStyle = '#2ecc71';
      this.ctx.beginPath();
      this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.fillStyle = '#27ae60';
      this.ctx.beginPath();
      this.ctx.arc(enemy.x, enemy.y - 5, enemy.radius * 0.6, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.fillStyle = '#fff';
      this.ctx.beginPath();
      this.ctx.arc(enemy.x - 5, enemy.y - 5, 4, 0, Math.PI*2);
      this.ctx.arc(enemy.x + 5, enemy.y - 5, 4, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.fillStyle = '#000';
      this.ctx.beginPath();
      this.ctx.arc(enemy.x - 5, enemy.y - 5, 2, 0, Math.PI*2);
      this.ctx.arc(enemy.x + 5, enemy.y - 5, 2, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.beginPath();
      this.ctx.moveTo(enemy.x - 8, enemy.y + 5);
      this.ctx.lineTo(enemy.x, enemy.y + 10);
      this.ctx.lineTo(enemy.x + 8, enemy.y + 5);
      this.ctx.fill();
    });
    
    if (this.gameState.currentBird && this.gameState.status === 'flying') {
      const bird = this.gameState.currentBird;
      this.ctx.fillStyle = bird.color;
      this.ctx.beginPath();
      this.ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.fillStyle = '#fff';
      this.ctx.beginPath();
      this.ctx.arc(bird.x - 3, bird.y - 3, 5, 0, Math.PI*2);
      this.ctx.arc(bird.x + 8, bird.y - 3, 5, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.fillStyle = '#000';
      this.ctx.beginPath();
      this.ctx.arc(bird.x - 3, bird.y - 3, 2, 0, Math.PI*2);
      this.ctx.arc(bird.x + 8, bird.y - 3, 2, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.beginPath();
      this.ctx.moveTo(bird.x + 12, bird.y - 2);
      this.ctx.lineTo(bird.x + 20, bird.y - 8);
      this.ctx.lineTo(bird.x + 20, bird.y + 4);
      this.ctx.fill();
    }
    
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.fillText('BIRDS: ' + this.gameState.birds.length, 20, 30);
    this.ctx.fillText('PIGS: ' + this.gameState.enemies.length, 120, 30);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Score: ' + this.gameState.score, 650, 30);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('ANGRY BIRDS', 400, 25);
    
    if (this.gameState.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, 800, 600);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillText('GAME OVER', 400, 300);
    }
    
    if (this.gameState.won) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, 800, 600);
      this.ctx.fillStyle = '#2ecc71';
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillText('YOU WIN!', 400, 300);
      this.ctx.font = '24px Arial';
      this.ctx.fillText('Score: ' + this.gameState.score, 400, 350);
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    if (input.launch) {
      this.launchBird(input.power || 50, input.angle || 0);
    }
  }
}

window.AngryBirdsGame = AngryBirdsGame;