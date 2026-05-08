// Test Game - Minimal working example
class TestGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.players = players;
    this.gameId = gameId;
    this.isRunning = false;
    this.color = '#4ecdc4';
    this.x = 100;
    this.y = 100;
    this.dx = 3;
    this.dy = 3;
    
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    console.log('TestGame created with canvas:', canvas);
  }
  
  resizeCanvas() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  }
  
  start() {
    console.log('TestGame starting...');
    this.isRunning = true;
    this.gameLoop();
  }
  
  stop() {
    this.isRunning = false;
  }
  
  gameLoop() {
    if (!this.isRunning) return;
    
    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw moving circle
    this.x += this.dx;
    this.y += this.dy;
    
    // Bounce off walls
    if (this.x + 50 > this.canvas.width || this.x - 50 < 0) this.dx *= -1;
    if (this.y + 50 > this.canvas.height || this.y - 50 < 0) this.dy *= -1;
    
    // Draw ball
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, 50, 0, Math.PI * 2);
    this.ctx.fillStyle = this.color;
    this.ctx.fill();
    this.ctx.closePath();
    
    // Draw text
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText('TEST O\'YIN ISHLYAPTI!', 50, 50);
    this.ctx.fillText('Players: ' + (this.players?.length || 0), 50, 100);
    
    requestAnimationFrame(() => this.gameLoop());
  }
  
  updatePlayerInput(playerName, input) {
    console.log('Input from', playerName, input);
  }
}

window.TestGame = TestGame;