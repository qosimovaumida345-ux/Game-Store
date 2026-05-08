// Complete Hockey Game
class HockeyGame {
  constructor(canvas, players, gameId) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.players=players;this.gameId=gameId;
    this.isRunning=false;this.lastTime=0;this.resizeCanvas();
    this.gameState={puck:null,players:[],score:[0,0],time:60,status:'playing'};
    this.initGame();
  }
  resizeCanvas(){this.canvas.width=this.canvas.parentElement.clientWidth||700;this.canvas.height=this.canvas.parentElement.clientHeight||450;}
  initGame(){this.gameState.puck={x:350,y:225,vx:0,vy:0};this.gameState.players=[{x:350,y:380,team:0},{x:100,y:225,team:1},{x:600,y:225,team:1}];}
  start(){this.isRunning=true;this.lastTime=performance.now();this.gameLoop(this.lastTime);}
  stop(){this.isRunning=false;}
  gameLoop(cTime){if(!this.isRunning)return;const dt=(cTime-this.lastTime)/1000;this.lastTime=cTime;this.update(dt);this.render();requestAnimationFrame(t=>this.gameLoop(t));}
  update(dt){
    this.gameState.time-=dt;if(this.gameState.time<=0)this.gameState.status='finished';
    const pk=this.gameState.puck;const p=this.gameState.players[0];const i=this.getPlayerInput();
    if(i.left)p.x-=200*dt;if(i.right)p.x+=200*dt;if(i.up)p.y-=200*dt;if(i.down)p.y+=200*dt;p.x=Math.max(20,Math.min(680,p.x));p.y=Math.max(200,Math.min(420,p.y));
    pk.x+=pk.vx;pk.y+=pk.vy;pk.vx*=0.99;pk.vy*=0.99;
    this.gameState.players.forEach(pl=>{const dx=pl.x-pk.x,dy=pl.y-pk.y;if(Math.sqrt(dx*dx+dy*dy)<20){pk.vx=dx*0.5;pk.vy=dy*0.5;}});
    if(pk.y<10){this.gameState.score[0]++;pk.x=350;pk.y=225;pk.vx=0;pk.vy=0;}if(pk.y>440){this.gameState.score[1]++;pk.x=350;pk.y=225;pk.vx=0;pk.vy=0;}
  }
  render(){
    const ctx=this.ctx;ctx.fillStyle='#1a1a2e';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    ctx.strokeStyle='#e74c3c';ctx.lineWidth=3;ctx.strokeRect(0,0,this.canvas.width,this.canvas.height);
    const pk=this.gameState.puck;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(pk.x,pk.y,10,0,Math.PI*2);ctx.fill();
    this.gameState.players.forEach(pl=>{ctx.fillStyle=pl.team===0?'#3498db':'#e74c3c';ctx.beginPath();ctx.arc(pl.x,pl.y,15,0,Math.PI*2);ctx.fill();});
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(10,10,180,50);ctx.fillStyle='#fff';ctx.font='20px Arial';ctx.fillText(`${this.gameState.score[0]} - ${this.gameState.score[1]}`,100,40);
    ctx.fillRect(this.canvas.width-80,10,70,30);ctx.fillStyle=this.gameState.time>10?'#2ecc71':'#e74c3c';ctx.fillText(`${Math.ceil(this.gameState.time)}s`,this.canvas.width-45,30);
  }
  getPlayerInput(){const n=this.players[0]||'Player';return window.gameState&&window.gameState[n]?window.gameState[n].input||{}:{};}
  updatePlayerInput(n,i){window.gameState=window.gameState||{};window.gameState[n]={input:i};}
}
window.HockeyGame = HockeyGame;