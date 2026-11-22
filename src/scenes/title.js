/* 标题画面（批 8 外壳）：进游戏的第一屏，也是"设置"的入口
 *
 * 为什么先做这个：批 1–7 一直是"打开网页直接进游戏"，没有标题、没有设置、没有暂停，
 * 玩家连"这是个完整游戏"的第一印象都拿不到。外壳是骨架，先立起来。
 *
 * 素材：地面用 Interior 花砖、角色用现成立绘、火把用 FX/Aura，全部包内件，无外部件无自绘。
 */
import { FONT, S } from '../core/config.js';
import { loadSave } from '../systems/save.js';
import { loadOptions, patchOptions } from '../systems/options.js';
import { NAV } from '../systems/nav.js';

const ITEMS = ['开始冒险', '收藏小屋', '设置', '制作名单'];

export class Title extends Phaser.Scene {
  constructor() { super('title'); }

  create() {
    NAV.reset('title');
    this.idx = 0;
    this.meta = loadSave();
    this.options = loadOptions();
    this.setting = false;
    this.settingIdx = 0;

    this.buildBackdrop();
    this.buildTitle();
    this.buildMenu();
    this.bindKeys();
  }

  buildBackdrop() {
    this.add.rectangle(0, 0, S.W, S.H, 0x1a211c).setOrigin(0);
    this.add.tileSprite(0, 0, S.W, S.H, 'floorDungeon', 322)
      .setOrigin(0).setTint(0x5d6772).setAlpha(0.85);
    this.add.rectangle(0, 0, S.W, S.H, 0x000000, 0.35).setOrigin(0);
    // 左右各一支火把，和游戏里同一套伪光
    [[36, S.H - 30], [S.W - 36, S.H - 30]].forEach(([x, y], i) => {
      const glow = this.add.image(x, y - 4, 'aura', 0).setScale(3.4).setAlpha(0.3)
        .setTint(0xff9a4a).setBlendMode(Phaser.BlendModes.ADD);
      this.add.sprite(x, y, 'campfire', 0).setScale(2).setDepth(1).play('campfire-burn');
      this.tweens.add({ targets: glow, alpha: 0.16, scale: 3.9, duration: 560 + i * 70, yoyo: true, repeat: -1 });
    });
    // 三个角色立绘站台，暗示可选角色池
    ['faceNinja', 'faceMage', 'faceKnight'].forEach((k, i) => {
      this.add.image(S.W / 2 - 120 + i * 120, S.H - 96, k, 0).setScale(1.4).setAlpha(0.85);
    });
  }

  buildTitle() {
    this.add.text(S.W / 2, 22, '归 途', {
      fontFamily: FONT, fontSize: '36px', color: '#ffe9b0',
    }).setOrigin(0.5, 0);
    this.add.text(S.W / 2, 66, '星 火 之 章', {
      fontFamily: FONT, fontSize: '14px', color: '#e6c07a',
    }).setOrigin(0.5, 0);
    this.add.text(S.W / 2, 88, '多角色动作 Roguelike · 六章冒险', {
      fontFamily: FONT, fontSize: '11px', color: '#c8d8c0',
    }).setOrigin(0.5, 0);
    const m = this.meta;
    this.add.text(S.W / 2, S.H - 22,
      '已解锁 ' + (m.chars ? m.chars.length : 1) + '/3 角色 · 宝石 ' + (m.gem || 0)
      + ' · 最深 第' + (m.bestRoom || 1) + ' 间 · 通关 ' + (m.wins || 0) + ' 次', {
      fontFamily: FONT, fontSize: '12px', color: '#8fa0a8',
    }).setOrigin(0.5, 0);
  }

  buildMenu() {
    this.menu = ITEMS.map((name, i) => this.add.text(S.W / 2, 140 + i * 26, name, {
      fontFamily: FONT, fontSize: '12px', color: '#8fa0a8',
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true })
      .on('pointerdown', (p) => { if (p.button === 2) return; this.idx = i; this.choose(); })
      .on('pointerover', () => { this.idx = i; this.mark(); }));
    this.cursor = this.add.text(0, 0, '▶', {
      fontFamily: FONT, fontSize: '12px', color: '#ffd479',
    }).setOrigin(1, 0);
    this.mark();
  }

  mark() {
    this.menu.forEach((t, i) => t.setColor(i === this.idx ? '#ffffff' : '#8fa0a8'));
    const t = this.menu[this.idx];
    this.cursor.setPosition(t.x - t.width / 2 - 8, t.y);
  }

