// Football Kick - American Football Kicking Game
class FootballKickGame {
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
      score: 0,
      attempts: 0,
      successful: 0,
      status: 'aiming',
      ball: null,
      field: { width: 0, height: 0, centerX: 0, centerY: 0 },
      kicker: null,
      goalPosts: null,
      gameTime: 0,
      power: 0,
      isPowering: false,
      aimAngle: 0,
      ballCurve: 0,
      wind: 0,
      windDirection: 0,
      difficulty: 1,
      distance: 20,
      round: 1,
      totalRounds: 5,
      bonusKick: false,
      lastKickDistance: 0,
      lastKickSuccess: false
    };

    this.mouse = { x: 0, y: 0, pressed: false };
    this.keys = {};

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

      if (this.gameState.status === 'aiming') {
        this.gameState.isPowering = true;
        this.gameState.power = 0;
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;

      if (this.gameState.status === 'aiming') {
        const kicker = this.gameState.kicker;
        this.gameState.aimAngle = Math.atan2(this.mouse.y - kicker.y, this.mouse.x - kicker.x);
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.pressed = false;

      if (this.gameState.isPowering && this.gameState.status === 'aiming') {
        this.kick();
      }
    });

    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key === ' ') this.togglePause();
      if (e.key === 'Enter') this.nextKick();
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  togglePause() {
    if (this.gameState.status === 'playing' || this.gameState.status === 'aiming' || this.gameState.status === 'result') {
      this.gameState.status = 'paused';
    } else if (this.gameState.status === 'paused') {
      this.gameState.status = 'aiming';
    }
  }

  kick() {
    if (!this.gameState.isPowering) return;

    const ball = this.gameState.ball;
    const kicker = this.gameState.kicker;
    const power = Math.min(this.gameState.power, 100) / 100;

    const distance = this.gameState.distance;
    const basePower = 15 + power * 15;
    const powerFactor = distance / 20;

    ball.velocity = {
      x: Math.cos(this.gameState.aimAngle) * basePower * 0.3,
      y: -basePower * powerFactor,
      z: basePower * 0.8
    };

    ball.curve = (Math.random() - 0.5) * 0.5;
    ball.spin = 0;

    ball.state = 'flying';
    this.gameState.attempts++;
    this.gameState.isPowering = false;
    this.gameState.power = 0;
    this.gameState.status = 'playing';

    this.gameState.wind = (Math.random() - 0.5) * 3;
  }

  initGame() {
    const field = this.gameState.field;
    field.width = this.canvas.width;
    field.height = this.canvas.height;
    field.centerX = this.canvas.width / 2;
    field.centerY = this.canvas.height / 2;

    this.gameState.goalPosts = {
      left: field.centerX - 100,
      right: field.centerX + 100,
      top: 80,
      bottom: 180,
      postWidth: 8,
      crossbar: field.centerY - 100
    };

    this.gameState.kicker = {
      x: field.centerX,
      y: field.height - 100,
      radius: 20,
      color: '#3498db',
      name: this.players[0]?.name || 'Kicker',
      state: 'ready'
    };

    this.gameState.ball = {
      x: field.centerX,
      y: field.height - 80,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      radius: 12,
      color: '#8B4513',
      state: 'idle',
      velocity: null,
      curve: 0,
      spin: 0,
      rotation: 0
    };

    this.generateWind();
  }

  generateWind() {
    this.gameState.wind = (Math.random() - 0.5) * 4;
    this.gameState.windDirection = Math.random() * Math.PI * 2;
  }

  update(deltaTime) {
    if (this.gameState.status === 'paused') return;

    this.gameState.gameTime += deltaTime;

    if (this.gameState.isPowering) {
      this.gameState.power = Math.min(this.gameState.power + deltaTime / 12, 100);
    }

    this.updateBall(deltaTime);
    this.updateKicker(deltaTime);
    this.checkGoal();
  }

  updateBall(deltaTime) {
    const ball = this.gameState.ball;
    const field = this.gameState.field;

    if (ball.state !== 'flying') return;

    const vel = ball.velocity;

    ball.x += vel.x + this.gameState.wind * 0.3;
    ball.y += vel.y;
    ball.z += vel.z;

    vel.z -= 0.3;
    vel.y += 0.15;

    ball.spin += 0.1;
    ball.rotation += 0.1;

    ball.x += Math.sin(ball.spin) * ball.curve * 2;

    if (ball.z <= ball.radius && ball.state === 'flying') {
      const goalPosts = this.gameState.goalPosts;
      const fieldCenterY = this.gameState.field.centerY;

      const inGoalWidth = ball.x > goalPosts.left + 10 && ball.x < goalPosts.right - 10;
      const inGoalHeight = ball.y < goalPosts.top || (ball.y > goalPosts.crossbar && ball.y < goalPosts.bottom);

      if (inGoalWidth && ball.y < goalPosts.top) {
        this.scoreGoal(true);
      } else if (ball.y > field.height || ball.x < 0 || ball.x > field.width) {
        this.scoreGoal(false);
      } else {
        vel.z = -vel.z * 0.5;
        ball.z = ball.radius;
        ball.state = 'grounded';

        setTimeout(() => this.scoreGoal(false), 1000);
      }
    }

    if (ball.y < -100 || ball.x < -100 || ball.x > field.width + 100) {
      this.scoreGoal(ball.y < -50 && ball.x > goalPosts.left && ball.x < goalPosts.right);
    }
  }

  updateKicker(deltaTime) {
    const kicker = this.gameState.kicker;
    const ball = this.gameState.ball;

    if (ball.state === 'flying') {
      kicker.state = 'kicking';
    } else if (ball.state === 'idle') {
      kicker.state = 'ready';
    }
  }

  checkGoal() {
    const ball = this.gameState.ball;
    const goalPosts = this.gameState.goalPosts;

    if (ball.state === 'flying' && ball.y < goalPosts.top && ball.z < 80) {
      const inWidth = ball.x > goalPosts.left + ball.radius && ball.x < goalPosts.right - ball.radius;

      if (inWidth && ball.y < goalPosts.top - ball.radius) {
        this.scoreGoal(true);
      }
    }
  }

  scoreGoal(success) {
    if (this.gameState.status === 'result') return;

    this.gameState.status = 'result';
    this.gameState.lastKickSuccess = success;

    if (success) {
      this.gameState.successful++;
      this.gameState.score += this.gameState.distance;
    }

    setTimeout(() => {
      if (this.gameState.round >= this.gameState.totalRounds) {
        this.gameState.status = 'game_over';
      } else {
        this.nextKick();
      }
    }, 2000);
  }

  nextKick() {
    if (this.gameState.status === 'game_over') {
      this.resetGame();
      return;
    }

    this.gameState.round++;
    this.gameState.distance = 20 + this.gameState.round * 5;

    const ball = this.gameState.ball;
    ball.x = this.gameState.field.centerX;
    ball.y = this.gameState.field.height - 80;
    ball.z = 0;
    ball.vx = 0;
    ball.vy = 0;
    ball.vz = 0;
    ball.state = 'idle';
    ball.velocity = null;
    ball.curve = 0;
    ball.spin = 0;

    this.gameState.status = 'aiming';
    this.gameState.kicker.state = 'ready';

    this.generateWind();
  }

  resetGame() {
    this.gameState.score = 0;
    this.gameState.attempts = 0;
    this.gameState.successful = 0;
    this.gameState.round = 1;
    this.gameState.distance = 20;
    this.gameState.status = 'aiming';

    this.initGame();
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawField(ctx);
    this.drawGoalPosts(ctx);
    this.drawDistanceMarker(ctx);
    this.drawKicker(ctx);
    this.drawBall(ctx);
    this.drawAimIndicator(ctx);
    this.drawWindIndicator(ctx);
    this.drawHUD(ctx);

    if (this.gameState.status === 'paused') {
      this.drawPauseScreen(ctx);
    }

    if (this.gameState.status === 'result') {
      this.drawResult(ctx);
    }

    if (this.gameState.status === 'game_over') {
      this.drawGameOver(ctx);
    }
  }

  drawField(ctx) {
    const field = this.gameState.field;

    const gradient = ctx.createLinearGradient(0, 0, 0, field.height);
    gradient.addColorStop(0, '#1b5e20');
    gradient.addColorStop(0.3, '#2e7d32');
    gradient.addColorStop(1, '#1b5e20');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, field.width, field.height);

    ctx.fillStyle = '#4caf50';
    for (let i = 0; i < field.height; i += 8) {
      ctx.fillRect(0, i, field.width, 4);
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;

    for (let y = 50; y < field.height - 50; y += 40) {
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(field.width - 50, y);
      ctx.stroke();
    }

    for (let x = 50; x < field.width - 50; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 50);
      ctx.lineTo(x, field.height - 50);
      ctx.stroke();
    }

    ctx.fillStyle = '#388e3c';
    ctx.fillRect(0, field.height - 150, field.width, 100);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(100, field.height - 50);
    ctx.lineTo(100, field.height - 150);
    ctx.lineTo(field.width - 100, field.height - 150);
    ctx.lineTo(field.width - 100, field.height - 50);
    ctx.stroke();
  }

  drawGoalPosts(ctx) {
    const goal = this.gameState.goalPosts;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(goal.left - 15, goal.top + 20, 230, 10);

    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(goal.left - 15, goal.top, 15, 180);
    ctx.fillRect(goal.right, goal.top, 15, 180);

    ctx.fillRect(goal.left, goal.top, goal.right - goal.left, 12);

    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.moveTo(goal.left, goal.top + 20);
    ctx.lineTo(goal.left + 20, goal.top + 60);
    ctx.lineTo(goal.left - 20, goal.top + 60);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(goal.right, goal.top + 20);
    ctx.lineTo(goal.right - 20, goal.top + 60);
    ctx.lineTo(goal.right + 20, goal.top + 60);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(goal.left, goal.top);
    ctx.lineTo(goal.left + 30, goal.top + 30);
    ctx.lineTo(goal.left, goal.top + 30);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(goal.right, goal.top);
    ctx.lineTo(goal.right - 30, goal.top + 30);
    ctx.lineTo(goal.right, goal.top + 30);
    ctx.closePath();
    ctx.fill();
  }

  drawDistanceMarker(ctx) {
    const field = this.gameState.field;
    const distance = this.gameState.distance;

    const markerY = field.height - 80 - (distance * 8);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.moveTo(field.centerX, markerY - 10);
    ctx.lineTo(field.centerX - 15, markerY + 5);
    ctx.lineTo(field.centerX + 15, markerY + 5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${distance} yd`, field.centerX, markerY + 25);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(field.centerX - 100, markerY);
    ctx.lineTo(field.centerX + 100, markerY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawKicker(ctx) {
    const kicker = this.gameState.kicker;

    ctx.save();

    ctx.beginPath();
    ctx.arc(kicker.x, kicker.y, kicker.radius + 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
    ctx.fill();

    const gradient = ctx.createRadialGradient(
      kicker.x - 3, kicker.y - 3, 0,
      kicker.x, kicker.y, kicker.radius
    );
    gradient.addColorStop(0, '#5dade2');
    gradient.addColorStop(1, '#3498db');

    ctx.beginPath();
    ctx.arc(kicker.x, kicker.y, kicker.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('K', kicker.x, kicker.y);

    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.ellipse(kicker.x + 15, kicker.y + 15, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawBall(ctx) {
    const ball = this.gameState.ball;

    ctx.save();

    if (ball.state === 'flying') {
      const shadowY = ball.z / 3;
      ctx.beginPath();
      ctx.ellipse(ball.x, ball.y + shadowY, ball.radius * 1.2, ball.radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fill();
    }

    ctx.translate(ball.x, ball.y - ball.z);
    ctx.rotate(ball.rotation);

    const gradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, ball.radius);
    gradient.addColorStop(0, '#a0522d');
    gradient.addColorStop(1, '#8B4513');

    ctx.beginPath();
    ctx.ellipse(0, 0, ball.radius * 1.3, ball.radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-ball.radius, 0);
    ctx.lineTo(ball.radius, 0);
    ctx.stroke();

    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, ball.radius * 0.5, ball.radius * 0.25, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  drawAimIndicator(ctx) {
    if (this.gameState.status !== 'aiming') return;

    const kicker = this.gameState.kicker;
    const ball = this.gameState.ball;
    const power = Math.min(this.gameState.power, 100) / 100;
    const lineLength = 80 + power * 120;

    ctx.strokeStyle = `rgba(255, ${255 - power * 255}, 0, 0.8)`;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);

    ctx.beginPath();
    ctx.moveTo(ball.x, ball.y);
    ctx.lineTo(
      ball.x + Math.cos(this.gameState.aimAngle) * lineLength,
      ball.y + Math.sin(this.gameState.aimAngle) * lineLength
    );
    ctx.stroke();

    ctx.setLineDash([]);

    const indicatorX = kicker.x;
    const indicatorY = kicker.y - 50;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(indicatorX - 50, indicatorY - 25, 100, 50);

    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Kick Power', indicatorX, indicatorY - 10);

    ctx.fillStyle = '#333';
    ctx.fillRect(indicatorX - 40, indicatorY + 2, 80, 12);

    const powerColor = power < 0.5 ? '#2ecc71' : (power < 0.8 ? '#f1c40f' : '#e74c3c');
    ctx.fillStyle = powerColor;
    ctx.fillRect(indicatorX - 40, indicatorY + 2, 80 * power, 12);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeRect(indicatorX - 40, indicatorY + 2, 80, 12);
  }

  drawWindIndicator(ctx) {
    const field = this.gameState.field;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(field.width - 120, 10, 110, 50);

    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Wind', field.width - 65, 25);

    const windSpeed = Math.abs(this.gameState.wind);
    const windDir = this.gameState.wind > 0 ? '→' : '←';
    const windColor = windSpeed < 1 ? '#2ecc71' : (windSpeed < 2 ? '#f1c40f' : '#e74c3c');

    ctx.fillStyle = windColor;
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`${windDir} ${windSpeed.toFixed(1)}`, field.width - 65, 45);
  }

  drawHUD(ctx) {
    const field = this.gameState.field;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, field.width, 55);

    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.gameState.score}`, 20, 38);

    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(`Round ${this.gameState.round} / ${this.gameState.totalRounds}`, field.centerX, 35);

    ctx.fillStyle = '#2ecc71';
    ctx.fillText(`${this.gameState.successful} / ${this.gameState.attempts}`, field.centerX, 53);

    ctx.fillStyle = 'white';
    ctx.textAlign = 'right';
    ctx.fillText(`${this.gameState.distance} yds`, field.width - 20, 38);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Click & Hold - Power | Release - Kick | Enter - Next', field.centerX, field.height - 15);
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

  drawResult(ctx) {
    const success = this.gameState.lastKickSuccess;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, this.canvas.height / 2 - 50, this.canvas.width, 100);

    ctx.fillStyle = success ? '#2ecc71' : '#e74c3c';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(success ? 'GOOD!' : 'MISS!', this.canvas.width / 2, this.canvas.height / 2 + 10);

    ctx.fillStyle = 'white';
    ctx.font = '18px Arial';
    ctx.fillText(success ? `+${this.gameState.distance} points` : 'No points', this.canvas.width / 2, this.canvas.height / 2 + 35);
  }

  drawGameOver(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 60);

    ctx.fillStyle = 'white';
    ctx.font = '32px Arial';
    ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2);

    ctx.fillStyle = '#2ecc71';
    ctx.font = '24px Arial';
    ctx.fillText(`${this.gameState.successful} / ${this.gameState.attempts} Kicks Made`, this.canvas.width / 2, this.canvas.height / 2 + 40);

    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText('Press ENTER to play again', this.canvas.width / 2, this.canvas.height / 2 + 80);
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
      attempts: this.gameState.attempts,
      successful: this.gameState.successful,
      round: this.gameState.round,
      distance: this.gameState.distance,
      status: this.gameState.status
    };
  }
}

window.FootballKickGame = FootballKickGame;