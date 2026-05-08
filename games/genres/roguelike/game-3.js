// Dungeon Crawler Roguelike
class DungeonCrawlerGame {
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
      floor: 1,
      health: 100,
      maxHealth: 100,
      mana: 50,
      maxMana: 50,
      gold: 0,
      status: 'exploring',
      player: null,
      enemies: [],
      items: [],
      stairs: null,
      map: [],
      rooms: [],
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
      x: 0,
      y: 0,
      level: 1,
      xp: 0,
      xpToNext: 100,
      equipment: { weapon: null, armor: null },
      inventory: []
    };
    
    this.generateDungeon();
  }
  
  generateDungeon() {
    this.gameState.map = [];
    for (let y = 0; y < 20; y++) {
      this.gameState.map.push(new Array(30).fill('#'));
    }
    
    this.gameState.rooms = [];
    const numRooms = 6 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numRooms; i++) {
      const room = {
        x: 2 + Math.floor(Math.random() * 20),
        y: 2 + Math.floor(Math.random() * 12),
        w: 4 + Math.floor(Math.random() * 6),
        h: 4 + Math.floor(Math.random() * 5)
      };
      
      if (this.isValidRoom(room)) {
        this.carveRoom(room);
        this.gameState.rooms.push(room);
      }
    }
    
    this.connectRooms();
    
    const startRoom = this.gameState.rooms[0];
    this.gameState.player.x = startRoom.x + Math.floor(startRoom.w / 2);
    this.gameState.player.y = startRoom.y + Math.floor(startRoom.h / 2);
    
    const endRoom = this.gameState.rooms[this.gameState.rooms.length - 1];
    this.gameState.stairs = {
      x: endRoom.x + Math.floor(endRoom.w / 2),
      y: endRoom.y + Math.floor(endRoom.h / 2)
    };
    
    this.spawnEnemies();
    this.spawnItems();
  }
  
  isValidRoom(room) {
    return room.x + room.w < 28 && room.y + room.h < 18;
  }
  
  carveRoom(room) {
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) {
        this.gameState.map[y][x] = '.';
      }
    }
  }
  
  connectRooms() {
    for (let i = 0; i < this.gameState.rooms.length - 1; i++) {
      const r1 = this.gameState.rooms[i];
      const r2 = this.gameState.rooms[i + 1];
      
      const x1 = r1.x + Math.floor(r1.w / 2);
      const y1 = r1.y + Math.floor(r1.h / 2);
      const x2 = r2.x + Math.floor(r2.w / 2);
      const y2 = r2.y + Math.floor(r2.h / 2);
      
      this.carveTunnel(x1, y1, x2, y2);
    }
  }
  
  carveTunnel(x1, y1, x2, y2) {
    let x = x1, y = y1;
    
    while (x !== x2) {
      if (y >= 0 && y < 20 && x >= 0 && x < 30) {
        this.gameState.map[y][x] = '.';
      }
      x += x < x2 ? 1 : -1;
    }
    
    while (y !== y2) {
      if (y >= 0 && y < 20 && x >= 0 && x < 30) {
        this.gameState.map[y][x] = '.';
      }
      y += y < y2 ? 1 : -1;
    }
  }
  
  spawnEnemies() {
    const enemies = ['Goblin', 'Skeleton', 'Orc', 'Slime'];
    
    this.gameState.rooms.slice(1).forEach(room => {
      if (Math.random() < 0.7) {
        this.gameState.enemies.push({
          x: room.x + Math.floor(Math.random() * room.w),
          y: room.y + Math.floor(Math.random() * room.h),
          name: enemies[Math.floor(Math.random() * enemies.length)],
          health: 20 + this.gameState.floor * 5,
          maxHealth: 20 + this.gameState.floor * 5,
          attack: 5 + this.gameState.floor * 2,
          xp: 20 + this.gameState.floor * 5
        });
      }
    });
  }
  
  spawnItems() {
    const items = [
      { name: 'Health Potion', type: 'potion', effect: 30 },
      { name: 'Mana Potion', type: 'mana', effect: 20 },
      { name: 'Gold Coin', type: 'gold', effect: 10 },
      { name: 'Iron Sword', type: 'weapon', effect: 5 },
      { name: 'Leather Armor', type: 'armor', effect: 3 }
    ];
    
    this.gameState.rooms.forEach((room, i) => {
      if (i > 0 && Math.random() < 0.4) {
        const item = items[Math.floor(Math.random() * items.length)];
        this.gameState.items.push({
          x: room.x + Math.floor(Math.random() * room.w),
          y: room.y + Math.floor(Math.random() * room.h),
          ...item
        });
      }
    });
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
  }
  
  movePlayer(dx, dy) {
    const player = this.gameState.player;
    const newX = player.x + dx;
    const newY = player.y + dy;
    
    if (newX < 0 || newX >= 30 || newY < 0 || newY >= 20) return;
    if (this.gameState.map[newY][newX] === '#') return;
    
    player.x = newX;
    player.y = newY;
    
    this.checkCollisions();
  }
  
  checkCollisions() {
    const player = this.gameState.player;
    
    this.gameState.enemies.forEach(enemy => {
      if (enemy.x === player.x && enemy.y === player.y) {
        this.combat(enemy);
      }
    });
    
    this.gameState.items = this.gameState.items.filter(item => {
      if (item.x === player.x && item.y === player.y) {
        this.pickupItem(item);
        return false;
      }
      return true;
    });
    
    if (this.gameState.stairs && player.x === this.gameState.stairs.x && player.y === this.gameState.stairs.y) {
      this.nextFloor();
    }
  }
  
  combat(enemy) {
    const player = this.gameState.player;
    const weaponBonus = player.equipment.weapon ? player.equipment.weapon.effect : 0;
    const armorBonus = player.equipment.armor ? player.equipment.armor.effect : 0;
    
    const damage = Math.max(1, enemy.attack - armorBonus);
    this.gameState.health -= damage;
    
    this.gameState.enemies = this.gameState.enemies.filter(e => {
      const playerDamage = 10 + player.level * 2 + weaponBonus;
      e.health -= playerDamage;
      
      if (e.health <= 0) {
        this.gameState.score += e.xp;
        player.xp += e.xp;
        return false;
      }
      return true;
    });
    
    if (this.gameState.health <= 0) {
      this.gameState.gameOver = true;
    }
  }
  
  pickupItem(item) {
    if (item.type === 'potion') {
      this.gameState.health = Math.min(this.gameState.maxHealth, this.gameState.health + item.effect);
    } else if (item.type === 'mana') {
      this.gameState.mana = Math.min(this.gameState.maxMana, this.gameState.mana + item.effect);
    } else if (item.type === 'gold') {
      this.gameState.gold += item.effect;
    } else if (item.type === 'weapon') {
      this.gameState.player.equipment.weapon = item;
    } else if (item.type === 'armor') {
      this.gameState.player.equipment.armor = item;
    }
    
    this.gameState.score += 50;
  }
  
  nextFloor() {
    this.gameState.floor++;
    this.gameState.enemies = [];
    this.gameState.items = [];
    this.generateDungeon();
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (input.up) this.movePlayer(0, -1);
    if (input.down) this.movePlayer(0, 1);
    if (input.left) this.movePlayer(-1, 0);
    if (input.right) this.movePlayer(1, 0);
  }
  
  render() {
    this.drawBackground();
    this.drawMap();
    this.drawEntities();
    this.drawPlayer();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawMap() {
    const cellSize = 24;
    const offsetX = 30;
    const offsetY = 50;
    
    this.gameState.map.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === '#') {
          this.ctx.fillStyle = '#333';
          this.ctx.fillRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize, cellSize);
        } else {
          this.ctx.fillStyle = '#2d2d2d';
          this.ctx.fillRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize, cellSize);
          
          this.ctx.strokeStyle = '#3d3d3d';
          this.ctx.strokeRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize, cellSize);
        }
      });
    });
    
    if (this.gameState.stairs) {
      this.ctx.fillStyle = '#f1c40f';
      const sx = offsetX + this.gameState.stairs.x * cellSize + cellSize/2;
      const sy = offsetY + this.gameState.stairs.y * cellSize + cellSize/2;
      this.ctx.beginPath();
      this.ctx.arc(sx, sy, 8, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#000';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('>', sx, sy + 4);
    }
  }
  
  drawEntities() {
    const cellSize = 24;
    const offsetX = 30;
    const offsetY = 50;
    
    this.gameState.items.forEach(item => {
      const x = offsetX + item.x * cellSize + cellSize/2;
      const y = offsetY + item.y * cellSize + cellSize/2;
      
      const colors = { potion: '#e74c3c', mana: '#3498db', gold: '#f1c40f', weapon: '#95a5a6', armor: '#9b59b6' };
      this.ctx.fillStyle = colors[item.type];
      this.ctx.beginPath();
      this.ctx.arc(x, y, 6, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    this.gameState.enemies.forEach(enemy => {
      const x = offsetX + enemy.x * cellSize + cellSize/2;
      const y = offsetY + enemy.y * cellSize + cellSize/2;
      
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(x - 8, y - 8, 16, 16);
    });
  }
  
  drawPlayer() {
    const player = this.gameState.player;
    const cellSize = 24;
    const offsetX = 30;
    const offsetY = 50;
    
    const x = offsetX + player.x * cellSize + cellSize/2;
    const y = offsetY + player.y * cellSize + cellSize/2;
    
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 10, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#27ae60';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 6, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, 10, 130, 70);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Floor: ${this.gameState.floor}`, 20, 30);
    this.ctx.fillText(`HP: ${this.gameState.health}/${this.gameState.maxHealth}`, 20, 48);
    this.ctx.fillText(`MP: ${this.gameState.mana}/${this.gameState.maxMana}`, 20, 66);
    this.ctx.fillText(`Gold: ${this.gameState.gold}`, 100, 66);
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(this.canvas.width - 120, 10, 110, 50);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px Arial';
    this.ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width - 110, 30);
    this.ctx.fillText(`Lvl: ${this.gameState.player.level}`, this.canvas.width - 110, 50);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('DUNGEON CRAWLER', this.canvas.width / 2, 25);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Floor Reached: ${this.gameState.floor}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
    this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 60);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.DungeonCrawlerGame = DungeonCrawlerGame;