// Complete Adventure Quest Game
class AdventureQuestGame {
  constructor(canvas, players, gameId) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.players=players;this.gameId=gameId;
    this.isRunning=false;this.lastTime=0;this.resizeCanvas();
    this.gameState={hero:null,world:[],enemies:[],treasures:[],score:0,time:0,status:'playing'};
    this.initGame();
  }
  resizeCanvas(){this.canvas.width=this.canvas.parentElement.clientWidth||700;this.canvas.height=this.canvas.parentElement.clientHeight||450;}
  initGame(){
    this.gameState.hero={x:350,y:225,hp:100,maxHp:100,attack:15,defense:5,inventory:[],gold:0};
    for(let r=0;r<10;r++){this.gameState.world[r]=[];for(let c=0;c<15;c++)this.gameState.world[r][c]=Math.random()<0.15?1:0;}
    this.gameState.world[5][7]=0;this.gameState.enemies=[{x:200,y:150,hp:40,atk:8,name:'Wolf'},{x:500,y:300,hp:50,atk:10,name:'Orc'}];
    this.gameState.treasures=[{x:600,y:100,gold:50},{x:100,y:350,gold:30}];
  }
  start(){this.isRunning=true;this.lastTime=performance.now();this.gameLoop(this.lastTime);}
  stop(){this.isRunning=false;}
  gameLoop(cTime){if(!this.isRunning)return;const dt=(cTime-this.lastTime)/1000;this.lastTime=cTime;this.update(dt);this.render();requestAnimationFrame(t=>this.gameLoop(t));}
  update(dt){
    const h=this.gameState.hero;const i=this.getPlayerInput();
    if(i.left)h.x-=150*dt;if(i.right)h.x+=150*dt;if(i.up)h.y-=150*dt;if(i.down)h.y+=150*dt;
    h.x=Math.max(20,Math.min(680,h.x));h.y=Math.max(20,Math.min(430,h.y));
    this.gameState.enemies.forEach(e=>{if(Math.sqrt((h.x-e.x)**2+(h.y-e.y)**2)<30&&i.action){e.hp-=h.attack;if(e.hp<=0){this.gameState.score+=100;e.dead=true;}}});
    this.gameState.enemies=this.gameState.enemies.filter(e=>!e.dead);
    this.gameState.treasures.forEach(t=>{if(Math.sqrt((h.x-t.x)**2+(h.y-t.y)**2)<25){h.gold+=t.gold;this.gameState.score+=t.gold;t.collected=true;}});
    this.gameState.treasures=this.gameState.treasures.filter(t=>!t.collected);
  }
  render(){
    const ctx=this.ctx;
    ctx.fillStyle='#228B22';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    for(let r=0;r<10;r++)for(let c=0;c<15;c++)if(this.gameState.world[r][c]){ctx.fillStyle='#8B4513';ctx.fillRect(c*46,r*44,44,42);}
    this.gameState.treasures.forEach(t=>{ctx.fillStyle='#FFD700';ctx.beginPath();ctx.arc(t.x,t.y,12,0,Math.PI*2);ctx.fill();});
    this.gameState.enemies.forEach(e=>{ctx.fillStyle='#8B0000';ctx.beginPath();ctx.arc(e.x,e.y,15,0,Math.PI*2);ctx.fill();});
    const h=this.gameState.hero;ctx.fillStyle='#4169E1';ctx.beginPath();ctx.arc(h.x,h.y,14,0,Math.PI*2);ctx.fill();ctx.fillStyle='#FFD700';ctx.font='12px Arial';ctx.fillText(`$${h.gold}`,h.x,h.y-25);
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(10,10,130,50);ctx.fillStyle='#fff';ctx.font='14px Arial';ctx.fillText(`Score: ${this.gameState.score}`,20,30);ctx.fillText(`HP: ${h.hp}`,20,50);
  }
  getPlayerInput(){const n=this.players[0]||'Player';return window.gameState&&window.gameState[n]?window.gameState[n].input||{}:{};}
  updatePlayerInput(n,i){window.gameState=window.gameState||{};window.gameState[n]={input:i};}
}
window.AdventureQuestGame = AdventureQuestGame;