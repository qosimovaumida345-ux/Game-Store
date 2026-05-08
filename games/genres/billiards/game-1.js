// Complete Billiards Pool Game
class PoolGame {
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
      balls: [],
      cue: null,
      power: 0,
      aiming: true,
      shotInProgress: false,
      score: 0,
      pocketed: [],
      status: 'playing'
    };

    this.initTable();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 450;
  }

  initTable() {
    const tableWidth = 700;
    const tableHeight = 350;
    const startX = 50;
    const startY = 50;

    this.gameState.balls = [];
    const colors = ['#ffff00', '#0000ff', '#ff0000', '#800080', '#ff6600', '#008000', '#800000', '#000000'];

    this.gameState.balls.push({ x: startX + 400, y: startY + 175, vx: 0, vy: 0, color: '#fff', radius: 12, number: 0 });

    let ballNum = 1;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col <= row; col++) {
        const x = startX + 420 + row * 24;
        const y = startY + 175 - row * 12 + col * 24;
        this.gameState.balls.push({ x, y, vx: 0, vy: 0, color: colors[ballNum % colors.length], radius: 12, number: ballNum });
        ballNum++;
      }
    }

    this.gameState.pockets = [
      { x: startX, y: startY },
      { x: startX + tableWidth / 2, y: startY - 10 },
      { x: startX + tableWidth, y: startY },
      { x: startX, y: startY + tableHeight },
      { x: startX + tableWidth / 2, y: startY + tableHeight + 10 },
      { x: startX + tableWidth, y: startY + tableHeight }
    ];

    this.gameState.cue = { x: startX + 400, y: startY + 175, angle: 0 };
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  stop() { this.isRunning = false; }

  gameLoop(currentTime) {
    if (!this.isRunning) return;
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.016);
    this.lastTime = currentTime;
    this.update(dt);
    this.render();
    requestAnimationFrame(t => this.gameLoop(t));
  }

  update(dt) {
    const input = this.getPlayerInput();
    const cue = this.gameState.cue;
    const whiteBall = this.gameState.balls[0];

    if (this.gameState.aiming && !this.gameState.shotInProgress) {
      if (input.left) cue.angle -= 3 * dt;
      if (input.right) cue.angle += 3 * dt;

      if (input.up) this.gameState.power = Math.min(100, this.gameState.power + 40 * dt);
      if (input.down) this.gameState.power = Math.max(0, this.gameState.power - 40 * dt);

      if (input.action) {
        const speed = this.gameState.power * 0.25;
        whiteBall.vx = Math.cos(cue.angle) * speed;
        whiteBall.vy = Math.sin(cue.angle) * speed;
        this.gameState.aiming = false;
        this.gameState.shotInProgress = true;
        this.gameState.power = 0;
      }
    }

    if (this.gameState.shotInProgress) {
      let moving = false;
      this.gameState.balls.forEach(ball => {
        if (Math.abs(ball.vx) > 0.1 || Math.abs(ball.vy) > 0.1) {
          moving = true;
          ball.x += ball.vx;
          ball.y += ball.vy;
          ball.vx *= 0.985;
          ball.vy *= 0.985;

          if (ball.x < 70 || ball.x > 730) { ball.vx *= -0.8; ball.x = Math.max(70, Math.min(730, ball.x)); }
          if (ball.y < 70 || ball.y > 380) { ball.vy *= -0.8; ball.y = Math.max(70, Math.min(380, ball.y)); }

          for (let other of this.gameState.balls) {
            if (other === ball) continue;
            const dx = other.x - ball.x;
            const dy = other.y - ball.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 24) {
              const angle = Math.atan2(dy, dx);
              const tempVx = ball.vx;
              const tempVy = ball.vy;
              ball.vx = other.vx * Math.cos(angle) + Math.sin(angle);
              ball.vy = other.vy * Math.cos(angle) + Math.sin(angle);
              other.vx = tempVx * Math.cos(angle) + Math.sin(angle);
              other.vy = tempVy * Math.cos(angle) + Math.sin(angle);
            }
          }
        }
      });

      this.gameState.pockets.forEach(pocket => {
        this.gameState.balls.forEach((ball, i) => {
          const dx = ball.x - pocket.x;
          const dy = ball.y - pocket.y;
          if (Math.sqrt(dx * dx + dy * dy) < 20) {
            if (ball.number === 0) {
              ball.x = 400;
              ball.y = 225;
              ball.vx = 0;
              ball.vy = 0;
            } else {
              this.gameState.balls.splice(i, 1);
              this.gameState.pocketed.push(ball);
              this.gameState.score += ball.number * 10;
            }
          }
        });
      });

      if (!moving) {
        this.gameState.shotInProgress = false;
        this.gameState.aiming = true;
        cue.x = this.gameState.balls[0].x;
        cue.y = this.gameState.balls[0].y;
      }
    } else {
      cue.x = whiteBall.x;
      cue.y = whiteBall.y;
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a472a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#2d5a3d';
    ctx.fillRect(50, 50, 700, 350);

    ctx.fillStyle = '#8B4513';
    ctx.fillRect(40, 40, 720, 370);
    ctx.fillStyle = '#2d5a3d';
    ctx.fillRect(50, 50, 700, 350);

    ctx.fillStyle = '#000';
    this.gameState.pockets.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
      ctx.fill();
    });

    this.gameState.balls.forEach(ball => {
      const gradient = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 0, ball.x, ball.y, ball.radius);
      gradient.addColorStop(0, ball.color);
      gradient.addColorStop(1, '#000');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      if (ball.number > 0) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(ball.number, ball.x, ball.y + 4);
      }
    });

    if (this.gameState.aiming && !this.gameState.shotInProgress) {
      const cue = this.gameState.cue;
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cue.x - Math.cos(cue.angle) * 30, cue.y - Math.sin(cue.angle) * 30);
      ctx.lineTo(cue.x - Math.cos(cue.angle) * (80 + this.gameState.power * 0.5), cue.y - Math.sin(cue.angle) * (80 + this.gameState.power * 0.5));
      ctx.stroke();

      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(cue.x, cue.y);
      ctx.lineTo(cue.x + Math.cos(cue.angle) * 100, cue.y + Math.sin(cue.angle) * 100);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 120, 50);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    ctx.fillText(`Balls: ${this.gameState.balls.length - 1}`, 20, 50);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, this.canvas.height - 40, 180, 30);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(20, this.canvas.height - 35, 160 * (this.gameState.power / 100), 20);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Power: ${Math.floor(this.gameState.power)}%`, 100, this.canvas.height - 20);
  }

  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }

  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.PoolGame = PoolGame;