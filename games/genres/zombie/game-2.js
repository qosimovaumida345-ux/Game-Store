// Complete Zombie Survival Game
class ZombieSurvivalGame {
  constructor(canvas, players, gameId) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.players=players;this.gameId=gameId;
    this.isRunning=false;this.lastTime=0;this.resizeCanvas();
    this.gameState={player:null,zombies:[],bullets:[],score:0,hp:100,time:0,status:'playing'};
    this.initGame();
  }
  resizeCanvas(){this.canvas.width=this.canvas.parentElement.clientWidth||700;this.canvas.height=this.canvas.parentElement.clientHeight||450;}
  initGame(){this.gameState.player={x:350,y:225};}
  start(){this.isRunning=true;this.lastTime=performance.now();this.gameLoop(this.lastTime);}
  stop(){this.isRunning=false;}
  gameLoop(cTime){if(!this.isRunning)return;const dt=(cTime-this.lastTime)/1000;this.lastTime=cTime;this.update(dt);this.render();requestAnimationFrame(t=>this.gameLoop(t));}
  update(dt){
    const p=this.gameState.player,i=this.getPlayerInput();
    if(i.left)p.x-=150*dt;if(i.right)p.x+=150*dt;if(i.up)p.y-=150*dt;if(i.down)p.y+=150*dt;p.x=Math.max(20,Math.min(680,p.x));p.y=Math.max(20,Math.min(430,p.y));
    if(i.action){this.gameState.bullets.push({x:p.x,y:p.y-10,vx:0,vy:-400});}
    if(Math.random()<0.03){this.gameState.zombies.push({x:Math.random()*650+25,y:-20,speed:30+Math.random()*20});}
    this.gameState.bullets.forEach(b=>{b.y+=b.vy*dt;this.gameState.zombies.forEach(z=>{if(Math.sqrt((b.x-z.x)**2+(b.y-z.y)**2)<20){z.hp=(z.hp||30)-30;b.remove=true;if(z.hp<=0){z.remove=true;this.gameState.score+=50;}}})});
    this.gameState.zombies.forEach(z=>{z.y+=z.speed*dt;if(Math.sqrt((z.x-p.x)**2+(z.y-p.y)**2)<20){this.gameState.hp-=10;z.remove=true;}});
    this.gameState.bullets=this.gameState.bullets.filter(b=>b.y>0&&!b.remove);this.gameState.zombies=this.gameState.zombies.filter(z=>z.y<500&&!z.remove);
    if(this.gameState.hp<=0)this.gameState.status='gameover';
  }
  render(){
    const ctx=this.ctx;ctx.fillStyle='#1a1a1a';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    this.gameState.zombies.forEach(z=>{ctx.fillStyle='#2ecc71';ctx.beginPath();ctx.arc(z.x,z.y,15,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e74c3c';ctx.beginPath();ctx.arc(z.x-5,z.y-5,3,0,Math.PI*2);ctx.arc(z.x+5,z.y-5,3,0,Math.PI*2);ctx.fill();});
    const p=this.gameState.player;ctx.fillStyle='#3498db';ctx.fillRect(p.x-10,p.y-10,20,20);
    this.gameState.bullets.forEach(b=>{ctx.fillStyle='#f1c40f';ctx.fillRect(b.x-2,b.y,4,8);});
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(10,10,130,50);ctx.fillStyle='#fff';ctx.font='14px Arial';ctx.fillText(`Score: ${this.gameState.score}`,20,30);ctx.fillText(`HP: ${this.gameState.hp}`,20,50);
    if(this.gameState.status==='gameover'){ctx.fillStyle='rgba(0,0,0,0.8)';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);ctx.fillStyle='#e74c3c';ctx.font='bold 40px Arial';ctx.textAlign='center';ctx.fillText('GAME OVER',350,225);}
  }
  getPlayerInput(){const n=this.players[0]||'Player';return window.gameState&&window.gameState[n]?window.gameState[n].input||{}:{};}
  updatePlayerInput(n,i){window.gameState=window.gameState||{};window.gameState[n]={input:i};}
}
window.ZombieSurvivalGame = ZombieSurvivalGame;