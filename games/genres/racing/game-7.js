// Excitebike Style Game
class ExcitebikeGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.players = players; this.gameId = gameId;
    this.isRunning = false; this.lastTime = 0; this.resizeCanvas();
    this.gameState = { time: 0, score: 0, distance: 0, player: null, obstacles: [], bumps: [], terrain: [], speed: 0, maxSpeed: 500, boost: 100, fuel: 100, status: 'racing', gameOver: false };
    this.initGame();
  }
  resizeCanvas() { this.canvas.width = this.parentElement.clientWidth || 800; this.canvas.height = this.parentElement.clientHeight || 600; }
  initGame() { this.gameState.player = { x: 100, y: 450, vy: 0, rotation: 0, onGround: true }; for (let i = 0; i < 30; i++) this.gameState.bumps.push({ x: 200 + i * 80, height: 10 + Math.random() * 25, width: 30 + Math.random() * 30 }); for (let i = 0; i < 5; i++) this.gameState.obstacles.push({ x: 300 + i * 400, y: 460, type: i % 2 === 0 ? 'ramp' : 'rock' }); }
  start() { this.isRunning = true; this.lastTime = performance.now(); this.gameLoop(this.lastTime); }
  stop() { this.isRunning = false; }
  gameLoop(ct) { if (!this.isRunning) return; const dt = (ct - this.lastTime) / 1000; this.lastTime = ct; this.update(dt); this.render(); requestAnimationFrame(t => this.gameLoop(t)); }
  update(dt) {
    if (this.gameState.gameOver) return;
    this.gameState.time += dt; this.gameState.distance += this.gameState.speed * dt / 100;
    const i = this.getPlayerInput(this.players[0]), p = this.gameState.player;
    if (i.up && this.gameState.fuel > 0) { this.gameState.speed = Math.min(this.gameState.maxSpeed, this.gameState.speed + 300 * dt); this.gameState.fuel -= dt * 15; } else { this.gameState.speed = Math.max(0, this.gameState.speed - 50 * dt); this.gameState.fuel = Math.min(100, this.gameState.fuel + dt * 5); }
    if (i.jump && p.onGround) { p.vy = -400; p.onGround = false; }
    p.vy += 600 * dt; p.y += p.vy * dt;
    let groundY = 480;
    this.gameState.bumps.forEach(b => { const relX = ((b.x - this.gameState.distance % 2000) + 2000) % 2000 - 50; if (Math.abs(p.x - 100 - relX) < b.width / 2) groundY = Math.min(groundY, 480 - b.height); });
    this.gameState.obstacles.forEach(o => { const relX = ((o.x - this.gameState.distance % 2000) + 2000) % 2000 - 50; if (Math.abs(p.x - 100 - relX) < 30 && o.type === 'ramp' && p.y > 440) p.vy = -350; if (Math.abs(p.x - 100 - relX) < 25 && o.type === 'rock' && p.y > 450) this.gameState.gameOver = true; });
    if (p.y >= groundY) { p.y = groundY; p.vy = 0; p.onGround = true; p.rotation = 0; }
    p.rotation = p.vy * 0.01;
  }
  getPlayerInput(n) { return window.gameState && window.gameState[n] ? window.gameState[n].input || {} : {}; }
  render() { const g = this.ctx.createLinearGradient(0, 0, 0, 600); g.addColorStop(0, '#87ceeb'); g.addColorStop(1, '#228b22'); this.ctx.fillStyle = g; this.ctx.fillRect(0, 0, 800, 600); this.ctx.fillStyle = '#7cba6e'; this.ctx.fillRect(0, 450, 800, 150); this.ctx.fillStyle = '#8b4513'; this.ctx.fillRect(0, 480, 800, 120); this.gameState.bumps.forEach(b => { const relX = ((b.x - this.gameState.distance % 2000) + 2000) % 2000 - 50; this.ctx.fillStyle = '#654321'; this.ctx.beginPath(); this.ctx.moveTo(relX, 480); this.ctx.quadraticCurveTo(relX + b.width/2, 480 - b.height * 2, relX + b.width, 480); this.ctx.fill(); }); this.gameState.obstacles.forEach(o => { const relX = ((o.x - this.gameState.distance % 2000) + 2000) % 2000 - 50; if (o.type === 'ramp') { this.ctx.fillStyle = '#e74c3c'; this.ctx.beginPath(); this.ctx.moveTo(relX, 480); this.ctx.lineTo(relX + 30, 450); this.ctx.lineTo(relX + 60, 480); this.ctx.fill(); } else { this.ctx.fillStyle = '#7f8c8d'; this.ctx.beginPath(); this.ctx.arc(relX, 460, 20, 0, Math.PI*2); this.ctx.fill(); } }); const b = this.gameState.player; this.ctx.save(); this.ctx.translate(b.x, b.y); this.ctx.rotate(b.rotation); this.ctx.fillStyle = '#3498db'; this.ctx.fillRect(-20, -20, 40, 25); this.ctx.fillStyle = '#f1c40f'; this.ctx.fillRect(-15, -30, 8, 15); this.ctx.fillRect(10, -30, 8, 15); this.ctx.fillStyle = '#000'; this.ctx.beginPath(); this.ctx.arc(-12, -5, 6, 0, Math.PI*2); this.ctx.arc(12, -5, 6, 0, Math.PI*2); this.ctx.fill(); this.ctx.restore(); this.ctx.fillStyle = '#2ecc71'; this.ctx.fillRect(20, 550, 200, 20); this.ctx.fillStyle = '#f1c40f'; this.ctx.fillRect(20, 550, 200 * (this.gameState.fuel/100), 20); this.ctx.strokeStyle = '#fff'; this.ctx.strokeRect(20, 550, 200, 20); this.ctx.fillStyle = '#fff'; this.ctx.font = '16px Arial'; this.ctx.fillText('Dist: ' + Math.floor(this.gameState.distance) + 'm', 650, 30); this.ctx.fillStyle = '#e74c3c'; this.ctx.fillText('EXCITEBIKE', 400, 25); }
  updatePlayerInput(n, i) { window.gameState = window.gameState || {}; window.gameState[n] = { input: i }; }
}
window.ExcitebikeGame = ExcitebikeGame;