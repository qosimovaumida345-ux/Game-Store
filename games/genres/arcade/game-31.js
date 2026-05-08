// Fruit Ninja Game
class FruitNinjaGame {
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
      fruits: [],
      particles: [],
      bomb: null,
      slash: null,
      status: 'slicing',
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.slash = { points: [], active: false };
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
    
    if (Math.random() < 0.03 && this.gameState.fruits.length < 10) {
      const fruitTypes = [
        { color: '#e74c3c', name: 'apple', points: 10 },
        { color: '#f1c40f', name: 'banana', points: 15 },
        { color: '#e67e22', name: 'orange', points: 10 },
        { color: '#9b59b6', name: 'grape', points: 20 },
        { color: '#2ecc71', name: 'watermelon', points: 25 }
      ];
      const type = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
      this.gameState.fruits.push({
        x: Math.random() * 600 + 100,
        y: 650,
        vx: (Math.random() - 0.5) * 3,
        vy: -(8 + Math.random() * 4),
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        type: type,
        sliced: false
      });
    }
    
    if (!this.gameState.bomb && Math.random() < 0.01) {
      this.gameState.bomb = {
        x: Math.random() * 600 + 100,
        y: 650,
        vx: (Math.random() - 0.5) * 3,
        vy: -(8 + Math.random() * 4),
        rotation: 0
      };
    }
    
    this.gameState.fruits.forEach((f, fi) => {
      f.x += f.vx;
      f.y += f.vy;
      f.vy += 0.15;
      f.rotation += f.rotationSpeed;
      
      if (f.y > 650) {
        if (!f.sliced) {
          this.gameState.lives--;
          if (this.gameState.lives <= 0) this.gameState.gameOver = true;
        }
        this.gameState.fruits.splice(fi, 1);
      }
    });
    
    if (this.gameState.bomb) {
      this.gameState.bomb.x += this.gameState.bomb.vx;
      this.gameState.bomb.y += this.gameState.bomb.vy;
      this.gameState.bomb.vy += 0.15;
      this.gameState.bomb.rotation += 0.1;
      
      if (this.gameState.bomb.y > 650) {
        this.gameState.bomb = null;
      }
    }
    
    this.gameState.particles.forEach((p, pi) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3;
      p.life -= deltaTime;
      if (p.life <= 0) this.gameState.particles.splice(pi, 1);
    });
  }
  
  checkSlice(x, y) {
    if (!this.gameState.slash.points.length) return;
    
    const lastPoint = this.gameState.slash.points[this.gameState.slash.points.length - 1];
    const dx = x - lastPoint.x;
    const dy = y - lastPoint.y;
    const dist = Math.sqrt(dx*dx+dy*dy);
    
    if (dist > 10) {
      this.gameState.fruits.forEach(f => {
        if (!f.sliced && Math.abs(f.x - x) < 40 && Math.abs(f.y - y) < 40) {
          f.sliced = true;
          this.gameState.score += f.type.points;
          
          for (let i = 0; i < 8; i++) {
            this.gameState.particles.push({
              x: f.x,
              y: f.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              color: f.type.color,
              life: 1
            });
          }
        }
      });
      
      if (this.gameState.bomb && Math.abs(this.gameState.bomb.x - x) < 40 && Math.abs(this.gameState.bomb.y - y) < 40) {
        this.gameState.gameOver = true;
      }
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(0, 0, 800, 600);
    
    this.ctx.fillStyle = '#27ae60';
    this.ctx.fillRect(0, 550, 800, 50);
    
    this.gameState.fruits.forEach(f => {
      if (f.sliced) return;
      this.ctx.save();
      this.ctx.translate(f.x, f.y);
      this.ctx.rotate(f.rotation);
      
      this.ctx.fillStyle = f.type.color;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 25, 0, Math.PI*2);
      this.ctx.fill();
      
      if (f.type.name === 'watermelon') {
        this.ctx.fillStyle = '#c0392b';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 15, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.fillStyle = '#000';
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2;
          this.ctx.beginPath();
          this.ctx.arc(Math.cos(angle) * 8, Math.sin(angle) * 8, 2, 0, Math.PI*2);
          this.ctx.fill();
        }
      } else if (f.type.name === 'banana') {
        this.ctx.fillStyle = '#f39c12';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 30, 10, 0, 0, Math.PI*2);
        this.ctx.fill();
      }
      
      this.ctx.restore();
    });
    
    if (this.gameState.bomb) {
      this.ctx.save();
      this.ctx.translate(this.gameState.bomb.x, this.gameState.bomb.y);
      this.ctx.rotate(this.gameState.bomb.rotation);
      
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 25, 0, Math.PI*2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.beginPath();
      this.ctx.arc(-8, -8, 6, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(8, -8, 6, 0, Math.PI*2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#000';
      this.ctx.beginPath();
      this.ctx.arc(-8, -8, 2, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(8, -8, 2, 0, Math.PI*2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(-3, -30, 6, 15);
      
      this.ctx.restore();
    }
    
    this.gameState.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 5, 0, Math.PI*2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
    
    if (this.gameState.slash.points.length > 1) {
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.lineWidth = 4;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(this.gameState.slash.points[0].x, this.gameState.slash.points[0].y);
      this.gameState.slash.points.forEach(p => this.ctx.lineTo(p.x, p.y));
      this.ctx.stroke();
    }
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 30px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Score: ' + this.gameState.score, 20, 40);
    this.ctx.font = '20px Arial';
    this.ctx.fillText('Lives: ' + '♥'.repeat(this.gameState.lives), 20, 70);
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('FRUIT NINJA', 400, 30);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    if (input.slash) {
      this.gameState.slash.points = input.slash;
      if (input.slash.length > 0) {
        const lastPoint = input.slash[input.slash.length - 1];
        this.checkSlice(lastPoint.x, lastPoint.y);
      }
    }
  }
}

window.FruitNinjaGame = FruitNinjaGame;