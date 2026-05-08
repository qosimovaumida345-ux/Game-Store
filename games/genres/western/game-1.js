// Complete Western Showdown Game
class WesternShowdownGame {
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
      time: 0,
      round: 1,
      score: 0,
      drawTimer: 0,
      phase: 'aim',
      status: 'playing'
    };

    this.initGame();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 500;
  }

  initGame() {
    this.gameState.player = {
      x: 200,
      y: 350,
      hp: 100,
      maxHp: 100,
      aimAngle: 0,
      reactionTime: 0,
      ready: false,
      state: 'idle'
    };

    this.gameState.drawTimer = 3;
    this.spawnEnemy();
  }

  spawnEnemy() {
    const names = ['Billy the Kid', 'Jesse James', 'Doc Holliday', 'Butch Cassidy', 'Sundance Kid', 'Apache Kid'];
    const skill = Math.min(0.9, 0.3 + this.gameState.round * 0.15);
    this.gameState.enemies = [{
      name: names[Math.floor(Math.random() * names.length)],
      x: 600,
      y: 350,
      hp: 80 + this.gameState.round * 20,
      maxHp: 80 + this.gameState.round * 20,
      skill: skill,
      aimAngle: 3.14,
      state: 'waiting',
      shootDelay: 0
    }];
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
    const enemy = this.gameState.enemies[0];

    if (this.gameState.phase === 'aim') {
      this.gameState.drawTimer -= dt;

      const input = this.getPlayerInput();
      if (input.left) player.aimAngle = Math.max(2.5, player.aimAngle - 3 * dt);
      if (input.right) player.aimAngle = Math.min(3.9, player.aimAngle + 3 * dt);

      if (input.action && !player.ready) {
        player.ready = true;
        this.gameState.phase = 'draw';
        this.gameState.drawTimer = 0.5 + Math.random() * 0.5;
        enemy.state = 'ready';
        enemy.shootDelay = 0.5 + (1 - enemy.skill) * (0.3 + Math.random() * 0.4);
      }

      if (this.gameState.drawTimer <= 0 && !player.ready) {
        player.ready = true;
        this.gameState.phase = 'draw';
        this.gameState.drawTimer = 0.8 + Math.random() * 0.3;
        enemy.state = 'ready';
      }
    }
    else if (this.gameState.phase === 'draw') {
      this.gameState.drawTimer -= dt;

      if (this.gameState.drawTimer <= 0) {
        this.gameState.phase = 'shoot';
        enemy.state = 'shooting';

        const playerShot = player.ready && this.gameState.drawTimer < 0;
        const enemyShot = enemy.state === 'shooting' && enemy.shootDelay <= 0;

        if (player.ready) {
          const hitChance = 0.7 + Math.random() * 0.3;
          if (hitChance > 0.3) {
            const damage = 50 + Math.random() * 30;
            enemy.hp -= damage;
            this.createParticles(enemy.x, enemy.y, 10, '#e74c3c');
          }
        }

        if (enemy.shootDelay <= 0) {
          enemy.shootDelay = 100;
          const enemyHitChance = enemy.skill + Math.random() * 0.2;
          if (enemyHitChance > 0.2) {
            player.hp -= 30 + Math.random() * 20;
            this.createParticles(player.x, player.y, 8, '#e74c3c');
          }
        }

        this.gameState.score += 100;

        setTimeout(() => {
          if (enemy.hp <= 0) {
            this.gameState.round++;
            this.gameState.score += 200;
            this.gameState.phase = 'aim';
            this.gameState.drawTimer = 2;
            player.hp = Math.min(player.maxHp, player.hp + 20);
            player.ready = false;
            this.spawnEnemy();
          } else if (player.hp <= 0) {
            this.gameState.status = 'gameover';
          } else {
            this.gameState.phase = 'aim';
            this.gameState.drawTimer = 2;
            player.ready = false;
          }
        }, 500);
      }
    }

    this.gameState.bullets = this.gameState.bullets.filter(b => {
      b.x += b.vx * dt * 60;
      b.y += b.vy * dt * 60;
      return b.x > 0 && b.x < this.canvas.width;
    });

    if (this.gameState.particles) {
      this.gameState.particles = this.gameState.particles.filter(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        return p.life > 0;
      });
    }
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
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.4, '#f4a460');
    gradient.addColorStop(1, '#8b4513');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#deb887';
    ctx.fillRect(0, 300, this.canvas.width, 200);

    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(50 + i * 80, 250, 15, 80);
      ctx.fillStyle = '#654321';
      ctx.beginPath();
      ctx.moveTo(30 + i * 80, 250);
      ctx.lineTo(57 + i * 80, 200);
      ctx.lineTo(85 + i * 80, 250);
      ctx.closePath();
      ctx.fill();
    }

    const player = this.gameState.player;
    ctx.save();
    ctx.translate(player.x, player.y);

    ctx.fillStyle = '#2e2e2e';
    ctx.fillRect(-15, -30, 30, 40);
    ctx.fillStyle = '#f5deb3';
    ctx.beginPath();
    ctx.arc(0, -40, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8b4513';
    ctx.fillRect(5, -15, 35, 4);

    if (this.gameState.phase === 'aim' || this.gameState.phase === 'draw') {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, -30);
      const aimLen = this.gameState.phase === 'draw' ? 100 : 50;
      ctx.lineTo(Math.cos(player.aimAngle) * aimLen, -30 + Math.sin(player.aimAngle) * aimLen);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();

    const enemy = this.gameState.enemies[0];
    if (enemy) {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.scale(-1, 1);

      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(-15, -30, 30, 40);
      ctx.fillStyle = '#8b4513';
      ctx.beginPath();
      ctx.arc(0, -40, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-3, -43, 3, 0, Math.PI * 2);
      ctx.arc(3, -43, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-3, -43, 1.5, 0, Math.PI * 2);
      ctx.arc(3, -43, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff0000';
      ctx.fillRect(-20, -50, 40, 6);
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(-20, -50, 40 * (enemy.hp / enemy.maxHp), 6);

      ctx.restore();
    }

    if (this.gameState.particles) {
      this.gameState.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 180, 80);
    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Round ${this.gameState.round}`, 20, 35);

    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(20, 45, 160, 14);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(20, 45, 160 * (player.hp / player.maxHp), 14);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.fillText(`HP: ${Math.floor(player.hp)}`, 80, 56);

    if (this.gameState.phase === 'aim') {
      ctx.fillStyle = '#f39c12';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`DRAW IN: ${Math.ceil(this.gameState.drawTimer)}`, this.canvas.width / 2, 50);
      ctx.font = '16px Arial';
      ctx.fillText('Press [A] when ready!', this.canvas.width / 2, 80);
    } else if (this.gameState.phase === 'draw') {
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 30px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('FIRE!', this.canvas.width / 2, this.canvas.height / 2);
    }

    if (enemy) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(this.canvas.width - 150, 10, 140, 40);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'right';
      ctx.fillText(enemy.name, this.canvas.width - 20, 30);
      ctx.font = '12px Arial';
      ctx.fillText(`Skill: ${Math.floor(enemy.skill * 100)}%`, this.canvas.width - 20, 42);
    }

    if (this.gameState.status === 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 50px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('YOU DIED', this.canvas.width / 2, this.canvas.height / 2);
      ctx.fillStyle = '#fff';
      ctx.font = '24px Arial';
      ctx.fillText(`Rounds: ${this.gameState.round}  Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
  }

  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.WesternShowdownGame = WesternShowdownGame;