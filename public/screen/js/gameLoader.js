class GameLoader {
  constructor() {
    this.loadedGames = new Map();
    this.loadedScripts = new Set();
  }

  async loadGame(gameId, gamePath) {
    // Check if already loaded with different key
    for (const [key, gameClass] of this.loadedGames.entries()) {
      if (key.startsWith(gamePath)) {
        return gameClass;
      }
    }

    if (this.loadedScripts.has(gamePath)) {
      // Script loaded but class not found, try different approach
      return this.findGameClass(gameId, gamePath);
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = gamePath;
      script.onload = async () => {
        this.loadedScripts.add(gamePath);
        
        // Try to find any Game class in window
        const gameClass = await this.findGameClass(gameId, gamePath);
        if (gameClass) {
          this.loadedGames.set(gameId, gameClass);
          resolve(gameClass);
        } else {
          reject(new Error(`No game class found in ${gamePath}`));
        }
      };
      script.onerror = () => {
        reject(new Error(`Failed to load game: ${gamePath}`));
      };
      document.body.appendChild(script);
    });
  }

  async findGameClass(gameId, gamePath) {
    // Try multiple patterns to find the game class
    const possibleNames = [
      gameId + 'Game',           // racing-1Game
      gameId.replace(/-/g, '') + 'Game', // racing1Game
      'Game'                     // Generic
    ];

    // Also check all window objects for any class ending with 'Game'
    for (let key in window) {
      if (key.toLowerCase().includes('game') && typeof window[key] === 'function') {
        const GameClass = window[key];
        // Check if it's a class (has prototype)
        if (GameClass.prototype && GameClass.prototype.constructor) {
          // Found a game class!
          return GameClass;
        }
      }
    }

    // If still not found, fetch the script and parse it
    try {
      const response = await fetch(gamePath);
      const text = await response.text();
      const match = text.match(/class\s+(\w+Game)\s+/);
      if (match) {
        const className = match[1];
        return window[className];
      }
    } catch (e) {
      console.error('Error parsing game file:', e);
    }

    return null;
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