// Bowling Strike Game
class BowlingStrikeGame {
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
      currentPlayer: 0,
      frames: [[0, 0], [0, 0]],
      scores: [0, 0],
      status: 'aiming',
      ball: null,
      pins: [],
      power: 50,
      spin: 0,
      angle: 0,
      throwCount: [0, 0],
      frameIndex: 0,
      gameOver: false,
      winner: null
    };
    
    this.config = {
      laneWidth: 200,
      laneLength: 500,
      pinCount: 10,
      ballRadius: 15,
      gutterWidth: 30
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.resetPins();
    this.gameState.ball = {
      x: this.canvas.width / 2,
      y: this.canvas.height - 50,
      vx: 0,
      vy: 0,
      rotation: 0,
      active: false,
      knockedPins: []
    };
  }
  
  resetPins() {
    this.gameState.pins = [];
    const startX = this.canvas.width / 2;
    const startY = 150;
    const rowSpacing = 25;
    const pinSpacing = 20;
    
    let rows = 4;
    for (let row = 0; row < rows; row++) {
      const pinsInRow = 4 - row;
      const rowWidth = (pinsInRow - 1) * pinSpacing;
      const startPinX = startX - rowWidth / 2;
      
      for (let p = 0; p < pinsInRow; p++) {
        this.gameState.pins.push({
          x: startPinX + p * pinSpacing,
          y: startY + row * rowSpacing,
          standing: true,
          knocked: false,
          velocity: { x: 0, y: 0 }
        });
      }
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
    this.gameState.time += deltaTime;
    
    if (this.gameState.status === 'rolling') {
      this.updateBall(deltaTime);
      this.updatePins(deltaTime);
    }
  }
  
  updateBall(deltaTime) {
    const ball = this.gameState.ball;
    
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.rotation += ball.vx * 0.1;
    
    ball.vx *= 0.995;
    ball.vy *= 0.995;
    
    if (ball.vy < 0 && ball.y < 180) {
      this.checkPinCollisions();
      this.gameState.status = 'settling';
      setTimeout(() => this.finishThrow(), 2000);
    }
  }
  
  updatePins(deltaTime) {
    this.gameState.pins.forEach(pin => {
      if (pin.standing && !pin.knocked) return;
      if (pin.knocked) {
        pin.x += pin.velocity.x;
        pin.y += pin.velocity.y;
        pin.velocity.x *= 0.95;
        pin.velocity.y *= 0.95;
        
        if (Math.abs(pin.velocity.x) < 0.5 && Math.abs(pin.velocity.y) < 0.5) {
          pin.knocked = false;
        }
      }
    });
    
    this.checkPinCollisions();
  }
  
  checkPinCollisions() {
    const ball = this.gameState.ball;
    
    this.gameState.pins.forEach(pin => {
      if (!pin.standing) return;
      
      const dx = ball.x - pin.x;
      const dy = ball.y - pin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 25) {
        pin.standing = false;
        pin.knocked = true;
        pin.velocity.x = ball.vx * 0.5 + (Math.random() - 0.5) * 3;
        pin.velocity.y = ball.vy * 0.5 + (Math.random() - 0.5) * 3;
        
        if (!ball.knockedPins.includes(pin)) {
          ball.knockedPins.push(pin);
          ball.vx *= 0.7;
          ball.vy *= 0.7;
        }
      }
    });
    
    for (let i = 0; i < this.gameState.pins.length; i++) {
      for (let j = i + 1; j < this.gameState.pins.length; j++) {
        const p1 = this.gameState.pins[i];
        const p2 = this.gameState.pins[j];
        
        if (!p1.standing && !p2.standing) {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 20) {
            const angle = Math.atan2(dy, dx);
            const push = 2;
            p1.velocity.x += Math.cos(angle) * push;
            p1.velocity.y += Math.sin(angle) * push;
            p2.velocity.x -= Math.cos(angle) * push;
            p2.velocity.y -= Math.sin(angle) * push;
          }
        }
      }
    }
  }
  
  throwBall() {
    if (this.gameState.status !== 'aiming') return;
    
    const ball = this.gameState.ball;
    const power = this.gameState.power / 100;
    const angleRad = this.gameState.angle * Math.PI / 180;
    
    ball.vx = Math.sin(angleRad) * 12 * power;
    ball.vy = -15 * power;
    ball.active = true;
    ball.knockedPins = [];
    
    this.gameState.status = 'rolling';
  }
  
  finishThrow() {
    const ball = this.gameState.ball;
    const pinsDown = ball.knockedPins.length;
    const currentPlayer = this.gameState.currentPlayer;
    const throwNum = this.gameState.throwCount[currentPlayer] % 2;
    
    if (throwNum === 0) {
      if (pinsDown === 10) {
        this.gameState.frames[currentPlayer] = [10, 0];
        this.calculateScore(currentPlayer);
        this.nextPlayer();
      } else {
        this.gameState.frames[currentPlayer][0] = pinsDown;
        this.gameState.throwCount[currentPlayer]++;
        this.gameState.status = 'aiming';
        this.resetBall();
      }
    } else {
      this.gameState.frames[currentPlayer][1] = pinsDown;
      this.calculateScore(currentPlayer);
      this.nextPlayer();
    }
  }
  
  calculateScore(playerIndex) {
    let total = 0;
    this.gameState.scores[playerIndex] = 0;
    
    const currentFrame = this.gameState.frames[playerIndex];
    
    if (currentFrame[0] === 10) {
      total = 30;
    } else if (currentFrame[0] + currentFrame[1] === 10) {
      total = 20 + (currentFrame[0] === 10 ? 10 : currentFrame[1]);
    } else {
      total = currentFrame[0] + currentFrame[1];
    }
    
    this.gameState.scores[playerIndex] = total;
  }
  
  nextPlayer() {
    this.gameState.currentPlayer = (this.gameState.currentPlayer + 1) % 2;
    this.gameState.frameIndex++;
    
    if (this.gameState.frameIndex >= 10) {
      if (this.gameState.scores[0] > this.gameState.scores[1]) {
        this.gameState.winner = this.players[0];
      } else if (this.gameState.scores[1] > this.gameState.scores[0]) {
        this.gameState.winner = this.players[1];
      } else {
        this.gameState.winner = 'Draw';
      }
      this.gameState.gameOver = true;
    } else {
      this.gameState.frames = [[0, 0], [0, 0]];
      this.resetPins();
      this.resetBall();
      this.gameState.status = 'aiming';
    }
  }
  
  resetBall() {
    this.gameState.ball.x = this.canvas.width / 2;
    this.gameState.ball.y = this.canvas.height - 50;
    this.gameState.ball.vx = 0;
    this.gameState.ball.vy = 0;
    this.gameState.ball.rotation = 0;
    this.gameState.ball.active = false;
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (this.gameState.status !== 'aiming') return;
    
    const currentPlayer = this.players[this.gameState.currentPlayer];
    if (playerName !== currentPlayer) return;
    
    if (input.left) {
      this.gameState.angle = Math.max(-30, this.gameState.angle - 2);
    }
    if (input.right) {
      this.gameState.angle = Math.min(30, this.gameState.angle + 2);
    }
    if (input.up) {
      this.gameState.power = Math.min(100, this.gameState.power + 2);
    }
    if (input.down) {
      this.gameState.power = Math.max(30, this.gameState.power - 2);
    }
    if (input.action) {
      this.throwBall();
    }
  }
  
  render() {
    this.drawLane();
    this.drawGutters();
    this.drawPins();
    this.drawBall();
    this.drawAimLine();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawLane() {
    const laneX = (this.canvas.width - this.config.laneWidth) / 2;
    
    this.ctx.fillStyle = '#d4a574';
    this.ctx.fillRect(laneX, 0, this.config.laneWidth, this.canvas.height);
    
    this.ctx.strokeStyle = 'rgba(139, 90, 43, 0.3)';
    this.ctx.lineWidth = 1;
    for (let y = 0; y < this.canvas.height; y += 20) {
      this.ctx.beginPath();
      this.ctx.moveTo(laneX, y);
      this.ctx.lineTo(laneX + this.config.laneWidth, y);
      this.ctx.stroke();
    }
    
    this.ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(laneX + 30, 0);
    this.ctx.lineTo(laneX + 30, this.canvas.height);
    this.ctx.moveTo(laneX + this.config.laneWidth - 30, 0);
    this.ctx.lineTo(laneX + this.config.laneWidth - 30, this.canvas.height);
    this.ctx.stroke();
  }
  
  drawGutters() {
    const laneX = (this.canvas.width - this.config.laneWidth) / 2;
    
    this.ctx.fillStyle = '#222';
    this.ctx.fillRect(laneX - 30, 0, 30, this.canvas.height);
    this.ctx.fillRect(laneX + this.config.laneWidth, 0, 30, this.canvas.height);
  }
  
  drawPins() {
    this.gameState.pins.forEach(pin => {
      if (!pin.standing && !pin.knocked) return;
      
      if (pin.standing) {
        const gradient = this.ctx.createRadialGradient(
          pin.x - 3, pin.y - 10, 0,
          pin.x, pin.y, 10
        );
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(1, '#ddd');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.ellipse(pin.x, pin.y, 8, 12, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#c00';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(pin.x - 4, pin.y - 6);
        this.ctx.lineTo(pin.x + 4, pin.y - 6);
        this.ctx.stroke();
      } else {
        this.ctx.fillStyle = '#aaa';
        this.ctx.beginPath();
        this.ctx.arc(pin.x, pin.y, 8, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }
  
  drawBall() {
    const ball = this.gameState.ball;
    
    const gradient = this.ctx.createRadialGradient(
      ball.x - 5, ball.y - 5, 0,
      ball.x, ball.y, this.config.ballRadius
    );
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, this.config.ballRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#e94560';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, this.config.ballRadius - 3, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, this.config.ballRadius, 0, Math.PI * 2);
    this.ctx.stroke();
  }
  
  drawAimLine() {
    if (this.gameState.status !== 'aiming') return;
    
    const ball = this.gameState.ball;
    const angleRad = this.gameState.angle * Math.PI / 180;
    
    this.ctx.strokeStyle = 'rgba(255,255,0,0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([10, 5]);
    
    this.ctx.beginPath();
    this.ctx.moveTo(ball.x, ball.y);
    const endX = ball.x + Math.sin(angleRad) * 200;
    const endY = ball.y - 200;
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
    
    this.ctx.setLineDash([]);
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 180, 90);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${this.players[0]}: ${this.gameState.scores[0]}`, 20, 30);
    this.ctx.fillText(`${this.players[1]}: ${this.gameState.scores[1]}`, 20, 50);
    this.ctx.fillText(`Frame: ${this.gameState.frameIndex + 1}/10`, 20, 70);
    
    const currentPlayer = this.players[this.gameState.currentPlayer];
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BOWLING', this.canvas.width / 2, 25);
    
    this.ctx.fillStyle = '#4ecdc4';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`Turn: ${currentPlayer}`, this.canvas.width - 70, 25);
    
    if (this.gameState.status === 'aiming') {
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '12px Arial';
      this.ctx.fillText(`Power: ${this.gameState.power}%`, this.canvas.width / 2, this.canvas.height - 20);
      this.ctx.fillText(`Angle: ${this.gameState.angle}°`, this.canvas.width / 2, this.canvas.height - 5);
    }
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`${this.gameState.winner} Wins!`, this.canvas.width / 2, this.canvas.height / 2 + 30);
    this.ctx.fillText(`${this.gameState.scores[0]} - ${this.gameState.scores[1]}`, this.canvas.width / 2, this.canvas.height / 2 + 70);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.BowlingStrikeGame = BowlingStrikeGame;