// Flow Free Puzzle Game
class FlowFreeGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.players = players; this.gameId = gameId;
    this.isRunning = false; this.lastTime = 0; this.resizeCanvas();
    this.gameState = { time: 0, flows: [], grid: [], cellSize: 50, rows: 6, cols: 6, selectedColor: null, completed: false, status: 'playing', gameOver: false };
    this.initGame();
  }
  resizeCanvas() { this.canvas.width = this.parentElement.clientWidth || 800; this.canvas.height = this.parentElement.clientHeight || 600; }
  initGame() {
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'];
    this.gameState.flows = [{ color: colors[0], endpoints: [{ x: 0, y: 0 }, { x: 5, y: 2 }], path: [] }, { color: colors[1], endpoints: [{ x: 1, y: 0 }, { x: 3, y: 3 }], path: [] }, { color: colors[2], endpoints: [{ x: 2, y: 1 }, { x: 4, y: 5 }], path: [] }, { color: colors[3], endpoints: [{ x: 0, y: 5 }, { x: 5, y: 5 }], path: [] }];
    for (let r = 0; r < this.gameState.rows; r++) { this.gameState.grid[r] = []; for (let c = 0; c < this.gameState.cols; c++) this.gameState.grid[r][c] = null; }
    this.gameState.flows.forEach(f => { this.gameState.grid[f.endpoints[0].y][f.endpoints[0].x] = f.color; this.gameState.grid[f.endpoints[1].y][f.endpoints[1].x] = f.color; });
  }
  start() { this.isRunning = true; this.lastTime = performance.now(); this.gameLoop(this.lastTime); }
  stop() { this.isRunning = false; }
  gameLoop(ct) { if (!this.isRunning) return; const dt = (ct - this.lastTime) / 1000; this.lastTime = ct; this.update(dt); this.render(); requestAnimationFrame(t => this.gameLoop(t)); }
  update(dt) { this.gameState.time += dt; }
  getPlayerInput(n) { return window.gameState && window.gameState[n] ? window.gameState[n].input || {} : {}; }
  render() { this.ctx.fillStyle = '#1a1a2e'; this.ctx.fillRect(0, 0, 800, 600); const cs = 60, ox = 170, oy = 70; for (let r = 0; r < this.gameState.rows; r++) for (let c = 0; c < this.gameState.cols; c++) { this.ctx.fillStyle = '#2c3e50'; this.ctx.fillRect(ox + c * cs, oy + r * cs, cs - 2, cs - 2); } this.gameState.flows.forEach(f => { if (f.path.length > 0) { this.ctx.strokeStyle = f.color; this.ctx.lineWidth = cs * 0.4; this.ctx.lineCap = 'round'; this.ctx.beginPath(); this.ctx.moveTo(ox + f.path[0].x * cs + cs/2, oy + f.path[0].y * cs + cs/2); f.path.forEach(p => this.ctx.lineTo(ox + p.x * cs + cs/2, oy + p.y * cs + cs/2)); this.ctx.stroke(); } f.endpoints.forEach(e => { this.ctx.fillStyle = f.color; this.ctx.beginPath(); this.ctx.arc(ox + e.x * cs + cs/2, oy + e.y * cs + cs/2, cs * 0.35, 0, Math.PI*2); this.ctx.fill(); this.ctx.fillStyle = 'rgba(255,255,255,0.3)'; this.ctx.beginPath(); this.ctx.arc(ox + e.x * cs + cs/2 - 5, oy + e.y * cs + cs/2 - 5, 8, 0, Math.PI*2); this.ctx.fill(); }); }); this.ctx.fillStyle = '#fff'; this.ctx.font = '16px Arial'; this.ctx.textAlign = 'left'; this.ctx.fillText('Connect matching colors!', 20, 30); this.ctx.fillStyle = '#f1c40f'; this.ctx.fillText('FLOW FREE', 400, 25); }
  updatePlayerInput(n, i) { window.gameState = window.gameState || {}; window.gameState[n] = { input: i }; }
}
window.FlowFreeGame = FlowFreeGame;