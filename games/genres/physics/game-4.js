// Complete Physics Ball Game
class PhysicsBallGame {
  constructor(canvas, players, gameId) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.players=players;this.gameId=gameId;
    this.isRunning=false;this.lastTime=0;this.resizeCanvas();
    this.gameState={ball:null,g:500,time:0,score:0,status:'playing'};
    this.initGame();
  }
  resizeCanvas(){this.canvas.width=this.canvas.parentElement.clientWidth||600;this.canvas.height=this.canvas.parentElement.clientHeight||400;}
  initGame(){this.gameState.ball={x:300,y:100,vx:0,vy:0,r:20};}
  start(){this.isRunning=true;this.lastTime=performance.now();this.gameLoop(this.lastTime);}
  stop(){this.isRunning=false;}
  gameLoop(cTime){if(!this.isRunning)return;const dt=(cTime-this.lastTime)/1000;this.lastTime=cTime;this.update(dt);this.render();requestAnimationFrame(t=>this.gameLoop(t));}
  update(dt){const b=this.gameState.ball;b.vy+=this.gameState.g*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.y>380){b.y=380;b.vy*=-0.8;b.vx*=0.95;}if(b.x<20||b.x>580){b.vx*=-1;b.x=Math.max(20,Math.min(580,b.x));}this.gameState.score++;}
  render(){const ctx=this.ctx;ctx.fillStyle='#1a1a2e';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);ctx.fillStyle='#7f8c8d';ctx.fillRect(0,380,600,20);const b=this.gameState.ball;ctx.fillStyle='#e74c3c';ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(10,10,80,25);ctx.fillStyle='#fff';ctx.font='14px Arial';ctx.fillText(`Score: ${this.gameState.score}`,20,28);}
  getPlayerInput(){const n=this.players[0]||'Player';return window.gameState&&window.gameState[n]?window.gameState[n].input||{}:{};}
  updatePlayerInput(n,i){window.gameState=window.gameState||{};window.gameState[n]={input:i};if(i.action)this.gameState.ball.vy=-400;}
}
window.PhysicsBallGame = PhysicsBallGame;