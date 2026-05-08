// Target Practice - Aim Training
class TargetPracticeGame {
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
    
    this.canvas.addEventListener('mousedown', () => {
      this.mouseDown = true;
      this.shotsFired++;
      this.recordShot();
    });
    
    this.canvas.addEventListener('mouseup', () => this.mouseDown = false);
    this.canvas.addEventListener('click', () => this.handleClick());
    
    this.gameState = {
      time: 0,
      score: 0,
      highScore: parseInt(localStorage.getItem('targetPracticeHighScore')) || 0,
      mode: 'classic',
      status: 'menu',
      targets: [],
      bullets: [],
      particles: [],
      hitMarkers: [],
      crosshair: { x: 400, y: 300 },
      sessionStats: {
        shots: 0,
        hits: 0,
        accuracy: 0,
        avgTime: 0,
        bestTime: Infinity,
        reactionTimes: [],
        perfectShots: 0,
        streak: 0,
        maxStreak: 0,
        headshots: 0,
        totalTargets: 0
      },
      settings: {
        targetSize: 30,
        spawnRate: 1000,
        targetLifetime: 3000,
        showTimer: true,
        showAccuracy: true,
        showCrosshair: true,
        soundEffects: true,
        difficulty: 'normal',
        targetTypes: ['circle', 'square', 'triangle', 'moving', 'shrinking']
      },
      currentMode: 'classic',
      modes: [
        { name: 'Classic', description: 'Hit as many targets as possible', duration: 60 },
        { name: 'Precision', description: 'Hit targets in the center for more points', duration: 90 },
        { name: 'Speed', description: 'React and shoot as fast as possible', duration: 45 },
        { name: 'Survival', description: 'Don\'t let targets expire', duration: 120 },
        { name: 'Endless', description: 'Practice forever, no time limit', duration: Infinity }
      ],
      gameTimer: 0,
      gameDuration: 60,
      roundActive: false,
      targetSpawnTimer: 0,
      difficulty: 1,
      combo: 0,
      multiplier: 1,
      lastHitTime: 0,
      perfectZoneRadius: 10
    };
    
