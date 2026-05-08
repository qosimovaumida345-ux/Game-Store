// Dig Dug Style Game
class DigDugGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.players = players; this.gameId = gameId;
    this.isRunning = false; this.lastTime = 0; this.resizeCanvas();
    this.gameState = { time: 0, score: 0, player: null, enemies: [], rocks: [], dirt: [], gridSize: 32, cols: 20, rows: 15, status: 'playing', gameOver: false };
    this.initGame();
  }
  resizeCanvas() { this.canvas.width = this.parentElement.clientWidth || 800; this.canvas.height = this.parentElement.clientHeight || 600; }
  initGame() {
    this.gameState.player = { x: 64, y: 64, direction: 'right', digging: false };
    for (let r = 2; r < 13; r++) for (let c = 2; c < 18; c++) if (Math.random() < 0.2) this.gameState.dirt.push({ x: c * 32, y: r * 32 });
    for (let i = 0; i < 4; i++) this.gameState.enemies.push({ x: 200 + Math.random() * 400, y: 100 + Math.random() * 300, vx: 50, vy: 50, type: i < 2 ? 'fygar' : 'pooky' });
  }
  start() { this.isRunning = true; this.lastTime = performance.now(); this.gameLoop(this.lastTime); }
  stop() { this.isRunning = false; }
  gameLoop(ct) { if (!this.isRunning) return; const dt = (ct - this.lastTime) / 1000; this.lastTime = ct; this.update(dt); this.render(); requestAnimationFrame(t => this.gameLoop(t)); }
  update(dt) {
    if (this.gameState.gameOver) return; this.gameState.time += dt;
    const i = this.getPlayerInput(this.players[0]), p = this.gameState.player;
    if (i.left) { p.direction = 'left'; p.x -= 100 * dt; } if (i.right) { p.direction = 'right'; p.x += 100 * dt; } if (i.up) p.y -= 100 * dt; if (i.down) p.y += 100 * dt;
    p.x = Math.max(32, Math.min(608, p.x)); p.y = Math.max(32, Math.min(448, p.y));
    if (i.shoot) { this.gameState.enemies.forEach(e => { const dx = e.x - p.x, dy = e.y - p.y; if (Math.sqrt(dx*dx + dy*dy) < 100) { e.hp = (e.hp || 100) - dt * 50; if (e.hp <= 0) { this.gameState.score += 400; this.gameState.enemies = this.gameState.enemies.filter(en => en !== e); } } }); }
    this.gameState.enemies.forEach(e => { e.x += e.vx * dt; e.y += e.vy * dt; if (e.x < 30 || e.x > 630) e.vx *= -1; if (e.y < 30 || e.y > 450) e.vy *= -1; const dx = e.x - p.x, dy = e.y - p.y; if (Math.sqrt(dx*dx + dy*dy) < 20) this.gameState.gameOver = true; });
  }
  getPlayerInput(n) { return window.gameState && window.gameState[n] ? window.gameState[n].input || {} : {}; }
  render() { this.ctx.fillStyle = '#1a1a1a'; this.ctx.fillRect(0, 0, 800, 600); this.ctx.fillStyle = '#d4a574'; this.gameState.dirt.forEach(d => { this.ctx.fillRect(d.x + 2, d.y + 2, 28, 28); }); this.ctx.fillStyle = '#8b4513'; this.ctx.fillRect(20, 20, 640, 20); this.ctx.fillRect(20, 460, 640, 20); this.ctx.fillRect(20, 20, 20, 460); this.ctx.fillRect(640, 20, 20, 460); this.gameState.enemies.forEach(e => { this.ctx.fillStyle = e.type === 'fygar' ? '#e74c3c' : '#9b59b6'; this.ctx.beginPath(); this.ctx.arc(e.x, e.y, 15, 0, Math.PI*2); this.ctx.fill(); this.ctx.fillStyle = '#fff'; this.ctx.beginPath(); this.ctx.arc(e.x - 5, e.y - 3, 4, 0, Math.PI*2); this.ctx.arc(e.x + 5, e.y - 3, 4, 0, Math.PI*2); this.ctx.fill(); }); const p = this.gameState.player; this.ctx.fillStyle = '#3498db'; this.ctx.fillRect(p.x - 12, p.y - 12, 24, 24); this.ctx.fillStyle = '#f5d0c5'; this.ctx.beginPath(); this.ctx.arc(p.x, p.y - 15, 8, 0, Math.PI*2); this.ctx.fill(); this.ctx.fillStyle = '#fff'; this.ctx.font = '16px Arial'; this.ctx.fillText('Score: ' + this.gameState.score, 20, 30); this.ctx.fillStyle = '#e67e22'; this.ctx.fillText('DIG DUG', 400, 25); if (this.gameState.gameOver) { this.ctx.fillStyle = 'rgba(0,0,0,0.7)'; this.ctx.fillRect(0, 0, 800, 600); this.ctx.fillStyle = '#e74c3c'; this.ctx.font = '48px Arial'; this.ctx.fillText('GAME OVER', 400, 300); } }
  updatePlayerInput(n, i) { window.gameState = window.gameState || {}; window.gameState[n] = { input: i }; }
}
window.DigDugGame = DigDugGame;