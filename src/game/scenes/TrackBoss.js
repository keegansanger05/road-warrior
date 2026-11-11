import { BaseRace } from './BaseRace';

// Boss track: an angrier desert. Blood-red sky, scorched rock, sandstorm and
// embers. Everything is drawn in code, so it needs no image files. Ground
// collision uses groundHeightFn below.

const START_BUFFER = 500;
const RACE_LENGTH = 4000;
const FINISH_BUFFER = 500;
const TRACK_WIDTH = START_BUFFER + RACE_LENGTH + FINISH_BUFFER;
const WORLD_H = 768;
const BASE_Y = 736;
const FLAT_H = 64;

// Terrain profile: [x from the start of the race, height in px].
// Layout: flat start -> jagged bumps -> kicker -> pit field -> flat ramp
//         -> high plateau + drop -> final bumps -> flat finish.
const PROFILE = [
    [0, FLAT_H], [350, FLAT_H],                                    // flat start
    [450, 110], [540, 50], [680, 150], [780, 60],                  // jagged bumps
    [900, FLAT_H], [1000, FLAT_H],                                 // flat -> ramp
    [1300, 280],                                                   // KICKER: climb...
    [1450, 40],                                                    // ...and drop
    [1650, 40], [1800, 90], [1950, 170], [2050, 70], [2200, 130], [2300, 45],  // pit field
    [2450, FLAT_H], [2650, FLAT_H],                                // flat -> ramp
    [2900, 240], [3200, 250],                                      // climb to high plateau
    [3340, 50],                                                    // drop off the plateau
    [3500, 100], [3600, 55],                                       // final bumps
    [3750, FLAT_H], [4000, FLAT_H]                                 // flat finish run-in
];

// Ramps: race-relative x, launch speed up, launch speed forward.
const RAMPS = [
    [250, -800, 80],
    [920, -850, 80],
    [1290, -1000, 110],    // kicker lip
    [2550, -850, 80],
    [3170, -950, 110],     // plateau edge
    [3850, -760, 60]
];

function terrainHeight(raceX) {
    if (raceX <= PROFILE[0][0]) return PROFILE[0][1];
    const last = PROFILE[PROFILE.length - 1];
    if (raceX >= last[0]) return last[1];
    for (let i = 0; i < PROFILE.length - 1; i++) {
        const [x0, h0] = PROFILE[i];
        const [x1, h1] = PROFILE[i + 1];
        if (raceX >= x0 && raceX <= x1) {
            const t = (raceX - x0) / (x1 - x0);
            const s = (1 - Math.cos(Math.PI * t)) / 2;
            return h0 + (h1 - h0) * s;
        }
    }
    return FLAT_H;
}

// Deterministic pseudo-random number in [0, 1)
function rand(n, seed) {
    const v = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
    return v - Math.floor(v);
}

export class TrackBoss extends BaseRace {
    constructor() {
        super('TrackBoss');
    }

    create() {
        this.cameras.main.setBackgroundColor('#B8421A');

        // Gravity for this track only (lower = floatier). Match your other tracks.
        this.physics.world.gravity.y = 500;

        // Physics ground (BaseRace reads this everywhere)
        this.groundHeightFn = (x) => {
            const raceX = Math.min(Math.max(x - START_BUFFER, 0), RACE_LENGTH);
            return BASE_Y - terrainHeight(raceX);
        };

        this.drawSky();
        this.drawMesas(0.12, 0x5a1f1a, 560, 3, 200, 340);
        this.drawMesas(0.3, 0x3a1210, 650, 11, 120, 240);
        this.drawSandstorm();
        this.drawEmbers();
        this.drawTerrain();

        this.setupPlayer(80, 600);

        // One AI: the boss
        this.setupAIRacers(1, TRACK_WIDTH, 200);
        const boss = this.aiRacers[0];
        boss.setTexture('chainsawjack');
        boss.aiName = 'Chainsaw Jack';
        boss.aiSpeed = 300;
        boss.baseMaxVelocity = 400;

        this.snapToGround(this.player);
        this.aiRacers.forEach(ai => this.snapToGround(ai));

        this.setupCameraAndWorld(TRACK_WIDTH, WORLD_H);

        this.rewardTable = { 1: 200, 2: 75, 3: 50 };

        this.setupFinishLine(START_BUFFER + RACE_LENGTH);
        this.setupInput();
        this.setupProjectileAICollision();
        this.setupAIProjectilePlayerCollision();
        this.setupAIProjectileAICollision();
        this.startCountdown();
    }

    drawSky() {
        // Blood-red dusk, banded from near-black down to a burning horizon
        const g = this.add.graphics().setDepth(-100).setScrollFactor(0);
        const bands = [0x1b0a0a, 0x3d1210, 0x7a1f12, 0xb8421a, 0xe8761f, 0xf5a742];
        const h = WORLD_H / bands.length;
        bands.forEach((c, i) => {
            g.fillStyle(c, 1);
            g.fillRect(0, i * h, 1400, h + 1);
        });
        // Huge swollen sun
        this.add.circle(640, 330, 130, 0xff5a1f, 0.9).setDepth(-99).setScrollFactor(0.02);
        this.add.circle(640, 330, 200, 0xff5a1f, 0.22).setDepth(-99).setScrollFactor(0.02);
        this.add.circle(640, 330, 280, 0xff7a2f, 0.1).setDepth(-99).setScrollFactor(0.02);
    }

