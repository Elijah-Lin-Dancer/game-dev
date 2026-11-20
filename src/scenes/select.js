/* 选人界面：三张立绘卡，键盘 ←/→ + Enter，或直接点卡
 * 角色数值全部来自 web/data/chars.json，界面只做展示与选择。
 */
import { FONT, S } from '../core/config.js';
import { loadSave, patchSave } from '../systems/save.js';

const ORDER = ['ninja', 'mage', 'knight'];
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

  create() {
    this.chars = normalize(window.__charsData);
    const meta = loadSave();
    this.idx = Math.max(0, ORDER.indexOf(meta.lastChar || 'ninja'));
    this.cards = [];

    this.add.rectangle(0, 0, S.W, S.H, 0x1e2a1c).setOrigin(0);
    // 地面网格：让整屏不至于空成一块纯色
    for (let x = 0; x < S.W; x += 32) {
      for (let y = 0; y < S.H; y += 32) {
        if ((x / 32 + y / 32) % 2 === 0) this.add.rectangle(x, y, 32, 32, 0x22301e, 1).setOrigin(0);
      }
    }

    this.add.text(S.W / 2, 26, '选择角色', {
      fontFamily: FONT, fontSize: '16px', color: '#ffe9b0',
    }).setOrigin(0.5, 0);
    this.add.text(S.W / 2, 50, '← → 切换 · Enter / 空格出发 · 也可以直接点', {
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
    box.on('pointerdown', () => { this.idx = i; this.mark(); this.confirm(); });
    box.on('pointerover', () => { this.idx = i; this.mark(); });
    this.cards.push({ box, face, name, tag, stat, skill });
  }

  weaponName(id) {
    const list = (window.__weaponsData && window.__weaponsData.list) || [];
    const w = list.find((x) => x.id === id);
    return w ? w.name : id;
  }

  mark() {
    this.cards.forEach((k, i) => {
      const on = i === this.idx;
      k.box.setFillStyle(on ? 0x3a4f2e : 0x2b3a26, 1);
      k.box.setStrokeStyle(on ? 3 : 2, on ? 0xffe9b0 : 0x4a5f42);
      k.face.setAlpha(on ? 1 : 0.55).setScale(on ? 1.85 : 1.7);
    });
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
    patchSave({ lastChar: c.id, chars: ORDER.slice() });
    try { this.sound.play('ui', { volume: 0.5 }); } catch (e) {}
    this.scene.start('play', { char: c.id });
  }
}
