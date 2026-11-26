/* 标题画面（批 8 外壳）：进游戏的第一屏，也是"设置"的入口
 *
 * 为什么先做这个：批 1–7 一直是"打开网页直接进游戏"，没有标题、没有设置、没有暂停，
 * 玩家连"这是个完整游戏"的第一印象都拿不到。外壳是骨架，先立起来。
 *
 * 素材：地面用 Interior 花砖、角色用现成立绘、火把用 FX/Aura，全部包内件，无外部件无自绘。
 * P1-C-3：文字、菜单、设置与名单统一走 UI 令牌和组件层，字号只保留 12 / 24。
 */
import { S } from '../core/config.js';
import { loadSave } from '../systems/save.js';
import { loadOptions, patchOptions } from '../systems/options.js';
import { NAV } from '../systems/nav.js';
import { storyForTitle } from '../systems/story.js';
import { UI } from '../systems/ui/tokens.js';
import { makePanel, makeCard, makeText, makeButton } from '../systems/ui/primitives.js';

const ITEMS = [
  { name: '开始冒险', note: '进入世界地图' },
  { name: '收藏小屋', note: '武器 / 角色 / 图鉴' },
  { name: '设置', note: '静音 / 震屏' },
  { name: '制作名单', note: '素材与致谢' },
];

export class Title extends Phaser.Scene {
  constructor() { super('title'); }

