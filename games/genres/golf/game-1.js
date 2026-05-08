// Golf Master Game
class GolfMasterGame {
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
      currentHole: 0,
      scores: [0, 0],
      strokes: [0, 0],
      status: 'aiming',
      ball: null,
      hole: null,
      clubs: ['Driver', 'Iron', 'Wedge', 'Putter'],
      clubIndex: 2,
      power: 50,
      aimAngle: 0,
      wind: 0,
      currentPlayer: 0,
      gameOver: false,
      winner: null
    };
    
    this.config = {
      holeCount: 9,
      ballRadius: 6,
      holeRadius: 10,
      gravity: 0.2,
      friction: 0.98
    };
    
    this.holes = this.generateHoles();
    this.initGame();
  }
  
  generateHoles() {
    return [
      { x: 600, y: 200, par: 3, tee: { x: 100, y: 400 }, obstacles: [] },
      { x: 700, y: 150, par: 4, tee: { x: 100, y: 450 }, obstacles: [{ x: 300, y: 300, w: 50, h: 100 }] },
      { x: 500, y: 300, par: 3, tee: { x: 150, y: 350 }, obstacles: [{ x: 350, y: 250, r: 30 }] },
      { x: 650, y: 400, par: 5, tee: { x: 100, y: 200 }, obstacles: [{ x: 300, y: 300, w: 80, h: 40 }] },
      { x: 550, y: 180, par: 4, tee: { x: 150, y: 400 }, obstacles: [{ x: 400, y: 280, r: 40 }] },
      { x: 680, y: 280, par: 3, tee: { x: 200, y: 420 }, obstacles: [] },
      { x: 620, y: 350, par: 4, tee: { x: 120, y: 180 }, obstacles: [{ x: 350, y: 250, w: 60, h: 80 }] },
      { x: 500, y: 220, par: 3, tee: { x: 100, y: 380 }, obstacles: [{ x: 300, y: 300, r: 25 }] },
      { x: 700, y: 300, par: 5, tee: { x: 80, y: 450 }, obstacles: [{ x: 350, y: 350, w: 40, h: 60 }, { x: 500, y: 280, r: 35 }] }
    ];
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.loadHole(0);
  }
  
  loadHole(holeIndex) {
    const hole = this.holes[holeIndex];
    this.gameState.ball = {
      x: hole.tee.x,
      y: hole.tee.y,
      vx: 0,
      vy: 0,
      active: false,
      inHole: false
    };
    this.gameState.hole = { x: hole.x, y: hole.y };
    this.gameState.wind = (Math.random() - 0.5) * 2;
    this.gameState.status = 'aiming';
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
    }
  }
  
  updateBall(deltaTime) {
    const ball = this.gameState.ball;
    const hole = this.holes[this.gameState.currentHole];
    
    ball.vx += this.gameState.wind * 0.1;
    ball.vy += this.config.gravity;
    
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    ball.vx *= this.config.friction;
    ball.vy *= this.config.friction;
    
    this.checkObstacles(hole);
    
    if (ball.x < 0 || ball.x > this.canvas.width || ball.y < 0 || ball.y > this.canvas.height) {
      this.addStrokePenalty();
      return;
    }
    
    const dx = ball.x - hole.x;
    const dy = ball.y - hole.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (dist < this.config.holeRadius && speed < 5) {
      this.ballInHole();
      return;
    }
    
    if (Math.abs(ball.vx) < 0.1 && Math.abs(ball.vy) < 0.1) {
      ball.vx = 0;
      ball.vy = 0;
      ball.active = false;
      this.gameState.status = 'aiming';
      
      const currentPlayer = this.gameState.currentPlayer;
      if (this.gameState.strokes[currentPlayer] >= 10) {
        this.addStrokePenalty();
      }
    }
  }
  
  checkObstacles(hole) {
    const ball = this.gameState.ball;
    
    if (hole.obstacles) {
      hole.obstacles.forEach(obs => {
        if (obs.r) {
          const dx = ball.x - obs.x;
          const dy = ball.y - obs.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < obs.r + 5) {
            const angle = Math.atan2(dy, dx);
            ball.x = obs.x + Math.cos(angle) * (obs.r + 6);
            ball.y = obs.y + Math.sin(angle) * (obs.r + 6);
            
            const dot = ball.vx * Math.cos(angle) + ball.vy * Math.sin(angle);
            ball.vx -= 1.5 * dot * Math.cos(angle);
            ball.vy -= 1.5 * dot * Math.sin(angle);
          }
        } else if (obs.w && obs.h) {
          if (ball.x > obs.x - 5 && ball.x < obs.x + obs.w + 5 &&
              ball.y > obs.y - 5 && ball.y < obs.y + obs.h + 5) {
            
            const overlapLeft = ball.x - (obs.x - 5);
            const overlapRight = (obs.x + obs.w + 5) - ball.x;
            const overlapTop = ball.y - (obs.y - 5);
            const overlapBottom = (obs.y + obs.h + 5) - ball.y;
            
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
            
            if (minOverlap === overlapLeft) ball.x = obs.x - 6;
            else if (minOverlap === overlapRight) ball.x = obs.x + obs.w + 6;
            else if (minOverlap === overlapTop) ball.y = obs.y - 6;
            else ball.y = obs.y + obs.h + 6;
            
            ball.vx *= -0.5;
            ball.vy *= -0.5;
          }
        }
      });
    }
  }
  
  swing() {
    if (this.gameState.status !== 'aiming') return;
    
    const ball = this.gameState.ball;
    const club = this.gameState.clubs[this.gameState.clubIndex];
    
    let power;
    switch(club) {
      case 'Driver': power = this.gameState.power / 100 * 20; break;
      case 'Iron': power = this.gameState.power / 100 * 15; break;
      case 'Wedge': power = this.gameState.power / 100 * 10; break;
      case 'Putter': power = this.gameState.power / 100 * 5; break;
    }
    
    const angleRad = this.gameState.aimAngle * Math.PI / 180;
    ball.vx = Math.cos(angleRad) * power;
    ball.vy = Math.sin(angleRad) * power;
    ball.active = true;
    
    this.gameState.strokes[this.gameState.currentPlayer]++;
    this.gameState.status = 'rolling';
  }
  
  ballInHole() {
    const ball = this.gameState.ball;
    ball.inHole = true;
    ball.vx = 0;
    ball.vy = 0;
    
    this.gameState.scores[this.gameState.currentPlayer] += this.gameState.strokes[this.gameState.currentPlayer];
    
    setTimeout(() => this.nextHole(), 1500);
  }
  
  addStrokePenalty() {
    this.gameState.strokes[this.gameState.currentPlayer]++;
    this.gameState.scores[this.gameState.currentPlayer]++;
    
    const hole = this.holes[this.gameState.currentHole];
    this.gameState.ball.x = hole.tee.x;
    this.gameState.ball.y = hole.tee.y;
    this.gameState.ball.active = false;
    this.gameState.status = 'aiming';
  }
  
  nextHole() {
    this.gameState.currentPlayer = (this.gameState.currentPlayer + 1) % 2;
    
    if (this.gameState.currentPlayer === 0) {
      this.gameState.currentHole++;
      
      if (this.gameState.currentHole >= this.config.holeCount) {
        this.endGame();
        return;
      }
    }
    
    this.gameState.strokes = [0, 0];
    this.loadHole(this.gameState.currentHole);
  }
  
  endGame() {
    if (this.gameState.scores[0] < this.gameState.scores[1]) {
      this.gameState.winner = this.players[0];
    } else if (this.gameState.scores[1] < this.gameState.scores[0]) {
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
    if (this.gameState.status !== 'aiming') return;
    
    const currentPlayer = this.players[this.gameState.currentPlayer];
    if (playerName !== currentPlayer) return;
    
    if (input.left) {
      this.gameState.aimAngle = Math.max(-90, this.gameState.aimAngle - 3);
    }
    if (input.right) {
      this.gameState.aimAngle = Math.min(90, this.gameState.aimAngle + 3);
    }
    if (input.up) {
      this.gameState.power = Math.min(100, this.gameState.power + 2);
    }
    if (input.down) {
      this.gameState.power = Math.max(10, this.gameState.power - 2);
    }
    if (input.a) {
      this.gameState.clubIndex = (this.gameState.clubIndex + 1) % this.gameState.clubs.length;
    }
    if (input.action) {
      this.swing();
    }
  }
  
  render() {
    this.drawCourse();
    this.drawHole();
    this.drawObstacles();
    this.drawBall();
    this.drawAimLine();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawCourse() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#4a7c59');
    gradient.addColorStop(1, '#2d5a3d');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.canvas.width; x += 30) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += 30) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }
  
  drawHole() {
    const hole = this.holes[this.gameState.currentHole];
    
    this.ctx.fillStyle = '#1a472a';
    this.ctx.beginPath();
    this.ctx.arc(hole.x, hole.y, 15, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#111';
    this.ctx.beginPath();
    this.ctx.arc(hole.x, hole.y, this.config.holeRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#2d5a3d';
    this.ctx.beginPath();
    this.ctx.arc(hole.x - 3, hole.y - 5, 4, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#8b4513';
    this.ctx.fillRect(hole.tee.x - 10, hole.tee.y - 5, 20, 10);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('TEE', hole.tee.x, hole.tee.y + 12);
  }
  
  drawObstacles() {
    const hole = this.holes[this.gameState.currentHole];
    if (!hole.obstacles) return;
    
    hole.obstacles.forEach(obs => {
      if (obs.r) {
        this.ctx.fillStyle = '#654321';
        this.ctx.beginPath();
        this.ctx.arc(obs.x, obs.y, obs.r, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#4a3520';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(obs.x, obs.y, obs.r, 0, Math.PI * 2);
        this.ctx.stroke();
      } else if (obs.w) {
        this.ctx.fillStyle = '#5d4037';
        this.ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        
        this.ctx.strokeStyle = '#3e2723';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      }
    });
  }
  
  drawBall() {
    const ball = this.gameState.ball;
    if (ball.inHole) return;
    
    const gradient = this.ctx.createRadialGradient(
      ball.x - 2, ball.y - 2, 0,
      ball.x, ball.y, this.config.ballRadius
    );
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(1, '#ccc');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, this.config.ballRadius, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  drawAimLine() {
    if (this.gameState.status !== 'aiming') return;
    
    const ball = this.gameState.ball;
    const angleRad = this.gameState.aimAngle * Math.PI / 180;
    
    const length = this.gameState.power * 1.5;
    const endX = ball.x + Math.cos(angleRad) * length;
    const endY = ball.y + Math.sin(angleRad) * length;
    
    const gradient = this.ctx.createLinearGradient(ball.x, ball.y, endX, endY);
    gradient.addColorStop(0, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([8, 4]);
    
    this.ctx.beginPath();
    this.ctx.moveTo(ball.x, ball.y);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
    
    this.ctx.setLineDash([]);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${this.gameState.wind > 0 ? '→' : '←'} Wind: ${Math.abs(this.gameState.wind).toFixed(1)}`, this.canvas.width / 2, 40);
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 160, 100);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${this.players[0]}: ${this.gameState.scores[0]}`, 20, 30);
    this.ctx.fillText(`${this.players[1]}: ${this.gameState.scores[1]}`, 20, 50);
    this.ctx.fillText(`Hole: ${this.gameState.currentHole + 1}/9`, 20, 70);
    this.ctx.fillText(`Strokes: ${this.gameState.strokes[this.gameState.currentPlayer]}`, 20, 90);
    
    const hole = this.holes[this.gameState.currentHole];
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`GOLF - Par ${hole.par}`, this.canvas.width / 2, 25);
    
    const currentPlayer = this.players[this.gameState.currentPlayer];
    this.ctx.fillStyle = '#4ecdc4';
    this.ctx.font = '12px Arial';
    this.ctx.fillText(`Turn: ${currentPlayer}`, this.canvas.width - 70, 25);
    
    if (this.gameState.status === 'aiming') {
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '12px Arial';
      this.ctx.fillText(`Club: ${this.gameState.clubs[this.gameState.clubIndex]}`, this.canvas.width / 2, this.canvas.height - 25);
      this.ctx.fillText(`Power: ${this.gameState.power}%`, this.canvas.width / 2, this.canvas.height - 10);
    }
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 40);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Winner: ${this.gameState.winner}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
    this.ctx.fillText(`${this.players[0]}: ${this.gameState.scores[0]} | ${this.players[1]}: ${this.gameState.scores[1]}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.GolfMasterGame = GolfMasterGame;