// Complete Casino Slot Machine Game
class SlotMachineGame {
  constructor(canvas, players, gameId) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.players=players;this.gameId=gameId;
    this.isRunning=false;this.lastTime=0;this.resizeCanvas();
    this.gameState={reels:[],spinning:false,bet:10,balance:500,win:0,time:0,status:'playing'};
  }
  resizeCanvas(){this.canvas.width=this.canvas.parentElement.clientWidth||400;this.canvas.height=this.canvas.parentElement.clientHeight||500;}
  start(){this.isRunning=true;this.lastTime=performance.now();this.gameLoop(this.lastTime);}
  stop(){this.isRunning=false;}
  gameLoop(cTime){if(!this.isRunning)return;const dt=(cTime-this.lastTime)/1000;this.lastTime=cTime;this.update(dt);this.render();requestAnimationFrame(t=>this.gameLoop(t));}
  update(dt){
    if(this.gameState.spinning){this.gameState.reels.forEach(r=>{r.offset+=50*dt;if(r.offset>100)r.offset=0;});this.gameState.time+=dt;if(this.gameState.time>2){this.gameState.spinning=false;this.checkWin();}}
  }
  checkWin(){const r=this.gameState.reels;if(r[0].symbol===r[1].symbol&&r[1].symbol===r[2].symbol){const s=r[0].symbol;const win=s==='7'?100:s==='★'?50:s==='♠'?30:20;this.gameState.win=win*this.gameState.bet;this.gameState.balance+=this.gameState.win;}else this.gameState.win=0;}
  render(){
    const ctx=this.ctx;ctx.fillStyle='#2c3e50';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    ctx.fillStyle='#f39c12';ctx.fillRect(50,50,300,350);ctx.strokeStyle='#fff';ctx.strokeRect(60,60,280,330);
    const syms=['♠','♥','★','7','♦'];const r=this.gameState.reels;
    for(let i=0;i<3;i++){if(r[i].symbol===undefined)r[i]={symbol:'♠',offset:0};ctx.fillStyle='#fff';ctx.font='60px Arial';ctx.textAlign='center';ctx.fillText(r[i].symbol,130+i*90,200);}
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(50,420,300,60);ctx.fillStyle='#fff';ctx.font='16px Arial';ctx.textAlign='center';ctx.fillText(`Balance: $${this.gameState.balance} | Win: $${this.gameState.win}`,200,455);
  }
  getPlayerInput(){const n=this.players[0]||'Player';return window.gameState&&window.gameState[n]?window.gameState[n].input||{}:{};}
  updatePlayerInput(n,i){window.gameState=window.gameState||{};window.gameState[n]={input:i};if(i.action&&!this.gameState.spinning&&this.gameState.balance>=this.gameState.bet){this.gameState.balance-=this.gameState.bet;this.gameState.spinning=true;this.gameState.time=0;this.gameState.win=0;const syms=['♠','♥','★','7','♦'];this.gameState.reels=Array(3).fill(null).map(()=>({symbol:syms[Math.floor(Math.random()*5)],offset:0}));}}
}
window.SlotMachineGame = SlotMachineGame;