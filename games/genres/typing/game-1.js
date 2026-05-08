// Speed Typer Game
class SpeedTyperGame {
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
      wpm: 0,
      accuracy: 100,
      currentWord: '',
      typedWord: '',
      wordIndex: 0,
      words: [],
      status: 'playing',
      gameDuration: 60,
      timer: 60,
      gameOver: false,
      winner: null,
      players: [
        { name: players[0], score: 0, wpm: 0, words: [], currentInput: '' },
        { name: players[1], score: 0, wpm: 0, words: [], currentInput: '' }
      ]
    };
    
    this.wordList = [
      'apple', 'banana', 'cherry', 'dragon', 'elephant', 'flower', 'guitar', 'hospital',
      'island', 'jungle', 'kitchen', 'laptop', 'mountain', 'notebook', 'ocean', 'piano',
      'quantum', 'rainbow', 'sunset', 'tiger', 'umbrella', 'village', 'whisper', 'xylophone',
      'yellow', 'zebra', 'adventure', 'butterfly', 'champion', 'diamond', 'electric',
      'fantasy', 'galaxy', 'harmony', 'individual', 'journey', 'keyboard', 'language',
      'mountain', 'network', 'orchestra', 'princess', 'question', 'restaurant', 'sandwich',
      'telephone', 'umbrella', 'volleyball', 'waterfall', 'yesterday', 'astronaut', 'blueprint'
    ];
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.generateWords(50);
    this.gameState.words = this.generateWords(50);
    this.gameState.currentWord = this.gameState.words[0];
    this.gameState.wordIndex = 0;
  }
  
  generateWords(count) {
    const words = [];
    for (let i = 0; i < count; i++) {
      words.push(this.wordList[Math.floor(Math.random() * this.wordList.length)]);
    }
    return words;
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
    this.gameState.timer -= deltaTime;
    
    if (this.gameState.timer <= 0) {
      this.endGame();
      return;
    }
    
    const currentPlayer = this.gameState.players[0];
    if (currentPlayer.words.length > 0) {
      this.gameState.wpm = Math.floor(currentPlayer.words.length / (this.gameState.time / 60));
    }
  }
  
  handleKeyPress(key) {
    if (this.gameState.gameOver) return;
    
    const currentPlayer = this.gameState.players[0];
    
    if (key === 'Enter' || key === ' ') {
      if (currentPlayer.currentInput === this.gameState.currentWord) {
        currentPlayer.words.push(this.gameState.currentWord);
        currentPlayer.score += this.gameState.currentWord.length * 10;
        this.nextWord();
      }
      currentPlayer.currentInput = '';
    } else if (key === 'Backspace') {
      currentPlayer.currentInput = currentPlayer.currentInput.slice(0, -1);
    } else if (key.length === 1 && key.match(/[a-z]/i)) {
      currentPlayer.currentInput += key.toLowerCase();
      this.checkMatch();
    }
  }
  
  checkMatch() {
    const currentPlayer = this.gameState.players[0];
    const word = this.gameState.currentWord;
    const input = currentPlayer.currentInput;
    
    if (word.startsWith(input)) {
      this.gameState.typedWord = input;
    } else {
      this.gameState.accuracy = Math.max(0, this.gameState.accuracy - 1);
    }
  }
  
  nextWord() {
    this.gameState.wordIndex++;
    
    if (this.gameState.wordIndex >= this.gameState.words.length) {
      this.gameState.words = this.gameState.words.concat(this.generateWords(20));
    }
    
    this.gameState.currentWord = this.gameState.words[this.gameState.wordIndex];
    this.gameState.typedWord = '';
  }
  
  endGame() {
    const winner = this.gameState.players[0].score >= this.gameState.players[1].score 
      ? this.players[0] : this.players[1];
    this.gameState.winner = winner;
    this.gameState.gameOver = true;
  }
  
  render() {
    this.drawBackground();
    this.drawCurrentWord();
    this.drawWordList();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#16213e';
    this.ctx.fillRect(50, 50, this.canvas.width - 100, this.canvas.height - 100);
  }
  
  drawCurrentWord() {
    const word = this.gameState.currentWord;
    const typed = this.gameState.players[0].currentInput;
    
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    
    let x = this.canvas.width / 2;
    let y = this.canvas.height / 2 - 50;
    
    word.split('').forEach((char, i) => {
      if (i < typed.length) {
        if (typed[i] === char) {
          this.ctx.fillStyle = '#2ecc71';
        } else {
          this.ctx.fillStyle = '#e74c3c';
        }
      } else {
        this.ctx.fillStyle = '#fff';
      }
      this.ctx.fillText(char, x + i * 35 - (word.length * 35) / 2, y);
    });
    
    this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
    this.ctx.font = '24px Arial';
    this.ctx.fillText('Type the word above', this.canvas.width / 2, y + 60);
  }
  
  drawWordList() {
    const startY = 100;
    
    this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    
    for (let i = 0; i < 10; i++) {
      const idx = this.gameState.wordIndex + i;
      if (idx < this.gameState.words.length) {
        const word = this.gameState.words[idx];
        const opacity = i < 3 ? 1 : 0.5;
        
        this.ctx.fillStyle = i === 0 ? '#ffd93d' : `rgba(255,255,255,${opacity})`;
        this.ctx.fillText(word, 60, startY + i * 30);
      }
    }
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 180, 100);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.players[0].score}`, 20, 35);
    this.ctx.fillText(`WPM: ${this.gameState.wpm}`, 20, 60);
    this.ctx.fillText(`Accuracy: ${this.gameState.accuracy}%`, 20, 85);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('SPEED TYPER', this.canvas.width / 2, 30);
    
    this.ctx.fillStyle = '#ff4444';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillText(`${Math.ceil(this.gameState.timer)}s`, this.canvas.width - 50, 35);
    
    this.ctx.fillStyle = '#4ecdc4';
    this.ctx.font = '14px Arial';
    this.ctx.fillText('Type with keyboard', this.canvas.width / 2, this.canvas.height - 20);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 50);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Final Score: ${this.gameState.players[0].score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
    this.ctx.fillText(`WPM: ${this.gameState.wpm}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
    this.ctx.fillText(`Accuracy: ${this.gameState.accuracy}%`, this.canvas.width / 2, this.canvas.height / 2 + 90);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.SpeedTyperGame = SpeedTyperGame;