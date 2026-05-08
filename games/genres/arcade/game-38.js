// Donkey Kong Style Game
class DonkeyKongGame {
  constructor(canvas, players, gameId) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.players = players;
    this.gameId = gameId;
    this.isRunning = false;
    this.lastTime = 0;
    
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    this.gameState = {
      time: 0,
      score: 0,
      level: 1,
      lives: 3,
      player: null,
      barrel: null,
      barrels: [],
      platforms: [],
      Pauline: null,
      DK: null,
      oil: null,
      jumpTimer: 0,
      status: 'playing',
      gameOver: false,
      win: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    this.gameState.player = { x: 50, y: 520, vx: 0, vy: 0, grounded: true };
    this.gameState.DK = { x: 700, y: 150, throwing: false, throwTimer: 0 };
    this.gameState.Pauline = { x: 380, y: 80 };
    this.gameState.oil = { x: 100, y: 530 };
    this.gameState.barrels = [];
    this.gameState.platforms = [
      { x: 0, y: 540, width: 150, height: 20 },
      { x: 200, y: 480, width: 150, height: 20 },
      { x: 50, y: 400, width: 120, height: 20 },
      { x: 250, y: 320, width: 150, height: 20 },
      { x: 80, y: 240, width: 120, height: 20 },
      { x: 300, y: 160, width: 200, height: 20 },
      { x: 550, y: 90, width: 200, height: 20 }
    ];
  }
  
  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }
  
  stop() { this.isRunning = false; }
  
  gameLoop(currentTime) {
    if (!this.isRunning) return;
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    this.update(deltaTime);
    this.render();
    requestAnimationFrame((time) => this.gameLoop(time));
  }
  
  update(deltaTime) {
    if (this.gameState.gameOver || this.gameState.win) return;
    this.gameState.time += deltaTime;
    
    this.updatePlayer(deltaTime);
    this.updateDK(deltaTime);
    this.updateBarrels(deltaTime);
    this.checkCollisions();
    
    if (this.gameState.player.x > 550 && this.gameState.player.y < 110) {
      this.gameState.win = true;
      this.gameState.score += 1000;
    }
  }
  
  updatePlayer(deltaTime) {
    const p = this.gameState.player;
    const input = this.getPlayerInput(this.players[0]);
    
    if (input.left) p.vx = -200;
    else if (input.right) p.vx = 200;
    else p.vx = 0;
    
    if (input.up && p.grounded) {
      p.vy = -450;
      p.grounded = false;
    }
    
    p.vy += 800 * deltaTime;
    
    p.x += p.vx * deltaTime;
    p.y += p.vy * deltaTime;
    
    p.x = Math.max(20, Math.min(780, p.x));
    
    p.grounded = false;
    this.gameState.platforms.forEach(plat => {
      if (p.x + 20 > plat.x && p.x < plat.x + plat.width &&
          p.y + 30 > plat.y && p.y + 30 < plat.y + plat.height + 20 && p.vy >= 0) {
        p.y = plat.y - 30;
        p.vy = 0;
        p.grounded = true;
      }
    });
    
    if (p.y > 600) {
      this.gameState.lives--;
      if (this.gameState.lives <= 0) this.gameState.gameOver = true;
      p.x = 50;
      p.y = 520;
      p.vx = 0;
      p.vy = 0;
    }
  }
  
  updateDK(deltaTime) {
    const dk = this.gameState.DK;
    dk.throwTimer += deltaTime;
    
    if (dk.throwTimer > 2 && !dk.throwing) {
      dk.throwing = true;
      dk.throwTimer = 0;
      
      this.gameState.barrels.push({
        x: dk.x,
        y: dk.y + 40,
        vx: -100 - Math.random() * 50,
        vy: 50,
        rolling: true
      });
    }
    
    if (dk.throwing && dk.throwTimer > 0.3) {
      dk.throwing = false;
    }
  }
  
  updateBarrels(deltaTime) {
    const p = this.gameState.player;
    
    this.gameState.barrels.forEach((barrel, i) => {
      barrel.vy += 600 * deltaTime;
      
      barrel.x += barrel.vx * deltaTime;
      barrel.y += barrel.vy * deltaTime;
      
      if (barrel.x < 30 || barrel.x > 770) {
        barrel.vx *= -1;
      }
      
      this.gameState.platforms.forEach(plat => {
        if (barrel.x + 15 > plat.x && barrel.x + 15 < plat.x + plat.width &&
            barrel.y + 15 > plat.y && barrel.y + 15 < plat.y + plat.height + 10 && barrel.vy >= 0) {
          barrel.y = plat.y - 15;
          barrel.vy = 0;
          barrel.vx = barrel.rolling ? (Math.random() > 0.5 ? 80 : -80) : barrel.vx;
        }
      });
      
      if (barrel.y > 600) {
        this.gameState.barrels.splice(i, 1);
      }
    });
  }
  
  checkCollisions() {
    const p = this.gameState.player;
    
    this.gameState.barrels.forEach((barrel, i) => {
      const dx = (p.x + 10) - (barrel.x + 15);
      const dy = (p.y + 15) - (barrel.y + 15);
      
      if (Math.sqrt(dx*dx + dy*dy) < 25) {
        this.gameState.lives--;
        if (this.gameState.lives <= 0) {
          this.gameState.gameOver = true;
        } else {
          p.x = 50;
          p.y = 520;
          p.vx = 0;
          p.vy = 0;
        }
      }
    });
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, 600);
    skyGrad.addColorStop(0, '#1a1a3a');
    skyGrad.addColorStop(1, '#4a2c6a');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, 800, 600);
    
    this.ctx.fillStyle = '#8b4513';
    this.gameState.platforms.forEach(plat => {
      this.ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
      this.ctx.fillStyle = '#654321';
      this.ctx.fillRect(plat.x, plat.y + plat.height - 5, plat.width, 5);
      this.ctx.fillStyle = '#8b4513';
    });
    
    const dk = this.gameState.DK;
    this.ctx.fillStyle = '#8b4513';
    this.ctx.fillRect(dk.x - 20, dk.y - 30, 50, 80);
    this.ctx.fillStyle = '#d4a574';
    this.ctx.beginPath();
    this.ctx.arc(dk.x + 5, dk.y - 40, 25, 0, Math.PI*2);
    this.ctx.fill();
    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(dk.x - 5, dk.y - 45, 4, 0, Math.PI*2);
    this.ctx.arc(dk.x + 15, dk.y - 45, 4, 0, Math.PI*2);
    this.ctx.fill();
    this.ctx.fillStyle = '#8b4513';
    this.ctx.beginPath();
    this.ctx.arc(dk.x + 5, dk.y - 55, 30, 0, Math.PI, true);
    this.ctx.fill();
    
    if (dk.throwing) {
      this.ctx.fillStyle = '#8b4513';
      this.ctx.beginPath();
      this.ctx.ellipse(dk.x - 30, dk.y + 10, 15, 10, 0, 0, Math.PI*2);
      this.ctx.fill();
    }
    
    const pauline = this.gameState.Pauline;
    this.ctx.fillStyle = '#ff69b4';
    this.ctx.fillRect(pauline.x, pauline.y, 30, 50);
    this.ctx.fillStyle = '#ffe4c4';
    this.ctx.beginPath();
    this.ctx.arc(pauline.x + 15, pauline.y - 5, 12, 0, Math.PI*2);
    this.ctx.fill();
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fillRect(pauline.x + 10, pauline.y - 20, 10, 5);
    
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(350, 60, 100, 30);
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText('I LOVE YOU', 400, 82);
    
    this.ctx.fillStyle = '#2c2c2c';
    this.gameState.barrels.forEach(barrel => {
      this.ctx.beginPath();
      this.ctx.arc(barrel.x + 15, barrel.y + 15, 15, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.strokeStyle = '#555';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    });
    
    const p = this.gameState.player;
    this.ctx.fillStyle = '#0000cd';
    this.ctx.fillRect(p.x, p.y, 20, 30);
    this.ctx.fillStyle = '#ffe4c4';
    this.ctx.beginPath();
    this.ctx.arc(p.x + 10, p.y - 2, 10, 0, Math.PI*2);
    this.ctx.fill();
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(p.x + 5, p.y - 6, 4, 4);
    this.ctx.fillRect(p.x + 11, p.y - 6, 4, 4);
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fillRect(p.x + 6, p.y + 2, 8, 3);
    
    if (p.vy < 0) {
      this.ctx.fillStyle = '#8b4513';
      this.ctx.fillRect(p.x - 5, p.y + 20, 10, 10);
      this.ctx.fillRect(p.x + 15, p.y + 20, 10, 10);
    } else {
      this.ctx.fillStyle = '#8b4513';
      this.ctx.fillRect(p.x - 2, p.y + 25, 8, 8);
      this.ctx.fillRect(p.x + 14, p.y + 25, 8, 8);
    }
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Score: ' + this.gameState.score, 20, 30);
    this.ctx.fillText('Lives: ' + this.gameState.lives, 20, 55);
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fillText('DONKEY KONG', this.canvas.width/2, 25);
    
    if (this.gameState.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, 800, 600);
      this.ctx.fillStyle = '#ff0000';
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillText('GAME OVER', 400, 300);
    }
    
    if (this.gameState.win) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, 800, 600);
      this.ctx.fillStyle = '#00ff00';
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillText('YOU WIN!', 400, 300);
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
  }
}

window.DonkeyKongGame = DonkeyKongGame;