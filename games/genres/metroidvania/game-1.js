// Complete Metroidvania Exploration Game
class MetroidvaniaGame {
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
      map: [],
      rooms: [],
      currentRoom: 0,
      collectibles: [],
      enemies: [],
      score: 0,
      abilities: [],
      time: 0,
      status: 'playing'
    };

    this.initWorld();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 500;
  }

  initWorld() {
    this.gameState.player = {
      x: 400,
      y: 400,
      vx: 0,
      vy: 0,
      width: 24,
      height: 32,
      onGround: false,
      facing: 1,
      health: 100,
      maxHealth: 100,
      energy: 50,
      maxEnergy: 100,
      abilities: ['dash'],
      hasDoubleJump: false,
      hasWallJump: false,
      hasGrapple: false
    };

    this.gameState.rooms = [
      { id: 0, x: 0, y: 0, w: 800, h: 500, type: 'start', visited: true, enemies: [], collectibles: [] },
      { id: 1, x: 800, y: 0, w: 800, h: 500, type: 'combat', visited: false, enemies: [], collectibles: [] },
      { id: 2, x: 0, y: -500, w: 800, h: 500, type: 'puzzle', visited: false, enemies: [], collectibles: [] },
      { id: 3, x: 800, y: -500, w: 800, h: 500, type: 'boss', visited: false, enemies: [], collectibles: [] },
      { id: 4, x: 1600, y: 0, w: 800, h: 500, type: 'treasure', visited: false, enemies: [], collectibles: [] }
    ];

    this.gameState.rooms[1].enemies = [
      { x: 1000, y: 400, type: 'slime', hp: 30, state: 'patrol' },
      { x: 1300, y: 400, type: 'bat', hp: 20, state: 'hover' }
    ];
    this.gameState.rooms[1].collectibles = [{ x: 1100, y: 300, type: 'health' }];

    this.gameState.rooms[2].collectibles = [
      { x: 400, y: 100, type: 'ability', ability: 'doubleJump' },
      { x: 600, y: 200, type: 'energy' }
    ];

    this.gameState.rooms[3].enemies = [
      { x: 1200, y: 300, type: 'boss', hp: 150, state: 'idle', maxHp: 150 }
    ];

    this.gameState.rooms[4].collectibles = [
      { x: 1800, y: 400, type: 'treasure' },
      { x: 1900, y: 350, type: 'health' }
    ];

    this.initPlatforms();
  }

  initPlatforms() {
    const room = this.gameState.rooms[this.gameState.currentRoom];
    this.gameState.platforms = [];

    this.gameState.platforms.push({ x: 0, y: 480, w: 800, h: 20 });

    if (room.type === 'start') {
      this.gameState.platforms.push(
        { x: 200, y: 400, w: 100, h: 15 },
        { x: 400, y: 320, w: 80, h: 15 },
        { x: 550, y: 250, w: 100, h: 15 }
      );
    } else if (room.type === 'combat') {
      for (let i = 0; i < 6; i++) {
        this.gameState.platforms.push({ x: 100 + i * 120, y: 350 + (i % 2) * 50, w: 80, h: 15 });
      }
    } else if (room.type === 'puzzle') {
      this.gameState.platforms.push(
        { x: 200, y: 400, w: 150, h: 15 },
        { x: 500, y: 300, w: 100, h: 15 },
        { x: 300, y: 200, w: 80, h: 15 },
        { x: 600, y: 150, w: 120, h: 15 }
      );
    } else if (room.type === 'boss') {
      this.gameState.platforms.push(
        { x: 900, y: 400, w: 200, h: 20 },
        { x: 1200, y: 350, w: 100, h: 15 }
      );
    } else if (room.type === 'treasure') {
      this.gameState.platforms.push(
        { x: 1600, y: 400, w: 150, h: 15 },
        { x: 1800, y: 300, w: 100, h: 15 }
      );
    }
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

    player.vx *= 0.85;
    player.vy += 0.5;

    if (input.left) { player.vx = -6; player.facing = -1; }
    if (input.right) { player.vx = 6; player.facing = 1; }

    if (input.up && player.onGround) {
      player.vy = -12;
      player.onGround = false;
    }

    if (input.action && player.abilities.includes('dash') && player.energy > 20) {
      player.vx = player.facing * 15;
      player.vy = 0;
      player.energy -= 20;
    }

    player.x += player.vx;
    player.y += player.vy;

    player.onGround = false;
    this.gameState.platforms.forEach(p => {
      if (player.x + player.width > p.x && player.x < p.x + p.w &&
          player.y + player.height > p.y && player.y < p.y + p.h &&
          player.vy > 0) {
        player.y = p.y - player.height;
        player.vy = 0;
        player.onGround = true;
      }
    });

    const room = this.gameState.rooms[this.gameState.currentRoom];
    if (player.x < 0 && room.id > 0) {
      this.gameState.currentRoom--;
      player.x = this.canvas.width - 40;
      this.initPlatforms();
      this.gameState.rooms[this.gameState.currentRoom].visited = true;
    } else if (player.x > this.canvas.width - player.width && this.gameState.currentRoom < this.gameState.rooms.length - 1) {
      this.gameState.currentRoom++;
      player.x = 40;
      this.initPlatforms();
      this.gameState.rooms[this.gameState.currentRoom].visited = true;
    }

    player.x = Math.max(0, Math.min(this.canvas.width - player.width, player.x));
    if (player.y > this.canvas.height) {
      player.health -= 20;
      player.x = 400;
      player.y = 400;
      player.vy = 0;
    }

    const currentRoomData = this.gameState.rooms[this.gameState.currentRoom];
    currentRoomData.collectibles = currentRoomData.collectibles || [];
    currentRoomData.collectibles.forEach((c, i) => {
      if (c.collected) return;
      const dx = c.x - (player.x + player.width / 2);
      const dy = c.y - (player.y + player.height / 2);
      if (Math.sqrt(dx * dx + dy * dy) < 30) {
        c.collected = true;
        if (c.type === 'health') {
          player.health = Math.min(player.maxHealth, player.health + 30);
        } else if (c.type === 'energy') {
          player.energy = Math.min(player.maxEnergy, player.energy + 50);
        } else if (c.type === 'ability') {
          player.abilities.push(c.ability);
          player.hasDoubleJump = true;
        } else if (c.type === 'treasure') {
          this.gameState.score += 500;
        }
      }
    });

    player.energy = Math.min(player.maxEnergy, player.energy + 3 * dt);

    if (player.health <= 0) {
      this.gameState.status = 'gameover';
    }
  }

  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }

  render() {
    const ctx = this.ctx;
    const room = this.gameState.rooms[this.gameState.currentRoom];

    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    if (room.type === 'boss') {
      gradient.addColorStop(0, '#2c0a0a');
      gradient.addColorStop(1, '#1a0505');
    } else if (room.type === 'treasure') {
      gradient.addColorStop(0, '#1a1a0a');
      gradient.addColorStop(1, '#0a0a05');
    } else {
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#0a0a1e');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.gameState.platforms.forEach(p => {
      const platColor = room.type === 'boss' ? '#8b0000' :
                        room.type === 'treasure' ? '#8b8b00' : '#3a3a5a';
      ctx.fillStyle = platColor;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(p.x, p.y, p.w, 3);
    });

    (room.collectibles || []).forEach(c => {
      if (c.collected) return;
      ctx.fillStyle = c.type === 'treasure' ? '#ffd700' :
                      c.type === 'health' ? '#e74c3c' :
                      c.type === 'energy' ? '#3498db' : '#2ecc71';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(c.type === 'treasure' ? '$' : '+', c.x, c.y + 4);
    });

    (room.enemies || []).forEach(e => {
      ctx.fillStyle = '#9b59b6';
      ctx.beginPath();
      ctx.arc(e.x, e.y, 15, 0, Math.PI * 2);
      ctx.fill();
      if (e.type === 'boss') {
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(e.x - 30, e.y - 25, 60, 8);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(e.x - 30, e.y - 25, 60 * (e.hp / e.maxHp), 8);
      }
    });

    const player = this.gameState.player;
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.scale(player.facing, 1);

    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(-player.width / 2, -player.height / 2 + 8, player.width, player.height - 8);
    ctx.fillStyle = '#f4a460';
    ctx.beginPath();
    ctx.arc(0, -player.height / 2 + 6, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.fillRect(-5, -player.height / 2, 3, 3);
    ctx.fillRect(2, -player.height / 2, 3, 3);

    ctx.restore();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 150, 80);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Room: ${room.type}`, 20, 28);
    ctx.fillText(`Score: ${this.gameState.score}`, 20, 48);

    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(20, 58, 130, 12);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(20, 58, 130 * (player.health / player.maxHealth), 12);
    ctx.fillStyle = '#fff';
    ctx.font = '10px Arial';
    ctx.fillText(`HP: ${Math.floor(player.health)}`, 60, 67);

    ctx.fillStyle = '#3498db';
    ctx.fillRect(20, 76, 130, 10);
    ctx.fillStyle = '#5dade2';
    ctx.fillRect(20, 76, 130 * (player.energy / player.maxEnergy), 10);
    ctx.fillText(`EN: ${Math.floor(player.energy)}`, 60, 83);

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

window.MetroidvaniaGame = MetroidvaniaGame;