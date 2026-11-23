/* 世界地图（P1-A）：章节卡一层 + 关卡节点/详情面板二层
 *
 * 一层：六章卡，显示主线星数、通关数、三档难度印记和锁定条件。
 * 二层：本章节点路径 + 关卡详情，点击节点只选中，点「开始行动」或 Enter 才进选人。
 * 数据仍来自 chapters.json + 存档；本场景只做选章 / 选关 / 展示 / 拦截。
 */
import { FONT, S } from '../core/config.js';
import { loadSave, patchSave } from '../systems/save.js';
import { NAV } from '../systems/nav.js';
import { chapters, chapterById, stageSpec, stageUnlocked, chapterUnlocked, progress, specials, specialCleared, specialGateOk, specialGateLabel, specialRuleLabel, specialRewardLabel } from '../systems/stages.js';
import { TIERS, tierMeta, tierStarsOf, tierUnlocked, selectedTier, tierClearCount } from '../systems/difficulty.js';
import { UI } from '../systems/ui/tokens.js';
import { makePanel, makeCard, makeButton, makeText } from '../systems/ui/primitives.js';

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
  water: 0x5a9ab0, sunken: 0x5a9ab0, lava: 0xc85a38, sky: 0x8a6ab0,
};
const cn = (id, dict) => dict[id] || id;

export class MapScene extends Phaser.Scene {
  constructor() { super('map'); }

