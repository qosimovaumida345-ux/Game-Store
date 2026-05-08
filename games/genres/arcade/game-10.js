const TetrisBlitz = {
    canvas: null,
    ctx: null,
    board: [],
    currentPiece: null,
    nextPiece: null,
    score: 0,
    lines: 0,
    level: 1,
    gameOver: false,
    paused: false,
    keys: {},
    frameCount: 0,
    dropTimer: 0,
    dropInterval: 1000,
    softDrop: false,
    ghostPiece: null,
    particles: [],
    combo: 0,
    perfectClear: false,
    boardWidth: 10,
    boardHeight: 20,
    cellSize: 30,
    offsetX: 150,
    offsetY: 30,

    pieces: {
        I: {
            shape: [[1, 1, 1, 1]],
            color: '#00ffff'
        },
        O: {
            shape: [[1, 1], [1, 1]],
            color: '#ffff00'
        },
        T: {
            shape: [[0, 1, 0], [1, 1, 1]],
            color: '#ff00ff'
        },
        S: {
            shape: [[0, 1, 1], [1, 1, 0]],
            color: '#00ff00'
        },
        Z: {
            shape: [[1, 1, 0], [0, 1, 1]],
            color: '#ff0000'
        },
        J: {
            shape: [[1, 0, 0], [1, 1, 1]],
            color: '#0000ff'
        },
        L: {
            shape: [[0, 0, 1], [1, 1, 1]],
            color: '#ff8800'
        }
    },

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = canvasId;
            this.canvas.width = 500;
            this.canvas.height = 650;
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
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        this.canvas.addEventListener('click', () => {
            if (this.gameOver) this.reset();
        });
    },

    reset() {
        this.board = [];
        for (let y = 0; y < this.boardHeight; y++) {
            this.board.push(new Array(this.boardWidth).fill(null));
        }

        this.currentPiece = this.createPiece(this.getRandomPieceType());
        this.nextPiece = this.createPiece(this.getRandomPieceType());
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.frameCount = 0;
        this.dropTimer = 0;
        this.dropInterval = 1000;
        this.softDrop = false;
        this.combo = 0;
        this.perfectClear = false;
        this.particles = [];
        this.ghostPiece = null;

        this.updateGhostPiece();
    },

    getRandomPieceType() {
        const types = Object.keys(this.pieces);
        return types[Math.floor(Math.random() * types.length)];
    },

    createPiece(type) {
        const piece = this.pieces[type];
        return {
            type: type,
            shape: piece.shape.map(row => [...row]),
            color: piece.color,
            x: Math.floor((this.boardWidth - piece.shape[0].length) / 2),
            y: 0
        };
    },

    rotatePiece() {
        const shape = this.currentPiece.shape;
        const rows = shape.length;
        const cols = shape[0].length;

        const rotated = [];
        for (let c = 0; c < cols; c++) {
            const newRow = [];
            for (let r = rows - 1; r >= 0; r--) {
                newRow.push(shape[r][c]);
            }
            rotated.push(newRow);
        }

        const originalShape = this.currentPiece.shape;
        this.currentPiece.shape = rotated;

        if (this.checkCollision()) {
            this.currentPiece.shape = originalShape;
        }

        this.updateGhostPiece();
    },

    checkCollision() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const newX = this.currentPiece.x + x;
                    const newY = this.currentPiece.y + y;

                    if (newX < 0 || newX >= this.boardWidth || newY >= this.boardHeight) {
                        return true;
                    }

                    if (newY >= 0 && this.board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    },

    updateGhostPiece() {
        this.ghostPiece = {
            x: this.currentPiece.x,
            y: this.currentPiece.y,
            shape: this.currentPiece.shape,
            color: this.currentPiece.color
        };

        while (!this.checkCollisionForPiece(this.ghostPiece.x, this.ghostPiece.y)) {
            this.ghostPiece.y++;
        }
        this.ghostPiece.y--;
    },

    checkCollisionForPiece(x, y) {
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;

                    if (newX < 0 || newX >= this.boardWidth) {
                        return true;
                    }

                    if (newY >= this.boardHeight) {
                        return true;
                    }

                    if (newY >= 0 && this.board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    },

    lockPiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;

                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }

        this.clearLines();
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.createPiece(this.getRandomPieceType());

        if (this.checkCollision()) {
            this.gameOver = true;
        }

        this.updateGhostPiece();
    },

    clearLines() {
        const linesToClear = [];

        for (let y = this.boardHeight - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== null)) {
                linesToClear.push(y);
            }
        }

        if (linesToClear.length > 0) {
            linesToClear.forEach(lineY => {
                this.createLineExplosion(lineY);
            });

            linesToClear.sort((a, b) => a - b);
            linesToClear.forEach(lineY => {
                this.board.splice(lineY, 1);
                this.board.unshift(new Array(this.boardWidth).fill(null));
            });

            const lineScores = [0, 100, 300, 500, 800];
            this.score += lineScores[linesToClear.length] * this.level;
            this.lines += linesToClear.length;

            if (linesToClear.length >= 4) {
                this.combo += 2;
            } else {
                this.combo++;
            }

            if (this.combo > 1) {
                this.score += 50 * this.combo * this.level;
            }

            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - this.level * 50);

            if (this.board.every(row => row.every(cell => cell === null))) {
                this.score += 1000 * this.level;
                this.perfectClear = true;
            }
        } else {
            this.combo = 0;
        }
    },

    createLineExplosion(lineY) {
        for (let x = 0; x < this.boardWidth; x++) {
            const color = this.board[lineY][x] || '#ffffff';
            for (let i = 0; i < 5; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 5 + 2;
                this.particles.push({
                    x: this.offsetX + x * this.cellSize + this.cellSize / 2,
                    y: this.offsetY + lineY * this.cellSize + this.cellSize / 2,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 2,
                    life: 1,
                    color: color,
                    size: Math.random() * 4 + 2
                });
            }
        }
    },

    update(timestamp) {
        if (this.gameOver || this.paused) return;

        this.frameCount++;

        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            if (!this.keys['ArrowLeft_Pressed'] && !this.keys['KeyA_Pressed']) {
                this.currentPiece.x--;
                if (this.checkCollision()) {
                    this.currentPiece.x++;
                }
                this.updateGhostPiece();
            }
            this.keys['ArrowLeft_Pressed'] = true;
            this.keys['KeyA_Pressed'] = true;
        } else {
            this.keys['ArrowLeft_Pressed'] = false;
            this.keys['KeyA_Pressed'] = false;
        }

        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            if (!this.keys['ArrowRight_Pressed'] && !this.keys['KeyD_Pressed']) {
                this.currentPiece.x++;
                if (this.checkCollision()) {
                    this.currentPiece.x--;
                }
                this.updateGhostPiece();
            }
            this.keys['ArrowRight_Pressed'] = true;
            this.keys['KeyD_Pressed'] = true;
        } else {
            this.keys['ArrowRight_Pressed'] = false;
            this.keys['KeyD_Pressed'] = false;
        }

        if (this.keys['ArrowUp'] || this.keys['KeyW'] || this.keys['KeyX']) {
            if (!this.keys['Rotate_Pressed']) {
                this.rotatePiece();
            }
            this.keys['Rotate_Pressed'] = true;
        } else {
            this.keys['Rotate_Pressed'] = false;
        }

        this.softDrop = this.keys['ArrowDown'] || this.keys['KeyS'];
        const currentDropInterval = this.softDrop ? this.dropInterval / 20 : this.dropInterval;

        this.dropTimer += 16;
        if (this.dropTimer >= currentDropInterval) {
            this.dropTimer = 0;

            this.currentPiece.y++;
            if (this.checkCollision()) {
                this.currentPiece.y--;
                this.lockPiece();
            }

            if (this.softDrop) {
                this.score += 1;
            }

            this.updateGhostPiece();
        }

        if (this.keys['Space']) {
            while (!this.checkCollisionForPiece(this.currentPiece.x, this.currentPiece.y + 1)) {
                this.currentPiece.y++;
                this.score += 2;
            }
            this.lockPiece();
        }

        if (this.keys['KeyZ']) {
            if (!this.keys['RotateCCW_Pressed']) {
                for (let i = 0; i < 3; i++) {
                    this.rotatePiece();
                }
            }
            this.keys['RotateCCW_Pressed'] = true;
        } else {
            this.keys['RotateCCW_Pressed'] = false;
        }

        this.particles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.15;
            particle.life -= 0.02;
            if (particle.life <= 0) this.particles.splice(index, 1);
        });
    },

    draw() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, 650);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, 500, 650);

        this.ctx.strokeStyle = 'rgba(0, 255, 136, 0.5)';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(this.offsetX - 2, this.offsetY - 2, this.boardWidth * this.cellSize + 4, this.boardHeight * this.cellSize + 4);

        for (let y = 0; y < this.boardHeight; y++) {
            for (let x = 0; x < this.boardWidth; x++) {
                const cell = this.board[y][x];

                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
                this.ctx.strokeRect(
                    this.offsetX + x * this.cellSize,
                    this.offsetY + y * this.cellSize,
                    this.cellSize,
                    this.cellSize
                );

                if (cell) {
                    this.drawBlock(
                        this.offsetX + x * this.cellSize,
                        this.offsetY + y * this.cellSize,
                        this.cellSize - 1,
                        cell
                    );
                }
            }
        }

        if (this.ghostPiece && !this.gameOver) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 2;

            for (let y = 0; y < this.ghostPiece.shape.length; y++) {
                for (let x = 0; x < this.ghostPiece.shape[y].length; x++) {
                    if (this.ghostPiece.shape[y][x]) {
                        const px = this.offsetX + (this.ghostPiece.x + x) * this.cellSize;
                        const py = this.offsetY + (this.ghostPiece.y + y) * this.cellSize;

                        this.ctx.strokeRect(px, py, this.cellSize, this.cellSize);
                    }
                }
            }
        }

        if (this.currentPiece && !this.gameOver) {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        this.drawBlock(
                            this.offsetX + (this.currentPiece.x + x) * this.cellSize,
                            this.offsetY + (this.currentPiece.y + y) * this.cellSize,
                            this.cellSize - 1,
                            this.currentPiece.color
                        );
                    }
                }
            }
        }

        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color + Math.floor(particle.life * 255).toString(16).padStart(2, '0');
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);

        if (this.combo > 1) {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.fillText(`Combo x${this.combo}!`, 20, 55);
        }

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '18px Arial';
        this.ctx.fillText(`Lines: ${this.lines}`, 20, 80);
        this.ctx.fillText(`Level: ${this.level}`, 20, 105);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Next:', 380, 100);

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.strokeRect(370, 110, 100, 80);

        if (this.nextPiece) {
            const previewSize = 25;
            const previewOffsetX = 420 - (this.nextPiece.shape[0].length * previewSize) / 2;
            const previewOffsetY = 150 - (this.nextPiece.shape.length * previewSize) / 2;

            for (let y = 0; y < this.nextPiece.shape.length; y++) {
                for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                    if (this.nextPiece.shape[y][x]) {
                        this.drawBlock(
                            previewOffsetX + x * previewSize,
                            previewOffsetY + y * previewSize,
                            previewSize - 1,
                            this.nextPiece.color,
                            0.8
                        );
                    }
                }
            }
        }

        this.ctx.fillStyle = '#aaaaaa';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('← → Move', 80, 620);
        this.ctx.fillText('↑ Rotate', 80, 640);
        this.ctx.fillText('↓ Soft Drop', 180, 620);
        this.ctx.fillText('SPACE Hard Drop', 180, 640);

        if (this.perfectClear) {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillText('PERFECT CLEAR!', 250, 320);
        }

        if (this.paused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, 500, 650);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', 250, 320);
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Press P to continue', 250, 360);
        }

        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            this.ctx.fillRect(0, 0, 500, 650);
            this.ctx.fillStyle = '#ff4444';
            this.ctx.font = '36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', 250, 280);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, 250, 330);
            this.ctx.fillText(`Lines: ${this.lines} | Level: ${this.level}`, 250, 365);
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Click or press Enter to restart', 250, 430);
        }
    },

    drawBlock(x, y, size, color, alpha = 1) {
        const gradient = this.ctx.createLinearGradient(x, y, x, y + size);
        gradient.addColorStop(0, this.lightenColor(color, 30));
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, this.darkenColor(color, 30));

        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = gradient;
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 5;
        this.ctx.fillRect(x, y, size, size);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(x, y, size, size / 4);

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(x, y + size - size / 4, size, size / 4);

        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, size, size);

        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1;
    },

    lightenColor(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, (num >> 16) + amount);
        const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
        const b = Math.min(255, (num & 0x0000FF) + amount);
        return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    },

    darkenColor(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, (num >> 16) - amount);
        const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
        const b = Math.max(0, (num & 0x0000FF) - amount);
        return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    },

    gameLoop() {
        this.update(0);
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TetrisBlitz;
}