  create() {
    NAV.reset('title');
    this.idx = 0;
    this.meta = loadSave();
    this.options = loadOptions();
    this.setting = false;
    this.settingIdx = 0;
    this.credits = null;

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
      this.add.image(S.W / 2 - 120 + i * 120, S.H - 58, k, 0).setScale(1.0).setAlpha(0.82);
    });
  }

  buildTitle() {
    makeText(this, S.W / 2, 22, '归 途', 'h1', {
      color: UI.text.heading, origin: [0.5, 0],
    });
    makeText(this, S.W / 2, 58, '星 火 之 章', 'h2', {
      color: UI.text.gold, origin: [0.5, 0],
    });
    makeText(this, S.W / 2, 76, '多角色动作 Roguelike · 六章冒险', 'body', {
      color: UI.text.body, origin: [0.5, 0],
    });
    const m = this.meta;
    makeText(this, S.W / 2, S.H - 20,
      '已解锁 ' + (m.chars ? m.chars.length : 1) + '/3 角色 · 宝石 ' + (m.gem || 0)
      + ' · 最深 第' + (m.bestRoom || 1) + ' 间 · 通关 ' + (m.wins || 0) + ' 次',
      'caption', { color: UI.text.muted, origin: [0.5, 0] });
  }

  buildMenu() {
    this.menu = ITEMS.map((item, i) => {
      const card = makeCard(this, {
        x: S.W / 2 - 160, y: 112 + i * 40, w: 320, h: 36,
        accent: UI.color.gold, state: i === this.idx ? 'selected' : 'default',
        onClick: () => { this.idx = i; this.choose(); },
      });
      const name = makeText(this, 26, 5, item.name, 'body', {
        color: i === this.idx ? UI.text.heading : UI.text.primary,
      });
      const sub = makeText(this, 26, 21, item.note, 'caption', {
        color: i === this.idx ? UI.text.typeOpen : UI.text.muted,
      });
      const arrow = makeText(this, 304, 11, '>', 'h2', {
        color: i === this.idx ? UI.text.gold : UI.text.muted, origin: [1, 0],
      });
      card.add(name, sub, arrow);
      card.hit.on('pointerover', () => {
        this.idx = i;
        this.mark();
      });
      return { card, name, sub, arrow };
    });
    this.mark();
  }

  mark() {
    this.menu.forEach((m, i) => {
      const on = i === this.idx;
      m.card.setState(on ? 'selected' : 'default');
      m.name.setColor(on ? UI.text.heading : UI.text.primary);
      m.sub.setColor(on ? UI.text.typeOpen : UI.text.muted);
      m.arrow.setColor(on ? UI.text.gold : UI.text.muted);
    });
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
      this.settingIdx = (this.settingIdx + d + 2) % 2;
      this.markSettings();
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
    if (this.idx === 0) {
      const story = storyForTitle(this.meta);
      if (story) NAV.push('story', { id: story, next: { scene: 'map' } });
      else NAV.push('map');
    }
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
    this.settingIdx = 0;
    NAV.openOverlay('settings');
    this.menu.forEach((m) => m.card.setVisible(false));

    const panelW = 300;
    const panelH = 190;
    const panelX = (S.W - panelW) / 2;
    const panelY = 85;
    this.settingMask = this.add.rectangle(0, 0, S.W, S.H, UI.color.overlay, UI.alpha.overlay)
      .setOrigin(0).setDepth(50).setInteractive()
      .on('pointerdown', () => this.closeSettings());
    this.settingBlock = this.add.rectangle(panelX, panelY, panelW, panelH, 0, 0)
      .setOrigin(0).setDepth(52).setInteractive();
    this.settingPanel = makePanel(this, {
      x: panelX, y: panelY, w: panelW, h: panelH, variant: 'base', depth: 51,
    });
    this.settingPanel.add(this.add.rectangle(0, 0, panelW, panelH).setOrigin(0)
      .setStrokeStyle(2, UI.color.line));
    this.settingTitle = makeText(this, panelX + panelW / 2, panelY + 12, '设置', 'h1', {
      color: UI.text.heading, origin: [0.5, 0],
    }).setDepth(53);
    this.settingSub = makeText(this, panelX + panelW / 2, panelY + 38, '程序级选项 · 只影响本机', 'caption', {
      color: UI.text.muted, origin: [0.5, 0],
    }).setDepth(53);
    this.settingFoot = makeText(this, panelX + panelW / 2, panelY + 158, '↑↓ 选择 · Enter 切换 · ESC 返回', 'caption', {
      color: UI.text.foot, origin: [0.5, 0],
    }).setDepth(53);
    this.settingRows = [];
    this.renderSettings();
  }

  settingList() {
    const o = this.options;
    return [
      ['静音', o.muted ? '开' : '关'],
      ['震屏', o.shake ? '开' : '关'],
    ];
  }

  renderSettings() {
    (this.settingRows || []).forEach((r) => {
      r.card.container.destroy();
      r.card.hit.destroy();
    });
    this.settingRows = [];
    const rows = this.settingList();
    const panelX = (S.W - 300) / 2;
    const panelY = 85;
    rows.forEach(([k, v], i) => {
      const card = makeCard(this, {
        x: panelX + 20, y: panelY + 58 + i * 38, w: 260, h: 32,
        accent: UI.color.neutral, state: i === this.settingIdx ? 'selected' : 'default',
        depth: 54,
        onClick: () => { this.settingIdx = i; this.toggleSetting(); },
      });
      const name = makeText(this, 14, 9, k, 'body', {
        color: i === this.settingIdx ? UI.text.heading : UI.text.primary,
      });
      const val = makeText(this, 246, 9, v, 'body', {
        color: i === this.settingIdx ? UI.text.info : UI.text.muted, origin: [1, 0],
      });
      card.add(name, val);
      card.hit.on('pointerover', () => {
        if (!this.setting) return;
        this.settingIdx = i;
        this.markSettings();
      });
      this.settingRows.push({ card, name, val });
    });
    this.markSettings();
  }

  markSettings() {
    if (!this.settingRows) return;
    this.settingRows.forEach((r, i) => {
      const on = i === this.settingIdx;
      r.card.setState(on ? 'selected' : 'default');
      r.name.setColor(on ? UI.text.heading : UI.text.primary);
      r.val.setColor(on ? UI.text.info : UI.text.muted);
    });
  }

  toggleSetting() {
    const o = this.options;
    if (this.settingIdx === 0) this.options = patchOptions({ muted: !o.muted });
    else this.options = patchOptions({ shake: !o.shake });
    this.sfxUi();
    this.renderSettings();
  }

  closeSettings() {
    this.setting = false;
    NAV.closeOverlay('settings');
    (this.settingRows || []).forEach((r) => {
      r.card.container.destroy();
      r.card.hit.destroy();
    });
    this.settingRows = [];
    [this.settingMask, this.settingBlock, this.settingPanel && this.settingPanel.container,
      this.settingTitle, this.settingSub, this.settingFoot].forEach((o) => o && o.destroy());
    this.settingMask = null;
    this.settingBlock = null;
    this.settingPanel = null;
    this.menu.forEach((m) => m.card.setVisible(true));
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
    const panelW = 420;
    const panelH = 230;
    const panelX = (S.W - panelW) / 2;
    const panelY = 65;
    const mask = this.add.rectangle(0, 0, S.W, S.H, UI.color.overlay, UI.alpha.overlay)
      .setOrigin(0).setDepth(58).setInteractive()
      .on('pointerdown', () => this.closeCredits());
    const block = this.add.rectangle(panelX, panelY, panelW, panelH, 0, 0)
      .setOrigin(0).setDepth(61).setInteractive();
    const panel = makePanel(this, {
      x: panelX, y: panelY, w: panelW, h: panelH, variant: 'base', depth: 60,
    });
    panel.add(this.add.rectangle(0, 0, panelW, panelH).setOrigin(0)
      .setStrokeStyle(2, UI.color.line));
    const title = makeText(this, panelX + panelW / 2, panelY + 12, '制作名单', 'h1', {
      color: UI.text.heading, origin: [0.5, 0],
    }).setDepth(62);
    const body = makeText(this, panelX + panelW / 2, panelY + 44, lines.join('\n'), 'body', {
      color: UI.text.body, align: 'center', lineSpacing: 4, origin: [0.5, 0],
    }).setDepth(62);
    const close = makeButton(this, {
      x: panelX + 160, y: panelY + 190, w: 100, h: 24, label: '关闭 ×',
      variant: 'ghost', depth: 63,
      onClick: () => this.closeCredits(),
    });
    NAV.openOverlay('credits');
    this.credits = {
      mask, block, panel: panel.container, title, body, close,
    };
  }

  closeCredits() {
    if (!this.credits) return;
    const c = this.credits;
    c.close.container.destroy();
    c.close.hit.destroy();
    [c.mask, c.block, c.panel, c.title, c.body].forEach((o) => o && o.destroy());
    this.credits = null;
    NAV.closeOverlay('credits');
    this.mark();
  }
}
