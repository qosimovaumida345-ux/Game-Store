// Boxing - Boxing Fight Game
class BoxingGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.players = players; this.gameId = gameId;
    this.isRunning = false; this.lastTime = 0;
    this.resizeCanvas();
    this.gameState = { p1HP: 100, p2HP: 100, p1: { x: 150, y: 350, state: 'idle' }, p2: { x: 450, y: 350, state: 'idle' }, timer: 99, time: 0, status: 'playing' };
    this.initGame();
  }
  resizeCanvas() { this.canvas.width = 600; this.canvas.height = 500; }
  initGame() {}
  start() { this.isRunning = true; this.lastTime = performance.now(); this.gameLoop(this.lastTime); }
  stop() { this.isRunning = false; }
  gameLoop(ct) { if (!this.isRunning) return; this.update((ct - this.lastTime) / 1000); this.lastTime = ct; this.render(); requestAnimationFrame(t => this.gameLoop(t)); }
  update(dt) {
    if (this.gameState.timer > 0) this.gameState.timer -= dt;
    else this.gameState.status = 'finished';
    const { p1, p2 } = this.gameState;
    if (Math.random() < 0.05) {
      if (Math.random() < 0.5) { p1.state = 'punch'; this.gameState.p2HP -= 5; }
      else { p1.state = 'idle'; }
    }
    if (Math.random() < 0.05) {
      if (Math.random() < 0.5) { p2.state = 'punch'; this.gameState.p1HP -= 5; }
      else { p2.state = 'idle'; }
    }
    if (this.gameState.p1HP <= 0 || this.gameState.p2HP <= 0) this.gameState.status = 'finished';
  }
  render() {
    this.ctx.fillStyle = '#1a1a2e'; this.ctx.fillRect(0, 0, 600, 500);
    this.ctx.fillStyle = '#333'; this.ctx.fillRect(0, 400, 600, 100);
    this.ctx.fillStyle = '#c0392b'; this.ctx.font = '30px Arial'; this.ctx.textAlign = 'center'; this.ctx.fillText(Math.ceil(this.gameState.timer), 300, 50);
    this.ctx.fillStyle = '#333'; this.ctx.fillRect(20, 70, 200, 20); this.ctx.fillStyle = '#2ecc71'; this.ctx.fillRect(20, 70, 200 * (this.gameState.p1HP/100), 20);
    this.ctx.fillRect(380, 70, 200, 20); this.ctx.fillStyle = '#2ecc71'; this.ctx.fillRect(380, 70, 200 * (this.gameState.p2HP/100), 20);
    const { p1, p2 } = this.gameState;
    this.ctx.fillStyle = '#e74c3c'; this.ctx.fillRect(p1.x - 25, p1.y - 50, 50, 70); this.ctx.fillStyle = '#f1c40f'; this.ctx.beginPath(); this.ctx.arc(p1.x, p1.y - 65, 20, 0, Math.PI*2); this.ctx.fill();
    this.ctx.fillStyle = '#3498db'; this.ctx.fillRect(p2.x - 25, p2.y - 50, 50, 70); this.ctx.fillStyle = '#f1c40f'; this.ctx.beginPath(); this.ctx.arc(p2.x, p2.y - 65, 20, 0, Math.PI*2); this.ctx.fill();
    if (this.gameState.status === 'finished') { this.ctx.fillStyle = 'rgba(0,0,0,0.8)'; this.ctx.fillRect(0, 0, 600, 500); this.ctx.fillStyle = '#f39c12'; this.ctx.font = '40px Arial'; this.ctx.fillText(this.gameState.p1HP > 0 ? 'YOU WIN!' : 'YOU LOSE', 300, 250); }
  }
  getPlayerInput() { return {}; }
  updatePlayerInput(n, i) { window.gameState = window.gameState || {}; window.gameState[n] = { input: i }; }
}
window.BoxingGame = BoxingGame;