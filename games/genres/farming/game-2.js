// Complete Farming Simulation Game
class FarmingGame {
  constructor(canvas, players, gameId) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.players=players;this.gameId=gameId;
    this.isRunning=false;this.lastTime=0;this.resizeCanvas();
    this.gameState={plots:[],money:100,plants:[],time:0,score:0,status:'playing'};
    this.initGame();
  }
  resizeCanvas(){this.canvas.width=this.canvas.parentElement.clientWidth||600;this.canvas.height=this.canvas.parentElement.clientHeight||400;}
  initGame(){for(let i=0;i<8;i++)this.gameState.plots.push({x:50+i*70,y:150,w:60,h:40,planted:false,growth:0,type:null});}
  start(){this.isRunning=true;this.lastTime=performance.now();this.gameLoop(this.lastTime);}
  stop(){this.isRunning=false;}
  gameLoop(cTime){if(!this.isRunning)return;const dt=(cTime-this.lastTime)/1000;this.lastTime=cTime;this.update(dt);this.render();requestAnimationFrame(t=>this.gameLoop(t));}
  update(dt){
    this.gameState.time+=dt;
    this.gameState.plots.forEach(p=>{if(p.planted){p.growth+=dt*10;if(p.growth>=100){p.ready=true;}}});
  }
  render(){
    const ctx=this.ctx;
    ctx.fillStyle='#90EE90';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    ctx.fillStyle='#8B4513';ctx.fillRect(0,200,this.canvas.width,50);
    this.gameState.plots.forEach(p=>{ctx.fillStyle=p.planted?'#228B22':'#deb887';ctx.fillRect(p.x,p.y,p.w,p.h);if(p.ready){ctx.fillStyle='#FFD700';ctx.beginPath();ctx.arc(p.x+30,p.y+20,15,0,Math.PI*2);ctx.fill();}});
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(10,10,120,50);ctx.fillStyle='#fff';ctx.font='14px Arial';ctx.textAlign='left';ctx.fillText(`Money: $${this.gameState.money}`,20,30);ctx.fillText(`Plants: ${this.gameState.plots.filter(p=>p.planted).length}`,20,50);
  }
  getPlayerInput(){const n=this.players[0]||'Player';return window.gameState&&window.gameState[n]?window.gameState[n].input||{}:{};}
  updatePlayerInput(n,i){window.gameState=window.gameState||{};window.gameState[n]={input:i};if(i.action){const free=this.gameState.plots.find(p=>!p.planted);if(free&&this.gameState.money>=20){free.planted=true;free.type='wheat';this.gameState.money-=20;}}}
}
window.FarmingGame = FarmingGame;