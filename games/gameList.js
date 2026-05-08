const fs = require('fs');
const path = require('path');

// This module now acts as the catalog for 3D WebGL Games
// It scans the games directory for valid WebGL builds (directories containing index.html)

function getGamesList() {
    const gamesDir = path.join(__dirname, '../games');
    const games = [];

    if (!fs.existsSync(gamesDir)) return games;

    const items = fs.readdirSync(gamesDir);
    for (const item of items) {
        const itemPath = path.join(gamesDir, item);
        const stat = fs.statSync(itemPath);

        // A valid game is a directory that contains an index.html file
        if (stat.isDirectory() && fs.existsSync(path.join(itemPath, 'index.html'))) {
            // By default, the name is the folder name, formatted nicely
            const defaultName = item.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            games.push({
                id: item,
                name: defaultName,
                genre: "WebGL 3D",
                path: `/games/${item}/index.html`,
                isWebGL: true
            });
        }
    }

    return games;
}

module.exports = {
    get gameList() {
        return getGamesList();
    }
};