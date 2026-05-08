// Complete Sci-Fi Space Shooter
class SciFiSpaceGame {
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
      player: null,
      enemies: [],
      bullets: [],
      enemyBullets: [],
      asteroids: [],
      powerups: [],
      planets: [],
      score: 0,
      time: 0,
      wave: 1,
      shield: 100,
      fuel: 100,
      mission: 'survive',
      status: 'playing'
    };

    this.initGame();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }

  initGame() {
    this.gameState.player = {
      x: this.canvas.width / 2,
      y: this.canvas.height - 100,
      vx: 0,
      vy: 0,
      angle: 0,
      hp: 100,
      maxHp: 100,
      fireRate: 0.1,
      fireTimer: 0,
      weapon: 'laser'
    };

    for (let i = 0; i < 5; i++) {
      this.gameState.planets.push({
        x: Math.random() * this.canvas.width,
        y: -200 - Math.random() * 300,
        size: 50 + Math.random() * 100,
        color: this.getRandomPlanetColor(),
        speed: 0.2 + Math.random() * 0.3
      });
    }
  }

  getRandomPlanetColor() {
    const colors = ['#e74c3c', '#9b59b6', '#3498db', '#1abc9c', '#f39c12', '#2ecc71'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  stop() { this.isRunning = false; }

  gameLoop(currentTime) {
    if (!this.isRunning) return;
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.033);
    this.lastTime = currentTime;
    this.update(dt);
    this.render();
    requestAnimationFrame(t => this.gameLoop(t));
  }

  update(dt) {
    this.gameState.time += dt;
    const player = this.gameState.player;

    const input = this.getPlayerInput();

    player.vx *= 0.95;
    player.vy *= 0.95;

    if (input.left) player.vx -= 300 * dt;
    if (input.right) player.vx += 300 * dt;
    if (input.up) player.vy -= 300 * dt;
    if (input.down) player.vy += 300 * dt;

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    player.x = Math.max(30, Math.min(this.canvas.width - 30, player.x));
    player.y = Math.max(30, Math.min(this.canvas.height - 30, player.y));

    const dx = input.x || 0;
    const dy = input.y || 0;
    if (dx !== 0 || dy !== 0) {
      player.angle = Math.atan2(dy, dx);
    }

    player.fireTimer -= dt;
    if (input.action && player.fireTimer <= 0) {
      this.fireBullet();
      player.fireTimer = player.fireRate;
    }

    this.gameState.bullets = this.gameState.bullets.filter(b => {
      b.x += Math.cos(b.angle) * b.speed;
      b.y += Math.sin(b.angle) * b.speed;
      return b.x > -20 && b.x < this.canvas.width + 20 && 
             b.y > -20 && b.y < this.canvas.height + 20;
    });

    this.gameState.enemyBullets = this.gameState.enemyBullets.filter(b => {
      b.x += b.vx;
      b.y += b.vy;
      return b.x > -20 && b.x < this.canvas.width + 20 && 
             b.y > -20 && b.y < this.canvas.height + 20;
    });

    if (Math.random() < 0.02 * this.gameState.wave) {
      this.spawnEnemy();
    }

    this.gameState.enemies.forEach(e => {
      e.y += e.speed * dt * 30;
      e.x += Math.sin(this.gameState.time * 2 + e.offset) * 1;

      if (Math.random() < 0.03) {
        this.gameState.enemyBullets.push({
          x: e.x,
          y: e.y + 20,
          vx: (player.x - e.x) * 0.02,
          vy: 3,
          damage: 10
        });
      }
    });

    if (Math.random() < 0.01) {
      this.gameState.asteroids.push({
        x: Math.random() * this.canvas.width,
        y: -50,
        size: 20 + Math.random() * 30,
        speed: 50 + Math.random() * 50,
        rotation: 0,
        rotSpeed: (Math.random() - 0.5) * 3
      });
    }

    this.gameState.asteroids.forEach(a => {
      a.y += a.speed * dt;
      a.rotation += a.rotSpeed * dt;
    });

    this.checkCollisions();

    this.gameState.planets.forEach(p => {
      p.y += p.speed * dt * 20;
      if (p.y > this.canvas.height + p.size) {
        p.y = -p.size - 100;
        p.x = Math.random() * this.canvas.width;
      }
    });

    if (this.gameState.enemies.length === 0 && this.gameState.wave < 10) {
      this.gameState.wave++;
    }

    if (player.hp <= 0 || this.gameState.fuel <= 0) {
      this.gameState.status = 'gameover';
    }
  }

  fireBullet() {
    const p = this.gameState.player;
    this.gameState.bullets.push({
      x: p.x + Math.cos(p.angle) * 20,
      y: p.y + Math.sin(p.angle) * 20,
      angle: p.angle,
      speed: 500,
      damage: 20
    });
  }

  spawnEnemy() {
    const types = [
      { type: 'fighter', hp: 30, speed: 1, size: 25, color: '#e74c3c' },
      { type: 'cruiser', hp: 80, speed: 0.5, size: 40, color: '#9b59b6' },
      { type: 'scout', hp: 20, speed: 2, size: 20, color: '#3498db' }
    ];

    const type = types[Math.floor(Math.random() * types.length)];
    this.gameState.enemies.push({
      ...type,
      x: Math.random() * (this.canvas.width - 100) + 50,
      y: -50,
      offset: Math.random() * 10
    });
  }

  checkCollisions() {
    const player = this.gameState.player;

    this.gameState.bullets.forEach((b, bi) => {
      this.gameState.enemies.forEach((e, ei) => {
        const dx = b.x - e.x;
        const dy = b.y - e.y;
        if (Math.sqrt(dx * dx + dy * dy) < e.size) {
          e.hp -= b.damage;
          this.gameState.bullets.splice(bi, 1);

          if (e.hp <= 0) {
            this.gameState.enemies.splice(ei, 1);
            this.gameState.score += e.type === 'cruiser' ? 100 : 50;
            this.createParticles(e.x, e.y, 10, e.color);
          }
        }
      });
    });

    this.gameState.enemyBullets.forEach((b, bi) => {
      const dx = b.x - player.x;
      const dy = b.y - player.y;
      if (Math.sqrt(dx * dx + dy * dy) < 25) {
        player.hp -= b.damage;
        this.gameState.enemyBullets.splice(bi, 1);
        this.createParticles(player.x, player.y, 5, '#e74c3c');
      }
    });

    this.gameState.asteroids.forEach((a, ai) => {
      const dx = a.x - player.x;
      const dy = a.y - player.y;
      if (Math.sqrt(dx * dx + dy * dy) < a.size + 20) {
        player.hp -= 20;
        this.gameState.asteroids.splice(ai, 1);
        this.createParticles(player.x, player.y, 8, '#888');
      }
    });

    if (Math.random() < 0.005) {
      this.gameState.powerups.push({
        x: Math.random() * this.canvas.width,
        y: -30,
        type: Math.random() < 0.5 ? 'shield' : 'fuel',
        speed: 50
      });
    }

    this.gameState.powerups = this.gameState.powerups.filter(p => {
      p.y += p.speed * 0.016;
      const dx = p.x - player.x;
      const dy = p.y - player.y;
      if (Math.sqrt(dx * dx + dy * dy) < 30) {
        if (p.type === 'shield') {
          player.hp = Math.min(player.maxHp, player.hp + 30);
        } else {
          this.gameState.fuel = Math.min(100, this.gameState.fuel + 30);
        }
        return false;
      }
      return p.y < this.canvas.height + 30;
    });
  }

  createParticles(x, y, count, color) {
    if (!this.gameState.particles) this.gameState.particles = [];
    for (let i = 0; i < count; i++) {
      this.gameState.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        life: 0.5,
        color: color
      });
    }
  }

  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < 100; i++) {
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.3 + Math.random() * 0.7;
      const x = (i * 137) % this.canvas.width;
      const y = (i * 89 + this.gameState.time * 10) % this.canvas.height;
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;

    this.gameState.planets.forEach(p => {
      const gradient = ctx.createRadialGradient(p.x - p.size/3, p.y - p.size/3, 0, p.x, p.y, p.size);
      gradient.addColorStop(0, p.color);
      gradient.addColorStop(1, '#000');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    this.gameState.asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rotation);
      ctx.fillStyle = '#666';
      ctx.beginPath();
      ctx.moveTo(a.size, 0);
      for (let i = 1; i < 7; i++) {
        const angle = (i / 7) * Math.PI * 2;
        const r = a.size * (0.7 + Math.random() * 0.3);
        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    this.gameState.enemies.forEach(e => {
      ctx.fillStyle = e.color;
      if (e.type === 'fighter') {
        ctx.beginPath();
        ctx.moveTo(e.x, e.y + e.size);
        ctx.lineTo(e.x - e.size, e.y - e.size);
        ctx.lineTo(e.x + e.size, e.y - e.size);
        ctx.closePath();
        ctx.fill();
      } else if (e.type === 'cruiser') {
        ctx.fillRect(e.x - e.size/2, e.y - e.size/2, e.size, e.size);
      } else {
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size/2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    this.gameState.bullets.forEach(b => {
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    this.gameState.enemyBullets.forEach(b => {
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    this.gameState.powerups.forEach(p => {
      ctx.fillStyle = p.type === 'shield' ? '#3498db' : '#f39c12';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(p.type === 'shield' ? 'S' : 'F', p.x, p.y + 4);
    });

    const player = this.gameState.player;
    ctx.save();
    ctx.translate(player.x, player.y);

    if (player.vx !== 0 || player.vy !== 0) {
      ctx.rotate(player.angle);
    }

    ctx.fillStyle = '#95a5a6';
    ctx.beginPath();
    ctx.moveTo(25, 0);
    ctx.lineTo(-15, -15);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-15, 15);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    if (this.gameState.shield > 0) {
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    if (this.gameState.particles) {
      this.gameState.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
      });
      ctx.globalAlpha = 1;
      this.gameState.particles = this.gameState.particles.filter(p => {
        p.x += p.vx * 0.016;
        p.y += p.vy * 0.016;
        p.life -= 0.016;
        return p.life > 0;
      });
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 180, 100);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    ctx.fillText(`Wave: ${this.gameState.wave}`, 20, 50);

    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(20, 60, 150, 14);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(20, 60, 150 * (player.hp / player.maxHp), 14);
    ctx.fillText(`HP: ${Math.floor(player.hp)}`, 80, 71);

    ctx.fillStyle = '#f39c12';
    ctx.fillRect(20, 80, 150, 12);
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(20, 80, 150 * (this.gameState.fuel / 100), 12);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.fillText(`Fuel: ${Math.floor(this.gameState.fuel)}%`, 80, 89);

    if (this.gameState.status === 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 50px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('MISSION FAILED', this.canvas.width / 2, this.canvas.height / 2);
      ctx.fillStyle = '#fff';
      ctx.font = '24px Arial';
      ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
  }

  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.SciFiSpaceGame = SciFiSpaceGame;