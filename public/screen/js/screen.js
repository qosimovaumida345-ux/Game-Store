class ScreenApp {
  constructor() {
    this.ws = null;
    this.roomCode = null;
    this.players = [];
    this.currentGame = null;
    this.layoutEngine = null;
    this.gameLoader = null;
    this.gameInstance = null;
    this.gameList = [];
    this.roomCreated = false;
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
      console.log('Screen connected to server');
      this.ws.send(JSON.stringify({ type: 'get-games' }));
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Screen received:', data.type, data);
      this.handleMessage(data);
    };

    this.ws.onclose = () => {
      console.log('Screen WebSocket closed, reconnecting...');
      setTimeout(() => this.connectWebSocket(), 3000);
    };
    
    this.ws.onerror = (err) => {
      console.error('Screen WebSocket error:', err);
    };
  }

  bindEvents() {
    document.getElementById('btn-create-room').addEventListener('click', () => this.createRoom());
  }

  createRoom() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'create-room' }));
    }
  }

  handleMessage(data) {
    switch (data.type) {
      case 'room-created': this.onRoomCreated(data); break;
      case 'player-joined': this.onPlayerJoined(data); break;
      case 'player-left': this.onPlayerLeft(data); break;
      case 'game-starting': this.onGameStarting(data); break;
      case 'game-started': this.onGameStarted(data); break;
      case 'player-input': this.onPlayerInput(data); break;
      case 'game-list': this.onGameList(data); break;
    }
  }

  onRoomCreated(data) {
    this.roomCode = data.roomCode;
    this.roomCreated = true;
    document.getElementById('room-code').textContent = data.roomCode;
    document.getElementById('room-info').classList.remove('hidden');
    document.getElementById('btn-create-room').style.display = 'none';
    
    const qrUrl = data.qrUrl || `${window.location.origin}/controller/?code=${data.roomCode}`;
    document.getElementById('qr-code').innerHTML = 
      `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}" alt="QR Code">`;
    
    document.getElementById('waiting-message').classList.remove('hidden');
  }

  onPlayerJoined(data) {
    console.log('Player joined!', data.players);
    this.players = data.players;
    this.updatePlayersList();
    
    // Update waiting screen players list
    const waitingUl = document.getElementById('waiting-players-ul');
    if (waitingUl) {
      waitingUl.innerHTML = this.players.map(p => `<li><span class="player-dot"></span>${p}</li>`).join('');
    }
    
    // Show notification
    const waitingMsg = document.getElementById('waiting-message');
    if (waitingMsg) {
      waitingMsg.innerHTML = `<p style="color: #4ecdc4;">✅ ${this.players.length} o'yinchi qo'shildi!</p>
        <button id="btn-go-to-games" class="btn btn-primary" style="margin-top:15px;">O'yin Tanlash</button>`;
      
      // Add click handler for the button
      document.getElementById('btn-go-to-games').addEventListener('click', () => {
        this.showGameSelect();
      });
    }
    
    // Auto-show game select when player joins and games are loaded
    if (this.players.length > 0 && this.gameList.length > 0) {
      setTimeout(() => this.showGameSelect(), 800);
    }
  }

  onPlayerLeft(data) {
    this.players = data.players;
    this.updatePlayersList();
  }

  updatePlayersList() {
    const ul = document.getElementById('players-ul');
    if (this.players.length === 0) {
      ul.innerHTML = '<li style="color: #888;">Hali o\'yinchilar yo\'q</li>';
    } else {
      ul.innerHTML = this.players.map(p => `<li><span class="player-dot"></span>${p}</li>`).join('');
    }
  }

  showGameSelect() {
    console.log('Showing game select, games:', this.gameList.length);
    document.getElementById('room-create-screen').classList.remove('active');
    document.getElementById('game-select-screen').classList.add('active');
    this.updatePlayersList();
    
    // Add START button if not already added
    if (!document.getElementById('btn-start-now')) {
      const startBtn = document.createElement('button');
      startBtn.id = 'btn-start-now';
      startBtn.className = 'btn btn-primary';
      startBtn.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 1000; padding: 15px 30px; font-size: 1.2rem;';
      startBtn.textContent = 'Hozir Boshlash';
      startBtn.onclick = () => this.showGameSelect();
      document.body.appendChild(startBtn);
    }
    
    // Ensure games are rendered
    if (this.gameList.length > 0) {
      this.renderCategories();
      this.renderGames('all');
    } else {
      document.getElementById('games-grid').innerHTML = '<p style="color: #888;">O\'yinlar yuklanmoqda...</p>';
    }
  }

  onGameList(data) {
    this.gameList = data.games;
    console.log('Games loaded:', this.gameList.length);
    this.renderCategories();
    this.renderGames('all');
    
    if (this.roomCreated && this.players.length > 0) {
      // Auto-show game selection when games load and players are present
      this.showGameSelect();
    }
  }

  renderCategories() {
    const categories = ['all', ...new Set(this.gameList.map(g => g.genre))];
    const container = document.getElementById('games-categories');
    container.innerHTML = categories.map(cat => 
      `<button class="category-btn ${cat === 'all' ? 'active' : ''}" data-category="${cat}">${cat}</button>`
    ).join('');

    container.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderGames(btn.dataset.category);
      });
    });
  }

  renderGames(category) {
    const games = category === 'all' ? this.gameList : this.gameList.filter(g => g.genre === category);
    const grid = document.getElementById('games-grid');
    grid.innerHTML = games.map(game => `
      <div class="game-card" data-game-id="${game.id}" data-game-file="${game.file}">
        <h3>${game.name}</h3>
        <p>${game.desc}</p>
        <small>O'yinchilar: ${game.players.min}-${game.players.max}</small>
      </div>
    `).join('');

    grid.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', () => {
        this.startGame(card.dataset.gameId, card.dataset.gameFile);
      });
    });
  }

  startGame(gameId, gameFile) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'start-game', gameId }));
    }
  }

  onGameStarting(data) {
    console.log('=== GAME STARTING ===', data.gameId);
    this.currentGame = data.gameId;
    
    // Hide game select, show game screen
    const gameSelectScreen = document.getElementById('game-select-screen');
    const gameScreen = document.getElementById('game-screen');
    
    if (gameSelectScreen) {
      gameSelectScreen.classList.remove('active');
      gameSelectScreen.style.display = 'none';
    }
    
    if (gameScreen) {
      gameScreen.classList.add('active');
      gameScreen.style.display = 'block';
      gameScreen.style.width = '100%';
      gameScreen.style.height = '100vh';
      gameScreen.style.position = 'fixed';
      gameScreen.style.top = '0';
      gameScreen.style.left = '0';
      gameScreen.style.background = '#000';
    }
    
    console.log('Game screen shown');
    
    this.layoutEngine = new LayoutEngine(document.getElementById('game-screen'));
    this.gameLoader = new GameLoader();
    
    const canvases = this.layoutEngine.applyLayout(this.players.length, data.gameId);
    
    this.loadAndStartGame(data.gameId, data.gameId, canvases);
  }

  async loadAndStartGame(gameId, gameFile, canvases) {
    console.log('=== LOADING GAME ===', gameId, gameFile);
    
    // Get or create canvas
    let canvas = document.getElementById('game-canvas');
    const gameScreen = document.getElementById('game-screen');
    
    if (!canvas && gameScreen) {
      canvas = document.createElement('canvas');
      canvas.id = 'game-canvas';
      gameScreen.appendChild(canvas);
    }
    
    if (!canvas) {
      console.error('CANVAS NOT FOUND!');
      return;
    }
    
    // Set canvas size to full screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    
    const ctx = canvas.getContext('2d');
    console.log('Canvas:', canvas, 'Context:', ctx ? 'OK' : 'FAIL');
    
    // Draw immediately
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00ff00';
    ctx.font = '40px Arial';
    ctx.fillText('Loading: ' + gameFile, 50, 100);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Canvas size: ' + canvas.width + 'x' + canvas.height, 50, 160);
    
    try {
      const gamePath = '/games/genres/' + gameFile;
      console.log('Fetching:', gamePath);
      
      const GameClass = await this.gameLoader.loadGame(gameId, gamePath);
      console.log('GameClass:', GameClass);
      
      if (GameClass) {
        this.gameInstance = new GameClass(canvas, this.players || [], gameId);
        console.log('Instance created, calling start()...');
        
        if (typeof this.gameInstance.start === 'function') {
          this.gameInstance.start();
          console.log('=== GAME STARTED ===');
        }
      }
    } catch (err) {
      console.error('ERROR:', err);
      ctx.fillStyle = '#ff0000';
      ctx.font = '30px Arial';
      ctx.fillText('ERROR: ' + err.message, 50, 200);
    }
  }

  onGameStarted(data) {
    console.log('Game started');
  }

  onPlayerInput(data) {
    if (this.gameInstance) {
      this.gameInstance.updatePlayerInput(data.playerName, data.input);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new ScreenApp();
});