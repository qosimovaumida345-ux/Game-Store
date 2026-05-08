// Gaming Platform 500+ - Game List
// 50 genres × 10 unique games = 500+ games

const gameList = [];

const genres = [
  { id: 'racing', name: 'Racing', players: { min: 1, max: 8 }, layout: 'racing' },
  { id: 'platformer', name: 'Platformer', players: { min: 1, max: 4 }, layout: 'split' },
  { id: 'fighting', name: 'Fighting', players: { min: 2, max: 4 }, layout: 'split' },
  { id: 'puzzle', name: 'Puzzle', players: { min: 1, max: 4 }, layout: 'split' },
  { id: 'shooter', name: 'Shooter', players: { min: 1, max: 8 }, layout: 'split' },
  { id: 'rpg', name: 'RPG', players: { min: 1, max: 4 }, layout: 'split' },
  { id: 'strategy', name: 'Strategy', players: { min: 2, max: 8 }, layout: 'split' },
  { id: 'sports', name: 'Sports', players: { min: 2, max: 8 }, layout: 'split' },
  { id: 'arcade', name: 'Arcade', players: { min: 1, max: 4 }, layout: 'split' },
  { id: 'simulation', name: 'Simulation', players: { min: 1, max: 4 }, layout: 'single' },
  { id: 'music', name: 'Music', players: { min: 1, max: 4 }, layout: 'split' },
  { id: 'adventure', name: 'Adventure', players: { min: 1, max: 4 }, layout: 'split' },
  { id: 'runner', name: 'Runner', players: { min: 1, max: 8 }, layout: 'split' },
  { id: 'typing', name: 'Typing', players: { min: 1, max: 4 }, layout: 'split' },
  { id: 'trivia', name: 'Trivia', players: { min: 2, max: 8 }, layout: 'split' },
  { id: 'card', name: 'Card', players: { min: 2, max: 4 }, layout: 'split' },
  { id: 'board', name: 'Board', players: { min: 2, max: 8 }, layout: 'split' },
  { id: 'casino', name: 'Casino', players: { min: 1, max: 4 }, layout: 'single' },
  { id: 'cooking', name: 'Cooking', players: { min: 1, max: 4 }, layout: 'split' },
  { id: 'farming', name: 'Farming', players: { min: 1, max: 4 }, layout: 'single' },
  { id: 'tower-defense', name: 'Tower Defense', players: { min: 1, max: 4 }, layout: 'single' },
  { id: 'idle', name: 'Idle', players: { min: 1, max: 4 }, layout: 'single' },
  { id: 'io-games', name: 'IO Games', players: { min: 2, max: 16 }, layout: 'split' },
  { id: 'physics', name: 'Physics', players: { min: 1, max: 4 }, layout: 'split' },
  { id: 'racing-2d', name: '2D Racing', players: { min: 1, max: 8 }, layout: 'racing' },
  { id: 'battle-royale', name: 'Battle Royale', players: { min: 2, max: 16 }, layout: 'split' },
  { id: 'horror', name: 'Horror', players: { min: 1, max: 4 }, layout: 'split' },
  { id: 'sci-fi', name: 'Sci-Fi', players: { min: 1, max: 8 }, layout: 'split' },
  { id: 'fantasy', name: 'Fantasy', players: { min: 1, max: 4 }, layout: 'split' },
  { id: 'cyberpunk', name: 'Cyberpunk', players: { min: 1, max: 4 }, layout: 'split' },
  { id: 'steampunk', name: 'Steampunk', players: { min: 1, max: 4 }, layout: 'split' },
  { id: 'zombie', name: 'Zombie', players: { min: 1, max: 8 }, layout: 'split' },
  { id: 'ninja', name: 'Ninja', players: { min: 1, max: 4 }, layout: 'split' },
  { id: 'pirate', name: 'Pirate', players: { min: 1, max: 8 }, layout: 'split' },
  { id: 'western', name: 'Western', players: { min: 1, max: 4 }, layout: 'split' },
  { id: 'samurai', name: 'Samurai', players: { min: 2, max: 4 }, layout: 'split' },
  { id: 'dungeon', name: 'Dungeon', players: { min: 1, max: 4 }, layout: 'split' },
  { id: 'roguelike', name: 'Roguelike', players: { min: 1, max: 4 }, layout: 'single' },
  { id: 'metroidvania', name: 'Metroidvania', players: { min: 1, max: 4 }, layout: 'split' },
  { id: 'bullet-hell', name: 'Bullet Hell', players: { min: 1, max: 4 }, layout: 'split' },
  { id: 'rhythm', name: 'Rhythm', players: { min: 1, max: 4 }, layout: 'split' },
  { id: 'racing-3d', name: '3D Racing', players: { min: 1, max: 8 }, layout: 'racing' },
  { id: 'soccer', name: 'Soccer', players: { min: 2, max: 8 }, layout: 'split' },
  { id: 'basketball', name: 'Basketball', players: { min: 2, max: 4 }, layout: 'split' },
  { id: 'tennis', name: 'Tennis', players: { min: 2, max: 4 }, layout: 'split' },
  { id: 'golf', name: 'Golf', players: { min: 1, max: 4 }, layout: 'single' },
  { id: 'bowling', name: 'Bowling', players: { min: 1, max: 4 }, layout: 'split' },
  { id: 'billiards', name: 'Billiards', players: { min: 2, max: 4 }, layout: 'single' },
  { id: 'skateboard', name: 'Skateboard', players: { min: 1, max: 4 }, layout: 'split' },
  { id: 'bmx', name: 'BMX', players: { min: 1, max: 8 }, layout: 'split' }
];

