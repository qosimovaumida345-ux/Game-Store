// Dungeon Quest - RPG Adventure Game
class DungeonQuestGame {
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
      level: 1,
      score: 0,
      status: 'playing',
      hero: null,
      enemies: [],
      treasure: [],
      potions: [],
      stairs: null,
      map: [],
      mapWidth: 20,
      mapHeight: 15,
      cellSize: 40,
      fog: []
    };
    
    this.generateDungeon();
    this.initHero();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  generateDungeon() {
    const { mapWidth, mapHeight, cellSize } = this.gameState;
    this.gameState.map = Array(mapHeight).fill(null).map(() => Array(mapWidth).fill('wall'));
    
    // Generate rooms
    const rooms = [];
    for (let i = 0; i < 8; i++) {
      const w = Math.floor(Math.random() * 4) + 3;
      const h = Math.floor(Math.random() * 3) + 2;
      const x = Math.floor(Math.random() * (mapWidth - w - 2)) + 1;
      const y = Math.floor(Math.random() * (mapHeight - h - 2)) + 1;
      rooms.push({ x, y, w, h });
    }
    
    // Carve rooms
    rooms.forEach(room => {
      for (let y = room.y; y < room.y + room.h; y++) {
        for (let x = room.x; x < room.x + room.w; x++) {
          this.gameState.map[y][x] = 'floor';
        }
      }
    });
    
    // Connect rooms
    for (let i = 0; i < rooms.length - 1; i++) {
      const r1 = rooms[i];
      const r2 = rooms[i + 1];
      const x1 = Math.floor(r1.x + r1.w / 2);
      const y1 = Math.floor(r1.y + r1.h / 2);
      const x2 = Math.floor(r2.x + r2.w / 2);
      const y2 = Math.floor(r2.y + r2.h / 2);
      
      let x = x1, y = y1;
      while (x !== x2) {
        this.gameState.map[y][x] = 'floor';
        x += x2 > x ? 1 : -1;
      }
      while (y !== y2) {
        this.gameState.map[y][x] = 'floor';
        y += y2 > y ? 1 : -1;
      }
    }
    
    // Place stairs
    const lastRoom = rooms[rooms.length - 1];
    this.gameState.stairs = {
      x: Math.floor(lastRoom.x + lastRoom.w / 2),
      y: Math.floor(lastRoom.y + lastRoom.h / 2)
    };
    
    // Place enemies
    this.gameState.enemies = [];
    rooms.slice(0, -1).forEach(room => {
      for (let i = 0; i < 2; i++) {
        this.gameState.enemies.push({
          x: Math.floor(room.x + Math.random() * room.w),
          y: Math.floor(room.y + Math.random() * room.h),
          hp: 20,
          damage: 5,
          type: ['skeleton', 'goblin', 'orc'][Math.floor(Math.random() * 3)]
        });
      }
    });
    
    // Place treasure
    this.gameState.treasure = [];
    rooms.slice(0, -1).forEach(room => {
      if (Math.random() > 0.5) {
        this.gameState.treasure.push({
          x: Math.floor(room.x + Math.random() * room.w),
          y: Math.floor(room.y + Math.random() * room.h),
          value: Math.floor(Math.random() * 50) + 10
        });
      }
    });
    
    // Place potions
    this.gameState.potions = [];
    rooms.forEach(room => {
      if (Math.random() > 0.7) {
        this.gameState.potions.push({
          x: Math.floor(room.x + Math.random() * room.w),
          y: Math.floor(room.y + Math.random() * room.h)
        });
      }
    });
    
    // Generate fog of war
    this.gameState.fog = Array(mapHeight).fill(null).map(() => Array(mapWidth).fill(true));
  }
  
  initHero() {
    const firstRoom = { x: 1, y: 1 };
    this.gameState.hero = {
      name: this.players[0] || 'Hero',
      x: firstRoom.x,
      y: firstRoom.y,
      hp: 100,
      maxHp: 100,
      attack: 10,
      defense: 5,
      gold: 0,
      level: 1,
      xp: 0,
      xpToNext: 50
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
    this.gameState.time += deltaTime;
    
    const input = this.getPlayerInput();
    if (!input) return;
    
    const hero = this.gameState.hero;
    let newX = hero.x;
    let newY = hero.y;
    
    if (input.up) newY--;
    if (input.down) newY++;
    if (input.left) newX--;
    if (input.right) newX++;
    
    if (newX >= 0 && newX < this.gameState.mapWidth && 
        newY >= 0 && newY < this.gameState.mapHeight &&
        this.gameState.map[newY][newX] === 'floor') {
      
      // Check for enemy
      const enemyIdx = this.gameState.enemies.findIndex(e => e.x === newX && e.y === newY);
      if (enemyIdx >= 0) {
        this.attackEnemy(enemyIdx);
      } else {
        hero.x = newX;
        hero.y = newY;
      }
      
      // Check for treasure
      const treasureIdx = this.gameState.treasure.findIndex(t => t.x === newX && t.y === newY);
      if (treasureIdx >= 0) {
        hero.gold += this.gameState.treasure[treasureIdx].value;
        this.gameState.score += this.gameState.treasure[treasureIdx].value;
        this.gameState.treasure.splice(treasureIdx, 1);
      }
      
      // Check for potion
      const potionIdx = this.gameState.potions.findIndex(p => p.x === newX && p.y === newY);
      if (potionIdx >= 0) {
        hero.hp = Math.min(hero.maxHp, hero.hp + 30);
        this.gameState.potions.splice(potionIdx, 1);
      }
      
      // Check for stairs
      if (newX === this.gameState.stairs.x && newY === this.gameState.stairs.y) {
        this.nextLevel();
      }
    }
    
    // Update fog
    this.updateFog();
    
    // Check game over
    if (hero.hp <= 0) {
      this.gameState.status = 'gameover';
    }
  }
  
  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  attackEnemy(idx) {
    const hero = this.gameState.hero;
    const enemy = this.gameState.enemies[idx];
    
    const damage = Math.max(1, hero.attack - Math.floor(Math.random() * 3));
    enemy.hp -= damage;
    
    if (enemy.hp <= 0) {
      const xp = enemy.type === 'orc' ? 30 : enemy.type === 'goblin' ? 15 : 20;
      hero.xp += xp;
      
      if (hero.xp >= hero.xpToNext) {
        this.levelUp();
      }
      
      this.gameState.enemies.splice(idx, 1);
      this.gameState.score += 50;
    } else {
      hero.hp -= Math.max(1, enemy.damage - hero.defense);
    }
  }
  
  levelUp() {
    const hero = this.gameState.hero;
    hero.level++;
    hero.xp -= hero.xpToNext;
    hero.xpToNext = Math.floor(hero.xpToNext * 1.5);
    hero.maxHp += 20;
    hero.hp = hero.maxHp;
    hero.attack += 3;
    hero.defense += 2;
  }
  
  updateFog() {
    const { hero, mapWidth, mapHeight, fog } = this.gameState;
    const revealRadius = 3;
    
    for (let dy = -revealRadius; dy <= revealRadius; dy++) {
      for (let dx = -revealRadius; dx <= revealRadius; dx++) {
        const x = hero.x + dx;
        const y = hero.y + dy;
        if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
          if (dx * dx + dy * dy <= revealRadius * revealRadius) {
            fog[y][x] = false;
          }
        }
      }
    }
  }
  
  nextLevel() {
    this.gameState.level++;
    this.gameState.score += 100;
    this.generateDungeon();
    this.gameState.hero.x = 1;
    this.gameState.hero.y = 1;
    this.gameState.hero.hp = this.gameState.hero.maxHp;
  }
  
  render() {
    const { cellSize, map, fog, hero } = this.gameState;
    const offsetX = (this.canvas.width - this.gameState.mapWidth * cellSize) / 2;
    const offsetY = 80;
    
    // Background
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Map tiles
    for (let y = 0; y < this.gameState.mapHeight; y++) {
      for (let x = 0; x < this.gameState.mapWidth; x++) {
        if (fog[y][x]) continue;
        
        const tileX = offsetX + x * cellSize;
        const tileY = offsetY + y * cellSize;
        
        if (map[y][x] === 'wall') {
          this.ctx.fillStyle = '#4a4a4a';
          this.ctx.fillRect(tileX, tileY, cellSize, cellSize);
          this.ctx.strokeStyle = '#333';
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(tileX, tileY, cellSize, cellSize);
        } else {
          this.ctx.fillStyle = '#2d2d2d';
          this.ctx.fillRect(tileX, tileY, cellSize, cellSize);
        }
      }
    }
    
    // Stairs
    const stairs = this.gameState.stairs;
    if (!fog[stairs.y][stairs.x]) {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.beginPath();
      this.ctx.moveTo(offsetX + stairs.x * cellSize + cellSize / 2, offsetY + stairs.y * cellSize + 5);
      this.ctx.lineTo(offsetX + stairs.x * cellSize + 5, offsetY + stairs.y * cellSize + cellSize - 5);
      this.ctx.lineTo(offsetX + stairs.x * cellSize + cellSize - 5, offsetY + stairs.y * cellSize + cellSize - 5);
      this.ctx.fill();
    }
    
    // Treasure
    this.gameState.treasure.forEach(t => {
      if (!fog[t.y][t.x]) {
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(offsetX + t.x * cellSize + cellSize / 2, offsetY + t.y * cellSize + cellSize / 2, 10, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
    
    // Potions
    this.gameState.potions.forEach(p => {
      if (!fog[p.y][p.x]) {
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(offsetX + p.x * cellSize + 10, offsetY + p.y * cellSize + 10, cellSize - 20, cellSize - 20);
      }
    });
    
    // Enemies
    this.gameState.enemies.forEach(e => {
      if (!fog[e.y][e.x]) {
        const colors = { skeleton: '#CCCCCC', goblin: '#00AA00', orc: '#884400' };
        this.ctx.fillStyle = colors[e.type] || '#FF0000';
        this.ctx.fillRect(offsetX + e.x * cellSize + 8, offsetY + e.y * cellSize + 8, cellSize - 16, cellSize - 16);
        
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(offsetX + e.x * cellSize + 5, offsetY + e.y * cellSize - 5, (cellSize - 10) * (e.hp / 20), 4);
      }
    });
    
    // Hero
    this.ctx.fillStyle = '#00AAFF';
    this.ctx.beginPath();
    this.ctx.arc(offsetX + hero.x * cellSize + cellSize / 2, offsetY + hero.y * cellSize + cellSize / 2, cellSize / 2 - 5, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('H', offsetX + hero.x * cellSize + cellSize / 2, offsetY + hero.y * cellSize + cellSize / 2 + 5);
    
    this.drawUI(offsetX, offsetY);
    
    if (this.gameState.status === 'gameover') {
      this.drawGameOver();
    }
  }
  
  drawUI(offsetX, offsetY) {
    const hero = this.gameState.hero;
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, 10, 250, 100);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Level: ${hero.level}`, 20, 35);
    this.ctx.fillText(`XP: ${hero.xp}/${hero.xpToNext}`, 20, 55);
    this.ctx.fillText(`Gold: ${hero.gold}`, 20, 75);
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 95);
    
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fillRect(10, this.canvas.height - 40, 200, 20);
    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillRect(10, this.canvas.height - 40, 200 * (hero.hp / hero.maxHp), 20);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px Arial';
    this.ctx.fillText(`HP: ${hero.hp}/${hero.maxHp}`, 15, this.canvas.height - 26);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Dungeon Level ${this.gameState.level}`, this.canvas.width / 2, 30);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ff0000';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Level Reached: ${this.gameState.level}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 60);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.DungeonQuestGame = DungeonQuestGame;