// Bomberman Style Game
class BombermanGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.players = players; this.gameId = gameId;
    this.isRunning = false; this.lastTime = 0; this.resizeCanvas(); window.addEventListener('resize', () => this.resizeCanvas());
    this.gameState = { time: 0, score: 0, player: null, bombs: [], explosions: [], enemies: [], blocks: [], grid: [], gridSize: 40, cols: 15, rows: 11, powerups: [], status: 'playing', gameOver: false };
    this.initGame();
  }
  resizeCanvas() { this.canvas.width = this.parentElement.clientWidth || 800; this.canvas.height = this.parentElement.clientHeight || 600; }
  initGame() {
    this.gameState.player = { x: 60, y: 60, vx: 0, vy: 0, range: 2, maxBombs: 1, bombsPlaced: 0, speed: 1, invincible: 0 };
    for (let r = 0; r < this.gameState.rows; r++) { this.gameState.grid[r] = []; for (let c = 0; c < this.gameState.cols; c++) { this.gameState.grid[r][c] = (r === 0 || r === this.gameState.rows-1 || c === 0 || c === this.gameState.cols-1 || (r % 2 === 0 && c % 2 === 0)) ? 'wall' : (Math.random() < 0.3 ? 'block' : null); } }
    this.gameState.grid[1][1] = null; this.gameState.grid[1][2] = null; this.gameState.grid[2][1] = null;
    for (let i = 0; i < 6; i++) this.gameState.enemies.push({ x: 200 + Math.random() * 500, y: 100 + Math.random() * 300, vx: (Math.random() - 0.5) * 100, vy: (Math.random() - 0.5) * 100 });
  }
  start() { this.isRunning = true; this.lastTime = performance.now(); this.gameLoop(this.lastTime); }
  stop() { this.isRunning = false; }
  gameLoop(ct) { if (!this.isRunning) return; const dt = (ct - this.lastTime) / 1000; this.lastTime = ct; this.update(dt); this.render(); requestAnimationFrame(t => this.gameLoop(t)); }
  update(dt) {
    if (this.gameState.gameOver) return; this.gameState.time += dt;
    if (this.gameState.player.invincible > 0) this.gameState.player.invincible -= dt;
    const i = this.getPlayerInput(this.players[0]), p = this.gameState.player;
    if (i.left) p.vx = -150 * p.speed; else if (i.right) p.vx = 150 * p.speed; else p.vx = 0;
    if (i.up) p.vy = -150 * p.speed; else if (i.down) p.vy = 150 * p.speed; else p.vy = 0;
    let newX = p.x + p.vx * dt, newY = p.y + p.vy * dt;
    if (!this.checkCollision(newX, p.y, 30)) p.x = newX; if (!this.checkCollision(p.x, newY, 30)) p.y = newY;
    if (i.action && p.bombsPlaced < p.maxBombs) { this.placeBomb(); }
    this.gameState.bombs.forEach((b, bi) => { b.timer -= dt; if (b.timer <= 0) { this.createExplosion(b.x, b.y, b.range); this.gameState.bombs.splice(bi, 1); p.bombsPlaced--; } });
    this.gameState.explosions.forEach((e, ei) => { e.timer -= dt; if (e.timer <= 0) this.gameState.explosions.splice(ei, 1); });
    this.gameState.enemies.forEach(e => { e.x += e.vx * dt; e.y += e.vy * dt; if (e.x < 20 || e.x > 760) e.vx *= -1; if (e.y < 60 || e.y > 400) e.vy *= -1; if (this.checkCollision(e.x, e.y, 30) && this.gameState.player.invincible <= 0) this.gameState.gameOver = true; });
  }
  checkCollision(x, y, size) { const cx = Math.floor(x / this.gameState.gridSize), cy = Math.floor(y / this.gameState.gridSize); if (cx < 0 || cx >= this.gameState.cols || cy < 0 || cy >= this.gameState.rows) return true; if (this.gameState.grid[cy][cx] === 'wall' || this.gameState.grid[cy][cx] === 'block') return true; this.gameState.bombs.forEach(b => { if (Math.floor(b.x / this.gameState.gridSize) === cx && Math.floor(b.y / this.gameState.gridSize) === cy && b.timer > 0.5) return true; }); return false; }
  placeBomb() { const p = this.gameState.player, bx = Math.floor(p.x / this.gameState.gridSize) * this.gameState.gridSize + 20, by = Math.floor(p.y / this.gameState.gridSize) * this.gameState.gridSize + 20; this.gameState.bombs.push({ x: bx, y: by, timer: 2, range: this.gameState.player.range }); this.gameState.player.bombsPlaced++; }
  createExplosion(x, y, range) { for (let dx = -range; dx <= range; dx++) for (let dy = -range; dy <= range; dy++) { if (Math.abs(dx) === Math.abs(dy)) continue; const ex = x + dx * this.gameState.gridSize, ey = y + dy * this.gameState.gridSize; this.gameState.explosions.push({ x: ex, y: ey, timer: 0.5 }); this.gameState.enemies = this.gameState.enemies.filter(e => { const d = Math.sqrt((e.x - ex) ** 2 + (e.y - ey) ** 2); if (d < 40) { this.gameState.score += 100; return false; } return true; }); if (this.gameState.grid[Math.floor(ey/this.gameState.gridSize)][Math.floor(ex/this.gameState.gridSize)] === 'block') { this.gameState.grid[Math.floor(ey/this.gameState.gridSize)][Math.floor(ex/this.gameState.gridSize)] = null; this.gameState.score += 10; } } }
  getPlayerInput(n) { return window.gameState && window.gameState[n] ? window.gameState[n].input || {} : {}; }
  render() { this.ctx.fillStyle = '#2ecc71'; this.ctx.fillRect(0, 0, 800, 600); this.ctx.fillStyle = '#27ae60'; for (let r = 0; r < this.gameState.rows; r++) for (let c = 0; c < this.gameState.cols; c++) { const cell = this.gameState.grid[r][c]; if (cell === 'wall') { this.ctx.fillStyle = '#7f8c8d'; this.ctx.fillRect(c * 40, r * 40, 40, 40); } else if (cell === 'block') { this.ctx.fillStyle = '#d35400'; this.ctx.fillRect(c * 40 + 2, r * 40 + 2, 36, 36); } } this.gameState.bombs.forEach(b => { this.ctx.fillStyle = '#000'; this.ctx.beginPath(); this.ctx.arc(b.x, b.y, 15, 0, Math.PI*2); this.ctx.fill(); this.ctx.fillStyle = '#e74c3c'; this.ctx.fillRect(b.x - 3, b.y - 20, 6, 10); }); this.gameState.explosions.forEach(e => { this.ctx.fillStyle = '#f1c40f'; this.ctx.beginPath(); this.ctx.arc(e.x, e.y, 20, 0, Math.PI*2); this.ctx.fill(); }); this.gameState.enemies.forEach(e => { this.ctx.fillStyle = '#e74c3c'; this.ctx.beginPath(); this.ctx.arc(e.x, e.y, 15, 0, Math.PI*2); this.ctx.fill(); this.ctx.fillStyle = '#fff'; this.ctx.fillRect(e.x - 8, e.y - 5, 5, 5); this.ctx.fillRect(e.x + 3, e.y - 5, 5, 5); }); const p = this.gameState.player; this.ctx.fillStyle = '#fff'; this.ctx.fillRect(p.x - 15, p.y - 15, 30, 30); this.ctx.fillStyle = '#f5d0c5'; this.ctx.beginPath(); this.ctx.arc(p.x, p.y - 20, 10, 0, Math.PI*2); this.ctx.fill(); this.ctx.fillStyle = '#fff'; this.ctx.font = '16px Arial'; this.ctx.fillText('Score: ' + this.gameState.score, 20, 30); this.ctx.fillStyle = '#e74c3c'; this.ctx.fillText('BOMBERMAN', 400, 25); if (this.gameState.gameOver) { this.ctx.fillStyle = 'rgba(0,0,0,0.7)'; this.ctx.fillRect(0, 0, 800, 600); this.ctx.fillStyle = '#e74c3c'; this.ctx.font = '48px Arial'; this.ctx.fillText('GAME OVER', 400, 300); } }
  updatePlayerInput(n, i) { window.gameState = window.gameState || {}; window.gameState[n] = { input: i }; }
}
window.BombermanGame = BombermanGame;