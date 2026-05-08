class DungeonExplorerGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.player = null;
        this.map = [];
        this.tileSize = 40;
        this.camera = { x: 0, y: 0 };
        this.enemies = [];
        this.items = [];
        this.doors = [];
        this.stairs = [];
        this.particles = [];
        this.equipment = { weapon: null, armor: null, accessory: null };
        this.stats = { hp: 100, maxHp: 100, mp: 50, maxMp: 50, attack: 10, defense: 5, level: 1, xp: 0 };
        this.xpToLevel = 100;
        this.gameState = 'exploring';
        this.message = '';
        this.messageTimer = 0;
        this.combat = null;
        this.dungeonLevel = 1;
        this.mapWidth = 30;
        this.mapHeight = 30;
        this.visited = [];
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.generateDungeon();
    }

    generateDungeon() {
        this.map = [];
        this.visited = [];
        for (let y = 0; y < this.mapHeight; y++) {
            this.map[y] = [];
            this.visited[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                this.map[y][x] = 1;
                this.visited[y][x] = false;
            }
        }

        const rooms = [];
        const numRooms = 8 + Math.floor(Math.random() * 5);

        for (let i = 0; i < numRooms; i++) {
            const w = 3 + Math.floor(Math.random() * 4);
            const h = 3 + Math.floor(Math.random() * 4);
            const x = 1 + Math.floor(Math.random() * (this.mapWidth - w - 2));
            const y = 1 + Math.floor(Math.random() * (this.mapHeight - h - 2));

            let overlaps = false;
            for (const r of rooms) {
                if (x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y) {
                    overlaps = true;
                    break;
                }
            }

            if (!overlaps) {
                rooms.push({ x, y, w, h });
                for (let ry = y; ry < y + h; ry++) {
                    for (let rx = x; rx < x + w; rx++) {
                        this.map[ry][rx] = 0;
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
                this.carveHorizontalTunnel(x1, x2, y1);
                this.carveVerticalTunnel(y1, y2, x2);
            } else {
                this.carveVerticalTunnel(y1, y2, x1);
                this.carveHorizontalTunnel(x1, x2, y2);
            }
        }

        const startRoom = rooms[0];
        this.player = {
            x: (startRoom.x + startRoom.w / 2) * this.tileSize,
            y: (startRoom.y + startRoom.h / 2) * this.tileSize,
            vx: 0,
            vy: 0,
            direction: 'down',
            attacking: 0,
            takingDamage: 0,
            width: 30,
            height: 30
        };

        const endRoom = rooms[rooms.length - 1];
        this.stairs = [{
            x: (endRoom.x + endRoom.w / 2) * this.tileSize,
            y: (endRoom.y + endRoom.h / 2) * this.tileSize
        }];

        this.enemies = [];
        this.items = [];

        for (let i = 1; i < rooms.length - 1; i++) {
            const room = rooms[i];
            const numEnemies = 1 + Math.floor(Math.random() * 3);
            const numItems = Math.floor(Math.random() * 2);

            for (let j = 0; j < numEnemies; j++) {
                const types = ['skeleton', 'orc', 'goblin', 'slime'];
                const type = types[Math.floor(Math.random() * types.length)];
                const ex = (room.x + 1 + Math.random() * (room.w - 2)) * this.tileSize;
                const ey = (room.y + 1 + Math.random() * (room.h - 2)) * this.tileSize;

                const enemy = {
                    type: type,
                    x: ex,
                    y: ey,
                    hp: 20 + this.dungeonLevel * 10,
                    maxHp: 20 + this.dungeonLevel * 10,
                    attack: 5 + this.dungeonLevel * 2,
                    xp: 10 + this.dungeonLevel * 5,
                    width: 30,
                    height: 30,
                    state: 'idle',
                    stateTimer: 0,
                    attackCooldown: 0
                };
                this.enemies.push(enemy);
            }

            for (let j = 0; j < numItems; j++) {
                const itemTypes = ['health', 'mana', 'weapon', 'armor', 'key'];
                const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
                const ix = (room.x + 1 + Math.random() * (room.w - 2)) * this.tileSize;
                const iy = (room.y + 1 + Math.random() * (room.h - 2)) * this.tileSize;

                this.items.push({
                    type: itemType,
                    x: ix + 10,
                    y: iy + 10,
                    width: 20,
                    height: 20,
                    value: 10 + Math.floor(Math.random() * 20)
                });
            }
        }
    }

    carveHorizontalTunnel(x1, x2, y) {
        const start = Math.min(x1, x2);
        const end = Math.max(x1, x2);
        for (let x = start; x <= end; x++) {
            if (y >= 0 && y < this.mapHeight && x >= 0 && x < this.mapWidth) {
                this.map[y][x] = 0;
            }
        }
    }

    carveVerticalTunnel(y1, y2, x) {
        const start = Math.min(y1, y2);
        const end = Math.max(y1, y2);
        for (let y = start; y <= end; y++) {
            if (y >= 0 && y < this.mapHeight && x >= 0 && x < this.mapWidth) {
                this.map[y][x] = 0;
            }
        }
    }

    update() {
        if (this.gameState === 'combat') {
            this.updateCombat();
            return;
        }

        if (this.messageTimer > 0) this.messageTimer--;

        let dx = 0, dy = 0;
        if (this.keys.left) dx = -1;
        if (this.keys.right) dx = 1;
        if (this.keys.up) dy = -1;
        if (this.keys.down) dy = 1;

        if (dx !== 0 || dy !== 0) {
            if (dx < 0) this.player.direction = 'left';
            else if (dx > 0) this.player.direction = 'right';
            if (dy < 0) this.player.direction = 'up';
            else if (dy > 0) this.player.direction = 'down';

            const speed = 4;
            const newX = this.player.x + dx * speed;
            const newY = this.player.y + dy * speed;

            if (!this.collides(newX, this.player.y)) {
                this.player.x = newX;
            }
            if (!this.collides(this.player.x, newY)) {
                this.player.y = newY;
            }
        }

        if (this.player.attacking > 0) this.player.attacking--;
        if (this.player.takingDamage > 0) this.player.takingDamage--;

        const mapX = Math.floor(this.player.x / this.tileSize);
        const mapY = Math.floor(this.player.y / this.tileSize);
        if (mapY >= 0 && mapY < this.mapHeight && mapX >= 0 && mapX < this.mapWidth) {
            this.visited[mapY][mapX] = true;
        }

        for (const enemy of this.enemies) {
            this.updateEnemy(enemy);
        }

        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            if (this.checkCollision(this.player, item)) {
                this.pickupItem(item);
                this.items.splice(i, 1);
            }
        }

        for (const stair of this.stairs) {
            if (this.checkCollision(this.player, stair)) {
                this.dungeonLevel++;
                this.showMessage(`Descended to level ${this.dungeonLevel}`);
                this.generateDungeon();
                break;
            }
        }

        this.camera.x = this.player.x - this.width / 2;
        this.camera.y = this.player.y - this.height / 2;
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.mapWidth * this.tileSize - this.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.mapHeight * this.tileSize - this.height));
    }

    collides(x, y) {
        const left = x - this.player.width / 2;
        const right = x + this.player.width / 2;
        const top = y - this.player.height / 2;
        const bottom = y + this.player.height / 2;

        const corners = [
            { x: left, y: top },
            { x: right, y: top },
            { x: left, y: bottom },
            { x: right, y: bottom }
        ];

        for (const corner of corners) {
            const tileX = Math.floor(corner.x / this.tileSize);
            const tileY = Math.floor(corner.y / this.tileSize);
            if (tileX < 0 || tileX >= this.mapWidth || tileY < 0 || tileY >= this.mapHeight) {
                return true;
            }
            if (this.map[tileY][tileX] === 1) {
                return true;
            }
        }
        return false;
    }

    checkCollision(a, b) {
        return Math.abs(a.x - b.x) < (a.width + b.width) / 2 &&
               Math.abs(a.y - b.y) < (a.height + b.height) / 2;
    }

    updateEnemy(enemy) {
        if (enemy.attackCooldown > 0) enemy.attackCooldown--;

        const dist = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);

        if (dist < 200) {
            enemy.state = 'chasing';
        }

        if (enemy.state === 'chasing') {
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const angle = Math.atan2(dy, dx);
            const speed = 1.5;

            const newX = enemy.x + Math.cos(angle) * speed;
            const newY = enemy.y + Math.sin(angle) * speed;

            const enemyLeft = newX - enemy.width / 2;
            const enemyRight = newX + enemy.width / 2;
            const enemyTop = newY - enemy.height / 2;
            const enemyBottom = newY + enemy.height / 2;

            let collision = false;
            const corners = [
                { x: enemyLeft, y: enemyTop },
                { x: enemyRight, y: enemyTop },
                { x: enemyLeft, y: enemyBottom },
                { x: enemyRight, y: enemyBottom }
            ];

            for (const corner of corners) {
                const tileX = Math.floor(corner.x / this.tileSize);
                const tileY = Math.floor(corner.y / this.tileSize);
                if (tileX >= 0 && tileX < this.mapWidth && tileY >= 0 && tileY < this.mapHeight) {
                    if (this.map[tileY][tileX] === 1) {
                        collision = true;
                        break;
                    }
                }
            }

            if (!collision) {
                enemy.x = newX;
                enemy.y = newY;
            }

            if (dist < 40 && enemy.attackCooldown <= 0) {
                this.startCombat(enemy);
            }
        }
    }

    startCombat(enemy) {
        this.gameState = 'combat';
        this.combat = {
            enemy: enemy,
            turn: 'player',
            timer: 0,
            log: []
        };
    }

    updateCombat() {
        if (!this.combat) return;

        this.combat.timer++;

        if (this.combat.turn === 'player' && this.keys.action) {
            const damage = this.stats.attack + (this.equipment.weapon ? this.equipment.weapon.value : 0);
            this.combat.enemy.hp -= damage;
            this.combat.log.push(`You deal ${damage} damage!`);
            this.createParticle(this.combat.enemy.x, this.combat.enemy.y, '#f00');
            this.keys.action = false;
            this.combat.turn = 'enemy';
            this.combat.timer = 0;

            if (this.combat.enemy.hp <= 0) {
                this.stats.xp += this.combat.enemy.xp;
                this.combat.log.push(`Enemy defeated! +${this.combat.enemy.xp} XP`);
                this.checkLevelUp();
                this.endCombat(true);
            }
        }

        if (this.combat.turn === 'enemy' && this.combat.timer > 60) {
            const defense = this.stats.defense + (this.equipment.armor ? this.equipment.armor.value : 0);
            const damage = Math.max(1, this.combat.enemy.attack - defense);
            this.stats.hp -= damage;
            this.combat.log.push(`Enemy deals ${damage} damage!`);
            this.player.takingDamage = 20;
            this.combat.turn = 'player';
            this.combat.timer = 0;

            if (this.stats.hp <= 0) {
                this.stats.hp = this.stats.maxHp;
                this.gameState = 'exploring';
                this.player.x = this.mapWidth * this.tileSize / 2;
                this.player.y = this.mapHeight * this.tileSize / 2;
            }
        }
    }

    checkLevelUp() {
        while (this.stats.xp >= this.xpToLevel) {
            this.stats.level++;
            this.stats.xp -= this.xpToLevel;
            this.xpToLevel = Math.floor(this.xpToLevel * 1.5);
            this.stats.maxHp += 10;
            this.stats.maxMp += 5;
            this.stats.attack += 2;
            this.stats.defense += 1;
            this.stats.hp = this.stats.maxHp;
            this.stats.mp = this.stats.maxMp;
            this.showMessage(`Level up! Now level ${this.stats.level}`);
        }
    }

    endCombat(victory) {
        if (victory) {
            const idx = this.enemies.indexOf(this.combat.enemy);
            if (idx > -1) this.enemies.splice(idx, 1);
        }
        this.gameState = 'exploring';
        this.combat = null;
    }

    pickupItem(item) {
        if (item.type === 'health') {
            this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + item.value);
            this.showMessage(`+${item.value} HP`);
        } else if (item.type === 'mana') {
            this.stats.mp = Math.min(this.stats.maxMp, this.stats.mp + item.value);
            this.showMessage(`+${item.value} MP`);
        } else if (item.type === 'weapon') {
            this.equipment.weapon = { type: 'weapon', value: item.value, name: 'Sword' };
            this.stats.attack += item.value;
            this.showMessage('Found a sword!');
        } else if (item.type === 'armor') {
            this.equipment.armor = { type: 'armor', value: item.value, name: 'Shield' };
            this.stats.defense += item.value;
            this.showMessage('Found a shield!');
        }
    }

    showMessage(msg) {
        this.message = msg;
        this.messageTimer = 120;
    }

    createParticle(x, y, color) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: Math.random() * 6 - 3,
                vy: Math.random() * 6 - 3,
                life: 30,
                color: color
            });
        }
    }

    render() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                if (this.map[y][x] === 1) {
                    this.ctx.fillStyle = '#444';
                    this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                    this.ctx.strokeStyle = '#333';
                    this.ctx.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                } else {
                    if (this.visited[y][x]) {
                        this.ctx.fillStyle = '#222';
                    } else {
                        this.ctx.fillStyle = '#1a1a1a';
                    }
                    this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                }
            }
        }

        for (const stair of this.stairs) {
            this.ctx.fillStyle = '#80f';
            this.ctx.fillRect(stair.x - 15, stair.y - 15, 30, 30);
            this.ctx.fillStyle = '#a0f';
            this.ctx.fillRect(stair.x - 10, stair.y - 10, 20, 20);
        }

        for (const item of this.items) {
            if (item.type === 'health') {
                this.ctx.fillStyle = '#f00';
                this.ctx.beginPath();
                this.ctx.arc(item.x + 10, item.y + 10, 8, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (item.type === 'mana') {
                this.ctx.fillStyle = '#00f';
                this.ctx.beginPath();
                this.ctx.arc(item.x + 10, item.y + 10, 8, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (item.type === 'weapon') {
                this.ctx.fillStyle = '#ff0';
                this.ctx.fillRect(item.x + 5, item.y + 5, 10, 20);
            } else if (item.type === 'armor') {
                this.ctx.fillStyle = '#0ff';
                this.ctx.fillRect(item.x + 2, item.y + 2, 16, 16);
            }
        }

        for (const enemy of this.enemies) {
            this.ctx.fillStyle = '#a52';
            if (enemy.type === 'skeleton') this.ctx.fillStyle = '#eee';
            if (enemy.type === 'orc') this.ctx.fillStyle = '#282';
            if (enemy.type === 'goblin') this.ctx.fillStyle = '#4a4';
            if (enemy.type === 'slime') this.ctx.fillStyle = '#0a8';

            this.ctx.fillRect(enemy.x - 15, enemy.y - 15, 30, 30);

            this.ctx.fillStyle = '#f00';
            this.ctx.fillRect(enemy.x - 15, enemy.y - 25, 30, 5);
            this.ctx.fillStyle = '#0f0';
            this.ctx.fillRect(enemy.x - 15, enemy.y - 25, 30 * (enemy.hp / enemy.maxHp), 5);
        }

        if (this.player.takingDamage > 0 && Math.floor(this.player.takingDamage / 3) % 2 === 0) {
            // don't render
        } else {
            this.ctx.fillStyle = '#fc0';
            this.ctx.fillRect(this.player.x - 15, this.player.y - 15, 30, 30);

            if (this.player.attacking > 0) {
                this.ctx.fillStyle = '#ff0';
                const attackX = this.player.x + (this.player.direction === 'right' ? 20 : -20);
                this.ctx.fillRect(attackX - 10, this.player.y - 10, 20, 20);
            }
        }

        this.ctx.restore();

        for (const p of this.particles) {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life / 30;
            this.ctx.beginPath();
            this.ctx.arc(p.x - this.camera.x, p.y - this.camera.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
        }
        this.ctx.globalAlpha = 1;

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Level: ${this.stats.level}`, 10, 25);
        this.ctx.fillText(`XP: ${this.stats.xp}/${this.xpToLevel}`, 10, 45);
        this.ctx.fillText(`HP: ${this.stats.hp}/${this.stats.maxHp}`, 10, 65);
        this.ctx.fillText(`MP: ${this.stats.mp}/${this.stats.maxMp}`, 10, 85);
        this.ctx.fillText(`ATK: ${this.stats.attack}`, 10, 105);
        this.ctx.fillText(`DEF: ${this.stats.defense}`, 10, 125);
        this.ctx.fillText(`Dungeon: ${this.dungeonLevel}`, 10, 145);

        if (this.messageTimer > 0) {
            this.ctx.fillStyle = '#ff0';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.message, this.width / 2, this.height - 30);
        }

        if (this.gameState === 'combat' && this.combat) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(100, 100, 600, 400);
            this.ctx.strokeStyle = '#fff';
            this.ctx.strokeRect(100, 100, 600, 400);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Combat: ${this.combat.enemy.type.toUpperCase()}`, 400, 130);

            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`Enemy HP: ${this.combat.enemy.hp}/${this.combat.enemy.maxHp}`, 120, 160);
            this.ctx.fillText(`Your HP: ${this.stats.hp}/${this.stats.maxHp}`, 120, 185);
            this.ctx.fillText(`Turn: ${this.combat.turn === 'player' ? 'Your turn (press Z to attack)' : 'Enemy turn...'}`, 120, 210);

            for (let i = 0; i < Math.min(this.combat.log.length, 5); i++) {
                this.ctx.fillText(this.combat.log[this.combat.log.length - 1 - i], 120, 250 + i * 20);
            }

            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#ff0';
            this.ctx.fillText('Press Z to Attack', 400, 450);
        }
    }

    handleKeyDown(key) {
        if (key === 'ArrowUp') this.keys.up = true;
        if (key === 'ArrowDown') this.keys.down = true;
        if (key === 'ArrowLeft') this.keys.left = true;
        if (key === 'ArrowRight') this.keys.right = true;
        if (key === 'z' || key === 'Z') this.keys.action = true;
    }

    handleKeyUp(key) {
        if (key === 'ArrowUp') this.keys.up = false;
        if (key === 'ArrowDown') this.keys.down = false;
        if (key === 'ArrowLeft') this.keys.left = false;
        if (key === 'ArrowRight') this.keys.right = false;
        if (key === 'z' || key === 'Z') this.keys.action = false;
    }

    start() {
        this.gameState = 'exploring';
        this.dungeonLevel = 1;
        this.stats = { hp: 100, maxHp: 100, mp: 50, maxMp: 50, attack: 10, defense: 5, level: 1, xp: 0 };
        this.xpToLevel = 100;
        this.equipment = { weapon: null, armor: null, accessory: null };
        this.keys = { up: false, down: false, left: false, right: false, action: false };
        this.generateDungeon();
    }

    getState() {
        return { level: this.stats.level, hp: this.stats.hp, dungeon: this.dungeonLevel };
    }

    setControllerData(data) {
        if (data.keys) {
            for (const key of data.keys) {
                this.handleKeyDown(key);
            }
        }
        if (data.released) {
            for (const key of data.released) {
                this.handleKeyUp(key);
            }
        }
    }
}

window.DungeonExplorerGame = DungeonExplorerGame;