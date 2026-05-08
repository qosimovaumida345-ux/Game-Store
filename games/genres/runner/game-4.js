// Complete Runner Endless Game
class EndlessRunnerGame {
  constructor(canvas, players, gameId) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.players=players;this.gameId=gameId;
    this.isRunning=false;this.lastTime=0;this.resizeCanvas();
    this.gameState={player:null,obstacles:[],score:0,distance:0,speed:8,time:0,status:'playing'};
    this.initGame();
  }
  resizeCanvas(){this.canvas.width=this.canvas.parentElement.clientWidth||700;this.canvas.height=this.canvas.parentElement.clientHeight||400;}
  initGame(){this.gameState.player={x:100,y:350,jumping:false,jumpVel:0,onGround:true};}
  start(){this.isRunning=true;this.lastTime=performance.now();this.gameLoop(this.lastTime);}
  stop(){this.isRunning=false;}
  gameLoop(cTime){if(!this.isRunning)return;const dt=(cTime-this.lastTime)/1000;this.lastTime=cTime;this.update(dt);this.render();requestAnimationFrame(t=>this.gameLoop(t));}
  update(dt){
    this.gameState.distance+=this.gameState.speed;this.gameState.score=Math.floor(this.gameState.distance/10);this.gameState.speed+=0.1*dt;
    const p=this.gameState.player;const i=this.getPlayerInput();
    if(i.up&&p.onGround){p.jumping=true;p.onGround=false;p.jumpVel=12;}
    if(p.jumping){p.y-=p.jumpVel;p.jumpVel-=30*dt;if(p.y>=350){p.y=350;p.jumping=false;p.onGround=true;p.jumpVel=0;}}
    if(Math.random()<0.03)this.gameState.obstacles.push({x:750,y:350,width:30,height:40});
    this.gameState.obstacles.forEach(o=>{o.x-=this.gameState.speed;if(Math.abs(p.x-o.x)<25&&Math.abs(p.y-o.y)<30)this.gameState.status='gameover';});
    this.gameState.obstacles=this.gameState.obstacles.filter(o=>o.x>-30);
  }
  render(){
    const ctx=this.ctx;ctx.fillStyle='#87CEEB';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);ctx.fillStyle='#228B22';ctx.fillRect(0,390,this.canvas.width,10);
    const p=this.gameState.player;ctx.fillStyle='#e74c3c';ctx.fillRect(p.x-15,p.y-25,30,35);ctx.fillStyle='#f4a460';ctx.beginPath();ctx.arc(p.x,p.y-30,12,0,Math.PI*2);ctx.fill();
    this.gameState.obstacles.forEach(o=>{ctx.fillStyle='#2c3e50';ctx.fillRect(o.x-o.width/2,o.y-o.height,o.width,o.height);});
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(10,10,120,50);ctx.fillStyle='#fff';ctx.font='16px Arial';ctx.fillText(`Score: ${this.gameState.score}`,20,30);ctx.fillText(`Speed: ${Math.floor(this.gameState.speed)}`,20,50);
    if(this.gameState.status==='gameover'){ctx.fillStyle='rgba(0,0,0,0.8)';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);ctx.fillStyle='#e74c3c';ctx.font='bold 40px Arial';ctx.textAlign='center';ctx.fillText('GAME OVER',this.canvas.width/2,this.canvas.height/2);}
  }
  getPlayerInput(){const n=this.players[0]||'Player';return window.gameState&&window.gameState[n]?window.gameState[n].input||{}:{};}
  updatePlayerInput(n,i){window.gameState=window.gameState||{};window.gameState[n]={input:i};}
}
window.EndlessRunnerGame = EndlessRunnerGame;