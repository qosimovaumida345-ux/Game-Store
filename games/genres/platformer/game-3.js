// Complete Physics-Based Platformer with Customization
class PhysicsPlatformerGame {
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
      platforms: [],
      collectibles: [],
      enemies: [],
      particles: [],
      time: 0,
      score: 0,
      level: 1,
      status: 'playing',
      physics: { gravity: 0.5, friction: 0.9, bounce: 0.7 }
    };

    this.initLevel();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 500;
  }

  initLevel() {
    this.gameState.player = {
      x: 50,
      y: 400,
      vx: 0,
      vy: 0,
      radius: 15,
      onGround: false,
      canJump: true,
      jumpCount: 0,
      maxJumps: 2,
      color: '#3498db'
    };

    this.gameState.platforms = [
      { x: 0, y: 480, w: 800, h: 20, type: 'ground' },
      { x: 150, y: 400, w: 100, h: 15, type: 'normal' },
      { x: 300, y: 320, w: 100, h: 15, type: 'bounce' },
      { x: 450, y: 250, w: 80, h: 15, type: 'normal' },
      { x: 600, y: 350, w: 100, h: 15, type: 'ice' },
      { x: 250, y: 200, w: 80, h: 15, type: 'normal' },
      { x: 500, y: 150, w: 100, h: 15, type: 'bounce' },
      { x: 650, y: 100, w: 80, h: 15, type: 'normal' },
      { x: 100, y: 280, w: 60, h: 15, type: 'ice' },
      { x: 400, y: 380, w: 80, h: 15, type: 'breakable', hp: 3 }
    ];

    this.gameState.collectibles = [
      { x: 180, y: 360, collected: false, type: 'coin' },
      { x: 330, y: 280, collected: false, type: 'coin' },
      { x: 480, y: 210, collected: false, type: 'star' },
      { x: 630, y: 310, collected: false, type: 'coin' },
      { x: 270, y: 160, collected: false, type: 'coin' },
      { x: 520, y: 110, collected: false, type: 'star' },
      { x: 670, y: 60, collected: false, type: 'coin' },
      { x: 130, y: 240, collected: false, type: 'star' }
    ];

    this.gameState.enemies = [
      { x: 320, y: 295, vx: 1, vy: 0, radius: 12, patrol: { start: 300, end: 400 }, active: true },
      { x: 620, y: 325, vx: 1.5, vy: 0, radius: 12, patrol: { start: 600, end: 700 }, active: true }
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
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.033);
    this.lastTime = currentTime;
    this.update(dt);
    this.render();
    requestAnimationFrame(t => this.gameLoop(t));
  }

  update(dt) {
    this.gameState.time += dt;
    const player = this.gameState.player;
    const { gravity, friction } = this.gameState.physics;

    const input = this.getPlayerInput();

    if (input.left) player.vx = -8;
    if (input.right) player.vx = 8;

    if (!input.left && !input.right) player.vx *= friction;

    if (input.up && player.canJump && player.jumpCount < player.maxJumps) {
      player.vy = -12;
      player.jumpCount++;
      player.canJump = false;
      this.spawnParticles(player.x, player.y + 15, 5, '#fff');
    }

    if (!input.up) player.canJump = true;

    player.vy += gravity;
    player.x += player.vx;
    player.y += player.vy;

    player.onGround = false;
    this.gameState.platforms.forEach(p => {
      if (this.checkPlatformCollision(player, p)) {
        if (player.vy > 0) {
          player.y = p.y - player.radius;
          player.vy = 0;
          player.onGround = true;
          player.jumpCount = 0;

          if (p.type === 'bounce') {
            player.vy = -15;
            this.spawnParticles(player.x, p.y, 8, '#f1c40f');
          }
          if (p.type === 'breakable') {
            p.hp--;
            if (p.hp <= 0) p.type = 'broken';
          }
        }
      }
    });

    if (player.x < player.radius) player.x = player.radius;
    if (player.x > this.canvas.width - player.radius) player.x = this.canvas.width - player.radius;
    if (player.y < player.radius) { player.y = player.radius; player.vy = 0; }
    if (player.y > this.canvas.height + 50) {
      this.gameState.score = Math.max(0, this.gameState.score - 50);
      player.x = 50;
      player.y = 400;
      player.vx = 0;
      player.vy = 0;
    }

    this.gameState.collectibles.forEach(c => {
      if (c.collected) return;
      const dx = c.x - player.x;
      const dy = c.y - player.y;
      if (Math.sqrt(dx * dx + dy * dy) < 25) {
        c.collected = true;
        this.gameState.score += c.type === 'coin' ? 10 : 50;
        this.spawnParticles(c.x, c.y, 10, c.type === 'coin' ? '#f1c40f' : '#2ecc71');
      }
    });

    this.gameState.enemies.forEach(e => {
      if (!e.active) return;
      e.x += e.vx;
      if (e.x < e.patrol.start || e.x > e.patrol.end) e.vx *= -1;

      const dx = e.x - player.x;
      const dy = e.y - player.y;
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        player.x = 50;
        player.y = 400;
        player.vx = 0;
        player.vy = 0;
        this.gameState.score = Math.max(0, this.gameState.score - 100);
      }
    });

    this.gameState.particles = this.gameState.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3;
      p.life -= dt;
      return p.life > 0;
    });

    if (this.gameState.collectibles.every(c => c.collected)) {
      this.gameState.level++;
      this.gameState.score += 500;
      this.initLevel();
    }
  }

  checkPlatformCollision(circle, rect) {
    return circle.x + circle.radius > rect.x &&
           circle.x - circle.radius < rect.x + rect.w &&
           circle.y + circle.radius > rect.y &&
           circle.y - circle.radius < rect.y + rect.h &&
           circle.vy >= 0;
  }

  spawnParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      this.gameState.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 5,
        life: 0.5 + Math.random() * 0.5,
        color
      });
    }
  }

  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }

  render() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(1, '#1a1a2e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) {
      const x = (i * 73) % this.canvas.width;
      const y = (i * 47) % (this.canvas.height - 100);
      this.ctx.globalAlpha = 0.3;
      this.ctx.fillRect(x, y, 2, 2);
    }
    this.ctx.globalAlpha = 1;

    this.gameState.platforms.forEach(p => {
      if (p.type === 'broken') return;
      this.ctx.fillStyle = p.type === 'ground' ? '#27ae60' :
                          p.type === 'bounce' ? '#f1c40f' :
                          p.type === 'ice' ? '#3498db' : '#8b4513';
      this.ctx.fillRect(p.x, p.y, p.w, p.h);

      this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
      this.ctx.fillRect(p.x, p.y, p.w, 3);
    });

    this.gameState.collectibles.forEach(c => {
      if (c.collected) return;
      this.ctx.fillStyle = c.type === 'coin' ? '#f1c40f' : '#2ecc71';
      this.ctx.beginPath();
      this.ctx.arc(c.x, c.y, c.type === 'coin' ? 10 : 15, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#fff';
      this.ctx.font = c.type === 'coin' ? '12px Arial' : '16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(c.type === 'coin' ? '$' : '★', c.x, c.y + 5);
    });

    this.gameState.enemies.forEach(e => {
      if (!e.active) return;
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.beginPath();
      this.ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#000';
      this.ctx.beginPath();
      this.ctx.arc(e.x - 4, e.y - 3, 3, 0, Math.PI * 2);
      this.ctx.arc(e.x + 4, e.y - 3, 3, 0, Math.PI * 2);
      this.ctx.fill();
    });

    const player = this.gameState.player;
    this.ctx.fillStyle = player.color;
    this.ctx.beginPath();
    this.ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(player.x - 5, player.y - 3, 4, 0, Math.PI * 2);
    this.ctx.arc(player.x + 5, player.y - 3, 4, 0, Math.PI * 2);
    this.ctx.fill();

    this.gameState.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life;
      this.ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
    });
    this.ctx.globalAlpha = 1;

    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 150, 70);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Level: ${this.gameState.level}`, 20, 30);
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 55);

    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(this.canvas.width - 120, 10, 110, 40);
    this.ctx.fillStyle = '#95a5a6';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('← → Move', this.canvas.width - 65, 25);
    this.ctx.fillText('↑ Jump (x2)', this.canvas.width - 65, 40);
  }

  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.PhysicsPlatformerGame = PhysicsPlatformerGame;