  bindKeys() {
    this.input.keyboard.on('keydown-UP', () => this.move(-1));
    this.input.keyboard.on('keydown-DOWN', () => this.move(1));
    this.input.keyboard.on('keydown-ENTER', () => this.choose());
    this.input.keyboard.on('keydown-SPACE', () => this.choose());
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.setting) { this.closeSettings(); return; }
      if (this.credits) { this.closeCredits(); }
    });
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (p) => {
      if (p.button !== 2) return;
      if (this.setting) this.closeSettings();
      else if (this.credits) this.closeCredits();
    });
  }

  move(d) {
    if (this.credits) return;
    if (this.setting) {
      this.settingIdx = (this.settingIdx + d + 3) % 3;
      this.renderSettings();
      return;
    }
    this.idx = (this.idx + d + ITEMS.length) % ITEMS.length;
    this.mark();
    this.sfxUi();
  }

  choose() {
    if (this.credits) { this.closeCredits(); return; }
    if (this.setting) { this.toggleSetting(); return; }
    this.sfxUi();
    if (this.idx === 0) NAV.push('map');
    else if (this.idx === 1) NAV.push('hall');
    else if (this.idx === 2) this.openSettings();
    else this.openCredits();
  }

  sfxUi() {
    try { this.sound.play('ui', { volume: 0.4 }); } catch (e) {}
  }

  /* ---------- 设置面板 ---------- */
  openSettings() {
    this.setting = true;
    NAV.openOverlay('settings');
    this.settingIdx = 0;
    this.panel = this.add.container(0, 0).setDepth(50);
    this.menu.forEach((t) => t.setVisible(false));
    if (this.cursor) this.cursor.setVisible(false);
    const box = this.add.rectangle(S.W / 2, 152, 300, 168, 0x101713, 1)
      .setStrokeStyle(2, 0x4a5f42);
    const head = this.add.text(S.W / 2, 92, '设置', {
      fontFamily: FONT, fontSize: '12px', color: '#ffe9b0',
    }).setOrigin(0.5, 0);
    const foot = this.add.text(S.W / 2, 220, '↑↓ 选择 · Enter 切换 · ESC 返回', {
      fontFamily: FONT, fontSize: '12px', color: '#8fa0a8',
    }).setOrigin(0.5, 0);
    this.panel.add([box, head, foot]);
    this.settingRows = [];
    this.renderSettings();
  }

  settingList() {
    const o = this.options;
    return [
      ['静音', o.muted ? '开' : '关'],
      ['震屏', o.shake ? '开' : '关'],
      ['难度', o.difficulty === 'hard' ? '困难' : '普通'],
    ];
  }

  renderSettings() {
    (this.settingRows || []).forEach((r) => r.destroy());
    this.settingRows = [];
    const rows = this.settingList();
    rows.forEach(([k, v], i) => {
      const y = 116 + i * 26;
      const on = i === this.settingIdx;
      const name = this.add.text(S.W / 2 - 110, y, (on ? '▶ ' : '   ') + k, {
        fontFamily: FONT, fontSize: '12px', color: on ? '#ffffff' : '#c8d8c0',
      });
      const val = this.add.text(S.W / 2 + 96, y, v, {
        fontFamily: FONT, fontSize: '12px', color: on ? '#9fe0ff' : '#8fa0a8',
      }).setOrigin(1, 0);
      this.panel.add([name, val]);
      this.settingRows.push(name, val);
    });
  }

  toggleSetting() {
    const o = this.options;
    if (this.settingIdx === 0) this.options = patchOptions({ muted: !o.muted });
    else if (this.settingIdx === 1) this.options = patchOptions({ shake: !o.shake });
    else this.options = patchOptions({ difficulty: o.difficulty === 'hard' ? 'normal' : 'hard' });
    this.sfxUi();
    this.renderSettings();
  }

  closeSettings() {
    this.setting = false;
    NAV.closeOverlay('settings');
    if (this.panel) { this.panel.destroy(); this.panel = null; }
    this.settingRows = [];
    this.menu.forEach((t) => t.setVisible(true));
    if (this.cursor) this.cursor.setVisible(true);
    this.mark();
  }

  /* ---------- 制作名单 ---------- */
  openCredits() {
    if (this.credits) { this.closeCredits(); return; }
    const lines = [
      '制作 · Elijah-Lin-Dancer',
      '',
      '美术 · Ninja Adventure (CC0)',
      '特效 · pixelfx (MIT)',
      '字体 · Fusion Pixel 12px (OFL)',
      '音频 · Ninja Adventure / 公开音源',
      '',
      '素材清单见仓库 assets/CREDITS.md',
    ];
    const mask = this.add.rectangle(0, 0, S.W, S.H, 0x000000, 0.5).setOrigin(0)
      .setInteractive({ useHandCursor: false })
      .on('pointerdown', () => this.closeCredits());
    const box = this.add.rectangle(S.W / 2, S.H / 2 + 8, 380, 196, 0x101713, 0.98)
      .setStrokeStyle(2, 0x4a5f42)
      .setInteractive({ useHandCursor: false });
    const t = this.add.text(S.W / 2, S.H / 2 - 82, lines.join('\n'), {
      fontFamily: FONT, fontSize: '12px', color: '#c8d8c0', align: 'center', lineSpacing: 4,
    }).setOrigin(0.5, 0);
    const close = this.add.text(S.W / 2, S.H / 2 + 80, '关闭 ×', {
      fontFamily: FONT, fontSize: '12px', color: '#ffe9b0',
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.closeCredits());
    NAV.openOverlay('credits');
    this.credits = this.add.container(0, 0, [mask, box, t, close]).setDepth(60);
  }

  closeCredits() {
    if (!this.credits) return;
    this.credits.destroy();
    this.credits = null;
    NAV.closeOverlay('credits');
  }
}
