// Monopoly Game 2 - City Builder
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'playing',
        players: [
            { name: 'You', money: 1500, position: 0, properties: [], color: '#3498db', jail: 0, getOutOfJail: 0 },
            { name: 'AI 1', money: 1500, position: 0, properties: [], color: '#e74c3c', jail: 0, getOutOfJail: 0 },
            { name: 'AI 2', money: 1500, position: 0, properties: [], color: '#2ecc71', jail: 0, getOutOfJail: 0 },
            { name: 'AI 3', money: 1500, position: 0, properties: [], color: '#f39c12', jail: 0, getOutOfJail: 0 }
        ],
        currentPlayer: 0,
        dice: [0, 0],
        turnInProgress: false,
        properties: [],
        chanceCards: [],
        communityChest: [],
        houseCount: 32,
        hotelCount: 12,
        auction: null,
        gameTime: 0
    };

    const BOARD_SPACES = [
        { type: 'corner', name: 'GO' },
        { type: 'property', name: 'Mediterranean Ave', price: 60, rent: 2, color: '#8b4513' },
        { type: 'chance', name: 'Community Chest' },
        { type: 'property', name: 'Baltic Ave', price: 60, rent: 4, color: '#8b4513' },
        { type: 'tax', name: 'Income Tax', price: 200 },
        { type: 'railroad', name: 'Reading Railroad', price: 200, rent: 25 },
        { type: 'property', name: 'Oriental Ave', price: 100, rent: 6, color: '#87ceeb' },
        { type: 'chance', name: 'Chance' },
        { type: 'property', name: 'Vermont Ave', price: 100, rent: 6, color: '#87ceeb' },
        { type: 'property', name: 'Connecticut Ave', price: 120, rent: 8, color: '#87ceeb' },
        { type: 'corner', name: 'Jail' },
        { type: 'property', name: 'St. Charles Place', price: 140, rent: 10, color: '#ff00ff' },
        { type: 'utility', name: 'Electric Company', price: 150 },
        { type: 'property', name: 'States Ave', price: 140, rent: 10, color: '#ff00ff' },
        { type: 'property', name: 'Virginia Ave', price: 160, rent: 12, color: '#ff00ff' },
        { type: 'railroad', name: 'Pennsylvania Railroad', price: 200, rent: 25 },
        { type: 'property', name: 'St. James Place', price: 180, rent: 14, color: '#ffa500' },
        { type: 'chance', name: 'Community Chest' },
        { type: 'property', name: 'Tennessee Ave', price: 180, rent: 14, color: '#ffa500' },
        { type: 'property', name: 'New York Ave', price: 200, rent: 16, color: '#ffa500' },
        { type: 'corner', name: 'Free Parking' },
        { type: 'property', name: 'Kentucky Ave', price: 220, rent: 18, color: '#ff0000' },
        { type: 'chance', name: 'Chance' },
        { type: 'property', name: 'Indiana Ave', price: 220, rent: 18, color: '#ff0000' },
        { type: 'property', name: 'Illinois Ave', price: 240, rent: 20, color: '#ff0000' },
        { type: 'railroad', name: 'B&O Railroad', price: 200, rent: 25 },
        { type: 'property', name: 'Atlantic Ave', price: 260, rent: 22, color: '#ffff00' },
        { type: 'property', name: 'Ventnor Ave', price: 260, rent: 22, color: '#ffff00' },
        { type: 'utility', name: 'Water Works', price: 150 },
        { type: 'property', name: 'Marvin Gardens', price: 280, rent: 24, color: '#ffff00' },
        { type: 'corner', name: 'Go to Jail' },
        { type: 'property', name: 'Pacific Ave', price: 300, rent: 26, color: '#00ff00' },
        { type: 'property', name: 'North Carolina Ave', price: 300, rent: 26, color: '#00ff00' },
        { type: 'chance', name: 'Community Chest' },
        { type: 'property', name: 'Pennsylvania Ave', price: 320, rent: 28, color: '#00ff00' },
        { type: 'railroad', name: 'Short Line', price: 200, rent: 25 },
        { type: 'chance', name: 'Chance' },
        { type: 'property', name: 'Park Place', price: 350, rent: 35, color: '#0000ff' },
        { type: 'tax', name: 'Luxury Tax', price: 100 },
        { type: 'property', name: 'Boardwalk', price: 400, rent: 50, color: '#0000ff' }
    ];

    function handleInput(data) {
        if (game.state !== 'playing' || game.turnInProgress) return;
        
        if (data.action) {
            rollDice();
        }
        
        if (data.tap && game.auction) {
            const p = game.players[game.currentPlayer];
            if (p.money >= game.auction.currentBid + 50) {
                game.auction.currentBid += 50;
            } else {
                endAuction();
            }
        }
    }

    function rollDice() {
        game.turnInProgress = true;
        
        game.dice[0] = Math.floor(Math.random() * 6) + 1;
        game.dice[1] = Math.floor(Math.random() * 6) + 1;
        
        const player = game.players[game.currentPlayer];
        
        if (player.jail > 0) {
            if (player.jail === 3 || (Math.random() < 1/6)) {
                player.jail = 0;
                player.position = (player.position + game.dice[0] + game.dice[1]) % 40;
            } else {
                player.jail++;
            }
        } else {
            player.position = (player.position + game.dice[0] + game.dice[1]) % 40;
        }
        
        const space = BOARD_SPACES[player.position];
        
        if (space.type === 'property') {
            if (!space.owner && player.money >= space.price) {
                player.money -= space.price;
                space.owner = game.currentPlayer;
                player.properties.push(player.position);
            } else if (space.owner !== undefined && space.owner !== game.currentPlayer) {
                const owner = game.players[space.owner];
                const rent = calculateRent(space, player);
                player.money -= rent;
                owner.money += rent;
            }
        }
        
        if (space.name === 'Go to Jail') {
            player.jail = 1;
            player.position = 10;
        }
        
        if (space.name === 'Chance' || space.name === 'Community Chest') {
            const card = Math.random() < 0.5 ? 50 : -50;
            player.money += card;
        }
        
        setTimeout(() => {
            game.currentPlayer = (game.currentPlayer + 1) % game.players.length;
            game.turnInProgress = false;
            
            if (game.players[game.currentPlayer].money < 0) {
                game.players[game.currentPlayer].money = 0;
                game.players[game.currentPlayer].bankrupt = true;
                checkWinCondition();
            }
        }, 1000);
    }

    function calculateRent(space, player) {
        if (!space.owner) return 0;
        if (space.type === 'railroad') return 25 * Math.pow(2, space.railroads || 0);
        if (space.type === 'utility') return 4 * (game.dice[0] + game.dice[1]);
        
        let rent = space.rent;
        
        if (space.houses > 0) {
            rent = [space.rent, space.rent * 2, space.rent * 5, space.rent * 10, space.rent * 20][space.houses];
        }
        
        return rent;
    }

    function endAuction() {
        game.auction = null;
        game.currentPlayer = (game.currentPlayer + 1) % game.players.length;
        game.turnInProgress = false;
    }

    function checkWinCondition() {
        const active = game.players.filter(p => p.money > 0);
        if (active.length === 1) {
            game.state = 'win';
        }
    }

    function update() {
        if (game.state !== 'playing') return;
        
        game.gameTime += 1/60;
        
        if (game.currentPlayer > 0 && !game.turnInProgress) {
            setTimeout(() => {
                if (!game.turnInProgress) rollDice();
            }, 500);
        }
    }

    function drawSpace(index, x, y, width, height, isTop) {
        const space = BOARD_SPACES[index];
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(x, y, width, height);
        
        if (space.color) {
            ctx.fillStyle = space.color;
            ctx.fillRect(x, y, width, isTop ? 25 : height - 25);
        }
        
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        
        const name = space.name.length > 12 ? space.name.substring(0, 10) + '..' : space.name;
        const textY = isTop ? y + height - 10 : y + 25;
        ctx.fillText(name, x + width/2, textY);
        
        if (space.price) {
            ctx.fillStyle = '#666';
            ctx.font = '9px Arial';
            ctx.fillText(`$${space.price}`, x + width/2, textY + 10);
        }
        
        if (space.owner !== undefined && space.owner !== null) {
            const owner = game.players[space.owner];
            ctx.fillStyle = owner.color;
            ctx.beginPath();
            ctx.arc(x + width/2, y + height/2, 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function draw() {
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const cellSize = 40;
        const boardSize = cellSize * 11;
        const offsetX = (canvas.width - boardSize) / 2;
        const offsetY = (canvas.height - boardSize) / 2;
        
        for (let i = 0; i < 40; i++) {
            let x, y, w, h;
            
            if (i < 10) {
                x = offsetX + i * cellSize;
                y = offsetY;
                w = cellSize;
                h = cellSize;
                drawSpace(i, x, y, w, h, true);
            } else if (i < 20) {
                x = offsetX + boardSize - cellSize;
                y = offsetY + (i - 10) * cellSize;
                w = cellSize;
                h = cellSize;
                drawSpace(i, x, y, w, h, false);
            } else if (i < 30) {
                x = offsetX + (30 - i - 1) * cellSize;
                y = offsetY + boardSize - cellSize;
                w = cellSize;
                h = cellSize;
                drawSpace(i, x, y, w, h, true);
            } else {
                x = offsetX;
                y = offsetY + (40 - i - 1) * cellSize;
                w = cellSize;
                h = cellSize;
                drawSpace(i, x, y, w, h, false);
            }
        }
        
        game.players.forEach((player, i) => {
            if (player.money <= 0) return;
            
            const pos = BOARD_SPACES[player.position];
            let px, py;
            
            if (player.position < 10) {
                px = offsetX + player.position * cellSize + 20 + i * 5;
                py = offsetY + 20;
            } else if (player.position < 20) {
                px = offsetX + boardSize - 20 - i * 5;
                py = offsetY + (player.position - 10) * cellSize + 20;
            } else if (player.position < 30) {
                px = offsetX + (30 - player.position - 1) * cellSize + 20 - i * 5;
                py = offsetY + boardSize - 20;
            } else {
                px = offsetX + 20 + i * 5;
                py = offsetY + (40 - player.position - 1) * cellSize + 20;
            }
            
            ctx.fillStyle = player.color;
            ctx.beginPath();
            ctx.arc(px, py, 12, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(i === 0 ? 'Y' : (i + 1).toString(), px, py + 3);
        });
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 150, 120);
        
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        
        const current = game.players[game.currentPlayer];
        ctx.fillText(current.name, 20, 35);
        
        ctx.fillStyle = '#2ecc71';
        ctx.fillText(`$${current.money}`, 20, 58);
        
        ctx.fillStyle = '#3498db';
        ctx.fillText(`Properties: ${current.properties.length}`, 20, 81);
        
        if (game.dice[0] > 0) {
            ctx.fillStyle = '#f1c40f';
            ctx.fillText(`Dice: ${game.dice[0]} ${game.dice[1]}`, 20, 104);
        }
        
        if (game.turnInProgress) {
            ctx.fillStyle = '#e74c3c';
            ctx.fillText('Rolling...', 20, 127);
        }
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
    
    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
})();