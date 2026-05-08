// Volleyball Beach - Beach Volleyball Game
class VolleyballGame {
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
      score: { team1: 0, team2: 0 },
      sets: { team1: 0, team2: 0 },
      status: 'serving',
      servingTeam: 1,
      ball: null,
      players: { team1: [], team2: [] },
      net: null,
      beach: { width: 0, height: 0 },
      gameTime: 0,
      rallyCount: 0,
      currentTouch: 0,
      rotation: 0,
      inPlay: false,
      setPoint: false,
      matchPoint: false,
      serving: false
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
    if (this.gameState.status === 'playing' || this.gameState.status === 'serving') {
      this.gameState.status = 'paused';
    } else if (this.gameState.status === 'paused') {
      this.gameState.status = this.gameState.serving ? 'serving' : 'playing';
    }
  }

  serve() {
    const ball = this.gameState.ball;
    const team = this.gameState.servingTeam === 1 ?
      this.gameState.players.team1[0] : this.gameState.players.team2[0];

    ball.x = team.x;
    ball.y = team.y - 30;
    ball.z = 50;

    const targetX = this.gameState.servingTeam === 1 ?
      this.gameState.beach.width * 0.75 : this.gameState.beach.width * 0.25;
    const targetY = this.gameState.beach.height * 0.5;

    const dx = targetX - ball.x;
    const dy = targetY - ball.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    ball.velocity = {
      x: (dx / dist) * 10,
      y: (dy / dist) * 8,
      z: 12
    };

    ball.state = 'flying';
    this.gameState.inPlay = true;
    this.gameState.rallyCount = 0;
    this.gameState.currentTouch = 0;
  }

  initGame() {
    const beach = this.gameState.beach;
    beach.width = this.canvas.width;
    beach.height = this.canvas.height;

    this.gameState.net = {
      x: beach.width / 2,
      y: 200,
      height: 120,
      width: 10
    };

    const leftTeam = [
      { x: beach.width * 0.25, y: beach.height * 0.6 },
      { x: beach.width * 0.35, y: beach.height * 0.7 }
    ];

    const rightTeam = [
      { x: beach.width * 0.75, y: beach.height * 0.6 },
      { x: beach.width * 0.65, y: beach.height * 0.7 }
    ];

    this.gameState.players.team1 = leftTeam.map((pos, i) => ({
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      radius: 18,
      speed: 4.5,
      color: '#e74c3c',
      name: this.players[i]?.name || `Player ${i + 1}`,
      number: i + 1,
      team: 1,
      ready: true
    }));

    this.gameState.players.team2 = rightTeam.map((pos, i) => ({
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      radius: 18,
      speed: 4.2,
      color: '#3498db',
      name: this.players[i + 2]?.name || `CPU ${i + 1}`,
      number: i + 1,
      team: 2,
      cpu: true,
      ready: true
    }));

    this.gameState.ball = {
      x: beach.width * 0.25,
      y: beach.height * 0.6 - 30,
      z: 40,
      vx: 0,
      vy: 0,
      vz: 0,
      radius: 14,
      color: '#fff',
      state: 'idle',
      velocity: null,
      rotation: 0
    };
  }

  update(deltaTime) {
    if (this.gameState.status === 'paused') return;

    this.gameState.gameTime += deltaTime;

    if (this.gameState.status === 'serving' && !this.gameState.serving) {
      this.gameState.serving = true;
      setTimeout(() => this.serve(), 1500);
    }

    if (this.gameState.status === 'playing') {
      this.updateBall(deltaTime);
      this.updatePlayers(deltaTime);
      this.checkNetCollision();
      this.checkPlayerHit();
      this.updateCPU(deltaTime);
    }
  }

  updateBall(deltaTime) {
    const ball = this.gameState.ball;
    const beach = this.gameState.beach;
    const net = this.gameState.net;

    if (ball.state !== 'flying') return;

    const vel = ball.velocity;

    ball.x += vel.x;
    ball.y += vel.y;
    ball.z += vel.z;

    vel.z -= 0.25;
    vel.y += 0.1;

    ball.rotation += 0.1;

    if (ball.z <= ball.radius && ball.state === 'flying') {
      const inLeftCourt = ball.x < beach.width / 2 && ball.y > 150 && ball.y < beach.height - 30;
      const inRightCourt = ball.x > beach.width / 2 && ball.y > 150 && ball.y < beach.height - 30;

      if (inLeftCourt || inRightCourt) {
        const servingTeam = this.gameState.servingTeam;
        const inWrongCourt = (servingTeam === 1 && inRightCourt) || (servingTeam === 2 && inLeftCourt);

        if (inWrongCourt || this.gameState.rallyCount < 1) {
          this.scorePoint(servingTeam === 1 ? 2 : 1);
        } else {
          vel.z = -vel.z * 0.6;
          ball.z = ball.radius;
          ball.state = 'bouncing';

          setTimeout(() => this.scorePoint(servingTeam === 1 ? 2 : 1), 500);
        }
      } else {
        this.scorePoint(this.gameState.servingTeam === 1 ? 2 : 1);
      }
    }

    if (ball.x < 0 || ball.x > beach.width || ball.y < 0 || ball.y > beach.height ||
        ball.z > 200 || ball.z < -10) {
      this.scorePoint(this.gameState.servingTeam === 1 ? 2 : 1);
    }
  }

  checkNetCollision() {
    const ball = this.gameState.ball;
    const net = this.gameState.net;

    if (ball.state !== 'flying') return;

    const netLeft = net.x - net.width / 2 - ball.radius;
    const netRight = net.x + net.width / 2 + ball.radius;
    const netTop = net.y;
    const netBottom = net.y + net.height;

    if (ball.x > netLeft && ball.x < netRight && ball.y > netTop && ball.y < netBottom) {
      if (ball.z < 100) {
        if (ball.x < net.x) {
          ball.x = netLeft - ball.radius;
          ball.velocity.x *= -0.8;
        } else {
          ball.x = netRight + ball.radius;
          ball.velocity.x *= -0.8;
        }
      }
    }

    if (ball.y > netBottom && ball.y < netBottom + 20 && ball.x > netLeft && ball.x < netRight) {
      ball.velocity.y *= -0.7;
      ball.y = netBottom + 20;
    }
  }

  checkPlayerHit() {
    const ball = this.gameState.ball;

    if (ball.state !== 'flying' || ball.velocity.z < 0) return;

    const allPlayers = [...this.gameState.players.team1, ...this.gameState.players.team2];

    for (let player of allPlayers) {
      const dx = ball.x - player.x;
      const dy = ball.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < player.radius + ball.radius + 15 && ball.z < 80) {
        this.hitBall(player);
        break;
      }
    }
  }

  hitBall(player) {
    const ball = this.gameState.ball;
    const team = player.team;
    const opposingTeam = team === 1 ? 2 : 1;

    const opponents = this.gameState.players[`team${opposingTeam}`];
    const targetPlayer = opponents[Math.floor(Math.random() * opponents.length)];

    const targetX = targetPlayer.x + (Math.random() - 0.5) * 80;
    const targetY = targetPlayer.y + (Math.random() - 0.5) * 60;

    const dx = targetX - ball.x;
    const dy = targetY - ball.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const power = 10 + Math.random() * 5;
    const height = 12 + Math.random() * 8;

    ball.velocity = {
      x: (dx / dist) * power,
      y: (dy / dist) * power,
      z: height
    };

    ball.state = 'flying';
    this.gameState.rallyCount++;
    this.gameState.currentTouch++;

    this.gameState.servingTeam = team;
  }

  updatePlayers(deltaTime) {
    for (let player of this.gameState.players.team1) {
      if (this.keys['w']) player.vy -= 0.6;
      if (this.keys['s']) player.vy += 0.6;
      if (this.keys['a']) player.vx -= 0.6;
      if (this.keys['d']) player.vx += 0.6;

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

      this.constrainPlayer(player, 1);
    }
  }

  constrainPlayer(player, team) {
    const beach = this.gameState.beach;
    const net = this.gameState.net;

    if (team === 1) {
      if (player.x + player.radius > net.x - net.width / 2 - 10) {
        player.x = net.x - net.width / 2 - 10 - player.radius;
        player.vx = 0;
      }
      if (player.x - player.radius < 30) {
        player.x = 30 + player.radius;
        player.vx = 0;
      }
    } else {
      if (player.x - player.radius < net.x + net.width / 2 + 10) {
        player.x = net.x + net.width / 2 + 10 + player.radius;
        player.vx = 0;
      }
      if (player.x + player.radius > beach.width - 30) {
        player.x = beach.width - 30 - player.radius;
        player.vx = 0;
      }
    }

    if (player.y - player.radius < 150) {
      player.y = 150 + player.radius;
      player.vy = 0;
    }
    if (player.y + player.radius > beach.height - 30) {
      player.y = beach.height - 30 - player.radius;
      player.vy = 0;
    }
  }

  updateCPU(deltaTime) {
    const ball = this.gameState.ball;
    const cpuTeam = this.gameState.players.team2;

    if (ball.state === 'flying' && ball.velocity.z < 0) {
      const predicted = this.predictBallLanding();

      if (predicted && predicted.x > this.gameState.beach.width / 2) {
        for (let player of cpuTeam) {
          const targetX = predicted.x + (Math.random() - 0.5) * 40;
          const targetY = predicted.y + (Math.random() - 0.5) * 40;

          const dx = targetX - player.x;
          const dy = targetY - player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 10) {
            player.vx += (dx / dist) * player.speed * 0.05;
            player.vy += (dy / dist) * player.speed * 0.05;
          }

          player.vx *= 0.9;
          player.vy *= 0.9;

          const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
          if (speed > player.speed * 0.85) {
            const ratio = player.speed * 0.85 / speed;
            player.vx *= ratio;
            player.vy *= ratio;
          }

          player.x += player.vx;
          player.y += player.vy;

          this.constrainPlayer(player, 2);
        }
      }
    } else {
      for (let player of cpuTeam) {
        const targetX = this.gameState.beach.width * 0.7;
        const targetY = this.gameState.beach.height * 0.5;

        const dx = targetX - player.x;
        const dy = targetY - player.y;

        player.vx += dx * 0.01;
        player.vy += dy * 0.01;

        player.vx *= 0.9;
        player.vy *= 0.9;

        player.x += player.vx;
        player.y += player.vy;

        this.constrainPlayer(player, 2);
      }
    }
  }

  predictBallLanding() {
    const ball = this.gameState.ball;
    const vel = ball.velocity;

    if (vel.z <= 0) return null;

    let x = ball.x;
    let y = ball.y;
    let z = ball.z;

    while (z > 0) {
      x += vel.x;
      y += vel.y;
      z += vel.z;
      vel.z -= 0.25;
      vel.y += 0.1;
    }

    return { x, y };
  }

  scorePoint(team) {
    if (team === 1) {
      this.gameState.score.team1 += 1;
    } else {
      this.gameState.score.team2 += 1;
    }

    this.gameState.inPlay = false;
    this.gameState.ball.state = 'idle';
    this.gameState.serving = false;

    const p1Score = this.gameState.score.team1;
    const p2Score = this.gameState.score.team2;

    if ((p1Score >= 15 && p1Score - p2Score >= 2) || (p2Score >= 15 && p2Score - p1Score >= 2)) {
      this.winSet(team);
    } else {
      this.gameState.servingTeam = team;
      this.gameState.status = 'serving';

      this.resetPositions();
      setTimeout(() => this.gameLoop(), 2000);
    }
  }

  winSet(team) {
    if (team === 1) {
      this.gameState.sets.team1 += 1;
    } else {
      this.gameState.sets.team2 += 1;
    }

    this.gameState.score = { team1: 0, team2: 0 };

    if ((this.gameState.sets.team1 >= 2) || (this.gameState.sets.team2 >= 2)) {
      this.gameState.status = 'match_over';
    } else {
      this.gameState.status = 'serving';
      this.resetPositions();
    }
  }

  resetPositions() {
    const beach = this.gameState.beach;

    this.gameState.players.team1[0].x = beach.width * 0.25;
    this.gameState.players.team1[0].y = beach.height * 0.6;
    this.gameState.players.team1[1].x = beach.width * 0.35;
    this.gameState.players.team1[1].y = beach.height * 0.7;

    this.gameState.players.team2[0].x = beach.width * 0.75;
    this.gameState.players.team2[0].y = beach.height * 0.6;
    this.gameState.players.team2[1].x = beach.width * 0.65;
    this.gameState.players.team2[1].y = beach.height * 0.7;

    for (let player of [...this.gameState.players.team1, ...this.gameState.players.team2]) {
      player.vx = 0;
      player.vy = 0;
    }

    this.gameState.ball.x = this.gameState.servingTeam === 1 ?
      beach.width * 0.25 : beach.width * 0.75;
    this.gameState.ball.y = (this.gameState.servingTeam === 1 ?
      this.gameState.players.team1[0] : this.gameState.players.team2[0]).y - 30;
    this.gameState.ball.z = 40;
    this.gameState.ball.vx = 0;
    this.gameState.ball.vy = 0;
    this.gameState.ball.vz = 0;
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawBeach(ctx);
    this.drawNet(ctx);
    this.drawCourtLines(ctx);
    this.drawPlayers(ctx);
    this.drawBall(ctx);
    this.drawHUD(ctx);

    if (this.gameState.status === 'paused') {
      this.drawPauseScreen(ctx);
    }

    if (this.gameState.status === 'match_over') {
      this.drawMatchOver(ctx);
    }
  }

  drawBeach(ctx) {
    const beach = this.gameState.beach;

    const gradient = ctx.createLinearGradient(0, 0, 0, beach.height);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(0.3, '#87ceeb');
    gradient.addColorStop(0.3, '#deb887');
    gradient.addColorStop(1, '#d2a679');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, beach.width, beach.height);

    ctx.fillStyle = '#f4e4bc';
    ctx.fillRect(0, 0, beach.width, 150);

    for (let i = 0; i < 50; i++) {
      for (let j = 0; j < 30; j++) {
        if (Math.random() > 0.9) {
          ctx.fillStyle = 'rgba(255, 255, 200, 0.5)';
          ctx.beginPath();
          ctx.arc(i * 20 + Math.random() * 10, 150 + j * 20 + Math.random() * 10, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(0, 0, beach.width, 150);
  }

  drawNet(ctx) {
    const net = this.gameState.net;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(net.x - 5, net.y, 10, net.height);

    const gradient = ctx.createLinearGradient(net.x - net.width, net.y, net.x + net.width, net.y);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(0.5, '#f0f0f0');
    gradient.addColorStop(1, '#fff');
    ctx.fillStyle = gradient;

    ctx.fillRect(net.x - net.width / 2, net.y, net.width, net.height);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;

    for (let y = net.y; y < net.y + net.height; y += 10) {
      ctx.beginPath();
      ctx.moveTo(net.x - net.width / 2, y);
      ctx.lineTo(net.x + net.width / 2, y);
      ctx.stroke();
    }

    for (let x = net.x - net.width / 2; x < net.x + net.width / 2; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x, net.y);
      ctx.lineTo(x, net.y + net.height);
      ctx.stroke();
    }

    ctx.fillStyle = '#c0392b';
    ctx.fillRect(net.x - net.width / 2 - 3, net.y - 5, net.width + 6, 8);

    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(net.x, net.y + 30, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(net.x, net.y + 60, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(net.x, net.y + 90, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  drawCourtLines(ctx) {
    const beach = this.gameState.beach;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(30, 150);
    ctx.lineTo(30, beach.height - 30);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(beach.width - 30, 150);
    ctx.lineTo(beach.width - 30, beach.height - 30);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.setLineDash([10, 5]);

    ctx.beginPath();
    ctx.moveTo(beach.width / 2, 150);
    ctx.lineTo(beach.width / 2, beach.height - 30);
    ctx.stroke();

    ctx.setLineDash([]);
  }

  drawPlayers(ctx) {
    for (let player of this.gameState.players.team1) {
      this.drawPlayer(ctx, player, true);
    }
    for (let player of this.gameState.players.team2) {
      this.drawPlayer(ctx, player, false);
    }
  }

  drawPlayer(ctx, player, isTeam1) {
    ctx.save();

    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 2, 0, Math.PI * 2);
    ctx.fillStyle = isTeam1 ? 'rgba(231, 76, 60, 0.3)' : 'rgba(52, 152, 219, 0.3)';
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
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.number.toString(), player.x, player.y);

    ctx.restore();
  }

  drawBall(ctx) {
    const ball = this.gameState.ball;

    ctx.save();

    if (ball.state === 'flying') {
      const shadowY = ball.z / 4;
      ctx.beginPath();
      ctx.ellipse(ball.x, ball.y + shadowY, ball.radius, ball.radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fill();
    }

    ctx.translate(ball.x, ball.y - ball.z / 5);
    ctx.rotate(ball.rotation);

    const gradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, ball.radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#e0e0e0');

    ctx.beginPath();
    ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-ball.radius * 0.8, 0);
    ctx.lineTo(ball.radius * 0.8, 0);
    ctx.stroke();

    ctx.strokeStyle = '#3498db';
    ctx.beginPath();
    ctx.moveTo(0, -ball.radius * 0.8);
    ctx.lineTo(0, ball.radius * 0.8);
    ctx.stroke();

    ctx.restore();
  }

  drawHUD(ctx) {
    const beach = this.gameState.beach;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, beach.width, 50);

    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(this.gameState.score.team1.toString(), 40, 35);

    ctx.fillStyle = '#3498db';
    ctx.fillText(this.gameState.score.team2.toString(), 80, 35);

    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('-', 60, 35);

    ctx.fillStyle = '#f39c12';
    ctx.fillText(`Set: ${this.gameState.sets.team1}-${this.gameState.sets.team2}`, beach.width / 2, 30);

    ctx.fillStyle = this.gameState.servingTeam === 1 ? '#e74c3c' : '#3498db';
    ctx.font = '14px Arial';
    ctx.fillText(this.gameState.servingTeam === 1 ? 'Team 1 Serving' : 'Team 2 Serving', beach.width / 2, 48);

    ctx.fillStyle = 'white';
    ctx.textAlign = 'right';
    ctx.fillText(`Rally: ${this.gameState.rallyCount}`, beach.width - 40, 30);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('WASD - Move | Space - Pause', beach.width / 2, beach.height - 15);
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

  drawMatchOver(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const winner = this.gameState.sets.team1 > this.gameState.sets.team2 ? 'Team 1' : 'Team 2';
    const color = this.gameState.sets.team1 > this.gameState.sets.team2 ? '#e74c3c' : '#3498db';

    ctx.fillStyle = color;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${winner} Wins!`, this.canvas.width / 2, this.canvas.height / 2 - 40);

    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText(`Sets: ${this.gameState.sets.team1} - ${this.gameState.sets.team2}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    ctx.fillText(`Final Score: ${this.gameState.score.team1} - ${this.gameState.score.team2}`, this.canvas.width / 2, this.canvas.height / 2 + 55);
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
      sets: this.gameState.sets,
      rallyCount: this.gameState.rallyCount,
      status: this.gameState.status
    };
  }
}

window.VolleyballGame = VolleyballGame;