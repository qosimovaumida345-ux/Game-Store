// Complete Cooking Simulation Game
class CookingGame {
  constructor(canvas, players, gameId) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.players=players;this.gameId=gameId;
    this.isRunning=false;this.lastTime=0;this.resizeCanvas();
    this.gameState={station:null,ingredients:[],recipe:[],score:0,time:60,status:'playing',temp:0};
    this.initGame();
  }
  resizeCanvas(){this.canvas.width=this.canvas.parentElement.clientWidth||600;this.canvas.height=this.canvas.parentElement.clientHeight||400;}
  initGame(){this.gameState.ingredients=[{name:'Meat',state:'raw',temp:20},{name:'Veg',state:'raw',temp:20},{name:'Cheese',state:'raw',temp:20}];this.gameState.recipe=['raw','cooked','burnt'];}
  start(){this.isRunning=true;this.lastTime=performance.now();this.gameLoop(this.lastTime);}
  stop(){this.isRunning=false;}
  gameLoop(cTime){if(!this.isRunning)return;const dt=(cTime-this.lastTime)/1000;this.lastTime=cTime;this.update(dt);this.render();requestAnimationFrame(t=>this.gameLoop(t));}
  update(dt){
    this.gameState.time-=dt;if(this.gameState.time<=0)this.gameState.status='gameover';
    const i=this.getPlayerInput();
    if(i.action&&!this.gameState.cooking){this.gameState.cooking=true;this.gameState.temp=20;}
    if(this.gameState.cooking){this.gameState.temp+=30*dt;this.gameState.ingredients.forEach(ing=>{ing.temp=this.gameState.temp;if(ing.temp>100&&ing.temp<150)ing.state='cooked';else if(ing.temp>=150)ing.state='burnt';});}
  }
  render(){
    const ctx=this.ctx;
    ctx.fillStyle='#f5f5dc';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    ctx.fillStyle='#8B4513';ctx.fillRect(150,100,300,150);
    this.gameState.ingredients.forEach((ing,idx)=>{ctx.fillStyle=ing.state==='raw'?'#e74c3c':ing.state==='cooked'?'#27ae60':'#2c3e50';ctx.beginPath();ctx.arc(200+idx*80,175,25,0,Math.PI*2);ctx.fill();ctx.fillStyle='#000';ctx.font='10px Arial';ctx.textAlign='center';ctx.fillText(ing.state,200+idx*80,205);});
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(10,10,120,50);ctx.fillStyle='#fff';ctx.font='14px Arial';ctx.fillText(`Temp: ${Math.floor(this.gameState.temp)}°`,20,30);ctx.fillText(`Time: ${Math.ceil(this.gameState.time)}s`,20,50);
  }
  getPlayerInput(){const n=this.players[0]||'Player';return window.gameState&&window.gameState[n]?window.gameState[n].input||{}:{};}
  updatePlayerInput(n,i){window.gameState=window.gameState||{};window.gameState[n]={input:i};}
}
window.CookingGame = CookingGame;