// Street Combat - Fighting Game
class StreetCombatGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.players = players;
    this.gameId = gameId;
    this.isRunning = false;
    this.lastTime = 0;
    
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    this.config = {
      gravity: 0.6,
      groundY: this.canvas.height - 80,
      roundTime: 60,
      rounds: 3,
      knockback: 15
    };
    
    this.gameState = {
      time: 0,
      round: 1,
      status: 'playing',
      fighters: {},
      projectiles: [],
      particles: []
    };
    
    this.fighters = {};
    this.setupFighters();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
    this.config.groundY = this.canvas.height - 80;
  }
  
  setupFighters() {
    const fighters = [
      { name: 'Ryu', color: '#ff0000', speed: 5, power: 10, special: 'hadouken' },
      { name: 'Ken', color: '#0066cc', speed: 5, power: 10, special: 'shoryuken' },
      { name: 'Chun-Li', color: '#00ccff', speed: 7, power: 8, special: 'spinningBirdKick' },
      { name: 'Guile', color: '#006600', speed: 4, power: 12, special: 'sonicBoom' }
    ];
    
    this.players.forEach((player, index) => {
      const fighter = fighters[index % fighters.length];
      this.fighters[player] = {
        name: player,
        displayName: fighter.name,
        x: index === 0 ? 150 : this.canvas.width - 200,
        y: this.config.groundY,
        vx: 0,
        vy: 0,
        width: 60,
        height: 100,
        color: fighter.color,
        speed: fighter.speed,
        power: fighter.power,
        special: fighter.special,
        health: 100,
        energy: 0,
        state: 'idle',
        facing: index === 0 ? 1 : -1,
        attacking: false,
        attackFrame: 0,
        blocking: false,
        stunned: 0,
        combo: 0,
        roundWins: 0,
        frame: 0,
        hitboxes: [],
        hurtbox: { x: 0, y: 0, width: 60, height: 100 }
      };
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
    this.gameState.time += deltaTime;
    
    Object.values(this.fighters).forEach(fighter => {
      this.handleFighterInput(fighter);
      this.updateFighterPhysics(fighter, deltaTime);
      this.updateFighterState(fighter, deltaTime);
      this.checkFighterCollisions(fighter);
    });
    
    this.updateProjectiles(deltaTime);
    this.updateParticles(deltaTime);
    this.checkRoundEnd();
  }
  
  handleFighterInput(fighter) {
    const input = this.getPlayerInput(fighter.name);
    
    fighter.vx = 0;
    
    if (fighter.stunned > 0) return;
    
    if (input.left) { fighter.vx = -fighter.speed; fighter.facing = -1; }
    if (input.right) { fighter.vx = fighter.speed; fighter.facing = 1; }
    
    if (input.up && fighter.y >= this.config.groundY) {
      fighter.vy = -15;
    }
    
    if (input.punch && !fighter.attacking) {
      this.performAttack(fighter, 'punch');
    }
    
    if (input.kick && !fighter.attacking) {
      this.performAttack(fighter, 'kick');
    }
    
    if (input.block) {
      fighter.blocking = true;
    } else {
      fighter.blocking = false;
    }
    
    if (input.special && fighter.energy >= 50 && !fighter.attacking) {
      this.performSpecial(fighter);
    }
  }
  
  getPlayerInput(name) {
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  performAttack(fighter, type) {
    fighter.attacking = true;
    fighter.state = type;
    fighter.attackFrame = 0;
    
    const damage = type === 'kick' ? fighter.power + 5 : fighter.power;
    const range = type === 'kick' ? 80 : 50;
    
    fighter.hitboxes = [{
      x: fighter.facing > 0 ? fighter.x + fighter.width : fighter.x - range,
      y: fighter.y + 20,
      width: range,
      height: 40,
      damage: damage,
      type: type
    }];
    
    setTimeout(() => {
      fighter.attacking = false;
      fighter.state = 'idle';
      fighter.hitboxes = [];
    }, 300);
  }
  
  performSpecial(fighter) {
    fighter.energy = 0;
    fighter.attacking = true;
    fighter.state = 'special';
    
    if (fighter.special === 'hadouken' || fighter.special === 'sonicBoom') {
      this.gameState.projectiles.push({
        x: fighter.facing > 0 ? fighter.x + fighter.width : fighter.x - 40,
        y: fighter.y + 40,
        vx: fighter.facing * 12,
        vy: 0,
        width: 40,
        height: 30,
        owner: fighter.name,
        damage: 25,
        color: fighter.special === 'hadouken' ? '#00FFFF' : '#FF6600'
      });
    } else if (fighter.special === 'shoryuken' || fighter.special === 'spinningBirdKick') {
      fighter.vy = -20;
      fighter.vx = fighter.facing * 8;
    }
    
    setTimeout(() => {
      fighter.attacking = false;
      fighter.state = 'idle';
    }, 500);
  }
  
  updateFighterPhysics(fighter, deltaTime) {
    fighter.vy += this.config.gravity;
    fighter.y += fighter.vy;
    fighter.x += fighter.vx;
    
    if (fighter.y >= this.config.groundY) {
      fighter.y = this.config.groundY;
      fighter.vy = 0;
    }
    
    fighter.x = Math.max(20, Math.min(this.canvas.width - fighter.width - 20, fighter.x));
  }
  
  updateFighterState(fighter, deltaTime) {
    if (fighter.stunned > 0) {
      fighter.stunned -= deltaTime;
      fighter.state = 'stunned';
    } else if (fighter.attacking) {
      fighter.attackFrame += deltaTime * 10;
    } else if (fighter.vx !== 0) {
      fighter.state = 'running';
    } else if (fighter.y < this.config.groundY) {
      fighter.state = 'jumping';
    } else {
      fighter.state = 'idle';
    }
    
    fighter.frame += deltaTime * 10;
    
    if (fighter.health < 30) fighter.energy += 0.1;
    fighter.energy = Math.min(100, fighter.energy);
  }
  
  checkFighterCollisions(attacker) {
    if (!attacker.hitboxes.length || attacker.stunned > 0) return;
    
    attacker.hitboxes.forEach(hitbox => {
      Object.values(this.fighters).forEach(defender => {
        if (defender.name === attacker.name) return;
        
        const dx = hitbox.x + hitbox.width / 2 - (defender.x + defender.width / 2);
        const dy = hitbox.y + hitbox.height / 2 - (defender.y + defender.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 50 && !defender.attacking) {
          if (defender.blocking) {
            this.createBlockParticles(defender);
          } else {
            this.applyDamage(defender, hitbox.damage, attacker.facing);
            attacker.combo++;
            this.createHitParticles(defender);
          }
          
          attacker.hitboxes = [];
        }
      });
    });
  }
  
  applyDamage(fighter, damage, direction) {
    fighter.health -= damage;
    fighter.stunned = 0.5;
    fighter.vx = direction * this.config.knockback;
    fighter.vy = -5;
    
    this.createHitEffect(fighter);
  }
  
  createHitParticles(fighter) {
    for (let i = 0; i < 15; i++) {
      this.gameState.particles.push({
        x: fighter.x + fighter.width / 2,
        y: fighter.y + 30,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 0.5,
        color: '#FFFF00',
        size: Math.random() * 5 + 3
      });
    }
  }
  
  createBlockParticles(fighter) {
    for (let i = 0; i < 10; i++) {
      this.gameState.particles.push({
        x: fighter.x + fighter.width / 2,
        y: fighter.y + 40,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 0.3,
        color: '#FFFFFF',
        size: Math.random() * 3 + 2
      });
    }
  }
  
  createHitEffect(fighter) {
    fighter.hitEffect = true;
    setTimeout(() => fighter.hitEffect = false, 150);
  }
  
  updateProjectiles(deltaTime) {
    this.gameState.projectiles = this.gameState.projectiles.filter(proj => {
      proj.x += proj.vx;
      
      Object.values(this.fighters).forEach(fighter => {
        if (fighter.name === proj.owner) return;
        
        if (proj.x < fighter.x + fighter.width && proj.x + proj.width > fighter.x &&
            proj.y < fighter.y + fighter.height && proj.y + proj.height > fighter.y) {
          if (!fighter.blocking) {
            this.applyDamage(fighter, proj.damage, proj.vx > 0 ? 1 : -1);
          }
          return false;
        }
      });
      
      return proj.x > -50 && proj.x < this.canvas.width + 50;
    });
  }
  
  updateParticles(deltaTime) {
    this.gameState.particles = this.gameState.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime;
      return p.life > 0;
    });
  }
  
  checkRoundEnd() {
    const deadFighters = Object.values(this.fighters).filter(f => f.health <= 0);
    
    if (deadFighters.length > 0) {
      this.gameState.status = 'roundEnd';
      deadFighters.forEach(f => {
        const winner = Object.values(this.fighters).find(g => g.name !== f.name);
        if (winner) winner.roundWins++;
      });
      
      setTimeout(() => {
        this.resetRound();
      }, 3000);
    }
  }
  
  resetRound() {
    this.gameState.status = 'playing';
    this.gameState.round++;
    this.setupFighters();
    this.gameState.projectiles = [];
    this.gameState.particles = [];
  }
  
  render() {
    this.drawBackground();
    this.drawArena();
    
    Object.values(this.fighters).forEach(f => this.drawFighter(f));
    this.drawProjectiles();
    this.drawParticles();
    this.drawUI();
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawArena() {
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(0, this.config.groundY + 100, this.canvas.width, 20);
    
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillRect(0, this.config.groundY + 100, this.canvas.width, 5);
    
    this.ctx.fillStyle = '#FF0000';
    this.ctx.fillRect(100, 20, 30, 20);
    this.ctx.fillText('1', 115, 35);
    
    this.ctx.fillStyle = '#0000FF';
    this.ctx.fillRect(this.canvas.width - 130, 20, 30, 20);
    this.ctx.fillText('2', this.canvas.width - 115, 35);
  }
  
  drawFighter(fighter) {
    this.ctx.save();
    this.ctx.translate(fighter.x + fighter.width / 2, fighter.y);
    if (fighter.facing < 0) this.ctx.scale(-1, 1);
    this.ctx.translate(-fighter.width / 2, 0);
    
    if (fighter.hitEffect) {
      this.ctx.filter = 'brightness(2)';
    }
    
    this.ctx.fillStyle = fighter.color;
    this.ctx.fillRect(0, 0, fighter.width, fighter.height * 0.6);
    
    this.ctx.fillStyle = '#FFCCAA';
    this.ctx.fillRect(10, -30, 40, 35);
    
    this.ctx.fillStyle = '#000';
    const eyeX = fighter.state === 'stunned' ? 0 : 8;
    this.ctx.fillRect(15 + eyeX, -22, 6, 6);
    this.ctx.fillRect(30 + eyeX, -22, 6, 6);
    
    if (fighter.state === 'punch') {
      this.ctx.fillStyle = fighter.color;
      const punchX = fighter.facing > 0 ? fighter.width : -30;
      this.ctx.fillRect(punchX, 20, 30, 20);
    } else if (fighter.state === 'kick') {
      this.ctx.fillStyle = fighter.color;
      const kickX = fighter.facing > 0 ? fighter.width : -40;
      this.ctx.fillRect(kickX, 50, 40, 20);
    } else if (fighter.state === 'special') {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.beginPath();
      this.ctx.arc(fighter.width / 2, 0, 25, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    if (fighter.blocking) {
      this.ctx.strokeStyle = '#00FFFF';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(-5, -35, fighter.width + 10, fighter.height + 35);
    }
    
    this.ctx.restore();
    
    this.drawHealthBar(fighter);
  }
  
  drawHealthBar(fighter) {
    const barX = fighter.x - 20;
    const barY = fighter.y - 50;
    
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(barX, barY, 100, 15);
    
    this.ctx.fillStyle = '#FF0000';
    this.ctx.fillRect(barX + 2, barY + 2, 96, 11);
    
    this.ctx.fillStyle = '#00FF00';
    this.ctx.fillRect(barX + 2, barY + 2, 96 * (fighter.health / 100), 11);
    
    this.ctx.fillStyle = '#00FFFF';
    this.ctx.fillRect(barX, barY + 18, fighter.energy, 5);
  }
  
  drawProjectiles() {
    this.gameState.projectiles.forEach(proj => {
      this.ctx.fillStyle = proj.color;
      this.ctx.beginPath();
      this.ctx.ellipse(proj.x + proj.width / 2, proj.y + proj.height / 2, 
                      proj.width / 2, proj.height / 2, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
      this.ctx.beginPath();
      this.ctx.ellipse(proj.x + proj.width / 2 - 5, proj.y + proj.height / 2 - 5, 
                      10, 5, 0, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawParticles() {
    this.gameState.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(this.canvas.width / 2 - 50, 10, 100, 30);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Round ${this.gameState.round}`, this.canvas.width / 2, 32);
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, this.canvas.height - 40, 150, 30);
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Time: ${Math.max(0, this.config.roundTime - this.gameState.time)}s`, 20, this.canvas.height - 18);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.StreetCombatGame = StreetCombatGame;