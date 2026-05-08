// Complete Horror Survival Game
class HorrorSurvivalGame {
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
      items: [],
      flashlight: { on: true, battery: 100, angle: 0 },
      sanity: 100,
      objectives: [],
      currentObjective: 0,
      time: 0,
      score: 0,
      gamePhase: 'explore',
      status: 'playing'
    };

    this.mapData = { width: 2000, height: 2000 };
    this.camera = { x: 0, y: 0 };
    this.generateMap();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }

  generateMap() {
    this.gameState.rooms = [];
    const roomCount = 15;

    for (let i = 0; i < roomCount; i++) {
      this.gameState.rooms.push({
        x: Math.random() * (this.mapData.width - 300),
        y: Math.random() * (this.mapData.height - 300),
        w: 150 + Math.random() * 150,
        h: 150 + Math.random() * 150,
        type: ['bedroom', 'bathroom', 'kitchen', 'hallway', 'basement'][Math.floor(Math.random() * 5)],
        visited: false,
        items: []
      });
    }

    this.gameState.rooms[0].x = 50;
    this.gameState.rooms[0].y = 50;
    this.gameState.rooms[0].w = 200;
    this.gameState.rooms[0].h = 200;
    this.gameState.rooms[0].type = 'bedroom';

    this.gameState.player = {
      x: 150,
      y: 150,
      speed: 3,
      angle: 0,
      health: 100
    };

    this.gameState.enemies = [
      { x: 800, y: 800, speed: 1.5, type: 'stalker', state: 'patrol', target: null, alert: false },
      { x: 1200, y: 400, speed: 2, type: 'runner', state: 'patrol', target: null, alert: false },
      { x: 600, y: 1200, speed: 1, type: ' Lurker', state: 'hunt', target: null, alert: true }
    ];

    this.gameState.objectives = [
      { type: 'find', item: 'Key', target: { x: 600, y: 600 }, complete: false },
      { type: 'reach', target: { x: 1400, y: 1400 }, complete: false },
      { type: 'find', item: 'Exit', target: { x: 1800, y: 1800 }, complete: false }
    ];

    this.gameState.items = [
      { x: 600, y: 600, type: 'key', collected: false },
      { x: 400, y: 800, type: 'battery', collected: false },
      { x: 1000, y: 500, type: 'medkit', collected: false },
      { x: 800, y: 1200, type: 'battery', collected: false }
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
    const moveAngle = Math.atan2(input.y || 0, input.x || 0);
    if (Math.abs(input.x) > 0.1 || Math.abs(input.y) > 0.1) {
      player.x += Math.cos(moveAngle) * player.speed;
      player.y += Math.sin(moveAngle) * player.speed;
      player.angle = moveAngle;
    }

    player.x = Math.max(20, Math.min(this.mapData.width - 20, player.x));
    player.y = Math.max(20, Math.min(this.mapData.height - 20, player.y));

    this.camera.x = player.x - this.canvas.width / 2;
    this.camera.y = player.y - this.canvas.height / 2;

    this.gameState.rooms.forEach(room => {
      if (player.x > room.x && player.x < room.x + room.w &&
          player.y > room.y && player.y < room.y + room.h) {
        room.visited = true;
      }
    });

    this.gameState.enemies.forEach(e => {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 300 && !e.alert) {
        e.alert = true;
        e.state = 'hunt';
      }

      if (e.state === 'hunt') {
        const angle = Math.atan2(dy, dx);
        e.x += Math.cos(angle) * e.speed;
        e.y += Math.sin(angle) * e.speed;
      } else {
        e.x += Math.sin(this.gameState.time + e.x * 0.01) * 0.5;
        e.y += Math.cos(this.gameState.time + e.y * 0.01) * 0.5;
      }

      if (dist < 30) {
        player.health -= 20 * dt;
        this.gameState.sanity -= 10 * dt;
      }
    });

    if (this.gameState.flashlight.on) {
      this.gameState.flashlight.battery -= 2 * dt;
      if (this.gameState.flashlight.battery <= 0) {
        this.gameState.flashlight.on = false;
      }
    }

    this.gameState.sanity -= 0.5 * dt;
    if (this.gameState.sanity < 0) this.gameState.sanity = 0;

    this.gameState.items.forEach(item => {
      if (item.collected) return;
      const dx = item.x - player.x;
      const dy = item.y - player.y;
      if (Math.sqrt(dx * dx + dy * dy) < 40) {
        item.collected = true;
        if (item.type === 'key') {
          const obj = this.gameState.objectives.find(o => o.item === 'Key');
          if (obj) obj.complete = true;
        }
        if (item.type === 'battery') {
          this.gameState.flashlight.battery = Math.min(100, this.gameState.flashlight.battery + 30);
        }
        if (item.type === 'medkit') {
          player.health = Math.min(100, player.health + 30);
        }
      }
    });

    const currentObj = this.gameState.objectives[this.gameState.currentObjective];
    if (currentObj && currentObj.type === 'reach') {
      const dx = currentObj.target.x - player.x;
      const dy = currentObj.target.y - player.y;
      if (Math.sqrt(dx * dx + dy * dy) < 50) {
        currentObj.complete = true;
        this.gameState.currentObjective++;
        this.gameState.score += 200;
      }
    }

    if (player.health <= 0 || this.gameState.sanity <= 0) {
      this.gameState.status = 'gameover';
    }

    if (this.gameState.objectives.every(o => o.complete)) {
      this.gameState.status = 'win';
    }
  }

  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const darkness = Math.max(0.3, 1 - this.gameState.sanity / 200);
    ctx.fillStyle = `rgba(0, 0, 0, ${darkness})`;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(-this.camera.x, -this.camera.y);

    this.gameState.rooms.forEach(room => {
      const gradient = ctx.createRadialGradient(
        room.x + room.w / 2, room.y + room.h / 2, 0,
        room.x + room.w / 2, room.y + room.h / 2, Math.max(room.w, room.h)
      );

      if (room.visited) {
        gradient.addColorStop(0, '#2a2a3a');
        gradient.addColorStop(1, '#1a1a2a');
      } else {
        gradient.addColorStop(0, '#0a0a15');
        gradient.addColorStop(1, '#050510');
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(room.x, room.y, room.w, room.h);

      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(room.x, room.y, room.w, room.h);

      if (room.type === 'bedroom') {
        ctx.fillStyle = '#3a3a4a';
        ctx.fillRect(room.x + 20, room.y + room.h - 30, 60, 20);
      } else if (room.type === 'kitchen') {
        ctx.fillStyle = '#2a3a2a';
        ctx.fillRect(room.x + 10, room.y + room.h - 40, 40, 30);
      }
    });

    this.gameState.items.forEach(item => {
      if (item.collected) return;
      ctx.fillStyle = item.type === 'key' ? '#f1c40f' :
                     item.type === 'battery' ? '#2ecc71' : '#e74c3c';
      ctx.beginPath();
      ctx.arc(item.x, item.y, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.type === 'key' ? 'K' : item.type === 'battery' ? 'B' : '+', item.x, item.y + 4);
    });

    const player = this.gameState.player;
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(player.x, player.y, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(player.x, player.y - 5, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(player.x, player.y - 5, 4, 0, Math.PI * 2);
    ctx.fill();

    if (this.gameState.flashlight.on) {
      const flashAngle = this.gameState.flashlight.angle;
      const gradient = ctx.createRadialGradient(
        player.x + Math.cos(flashAngle) * 50,
        player.y + Math.sin(flashAngle) * 50, 0,
        player.x + Math.cos(flashAngle) * 100,
        player.y + Math.sin(flashAngle) * 100, 150
      );
      gradient.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.arc(player.x, player.y, 200, flashAngle - 0.5, flashAngle + 0.5);
      ctx.fill();
    }

    this.gameState.enemies.forEach(e => {
      ctx.fillStyle = e.alert ? '#e74c3c' : '#8b4513';
      ctx.beginPath();
      ctx.arc(e.x, e.y, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(e.x - 5, e.y - 3, 4, 0, Math.PI * 2);
      ctx.arc(e.x + 5, e.y - 3, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    const objective = this.gameState.objectives[this.gameState.currentObjective];
    if (objective && objective.type === 'reach' && !objective.complete) {
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(objective.target.x, objective.target.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('!', objective.target.x, objective.target.y + 5);
    }

    ctx.restore();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 10, 180, 100);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Sanity: ${Math.floor(this.gameState.sanity)}%`, 20, 30);
    ctx.fillText(`Health: ${Math.floor(player.health)}%`, 20, 50);
    ctx.fillText(`Battery: ${Math.floor(this.gameState.flashlight.battery)}%`, 20, 70);
    ctx.fillText(`Score: ${this.gameState.score}`, 20, 90);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(this.canvas.width / 2 - 100, 10, 200, 30);
    ctx.fillStyle = '#f1c40f';
    ctx.textAlign = 'center';
    const obj = this.gameState.objectives[this.gameState.currentObjective];
    ctx.fillText(obj ? `Objective: ${obj.type} ${obj.item || ''}` : 'Escape!', this.canvas.width / 2, 30);

    if (this.gameState.status === 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 50px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('YOU DIED', this.canvas.width / 2, this.canvas.height / 2);
    }

    if (this.gameState.status === 'win') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#2ecc71';
      ctx.font = 'bold 50px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('YOU ESCAPED!', this.canvas.width / 2, this.canvas.height / 2);
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

window.HorrorSurvivalGame = HorrorSurvivalGame;