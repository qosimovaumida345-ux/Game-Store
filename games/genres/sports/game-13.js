// Skate - Skateboard Game
class SkateGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.players = players; this.gameId = gameId;
    this.isRunning = false; this.lastTime = 0;
    this.resizeCanvas();
    this.gameState = { skater: { x: 100, y: 350, vy: 0, onGround: true, rot: 0 }, ramps: [{x: 200, y: 350, w: 80, h: -40}, {x: 400, y: 350, w: 100, h: -60}], score: 0, time: 0, status: 'playing' };
    this.initGame();
  }
  resizeCanvas() { this.canvas.width = 600; this.canvas.height = 400; }
  initGame() {}
  start() { this.isRunning = true; this.lastTime = performance.now(); this.gameLoop(this.lastTime); }
  stop() { this.isRunning = false; }
  gameLoop(ct) { if (!this.isRunning) return; this.update((ct - this.lastTime) / 1000); this.lastTime = ct; this.render(); requestAnimationFrame(t => this.gameLoop(t)); }
  update(dt) {
    const { skater, ramps } = this.gameState;
    skater.vy += 0.5;
    skater.y += skater.vy;
    let onRamp = false;
    ramps.forEach(r => { if (skater.x > r.x && skater.x < r.x + r.w && skater.y > r.y + r.h && skater.y < r.y) { skater.y = r.y + r.h; skater.vy = -8; this.gameState.score += 20; onRamp = true; } });
    if (!onRamp && skater.y > 350) { skater.y = 350; skater.vy = 0; skater.onGround = true; }
    skater.x += 3;
    if (skater.x > 650) { skater.x = -50; }
    skater.rot = skater.vy * 0.1;
  }
  render() { this.ctx.fillStyle = '#2c3e50'; this.ctx.fillRect(0, 0, 600, 400); this.ctx.fillStyle = '#95a5a6'; this.ctx.fillRect(0, 350, 600, 50); this.ctx.fillStyle = '#e67e22'; this.gameState.ramps.forEach(r => { this.ctx.beginPath(); this.ctx.moveTo(r.x, r.y); this.ctx.lineTo(r.x + r.w, r.y); this.ctx.lineTo(r.x + r.w, r.y + r.h); this.ctx.lineTo(r.x, r.y + r.h); this.ctx.fill(); }); const s = this.gameState.skater; this.ctx.save(); this.ctx.translate(s.x, s.y); this.ctx.rotate(s.rot); this.ctx.fillStyle = '#3498db'; this.ctx.fillRect(-10, -20, 20, 10); this.ctx.fillStyle = '#000'; this.ctx.beginPath(); this.ctx.arc(-8, 10, 8, 0, Math.PI*2); this.ctx.arc(8, 10, 8, 0, Math.PI*2); this.ctx.fill(); this.ctx.restore(); this.ctx.fillStyle = '#fff'; this.ctx.font = '20px Arial'; this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 30); }
  getPlayerInput() { return {}; }
  updatePlayerInput(n, i) { window.gameState = window.gameState || {}; window.gameState[n] = { input: i }; }
}
window.SkateGame = SkateGame;