// Air Hockey - Classic Arcade
class AirHockeyGame {
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
      score: { player: 0, ai: 0 },
      status: 'playing',
      player: null,
      ai: null,
      puck: null,
      walls: [],
      paddleRadius: 25,
      puckRadius: 15,
      tableWidth: 400,
      tableHeight: 600
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 450;
    this.canvas.height = this.canvas.parentElement.clientHeight || 650;
  }
  
  initGame() {
    this.gameState.player = {
      x: this.canvas.width / 2,
      y: this.canvas.height - 80,
      vx: 0,
      vy: 0,
      radius: this.gameState.paddleRadius
    };
    
    this.gameState.ai = {
      x: this.canvas.width / 2,
      y: 80,
      vx: 0,
      vy: 0,
      radius: this.gameState.paddleRadius,
      speed: 4
    };
    
    this.gameState.puck = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      vx: 0,
      vy: 0,
      radius: this.gameState.puckRadius
    };
  }
  
  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.resetPuck();
    this.gameLoop(this.lastTime);
  }
  
  stop() { this.isRunning = false; }
  
  resetPuck(scorer) {
    this.gameState.puck = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      vx: (Math.random() - 0.5) * 8,
      vy: scorer === 'player' ? -8 : 8,
      radius: this.gameState.puckRadius
    };
  }
  
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
    
    const input = this.getPlayerInput();
    const player = this.gameState.player;
    const ai = this.gameState.ai;
    const puck = this.gameState.puck;
    
    // Player movement
    const speed = 8;
    if (input.left) player.x -= speed;
    if (input.right) player.x += speed;
    if (input.up) player.y -= speed;
    if (input.down) player.y += speed;
    
    // Keep player in bounds (bottom half)
    player.x = Math.max(player.radius + 10, Math.min(this.canvas.width - player.radius - 10, player.x));
    player.y = Math.max(this.canvas.height / 2 + player.radius, Math.min(this.canvas.height - player.radius - 10, player.y));
    
    // AI movement
    const targetX = puck.x;
    const targetY = this.canvas.height / 2 - 50;
    
    if (ai.x < targetX - 20) ai.x += ai.speed;
    else if (ai.x > targetX + 20) ai.x -= ai.speed;
    
    if (puck.vy < 0) {
      if (ai.y < targetY) ai.y += ai.speed * 0.5;
      else if (ai.y > targetY - 100) ai.y -= ai.speed * 0.5;
    }
    
    ai.x = Math.max(ai.radius + 10, Math.min(this.canvas.width - ai.radius - 10, ai.x));
    ai.y = Math.max(ai.radius + 10, Math.min(this.canvas.height / 2 - ai.radius, ai.y));
    
    // Puck physics
    puck.x += puck.vx;
    puck.y += puck.vy;
    
    // Friction
    puck.vx *= 0.995;
    puck.vy *= 0.995;
    
    // Wall collisions
    if (puck.x - puck.radius < 10) {
      puck.x = 10 + puck.radius;
      puck.vx = -puck.vx * 0.9;
    }
    if (puck.x + puck.radius > this.canvas.width - 10) {
      puck.x = this.canvas.width - 10 - puck.radius;
      puck.vx = -puck.vx * 0.9;
    }
    if (puck.y - puck.radius < 10) {
      puck.y = 10 + puck.radius;
      puck.vy = -puck.vy * 0.9;
    }
    if (puck.y + puck.radius > this.canvas.height - 10) {
      puck.y = this.canvas.height - 10 - puck.radius;
      puck.vy = -puck.vy * 0.9;
    }
    
    // Paddle collisions
    this.collidePaddle(player, puck);
    this.collidePaddle(ai, puck);
    
    // Score detection
    if (puck.y < 30) {
      this.gameState.score.player++;
      this.resetPuck('ai');
    }
    if (puck.y > this.canvas.height - 30) {
      this.gameState.score.ai++;
      this.resetPuck('player');
    }
  }
  
  collidePaddle(paddle, puck) {
    const dx = puck.x - paddle.x;
    const dy = puck.y - paddle.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = paddle.radius + puck.radius;
    
    if (dist < minDist) {
      const angle = Math.atan2(dy, dx);
      const speed = Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy);
      const newSpeed = Math.max(speed, 10) + 3;
      
      puck.x = paddle.x + Math.cos(angle) * minDist;
      puck.y = paddle.y + Math.sin(angle) * minDist;
      
      puck.vx = Math.cos(angle) * newSpeed;
      puck.vy = Math.sin(angle) * newSpeed;
    }
  }
  
  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  render() {
    // Table background
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Table surface
    this.ctx.fillStyle = '#2980b9';
    this.ctx.fillRect(10, 10, this.canvas.width - 20, this.canvas.height - 20);
    
    // Center line
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([10, 10]);
    this.ctx.beginPath();
    this.ctx.moveTo(10, this.canvas.height / 2);
    this.ctx.lineTo(this.canvas.width - 10, this.canvas.height / 2);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    
    // Center circle
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 50, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Goals
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(this.canvas.width / 2 - 40, 0, 80, 15);
    this.ctx.fillRect(this.canvas.width / 2 - 40, this.canvas.height - 15, 80, 15);
    
    // Player paddle
    const player = this.gameState.player;
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.beginPath();
    this.ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#c0392b';
    this.ctx.beginPath();
    this.ctx.arc(player.x, player.y, player.radius * 0.6, 0, Math.PI * 2);
    this.ctx.fill();
    
    // AI paddle
    const ai = this.gameState.ai;
    this.ctx.fillStyle = '#3498db';
    this.ctx.beginPath();
    this.ctx.arc(ai.x, ai.y, ai.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#2980b9';
    this.ctx.beginPath();
    this.ctx.arc(ai.x, ai.y, ai.radius * 0.6, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Puck
    const puck = this.gameState.puck;
    this.ctx.fillStyle = '#ecf0f1';
    this.ctx.beginPath();
    this.ctx.arc(puck.x, puck.y, puck.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#bdc3c7';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Score
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(this.canvas.width / 2 - 60, this.canvas.height / 2 - 25, 120, 50);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 30px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${this.gameState.score.ai}`, this.canvas.width / 2 - 30, this.canvas.height / 2 + 10);
    this.ctx.fillText(`${this.gameState.score.player}`, this.canvas.width / 2 + 30, this.canvas.height / 2 + 10);
    
    // Player label
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = '14px Arial';
    this.ctx.fillText('YOU', player.x, player.y + 45);
    
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillText('AI', ai.x, ai.y - 35);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.AirHockeyGame = AirHockeyGame;