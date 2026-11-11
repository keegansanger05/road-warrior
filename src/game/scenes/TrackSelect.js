import { Scene } from 'phaser';
import { isUnlocked, tryUnlock, loadProgress } from '../utils/progress';

const C = {
    panelAlt: 0x22221f,
    panelHover: 0x2b2b27,
    border: 0x3a3a35,
    borderHover: 0x6a6a60,
    accent: 0xe67e22,
    gold: 0xf1c40f
};

// Boss unlock (same system as the cars and weapons)
const BOSS_UNLOCK_ID = 'boss_chainsaw_jack';
const BOSS_COST = 500;

export class TrackSelect extends Scene {
    constructor() {
        super('TrackSelect');
    }

    init(data) {
        this.selectedWeaponIndex = (data && typeof data.weaponIndex === 'number') ? data.weaponIndex : 0;
        this.selectedCarIndex = (data && typeof data.carIndex === 'number') ? data.carIndex : 0;
    }

    create() {
        const { width, height } = this.cameras.main;
        const margin = 40;

        this.L = {
            barH: 46,
            // Track section
            trackLabelY: 70,
            trackTop: 90,
            trackH: 70,
            // Info panels
            infoTop: 214,
            infoH: 220
        };

        this.add.image(width / 2, height / 2, 'menuBackground').setDisplaySize(width, height);
        this.add.rectangle(width / 2, height / 2, width, height, 0x0b0b0a, 0.9);

        this.buildTopBar(width, margin);
        this.buildTrackRow(width, margin);
        this.buildInfoPanels(width, margin);
        this.buildFooter(width, height, margin);
    }

    // ------------------------------------------------------------------
    // PANEL
    // ------------------------------------------------------------------

    drawPanel(g, x, y, w, h, opts = {}) {
        const { fill = 0x181816, stroke = C.border, strokeWidth = 2, radius = 10 } = opts;
        g.clear();

        g.fillStyle(0x000000, 0.35);
        g.fillRoundedRect(x + 3, y + 5, w, h, radius);

        g.fillStyle(fill, 1);
        g.fillRoundedRect(x, y, w, h, radius);

        g.lineStyle(strokeWidth, stroke, 1);
        g.strokeRoundedRect(x, y, w, h, radius);
    }

    sectionHeader(x, y, label, endX) {
        const g = this.add.graphics();

        g.fillStyle(C.accent, 1);
        g.fillRoundedRect(x, y, 4, 14, 2);

        const t = this.add.text(x + 12, y + 7, label, {
            fontFamily: 'Arial Black',
            fontSize: 12,
            color: '#e67e22',
            letterSpacing: 2
        }).setOrigin(0, 0.5);

        const lineX = x + 12 + t.width + 12;

        g.fillStyle(C.border, 1);
        g.fillRect(lineX, y + 7, Math.max(0, endX - lineX), 1);
    }

    showToast(message) {
        const { width, height } = this.cameras.main;

        if (this.toast) this.toast.destroy();

        const t = this.add.text(width / 2, height - 34, message, {
            fontFamily: 'Arial Black',
            fontSize: 13,
            color: '#ffffff',
            backgroundColor: '#c0392b',
            padding: { left: 14, right: 14, top: 7, bottom: 7 }
        }).setOrigin(0.5);

        this.toast = t;

        this.tweens.add({
            targets: t,
            alpha: 0,
            delay: 1400,
            duration: 400,
            onComplete: () => {
                t.destroy();
                if (this.toast === t) this.toast = null;
            }
        });
    }

    // ------------------------------------------------------------------
    // TOP BAR
    // ------------------------------------------------------------------

