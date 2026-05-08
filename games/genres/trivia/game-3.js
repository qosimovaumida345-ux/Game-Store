class TriviaGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.questions = [];
        this.currentQuestion = 0;
        this.score = 0;
        this.gameState = 'start';
        this.selectedAnswer = -1;
        this.showResult = false;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.questions = [
            { q: 'What is 2 + 2?', a: ['3', '4', '5', '6'], correct: 1 },
            { q: 'What is the capital of France?', a: ['London', 'Berlin', 'Paris', 'Madrid'], correct: 2 },
            { q: 'Which planet is closest to the sun?', a: ['Venus', 'Earth', 'Mercury', 'Mars'], correct: 2 },
            { q: 'What is 10 x 10?', a: ['100', '1000', '10', '10000'], correct: 0 },
            { q: 'How many legs does a spider have?', a: ['6', '8', '10', '4'], correct: 1 },
            { q: 'What is the largest ocean?', a: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], correct: 2 },
            { q: 'What color is a banana?', a: ['Red', 'Yellow', 'Green', 'Blue'], correct: 1 },
            { q: 'How many days in a year?', a: ['365', '360', '366', '364'], correct: 0 },
            { q: 'What is H2O?', a: ['Salt', 'Water', 'Sugar', 'Air'], correct: 1 },
            { q: 'Which animal is known as man best friend?', a: ['Cat', 'Dog', 'Horse', 'Rabbit'], correct: 1 }
        ];
    }

    start() {
        this.currentQuestion = 0;
        this.score = 0;
        this.gameState = 'playing';
        this.selectedAnswer = -1;
        this.showResult = false;
    }

    update() {}

    handleAnswer(idx) {
        if (this.showResult) return;

        this.selectedAnswer = idx;
        this.showResult = true;

        if (idx === this.questions[this.currentQuestion].correct) {
            this.score += 100;
        }

        setTimeout(() => {
            this.selectedAnswer = -1;
            this.showResult = false;
            this.currentQuestion++;

            if (this.currentQuestion >= this.questions.length) {
                this.gameState = 'end';
            }
        }, 1500);
    }

    render() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (this.gameState === 'playing') {
            const q = this.questions[this.currentQuestion];

            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Question ${this.currentQuestion + 1}/${this.questions.length}`, this.width / 2, 50);

            this.ctx.font = '20px Arial';
            this.ctx.fillText(q.q, this.width / 2, 120);

            for (let i = 0; i < 4; i++) {
                const x = 150 + (i % 2) * 350;
                const y = 200 + Math.floor(i / 2) * 80;

                let color = '#16213e';
                if (this.selectedAnswer === i) {
                    color = q.correct === i ? '#27ae60' : '#e74c3c';
                } else if (this.showResult && q.correct === i) {
                    color = '#27ae60';
                }

                this.ctx.fillStyle = color;
                this.ctx.fillRect(x, y, 300, 60);

                this.ctx.fillStyle = '#fff';
                this.ctx.font = '18px Arial';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(`${i + 1}. ${q.a[i]}`, x + 20, y + 35);
            }

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '18px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`Score: ${this.score}`, 20, 30);
        }

        if (this.gameState === 'end') {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('QUIZ COMPLETE!', this.width / 2, this.height / 2 - 60);
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2);
            this.ctx.fillText(`Correct: ${Math.floor(this.score / 100)}/${this.questions.length}`, this.width / 2, this.height / 2 + 40);
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Press SPACE to Restart', this.width / 2, this.height / 2 + 100);
        }

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('TRIVIA QUIZ', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Press 1-4 to answer', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2 + 50);
        }
    }

    handleKeyDown(key) {
        if (this.gameState === 'playing' && !this.showResult) {
            if (key === '1') this.handleAnswer(0);
            if (key === '2') this.handleAnswer(1);
            if (key === '3') this.handleAnswer(2);
            if (key === '4') this.handleAnswer(3);
        }
        if (key === ' ' && (this.gameState === 'start' || this.gameState === 'end')) {
            this.start();
        }
    }

    handleKeyUp(key) {}

    getState() { return { score: this.score, question: this.currentQuestion }; }
    setControllerData(data) {
        if (data.keys) for (const k of data.keys) this.handleKeyDown(k);
    }
}

window.TriviaGame = TriviaGame;