// Ball Physics - Physics Puzzle Game
class BallPhysicsGame {
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
      status: 'playing',
      balls: [],
      pegs: [],
      buckets: [],
      walls: []
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 500;
    this.canvas.height = this.canvas.parentElement.clientHeight || 700;
  }
  
  initGame() {
    // Create pegs (Plinko style)
    const rows = 10;
    const cols = 9;
    const spacingX = this.canvas.width / (cols + 1);
    const spacingY = 50;
    
    this.gameState.pegs = [];
    for (let r = 1; r < rows; r++) {
      for (let c = 1; c <= cols; c++) {
        const offset = r % 2 === 0 ? spacingX / 2 : 0;
        this.gameState.pegs.push({
          x: c * spacingX + offset - spacingX / 2,
          y: r * spacingY + 50,
          radius: 8,
          hit: false
        });
      }
    }
    
    // Create buckets
    const bucketWidth = this.canvas.width / 6;
    const bucketPoints = [10, 50, 100, 200, 500, 1000];
    this.gameState.buckets = [];
    for (let i = 0; i < 6; i++) {
      this.gameState.buckets.push({
        x: i * bucketWidth,
        y: this.canvas.height - 60,
        width: bucketWidth,
        height: 60,
        points: bucketPoints[i]
      });
    }
    
    // Walls
    this.gameState.walls = [
      { x1: 0, y1: 0, x2: 0, y2: this.canvas.height },
      { x1: this.canvas.width, y1: 0, x2: this.canvas.width, y2: this.canvas.height }
    ];
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
    
    // Add ball periodically
    if (this.gameState.time > 0.5 && this.gameState.balls.length < 50) {
      this.gameState.balls.push({
        x: this.canvas.width / 2 + (Math.random() - 0.5) * 20,
        y: 30,
        vx: (Math.random() - 0.5) * 2,
        vy: 0,
        radius: 10,
        color: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f'][Math.floor(Math.random() * 4)]
      });
      this.gameState.time = 0;
    }
    
    // Update balls
    this.gameState.balls.forEach((ball, i) => {
      ball.vy += 0.5; // Gravity
      ball.x += ball.vx;
      ball.y += ball.vy;
      
      // Wall collisions
      if (ball.x < ball.radius) {
        ball.x = ball.radius;
        ball.vx = -ball.vx * 0.8;
      }
      if (ball.x > this.canvas.width - ball.radius) {
        ball.x = this.canvas.width - ball.radius;
        ball.vx = -ball.vx * 0.8;
      }
      
      // Peg collisions
      this.gameState.pegs.forEach(peg => {
        if (peg.hit) return;
        
        const dx = ball.x - peg.x;
        const dy = ball.y - peg.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < ball.radius + peg.radius) {
          const angle = Math.atan2(dy, dx);
          const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          
          ball.vx = Math.cos(angle) * speed * 0.9;
          ball.vy = Math.sin(angle) * speed * 0.9;
          
          peg.hit = true;
          setTimeout(() => peg.hit = false, 500);
        }
      });
      
      // Bucket detection
      this.gameState.buckets.forEach((bucket, bi) => {
        if (ball.y > bucket.y) {
          this.gameState.score += bucket.points;
          this.gameState.balls.splice(i, 1);
        }
      });
      
      // Remove balls that fall
      if (ball.y > this.canvas.height + 50) {
        this.gameState.balls.splice(i, 1);
      }
    });
  }
  
  render() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw pegs
    this.gameState.pegs.forEach(peg => {
      this.ctx.fillStyle = peg.hit ? '#fff' : '#888';
      this.ctx.beginPath();
      this.ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#555';
      this.ctx.beginPath();
      this.ctx.arc(peg.x, peg.y, peg.radius - 3, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    // Draw buckets
    const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];
    this.gameState.buckets.forEach((bucket, i) => {
      this.ctx.fillStyle = colors[i];
      this.ctx.fillRect(bucket.x, bucket.y, bucket.width - 2, bucket.height);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(bucket.points, bucket.x + bucket.width / 2, bucket.y + 35);
    });
    
    // Draw balls
    this.gameState.balls.forEach(ball => {
      const gradient = this.ctx.createRadialGradient(ball.x - 3, ball.y - 3, 0, ball.x, ball.y, ball.radius);
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(0.5, ball.color);
      gradient.addColorStop(1, ball.color);
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    // Spawn point
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(this.canvas.width / 2 - 25, 10, 50, 20);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('DROP', this.canvas.width / 2, 24);
    
    // UI
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 150, 40);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 38);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.BallPhysicsGame = BallPhysicsGame;