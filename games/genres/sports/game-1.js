// Soccer Stars - Complete Sports Game with Teams
class SoccerGame {
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
      half: 1,
      status: 'playing',
      ball: null,
      teams: { home: [], away: [] },
      field: { width: 0, height: 0, centerX: 0, centerY: 0 },
      goals: { left: null, right: null },
      gameTime: 0,
      overtime: false,
      penalties: false,
      penaltyShootout: { home: [], away: [], currentKick: 0, kickingTeam: 'home' }
    };

    this.keys = {};
    this.mouse = { x: 0, y: 0, pressed: false };
    this.selectedPlayer = null;
    this.camera = { x: 0, y: 0, target: null, smoothing: 0.1 };

    this.initGame();
    this.setupControls();
  }

  resizeCanvas() {
    const parent = this.canvas.parentElement;
    this.canvas.width = parent.clientWidth || 900;
    this.canvas.height = parent.clientHeight || 650;
  }

  setupControls() {
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.pressed = true;
      this.selectPlayerAtPosition();
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
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

  selectPlayerAtPosition() {
    const team = this.gameState.teams.home;
    for (let player of team) {
      const dx = player.x - this.mouse.x;
      const dy = player.y - this.mouse.y;
      if (Math.sqrt(dx * dx + dy * dy) < player.radius + 10) {
        this.selectedPlayer = player;
        return;
      }
    }
  }

  togglePause() {
    if (this.gameState.status === 'playing') {
      this.gameState.status = 'paused';
    } else if (this.gameState.status === 'paused') {
      this.gameState.status = 'playing';
    }
  }

  initGame() {
    this.gameState.field.width = this.canvas.width;
    this.gameState.field.height = this.canvas.height;
    this.gameState.field.centerX = this.canvas.width / 2;
    this.gameState.field.centerY = this.canvas.height / 2;

    const goalWidth = 80;
    const goalHeight = 200;
    this.gameState.goals.left = {
      x: 0,
      y: this.gameState.field.centerY - goalHeight / 2,
      width: goalWidth,
      height: goalHeight,
      area: {
        x: 0,
        y: this.gameState.field.centerY - goalHeight / 2 - 50,
        width: 80,
        height: goalHeight + 100
      }
    };
    this.gameState.goals.right = {
      x: this.gameState.field.width - goalWidth,
      y: this.gameState.field.centerY - goalHeight / 2,
      width: goalWidth,
      height: goalHeight,
      area: {
        x: this.gameState.field.width - goalWidth,
        y: this.gameState.field.centerY - goalHeight / 2 - 50,
        width: 80,
        height: goalHeight + 100
      }
    };

    this.gameState.ball = {
      x: this.gameState.field.centerX,
      y: this.gameState.field.centerY,
      vx: 0,
      vy: 0,
      radius: 10,
      friction: 0.985,
      maxSpeed: 18,
      rotation: 0,
      gravity: 0.15,
      bounce: 0.7
    };

    const formations = [
      { positions: [
        { x: this.gameState.field.centerX, y: this.gameState.field.centerY - 30 },
        { x: this.gameState.field.centerX - 100, y: this.gameState.field.centerY },
        { x: this.gameState.field.centerX + 100, y: this.gameState.field.centerY },
        { x: this.gameState.field.centerX - 200, y: this.gameState.field.centerY - 50 },
        { x: this.gameState.field.centerX + 200, y: this.gameState.field.centerY - 50 },
        { x: this.gameState.field.centerX - 200, y: this.gameState.field.centerY + 50 },
        { x: this.gameState.field.centerX + 200, y: this.gameState.field.centerY + 50 },
        { x: this.gameState.field.centerX - 300, y: this.gameState.field.centerY - 30 },
        { x: this.gameState.field.centerX + 300, y: this.gameState.field.centerY - 30 },
        { x: this.gameState.field.centerX - 300, y: this.gameState.field.centerY + 30 },
        { x: this.gameState.field.centerX + 300, y: this.gameState.field.centerY + 30 }
      ]}
    ];

    const homeTeam = formations[0].positions.map((pos, i) => ({
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      radius: 15,
      speed: 4,
      acceleration: 0.5,
      friction: 0.92,
      color: this.players[i]?.color || '#3498db',
      name: this.players[i]?.name || `Player ${i + 1}`,
      number: i + 1,
      role: i === 0 ? 'goalkeeper' : (i < 4 ? 'defender' : (i < 8 ? 'midfielder' : 'forward')),
      energy: 100,
      hasBall: false,
      team: 'home'
    }));

    const awayTeam = formations[0].positions.map((pos, i) => ({
      x: this.gameState.field.width - pos.x,
      y: this.gameState.field.height - pos.y,
      vx: 0,
      vy: 0,
      radius: 15,
      speed: 3.8,
      acceleration: 0.45,
      friction: 0.92,
      color: this.players[i + 11]?.color || '#e74c3c',
      name: this.players[i + 11]?.name || `CPU ${i + 1}`,
      number: i + 1,
      role: i === 0 ? 'goalkeeper' : (i < 4 ? 'defender' : (i < 8 ? 'midfielder' : 'forward')),
      energy: 100,
      hasBall: false,
      team: 'away',
      cpu: true
    }));

    this.gameState.teams.home = homeTeam;
    this.gameState.teams.away = awayTeam;
  }

  update(deltaTime) {
    if (this.gameState.status !== 'playing') return;

    this.gameState.gameTime += deltaTime;
    if (this.gameState.gameTime >= 2700000 && !this.gameState.overtime) {
      this.gameState.overtime = true;
    }

    this.updateBall(deltaTime);
    this.updatePlayers(deltaTime);
    this.checkCollisions();
    this.checkGoalScored();
    this.updateCamera(deltaTime);
    this.updateCPU(deltaTime);
  }

  updateBall(deltaTime) {
    const ball = this.gameState.ball;
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vx *= ball.friction;
    ball.vy *= ball.friction;

    ball.rotation += (ball.vx * 0.1);

    if (ball.y + ball.radius > this.gameState.field.height) {
      ball.y = this.gameState.field.height - ball.radius;
      ball.vy *= -ball.bounce;
    }
    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
      ball.vy *= -ball.bounce;
    }
    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius;
      ball.vx *= -ball.bounce;
    }
    if (ball.x + ball.radius > this.gameState.field.width) {
      ball.x = this.gameState.field.width - ball.radius;
      ball.vx *= -ball.bounce;
    }

    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (speed > ball.maxSpeed) {
      const ratio = ball.maxSpeed / speed;
      ball.vx *= ratio;
      ball.vy *= ratio;
    }

    if (Math.abs(ball.vx) < 0.05 && Math.abs(ball.vy) < 0.05) {
      ball.vx = 0;
      ball.vy = 0;
    }
  }

  updatePlayers(deltaTime) {
    const speed = 1;
    for (let player of this.gameState.teams.home) {
      if (this.keys['w']) player.vy -= player.acceleration;
      if (this.keys['s']) player.vy += player.acceleration;
      if (this.keys['a']) player.vx -= player.acceleration;
      if (this.keys['d']) player.vx += player.acceleration;

      player.vx *= player.friction;
      player.vy *= player.friction;

      const playerSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
      if (playerSpeed > player.speed) {
        const ratio = player.speed / playerSpeed;
        player.vx *= ratio;
        player.vy *= ratio;
      }

      player.x += player.vx * speed;
      player.y += player.vy * speed;

      if (player.x - player.radius < 0) player.x = player.radius;
      if (player.x + player.radius > this.gameState.field.width) player.x = this.gameState.field.width - player.radius;
      if (player.y - player.radius < 0) player.y = player.radius;
      if (player.y + player.radius > this.gameState.field.height) player.y = this.gameState.field.height - player.radius;

      player.energy = Math.max(0, player.energy - 0.01);
    }

    if (this.mouse.pressed && this.selectedPlayer) {
      const dx = this.mouse.x - this.selectedPlayer.x;
      const dy = this.mouse.y - this.selectedPlayer.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 5) {
        this.selectedPlayer.vx += (dx / dist) * player.acceleration * 2;
        this.selectedPlayer.vy += (dy / dist) * player.acceleration * 2;
      }
    }
  }

  updateCPU(deltaTime) {
    const ball = this.gameState.ball;
    const cpuPlayers = this.gameState.teams.away;
    const homeGoal = this.gameState.goals.left;

    for (let player of cpuPlayers) {
      let targetX, targetY;

      if (player.role === 'goalkeeper') {
        const goalCenterY = this.gameState.field.centerY;
        targetY = ball.y;
        targetX = 50;
      } else {
        const ballDist = Math.sqrt(Math.pow(ball.x - player.x, 2) + Math.pow(ball.y - player.y, 2));

        if (ballDist < 100) {
          targetX = ball.x;
          targetY = ball.y;
        } else if (player.role === 'forward') {
          const attackTarget = { x: this.gameState.field.width * 0.7, y: this.gameState.field.centerY };
          targetX = (attackTarget.x + ball.x) / 2;
          targetY = (attackTarget.y + ball.y) / 2;
        } else if (player.role === 'midfielder') {
          targetX = (this.gameState.field.centerX + ball.x) / 2;
          targetY = ball.y;
        } else {
          targetX = Math.min(ball.x, this.gameState.field.centerX);
          targetY = ball.y;
        }

        targetX = Math.max(50, Math.min(this.gameState.field.width - 50, targetX));
        targetY = Math.max(50, Math.min(this.gameState.field.height - 50, targetY));
      }

      const dx = targetX - player.x;
      const dy = targetY - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 5) {
        const cpuSpeed = player.speed * 0.75;
        player.vx += (dx / dist) * player.acceleration * 0.8;
        player.vy += (dy / dist) * player.acceleration * 0.8;
      }

      player.vx *= player.friction;
      player.vy *= player.friction;

      const playerSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
      if (playerSpeed > player.speed * 0.85) {
        const ratio = (player.speed * 0.85) / playerSpeed;
        player.vx *= ratio;
        player.vy *= ratio;
      }

      player.x += player.vx;
      player.y += player.vy;

      if (player.x - player.radius < 0) player.x = player.radius;
      if (player.x + player.radius > this.gameState.field.width) player.x = this.gameState.field.width - player.radius;
      if (player.y - player.radius < 0) player.y = player.radius;
      if (player.y + player.radius > this.gameState.field.height) player.y = this.gameState.field.height - player.radius;
    }
  }

  checkCollisions() {
    const ball = this.gameState.ball;
    const allPlayers = [...this.gameState.teams.home, ...this.gameState.teams.away];

    for (let player of allPlayers) {
      const dx = ball.x - player.x;
      const dy = ball.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = ball.radius + player.radius;

      if (dist < minDist) {
        const angle = Math.atan2(dy, dx);
        const overlap = minDist - dist;

        ball.x += Math.cos(angle) * overlap;
        ball.y += Math.sin(angle) * overlap;

        const hitPower = 8;
        ball.vx = Math.cos(angle) * hitPower + player.vx * 0.5;
        ball.vy = Math.sin(angle) * hitPower + player.vy * 0.5;

        player.hasBall = true;
      } else {
        if (Math.sqrt(Math.pow(ball.x - player.x, 2) + Math.pow(ball.y - player.y, 2)) > 50) {
          player.hasBall = false;
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

  checkGoalScored() {
    const ball = this.gameState.ball;
    const leftGoal = this.gameState.goals.left;
    const rightGoal = this.gameState.goals.right;

    if (ball.y > leftGoal.y && ball.y < leftGoal.y + leftGoal.height &&
        ball.x < leftGoal.x + leftGoal.width && ball.x > leftGoal.x) {
      this.gameState.score.away += 1;
      this.resetAfterGoal('right');
    }

    if (ball.y > rightGoal.y && ball.y < rightGoal.y + rightGoal.height &&
        ball.x > rightGoal.x && ball.x < rightGoal.x + rightGoal.width) {
      this.gameState.score.home += 1;
      this.resetAfterGoal('left');
    }
  }

  resetAfterGoal(scorer) {
    this.gameState.ball.x = this.gameState.field.centerX;
    this.gameState.ball.y = this.gameState.field.centerY;
    this.gameState.ball.vx = 0;
    this.gameState.ball.vy = 0;

    for (let player of this.gameState.teams.home) {
      player.vx = 0;
      player.vy = 0;
    }
    for (let player of this.gameState.teams.away) {
      player.vx = 0;
      player.vy = 0;
    }

    setTimeout(() => {
      this.initGamePositions();
    }, 2000);
  }

  initGamePositions() {
    const formations = [
      { positions: [
        { x: this.gameState.field.centerX, y: this.gameState.field.centerY - 30 },
        { x: this.gameState.field.centerX - 100, y: this.gameState.field.centerY },
        { x: this.gameState.field.centerX + 100, y: this.gameState.field.centerY },
        { x: this.gameState.field.centerX - 200, y: this.gameState.field.centerY - 50 },
        { x: this.gameState.field.centerX + 200, y: this.gameState.field.centerY - 50 },
        { x: this.gameState.field.centerX - 200, y: this.gameState.field.centerY + 50 },
        { x: this.gameState.field.centerX + 200, y: this.gameState.field.centerY + 50 },
        { x: this.gameState.field.centerX - 300, y: this.gameState.field.centerY - 30 },
        { x: this.gameState.field.centerX + 300, y: this.gameState.field.centerY - 30 },
        { x: this.gameState.field.centerX - 300, y: this.gameState.field.centerY + 30 },
        { x: this.gameState.field.centerX + 300, y: this.gameState.field.centerY + 30 }
      ]}
    ];

    this.gameState.teams.home.forEach((player, i) => {
      player.x = formations[0].positions[i].x;
      player.y = formations[0].positions[i].y;
      player.vx = 0;
      player.vy = 0;
    });

    this.gameState.teams.away.forEach((player, i) => {
      player.x = this.gameState.field.width - formations[0].positions[i].x;
      player.y = this.gameState.field.height - formations[0].positions[i].y;
      player.vx = 0;
      player.vy = 0;
    });
  }

  updateCamera(deltaTime) {
    const ball = this.gameState.ball;
    this.camera.target = { x: ball.x, y: ball.y };

    this.camera.x += (this.camera.target.x - this.camera.x) * this.camera.smoothing;
    this.camera.y += (this.camera.target.y - this.camera.y) * this.camera.smoothing;
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawField(ctx);
    this.drawGoals(ctx);
    this.drawPlayers(ctx);
    this.drawBall(ctx);
    this.drawHUD(ctx);

    if (this.gameState.status === 'paused') {
      this.drawPauseScreen(ctx);
    }
  }

  drawField(ctx) {
    const field = this.gameState.field;

    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(0, 0, field.width, field.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.strokeRect(50, 50, field.width - 100, field.height - 100);

    ctx.beginPath();
    ctx.moveTo(field.centerX, 50);
    ctx.lineTo(field.centerX, field.height - 50);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(field.centerX, field.centerY, 70, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(field.centerX, field.centerY, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, field.centerY - 100, 150, 200);
    ctx.strokeRect(field.width - 200, field.centerY - 100, 150, 200);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(100, 150);
    ctx.lineTo(50, field.centerY);
    ctx.lineTo(100, field.height - 150);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(field.width - 100, 150);
    ctx.lineTo(field.width - 50, field.centerY);
    ctx.lineTo(field.width - 100, field.height - 150);
    ctx.closePath();
    ctx.fill();

    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 15; j++) {
        ctx.fillStyle = 'rgba(0, 100, 0, 0.1)';
        if ((i + j) % 2 === 0) {
          ctx.fillRect(50 + i * 45, 50 + j * 40, 45, 40);
        }
      }
    }
  }

  drawGoals(ctx) {
    const leftGoal = this.gameState.goals.left;
    const rightGoal = this.gameState.goals.right;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(leftGoal.x, leftGoal.y, leftGoal.width, leftGoal.height);
    ctx.fillRect(rightGoal.x, rightGoal.y, rightGoal.width, rightGoal.height);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 5;
    ctx.strokeRect(leftGoal.x, leftGoal.y, leftGoal.width, leftGoal.height);
    ctx.strokeRect(rightGoal.x, rightGoal.y, rightGoal.width, rightGoal.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, leftGoal.y);
    ctx.lineTo(leftGoal.x + leftGoal.width, leftGoal.y);
    ctx.lineTo(leftGoal.x + leftGoal.width, leftGoal.y + leftGoal.height);
    ctx.lineTo(0, leftGoal.y + leftGoal.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(field.width, rightGoal.y);
    ctx.lineTo(rightGoal.x, rightGoal.y);
    ctx.lineTo(rightGoal.x, rightGoal.y + rightGoal.height);
    ctx.lineTo(field.width, rightGoal.y + rightGoal.height);
    ctx.stroke();
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
    ctx.arc(player.x, player.y, player.radius + 3, 0, Math.PI * 2);
    ctx.fillStyle = isHome ? 'rgba(52, 152, 219, 0.3)' : 'rgba(231, 76, 60, 0.3)';
    ctx.fill();

    const gradient = ctx.createRadialGradient(
      player.x - 3, player.y - 3, 0,
      player.x, player.y, player.radius
    );
    gradient.addColorStop(0, this.lightenColor(player.color, 30));
    gradient.addColorStop(1, player.color);

    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.number.toString(), player.x, player.y);

    if (player === this.selectedPlayer) {
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawBall(ctx) {
    const ball = this.gameState.ball;

    ctx.save();

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius + 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fill();

    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.rotation);

    const gradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, ball.radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#e0e0e0');

    ctx.beginPath();
    ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(-ball.radius * 0.7, 0);
    ctx.lineTo(ball.radius * 0.7, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -ball.radius * 0.7);
    ctx.lineTo(0, ball.radius * 0.7);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, ball.radius * 0.4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  drawHUD(ctx) {
    const field = this.gameState.field;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, field.width, 50);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const time = Math.floor(this.gameState.gameTime / 1000);
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    ctx.fillText(`${this.gameState.score.home} - ${this.gameState.score.away}`, field.width / 2, 25);

    ctx.font = '16px Arial';
    ctx.fillText(timeStr, field.width / 2, 45);

    ctx.fillStyle = '#3498db';
    ctx.textAlign = 'left';
    ctx.fillText('HOME', 30, 25);

    ctx.fillStyle = '#e74c3c';
    ctx.textAlign = 'right';
    ctx.fillText('AWAY', field.width - 30, 25);

    ctx.fillStyle = this.gameState.half === 1 ? '#2ecc71' : '#e67e22';
    ctx.textAlign = 'center';
    ctx.fillText(`Half ${this.gameState.half}`, field.width / 2, 45);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(field.width - 150, field.height - 35, 140, 30);

    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('WASD - Move | Click Player - Select', field.width / 2, field.height - 20);

    if (this.gameState.overtime) {
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('OVERTIME', field.width / 2, 65);
    }
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
      half: this.gameState.half,
      status: this.gameState.status
    };
  }
}

window.SoccerGame = SoccerGame;