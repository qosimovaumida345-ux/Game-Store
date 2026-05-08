// Complete Battle Royale Game
class BattleRoyaleGame {
  constructor(canvas, players, gameId) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.players=players;this.gameId=gameId;
    this.isRunning=false;this.lastTime=0;this.resizeCanvas();
    this.gameState={player:null,enemies:[],zone:null,alive:20,time:60,score:0,status:'playing'};
    this.initGame();
  }
  resizeCanvas(){this.canvas.width=this.canvas.parentElement.clientWidth||700;this.canvas.height=this.canvas.parentElement.clientHeight||450;}
  initGame(){
    this.gameState.player={x:350,y:225,hp:100,weap:'pistol',ammo:30};
    this.gameState.enemies=[];for(let i=0;i<19;i++)this.gameState.enemies.push({x:Math.random()*650+25,y:Math.random()*400+25,hp:80,alive:true});
    this.gameState.zone={x:100,y:50,w:500,h:350,radius:250};
  }
  start(){this.isRunning=true;this.lastTime=performance.now();this.gameLoop(this.lastTime);}
  stop(){this.isRunning=false;}
  gameLoop(cTime){if(!this.isRunning)return;const dt=(cTime-this.lastTime)/1000;this.lastTime=cTime;this.update(dt);this.render();requestAnimationFrame(t=>this.gameLoop(t));}
  update(dt){
    this.gameState.time-=dt;if(this.gameState.time<=0)this.gameState.status='win';
    const p=this.gameState.player;const i=this.getPlayerInput();
    if(i.left)p.x-=200*dt;if(i.right)p.x+=200*dt;if(i.up)p.y-=200*dt;if(i.down)p.y+=200*dt;p.x=Math.max(20,Math.min(680,p.x));p.y=Math.max(20,Math.min(430,p.y));
    if(i.action&&p.ammo>0){p.ammo--;this.gameState.enemies.forEach(e=>{if(e.alive&&Math.sqrt((e.x-p.x)**2+(e.y-p.y)**2)<100){e.hp-=25;if(e.hp<=0){e.alive=false;this.gameState.score+=100;this.gameState.alive--;}}})}
    this.gameState.enemies=e=>e.alive;
  }
  render(){
    const ctx=this.ctx;
    ctx.fillStyle='#2d5a3d';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    ctx.strokeStyle='#e74c3c';ctx.lineWidth=3;ctx.strokeRect(this.gameState.zone.x,this.gameState.zone.y,this.gameState.zone.w,this.gameState.zone.h);
    this.gameState.enemies.forEach(e=>{if(e.alive){ctx.fillStyle='#8b4513';ctx.beginPath();ctx.arc(e.x,e.y,10,0,Math.PI*2);ctx.fill();}});
    const p=this.gameState.player;ctx.fillStyle='#3498db';ctx.beginPath();ctx.arc(p.x,p.y,12,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(10,10,120,60);ctx.fillStyle='#fff';ctx.font='14px Arial';ctx.textAlign='left';ctx.fillText(`Alive: ${this.gameState.alive}`,20,30);ctx.fillText(`Ammo: ${p.ammo}`,20,50);
    if(this.gameState.status==='win'){ctx.fillStyle='rgba(0,0,0,0.8)';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);ctx.fillStyle='#2ecc71';ctx.font='bold 40px Arial';ctx.textAlign='center';ctx.fillText('VICTORY!',this.canvas.width/2,this.canvas.height/2);}
  }
  getPlayerInput(){const n=this.players[0]||'Player';return window.gameState&&window.gameState[n]?window.gameState[n].input||{}:{};}
  updatePlayerInput(n,i){window.gameState=window.gameState||{};window.gameState[n]={input:i};}
}
window.BattleRoyaleGame = BattleRoyaleGame;