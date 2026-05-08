// Complete Clicker Idle Game
class ClickerIdleGame {
  constructor(canvas, players, gameId) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.players=players;this.gameId=gameId;
    this.isRunning=false;this.lastTime=0;this.resizeCanvas();
    this.gameState={gold:0,goldPerSec:0,clickPower:1,upgrades:[],buildings:[],time:0,status:'playing'};
    this.gameState.buildings=[{name:'Farm',cost:10,production:1,count:0},{name:'Mine',cost:50,production:5,count:0},{name:'Factory',cost:200,production:20,count:0},{name:'Bank',cost:1000,production:100,count:0}];
  }
  resizeCanvas(){this.canvas.width=this.canvas.parentElement.clientWidth||500;this.canvas.height=this.canvas.parentElement.clientHeight||500;}
  start(){this.isRunning=true;this.lastTime=performance.now();this.gameLoop(this.lastTime);}
  stop(){this.isRunning=false;}
  gameLoop(cTime){if(!this.isRunning)return;const dt=(cTime-this.lastTime)/1000;this.lastTime=cTime;this.update(dt);this.render();requestAnimationFrame(t=>this.gameLoop(t));}
  update(dt){
    this.gameState.time+=dt;this.gameState.gold+=this.gameState.goldPerSec*dt;this.gameState.goldPerSec=0;
    this.gameState.buildings.forEach(b=>{this.gameState.goldPerSec+=b.production*b.count;});
  }
  render(){
    const ctx=this.ctx;ctx.fillStyle='#2c3e50';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    ctx.fillStyle='#f1c40f';ctx.font='bold 40px Arial';ctx.textAlign='center';ctx.fillText(`${Math.floor(this.gameState.gold)}`,this.canvas.width/2,100);
    ctx.font='20px Arial';ctx.fillText(`${Math.floor(this.gameState.goldPerSec)}/sec`,this.canvas.width/2,130);
    ctx.fillStyle='#e74c3c';ctx.beginPath();ctx.arc(this.canvas.width/2,250,40,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 14px Arial';ctx.fillText('CLICK',this.canvas.width/2,255);
    ctx.fillStyle='#3498db';ctx.fillRect(10,320,this.canvas.width-20,30);ctx.fillRect(10,360,this.canvas.width-20,30);ctx.fillRect(10,400,this.canvas.width-20,30);ctx.fillRect(10,440,this.canvas.width-20,30);
    this.gameState.buildings.forEach((b,i)=>{ctx.fillStyle='#fff';ctx.font='16px Arial';ctx.textAlign='left';ctx.fillText(`${b.name}: ${b.count}`,20,345+i*40);ctx.textAlign='right';ctx.fillText(`Cost: ${b.cost} (+${b.production}/s)`,this.canvas.width-20,345+i*40);});
  }
  getPlayerInput(){return{};}
  updatePlayerInput(n,i){window.gameState=window.gameState||{};window.gameState[n]={input:i};if(i.action||i.up){this.gameState.gold+=this.gameState.clickPower;}}
}
window.ClickerIdleGame = ClickerIdleGame;