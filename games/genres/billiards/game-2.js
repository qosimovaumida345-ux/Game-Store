// 8-Ball Pool Game
class Pool8BallGame {
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
      scores: [0, 0],
      currentPlayer: 0,
      status: 'aiming',
      cueBall: null,
      balls: [],
      pockets: [],
      cuePower: 50,
      cueAngle: 0,
      gameOver: false,
      winner: null,
      ballTypes: { 0: 'solid', 1: 'stripe', 2: 'black' },
      playerTypes: [null, null],
      solidsTaken: 0,
      stripesTaken: 0
    };
    
    this.config = {
      ballRadius: 12,
      friction: 0.985,
      pocketRadius: 22,
      maxPower: 20
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.pockets = [
      { x: 40, y: 40 }, { x: 400, y: 20 }, { x: 760, y: 40 },
      { x: 40, y: 560 }, { x: 400, y: 580 }, { x: 760, y: 560 }
    ];
    
    this.gameState.cueBall = { x: 200, y: 300, vx: 0, vy: 0, color: '#fff', number: 0 };
    
    this.setupBalls();
  }
  
  setupBalls() {
    this.gameState.balls = [];
    
    const colors = [
      '#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#e67e22', '#1abc9c',
      '#8e44ad', '#27ae60', '#d35400', '#c0392b', '#16a085', '#2980b9', '#8e44ad'
    ];
    
    const numbers = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15];
    
    let startX = 550;
    let startY = 300;
    let row = 0;
    
    for (let i = 0; i < 14; i++) {
      const x = startX + (i % 4) * 25 + (i > 3 ? 12 : 0);
      const y = startY + row * 22 - (i > 3 ? 22 : 0);
      
      if (i === 3) row++;
      if (i === 10) row++;
      
      this.gameState.balls.push({
        x: x, y: y,
        vx: 0, vy: 0,
        color: colors[i],
        number: numbers[i],
        pocketed: false,
        type: numbers[i] <= 7 ? 'solid' : 'stripe'
      });
    }
    
    this.gameState.balls.push({
      x: startX + 50, y: startY + 22,
      vx: 0, vy: 0,
      color: '#000',
      number: 8,
      pocketed: false,
      type: 'black'
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
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    this.update(deltaTime);
    this.render();
    requestAnimationFrame((time) => this.gameLoop(time));
  }
  
  update(deltaTime) {
    this.gameState.time += deltaTime;
    
    if (this.gameState.status === 'moving') {
      this.updateBalls(deltaTime);
      this.checkPockets();
      
      if (this.allBallsStopped()) {
        this.nextTurn();
      }
    }
  }
  
  updateBalls(deltaTime) {
    const updateBall = (ball) => {
      ball.x += ball.vx;
      ball.y += ball.vy;
      
      ball.vx *= this.config.friction;
      ball.vy *= this.config.friction;
      
      if (Math.abs(ball.vx) < 0.1) ball.vx = 0;
      if (Math.abs(ball.vy) < 0.1) ball.vy = 0;
      
      if (ball.x < this.config.ballRadius || ball.x > this.canvas.width - this.config.ballRadius) {
        ball.vx *= -0.8;
        ball.x = Math.max(this.config.ballRadius, Math.min(this.canvas.width - this.config.ballRadius, ball.x));
      }
      if (ball.y < this.config.ballRadius || ball.y > this.canvas.height - this.config.ballRadius) {
        ball.vy *= -0.8;
        ball.y = Math.max(this.config.ballRadius, Math.min(this.canvas.height - this.config.ballRadius, ball.y));
      }
    };
    
    updateBall(this.gameState.cueBall);
    this.gameState.balls.forEach(ball => {
      if (!ball.pocketed) updateBall(ball);
    });
    
    this.checkBallCollisions();
  }
  
  checkBallCollisions() {
    const allBalls = [this.gameState.cueBall, ...this.gameState.balls.filter(b => !b.pocketed)];
    
    for (let i = 0; i < allBalls.length; i++) {
      for (let j = i + 1; j < allBalls.length; j++) {
        const b1 = allBalls[i];
        const b2 = allBalls[j];
        
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < this.config.ballRadius * 2) {
          const angle = Math.atan2(dy, dx);
          const overlap = this.config.ballRadius * 2 - dist;
          
          b1.x -= Math.cos(angle) * overlap / 2;
          b1.y -= Math.sin(angle) * overlap / 2;
          b2.x += Math.cos(angle) * overlap / 2;
          b2.y += Math.sin(angle) * overlap / 2;
          
          const v1 = Math.sqrt(b1.vx * b1.vx + b1.vy * b1.vy);
          const v2 = Math.sqrt(b2.vx * b2.vx + b2.vy * b2.vy);
          
          b1.vx = v2 * Math.cos(angle);
          b1.vy = v2 * Math.sin(angle);
          b2.vx = v1 * Math.cos(angle + Math.PI);
          b2.vy = v1 * Math.sin(angle + Math.PI);
        }
      }
    }
  }
  
  checkPockets() {
    const checkPocket = (ball) => {
      if (ball.pocketed) return;
      
      this.gameState.pockets.forEach(pocket => {
        const dx = ball.x - pocket.x;
        const dy = ball.y - pocket.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < this.config.pocketRadius) {
          ball.pocketed = true;
          ball.vx = 0;
          ball.vy = 0;
          
          if (ball.number === 0) {
            ball.x = 200;
            ball.y = 300;
            ball.pocketed = false;
          } else if (ball.number === 8) {
            this.check8BallWin();
          } else {
            this.gameState.scores[this.gameState.currentPlayer] += ball.number;
          }
        }
      });
    };
    
    checkPocket(this.gameState.cueBall);
    this.gameState.balls.forEach(ball => checkPocket(ball));
  }
  
  check8BallWin() {
    const playerType = this.gameState.playerTypes[this.gameState.currentPlayer];
    
    if (playerType === 'solid' && this.gameState.solidsTaken === 7) {
      this.gameState.winner = this.players[this.gameState.currentPlayer];
      this.gameState.gameOver = true;
    } else if (playerType === 'stripe' && this.gameState.stripesTaken === 7) {
      this.gameState.winner = this.players[this.gameState.currentPlayer];
      this.gameState.gameOver = true;
    } else {
      this.gameState.winner = this.players[1 - this.gameState.currentPlayer];
      this.gameState.gameOver = true;
    }
  }
  
  allBallsStopped() {
    if (Math.abs(this.gameState.cueBall.vx) > 0.1 || Math.abs(this.gameState.cueBall.vy) > 0.1) return false;
    return this.gameState.balls.every(ball => ball.pocketed || (Math.abs(ball.vx) < 0.1 && Math.abs(ball.vy) < 0.1));
  }
  
  shoot() {
    if (this.gameState.status !== 'aiming') return;
    
    const ball = this.gameState.cueBall;
    const angleRad = this.gameState.cueAngle * Math.PI / 180;
    const power = this.gameState.cuePower / 100 * this.config.maxPower;
    
    ball.vx = Math.cos(angleRad) * power;
    ball.vy = Math.sin(angleRad) * power;
    
    this.gameState.status = 'moving';
  }
  
  nextTurn() {
    this.gameState.currentPlayer = (this.gameState.currentPlayer + 1) % 2;
    this.gameState.status = 'aiming';
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (this.gameState.status !== 'aiming') return;
    if (playerName !== this.players[this.gameState.currentPlayer]) return;
    
    if (input.left) this.gameState.cueAngle -= 2;
    if (input.right) this.gameState.cueAngle += 2;
    if (input.up) this.gameState.cuePower = Math.min(100, this.gameState.cuePower + 2);
    if (input.down) this.gameState.cuePower = Math.max(20, this.gameState.cuePower - 2);
    if (input.action) this.shoot();
  }
  
  render() {
    this.drawTable();
    this.drawPockets();
    this.drawBalls();
    this.drawCue();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawTable() {
    this.ctx.fillStyle = '#1a472a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#2d5a3d';
    this.ctx.fillRect(30, 30, this.canvas.width - 60, this.canvas.height - 60);
    
    this.ctx.strokeStyle = '#8b4513';
    this.ctx.lineWidth = 18;
    this.ctx.strokeRect(20, 20, this.canvas.width - 40, this.canvas.height - 40);
  }
  
  drawPockets() {
    this.gameState.pockets.forEach(pocket => {
      this.ctx.fillStyle = '#111';
      this.ctx.beginPath();
      this.ctx.arc(pocket.x, pocket.y, this.config.pocketRadius, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawBalls() {
    const drawBall = (ball, isCue = false) => {
      if (ball.pocketed) return;
      
      const gradient = this.ctx.createRadialGradient(ball.x - 3, ball.y - 3, 0, ball.x, ball.y, this.config.ballRadius);
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(1, isCue ? '#ddd' : ball.color);
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(ball.x, ball.y, this.config.ballRadius, 0, Math.PI * 2);
      this.ctx.fill();
      
      if (!isCue) {
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, this.config.ballRadius - 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 9px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(ball.number, ball.x, ball.y + 4);
      }
    };
    
    drawBall(this.gameState.cueBall, true);
    this.gameState.balls.forEach(ball => drawBall(ball));
  }
  
  drawCue() {
    if (this.gameState.status !== 'aiming') return;
    
    const ball = this.gameState.cueBall;
    const angleRad = this.gameState.cueAngle * Math.PI / 180;
    const cueLength = 150 + this.gameState.cuePower;
    const startX = ball.x - Math.cos(angleRad) * 30;
    const startY = ball.y - Math.sin(angleRad) * 30;
    const endX = startX - Math.cos(angleRad) * cueLength;
    const endY = startY - Math.sin(angleRad) * cueLength;
    
    this.ctx.strokeStyle = '#8b4513';
    this.ctx.lineWidth = 8;
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 150, 70);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${this.players[0]}: ${this.gameState.scores[0]}`, 20, 30);
    this.ctx.fillText(`${this.players[1]}: ${this.gameState.scores[1]}`, 20, 50);
    
    const currentPlayer = this.players[this.gameState.currentPlayer];
    this.ctx.fillStyle = '#4ecdc4';
    this.ctx.fillText(`Turn: ${currentPlayer}`, 20, 70);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('8-BALL POOL', this.canvas.width / 2, 30);
    
    if (this.gameState.status === 'aiming') {
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '12px Arial';
      this.ctx.fillText(`Power: ${this.gameState.cuePower}%`, this.canvas.width / 2, this.canvas.height - 15);
    }
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`${this.gameState.winner} Wins!`, this.canvas.width / 2, this.canvas.height / 2 + 30);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.Pool8BallGame = Pool8BallGame;