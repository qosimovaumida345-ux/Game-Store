class ControllerApp {
  constructor() {
    this.ws = null;
    this.roomCode = null;
    this.playerName = null;
    this.currentGame = null;
    this.currentGenre = null;
    this.activeInputs = {};
    this.joystickData = { x: 0, y: 0 };
    this.init();
  }

  init() {
    this.bindEvents();
    this.checkUrlForCode();
    this.connectWebSocket();
  }

  connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.ws = new WebSocket(`${protocol}//${window.location.host}`);

    this.ws.onopen = () => console.log('Controller connected');

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (e) {}
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

  checkUrlForCode() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code && code.length === 6) {
      document.getElementById('room-code-input').value = code;
      setTimeout(() => this.joinRoom(), 500);
    }
  }

  bindEvents() {
    document.getElementById('btn-join').addEventListener('click', () => this.joinRoom());
    document.getElementById('room-code-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.joinRoom();
    });

    document.getElementById('btn-name').addEventListener('click', () => this.submitName());
    document.getElementById('player-name-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.submitName();
    });
  }

  joinRoom() {
    const code = document.getElementById('room-code-input').value.trim();
    if (code.length === 6) {
      this.roomCode = code;
      document.getElementById('display-code').textContent = code;
      this.showScreen('name-screen');
      setTimeout(() => document.getElementById('player-name-input').focus(), 300);
    }
  }

  submitName() {
    const name = document.getElementById('player-name-input').value.trim();
    if (name && name.length > 0) {
      this.playerName = name;
      this.send({
        type: 'join-room',
        roomCode: this.roomCode,
        playerName: name
      });
    }
  }

  handleMessage(data) {
    switch (data.type) {
      case 'joined': this.onJoined(data); break;
      case 'error': this.onError(data); break;
      case 'game-starting': this.onGameStarting(data); break;
      case 'player-update': this.onPlayerUpdate(data); break;
      case 'game-state-update': this.onGameStateUpdate(data); break;
      case 'back-to-lobby': this.onBackToLobby(data); break;
      case 'room-closed': this.onRoomClosed(); break;
    }
  }

  onJoined(data) {
    document.getElementById('waiting-room-code').textContent = data.roomCode;
    this.updateWaitingPlayers(data.players);
    this.showScreen('waiting-screen');

    // If game already running, show controller
    if (data.currentGame) {
      this.onGameStarting({ gameId: data.currentGame, genre: data.currentGame.split('-')[0] });
    }
  }

  onError(data) {
    alert(data.message);
  }

  onPlayerUpdate(data) {
    this.updateWaitingPlayers(data.players);
  }

  onGameStarting(data) {
    this.currentGame = data.gameId;
    this.currentGenre = data.genre || data.gameId.split('-')[0];
    document.getElementById('ctrl-player-name').textContent = this.playerName;
    this.setupController(this.currentGenre);
    this.showScreen('controller-screen');
  }

  onGameStateUpdate(data) {
    // Update score display
    if (data.state && data.state.scores) {
      const myScore = data.state.scores[this.playerName] || 0;
      document.getElementById('ctrl-score').textContent = myScore;
    }
  }

  onBackToLobby(data) {
    this.currentGame = null;
    this.updateWaitingPlayers(data.players);
    this.showScreen('waiting-screen');
  }

  onRoomClosed() {
    alert('Xona yopildi');
    location.reload();
  }

  updateWaitingPlayers(players) {
    const ul = document.getElementById('waiting-players-list');
    ul.innerHTML = players.map(p =>
      `<li><span class="dot" style="background:${p.color || '#10b981'}"></span>${p.name}</li>`
    ).join('');
  }

  setupController(genre) {
    const area = document.getElementById('controller-area');
    area.innerHTML = '';
    this.activeInputs = {};

    // Choose controller layout based on genre
    switch (genre) {
      case 'racing':
      case 'racing-2d':
      case 'racing-3d':
        this.buildRacingController(area);
        break;
      case 'fighting':
      case 'samurai':
      case 'ninja':
        this.buildFightingController(area);
        break;
      case 'shooter':
      case 'battle-royale':
      case 'sci-fi':
      case 'zombie':
      case 'bullet-hell':
        this.buildShooterController(area);
        break;
      default:
        this.buildDefaultController(area);
        break;
    }
  }

  // === DEFAULT CONTROLLER (D-pad + A/B buttons) ===
  buildDefaultController(area) {
    area.innerHTML = `
      <div class="ctrl-horizontal">
        <div class="ctrl-dpad">
          <button class="ctrl-btn up" data-key="up">▲</button>
          <button class="ctrl-btn left" data-key="left">◀</button>
          <button class="ctrl-btn center empty"></button>
          <button class="ctrl-btn right" data-key="right">▶</button>
          <button class="ctrl-btn down" data-key="down">▼</button>
        </div>
        <div class="ctrl-actions">
          <button class="ctrl-action btn-a" data-key="a">A</button>
          <button class="ctrl-action btn-b" data-key="b">B</button>
        </div>
      </div>
    `;
    this.attachButtonEvents(area);
  }

  // === RACING CONTROLLER (Joystick + Nitro/Brake) ===
  buildRacingController(area) {
    area.innerHTML = `
      <div class="joystick-zone" id="joystick-zone">
        <div class="joystick-knob" id="joystick-knob"></div>
      </div>
      <div class="ctrl-special-row">
        <button class="ctrl-special brake" data-key="brake">🛑 BRAKE</button>
        <button class="ctrl-special nitro" data-key="nitro">🔥 NITRO</button>
      </div>
    `;
    this.attachJoystick(area);
    this.attachButtonEvents(area);
  }

  // === FIGHTING CONTROLLER (D-pad + ABXY) ===
  buildFightingController(area) {
    area.innerHTML = `
      <div class="ctrl-horizontal">
        <div class="ctrl-dpad">
          <button class="ctrl-btn up" data-key="up">▲</button>
          <button class="ctrl-btn left" data-key="left">◀</button>
          <button class="ctrl-btn center empty"></button>
          <button class="ctrl-btn right" data-key="right">▶</button>
          <button class="ctrl-btn down" data-key="down">▼</button>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
          <button class="ctrl-action btn-a" data-key="punch">👊</button>
          <button class="ctrl-action btn-b" data-key="kick">🦵</button>
          <button class="ctrl-action btn-x" data-key="block">🛡️</button>
          <button class="ctrl-action btn-y" data-key="special">⚡</button>
        </div>
      </div>
    `;
    this.attachButtonEvents(area);
  }

  // === SHOOTER CONTROLLER (Joystick + Fire/Reload) ===
  buildShooterController(area) {
    area.innerHTML = `
      <div class="ctrl-horizontal">
        <div class="joystick-zone" id="joystick-zone" style="width:150px;height:150px;">
          <div class="joystick-knob" id="joystick-knob" style="width:60px;height:60px;"></div>
        </div>
        <div class="ctrl-actions" style="flex-direction:column;">
          <button class="ctrl-action btn-a" data-key="fire">🔫</button>
          <button class="ctrl-action btn-b" data-key="reload">🔄</button>
        </div>
      </div>
    `;
    this.attachJoystick(area);
    this.attachButtonEvents(area);
  }

  // === BUTTON EVENTS ===
  attachButtonEvents(area) {
    const buttons = area.querySelectorAll('[data-key]');
    buttons.forEach(btn => {
      const key = btn.dataset.key;

      const onPress = (e) => {
        e.preventDefault();
        btn.classList.add('pressed');
        this.activeInputs[key] = true;
        this.sendInput();
        // Vibrate
        if (navigator.vibrate) navigator.vibrate(30);
      };

      const onRelease = (e) => {
        e.preventDefault();
        btn.classList.remove('pressed');
        this.activeInputs[key] = false;
        this.sendInput();
      };

      btn.addEventListener('touchstart', onPress, { passive: false });
      btn.addEventListener('touchend', onRelease, { passive: false });
      btn.addEventListener('touchcancel', onRelease, { passive: false });
      btn.addEventListener('mousedown', onPress);
      btn.addEventListener('mouseup', onRelease);
      btn.addEventListener('mouseleave', onRelease);
    });
  }

  // === JOYSTICK ===
  attachJoystick(area) {
    const zone = area.querySelector('#joystick-zone');
    const knob = area.querySelector('#joystick-knob');
    if (!zone || !knob) return;

    let isActive = false;
    let centerX, centerY, maxDist;

    const updateCenter = () => {
      const rect = zone.getBoundingClientRect();
      centerX = rect.left + rect.width / 2;
      centerY = rect.top + rect.height / 2;
      maxDist = rect.width / 2 - knob.offsetWidth / 2;
    };

    const moveKnob = (x, y) => {
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const cappedDist = Math.min(dist, maxDist);
      const angle = Math.atan2(dy, dx);

      const knobX = Math.cos(angle) * cappedDist;
      const knobY = Math.sin(angle) * cappedDist;

      knob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

      this.joystickData = {
        x: parseFloat((knobX / maxDist).toFixed(2)),
        y: parseFloat((knobY / maxDist).toFixed(2))
      };
      this.activeInputs.joystick = this.joystickData;
      this.sendInput();
    };

    const resetKnob = () => {
      knob.style.transform = 'translate(-50%, -50%)';
      this.joystickData = { x: 0, y: 0 };
      this.activeInputs.joystick = this.joystickData;
      this.sendInput();
    };

    zone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isActive = true;
      updateCenter();
      const touch = e.touches[0];
      moveKnob(touch.clientX, touch.clientY);
    }, { passive: false });

    zone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!isActive) return;
      const touch = e.touches[0];
      moveKnob(touch.clientX, touch.clientY);
    }, { passive: false });

    zone.addEventListener('touchend', (e) => {
      e.preventDefault();
      isActive = false;
      resetKnob();
    }, { passive: false });

    zone.addEventListener('touchcancel', (e) => {
      isActive = false;
      resetKnob();
    });
  }

  // === SEND INPUT ===
  sendInput() {
    this.send({
      type: 'game-input',
      input: { ...this.activeInputs }
    });
  }

  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.controllerApp = new ControllerApp();
});