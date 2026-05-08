// Turn-Based Strategy Game
class TurnBasedStrategyGame {
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
      turn: 1,
      playerTurn: 1,
      selectedUnit: null,
      validMoves: [],
      validAttacks: [],
      status: 'select',
      p1Base: { x: 100, y: 300, health: 100 },
      p2Base: { x: 700, y: 300, health: 100 },
      p1Units: [],
      p2Units: [],
      turnActions: 0,
      maxActions: 2,
      gameOver: false
    };
    
    this.initGame();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
  }
  
  initGame() {
    const unitTypes = [
      { name: 'Knight', hp: 30, atk: 10, move: 3, range: 1, cost: 3 },
      { name: 'Archer', hp: 20, atk: 8, move: 2, range: 3, cost: 2 },
      { name: 'Mage', hp: 15, atk: 12, move: 2, range: 2, cost: 3 }
    ];
    
    const p1Positions = [
      { x: 200, y: 250, type: 0 }, { x: 200, y: 350, type: 1 },
      { x: 250, y: 300, type: 2 }, { x: 150, y: 300, type: 0 }
    ];
    
    const p2Positions = [
      { x: 600, y: 250, type: 0 }, { x: 600, y: 350, type: 1 },
      { x: 550, y: 300, type: 2 }, { x: 650, y: 300, type: 0 }
    ];
    
    p1Positions.forEach((pos, i) => {
      const type = unitTypes[pos.type];
      this.gameState.p1Units.push({
        x: pos.x, y: pos.y,
        name: type.name, hp: type.hp, maxHp: type.hp,
        atk: type.atk, move: type.move, range: type.range,
        team: 1, hasMoved: false, hasAttacked: false
      });
    });
    
    p2Positions.forEach((pos, i) => {
      const type = unitTypes[pos.type];
      this.gameState.p2Units.push({
        x: pos.x, y: pos.y,
        name: type.name, hp: type.hp, maxHp: type.hp,
        atk: type.atk, move: type.move, range: type.range,
        team: 2, hasMoved: false, hasAttacked: false
      });
    });
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
    if (this.gameState.gameOver) return;
    this.gameState.time += deltaTime;
  }
  
  selectUnit(unit) {
    if (unit.team !== this.gameState.playerTurn) return;
    if (unit.hasMoved && unit.hasAttacked) return;
    
    this.gameState.selectedUnit = unit;
    this.gameState.status = 'selected';
    this.calculateValidMoves(unit);
  }
  
  calculateValidMoves(unit) {
    this.gameState.validMoves = [];
    this.gameState.validAttacks = [];
    
    const enemyTeam = unit.team === 1 ? this.gameState.p2Units : this.gameState.p1Units;
    const allUnits = [...this.gameState.p1Units, ...this.gameState.p2Units];
    
    if (!unit.hasMoved) {
      for (let x = -unit.move; x <= unit.move; x++) {
        for (let y = -unit.move; y <= unit.move; y++) {
          const dist = Math.abs(x) + Math.abs(y);
          if (dist <= unit.move && dist > 0) {
            const newX = unit.x + x * 50;
            const newY = unit.y + y * 50;
            
            if (newX > 50 && newX < 750 && newY > 100 && newY < 500) {
              const occupied = allUnits.some(u => u.x === newX && u.y === newY);
              if (!occupied) {
                this.gameState.validMoves.push({ x: newX, y: newY });
              }
            }
          }
        }
      }
    }
    
    if (!unit.hasAttacked) {
      enemyTeam.forEach(enemy => {
        const dist = Math.abs(enemy.x - unit.x) + Math.abs(enemy.y - unit.y);
        if (dist <= unit.range * 50) {
          this.gameState.validAttacks.push({ x: enemy.x, y: enemy.y, target: enemy });
        }
      });
    }
  }
  
  moveUnit(x, y) {
    const unit = this.gameState.selectedUnit;
    if (!unit || unit.hasMoved) return;
    
    unit.x = x;
    unit.y = y;
    unit.hasMoved = true;
    this.gameState.validMoves = [];
  }
  
  attackUnit(target) {
    const unit = this.gameState.selectedUnit;
    if (!unit || unit.hasAttacked) return;
    
    target.hp -= unit.atk;
    unit.hasAttacked = true;
    this.gameState.validAttacks = [];
    
    if (target.hp <= 0) {
      if (target.team === 1) {
        this.gameState.p1Units = this.gameState.p1Units.filter(u => u !== target);
      } else {
        this.gameState.p2Units = this.gameState.p2Units.filter(u => u !== target);
      }
    }
    
    this.checkWinCondition();
  }
  
  endTurn() {
    this.gameState.playerTurn = this.gameState.playerTurn === 1 ? 2 : 1;
    this.gameState.turn++;
    this.gameState.turnActions = 0;
    this.gameState.selectedUnit = null;
    this.gameState.validMoves = [];
    this.gameState.validAttacks = [];
    this.gameState.status = 'select';
    
    this.gameState.p1Units.forEach(u => { u.hasMoved = false; u.hasAttacked = false; });
    this.gameState.p2Units.forEach(u => { u.hasMoved = false; u.hasAttacked = false; });
  }
  
  checkWinCondition() {
    const p1Alive = this.gameState.p1Units.length > 0;
    const p2Alive = this.gameState.p2Units.length > 0;
    
    if (!p1Alive) this.gameState.gameOver = true;
    if (!p2Alive) this.gameState.gameOver = true;
  }
  
  getPlayerInput(playerName) {
    return window.gameState && window.gameState[playerName] ? window.gameState[playerName].input || {} : {};
  }
  
  handleInput(input, playerName) {
    if (input.action) this.endTurn();
  }
  
  render() {
    this.drawBackground();
    this.drawGrid();
    this.drawBases();
    this.drawUnits();
    this.drawHighlights();
    this.drawUI();
    if (this.gameState.gameOver) this.drawGameOver();
  }
  
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    gradient.addColorStop(0, '#1a472a');
    gradient.addColorStop(1, '#2d5a27');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawGrid() {
    this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    this.ctx.lineWidth = 1;
    
    for (let x = 50; x < 750; x += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 100);
      this.ctx.lineTo(x, 500);
      this.ctx.stroke();
    }
    
    for (let y = 100; y < 500; y += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(50, y);
      this.ctx.lineTo(750, y);
      this.ctx.stroke();
    }
  }
  
  drawBases() {
    const p1Base = this.gameState.p1Base;
    const p2Base = this.gameState.p2Base;
    
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillRect(p1Base.x - 30, p1Base.y - 25, 60, 50);
    this.ctx.fillStyle = '#2980b9';
    this.ctx.fillRect(p1Base.x - 20, p1Base.y - 35, 40, 15);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(p2Base.x - 30, p2Base.y - 25, 60, 50);
    this.ctx.fillStyle = '#c0392b';
    this.ctx.fillRect(p2Base.x - 20, p2Base.y - 35, 40, 15);
  }
  
  drawUnits() {
    const allUnits = [...this.gameState.p1Units, ...this.gameState.p2Units];
    
    allUnits.forEach(unit => {
      const color = unit.team === 1 ? '#3498db' : '#e74c3c';
      const darkColor = unit.team === 1 ? '#2980b9' : '#c0392b';
      
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(unit.x, unit.y, 20, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = darkColor;
      this.ctx.fillRect(unit.x - 15, unit.y - 25, 30, 6);
      this.ctx.fillStyle = '#2ecc71';
      this.ctx.fillRect(unit.x - 15, unit.y - 25, 30 * (unit.hp / unit.maxHp), 6);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.textAlign = 'center';
      const initial = unit.name[0];
      this.ctx.fillText(initial, unit.x, unit.y + 4);
      
      if (unit.hasMoved && unit.hasAttacked) {
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.beginPath();
        this.ctx.arc(unit.x, unit.y, 22, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }
  
  drawHighlights() {
    this.gameState.validMoves.forEach(move => {
      this.ctx.fillStyle = 'rgba(46, 204, 113, 0.4)';
      this.ctx.beginPath();
      this.ctx.arc(move.x, move.y, 15, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    this.gameState.validAttacks.forEach(attack => {
      this.ctx.fillStyle = 'rgba(231, 76, 60, 0.5)';
      this.ctx.beginPath();
      this.ctx.arc(attack.x, attack.y, 20, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawUI() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(10, 10, 150, 80);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Turn: ${this.gameState.turn}`, 20, 30);
    this.ctx.fillText(`Player: ${this.gameState.playerTurn}`, 20, 50);
    this.ctx.fillText(`Units P1: ${this.gameState.p1Units.length}`, 20, 70);
    this.ctx.fillText(`Units P2: ${this.gameState.p2Units.length}`, 100, 70);
    
    if (this.gameState.selectedUnit) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
      this.ctx.fillRect(this.canvas.width - 160, 10, 150, 80);
      
      const unit = this.gameState.selectedUnit;
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(unit.name, this.canvas.width - 150, 30);
      this.ctx.fillText(`HP: ${unit.hp}/${unit.maxHp}`, this.canvas.width - 150, 50);
      this.ctx.fillText(`ATK: ${unit.atk}`, this.canvas.width - 150, 70);
      this.ctx.fillText(`Move: ${unit.move}`, this.canvas.width - 80, 70);
    }
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(this.canvas.width/2 - 60, 10, 120, 35);
    
    this.ctx.fillStyle = this.gameState.playerTurn === 1 ? '#3498db' : '#e74c3c';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`P${this.gameState.playerTurn}'s Turn`, this.canvas.width/2, 33);
    
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.fillText('TACTICS', this.canvas.width/2, 55);
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const p1Alive = this.gameState.p1Units.length > 0;
    const winner = p1Alive ? 'Player 1' : 'Player 2';
    const color = p1Alive ? '#3498db' : '#e74c3c';
    
    this.ctx.fillStyle = color;
    this.ctx.font = 'bold 50px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${winner} Wins!`, this.canvas.width / 2, this.canvas.height / 2);
  }
  
  updatePlayerInput(name, input) {
    window.gameState = window.gameState || {};
    window.gameState[name] = { input: input };
    this.handleInput(input, name);
  }
}

window.TurnBasedStrategyGame = TurnBasedStrategyGame;