const gameNames = {
  racing: ['Formula 1 Pro', 'Rally Championship', 'Drag Racing', 'NASCAR Legends', 'Drift Kings', 'Off-Road Warriors', 'Monster Truck Mania', 'MotoGP Racer', 'Boat Racing Pro', 'Space Velocity'],
  platformer: ['Super Jump Adventure', 'Sky Runner', 'Ice Climber', 'Desert Runner', 'Forest Quest', 'Cave Explorer', 'City Parkour', 'Beach Dash', 'Mountain Climb', 'Space Platformer'],
  fighting: ['Street Combat', 'Mortal Arena', 'Tekken Strike', 'Boxing Champion', 'Karate Master', 'Wrestling Showdown', 'Sword Fighter', 'Ninja Battle', 'Samurai Duel', 'Dragon Warrior'],
  puzzle: ['Block Breaker', 'Sudoku Master', 'Jigsaw Puzzle', 'Word Search', 'Match 3 Magic', 'Brain Teaser', 'Memory Match', 'Crossword Quest', 'Number Puzzle', 'Tile Connect'],
  shooter: ['Space Invaders', 'Galactic Wars', 'Zombie Apocalypse', 'Alien Invasion', 'Sniper Elite', 'Machine Gunner', 'Bunker Defense', 'Tactical Force', 'Quick Shot', 'Target Practice'],
  rpg: ['Dragon Quest', 'Hero Chronicles', 'Dungeon Master', 'Mythic Realm', 'Legend of Light', 'Dark Shadows', 'Kingdom Quest', 'Hero\'s Journey', 'Epic Adventure', 'Mystic Quest'],
  strategy: ['Chess Grandmaster', 'Checkers Pro', 'Risk World', ' Civilization', 'Age of Kings', 'Tactical War', 'Empire Builder', 'Defense Commander', 'Strategy Zone', 'Battle Tactics'],
  sports: ['Soccer Stars', 'Basketball Pro', 'Tennis Open', 'Golf Master', 'Baseball League', 'Football Kick', 'Volleyball Beach', 'Hockey Arena', 'Cricket World', 'Boxing Match'],
  arcade: ['Space Shooter', 'Snake Classic', 'Pac-Man Maze', 'Asteroids Space', 'Breakout HD', 'Pinball Magic', 'Bubble Bobble', 'Donkey Kong', 'Galaga Star', 'Tetris Blitz'],
  simulation: ['City Builder', 'Farm Tycoon', 'Airport Manager', 'Hospital Sim', 'Restaurant Sim', 'Supermarket Sim', 'Factory Tycoon', 'Theme Park Sim', 'Pet Shop Sim', 'Car Dealership'],
  music: ['Rhythm Star', 'Dance Fever', 'Beat Maker', 'Music Hero', 'Song Master', 'Dance Party', 'Beat Rush', 'Melody Quest', 'Tune Wave', 'Sound Studio'],
  adventure: ['Treasure Hunter', 'Island Explorer', 'Jungle Safari', 'Desert Quest', 'Mountain Adventure', 'Ocean Explorer', 'Forest Journey', 'Cave Explorer', 'Sky Adventure', 'Time Traveler'],
  runner: ['Endless Run', 'Temple Dash', 'Subway Surfer', 'Parkour Run', 'City Sprint', 'Beach Run', 'Forest Run', 'Desert Dash', 'Mountain Run', 'Space Run'],
  typing: ['Speed Typer', 'Word Racer', 'Type Master', 'Keyboard Hero', 'Speed Writer', 'Word Sprint', 'Type Challenge', 'Key Warrior', 'Typing Pro', 'Fast Fingers'],
  trivia: ['Quiz Master', 'Brain Challenge', 'Knowledge Quest', 'Fact Hunter', 'Quiz Bowl', 'Trivia Pro', 'Smart Match', 'Quiz Arena', 'Knowledge Boost', 'Fact Frenzy'],
  card: ['Poker Pro', 'Blackjack Star', 'Solitaire Suite', 'Card Match', 'Deck Master', 'Bridge Club', 'Hearts Game', 'Spades Pro', 'Gin Rummy', 'War Card'],
  board: ['Backgammon Pro', 'Ludo Legend', 'Snakes Ladders', 'Monopoly Tycoon', 'Scrabble Word', 'Connect 4', 'Othello AI', 'Checkers Challenge', 'Chess Pro', 'Domino Master'],
  casino: ['Slot Machine', 'Roulette Wheel', 'Dice Roller', 'Bingo Bash', 'Keno King', 'Lottery Luck', 'Casino Royale', 'Jackpot Hunter', 'Poker Face', 'Lucky Spin'],
  cooking: ['Chef\'s Kitchen', 'Pizza Master', 'Burger Builder', 'Sushi Chef', 'Cake Designer', 'Pastry Shop', 'Grill Master', 'Baker\'s Delight', 'Cooking Class', 'Recipe Creator'],
  farming: ['Farm Harvest', 'Garden Paradise', 'Animal Farm', 'Crop Master', 'Harvest Season', 'Farm Life', 'Garden Joy', 'Crop Planner', 'Farm Builder', 'Garden Designer'],
  'tower-defense': ['Tower Guard', 'Defense Kingdom', 'Castle Fortress', 'Base Protector', 'Invasion Stop', 'Tower Wars', 'Defense Elite', 'Kingdom Shield', 'Fortress Guard', 'Battle Defense'],
  idle: ['Clicker Empire', 'Idle Tycoon', 'Money Maker', 'Click Master', 'Upgrade Pro', 'Idle Empire', 'Click Billionaire', 'Money Rush', 'Click Hero', 'Idle Champion'],
  'io-games': ['Agar.io Clone', 'Slither Space', 'Diep Style', 'Splatoon Fun', 'Minecraft 2D', 'Base IO', 'Battle IO', 'Arena IO', 'Space IO', 'Dragon IO'],
  physics: ['Physics Lab', 'Ball Bounce', 'Ragdoll Fun', 'Pendulum Wave', 'Collision Pro', 'Gravity Sim', 'Momentum Lab', 'Energy Transfer', 'Force Field', 'Motion Study'],
  'racing-2d': ['2D Racer', 'Pixel Racing', 'Retro Racer', 'Side Scroll Race', 'Cart Racer', 'Mini Racers', 'Dash Racer', 'Turbo 2D', 'Speed Lane', 'Track Racer'],
  'battle-royale': ['Last Survivor', 'Death Match', 'Arena Combat', 'Royal Battle', 'Last Standing', 'Kill Zone', 'Victory Fight', 'Final Showdown', 'Battle Ground', 'War Royale'],
  horror: ['Haunted House', 'Ghost Hunter', 'Nightmare Realm', 'Dark Manor', 'Evil Spirit', 'Zombie Land', 'Fear Factory', 'Creepy Crawl', 'Spooky Mansion', 'Terrifying Tales'],
  'sci-fi': ['Space Station', 'Alien World', 'Robot Wars', 'Future Wars', 'Galaxy Quest', 'Star Explorer', 'Cyber Future', 'Nova Star', 'Cosmic Battle', 'Space Odyssey'],
  fantasy: ['Magic Realm', 'Wizard Academy', 'Fairy Tales', 'Mythic World', 'Dragon Land', 'Enchanted Forest', 'Magic Quest', 'Hero Legend', 'Fantasy Quest', 'Mystic Realm'],
  cyberpunk: ['Neon City', 'Tech Wars', 'Digital Dreams', 'Future Shock', 'Cyber Chase', 'Neon Nights', 'Tech Revolution', 'Digital Dawn', 'Cyber Strike', 'Neon Run'],
  steampunk: ['Steam World', 'Clockwork City', 'Gear Works', 'Steam Engine', 'Victorian Era', 'Brass Adventure', 'Steam Quest', 'Gear Runner', 'Clock Tower', 'Steam Runner'],
  zombie: ['Zombie Survival', 'Dead Zone', 'Infection Out', 'Zombie City', 'Apocalypse Now', 'Dead World', 'Zombie Attack', 'Survivor Zone', 'Undead Rising', 'Zombie Rush'],
  ninja: ['Ninja Scroll', 'Shadow Strike', 'Stealth Master', 'Ninja Gaiden', 'Silent Blade', 'Path of Ninja', 'Ninja School', 'Shadow Quest', 'Dojo Master', 'Ninja Runner'],
  pirate: ['High Seas', 'Treasure Map', 'Pirate Cove', 'Sea Raider', 'Ship Battle', 'Treasure Hunt', 'Ocean Pirate', 'Caribbean Quest', 'Naval War', 'Pirate Kingdom'],
  western: ['Wild West', 'Cowboy Life', 'Showdown', 'Saloon Tales', 'Gold Rush', 'Frontier Story', 'Sheriff Duty', 'Wanted Dead', 'Stagecoach Run', 'Western Quest'],
  samurai: ['Way of Sword', 'Blade Honor', 'Ronin Tale', 'Samurai Spirit', 'Katana Master', 'Dojo Legend', 'Path of Warrior', 'Honor Bound', 'Sword Quest', 'Bushido Way'],
  dungeon: ['Dungeon Delve', 'Cavern Crawl', 'Maze Runner', 'Underworld', 'Dark Depths', 'Catacombs', 'Tomb Raider', 'Labyrinth', 'Cave Quest', 'Depths of Doom'],
  roguelike: ['Rogue Ascend', 'Dungeon Crawl', 'Random Realm', 'Permadeath', 'Procedural Quest', 'Endless Dungeon', 'Rogue Legacy', 'Broguelike', 'Roguelike Pro', 'Dungeon Loop'],
  metroidvania: ['Metroid Style', 'vania', 'Castlevania 2D', 'Gates of Hell', 'Dark Metroid', 'vania Quest', 'Blood Moon', 'Castle Crawl', 'vania Runner', 'Gothic Adventure'],
  'bullet-hell': ['Bullet Storm', 'Pattern Chaos', 'Dodge Master', 'Bullet Rain', 'Hell Dodge', 'Pattern Master', 'Bullet Blitz', 'Dodge Quest', 'Pattern Runner', 'Hell Rush'],
  rhythm: ['Beat Dance', 'Rhythm Rush', 'Dance Flow', 'Beat Drop', 'Rhythm Hero', 'Dance Machine', 'Beat Wave', 'Rhythm Party', 'Dance Craze', 'Beat Storm'],
  'racing-3d': ['3D Racer', 'Turbo Drive', 'Speed Racer', 'Racing Pro', '3D Rush', 'Track Legend', 'Velocity 3D', 'Racing Extreme', '3D Dash', 'Speed Demons'],
  soccer: ['Penalty Kick', 'Free Kick Pro', 'Soccer Stars', 'World Cup', 'League Match', 'Championship', 'Goal Rush', 'Soccer Mania', 'Kickoff Pro', 'Footy Fun'],
  basketball: [' Dunk Contest', 'Slam Dunk', 'Hoops Pro', 'Basket Kings', '3 Point Shoot', 'Court Legend', 'Ball Master', 'Hoops Stars', 'Basket Pro', 'Dunk Master'],
  tennis: ['Serve Pro', 'Tennis Ace', 'Wimbledon', 'Court Hero', 'Match Point', 'Rally Master', 'Tennis Pro', 'Swing Star', 'Court King', 'Rally Pro'],
  golf: ['Golf Pro', 'Putt Master', 'Course Legend', 'Fairway Pro', 'Green Giant', 'Golf Guru', 'Hole in One', 'Links Master', 'Golf Quest', 'Putt Quest'],
  bowling: ['Strike Pro', 'Pin Collector', 'Bowling Star', 'Lane Legend', 'Strike Master', 'Spare Hunter', 'Pinsetter', 'Ball Strike', 'Strike King', 'Pin Master'],
  billiards: ['8 Ball Pool', 'Snooker Pro', 'Pool Master', 'Cue Sports', 'Table Legend', 'Shot Maker', 'Pool Shark', 'Cue Master', 'Billiards Pro', 'Pocket Pro'],
  skateboard: ['Skate Park', 'Trick Master', 'Skate Legend', 'Halfpipe Pro', 'Street Skate', 'Skate Challenge', 'Trick Runner', 'Skate Pro', 'Park Legend', 'Skate Star'],
  bmx: ['BMX Racer', 'Trick Bike', 'Bike Master', 'Ramp Runner', 'BMX Pro', 'Bike Tricks', 'Dirt Racer', 'BMX Legend', 'Trick Master', 'Bike Rush']
};

let gameIdCounter = 0;
genres.forEach(genre => {
  const names = gameNames[genre.id] || [];
  for (let i = 0; i < 10; i++) {
    gameIdCounter++;
    gameList.push({
      id: `${genre.id}-${i + 1}`,
      name: names[i] || `${genre.name} Game ${i + 1}`,
      genre: genre.id,
      desc: `${genre.name} - Unique gameplay with various challenges`,
      players: genre.players,
      layout: genre.layout,
      file: `${genre.id}/game-${i + 1}.js`
    });
  }
});

// Export for both browser and server
if (typeof window !== 'undefined') {
  window.gameList = gameList;
}

console.log(`Total games: ${gameList.length}`);