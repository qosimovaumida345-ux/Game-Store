class RhythmGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.lanes = 4;
        this.notes = [];
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.gameState = 'start';
        this.bpm = 120;
        this.lastBeat = 0;
        this.hits = { perfect: 0, good: 0, miss: 0 };
        this.keys = ['d', 'f', 'j', 'k'];
        this.keyStates = [false, false, false, false];
        this.noteSpeed = 5;
        this.pattern = [];
        this.patternIndex = 0;
        this.songProgress = 0;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.generatePattern();
    }

    generatePattern() {
        this.pattern = [];
        const patterns = [
            [0, 1, 2, 3],
            [0, 2, 1, 3],
            [1, 2, 0, 3],
            [0, 1, 0, 2],
            [1, 3, 2, 1],
            [0, 3, 1, 2],
            [0, 1, 2, 1],
            [2, 3, 0, 1],
            [1, 0, 3, 2],
            [0, 2, 0, 3]
        ];

        for (let i = 0; i < 200; i++) {
            const pattern = patterns[Math.floor(Math.random() * patterns.length)];
            for (const lane of pattern) {
                if (Math.random() < 0.7) {
                    this.pattern.push({ lane: lane, beat: i * 2 });
                }
            }
        }
    }

    update() {
        if (this.gameState !== 'playing') return;

        const currentBeat = Math.floor(this.songProgress / (60 / this.bpm) * 4);

        if (currentBeat > this.lastBeat) {
            this.lastBeat = currentBeat;

            for (const note of this.pattern) {
                if (note.beat === currentBeat) {
                    this.notes.push({
                        lane: note.lane,
                        y: -20,
                        hit: false,
                        beat: note.beat
                    });
                }
            }
        }

        for (const note of this.notes) {
            note.y += this.noteSpeed;
        }

        for (let i = this.notes.length - 1; i >= 0; i--) {
            const note = this.notes[i];

            if (note.y > this.height + 50) {
                if (!note.hit) {
                    this.combo = 0;
                    this.hits.miss++;
                }
                this.notes.splice(i, 1);
                continue;
            }

            if (note.hit && note.y > this.height - 100) {
                this.notes.splice(i, 1);
            }
        }

        this.songProgress += 1 / 60;

        if (this.songProgress > 120 || this.notes.length === 0 && this.patternIndex >= this.pattern.length) {
            this.gameState = 'end';
        }
    }

    checkHit(lane) {
        const hitZone = this.height - 100;
        const tolerance = 50;

        for (const note of this.notes) {
            if (note.lane === lane && !note.hit) {
                const dist = Math.abs(note.y - hitZone);

                if (dist < tolerance) {
                    note.hit = true;

                    if (dist < 15) {
                        this.score += 300 * (1 + this.combo * 0.1);
                        this.combo++;
                        this.hits.perfect++;
                    } else if (dist < 30) {
                        this.score += 100 * (1 + this.combo * 0.05);
                        this.combo++;
                        this.hits.good++;
                    } else {
                        this.score += 50;
                        this.combo = 0;
                        this.hits.miss++;
                    }

                    this.maxCombo = Math.max(this.maxCombo, this.combo);
                    return;
                }
            }
        }

        this.combo = 0;
    }

    render() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const laneWidth = this.width / this.lanes;
        const colors = ['#f44', '#44f', '#4f4', '#ff4'];

        for (let i = 0; i < this.lanes; i++) {
            const x = i * laneWidth;

            this.ctx.fillStyle = `rgba(${i % 2 === 0 ? '30,30,60' : '20,20,40'}, 0.5)`;
            this.ctx.fillRect(x, 0, laneWidth, this.height);

            this.ctx.strokeStyle = '#444';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, 0, laneWidth, this.height);

            this.ctx.fillStyle = colors[i];
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.keys[i].toUpperCase(), x + laneWidth / 2, this.height - 30);
        }

        const hitY = this.height - 100;
        for (let i = 0; i < this.lanes; i++) {
            this.ctx.fillStyle = this.keyStates[i] ? '#fff' : colors[i];
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillRect(i * laneWidth + 10, hitY - 10, laneWidth - 20, 20);
            this.ctx.globalAlpha = 1;
        }

        for (const note of this.notes) {
            if (note.hit) continue;

            const x = note.lane * laneWidth + laneWidth / 2;
            const y = note.y;

            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 25);
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(0.5, colors[note.lane]);
            gradient.addColorStop(1, 'transparent');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 25, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Score: ${Math.floor(this.score)}`, this.width - 20, 35);

        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Combo: ${this.combo}`, 20, 35);

        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#ff0';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Perfect: ${this.hits.perfect}`, this.width / 2 - 100, 30);
        this.ctx.fillStyle = '#0f0';
        this.ctx.fillText(`Good: ${this.hits.good}`, this.width / 2, 30);
        this.ctx.fillStyle = '#f00';
        this.ctx.fillText(`Miss: ${this.hits.miss}`, this.width / 2 + 100, 30);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('RHYTHM GAME', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('D F J K to hit notes', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        } else if (this.gameState === 'end') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('SONG COMPLETE!', this.width / 2, this.height / 2 - 60);

            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Final Score: ${Math.floor(this.score)}`, this.width / 2, this.height / 2);
            this.ctx.fillText(`Max Combo: ${this.maxCombo}`, this.width / 2, this.height / 2 + 40);

            const accuracy = this.hits.perfect + this.hits.good > 0 
                ? Math.floor((this.hits.perfect / (this.hits.perfect + this.hits.good + this.hits.miss)) * 100)
                : 0;
            this.ctx.fillText(`Accuracy: ${accuracy}%`, this.width / 2, this.height / 2 + 80);

            this.ctx.font = '20px Arial';
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 140);
        }
    }

    handleKeyDown(key) {
        const idx = this.keys.indexOf(key.toLowerCase());
        if (idx >= 0) {
            this.keyStates[idx] = true;
            if (this.gameState === 'playing') {
                this.checkHit(idx);
            }
        }

        if (key === ' ' && this.gameState !== 'playing') {
            this.start();
        }
    }

    handleKeyUp(key) {
        const idx = this.keys.indexOf(key.toLowerCase());
        if (idx >= 0) {
            this.keyStates[idx] = false;
        }
    }

    start() {
        this.gameState = 'playing';
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.notes = [];
        this.hits = { perfect: 0, good: 0, miss: 0 };
        this.lastBeat = 0;
        this.songProgress = 0;
        this.generatePattern();
    }

    getState() {
        return { score: Math.floor(this.score), combo: this.combo };
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

window.RhythmGame = RhythmGame;