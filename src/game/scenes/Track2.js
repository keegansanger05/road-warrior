import { BaseRace } from './BaseRace';

// Frozen post-apocalyptic wasteland.
// Sky, mountains, snowfall and ice terrain are drawn in code.

const START_BUFFER = 500;
const RACE_LENGTH = 5500;
const FINISH_BUFFER = 500;
const TRACK_WIDTH = START_BUFFER + RACE_LENGTH + FINISH_BUFFER;
const WORLD_H = 768;
const BASE_Y = 736;
const FLAT_H = 64;

// Completely redesigned ice track.
// Layout: frozen start -> long descent -> ice ridge -> deep valley ->
// steep launch hill -> broken ice shelves -> final jump sequence.
const PROFILE = [
    // Relatively flat starting area
    [0, FLAT_H],
    [350, FLAT_H],
    [600, 80],
    [850, 115],

    // Long descent into a frozen basin
    [1150, 35],
    [1450, 25],
    [1650, 90],

    // Large frozen ridge
    [1850, 220],
    [2050, 285],
    [2250, 160],
    [2400, 45],

    // Deep valley followed by a steep climb
    [2650, 20],
    [2850, 30],
    [3100, 150],
    [3300, 320],

    // Sudden drop and uneven ice shelves
    [3450, 80],
    [3600, 35],
    [3800, 120],
    [3950, 55],

    // Second launch section
    [4150, 250],
    [4350, 300],
    [4500, 100],

    // Short, sharp frozen ridges
    [4650, 40],
    [4800, 175],
    [4950, 45],
    [5100, 135],
    [5250, 30],

    // Final downhill run
    [5400, 75],
    [5500, FLAT_H]
];

