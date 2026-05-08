// Complete Top Down Shooter Game
class TopDownShooterGame {
  constructor(canvas, players, gameId) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.players=players;this.gameId=gameId;
    this.isRunning=false;this.lastTime=0;this.resizeCanvas();
    this.gameState={player:null,enemies:[],bullets:[],score:0,hp:100,time:0,status:'playing'};
    this.initGame();
  }
  resizeCanvas(){this.canvas.width=this.canvas.parentElement.clientWidth||600;this.canvas.height=this.canvas.parentElement.clientHeight||450;}
  initGame(){this.gameState.player={x:300,y:400,angle:0};for(let i=0;i<4;i++)this.spawnEnemy();}
  spawnEnemy(){this.gameState.enemies.push({x:Math.random()*550+25,y:-30,speed:50+Math.random()*50,hp:20});}
  start(){this.isRunning=true;this.lastTime=performance.now();this.gameLoop(this.lastTime);}
  stop(){this.isRunning=false;}
  gameLoop(cTime){if(!this.isRunning)return;const dt=(cTime-this.lastTime)/1000;this.lastTime=cTime;this.update(dt);this.render();requestAnimationFrame(t=>this.gameLoop(t));}
  update(dt){
    const p=this.gameState.player,i=this.getPlayerInput();
    const dx=i.x||0,dy=i.y||0;if(dx!==0||dy!==0)p.angle=Math.atan2(dy,dx);
    p.x+=dx*150*dt;p.y+=dy*150*dt;p.x=Math.max(20,Math.min(580,p.x));p.y=Math.max(20,Math.min(430,p.y));
    if(i.action){this.gameState.bullets.push({x:p.x,y:p.y,vx:Math.cos(p.angle)*500,vy:Math.sin(p.angle)*500});}
    if(Math.random()<0.02)this.spawnEnemy();
    this.gameState.bullets.forEach(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;this.gameState.enemies.forEach(e=>{if(Math.sqrt((b.x-e.x)**2+(b.y-e.y)**2)<20){e.hp-=10;b.remove=true;if(e.hp<=0){e.remove=true;this.gameState.score+=50;}}})});
    this.gameState.enemies.forEach(e=>{e.y+=e.speed*dt;if(Math.sqrt((e.x-p.x)**2+(e.y-p.y)**2)<20){this.gameState.hp-=10;e.remove=true;}});
    this.gameState.bullets=this.gameState.bullets.filter(b=>!b.remove&&b.x>0&&b.x<600&&b.y>0&&b.y<450);this.gameState.enemies=this.gameState.enemies.filter(e=>e.y<500&&!e.remove);
    if(this.gameState.hp<=0)this.gameState.status='gameover';
  }
  render(){
    const ctx=this.ctx;ctx.fillStyle='#000';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    this.gameState.enemies.forEach(e=>{ctx.fillStyle='#e74c3c';ctx.beginPath();ctx.arc(e.x,e.y,15,0,Math.PI*2);ctx.fill();});
    const p=this.gameState.player;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle='#3498db';ctx.beginPath();ctx.arc(0,0,15,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f1c40f';ctx.fillRect(10,-3,15,6);ctx.restore();
    this.gameState.bullets.forEach(b=>{ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(b.x,b.y,4,0,Math.PI*2);ctx.fill();});
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(10,10,110,40);ctx.fillStyle='#fff';ctx.font='14px Arial';ctx.fillText(`Score: ${this.gameState.score}`,20,30);ctx.fillText(`HP: ${this.gameState.hp}`,20,48);
    if(this.gameState.status==='gameover'){ctx.fillStyle='rgba(0,0,0,0.8)';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);ctx.fillStyle='#e74c3c';ctx.font='bold 40px Arial';ctx.textAlign='center';ctx.fillText('GAME OVER',300,225);}
  }
  getPlayerInput(){const n=this.players[0]||'Player';return window.gameState&&window.gameState[n]?window.gameState[n].input||{}:{};}
  updatePlayerInput(n,i){window.gameState=window.gameState||{};window.gameState[n]={input:i};}
}
window.TopDownShooterGame = TopDownShooterGame;