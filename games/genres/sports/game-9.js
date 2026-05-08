// BMX Stunt Game
class BMXStuntGame {
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
      player: null,
      track: [],
      ramps: [],
      obstacles: [],
      rotation: 0,
      inAir: false,
      status: 'riding',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = { 
      x: 100, y: 400, 
      vx: 150, vy: 0, 
      rotation: 0,
      bikeRotation: 0
    };
    
    for (let i = 0; i < 5; i++) {
      this.gameState.ramps.push({
        x: 200 + i * 150,
        width: 40,
        height: 30 + Math.random() * 30
      });
    }
    
    this.gameState.track = [];
    for (let x = 0; x < 800; x += 10) {
      this.gameState.track.push({
        x: x,
        y: 450 + Math.sin(x * 0.02) * 20
      });
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
    if (this.gameState.gameOver) return;
    this.gameState.time += deltaTime;
    
    const input = this.getPlayerInput(this.players[0]);
    const p = this.gameState.player;
    
    p.vy += 20 * deltaTime;
    p.x += p.vx * deltaTime;
    p.y += p.vy * deltaTime;
    
    if (p.x > 800) {
      p.x = 0;
      this.gameState.score += 100;
    }
    
    let onGround = false;
    let groundY = 450;
    
    this.gameState.ramps.forEach(r => {
      if (p.x > r.x && p.x < r.x + r.width) {
        groundY = Math.min(groundY, 450 - r.height);
      }
    });
    
    if (p.y >= groundY && p.vy > 0) {
      p.y = groundY;
      p.vy = 0;
      onGround = true;
      
      if (this.gameState.inAir) {
        this.gameState.score += 50;
        this.gameState.inAir = false;
      }
    }
    
    if (!onGround) {
      this.gameState.inAir = true;
      if (input.up) p.bikeRotation -= 8;
      if (input.down) p.bikeRotation += 8;
      p.bikeRotation = Math.max(-180, Math.min(180, p.bikeRotation));
    } else {
      p.bikeRotation = 0;
    }
    
    p.rotation = p.bikeRotation * Math.PI / 180;
    
    if (Math.abs(p.rotation) > Math.PI/3) {
      this.gameState.score += 200;
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    const grad = this.ctx.createLinearGradient(0, 0, 0, 600);
    grad.addColorStop(0, '#87ceeb');
    grad.addColorStop(0.4, '#b8d4e8');
    grad.addColorStop(1, '#8b7355');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, 800, 600);
    
    this.ctx.fillStyle = '#7cba6e';
    this.ctx.fillRect(0, 300, 800, 150);
    
    this.ctx.fillStyle = '#8b7355';
    this.ctx.beginPath();
    this.ctx.moveTo(0, 450);
    this.gameState.track.forEach(t => this.ctx.lineTo(t.x, t.y));
    this.ctx.lineTo(800, 450);
    this.ctx.lineTo(800, 600);
    this.ctx.lineTo(0, 600);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#654321';
    this.gameState.ramps.forEach(r => {
      this.ctx.beginPath();
      this.ctx.moveTo(r.x, 450);
      this.ctx.lineTo(r.x + r.width/2, 450 - r.height);
      this.ctx.lineTo(r.x + r.width, 450);
      this.ctx.fill();
    });
    
    const bmx = this.gameState.player;
    this.ctx.save();
    this.ctx.translate(bmx.x, bmx.y);
    this.ctx.rotate(bmx.rotation);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(-20, -15, 40, 15);
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.beginPath();
    this.ctx.arc(-15, 0, 8, 0, Math.PI*2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(15, 0, 8, 0, Math.PI*2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#95a5a6';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(-15, 0);
    this.ctx.lineTo(-25, -10);
    this.ctx.moveTo(15, 0);
    this.ctx.lineTo(25, -10);
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.fillRect(-12, -35, 8, 20);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.beginPath();
    this.ctx.arc(0, -35, 10, 0, Math.PI);
    this.ctx.fill();
    
    this.ctx.restore();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Score: ' + this.gameState.score + ' | Time: ' + Math.floor(this.gameState.time) + 's', 20, 30);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillText('BMX STUNT', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.BMXStuntGame = BMXStuntGame;