    this.clicks = 0;
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
    this.gameState.crosshair = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
  }
  
  start() {
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
    this.gameState.time += deltaTime;
    this.gameState.crosshair.x = this.mousePos.x;
    this.gameState.crosshair.y = this.mousePos.y;
    
    if (this.gameState.status === 'playing') {
      this.gameState.gameTimer -= deltaTime / 1000;
      
      if (this.gameState.gameTimer <= 0 && this.gameState.currentMode !== 'Endless') {
        this.endGame();
        return;
      }
      
      this.updateTargets(deltaTime);
      this.updateBullets(deltaTime);
      this.updateParticles(deltaTime);
      this.updateHitMarkers(deltaTime);
      this.spawnTarget();
      this.calculateStats();
    }
  }
  
  spawnTarget() {
    const spawnRate = this.getSpawnRate();
    
    if (this.gameState.targets.length < 10 && 
        this.gameState.time - this.gameState.targetSpawnTimer > spawnRate) {
      
      const target = this.createTarget();
      this.gameState.targets.push(target);
      this.gameState.targetSpawnTimer = this.gameState.time;
      this.gameState.sessionStats.totalTargets++;
    }
  }
  
  getSpawnRate() {
    const baseRate = this.gameState.settings.spawnRate;
    const difficultyMod = {
      easy: 1.5,
      normal: 1,
      hard: 0.7,
      expert: 0.5
    };
    
    return baseRate * difficultyMod[this.gameState.settings.difficulty] / this.gameState.difficulty;
  }
  
  createTarget() {
    const padding = 60;
    const size = this.getTargetSize();
    const types = this.gameState.settings.targetTypes;
    const type = types[Math.floor(Math.random() * types.length)];
    
    return {
      x: padding + Math.random() * (this.canvas.width - padding * 2),
      y: padding + Math.random() * (this.canvas.height - padding * 2),
      size: size,
      type: type,
      spawnTime: this.gameState.time,
      lifetime: this.getTargetLifetime(),
      alive: true,
      points: this.getTargetPoints(type),
      angle: 0,
      rotationSpeed: type === 'moving' ? (Math.random() - 0.5) * 0.1 : 0,
      moveX: type === 'moving' ? (Math.random() - 0.5) * 3 : 0,
      moveY: type === 'moving' ? (Math.random() - 0.5) * 3 : 0,
      shrinkRate: type === 'shrinking' ? 2 : 0,
      color: this.getTargetColor(type),
      perfectHit: false
    };
  }
  
  getTargetSize() {
    const baseSize = this.gameState.settings.targetSize;
    const sizeMod = {
      easy: 1.3,
      normal: 1,
      hard: 0.8,
      expert: 0.6
    };
    
    return baseSize * sizeMod[this.gameState.settings.difficulty];
  }
  
  getTargetLifetime() {
    const baseLifetime = this.gameState.settings.targetLifetime;
    const difficultyMod = {
      easy: 1.5,
      normal: 1,
      hard: 0.7,
      expert: 0.5
    };
    
    return baseLifetime * difficultyMod[this.gameState.settings.difficulty];
  }
  
  getTargetPoints(type) {
    const basePoints = 100;
    
    const typeMultipliers = {
      circle: 1,
      square: 1.2,
      triangle: 1.5,
      moving: 2,
      shrinking: 2.5
    };
    
    return Math.floor(basePoints * (typeMultipliers[type] || 1) * this.gameState.difficulty);
  }
  
  getTargetColor(type) {
    const colors = {
      circle: '#ff4444',
      square: '#44ff44',
      triangle: '#4444ff',
      moving: '#ff44ff',
      shrinking: '#ffff44'
    };
    
    return colors[type] || '#ff4444';
  }
  
  updateTargets(deltaTime) {
    this.gameState.targets.forEach(target => {
      if (!target.alive) return;
      
      target.lifetime -= deltaTime;
      target.angle += target.rotationSpeed;
      
      if (target.moveX !== 0 || target.moveY !== 0) {
        target.x += target.moveX;
        target.y += target.moveY;
        
        if (target.x < 50 || target.x > this.canvas.width - 50) target.moveX *= -1;
        if (target.y < 50 || target.y > this.canvas.height - 50) target.moveY *= -1;
      }
      
      if (target.shrinkRate > 0) {
        target.size = Math.max(10, target.size - target.shrinkRate * deltaTime / 1000);
      }
      
      if (target.lifetime <= 0) {
        target.alive = false;
        this.gameState.sessionStats.streak = 0;
        this.gameState.combo = 0;
      }
    });
    
    this.gameState.targets = this.gameState.targets.filter(t => t.alive);
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
      particle.lifetime -= deltaTime;
      particle.size *= 0.95;
    });
    
    this.gameState.particles = this.gameState.particles.filter(p => p.lifetime > 0);
  }
  
  updateHitMarkers(deltaTime) {
    this.gameState.hitMarkers.forEach(marker => {
      marker.lifetime -= deltaTime;
    });
    
    this.gameState.hitMarkers = this.gameState.hitMarkers.filter(m => m.lifetime > 0);
  }
  
  handleClick() {
    if (this.gameState.status === 'menu') {
      return;
    }
    
    if (!this.gameState.roundActive) {
      this.startGame();
      return;
    }
    
    const cx = this.gameState.crosshair.x;
    const cy = this.gameState.crosshair.y;
    
    this.gameState.bullets.push({
      x: cx,
      y: cy,
      active: true,
      life: 100
    });
    
    let hitAny = false;
    
    this.gameState.targets.forEach(target => {
      if (!target.alive) return;
      
      const dist = this.getDistance({ x: cx, y: cy }, target);
      
      if (dist < target.size) {
        this.hitTarget(target, cx, cy);
        hitAny = true;
      }
    });
    
    if (!hitAny) {
      this.gameState.sessionStats.streak = 0;
      this.gameState.combo = 0;
    }
  }
  
  recordShot() {
    if (this.gameState.status !== 'playing') return;
    
    const timeSinceLastHit = this.gameState.time - this.gameState.lastHitTime;
    
    if (this.gameState.lastHitTime > 0 && timeSinceLastHit < 2000) {
      this.gameState.sessionStats.reactionTimes.push(timeSinceLastHit);
    }
  }
  
  hitTarget(target, cx, cy) {
    target.alive = false;
    
    this.gameState.sessionStats.hits++;
    this.gameState.sessionStats.streak++;
    this.gameState.combo++;
    
    if (this.gameState.sessionStats.streak > this.gameState.sessionStats.maxStreak) {
      this.gameState.sessionStats.maxStreak = this.gameState.sessionStats.streak;
    }
    
    const dist = this.getDistance({ x: cx, y: cy }, target);
    
    if (dist < this.gameState.perfectZoneRadius) {
      target.perfectHit = true;
      this.gameState.sessionStats.perfectShots++;
    }
    
    const comboMultiplier = Math.min(this.gameState.combo, 10);
    const points = target.points * comboMultiplier;
    
    this.gameState.score += points;
    this.gameState.lastHitTime = this.gameState.time;
    
    this.createHitEffect(target.x, target.y, target.color, target.perfectHit);
    this.addHitMarker(cx, cy, target.perfectHit);
    this.playSound('hit');
  }
  
  getDistance(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }
  
  createHitEffect(x, y, color, isPerfect) {
    const particleCount = isPerfect ? 30 : 15;
    const size = isPerfect ? 8 : 5;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      
      this.gameState.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: isPerfect ? '#ffffff' : color,
        size: size + Math.random() * size,
        lifetime: isPerfect ? 600 : 400
      });
    }
    
    if (isPerfect) {
      this.gameState.particles.push({
        x: x,
        y: y - 30,
        text: 'PERFECT!',
        color: '#ffffff',
        lifetime: 600,
        isText: true
      });
    }
  }
  
  addHitMarker(x, y, isPerfect) {
    this.gameState.hitMarkers.push({
      x: x,
      y: y,
      size: isPerfect ? 20 : 15,
      lifetime: 300,
      perfect: isPerfect
    });
  }
  
  calculateStats() {
    if (this.gameState.sessionStats.shots > 0) {
      this.gameState.sessionStats.accuracy = 
        Math.round((this.gameState.sessionStats.hits / this.gameState.sessionStats.shots) * 100);
    }
    
    if (this.gameState.sessionStats.reactionTimes.length > 0) {
      const sum = this.gameState.sessionStats.reactionTimes.reduce((a, b) => a + b, 0);
      this.gameState.sessionStats.avgTime = 
        Math.round(sum / this.gameState.sessionStats.reactionTimes.length);
    }
  }
  
  setMode(modeIndex) {
    this.gameState.currentMode = this.gameState.modes[modeIndex].name;
    this.gameState.gameDuration = this.gameState.modes[modeIndex].duration;
  }
  
  setDifficulty(difficulty) {
    this.gameState.settings.difficulty = difficulty;
    this.gameState.difficulty = {
      easy: 0.8,
      normal: 1,
      hard: 1.3,
      expert: 1.6
    }[difficulty];
  }
  
  startGame() {
    this.gameState.status = 'playing';
    this.gameState.roundActive = true;
    this.gameState.gameTimer = this.gameState.gameDuration;
    this.gameState.score = 0;
    this.gameState.combo = 0;
    this.gameState.targets = [];
    this.gameState.bullets = [];
    this.gameState.particles = [];
    this.gameState.hitMarkers = [];
    this.gameState.sessionStats = {
      shots: 0,
      hits: 0,
      accuracy: 0,
      avgTime: 0,
      bestTime: Infinity,
      reactionTimes: [],
      perfectShots: 0,
      streak: 0,
      maxStreak: 0,
      headshots: 0,
      totalTargets: 0
    };
    this.gameState.targetSpawnTimer = 0;
    this.gameState.lastHitTime = 0;
    this.clicks = 0;
  }
  
  endGame() {
    this.gameState.status = 'gameover';
    this.gameState.roundActive = false;
    
    if (this.gameState.score > this.gameState.highScore) {
      this.gameState.highScore = this.gameState.score;
      localStorage.setItem('targetPracticeHighScore', this.gameState.highScore);
    }
    
    this.playSound('gameover');
  }
  
  playSound(type) {
    if (!this.gameState.settings.soundEffects) return;
    
    if (typeof AudioContext !== 'undefined') {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        const frequencies = {
          hit: 800,
          gameover: 300
        };
        
        oscillator.frequency.value = frequencies[type] || 440;
        oscillator.type = type === 'hit' ? 'sine' : 'square';
        gainNode.gain.value = 0.05;
        
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.stop(audioCtx.currentTime + 0.1);
      } catch (e) {}
    }
  }
  
  render() {
    const ctx = this.ctx;
    
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (this.gameState.status === 'menu') {
      this.renderMenu();
      return;
    }
    
    this.renderGrid();
    this.renderTargets();
    this.renderBullets();
    this.renderParticles();
    this.renderHitMarkers();
    this.renderCrosshair();
    this.renderUI();
    
    if (this.gameState.status === 'gameover') {
      this.renderGameOver();
    }
  }
  
  renderMenu() {
    const ctx = this.ctx;
    
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TARGET PRACTICE', this.canvas.width / 2, 80);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText('Aim Training Module', this.canvas.width / 2, 115);
    
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(100, 150, this.canvas.width - 200, 280);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Select Mode:', 120, 180);
    
    this.gameState.modes.forEach((mode, index) => {
      const y = 210 + index * 45;
      
      ctx.fillStyle = index === 0 ? '#e94560' : '#533483';
      ctx.fillRect(120, y, 300, 35);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.fillText(mode.name, 130, y + 23);
      
      if (index === 0) {
        ctx.font = '12px Arial';
        ctx.fillStyle = '#cccccc';
        ctx.fillText(mode.description, 440, y + 23);
      }
    });
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Arial';
    ctx.fillText('Difficulty:', 120, 430);
    
    const difficulties = ['easy', 'normal', 'hard', 'expert'];
    difficulties.forEach((diff, index) => {
      const x = 230 + index * 80;
      
      ctx.fillStyle = diff === 'normal' ? '#e94560' : '#533483';
      ctx.fillRect(x, 425, 70, 30);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(diff.toUpperCase(), x + 35, 447);
    });
    
    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CLICK TO START', this.canvas.width / 2, 520);
    
    ctx.fillStyle = '#888888';
    ctx.font = '14px Arial';
    ctx.fillText(`High Score: ${this.gameState.highScore}`, this.canvas.width / 2, 550);
  }
  
  renderGrid() {
    const ctx = this.ctx;
    
    ctx.strokeStyle = '#16213e';
    ctx.lineWidth = 1;
    
    for (let x = 0; x < this.canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y < this.canvas.height; y += 40) {
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
      
      ctx.save();
      ctx.translate(target.x, target.y);
      ctx.rotate(target.angle);
      
      ctx.fillStyle = target.color;
      
      switch (target.type) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, target.size, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, target.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = target.color;
          ctx.beginPath();
          ctx.arc(0, 0, target.size * 0.3, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'square':
          ctx.fillRect(-target.size, -target.size, target.size * 2, target.size * 2);
          
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-target.size * 0.5, -target.size * 0.5, target.size, target.size);
          break;
          
        case 'triangle':
          ctx.beginPath();
          ctx.moveTo(0, -target.size);
          ctx.lineTo(target.size, target.size);
          ctx.lineTo(-target.size, target.size);
          ctx.closePath();
          ctx.fill();
          
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(0, -target.size * 0.3);
          ctx.lineTo(target.size * 0.3, target.size * 0.3);
          ctx.lineTo(-target.size * 0.3, target.size * 0.3);
          ctx.closePath();
          ctx.fill();
          break;
          
        case 'moving':
        case 'shrinking':
          ctx.beginPath();
          ctx.arc(0, 0, target.size, 0, Math.PI * 2);
          ctx.fill();
          
          const ringCount = 3;
          for (let i = 1; i <= ringCount; i++) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 - i * 0.15})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, target.size * (i / ringCount), 0, Math.PI * 2);
            ctx.stroke();
          }
          break;
      }
      
      ctx.restore();
    });
  }
  
  renderBullets() {
    const ctx = this.ctx;
    
    this.gameState.bullets.forEach(bullet => {
      if (!bullet.active) return;
      
      ctx.fillStyle = '#ffffff';
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
        ctx.globalAlpha = particle.lifetime / 600;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(particle.text, particle.x, particle.y);
        ctx.globalAlpha = 1;
        return;
      }
      
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.lifetime / 600;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }
  
  renderHitMarkers() {
    const ctx = this.ctx;
    
    this.gameState.hitMarkers.forEach(marker => {
      ctx.strokeStyle = marker.perfect ? '#ffffff' : '#ff4444';
      ctx.lineWidth = 2;
      ctx.globalAlpha = marker.lifetime / 300;
      
      const size = marker.size;
      
      ctx.beginPath();
      ctx.moveTo(marker.x - size, marker.y - size);
      ctx.lineTo(marker.x - size / 2, marker.y - size / 2);
      ctx.moveTo(marker.x + size, marker.y - size);
      ctx.lineTo(marker.x + size / 2, marker.y - size / 2);
      ctx.moveTo(marker.x - size, marker.y + size);
      ctx.lineTo(marker.x - size / 2, marker.y + size / 2);
      ctx.moveTo(marker.x + size, marker.y + size);
      ctx.lineTo(marker.x + size / 2, marker.y + size / 2);
      ctx.stroke();
      
      ctx.globalAlpha = 1;
    });
  }
  
  renderCrosshair() {
    if (!this.gameState.settings.showCrosshair) return;
    
    const ctx = this.ctx;
    const cx = this.gameState.crosshair.x;
    const cy = this.gameState.crosshair.y;
    
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy);
    ctx.lineTo(cx - 4, cy);
    ctx.moveTo(cx + 4, cy);
    ctx.lineTo(cx + 12, cy);
    ctx.moveTo(cx, cy - 12);
    ctx.lineTo(cx, cy - 4);
    ctx.moveTo(cx, cy + 4);
    ctx.lineTo(cx, cy + 12);
    ctx.stroke();
    
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();
    
    if (this.gameState.combo > 1) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.gameState.combo}x`, cx, cy - 20);
    }
  }
  
  renderUI() {
    const ctx = this.ctx;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.gameState.score}`, 20, 40);
    
    ctx.textAlign = 'right';
    ctx.fillText(`High: ${this.gameState.highScore}`, this.canvas.width - 20, 40);
    
    if (this.gameState.currentMode !== 'Endless') {
      const timerColor = this.gameState.gameTimer < 10 ? '#ff4444' : '#ffffff';
      ctx.fillStyle = timerColor;
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(Math.ceil(this.gameState.gameTimer).toString(), this.canvas.width / 2, 45);
    }
    
    if (this.gameState.settings.showAccuracy) {
      ctx.fillStyle = '#888888';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      
      const stats = this.gameState.sessionStats;
      
      if (this.gameState.roundActive) {
        ctx.fillText(`Hits: ${stats.hits} / ${this.clicks}`, 20, 75);
        ctx.fillText(`Accuracy: ${stats.accuracy}%`, 20, 95);
        
        if (stats.avgTime > 0) {
          ctx.fillText(`Avg Time: ${stats.avgTime}ms`, 20, 115);
        }
        
        if (stats.maxStreak > 0) {
          ctx.fillText(`Best Streak: ${stats.maxStreak}`, 20, 135);
        }
        
        if (stats.perfectShots > 0) {
          ctx.fillStyle = '#ffff00';
          ctx.fillText(`Perfect: ${stats.perfectShots}`, 20, 155);
        }
      }
    }
    
    if (this.gameState.combo > 5) {
      ctx.fillStyle = '#ff8800';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.gameState.combo} COMBO!`, this.canvas.width / 2, this.canvas.height - 40);
    }
  }
  
  renderGameOver() {
    const ctx = this.ctx;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SESSION COMPLETE', this.canvas.width / 2, 80);
    
    const stats = this.gameState.sessionStats;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '28px Arial';
    ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, 140);
    
    ctx.fillStyle = '#888888';
    ctx.font = '20px Arial';
    ctx.fillText(`Accuracy: ${stats.accuracy}%`, this.canvas.width / 2, 190);
    ctx.fillText(`Hits: ${stats.hits} / ${this.clicks}`, this.canvas.width / 2, 220);
    ctx.fillText(`Best Streak: ${stats.maxStreak}`, this.canvas.width / 2, 250);
    ctx.fillText(`Perfect Hits: ${stats.perfectShots}`, this.canvas.width / 2, 280);
    
    if (stats.avgTime > 0) {
      ctx.fillText(`Average Reaction: ${stats.avgTime}ms`, this.canvas.width / 2, 310);
    }
    
    if (stats.bestTime < Infinity) {
      ctx.fillText(`Best Reaction: ${stats.bestTime}ms`, this.canvas.width / 2, 340);
    }
    
    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('CLICK TO PLAY AGAIN', this.canvas.width / 2, 420);
  }
  
  restart() {
    this.gameState.status = 'menu';
    this.gameState.roundActive = false;
    this.gameState.score = 0;
    this.gameState.targets = [];
    this.gameState.bullets = [];
    this.gameState.particles = [];
    this.gameState.hitMarkers = [];
    this.gameState.sessionStats = {
      shots: 0,
      hits: 0,
      accuracy: 0,
      avgTime: 0,
      bestTime: Infinity,
      reactionTimes: [],
      perfectShots: 0,
      streak: 0,
      maxStreak: 0,
      headshots: 0,
      totalTargets: 0
    };
    this.clicks = 0;
    this.start();
  }
}

window.TargetPracticeGame = TargetPracticeGame;

window.addEventListener('click', function(e) {
  if (window.targetPracticeGameInstance && window.targetPracticeGameInstance.gameState.status === 'menu') {
    window.targetPracticeGameInstance.startGame();
  } else if (window.targetPracticeGameInstance && window.targetPracticeGameInstance.gameState.status === 'gameover') {
    window.targetPracticeGameInstance.restart();
  }
});

window.targetPracticeGameInstance = null;
window.TargetPracticeGame = TargetPracticeGame;