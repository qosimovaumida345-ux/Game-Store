// Sonic Style Platformer
class SonicPlatformerGame {
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
      rings: 0,
      lives: 3,
      player: null,
      platforms: [],
      enemies: [],
      rings: [],
      springs: [],
      goal: null,
      cameraX: 0,
      velocity: { x: 0, y: 0 },
      grinding: false,
      spinCharge: 0,
      status: 'playing',
      gameOver: false,
      won: false
    };
    
    this.physics = {
      gravity: 1200,
      runSpeed: 400,
      maxSpeed: 600,
      jumpForce: 550,
      friction: 0.9,
      airFriction: 0.98,
      grindSpeed: 500,
      spinSpeed: 15
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = {
      x: 100, y: 450,
      width: 30, height: 35,
      vx: 0, vy: 0,
      grounded: false,
      direction: 1,
      state: 'idle',
      spinning: false,
      invulnerable: 0
    };
    
    this.gameState.platforms = [
      { x: 0, y: 500, width: 300, height: 30, type: 'normal' },
      { x: 350, y: 450, width: 80, height: 20, type: 'normal' },
      { x: 480, y: 400, width: 100, height: 20, type: 'normal' },
      { x: 650, y: 350, width: 120, height: 20, type: 'normal' },
      { x: 850, y: 400, width: 150, height: 20, type: 'rail' },
      { x: 1050, y: 350, width: 80, height: 20, type: 'normal' },
      { x: 1200, y: 300, width: 100, height: 20, type: 'normal' },
      { x: 1400, y: 250, width: 150, height: 20, type: 'normal' },
      { x: 1650, y: 300, width: 80, height: 20, type: 'normal' },
      { x: 1800, y: 400, width: 200, height: 30, type: 'normal' }
    ];
    
    this.gameState.springs = [
      { x: 580, y: 480, active: true },
      { x: 1150, y: 380, active: true }
    ];
    
    this.gameState.rings = [
      { x: 200, y: 450, collected: false },
      { x: 250, y: 420, collected: false },
      { x: 390, y: 400, collected: false },
      { x: 520, y: 350, collected: false },
      { x: 700, y: 300, collected: false },
      { x: 900, y: 350, collected: false },
      { x: 920, y: 350, collected: false },
      { x: 940, y: 350, collected: false },
      { x: 1250, y: 250, collected: false },
      { x: 1450, y: 200, collected: false }
    ];
    
    this.gameState.enemies = [
      { x: 500, y: 488, type: 'crab', vx: 50, hp: 1 },
      { x: 700, y: 488, type: 'crab', vx: 50, hp: 1 },
      { x: 1250, y: 288, type: 'buzzer', vx: 30, vy: 20, hp: 1 },
      { x: 1500, y: 238, type: 'crab', vx: 50, hp: 1 }
    ];
    
    this.gameState.goal = { x: 1900, y: 350, width: 50, height: 50 };
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
    
    if (this.gameState.player.invulnerable > 0) this.gameState.player.invulnerable -= deltaTime;
    
    const p = this.gameState.player;
    const input = this.getPlayerInput(this.players[0]);
    
    if (input.spin && p.grounded) {
      p.spinning = true;
      p.spinCharge = 0;
    }
    
    if (p.spinning) {
      p.spinCharge += deltaTime * 30;
      p.vx = p.direction * this.physics.spinSpeed * Math.min(p.spinCharge, 5);
    } else {
      if (input.left) {
        p.vx -= this.physics.runSpeed * deltaTime * 5;
        p.direction = -1;
      } else if (input.right) {
        p.vx += this.physics.runSpeed * deltaTime * 5;
        p.direction = 1;
      }
      
      p.vx = Math.max(-this.physics.maxSpeed, Math.min(this.physics.maxSpeed, p.vx));
      p.vx *= p.grounded ? this.physics.friction : this.physics.airFriction;
    }
    
    if (input.jump && p.grounded) {
      p.vy = -this.physics.jumpForce;
      p.grounded = false;
      p.spinning = false;
    }
    
    p.vy += this.physics.gravity * deltaTime;
    
    p.x += p.vx * deltaTime;
    this.handleHorizontalCollisions();
    
    p.y += p.vy * deltaTime;
    p.grounded = false;
    this.handleVerticalCollisions();
    
    p.x = Math.max(20, p.x);
    
    this.checkRings();
    this.checkSprings();
    this.checkEnemies();
    this.checkGoal();
    
    this.gameState.enemies.forEach(e => {
      e.x += e.vx * deltaTime;
      if (e.x < this.gameState.cameraX - 50 || e.x > this.gameState.cameraX + 850) e.vx *= -1;
      if (e.type === 'buzzer') {
        e.y += Math.sin(this.gameState.time * 3 + e.x * 0.01) * e.vy * deltaTime;
      }
    });
    
    this.gameState.cameraX = Math.max(0, p.x - 200);
    
    if (p.y > 600) {
      this.loseRing();
    }
  }
  
  handleHorizontalCollisions() {
    const p = this.gameState.player;
    this.gameState.platforms.forEach(plat => {
      if (this.checkCollision(p, plat)) {
        if (p.vx > 0) p.x = plat.x - p.width;
        else if (p.vx < 0) p.x = plat.x + plat.width;
        p.vx = 0;
      }
    });
  }
  
  handleVerticalCollisions() {
    const p = this.gameState.player;
    this.gameState.platforms.forEach(plat => {
      if (this.checkCollision(p, plat)) {
        if (p.vy > 0) {
          p.y = plat.y - p.height;
          p.grounded = true;
          p.vy = 0;
          p.spinning = false;
          
          if (plat.type === 'rail') {
            this.gameState.grinding = true;
            p.vx = this.physics.grindSpeed * Math.sign(p.vx || p.direction);
          } else {
            this.gameState.grinding = false;
          }
        } else if (p.vy < 0) {
          p.y = plat.y + plat.height;
          p.vy = 0;
        }
      }
    });
  }
  
  checkCollision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }
  
  checkRings() {
    const p = this.gameState.player;
    this.gameState.rings.forEach(r => {
      if (!r.collected) {
        const dx = (p.x + p.width/2) - r.x;
        const dy = (p.y + p.height/2) - r.y;
        if (Math.sqrt(dx*dx + dy*dy) < 25) {
          r.collected = true;
          this.gameState.rings++;
          this.gameState.score += 50;
        }
      }
    });
  }
  
  checkSprings() {
    const p = this.gameState.player;
    this.gameState.springs.forEach(s => {
      if (s.active && p.x + p.width > s.x && p.x < s.x + 30 && p.y + p.height > s.y && p.y + p.height < s.y + 20) {
        p.vy = -700;
        p.grounded = false;
        s.active = false;
        setTimeout(() => s.active = true, 1000);
      }
    });
  }
  
  checkEnemies() {
    const p = this.gameState.player;
    if (p.invulnerable > 0) return;
    
    this.gameState.enemies.forEach((e, ei) => {
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      
      if (Math.sqrt(dx*dx + dy*dy) < 30) {
        if (p.spinning || (p.vy > 0 && p.y < e.y)) {
          p.vy = -300;
          this.gameState.score += 100;
          this.gameState.enemies.splice(ei, 1);
        } else {
          this.loseRing();
        }
      }
    });
  }
  
  checkGoal() {
    const p = this.gameState.player;
    if (this.checkCollision(p, this.gameState.goal)) {
      this.gameState.won = true;
      this.gameState.score += this.gameState.rings * 50 + 1000;
    }
  }
  
  loseRing() {
    if (this.gameState.rings > 0) {
      this.gameState.rings = Math.max(0, this.gameState.rings - 10);
      this.gameState.player.invulnerable = 2;
    } else {
      this.gameState.lives--;
      if (this.gameState.lives <= 0) {
        this.gameState.gameOver = true;
      } else {
        this.gameState.player.x = 100;
        this.gameState.player.y = 450;
        this.gameState.player.vx = 0;
        this.gameState.player.vy = 0;
        this.gameState.player.invulnerable = 2;
      }
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, 600);
    skyGrad.addColorStop(0, '#00b4db');
    skyGrad.addColorStop(0.5, '#0083b0');
    skyGrad.addColorStop(1, '#005c7a');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, 800, 600);
    
    this.ctx.save();
    this.ctx.translate(-this.gameState.cameraX, 0);
    
    this.ctx.fillStyle = '#4a7c59';
    this.gameState.platforms.forEach(plat => {
      this.ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
      if (plat.type === 'rail') {
        this.ctx.fillStyle = '#8b4513';
        this.ctx.fillRect(plat.x, plat.y + 5, plat.width, 5);
        this.ctx.fillStyle = '#4a7c59';
      }
    });
    
    this.ctx.fillStyle = '#f39c12';
    this.gameState.springs.forEach(s => {
      this.ctx.fillRect(s.x, s.y, 30, 15);
      this.ctx.fillStyle = s.active ? '#2ecc71' : '#7f8c8d';
      this.ctx.fillRect(s.x + 5, s.y + (s.active ? 0 : 5), 20, 10);
      this.ctx.fillStyle = '#f39c12';
    });
    
    this.ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
    this.gameState.rings.forEach(r => {
      if (!r.collected) {
        this.ctx.beginPath();
        this.ctx.arc(r.x, r.y, 12, 0, Math.PI*2);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.arc(r.x, r.y, 6, 0, Math.PI*2);
        this.ctx.fill();
      }
    });
    
    this.gameState.enemies.forEach(e => {
      if (e.type === 'crab') {
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(e.x - 15, e.y - 25, 30, 25);
        this.ctx.fillStyle = '#c0392b';
        this.ctx.fillRect(e.x - 20, e.y - 5, 40, 10);
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(e.x - 5, e.y - 18, 4, 0, Math.PI*2);
        this.ctx.arc(e.x + 5, e.y - 18, 4, 0, Math.PI*2);
        this.ctx.fill();
      } else {
        this.ctx.fillStyle = '#9b59b6';
        this.ctx.beginPath();
        this.ctx.arc(e.x, e.y - 15, 15, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(e.x - 5, e.y - 18, 3, 0, Math.PI*2);
        this.ctx.arc(e.x + 5, e.y - 18, 3, 0, Math.PI*2);
        this.ctx.fill();
      }
    });
    
    const g = this.gameState.goal;
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(g.x, g.y, g.width, g.height);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.fillText('GOAL', g.x + 10, g.y + 30);
    
    const p = this.gameState.player;
    if (this.gameState.player.invulnerable <= 0 || Math.floor(this.gameState.time * 15) % 2 === 0) {
      const px = p.x;
      const py = p.y;
      
      if (p.spinning) {
        this.ctx.fillStyle = '#2980b9';
        this.ctx.beginPath();
        this.ctx.arc(px + 15, py + 17, 18, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.fillStyle = '#3498db';
        this.ctx.beginPath();
        this.ctx.arc(px + 15, py + 17, 12, 0, Math.PI*2);
        this.ctx.fill();
      } else {
        this.ctx.fillStyle = '#2980b9';
        this.ctx.beginPath();
        this.ctx.ellipse(px + 15, py + 25, 15, 18, 0, 0, Math.PI*2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#f5d0c5';
        this.ctx.beginPath();
        this.ctx.arc(px + 20, py + 8, 10, 0, Math.PI*2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(px + 18, py + 5, 4, 5);
        this.ctx.fillRect(px + 26, py + 5, 4, 5);
        
        this.ctx.fillStyle = '#c0392b';
        this.ctx.beginPath();
        this.ctx.arc(px + 30, py + 15, 8, 0, Math.PI*2);
        this.ctx.fill();
        
        if (p.grounded) {
          this.ctx.fillStyle = '#f39c12';
          this.ctx.beginPath();
          this.ctx.arc(px + 8, py + 38, 6, 0, Math.PI*2);
          this.ctx.arc(px + 22, py + 38, 6, 0, Math.PI*2);
          this.ctx.fill();
        }
      }
    }
    
    this.ctx.restore();
    
    this.ctx.fillStyle = '#ffd700';
    this.ctx.fillRect(20, 20, 150, 25);
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(22, 22, 146 * (this.gameState.rings / 100), 21);
    this.ctx.strokeStyle = '#fff';
    this.ctx.strokeRect(20, 20, 150, 25);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Rings: ' + this.gameState.rings, 25, 38);
    this.ctx.fillText('Score: ' + this.gameState.score, 180, 30);
    this.ctx.fillText('Lives: ' + this.gameState.lives, 320, 30);
    
    this.ctx.fillStyle = '#2980b9';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('SONIC STYLE', 400, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.SonicPlatformerGame = SonicPlatformerGame;