// Super Mario Style Platformer - Complete Game
class SuperPlatformerGame {
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
      level: 1,
      world: 1,
      status: 'playing',
      player: null,
      enemies: [],
      platforms: [],
      coins: [],
      powerups: [],
      particles: [],
      camera: { x: 0, y: 0 },
      mapWidth: 3000,
      mapHeight: 600,
      gravity: 0.8,
      friction: 0.85,
      keys: {}
    };

    this.initGame();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 500;
  }

  initGame() {
    this.gameState.mapHeight = 500;
    this.gameState.mapWidth = 3000;

    this.gameState.player = {
      x: 100,
      y: 300,
      width: 32,
      height: 48,
      vx: 0,
      vy: 0,
      speed: 5,
      jumpForce: -14,
      onGround: false,
      facing: 1,
      state: 'idle',
      animation: 0,
      invulnerable: 0,
      powerup: 0,
      big: false
    };

    this.gameState.platforms = [
      { x: 0, y: 450, width: 3000, height: 50, type: 'ground' },
      { x: 200, y: 350, width: 100, height: 20, type: 'platform' },
      { x: 400, y: 280, width: 100, height: 20, type: 'platform' },
      { x: 600, y: 350, width: 150, height: 20, type: 'platform' },
      { x: 850, y: 300, width: 100, height: 20, type: 'platform' },
      { x: 1050, y: 250, width: 80, height: 20, type: 'platform' },
      { x: 1200, y: 350, width: 200, height: 20, type: 'platform' },
      { x: 1500, y: 280, width: 100, height: 20, type: 'platform' },
      { x: 1700, y: 200, width: 80, height: 20, type: 'platform' },
      { x: 1900, y: 320, width: 150, height: 20, type: 'platform' },
      { x: 2150, y: 250, width: 100, height: 20, type: 'platform' },
      { x: 2350, y: 350, width: 120, height: 20, type: 'platform' },
      { x: 2600, y: 280, width: 100, height: 20, type: 'platform' },
      { x: 2800, y: 350, width: 200, height: 20, type: 'platform' }
    ];

    this.gameState.enemies = [
      { x: 500, y: 420, width: 32, height: 32, vx: 1, vy: 0, type: 'goomba', hp: 1, active: true },
      { x: 800, y: 420, width: 32, height: 32, vx: 1.5, vy: 0, type: 'goomba', hp: 1, active: true },
      { x: 1100, y: 420, width: 32, height: 32, vx: 2, vy: 0, type: 'goomba', hp: 1, active: true },
      { x: 1400, y: 420, width: 32, height: 32, vx: 1, vy: 0, type: 'goomba', hp: 1, active: true },
      { x: 1800, y: 420, width: 32, height: 32, vx: 2, vy: 0, type: 'goomba', hp: 1, active: true },
      { x: 2200, y: 420, width: 32, height: 32, vx: 1.5, vy: 0, type: 'goomba', hp: 1, active: true },
      { x: 2600, y: 420, width: 32, height: 32, vx: 2, vy: 0, type: 'goomba', hp: 1, active: true }
    ];

    this.gameState.coins = [
      { x: 230, y: 310, collected: false },
      { x: 430, y: 240, collected: false },
      { x: 630, y: 310, collected: false },
      { x: 880, y: 260, collected: false },
      { x: 1080, y: 210, collected: false },
      { x: 1250, y: 310, collected: false },
      { x: 1530, y: 240, collected: false },
      { x: 1730, y: 160, collected: false },
      { x: 1930, y: 280, collected: false },
      { x: 2180, y: 210, collected: false },
      { x: 2380, y: 310, collected: false },
      { x: 2630, y: 240, collected: false },
      { x: 2830, y: 310, collected: false }
    ];

    this.gameState.powerups = [
      { x: 420, y: 220, type: 'mushroom', collected: false },
      { x: 1700, y: 140, type: 'mushroom', collected: false },
      { x: 2600, y: 220, type: 'star', collected: false }
    ];

    this.gameState.particles = [];
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  stop() { this.isRunning = false; }

  gameLoop(currentTime) {
    if (!this.isRunning) return;
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;
    this.update(deltaTime);
    this.render();
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  update(deltaTime) {
    this.gameState.time += deltaTime;

    const input = this.getPlayerInput();
    const player = this.gameState.player;

    this.gameState.keys = input;

    if (input.left) {
      player.vx = -player.speed;
      player.facing = -1;
      player.state = 'run';
    } else if (input.right) {
      player.vx = player.speed;
      player.facing = 1;
      player.state = 'run';
    } else {
      player.vx *= this.gameState.friction;
      if (Math.abs(player.vx) < 0.5) {
        player.vx = 0;
        player.state = 'idle';
      }
    }

    if (input.up && player.onGround) {
      player.vy = player.jumpForce;
      player.onGround = false;
      this.createParticles(player.x + player.width / 2, player.y + player.height, 5, '#fff');
    }

    player.vy += this.gameState.gravity;
    player.x += player.vx;
    player.y += player.vy;

    player.onGround = false;
    this.gameState.platforms.forEach(p => {
      if (this.checkPlatformCollision(player, p)) {
        if (player.vy > 0) {
          player.y = p.y - player.height;
          player.vy = 0;
          player.onGround = true;
        }
      }
    });

    if (player.x < 0) player.x = 0;
    if (player.x > this.gameState.mapWidth - player.width) player.x = this.gameState.mapWidth - player.width;
    if (player.y > this.gameState.mapHeight) {
      player.y = 100;
      this.gameState.lives--;
      player.invulnerable = 2;
    }

    player.animation += deltaTime * 10;

    if (player.invulnerable > 0) player.invulnerable -= deltaTime;

    this.gameState.enemies.forEach(e => {
      if (!e.active) return;

      e.x += e.vx;
      if (e.x < 0 || e.x > this.gameState.mapWidth) e.vx *= -1;

      const dx = player.x + player.width / 2 - (e.x + e.width / 2);
      const dy = player.y + player.height / 2 - (e.y + e.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 40 && player.invulnerable <= 0) {
        if (player.vy > 0 && player.y < e.y) {
          e.active = false;
          player.vy = -8;
          this.gameState.score += 100;
          this.createParticles(e.x + e.width / 2, e.y + e.height / 2, 10, '#8b4513');
        } else {
          if (player.powerup > 0) {
            player.powerup--;
            player.invulnerable = 1;
          } else {
            this.gameState.lives--;
            player.invulnerable = 2;
            player.x = 100;
            player.y = 300;
          }
        }
      }
    });

    this.gameState.coins.forEach(c => {
      if (c.collected) return;
      const dx = player.x + player.width / 2 - c.x;
      const dy = player.y + player.height / 2 - c.y;
      if (Math.sqrt(dx * dx + dy * dy) < 30) {
        c.collected = true;
        this.gameState.coins++;
        this.gameState.score += 50;
        this.createParticles(c.x, c.y, 5, '#f1c40f');
      }
    });

    this.gameState.powerups.forEach(p => {
      if (p.collected) return;
      const dx = player.x + player.width / 2 - p.x;
      const dy = player.y + player.height / 2 - p.y;
      if (Math.sqrt(dx * dx + dy * dy) < 30) {
        p.collected = true;
        if (p.type === 'mushroom') {
          player.big = true;
          player.height = 64;
          player.powerup = 10;
        } else if (p.type === 'star') {
          player.invulnerable = 10;
          player.powerup = 20;
        }
        this.gameState.score += 200;
      }
    });

    this.gameState.particles = this.gameState.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life -= deltaTime;
      return p.life > 0;
    });

    const targetCamX = player.x - this.canvas.width / 2 + player.width / 2;
    this.gameState.camera.x += (targetCamX - this.gameState.camera.x) * 0.1;
    this.gameState.camera.x = Math.max(0, Math.min(this.gameState.mapWidth - this.canvas.width, this.gameState.camera.x));

    if (this.gameState.lives <= 0) {
      this.gameState.status = 'gameover';
    }

    if (player.x > this.gameState.mapWidth - 100) {
      this.gameState.level++;
      this.gameState.score += 1000;
      this.initGame();
    }
  }

  checkPlatformCollision(player, platform) {
    return player.x < platform.x + platform.width &&
           player.x + player.width > platform.x &&
           player.y + player.height > platform.y &&
           player.y + player.height < platform.y + 20 &&
           player.vy >= 0;
  }

  createParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      this.gameState.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 3,
        life: 0.5 + Math.random() * 0.5,
        color: color,
        size: 3 + Math.random() * 4
      });
    }
  }

  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }

  render() {
    this.ctx.fillStyle = '#87ceeb';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(-this.gameState.camera.x, 0);

    this.ctx.fillStyle = '#2ecc71';
    this.gameState.platforms.forEach(p => {
      if (p.type === 'ground') {
        this.ctx.fillRect(p.x, p.y, p.width, p.height);
      } else {
        this.ctx.fillStyle = '#d35400';
        this.ctx.fillRect(p.x, p.y, p.width, p.height);
        this.ctx.fillStyle = '#27ae60';
        this.ctx.fillRect(p.x + 2, p.y, p.width - 4, 5);
      }
    });

    this.gameState.coins.forEach(c => {
      if (c.collected) return;
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.beginPath();
      this.ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#f39c12';
      this.ctx.beginPath();
      this.ctx.arc(c.x - 2, c.y - 2, 4, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.gameState.powerups.forEach(p => {
      if (p.collected) return;
      if (p.type === 'mushroom') {
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y - 10, 15, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y + 5, 10, Math.PI, 0);
        this.ctx.fill();
      } else {
        this.ctx.fillStyle = '#f39c12';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('★', p.x - 10, p.y + 10);
      }
    });

    this.gameState.enemies.forEach(e => {
      if (!e.active) return;
      this.ctx.fillStyle = '#8b4513';
      this.ctx.fillRect(e.x, e.y, e.width, e.height);
      this.ctx.fillStyle = '#000';
      this.ctx.beginPath();
      this.ctx.arc(e.x + 10, e.y + 10, 4, 0, Math.PI * 2);
      this.ctx.arc(e.x + 22, e.y + 10, 4, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.beginPath();
      this.ctx.arc(e.x + 16, e.y - 5, 8, 0, Math.PI * 2);
      this.ctx.fill();
    });

    const player = this.gameState.player;
    if (player.invulnerable > 0 && Math.floor(this.gameState.time * 10) % 2 === 0) {
    } else {
      if (player.big) {
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(player.x, player.y, player.width, player.height);
      } else {
        this.ctx.fillStyle = '#3498db';
        this.ctx.fillRect(player.x, player.y, player.width, player.height);
      }
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.fillRect(player.x + 8, player.y + 8, 16, 16);
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(player.x + (player.facing > 0 ? 20 : 4), player.y + 12, 4, 4);
    }

    this.gameState.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life;
      this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    });
    this.ctx.globalAlpha = 1;

    this.ctx.restore();

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 10, 150, 90);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    this.ctx.fillText(`Coins: ${this.gameState.coins}`, 20, 50);
    this.ctx.fillText(`Lives: ${this.gameState.lives}`, 20, 70);
    this.ctx.fillText(`Level: ${this.gameState.level}`, 20, 90);

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(this.canvas.width - 120, 10, 110, 40);
    this.ctx.fillStyle = '#95a5a6';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('← → Move', this.canvas.width - 65, 25);
    this.ctx.fillText('↑ Jump', this.canvas.width - 65, 40);

    if (this.gameState.status === 'gameover') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.font = 'bold 50px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '24px Arial';
      this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
  }

  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.SuperPlatformerGame = SuperPlatformerGame;