// Complete Multiplayer Battle Game
class MultiplayerBattleGame {
  constructor(canvas, players, gameId) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.players=players;this.gameId=gameId;
    this.isRunning=false;this.lastTime=0;this.resizeCanvas();
    this.gameState={players:[],projectiles:[],health:[100,100],score:0,time:60,status:'playing'};
    this.initGame();
  }
  resizeCanvas(){this.canvas.width=this.canvas.parentElement.clientWidth||700;this.canvas.height=this.canvas.parentElement.clientHeight||400;}
  initGame(){this.gameState.players=[{x:100,y:200,vx:0,vy:0,color:'#3498db'},{x:600,y:200,vx:0,vy:0,color:'#e74c3c'}];}
  start(){this.isRunning=true;this.lastTime=performance.now();this.gameLoop(this.lastTime);}
  stop(){this.isRunning=false;}
  gameLoop(cTime){if(!this.isRunning)return;const dt=(cTime-this.lastTime)/1000;this.lastTime=cTime;this.update(dt);this.render();requestAnimationFrame(t=>this.gameLoop(t));}
  update(dt){
    const p=this.gameState.players[0],e=this.gameState.players[1],i=this.getPlayerInput();
    if(i.left)p.vx=-150;if(i.right)p.vx=150;if(i.up)p.vy=-150;if(i.down)p.vy=150;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.9;p.vy*=0.9;e.x+=(Math.sin(cTime)*20*dt);e.y+=(Math.cos(cTime)*20*dt);p.x=Math.max(20,Math.min(330,p.x));p.y=Math.max(20,Math.min(380,p.y));e.x=Math.max(370,Math.min(680,e.x));e.y=Math.max(20,Math.min(380,e.y));
    if(i.action){this.gameState.projectiles.push({x:p.x+20,y:p.y,vx:300,vy:0});}
    this.gameState.projectiles.forEach(pr=>{pr.x+=pr.vx*dt;if(pr.x>e.x-20&&pr.x<e.x+20&&Math.abs(pr.y-e.y)<20){this.gameState.health[1]-=10;pr.remove=true;}if(pr.x>700)pr.remove=true;});
    this.gameState.projectiles=this.gameState.projectiles.filter(p=>!p.remove);
    if(this.gameState.health[1]<=0)this.gameState.status='win';if(this.gameState.health[0]<=0)this.gameState.status='lose';
  }
  render(){const ctx=this.ctx;ctx.fillStyle='#1a1a2e';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);this.gameState.players.forEach((p,i)=>{ctx.fillStyle=p.color;ctx.fillRect(p.x-15,p.y-15,30,30);ctx.fillStyle='#e74c3c';ctx.fillRect(p.x-15,p.y-25,30,5);ctx.fillStyle='#2ecc71';ctx.fillRect(p.x-15,p.y-25,30*(this.gameState.health[i]/100),5);});this.gameState.projectiles.forEach(p=>{ctx.fillStyle='#f1c40f';ctx.beginPath();ctx.arc(p.x,p.y,5,0,Math.PI*2);ctx.fill();});ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(10,10,80,25);ctx.fillStyle='#fff';ctx.font='14px Arial';ctx.fillText(`P1 HP: ${this.gameState.health[0]}`,20,28);}
  getPlayerInput(){const n=this.players[0]||'Player';return window.gameState&&window.gameState[n]?window.gameState[n].input||{}:{};}
  updatePlayerInput(n,i){window.gameState=window.gameState||{};window.gameState[n]={input:i};}
}
window.MultiplayerBattleGame = MultiplayerBattleGame;