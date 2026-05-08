// Complete Samurai Combat Game
class SamuraiCombatGame {
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
      time: 0,
      round: 1,
      score: 0,
      combo: 0,
      maxCombo: 0,
      stance: 'neutral',
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
      x: 150,
      y: 350,
      vx: 0,
      vy: 0,
      width: 40,
      height: 60,
      hp: 100,
      maxHp: 100,
      energy: 50,
      maxEnergy: 100,
      state: 'idle',
      facing: 1,
      attackCooldown: 0,
      parryWindow: 0,
      hitStun: 0,
      blocking: false,
      charging: false,
      chargeLevel: 0
    };

    this.spawnEnemies();
  }

  spawnEnemies() {
    const types = [
      { name: 'Bandit', hp: 40, speed: 2, attack: 8, weapon: 'katana', ai: 'aggressive' },
      { name: 'Ronin', hp: 60, speed: 1.5, attack: 12, weapon: 'nodachi', ai: 'tactical' },
      { name: 'Ashigaru', hp: 80, speed: 1, attack: 10, weapon: 'spear', ai: 'defensive' },
      { name: 'Samurai', hp: 70, speed: 2, attack: 15, weapon: 'katana', ai: 'aggressive' }
    ];

    this.gameState.enemies = [];
    const enemyCount = Math.min(this.gameState.round + 2, 6);

    for (let i = 0; i < enemyCount; i++) {
      const type = types[Math.min(Math.floor(Math.random() * types.length), types.length - 1)];
      this.gameState.enemies.push({
        ...type,
        maxHp: type.hp,
        x: 500 + Math.random() * 200,
        y: 150 + i * 80,
        state: 'idle',
        facing: -1,
        attackCooldown: 0,
        parryWindow: 0,
        hitStun: 0,
        ai: type.ai,
        patterns: [],
        patternIndex: 0
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
    const player = this.gameState.player;

    if (player.hitStun > 0) player.hitStun -= dt;
    if (player.attackCooldown > 0) player.attackCooldown -= dt;
    if (player.parryWindow > 0) player.parryWindow -= dt;

    const input = this.getPlayerInput();

    if (player.hitStun > 0) {
      player.state = 'hit';
    } else if (player.charging) {
      player.state = 'charge';
      player.chargeLevel = Math.min(3, player.chargeLevel + dt * 2);
    } else if (player.attackCooldown > 0) {
      player.state = 'attack';
    } else {
      player.state = 'idle';
    }

    if (player.hitStun <= 0 && !player.charging) {
      if (input.left) {
        player.x -= 200 * dt;
        player.facing = -1;
      }
      if (input.right) {
        player.x += 200 * dt;
        player.facing = 1;
      }
      if (input.up && player.y > 200) player.y -= 180 * dt;
      if (input.down && player.y < 420) player.y += 180 * dt;
    }

    player.x = Math.max(40, Math.min(this.canvas.width - 40, player.x));
    player.y = Math.max(200, Math.min(450, player.y));

    if (input.action && player.attackCooldown <= 0 && player.hitStun <= 0) {
      player.charging = true;
    }

    if (!input.action && player.charging) {
      this.performAttack(player, player.chargeLevel);
      player.charging = false;
      player.chargeLevel = 0;
    }

    if (input.block && player.energy > 5) {
      player.blocking = true;
      player.energy -= 10 * dt;
      player.parryWindow = 0.2;
    } else {
      player.blocking = false;
    }

    player.energy = Math.min(player.maxEnergy, player.energy + 5 * dt);

    if (player.y < 200) {
      player.y = 200;
      player.vy = 0;
    }
    if (player.y > 420) {
      player.y = 420;
      player.vy = 0;
    }

    this.gameState.enemies.forEach((e, index) => {
      if (e.hitStun > 0) {
        e.hitStun -= dt;
        e.state = 'hit';
        return;
      }
      if (e.attackCooldown > 0) e.attackCooldown -= dt;

      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (e.ai === 'aggressive') {
        if (dist > 80) {
          e.x += (dx / dist) * e.speed * 80 * dt;
          e.y += (dy / dist) * e.speed * 40 * dt;
          e.state = 'walk';
        } else if (e.attackCooldown <= 0) {
          this.enemyAttack(e, player);
        } else {
          e.state = 'idle';
        }
      } else if (e.ai === 'tactical') {
        if (dist < 150 && dist > 100) {
          e.x -= (dx / dist) * 30 * dt;
          e.state = 'retreat';
        } else if (dist <= 100 && e.attackCooldown <= 0) {
          this.enemyAttack(e, player);
        } else {
          e.state = 'idle';
        }
      } else if (e.ai === 'defensive') {
        if (dist < 120) {
          e.state = 'block';
          if (e.attackCooldown <= 0 && Math.random() < 0.02) {
            this.enemyAttack(e, player);
          }
        } else if (dist > 200) {
          e.x += (dx / dist) * 20 * dt;
          e.state = 'walk';
        } else {
          e.state = 'idle';
        }
      }

      e.facing = dx > 0 ? 1 : -1;
    });

    this.gameState.enemies = this.gameState.enemies.filter(e => e.hp > 0);

    this.checkHit(player);

    if (this.gameState.enemies.length === 0) {
      this.gameState.round++;
      this.gameState.score += 200 * this.gameState.round;
      this.gameState.player.hp = Math.min(this.gameState.player.maxHp, this.gameState.player.hp + 30);
      this.gameState.player.energy = this.gameState.player.maxEnergy;
      this.spawnEnemies();
    }

    if (player.hp <= 0) {
      this.gameState.status = 'gameover';
    }
  }

  performAttack(player, chargeLevel) {
    const damage = (10 + chargeLevel * 8) * (player.energy > 20 ? 1.5 : 1);
    const range = 80 + chargeLevel * 20;

    player.attackCooldown = 0.3 + chargeLevel * 0.2;
    player.energy = Math.max(0, player.energy - 10 - chargeLevel * 5);

    this.gameState.enemies.forEach(e => {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < range && Math.abs(dy) < 50) {
        if (e.parryWindow > 0) {
          player.hitStun = 0.5;
          player.energy = Math.max(0, player.energy - 20);
          this.createParticles(e.x, e.y, 5, '#f1c40f');
        } else {
          e.hp -= damage;
          e.hitStun = 0.3;
          this.gameState.combo++;

          if (this.gameState.combo > this.gameState.maxCombo) {
            this.gameState.maxCombo = this.gameState.combo;
          }

          this.createParticles(e.x, e.y, 8, '#e74c3c');
        }
      }
    });

    this.gameState.combo = 0;
  }

  enemyAttack(enemy, player) {
    const damage = enemy.attack;
    const dist = Math.abs(player.x - enemy.x);

    if (dist < 100) {
      if (player.blocking && player.parryWindow > 0) {
        player.energy = Math.min(player.maxEnergy, player.energy + 20);
        this.createParticles(player.x, player.y, 10, '#f1c40f');
      } else if (player.blocking) {
        damage *= 0.2;
        player.energy = Math.max(0, player.energy - 10);
      } else {
        player.hp -= damage;
        player.hitStun = 0.3;
        this.createParticles(player.x, player.y, 8, '#e74c3c');
      }

      enemy.attackCooldown = 1 + Math.random();
      this.createParticles(enemy.x, enemy.y - 20, 5, '#fff');
    }
  }

  checkHit(player) {
    this.gameState.enemies.forEach(e => {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 30 && e.attackCooldown > 0.8) {
        if (player.blocking && player.parryWindow > 0) {
          player.energy = Math.min(player.maxEnergy, player.energy + 30);
          this.createParticles(player.x, player.y, 15, '#f1c40f');
        } else if (player.blocking) {
          player.hp -= 2;
          player.energy = Math.max(0, player.energy - 5);
        } else {
          player.hp -= 5;
          player.hitStun = 0.2;
        }
      }
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
        color
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
    gradient.addColorStop(0.5, '#f0e68c');
    gradient.addColorStop(1, '#d2b48c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 440, this.canvas.width, 60);

    this.drawTrees();

    this.gameState.enemies.forEach(e => this.drawEnemy(e));

    this.drawPlayer();

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

    this.drawUI();
  }

  drawTrees() {
    const ctx = this.ctx;
    const treePositions = [50, 200, 350, 550, 700];
    treePositions.forEach(x => {
      ctx.fillStyle = '#228B22';
      ctx.beginPath();
      ctx.moveTo(x, 200);
      ctx.lineTo(x - 30, 350);
      ctx.lineTo(x + 30, 350);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(x - 8, 350, 16, 40);
    });
  }

  drawPlayer() {
    const p = this.gameState.player;
    const ctx = this.ctx;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.facing, 1);

    if (p.state === 'hit') {
      ctx.globalAlpha = 0.5 + Math.sin(this.gameState.time * 30) * 0.5;
    }

    ctx.fillStyle = '#dc143c';
    ctx.fillRect(-15, -30, 30, 35);

    ctx.fillStyle = '#fff';
    ctx.fillRect(-12, -25, 24, 10);

    ctx.fillStyle = '#f4a460';
    ctx.beginPath();
    ctx.arc(0, -35, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.fillRect(-8, -38, 4, 4);
    ctx.fillRect(4, -38, 4, 4);

    if (p.blocking) {
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -10, 30, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (p.charging) {
      ctx.fillStyle = `rgba(255, 100, 0, ${p.chargeLevel * 0.3})`;
      ctx.beginPath();
      ctx.arc(0, -10, 40 + p.chargeLevel * 10, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(10, -20, 30, 5);

    ctx.restore();
  }

  drawEnemy(e) {
    const ctx = this.ctx;

    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.scale(e.facing, 1);

    ctx.fillStyle = '#333';
    ctx.fillRect(-12, -25, 24, 30);

    ctx.fillStyle = e.ai === 'defensive' ? '#4a5568' : '#666';
    ctx.fillRect(-10, -20, 20, 8);

    ctx.fillStyle = '#8b4513';
    ctx.beginPath();
    ctx.arc(0, -32, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.fillRect(-6, -35, 3, 3);
    ctx.fillRect(3, -35, 3, 3);

    if (e.state === 'block') {
      ctx.strokeStyle = '#f39c12';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -10, 25, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(-20, -45, 40, 6);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(-20, -45, 40 * (e.hp / e.maxHp), 6);

    ctx.restore();
  }

  drawUI() {
    const ctx = this.ctx;
    const player = this.gameState.player;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 90);

    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Round ${this.gameState.round}`, 20, 30);

    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(20, 40, 180, 16);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(20, 40, 180 * (player.hp / player.maxHp), 16);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.fillText(`HP: ${Math.floor(player.hp)}/${player.maxHp}`, 80, 52);

    ctx.fillStyle = '#3498db';
    ctx.fillRect(20, 62, 180, 12);
    ctx.fillStyle = '#5dade2';
    ctx.fillRect(20, 62, 180 * (player.energy / player.maxEnergy), 12);
    ctx.fillStyle = '#fff';
    ctx.fillText(`Energy: ${Math.floor(player.energy)}`, 80, 71);

    if (this.gameState.combo > 1) {
      ctx.fillStyle = '#f39c12';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`COMBO x${this.gameState.combo}`, this.canvas.width / 2, 50);
    }

    if (this.gameState.status === 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 50px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('DEFEAT', this.canvas.width / 2, this.canvas.height / 2);
      ctx.fillStyle = '#fff';
      ctx.font = '24px Arial';
      ctx.fillText(`Round: ${this.gameState.round}  Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
  }

  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.SamuraiCombatGame = SamuraiCombatGame;