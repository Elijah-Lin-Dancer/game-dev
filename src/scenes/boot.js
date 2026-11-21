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
    this.load.json('__story', A.storyUrl);       // 对话与事件文本，同样有内嵌兜底
    this.load.json('__weapons', A.weaponsUrl);   // 武器表，同样有内嵌兜底
    this.load.json('__talents', A.talentsUrl);   // 天赋表，同样有内嵌兜底
    this.load.json('__chars', A.charsUrl);       // 角色表，同样有内嵌兜底
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
    window.__storyData = this.cache.json.get('__story') || A.storyData;
    window.__weaponsData = this.cache.json.get('__weapons') || A.weaponsData;
    window.__talentsData = this.cache.json.get('__talents') || A.talentsData;
    window.__charsData = this.cache.json.get('__chars') || A.charsData;
    window.__chaptersData = A.chaptersData;
    if (location.search.indexOf('debug') >= 0) window.__balance = { source: ext ? 'json' : 'embedded', applied };
    this.unpackAtlas(A.packMeta);
    Object.entries(DIRS).forEach(([dir, col]) => {
      this.anims.create({
        key: 'walk-' + dir,
        frames: [0, 4, 8, 12].map((row) => ({ key: 'walk', frame: row + col })),
        frameRate: 9, repeat: -1,
      });
      ['beast', 'cyclope', 'eye', 'larva', 'slime', 'spider', 'owl', 'mush', 'mole', 'skull'].forEach((k) => {
        this.anims.create({
          key: k + '-' + dir,
          frames: [0, 4, 8, 12].map((row) => ({ key: k, frame: row + col })),
          frameRate: 8, repeat: -1,
        });
      });
    });
    // 批 5：三套角色皮肤（忍者沿用 walk/idle，法师与骑士各自一套）
    const SKIN = { ninja: ['walk', 'idle'], mage: ['walkMage', 'idleMage'], knight: ['walkKnight', 'idleKnight'] };
    Object.entries(SKIN).forEach(([skin, [wk, ik]]) => {
      Object.entries(DIRS).forEach(([dir, col]) => {
        this.anims.create({
          key: 'p-' + skin + '-walk-' + dir,
          frames: [0, 4, 8, 12].map((row) => ({ key: wk, frame: row + col })),
          frameRate: 9, repeat: -1,
        });
        this.anims.create({
          key: 'p-' + skin + '-idle-' + dir,
          frames: [{ key: ik, frame: col }],
          frameRate: 1, repeat: -1,
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
    // 批 1：四套斩击（每把近战武器各一套）+ 火球
    ['slA', 'slB', 'slC'].forEach((k) => {
      this.anims.create({
        key: k + '-play',
        frames: this.anims.generateFrameNumbers(k, { start: 0, end: 3 }),
        frameRate: 14, repeat: 0,
      });
    });
    this.anims.create({
      key: 'slD-play',
      frames: this.anims.generateFrameNumbers('slD', { start: 0, end: 4 }),
      frameRate: 16, repeat: 0,
    });
    // 批 2：篝火 4 帧循环、精英光环 4 帧循环
    this.anims.create({
      key: 'campfire-burn',
      frames: this.anims.generateFrameNumbers('campfire', { start: 0, end: 3 }),
      frameRate: 8, repeat: -1,
    });
    this.anims.create({
      key: 'aura-pulse',
      frames: this.anims.generateFrameNumbers('aura', { start: 0, end: 3 }),
      frameRate: 6, repeat: -1,
    });
    // 批 4：蓝武士（第二只 Boss）的待机/走路/横斩/突进
    this.anims.create({
      key: 'sam-idle', frames: this.anims.generateFrameNumbers('samIdle', { start: 0, end: 5 }),
      frameRate: 7, repeat: -1,
    });
    this.anims.create({
      key: 'sam-walk', frames: this.anims.generateFrameNumbers('samWalk', { start: 0, end: 11 }),
      frameRate: 11, repeat: -1,
    });
    ['L', 'R'].forEach((d) => {
      this.anims.create({
        key: 'sam-atk' + d, frames: this.anims.generateFrameNumbers('samAtk' + d, { start: 0, end: 3 }),
        frameRate: 18, repeat: 0,
      });
      this.anims.create({
        key: 'sam-chg' + d, frames: this.anims.generateFrameNumbers('samChg' + d, { start: 0, end: 2 }),
        frameRate: 12, repeat: 0,
      });
    });
    this.anims.create({
      key: 'fireball-play',
      frames: this.anims.generateFrameNumbers('fireball', { start: 0, end: 3 }),
      frameRate: 14, repeat: -1,
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
    const m = /(?:\?|&)char=([a-z]+)/.exec(location.search);
    if (m && ['ninja', 'mage', 'knight'].includes(m[1])) this.scene.start('play', { char: m[1] });
    else this.scene.start('title');
  }
}
