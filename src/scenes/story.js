/* 剧情过场：章节卡 + 对话框 + 终章尾声
 *
 * 只用现有图集 / 3D 小屋头像搭场景，不新增素材；所有文案来自 story.json。
 * 交互：Enter / 空格 / 点击推进；ESC / S / 右上角「跳过」直接结束。
 * 结束走 NAV.replace，把过场本身从返回栈里换掉，避免再回放。
 */
import { S } from '../core/config.js';
import { NAV } from '../systems/nav.js';
import { UI } from '../systems/ui/tokens.js';
import { makePanel, makeText } from '../systems/ui/primitives.js';
import { storyNode, storyIndex, storyCount, markStorySeen } from '../systems/story.js';

const ART = {
  hall: { floor: 0x5b4538, accent: 0xffb86b },
  field: { floor: 0x486348, accent: 0x9fe0a0 },
  fort: { floor: 0x6b4030, accent: 0xff9a7a },
  desert: { floor: 0x8a6840, accent: 0xffd479 },
  water: { floor: 0x2f5360, accent: 0x9fe0ff },
  lava: { floor: 0x6b2f24, accent: 0xff8a5a },
  sky: { floor: 0x332a4a, accent: 0xd8c0ff },
};

const PORTRAIT_SCALE = {
  faceGuide: [64, 64], faceSmith: [64, 64], faceMerchant: [64, 64],
  faceNinja: [38, 38], faceNinjaClear: [38, 38], faceMage: [38, 38], faceKnight: [38, 38],
  rsamIdle: [96, 48], spiritIdle: [50, 50], villager: [16, 16], campfire: [16, 16],
};

const NARRATOR = new Set(['narrator', 'letter']);

export class Story extends Phaser.Scene {
  constructor() { super('story'); }

  create(data = {}) {
    this.specData = data;
    this.node = storyNode(data.id);
    this.next = data.next || { scene: 'map' };
    this.finishing = false;
    this.phase = 'card';
    this.dialogIndex = 0;
    this.dynamic = [];
    if (!this.node) { this.finish(true); return; }
    markStorySeen(this.node.id);
    window.__storyScene = this;
    this.phase = this.node.card ? 'card' : 'dialog';
    this.buildBackdrop();
    this.buildFrame();
    if (this.node.card) this.buildCard();
    else this.showDialog(0);
    this.bindInput();
    this.cameras.main.fadeIn(260, 0, 0, 0);
  }

  /* ---------- 底景 ---------- */
  buildBackdrop() {
    const art = ART[this.node.art] || ART.hall;
    this.add.rectangle(0, 0, S.W, S.H, 0x080b0a).setOrigin(0).setDepth(0);
    this.add.tileSprite(0, 0, S.W, S.H, 'floorDungeon', 0)
      .setOrigin(0).setTint(art.floor).setAlpha(0.62).setDepth(1);
    this.add.rectangle(0, 0, S.W, S.H, 0x000000, 0.26).setOrigin(0).setDepth(2);
    // 顶部 / 底部暗带，压出画框
    this.add.rectangle(0, 0, S.W, 34, 0x050807, 0.94).setOrigin(0).setDepth(3);
    this.add.rectangle(0, S.H - 30, S.W, 30, 0x050807, 0.94).setOrigin(0).setDepth(3);
    // 竖向光柱 + 少量浮尘，给“过场”一点呼吸
    const beam = this.add.image(S.W * 0.72, S.H * 0.58, 'ray', 0)
      .setScale(S.W < 800 ? 2.5 : 4.2).setTint(art.accent).setAlpha(0.16)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(3);
    this.tweens.add({ targets: beam, alpha: 0.08, duration: 1800, yoyo: true, repeat: -1 });
    for (let i = 0; i < 16; i++) {
      const d = this.add.image(
        Phaser.Math.Between(18, S.W - 18), Phaser.Math.Between(48, S.H - 38), 'dust', i % 7,
      ).setTint(art.accent).setAlpha(Phaser.Math.FloatBetween(0.12, 0.4))
        .setScale(Phaser.Math.FloatBetween(0.5, 1.1)).setDepth(3);
      this.tweens.add({
        targets: d, y: d.y - Phaser.Math.Between(18, 42), alpha: 0,
        duration: Phaser.Math.Between(1400, 2800), delay: i * 80,
        yoyo: true, repeat: -1,
      });
    }
  }

