// Complete Memory Match Game
class MemoryMatchGame {
  constructor(canvas, players, gameId) {
    this.canvas=canvas; this.ctx=canvas.getContext('2d'); this.players=players; this.gameId=gameId;
    this.isRunning=false; this.lastTime=0; this.resizeCanvas();
    this.gameState={cards:[],flipped:[],matched:[],moves:0,score:0,time:60,status:'playing'};
    this.initGame();
  }
  resizeCanvas(){this.canvas.width=this.canvas.parentElement.clientWidth||700;this.canvas.height=this.canvas.parentElement.clientHeight||500;}
  initGame(){
    const symbols=['★','♥','♦','♠','♣','☀','☾','☁','⚡','🔥','🌙','⭐'];
    let deck=[...symbols,...symbols].sort(()=>Math.random()-0.5);
    this.gameState.cards=deck.map((s,i)=>({symbol:s,x:50+(i%6)*110,y:80+Math.floor(i/6)*120,flipped:false,matched:false}));
  }
  start(){this.isRunning=true;this.lastTime=performance.now();this.gameLoop(this.lastTime);}
  stop(){this.isRunning=false;}
  gameLoop(cTime){if(!this.isRunning)return;const dt=Math.min((cTime-this.lastTime)/1000,0.016);this.lastTime=cTime;this.update(dt);this.render();requestAnimationFrame(t=>this.gameLoop(t));}
  update(dt){ this.gameState.time-=dt; if(this.gameState.time<=0)this.gameState.status='gameover'; if(this.gameState.flipped.length===2){ const c1=this.gameState.flipped[0],c2=this.gameState.flipped[1]; if(c1.symbol===c2.symbol){c1.matched=true;c2.matched=true;this.gameState.score+=100;this.gameState.flipped=[];if(this.gameState.cards.every(c=>c.matched))this.gameState.status='win';}else{setTimeout(()=>{c1.flipped=false;c2.flipped=false;this.gameState.flipped=[];},500);}this.gameState.moves++;}}
  render(){
    const ctx=this.ctx; ctx.fillStyle='#1a1a2e'; ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    this.gameState.cards.forEach(c=>{ctx.fillStyle=c.flipped||c.matched?'#fff':'#3498db';ctx.fillRect(c.x,c.y,90,100);if(c.flipped||c.matched){ctx.fillStyle=c.matched?'#2ecc71':'#f1c40f';ctx.font='40px Arial';ctx.textAlign='center';ctx.fillText(c.symbol,c.x+45,c.y+60);}});
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(10,10,150,60);ctx.fillStyle='#fff';ctx.font='16px Arial';ctx.textAlign='left';ctx.fillText(`Moves: ${this.gameState.moves}`,20,30);ctx.fillText(`Score: ${this.gameState.score}`,20,50);ctx.fillStyle=this.gameState.time>10?'#2ecc71':'#e74c3c';ctx.fillRect(this.canvas.width-80,10,70,25);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(`${Math.ceil(this.gameState.time)}s`,this.canvas.width-45,28);
    if(this.gameState.status==='win'){ctx.fillStyle='rgba(0,0,0,0.8)';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);ctx.fillStyle='#2ecc71';ctx.font='bold 40px Arial';ctx.textAlign='center';ctx.fillText('YOU WIN!',this.canvas.width/2,this.canvas.height/2);}
  }
  getPlayerInput(){return{};}
  updatePlayerInput(n,i){window.gameState=window.gameState||{};window.gameState[n]={input:i};const idx=Math.floor(Math.random()*this.gameState.cards.length);const c=this.gameState.cards[idx];if(!c.flipped&&!c.matched&&this.gameState.flipped.length<2){c.flipped=true;this.gameState.flipped.push(c);}}
}
window.MemoryMatchGame = MemoryMatchGame;