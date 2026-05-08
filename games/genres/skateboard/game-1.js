// Skateboard Pro Game
class SkateboardProGame {
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
      combo: 0,
      maxCombo: 0,
      status: 'playing',
      skater: null,
      obstacles: [],
      ramps: [],
      grindRails: [],
      collectibles: [],
      direction: 1,
      grindScore: 0,
      airTime: 0,
      currentTrick: null,
      trickProgress: 0,
      gameOver: false
    };
    
    this.config = {
      groundY: 500,
      scrollSpeed: 5,
      jumpForce: 15,
      gravity: 0.6,
      groundFriction: 0.98
    };
    
    this.generateLevel();
    this.initGame();
  }
  
  generateLevel() {
    this.gameState.obstacles = [];
    this.gameState.ramps = [];
    this.gameState.grindRails = [];
    this.gameState.collectibles = [];
    
    for (let i = 0; i < 50; i++) {
      const x = 200 + i * 150;
      
      const type = Math.random();
      if (type < 0.3) {
        this.gameState.obstacles.push({
          x: x,
          y: this.config.groundY - 30,
          width: 30,
          height: 30,
          type: 'box'
        });
      } else if (type < 0.5) {
        this.gameState.ramps.push({
          x: x,
          y: this.config.groundY,
          width: 80,
          height: 40,
          type: 'ramp'
        });
      } else if (type < 0.7) {
        this.gameState.grindRails.push({
          x: x,
          y: this.config.groundY - 50,
          length: 100,
          type: 'rail'
        });
      }
      
      if (Math.random() < 0.3) {
        this.gameState.collectibles.push({
          x: x + 50,
          y: this.config.groundY - 80 - Math.random() * 50,
          type: 'coin',
          collected: false
        });
      }
    }
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.skater = {
      x: 100,
      y: this.config.groundY - 40,
      vx: 5,
      vy: 0,
      rotation: 0,
      onGround: true,
      grinding: false,
      grindingRail: null,
      flipCount: 0,
      spinCount: 0
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
    this.gameState.time += deltaTime;
    
    this.updateSkater(deltaTime);
    this.updateCamera();
    this.checkCollisions();
    this.updateGameObjects();
  }
  
  updateSkater(deltaTime) {
    const skater = this.gameState.skater;
    const input = this.getPlayerInput(this.players[0]);
    
    skater.vx += 0.1;
    skater.vx = Math.min(skater.vx, 12);
    
    skater.vy += this.config.gravity;
    skater.y += skater.vy;
    
    this.checkGrinding();
    
    if (skater.onGround) {
      skater.y = this.config.groundY - 40;
      skater.vy = 0;
      skater.rotation = 0;
      skater.flipCount = 0;
      skater.spinCount = 0;
      
      if (skater.grinding) {
        this.gameState.grindScore += 10;
        this.gameState.score += 10;
      }
    }
    
    if (input.up && skater.onGround) {
      skater.vy = -this.config.jumpForce;
      skater.onGround = false;
      this.gameState.airTime = 0;
    }
    
    if (!skater.onGround) {
      this.gameState.airTime += deltaTime;
      
      if (input.left) {
        skater.rotation -= 10;
        skater.spinCount++;
      }
      if (input.right) {
        skater.rotation += 10;
        skater.spinCount++;
      }
      
      if (input.a) {
        skater.flipCount++;
        skater.rotation += 180;
      }
      
      this.performTricks();
    }
    
    this.checkRamps();
  }
  
  checkGrinding() {
    const skater = this.gameState.skater;
    skater.grinding = false;
    
    this.gameState.grindRails.forEach(rail => {
      if (skater.x > rail.x && skater.x < rail.x + rail.length &&
          Math.abs(skater.y - rail.y) < 20) {
        skater.grinding = true;
        skater.grindingRail = rail;
        skater.y = rail.y - 40;
        skater.vy = 0;
        skater.onGround = true;
      }
    });
  }
  
  checkRamps() {
    const skater = this.gameState.skater;
    
    this.gameState.ramps.forEach(ramp => {
      if (skater.x > ramp.x && skater.x < ramp.x + ramp.width &&
          skater.y > ramp.y - ramp.height) {
        const progress = (skater.x - ramp.x) / ramp.width;
        const rampHeight = ramp.height * (1 - Math.pow(progress - 0.5, 2) * 4);
        
        if (skater.y > ramp.y - rampHeight - 40) {
          skater.y = ramp.y - rampHeight - 40;
          skater.vy = -ramp.height * 0.3;
          skater.onGround = false;
        }
      }
    });
  }
  
  performTricks() {
    const skater = this.gameState.skater;
    
    if (skater.flipCount > 0 && !this.gameState.currentTrick) {
      const flipPoints = skater.flipCount * 100;
      const airBonus = Math.floor(this.gameState.airTime * 50);
      this.gameState.score += flipPoints + airBonus;
      this.gameState.combo++;
      this.gameState.maxCombo = Math.max(this.gameState.maxCombo, this.gameState.combo);
      
      this.gameState.currentTrick = `${skater.flipCount}x Flip!`;
      setTimeout(() => { this.gameState.currentTrick = null; }, 1000);
    }
    
    if (Math.abs(skater.spinCount) > 1 && !this.gameState.currentTrick) {
      const spinPoints = Math.abs(skater.spinCount) * 50;
      this.gameState.score += spinPoints;
      this.gameState.combo++;
      
      this.gameState.currentTrick = `${skater.spinCount * 180}° Spin!`;
      setTimeout(() => { this.gameState.currentTrick = null; }, 1000);
    }
  }
  
  checkCollisions() {
    const skater = this.gameState.skater;
    
    this.gameState.obstacles.forEach(obs => {
      if (skater.x + 20 > obs.x && skater.x - 20 < obs.x + obs.width &&
          skater.y + 20 > obs.y && skater.y - 20 < obs.y + obs.height) {
        this.gameState.combo = 0;
        this.gameState.score = Math.max(0, this.gameState.score - 50);
      }
    });
    
    this.gameState.collectibles.forEach(item => {
      if (!item.collected) {
        const dx = skater.x - item.x;
        const dy = skater.y - item.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 40) {
          item.collected = true;
          this.gameState.score += 50;
          this.gameState.combo++;
        }
      }
    });
  }
  
  updateCamera() {
    this.cameraX = this.gameState.skater.x - 200;
  }
  
  updateGameObjects() {
    this.gameState.obstacles = this.gameState.obstacles.filter(o => o.x > this.cameraX - 100);
    this.gameState.ramps = this.gameState.ramps.filter(r => r.x > this.cameraX - 100);
    this.gameState.grindRails = this.gameState.grindRails.filter(r => r.x > this.cameraX - 100);
    this.gameState.collectibles = this.gameState.collectibles.filter(c => c.x > this.cameraX - 100 && !c.collected);
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.drawBackground();
    this.drawGround();
    this.drawObstacles();
    this.drawRamps();
    this.drawRails();
    this.drawCollectibles();
    this.drawSkater();
    this.drawUI();
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#98D8C8');
    gradient.addColorStop(1, '#7BC8A4');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (let i = 0; i < 5; i++) {
      this.ctx.beginPath();
      this.ctx.arc(100 + i * 200, 80, 30, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  
  drawGround() {
    this.ctx.fillStyle = '#555';
    this.ctx.fillRect(0, this.config.groundY, this.canvas.width, 100);
    
    this.ctx.strokeStyle = '#777';
    this.ctx.lineWidth = 2;
    for (let i = 0; i < this.canvas.width; i += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, this.config.groundY);
      this.ctx.lineTo(i, this.canvas.height);
      this.ctx.stroke();
    }
  }
  
  drawObstacles() {
    this.gameState.obstacles.forEach(obs => {
      const x = obs.x - this.cameraX;
      if (x > -50 && x < this.canvas.width + 50) {
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x, obs.y, obs.width, obs.height);
        
        this.ctx.strokeStyle = '#5D3A1A';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, obs.y, obs.width, obs.height);
      }
    });
  }
  
  drawRamps() {
    this.gameState.ramps.forEach(ramp => {
      const x = ramp.x - this.cameraX;
      if (x > -100 && x < this.canvas.width + 100) {
        this.ctx.fillStyle = '#666';
        this.ctx.beginPath();
        this.ctx.moveTo(x, ramp.y);
        this.ctx.lineTo(x + ramp.width, ramp.y);
        this.ctx.lineTo(x + ramp.width, ramp.y - ramp.height);
        this.ctx.closePath();
        this.ctx.fill();
      }
    });
  }
  
  drawRails() {
    this.gameState.grindRails.forEach(rail => {
      const x = rail.x - this.cameraX;
      if (x > -100 && x < this.canvas.width + 100) {
        this.ctx.fillStyle = '#c0c0c0';
        this.ctx.fillRect(x, rail.y, rail.length, 8);
        
        this.ctx.fillStyle = '#888';
        this.ctx.fillRect(x, rail.y + 8, 8, 30);
        this.ctx.fillRect(x + rail.length - 8, rail.y + 8, 8, 30);
      }
    });
  }
  
  drawCollectibles() {
    this.gameState.collectibles.forEach(item => {
      const x = item.x - this.cameraX;
      if (x > -50 && x < this.canvas.width + 50) {
        this.ctx.fillStyle = '#ffd700';
        this.ctx.beginPath();
        this.ctx.arc(x, item.y, 15, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#ffea00';
        this.ctx.beginPath();
        this.ctx.arc(x - 3, item.y - 3, 5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }
  
  drawSkater() {
    const skater = this.gameState.skater;
    const x = skater.x - this.cameraX;
    
    this.ctx.save();
    this.ctx.translate(x, skater.y);
    this.ctx.rotate(skater.rotation * Math.PI / 180);
    
    this.ctx.fillStyle = '#ff6b6b';
    this.ctx.beginPath();
    this.ctx.arc(0, -30, 12, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(-15, -18, 30, 25);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(-18, 7, 36, 15);
    
    this.ctx.fillStyle = '#888';
    this.ctx.fillRect(-20, 22, 12, 8);
    this.ctx.fillRect(8, 22, 12, 8);
    
    this.ctx.fillStyle = '#ffdd00';
    this.ctx.fillRect(-18, 30, 10, 4);
    this.ctx.fillRect(8, 30, 10, 4);
    
    this.ctx.restore();
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 150, 80);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 35);
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`Combo: ${this.gameState.combo}`, 20, 55);
    this.ctx.fillText(`Max: ${this.gameState.maxCombo}`, 20, 75);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('SKATEBOARD', this.canvas.width / 2, 30);
    
    if (this.gameState.currentTrick) {
      this.ctx.fillStyle = '#ff0';
      this.ctx.font = 'bold 24px Arial';
      this.ctx.fillText(this.gameState.currentTrick, this.canvas.width / 2, this.canvas.height / 2);
    }
    
    if (skater = this.gameState.skater, skater.grinding) {
      this.ctx.fillStyle = '#0ff';
      this.ctx.font = 'bold 20px Arial';
      this.ctx.fillText('GRINDING!', x = this.gameState.skater.x - this.cameraX, this.gameState.skater.y - 60);
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.SkateboardProGame = SkateboardProGame;