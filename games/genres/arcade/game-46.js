// Bubble Bobble Style Game
class BubbleBobbleGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.players = players; this.gameId = gameId;
    this.isRunning = false; this.lastTime = 0; this.resizeCanvas();
    this.gameState = { time: 0, score: 0, p1: null, p2: null, enemies: [], bubbles: [], fruits: [], level: 1, platforms: [], gravity: 600, status: 'playing', gameOver: false };
    this.initGame();
  }
  resizeCanvas() { this.canvas.width = this.parentElement.clientWidth || 800; this.canvas.height = this.parentElement.clientHeight || 600; }
  initGame() {
    this.gameState.p1 = { x: 100, y: 450, vx: 0, vy: 0, grounded: false, facing: 1, bubble: null, popTimer: 0 };
    this.gameState.p2 = { x: 700, y: 450, vx: 0, vy: 0, grounded: false, facing: -1, bubble: null, popTimer: 0 };
    this.gameState.platforms = [{ x: 0, y: 520, w: 800, h: 20 }, { x: 100, y: 400, w: 100, h: 15 }, { x: 300, y: 350, w: 100, h: 15 }, { x: 500, y: 400, w: 100, h: 15 }, { x: 200, y: 250, w: 150, h: 15 }, { x: 450, y: 200, w: 150, h: 15 }, { x: 300, y: 120, w: 200, h: 15 }];
    this.gameState.enemies = [{ x: 400, y: 480, vx: 50, vy: 0, type: 'monsta' }, { x: 350, y: 320, vx: 40, vy: 0, type: 'monsta' }];
    const fruitTypes = ['#e74c3c', '#f1c40f', '#2ecc71', '#9b59b6', '#e67e22']; for (let i = 0; i < 10; i++) this.gameState.fruits.push({ x: 150 + i * 50, y: 50 + Math.random() * 100, type: fruitTypes[i % 5], collected: false });
  }
  start() { this.isRunning = true; this.lastTime = performance.now(); this.gameLoop(this.lastTime); }
  stop() { this.isRunning = false; }
  gameLoop(ct) { if (!this.isRunning) return; const dt = (ct - this.lastTime) / 1000; this.lastTime = ct; this.update(dt); this.render(); requestAnimationFrame(t => this.gameLoop(t)); }
  update(dt) {
    if (this.gameState.gameOver) return; this.gameState.time += dt;
    [this.gameState.p1, this.gameState.p2].forEach((p, idx) => {
      const i = this.getPlayerInput(idx === 0 ? 'player1' : 'player2');
      if (i.left) { p.vx = -200; p.facing = -1; } else if (i.right) { p.vx = 200; p.facing = 1; } else p.vx = 0;
      if (i.jump && p.grounded) { p.vy = -350; p.grounded = false; }
      if (i.shoot && !p.bubble) { p.bubble = { x: p.x + p.facing * 20, y: p.y, vx: p.facing * 200, vy: 0, caught: null }; }
      p.vy += this.gameState.gravity * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      p.grounded = false; this.gameState.platforms.forEach(plat => { if (p.x + 15 > plat.x && p.x < plat.x + plat.w && p.y + 25 > plat.y && p.y + 25 < plat.y + plat.h + 10 && p.vy > 0) { p.y = plat.y - 25; p.vy = 0; p.grounded = true; } });
      p.x = Math.max(20, Math.min(780, p.x));
      if (p.bubble) { const b = p.bubble; b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 100 * dt; if (b.y > 550 || Math.abs(b.x - p.x) > 200) p.bubble = null; }
    });
    this.gameState.enemies.forEach(e => { e.x += e.vx * dt; if (e.x < 20 || e.x > 780) e.vx *= -1; e.vy += this.gameState.gravity * dt; e.y += e.vy * dt; this.gameState.platforms.forEach(plat => { if (e.x + 15 > plat.x && e.x < plat.x + plat.w && e.y + 20 > plat.y && e.y + 20 < plat.y + plat.h + 10 && e.vy > 0) { e.y = plat.y - 20; e.vy = 0; } }); });
    this.gameState.fruits = this.gameState.fruits.filter(f => { if (!f.collected) [this.gameState.p1, this.gameState.p2].forEach(p => { if (Math.sqrt((p.x - f.x) ** 2 + (p.y - f.y) ** 2) < 30) { f.collected = true; this.gameState.score += f.type === '#9b59b6' ? 50 : 10; } }); return !f.collected; });
    if (this.gameState.fruits.length === 0) { this.gameState.level++; this.gameState.score += 1000; this.initGame(); }
  }
  getPlayerInput(n) { return window.gameState && window.gameState[n] ? window.gameState[n].input || {} : {}; }
  render() { this.ctx.fillStyle = '#0a0a2e'; this.ctx.fillRect(0, 0, 800, 600); this.ctx.fillStyle = '#4a4a8a'; this.gameState.platforms.forEach(p => this.ctx.fillRect(p.x, p.y, p.w, p.h)); this.gameState.fruits.forEach(f => { this.ctx.fillStyle = f.type; this.ctx.beginPath(); this.ctx.arc(f.x, f.y, 12, 0, Math.PI*2); this.ctx.fill(); }); this.gameState.enemies.forEach(e => { this.ctx.fillStyle = '#e74c3c'; this.ctx.beginPath(); this.ctx.arc(e.x, e.y, 15, 0, Math.PI*2); this.ctx.fill(); this.ctx.fillStyle = '#fff'; this.ctx.fillRect(e.x - 8, e.y - 5, 5, 5); this.ctx.fillRect(e.x + 3, e.y - 5, 5, 5); }); [this.gameState.p1, this.gameState.p2].forEach((p, i) => { const color = i === 0 ? '#3498db' : '#e74c3c'; this.ctx.fillStyle = color; this.ctx.fillRect(p.x - 12, p.y - 20, 24, 40); this.ctx.fillStyle = '#f5d0c5'; this.ctx.beginPath(); this.ctx.arc(p.x, p.y - 25, 10, 0, Math.PI*2); this.ctx.fill(); if (p.bubble) { this.ctx.fillStyle = 'rgba(255,255,255,0.5)'; this.ctx.beginPath(); this.ctx.arc(p.bubble.x, p.bubble.y, 20, 0, Math.PI*2); this.ctx.fill(); } }); this.ctx.fillStyle = '#fff'; this.ctx.font = '16px Arial'; this.ctx.fillText('Score: ' + this.gameState.score, 20, 30); this.ctx.fillText('Level: ' + this.gameState.level, 150, 30); this.ctx.fillStyle = '#f1c40f'; this.ctx.fillText('BUBBLE BOBBLE', 400, 25); }
  updatePlayerInput(n, i) { window.gameState = window.gameState || {}; window.gameState[n] = { input: i }; }
}
window.BubbleBobbleGame = BubbleBobbleGame;