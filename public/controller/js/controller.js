class ControllerApp {
  constructor() {
    this.ws = null;
    this.roomCode = null;
    this.playerName = null;
    this.currentGame = null;
    this.inputTypes = {};
    this.init();
  }

  init() {
    this.loadInputTypes();
    this.bindEvents();
    this.checkUrlForCode();
    this.connectWebSocket();
  }

  loadInputTypes() {
    this.inputTypes = {
      racing: window.RacingInput,
      platformer: window.PlatformerInput,
      fighting: window.FightingInput,
      shooter: window.ShooterInput,
      sports: window.SportsInput,
      arcade: window.ArcadeInput,
      puzzle: window.PuzzleInput,
      default: window.DefaultInput
    };
  }

  checkUrlForCode() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      document.getElementById('room-code-input').value = code;
      setTimeout(() => this.joinWithCode(), 500);
    }
  }

  connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.ws = new WebSocket(`${protocol}//${window.location.host}`);

    this.ws.onopen = () => {
      console.log('Connected to server');
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.ws.onclose = () => {
      setTimeout(() => this.connectWebSocket(), 3000);
    };
  }

  bindEvents() {
    document.getElementById('btn-join-code').addEventListener('click', () => this.joinWithCode());

    document.getElementById('room-code-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.joinWithCode();
    });

    document.getElementById('btn-submit-name').addEventListener('click', () => this.submitName());

    document.getElementById('player-name-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.submitName();
    });
  }

  joinWithCode() {
    const code = document.getElementById('room-code-input').value.trim();
    if (code.length === 6) {
      this.roomCode = code;
      this.showScreen('name-entry-screen');
      document.getElementById('display-room-code').textContent = code;
    }
  }

  submitName() {
    const name = document.getElementById('player-name-input').value.trim();
    if (name) {
      this.playerName = name;
      this.ws.send(JSON.stringify({
        type: 'join-room',
        roomCode: this.roomCode,
        playerName: name
      }));
    }
  }

  handleMessage(data) {
    switch (data.type) {
      case 'joined': this.onJoined(data); break;
      case 'error': this.onError(data); break;
      case 'game-starting': this.onGameStarting(data); break;
      case 'game-started': this.onGameStarted(data); break;
      case 'room-closed': this.onRoomClosed(); break;
    }
  }

  onJoined(data) {
    this.showScreen('waiting-screen');
    this.updateWaitingPlayers(data.players);
  }

  onError(data) {
    alert(data.message);
  }

  onGameStarting(data) {
    this.currentGame = data.gameId;
    this.showScreen('controller-screen');
    document.getElementById('player-display-name').textContent = this.playerName;
    this.setupController(data.gameId);
  }

  onGameStarted(data) {
    console.log('Game started:', data);
  }

  onRoomClosed() {
    alert('Xona yopildi');
    location.reload();
  }

  updateWaitingPlayers(players) {
    const ul = document.getElementById('waiting-players-list');
    ul.innerHTML = players.map(p => `<li>Player: ${p}</li>`).join('');
  }

  setupController(gameId) {
    const gameType = gameId.split('-')[0];
    const container = document.getElementById('controller-buttons');

    const sendInput = (key, value) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'game-input',
          input: { [key]: value }
        }));
      }
    };

    const InputClass = this.inputTypes[gameType] || this.inputTypes.default;
    InputClass.onInput = sendInput;
    InputClass.render(container);
  }

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new ControllerApp();
});