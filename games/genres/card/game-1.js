// Card Battle - Trading Card Game
class CardBattleGame {
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
      turn: 1,
      phase: 'draw',
      status: 'playing',
      player: null,
      enemy: null,
      field: { player: [], enemy: [] },
      hand: { player: [], enemy: [] },
      graveyard: { player: [], enemy: [] },
      turnCount: 0,
      winner: null
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    const cardDatabase = [
      { name: 'Goblin', cost: 1, attack: 1, health: 2, type: 'creature', effect: null },
      { name: 'Wolf', cost: 2, attack: 2, health: 2, type: 'creature', effect: null },
      { name: 'Knight', cost: 3, attack: 3, health: 3, type: 'creature', effect: null },
      { name: 'Dragon', cost: 6, attack: 6, health: 6, type: 'creature', effect: 'flying' },
      { name: 'Archer', cost: 2, attack: 2, health: 1, type: 'creature', effect: 'ranged' },
      { name: 'Healer', cost: 2, attack: 0, health: 3, type: 'creature', effect: 'heal' },
      { name: 'Golem', cost: 4, attack: 4, health: 5, type: 'creature', effect: 'armor' },
      { name: 'Phoenix', cost: 5, attack: 4, health: 3, type: 'creature', effect: 'revive' },
      { name: 'Vampire', cost: 3, attack: 3, health: 2, type: 'creature', effect: 'lifesteal' },
      { name: 'Fireball', cost: 2, attack: 0, health: 0, type: 'spell', effect: 'damage', value: 3 },
      { name: 'Heal', cost: 1, attack: 0, health: 0, type: 'spell', effect: 'heal', value: 3 },
      { name: 'Shield', cost: 1, attack: 0, health: 0, type: 'spell', effect: 'armor', value: 2 }
    ];
    
    function createDeck() {
      const deck = [];
      for (let i = 0; i < 20; i++) {
        const card = cardDatabase[Math.floor(Math.random() * cardDatabase.length)];
        deck.push({ ...card, id: i });
      }
      return deck;
    }
    
    function shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
    
    this.gameState.player = {
      name: this.players[0] || 'Player',
      health: 30,
      mana: 0,
      maxMana: 0,
      deck: shuffle(createDeck()),
      hand: [],
      field: []
    };
    
    this.gameState.enemy = {
      name: 'Enemy',
      health: 30,
      mana: 0,
      maxMana: 0,
      deck: shuffle(createDeck()),
      hand: [],
      field: []
    };
    
