import { Scene } from 'phaser';

export class Game extends Scene {
    constructor() {
        super('Game');
    }

    init(data) {
        this.selectedTrackWidth = data.trackWidth || 1500;
    }

    create() {
        const trackWidth = this.selectedTrackWidth;
        const trackHeight = 768;

        this.cameras.main.setBackgroundColor('#2d2d2d');

        // Expand the physics world and camera bounds to the full track length
        this.physics.world.setBounds(0, 0, trackWidth, trackHeight);
        this.cameras.main.setBounds(0, 0, trackWidth, trackHeight);

        // Ground spanning the entire track
        const groundRect = this.add.rectangle(trackWidth / 2, 750, trackWidth, 40, 0x000000, 0);
        this.physics.add.existing(groundRect, true);
        this.ground = groundRect;

        // Player
        this.player = this.physics.add.sprite(200, 600, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDamping(true);
        this.player.setDrag(0.85);
        this.player.setMaxVelocity(300);
        this.player.setBounce(0.1);
        this.raceFinished = false;

        this.physics.add.collider(this.player, this.ground);

        // --- Test ramps (temporary, for testing airborne rotation - replace with Tiled levels in Phase 7) ---
        const rampData = [
            { x: 700, launchVelocityY: -450, launchVelocityX: 100 }
        ];

        rampData.forEach(r => {
            // Visual ramp shape (just for looks, not used for collision)
            this.add.rectangle(r.x, 680, 180, 20, 0x555555).setAngle(-20);

            // Invisible trigger zone the player drives through
            const zone = this.add.zone(r.x, 700, 100, 60);
            this.physics.add.existing(zone, true);

            this.physics.add.overlap(this.player, zone, () => {
                if (this.player.body.touching.down) {
                    this.player.setVelocityY(r.launchVelocityY);
                    this.player.setVelocityX(this.player.body.velocity.x + r.launchVelocityX);
                }
            });
        });

        // Camera follows the player horizontally
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Distance markers along the track
        for (let x = 0; x < trackWidth; x += 200) {
            this.add.rectangle(x, 700, 4, 100, 0xffffff, 0.3);
        }

        // Finish line - visual bar
        this.add.rectangle(trackWidth - 100, 400, 10, 700, 0xff0000, 0.8);

        // Finish line - invisible physics zone for detecting the player crossing it
        this.finishLine = this.add.zone(trackWidth - 100, 400, 10, 700);
        this.physics.add.existing(this.finishLine, true);

        // Overlap check - now that finishLine exists
        this.physics.add.overlap(this.player, this.finishLine, () => {
            if (!this.raceFinished) {
                this.raceFinished = true;
                this.onRaceComplete();
            }
        });

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D,SPACE');
    }

    update() {
        const player = this.player;
        const accel = 400;
        const isGrounded = player.body.touching.down;

        // Left/right movement
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            player.body.setAccelerationX(-accel);
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            player.body.setAccelerationX(accel);
        } else {
            player.body.setAccelerationX(0);
        }

        // Flip while airborne only
        if (!isGrounded) {
            if (this.wasd.W.isDown) {
                player.rotation -= 0.08;
            } else if (this.wasd.S.isDown) {
                player.rotation += 0.08;
            }
        } else {
            // Snap rotation back to level once grounded
            player.rotation = 0;
        }
    }

    onRaceComplete() {
        console.log('Race finished!');

        // Stop the player from moving further
        this.player.body.setVelocity(0, 0);
        this.player.body.setAcceleration(0, 0);

        // "FINISH!" text
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 40, 'FINISH!', {
            fontFamily: 'Arial Black', fontSize: 64, color: '#00ff00',
            stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5).setScrollFactor(0);

        // Prompt to return to menu
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 40, 'Press SPACE to return to Main Menu', {
            fontFamily: 'Arial', fontSize: 20, color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0);

        // Listen for input to go back to MainMenu
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('MainMenu');
        });
    }
}