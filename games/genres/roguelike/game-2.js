class RoguelikeGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.player = null;
        this.floor = 1;
        this.map = [];
        this.enemies = [];
        this.items = [];
        this.stairs = null;
        this.messageLog = [];
        this.gameState = 'playing';
        this.mapWidth = 40;
        this.mapHeight = 25;
        this.turn = 0;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.generateMap();
    }

    generateMap() {
        this.map = [];
        this.enemies = [];
        this.items = [];

        for (let y = 0; y < this.mapHeight; y++) {
            this.map[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                this.map[y][x] = '#';
            }
        }

        const rooms = [];
        const numRooms = 6 + Math.floor(Math.random() * 4);

        for (let i = 0; i < numRooms; i++) {
            const w = 4 + Math.floor(Math.random() * 6);
            const h = 4 + Math.floor(Math.random() * 5);
            const x = 1 + Math.floor(Math.random() * (this.mapWidth - w - 2));
            const y = 1 + Math.floor(Math.random() * (this.mapHeight - h - 2));

            let overlaps = false;
            for (const r of rooms) {
                if (x < r.x + r.w + 1 && x + w + 1 > r.x && y < r.y + r.h + 1 && y + h + 1 > r.y) {
                    overlaps = true;
                    break;
                }
            }

            if (!overlaps) {
                rooms.push({ x, y, w, h });
                for (let ry = y; ry < y + h; ry++) {
                    for (let rx = x; rx < x + w; rx++) {
                        this.map[ry][rx] = '.';
                    }
                }
            }
        }

        for (let i = 0; i < rooms.length - 1; i++) {
            const r1 = rooms[i];
            const r2 = rooms[i + 1];
            const x1 = Math.floor(r1.x + r1.w / 2);
            const y1 = Math.floor(r1.y + r1.h / 2);
            const x2 = Math.floor(r2.x + r2.w / 2);
            const y2 = Math.floor(r2.y + r2.h / 2);

            if (Math.random() < 0.5) {
                for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
                    this.map[y1][x] = '.';
                }
                for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
                    this.map[y][x2] = '.';
                }
            } else {
                for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
                    this.map[y][x1] = '.';
                }
                for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
                    this.map[y2][x] = '.';
                }
            }
        }

        const startRoom = rooms[0];
        this.player = {
            x: Math.floor(startRoom.x + startRoom.w / 2),
            y: Math.floor(startRoom.y + startRoom.h / 2),
            hp: 30,
            maxHp: 30,
            attack: 5,
            defense: 2,
            gold: 0,
            exp: 0,
            level: 1,
            items: []
        };

        const endRoom = rooms[rooms.length - 1];
        this.stairs = {
            x: Math.floor(endRoom.x + endRoom.w / 2),
            y: Math.floor(endRoom.y + endRoom.h / 2)
        };

        for (let i = 1; i < rooms.length - 1; i++) {
            const room = rooms[i];
            const numEnemies = 1 + Math.floor(Math.random() * 3);

            for (let j = 0; j < numEnemies; j++) {
                const types = ['rat', 'bat', 'snake', 'goblin', 'orc'];
                const type = types[Math.floor(Math.random() * Math.min(types.length, this.floor + 2))];
                const ex = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
                const ey = room.y + 1 + Math.floor(Math.random() * (room.h - 2));

                const enemy = {
                    type: type,
                    x: ex,
                    y: ey,
                    hp: 5 + this.floor * 3,
                    maxHp: 5 + this.floor * 3,
                    attack: 2 + this.floor,
                    exp: 5 + this.floor * 2,
                    symbol: type === 'rat' ? 'r' : type === 'bat' ? 'b' : type === 'snake' ? 's' : type === 'goblin' ? 'g' : 'O'
                };
                this.enemies.push(enemy);
            }

            if (Math.random() < 0.5) {
                const itemTypes = ['potion', 'scroll', 'weapon', 'armor', 'gold'];
                const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
                const ix = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
                const iy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));

                this.items.push({
                    type: type,
                    x: ix,
                    y: iy,
                    value: 5 + Math.floor(Math.random() * 10)
                });
            }
        }
    }

    update() {
        if (this.gameState !== 'playing') return;

        for (const enemy of this.enemies) {
            if (enemy.hp <= 0) continue;

            const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);

            if (dist < 8) {
                const dx = this.player.x - enemy.x;
                const dy = this.player.y - enemy.y;

                if (Math.abs(dx) > Math.abs(dy)) {
                    const newX = enemy.x + (dx > 0 ? 1 : -1);
                    if (this.map[enemy.y][newX] === '.' && !this.isOccupied(newX, enemy.y)) {
                        enemy.x = newX;
                    }
                } else {
                    const newY = enemy.y + (dy > 0 ? 1 : -1);
                    if (this.map[newY][enemy.x] === '.' && !this.isOccupied(enemy.x, newY)) {
                        enemy.y = newY;
                    }
                }

                if (Math.abs(enemy.x - this.player.x) <= 1 && Math.abs(enemy.y - this.player.y) <= 1) {
                    const damage = Math.max(1, enemy.attack - this.player.defense);
                    this.player.hp -= damage;
                    this.log(`The ${enemy.type} hits you for ${damage} damage!`);

                    if (this.player.hp <= 0) {
                        this.gameState = 'gameover';
                    }
                }
            }
        }

        this.enemies = this.enemies.filter(e => e.hp > 0);
    }

    isOccupied(x, y) {
        if (this.player.x === x && this.player.y === y) return true;
        for (const e of this.enemies) {
            if (e.x === x && e.y === y) return true;
        }
        return false;
    }

    movePlayer(dx, dy) {
        if (this.gameState !== 'playing') return;

        const newX = this.player.x + dx;
        const newY = this.player.y + dy;

        if (newX < 0 || newX >= this.mapWidth || newY < 0 || newY >= this.mapHeight) return;
        if (this.map[newY][newX] === '#') return;

        for (const enemy of this.enemies) {
            if (enemy.x === newX && enemy.y === newY) {
                const damage = Math.max(1, this.player.attack);
                enemy.hp -= damage;
                this.log(`You hit the ${enemy.type} for ${damage} damage!`);

                if (enemy.hp <= 0) {
                    this.player.exp += enemy.exp;
                    this.log(`The ${enemy.type} dies! +${enemy.exp} XP`);
                    this.checkLevelUp();
                }
                this.turn++;
                return;
            }
        }

        this.player.x = newX;
        this.player.y = newY;
        this.turn++;

        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            if (item.x === newX && item.y === newY) {
                this.pickupItem(item);
                this.items.splice(i, 1);
            }
        }

        if (this.stairs.x === newX && this.stairs.y === newY) {
            this.floor++;
            this.log(`Descended to floor ${this.floor}`);
            this.generateMap();
        }
    }

    pickupItem(item) {
        if (item.type === 'potion') {
            const heal = 10;
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
            this.log(`You drink the potion and heal ${heal} HP!`);
        } else if (item.type === 'gold') {
            this.player.gold += item.value;
            this.log(`You found ${item.value} gold!`);
        } else if (item.type === 'weapon') {
            this.player.attack += item.value;
            this.log(`You found a better weapon! +${item.value} ATK`);
        } else if (item.type === 'armor') {
            this.player.defense += Math.floor(item.value / 2);
            this.log(`You found better armor! +${Math.floor(item.value / 2)} DEF`);
        } else if (item.type === 'scroll') {
            this.log(`You found a magic scroll!`);
            for (const e of this.enemies) {
                if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < 8) {
                    e.hp -= 20;
                }
            }
        }
    }

    checkLevelUp() {
        const xpToLevel = this.player.level * 10;
        while (this.player.exp >= xpToLevel) {
            this.player.level++;
            this.player.exp -= xpToLevel;
            this.player.maxHp += 5;
            this.player.hp = this.player.maxHp;
            this.player.attack += 2;
            this.player.defense += 1;
            this.log(`LEVEL UP! You are now level ${this.player.level}!`);
        }
    }

    log(msg) {
        this.messageLog.unshift(msg);
        if (this.messageLog.length > 5) {
            this.messageLog.pop();
        }
    }

    render() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const cellSize = 20;
        const offsetX = 20;
        const offsetY = 20;

        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const cell = this.map[y][x];
                const screenX = offsetX + x * cellSize;
                const screenY = offsetY + y * cellSize;

                if (cell === '#') {
                    this.ctx.fillStyle = '#444';
                    this.ctx.fillRect(screenX, screenY, cellSize - 1, cellSize - 1);
                } else {
                    this.ctx.fillStyle = '#222';
                    this.ctx.fillRect(screenX, screenY, cellSize - 1, cellSize - 1);
                }
            }
        }

        for (const item of this.items) {
            const screenX = offsetX + item.x * cellSize;
            const screenY = offsetY + item.y * cellSize;

            if (item.type === 'potion') this.ctx.fillStyle = '#f00';
            else if (item.type === 'gold') this.ctx.fillStyle = '#ff0';
            else if (item.type === 'weapon') this.ctx.fillStyle = '#888';
            else if (item.type === 'armor') this.ctx.fillStyle = '#0af';
            else this.ctx.fillStyle = '#fff';

            this.ctx.font = '16px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(item.type === 'gold' ? '$' : item.type[0].toUpperCase(), screenX + cellSize / 2, screenY + cellSize - 3);
        }

        for (const enemy of this.enemies) {
            const screenX = offsetX + enemy.x * cellSize;
            const screenY = offsetY + enemy.y * cellSize;
            this.ctx.fillStyle = '#c33';
            this.ctx.font = '16px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(enemy.symbol, screenX + cellSize / 2, screenY + cellSize - 3);
        }

        const playerScreenX = offsetX + this.player.x * cellSize;
        const playerScreenY = offsetY + this.player.y * cellSize;
        this.ctx.fillStyle = '#0c0';
        this.ctx.font = 'bold 16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('@', playerScreenX + cellSize / 2, playerScreenY + cellSize - 3);

        const stairsScreenX = offsetX + this.stairs.x * cellSize;
        const stairsScreenY = offsetY + this.stairs.y * cellSize;
        this.ctx.fillStyle = '#808';
        this.ctx.fillText('>', stairsScreenX + cellSize / 2, stairsScreenY + cellSize - 3);

        const statusX = this.mapWidth * cellSize + 40;
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '14px monospace';
        this.ctx.textAlign = 'left';

        this.ctx.fillText(`Floor: ${this.floor}`, statusX, 30);
        this.ctx.fillText(`HP: ${this.player.hp}/${this.player.maxHp}`, statusX, 50);
        this.ctx.fillText(`ATK: ${this.player.attack}`, statusX, 70);
        this.ctx.fillText(`DEF: ${this.player.defense}`, statusX, 90);
        this.ctx.fillText(`Gold: ${this.player.gold}`, statusX, 110);
        this.ctx.fillText(`Level: ${this.player.level}`, statusX, 130);
        this.ctx.fillText(`XP: ${this.player.exp}/${this.player.level * 10}`, statusX, 150);

        this.ctx.fillStyle = '#ff0';
        let logY = this.height - 120;
        this.ctx.font = '12px monospace';
        for (const msg of this.messageLog) {
            this.ctx.fillText(msg, 20, logY);
            logY += 18;
        }

        if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#f00';
            this.ctx.font = '40px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 20);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px monospace';
            this.ctx.fillText(`Reached floor ${this.floor}`, this.width / 2, this.height / 2 + 30);
            this.ctx.fillText('Press SPACE to restart', this.width / 2, this.height / 2 + 70);
        }
    }

    handleKeyDown(key) {
        if (key === 'ArrowUp') this.movePlayer(0, -1);
        if (key === 'ArrowDown') this.movePlayer(0, 1);
        if (key === 'ArrowLeft') this.movePlayer(-1, 0);
        if (key === 'ArrowRight') this.movePlayer(1, 0);

        if (key === ' ' && this.gameState !== 'playing') {
            this.start();
        }
    }

    handleKeyUp(key) {}

    start() {
        this.gameState = 'playing';
        this.floor = 1;
        this.player = null;
        this.messageLog = [];
        this.generateMap();
    }

    getState() {
        return { floor: this.floor, hp: this.player?.hp || 0 };
    }

    setControllerData(data) {
        if (data.keys) {
            for (const key of data.keys) {
                this.handleKeyDown(key);
            }
        }
    }
}

window.RoguelikeGame = RoguelikeGame;