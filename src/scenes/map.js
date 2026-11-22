/* 世界地图（P1-A）：章节卡一层 + 关卡节点/详情面板二层
 *
 * 一层：六章卡，显示主线星数、通关数、三档难度印记和锁定条件。
 * 二层：本章节点路径 + 关卡详情，点击节点只选中，点「开始行动」或 Enter 才进选人。
 * 数据仍来自 chapters.json + 存档；本场景只做选章 / 选关 / 展示 / 拦截。
 */
import { FONT, S } from '../core/config.js';
import { loadSave, patchSave } from '../systems/save.js';
import { NAV } from '../systems/nav.js';
import { chapters, stageSpec, stageUnlocked, chapterUnlocked, progress } from '../systems/stages.js';
import { TIERS, tierMeta, tierStarsOf, tierUnlocked, selectedTier, tierClearCount } from '../systems/difficulty.js';

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
const THEME = {
  field: 0x7a9a5a, bamboo: 0x7a9a5a, fort: 0xa47a52, desert: 0xd0a45a,
  sunken: 0x5a9ab0, lava: 0xc85a38, sky: 0x8a6ab0,
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
    this.mode = (data && (data.chapterId || data.stage)) ? 'stages' : 'chapters';
    this.tier = selectedTier(this.meta, this.list[this.ci].id);
    this.content = [];
    this.buildBackdrop();
    this.buildHeader();
    this.buildFoot();
    this.bindKeys();
    this.render();
  }

  /* ---------- 底子 ---------- */
  buildBackdrop() {
    this.add.rectangle(0, 0, S.W, S.H, 0x141a17).setOrigin(0);
    this.add.tileSprite(0, 0, S.W, S.H, 'floorDungeon', 322)
      .setOrigin(0).setTint(0x5f6a78).setAlpha(0.85);
    this.add.rectangle(0, 0, S.W, 30, 0x0b0f0d, 0.9).setOrigin(0);
    this.add.rectangle(0, S.H - 22, S.W, 22, 0x0b0f0d, 0.9).setOrigin(0);
  }

  buildHeader() {
    this.backText = this.add.text(12, 8, '← 返回', {
      fontFamily: FONT, fontSize: '12px', color: '#8fa0a8',
    }).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.back());
    this.titleText = this.add.text(102, 8, '世界地图', {
      fontFamily: FONT, fontSize: '12px', color: '#ffe9b0',
    });
    this.starText = this.add.text(S.W - 12, 8, '', {
      fontFamily: FONT, fontSize: '12px', color: '#9fe0ff',
    }).setOrigin(1, 0);
  }

  buildFoot() {
    this.footText = this.add.text(S.W / 2, S.H - 15, '', {
      fontFamily: FONT, fontSize: '12px', color: '#c8d8c0cc',
    }).setOrigin(0.5, 0);
  }

  keep(obj) { this.content.push(obj); return obj; }

  clearContent() {
    (this.content || []).forEach((o) => o && o.destroy());
    this.content = [];
    this.nodes = [];
    this.cards = [];
    this.previewText = null;
  }

  render() {
    if (this.diffBox) this.closeDiff();
    this.clearContent();
    if (this.mode === 'chapters') this.renderChapters();
    else this.renderStages();
  }

  /* ---------- 一层：章节卡 ---------- */
  renderChapters() {
    this.backText.setText('← 返回');
    this.titleText.setText('世界地图');
    this.footText.setText('↑↓←→ 选章 · Enter 进入章节 · ESC 返回');
    const p = progress(this.meta);
    this.starText.setText('主线 ★ ' + p.stars + ' / ' + p.max + ' · 通关 ' + p.cleared + ' / ' + p.total);

    const cols = 3;
    const gap = 8;
    const cw = Math.floor((S.W - 24 - gap * (cols - 1)) / cols);
    const ch = 88;
    this.cards = [];
    this.list.forEach((c, i) => {
      const x = 12 + (i % cols) * (cw + gap);
      const y = 48 + Math.floor(i / cols) * (ch + 8);
      const open = chapterUnlocked(this.meta, i);
      const stars = (() => {
        let n = 0;
        for (let s = 1; s <= c.stages; s += 1) n += tierStarsOf(this.meta, c.id, s, 'normal');
        return n;
      })();
      let cleared = 0;
      for (let s = 1; s <= c.stages; s += 1) if (tierStarsOf(this.meta, c.id, s, 'normal') > 0) cleared += 1;
      const box = this.keep(this.add.rectangle(x, y, cw, ch, open ? 0x1c2420 : 0x171b18, 0.94)
        .setOrigin(0).setStrokeStyle(2, open ? 0x3f4f46 : 0x35302a)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.ci = i;
          if (!open) { this.mark(); this.toast('先通关「' + this.list[i - 1].name + '」最后一关'); this.sfx(); return; }
          this.openChapter(i);
        }));
      this.keep(this.add.rectangle(x + 2, y + ch - 4, cw - 4, 2, THEME[c.theme] || 0x7a9a5a, 0.85).setOrigin(0));
      this.keep(this.add.text(x + 10, y + 6, '第' + CN[i] + '章 · ' + c.name, {
        fontFamily: FONT, fontSize: '12px', color: open ? '#ffe9b0' : '#7a6a64',
      }));
      this.keep(this.add.text(x + 10, y + 24, '★ ' + stars + '/' + (c.stages * 3) + ' · 通关 ' + cleared + '/' + c.stages, {
        fontFamily: FONT, fontSize: '12px', color: open ? '#ffd479' : '#7a6a64',
      }));
      this.keep(this.add.text(x + 10, y + 44, this.tierLine(c, open), {
        fontFamily: FONT, fontSize: '12px', color: open ? '#a9bcae' : '#5f6a60',
      }));
      this.keep(this.add.text(x + 10, y + 64, open ? '点击进入本章' : '通关上一章解锁', {
        fontFamily: FONT, fontSize: '12px', color: open ? '#9fe0ff' : '#ffb0a0',
      }));
      this.cards.push({ box, open, index: i });
    });

    this.previewText = this.keep(this.add.text(S.W / 2, 250,
      '', {
        fontFamily: FONT, fontSize: '12px', color: '#c8d8c0', align: 'center',
        wordWrap: { width: S.W - 40, useAdvancedWrap: true },
      }).setOrigin(0.5, 0));
    this.mark();
  }

  tierLine(c, open) {
    if (!open) return '难度  普 —  噩 —  地 —';
    return '难度  普 ' + (tierUnlocked(this.meta, c.id, 'normal') ? '✓' : '—')
      + '  噩 ' + (tierUnlocked(this.meta, c.id, 'nightmare') ? '✓' : '✗')
      + '  地 ' + (tierUnlocked(this.meta, c.id, 'hell') ? '✓' : '✗');
  }

  openChapter(i) {
    const c = this.list[i];
    if (!chapterUnlocked(this.meta, i)) return;
    this.ci = i;
    this.si = 1;
    this.tier = selectedTier(this.meta, c.id);
    this.mode = 'stages';
    this.sfx();
    this.render();
  }

  markChapters() {
    this.cards.forEach((o) => {
      o.box.setStrokeStyle(o.index === this.ci ? 3 : 2, o.index === this.ci ? 0xffe9b0 : (o.open ? 0x3f4f46 : 0x35302a));
    });
    const c = this.list[this.ci];
    if (!c) return;
    const open = chapterUnlocked(this.meta, this.ci);
    let n = 0;
    for (let i = 1; i <= c.stages; i += 1) n += tierStarsOf(this.meta, c.id, i, 'normal');
    const boss = (c.bossPool || []).map((b) => cn(b, BOSS_CN)).join(' / ') || '—';
    const mon = (c.monsters || []).slice(0, 4).map((m) => cn(m, MOB_CN)).join(' / ') || '—';
    const special = this.specialCount(c);
    const first = '第' + CN[this.ci] + '章 · ' + c.name + ' · ' + c.stages + ' 关 · ★ ' + n + '/' + (c.stages * 3);
    const second = open
      ? '首领 ' + boss + ' · 出没 ' + mon + ' · ' + special
      : '通关「' + this.list[this.ci - 1].name + '」最后一关后解锁';
    if (this.previewText) this.previewText.setText(first + '\n' + second);
  }

  specialCount(c) {
    const raw = window.__chaptersData || {};
    const side = (raw.side || []).filter((e) => e.chapter === c.id).length;
    const hidden = (raw.hidden || []).length;
    const cond = (raw.conditional || []).length;
    return '支线 ' + side + ' · 隐藏 ' + hidden + ' · 条件 ' + cond;
  }

  /* ---------- 二层：关卡节点 + 详情 ---------- */
  renderStages() {
    const c = this.list[this.ci];
    if (!c) return;
    this.backText.setText('← 章节');
    this.titleText.setText('第' + CN[this.ci] + '章 · ' + c.name);
    this.footText.setText('←→ 选关 · Enter 出发 · 点节点查看 · 点「难度」切换 · ESC 返回章节');
    this.buildPanel(c);
    this.buildNodes(c);
    this.markStages(c);
  }

  buildNodes(c) {
    this.nodes = [];
    const n = c.stages;
    const perRow = n <= 5 ? n : Math.ceil(n / 2);
    const rows = Math.ceil(n / perRow);
    const w = 104;
    const h = rows > 1 ? 54 : 60;
    const gap = 12;
    const top = 56;
    this.layoutPanel(rows > 1 ? 184 : 150);
    for (let i = 1; i <= n; i += 1) {
      const row = Math.floor((i - 1) / perRow);
      const rowCount = Math.min(perRow, n - row * perRow);
      const totalW = rowCount * w + (rowCount - 1) * gap;
      const left = S.W / 2 - totalW / 2;
      const col = (i - 1) % perRow;
      const x = left + col * (w + gap);
      const y = top + row * (h + 10);
      const spec = stageSpec(c.id, i);
      const s = tierStarsOf(this.meta, c.id, i, this.tier);
      const open = chapterUnlocked(this.meta, this.ci) && stageUnlocked(this.meta, c.id, i);
      const isBoss = i === n;
      const box = this.keep(this.add.rectangle(x, y, w, h, isBoss ? 0x3a1e1a : 0x1c2420, 0.94)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          if (!open) { this.toast(this.lockMsg(i)); this.sfx(); return; }
          this.si = i;
          this.markStages(c);
          this.sfx();
        }));
      this.keep(this.add.text(x + 8, y + 6, isBoss ? '首领' : ('第 ' + i + ' 关'), {
        fontFamily: FONT, fontSize: '12px', color: isBoss ? '#ffb0a0' : '#e6efe6',
      }));
      this.keep(this.add.text(x + 8, y + 21, '房 ' + spec.rooms, {
        fontFamily: FONT, fontSize: '12px', color: '#9fb0a6',
      }));
      this.keep(this.add.text(x + 8, y + 37, open ? (s ? '★★★'.slice(0, s) + '☆☆☆'.slice(0, 3 - s) : '可进入') : '未解锁', {
        fontFamily: FONT, fontSize: '12px', color: open ? (s ? '#ffd479' : '#a9bcae') : '#7a6a64',
      }));
      this.nodes.push({ i, x, y, w, h, box, open, isBoss });
    }
  }

  buildPanel(c) {
    this.panel = this.keep(this.add.rectangle(20, 0, S.W - 40, 108, 0x121a16, 0.94).setOrigin(0)
      .setStrokeStyle(2, 0x3f4f46));
    this.pTitle = this.keep(this.add.text(32, 0, '', { fontFamily: FONT, fontSize: '14px', color: '#ffe9b0' }));
    this.pStars = this.keep(this.add.text(S.W - 32, 0, '', { fontFamily: FONT, fontSize: '12px', color: '#ffd479' }).setOrigin(1, 0));
    this.pLine = this.keep(this.add.text(32, 0, '', { fontFamily: FONT, fontSize: '12px', color: '#a9bcae' }));
    this.pPick = this.keep(this.add.text(32, 0, '', { fontFamily: FONT, fontSize: '12px', color: '#d8e6da' }));
    this.pReward = this.keep(this.add.text(32, 0, '', { fontFamily: FONT, fontSize: '12px', color: '#ffb0a0' }));
    this.pDiff = this.keep(this.add.text(S.W - 32, 0, '', {
      fontFamily: FONT, fontSize: '12px', color: '#9fe0ff',
      backgroundColor: '#00000066', padding: { x: 4, y: 2 },
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.openDiff()));
    this.pStart = this.keep(this.add.text(S.W - 32, 0, '开始行动 ›', {
      fontFamily: FONT, fontSize: '12px', color: '#101713',
      backgroundColor: '#ffe9b0', padding: { x: 8, y: 4 },
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.enter()));
    this.extraBox = this.keep(this.add.rectangle(20, 0, S.W - 40, 30, 0x121a16, 0.9).setOrigin(0)
      .setStrokeStyle(2, 0x2f3b35));
    this.extraText = this.keep(this.add.text(32, 0, '', { fontFamily: FONT, fontSize: '12px', color: '#b9c9bd' }));
    if (this.pStart.input) this.pStart.input.enabled = false;
    this.layoutPanel(this.panel.y);
    void c;
  }

  layoutPanel(y) {
    this.panel.setY(y);
    this.pTitle.setY(y + 8);
    this.pStars.setY(y + 10);
    this.pLine.setY(y + 28);
    this.pDiff.setY(y + 28);
    this.pPick.setY(y + 46);
    this.pReward.setY(y + 66);
    this.pStart.setY(y + 84);
    this.extraBox.setY(y + 112);
    this.extraText.setY(y + 118);
  }

  mark() {
    if (this.mode === 'chapters') this.markChapters();
    else this.markStages(this.list[this.ci]);
  }

  markStages(c) {
    if (!c) return;
    this.nodes.forEach((o) => {
      const on = o.i === this.si;
      o.box.setStrokeStyle(on ? 3 : 2, on ? 0xffe9b0 : (o.open ? 0x3f4f46 : 0x35302a));
      o.box.setFillStyle(o.open ? (o.isBoss ? 0x3a1e1a : 0x24312a) : 0x171b18, 0.96);
    });
    const p = progress(this.meta);
    this.starText.setText('主线 ★ ' + p.stars + ' / ' + p.max + ' · 本章 ★ ' + this.chapterStars(c, this.tier) + ' / ' + (c.stages * 3));
    const tm = tierMeta(this.tier);
    this.pTitle.setText('第' + CN[this.ci] + '章 · ' + c.name + ' · 第 ' + this.si + ' 关');
    this.pStars.setText('本章 ' + (this.tier === 'normal' ? '' : tm.name + ' ') + '★ ' + this.chapterStars(c, this.tier) + ' / ' + (c.stages * 3));
    this.pDiff.setText('难度 ' + tm.name + ' ›').setColor(tm.color);
    const press = (c.pressure || []).map((k) => PRESSURE[k] || k).join(' / ') || '无';
    this.pLine.setText(c.stages + ' 关 · 每关 ' + (c.rooms[0] || 5) + ' 房 · 章内 +5% · 压力 ' + press);
    const spec = stageSpec(c.id, this.si);
    const open = chapterUnlocked(this.meta, this.ci) && spec && stageUnlocked(this.meta, c.id, this.si);
    if (open && spec) {
      const boss = (c.bossPool || []).map((b) => cn(b, BOSS_CN)).join(' / ') || '—';
      const mon = (c.monsters || []).slice(0, 4).map((m) => cn(m, MOB_CN)).join(' / ') || '—';
      this.pPick.setText('首领 ' + boss + ' · 出没 ' + mon);
      this.pReward.setText('通关奖励 ★ 首通宝石 · 高难星级单独记录');
      if (this.pStart.input) this.pStart.input.enabled = true;
      this.pStart.setVisible(true);
    } else {
      this.pPick.setText('第 ' + this.si + ' 关');
      this.pReward.setText(chapterUnlocked(this.meta, this.ci) ? this.lockMsg(this.si) : ('通关「' + this.list[this.ci - 1].name + '」后解锁本章'));
      if (this.pStart.input) this.pStart.input.enabled = false;
      this.pStart.setVisible(false);
    }
    const raw = window.__chaptersData || {};
    const sides = (raw.side || []).filter((e) => e.chapter === c.id);
    const sideTxt = sides.length ? ('支线 ' + sides.map((e) => e.name || e.id).join(' / ')) : '支线 无';
    this.extraText.setText(sideTxt + ' · 隐藏关 ' + (raw.hidden || []).length
      + ' 个 · 条件关 ' + (raw.conditional || []).length + ' 个 · 通关与星级解锁');
  }

  chapterStars(c, tier) {
    let n = 0;
    for (let i = 1; i <= c.stages; i += 1) n += tierStarsOf(this.meta, c.id, i, tier);
    return n;
  }

  lockMsg(i) {
    const c = this.list[this.ci];
    if (i <= 1) return '本章起点，可直接进入';
    return '先通关「' + c.name + ' 第 ' + (i - 1) + ' 关」';
  }

  /* ---------- 难度覆盖层 ---------- */
  openDiff() {
    if (this.diffBox || this.mode !== 'stages') return;
    const c = this.list[this.ci];
    this.sfx();
    NAV.openOverlay('difficulty');
    const objs = [];
    const mask = this.add.rectangle(0, 0, S.W, S.H, 0x000000, 0.74).setOrigin(0).setDepth(880)
      .setInteractive().on('pointerdown', () => this.closeDiff());
    objs.push(mask);
    objs.push(this.add.rectangle(S.W / 2, S.H / 2, 430, 264, 0x121a16, 0.98)
      .setStrokeStyle(2, 0x55645a).setDepth(881));
    objs.push(this.add.text(S.W / 2, 72, '选择本章难度', {
      fontFamily: FONT, fontSize: '14px', color: '#ffe9b0',
    }).setOrigin(0.5).setDepth(882));
    objs.push(this.add.text(S.W / 2, 90, c.name + ' · 普通 ' + tierClearCount(this.meta, c.id, 'normal') + '/' + c.stages + ' 关已通 · 难度按章保存', {
      fontFamily: FONT, fontSize: '12px', color: '#9fb0a6',
    }).setOrigin(0.5).setDepth(882));
    TIERS.forEach((t, idx) => {
      const locked = !tierUnlocked(this.meta, c.id, t.id);
      const cur = this.tier === t.id;
      const y = 120 + idx * 36;
      const row = this.add.rectangle(S.W / 2, y, 390, 30, cur ? 0x2a3a30 : 0x1c2420, 1)
        .setStrokeStyle(2, cur ? 0xffe9b0 : (locked ? 0x35302a : 0x3f4f46)).setDepth(882)
        .setInteractive({ useHandCursor: !locked })
        .on('pointerdown', () => this.chooseDiff(t.id));
      objs.push(row);
      objs.push(this.add.text(140, y, t.name, {
        fontFamily: FONT, fontSize: '12px', color: locked ? '#7a6a64' : (cur ? '#ffe9b0' : '#e6efe6'),
      }).setOrigin(0, 0.5).setDepth(882));
      objs.push(this.add.text(210, y, t.note, {
        fontFamily: FONT, fontSize: '12px', color: locked ? '#6e615c' : '#9fb0a6',
      }).setOrigin(0, 0.5).setDepth(882));
      const st = cur ? '当前' : (locked ? (t.id === 'nightmare' ? '需通关普通' : '需通关噩梦') : '已解锁');
      objs.push(this.add.text(504, y, st, {
        fontFamily: FONT, fontSize: '12px', color: cur ? '#ffe9b0' : (locked ? '#7a6a64' : '#9fe0ff'),
      }).setOrigin(1, 0.5).setDepth(882));
    });
    objs.push(this.add.text(S.W / 2, 232, '点击选项切换 · ESC / 点击空白关闭', {
      fontFamily: FONT, fontSize: '12px', color: '#7d8a84',
    }).setOrigin(0.5).setDepth(882));
    this.diffBox = objs;
  }

  closeDiff() {
    if (!this.diffBox) return;
    this.diffBox.forEach((o) => o && o.destroy());
    this.diffBox = null;
    NAV.closeOverlay('difficulty');
  }

  chooseDiff(id) {
    const c = this.list[this.ci];
    if (!tierUnlocked(this.meta, c.id, id)) {
      this.toast(id === 'nightmare' ? '通关本章普通全部关卡后解锁噩梦' : '通关本章噩梦全部关卡后解锁地狱');
      return;
    }
    const sel = Object.assign({}, this.meta.diffSel || {});
    sel[c.id] = id;
    this.meta = patchSave({ diffSel: sel });
    this.tier = id;
    this.closeDiff();
    this.render();
    this.sfx();
  }

  /* ---------- 交互 ---------- */
  back() {
    if (this.diffBox) { this.closeDiff(); return; }
    try { this.sound.play('ui', { volume: 0.35 }); } catch (e) {}
    if (this.mode === 'stages') {
      this.mode = 'chapters';
      this.render();
      return;
    }
    if (!NAV.back()) this.scene.start('title');
  }

  move(dx, dy) {
    if (this.diffBox) return;
    if (this.mode === 'chapters') {
      const cols = 3;
      let next = this.ci + dx + dy * cols;
      if (dx !== 0 && Math.floor(this.ci / cols) !== Math.floor(next / cols)) next = this.ci;
      next = Math.max(0, Math.min(this.list.length - 1, next));
      if (next === this.ci) return;
      this.ci = next;
      this.mark();
      this.sfx();
      return;
    }
    const c = this.list[this.ci];
    const next = Math.max(1, Math.min(c.stages, this.si + (dx || dy)));
    if (next === this.si) return;
    this.si = next;
    this.markStages(c);
    this.sfx();
  }

  activate() {
    if (this.diffBox) return;
    if (this.mode === 'chapters') {
      const open = chapterUnlocked(this.meta, this.ci);
      if (!open) { this.toast('先通关「' + this.list[this.ci - 1].name + '」最后一关'); return; }
      this.openChapter(this.ci);
      return;
    }
    this.enter();
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
    NAV.push('select', {
      stage: { chapter: spec.chapterId, chapterName: spec.chapterName, index: spec.index },
      difficulty: this.tier,
    });
  }

  bindKeys() {
    const kb = this.input.keyboard;
    kb.on('keydown-UP', () => this.move(0, -1));
    kb.on('keydown-DOWN', () => this.move(0, 1));
    kb.on('keydown-LEFT', () => this.move(-1, 0));
    kb.on('keydown-RIGHT', () => this.move(1, 0));
    kb.on('keydown-A', () => this.move(-1, 0));
    kb.on('keydown-D', () => this.move(1, 0));
    kb.on('keydown-ENTER', () => this.activate());
    kb.on('keydown-SPACE', () => this.activate());
    kb.on('keydown-ESC', () => this.back());
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (p) => {
      if (p.button === 2) this.back();
    });
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
