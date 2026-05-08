// Complete Physics Engine Game
class PhysicsGame {
  constructor(canvas, players, gameId) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.players=players;this.gameId=gameId;
    this.isRunning=false;this.lastTime=0;this.resizeCanvas();
    this.gameState={objects:[],time:0,score:0,status:'playing'};
  }
  resizeCanvas(){this.canvas.width=this.canvas.parentElement.clientWidth||700;this.canvas.height=this.canvas.parentElement.clientHeight||450;}
  start(){this.isRunning=true;this.lastTime=performance.now();this.gameLoop(this.lastTime);}
  stop(){this.isRunning=false;}
  gameLoop(cTime){if(!this.isRunning)return;const dt=(cTime-this.lastTime)/1000;this.lastTime=cTime;this.update(dt);this.render();requestAnimationFrame(t=>this.gameLoop(t));}
  update(dt){
    this.gameState.time+=dt;
    this.gameState.objects.forEach(o=>{if(o.type==='ball'){o.vy+=500*dt;o.x+=o.vx*dt;o.y+=o.vy*dt;if(o.y>400){o.y=400;o.vy*=-0.8;o.vx*=0.95;}if(o.x<0||o.x>700){o.vx*=-1;o.x=Math.max(0,Math.min(700,o.x));}}});
  }
  render(){
    const ctx=this.ctx;ctx.fillStyle='#1a1a2e';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    ctx.fillStyle='#3498db';ctx.fillRect(0,400,700,50);
    this.gameState.objects.forEach(o=>{ctx.fillStyle=o.color;ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.fill();});
  }
  getPlayerInput(){const n=this.players[0]||'Player';return window.gameState&&window.gameState[n]?window.gameState[n].input||{}:{};}
  updatePlayerInput(n,i){window.gameState=window.gameState||{};window.gameState[n]={input:i};if(i.action){this.gameState.objects.push({type:'ball',x:350,y:100,vx:(Math.random()-0.5)*200,vy:0,r:20,color:['#e74c3c','#3498db','#2ecc71','#f1c40f'][Math.floor(Math.random()*4)]});}}
}
window.PhysicsGame = PhysicsGame;