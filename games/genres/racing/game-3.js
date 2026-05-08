// Race - 2D Racing
class RaceGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.players = players; this.gameId = gameId;
    this.isRunning = false; this.lastTime = 0;
    this.resizeCanvas();
    this.gameState = { player: { x: 100, y: 300, vx: 0, vy: 0, angle: 0 }, enemies: [], lap: 1, checkpoint: 0, score: 0, time: 0, status: 'playing' };
    this.initGame();
  }
  resizeCanvas() { this.canvas.width = 600; this.canvas.height = 500; }
  initGame() { for (let i = 0; i < 3; i++) { this.gameState.enemies.push({ x: 100 + i * 30, y: 280, vx: 3 + i * 0.5, vy: 0, angle: 0 }); } }
  start() { this.isRunning = true; this.lastTime = performance.now(); this.gameLoop(this.lastTime); }
  stop() { this.isRunning = false; }
  gameLoop(ct) { if (!this.isRunning) return; this.update((ct - this.lastTime) / 1000); this.lastTime = ct; this.render(); requestAnimationFrame(t => this.gameLoop(t)); }
  update(dt) {
    const { player, enemies } = this.gameState;
    player.vx = 5; player.vy = Math.sin(this.gameState.time * 2) * 2;
    player.x += player.vx; player.y += player.vy;
    player.y = Math.max(200, Math.min(400, player.y));
    if (player.x > 620) { player.x = 0; this.gameState.lap++; this.gameState.score += 100; }
    enemies.forEach(e => { e.x += e.vx; if (e.x > 620) e.x = 0; });
  }
  render() { this.ctx.fillStyle = '#2c3e50'; this.ctx.fillRect(0, 0, 600, 500); this.ctx.fillStyle = '#7f8c8d'; this.ctx.fillRect(0, 190, 600, 20); this.ctx.fillRect(0, 390, 600, 20); const { player, enemies } = this.gameState; this.ctx.save(); this.ctx.translate(player.x, player.y); this.ctx.fillStyle = '#e74c3c'; this.ctx.fillRect(-20, -10, 40, 20); this.ctx.restore(); this.ctx.fillStyle = '#3498db'; enemies.forEach(e => { this.ctx.fillRect(e.x - 20, e.y - 10, 40, 20); }); this.ctx.fillStyle = '#fff'; this.ctx.font = '20px Arial'; this.ctx.fillText(`Lap: ${this.gameState.lap}`, 20, 30); this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 55); }
  getPlayerInput() { return {}; }
  updatePlayerInput(n, i) { window.gameState = window.gameState || {}; window.gameState[n] = { input: i }; }
}
window.RaceGame = RaceGame;