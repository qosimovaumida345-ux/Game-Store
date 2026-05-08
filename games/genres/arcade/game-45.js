// Galaga Ships Game
class GalagaShipsGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.players = players; this.gameId = gameId;
    this.isRunning = false; this.lastTime = 0; this.resizeCanvas();
    this.gameState = { time: 0, score: 0, lives: 3, player: null, ships: [], bullets: [], formations: [], currentWave: 1, status: 'playing', gameOver: false };
    this.initGame();
  }
  resizeCanvas() { this.canvas.width = this.parentElement.clientWidth || 800; this.canvas.height = this.parentElement.clientHeight || 600; }
  initGame() { this.gameState.player = { x: 400, y: 550 }; this.createFormation(1); }
  createFormation(wave) { const rows = Math.min(5, wave), cols = 8; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) this.gameState.ships.push({ x: 150 + c * 70, y: 80 + r * 50, type: r === 0 ? 'bee' : r === 1 ? 'butterfly' : 'bug', hp: rows - r + 1, vx: 0, vy: 0, angle: 0, enterDelay: r * cols + c }); }
  start() { this.isRunning = true; this.lastTime = performance.now(); this.gameLoop(this.lastTime); }
  stop() { this.isRunning = false; }
  gameLoop(ct) { if (!this.isRunning) return; const dt = (ct - this.lastTime) / 1000; this.lastTime = ct; this.update(dt); this.render(); requestAnimationFrame(t => this.gameLoop(t)); }
  update(dt) {
    if (this.gameState.gameOver) return; this.gameState.time += dt;
    const i = this.getPlayerInput(this.players[0]), p = this.gameState.player;
    if (i.left) p.x = Math.max(30, p.x - 6); if (i.right) p.x = Math.min(770, p.x + 6);
    if (i.shoot && Math.random() < 0.2) this.gameState.bullets.push({ x: p.x, y: 540, vy: -500 });
    this.gameState.bullets = this.gameState.bullets.filter(b => { b.y += b.vy * dt; return b.y > -20; });
    this.gameState.ships.forEach(s => {
      if (s.enterDelay > 0) { s.enterDelay -= dt; if (s.enterDelay <= 0) s.y = 50; return; }
      s.angle += dt * 2;
      if (s.type === 'bee') s.x += Math.sin(this.gameState.time * 2 + s.angle) * 30 * dt;
      s.y += 20 * dt;
      if (s.y > 650) { s.y = 50; s.enterDelay = 0.1; }
      if (Math.random() < 0.01 * this.gameState.currentWave) this.gameState.bullets.push({ x: s.x, y: s.y + 15, vy: 150, isEnemy: true });
    });
    this.gameState.bullets.forEach((b, bi) => {
      if (b.isEnemy) { b.y += b.vy * dt; const dx = p.x - b.x, dy = p.y - b.y; if (Math.sqrt(dx*dx + dy*dy) < 25) { this.gameState.lives--; this.gameState.bullets.splice(bi, 1); if (this.gameState.lives <= 0) this.gameState.gameOver = true; } if (b.y > 620) this.gameState.bullets.splice(bi, 1); }
      else { this.gameState.ships.forEach((s, si) => { const dx = b.x - s.x, dy = b.y - s.y; if (Math.sqrt(dx*dx + dy*dy) < 20) { s.hp--; this.gameState.bullets.splice(bi, 1); if (s.hp <= 0) { this.gameState.ships.splice(si, 1); this.gameState.score += s.type === 'bee' ? 150 : s.type === 'butterfly' ? 80 : 50; } } }); }
    });
    if (this.gameState.ships.length === 0) { this.gameState.currentWave++; this.createFormation(this.gameState.currentWave); }
  }
  getPlayerInput(n) { return window.gameState && window.gameState[n] ? window.gameState[n].input || {} : {}; }
  render() { this.ctx.fillStyle = '#000022'; this.ctx.fillRect(0, 0, 800, 600); this.gameState.ships.forEach(s => { this.ctx.save(); this.ctx.translate(s.x, s.y); if (s.type === 'bee') { this.ctx.fillStyle = '#e74c3c'; this.ctx.beginPath(); this.ctx.moveTo(0, -15); this.ctx.lineTo(12, 10); this.ctx.lineTo(-12, 10); this.ctx.fill(); } else if (s.type === 'butterfly') { this.ctx.fillStyle = '#3498db'; this.ctx.beginPath(); this.ctx.ellipse(-10, 0, 12, 8, Math.sin(s.angle) * 0.3, 0, Math.PI*2); this.ctx.fill(); this.ctx.beginPath(); this.ctx.ellipse(10, 0, 12, 8, -Math.sin(s.angle) * 0.3, 0, Math.PI*2); this.ctx.fill(); } else { this.ctx.fillStyle = '#2ecc71'; this.ctx.beginPath(); this.ctx.arc(0, 0, 12, 0, Math.PI*2); this.ctx.fill(); } this.ctx.restore(); }); this.gameState.bullets.forEach(b => { this.ctx.fillStyle = b.isEnemy ? '#e74c3c' : '#f1c40f'; b.isEnemy ? this.ctx.beginPath() : this.ctx.fillRect(b.x - 3, b.y - 6, 6, 12); if (b.isEnemy) this.ctx.arc(b.x, b.y, 5, 0, Math.PI*2); this.ctx.fill(); }); const p = this.gameState.player; this.ctx.fillStyle = '#2ecc71'; this.ctx.beginPath(); this.ctx.moveTo(p.x, p.y - 20); this.ctx.lineTo(p.x - 15, p.y + 10); this.ctx.lineTo(p.x + 15, p.y + 10); this.ctx.fill(); this.ctx.fillStyle = '#fff'; this.ctx.font = '16px Arial'; this.ctx.textAlign = 'left'; this.ctx.fillText('Score: ' + this.gameState.score, 20, 30); this.ctx.fillText('Wave: ' + this.gameState.currentWave, 150, 30); this.ctx.fillText('Lives: ' + this.gameState.lives, 650, 30); this.ctx.fillStyle = '#f1c40f'; this.ctx.textAlign = 'center'; this.ctx.fillText('GALAGA SHIPS', 400, 25); }
  updatePlayerInput(n, i) { window.gameState = window.gameState || {}; window.gameState[n] = { input: i }; }
}
window.GalagaShipsGame = GalagaShipsGame;