import { Scene } from 'phaser';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        const { width, height } = this.cameras.main;
        const margin = 50; // safe zone from every edge

        // --- Background ---
        this.add.image(width / 2, height / 2, 'menuBackground').setDisplaySize(width, height);
        this.add.rectangle(width / 2, height * 0.32, width, height * 0.55, 0x1c1c1c, 0.6);

        // --- Nav bar (well inside top margin) ---
        const navY = margin + 20;
        this.add.rectangle(width / 2, navY, width - margin, 56, 0x0d0d0d).setStrokeStyle(1, 0x2a2a2a);
        this.add.text(margin + 20, navY, 'ROAD WARRIOR', {
            fontFamily: 'Arial Black', fontSize: 18, color: '#e74c3c'
        }).setOrigin(0, 0.5);
        this.add.text(width - margin - 20, navY, 'PHASER EDITION', {
            fontFamily: 'Arial', fontSize: 13, color: '#666666'
        }).setOrigin(1, 0.5);

        const stripeY = navY + 40;
        for (let x = margin; x < width - margin; x += 100) {
            this.add.rectangle(x, stripeY, 50, 4, 0xffcc00, 0.6);
        }

        // --- Hero title ---
        const heroY = stripeY + 90;
        this.add.text(width / 2 + 4, heroY + 4, 'ROAD WARRIOR', {
            fontFamily: 'Arial Black', fontSize: 62, color: '#000000'
        }).setOrigin(0.5).setAlpha(0.45);

        this.add.text(width / 2, heroY, 'ROAD WARRIOR', {
            fontFamily: 'Arial Black', fontSize: 62, color: '#ffffff',
            stroke: '#e74c3c', strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(width / 2, heroY + 55, 'ARCADE COMBAT RACING', {
            fontFamily: 'Arial', fontSize: 17, color: '#999999', letterSpacing: 3
        }).setOrigin(0.5);

        // --- CTA Play button ---
        const btnW = 220, btnH = 64;
        const btnX = width / 2, btnY = heroY + 130;

        const btnShadow = this.add.graphics();
        btnShadow.fillStyle(0x000000, 0.4);
        btnShadow.fillRoundedRect(btnX - btnW / 2 + 4, btnY - btnH / 2 + 5, btnW, btnH, 10);

        const btnBg = this.add.graphics();
        btnBg.fillStyle(0xc0392b, 1);
        btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
        btnBg.lineStyle(3, 0xffffff, 0.9);
        btnBg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);

        const btnText = this.add.text(btnX, btnY, 'PLAY NOW', {
            fontFamily: 'Arial Black', fontSize: 24, color: '#ffffff'
        }).setOrigin(0.5);

        const btnZone = this.add.zone(btnX, btnY, btnW, btnH)
            .setInteractive({ useHandCursor: true });

        btnZone.on('pointerover', () => {
            btnBg.clear();
            btnBg.fillStyle(0xe74c3c, 1);
            btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
            btnBg.lineStyle(3, 0xffcc00, 1);
            btnBg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
            btnText.setColor('#ffcc00');
        });
        btnZone.on('pointerout', () => {
            btnBg.clear();
            btnBg.fillStyle(0xc0392b, 1);
            btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
            btnBg.lineStyle(3, 0xffffff, 0.9);
            btnBg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
            btnText.setColor('#ffffff');
        });
        btnZone.on('pointerdown', () => {
            this.scene.start('LoadoutSelect');
        });

        // --- Divider ---
        const dividerY = btnY + 70;
        this.add.rectangle(width / 2, dividerY, width - margin * 2, 1, 0x2a2a2a);

        // --- Feature cards ---
        const features = [
            { title: 'WEAPONS', desc: '3+ unique loadouts', color: 0xe74c3c },
            { title: 'AI RACERS', desc: 'Smart opponents', color: 0x2980b9 },
            { title: 'STUNTS', desc: 'Mid-air flips', color: 0xf39c12 }
        ];

        const cardW = 200, cardHeight = 120, gap = 25;
        const totalW = features.length * cardW + (features.length - 1) * gap;
        const startX = width / 2 - totalW / 2 + cardW / 2;
        const cardY = dividerY + 90;

        features.forEach((f, i) => {
            const cx = startX + i * (cardW + gap);

            // Card background
            this.add.rectangle(cx, cardY, cardW, cardHeight, 0x1e1e1e).setStrokeStyle(1, 0x333333);
            this.add.rectangle(cx, cardY - cardHeight / 2, cardW, 4, f.color);

            // Icon badge
            const badgeRadius = 25;
            this.add.circle(cx, cardY - 25, badgeRadius, f.color, 0.25).setStrokeStyle(2, f.color);

            // Draw the appropriate icon directly with Graphics
            if (f.title === 'WEAPONS') this.drawWeaponIcon(cx, cardY - 25);
            else if (f.title === 'AI RACERS') this.drawAIIcon(cx, cardY - 25);
            else if (f.title === 'STUNTS') this.drawStuntIcon(cx, cardY - 25);

            // Title and description
            this.add.text(cx, cardY + 12, f.title, {
                fontFamily: 'Arial Black', fontSize: 15, color: '#ffffff'
            }).setOrigin(0.5);

            this.add.text(cx, cardY + 33, f.desc, {
                fontFamily: 'Arial', fontSize: 12, color: '#888888'
            }).setOrigin(0.5);
        });

        // --- Controls footer (well inside bottom margin) ---
        const footerY = height - margin - 20;
        this.add.rectangle(width / 2, footerY, width - margin, 60, 0x0d0d0d).setStrokeStyle(1, 0x2a2a2a);

        this.add.text(width / 2, footerY - 14, 'CONTROLS', {
            fontFamily: 'Arial Black', fontSize: 12, color: '#ffcc00'
        }).setOrigin(0.5);

        this.add.text(width / 2, footerY + 10, 'W / S — Drive    A / D mid-air — Flip    SPACE — Fire    R — Rocket', {
            fontFamily: 'Arial', fontSize: 13, color: '#aaaaaa'
        }).setOrigin(0.5);
    }

    drawWeaponIcon(x, y) {
        const g = this.add.graphics();
        g.fillStyle(0xffffff, 1);
        g.fillRoundedRect(x - 20, y - 5, 28, 10, 2);
        g.fillRoundedRect(x + 8, y - 3, 14, 6, 1);
        g.fillTriangle(x - 18, y + 5, x - 10, y + 5, x - 14, y + 16);
    }

    drawAIIcon(x, y) {
        const g = this.add.graphics();
        g.fillStyle(0xffffff, 1);
        g.fillRoundedRect(x - 14, y - 12, 28, 22, 5);
        g.fillRect(x - 2, y - 20, 4, 8);
        g.fillCircle(x, y - 22, 3);
        g.fillStyle(0x000000, 0.4);
        g.fillCircle(x - 6, y - 3, 3);
        g.fillCircle(x + 6, y - 3, 3);
        g.fillRoundedRect(x - 7, y + 5, 14, 3, 1);
    }

    drawStuntIcon(x, y) {
        const g = this.add.graphics();
        g.lineStyle(4, 0xffffff, 1);
        g.beginPath();
        g.arc(x, y, 16, 3.49, 8.73);
        g.strokePath();
        g.fillStyle(0xffffff, 1);
        g.fillTriangle(x + 12, y + 14, x + 20, y + 10, x + 16, y + 22);
        g.fillRoundedRect(x - 12, y - 6, 22, 8, 2);
        g.fillCircle(x - 7, y + 4, 3);
        g.fillCircle(x + 5, y + 4, 3);
    }
}