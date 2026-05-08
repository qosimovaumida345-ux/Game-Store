class GameLoader {
  constructor() {
    this.loadedGames = new Map();
  }

  async loadGame(gameId, gamePath) {
    // Check if already loaded
    if (this.loadedGames.has(gameId)) {
      return this.loadedGames.get(gameId);
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = gamePath;
      
      script.onload = () => {
        // Wait for script to execute
        setTimeout(() => {
          // Find any class with 'Game' in name
          let GameClass = null;
          
          for (let key in window) {
            if (typeof window[key] === 'function' && key.includes('Game')) {
              GameClass = window[key];
              console.log('Found game class:', key);
              break;
            }
          }
          
          if (GameClass) {
            this.loadedGames.set(gameId, GameClass);
            resolve(GameClass);
          } else {
            reject(new Error('Game class not found in: ' + gamePath));
          }
        }, 100);
      };
      
      script.onerror = (e) => {
        reject(new Error('Failed to load: ' + gamePath));
      };
      
      document.head.appendChild(script);
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