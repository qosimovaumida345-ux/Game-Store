// Farm - Farm Simulator
class FarmGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.players = players; this.gameId = gameId;
    this.isRunning = false; this.lastTime = 0;
    this.resizeCanvas();
    this.gameState = { money: 100, crops: [], animals: [], time: 0, status: 'playing' };
    this.initGame();
  }
  resizeCanvas() { this.canvas.width = 600; this.canvas.height = 400; }
  initGame() { for (let i = 0; i < 5; i++) { this.gameState.crops.push({ x: 50 + i * 100, y: 100, type: 'wheat', growth: 0 }); } }
  start() { this.isRunning = true; this.lastTime = performance.now(); this.gameLoop(this.lastTime); }
  stop() { this.isRunning = false; }
  gameLoop(ct) { if (!this.isRunning) return; this.update((ct - this.lastTime) / 1000); this.lastTime = ct; this.render(); requestAnimationFrame(t => this.gameLoop(t)); }
  update(dt) {
    this.gameState.crops.forEach(c => { c.growth += dt * 5; if (c.growth >= 100) { this.gameState.money += 20; c.growth = 0; } });
  }
  render() { this.ctx.fillStyle = '#8fbc8f'; this.ctx.fillRect(0, 0, 600, 400); this.ctx.fillStyle = '#228b22'; this.ctx.fillRect(0, 300, 600, 100); this.gameState.crops.forEach(c => { const h = c.growth / 100 * 30; this.ctx.fillStyle = '#f1c40f'; this.ctx.fillRect(c.x, c.y + 30 - h, 20, h); }); this.ctx.fillStyle = '#fff'; this.ctx.font = '20px Arial'; this.ctx.fillText(`Money: $${this.gameState.money}`, 20, 30); }
  getPlayerInput() { return {}; }
  updatePlayerInput(n, i) { window.gameState = window.gameState || {}; window.gameState[n] = { input: i }; }
}
window.FarmGame = FarmGame;