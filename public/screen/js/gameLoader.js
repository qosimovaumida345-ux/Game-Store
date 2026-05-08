// Smart Game Loader - Properly loads game scripts and finds game classes
class GameLoader {
  constructor() {
    this.loadedScripts = new Set();
    this.gameClassCache = new Map();
  }

  async loadGame(gameId, gamePath) {
    // Check cache
    if (this.gameClassCache.has(gameId)) {
      return this.gameClassCache.get(gameId);
    }

    // Record existing window classes before loading
    const existingClasses = new Set();
    for (const key in window) {
      try {
        if (typeof window[key] === 'function' && window[key].prototype) {
          existingClasses.add(key);
        }
      } catch(e) {}
    }

    return new Promise((resolve, reject) => {
      // Check if script already loaded
      const existingScript = document.querySelector(`script[data-game-id="${gameId}"]`);
      if (existingScript) {
        const cached = this.gameClassCache.get(gameId);
        if (cached) { resolve(cached); return; }
      }

      const script = document.createElement('script');
      script.src = gamePath;
      script.dataset.gameId = gameId;

      script.onload = () => {
        // Wait for script to execute
        setTimeout(() => {
          // Find the NEW class that was added
          let GameClass = null;
          let foundName = null;

          for (const key in window) {
            try {
              if (!existingClasses.has(key) && 
                  typeof window[key] === 'function' && 
                  window[key].prototype &&
                  key !== 'GameFrameworkBase' &&
                  key !== 'GameLoader' &&
                  key !== 'LayoutEngine' &&
                  key !== 'ScreenApp' &&
                  key !== 'FallbackGame') {
                GameClass = window[key];
                foundName = key;
              }
            } catch(e) {}
          }

          // Fallback: look for any *Game class
          if (!GameClass) {
            for (const key in window) {
              try {
                if (typeof window[key] === 'function' && 
                    key.endsWith('Game') && 
                    key !== 'FallbackGame' &&
                    !['GameFrameworkBase'].includes(key)) {
                  GameClass = window[key];
                  foundName = key;
                  break;
                }
              } catch(e) {}
            }
          }

          if (GameClass) {
            console.log(`Loaded: ${gameId} -> ${foundName}`);
            this.gameClassCache.set(gameId, GameClass);
            resolve(GameClass);
          } else {
            console.warn(`No game class found in: ${gamePath}`);
            reject(new Error('Game class not found'));
          }
        }, 80);
      };

      script.onerror = () => {
        reject(new Error('Failed to load script: ' + gamePath));
      };

      document.head.appendChild(script);
    });
  }
}

window.GameLoader = GameLoader;