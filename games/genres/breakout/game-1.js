// Breakout Brick Breaker Game
class BreakoutBrickGame {
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
      lives: 3,
      level: 1,
      maxLevels: 5,
      status: 'playing',
      paddle: null,
      ball: null,
      bricks: [],
      powerups: [],
      particles: [],
      gameOver: false,
      levelComplete: false
    };
    
    this.config = {
      paddleWidth: 100,
      paddleHeight: 15,
      ballRadius: 8,
      brickRows: 6,
      brickCols: 10,
      brickPadding: 5,
      ballSpeed: 7
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.paddle = {
      x: this.canvas.width / 2 - this.config.paddleWidth / 2,
      y: this.canvas.height - 40,
      width: this.config.paddleWidth,
      height: this.config.paddleHeight,
      speed: 8
    };
    
    this.gameState.ball = {
      x: this.canvas.width / 2,
      y: this.canvas.height - 60,
      vx: this.config.ballSpeed * (Math.random() > 0.5 ? 1 : -1),
      vy: -this.config.ballSpeed,
      radius: this.config.ballRadius,
      attached: true
    };
    
    this.createBricks();
    this.gameState.powerups = [];
    this.gameState.particles = [];
  }
  
  createBricks() {
    this.gameState.bricks = [];
    
    const colors = ['#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#e67e22'];
    const brickWidth = (this.canvas.width - 40) / this.config.brickCols - this.config.brickPadding;
    const brickHeight = 25;
    const startX = 25;
    const startY = 60;
    
    for (let row = 0; row < this.config.brickRows; row++) {
      for (let col = 0; col < this.config.brickCols; col++) {
        const health = row < 2 ? 2 : 1;
        
        this.gameState.bricks.push({
          x: startX + col * (brickWidth + this.config.brickPadding),
          y: startY + row * (brickHeight + this.config.brickPadding),
          width: brickWidth,
          height: brickHeight,
          color: colors[row % colors.length],
          health: health,
          maxHealth: health
        });
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
    if (this.gameState.gameOver || this.gameState.levelComplete) return;
    
    this.gameState.time += deltaTime;
    
    this.updatePaddle();
    this.updateBall();
    this.updatePowerups();
    this.updateParticles();
    this.checkCollisions();
    this.checkLevelComplete();
  }
  
  updatePaddle() {
    const input = this.getPlayerInput(this.players[0]);
    const paddle = this.gameState.paddle;
    
    if (input.left) paddle.x -= paddle.speed;
    if (input.right) paddle.x += paddle.speed;
    
    paddle.x = Math.max(10, Math.min(this.canvas.width - 10 - paddle.width, paddle.x));
  }
  
  updateBall() {
    const ball = this.gameState.ball;
    const paddle = this.gameState.paddle;
    
    if (ball.attached) {
      ball.x = paddle.x + paddle.width / 2;
      ball.y = paddle.y - ball.radius - 2;
      return;
    }
    
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    if (ball.x - ball.radius < 0 || ball.x + ball.radius > this.canvas.width) {
      ball.vx *= -1;
      ball.x = Math.max(ball.radius, Math.min(this.canvas.width - ball.radius, ball.x));
    }
    
    if (ball.y - ball.radius < 0) {
      ball.vy *= -1;
      ball.y = ball.radius;
    }
    
    if (ball.y > this.canvas.height) {
      this.gameState.lives--;
      
      if (this.gameState.lives <= 0) {
        this.gameState.gameOver = true;
      } else {
        ball.attached = true;
        ball.vx = this.config.ballSpeed * (Math.random() > 0.5 ? 1 : -1);
        ball.vy = -this.config.ballSpeed;
      }
    }
    
    const paddleCollision = this.checkPaddleCollision(ball, paddle);
    if (paddleCollision) {
      const hitPos = (ball.x - paddle.x) / paddle.width;
      const angle = (hitPos - 0.5) * Math.PI * 0.7;
      
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) * 1.02;
      ball.vx = Math.sin(angle) * speed;
      ball.vy = -Math.cos(angle) * speed;
      
      ball.y = paddle.y - ball.radius - 1;
      
      this.createParticles(ball.x, ball.y + ball.radius, '#fff', 5);
    }
  }
  
  checkPaddleCollision(ball, paddle) {
    return ball.x + ball.radius > paddle.x && 
           ball.x - ball.radius < paddle.x + paddle.width &&
           ball.y + ball.radius > paddle.y &&
           ball.y - ball.radius < paddle.y + paddle.height &&
           ball.vy > 0;
  }
  
  updatePowerups() {
    this.gameState.powerups.forEach(powerup => {
      powerup.y += 2;
    });
    
    this.gameState.powerups = this.gameState.powerups.filter(powerup => {
      if (powerup.y > this.canvas.height) return false;
      
      const paddle = this.gameState.paddle;
      if (powerup.x < paddle.x + paddle.width &&
          powerup.x + powerup.width > paddle.x &&
          powerup.y < paddle.y + paddle.height &&
          powerup.y + powerup.height > paddle.y) {
        this.applyPowerup(powerup.type);
        return false;
      }
      
      return true;
    });
  }
  
  applyPowerup(type) {
    switch (type) {
      case 'expand':
        this.gameState.paddle.width = Math.min(200, this.gameState.paddle.width + 30);
        break;
      case 'extra':
        this.gameState.lives++;
        break;
      case 'multiball':
        this.createExtraBalls();
        break;
      case 'slow':
        const ball = this.gameState.ball;
        ball.vx *= 0.7;
        ball.vy *= 0.7;
        break;
    }
  }
  
  createExtraBalls() {
    for (let i = 0; i < 2; i++) {
      const ball = this.gameState.ball;
      this.gameState.balls.push({
        x: ball.x,
        y: ball.y,
        vx: (Math.random() - 0.5) * 6,
        vy: -5,
        radius: ball.radius,
        attached: false
      });
    }
  }
  
  updateParticles() {
    this.gameState.particles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 0.02;
      particle.vy += 0.1;
    });
    
    this.gameState.particles = this.gameState.particles.filter(p => p.life > 0);
  }
  
  createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      this.gameState.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        radius: Math.random() * 4 + 2,
        color: color,
        life: 1
      });
    }
  }
  
  checkCollisions() {
    const ball = this.gameState.ball;
    
    this.gameState.bricks.forEach((brick, i) => {
      if (brick.health <= 0) return;
      
      if (ball.x + ball.radius > brick.x &&
          ball.x - ball.radius < brick.x + brick.width &&
          ball.y + ball.radius > brick.y &&
          ball.y - ball.radius < brick.y + brick.height) {
        
        const overlapX = Math.min(ball.x + ball.radius - brick.x, brick.x + brick.width - (ball.x - ball.radius));
        const overlapY = Math.min(ball.y + ball.radius - brick.y, brick.y + brick.height - (ball.y - ball.radius));
        
        if (overlapX < overlapY) {
          ball.vx *= -1;
        } else {
          ball.vy *= -1;
        }
        
        brick.health--;
        
        if (brick.health <= 0) {
          this.gameState.score += brick.maxHealth * 10;
          this.createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 10);
          
          if (Math.random() < 0.15) {
            this.spawnPowerup(brick.x + brick.width / 2, brick.y + brick.height / 2);
          }
        } else {
          this.gameState.score += 5;
        }
      }
    });
  }
  
  spawnPowerup(x, y) {
    const types = ['expand', 'extra', 'multiball', 'slow'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const colors = {
      expand: '#3498db',
      extra: '#2ecc71',
      multiball: '#f39c12',
      slow: '#9b59b6'
    };
    
    this.gameState.powerups.push({
      x: x - 15,
      y: y,
      width: 30,
      height: 20,
      type: type,
      color: colors[type]
    });
  }
  
  checkLevelComplete() {
    if (this.gameState.bricks.every(b => b.health <= 0)) {
      this.gameState.levelComplete = true;
      
      if (this.gameState.level >= this.gameState.maxLevels) {
        this.gameState.gameOver = true;
      } else {
        setTimeout(() => {
          this.gameState.level++;
          this.gameState.lives = 3;
          this.initGame();
          this.gameState.levelComplete = false;
        }, 2000);
      }
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    const ball = this.gameState.ball;
    
    if (ball.attached && input.action) {
      ball.attached = false;
    }
  }
  
  render() {
    this.drawBackground();
    this.drawBricks();
    this.drawPaddle();
    this.drawBall();
    this.drawPowerups();
    this.drawParticles();
    this.drawUI();
    
    if (this.gameState.levelComplete) {
      this.drawLevelComplete();
    }
    
    if (this.gameState.gameOver) {
      this.drawGameOver();
    }
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawBricks() {
    this.gameState.bricks.forEach(brick => {
      if (brick.health <= 0) return;
      
      const alpha = brick.health / brick.maxHealth;
      
      this.ctx.fillStyle = brick.color;
      this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      
      this.ctx.fillStyle = `rgba(255,255,255,${alpha * 0.3})`;
      this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height / 2);
      
      this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
    });
  }
  
  drawPaddle() {
    const paddle = this.gameState.paddle;
    
    const gradient = this.ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    gradient.addColorStop(0, '#3498db');
    gradient.addColorStop(1, '#2980b9');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    
    this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
    this.ctx.fillRect(paddle.x + 5, paddle.y + 2, paddle.width - 10, 4);
  }
  
  drawBall() {
    const ball = this.gameState.ball;
    
    const gradient = this.ctx.createRadialGradient(
      ball.x - 3, ball.y - 3, 0,
      ball.x, ball.y, ball.radius
    );
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(1, '#ccc');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#999';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    this.ctx.stroke();
  }
  
  drawPowerups() {
    this.gameState.powerups.forEach(powerup => {
      this.ctx.fillStyle = powerup.color;
      this.ctx.beginPath();
      this.ctx.arc(powerup.x + powerup.width / 2, powerup.y + powerup.height / 2, 12, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(powerup.type[0].toUpperCase(), powerup.x + powerup.width / 2, powerup.y + powerup.height / 2 + 4);
    });
  }
  
  drawParticles() {
    this.gameState.particles.forEach(particle => {
      this.ctx.globalAlpha = particle.life;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 150, 80);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    this.ctx.fillText(`Lives: ${this.gameState.lives}`, 20, 50);
    this.ctx.fillText(`Level: ${this.gameState.level}`, 20, 70);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BREAKOUT', this.canvas.width / 2, 30);
    
    if (this.gameState.ball.attached) {
      this.ctx.fillStyle = '#4ecdc4';
      this.ctx.font = '14px Arial';
      this.ctx.fillText('Press ACTION to launch', this.canvas.width / 2, this.canvas.height - 20);
    }
  }
  
  drawLevelComplete() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(200, 250, 400, 100);
    
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Level ${this.gameState.level} Complete!`, this.canvas.width / 2, 300);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
    
    if (this.gameState.level > this.gameState.maxLevels) {
      this.ctx.fillStyle = '#ffd93d';
      this.ctx.font = 'bold 24px Arial';
      this.ctx.fillText('YOU WIN!', this.canvas.width / 2, this.canvas.height / 2 + 80);
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.BreakoutBrickGame = BreakoutBrickGame;