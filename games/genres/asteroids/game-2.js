class AsteroidsGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.player = { x: 400, y: 300, angle: 0, vx: 0, vy: 0 };
        this.asteroids = [];
        this.bullets = [];
        this.score = 0;
        this.lives = 3;
        this.gameState = 'start';
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.player = { x: 400, y: 300, angle: 0, vx: 0, vy: 0 };
        this.asteroids = [];
        this.bullets = [];
        this.score = 0;
        this.lives = 3;
        this.gameState = 'playing';

        for (let i = 0; i < 5; i++) {
            this.spawnAsteroid();
        }
    }

    spawnAsteroid() {
        const angle = Math.random() * Math.PI * 2;
        const dist = 400;
        this.asteroids.push({
            x: 400 + Math.cos(angle) * dist,
            y: 300 + Math.sin(angle) * dist,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            size: 20 + Math.random() * 30,
            rotation: 0,
            rotSpeed: (Math.random() - 0.5) * 0.1
        });
    }

    update() {
        if (this.gameState !== 'playing') return;

        if (this.keys.left) this.player.angle -= 0.08;
        if (this.keys.right) this.player.angle += 0.08;

        if (this.keys.up) {
            this.player.vx += Math.cos(this.player.angle) * 0.2;
            this.player.vy += Math.sin(this.player.angle) * 0.2;
        }

        this.player.vx *= 0.99;
        this.player.vy *= 0.99;
        this.player.x += this.player.vx;
        this.player.y += this.player.vy;

        if (this.player.x < 0) this.player.x = 800;
        if (this.player.x > 800) this.player.x = 0;
        if (this.player.y < 0) this.player.y = 600;
        if (this.player.y > 600) this.player.y = 0;

        if (this.keys.shoot) {
            this.keys.shoot = false;
            this.bullets.push({
                x: this.player.x + Math.cos(this.player.angle) * 20,
                y: this.player.y + Math.sin(this.player.angle) * 20,
                vx: Math.cos(this.player.angle) * 10,
                vy: Math.sin(this.player.angle) * 10,
                life: 60
            });
        }

        for (const a of this.asteroids) {
            a.x += a.vx;
            a.y += a.vy;
            a.rotation += a.rotSpeed;

            if (a.x < -50) a.x = 850;
            if (a.x > 850) a.x = -50;
            if (a.y < -50) a.y = 650;
            if (a.y > 650) a.y = -50;

            if (Math.hypot(a.x - this.player.x, a.y - this.player.y) < a.size + 15) {
                this.lives--;
                if (this.lives <= 0) this.gameState = 'gameover';
                else {
                    this.player.x = 400;
                    this.player.y = 300;
                    this.player.vx = 0;
                    this.player.vy = 0;
                }
            }
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.x += b.vx;
            b.y += b.vy;
            b.life--;

            if (b.life <= 0 || b.x < 0 || b.x > 800 || b.y < 0 || b.y > 600) {
                this.bullets.splice(i, 1);
                continue;
            }

            for (let j = this.asteroids.length - 1; j >= 0; j--) {
                const a = this.asteroids[j];
                if (Math.hypot(b.x - a.x, b.y - a.y) < a.size) {
                    this.asteroids.splice(j, 1);
                    this.bullets.splice(i, 1);
                    this.score += 20;
                    this.spawnAsteroid();
                    break;
                }
            }
        }

        if (this.asteroids.length < 3) this.spawnAsteroid();
    }

    render() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        for (let i = 0; i < 100; i++) {
            this.ctx.fillStyle = '#fff';
            const x = (i * 137) % 800;
            const y = (i * 241) % 600;
            this.ctx.fillRect(x, y, 2, 2);
        }

        for (const a of this.asteroids) {
            this.ctx.save();
            this.ctx.translate(a.x, a.y);
            this.ctx.rotate(a.rotation);

            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                const r = a.size * (0.8 + Math.sin(i * 3) * 0.2);
                if (i === 0) this.ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
                else this.ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
            }
            this.ctx.closePath();
            this.ctx.stroke();

            this.ctx.restore();
        }

        for (const b of this.bullets) {
            this.ctx.fillStyle = '#ff0';
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        this.ctx.rotate(this.player.angle);

        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(20, 0);
        this.ctx.lineTo(-15, -10);
        this.ctx.lineTo(-10, 0);
        this.ctx.lineTo(-15, 10);
        this.ctx.closePath();
        this.ctx.stroke();

        this.ctx.restore();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 25);
        this.ctx.fillText(`Lives: ${this.lives}`, 20, 45);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('ASTEROIDS', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Arrows: Move/Rotate | Z: Shoot', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        } else if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`Score: ${this.score}`, this.width / 2, this.height / 2 + 20);
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 60);
        }
    }

    handleKeyDown(key) {
        if (key === 'ArrowLeft') this.keys.left = true;
        if (key === 'ArrowRight') this.keys.right = true;
        if (key === 'ArrowUp') this.keys.up = true;
        if (key === 'z' || key === 'Z') this.keys.shoot = true;
        if (key === ' ' && this.gameState !== 'playing') this.start();
    }

    handleKeyUp(key) {
        if (key === 'ArrowLeft') this.keys.left = false;
        if (key === 'ArrowRight') this.keys.right = false;
        if (key === 'ArrowUp') this.keys.up = false;
        if (key === 'z' || key === 'Z') this.keys.shoot = false;
    }

    getState() { return { score: this.score, lives: this.lives }; }
    setControllerData(data) {
        if (data.keys) for (const k of data.keys) this.handleKeyDown(k);
        if (data.released) for (const k of data.released) this.handleKeyUp(k);
    }
}

window.AsteroidsGame = AsteroidsGame;