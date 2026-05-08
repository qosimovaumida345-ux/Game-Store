// Hockey Arena - Ice Hockey Game
class HockeyGame {
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
      score: { home: 0, away: 0 },
      period: 1,
      status: 'playing',
      puck: null,
      teams: { home: [], away: [] },
      rink: { width: 0, height: 0, centerX: 0, centerY: 0 },
      goals: { left: null, right: null },
      gameTime: 0,
      possession: 'home',
      penalty: false,
      penaltyTimer: 0,
      goalieLeft: null,
      goalieRight: null,
      faceoff: true,
      faceoffPos: null,
      periodTime: 120000,
      periodTimeLeft: 120000
    };

    this.keys = {};
    this.mouse = { x: 0, y: 0, pressed: false };

    this.initGame();
    this.setupControls();
  }

  resizeCanvas() {
    const parent = this.canvas.parentElement;
    this.canvas.width = parent.clientWidth || 900;
    this.canvas.height = parent.clientHeight || 600;
  }

  setupControls() {
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.pressed = true;
    });

    this.canvas.addEventListener('mouseup', () => {
      this.mouse.pressed = false;
    });

    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key === ' ') this.togglePause();
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  togglePause() {
    if (this.gameState.status === 'playing') {
      this.gameState.status = 'paused';
    } else if (this.gameState.status === 'paused') {
      this.gameState.status = 'playing';
    }
  }

  initGame() {
    const rink = this.gameState.rink;
    rink.width = this.canvas.width;
    rink.height = this.canvas.height;
    rink.centerX = this.canvas.width / 2;
    rink.centerY = this.canvas.height / 2;

    const goalWidth = 20;
    const goalHeight = 80;

    this.gameState.goals.left = {
      x: 30,
      y: rink.centerY - goalHeight / 2,
      width: goalWidth,
      height: goalHeight,
      net: { x: 10, y: rink.centerY - goalHeight / 2, w: 30, h: goalHeight }
    };

    this.gameState.goals.right = {
      x: rink.width - 30 - goalWidth,
      y: rink.centerY - goalHeight / 2,
      width: goalWidth,
      height: goalHeight,
      net: { x: rink.width - 40, y: rink.centerY - goalHeight / 2, w: 30, h: goalHeight }
    };

    this.gameState.puck = {
      x: rink.centerX,
      y: rink.centerY,
      vx: 0,
      vy: 0,
      radius: 10,
      friction: 0.995,
      maxSpeed: 20,
      rotation: 0,
      state: 'idle',
      inPlay: true
    };

    const homePositions = [
      { x: rink.centerX - 80, y: rink.centerY },
      { x: rink.centerX - 150, y: rink.centerY - 60 },
      { x: rink.centerX - 150, y: rink.centerY + 60 },
      { x: rink.centerX + 100, y: rink.centerY },
      { x: rink.centerX + 180, y: rink.centerY - 40 },
      { x: rink.centerX + 180, y: rink.centerY + 40 }
    ];

    const awayPositions = [
      { x: rink.centerX + 80, y: rink.centerY },
      { x: rink.centerX + 150, y: rink.centerY + 60 },
      { x: rink.centerX + 150, y: rink.centerY - 60 },
      { x: rink.centerX - 100, y: rink.centerY },
      { x: rink.centerX - 180, y: rink.centerY + 40 },
      { x: rink.centerX - 180, y: rink.centerY - 40 }
    ];

    this.gameState.teams.home = homePositions.map((pos, i) => ({
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      radius: 14,
      speed: 5,
      acceleration: 0.8,
      color: '#e74c3c',
      name: this.players[i]?.name || `Player ${i + 1}`,
      number: i + 1,
      role: i === 0 ? 'center' : (i === 1 || i === 2 ? 'wing' : (i === 3 ? 'defense' : 'forward')),
      hasPuck: false,
      team: 'home',
      stickAngle: 0
    }));

    this.gameState.teams.away = awayPositions.map((pos, i) => ({
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      radius: 14,
      speed: 4.5,
      acceleration: 0.7,
      color: '#3498db',
      name: this.players[i + 6]?.name || `CPU ${i + 1}`,
      number: i + 1,
      role: i === 0 ? 'center' : (i === 1 || i === 2 ? 'wing' : (i === 3 ? 'defense' : 'forward')),
      hasPuck: false,
      team: 'away',
      cpu: true,
      stickAngle: Math.PI
    }));

    this.gameState.goalieLeft = {
      x: 60,
      y: rink.centerY,
      width: 30,
      height: 50,
      color: '#e74c3c',
      save: 0,
      team: 'home'
    };

    this.gameState.goalieRight = {
      x: rink.width - 60,
      y: rink.centerY,
      width: 30,
      height: 50,
      color: '#3498db',
      save: 0,
      team: 'away'
    };
  }

  update(deltaTime) {
    if (this.gameState.status !== 'playing') return;

    this.gameState.gameTime += deltaTime;
    this.gameState.periodTimeLeft -= deltaTime;

    if (this.gameState.periodTimeLeft <= 0) {
      if (this.gameState.period < 3) {
        this.gameState.period++;
        this.gameState.periodTimeLeft = this.gameState.periodTime;
      } else {
        this.gameState.status = 'game_over';
      }
    }

    this.updatePuck(deltaTime);
    this.updatePlayers(deltaTime);
    this.checkCollisions();
    this.checkGoal();
    this.updateCPU(deltaTime);
  }

  updatePuck(deltaTime) {
    const puck = this.gameState.puck;
    const rink = this.gameState.rink;

    puck.x += puck.vx;
    puck.y += puck.vy;

    puck.vx *= puck.friction;
    puck.vy *= puck.friction;

    puck.rotation += (Math.abs(puck.vx) + Math.abs(puck.vy)) * 0.05;

    if (puck.y - puck.radius < 30) {
      puck.y = 30 + puck.radius;
      puck.vy *= -0.8;
    }
    if (puck.y + puck.radius > rink.height - 30) {
      puck.y = rink.height - 30 - puck.radius;
      puck.vy *= -0.8;
    }
    if (puck.x - puck.radius < 30) {
      puck.x = 30 + puck.radius;
      puck.vx *= -0.8;
    }
    if (puck.x + puck.radius > rink.width - 30) {
      puck.x = rink.width - 30 - puck.radius;
      puck.vx *= -0.8;
    }

    const speed = Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy);
    if (speed > puck.maxSpeed) {
      const ratio = puck.maxSpeed / speed;
      puck.vx *= ratio;
      puck.vy *= ratio;
    }

    if (speed < 0.1) {
      puck.vx = 0;
      puck.vy = 0;
    }
  }

  updatePlayers(deltaTime) {
    const speed = 1;

    for (let player of this.gameState.teams.home) {
      if (this.keys['w']) player.vy -= player.acceleration;
      if (this.keys['s']) player.vy += player.acceleration;
      if (this.keys['a']) player.vx -= player.acceleration;
      if (this.keys['d']) player.vx += player.acceleration;

      if (this.mouse.pressed) {
        const dx = this.mouse.x - player.x;
        const dy = this.mouse.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) {
          player.vx += (dx / dist) * player.acceleration * 1.5;
          player.vy += (dy / dist) * player.acceleration * 1.5;
        }
      }

      player.vx *= 0.92;
      player.vy *= 0.92;

      const playerSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
      if (playerSpeed > player.speed) {
        const ratio = player.speed / playerSpeed;
        player.vx *= ratio;
        player.vy *= ratio;
      }

      player.x += player.vx * speed;
      player.y += player.vy * speed;

      this.constrainPlayer(player);

      if (player.hasPuck) {
        player.stickAngle = Math.atan2(this.gameState.puck.y - player.y, this.gameState.puck.x - player.x);
      }
    }
  }

  constrainPlayer(player) {
    const rink = this.gameState.rink;
    const goalLeft = this.gameState.goals.left;
    const goalRight = this.gameState.goals.right;

    if (player.x - player.radius < 30) {
      player.x = 30 + player.radius;
      player.vx = 0;
    }
    if (player.x + player.radius > rink.width - 30) {
      player.x = rink.width - 30 - player.radius;
      player.vx = 0;
    }
    if (player.y - player.radius < 30) {
      player.y = 30 + player.radius;
      player.vy = 0;
    }
    if (player.y + player.radius > rink.height - 30) {
      player.y = rink.height - 30 - player.radius;
      player.vy = 0;
    }

    if (player.team === 'home') {
      if (player.x > rink.centerX + 150) {
        player.x = rink.centerX + 150;
        player.vx = 0;
      }
      if (player.y > goalLeft.y - 30 && player.y < goalLeft.y + goalLeft.height + 30 &&
          player.x < goalLeft.x + 50) {
        player.x = goalLeft.x + 50;
        player.vx = 0;
      }
    } else {
      if (player.x < rink.centerX - 150) {
        player.x = rink.centerX - 150;
        player.vx = 0;
      }
      if (player.y > goalRight.y - 30 && player.y < goalRight.y + goalRight.height + 30 &&
          player.x > goalRight.x - 50) {
        player.x = goalRight.x - 50;
        player.vx = 0;
      }
    }
  }

  updateCPU(deltaTime) {
    const puck = this.gameState.puck;
    const cpuTeam = this.gameState.teams.away;
    const homeGoal = this.gameState.goals.left;
    const awayGoal = this.gameState.goals.right;

    for (let player of cpuTeam) {
      let targetX, targetY;

      const puckDist = Math.sqrt(Math.pow(puck.x - player.x, 2) + Math.pow(puck.y - player.y, 2));

      if (player.hasPuck) {
        const attackTarget = { x: awayGoal.x - 100, y: awayGoal.y + (Math.random() - 0.5) * 100 };
        targetX = attackTarget.x;
        targetY = attackTarget.y;

        if (Math.random() < 0.02) {
          this.shootPuck(player);
        }
      } else if (puckDist < 150) {
        targetX = puck.x + (Math.random() - 0.5) * 30;
        targetY = puck.y + (Math.random() - 0.5) * 30;

        if (puckDist < 30) {
          this.checkPuckPickup(player);
        }
      } else {
        targetX = (rink.centerX + puck.x) / 2;
        targetY = puck.y;

        if (puck.x < rink.centerX) {
          targetX = puck.x + 80;
        }
      }

      targetX = Math.max(100, Math.min(rink.width - 100, targetX));
      targetY = Math.max(80, Math.min(rink.height - 80, targetY));

      const dx = targetX - player.x;
      const dy = targetY - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 10) {
        player.vx += (dx / dist) * player.acceleration * 0.7;
        player.vy += (dy / dist) * player.acceleration * 0.7;
      }

      player.vx *= 0.92;
      player.vy *= 0.92;

      const maxSpeed = player.speed * 0.9;
      const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
      if (speed > maxSpeed) {
        const ratio = maxSpeed / speed;
        player.vx *= ratio;
        player.vy *= ratio;
      }

      player.x += player.vx;
      player.y += player.vy;

      this.constrainPlayer(player);

      if (player.hasPuck) {
        player.stickAngle = Math.atan2(puck.y - player.y, puck.x - player.x);
      } else {
        player.stickAngle = Math.atan2(puck.y - player.y, puck.x - player.x);
      }
    }

    const goalie = this.gameState.goalieRight;
    const targetGoalieY = puck.y;
    goalie.y += (targetGoalieY - goalie.y) * 0.1;

    if (goalie.y - goalie.height / 2 < 30) goalie.y = 30 + goalie.height / 2;
    if (goalie.y + goalie.height / 2 > rink.height - 30) goalie.y = rink.height - 30 - goalie.height / 2;
  }

  shootPuck(player) {
    const puck = this.gameState.puck;
    const goal = player.team === 'home' ? this.gameState.goals.right : this.gameState.goals.left;

    const dx = goal.x + goal.width / 2 - puck.x;
    const dy = goal.y + goal.height / 2 - puck.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const power = 12 + Math.random() * 5;

    puck.vx = (dx / dist) * power;
    puck.vy = (dy / dist) * power;

    player.hasPuck = false;
  }

  checkPuckPickup(player) {
    const puck = this.gameState.puck;

    if (player.team !== this.gameState.possession) {
      const dx = puck.x - player.x;
      const dy = puck.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < player.radius + puck.radius + 10) {
        puck.x = player.x + Math.cos(player.stickAngle) * 20;
        puck.y = player.y + Math.sin(player.stickAngle) * 20;
        player.hasPuck = true;
        this.gameState.possession = player.team;
      }
    }
  }

  checkCollisions() {
    const puck = this.gameState.puck;
    const allPlayers = [...this.gameState.teams.home, ...this.gameState.teams.away];

    for (let player of allPlayers) {
      const dx = puck.x - player.x;
      const dy = puck.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < puck.radius + player.radius) {
        if (!player.hasPuck) {
          const angle = Math.atan2(dy, dx);
          const power = 6 + Math.random() * 4;

          puck.vx = Math.cos(angle) * power + player.vx * 0.3;
          puck.vy = Math.sin(angle) * power + player.vy * 0.3;

          puck.x += Math.cos(angle) * (puck.radius + player.radius - dist);
          puck.y += Math.sin(angle) * (puck.radius + player.radius - dist);
        }
      }
    }

    for (let i = 0; i < this.gameState.teams.home.length; i++) {
      for (let j = i + 1; j < this.gameState.teams.home.length; j++) {
        this.resolvePlayerCollision(this.gameState.teams.home[i], this.gameState.teams.home[j]);
      }
    }
    for (let i = 0; i < this.gameState.teams.away.length; i++) {
      for (let j = i + 1; j < this.gameState.teams.away.length; j++) {
        this.resolvePlayerCollision(this.gameState.teams.away[i], this.gameState.teams.away[j]);
      }
    }

    const goalieLeft = this.gameState.goalieLeft;
    if (puck.y > goalieLeft.y - goalieLeft.height / 2 &&
        puck.y < goalieLeft.y + goalieLeft.height / 2 &&
        puck.x < goalieLeft.x + goalieLeft.width) {
      puck.vx = Math.abs(puck.vx) * 0.5;
      puck.x = goalieLeft.x + goalieLeft.width + puck.radius;
      goalieLeft.save++;
    }

    const goalieRight = this.gameState.goalieRight;
    if (puck.y > goalieRight.y - goalieRight.height / 2 &&
        puck.y < goalieRight.y + goalieRight.height / 2 &&
        puck.x > goalieRight.x - goalieRight.width) {
      puck.vx = -Math.abs(puck.vx) * 0.5;
      puck.x = goalieRight.x - goalieRight.width - puck.radius;
      goalieRight.save++;
    }
  }

  resolvePlayerCollision(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = p1.radius + p2.radius;

    if (dist < minDist && dist > 0) {
      const overlap = (minDist - dist) / 2;
      const nx = dx / dist;
      const ny = dy / dist;

      p1.x -= nx * overlap;
      p1.y -= ny * overlap;
      p2.x += nx * overlap;
      p2.y += ny * overlap;

      const relVx = p1.vx - p2.vx;
      const relVy = p1.vy - p2.vy;
      const relDot = relVx * nx + relVy * ny;

      if (relDot > 0) {
        p1.vx -= relDot * nx * 0.5;
        p1.vy -= relDot * ny * 0.5;
        p2.vx += relDot * nx * 0.5;
        p2.vy += relDot * ny * 0.5;
      }
    }
  }

  checkGoal() {
    const puck = this.gameState.puck;
    const goalLeft = this.gameState.goals.left;
    const goalRight = this.gameState.goals.right;

    if (puck.y > goalLeft.y && puck.y < goalLeft.y + goalLeft.height &&
        puck.x < goalLeft.x) {
      this.scoreGoal(2);
    }

    if (puck.y > goalRight.y && puck.y < goalRight.y + goalRight.height &&
        puck.x > goalRight.x + goalRight.width) {
      this.scoreGoal(1);
    }
  }

  scoreGoal(team) {
    if (team === 1) {
      this.gameState.score.home += 1;
    } else {
      this.gameState.score.away += 1;
    }

    this.gameState.faceoff = true;
    this.gameState.faceoffPos = { x: this.gameState.rink.centerX, y: this.gameState.rink.centerY };

    setTimeout(() => this.resetAfterGoal(), 2000);
  }

  resetAfterGoal() {
    const puck = this.gameState.puck;
    const rink = this.gameState.rink;

    puck.x = rink.centerX;
    puck.y = rink.centerY;
    puck.vx = 0;
    puck.vy = 0;
    puck.state = 'idle';

    for (let player of [...this.gameState.teams.home, ...this.gameState.teams.away]) {
      player.vx = 0;
      player.vy = 0;
      player.hasPuck = false;
    }

    this.initGame();
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawRink(ctx);
    this.drawGoals(ctx);
    this.drawPlayers(ctx);
    this.drawGoalies(ctx);
    this.drawPuck(ctx);
    this.drawHUD(ctx);

    if (this.gameState.status === 'paused') {
      this.drawPauseScreen(ctx);
    }

    if (this.gameState.status === 'game_over') {
      this.drawGameOver(ctx);
    }
  }

  drawRink(ctx) {
    const rink = this.gameState.rink;

    const gradient = ctx.createLinearGradient(0, 0, 0, rink.height);
    gradient.addColorStop(0, '#e3f2fd');
    gradient.addColorStop(1, '#bbdefb');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rink.width, rink.height);

    ctx.strokeStyle = '#1565c0';
    ctx.lineWidth = 4;
    ctx.strokeRect(25, 25, rink.width - 50, rink.height - 50);

    ctx.strokeStyle = '#64b5f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, rink.width - 100, rink.height - 100);

    ctx.beginPath();
    ctx.moveTo(rink.centerX, 50);
    ctx.lineTo(rink.centerX, rink.height - 50);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(rink.centerX, rink.centerY, 60, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#1976d2';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(rink.centerX, rink.centerY, 100, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(rink.centerX, rink.centerY, 100, Math.PI / 2, Math.PI * 1.5);
    ctx.stroke();

    ctx.fillStyle = 'rgba(21, 101, 192, 0.3)';
    ctx.beginPath();
    ctx.arc(rink.centerX - 200, rink.centerY, 80, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(rink.centerX - 200, rink.centerY - 80);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(rink.centerX + 200, rink.centerY, 80, Math.PI / 2, -Math.PI / 2);
    ctx.lineTo(rink.centerX + 200, rink.centerY + 80);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f44336';
    ctx.beginPath();
    ctx.arc(rink.centerX - 80, rink.centerY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rink.centerX + 80, rink.centerY, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGoals(ctx) {
    this.drawGoal(ctx, this.gameState.goals.left, '#e74c3c');
    this.drawGoal(ctx, this.gameState.goals.right, '#3498db');
  }

  drawGoal(ctx, goal, color) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(goal.x - 5, goal.y + 5, goal.width, goal.height);

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.strokeRect(goal.x, goal.y, goal.width, goal.height);

    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.strokeRect(goal.x - 10, goal.y - 5, goal.width + 20, goal.height + 10);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;

    for (let i = 0; i < goal.width; i += 5) {
      ctx.beginPath();
      ctx.moveTo(goal.x + i, goal.y);
      ctx.lineTo(goal.x + i, goal.y + goal.height);
      ctx.stroke();
    }

    for (let i = 0; i < goal.height; i += 5) {
      ctx.beginPath();
      ctx.moveTo(goal.x, goal.y + i);
      ctx.lineTo(goal.x + goal.width, goal.y + i);
      ctx.stroke();
    }
  }

  drawPlayers(ctx) {
    for (let player of this.gameState.teams.home) {
      this.drawPlayer(ctx, player, true);
    }
    for (let player of this.gameState.teams.away) {
      this.drawPlayer(ctx, player, false);
    }
  }

  drawPlayer(ctx, player, isHome) {
    ctx.save();

    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 2, 0, Math.PI * 2);
    ctx.fillStyle = isHome ? 'rgba(231, 76, 60, 0.3)' : 'rgba(52, 152, 219, 0.3)';
    ctx.fill();

    const gradient = ctx.createRadialGradient(
      player.x - 2, player.y - 2, 0,
      player.x, player.y, player.radius
    );
    gradient.addColorStop(0, this.lightenColor(player.color, 40));
    gradient.addColorStop(1, player.color);

    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.number.toString(), player.x, player.y);

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(
      player.x + Math.cos(player.stickAngle) * 25,
      player.y + Math.sin(player.stickAngle) * 25
    );
    ctx.stroke();

    if (player.hasPuck) {
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawGoalies(ctx) {
    this.drawGoalie(ctx, this.gameState.goalieLeft, true);
    this.drawGoalie(ctx, this.gameState.goalieRight, false);
  }

  drawGoalie(ctx, goalie, isLeft) {
    ctx.save();

    ctx.fillStyle = goalie.color;
    ctx.beginPath();
    ctx.roundRect(
      goalie.x - goalie.width / 2,
      goalie.y - goalie.height / 2,
      goalie.width,
      goalie.height,
      5
    );
    ctx.fill();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('G', goalie.x, goalie.y);

    ctx.restore();
  }

  drawPuck(ctx) {
    const puck = this.gameState.puck;

    ctx.save();

    ctx.beginPath();
    ctx.ellipse(puck.x, puck.y + 3, puck.radius + 1, puck.radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fill();

    ctx.translate(puck.x, puck.y);
    ctx.rotate(puck.rotation);

    const gradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, puck.radius);
    gradient.addColorStop(0, '#424242');
    gradient.addColorStop(1, '#212121');

    ctx.beginPath();
    ctx.arc(0, 0, puck.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#616161';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, puck.radius - 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  drawHUD(ctx) {
    const rink = this.gameState.rink;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, rink.width, 45);

    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(this.gameState.score.home.toString(), 40, 32);

    ctx.fillStyle = '#3498db';
    ctx.fillText(this.gameState.score.away.toString(), 80, 32);

    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('-', 60, 32);

    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`Period ${this.gameState.period}`, rink.centerX, 28);

    const periodSeconds = Math.floor(this.gameState.periodTimeLeft / 1000);
    const minutes = Math.floor(periodSeconds / 60);
    const seconds = periodSeconds % 60;
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, rink.centerX, 43);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('WASD - Move | Click - Pass | Space - Pause', rink.centerX, rink.height - 15);
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

  drawGameOver(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const winner = this.gameState.score.home > this.gameState.score.away ? 'Home' : 'Away';
    const color = this.gameState.score.home > this.gameState.score.away ? '#e74c3c' : '#3498db';

    ctx.fillStyle = color;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${winner} Wins!`, this.canvas.width / 2, this.canvas.height / 2 - 40);

    ctx.fillStyle = 'white';
    ctx.font = '32px Arial';
    ctx.fillText(`${this.gameState.score.home} - ${this.gameState.score.away}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
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
      period: this.gameState.period,
      status: this.gameState.status
    };
  }
}

window.HockeyGame = HockeyGame;