    // Draw initial cards
    for (let i = 0; i < 4; i++) {
      this.drawCard('player');
      this.drawCard('enemy');
    }
  }
  
  drawCard(who) {
    const deck = this.gameState[who].deck;
    const hand = this.gameState[who].hand;
    
    if (deck.length > 0 && hand.length < 7) {
      hand.push(deck.pop());
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
    this.gameState.time += deltaTime;
    
    // Enemy AI
    if (this.gameState.phase === 'enemy' && this.gameState.time > 1) {
      this.enemyTurn();
    }
  }
  
  startTurn() {
    const player = this.gameState.turn === 1 ? this.gameState.player : this.gameState.enemy;
    const who = this.gameState.turn === 1 ? 'player' : 'enemy';
    
    player.maxMana = Math.min(10, player.maxMana + 1);
    player.mana = player.maxMana;
    this.gameState.turnCount++;
    
    // Draw card
    this.drawCard(who);
    
    // Reset field creatures
    player.field.forEach(c => c.canAttack = true);
    
    this.gameState.phase = this.gameState.turn === 1 ? 'player' : 'enemy';
  }
  
  enemyTurn() {
    const { enemy, player } = this.gameState;
    
    // Play cards
    const playableCards = enemy.hand.filter(c => c.cost <= enemy.mana);
    while (playableCards.length > 0 && enemy.field.length < 5) {
      const card = playableCards.shift();
      enemy.hand = enemy.hand.filter(c => c.id !== card.id);
      enemy.field.push({ ...card, canAttack: false });
      enemy.mana -= card.cost;
    }
    
    // Attack
    enemy.field.forEach(creature => {
      if (creature.canAttack && player.field.length > 0) {
        const target = player.field[Math.floor(Math.random() * player.field.length)];
        target.health -= creature.attack;
        creature.health -= target.attack;
        creature.canAttack = false;
      } else if (creature.canAttack) {
        player.health -= creature.attack;
        creature.canAttack = false;
      }
    });
    
    // Remove dead creatures
    enemy.field = enemy.field.filter(c => c.health > 0);
    player.field = player.field.filter(c => c.health > 0);
    
    // Check winner
    if (player.health <= 0) {
      this.gameState.winner = 'enemy';
      this.gameState.status = 'gameover';
    } else if (enemy.health <= 0) {
      this.gameState.winner = 'player';
      this.gameState.status = 'gameover';
    }
    
    // Next turn
    this.gameState.turn = 1;
    this.startTurn();
  }
  
  playCard(cardId, targetIndex = null) {
    const player = this.gameState.player;
    const card = player.hand.find(c => c.id === cardId);
    
    if (!card || card.cost > player.mana) return;
    
    if (card.type === 'creature' && player.field.length < 5) {
      player.hand = player.hand.filter(c => c.id !== cardId);
      player.field.push({ ...card, canAttack: false });
      player.mana -= card.cost;
    } else if (card.type === 'spell') {
      if (card.effect === 'damage' && targetIndex !== null) {
        const target = this.gameState.enemy.field[targetIndex];
        if (target) {
          target.health -= card.value;
          player.mana -= card.cost;
        }
      } else if (card.effect === 'heal') {
        player.field.forEach(c => c.health = Math.min(c.health + card.value, c.health + 5));
        player.mana -= card.cost;
      }
    }
    
    // Remove dead
    player.field = player.field.filter(c => c.health > 0);
    this.gameState.enemy.field = this.gameState.enemy.field.filter(c => c.health > 0);
    
    // End turn
    this.gameState.turn = 2;
    this.gameState.time = 0;
  }
  
  attack(attackerIndex, targetIndex) {
    const attacker = this.gameState.player.field[attackerIndex];
    const target = this.gameState.enemy.field[targetIndex];
    
    if (!attacker || !attacker.canAttack || !target) return;
    
    target.health -= attacker.attack;
    attacker.health -= target.attack;
    attacker.canAttack = false;
    
    this.gameState.player.field = this.gameState.player.field.filter(c => c.health > 0);
    this.gameState.enemy.field = this.gameState.enemy.field.filter(c => c.health > 0);
    
    // Check winner
    if (this.gameState.enemy.health <= 0) {
      this.gameState.winner = 'player';
      this.gameState.status = 'gameover';
    }
  }
  
  endTurn() {
    this.gameState.turn = 2;
    this.gameState.time = 0;
  }
  
  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Enemy area
    this.ctx.fillStyle = '#c0392b';
    this.ctx.fillRect(0, 0, this.canvas.width, 80);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Enemy HP: ${this.gameState.enemy.health}`, 20, 25);
    this.ctx.fillText(`Mana: ${this.gameState.enemy.mana}/${this.gameState.enemy.maxMana}`, 20, 50);
    
    // Enemy hand (face down)
    for (let i = 0; i < this.gameState.enemy.hand.length; i++) {
      this.ctx.fillStyle = '#34495e';
      this.ctx.fillRect(100 + i * 60, 10, 50, 70);
      this.ctx.strokeStyle = '#fff';
      this.ctx.strokeRect(100 + i * 60, 10, 50, 70);
    }
    
    // Enemy field
    this.gameState.enemy.field.forEach((c, i) => {
      this.drawCardVisual(c, 100 + i * 80, 90, true);
    });
    
    // Center info
    this.ctx.fillStyle = '#34495e';
    this.ctx.fillRect(350, 250, 100, 40);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Turn ${this.gameState.turnCount}`, 400, 275);
    
    // Player field
    this.gameState.player.field.forEach((c, i) => {
      this.drawCardVisual(c, 100 + i * 80, 350, false);
    });
    
    // Player area
    this.ctx.fillStyle = '#2980b9';
    this.ctx.fillRect(0, 450, this.canvas.width, 150);
    
    // Player stats
    this.ctx.fillStyle = '#fff';
    this.ctx.textAlign = 'left';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(`HP: ${this.gameState.player.health}`, 20, 475);
    this.ctx.fillText(`Mana: ${this.state.player?.mana || 0}/${this.gameState.player.maxMana}`, 20, 500);
    
    // Player hand
    this.gameState.player.hand.forEach((c, i) => {
      this.drawCardVisual(c, 100 + i * 80, 480, false);
    });
    
    // End turn button
    if (this.gameState.phase === 'player') {
      this.ctx.fillStyle = '#e67e22';
      this.ctx.fillRect(700, 500, 80, 40);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '16px Arial';
      this.ctx.fillText('End', 740, 525);
    }
    
    if (this.gameState.status === 'gameover') {
      this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = this.gameState.winner === 'player' ? '#2ecc71' : '#e74c3c';
      this.ctx.font = 'bold 50px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.gameState.winner === 'player' ? 'YOU WIN!' : 'YOU LOSE', this.canvas.width / 2, this.canvas.height / 2);
    }
  }
  
  drawCardVisual(card, x, y, isEnemy) {
    this.ctx.fillStyle = isEnemy ? '#7f8c8d' : '#ecf0f1';
    this.ctx.fillRect(x, y, 70, 100);
    this.ctx.strokeStyle = '#333';
    this.ctx.strokeRect(x, y, 70, 100);
    
    if (!isEnemy) {
      this.ctx.fillStyle = '#333';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(card.name, x + 35, y + 15);
      
      this.ctx.fillStyle = '#3498db';
      this.ctx.fillRect(x + 5, y + 20, 60, 15);
      this.ctx.fillStyle = '#fff';
      this.ctx.fillText(`${card.cost}`, x + 35, y + 31);
      
      if (card.type === 'creature') {
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(x + 5, y + 40, 25, 20);
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.fillRect(x + 40, y + 40, 25, 20);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillText(card.attack, x + 17, y + 55);
        this.ctx.fillText(card.health, x + 52, y + 55);
      }
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.CardBattleGame = CardBattleGame;