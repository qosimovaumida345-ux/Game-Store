// Complete Card Battle Game
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
      playerDeck: [],
      enemyDeck: [],
      playerHand: [],
      enemyHand: [],
      playerField: [],
      enemyField: [],
      playerHP: 30,
      enemyHP: 30,
      playerMana: 1,
      maxMana: 1,
      turn: 'player',
      selectedCard: null,
      score: 0,
      time: 0,
      status: 'playing'
    };

    this.initDecks();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }

  initDecks() {
    const cards = [
      { name: 'Goblin', cost: 1, attack: 2, hp: 2 },
      { name: 'Knight', cost: 2, attack: 3, hp: 3 },
      { name: 'Dragon', cost: 5, attack: 6, hp: 6 },
      { name: 'Archer', cost: 2, attack: 4, hp: 2 },
      { name: 'Wizard', cost: 3, attack: 4, hp: 4 },
      { name: 'Golem', cost: 4, attack: 3, hp: 7 },
      { name: 'Slime', cost: 1, attack: 1, hp: 3 },
      { name: 'Demon', cost: 6, attack: 8, hp: 5 }
    ];

    for (let i = 0; i < 15; i++) {
      const card = cards[Math.floor(Math.random() * cards.length)];
      this.gameState.playerDeck.push({ ...card, id: 'p' + i });
    }
    for (let i = 0; i < 15; i++) {
      const card = cards[Math.floor(Math.random() * cards.length)];
      this.gameState.enemyDeck.push({ ...card, id: 'e' + i });
    }

    this.drawCards('player', 3);
    this.drawCards('enemy', 3);
  }

  drawCards(who, count) {
    const deck = who === 'player' ? this.gameState.playerDeck : this.gameState.enemyDeck;
    const hand = who === 'player' ? this.gameState.playerHand : this.gameState.enemyHand;

    for (let i = 0; i < count && deck.length > 0; i++) {
      const idx = Math.floor(Math.random() * deck.length);
      hand.push(deck.splice(idx, 1)[0]);
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
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.016);
    this.lastTime = currentTime;
    this.update(dt);
    this.render();
    requestAnimationFrame(t => this.gameLoop(t));
  }

  update(dt) {
    this.gameState.time += dt;

    if (this.gameState.turn === 'enemy' && this.gameState.enemyHand.length > 0) {
      setTimeout(() => this.enemyTurn(), 1000);
      this.gameState.turn = 'waiting';
    }

    if (this.gameState.playerHP <= 0) this.gameState.status = 'lose';
    if (this.gameState.enemyHP <= 0) this.gameState.status = 'win';
  }

  enemyTurn() {
    const enemyHand = this.gameState.enemyHand;
    const mana = this.gameState.enemyMana;

    let playable = enemyHand.filter(c => c.cost <= mana);
    if (playable.length > 0) {
      const card = playable[0];
      const idx = enemyHand.indexOf(card);
      enemyHand.splice(idx, 1);
      this.gameState.enemyField.push({ ...card, canAttack: false });
    }

    this.gameState.enemyField.forEach(card => {
      if (card.canAttack && Math.random() < 0.7) {
        if (this.gameState.playerField.length > 0) {
          const target = this.gameState.playerField[Math.floor(Math.random() * this.gameState.playerField.length)];
          target.hp -= card.attack;
          card.hp -= target.attack;
        } else {
          this.gameState.playerHP -= card.attack;
        }
        card.canAttack = false;
      }
    });

    this.gameState.playerField = this.gameState.playerField.filter(c => c.hp > 0);
    this.gameState.enemyField = this.gameState.enemyField.filter(c => c.hp > 0);

    this.gameState.turn = 'player';
    this.gameState.maxMana = Math.min(10, this.gameState.maxMana + 1);
    this.gameState.playerMana = this.gameState.maxMana;
    this.drawCards('player', 1);
  }

  endTurn() {
    if (this.gameState.turn !== 'player') return;

    this.gameState.playerField.forEach(c => c.canAttack = true);

    this.gameState.enemyField.forEach(card => {
      if (Math.random() < 0.6) {
        if (this.gameState.playerField.length > 0) {
          const target = this.gameState.playerField[Math.floor(Math.random() * this.gameState.playerField.length)];
          target.hp -= card.attack;
          card.hp -= target.attack;
        } else {
          this.gameState.playerHP -= card.attack;
        }
      }
    });

    this.gameState.playerField = this.gameState.playerField.filter(c => c.hp > 0);
    this.gameState.enemyField = this.gameState.enemyField.filter(c => c.hp > 0);

    this.gameState.turn = 'enemy';
    this.gameState.maxMana = Math.min(10, this.gameState.maxMana + 1);
    this.gameState.enemyMana = this.gameState.maxMana;
    this.drawCards('enemy', 1);
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(10, 10, 200, 20);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(10, 10, 200 * (this.gameState.enemyHP / 30), 20);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Enemy HP: ${this.gameState.enemyHP}`, 15, 25);

    this.gameState.enemyField.forEach((card, i) => {
      const x = 100 + i * 120;
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(x, 60, 80, 100);
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(card.name, x + 40, 80);
      ctx.fillText(`ATK: ${card.attack}`, x + 40, 120);
      ctx.fillText(`HP: ${card.hp}`, x + 40, 135);
    });

    ctx.fillStyle = '#3498db';
    ctx.fillRect(10, 300, 200, 20);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(10, 300, 200 * (this.gameState.playerHP / 30), 20);
    ctx.fillStyle = '#fff';
    ctx.fillText(`Player HP: ${this.gameState.playerHP}`, 15, 315);

    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(10, 325, 150, 20);
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(10, 325, 150 * (this.gameState.playerMana / this.gameState.maxMana), 20);
    ctx.fillStyle = '#fff';
    ctx.fillText(`Mana: ${this.gameState.playerMana}/${this.gameState.maxMana}`, 15, 340);

    this.gameState.playerField.forEach((card, i) => {
      const x = 100 + i * 120;
      ctx.fillStyle = '#3498db';
      ctx.fillRect(x, 320, 80, 100);
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(card.name, x + 40, 340);
      ctx.fillText(`ATK: ${card.attack}`, x + 40, 380);
      ctx.fillText(`HP: ${card.hp}`, x + 40, 395);
    });

    const handX = 50;
    this.gameState.playerHand.forEach((card, i) => {
      const x = handX + i * 100;
      ctx.fillStyle = card.cost <= this.gameState.playerMana ? '#27ae60' : '#7f8c8d';
      ctx.fillRect(x, 450, 80, 110);
      ctx.fillStyle = '#fff';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(card.name, x + 40, 470);
      ctx.fillText(`Cost: ${card.cost}`, x + 40, 490);
      ctx.fillText(`ATK: ${card.attack} HP: ${card.hp}`, x + 40, 505);
    });

    ctx.fillStyle = '#9b59b6';
    ctx.fillRect(this.canvas.width - 120, 500, 100, 40);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('END TURN', this.canvas.width - 70, 525);

    if (this.gameState.status === 'win') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#2ecc71';
      ctx.font = 'bold 50px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('YOU WIN!', this.canvas.width / 2, this.canvas.height / 2);
    }
    if (this.gameState.status === 'lose') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 50px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('YOU LOSE!', this.canvas.width / 2, this.canvas.height / 2);
    }
  }

  getPlayerInput() { return {}; }

  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };

    if (input.action) this.endTurn();
  }
}

window.CardBattleGame = CardBattleGame;