// Tennis Grand Slam Game
class TennisGrandSlamGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.players = players; this.gameId = gameId;
    this.isRunning = false; this.lastTime = 0; this.resizeCanvas();
    this.gameState = { time: 0, p1Score: 0, p2Score: 0, p1Games: 0, p2Games: 0, p1Sets: 0, p2Sets: 0, ball: null, p1: null, p2: null, serving: 1, serverPos: 0, status: 'playing', gameOver: false };
    this.initGame();
  }
  resizeCanvas() { this.canvas.width = this.parentElement.clientWidth || 800; this.canvas.height = this.parentElement.clientHeight || 600; }
  initGame() { this.gameState.p1 = { x: 150, y: 300, vx: 0, vy: 0 }; this.gameState.p2 = { x: 650, y: 300, vx: 0, vy: 0 }; this.gameState.ball = { x: 400, y: 100, vx: 0, vy: 0, rotation: 0 }; }
  start() { this.isRunning = true; this.lastTime = performance.now(); this.gameLoop(this.lastTime); }
  stop() { this.isRunning = false; }
  gameLoop(ct) { if (!this.isRunning) return; const dt = (ct - this.lastTime) / 1000; this.lastTime = ct; this.update(dt); this.render(); requestAnimationFrame(t => this.gameLoop(t)); }
  update(dt) {
    if (this.gameState.gameOver) return; this.gameState.time += dt;
    const i1 = this.getPlayerInput('player1'), i2 = this.getPlayerInput('player2');
    const p1 = this.gameState.p1, p2 = this.gameState.p2, b = this.gameState.ball;
    if (i1.left) p1.x = Math.max(50, p1.x - 6); if (i1.right) p1.x = Math.min(350, p1.x + 6); if (i1.up) p1.y = Math.max(150, p1.y - 6); if (i1.down) p1.y = Math.min(450, p1.y + 6);
    if (i2.left) p2.x = Math.max(450, p2.x - 6); if (i2.right) p2.x = Math.min(750, p2.x + 6); if (i2.up) p2.y = Math.max(150, p2.y - 6); if (i2.down) p2.y = Math.min(450, p2.y + 6);
    if (this.gameState.serving === 1) { if (b.vx === 0 && b.vy === 0) { b.vx = i1.serve ? (Math.random() - 0.5) * 100 : 0; b.vy = i1.serve ? 300 : 0; } } else { if (b.vx === 0 && b.vy === 0) { b.vx = i2.serve ? (Math.random() - 0.5) * 100 : 0; b.vy = i2.serve ? -300 : 0; } }
    b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 200 * dt;
    if (b.x < 50 || b.x > 750 || b.y < 100 || b.y > 500) { if (b.y < 150) { this.gameState.p2Score++; this.resetPoint(); } else if (b.y > 450) { this.gameState.p1Score++; this.resetPoint(); } }
    [p1, p2].forEach((p, idx) => { const dx = b.x - p.x, dy = b.y - p.y; if (Math.sqrt(dx*dx + dy*dy) < 25) { b.vx = idx === 0 ? 200 + Math.random() * 100 : -200 - Math.random() * 100; b.vy = -150 - Math.random() * 50; } });
  }
  resetPoint() { this.gameState.ball.x = 400; this.gameState.ball.y = 100; this.gameState.ball.vx = 0; this.gameState.ball.vy = 0; this.gameState.serving = this.gameState.serving === 1 ? 2 : 1; }
  getPlayerInput(n) { return window.gameState && window.gameState[n] ? window.gameState[n].input || {} : {}; }
  render() { const g = this.ctx.createLinearGradient(0, 0, 0, 600); g.addColorStop(0, '#87ceeb'); g.addColorStop(1, '#228b22'); this.ctx.fillStyle = g; this.ctx.fillRect(0, 0, 800, 600); this.ctx.fillStyle = '#e8dcb5'; this.ctx.fillRect(50, 150, 700, 350); this.ctx.strokeStyle = '#fff'; this.ctx.lineWidth = 3; this.ctx.beginPath(); this.ctx.moveTo(400, 150); this.ctx.lineTo(400, 500); this.ctx.stroke(); this.ctx.beginPath(); this.ctx.moveTo(50, 300); this.ctx.lineTo(750, 300); this.ctx.stroke(); this.ctx.strokeStyle = '#2ecc71'; this.ctx.strokeRect(100, 175, 200, 150); this.ctx.strokeRect(500, 175, 200, 150); const b = this.gameState.ball; this.ctx.fillStyle = '#fff'; this.ctx.beginPath(); this.ctx.arc(b.x, b.y, 10, 0, Math.PI*2); this.ctx.fill(); [this.gameState.p1, this.gameState.p2].forEach(p => { this.ctx.fillStyle = '#3498db'; this.ctx.fillRect(p.x - 15, p.y - 20, 30, 40); this.ctx.fillStyle = '#f5d0c5'; this.ctx.beginPath(); this.ctx.arc(p.x, p.y - 25, 12, 0, Math.PI*2); this.ctx.fill(); }); this.ctx.fillStyle = '#fff'; this.ctx.font = 'bold 24px Arial'; this.ctx.textAlign = 'center'; this.ctx.fillText(this.gameState.p1Score + ' - ' + this.gameState.p2Score, 400, 50); this.ctx.font = '16px Arial'; this.ctx.fillText('P1: ' + this.gameState.p1Games + ' games', 150, 30); this.ctx.fillText('P2: ' + this.gameState.p2Games + ' games', 650, 30); this.ctx.fillStyle = '#e74c3c'; this.ctx.fillText('TENNIS GRAND SLAM', 400, 25); }
  updatePlayerInput(n, i) { window.gameState = window.gameState || {}; window.gameState[n] = { input: i }; }
}
window.TennisGrandSlamGame = TennisGrandSlamGame;