// Complete Tower Defense Game
class TowerDefenseGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.players = players;
    this.gameId = gameId;
    this.isRunning = false;
    this.lastTime = 0;
    this.resizeCanvas();
    this.gameState = {
      towers: [], enemies: [], projectiles: [], path: [], lives: 20, money: 200, wave: 1, score: 0, time: 0, status: 'playing'
    };
    this.initMap();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 500;
  }

  initMap() {
    this.gameState.path = [{x:0,y:250},{x:150,y:250},{x:150,y:100},{x:400,y:100},{x:400,y:400},{x:650,y:400},{x:650,y:200},{x:800,y:200}];
  }

  start() { this.isRunning = true; this.lastTime = performance.now(); this.gameLoop(this.lastTime); }
  stop() { this.isRunning = false; }

  gameLoop(currentTime) {
    if (!this.isRunning) return;
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.033);
    this.lastTime = currentTime;
    this.update(dt);
    this.render();
    requestAnimationFrame(t => this.gameLoop(t));
  }

  update(dt) {
    this.gameState.time += dt;
    if (Math.random() < 0.02 * this.gameState.wave) this.spawnEnemy();
    this.gameState.enemies.forEach(e => {
      const target = this.gameState.path[e.pathIndex];
      const dx = target.x - e.x, dy = target.y - e.y, dist = Math.sqrt(dx*dx+dy*dy);
      if (dist < 5) { e.pathIndex++; if (e.pathIndex >= this.gameState.path.length) { this.gameState.lives--; e.remove = true; } }
      else { e.x += (dx/dist)*e.speed; e.y += (dy/dist)*e.speed; }
    });
    this.gameState.towers.forEach(t => {
      if (t.cooldown > 0) t.cooldown -= dt;
      if (t.cooldown <= 0) {
        const target = this.gameState.enemies.find(e => { const d=Math.sqrt((e.x-t.x)**2+(e.y-t.y)**2); return d < t.range; });
        if (target) { this.gameState.projectiles.push({x:t.x,y:t.y,vx:(target.x-t.x)*5,vy:(target.y-t.y)*5,damage:t.damage}); t.cooldown = 1/t.rate; }
      }
    });
    this.gameState.projectiles.forEach(p => { p.x += p.vx*dt; p.y += p.vy*dt; this.gameState.enemies.forEach(e => { if(Math.sqrt((p.x-e.x)**2+(p.y-e.y)**2)<15){e.hp-=p.damage;p.remove=true;if(e.hp<=0){this.gameState.money+=e.reward;this.gameState.score+=e.reward*10;e.remove=true;}} }); });
    this.gameState.enemies = this.gameState.enemies.filter(e => !e.remove);
    this.gameState.projectiles = this.gameState.projectiles.filter(p => !p.remove && p.x>0 && p.x<this.canvas.width && p.y>0 && p.y<this.canvas.height);
    if (this.gameState.lives <= 0) this.gameState.status = 'gameover';
  }

  spawnEnemy() {
    const types = [{name:'Goblin',hp:30,speed:2,reward:10},{name:'Orc',hp:60,speed:1.5,reward:20},{name:'Boss',hp:200,speed:0.8,reward:50}];
    const type = types[Math.min(this.gameState.wave-1,2)] || types[0];
    this.gameState.enemies.push({...type,x:0,y:250,pathIndex:1,hp:type.hp,remove:false});
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    ctx.strokeStyle='#333'; ctx.lineWidth=30; ctx.beginPath(); ctx.moveTo(this.gameState.path[0].x,this.gameState.path[0].y);
    this.gameState.path.slice(1).forEach(p => ctx.lineTo(p.x,p.y)); ctx.stroke();
    this.gameState.towers.forEach(t => { ctx.fillStyle='#3498db'; ctx.fillRect(t.x-15,t.y-15,30,30); ctx.fillStyle='#fff'; ctx.font='10px Arial'; ctx.textAlign='center'; ctx.fillText(t.type[0],t.x,t.y+4); });
    this.gameState.enemies.forEach(e => { ctx.fillStyle=e.name==='Boss'?'#8e44ad':'#e74c3c'; ctx.beginPath(); ctx.arc(e.x,e.y,12,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#fff'; ctx.fillRect(e.x-15,e.y-20,30,4); ctx.fillStyle='#2ecc71'; ctx.fillRect(e.x-15,e.y-20,30*(e.hp/(e.name==='Boss'?200:e.name==='Orc'?60:30)),4); });
    this.gameState.projectiles.forEach(p => { ctx.fillStyle='#f1c40f'; ctx.beginPath(); ctx.arc(p.x,p.y,4,0,Math.PI*2); ctx.fill(); });
    ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(10,10,150,70); ctx.fillStyle='#fff'; ctx.font='14px Arial'; ctx.textAlign='left';
    ctx.fillText(`Lives: ${this.gameState.lives}`,20,30); ctx.fillText(`Money: ${this.gameState.money}`,20,50); ctx.fillText(`Wave: ${this.gameState.wave}`,20,70);
    if (this.gameState.status === 'gameover') { ctx.fillStyle='rgba(0,0,0,0.8)'; ctx.fillRect(0,0,this.canvas.width,this.canvas.height); ctx.fillStyle='#e74c3c'; ctx.font='bold 40px Arial'; ctx.textAlign='center'; ctx.fillText('GAME OVER',this.canvas.width/2,this.canvas.height/2); }
  }

  getPlayerInput() { const name = this.players[0] || 'Player'; return window.gameState && window.gameState[name] ? window.gameState[name].input || {} : {}; }
  updatePlayerInput(name, input) { window.gameState = window.gameState || {}; window.gameState[name] = { input: input }; if(input.action && this.gameState.money>=50){this.gameState.towers.push({x:this.gameState.enemies[0]?.x||400,y:this.gameState.enemies[0]?.y||250,range:100,damage:10,rate:1,cooldown:0,type:'Turret'});this.gameState.money-=50;} }
}
window.TowerDefenseGame = TowerDefenseGame;