import { BaseRace } from './BaseRace';

// Abandoned city / post-apocalyptic urban battlefield.
// Smoggy sky, ruined skyline, collapsed highways and cracked asphalt
// are drawn in code. Ground collision uses groundHeightFn below.

const START_BUFFER = 500;
const RACE_LENGTH = 6500;
const FINISH_BUFFER = 500;
const TRACK_WIDTH = START_BUFFER + RACE_LENGTH + FINISH_BUFFER;
const WORLD_H = 768;
const BASE_Y = 736;
const FLAT_H = 64;

// Completely redesigned urban track.
// Layout: ruined start -> broken road -> steep climb -> elevated highway
// -> collapsed section -> deep rubble valley -> huge launch -> final wreckage.

const PROFILE = [
    // Flat starting stretch
    [0, FLAT_H],
    [350, FLAT_H],
    [500, 45],
    [700, 110],

    // Broken road and uneven concrete
    [850, 55],
    [1050, 145],
    [1200, 35],
    [1400, 70],

    // Steep climb onto a ruined elevated highway
    [1600, 190],
    [1800, 300],
    [2150, 285],
    [2350, 250],

    // Collapsed highway drop
    [2500, 65],
    [2650, 25],

    // Deep urban rubble valley
    [2850, 20],
    [3050, 100],
    [3200, 45],
    [3350, 165],
    [3500, 55],

    // Long sloping rise toward the ruined overpass
    [3700, 120],
    [3900, 230],
    [4100, 260],

    // Sudden drop and broken concrete shelves
    [4250, 50],
    [4400, 25],
    [4550, 90],
    [4700, 35],

    // Large final launch hill
    [4900, 180],
    [5100, 320],
    [5250, 65],

    // Final sequence of broken road sections
    [5400, 30],
    [5550, 140],
    [5700, 45],
    [5850, 115],
    [6000, 35],
    [6200, FLAT_H],
    [6500, FLAT_H]
];

