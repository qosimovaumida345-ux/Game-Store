// Boxing Champion Game
class BoxingChampionGame {
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
      rounds: 3,
      currentRound: 1,
      timePerRound: 60,
      roundTime: 60,
      status: 'fighting',
      fighters: [
        {
          name: players[0],
          x: 250,
          y: 350,
          health: 100,
          energy: 100,
          stance: 'orthodox',
          punching: false,
          blocking: false,
          dodging: false,
          punchCooldown: 0,
          hitStun: 0
        },
        {
          name: players[1],
          x: 550,
          y: 350,
          health: 100,
          energy: 100,
          stance: 'southpaw',
          punching: false,
          blocking: false,
          dodging: false,
          punchCooldown: 0,
          hitStun: 0,
          ai: true
        }
      ],
      score: [0, 0],
      knockout: false,
      winner: null,
      gameOver: false
    };
    
    this.config = {
      ringWidth: 700,
      ringHeight: 400,
      punchDamage: 10,
      punchRange: 80,
      movementSpeed: 3,
      blockReduction: 0.7,
      dodgeReduction: 0.9
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.fighters[0].x = 250;
    this.gameState.fighters[1].x = 550;
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
    this.gameState.roundTime -= deltaTime;
    
    if (this.gameState.roundTime <= 0) {
      this.endRound();
      return;
    }
    
    this.updateFighters(deltaTime);
    this.checkHits();
    this.aiUpdate(deltaTime);
  }
  
  updateFighters(deltaTime) {
    this.gameState.fighters.forEach((fighter, i) => {
      if (fighter.hitStun > 0) {
        fighter.hitStun -= deltaTime;
        return;
      }
      
      if (fighter.punchCooldown > 0) {
        fighter.punchCooldown -= deltaTime;
      }
      
      if (i === 0) {
        const input = this.getPlayerInput(fighter.name);
        
        if (input.left) fighter.x -= this.config.movementSpeed;
        if (input.right) fighter.x += this.config.movementSpeed;
        if (input.up) fighter.y -= this.config.movementSpeed * 0.7;
        if (input.down) fighter.y += this.config.movementSpeed * 0.7;
        
        fighter.blocking = input.a || input.b;
        fighter.dodging = input.left && input.down || input.right && input.down;
        
        if (input.action && fighter.punchCooldown <= 0) {
          this.punch(i);
        }
      }
      
      fighter.x = Math.max(150, Math.min(this.canvas.width - 150, fighter.x));
      fighter.y = Math.max(250, Math.min(420, fighter.y));
      
      if (!fighter.punching) {
        fighter.energy = Math.min(100, fighter.energy + 0.5);
      }
    });
  }
  
  punch(fighterIndex) {
    const fighter = this.gameState.fighters[fighterIndex];
    const opponent = this.gameState.fighters[1 - fighterIndex];
    
    fighter.punching = true;
    fighter.punchCooldown = 0.5;
    
    setTimeout(() => {
      fighter.punching = false;
    }, 200);
    
    const dx = opponent.x - fighter.x;
    const dy = Math.abs(opponent.y - fighter.y);
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < this.config.punchRange && Math.abs(dx) < 50) {
      this.registerHit(fighterIndex);
    }
  }
  
  registerHit(fighterIndex) {
    const attacker = this.gameState.fighters[fighterIndex];
    const defender = this.gameState.fighters[1 - fighterIndex];
    
    let damage = this.config.punchDamage;
    
    if (defender.blocking) {
      damage *= (1 - this.config.blockReduction);
      defender.energy -= 5;
    } else if (defender.dodging) {
      damage *= (1 - this.config.dodgeReduction);
    }
    
    defender.health -= damage;
    defender.hitStun = 0.2;
    this.gameState.score[fighterIndex]++;
    
    if (defender.health <= 0) {
      this.knockout(fighterIndex);
    }
  }
  
  checkHits() {
    this.gameState.fighters.forEach((fighter, i) => {
      if (fighter.punching && fighter.punchCooldown > 0.3) {
        const opponent = this.gameState.fighters[1 - i];
        
        const dx = opponent.x - fighter.x;
        const dy = Math.abs(opponent.y - fighter.y);
        
        if (Math.abs(dx) < this.config.punchRange && dy < 40) {
          this.registerHit(i);
          fighter.punchCooldown = 0;
        }
      }
    });
  }
  
  aiUpdate(deltaTime) {
    const ai = this.gameState.fighters[1];
    const player = this.gameState.fighters[0];
    
    const dx = player.x - ai.x;
    const dist = Math.abs(dx);
    
    if (dist > 60) {
      if (dx > 0) ai.x += this.config.movementSpeed * 0.8;
      else ai.x -= this.config.movementSpeed * 0.8;
    }
    
    if (Math.random() < 0.02) {
      const direction = player.y > ai.y ? 1 : -1;
      ai.y += direction * this.config.movementSpeed * 0.5;
    }
    
    if (dist < this.config.punchRange && ai.punchCooldown <= 0 && Math.random() < 0.05) {
      this.punch(1);
    }
    
    if (player.punching && Math.random() < 0.3) {
      ai.blocking = true;
      setTimeout(() => { ai.blocking = false; }, 500);
    }
  }
  
  knockout(winnerIndex) {
    this.gameState.knockout = true;
    this.gameState.winner = this.players[winnerIndex];
    this.gameState.gameOver = true;
  }
  
  endRound() {
    this.gameState.currentRound++;
    
    if (this.gameState.currentRound > this.gameState.rounds) {
      if (this.gameState.fighters[0].health > this.gameState.fighters[1].health) {
        this.gameState.winner = this.players[0];
      } else if (this.gameState.fighters[1].health > this.gameState.fighters[0].health) {
        this.gameState.winner = this.players[1];
      } else {
        this.gameState.winner = 'Draw';
      }
      this.gameState.gameOver = true;
    } else {
      this.gameState.roundTime = this.gameState.timePerRound;
      this.gameState.fighters.forEach(f => {
        f.health = Math.min(100, f.health + 20);
        f.energy = 100;
      });
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    this.drawRing();
    this.drawFighters();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
    if (this.gameState.knockout) this.drawKO();
  }
  
  drawRing() {
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(50, 250, 700, 200);
    
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(80, 270, 640, 160);
    
    this.ctx.strokeStyle = '#c00';
    this.ctx.lineWidth = 5;
    this.ctx.beginPath();
    this.ctx.moveTo(100, 450);
    this.ctx.lineTo(200, 350);
    this.ctx.lineTo(300, 350);
    this.ctx.lineTo(100, 450);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(700, 450);
    this.ctx.lineTo(600, 350);
    this.ctx.lineTo(500, 350);
    this.ctx.lineTo(700, 450);
    this.ctx.stroke();
  }
  
  drawFighters() {
    this.gameState.fighters.forEach((fighter, i) => {
      const dir = i === 0 ? 1 : -1;
      
      if (fighter.hitStun > 0) {
        this.ctx.globalAlpha = 0.5 + Math.sin(this.gameState.time * 20) * 0.5;
      }
      
      this.ctx.fillStyle = i === 0 ? '#e74c3c' : '#3498db';
      this.ctx.beginPath();
      this.ctx.arc(fighter.x, fighter.y - 50, 20, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.fillRect(fighter.x - 15, fighter.y - 30, 30, 35);
      
      this.ctx.fillStyle = fighter.blocking ? '#888' : (i === 0 ? '#e74c3c' : '#3498db');
      this.ctx.fillRect(fighter.x - 15, fighter.y + 5, 30, 40);
      
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(fighter.x - 10, fighter.y + 45, 8, 15);
      this.ctx.fillRect(fighter.x + 2, fighter.y + 45, 8, 15);
      
      if (fighter.punching) {
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(fighter.x + dir * 40, fighter.y, 15, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      this.ctx.globalAlpha = 1;
      
      const healthBarWidth = 60;
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(fighter.x - healthBarWidth/2, fighter.y - 90, healthBarWidth, 8);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(fighter.x - healthBarWidth/2, fighter.y - 90, healthBarWidth * (fighter.health/100), 8);
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(fighter.x - healthBarWidth/2, fighter.y - 90, healthBarWidth, 8);
    });
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 180, 70);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${this.players[0]}: ${this.gameState.score[0]}`, 20, 30);
    this.ctx.fillText(`${this.players[1]}: ${this.gameState.score[1]}`, 20, 50);
    this.ctx.fillText(`Round ${this.gameState.currentRound}/3`, 20, 70);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BOXING', this.canvas.width / 2, 30);
    
    this.ctx.fillStyle = '#4ecdc4';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(`${Math.ceil(this.gameState.roundTime)}s`, this.canvas.width / 2, 55);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Winner: ${this.gameState.winner}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
  }
  
  drawKO() {
    this.ctx.fillStyle = '#ff0';
    this.ctx.font = 'bold 80px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('K.O.!', this.canvas.width / 2, this.canvas.height / 2 - 100);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.BoxingChampionGame = BoxingChampionGame;