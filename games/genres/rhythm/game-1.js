// Rhythm Game - Music Rhythm Game
class RhythmGame {
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
      combo: 0,
      maxCombo: 0,
      perfect: 0,
      good: 0,
      miss: 0,
      health: 100,
      status: 'playing',
      notes: [],
      lanes: [
        { x: 100, key: 'left', pressed: false },
        { x: 200, key: 'up', pressed: false },
        { x: 300, key: 'down', pressed: false },
        { x: 400, key: 'right', pressed: false }
      ],
      hitLine: 500,
      bpm: 120,
      lastBeat: 0,
      songLength: 60,
      startTime: 0
    };
    
    this.generateSong();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 600;
    this.canvas.height = this.canvas.parentElement.clientHeight || 700;
  }
  
  generateSong() {
    const { bpm, hitLine, songLength } = this.gameState;
    const beatInterval = 60 / bpm;
    const totalBeats = (songLength / beatInterval) * 4;
    
    this.gameState.notes = [];
    for (let i = 0; i < totalBeats; i++) {
      if (Math.random() > 0.3) {
        const laneCount = Math.random() > 0.7 ? 2 : 1;
        const lanes = [];
        
        for (let j = 0; j < laneCount; j++) {
          const lane = Math.floor(Math.random() * 4);
          if (!lanes.includes(lane)) {
            lanes.push(lane);
            
            this.gameState.notes.push({
              lane,
              beat: i,
              hit: false,
              y: -50
            });
          }
        }
      }
    }
  }
  
  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameState.startTime = this.gameState.time;
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
    const { bpm, hitLine, notes } = this.gameState;
    const beatInterval = 60 / bpm;
    const noteSpeed = 400;
    
    // Update notes
    notes.forEach(n => {
      if (!n.hit) {
        const targetBeat = n.beat * beatInterval / 4;
        n.y = -50 + (this.gameState.time - this.gameState.startTime - targetBeat) * noteSpeed;
        
        if (n.y > this.canvas.height + 50) {
          n.hit = true;
          this.gameState.miss++;
          this.gameState.combo = 0;
          this.gameState.health -= 5;
        }
      }
    });
    
    // Check input
    const input = this.getPlayerInput();
    this.gameState.lanes.forEach((lane, i) => {
      const keyPressed = input.keys && input.keys[lane.key];
      
      if (keyPressed && !lane.pressed) {
        lane.pressed = true;
        
        notes.forEach(n => {
          if (!n.hit && n.lane === i) {
            const dist = Math.abs(n.y - hitLine);
            
            if (dist < 30) {
              n.hit = true;
              this.gameState.combo++;
              this.gameState.maxCombo = Math.max(this.gameState.maxCombo, this.gameState.combo);
              
              if (dist < 10) {
                this.gameState.perfect++;
                this.gameState.score += 100 + this.gameState.combo * 10;
              } else {
                this.gameState.good++;
                this.gameState.score += 50 + this.gameState.combo * 5;
              }
              
              this.gameState.health = Math.min(100, this.gameState.health + 2);
            }
          }
        });
      }
      
      if (!keyPressed) lane.pressed = false;
    });
    
    // Check game over
    if (this.gameState.health <= 0 || this.gameState.time - this.gameState.startTime > this.gameState.songLength) {
      this.gameState.status = this.gameState.health > 0 ? 'won' : 'gameover';
    }
  }
  
  getPlayerInput() {
    const name = this.players[0] || 'Player';
    return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {};
  }
  
  render() {
    this.ctx.fillStyle = '#1a0a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Beat lines
    const { bpm, hitLine } = this.gameState;
    const beatInterval = 60 / bpm;
    const beatY = ((this.gameState.time - this.gameState.startTime) % beatInterval) / beatInterval * 100;
    
    for (let i = 0; i < 7; i++) {
      this.ctx.fillStyle = i === 3 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)';
      this.ctx.fillRect(50, (beatY + i * 100) % 700, 350, 2);
    }
    
    // Lanes
    this.gameState.lanes.forEach((lane, i) => {
      this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
      this.ctx.fillRect(lane.x - 30, 0, 60, this.canvas.height);
      
      // Key indicator
      this.ctx.fillStyle = lane.pressed ? '#e74c3c' : '#333';
      this.ctx.fillRect(lane.x - 25, hitLine - 5, 50, 10);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(['←', '↑', '↓', '→'][i], lane.x, hitLine + 30);
    });
    
    // Notes
    this.gameState.notes.forEach(n => {
      if (!n.hit && n.y > -50 && n.y < this.canvas.height + 50) {
        const lane = this.gameState.lanes[n.lane];
        
        if (n.y > hitLine - 30 && n.y < hitLine + 30) {
          this.ctx.fillStyle = '#f1c40f';
        } else if (n.y > hitLine + 30) {
          this.ctx.fillStyle = '#e74c3c';
        } else {
          this.ctx.fillStyle = '#3498db';
        }
        
        this.ctx.beginPath();
        this.ctx.arc(lane.x, n.y, 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText(n.lane + 1, lane.x, n.y + 5);
      }
    });
    
    // Hit line glow
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(50, hitLine);
    this.ctx.lineTo(400, hitLine);
    this.ctx.stroke();
    
    // UI
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, 10, 150, 100);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 35);
    this.ctx.fillText(`Combo: ${this.gameState.combo}`, 20, 60);
    
    // Health bar
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(10, 80, 140, 15);
    this.ctx.fillStyle = this.gameState.health > 30 ? '#2ecc71' : '#e74c3c';
    this.ctx.fillRect(10, 80, 140 * (this.gameState.health / 100), 15);
    
    // Stats
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(this.canvas.width - 100, 10, 90, 80);
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`Perfect: ${this.gameState.perfect}`, this.canvas.width - 15, 30);
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillText(`Good: ${this.gameState.good}`, this.canvas.width - 15, 50);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillText(`Miss: ${this.gameState.miss}`, this.canvas.width - 15, 70);
    
    // Time
    const remaining = Math.max(0, this.gameState.songLength - (this.gameState.time - this.gameState.startTime));
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(Math.ceil(remaining) + 's', this.canvas.width / 2, 40);
    
    if (this.gameState.status === 'gameover') {
      this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.font = 'bold 50px Arial';
      this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
    } else if (this.gameState.status === 'won') {
      this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#2ecc71';
      this.ctx.font = 'bold 50px Arial';
      this.ctx.fillText('PERFECT!', this.canvas.width / 2, this.canvas.height / 2);
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.RhythmGame = RhythmGame;