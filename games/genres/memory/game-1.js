// Simon Says - Memory Game
class SimonGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.players = players; this.gameId = gameId;
    this.isRunning = false; this.lastTime = 0;
    this.resizeCanvas();
    this.gameState = { sequence: [], playerSeq: [], round: 1, score: 0, lights: [false, false, false, false], time: 0, status: 'waiting' };
    this.initGame();
  }
  resizeCanvas() { this.canvas.width = 400; this.canvas.height = 450; }
  initGame() { this.gameState.sequence = []; for (let i = 0; i < this.gameState.round + 2; i++) { this.gameState.sequence.push(Math.floor(Math.random() * 4)); } }
  start() { this.isRunning = true; this.lastTime = performance.now(); this.playSequence(); this.gameLoop(this.lastTime); }
  stop() { this.isRunning = false; }
  gameLoop(ct) { if (!this.isRunning) return; this.update((ct - this.lastTime) / 1000); this.lastTime = ct; this.render(); requestAnimationFrame(t => this.gameLoop(t)); }
  playSequence() { this.gameState.status = 'playing'; let i = 0; const interval = setInterval(() => { if (i >= this.gameState.sequence.length) { clearInterval(interval); this.gameState.status = 'waiting'; return; } this.gameState.lights = [false, false, false, false]; this.gameState.lights[this.gameState.sequence[i]] = true; i++; }, 800); }
  update(dt) { this.gameState.time += dt; }
  render() { const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f']; this.ctx.fillStyle = '#2c3e50'; this.ctx.fillRect(0, 0, 400, 450); this.ctx.fillStyle = '#fff'; this.ctx.font = '20px Arial'; this.ctx.textAlign = 'center'; this.ctx.fillText(`Round: ${this.gameState.round}`, 200, 40); this.ctx.fillText(`Score: ${this.gameState.score}`, 200, 70); const positions = [{x: 100, y: 150}, {x: 300, y: 150}, {x: 100, y: 300}, {x: 300, y: 300}]; positions.forEach((p, i) => { this.ctx.fillStyle = this.gameState.lights[i] ? colors[i] : '#34495e'; this.ctx.beginPath(); this.ctx.arc(p.x, p.y, 60, 0, Math.PI*2); this.ctx.fill(); }); if (this.gameState.status === 'won') { this.ctx.fillStyle = '#2ecc71'; this.ctx.font = '30px Arial'; this.ctx.fillText('CORRECT!', 200, 400); } else if (this.gameState.status === 'gameover') { this.ctx.fillStyle = '#e74c3c'; this.ctx.font = '30px Arial'; this.ctx.fillText('WRONG!', 200, 400); } }
  getPlayerInput() { return {}; }
  updatePlayerInput(n, i) { window.gameState = window.gameState || {}; window.gameState[n] = { input: i }; }
}
window.SimonGame = SimonGame;