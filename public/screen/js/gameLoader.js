class GameLoader {
  constructor() {
    this.loadedGames = new Map();
  }

  async loadGame(gameId, gamePath) {
    if (this.loadedGames.has(gameId)) {
      return this.loadedGames.get(gameId);
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = gamePath;
      script.onload = () => {
        const gameClass = window[gameId + 'Game'];
        if (gameClass) {
          this.loadedGames.set(gameId, gameClass);
          resolve(gameClass);
        } else {
          reject(new Error(`Game class ${gameId}Game not found`));
        }
      };
      script.onerror = () => {
        reject(new Error(`Failed to load game: ${gamePath}`));
      };
      document.body.appendChild(script);
    });
  }

  async loadAssets(assets) {
    const promises = [];
    const loadedAssets = {};

    for (const [name, url] of Object.entries(assets)) {
      promises.push(new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          loadedAssets[name] = img;
          resolve();
        };
        img.onerror = () => {
          console.warn(`Failed to load asset: ${name}`);
          resolve();
        };
        img.src = url;
      }));
    }

    await Promise.all(promises);
    return loadedAssets;
  }
}

window.GameLoader = GameLoader;