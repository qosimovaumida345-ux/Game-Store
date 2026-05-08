// Soccer Penalty Shootout
class SoccerPenaltyGame {
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
      shots: [0, 0],
      goals: [0, 0],
      status: 'aiming',
      ball: null,
      goalkeeper: null,
      target: { x: 0, y: 0 },
      power: 50,
      spin: 0,
      trajectory: [],
      gamePhase: 'penalty',
      round: 1,
      winner: null
    };
    
    this.config = {
      goalWidth: 300,
      goalHeight: 120,
      ballRadius: 12,
      kickDistance: 500,
      gravity: 0.15
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.resetBall();
    this.gameState.goalkeeper = {
      x: this.canvas.width / 2,
      y: 150,
      width: 60,
      height: 80,
      targetX: this.canvas.width / 2,
      speed: 3,
      diveTarget: null
    };
  }
  
  resetBall() {
    this.gameState.ball = {
      x: this.canvas.width / 2,
      y: this.canvas.height - 100,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      rotation: 0,
      active: false,
      scored: false,
      saved: false,
      missed: false
    };
    this.gameState.status = 'aiming';
    this.gameState.target = { x: this.canvas.width / 2, y: 150 };
    this.gameState.power = 50;
    this.gameState.spin = 0;
    this.gameState.trajectory = [];
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
    
    if (this.gameState.status === 'kicking') {
      this.updateBall(deltaTime);
      this.updateGoalkeeper(deltaTime);
    }
    
    if (this.gameState.status === 'result') {
      if (this.gameState.time > this.gameState.resultTime + 2) {
        this.nextTurn();
      }
    }
  }
  
  updateBall(deltaTime) {
    const ball = this.gameState.ball;
    
    if (!ball.active) return;
    
    ball.vy -= this.config.gravity * 100;
    ball.x += ball.vx * deltaTime * 60;
    ball.y += ball.vy * deltaTime * 60;
    ball.z += ball.vz * deltaTime * 60;
    ball.rotation += ball.vx * 0.1;
    
    if (ball.z > 0) {
      ball.vz *= 0.95;
    }
    
    this.gameState.trajectory.push({ x: ball.x, y: ball.y, z: ball.z });
    if (this.gameState.trajectory.length > 50) {
      this.gameState.trajectory.shift();
    }
    
    if (ball.y <= 150 && !ball.scored && !ball.saved && !ball.missed) {
      this.checkGoal();
    }
    
    if (ball.y < -100 || ball.x < 0 || ball.x > this.canvas.width) {
      ball.missed = true;
      this.gameState.status = 'result';
      this.gameState.resultTime = this.gameState.time;
    }
  }
  
  updateGoalkeeper(deltaTime) {
    const gk = this.gameState.goalkeeper;
    const ball = this.gameState.ball;
    
    if (ball.active && ball.vy > 0) {
      const predictedX = ball.x + (ball.y - gk.y) * (ball.vx / Math.abs(ball.vy));
      gk.targetX = predictedX;
    }
    
    const dx = gk.targetX - gk.x;
    gk.x += dx * gk.speed * deltaTime;
    gk.x = Math.max(200, Math.min(this.canvas.width - 200, gk.x));
    
    if (ball.y < 200 && ball.y > 100 && Math.abs(ball.x - gk.x) < 60) {
      ball.saved = true;
      this.gameState.status = 'result';
      this.gameState.resultTime = this.gameState.time;
    }
  }
  
  checkGoal() {
    const ball = this.gameState.ball;
    const goalLeft = (this.canvas.width - this.config.goalWidth) / 2;
    const goalRight = goalLeft + this.config.goalWidth;
    
    if (ball.y < 150 && ball.x > goalLeft && ball.x < goalRight && ball.z < 80) {
      ball.scored = true;
      this.gameState.goals[this.gameState.currentPlayer]++;
      this.gameState.status = 'result';
      this.gameState.resultTime = this.gameState.time;
    } else {
      ball.missed = true;
      this.gameState.status = 'result';
      this.gameState.resultTime = this.gameState.time;
    }
  }
  
  kick() {
    if (this.gameState.status !== 'aiming') return;
    
    const ball = this.gameState.ball;
    const target = this.gameState.target;
    
    const dx = target.x - ball.x;
    const dy = target.y - ball.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const powerFactor = this.gameState.power / 100;
    
    ball.vx = (dx / dist) * 15 * powerFactor;
    ball.vy = (dy / dist) * 12 * powerFactor + 5;
    ball.vz = (this.gameState.spin / 50) * 3;
    
    ball.active = true;
    this.gameState.status = 'kicking';
  }
  
  nextTurn() {
    this.gameState.currentPlayer = (this.gameState.currentPlayer + 1) % 2;
    this.gameState.shots[this.gameState.currentPlayer]++;
    this.resetBall();
    
    if (this.gameState.shots[0] >= 5 && this.gameState.shots[1] >= 5) {
      if (this.gameState.goals[0] !== this.gameState.goals[1]) {
        this.gameState.winner = this.gameState.goals[0] > this.gameState.goals[1] ? this.players[0] : this.players[1];
        this.gameState.status = 'gameover';
      } else {
        this.gameState.round++;
        this.gameState.shots = [0, 0];
      }
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (this.gameState.status !== 'aiming') return;
    
    const currentPlayer = this.players[this.gameState.currentPlayer];
    if (playerName !== currentPlayer) return;
    
    if (input.up) {
      this.gameState.target.y = Math.max(80, this.gameState.target.y - 5);
    }
    if (input.down) {
      this.gameState.target.y = Math.min(280, this.gameState.target.y + 5);
    }
    if (input.left) {
      this.gameState.target.x = Math.max(200, this.gameState.target.x - 5);
    }
    if (input.right) {
      this.gameState.target.x = Math.min(this.canvas.width - 200, this.gameState.target.x + 5);
    }
    if (input.a) {
      this.gameState.power = Math.min(100, this.gameState.power + 2);
    }
    if (input.b) {
      this.gameState.power = Math.max(20, this.gameState.power - 2);
    }
    if (input.action) {
      this.kick();
    }
  }
  
  render() {
    this.ctx.fillStyle = '#2d5a27';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawField();
    this.drawGoal();
    this.drawGoalkeeper();
    this.drawTrajectory();
    this.drawBall();
    this.drawAimIndicator();
    this.drawUI();
    
    if (this.gameState.status === 'gameover') {
      this.drawGameOver();
    }
    
    if (this.gameState.status === 'result' && this.gameState.ball.scored) {
      this.drawGoalCelebration();
    }
  }
  
  drawField() {
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    
    this.ctx.beginPath();
    this.ctx.moveTo(100, 100);
    this.ctx.lineTo(this.canvas.width - 100, 100);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, 450, 60, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(250, 100);
    this.ctx.lineTo(250, 300);
    this.ctx.lineTo(this.canvas.width - 250, 300);
    this.ctx.lineTo(this.canvas.width - 250, 100);
    this.ctx.stroke();
  }
  
  drawGoal() {
    const goalLeft = (this.canvas.width - this.config.goalWidth) / 2;
    const goalY = 150;
    
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 8;
    
    this.ctx.beginPath();
    this.ctx.moveTo(goalLeft, goalY + this.config.goalHeight);
    this.ctx.lineTo(goalLeft, goalY);
    this.ctx.lineTo(goalLeft + this.config.goalWidth, goalY);
    this.ctx.lineTo(goalLeft + this.config.goalWidth, goalY + this.config.goalHeight);
    this.ctx.stroke();
    
    this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    this.ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const y = goalY + i * 24;
      this.ctx.beginPath();
      this.ctx.moveTo(goalLeft, y);
      this.ctx.lineTo(goalLeft + this.config.goalWidth, y);
      this.ctx.stroke();
    }
  }
  
  drawGoalkeeper() {
    const gk = this.gameState.goalkeeper;
    
    this.ctx.fillStyle = '#ff4444';
    this.ctx.fillRect(gk.x - gk.width/2, gk.y, gk.width, gk.height);
    
    this.ctx.fillStyle = '#ffdd44';
    this.ctx.beginPath();
    this.ctx.arc(gk.x, gk.y - 10, 15, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(gk.x - 25, gk.y + 20, 50, 10);
  }
  
  drawTrajectory() {
    if (this.gameState.trajectory.length < 2) return;
    
    this.ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([5, 5]);
    
    this.ctx.beginPath();
    this.gameState.trajectory.forEach((point, i) => {
      const screenY = point.y - point.z;
      if (i === 0) {
        this.ctx.moveTo(point.x, screenY);
      } else {
        this.ctx.lineTo(point.x, screenY);
      }
    });
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }
  
  drawBall() {
    const ball = this.gameState.ball;
    const screenY = ball.y - ball.z;
    
    const gradient = this.ctx.createRadialGradient(
      ball.x - 3, screenY - 3, 0,
      ball.x, screenY, this.config.ballRadius
    );
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(0.7, '#ddd');
    gradient.addColorStop(1, '#999');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(ball.x, screenY, this.config.ballRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(ball.x, screenY, this.config.ballRadius, 0, Math.PI * 2);
    this.ctx.stroke();
  }
  
  drawAimIndicator() {
    if (this.gameState.status !== 'aiming') return;
    
    const target = this.gameState.target;
    
    this.ctx.strokeStyle = '#ff0';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(target.x, target.y, 20, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(target.x, target.y - 30);
    this.ctx.lineTo(target.x, target.y - 40);
    this.ctx.moveTo(target.x, target.y + 30);
    this.ctx.lineTo(target.x, target.y + 40);
    this.ctx.moveTo(target.x - 30, target.y);
    this.ctx.lineTo(target.x - 40, target.y);
    this.ctx.moveTo(target.x + 30, target.y);
    this.ctx.lineTo(target.x + 40, target.y);
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Power: ${this.gameState.power}%`, this.canvas.width / 2, this.canvas.height - 30);
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
    this.ctx.fillRect(10, 10, 200, 80);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${this.players[0]}: ${this.gameState.goals[0]}`, 20, 30);
    this.ctx.fillText(`${this.players[1]}: ${this.gameState.goals[1]}`, 20, 50);
    this.ctx.fillText(`Shot: ${this.gameState.shots[this.gameState.currentPlayer] + 1}/5`, 20, 70);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PENALTY SHOOTOUT', this.canvas.width / 2, 30);
    
    const currentPlayer = this.players[this.gameState.currentPlayer];
    this.ctx.fillStyle = '#4ecdc4';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`Turn: ${currentPlayer}`, this.canvas.width - 80, 30);
  }
  
  drawGoalCelebration() {
    this.ctx.fillStyle = 'rgba(0,255,0,0.3)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GOAL!', this.canvas.width / 2, this.canvas.height / 2);
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
    this.ctx.fillText(`${this.gameState.goals[0]} - ${this.gameState.goals[1]}`, this.canvas.width / 2, this.canvas.height / 2 + 70);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.SoccerPenaltyGame = SoccerPenaltyGame;