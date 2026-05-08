// Tennis
class TennisGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.players = players; this.gameId = gameId;
    this.isRunning = false; this.lastTime = 0;
    this.resizeCanvas();
    this.gameState = { p1: 0, p2: 0, ball: { x: 300, y: 250, vx: 0, vy: 0 }, p1X: 100, p2X: 500, time: 0, status: 'playing' };
    this.initGame();
  }
  resizeCanvas() { this.canvas.width = 600; this.canvas.height = 500; }
  initGame() { this.gameState.ball.vx = (Math.random() - 0.5) * 8; this.gameState.ball.vy = (Math.random() - 0.5) * 8; }
  start() { this.isRunning = true; this.lastTime = performance.now(); this.gameLoop(this.lastTime); }
  stop() { this.isRunning = false; }
  gameLoop(ct) { if (!this.isRunning) return; this.update((ct - this.lastTime) / 1000); this.lastTime = ct; this.render(); requestAnimationFrame(t => this.gameLoop(t)); }
  update(dt) {
    const { ball, p1X, p2X } = this.gameState;
    ball.x += ball.vx; ball.y += ball.vy;
    if (ball.y < 0 || ball.y > 500) ball.vy = -ball.vy;
    if (ball.x < 0) { this.gameState.p2++; this.initGame(); }
    if (ball.x > 600) { this.gameState.p1++; this.initGame(); }
    [p1X, p2X].forEach((px, i) => {
      const dx = ball.x - px; const dy = ball.y - 250;
      if (Math.abs(dx) < 30 && Math.abs(dy) < 40) { ball.vx = -ball.vx * 1.1 + (i === 0 ? 5 : -5); ball.vy += dy * 0.1; }
    });
  }
  render() { this.ctx.fillStyle = '#27ae60'; this.ctx.fillRect(0, 0, 600, 500); this.ctx.strokeStyle = '#fff'; this.ctx.lineWidth = 3; this.ctx.beginPath(); this.ctx.moveTo(300, 0); this.ctx.lineTo(300, 500); this.ctx.stroke(); this.ctx.beginPath(); this.ctx.moveTo(0, 200); this.ctx.lineTo(600, 200); this.ctx.stroke(); this.ctx.fillStyle = '#fff'; this.ctx.font = '30px Arial'; this.ctx.textAlign = 'center'; this.ctx.fillText(`${this.gameState.p1} - ${this.gameState.p2}`, 300, 40); this.ctx.fillStyle = '#fff'; this.ctx.beginPath(); this.ctx.arc(this.gameState.ball.x, this.gameState.ball.y, 8, 0, Math.PI*2); this.ctx.fill(); this.ctx.fillStyle = '#3498db'; this.ctx.fillRect(this.gameState.p1X - 15, 220, 30, 60); this.ctx.fillStyle = '#e74c3c'; this.ctx.fillRect(this.gameState.p2X - 15, 220, 30, 60); }
  getPlayerInput() { return {}; }
  updatePlayerInput(n, i) { window.gameState = window.gameState || {}; window.gameState[n] = { input: i }; }
}
window.TennisGame = TennisGame;