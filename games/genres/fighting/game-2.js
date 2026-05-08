// Fighting Arena Game
class FightingArenaGame {
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
      round: 1,
      maxRounds: 3,
      scores: [0, 0],
      status: 'fighting',
      fighters: [
        { x: 200, y: 400, health: 100, energy: 100, state: 'idle', combo: 0, hitStun: 0, direction: 1 },
        { x: 600, y: 400, health: 100, energy: 100, state: 'idle', combo: 0, hitStun: 0, direction: -1, ai: true }
      ],
      gameOver: false,
      winner: null
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.fighters[0].x = 200;
    this.gameState.fighters[1].x = 600;
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
    
    this.updateFighters(deltaTime);
    this.checkKO();
  }
  
  updateFighters(deltaTime) {
    this.gameState.fighters.forEach((fighter, i) => {
      if (fighter.hitStun > 0) {
        fighter.hitStun -= deltaTime;
        fighter.state = 'hit';
        return;
      }
      
      fighter.energy = Math.min(100, fighter.energy + 0.5);
      
      if (i === 0) {
        const input = this.getPlayerInput(this.players[i]);
        
        if (input.left) fighter.x -= 4;
        if (input.right) fighter.x += 4;
        if (input.up) fighter.y -= 3;
        if (input.down) fighter.y += 3;
        
        fighter.x = Math.max(50, Math.min(350, fighter.x));
        fighter.y = Math.max(200, Math.min(450, fighter.y));
        
        if (input.a && fighter.energy >= 10) {
          this.performAttack(i, 'punch');
        }
        if (input.b && fighter.energy >= 15) {
          this.performAttack(i, 'kick');
        }
        if (input.action && fighter.energy >= 20) {
          this.performAttack(i, 'special');
        }
        
        fighter.direction = fighter.x < this.gameState.fighters[1].x ? 1 : -1;
      } else {
        const ai = this.gameState.fighters[1];
        const player = this.gameState.fighters[0];
        const dist = Math.abs(ai.x - player.x);
        
        if (dist > 80) {
          ai.x += (player.x > ai.x ? 1 : -1) * 2.5;
        }
        
        if (dist < 150 && Math.random() < 0.03 && ai.energy >= 10) {
          this.performAttack(1, Math.random() < 0.5 ? 'punch' : 'kick');
        }
        
        ai.direction = ai.x < player.x ? 1 : -1;
      }
    });
  }
  
  performAttack(fighterIndex, attackType) {
    const fighter = this.gameState.fighters[fighterIndex];
    const opponentIndex = 1 - fighterIndex;
    const opponent = this.gameState.fighters[opponentIndex];
    
    const ranges = { punch: 60, kick: 80, special: 100 };
    const damages = { punch: 8, kick: 12, special: 20 };
    const costs = { punch: 10, kick: 15, special: 20 };
    
    if (fighter.energy < costs[attackType]) return;
    
    fighter.energy -= costs[attackType];
    fighter.state = attackType;
    fighter.combo++;
    
    const dx = opponent.x - fighter.x;
    const dy = Math.abs(opponent.y - fighter.y);
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < ranges[attackType] && Math.abs(dx) < 50) {
      const damage = damages[attackType] + fighter.combo * 2;
      opponent.health -= damage;
      opponent.hitStun = 0.3;
      opponent.state = 'hurt';
      
      this.gameState.scores[fighterIndex] += damage;
    }
    
    setTimeout(() => {
      if (fighter.state === attackType) {
        fighter.state = 'idle';
      }
    }, 300);
  }
  
  checkKO() {
    this.gameState.fighters.forEach((fighter, i) => {
      if (fighter.health <= 0) {
        this.gameState.scores[1 - i] += 100;
        
        if (this.gameState.round >= this.gameState.maxRounds) {
          this.gameState.winner = this.gameState.scores[0] > this.gameState.scores[1] ? this.players[0] : this.players[1];
          this.gameState.gameOver = true;
        } else {
          this.gameState.round++;
          this.resetFighters();
        }
      }
    });
  }
  
  resetFighters() {
    this.gameState.fighters[0].x = 200;
    this.gameState.fighters[0].health = 100;
    this.gameState.fighters[0].energy = 100;
    this.gameState.fighters[0].combo = 0;
    
    this.gameState.fighters[1].x = 600;
    this.gameState.fighters[1].health = 100;
    this.gameState.fighters[1].energy = 100;
    this.gameState.fighters[1].combo = 0;
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.drawArena();
    this.drawFighters();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawArena() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#2c3e50');
    gradient.addColorStop(1, '#1a252f');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#8e44ad';
    this.ctx.fillRect(50, 450, 700, 20);
  }
  
  drawFighters() {
    this.gameState.fighters.forEach((fighter, i) => {
      const color = i === 0 ? '#3498db' : '#e74c3c';
      const x = fighter.x;
      const y = fighter.y;
      
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x - 20, y - 50, 40, 60);
      
      this.ctx.fillStyle = '#f5d0c5';
      this.ctx.beginPath();
      this.ctx.arc(x, y - 60, 15, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(x - 8, y - 65, 6, 6);
      this.ctx.fillRect(x + 2, y - 65, 6, 6);
      
      this.ctx.fillStyle = 'rgba(231, 76, 60, 0.5)';
      this.ctx.fillRect(x - 30, y - 90, 60, 8);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(x - 30, y - 90, 60 * (fighter.health / 100), 8);
      
      this.ctx.fillStyle = 'rgba(241, 196, 15, 0.5)';
      this.ctx.fillRect(x - 30, y - 80, 60, 6);
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.fillRect(x - 30, y - 80, 60 * (fighter.energy / 100), 6);
    });
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 150, 70);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${this.players[0]}: ${this.gameState.scores[0]}`, 20, 30);
    this.ctx.fillText(`${this.players[1]}: ${this.gameState.scores[1]}`, 20, 50);
    this.ctx.fillText(`Round: ${this.gameState.round}/${this.gameState.maxRounds}`, 20, 70);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('FIGHTING ARENA', this.canvas.width / 2, 30);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('K.O.!', this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`${this.gameState.winner} Wins!`, this.canvas.width / 2, this.canvas.height / 2 + 30);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.FightingArenaGame = FightingArenaGame;