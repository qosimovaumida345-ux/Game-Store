// MOBA Style Game
class MOBAStyleGame {
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
      gold: 0,
      level: 1,
      xp: 0,
      status: 'playing',
      hero: null,
      minions: [],
      towers: [],
      enemyBase: null,
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.hero = {
      x: 200,
      y: 300,
      radius: 20,
      health: 300,
      maxHealth: 300,
      attack: 25,
      speed: 3.5,
      attackCooldown: 0,
      abilities: [false, false, false]
    };
    
    this.gameState.towers = [
      { x: 300, y: 200, health: 500, damage: 20, range: 150, team: 'ally' },
      { x: 500, y: 300, health: 500, damage: 20, range: 150, team: 'ally' },
      { x: 500, y: 500, health: 500, damage: 20, range: 150, team: 'enemy' },
      { x: 700, y: 400, health: 500, damage: 20, range: 150, team: 'enemy' }
    ];
    
    this.gameState.enemyBase = { x: 750, y: 350, health: 1000 };
    
    this.spawnMinions();
  }
  
  spawnMinions() {
    for (let i = 0; i < 3; i++) {
      this.gameState.minions.push(
        { x: 400, y: 280, health: 80, attack: 10, team: 'ally', speed: 2 },
        { x: 400, y: 320, health: 80, attack: 10, team: 'ally', speed: 2 },
        { x: 400, y: 450, health: 80, attack: 10, team: 'enemy', speed: 2 },
        { x: 400, y: 490, health: 80, attack: 10, team: 'enemy', speed: 2 }
      );
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
    this.gameState.gold += deltaTime * 5;
    
    this.updateHero();
    this.updateMinions(deltaTime);
    this.updateTowers();
  }
  
  updateHero() {
    const input = this.getPlayerInput(this.players[0]);
    const hero = this.gameState.hero;
    
    if (input.left) hero.x -= hero.speed;
    if (input.right) hero.x += hero.speed;
    if (input.up) hero.y -= hero.speed;
    if (input.down) hero.y += hero.speed;
    
    hero.x = Math.max(50, Math.min(750, hero.x));
    hero.y = Math.max(50, Math.min(550, hero.y));
    
    if (hero.attackCooldown > 0) hero.attackCooldown -= 0.016;
    
    if (input.action && hero.attackCooldown <= 0) {
      this.heroAttack();
    }
  }
  
  heroAttack() {
    const hero = this.gameState.hero;
    hero.attackCooldown = 0.8;
    
    this.gameState.minions.concat(this.gameState.towers).forEach(target => {
      const dx = target.x - hero.x;
      const dy = target.y - hero.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 60 && target.team === 'enemy') {
        target.health -= hero.attack;
      }
    });
  }
  
  updateMinions(deltaTime) {
    this.gameState.minions = this.gameState.minions.filter(minion => {
      if (minion.health <= 0) return false;
      
      let target = null;
      let minDist = 100;
      
      this.gameState.minions.forEach(other => {
        if (other.team !== minion.team && other.health > 0) {
          const dx = other.x - minion.x;
          const dy = other.y - minion.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < minDist) {
            minDist = dist;
            target = other;
          }
        }
      });
      
      if (target) {
        const dx = target.x - minion.x;
        const dy = target.y - minion.y;
        
        if (minDist > 30) {
          minion.x += (dx / minDist) * minion.speed;
          minion.y += (dy / minDist) * minion.speed;
        } else {
          target.health -= minion.attack * deltaTime;
        }
      }
      
      return true;
    });
  }
  
  updateTowers() {
    const hero = this.gameState.hero;
    
    this.gameState.towers.forEach(tower => {
      if (tower.health <= 0) return;
      
      const dx = hero.x - tower.x;
      const dy = hero.y - tower.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < tower.range) {
        hero.health -= tower.damage * 0.016;
        
        if (hero.health <= 0) {
          this.gameState.gameOver = true;
        }
      }
    });
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.drawBackground();
    this.drawMap();
    this.drawTowers();
    this.drawMinions();
    this.drawHero();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    this.ctx.fillStyle = '#27ae60';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawMap() {
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(180, 150, 140, 300);
    this.ctx.fillRect(480, 150, 140, 300);
  }
  
  drawTowers() {
    this.gameState.towers.forEach(tower => {
      const color = tower.team === 'ally' ? '#3498db' : '#e74c3c';
      
      this.ctx.fillStyle = color;
      this.ctx.fillRect(tower.x - 20, tower.y - 30, 40, 60);
      
      this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
      this.ctx.fillRect(tower.x - 25, tower.y - 45, 50, 8);
      this.ctx.fillStyle = '#2ecc71';
      this.ctx.fillRect(tower.x - 25, tower.y - 45, 50 * (tower.health / 500), 8);
    });
  }
  
  drawMinions() {
    this.gameState.minions.forEach(minion => {
      this.ctx.fillStyle = minion.team === 'ally' ? '#f39c12' : '#8e44ad';
      this.ctx.beginPath();
      this.ctx.arc(minion.x, minion.y, 12, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawHero() {
    const hero = this.gameState.hero;
    
    this.ctx.fillStyle = '#3498db';
    this.ctx.beginPath();
    this.ctx.arc(hero.x, hero.y, hero.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(hero.x - 5, hero.y - 5, 4, 0, Math.PI * 2);
    this.ctx.arc(hero.x + 5, hero.y - 5, 4, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this.ctx.fillRect(hero.x - 25, hero.y - 35, 50, 8);
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(hero.x - 25, hero.y - 35, 50 * (hero.health / hero.maxHealth), 8);
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 120, 70);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Gold: ${Math.floor(this.gameState.gold)}`, 20, 30);
    this.ctx.fillText(`Level: ${this.gameState.level}`, 20, 50);
    this.ctx.fillText(`XP: ${Math.floor(this.gameState.xp)}`, 20, 70);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('MOBA LEGENDS', this.canvas.width / 2, 30);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.MOBAStyleGame = MOBAStyleGame;