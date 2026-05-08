// Horror Survival Game
class HorrorGame {
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
      sanity: 100,
      flashlight: 100,
      status: 'exploring',
      player: null,
      monster: null,
      collectibles: [],
      door: null,
      keys: 0,
      scared: false,
      scareTimer: 0,
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
      x: 100,
      y: 300,
      vx: 0,
      vy: 0,
      speed: 3,
      direction: 1,
      flashlightOn: true
    };
    
    this.gameState.monster = {
      x: 700,
      y: 300,
      speed: 1.5,
      state: 'hunting',
      visible: false,
      behind: false
    };
    
    this.gameState.door = { x: 720, y: 280, width: 40, height: 60, locked: true };
    
    this.gameState.collectibles = [
      { x: 250, y: 200, type: 'key', collected: false },
      { x: 400, y: 450, type: 'battery', collected: false },
      { x: 550, y: 150, type: 'key', collected: false },
      { x: 200, y: 400, type: 'potion', collected: false }
    ];
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
    this.updateMonster(deltaTime);
    this.checkCollisions();
    this.updateEffects(deltaTime);
  }
  
  updatePlayer(deltaTime) {
    const input = this.getPlayerInput(this.players[0]);
    const player = this.gameState.player;
    
    if (input.left) { player.vx = -player.speed; player.direction = -1; }
    else if (input.right) { player.vx = player.speed; player.direction = 1; }
    else { player.vx = 0; }
    
    if (input.up) player.vy = -player.speed;
    else if (input.down) player.vy = player.speed;
    else { player.vy = 0; }
    
    player.x += player.vx;
    player.y += player.vy;
    
    player.x = Math.max(50, Math.min(750, player.x));
    player.y = Math.max(50, Math.min(550, player.y));
    
    if (player.flashlightOn && this.gameState.flashlight > 0) {
      this.gameState.flashlight -= deltaTime * 2;
    }
  }
  
  updateMonster(deltaTime) {
    const player = this.gameState.player;
    const monster = this.gameState.monster;
    const dist = Math.abs(player.x - monster.x) + Math.abs(player.y - monster.y);
    
    if (Math.random() < 0.01) {
      monster.state = 'hunting';
    }
    
    if (monster.state === 'hunting') {
      if (dist > 150 || !player.flashlightOn || this.gameState.flashlight <= 0) {
        const dx = player.x - monster.x;
        const dy = player.y - monster.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        monster.x += (dx / length) * monster.speed;
        monster.y += (dy / length) * monster.speed;
      }
    } else {
      if (Math.random() < 0.005) {
        monster.x = 50 + Math.random() * 700;
        monster.y = 50 + Math.random() * 500;
      }
    }
    
    monster.visible = player.flashlightOn && this.gameState.flashlight > 0 && dist < 200;
    
    const lightAngle = player.direction === 1 ? 0 : Math.PI;
    const dx = monster.x - player.x;
    const dy = monster.y - player.y;
    const angleToMonster = Math.atan2(dy, dx);
    
    monster.behind = Math.abs(angleToMonster - lightAngle) > Math.PI / 3;
  }
  
  checkCollisions() {
    const player = this.gameState.player;
    const monster = this.gameState.monster;
    
    const dx = player.x - monster.x;
    const dy = player.y - monster.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 30 && !this.gameState.gameOver) {
      this.gameState.health -= 2;
      
      if (this.gameState.health <= 0) {
        this.gameState.gameOver = true;
      }
      
      this.gameState.scared = true;
      this.gameState.scareTimer = 2;
    }
    
    this.gameState.collectibles.forEach(item => {
      if (item.collected) return;
      
      const idx = Math.sqrt((player.x - item.x) ** 2 + (player.y - item.y) ** 2);
      
      if (idx < 30) {
        item.collected = true;
        
        if (item.type === 'key') {
          this.gameState.keys++;
        } else if (item.type === 'battery') {
          this.gameState.flashlight = 100;
        } else if (item.type === 'potion') {
          this.gameState.health = Math.min(100, this.gameState.health + 30);
          this.gameState.sanity = Math.min(100, this.gameState.sanity + 20);
        }
        
        this.gameState.score += 100;
      }
    });
    
    const door = this.gameState.door;
    const distToDoor = Math.sqrt((player.x - door.x) ** 2 + (player.y - door.y) ** 2);
    
    if (distToDoor < 40 && this.gameState.keys >= 2) {
      this.gameState.score += 1000;
      this.gameState.gameOver = true;
    }
  }
  
  updateEffects(deltaTime) {
    if (this.gameState.scareTimer > 0) {
      this.gameState.scareTimer -= deltaTime;
      
      if (this.gameState.scareTimer <= 0) {
        this.gameState.scared = false;
      }
    }
    
    if (this.gameState.health < 50 || this.gameState.sanity < 50) {
      this.gameState.sanity -= deltaTime * 0.5;
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (input.a) this.gameState.player.flashlightOn = !this.gameState.player.flashlightOn;
  }
  
  render() {
    this.drawBackground();
    this.drawRoom();
    this.drawCollectibles();
    this.drawPlayer();
    this.drawMonster();
    this.drawLighting();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawRoom() {
    this.ctx.fillStyle = '#2c2c2c';
    this.ctx.fillRect(50, 50, 700, 500);
    
    this.ctx.strokeStyle = '#3d3d3d';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(50, 50, 700, 500);
    
    this.ctx.fillStyle = '#3d3d3d';
    this.ctx.fillRect(180, 80, 80, 100);
    this.ctx.fillRect(180, 80, 40, 40);
    this.ctx.fillStyle = '#f39c12';
    this.ctx.fillRect(185, 85, 30, 30);
    
    this.ctx.fillStyle = '#3d3d3d';
    this.ctx.fillRect(450, 100, 120, 80);
    
    this.ctx.fillStyle = '#8b4513';
    const door = this.gameState.door;
    this.ctx.fillRect(door.x - 20, door.y - 30, 40, 60);
    
    this.ctx.fillStyle = this.gameState.keys >= 2 ? '#2ecc71' : '#e74c3c';
    this.ctx.beginPath();
    this.ctx.arc(door.x, door.y, 5, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#333';
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        this.ctx.fillRect(100 + i * 180, 400 + j * 30, 60, 20);
      }
    }
  }
  
  drawCollectibles() {
    this.gameState.collectibles.forEach(item => {
      if (item.collected) return;
      
      if (item.type === 'key') {
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.fillRect(item.x - 10, item.y, 20, 8);
        this.ctx.beginPath();
        this.ctx.arc(item.x - 10, item.y + 4, 6, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (item.type === 'battery') {
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.fillRect(item.x - 8, item.y - 12, 16, 24);
        this.ctx.fillStyle = '#27ae60';
        this.ctx.fillRect(item.x - 6, item.y - 14, 12, 4);
      } else if (item.type === 'potion') {
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.moveTo(item.x, item.y - 10);
        this.ctx.lineTo(item.x + 10, item.y + 10);
        this.ctx.lineTo(item.x - 10, item.y + 10);
        this.ctx.fill();
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText('+', item.x, item.y + 5);
      }
    });
  }
  
  drawPlayer() {
    const player = this.gameState.player;
    
    this.ctx.save();
    this.ctx.translate(player.x, player.y);
    this.ctx.scale(player.direction, 1);
    
    this.ctx.fillStyle = '#5d6d7e';
    this.ctx.fillRect(-12, -20, 24, 35);
    
    this.ctx.fillStyle = '#f5d0c5';
    this.ctx.beginPath();
    this.ctx.arc(0, -25, 10, 0, Math.PI * 2);
    this.ctx.fill();
    
    if (player.flashlightOn && this.gameState.flashlight > 0) {
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.fillRect(12, -15, 15, 8);
    }
    
    this.ctx.restore();
  }
  
  drawMonster() {
    const player = this.gameState.player;
    const monster = this.gameState.monster;
    
    if (monster.visible && !monster.behind) {
      this.ctx.fillStyle = '#0a0a0a';
      this.ctx.fillRect(monster.x - 20, monster.y - 30, 40, 50);
      
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.beginPath();
      this.ctx.arc(monster.x - 8, monster.y - 20, 4, 0, Math.PI * 2);
      this.ctx.arc(monster.x + 8, monster.y - 20, 4, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.beginPath();
      this.ctx.arc(monster.x - 8, monster.y - 20, 2, 0, Math.PI * 2);
      this.ctx.arc(monster.x + 8, monster.y - 20, 2, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  
  drawLighting() {
    const player = this.gameState.player;
    
    if (player.flashlightOn && this.gameState.flashlight > 0) {
      const gradient = this.ctx.createRadialGradient(player.x, player.y, 30, player.x, player.y, 150);
      gradient.addColorStop(0, 'rgba(255, 244, 179, 0.4)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    if (this.gameState.scared) {
      this.ctx.fillStyle = `rgba(139, 0, 0, ${this.gameState.scareTimer / 2})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, 10, 130, 70);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Health: ${Math.floor(this.gameState.health)}%`, 20, 30);
    this.ctx.fillText(`Sanity: ${Math.floor(this.gameState.sanity)}%`, 20, 50);
    this.ctx.fillText(`Keys: ${this.gameState.keys}/2`, 20, 70);
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, this.canvas.height - 40, 120, 30);
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(15, this.canvas.height - 35, 110, 8);
    this.ctx.fillStyle = this.gameState.flashlight > 30 ? '#f1c40f' : '#e74c3c';
    this.ctx.fillRect(15, this.canvas.height - 35, 110 * (this.gameState.flashlight / 100), 8);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('HORROR NIGHT', this.canvas.width / 2, 25);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const escaped = this.gameState.keys >= 2;
    
    this.ctx.fillStyle = escaped ? '#2ecc71' : '#e74c3c';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', this.canvas.width / 2, this.canvas.height / 2 - 20);
    
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

window.HorrorGame = HorrorGame;