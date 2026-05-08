// Basketball Pro - Basketball Game with Shooting Mechanics
class BasketballGame {
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
      quarter: 1,
      status: 'playing',
      ball: null,
      players: { home: [], away: [] },
      court: { width: 0, height: 0, centerX: 0, centerY: 0 },
      hoops: { left: null, right: null },
      gameTime: 0,
      possession: 'home',
      shotClock: 24,
      fouls: { home: 0, away: 0 },
      timeouts: { home: 3, away: 3 }
    };

    this.keys = {};
    this.mouse = { x: 0, y: 0, pressed: false, clickTime: 0 };
    this.selectedPlayer = null;
    this.shooting = false;
    this.shootPower = 0;
    this.shootAngle = 0;

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
      this.mouse.clickTime = performance.now();
      this.startShot();
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    this.canvas.addEventListener('mouseup', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.pressed = false;
      this.releaseShot();
    });

    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key === ' ') this.togglePause();
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  startShot() {
    const ball = this.gameState.ball;
    if (!ball.heldBy) return;

    this.shooting = true;
    this.shootPower = 0;
    this.shootAngle = 0;
  }

  releaseShot() {
    if (!this.shooting) return;

    const ball = this.gameState.ball;
    const shooter = ball.heldBy;

    const hoop = this.gameState.possession === 'home' ?
      this.gameState.hoops.right : this.gameState.hoops.left;

    const dx = hoop.x - ball.x;
    const dy = hoop.y - ball.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const power = Math.min(this.shootPower, 100) / 100;
    const verticalAngle = 0.4 + power * 0.3;

    ball.velocity = {
      x: (dx / dist) * 8 * (0.5 + power * 0.5),
      y: -12 * verticalAngle,
      z: dist * 0.02
    };

    ball.heldBy = null;
    ball.state = 'flying';
    ball.arc = 0;

    this.shooting = false;
    this.shootPower = 0;
    this.gameState.shotClock = 24;
  }

  togglePause() {
    if (this.gameState.status === 'playing') {
      this.gameState.status = 'paused';
    } else if (this.gameState.status === 'paused') {
      this.gameState.status = 'playing';
    }
  }

  initGame() {
    const court = this.gameState.court;
    court.width = this.canvas.width;
    court.height = this.canvas.height;
    court.centerX = this.canvas.width / 2;
    court.centerY = this.canvas.height / 2;

    const hoopWidth = 60;
    const hoopHeight = 50;

    this.gameState.hoops.left = {
      x: 60,
      y: court.centerY - 30,
      radius: hoopWidth / 2,
      backboard: { x: 30, y: court.centerY - 60, width: 10, height: 120 },
      post: { x: 20, y: court.centerY + 60, width: 15, height: 80 }
    };

    this.gameState.hoops.right = {
      x: court.width - 60,
      y: court.centerY - 30,
      radius: hoopWidth / 2,
      backboard: { x: court.width - 40, y: court.centerY - 60, width: 10, height: 120 },
      post: { x: court.width - 35, y: court.centerY + 60, width: 15, height: 80 }
    };

    this.gameState.ball = {
      x: court.centerX,
      y: court.centerY,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      radius: 18,
      color: '#ff6b00',
      state: 'idle',
      heldBy: null,
      velocity: null,
      rotation: 0,
      hasScored: false
    };

    const homePositions = [
      { x: court.centerX - 80, y: court.centerY - 40 },
      { x: court.centerX - 150, y: court.centerY - 80 },
      { x: court.centerX - 150, y: court.centerY + 80 },
      { x: court.centerX + 200, y: court.centerY - 20 },
      { x: court.centerX + 200, y: court.centerY + 20 }
    ];

    const awayPositions = [
      { x: court.centerX + 80, y: court.centerY + 40 },
      { x: court.centerX + 150, y: court.centerY + 80 },
      { x: court.centerX + 150, y: court.centerY - 80 },
      { x: court.centerX - 200, y: court.centerY + 20 },
      { x: court.centerX - 200, y: court.centerY - 20 }
    ];

    this.gameState.players.home = homePositions.map((pos, i) => ({
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      radius: 20,
      speed: 4.5,
      acceleration: 0.6,
      color: '#2ecc71',
      number: i + 1,
      name: this.players[i]?.name || `Player ${i + 1}`,
      role: i === 0 ? 'point guard' : (i === 1 ? 'shooting guard' : (i === 2 ? 'small forward' : (i === 3 ? 'power forward' : 'center'))),
      hasBall: false,
      team: 'home',
      stamina: 100,
      canShoot: true
    }));

    this.gameState.players.away = awayPositions.map((pos, i) => ({
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      radius: 20,
      speed: 4.2,
      acceleration: 0.55,
      color: '#9b59b6',
      number: i + 1,
      name: this.players[i + 5]?.name || `CPU ${i + 1}`,
      role: i === 0 ? 'point guard' : (i === 1 ? 'shooting guard' : (i === 2 ? 'small forward' : (i === 3 ? 'power forward' : 'center'))),
      hasBall: false,
      team: 'away',
      cpu: true,
      stamina: 100,
      canShoot: true
    }));

    this.gameState.ball.heldBy = this.gameState.players.home[0];
    this.gameState.ball.heldBy.hasBall = true;
  }

  update(deltaTime) {
    if (this.gameState.status !== 'playing') return;

    this.gameState.gameTime += deltaTime;
    this.gameState.shotClock -= deltaTime / 1000;

    if (this.gameState.shotClock <= 0) {
      this.turnover();
    }

    if (this.gameState.gameTime >= 720000 && this.gameState.quarter < 4) {
      this.gameState.quarter++;
      this.gameState.gameTime = 0;
      this.gameState.shotClock = 24;
    }

    this.updateBall(deltaTime);
    this.updatePlayers(deltaTime);
    this.checkCollisions();
    this.updateCPU(deltaTime);
    this.updateShooting(deltaTime);
  }

  updateBall(deltaTime) {
    const ball = this.gameState.ball;

    if (ball.heldBy) {
      ball.x = ball.heldBy.x + 15;
      ball.y = ball.heldBy.y;
      ball.z = 30;
      ball.vx = ball.heldBy.vx;
      ball.vy = ball.heldBy.vy;
      ball.vz = 0;
    } else if (ball.state === 'flying') {
      const vel = ball.velocity;
      ball.x += vel.x;
      ball.y += vel.y;
      ball.z += vel.z;

      vel.z -= 0.4;
      vel.y += 0.3;

      ball.rotation += 0.2;

      if (ball.z <= ball.radius && !ball.hasScored) {
        const hoop = this.gameState.possession === 'home' ?
          this.gameState.hoops.right : this.gameState.hoops.left;

        const dx = ball.x - hoop.x;
        const dy = ball.y - hoop.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < hoop.radius + 10) {
          this.scoreBasket(this.gameState.possession);
          ball.hasScored = true;
        }

        vel.z = -vel.z * 0.5;
        ball.z = ball.radius;
      }

      if (ball.z < 0 || ball.x < 0 || ball.x > this.gameState.court.width ||
          ball.y < 0 || ball.y > this.gameState.court.height) {
        this.turnover();
      }
    }

    ball.vx *= 0.98;
    ball.vy *= 0.98;
  }

  updatePlayers(deltaTime) {
    const speed = 1;

    for (let player of this.gameState.players.home) {
      if (this.keys['w']) player.vy -= player.acceleration;
      if (this.keys['s']) player.vy += player.acceleration;
      if (this.keys['a']) player.vx -= player.acceleration;
      if (this.keys['d']) player.vx += player.acceleration;

      player.vx *= 0.9;
      player.vy *= 0.9;

      const playerSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
      if (playerSpeed > player.speed) {
        const ratio = player.speed / playerSpeed;
        player.vx *= ratio;
        player.vy *= ratio;
      }

      player.x += player.vx * speed;
      player.y += player.vy * speed;

      this.constrainPlayer(player);
    }
  }

  constrainPlayer(player) {
    const court = this.gameState.court;
    const margin = 40;

    if (player.x - player.radius < margin) {
      player.x = margin + player.radius;
      player.vx = 0;
    }
    if (player.x + player.radius > court.width - margin) {
      player.x = court.width - margin - player.radius;
      player.vx = 0;
    }
    if (player.y - player.radius < 10) {
      player.y = 10 + player.radius;
      player.vy = 0;
    }
    if (player.y + player.radius > court.height - 10) {
      player.y = court.height - 10 - player.radius;
      player.vy = 0;
    }

    const threePointLeft = 120;
    const threePointRight = court.width - 120;

    if (player.team === 'home') {
      if (player.x > threePointRight) {
        player.x = threePointRight - player.radius;
        player.vx = 0;
      }
    } else {
      if (player.x < threePointLeft) {
        player.x = threePointLeft + player.radius;
        player.vx = 0;
      }
    }
  }

  updateShooting(deltaTime) {
    if (this.shooting && this.mouse.pressed) {
      const elapsed = performance.now() - this.mouse.clickTime;
      this.shootPower = Math.min(elapsed / 15, 100);

      const ball = this.gameState.ball;
      const dx = this.mouse.x - ball.x;
      const dy = this.mouse.y - ball.y;
      this.shootAngle = Math.atan2(dy, dx);
    }
  }

  updateCPU(deltaTime) {
    const ball = this.gameState.ball;
    const cpuTeam = this.gameState.players.away;
    const homeHoop = this.gameState.hoops.left;
    const awayHoop = this.gameState.hoops.right;

    for (let i = 0; i < cpuTeam.length; i++) {
      const player = cpuTeam[i];
      let targetX, targetY;

      if (player.hasBall) {
        const distToHoop = Math.sqrt(
          Math.pow(awayHoop.x - player.x, 2) +
          Math.pow(awayHoop.y - player.y, 2)
        );

        if (distToHoop < 200 && Math.random() < 0.02) {
          this.cpuShoot(player);
        } else if (distToHoop < 300) {
          targetX = awayHoop.x - 50;
          targetY = awayHoop.y + (Math.random() - 0.5) * 100;
        } else {
          targetX = player.x + (Math.random() - 0.5) * 50;
          targetY = this.gameState.court.centerY;
        }
      } else {
        const ballHolder = ball.heldBy;
        if (ballHolder && ballHolder.team === 'home') {
          targetX = (ballHolder.x + homeHoop.x) / 2;
          targetY = (ballHolder.y + homeHoop.y) / 2;
        } else {
          targetX = awayHoop.x - 100;
          targetY = awayHoop.y;
        }
      }

      targetX = Math.max(100, Math.min(this.gameState.court.width - 100, targetX));
      targetY = Math.max(50, Math.min(this.gameState.court.height - 50, targetY));

      const dx = targetX - player.x;
      const dy = targetY - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 10) {
        player.vx += (dx / dist) * player.acceleration * 0.7;
        player.vy += (dy / dist) * player.acceleration * 0.7;
      }

      player.vx *= 0.9;
      player.vy *= 0.9;

      const maxSpeed = player.speed * 0.85;
      const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
      if (speed > maxSpeed) {
        const ratio = maxSpeed / speed;
        player.vx *= ratio;
        player.vy *= ratio;
      }

      player.x += player.vx;
      player.y += player.vy;

      this.constrainPlayer(player);
    }
  }

  cpuShoot(shooter) {
    const ball = this.gameState.ball;
    const hoop = this.gameState.hoops.left;

    const dx = hoop.x - ball.x;
    const dy = hoop.y - ball.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const power = 0.5 + Math.random() * 0.4;
    const verticalAngle = 0.5 + Math.random() * 0.2;

    ball.velocity = {
      x: (dx / dist) * 9 * power,
      y: -13 * verticalAngle,
      z: dist * 0.015
    };

    ball.heldBy = null;
    ball.state = 'flying';
    ball.arc = 0;
    shooter.hasBall = false;

    this.gameState.shotClock = 24;
  }

  checkCollisions() {
    const ball = this.gameState.ball;
    const allPlayers = [...this.gameState.players.home, ...this.gameState.players.away];

    if (!ball.heldBy && ball.state !== 'flying') {
      for (let player of allPlayers) {
        const dx = ball.x - player.x;
        const dy = ball.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < ball.radius + player.radius) {
          if (player.canShoot) {
            ball.heldBy = player;
            player.hasBall = true;
            ball.state = 'held';
            this.gameState.possession = player.team;
          }
          break;
        }
      }
    }

    for (let i = 0; i < this.gameState.players.home.length; i++) {
      for (let j = i + 1; j < this.gameState.players.home.length; j++) {
        this.resolveCollision(this.gameState.players.home[i], this.gameState.players.home[j]);
      }
    }
    for (let i = 0; i < this.gameState.players.away.length; i++) {
      for (let j = i + 1; j < this.gameState.players.away.length; j++) {
        this.resolveCollision(this.gameState.players.away[i], this.gameState.players.away[j]);
      }
    }

    for (let player of allPlayers) {
      if (player.team !== ball.heldBy?.team) {
        const dx = ball.x - player.x;
        const dy = ball.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < ball.radius + player.radius && ball.state === 'flying') {
          const hoop = player.team === 'home' ? this.gameState.hoops.right : this.gameState.hoops.left;
          const passTarget = {
            x: hoop.x + (Math.random() - 0.5) * 100,
            y: hoop.y + (Math.random() - 0.5) * 50
          };

          ball.velocity = {
            x: (passTarget.x - ball.x) * 0.1,
            y: (passTarget.y - ball.y) * 0.1,
            z: 3
          };
          ball.state = 'flying';
        }
      }
    }
  }

  resolveCollision(p1, p2) {
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

  scoreBasket(team) {
    if (team === 'home') {
      this.gameState.score.home += 3;
    } else {
      this.gameState.score.away += 3;
    }

    this.gameState.ball.state = 'scored';
    this.gameState.ball.hasScored = true;

    setTimeout(() => this.resetAfterScore(), 1500);
  }

  resetAfterScore() {
    const court = this.gameState.court;

    this.gameState.ball.x = court.centerX;
    this.gameState.ball.y = court.centerY;
    this.gameState.ball.z = 0;
    this.gameState.ball.vx = 0;
    this.gameState.ball.vy = 0;
    this.gameState.ball.vz = 0;
    this.gameState.ball.state = 'idle';
    this.gameState.ball.hasScored = false;
    this.gameState.ball.rotation = 0;

    const newPossession = this.gameState.possession === 'home' ? 'away' : 'home';
    this.gameState.possession = newPossession;

    const receivingTeam = this.gameState.players[newPossession];
    this.gameState.ball.heldBy = receivingTeam[0];
    this.gameState.ball.heldBy.hasBall = true;
    this.gameState.ball.state = 'held';

    this.gameState.shotClock = 24;

    for (let player of [...this.gameState.players.home, ...this.gameState.players.away]) {
      player.vx = 0;
      player.vy = 0;
    }
  }

  turnover() {
    const newPossession = this.gameState.possession === 'home' ? 'away' : 'home';
    this.gameState.possession = newPossession;
    this.gameState.shotClock = 24;

    this.gameState.ball.x = this.gameState.court.centerX;
    this.gameState.ball.y = this.gameState.court.centerY;
    this.gameState.ball.z = 0;
    this.gameState.ball.vx = 0;
    this.gameState.ball.vy = 0;
    this.gameState.ball.vz = 0;
    this.gameState.ball.state = 'idle';
    this.gameState.ball.hasScored = false;

    const receivingTeam = this.gameState.players[newPossession];
    this.gameState.ball.heldBy = receivingTeam[0];
    this.gameState.ball.heldBy.hasBall = true;
    this.gameState.ball.state = 'held';
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawCourt(ctx);
    this.drawHoops(ctx);
    this.drawPlayers(ctx);
    this.drawBall(ctx);
    this.drawShotIndicator(ctx);
    this.drawHUD(ctx);

    if (this.gameState.status === 'paused') {
      this.drawPauseScreen(ctx);
    }
  }

  drawCourt(ctx) {
    const court = this.gameState.court;

    ctx.fillStyle = '#d4a574';
    ctx.fillRect(0, 0, court.width, court.height);

    ctx.fillStyle = '#c9956c';
    ctx.fillRect(0, 0, court.width, court.height);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;

    ctx.strokeRect(30, 30, court.width - 60, court.height - 60);

    ctx.beginPath();
    ctx.moveTo(court.centerX, 30);
    ctx.lineTo(court.centerX, court.height - 30);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(court.centerX, court.centerY, 60, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.arc(court.centerX, court.centerY, 60, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(court.centerX, court.centerY, 60, Math.PI / 2, Math.PI * 1.5);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(120, 30);
    ctx.lineTo(120, court.height - 30);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(court.width - 120, 30);
    ctx.lineTo(court.width - 120, court.height - 30);
    ctx.stroke();

    ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
    ctx.fillRect(30, court.centerY - 70, 90, 140);

    ctx.fillStyle = 'rgba(155, 89, 182, 0.3)';
    ctx.fillRect(court.width - 120, court.centerY - 70, 90, 140);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(30, 30, 5, court.height - 60);
    ctx.fillRect(court.width - 35, 30, 5, court.height - 60);
  }

  drawHoops(ctx) {
    this.drawHoop(ctx, this.gameState.hoops.left, '#2ecc71');
    this.drawHoop(ctx, this.gameState.hoops.right, '#9b59b6');
  }

  drawHoop(ctx, hoop, color) {
    ctx.fillStyle = '#333';
    ctx.fillRect(hoop.backboard.x, hoop.backboard.y, hoop.backboard.width, hoop.backboard.height);

    ctx.fillStyle = 'white';
    ctx.fillRect(hoop.backboard.x + 2, hoop.backboard.y + 20, 6, 80);

    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(hoop.backboard.x + hoop.backboard.width, hoop.y);
    ctx.lineTo(hoop.backboard.x + hoop.backboard.width + 40, hoop.y);
    ctx.stroke();

    ctx.strokeStyle = '#ff6b00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(hoop.x, hoop.y, hoop.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 107, 0, 0.3)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(hoop.x, hoop.y, hoop.radius + 5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(hoop.post.x, hoop.post.y);
    ctx.lineTo(hoop.post.x, hoop.y - 30);
    ctx.stroke();

    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(hoop.post.x, hoop.post.y + 40, 15, 0, Math.PI * 2);
    ctx.fill();
  }

  drawPlayers(ctx) {
    for (let player of this.gameState.players.home) {
      this.drawPlayer(ctx, player, true);
    }
    for (let player of this.gameState.players.away) {
      this.drawPlayer(ctx, player, false);
    }
  }

  drawPlayer(ctx, player, isHome) {
    ctx.save();

    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 2, 0, Math.PI * 2);
    ctx.fillStyle = isHome ? 'rgba(46, 204, 113, 0.3)' : 'rgba(155, 89, 182, 0.3)';
    ctx.fill();

    const gradient = ctx.createRadialGradient(
      player.x - 3, player.y - 3, 0,
      player.x, player.y, player.radius
    );
    gradient.addColorStop(0, this.lightenColor(player.color, 40));
    gradient.addColorStop(1, player.color);

    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.number.toString(), player.x, player.y);

    if (player.hasBall) {
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawBall(ctx) {
    const ball = this.gameState.ball;

    ctx.save();

    const shadowY = ball.z < ball.radius ? ball.z : ball.radius;

    ctx.beginPath();
    ctx.ellipse(ball.x, ball.y + (ball.radius - shadowY), ball.radius, ball.radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fill();

    ctx.translate(ball.x, ball.y - (ball.z - ball.radius));
    ctx.rotate(ball.rotation);

    const gradient = ctx.createRadialGradient(-4, -4, 0, 0, 0, ball.radius);
    gradient.addColorStop(0, '#ff8c00');
    gradient.addColorStop(1, ball.color);

    ctx.beginPath();
    ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(-ball.radius * 0.8, 0);
    ctx.lineTo(ball.radius * 0.8, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -ball.radius * 0.8);
    ctx.lineTo(0, ball.radius * 0.8);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, ball.radius * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  drawShotIndicator(ctx) {
    if (!this.shooting || !this.gameState.ball.heldBy) return;

    const ball = this.gameState.ball;
    const centerX = ball.x;
    const centerY = ball.y - 50;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(centerX - 60, centerY - 30, 120, 60);

    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Shoot Power', centerX, centerY - 15);

    ctx.fillStyle = '#333';
    ctx.fillRect(centerX - 50, centerY, 100, 15);

    const powerPercent = this.shootPower / 100;
    const powerColor = powerPercent < 0.5 ? '#2ecc71' : (powerPercent < 0.8 ? '#f1c40f' : '#e74c3c');

    ctx.fillStyle = powerColor;
    ctx.fillRect(centerX - 50, centerY, 100 * powerPercent, 15);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeRect(centerX - 50, centerY, 100, 15);

    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText(`${Math.floor(this.shootPower)}%`, centerX, centerY + 30);
  }

  drawHUD(ctx) {
    const court = this.gameState.court;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, court.width, 60);
    ctx.fillRect(0, court.height - 40, court.width, 40);

    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(this.gameState.score.home.toString(), 40, 40);

    ctx.fillStyle = '#9b59b6';
    ctx.fillText(this.gameState.score.away.toString(), court.width - 60, 40);

    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('-', court.centerX, 40);

    const time = Math.floor(this.gameState.gameTime / 1000);
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    ctx.font = '18px Arial';
    ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, court.centerX, 58);

    ctx.fillStyle = this.gameState.quarter === 1 ? '#3498db' : (this.gameState.quarter === 2 ? '#e67e22' : '#9b59b6');
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`Q${this.gameState.quarter}`, 80, 25);

    ctx.fillStyle = this.gameState.possession === 'home' ? '#2ecc71' : '#9b59b6';
    ctx.beginPath();
    ctx.arc(court.width - 80, 30, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Shot Clock: ${Math.ceil(this.gameState.shotClock)}`, court.width - 100, 30);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('WASD - Move | Hold Click - Charge Shot | Release - Shoot', court.centerX, court.height - 20);
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
      quarter: this.gameState.quarter,
      status: this.gameState.status
    };
  }
}

window.BasketballGame = BasketballGame;