// Ramp positions: race-relative x, launch speed up, launch speed forward.
// Positions are spread across the new layout rather than Track1's pattern.
const RAMPS = [
    [750, -700, 75],
    [1550, -950, 100],
    [2300, -800, 85],
    [3000, -900, 95],
    [3280, -1100, 120],
    [3900, -850, 90],
    [4300, -1150, 120],
    [4800, -900, 100],
    [5150, -800, 85]
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

export class Track2 extends BaseRace {
    constructor() {
        super('Track2');
    }

    create() {
        // Dark frozen wasteland atmosphere
        this.cameras.main.setBackgroundColor('#172633');

        // Preserve the existing physics settings
        this.physics.world.gravity.y = 500;

        // Physics ground (BaseRace reads this everywhere)
        this.groundHeightFn = (x) => {
            const raceX = Math.min(
                Math.max(x - START_BUFFER, 0),
                RACE_LENGTH
            );

            return BASE_Y - terrainHeight(raceX);
        };

        this.drawSky();
        this.drawFarMountains();
        this.drawSnowfall();
        this.drawTerrain();

        this.setupPlayer(80, 600);
        this.setupAIRacers(3, TRACK_WIDTH, 200);

        this.snapToGround(this.player);
        this.aiRacers.forEach(ai => this.snapToGround(ai));

        this.setupCameraAndWorld(TRACK_WIDTH, WORLD_H);

        this.setupPickups(RACE_LENGTH, 5, START_BUFFER);
        this.setupFinishLine(START_BUFFER + RACE_LENGTH);
        this.setupInput();
        this.setupProjectileAICollision();
        this.setupAIProjectilePlayerCollision();
        this.setupAIProjectileAICollision();
        this.startCountdown();
    }

    drawSky() {
        // Dark storm clouds and a cold blue-grey horizon
        const g = this.add.graphics()
            .setDepth(-100)
            .setScrollFactor(0);

        const bands = [
            0x111b29,
            0x1a2b3b,
            0x263f52,
            0x39586a,
            0x547789,
            0x8196a1
        ];

        const h = WORLD_H / bands.length;

        bands.forEach((c, i) => {
            g.fillStyle(c, 1);
            g.fillRect(0, i * h, 1400, h + 1);
        });

        // Pale, distant winter sun
        this.add.circle(1050, 150, 85, 0x9bc9e3, 0.10)
            .setDepth(-99)
            .setScrollFactor(0.02);

        this.add.circle(1050, 150, 55, 0xb9d9ed, 0.20)
            .setDepth(-99)
            .setScrollFactor(0.02);

        this.add.circle(1050, 150, 32, 0xe1edf5, 0.75)
            .setDepth(-99)
            .setScrollFactor(0.02);

        // Low-lying storm haze
        const haze = this.add.graphics()
            .setDepth(-98)
            .setScrollFactor(0.04);

        haze.fillStyle(0x152632, 0.40);
        haze.fillEllipse(650, 380, 1200, 85);

        haze.fillStyle(0x7895a7, 0.18);
        haze.fillEllipse(350, 425, 900, 55);
    }

    drawFarMountains() {
        // Three layers of hostile frozen mountain silhouettes
        const layers = [
            {
                factor: 0.08,
                color: 0x334c60,
                base: 535,
                amp: 230,
                period: 750,
                seed: 0.4
            },
            {
                factor: 0.18,
                color: 0x243d50,
                base: 590,
                amp: 175,
                period: 490,
                seed: 1.9
            },
            {
                factor: 0.32,
                color: 0x172d3d,
                base: 635,
                amp: 105,
                period: 340,
                seed: 2.7
            }
        ];

        layers.forEach(({ factor, color, base, amp, period, seed }) => {
            const width = TRACK_WIDTH * factor + 1400;

            const g = this.add.graphics()
                .setDepth(-90)
                .setScrollFactor(factor);

            g.fillStyle(color, 1);
            g.beginPath();
            g.moveTo(0, WORLD_H);

            for (let x = 0; x <= width; x += 12) {
                const peak = Math.abs(
                    Math.sin(x / period * Math.PI + seed)
                );

                const vary =
                    0.55 +
                    0.45 * Math.sin(
                        x / (period * 2.3) + seed * 3
                    );

                let y = base - amp * peak * vary;

                // Sharp, irregular mountain peaks
                const secondaryPeak = Math.pow(
                    Math.max(
                        0,
                        Math.sin(x / (period * 0.75) + seed * 2)
                    ),
                    8
                );

                y -= secondaryPeak * amp * 0.35;

                g.lineTo(x, y);
            }

            g.lineTo(width, WORLD_H);
            g.closePath();
            g.fillPath();
        });

        // Silhouettes of abandoned industrial structures
        const structures = this.add.graphics()
            .setDepth(-85)
            .setScrollFactor(0.25);

        const positions = [
            [280, 580],
            [850, 600],
            [1450, 570],
            [2150, 610],
            [2850, 580],
            [3500, 600],
            [4200, 565],
            [4900, 595],
            [5550, 580]
        ];

        positions.forEach(([x, y], i) => {
            const height = 40 + (i % 3) * 22;
            const width = 12 + (i % 2) * 10;

            structures.fillStyle(0x101d27, 0.95);

            // Main industrial tower
            structures.fillRect(
                x,
                y - height,
                width,
                height
            );

            // Broken antenna
            structures.fillRect(
                x + width / 2 - 2,
                y - height - 24,
                4,
                24
            );

            // Damaged crossbeam
            structures.fillRect(
                x - 12,
                y - height / 2,
                width + 24,
                5
            );

            // Icy structure highlight
            structures.lineStyle(2, 0x7699ad, 0.45);
            structures.beginPath();
            structures.moveTo(x, y - height);
            structures.lineTo(x + width, y - height);
            structures.strokePath();
        });
    }

    drawSnowfall() {
        // Screen-fixed falling snowflakes
        for (let i = 0; i < 45; i++) {
            const flake = this.add.circle(
                Math.random() * 1280,
                Math.random() * 768,
                1 + Math.random() * 2.5,
                0xd9edfa,
                0.5 + Math.random() * 0.4
            );

            flake.setDepth(-80).setScrollFactor(0);

            this.tweens.add({
                targets: flake,
                y: 800,
                x: flake.x + (Math.random() * 80 - 40),
                duration: 5000 + Math.random() * 5000,
                delay: Math.random() * 4000,
                repeat: -1,
                onRepeat: () => {
                    flake.y = -10;
                    flake.x = Math.random() * 1280;
                }
            });
        }
    }

    drawTerrain() {
        const step = 16;

        const g = this.add.graphics()
            .setDepth(-10);

        // Deep blue ice beneath the track
        g.fillStyle(0x142e40, 1);
        g.beginPath();
        g.moveTo(0, WORLD_H);

        for (let x = 0; x <= TRACK_WIDTH; x += step) {
            g.lineTo(x, this.groundHeightFn(x));
        }

        g.lineTo(TRACK_WIDTH, WORLD_H);
        g.closePath();
        g.fillPath();

        // Main frozen glacier body
        g.fillStyle(0x356782, 1);
        g.beginPath();
        g.moveTo(0, this.groundHeightFn(0));

        for (let x = step; x <= TRACK_WIDTH; x += step) {
            g.lineTo(x, this.groundHeightFn(x));
        }

        for (let x = TRACK_WIDTH; x >= 0; x -= step) {
            g.lineTo(x, this.groundHeightFn(x) + 70);
        }

        g.closePath();
        g.fillPath();

        // Dark frozen racing surface
        g.fillStyle(0x8ab6cb, 1);
        g.beginPath();
        g.moveTo(0, this.groundHeightFn(0));

        for (let x = step; x <= TRACK_WIDTH; x += step) {
            g.lineTo(x, this.groundHeightFn(x));
        }

        for (let x = TRACK_WIDTH; x >= 0; x -= step) {
            g.lineTo(x, this.groundHeightFn(x) + 22);
        }

        g.closePath();
        g.fillPath();

        // Deep blue and pale cyan ice strata
        [
            { depth: 60, color: 0x315b73, alpha: 0.95 },
            { depth: 115, color: 0x193b50, alpha: 0.95 },
            { depth: 175, color: 0x527f98, alpha: 0.85 }
        ].forEach(({ depth, color, alpha }) => {
            g.lineStyle(3, color, alpha);
            g.beginPath();

            g.moveTo(
                0,
                this.groundHeightFn(0) + depth
            );

            for (let x = step; x <= TRACK_WIDTH; x += step) {
                const cracks =
                    Math.sin(x * 0.013) * 6 +
                    Math.sin(x * 0.039) * 3;

                g.lineTo(
                    x,
                    this.groundHeightFn(x) + depth + cracks
                );
            }

            g.strokePath();
        });

        // Jagged dark edge beneath the frozen road
        g.lineStyle(5, 0x102634, 1);
        g.beginPath();
        g.moveTo(0, this.groundHeightFn(0));

        for (let x = step; x <= TRACK_WIDTH; x += step) {
            g.lineTo(x, this.groundHeightFn(x));
        }

        g.strokePath();

        // Cold cyan highlight along the ice surface
        g.lineStyle(2, 0xd3f1ff, 0.95);
        g.beginPath();
        g.moveTo(0, this.groundHeightFn(0) - 2);

        for (let x = step; x <= TRACK_WIDTH; x += step) {
            g.lineTo(x, this.groundHeightFn(x) - 2);
        }

        g.strokePath();

        // Scattered frozen debris beneath the racing surface
        const debris = this.add.graphics()
            .setDepth(-9);

        for (let x = 120; x < TRACK_WIDTH; x += 260) {
            const y = this.groundHeightFn(x);

            debris.fillStyle(0x152b38, 0.95);

            // Jagged chunks of broken ice
            debris.fillTriangle(
                x,
                y + 35,
                x + 12,
                y + 8,
                x + 28,
                y + 35
            );

            debris.fillTriangle(
                x + 25,
                y + 35,
                x + 40,
                y + 18,
                x + 54,
                y + 35
            );

            // Occasional pale blue ice fragment
            if (x % 520 < 260) {
                debris.fillStyle(0x8cc8e1, 0.75);

                debris.fillTriangle(
                    x + 60,
                    y + 30,
                    x + 70,
                    y + 16,
                    x + 82,
                    y + 30
                );
            }
        }
    }
}