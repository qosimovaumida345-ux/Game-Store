// Brawl Stars Game
class BrawlStarsGame {
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
      gems: 0,
      status: 'playing',
      player: null,
      enemies: [],
      gems: [],
      powerups: [],
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
      x: 400,
      y: 300,
      radius: 20,
      health: 100,
      super: 0,
      speed: 4,
      attackCooldown: 0
    };
    
    this.spawnGems(10);
    this.spawnEnemies(5);
  }
  
  spawnGems(count) {
    for (let i = 0; i < count; i++) {
      this.gameState.gems.push({
        x: 50 + Math.random() * 700,
        y: 50 + Math.random() * 500,
        value: 1
      });
    }
  }
  
  spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 350;
      
      this.gameState.enemies.push({
        x: 400 + Math.cos(angle) * dist,
        y: 300 + Math.sin(angle) * dist,
        radius: 18,
        health: 50,
        speed: 2,
        attackCooldown: 0
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
    this.updatePlayer();
    this.updateEnemies();
    this.checkCollisions();
  }
  
  updatePlayer() {
    const input = this.getPlayerInput(this.players[0]);
    const player = this.gameState.player;
    
    if (input.left) player.x -= player.speed;
    if (input.right) player.x += player.speed;
    if (input.up) player.y -= player.speed;
    if (input.down) player.y += player.speed;
    
    player.x = Math.max(player.radius, Math.min(this.canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(this.canvas.height - player.radius, player.y));
    
    if (player.attackCooldown > 0) player.attackCooldown -= 0.016;
  }
  
  attack() {
    const player = this.gameState.player;
    
    if (player.attackCooldown > 0) return;
    
    player.attackCooldown = 0.5;
    
    this.gameState.enemies.forEach(enemy => {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 80) {
        enemy.health -= 15;
        
        const angle = Math.atan2(dy, dx);
        enemy.x += Math.cos(angle) * 30;
        enemy.y += Math.sin(angle) * 30;
      }
    });
  }
  
  useSuper() {
    const player = this.gameState.player;
    
    if (player.super < 100) return;
    
    player.super = 0;
    
    this.gameState.enemies.forEach(enemy => {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 150) {
        enemy.health -= 40;
      }
    });
  }
  
  updateEnemies() {
    const player = this.gameState.player;
    
    this.gameState.enemies = this.gameState.enemies.filter(enemy => {
      if (enemy.health <= 0) {
        this.gameState.score += 50;
        return false;
      }
      
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 100) {
        enemy.x += (dx / dist) * enemy.speed;
        enemy.y += (dy / dist) * enemy.speed;
      } else {
        player.health -= 0.5;
        
        if (player.health <= 0) {
          this.gameState.gameOver = true;
        }
      }
      
      return true;
    });
  }
  
  checkCollisions() {
    const player = this.gameState.player;
    
    this.gameState.gems = this.gameState.gems.filter(gem => {
      const dx = player.x - gem.x;
      const dy = player.y - gem.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < player.radius + 15) {
        this.gameState.gems++;
        this.gameState.score += 10;
        player.super = Math.min(100, player.super + 5);
        return false;
      }
      return true;
    });
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (input.action) this.attack();
    if (input.b) this.useSuper();
  }
  
  render() {
    this.drawBackground();
    this.drawGems();
    this.drawEnemies();
    this.drawPlayer();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawGems() {
    this.gameState.gems.forEach(gem => {
      const gradient = this.ctx.createRadialGradient(gem.x - 3, gem.y - 3, 0, gem.x, gem.y, 15);
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(1, '#9b59b6');
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.moveTo(gem.x, gem.y - 15);
      this.ctx.lineTo(gem.x + 12, gem.y);
      this.ctx.lineTo(gem.x, gem.y + 15);
      this.ctx.lineTo(gem.x - 12, gem.y);
      this.ctx.closePath();
      this.ctx.fill();
    });
  }
  
  drawEnemies() {
    this.gameState.enemies.forEach(enemy => {
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.beginPath();
      this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#c0392b';
      this.ctx.beginPath();
      this.ctx.arc(enemy.x - 5, enemy.y - 5, 4, 0, Math.PI * 2);
      this.ctx.arc(enemy.x + 5, enemy.y - 5, 4, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawPlayer() {
    const player = this.gameState.player;
    
    this.ctx.fillStyle = '#3498db';
    this.ctx.beginPath();
    this.ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#2980b9';
    this.ctx.beginPath();
    this.ctx.arc(player.x, player.y + 5, player.radius - 5, 0, Math.PI, false);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(player.x - 5, player.y - 5, 4, 0, Math.PI * 2);
    this.ctx.arc(player.x + 5, player.y - 5, 4, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 140, 80);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Gems: ${this.gameState.gems}`, 20, 30);
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 50);
    
    this.ctx.fillStyle = 'rgba(155, 89, 182, 0.5)';
    this.ctx.fillRect(20, 65, 100, 10);
    this.ctx.fillStyle = '#9b59b6';
    this.ctx.fillRect(20, 65, this.gameState.player.super, 10);
    
    this.ctx.fillStyle = 'rgba(231, 76, 60, 0.5)';
    this.ctx.fillRect(this.canvas.width - 110, 10, 100, 15);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(this.canvas.width - 110, 10, 100 * (this.gameState.player.health / 100), 15);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BRAWL STARS', this.canvas.width / 2, 30);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Gems: ${this.gameState.gems}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
    this.ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 70);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.BrawlStarsGame = BrawlStarsGame;