    buildTopBar(width, margin) {
        const barH = this.L.barH;
        const g = this.add.graphics();

        g.fillStyle(0x0a0a09, 0.96);
        g.fillRect(0, 0, width, barH);

        g.fillStyle(C.accent, 1);
        g.fillRect(0, barH - 2, width, 2);

        const title = this.add.text(margin, barH / 2 - 1, 'SELECT TRACK', {
            fontFamily: 'Arial Black',
            fontSize: 20,
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        this.add.text(margin + title.width + 16, barH / 2, 'Pick where you want to race', {
            fontFamily: 'Arial',
            fontSize: 12,
            color: '#8a8a80'
        }).setOrigin(0, 0.5);

        this.creditsText = this.add.text(width - margin, barH / 2, '', {
            fontFamily: 'Arial Black',
            fontSize: 15,
            color: '#f1c40f'
        }).setOrigin(1, 0.5);
        this.updateCreditsText();
    }

    updateCreditsText() {
        if (this.creditsText) {
            this.creditsText.setText(`CREDITS: $${loadProgress().currency}`);
        }
    }

    // ------------------------------------------------------------------
    // TRACK ROW
    // ------------------------------------------------------------------

    buildTrackRow(width, margin) {
        const { trackLabelY, trackTop, trackH } = this.L;

        this.sectionHeader(margin, trackLabelY, 'TRACKS', width - margin);

        // image = texture key loaded in Preloader.js
        // skulls = difficulty (0-5)
        const tracks = [
            { name: 'Desert Run', sceneKey: 'Track1', image: 'track_card1', skulls: 2 },
            { name: 'Ice Sprint', sceneKey: 'Track2', image: 'track_card2', skulls: 3 },
            { name: 'Abandoned Chase', sceneKey: 'Track3', image: 'track_card3', skulls: 4 }
        ];

        const gap = 14;
        const cardW = (width - margin * 2 - gap * (tracks.length - 1)) / tracks.length;
        const cardH = trackH + 40;

        this.trackCards = tracks.map((track, i) => {
            const x = margin + i * (cardW + gap);
            const cy = trackTop;

            // Drop shadow
            const shadow = this.add.graphics();
            shadow.fillStyle(0x000000, 0.4);
            shadow.fillRoundedRect(x + 3, cy + 4, cardW, cardH, 8);

            // Picture: scaled to cover the card, centre part kept
            const img = this.add.image(x + cardW / 2, cy + cardH / 2, track.image);
            const scale = Math.max(cardW / img.width, cardH / img.height);
            img.setScale(scale);
            const cropW = cardW / scale;
            const cropH = cardH / scale;
            img.setCrop((img.width - cropW) / 2, (img.height - cropH) / 2, cropW, cropH);

            // Frame (title plate + border), drawn on top of the picture
            const bg = this.add.graphics();
            this.drawTrackCardArt(bg, x, cy, cardW, cardH, track);

            const nameText = this.add.text(x + cardW / 2, cy + 20, track.name, {
                fontFamily: 'Arial Black',
                fontSize: 13,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                align: 'center',
                wordWrap: { width: cardW - 16 }
            }).setOrigin(0.5);

            const skullRow = this.add.graphics();
            this.drawSkullRow(skullRow, x + 12, cy + cardH - 22, track.skulls);

            const zone = this.add.zone(x + cardW / 2, cy + cardH / 2, cardW, cardH).setInteractive({
                useHandCursor: true
            });

            const card = { bg, x, y: cy, w: cardW, h: cardH, track, nameText };

            zone.on('pointerover', () => this.setTrackCardState(card, 'hover'));
            zone.on('pointerout', () => this.setTrackCardState(card, 'idle'));

            zone.on('pointerdown', () => {
                this.scene.start(track.sceneKey, {
                    weaponIndex: this.selectedWeaponIndex,
                    carIndex: this.selectedCarIndex
                });
            });

            return card;
        });
    }

    drawTrackCardArt(g, x, y, w, h, track) {
        g.clear();

        // Title plate
        g.fillStyle(0x000000, 0.55);
        g.fillRect(x, y, w, 36);

        // Border
        g.lineStyle(3, 0x15110c, 1);
        g.strokeRoundedRect(x, y, w, h, 8);
    }

    drawSkullRow(g, x, y, count, max = 5) {
        g.clear();

        for (let i = 0; i < max; i++) {
            const sx = x + i * 20;
            const filled = i < count;

            g.fillStyle(filled ? 0xf2f2ea : 0x3a3a35, 1);
            g.fillCircle(sx, y, 7);

            g.fillStyle(filled ? 0x15110c : 0x26241f, 1);
            g.fillCircle(sx - 2.5, y - 1, 1.6);
            g.fillCircle(sx + 2.5, y - 1, 1.6);
            g.fillRect(sx - 2, y + 4, 4, 2);
        }
    }

    setTrackCardState(card, state) {
        const { bg, x, y, w, h, track } = card;

        this.drawTrackCardArt(bg, x, y, w, h, track);

        if (state === 'hover') {
            bg.lineStyle(3, 0xe67e22, 1);
            bg.strokeRoundedRect(x, y, w, h, 8);
        }
    }

    // ------------------------------------------------------------------
    // INFO PANELS
    // ------------------------------------------------------------------

    buildInfoPanels(width, margin) {
        const { infoTop, infoH } = this.L;
        const gap = 16;
        const pw = (width - margin * 2 - gap) / 2;

        this.buildPickupTable(margin, infoTop, pw, infoH);
        this.buildControlsTable(margin + pw + gap, infoTop, pw, infoH);
    }

    drawTableFrame(x, y, w, h, title, colATitle, colBTitle, colBX) {
        const g = this.add.graphics();

        this.drawPanel(g, x, y, w, h, {
            fill: 0x151513,
            radius: 10
        });

        this.add.text(x + 16, y + 16, title, {
            fontFamily: 'Arial Black',
            fontSize: 12,
            color: '#e67e22',
            letterSpacing: 2
        }).setOrigin(0, 0.5);

        const hy = y + 34;

        g.fillStyle(0x0e0e0d, 1);
        g.fillRect(x + 2, hy, w - 4, 20);

        const headStyle = {
            fontFamily: 'Arial Black',
            fontSize: 9,
            color: '#77776e',
            letterSpacing: 1
        };

        this.add.text(x + 16, hy + 10, colATitle, headStyle).setOrigin(0, 0.5);
        this.add.text(x + colBX, hy + 10, colBTitle, headStyle).setOrigin(0, 0.5);

        return { g, rowsY: hy + 24 };
    }

    buildPickupTable(x, y, w, h) {
        const { g, rowsY } = this.drawTableFrame(
            x, y, w, h,
            'PICKUP BOXES',
            'REWARD',
            'EFFECT',
            180
        );

        const rows = [
            {
                icon: 'coin',
                name: 'CREDITS',
                css: '#f1c40f',
                color: 0xf1c40f,
                effect: 'Adds $50-$150 to your saved credits'
            },
            {
                icon: 'ammo',
                name: 'AMMO REFILL',
                css: '#3498db',
                color: 0x3498db,
                effect: 'Restocks every weapon to full ammo'
            },
            {
                icon: 'rocket',
                name: 'ROCKET',
                css: '#e74c3c',
                color: 0xe74c3c,
                effect: '+1 rocket. Press R to defeat the nearest rival'
            },
            {
                icon: 'repair',
                name: 'FULL REPAIR',
                css: '#2ecc71',
                color: 0x2ecc71,
                effect: 'Restores your car to 100% health'
            }
        ];

        rows.forEach((row, r) => {
            const ry = rowsY + r * 28;

            if (r % 2 === 1) {
                g.fillStyle(0x1c1c19, 1);
                g.fillRect(x + 2, ry, w - 4, 28);
            }

            this.drawPickupIcon(g, row.icon, x + 28, ry + 14, row.color);

            this.add.text(x + 50, ry + 14, row.name, {
                fontFamily: 'Arial Black',
                fontSize: 11,
                color: row.css
            }).setOrigin(0, 0.5);

            this.add.text(x + 180, ry + 14, row.effect, {
                fontFamily: 'Arial',
                fontSize: 11,
                color: '#c8c8be',
                wordWrap: { width: w - 196 }
            }).setOrigin(0, 0.5);
        });

        this.add.text(
            x + 16,
            rowsY + 4 * 28 + 16,
            '5 boxes per race  •  only you can collect them  •  one random reward each',
            {
                fontFamily: 'Arial',
                fontSize: 10,
                fontStyle: 'italic',
                color: '#8a8a80'
            }
        ).setOrigin(0, 0.5);
    }

    drawPickupIcon(g, kind, cx, cy, color) {
        g.fillStyle(color, 1);

        if (kind === 'coin') {
            g.fillCircle(cx, cy, 9);
            g.lineStyle(2, 0xb7950b, 1);
            g.strokeCircle(cx, cy, 9);

            this.add.text(cx, cy, '$', {
                fontFamily: 'Arial Black',
                fontSize: 11,
                color: '#5a4400'
            }).setOrigin(0.5);

        } else if (kind === 'ammo') {
            g.fillRoundedRect(cx - 11, cy - 6, 5, 12, 2);
            g.fillRoundedRect(cx - 3, cy - 6, 5, 12, 2);
            g.fillRoundedRect(cx + 5, cy - 6, 5, 12, 2);

        } else if (kind === 'rocket') {
            g.fillRoundedRect(cx - 10, cy - 4, 16, 8, 3);
            g.fillTriangle(cx + 6, cy - 5, cx + 6, cy + 5, cx + 13, cy);
            g.fillTriangle(cx - 10, cy - 4, cx - 10, cy - 9, cx - 4, cy - 4);
            g.fillTriangle(cx - 10, cy + 4, cx - 10, cy + 9, cx - 4, cy + 4);

        } else {
            g.fillRoundedRect(cx - 3, cy - 8, 6, 16, 2);
            g.fillRoundedRect(cx - 8, cy - 3, 16, 6, 2);
        }
    }

    // ------------------------------------------------------------------
    // CONTROLS
    // ------------------------------------------------------------------

    buildControlsTable(x, y, w, h) {
        const { g, rowsY } = this.drawTableFrame(
            x, y, w, h,
            'CONTROLS',
            'KEY',
            'ACTION',
            150
        );

        const rows = [
            { keys: ['W', 'S'], action: 'Accelerate / reverse' },
            { keys: ['A', 'D'], action: 'Flip left / right while airborne' },
            { keys: ['SPACE'], action: 'Fire weapon (unlocks 8s into the race)' },
            { keys: ['R'], action: 'Launch a rocket (needs a rocket pickup)' },
            { keys: ['ESC', 'P'], action: 'Pause menu: Resume, Restart or Main Menu' }
        ];

        rows.forEach((row, r) => {
            const ry = rowsY + r * 28;

            if (r % 2 === 1) {
                g.fillStyle(0x1c1c19, 1);
                g.fillRect(x + 2, ry, w - 4, 28);
            }

            let kx = x + 16;

            row.keys.forEach((key, k) => {
                if (k > 0) {
                    this.add.text(kx + 5, ry + 14, '/', {
                        fontFamily: 'Arial',
                        fontSize: 11,
                        color: '#77776e'
                    }).setOrigin(0.5);

                    kx += 12;
                }

                kx += this.drawKeyCap(g, kx, ry + 14, key) + 4;
            });

            this.add.text(x + 150, ry + 14, row.action, {
                fontFamily: 'Arial',
                fontSize: 11,
                color: '#c8c8be',
                wordWrap: { width: w - 166 }
            }).setOrigin(0, 0.5);
        });
    }

    drawKeyCap(g, x, cy, label) {
        const t = this.add.text(0, cy, label, {
            fontFamily: 'Arial Black',
            fontSize: 10,
            color: '#ffffff'
        }).setOrigin(0.5);

        const capW = Math.max(22, t.width + 14);
        t.x = x + capW / 2;

        g.fillStyle(0x2b2b27, 1);
        g.fillRoundedRect(x, cy - 10, capW, 20, 4);

        g.lineStyle(1, 0x6a6a60, 1);
        g.strokeRoundedRect(x, cy - 10, capW, 20, 4);

        return capW;
    }

    // ------------------------------------------------------------------
    // FOOTER / BOSS BUTTON
    // ------------------------------------------------------------------

    buildFooter(width, height, margin) {
        const btnW = 140;
        const btnH = 30;
        const by = height - 34 - btnH / 2;

        // --------------------------------------------------
        // LOADOUT BUTTON
        // --------------------------------------------------

        const g = this.add.graphics();

        const draw = (hover) => {
            g.clear();

            g.fillStyle(hover ? C.accent : 0x1e1e1b, 1);
            g.fillRoundedRect(margin, by, btnW, btnH, 8);

            g.lineStyle(2, hover ? 0xffffff : C.border, 1);
            g.strokeRoundedRect(margin, by, btnW, btnH, 8);
        };

        draw(false);

        this.add.text(margin + btnW / 2, by + btnH / 2, '< LOADOUT', {
            fontFamily: 'Arial Black',
            fontSize: 13,
            color: '#ffffff'
        }).setOrigin(0.5);

        const zone = this.add.zone(
            margin + btnW / 2,
            by + btnH / 2,
            btnW,
            btnH
        ).setInteractive({ useHandCursor: true });

        zone.on('pointerover', () => draw(true));
        zone.on('pointerout', () => draw(false));

        zone.on('pointerdown', () => {
            this.scene.start('LoadoutSelect');
        });

        // --------------------------------------------------
        // BOSS RACE BUTTON
        // --------------------------------------------------

        const raceW = 140;
        const raceH = 190;
        const raceX = width - margin - raceW / 2;
        const raceY = by + btnH / 2 - 70;
    
        
        // Background image
        const raceImage = this.add.image(raceX, raceY, 'boss_card').setDisplaySize(raceW, raceH);

        // Dark overlay
        const overlay = this.add.graphics();

        const drawRaceButton = (hover) => {
            overlay.clear();

            overlay.fillStyle(0x000000, hover ? 0.25 : 0.45);
            overlay.fillRoundedRect(
                raceX - raceW / 2,
                raceY - raceH / 2,
                raceW,
                raceH,
                8
            );

            overlay.lineStyle(4, hover ? 0xffffff : C.accent, 1);
            overlay.strokeRoundedRect(
                raceX - raceW / 2,
                raceY - raceH / 2,
                raceW,
                raceH,
                8
            );
        };

        drawRaceButton(false);

        // Boss name
        const raceText = this.add.text(raceX, raceY + 28, 'CHAINSAW JACK', {
            fontFamily: 'Arial Black',
            fontSize: 12,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Lock cover (hidden once the boss is unlocked)
        const lockOverlay = this.add.rectangle(raceX, raceY, raceW, raceH, 0x000000, 0.65);
        const lockText = this.add.text(raceX, raceY - 14, 'LOCKED', {
            fontFamily: 'Arial Black',
            fontSize: 16,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        const costText = this.add.text(raceX, raceY + 10, `$${BOSS_COST}`, {
            fontFamily: 'Arial Black',
            fontSize: 18,
            color: '#f1c40f',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        const refreshBossLock = () => {
            const locked = !isUnlocked(BOSS_UNLOCK_ID);
            lockOverlay.setVisible(locked);
            lockText.setVisible(locked);
            costText.setVisible(locked);
        };
        refreshBossLock();

        // Interaction zone
        const raceZone = this.add.zone(raceX, raceY, raceW, raceH).setInteractive({
            useHandCursor: true
        });

        raceZone.on('pointerover', () => {
            drawRaceButton(true);
            raceText.setScale(1.08);
        });

        raceZone.on('pointerout', () => {
            drawRaceButton(false);
            raceText.setScale(1);
        });

        raceZone.on('pointerdown', () => {
            if (!isUnlocked(BOSS_UNLOCK_ID)) {
                const result = tryUnlock(BOSS_UNLOCK_ID, BOSS_COST);
                if (result.success) {
                    this.updateCreditsText();
                    refreshBossLock();
                    this.showToast('BOSS UNLOCKED!');
                } else {
                    this.showToast('NOT ENOUGH CREDITS');
                }
                return;
            }

            this.scene.start('TrackBoss', {
                weaponIndex: this.selectedWeaponIndex,
                carIndex: this.selectedCarIndex
            });
        });
    }
}