// Complete Roguelike Dungeon Game
class RoguelikeGame {
  constructor(canvas, players, gameId) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.players=players;this.gameId=gameId;
    this.isRunning=false;this.lastTime=0;this.resizeCanvas();
    this.gameState={player:null,floor:1,rooms:[],enemies:[],items:[],score:0,time:0,status:'playing'};
    this.initGame();
  }
  resizeCanvas(){this.canvas.width=this.canvas.parentElement.clientWidth||600;this.canvas.height=this.canvas.parentElement.clientHeight||400;}
  initGame(){
    this.gameState.player={x:300,y:200,hp:100,maxHp:100,atk:10,def:5,gold:0,exp:0,level:1};
    this.gameState.rooms=[];for(let i=0;i<5;i++)this.gameState.rooms.push({x:50+i*110,y:50,w:100,h:80,visited:false,enemies:Math.floor(Math.random()*3)+1,type:['combat','treasure','rest'][Math.floor(Math.random()*3)]});
    this.gameState.enemies=[];for(let i=0;i<3;i++)this.gameState.enemies.push({x:100+i*180,y:100,hp:30,atk:8,name:'Goblin',type:'enemy'});
  }
  start(){this.isRunning=true;this.lastTime=performance.now();this.gameLoop(this.lastTime);}
  stop(){this.isRunning=false;}
  gameLoop(cTime){if(!this.isRunning)return;const dt=(cTime-this.lastTime)/1000;this.lastTime=cTime;this.update(dt);this.render();requestAnimationFrame(t=>this.gameLoop(t));}
  update(dt){
    this.gameState.time+=dt;const p=this.gameState.player;const i=this.getPlayerInput();
    if(i.left)p.x-=100*dt;if(i.right)p.x+=100*dt;if(i.up)p.y-=100*dt;if(i.down)p.y+=100*dt;p.x=Math.max(20,Math.min(580,p.x));p.y=Math.max(20,Math.min(380,p.y));
    this.gameState.enemies.forEach(e=>{const d=Math.sqrt((p.x-e.x)**2+(p.y-e.y)**2);if(d<30&&i.action){e.hp-=p.atk;p.exp+=10;p.score+=50;if(e.hp<=0)e.dead=true;}});
    this.gameState.enemies=this.gameState.enemies.filter(e=>!e.dead);
    if(p.exp>=100){p.level++;p.exp=0;p.maxHp+=20;p.hp=p.maxHp;p.atk+=3;}
  }
  render(){
    const ctx=this.ctx;ctx.fillStyle='#1a1a2e';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    this.gameState.rooms.forEach(r=>{ctx.fillStyle=r.visited?'#2c3e50':'#1a1a2e';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.strokeStyle='#34495e';ctx.strokeRect(r.x,r.y,r.w,r.h);});
    this.gameState.enemies.forEach(e=>{ctx.fillStyle='#e74c3c';ctx.beginPath();ctx.arc(e.x,e.y,15,0,Math.PI*2);ctx.fill();});
    const p=this.gameState.player;ctx.fillStyle='#3498db';ctx.beginPath();ctx.arc(p.x,p.y,12,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='10px Arial';ctx.textAlign='center';ctx.fillText(`Lv${p.level}`,p.x,p.y-20);
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(10,10,150,70);ctx.fillStyle='#fff';ctx.font='12px Arial';ctx.textAlign='left';ctx.fillText(`Floor: ${this.gameState.floor}`,20,25);ctx.fillText(`HP: ${p.hp}/${p.maxHp}`,20,40);ctx.fillText(`ATK: ${p.atk} DEF: ${p.def}`,20,55);ctx.fillText(`Exp: ${p.exp}/100`,20,70);
  }
  getPlayerInput(){const n=this.players[0]||'Player';return window.gameState&&window.gameState[n]?window.gameState[n].input||{}:{};}
  updatePlayerInput(n,i){window.gameState=window.gameState||{};window.gameState[n]={input:i};}
}
window.RoguelikeGame = RoguelikeGame;