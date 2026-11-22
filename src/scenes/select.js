/* 选人界面：三张立绘卡，键盘 ←/→ + Enter，或直接点卡
 * 角色数值全部来自 web/data/chars.json，界面只做展示与选择。
 */
import { FONT, S } from '../core/config.js';
import { loadSave, patchSave } from '../systems/save.js';
import { NAV } from '../systems/nav.js';
import { normalizeTier, tierMeta } from '../systems/difficulty.js';

const ORDER = ['ninja', 'mage', 'knight'];
const priceOf = (c) => Math.max(0, Number(c && c.price) || 0);
const CARD_W = 128;
const CARD_H = 240;
const GAP = 18;

function normalize(list) {
  const src = Array.isArray(list) ? list : [];
  const out = [];
  src.forEach((c) => {
    if (!c || !c.id) return;
    if (!ORDER.includes(c.id)) return;
    out.push({
      id: c.id,
      name: String(c.name || c.id),
      tag: String(c.tag || ''),
      skin: String(c.skin || c.id),
      hp: Math.max(1, Number(c.hp) || 20),
      dmg: Math.max(1, Number(c.dmg) || 3),
      speed: Math.max(40, Number(c.speed) || 96),
      weapon: String(c.weapon || 'katana'),
      face: String(c.face || 'faceNinja'),
      desc: String(c.desc || ''),
      skill: c.skill || { name: '技能', desc: '', cd: 8000 },
      price: Math.max(0, Number(c.unlock && c.unlock.cost) || 0),
      unlock: c.unlock || { channel: 'initial', cost: 0 },
    });
  });
  ORDER.forEach((id) => {
    if (!out.some((c) => c.id === id)) out.push({
      id, name: id, tag: '', skin: id, hp: 20, dmg: 3, speed: 96, weapon: 'katana',
      face: 'faceNinja', desc: '', skill: { name: '技能', desc: '', cd: 8000 },
    });
  });
  return out.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
}

export class Select extends Phaser.Scene {
  constructor() { super('select'); }

  create(data) {
    this.stage = (data && data.stage) || null;
    this.difficulty = normalizeTier((data && data.difficulty) || 'normal');
    this.stageLabel = this.stage
      ? (this.stage.special
        ? (this.stage.label || this.stage.chapterName || '特殊关卡')
        : ((this.stage.chapterName || this.stage.chapter) + ' · 第 ' + this.stage.index + ' 关'))
      : '';
    this.chars = normalize(window.__charsData);
    const meta = loadSave();
    this.unlocked = Array.isArray(meta.chars) && meta.chars.length ? meta.chars : ['ninja'];
    this.gem = meta.gem || 0;
    // 上次用的角色如果被锁（老档降级/换机器），就落回第一个已解锁的
    const last = ORDER.indexOf(meta.lastChar || 'ninja');
    this.idx = this.isOpen(last) ? Math.max(0, last) : this.firstOpen();
    this.cards = [];

    this.add.rectangle(0, 0, S.W, S.H, 0x1e2a1c).setOrigin(0);
    // 地面网格：让整屏不至于空成一块纯色
    for (let x = 0; x < S.W; x += 32) {
      for (let y = 0; y < S.H; y += 32) {
        if ((x / 32 + y / 32) % 2 === 0) this.add.rectangle(x, y, 32, 32, 0x22301e, 1).setOrigin(0);
      }
    }

    this.add.text(12, 8, '← 返回地图', {
      fontFamily: FONT, fontSize: '12px', color: '#8fa0a8',
    }).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.back());
    this.add.text(S.W / 2, 26, '选择角色', {
      fontFamily: FONT, fontSize: '16px', color: '#ffe9b0',
    }).setOrigin(0.5, 0);
    this.add.text(S.W / 2, 50, this.stage
      ? ('准备进入：' + this.stageLabel + ' · ' + tierMeta(this.difficulty).name)
      : '← → 切换 · Enter / 空格出发 · 也可以直接点 · 未解锁的去小屋花宝石', {
      fontFamily: FONT, fontSize: '12px', color: '#c8d8c0',
    }).setOrigin(0.5, 0);

    const total = this.chars.length * CARD_W + (this.chars.length - 1) * GAP;
    const left = S.W / 2 - total / 2;
    this.chars.forEach((c, i) => this.buildCard(c, left + i * (CARD_W + GAP), 64, i));

    this.mark();
    this.add.text(S.W / 2, S.H - 10, 'Q 释放技能 · 冷却 8 秒 · 本局有效', {
      fontFamily: FONT, fontSize: '12px', color: '#ffffff88',
    }).setOrigin(0.5, 1);

