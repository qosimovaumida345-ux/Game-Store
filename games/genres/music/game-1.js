// Complete Rhythm Music Game
class RhythmMusicGame {
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
      notes: [],
      score: 0,
      combo: 0,
      maxCombo: 0,
      time: 0,
      bpm: 120,
      noteSpeed: 5,
      status: 'playing',
      keys: ['A', 'S', 'D', 'F']
    };

    this.initGame();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 700;
    this.canvas.height = this.canvas.parentElement.clientHeight || 500;
  }

  initGame() {
    this.gameState.notes = [];
    this.spawnNote();
  }

  spawnNote() {
    const lane = Math.floor(Math.random() * 4);
    this.gameState.notes.push({
      lane: lane,
      y: -50,
      hit: false
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
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.016);
    this.lastTime = currentTime;
    this.update(dt);
    this.render();
    requestAnimationFrame(t => this.gameLoop(t));
  }

  update(dt) {
    const state = this.gameState;
    state.time += dt;

    if (Math.random() < 0.05) {
      this.spawnNote();
    }

    state.notes.forEach(note => {
      note.y += state.noteSpeed;

      if (note.y > state.noteSpeed * 15) {
        if (!note.hit) {
          state.combo = 0;
        }
      }

      if (note.y > 600) {
        note.remove = true;
      }
    });

    state.notes = state.notes.filter(n => !n.remove);
  }

  hitNote(lane) {
    const state = this.gameState;
    const hitZone = 450;
    const perfectZone = 30;

    for (let note of state.notes) {
      if (note.lane === lane && !note.hit) {
        const distance = Math.abs(note.y - hitZone);
        if (distance < perfectZone) {
          note.hit = true;
          state.combo++;
          if (state.combo > state.maxCombo) state.maxCombo = state.combo;
          state.score += 100 + state.combo * 10;
          note.remove = true;
          return 'PERFECT';
        } else if (distance < perfectZone * 2) {
          note.hit = true;
          state.combo++;
          state.score += 50;
          return 'GOOD';
        }
      }
    }
    state.combo = 0;
    return 'MISS';
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const lanes = [150, 275, 400, 525];
    lanes.forEach((x, i) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(x - 50, 0, 100, 500);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(this.gameState.keys[i], x, 480);
    });

    const hitY = 450;
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 3;
    lanes.forEach(x => {
      ctx.beginPath();
      ctx.moveTo(x - 50, hitY);
      ctx.lineTo(x + 50, hitY);
      ctx.stroke();
    });

    this.gameState.notes.forEach(note => {
      const x = lanes[note.lane];
      ctx.fillStyle = note.lane === 0 ? '#e74c3c' :
                    note.lane === 1 ? '#3498db' :
                    note.lane === 2 ? '#2ecc71' : '#f1c40f';
      ctx.beginPath();
      ctx.arc(x, note.y, 20, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 150, 70);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    ctx.fillText(`Combo: x${this.gameState.combo}`, 20, 50);
    ctx.fillText(`Max: x${this.gameState.maxCombo}`, 20, 70);

    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('RHYTHM', this.canvas.width / 2, 50);
  }

  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }

  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };

    if (input.a) this.hitNote(0);
    if (input.b || input.action) this.hitNote(1);
    if (input.x) this.hitNote(2);
    if (input.y) this.hitNote(3);
  }
}

window.RhythmMusicGame = RhythmMusicGame;