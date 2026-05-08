// Trivia Quiz Game
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
      time: 0,
      currentQuestion: 0,
      questions: [],
      scores: [0, 0],
      currentPlayer: 0,
      status: 'question',
      selectedAnswer: null,
      showResult: false,
      resultTimer: 0,
      questionTime: 15,
      questionTimer: 15,
      gameOver: false,
      winner: null,
      totalQuestions: 10
    };
    
    this.questions = this.generateQuestions();
    this.gameState.questions = this.questions;
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  generateQuestions() {
    return [
      { question: 'What is the capital of France?', answers: ['London', 'Berlin', 'Paris', 'Madrid'], correct: 2 },
      { question: 'Which planet is known as the Red Planet?', answers: ['Venus', 'Jupiter', 'Mars', 'Saturn'], correct: 2 },
      { question: 'Who painted the Mona Lisa?', answers: ['Van Gogh', 'Picasso', 'Leonardo da Vinci', 'Michelangelo'], correct: 2 },
      { question: 'What is the largest mammal?', answers: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'], correct: 1 },
      { question: 'Which element has the chemical symbol "O"?', answers: ['Gold', 'Oxygen', 'Osmium', 'Olive'], correct: 1 },
      { question: 'In what year did World War II end?', answers: ['1943', '1944', '1945', '1946'], correct: 2 },
      { question: 'What is the fastest land animal?', answers: ['Cheetah', 'Lion', 'Horse', 'Kangaroo'], correct: 0 },
      { question: 'Which country invented pizza?', answers: ['France', 'Italy', 'Greece', 'Spain'], correct: 1 },
      { question: 'How many continents are there?', answers: ['5', '6', '7', '8'], correct: 2 },
      { question: 'What is the main ingredient in guacamole?', answers: ['Tomato', 'Avocado', 'Onion', 'Lime'], correct: 1 },
      { question: 'Which is the smallest prime number?', answers: ['0', '1', '2', '3'], correct: 2 },
      { question: 'What is the largest ocean?', answers: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], correct: 2 },
      { question: 'Who wrote "Romeo and Juliet"?', answers: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'], correct: 1 },
      { question: 'What color is the sun?', answers: ['Yellow', 'White', 'Orange', 'Red'], correct: 1 },
      { question: 'How many strings does a standard guitar have?', answers: ['4', '5', '6', '7'], correct: 2 },
      { question: 'Which gas do plants absorb from the atmosphere?', answers: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correct: 2 },
      { question: 'What is the hardest natural substance?', answers: ['Gold', 'Iron', 'Diamond', 'Platinum'], correct: 2 },
      { question: 'Which animal is known as the "King of the Jungle"?', answers: ['Tiger', 'Lion', 'Elephant', 'Bear'], correct: 1 },
      { question: 'What is the boiling point of water?', answers: ['90°C', '100°C', '110°C', '120°C'], correct: 1 },
      { question: 'Which planet has the most moons?', answers: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], correct: 1 }
    ];
  }
  
  initGame() {
    this.gameState.questions = this.questions.sort(() => Math.random() - 0.5).slice(0, this.gameState.totalQuestions);
  }
  
  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }
  
  stop() { this.isRunning = false; }
  
  gameLoop(currentTime) {
    if (!this.isRunning) return;
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    this.update(deltaTime);
    this.render();
    requestAnimationFrame((time) => this.gameLoop(time));
  }
  
  update(deltaTime) {
    if (this.gameState.gameOver) return;
    
    this.gameState.time += deltaTime;
    
    if (this.gameState.status === 'answering') {
      this.gameState.questionTimer -= deltaTime;
      
      if (this.gameState.questionTimer <= 0) {
        this.timeUp();
      }
    }
    
    if (this.gameState.showResult) {
      this.gameState.resultTimer -= deltaTime;
      
      if (this.gameState.resultTimer <= 0) {
        this.nextQuestion();
      }
    }
  }
  
  selectAnswer(index) {
    if (this.gameState.status !== 'answering' || this.gameState.selectedAnswer !== null) return;
    
    this.gameState.selectedAnswer = index;
    this.gameState.showResult = true;
    this.gameState.resultTimer = 2;
    
    const question = this.gameState.questions[this.gameState.currentQuestion];
    
    if (index === question.correct) {
      const timeBonus = Math.floor(this.gameState.questionTimer * 5);
      this.gameState.scores[this.gameState.currentPlayer] += 100 + timeBonus;
    }
  }
  
  timeUp() {
    this.gameState.showResult = true;
    this.gameState.resultTimer = 2;
    this.nextQuestion();
  }
  
  nextQuestion() {
    this.gameState.currentQuestion++;
    this.gameState.currentPlayer = (this.gameState.currentPlayer + 1) % 2;
    this.gameState.selectedAnswer = null;
    this.gameState.showResult = false;
    this.gameState.questionTimer = this.gameState.questionTime;
    
    if (this.gameState.currentQuestion >= this.gameState.totalQuestions) {
      this.endGame();
    } else {
      this.gameState.status = 'answering';
    }
  }
  
  endGame() {
    if (this.gameState.scores[0] > this.gameState.scores[1]) {
      this.gameState.winner = this.players[0];
    } else if (this.gameState.scores[1] > this.gameState.scores[0]) {
      this.gameState.winner = this.players[1];
    } else {
      this.gameState.winner = 'Draw';
    }
    this.gameState.gameOver = true;
    this.gameState.status = 'gameover';
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    const currentPlayer = this.players[this.gameState.currentPlayer];
    if (playerName !== currentPlayer) return;
    
    if (input.a && this.gameState.status === 'answering') this.selectAnswer(0);
    if (input.b && this.gameState.status === 'answering') this.selectAnswer(1);
    if (input.up && this.gameState.status === 'answering') this.selectAnswer(2);
    if (input.down && this.gameState.status === 'answering') this.selectAnswer(3);
  }
  
  render() {
    this.drawBackground();
    
    if (this.gameState.status === 'gameover') {
      this.drawGameOver();
      return;
    }
    
    this.drawQuestion();
    this.drawAnswers();
    this.drawUI();
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawQuestion() {
    const question = this.gameState.questions[this.gameState.currentQuestion];
    
    this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
    this.ctx.fillRect(50, 50, this.canvas.width - 100, 150);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(question.question, this.canvas.width / 2, 130);
  }
  
  drawAnswers() {
    const question = this.gameState.questions[this.gameState.currentQuestion];
    const answers = question.answers;
    const letters = ['A', 'B', 'C', 'D'];
    const positions = [
      { x: 150, y: 280 },
      { x: 450, y: 280 },
      { x: 150, y: 400 },
      { x: 450, y: 400 }
    ];
    
    answers.forEach((answer, i) => {
      let bgColor = '#3498db';
      
      if (this.gameState.showResult) {
        if (i === question.correct) {
          bgColor = '#27ae60';
        } else if (i === this.gameState.selectedAnswer && i !== question.correct) {
          bgColor = '#e74c3c';
        } else {
          bgColor = '#7f8c8d';
        }
      }
      
      this.ctx.fillStyle = bgColor;
      this.ctx.fillRect(positions[i].x, positions[i].y, 250, 80);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 20px Arial';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`${letters[i]}: ${answer}`, positions[i].x + 20, positions[i].y + 45);
    });
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 180, 80);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${this.players[0]}: ${this.gameState.scores[0]}`, 20, 30);
    this.ctx.fillText(`${this.players[1]}: ${this.gameState.scores[1]}`, 20, 55);
    this.ctx.fillText(`Q: ${this.gameState.currentQuestion + 1}/${this.gameState.totalQuestions}`, 20, 80);
    
    const currentPlayer = this.players[this.gameState.currentPlayer];
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('TRIVIA QUIZ', this.canvas.width / 2, 30);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText(`${Math.ceil(this.gameState.questionTimer)}s`, this.canvas.width / 2, 60);
    
    this.ctx.fillStyle = '#4ecdc4';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`Turn: ${currentPlayer}`, this.canvas.width - 80, 30);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 60);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Winner: ${this.gameState.winner}`, this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.fillText(`${this.players[0]}: ${this.gameState.scores[0]} | ${this.players[1]}: ${this.gameState.scores[1]}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.TriviaQuizGame = TriviaQuizGame;