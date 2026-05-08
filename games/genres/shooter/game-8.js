// Galaga Style Game
class GalagaGame {
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
      player: null,
      enemies: [],
      bullets: [],
      enemyBullets: [],
      wave: 1,
      status: 'playing',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = { x: 400, y: 520 };
    this.spawnWave();
  }
  
  spawnWave() {
    const rows = 3 + Math.floor(this.gameState.wave / 2);
    const cols = 8;
    const enemyTypes = ['bug', 'butterfly', 'saucer'];
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.gameState.enemies.push({
          x: 100 + col * 70,
          y: 50 + row * 50,
          type: enemyTypes[Math.min(row, 2)],
          hp: row === 0 ? 2 : 1,
          angle: 0,
          pattern: row
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
    if (this.gameState.gameOver) return;
    this.gameState.time += deltaTime;
    
    const input = this.getPlayerInput(this.players[0]);
    const p = this.gameState.player;
    if (input.left) p.x = Math.max(30, p.x - 6);
    if (input.right) p.x = Math.min(770, p.x + 6);
    
    if (input.action && Math.random() < 0.15) {
      this.gameState.bullets.push({ x: p.x, y: p.y - 20, speed: 400 });
    }
    
    this.gameState.bullets.forEach((b, bi) => {
      b.y -= b.speed * deltaTime;
      if (b.y < 0) this.gameState.bullets.splice(bi, 1);
    });
    
    this.gameState.enemies.forEach(e => {
      e.angle += deltaTime * 2;
      
      if (e.pattern % 2 === 0) {
        e.x += Math.sin(this.gameState.time * 2 + e.angle) * 50 * deltaTime;
      }
      
      if (Math.random() < 0.01 * this.gameState.wave) {
        this.gameState.enemyBullets.push({ x: e.x, y: e.y + 15, speed: 150 });
      }
    });
    
    this.gameState.enemyBullets.forEach((eb, ei) => {
      eb.y += eb.speed * deltaTime;
      if (eb.y > 600) {
        this.gameState.enemyBullets.splice(ei, 1);
      }
      
      const dx = p.x - eb.x;
      const dy = p.y - eb.y;
      if (Math.sqrt(dx*dx + dy*dy) < 20) {
        this.gameState.lives--;
        this.gameState.enemyBullets.splice(ei, 1);
        if (this.gameState.lives <= 0) this.gameState.gameOver = true;
      }
    });
    
    this.gameState.bullets.forEach((b, bi) => {
      this.gameState.enemies.forEach((e, ei) => {
        const dx = b.x - e.x;
        const dy = b.y - e.y;
        if (Math.sqrt(dx*dx + dy*dy) < 20) {
          e.hp--;
          this.gameState.bullets.splice(bi, 1);
          if (e.hp <= 0) {
            this.gameState.enemies.splice(ei, 1);
            this.gameState.score += e.type === 'saucer' ? 150 : (e.type === 'butterfly' ? 80 : 50);
          }
        }
      });
    });
    
    if (this.gameState.enemies.length === 0) {
      this.gameState.wave++;
      this.spawnWave();
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#000022';
    this.ctx.fillRect(0, 0, 800, 600);
    
    this.ctx.fillStyle = '#1a1a3a';
    for (let i = 0; i < 50; i++) {
      this.ctx.fillRect((i * 73) % 800, (i * 47) % 600, 2, 2);
    }
    
    this.gameState.enemies.forEach(e => {
      this.ctx.save();
      this.ctx.translate(e.x, e.y);
      
      if (e.type === 'bug') {
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -15);
        this.ctx.lineTo(12, 10);
        this.ctx.lineTo(-12, 10);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(-4, 0, 3, 0, Math.PI*2);
        this.ctx.arc(4, 0, 3, 0, Math.PI*2);
        this.ctx.fill();
      } else if (e.type === 'butterfly') {
        this.ctx.fillStyle = '#3498db';
        this.ctx.beginPath();
        this.ctx.ellipse(-10, 0, 12, 8, Math.sin(e.angle) * 0.3, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(10, 0, 12, 8, -Math.sin(e.angle) * 0.3, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.fillRect(-3, -10, 6, 20);
      } else {
        this.ctx.fillStyle = '#9b59b6';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 12, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(-6, -3, 12, 6);
      }
      
      this.ctx.restore();
    });
    
    this.ctx.fillStyle = '#f1c40f';
    this.gameState.bullets.forEach(b => {
      this.ctx.fillRect(b.x - 2, b.y - 8, 4, 16);
    });
    
    this.ctx.fillStyle = '#e74c3c';
    this.gameState.enemyBullets.forEach(eb => {
      this.ctx.beginPath();
      this.ctx.arc(eb.x, eb.y, 5, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    const p = this.gameState.player;
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.beginPath();
    this.ctx.moveTo(p.x, p.y - 20);
    this.ctx.lineTo(p.x - 15, p.y + 10);
    this.ctx.lineTo(p.x + 15, p.y + 10);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillRect(p.x - 8, p.y - 5, 16, 8);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Score: ' + this.gameState.score, 20, 30);
    this.ctx.fillText('Wave: ' + this.gameState.wave, 150, 30);
    this.ctx.fillText('Lives: ' + '▲'.repeat(this.gameState.lives), 650, 30);
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GALAGA', 400, 20);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.GalagaGame = GalagaGame;