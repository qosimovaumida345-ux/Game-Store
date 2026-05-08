const PacManMaze = {
    canvas: null,
    ctx: null,
    maze: [],
    player: null,
    ghosts: [],
    dots: [],
    powerups: [],
    score: 0,
    lives: 3,
    gameOver: false,
    paused: false,
    level: 1,
    keys: {},
    frameCount: 0,
    ghostMode: false,
    ghostModeTimer: 0,
    scaredTimer: 0,
    totalDots: 0,
    eatenDots: 0,

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = canvasId;
            this.canvas.width = 560;
            this.canvas.height = 620;
            document.body.appendChild(this.canvas);
        }
        this.ctx = this.canvas.getContext('2d');
        this.setupEventListeners();
        this.reset();
        this.gameLoop();
    },

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
            if (e.code === 'KeyP') this.paused = !this.paused;
            if (e.code === 'Enter' && this.gameOver) this.reset();
        });
        this.canvas.addEventListener('click', () => {
            if (this.gameOver) this.reset();
        });
    },

    reset() {
        this.createMaze();
        this.player = {
            x: 280,
            y: 460,
            radius: 12,
            speed: 3,
            direction: { x: 0, y: 0 },
            nextDirection: { x: -1, y: 0 },
            mouthAngle: 0,
            mouthOpen: true
        };
        this.ghosts = this.createGhosts();
        this.collectDots();
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.paused = false;
        this.level = 1;
        this.frameCount = 0;
        this.ghostMode = false;
        this.ghostModeTimer = 0;
        this.scaredTimer = 0;
    },

    createMaze() {
        this.maze = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,1,0,0,0,0,0,1],
            [1,0,1,1,0,1,0,1,0,1,0,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,0,1,0,1,0,1,0,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,0,1,1,0,1,0,1,1,0,1,1],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,1,1,0,1,1,0,1,0,1,1,0,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,0,1,0,1,0,1,0,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,0,1,0,1,0,1,0,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
    },

    createGhosts() {
        const ghostColors = ['#ff0000', '#ffb8ff', '#00ffff', '#ffb852'];
        const ghosts = [];
        for (let i = 0; i < 4; i++) {
            ghosts.push({
                x: 280,
                y: 200 + i * 20,
                radius: 12,
                speed: 2 - this.level * 0.2,
                direction: { x: 0, y: -1 },
                color: ghostColors[i],
                startX: 280,
                startY: 200 + i * 20,
                frightened: false,
                eaten: false,
                releaseTimer: i * 100,
                pathIndex: 0,
                mode: i === 0 ? 'chase' : 'scatter'
            });
        }
        return ghosts;
    },

    collectDots() {
        this.dots = [];
        this.powerups = [];
        this.totalDots = 0;
        this.eatenDots = 0;

        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[y].length; x++) {
                if (this.maze[y][x] === 0) {
                    if ((x === 1 && y === 1) || (x === 12 && y === 1) || 
                        (x === 1 && y === 13) || (x === 12 && y === 13)) {
                        this.powerups.push({ x, y, active: true });
                        this.totalDots++;
                    } else {
                        this.dots.push({ x, y, active: true });
                        this.totalDots++;
                    }
                }
            }
        }
    },

    getGridPos(x, y) {
        const cellSize = 40;
        return {
            x: Math.floor(x / cellSize),
            y: Math.floor((y - 40) / cellSize)
        };
    },

    canMove(x, y, direction) {
        const cellSize = 40;
        const newX = x + direction.x * cellSize;
        const newY = y + direction.y * cellSize;
        const gridPos = this.getGridPos(newX, newY);

        if (gridPos.x < 0 || gridPos.x >= 14 || gridPos.y < 0 || gridPos.y >= 15) {
            return true;
        }

        return this.maze[gridPos.y] && this.maze[gridPos.y][gridPos.x] === 0;
    },

    update() {
        if (this.gameOver || this.paused) return;

        this.frameCount++;

        if (this.ghostMode) {
            this.ghostModeTimer--;
            if (this.ghostModeTimer <= 0) {
                this.ghostMode = false;
                this.ghosts.forEach(ghost => {
                    ghost.frightened = false;
                    ghost.speed = 2 - this.level * 0.2;
                });
            }
        }

        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.player.nextDirection = { x: 0, y: -1 };
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.player.nextDirection = { x: 0, y: 1 };
        }
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.nextDirection = { x: -1, y: 0 };
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.nextDirection = { x: 1, y: 0 };
        }

        const cellSize = 40;
        const playerGrid = this.getGridPos(this.player.x, this.player.y);
        const centerX = playerGrid.x * cellSize + cellSize / 2;
        const centerY = playerGrid.y * cellSize + 40 + cellSize / 2;

        if (Math.abs(this.player.x - centerX) < this.player.speed && 
            Math.abs(this.player.y - centerY) < this.player.speed) {
            if (this.canMove(this.player.x, this.player.y, this.player.nextDirection)) {
                this.player.direction = this.player.nextDirection;
            }
        }

        if (this.canMove(this.player.x, this.player.y, this.player.direction)) {
            this.player.x += this.player.direction.x * this.player.speed;
            this.player.y += this.player.direction.y * this.player.speed;
        }

        if (this.player.x < 0) this.player.x = this.canvas.width;
        if (this.player.x > this.canvas.width) this.player.x = 0;

        this.player.mouthAngle = Math.abs(Math.sin(this.frameCount * 0.3)) * 0.5;

        this.dots.forEach(dot => {
            if (dot.active) {
                const dotX = dot.x * cellSize + cellSize / 2;
                const dotY = dot.y * cellSize + 40 + cellSize / 2;
                const dist = Math.sqrt((this.player.x - dotX) ** 2 + (this.player.y - dotY) ** 2);
                if (dist < this.player.radius + 4) {
                    dot.active = false;
                    this.score += 10;
                    this.eatenDots++;
                }
            }
        });

        this.powerups.forEach(powerup => {
            if (powerup.active) {
                const powerupX = powerup.x * cellSize + cellSize / 2;
                const powerupY = powerup.y * cellSize + 40 + cellSize / 2;
                const dist = Math.sqrt((this.player.x - powerupX) ** 2 + (this.player.y - powerupY) ** 2);
                if (dist < this.player.radius + 6) {
                    powerup.active = false;
                    this.score += 50;
                    this.eatenDots++;
                    this.ghostMode = true;
                    this.ghostModeTimer = 600;
                    this.ghosts.forEach(ghost => {
                        ghost.frightened = true;
                        ghost.speed = 1;
                        ghost.direction = { x: -ghost.direction.x, y: -ghost.direction.y };
                    });
                }
            }
        });

        this.ghosts.forEach(ghost => {
            if (ghost.releaseTimer > 0) {
                ghost.releaseTimer--;
                return;
            }

            if (ghost.eaten) {
                const targetX = 280;
                const targetY = 250;
                const dist = Math.sqrt((ghost.x - targetX) ** 2 + (ghost.y - targetY) ** 2);
                if (dist < 5) {
                    ghost.eaten = false;
                    ghost.color = ghost.originalColor || ghost.color;
                } else {
                    const angle = Math.atan2(targetY - ghost.y, targetX - ghost.x);
                    ghost.x += Math.cos(angle) * ghost.speed * 2;
                    ghost.y += Math.sin(angle) * ghost.speed * 2;
                }
                return;
            }

            if (this.frameCount % 20 === 0) {
                if (!ghost.frightened && Math.random() < 0.3) {
                    const directions = [
                        { x: 0, y: -1 },
                        { x: 0, y: 1 },
                        { x: -1, y: 0 },
                        { x: 1, y: 0 }
                    ];
                    const validDirs = directions.filter(dir => 
                        dir.x !== -ghost.direction.x || dir.y !== -ghost.direction.y
                    ).filter(dir => this.canMove(ghost.x, ghost.y, dir));

                    if (validDirs.length > 0) {
                        if (ghost.frightened) {
                            ghost.direction = validDirs[Math.floor(Math.random() * validDirs.length)];
                        } else {
                            const playerGrid = this.getGridPos(this.player.x, this.player.y);
                            const ghostGrid = this.getGridPos(ghost.x, ghost.y);
                            let bestDir = validDirs[0];
                            let bestDist = Infinity;

                            validDirs.forEach(dir => {
                                const newX = ghostGrid.x + dir.x;
                                const newY = ghostGrid.y + dir.y;
                                const distToPlayer = Math.sqrt((newX - playerGrid.x) ** 2 + (newY - playerGrid.y) ** 2);
                                if (distToPlayer < bestDist) {
                                    bestDist = distToPlayer;
                                    bestDir = dir;
                                }
                            });
                            ghost.direction = bestDir;
                        }
                    }
                }
            }

            if (this.canMove(ghost.x, ghost.y, ghost.direction)) {
                ghost.x += ghost.direction.x * ghost.speed;
                ghost.y += ghost.direction.y * ghost.speed;
            }

            if (ghost.x < 0) ghost.x = this.canvas.width;
            if (ghost.x > this.canvas.width) ghost.x = 0;

            if (!ghost.frightened) {
                const dist = Math.sqrt((this.player.x - ghost.x) ** 2 + (this.player.y - ghost.y) ** 2);
                if (dist < this.player.radius + ghost.radius) {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.gameOver = true;
                    } else {
                        this.resetLevel();
                    }
                }
            } else {
                const dist = Math.sqrt((this.player.x - ghost.x) ** 2 + (this.player.y - ghost.y) ** 2);
                if (dist < this.player.radius + ghost.radius) {
                    ghost.eaten = true;
                    ghost.speed = 2;
                    this.score += 200;
                }
            }
        });

        if (this.eatenDots >= this.totalDots) {
            this.level++;
            this.resetLevel();
        }
    },

    resetLevel() {
        this.player.x = 280;
        this.player.y = 460;
        this.player.direction = { x: -1, y: 0 };
        this.player.nextDirection = { x: -1, y: 0 };

        this.ghosts.forEach((ghost, i) => {
            ghost.x = 280;
            ghost.y = 200 + i * 20;
            ghost.releaseTimer = i * 100;
            ghost.eaten = false;
            ghost.frightened = false;
        });

        this.collectDots();
        this.ghostMode = false;
        this.ghostModeTimer = 0;
    },

    draw() {
        const cellSize = 40;

        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[y].length; x++) {
                if (this.maze[y][x] === 1) {
                    this.ctx.fillStyle = '#2121de';
                    this.ctx.fillRect(x * cellSize, y * cellSize + 40, cellSize, cellSize);
                    
                    this.ctx.strokeStyle = '#4545ff';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(x * cellSize, y * cellSize + 40 + cellSize / 2);
                    this.ctx.lineTo(x * cellSize + cellSize, y * cellSize + 40 + cellSize / 2);
                    this.ctx.stroke();
                }
            }
        }

        this.ctx.fillStyle = '#fec896';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Level ${this.level}`, this.canvas.width / 2, 25);

        this.dots.forEach(dot => {
            if (dot.active) {
                this.ctx.fillStyle = '#fec896';
                this.ctx.beginPath();
                this.ctx.arc(dot.x * cellSize + cellSize / 2, dot.y * cellSize + 40 + cellSize / 2, 4, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        this.powerups.forEach(powerup => {
            if (powerup.active) {
                const pulse = Math.sin(this.frameCount * 0.15) * 2;
                this.ctx.fillStyle = '#fec896';
                this.ctx.shadowColor = '#fec896';
                this.ctx.shadowBlur = 10 + pulse;
                this.ctx.beginPath();
                this.ctx.arc(powerup.x * cellSize + cellSize / 2, powerup.y * cellSize + 40 + cellSize / 2, 8 + pulse, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
        });

        this.ghosts.forEach(ghost => {
            if (ghost.eaten) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.moveTo(ghost.x - ghost.radius, ghost.y);
                this.ctx.lineTo(ghost.x - ghost.radius, ghost.y + ghost.radius);
                this.ctx.lineTo(ghost.x + ghost.radius, ghost.y + ghost.radius);
                this.ctx.lineTo(ghost.x + ghost.radius, ghost.y);
                this.ctx.closePath();
                this.ctx.fill();
                return;
            }

            if (ghost.frightened) {
                this.ctx.fillStyle = this.frameCount % 30 < 15 ? '#2121de' : '#ffffff';
                this.ctx.shadowColor = this.ctx.fillStyle;
                this.ctx.shadowBlur = 10;
            } else {
                this.ctx.fillStyle = ghost.color;
                this.ctx.shadowColor = ghost.color;
                this.ctx.shadowBlur = 10;
            }

            this.ctx.beginPath();
            this.ctx.arc(ghost.x, ghost.y - ghost.radius / 2, ghost.radius, Math.PI, 0, false);
            this.ctx.lineTo(ghost.x + ghost.radius, ghost.y + ghost.radius);
            
            const wave = Math.sin(this.frameCount * 0.3) * 3;
            for (let i = 0; i < 4; i++) {
                const x = ghost.x + ghost.radius - (i * ghost.radius / 2);
                const y = ghost.y + ghost.radius + (i % 2 === 0 ? wave : -wave);
                this.ctx.lineTo(x, y);
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            if (ghost.frightened) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(ghost.x - 5, ghost.y - ghost.radius / 2 - 2, 3, 0, Math.PI * 2);
                this.ctx.arc(ghost.x + 5, ghost.y - ghost.radius / 2 - 2, 3, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(ghost.x - 6, ghost.y + 3);
                this.ctx.lineTo(ghost.x + 6, ghost.y + 3);
                this.ctx.stroke();
            } else {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(ghost.x - 4, ghost.y - ghost.radius / 2 - 2, 2, 0, Math.PI * 2);
                this.ctx.arc(ghost.x + 4, ghost.y - ghost.radius / 2 - 2, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        this.ctx.fillStyle = '#ffff00';
        this.ctx.shadowColor = '#ffff00';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x, this.player.y);
        this.ctx.arc(this.player.x, this.player.y, this.player.radius, 
            this.player.mouthAngle + Math.atan2(this.player.direction.y, this.player.direction.x),
            Math.PI * 2 - this.player.mouthAngle + Math.atan2(this.player.direction.y, this.player.direction.x),
            false);
        this.ctx.lineTo(this.player.x, this.player.y);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 20);
        this.ctx.fillText(`Lives: ${'❤️'.repeat(this.lives)}`, this.canvas.width - 100, 20);

        if (this.paused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Press P to continue', this.canvas.width / 2, this.canvas.height / 2 + 30);
        }

        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ff4444';
            this.ctx.font = '32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Click or press Enter to restart', this.canvas.width / 2, this.canvas.height / 2 + 60);
        }
    },

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PacManMaze;
}