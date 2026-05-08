// R-Type Style Shooter
class RTypeGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.players = players; this.gameId = gameId;
    this.isRunning = false; this.lastTime = 0; this.resizeCanvas();
    this.gameState = { time: 0, score: 0, player: null, bullets: [], enemies: [], formations: [], boss: null, power: 0, cameraX: 0, status: 'shooting', gameOver: false };
    this.initGame();
  }
  resizeCanvas() { this.canvas.width = this.parentElement.clientWidth || 800; this.canvas.height = this.parentElement.clientHeight || 600; }
  initGame() { this.gameState.player = { x: 150, y: 300, vx: 0, vy: 0, direction: 1 }; }
  start() { this.isRunning = true; this.lastTime = performance.now(); this.gameLoop(this.lastTime); }
  stop() { this.isRunning = false; }
  gameLoop(ct) { if (!this.isRunning) return; const dt = (ct - this.lastTime) / 1000; this.lastTime = ct; this.update(dt); this.render(); requestAnimationFrame(t => this.gameLoop(t)); }
  update(dt) {
    if (this.gameState.gameOver) return; this.gameState.time += dt; this.gameState.cameraX += 150 * dt;
    const i = this.getPlayerInput(this.players[0]), p = this.gameState.player;
    if (i.left) p.vx = -300; else if (i.right) p.vx = 300; else p.vx *= 0.9; if (i.up) p.vy = -300; else if (i.down) p.vy = 300; else p.vy *= 0.9;
    p.x += p.vx * dt; p.y += p.vy * dt; p.x = Math.max(50, Math.min(300, p.x)); p.y = Math.max(50, Math.min(550, p.y));
    if (i.shoot) { this.gameState.bullets.push({ x: p.x + 30, y: p.y, vx: 600, vy: 0, damage: 10 }); if (this.gameState.power > 50) { this.gameState.bullets.push({ x: p.x + 20, y: p.y - 10, vx: 500, vy: -50, damage: 5 }); this.gameState.bullets.push({ x: p.x + 20, y: p.y + 10, vx: 500, vy: 50, damage: 5 }); } }
    this.gameState.bullets.forEach((b, bi) => { b.x += b.vx * dt; b.y += b.vy * dt; if (b.x > 850) this.gameState.bullets.splice(bi, 1); });
    if (Math.random() < 0.02 && this.gameState.enemies.length < 10) { this.gameState.enemies.push({ x: 850, y: 100 + Math.random() * 400, hp: 30, type: 'fighter', vx: -100 - Math.random() * 50, vy: (Math.random() - 0.5) * 50 }); }
    this.gameState.enemies.forEach((e, ei) => { e.x += e.vx * dt; e.y += e.vy * dt; if (e.x < -50) this.gameState.enemies.splice(ei, 1); });
    this.gameState.bullets.forEach((b, bi) => { this.gameState.enemies.forEach((e, ei) => { const dx = b.x - e.x, dy = b.y - e.y; if (Math.sqrt(dx*dx + dy*dy) < 25) { e.hp -= b.damage; this.gameState.bullets.splice(bi, 1); if (e.hp <= 0) { this.gameState.enemies.splice(ei, 1); this.gameState.score += 100; } } }); });
  }
  getPlayerInput(n) { return window.gameState && window.gameState[n] ? window.gameState[n].input || {} : {}; }
  render() { this.ctx.fillStyle = '#0a1628'; this.ctx.fillRect(0, 0, 800, 600); this.ctx.fillStyle = '#1a2a4a'; for (let y = 0; y < 15; y++) for (let x = 0; x < 30; x++) { if ((x + y) % 2 === 0) this.ctx.fillRect(x * 40 - (this.gameState.cameraX % 40), y * 40, 40, 40); } this.gameState.enemies.forEach(e => { this.ctx.fillStyle = '#e74c3c'; this.ctx.fillRect(e.x - 20, e.y - 15, 40, 30); this.ctx.fillStyle = '#c0392b'; this.ctx.beginPath(); this.ctx.moveTo(e.x, e.y + 20); this.ctx.lineTo(e.x - 15, e.y + 30); this.ctx.lineTo(e.x + 15, e.y + 30); this.ctx.fill(); }); this.gameState.bullets.forEach(b => { this.ctx.fillStyle = '#f1c40f'; this.ctx.fillRect(b.x - 10, b.y - 3, 20, 6); }); const p = this.gameState.player; this.ctx.fillStyle = '#3498db'; this.ctx.fillRect(p.x, p.y - 10, 40, 20); this.ctx.fillStyle = '#2980b9'; this.ctx.fillRect(p.x + 30, p.y - 5, 20, 10); this.ctx.fillStyle = '#e74c3c'; this.ctx.fillRect(p.x - 5, p.y - 15, 10, 10); this.ctx.fillRect(p.x + 35, p.y - 15, 10, 10); this.ctx.fillStyle = '#fff'; this.ctx.font = '16px Arial'; this.ctx.fillText('Score: ' + this.gameState.score, 20, 30); this.ctx.fillText('Power: ' + this.gameState.power + '%', 20, 55); this.ctx.fillStyle = '#3498db'; this.ctx.fillText('R-TYPE', 400, 25); }
  updatePlayerInput(n, i) { window.gameState = window.gameState || {}; window.gameState[n] = { input: i }; }
}
window.RTypeGame = RTypeGame;