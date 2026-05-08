// Hockey Arena Game
class HockeyArenaGame {
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
      period: 1,
      periodTime: 60,
      status: 'playing',
      puck: null,
      players: [
        { x: 200, y: 300, vx: 0, vy: 0, team: 0, hasPuck: false },
        { x: 600, y: 300, vx: 0, vy: 0, team: 1, hasPuck: false }
      ],
      goalie: { x: 400, y: 80, vx: 0, vy: 0 },
      periods: 3,
      gameOver: false,
      winner: null
    };
    
    this.config = {
      rinkWidth: 800,
      rinkHeight: 500,
      playerSpeed: 4,
      puckSpeed: 12,
      goalWidth: 100,
      goalHeight: 30,
      friction: 0.99,
      maxScore: 5
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.puck = {
      x: 400,
      y: 300,
      vx: 0,
      vy: 0,
      active: true,
      heldBy: null
    };
    this.gameState.players[0].x = 200;
    this.gameState.players[0].y = 300;
    this.gameState.players[1].x = 600;
    this.gameState.players[1].y = 300;
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
    this.gameState.periodTime -= deltaTime;
    
    if (this.gameState.periodTime <= 0) {
      this.nextPeriod();
      return;
    }
    
    this.updatePlayers(deltaTime);
    this.updatePuck(deltaTime);
    this.checkGoal();
    this.aiUpdate(deltaTime);
  }
  
  updatePlayers(deltaTime) {
    this.players.forEach((player, i) => {
      const input = this.getPlayerInput(player);
      const p = this.gameState.players[i];
      
      const minX = i === 0 ? 50 : 400;
      const maxX = i === 0 ? 400 : 750;
      
      if (input.left) p.x -= this.config.playerSpeed;
      if (input.right) p.x += this.config.playerSpeed;
      if (input.up) p.y -= this.config.playerSpeed;
      if (input.down) p.y += this.config.playerSpeed;
      
      p.x = Math.max(minX, Math.min(maxX, p.x));
      p.y = Math.max(100, Math.min(450, p.y));
      
      if (input.action && p.hasPuck) {
        this.shootPuck(i);
      }
    });
  }
  
  updatePuck(deltaTime) {
    const puck = this.gameState.puck;
    
    if (puck.heldBy !== null) {
      const holder = this.gameState.players[puck.heldBy];
      puck.x = holder.x + 20;
      puck.y = holder.y;
      return;
    }
    
    puck.x += puck.vx;
    puck.y += puck.vy;
    
    puck.vx *= this.config.friction;
    puck.vy *= this.config.friction;
    
    if (puck.x < 20 || puck.x > this.canvas.width - 20) {
      puck.vx *= -0.8;
      puck.x = Math.max(20, Math.min(this.canvas.width - 20, puck.x));
    }
    if (puck.y < 80 || puck.y > this.canvas.height - 20) {
      puck.vy *= -0.8;
      puck.y = Math.max(80, Math.min(this.canvas.height - 20, puck.y));
    }
    
    this.checkPuckCollision();
  }
  
  checkPuckCollision() {
    const puck = this.gameState.puck;
    
    this.gameState.players.forEach((player, i) => {
      const dx = puck.x - player.x;
      const dy = puck.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 30 && puck.heldBy === null) {
        puck.heldBy = i;
        this.gameState.players[i].hasPuck = true;
      }
    });
  }
  
  shootPuck(playerIndex) {
    const puck = this.gameState.puck;
    const player = this.gameState.players[playerIndex];
    const targetIndex = 1 - playerIndex;
    const target = this.gameState.players[targetIndex];
    
    puck.heldBy = null;
    player.hasPuck = false;
    
    const goalX = 400;
    const goalY = 85;
    
    const dx = goalX - player.x;
    const dy = goalY - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    puck.vx = (dx / dist) * this.config.puckSpeed + (Math.random() - 0.5) * 2;
    puck.vy = (dy / dist) * this.config.puckSpeed + (Math.random() - 0.5) * 2;
  }
  
  checkGoal() {
    const puck = this.gameState.puck;
    const goalY = 85;
    
    if (puck.y < goalY && puck.x > 350 && puck.x < 450) {
      this.goalScored(1);
    } else if (puck.y > this.canvas.height - 100 && puck.x > 350 && puck.x < 450) {
      this.goalScored(0);
    }
  }
  
  goalScored(team) {
    this.gameState.score[team]++;
    
    this.gameState.puck.x = 400;
    this.gameState.puck.y = 300;
    this.gameState.puck.vx = 0;
    this.gameState.puck.vy = 0;
    this.gameState.puck.heldBy = null;
    
    this.gameState.players[0].hasPuck = false;
    this.gameState.players[1].hasPuck = false;
    
    this.gameState.players[0].x = 200;
    this.gameState.players[0].y = 300;
    this.gameState.players[1].x = 600;
    this.gameState.players[1].y = 300;
    
    if (this.gameState.score[team] >= this.config.maxScore) {
      this.gameState.gameOver = true;
      this.gameState.winner = this.players[team];
    }
  }
  
  nextPeriod() {
    this.gameState.period++;
    this.gameState.periodTime = 60;
    
    if (this.gameState.period > this.config.periods) {
      if (this.gameState.score[0] > this.gameState.score[1]) {
        this.gameState.winner = this.players[0];
      } else if (this.gameState.score[1] > this.gameState.score[0]) {
        this.gameState.winner = this.players[1];
      } else {
        this.gameState.winner = 'Overtime';
      }
      this.gameState.gameOver = true;
    }
  }
  
  aiUpdate(deltaTime) {
    const ai = this.gameState.players[1];
    const puck = this.gameState.puck;
    const player = this.gameState.players[0];
    
    if (!ai.hasPuck) {
      const dx = puck.x - ai.x;
      const dy = puck.y - ai.y;
      
      ai.x += Math.sign(dx) * this.config.playerSpeed * 0.7;
      ai.y += Math.sign(dy) * this.config.playerSpeed * 0.7;
    } else {
      const targetX = 400;
      const targetY = 85;
      
      ai.x += (targetX - ai.x) * 0.02;
      ai.y += (targetY - ai.y) * 0.02;
      
      if (Math.random() < 0.02) {
        this.shootPuck(1);
      }
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.drawRink();
    this.drawGoals();
    this.drawPlayers();
    this.drawPuck();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawRink() {
    const gradient = this.ctx.createRadialGradient(400, 300, 0, 400, 300, 400);
    gradient.addColorStop(0, '#e8e8e8');
    gradient.addColorStop(1, '#fff');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.strokeStyle = '#c00';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(50, 80, 700, 420);
    
    this.ctx.strokeStyle = '#00f';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(400, 300, 80, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.strokeStyle = '#c00';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(400, 80);
    this.ctx.lineTo(400, 500);
    this.ctx.stroke();
    
    this.ctx.fillStyle = 'rgba(0,0,255,0.2)';
    this.ctx.fillRect(50, 80, 200, 150);
    this.ctx.fillRect(550, 80, 200, 150);
  }
  
  drawGoals() {
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(350, 50, 100, 5);
    this.ctx.fillRect(350, 50, 5, 30);
    this.ctx.fillRect(445, 50, 5, 30);
    
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(350, this.canvas.height - 55, 100, 5);
    this.ctx.fillRect(350, this.canvas.height - 80, 5, 30);
    this.ctx.fillRect(445, this.canvas.height - 80, 5, 30);
  }
  
  drawPlayers() {
    this.gameState.players.forEach((player, i) => {
      const color = i === 0 ? '#e74c3c' : '#3498db';
      
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(player.x, player.y, 18, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.beginPath();
      this.ctx.arc(player.x, player.y, 10, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.moveTo(player.x, player.y + 15);
      this.ctx.lineTo(player.x - 15, player.y + 35);
      this.ctx.lineTo(player.x + 15, player.y + 35);
      this.ctx.closePath();
      this.ctx.fill();
      
      if (player.hasPuck) {
        this.ctx.fillStyle = '#ff0';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PUCK', player.x, player.y - 25);
      }
    });
  }
  
  drawPuck() {
    const puck = this.gameState.puck;
    
    const gradient = this.ctx.createRadialGradient(
      puck.x - 2, puck.y - 2, 0, puck.x, puck.y, 8
    );
    gradient.addColorStop(0, '#222');
    gradient.addColorStop(1, '#000');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.ellipse(puck.x, puck.y, 8, 6, 0, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 150, 70);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${this.players[0]}: ${this.gameState.score[0]}`, 20, 30);
    this.ctx.fillText(`${this.players[1]}: ${this.gameState.score[1]}`, 20, 55);
    this.ctx.fillText(`Period: ${this.gameState.period}/3`, 100, 30);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('HOCKEY', this.canvas.width / 2, 30);
    
    this.ctx.fillStyle = '#4ecdc4';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(`${Math.ceil(this.gameState.periodTime)}s`, this.canvas.width / 2, 55);
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
    this.ctx.fillText(`${this.gameState.winner} Wins!`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    this.ctx.fillText(`${this.gameState.score[0]} - ${this.gameState.score[1]}`, this.canvas.width / 2, this.canvas.height / 2 + 60);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.HockeyArenaGame = HockeyArenaGame;