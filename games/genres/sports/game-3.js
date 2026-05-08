// Pool - Billiards Game
class PoolGame {
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
      shots: 0,
      ballsPotted: 0,
      status: 'aiming',
      cue: null,
      whiteBall: null,
      balls: [],
      pockets: [],
      power: 0,
      aimAngle: 0,
      tableWidth: 700,
      tableHeight: 350,
      friction: 0.985,
      pocketRadius: 20
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 750;
    this.canvas.height = this.canvas.parentElement.clientHeight || 450;
  }
  
  initGame() {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    
    // Pockets
    const pocketPositions = [
      { x: 35, y: 35 },
      { x: cx, y: 25 },
      { x: this.canvas.width - 35, y: 35 },
      { x: 35, y: this.canvas.height - 35 },
      { x: cx, y: this.canvas.height - 25 },
      { x: this.canvas.width - 35, y: this.canvas.height - 35 }
    ];
    this.gameState.pockets = pocketPositions;
    
    // White ball
    this.gameState.whiteBall = {
      x: cx - 200,
      y: cy,
      vx: 0,
      vy: 0,
      radius: 12,
      color: '#ecf0f1'
    };
    
    // Colored balls
    const ballColors = [
      '#f1c40f', '#3498db', '#e74c3c', '#9b59b6', '#e67e22', '#27ae60', '#c0392b',
      '#1abc9c', '#f39c12', '#8e44ad', '#2ecc71', '#e91e63', '#00bcd4', '#ff5722', '#607d8b'
    ];
    
    this.gameState.balls = [];
    
    // Rack formation
    const startX = cx + 100;
    const startY = cy;
    const spacing = 26;
    
    let ballIndex = 0;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col <= row; col++) {
        const x = startX + row * spacing * 0.866;
        const y = startY + (col - row / 2) * spacing;
        
        this.gameState.balls.push({
          x, y,
          vx: 0,
          vy: 0,
          radius: 12,
          color: ballColors[ballIndex % ballColors.length],
          number: ballIndex + 1,
          pocketed: false
        });
        
        ballIndex++;
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
    
    const allBalls = [this.gameState.whiteBall, ...this.gameState.balls];
    
    // Update white ball
    this.updateBall(this.gameState.whiteBall, deltaTime);
    
    // Update colored balls
    this.gameState.balls.forEach(ball => {
      if (!ball.pocketed) {
        this.updateBall(ball, deltaTime);
      }
    });
    
    // Check pockets
    this.gameState.pockets.forEach(pocket => {
      allBalls.forEach(ball => {
        if (ball.pocketed !== undefined && !ball.pocketed) {
          const dx = ball.x - pocket.x;
          const dy = ball.y - pocket.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < this.gameState.pocketRadius) {
            if (ball === this.gameState.whiteBall) {
              // Reset white ball
              ball.x = this.canvas.width / 2 - 200;
              ball.y = this.canvas.height / 2;
              ball.vx = 0;
              ball.vy = 0;
            } else {
              ball.pocketed = true;
              this.gameState.ballsPotted++;
              this.gameState.score += 10;
            }
          }
        }
      });
    });
    
    // Check if all balls stopped
    const moving = allBalls.some(b => Math.abs(b.vx) > 1 || Math.abs(b.vy) > 1);
    if (!moving && this.gameState.status === 'moving') {
      this.gameState.status = 'aiming';
    } else if (moving) {
      this.gameState.status = 'moving';
    }
  }
  
  updateBall(ball, deltaTime) {
    ball.x += ball.vx * deltaTime;
    ball.y += ball.vy * deltaTime;
    
    ball.vx *= this.gameState.friction;
    ball.vy *= this.gameState.friction;
    
    if (Math.abs(ball.vx) < 0.5 && Math.abs(ball.vy) < 0.5) {
      ball.vx = 0;
      ball.vy = 0;
    }
    
    // Table walls
    const tableLeft = 30;
    const tableRight = this.canvas.width - 30;
    const tableTop = 30;
    const tableBottom = this.canvas.height - 30;
    
    if (ball.x - ball.radius < tableLeft) {
      ball.x = tableLeft + ball.radius;
      ball.vx = -ball.vx * 0.8;
    }
    if (ball.x + ball.radius > tableRight) {
      ball.x = tableRight - ball.radius;
      ball.vx = -ball.vx * 0.8;
    }
    if (ball.y - ball.radius < tableTop) {
      ball.y = tableTop + ball.radius;
      ball.vy = -ball.vy * 0.8;
    }
    if (ball.y + ball.radius > tableBottom) {
      ball.y = tableBottom - ball.radius;
      ball.vy = -ball.vy * 0.8;
    }
    
    // Ball collisions
    const allBalls = [this.gameState.whiteBall, ...this.gameState.balls].filter(b => !b.pocketed);
    
    for (let i = 0; i < allBalls.length; i++) {
      for (let j = i + 1; j < allBalls.length; j++) {
        const b1 = allBalls[i];
        const b2 = allBalls[j];
        
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < b1.radius + b2.radius) {
          // Resolve collision
          const nx = dx / dist;
          const ny = dy / dist;
          
          const overlap = (b1.radius + b2.radius - dist) / 2;
          b1.x -= nx * overlap;
          b1.y -= ny * overlap;
          b2.x += nx * overlap;
          b2.y += ny * overlap;
          
          const dvx = b1.vx - b2.vx;
          const dvy = b1.vy - b2.vy;
          const dvn = dvx * nx + dvy * ny;
          
          b1.vx -= dvn * nx;
          b1.vy -= dvn * ny;
          b2.vx += dvn * nx;
          b2.vy += dvn * ny;
        }
      }
    }
  }
  
  shoot(power, angle) {
    const whiteBall = this.gameState.whiteBall;
    whiteBall.vx = Math.cos(angle) * power * 15;
    whiteBall.vy = Math.sin(angle) * power * 15;
    this.gameState.status = 'moving';
    this.gameState.shots++;
  }
  
  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  render() {
    // Table felt
    this.ctx.fillStyle = '#27ae60';
    this.ctx.fillRect(30, 30, this.canvas.width - 60, this.canvas.height - 60);
    
    // Table rails
    this.ctx.strokeStyle = '#5d4037';
    this.ctx.lineWidth = 15;
    this.ctx.strokeRect(30, 30, this.canvas.width - 60, this.canvas.height - 60);
    
    // Pockets
    this.ctx.fillStyle = '#1a1a1a';
    this.gameState.pockets.forEach(pocket => {
      this.ctx.beginPath();
      this.ctx.arc(pocket.x, pocket.y, this.gameState.pocketRadius, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    // Balls
    const whiteBall = this.gameState.whiteBall;
    this.ctx.fillStyle = whiteBall.color;
    this.ctx.beginPath();
    this.ctx.arc(whiteBall.x, whiteBall.y, whiteBall.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#bdc3c7';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    this.gameState.balls.forEach(ball => {
      if (ball.pocketed) return;
      
      // Ball body
      this.ctx.fillStyle = ball.color;
      this.ctx.beginPath();
      this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Ball number
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(ball.number.toString(), ball.x, ball.y);
      
      // Shine
      this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
      this.ctx.beginPath();
      this.ctx.arc(ball.x - 4, ball.y - 4, 4, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    // Cue stick (when aiming)
    if (this.gameState.status === 'aiming') {
      const wb = this.gameState.whiteBall;
      const angle = this.gameState.aimAngle;
      const power = this.gameState.power;
      
      this.ctx.save();
      this.ctx.translate(wb.x, wb.y);
      this.ctx.rotate(angle);
      
      // Aim line
      this.ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([5, 5]);
      this.ctx.beginPath();
      this.ctx.moveTo(15, 0);
      this.ctx.lineTo(200, 0);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
      
      // Cue stick
      this.ctx.fillStyle = '#8b4513';
      this.ctx.fillRect(-150 - power * 100, -3, 140, 6);
      this.ctx.fillStyle = '#f5f5dc';
      this.ctx.fillRect(-10, -3, 10, 6);
      
      this.ctx.restore();
    }
    
    // UI
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, 10, 120, 70);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Shots: ${this.gameState.shots}`, 20, 30);
    this.ctx.fillText(`Potted: ${this.gameState.ballsPotted}`, 20, 50);
    this.ctx.fillText(`Status: ${this.gameState.status}`, 20, 70);
    
    // Power bar
    if (this.gameState.status === 'aiming') {
      this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
      this.ctx.fillRect(this.canvas.width - 120, 20, 100, 30);
      
      const gradient = this.ctx.createLinearGradient(this.canvas.width - 115, 0, this.canvas.width - 25, 0);
      gradient.addColorStop(0, '#2ecc71');
      gradient.addColorStop(0.5, '#f39c12');
      gradient.addColorStop(1, '#e74c3c');
      
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(this.canvas.width - 115, 25, this.gameState.power * 90, 20);
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.PoolGame = PoolGame;