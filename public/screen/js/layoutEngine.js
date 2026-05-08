class LayoutEngine {
  constructor(gameScreen) {
    this.gameScreen = gameScreen;
    this.playerViews = [];
    this.canvases = [];
  }

  applyLayout(playerCount, gameType) {
    this.gameScreen.className = 'screen active';
    this.playerViews.forEach(v => v.remove());
    this.playerViews = [];
    this.canvases = [];

    let layoutClass = '';

    if (playerCount === 1) {
      layoutClass = 'single-player';
      this.createSinglePlayerCanvas();
    } else if (gameType && gameType.includes('racing')) {
      layoutClass = 'racing-layout';
      this.createRacingLayout(playerCount);
    } else if (playerCount === 2) {
      layoutClass = 'split-vertical';
      this.createSplitLayout(playerCount);
    } else if (playerCount <= 4) {
      layoutClass = 'split-grid-2x2';
      this.createGridLayout(2, 2);
    } else if (playerCount <= 6) {
      layoutClass = 'split-grid-3x3';
      this.createGridLayout(3, 3);
    } else {
      layoutClass = 'split-grid-4x4';
      this.createGridLayout(4, 4);
    }

    this.gameScreen.classList.add(layoutClass);
    return this.canvases;
  }

  createSinglePlayerCanvas() {
    const mainCanvas = document.getElementById('game-canvas');
    mainCanvas.style.display = 'block';
    this.canvases.push(mainCanvas);
  }

  createRacingLayout(count) {
    const mainCanvas = document.getElementById('game-canvas');
    mainCanvas.style.display = 'none';
    mainCanvas.remove();

    for (let i = 0; i < count; i++) {
      const view = this.createPlayerView(`player-${i}`);
      const canvas = document.createElement('canvas');
      canvas.id = `canvas-player-${i}`;
      view.appendChild(canvas);
      this.canvases.push(canvas);
    }
  }

  createSplitLayout(count) {
    const mainCanvas = document.getElementById('game-canvas');
    mainCanvas.style.display = 'none';
    mainCanvas.remove();

    for (let i = 0; i < count; i++) {
      const view = this.createPlayerView(`player-${i}`);
      const canvas = document.createElement('canvas');
      canvas.id = `canvas-player-${i}`;
      view.appendChild(canvas);
      this.canvases.push(canvas);
    }
  }

  createGridLayout(cols, rows) {
    const mainCanvas = document.getElementById('game-canvas');
    mainCanvas.style.display = 'none';
    mainCanvas.remove();

    const total = cols * rows;
    for (let i = 0; i < total; i++) {
      const view = this.createPlayerView(`player-${i}`);
      const canvas = document.createElement('canvas');
      canvas.id = `canvas-player-${i}`;
      view.appendChild(canvas);
      this.canvases.push(canvas);
    }
  }

  createPlayerView(className) {
    const view = document.createElement('div');
    view.className = `player-view ${className}`;
    
    const info = document.createElement('div');
    info.className = 'player-info';
    info.innerHTML = `<span class="player-name">Player</span>`;
    view.appendChild(info);
    
    this.gameScreen.appendChild(view);
    this.playerViews.push(view);
    return view;
  }

  updatePlayerInfo(playerIndex, playerName, score) {
    if (this.playerViews[playerIndex]) {
      const info = this.playerViews[playerIndex].querySelector('.player-info');
      if (info) {
        info.innerHTML = `
          <span class="player-name">${playerName}</span>
          ${score !== undefined ? `<span class="player-score">Ball: ${score}</span>` : ''}
        `;
      }
    }
  }
}