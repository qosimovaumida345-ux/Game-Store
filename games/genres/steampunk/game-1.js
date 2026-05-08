// Complete Steampunk Factory Game
class SteampunkFactoryGame {
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
      machines: [],
      resources: [],
      workers: [],
      steam: 0,
      maxSteam: 100,
      time: 0,
      score: 0,
      day: 1,
      resourcesList: { copper: 50, iron: 30, coal: 40, gold: 10 },
      products: [],
      status: 'playing'
    };

    this.initFactory();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }

  initFactory() {
    this.gameState.machines = [
      { type: 'furnace', x: 150, y: 150, active: false, progress: 0, output: 'iron', input: 'coal', inputAmount: 2, outputAmount: 1 },
      { type: 'press', x: 350, y: 150, active: false, progress: 0, output: 'gear', input: 'iron', inputAmount: 3, outputAmount: 1 },
      { type: 'assembler', x: 550, y: 150, active: false, progress: 0, output: 'engine', input: 'gear', inputAmount: 2, input2: 'copper', input2Amount: 1, outputAmount: 1 },
      { type: 'boiler', x: 250, y: 400, active: true, progress: 0, output: 'steam', input: 'coal', inputAmount: 1, outputAmount: 5 },
      { type: 'crafter', x: 450, y: 400, active: false, progress: 0, output: 'copperwire', input: 'copper', inputAmount: 2, outputAmount: 3 }
    ];

    this.gameState.resources = [];
    for (let i = 0; i < 10; i++) {
      this.spawnResource();
    }

    this.gameState.workers = [
      { x: 400, y: 300, state: 'idle', target: null, carrying: null, speed: 80 }
    ];
  }

  spawnResource() {
    const types = ['copper', 'iron', 'coal', 'gold'];
    const type = types[Math.floor(Math.random() * types.length)];
    this.gameState.resources.push({
      type: type,
      x: 50 + Math.random() * (this.canvas.width - 100),
      y: 50 + Math.random() * (this.canvas.height - 100),
      size: 15,
      collected: false
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
    const state = this.gameState;

    state.steam = Math.min(state.maxSteam, state.steam + 2 * dt);

    if (state.steam <= 0) {
      state.machines.forEach(m => m.active = false);
    }

    state.machines.forEach(m => {
      if (!m.active) return;

      const res = state.resourcesList;
      const canWork = (!m.input || (res[m.input] >= m.inputAmount)) &&
                      (!m.input2 || (res[m.input2] >= m.input2Amount));

      if (canWork && m.progress < 100) {
        if (m.input) res[m.input] -= m.inputAmount * dt;
        if (m.input2) res[m.input2] -= m.input2Amount * dt;
        m.progress += 30 * dt;
        state.steam -= 5 * dt;
      }

      if (m.progress >= 100) {
        res[m.output] = (res[m.output] || 0) + m.outputAmount;
        m.progress = 0;
        this.spawnProduct(m.x, m.y, m.output);
        this.createParticles(m.x, m.y, 8, '#f1c40f');
      }
    });

    const input = this.getPlayerInput();
    const worker = state.workers[0];

    if (input.action) {
      state.resources.forEach(r => {
        if (r.collected) return;
        const dx = r.x - worker.x;
        const dy = r.y - worker.y;
        if (Math.sqrt(dx * dx + dy * dy) < 50) {
          r.collected = true;
          state.resourcesList[r.type] = (state.resourcesList[r.type] || 0) + 1;
          worker.state = 'collecting';
          setTimeout(() => this.spawnResource(), 2000);
        }
      });

      state.machines.forEach(m => {
        const dx = m.x - worker.x;
        const dy = m.y - worker.y;
        if (Math.sqrt(dx * dx + dy * dy) < 60) {
          if (state.steam >= 10) {
            m.active = !m.active;
          }
        }
      });
    }

    if (worker.state === 'collecting') {
      worker.state = 'idle';
    }

    if (input.left) worker.x -= worker.speed * dt;
    if (input.right) worker.x += worker.speed * dt;
    if (input.up) worker.y -= worker.speed * dt;
    if (input.down) worker.y += worker.speed * dt;

    worker.x = Math.max(30, Math.min(this.canvas.width - 30, worker.x));
    worker.y = Math.max(30, Math.min(this.canvas.height - 30, worker.y));

    if (state.resources.length < 5) {
      this.spawnResource();
    }

    if (state.steam <= 0 || state.resourcesList.copper <= 0 && state.resourcesList.iron <= 0) {
      if (state.steam <= -5) {
        state.status = 'gameover';
      }
    }
  }

  spawnProduct(x, y, type) {
    const colors = { gear: '#888', engine: '#555', steam: '#ccc', copperwire: '#b87333' };
    this.gameState.products.push({
      x: x + (Math.random() - 0.5) * 30,
      y: y + (Math.random() - 0.5) * 30,
      type: type,
      color: colors[type] || '#fff',
      life: 3
    });
  }

  createParticles(x, y, count, color) {
    if (!this.gameState.particles) this.gameState.particles = [];
    for (let i = 0; i < count; i++) {
      this.gameState.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 100,
        vy: (Math.random() - 0.5) * 100,
        life: 0.5,
        color: color
      });
    }
  }

  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }

  render() {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#2c1810');
    gradient.addColorStop(1, '#1a0f0a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 4;
    for (let x = 0; x < this.canvas.width; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += 100) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }

    this.gameState.machines.forEach(m => {
      const machineColor = m.active ? '#e67e22' : '#555';

      ctx.fillStyle = machineColor;
      ctx.fillRect(m.x - 40, m.y - 30, 80, 60);

      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(m.x, m.y - 10, 25, 0, Math.PI * 2);
      ctx.fill();

      if (m.active) {
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(m.x, m.y - 10, 25, -Math.PI / 2, -Math.PI / 2 + (m.progress / 100) * Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = '#fff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(m.type.toUpperCase(), m.x, m.y + 40);
    });

    this.gameState.resources.forEach(r => {
      if (r.collected) return;
      const color = r.type === 'copper' ? '#b87333' :
                    r.type === 'iron' ? '#aaa' :
                    r.type === 'coal' ? '#333' : '#ffd700';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    this.gameState.products = this.gameState.products.filter(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      p.life -= 0.016;
      return p.life > 0;
    });

    const worker = this.gameState.workers[0];
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(worker.x - 12, worker.y - 25, 24, 30);
    ctx.fillStyle = '#f4a460';
    ctx.beginPath();
    ctx.arc(worker.x, worker.y - 30, 10, 0, Math.PI * 2);
    ctx.fill();

    if (this.gameState.particles) {
      this.gameState.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
      });
      ctx.globalAlpha = 1;
      this.gameState.particles = this.gameState.particles.filter(p => {
        p.x += p.vx * 0.016;
        p.y += p.vy * 0.016;
        p.life -= 0.016;
        return p.life > 0;
      });
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 10, 180, 130);
    ctx.fillStyle = '#f1c40f';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('STEAM: ', 20, 30);
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(90, 18, 80, 16);
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(90, 18, 80 * (this.gameState.steam / this.gameState.maxSteam), 16);

    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.fillText(`Copper: ${this.gameState.resourcesList.copper || 0}`, 20, 55);
    ctx.fillText(`Iron: ${this.gameState.resourcesList.iron || 0}`, 20, 75);
    ctx.fillText(`Coal: ${this.gameState.resourcesList.coal || 0}`, 20, 95);
    ctx.fillText(`Gold: ${this.gameState.resourcesList.gold || 0}`, 20, 115);

    ctx.fillStyle = '#aaa';
    ctx.fillRect(this.canvas.width - 120, 10, 110, 50);
    ctx.fillStyle = '#fff';
    ctx.fillText('Day: ' + this.gameState.day, this.canvas.width - 110, 30);
    ctx.fillText('Click machines', this.canvas.width - 110, 45);
    ctx.fillText('to toggle', this.canvas.width - 110, 58);

    if (this.gameState.status === 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 50px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('FACTORY SHUTDOWN', this.canvas.width / 2, this.canvas.height / 2);
    }
  }

  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.SteampunkFactoryGame = SteampunkFactoryGame;