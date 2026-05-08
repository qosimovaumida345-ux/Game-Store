// Sokoban Puzzle Game
class SokobanGame {
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
      level: 1,
      moves: 0,
      score: 0,
      player: null,
      boxes: [],
      targets: [],
      walls: [],
      grid: [],
      cols: 12,
      rows: 10,
      cellSize: 50,
      history: [],
      status: 'playing',
      gameOver: false,
      completed: false
    };
    
    this.levels = [
      {
        player: { x: 1, y: 1 },
        boxes: [{ x: 2, y: 2 }, { x: 4, y: 3 }],
        targets: [{ x: 5, y: 5 }, { x: 6, y: 6 }],
        walls: [
          { x: 0, y: 0, w: 12, h: 1 },
          { x: 0, y: 9, w: 12, h: 1 },
          { x: 0, y: 0, w: 1, h: 10 },
          { x: 11, y: 0, w: 1, h: 10 },
          { x: 3, y: 1, w: 1, h: 3 },
          { x: 7, y: 4, w: 2, h: 1 },
          { x: 4, y: 6, w: 1, h: 2 }
        ]
      },
      {
        player: { x: 1, y: 1 },
        boxes: [{ x: 2, y: 2 }, { x: 3, y: 3 }, { x: 4, y: 4 }],
        targets: [{ x: 6, y: 2 }, { x: 7, y: 4 }, { x: 8, y: 6 }],
        walls: [
          { x: 0, y: 0, w: 12, h: 1 },
          { x: 0, y: 9, w: 12, h: 1 },
          { x: 0, y: 0, w: 1, h: 10 },
          { x: 11, y: 0, w: 1, h: 10 },
          { x: 2, y: 1, w: 3, h: 1 },
          { x: 1, y: 5, w: 1, h: 3 },
          { x: 5, y: 3, w: 1, h: 4 },
          { x: 7, y: 1, w: 2, h: 1 },
          { x: 9, y: 5, w: 1, h: 3 }
        ]
      }
    ];
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.parentElement.clientWidth || 800;
    this.canvas.height = this.parentElement.clientHeight || 600;
  }
  
  initGame() {
    const level = this.levels[(this.gameState.level - 1) % this.levels.length];
    
    this.gameState.player = { x: level.player.x, y: level.player.y };
    this.gameState.boxes = level.boxes.map(b => ({ ...b }));
    this.gameState.targets = level.targets.map(t => ({ ...t }));
    this.gameState.walls = level.walls;
    this.gameState.moves = 0;
    this.gameState.completed = false;
    
    this.gameState.history = [];
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
    if (this.gameState.gameOver || this.gameState.completed) return;
    this.gameState.time += deltaTime;
    
    this.checkWinCondition();
  }
  
  movePlayer(dx, dy) {
    if (this.gameState.completed) return;
    
    const newX = this.gameState.player.x + dx;
    const newY = this.gameState.player.y + dy;
    
    if (this.isWall(newX, newY)) return;
    
    const boxIndex = this.getBoxAt(newX, newY);
    
    if (boxIndex !== -1) {
      const boxNewX = newX + dx;
      const boxNewY = newY + dy;
      
      if (this.isWall(boxNewX, boxNewY) || this.getBoxAt(boxNewX, boxNewY) !== -1) {
        return;
      }
      
      this.gameState.history.push({
        player: { ...this.gameState.player },
        boxes: this.gameState.boxes.map(b => ({ ...b }))
      });
      
      this.gameState.boxes[boxIndex].x = boxNewX;
      this.gameState.boxes[boxIndex].y = boxNewY;
      this.gameState.moves++;
      this.gameState.score = Math.max(0, 1000 - this.gameState.moves * 10);
    } else {
      this.gameState.history.push({
        player: { ...this.gameState.player },
        boxes: this.gameState.boxes.map(b => ({ ...b }))
      });
      
      this.gameState.player.x = newX;
      this.gameState.player.y = newY;
      this.gameState.moves++;
      this.gameState.score = Math.max(0, 1000 - this.gameState.moves * 10);
    }
  }
  
  isWall(x, y) {
    return this.gameState.walls.some(w => 
      x >= w.x && x < w.x + w.w && y >= w.y && y < w.y + w.h
    );
  }
  
  getBoxAt(x, y) {
    return this.gameState.boxes.findIndex(b => b.x === x && b.y === y);
  }
  
  checkWinCondition() {
    const allBoxesOnTargets = this.gameState.boxes.every(box =>
      this.gameState.targets.some(target => target.x === box.x && target.y === box.y)
    );
    
    if (allBoxesOnTargets) {
      this.gameState.completed = true;
      this.gameState.score += 500;
    }
  }
  
  undoMove() {
    if (this.gameState.history.length === 0) return;
    
    const lastState = this.gameState.history.pop();
    this.gameState.player = lastState.player;
    this.gameState.boxes = lastState.boxes;
    this.gameState.moves = Math.max(0, this.gameState.moves - 1);
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  render() {
    const grad = this.ctx.createLinearGradient(0, 0, 0, 600);
    grad.addColorStop(0, '#2c3e50');
    grad.addColorStop(1, '#1a252f');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, 800, 600);
    
    const offsetX = 100;
    const offsetY = 50;
    const size = this.gameState.cellSize;
    
    this.ctx.strokeStyle = '#34495e';
    this.ctx.lineWidth = 1;
    for (let x = 0; x <= this.gameState.cols; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(offsetX + x * size, offsetY);
      this.ctx.lineTo(offsetX + x * size, offsetY + this.gameState.rows * size);
      this.ctx.stroke();
    }
    for (let y = 0; y <= this.gameState.rows; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(offsetX, offsetY + y * size);
      this.ctx.lineTo(offsetX + this.gameState.cols * size, offsetY + y * size);
      this.ctx.stroke();
    }
    
    this.ctx.fillStyle = '#7f8c8d';
    this.gameState.walls.forEach(w => {
      for (let x = w.x; x < w.x + w.w; x++) {
        for (let y = w.y; y < w.y + w.h; y++) {
          this.ctx.fillRect(offsetX + x * size, offsetY + y * size, size, size);
          this.ctx.strokeStyle = '#95a5a6';
          this.ctx.strokeRect(offsetX + x * size, offsetY + y * size, size, size);
        }
      }
    });
    
    this.gameState.targets.forEach(t => {
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.beginPath();
      this.ctx.arc(offsetX + t.x * size + size/2, offsetY + t.y * size + size/2, size/3, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.strokeStyle = '#c0392b';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
    });
    
    this.gameState.boxes.forEach(b => {
      const onTarget = this.gameState.targets.some(t => t.x === b.x && t.y === b.y);
      
      if (onTarget) {
        this.ctx.fillStyle = '#2ecc71';
      } else {
        this.ctx.fillStyle = '#e67e22';
      }
      
      this.ctx.fillRect(offsetX + b.x * size + 4, offsetY + b.y * size + 4, size - 8, size - 8);
      
      this.ctx.strokeStyle = onTarget ? '#27ae60' : '#d35400';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(offsetX + b.x * size + 4, offsetY + b.y * size + 4, size - 8, size - 8);
      
      this.ctx.fillStyle = onTarget ? '#27ae60' : '#d35400';
      this.ctx.fillRect(offsetX + b.x * size + 10, offsetY + b.y * size + 10, size - 20, size - 20);
    });
    
    const p = this.gameState.player;
    this.ctx.fillStyle = '#3498db';
    this.ctx.beginPath();
    this.ctx.arc(offsetX + p.x * size + size/2, offsetY + p.y * size + size/2, size/2 - 5, 0, Math.PI*2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#2980b9';
    this.ctx.beginPath();
    this.ctx.arc(offsetX + p.x * size + size/2, offsetY + p.y * size + size/2 + 5, size/3, 0, Math.PI*2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Level: ' + this.gameState.level, 20, 30);
    this.ctx.fillText('Moves: ' + this.gameState.moves, 20, 55);
    this.ctx.fillText('Score: ' + this.gameState.score, 20, 80);
    
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('SOKOBAN', 400, 25);
    
    this.ctx.fillStyle = '#95a5a6';
    this.ctx.font = '12px Arial';
    this.ctx.fillText('Arrow Keys: Move | U: Undo | R: Restart', 400, 580);
    
    if (this.gameState.completed) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, 800, 600);
      
      this.ctx.fillStyle = '#2ecc71';
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillText('LEVEL COMPLETE!', 400, 280);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '24px Arial';
      this.ctx.fillText('Moves: ' + this.gameState.moves, 400, 330);
      this.ctx.fillText('Score: ' + this.gameState.score, 400, 360);
    }
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    
    if (input.up) this.movePlayer(0, -1);
    if (input.down) this.movePlayer(0, 1);
    if (input.left) this.movePlayer(-1, 0);
    if (input.right) this.movePlayer(1, 0);
    if (input.undo) this.undoMove();
  }
}

window.SokobanGame = SokobanGame;