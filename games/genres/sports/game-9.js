// Cricket World - Cricket Game
class CricketGame {
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
      score: { batting: 0, wickets: 0 },
      overs: { current: 0, total: 10 },
      balls: 0,
      status: 'bowling',
      ball: null,
      batsmen: { striker: null, nonStriker: null },
      field: { width: 0, height: 0, centerX: 0, centerY: 0 },
      pitch: null,
      wicket: null,
      gameTime: 0,
      ballSpeed: 0,
      ballType: 'fast',
      deliveryCount: 0,
      lastShot: null,
      wides: 0,
      noBalls: 0,
      extras: 0,
      fallOfWickets: [],
      partnership: 0,
      requiredRunRate: 0,
      target: 0,
      gamePhase: 'first_innings'
    };

    this.keys = {};
    this.mouse = { x: 0, y: 0, pressed: false };

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

      if (this.gameState.status === 'batting') {
        this.playShot();
      }
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
    if (this.gameState.status === 'playing' || this.gameState.status === 'bowling' || this.gameState.status === 'batting') {
      this.gameState.status = 'paused';
    } else if (this.gameState.status === 'paused') {
      this.gameState.status = 'bowling';
    }
  }

  playShot() {
    const ball = this.gameState.ball;
    const striker = this.gameState.batsmen.striker;

    if (ball.state !== 'delivered' || ball.y < this.gameState.field.centerY) return;

    const dx = this.mouse.x - striker.x;
    const dy = this.mouse.y - striker.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const power = Math.min(dist / 20, 10);
    const angle = Math.atan2(dy, dx);

    const shotTypes = ['defensive', 'drive', 'cut', 'pull', 'sweep'];
    const shotType = shotTypes[Math.floor(Math.random() * shotTypes.length)];

    const runValues = { defensive: 0, drive: Math.random() > 0.3 ? 4 : 1, cut: Math.random() > 0.5 ? 4 : 2, pull: Math.random() > 0.4 ? 6 : 2, sweep: Math.random() > 0.3 ? 4 : 2 };
    const runs = shotType === 'defensive' ? 0 : runValues[shotType];

    const hitPower = 5 + power * 3;

    ball.velocity = {
      x: Math.cos(angle) * hitPower,
      y: Math.sin(angle) * hitPower - 3,
      z: 10 + power * 2
    };

    ball.state = 'hit';
    ball.hitBy = 'striker';
    ball.shotType = shotType;

    this.gameState.score.batting += runs;
    this.gameState.partnership += runs;
    this.gameState.lastShot = { type: shotType, runs: runs };

    if (runs % 2 === 1 && runs !== 0) {
      this.swapStriker();
    }
  }

  swapStriker() {
    const temp = this.gameState.batsmen.striker;
    this.gameState.batsmen.striker = this.gameState.batsmen.nonStriker;
    this.gameState.batsmen.nonStriker = temp;
  }

  bowl() {
    if (this.gameState.status !== 'bowling') return;

    const ball = this.gameState.ball;
    const field = this.gameState.field;

    ball.x = field.centerX;
    ball.y = field.height * 0.15;
    ball.z = 0;

    const deliveryTypes = ['fast', 'medium', 'spin', 'bouncer', ' Yorker'];
    const weights = [0.4, 0.3, 0.2, 0.07, 0.03];
    let rand = Math.random();
    let ballType = 'fast';

    for (let i = 0; i < weights.length; i++) {
      rand -= weights[i];
      if (rand <= 0) {
        ballType = deliveryTypes[i];
        break;
      }
    }

    this.gameState.ballType = ballType;

    const speeds = { fast: 15, medium: 11, spin: 7, bouncer: 14, Yorker: 8 };
    const speed = speeds[ballType];

    const wicket = this.gameState.wicket;
    const targetX = wicket.x + (Math.random() - 0.5) * 40;
    const targetY = wicket.y + (Math.random() - 0.5) * 20;

    const dx = targetX - ball.x;
    const dy = targetY - ball.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    ball.velocity = {
      x: (dx / dist) * speed,
      y: (dy / dist) * speed * 1.5,
      z: 0
    };

    ball.state = 'delivered';
    this.gameState.ballSpeed = speed;
    this.gameState.deliveryCount++;
    this.gameState.status = 'playing';

    this.gameState.ball.x = field.centerX;
    this.gameState.ball.y = field.height * 0.15;
  }

  initGame() {
    const field = this.gameState.field;
    field.width = this.canvas.width;
    field.height = this.canvas.height;
    field.centerX = this.canvas.width / 2;
    field.centerY = this.canvas.height / 2;

    this.gameState.pitch = {
      x: field.centerX,
      y: field.height * 0.7,
      length: 180,
      width: 30
    };

    this.gameState.wicket = {
      x: field.centerX,
      y: field.height * 0.78,
      width: 25,
      height: 8,
      stumpWidth: 3,
      stumpHeight: 40
    };

    this.gameState.ball = {
      x: field.centerX,
      y: field.height * 0.15,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      radius: 8,
      color: '#c0392b',
      state: 'idle',
      velocity: null,
      rotation: 0,
      hitBy: null,
      shotType: null
    };

    this.gameState.batsmen.striker = {
      x: field.centerX + 30,
      y: field.height * 0.78,
      radius: 14,
      color: '#3498db',
      name: this.players[0]?.name || 'Batsman 1',
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      striker: true
    };

    this.gameState.batsmen.nonStriker = {
      x: field.centerX - 30,
      y: field.height * 0.78,
      radius: 14,
      color: '#2ecc71',
      name: this.players[1]?.name || 'Batsman 2',
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      striker: false
    };

    setTimeout(() => this.bowl(), 1500);
  }

  update(deltaTime) {
    if (this.gameState.status === 'paused') return;

    this.gameState.gameTime += deltaTime;

    if (this.gameState.status === 'bowling') {
      this.gameState.status = 'waiting';
      this.bowl();
    }

    if (this.gameState.status === 'playing' || this.gameState.status === 'batting') {
      this.updateBall(deltaTime);
      this.updateBatsmen(deltaTime);
      this.checkWicket();
    }
  }

  updateBall(deltaTime) {
    const ball = this.gameState.ball;
    const field = this.gameState.field;

    if (ball.state === 'delivered' || ball.state === 'hit') {
      const vel = ball.velocity;

      ball.x += vel.x;
      ball.y += vel.y;
      ball.z += vel.z;

      vel.z -= 0.2;

      if (ball.state === 'delivered') {
        if (this.gameState.ballType === 'spin') {
          vel.x += (Math.random() - 0.5) * 0.3;
        }
      }

      ball.rotation += 0.15;

      if (ball.z <= ball.radius && ball.state === 'hit') {
        vel.z = -vel.z * 0.6;
        ball.z = ball.radius;
        ball.state = 'grounded';
      }

      if (ball.x < 0 || ball.x > field.width || ball.y < 0 || ball.y > field.height) {
        this.processDeliveryEnd();
      }

      const pitch = this.gameState.pitch;
      const pitchEnd = pitch.y + pitch.length / 2;

      if (ball.state === 'delivered' && ball.y > pitchEnd && ball.z < 30) {
        const striker = this.gameState.batsmen.striker;
        const dx = ball.x - striker.x;
        const dy = ball.y - striker.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 40) {
          this.processDeliveryEnd();
        }
      }
    }
  }

  processDeliveryEnd() {
    const ball = this.gameState.ball;
    const striker = this.gameState.batsmen.striker;

    this.gameState.balls++;
    striker.balls++;

    if (ball.state === 'hit') {
      const runs = this.gameState.lastShot?.runs || 0;
      this.gameState.score.batting += runs;

      if (runs === 4) striker.fours++;
      if (runs === 6) striker.sixes++;
      striker.runs += runs;

      if (runs > 0 && Math.random() < 0.15) {
        this.swapStriker();
      }
    } else {
      if (this.gameState.ballType === 'Yorker' && Math.random() < 0.3) {
        this.gameState.score.wickets++;
        this.gameState.fallOfWickets.push({
          runs: this.gameState.score.batting,
          balls: this.gameState.balls
        });

        this.resetWicket();
      }
    }

    if (this.gameState.balls >= 6) {
      this.gameState.balls = 0;
      this.gameState.overs.current++;
      this.swapStriker();
    }

    if (this.gameState.overs.current >= this.gameState.overs.total || this.gameState.score.wickets >= 10) {
      this.gameState.status = 'innings_end';
    } else {
      this.gameState.status = 'bowling';
      this.resetBallForNextBall();
    }
  }

  resetWicket() {
    this.gameState.batsmen.striker = {
      x: this.gameState.field.centerX + 30,
      y: this.gameState.field.height * 0.78,
      radius: 14,
      color: '#3498db',
      name: `Batsman ${this.gameState.score.wickets + 2}`,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      striker: true
    };

    this.gameState.partnership = 0;
  }

  resetBallForNextBall() {
    const ball = this.gameState.ball;
    const field = this.gameState.field;

    ball.x = field.centerX;
    ball.y = field.height * 0.15;
    ball.z = 0;
    ball.vx = 0;
    ball.vy = 0;
    ball.vz = 0;
    ball.state = 'idle';
    ball.velocity = null;
    ball.hitBy = null;
    ball.shotType = null;
    ball.rotation = 0;

    this.gameState.lastShot = null;
  }

  updateBatsmen(deltaTime) {
    const ball = this.gameState.ball;
    const striker = this.gameState.batsmen.striker;

    if (ball.state === 'hit') {
      const dx = ball.x - striker.x;
      const dy = ball.y - striker.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 30) {
        striker.x += ball.velocity.x * 0.3;
        striker.y += ball.velocity.y * 0.3;
      }

      if (ball.y < this.gameState.field.height * 0.4) {
        striker.x = this.gameState.field.centerX + 30;
        striker.y = this.gameState.field.height * 0.78;
      }
    } else {
      striker.x = this.gameState.field.centerX + 30;
      striker.y = this.gameState.field.height * 0.78;
    }
  }

  checkWicket() {
    const ball = this.gameState.ball;
    const wicket = this.gameState.wicket;

    if (ball.state === 'delivered') {
      const dx = Math.abs(ball.x - wicket.x);
      const dy = Math.abs(ball.y - wicket.y);

      if (dx < wicket.width / 2 + ball.radius && dy < 10) {
        if (this.gameState.ballType !== 'bouncer' || Math.random() < 0.5) {
          this.gameState.score.wickets++;
          ball.state = 'wicket';
          setTimeout(() => this.processDeliveryEnd(), 500);
        }
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawField(ctx);
    this.drawPitch(ctx);
    this.drawWicket(ctx);
    this.drawBatsmen(ctx);
    this.drawBall(ctx);
    this.drawHUD(ctx);

    if (this.gameState.status === 'paused') {
      this.drawPauseScreen(ctx);
    }

    if (this.gameState.status === 'innings_end') {
      this.drawInningsEnd(ctx);
    }
  }

  drawField(ctx) {
    const field = this.gameState.field;

    const gradient = ctx.createLinearGradient(0, 0, 0, field.height);
    gradient.addColorStop(0, '#4caf50');
    gradient.addColorStop(1, '#2e7d32');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, field.width, field.height);

    ctx.fillStyle = '#81c784';
    ctx.beginPath();
    ctx.ellipse(field.centerX, field.height * 0.55, 350, 220, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(field.centerX, field.height * 0.55, 350, 220, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(field.centerX, field.height * 0.4, 30, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawPitch(ctx) {
    const pitch = this.gameState.pitch;

    ctx.fillStyle = '#d7ccc8';
    ctx.fillRect(pitch.x - pitch.width / 2, pitch.y - pitch.length / 2, pitch.width, pitch.length);

    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 3;
    ctx.strokeRect(pitch.x - pitch.width / 2, pitch.y - pitch.length / 2, pitch.width, pitch.length);

    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(pitch.x, pitch.y - pitch.length / 2);
    ctx.lineTo(pitch.x, pitch.y + pitch.length / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pitch.x - pitch.width / 2, pitch.y - pitch.length / 4);
    ctx.lineTo(pitch.x + pitch.width / 2, pitch.y - pitch.length / 4);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pitch.x - pitch.width / 2, pitch.y + pitch.length / 4);
    ctx.lineTo(pitch.x + pitch.width / 2, pitch.y + pitch.length / 4);
    ctx.stroke();
  }

  drawWicket(ctx) {
    const wicket = this.gameState.wicket;

    ctx.fillStyle = '#f44336';
    for (let i = -1; i <= 1; i++) {
      ctx.fillRect(wicket.x + i * wicket.stumpWidth - wicket.stumpWidth / 2, wicket.y - wicket.stumpHeight, wicket.stumpWidth, wicket.stumpHeight);
    }

    ctx.fillStyle = '#e53935';
    ctx.fillRect(wicket.x - wicket.width / 2, wicket.y - 5, wicket.width, 5);
  }

  drawBatsmen(ctx) {
    this.drawBatsman(ctx, this.gameState.batsmen.striker, true);
    this.drawBatsman(ctx, this.gameState.batsmen.nonStriker, false);
  }

  drawBatsman(ctx, batsman, isStriker) {
    ctx.save();

    ctx.beginPath();
    ctx.arc(batsman.x, batsman.y, batsman.radius + 2, 0, Math.PI * 2);
    ctx.fillStyle = isStriker ? 'rgba(52, 152, 219, 0.3)' : 'rgba(46, 204, 113, 0.3)';
    ctx.fill();

    const gradient = ctx.createRadialGradient(
      batsman.x - 2, batsman.y - 2, 0,
      batsman.x, batsman.y, batsman.radius
    );
    gradient.addColorStop(0, this.lightenColor(batsman.color, 40));
    gradient.addColorStop(1, batsman.color);

    ctx.beginPath();
    ctx.arc(batsman.x, batsman.y, batsman.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(batsman.striker ? '*' : ' ', batsman.x, batsman.y);

    if (isStriker) {
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(batsman.x + 10, batsman.y - 5);
      ctx.lineTo(batsman.x + 30, batsman.y - 15);
      ctx.lineTo(batsman.x + 25, batsman.y - 5);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawBall(ctx) {
    const ball = this.gameState.ball;

    ctx.save();

    if (ball.state === 'hit' || ball.state === 'delivered') {
      const shadowY = ball.z / 4;
      ctx.beginPath();
      ctx.ellipse(ball.x, ball.y + shadowY, ball.radius + 1, ball.radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fill();
    }

    ctx.translate(ball.x, ball.y - ball.z / 5);
    ctx.rotate(ball.rotation);

    const gradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, ball.radius);
    gradient.addColorStop(0, '#e74c3c');
    gradient.addColorStop(1, ball.color);

    ctx.beginPath();
    ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#922b21';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-ball.radius * 0.7, 0);
    ctx.lineTo(ball.radius * 0.7, 0);
    ctx.stroke();

    ctx.restore();
  }

  drawHUD(ctx) {
    const field = this.gameState.field;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, field.width, 60);
    ctx.fillRect(0, field.height - 40, field.width, 40);

    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${this.gameState.score.batting}/${this.gameState.score.wickets}`, 30, 40);

    const oversDisplay = `${this.gameState.overs.current}.${this.gameState.balls}`;
    ctx.fillStyle = 'white';
    ctx.fillText(oversDisplay, 180, 40);

    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('CRR: 0.0', 280, 40);

    const striker = this.gameState.batsmen.striker;
    ctx.fillStyle = '#3498db';
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`${striker.name} *`, field.width - 30, 40);
    ctx.fillText(`${striker.runs} (${striker.balls})`, field.width - 30, 55);

    const nonStriker = this.gameState.batsmen.nonStriker;
    ctx.fillStyle = '#2ecc71';
    ctx.textAlign = 'left';
    ctx.fillText(nonStriker.name, 30, field.height - 25);
    ctx.fillText(`${nonStriker.runs} (${nonStriker.balls})`, 120, field.height - 25);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Click to play shot | Space - Pause', field.centerX, field.height - 10);
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

  drawInningsEnd(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('INNINGS END', this.canvas.width / 2, this.canvas.height / 2 - 60);

    ctx.fillStyle = 'white';
    ctx.font = '32px Arial';
    ctx.fillText(`Total: ${this.gameState.score.batting}/${this.gameState.score.wickets}`, this.canvas.width / 2, this.canvas.height / 2);

    ctx.font = '20px Arial';
    ctx.fillText(`Overs: ${this.gameState.overs.current}.${this.gameState.balls}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
    ctx.fillText(`4s: ${this.gameState.batsmen.striker.fours} | 6s: ${this.gameState.batsmen.striker.sixes}`, this.canvas.width / 2, this.canvas.height / 2 + 70);
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
      overs: this.gameState.overs,
      balls: this.gameState.balls,
      status: this.gameState.status
    };
  }
}

window.CricketGame = CricketGame;