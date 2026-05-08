// Science Quiz Educational Game
class ScienceQuizGame {
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
      score: 0,
      questionIndex: 0,
      questions: [],
      currentQuestion: null,
      selectedAnswer: null,
      showResult: false,
      resultTimer: 0,
      streak: 0,
      status: 'playing',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.questions = [
      { question: "What is H2O?", answers: ["Oxygen", "Water", "Hydrogen", "Carbon"], correct: 1 },
      { question: "What is the speed of light?", answers: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "100,000 km/s"], correct: 0 },
      { question: "What planet is called Red Planet?", answers: ["Venus", "Mars", "Jupiter", "Saturn"], correct: 1 },
      { question: "What is the largest organ in the body?", answers: ["Heart", "Liver", "Skin", "Brain"], correct: 2 },
      { question: "What gas do plants absorb?", answers: ["Oxygen", "Nitrogen", "CO2", "Hydrogen"], correct: 2 },
      { question: "What is the hardest substance?", answers: ["Gold", "Iron", "Diamond", "Platinum"], correct: 2 },
      { question: "How many bones in adult human?", answers: ["106", "206", "306", "406"], correct: 1 },
      { question: "What is the chemical symbol for Gold?", answers: ["Go", "Gd", "Au", "Ag"], correct: 2 },
      { question: "What planet has the most moons?", answers: ["Jupiter", "Saturn", "Uranus", "Neptune"], correct: 1 },
      { question: "What is the powerhouse of the cell?", answers: ["Nucleus", "Ribosome", "Mitochondria", "Cytoplasm"], correct: 2 },
      { question: "What force keeps planets in orbit?", answers: ["Magnetism", "Gravity", "Friction", "Inertia"], correct: 1 },
      { question: "What is the boiling point of water?", answers: ["90°C", "100°C", "110°C", "120°C"], correct: 1 },
      { question: "What element has atomic number 1?", answers: ["Helium", "Hydrogen", "Oxygen", "Carbon"], correct: 1 },
      { question: "What is the largest mammal?", answers: ["Elephant", "Blue Whale", "Giraffe", "Shark"], correct: 1 },
      { question: "How many chromosomes humans have?", answers: ["23", "46", "48", "44"], correct: 1 },
      { question: "What is the closest star to Earth?", answers: ["Proxima Centauri", "Sun", "Alpha Centauri", "Sirius"], correct: 1 },
      { question: "What vitamin comes from sunlight?", answers: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"], correct: 3 },
      { question: "What is the chemical formula for salt?", answers: ["NaCl", "KCl", "CaCl2", "MgCl2"], correct: 0 },
      { question: "What is the study of fossils called?", answers: ["Archaeology", "Paleontology", "Geology", "Biology"], correct: 1 },
      { question: "What planet spins on its side?", answers: ["Neptune", "Uranus", "Saturn", "Jupiter"], correct: 1 }
    ];
    
