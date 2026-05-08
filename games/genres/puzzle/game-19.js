// Picross Nonogram Game
class PicrossGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.players = players; this.gameId = gameId;
    this.isRunning = false; this.lastTime = 0; this.resizeCanvas();
    this.gameState = { time: 0, score: 0, grid: [], solution: [], rows: 10, cols: 10, selected: 'fill', cursor: { x: 0, y: 0 }, completed: false, status: 'playing', gameOver: false };
    this.initGame();
  }
  resizeCanvas() { this.canvas.width = this.parentElement.clientWidth || 800; this.canvas.height = this.parentElement.clientHeight || 600; }
  initGame() { for (let y = 0; y < this.gameState.rows; y++) { this.gameState.grid[y] = []; this.gameState.solution[y] = []; for (let x = 0; x < this.gameState.cols; x++) { this.gameState.grid[y][x] = 0; this.gameState.solution[y][x] = Math.random() < 0.5 ? 1 : 0; } } this.gameState.solution[0][0] = 1; this.gameState.solution[0][1] = 1; }
  start() { this.isRunning = true; this.lastTime = performance.now(); this.gameLoop(this.lastTime); }
  stop() { this.isRunning = false; }
  gameLoop(ct) { if (!this.isRunning) return; const dt = (ct - this.lastTime) / 1000; this.lastTime = ct; this.update(dt); this.render(); requestAnimationFrame(t => this.gameLoop(t)); }
  update(dt) { if (this.gameState.completed) return; let correct = true; for (let y = 0; y < this.gameState.rows; y++) for (let x = 0; x < this.gameState.cols; x++) if (this.gameState.grid[y][x] !== this.gameState.solution[y][x]) correct = false; if (correct) { this.gameState.completed = true; this.gameState.score = 1000; } }
  getPlayerInput(n) { return window.gameState && window.gameState[n] ? window.gameState[n].input || {} : {}; }
  render() {
    this.ctx.fillStyle = '#2c3e50'; this.ctx.fillRect(0, 0, 800, 600);
    const cellSize = 35, offsetX = 150, offsetY = 80;
    for (let r = 0; r < this.gameState.rows; r++) { let hints = [], count = 0; for (let c = 0; c < this.gameState.cols; c++) { if (this.gameState.solution[r][c]) count++; else if (count > 0) { hints.push(count); count = 0; } } if (count > 0) hints.push(count); this.ctx.fillStyle = '#fff'; this.ctx.font = '14px Arial'; this.ctx.textAlign = 'right'; this.ctx.fillText(hints.join(' ') || '-', offsetX - 10, offsetY + r * cellSize + 25); }
    for (let c = 0; c < this.gameState.cols; c++) { let hints = [], count = 0; for (let r = 0; r < this.gameState.rows; r++) { if (this.gameState.solution[r][c]) count++; else if (count > 0) { hints.push(count); count = 0; } } if (count > 0) hints.push(count); this.ctx.textAlign = 'center'; this.ctx.fillText(hints.join('\n') || '-', offsetX + c * cellSize + cellSize/2, offsetY - 10); }
    for (let y = 0; y < this.gameState.rows; y++) for (let x = 0; x < this.gameState.cols; x++) { this.ctx.fillStyle = this.gameState.grid[y][x] === 1 ? '#3498db' : (this.gameState.grid[y][x] === 2 ? '#e74c3c' : '#ecf0f1'); this.ctx.fillRect(offsetX + x * cellSize + 2, offsetY + y * cellSize + 2, cellSize - 4, cellSize - 4); }
    const cx = this.gameState.cursor.x, cy = this.gameState.cursor.y; this.ctx.strokeStyle = '#f1c40f'; this.ctx.lineWidth = 3; this.ctx.strokeRect(offsetX + cx * cellSize, offsetY + cy * cellSize, cellSize, cellSize);
    this.ctx.fillStyle = '#fff'; this.ctx.font = '16px Arial'; this.ctx.textAlign = 'left'; this.ctx.fillText('Fill: X | Mark: O', 20, 30); this.ctx.fillText('Mode: ' + (this.gameState.selected === 'fill' ? 'FILL' : 'MARK'), 20, 55); this.ctx.fillStyle = '#3498db'; this.ctx.fillText('PICROSS', 400, 25);
    if (this.gameState.completed) { this.ctx.fillStyle = 'rgba(0,0,0,0.7)'; this.ctx.fillRect(0, 0, 800, 600); this.ctx.fillStyle = '#2ecc71'; this.ctx.font = '48px Arial'; this.ctx.fillText('COMPLETE!', 400, 300); }
  }
  updatePlayerInput(n, i) { window.gameState = window.gameState || {}; window.gameState[n] = { input: i }; const c = this.gameState.cursor; if (i.left) c.x = Math.max(0, c.x - 1); if (i.right) c.x = Math.min(9, c.x + 1); if (i.up) c.y = Math.max(0, c.y - 1); if (i.down) c.y = Math.min(9, c.y + 1); if (i.action) this.gameState.grid[c.y][c.x] = this.gameState.selected === 'fill' ? 1 : 2; }
}
window.PicrossGame = PicrossGame;