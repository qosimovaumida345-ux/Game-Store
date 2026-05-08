class FlappyBirdGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.bird = { y: 300, velocity: 0 };
        this.pipes = [];
        this.score = 0;
        this.gameState = 'start';
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    start() {
        this.bird = { y: 300, velocity: 0 };
        this.pipes = [];
        this.score = 0;
        this.gameState = 'playing';

        for (let i = 0; i < 3; i++) {
            this.pipes.push({ x: 600 + i * 250, gap: 150 });
        }
    }

    update() {
        if (this.gameState !== 'playing') return;

        if (this.keys.jump) {
            this.bird.velocity = -8;
            this.keys.jump = false;
        }

        this.bird.velocity += 0.5;
        this.bird.y += this.bird.velocity;

        if (this.bird.y < 20 || this.bird.y > 570) {
            this.gameState = 'gameover';
        }

        for (const pipe of this.pipes) {
            pipe.x -= 3;

            if (pipe.x < -60) {
                pipe.x = 800;
                pipe.gap = 120 + Math.random() * 80;
            }

            if (pipe.x < 160 && pipe.x > 80) {
                if (this.bird.y < pipe.gap || this.bird.y > pipe.gap + 120) {
                    this.gameState = 'gameover';
                }
            }

            if (pipe.x === 120) this.score++;
        }
    }

    render() {
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = '#90EE90';
        this.ctx.fillRect(0, 500, this.width, 100);

        for (const pipe of this.pipes) {
            this.ctx.fillStyle = '#228B22';
            this.ctx.fillRect(pipe.x, 0, 50, pipe.gap);
            this.ctx.fillRect(pipe.x, pipe.gap + 120, 50, 600 - pipe.gap - 120);

            this.ctx.fillStyle = '#006400';
            this.ctx.fillRect(pipe.x + 5, 0, 10, pipe.gap);
            this.ctx.fillRect(pipe.x + 5, pipe.gap + 120, 10, 600 - pipe.gap - 120);
        }

        this.ctx.save();
        this.ctx.translate(140, this.bird.y);

        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(8, -5, 4, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#ff6600';
        this.ctx.beginPath();
        this.ctx.moveTo(15, -3);
        this.ctx.lineTo(25, 0);
        this.ctx.lineTo(15, 3);
        this.ctx.fill();

        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.ellipse(-10, -8, 8, 12, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.ellipse(-8, -8, 4, 6, -0.3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.score, this.width / 2, 50);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.fillText('FLAPPY BIRD', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('SPACE or Click to Flap', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        } else if (this.gameState === 'gameover') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.font = '40px Arial';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`Score: ${this.score}`, this.width / 2, this.height / 2 + 20);
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 60);
        }
    }

    handleKeyDown(key) {
        if (key === ' ' || key === 'ArrowUp') this.keys.jump = true;
        if (key === ' ' && this.gameState !== 'playing') this.start();
    }

    handleKeyUp(key) {
        if (key === ' ' || key === 'ArrowUp') this.keys.jump = false;
    }

    getState() { return { score: this.score }; }
    setControllerData(data) {
        if (data.action || (data.keys && data.keys.includes(' '))) this.handleKeyDown(' ');
    }
}

window.FlappyBirdGame = FlappyBirdGame;