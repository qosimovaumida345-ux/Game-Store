// Street Fighter Style Game
class StreetFighterGame {
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
      p1: null,
      p2: null,
      p1Health: 100,
      p2Health: 100,
      p1Meter: 0,
      p2Meter: 0,
      roundTimer: 99,
      timer: 99,
      status: 'fighting',
      gameOver: false,
      winner: null,
      hitStun: false,
      blockStun: false,
      combo: 0,
      lastHitBy: null
    };
    
    this.physics = {
      gravity: 0.8,
      jumpForce: 15,
      moveSpeed: 5,
      groundFriction: 0.85
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.p1 = this.createCharacter(150, 400, '#3498db', 'Ken');
    this.gameState.p2 = this.createCharacter(600, 400, '#e74c3c', 'Ryu');
    this.gameState.p2.facingLeft = true;
    this.gameState.timer = this.gameState.roundTimer;
  }
  
  createCharacter(x, y, color, name) {
    return {
      x, y, vx: 0, vy: 0,
      width: 50, height: 100,
      color, name,
      health: 100,
      meter: 0,
      state: 'idle',
      frame: 0,
      facingLeft: false,
      grounded: true,
      blocking: false,
      hitStun: 0,
      attackBox: null,
      specialMeter: 0,
      hasSuper: false
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
    this.gameState.timer -= deltaTime;
    
    if (this.gameState.timer <= 0) {
      if (this.gameState.p1.health > this.gameState.p2.health) {
        this.endRound('player1');
      } else if (this.gameState.p2.health > this.gameState.p1.health) {
        this.endRound('player2');
      } else {
        this.gameState.timer = 10;
      }
    }
    
    const input1 = this.getPlayerInput('player1');
    const input2 = this.getPlayerInput('player2');
    
    this.updateCharacter(this.gameState.p1, input1);
    this.updateCharacter(this.gameState.p2, input2);
    
    this.gameState.p1.facingLeft = this.gameState.p2.x < this.gameState.p1.x;
    this.gameState.p2.facingLeft = this.gameState.p1.x < this.gameState.p2.x;
    
    this.checkAttacks(this.gameState.p1, this.gameState.p2, 'player1');
    this.checkAttacks(this.gameState.p2, this.gameState.p1, 'player2');
    
    if (this.gameState.p1.hitStun > 0) this.gameState.p1.hitStun -= deltaTime * 60;
    if (this.gameState.p2.hitStun > 0) this.gameState.p2.hitStun -= deltaTime * 60;
  }
  
  updateCharacter(char, input) {
    if (char.hitStun > 0) {
      char.state = 'hitstun';
      char.vx *= 0.8;
      char.vy += this.physics.gravity;
      char.x += char.vx;
      char.y += char.vy;
      this.handleGround(char);
      char.x = Math.max(50, Math.min(750, char.x));
      return;
    }
    
    if (input.left) {
      char.vx = -this.physics.moveSpeed;
    } else if (input.right) {
      char.vx = this.physics.moveSpeed;
    } else {
      char.vx *= this.physics.groundFriction;
    }
    
    if (input.jump && char.grounded) {
      char.vy = -this.physics.jumpForce;
      char.grounded = false;
    }
    
    if (input.block) {
      char.blocking = true;
      char.state = 'blocking';
    } else {
      char.blocking = false;
      
      if (input.punch) {
        this.attack(char, 'punch', 8, 15);
      } else if (input.kick) {
        this.attack(char, 'kick', 10, 20);
      } else if (input.special) {
        this.attack(char, 'hadouken', 15, 30);
      }
    }
    
    char.vy += this.physics.gravity;
    
    char.x += char.vx;
    char.y += char.vy;
    
    this.handleGround(char);
    
    char.x = Math.max(50, Math.min(750, char.x));
    
    if (Math.abs(char.vx) > 0.5) {
      char.state = 'walking';
    } else if (!char.grounded) {
      char.state = 'jumping';
    } else if (char.blocking) {
      char.state = 'blocking';
    } else {
      char.state = 'idle';
    }
    
    char.frame++;
  }
  
  handleGround(char) {
    if (char.y >= 400) {
      char.y = 400;
      char.vy = 0;
      char.grounded = true;
    }
  }
  
  attack(char, type, damage, pushback) {
    if (char.state.includes('attack')) return;
    
    char.state = type;
    char.frame = 0;
    
    const direction = char.facingLeft ? -1 : 1;
    char.attackBox = {
      x: char.x + (direction * 30),
      y: char.y - 40,
      width: 60,
      height: 60,
      type: type,
      damage: damage,
      pushback: pushback,
      active: true
    };
    
    setTimeout(() => {
      char.attackBox = null;
      char.state = 'idle';
    }, 300);
  }
  
  checkAttacks(attacker, defender, attackerName) {
    if (!attacker.attackBox || !attacker.attackBox.active) return;
    
    const box = attacker.attackBox;
    const dx = Math.abs((attacker.x + (attacker.facingLeft ? -30 : 30)) - defender.x);
    const dy = Math.abs(attacker.y - defender.y);
    
    if (dx < 50 && dy < 50) {
      if (defender.blocking) {
        defender.vx = attacker.facingLeft ? -5 : 5;
        this.gameState[attackerName === 'player1' ? 'p1Meter' : 'p2Meter'] = Math.min(100, this.gameState[attackerName === 'player1' ? 'p1Meter' : 'p2Meter'] + 5);
      } else {
        defender.health -= box.damage;
        defender.vx = attacker.facingLeft ? -box.pushback/10 : box.pushback/10;
        defender.vy = -5;
        defender.hitStun = 20;
        
        this.gameState.combo++;
        this.gameState.lastHitBy = attackerName;
        
        this.gameState[attackerName === 'player1' ? 'p1Meter' : 'p2Meter'] = Math.min(100, this.gameState[attackerName === 'player1' ? 'p1Meter' : 'p2Meter'] + 15);
        
        if (this.gameState[attackerName === 'player1' ? 'p1Meter' : 'p2Meter'] >= 100) {
          this.gameState[attackerName === 'player1' ? 'p1Meter' : 'p2Meter'] = 100;
        }
      }
      
      attacker.attackBox.active = false;
      
      if (defender.health <= 0) {
        this.endRound(attackerName);
      }
    }
  }
  
  endRound(winner) {
    if (this.gameState.round >= 3) {
      this.gameState.gameOver = true;
      this.gameState.winner = winner;
    } else {
      this.gameState.round++;
      this.gameState.p1.health = 100;
      this.gameState.p2.health = 100;
      this.gameState.p1.x = 150;
      this.gameState.p2.x = 600;
      this.gameState.timer = this.gameState.roundTimer;
    }
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, 600);
    bgGrad.addColorStop(0, '#1a1a2e');
    bgGrad.addColorStop(0.5, '#2c3e50');
    bgGrad.addColorStop(1, '#0a0a1a');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, 800, 600);
    
    this.ctx.fillStyle = '#2c2c3a';
    this.ctx.fillRect(0, 500, 800, 100);
    this.ctx.fillStyle = '#1a1a2a';
    this.ctx.fillRect(0, 480, 800, 20);
    
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillRect(20, 20, 250, 25);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(530, 20, 250, 25);
    
    const p1HealthBar = Math.max(0, this.gameState.p1.health);
    const p2HealthBar = Math.max(0, this.gameState.p2.health);
    
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(22, 22, 246 * (p1HealthBar/100), 21);
    this.ctx.fillStyle = '#27ae60';
    this.ctx.fillRect(22, 22, 246 * (p1HealthBar/100), 10);
    
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(532, 22, 246 * (p2HealthBar/100), 21);
    this.ctx.fillStyle = '#27ae60';
    this.ctx.fillRect(532, 22, 246 * (p2HealthBar/100), 10);
    
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(20, 20, 250, 25);
    this.ctx.strokeRect(530, 20, 250, 25);
    
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillRect(20, 50, this.gameState.p1Meter * 2.5, 10);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(530, 50, this.gameState.p2Meter * 2.5, 10);
    
    this.drawCharacter(this.gameState.p1);
    this.drawCharacter(this.gameState.p2);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(Math.ceil(this.gameState.timer), 400, 40);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = '20px Arial';
    this.ctx.fillText('ROUND ' + this.gameState.round, 400, 25);
    
    if (this.gameState.combo > 1) {
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.font = 'bold 30px Arial';
      const comboX = this.gameState.lastHitBy === 'player1' ? 200 : 600;
      this.ctx.fillText(this.gameState.combo + ' COMBO!', comboX, 200);
    }
    
    if (this.gameState.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, 800, 600);
      
      this.ctx.fillStyle = '#ffd93d';
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillText(this.gameState.winner === 'player1' ? 'PLAYER 1 WINS!' : 'PLAYER 2 WINS!', 400, 300);
    }
  }
  
  drawCharacter(char) {
    this.ctx.save();
    this.ctx.translate(char.x, char.y);
    
    if (char.facingLeft) {
      this.ctx.scale(-1, 1);
    }
    
    if (char.hitStun > 0) {
      this.ctx.globalAlpha = 0.7 + Math.sin(this.gameState.time * 20) * 0.3;
    }
    
    this.ctx.fillStyle = char.color;
    this.ctx.fillRect(-25, -80, 50, 80);
    
    this.ctx.fillStyle = '#ffe4c4';
    this.ctx.beginPath();
    this.ctx.arc(0, -90, 20, 0, Math.PI*2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#000';
    if (char.state === 'hitstun') {
      this.ctx.beginPath();
      this.ctx.arc(-5, -92, 4, 0, Math.PI*2);
      this.ctx.arc(5, -92, 4, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.fillStyle = '#fff';
      this.ctx.beginPath();
      this.ctx.arc(0, -85, 10, 0, Math.PI);
      this.ctx.fill();
    } else if (char.state.includes('punch') || char.state.includes('kick')) {
      this.ctx.fillRect(-10, -85, 20, 8);
    } else {
      this.ctx.beginPath();
      this.ctx.arc(-5, -92, 3, 0, Math.PI*2);
      this.ctx.arc(5, -92, 3, 0, Math.PI*2);
      this.ctx.fill();
    }
    
    if (char.blocking) {
      this.ctx.strokeStyle = '#3498db';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(0, -40, 40, -Math.PI/2, Math.PI/2);
      this.ctx.stroke();
    }
    
    if (char.attackBox && char.attackBox.active) {
      this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      this.ctx.fillRect(char.attackBox.x - char.x - 30, char.attackBox.y - char.y - 50, char.attackBox.width, char.attackBox.height);
    }
    
    this.ctx.restore();
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.StreetFighterGame = StreetFighterGame;