class ScreenApp {
  constructor() {
    this.ws = null;
    this.roomCode = null;
    this.players = [];
    this.currentGame = null;
    this.gameInstance = null;
    this.gameLoader = new GameLoader();
    this.gameList = [];
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.init();
  }

  init() {
    this.bindEvents();
    this.connectWebSocket();
  }

  connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.ws = new WebSocket(`${protocol}//${window.location.host}`);

    this.ws.onopen = () => {
      console.log('Screen connected');
      this.send({ type: 'get-games' });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (e) {
        console.error('Parse error:', e);
      }
    };

    this.ws.onclose = () => {
      setTimeout(() => this.connectWebSocket(), 2000);
    };

    this.ws.onerror = () => {};
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  bindEvents() {
    document.getElementById('btn-create-room').addEventListener('click', () => this.createRoom());
    document.getElementById('btn-go-games').addEventListener('click', () => this.showScreen('game-select-screen'));
    document.getElementById('btn-back-lobby').addEventListener('click', () => this.showScreen('lobby-screen'));
    document.getElementById('btn-exit-game').addEventListener('click', () => this.exitGame());

    document.getElementById('game-search').addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderGames();
    });
  }

  createRoom() {
    this.send({ type: 'create-room' });
  }

  handleMessage(data) {
    switch (data.type) {
      case 'room-created': this.onRoomCreated(data); break;
      case 'player-joined': this.onPlayerJoined(data); break;
      case 'player-left': this.onPlayerLeft(data); break;
      case 'game-started': this.onGameStarted(data); break;
      case 'player-input': this.onPlayerInput(data); break;
      case 'game-list': this.onGameList(data); break;
    }
  }

  onRoomCreated(data) {
    this.roomCode = data.roomCode;
    const digits = document.getElementById('room-code-digits');
    digits.innerHTML = data.roomCode.split('').map(d =>
      `<div class="digit">${d}</div>`
    ).join('');

    const qrUrl = data.qrUrl || `${window.location.origin}/controller/?code=${data.roomCode}`;
    document.getElementById('qr-code').innerHTML =
      `<img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrUrl)}" alt="QR" style="display:block;">`;
    document.getElementById('connect-url').textContent = qrUrl;
    this.showScreen('lobby-screen');
  }

  onPlayerJoined(data) {
    this.players = data.players;
    this.updatePlayersUI();
    document.getElementById('btn-go-games').style.display = 'inline-flex';
  }

  onPlayerLeft(data) {
    this.players = data.players;
    this.updatePlayersUI();
    if (this.players.length === 0) {
      document.getElementById('btn-go-games').style.display = 'none';
    }
  }

  updatePlayersUI() {
    const grid = document.getElementById('players-grid');
    const count = document.getElementById('player-count');
    count.textContent = `${this.players.length}/8`;

    let html = this.players.map(p => `
      <div class="player-slot">
        <div class="player-avatar" style="background:${p.color}">${p.name.charAt(0).toUpperCase()}</div>
        <span class="player-name">${p.name}</span>
      </div>`).join('');

    for (let i = this.players.length; i < 4; i++) {
      html += `<div class="player-empty-slot"><div class="empty-avatar">?</div><span>Kutilmoqda...</span></div>`;
    }
    grid.innerHTML = html;

    document.getElementById('header-players').innerHTML = this.players.map(p =>
      `<div class="header-player-dot" style="background:${p.color}" title="${p.name}">${p.name.charAt(0).toUpperCase()}</div>`
    ).join('');

    document.getElementById('game-players-hud').innerHTML = this.players.map(p =>
      `<div class="header-player-dot" style="background:${p.color};width:28px;height:28px;font-size:0.7rem;">${p.name.charAt(0).toUpperCase()}</div>`
    ).join('');
  }

  onGameList(data) {
    this.gameList = data.games || [];
    this.renderCategories();
    this.renderGames();
  }

  renderCategories() {
    const genreEmojis = {
      'all':'🎮','action':'💥','adventure':'🗺️','arcade':'👾','asteroids':'☄️',
      'baseball':'⚾','basketball':'🏀','battle':'⚔️','battle-royale':'🔥',
      'billiards':'🎱','board':'🎲','bowling':'🎳','boxing':'🥊','brawl':'👊',
      'breakout':'🧱','bubble-shooter':'🫧','bullet-hell':'💥','card':'🃏',
      'casino':'🎰','checkers':'🏁','chess':'♟️','cooking':'🍳','cyberpunk':'🌃',
      'dodge':'🏃','dungeon':'🏔️','educational':'📚','fantasy':'🧙','farming':'🌾',
      'fighting':'🥊','fishing':'🎣','flappy':'🐦','football':'🏈','galaga':'🚀',
      'golf':'⛳','hero':'🦸','hockey':'🏒','horror':'👻','idle':'💰',
      'io-games':'🌐','maze':'🔲','memory':'🧠','metroidvania':'🗡️','mini-golf':'⛳',
      'mmorpg':'🗡️','moba':'⚔️','monopoly':'🏠','music':'🎵','ninja':'🥷',
      'pacman':'🟡','physics':'⚡','pirate':'🏴‍☠️','platformer':'🏃','poker':'♠️',
      'pong':'🏓','pool':'🎱','puzzle':'🧩','racing':'🏎️','racing-2d':'🏁',
      'racing-3d':'🏎️','rhythm':'🎶','roguelike':'💀','rpg':'⚔️','runner':'🏃‍♂️',
      'samurai':'⛩️','sci-fi':'🚀','shooter':'🔫','shooting':'🎯','simulation':'🏗️',
      'skateboard':'🛹','skiing':'⛷️','snake':'🐍','snake-ladders':'🎲',
      'soccer':'⚽','space-invaders':'👾','sports':'🏆','steampunk':'⚙️',
      'strategy':'♟️','survival':'🏕️','tank':'🪖','tennis':'🎾','tetris':'🟦',
      'tower-defense':'🏰','trivia':'🧠','typing':'⌨️','volleyball':'🏐',
      'war':'⚔️','western':'🤠','word':'📝','zombie':'🧟'
    };

    const genres = ['all', ...new Set(this.gameList.map(g => g.genre))];
    const container = document.getElementById('categories-scroll');
    container.innerHTML = genres.map(g => {
      const emoji = genreEmojis[g] || '🎮';
      const label = g === 'all' ? `Barchasi (${this.gameList.length})` :
        (this.gameList.find(x => x.genre === g)?.genreName || g);
      return `<button class="cat-btn ${g === this.currentCategory ? 'active' : ''}" data-cat="${g}">${emoji} ${label}</button>`;
    }).join('');

    container.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentCategory = btn.dataset.cat;
        container.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderGames();
      });
    });
  }

  renderGames() {
    let games = this.currentCategory === 'all'
      ? this.gameList
      : this.gameList.filter(g => g.genre === this.currentCategory);

    if (this.searchQuery) {
      games = games.filter(g =>
        g.name.toLowerCase().includes(this.searchQuery) ||
        g.genre.toLowerCase().includes(this.searchQuery) ||
        (g.genreName || '').toLowerCase().includes(this.searchQuery)
      );
    }

    const genreEmojis = {
      'action':'💥','adventure':'🗺️','arcade':'👾','asteroids':'☄️',
      'baseball':'⚾','basketball':'🏀','battle':'⚔️','battle-royale':'🔥',
      'billiards':'🎱','board':'🎲','bowling':'🎳','boxing':'🥊','brawl':'👊',
      'breakout':'🧱','bubble-shooter':'🫧','bullet-hell':'💥','card':'🃏',
      'casino':'🎰','checkers':'🏁','chess':'♟️','cooking':'🍳','cyberpunk':'🌃',
      'dodge':'🏃','dungeon':'🏔️','educational':'📚','fantasy':'🧙','farming':'🌾',
      'fighting':'🥊','fishing':'🎣','flappy':'🐦','football':'🏈','galaga':'🚀',
      'golf':'⛳','hero':'🦸','hockey':'🏒','horror':'👻','idle':'💰',
      'io-games':'🌐','maze':'🔲','memory':'🧠','metroidvania':'🗡️','mini-golf':'⛳',
      'mmorpg':'🗡️','moba':'⚔️','monopoly':'🏠','music':'🎵','ninja':'🥷',
      'pacman':'🟡','physics':'⚡','pirate':'🏴‍☠️','platformer':'🏃','poker':'♠️',
      'pong':'🏓','pool':'🎱','puzzle':'🧩','racing':'🏎️','racing-2d':'🏁',
      'racing-3d':'🏎️','rhythm':'🎶','roguelike':'💀','rpg':'⚔️','runner':'🏃‍♂️',
      'samurai':'⛩️','sci-fi':'🚀','shooter':'🔫','shooting':'🎯','simulation':'🏗️',
      'skateboard':'🛹','skiing':'⛷️','snake':'🐍','snake-ladders':'🎲',
      'soccer':'⚽','space-invaders':'👾','sports':'🏆','steampunk':'⚙️',
      'strategy':'♟️','survival':'🏕️','tank':'🪖','tennis':'🎾','tetris':'🟦',
      'tower-defense':'🏰','trivia':'🧠','typing':'⌨️','volleyball':'🏐',
      'war':'⚔️','western':'🤠','word':'📝','zombie':'🧟'
    };

    const genreGradients = {
      'action':'#dc2626,#991b1b','racing':'#dc2626,#7f1d1d','platformer':'#2563eb,#1d4ed8',
      'fighting':'#be123c,#881337','puzzle':'#7c3aed,#5b21b6','shooter':'#059669,#064e3b',
      'rpg':'#7c3aed,#4338ca','strategy':'#0891b2,#155e75','sports':'#16a34a,#15803d',
      'arcade':'#f59e0b,#d97706','simulation':'#0284c7,#0369a1','music':'#d946ef,#a21caf',
      'adventure':'#0d9488,#115e59','runner':'#ea580c,#c2410c','trivia':'#ca8a04,#a16207',
      'card':'#be185d,#9d174d','board':'#854d0e,#713f12','zombie':'#4d7c0f,#3f6212',
      'horror':'#1e1b4b,#312e81','ninja':'#1e293b,#334155','pirate':'#92400e,#78350f',
      'basketball':'#ea580c,#9a3412','soccer':'#16a34a,#166534','chess':'#374151,#111827',
      'bowling':'#7c3aed,#6d28d9','battle-royale':'#dc2626,#450a0a','sci-fi':'#0ea5e9,#0369a1',
      'fantasy':'#8b5cf6,#6d28d9','cyberpunk':'#06b6d4,#0e7490','tank':'#4b5563,#1f2937',
      'survival':'#65a30d,#3f6212','war':'#78350f,#451a03','western':'#a16207,#713f12',
      'moba':'#7c3aed,#4c1d95','mmorpg':'#4f46e5,#3730a3','boxing':'#ef4444,#b91c1c',
      'default':'#374151,#1f2937'
    };

    const grid = document.getElementById('games-grid');

    if (games.length === 0) {
      grid.innerHTML = '<div class="loading-games"><p>O\'yin topilmadi</p></div>';
      return;
    }

    grid.innerHTML = games.map(game => {
      const emoji = genreEmojis[game.genre] || '🎮';
      const gradient = genreGradients[game.genre] || genreGradients.default;
      return `
        <div class="game-card" data-id="${game.id}" data-file="${game.file}" data-genre="${game.genre}">
          <div class="game-card-thumb" style="background:linear-gradient(135deg,${gradient})">
            <span>${emoji}</span>
          </div>
          <div class="game-card-info">
            <h3>${game.name}</h3>
            <div class="game-card-meta">
              <span class="game-genre-tag">${game.genreName || game.genre}</span>
              <span class="game-players-tag">👥 ${game.players.min}-${game.players.max}</span>
            </div>
          </div>
        </div>`;
    }).join('');

    grid.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', () => {
        this.startGame(card.dataset.id, card.dataset.file, card.dataset.genre);
      });
    });
  }

  startGame(gameId, gameFile, genre) {
    this.currentGame = gameId;
    this.send({ type: 'start-game', gameId, gameFile, genre });
  }

  onGameStarted(data) {
    this.currentGame = data.gameId;
    this.showScreen('game-screen');

    const gameInfo = this.gameList.find(g => g.id === data.gameId);
    document.getElementById('game-title-hud').textContent = gameInfo ? gameInfo.name : data.gameId;

    this.loadAndStartGame(data.gameId);
  }

  async loadAndStartGame(gameId) {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext('2d');
    // Loading screen
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Loading animation
    const drawLoading = (progress) => {
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = 'rgba(124,58,237,0.04)';
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      ctx.fillStyle = '#7c3aed';
      ctx.font = '600 24px Inter, sans-serif';
      ctx.textAlign = 'center';
      const gameInfo = this.gameList.find(g => g.id === gameId);
      ctx.fillText(gameInfo ? gameInfo.name : 'Loading...', canvas.width / 2, canvas.height / 2 - 30);

      // Progress bar
      const barW = 200;
      const barH = 4;
      const barX = (canvas.width - barW) / 2;
      const barY = canvas.height / 2 + 10;
      ctx.fillStyle = 'rgba(124,58,237,0.2)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(barX, barY, barW * progress, barH);
    };

    drawLoading(0.2);

    const gameInfo = this.gameList.find(g => g.id === gameId);
    const gameFile = gameInfo ? gameInfo.file : gameId;
    let gamePath = '/games/genres/' + gameFile;

    try {
      drawLoading(0.4);

      // Load framework first
      if (!window.GameFrameworkBase) {
        await this.loadScript('/games/core/GameFramework.js');
      }

      drawLoading(0.6);

      // Load game via GameLoader
      const GameClass = await this.gameLoader.loadGame(gameId, gamePath);

      drawLoading(0.9);

      if (GameClass) {
        // Stop previous
        if (this.gameInstance && this.gameInstance.stop) {
          this.gameInstance.stop();
        }

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const playerNames = this.players.map(p => p.name);
        this.gameInstance = new GameClass(canvas, playerNames, gameId);

        // Resize handler
        window._gameResizeHandler = () => {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          if (this.gameInstance && this.gameInstance.resizeCanvas) {
            this.gameInstance.resizeCanvas();
          }
        };
        window.addEventListener('resize', window._gameResizeHandler);

        setTimeout(() => {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          if (this.gameInstance && typeof this.gameInstance.start === 'function') {
            this.gameInstance.start();
            console.log('Game started:', gameId);
          }
        }, 100);
      } else {
        throw new Error('No game class');
      }
    } catch (err) {
      console.error('Game load error:', err);
      this.showFallbackGame(canvas, gameId, gameInfo);
    }
  }

  loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) { resolve(); return; }
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => setTimeout(resolve, 50);
      script.onerror = () => reject(new Error('Script failed: ' + src));
      document.head.appendChild(script);
    });
  }

  showFallbackGame(canvas, gameId, gameInfo) {
    if (this.gameInstance && this.gameInstance.stop) this.gameInstance.stop();
    const playerNames = this.players.map(p => p.name);
    const gameName = gameInfo ? gameInfo.name : gameId;
    this.gameInstance = new FallbackGame(canvas, playerNames, gameId, gameName);
    this.gameInstance.start();
  }

  exitGame() {
    if (this.gameInstance && this.gameInstance.stop) this.gameInstance.stop();
    if (window._gameResizeHandler) {
      window.removeEventListener('resize', window._gameResizeHandler);
    }
    this.gameInstance = null;
    this.currentGame = null;
    this.send({ type: 'back-to-lobby' });
    this.showScreen('game-select-screen');
  }

  onPlayerInput(data) {
    if (this.gameInstance && this.gameInstance.updatePlayerInput) {
      this.gameInstance.updatePlayerInput(data.playerName, data.input);
    }
  }

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
  }
}