  buildFrame() {
    const pad = S.W < 800 ? 10 : 16;
    makeText(this, pad, 10, '归途 · 星火之章', 'caption', {
      color: UI.text.gold, origin: [0, 0],
    }).setDepth(6);
    this.progressText = makeText(this, S.W - pad, 10,
      String(storyIndex(this.node.id) + 1).padStart(2, '0') + ' / ' + String(storyCount()).padStart(2, '0'),
      'caption', { color: UI.text.muted, origin: [1, 0] }).setDepth(6);
    this.skipText = makeText(this, S.W - pad, 28, 'ESC 跳过', 'caption', {
      color: UI.text.muted, origin: [1, 0],
    }).setDepth(6).setInteractive({ useHandCursor: true })
      .on('pointerdown', (p, x, y, event) => {
        if (event && event.stopPropagation) event.stopPropagation();
        this.skip();
      });
    makeText(this, S.W / 2, S.H - 18, 'Enter / 空格 / 点击 继续', 'caption', {
      color: UI.text.foot, origin: [0.5, 0],
    }).setDepth(6);
  }

  /* ---------- 章节卡 ---------- */
  buildCard() {
    const compact = S.W < 800;
    const x = compact ? 16 : 48;
    const y = compact ? 48 : 66;
    const w = S.W - x * 2;
    const h = compact ? 232 : 376;
    const artW = compact ? 190 : 290;
    const textW = w - artW - 28;
    const panel = makePanel(this, { x, y, w, h, variant: 'base', depth: 8 });
    panel.container.setAlpha(0);
    this.dynamic.push(panel.container);
    const accent = panel.add(this.add.rectangle(0, 0, 5, h, this.tone(), 1).setOrigin(0));
    this.dynamic.push(accent);

    const tx = x + 20;
    const ty = y + (compact ? 16 : 24);
    const label = makeText(this, 20, ty - y, this.node.chapter + ' · ' + (this.node.label.split('·')[1] || '').trim(),
      'caption', { color: UI.text.gold });
    panel.add(label);
    const title = makeText(this, 20, ty - y + (compact ? 16 : 22), this.node.title, 'h1', {
      color: UI.text.heading,
    });
    panel.add(title);
    const sub = makeText(this, 20, ty - y + (compact ? 46 : 56), this.node.subtitle || '', 'body', {
      color: UI.text.muted,
    });
    panel.add(sub);
    let ly = ty - y + (compact ? 70 : 84);
    this.node.lines.forEach((line) => {
      const t = makeText(this, 20, ly, line, 'body', {
        color: UI.text.body, wordWrap: { width: textW },
      });
      t.setLineSpacing(compact ? 2 : 5);
      panel.add(t);
      ly += compact ? 24 : 30;
    });
    // 右下角：章节编号 / 装饰线
    panel.add(this.add.rectangle(20, h - 20, textW - 12, 1, this.tone(), 0.45).setOrigin(0));
    panel.add(makeText(this, 20, h - 32, this.node.chapter + ' · 过场卡',
      'caption', { color: UI.text.muted }));

    // 右侧画窗
    const ax = x + w - artW - 10;
    const ay = y + 10;
    const ah = h - 20;
    this.dynamic.push(this.add.rectangle(ax, ay, artW, ah, 0x000000, 0.55).setOrigin(0).setDepth(9));
    this.dynamic.push(this.add.rectangle(ax, ay, artW, ah).setOrigin(0).setDepth(9)
      .setStrokeStyle(1, this.tone(), 0.7));
    this.dynamic.push(this.add.tileSprite(ax, ay, artW, ah, 'floorDungeon', 0)
      .setOrigin(0).setDepth(9).setTint(ART[this.node.art]?.floor || 0x554438).setAlpha(0.22));
    this.dynamic.push(this.add.text(ax + artW / 2, ay + ah / 2, this.node.glyph || '', {
      fontFamily: UI.font, fontSize: compact ? '54px' : '82px', color: this.node.tone || '#ffd479',
    }).setOrigin(0.5).setDepth(9).setAlpha(0.16));
    const portrait = this.makePortrait(
      ax + artW / 2, ay + ah / 2, this.node.artPortrait,
      this.portraitScale(this.node.artPortrait, this.node.artPortrait === 'villager'
        ? (compact ? 76 : 104) : (compact ? 128 : 168)),
    );
    if (portrait) this.dynamic.push(portrait);
    panel.container.setAlpha(1);

    this.continueHint = makeText(this, x + w - 18, y + h - 24, '点击 / Enter 展开对话', 'caption', {
      color: UI.text.gold, origin: [1, 0],
    }).setDepth(9);
    this.dynamic.push(this.continueHint);
    this.tweens.add({ targets: this.continueHint, alpha: 0.45, duration: 700, yoyo: true, repeat: -1 });
  }

