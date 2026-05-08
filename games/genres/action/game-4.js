// Beat 'Em Up Action Game
class BeatEmUpGame {
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
      combo: 0,
      status: 'playing',
      player: null,
      enemies: [],
      items: [],
      particles: [],
      cameraX: 0,
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
      x: 200,
      y: 350,
      width: 40,
      height: 80,
      vx: 0,
      vy: 0,
      speed: 3,
      health: 100,
      maxHealth: 100,
      state: 'idle',
      facing: 1,
      attackCooldown: 0,
      comboCount: 0,
      invulnerable: 0
    };
    
    this.spawnEnemyWave();
  }
  
  spawnEnemyWave() {
    const count = 3 + Math.floor(this.gameState.score / 500);
    
    for (let i = 0; i < count; i++) {
      this.gameState.enemies.push({
        x: 500 + Math.random() * 300,
        y: 280 + Math.random() * 100,
        width: 35,
        height: 70,
        vx: 0,
        vy: 0,
        speed: 1.5,
        health: 30 + this.gameState.score / 50,
        maxHealth: 30,
        state: 'idle',
        attackCooldown: 0,
        hitStun: 0,
        type: ['thug', 'biker', 'boxer'][Math.floor(Math.random() * 3)]
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
    
    this.updatePlayer(deltaTime);
    this.updateEnemies(deltaTime);
    this.checkCollisions();
    this.updateParticles(deltaTime);
    this.spawnItems();
    
    if (this.gameState.enemies.length === 0) {
      this.spawnEnemyWave();
    }
  }
  
  updatePlayer(deltaTime) {
    const input = this.getPlayerInput(this.players[0]);
    const player = this.gameState.player;
    
    if (player.invulnerable > 0) player.invulnerable -= deltaTime;
    
    let vx = 0;
    let vy = 0;
    
    if (input.left) { vx = -player.speed; player.facing = -1; }
    if (input.right) { vx = player.speed; player.facing = 1; }
    if (input.up) vy = -player.speed * 0.7;
    if (input.down) vy = player.speed * 0.7;
    
    player.x += vx;
    player.y += vy;
    
    player.x = Math.max(50, Math.min(this.canvas.width - 50, player.x));
    player.y = Math.max(250, Math.min(450, player.y));
    
    if (player.attackCooldown > 0) {
      player.attackCooldown -= deltaTime;
    }
    
    if (input.action && player.attackCooldown <= 0) {
      this.playerAttack();
    }
    
    if (vx !== 0 || vy !== 0) {
      player.state = 'walking';
    } else {
      player.state = 'idle';
    }
    
    if (this.gameState.combo > 0) this.gameState.combo = Math.max(0, this.gameState.combo - deltaTime);
  }
  
  playerAttack() {
    const player = this.gameState.player;
    
    player.state = 'attacking';
    player.attackCooldown = 0.4;
    player.comboCount++;
    
    this.gameState.enemies.forEach(enemy => {
      const dx = enemy.x - player.x;
      const dy = Math.abs(enemy.y - player.y);
      
      if (Math.abs(dx) < 60 && dy < 40) {
        const damage = 10 + player.comboCount * 2;
        
        enemy.health -= damage;
        enemy.hitStun = 0.3;
        enemy.x += player.facing * 30;
        
        this.gameState.combo = 1;
        this.gameState.score += damage;
        
        this.createParticles(enemy.x, enemy.y, '#e74c3c', 8);
      }
    });
    
    setTimeout(() => {
      if (player.state === 'attacking') player.state = 'idle';
    }, 200);
  }
  
  updateEnemies(deltaTime) {
    const player = this.gameState.player;
    
    this.gameState.enemies.forEach(enemy => {
      if (enemy.hitStun > 0) {
        enemy.hitStun -= deltaTime;
        enemy.state = 'stunned';
        return;
      }
      
      enemy.state = 'idle';
      
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 60) {
        enemy.x += (dx / dist) * enemy.speed;
        enemy.y += (dy / dist) * enemy.speed * 0.3;
      } else if (enemy.attackCooldown <= 0) {
        this.enemyAttack(enemy);
      }
      
      if (enemy.attackCooldown > 0) enemy.attackCooldown -= deltaTime;
      
      enemy.x = Math.max(100, Math.min(this.canvas.width - 100, enemy.x));
      enemy.y = Math.max(280, Math.min(450, enemy.y));
    });
    
    this.gameState.enemies = this.gameState.enemies.filter(e => e.health > 0);
  }
  
  enemyAttack(enemy) {
    const player = this.gameState.player;
    
    if (player.invulnerable <= 0) {
      enemy.state = 'attacking';
      enemy.attackCooldown = 1;
      
      player.health -= 10;
      player.invulnerable = 0.5;
      this.gameState.combo = 0;
      player.comboCount = 0;
      
      this.createParticles(player.x, player.y, '#e74c3c', 10);
      
      if (player.health <= 0) {
        this.gameState.gameOver = true;
      }
    }
  }
  
  spawnItems() {
    if (Math.random() < 0.003 && this.gameState.enemies.length > 0) {
      const enemy = this.gameState.enemies[Math.floor(Math.random() * this.gameState.enemies.length)];
      
      this.gameState.items.push({
        x: enemy.x,
        y: enemy.y,
        type: ['health', 'power', 'score'][Math.floor(Math.random() * 3)],
        vy: -3,
        width: 20,
        height: 20
      });
    }
    
    this.gameState.items.forEach(item => item.vy += 0.1);
    this.gameState.items = this.gameState.items.filter(item => item.y < 500);
  }
  
  checkCollisions() {
    const player = this.gameState.player;
    
    this.gameState.items.forEach(item => {
      const dx = player.x - item.x;
      const dy = player.y - item.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 40) {
        if (item.type === 'health') {
          player.health = Math.min(100, player.health + 25);
        } else if (item.type === 'power') {
          player.comboCount = Math.min(10, player.comboCount + 3);
        } else if (item.type === 'score') {
          this.gameState.score += 200;
        }
        
        this.createParticles(item.x, item.y, '#2ecc71', 5);
        item.y = 600;
      }
    });
  }
  
  createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      this.gameState.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        color,
        size: 3 + Math.random() * 4
      });
    }
  }
  
  updateParticles(deltaTime) {
    this.gameState.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 5 * deltaTime;
      p.life -= deltaTime * 2;
    });
    this.gameState.particles = this.gameState.particles.filter(p => p.life > 0);
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.drawBackground();
    this.drawFloor();
    this.drawItems();
    this.drawEnemies();
    this.drawPlayer();
    this.drawParticles();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f0f23');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#2d2d44';
    for (let x = 0; x < this.canvas.width; x += 100) {
      this.ctx.fillRect(x, 100, 80, 150);
    }
    
    this.ctx.fillStyle = '#252538';
    this.ctx.fillRect(0, 50, 60, 250);
    this.ctx.fillRect(this.canvas.width - 60, 50, 60, 250);
  }
  
  drawFloor() {
    const gradient = this.ctx.createLinearGradient(0, 240, 0, 480);
    gradient.addColorStop(0, '#3d3d5c');
    gradient.addColorStop(1, '#2a2a40');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 240, this.canvas.width, 240);
    
    this.ctx.strokeStyle = '#4a4a6a';
    this.ctx.lineWidth = 2;
    for (let x = 0; x < this.canvas.width; x += 80) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 240);
      this.ctx.lineTo(x, 480);
      this.ctx.stroke();
    }
  }
  
  drawPlayer() {
    const player = this.gameState.player;
    
    if (player.invulnerable > 0 && Math.floor(this.gameState.time * 15) % 2 === 0) return;
    
    this.ctx.save();
    this.ctx.translate(player.x, player.y);
    this.ctx.scale(player.facing, 1);
    
    const colors = { idle: '#3498db', walking: '#2980b9', attacking: '#e74c3c', stunned: '#95a5a6' };
    this.ctx.fillStyle = colors[player.state] || '#3498db';
    this.ctx.fillRect(-20, 0, 40, 60);
    
    this.ctx.fillStyle = '#f5d0c5';
    this.ctx.beginPath();
    this.ctx.arc(0, -15, 15, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(-8, -20, 6, 4);
    this.ctx.fillRect(2, -20, 6, 4);
    
    if (player.state === 'attacking') {
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(15, 10, 25, 10);
    }
    
    this.ctx.fillStyle = '#2980b9';
    this.ctx.fillRect(-15, 55, 12, 25);
    this.ctx.fillRect(3, 55, 12, 25);
    
    this.ctx.restore();
  }
  
  drawEnemies() {
    this.gameState.enemies.forEach(enemy => {
      this.ctx.save();
      this.ctx.translate(enemy.x, enemy.y);
      
      const facing = player ? (player.x > enemy.x ? 1 : -1) : 1;
      this.ctx.scale(facing, 1);
      
      const colors = { idle: '#e74c3c', attacking: '#c0392b', stunned: '#7f8c8d' };
      this.ctx.fillStyle = colors[enemy.state] || '#e74c3c';
      this.ctx.fillRect(-17, 0, 35, 55);
      
      this.ctx.fillStyle = '#8d6e63';
      this.ctx.beginPath();
      this.ctx.arc(0, -12, 12, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.fillRect(-5, -15, 4, 4);
      this.ctx.fillRect(2, -15, 4, 4);
      
      this.ctx.fillStyle = '#c0392b';
      this.ctx.fillRect(-17, 50, 35, 5);
      this.ctx.fillStyle = '#2ecc71';
      this.ctx.fillRect(-17, 50, 35 * (enemy.health / enemy.maxHealth), 5);
      
      this.ctx.restore();
    });
    
    var player = this.gameState.player;
  }
  
  drawItems() {
    const itemColors = { health: '#e74c3c', power: '#f1c40f', score: '#2ecc71' };
    const itemIcons = { health: '♥', power: '⚡', score: '$' };
    
    this.gameState.items.forEach(item => {
      this.ctx.fillStyle = itemColors[item.type];
      this.ctx.beginPath();
      this.ctx.arc(item.x, item.y, 15, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(itemIcons[item.type], item.x, item.y + 5);
    });
  }
  
  drawParticles() {
    this.gameState.particles.forEach(p => {
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 130, 60);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(15, 40, 110, 10);
    this.ctx.fillStyle = player => player.health > 30 ? '#e74c3c' : '#e74c3c';
    this.ctx.fillRect(15, 40, 110 * (this.gameState.player.health / 100), 10);
    
    if (this.gameState.combo > 0) {
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.font = 'bold 18px Arial';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(`COMBO x${this.gameState.player.comboCount}`, this.canvas.width - 20, 30);
    }
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BEAT EM UP', this.canvas.width / 2, 25);
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
    this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

var player;

window.BeatEmUpGame = BeatEmUpGame;