// Tower Defense Game
class TowerDefenseGame {
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
      money: 100,
      wave: 1,
      status: 'playing',
      base: { x: 750, y: 300, hp: 100 },
      enemies: [],
      towers: [],
      projectiles: [],
      path: []
    };
    
    this.generatePath();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  generatePath() {
    const points = [
      { x: 0, y: 100 },
      { x: 200, y: 100 },
      { x: 200, y: 400 },
      { x: 400, y: 400 },
      { x: 400, y: 200 },
      { x: 600, y: 200 },
      { x: 600, y: 500 },
      { x: 750, y: 500 }
    ];
    this.gameState.path = points;
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
    
    // Spawn enemies
    if (Math.random() < 0.02 * this.gameState.wave) {
      this.spawnEnemy();
    }
    
    // Update enemies
    this.gameState.enemies.forEach((enemy, i) => {
      const target = this.getNextPathPoint(enemy.pathIndex);
      if (target) {
        const dx = target.x - enemy.x;
        const dy = target.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 5) {
          enemy.pathIndex++;
          if (enemy.pathIndex >= this.gameState.path.length) {
            this.gameState.base.hp -= 10;
            this.gameState.enemies.splice(i, 1);
          }
        } else {
          enemy.x += (dx / dist) * enemy.speed;
          enemy.y += (dy / dist) * enemy.speed;
        }
      }
    });
    
    // Towers shoot
    this.gameState.towers.forEach(tower => {
      tower.cooldown -= deltaTime;
      
      if (tower.cooldown <= 0) {
        const target = this.findNearestEnemy(tower);
        if (target) {
          this.gameState.projectiles.push({
            x: tower.x + 15,
            y: tower.y + 15,
            vx: (target.x - tower.x) * 0.1,
            vy: (target.y - tower.y) * 0.1,
            damage: tower.damage,
            speed: 8
          });
          tower.cooldown = tower.fireRate;
        }
      }
    });
    
    // Update projectiles
    this.gameState.projectiles.forEach((proj, pi) => {
      proj.x += proj.vx;
      proj.y += proj.vy;
      
      this.gameState.enemies.forEach((enemy, ei) => {
        const dx = proj.x - enemy.x;
        const dy = proj.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 20) {
          enemy.hp -= proj.damage;
          this.gameState.projectiles.splice(pi, 1);
          
          if (enemy.hp <= 0) {
            this.gameState.enemies.splice(ei, 1);
            this.gameState.money += enemy.reward;
            this.gameState.score += enemy.reward * 10;
          }
        }
      });
      
      if (proj.x < 0 || proj.x > this.canvas.width || proj.y < 0 || proj.y > this.canvas.height) {
        this.gameState.projectiles.splice(pi, 1);
      }
    });
    
    if (this.gameState.base.hp <= 0) {
      this.gameState.status = 'gameover';
    }
  }
  
  spawnEnemy() {
    this.gameState.enemies.push({
      x: this.gameState.path[0].x,
      y: this.gameState.path[0].y,
      hp: 20 + this.gameState.wave * 5,
      maxHp: 20 + this.gameState.wave * 5,
      speed: 1 + this.gameState.wave * 0.1,
      reward: 10 + this.gameState.wave,
      pathIndex: 1
    });
  }
  
  getNextPathPoint(index) {
    if (index < this.gameState.path.length) {
      return this.gameState.path[index];
    }
    return null;
  }
  
  findNearestEnemy(tower) {
    let nearest = null;
    let minDist = Infinity;
    
    this.gameState.enemies.forEach(enemy => {
      const dx = enemy.x - tower.x;
      const dy = enemy.y - tower.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < tower.range && dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    });
    
    return nearest;
  }
  
  placeTower(x, y) {
    if (this.gameState.money >= 50) {
      this.gameState.towers.push({
        x, y,
        damage: 10,
        range: 150,
        fireRate: 1,
        cooldown: 0,
        color: '#4ecdc4'
      });
      this.gameState.money -= 50;
    }
  }
  
  render() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw path
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 30;
    this.ctx.beginPath();
    this.ctx.moveTo(this.gameState.path[0].x, this.gameState.path[0].y);
    this.gameState.path.forEach(p => this.ctx.lineTo(p.x, p.y));
    this.ctx.stroke();
    
    // Path center line
    this.ctx.strokeStyle = '#555';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([10, 10]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    
    // Base
    const base = this.gameState.base;
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(base.x - 20, base.y - 20, 40, 40);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(base.hp, base.x, base.y + 4);
    
    // Towers
    this.gameState.towers.forEach(tower => {
      this.ctx.fillStyle = tower.color;
      this.ctx.fillRect(tower.x, tower.y, 30, 30);
      this.ctx.fillStyle = '#fff';
      this.ctx.fillRect(tower.x + 10, tower.y + 5, 10, 10);
    });
    
    // Enemies
    this.gameState.enemies.forEach(enemy => {
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.beginPath();
      this.ctx.arc(enemy.x, enemy.y, 15, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(enemy.x - 15, enemy.y - 25, 30, 5);
      this.ctx.fillStyle = '#2ecc71';
      this.ctx.fillRect(enemy.x - 15, enemy.y - 25, 30 * (enemy.hp / enemy.maxHp), 5);
    });
    
    // Projectiles
    this.gameState.projectiles.forEach(proj => {
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.beginPath();
      this.ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    this.drawUI();
    
    if (this.gameState.status === 'gameover') {
      this.drawGameOver();
    }
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 150, 80);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Wave: ${this.gameState.wave}`, 20, 35);
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 55);
    this.ctx.fillText(`Money: $${this.gameState.money}`, 20, 75);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(10, this.canvas.height - 30, 200, 20);
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(10, this.canvas.height - 30, 200 * (this.gameState.base.hp / 100), 20);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px Arial';
    this.ctx.fillText(`Base HP: ${this.gameState.base.hp}`, 15, this.canvas.height - 16);
    
    this.ctx.fillStyle = '#4ecdc4';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Click to place tower ($50)', this.canvas.width / 2, 30);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.TowerDefenseGame = TowerDefenseGame;