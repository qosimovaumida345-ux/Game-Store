class SurvivalGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.player = null;
        this.zombies = [];
        this.weapons = [];
        this.ammo = 30;
        this.health = 100;
        this.day = 1;
        this.dayTimer = 0;
        this.isNight = false;
        this.score = 0;
        this.gameState = 'start';
        this.buildings = [];
        this.supplies = [];
        this.baseX = 400;
        this.baseY = 300;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.setupWorld();
    }

    setupWorld() {
        this.player = {
            x: this.baseX,
            y: this.baseY,
            angle: 0,
            speed: 3
        };

        this.buildings = [];
        for (let i = 0; i < 8; i++) {
            this.buildings.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                width: 60 + Math.random() * 40,
                height: 60 + Math.random() * 40,
                type: Math.random() < 0.5 ? 'house' : 'shop'
            });
        }

        this.supplies = [];
        for (let i = 0; i < 15; i++) {
            this.supplies.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                type: Math.random() < 0.5 ? 'food' : 'ammo',
                amount: 10 + Math.floor(Math.random() * 20)
            });
        }

        this.zombies = [];
    }

    update() {
        if (this.gameState !== 'playing') return;

        this.dayTimer++;
        if (this.dayTimer > 1800) {
            this.dayTimer = 0;
            this.isNight = !this.isNight;

            if (this.isNight) {
                this.spawnZombies(5 + this.day * 2);
            } else {
                this.day++;
            }
        }

        if (this.keys.up) this.player.y -= this.player.speed;
        if (this.keys.down) this.player.y += this.player.speed;
        if (this.keys.left) this.player.x -= this.player.speed;
        if (this.keys.right) this.player.x += this.player.speed;

        this.player.x = Math.max(20, Math.min(this.width - 20, this.player.x));
        this.player.y = Math.max(20, Math.min(this.height - 20, this.player.y));

        if (this.mouseX !== undefined && this.mouseY !== undefined) {
            this.player.angle = Math.atan2(this.mouseY - this.player.y, this.mouseX - this.player.x);
        }

        if (this.keys.shoot) {
            this.shoot();
            this.keys.shoot = false;
        }

        for (const z of this.zombies) {
            const dx = this.player.x - z.x;
            const dy = this.player.y - z.y;
            const dist = Math.hypot(dx, dy);

            z.x += (dx / dist) * z.speed;
            z.y += (dy / dist) * z.speed;

            if (dist < 25) {
                this.health -= 0.5;
                if (this.health <= 0) {
                    this.gameState = 'gameover';
                }
            }
        }

        for (let i = this.zombies.length - 1; i >= 0; i--) {
            if (this.zombies[i].hp <= 0) {
                this.score += 10;
                this.zombies.splice(i, 1);
            }
        }

        for (let i = this.supplies.length - 1; i >= 0; i--) {
            const s = this.supplies[i];
            if (Math.hypot(s.x - this.player.x, s.y - this.player.y) < 30) {
                if (s.type === 'food') {
                    this.health = Math.min(100, this.health + s.amount);
                } else {
                    this.ammo += s.amount;
                }
                this.supplies.splice(i, 1);
            }
        }

        if (this.isNight && this.zombies.length < 3 + this.day) {
            this.spawnZombies(1);
        }
    }

    spawnZombies(count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 400 + Math.random() * 200;
            this.zombies.push({
                x: this.player.x + Math.cos(angle) * dist,
                y: this.player.y + Math.sin(angle) * dist,
                hp: 20 + this.day * 5,
                speed: 0.5 + Math.random() * 0.5
            });
        }
    }

    shoot() {
        if (this.ammo <= 0) return;

        this.ammo--;

        const bullet = {
            x: this.player.x,
            y: this.player.y,
            angle: this.player.angle,
            speed: 15
        };

        for (const z of this.zombies) {
            const dx = z.x - this.player.x;
            const dy = z.y - this.player.y;
            const angle = Math.atan2(dy, dx);
            const diff = Math.abs(angle - this.player.angle);
            const dist = Math.hypot(dx, dy);

            if (diff < 0.3 && dist < 500) {
                z.hp -= 25;
                break;
            }
        }
    }

    render() {
        this.ctx.fillStyle = this.isNight ? '#223' : '#574';
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (this.isNight) {
            this.ctx.fillStyle = '#111';
            this.ctx.globalAlpha = 0.5;
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.globalAlpha = 1;

            this.ctx.fillStyle = 'rgba(255,255,200,0.1)';
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, 150, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.fillStyle = this.isNight ? '#656' : '#898';
        for (const b of this.buildings) {
            this.ctx.fillRect(b.x - b.width / 2, b.y - b.height / 2, b.width, b.height);

            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(b.x - 10, b.y, 20, 30);

            this.ctx.fillStyle = this.isNight ? '#656' : '#898';
        }

        for (const s of this.supplies) {
            this.ctx.fillStyle = s.type === 'food' ? '#0f0' : '#ff0';
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, 10, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#000';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(s.type === 'food' ? 'F' : 'A', s.x, s.y + 4);
        }

        for (const z of this.zombies) {
            this.ctx.fillStyle = '#3a3';
            this.ctx.beginPath();
            this.ctx.arc(z.x, z.y, 15, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(z.x - 10, z.y - 20, 20, 4);
            this.ctx.fillStyle = '#f00';
            this.ctx.fillRect(z.x - 10, z.y - 20, 20 * (z.hp / (20 + this.day * 5)), 4);
        }

        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        this.ctx.rotate(this.player.angle);

        this.ctx.fillStyle = '#42f';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, -4, 25, 8);

        this.ctx.restore();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Day: ${this.day}`, 10, 25);
        this.ctx.fillText(`Health: ${Math.floor(this.health)}`, 10, 45);
        this.ctx.fillText(`Ammo: ${this.ammo}`, 10, 65);
        this.ctx.fillText(`Zombies: ${this.zombies.length}`, 10, 85);
        this.ctx.fillText(`Score: ${this.score}`, 10, 105);

        this.ctx.fillStyle = this.isNight ? '#fa0' : '#0af';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.isNight ? 'NIGHT' : 'DAY', this.width / 2, 30);

        const timeLeft = Math.floor((1800 - this.dayTimer) / 60);
        this.ctx.fillText(`${timeLeft}s`, this.width / 2, 50);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('SURVIVAL', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('WASD: Move | Click: Shoot', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        } else if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#f00';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`Survived ${this.day} days`, this.width / 2, this.height / 2 + 20);
            this.ctx.fillText(`Score: ${this.score}`, this.width / 2, this.height / 2 + 50);
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 90);
        }
    }

    handleKeyDown(key) {
        if (key === 'w' || key === 'W') this.keys.up = true;
        if (key === 's' || key === 'S') this.keys.down = true;
        if (key === 'a' || key === 'A') this.keys.left = true;
        if (key === 'd' || key === 'D') this.keys.right = true;
        if (key === ' ') this.keys.shoot = true;

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

    start() {
        this.gameState = 'playing';
        this.score = 0;
        this.health = 100;
        this.ammo = 30;
        this.day = 1;
        this.dayTimer = 0;
        this.isNight = false;
        this.keys = {};
        this.setupWorld();
    }

    getState() {
        return { day: this.day, health: this.health, zombies: this.zombies.length };
    }

    setControllerData(data) {
        if (data.x !== undefined) this.mouseX = data.x;
        if (data.y !== undefined) this.mouseY = data.y;
        if (data.action) this.keys.shoot = true;
    }
}

window.SurvivalGame = SurvivalGame;