  create(data) {
    this.meta = loadSave();
    // 同一个场景实例会被 start 复用；上一轮的覆盖层对象已经销毁，引用必须清掉，
    // 否则 pendingSpecial 打开时会被 if (this.specialBox) return 拦住
    this.specialBox = null;
    this.specialCards = [];
    this.specialDetail = null;
    this.specialStart = null;
    this.specialSel = 0;
    this.diffBox = null;
    this.list = chapters();
    this.ci = Math.max(0, Math.min(this.list.length - 1, (data && data.chapter) || 0));
    if (data && data.chapterId) {
      const at = this.list.findIndex((c) => c.id === data.chapterId);
      if (at >= 0) this.ci = at;
    }
    this.si = Math.max(1, (data && data.stage) || 1);
    this.mode = (data && (data.chapterId || data.stage)) ? 'stages' : 'chapters';
    this.pendingSpecial = (data && data.special) || null;
    this.tier = selectedTier(this.meta, this.list[this.ci].id);
    this.content = [];
    this.buildBackdrop();
    this.buildHeader();
    this.buildFoot();
    this.bindKeys();
    this.render();
    if (this.pendingSpecial) {
      const id = this.pendingSpecial;
      this.pendingSpecial = null;
      this.openSpecial(id);
    }
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
    this.backText = makeText(this, 12, 8, '← 返回', 'body', { color: UI.text.muted })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.back());
    this.titleText = makeText(this, 102, 8, '世界地图', 'h2', { color: UI.text.heading });
    this.starText = makeText(this, S.W - 12, 8, '', 'body', { color: UI.text.info, origin: [1, 0] });
    this.specialText = makeText(this, S.W - 12, 24, '特殊关卡 ' + specials().length + ' ›', 'body', { color: UI.text.special, origin: [1, 0] })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.openSpecial());
  }

  buildFoot() {
    this.footText = makeText(this, S.W / 2, S.H - 15, '', 'body', { color: UI.text.foot, origin: [0.5, 0] });
  }

  keep(obj) { this.content.push(obj); return obj; }

  clearContent() {
    (this.content || []).forEach((o) => o && o.destroy());
    this.content = [];
    this.nodes = [];
    this.cards = [];
    this.previewText = null;
    this.panel = null;
    this.pTitle = null;
    this.pDiff = null;
    this.pStart = null;
    this.extraPanel = null;
    this.extraText = null;
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
      const accent = open ? (THEME[c.theme] || UI.color.neutral) : UI.color.lineMuted;
      const card = makeCard(this, {
        x, y, w: cw, h: ch, accent, state: open ? 'default' : 'locked',
        onClick: () => {
          this.ci = i;
          if (!open) { this.mark(); this.toast('先通关「' + this.list[i - 1].name + '」最后一关'); this.sfx(); return; }
          this.openChapter(i);
        },
      });
      this.keep(card.container);
      this.keep(card.hit);
      const title = makeText(this, 10, 6, '第' + CN[i] + '章 · ' + c.name, 'h2', {
        color: open ? UI.text.heading : UI.text.nameLocked,
      });
      card.add(title);
      card.add(makeText(this, 10, 26, '★ ' + stars + '/' + (c.stages * 3) + ' · 通关 ' + cleared + '/' + c.stages, 'body', {
        color: open ? UI.text.gold : UI.text.locked,
      }));
      card.add(makeText(this, 10, 44, this.tierLine(c, open), 'body', {
        color: open ? UI.text.typeOpen : UI.text.disabled,
      }));
      const status = makeText(this, 10, 66, open ? '点击进入本章' : '通关上一章解锁', 'body', {
        color: open ? UI.text.info : UI.text.danger,
      });
      card.add(status);
      this.cards.push({ card, open, index: i, title, status, accent });
    });

    this.previewText = this.keep(makeText(this, S.W / 2, 250,
      '', 'body', {
        color: UI.text.body, align: 'center',
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
      const state = o.index === this.ci ? 'selected' : (o.open ? 'default' : 'locked');
      o.card.setState(state);
      o.title.setColor(o.open ? UI.text.heading : UI.text.nameLocked);
      o.status.setColor(o.open ? UI.text.info : UI.text.danger);
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
    const list = specials();
    return '支线 ' + list.filter((e) => e.chapter === c.id).length
      + ' · 全局隐藏 ' + list.filter((e) => e.type === 'hidden').length
      + ' · 全局条件 ' + list.filter((e) => e.type === 'conditional').length;
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
    const theme = THEME[c.theme] || UI.color.neutral;
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
      const accent = open ? (isBoss ? UI.color.danger : theme) : UI.color.lineMuted;
      const card = makeCard(this, {
        x, y, w, h, accent, state: open ? 'default' : 'locked',
        onClick: () => {
          if (!open) { this.toast(this.lockMsg(i)); this.sfx(); return; }
          this.si = i;
          this.markStages(c);
          this.sfx();
        },
      });
      this.keep(card.container);
      this.keep(card.hit);
      const py = h === 54 ? 4 : 6;
      const label = makeText(this, 8, py, isBoss ? '首领' : ('第 ' + i + ' 关'), 'body', {
        color: isBoss ? UI.text.danger : UI.text.primary,
      });
      const rooms = makeText(this, 8, py + 16, '房 ' + spec.rooms, 'muted', {
        color: open ? UI.text.typeOpen : UI.text.disabled,
      });
      const status = makeText(this, 8, py + 32,
        open ? (s ? '★★★'.slice(0, s) + '☆☆☆'.slice(0, 3 - s) : '可进入') : '未解锁', 'body', {
          color: open ? (s ? UI.text.gold : UI.text.typeOpen) : UI.text.locked,
        });
      card.add(label, rooms, status);
      this.nodes.push({ i, x, y, w, h, card, open, isBoss, accent, label, status, stars: s });
    }
  }

  buildPanel(c) {
    this.panel = makePanel(this, {
      x: 20, y: 0, w: S.W - 40, h: 108, variant: 'base', depth: 0,
    });
    this.keep(this.panel.container);
    this.pTitle = this.keep(makeText(this, 32, 0, '', 'h2', { color: UI.text.heading }));
    this.pStars = this.keep(makeText(this, S.W - 32, 0, '', 'body', {
      color: UI.text.gold, origin: [1, 0],
    }));
    this.pLine = this.keep(makeText(this, 32, 0, '', 'body', {
      color: UI.text.typeOpen, wordWrap: { width: 400, useAdvancedWrap: true },
    }));
    this.pPick = this.keep(makeText(this, 32, 0, '', 'body', {
      color: UI.text.primary, wordWrap: { width: 430, useAdvancedWrap: true },
    }));
    this.pReward = this.keep(makeText(this, 32, 0, '', 'body', {
      color: UI.text.danger, wordWrap: { width: 430, useAdvancedWrap: true },
    }));
    this.pDiff = makeButton(this, {
      x: S.W - 152, y: 0, w: 118, h: 22, label: '难度', variant: 'ghost', depth: 2,
      onClick: () => this.openDiff(),
    });
    this.keep(this.pDiff.container);
    this.keep(this.pDiff.hit);
    this.pStart = makeButton(this, {
      x: S.W - 112, y: 0, w: 96, h: 24, label: '开始行动 ›', depth: 2,
      onClick: () => this.enter(),
    });
    this.keep(this.pStart.container);
    this.keep(this.pStart.hit);
    this.pStart.setVisible(false);
    this.pStart.setEnabled(false);
    this.extraPanel = makePanel(this, {
      x: 20, y: 0, w: S.W - 40, h: 36, variant: 'raised', depth: 1,
    });
    this.keep(this.extraPanel.container);
    this.extraText = this.keep(makeText(this, 32, 0, '', 'body', {
      color: UI.text.body, wordWrap: { width: 560, useAdvancedWrap: true },
    }).setDepth(2));
    this.layoutPanel(0);
    void c;
  }

  layoutPanel(y) {
    this.panel.container.setY(y);
    this.pTitle.setY(y + 8);
    this.pStars.setY(y + 10);
    this.pLine.setY(y + 28);
    this.pPick.setY(y + 54);
    this.pReward.setY(y + 72);
    this.placeButton(this.pDiff, S.W - 152, y + 26);
    this.placeButton(this.pStart, S.W - 112, y + 80);
    this.extraPanel.container.setY(y + 112);
    this.extraText.setY(y + 118);
  }

  placeButton(btn, x, y) {
    btn.container.setPosition(x, y);
    btn.hit.setPosition(x, y);
  }

  mark() {
    if (this.mode === 'chapters') this.markChapters();
    else this.markStages(this.list[this.ci]);
  }

  markStages(c) {
    if (!c) return;
    this.nodes.forEach((o) => {
      const on = o.i === this.si;
      o.card.setState(on ? 'selected' : (o.open ? 'default' : 'locked'));
      o.label.setColor(on ? UI.text.heading : (o.open ? (o.isBoss ? UI.text.danger : UI.text.primary) : UI.text.nameLocked));
      o.status.setColor(on
        ? (o.open ? UI.text.gold : UI.text.danger)
        : (o.open ? (o.stars ? UI.text.gold : UI.text.typeOpen) : UI.text.locked));
    });
    const p = progress(this.meta);
    this.starText.setText('主线 ★ ' + p.stars + ' / ' + p.max + ' · 本章 ★ ' + this.chapterStars(c, this.tier) + ' / ' + (c.stages * 3));
    const tm = tierMeta(this.tier);
    this.pTitle.setText('第' + CN[this.ci] + '章 · ' + c.name + ' · 第 ' + this.si + ' 关');
    this.pStars.setText('本章 ' + (this.tier === 'normal' ? '' : tm.name + ' ') + '★ ' + this.chapterStars(c, this.tier) + ' / ' + (c.stages * 3));
    this.pDiff.setLabel('难度 ' + tm.name + ' ›');
    const press = (c.pressure || []).map((k) => PRESSURE[k] || k).join(' / ') || '无';
    this.pLine.setText(c.stages + ' 关 · 首关 ' + (c.rooms[0] || 5) + ' 房 · 章内 +5% · 压力 ' + press);
    const spec = stageSpec(c.id, this.si);
    const open = chapterUnlocked(this.meta, this.ci) && spec && stageUnlocked(this.meta, c.id, this.si);
    if (open && spec) {
      const boss = (c.bossPool || []).map((b) => cn(b, BOSS_CN)).join(' / ') || '—';
      const mon = (c.monsters || []).slice(0, 4).map((m) => cn(m, MOB_CN)).join(' / ') || '—';
      this.pPick.setText('首领 ' + boss + ' · 出没 ' + mon);
      this.pReward.setText('通关奖励 ★ 首通宝石 · 高难星级单独记录');
      this.pStart.setVisible(true);
      this.pStart.setEnabled(true);
    } else {
      this.pPick.setText('第 ' + this.si + ' 关');
      this.pReward.setText(chapterUnlocked(this.meta, this.ci) ? this.lockMsg(this.si) : ('通关「' + this.list[this.ci - 1].name + '」后解锁本章'));
      this.pStart.setVisible(false);
      this.pStart.setEnabled(false);
    }
    const raw = window.__chaptersData || {};
    const sides = (raw.side || []).filter((e) => e.chapter === c.id);
    const sideTxt = sides.length ? ('支线 ' + sides.map((e) => e.name || e.id).join(' / ')) : '支线 无';
    this.extraText.setText(sideTxt + ' · 隐藏 ' + (raw.hidden || []).length
      + ' · 条件 ' + (raw.conditional || []).length + ' · 通关/星级解锁');
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
    const panelW = 460;
    const panelH = 228;
    const panelX = (S.W - panelW) / 2;
    const panelY = (S.H - panelH) / 2;
    const mask = this.add.rectangle(0, 0, S.W, S.H, UI.color.overlay, UI.alpha.overlay).setOrigin(0).setDepth(880)
      .setInteractive().on('pointerdown', () => this.closeDiff());
    objs.push(mask);
    const panel = makePanel(this, {
      x: panelX, y: panelY, w: panelW, h: panelH, variant: 'base', depth: 881,
    });
    objs.push(panel.container);
    panel.add(this.add.rectangle(0, 0, panelW, panelH).setOrigin(0)
      .setStrokeStyle(2, UI.color.line));
    // 面板本体的透明命中层：点面板空白处不触发遮罩关闭
    objs.push(this.add.rectangle(panelX, panelY, panelW, panelH, 0, 0).setOrigin(0)
      .setDepth(882).setInteractive());
    objs.push(makeText(this, panelX + panelW / 2, panelY + 8, '选择本章难度', 'h1', {
      color: UI.text.heading, origin: [0.5, 0],
    }).setDepth(883));
    objs.push(makeText(this, panelX + panelW / 2, panelY + 40,
      c.name + ' · 普通 ' + tierClearCount(this.meta, c.id, 'normal') + '/' + c.stages + ' 关已通 · 难度按章保存', 'body', {
      color: UI.text.body, origin: [0.5, 0],
    }).setDepth(883));
    TIERS.forEach((t, idx) => {
      const locked = !tierUnlocked(this.meta, c.id, t.id);
      const cur = this.tier === t.id;
      const row = makeCard(this, {
        x: panelX + 24, y: panelY + 64 + idx * 40, w: panelW - 48, h: 34,
        accent: cur ? UI.color.gold : (locked ? UI.color.lineMuted : (t.id === 'nightmare' ? UI.color.danger : UI.color.info)),
        state: cur ? 'selected' : (locked ? 'locked' : 'default'),
        depth: 883,
        onClick: () => this.chooseDiff(t.id),
      });
      objs.push(row.container, row.hit);
      const name = makeText(this, 14, 9, t.name, 'body', {
        color: cur ? UI.text.heading : (locked ? UI.text.locked : UI.text.primary),
      });
      const note = makeText(this, 84, 9, t.note, 'body', {
        color: locked ? UI.text.locked : UI.text.muted,
      });
      const status = makeText(this, panelW - 62, 9,
        cur ? '当前' : (locked ? (t.id === 'nightmare' ? '需通关普通' : '需通关噩梦') : '已解锁'), 'body', {
          color: cur ? UI.text.gold : (locked ? UI.text.locked : UI.text.info),
          origin: [1, 0],
        });
      row.add(name, note, status);
    });
    objs.push(makeText(this, panelX + panelW / 2, panelY + 204, '点击选项切换 · ESC / 点击空白关闭', 'caption', {
      color: UI.text.foot, origin: [0.5, 0],
    }).setDepth(883));
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
    if (this.specialBox) { this.closeSpecial(); return; }
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
    if (this.specialBox) { this.moveSpecial(dx, dy); return; }
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
    if (this.specialBox) { this.enterSpecial(); return; }
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


  /* ---------- 特殊关卡覆盖层：支线 / 隐藏 / 条件 ---------- */
  gateLabel(s) {
    let txt = specialGateLabel(s, this.meta);
    Object.keys(BOSS_CN).forEach((id) => { txt = txt.split(id).join(BOSS_CN[id]); });
    const ws = (window.__weaponsData && window.__weaponsData.list) || [];
    ws.forEach((w) => { txt = txt.split(w.id).join(w.name); });
    return txt;
  }

  openSpecial(focusId) {
    if (this.diffBox) this.closeDiff();
    if (this.specialBox) return;
    this.specialList = specials();
    if (!this.specialList.length) { this.toast('特殊关卡数据缺失'); return; }
    this.sfx();
    NAV.openOverlay('special');
    const objs = [];
    const depth = 880;
    const panelW = 600, panelH = 320;
    const panelX = (S.W - panelW) / 2;
    const panelY = (S.H - panelH) / 2;
    const mask = this.add.rectangle(0, 0, S.W, S.H, UI.color.overlay, UI.alpha.overlay).setOrigin(0).setDepth(depth)
      .setInteractive().on('pointerdown', () => this.closeSpecial());
    objs.push(mask);
    const panel = makePanel(this, {
      x: panelX, y: panelY, w: panelW, h: panelH, variant: 'special', depth: depth + 1,
    });
    objs.push(panel.container);
    panel.add(this.add.rectangle(0, 0, panelW, panelH).setOrigin(0)
      .setStrokeStyle(2, UI.color.specialLine));
    const title = makeText(this, panelX + panelW / 2, panelY + 8, '特殊关卡', 'h1', {
      color: UI.text.special, origin: [0.5, 0],
    }).setDepth(depth + 2);
    objs.push(title);
    const summary = makeText(this, panelX + panelW / 2, panelY + 36, '支线 ' + this.specialList.filter((x) => x.type === 'side').length
      + ' · 隐藏 ' + this.specialList.filter((x) => x.type === 'hidden').length
      + ' · 条件 ' + this.specialList.filter((x) => x.type === 'conditional').length
      + ' · 与主线星级分开记录', 'specialMuted', {
      origin: [0.5, 0],
    }).setDepth(depth + 2);
    objs.push(summary);

    const cols = 5, cw = 108, ch = 50, gap = 6, top = 54;
    const firstOpen = this.specialList.findIndex((x) => specialGateOk(this.meta, x));
    this.specialSel = Math.max(0, firstOpen);
    if (focusId) {
      const at = this.specialList.findIndex((x) => x.id === focusId);
      if (at >= 0) this.specialSel = at;
    }
    this.specialCards = [];
    this.specialList.forEach((s, i) => {
      const row = Math.floor(i / cols);
      const rowCount = Math.min(cols, this.specialList.length - row * cols);
      const left = panelW / 2 - (rowCount * cw + (rowCount - 1) * gap) / 2;
      const x = left + (i % cols) * (cw + gap);
      const y = top + row * (ch + 8);
      const open = specialGateOk(this.meta, s);
      const cleared = specialCleared(this.meta, s.id);
      const color = open ? UI.typeColor(s.type) : UI.color.lineMuted;
      const card = makeCard(this, {
        x: panelX + x, y: panelY + y, w: cw, h: ch, accent: color,
        state: open ? (cleared ? 'cleared' : 'default') : 'locked',
        depth: depth + 3,
        onClick: () => {
          if (!open) { this.toast('条件未达成：' + this.gateLabel(s)); this.sfx(); return; }
          this.specialSel = i;
          this.refreshSpecial();
          this.sfx();
        },
      });
      objs.push(card.container, card.hit);
      const nameText = makeText(this, 6, 5, s.name, 'body', {
        color: open ? UI.text.primary : UI.text.nameLocked,
      });
      const typeText = makeText(this, 6, 21, s.typeName + (cleared ? ' · 已通' : ''), 'body', {
        color: cleared ? UI.text.gold : (open ? UI.text.typeOpen : UI.text.disabled),
      });
      const statusText = makeText(this, 6, 35, open ? '可挑战' : '未达成', 'body', {
        color: open ? UI.text.info : UI.text.locked,
      });
      card.add(nameText, typeText, statusText);
      this.specialCards.push({ i, s, box: card, open, cleared, nameText, typeText, statusText });
    });

    this.specialDetail = makeText(this, panelX + 20, panelY + 232, '', 'body', {
      wordWrap: { width: 540, useAdvancedWrap: true },
    }).setDepth(depth + 4);
    objs.push(this.specialDetail);
    const start = makeButton(this, {
      x: panelX + 494, y: panelY + 274, w: 88, h: 24, label: '开始挑战 ›', depth: depth + 4,
      onClick: () => this.enterSpecial(),
    });
    this.specialStart = start;
    objs.push(start.container, start.hit);
    const foot = makeText(this, panelX + panelW / 2, panelY + 304, '←→↑↓ 选关 · Enter 进入 · ESC / 点击空白关闭', 'locked', {
      origin: [0.5, 0],
    }).setDepth(depth + 4);
    objs.push(foot);
    this.specialBox = objs;
    this.refreshSpecial();
  }

  refreshSpecial() {
    if (!this.specialCards || !this.specialDetail) return;
    const picked = this.specialCards[this.specialSel];
    this.specialCards.forEach((c) => {
      const pickedCard = c.i === this.specialSel;
      const accent = c.open ? UI.typeColor(c.s.type) : UI.color.lineMuted;
      const state = pickedCard ? 'selected' : (c.open ? (c.cleared ? 'cleared' : 'default') : 'locked');
      c.box.setState(state, { accent });
      c.nameText.setColor(pickedCard ? UI.text.primary : (c.open ? UI.text.primary : UI.text.nameLocked));
      c.typeText.setColor(pickedCard
        ? (c.cleared ? UI.text.gold : UI.text.typeOpen)
        : (c.cleared ? UI.text.gold : (c.open ? UI.text.typeOpen : UI.text.disabled)));
      c.statusText.setColor(pickedCard
        ? (c.open ? UI.text.info : UI.text.danger)
        : (c.open ? UI.text.info : UI.text.locked));
    });
    if (!picked) {
      this.specialDetail.setText('');
      this.specialStart.setVisible(false);
      this.specialStart.setEnabled(false);
      return;
    }
    const s = picked.s;
    const cleared = specialCleared(this.meta, s.id);
    const reward = specialRewardLabel(s);
    const rule = specialRuleLabel(s).replace(/kunai/g, '苦无');
    const base = s.chapter ? (' · ' + (chapterById(s.chapter) || {}).name) : '';
    const gate = picked.open ? '条件已达成' : ('条件未达成 · ' + this.gateLabel(s));
    this.specialDetail.setText(s.typeName + base + ' · ' + s.rooms + ' 房 · ' + gate + '\n'
      + reward + (rule ? ' · ' + rule : '') + (cleared ? ' · 已有通关记录' : ''));
    this.specialStart.setVisible(!!picked.open);
    this.specialStart.setEnabled(!!picked.open);
  }

  closeSpecial() {
    if (!this.specialBox) return;
    this.specialBox.forEach((o) => o && o.destroy());
    this.specialBox = null;
    this.specialCards = null;
    this.specialDetail = null;
    this.specialStart = null;
    NAV.closeOverlay('special');
  }

  moveSpecial(dx, dy) {
    if (!this.specialCards) return;
    const cols = 5;
    let next = this.specialSel + dx + dy * cols;
    next = Math.max(0, Math.min(this.specialCards.length - 1, next));
    if (next === this.specialSel) return;
    this.specialSel = next;
    this.refreshSpecial();
    this.sfx();
  }

  enterSpecial() {
    const picked = this.specialCards && this.specialCards[this.specialSel];
    if (!picked || !picked.open) {
      this.toast('这个特殊关卡还没解锁');
      return;
    }
    const s = picked.s;
    const tier = s.chapter ? selectedTier(this.meta, s.chapter) : this.tier;
    try { this.sound.play('ui', { volume: 0.5 }); } catch (e) {}
    NAV.push('select', {
      stage: { special: s.id, chapterName: s.name, label: s.typeName + ' · ' + s.name, index: 1 },
      difficulty: tier,
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
