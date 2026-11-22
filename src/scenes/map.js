/* 世界地图（批 9）：六章 × 每章 1–9 关的节点图
 * 数据全部来自 chapters.json + 存档 stars；本场景只做"选关 / 展示进度 / 拦截未解锁"。
 * 交互：↑↓ 换章、←→ 选关、Enter 进入（走选人界面）、ESC 回小屋。
 */
import { FONT, S } from '../core/config.js';
import { loadSave } from '../systems/save.js';
import { NAV } from '../systems/nav.js';
import { chapters, stageSpec, starsOf, stageUnlocked, chapterUnlocked, progress } from '../systems/stages.js';

const PRESSURE = {
  gate: '机关门', quicksand: '流沙', poison: '毒雾', waterSlow: '水沟减速',
  current: '暗流', burn: '灼烧', firerain: '火雨', threePhase: '三阶段终战',
};
const CN = ['一', '二', '三', '四', '五', '六', '七', '八'];
const BOSS_CN = {
  frog: '巨蛙', racoon: '浣熊', samBlue: '蓝武士', samRed: '赤武士', spirit: '魂灵',
  demonCyclop: '恶魔独眼', demonCyclop2: '恶魔独眼·改', tenguBlue: '蓝天狗', tenguRed: '赤天狗', flam: '炎魔', weaver: '影织者',
};
const MOB_CN = {
  beast: '野兽', cyclope: '独眼', eye: '眼球', racoon: '浣熊', bamboo: '竹精', larva: '幼虫',
  slime: '史莱姆', spider: '蜘蛛', owl: '猫头鹰', mush: '蘑菇怪', mole: '地鼠', skull: '骷髅',
  snake: '蛇', reptile: '爬虫', lizard: '蜥蜴', mollusc: '软体', mouse: '老鼠', fish: '鱼人',
  octopus: '章鱼', kappa: '河童', axolot: '蝾螈', flam: '炎魔', dragon: '幼龙', demon: '恶魔',
  lantern: '灯笼鬼', weaver: '影织者',
};
const cn = (id, dict) => dict[id] || id;

export class MapScene extends Phaser.Scene {
  constructor() { super('map'); }

  create(data) {
    this.meta = loadSave();
    this.list = chapters();
    this.ci = Math.max(0, Math.min(this.list.length - 1, (data && data.chapter) || 0));
    if (data && data.chapterId) {
      const at = this.list.findIndex((c) => c.id === data.chapterId);
      if (at >= 0) this.ci = at;
    }
    this.si = Math.max(1, (data && data.stage) || 1);
    this.buildBackdrop();
    this.buildHeader();
    this.buildTabs();
    this.buildPanel();
    this.buildNodes();
    this.buildFoot();
    this.bindKeys();
    this.mark();
  }

  buildBackdrop() {
    this.add.rectangle(0, 0, S.W, S.H, 0x141a17).setOrigin(0);
    this.add.tileSprite(0, 0, S.W, S.H, 'floorDungeon', 322)
      .setOrigin(0).setTint(0x5f6a78).setAlpha(0.85);
    this.add.rectangle(0, 0, S.W, 30, 0x0b0f0d, 0.9).setOrigin(0);
    this.add.rectangle(0, S.H - 22, S.W, 22, 0x0b0f0d, 0.9).setOrigin(0);
    this.add.rectangle(0, 30, S.W, 30, 0x0b0f0d, 0.55).setOrigin(0);
  }