// Ramps: race-relative x, launch speed up, launch speed forward.
// Spread across the new highway drops, rubble valleys and launch hills.
const RAMPS = [
    [550, -750, 75],
    [1350, -850, 85],
    [1750, -1000, 110],
    [2400, -950, 105],
    [2950, -800, 80],
    [3450, -900, 95],
    [4000, -850, 90],
    [4650, -900, 95],
    [5050, -1150, 125],
    [5600, -850, 90],
    [5900, -750, 75]
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
// Keeps the ruined skyline consistent between runs.
function rand(n, seed) {
    const v = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
    return v - Math.floor(v);
}

export class Track3 extends BaseRace {
    constructor() {
        super('Track3');
    }

    create() {
        // Dark, polluted city atmosphere
        this.cameras.main.setBackgroundColor('#251e25');

        // Preserve existing physics
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
        this.drawSkyline(0.10, 0x493b43, 565, 7, 230, 400, false);
        this.drawSkyline(0.24, 0x342a33, 625, 19, 170, 340, true);
        this.drawSkyline(0.38, 0x201c25, 665, 31, 100, 250, true);
        this.drawAsh();
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
        // Toxic smog fading into a burnt-orange horizon
        const g = this.add.graphics()
            .setDepth(-100)
            .setScrollFactor(0);

        const bands = [
            0x171821,
            0x27232d,
            0x403039,
            0x694039,
            0x985039,
            0xc16a42
        ];

        const h = WORLD_H / bands.length;

        bands.forEach((c, i) => {
            g.fillStyle(c, 1);
            g.fillRect(0, i * h, 1400, h + 1);
        });

        // Blood-orange sun obscured by pollution
        this.add.circle(970, 310, 115, 0xd45d37, 0.10)
            .setDepth(-99)
            .setScrollFactor(0.02);

        this.add.circle(970, 310, 78, 0xed7540, 0.22)
            .setDepth(-99)
            .setScrollFactor(0.02);

        this.add.circle(970, 310, 48, 0xffad63, 0.75)
            .setDepth(-99)
            .setScrollFactor(0.02);

        // Heavy smoke bands
        const smoke = this.add.graphics()
            .setDepth(-97)
            .setScrollFactor(0.04);

        smoke.fillStyle(0x201c27, 0.55);
        smoke.fillEllipse(400, 350, 1050, 100);

        smoke.fillStyle(0x35262c, 0.45);
        smoke.fillEllipse(1000, 400, 1200, 90);

        smoke.fillStyle(0x704033, 0.22);
        smoke.fillEllipse(650, 450, 1400, 65);
    }

    drawSkyline(factor, color, base, seed, minH, maxH, withWindows) {
        // Parallax layers of destroyed skyscrapers
        const width = TRACK_WIDTH * factor + 1400;

        const g = this.add.graphics()
            .setDepth(factor < 0.2 ? -92 : -88)
            .setScrollFactor(factor);

        let x = -20;
        let i = 0;

        while (x < width) {
            const w = 60 + rand(i, seed) * 90;
            const hgt = minH + rand(i + 50, seed) * (maxH - minH);
            const top = base - hgt;

            g.fillStyle(color, 1);
            g.beginPath();
            g.moveTo(x, WORLD_H);

            // Uneven, collapsed rooftops
            g.lineTo(
                x,
                top + rand(i + 1, seed) * 30
            );

            const pieces = 3 + Math.floor(rand(i + 2, seed) * 3);

            for (let p = 1; p <= pieces; p++) {
                const px = x + (w * p) / pieces;
                const py = top + rand(i * 7 + p, seed) * 55;

                g.lineTo(px, py);
            }

            g.lineTo(x + w, WORLD_H);
            g.closePath();
            g.fillPath();

            // Broken concrete antennae and exposed beams
            if (rand(i + 80, seed) > 0.65) {
                g.fillStyle(0x17171d, 1);

                g.fillRect(
                    x + w * 0.55,
                    top - 30,
                    5,
                    35
                );

                g.fillRect(
                    x + w * 0.55 - 12,
                    top - 10,
                    24,
                    4
                );
            }

            if (withWindows) {
                // Blackened window holes
                g.fillStyle(0x100f16, 0.95);

                for (let wy = top + 40; wy < base - 20; wy += 34) {
                    for (let wx = x + 10; wx < x + w - 14; wx += 24) {
                        if (rand(wx + wy * 3, seed) > 0.45) {
                            g.fillRect(wx, wy, 11, 16);
                        }
                    }
                }

                // Occasional dying orange lights
                g.fillStyle(0xe17a3e, 0.55);

                for (let wy = top + 45; wy < base - 30; wy += 68) {
                    if (rand(i + wy, seed) > 0.83) {
                        g.fillRect(x + 18, wy, 8, 10);
                    }
                }
            }

            x += w + 6 + rand(i + 9, seed) * 24;
            i++;
        }
    }

    drawAsh() {
        // Drifting ash and dust across the screen
        for (let n = 0; n < 40; n++) {
            const speck = this.add.circle(
                Math.random() * 1280,
                Math.random() * 768,
                1 + Math.random() * 2,
                0xd2b9a9,
                0.25 + Math.random() * 0.3
            );

            speck.setDepth(-80).setScrollFactor(0);

            this.tweens.add({
                targets: speck,
                y: 800,
                x: speck.x - 60 - Math.random() * 80,
                duration: 7000 + Math.random() * 6000,
                delay: Math.random() * 5000,
                repeat: -1,
                onRepeat: () => {
                    speck.y = -10;
                    speck.x = 200 + Math.random() * 1200;
                }
            });
        }
    }

    drawTerrain() {
        const step = 16;

        const g = this.add.graphics()
            .setDepth(-10);

        // Deep rubble and concrete body
        g.fillStyle(0x201f25, 1);
        g.beginPath();
        g.moveTo(0, WORLD_H);

        for (let x = 0; x <= TRACK_WIDTH; x += step) {
            g.lineTo(x, this.groundHeightFn(x));
        }

        g.lineTo(TRACK_WIDTH, WORLD_H);
        g.closePath();
        g.fillPath();

        // Exposed broken concrete
        g.fillStyle(0x39363d, 1);
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

        // Dark, battered asphalt surface
        g.fillStyle(0x4a4548, 1);
        g.beginPath();
        g.moveTo(0, this.groundHeightFn(0));

        for (let x = step; x <= TRACK_WIDTH; x += step) {
            g.lineTo(x, this.groundHeightFn(x));
        }

        for (let x = TRACK_WIDTH; x >= 0; x -= step) {
            g.lineTo(x, this.groundHeightFn(x) + 24);
        }

        g.closePath();
        g.fillPath();

        // Jagged cracks and exposed concrete strata
        [
            { depth: 55, color: 0x28252b, alpha: 1 },
            { depth: 105, color: 0x17181e, alpha: 0.95 },
            { depth: 165, color: 0x55474a, alpha: 0.85 }
        ].forEach(({ depth, color, alpha }) => {
            g.lineStyle(3, color, alpha);
            g.beginPath();

            g.moveTo(
                0,
                this.groundHeightFn(0) + depth
            );

            for (let x = step; x <= TRACK_WIDTH; x += step) {
                const cracks =
                    Math.sin(x * 0.018) * 5 +
                    Math.sin(x * 0.047) * 3;

                g.lineTo(
                    x,
                    this.groundHeightFn(x) + depth + cracks
                );
            }

            g.strokePath();
        });

        // Faded, rusted road markings
        g.lineStyle(3, 0xb77b38, 0.55);

        for (let x = 0; x < TRACK_WIDTH - 40; x += 110) {
            g.lineBetween(
                x,
                this.groundHeightFn(x) + 9,
                x + 40,
                this.groundHeightFn(x + 40) + 9
            );
        }

        // Dark broken edge beneath the road
        g.lineStyle(6, 0x17161c, 1);
        g.beginPath();
        g.moveTo(0, this.groundHeightFn(0));

        for (let x = step; x <= TRACK_WIDTH; x += step) {
            g.lineTo(x, this.groundHeightFn(x));
        }

        g.strokePath();

        // Faint orange light reflecting on the broken road edge
        g.lineStyle(2, 0xd17a48, 0.75);
        g.beginPath();
        g.moveTo(0, this.groundHeightFn(0) - 2);

        for (let x = step; x <= TRACK_WIDTH; x += step) {
            g.lineTo(x, this.groundHeightFn(x) - 2);
        }

        g.strokePath();

        // Scattered chunks of concrete and metal wreckage
        const debris = this.add.graphics()
            .setDepth(-9);

        for (let x = 100; x < TRACK_WIDTH; x += 230) {
            const y = this.groundHeightFn(x);

            debris.fillStyle(0x211f25, 0.98);

            // Broken concrete chunks
            debris.fillTriangle(
                x,
                y + 32,
                x + 13,
                y + 9,
                x + 29,
                y + 32
            );

            debris.fillRect(
                x + 32,
                y + 22,
                22,
                7
            );

            // Rusted metal debris
            if (x % 460 < 230) {
                debris.fillStyle(0x9b5035, 0.9);

                debris.fillRect(
                    x + 60,
                    y + 27,
                    18,
                    5
                );

                debris.fillTriangle(
                    x + 82,
                    y + 30,
                    x + 91,
                    y + 17,
                    x + 101,
                    y + 30
                );
            }

            // Occasional blackened wreckage
            if (x % 690 < 230) {
                debris.fillStyle(0x111319, 1);

                debris.fillRect(
                    x + 108,
                    y + 18,
                    28,
                    12
                );

                debris.fillRect(
                    x + 114,
                    y + 12,
                    14,
                    6
                );
            }
        }
    }
}