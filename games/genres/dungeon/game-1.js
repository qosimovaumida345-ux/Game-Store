// Complete Dungeon Crawler Game
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
      player: null,
      dungeon: [],
      enemies: [],
      loot: [],
      floor: 1,
      score: 0,
      time: 0,
      combat: null,
      status: 'exploring'
    };

    this.initPlayer();
    this.generateDungeon();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }

  initPlayer() {
    this.gameState.player = {
      x: 400,
      y: 300,
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      attack: 10,
      defense: 5,
      level: 1,
      xp: 0,
      xpToLevel: 100,
      gold: 0,
      inventory: [],
      equipment: { weapon: null, armor: null, accessory: null },
      state: 'normal'
    };
  }

  generateDungeon() {
    const cols = 10;
    const rows = 10;
    const cellSize = 60;

    this.gameState.dungeon = [];
    this.gameState.enemies = [];
    this.gameState.loot = [];

    for (let r = 0; r < rows; r++) {
      this.gameState.dungeon[r] = [];
      for (let c = 0; c < cols; c++) {
        this.gameState.dungeon[r][c] = {
          type: Math.random() < 0.3 ? 'wall' : 'floor',
          visited: false,
          room: null
        };
      }
    }

    this.gameState.dungeon[5][5].type = 'start';
    this.gameState.dungeon[5][5].visited = true;

    const corridors = 15;
    for (let i = 0; i < corridors; i++) {
      let r = Math.floor(Math.random() * (rows - 2)) + 1;
      let c = Math.floor(Math.random() * (cols - 2)) + 1;
      const dir = Math.floor(Math.random() * 4);
      const len = Math.floor(Math.random() * 3) + 2;

      for (let j = 0; j < len; j++) {
        if (r > 0 && r < rows - 1 && c > 0 && c < cols - 1) {
          this.gameState.dungeon[r][c].type = 'floor';
        }
        if (dir === 0) r++;
        else if (dir === 1) r--;
        else if (dir === 2) c++;
        else c--;
      }
    }

    const enemyTypes = [
      { name: 'Goblin', hp: 30, attack: 8, xp: 20, gold: 15 },
      { name: 'Skeleton', hp: 40, attack: 12, xp: 30, gold: 20 },
      { name: 'Orc', hp: 60, attack: 15, xp: 50, gold: 35 },
      { name: 'Dark Elf', hp: 45, attack: 18, xp: 45, gold: 30 },
      { name: 'Troll', hp: 80, attack: 20, xp: 80, gold: 50 }
    ];

    for (let i = 0; i < 8; i++) {
      const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      let r, c;
      do {
        r = Math.floor(Math.random() * rows);
        c = Math.floor(Math.random() * cols);
      } while (this.gameState.dungeon[r][c].type === 'wall' || (r === 5 && c === 5));

      this.gameState.enemies.push({
        ...type,
        x: c * cellSize + cellSize / 2,
        y: r * cellSize + cellSize / 2,
        maxHp: type.hp,
        alive: true,
        ai: 'patrol'
      });
    }

    const lootTypes = [
      { type: 'potion', name: 'Health Potion', effect: 'heal', value: 30 },
      { type: 'mpotion', name: 'Mana Potion', effect: 'mp', value: 25 },
      { type: 'weapon', name: 'Iron Sword', effect: 'attack', value: 5 },
      { type: 'armor', name: 'Leather Armor', effect: 'defense', value: 3 },
      { type: 'gold', name: 'Gold', effect: 'gold', value: Math.floor(Math.random() * 50) + 10 }
    ];

    for (let i = 0; i < 5; i++) {
      let r, c;
      do {
        r = Math.floor(Math.random() * rows);
        c = Math.floor(Math.random() * cols);
      } while (this.gameState.dungeon[r][c].type === 'wall');

      const loot = lootTypes[Math.floor(Math.random() * lootTypes.length)];
      this.gameState.loot.push({
        ...loot,
        x: c * cellSize + cellSize / 2,
        y: r * cellSize + cellSize / 2,
        collected: false
      });
    }

    const exitRow = Math.floor(Math.random() * rows);
    const exitCol = Math.floor(Math.random() * cols);
    this.gameState.dungeon[exitRow][exitCol].type = 'exit';
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  stop() { this.isRunning = false; }

  gameLoop(currentTime) {
    if (!this.isRunning) return;
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.033);
    this.lastTime = currentTime;
    this.update(dt);
    this.render();
    requestAnimationFrame(t => this.gameLoop(t));
  }

  update(dt) {
    if (this.gameState.status === 'combat') {
      this.updateCombat(dt);
      return;
    }

    this.gameState.time += dt;
    const player = this.gameState.player;
    const input = this.getPlayerInput();

    const speed = 150;
    let dx = 0, dy = 0;

    if (input.up) dy = -speed * dt;
    if (input.down) dy = speed * dt;
    if (input.left) dx = -speed * dt;
    if (input.right) dx = speed * dt;

    player.x += dx;
    player.y += dy;

    player.x = Math.max(30, Math.min(this.canvas.width - 30, player.x));
    player.y = Math.max(30, Math.min(this.canvas.height - 30, player.y));

    const cellSize = 60;
    const col = Math.floor(player.x / cellSize);
    const row = Math.floor(player.y / cellSize);

    if (row >= 0 && row < 10 && col >= 0 && col < 10) {
      this.gameState.dungeon[row][col].visited = true;
    }

    this.gameState.enemies.forEach(e => {
      if (!e.alive) return;
      const dist = Math.sqrt((e.x - player.x) ** 2 + (e.y - player.y) ** 2);

      if (dist < 80) {
        this.startCombat(e);
      } else if (dist < 200) {
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        e.x += Math.cos(angle) * 30 * dt;
        e.y += Math.sin(angle) * 30 * dt;
      } else {
        e.x += Math.sin(this.gameState.time + e.x * 0.1) * 0.5;
        e.y += Math.cos(this.gameState.time + e.y * 0.1) * 0.5;
      }
    });

    this.gameState.loot.forEach(l => {
      if (l.collected) return;
      const dist = Math.sqrt((l.x - player.x) ** 2 + (l.y - player.y) ** 2);
      if (dist < 40) {
        l.collected = true;
        if (l.type === 'potion') {
          player.hp = Math.min(player.maxHp, player.hp + l.value);
        } else if (l.type === 'mpotion') {
          player.mp = Math.min(player.maxMp, player.mp + l.value);
        } else if (l.type === 'weapon') {
          player.attack += l.value;
        } else if (l.type === 'armor') {
          player.defense += l.value;
        } else if (l.type === 'gold') {
          player.gold += l.value;
        }
      }
    });

    if (row >= 0 && row < 10 && col >= 0 && col < 10 &&
        this.gameState.dungeon[row][col].type === 'exit') {
      this.gameState.floor++;
      this.gameState.score += 500;
      player.hp = Math.min(player.maxHp, player.hp + 20);
      player.mp = Math.min(player.maxMp, player.mp + 10);
      player.x = 400;
      player.y = 300;
      this.generateDungeon();
    }

    if (player.hp <= 0) {
      this.gameState.status = 'gameover';
    }
  }

  startCombat(enemy) {
    this.gameState.status = 'combat';
    this.gameState.combat = {
      enemy: enemy,
      playerTurn: true,
      log: ['Combat started!'],
      menu: 'action'
    };
  }

  updateCombat(dt) {
    if (!this.gameState.combat.playerTurn) return;

    const input = this.getPlayerInput();
    const combat = this.gameState.combat;
    const player = this.gameState.player;
    const enemy = combat.enemy;

    if (input.action) {
      const damage = Math.max(1, player.attack - enemy.attack * 0.5);
      enemy.hp -= damage;
      combat.log.push(`You hit ${enemy.name} for ${Math.floor(damage)} damage!`);

      if (enemy.hp <= 0) {
        enemy.alive = false;
        player.xp += enemy.xp;
        player.gold += enemy.gold;
        this.gameState.score += enemy.xp * 10;

        if (player.xp >= player.xpToLevel) {
          player.level++;
          player.xp -= player.xpToLevel;
          player.xpToLevel = Math.floor(player.xpToLevel * 1.5);
          player.maxHp += 20;
          player.hp = player.maxHp;
          player.attack += 3;
          player.defense += 2;
          combat.log.push(`Level up! You are now level ${player.level}!`);
        }

        combat.log.push(`You defeated ${enemy.name}!`);
        this.gameState.status = 'exploring';
        this.gameState.combat = null;
      } else {
        combat.playerTurn = false;
        setTimeout(() => this.enemyAttack(), 500);
      }
    }

    if (input.back && player.mp >= 10) {
      player.mp -= 10;
      const heal = Math.floor(player.attack * 1.5);
      player.hp = Math.min(player.maxHp, player.hp + heal);
      combat.log.push(`You cast Heal! +${heal} HP`);
      combat.playerTurn = false;
      setTimeout(() => this.enemyAttack(), 500);
    }
  }

  enemyAttack() {
    const combat = this.gameState.combat;
    const player = this.gameState.player;
    const enemy = combat.enemy;

    const damage = Math.max(1, enemy.attack - player.defense * 0.5);
    player.hp -= damage;
    combat.log.push(`${enemy.name} attacks you for ${Math.floor(damage)} damage!`);

    if (player.hp <= 0) {
      this.gameState.status = 'gameover';
    } else {
      combat.playerTurn = true;
    }
  }

  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const cellSize = 60;

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const cell = this.gameState.dungeon[r][c];
        const x = c * cellSize;
        const y = r * cellSize;

        if (cell.type === 'wall') {
          ctx.fillStyle = '#2c3e50';
          ctx.fillRect(x, y, cellSize, cellSize);
          ctx.fillStyle = '#34495e';
          ctx.fillRect(x + 5, y + 5, cellSize - 10, cellSize - 10);
        } else if (cell.type === 'floor') {
          ctx.fillStyle = cell.visited ? '#5d6d7e' : '#2c3e50';
          ctx.fillRect(x, y, cellSize, cellSize);
          if (cell.visited) {
            ctx.strokeStyle = '#34495e';
            ctx.strokeRect(x, y, cellSize, cellSize);
          }
        } else if (cell.type === 'start') {
          ctx.fillStyle = '#27ae60';
          ctx.fillRect(x, y, cellSize, cellSize);
        } else if (cell.type === 'exit') {
          ctx.fillStyle = '#9b59b6';
          ctx.fillRect(x, y, cellSize, cellSize);
          ctx.fillStyle = '#fff';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('EXIT', x + cellSize / 2, y + cellSize / 2 + 4);
        }
      }
    }

    this.gameState.loot.forEach(l => {
      if (l.collected) return;
      ctx.fillStyle = l.type === 'gold' ? '#f1c40f' :
                     l.type === 'potion' ? '#e74c3c' :
                     l.type === 'mpotion' ? '#3498db' : '#95a5a6';
      ctx.beginPath();
      ctx.arc(l.x, l.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(l.type === 'gold' ? '$' : l.type[0].toUpperCase(), l.x, l.y + 4);
    });

    this.gameState.enemies.forEach(e => {
      if (!e.alive) return;
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(e.x, e.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.fillRect(e.x - 8, e.y - 5, 5, 5);
      ctx.fillRect(e.x + 3, e.y - 5, 5, 5);

      const hpPercent = e.hp / e.maxHp;
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(e.x - 20, e.y - 25, 40, 6);
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(e.x - 20, e.y - 25, 40 * hpPercent, 6);
    });

    const player = this.gameState.player;
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(player.x, player.y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(player.x, player.y - 5, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(player.x, player.y - 5, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 10, 180, 110);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${player.hp}/${player.maxHp}`, 20, 30);
    ctx.fillText(`MP: ${player.mp}/${player.maxMp}`, 20, 50);
    ctx.fillText(`ATK: ${player.attack}  DEF: ${player.defense}`, 20, 70);
    ctx.fillText(`LVL: ${player.level}  XP: ${player.xp}/${player.xpToLevel}`, 20, 90);
    ctx.fillText(`Gold: ${player.gold}  Floor: ${this.gameState.floor}`, 20, 110);

    if (this.gameState.status === 'combat') {
      this.renderCombat();
    }

    if (this.gameState.status === 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 50px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
      ctx.fillStyle = '#fff';
      ctx.font = '24px Arial';
      ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
  }

  renderCombat() {
    const ctx = this.ctx;
    const combat = this.gameState.combat;
    const player = this.gameState.player;
    const enemy = combat.enemy;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(100, 100, 600, 400);

    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`VS ${enemy.name}`, this.canvas.width / 2, 140);

    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(150, 160, 200, 20);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(150, 160, 200 * (enemy.hp / enemy.maxHp), 20);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${enemy.hp}/${enemy.maxHp}`, 160, 175);

    ctx.fillStyle = '#3498db';
    ctx.fillRect(450, 160, 200, 20);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(450, 160, 200 * (player.hp / player.maxHp), 20);
    ctx.fillStyle = '#fff';
    ctx.fillText(`HP: ${player.hp}/${player.maxHp}`, 460, 175);

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '18px Arial';
    ctx.fillText('[A] Attack', 200, 350);
    ctx.fillText('[B] Heal (10 MP)', 350, 350);
    ctx.fillText('[Run]', 500, 350);

    const logY = 380;
    ctx.fillStyle = '#ccc';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    const logs = combat.log.slice(-3);
    logs.forEach((log, i) => {
      ctx.fillText(log, 130, logY + i * 18);
    });
  }

  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.DungeonCrawlerGame = DungeonCrawlerGame;