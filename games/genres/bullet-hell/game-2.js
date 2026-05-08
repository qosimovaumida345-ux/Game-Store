// Complete Bullet Hell Game
class BulletHellGame {
  constructor(canvas, players, gameId) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.players=players;this.gameId=gameId;
    this.isRunning=false;this.lastTime=0;this.resizeCanvas();
    this.gameState={player:null,bullets:[],enemies:[],score:0,time:0,status:'playing'};
    this.initGame();
  }
  resizeCanvas(){this.canvas.width=this.canvas.parentElement.clientWidth||600;this.canvas.height=this.canvas.parentElement.clientHeight||500;}
  initGame(){this.gameState.player={x:300,y:450};}
  start(){this.isRunning=true;this.lastTime=performance.now();this.gameLoop(this.lastTime);}
  stop(){this.isRunning=false;}
  gameLoop(cTime){if(!this.isRunning)return;const dt=(cTime-this.lastTime)/1000;this.lastTime=cTime;this.update(dt);this.render();requestAnimationFrame(t=>this.gameLoop(t));}
  update(dt){
    const p=this.gameState.player,i=this.getPlayerInput();
    if(i.left)p.x=Math.max(20,p.x-200*dt);if(i.right)p.x=Math.min(580,p.x+200*dt);if(i.up)p.y=Math.max(20,p.y-200*dt);if(i.down)p.y=Math.min(480,p.y+200*dt);
    if(Math.random()<0.1){for(let a=0;a<Math.PI*2;a+=0.3)this.gameState.bullets.push({x:300,y:50,r:5,angle:a,speed:100});}
    this.gameState.bullets.forEach(b=>{b.x+=Math.cos(b.angle)*b.speed*dt;b.y+=Math.sin(b.angle)*b.speed*dt;if(Math.sqrt((b.x-p.x)**2+(b.y-p.y)**2)<b.r+10)this.gameState.status='gameover';});
    this.gameState.bullets=this.gameState.bullets.filter(b=>b.y<550&&b.y>-50&&b.x>-50&&b.x<650);this.gameState.score++;
  }
  render(){
    const ctx=this.ctx;ctx.fillStyle='#000';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    this.gameState.bullets.forEach(b=>{ctx.fillStyle='#e74c3c';ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();});
    const p=this.gameState.player;ctx.fillStyle='#3498db';ctx.beginPath();ctx.arc(p.x,p.y,10,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(10,10,100,25);ctx.fillStyle='#fff';ctx.font='14px Arial';ctx.fillText(`Score: ${this.gameState.score}`,20,28);
    if(this.gameState.status==='gameover'){ctx.fillStyle='rgba(0,0,0,0.8)';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);ctx.fillStyle='#e74c3c';ctx.font='bold 40px Arial';ctx.textAlign='center';ctx.fillText('GAME OVER',300,250);}
  }
  getPlayerInput(){const n=this.players[0]||'Player';return window.gameState&&window.gameState[n]?window.gameState[n].input||{}:{};}
  updatePlayerInput(n,i){window.gameState=window.gameState||{};window.gameState[n]={input:i};}
}
window.BulletHellGame = BulletHellGame;