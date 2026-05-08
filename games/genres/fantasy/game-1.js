// Complete Fantasy RPG Quest Game
class FantasyQuestGame {
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
      hero: null,
      companions: [],
      quests: [],
      currentQuest: 0,
      enemies: [],
      items: [],
      worldMap: [],
      time: 0,
      score: 0,
      day: 1,
      status: 'exploring'
    };

    this.initGame();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }

  initGame() {
    this.gameState.hero = {
      name: 'Hero',
      x: 400,
      y: 300,
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      attack: 15,
      defense: 10,
      level: 1,
      xp: 0,
      xpToLevel: 100,
      gold: 50,
      inventory: ['Potion', 'Bread'],
      equipment: { weapon: 'Iron Sword', armor: 'Cloth' },
      state: 'idle'
    };

    this.gameState.companions = [
      { name: 'Elara', job: 'Healer', hp: 60, maxHp: 60, attack: 8, x: 350, y: 280 },
      { name: 'Grim', job: 'Warrior', hp: 120, maxHp: 120, attack: 20, x: 450, y: 320 }
    ];

    this.gameState.quests = [
      { id: 1, title: 'Clear the Forest', desc: 'Defeat 5 wolves in the Dark Forest', progress: 0, target: 5, complete: false, reward: 100 },
      { id: 2, title: 'Find the Artifact', desc: 'Search the Ancient Ruins for a magical artifact', progress: 0, target: 1, complete: false, reward: 200 },
      { id: 3, title: 'Defeat the Dragon', desc: 'Slay the Dragon in the Mountain Cave', progress: 0, target: 1, complete: false, reward: 500 }
    ];

    this.gameState.enemies = [
      { name: 'Wolf', hp: 30, attack: 10, xp: 20, gold: 10, x: 600, y: 200, alive: true },
      { name: 'Goblin', hp: 40, attack: 12, xp: 25, gold: 15, x: 700, y: 400, alive: true },
      { name: 'Skeleton', hp: 50, attack: 15, xp: 30, gold: 20, x: 500, y: 500, alive: true },
      { name: 'Orc', hp: 80, attack: 20, xp: 50, gold: 40, x: 300, y: 150, alive: true },
      { name: 'Dragon', hp: 300, attack: 35, xp: 200, gold: 200, x: 700, y: 100, alive: true, isBoss: true }
    ];

    this.gameState.items = [
      { x: 500, y: 250, type: 'weapon', name: 'Steel Sword', value: 50 },
      { x: 650, y: 350, type: 'potion', name: 'Health Potion', value: 20 },
      { x: 400, y: 450, type: 'armor', name: 'Chain Mail', value: 75 },
      { x: 550, y: 150, type: 'artifact', name: 'Ancient Amulet', value: 0 }
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
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.033);
    this.lastTime = currentTime;
    this.update(dt);
    this.render();
    requestAnimationFrame(t => this.gameLoop(t));
  }

  update(dt) {
    this.gameState.time += dt;
    const hero = this.gameState.hero;

    const input = this.getPlayerInput();
    const speed = 120;

    if (input.left) hero.x -= speed * dt;
    if (input.right) hero.x += speed * dt;
    if (input.up) hero.y -= speed * dt;
    if (input.down) hero.y += speed * dt;

    hero.x = Math.max(30, Math.min(this.canvas.width - 30, hero.x));
    hero.y = Math.max(30, Math.min(this.canvas.height - 30, hero.y));

    this.gameState.companions.forEach(c => {
      const dx = hero.x - c.x;
      const dy = hero.y - c.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 60) {
        c.x += (dx / dist) * 40 * dt;
        c.y += (dy / dist) * 40 * dt;
      }
    });

    this.gameState.enemies.forEach(e => {
      if (!e.alive) return;
      const dx = hero.x - e.x;
      const dy = hero.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 80) {
        hero.hp -= e.attack * dt * 0.5;
      }
    });

    this.gameState.items.forEach((item, i) => {
      const dx = item.x - hero.x;
      const dy = item.y - hero.y;
      if (Math.sqrt(dx * dx + dy * dy) < 40) {
        if (item.type === 'potion') {
          hero.hp = Math.min(hero.maxHp, hero.hp + item.value);
        } else if (item.type === 'weapon') {
          hero.attack += 10;
          hero.equipment.weapon = item.name;
        } else if (item.type === 'armor') {
          hero.defense += 8;
          hero.equipment.armor = item.name;
        } else if (item.type === 'artifact') {
          const quest = this.gameState.quests.find(q => q.title === 'Find the Artifact');
          if (quest && !quest.complete) {
            quest.progress = 1;
            quest.complete = true;
            this.gameState.score += quest.reward;
          }
        }
        this.gameState.items.splice(i, 1);
      }
    });

    const currentQuest = this.gameState.quests[this.gameState.currentQuest];
    if (currentQuest && currentQuest.title === 'Clear the Forest') {
      this.gameState.enemies.forEach(e => {
        if (e.alive && e.name === 'Wolf') {
          const dx = hero.x - e.x;
          const dy = hero.y - e.y;
          if (Math.sqrt(dx * dx + dy * dy) < 60) {
            if (input.action && hero.attack > 0) {
              e.alive = false;
              currentQuest.progress++;
              if (currentQuest.progress >= currentQuest.target) {
                currentQuest.complete = true;
                this.gameState.score += currentQuest.reward;
                hero.xp += 50;
              }
            }
          }
        }
      });
    }

    if (hero.xp >= hero.xpToLevel) {
      hero.level++;
      hero.xp -= hero.xpToLevel;
      hero.xpToLevel = Math.floor(hero.xpToLevel * 1.5);
      hero.maxHp += 20;
      hero.hp = hero.maxHp;
      hero.attack += 5;
      hero.defense += 3;
    }

    if (hero.hp <= 0) {
      this.gameState.status = 'gameover';
    }

    if (this.gameState.quests.every(q => q.complete)) {
      this.gameState.status = 'victory';
    }
  }

  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }

  render() {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1a472a');
    gradient.addColorStop(1, '#0d2818');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#2d5a3d';
    for (let x = 0; x < this.canvas.width; x += 80) {
      for (let y = 0; y < this.canvas.height; y += 80) {
        ctx.fillRect(x + 10, y + 10, 60, 60);
      }
    }

    this.gameState.enemies.forEach(e => {
      if (!e.alive) return;
      ctx.fillStyle = e.isBoss ? '#8b0000' : '#4a4a4a';
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.isBoss ? 35 : 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(e.x - 8, e.y - 5, 4, 0, Math.PI * 2);
      ctx.arc(e.x + 8, e.y - 5, 4, 0, Math.PI * 2);
      ctx.fill();

      if (e.isBoss) {
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(e.x - 30, e.y - 45, 60, 8);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(e.x - 30, e.y - 45, 60 * (e.hp / 300), 8);
      }
    });

    this.gameState.items.forEach(item => {
      ctx.fillStyle = item.type === 'weapon' ? '#c0c0c0' :
                     item.type === 'potion' ? '#e74c3c' :
                     item.type === 'armor' ? '#8b4513' : '#ffd700';
      ctx.beginPath();
      ctx.arc(item.x, item.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.type === 'artifact' ? '★' : item.type[0].toUpperCase(), item.x, item.y + 4);
    });

    const hero = this.gameState.hero;
    ctx.save();
    ctx.translate(hero.x, hero.y);

    ctx.fillStyle = '#3498db';
    ctx.fillRect(-12, -20, 24, 28);
    ctx.fillStyle = '#f4a460';
    ctx.beginPath();
    ctx.arc(0, -24, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(-8, -15, 16, 4);
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(-8, 8, 16, 4);

    ctx.restore();

    this.gameState.companions.forEach(c => {
      ctx.fillStyle = c.job === 'Healer' ? '#9b59b6' : '#e67e22';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(c.name[0], c.x, c.y + 4);
    });

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 180, 100);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Level: ${hero.level}`, 20, 30);
    ctx.fillText(`HP: ${Math.floor(hero.hp)}/${hero.maxHp}`, 20, 50);
    ctx.fillText(`MP: ${Math.floor(hero.mp)}/${hero.maxMp}`, 20, 70);
    ctx.fillText(`Gold: ${hero.gold}  XP: ${hero.xp}/${hero.xpToLevel}`, 20, 90);

    const quest = this.gameState.quests[this.gameState.currentQuest];
    if (quest) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, this.canvas.height - 60, 250, 50);
      ctx.fillStyle = '#f1c40f';
      ctx.font = '14px Arial';
      ctx.fillText(`Quest: ${quest.title}`, 20, this.canvas.height - 42);
      ctx.fillStyle = '#ccc';
      ctx.font = '11px Arial';
      ctx.fillText(`${quest.progress}/${quest.target}`, 20, this.canvas.height - 25);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(this.canvas.width - 130, 10, 120, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Day: ${this.gameState.day}`, this.canvas.width - 20, 30);
    ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width - 20, 45);

    if (this.gameState.status === 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 50px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
    }

    if (this.gameState.status === 'victory') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#2ecc71';
      ctx.font = 'bold 50px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('QUEST COMPLETE!', this.canvas.width / 2, this.canvas.height / 2);
      ctx.fillStyle = '#fff';
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
  }

  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.FantasyQuestGame = FantasyQuestGame;