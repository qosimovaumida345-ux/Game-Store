// Action Adventure Game
class ActionAdventureGame {
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
      mana: 100,
      status: 'exploring',
      player: null,
      enemies: [],
      items: [],
      traps: [],
      boss: null,
      world: { width: 2000, height: 1500 },
      camera: { x: 0, y: 0 },
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
      y: 200,
      vx: 0,
      vy: 0,
      width: 30,
      height: 40,
      jumping: false,
      facing: 1,
      attackCooldown: 0,
      sword: false
    };
    
    this.generateWorld();
  }
  
  generateWorld() {
    for (let i = 0; i < 15; i++) {
      this.gameState.enemies.push({
        x: 400 + Math.random() * 1500,
        y: 200 + Math.random() * 1000,
        width: 30,
        height: 35,
        health: 30,
        speed: 1.5,
        patrol: { startX: 0, endX: 100, direction: 1 }
      });
    }
    
    for (let i = 0; i < 20; i++) {
      this.gameState.items.push({
        x: 100 + Math.random() * 1800,
        y: 100 + Math.random() * 1300,
        type: ['potion', 'sword', 'shield', 'coin'][Math.floor(Math.random() * 4)],
        collected: false
      });
    }
    
    this.gameState.boss = {
      x: 1800,
      y: 700,
      width: 80,
      height: 100,
      health: 200,
      maxHealth: 200,
      phase: 1,
      attacking: false
    };
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
    this.updateBoss(deltaTime);
    this.checkCollisions();
    this.updateCamera();
  }
  
  updatePlayer(deltaTime) {
    const input = this.getPlayerInput(this.players[0]);
    const player = this.gameState.player;
    const gravity = 0.6;
    const friction = 0.85;
    
    if (input.left) {
      player.vx -= 1;
      player.facing = -1;
    }
    if (input.right) {
      player.vx += 1;
      player.facing = 1;
    }
    
    player.vx = Math.max(-6, Math.min(6, player.vx));
    player.vx *= friction;
    
    if (input.up && !player.jumping) {
      player.vy = -12;
      player.jumping = true;
    }
    
    player.vy += gravity;
    
    player.x += player.vx;
    player.y += player.vy;
    
    player.x = Math.max(20, Math.min(this.gameState.world.width - 20, player.x));
    
    if (player.y > 1400) {
      player.y = 1400;
      player.vy = 0;
      player.jumping = false;
    }
    
    if (player.attackCooldown > 0) player.attackCooldown -= deltaTime;
  }
  
  attack() {
    const player = this.gameState.player;
    
    if (player.attackCooldown > 0 || !player.sword) return;
    
    player.attackCooldown = 0.5;
    
    this.gameState.enemies.forEach(enemy => {
      const dx = enemy.x - player.x;
      const dy = Math.abs(enemy.y - player.y);
      
      if (Math.abs(dx) < 60 && dy < 40) {
        enemy.health -= 15;
        enemy.x += player.facing * 20;
      }
    });
    
    if (this.gameState.boss.health > 0) {
      const dx = this.gameState.boss.x - player.x;
      const dy = Math.abs(this.gameState.boss.y - player.y);
      
      if (Math.abs(dx) < 100 && dy < 60) {
        this.gameState.boss.health -= 15;
      }
    }
  }
  
  updateEnemies(deltaTime) {
    this.gameState.enemies = this.gameState.enemies.filter(enemy => {
      if (enemy.health <= 0) {
        this.gameState.score += 100;
        return false;
      }
      
      const player = this.gameState.player;
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 40) {
        this.gameState.health -= 0.5;
        
        if (this.gameState.health <= 0) {
          this.gameState.gameOver = true;
        }
      } else if (dist < 200) {
        enemy.x += (dx / dist) * enemy.speed;
        enemy.y += (dy / dist) * enemy.speed;
      }
      
      return true;
    });
  }
  
  updateBoss(deltaTime) {
    const boss = this.gameState.boss;
    const player = this.gameState.player;
    
    if (boss.health <= 0) {
      this.gameState.score += 1000;
      this.gameState.gameOver = true;
      return;
    }
    
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 150) {
      this.gameState.health -= 1;
      
      if (this.gameState.health <= 0) {
        this.gameState.gameOver = true;
      }
    } else {
      boss.x += (dx / dist) * 1.5;
      boss.y += (dy / dist) * 1.5;
    }
  }
  
  checkCollisions() {
    const player = this.gameState.player;
    
    this.gameState.items.forEach(item => {
      if (item.collected) return;
      
      const dx = player.x - item.x;
      const dy = player.y - item.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 30) {
        item.collected = true;
        this.gameState.score += 50;
        
        if (item.type === 'potion') {
          this.gameState.health = Math.min(100, this.gameState.health + 25);
        } else if (item.type === 'sword') {
          player.sword = true;
        } else if (item.type === 'shield') {
          this.gameState.health = Math.min(100, this.gameState.health + 50);
        }
      }
    });
  }
  
  updateCamera() {
    const player = this.gameState.player;
    const targetX = player.x - this.canvas.width / 2;
    const targetY = player.y - this.canvas.height / 2;
    
    this.gameState.camera.x += (targetX - this.gameState.camera.x) * 0.1;
    this.gameState.camera.y += (targetY - this.gameState.camera.y) * 0.1;
    
    this.gameState.camera.x = Math.max(0, Math.min(this.gameState.world.width - this.canvas.width, this.gameState.camera.x));
    this.gameState.camera.y = Math.max(0, Math.min(this.gameState.world.height - this.canvas.height, this.gameState.camera.y));
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (input.action && this.gameState.player.sword) this.attack();
  }
  
  render() {
    this.drawBackground();
    this.drawWorld();
    this.drawEntities();
    this.drawPlayer();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    this.ctx.fillStyle = '#27ae60';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawWorld() {
    const cam = this.gameState.camera;
    
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(-cam.x, -cam.y + 1400, this.gameState.world.width, 100);
  }
  
  drawEntities() {
    const cam = this.gameState.camera;
    
    this.gameState.items.forEach(item => {
      if (item.collected) return;
      
      const colors = { potion: '#e74c3c', sword: '#95a5a6', shield: '#3498db', coin: '#f1c40f' };
      
      this.ctx.fillStyle = colors[item.type];
      this.ctx.beginPath();
      this.ctx.arc(item.x - cam.x, item.y - cam.y, 10, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    this.gameState.enemies.forEach(enemy => {
      this.ctx.fillStyle = '#c0392b';
      this.ctx.fillRect(enemy.x - 15 - cam.x, enemy.y - 35 - cam.y, 30, 35);
    });
    
    const boss = this.gameState.boss;
    this.ctx.fillStyle = '#8e44ad';
    this.ctx.fillRect(boss.x - 40 - cam.x, boss.y - 50 - cam.y, 80, 100);
  }
  
  drawPlayer() {
    const player = this.gameState.player;
    const cam = this.gameState.camera;
    
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillRect(player.x - 15 - cam.x, player.y - 40 - cam.y, 30, 40);
    
    this.ctx.fillStyle = '#f5d0c5';
    this.ctx.beginPath();
    this.ctx.arc(player.x - cam.x, player.y - 50 - cam.y, 12, 0, Math.PI * 2);
    this.ctx.fill();
    
    if (player.sword) {
      this.ctx.fillStyle = '#bdc3c7';
      const swordX = player.x + player.facing * 15 - cam.x;
      this.ctx.fillRect(swordX, player.y - 35 - cam.y, 4, 30);
    }
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 130, 70);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 30);
    this.ctx.fillText(`Health: ${Math.floor(this.gameState.health)}%`, 20, 50);
    this.ctx.fillText(`Mana: ${Math.floor(this.gameState.mana)}%`, 20, 70);
    
    this.ctx.fillStyle = 'rgba(231, 76, 60, 0.5)';
    this.ctx.fillRect(this.canvas.width - 110, 10, 100, 15);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(this.canvas.width - 110, 10, 100 * (this.gameState.health / 100), 15);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('ADVENTURE QUEST', this.canvas.width / 2, 25);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = this.gameState.boss.health <= 0 ? '#2ecc71' : '#e74c3c';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.gameState.boss.health <= 0 ? 'VICTORY!' : 'GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.ActionAdventureGame = ActionAdventureGame;