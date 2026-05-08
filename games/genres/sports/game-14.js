// Complete Baseball Game
class BaseballGame {
  constructor(canvas, players, gameId) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.players=players;this.gameId=gameId;
    this.isRunning=false;this.lastTime=0;this.resizeCanvas();
    this.gameState={ball:null,batter:null,score:0,strikes:0,outs:0,innings:1,time:0,status:'playing'};
    this.initGame();
  }
  resizeCanvas(){this.canvas.width=this.canvas.parentElement.clientWidth||700;this.canvas.height=this.canvas.parentElement.clientHeight||450;}
  initGame(){this.gameState.ball={x:350,y:400,vx:0,vy:0,speed:0};this.gameState.batter={x:350,y:350,ready:false};}
  start(){this.isRunning=true;this.lastTime=performance.now();this.gameLoop(this.lastTime);}
  stop(){this.isRunning=false;}
  gameLoop(cTime){if(!this.isRunning)return;const dt=(cTime-this.lastTime)/1000;this.lastTime=cTime;this.update(dt);this.render();requestAnimationFrame(t=>this.gameLoop(t));}
  update(dt){
    const b=this.gameState.ball;const p=this.gameState.batter;const i=this.getPlayerInput();
    if(!b.sent){if(i.action){b.vy=-15;b.vx=(Math.random()-0.5)*10;b.sent=true;}}
    else{b.x+=b.vx;b.y+=b.vy;b.vy+=0.3;b.vx*=0.99;if(b.y>450||Math.abs(b.x)>400){this.gameState.strikes++;b.sent=false;b.x=350;b.y=400;b.vx=0;b.vy=0;if(this.gameState.strikes>=3){this.gameState.outs++;this.gameState.strikes=0;}}}
    if(b.sent&&Math.abs(b.x-p.x)<20&&Math.abs(b.y-p.y)<20&&i.action){this.gameState.score+=Math.floor(Math.random()*4)+1;b.sent=false;b.x=350;b.y=400;}
  }
  render(){
    const ctx=this.ctx;ctx.fillStyle='#228B22';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    ctx.fillStyle='#deb887';ctx.fillRect(250,100,200,50);ctx.fillStyle='#fff';ctx.fillRect(300,150,100,200);
    const b=this.gameState.ball;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(b.x,b.y,8,0,Math.PI*2);ctx.fill();
    const p=this.gameState.batter;ctx.fillStyle='#e74c3c';ctx.fillRect(p.x-10,p.y-15,20,30);
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(10,10,150,60);ctx.fillStyle='#fff';ctx.font='14px Arial';ctx.fillText(`Score: ${this.gameState.score}`,20,30);ctx.fillText(`Strikes: ${this.gameState.strikes}`,20,50);ctx.fillText(`Outs: ${this.gameState.outs}`,20,70);
  }
  getPlayerInput(){const n=this.players[0]||'Player';return window.gameState&&window.gameState[n]?window.gameState[n].input||{}:{};}
  updatePlayerInput(n,i){window.gameState=window.gameState||{};window.gameState[n]={input:i};}
}
window.BaseballGame = BaseballGame;