// ===== FALLBACK GAME - Professional Arena Collector =====
class FallbackGame {
  constructor(canvas, players, gameId, gameName) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.players = players;
    this.gameId = gameId;
    this.gameName = gameName || 'Arena';
    this.isRunning = false;
    this.lastTime = 0;
    this.colors = ['#ff6b6b','#4ecdc4','#45b7d1','#f9ca24','#a29bfe','#fd79a8','#00b894','#e17055'];

    this.state = {
      entities: {},
      items: [],
      particles: [],
      obstacles: [],
      time: 0
    };

    this.initPlayers();
    this.spawnItems(12);
    this.spawnObstacles();
  }

  initPlayers() {
    const W = this.canvas.width, H = this.canvas.height;
    const positions = [
      { x: W * 0.25, y: H * 0.25 }, { x: W * 0.75, y: H * 0.25 },
      { x: W * 0.25, y: H * 0.75 }, { x: W * 0.75, y: H * 0.75 },
      { x: W * 0.5, y: H * 0.2 }, { x: W * 0.5, y: H * 0.8 },
      { x: W * 0.15, y: H * 0.5 }, { x: W * 0.85, y: H * 0.5 }
    ];
    this.players.forEach((name, i) => {
      const pos = positions[i % positions.length];
      this.state.entities[name] = {
        x: pos.x, y: pos.y, vx: 0, vy: 0,
        size: 22, color: this.colors[i % this.colors.length],
        score: 0, input: {}, trail: [], dashCooldown: 0
      };
    });
  }

  spawnItems(count) {
    const W = this.canvas.width, H = this.canvas.height;
    for (let i = 0; i < count; i++) {
      this.state.items.push({
        x: 80 + Math.random() * (W - 160),
        y: 80 + Math.random() * (H - 160),
        size: 10 + Math.random() * 4,
        type: Math.random() > 0.8 ? 'gold' : Math.random() > 0.5 ? 'gem' : 'coin',
        pulse: Math.random() * Math.PI * 2,
        rotation: 0
      });
    }
  }

  spawnObstacles() {
    const W = this.canvas.width, H = this.canvas.height;
    for (let i = 0; i < 6; i++) {
      this.state.obstacles.push({
        x: 100 + Math.random() * (W - 200),
        y: 100 + Math.random() * (H - 200),
        w: 40 + Math.random() * 60,
        h: 40 + Math.random() * 60,
        color: `hsla(${Math.random() * 360}, 30%, 25%, 0.6)`
      });
    }
  }

  start() { this.isRunning = true; this.lastTime = performance.now(); this.loop(this.lastTime); }
  stop() { this.isRunning = false; }
  updatePlayerInput(name, input) { if (this.state.entities[name]) this.state.entities[name].input = input; }

  loop(time) {
    if (!this.isRunning) return;
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;
    this.update(dt);
    this.render();
    requestAnimationFrame(t => this.loop(t));
  }

  update(dt) {
    this.state.time += dt;
    const SPD = 280;

    Object.values(this.state.entities).forEach(e => {
      const inp = e.input || {};
      let ax = 0, ay = 0;

      if (inp.up) ay -= 1;
      if (inp.down) ay += 1;
      if (inp.left) ax -= 1;
      if (inp.right) ax += 1;
      if (inp.joystick) { ax = inp.joystick.x || 0; ay = inp.joystick.y || 0; }

      // Dash
      if ((inp.a || inp.nitro) && e.dashCooldown <= 0) {
        e.vx += ax * 600;
        e.vy += ay * 600;
        e.dashCooldown = 1;
        for (let i = 0; i < 6; i++) {
          this.state.particles.push({
            x: e.x, y: e.y,
            vx: (Math.random() - 0.5) * 300, vy: (Math.random() - 0.5) * 300,
            life: 0.4, color: e.color, size: 5
          });
        }
      }
      e.dashCooldown = Math.max(0, e.dashCooldown - dt);

      e.vx += ax * SPD * dt;
      e.vy += ay * SPD * dt;
      e.vx *= 0.91;
      e.vy *= 0.91;
      e.x += e.vx * dt;
      e.y += e.vy * dt;

      // Walls
      e.x = Math.max(e.size, Math.min(this.canvas.width - e.size, e.x));
      e.y = Math.max(e.size, Math.min(this.canvas.height - e.size, e.y));

      // Obstacle collision
      this.state.obstacles.forEach(o => {
        if (e.x + e.size > o.x && e.x - e.size < o.x + o.w &&
            e.y + e.size > o.y && e.y - e.size < o.y + o.h) {
          // Push out
          const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
          const dx = e.x - cx, dy = e.y - cy;
          const angle = Math.atan2(dy, dx);
          e.x = cx + Math.cos(angle) * (o.w / 2 + e.size + 2);
          e.y = cy + Math.sin(angle) * (o.h / 2 + e.size + 2);
          e.vx *= -0.5;
          e.vy *= -0.5;
        }
      });

      // Trail
      if (Math.abs(e.vx) > 10 || Math.abs(e.vy) > 10) {
        e.trail.push({ x: e.x, y: e.y });
      }
      if (e.trail.length > 12) e.trail.shift();
    });

    // Item collection
    this.state.items = this.state.items.filter(item => {
      item.pulse += dt * 3;
      item.rotation += dt * 2;
      let collected = false;
      Object.entries(this.state.entities).forEach(([name, e]) => {
        const dx = e.x - item.x, dy = e.y - item.y;
        if (Math.sqrt(dx * dx + dy * dy) < e.size + item.size) {
          const pts = item.type === 'gold' ? 10 : item.type === 'gem' ? 3 : 1;
          e.score += pts;
          collected = true;
          for (let i = 0; i < 10; i++) {
            this.state.particles.push({
              x: item.x, y: item.y,
              vx: (Math.random() - 0.5) * 250, vy: (Math.random() - 0.5) * 250,
              life: 0.6, color: item.type === 'gold' ? '#f59e0b' : item.type === 'gem' ? '#a78bfa' : '#7c3aed',
              size: 3 + Math.random() * 3
            });
          }
        }
      });
      return !collected;
    });

    if (this.state.items.length < 5) this.spawnItems(8);

    // Particles
    this.state.particles = this.state.particles.filter(p => {
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.95; p.vy *= 0.95;
      p.life -= dt; p.size *= 0.97;
      return p.life > 0;
    });
  }

  render() {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;

    // BG
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(124,58,237,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Border glow
    const borderGrad = ctx.createLinearGradient(0, 0, W, 0);
    borderGrad.addColorStop(0, 'rgba(124,58,237,0.3)');
    borderGrad.addColorStop(0.5, 'rgba(6,182,212,0.3)');
    borderGrad.addColorStop(1, 'rgba(124,58,237,0.3)');
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, W - 8, H - 8);

    // Obstacles
    this.state.obstacles.forEach(o => {
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(o.x, o.y, o.w, o.h);
    });

    // Items
    this.state.items.forEach(item => {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(item.rotation);
      const pulse = 1 + Math.sin(item.pulse) * 0.15;
      const s = item.size * pulse;

      if (item.type === 'gold') {
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 20;
        ctx.beginPath();
        // Star shape
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const method = i === 0 ? 'moveTo' : 'lineTo';
          ctx[method](Math.cos(angle) * s, Math.sin(angle) * s);
        }
        ctx.closePath(); ctx.fill();
      } else if (item.type === 'gem') {
        ctx.fillStyle = '#a78bfa';
        ctx.shadowColor = '#a78bfa'; ctx.shadowBlur = 15;
        // Diamond
        ctx.beginPath();
        ctx.moveTo(0, -s); ctx.lineTo(s * 0.7, 0);
        ctx.lineTo(0, s); ctx.lineTo(-s * 0.7, 0);
        ctx.closePath(); ctx.fill();
      } else {
        ctx.fillStyle = '#7c3aed';
        ctx.shadowColor = '#7c3aed'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    // Particles
    this.state.particles.forEach(p => {
      ctx.globalAlpha = Math.min(1, p.life * 2.5);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Players
    Object.entries(this.state.entities).forEach(([name, e]) => {
      // Trail
      e.trail.forEach((t, i) => {
        const a = (i / e.trail.length) * 0.25;
        ctx.fillStyle = e.color;
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(t.x, t.y, e.size * (i / e.trail.length) * 0.7, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Glow
      const glow = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.size * 2.5);
      glow.addColorStop(0, e.color + '30');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.size * 2.5, 0, Math.PI * 2); ctx.fill();

      // Body
      ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
      ctx.fillStyle = e.color; ctx.fill();

      // Inner shine
      ctx.beginPath(); ctx.arc(e.x - e.size * 0.25, e.y - e.size * 0.25, e.size * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();

      // Letter
      ctx.fillStyle = 'white';
      ctx.font = `bold ${e.size}px Inter, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(name.charAt(0).toUpperCase(), e.x, e.y + 1);

      // Name + score
      ctx.font = '11px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(name, e.x, e.y - e.size - 14);
      ctx.fillStyle = e.color;
      ctx.fillText(`${e.score}`, e.x, e.y - e.size - 3);
    });

    // HUD
    this.renderHUD();
  }

  renderHUD() {
    const ctx = this.ctx;
    const sorted = Object.entries(this.state.entities).sort((a, b) => b[1].score - a[1].score);

    // Scoreboard bg
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    const bw = 190, bh = 38 + sorted.length * 26;
    ctx.moveTo(24, 16); ctx.lineTo(24 + bw, 16);
    ctx.quadraticCurveTo(24 + bw + 8, 16, 24 + bw + 8, 24);
    ctx.lineTo(24 + bw + 8, 16 + bh - 8);
    ctx.quadraticCurveTo(24 + bw + 8, 16 + bh, 24 + bw, 16 + bh);
    ctx.lineTo(24, 16 + bh);
    ctx.quadraticCurveTo(16, 16 + bh, 16, 16 + bh - 8);
    ctx.lineTo(16, 24);
    ctx.quadraticCurveTo(16, 16, 24, 16);
    ctx.fill();

    ctx.font = '600 11px Inter, sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#7c3aed';
    ctx.fillText(this.gameName.toUpperCase(), 28, 22);

    sorted.forEach(([name, e], i) => {
      const medal = i === 0 ? '👑' : '';
      ctx.fillStyle = e.color;
      ctx.font = '500 12px Inter, sans-serif';
      ctx.fillText(`${medal} ${name}: ${e.score}`, 28, 42 + i * 26);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new ScreenApp();
});