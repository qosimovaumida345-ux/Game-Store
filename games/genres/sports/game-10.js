// Billiards Pool Game
class BilliardsGame {
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
      playerTurn: 0,
      cueBall: null,
      balls: [],
      pockets: [],
      cue: null,
      power: 0,
      aiming: true,
      shooting: false,
      tableWidth: 700,
      tableHeight: 350,
      friction: 0.985,
      status: 'aiming',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    const centerX = 400;
    const centerY = 300;
    
    this.gameState.cueBall = { x: centerX - 150, y: centerY, vx: 0, vy: 0, radius: 12, color: '#fff', type: 'white' };
    
    const ballColors = [
      '#f1c40f', '#3498db', '#e74c3c', '#9b59b6', '#e67e22', '#2ecc71', '#c0392b', '#1abc9c',
      '#f39c12', '#2980b9', '#e74c3c', '#8e44ad', '#d35400', '#27ae60', '#c0392b', '#16a085'
    ];
    
    this.gameState.balls = [];
    let row = 0;
    let col = 0;
    for (let i = 0; i < 15; i++) {
      const x = centerX + row * 25;
      const y = centerY + (col - row/2) * 24;
      this.gameState.balls.push({
        x: x, y: y, vx: 0, vy: 0, radius: 12, 
        color: ballColors[i], type: (i + 1).toString(), pocketed: false
      });
      col++;
      if (col > row) { row++; col = 0; }
    }
    
    this.gameState.pockets = [
      { x: 50, y: 25, radius: 20 },
      { x: 400, y: 10, radius: 20 },
      { x: 750, y: 25, radius: 20 },
      { x: 50, y: 575, radius: 20 },
      { x: 400, y: 590, radius: 20 },
      { x: 750, y: 575, radius: 20 }
    ];
    
    this.gameState.cue = { angle: 0, power: 0 };
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
    
    const allBalls = [this.gameState.cueBall, ...this.gameState.balls];
    let moving = false;
    
    allBalls.forEach(ball => {
      if (ball.pocketed) return;
      
      ball.x += ball.vx;
      ball.y += ball.vy;
      
      ball.vx *= this.gameState.friction;
      ball.vy *= this.gameState.friction;
      
      if (Math.abs(ball.vx) < 0.1 && Math.abs(ball.vy) < 0.1) {
        ball.vx = 0;
        ball.vy = 0;
      } else {
        moving = true;
      }
      
      if (ball.x < 70 || ball.x > 730) {
        ball.vx *= -0.8;
        ball.x = Math.max(70, Math.min(730, ball.x));
      }
      if (ball.y < 70 || ball.y > 530) {
        ball.vy *= -0.8;
        ball.y = Math.max(70, Math.min(530, ball.y));
      }
    });
    
    for (let i = 0; i < allBalls.length; i++) {
      for (let j = i + 1; j < allBalls.length; j++) {
        if (allBalls[i].pocketed || allBalls[j].pocketed) continue;
        this.handleBallCollision(allBalls[i], allBalls[j]);
      }
    }
    
