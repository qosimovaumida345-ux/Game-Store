// Complete IO Game - Agar.io Style
class AgarIOGame {
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
      blobs: [],
      food: [],
      zoom: 1,
      cameraX: 0,
      cameraY: 0,
      time: 0,
      score: 0,
      status: 'playing'
    };

    this.worldSize = 3000;
    this.initGame();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }

  initGame() {
    this.gameState.player = {
      x: this.worldSize / 2,
      y: this.worldSize / 2,
      radius: 30,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
      speed: 4
    };

    for (let i = 0; i < 200; i++) {
      this.spawnFood();
    }

    for (let i = 0; i < 30; i++) {
      this.spawnAIBlob();
    }
  }

  spawnFood() {
    this.gameState.food.push({
      x: Math.random() * this.worldSize,
      y: Math.random() * this.worldSize,
      radius: 5 + Math.random() * 5,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16)
    });
  }

  spawnAIBlob() {
    this.gameState.blobs.push({
      x: Math.random() * this.worldSize,
      y: Math.random() * this.worldSize,
      radius: 20 + Math.random() * 40,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
      targetX: Math.random() * this.worldSize,
      targetY: Math.random() * this.worldSize,
      speed: 2 + Math.random() * 2
    });
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
    const dx = input.x || 0;
    const dy = input.y || 0;

    if (dx !== 0 || dy !== 0) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = Math.max(1, player.speed * (20 / player.radius));
      player.x += (dx / dist) * speed;
      player.y += (dy / dist) * speed;
    }

    player.x = Math.max(player.radius, Math.min(this.worldSize - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(this.worldSize - player.radius, player.y));

    this.gameState.cameraX = player.x - this.canvas.width / 2;
    this.gameState.cameraY = player.y - this.canvas.height / 2;

    this.gameState.food = this.gameState.food.filter(f => {
      const fdx = f.x - player.x;
      const fdy = f.y - player.y;
      if (Math.sqrt(fdx * fdx + fdy * fdy) < player.radius) {
        player.radius += 0.5;
        this.gameState.score += 5;
        if (Math.random() < 0.1) this.spawnFood();
        return false;
      }
      return true;
    });

    while (this.gameState.food.length < 200) {
      this.spawnFood();
    }

    this.gameState.blobs.forEach(blob => {
      blob.x += (blob.targetX - blob.x) * 0.01;
      blob.y += (blob.targetY - blob.y) * 0.01;

      if (Math.random() < 0.02) {
        blob.targetX = Math.random() * this.worldSize;
        blob.targetY = Math.random() * this.worldSize;
      }

      blob.x = Math.max(blob.radius, Math.min(this.worldSize - blob.radius, blob.x));
      blob.y = Math.max(blob.radius, Math.min(this.worldSize - blob.radius, blob.y));

      const pdx = player.x - blob.x;
      const pdy = player.y - blob.y;
      const pdist = Math.sqrt(pdx * pdx + pdy * pdy);

      if (pdist < player.radius + blob.radius) {
        if (player.radius > blob.radius * 1.2) {
          player.radius += blob.radius * 0.2;
          this.gameState.score += Math.floor(blob.radius * 10);
          this.spawnAIBlob();
        } else if (blob.radius > player.radius * 1.2) {
          this.gameState.status = 'gameover';
        }
      }

      this.gameState.food.forEach((f, fi) => {
        const fdx = f.x - blob.x;
        const fdy = f.y - blob.y;
        if (Math.sqrt(fdx * fdx + fdy * fdy) < blob.radius) {
          blob.radius += 0.3;
          this.gameState.food.splice(fi, 1);
        }
      });
    });
  }

  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(-this.gameState.cameraX, -this.gameState.cameraY);

    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.worldSize; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.worldSize);
      ctx.stroke();
    }
    for (let y = 0; y < this.worldSize; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.worldSize, y);
      ctx.stroke();
    }

    this.gameState.food.forEach(f => {
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    this.gameState.blobs.forEach(blob => {
      ctx.fillStyle = blob.color;
      ctx.beginPath();
      ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    const player = this.gameState.player;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('You', player.x, player.y + 5);

    ctx.restore();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 120, 50);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Mass: ${Math.floor(player.radius)}`, 20, 30);
    ctx.fillText(`Score: ${this.gameState.score}`, 20, 50);

    if (this.gameState.status === 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#e74c3c';
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

window.AgarIOGame = AgarIOGame;