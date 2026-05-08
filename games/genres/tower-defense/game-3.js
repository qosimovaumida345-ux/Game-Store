// Alien Defense - Tower Defense
class AlienDefenseGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.players = players; this.gameId = gameId;
    this.isRunning = false; this.lastTime = 0;
    this.resizeCanvas();
    this.gameState = { towers: [], enemies: [], money: 200, score: 0, wave: 1, time: 0, status: 'playing', path: [{x:0,y:100},{x:100,y:100},{x:100,y:300},{x:300,y:300},{x:300,y:100},{x:500,y:100},{x:500,y:400},{x:600,y:400}] };
    this.initGame();
  }
  resizeCanvas() { this.canvas.width = 600; this.canvas.height = 500; }
  initGame() {}
  start() { this.isRunning = true; this.lastTime = performance.now(); this.gameLoop(this.lastTime); }
  stop() { this.isRunning = false; }
  gameLoop(ct) { if (!this.isRunning) return; this.update((ct - this.lastTime) / 1000); this.lastTime = ct; this.render(); requestAnimationFrame(t => this.gameLoop(t)); }
  update(dt) {
    const { path, enemies, towers } = this.gameState;
    if (Math.random() < 0.02 * this.gameState.wave) { enemies.push({ x: path[0].x, y: path[0].y, hp: 20 + this.gameState.wave * 5, pathIdx: 0 }); }
    enemies.forEach((e, i) => { const target = path[Math.floor(e.pathIdx) + 1]; if (target) { e.x += (target.x - e.x) * 0.02; e.y += (target.y - e.y) * 0.02; e.pathIdx += 0.02; } if (e.pathIdx >= path.length - 1) { enemies.splice(i, 1); this.gameState.score -= 10; } });
    towers.forEach(t => { enemies.forEach(e => { const d = Math.sqrt((e.x-t.x)**2 + (e.y-t.y)**2); if (d < t.range) { e.hp -= 1; if (e.hp <= 0) { this.gameState.money += 10; this.gameState.score += 10; } } }); });
    enemies = enemies.filter(e => e.hp > 0); this.gameState.enemies = enemies;
    if (this.gameState.score > this.gameState.wave * 100) this.gameState.wave++;
  }
  render() { this.ctx.fillStyle = '#1a1a2e'; this.ctx.fillRect(0, 0, 600, 500); this.ctx.strokeStyle = '#f39c12'; this.ctx.lineWidth = 20; this.ctx.beginPath(); this.gameState.path.forEach((p, i) => i === 0 ? this.ctx.moveTo(p.x, p.y) : this.ctx.lineTo(p.x, p.y)); this.ctx.stroke(); this.ctx.fillStyle = '#3498db'; this.gameState.towers.forEach(t => { this.ctx.fillRect(t.x - 15, t.y - 15, 30, 30); }); this.ctx.fillStyle = '#e74c3c'; this.gameState.enemies.forEach(e => { this.ctx.beginPath(); this.ctx.arc(e.x, e.y, 15, 0, Math.PI*2); this.ctx.fill(); }); this.ctx.fillStyle = '#fff'; this.ctx.font = '20px Arial'; this.ctx.fillText(`Wave: ${this.gameState.wave}`, 20, 30); this.ctx.fillText(`Money: $${this.gameState.money}`, 20, 55); this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 80); }
  getPlayerInput() { return {}; }
  updatePlayerInput(n, i) { window.gameState = window.gameState || {}; window.gameState[n] = { input: i }; }
}
window.AlienDefenseGame = AlienDefenseGame;