// Tennis Open - Tennis Game with Serves and Volleys
class TennisGame {
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
      score: { player1: 0, player2: 0 },
      games: { player1: 0, player2: 0 },
      sets: { player1: 0, player2: 0 },
      status: 'serving',
      server: 1,
      ball: null,
      players: { player1: null, player2: null },
      court: { width: 0, height: 0, centerX: 0, centerY: 0 },
      gameTime: 0,
      currentPoint: 0,
      pointWinner: null,
      rallyCount: 0,
      serveNumber: 1,
      doubleFault: false,
      firstServeIn: true,
      isTiebreak: false,
      tiebreakScore: { p1: 0, p2: 0 }
    };

    this.keys = {};
    this.mouse = { x: 0, y: 0, pressed: false };
    this.servePower = 0;
    this.isChargingServe = false;
    this.serveAngle = 0;

    this.initGame();
    this.setupControls();
  }

  resizeCanvas() {
    const parent = this.canvas.parentElement;
    this.canvas.width = parent.clientWidth || 900;
    this.canvas.height = parent.clientHeight || 700;
  }

  setupControls() {
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.pressed = true;

      if (this.gameState.status === 'serving') {
        this.isChargingServe = true;
        this.servePower = 0;
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;

      const server = this.gameState.players.player1;
      if (server && this.gameState.status === 'serving') {
        this.serveAngle = Math.atan2(this.mouse.y - server.y, this.mouse.x - server.x);
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.pressed = false;

      if (this.isChargingServe) {
        this.serve();
      }
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
    if (this.gameState.status === 'playing' || this.gameState.status === 'serving') {
      this.gameState.status = 'paused';
    } else if (this.gameState.status === 'paused') {
      this.gameState.status = 'serving';
    }
  }

  serve() {
    if (!this.isChargingServe) return;

    const server = this.gameState.server === 1 ?
      this.gameState.players.player1 : this.gameState.players.player2;

    const ball = this.gameState.ball;
    ball.x = server.x + 20;
    ball.y = server.y;
    ball.z = 60;

    const power = Math.min(this.servePower, 100) / 100;
    const serveSpeed = 12 + power * 8;

    const targetY = this.gameState.court.height * 0.15;

    ball.velocity = {
      x: (this.mouse.x - ball.x) * 0.08,
      y: (targetY - ball.y) * 0.08,
      z: serveSpeed
    };

    ball.state = 'flying';
    this.gameState.status = 'playing';
    this.gameState.rallyCount = 0;
    this.isChargingServe = false;
    this.servePower = 0;

    if (this.gameState.serveNumber === 2) {
      this.gameState.firstServeIn = false;
    }
  }

  initGame() {
    const court = this.gameState.court;
    court.width = this.canvas.width;
    court.height = this.canvas.height;
    court.centerX = this.canvas.width / 2;
    court.centerY = this.canvas.height / 2;

    this.gameState.players.player1 = {
      x: court.centerX - 50,
      y: court.height - 100,
      vx: 0,
      vy: 0,
      radius: 18,
      speed: 5,
      acceleration: 0.7,
      color: '#3498db',
      name: this.players[0]?.name || 'Player',
      hand: 'right',
      ready: true,
      swingState: 'idle',
      swingTimer: 0
    };

    this.gameState.players.player2 = {
      x: court.centerX + 50,
      y: 100,
      vx: 0,
      vy: 0,
      radius: 18,
      speed: 4.8,
      acceleration: 0.65,
      color: '#e74c3c',
      name: this.players[1]?.name || 'CPU',
      hand: 'left',
      cpu: true,
      ready: true,
      swingState: 'idle',
      swingTimer: 0
    };

    this.gameState.ball = {
      x: court.centerX,
      y: court.height - 50,
      z: 40,
      vx: 0,
      vy: 0,
      vz: 0,
      radius: 8,
      color: '#fff',
      state: 'idle',
      velocity: null,
      rotation: 0,
      lastBounce: null,
      bounces: 0
    };
  }

  update(deltaTime) {
    if (this.gameState.status !== 'playing' && this.gameState.status !== 'serving') return;

    this.gameState.gameTime += deltaTime;

    if (this.gameState.status === 'serving' && this.isChargingServe) {
      this.servePower = Math.min(this.servePower + deltaTime / 10, 100);
    }

    this.updateBall(deltaTime);
    this.updatePlayers(deltaTime);
    this.checkCollisions();
    this.updateCPU(deltaTime);
  }

  updateBall(deltaTime) {
    const ball = this.gameState.ball;
    const court = this.gameState.court;

    if (ball.state === 'flying') {
      const vel = ball.velocity;

      ball.x += vel.x;
      ball.y += vel.y;
      ball.z += vel.z;

      vel.z *= 0.99;
      vel.x *= 0.995;
      vel.y *= 0.995;

      ball.rotation += 0.15;

      if (ball.z <= ball.radius && ball.state === 'flying') {
        const baselineTop = court.height * 0.15;
        const baselineBottom = court.height * 0.85;

        if (ball.y > baselineTop && ball.y < baselineBottom) {
          ball.bounces++;

          if (ball.bounces > 1 && this.gameState.currentPoint === 0) {
            if (this.gameState.serveNumber === 1) {
              this.gameState.serveNumber = 2;
              this.gameState.status = 'serving';
              this.resetServe();
            } else {
              this.scorePoint(this.gameState.server === 1 ? 2 : 1);
            }
          } else if (ball.bounces > 2) {
            const returner = this.gameState.server === 1 ? 2 : 1;
            this.scorePoint(returner);
          }

          vel.z = -vel.z * 0.7;
          ball.z = ball.radius;
          ball.lastBounce = { x: ball.x, y: ball.y };
        } else {
          if (this.gameState.serveNumber === 1) {
            this.gameState.serveNumber = 2;
            this.gameState.status = 'serving';
            this.resetServe();
          } else {
            this.scorePoint(this.gameState.server === 1 ? 2 : 1);
          }
        }
      }

      if (ball.x < 0 || ball.x > court.width || ball.y < 0 || ball.y > court.height) {
        const returner = this.gameState.server === 1 ? 2 : 1;
        this.scorePoint(returner);
      }
    }
  }

  resetServe() {
    const ball = this.gameState.ball;
    const server = this.gameState.server === 1 ?
      this.gameState.players.player1 : this.gameState.players.player2;

    ball.x = server.x + 20;
    ball.y = server.y;
    ball.z = 40;
    ball.vx = 0;
    ball.vy = 0;
    ball.vz = 0;
    ball.state = 'idle';
    ball.velocity = null;
    ball.bounces = 0;
    ball.lastBounce = null;
  }

  updatePlayers(deltaTime) {
    const player = this.gameState.players.player1;

    if (this.keys['w']) player.vy -= player.acceleration;
    if (this.keys['s']) player.vy += player.acceleration;
    if (this.keys['a']) player.vx -= player.acceleration;
    if (this.keys['d']) player.vx += player.acceleration;

    player.vx *= 0.9;
    player.vy *= 0.9;

    const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
    if (speed > player.speed) {
      const ratio = player.speed / speed;
      player.vx *= ratio;
      player.vy *= ratio;
    }

    player.x += player.vx;
    player.y += player.vy;

    this.constrainPlayer(player);
  }

  constrainPlayer(player) {
    const court = this.gameState.court;
    const margin = 30;

    if (player.x - player.radius < court.centerX - 150) {
      player.x = court.centerX - 150 + player.radius;
      player.vx = 0;
    }
    if (player.x + player.radius > court.centerX + 150) {
      player.x = court.centerX + 150 - player.radius;
      player.vx = 0;
    }

    const playerArea = player === this.gameState.players.player1 ?
      { min: court.height * 0.5, max: court.height - 30 } :
      { min: 30, max: court.height * 0.5 };

    if (player.y - player.radius < playerArea.min) {
      player.y = playerArea.min + player.radius;
      player.vy = 0;
    }
    if (player.y + player.radius > playerArea.max) {
      player.y = playerArea.max - player.radius;
      player.vy = 0;
    }
  }

  updateCPU(deltaTime) {
    const cpu = this.gameState.players.player2;
    const ball = this.gameState.ball;
    const court = this.gameState.court;

    if (ball.state === 'flying' && ball.velocity.z < 0) {
      const predicted = this.predictBallLanding();

      if (predicted) {
        const targetX = predicted.x + (Math.random() - 0.5) * 30;
        const targetY = predicted.y + 30;

        const dx = targetX - cpu.x;
        const dy = targetY - cpu.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 10) {
          cpu.vx += (dx / dist) * cpu.acceleration * 0.8;
          cpu.vy += (dy / dist) * cpu.acceleration * 0.8;
        }

        const distToBall = Math.sqrt(
          Math.pow(ball.x - cpu.x, 2) +
          Math.pow(ball.y - cpu.y, 2)
        );

        if (distToBall < 80 && ball.z < 50) {
          if (Math.random() < 0.05) {
            this.cpuReturn(cpu);
          }
        }
      }
    } else {
      const targetX = court.centerX + (Math.random() - 0.5) * 50;
      const targetY = 150;

      const dx = targetX - cpu.x;
      const dy = targetY - cpu.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 20) {
        cpu.vx += (dx / dist) * cpu.acceleration * 0.3;
        cpu.vy += (dy / dist) * cpu.acceleration * 0.3;
      }
    }

    cpu.vx *= 0.9;
    cpu.vy *= 0.9;

    const maxSpeed = cpu.speed * 0.85;
    const speed = Math.sqrt(cpu.vx * cpu.vx + cpu.vy * cpu.vy);
    if (speed > maxSpeed) {
      const ratio = maxSpeed / speed;
      cpu.vx *= ratio;
      cpu.vy *= ratio;
    }

    cpu.x += cpu.vx;
    cpu.y += cpu.vy;

    this.constrainPlayer(cpu);
  }

  predictBallLanding() {
    const ball = this.gameState.ball;
    const vel = ball.velocity;

    if (vel.z <= 0) return null;

    const steps = Math.ceil(vel.z / 0.5);
    let x = ball.x;
    let y = ball.y;
    let z = ball.z;

    for (let i = 0; i < steps * 2; i++) {
      x += vel.x * 0.5;
      y += vel.y * 0.5;
      z += vel.z * 0.5;
      vel.z -= 0.4;

      if (z <= ball.radius) {
        return { x, y };
      }
    }

    return null;
  }

  checkCollisions() {
    const ball = this.gameState.ball;
    if (ball.state !== 'flying' || ball.velocity.z > 0) return;

    const player1 = this.gameState.players.player1;
    const player2 = this.gameState.players.player2;

    for (let player of [player1, player2]) {
      const dx = ball.x - player.x;
      const dy = ball.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < player.radius + ball.radius + 10 && ball.z < 60) {
        this.hitBall(player, ball);
        break;
      }
    }
  }

  hitBall(player, ball) {
    const target = player === this.gameState.players.player1 ?
      this.gameState.players.player2 : this.gameState.players.player1;

    const targetX = target.x + (Math.random() - 0.5) * 80;
    const targetY = target.y + (Math.random() - 0.5) * 60;

    const dx = targetX - ball.x;
    const dy = targetY - ball.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const power = 8 + Math.random() * 6;
    const height = 15 + Math.random() * 10;

    ball.velocity = {
      x: (dx / dist) * power * (0.8 + Math.random() * 0.4),
      y: (dy / dist) * power * (0.8 + Math.random() * 0.4),
      z: height
    };

    ball.bounces = 0;
    this.gameState.rallyCount++;

    player.swingState = 'swinging';
    player.swingTimer = 200;
  }

  cpuReturn(cpu) {
    const ball = this.gameState.ball;
    const player = this.gameState.players.player1;

    const targetX = player.x + (Math.random() - 0.5) * 100;
    const targetY = player.y + (Math.random() - 0.5) * 80;

    const dx = targetX - ball.x;
    const dy = targetY - ball.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const power = 10 + Math.random() * 5;

    ball.velocity = {
      x: (dx / dist) * power,
      y: (dy / dist) * power,
      z: 18 + Math.random() * 8
    };

    ball.bounces = 0;
    this.gameState.rallyCount++;

    cpu.swingState = 'swinging';
    cpu.swingTimer = 200;
  }

  scorePoint(winner) {
    const scores = ['0', '15', '30', '40', 'game'];
    const advantages = ['0', '15', '30', 'adv'];

    if (this.gameState.isTiebreak) {
      if (winner === 1) {
        this.gameState.tiebreakScore.p1++;
      } else {
        this.gameState.tiebreakScore.p2++;
      }

      if ((this.gameState.tiebreakScore.p1 >= 7 && this.gameState.tiebreakScore.p1 - this.gameState.tiebreakScore.p2 >= 2) ||
          (this.gameState.tiebreakScore.p2 >= 7 && this.gameState.tiebreakScore.p2 - this.gameState.tiebreakScore.p1 >= 2)) {
        this.endTiebreak(winner);
      } else {
        this.resetPoint(winner === 1 ? 2 : 1);
      }
    } else {
      if (winner === 1) {
        const currentScore = this.gameState.score.player1;
        this.gameState.score.player1 = Math.min(4, currentScore + 1);
      } else {
        const currentScore = this.gameState.score.player2;
        this.gameState.score.player2 = Math.min(4, currentScore + 1);
      }

      const p1Score = this.gameState.score.player1;
      const p2Score = this.gameState.score.player2;

      if ((p1Score >= 4 && p1Score - p2Score >= 2) || (p2Score >= 4 && p2Score - p1Score >= 2)) {
        this.winGame(winner);
      } else if (p1Score === 3 && p2Score === 3) {
        this.gameState.isTiebreak = true;
        this.gameState.score.player1 = 0;
        this.gameState.score.player2 = 0;
        this.resetPoint(this.gameState.server);
      } else {
        this.resetPoint(winner === 1 ? 2 : 1);
      }
    }
  }

  endTiebreak(winner) {
    if (winner === 1) {
      this.gameState.games.player1++;
    } else {
      this.gameState.games.player2++;
    }

    this.gameState.isTiebreak = false;
    this.gameState.tiebreakScore = { p1: 0, p2: 0 };

    if ((this.gameState.games.player1 >= 6 && this.gameState.games.player1 - this.gameState.games.player2 >= 2) ||
        (this.gameState.games.player2 >= 6 && this.gameState.games.player2 - this.gameState.games.player1 >= 2)) {
      this.winSet(winner);
    } else {
      this.gameState.server = winner;
      this.resetPoint(winner);
    }
  }

  winGame(winner) {
    if (winner === 1) {
      this.gameState.games.player1++;
    } else {
      this.gameState.games.player2++;
    }

    this.gameState.score = { player1: 0, player2: 0 };

    if ((this.gameState.games.player1 >= 6 && this.gameState.games.player1 - this.gameState.games.player2 >= 2) ||
        (this.gameState.games.player1 === 7 && this.gameState.games.player2 === 6) ||
        (this.gameState.games.player2 === 7 && this.gameState.games.player1 === 6)) {
      this.winSet(winner);
    } else {
      this.gameState.server = winner;
      this.resetPoint(winner);
    }
  }

  winSet(winner) {
    if (winner === 1) {
      this.gameState.sets.player1++;
    } else {
      this.gameState.sets.player2++;
    }

    this.gameState.games = { player1: 0, player2: 0 };
    this.gameState.score = { player1: 0, player2: 0 };

    this.gameState.server = winner === 1 ? 2 : 1;
    this.resetPoint(this.gameState.server);
  }

  resetPoint(server) {
    const ball = this.gameState.ball;
    const serverPlayer = server === 1 ?
      this.gameState.players.player1 : this.gameState.players.player2;

    ball.x = serverPlayer.x + 20;
    ball.y = serverPlayer.y;
    ball.z = 40;
    ball.vx = 0;
    ball.vy = 0;
    ball.vz = 0;
    ball.state = 'idle';
    ball.velocity = null;
    ball.bounces = 0;
    ball.lastBounce = null;

    this.gameState.status = 'serving';
    this.gameState.serveNumber = 1;
    this.gameState.gameTime = 0;

    this.gameState.players.player1.x = this.gameState.court.centerX - 50;
    this.gameState.players.player1.y = this.gameState.court.height - 100;
    this.gameState.players.player1.vx = 0;
    this.gameState.players.player1.vy = 0;

    this.gameState.players.player2.x = this.gameState.court.centerX + 50;
    this.gameState.players.player2.y = 100;
    this.gameState.players.player2.vx = 0;
    this.gameState.players.player2.vy = 0;
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawCourt(ctx);
    this.drawNet(ctx);
    this.drawPlayers(ctx);
    this.drawBall(ctx);
    this.drawServeIndicator(ctx);
    this.drawHUD(ctx);

    if (this.gameState.status === 'paused') {
      this.drawPauseScreen(ctx);
    }
  }

  drawCourt(ctx) {
    const court = this.gameState.court;

    ctx.fillStyle = '#8bc34a';
    ctx.fillRect(0, 0, court.width, court.height);

    ctx.fillStyle = '#689f38';
    ctx.fillRect(court.centerX - 200, 0, 400, court.height);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;

    ctx.strokeRect(50, court.height * 0.1, court.width - 100, court.height * 0.8);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(50, court.height / 2);
    ctx.lineTo(court.width - 50, court.height / 2);
    ctx.stroke();

    ctx.strokeRect(50, court.height * 0.25, court.width - 100, court.height * 0.5);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.moveTo(court.centerX, court.height * 0.1);
    ctx.lineTo(court.centerX - 80, court.height * 0.25);
    ctx.lineTo(court.centerX + 80, court.height * 0.25);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(court.centerX, court.height * 0.9);
    ctx.lineTo(court.centerX - 80, court.height * 0.75);
    ctx.lineTo(court.centerX + 80, court.height * 0.75);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;

    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(50 + i * 90, court.height * 0.1);
      ctx.lineTo(50 + i * 90, court.height * 0.9);
      ctx.stroke();
    }
  }

  drawNet(ctx) {
    const court = this.gameState.court;
    const netY = court.height / 2;
    const netHeight = 40;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(50, netY - netHeight / 2, court.width - 100, netHeight);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(50, netY - netHeight / 2);
    ctx.lineTo(court.width - 50, netY - netHeight / 2);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, netY + netHeight / 2);
    ctx.lineTo(court.width - 50, netY + netHeight / 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;

    for (let x = 60; x < court.width - 50; x += 15) {
      ctx.beginPath();
      ctx.moveTo(x, netY - netHeight / 2);
      ctx.lineTo(x, netY + netHeight / 2);
      ctx.stroke();
    }

    for (let y = netY - netHeight / 2; y < netY + netHeight / 2; y += 8) {
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(court.width - 50, y);
      ctx.stroke();
    }
  }

  drawPlayers(ctx) {
    this.drawPlayer(ctx, this.gameState.players.player1, true);
    this.drawPlayer(ctx, this.gameState.players.player2, false);
  }

  drawPlayer(ctx, player, isPlayer) {
    ctx.save();

    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 3, 0, Math.PI * 2);
    ctx.fillStyle = isPlayer ? 'rgba(52, 152, 219, 0.3)' : 'rgba(231, 76, 60, 0.3)';
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
    ctx.fillText(isPlayer ? 'P1' : 'CPU', player.x, player.y);

    ctx.strokeStyle = player.color;
    ctx.lineWidth = 3;

    if (player.swingState === 'swinging') {
      const swingAngle = Math.sin(player.swingTimer / 200 * Math.PI) * 1.2;
      ctx.save();
      ctx.translate(player.x + 15, player.y);
      ctx.rotate(player.hand === 'right' ? -swingAngle : swingAngle);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(30, -15);
      ctx.stroke();

      ctx.restore();

      player.swingTimer -= 16;
      if (player.swingTimer <= 0) {
        player.swingState = 'idle';
      }
    } else {
      ctx.save();
      ctx.translate(player.x + 15, player.y);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(25, -10);
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }

  drawBall(ctx) {
    const ball = this.gameState.ball;

    ctx.save();

    const shadowOffset = ball.z / 10;
    ctx.beginPath();
    ctx.ellipse(ball.x, ball.y + shadowOffset, ball.radius, ball.radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fill();

    ctx.translate(ball.x, ball.y - ball.z / 5);
    ctx.rotate(ball.rotation);

    const gradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, ball.radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#cccccc');

    ctx.beginPath();
    ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-ball.radius * 0.7, 0);
    ctx.lineTo(ball.radius * 0.7, 0);
    ctx.stroke();

    ctx.restore();
  }

  drawServeIndicator(ctx) {
    if (!this.isChargingServe) return;

    const player = this.gameState.players.player1;
    const centerX = player.x;
    const centerY = player.y - 60;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(centerX - 50, centerY - 35, 100, 50);

    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Serve Power', centerX, centerY - 18);

    ctx.fillStyle = '#333';
    ctx.fillRect(centerX - 40, centerY - 5, 80, 12);

    const powerPercent = this.servePower / 100;
    const powerColor = powerPercent < 0.5 ? '#2ecc71' : (powerPercent < 0.8 ? '#f1c40f' : '#e74c3c');

    ctx.fillStyle = powerColor;
    ctx.fillRect(centerX - 40, centerY - 5, 80 * powerPercent, 12);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeRect(centerX - 40, centerY - 5, 80, 12);

    ctx.fillStyle = 'white';
    ctx.font = '11px Arial';
    ctx.fillText(`${Math.floor(this.servePower)}%`, centerX, centerY + 15);
  }

  drawHUD(ctx) {
    const court = this.gameState.court;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, court.width, 45);
    ctx.fillRect(0, court.height - 35, court.width, 35);

    ctx.fillStyle = '#3498db';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'left';
    const p1Display = this.gameState.isTiebreak ?
      this.gameState.tiebreakScore.p1 :
      ['0', '15', '30', '40'][this.gameState.score.player1] || 'G';
    ctx.fillText(`P1: ${p1Display}`, 20, 30);

    ctx.fillStyle = '#e74c3c';
    ctx.fillText(`CPU: ${p1Display}`, 20, 58);

    const scoreMap = ['0', '15', '30', '40'];
    const p2Display = this.gameState.isTiebreak ?
      this.gameState.tiebreakScore.p2 :
      scoreMap[this.gameState.score.player2] || 'G';
    ctx.fillText(`CPU: ${p2Display}`, court.width - 100, 30);

    ctx.fillStyle = '#f39c12';
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px Arial';

    if (this.gameState.isTiebreak) {
      ctx.fillText(`Tiebreak: ${this.gameState.tiebreakScore.p1}-${this.gameState.tiebreakScore.p2}`, court.centerX, 30);
    } else {
      ctx.fillText(`Games: ${this.gameState.games.player1}-${this.gameState.games.player2}`, court.width / 2, 30);
    }

    ctx.fillStyle = this.gameState.server === 1 ? '#3498db' : '#e74c3c';
    ctx.fillText(this.gameState.server === 1 ? 'Player Serving' : 'CPU Serving', court.centerX, 50);

    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Rally: ${this.gameState.rallyCount} | Serve: ${this.gameState.serveNumber}`, court.centerX, court.height - 18);

    ctx.textAlign = 'left';
    ctx.fillText('WASD - Move | Click & Hold - Charge Serve | Release - Serve', 20, court.height - 8);
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
      games: this.gameState.games,
      sets: this.gameState.sets,
      status: this.gameState.status
    };
  }
}

window.TennisGame = TennisGame;