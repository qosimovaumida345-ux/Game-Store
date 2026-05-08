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
      console.log('Connected to server');
      this.ws.send(JSON.stringify({ type: 'get-games' }));
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.ws.onclose = () => setTimeout(() => this.connectWebSocket(), 3000);
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
    document.getElementById('room-code').textContent = data.roomCode;
    document.getElementById('room-info').classList.remove('hidden');
    document.getElementById('btn-create-room').style.display = 'none';
    
    const qrUrl = data.qrUrl || `${window.location.origin}/controller/?code=${data.roomCode}`;
    document.getElementById('qr-code').innerHTML = 
      `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}" alt="QR Code">`;
    
    document.getElementById('waiting-message').classList.remove('hidden');
  }

  onPlayerJoined(data) {
    this.players = data.players;
    this.updatePlayersList();
    
    if (this.players.length > 0 && this.gameList.length > 0) {
      document.getElementById('waiting-message').classList.add('hidden');
      this.showGameSelect();
    }
  }

  onPlayerLeft(data) {
    this.players = data.players;
    this.updatePlayersList();
  }

  updatePlayersList() {
    const ul = document.getElementById('players-ul');
    ul.innerHTML = this.players.map(p => `<li>Player: ${p}</li>`).join('');
  }

  showGameSelect() {
    document.getElementById('room-create-screen').classList.remove('active');
    document.getElementById('game-select-screen').classList.add('active');
  }

  onGameList(data) {
    this.gameList = data.games;
    this.renderCategories();
    this.renderGames('all');
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
    this.currentGame = data.gameId;
    document.getElementById('game-select-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    
    this.layoutEngine = new LayoutEngine(document.getElementById('game-screen'));
    this.gameLoader = new GameLoader();
    
    const canvases = this.layoutEngine.applyLayout(this.players.length, data.gameId);
    
    this.loadAndStartGame(data.gameId, data.gameId, canvases);
  }

  async loadAndStartGame(gameId, gameFile, canvases) {
    try {
      const GameClass = await this.gameLoader.loadGame(gameId, `/games/genres/${gameFile}`);
      const canvas = canvases[0];
      this.gameInstance = new GameClass(canvas, this.players, gameId);
      this.gameInstance.start();
    } catch (err) {
      console.error('Game loading error:', err);
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