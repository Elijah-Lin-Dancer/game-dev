/* 启动场景：加载素材、建动画、跳 Play */
import { DIRS } from '../core/config.js';
import { applyBalance, balanceDigest } from '../systems/data.js';
export class Boot extends Phaser.Scene {
  constructor() { super('boot'); }

  preload() {
    const A = window.ASSET_DATA;
    // 一次请求拿整张图集，切片在 create 里按区域还原成原来的 spritesheet
    this.load.image('__pack', A.pack);
    this.load.json('__balance', A.balanceUrl);   // 外部数值：失败就用构建期内嵌副本
    Object.entries(A.sfx).forEach(([k, uri]) => this.load.audio(k, uri));
  }

  /* 图集 → 与原素材一一对应的 spritesheet，帧号语义不变 */
  unpackAtlas(meta) {
    const src = this.textures.get('__pack').getSourceImage();
    for (const [key, r] of Object.entries(meta.sheets)) {
      const cv = document.createElement('canvas');
      cv.width = r.w; cv.height = r.h;
      const ctx = cv.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(src, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
      this.textures.addSpriteSheet(key, cv, { frameWidth: r.fw, frameHeight: r.fh });
    }
    this.textures.remove('__pack');
  }

  create() {
    const A = window.ASSET_DATA;
    const ext = this.cache.json.get('__balance');
    const applied = applyBalance(ext || A.gameData);
    if (location.search.indexOf('debug') >= 0) window.__balance = { source: ext ? 'json' : 'embedded', applied };
    this.unpackAtlas(A.packMeta);
    Object.entries(DIRS).forEach(([dir, col]) => {
      this.anims.create({
        key: 'walk-' + dir,
        frames: [0, 4, 8, 12].map((row) => ({ key: 'walk', frame: row + col })),
        frameRate: 9, repeat: -1,
      });
      ['beast', 'cyclope', 'eye', 'larva'].forEach((k) => {
        this.anims.create({
          key: k + '-' + dir,
          frames: [0, 4, 8, 12].map((row) => ({ key: k, frame: row + col })),
          frameRate: 8, repeat: -1,
        });
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
      key: 'ball-fly',
      frames: this.anims.generateFrameNumbers('ball', { start: 0, end: 3 }),
      frameRate: 12, repeat: -1,
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