  buildHeader() {
    this.add.text(12, 8, '← 返回', {
      fontFamily: FONT, fontSize: '12px', color: '#8fa0a8',
    }).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.back());
    this.add.text(92, 8, '世界地图', {
      fontFamily: FONT, fontSize: '12px', color: '#ffe9b0',
    });
    this.starText = this.add.text(S.W - 12, 8, '', {
      fontFamily: FONT, fontSize: '12px', color: '#9fe0ff',
    }).setOrigin(1, 0);
  }

  buildTabs() {
    const w = S.W / this.list.length;
    this.tabs = this.list.map((c, i) => {
      const cx = w * i + w / 2;
      const t = this.add.text(cx, 38, CN[i] + ' ' + c.name, {
        fontFamily: FONT, fontSize: '12px', color: '#7d8a84',
      }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.pickChapter(i));
      const line = this.add.rectangle(cx, 55, w - 14, 2, 0xffe9b0, 0.9).setOrigin(0.5, 0).setVisible(false);
      return { t, line };
    });
  }

  buildPanel() {
    this.panel = this.add.rectangle(20, 0, S.W - 40, 92, 0x121a16, 0.94).setOrigin(0)
      .setStrokeStyle(2, 0x3f4f46);
    this.pTitle = this.add.text(32, 0, '', { fontFamily: FONT, fontSize: '14px', color: '#ffe9b0' });
    this.pStars = this.add.text(S.W - 32, 0, '', { fontFamily: FONT, fontSize: '12px', color: '#ffd479' }).setOrigin(1, 0);
    this.pLine = this.add.text(32, 0, '', { fontFamily: FONT, fontSize: '12px', color: '#a9bcae' });
    this.pPick = this.add.text(32, 0, '', { fontFamily: FONT, fontSize: '12px', color: '#d8e6da' });
    this.pUnlock = this.add.text(32, 0, '', { fontFamily: FONT, fontSize: '12px', color: '#ffb0a0' });
    this.extraBox = this.add.rectangle(20, 0, S.W - 40, 34, 0x121a16, 0.9).setOrigin(0)
      .setStrokeStyle(2, 0x2f3b35);
    this.extraText = this.add.text(32, 0, '', { fontFamily: FONT, fontSize: '12px', color: '#b9c9bd' });
  }

  layoutPanel(y) {
    this.panel.setY(y);
    this.pTitle.setY(y + 8);
    this.pStars.setY(y + 10);
    this.pLine.setY(y + 30);
    this.pPick.setY(y + 48);
    this.pUnlock.setY(y + 66);
    this.extraBox.setY(y + 100);
    this.extraText.setY(y + 108);
  }

  buildNodes() {
    const c = this.list[this.ci];
    if (!c) return;
    this.nodes = [];
    const n = c.stages;
    const perRow = Math.min(5, n);
    const rows = Math.ceil(n / perRow);
    const w = 104;
    const h = rows > 1 ? 54 : 60;
    const gap = 12;
    const top = 64;
    this.layoutPanel(rows > 1 ? 186 : 152);
    for (let i = 1; i <= n; i += 1) {
      const row = Math.floor((i - 1) / perRow);
      const totalW = perRow * w + (perRow - 1) * gap;
      const left = S.W / 2 - totalW / 2;
      const col = (i - 1) % perRow;
      const x = left + col * (w + gap);
      const y = top + row * (h + 10);
      const spec = stageSpec(c.id, i);
      const s = starsOf(this.meta, c.id, i);
      const open = chapterUnlocked(this.meta, this.ci) && stageUnlocked(this.meta, c.id, i);
      const isBoss = i === n;
      const box = this.add.rectangle(x, y, w, h, isBoss ? 0x3a1e1a : 0x1c2420, 0.94).setOrigin(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => { if (!open) { this.toast(this.lockMsg(i)); this.sfx(); return; } this.si = i; this.mark(); this.enter(); });
      const no = this.add.text(x + 8, y + 6, isBoss ? '首领' : ('第 ' + i + ' 关'), {
        fontFamily: FONT, fontSize: '12px', color: isBoss ? '#ffb0a0' : '#e6efe6',
      });
      const rm = this.add.text(x + 8, y + 21, '房 ' + spec.rooms, {
        fontFamily: FONT, fontSize: '12px', color: '#9fb0a6',
      });
      const st = this.add.text(x + 8, y + 37, open ? (s ? '★★★'.slice(0, s) + '☆☆☆'.slice(0, 3 - s) : '可进入') : '未解锁', {
        fontFamily: FONT, fontSize: '12px', color: open ? (s ? '#ffd479' : '#a9bcae') : '#7a6a64',
      });
      this.nodes.push({ i, x, y, w, h, box, no, rm, st, open, isBoss });
    }
  }

  liftNodes() {
    (this.nodes || []).forEach((o) => [o.box, o.no, o.rm, o.st].forEach((t) => t && t.destroy()));
    this.nodes = [];
  }

  pickChapter(i) {
    if (!chapterUnlocked(this.meta, i)) {
      this.toast('先通关「' + this.list[i - 1].name + '」最后一关');
      return;
    }
    this.ci = i;
    this.si = 1;
    this.liftNodes();
    this.buildNodes();
    this.mark();
    this.sfx();
  }

  mark() {
    const c = this.list[this.ci];
    this.tabs.forEach((o, i) => {
      const open = chapterUnlocked(this.meta, i);
      o.t.setColor(i === this.ci ? '#ffe9b0' : (open ? '#7d8a84' : '#4f5854'));
      o.t.setFontSize(i === this.ci ? 13 : 12);
      o.line.setVisible(i === this.ci);
    });
    (this.nodes || []).forEach((o) => {
      const on = o.i === this.si;
      o.box.setStrokeStyle(on ? 3 : 2, on ? 0xffe9b0 : (o.open ? 0x3f4f46 : 0x35302a));
      o.box.setFillStyle(o.open ? (o.isBoss ? 0x3a1e1a : 0x24312a) : 0x171b18, 0.96);
    });
    const p = progress(this.meta);
    this.starText.setText('主线 ★ ' + p.stars + ' / ' + p.max + ' · 通关 ' + p.cleared + ' / ' + p.total);
    this.pTitle.setText('第' + CN[this.ci] + '章 · ' + c.name + (c.theme ? '' : ''));
    let cs = 0;
    for (let i = 1; i <= c.stages; i += 1) cs += starsOf(this.meta, c.id, i);
    this.pStars.setText('本章 ★ ' + cs + ' / ' + (c.stages * 3));
    const press = (c.pressure || []).map((k) => PRESSURE[k] || k).join(' / ') || '无';
    this.pLine.setText(c.stages + ' 关 · 每关 ' + (c.rooms[0] || 5) + ' 房 · 难度 ×' + (+c.diff).toFixed(2)
      + ' · 章内每关 +5% · 压力 ' + press);
    const spec = c.stages >= this.si ? stageSpec(c.id, this.si) : null;
    const open = chapterUnlocked(this.meta, this.ci) && spec && stageUnlocked(this.meta, c.id, this.si);
    if (open && spec) {
      const boss = (c.bossPool || []).map((b) => cn(b, BOSS_CN)).join(' / ') || '—';
      const mon = (c.monsters || []).slice(0, 4).map((m) => cn(m, MOB_CN)).join(' / ') || '—';
      this.pPick.setText('选中 第 ' + this.si + ' 关 · 首领 ' + boss + ' · 出没 ' + mon);
      this.pUnlock.setText('');
    } else {
      this.pPick.setText('选中 第 ' + this.si + ' 关');
      this.pUnlock.setText(chapterUnlocked(this.meta, this.ci) ? this.lockMsg(this.si) : ('通关「' + this.list[this.ci - 1].name + '」后解锁本章'));
    }
    const raw = window.__chaptersData || {};
    const sides = (raw.side || []).filter((e) => e.chapter === c.id);
    const sideTxt = sides.length ? ('支线 ' + sides.map((e) => e.name || e.id).join(' / ')) : '支线 无';
    this.extraText.setText(sideTxt + ' · 隐藏关 ' + (raw.hidden || []).length
      + ' 个 · 条件关 ' + (raw.conditional || []).length + ' 个 · 通关与星级解锁');
  }

  lockMsg(i) {
    const c = this.list[this.ci];
    if (i <= 1) return '本章起点，可直接进入';
    const prev = stageSpec(c.id, i - 1);
    return '先通关「' + c.name + ' 第 ' + (i - 1) + ' 关」' + (prev && prev.isBoss ? '' : '');
  }

  buildFoot() {
    this.foot = this.add.text(S.W / 2, S.H - 15, '↑↓ 换章 · ←→ 选关 · Enter 进入 · ESC 返回', {
      fontFamily: FONT, fontSize: '12px', color: '#c8d8c0cc',
    }).setOrigin(0.5, 0);
  }

  bindKeys() {
    const kb = this.input.keyboard;
    kb.on('keydown-UP', () => this.switchChapter(-1));
    kb.on('keydown-DOWN', () => this.switchChapter(1));
    kb.on('keydown-LEFT', () => this.moveStage(-1));
    kb.on('keydown-RIGHT', () => this.moveStage(1));
    kb.on('keydown-A', () => this.moveStage(-1));
    kb.on('keydown-D', () => this.moveStage(1));
    kb.on('keydown-ENTER', () => this.enter());
    kb.on('keydown-SPACE', () => this.enter());
    kb.on('keydown-ESC', () => this.back());
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (p) => {
      if (p.button === 2) this.back();
    });
  }

  back() {
    try { this.sound.play('ui', { volume: 0.35 }); } catch (e) {}
    if (!NAV.back()) this.scene.start('title');
  }

  switchChapter(d) {
    const next = this.ci + d;
    if (next < 0 || next >= this.list.length) return;
    this.pickChapter(next);
  }

  moveStage(d) {
    const c = this.list[this.ci];
    this.si = Math.max(1, Math.min(c.stages, this.si + d));
    this.sfx();
    this.mark();
  }

  enter() {
    const c = this.list[this.ci];
    if (!chapterUnlocked(this.meta, this.ci) || !stageUnlocked(this.meta, c.id, this.si)) {
      this.toast('这一关还没解锁');
      return;
    }
    const spec = stageSpec(c.id, this.si);
    if (!spec) { this.toast('关卡数据缺失'); return; }
    try { this.sound.play('ui', { volume: 0.5 }); } catch (e) {}
    NAV.push('select', { stage: { chapter: spec.chapterId, chapterName: spec.chapterName, index: spec.index } });
  }

  sfx() { try { this.sound.play('ui', { volume: 0.35 }); } catch (e) {} }

  toast(msg) {
    if (this.toastT) this.toastT.destroy();
    this.toastT = this.add.text(S.W / 2, S.H - 44, msg, {
      fontFamily: FONT, fontSize: '12px', color: '#ffb0a0', backgroundColor: '#000000cc',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5, 0).setDepth(900);
    this.time.delayedCall(1700, () => { if (this.toastT) { this.toastT.destroy(); this.toastT = null; } });
  }
}