    this.shuffleQuestions();
    this.gameState.currentQuestion = this.gameState.questions[0];
  }
  
  shuffleQuestions() {
    for (let i = this.gameState.questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.gameState.questions[i], this.gameState.questions[j]] = [this.gameState.questions[j], this.gameState.questions[i]];
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
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    this.update(deltaTime);
    this.render();
    requestAnimationFrame((time) => this.gameLoop(time));
  }
  
  update(deltaTime) {
    if (this.gameState.gameOver) return;
    
    this.gameState.time += deltaTime;
    
    if (this.gameState.showResult) {
      this.gameState.resultTimer -= deltaTime;
      
      if (this.gameState.resultTimer <= 0) {
        this.nextQuestion();
      }
    }
  }
  
  selectAnswer(index) {
    if (this.gameState.showResult) return;
    
    this.gameState.selectedAnswer = index;
    this.gameState.showResult = true;
    this.gameState.resultTimer = 1.5;
    
    if (index === this.gameState.currentQuestion.correct) {
      this.gameState.score += 100 + this.gameState.streak * 10;
      this.gameState.streak++;
    } else {
      this.gameState.streak = 0;
    }
  }
  
  nextQuestion() {
    this.gameState.questionIndex++;
    this.gameState.selectedAnswer = null;
    this.gameState.showResult = false;
    
    if (this.gameState.questionIndex >= this.gameState.questions.length) {
      this.gameState.gameOver = true;
    } else {
      this.gameState.currentQuestion = this.gameState.questions[this.gameState.questionIndex];
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (input.a) this.selectAnswer(0);
    if (input.b) this.selectAnswer(1);
    if (input.up) this.selectAnswer(2);
    if (input.down) this.selectAnswer(3);
  }
  
  render() {
    this.drawBackground();
    this.drawQuestion();
    this.drawAnswers();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1a472a');
    gradient.addColorStop(1, '#2d5a27');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let x = 0; x < this.canvas.width; x += 40) {
      for (let y = 0; y < this.canvas.height; y += 40) {
        this.ctx.fillRect(x, y, 38, 38);
      }
    }
  }
  
  drawQuestion() {
    this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
    this.ctx.fillRect(50, 80, this.canvas.width - 100, 120);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 28px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.gameState.currentQuestion.question, this.canvas.width / 2, 140);
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
    this.ctx.fillRect(50, 200, this.canvas.width - 100, 3);
  }
  
  drawAnswers() {
    const answers = this.gameState.currentQuestion.answers;
    const startY = 250;
    const boxWidth = this.canvas.width - 150;
    const boxHeight = 60;
    const gap = 20;
    
    answers.forEach((answer, i) => {
      const y = startY + i * (boxHeight + gap);
      let bgColor = 'rgba(255,255,255,0.1)';
      let borderColor = 'rgba(255,255,255,0.3)';
      let textColor = '#fff';
      
      if (this.gameState.showResult) {
        if (i === this.gameState.currentQuestion.correct) {
          bgColor = 'rgba(46, 204, 113, 0.4)';
          borderColor = '#2ecc71';
        } else if (i === this.gameState.selectedAnswer && i !== this.gameState.currentQuestion.correct) {
          bgColor = 'rgba(231, 76, 60, 0.4)';
          borderColor = '#e74c3c';
        }
      } else if (this.gameState.selectedAnswer === i) {
        bgColor = 'rgba(241, 196, 15, 0.3)';
        borderColor = '#f1c40f';
      }
      
      this.ctx.fillStyle = bgColor;
      this.ctx.fillRect(75, y, boxWidth, boxHeight);
      
      this.ctx.strokeStyle = borderColor;
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(75, y, boxWidth, boxHeight);
      
      this.ctx.fillStyle = textColor;
      this.ctx.font = 'bold 18px Arial';
      this.ctx.textAlign = 'left';
      
      const letter = String.fromCharCode(65 + i);
      this.ctx.fillText(`${letter}. ${answer}`, 95, y + 38);
    });
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, 10, 130, 70);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 35);
    this.ctx.fillText(`Question: ${this.gameState.questionIndex + 1}/20`, 20, 55);
    
    if (this.gameState.streak > 0) {
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.fillText(`Streak: ${this.gameState.streak}x`, 20, 75);
    }
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(this.canvas.width - 120, 10, 110, 40);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('SCIENCE QUIZ', this.canvas.width - 65, 35);
    
    if (this.gameState.showResult) {
      const resultText = this.gameState.selectedAnswer === this.gameState.currentQuestion.correct ? 'CORRECT!' : 'WRONG!';
      const resultColor = this.gameState.selectedAnswer === this.gameState.currentQuestion.correct ? '#2ecc71' : '#e74c3c';
      
      this.ctx.fillStyle = resultColor;
      this.ctx.font = 'bold 30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(resultText, this.canvas.width / 2, this.canvas.height - 50);
    }
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('QUIZ COMPLETE!', this.canvas.width / 2, this.canvas.height / 2 - 60);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 30px Arial';
    this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2);
    
    const percentage = Math.round((this.gameState.score / 2000) * 100);
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Score: ${percentage}%`, this.canvas.width / 2, this.canvas.height / 2 + 50);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.ScienceQuizGame = ScienceQuizGame;