class SkateboardGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.skater = null;
        this.track = [];
        this.obstacles = [];
        this.score = 0;
        this.distance = 0;
        this.speed = 0;
        this.maxSpeed = 15;
        this.gameState = 'start';
        this.tricks = [];
        this.currentTrick = null;
        this.balance = 50;
        this.balanceDecay = 0.02;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.generateTrack();
    }

    generateTrack() {
        this.track = [];
        for (let x = 0; x < 2000; x += 10) {
            const baseHeight = 450;
            const wave = Math.sin(x * 0.005) * 30;
            const hill = Math.sin(x * 0.02) * 50;
            const roughness = Math.random() * 5;

            this.track.push({
                x: x,
                y: baseHeight + wave + hill + roughness,
                type: 'ground'
            });
        }

        this.obstacles = [];
        for (let i = 0; i < 30; i++) {
            const x = 300 + Math.random() * 1600;
            const types = ['rail', 'gap', 'ramp', 'box'];
            const type = types[Math.floor(Math.random() * types.length)];

            this.obstacles.push({
                x: x,
                type: type,
                width: type === 'rail' ? 80 : type === 'gap' ? 60 : 40,
                height: type === 'ramp' ? 30 : 20,
                cleared: false
            });
        }
    }

    update() {
        if (this.gameState !== 'playing') return;

        if (this.keys.right) {
            this.speed = Math.min(this.maxSpeed, this.speed + 0.3);
        } else {
            this.speed = Math.max(0, this.speed - 0.1);
        }

        if (this.keys.left) {
            this.speed = Math.max(0, this.speed - 0.2);
        }

        this.distance += this.speed * 0.1;
        this.score += this.speed * 0.1;

        this.balance -= this.balanceDecay;
        if (this.keys.balanceLeft) this.balance -= 0.3;
        if (this.keys.balanceRight) this.balance += 0.3;

        this.balance = Math.max(0, Math.min(100, this.balance));

        if (this.balance <= 0) {
            this.gameState = 'gameover';
        }

        const trackIdx = Math.floor(this.distance);
        if (trackIdx < this.track.length) {
            this.skater.y = this.track[trackIdx].y - 30;
        }

        if (this.speed > 5 && (this.keys.up || this.keys.action)) {
            this.performTrick();
        }

        for (const obs of this.obstacles) {
            if (Math.abs(obs.x - this.distance) < 50 && !obs.cleared) {
                if (this.currentTrick && this.currentTrick.name) {
                    obs.cleared = true;
                    this.score += 100;
                }
            }
        }

        if (this.currentTrick) {
            this.currentTrick.progress++;
            if (this.currentTrick.progress >= this.currentTrick.duration) {
                if (this.currentTrick.completed) {
                    this.score += this.currentTrick.score;
                }
                this.currentTrick = null;
            }
        }
    }

    performTrick() {
        if (this.currentTrick) return;

        const trickList = [
            { name: 'Kickflip', duration: 30, score: 150 },
            { name: 'Heelflip', duration: 30, score: 150 },
            { name: '360 Flip', duration: 45, score: 300 },
            { name: 'Indy Grab', duration: 40, score: 250 },
            { name: 'Melon Grab', duration: 40, score: 250 },
            { name: 'Boneless', duration: 35, score: 200 },
            { name: 'Manual', duration: 50, score: 100 }
        ];

        const trick = trickList[Math.floor(Math.random() * trickList.length)];
        this.currentTrick = {
            ...trick,
            progress: 0,
            completed: this.balance > 30
        };
    }

    render() {
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = '#4a4';
        this.ctx.fillRect(0, 450, this.width, 150);

        this.ctx.save();
        this.ctx.translate(-this.distance % 50, 0);

        this.ctx.fillStyle = '#555';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 500);
        for (let i = 0; i < Math.min(this.track.length, 100); i++) {
            this.ctx.lineTo(this.track[i].x - this.distance, this.track[i].y);
        }
        this.ctx.lineTo(2000 - this.distance, 600);
        this.ctx.lineTo(0, 600);
        this.ctx.fill();

        for (const obs of this.obstacles) {
            const screenX = obs.x - this.distance;
            if (screenX < -100 || screenX > this.width + 100) continue;

            if (obs.type === 'rail') {
                this.ctx.fillStyle = '#888';
                this.ctx.fillRect(screenX, 420, obs.width, 10);
                this.ctx.fillStyle = '#666';
                this.ctx.fillRect(screenX + 5, 430, 5, 30);
                this.ctx.fillRect(screenX + obs.width - 10, 430, 5, 30);
            } else if (obs.type === 'ramp') {
                this.ctx.fillStyle = '#a84';
                this.ctx.beginPath();
                this.ctx.moveTo(screenX, 450);
                this.ctx.lineTo(screenX + 20, 420);
                this.ctx.lineTo(screenX + 40, 450);
                this.ctx.fill();
            } else if (obs.type === 'box') {
                this.ctx.fillStyle = '#a84';
                this.ctx.fillRect(screenX, 430, obs.width, obs.height);
            } else if (obs.type === 'gap') {
                this.ctx.fillStyle = '#333';
                this.ctx.fillRect(screenX - 10, 460, 10, 40);
                this.ctx.fillRect(screenX + obs.width, 460, 10, 40);
            }

            if (!obs.cleared) {
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '12px Arial';
                this.ctx.fillText(obs.type.toUpperCase(), screenX, 400);
            } else {
                this.ctx.fillStyle = '#ff0';
                this.ctx.fillText('CLEARED!', screenX, 400);
            }
        }

        this.ctx.restore();

        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(250, 550, 300, 20);
        this.ctx.fillStyle = '#f00';
        this.ctx.fillRect(250 + this.balance * 3, 550, 10, 20);
        this.ctx.strokeStyle = '#fff';
        this.ctx.strokeRect(250, 550, 300, 20);

        const skaterX = this.width / 2;
        const skaterY = 420;

        this.ctx.save();
        this.ctx.translate(skaterX, skaterY);

        if (this.currentTrick) {
            const angle = (this.currentTrick.progress / this.currentTrick.duration) * Math.PI * 2;
            this.ctx.rotate(angle);
        }

        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(-15, 20, 30, 5);
        this.ctx.fillStyle = '#888';
        this.ctx.beginPath();
        this.ctx.arc(-10, 25, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(10, 25, 8, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#f84';
        this.ctx.fillRect(-10, -10, 20, 30);
        this.ctx.fillStyle = '#fcc';
        this.ctx.beginPath();
        this.ctx.arc(0, -15, 8, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${Math.floor(this.score)}`, 10, 25);
        this.ctx.fillText(`Distance: ${Math.floor(this.distance)}m`, 10, 45);
        this.ctx.fillText(`Speed: ${Math.floor(this.speed * 10)} km/h`, 10, 65);
        this.ctx.fillText(`Balance: ${Math.floor(this.balance)}%`, 10, 85);

        if (this.currentTrick) {
            this.ctx.fillStyle = '#ff0';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${this.currentTrick.name}!`, this.width / 2, 100);
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`+${this.currentTrick.score} pts`, this.width / 2, 125);
        }

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('SKATEBOARD', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Arrow Keys: Move | Up/A: Tricks | Left/Right: Balance', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        } else if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#f00';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('WIPEOUT!', this.width / 2, this.height / 2 - 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`Final Score: ${Math.floor(this.score)}`, this.width / 2, this.height / 2 + 20);
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 60);
        }
    }

    handleKeyDown(key) {
        if (key === 'ArrowRight') this.keys.right = true;
        if (key === 'ArrowLeft') this.keys.left = true;
        if (key === 'ArrowUp') this.keys.up = true;
        if (key === 'a' || key === 'A') this.keys.action = true;
        if (key === 'ArrowLeft') this.keys.balanceLeft = true;
        if (key === 'ArrowRight') this.keys.balanceRight = true;

        if (key === ' ' && this.gameState !== 'playing') {
            this.start();
        }
    }

    handleKeyUp(key) {
        if (key === 'ArrowRight') { this.keys.right = false; this.keys.balanceRight = false; }
        if (key === 'ArrowLeft') { this.keys.left = false; this.keys.balanceLeft = false; }
        if (key === 'ArrowUp') this.keys.up = false;
        if (key === 'a' || key === 'A') this.keys.action = false;
    }

    start() {
        this.gameState = 'playing';
        this.score = 0;
        this.distance = 0;
        this.speed = 0;
        this.balance = 50;
        this.currentTrick = null;
        this.keys = {};
        this.generateTrack();
    }

    getState() {
        return { score: Math.floor(this.score), balance: this.balance };
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

window.SkateboardGame = SkateboardGame;