// Missile Command Game
class MissileCommandGame {
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
      ammo: 30,
      missiles: [],
      enemyMissiles: [],
      cities: [],
      explosions: [],
      status: 'defending',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    for (let i = 0; i < 6; i++) {
      this.gameState.cities.push({
        x: 80 + i * 130,
        y: 560,
        alive: true,
        width: 40,
        height: 30
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
    
    if (Math.random() < 0.02) {
      this.gameState.enemyMissiles.push({
        x: Math.random() * 800,
        y: 0,
        targetX: Math.random() < 0.5 ? this.gameState.cities.find(c => c.alive)?.x || 400 : Math.random() * 800,
        targetY: 550,
        speed: 50 + Math.random() * 50
      });
    }
    
    this.gameState.enemyMissiles.forEach((em, ei) => {
      const dx = em.targetX - em.x;
      const dy = em.targetY - em.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      em.x += (dx/dist) * em.speed * deltaTime;
      em.y += (dy/dist) * em.speed * deltaTime;
      
      if (dist < 10) {
        this.gameState.explosions.push({ x: em.targetX, y: em.targetY, radius: 1, maxRadius: 80 });
        this.gameState.cities.forEach(c => {
          if (c.alive && Math.abs(c.x - em.targetX) < 50) {
            c.alive = false;
          }
        });
        this.gameState.enemyMissiles.splice(ei, 1);
      }
    });
    
    this.gameState.missiles.forEach((m, mi) => {
      const dx = m.targetX - m.x;
      const dy = m.targetY - m.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      m.x += (dx/dist) * m.speed * deltaTime;
      m.y += (dy/dist) * m.speed * deltaTime;
      
      if (dist < 10) {
        this.gameState.explosions.push({ x: m.targetX, y: m.targetY, radius: 1, maxRadius: 60 });
        this.gameState.enemyMissiles.forEach((em, ei) => {
          const edx = em.x - m.targetX;
          const edy = em.y - m.targetY;
          if (Math.sqrt(edx*edx + edy*edy) < 60) {
            this.gameState.enemyMissiles.splice(ei, 1);
            this.gameState.score += 100;
          }
        });
        this.gameState.missiles.splice(mi, 1);
      }
    });
    
    this.gameState.explosions.forEach((e, ei) => {
      e.radius += 100 * deltaTime;
      if (e.radius >= e.maxRadius) {
        this.gameState.explosions.splice(ei, 1);
      }
    });
    
    if (this.gameState.cities.filter(c => c.alive).length === 0) {
      this.gameState.gameOver = true;
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  fireMissile(targetX, targetY) {
    if (this.gameState.ammo > 0 && !this.gameState.gameOver) {
      this.gameState.missiles.push({
        x: 400,
        y: 580,
        targetX: targetX,
        targetY: targetY,
        speed: 300
      });
      this.gameState.ammo--;
    }
  }
  
  render() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, 800, 600);
    
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 580, 800, 20);
    
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < 800; i += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, 580);
      this.ctx.stroke();
    }
    
    this.gameState.cities.forEach(c => {
      if (c.alive) {
        this.ctx.fillStyle = '#3498db';
        this.ctx.fillRect(c.x - 15, c.y - 20, 30, 20);
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.beginPath();
        this.ctx.arc(c.x, c.y - 25, 8, 0, Math.PI*2);
        this.ctx.fill();
      } else {
        this.ctx.fillStyle = '#7f8c8d';
        this.ctx.fillRect(c.x - 15, c.y - 10, 30, 10);
      }
    });
    
    this.ctx.strokeStyle = '#e74c3c';
    this.ctx.lineWidth = 2;
    this.gameState.enemyMissiles.forEach(em => {
      this.ctx.beginPath();
      this.ctx.moveTo(em.x, em.y);
      this.ctx.lineTo(em.x + (em.x - em.targetX) * 0.1, em.y + (em.y - em.targetY) * 0.1);
      this.ctx.stroke();
    });
    
    this.ctx.strokeStyle = '#3498db';
    this.gameState.missiles.forEach(m => {
      this.ctx.beginPath();
      this.ctx.moveTo(m.x, m.y);
      this.ctx.lineTo(m.x + (m.x - m.targetX) * 0.1, m.y + (m.y - m.targetY) * 0.1);
      this.ctx.stroke();
    });
    
    this.gameState.explosions.forEach(e => {
      const gradient = this.ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(0.3, 'rgba(255, 200, 0, 0.8)');
      gradient.addColorStop(0.6, 'rgba(255, 100, 0, 0.5)');
      gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(e.x, e.y, e.radius, 0, Math.PI*2);
      this.ctx.fill();
    });
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText('AMMO: ' + this.gameState.ammo, 20, 40);
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText('Score: ' + this.gameState.score, 20, 65);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillText('MISSLE COMMAND', this.canvas.width/2, 25);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    if (input.target) {
      this.fireMissile(input.target.x, input.target.y);
    }
  }
}

window.MissileCommandGame = MissileCommandGame;