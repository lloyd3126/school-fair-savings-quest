import Phaser from 'phaser';
import gameConfig from './config.js';

export function startGame() {
  return new Phaser.Game(gameConfig);
}