    this.input.keyboard.on('keydown-LEFT', () => this.move(-1));
    this.input.keyboard.on('keydown-A', () => this.move(-1));
    this.input.keyboard.on('keydown-RIGHT', () => this.move(1));
    this.input.keyboard.on('keydown-D', () => this.move(1));
    this.input.keyboard.on('keydown-ENTER', () => this.confirm());
    this.input.keyboard.on('keydown-SPACE', () => this.confirm());
    this.input.keyboard.on('keydown-ESC', () => this.back());
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (p) => {
      if (p.button === 2) this.back();
    });
  }

  back() {
    try { this.sound.play('ui', { volume: 0.35 }); } catch (e) {}
    const from = this.stage
      ? (this.stage.special ? { special: this.stage.special } : { chapterId: this.stage.chapter, stage: this.stage.index })
      : {};
    if (!NAV.back(from)) this.scene.start('map', from);
  }

  buildCard(c, x, y, i) {
    const box = this.add.rectangle(x, y, CARD_W, CARD_H, 0x2b3a26, 1).setOrigin(0)
      .setStrokeStyle(2, 0x4a5f42)
      .setInteractive({ useHandCursor: true });
    const face = this.add.image(x + CARD_W / 2, y + 54, c.face, 0).setScale(1.7);
    const name = this.add.text(x + CARD_W / 2, y + 8, c.name, {
      fontFamily: FONT, fontSize: '12px', color: '#ffffff',
    }).setOrigin(0.5, 0);
    const tag = this.add.text(x + CARD_W / 2, y + 92, c.tag, {
      fontFamily: FONT, fontSize: '12px', color: '#ffd479',
    }).setOrigin(0.5, 0);
    const WN = this.weaponName(c.weapon);
    const stat = this.add.text(x + 8, y + 110, 'HP ' + c.hp + '  攻 ' + c.dmg + '\n速 ' + c.speed + '  武器 ' + WN, {
      fontFamily: FONT, fontSize: '12px', color: '#d8e8d0', lineSpacing: 3,
    });
    const skill = this.add.text(x + 8, y + 144, '【' + c.skill.name + '】\n' + (c.skill.desc || ''), {
      fontFamily: FONT, fontSize: '12px', color: '#9fd8ff', lineSpacing: 2,
      wordWrap: { width: CARD_W - 16, useAdvancedWrap: true },
    });
    let lockT = null;
    if (!this.isOpen(i)) {
      const price = priceOf(c);
      lockT = this.add.text(x + CARD_W / 2, y + 24, '未解锁 · ' + price + ' 宝石', {
        fontFamily: FONT, fontSize: '12px', color: '#ffb0a0',
      }).setOrigin(0.5, 0);
    }
    box.on('pointerdown', () => { this.idx = i; this.mark(); this.confirm(); });
    box.on('pointerover', () => { this.idx = i; this.mark(); });
    this.cards.push({ box, face, name, tag, stat, skill, lockT });
  }

  weaponName(id) {
    const list = (window.__weaponsData && window.__weaponsData.list) || [];
    const w = list.find((x) => x.id === id);
    return w ? w.name : id;
  }

  mark() {
    this.cards.forEach((k, i) => {
      const on = i === this.idx;
      const open = this.isOpen(i);
      k.box.setFillStyle(on ? 0x3a4f2e : 0x2b3a26, 1);
      k.box.setStrokeStyle(on ? 3 : 2, !open ? 0x5a4a44 : (on ? 0xffe9b0 : 0x4a5f42));
      k.face.setAlpha((!open ? 0.35 : (on ? 1 : 0.55))).setScale(on ? 1.85 : 1.7);
    });
  }

  isOpen(i) { return this.unlocked.indexOf(ORDER[i]) >= 0; }

  firstOpen() {
    const i = ORDER.findIndex((id) => this.unlocked.indexOf(id) >= 0);
    return i < 0 ? 0 : i;
  }

  toast(msg) {
    if (this.toastT) this.toastT.destroy();
    this.toastT = this.add.text(S.W / 2, S.H - 44, msg, {
      fontFamily: FONT, fontSize: '12px', color: '#ffb0a0', backgroundColor: '#000000aa',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5, 0).setDepth(900);
    this.time.delayedCall(1600, () => { if (this.toastT) { this.toastT.destroy(); this.toastT = null; } });
  }

  move(d) {
    this.idx = (this.idx + d + this.chars.length) % this.chars.length;
    this.sfxUi();
    this.mark();
  }

  sfxUi() {
    try { this.sound.play('ui', { volume: 0.35 }); } catch (e) {}
  }

  confirm() {
    const c = this.chars[this.idx];
    if (!this.isOpen(this.idx)) {
      this.toast(c.name + ' 还没解锁：去小屋花 ' + priceOf(c) + ' 宝石');
      return;
    }
    patchSave({ lastChar: c.id });
    try { this.sound.play('ui', { volume: 0.5 }); } catch (e) {}
    NAV.reset('play');
    this.scene.start('play', { char: c.id, stage: this.stage, difficulty: this.difficulty });
  }
}
