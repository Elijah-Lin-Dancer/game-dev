/* 选人界面：三张立绘卡，键盘 ←/→ + Enter，或直接点卡
 * 角色数值全部来自 web/data/chars.json，界面只做展示与选择。
 * P1-C-3：卡片、文字与底部提示统一走 UI 令牌和组件层。
 */
import { S } from '../core/config.js';
import { loadSave, patchSave } from '../systems/save.js';
import { NAV } from '../systems/nav.js';
import { normalizeTier, tierMeta } from '../systems/difficulty.js';
import { UI } from '../systems/ui/tokens.js';
import { makeCard, makeText } from '../systems/ui/primitives.js';

const ORDER = ['ninja', 'mage', 'knight'];
const priceOf = (c) => Math.max(0, Number(c && c.price) || 0);
const CARD_W = 128;
const CARD_H = 232;
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

    makeText(this, 12, 8, '← 返回地图', 'body', {
      color: UI.text.muted,
    }).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.back());
    makeText(this, S.W / 2, 18, '选择角色', 'h1', {
      color: UI.text.heading, origin: [0.5, 0],
    });
    makeText(this, S.W / 2, 50, this.stage
      ? ('准备进入：' + this.stageLabel + ' · ' + tierMeta(this.difficulty).name)
      : '← → 切换 · Enter / 空格出发 · 也可以直接点 · 未解锁的去小屋花宝石', 'body', {
      color: UI.text.body, origin: [0.5, 0],
    });

    const total = this.chars.length * CARD_W + (this.chars.length - 1) * GAP;
    const left = S.W / 2 - total / 2;
    this.chars.forEach((c, i) => this.buildCard(c, left + i * (CARD_W + GAP), 72, i));

    this.mark();
    makeText(this, S.W / 2, S.H - 10, 'Q 释放技能 · 冷却 8 秒 · 本局有效', 'caption', {
      color: UI.text.foot, origin: [0.5, 1],
    });

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
    const open = this.isOpen(i);
    const card = makeCard(this, {
      x, y, w: CARD_W, h: CARD_H,
      accent: open ? UI.color.side : UI.color.lineMuted,
      state: open ? (i === this.idx ? 'selected' : 'default') : 'locked',
      onClick: () => this.pick(i),
    });
    const face = this.add.image(CARD_W / 2, 50, c.face, 0).setScale(1.55);
    const name = makeText(this, CARD_W / 2, 8, c.name, 'h2', {
      color: open ? UI.text.heading : UI.text.nameLocked, origin: [0.5, 0],
    });
    const tag = makeText(this, CARD_W / 2, 88, c.tag, 'body', {
      color: open ? UI.text.gold : UI.text.locked, origin: [0.5, 0],
    });
    const stat = makeText(this, 8, 106, 'HP ' + c.hp + '  攻 ' + c.dmg
      + '\n速 ' + c.speed + '  武器 ' + this.weaponName(c.weapon), 'body', {
      color: open ? UI.text.primary : UI.text.body, lineSpacing: 3,
      wordWrap: { width: CARD_W - 16, useAdvancedWrap: true },
    });
    const skillName = makeText(this, 8, 136, '【' + c.skill.name + '】', 'body', {
      color: open ? UI.text.info : UI.text.locked,
    });
    const skillDesc = makeText(this, 8, 150, (c.skill.desc || ''), 'body', {
      color: UI.text.body, lineSpacing: 2,
      wordWrap: { width: CARD_W - 16, useAdvancedWrap: true },
    });
    let lockT = null;
    if (!open) {
      lockT = makeText(this, CARD_W / 2, 208, '未解锁 · ' + priceOf(c) + ' 宝石', 'body', {
        color: UI.text.danger, origin: [0.5, 0],
        backgroundColor: '#121a16dd', padding: { x: 3, y: 1 },
      });
    }
    card.add(face, name, tag, stat, skillName, skillDesc, lockT);
    card.hit.on('pointerover', () => {
      this.idx = i;
      this.mark();
    });
    this.cards.push({ card, face, name, tag, stat, skillName, skillDesc, lockT });
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
      k.card.setState(!open ? 'locked' : (on ? 'selected' : 'default'));
      k.name.setColor(!open ? UI.text.nameLocked : (on ? UI.text.heading : UI.text.primary));
      k.tag.setColor(open ? (on ? UI.text.gold : UI.text.typeOpen) : UI.text.locked);
      k.stat.setColor(open ? (on ? UI.text.primary : UI.text.body) : UI.text.body);
      k.skillName.setColor(open ? UI.text.info : UI.text.muted);
      k.skillDesc.setColor(open ? UI.text.body : UI.text.body);
      k.face.setAlpha(!open ? 0.35 : (on ? 1 : 0.55)).setScale(on ? 1.6 : 1.55);
    });
  }

  isOpen(i) { return this.unlocked.indexOf(ORDER[i]) >= 0; }

  firstOpen() {
    const i = ORDER.findIndex((id) => this.unlocked.indexOf(id) >= 0);
    return i < 0 ? 0 : i;
  }

  toast(msg) {
    if (this.toastT) this.toastT.destroy();
    this.toastT = makeText(this, S.W / 2, S.H - 44, msg, 'body', {
      color: UI.text.danger, backgroundColor: '#000000cc',
      padding: { x: 6, y: 3 }, origin: [0.5, 0],
    }).setDepth(900);
    this.time.delayedCall(1600, () => { if (this.toastT) { this.toastT.destroy(); this.toastT = null; } });
  }

  move(d) {
    this.idx = (this.idx + d + this.chars.length) % this.chars.length;
    this.sfxUi();
    this.mark();
  }

  pick(i) {
    this.idx = i;
    this.mark();
    this.confirm();
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
