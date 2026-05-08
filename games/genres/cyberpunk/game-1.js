// Complete Cyberpunk Runner Game
class CyberpunkRunnerGame {
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
      obstacles: [],
      powerups: [],
      buildings: [],
      score: 0,
      distance: 0,
      speed: 8,
      lane: 1,
      boost: 0,
      time: 0,
      status: 'playing'
    };

    this.initGame();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 450;
  }

  initGame() {
    this.gameState.player = {
      x: 400,
      y: 350,
      lane: 1,
      jumping: false,
      jumpVel: 0,
      onGround: true,
      shield: 0,
      score: 0
    };

    this.gameState.lanes = [200, 400, 600];

    for (let i = 0; i < 15; i++) {
      this.gameState.buildings.push({
        x: i * 150 + Math.random() * 50,
        height: 100 + Math.random() * 200,
        width: 80 + Math.random() * 60,
        color: this.getRandomNeonColor()
      });
    }
  }

  getRandomNeonColor() {
    const colors = ['#ff00ff', '#00ffff', '#ff0066', '#00ff66', '#ffff00'];
    return colors[Math.floor(Math.random() * colors.length)];
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
    this.gameState.speed = 8 + this.gameState.distance / 1000;
    this.gameState.distance += this.gameState.speed * dt * 10;
    this.gameState.score = Math.floor(this.gameState.distance / 10);

    if (this.gameState.player.shield > 0) {
      this.gameState.player.shield -= dt;
    }

    const input = this.getPlayerInput();

    if (input.left && !this.gameState.player.jumping) {
      this.gameState.player.lane = Math.max(0, this.gameState.player.lane - 1);
    }
    if (input.right && !this.gameState.player.jumping) {
      this.gameState.player.lane = Math.min(2, this.gameState.player.lane + 1);
    }

    const targetX = this.gameState.lanes[this.gameState.player.lane];
    const player = this.gameState.player;
    player.x += (targetX - player.x) * 10 * dt;

    if (input.up && player.onGround && !player.jumping) {
      player.jumping = true;
      player.onGround = false;
      player.jumpVel = 15;
    }

    if (player.jumping) {
      player.y -= player.jumpVel;
      player.jumpVel -= 30 * dt;

      if (player.y >= 350) {
        player.y = 350;
        player.jumping = false;
        player.onGround = true;
        player.jumpVel = 0;
      }
    }

    this.gameState.buildings.forEach(b => {
      b.x -= this.gameState.speed * dt * 60;
      if (b.x + b.width < 0) {
        b.x = this.canvas.width + Math.random() * 100;
        b.height = 100 + Math.random() * 200;
        b.color = this.getRandomNeonColor();
      }
    });

    if (Math.random() < 0.03) {
      const lane = Math.floor(Math.random() * 3);
      const type = Math.random() < 0.3 ? 'barrier' : 'spike';
      this.gameState.obstacles.push({
        x: this.canvas.width + 50,
        lane: lane,
        y: this.gameState.lanes[lane],
        type: type,
        width: 40,
        height: type === 'barrier' ? 60 : 20
      });
    }

    this.gameState.obstacles = this.gameState.obstacles.filter(o => {
      o.x -= this.gameState.speed * dt * 60;

      const dx = player.x - o.x;
      const dy = player.y - o.y + 15;
      const hitDist = 35;

      if (Math.abs(dx) < hitDist && Math.abs(dy) < hitDist && player.y < 360) {
        if (player.shield > 0) {
          player.shield = 0;
          return false;
        }
        this.gameState.status = 'gameover';
      }

      return o.x > -50;
    });

    if (Math.random() < 0.01) {
      const lane = Math.floor(Math.random() * 3);
      this.gameState.powerups.push({
        x: this.canvas.width + 50,
        lane: lane,
        y: this.gameState.lanes[lane],
        type: Math.random() < 0.5 ? 'shield' : 'score'
      });
    }

    this.gameState.powerups = this.gameState.powerups.filter(p => {
      p.x -= this.gameState.speed * dt * 60;

      const dx = player.x - p.x;
      const dy = player.y - p.y;

      if (Math.abs(dx) < 30 && Math.abs(dy) < 30) {
        if (p.type === 'shield') {
          player.shield = 5;
        } else {
          this.gameState.score += 500;
        }
        return false;
      }

      return p.x > -30;
    });
  }

  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }

  render() {
    const ctx = this.ctx;

    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(0.5, '#1a0a2a');
    gradient.addColorStop(1, '#0a1a2a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < 3; i++) {
      const laneY = this.gameState.lanes[i];
      ctx.strokeStyle = '#00ffff';
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, laneY + 30);
      ctx.lineTo(this.canvas.width, laneY + 30);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    this.gameState.buildings.forEach(b => {
      const buildingGradient = ctx.createLinearGradient(b.x, this.canvas.height - b.height, b.x, this.canvas.height);
      buildingGradient.addColorStop(0, b.color);
      buildingGradient.addColorStop(1, '#1a0a1a');
      ctx.fillStyle = buildingGradient;
      ctx.fillRect(b.x, this.canvas.height - b.height, b.width, b.height);

      for (let wy = 10; wy < b.height - 20; wy += 30) {
        for (let wx = 10; wx < b.width - 15; wx += 25) {
          if (Math.random() > 0.3) {
            ctx.fillStyle = Math.random() > 0.5 ? '#ffff00' : '#00ffff';
            ctx.globalAlpha = 0.5 + Math.random() * 0.5;
            ctx.fillRect(b.x + wx, this.canvas.height - b.height + wy, 15, 20);
          }
        }
      }
      ctx.globalAlpha = 1;
    });

    this.gameState.obstacles.forEach(o => {
      if (o.type === 'barrier') {
        ctx.fillStyle = '#ff0066';
        ctx.fillRect(o.x - 20, o.y - 30, 40, 60);
        ctx.fillStyle = '#ff66b2';
        ctx.fillRect(o.x - 15, o.y - 25, 30, 50);
      } else {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + 10);
        ctx.lineTo(o.x - 20, o.y + 10);
        ctx.lineTo(o.x, o.y - 10);
        ctx.lineTo(o.x + 20, o.y + 10);
        ctx.closePath();
        ctx.fill();
      }
    });

    this.gameState.powerups.forEach(p => {
      ctx.fillStyle = p.type === 'shield' ? '#00ffff' : '#ffff00';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(p.type === 'shield' ? 'S' : '+', p.x, p.y + 5);
    });

    const player = this.gameState.player;

    if (player.shield > 0) {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.5 + Math.sin(this.gameState.time * 10) * 0.3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.save();
    ctx.translate(player.x, player.y);

    if (player.jumping) {
      ctx.rotate(-0.1);
    }

    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(-15, 25);
    ctx.lineTo(15, 25);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(0, -35, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.fillRect(-6, -40, 5, 4);
    ctx.fillRect(1, -40, 5, 4);

    ctx.fillStyle = '#fff';
    ctx.fillRect(-4, -38, 2, 2);
    ctx.fillRect(3, -38, 2, 2);

    ctx.restore();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 160, 70);
    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Distance: ${Math.floor(this.gameState.distance)}m`, 20, 35);
    ctx.fillText(`Score: ${this.gameState.score}`, 20, 60);

    ctx.fillStyle = '#00ffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    const speedDisplay = Math.floor(this.gameState.speed * 10);
    ctx.fillText(`Speed: ${speedDisplay} km/h`, this.canvas.width - 20, 30);

    if (this.gameState.status === 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#ff0066';
      ctx.font = 'bold 50px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
      ctx.fillStyle = '#fff';
      ctx.font = '24px Arial';
      ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
  }

  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.CyberpunkRunnerGame = CyberpunkRunnerGame;