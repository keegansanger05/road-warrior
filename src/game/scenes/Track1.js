import { BaseRace } from './BaseRace';

const START_BUFFER = 500;
const RACE_LENGTH = 6000;
const FINISH_BUFFER = 500;
const TRACK_WIDTH = START_BUFFER + RACE_LENGTH + FINISH_BUFFER;
const WORLD_H = 768;
const BASE_Y = 736;
const FLAT_H = 64;

const PROFILE = [
    // Long, relatively flat starting stretch
    [0, FLAT_H],
    [400, FLAT_H],
    [520, 100],
    [640, 70],
    [900, 175],
    [1000, 145],
    [1180, 40],

    // Broken desert road and first major jump
    [1400, FLAT_H],
    [1650, FLAT_H],
    [1850, 150],
    [2000, 270],
    [2130, 55],
    [2300, 100],
    [2400, 45],

    // Jagged, uneven wasteland
    [2650, FLAT_H],
    [2900, FLAT_H],
    [3100, 190],
    [3200, 120],
    [3450, 235],
    [3700, 70],
    [3900, 115],
    [4100, 40],

    // Fast stretch before the final large jumps
    [4300, FLAT_H],
    [4600, FLAT_H],
    [4800, 145],
    [5050, 310],
    [5200, 60],
    [5350, 110],
    [5450, 45],
    [5700, FLAT_H],
    [5900, FLAT_H],
    [6000, FLAT_H]
];

