// Complete Typing Speed Game
class TypingGame {
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
      words: [],
      currentWord: '',
      typed: '',
      score: 0,
      time: 60,
      correctChars: 0,
      totalChars: 0,
      wordsTyped: 0,
      status: 'playing'
    };

    this.wordList = [
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I',
      'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
      'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
      'game', 'play', 'time', 'life', 'world', 'think', 'make', 'come', 'take', 'know',
      'see', 'want', 'use', 'find', 'give', 'tell', 'try', 'call', 'need', 'feel',
      'computer', 'keyboard', 'screen', 'mouse', 'program', 'system', 'network', 'data', 'code', 'pixel'
    ];

    this.initGame();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 700;
    this.canvas.height = this.canvas.parentElement.clientHeight || 400;
  }

  initGame() {
    for (let i = 0; i < 50; i++) {
      this.gameState.words.push({
        text: this.wordList[Math.floor(Math.random() * this.wordList.length)],
        x: Math.random() * (this.canvas.width - 80),
        y: 50 + Math.random() * (this.canvas.height - 150),
        speed: 10 + Math.random() * 20,
        active: false
      });
    }
    this.gameState.words[0].active = true;
    this.gameState.currentWord = this.gameState.words[0].text;
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
    this.gameState.time -= dt;

    if (this.gameState.time <= 0) {
      this.gameState.status = 'finished';
      return;
    }

    const state = this.gameState;
    const activeWord = state.words.find(w => w.active);

    if (activeWord) {
      activeWord.y += activeWord.speed * dt;

      if (activeWord.y > this.canvas.height - 30) {
        activeWord.y = 50;
        activeWord.x = Math.random() * (this.canvas.width - 80);
      }
    }

    if (state.typed.length > 0) {
      const target = state.currentWord.substring(0, state.typed.length);
      if (state.typed === target) {
        state.correctChars += state.typed.length;
      }
      state.totalChars += state.typed.length;

      if (state.typed === state.currentWord) {
        state.score += state.currentWord.length * 10;
        state.wordsTyped++;

        const currentIndex = state.words.indexOf(activeWord);
        if (currentIndex < state.words.length - 1) {
          state.words[currentIndex + 1].active = true;
          activeWord.active = false;
          state.currentWord = state.words[currentIndex + 1].text;
        }

        state.typed = '';
      }
    }
  }

  typeLetter(letter) {
    const state = this.gameState;
    const newTyped = state.typed + letter;

    const current = state.currentWord.substring(0, newTyped.length);
    if (newTyped === current) {
      state.typed = newTyped;
    }
  }

  backspace() {
    this.gameState.typed = this.gameState.typed.slice(0, -1);
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.gameState.words.forEach((w, i) => {
      if (!w.active) {
        ctx.globalAlpha = 0.4;
      }
      ctx.fillStyle = '#fff';
      ctx.font = '20px Arial';
      ctx.textAlign = 'left';

      const typed = w === this.gameState.words.find(wa => wa.active) ? this.gameState.typed : '';
      const correctPart = typed;
      const remainingPart = w.text.substring(typed.length);

      ctx.fillStyle = '#2ecc71';
      ctx.fillText(correctPart, w.x, w.y);
      ctx.fillStyle = '#fff';
      ctx.fillText(remainingPart, w.x + ctx.measureText(correctPart).width, w.y);

      ctx.globalAlpha = 1;
    });

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 150, 60);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    ctx.fillText(`Words: ${this.gameState.wordsTyped}`, 20, 50);

    const wpm = this.gameState.wordsTyped > 0 && this.gameState.time < 60
      ? Math.floor(this.gameState.wordsTyped * (60 / (60 - this.gameState.time)))
      : 0;
    ctx.fillText(`WPM: ${wpm}`, 20, 70);

    ctx.fillStyle = this.gameState.time > 10 ? '#2ecc71' : '#e74c3c';
    ctx.fillRect(this.canvas.width - 80, 10, 70, 30);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '18px Arial';
    ctx.fillText(`${Math.ceil(this.gameState.time)}s`, this.canvas.width - 45, 30);

    ctx.fillStyle = '#3498db';
    ctx.fillRect(50, this.canvas.height - 80, this.canvas.width - 100, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Type the words as they fall!', this.canvas.width / 2, this.canvas.height - 50);

    if (this.gameState.status === 'finished') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#2ecc71';
      ctx.font = 'bold 50px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('TIME UP!', this.canvas.width / 2, this.canvas.height / 2 - 20);
      ctx.fillStyle = '#fff';
      ctx.font = '24px Arial';
      ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
      ctx.fillText(`Words Typed: ${this.gameState.wordsTyped}`, this.canvas.width / 2, this.canvas.height / 2 + 60);
    }
  }

  getPlayerInput() { return {}; }

  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };

    if (input.key) this.typeLetter(input.key);
    if (input.back) this.backspace();
  }
}

window.TypingGame = TypingGame;