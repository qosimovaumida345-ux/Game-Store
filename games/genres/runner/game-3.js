// Zombie Run - Endless Runner with Zombies
class ZombieRunGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.players = players; this.gameId = gameId;
    this.isRunning = false; this.lastTime = 0;
    this.resizeCanvas();
    this.gameState = { player: { x: 100, y: 400, vy: 0 }, zombies: [], obstacles: [], score: 0, groundY: 420, time: 0, status: 'playing' };
    this.initGame();
  }
  resizeCanvas() { this.canvas.width = 600; this.canvas.height = 500; }
  initGame() {}
  start() { this.isRunning = true; this.lastTime = performance.now(); this.gameLoop(this.lastTime); }
  stop() { this.isRunning = false; }
  gameLoop(ct) { if (!this.isRunning) return; this.update((ct - this.lastTime) / 1000); this.lastTime = ct; this.render(); requestAnimationFrame(t => this.gameLoop(t)); }
  update(dt) {
    const { player, zombies, obstacles } = this.gameState;
    player.vy += 0.8; player.y += player.vy;
    if (player.y > this.gameState.groundY) { player.y = this.gameState.groundY; player.vy = 0; }
    if (Math.random() < 0.03) { zombies.push({ x: 650, y: 420, vx: -4 - Math.random() * 2 }); }
    if (Math.random() < 0.02) { obstacles.push({ x: 650, y: 420 - 40 - Math.random() * 30, w: 30, h: 40 + Math.random() * 30 }); }
    zombies.forEach((z, i) => { z.x += z.vx; if (z.x < -50) zombies.splice(i, 1); });
    obstacles.forEach((o, i) => { o.x -= 5; if (o.x < -50) obstacles.splice(i, 1); });
    [...zombies, ...obstacles].forEach(o => { if (Math.abs(o.x - player.x) < 30 && Math.abs(o.y - player.y) < 40) this.gameState.status = 'gameover'; });
    this.gameState.score++;
  }
  render() { this.ctx.fillStyle = '#1a1a1a'; this.ctx.fillRect(0, 0, 600, 500); this.ctx.fillStyle = '#2d2d2d'; this.ctx.fillRect(0, 420, 600, 80); this.ctx.fillStyle = '#fff'; this.ctx.font = '20px Arial'; this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 30); const { player, zombies, obstacles } = this.gameState; this.ctx.fillStyle = '#3498db'; this.ctx.fillRect(player.x - 15, player.y - 40, 30, 40); zombies.forEach(z => { this.ctx.fillStyle = '#27ae60'; this.ctx.fillRect(z.x - 15, z.y - 40, 30, 40); this.ctx.fillStyle = '#e74c3c'; this.ctx.beginPath(); this.ctx.arc(z.x, z.y - 45, 10, 0, Math.PI*2); this.ctx.fill(); }); obstacles.forEach(o => { this.ctx.fillStyle = '#8b4513'; this.ctx.fillRect(o.x - o.w/2, o.y - o.h, o.w, o.h); }); if (this.gameState.status === 'gameover') { this.ctx.fillStyle = 'rgba(0,0,0,0.8)'; this.ctx.fillRect(0, 0, 600, 500); this.ctx.fillStyle = '#e74c3c'; this.ctx.font = '40px Arial'; this.ctx.fillText('GAME OVER', 300, 250); } }
  getPlayerInput() { return {}; }
  updatePlayerInput(n, i) { window.gameState = window.gameState || {}; window.gameState[n] = { input: i }; }
}
window.ZombieRunGame = ZombieRunGame;