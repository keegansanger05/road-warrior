import { Scene } from 'phaser';
import { isUnlocked, tryUnlock, loadProgress, resetProgress } from '../utils/progress';

const C = {
    panelAlt: 0x22221f,
    panelHover: 0x2b2b27,
    border: 0x3a3a35,
    borderHover: 0x6a6a60,
    accent: 0xe67e22,
    gold: 0xf1c40f
};

export class LoadoutSelect extends Scene {
    constructor() {
        super('LoadoutSelect');
    }

    create() {
        const { width, height } = this.cameras.main;
        const margin = 40;

        this.L = {
            barH: 46,
            weaponsLabelY: 70, weaponsTop: 92, weaponsH: 90, weaponCardW: 260,
            vehicleTop: 210, vehicleH: 300
        };

        this.selectedWeaponIndex = 0;
        this.selectedCarIndex = 0;
        this.hoverWeapon = -1;

        this.add.image(width / 2, height / 2, 'menuBackground').setDisplaySize(width, height);
        this.add.rectangle(width / 2, height / 2, width, height, 0x0b0b0a, 0.9);

        this.buildTopBar(width, margin, 'SELECT LOADOUT', 'Choose your weapon and vehicle');
        this.buildDevResetButton(width, margin);   // <-- DEMO ONLY, see method below
        this.buildWeaponRow(width, margin);
        this.buildVehiclePanel(width, margin);
        this.buildFooter(width, height, margin);
    }



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
            fontFamily: 'Arial Black', fontSize: 12, color: '#956b46', letterSpacing: 2
        }).setOrigin(0, 0.5);

        const lineX = x + 12 + t.width + 12;
        g.fillStyle(C.border, 1);
        g.fillRect(lineX, y + 7, Math.max(0, endX - lineX), 1);
    }

    updateCurrencyText() {
        const progress = loadProgress();
        this.currencyDisplayText.setText(`$${progress.currency}`);
    }

    showToast(message) {
        const { width, height } = this.cameras.main;
        if (this.toast) this.toast.destroy();

        const t = this.add.text(width / 2, height - 90, message, {
            fontFamily: 'Arial Black', fontSize: 13, color: '#ffffff',
            backgroundColor: '#c0392b', padding: { left: 14, right: 14, top: 7, bottom: 7 }
        }).setOrigin(0.5);
        this.toast = t;

        this.tweens.add({
            targets: t, alpha: 0, delay: 1400, duration: 400,
            onComplete: () => {
                t.destroy();
                if (this.toast === t) this.toast = null;
            }
        });
    }

    // ------------------------------------------------------------------
    // DEMO/PRESENTATION ONLY — delete this method (and its call in
    // create()) once you no longer need to reset to a clean state.
    // ------------------------------------------------------------------
    buildDevResetButton(width, margin) {
        const btnW = 160, btnH = 24;
        const bx = width - margin - btnW;
        const by = this.L.barH + 12;

        const g = this.add.graphics();
        const draw = (hover) => {
            g.clear();
            g.fillStyle(hover ? 0xc0392b : 0x2a1414, 1);
            g.fillRoundedRect(bx, by, btnW, btnH, 6);
            g.lineStyle(1, 0xe74c3c, 1);
            g.strokeRoundedRect(bx, by, btnW, btnH, 6);
        };
        draw(false);

        this.add.text(bx + btnW / 2, by + btnH / 2, 'RESET PROGRESS (DEV)', {
            fontFamily: 'Arial Black', fontSize: 9, color: '#ffffff', letterSpacing: 1
        }).setOrigin(0.5);

        const zone = this.add.zone(bx + btnW / 2, by + btnH / 2, btnW, btnH)
            .setInteractive({ useHandCursor: true });
        zone.on('pointerover', () => draw(true));
        zone.on('pointerout', () => draw(false));
        zone.on('pointerdown', () => {
            resetProgress();
            this.updateCurrencyText();

            this.selectedWeaponIndex = 0;
            this.selectedCarIndex = 0;

            this.refreshWeaponCards();
            this.drawCar(this.selectedCarIndex);

            this.showToast('PROGRESS RESET TO DEFAULT');
        });
    }

    // ------------------------------------------------------------------
    buildTopBar(width, margin, title, subtitle) {
        const barH = this.L.barH;

        const g = this.add.graphics();
        g.fillStyle(0x0a0a09, 0.96);
        g.fillRect(0, 0, width, barH);
        g.fillStyle(C.accent, 1);
        g.fillRect(0, barH - 2, width, 2);

        const titleT = this.add.text(margin, barH / 2 - 1, title, {
            fontFamily: 'Arial Black', fontSize: 20, color: '#ffffff'
        }).setOrigin(0, 0.5);

        this.add.text(margin + titleT.width + 16, barH / 2, subtitle, {
            fontFamily: 'Arial', fontSize: 12, color: '#8a8a80'
        }).setOrigin(0, 0.5);

        const pillW = 210, pillH = 28;
        const pillX = width - margin - pillW;
        const pillY = (barH - pillH) / 2 - 1;

        const pg = this.add.graphics();
        pg.fillStyle(0x151412, 1);
        pg.fillRoundedRect(pillX, pillY, pillW, pillH, 14);
        pg.lineStyle(2, C.gold, 0.9);
        pg.strokeRoundedRect(pillX, pillY, pillW, pillH, 14);
        pg.fillStyle(C.gold, 1);
        pg.fillCircle(pillX + 16, pillY + pillH / 2, 9);

        this.add.text(pillX + 16, pillY + pillH / 2, '$', {
            fontFamily: 'Arial Black', fontSize: 11, color: '#5a4400'
        }).setOrigin(0.5);

        this.add.text(pillX + 34, pillY + pillH / 2, 'CREDITS', {
            fontFamily: 'Arial Black', fontSize: 10, color: '#9a9a90', letterSpacing: 1
        }).setOrigin(0, 0.5);

        this.currencyDisplayText = this.add.text(pillX + pillW - 14, pillY + pillH / 2, '', {
            fontFamily: 'Arial Black', fontSize: 15, color: '#f1c40f'
        }).setOrigin(1, 0.5);
        this.updateCurrencyText();
    }

    // ------------------------------------------------------------------
    buildWeaponRow(width, margin) {
        const { weaponsLabelY, weaponsTop, weaponsH, weaponCardW } = this.L;
        this.sectionHeader(margin, weaponsLabelY, 'WEAPONS', width - margin);

        this.weapons = [
            { name: 'BLASTER', desc: 'Fast fire rate', color: 0xf1c40f, kind: 'blaster', dmg: 2, rate: 5, unlockId: null, cost: 0 },
            { name: 'HOMING MISSILE', desc: 'High damage, slow reload', color: 0xe74c3c, kind: 'missile', dmg: 5, rate: 1, unlockId: 'weapon_missile', cost: 150 },
            { name: 'OIL SLICK', desc: 'Drops a trap behind you', color: 0x95a5a6, kind: 'oil', dmg: 0, rate: 1, unlockId: 'weapon_oil', cost: 100 }
        ];

        const gap = 18;
        const totalW = this.weapons.length * weaponCardW + (this.weapons.length - 1) * gap;
        const startX = width / 2 - totalW / 2;
        const cy = weaponsTop + weaponsH / 2;

        this.weaponCards = this.weapons.map((weapon, i) => {
            const x = startX + i * (weaponCardW + gap);

            const bg = this.add.graphics();

            const ig = this.add.graphics();
            ig.fillStyle(0x121210, 1);
            ig.fillCircle(x + 44, cy, 27);
            ig.lineStyle(2, weapon.color, 0.9);
            ig.strokeCircle(x + 44, cy, 27);
            this.drawWeaponGlyph(ig, weapon.kind, x + 44, cy, weapon.color);

            const nameText = this.add.text(x + 84, weaponsTop + 20, weapon.name, {
                fontFamily: 'Arial Black', fontSize: 13, color: '#ffffff'
            }).setOrigin(0, 0.5);

            const descText = this.add.text(x + 84, weaponsTop + 38, weapon.desc, {
                fontFamily: 'Arial', fontSize: 11, color: '#9a9a90'
            }).setOrigin(0, 0.5);

            this.drawStatRow(x + 84, weaponsTop + 60, 'DMG', weapon.dmg, weapon.color);
            this.drawStatRow(x + 84, weaponsTop + 75, 'RATE', weapon.rate, weapon.color);

            const lockBadge = this.add.graphics();
            const lockText = this.add.text(x + weaponCardW - 16, weaponsTop + 16, '', {
                fontFamily: 'Arial Black', fontSize: 9, color: '#e67e22'
            }).setOrigin(1, 0.5);

            const zone = this.add.zone(x + weaponCardW / 2, cy, weaponCardW, weaponsH)
                .setInteractive({ useHandCursor: true });

            zone.on('pointerdown', () => {
                const w = this.weapons[i];
                if (w.unlockId && !isUnlocked(w.unlockId)) {
                    const result = tryUnlock(w.unlockId, w.cost);
                    if (result.success) {
                        this.updateCurrencyText();
                        this.selectedWeaponIndex = i;
                        this.refreshWeaponCards();
                    } else {
                        this.showToast('NOT ENOUGH CREDITS');
                    }
                    return;
                }

                this.selectedWeaponIndex = i;
                this.refreshWeaponCards();
            });
            zone.on('pointerover', () => {
                this.hoverWeapon = i;
                this.refreshWeaponCards();
            });
            zone.on('pointerout', () => {
                if (this.hoverWeapon === i) this.hoverWeapon = -1;
                this.refreshWeaponCards();
            });

            return { bg, x, color: weapon.color, nameText, descText, lockBadge, lockText };
        });

        this.refreshWeaponCards();
    }

    update() {
        if (this.garageTile) {
            this.garageTile.tilePositionX += 1;
        }
    }

    refreshWeaponCards() {
        const { weaponsTop, weaponsH, weaponCardW } = this.L;

        this.weaponCards.forEach((card, i) => {
            const weapon = this.weapons[i];
            const locked = !!(weapon.unlockId && !isUnlocked(weapon.unlockId));
            const selected = i === this.selectedWeaponIndex;
            const hovered = i === this.hoverWeapon;

            this.drawPanel(card.bg, card.x, weaponsTop, weaponCardW, weaponsH, {
                fill: locked ? 0x1a1a17 : (selected ? 0x2b2718 : (hovered ? C.panelHover : C.panelAlt)),
                stroke: locked ? C.border : (selected ? C.gold : (hovered ? C.borderHover : C.border)),
                strokeWidth: selected && !locked ? 3 : 2,
                radius: 10
            });

            card.bg.fillStyle(card.color, locked ? 0.3 : (selected ? 1 : 0.7));
            card.bg.fillRoundedRect(card.x + 16, weaponsTop, weaponCardW - 32, 4, 2);

            card.nameText.setAlpha(locked ? 0.5 : 1);
            card.descText.setAlpha(locked ? 0.5 : 1);

            card.lockBadge.clear();
            if (locked) {
                const lx = card.x + weaponCardW - 18, ly = weaponsTop + 18;
                card.lockBadge.fillStyle(0x000000, 0.6);
                card.lockBadge.fillCircle(lx, ly, 10);
                card.lockBadge.lineStyle(2, 0xe67e22, 1);
                card.lockBadge.strokeRect(lx - 4, ly - 1, 8, 6);
                card.lockBadge.strokeCircle(lx, ly - 2, 3.5);
                card.lockText.setText(`LOCKED - $${weapon.cost}`);
            } else {
                card.lockText.setText('');
            }

            if (selected && !locked) {
                const bx = card.x + weaponCardW - 18, by = weaponsTop + 18;
                card.bg.fillStyle(C.gold, 1);
                card.bg.fillCircle(bx, by, 9);
                card.bg.lineStyle(2, 0x1a1400, 1);
                card.bg.beginPath();
                card.bg.moveTo(bx - 4, by);
                card.bg.lineTo(bx - 1, by + 3);
                card.bg.lineTo(bx + 4, by - 3);
                card.bg.strokePath();
            }
        });
    }

    drawStatRow(x, y, label, value, color) {
        this.add.text(x, y, label, {
            fontFamily: 'Arial Black', fontSize: 9, color: '#77776e', letterSpacing: 1
        }).setOrigin(0, 0.5);

        const g = this.add.graphics();
        for (let k = 0; k < 5; k++) {
            g.fillStyle(k < value ? color : 0x33332e, 1);
            g.fillRoundedRect(x + 38 + k * 18, y - 4, 15, 7, 2);
        }
    }

    drawWeaponGlyph(g, kind, cx, cy, color) {
        g.fillStyle(color, 1);
        if (kind === 'blaster') {
            g.fillRoundedRect(cx - 14, cy - 9, 15, 5, 2);
            g.fillRoundedRect(cx - 8, cy - 2, 22, 5, 2);
            g.fillRoundedRect(cx - 14, cy + 5, 15, 5, 2);
        } else if (kind === 'missile') {
            g.fillRoundedRect(cx - 13, cy - 4, 22, 8, 3);
            g.fillTriangle(cx + 9, cy - 5, cx + 9, cy + 5, cx + 18, cy);
            g.fillTriangle(cx - 13, cy - 4, cx - 13, cy - 11, cx - 6, cy - 4);
            g.fillTriangle(cx - 13, cy + 4, cx - 13, cy + 11, cx - 6, cy + 4);
            g.fillStyle(0xf39c12, 1);
            g.fillTriangle(cx - 13, cy - 3, cx - 13, cy + 3, cx - 21, cy);
        } else {
            g.fillCircle(cx - 6, cy + 2, 9);
            g.fillCircle(cx + 7, cy + 4, 7);
            g.fillCircle(cx, cy - 4, 7);
            g.fillStyle(0xffffff, 0.35);
            g.fillCircle(cx - 3, cy - 6, 2);
        }
    }

    // ------------------------------------------------------------------
    buildVehiclePanel(width, margin) {
        const { vehicleTop, vehicleH } = this.L;

        const panelG = this.add.graphics();
        this.drawPanel(panelG, margin, vehicleTop, width - margin * 2, vehicleH, { fill: 0x151513, radius: 12 });

        const panelW = width - margin * 2 - 6;
        const panelH = vehicleH - 6;

        this.garageTile = this.add.tileSprite(
            width / 2, vehicleTop + vehicleH / 2,
            panelW, panelH,
            'garage'
        );

        const tex = this.textures.get('garage').getSourceImage();
        const scale = Math.min(panelW / tex.width, panelH / tex.height);
        this.garageTile.setTileScale(scale, scale);

        this.add.text(margin + 18, vehicleTop + 20, 'SELECT VEHICLE', {
            fontFamily: 'Arial Black', fontSize: 12, color: '#e67e22', letterSpacing: 2
        }).setOrigin(0, 0.5);

        this.cars = [
            { name: 'BLACK 3', textureKey: 'black3', unlockId: null, cost: 0 },
            { name: 'PREDATOR', textureKey: 'predator', unlockId: 'car_predator', cost: 200 },
            { name: 'SAND RAT', textureKey: 'sand_rat', unlockId: 'car_sand_rat', cost: 400 }
        ];

        const cx = width / 2;
        const carY = vehicleTop + vehicleH - 90;

        this.add.circle(cx, carY + 48, 70, 0x000000, 0.4).setScale(2.4, 0.16);

        this.carBaseY = carY;
        this.carDisplay = this.add.container(cx, carY);

        this.carNameText = this.add.text(cx, vehicleTop + 50, '', {
            fontFamily: 'Arial Black', fontSize: 20, color: '#ffffff'
        }).setOrigin(0.5);

        this.carStatusText = this.add.text(cx, vehicleTop + 74, '', {
            fontFamily: 'Arial Black', fontSize: 11, color: '#2ecc71', letterSpacing: 2
        }).setOrigin(0.5);

        this.dotsG = this.add.graphics();
        this.carUI = { cx, dotsY: vehicleTop + vehicleH - 20 };

        this.lockOverlay = null;
        this.drawCar(this.selectedCarIndex);

        this.makeArrow(cx - 280, carY, '<', () => {
            this.selectedCarIndex = (this.selectedCarIndex - 1 + this.cars.length) % this.cars.length;
            this.drawCar(this.selectedCarIndex);
        });
        this.makeArrow(cx + 280, carY, '>', () => {
            this.selectedCarIndex = (this.selectedCarIndex + 1) % this.cars.length;
            this.drawCar(this.selectedCarIndex);
        });
    }

    // ------------------------------------------------------------------
    // Scrolling "garage" effect: the car stays put, everything behind it slides past.
    wrap(value, max) {
        return ((value % max) + max) % max;
    }

    makeArrow(x, y, label, onClick) {
        const g = this.add.graphics();
        const draw = (hover) => {
            g.clear();
            g.fillStyle(hover ? C.accent : 0x1e1e1b, 1);
            g.fillCircle(x, y, 24);
            g.lineStyle(2, hover ? 0xffffff : C.border, 1);
            g.strokeCircle(x, y, 24);
        };
        draw(false);

        this.add.text(x, y - 1, label, {
            fontFamily: 'Arial Black', fontSize: 24, color: '#ffffff'
        }).setOrigin(0.5);

        const zone = this.add.zone(x, y, 52, 52).setInteractive({ useHandCursor: true });
        zone.on('pointerover', () => draw(true));
        zone.on('pointerout', () => draw(false));
        zone.on('pointerdown', onClick);
    }

    drawCar(index) {
        this.carDisplay.removeAll(true);

        const car = this.cars[index];
        const locked = !!(car.unlockId && !isUnlocked(car.unlockId));

        const sprite = this.add.image(0, 0, car.textureKey);
        sprite.setScale(Math.min(280 / sprite.width, 110 / sprite.height));
        this.carDisplay.add(sprite);

        this.carNameText.setText(car.name);
        this.carStatusText
            .setText(locked ? `LOCKED  -  $${car.cost}` : 'OWNED')
            .setColor(locked ? '#e67e22' : '#2ecc71');

        const { cx, dotsY } = this.carUI;
        const spacing = 22;
        const startX = cx - ((this.cars.length - 1) * spacing) / 2;
        this.dotsG.clear();
        this.cars.forEach((c, i) => {
            const dx = startX + i * spacing;
            if (i === index) {
                this.dotsG.fillStyle(C.accent, 1);
                this.dotsG.fillRoundedRect(dx - 9, dotsY - 3, 18, 6, 3);
            } else {
                this.dotsG.fillStyle(0x4a4a44, 1);
                this.dotsG.fillCircle(dx, dotsY, 3);
            }
        });

        if (this.lockOverlay) {
            this.lockOverlay.destroy(true);
            this.lockOverlay = null;
        }

        if (locked) {
            this.lockOverlay = this.add.container(this.carDisplay.x, this.carDisplay.y);

            const dim = this.add.rectangle(0, 0, 320, 120, 0x000000, 0.72).setStrokeStyle(2, C.accent);
            const lockText = this.add.text(0, -26, 'LOCKED', {
                fontFamily: 'Arial Black', fontSize: 18, color: '#ffffff', letterSpacing: 2
            }).setOrigin(0.5);

            const unlockBtn = this.add.text(0, 18, `UNLOCK - $${car.cost}`, {
                fontFamily: 'Arial Black', fontSize: 15, color: '#ffffff',
                backgroundColor: '#c0392b', padding: { left: 16, right: 16, top: 8, bottom: 8 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            unlockBtn.on('pointerdown', () => {
                const result = tryUnlock(car.unlockId, car.cost);
                if (result.success) {
                    this.drawCar(this.selectedCarIndex);
                    this.updateCurrencyText();
                } else {
                    unlockBtn.setText('NOT ENOUGH $');
                    this.time.delayedCall(1200, () => unlockBtn.setText(`UNLOCK - $${car.cost}`));
                }
            });

            this.lockOverlay.add([dim, lockText, unlockBtn]);
        }
    }

    // ------------------------------------------------------------------
    buildFooter(width, height, margin) {
        const backW = 120, nextW = 180, btnH = 36;
        const by = height - 50 - btnH / 2;

        // Back
        const bg1 = this.add.graphics();
        const drawBack = (hover) => {
            bg1.clear();
            bg1.fillStyle(hover ? C.accent : 0x1e1e1b, 1);
            bg1.fillRoundedRect(margin, by, backW, btnH, 8);
            bg1.lineStyle(2, hover ? 0xffffff : C.border, 1);
            bg1.strokeRoundedRect(margin, by, backW, btnH, 8);
        };
        drawBack(false);
        this.add.text(margin + backW / 2, by + btnH / 2, '< MENU', {
            fontFamily: 'Arial Black', fontSize: 13, color: '#ffffff'
        }).setOrigin(0.5);
        const backZone = this.add.zone(margin + backW / 2, by + btnH / 2, backW, btnH).setInteractive({ useHandCursor: true });
        backZone.on('pointerover', () => drawBack(true));
        backZone.on('pointerout', () => drawBack(false));
        backZone.on('pointerdown', () => this.scene.start('MainMenu'));

        // Next -> Track Select
        const nextX = width - margin - nextW;
        const bg2 = this.add.graphics();
        const drawNext = (hover) => {
            bg2.clear();
            bg2.fillStyle(hover ? 0xe08a3a : C.accent, 1);
            bg2.fillRoundedRect(nextX, by, nextW, btnH, 8);
            bg2.lineStyle(2, 0xffffff, hover ? 1 : 0.6);
            bg2.strokeRoundedRect(nextX, by, nextW, btnH, 8);
        };
        drawNext(false);
        this.add.text(nextX + nextW / 2, by + btnH / 2, 'SELECT TRACK >', {
            fontFamily: 'Arial Black', fontSize: 14, color: '#1a1200'
        }).setOrigin(0.5);
        const nextZone = this.add.zone(nextX + nextW / 2, by + btnH / 2, nextW, btnH).setInteractive({ useHandCursor: true });
        nextZone.on('pointerover', () => drawNext(true));
        nextZone.on('pointerout', () => drawNext(false));
        nextZone.on('pointerdown', () => {
            const car = this.cars[this.selectedCarIndex];
            const weapon = this.weapons[this.selectedWeaponIndex];

            if (car.unlockId && !isUnlocked(car.unlockId)) {
                this.showToast('UNLOCK YOUR CAR FIRST');
                return;
            }
            if (weapon.unlockId && !isUnlocked(weapon.unlockId)) {
                this.showToast('UNLOCK YOUR WEAPON FIRST');
                return;
            }

            this.scene.start('TrackSelect', {
                weaponIndex: this.selectedWeaponIndex,
                carIndex: this.selectedCarIndex
            });
        });
    }
}