// Quick Shot - Reflex Shooter
class QuickShotGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.players = players;
    this.gameId = gameId;
    this.isRunning = false;
    this.lastTime = 0;
    this.mousePos = { x: 0, y: 0 };
    this.mouseDown = false;
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    this.canvas.addEventListener('mousemove', e => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos.x = e.clientX - rect.left;
      this.mousePos.y = e.clientY - rect.top;
    });
    
    this.canvas.addEventListener('mousedown', () => this.mouseDown = true);
    this.canvas.addEventListener('mouseup', () => {
      this.mouseDown = false;
      this.clicks++;
    });
    this.canvas.addEventListener('click', () => this.shoot());
    
    this.gameState = {
      time: 0,
      score: 0,
      highScore: parseInt(localStorage.getItem('quickShotHighScore')) || 0,
      level: 1,
      lives: 3,
      status: 'playing',
      player: null,
      targets: [],
      bullets: [],
      particles: [],
      crosshair: { x: 0, y: 0 },
      shootTimer: 0,
      roundTime: 60,
      roundTimer: 60,
      roundInProgress: false,
      totalRounds: 10,
      currentRound: 1,
      accuracy: 100,
      hits: 0,
      shots: 0,
      reactionTime: 0,
      averageReaction: 0,
      reactionTimes: [],
      combo: 0,
      maxCombo: 0,
      bonuses: [],
      specialEvents: [],
      lastTargetTime: 0,
      targetSpawnRate: 1000,
      difficulty: 1,
      multiplier: 1,
      lastShotTime: 0,
      precisionBonus: false,
      speedBonus: false,
      streak: 0,
      perfectRounds: 0
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.targets = [];
    this.gameState.bonuses = [];
  }
  
  start() {
    this.gameState.roundInProgress = true;
    this.gameState.roundTimer = this.gameState.roundTime;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }
  
  gameLoop() {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    const deltaTime = Math.min(currentTime - this.lastTime, 50);
    this.lastTime = currentTime;
    
    this.update(deltaTime);
    this.render();
    
    requestAnimationFrame(() => this.gameLoop());
  }
  
  update(deltaTime) {
    if (this.gameState.status !== 'playing') return;
    
    this.gameState.time += deltaTime;
    this.gameState.crosshair.x = this.mousePos.x;
    this.gameState.crosshair.y = this.mousePos.y;
    
    if (this.gameState.roundInProgress) {
      this.gameState.roundTimer -= deltaTime / 1000;
      
      if (this.gameState.roundTimer <= 0) {
        this.endRound();
        return;
      }
      
      this.updateTargets(deltaTime);
      this.updateBonuses(deltaTime);
      this.updateBullets(deltaTime);
      this.checkTargetCollision();
      this.spawnTargets();
    }
    
    this.updateParticles(deltaTime);
    
    this.gameState.reactionTime = this.gameState.time - this.gameState.lastTargetTime;
  }
  
  spawnTargets() {
    if (!this.gameState.roundInProgress) return;
    
    const maxTargets = 3 + this.gameState.level;
    const spawnRate = Math.max(300, 1000 - this.gameState.level * 50);
    
    if (this.gameState.targets.length < maxTargets && 
        this.gameState.time - this.gameState.lastTargetTime > spawnRate) {
      this.spawnTarget();
      this.gameState.lastTargetTime = this.gameState.time;
    }
  }
  
  spawnTarget() {
    const padding = 80;
    const target = {
      x: padding + Math.random() * (this.canvas.width - padding * 2),
      y: padding + Math.random() * (this.canvas.height - padding * 2),
      radius: 15 + Math.random() * 20,
      spawnTime: this.gameState.time,
      type: this.getRandomTargetType(),
      points: this.getTargetPoints(),
      alive: true,
      fading: false,
      fadeStart: 0,
      lifetime: 2000 + Math.random() * 2000 - this.gameState.difficulty * 100,
      hitEffect: false,
      special: Math.random() < 0.1
    };
    
    this.gameState.targets.push(target);
  }
  
  getRandomTargetType() {
    const types = ['normal', 'gold', 'red', 'blue', 'moving'];
    const weights = [0.6, 0.15, 0.1, 0.1, 0.05];
    
    let typeIndex = 0;
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        typeIndex = i;
        break;
      }
    }
    
    return types[typeIndex];
  }
  
  getTargetPoints() {
    const basePoints = 100;
    return Math.floor(basePoints * this.gameState.difficulty);
  }
  
  updateTargets(deltaTime) {
    this.gameState.targets.forEach(target => {
      if (!target.alive) return;
      
      if (!target.fading) {
        target.lifetime -= deltaTime;
        
        if (target.lifetime <= 0) {
          target.fading = true;
          target.fadeStart = this.gameState.time;
          this.gameState.streak = 0;
        }
      } else {
        const fadeTime = 500;
        if (this.gameState.time - target.fadeStart > fadeTime) {
          target.alive = false;
        }
      }
      
      if (target.type === 'moving' && !target.fading) {
        target.x += Math.sin(this.gameState.time / 500) * 2;
        target.y += Math.cos(this.gameState.time / 400) * 1.5;
      }
    });
    
    this.gameState.targets = this.gameState.targets.filter(t => t.alive);
  }
  
  updateBonuses(deltaTime) {
    if (Math.random() < 0.003 && this.gameState.bonuses.length < 3) {
      this.gameState.bonuses.push({
        x: Math.random() * (this.canvas.width - 100) + 50,
        y: Math.random() * (this.canvas.height - 100) + 50,
        type: ['points', 'time', 'precision', 'multiplier'][Math.floor(Math.random() * 4)],
        radius: 15,
        alive: true,
        angle: 0
      });
    }
    
    this.gameState.bonuses.forEach(bonus => {
      bonus.angle += 0.05;
    });
    
    this.gameState.bonuses = this.gameState.bonuses.filter(b => b.alive);
  }
  
  updateBullets(deltaTime) {
    this.gameState.bullets.forEach(bullet => {
      bullet.life -= deltaTime;
      
      if (bullet.life <= 0) {
        bullet.active = false;
      }
    });
    
    this.gameState.bullets = this.gameState.bullets.filter(b => b.active !== false);
  }
  
  updateParticles(deltaTime) {
    this.gameState.particles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.95;
      particle.vy *= 0.95;
      particle.lifetime -= deltaTime;
      particle.size *= 0.95;
    });
    
    this.gameState.particles = this.gameState.particles.filter(p => p.lifetime > 0);
  }
  
  shoot() {
    if (!this.gameState.roundInProgress) return;
    
    this.gameState.shots++;
    this.gameState.lastShotTime = this.gameState.time;
    
    this.gameState.bullets.push({
      x: this.gameState.crosshair.x,
      y: this.gameState.crosshair.y,
      active: true,
      life: 100
    });
    
    this.playSound('shoot');
  }
  
  checkTargetCollision() {
    const cx = this.gameState.crosshair.x;
    const cy = this.gameState.crosshair.y;
    
    this.gameState.targets.forEach(target => {
      if (!target.alive || target.fading) return;
      
      const dist = Math.sqrt(Math.pow(cx - target.x, 2) + Math.pow(cy - target.y, 2));
      
      if (dist < target.radius) {
        this.hitTarget(target);
      }
    });
    
    this.gameState.bonuses.forEach(bonus => {
      if (!bonus.alive) return;
      
      const dist = Math.sqrt(Math.pow(cx - bonus.x, 2) + Math.pow(cy - bonus.y, 2));
      
      if (dist < bonus.radius) {
        this.collectBonus(bonus);
        bonus.alive = false;
      }
    });
  }
  
  hitTarget(target) {
    target.alive = false;
    target.hitEffect = true;
    
    this.gameState.hits++;
    this.gameState.streak++;
    
    if (this.gameState.streak > this.gameState.maxCombo) {
      this.gameState.maxCombo = this.gameState.streak;
    }
    
    const reactionBonus = this.gameState.reactionTime < 500 ? 2 : 1;
    const typeMultiplier = target.type === 'gold' ? 3 : target.type === 'red' ? 2 : 1;
    const specialMultiplier = target.special ? 5 : 1;
    
    const points = target.points * reactionBonus * typeMultiplier * specialMultiplier * this.gameState.multiplier;
    this.gameState.score += points;
    
    this.gameState.combo++;
    
    if (this.gameState.reactionTime < 300) {
      this.gameState.precisionBonus = true;
      setTimeout(() => this.gameState.precisionBonus = false, 1000);
    }
    
    this.createHitEffect(target.x, target.y, target.type);
    this.playSound('hit');
    
    this.gameState.reactionTimes.push(this.gameState.reactionTime);
    
    if (this.gameState.reactionTimes.length > 0) {
      this.gameState.averageReaction = this.gameState.reactionTimes.reduce((a, b) => a + b, 0) / 
                                       this.gameState.reactionTimes.length;
    }
  }
  
  collectBonus(bonus) {
    switch (bonus.type) {
      case 'points':
        this.gameState.score += 500;
        break;
      case 'time':
        this.gameState.roundTimer += 5;
        break;
      case 'precision':
        this.gameState.precisionBonus = true;
        setTimeout(() => this.gameState.precisionBonus = false, 2000);
        break;
      case 'multiplier':
        this.gameState.multiplier = Math.min(5, this.gameState.multiplier + 1);
        setTimeout(() => this.gameState.multiplier = 1, 5000);
        break;
    }
    
    this.createBonusEffect(bonus.x, bonus.y);
    this.playSound('bonus');
  }
  
  createHitEffect(x, y, type) {
    const colors = {
      normal: '#ffff00',
      gold: '#ffd700',
      red: '#ff0000',
      blue: '#0088ff',
      moving: '#ff00ff'
    };
    
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      
      this.gameState.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[type] || '#ffff00',
        size: 4 + Math.random() * 4,
        lifetime: 400
      });
    }
    
    this.gameState.particles.push({
      x: x,
      y: y - 20,
      text: '+' + (100 * this.gameState.multiplier),
      color: '#ffffff',
      lifetime: 500,
      isText: true
    });
  }
  
  createBonusEffect(x, y) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      
      this.gameState.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#00ff00',
        size: 3,
        lifetime: 300
      });
    }
  }
  
  endRound() {
    this.gameState.roundInProgress = false;
    
    this.gameState.accuracy = this.gameState.shots > 0 ? 
      Math.round((this.gameState.hits / this.gameState.shots) * 100) : 0;
    
    if (this.gameState.accuracy === 100 && this.gameState.hits > 0) {
      this.gameState.perfectRounds++;
    }
    
    if (this.gameState.currentRound < this.gameState.totalRounds) {
      setTimeout(() => this.startNextRound(), 2000);
    } else {
      this.endGame();
    }
  }
  
  startNextRound() {
    this.gameState.currentRound++;
    this.gameState.level++;
    this.gameState.difficulty = 1 + (this.gameState.currentRound - 1) * 0.2;
    this.gameState.targets = [];
    this.gameState.bullets = [];
    this.gameState.bonuses = [];
    this.gameState.hits = 0;
    this.gameState.shots = 0;
    this.gameState.combo = 0;
    this.gameState.reactionTimes = [];
    this.gameState.multiplier = 1;
    this.gameState.roundTimer = this.gameState.roundTime;
    this.gameState.roundInProgress = true;
  }
  
  endGame() {
    this.gameState.status = 'gameover';
    this.isRunning = false;
    
    const bonusScore = this.gameState.perfectRounds * 1000;
    const accuracyBonus = Math.floor(this.gameState.accuracy * 10);
    this.gameState.score += bonusScore + accuracyBonus;
    
    if (this.gameState.score > this.gameState.highScore) {
      this.gameState.highScore = this.gameState.score;
      localStorage.setItem('quickShotHighScore', this.gameState.highScore);
    }
  }
  
  playSound(type) {
    if (typeof AudioContext !== 'undefined') {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        const frequencies = {
          shoot: 500,
          hit: 800,
          bonus: 1200
        };
        
        oscillator.frequency.value = frequencies[type] || 440;
        oscillator.type = 'square';
        gainNode.gain.value = 0.05;
        
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        oscillator.stop(audioCtx.currentTime + 0.05);
      } catch (e) {}
    }
  }
  
  render() {
    const ctx = this.ctx;
    
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.renderBackground();
    this.renderTargets();
    this.renderBonuses();
    this.renderBullets();
    this.renderParticles();
    this.renderCrosshair();
    this.renderUI();
    
    if (this.gameState.status === 'gameover') {
      this.renderGameOver();
    }
  }
  
  renderBackground() {
    const ctx = this.ctx;
    
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    
    for (let x = 0; x < this.canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y < this.canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }
  }
  
  renderTargets() {
    const ctx = this.ctx;
    
    this.gameState.targets.forEach(target => {
      if (!target.alive) return;
      
      let alpha = 1;
      if (target.fading) {
        alpha = 1 - (this.gameState.time - target.fadeStart) / 500;
      }
      
      ctx.globalAlpha = alpha;
      
      const colors = {
        normal: '#ffff00',
        gold: '#ffd700',
        red: '#ff0000',
        blue: '#0088ff',
        moving: '#ff00ff'
      };
      
      const color = colors[target.type] || '#ffff00';
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
      
      if (target.special) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius + 5, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('2x', target.x, target.y + 4);
      }
      
      ctx.globalAlpha = 1;
      
      if (target.hitEffect) {
        target.hitEffect = false;
      }
    });
  }
  
  renderBonuses() {
    const ctx = this.ctx;
    
    this.gameState.bonuses.forEach(bonus => {
      if (!bonus.alive) return;
      
      ctx.save();
      ctx.translate(bonus.x, bonus.y);
      ctx.rotate(bonus.angle);
      
      const colors = {
        points: '#ffd700',
        time: '#00ff00',
        precision: '#00ffff',
        multiplier: '#ff00ff'
      };
      
      ctx.fillStyle = colors[bonus.type];
      ctx.beginPath();
      ctx.moveTo(0, -bonus.radius);
      ctx.lineTo(bonus.radius, 0);
      ctx.lineTo(0, bonus.radius);
      ctx.lineTo(-bonus.radius, 0);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const symbols = { points: '$', time: '+', precision: 'P', multiplier: 'x' };
      ctx.fillText(symbols[bonus.type], 0, 0);
      
      ctx.restore();
    });
  }
  
  renderBullets() {
    const ctx = this.ctx;
    
    this.gameState.bullets.forEach(bullet => {
      if (!bullet.active) return;
      
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  
  renderParticles() {
    const ctx = this.ctx;
    
    this.gameState.particles.forEach(particle => {
      if (particle.isText) {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.lifetime / 500;
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(particle.text, particle.x, particle.y);
        ctx.globalAlpha = 1;
        return;
      }
      
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.lifetime / 400;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }
  
  renderCrosshair() {
    const ctx = this.ctx;
    const cx = this.gameState.crosshair.x;
    const cy = this.gameState.crosshair.y;
    
    ctx.strokeStyle = this.gameState.precisionBonus ? '#00ff00' : '#ff0000';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy);
    ctx.lineTo(cx - 5, cy);
    ctx.moveTo(cx + 5, cy);
    ctx.lineTo(cx + 15, cy);
    ctx.moveTo(cx, cy - 15);
    ctx.lineTo(cx, cy - 5);
    ctx.moveTo(cx, cy + 5);
    ctx.lineTo(cx, cy + 15);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = this.gameState.precisionBonus ? '#00ff00' : '#ff0000';
    ctx.fill();
    
    if (this.gameState.multiplier > 1) {
      ctx.fillStyle = '#ff00ff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.gameState.multiplier}x`, cx, cy - 25);
    }
  }
  
  renderUI() {
    const ctx = this.ctx;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.gameState.score}`, 20, 35);
    ctx.fillText(`Round: ${this.gameState.currentRound}/${this.gameState.totalRounds}`, 20, 65);
    
    ctx.textAlign = 'right';
    ctx.fillText(`High: ${this.gameState.highScore}`, this.canvas.width - 20, 35);
    ctx.fillText(`Lives: ${this.gameState.lives}`, this.canvas.width - 20, 65);
    
    if (this.gameState.roundInProgress) {
      const timeColor = this.gameState.roundTimer < 10 ? '#ff0000' : '#ffffff';
      ctx.fillStyle = timeColor;
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(Math.ceil(this.gameState.roundTimer), this.canvas.width / 2, 45);
    }
    
    ctx.fillStyle = '#888888';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Hits: ${this.gameState.hits}/${this.gameState.shots}`, 20, 95);
    
    if (this.gameState.reactionTimes.length > 0) {
      ctx.fillText(`Avg: ${Math.floor(this.gameState.averageReaction)}ms`, 20, 120);
    }
    
    if (this.gameState.streak > 2) {
      ctx.fillStyle = '#ff8800';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.gameState.streak} STREAK!`, this.canvas.width / 2, this.canvas.height - 50);
    }
    
    if (this.gameState.precisionBonus) {
      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PRECISION!', this.canvas.width / 2, 80);
    }
    
    if (!this.gameState.roundInProgress && this.gameState.status !== 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Round ${this.gameState.currentRound} Complete!`, this.canvas.width / 2, this.canvas.height / 2 - 20);
      
      ctx.font = '20px Arial';
      ctx.fillText(`Accuracy: ${this.gameState.accuracy}%`, this.canvas.width / 2, this.canvas.height / 2 + 20);
      ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
  }
  
  renderGameOver() {
    const ctx = this.ctx;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    ctx.fillStyle = '#ff8800';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 80);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '28px Arial';
    ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 - 20);
    
    ctx.fillStyle = '#888888';
    ctx.font = '20px Arial';
    ctx.fillText(`Accuracy: ${this.gameState.accuracy}%`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    ctx.fillText(`Best Combo: ${this.gameState.maxCombo}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
    ctx.fillText(`Perfect Rounds: ${this.gameState.perfectRounds}`, this.canvas.width / 2, this.canvas.height / 2 + 80);
    ctx.fillText(`Avg Reaction: ${Math.floor(this.gameState.averageReaction)}ms`, this.canvas.width / 2, this.canvas.height / 2 + 110);
    
    ctx.fillStyle = '#00ff00';
    ctx.font = '18px Arial';
    ctx.fillText('Click to restart', this.canvas.width / 2, this.canvas.height / 2 + 160);
  }
  
  restart() {
    this.gameState = {
      time: 0,
      score: 0,
      highScore: this.gameState.highScore,
      level: 1,
      lives: 3,
      status: 'playing',
      player: null,
      targets: [],
      bullets: [],
      particles: [],
      crosshair: { x: this.canvas.width / 2, y: this.canvas.height / 2 },
      shootTimer: 0,
      roundTime: 60,
      roundTimer: 60,
      roundInProgress: true,
      totalRounds: 10,
      currentRound: 1,
      accuracy: 100,
      hits: 0,
      shots: 0,
      reactionTime: 0,
      averageReaction: 0,
      reactionTimes: [],
      combo: 0,
      maxCombo: 0,
      bonuses: [],
      specialEvents: [],
      lastTargetTime: 0,
      targetSpawnRate: 1000,
      difficulty: 1,
      multiplier: 1,
      lastShotTime: 0,
      precisionBonus: false,
      speedBonus: false,
      streak: 0,
      perfectRounds: 0,
      clicks: 0
    };
    
    this.start();
  }
}

window.QuickShotGame = QuickShotGame;