    if (!moving && !this.gameState.shooting) {
      this.gameState.aiming = true;
      this.checkPockets();
    } else if (moving) {
      this.gameState.aiming = false;
    }
  }
  
  handleBallCollision(b1, b2) {
    const dx = b2.x - b1.x;
    const dy = b2.y - b1.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist < b1.radius + b2.radius) {
      const nx = dx / dist;
      const ny = dy / dist;
      
      const dvx = b1.vx - b2.vx;
      const dvy = b1.vy - b2.vy;
      
      const dvn = dvx * nx + dvy * ny;
      
      b1.vx -= dvn * nx;
      b1.vy -= dvn * ny;
      b2.vx += dvn * nx;
      b2.vy += dvn * ny;
      
      const overlap = (b1.radius + b2.radius - dist) / 2;
      b1.x -= overlap * nx;
      b1.y -= overlap * ny;
      b2.x += overlap * nx;
      b2.y += overlap * ny;
    }
  }
  
  checkPockets() {
    const allBalls = [this.gameState.cueBall, ...this.gameState.balls];
    
    allBalls.forEach(ball => {
      this.gameState.pockets.forEach(pocket => {
        const dx = ball.x - pocket.x;
        const dy = ball.y - pocket.y;
        if (Math.sqrt(dx*dx + dy*dy) < pocket.radius) {
          ball.pocketed = true;
          ball.vx = 0;
          ball.vy = 0;
          
          if (ball.type === 'white') {
            setTimeout(() => {
              ball.pocketed = false;
              ball.x = 250;
              ball.y = 300;
            }, 500);
          } else {
            this.gameState.score[this.gameState.playerTurn] += parseInt(ball.type) || 0;
          }
        }
      });
    });
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  shoot(power, angle) {
    if (!this.gameState.aiming || this.gameState.cueBall.pocketed) return;
    
    const speed = power * 30;
    this.gameState.cueBall.vx = Math.cos(angle) * speed;
    this.gameState.cueBall.vy = Math.sin(angle) * speed;
    this.gameState.shooting = true;
    this.gameState.aiming = false;
    
    setTimeout(() => {
      this.gameState.shooting = false;
      this.gameState.playerTurn = (this.gameState.playerTurn + 1) % 2;
    }, 2000);
  }
  
  render() {
    this.ctx.fillStyle = '#1a472a';
    this.ctx.fillRect(0, 0, 800, 600);
    
    this.ctx.fillStyle = '#2d5a27';
    this.ctx.fillRect(50, 50, 700, 500);
    
    this.ctx.fillStyle = '#1a472a';
    this.gameState.pockets.forEach(p => {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    this.ctx.strokeStyle = '#8b4513';
    this.ctx.lineWidth = 15;
    this.ctx.strokeRect(50, 50, 700, 500);
    
    this.ctx.strokeStyle = '#654321';
    this.ctx.lineWidth = 8;
    this.ctx.strokeRect(65, 65, 670, 470);
    
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(250, 300);
    this.ctx.lineTo(550, 300);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.arc(250, 300, 3, 0, Math.PI*2);
    this.ctx.fill();
    
    this.gameState.balls.forEach(ball => {
      if (ball.pocketed) return;
      
      const gradient = this.ctx.createRadialGradient(ball.x - 3, ball.y - 3, 0, ball.x, ball.y, ball.radius);
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(0.3, ball.color);
      gradient.addColorStop(1, this.darkenColor(ball.color, 30));
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 8px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(ball.type, ball.x, ball.y + 3);
    });
    
    const cueBall = this.gameState.cueBall;
    if (!cueBall.pocketed) {
      const gradient = this.ctx.createRadialGradient(cueBall.x - 3, cueBall.y - 3, 0, cueBall.x, cueBall.y, cueBall.radius);
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(0.3, '#f5f5f5');
      gradient.addColorStop(1, '#ddd');
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(cueBall.x, cueBall.y, cueBall.radius, 0, Math.PI*2);
      this.ctx.fill();
    }
    
    if (this.gameState.aiming && !this.gameState.cueBall.pocketed) {
      const input = this.getPlayerInput(this.players[0]);
      const angle = input.angle || 0;
      const power = input.power || 50;
      
      const cueLen = 150;
      const cueX = cueBall.x - Math.cos(angle) * (cueLen + power/2);
      const cueY = cueBall.y - Math.sin(angle) * (cueLen + power/2);
      
      this.ctx.strokeStyle = '#8b4513';
      this.ctx.lineWidth = 6;
      this.ctx.beginPath();
      this.ctx.moveTo(cueX, cueY);
      this.ctx.lineTo(cueBall.x - Math.cos(angle) * 30, cueBall.y - Math.sin(angle) * 30);
      this.ctx.stroke();
      
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(cueBall.x, cueBall.y);
      this.ctx.lineTo(cueBall.x + Math.cos(angle) * 100, cueBall.y + Math.sin(angle) * 100);
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#3498db';
      this.ctx.fillRect(20, 550, 200, 20);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(20, 550, 200 * (power/100), 20);
      this.ctx.strokeStyle = '#fff';
      this.ctx.strokeRect(20, 550, 200, 20);
    }
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Player 1: ' + this.gameState.score[0], 20, 30);
    this.ctx.fillText('Player 2: ' + this.gameState.score[1], 20, 55);
    this.ctx.fillText('Turn: Player ' + (this.gameState.playerTurn + 1), 20, 80);
    
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BILLIARDS', 400, 25);
  }
  
  darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    if (input.shoot && this.gameState.aiming) {
      this.shoot(input.power || 50, input.angle || 0);
    }
  }
}

window.BilliardsGame = BilliardsGame;