  portraitScale(key, target) {
    const [w, h] = PORTRAIT_SCALE[key] || [64, 64];
    return target / Math.max(1, Math.max(w, h)) / 2.6;
  }

  makePortrait(cx, cy, key, scale = 1) {
    if (!key || !this.textures.exists(key)) return null;
    const [w, h] = PORTRAIT_SCALE[key] || [64, 64];
    const img = this.add.image(cx, cy, key, 0).setOrigin(0.5, 0.5).setDepth(10);
    const fit = Math.min((w * 2.6) / w, (h * 2.6) / h);
    img.setDisplaySize(Math.max(24, w * fit * scale), Math.max(24, h * fit * scale));
    if (key === 'spiritIdle') img.setTint(this.node.art === 'water' ? 0x8fd8ff : 0xd8c0ff);
    if (key === 'campfire') img.setTint(0xffb86b);
    img.setBlendMode(Phaser.BlendModes.NORMAL);
    this.tweens.add({ targets: img, y: cy - 5, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return img;
  }

  /* ---------- 对话框 ---------- */
  showDialog(index) {
    if (this.finishing) return;
    const list = this.node.dialog || [];
    if (index >= list.length) {
      if (this.node.coda && this.node.coda.length) this.showCoda();
      else this.finish();
      return;
    }
    this.clearDynamic();
    this.phase = 'dialog';
    this.dialogIndex = index;
    const compact = S.W < 800;
    const x = compact ? 10 : 18;
    const w = S.W - x * 2;
    const h = compact ? 118 : 146;
    const y = S.H - h - 34;
    const panel = makePanel(this, { x, y, w, h, variant: 'base', depth: 8 });
    this.dynamic.push(panel.container);
    panel.add(this.add.rectangle(0, 0, 4, h, this.tone(), 1).setOrigin(0));
    const d = list[index];
    const portrait = this.makePortrait(x + (compact ? 30 : 38), y + h / 2, this.portraitKey(d.who), compact ? 0.52 : 0.84);
    if (portrait) this.dynamic.push(portrait);
    panel.add(makeText(this, compact ? 58 : 72, 10, d.name || '声音', 'body', {
      color: NARRATOR.has(d.who) ? UI.text.muted : UI.text.gold,
    }));
    if (NARRATOR.has(d.who)) {
      panel.add(this.add.rectangle(compact ? 58 : 72, 27, w - (compact ? 68 : 82), 1, UI.color.line, 0.5).setOrigin(0));
    }
    const textX = compact ? 58 : 72;
    const textW = w - textX - 18;
    const textY = NARRATOR.has(d.who) ? (compact ? 26 : 32) : (compact ? 34 : 44);
    this.dialogText = makeText(this, textX, textY, '', 'body', {
      color: UI.text.body, wordWrap: { width: textW },
    });
    this.dialogText.setLineSpacing(compact ? 2 : 5);
    panel.add(this.dialogText);
    this.dialogFull = d.text || '';
    this.dialogShown = 0;
    this.typeAcc = 0;
    this.lineDone = false;
    this.pageText = makeText(this, w - 18, h - 18, (index + 1) + ' / ' + list.length, 'caption', {
      color: UI.text.muted, origin: [1, 0],
    });
    panel.add(this.pageText);
    this.continueHint = makeText(this, w - 18, h - 32, '▼', 'caption', {
      color: UI.text.gold, origin: [1, 0],
    }).setVisible(false);
    panel.add(this.continueHint);
    panel.container.setAlpha(0);
    this.tweens.add({ targets: panel.container, alpha: 1, duration: 220 });
  }

  portraitKey(who) {
    if (who === 'guide') return 'faceGuide';
    if (who === 'smith') return 'faceSmith';
    if (who === 'merchant') return 'faceMerchant';
    if (who === 'you') return 'faceNinjaClear';
    if (who === 'samurai') return 'rsamIdle';
    if (who === 'god' || who === 'weaver') return 'spiritIdle';
    if (who === 'doctor') return 'villager';
    return null;
  }

  /* ---------- 终章尾声 ---------- */
  showCoda() {
    this.clearDynamic();
    this.phase = 'coda';
    const compact = S.W < 800;
    const w = compact ? S.W - 32 : 680;
    const h = compact ? 196 : 230;
    const x = (S.W - w) / 2;
    const y = (S.H - h) / 2 - 6;
    const panel = makePanel(this, { x, y, w, h, variant: 'base', depth: 8 });
    this.dynamic.push(panel.container);
    panel.add(this.add.rectangle(0, 0, 5, h, this.tone(), 1).setOrigin(0));
    panel.add(makeText(this, 24, 20, '终章 · 星火', 'h1', {
      color: UI.text.heading,
    }));
    let ly = compact ? 56 : 68;
    (this.node.coda || []).forEach((line, i) => {
      const t = makeText(this, 24, ly, line, i === 0 ? 'body' : 'caption', {
        color: i === 0 ? UI.text.gold : UI.text.body,
        wordWrap: { width: w - 48 },
      });
      t.setLineSpacing(4);
      panel.add(t);
      ly += compact ? 32 : 42;
    });
    this.continueHint = makeText(this, x + w - 20, y + h - 24, '点击 / Enter 落幕', 'caption', {
      color: UI.text.gold, origin: [1, 0],
    }).setDepth(9);
    this.dynamic.push(this.continueHint);
    this.tweens.add({ targets: this.continueHint, alpha: 0.45, duration: 700, yoyo: true, repeat: -1 });
  }

  /* ---------- 输入与推进 ---------- */
  bindInput() {
    const kb = this.input.keyboard;
    kb.on('keydown-ENTER', () => this.advance());
    kb.on('keydown-SPACE', () => this.advance());
    kb.on('keydown-ESC', () => this.skip());
    kb.on('keydown-S', () => this.skip());
    this.input.on('pointerdown', () => this.advance());
  }

  advance() {
    if (this.finishing) return;
    this.sfx();
    if (this.phase === 'card') { this.showDialog(0); return; }
    if (this.phase === 'coda') { this.finish(); return; }
    if (this.phase !== 'dialog') return;
    if (!this.lineDone) {
      this.dialogShown = this.dialogFull.length;
      this.dialogText.setText(this.dialogFull);
      this.lineDone = true;
      if (this.continueHint) this.continueHint.setVisible(true);
      return;
    }
    this.showDialog(this.dialogIndex + 1);
  }

  skip() {
    if (this.finishing) return;
    this.sfx();
    this.finish(true);
  }

  sfx() {
    try { this.sound.play('ui', { volume: 0.35 }); } catch (e) {}
  }

  clearDynamic() {
    this.dynamic.forEach((o) => { if (o && o.destroy) o.destroy(); });
    this.dynamic = [];
    this.continueHint = null;
    this.dialogText = null;
  }

  finish(immediate = false) {
    if (this.finishing) return;
    this.finishing = true;
    const next = this.next || { scene: 'map' };
    const go = () => {
      if (NAV.replace(next.scene || 'map', next.data || {})) return;
      this.scene.start(next.scene || 'map', next.data || {});
    };
    if (immediate) { go(); return; }
    this.cameras.main.fadeOut(180, 0, 0, 0);
    this.time.delayedCall(210, go);
  }

  tone() {
    return Phaser.Display.Color.HexStringToColor(this.node.tone || '#ffd479').color;
  }

  update(time, delta) {
    if (this.phase !== 'dialog' || this.lineDone || !this.dialogText) return;
    this.typeAcc += delta;
    const n = Math.min(this.dialogFull.length, Math.floor(this.typeAcc / 24));
    if (n !== this.dialogShown) {
      this.dialogShown = n;
      this.dialogText.setText(this.dialogFull.slice(0, n));
    }
    if (n >= this.dialogFull.length) {
      this.lineDone = true;
      if (this.continueHint) this.continueHint.setVisible(true);
    }
  }
}
