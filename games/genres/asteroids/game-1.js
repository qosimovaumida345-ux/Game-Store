// Asteroids Game
class AsteroidsGame {
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
      status: 'playing',
      player: null,
      bullets: [],
      asteroids: [],
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      angle: -Math.PI / 2,
      vx: 0,
      vy: 0,
      radius: 15,
      thrusting: false,
      rotation: 0
    };
    
    this.createAsteroids(5);
    this.gameState.bullets = [];
  }
  
  createAsteroids(count) {
    this.gameState.asteroids = [];
    
    for (let i = 0; i < count; i++) {
      let x, y;
      
      do {
        x = Math.random() * this.canvas.width;
        y = Math.random() * this.canvas.height;
      } while (this.distance(x, y, this.gameState.player.x, this.gameState.player.y) < 150);
      
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      
      this.gameState.asteroids.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 20 + Math.random() * 30,
        points: 20 - Math.floor(Math.random() * 3) * 5,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.1
      });
    }
  }
  
  distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
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
    this.updatePlayer();
    this.updateBullets();
    this.updateAsteroids();
    this.checkCollisions();
    this.checkLevelComplete();
  }
  
  updatePlayer() {
    const input = this.getPlayerInput(this.players[0]);
    const player = this.gameState.player;
    
    if (input.left) player.rotation = -0.1;
    else if (input.right) player.rotation = 0.1;
    else player.rotation = 0;
    
    player.angle += player.rotation;
    
    player.thrusting = input.up;
    
    if (player.thrusting) {
      player.vx += Math.cos(player.angle) * 0.15;
      player.vy += Math.sin(player.angle) * 0.15;
    }
    
    player.vx *= 0.99;
    player.vy *= 0.99;
    
    player.x += player.vx;
    player.y += player.vy;
    
    if (player.x < 0) player.x = this.canvas.width;
    if (player.x > this.canvas.width) player.x = 0;
    if (player.y < 0) player.y = this.canvas.height;
    if (player.y > this.canvas.height) player.y = 0;
  }
  
  shoot() {
    const player = this.gameState.player;
    
    this.gameState.bullets.push({
      x: player.x + Math.cos(player.angle) * 20,
      y: player.y + Math.sin(player.angle) * 20,
      vx: Math.cos(player.angle) * 10 + player.vx,
      vy: Math.sin(player.angle) * 10 + player.vy,
      radius: 3,
      life: 1.5
    });
  }
  
  updateBullets() {
    this.gameState.bullets.forEach(bullet => {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      bullet.life -= 0.016;
    });
    
    this.gameState.bullets = this.gameState.bullets.filter(b => 
      b.life > 0 && b.x > 0 && b.x < this.canvas.width && b.y > 0 && b.y < this.canvas.height
    );
  }
  
  updateAsteroids() {
    this.gameState.asteroids.forEach(asteroid => {
      asteroid.x += asteroid.vx;
      asteroid.y += asteroid.vy;
      asteroid.rotation += asteroid.rotationSpeed;
      
      if (asteroid.x < -asteroid.radius) asteroid.x = this.canvas.width + asteroid.radius;
      if (asteroid.x > this.canvas.width + asteroid.radius) asteroid.x = -asteroid.radius;
      if (asteroid.y < -asteroid.radius) asteroid.y = this.canvas.height + asteroid.radius;
      if (asteroid.y > this.canvas.height + asteroid.radius) asteroid.y = -asteroid.radius;
    });
  }
  
  checkCollisions() {
    const player = this.gameState.player;
    
    this.gameState.bullets.forEach((bullet, bi) => {
      this.gameState.asteroids.forEach((asteroid, ai) => {
        if (this.distance(bullet.x, bullet.y, asteroid.x, asteroid.y) < asteroid.radius + bullet.radius) {
          this.gameState.score += asteroid.points;
          this.gameState.asteroids.splice(ai, 1);
          this.gameState.bullets.splice(bi, 1);
          
          if (asteroid.radius > 30) {
            for (let i = 0; i < 2; i++) {
              this.gameState.asteroids.push({
                x: asteroid.x,
                y: asteroid.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                radius: asteroid.radius / 2,
                points: asteroid.points * 2,
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.2
              });
            }
          }
        }
      });
    });
    
    this.gameState.asteroids.forEach(asteroid => {
      if (this.distance(player.x, player.y, asteroid.x, asteroid.y) < player.radius + asteroid.radius) {
        this.gameState.lives--;
        
        if (this.gameState.lives <= 0) {
          this.gameState.gameOver = true;
        } else {
          this.gameState.player.x = this.canvas.width / 2;
          this.gameState.player.y = this.canvas.height / 2;
          this.gameState.player.vx = 0;
          this.gameState.player.vy = 0;
        }
      }
    });
  }
  
  checkLevelComplete() {
    if (this.gameState.asteroids.length === 0) {
      this.gameState.level++;
      this.gameState.score += 500;
      this.createAsteroids(4 + this.gameState.level);
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (input.action) this.shoot();
  }
  
  render() {
    this.drawBackground();
    this.drawPlayer();
    this.drawAsteroids();
    this.drawBullets();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 100; i++) {
      this.ctx.beginPath();
      this.ctx.arc(
        Math.random() * this.canvas.width,
        Math.random() * this.canvas.height,
        Math.random() * 1.5,
        0, Math.PI * 2
      );
      this.ctx.fill();
    }
  }
  
  drawPlayer() {
    const player = this.gameState.player;
    
    this.ctx.save();
    this.ctx.translate(player.x, player.y);
    this.ctx.rotate(player.angle);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.moveTo(20, 0);
    this.ctx.lineTo(-15, -10);
    this.ctx.lineTo(-10, 0);
    this.ctx.lineTo(-15, 10);
    this.ctx.closePath();
    this.ctx.fill();
    
    if (player.thrusting) {
      this.ctx.fillStyle = '#f00';
      this.ctx.beginPath();
      this.ctx.moveTo(-12, 0);
      this.ctx.lineTo(-25, -5);
      this.ctx.lineTo(-20, 0);
      this.ctx.lineTo(-25, 5);
      this.ctx.closePath();
      this.ctx.fill();
    }
    
    this.ctx.restore();
  }
  
  drawAsteroids() {
    this.gameState.asteroids.forEach(asteroid => {
      this.ctx.save();
      this.ctx.translate(asteroid.x, asteroid.y);
      this.ctx.rotate(asteroid.rotation);
      
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      
      const points = 8;
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const r = asteroid.radius * (0.7 + Math.sin(i * 3) * 0.3);
        if (i === 0) this.ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
        else this.ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      this.ctx.closePath();
      this.ctx.stroke();
      
      this.ctx.restore();
    });
  }
  
  drawBullets() {
    this.ctx.fillStyle = '#ff0';
    this.gameState.bullets.forEach(bullet => {
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 150, 70);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    this.ctx.fillText(`Lives: ${this.gameState.lives}`, 20, 50);
    this.ctx.fillText(`Level: ${this.gameState.level}`, 20, 70);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('ASTEROIDS', this.canvas.width / 2, 30);
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
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.AsteroidsGame = AsteroidsGame;