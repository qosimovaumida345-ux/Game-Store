// Baseball League - Baseball Batting Game
class BaseballGame {
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
      innings: 1,
      status: 'pitching',
      ball: null,
      batter: null,
      batterBox: { left: null, right: null },
      field: { width: 0, height: 0, centerX: 0, centerY: 0 },
      bases: { first: false, second: false, third: false },
      outs: 0,
      pitchCount: 0,
      strikes: 0,
      balls: 0,
      gameTime: 0,
      atBat: 0,
      pitchSpeed: 0,
      pitchType: 'fastball',
      batSwing: false,
      swingTimer: 0,
      hitResult: null,
      runners: []
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

      if (this.gameState.status === 'batting' && !this.gameState.batSwing) {
        this.swing();
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      this.mouse.pressed = false;
    });

    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key === ' ') this.togglePause();
      if (e.key === 's' || e.key === 'S') {
        if (this.gameState.status === 'batting') {
          this.swing();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  togglePause() {
    if (this.gameState.status === 'playing' || this.gameState.status === 'batting' || this.gameState.status === 'pitching') {
      this.gameState.status = 'paused';
    } else if (this.gameState.status === 'paused') {
      this.gameState.status = 'pitching';
    }
  }

  swing() {
    this.gameState.batSwing = true;
    this.gameState.swingTimer = 300;

    const ball = this.gameState.ball;
    const batter = this.gameState.batter;

    if (ball.state === 'pitching' && ball.x > this.gameState.field.width * 0.5) {
      const dx = ball.x - batter.x;
      const dy = ball.y - batter.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 60) {
        const hitPower = 10 + Math.random() * 8;
        const hitAngle = (Math.random() - 0.5) * Math.PI / 2;

        ball.velocity = {
          x: Math.cos(hitAngle) * hitPower,
          y: Math.sin(hitAngle) * hitPower - 5
        };
        ball.state = 'hit';
        ball.z = 30;

        const rand = Math.random();
        if (rand < 0.3) {
          this.gameState.hitResult = 'single';
        } else if (rand < 0.55) {
          this.gameState.hitResult = 'double';
        } else if (rand < 0.7) {
          this.gameState.hitResult = 'triple';
        } else if (rand < 0.85) {
          this.gameState.hitResult = 'home_run';
        } else if (rand < 0.95) {
          this.gameState.hitResult = 'fly_out';
        } else {
          this.gameState.hitResult = 'ground_out';
        }

        this.processHit(this.gameState.hitResult);
      } else if (ball.x > batter.x - 20) {
        this.gameState.strikes++;
        if (this.gameState.strikes >= 3) {
          this.gameState.outs++;
          this.gameState.hitResult = 'strikeout';
          setTimeout(() => this.nextAtBat(), 1500);
        }
      }
    }
  }

  processHit(type) {
    const runners = this.gameState.runners;

    switch (type) {
      case 'single':
        this.moveRunners(1);
        this.gameState.score.home++;
        break;
      case 'double':
        this.moveRunners(2);
        this.gameState.score.home += 2;
        break;
      case 'triple':
        this.moveRunners(3);
        this.gameState.score.home += 3;
        break;
      case 'home_run':
        this.moveRunners(4);
        this.gameState.score.home += 4;
        break;
      case 'fly_out':
        this.gameState.outs++;
        break;
      case 'ground_out':
        this.gameState.outs++;
        break;
    }

    this.gameState.bases = { first: false, second: false, third: false };
    this.gameState.runners = [];

    setTimeout(() => this.nextAtBat(), 1500);
  }

  moveRunners(bases) {
    const runners = [];
    let runs = 0;

    for (let i = 0; i < bases; i++) {
      runners.push({ base: 4, score: true });
      runs++;
    }

    this.gameState.runners = runners;
    this.gameState.score.home += runs;
  }

  pitch() {
    if (this.gameState.status !== 'pitching') return;

    const ball = this.gameState.ball;
    const pitcher = this.gameState.field.centerY;

    ball.x = this.gameState.field.centerX;
    ball.y = pitcher;
    ball.z = 0;

    const pitchTypes = ['fastball', 'curveball', 'slider'];
    this.gameState.pitchType = pitchTypes[Math.floor(Math.random() * pitchTypes.length)];

    const speeds = { fastball: 12, curveball: 9, slider: 10 };
    this.gameState.pitchSpeed = speeds[this.gameState.pitchType];

    const batterBox = this.gameState.batterBox[this.gameState.atBat % 2 === 0 ? 'left' : 'right'];
    const targetY = batterBox.y + (Math.random() - 0.5) * 30;
    const targetX = batterBox.x + (Math.random() - 0.5) * 30;

    const dx = targetX - ball.x;
    const dy = targetY - ball.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    ball.velocity = {
      x: (dx / dist) * this.gameState.pitchSpeed,
      y: (dy / dist) * this.gameState.pitchSpeed,
      z: 0
    };

    ball.state = 'pitching';
    this.gameState.pitchCount++;
    this.gameState.status = 'playing';
  }

  initGame() {
    const field = this.gameState.field;
    field.width = this.canvas.width;
    field.height = this.canvas.height;
    field.centerX = this.canvas.width / 2;
    field.centerY = this.canvas.height * 0.7;

    this.gameState.batterBox.left = {
      x: this.canvas.width * 0.65,
      y: this.canvas.height * 0.65,
      width: 30,
      height: 40
    };

    this.gameState.batterBox.right = {
      x: this.canvas.width * 0.35,
      y: this.canvas.height * 0.65,
      width: 30,
      height: 40
    };

    this.gameState.batter = {
      x: this.gameState.batterBox.left.x,
      y: this.gameState.batterBox.left.y,
      radius: 15,
      color: '#e74c3c',
      name: this.players[0]?.name || 'Batter',
      number: 1,
      state: 'ready'
    };

    this.gameState.ball = {
      x: field.centerX,
      y: field.centerY,
      z: 0,
      vx: 0,
      vy: 0,
      radius: 6,
      color: 'white',
      state: 'idle',
      rotation: 0
    };

    setTimeout(() => this.pitch(), 1000);
  }

  update(deltaTime) {
    if (this.gameState.status === 'paused') return;

    this.gameState.gameTime += deltaTime;

    if (this.gameState.batSwing) {
      this.gameState.swingTimer -= deltaTime;
      if (this.gameState.swingTimer <= 0) {
        this.gameState.batSwing = false;
      }
    }

    if (this.gameState.status === 'playing') {
      this.updateBall(deltaTime);
      this.updateBatter(deltaTime);
    }

    if (this.gameState.status === 'pitching') {
      setTimeout(() => this.pitch(), 1000);
      this.gameState.status = 'waiting';
    }
  }

  updateBall(deltaTime) {
    const ball = this.gameState.ball;
    const field = this.gameState.field;

    if (ball.state === 'pitching') {
      ball.x += ball.velocity.x;
      ball.y += ball.velocity.y;

      if (ball.y > this.gameState.batter.y - 10 && ball.y < this.gameState.batter.y + 10) {
        if (!this.gameState.batSwing) {
          this.gameState.strikes++;
          ball.state = 'missed';
          setTimeout(() => this.resetPitch(), 500);
        }
      }

      if (ball.y > this.canvas.height || ball.x < 0 || ball.x > this.canvas.width) {
        if (ball.state === 'pitching') {
          this.gameState.balls++;
          ball.state = 'missed';
          if (this.gameState.balls >= 4) {
            this.nextAtBat();
          } else {
            setTimeout(() => this.resetPitch(), 500);
          }
        }
      }
    } else if (ball.state === 'hit') {
      ball.x += ball.velocity.x;
      ball.y += ball.velocity.y;
      ball.velocity.y += 0.2;

      if (ball.y > this.canvas.height) {
        ball.state = 'dead';
      }
    }
  }

  updateBatter(deltaTime) {
    const ball = this.gameState.ball;
    const batter = this.gameState.batter;

    if (ball.state === 'hit') {
      batter.x += ball.velocity.x * 0.5;
      batter.y += ball.velocity.y * 0.3;
    }

    const box = this.gameState.atBat % 2 === 0 ?
      this.gameState.batterBox.left : this.gameState.batterBox.right;

    batter.x = box.x;
    batter.y = box.y;
  }

  resetPitch() {
    const ball = this.gameState.ball;
    ball.x = this.gameState.field.centerX;
    ball.y = this.gameState.field.centerY;
    ball.vx = 0;
    ball.vy = 0;
    ball.state = 'idle';
    ball.z = 0;

    this.gameState.status = 'pitching';
  }

  nextAtBat() {
    this.gameState.atBat++;
    this.gameState.strikes = 0;
    this.gameState.balls = 0;
    this.gameState.pitchCount = 0;
    this.gameState.hitResult = null;

    if (this.gameState.outs >= 3) {
      this.gameState.outs = 0;
      this.gameState.innings++;
    }

    const batterNumber = (this.gameState.atBat % 9) + 1;
    this.gameState.batter.number = batterNumber;

    this.resetPitch();
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawField(ctx);
    this.drawBases(ctx);
    this.drawBatter(ctx);
    this.drawBall(ctx);
    this.drawHUD(ctx);
    this.drawPitchZone(ctx);

    if (this.gameState.status === 'paused') {
      this.drawPauseScreen(ctx);
    }

    if (this.gameState.hitResult) {
      this.drawHitResult(ctx);
    }
  }

  drawField(ctx) {
    const field = this.gameState.field;

    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#2e7d32');
    gradient.addColorStop(1, '#1b5e20');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.ellipse(field.centerX, this.canvas.height * 0.55, 300, 200, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(field.centerX, field.centerY);
    ctx.lineTo(field.centerX - 200, this.canvas.height * 0.15);
    ctx.lineTo(field.centerX + 200, this.canvas.height * 0.15);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(field.centerX, field.centerY, 30, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(field.centerX - 50, this.canvas.height * 0.15);
    ctx.lineTo(field.centerX - 30, field.centerY);
    ctx.lineTo(field.centerX + 30, field.centerY);
    ctx.lineTo(field.centerX + 50, this.canvas.height * 0.15);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(field.centerX, this.canvas.height * 0.85, 80, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(139, 69, 19, 0.8)';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, this.canvas.width - 40, this.canvas.height - 40);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, this.canvas.width, 60);
  }

  drawBases(ctx) {
    const field = this.gameState.field;
    const baseSize = 25;

    ctx.fillStyle = this.gameState.bases.first ? '#f1c40f' : 'white';
    ctx.beginPath();
    ctx.roundRect(field.centerX + 40, field.centerY - 10, baseSize, baseSize, 3);
    ctx.fill();
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = this.gameState.bases.second ? '#f1c40f' : 'white';
    ctx.beginPath();
    ctx.roundRect(field.centerX - baseSize / 2, field.centerY - 40, baseSize, baseSize, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this.gameState.bases.third ? '#f1c40f' : 'white';
    ctx.beginPath();
    ctx.roundRect(field.centerX - 40 - baseSize, field.centerY - 10, baseSize, baseSize, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.roundRect(field.centerX - baseSize / 2, field.centerY - baseSize / 2, baseSize, baseSize, 3);
    ctx.fill();
  }

  drawBatter(ctx) {
    const batter = this.gameState.batter;

    ctx.save();

    ctx.beginPath();
    ctx.arc(batter.x, batter.y, batter.radius + 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
    ctx.fill();

    const gradient = ctx.createRadialGradient(
      batter.x - 3, batter.y - 3, 0,
      batter.x, batter.y, batter.radius
    );
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(1, '#e74c3c');

    ctx.beginPath();
    ctx.arc(batter.x, batter.y, batter.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(batter.number.toString(), batter.x, batter.y);

    const batAngle = this.gameState.batSwing ?
      Math.sin((300 - this.gameState.swingTimer) / 300 * Math.PI) * 1.5 : 0;

    ctx.save();
    ctx.translate(batter.x + 15, batter.y);
    ctx.rotate(batAngle);

    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(0, -3, 35, 6);
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(0, -3, 5, 6);

    ctx.restore();

    ctx.restore();
  }

  drawBall(ctx) {
    const ball = this.gameState.ball;

    ctx.save();

    if (ball.state === 'pitching' || ball.state === 'hit') {
      const shadowY = ball.z > 0 ? ball.z / 2 : 0;
      ctx.beginPath();
      ctx.ellipse(ball.x, ball.y + shadowY, ball.radius, ball.radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fill();
    }

    ctx.translate(ball.x, ball.y - ball.z);

    const gradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, ball.radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#e0e0e0');

    ctx.beginPath();
    ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-ball.radius * 0.7, 0);
    ctx.lineTo(ball.radius * 0.7, 0);
    ctx.stroke();

    ctx.restore();
  }

  drawPitchZone(ctx) {
    const batterBox = this.gameState.batterBox.left;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(
      batterBox.x - 20,
      batterBox.y - 20,
      50,
      40,
      5
    );
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Strike Zone', batterBox.x + 5, batterBox.y - 25);
  }

  drawHUD(ctx) {
    const field = this.gameState.field;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, this.canvas.width, 55);

    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Home: ${this.gameState.score.home}`, 20, 38);

    ctx.fillStyle = '#3498db';
    ctx.fillText(`Away: ${this.gameState.score.away}`, 140, 38);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Inning ${this.gameState.innings}`, this.canvas.width / 2, 35);

    ctx.fillStyle = this.gameState.status === 'pitching' ? '#2ecc71' : '#e74c3c';
    ctx.fillText(this.gameState.status.toUpperCase(), this.canvas.width / 2, 55);

    ctx.fillStyle = 'white';
    ctx.textAlign = 'right';
    ctx.fillText(`Outs: ${this.gameState.outs}`, this.canvas.width - 20, 35);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('S - Swing | Space - Pause', this.canvas.width / 2, this.canvas.height - 15);

    ctx.fillText(`Balls: ${this.gameState.balls} | Strikes: ${this.gameState.strikes}`, this.canvas.width / 2, this.canvas.height - 30);
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

  drawHitResult(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, this.canvas.height / 2 - 40, this.canvas.width, 80);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const resultColors = {
      'single': '#2ecc71',
      'double': '#3498db',
      'triple': '#9b59b6',
      'home_run': '#f1c40f',
      'fly_out': '#e74c3c',
      'ground_out': '#e74c3c',
      'strikeout': '#e74c3c'
    };

    const resultTexts = {
      'single': 'SINGLE!',
      'double': 'DOUBLE!',
      'triple': 'TRIPLE!',
      'home_run': 'HOME RUN!',
      'fly_out': 'FLY OUT',
      'ground_out': 'GROUND OUT',
      'strikeout': 'STRIKEOUT'
    };

    ctx.fillStyle = resultColors[this.gameState.hitResult] || 'white';
    ctx.fillText(resultTexts[this.gameState.hitResult], this.canvas.width / 2, this.canvas.height / 2);
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
      innings: this.gameState.innings,
      outs: this.gameState.outs,
      strikes: this.gameState.strikes,
      balls: this.gameState.balls,
      status: this.gameState.status
    };
  }
}

window.BaseballGame = BaseballGame;