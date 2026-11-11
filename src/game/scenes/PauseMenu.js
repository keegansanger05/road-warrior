import { Scene } from 'phaser';

export class PauseMenu extends Scene {
    constructor() {
        super('PauseMenu');
    }

    init(data) {
        this.parentKey = data.parentKey;
        this.raceData = { weaponIndex: data.weaponIndex, carIndex: data.carIndex };
    }

    create() {
        const { width, height } = this.cameras.main;

        // Dim the frozen race behind the menu
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.65);

        // Panel
        const panelW = 420, panelH = 430;
        this.add.rectangle(width / 2, height / 2, panelW, panelH, 0x1e1e1c)
            .setStrokeStyle(3, 0xe67e22);

        this.add.text(width / 2, height / 2 - 170, 'PAUSED', {
            fontFamily: 'Arial Black', fontSize: 40, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5);

        this.makeButton(width / 2, height / 2 - 90, 'RESUME', 0x27ae60, () => this.resumeRace());
        this.makeButton(width / 2, height / 2 - 20, 'RESTART RACE', 0xc0392b, () => this.restartRace());
        this.makeButton(width / 2, height / 2 + 50, 'MAIN MENU', 0x555550, () => this.quitToMenu());

        // Controls reminder
        this.add.text(width / 2, height / 2 + 125,
            'W / S — Drive     SPACE — Fire     R — Rocket\nA / D mid-air — Flip     ESC / P — Pause', {
            fontFamily: 'Arial', fontSize: 13, color: '#aaaaaa', align: 'center', lineSpacing: 6
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 185, 'Press ESC or P to resume', {
            fontFamily: 'Arial', fontSize: 12, color: '#777770'
        }).setOrigin(0.5);

        // Keyboard shortcuts to resume
        this.input.keyboard.once('keydown-ESC', () => this.resumeRace());
        this.input.keyboard.once('keydown-P', () => this.resumeRace());
    }

    makeButton(x, y, label, color, onClick) {
        const btn = this.add.rectangle(x, y, 260, 48, color)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive({ useHandCursor: true });

        this.add.text(x, y, label, {
            fontFamily: 'Arial Black', fontSize: 18, color: '#ffffff'
        }).setOrigin(0.5);

        btn.on('pointerover', () => btn.setAlpha(0.8));
        btn.on('pointerout', () => btn.setAlpha(1));
        btn.on('pointerdown', onClick);
    }

    resumeRace() {
        this.scene.resume(this.parentKey);
        this.scene.stop();
    }

    restartRace() {
        // Starting the parent while it's paused shuts it down and restarts it fresh
        this.scene.start(this.parentKey, this.raceData);
    }

    quitToMenu() {
        this.scene.stop(this.parentKey);
        this.scene.start('LoadoutSelect');
    }
}