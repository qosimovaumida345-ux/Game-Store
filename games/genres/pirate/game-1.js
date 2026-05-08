// Complete Pirate Ship Battle Game
class PirateBattleGame {
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
      playerShip: null,
      enemyShips: [],
      cannonballs: [],
      islands: [],
      score: 0,
      time: 0,
      health: 100,
      cargo: 0,
      maxCargo: 20,
      ammo: 50,
      windAngle: Math.PI / 4,
      status: 'sailing'
    };

    this.initGame();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }

  initGame() {
    this.gameState.playerShip = {
      x: 400,
      y: 300,
      angle: 0,
      speed: 0,
      maxSpeed: 3,
      health: 100,
      maxHealth: 100,
      turnSpeed: 0.03
    };

    for (let i = 0; i < 5; i++) {
      this.gameState.enemyShips.push({
        x: Math.random() * 700 + 50,
        y: Math.random() * 500 + 50,
        angle: Math.random() * Math.PI * 2,
        speed: 1 + Math.random(),
        health: 50 + Math.random() * 30,
        maxHealth: 50 + Math.random() * 30,
        type: ['sloop', 'brigantine', 'galleon'][Math.floor(Math.random() * 3)],
        ai: 'chase'
      });
    }

    for (let i = 0; i < 8; i++) {
      this.gameState.islands.push({
        x: Math.random() * 700 + 50,
        y: Math.random() * 500 + 50,
        size: 30 + Math.random() * 40,
        type: Math.random() < 0.5 ? 'palm' : 'rock'
      });
    }
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
    const player = this.gameState.playerShip;

    const input = this.getPlayerInput();

    if (input.left) player.angle -= player.turnSpeed * (player.speed > 0 ? 1 : -0.5);
    if (input.right) player.angle += player.turnSpeed * (player.speed > 0 ? 1 : -0.5);

    if (input.up) player.speed = Math.min(player.maxSpeed, player.speed + 0.05);
    else player.speed = Math.max(0, player.speed - 0.02);

    player.x += Math.cos(player.angle) * player.speed * 60 * dt;
    player.y += Math.sin(player.angle) * player.speed * 60 * dt;

    player.x = Math.max(50, Math.min(this.canvas.width - 50, player.x));
    player.y = Math.max(50, Math.min(this.canvas.height - 50, player.y));

    if (input.action && this.gameState.ammo > 0) {
      this.fireCannon(player, -Math.PI / 2);
      this.gameState.ammo--;
    }

    this.gameState.windAngle += 0.01 * dt;

    this.gameState.enemyShips.forEach(e => {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (e.ai === 'chase' && dist > 200) {
        const targetAngle = Math.atan2(dy, dx);
        let angleDiff = targetAngle - e.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        e.angle += Math.sign(angleDiff) * 0.02;
      }

      e.x += Math.cos(e.angle) * e.speed;
      e.y += Math.sin(e.angle) * e.speed;

      if (dist < 150 && Math.random() < 0.02) {
        this.fireCannon(e, e.angle - Math.PI / 2);
      }

      if (dist < 50) {
        this.gameState.health -= 5 * dt;
        this.createParticles(player.x, player.y, 3, '#e74c3c');
      }
    });

    this.gameState.cannonballs = this.gameState.cannonballs.filter(cb => {
      cb.x += Math.cos(cb.angle) * cb.speed * dt * 60;
      cb.y += Math.sin(cb.angle) * cb.speed * dt * 60;
      cb.life -= dt;

      if (cb.owner === 'player') {
        this.gameState.enemyShips.forEach(e => {
          const dx = cb.x - e.x;
          const dy = cb.y - e.y;
          if (Math.sqrt(dx * dx + dy * dy) < 30) {
            e.health -= 20;
            cb.hit = true;
            this.createParticles(e.x, e.y, 8, '#f1c40f');
            if (e.health <= 0) {
              this.gameState.score += 100;
              this.gameState.cargo = Math.min(this.gameState.maxCargo, this.gameState.cargo + 2);
            }
          }
        });
      } else {
        const dx = cb.x - player.x;
        const dy = cb.y - player.y;
        if (Math.sqrt(dx * dx + dy * dy) < 30) {
          this.gameState.health -= 15;
          cb.hit = true;
          this.createParticles(player.x, player.y, 8, '#e74c3c');
        }
      }

      return cb.life > 0 && cb.x > 0 && cb.x < this.canvas.width && cb.y > 0 && cb.y < this.canvas.height && !cb.hit;
    });

    this.gameState.enemyShips = this.gameState.enemyShips.filter(e => e.health > 0);

    if (this.gameState.enemyShips.length === 0) {
      this.gameState.score += 500;
      this.initGame();
      this.gameState.time = 0;
    }

    if (this.gameState.health <= 0) {
      this.gameState.status = 'gameover';
    }
  }

  fireCannon(ship, offsetAngle) {
    const angle = ship.angle + offsetAngle;
    this.gameState.cannonballs.push({
      x: ship.x + Math.cos(ship.angle + Math.PI / 4) * 20,
      y: ship.y + Math.sin(ship.angle + Math.PI / 4) * 20,
      angle: angle,
      speed: 8,
      life: 2,
      owner: ship === this.gameState.playerShip ? 'player' : 'enemy'
    });
  }

  createParticles(x, y, count, color) {
    if (!this.gameState.particles) this.gameState.particles = [];
    for (let i = 0; i < count; i++) {
      this.gameState.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 100,
        vy: (Math.random() - 0.5) * 100,
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
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1e90ff');
    gradient.addColorStop(1, '#006400');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#228b22';
    ctx.strokeStyle = '#8fbc8f';
    ctx.lineWidth = 3;
    for (let wx = 0; wx < this.canvas.width; wx += 50) {
      for (let wy = 0; wy < this.canvas.height; wy += 50) {
        ctx.strokeRect(wx, wy, 50, 50);
      }
    }

    this.gameState.islands.forEach(island => {
      ctx.fillStyle = '#daa520';
      ctx.beginPath();
      ctx.arc(island.x, island.y, island.size, 0, Math.PI * 2);
      ctx.fill();

      if (island.type === 'palm') {
        ctx.fillStyle = '#228b22';
        ctx.beginPath();
        ctx.moveTo(island.x, island.y - island.size);
        ctx.lineTo(island.x - 20, island.y - island.size - 30);
        ctx.lineTo(island.x + 20, island.y - island.size - 30);
        ctx.closePath();
        ctx.fill();
      }
    });

    this.gameState.enemyShips.forEach(e => {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.angle);

      const shipColor = e.type === 'galleon' ? '#8b4513' : e.type === 'brigantine' ? '#a0522d' : '#cd853f';
      ctx.fillStyle = shipColor;
      ctx.fillRect(-25, -15, 50, 30);
      ctx.fillStyle = '#deb887';
      ctx.fillRect(-20, -25, 40, 15);

      ctx.fillStyle = '#333';
      ctx.fillRect(-15, -10, 5, 20);
      ctx.fillRect(10, -10, 5, 20);

      ctx.restore();

      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(e.x - 25, e.y - 35, 50, 6);
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(e.x - 25, e.y - 35, 50 * (e.health / e.maxHealth), 6);
    });

    this.gameState.cannonballs.forEach(cb => {
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(cb.x, cb.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    const player = this.gameState.playerShip;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    ctx.fillStyle = '#8b4513';
    ctx.fillRect(-30, -20, 60, 40);
    ctx.fillStyle = '#deb887';
    ctx.fillRect(-25, -30, 50, 15);

    ctx.fillStyle = '#4a3728';
    ctx.fillRect(-20, -15, 8, 30);
    ctx.fillRect(12, -15, 8, 30);

    ctx.fillStyle = '#f5f5dc';
    ctx.beginPath();
    ctx.moveTo(0, -35);
    ctx.lineTo(0, -80);
    ctx.lineTo(25, -50);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    if (this.gameState.particles) {
      this.gameState.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
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

    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(20, 45, 160, 14);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(20, 45, 160 * (player.health / player.maxHealth), 14);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.fillText(`Hull: ${Math.floor(player.health)}%`, 80, 56);

    ctx.fillStyle = '#f39c12';
    ctx.fillRect(20, 65, 160, 12);
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(20, 65, 160 * (this.gameState.ammo / 50), 12);
    ctx.fillText(`Ammo: ${this.gameState.ammo}`, 80, 74);

    ctx.fillStyle = '#9b59b6';
    ctx.fillRect(20, 83, 160, 12);
    ctx.fillStyle = '#8e44ad';
    ctx.fillRect(20, 83, 160 * (this.gameState.cargo / this.gameState.maxCargo), 12);
    ctx.fillText(`Cargo: ${this.gameState.cargo}/${this.gameState.maxCargo}`, 80, 92);

    if (this.gameState.status === 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 50px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SHIPWRECKED', this.canvas.width / 2, this.canvas.height / 2);
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

window.PirateBattleGame = PirateBattleGame;