// Complete Dungeon Crawler RPG
class DungeonCrawlerRPG {
  constructor(canvas, players, gameId) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.players=players;this.gameId=gameId;
    this.isRunning=false;this.lastTime=0;this.resizeCanvas();
    this.gameState={hero:null,rooms:[],enemies:[],time:0,score:0,status:'playing'};
    this.initGame();
  }
  resizeCanvas(){this.canvas.width=this.canvas.parentElement.clientWidth||600;this.canvas.height=this.canvas.parentElement.clientHeight||400;}
  initGame(){this.gameState.hero={x:300,y:200,hp:100,attack:10,defense:5,level:1,gold:0};for(let i=0;i<5;i++)this.gameState.enemies.push({x:100+i*100,y:100,hp:30,attack:5,type:'Goblin'});}
  start(){this.isRunning=true;this.lastTime=performance.now();this.gameLoop(this.lastTime);}
  stop(){this.isRunning=false;}
  gameLoop(cTime){if(!this.isRunning)return;const dt=(cTime-this.lastTime)/1000;this.lastTime=cTime;this.update(dt);this.render();requestAnimationFrame(t=>this.gameLoop(t));}
  update(dt){const h=this.gameState.hero,i=this.getPlayerInput();if(i.left)h.x-=100*dt;if(i.right)h.x+=100*dt;if(i.up)h.y-=100*dt;if(i.down)h.y+=100*dt;h.x=Math.max(20,Math.min(580,h.x));h.y=Math.max(20,Math.min(380,h.y));this.gameState.enemies.forEach(e=>{if(Math.sqrt((h.x-e.x)**2+(h.y-e.y)**2)<30&&i.action){e.hp-=h.attack;if(e.hp<=0){e.dead=true;this.gameState.score+=50;h.gold+=10;}});this.gameState.enemies=this.gameState.enemies.filter(e=>!e.dead);}
  render(){const ctx=this.ctx;ctx.fillStyle='#2c3e50';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);this.gameState.enemies.forEach(e=>{ctx.fillStyle='#e74c3c';ctx.beginPath();ctx.arc(e.x,e.y,15,0,Math.PI*2);ctx.fill();});const h=this.gameState.hero;ctx.fillStyle='#3498db';ctx.beginPath();ctx.arc(h.x,h.y,12,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(10,10,120,60);ctx.fillStyle='#fff';ctx.font='14px Arial';ctx.fillText(`HP: ${h.hp}`,20,30);ctx.fillText(`Gold: ${h.gold}`,20,50);ctx.fillText(`Level: ${h.level}`,20,70);}
  getPlayerInput(){const n=this.players[0]||'Player';return window.gameState&&window.gameState[n]?window.gameState[n].input||{}:{};}
  updatePlayerInput(n,i){window.gameState=window.gameState||{};window.gameState[n]={input:i};}
}
window.DungeonCrawlerRPG = DungeonCrawlerRPG;