// Ramp positions (race-relative x), launch speed up, launch speed forward.
const RAMPS = [
    [250, -800, 80],
    [1980, -950, 110],
    [2750, -850, 80],
    [4450, -850, 80],
    [5030, -1000, 110],
    [5800, -760, 60]
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

export class Track1 extends BaseRace {
    constructor() {
        super('Track1');
    }

    create() {
        // Dusty, burnt-orange wasteland atmosphere
        this.cameras.main.setBackgroundColor('#54291D');
        this.physics.world.gravity.y = 250;

        // Physics ground (BaseRace reads this everywhere)
        this.groundHeightFn = (x) => {
            const raceX = Math.min(
                Math.max(x - START_BUFFER, 0),
                RACE_LENGTH
            );

            return BASE_Y - terrainHeight(raceX);
        };

        this.drawSky();
        this.drawFarDunes();
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
        // Dirty, scorched sky with a harsh desert sun
        const g = this.add.graphics()
            .setDepth(-100)
            .setScrollFactor(0);

        const bands = [
            0x301b20,
            0x572b29,
            0x843b2a,
            0xb34f2b,
            0xd66a32,
            0xf09a45
        ];

        const h = WORLD_H / bands.length;

        bands.forEach((c, i) => {
            g.fillStyle(c, 1);
            g.fillRect(0, i * h, 1400, h + 1);
        });

        // Blood-orange sun and surrounding heat haze
        this.add.circle(1000, 150, 90, 0xf07835, 0.12)
            .setDepth(-99)
            .setScrollFactor(0.02);

        this.add.circle(1000, 150, 68, 0xffb34f, 0.3)
            .setDepth(-99)
            .setScrollFactor(0.02);

        this.add.circle(1000, 150, 48, 0xffd18a, 0.95)
            .setDepth(-99)
            .setScrollFactor(0.02);

        // Dark distant storm bands
        const haze = this.add.graphics()
            .setDepth(-98)
            .setScrollFactor(0.05);

        haze.fillStyle(0x482626, 0.24);
        haze.fillEllipse(700, 300, 1100, 75);

        haze.fillStyle(0x9b482d, 0.2);
        haze.fillEllipse(350, 370, 900, 55);
    }

    drawFarDunes() {
        // Distant mesas and nearer, jagged desert ridges
        const layers = [
            {
                factor: 0.10,
                color: 0x63342d,
                base: 535,
                amp: 95,
                period: 680,
                seed: 0.7
            },
            {
                factor: 0.22,
                color: 0x813d2b,
                base: 585,
                amp: 80,
                period: 430,
                seed: 2.1
            },
            {
                factor: 0.38,
                color: 0x492a26,
                base: 635,
                amp: 60,
                period: 300,
                seed: 1.4
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

            for (let x = 0; x <= width; x += 16) {
                const wave =
                    Math.sin(x / period * Math.PI * 2 + seed);

                const detail =
                    Math.sin(x / (period * 0.37) + seed * 2);

                let y =
                    base -
                    amp * (0.5 + 0.5 * wave) -
                    amp * 0.4 * detail;

                // Sharp mesa-like silhouettes
                const mesaWave =
                    Math.pow(
                        Math.max(
                            0,
                            Math.sin(x / (period * 1.8) + seed)
                        ),
                        12
                    );

                y -= mesaWave * amp * 0.8;

                g.lineTo(x, y);
            }

            g.lineTo(width, WORLD_H);
            g.closePath();
            g.fillPath();
        });

        // Scattered silhouettes of scrap-metal towers and wreckage
        const silhouettes = this.add.graphics()
            .setDepth(-80)
            .setScrollFactor(0.32);

        const towerPositions = [
            [350, 575],
            [780, 590],
            [1250, 565],
            [1900, 600],
            [2450, 580],
            [3050, 600],
            [3650, 565],
            [4250, 595],
            [4900, 570],
            [5500, 600],
            [6200, 575]
        ];

        towerPositions.forEach(([x, y], i) => {
            const height = 35 + (i % 3) * 18;
            const width = 10 + (i % 2) * 8;

            silhouettes.fillStyle(0x281d1d, 0.85);

            // Rusted tower body
            silhouettes.fillRect(
                x,
                y - height,
                width,
                height
            );

            // Spiked top
            silhouettes.fillTriangle(
                x - 8,
                y - height,
                x + width / 2,
                y - height - 18,
                x + width + 8,
                y - height
            );

            // Crossbeam
            silhouettes.fillRect(
                x - 12,
                y - height / 2,
                width + 24,
                4
            );

            // Thin support pole
            silhouettes.fillRect(
                x + width / 2 - 2,
                y - height - 25,
                4,
                25
            );
        });
    }

    drawTerrain() {
        const step = 16;

        const g = this.add.graphics()
            .setDepth(-10);

        // Dark, burnt earth beneath the racing surface
        g.fillStyle(0x38221c, 1);
        g.beginPath();
        g.moveTo(0, WORLD_H);

        for (let x = 0; x <= TRACK_WIDTH; x += step) {
            g.lineTo(x, this.groundHeightFn(x));
        }

        g.lineTo(TRACK_WIDTH, WORLD_H);
        g.closePath();
        g.fillPath();

        // Deep rust-coloured sandstone
        g.fillStyle(0x713b29, 1);
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

        // Broken, dusty road surface
        g.fillStyle(0x9b5834, 1);
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

        // Dark eroded strata beneath the track
        [
            { depth: 65, color: 0x4a2922, alpha: 0.95 },
            { depth: 115, color: 0x30201d, alpha: 0.9 },
            { depth: 175, color: 0x512a20, alpha: 0.85 }
        ].forEach(({ depth, color, alpha }) => {
            g.lineStyle(3, color, alpha);
            g.beginPath();

            g.moveTo(
                0,
                this.groundHeightFn(0) + depth
            );

            for (let x = step; x <= TRACK_WIDTH; x += step) {
                const erosion =
                    Math.sin(x * 0.018) * 5 +
                    Math.sin(x * 0.047) * 3;

                g.lineTo(
                    x,
                    this.groundHeightFn(x) + depth + erosion
                );
            }

            g.strokePath();
        });

        // Jagged-looking dark road edge
        g.lineStyle(5, 0x2b1b18, 1);
        g.beginPath();
        g.moveTo(0, this.groundHeightFn(0));

        for (let x = step; x <= TRACK_WIDTH; x += step) {
            g.lineTo(x, this.groundHeightFn(x));
        }

        g.strokePath();

        // Thin dusty highlight on the road lip
        g.lineStyle(2, 0xe39a50, 0.85);
        g.beginPath();
        g.moveTo(0, this.groundHeightFn(0) - 2);

        for (let x = step; x <= TRACK_WIDTH; x += step) {
            g.lineTo(x, this.groundHeightFn(x) - 2);
        }

        g.strokePath();

        // Sparse blackened debris along the lower ground
        const debris = this.add.graphics()
            .setDepth(-9);

        for (let x = 100; x < TRACK_WIDTH; x += 240) {
            const y = this.groundHeightFn(x);

            debris.fillStyle(0x261b18, 0.9);

            // Small jagged pieces of scrap
            debris.fillTriangle(
                x,
                y + 28,
                x + 12,
                y + 8,
                x + 24,
                y + 28
            );

            debris.fillRect(
                x + 30,
                y + 20,
                18,
                5
            );

            // Occasional rusty debris
            if (x % 480 < 240) {
                debris.fillStyle(0xb35c32, 0.8);

                debris.fillRect(
                    x + 55,
                    y + 30,
                    13,
                    4
                );
            }
        }
    }
}