    drawMesas(factor, color, base, seed, minH, maxH) {
        // A parallax row of dark flat-topped mesas and spires
        const width = TRACK_WIDTH * factor + 1400;
        const g = this.add.graphics().setDepth(factor < 0.2 ? -92 : -88).setScrollFactor(factor);
        g.fillStyle(color, 1);
        let x = -20;
        let i = 0;
        while (x < width) {
            const w = 90 + rand(i, seed) * 160;
            const hgt = minH + rand(i + 40, seed) * (maxH - minH);
            const top = base - hgt;
            const taper = 10 + rand(i + 7, seed) * 30;

            // Flat-topped mesa with sloped sides
            g.beginPath();
            g.moveTo(x - taper, WORLD_H);
            g.lineTo(x, top);
            g.lineTo(x + w, top);
            g.lineTo(x + w + taper, WORLD_H);
            g.closePath();
            g.fillPath();

            // Occasional spire next to it
            if (rand(i + 90, seed) > 0.6) {
                const sx = x + w + taper + 10;
                const sh = hgt * (0.5 + rand(i + 3, seed) * 0.5);
                g.beginPath();
                g.moveTo(sx - 16, WORLD_H);
                g.lineTo(sx, base - sh);
                g.lineTo(sx + 16, WORLD_H);
                g.closePath();
                g.fillPath();
            }
            x += w + taper * 2 + 20 + rand(i + 9, seed) * 80;
            i++;
        }
    }

    drawSandstorm() {
        // Fast streaks of sand blowing across the screen
        for (let n = 0; n < 36; n++) {
            const streak = this.add.ellipse(
                Math.random() * 1280,
                Math.random() * 768,
                20 + Math.random() * 40,
                2,
                0xf0b878,
                0.2 + Math.random() * 0.25
            );
            streak.setDepth(-70).setScrollFactor(0);
            this.tweens.add({
                targets: streak,
                x: 1400,
                duration: 900 + Math.random() * 1500,
                delay: Math.random() * 2000,
                repeat: -1,
                onRepeat: () => {
                    streak.x = -60;
                    streak.y = Math.random() * 768;
                }
            });
        }
    }

    drawEmbers() {
        // Glowing embers rising off the scorched ground
        for (let n = 0; n < 22; n++) {
            const ember = this.add.circle(
                Math.random() * 1280,
                400 + Math.random() * 400,
                1 + Math.random() * 2,
                0xff8a2a,
                0.5 + Math.random() * 0.4
            );
            ember.setDepth(-70).setScrollFactor(0);
            this.tweens.add({
                targets: ember,
                y: -20,
                x: ember.x + (Math.random() * 120 - 40),
                alpha: 0,
                duration: 3000 + Math.random() * 3000,
                delay: Math.random() * 3000,
                repeat: -1,
                onRepeat: () => {
                    ember.y = 780;
                    ember.x = Math.random() * 1280;
                    ember.alpha = 0.7;
                }
            });
        }
    }

    drawTerrain() {
        const step = 16;
        const g = this.add.graphics().setDepth(-10);

        // Dark red rock body
        g.fillStyle(0x6b2a1c, 1);
        g.beginPath();
        g.moveTo(0, WORLD_H);
        for (let x = 0; x <= TRACK_WIDTH; x += step) g.lineTo(x, this.groundHeightFn(x));
        g.lineTo(TRACK_WIDTH, WORLD_H);
        g.closePath();
        g.fillPath();

        // Scorched sand top layer
        g.fillStyle(0xc2612a, 1);
        g.beginPath();
        g.moveTo(0, this.groundHeightFn(0));
        for (let x = 0; x <= TRACK_WIDTH; x += step) g.lineTo(x, this.groundHeightFn(x));
        for (let x = TRACK_WIDTH; x >= 0; x -= step) g.lineTo(x, this.groundHeightFn(x) + 26);
        g.closePath();
        g.fillPath();

        // Rock strata lines following the terrain
        [55, 105, 165].forEach((depth, i) => {
            g.lineStyle(2, i % 2 ? 0x4a1a12 : 0x8a3a22, 0.9);
            g.beginPath();
            g.moveTo(0, this.groundHeightFn(0) + depth);
            for (let x = step; x <= TRACK_WIDTH; x += step) {
                g.lineTo(x, this.groundHeightFn(x) + depth);
            }
            g.strokePath();
        });

        // Glowing surface edge
        g.lineStyle(3, 0xffa15a, 1);
        g.beginPath();
        g.moveTo(0, this.groundHeightFn(0));
        for (let x = step; x <= TRACK_WIDTH; x += step) g.lineTo(x, this.groundHeightFn(x));
        g.strokePath();
    }
}