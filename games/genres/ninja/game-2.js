// Complete Ninja Stealth Action Game
class NinjaStealthGame {
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
      player: null,
      enemies: [],
      guards: [],
      objectives: [],
      time: 0,
      score: 0,
      stealth: true,
      detected: false,
      detectionLevel: 0,
      status: 'playing'
    };

    this.initLevel();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 500;
  }

  initLevel() {
    this.gameState.player = {
      x: 50,
      y: 400,
      vx: 0,
      vy: 0,
      speed: 4,
      visible: true,
      hiding: false,
      hp: 100
    };

    this.gameState.enemies = [
      { x: 600, y: 100, type: 'patrol', path: [{x: 600, y: 100}, {x: 600, y: 400}], pathIndex: 0, dir: 1, viewAngle: 0.8 },
      { x: 400, y: 200, type: 'patrol', path: [{x: 400, y: 200}, {x: 400, y: 400}], pathIndex: 0, dir: 1, viewAngle: 0.8 },
      { x: 700, y: 350, type: 'stand', viewAngle: 1.2 }
    ];

    this.gameState.guards = [
      { x: 200, y: 150, angle: 0, viewRange: 150, state: 'alert' },
      { x: 500, y: 350, angle: Math.PI, viewRange: 120, state: 'idle' }
    ];

    this.gameState.objectives = [
      { x: 750, y: 80, type: 'target', taken: false },
      { x: 750, y: 420, type: 'target', taken: false },
      { x: 300, y: 450, type: 'exit', reached: false }
    ];
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  stop() { this.isRunning = false; }

  gameLoop(currentTime) {
    if (!this.isRunning) return;
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.033);
    this.lastTime = currentTime;
    this.update(dt);
    this.render();
    requestAnimationFrame(t => this.gameLoop(t));
  }

  update(dt) {
    this.gameState.time += dt;
    const player = this.gameState.player;

    const input = this.getPlayerInput();

    if (input.left) player.x -= player.speed;
    if (input.right) player.x += player.speed;
    if (input.up) player.y -= player.speed;
    if (input.down) player.y += player.speed;

    player.x = Math.max(20, Math.min(this.canvas.width - 20, player.x));
    player.y = Math.max(20, Math.min(this.canvas.height - 20, player.y));

    if (input.action && player.hiding) {
      player.visible = false;
    } else {
      player.visible = true;
    }

    this.gameState.enemies.forEach(e => {
      if (e.type === 'patrol') {
        const target = e.path[e.pathIndex];
        const dx = target.x - e.x;
        const dy = target.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 5) {
          e.pathIndex = (e.pathIndex + 1) % e.path.length;
        } else {
          e.x += (dx / dist) * e.dir * 2;
          e.y += (dy / dist) * e.dir * 2;
        }
      }

      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.abs(Math.atan2(dy, dx));

      if (dist < 100 && angle < e.viewAngle && player.visible) {
        this.gameState.detectionLevel += dt * 30;
      }
    });

    this.gameState.guards.forEach(g => {
      g.angle += 0.01;
      const dx = player.x - g.x;
      const dy = player.y - g.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < g.viewRange) {
        const angleDiff = Math.abs(Math.atan2(dy, dx) - g.angle);
        if (angleDiff < 0.5 && player.visible) {
          this.gameState.detectionLevel += dt * 50;
        }
      }
    });

    if (this.gameState.detectionLevel > 100) {
      this.gameState.detected = true;
      this.gameState.status = 'detected';
    }

    if (this.gameState.detectionLevel > 0 && !this.gameState.detected) {
      this.gameState.detectionLevel -= dt * 20;
    }

    this.gameState.objectives.forEach(obj => {
      const dx = obj.x - player.x;
      const dy = obj.y - player.y;
      if (Math.sqrt(dx * dx + dy * dy) < 30) {
        if (obj.type === 'target' && !obj.taken) {
          obj.taken = true;
          this.gameState.score += 100;
        }
        if (obj.type === 'exit') {
          obj.reached = true;
          this.gameState.score += 500;
          this.gameState.status = 'complete';
        }
      }
    });

    if (player.hp <= 0) {
      this.gameState.status = 'gameover';
    }
  }

  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#2d2d44';
    for (let x = 0; x < this.canvas.width; x += 80) {
      for (let y = 0; y < this.canvas.height; y += 60) {
        ctx.fillRect(x, y, 70, 50);
      }
    }

    this.gameState.enemies.forEach(e => {
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(e.x, e.y, 15, 0, Math.PI * 2);
      ctx.fill();

      const gradient = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, 80);
      gradient.addColorStop(0, 'rgba(231, 76, 60, 0.3)');
      gradient.addColorStop(1, 'rgba(231, 76, 60, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.arc(e.x, e.y, 80, -e.viewAngle, e.viewAngle);
      ctx.fill();
    });

    this.gameState.guards.forEach(g => {
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.angle);

      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, g.viewRange);
      gradient.addColorStop(0, 'rgba(243, 156, 18, 0.2)');
      gradient.addColorStop(1, 'rgba(243, 156, 18, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, g.viewRange, -0.4, 0.4);
      ctx.fill();

      ctx.restore();
    });

    this.gameState.objectives.forEach(obj => {
      if (obj.type === 'target' && obj.taken) return;
      ctx.fillStyle = obj.type === 'target' ? '#2ecc71' : '#3498db';
      ctx.beginPath();
      ctx.arc(obj.x, obj.y, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(obj.type === 'target' ? 'T' : 'E', obj.x, obj.y + 4);
    });

    const player = this.gameState.player;
    ctx.save();
    ctx.translate(player.x, player.y);

    if (player.visible) {
      ctx.fillStyle = '#3498db';
      ctx.fillRect(-10, -20, 20, 30);

      ctx.fillStyle = '#f4a460';
      ctx.beginPath();
      ctx.arc(0, -25, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.fillRect(-6, -28, 4, 3);
      ctx.fillRect(2, -28, 4, 3);

      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(-12, -15, 5, 15);
      ctx.fillRect(7, -15, 5, 15);
    }

    ctx.restore();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 150, 70);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('NINJA STEALTH', 20, 28);
    ctx.fillText(`Score: ${this.gameState.score}`, 20, 50);

    const detection = this.gameState.detectionLevel;
    ctx.fillStyle = '#333';
    ctx.fillRect(20, 60, 100, 12);
    if (detection < 30) {
      ctx.fillStyle = '#2ecc71';
    } else if (detection < 70) {
      ctx.fillStyle = '#f39c12';
    } else {
      ctx.fillStyle = '#e74c3c';
    }
    ctx.fillRect(20, 60, detection, 12);

    if (this.gameState.status === 'detected') {
      ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('DETECTED!', this.canvas.width / 2, this.canvas.height / 2);
    }

    if (this.gameState.status === 'complete') {
      ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#2ecc71';
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('MISSION COMPLETE!', this.canvas.width / 2, this.canvas.height / 2);
      ctx.fillStyle = '#fff';
      ctx.font = '24px Arial';
      ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
    }

    if (this.gameState.status === 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 50px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
    }
  }

  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.NinjaStealthGame = NinjaStealthGame;