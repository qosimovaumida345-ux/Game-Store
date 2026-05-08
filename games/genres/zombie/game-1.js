// Zombie Survival - Horror Game
class ZombieSurvivalGame {
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
      wave: 1,
      status: 'playing',
      survivors: [],
      zombies: [],
      bullets: [],
      items: [],
      particles: []
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.players.forEach((p, i) => {
      this.gameState.survivors.push({
        name: p,
        x: 100 + i * 80,
        y: this.canvas.height / 2,
        speed: 4,
        radius: 20,
        health: 100,
        ammo: 30,
        weapon: 'pistol',
        lastShot: 0,
        color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24'][i % 4]
      });
    });
    
    this.spawnZombies(5);
  }
  
  spawnZombies(count) {
    for (let i = 0; i < count; i++) {
      const side = Math.floor(Math.random() * 4);
      let x, y;
      
      switch(side) {
        case 0: x = Math.random() * this.canvas.width; y = -30; break;
        case 1: x = this.canvas.width + 30; y = Math.random() * this.canvas.height; break;
        case 2: x = Math.random() * this.canvas.width; y = this.canvas.height + 30; break;
        case 3: x = -30; y = Math.random() * this.canvas.height; break;
      }
      
      this.gameState.zombies.push({
        x, y,
        speed: 1.5 + Math.random(),
        radius: 18,
        health: 3,
        damage: 20,
        type: Math.floor(Math.random() * 3),
        frame: 0
      });
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
    
    this.gameState.survivors.forEach(survivor => {
      const input = this.getPlayerInput(survivor.name);
      
      let vx = 0, vy = 0;
      if (input.left) vx = -survivor.speed;
      if (input.right) vx = survivor.speed;
      if (input.up) vy = -survivor.speed;
      if (input.down) vy = survivor.speed;
      
      survivor.x += vx;
      survivor.y += vy;
      
      survivor.x = Math.max(survivor.radius, Math.min(this.canvas.width - survivor.radius, survivor.x));
      survivor.y = Math.max(survivor.radius, Math.min(this.canvas.height - survivor.radius, survivor.y));
      
      if (input.action && survivor.ammo > 0 && this.gameState.time - survivor.lastShot > 0.3) {
        this.fireBullet(survivor);
        survivor.lastShot = this.gameState.time;
        survivor.ammo--;
      }
    });
    
    this.gameState.bullets.forEach((bullet, i) => {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      
      if (bullet.x < 0 || bullet.x > this.canvas.width || bullet.y < 0 || bullet.y > this.canvas.height) {
        this.gameState.bullets.splice(i, 1);
      }
    });
    
    this.gameState.zombies.forEach(zombie => {
      const nearest = this.findNearestSurvivor(zombie);
      if (nearest) {
        const angle = Math.atan2(nearest.y - zombie.y, nearest.x - zombie.x);
        zombie.x += Math.cos(angle) * zombie.speed;
        zombie.y += Math.sin(angle) * zombie.speed;
      }
      
      zombie.frame += deltaTime * 5;
    });
    
    this.gameState.bullets.forEach((bullet, bi) => {
      this.gameState.zombies.forEach((zombie, zi) => {
        const dx = bullet.x - zombie.x;
        const dy = bullet.y - zombie.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < zombie.radius + bullet.radius) {
          zombie.health--;
          this.gameState.bullets.splice(bi, 1);
          this.createBloodParticles(zombie.x, zombie.y);
          
          if (zombie.health <= 0) {
            this.gameState.zombies.splice(zi, 1);
            this.gameState.score += 10;
            this.dropItem(zombie.x, zombie.y);
          }
        }
      });
    });
    
    this.gameState.survivors.forEach((survivor, si) => {
      this.gameState.zombies.forEach(zombie => {
        const dx = survivor.x - zombie.x;
        const dy = survivor.y - zombie.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < survivor.radius + zombie.radius) {
          survivor.health -= zombie.damage * deltaTime;
          
          if (survivor.health <= 0) {
            this.gameState.survivors.splice(si, 1);
          }
        }
      });
    });
    
    this.gameState.items = this.gameState.items.filter(item => {
      this.gameState.survivors.forEach(survivor => {
        const dx = survivor.x - item.x;
        const dy = survivor.y - item.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < survivor.radius + 20) {
          if (item.type === 'health') survivor.health = Math.min(100, survivor.health + 30);
          if (item.type === 'ammo') survivor.ammo += 20;
          return false;
        }
      });
      return true;
    });
    
    this.gameState.particles = this.gameState.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime;
      return p.life > 0;
    });
    
    if (this.gameState.zombies.length === 0) {
      this.gameState.wave++;
      this.spawnZombies(5 + this.gameState.wave * 2);
    }
    
    if (this.gameState.survivors.length === 0) {
      this.gameState.status = 'gameover';
    }
  }
  
  getPlayerInput(name) {
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  findNearestSurvivor(zombie) {
    let nearest = null;
    let minDist = Infinity;
    
    this.gameState.survivors.forEach(survivor => {
      const dx = survivor.x - zombie.x;
      const dy = survivor.y - zombie.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearest = survivor;
      }
    });
    
    return nearest;
  }
  
  fireBullet(survivor) {
    const nearest = this.findNearestSurvivor(survivor);
    let angle = 0;
    
    if (nearest) {
      angle = Math.atan2(nearest.y - survivor.y, nearest.x - survivor.x);
    }
    
    this.gameState.bullets.push({
      x: survivor.x,
      y: survivor.y,
      vx: Math.cos(angle) * 15,
      vy: Math.sin(angle) * 15,
      radius: 4
    });
  }
  
  createBloodParticles(x, y) {
    for (let i = 0; i < 15; i++) {
      this.gameState.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 0.5,
        color: '#ff0000',
        size: Math.random() * 4 + 2
      });
    }
  }
  
  dropItem(x, y) {
    if (Math.random() > 0.3) return;
    
    const type = Math.random() > 0.5 ? 'health' : 'ammo';
    this.gameState.items.push({ x, y, type });
  }
  
  render() {
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawFloor();
    this.drawItems();
    this.drawZombies();
    this.drawSurvivors();
    this.drawBullets();
    this.drawParticles();
    this.drawUI();
    
    if (this.gameState.status === 'gameover') {
      this.drawGameOver();
    }
  }
  
  drawFloor() {
    for (let x = 0; x < this.canvas.width; x += 50) {
      for (let y = 0; y < this.canvas.height; y += 50) {
        this.ctx.strokeStyle = '#222';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, 50, 50);
      }
    }
  }
  
  drawItems() {
    this.gameState.items.forEach(item => {
      const pulse = Math.sin(this.gameState.time * 5) * 3;
      this.ctx.fillStyle = item.type === 'health' ? '#00ff00' : '#ffff00';
      this.ctx.beginPath();
      this.ctx.arc(item.x, item.y, 15 + pulse, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(item.type === 'health' ? '+' : 'A', item.x, item.y + 5);
    });
  }
  
  drawZombies() {
    this.gameState.zombies.forEach(zombie => {
      const offset = Math.sin(zombie.frame) * 5;
      
      this.ctx.fillStyle = '#4a4a4a';
      this.ctx.fillRect(zombie.x - zombie.radius, zombie.y - zombie.radius + offset, zombie.radius * 2, zombie.radius * 2);
      
      this.ctx.fillStyle = '#800000';
      this.ctx.beginPath();
      this.ctx.arc(zombie.x, zombie.y + offset, zombie.radius * 0.7, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fillRect(zombie.x - 8, zombie.y - 8 + offset, 6, 6);
      this.ctx.fillRect(zombie.x + 2, zombie.y - 8 + offset, 6, 6);
      
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(zombie.x - 5, zombie.y + 5 + offset, 10, 4);
    });
  }
  
  drawSurvivors() {
    this.gameState.survivors.forEach(survivor => {
      this.ctx.fillStyle = survivor.color;
      this.ctx.beginPath();
      this.ctx.arc(survivor.x, survivor.y, survivor.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(survivor.name.substring(0, 3), survivor.x, survivor.y - 25);
    });
  }
  
  drawBullets() {
    this.ctx.fillStyle = '#ffff00';
    this.gameState.bullets.forEach(bullet => {
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
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
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 180, 70);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Wave: ${this.gameState.wave}`, 20, 30);
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 50);
    this.ctx.fillText(`Zombies: ${this.gameState.zombies.length}`, 20, 70);
    
    this.gameState.survivors.forEach((survivor, i) => {
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(10, this.canvas.height - 40 - i * 35, 200, 30);
      
      this.ctx.fillStyle = survivor.color;
      this.ctx.font = '14px Arial';
      this.ctx.fillText(`${survivor.name}: ${Math.floor(survivor.health)}HP | ${survivor.ammo}am`, 20, this.canvas.height - 20 - i * 35);
    });
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ff0000';
    this.ctx.font = 'bold 60px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.fillText(`Waves Survived: ${this.gameState.wave - 1}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
    this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 70);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.ZombieSurvivalGame = ZombieSurvivalGame;