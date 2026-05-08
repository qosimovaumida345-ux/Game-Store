// Arkanoid Deluxe Game
class ArkanoidDeluxeGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.players = players; this.gameId = gameId;
    this.isRunning = false; this.lastTime = 0; this.resizeCanvas();
    this.gameState = { time: 0, score: 0, lives: 3, paddle: null, ball: null, bricks: [], powerups: [], level: 1, status: 'playing', gameOver: false };
    this.initGame();
  }
  resizeCanvas() { this.canvas.width = this.parentElement.clientWidth || 800; this.canvas.height = this.parentElement.clientHeight || 600; }
  initGame() {
    this.gameState.paddle = { x: 350, y: 560, width: 100, height: 15 };
    this.gameState.ball = { x: 400, y: 540, vx: 200, vy: -250, radius: 8, speed: 300 };
    const colors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#e67e22'];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 10; c++) this.gameState.bricks.push({ x: 80 + c * 65, y: 80 + r * 30, w: 60, h: 25, color: colors[r], hp: 1 });
  }
  start() { this.isRunning = true; this.lastTime = performance.now(); this.gameLoop(this.lastTime); }
  stop() { this.isRunning = false; }
  gameLoop(ct) { if (!this.isRunning) return; const dt = (ct - this.lastTime) / 1000; this.lastTime = ct; this.update(dt); this.render(); requestAnimationFrame(t => this.gameLoop(t)); }
  update(dt) {
    if (this.gameState.gameOver) return; this.gameState.time += dt;
    const i = this.getPlayerInput(this.players[0]), p = this.gameState.paddle, b = this.gameState.ball;
    if (i.left) p.x = Math.max(20, p.x - 8); if (i.right) p.x = Math.min(780 - p.width, p.x + 8);
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < 10 || b.x > 790) b.vx *= -1;
    if (b.y < 10) b.vy *= -1;
    if (b.y > 600) { this.gameState.lives--; if (this.gameState.lives <= 0) this.gameState.gameOver = true; else { b.x = 400; b.y = 540; b.vx = 200; b.vy = -250; p.x = 350; } }
    if (b.x > p.x && b.x < p.x + p.width && b.y > p.y - 10 && b.y < p.y + 10) { b.vy = -Math.abs(b.vy); b.vx += (b.x - (p.x + p.width/2)) * 3; }
    this.gameState.bricks.forEach((br, bi) => { if (b.x > br.x && b.x < br.x + br.w && b.y > br.y && b.y < br.y + br.h) { b.vy *= -1; this.gameState.bricks.splice(bi, 1); this.gameState.score += 10; } });
    if (this.gameState.bricks.length === 0) { this.gameState.level++; this.gameState.score += 1000; this.initGame(); }
  }
  getPlayerInput(n) { return window.gameState && window.gameState[n] ? window.gameState[n].input || {} : {}; }
  render() { this.ctx.fillStyle = '#1a1a2e'; this.ctx.fillRect(0, 0, 800, 600); this.gameState.bricks.forEach(br => { this.ctx.fillStyle = br.color; this.ctx.fillRect(br.x, br.y, br.w, br.h); this.ctx.strokeStyle = '#fff'; this.ctx.strokeRect(br.x, br.y, br.w, br.h); }); this.ctx.fillStyle = '#3498db'; this.ctx.fillRect(this.gameState.paddle.x, this.gameState.paddle.y, this.gameState.paddle.width, this.gameState.paddle.height); this.ctx.fillStyle = '#fff'; this.ctx.beginPath(); this.ctx.arc(this.gameState.ball.x, this.gameState.ball.y, this.gameState.ball.radius, 0, Math.PI*2); this.ctx.fill(); this.ctx.fillStyle = '#fff'; this.ctx.font = '16px Arial'; this.ctx.fillText('Score: ' + this.gameState.score, 20, 30); this.ctx.fillText('Level: ' + this.gameState.level, 150, 30); this.ctx.fillText('Lives: ' + this.gameState.lives, 280, 30); this.ctx.fillStyle = '#f1c40f'; this.ctx.fillText('ARKANOID DELUXE', 400, 25); }
  updatePlayerInput(n, i) { window.gameState = window.gameState || {}; window.gameState[n] = { input: i }; }
}
window.ArkanoidDeluxeGame = ArkanoidDeluxeGame;