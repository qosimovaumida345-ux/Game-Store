// Complete Trivia Quiz Game
class TriviaQuizGame {
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
      questions: [],
      currentQuestion: 0,
      score: 0,
      time: 15,
      selectedAnswer: null,
      showResult: false,
      correctAnswer: null,
      status: 'playing'
    };

    this.questions = [
      { q: "What is the capital of France?", answers: ["London", "Berlin", "Paris", "Madrid"], correct: 2 },
      { q: "Which planet is closest to the Sun?", answers: ["Venus", "Mercury", "Mars", "Earth"], correct: 1 },
      { q: "What is 7 x 8?", answers: ["54", "56", "58", "64"], correct: 1 },
      { q: "Who painted the Mona Lisa?", answers: ["Van Gogh", "Picasso", "Da Vinci", "Michelangelo"], correct: 2 },
      { q: "What is the largest ocean?", answers: ["Atlantic", "Indian", "Pacific", "Arctic"], correct: 2 },
      { q: "In what year did WWII end?", answers: ["1943", "1944", "1945", "1946"], correct: 2 },
      { q: "What is the chemical symbol for gold?", answers: ["Go", "Gd", "Au", "Ag"], correct: 2 },
      { q: "Which country has the largest population?", answers: ["USA", "India", "China", "Russia"], correct: 2 },
      { q: "What is the speed of light?", answers: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "1,000,000 km/s"], correct: 0 },
      { q: "Who wrote Romeo and Juliet?", answers: ["Dickens", "Hemingway", "Shakespeare", "Austen"], correct: 2 }
    ];

    this.initGame();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 700;
    this.canvas.height = this.canvas.parentElement.clientHeight || 500;
  }

  initGame() {
    this.gameState.questions = this.shuffleArray([...this.questions]).slice(0, 10);
    this.gameState.currentQuestion = 0;
    this.gameState.score = 0;
    this.gameState.time = 15;
  }

  shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
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
    if (this.gameState.showResult) return;

    this.gameState.time -= dt;

    if (this.gameState.time <= 0) {
      this.gameState.showResult = true;
      this.gameState.correctAnswer = this.gameState.questions[this.gameState.currentQuestion].correct;
      setTimeout(() => this.nextQuestion(), 2000);
    }
  }

  selectAnswer(index) {
    if (this.gameState.showResult) return;

    this.gameState.selectedAnswer = index;
    this.gameState.showResult = true;
    this.gameState.correctAnswer = this.gameState.questions[this.gameState.currentQuestion].correct;

    if (index === this.gameState.correctAnswer) {
      this.gameState.score += Math.floor(this.gameState.time * 10);
    }

    setTimeout(() => this.nextQuestion(), 2000);
  }

  nextQuestion() {
    this.gameState.currentQuestion++;
    this.gameState.time = 15;
    this.gameState.selectedAnswer = null;
    this.gameState.showResult = false;
    this.gameState.correctAnswer = null;

    if (this.gameState.currentQuestion >= this.gameState.questions.length) {
      this.gameState.status = 'finished';
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.gameState.status === 'finished') {
      ctx.fillStyle = '#2ecc71';
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('QUIZ COMPLETE!', this.canvas.width / 2, this.canvas.height / 2 - 30);
      ctx.fillStyle = '#fff';
      ctx.font = '30px Arial';
      ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
      return;
    }

    const q = this.gameState.questions[this.gameState.currentQuestion];

    ctx.fillStyle = '#fff';
    ctx.font = '22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Question ${this.gameState.currentQuestion + 1}/${this.gameState.questions.length}`, this.canvas.width / 2, 40);

    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 26px Arial';
    const words = q.q.split(' ');
    let line = '';
    let y = 100;
    words.forEach(word => {
      if ((line + word).length > 30) {
        ctx.fillText(line, this.canvas.width / 2, y);
        line = word + ' ';
        y += 35;
      } else {
        line += word + ' ';
      }
    });
    ctx.fillText(line, this.canvas.width / 2, y);

    q.answers.forEach((answer, i) => {
      const x = i % 2 === 0 ? 150 : 400;
      const y = 220 + Math.floor(i / 2) * 80;

      let color = '#3498db';
      if (this.gameState.showResult) {
        if (i === this.gameState.correctAnswer) color = '#2ecc71';
        else if (i === this.gameState.selectedAnswer) color = '#e74c3c';
      } else if (this.gameState.selectedAnswer === i) {
        color = '#5dade2';
      }

      ctx.fillStyle = color;
      ctx.fillRect(x, y, 200, 60);

      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(answer, x + 100, y + 35);
    });

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 100, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.gameState.score}`, 20, 35);

    ctx.fillStyle = this.gameState.time > 5 ? '#2ecc71' : '#e74c3c';
    ctx.fillRect(this.canvas.width - 120, 10, 110, 30);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(`Time: ${Math.ceil(this.gameState.time)}s`, this.canvas.width - 65, 30);
  }

  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }

  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };

    if (input.action || input.a) this.selectAnswer(0);
    else if (input.b) this.selectAnswer(1);
    else if (input.x || input.up) this.selectAnswer(2);
    else if (input.y || input.down) this.selectAnswer(3);
  }
}

window.TriviaQuizGame = TriviaQuizGame;