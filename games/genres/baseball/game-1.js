// Baseball League Game
class BaseballLeagueGame {
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
      score: [0, 0],
      innings: 1,
      outs: 0,
      runners: [],
      status: 'pitching',
      pitcher: null,
      batter: null,
      ball: null,
      batAngle: 0,
      batSwing: false,
      pitchType: 'fastball',
      pitchSpeed: 8,
      power: 50,
      contact: 50,
      gameOver: false,
      winner: null,
      currentInningHalf: 'top'
    };
    
    this.config = {
      homePlate: { x: 400, y: 500 },
      mound: { x: 400, y: 350 },
      bases: [
        { x: 500, y: 450, occupied: false },
        { x: 400, y: 350, occupied: false },
        { x: 300, y: 450, occupied: false }
      ],
      strikeZone: { x: 400, y: 250, w: 60, h: 80 }
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.ball = {
      x: this.config.mound.x,
      y: this.config.mound.y,
      vx: 0,
      vy: 0,
      active: false,
      inPlay: false,
      hitType: null
    };
    this.gameState.runners = [false, false, false];
    this.gameState.outs = 0;
    this.gameState.batter = 0;
    this.gameState.pitcher = 1;
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
    
    if (this.gameState.status === 'pitching' || this.gameState.status === 'balling') {
      this.updatePitch(deltaTime);
    }
    
    if (this.gameState.status === 'batting') {
      this.updateBat(deltaTime);
    }
    
    if (this.gameState.status === 'inplay') {
      this.updateInPlay(deltaTime);
    }
  }
  
  updatePitch(deltaTime) {
    const ball = this.gameState.ball;
    if (!ball.active) return;
    
    ball.y += ball.vy;
    ball.x += ball.vx;
    
    const sz = this.config.strikeZone;
    
    if (ball.y > sz.y && ball.y < sz.y + sz.h && ball.x > sz.x - sz.w/2 && ball.x < sz.x + sz.w/2) {
      if (this.gameState.batSwing) {
        this.hitBall();
      } else {
        this.strike();
      }
    }
    
    if (ball.y > this.canvas.height) {
      this.ball();
    }
  }
  
  updateBat(deltaTime) {
    if (this.gameState.batSwing) {
      this.gameState.batAngle += 15;
      if (this.gameState.batAngle > 90) {
        this.gameState.batAngle = 90;
        this.swingComplete();
      }
    }
  }
  
  updateInPlay(deltaTime) {
    const ball = this.gameState.ball;
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    if (ball.y < 0 || ball.x < 0 || ball.x > this.canvas.width) {
      if (ball.hitType === 'home_run') {
        this.scoreRunners(4);
      } else if (ball.hitType === 'triple') {
        this.scoreRunners(3);
      } else if (ball.hitType === 'double') {
        this.scoreRunners(2);
      } else {
        this.scoreRunners(1);
      }
      this.nextBatter();
    }
  }
  
  pitch() {
    if (this.gameState.status !== 'pitching') return;
    
    const ball = this.gameState.ball;
    const batter = this.gameState.players[this.gameState.batter];
    const input = this.getPlayerInput(batter);
    
    const types = ['fastball', 'curveball', 'slider'];
    this.gameState.pitchType = types[Math.floor(Math.random() * types.length)];
    this.gameState.pitchSpeed = 8 + Math.random() * 4;
    
    ball.active = true;
    ball.x = this.config.mound.x;
    ball.y = this.config.mound.y;
    
    const targetX = this.config.homePlate.x + (Math.random() - 0.5) * 60;
    const targetY = this.config.homePlate.y;
    
    const dx = targetX - ball.x;
    const dy = targetY - ball.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    ball.vx = (dx / dist) * this.gameState.pitchSpeed;
    ball.vy = (dy / dist) * this.gameState.pitchSpeed;
    
    this.gameState.status = 'balling';
  }
  
  swing() {
    if (this.gameState.status !== 'pitching' && this.gameState.status !== 'balling') return;
    
    const ball = this.gameState.ball;
    if (!ball.active) return;
    
    this.gameState.batSwing = true;
  }
  
  swingComplete() {
    const ball = this.gameState.ball;
    const contact = this.gameState.contact / 100;
    const power = this.gameState.power / 100;
    
    const ballInZone = ball.y > this.config.strikeZone.y && ball.y < this.config.strikeZone.y + this.config.strikeZone.h;
    
    if (ballInZone && Math.random() < contact) {
      this.hitBall();
    } else {
      this.strike();
    }
    
    this.gameState.batSwing = false;
    this.gameState.batAngle = 0;
  }
  
  hitBall() {
    const ball = this.gameState.ball;
    ball.inPlay = true;
    this.gameState.status = 'inplay';
    
    const hitTypes = ['single', 'double', 'triple', 'home_run'];
    const rand = Math.random();
    
    if (rand < 0.6) ball.hitType = 'single';
    else if (rand < 0.8) ball.hitType = 'double';
    else if (rand < 0.9) ball.hitType = 'triple';
    else ball.hitType = 'home_run';
    
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
    const speed = 10 + this.gameState.power / 10;
    
    ball.vx = Math.cos(angle) * speed;
    ball.vy = Math.sin(angle) * speed;
  }
  
  strike() {
    this.gameState.outs++;
    
    if (this.gameState.outs >= 3) {
      this.nextInning();
    } else {
      this.gameState.status = 'pitching';
      this.gameState.ball.active = false;
      this.gameState.ball.x = this.config.mound.x;
      this.gameState.ball.y = this.config.mound.y;
    }
  }
  
  ball() {
    const batter = this.gameState.players[this.gameState.batter];
    const input = this.getPlayerInput(batter);
    
    this.gameState.status = 'pitching';
    this.gameState.ball.active = false;
    this.gameState.ball.x = this.config.mound.x;
    this.gameState.ball.y = this.config.mound.y;
  }
  
  scoreRunners(bases) {
    let runs = 0;
    
    for (let i = 0; i < bases; i++) {
      if (this.gameState.runners[2 - i]) {
        runs++;
        this.gameState.runners[2 - i] = false;
      }
    }
    
    this.gameState.score[this.gameState.currentInningHalf === 'top' ? 1 : 0] += runs;
  }
  
  nextBatter() {
    this.gameState.batter = (this.gameState.batter + 1) % 2;
    this.gameState.outs = 0;
    this.gameState.runners = [false, false, false];
    this.gameState.status = 'pitching';
    this.gameState.ball.active = false;
    this.gameState.ball.x = this.config.mound.x;
    this.gameState.ball.y = this.config.mound.y;
    this.gameState.ball.inPlay = false;
  }
  
  nextInning() {
    if (this.gameState.currentInningHalf === 'top') {
      this.gameState.currentInningHalf = 'bottom';
    } else {
      this.gameState.currentInningHalf = 'top';
      this.gameState.innings++;
    }
    
    if (this.gameState.innings > 9) {
      this.endGame();
      return;
    }
    
    this.gameState.outs = 0;
    this.gameState.runners = [false, false, false];
    this.gameState.status = 'pitching';
    this.gameState.ball.active = false;
    this.gameState.ball.x = this.config.mound.x;
    this.gameState.ball.y = this.config.mound.y;
    this.gameState.ball.inPlay = false;
  }
  
  endGame() {
    if (this.gameState.score[0] > this.gameState.score[1]) {
      this.gameState.winner = this.players[0];
    } else if (this.gameState.score[1] > this.gameState.score[0]) {
      this.gameState.winner = this.players[1];
    } else {
      this.gameState.winner = 'Draw';
    }
    this.gameState.gameOver = true;
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    const batter = this.players[this.gameState.batter];
    if (playerName !== batter) return;
    
    if (input.action) {
      this.swing();
    }
    
    if (input.a) {
      this.gameState.power = Math.min(100, this.gameState.power + 2);
    }
    if (input.b) {
      this.gameState.power = Math.max(20, this.gameState.power - 2);
    }
    if (input.up) {
      this.gameState.contact = Math.min(100, this.gameState.contact + 2);
    }
    if (input.down) {
      this.gameState.contact = Math.max(20, this.gameState.contact - 2);
    }
  }
  
  render() {
    this.drawField();
    this.drawBases();
    this.drawBatter();
    this.drawBall();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawField() {
    const gradient = this.ctx.createRadialGradient(400, 500, 0, 400, 500, 400);
    gradient.addColorStop(0, '#4a7c59');
    gradient.addColorStop(1, '#2d5a3d');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#8b4513';
    this.ctx.beginPath();
    this.ctx.moveTo(200, 500);
    this.ctx.lineTo(400, 350);
    this.ctx.lineTo(600, 500);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(400, 350);
    this.ctx.lineTo(400, 500);
    this.ctx.stroke();
  }
  
  drawBases() {
    this.config.bases.forEach((base, i) => {
      this.ctx.fillStyle = this.gameState.runners[i] ? '#ff0' : '#fff';
      this.ctx.fillRect(base.x - 15, base.y - 15, 30, 30);
    });
    
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(this.config.homePlate.x, this.config.homePlate.y, 10, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  drawBatter() {
    const x = this.config.homePlate.x;
    const y = this.config.homePlate.y - 30;
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 12, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(this.gameState.batAngle * Math.PI / 180);
    this.ctx.fillStyle = '#8b4513';
    this.ctx.fillRect(10, -3, 40, 6);
    this.ctx.restore();
  }
  
  drawBall() {
    const ball = this.gameState.ball;
    if (!ball.active) return;
    
    const gradient = this.ctx.createRadialGradient(
      ball.x - 2, ball.y - 2, 0, ball.x, ball.y, 6
    );
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(1, '#ccc');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, 6, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, 6, 0, Math.PI * 2);
    this.ctx.stroke();
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 150, 100);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${this.players[0]}: ${this.gameState.score[0]}`, 20, 30);
    this.ctx.fillText(`${this.players[1]}: ${this.gameState.score[1]}`, 20, 50);
    this.ctx.fillText(`Inning: ${this.gameState.innings}`, 20, 70);
    this.ctx.fillText(`Outs: ${this.gameState.outs}`, 20, 90);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BASEBALL', this.canvas.width / 2, 25);
    
    const batter = this.players[this.gameState.batter];
    this.ctx.fillStyle = '#4ecdc4';
    this.ctx.font = '12px Arial';
    this.ctx.fillText(`Batter: ${batter}`, this.canvas.width - 60, 25);
    
    if (this.gameState.status === 'pitching') {
      this.ctx.fillStyle = '#ff4444';
      this.ctx.fillText('Press ACTION to swing', this.canvas.width / 2, this.canvas.height - 10);
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
    this.ctx.fillText(`Winner: ${this.gameState.winner}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    this.ctx.fillText(`${this.gameState.score[0]} - ${this.gameState.score[1]}`, this.canvas.width / 2, this.canvas.height / 2 + 60);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.BaseballLeagueGame = BaseballLeagueGame;