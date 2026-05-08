// Ludo Board Game
class LudoGame {
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
      dice: 0,
      canRoll: true,
      selectedPiece: null,
      players: [
        { id: 1, color: '#e74c3c', home: { x: 80, y: 80 }, pieces: [], finished: 0 },
        { id: 2, color: '#3498db', home: { x: 620, y: 80 }, pieces: [], finished: 0 },
        { id: 3, color: '#2ecc71', home: { x: 80, y: 420 }, pieces: [], finished: 0 },
        { id: 4, color: '#f1c40f', home: { x: 620, y: 420 }, pieces: [], finished: 0 }
      ],
      track: [],
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
    this.gameState.players.forEach(p => {
      p.pieces = [0, 0, 0, 0];
    });
    
    this.generateTrack();
  }
  
  generateTrack() {
    const track = [];
    const startPositions = [
      { x: 200, y: 180, color: 0 },
      { x: 360, y: 200, color: 1 },
      { x: 520, y: 180, color: 2 },
      { x: 200, y: 340, color: 3 },
      { x: 520, y: 340, color: 3 },
      { x: 360, y: 420, color: 2 },
      { x: 520, y: 520, color: 1 },
      { x: 360, y: 320, color: 0 }
    ];
    
    for (let i = 0; i < 52; i++) {
      track.push({ index: i });
    }
    
    this.gameState.track = track;
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
    
    this.gameState.dice = Math.floor(Math.random() * 6) + 1;
    this.gameState.canRoll = false;
    
    const player = this.gameState.players[this.gameState.turn - 1];
    
    if (this.gameState.dice === 6) {
      this.gameState.canRoll = true;
    }
    
    this.processTurn();
  }
  
  processTurn() {
    const player = this.gameState.players[this.gameState.turn - 1];
    let moved = false;
    
    for (let i = 0; i < 4; i++) {
      if (player.pieces[i] === 0 && this.gameState.dice === 6) {
        player.pieces[i] = 1;
        moved = true;
        break;
      } else if (player.pieces[i] > 0 && player.pieces[i] <= 56) {
        player.pieces[i] += this.gameState.dice;
        
        if (player.pieces[i] > 56) {
          player.pieces[i] = 57;
          player.finished++;
        }
        moved = true;
        break;
      }
    }
    
    if (!moved) {
      this.nextTurn();
    } else {
      this.checkCapture();
      
      if (player.finished === 4) {
        this.gameState.winner = this.gameState.turn;
        this.gameState.gameOver = true;
      }
    }
  }
  
  checkCapture() {
    const currentPlayer = this.gameState.players[this.gameState.turn - 1];
    
    this.gameState.players.forEach((p, idx) => {
      if (idx === this.gameState.turn - 1) return;
      
      p.pieces.forEach((piece, i) => {
        if (piece > 0 && piece <= 52) {
          currentPlayer.pieces.forEach((currentPiece, j) => {
            if (currentPiece > 0 && currentPiece <= 52 && currentPiece === piece) {
              p.pieces[i] = 0;
            }
          });
        }
      });
    });
  }
  
  nextTurn() {
    this.gameState.turn = this.gameState.turn % 4 + 1;
    this.gameState.canRoll = true;
    this.gameState.dice = 0;
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (input.action || input.a) this.rollDice();
  }
  
  render() {
    this.drawBackground();
    this.drawBoard();
    this.drawPieces();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#2c3e50');
    gradient.addColorStop(1, '#34495e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawBoard() {
    const baseSize = 140;
    const positions = [
      { x: 50, y: 50 }, { x: 450, y: 50 }, { x: 50, y: 350 }, { x: 450, y: 350 }
    ];
    
    this.gameState.players.forEach((p, i) => {
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(positions[i].x, positions[i].y, baseSize, baseSize);
      
      this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
      const innerSize = 40;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 2; c++) {
          this.ctx.fillRect(positions[i].x + 20 + r * 45, positions[i].y + 20 + c * 50, innerSize, 35);
        }
      }
    });
    
    const trackWidth = 30;
    const paths = [
      { start: { x: 190, y: 110 }, points: [{ x: 190, y: 90 }, { x: 190, y: 110 }, { x: 190, y: 160 }, { x: 210, y: 160 }, { x: 210, y: 110 }, { x: 250, y: 110 }, { x: 250, y: 130 }, { x: 210, y: 130 }, { x: 210, y: 180 }, { x: 190, y: 180 }, { x: 190, y: 290 }, { x: 180, y: 290 }, { x: 180, y: 180 }, { x: 160, y: 180 }, { x: 160, y: 130 }, { x: 190, y: 130 }] }
    ];
    
    this.ctx.fillStyle = '#ecf0f1';
    this.ctx.fillRect(190, 90, 60, 200);
    this.ctx.fillRect(250, 90, 200, 60);
    this.ctx.fillRect(490, 90, 60, 200);
    this.ctx.fillRect(490, 250, 200, 60);
    this.ctx.fillRect(490, 490, 60, 180);
    this.ctx.fillRect(250, 490, 200, 60);
    this.ctx.fillRect(90, 490, 200, 60);
    this.ctx.fillRect(90, 290, 60, 200);
  }
  
  drawPieces() {
    const positions = [
      { x: 50, y: 50 }, { x: 450, y: 50 }, { x: 50, y: 350 }, { x: 450, y: 350 }
    ];
    
    const innerPositions = [
      [[60, 60], [105, 60], [60, 105], [105, 105]],
      [[460, 60], [505, 60], [460, 105], [505, 105]],
      [[60, 360], [105, 360], [60, 405], [105, 405]],
      [[460, 360], [505, 360], [460, 405], [505, 405]]
    ];
    
    this.gameState.players.forEach((p, playerIdx) => {
      p.pieces.forEach((piece, pieceIdx) => {
        let x, y;
        
        if (piece === 0) {
          x = positions[playerIdx].x + innerPositions[playerIdx][pieceIdx][0];
          y = positions[playerIdx].y + innerPositions[playerIdx][pieceIdx][1];
        } else if (piece === 57) {
          const centerX = [190, 550, 190, 550];
          const centerY = [550, 190, 190, 550];
          x = centerX[playerIdx] + (pieceIdx % 2) * 25 - 12;
          y = centerY[playerIdx] + Math.floor(pieceIdx / 2) * 25 - 12;
        } else {
          const trackPos = this.getTrackPosition(piece, playerIdx);
          x = trackPos.x + (pieceIdx % 2) * 15 - 7;
          y = trackPos.y + Math.floor(pieceIdx / 2) * 15 - 7;
        }
        
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(x + 15, y + 15, 12, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
        this.ctx.beginPath();
        this.ctx.arc(x + 15, y + 17, 8, 0, Math.PI * 2);
        this.ctx.fill();
      });
    });
  }
  
  getTrackPosition(piece, playerIdx) {
    const basePositions = [
      { x: 190, y: 110 },
      { x: 490, y: 190 },
      { x: 550, y: 490 },
      { x: 250, y: 550 }
    ];
    
    const offsets = [0, 13, 26, 39];
    const adjustedPiece = (piece - 1 + offsets[playerIdx]) % 52;
    
    let x, y;
    if (adjustedPiece < 11) {
      x = 220 + adjustedPiece * 25;
      y = 145;
    } else if (adjustedPiece < 14) {
      x = 490;
      y = 145 + (adjustedPiece - 11) * 25;
    } else if (adjustedPiece < 25) {
      x = 490 - (adjustedPiece - 14) * 25;
      y = 220;
    } else if (adjustedPiece < 28) {
      x = 250;
      y = 220 + (adjustedPiece - 25) * 25;
    } else if (adjustedPiece < 39) {
      x = 250 - (adjustedPiece - 28) * 25;
      y = 295;
    } else if (adjustedPiece < 42) {
      x = 190;
      y = 295 - (adjustedPiece - 39) * 25;
    } else {
      x = 190 + (adjustedPiece - 42) * 25;
      y = 220;
    }
    
    return { x, y };
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, 10, 140, 60);
    
    const player = this.gameState.players[this.gameState.turn - 1];
    this.ctx.fillStyle = player.color;
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Turn: Player ${this.gameState.turn}`, 20, 30);
    
    if (this.gameState.dice > 0) {
      this.ctx.fillText(`Dice: ${this.gameState.dice}`, 20, 50);
    } else if (this.gameState.canRoll) {
      this.ctx.fillText('Press A to roll', 20, 50);
    }
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('LUDO', this.canvas.width / 2, 25);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const winner = this.gameState.players[this.gameState.winner - 1];
    this.ctx.fillStyle = winner.color;
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

window.LudoGame = LudoGame;