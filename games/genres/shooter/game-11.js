// Giga Wing Style Shooter
class GigaWingGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.players = players; this.gameId = gameId;
    this.isRunning = false; this.lastTime = 0; this.resizeCanvas();
    this.gameState = { time: 0, score: 0, power: 0, player: null, enemies: [], bullets: [], enemyBullets: [], stars: [], bosses: [], currentBoss: null, status: 'shooting', gameOver: false };
    this.initGame();
  }
  resizeCanvas() { this.canvas.width = this.parentElement.clientWidth || 800; this.canvas.height = this.parentElement.clientHeight || 600; }
  initGame() { this.gameState.player = { x: 100, y: 500 }; for (let i = 0; i < 50; i++) this.gameState.stars.push({ x: Math.random() * 800, y: Math.random() * 600, z: Math.random() * 3 }); }
  start() { this.isRunning = true; this.lastTime = performance.now(); this.gameLoop(this.lastTime); }
  stop() { this.isRunning = false; }
  gameLoop(ct) { if (!this.isRunning) return; const dt = (ct - this.lastTime) / 1000; this.lastTime = ct; this.update(dt); this.render(); requestAnimationFrame(t => this.gameLoop(t)); }
  update(dt) {
    if (this.gameState.gameOver) return; this.gameState.time += dt;
    const i = this.getPlayerInput(this.players[0]), p = this.gameState.player;
    if (i.left) p.x = Math.max(30, p.x - 8); if (i.right) p.x = Math.min(770, p.x + 8); if (i.up) p.y = Math.max(30, p.y - 8); if (i.down) p.y = Math.min(570, p.y + 8);
    if (i.shoot) { this.gameState.bullets.push({ x: p.x, y: p.y, vx: 0, vy: -600, type: 'main' }); if (this.gameState.power > 30) { this.gameState.bullets.push({ x: p.x - 30, y: p.y, vx: -100, vy: -500, type: 'wing' }); this.gameState.bullets.push({ x: p.x + 30, y: p.y, vx: 100, vy: -500, type: 'wing' }); } }
    this.gameState.stars.forEach(s => { s.z -= dt * 5; if (s.z <= 0) { s.x = Math.random() * 800; s.y = Math.random() * 600; s.z = 3; } });
    if (Math.random() < 0.03 && this.gameState.enemies.length < 15) this.gameState.enemies.push({ x: Math.random() * 700 + 50, y: -30, hp: 20, type: Math.random() < 0.3 ? 'fighter' : 'drone', vx: (Math.random() - 0.5) * 100, vy: 100 + Math.random() * 100 });
    this.gameState.enemies.forEach((e, ei) => { e.x += e.vx * dt; e.y += e.vy * dt; if (e.y > 650) { this.gameState.enemies.splice(ei, 1); } });
    this.gameState.bullets.forEach((b, bi) => { b.x += b.vx * dt; b.y += b.vy * dt; if (b.y < -20) this.gameState.bullets.splice(bi, 1); this.gameState.enemies.forEach((e, ei) => { const dx = b.x - e.x, dy = b.y - e.y; if (Math.sqrt(dx*dx + dy*dy) < 25) { e.hp -= b.type === 'main' ? 10 : 5; this.gameState.bullets.splice(bi, 1); if (e.hp <= 0) { this.gameState.enemies.splice(ei, 1); this.gameState.score += e.type === 'fighter' ? 100 : 50; } } }); });
    if (this.gameState.score > 1000 && !this.gameState.currentBoss) this.gameState.currentBoss = { x: 400, y: -100, hp: 500, maxHp: 500, phase: 1 };
    if (this.gameState.currentBoss) { const b = this.gameState.currentBoss; b.y += 50 * dt; if (b.y > 100) b.y = 100; if (Math.random() < 0.1) this.gameState.enemyBullets.push({ x: b.x, y: b.y + 30, vx: (Math.random() - 0.5) * 200, vy: 200 + Math.random() * 100 }); }
  }
  getPlayerInput(n) { return window.gameState && window.gameState[n] ? window.gameState[n].input || {} : {}; }
  render() { this.ctx.fillStyle = '#0a0a1a'; this.ctx.fillRect(0, 0, 800, 600); this.gameState.stars.forEach(s => { this.ctx.fillStyle = `rgba(255,255,255,${s.z * 0.3})`; this.ctx.beginPath(); this.ctx.arc(s.x, s.y, s.size || 2, 0, Math.PI*2); this.ctx.fill(); }); this.gameState.enemies.forEach(e => { this.ctx.fillStyle = e.type === 'fighter' ? '#e74c3c' : '#9b59b6'; this.ctx.beginPath(); this.ctx.arc(e.x, e.y, 15, 0, Math.PI*2); this.ctx.fill(); }); this.gameState.bullets.forEach(b => { this.ctx.fillStyle = b.type === 'main' ? '#f1c40f' : '#3498db'; this.ctx.fillRect(b.x - 4, b.y - 10, 8, 20); }); if (this.gameState.currentBoss) { const b = this.gameState.currentBoss; this.ctx.fillStyle = '#8e44ad'; this.ctx.fillRect(b.x - 40, b.y - 30, 80, 60); this.ctx.fillStyle = '#e74c3c'; this.ctx.beginPath(); this.ctx.arc(b.x, b.y, 20, 0, Math.PI*2); this.ctx.fill(); this.ctx.fillStyle = '#e74c3c'; this.ctx.fillRect(200, 20, 400 * (b.hp/b.maxHp), 20); this.ctx.strokeStyle = '#fff'; this.ctx.strokeRect(200, 20, 400, 20); } this.ctx.fillStyle = '#3498db'; const p = this.gameState.player; this.ctx.beginPath(); this.ctx.moveTo(p.x, p.y - 20); this.ctx.lineTo(p.x - 20, p.y + 15); this.ctx.lineTo(p.x + 20, p.y + 15); this.ctx.fill(); this.ctx.fillStyle = '#fff'; this.ctx.font = '16px Arial'; this.ctx.fillText('Score: ' + this.gameState.score, 20, 30); this.ctx.fillText('Power: ' + this.gameState.power + '%', 20, 55); this.ctx.fillStyle = '#ffd93d'; this.ctx.fillText('GIGA WING', 400, 25); }
  updatePlayerInput(n, i) { window.gameState = window.gameState || {}; window.gameState[n] = { input: i }; }
}
window.GigaWingGame = GigaWingGame;