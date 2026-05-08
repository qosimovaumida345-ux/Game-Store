// Complete MOBA Style Game
class MOBAStyleGame {
  constructor(canvas, players, gameId) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.players=players;this.gameId=gameId;
    this.isRunning=false;this.lastTime=0;this.resizeCanvas();
    this.gameState={hero:null,towers:[],minions:[],score:0,gold:0,time:0,status:'playing'};
    this.initGame();
  }
  resizeCanvas(){this.canvas.width=this.canvas.parentElement.clientWidth||700;this.canvas.height=this.canvas.parentElement.clientHeight||400;}
  initGame(){this.gameState.hero={x:350,y:350,hp:100,level:1,exp:0};this.gameState.towers=[{x:100,y:200,hp:100,side:'enemy'},{x:600,y:200,hp:100,side:'enemy'}];for(let i=0;i<4;i++)this.gameState.minions.push({x:200+i*80,y:200+Math.sin(i)*30,side:i<2?'ally':'enemy',hp:30});}
  start(){this.isRunning=true;this.lastTime=performance.now();this.gameLoop(this.lastTime);}
  stop(){this.isRunning=false;}
  gameLoop(cTime){if(!this.isRunning)return;const dt=(cTime-this.lastTime)/1000;this.lastTime=cTime;this.update(dt);this.render();requestAnimationFrame(t=>this.gameLoop(t));}
  update(dt){const h=this.gameState.hero,i=this.getPlayerInput();if(i.left)h.x-=150*dt;if(i.right)h.x+=150*dt;if(i.up)h.y-=150*dt;if(i.down)h.y+=150*dt;h.x=Math.max(50,Math.min(650,h.x));h.y=Math.max(50,Math.min(350,h.y));if(i.action){this.gameState.minions.forEach(m=>{if(m.side==='enemy'&&Math.sqrt((m.x-h.x)**2+(m.y-h.y)**2)<60){m.hp-=20;if(m.hp<=0)m.dead=true;this.gameState.gold+=10;}});}this.gameState.minions=this.gameState.minions.filter(m=>!m.dead);}
  render(){const ctx=this.ctx;ctx.fillStyle='#2c3e50';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);this.gameState.towers.forEach(t=>{ctx.fillStyle='#9b59b6';ctx.fillRect(t.x-20,t.y-20,40,40);ctx.fillStyle='#e74c3c';ctx.fillRect(t.x-18,t.y-25,36*(t.hp/100),4);});this.gameState.minions.forEach(m=>{ctx.fillStyle=m.side==='ally'?'#3498db':'#e74c3c';ctx.beginPath();ctx.arc(m.x,m.y,10,0,Math.PI*2);ctx.fill();});const h=this.gameState.hero;ctx.fillStyle='#f1c40f';ctx.beginPath();ctx.arc(h.x,h.y,15,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(10,10,120,50);ctx.fillStyle='#fff';ctx.font='14px Arial';ctx.fillText(`Gold: ${this.gameState.gold}`,20,30);ctx.fillText(`Level: ${h.level}`,20,50);}
  getPlayerInput(){const n=this.players[0]||'Player';return window.gameState&&window.gameState[n]?window.gameState[n].input||{}:{};}
  updatePlayerInput(n,i){window.gameState=window.gameState||{};window.gameState[n]={input:i};}
}
window.MOBAStyleGame = MOBAStyleGame;