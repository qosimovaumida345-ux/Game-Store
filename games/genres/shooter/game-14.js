// Complete Twin Stick Shooter Game
class TwinStickShooterGame {
  constructor(canvas, players, gameId) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.players=players;this.gameId=gameId;
    this.isRunning=false;this.lastTime=0;this.resizeCanvas();
    this.gameState={player:null,enemies:[],bullets:[],score:0,time:0,status:'playing'};
    this.initGame();
  }
  resizeCanvas(){this.canvas.width=this.canvas.parentElement.clientWidth||600;this.canvas.height=this.canvas.parentElement.clientHeight||450;}
  initGame(){this.gameState.player={x:300,y:225,angle:0};}
  start(){this.isRunning=true;this.lastTime=performance.now();this.gameLoop(this.lastTime);}
  stop(){this.isRunning=false;}
  gameLoop(cTime){if(!this.isRunning)return;const dt=(cTime-this.lastTime)/1000;this.lastTime=cTime;this.update(dt);this.render();requestAnimationFrame(t=>this.gameLoop(t));}
  update(dt){
    const p=this.gameState.player,i=this.getPlayerInput();
    const ax=i.x||0,ay=i.y||0;
    if(ax!==0||ay!==0){p.x+=ax*200*dt;p.y+=ay*200*dt;p.angle=Math.atan2(ay,ax);}
    p.x=Math.max(20,Math.min(580,p.x));p.y=Math.max(20,Math.min(430,p.y));
    if(i.action){for(let a=0;a<Math.PI*2;a+=0.4)this.gameState.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*300,vy:Math.sin(a)*300});}
    if(Math.random()<0.03)this.gameState.enemies.push({x:Math.random()*550+25,y:-20,hp:15});
    this.gameState.bullets.forEach(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;this.gameState.enemies.forEach(e=>{if(Math.sqrt((b.x-e.x)**2+(b.y-e.y)**2)<20){e.hp-=5;b.remove=true;if(e.hp<=0){e.remove=true;this.gameState.score+=20;}}})});
    this.gameState.enemies.forEach(e=>{e.y+=80*dt;if(e.y>480)e.remove=true;});
    this.gameState.bullets=this.gameState.bullets.filter(b=>!b.remove);this.gameState.enemies=this.gameState.enemies.filter(e=>!e.remove);
  }
  render(){
    const ctx=this.ctx;ctx.fillStyle='#1a1a2e';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    this.gameState.enemies.forEach(e=>{ctx.fillStyle='#e74c3c';ctx.beginPath();ctx.arc(e.x,e.y,12,0,Math.PI*2);ctx.fill();});
    const p=this.gameState.player;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle='#3498db';ctx.fillRect(-12,-12,24,24);ctx.fillStyle='#f1c40f';ctx.fillRect(0,-4,20,8);ctx.restore();
    this.gameState.bullets.forEach(b=>{ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(b.x,b.y,4,0,Math.PI*2);ctx.fill();});
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(10,10,80,25);ctx.fillStyle='#fff';ctx.font='14px Arial';ctx.fillText(`Score: ${this.gameState.score}`,20,28);
  }
  getPlayerInput(){const n=this.players[0]||'Player';return window.gameState&&window.gameState[n]?window.gameState[n].input||{}:{};}
  updatePlayerInput(n,i){window.gameState=window.gameState||{};window.gameState[n]={input:i};}
}
window.TwinStickShooterGame = TwinStickShooterGame;