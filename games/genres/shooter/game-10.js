// Contra Style Run and Gun
class ContraGame {
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
      bullets: [],
      enemies: [],
      platforms: [],
      direction: 1,
      canJump: true,
      crouching: false,
      invulnerable: 0,
      status: 'playing',
      gameOver: false
    };
    
    this.physics = {
      gravity: 1200,
      jumpForce: 600,
      moveSpeed: 250
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
      width: 30, height: 50,
      vx: 0, vy: 0,
      grounded: true,
      facingRight: true,
      state: 'idle'
    };
    
    this.gameState.platforms = [
      { x: 0, y: 500, width: 200, height: 30 },
      { x: 250, y: 450, width: 100, height: 20 },
      { x: 400, y: 400, width: 100, height: 20 },
      { x: 550, y: 350, width: 100, height: 20 },
      { x: 700, y: 300, width: 100, height: 20 },
      { x: 600, y: 500, width: 200, height: 30 }
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
    if (this.gameState.gameOver) return;
    this.gameState.time += deltaTime;
    
    if (this.gameState.invulnerable > 0) this.gameState.invulnerable -= deltaTime;
    
    const p = this.gameState.player;
    const input = this.getPlayerInput(this.players[0]);
    
    if (input.left) {
      p.vx = -this.physics.moveSpeed;
      p.facingRight = false;
    } else if (input.right) {
      p.vx = this.physics.moveSpeed;
      p.facingRight = true;
    } else {
      p.vx = 0;
    }
    
    if (input.jump && p.grounded && this.gameState.canJump) {
      p.vy = -this.physics.jumpForce;
      p.grounded = false;
      this.gameState.canJump = false;
    }
    
    if (input.shoot) {
      this.fireBullet();
    }
    
    p.vy += this.physics.gravity * deltaTime;
    
    p.x += p.vx * deltaTime;
    this.handleHorizontalCollisions();
    
    p.y += p.vy * deltaTime;
    p.grounded = false;
    this.handleVerticalCollisions();
    
    p.x = Math.max(20, Math.min(780, p.x));
    
    if (p.y > 600) {
      this.gameState.lives--;
      if (this.gameState.lives <= 0) {
        this.gameState.gameOver = true;
      } else {
        p.x = 100;
        p.y = 450;
        p.vx = 0;
        p.vy = 0;
        this.gameState.invulnerable = 2;
      }
    }
    
    this.updateBullets(deltaTime);
    this.updateEnemies(deltaTime);
    this.spawnEnemies();
  }
  
  fireBullet() {
    const p = this.gameState.player;
    const dir = p.facingRight ? 1 : -1;
    
    this.gameState.bullets.push({
      x: p.x + (dir > 0 ? 30 : 0),
      y: p.y + (this.gameState.crouching ? 20 : 10),
      vx: dir * 600,
      vy: 0,
      spread: 0,
      owner: 'player'
    });
    
    if (Math.random() < 0.3) {
      this.gameState.bullets.push({
        x: p.x + (dir > 0 ? 30 : 0),
        y: p.y + 10,
        vx: dir * 550,
        vy: dir * 50,
        spread: 1,
        owner: 'player'
      });
    }
  }
  
  handleHorizontalCollisions() {
    const p = this.gameState.player;
    this.gameState.platforms.forEach(plat => {
      if (this.checkCollision(p, plat)) {
        if (p.vx > 0) p.x = plat.x - p.width;
        else if (p.vx < 0) p.x = plat.x + plat.width;
      }
    });
  }
  
  handleVerticalCollisions() {
    const p = this.gameState.player;
    this.gameState.platforms.forEach(plat => {
      if (this.checkCollision(p, plat)) {
        if (p.vy > 0) {
          p.y = plat.y - p.height;
          p.vy = 0;
          p.grounded = true;
          this.gameState.canJump = true;
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
  
  updateBullets(deltaTime) {
    this.gameState.bullets = this.gameState.bullets.filter(b => {
      b.x += b.vx * deltaTime;
      b.y += b.vy * deltaTime;
      
      if (b.x < -50 || b.x > 850) return false;
      
      if (b.owner === 'player') {
        this.gameState.enemies.forEach((e, ei) => {
          if (this.checkCollision({ x: b.x - 3, y: b.y - 3, width: 6, height: 6 }, { x: e.x, y: e.y - 20, width: 30, height: 40 })) {
            e.hp -= 10;
            if (e.hp <= 0) {
              this.gameState.score += e.score || 100;
              this.gameState.enemies.splice(ei, 1);
            }
            return false;
          }
        });
      }
      
      return true;
    });
  }
  
  spawnEnemies() {
    if (Math.random() < 0.02 && this.gameState.enemies.length < 8) {
      this.gameState.enemies.push({
        x: 850,
        y: 470,
        vx: -50 - Math.random() * 50,
        hp: 20,
        type: 'soldier',
        state: 'walking',
        shooting: false,
        shootTimer: 0,
        score: 100
      });
    }
  }
  
  updateEnemies(deltaTime) {
    this.gameState.enemies.forEach(e => {
      e.x += e.vx * deltaTime;
      
      if (e.x < -50) {
        this.gameState.enemies = this.gameState.enemies.filter(en => en !== e);
        return;
      }
      
      if (e.shooting) {
        e.shootTimer += deltaTime;
        if (e.shootTimer > 0.5) {
          e.shooting = false;
          e.shootTimer = 0;
        }
      } else if (Math.random() < 0.02) {
        e.shooting = true;
        this.gameState.bullets.push({
          x: e.x,
          y: e.y - 15,
          vx: -200 - Math.random() * 100,
          vy: (Math.random() - 0.5) * 50,
          spread: 0,
          owner: 'enemy'
        });
      }
      
      if (this.gameState.invulnerable <= 0) {
        const p = this.gameState.player;
        if (this.checkCollision({ x: p.x, y: p.y, width: p.width, height: p.height }, { x: e.x, y: e.y - 20, width: 30, height: 40 })) {
          this.gameState.lives--;
          this.gameState.invulnerable = 2;
          if (this.gameState.lives <= 0) {
            this.gameState.gameOver = true;
          }
        }
      }
    });
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, 600);
    bgGrad.addColorStop(0, '#1a1a2e');
    bgGrad.addColorStop(0.5, '#2c3e50');
    bgGrad.addColorStop(1, '#0a0a1a');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, 800, 600);
    
    this.ctx.fillStyle = '#4a4a4a';
    this.ctx.fillRect(0, 530, 800, 70);
    this.ctx.fillStyle = '#3a3a3a';
    this.ctx.fillRect(0, 530, 800, 5);
    
    this.ctx.fillStyle = '#5d6d7e';
    this.gameState.platforms.forEach(plat => {
      this.ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
      this.ctx.strokeStyle = '#7f8c8d';
      this.ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
    });
    
    this.gameState.enemies.forEach(e => {
      this.ctx.fillStyle = '#27ae60';
      this.ctx.fillRect(e.x - 15, e.y - 40, 30, 40);
      this.ctx.fillStyle = '#2ecc71';
      this.ctx.fillRect(e.x - 15, e.y - 40, 30, 15);
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(e.x - 8, e.y - 35, 6, 4);
      this.ctx.fillRect(e.x + 2, e.y - 35, 6, 4);
      
      if (e.shooting) {
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.fillRect(e.x - 25, e.y - 15, 10, 5);
      }
    });
    
    this.gameState.bullets.forEach(b => {
      if (b.owner === 'player') {
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.fillRect(b.x - 5, b.y - 2, 10, 4);
      } else {
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.arc(b.x, b.y, 4, 0, Math.PI*2);
        this.ctx.fill();
      }
    });
    
    const p = this.gameState.player;
    if (this.gameState.invulnerable <= 0 || Math.floor(this.gameState.time * 15) % 2 === 0) {
      const px = p.x;
      const py = p.y;
      
      this.ctx.fillStyle = '#3498db';
      this.ctx.fillRect(px, py, p.width, p.height);
      this.ctx.fillStyle = '#f5d0c5';
      this.ctx.beginPath();
      this.ctx.arc(px + 15, py - 5, 12, 0, Math.PI*2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#000';
      const eyeX = p.facingRight ? px + 20 : px + 8;
      this.ctx.fillRect(eyeX, py - 8, 4, 4);
      
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(px + 5, py + 5, 20, 8);
      
      if (!p.grounded) {
        this.ctx.fillStyle = '#8b4513';
        this.ctx.fillRect(px - 5, py + 15, 8, 15);
        this.ctx.fillRect(px + 27, py + 15, 8, 15);
      } else {
        this.ctx.fillStyle = '#8b4513';
        this.ctx.fillRect(px, py + 25, 8, 12);
        this.ctx.fillRect(px + 22, py + 25, 8, 12);
      }
    }
    
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(20, 550, 200, 20);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(20, 550, 200 * (this.gameState.lives / 3), 20);
    this.ctx.strokeStyle = '#fff';
    this.ctx.strokeRect(20, 550, 200, 20);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Score: ' + this.gameState.score, 20, 30);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.fillText('CONTRA', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.ContraGame = ContraGame;