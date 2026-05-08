// RPG Game 3 - Dragon Quest Chronicles
// A complete open-world RPG with quests, inventory, skills, combat, and story

(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        scene: 'world',
        time: 0,
        day: 1,
        
        player: {
            name: 'Hero',
            x: 500,
            y: 400,
            width: 32,
            height: 48,
            direction: 'down',
            
            // Stats
            level: 1,
            exp: 0,
            expToLevel: 100,
            health: 100,
            maxHealth: 100,
            mana: 50,
            maxMana: 50,
            stamina: 100,
            maxStamina: 100,
            
            // Attributes
            strength: 10,
            agility: 10,
            intelligence: 10,
            vitality: 10,
            luck: 5,
            
            // Combat
            attack: 12,
            defense: 5,
            magic: 8,
            speed: 10,
            
            // Resources
            gold: 500,
            
            // Equipment
            equipment: {
                weapon: { name: 'Iron Sword', attack: 5, type: 'sword' },
                armor: { name: 'Leather Vest', defense: 3, type: 'armor' },
                helmet: null,
                boots: null,
                accessory: null
            },
            
            // Inventory
            inventory: [],
            maxInventory: 20,
            
            // Skills
            skills: [
                { name: 'Strike', damage: 1.2, mana: 0, unlockLevel: 1 },
                { name: 'Fireball', damage: 1.8, mana: 15, unlockLevel: 3 },
                { name: 'Heal', damage: -0.5, mana: 20, unlockLevel: 2 },
                { name: 'Power Strike', damage: 2.0, mana: 25, unlockLevel: 5 },
                { name: 'Lightning', damage: 2.2, mana: 30, unlockLevel: 7 }
            ],
            equippedSkill: 0,
            
            // Status
            statusEffects: [],
            buffs: [],
            
            // Quests
            activeQuests: [],
            completedQuests: [],
            
            // Position tracking
            lastX: 500,
            lastY: 400,
            steps: 0,
            
            // Travel
            canTeleport: false,
            mapUnlock: []
        },
        
        // World
        world: {
            name: 'Eldoria',
            regions: [
                { name: 'Starting Village', x: 0, y: 0, width: 20, height: 15 },
                { name: 'Dark Forest', x: 20, y: 0, width: 25, height: 20 },
                { name: 'Mountains of Doom', x: 45, y: 0, width: 20, height: 25 },
                { name: 'Crystal Lake', x: 0, y: 15, width: 15, height: 20 },
                { name: 'Ancient Ruins', x: 15, y: 15, width: 20, height: 20 },
                { name: 'Dragon Lair', x: 45, y: 25, width: 15, height: 15 }
            ],
            currentRegion: 0,
            discovered: []
        },
        
        // NPCs
        NPCs: [],
        
        // Enemies
        enemies: [],
        spawnTimer: 0,
        
        // Combat
        combat: null,
        
        // UI
        ui: {
            showInventory: false,
            showSkills: false,
            showQuests: false,
            showMap: false,
            showEquipment: false,
            showStats: false,
            message: null,
            messageTimer: 0
        },
        
        // Camera
        camera: { x: 0, y: 0 },
        
        // Particles
        particles: [],
        
        // Map tiles
        map: [],
        mapWidth: 80,
        mapHeight: 60,
        tileSize: 32,
        
        // Game Data
        quests: [],
        
        // Audio context placeholder
        audioContext: null
    };

    // Tile types
    const TILES = {
        GRASS: 0,
        WATER: 1,
        FOREST: 2,
        MOUNTAIN: 3,
        BUILDING: 4,
        SAND: 5,
        CAVE: 6,
        PATH: 7,
        FLOWERS: 8,
        ROCKS: 9
    };

    // Colors for tiles
    const TILE_COLORS = {
        0: '#4caf50',
        1: '#2196f3',
        2: '#2e7d32',
        3: '#607d8b',
        4: '#795548',
        5: '#ffeb3b',
        6: '#37474f',
        7: '#9e9e9e',
        8: '#e91e63',
        9: '#455a64'
    };

    // Enemy types
    const ENEMY_TYPES = [
        { name: 'Slime', health: 30, attack: 8, defense: 2, exp: 15, gold: 10, level: 1 },
        { name: 'Goblin', health: 45, attack: 12, defense: 4, exp: 25, gold: 20, level: 2 },
        { name: 'Wolf', health: 40, attack: 15, defense: 3, exp: 30, gold: 25, level: 2 },
        { name: 'Skeleton', health: 50, attack: 14, defense: 6, exp: 40, gold: 30, level: 3 },
        { name: 'Orc Warrior', health: 80, attack: 20, defense: 8, exp: 60, gold: 50, level: 4 },
        { name: 'Troll', health: 120, attack: 25, defense: 10, exp: 100, gold: 80, level: 6 },
        { name: 'Dark Knight', health: 150, attack: 30, defense: 15, exp: 150, gold: 120, level: 8 },
        { name: 'Dragon Whelp', health: 200, attack: 35, defense: 18, exp: 200, gold: 200, level: 10 },
        { name: 'Ancient Dragon', health: 500, attack: 50, defense: 25, exp: 500, gold: 500, level: 15 }
    ];

    // Item types
    const ITEM_TYPES = {
        POTION: 'potion',
        WEAPON: 'weapon',
        ARMOR: 'armor',
        HELMET: 'helmet',
        BOOTS: 'boots',
        ACCESSORY: 'accessory',
        SCROLL: 'scroll',
        KEY: 'key',
        FOOD: 'food',
        MATERIAL: 'material'
    };

    // Items database
    const ITEMS = {
        healthPotion: { name: 'Health Potion', type: ITEM_TYPES.POTION, effect: 50, price: 50 },
        manaPotion: { name: 'Mana Potion', type: ITEM_TYPES.POTION, effect: 30, manaEffect: 30, price: 75 },
        superPotion: { name: 'Super Potion', type: ITEM_TYPES.POTION, effect: 100, price: 150 },
        ironSword: { name: 'Iron Sword', type: ITEM_TYPES.WEAPON, attack: 8, price: 200 },
        steelSword: { name: 'Steel Sword', type: ITEM_TYPES.WEAPON, attack: 15, price: 500 },
        magicWand: { name: 'Magic Wand', type: ITEM_TYPES.WEAPON, attack: 12, magic: 10, price: 350 },
        leatherArmor: { name: 'Leather Armor', type: ITEM_TYPES.ARMOR, defense: 5, price: 100 },
        chainMail: { name: 'Chain Mail', type: ITEM_TYPES.ARMOR, defense: 12, price: 400 },
        plateArmor: { name: 'Plate Armor', type: ITEM_TYPES.ARMOR, defense: 20, price: 800 },
        goldenApple: { name: 'Golden Apple', type: ITEM_TYPES.FOOD, effect: 30, price: 30 },
        ancientKey: { name: 'Ancient Key', type: ITEM_TYPES.KEY, price: 100 },
        dragonScale: { name: 'Dragon Scale', type: ITEM_TYPES.MATERIAL, price: 200 }
    };

    // Quest definitions
    const QUESTS = [
        {
            id: 1,
            name: 'First Steps',
            description: 'Learn the basics of combat and explore the world',
            objectives: [{ type: 'explore', target: 'Dark Forest', count: 1 }],
            reward: { exp: 50, gold: 100 },
            unlockLevel: 1
        },
        {
            id: 2,
            name: 'Goblin Trouble',
            description: 'The village is being threatened by goblins. Clear them out!',
            objectives: [{ type: 'kill', target: 'Goblin', count: 5 }],
            reward: { exp: 100, gold: 150, item: 'ironSword' },
            unlockLevel: 2
        },
        {
            id: 3,
            name: 'Forest Mystery',
            description: 'Investigate strange occurrences in the Dark Forest',
            objectives: [{ type: 'collect', target: 'dragonScale', count: 3 }],
            reward: { exp: 200, gold: 300 },
            unlockLevel: 4
        },
        {
            id: 4,
            name: 'Dragon Slayer',
            description: 'The ancient dragon has awakened. Defeat it!',
            objectives: [{ type: 'kill', target: 'Ancient Dragon', count: 1 }],
            reward: { exp: 1000, gold: 1000, item: 'plateArmor' },
            unlockLevel: 10
        }
    ];

    // NPC definitions
    const NPC_DEFINITIONS = [
        { name: 'Elder Sage', x: 500, y: 350, dialog: 'Welcome, hero! The world needs your help.', shop: ['healthPotion', 'manaPotion'] },
        { name: 'Weapon Smith', x: 550, y: 400, dialog: 'Fine weapons for a fine warrior!', shop: ['ironSword', 'steelSword'] },
        { name: 'Armor Merchant', x: 450, y: 380, dialog: 'Protection is key in battle!', shop: ['leatherArmor', 'chainMail'] },
        { name: 'Healer', x: 520, y: 420, dialog: 'May the light heal your wounds.', shop: ['healthPotion', 'superPotion'] },
        { name: 'Quest Giver', x: 480, y: 360, dialog: 'The kingdom needs brave adventurers!' }
    ];

    // ============= INITIALIZATION =============

    function initGame() {
        // Generate world map
        generateWorldMap();
        
        // Initialize NPCs
        initializeNPCs();
        
        // Initialize player starting items
        game.player.inventory.push({ ...ITEMS.healthPotion, quantity: 3 });
        game.player.inventory.push({ ...ITEMS.manaPotion, quantity: 2 });
        
        // Set player position
        const village = game.world.regions[0];
        game.player.x = village.x * game.tileSize + village.width * game.tileSize / 2;
        game.player.y = village.y * game.tileSize + village.height * game.tileSize / 2;
        
        // Unlock first quest
        unlockQuest(1);
        
        // Add some starting gold
        game.player.gold = 500;
        
        console.log('Game initialized!');
    }

    function generateWorldMap() {
        game.map = [];
        
        for (let y = 0; y < game.mapHeight; y++) {
            game.map[y] = [];
            for (let x = 0; x < game.mapWidth; x++) {
                // Default to grass
                let tile = TILES.GRASS;
                
                // Add variety based on position
                if (y < 15 && x < 20) {
                    // Village area - mostly grass and paths
                    tile = Math.random() < 0.85 ? TILES.GRASS : TILES.PATH;
                } else if (y < 35 && x >= 20 && x < 45) {
                    // Dark Forest
                    tile = Math.random() < 0.4 ? TILES.FOREST : TILES.GRASS;
                    if (Math.random() < 0.1) tile = TILES.ROCKS;
                } else if (y < 25 && x >= 45) {
                    // Mountains
                    tile = Math.random() < 0.5 ? TILES.MOUNTAIN : TILES.GRASS;
                } else if (y >= 15 && y < 35 && x < 15) {
                    // Crystal Lake area
                    if (Math.random() < 0.4) tile = TILES.WATER;
                    else if (Math.random() < 0.3) tile = TILES.SAND;
                } else if (y >= 15 && x >= 15 && x < 35) {
                    // Ancient Ruins
                    if (Math.random() < 0.15) tile = TILES.CAVE;
                    else if (Math.random() < 0.2) tile = TILES.ROCKS;
                } else if (y >= 25 && x >= 45) {
                    // Dragon Lair - dangerous area
                    if (Math.random() < 0.3) tile = TILES.MOUNTAIN;
                    else if (Math.random() < 0.2) tile = TILES.CAVE;
                    else if (Math.random() < 0.1) tile = TILES.LAVA || TILES.ROCKS;
                }
                
                // Add some flowers randomly
                if (tile === TILES.GRASS && Math.random() < 0.05) {
                    tile = TILES.FLOWERS;
                }
                
                game.map[y][x] = tile;
            }
        }
        
        // Add water to lake area more specifically
        for (let y = 20; y < 28; y++) {
            for (let x = 3; x < 12; x++) {
                if (Math.random() < 0.6) {
                    game.map[y][x] = TILES.WATER;
                }
            }
        }
    }

    function initializeNPCs() {
        NPC_DEFINITIONS.forEach(def => {
            game.NPCs.push({
                ...def,
                x: def.x,
                y: def.y,
                shop: def.shop || [],
                interactionCooldown: 0
            });
        });
    }

    function unlockQuest(questId) {
        const quest = QUESTS.find(q => q.id === questId);
        if (quest && !game.player.activeQuests.find(q => q.id === questId)) {
            game.player.activeQuests.push({
                ...quest,
                progress: quest.objectives.map(obj => ({ ...obj, current: 0 }))
            });
            showMessage(`New Quest: ${quest.name}`);
        }
    }

    // ============= INPUT HANDLING =============

    function handleInput(data) {
        if (game.state !== 'playing') return;
        
        // Handle UI toggles
        if (data.keyboard) {
            if (data.keyboard['i'] || data.keyboard['I']) {
                game.ui.showInventory = !game.ui.showInventory;
            }
            if (data.keyboard['k'] || data.keyboard['K']) {
                game.ui.showSkills = !game.ui.showSkills;
            }
            if (data.keyboard['q'] || data.keyboard['Q']) {
                game.ui.showQuests = !game.ui.showQuests;
            }
            if (data.keyboard['m'] || data.keyboard['M']) {
                game.ui.showMap = !game.ui.showMap;
            }
            if (data.keyboard['e'] || data.keyboard['E']) {
                game.ui.showEquipment = !game.ui.showEquipment;
            }
            if (data.keyboard['Tab']) {
                game.ui.showStats = !game.ui.showStats;
            }
            if (data.keyboard['Escape']) {
                closeAllUI();
            }
        }
        
        // Movement
        const speed = 4;
        let moved = false;
        
        if (data.up) {
            game.player.y -= speed;
            game.player.direction = 'up';
            moved = true;
        }
        if (data.down) {
            game.player.y += speed;
            game.player.direction = 'down';
            moved = true;
        }
        if (data.left) {
            game.player.x -= speed;
            game.player.direction = 'left';
            moved = true;
        }
        if (data.right) {
            game.player.x += speed;
            game.player.direction = 'right';
            moved = true;
        }
        
        // Check collision with map
        if (moved) {
            checkMapCollision();
            updatePositionTracking();
        }
        
        // Interaction
        if (data.action) {
            interact();
        }
        
        // Use skill
        if (data.special || data.keyboard && (data.keyboard['1'] || data.keyboard['Space'])) {
            useSkill();
        }
        
        // Use item
        if (data.keyboard && (data.keyboard['2'] || data.keyboard['h'])) {
            useItem(0); // Use first health potion
        }
        
        // Combat attack
        if (data.keyboard && data.keyboard[' ']) {
            attack();
        }
        
        // Keep player in bounds
        game.player.x = Math.max(16, Math.min(game.mapWidth * game.tileSize - 16, game.player.x));
        game.player.y = Math.max(16, Math.min(game.mapHeight * game.tileSize - 16, game.player.y));
    }

    function checkMapCollision() {
        const mapX = Math.floor(game.player.x / game.tileSize);
        const mapY = Math.floor(game.player.y / game.tileSize);
        
        // Check surrounding tiles
        const checkTile = (x, y) => {
            if (x < 0 || x >= game.mapWidth || y < 0 || y >= game.mapHeight) return true;
            const tile = game.map[y][x];
            return tile === TILES.WATER || tile === TILES.MOUNTAIN || tile === TILES.CAVE;
        };
        
        // Simple collision - if center tile is solid, don't move there
        if (checkTile(mapX, mapY)) {
            // Revert position
            game.player.x = game.player.lastX;
            game.player.y = game.player.lastY;
        }
    }

    function updatePositionTracking() {
        const dx = Math.abs(game.player.x - game.player.lastX);
        const dy = Math.abs(game.player.y - game.player.lastY);
        
        if (dx > 5 || dy > 5) {
            game.player.steps++;
            game.player.lastX = game.player.x;
            game.player.lastY = game.player.y;
            
            // Update exploration
            updateExploration();
            
            // Stamina regeneration
            game.player.stamina = Math.min(game.player.maxStamina, game.player.stamina + 0.5);
        }
    }

    function updateExploration() {
        const mapX = Math.floor(game.player.x / game.tileSize);
        const mapY = Math.floor(game.player.y / game.tileSize);
        
        // Discover tiles in area
        for (let dy = -3; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
                const tx = mapX + dx;
                const ty = mapY + dy;
                
                if (tx >= 0 && tx < game.mapWidth && ty >= 0 && ty < game.mapHeight) {
                    const key = `${tx},${ty}`;
                    if (!game.world.discovered.includes(key)) {
                        game.world.discovered.push(key);
                        game.player.exp += 1;
                    }
                }
            }
        }
        
        // Check regions
        game.world.regions.forEach((region, index) => {
            if (game.player.x >= region.x * game.tileSize && 
                game.player.x < (region.x + region.width) * game.tileSize &&
                game.player.y >= region.y * game.tileSize &&
                game.player.y < (region.y + region.height) * game.tileSize) {
                
                if (game.world.currentRegion !== index) {
                    game.world.currentRegion = index;
                    showMessage(`Entered: ${region.name}`);
                    
                    // Check for new quests
                    QUESTS.forEach(quest => {
                        if (quest.unlockLevel <= game.player.level && 
                            !game.player.activeQuests.find(q => q.id === quest.id) &&
                            !game.player.completedQuests.find(q => q.id === quest.id)) {
                            // Check if objective is in this region
                            quest.objectives.forEach(obj => {
                                if (obj.target === region.name) {
                                    unlockQuest(quest.id);
                                }
                            });
                        }
                    });
                }
            }
        });
    }

    function interact() {
        // Check for nearby NPCs
        game.NPCs.forEach(npc => {
            const dx = npc.x - game.player.x;
            const dy = npc.y - game.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 50) {
                interactWithNPC(npc);
            }
        });
        
        // Check for enemies to attack
        game.enemies.forEach(enemy => {
            const dx = enemy.x - game.player.x;
            const dy = enemy.y - game.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 60) {
                startCombat(enemy);
            }
        });
    }

    function interactWithNPC(npc) {
        if (npc.dialog) {
            showMessage(npc.dialog);
        }
        
        if (npc.shop && npc.shop.length > 0) {
            // Open shop
            showShop(npc.shop);
        }
    }

    function useSkill() {
        const skill = game.player.skills[game.player.equippedSkill];
        
        if (!skill) return;
        
        if (game.player.mana < skill.mana) {
            showMessage('Not enough mana!');
            return;
        }
        
        // Find target
        const target = findSkillTarget();
        
        if (target) {
            useSkillOnTarget(skill, target);
        } else {
            showMessage('No valid target!');
        }
    }

    function findSkillTarget() {
        // Prioritize enemies in range
        const range = 150;
        
        let closestEnemy = null;
        let closestDist = Infinity;
        
        game.enemies.forEach(enemy => {
            const dx = enemy.x - game.player.x;
            const dy = enemy.y - game.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < range && dist < closestDist) {
                closestEnemy = enemy;
                closestDist = dist;
            }
        });
        
        return closestEnemy;
    }

    function useSkillOnTarget(skill, target) {
        game.player.mana -= skill.mana;
        
        // Calculate damage
        const baseDamage = game.player.attack * skill.damage;
        const randomFactor = 0.9 + Math.random() * 0.2;
        const damage = Math.floor(baseDamage * randomFactor);
        
        target.health -= damage;
        
        // Visual effect
        createParticles(target.x, target.y, '#ff0000', 10);
        
        showMessage(`${skill.name} deals ${damage} damage!`);
        
        // Check for kill
        if (target.health <= 0) {
            defeatEnemy(target);
        }
    }

    function useItem(itemIndex) {
        const item = game.player.inventory[itemIndex];
        
        if (!item) return;
        
        if (item.type === ITEM_TYPES.POTION) {
            if (item.effect) {
                game.player.health = Math.min(game.player.maxHealth, game.player.health + item.effect);
            }
            if (item.manaEffect) {
                game.player.mana = Math.min(game.player.maxMana, game.player.mana + item.manaEffect);
            }
            
            item.quantity--;
            
            if (item.quantity <= 0) {
                game.player.inventory.splice(itemIndex, 1);
            }
            
            createParticles(game.player.x, game.player.y - 20, '#2ecc71', 8);
            showMessage(`Used ${item.name}!`);
        }
    }

    function attack() {
        // Find closest enemy
        const range = 50;
        let target = null;
        let closestDist = Infinity;
        
        game.enemies.forEach(enemy => {
            const dx = enemy.x - game.player.x;
            const dy = enemy.y - game.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < range && dist < closestDist) {
                target = enemy;
                closestDist = dist;
            }
        });
        
        if (target) {
            const damage = game.player.attack;
            target.health -= damage;
            
            createParticles(target.x, target.y, '#fff', 5);
            
            // Knockback
            const angle = Math.atan2(target.y - game.player.y, target.x - game.player.x);
            target.x += Math.cos(angle) * 20;
            target.y += Math.sin(angle) * 20;
            
            if (target.health <= 0) {
                defeatEnemy(target);
            }
        }
    }

    // ============= COMBAT =============

    function startCombat(enemy) {
        game.combat = {
            active: true,
            enemy: enemy,
            turn: 'player',
            timer: 0
        };
        
        game.scene = 'combat';
        showMessage(`Combat started with ${enemy.name}!`);
    }

    function defeatEnemy(enemy) {
        const expGain = enemy.exp || 10;
        const goldGain = enemy.gold || 5;
        
        game.player.exp += expGain;
        game.player.gold += goldGain;
        
        createParticles(enemy.x, enemy.y, '#ffd700', 20);
        showMessage(`Defeated ${enemy.name}! +${expGain} EXP, +${goldGain} gold`);
        
        // Remove enemy
        game.enemies = game.enemies.filter(e => e !== enemy);
        
        // Update quest progress
        updateQuestProgress('kill', enemy.name);
        
        // Check level up
        if (game.player.exp >= game.player.expToLevel) {
            levelUp();
        }
        
        // Return to world
        if (game.combat) {
            game.combat = null;
            game.scene = 'world';
        }
    }

    function levelUp() {
        game.player.level++;
        game.player.exp -= game.player.expToLevel;
        game.player.expToLevel = Math.floor(game.player.expToLevel * 1.5);
        
        // Increase stats
        game.player.maxHealth += 20;
        game.player.health = game.player.maxHealth;
        game.player.maxMana += 10;
        game.player.mana = game.player.maxMana;
        
        game.player.strength += 2;
        game.player.agility += 2;
        game.player.intelligence += 2;
        game.player.vitality += 2;
        
        // Recalculate derived stats
        recalculateStats();
        
        createParticles(game.player.x, game.player.y, '#ffd700', 30);
        showMessage(`Level Up! Now level ${game.player.level}!`);
        
        // Check for new skills
        game.player.skills.forEach(skill => {
            if (game.player.level >= skill.unlockLevel && !skill.unlocked) {
                skill.unlocked = true;
                showMessage(`New skill unlocked: ${skill.name}!`);
            }
        });
        
        // Check for new quests
        QUESTS.forEach(quest => {
            if (quest.unlockLevel === game.player.level) {
                unlockQuest(quest.id);
            }
        });
    }

    function recalculateStats() {
        // Attack = strength + weapon
        game.player.attack = game.player.strength + 
            (game.player.equipment.weapon ? game.player.equipment.weapon.attack : 0);
        
        // Defense = vitality + armor
        game.player.defense = game.player.vitality + 
            (game.player.equipment.armor ? game.player.equipment.armor.defense : 0);
        
        // Magic = intelligence + magic items
        game.player.magic = game.player.intelligence + 
            (game.player.equipment.weapon && game.player.equipment.weapon.magic ? 
             game.player.equipment.weapon.magic : 0);
    }

    // ============= UPDATE =============

    function update() {
        if (game.state !== 'playing') return;
        
        game.time++;
        
        // Time passage
        if (game.time % 60 === 0) {
            // Every minute, regenerate a bit
            game.player.health = Math.min(game.player.maxHealth, game.player.health + 1);
            game.player.mana = Math.min(game.player.maxMana, game.player.mana + 1);
            
            // Check quest time limits or daily events
        }
        
        if (game.time % 600 === 0) {
            // Every 10 minutes = 1 hour in-game
            game.day++;
        }
        
        // Update UI message timer
        if (game.ui.messageTimer > 0) {
            game.ui.messageTimer--;
            if (game.ui.messageTimer === 0) {
                game.ui.message = null;
            }
        }
        
        // Update NPCs
        game.NPCs.forEach(npc => {
            if (npc.interactionCooldown > 0) {
                npc.interactionCooldown--;
            }
        });
        
        // Enemy spawning
        if (game.scene === 'world') {
            game.spawnTimer++;
            
            const spawnRate = Math.max(30, 180 - game.player.level * 10);
            
            if (game.spawnTimer > spawnRate && game.enemies.length < 10 + game.player.level) {
                spawnEnemy();
                game.spawnTimer = 0;
            }
            
            // Update enemies
            updateEnemies();
        }
        
        // Update particles
        game.particles = game.particles.filter(p => {
            p.x += p.vx || 0;
            p.y += p.vy || 0;
            p.life--;
            return p.life > 0;
        });
        
        // Update camera
        game.camera.x = game.player.x - canvas.width / 2;
        game.camera.y = game.player.y - canvas.height / 2;
        
        // Clamp camera
        game.camera.x = Math.max(0, Math.min(game.mapWidth * game.tileSize - canvas.width, game.camera.x));
        game.camera.y = Math.max(0, Math.min(game.mapHeight * game.tileSize - canvas.height, game.camera.y));
        
        // Check game over
        if (game.player.health <= 0) {
            game.state = 'gameover';
        }
    }

    function spawnEnemy() {
        // Only spawn in appropriate areas based on player level
        let region = game.world.currentRegion;
        
        const enemyTypes = ENEMY_TYPES.filter(e => e.level <= game.player.level + 2);
        
        if (enemyTypes.length === 0) {
            enemyTypes = ENEMY_TYPES;
        }
        
        const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        
        // Spawn around player but not too close
        let x, y;
        do {
            x = game.player.x + (Math.random() - 0.5) * 400;
            y = game.player.y + (Math.random() - 0.5) * 400;
        } while (Math.sqrt(Math.pow(x - game.player.x, 2) + Math.pow(y - game.player.y, 2)) < 200);
        
        // Keep in bounds
        x = Math.max(32, Math.min(game.mapWidth * game.tileSize - 32, x));
        y = Math.max(32, Math.min(game.mapHeight * game.tileSize - 32, y));
        
        // Check if valid spawn location
        const mapX = Math.floor(x / game.tileSize);
        const mapY = Math.floor(y / game.tileSize);
        const tile = game.map[mapY] && game.map[mapY][mapX];
        
        if (tile === TILES.WATER || tile === TILES.MOUNTAIN || tile === TILES.CAVE) {
            return; // Don't spawn in invalid tiles
        }
        
        game.enemies.push({
            name: type.name,
            x: x,
            y: y,
            width: 32,
            height: 40,
            health: type.health + game.player.level * 5,
            maxHealth: type.health + game.player.level * 5,
            attack: type.attack + game.player.level * 2,
            defense: type.defense,
            exp: type.exp,
            gold: type.gold,
            level: type.level,
            speed: 1 + Math.random(),
            state: 'patrol',
            patrolTarget: null,
            attackCooldown: 0
        });
    }

    function updateEnemies() {
        game.enemies.forEach(enemy => {
            // AI behavior
            const dx = game.player.x - enemy.x;
            const dy = game.player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 300) {
                // Player detected - move towards
                if (dist > 40) {
                    enemy.x += (dx / dist) * enemy.speed;
                    enemy.y += (dy / dist) * enemy.speed;
                }
                
                // Attack if close enough
                if (dist < 35 && enemy.attackCooldown <= 0) {
                    const damage = Math.max(1, enemy.attack - game.player.defense / 2);
                    game.player.health -= damage;
                    
                    createParticles(game.player.x, game.player.y, '#e74c3c', 5);
                    
                    enemy.attackCooldown = 60;
                    
                    if (game.player.health <= 0) {
                        game.state = 'gameover';
                    }
                }
            } else {
                // Random patrol
                if (Math.random() < 0.01 || !enemy.patrolTarget) {
                    enemy.patrolTarget = {
                        x: game.player.x + (Math.random() - 0.5) * 300,
                        y: game.player.y + (Math.random() - 0.5) * 300
                    };
                }
                
                if (enemy.patrolTarget) {
                    const pdx = enemy.patrolTarget.x - enemy.x;
                    const pdy = enemy.patrolTarget.y - enemy.y;
                    const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
                    
                    if (pdist > 10) {
                        enemy.x += (pdx / pdist) * enemy.speed * 0.5;
                        enemy.y += (pdy / pdist) * enemy.speed * 0.5;
                    } else {
                        enemy.patrolTarget = null;
                    }
                }
            }
            
            // Keep in bounds
            enemy.x = Math.max(16, Math.min(game.mapWidth * game.tileSize - 16, enemy.x));
            enemy.y = Math.max(16, Math.min(game.mapHeight * game.tileSize - 16, enemy.y));
            
            // Cooldown
            if (enemy.attackCooldown > 0) {
                enemy.attackCooldown--;
            }
        });
    }

    function updateQuestProgress(type, target) {
        game.player.activeQuests.forEach(quest => {
            quest.progress.forEach(obj => {
                if (obj.type === type && obj.target === target) {
                    obj.current++;
                }
            });
            
            // Check completion
            const completed = quest.objectives.every((obj, i) => 
                quest.progress[i].current >= obj.count
            );
            
            if (completed) {
                completeQuest(quest);
            }
        });
    }

    function completeQuest(quest) {
        showMessage(`Quest Complete: ${quest.name}!`);
        
        // Give rewards
        if (quest.reward.exp) game.player.exp += quest.reward.exp;
        if (quest.reward.gold) game.player.gold += quest.reward.gold;
        
        if (quest.reward.item) {
            const item = { ...ITEMS[quest.reward.item], quantity: 1 };
            game.player.inventory.push(item);
            showMessage(`Received: ${item.name}!`);
        }
        
        // Mark complete
        game.player.completedQuests.push({ ...quest, completedAt: game.day });
        game.player.activeQuests = game.player.activeQuests.filter(q => q.id !== quest.id);
        
        // Check level up from quest reward
        if (game.player.exp >= game.player.expToLevel) {
            levelUp();
        }
    }

    // ============= RENDERING =============

    function draw() {
        // Clear screen
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (game.scene === 'world') {
            drawWorld();
        } else if (game.scene === 'combat') {
            drawCombat();
        }
        
        // Draw UI
        drawUI();
        
        // Draw particles
        game.particles.forEach(p => {
            ctx.globalAlpha = p.life / 30;
            ctx.fillStyle = p.color || '#fff';
            ctx.beginPath();
            ctx.arc(p.x - game.camera.x, p.y - game.camera.y, p.size || 3, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        // Draw message
        if (game.ui.message) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(canvas.width / 2 - 200, 50, 400, 50);
            
            ctx.fillStyle = '#fff';
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(game.ui.message, canvas.width / 2, 82);
        }
        
        // Game over screen
        if (game.state === 'gameover') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#e74c3c';
            ctx.font = 'bold 60px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);
            
            ctx.fillStyle = '#fff';
            ctx.font = '30px Arial';
            ctx.fillText(`You reached level ${game.player.level}`, canvas.width / 2, canvas.height / 2 + 20);
            ctx.fillText(`Total Gold: ${game.player.gold}`, canvas.width / 2, canvas.height / 2 + 55);
            ctx.fillText(`Steps taken: ${game.player.steps}`, canvas.width / 2, canvas.height / 2 + 90);
        }
    }

    function drawWorld() {
        // Draw map tiles
        const startX = Math.floor(game.camera.x / game.tileSize);
        const startY = Math.floor(game.camera.y / game.tileSize);
        const endX = Math.ceil((game.camera.x + canvas.width) / game.tileSize);
        const endY = Math.ceil((game.camera.y + canvas.height) / game.tileSize);
        
        for (let y = Math.max(0, startY); y < Math.min(game.mapHeight, endY); y++) {
            for (let x = Math.max(0, startX); x < Math.min(game.mapWidth, endX); x++) {
                const tile = game.map[y][x];
                const screenX = x * game.tileSize - game.camera.x;
                const screenY = y * game.tileSize - game.camera.y;
                
                ctx.fillStyle = TILE_COLORS[tile] || '#000';
                ctx.fillRect(screenX, screenY, game.tileSize, game.tileSize);
                
                // Add detail based on tile type
                if (tile === TILES.FOREST) {
                    ctx.fillStyle = '#1b5e20';
                    ctx.beginPath();
                    ctx.arc(screenX + 16, screenY + 16, 10, 0, Math.PI * 2);
                    ctx.fill();
                } else if (tile === TILES.ROCKS) {
                    ctx.fillStyle = '#37474f';
                    ctx.fillRect(screenX + 8, screenY + 8, 16, 12);
                } else if (tile === TILES.FLOWERS) {
                    ctx.fillStyle = '#e91e63';
                    ctx.beginPath();
                    ctx.arc(screenX + 16, screenY + 16, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        
        // Draw NPCs
        game.NPCs.forEach(npc => {
            const screenX = npc.x - game.camera.x;
            const screenY = npc.y - game.camera.y;
            
            if (screenX < -20 || screenX > canvas.width + 20) return;
            
            ctx.fillStyle = '#9c27b0';
            ctx.beginPath();
            ctx.arc(screenX, screenY - 10, 12, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('?', screenX, screenY - 15);
        });
        
        // Draw enemies
        game.enemies.forEach(enemy => {
            const screenX = enemy.x - game.camera.x;
            const screenY = enemy.y - game.camera.y;
            
            if (screenX < -40 || screenX > canvas.width + 40) return;
            
            ctx.fillStyle = '#c0392b';
            ctx.fillRect(screenX - 16, screenY - 20, 32, 40);
            
            // Eyes
            ctx.fillStyle = '#ff0';
            ctx.fillRect(screenX - 8, screenY - 12, 6, 6);
            ctx.fillRect(screenX + 2, screenY - 12, 6, 6);
            
            // Health bar
            const healthPercent = enemy.health / enemy.maxHealth;
            ctx.fillStyle = '#333';
            ctx.fillRect(screenX - 16, screenY - 28, 32, 5);
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(-15, -27, 30 * healthPercent, 3);
        });
        
        // Draw player
        drawPlayer();
    }

    function drawPlayer() {
        const screenX = game.player.x - game.camera.x;
        const screenY = game.player.y - game.camera.y;
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(screenX, screenY + 20, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Body
        ctx.fillStyle = '#3498db';
        ctx.fillRect(screenX - 12, screenY - 20, 24, 40);
        
        // Head
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(screenX, screenY - 28, 14, 0, Math.PI * 2);
        ctx.fill();
        
        // Direction indicator
        ctx.fillStyle = '#2980b9';
        const dirOffset = {
            'up': { x: 0, y: -35 },
            'down': { x: 0, y: -20 },
            'left': { x: -10, y: -28 },
            'right': { x: 10, y: -28 }
        };
        
        const offset = dirOffset[game.player.direction] || dirOffset.down;
        ctx.fillRect(screenX + offset.x - 3, offset.y, 6, 4);
        
        // Equipment indicator
        if (game.player.equipment.weapon) {
            ctx.fillStyle = '#95a5a6';
            if (game.player.direction === 'right') {
                ctx.fillRect(screenX + 10, screenY - 5, 15, 4);
            }
        }
    }

    function drawCombat() {
        // Simple combat background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw enemy
        if (game.combat && game.combat.enemy) {
            const enemy = game.combat.enemy;
            
            ctx.fillStyle = '#c0392b';
            ctx.fillRect(enemy.x - 30, enemy.y - 40, 60, 80);
            
            ctx.fillStyle = '#ff0';
            ctx.fillRect(enemy.x - 12, enemy.y - 25, 8, 8);
            ctx.fillRect(enemy.x + 4, enemy.y - 25, 8, 8);
            
            // Health bar
            const healthPercent = enemy.health / enemy.maxHealth;
            ctx.fillStyle = '#333';
            ctx.fillRect(enemy.x - 30, enemy.y - 55, 60, 8);
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(-29, -54, 58 * healthPercent, 6);
        }
        
        // Draw player
        drawPlayer();
    }

    function drawUI() {
        // Stats bar at top
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, 60);
        
        // Health bar
        ctx.fillStyle = '#333';
        ctx.fillRect(20, 15, 200, 15);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(20, 15, 200 * (game.player.health / game.player.maxHealth), 15);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`HP: ${Math.floor(game.player.health)}/${game.player.maxHealth}`, 25, 27);
        
        // Mana bar
        ctx.fillStyle = '#333';
        ctx.fillRect(20, 35, 150, 10);
        ctx.fillStyle = '#3498db';
        ctx.fillRect(20, 35, 150 * (game.player.mana / game.player.maxMana), 10);
        ctx.fillStyle = '#fff';
        ctx.fillText(`MP: ${Math.floor(game.player.mana)}/${game.player.maxMana}`, 25, 43);
        
        // Level and gold
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`Lv.${game.player.level}`, 250, 25);
        
        ctx.fillStyle = '#ffd700';
        ctx.fillText(`Gold: ${game.player.gold}`, 350, 25);
        
        // Stamina
        ctx.fillStyle = '#2ecc71';
        ctx.fillText(`Stamina: ${Math.floor(game.player.stamina)}`, 480, 25);
        
        // Day/Time
        ctx.fillStyle = '#fff';
        ctx.fillText(`Day ${game.day}`, 600, 25);
        
        // Mini health bar for enemies if nearby
        if (game.enemies.length > 0) {
            const nearestEnemy = game.enemies.reduce((nearest, enemy) => {
                const dist = Math.sqrt(Math.pow(enemy.x - game.player.x, 2) + Math.pow(enemy.y - game.player.y, 2));
                if (!nearest || dist < nearest.dist) return { enemy, dist };
                return nearest;
            }, null);
            
            if (nearestEnemy && nearestEnemy.dist < 200) {
                ctx.fillStyle = 'rgba(231, 76, 60, 0.8)';
                ctx.font = '12px Arial';
                ctx.fillText(`Enemy: ${Math.floor(nearestEnemy.enemy.health)} HP`, 600, 45);
            }
        }
        
        // Inventory UI
        if (game.ui.showInventory) {
            drawInventoryUI();
        }
        
        // Skills UI
        if (game.ui.showSkills) {
            drawSkillsUI();
        }
        
        // Quests UI
        if (game.ui.showQuests) {
            drawQuestsUI();
        }
        
        // Map UI
        if (game.ui.showMap) {
            drawMapUI();
        }
        
        // Equipment UI
        if (game.ui.showEquipment) {
            drawEquipmentUI();
        }
        
        // Stats UI
        if (game.ui.showStats) {
            drawStatsUI();
        }
    }

    function drawInventoryUI() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(100, 80, 400, 400);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Inventory', 120, 110);
        
        ctx.font = '16px Arial';
        
        game.player.inventory.forEach((item, index) => {
            const row = Math.floor(index / 4);
            const col = index % 4;
            
            ctx.fillStyle = '#444';
            ctx.fillRect(120 + col * 90, 130 + row * 50, 80, 40);
            
            ctx.fillStyle = item.type === ITEM_TYPES.POTION ? '#e74c3c' : 
                          item.type === ITEM_TYPES.WEAPON ? '#95a5a6' :
                          item.type === ITEM_TYPES.ARMOR ? '#3498db' : '#fff';
            ctx.fillText(item.name.substring(0, 10), 125 + col * 90, 155 + row * 50);
            
            ctx.fillStyle = '#aaa';
            ctx.fillText(`x${item.quantity}`, 165 + col * 90, 155 + row * 50);
        });
        
        ctx.fillStyle = '#aaa';
        ctx.font = '14px Arial';
        ctx.fillText('Press 2 to use Health Potion | ESC to close', 120, 460);
    }

    function drawSkillsUI() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(150, 100, 300, 350);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Skills', 170, 130);
        
        ctx.font = '16px Arial';
        
        game.player.skills.forEach((skill, index) => {
            const unlocked = game.player.level >= skill.unlockLevel;
            
            ctx.fillStyle = unlocked ? '#fff' : '#666';
            ctx.fillText(`${index + 1}. ${skill.name}`, 170, 160 + index * 30);
            
            if (unlocked) {
                ctx.fillStyle = skill.mana <= game.player.mana ? '#2ecc71' : '#e74c3c';
                ctx.fillText(`${skill.mana} MP`, 300, 160 + index * 30);
            } else {
                ctx.fillStyle = '#e74c3c';
                ctx.fillText(`Lvl ${skill.unlockLevel}`, 300, 160 + index * 30);
            }
        });
    }

    function drawQuestsUI() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(100, 80, 400, 400);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Quests', 120, 110);
        
        let y = 140;
        
        game.player.activeQuests.forEach(quest => {
            ctx.fillStyle = '#f1c40f';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(quest.name, 120, y);
            
            ctx.fillStyle = '#aaa';
            ctx.font = '14px Arial';
            ctx.fillText(quest.description, 120, y + 20);
            
            quest.progress.forEach((prog, i) => {
                const percent = Math.min(1, prog.current / prog.count);
                ctx.fillStyle = '#333';
                ctx.fillRect(120, y + 35 + i * 15, 200, 10);
                ctx.fillStyle = '#2ecc71';
                ctx.fillRect(121, y + 36 + i * 15, 198 * percent, 8);
                ctx.fillText(`${prog.current}/${prog.count}`, 330, y + 43 + i * 15);
            });
            
            y += 70;
        });
        
        if (game.player.activeQuests.length === 0) {
            ctx.fillStyle = '#666';
            ctx.fillText('No active quests', 120, y);
        }
    }

    function drawMapUI() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(50, 50, 700, 500);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('World Map - ' + game.world.name, 400, 80);
        
        // Draw simplified world
        const scale = 0.8;
        
        game.world.regions.forEach((region, index) => {
            const x = 100 + region.x * scale;
            const y = 100 + region.y * scale;
            const w = region.width * scale;
            const h = region.height * scale;
            
            ctx.fillStyle = index === game.world.currentRegion ? '#e74c3c' : '#444';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            
            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);
            
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(region.name, x + w / 2, y + h / 2);
        });
        
        // Draw player position
        const playerMapX = 100 + (game.player.x / game.tileSize) * scale;
        const playerMapY = 100 + (game.player.y / game.tileSize) * scale;
        
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(playerMapX, playerMapY, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawEquipmentUI() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(150, 100, 300, 350);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Equipment', 170, 130);
        
        const slots = ['weapon', 'armor', 'helmet', 'boots', 'accessory'];
        
        slots.forEach((slot, index) => {
            const item = game.player.equipment[slot];
            
            ctx.fillStyle = '#444';
            ctx.fillRect(170, 160 + index * 40, 200, 30);
            
            ctx.fillStyle = '#aaa';
            ctx.font = '14px Arial';
            ctx.fillText(slot.charAt(0).toUpperCase() + slot.slice(1) + ':', 175, 182 + index * 40);
            
            if (item) {
                ctx.fillStyle = '#f1c40f';
                ctx.fillText(item.name, 270, 182 + index * 40);
            } else {
                ctx.fillStyle = '#666';
                ctx.fillText('Empty', 270, 182 + index * 40);
            }
        });
    }

    function drawStatsUI() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(100, 80, 400, 450);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Character Stats', 120, 110);
        
        const stats = [
            { name: 'Level', value: game.player.level },
            { name: 'Experience', value: `${game.player.exp}/${game.player.expToLevel}` },
            { name: 'Health', value: `${game.player.health}/${game.player.maxHealth}` },
            { name: 'Mana', value: `${game.player.mana}/${game.player.maxMana}` },
            { name: 'Strength', value: game.player.strength },
            { name: 'Agility', value: game.player.agility },
            { name: 'Intelligence', value: game.player.intelligence },
            { name: 'Vitality', value: game.player.vitality },
            { name: 'Attack', value: game.player.attack },
            { name: 'Defense', value: game.player.defense },
            { name: 'Magic', value: game.player.magic },
            { name: 'Speed', value: game.player.speed },
            { name: 'Total Steps', value: game.player.steps },
            { name: 'Days Played', value: game.day }
        ];
        
        stats.forEach((stat, index) => {
            ctx.fillStyle = '#aaa';
            ctx.font = '16px Arial';
            ctx.fillText(stat.name + ':', 130, 145 + index * 25);
            
            ctx.fillStyle = '#fff';
            ctx.fillText(String(stat.value), 280, 145 + index * 25);
        });
    }

    // ============= UTILITIES =============

    function showMessage(message) {
        game.ui.message = message;
        game.ui.messageTimer = 180; // 3 seconds at 60fps
    }

    function showShop(shopItems) {
        showMessage('Shop available! Press E to interact.');
    }

    function closeAllUI() {
        game.ui.showInventory = false;
        game.ui.showSkills = false;
        game.ui.showQuests = false;
        game.ui.showMap = false;
        game.ui.showEquipment = false;
        game.ui.showStats = false;
    }

    function createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            game.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 2,
                color: color,
                size: 2 + Math.random() * 4,
                life: 20 + Math.random() * 20
            });
        }
    }

    // ============= GAME LOOP =============

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    // Initialize and start
    initGame();
    
    // Expose handleInput to global scope for input handling
    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    // Start the game
    gameLoop();
})();