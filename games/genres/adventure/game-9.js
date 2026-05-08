class PokemonGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.gameState = 'overworld';
        this.player = { x: 400, y: 300, dir: 'down' };
        this.party = [];
        this.enemies = [];
        this.currentBattle = null;
        this.battleMenu = 0;
        this.targetSelect = 0;
        this.score = 0;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.gameState = 'overworld';
        this.player = { x: 400, y: 300, dir: 'down' };
        this.party = [
            { name: 'Charmander', hp: 100, maxHp: 100, atk: 25, def: 20, moves: ['Scratch', 'Ember', 'Tackle', 'Growl'] },
            { name: 'Bulbasaur', hp: 100, maxHp: 100, atk: 22, def: 22, moves: ['Vine Whip', 'Tackle', 'Growl', 'Leech Seed'] },
            { name: 'Squirtle', hp: 100, maxHp: 100, atk: 20, def: 25, moves: ['Water Gun', 'Tackle', 'Tail Whip', 'Bubble'] }
        ];
    }

    update() {
        if (this.gameState === 'overworld') {
            if (this.keys.up) { this.player.y -= 3; this.player.dir = 'up'; }
            if (this.keys.down) { this.player.y += 3; this.player.dir = 'down'; }
            if (this.keys.left) { this.player.x -= 3; this.player.dir = 'left'; }
            if (this.keys.right) { this.player.x += 3; this.player.dir = 'right'; }

            if (this.keys.action) {
                this.keys.action = false;
                if (Math.random() < 0.1) this.startBattle();
            }
        } else if (this.gameState === 'battle') {
            this.updateBattle();
        }
    }

    startBattle() {
        this.gameState = 'battle';
        const pokemon = ['Rattata', 'Pidgey', 'Caterpie', 'Weedle', 'Poliwag'];
        const enemy = {
            name: pokemon[Math.floor(Math.random() * pokemon.length)],
            hp: 50 + Math.floor(Math.random() * 50),
            maxHp: 50 + Math.floor(Math.random() * 50),
            atk: 15 + Math.floor(Math.random() * 10),
            def: 10 + Math.floor(Math.random() * 10)
        };
        this.enemies = [enemy];
        this.battleMenu = 0;
    }

    updateBattle() {
        if (this.enemies[0] && this.enemies[0].hp <= 0) {
            this.score += 100;
            this.gameState = 'overworld';
        }
    }

    executeMove(moveIdx) {
        const player = this.party[0];
        const enemy = this.enemies[0];
        const damage = Math.max(1, player.atk - enemy.def + Math.floor(Math.random() * 10));
        enemy.hp -= damage;

        if (enemy.hp <= 0) {
            this.score += 100;
            this.gameState = 'overworld';
            return;
        }

        const enemyDamage = Math.max(1, enemy.atk - player.def + Math.floor(Math.random() * 10));
        player.hp -= enemyDamage;

        if (player.hp <= 0) {
            this.gameState = 'gameover';
        }
    }

    render() {
        if (this.gameState === 'overworld') {
            this.ctx.fillStyle = '#4a4';
            this.ctx.fillRect(0, 0, this.width, this.height);

            for (let x = 0; x < 20; x++) {
                for (let y = 0; y < 15; y++) {
                    if ((x + y) % 3 === 0) {
                        this.ctx.fillStyle = '#5a5';
                        this.ctx.fillRect(x * 40 + 10, y * 40 + 10, 20, 20);
                    }
                }
            }

            this.ctx.fillStyle = '#f84';
            this.ctx.fillRect(this.player.x - 15, this.player.y - 20, 30, 40);
            this.ctx.fillStyle = '#fcc';
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y - 25, 12, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '14px Arial';
            this.ctx.fillText('WASD: Move | Z: Random Encounter', 10, 20);

        } else if (this.gameState === 'battle') {
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.fillStyle = '#eee';
            this.ctx.fillRect(0, 0, this.width, 300);

            const enemy = this.enemies[0];
            this.ctx.fillStyle = '#f44';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(enemy.name, 500, 80);
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(500, 90, 150, 15);
            this.ctx.fillStyle = '#f00';
            this.ctx.fillRect(500, 90, 150 * (enemy.hp / enemy.maxHp), 15);

            this.ctx.fillStyle = '#8b4';
            this.ctx.beginPath();
            this.ctx.arc(600, 150, 40, 0, Math.PI * 2);
            this.ctx.fill();

            const player = this.party[0];
            this.ctx.fillStyle = '#f84';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(player.name, 80, 350);
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(80, 360, 200, 15);
            this.ctx.fillStyle = '#0f0';
            this.ctx.fillRect(80, 360, 200 * (player.hp / player.maxHp), 15);
            this.ctx.fillStyle = '#00f';
            this.ctx.fillRect(80, 380, 200 * (0.5), 15);

            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(0, 420, this.width, 180);
            this.ctx.strokeStyle = '#fff';
            this.ctx.strokeRect(10, 430, this.width - 20, 160);

            const options = ['FIGHT', 'BAG', 'POKEMON', 'RUN'];
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            for (let i = 0; i < 4; i++) {
                this.ctx.fillText(options[i], 200 + i * 150, 480);
            }

        } else if (this.gameState === 'gameover') {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#f00';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 50);
        }
    }

    handleKeyDown(key) {
        if (this.gameState === 'overworld') {
            if (key === 'w' || key === 'W') this.keys.up = true;
            if (key === 's' || key === 'S') this.keys.down = true;
            if (key === 'a' || key === 'A') this.keys.left = true;
            if (key === 'd' || key === 'D') this.keys.right = true;
            if (key === 'z' || key === 'Z') this.keys.action = true;
        } else if (this.gameState === 'battle') {
            if (key === 'ArrowLeft') this.battleMenu = (this.battleMenu + 3) % 4;
            if (key === 'ArrowRight') this.battleMenu = (this.battleMenu + 1) % 4;
            if (key === 'z' || key === 'Z') {
                if (this.battleMenu === 0) {
                    this.executeMove(0);
                }
            }
        }

        if (key === ' ' && this.gameState !== 'playing') {
            this.start();
        }
    }

    handleKeyUp(key) {
        if (key === 'w' || key === 'W') this.keys.up = false;
        if (key === 's' || key === 'S') this.keys.down = false;
        if (key === 'a' || key === 'A') this.keys.left = false;
        if (key === 'd' || key === 'D') this.keys.right = false;
    }

    getState() { return { score: this.score }; }
    setControllerData(data) {
        if (data.keys) for (const k of data.keys) this.handleKeyDown(k);
    }
}

window.PokemonGame = PokemonGame;