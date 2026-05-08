// Boxing Match - Boxing Game
class BoxingGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.players = players;
    this.gameId = gameId;
    this.isRunning = false;
    this.lastTime = 0;
    this.animationFrame = null;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.gameState = {
      time: 0,
      score: { player: 0, cpu: 0 },
      rounds: { current: 1, total: 3 },
      status: 'fighting',
      player: null,
      cpu: null,
      ring: { width: 0, height: 0, centerX: 0, centerY: 0 },
      gameTime: 0,
      roundTime: 180000,
      roundTimeLeft: 180000,
      knockdowns: { player: 0, cpu: 0 },
      fatigue: { player: 0, cpu: 0 },
      stamina: { player: 100, cpu: 100 },
      blocking: { player: false, cpu: false },
      combo: { player: 0, cpu: 0 },
      lastHit: null,
      hitStun: { player: false, cpu: false },
      hitStunTimer: { player: 0, cpu: 0 },
      referee: null,
      cornerTimer: 0,
      fightStart: true
    };

    this.keys = {};
    this.mouse = { x: 0, y: 0, pressed: false };

    this.initGame();
    this.setupControls();
  }

  resizeCanvas() {
    const parent = this.canvas.parentElement;
    this.canvas.width = parent.clientWidth || 900;
    this.canvas.height = parent.clientHeight || 650;
  }

  setupControls() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;

      if (e.key === ' ') this.togglePause();
      if (e.key === 'a' || e.key === 'A') this.block(true);
      if (e.key === 'd' || e.key === 'D') this.block(false);
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;

      if (e.key === 'a' || e.key === 'A' || e.key === 'd' || e.key === 'D') {
        this.gameState.blocking.player = false;
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.pressed = true;
      this.punch();
    });

    this.canvas.addEventListener('mouseup', () => {
      this.mouse.pressed = false;
    });
  }

  togglePause() {
    if (this.gameState.status === 'fighting' || this.gameState.status === 'round_start') {
      this.gameState.status = 'paused';
    } else if (this.gameState.status === 'paused') {
      this.gameState.status = 'fighting';
    }
  }

  punch() {
    if (this.gameState.status !== 'fighting') return;

    const player = this.gameState.player;
    const cpu = this.gameState.cpu;

    if (player.stamina < 10) return;

    const punchTypes = ['jab', 'cross', 'hook', 'uppercut'];
    const punch = punchTypes[Math.floor(Math.random() * punchTypes.length)];

    const punchPower = { jab: 3, cross: 5, hook: 4, uppercut: 4 };
    const punchStamina = { jab: 5, cross: 7, hook: 8, uppercut: 8 };

    player.stamina = Math.max(0, player.stamina - punchStamina[punch]);
    player.punchState = punch;
    player.punchTimer = 400;
    player.fistExtension = 30;

    const dx = cpu.x - player.x;
    const dy = cpu.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 100) {
      const isBlocking = this.gameState.blocking.cpu;
      const hitChance = isBlocking ? 0.3 : 0.8;

      if (Math.random() < hitChance) {
        let damage = punchPower[punch];

        if (isBlocking) {
          damage *= 0.2;
          this.gameState.lastHit = { type: 'blocked', damage: damage };
        } else {
          this.gameState.combo.player++;
          damage *= (1 + this.gameState.combo.player * 0.1);
          damage = Math.min(damage, 10);

          this.gameState.hitStun.cpu = true;
          this.gameState.hitStunTimer.cpu = 500;
        }

        this.gameState.cpu.health -= damage;
        this.gameState.score.player += Math.floor(damage);
        this.gameState.lastHit = { type: punch, damage: damage, landed: !isBlocking };

        if (this.gameState.cpu.health < 30 && this.gameState.knockdowns.cpu < 3) {
          if (Math.random() < 0.3) {
            this.knockdown('cpu');
          }
        }

        this.gameState.player.isPunching = true;
      } else {
        this.gameState.lastHit = { type: 'miss', damage: 0 };
      }
    }

    if (this.gameState.combo.player > 0 && Math.random() < 0.5) {
      this.gameState.combo.player = 0;
    }
  }

  block(isLeft) {
    if (this.gameState.status !== 'fighting') return;
    this.gameState.blocking.player = true;
  }

  knockdown(who) {
    if (who === 'player') {
      this.gameState.knockdowns.player++;
      this.gameState.player.knockedDown = true;
      this.gameState.player.knockdownTimer = 8000;
      this.gameState.status = 'knockdown';
    } else {
      this.gameState.knockdowns.cpu++;
      this.gameState.cpu.knockedDown = true;
      this.gameState.cpu.knockdownTimer = 8000;
      this.gameState.status = 'knockdown';
    }

    setTimeout(() => this.endRound(), 3000);
  }

  initGame() {
    const ring = this.gameState.ring;
    ring.width = this.canvas.width;
    ring.height = this.canvas.height;
    ring.centerX = this.canvas.width / 2;
    ring.centerY = this.canvas.height / 2;

    this.gameState.player = {
      x: ring.centerX - 150,
      y: ring.centerY,
      vx: 0,
      vy: 0,
      radius: 25,
      speed: 4,
      color: '#e74c3c',
      name: this.players[0]?.name || 'Player',
      health: 100,
      guardUp: true,
      punchState: null,
      punchTimer: 0,
      fistExtension: 0,
      isPunching: false,
      knockedDown: false,
      knockdownTimer: 0
    };

    this.gameState.cpu = {
      x: ring.centerX + 150,
      y: ring.centerY,
      vx: 0,
      vy: 0,
      radius: 25,
      speed: 3.5,
      color: '#3498db',
      name: this.players[1]?.name || 'CPU',
      health: 100,
      guardUp: true,
      punchState: null,
      punchTimer: 0,
      fistExtension: 0,
      isPunching: false,
      knockedDown: false,
      knockdownTimer: 0,
      cpu: true,
      aggression: 0.7,
      defense: 0.6
    };

    this.gameState.referee = {
      x: ring.centerX,
      y: ring.centerY - 80
    };

    this.gameState.status = 'round_start';
    setTimeout(() => {
      this.gameState.status = 'fighting';
    }, 2000);
  }

  update(deltaTime) {
    if (this.gameState.status === 'paused' || this.gameState.status === 'knockdown') return;

    this.gameState.gameTime += deltaTime;
    this.gameState.roundTimeLeft -= deltaTime;

    if (this.gameState.roundTimeLeft <= 0) {
      this.endRound();
    }

    if (this.gameState.status === 'fighting') {
      this.updatePlayer(deltaTime);
      this.updateCPU(deltaTime);
      this.updateCombat(deltaTime);
      this.checkFightEnd();
    }

    this.updateStamina(deltaTime);
  }

  updatePlayer(deltaTime) {
    const player = this.gameState.player;
    const ring = this.gameState.ring;

    if (player.knockedDown) {
      player.knockdownTimer -= deltaTime;
      if (player.knockdownTimer <= 0) {
        player.knockedDown = false;
        player.x = ring.centerX - 150;
        player.y = ring.centerY;
      }
      return;
    }

    if (this.keys['w']) player.vy -= 0.8;
    if (this.keys['s']) player.vy += 0.8;
    if (this.keys['a']) player.vx -= 0.8;
    if (this.keys['d']) player.vx += 0.8;

    player.vx *= 0.85;
    player.vy *= 0.85;

    const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
    if (speed > player.speed) {
      const ratio = player.speed / speed;
      player.vx *= ratio;
      player.vy *= ratio;
    }

    player.x += player.vx;
    player.y += player.vy;

    this.constrainToRing(player, ring);

    if (player.punchTimer > 0) {
      player.punchTimer -= deltaTime;
      if (player.punchTimer <= 0) {
        player.punchState = null;
        player.isPunching = false;
      }
    }

    this.gameState.blocking.player = this.keys['a'] || this.keys['d'];
  }

  updateCPU(deltaTime) {
    const cpu = this.gameState.cpu;
    const player = this.gameState.player;
    const ring = this.gameState.ring;

    if (cpu.knockedDown) {
      cpu.knockdownTimer -= deltaTime;
      if (cpu.knockdownTimer <= 0) {
        cpu.knockedDown = false;
        cpu.x = ring.centerX + 150;
        cpu.y = ring.centerY;
      }
      return;
    }

    const dx = player.x - cpu.x;
    const dy = player.y - cpu.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 80) {
      cpu.vx += (dx / dist) * cpu.speed * 0.05 * cpu.aggression;
      cpu.vy += (dy / dist) * cpu.speed * 0.05 * cpu.aggression;
    } else if (dist < 50) {
      cpu.vx -= (dx / dist) * cpu.speed * 0.03;
      cpu.vy -= (dy / dist) * cpu.speed * 0.03;
    }

    if (Math.random() < 0.02 && dist < 100 && cpu.stamina > 10) {
      this.cpuPunch();
    }

    if (Math.random() < 0.1 && dist < 80) {
      this.gameState.blocking.cpu = true;
    } else {
      this.gameState.blocking.cpu = false;
    }

    cpu.vx *= 0.85;
    cpu.vy *= 0.85;

    const maxSpeed = cpu.speed * 0.9;
    const speed = Math.sqrt(cpu.vx * cpu.vx + cpu.vy * cpu.vy);
    if (speed > maxSpeed) {
      const ratio = maxSpeed / speed;
      cpu.vx *= ratio;
      cpu.vy *= ratio;
    }

    cpu.x += cpu.vx;
    cpu.y += cpu.vy;

    this.constrainToRing(cpu, ring);

    if (cpu.punchTimer > 0) {
      cpu.punchTimer -= deltaTime;
      if (cpu.punchTimer <= 0) {
        cpu.punchState = null;
        cpu.isPunching = false;
      }
    }

    if (this.gameState.hitStun.cpu) {
      this.gameState.hitStunTimer.cpu -= deltaTime;
      if (this.gameState.hitStunTimer.cpu <= 0) {
        this.gameState.hitStun.cpu = false;
      }
    }
  }

  cpuPunch() {
    const cpu = this.gameState.cpu;
    const player = this.gameState.player;

    if (cpu.stamina < 10) return;

    const punchTypes = ['jab', 'cross', 'hook'];
    const punch = punchTypes[Math.floor(Math.random() * punchTypes.length)];

    const punchPower = { jab: 2, cross: 4, hook: 3 };

    cpu.punchState = punch;
    cpu.punchTimer = 400;
    cpu.fistExtension = 30;

    const isBlocking = this.gameState.blocking.player;
    const hitChance = isBlocking ? 0.3 : 0.7;

    if (Math.random() < hitChance) {
      let damage = punchPower[punch];

      if (isBlocking) {
        damage *= 0.2;
      } else {
        this.gameState.combo.cpu++;
        damage *= (1 + this.gameState.combo.cpu * 0.08);
        damage = Math.min(damage, 8);

        this.gameState.hitStun.player = true;
        this.gameState.hitStunTimer.player = 400;
      }

      player.health -= damage;
      this.gameState.score.cpu += Math.floor(damage);
      cpu.isPunching = true;
    }
  }

  constrainToRing(fighter, ring) {
    const margin = 60;

    if (fighter.x - fighter.radius < margin) {
      fighter.x = margin + fighter.radius;
      fighter.vx = 0;
    }
    if (fighter.x + fighter.radius > ring.width - margin) {
      fighter.x = ring.width - margin - fighter.radius;
      fighter.vx = 0;
    }
    if (fighter.y - fighter.radius < ring.height * 0.3) {
      fighter.y = ring.height * 0.3 + fighter.radius;
      fighter.vy = 0;
    }
    if (fighter.y + fighter.radius > ring.height * 0.8) {
      fighter.y = ring.height * 0.8 - fighter.radius;
      fighter.vy = 0;
    }

    const minDist = 60;
    const dx = this.gameState.player.x - this.gameState.cpu.x;
    const dy = this.gameState.player.y - this.gameState.cpu.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < minDist) {
      const overlap = (minDist - dist) / 2;
      const nx = dx / dist;
      const ny = dy / dist;

      if (fighter === this.gameState.player) {
        this.gameState.player.x -= nx * overlap;
        this.gameState.player.y -= ny * overlap;
      } else {
        this.gameState.cpu.x += nx * overlap;
        this.gameState.cpu.y += ny * overlap;
      }
    }
  }

  updateCombat(deltaTime) {
    if (this.gameState.hitStun.player) {
      this.gameState.hitStunTimer.player -= deltaTime;
      if (this.gameState.hitStunTimer.player <= 0) {
        this.gameState.hitStun.player = false;
      }
    }
  }

  updateStamina(deltaTime) {
    const player = this.gameState.player;
    const cpu = this.gameState.cpu;

    player.stamina = Math.min(100, player.stamina + deltaTime * 0.01);
    cpu.stamina = Math.min(100, cpu.stamina + deltaTime * 0.008);
  }

  checkFightEnd() {
    if (this.gameState.player.health <= 0) {
      this.gameState.status = 'ko';
      setTimeout(() => this.endRound(), 3000);
    } else if (this.gameState.cpu.health <= 0) {
      this.gameState.status = 'ko';
      setTimeout(() => this.endRound(), 3000);
    }

    if (this.gameState.knockdowns.player >= 1 && this.gameState.knockdowns.cpu >= 1) {
      this.gameState.status = 'ko';
      setTimeout(() => this.endRound(), 3000);
    }
  }

  endRound() {
    this.gameState.rounds.current++;

    if (this.gameState.rounds.current > this.gameState.rounds.total) {
      this.gameState.status = 'fight_over';
    } else {
      this.resetRound();
    }
  }

  resetRound() {
    const ring = this.gameState.ring;

    this.gameState.player.x = ring.centerX - 150;
    this.gameState.player.y = ring.centerY;
    this.gameState.player.vx = 0;
    this.gameState.player.vy = 0;
    this.gameState.player.knockedDown = false;
    this.gameState.player.health = Math.min(100, this.gameState.player.health + 20);
    this.gameState.player.stamina = 100;

    this.gameState.cpu.x = ring.centerX + 150;
    this.gameState.cpu.y = ring.centerY;
    this.gameState.cpu.vx = 0;
    this.gameState.cpu.vy = 0;
    this.gameState.cpu.knockedDown = false;
    this.gameState.cpu.health = Math.min(100, this.gameState.cpu.health + 20);
    this.gameState.cpu.stamina = 100;

    this.gameState.roundTimeLeft = this.gameState.roundTime;
    this.gameState.combo = { player: 0, cpu: 0 };
    this.gameState.lastHit = null;
    this.gameState.status = 'round_start';

    setTimeout(() => {
      this.gameState.status = 'fighting';
    }, 3000);
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawRing(ctx);
    this.drawRopes(ctx);
    this.drawFighters(ctx);
    this.drawReferee(ctx);
    this.drawHUD(ctx);

    if (this.gameState.status === 'paused') {
      this.drawPauseScreen(ctx);
    }

    if (this.gameState.status === 'round_start') {
      this.drawRoundStart(ctx);
    }

    if (this.gameState.status === 'knockdown') {
      this.drawKnockdown(ctx);
    }

    if (this.gameState.status === 'ko') {
      this.drawKO(ctx);
    }

    if (this.gameState.status === 'fight_over') {
      this.drawFightOver(ctx);
    }
  }

  drawRing(ctx) {
    const ring = this.gameState.ring;

    const gradient = ctx.createLinearGradient(0, 0, 0, ring.height);
    gradient.addColorStop(0, '#5d4037');
    gradient.addColorStop(0.5, '#6d4c41');
    gradient.addColorStop(1, '#5d4037');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ring.width, ring.height);

    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(40, ring.height * 0.25, ring.width - 80, ring.height * 0.6);

    ctx.strokeStyle = '#a1887f';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, ring.height * 0.25, ring.width - 80, ring.height * 0.6);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(ring.centerX - 3, ring.height * 0.25, 6, ring.height * 0.6);
  }

  drawRopes(ctx) {
    const ring = this.gameState.ring;

    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 4;

    for (let i = 0; i < 3; i++) {
      const ropeY = ring.height * 0.25 + 30 + i * 30;
      ctx.beginPath();
      ctx.moveTo(45, ropeY);
      ctx.lineTo(ring.width - 45, ropeY);
      ctx.stroke();
    }

    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(45, ring.height * 0.25, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ring.width - 45, ring.height * 0.25, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(45, ring.height * 0.8, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ring.width - 45, ring.height * 0.8, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  drawFighters(ctx) {
    this.drawFighter(ctx, this.gameState.player, true);
    this.drawFighter(ctx, this.gameState.cpu, false);
  }

  drawFighter(ctx, fighter, isPlayer) {
    ctx.save();

    if (fighter.knockedDown) {
      ctx.translate(fighter.x, fighter.y + 20);
      ctx.rotate(Math.PI / 2);
      ctx.translate(-fighter.x, -(fighter.y + 20));
    }

    ctx.beginPath();
    ctx.arc(fighter.x, fighter.y, fighter.radius + 3, 0, Math.PI * 2);
    ctx.fillStyle = isPlayer ? 'rgba(231, 76, 60, 0.3)' : 'rgba(52, 152, 219, 0.3)';
    ctx.fill();

    const gradient = ctx.createRadialGradient(
      fighter.x - 3, fighter.y - 3, 0,
      fighter.x, fighter.y, fighter.radius
    );
    gradient.addColorStop(0, this.lightenColor(fighter.color, 40));
    gradient.addColorStop(1, fighter.color);

    ctx.beginPath();
    ctx.arc(fighter.x, fighter.y, fighter.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isPlayer ? 'P' : 'CPU', fighter.x, fighter.y);

    const guardOffset = fighter.guardUp ? 15 : 5;
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(fighter.x + (isPlayer ? guardOffset : -guardOffset), fighter.y - 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(fighter.x + (isPlayer ? guardOffset : -guardOffset), fighter.y + 8, 6, 0, Math.PI * 2);
    ctx.fill();

    if (fighter.punchState) {
      const punchDir = isPlayer ? 1 : -1;
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(fighter.x + 35 * punchDir, fighter.y - 10, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.gameState.hitStun[isPlayer ? 'player' : 'cpu']) {
      ctx.strokeStyle = '#f39c12';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(fighter.x, fighter.y, fighter.radius + 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    const blocking = isPlayer ? this.gameState.blocking.player : this.gameState.blocking.cpu;
    if (blocking) {
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(fighter.x, fighter.y, fighter.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawReferee(ctx) {
    const ref = this.gameState.referee;

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ref.x, ref.y, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.rect(ref.x - 5, ref.y - 25, 10, 20);
    ctx.fill();
  }

  drawHUD(ctx) {
    const ring = this.gameState.ring;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, ring.width, 70);

    const player = this.gameState.player;
    const cpu = this.gameState.cpu;

    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(player.name, 20, 25);

    ctx.fillStyle = player.health > 30 ? '#2ecc71' : '#e74c3c';
    this.drawHealthBar(ctx, 20, 35, 150, 20, player.health / 100);

    ctx.fillStyle = '#3498db';
    ctx.font = '14px Arial';
    ctx.fillText(`KD: ${this.gameState.knockdowns.player}`, 20, 60);

    ctx.textAlign = 'right';

    ctx.fillStyle = '#3498db';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(cpu.name, ring.width - 20, 25);

    ctx.fillStyle = cpu.health > 30 ? '#2ecc71' : '#e74c3c';
    this.drawHealthBar(ctx, ring.width - 170, 35, 150, 20, cpu.health / 100);

    ctx.fillStyle = '#e74c3c';
    ctx.font = '14px Arial';
    ctx.fillText(`KD: ${this.gameState.knockdowns.cpu}`, ring.width - 20, 60);

    ctx.textAlign = 'center';

    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`Round ${this.gameState.rounds.current}`, ring.centerX, 28);

    const roundSeconds = Math.floor(this.gameState.roundTimeLeft / 1000);
    const minutes = Math.floor(roundSeconds / 60);
    const seconds = roundSeconds % 60;
    ctx.fillStyle = 'white';
    ctx.font = '18px Arial';
    ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, ring.centerX, 50);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px Arial';
    ctx.fillText('WASD - Move | Click - Punch | A/D - Block | Space - Pause', ring.centerX, ring.height - 15);
  }

  drawHealthBar(ctx, x, y, width, height, percent) {
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, width, height);

    const healthColor = percent > 0.5 ? '#2ecc71' : (percent > 0.25 ? '#f1c40f' : '#e74c3c');
    ctx.fillStyle = healthColor;
    ctx.fillRect(x, y, width * percent, height);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
  }

  drawPauseScreen(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);

    ctx.font = '20px Arial';
    ctx.fillText('Press SPACE to continue', this.canvas.width / 2, this.canvas.height / 2 + 50);
  }

  drawRoundStart(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Round ${this.gameState.rounds.current}`, this.canvas.width / 2, this.canvas.height / 2);

    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText('Get Ready!', this.canvas.width / 2, this.canvas.height / 2 + 40);
  }

  drawKnockdown(ctx) {
    ctx.fillStyle = 'rgba(231, 76, 60, 0.7)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('KNOCKDOWN!', this.canvas.width / 2, this.canvas.height / 2);

    ctx.font = '24px Arial';
    ctx.fillText('Count in progress...', this.canvas.width / 2, this.canvas.height / 2 + 50);
  }

  drawKO(ctx) {
    ctx.fillStyle = 'rgba(231, 76, 60, 0.8)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('K.O.!', this.canvas.width / 2, this.canvas.height / 2);
  }

  drawFightOver(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const winner = this.gameState.score.player > this.gameState.score.cpu ? this.gameState.player.name : this.gameState.cpu.name;
    const color = this.gameState.score.player > this.gameState.score.cpu ? '#e74c3c' : '#3498db';

    ctx.fillStyle = color;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${winner} Wins!`, this.canvas.width / 2, this.canvas.height / 2 - 40);

    ctx.fillStyle = 'white';
    ctx.font = '32px Arial';
    ctx.fillText(`Score: ${this.gameState.score.player} - ${this.gameState.score.cpu}`, this.canvas.width / 2, this.canvas.height / 2 + 20);

    ctx.fillStyle = '#f39c12';
    ctx.font = '20px Arial';
    ctx.fillText(`Total Knockdowns: P${this.gameState.knockdowns.player} - CPU${this.gameState.knockdowns.cpu}`, this.canvas.width / 2, this.canvas.height / 2 + 60);
  }

  lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 +
      (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  gameLoop() {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    this.animationFrame = requestAnimationFrame(() => this.gameLoop());
  }

  getState() {
    return {
      time: this.gameState.gameTime,
      score: this.gameState.score,
      rounds: this.gameState.rounds,
      playerHealth: this.gameState.player.health,
      cpuHealth: this.gameState.cpu.health,
      status: this.gameState.status
    };
  }
}

window.BoxingGame = BoxingGame;