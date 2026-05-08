// Golf Master - Mini Golf Game
class GolfGame {
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
      strokes: 0,
      par: 3,
      status: 'aiming',
      ball: null,
      hole: null,
      course: { width: 0, height: 0 },
      power: 0,
      isPowering: false,
      aimAngle: 0,
      gameTime: 0,
      holes: [],
      currentHole: 0,
      totalHoles: 9,
      ballHistory: [],
      inHole: false,
      holeComplete: false
    };

    this.mouse = { x: 0, y: 0, pressed: false };
    this.keys = {};

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
        const ball = this.gameState.ball;
        this.gameState.aimAngle = Math.atan2(this.mouse.y - ball.y, this.mouse.x - ball.x);
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.pressed = false;

      if (this.gameState.isPowering && this.gameState.status === 'aiming') {
        this.shoot();
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
    if (this.gameState.status === 'playing' || this.gameState.status === 'aiming') {
      this.gameState.status = 'paused';
    } else if (this.gameState.status === 'paused') {
      this.gameState.status = 'aiming';
    }
  }

  shoot() {
    if (!this.gameState.isPowering) return;

    const ball = this.gameState.ball;
    const power = Math.min(this.gameState.power, 100) / 100;
    const shotPower = 5 + power * 12;

    ball.velocity = {
      x: Math.cos(this.gameState.aimAngle) * shotPower,
      y: Math.sin(this.gameState.aimAngle) * shotPower
    };

    ball.state = 'moving';
    this.gameState.strokes++;
    this.gameState.isPowering = false;
    this.gameState.status = 'playing';
  }

  initGame() {
    const course = this.gameState.course;
    course.width = this.canvas.width;
    course.height = this.canvas.height;

    this.generateHoles();
    this.loadHole(0);
  }

  generateHoles() {
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.gameState.holes = [
      { start: { x: 100, y: height - 100 }, end: { x: width - 100, y: 100 }, par: 3, obstacles: [] },
      { start: { x: 100, y: 100 }, end: { x: width - 100, y: height - 100 }, par: 3, obstacles: [] },
      { start: { x: width / 2, y: height - 80 }, end: { x: width / 2, y: 80 }, par: 3, obstacles: [{ x: width / 2 - 50, y: height / 2, w: 100, h: 40, type: 'wall' }] },
      { start: { x: 80, y: height / 2 }, end: { x: width - 80, y: height / 2 }, par: 3, obstacles: [{ x: width / 2, y: height / 2 - 60, w: 30, h: 120, type: 'wall' }] },
      { start: { x: 100, y: height - 100 }, end: { x: width - 100, y: 80 }, par: 4, obstacles: [{ x: 300, y: 200, w: 80, h: 80, type: 'block' }, { x: 600, y: 400, w: 80, h: 80, type: 'block' }] },
      { start: { x: width - 100, y: height - 100 }, end: { x: 100, y: 80 }, par: 4, obstacles: [{ x: 200, y: height - 200, w: 60, h: 150, type: 'wall' }, { x: 600, y: 250, w: 60, h: 150, type: 'wall' }] },
      { start: { x: 100, y: height / 2 }, end: { x: width - 100, y: 100 }, par: 3, obstacles: [{ x: width / 2, y: height / 2, r: 60, type: 'circle' }] },
      { start: { x: width / 2, y: height - 80 }, end: { x: 100, y: 100 }, par: 4, obstacles: [{ x: 250, y: 350, w: 40, h: 200, type: 'wall' }, { x: 450, y: 200, w: 40, h: 200, type: 'wall' }, { x: 650, y: 350, w: 40, h: 200, type: 'wall' }] },
      { start: { x: 150, y: height - 80 }, end: { x: width - 150, y: 80 }, par: 5, obstacles: [{ x: 300, y: 450, r: 40, type: 'circle' }, { x: 450, y: 250, r: 50, type: 'circle' }, { x: 600, y: 400, w: 70, h: 70, type: 'block' }, { x: 750, y: 150, r: 45, type: 'circle' }] }
    ];
  }

  loadHole(index) {
    if (index >= this.gameState.holes.length) {
      this.gameState.holeComplete = true;
      return;
    }

    const hole = this.gameState.holes[index];
    const course = this.gameState.course;

    this.gameState.ball = {
      x: hole.start.x,
      y: hole.start.y,
      vx: 0,
      vy: 0,
      radius: 10,
      friction: 0.97,
      minSpeed: 0.1,
      state: 'idle',
      color: 'white'
    };

    this.gameState.hole = {
      x: hole.end.x,
      y: hole.end.y,
      radius: 15,
      depth: 20
    };

    this.gameState.par = hole.par;
    this.gameState.strokes = 0;
    this.gameState.status = 'aiming';
    this.gameState.inHole = false;
    this.gameState.ballHistory = [];
  }

  update(deltaTime) {
    if (this.gameState.status === 'paused') return;

    this.gameState.gameTime += deltaTime;

    if (this.gameState.isPowering) {
      this.gameState.power = Math.min(this.gameState.power + deltaTime / 15, 100);
    }

    this.updateBall(deltaTime);
    this.checkHole();
    this.checkObstacles();
  }

  updateBall(deltaTime) {
    const ball = this.gameState.ball;
    const course = this.gameState.course;

    if (ball.state !== 'moving') return;

    ball.x += ball.vx;
    ball.y += ball.vy;

    ball.vx *= ball.friction;
    ball.vy *= ball.friction;

    if (ball.x - ball.radius < 20) {
      ball.x = 20 + ball.radius;
      ball.vx *= -0.8;
    }
    if (ball.x + ball.radius > course.width - 20) {
      ball.x = course.width - 20 - ball.radius;
      ball.vx *= -0.8;
    }
    if (ball.y - ball.radius < 60) {
      ball.y = 60 + ball.radius;
      ball.vy *= -0.8;
    }
    if (ball.y + ball.radius > course.height - 20) {
      ball.y = course.height - 20 - ball.radius;
      ball.vy *= -0.8;
    }

    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (speed < ball.minSpeed) {
      ball.vx = 0;
      ball.vy = 0;
      ball.state = 'idle';

      if (!this.gameState.inHole) {
        this.gameState.status = 'aiming';
      }
    }
  }

  checkObstacles() {
    const hole = this.gameState.holes[this.gameState.currentHole];
    if (!hole.obstacles) return;

    const ball = this.gameState.ball;

    for (let obs of hole.obstacles) {
      if (obs.type === 'block') {
        this.checkBlockCollision(ball, obs);
      } else if (obs.type === 'wall') {
        this.checkWallCollision(ball, obs);
      } else if (obs.type === 'circle') {
        this.checkCircleCollision(ball, obs);
      }
    }
  }

  checkBlockCollision(ball, block) {
    const closestX = Math.max(block.x, Math.min(ball.x, block.x + block.w));
    const closestY = Math.max(block.y, Math.min(ball.y, block.y + block.h));

    const dx = ball.x - closestX;
    const dy = ball.y - closestY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < ball.radius) {
      const angle = Math.atan2(dy, dx);
      const overlap = ball.radius - dist;

      if (dist === 0) {
        ball.vx *= -0.8;
        ball.vy *= -0.8;
      } else {
        ball.x += Math.cos(angle) * overlap;
        ball.y += Math.sin(angle) * overlap;

        const dotProduct = ball.vx * Math.cos(angle) + ball.vy * Math.sin(angle);
        ball.vx -= 2 * dotProduct * Math.cos(angle) * 0.8;
        ball.vy -= 2 * dotProduct * Math.sin(angle) * 0.8;
      }
    }
  }

  checkWallCollision(ball, wall) {
    const closestX = Math.max(wall.x, Math.min(ball.x, wall.x + wall.w));
    const closestY = Math.max(wall.y, Math.min(ball.y, wall.y + wall.h));

    const dx = ball.x - closestX;
    const dy = ball.y - closestY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < ball.radius) {
      const angle = Math.atan2(dy, dx);
      const overlap = ball.radius - dist;

      if (dist === 0) {
        ball.vx *= -0.7;
        ball.vy *= -0.7;
      } else {
        ball.x += Math.cos(angle) * overlap;
        ball.y += Math.sin(angle) * overlap;

        const dotProduct = ball.vx * Math.cos(angle) + ball.vy * Math.sin(angle);
        ball.vx -= 2 * dotProduct * Math.cos(angle) * 0.7;
        ball.vy -= 2 * dotProduct * Math.sin(angle) * 0.7;
      }
    }
  }

  checkCircleCollision(ball, circle) {
    const dx = ball.x - circle.x;
    const dy = ball.y - circle.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = ball.radius + circle.r;

    if (dist < minDist) {
      const angle = Math.atan2(dy, dx);
      const overlap = minDist - dist;

      ball.x += Math.cos(angle) * overlap;
      ball.y += Math.sin(angle) * overlap;

      const dotProduct = ball.vx * Math.cos(angle) + ball.vy * Math.sin(angle);
      ball.vx -= 2 * dotProduct * Math.cos(angle) * 0.75;
      ball.vy -= 2 * dotProduct * Math.sin(angle) * 0.75;
    }
  }

  checkHole() {
    const ball = this.gameState.ball;
    const hole = this.gameState.hole;

    const dx = ball.x - hole.x;
    const dy = ball.y - hole.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);

    if (dist < hole.radius - 5 && speed < 8) {
      this.gameState.inHole = true;
      this.gameState.status = 'hole_complete';

      setTimeout(() => {
        this.gameState.currentHole++;
        if (this.gameState.currentHole < this.gameState.totalHoles) {
          this.loadHole(this.gameState.currentHole);
        } else {
          this.gameState.holeComplete = true;
        }
      }, 1500);
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawCourse(ctx);
    this.drawObstacles(ctx);
    this.drawHole(ctx);
    this.drawBall(ctx);
    this.drawAimIndicator(ctx);
    this.drawHUD(ctx);

    if (this.gameState.status === 'paused') {
      this.drawPauseScreen(ctx);
    }

    if (this.gameState.holeComplete) {
      this.drawEndScreen(ctx);
    }
  }

  drawCourse(ctx) {
    const course = this.gameState.course;

    const gradient = ctx.createLinearGradient(0, 0, 0, course.height);
    gradient.addColorStop(0, '#4caf50');
    gradient.addColorStop(1, '#388e3c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, course.width, course.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 20;
    ctx.strokeRect(20, 60, course.width - 40, course.height - 80);

    ctx.fillStyle = '#81c784';
    ctx.fillRect(30, 70, course.width - 60, course.height - 100);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;

    for (let i = 0; i < 30; i++) {
      for (let j = 0; j < 20; j++) {
        const x = 50 + i * 28;
        const y = 80 + j * 28;
        if (Math.random() > 0.7) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(0, 0, course.width, 50);

    ctx.fillStyle = '#4caf50';
    for (let i = 0; i < course.width; i += 8) {
      ctx.fillRect(i, 50, 4, 15);
    }
  }

  drawObstacles(ctx) {
    const hole = this.gameState.holes[this.gameState.currentHole];
    if (!hole || !hole.obstacles) return;

    for (let obs of hole.obstacles) {
      if (obs.type === 'block') {
        const gradient = ctx.createLinearGradient(obs.x, obs.y, obs.x + obs.w, obs.y + obs.h);
        gradient.addColorStop(0, '#8d6e63');
        gradient.addColorStop(1, '#5d4037');
        ctx.fillStyle = gradient;
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 3;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      } else if (obs.type === 'wall') {
        const gradient = ctx.createLinearGradient(obs.x, obs.y, obs.x + obs.w, obs.y + obs.h);
        gradient.addColorStop(0, '#bdbdbd');
        gradient.addColorStop(1, '#757575');
        ctx.fillStyle = gradient;
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

        ctx.strokeStyle = '#424242';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      } else if (obs.type === 'circle') {
        const gradient = ctx.createRadialGradient(obs.x - obs.r/3, obs.y - obs.r/3, 0, obs.x, obs.y, obs.r);
        gradient.addColorStop(0, '#ef5350');
        gradient.addColorStop(1, '#c62828');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#b71c1c';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
  }

  drawHole(ctx) {
    const hole = this.gameState.hole;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(hole.x + 5, hole.y + 5, hole.radius, 0, Math.PI * 2);
    ctx.fill();

    const gradient = ctx.createRadialGradient(hole.x - 3, hole.y - 3, 0, hole.x, hole.y, hole.radius);
    gradient.addColorStop(0, '#212121');
    gradient.addColorStop(1, '#000');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffc107';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('HOLE', hole.x, hole.y - hole.radius - 10);
  }

  drawBall(ctx) {
    const ball = this.gameState.ball;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(ball.x + 3, ball.y + 5, ball.radius, ball.radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    const gradient = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 0, ball.x, ball.y, ball.radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#e0e0e0');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ball.x - ball.radius * 0.6, ball.y);
    ctx.lineTo(ball.x + ball.radius * 0.6, ball.y);
    ctx.stroke();
  }

  drawAimIndicator(ctx) {
    if (this.gameState.status !== 'aiming') return;

    const ball = this.gameState.ball;
    const power = Math.min(this.gameState.power, 100) / 100;
    const lineLength = 50 + power * 100;

    ctx.strokeStyle = `rgba(255, ${255 - power * 255}, 0, 0.8)`;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);

    ctx.beginPath();
    ctx.moveTo(ball.x, ball.y);
    ctx.lineTo(
      ball.x + Math.cos(this.gameState.aimAngle) * lineLength,
      ball.y + Math.sin(this.gameState.aimAngle) * lineLength
    );
    ctx.stroke();

    ctx.setLineDash([]);

    const arrowX = ball.x + Math.cos(this.gameState.aimAngle) * lineLength;
    const arrowY = ball.y + Math.sin(this.gameState.aimAngle) * lineLength;

    ctx.fillStyle = `rgba(255, ${255 - power * 255}, 0, 0.9)`;
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(
      arrowX - Math.cos(this.gameState.aimAngle - 0.4) * 15,
      arrowY - Math.sin(this.gameState.aimAngle - 0.4) * 15
    );
    ctx.lineTo(
      arrowX - Math.cos(this.gameState.aimAngle + 0.4) * 15,
      arrowY - Math.sin(this.gameState.aimAngle + 0.4) * 15
    );
    ctx.closePath();
    ctx.fill();

    const indicatorX = ball.x;
    const indicatorY = ball.y - 40;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(indicatorX - 50, indicatorY - 20, 100, 40);

    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Power', indicatorX, indicatorY - 5);

    ctx.fillStyle = '#333';
    ctx.fillRect(indicatorX - 40, indicatorY + 5, 80, 10);

    const powerColor = power < 0.5 ? '#2ecc71' : (power < 0.8 ? '#f1c40f' : '#e74c3c');
    ctx.fillStyle = powerColor;
    ctx.fillRect(indicatorX - 40, indicatorY + 5, 80 * power, 10);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeRect(indicatorX - 40, indicatorY + 5, 80, 10);
  }

  drawHUD(ctx) {
    const course = this.gameState.course;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, course.width, 50);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Hole ${this.gameState.currentHole + 1} / ${this.gameState.totalHoles}`, 20, 35);

    ctx.textAlign = 'center';
    ctx.fillText(`Par ${this.gameState.par}`, course.width / 2 - 50, 35);

    ctx.fillStyle = '#f39c12';
    ctx.fillText(`Strokes: ${this.gameState.strokes}`, course.width / 2 + 50, 35);

    ctx.fillStyle = this.gameState.strokes <= this.gameState.par ? '#2ecc71' : '#e74c3c';
    const overUnder = this.gameState.strokes - this.gameState.par;
    const scoreText = overUnder === 0 ? 'E' : (overUnder > 0 ? `+${overUnder}` : `${overUnder}`);
    ctx.font = 'bold 20px Arial';
    ctx.fillText(scoreText, course.width - 80, 35);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Click & Hold - Power | Mouse - Aim | Release - Shoot', course.width / 2, course.height - 15);
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

  drawEndScreen(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME COMPLETE!', this.canvas.width / 2, this.canvas.height / 2 - 80);

    ctx.fillStyle = 'white';
    ctx.font = '32px Arial';
    ctx.fillText(`Total Strokes: ${this.gameState.strokes}`, this.canvas.width / 2, this.canvas.height / 2);

    const totalPar = this.gameState.holes.reduce((sum, h) => sum + h.par, 0);
    const diff = this.gameState.strokes - totalPar;
    const result = diff === 0 ? 'Even Par' : (diff > 0 ? `+${diff} Over Par` : `${Math.abs(diff)} Under Par`);
    ctx.font = '24px Arial';
    ctx.fillText(result, this.canvas.width / 2, this.canvas.height / 2 + 40);
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
      score: this.gameState.strokes,
      currentHole: this.gameState.currentHole,
      par: this.gameState.par,
      status: this.gameState.status
    };
  }
}

window.GolfGame = GolfGame;