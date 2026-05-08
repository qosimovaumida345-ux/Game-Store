// Qix Drawing Game
class QixDrawingGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.players = players; this.gameId = gameId;
    this.isRunning = false; this.lastTime = 0; this.resizeCanvas();
    this.gameState = { time: 0, score: 0, player: null, qix: null, lines: [], filled: [], filledPercent: 0, status: 'drawing', gameOver: false };
    this.initGame();
  }
  resizeCanvas() { this.canvas.width = this.parentElement.clientWidth || 800; this.canvas.height = this.parentElement.clientHeight || 600; }
  initGame() { this.gameState.player = { x: 50, y: 300, drawing: false }; this.gameState.qix = { x: 400, y: 150, vx: 80, vy: 60 }; this.gameState.filled = []; for (let r = 0; r < 60; r++) { this.gameState.filled[r] = []; for (let c = 0; c < 80; c++) this.gameState.filled[r][c] = r < 5 || r > 54 || c < 5 || c > 74; } }
  start() { this.isRunning = true; this.lastTime = performance.now(); this.gameLoop(this.lastTime); }
  stop() { this.isRunning = false; }
  gameLoop(ct) { if (!this.isRunning) return; const dt = (ct - this.lastTime) / 1000; this.lastTime = ct; this.update(dt); this.render(); requestAnimationFrame(t => this.gameLoop(t)); }
  update(dt) {
    if (this.gameState.gameOver) return; this.gameState.time += dt;
    const i = this.getPlayerInput(this.players[0]), p = this.gameState.player;
    if (i.left) p.x = Math.max(20, p.x - 5); if (i.right) p.x = Math.min(780, p.x + 5); if (i.up) p.y = Math.max(20, p.y - 5); if (i.down) p.y = Math.min(580, p.y + 5);
    if (i.shoot && !p.drawing) { p.drawing = true; this.gameState.lines = [{x: p.x, y: p.y, path: [{x: p.x, y: p.y}]}]; }
    if (p.drawing) { const lastLine = this.gameState.lines[this.gameState.lines.length - 1]; lastLine.path.push({x: p.x, y: p.y}); }
    const q = this.gameState.qix; q.x += q.vx * dt; q.y += q.vy * dt; if (q.x < 50 || q.x > 750) q.vx *= -1; if (q.y < 50 || q.y > 550) q.vy *= -1;
  }
  getPlayerInput(n) { return window.gameState && window.gameState[n] ? window.gameState[n].input || {} : {}; }
  render() { this.ctx.fillStyle = '#000'; this.ctx.fillRect(0, 0, 800, 600); for (let r = 0; r < 60; r++) for (let c = 0; c < 80; c++) { this.ctx.fillStyle = this.gameState.filled[r][c] ? '#c0392b' : '#000'; this.ctx.fillRect(c * 10, r * 10, 10, 10); } this.ctx.strokeStyle = '#3498db'; this.ctx.lineWidth = 3; this.gameState.lines.forEach(l => { if (l.path.length > 1) { this.ctx.beginPath(); this.ctx.moveTo(l.path[0].x, l.path[0].y); l.path.forEach(p => this.ctx.lineTo(p.x, p.y)); this.ctx.stroke(); } }); this.ctx.fillStyle = '#f1c40f'; this.ctx.beginPath(); this.ctx.arc(this.gameState.qix.x, this.gameState.qix.y, 15, 0, Math.PI*2); this.ctx.fill(); this.ctx.fillStyle = '#fff'; this.ctx.font = '16px Arial'; this.ctx.fillText('Draw to fill area!', 20, 30); this.ctx.fillStyle = '#e74c3c'; this.ctx.fillText('QIX', 400, 25); }
  updatePlayerInput(n, i) { window.gameState = window.gameState || {}; window.gameState[n] = { input: i }; }
}
window.QixDrawingGame = QixDrawingGame;