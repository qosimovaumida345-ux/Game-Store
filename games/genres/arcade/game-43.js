// Space Invaders Modern Game
class SpaceInvadersModernGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.players = players; this.gameId = gameId;
    this.isRunning = false; this.lastTime = 0; this.resizeCanvas();
    this.gameState = { time: 0, score: 0, lives: 3, player: null, aliens: [], bullets: [], alienBullets: [], shields: [], wave: 1, direction: 1, status: 'playing', gameOver: false };
    this.initGame();
  }
  resizeCanvas() { this.canvas.width = this.parentElement.clientWidth || 800; this.canvas.height = this.parentElement.clientHeight || 600; }
  initGame() { this.gameState.player = { x: 400, y: 550 }; const colors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db']; for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) this.gameState.aliens.push({ x: 150 + c * 70, y: 80 + r * 50, color: colors[r], type: r, hp: 4 - r }); for (let i = 0; i < 4; i++) this.gameState.shields.push({ x: 150 + i * 150, y: 480 }); }
  start() { this.isRunning = true; this.lastTime = performance.now(); this.gameLoop(this.lastTime); }
  stop() { this.isRunning = false; }
  gameLoop(ct) { if (!this.isRunning) return; const dt = (ct - this.lastTime) / 1000; this.lastTime = ct; this.update(dt); this.render(); requestAnimationFrame(t => this.gameLoop(t)); }
  update(dt) {
    if (this.gameState.gameOver) return; this.gameState.time += dt;
    const i = this.getPlayerInput(this.players[0]);
    if (i.left) this.gameState.player.x = Math.max(30, this.gameState.player.x - 6); if (i.right) this.gameState.player.x = Math.min(770, this.gameState.player.x + 6);
    if (i.shoot && Math.random() < 0.15) this.gameState.bullets.push({ x: this.gameState.player.x, y: 540, speed: 400 });
    this.gameState.bullets.forEach((b, bi) => { b.y -= b.speed * dt; if (b.y < 0) this.gameState.bullets.splice(bi, 1); });
    if (Math.random() < 0.02) { const alien = this.gameState.aliens[Math.floor(Math.random() * this.gameState.aliens.length)]; if (alien) this.gameState.alienBullets.push({ x: alien.x, y: alien.y + 20, speed: 150 }); }
    this.gameState.alienBullets.forEach((ab, ai) => { ab.y += ab.speed * dt; if (ab.y > 600) this.gameState.alienBullets.splice(ai, 1); const dx = this.gameState.player.x - ab.x, dy = 550 - ab.y; if (Math.sqrt(dx*dx + dy*dy) < 25) { this.gameState.lives--; this.gameState.alienBullets.splice(ai, 1); if (this.gameState.lives <= 0) this.gameState.gameOver = true; } });
    this.gameState.bullets.forEach((b, bi) => { this.gameState.aliens.forEach((a, ai) => { const dx = b.x - a.x, dy = b.y - a.y; if (Math.sqrt(dx*dx + dy*dy) < 25) { a.hp--; this.gameState.bullets.splice(bi, 1); if (a.hp <= 0) { this.gameState.score += (a.type + 1) * 100; this.gameState.aliens.splice(ai, 1); } } }); });
    if (this.gameState.aliens.length === 0) { this.gameState.wave++; for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) this.gameState.aliens.push({ x: 150 + c * 70, y: 80 + r * 50, color: ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db'][r], type: r, hp: 4 - r + Math.floor(this.gameState.wave / 2) }); }
  }
  getPlayerInput(n) { return window.gameState && window.gameState[n] ? window.gameState[n].input || {} : {}; }
  render() { this.ctx.fillStyle = '#0a0a1a'; this.ctx.fillRect(0, 0, 800, 600); this.gameState.aliens.forEach(a => { this.ctx.fillStyle = a.color; this.ctx.fillRect(a.x - 15, a.y - 15, 30, 30); this.ctx.fillStyle = '#fff'; this.ctx.fillRect(a.x - 10, a.y - 5, 5, 5); this.ctx.fillRect(a.x + 5, a.y - 5, 5, 5); }); this.gameState.bullets.forEach(b => { this.ctx.fillStyle = '#f1c40f'; this.ctx.fillRect(b.x - 3, b.y - 8, 6, 16); }); this.gameState.alienBullets.forEach(ab => { this.ctx.fillStyle = '#e74c3c'; this.ctx.beginPath(); this.ctx.arc(ab.x, ab.y, 5, 0, Math.PI*2); this.ctx.fill(); }); const p = this.gameState.player; this.ctx.fillStyle = '#3498db'; this.ctx.beginPath(); this.ctx.moveTo(p.x, p.y - 20); this.ctx.lineTo(p.x - 15, p.y + 10); this.ctx.lineTo(p.x + 15, p.y + 10); this.ctx.fill(); this.ctx.fillStyle = '#fff'; this.ctx.font = '16px Arial'; this.ctx.fillText('Score: ' + this.gameState.score, 20, 30); this.ctx.fillText('Lives: ' + this.gameState.lives, 20, 55); this.ctx.fillText('Wave: ' + this.gameState.wave, 150, 30); this.ctx.fillStyle = '#f1c40f'; this.ctx.fillText('SPACE INVADERS', 400, 25); if (this.gameState.gameOver) { this.ctx.fillStyle = 'rgba(0,0,0,0.7)'; this.ctx.fillRect(0, 0, 800, 600); this.ctx.fillStyle = '#e74c3c'; this.ctx.font = '48px Arial'; this.ctx.fillText('GAME OVER', 400, 300); } }
  updatePlayerInput(n, i) { window.gameState = window.gameState || {}; window.gameState[n] = { input: i }; }
}
window.SpaceInvadersModernGame = SpaceInvadersModernGame;