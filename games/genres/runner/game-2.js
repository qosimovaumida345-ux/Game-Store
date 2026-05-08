class RunnerGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.player = null;
        this.obstacles = [];
        this.groundSegments = [];
        this.score = 0;
        this.distance = 0;
        this.speed = 8;
        this.gameState = 'start';
        this.jumpPower = -18;
        this.gravity = 0.8;
        this.particles = [];
        this.collectibles = [];
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.gameState = 'playing';
        this.score = 0;
        this.distance = 0;
        this.speed = 8;
        this.player = { x: 150, y: 450, vy: 0, onGround: true, frame: 0 };
        this.obstacles = [];
        this.groundSegments = [];
        this.particles = [];
        this.collectibles = [];

        for (let i = 0; i < 20; i++) {
            this.groundSegments.push({
                x: i * 100,
                y: 500,
                width: 100,
                type: Math.random() < 0.1 ? 'hole' : 'normal'
            });
        }
    }

    update() {
        if (this.gameState !== 'playing') return;

        this.distance += this.speed * 0.1;
        this.score += this.speed * 0.1;
        this.speed = 8 + this.distance * 0.001;
        this.speed = Math.min(this.speed, 20);

        if (this.keys.jump && this.player.onGround) {
            this.player.vy = this.jumpPower;
            this.player.onGround = false;

            for (let i = 0; i < 8; i++) {
                this.particles.push({
                    x: this.player.x,
                    y: this.player.y + 30,
                    vx: (Math.random() - 0.5) * 6,
                    vy: Math.random() * -3,
                    life: 20,
                    color: '#864'
                });
            }
        }

        this.player.vy += this.gravity;
        this.player.y += this.player.vy;

        let onGround = false;
        for (const seg of this.groundSegments) {
            if (seg.type === 'hole') continue;

            if (this.player.x > seg.x - 50 && this.player.x < seg.x + seg.width + 50) {
                if (this.player.y >= 450 && this.player.vy >= 0) {
                    this.player.y = 450;
                    this.player.vy = 0;
                    onGround = true;
                }
            }
        }

        if (this.player.y > this.height + 50) {
            this.gameState = 'gameover';
        }

        this.player.onGround = onGround;
        this.player.frame++;

        for (const seg of this.groundSegments) {
            seg.x -= this.speed;

            if (seg.x + seg.width < 0) {
                seg.x += 2000;
                seg.type = Math.random() < 0.15 ? 'hole' : 'normal';
            }
        }

        if (Math.random() < 0.03) {
            const lastSeg = this.groundSegments.find(s => s.x > this.width);
            if (lastSeg && lastSeg.type !== 'hole') {
                const types = ['spike', 'barrier', 'saw'];
                this.obstacles.push({
                    x: lastSeg.x + 50,
                    y: lastSeg.type === 'hole' ? 550 : 450 - (Math.random() < 0.5 ? 40 : 0),
                    type: types[Math.floor(Math.random() * types.length)],
                    rotation: 0
                });
            }
        }

        if (Math.random() < 0.05) {
            this.collectibles.push({
                x: this.width + 20,
                y: 350 + Math.random() * 100,
                type: Math.random() < 0.7 ? 'coin' : 'powerup'
            });
        }

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const o = this.obstacles[i];
            o.x -= this.speed;
            if (o.type === 'saw') o.rotation += 0.3;

            if (Math.abs(o.x - this.player.x) < 30 && Math.abs(o.y - this.player.y) < 30) {
                this.gameState = 'gameover';
            }

            if (o.x < -50) this.obstacles.splice(i, 1);
        }

        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const c = this.collectibles[i];
            c.x -= this.speed;

            if (Math.abs(c.x - this.player.x) < 25 && Math.abs(c.y - this.player.y) < 25) {
                if (c.type === 'coin') {
                    this.score += 50;
                } else {
                    this.speed = Math.min(20, this.speed + 3);
                }
                this.collectibles.splice(i, 1);
            } else if (c.x < -20) {
                this.collectibles.splice(i, 1);
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    render() {
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = '#cba';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 200);
        for (let x = 0; x <= this.width; x += 50) {
            this.ctx.lineTo(x, 180 + Math.sin(x * 0.01 + this.distance * 0.1) * 30);
        }
        this.ctx.lineTo(this.width, 0);
        this.ctx.lineTo(0, 0);
        this.ctx.fill();

        this.ctx.fillStyle = '#6a4';
        this.ctx.fillRect(0, 200, this.width, 300);

        for (const seg of this.groundSegments) {
            if (seg.type === 'hole') {
                this.ctx.fillStyle = '#87CEEB';
                this.ctx.fillRect(seg.x, 500, seg.width, 100);
            } else {
                this.ctx.fillStyle = '#574';
                this.ctx.fillRect(seg.x, 500, seg.width, 100);

                this.ctx.fillStyle = '#686';
                this.ctx.fillRect(seg.x + 5, 500, seg.width - 10, 10);
            }
        }

        for (const o of this.obstacles) {
            if (o.type === 'spike') {
                this.ctx.fillStyle = '#888';
                this.ctx.beginPath();
                this.ctx.moveTo(o.x, o.y + 40);
                this.ctx.lineTo(o.x - 15, o.y + 40);
                this.ctx.lineTo(o.x, o.y);
                this.ctx.lineTo(o.x + 15, o.y + 40);
                this.ctx.fill();
            } else if (o.type === 'barrier') {
                this.ctx.fillStyle = '#a44';
                this.ctx.fillRect(o.x - 15, o.y, 30, 40);
                this.ctx.fillStyle = '#fc0';
                this.ctx.fillRect(o.x - 10, o.y + 5, 20, 10);
            } else if (o.type === 'saw') {
                this.ctx.save();
                this.ctx.translate(o.x, o.y + 20);
                this.ctx.rotate(o.rotation);
                this.ctx.fillStyle = '#888';
                this.ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i;
                    if (i === 0) this.ctx.moveTo(Math.cos(angle) * 20, Math.sin(angle) * 20);
                    else this.ctx.lineTo(Math.cos(angle) * 20, Math.sin(angle) * 20);
                }
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.fillStyle = '#666';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }
        }

        for (const c of this.collectibles) {
            if (c.type === 'coin') {
                this.ctx.fillStyle = '#ff0';
                this.ctx.beginPath();
                this.ctx.arc(c.x, c.y, 12, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#da0';
                this.ctx.beginPath();
                this.ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                this.ctx.fillStyle = '#0ff';
                this.ctx.fillRect(c.x - 10, c.y - 10, 20, 20);
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('P', c.x, c.y + 4);
            }
        }

        for (const p of this.particles) {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life / 20;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;

        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);

        if (!this.player.onGround) {
            this.ctx.rotate(-0.2);
        }

        this.ctx.fillStyle = '#f84';
        this.ctx.fillRect(-15, -25, 30, 35);

        this.ctx.fillStyle = '#fcc';
        this.ctx.beginPath();
        this.ctx.arc(0, -30, 12, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#444';
        this.ctx.fillRect(-10, -40, 8, 12);
        this.ctx.fillRect(2, -40, 8, 12);

        const legOffset = Math.sin(this.player.frame * 0.3) * 8;
        this.ctx.fillStyle = '#444';
        this.ctx.fillRect(-8, 10, 6, 20 + (this.player.onGround ? legOffset : -5));
        this.ctx.fillRect(2, 10, 6, 20 + (this.player.onGround ? -legOffset : -5));

        this.ctx.restore();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${Math.floor(this.score)}`, 20, 35);
        this.ctx.fillText(`Speed: ${Math.floor(this.speed * 10)}`, 20, 60);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('ENDLESS RUNNER', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('SPACE: Jump', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        } else if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#f44';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`Score: ${Math.floor(this.score)}`, this.width / 2, this.height / 2 + 20);
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 60);
        }
    }

    handleKeyDown(key) {
        if (key === ' ' && this.gameState !== 'playing') {
            this.start();
        }
        if (key === ' ' || key === 'ArrowUp') {
            this.keys.jump = true;
        }
    }

    handleKeyUp(key) {
        if (key === ' ' || key === 'ArrowUp') {
            this.keys.jump = false;
        }
    }

    getState() {
        return { score: Math.floor(this.score), speed: this.speed };
    }

    setControllerData(data) {
        if (data.action || (data.keys && data.keys.includes(' '))) {
            this.handleKeyDown(' ');
        }
    }
}

window.RunnerGame = RunnerGame;