import { Boot } from './scenes/Boot';
import { Game as MainGame } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';
import { AUTO, Game } from 'phaser';
import { TrackSelect } from './scenes/TrackSelect';
import { Track1 } from './scenes/Track1';
import { Track2 } from './scenes/Track2';
import { Track3 } from './scenes/Track3';
import { TrackBoss } from './scenes/TrackBoss';
import { Results } from './scenes/Results';
import { PauseMenu } from './scenes/PauseMenu';
import { LoadoutSelect } from './scenes/LoadoutSelect';


//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config = {
    type: AUTO,
    width: 1324,
    height: 668,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    scene: [Boot, Preloader, MainMenu, LoadoutSelect, TrackSelect, Track1, Track2, Track3, TrackBoss, Results, PauseMenu, MainGame, GameOver]
};

const StartGame = (parent) => {
    return new Game({ ...config, parent });
}

export default StartGame;