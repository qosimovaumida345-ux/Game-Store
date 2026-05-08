// Super Mario Bros Style Platformer
class MarioBrosGame {
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
      coins: 0,
      lives: 3,
      player: null,
      cameraX: 0,
      worldWidth: 3000,
      platforms: [],
      ground: [],
      pipes: [],
      blocks: [],
      enemies: [],
      items: [],
      particles: [],
      flag: null,
      status: 'playing',
      gameOver: false,
      won: false
    };
    
    this.physics = {
      gravity: 1600,
      jumpForce: 550,
      moveSpeed: 280,
      maxFallSpeed: 600,
      enemySpeed: 80,
      koopaSpeed: 120
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = {
      x: 100, y: 400,
      width: 28, height: 32,
      vx: 0, vy: 0,
      grounded: false,
      direction: 1,
      state: 'small',
      invulnerable: 0,
      running: false
    };
    
    this.gameState.ground = [];
    for (let x = 0; x < this.gameState.worldWidth; x += 50) {
      this.gameState.ground.push({ x, y: 520, width: 50, height: 80 });
    }
    
    this.gameState.platforms = [
      { x: 400, y: 400, width: 80, height: 20 },
      { x: 600, y: 350, width: 80, height: 20 },
      { x: 800, y: 300, width: 120, height: 20 },
      { x: 1100, y: 400, width: 80, height: 20 },
      { x: 1300, y: 350, width: 80, height: 20 },
      { x: 1500, y: 280, width: 150, height: 20 },
      { x: 1800, y: 400, width: 80, height: 20 },
      { x: 2000, y: 350, width: 80, height: 20 },
      { x: 2200, y: 280, width: 100, height: 20 },
      { x: 2400, y: 400, width: 80, height: 20 },
      { x: 2600, y: 350, width: 80, height: 20 }
    ];
    
    this.gameState.pipes = [
      { x: 500, y: 440, width: 50, height: 80, type: 'normal' },
      { x: 900, y: 400, width: 50, height: 120, type: 'tall' },
      { x: 1400, y: 440, width: 50, height: 80, type: 'normal' },
      { x: 1900, y: 380, width: 50, height: 140, type: 'tall' },
      { x: 2500, y: 440, width: 50, height: 80, type: 'normal' }
    ];
    
    this.gameState.blocks = [
      { x: 450, y: 300, content: 'mushroom', hit: false },
      { x: 850, y: 200, content: 'coin', hit: false },
      { x: 900, y: 200, content: 'coin', hit: false },
      { x: 950, y: 200, content: 'coin', hit: false },
      { x: 1350, y: 250, content: 'star', hit: false },
      { x: 1550, y: 180, content: 'mushroom', hit: false },
      { x: 2100, y: 250, content: 'flower', hit: false },
      { x: 2450, y: 300, content: 'mushroom', hit: false }
    ];
    
    this.gameState.enemies = [
      { x: 600, y: 488, type: 'goomba', vx: 50, hp: 1 },
      { x: 900, y: 488, type: 'goomba', vx: 50, hp: 1 },
      { x: 1200, y: 488, type: 'koopa', vx: 40, hp: 2, shell: false, shellTimer: 0 },
      { x: 1500, y: 248, type: 'goomba', vx: 50, hp: 1 },
      { x: 1800, y: 488, type: 'goomba', vx: 50, hp: 1 },
      { x: 2000, y: 488, type: 'koopa', vx: 40, hp: 2, shell: false, shellTimer: 0 },
      { x: 2300, y: 248, type: 'goomba', vx: 50, hp: 1 },
      { x: 2700, y: 488, type: 'goomba', vx: 50, hp: 1 }
    ];
    
    this.gameState.items = [];
    
    this.gameState.flag = { x: 2850, y: 280, height: 240 };
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
    
    if (this.gameState.player.invulnerable > 0) {
      this.gameState.player.invulnerable -= deltaTime;
    }
    
    this.updatePlayer(deltaTime);
    this.updateEnemies(deltaTime);
    this.updateCamera();
    this.checkCollisions();
  }
  
  updatePlayer(deltaTime) {
    const p = this.gameState.player;
    const input = this.getPlayerInput(this.players[0]);
    
    if (input.left) {
      p.vx = -this.physics.moveSpeed;
      p.direction = -1;
      p.running = true;
    } else if (input.right) {
      p.vx = this.physics.moveSpeed;
      p.direction = 1;
      p.running = true;
    } else {
      p.vx = 0;
      p.running = false;
    }
    
    if (input.jump && p.grounded) {
      p.vy = -this.physics.jumpForce;
      p.grounded = false;
      this.spawnJumpParticles();
    }
    
    p.vy += this.physics.gravity * deltaTime;
    p.vy = Math.min(p.vy, this.physics.maxFallSpeed);
    
    p.x += p.vx * deltaTime;
    this.handleHorizontalCollisions(p);
    
    p.y += p.vy * deltaTime;
    p.grounded = false;
    this.handleVerticalCollisions(p);
    
    p.x = Math.max(0, Math.min(this.gameState.worldWidth - p.width, p.x));
    
    if (p.y > 600) {
      this.playerDies();
    }
  }
  
  handleHorizontalCollisions(p) {
    this.gameState.ground.forEach(g => {
      if (this.checkCollision(p, g)) {
        if (p.vx > 0) p.x = g.x - p.width;
        else if (p.vx < 0) p.x = g.x + g.width;
        p.vx = 0;
      }
    });
    
    this.gameState.platforms.forEach(plat => {
      if (this.checkCollision(p, plat)) {
        if (p.vx > 0) p.x = plat.x - p.width;
        else if (p.vx < 0) p.x = plat.x + plat.width;
        p.vx = 0;
      }
    });
    
    this.gameState.blocks.forEach(b => {
      if (b.hit && this.checkCollision(p, { x: b.x, y: b.y, width: 40, height: 40 })) {
        if (p.vx > 0) p.x = b.x - p.width;
        else if (p.vx < 0) p.x = b.x + 40;
        p.vx = 0;
      }
    });
  }
  
  handleVerticalCollisions(p) {
    this.gameState.ground.forEach(g => {
      if (this.checkCollision(p, g)) {
        if (p.vy > 0) {
          p.y = g.y - p.height;
          p.grounded = true;
          p.vy = 0;
        } else if (p.vy < 0) {
          p.y = g.y + g.height;
          p.vy = 0;
        }
      }
    });
    
    this.gameState.platforms.forEach(plat => {
      if (this.checkCollision(p, plat)) {
        if (p.vy > 0) {
          p.y = plat.y - p.height;
          p.grounded = true;
          p.vy = 0;
        } else if (p.vy < 0) {
          p.y = plat.y + plat.height;
          p.vy = 0;
        }
      }
    });
    
    this.gameState.blocks.forEach(b => {
      if (this.checkCollision(p, { x: b.x, y: b.y, width: 40, height: 40 })) {
        if (p.vy > 0) {
          p.y = b.y - p.height;
          p.grounded = true;
          p.vy = 0;
        } else if (p.vy < 0) {
          this.hitBlock(b);
          p.y = b.y + 40;
          p.vy = 0;
        }
      }
    });
  }
  
  hitBlock(block) {
    if (block.hit) return;
    block.hit = true;
    
    if (block.content === 'coin') {
      this.gameState.coins++;
      this.gameState.score += 200;
    } else if (block.content === 'mushroom') {
      this.gameState.player.state = 'big';
      this.gameState.player.height = 48;
      this.gameState.score += 1000;
    } else if (block.content === 'star') {
      this.gameState.score += 1000;
    } else if (block.content === 'flower') {
      if (this.gameState.player.state === 'small') {
        this.gameState.player.state = 'big';
        this.gameState.player.height = 48;
      }
      this.gameState.score += 1000;
    }
    
    this.spawnBlockParticles(block.x, block.y);
  }
  
  checkCollision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }
  
  updateEnemies(deltaTime) {
    this.gameState.enemies.forEach((e, ei) => {
      e.x += e.vx * deltaTime;
      
      if (e.x < 0 || e.x > this.gameState.worldWidth) {
        e.vx *= -1;
      }
      
      if (e.type === 'koopa' && e.shell) {
        e.shellTimer += deltaTime;
        if (e.shellTimer > 5) {
          e.shell = false;
          e.shellTimer = 0;
          e.vx = this.physics.koopaSpeed;
        }
      }
    });
  }
  
  updateCamera() {
    const p = this.gameState.player;
    this.gameState.cameraX = p.x - 300;
    this.gameState.cameraX = Math.max(0, Math.min(this.gameState.worldWidth - 800, this.gameState.cameraX));
  }
  
  checkCollisions() {
    const p = this.gameState.player;
    
    this.gameState.enemies.forEach((e, ei) => {
      if (this.checkCollision(p, { x: e.x, y: e.y, width: 30, height: 30 })) {
        if (p.vy > 0 && p.y + p.height < e.y + 20) {
          e.hp--;
          p.vy = -300;
          this.gameState.score += 100;
          
          if (e.type === 'koopa' && !e.shell) {
            e.shell = true;
            e.vx = 0;
          } else if (e.shell) {
            e.vx = p.direction * 400;
          }
          
          if (e.hp <= 0) {
            this.gameState.enemies.splice(ei, 1);
            this.spawnEnemyDeathParticles(e.x, e.y);
          }
        } else if (this.gameState.player.invulnerable <= 0) {
          this.hitByEnemy();
        }
      }
    });
    
    if (p.x >= this.gameState.flag.x - 50) {
      this.gameState.won = true;
      this.gameState.score += 5000;
    }
  }
  
  hitByEnemy() {
    if (this.gameState.player.state === 'small') {
      this.playerDies();
    } else {
      this.gameState.player.state = 'small';
      this.gameState.player.height = 32;
      this.gameState.player.invulnerable = 2;
    }
  }
  
  playerDies() {
    this.gameState.lives--;
    if (this.gameState.lives <= 0) {
      this.gameState.gameOver = true;
    } else {
      this.gameState.player.x = 100;
      this.gameState.player.y = 400;
      this.gameState.player.vx = 0;
      this.gameState.player.vy = 0;
    }
  }
  
  spawnJumpParticles() {
    for (let i = 0; i < 5; i++) {
      this.gameState.particles.push({
        x: this.gameState.player.x + 14,
        y: this.gameState.player.y + 32,
        vx: (Math.random() - 0.5) * 60,
        vy: Math.random() * 30,
        life: 0.3,
        color: '#fff'
      });
    }
  }
  
  spawnBlockParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      this.gameState.particles.push({
        x: x + 20,
        y: y + 20,
        vx: (Math.random() - 0.5) * 100,
        vy: -Math.random() * 100 - 50,
        life: 0.5,
        color: '#8b4513'
      });
    }
  }
  
  spawnEnemyDeathParticles(x, y) {
    for (let i = 0; i < 10; i++) {
      this.gameState.particles.push({
        x: x + 15,
        y: y + 15,
        vx: (Math.random() - 0.5) * 150,
        vy: -Math.random() * 150,
        life: 0.4,
        color: '#e74c3c'
      });
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    const skyGradient = this.ctx.createLinearGradient(0, 0, 0, 600);
    skyGradient.addColorStop(0, '#5b8fd4');
    skyGradient.addColorStop(0.5, '#87b5e8');
    skyGradient.addColorStop(1, '#c8e0f4');
    this.ctx.fillStyle = skyGradient;
    this.ctx.fillRect(0, 0, 800, 600);
    
    this.ctx.save();
    this.ctx.translate(-this.gameState.cameraX, 0);
    
    this.gameState.ground.forEach(g => {
      this.ctx.fillStyle = '#8b4513';
      this.ctx.fillRect(g.x, g.y, g.width, 20);
      this.ctx.fillStyle = '#228b22';
      this.ctx.fillRect(g.x, g.y, g.width, 8);
    });
    
    this.gameState.platforms.forEach(plat => {
      this.ctx.fillStyle = '#cd853f';
      this.ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
      this.ctx.strokeStyle = '#8b4513';
      this.ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
    });
    
    this.gameState.pipes.forEach(pipe => {
      this.ctx.fillStyle = '#27ae60';
      this.ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
      this.ctx.fillStyle = '#2ecc71';
      this.ctx.fillRect(pipe.x, pipe.y, pipe.width, 10);
      this.ctx.fillRect(pipe.x, pipe.y + pipe.height - 10, pipe.width, 10);
      this.ctx.fillStyle = '#1e8449';
      this.ctx.fillRect(pipe.x, pipe.y + 10, 5, pipe.height - 20);
    });
    
    this.gameState.blocks.forEach(b => {
      const color = b.hit ? '#a0522d' : '#cd853f';
      this.ctx.fillStyle = color;
      this.ctx.fillRect(b.x, b.y, 40, 40);
      this.ctx.strokeStyle = '#8b4513';
      this.ctx.strokeRect(b.x, b.y, 40, 40);
    });
    
    this.gameState.enemies.forEach(e => {
      if (e.type === 'goomba') {
        this.ctx.fillStyle = '#a0522d';
        this.ctx.beginPath();
        this.ctx.arc(e.x + 15, e.y + 15, 15, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.fillStyle = '#f5b041';
        this.ctx.fillRect(e.x + 5, e.y + 8, 20, 8);
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(e.x + 10, e.y + 10, 3, 0, Math.PI*2);
        this.ctx.arc(e.x + 20, e.y + 10, 3, 0, Math.PI*2);
        this.ctx.fill();
      } else if (e.type === 'koopa') {
        this.ctx.fillStyle = e.shell ? '#27ae60' : '#2ecc71';
        if (e.shell) {
          this.ctx.beginPath();
          this.ctx.arc(e.x + 15, e.y + 20, 15, 0, Math.PI*2);
          this.ctx.fill();
        } else {
          this.ctx.fillRect(e.x, e.y, 30, 30);
          this.ctx.fillStyle = '#c0392b';
          this.ctx.fillRect(e.x, e.y, 30, 10);
        }
      }
    });
    
    const flag = this.gameState.flag;
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(flag.x, flag.y, 10, flag.height);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.beginPath();
    this.ctx.moveTo(flag.x + 10, flag.y);
    this.ctx.lineTo(flag.x + 60, flag.y + 20);
    this.ctx.lineTo(flag.x + 10, flag.y + 40);
    this.ctx.fill();
    
    if (this.gameState.particles) {
      this.gameState.particles.forEach(p => {
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.life * 2;
        this.ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
        p.x += p.vx * 0.016;
        p.y += p.vy * 0.016;
        p.vy += 200 * 0.016;
        p.life -= 0.016;
      });
      this.gameState.particles = this.gameState.particles.filter(p => p.life > 0);
      this.ctx.globalAlpha = 1;
    }
    
    const p = this.gameState.player;
    if (p.invulnerable <= 0 || Math.floor(this.gameState.time * 15) % 2 === 0) {
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(p.x, p.y + (p.height === 48 ? 8 : 0), p.width, p.height - (p.height === 48 ? 8 : 0));
      this.ctx.fillStyle = '#c0392b';
      this.ctx.fillRect(p.x + 5, p.y + (p.height === 48 ? 8 : 0), p.width - 10, p.height - (p.height === 48 ? 12 : 8));
      
      const eyeX = p.direction > 0 ? p.x + 18 : p.x + 6;
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(eyeX, p.y + (p.height === 48 ? 12 : 6), 4, 6);
    }
    
    this.ctx.restore();
    
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 550, 800, 50);
    this.ctx.fillStyle = '#27ae60';
    this.ctx.fillRect(0, 540, 800, 15);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('SCORE: ' + this.gameState.score, 20, 30);
    this.ctx.fillText('COINS: ' + this.gameState.coins, 20, 55);
    this.ctx.fillText('LIVES: ' + this.gameState.lives, 20, 80);
    
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('SUPER MARIO BROS', 400, 25);
    
    if (this.gameState.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, 800, 600);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillText('GAME OVER', 400, 300);
    }
    
    if (this.gameState.won) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, 800, 600);
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillText('YOU WIN!', 400, 300);
      this.ctx.font = '24px Arial';
      this.ctx.fillText('Score: ' + this.gameState.score, 400, 350);
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.MarioBrosGame = MarioBrosGame;