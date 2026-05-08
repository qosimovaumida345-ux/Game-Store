// Complete Hero Shooter Game
class HeroShooterGame {
  constructor(canvas, players, gameId) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.players=players;this.gameId=gameId;
    this.isRunning=false;this.lastTime=0;this.resizeCanvas();
    this.gameState={hero:null,targets:[],bullets:[],score:0,time:45,status:'playing'};
    this.initGame();
  }
  resizeCanvas(){this.canvas.width=this.canvas.parentElement.clientWidth||600;this.canvas.height=this.canvas.parentElement.clientHeight||400;}
  initGame(){this.gameState.hero={x:300,y:350,angle:0};for(let i=0;i<6;i++)this.gameState.targets.push({x:100+i*80,y:100,size:30});}
  start(){this.isRunning=true;this.lastTime=performance.now();this.gameLoop(this.lastTime);}
  stop(){this.isRunning=false;}
  gameLoop(cTime){if(!this.isRunning)return;const dt=(cTime-this.lastTime)/1000;this.lastTime=cTime;this.update(dt);this.render();requestAnimationFrame(t=>this.gameLoop(t));}
  update(dt){const h=this.gameState.hero,i=this.getPlayerInput();if(i.left)h.angle-=3*dt;if(i.right)h.angle+=3*dt;if(i.action){this.gameState.bullets.push({x:h.x,y:h.y,vx:Math.cos(h.angle)*400,vy:Math.sin(h.angle)*400});}this.gameState.bullets.forEach(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;this.gameState.targets.forEach(t=>{if(Math.sqrt((b.x-t.x)**2+(b.y-t.y)**2)<t.size){t.hit=true;b.remove=true;this.gameState.score+=100;}})});this.gameState.bullets=this.gameState.bullets.filter(b=>!b.remove&&b.x>0&&b.x<600&&b.y>0&&b.y<400);this.gameState.targets=this.gameState.targets.filter(t=>!t.hit);this.gameState.time-=dt;if(this.gameState.time<=0)this.gameState.status='gameover';if(this.gameState.targets.length===0){for(let i=0;i<6;i++)this.gameState.targets.push({x:100+i*80,y:100,size:30});}}
  render(){const ctx=this.ctx;ctx.fillStyle='#1a1a2e';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);this.gameState.targets.forEach(t=>{ctx.fillStyle='#e74c3c';ctx.beginPath();ctx.arc(t.x,t.y,t.size,0,Math.PI*2);ctx.fill();});const h=this.gameState.hero;ctx.save();ctx.translate(h.x,h.y);ctx.rotate(h.angle);ctx.fillStyle='#3498db';ctx.fillRect(-15,-15,30,30);ctx.fillStyle='#95a5a6';ctx.fillRect(10,-3,20,6);ctx.restore();this.gameState.bullets.forEach(b=>{ctx.fillStyle='#f1c40f';ctx.beginPath();ctx.arc(b.x,b.y,5,0,Math.PI*2);ctx.fill();});ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(10,10,100,40);ctx.fillStyle='#fff';ctx.font='14px Arial';ctx.fillText(`Score: ${this.gameState.score}`,20,30);ctx.fillText(`Time: ${Math.ceil(this.gameState.time)}`,20,50);}
  getPlayerInput(){const n=this.players[0]||'Player';return window.gameState&&window.gameState[n]?window.gameState[n].input||{}:{};}
  updatePlayerInput(n,i){window.gameState=window.gameState||{};window.gameState[n]={input:i};}
}
window.HeroShooterGame = HeroShooterGame;