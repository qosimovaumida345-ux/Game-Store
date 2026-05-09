// VTX MEGA GAMING PORTAL

const games = [
    // ===== RACING =====
    { id: "smash-karts", name: "Smash Karts", genre: "Racing", path: "https://www.crazygames.com/embed/smash-karts", isExternal: true },
    { id: "drift-hunters", name: "Drift Hunters", genre: "Racing", path: "https://www.crazygames.com/embed/drift-hunters", isExternal: true },
    { id: "madalin-stunt-cars-2", name: "Madalin Stunt Cars 2", genre: "Racing", path: "https://www.crazygames.com/embed/madalin-stunt-cars-2", isExternal: true },
    { id: "moto-x3m", name: "Moto X3M", genre: "Racing", path: "https://www.crazygames.com/embed/moto-x3m", isExternal: true },
    
    // ===== SHOOTERS =====
    { id: "shellshockersio", name: "Shell Shockers", genre: "Shooter", path: "https://www.crazygames.com/embed/shellshockersio", isExternal: true },
    { id: "bullet-force-multiplayer", name: "Bullet Force", genre: "Shooter", path: "https://www.crazygames.com/embed/bullet-force-multiplayer", isExternal: true },
    { id: "krunker-io", name: "Krunker", genre: "Shooter", path: "https://www.crazygames.com/embed/krunker-io", isExternal: true },
    { id: "build-and-crush", name: "Build and Crush", genre: "Shooter", path: "https://www.crazygames.com/embed/build-and-crush", isExternal: true },

    // ===== ACTION / ADVENTURE =====
    { id: "funny-shooter-2", name: "Funny Shooter 2", genre: "Action", path: "https://www.crazygames.com/embed/funny-shooter-2", isExternal: true },
    { id: "subway-clash-3d", name: "Subway Clash 3D", genre: "Action", path: "https://www.crazygames.com/embed/subway-clash-3d", isExternal: true },
    { id: "parkour-block-3d", name: "Parkour Block 3D", genre: "Action", path: "https://www.crazygames.com/embed/parkour-block-3d", isExternal: true },
    { id: "temple-run-2", name: "Temple Run 2", genre: "Action", path: "https://www.crazygames.com/embed/temple-run-2", isExternal: true },

    // ===== PUZZLE / ARCADE =====
    { id: "geometry-dash", name: "Geometry Dash", genre: "Arcade", path: "https://www.crazygames.com/embed/geometry-dash", isExternal: true },
    { id: "bloxdhop-io", name: "Bloxd.io", genre: "Arcade", path: "https://www.crazygames.com/embed/bloxdhop-io", isExternal: true },
    { id: "1v1-lol", name: "1v1.LOL", genre: "Arcade", path: "https://www.crazygames.com/embed/1v1-lol", isExternal: true },
    { id: "subway-surfers", name: "Subway Surfers", genre: "Arcade", path: "https://www.crazygames.com/embed/subway-surfers", isExternal: true },

    // ===== SPORTS =====
    { id: "basketball-stars-2019", name: "Basketball Stars", genre: "Sports", path: "https://www.crazygames.com/embed/basketball-stars-2019", isExternal: true },
    { id: "soccer-random", name: "Soccer Random", genre: "Sports", path: "https://www.crazygames.com/embed/soccer-random", isExternal: true },
    { id: "basket-random", name: "Basket Random", genre: "Sports", path: "https://www.crazygames.com/embed/basket-random", isExternal: true },
    { id: "penalty-shooters-2", name: "Penalty Shooters 2", genre: "Sports", path: "https://www.crazygames.com/embed/penalty-shooters-2", isExternal: true },
    
    // Additional generic reliable embeds
    { id: "hextris", name: "Hextris", genre: "Puzzle", path: "https://hextris.io/", isExternal: true },
    { id: "2048", name: "2048", genre: "Puzzle", path: "https://play2048.co/", isExternal: true }
];

const prefixes = ["Cyber", "Neon", "Dark", "Super", "Mega", "Ghost", "Alien", "Fantasy", "Space", "Void", "Iron", "Shadow", "Magic", "Lost", "Infinite", "Quantum", "Apex", "Nova", "Cosmic", "Rogue"];
const core = ["Rider", "Shooter", "Fighter", "Runner", "Hunter", "Warrior", "Sniper", "Racer", "Driver", "Knight", "Ninja", "Zombie", "Robot", "Dragon", "Wizard", "Pirate", "Tank", "Hero", "Samurai", "Pilot"];
const suffixes = ["3D", "X", "Pro", "Legends", "Quest", "Arena", "Clash", "Wars", "Combat", "Drift", "Dash", "Strike", "Battle", "Online", "VR"];

const genericUrls = [
    "https://www.crazygames.com/embed/drift-hunters",
    "https://www.crazygames.com/embed/moto-x3m",
    "https://www.crazygames.com/embed/shellshockersio",
    "https://www.crazygames.com/embed/subway-surfers"
];

const generatedNames = new Set();
while(generatedNames.size < 300) {
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const c = core[Math.floor(Math.random() * core.length)];
    const s = suffixes[Math.floor(Math.random() * suffixes.length)];
    generatedNames.add(`${p} ${c} ${s}`);
}

const namesArray = Array.from(generatedNames);

for(let i = 0; i < 300; i++) {
    games.push({
        id: `vtx-game-${i}`,
        name: namesArray[i],
        genre: i % 3 === 0 ? "3D Simulator" : (i % 2 === 0 ? "Action 3D" : "Arcade"),
        path: genericUrls[i % genericUrls.length],
        isExternal: true
    });
}

module.exports = {
    gameList: games,
    fetchGameList: async function() {
        return games;
    }
};