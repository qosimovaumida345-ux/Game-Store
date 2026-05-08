// Star Fox Style Game
class StarFoxGame {
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
      health: 100,
      player: null,
      enemies: [],
      bullets: [],
      enemyBullets: [],
      stars: [],
      boss: null,
      bossHealth: 0,
      status: 'flying',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = { x: 400, y: 500, vx: 0, vy: 0, angle: 0 };
    
    for (let i = 0; i < 50; i++) {
      this.gameState.stars.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        z: Math.random() * 3 + 1,
        size: Math.random() * 2 + 1
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
    
    const maxSpeed = 8;
    if (input.left) p.vx -= 0.5;
    if (input.right) p.vx += 0.5;
    if (input.up) p.vy -= 0.5;
    if (input.down) p.vy += 0.5;
    
    p.vx = Math.max(-maxSpeed, Math.min(maxSpeed, p.vx));
    p.vy = Math.max(-maxSpeed, Math.min(maxSpeed, p.vy));
    
    p.x += p.vx;
    p.y += p.vy;
    p.x = Math.max(30, Math.min(770, p.x));
    p.y = Math.max(30, Math.min(570, p.y));
    
    p.angle = Math.atan2(p.vy, p.vx);
    
    if (input.action && Math.random() < 0.15) {
      this.gameState.bullets.push({
        x: p.x,
        y: p.y - 20,
        vx: Math.cos(p.angle) * 15,
        vy: Math.sin(p.angle) * 15 - 5
      });
    }
    
    this.gameState.stars.forEach(s => {
      s.z -= deltaTime * 5;
      if (s.z <= 0) {
        s.x = Math.random() * 800;
        s.y = Math.random() * 600;
        s.z = 3;
      }
    });
    
    if (Math.random() < 0.03 && this.gameState.enemies.length < 15) {
      this.gameState.enemies.push({
        x: Math.random() * 700 + 50,
        y: -30,
        type: Math.random() < 0.3 ? 'wing' : 'grunt',
        hp: 1,
        vx: (Math.random() - 0.5) * 2,
        vy: 2 + Math.random() * 2
      });
    }
    
    this.gameState.enemies.forEach((e, ei) => {
      e.x += e.vx;
      e.y += e.vy;
      
      if (Math.random() < 0.02) {
        this.gameState.enemyBullets.push({
          x: e.x,
          y: e.y + 10,
          vx: (p.x - e.x) * 0.05,
          vy: 4
        });
      }
      
      if (e.y > 650 || e.x < -50 || e.x > 850) {
        this.gameState.enemies.splice(ei, 1);
      }
    });
    
    this.gameState.bullets.forEach((b, bi) => {
      b.x += b.vx;
      b.y += b.vy;
      
      if (b.y < -20 || b.x < -20 || b.x > 820) {
        this.gameState.bullets.splice(bi, 1);
      }
      
      this.gameState.enemies.forEach((e, ei) => {
        const dx = b.x - e.x;
        const dy = b.y - e.y;
        if (Math.sqrt(dx*dx+dy*dy) < 25) {
          e.hp--;
          this.gameState.bullets.splice(bi, 1);
          if (e.hp <= 0) {
            this.gameState.enemies.splice(ei, 1);
            this.gameState.score += e.type === 'wing' ? 50 : 20;
          }
        }
      });
    });
    
    this.gameState.enemyBullets.forEach((eb, ei) => {
      eb.x += eb.vx;
      eb.y += eb.vy;
      
      if (eb.y > 620) {
        this.gameState.enemyBullets.splice(ei, 1);
      }
      
      const dx = p.x - eb.x;
      const dy = p.y - eb.y;
      if (Math.sqrt(dx*dx+dy*dy) < 20) {
        this.gameState.health -= 10;
        this.gameState.enemyBullets.splice(ei, 1);
        if (this.gameState.health <= 0) this.gameState.gameOver = true;
      }
    });
    
    const collisionBonus = p.vx * p.vy * 0.1;
    if (Math.abs(p.vx) > 5 && Math.abs(p.vy) > 5 && Math.random() < 0.01) {
      this.gameState.enemies.forEach((e, ei) => {
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        if (Math.sqrt(dx*dx+dy*dy) < 30) {
          this.gameState.enemies.splice(ei, 1);
          this.gameState.score += 100 + collisionBonus;
        }
      });
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#0a0a1a';
    this.ctx.fillRect(0, 0, 800, 600);
    
    this.gameState.stars.forEach(s => {
      const brightness = Math.min(255, s.z * 80);
      this.ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness + 50})`;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.size * s.z, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, 800, 100);
    this.ctx.fillRect(0, 500, 800, 100);
    
    this.gameState.enemies.forEach(e => {
      if (e.type === 'wing') {
        this.ctx.fillStyle = '#9b59b6';
        this.ctx.save();
        this.ctx.translate(e.x, e.y);
        this.ctx.rotate(Math.PI/2);
        this.ctx.beginPath();
        this.ctx.moveTo(0, -15);
        this.ctx.lineTo(15, 10);
        this.ctx.lineTo(0, 5);
        this.ctx.lineTo(-15, 10);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
      } else {
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.arc(e.x, e.y, 15, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.beginPath();
        this.ctx.arc(e.x, e.y, 8, 0, Math.PI*2);
        this.ctx.fill();
      }
    });
    
    this.ctx.fillStyle = '#f1c40f';
    this.gameState.bullets.forEach(b => {
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, 4, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    this.ctx.fillStyle = '#e74c3c';
    this.gameState.enemyBullets.forEach(eb => {
      this.ctx.beginPath();
      this.ctx.arc(eb.x, eb.y, 5, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    const p = this.gameState.player;
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.angle + Math.PI/2);
    
    this.ctx.fillStyle = '#3498db';
    this.ctx.beginPath();
    this.ctx.moveTo(0, -20);
    this.ctx.lineTo(8, 15);
    this.ctx.lineTo(0, 10);
    this.ctx.lineTo(-8, 15);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(-15, -5, 10, 8);
    this.ctx.fillRect(5, -5, 10, 8);
    
    this.ctx.restore();
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(20, 550, 200, 20);
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(20, 550, 200 * (this.gameState.health/100), 20);
    this.ctx.strokeStyle = '#fff';
    this.ctx.strokeRect(20, 550, 200, 20);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Score: ' + this.gameState.score, 20, 30);
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillText('STAR FOX STYLE', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.StarFoxGame = StarFoxGame;