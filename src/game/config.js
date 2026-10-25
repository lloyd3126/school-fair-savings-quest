import Phaser from 'phaser';
import MainScene from './scenes/MainScene.js';

const gameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  backgroundColor: '#f3f7ef',
  parent: 'game',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MainScene],
};

export default gameConfig;
