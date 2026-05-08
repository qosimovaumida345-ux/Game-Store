// Racing Game 2 - Street Circuit Pro
// A complete racing game with tracks, upgrades, AI, and multiple race modes

(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = {
        state: 'menu',
        mode: 'career',
        
        // Game settings
        settings: {
            difficulty: 'normal',
            graphics: 'high',
            sound: true,
            music: true,
            controls: 'keyboard'
        },
        
        // Player data
        player: {
            name: 'Racer',
            car: {
                name: 'Street Racer',
                speed: 100,
                acceleration: 50,
                handling: 60,
                braking: 70,
                maxSpeed: 200,
                color: '#e74c3c',
                upgrades: {
                    engine: 0,
                    tires: 0,
                    brakes: 0,
                    aerodynamics: 0
                }
            },
            level: 1,
            xp: 0,
            xpToLevel: 500,
            money: 1000,
            totalRaces: 0,
            wins: 0,
            losses: 0,
            currentCar: 'street'
        },
        
        // Race state
        race: {
            active: false,
            type: 'sprint', // sprint, circuit, timeAttack, drag
            laps: 3,
            currentLap: 1,
            time: 0,
            bestLap: Infinity,
            checkpoints: [],
            position: 1,
            totalPositions: 8,
            
            // Track
            track: null,
            trackLength: 0,
            finishLine: 0,
            
            // Traffic
            traffic: [],
            obstacles: [],
            
            // Player car state
            playerCar: {
                x: 0,
                y: 0,
                angle: 0,
                speed: 0,
                velocityX: 0,
                velocityY: 0,
                onTrack: true,
                offRoad: false,
                nitro: 100,
                brake: 0,
                drift: 0,
                collisionCooldown: 0
            }
        },
        
        // Cars shop
        cars: [
            { id: 'street', name: 'Street Racer', price: 0, speed: 100, handling: 60, color: '#e74c3c' },
            { id: 'sport', name: 'Sport GT', price: 5000, speed: 130, handling: 75, color: '#3498db' },
            { id: 'super', name: 'Super Car', price: 15000, speed: 170, handling: 85, color: '#f1c40f' },
            { id: 'hyper', name: 'Hyper Car', price: 50000, speed: 220, handling: 95, color: '#9b59b6' },
            { id: 'legend', name: 'Legendary', price: 150000, speed: 280, handling: 100, color: '#2ecc71' }
        ],
        
        // Upgrades
        upgrades: {
            engine: [
                { level: 0, name: 'Stock Engine', price: 0, bonus: 0 },
                { level: 1, name: 'Tuned Engine', price: 500, bonus: 10 },
                { level: 2, name: 'Sport Engine', price: 2000, bonus: 25 },
                { level: 3, name: 'Racing Engine', price: 8000, bonus: 50 },
                { level: 4, name: 'Turbocharged', price: 25000, bonus: 100 }
            ],
            tires: [
                { level: 0, name: 'Stock Tires', price: 0, bonus: 0 },
                { level: 1, name: 'Performance Tires', price: 400, bonus: 10 },
                { level: 2, name: 'Sport Tires', price: 1500, bonus: 20 },
                { level: 3, name: 'Racing Tires', price: 6000, bonus: 40 },
                { level: 4, name: 'Slick Tires', price: 20000, bonus: 80 }
            ],
            brakes: [
                { level: 0, name: 'Stock Brakes', price: 0, bonus: 0 },
                { level: 1, name: 'Upgraded Brakes', price: 300, bonus: 10 },
                { level: 2, name: 'Sport Brakes', price: 1200, bonus: 25 },
                { level: 3, name: 'Racing Brakes', price: 5000, bonus: 50 },
                { level: 4, name: 'Carbon Ceramic', price: 15000, bonus: 100 }
            ],
            aerodynamics: [
                { level: 0, name: 'Stock Body', price: 0, bonus: 0 },
                { level: 1, name: 'Body Kit', price: 600, bonus: 10 },
                { level: 2, name: 'Sport Body', price: 2500, bonus: 20 },
                { level: 3, name: 'Racing Body', price: 10000, bonus: 40 },
                { level: 4, name: 'Carbon Fiber', price: 30000, bonus: 80 }
            ]
        },
        
        // Career tracks
        tracks: [
            { id: 'city', name: 'City Streets', difficulty: 1, type: 'circuit', laps: 3, prize: 500, length: 5000, color: '#34495e' },
            { id: 'desert', name: 'Desert Run', difficulty: 2, type: 'sprint', laps: 1, prize: 800, length: 8000, color: '#d35400' },
            { id: 'mountain', name: 'Mountain Pass', difficulty: 3, type: 'circuit', laps: 5, prize: 2000, length: 12000, color: '#7f8c8d' },
            { id: 'highway', name: 'Midnight Highway', difficulty: 2, type: 'drag', laps: 1, prize: 1000, length: 2000, color: '#2c3e50' },
            { id: 'island', name: 'Island Circuit', difficulty: 4, type: 'circuit', laps: 7, prize: 5000, length: 15000, color: '#1abc9c' },
            { id: 'industrial', name: 'Industrial Zone', difficulty: 3, type: 'sprint', laps: 1, prize: 1500, length: 6000, color: '#5d6d7e' }
        ],
        
        // AI opponents
        opponents: [],
        
        // Graphics
        particles: [],
        effects: [],
        
        // Camera
        camera: { x: 0, y: 0, zoom: 1 },
        
        // UI state
        ui: {
            selectedCar: 0,
            selectedTrack: 0,
            selectedUpgrade: 'engine',
            confirmPurchase: false,
            showResults: false,
            results: null
        },
        
        // Time
        time: 0,
        
        // Audio
        audio: null
    };

    // ============= INITIALIZATION =============

    function initGame() {
        console.log('Street Circuit Pro initialized');
        
        // Generate first track
        generateTrack(game.tracks[0]);
        
        // Initialize player position
        resetPlayerPosition();
    }

    function generateTrack(trackData) {
        game.race.track = {
            ...trackData,
            points: [],
            width: 40,
            checkpoints: []
        };
        
        // Generate track based on type
        if (trackData.type === 'circuit') {
            generateCircuitTrack(trackData);
        } else if (trackData.type === 'sprint') {
            generateSprintTrack(trackData);
        } else if (trackData.type === 'drag') {
            generateDragTrack(trackData);
        }
        
        // Calculate total length
        calculateTrackLength();
        
        // Create checkpoints
        createCheckpoints();
    }

    function generateCircuitTrack(trackData) {
        const points = [];
        const centerX = 400;
        const centerY = 300;
        const radiusX = 250;
        const radiusY = 180;
        
        // Create oval/circuit shape
        for (let i = 0; i <= 360; i += 10) {
            const angle = (i * Math.PI) / 180;
            
            // Add some variation for more interesting track
            const variation = Math.sin(angle * 3) * 30;
            
            const x = centerX + Math.cos(angle) * (radiusX + variation);
            const y = centerY + Math.sin(angle) * (radiusY + variation);
            
            points.push({ x, y });
        }
        
        // Add some straight sections and chicanes
        const chicanePoints = [
            { x: 200, y: 150 },
            { x: 250, y: 120 },
            { x: 300, y: 150 },
            { x: 350, y: 180 }
        ];
        
        // Insert chicane into track
        const insertIndex = Math.floor(points.length * 0.25);
        points.splice(insertIndex, 0, ...chicanePoints);
        
        game.race.track.points = points;
        game.race.finishLine = 0;
    }

    function generateSprintTrack(trackData) {
        const points = [];
        
        // Straight start
        points.push({ x: 100, y: 300 });
        points.push({ x: 200, y: 300 });
        
        // First turn
        points.push({ x: 250, y: 320 });
        points.push({ x: 280, y: 350 });
        
        // S-curves
        points.push({ x: 300, y: 400 });
        points.push({ x: 350, y: 350 });
        points.push({ x: 400, y: 400 });
        points.push({ x: 450, y: 350 });
        
        // Long straight
        points.push({ x: 500, y: 320 });
        points.push({ x: 600, y: 320 });
        
        // Final turn
        points.push({ x: 650, y: 350 });
        points.push({ x: 680, y: 400 });
        
        // Finish straight
        points.push({ x: 700, y: 450 });
        
        game.race.track.points = points;
    }

    function generateDragTrack(trackData) {
        const points = [];
        
        // Simple drag strip - straight line with slight curve
        for (let i = 0; i <= 20; i++) {
            const x = 100 + i * 40;
            const y = 300 + Math.sin(i * 0.3) * 10;
            points.push({ x, y });
        }
        
        game.race.track.points = points;
    }

    function calculateTrackLength() {
        let length = 0;
        const points = game.race.track.points;
        
        for (let i = 1; i < points.length; i++) {
            const dx = points[i].x - points[i-1].x;
            const dy = points[i].y - points[i-1].y;
            length += Math.sqrt(dx * dx + dy * dy);
        }
        
        // Close the loop for circuit
        if (game.race.track.type === 'circuit') {
            const dx = points[0].x - points[points.length-1].x;
            const dy = points[0].y - points[points.length-1].y;
            length += Math.sqrt(dx * dx + dy * dy);
        }
        
        game.race.trackLength = length;
    }

    function createCheckpoints() {
        const points = game.race.track.points;
        const checkpointCount = 5;
        
        for (let i = 1; i < checkpointCount; i++) {
            const index = Math.floor((points.length - 1) * (i / checkpointCount));
            game.race.track.checkpoints.push({
                index: index,
                passed: false,
                time: 0
            });
        }
    }

    function resetPlayerPosition() {
        const points = game.race.track.points;
        if (points.length > 0) {
            game.race.playerCar.x = points[0].x;
            game.race.playerCar.y = points[0].y;
            game.race.playerCar.angle = getTrackAngle(0);
            game.race.playerCar.speed = 0;
            game.race.playerCar.velocityX = 0;
            game.race.playerCar.velocityY = 0;
        }
    }

    function getTrackAngle(pointIndex) {
        const points = game.race.track.points;
        
        if (pointIndex >= points.length - 1) return 0;
        if (pointIndex < 0) pointIndex = 0;
        
        const p1 = points[pointIndex];
        const p2 = points[pointIndex + 1];
        
        return Math.atan2(p2.y - p1.y, p2.x - p1.x);
    }

    // ============= INPUT HANDLING =============

    function handleInput(data) {
        if (game.state === 'menu') {
            handleMenuInput(data);
        } else if (game.state === 'race') {
            handleRaceInput(data);
        } else if (game.state === 'shop') {
            handleShopInput(data);
        } else if (game.state === 'results') {
            handleResultsInput(data);
        }
    }

    function handleMenuInput(data) {
        if (data.keyboard) {
            if (data.keyboard['ArrowUp'] || data.keyboard['w'] || data.keyboard['W']) {
                game.ui.selectedCar = Math.max(0, game.ui.selectedCar - 1);
            }
            if (data.keyboard['ArrowDown'] || data.keyboard['s'] || data.keyboard['S']) {
                game.ui.selectedCar = Math.min(game.cars.length - 1, game.ui.selectedCar + 1);
            }
            if (data.keyboard['Enter'] || data.keyboard[' ']) {
                selectCar(game.ui.selectedCar);
            }
            if (data.keyboard['1']) {
                startRace('sprint');
            }
            if (data.keyboard['2']) {
                startRace('circuit');
            }
            if (data.keyboard['3']) {
                startRace('timeAttack');
            }
            if (data.keyboard['4']) {
                startRace('drag');
            }
            if (data.keyboard['k'] || data.keyboard['K']) {
                game.state = 'shop';
            }
            if (data.keyboard['m'] || data.keyboard['M']) {
                game.state = 'garage';
            }
        }
    }

    function handleRaceInput(data) {
        const car = game.race.playerCar;
        const playerCar = game.player.car;
        
        // Acceleration
        if (data.up || (data.keyboard && (data.keyboard['ArrowUp'] || data.keyboard['w'] || data.keyboard['W']))) {
            car.speed += playerCar.acceleration * 0.01;
        }
        
        // Braking
        if (data.down || (data.keyboard && (data.keyboard['ArrowDown'] || data.keyboard['s'] || data.keyboard['S']))) {
            car.speed -= playerCar.braking * 0.02;
            car.brake = 1;
        } else {
            car.brake = 0;
        }
        
        // Steering
        if (data.left || (data.keyboard && data.keyboard['ArrowLeft'])) {
            car.angle -= 0.04 * (car.speed / playerCar.maxSpeed + 0.3);
        }
        if (data.right || (data.keyboard && data.keyboard['ArrowRight'])) {
            car.angle += 0.04 * (car.speed / playerCar.maxSpeed + 0.3);
        }
        
        // Nitro
        if ((data.special || (data.keyboard && data.keyboard['Shift'])) && car.nitro > 0) {
            car.speed += playerCar.acceleration * 0.02;
            car.nitro -= 0.5;
            
            // Add nitro particles
            createNitroParticles();
        } else if (car.nitro < 100) {
            car.nitro += 0.1;
        }
        
        // Drift
        if ((data.keyboard && data.keyboard['Space']) && car.speed > 20) {
            car.drift = Math.min(1, car.drift + 0.1);
            car.speed *= 0.99;
        } else {
            car.drift = Math.max(0, car.drift - 0.05);
        }
        
        // Use skill (if implemented)
        if (data.keyboard && data.keyboard['e']) {
            useSkill();
        }
    }

    function handleShopInput(data) {
        if (data.keyboard) {
            if (data.keyboard['ArrowUp'] || data.keyboard['w']) {
                game.ui.selectedUpgrade = 'engine';
            }
            if (data.keyboard['ArrowDown'] || data.keyboard['s']) {
                game.ui.selectedUpgrade = 'tires';
            }
            if (data.keyboard['Enter'] || data.keyboard[' ']) {
                buyUpgrade(game.ui.selectedUpgrade);
            }
            if (data.keyboard['Escape']) {
                game.state = 'menu';
            }
        }
    }

    function handleResultsInput(data) {
        if (data.keyboard && (data.keyboard['Enter'] || data.keyboard[' '])) {
            game.state = 'menu';
            game.race.active = false;
        }
    }

    // ============= GAME ACTIONS =============

    function selectCar(index) {
        const car = game.cars[index];
        
        if (game.player.money >= car.price || index === 0) {
            game.player.currentCar = car.id;
            game.player.car.name = car.name;
            game.player.car.color = car.color;
            game.player.car.speed = car.speed;
            game.player.car.handling = car.handling;
        }
    }

    function startRace(type) {
        game.state = 'race';
        game.race.active = true;
        game.race.type = type;
        game.race.time = 0;
        game.race.currentLap = 1;
        game.race.bestLap = Infinity;
        game.race.position = 1;
        
        // Setup race based on type
        if (type === 'sprint') {
            game.race.laps = 1;
        } else if (type === 'circuit') {
            game.race.laps = 3;
        } else if (type === 'timeAttack') {
            game.race.laps = 1;
            game.race.time = 180; // 3 minutes
        } else if (type === 'drag') {
            game.race.laps = 1;
        }
        
        // Reset player
        resetPlayerPosition();
        game.race.playerCar.nitro = 100;
        
        // Reset checkpoints
        game.race.track.checkpoints.forEach(cp => cp.passed = false);
        
        // Spawn opponents
        spawnOpponents();
        
        console.log(`Race started: ${type}`);
    }

    function spawnOpponents() {
        game.race.traffic = [];
        
        const opponentCount = Math.min(7, game.race.totalPositions - 1);
        
        for (let i = 0; i < opponentCount; i++) {
            const points = game.race.track.points;
            const startIndex = Math.floor(Math.random() * 5);
            
            game.race.traffic.push({
                id: i,
                name: `AI Racer ${i + 1}`,
                x: points[startIndex].x + (Math.random() - 0.5) * 20,
                y: points[startIndex].y + (Math.random() - 0.5) * 20,
                angle: getTrackAngle(startIndex),
                speed: 0,
                maxSpeed: 150 + Math.random() * 50,
                acceleration: 40 + Math.random() * 20,
                handling: 50 + Math.random() * 30,
                progress: startIndex / points.length,
                lap: 1,
                color: ['#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#e67e22', '#1abc9c'][i % 6],
                skill: 0.5 + Math.random() * 0.4
            });
        }
        
        game.race.totalPositions = game.race.traffic.length + 1;
    }

    function useSkill() {
        // Nitro boost
        game.race.playerCar.nitro = Math.min(100, game.race.playerCar.nitro + 30);
        createEffect('nitro', game.race.playerCar.x, game.race.playerCar.y);
    }

    function buyUpgrade(type) {
        const upgradePath = game.upgrades[type];
        const currentLevel = game.player.car.upgrades[type];
        
        if (currentLevel >= upgradePath.length - 1) {
            return; // Max level
        }
        
        const upgrade = upgradePath[currentLevel + 1];
        
        if (game.player.money >= upgrade.price) {
            game.player.money -= upgrade.price;
            game.player.car.upgrades[type] = currentLevel + 1;
            
            // Apply bonuses
            if (type === 'engine') {
                game.player.car.speed += upgrade.bonus;
            } else if (type === 'tires') {
                game.player.car.handling += upgrade.bonus;
            } else if (type === 'brakes') {
                game.player.car.braking += upgrade.bonus;
            } else if (type === 'aerodynamics') {
                game.player.car.maxSpeed += upgrade.bonus;
            }
        }
    }

    // ============= UPDATE =============

    function update() {
        if (game.state !== 'race' || !game.race.active) {
            return;
        }
        
        game.time++;
        game.race.time += 1/60;
        
        // Update player
        updatePlayerCar();
        
        // Update AI
        updateOpponents();
        
        // Check race end conditions
        checkRaceEnd();
        
        // Update particles
        updateParticles();
        
        // Update camera
        updateCamera();
        
        // Update effects
        updateEffects();
    }

    function updatePlayerCar() {
        const car = game.race.playerCar;
        const playerCar = game.player.car;
        
        // Physics
        car.speed = Math.max(0, Math.min(playerCar.maxSpeed, car.speed));
        
        // Apply friction
        if (car.speed > 0) {
            car.speed *= 0.995;
        }
        
        // Calculate velocity based on angle and speed
        const speedMultiplier = car.drift > 0 ? (1 + car.drift * 0.5) : 1;
        
        car.velocityX = Math.cos(car.angle) * car.speed * speedMultiplier * 0.5;
        car.velocityY = Math.sin(car.angle) * car.speed * speedMultiplier * 0.5;
        
        // Update position
        car.x += car.velocityX;
        car.y += car.velocityY;
        
        // Track following
        updateTrackPosition(car);
        
        // Collision detection
        if (car.collisionCooldown > 0) {
            car.collisionCooldown--;
        } else {
            checkTrafficCollision();
        }
        
        // Off-road detection
        checkOffRoad();
        
        // Check checkpoints
        checkCheckpoints();
        
        // Create exhaust particles
        if (car.speed > 10) {
            createExhaustParticles();
        }
    }

    function updateTrackPosition(car) {
        const points = game.race.track.points;
        const trackWidth = game.race.track.width;
        
        // Find closest point on track
        let closestDist = Infinity;
        let closestPoint = 0;
        
        for (let i = 0; i < points.length; i++) {
            const dx = car.x - points[i].x;
            const dy = car.y - points[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < closestDist) {
                closestDist = dist;
                closestPoint = i;
            }
        }
        
        // Calculate progress
        const progress = closestPoint / points.length;
        
        // Update lap count
        if (progress < 0.1 && game.race.playerCar.progress > 0.9) {
            if (game.race.type === 'circuit') {
                game.race.currentLap++;
                
                // Check for lap time record
                if (game.race.bestLap === Infinity || game.race.time < game.race.bestLap) {
                    game.race.bestLap = game.race.time;
                }
            }
        }
        
        game.race.playerCar.progress = progress;
        
        // Update position
        game.race.position = 1;
        
        // Calculate total race progress
        let totalProgress = (game.race.currentLap - 1) + progress;
        
        game.race.traffic.forEach(opponent => {
            const opponentTotal = (opponent.lap - 1) + opponent.progress;
            if (totalProgress < opponentTotal) {
                game.race.position++;
            }
        });
    }

    function updateOpponents() {
        game.race.traffic.forEach(opponent => {
            // AI logic
            const targetSpeed = opponent.maxSpeed * opponent.skill;
            
            // Accelerate towards target speed
            if (opponent.speed < targetSpeed) {
                opponent.speed += opponent.acceleration * 0.01;
            }
            
            // Find next waypoint
            const points = game.race.track.points;
            const nextIndex = Math.floor(opponent.progress * (points.length - 1)) + 1;
            
            if (nextIndex < points.length) {
                const target = points[nextIndex];
                
                // Calculate angle to target
                const dx = target.x - opponent.x;
                const dy = target.y - opponent.y;
                const targetAngle = Math.atan2(dy, dx);
                
                // Steer towards target
                let angleDiff = targetAngle - opponent.angle;
                
                // Normalize angle
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                
                opponent.angle += angleDiff * opponent.handling * 0.001;
            }
            
            // Update position
            opponent.x += Math.cos(opponent.angle) * opponent.speed * 0.5;
            opponent.y += Math.sin(opponent.angle) * opponent.speed * 0.5;
            
            // Update progress
            opponent.progress = nextIndex / points.length;
            
            // Check for lap completion
            if (opponent.progress > 0.95 && game.race.type === 'circuit') {
                opponent.lap++;
                opponent.progress = 0;
            }
        });
    }

    function checkTrafficCollision() {
        const car = game.race.playerCar;
        
        game.race.traffic.forEach(opponent => {
            const dx = car.x - opponent.x;
            const dy = car.y - opponent.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 30) {
                // Collision
                car.speed *= 0.3;
                car.collisionCooldown = 30;
                
                // Push apart
                const angle = Math.atan2(dy, dx);
                car.x += Math.cos(angle) * 10;
                car.y += Math.sin(angle) * 10;
                
                createCollisionParticles(car.x, car.y);
            }
        });
    }

    function checkOffRoad() {
        const car = game.race.playerCar;
        const points = game.race.track.points;
        
        let onTrack = false;
        
        for (let i = 0; i < points.length; i++) {
            const dx = car.x - points[i].x;
            const dy = car.y - points[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < game.race.track.width / 2 + 10) {
                onTrack = true;
                break;
            }
        }
        
        if (!onTrack && !car.offRoad) {
            car.offRoad = true;
            car.speed *= 0.5;
        } else if (onTrack) {
            car.offRoad = false;
        }
    }

    function checkCheckpoints() {
        const car = game.race.playerCar;
        const progress = car.progress;
        
        game.race.track.checkpoints.forEach((cp, index) => {
            const cpProgress = cp.index / game.race.track.points.length;
            
            if (!cp.passed && progress > cpProgress) {
                cp.passed = true;
                cp.time = game.race.time;
            }
        });
    }

    function checkRaceEnd() {
        // Check lap completion for circuit
        if (game.race.type === 'circuit') {
            if (game.race.currentLap > game.race.laps) {
                endRace(true);
            }
        }
        
        // Check time for time attack
        if (game.race.type === 'timeAttack') {
            if (game.race.time <= 0) {
                endRace(false);
            }
        }
        
        // Check drag race completion
        if (game.race.type === 'drag') {
            const points = game.race.track.points;
            const finishX = points[points.length - 1].x;
            
            if (game.race.playerCar.x >= finishX - 50) {
                endRace(true);
            }
        }
    }

    function endRace(finished) {
        game.race.active = false;
        game.state = 'results';
        
        // Calculate results
        const results = {
            position: game.race.position,
            time: game.race.time,
            bestLap: game.race.bestLap,
            won: game.race.position === 1,
            prize: 0,
            xp: 0
        };
        
        // Calculate prize and XP
        if (results.won) {
            const track = game.tracks[game.ui.selectedTrack];
            results.prize = track.prize;
            results.xp = track.prize * 2;
        } else {
            const track = game.tracks[game.ui.selectedTrack];
            results.prize = Math.floor(track.prize * (1 - game.race.position / game.race.totalPositions));
            results.xp = track.prize;
        }
        
        // Give rewards
        game.player.money += results.prize;
        game.player.xp += results.xp;
        game.player.totalRaces++;
        
        if (results.won) {
            game.player.wins++;
        } else {
            game.player.losses++;
        }
        
        // Check level up
        if (game.player.xp >= game.player.xpToLevel) {
            levelUp();
        }
        
        // Store results
        game.ui.results = results;
    }

    function levelUp() {
        game.player.level++;
        game.player.xp -= game.player.xpToLevel;
        game.player.xpToLevel = Math.floor(game.player.xpToLevel * 1.5);
        
        // Give stat bonuses
        game.player.car.speed += 5;
        game.player.car.handling += 3;
        game.player.car.acceleration += 3;
    }

    function updateCamera() {
        const car = game.race.playerCar;
        
        game.camera.x = car.x - canvas.width / 2;
        game.camera.y = car.y - canvas.height / 2;
    }

    // ============= PARTICLES =============

    function createExhaustParticles() {
        const car = game.race.playerCar;
        
        game.particles.push({
            type: 'exhaust',
            x: car.x - Math.cos(car.angle) * 15,
            y: car.y - Math.sin(car.angle) * 15,
            vx: -Math.cos(car.angle) * 2 + (Math.random() - 0.5),
            vy: -Math.sin(car.angle) * 2 + (Math.random() - 0.5),
            life: 20,
            maxLife: 20,
            size: 5 + Math.random() * 5,
            color: '#555'
        });
    }

    function createNitroParticles() {
        const car = game.race.playerCar;
        
        for (let i = 0; i < 5; i++) {
            game.particles.push({
                type: 'nitro',
                x: car.x - Math.cos(car.angle) * 20,
                y: car.y - Math.sin(car.angle) * 20,
                vx: -Math.cos(car.angle) * 5 + (Math.random() - 0.5) * 3,
                vy: -Math.sin(car.angle) * 5 + (Math.random() - 0.5) * 3,
                life: 15,
                maxLife: 15,
                size: 8 + Math.random() * 8,
                color: '#f1c40f'
            });
        }
    }

    function createCollisionParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            game.particles.push({
                type: 'collision',
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 20,
                maxLife: 20,
                size: 4 + Math.random() * 4,
                color: '#e74c3c'
            });
        }
    }

    function createEffect(type, x, y) {
        game.effects.push({
            type: type,
            x: x,
            y: y,
            life: 30,
            maxLife: 30
        });
    }

    function updateParticles() {
        game.particles = game.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            
            return p.life > 0;
        });
    }

    function updateEffects() {
        game.effects = game.effects.filter(e => {
            e.life--;
            
            return e.life > 0;
        });
    }

    // ============= RENDERING =============

    function draw() {
        // Clear screen
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (game.state === 'menu') {
            drawMenu();
        } else if (game.state === 'race') {
            drawRace();
        } else if (game.state === 'shop') {
            drawShop();
        } else if (game.state === 'garage') {
            drawGarage();
        } else if (game.state === 'results') {
            drawResults();
        }
        
        // Draw particles
        game.particles.forEach(p => {
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x - game.camera.x, p.y - game.camera.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        // Draw effects
        game.effects.forEach(e => {
            ctx.globalAlpha = e.life / e.maxLife;
            
            if (e.type === 'nitro') {
                ctx.fillStyle = '#f1c40f';
                ctx.beginPath();
                ctx.arc(e.x - game.camera.x, e.y - game.camera.y, 30 * (1 - e.life / e.maxLife), 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.globalAlpha = 1;
        });
    }

    function drawMenu() {
        // Title
        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('STREET CIRCUIT PRO', canvas.width / 2, 100);
        
        // Menu options
        ctx.fillStyle = '#fff';
        ctx.font = '30px Arial';
        
        const options = [
            { text: 'Sprint Race (1)', key: '1' },
            { text: 'Circuit Race (2)', key: '2' },
            { text: 'Time Attack (3)', key: '3' },
            { text: 'Drag Race (4)', key: '4' },
            { text: 'Garage (M)', key: 'M' },
            { text: 'Shop (K)', key: 'K' }
        ];
        
        options.forEach((opt, index) => {
            const y = 200 + index * 50;
            
            if (index === game.ui.selectedCar) {
                ctx.fillStyle = '#f1c40f';
            } else {
                ctx.fillStyle = '#fff';
            }
            
            ctx.fillText(opt.text, canvas.width / 2, y);
        });
        
        // Stats
        ctx.fillStyle = '#aaa';
        ctx.font = '20px Arial';
        ctx.fillText(`Level: ${game.player.level} | Money: $${game.player.money}`, canvas.width / 2, 500);
        ctx.fillText(`Wins: ${game.player.wins} | Races: ${game.player.totalRaces}`, canvas.width / 2, 530);
    }

    function drawRace() {
        // Draw track
        drawTrack();
        
        // Draw traffic
        drawTraffic();
        
        // Draw player
        drawPlayerCar();
        
        // Draw HUD
        drawHUD();
    }

    function drawTrack() {
        const points = game.race.track.points;
        
        if (points.length < 2) return;
        
        // Draw track surface
        ctx.strokeStyle = '#333';
        ctx.lineWidth = game.race.track.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(points[0].x - game.camera.x, points[0].y - game.camera.y);
        
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x - game.camera.x, points[i].y - game.camera.y);
        }
        
        // Close circuit
        if (game.race.track.type === 'circuit') {
            ctx.lineTo(points[0].x - game.camera.x, points[0].y - game.camera.y);
        }
        
        ctx.stroke();
        
        // Draw track lines
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        
        ctx.setLineDash([20, 20]);
        
        ctx.beginPath();
        ctx.moveTo(points[0].x - game.camera.x, points[0].y - game.camera.y);
        
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x - game.camera.x, points[i].y - game.camera.y);
        }
        
        if (game.race.track.type === 'circuit') {
            ctx.lineTo(points[0].x - game.camera.x, points[0].y - game.camera.y);
        }
        
        ctx.stroke();
        
        ctx.setLineDash([]);
        
        // Draw start/finish line
        const startX = points[0].x - game.camera.x;
        const startY = points[0].y - game.camera.y;
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(startX - 3, startY - 15, 6, 30);
        
        // Checkers
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = (i % 2 === 0) ? '#000' : '#fff';
            ctx.fillRect(startX - 3, startY - 15 + i * 8, 3, 8);
        }
    }

    function drawTraffic() {
        game.race.traffic.forEach(opponent => {
            const screenX = opponent.x - game.camera.x;
            const screenY = opponent.y - game.camera.y;
            
            if (screenX < -50 || screenX > canvas.width + 50) return;
            
            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(opponent.angle);
            
            ctx.fillStyle = opponent.color;
            ctx.fillRect(-15, -8, 30, 16);
            
            ctx.fillStyle = '#222';
            ctx.fillRect(10, -5, 8, 10);
            
            ctx.restore();
            
            // Name
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(opponent.name, screenX, screenY - 15);
        });
    }

    function drawPlayerCar() {
        const car = game.race.playerCar;
        const screenX = car.x - game.camera.x;
        const screenY = car.y - game.camera.y;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(car.angle);
        
        // Car body
        ctx.fillStyle = game.player.car.color;
        ctx.fillRect(-18, -10, 36, 20);
        
        // Windshield
        ctx.fillStyle = '#333';
        ctx.fillRect(5, -7, 10, 14);
        
        // Wheels
        ctx.fillStyle = '#000';
        ctx.fillRect(-15, -12, 8, 4);
        ctx.fillRect(-15, 8, 8, 4);
        ctx.fillRect(7, -12, 8, 4);
        ctx.fillRect(7, 8, 8, 4);
        
        // Headlights
        ctx.fillStyle = '#ffeb3b';
        ctx.fillRect(15, -6, 4, 4);
        ctx.fillRect(15, 2, 4, 4);
        
        // Nitro indicator
        if (car.nitro < 30) {
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(-10, -15, 20, 3);
        }
        
        ctx.restore();
    }

    function drawHUD() {
        // Position
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(20, 20, 150, 80);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'left';
        
        const pos = game.race.position;
        ctx.fillStyle = pos === 1 ? '#ffd700' : pos === 2 ? '#c0c0c0' : pos === 3 ? '#cd7f32' : '#fff';
        ctx.fillText(`#${pos}`, 30, 50);
        
        ctx.fillStyle = '#aaa';
        ctx.font = '16px Arial';
        ctx.fillText(`/ ${game.race.totalPositions}`, 80, 50);
        
        // Time
        const minutes = Math.floor(game.race.time / 60);
        const seconds = Math.floor(game.race.time % 60);
        ctx.font = '20px Arial';
        ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, 30, 80);
        
        // Speed
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvas.width - 120, 20, 100, 60);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.floor(game.race.playerCar.speed * 3)}`, canvas.width - 30, 45);
        ctx.font = '12px Arial';
        ctx.fillText('KM/H', canvas.width - 30, 65);
        
        // Lap
        if (game.race.type === 'circuit') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(20, canvas.height - 60, 120, 40);
            
            ctx.fillStyle = '#fff';
            ctx.font = '18px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`Lap ${game.race.currentLap}/${game.race.laps}`, 30, canvas.height - 35);
        }
        
        // Nitro bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvas.width / 2 - 75, canvas.height - 40, 150, 20);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(canvas.width / 2 - 70, canvas.height - 35, 140, 10);
        
        ctx.fillStyle = game.race.playerCar.nitro > 30 ? '#f1c40f' : '#e74c3c';
        ctx.fillRect(canvas.width / 2 - 70, canvas.height - 35, 140 * (game.race.playerCar.nitro / 100), 10);
        
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('NITRO (Shift)', canvas.width / 2, canvas.height - 45);
    }

    function drawShop() {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('UPGRADE SHOP', canvas.width / 2, 80);
        
        ctx.font = '20px Arial';
        ctx.fillText(`Your Money: $${game.player.money}`, canvas.width / 2, 120);
        
        const upgrades = Object.keys(game.upgrades);
        
        upgrades.forEach((type, index) => {
            const currentLevel = game.player.car.upgrades[type];
            const upgrade = game.upgrades[type][currentLevel];
            const nextUpgrade = game.upgrades[type][Math.min(currentLevel + 1, game.upgrades[type].length - 1)];
            
            const y = 180 + index * 80;
            
            ctx.fillStyle = index === 0 ? '#f1c40f' : '#fff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(type.toUpperCase(), 100, y);
            
            ctx.fillStyle = '#aaa';
            ctx.font = '16px Arial';
            ctx.fillText(`Current: ${upgrade.name}`, 100, y + 25);
            
            if (currentLevel < game.upgrades[type].length - 1) {
                ctx.fillStyle = game.player.money >= nextUpgrade.price ? '#2ecc71' : '#e74c3c';
                ctx.fillText(`Upgrade: ${nextUpgrade.name} - $${nextUpgrade.price}`, 100, y + 45);
            } else {
                ctx.fillStyle = '#ffd700';
                ctx.fillText('MAX LEVEL', 100, y + 45);
            }
        });
        
        ctx.fillStyle = '#aaa';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Press ENTER to upgrade | ESC to exit', canvas.width / 2, canvas.height - 30);
    }

    function drawGarage() {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GARAGE', canvas.width / 2, 80);
        
        game.cars.forEach((car, index) => {
            const y = 150 + index * 60;
            
            ctx.fillStyle = game.player.currentCar === car.id ? '#2ecc71' : '#444';
            ctx.fillRect(150, y - 30, 400, 50);
            
            ctx.fillStyle = car.color;
            ctx.fillRect(160, y - 20, 30, 30);
            
            ctx.fillStyle = '#fff';
            ctx.font = '18px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(car.name, 200, y);
            
            ctx.fillStyle = '#aaa';
            ctx.font = '14px Arial';
            ctx.fillText(`Speed: ${car.speed} | Handling: ${car.handling}`, 200, y + 20);
            
            if (car.price > 0) {
                ctx.fillStyle = game.player.money >= car.price ? '#2ecc71' : '#e74c3c';
                ctx.fillText(`$${car.price}`, 580, y);
            }
        });
        
        ctx.fillStyle = '#aaa';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Press ENTER to select | ESC to exit', canvas.width / 2, canvas.height - 30);
    }

    function drawResults() {
        const results = game.ui.results;
        
        if (!results) return;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = results.won ? '#ffd700' : '#e74c3c';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        
        if (results.won) {
            ctx.fillText('VICTORY!', canvas.width / 2, 150);
        } else {
            ctx.fillText('RACE COMPLETE', canvas.width / 2, 150);
        }
        
        ctx.fillStyle = '#fff';
        ctx.font = '30px Arial';
        ctx.fillText(`Position: #${results.position}`, canvas.width / 2, 230);
        ctx.fillText(`Time: ${Math.floor(results.time / 60)}:${Math.floor(results.time % 60).toString().padStart(2, '0')}`, canvas.width / 2, 280);
        
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`Prize: $${results.prize}`, canvas.width / 2, 330);
        ctx.fillText(`XP: +${results.xp}`, canvas.width / 2, 370);
        
        ctx.fillStyle = '#aaa';
        ctx.font = '20px Arial';
        ctx.fillText('Press ENTER to continue', canvas.width / 2, 450);
    }

    // ============= GAME LOOP =============

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    // Initialize and start
    initGame();
    
    // Expose handleInput globally
    if (typeof window !== 'undefined') {
        window.gameHandleInput = handleInput;
    }
    
    // Start the game
    gameLoop();
})();