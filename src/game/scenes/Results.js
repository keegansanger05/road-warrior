import { Scene } from 'phaser';
import { loadProgress } from '../utils/progress';

export class Results extends Scene {
    constructor() {
        super('Results');
    }

    init(data) {
        this.standings = data.standings || [];
        this.playerPosition = data.playerPosition || null;
        this.playerReward = data.playerReward || 0;
    }

    create() {
        const { width, height } = this.cameras.main;
        const cx = width / 2;

        this.add.image(cx, height / 2, 'resultsBackground').setDisplaySize(width, height);

        // Dark overlay so the text stays readable on any background
        this.add.rectangle(cx, height / 2, width, height, 0x000000, 0.45);

        // ---- Title -------------------------------------------------------
        const title = this.add.text(cx, 56, 'RACE RESULTS', {
            fontFamily: 'Arial Black', fontSize: 44, color: '#ffffff',
            stroke: '#000000', strokeThickness: 7
        }).setOrigin(0.5);
        this.add.rectangle(cx, 92, 360, 4, 0xe67e22);
        title.setAlpha(0);
        this.tweens.add({ targets: title, alpha: 1, y: 60, duration: 400, ease: 'Cubic.Out' });

        // ---- Player summary panel ---------------------------------------
        this.buildSummaryPanel(cx, 175);

        // ---- Standings table ---------------------------------------------
        const tableTop = 285;
        const rowHeight = 56;
        const tableW = 640;

        this.add.text(cx - tableW / 2 + 30, tableTop - 28, 'POS', {
            fontFamily: 'Arial Black', fontSize: 13, color: '#aaaaaa'
        }).setOrigin(0, 0.5);
        this.add.text(cx - tableW / 2 + 150, tableTop - 28, 'RACER', {
            fontFamily: 'Arial Black', fontSize: 13, color: '#aaaaaa'
        }).setOrigin(0, 0.5);
        this.add.text(cx + tableW / 2 - 30, tableTop - 28, 'PRIZE', {
            fontFamily: 'Arial Black', fontSize: 13, color: '#aaaaaa'
        }).setOrigin(1, 0.5);

        this.standings.forEach((racer, i) => {
            const place = i + 1;
            const y = tableTop + i * rowHeight;
            const isPlayer = racer.isPlayer;
            const isDefeated = !!racer.isDefeatedEntry;
            const reward = isPlayer ? this.playerReward : this.getRewardForPosition(place);

            const row = this.add.container(0, y);

            const bg = this.add.rectangle(cx, 0, tableW, rowHeight - 8,
                isPlayer ? 0x3a2a1a : 0x1e1e22, isPlayer ? 0.95 : 0.85
            ).setStrokeStyle(2, isPlayer ? 0xe67e22 : 0x444444);
            row.add(bg);

            // Medal circle for the placing
            const medalColor = isDefeated ? 0x5a2a2a
                : place === 1 ? 0xf1c40f
                : place === 2 ? 0xbdc3c7
                : place === 3 ? 0xcd7f32
                : 0x555555;
            const medal = this.add.circle(cx - tableW / 2 + 50, 0, 18, medalColor)
                .setStrokeStyle(2, 0x000000, 0.6);
            row.add(medal);

            const placeLabel = this.add.text(cx - tableW / 2 + 50, 0, String(place), {
                fontFamily: 'Arial Black', fontSize: 20, color: '#1a1a1a'
            }).setOrigin(0.5);
            row.add(placeLabel);

            const ordinal = this.add.text(cx - tableW / 2 + 82, 0, this.getPlacementText(place), {
                fontFamily: 'Arial Black', fontSize: 16,
                color: isDefeated ? '#aa5555' : '#cccccc'
            }).setOrigin(0, 0.5);
            row.add(ordinal);

            const nameColor = isDefeated ? '#aa5555' : (isPlayer ? '#ffcc00' : '#ffffff');
            const name = this.add.text(cx - tableW / 2 + 150, 0, racer.name, {
                fontFamily: 'Arial Black', fontSize: 20, color: nameColor
            }).setOrigin(0, 0.5);
            row.add(name);

            if (isPlayer) {
                const tag = this.add.text(cx + 80, 0, 'YOU', {
                    fontFamily: 'Arial Black', fontSize: 12, color: '#1a1a1a',
                    backgroundColor: '#ffcc00',
                    padding: { left: 6, right: 6, top: 2, bottom: 2 }
                }).setOrigin(0, 0.5);
                row.add(tag);
            }

            if (reward > 0) {
                const prize = this.add.text(cx + tableW / 2 - 30, 0, `+${reward}`, {
                    fontFamily: 'Arial Black', fontSize: 20, color: '#2ecc71'
                }).setOrigin(1, 0.5);
                row.add(prize);
            } else {
                const none = this.add.text(cx + tableW / 2 - 30, 0, '-', {
                    fontFamily: 'Arial Black', fontSize: 20, color: '#666666'
                }).setOrigin(1, 0.5);
                row.add(none);
            }

            // Slide each row in, one after the other
            row.setAlpha(0);
            row.x = -80;
            this.tweens.add({
                targets: row,
                x: 0,
                alpha: 1,
                duration: 350,
                delay: 300 + i * 120,
                ease: 'Cubic.Out'
            });
        });

        // ---- Buttons -----------------------------------------------------
        const buttonsY = tableTop + this.standings.length * rowHeight + 40;

        const retryBtn = this.add.text(cx, buttonsY, 'RACE AGAIN', {
            fontFamily: 'Arial Black', fontSize: 26, color: '#ffffff',
            backgroundColor: '#c0392b',
            padding: { left: 30, right: 30, top: 12, bottom: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        retryBtn.on('pointerover', () => retryBtn.setStyle({ color: '#ffcc00' }));
        retryBtn.on('pointerout', () => retryBtn.setStyle({ color: '#ffffff' }));
        retryBtn.on('pointerdown', () => {
            this.scene.start('TrackSelect');
        });

        const menuBtn = this.add.text(cx, buttonsY + 58, 'Main Menu', {
            fontFamily: 'Arial', fontSize: 16, color: '#aaaaaa'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerover', () => menuBtn.setColor('#ffffff'));
        menuBtn.on('pointerout', () => menuBtn.setColor('#aaaaaa'));
        menuBtn.on('pointerdown', () => {
            this.scene.start('LoadoutSelect');
        });

        // Celebration for a win
        if (this.playerPosition === 1) {
            this.spawnConfetti(width, height);
        }
    }

    buildSummaryPanel(cx, cy) {
        const panelW = 640;
        const panelH = 130;
        const place = this.playerPosition;

        let headline = 'RACE COMPLETE';
        let headlineColor = '#ffffff';
        if (place === 1) {
            headline = 'VICTORY!';
            headlineColor = '#f1c40f';
        } else if (place === 2 || place === 3) {
            headline = 'PODIUM FINISH';
            headlineColor = place === 2 ? '#d5dbdb' : '#cd7f32';
        } else if (place) {
            headline = 'BETTER LUCK NEXT TIME';
            headlineColor = '#e74c3c';
        }

        const panel = this.add.rectangle(cx, cy, panelW, panelH, 0x14141a, 0.92)
            .setStrokeStyle(3, place === 1 ? 0xf1c40f : 0xe67e22);

        const headlineText = this.add.text(cx - panelW / 2 + 30, cy - 34, headline, {
            fontFamily: 'Arial Black', fontSize: 32, color: headlineColor,
            stroke: '#000000', strokeThickness: 5
        }).setOrigin(0, 0.5);

        const subText = place
            ? `You finished ${this.getPlacementText(place)} of ${this.standings.length}`
            : 'Thanks for racing';
        this.add.text(cx - panelW / 2 + 30, cy + 4, subText, {
            fontFamily: 'Arial Black', fontSize: 18, color: '#cccccc'
        }).setOrigin(0, 0.5);

        // Credits earned (counts up) and the player's new balance
        const earned = this.add.text(cx + panelW / 2 - 30, cy - 24, '', {
            fontFamily: 'Arial Black', fontSize: 26,
            color: this.playerReward > 0 ? '#f1c40f' : '#888888',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(1, 0.5);

        if (this.playerReward > 0) {
            earned.setText('+0 CREDITS');
            this.tweens.addCounter({
                from: 0,
                to: this.playerReward,
                duration: 900,
                delay: 400,
                onUpdate: (tween) => {
                    earned.setText(`+${Math.round(tween.getValue())} CREDITS`);
                }
            });
        } else {
            earned.setText('NO CREDITS EARNED');
            earned.setFontSize(18);
        }

        const balance = loadProgress().currency;
        this.add.text(cx + panelW / 2 - 30, cy + 14, `BALANCE: $${balance}`, {
            fontFamily: 'Arial Black', fontSize: 16, color: '#ffffff'
        }).setOrigin(1, 0.5);

        // Gentle pop-in
        panel.setAlpha(0);
        headlineText.setAlpha(0);
        this.tweens.add({ targets: [panel], alpha: 0.92, duration: 350, delay: 150 });
        this.tweens.add({ targets: headlineText, alpha: 1, duration: 350, delay: 250 });
    }

    spawnConfetti(width, height) {
        const colors = [0xf1c40f, 0xe74c3c, 0x2ecc71, 0x3498db, 0xe67e22];
        for (let i = 0; i < 50; i++) {
            const piece = this.add.rectangle(
                Math.random() * width,
                -20 - Math.random() * 200,
                6 + Math.random() * 6,
                10 + Math.random() * 8,
                colors[i % colors.length]
            );
            piece.setRotation(Math.random() * Math.PI);
            this.tweens.add({
                targets: piece,
                y: height + 40,
                x: piece.x + (Math.random() * 160 - 80),
                rotation: piece.rotation + Math.PI * 4,
                duration: 2500 + Math.random() * 2500,
                delay: Math.random() * 1500,
                onComplete: () => piece.destroy()
            });
        }
    }

    getPlacementText(place) {
        const suffixes = { 1: 'ST', 2: 'ND', 3: 'RD' };
        return `${place}${suffixes[place] || 'TH'}`;
    }

    getRewardForPosition(place) {
        const rewards = { 1: 100, 2: 75, 3: 50 };
        return rewards[place] || 0;
    }
}