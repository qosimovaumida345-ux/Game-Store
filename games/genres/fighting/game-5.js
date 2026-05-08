// Complete Fighting Game with Combos and Special Moves
class FightingGame {
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
      round: 1,
      roundTime: 99,
      player1: null,
      player2: null,
      p1Wins: 0,
      p2Wins: 0,
      status: 'ready',
      particles: [],
      hitEffects: [],
      comboCount: 0,
      lastHitBy: null
    };

    this.initGame();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 900;
    this.canvas.height = this.canvas.parentElement.clientHeight || 500;
  }

  initGame() {
    this.gameState.player1 = {
      x: 200,
      y: 350,
      vx: 0,
      vy: 0,
      width: 50,
      height: 90,
      hp: 100,
      maxHp: 100,
      energy: 0,
      maxEnergy: 100,
      state: 'idle',
      facing: 1,
      animFrame: 0,
      hitStun: 0,
      blocking: false,
      crouching: false,
      combo: 0,
      specialMeter: 0,
      color: '#e74c3c',
      name: 'Player 1'
    };

    this.gameState.player2 = {
      x: 700,
      y: 350,
      vx: 0,
      vy: 0,
      width: 50,
      height: 90,
      hp: 100,
      maxHp: 100,
      energy: 0,
      maxEnergy: 100,
      state: 'idle',
      facing: -1,
      animFrame: 0,
      hitStun: 0,
      blocking: false,
      crouching: false,
      combo: 0,
      specialMeter: 0,
      color: '#3498db',
      name: 'CPU',
      ai: true,
      aiTimer: 0,
      aiState: 'idle'
    };

    this.gameState.status = 'fighting';
    this.gameState.roundTime = 99;
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  stop() { this.isRunning = false; }

  gameLoop(currentTime) {
    if (!this.isRunning) return;
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.033);
    this.lastTime = currentTime;
    this.update(deltaTime);
    this.render();
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  update(deltaTime) {
    this.gameState.time += deltaTime;
    this.gameState.roundTime -= deltaTime;

    const p1 = this.gameState.player1;
    const p2 = this.gameState.player2;

    if (p1.hitStun > 0) p1.hitStun -= deltaTime;
    if (p2.hitStun > 0) p2.hitStun -= deltaTime;

    const input1 = this.getPlayerInput();
    this.handlePlayerInput(p1, input1, deltaTime);
    this.handleAI(p2, deltaTime);

    p1.animFrame += deltaTime * 10;
    p2.animFrame += deltaTime * 10;

    if (p1.hitStun <= 0) {
      p1.x += p1.vx;
      p1.y += p1.vy;
      p1.vx *= 0.85;
      p1.vy += 0.8;

      if (p1.y > 350) {
        p1.y = 350;
        p1.vy = 0;
        p1.state = p1.state === 'jump' ? 'idle' : p1.state;
      }

      p1.x = Math.max(50, Math.min(this.canvas.width - 100, p1.x));
    }

    if (p2.hitStun <= 0) {
      p2.x += p2.vx;
      p2.y += p2.vy;
      p2.vx *= 0.85;
      p2.vy += 0.8;

      if (p2.y > 350) {
        p2.y = 350;
        p2.vy = 0;
      }

      p2.x = Math.max(50, Math.min(this.canvas.width - 100, p2.x));
    }

    p1.facing = p2.x > p1.x ? 1 : -1;
    p2.facing = p1.x > p2.x ? 1 : -1;

    this.checkHit(p1, p2);
    this.checkHit(p2, p1);

    this.gameState.particles = this.gameState.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3;
      p.life -= deltaTime;
      return p.life > 0;
    });

    this.gameState.hitEffects = this.gameState.hitEffects.filter(e => {
      e.life -= deltaTime;
      return e.life > 0;
    });

    if (p1.hp <= 0 || p2.hp <= 0 || this.gameState.roundTime <= 0) {
      this.endRound();
    }
  }

  handlePlayerInput(player, input, deltaTime) {
    if (player.hitStun > 0) return;

    player.vx = 0;

    if (input.left) player.vx = -5;
    if (input.right) player.vx = 5;

    if (input.up && player.y >= 350) {
      player.vy = -15;
      player.state = 'jump';
    }

    player.blocking = input.down || input.action;

    if (input.action && !player.blocking) {
      this.performAttack(player);
    }

    if (input.up && input.action) {
      this.performSpecial(player);
    }
  }

  handleAI(player, deltaTime) {
    player.aiTimer -= deltaTime;

    if (player.hitStun > 0) return;

    const opponent = this.gameState.player1;
    const distance = Math.abs(player.x - opponent.x);

    if (player.aiTimer <= 0) {
      const rand = Math.random();

      if (distance > 150) {
        player.aiState = 'approach';
      } else if (distance < 80) {
        player.aiState = rand < 0.5 ? 'attack' : rand < 0.8 ? 'retreat' : 'block';
      } else {
        player.aiState = rand < 0.6 ? 'attack' : rand < 0.8 ? 'jump' : 'idle';
      }

      player.aiTimer = 0.3 + Math.random() * 0.5;
    }

    switch (player.aiState) {
      case 'approach':
        player.vx = player.facing * 4;
        break;
      case 'attack':
        if (Math.random() < 0.1) {
          this.performAttack(player);
        }
        break;
      case 'retreat':
        player.vx = -player.facing * 3;
        break;
      case 'block':
        player.blocking = true;
        break;
      case 'jump':
        if (player.y >= 350) {
          player.vy = -14;
        }
        break;
    }

    if (player.specialMeter >= 100 && Math.random() < 0.02) {
      this.performSpecial(player);
    }
  }

  performAttack(attacker) {
    if (attacker.state === 'attack' && attacker.animFrame < 0.3) return;

    attacker.state = 'attack';
    attacker.animFrame = 0;
    attacker.energy = Math.min(attacker.maxEnergy, attacker.energy + 10);
    attacker.specialMeter = Math.min(100, attacker.specialMeter + 5);

    const range = attacker.combo > 5 ? 90 : 70;
    const damage = attacker.combo > 3 ? 8 : 5;

    const opponent = attacker === this.gameState.player1 ? this.gameState.player2 : this.gameState.player1;

    if (Math.abs(attacker.x - opponent.x) < range && Math.abs(attacker.y - opponent.y) < 50) {
      if (!opponent.blocking || attacker.combo > 4) {
        this.hitOpponent(opponent, damage, attacker);
        attacker.combo++;
        this.gameState.comboCount = attacker.combo;
        this.gameState.lastHitBy = attacker.name;
      }
    }
  }

  performSpecial(player) {
    if (player.specialMeter < 100) return;

    player.state = 'special';
    player.specialMeter = 0;
    player.animFrame = 0;

    const opponent = player === this.gameState.player1 ? this.gameState.player2 : this.gameState.player1;

    this.createHitEffect(opponent.x, opponent.y - 30, '#f1c40f');

    if (Math.abs(player.x - opponent.x) < 150) {
      this.hitOpponent(opponent, 25, player);
    }
  }

  hitOpponent(victim, damage, attacker) {
    victim.hp -= damage;
    victim.hitStun = 0.3;
    victim.vx = attacker.facing * 15;
    victim.vy = -5;

    this.gameState.particles.push({
      x: victim.x + victim.width / 2,
      y: victim.y + 20,
      vx: (Math.random() - 0.5) * 10,
      vy: -5 - Math.random() * 5,
      life: 0.5,
      color: '#e74c3c'
    });

    this.createHitEffect(victim.x + victim.width / 2, victim.y + 30, '#fff');
  }

  checkHit(attacker, victim) {
    if (attacker.state !== 'attack') return;

    const frame = attacker.animFrame;
    if (frame < 0.2 || frame > 0.5) return;

    const range = 70 + attacker.combo * 2;
    const damage = 4 + attacker.combo;

    if (Math.abs(attacker.x - victim.x) < range && Math.abs(attacker.y - victim.y) < 50) {
      if (!victim.blocking) {
        this.hitOpponent(victim, damage, attacker);
        attacker.combo++;
        this.gameState.comboCount = attacker.combo;
        this.gameState.lastHitBy = attacker.name;
      }
    }
  }

  createHitEffect(x, y, color) {
    this.gameState.hitEffects.push({
      x: x,
      y: y,
      life: 0.2,
      color: color,
      size: 20
    });
  }

  endRound() {
    const p1 = this.gameState.player1;
    const p2 = this.gameState.player2;

    if (p1.hp > p2.hp) {
      this.gameState.p1Wins++;
    } else if (p2.hp > p1.hp) {
      this.gameState.p2Wins++;
    }

    if (this.gameState.p1Wins >= 2 || this.gameState.p2Wins >= 2) {
      this.gameState.status = 'finished';
    } else {
      this.gameState.round++;
      setTimeout(() => this.initGame(), 2000);
    }
  }

  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }

  render() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const bgGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    bgGradient.addColorStop(0, '#2c3e50');
    bgGradient.addColorStop(1, '#1a1a2e');
    this.ctx.fillStyle = bgGradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#34495e';
    this.ctx.fillRect(0, 420, this.canvas.width, 80);

    this.ctx.strokeStyle = '#2c3e50';
    this.ctx.lineWidth = 3;
    for (let i = 0; i < 20; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * 50, 420);
      this.ctx.lineTo(i * 50 + 25, 500);
      this.ctx.stroke();
    }

    this.drawFighter(this.gameState.player1);
    this.drawFighter(this.gameState.player2);

    this.gameState.hitEffects.forEach(e => {
      this.ctx.fillStyle = e.color;
      this.ctx.globalAlpha = e.life * 5;
      this.ctx.beginPath();
      this.ctx.arc(e.x, e.y, e.size * (1 - e.life * 2), 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;

    this.gameState.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life;
      this.ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
    });
    this.ctx.globalAlpha = 1;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(20, 20, 200, 80);
    this.ctx.fillRect(this.canvas.width - 220, 20, 200, 80);

    const p1 = this.gameState.player1;
    const p2 = this.gameState.player2;

    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(30, 30, 180, 15);
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(30, 30, 180 * (p1.hp / p1.maxHp), 15);
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillRect(30, 55, 180 * (p1.energy / p1.maxEnergy), 8);
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.fillRect(30, 70, 180 * (p1.specialMeter / 100), 8);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('P1', 30, 95);

    this.ctx.fillStyle = '#3498db';
    this.ctx.fillRect(this.canvas.width - 200, 30, 180, 15);
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(this.canvas.width - 200, 30, 180 * (p2.hp / p2.maxHp), 15);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(this.canvas.width - 200, 55, 180 * (p2.energy / p2.maxEnergy), 8);
    this.ctx.fillStyle = '#9b59b6';
    this.ctx.fillRect(this.canvas.width - 200, 70, 180 * (p2.specialMeter / 100), 8);

    this.ctx.fillStyle = '#fff';
    this.ctx.fillText('CPU', this.canvas.width - 200, 95);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 30px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(Math.ceil(this.gameState.roundTime), this.canvas.width / 2, 50);

    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, 35, 25, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.fillStyle = '#f39c12';
    this.ctx.fillText(this.gameState.round, this.canvas.width / 2, 43);

    if (this.gameState.comboCount > 2) {
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.font = 'bold 40px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`${this.gameState.comboCount} COMBO!`, this.canvas.width / 2, this.canvas.height / 2);
    }

    if (this.gameState.status === 'finished') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = this.gameState.p1Wins >= 2 ? '#e74c3c' : '#3498db';
      this.ctx.font = 'bold 50px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.gameState.p1Wins >= 2 ? 'PLAYER 1 WINS!' : 'CPU WINS!', this.canvas.width / 2, this.canvas.height / 2);
    }
  }

  drawFighter(player) {
    this.ctx.save();
    this.ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    this.ctx.scale(player.facing, 1);

    const isHit = player.hitStun > 0;
    const isBlocking = player.blocking;

    if (isHit && Math.floor(this.gameState.time * 20) % 2 === 0) {
      this.ctx.globalAlpha = 0.5;
    }

    this.ctx.fillStyle = player.color;
    this.ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);

    this.ctx.fillStyle = '#f1c40f';
    this.ctx.fillRect(-12, -player.height / 2 - 25, 24, 24);

    this.ctx.fillStyle = '#000';
    const eyeX = player.facing * 8;
    this.ctx.fillRect(eyeX - 3, -player.height / 2 - 15, 6, 6);

    if (isBlocking) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(-player.width / 2 - 10, -player.height / 2, 10, player.height);
    }

    if (player.state === 'attack') {
      const punchX = player.width / 2 + 20;
      const punchY = -10 + Math.sin(player.animFrame * 10) * 5;

      this.ctx.fillStyle = '#f39c12';
      this.ctx.beginPath();
      this.ctx.arc(punchX, punchY, 12, 0, Math.PI * 2);
      this.ctx.fill();

      if (player.specialMeter >= 100) {
        this.ctx.strokeStyle = '#f1c40f';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(punchX, punchY, 20, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }

    if (player.specialMeter >= 50) {
      this.ctx.fillStyle = 'rgba(241, 196, 15, 0.5)';
      this.ctx.fillRect(-player.width / 2, player.height / 2 - 5, player.width * (player.specialMeter / 100), 5);
    }

    this.ctx.globalAlpha = 1;
    this.ctx.restore();
  }

  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.FightingGame = FightingGame;