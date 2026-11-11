import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, 'background');

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');

        this.load.image('player', 'https://labs.phaser.io/assets/sprites/car90.png');

        this.load.image('black3', 'black3.png');
        this.load.image('predator', 'predator.png');
        this.load.image('sand_rat', 'sand_rat.png');

        this.load.image('garage', 'garage1.png');

        this.load.image('ai_1', 'ai_1.png');
        this.load.image('ai_2', 'ai_2.png');
        this.load.image('ai_3', 'ai_3.png');
        this.load.image('chainsawjack', 'ai_4.png');

        this.load.image('icon_weapons', 'icon_weapons.png');
        this.load.image('icon_ai', 'icon_ai.png');
        this.load.image('icon_stunts', 'icon_stunts.png');

        this.load.image('menuBackground', 'background1.png');
        this.load.image('resultsBackground', 'background3.png');

        this.load.image('track_card1', 'track_card1.png');
        this.load.image('track_card2', 'track_card2.png');
        this.load.image('track_card3', 'track_card3.png');
        this.load.image('boss_card', 'boss1.png');

        this.load.image('track1Tiles', 'track1-tileset.png');
        this.load.image('desert', 'race_background1.png');

        this.load.image('ice', 'race_background2.png');
        this.load.image('track2Tiles', 'track2-tileset.png');
    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}
