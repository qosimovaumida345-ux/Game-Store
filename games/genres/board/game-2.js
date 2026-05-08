// Backgammon Classic Game
class BackgammonGame {
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
      turn: 1,
      dice: [],
      canRoll: true,
      selectedPoint: null,
      legalMoves: [],
      player1Score: 0,
      player2Score: 0,
      player1Pieces: [],
      player2Pieces: [],
      bearOffP1: [],
      bearOffP2: [],
      status: 'playing',
      winner: null,
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player1Pieces = [
      { point: 0, count: 2 },
      { point: 5, count: 3 },
      { point: 11, count: 5 },
      { point: 16, count: 5 },
      { point: 18, count: 2 },
      { point: 23, count: 3 }
    ];
    
    this.gameState.player2Pieces = [
      { point: 0, count: 3 },
      { point: 5, count: 5 },
      { point: 7, count: 5 },
      { point: 11, count: 3 },
      { point: 16, count: 2 },
      { point: 23, count: 2 }
    ];
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
  }
  
  rollDice() {
    if (!this.gameState.canRoll) return;
    
    this.gameState.dice = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1
    ];
    this.gameState.canRoll = false;
    this.calculateLegalMoves();
  }
  
  calculateLegalMoves() {
    const moves = [];
    const currentPlayer = this.gameState.turn === 1 ? this.gameState.player1Pieces : this.gameState.player2Pieces;
    const dice = this.gameState.dice[0] === this.gameState.dice[1] ? 
                 [this.gameState.dice[0], this.gameState.dice[0], this.gameState.dice[0], this.gameState.dice[0]] :
                 [...this.gameState.dice];
    
    currentPlayer.forEach(piece => {
      dice.forEach(die => {
        const direction = this.gameState.turn === 1 ? 1 : -1;
        const targetPoint = piece.point + (die * direction);
        
        if (targetPoint >= 0 && targetPoint <= 23) {
          moves.push({
            from: piece.point,
            to: targetPoint,
            die: die
          });
        } else if (this.canBearOff(piece.point)) {
          moves.push({
            from: piece.point,
            to: 'off',
            die: die
          });
        }
      });
    });
    
    this.gameState.legalMoves = moves;
  }
  
  canBearOff(point) {
    const player = this.gameState.turn;
    
    if (player === 1) {
      return point >= 18;
    } else {
      return point <= 5;
    }
  }
  
  selectPoint(point) {
    if (this.gameState.canRoll) return;
    
    const currentPlayer = this.gameState.turn === 1 ? this.gameState.player1Pieces : this.gameState.player2Pieces;
    const piece = currentPlayer.find(p => p.point === point);
    
    if (piece && piece.count > 0) {
      this.gameState.selectedPoint = point;
    }
  }
  
  movePiece(to) {
    if (!this.gameState.selectedPoint || !this.gameState.legalMoves.length) return;
    
    const player = this.gameState.turn === 1 ? 'player1' : 'player2';
    const opponent = this.gameState.turn === 1 ? 'player2' : 'player1';
    const opponentPieces = this.gameState[opponent + 'Pieces'];
    
    const piece = this.gameState[player + 'Pieces'].find(p => p.point === this.gameState.selectedPoint);
    
    if (to === 'off') {
      this.gameState['bearOff' + (this.gameState.turn === 1 ? 'P1' : 'P2')].push({});
      piece.count--;
    } else {
      const opponentPiece = opponentPieces.find(p => p.point === to);
      
      if (opponentPiece && opponentPiece.count === 1) {
        opponentPiece.count = 0;
        this.gameState[opponent + 'Pieces'].push({ point: this.gameState.turn === 1 ? 0 : 23, count: 1 });
      }
      
      piece.count--;
      
      const targetPiece = this.gameState[player + 'Pieces'].find(p => p.point === to);
      if (targetPiece) {
        targetPiece.count++;
      } else {
        this.gameState[player + 'Pieces'].push({ point: to, count: 1 });
      }
    }
    
    this.gameState.selectedPoint = null;
    this.gameState.turn = this.gameState.turn === 1 ? 2 : 1;
    this.gameState.canRoll = true;
    this.gameState.dice = [];
    this.gameState.legalMoves = [];
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (input.action) this.rollDice();
  }
  
  render() {
    this.drawBackground();
    this.drawBoard();
    this.drawPieces();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    gradient.addColorStop(0, '#8b4513');
    gradient.addColorStop(1, '#654321');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawBoard() {
    this.ctx.fillStyle = '#d4a574';
    this.ctx.fillRect(50, 50, 700, 500);
    
    for (let i = 0; i < 24; i++) {
      const x = 70 + (i % 12) * 55;
      const y = i < 12 ? 70 : 300;
      const height = 230;
      const isDark = i % 2 === 0;
      
      this.ctx.fillStyle = isDark ? '#8b4513' : '#deb887';
      this.ctx.fillRect(x, y, 50, height);
    }
    
    this.ctx.strokeStyle = '#5d3a1a';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(50, 50, 700, 500);
  }
  
  drawPieces() {
    this.gameState.player1Pieces.forEach(piece => {
      if (piece.count <= 0) return;
      this.drawPointPieces(piece.point, piece.count, '#fff', 1);
    });
    
    this.gameState.player2Pieces.forEach(piece => {
      if (piece.count <= 0) return;
      this.drawPointPieces(piece.point, piece.count, '#000', 2);
    });
  }
  
  drawPointPieces(point, count, color, player) {
    const x = 70 + (point % 12) * 55 + 25;
    const y = point < 12 ? 80 : 530;
    const direction = point < 12 ? 1 : -1;
    
    const displayCount = Math.min(count, 5);
    
    for (let i = 0; i < displayCount; i++) {
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(x, y + (i * 25 * direction), 18, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.strokeStyle = player === 1 ? '#ccc' : '#333';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
    
    if (count > 5) {
      this.ctx.fillStyle = color;
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(count.toString(), x, y + (5 * 25 * direction));
    }
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, 10, 150, 70);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Turn: Player ${this.gameState.turn}`, 20, 30);
    
    if (this.gameState.dice.length > 0) {
      this.ctx.fillText(`Dice: ${this.gameState.dice.join(' - ')}`, 20, 50);
    } else {
      this.ctx.fillText('Click to roll', 20, 50);
    }
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BACKGAMMON', this.canvas.width / 2, 30);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Player ${this.gameState.winner} Wins!`, this.canvas.width / 2, this.canvas.height / 2);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.BackgammonGame = BackgammonGame;