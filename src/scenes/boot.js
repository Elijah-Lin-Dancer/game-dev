/* 启动场景：加载素材、建动画、跳 Play */
import { DIRS } from '../core/config.js';
export class Boot extends Phaser.Scene {
  constructor() { super('boot'); }

  preload() {
    const A = window.ASSET_DATA;
    this.load.spritesheet('walk', A.walk, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('idle', A.idle, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('field', A.field, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('beast', A.beast, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('slash', A.slash, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('heart', A.heart, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('boss', A.boss, { frameWidth: 40, frameHeight: 40 });
    this.load.spritesheet('coin', A.coin, { frameWidth: 10, frameHeight: 10 });
    Object.entries(A.sfx).forEach(([k, uri]) => this.load.audio(k, uri));
  }

  create() {
    Object.entries(DIRS).forEach(([dir, col]) => {
      this.anims.create({
        key: 'walk-' + dir,
        frames: [0, 4, 8, 12].map((row) => ({ key: 'walk', frame: row + col })),
        frameRate: 9, repeat: -1,
      });
      this.anims.create({
        key: 'beast-' + dir,
        frames: [0, 4, 8, 12].map((row) => ({ key: 'beast', frame: row + col })),
        frameRate: 8, repeat: -1,
      });
    });
    this.anims.create({
      key: 'idle-down',
      frames: this.anims.generateFrameNumbers('idle', { start: 0, end: 3 }),
      frameRate: 5, repeat: -1,
    });
    this.anims.create({
      key: 'slash-play',
      frames: this.anims.generateFrameNumbers('slash', { start: 0, end: 3 }),
      frameRate: 13, repeat: 0,
    });
    this.anims.create({
      key: 'coin-spin',
      frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 3 }),
      frameRate: 10, repeat: -1,
    });
    this.anims.create({
      key: 'boss-idle',
      frames: this.anims.generateFrameNumbers('boss', { start: 0, end: 4 }),
      frameRate: 7, repeat: -1,
    });
    this.scene.start('play');
  }
}
