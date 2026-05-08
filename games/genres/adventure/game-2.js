// Quest - Adventure Quest
class QuestGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.players = players; this.gameId = gameId;
    this.isRunning = false; this.lastTime = 0;
    this.resizeCanvas();
    this.gameState = { hero: { x: 300, y: 300, hp: 100 }, enemies: [], gold: 0, level: 1, time: 0, status: 'playing' };
    this.initGame();
  }
  resizeCanvas() { this.canvas.width = 600; this.canvas.height = 500; }
  initGame() { for (let i = 0; i < 3; i++) { this.gameState.enemies.push({ x: Math.random() * 500, y: Math.random() * 400, hp: 30, vx: (Math.random() - 0.5) * 2 }); } }
  start() { this.isRunning = true; this.lastTime = performance.now(); this.gameLoop(this.lastTime); }
  stop() { this.isRunning = false; }
  gameLoop(ct) { if (!this.isRunning) return; this.update((ct - this.lastTime) / 1000); this.lastTime = ct; this.render(); requestAnimationFrame(t => this.gameLoop(t)); }
  update(dt) {
    const { hero, enemies } = this.gameState;
    enemies.forEach(e => { e.x += e.vx; e.y += Math.sin(this.gameState.time * 2 + e.x) * 2; e.x = Math.max(20, Math.min(580, e.x)); e.y = Math.max(20, Math.min(480, e.y)); const d = Math.sqrt((e.x - hero.x)**2 + (e.y - hero.y)**2); if (d < 30) { e.hp -= 0.5; hero.hp -= 0.2; } });
    enemies = enemies.filter(e => { if (e.hp <= 0) { this.gameState.gold += 10; return false; } return true; });
    this.gameState.enemies = enemies;
    if (hero.hp <= 0) this.gameState.status = 'gameover';
    if (enemies.length === 0) { this.gameState.level++; for (let i = 0; i < 3 + this.gameState.level; i++) { this.gameState.enemies.push({ x: Math.random() * 500, y: Math.random() * 400, hp: 30 + this.gameState.level * 10, vx: (Math.random() - 0.5) * 2 }); } hero.hp = Math.min(100, hero.hp + 20); }
  }
  render() { this.ctx.fillStyle = '#2c3e50'; this.ctx.fillRect(0, 0, 600, 500); this.ctx.fillStyle = '#fff'; this.gameState.enemies.forEach(e => { this.ctx.fillStyle = '#e74c3c'; this.ctx.fillRect(e.x - 15, e.y - 15, 30, 30); }); const h = this.gameState.hero; this.ctx.fillStyle = '#3498db'; this.ctx.fillRect(h.x - 15, h.y - 15, 30, 30); this.ctx.fillStyle = '#fff'; this.ctx.font = '20px Arial'; this.ctx.fillText(`Level: ${this.gameState.level}`, 20, 30); this.ctx.fillText(`Gold: ${this.gameState.gold}`, 20, 55); this.ctx.fillText(`HP: ${Math.floor(h.hp)}`, 20, 80); if (this.gameState.status === 'gameover') { this.ctx.fillStyle = '#e74c3c'; this.ctx.font = '40px Arial'; this.ctx.fillText('GAME OVER', 300, 250); } }
  getPlayerInput() { return {}; }
  updatePlayerInput(n, i) { window.gameState = window.gameState || {}; window.gameState[n] = { input: i }; }
}
window.QuestGame = QuestGame;