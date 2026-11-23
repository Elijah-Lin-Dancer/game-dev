/* 大厅（批 7）：跨局进程的落点 —— 宝石花在哪、图鉴点亮了什么
 *
 * 三个页签：
 *   武器：展示 6 把武器，锁着的标价，点击花宝石解锁（解锁后进掉落池）
 *   角色：三个角色，锁着的标价（解锁后才能在选人界面选中）
 *   图鉴：怪 / Boss / 武器 / 房间四栏，没见过显示 ???
 *
 * 交互：1/2/3 或 ← → 切页，点击条目解锁，Enter / 空格 出发去选人。
 * 素材：全部包内件 —— 地面用 Interior 花砖、宝石图标用 TilesetDungeon frame 43、
 * 武器图标与角色立绘复用既有图集，没有外部件也没有自绘。
 */
import { FONT, S, TILE, CFG } from '../core/config.js';
import { loadSave, patchSave } from '../systems/save.js';
import { chapterById, starsOf } from '../systems/stages.js';
import { NAV } from '../systems/nav.js';
import {
  FORGE_LEVELS, FORGE_MAX, FORGE_BLUEPRINT_MAX,
  forgeLevel, forgeNext, forgeMul, forgeBonus, hasBlueprint,
} from '../systems/forge.js';
import { NPCS, npcDialogue } from '../systems/npc.js';
import { UI } from '../systems/ui/tokens.js';
import { makeCard, makeButton, makeText, makePanel } from '../systems/ui/primitives.js';

const TABS = ['武器', '角色', '图鉴', '小屋'];
const RARITY = {
  common: { name: '普通', color: 0x9aa0a6, hex: '#9aa0a6' },
  fine: { name: '精良', color: 0x7cb342, hex: '#7cb342' },
  rare: { name: '稀有', color: 0x42a5f5, hex: '#42a5f5' },
  epic: { name: '史诗', color: 0xab47bc, hex: '#ab47bc' },
};
const KIND_NAME = { melee: '近战', ranged: '远程', throw: '投掷' };
const ROOM_NAME = {
  battle: '战场', elite: '精英', treasure: '宝箱', shop: '商店',
  shrine: '石龛', rest: '篝火', gate: '机关', boss: '首领',
};
const rarityOf = (item) => RARITY[item && item.rarity] || RARITY.common;
const priceOf = (item) => Math.max(0, Number(item && item.unlock && item.unlock.cost) || 0);
const charList = () => (Array.isArray(window.__charsData) ? window.__charsData
  : ((window.__charsData && window.__charsData.list) || []));
/* 图鉴里要列的东西：怪用图集里的 kind 键（首帧当头像），Boss 用两只专用贴图 */
const FOES = [
  ['beast', '野兽'], ['cyclope', '独眼'], ['eye', '眼球'], ['larva', '幼虫'],
  ['slime', '史莱姆'], ['spider', '蜘蛛'], ['owl', '夜枭'], ['mush', '毒菇'],
  ['mole', '鼹鼠'], ['skull', '骷髅'], ['racoon', '浣熊'], ['snake', '蛇'],
  ['reptile', '爬虫'], ['lizard', '蜥蜴'], ['mollusc', '软体'], ['mouse', '老鼠'],
  ['fish', '鱼人'], ['octopus', '章鱼'], ['kappa', '河童'], ['axolot', '蝾螈'],
  ['flam', '火灵'], ['dragon', '火龙'], ['demon', '炎魔'], ['lantern', '鬼灯'], ['spirit', '火魂'],
];
const BOSSES = [
  ['frog', '蛙王', 'boss', 0.75], ['racoon', '巨浣熊', 'racoonIdle', 0.55],
  ['samurai', '蓝武士', 'samIdle', 0.36], ['samuraiRed', '赤武士', 'rsamIdle', 0.36],
  ['tenguBlue', '蓝天狗', 'tenguBlueWalk', 0.4], ['tenguRed', '赤天狗', 'tenguRedWalk', 0.4],
  ['spirit', '魂灵', 'spiritIdle', 0.62], ['demonCyclop', '恶魔眼', 'demonIdle', 0.62],
  ['flam', '炎巨灵', 'flamIdle', 0.72], ['demonCyclop2', '火独眼', 'demon2Idle', 0.72],
  ['weaver', '影织者', 'spiritIdle', 0.62, 0xb8a0ff],
];

export class Hall extends Phaser.Scene {
  constructor() { super('hall'); }

  create() {
    this.tab = 0;
    this.meta = loadSave();
    this.rows = [];
    this.modalOpen = false;
    this.modalObjs = [];
    this.modalEnter = null;
    this.trainTimer = null;
    this.trainStop = null;
    this.trainText = null;
    this.trainHits = 0;
    this.trainTotal = 0;
    this.buildBackdrop();
    this.buildHeader();
    this.buildWorldEntry();
    this.buildTabs();
    this.buildFoot();
    this.render();
    this.bindKeys();
  }

  /* ---------- 底子 ---------- */
  buildBackdrop() {
    this.add.rectangle(0, 0, S.W, S.H, 0x1a211c).setOrigin(0);
    // 花砖地面压暗，当"木屋地板"，只取包内一帧，不额外画图
    this.add.tileSprite(0, 0, S.W, S.H, 'floorDungeon', 322)
      .setOrigin(0).setTint(0x6f7a86).setAlpha(0.9);
    this.add.rectangle(0, 0, S.W, S.H, 0x000000, 0.42).setOrigin(0);
    // 顶部与底部的暗带，把内容区框出来
    this.add.rectangle(0, 0, S.W, 34, 0x0e120f, 0.85).setOrigin(0);
    this.add.rectangle(0, S.H - 22, S.W, 22, 0x0e120f, 0.85).setOrigin(0);
  }

  colW(cols, gap) { return Math.floor((S.W - 24 - gap * (cols - 1)) / cols); }

  buildHeader() {
    this.add.text(12, 9, '← 返回', {
      fontFamily: FONT, fontSize: '12px', color: UI.text.muted,
    }).setOrigin(0, 0).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.back());
    this.add.text(92, 9, '归途小屋', {
      fontFamily: FONT, fontSize: '12px', color: UI.text.heading,
    }).setOrigin(0, 0);
    this.coinIcon = this.add.image(S.W - 198, 17, 'coin', 0).setScale(1.3);
    this.coinText = this.add.text(S.W - 184, 9, '0', {
      fontFamily: FONT, fontSize: '12px', color: UI.text.gold,
    }).setOrigin(0, 0);
    this.gemIcon = this.add.image(S.W - 96, 17, 'gem', 43).setScale(1.4);
    this.gemText = this.add.text(S.W - 82, 9, '0', {
      fontFamily: FONT, fontSize: '12px', color: UI.text.info,
    }).setOrigin(0, 0);
  }

  /* G0 东门：竹林村 5 关全通后才开放；锁着也能点，给明确原因而不是静默禁用。 */
  buildWorldEntry() {
    const c = chapterById('bamboo');
    const cleared = !!c && Array.from({ length: c.stages }, (_, i) => i + 1)
      .every((i) => starsOf(this.meta, 'bamboo', i) >= 1);
    this.worldOpen = cleared;
    this.worldBtn = makeButton(this, {
      x: S.W - 104, y: 33, w: 92, h: 20,
      label: cleared ? '东门 · 远征' : '东门 · 未开放',
      variant: 'ghost', state: 'normal', depth: 1,
      onClick: () => this.enterWorld(),
    });
  }

  enterWorld() {
    try { this.sound.play('ui', { volume: 0.35 }); } catch (e) {}
    if (!this.worldOpen) {
      this.toast('竹林村 5 关全通后开放东门');
      return;
    }
    NAV.push('world');
  }

  buildTabs() {
    const gap = 104;
    const start = S.W / 2 - gap * 1.5;
    this.tabs = TABS.map((name, i) => this.add.text(start + i * gap, 44, name, {
      fontFamily: FONT, fontSize: '12px', color: UI.text.muted,
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { if (this.modalOpen) return; this.tab = i; this.render(); }));
  }

  buildFoot() {
    this.add.text(S.W / 2, S.H - 16, '1–4 / ← → 切页 · Enter 出发 · 东门远征 · ESC 返回', {
      fontFamily: FONT, fontSize: '12px', color: UI.text.foot,
    }).setOrigin(0.5, 0);
  }

  bindKeys() {
    const guard = (fn) => () => { if (!this.modalOpen) fn(); };
    this.input.keyboard.on('keydown-LEFT', guard(() => this.switchTab(-1)));
    this.input.keyboard.on('keydown-RIGHT', guard(() => this.switchTab(1)));
    ['ONE', 'TWO', 'THREE', 'FOUR'].forEach((k, i) => {
      this.input.keyboard.on('keydown-' + k, guard(() => { this.tab = i; this.render(); }));
    });
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.modalOpen && this.modalEnter) this.modalEnter();
      else if (!this.modalOpen) this.start();
    });
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.modalOpen && this.modalEnter) this.modalEnter();
      else if (!this.modalOpen) this.start();
    });
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.modalOpen) this.closeModal();
      else this.back();
    });
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (p) => {
      if (p.button === 2) {
        if (this.modalOpen) this.closeModal();
        else this.back();
      }
    });
  }

  back() {
    try { this.sound.play('ui', { volume: 0.35 }); } catch (e) {}
    if (!NAV.back()) this.scene.start('title');
  }

  switchTab(d) {
    this.tab = (this.tab + d + TABS.length) % TABS.length;
    this.render();
  }

  start() {
    try { this.sound.play('ui', { volume: 0.4 }); } catch (e) {}
    NAV.push('map');
  }

  /* ---------- 内容区 ---------- */
  render() {
    if (this.modalOpen) this.closeModal();
    if (this.body) this.body.forEach((o) => o.destroy());
    this.body = [];
    this.rows = [];
    this.meta = loadSave();
    this.gemText.setText(String(this.meta.gem || 0));
    this.coinText.setText(String(this.meta.coins || 0));
    this.tabs.forEach((t, i) => t.setColor(i === this.tab ? '#ffe9b0' : '#8fa0a8'));

    if (this.tab === 0) this.renderWeapons();
    else if (this.tab === 1) this.renderChars();
    else if (this.tab === 2) this.renderGallery();
    else this.renderHub();
  }

  keep(obj) { this.body.push(obj); return obj; }

  /* 武器页：三列两行，稀有度 + 伤害 / 攻速 / 射程 / 穿透上墙 */
  renderWeapons() {
    const list = (window.__weaponsData && window.__weaponsData.list) || [];
    const unlocked = this.meta.unlockedWeapons || [];
    const CW = this.colW(3, 8);
    const CH = 112;
    const rowH = CH + 12;
    list.slice(0, 6).forEach((w, i) => {
      const x = 12 + (i % 3) * (CW + 8);
      const y = 72 + Math.floor(i / 3) * rowH;
      const on = unlocked.indexOf(w.id) >= 0;
      const r = rarityOf(w);
      const card = makeCard(this, {
        x, y, w: CW, h: CH, accent: r.color, state: on ? 'default' : 'locked',
        onClick: () => {},
      });
      this.keep(card.container);
      this.keep(card.hit);
      card.add(this.add.image(28, 34, w.icon || 'wKatana', 0).setScale(1.4));
      card.add(makeText(this, 52, 8, w.name, 'h2', {
        color: on ? UI.text.heading : UI.text.nameLocked,
      }));
      card.add(makeText(this, CW - 10, 8, r.name, 'body', {
        color: on ? r.hex : UI.text.locked, origin: [1, 0],
      }));
      card.add(makeText(this, 52, 25, KIND_NAME[w.kind] || w.kind, 'muted', {
        color: on ? UI.text.muted : UI.text.locked,
      }));
      card.add(makeText(this, 10, 50,
        '伤×' + Number(w.dmgMul || 1).toFixed(1) + '  ' + Math.round(w.cd || 0) + 'ms',
        'body', { color: on ? UI.text.primary : UI.text.body }));
      const detail = w.kind === 'melee'
        ? ('射程 ' + Math.round(w.reach || 0) + ' · 击退 ' + Math.round(w.knock || 0))
        : ('弹速 ' + Math.round(w.projSpeed || 0) + ' · 穿透 ' + (w.pierce ? w.pierce : '—'));
      card.add(makeText(this, 10, 66, detail, 'body', {
        color: on ? UI.text.body : UI.text.body,
      }));
      const tail = makeText(this, 10, 88, on ? '已解锁 · 进掉落池' : '未解锁', 'body', {
        color: on ? UI.text.info : UI.text.danger,
      });
      card.add(tail);
      let buy = null;
      if (on) {
        card.add(makeText(this, CW - 10, 88, '权重 ' + Number(w.poolWeight || 1).toFixed(1), 'muted', {
          color: UI.text.muted, origin: [1, 0],
        }));
      } else {
        const price = priceOf(w);
        if (price > 0) {
          buy = makeButton(this, {
            x: x + CW - 108, y: y + 84, w: 98, h: 20,
            label: '解锁 ' + price + ' 宝石', variant: 'ghost', depth: 2,
            onClick: () => this.buy('weapon', w.id, price),
          });
          this.keep(buy.container);
          this.keep(buy.hit);
        } else {
          card.add(makeText(this, CW - 10, 88, '初始武器', 'muted', {
            color: UI.text.muted, origin: [1, 0],
          }));
        }
      }
      this.rows.push({ card, on, name: w.name, tail, buy });
    });
  }

  /* 角色页：数据驱动，定位 / 三属性 / 初始武器 / 技能全部上墙 */
  renderChars() {
    const list = charList();
    const unlocked = this.meta.chars || ['ninja'];
    const CW = this.colW(3, 8);
    const CH = 242;
    list.forEach((data, i) => {
      const x = 12 + i * (CW + 8);
      const y = 72;
      const on = unlocked.indexOf(data.id) >= 0;
      const r = rarityOf(data);
      const card = makeCard(this, {
        x, y, w: CW, h: CH, accent: r.color, state: on ? 'default' : 'locked',
        onClick: () => {},
      });
      this.keep(card.container);
      this.keep(card.hit);
      card.add(makeText(this, 10, 8, data.name || data.id, 'h2', {
        color: on ? UI.text.heading : UI.text.nameLocked,
      }));
      card.add(makeText(this, CW - 10, 8, r.name, 'body', {
        color: on ? r.hex : UI.text.locked, origin: [1, 0],
      }));
      card.add(this.add.image(CW / 2, 58, data.face || 'faceNinja', 0)
        .setScale(1.35).setAlpha(on ? 1 : 0.45));
      card.add(makeText(this, 10, 90, data.tag || '—', 'body', {
        color: on ? UI.text.gold : UI.text.locked,
      }));
      card.add(makeText(this, 10, 108,
        'HP ' + (data.hp || 20) + '  攻 ' + (data.dmg || 3) + '  速 ' + (data.speed || 96)
        + '\n初始 ' + (this.weaponName(data.weapon) || data.weapon || '—'),
        'body', {
          color: on ? UI.text.primary : UI.text.body,
          lineSpacing: 3, wordWrap: { width: CW - 20, useAdvancedWrap: true },
        }));
      const skill = makeText(this, 10, 146, '【' + (data.skill && data.skill.name || '技能') + '】', 'body', {
        color: on ? UI.text.info : UI.text.muted,
      });
      card.add(skill);
      const skillDesc = makeText(this, 10, 162, (data.skill && data.skill.desc) || '', 'muted', {
        color: on ? UI.text.muted : UI.text.body,
        lineSpacing: 2, wordWrap: { width: CW - 20, useAdvancedWrap: true },
      });
      card.add(skillDesc);
      card.add(makeText(this, 10, 200, '装备 护符 / 饰品', 'muted', {
        color: on ? UI.text.muted : UI.text.locked,
      }));
      let buy = null;
      if (on) {
        card.add(makeText(this, CW - 10, 220, '可选', 'body', {
          color: UI.text.info, origin: [1, 0],
        }));
      } else {
        const price = priceOf(data);
        buy = makeButton(this, {
          x: x + CW - 108, y: y + 220, w: 98, h: 20,
          label: '解锁 ' + price + ' 宝石', variant: 'ghost', depth: 2,
          onClick: () => this.buy('char', data.id, price),
        });
        this.keep(buy.container);
        this.keep(buy.hit);
      }
      this.rows.push({ card, on, name: data.name, skill, skillDesc, buy });
    });
  }

  weaponName(id) {
    const list = (window.__weaponsData && window.__weaponsData.list) || [];
    const w = list.find((x) => x.id === id);
    return w ? w.name : id;
  }

  /* 图鉴页：怪物 / Boss / 武器 / 房间四栏，未点亮显示 ??? */
  renderGallery() {
    const seen = this.meta.seen || {};
    const marks = {
      enemies: seen.enemies || {}, weapons: seen.weapons || {},
      bosses: seen.bosses || {}, rooms: seen.rooms || {},
    };
    const cols = S.W >= 560 ? 9 : 6;
    const cell = S.W >= 560 ? 40 : 36;
    const startX = 12;

    const section = (title, y, items, key, iconScale) => {
      this.keep(this.add.text(startX, y, title + '  ' + items.filter((it) => marks[key][it[0]]).length + '/' + items.length, {
        fontFamily: FONT, fontSize: '12px', color: '#ffe9b0',
      }));
      items.forEach((it, i) => {
        const cx = startX + (i % cols) * cell;
        const cy = y + 16 + Math.floor(i / cols) * cell;
        const got = !!marks[key][it[0]];
        this.keep(this.add.rectangle(cx, cy, cell - 4, cell - 4, 0x141a16, 0.9)
          .setOrigin(0).setStrokeStyle(1, got ? 0x4a5f42 : 0x2a3229));
        if (got && it[2]) {
          const icon = this.keep(this.add.image(cx + cell / 2, cy + 12, it[2], 0).setScale(it[3] || iconScale || 1.6));
          if (it[4]) icon.setTint(it[4]);
        } else if (got) this.keep(this.add.image(cx + cell / 2, cy + 12, it[0], 4).setScale(1.0));
        this.keep(this.add.text(cx + cell / 2, cy + 23, got ? it[1] : '???', {
          fontFamily: FONT, fontSize: '12px', color: got ? '#d8e8d0' : '#5f6a60',
        }).setOrigin(0.5, 0));
      });
    };

    const monsterRows = Math.ceil(FOES.length / cols);
    const bossY = 56 + 16 + monsterRows * cell;
    section('怪物', 56, FOES, 'enemies');
    section('Boss', bossY, BOSSES, 'bosses', 0.8);
    const bossRows = Math.ceil(BOSSES.length / cols);
    const wpnY = bossY + 16 + bossRows * cell;
    const wpn = ((window.__weaponsData && window.__weaponsData.list) || [])
      .map((w) => [w.id, w.name, w.icon]).slice(0, 6);
    section('武器', wpnY, wpn, 'weapons');

    // 房间事件放右侧，竖排小字，不抢网格
    const rx = startX + cols * cell + 10;
    this.keep(this.add.text(rx, 56, '房间事件', {
      fontFamily: FONT, fontSize: '12px', color: '#ffe9b0',
    }));
    Object.keys(ROOM_NAME).forEach((k, i) => {
      const got = !!marks.rooms[k];
      this.keep(this.add.text(rx, 76 + i * 18, (got ? '● ' : '○ ') + (got ? ROOM_NAME[k] : '???'), {
        fontFamily: FONT, fontSize: '12px', color: got ? '#d8e8d0' : '#5f6a60',
      }));
    });
  }

  /* ---------- 批 13：小屋四区 ---------- */
  safeTex(key, fallback) {
    return this.textures.exists(key) ? key : fallback;
  }

  renderHub() {
    const CW = this.colW(3, 8);
    const topY = 72;
    const topH = 88;
    const npcY = 176;
    const npcH = 126;
    const entries = [
      {
        id: 'depart', name: '出发台', icon: 'statue', fallback: 'statue',
        desc: '章节地图 · 星级\n支线 / 隐藏 / 条件关入口', status: 'Enter 出发',
        accent: 0x7cb342, action: () => this.start(),
      },
      {
        id: 'forge', name: '锻造坊', icon: 'forgeAnvil', fallback: 'wHammer',
        desc: '金币升级 Lv.1–3\n图纸开 Lv.4', status: '铁匠在炉边等你',
        accent: 0xffd479, action: () => this.openForge(),
      },
      {
        id: 'train', name: '训练场', icon: 'trainDummy', fallback: 'upgAtk',
        desc: '木桩 DPS · 4 秒试挥\n试武器与锻造加成', status: '按武器冷却自动试挥',
        accent: 0x9fe0ff, action: () => this.openTrain(),
      },
    ];

    entries.forEach((e, i) => {
      const x = 12 + i * (CW + 8);
      const card = makeCard(this, {
        x, y: topY, w: CW, h: topH, accent: e.accent,
        onClick: e.action,
      });
      this.keep(card.container);
      this.keep(card.hit);
      card.add(this.add.image(32, 32, this.safeTex(e.icon, e.fallback), 0)
        .setDisplaySize(48, 48));
      card.add(makeText(this, 62, 9, e.name, 'h2', { color: UI.text.heading }));
      card.add(makeText(this, 62, 26, e.status, 'muted', {
        color: UI.text.info, wordWrap: { width: CW - 70, useAdvancedWrap: true },
      }));
      card.add(makeText(this, 10, 56, e.desc, 'body', {
        color: UI.text.body, lineSpacing: 2,
        wordWrap: { width: CW - 20, useAdvancedWrap: true },
      }));
    });

    this.keep(this.add.text(12, npcY - 14, 'NPC 区 · 归途小屋的常驻住客', {
      fontFamily: FONT, fontSize: '12px', color: '#ffe9b0',
    }));

    NPCS.forEach((npc, i) => {
      const x = 12 + i * (CW + 8);
      const d = npcDialogue(npc.id, this.meta) || npc;
      const card = makeCard(this, {
        x, y: npcY, w: CW, h: npcH, accent: npc.accent,
        onClick: () => this.openNpc(npc.id),
      });
      this.keep(card.container);
      this.keep(card.hit);
      card.add(this.add.image(42, 52, this.safeTex(npc.face, 'faceNinja'), 0)
        .setDisplaySize(52, 52));
      card.add(makeText(this, 78, 12, npc.name, 'h2', { color: UI.text.heading }));
      card.add(makeText(this, 78, 30, npc.role, 'muted', {
        color: UI.text.info, wordWrap: { width: CW - 84, useAdvancedWrap: true },
      }));
      card.add(makeText(this, 10, 76, '“' + (d.lines && d.lines[0] ? d.lines[0] : '……') + '”', 'body', {
        color: UI.text.body, lineSpacing: 2,
        wordWrap: { width: CW - 20, useAdvancedWrap: true },
      }));
      card.add(makeText(this, 10, npcH - 18, '点击交谈 →', 'body', { color: UI.text.gold }));
    });
  }

  /* ---------- 批 13：弹层底座 ---------- */
  addModalText(x, y, text, role = 'body', opts = {}) {
    const t = makeText(this, x, y, text, role, opts).setDepth(520);
    this.modalObjs.push(t);
    return t;
  }

  addModalImage(x, y, key, fallback, w = 0, h = 0) {
    const img = this.add.image(x, y, this.safeTex(key, fallback), 0).setDepth(520);
    if (w && h) img.setDisplaySize(w, h);
    this.modalObjs.push(img);
    return img;
  }

  addModalButton(opts) {
    const b = makeButton(this, { ...opts, depth: 522 });
    this.modalObjs.push(b.container, b.hit);
    return b;
  }

  modalFrame({ w, h, title, subtitle = '' }) {
    this.closeModal();
    this.modalOpen = true;
    const pw = Math.min(w, S.W - 24);
    const ph = h;
    const px = Math.round((S.W - pw) / 2);
    const py = Math.round((S.H - ph) / 2 + 4);
    const dim = this.add.rectangle(0, 0, S.W, S.H, 0x000000, UI.alpha.overlay)
      .setOrigin(0).setDepth(500).setInteractive({ useHandCursor: true });
    dim.on('pointerdown', () => this.closeModal());
    this.modalObjs = [dim];
    const panel = makePanel(this, { x: px, y: py, w: pw, h: ph, variant: 'raised', depth: 510 });
    this.modalObjs.push(panel.container);
    const block = this.add.rectangle(px, py, pw, ph, 0, 0).setOrigin(0)
      .setDepth(510.2).setInteractive();
    this.modalObjs.push(block);
    this.addModalText(px + 16, py + 10, title, 'h1', { color: UI.text.heading });
    if (subtitle) this.addModalText(px + 16, py + 38, subtitle, 'muted', {
      color: UI.text.muted, wordWrap: { width: pw - 100, useAdvancedWrap: true },
    });
    this.addModalButton({
      x: px + pw - 66, y: py + 10, w: 56, h: 20, label: '关闭',
      variant: 'ghost', onClick: () => this.closeModal(),
    });
    this.modalEnter = () => this.closeModal();
    return { x: px, y: py, w: pw, h: ph };
  }

  closeModal() {
    if (this.trainTimer) { this.trainTimer.remove(); this.trainTimer = null; }
    if (this.trainStop) { this.trainStop.remove(); this.trainStop = null; }
    if (this.modalObjs) {
      this.modalObjs.forEach((o) => { try { if (o && o.destroy) o.destroy(); } catch (e) {} });
    }
    this.modalObjs = [];
    this.modalOpen = false;
    this.modalEnter = null;
    this.trainText = null;
    this.trainHits = 0;
    this.trainTotal = 0;
  }

  /* ---------- 批 13：锻造坊 ---------- */
  forgeWeaponName(id) {
    return this.weaponName(id) || id;
  }

  openForge() {
    const pw = Math.min(600, S.W - 24);
    const f = this.modalFrame({
      w: pw, h: 250, title: '锻造坊',
      subtitle: '金币升级武器，普通锻造 Lv.3 封顶；支线图纸解锁 Lv.4',
    });
    const meta = loadSave();
    this.meta = meta;
    this.coinText.setText(String(meta.coins || 0));
    this.addModalText(f.x + f.w - 180, f.y + 40, '金币 ' + (meta.coins || 0), 'gold', {
      color: UI.text.gold, origin: [1, 0], wordWrap: { width: 160, useAdvancedWrap: true },
    });
    const weapons = ((window.__weaponsData && window.__weaponsData.list) || []);
    const unlocked = meta.unlockedWeapons || [];
    const cols = 3;
    const gap = 8;
    const cw = Math.floor((f.w - 24 - gap * (cols - 1)) / cols);
    const ch = 86;
    const y0 = f.y + 60;

    weapons.slice(0, 6).forEach((w, i) => {
      const x = f.x + 12 + (i % cols) * (cw + gap);
      const y = y0 + Math.floor(i / cols) * (ch + 8);
      const lv = forgeLevel(meta, w.id);
      const next = forgeNext(meta, w.id);
      const on = unlocked.indexOf(w.id) >= 0;
      const card = makeCard(this, {
        x, y, w: cw, h: ch, accent: on ? UI.color.gold : UI.color.neutral,
        state: on ? 'default' : 'locked', depth: 511,
      });
      this.modalObjs.push(card.container, card.hit);
      card.add(this.add.image(28, 30, w.icon || 'wKatana', 0).setDisplaySize(36, 36));
      card.add(makeText(this, 50, 8, w.name, 'h2', {
        color: on ? UI.text.heading : UI.text.nameLocked,
      }));
      card.add(makeText(this, cw - 8, 8, 'Lv.' + lv, 'body', {
        color: on ? UI.text.gold : UI.text.locked, origin: [1, 0],
      }));
      card.add(makeText(this, 50, 26, on ? '伤害 +' + forgeBonus(lv) + '%' : '未解锁', 'body', {
        color: on ? UI.text.info : UI.text.locked,
      }));
      if (!on) {
        card.add(makeText(this, 10, 60, '先去武器页解锁', 'muted', { color: UI.text.locked }));
      } else if (!next) {
        card.add(makeText(this, 10, 60, '已到 Lv.4 · 星火', 'body', { color: UI.text.info }));
      } else {
        const blueprintLocked = !!next.blueprint && !hasBlueprint(meta, w.id);
        const label = blueprintLocked
          ? '图纸未获得'
          : '升级 ' + next.label + ' · ' + next.cost;
        const btn = this.addModalButton({
          x: x + 10, y: y + 62, w: cw - 20, h: 20, label,
          variant: 'ghost', state: blueprintLocked ? 'disabled' : 'normal',
          onClick: () => this.upgradeForge(w.id),
        });
        card.add(makeText(this, 10, 46,
          blueprintLocked ? '支线图纸' : next.name,
          'muted', { color: on ? UI.text.muted : UI.text.locked }));
        btn.setVisible(true);
      }
    });
  }

  upgradeForge(id) {
    const meta = loadSave();
    const lv = forgeLevel(meta, id);
    const next = forgeNext(meta, id);
    if (!next) { this.toast('这把武器已经满级'); return; }
    if (next.blueprint && !hasBlueprint(meta, id)) {
      this.toast('需要支线图纸才能开 Lv.4');
      return;
    }
    if ((meta.unlockedWeapons || []).indexOf(id) < 0) {
      this.toast('先解锁这把武器');
      return;
    }
    if ((meta.coins || 0) < next.cost) {
      this.toast('金币不够：还差 ' + (next.cost - (meta.coins || 0)));
      return;
    }
    const forge = { ...(meta.forge || {}), [id]: lv + 1 };
    this.meta = patchSave({ coins: (meta.coins || 0) - next.cost, forge });
    this.coinText.setText(String(this.meta.coins || 0));
    try { this.sound.play('bonus', { volume: 0.7 }); } catch (e) {}
    this.toast(this.forgeWeaponName(id) + ' → Lv.' + (lv + 1));
    this.openForge();
  }

  /* ---------- 批 13：训练场 ---------- */
  openTrain() {
    const f = this.modalFrame({
      w: Math.min(600, S.W - 24), h: 230, title: '训练场',
      subtitle: '木桩无限血；按武器冷却自动试挥 4 秒，读出基准 DPS',
    });
    const meta = loadSave();
    const weapons = ((window.__weaponsData && window.__weaponsData.list) || []);
    const unlocked = meta.unlockedWeapons || [];
    const list = weapons.filter((w) => unlocked.indexOf(w.id) >= 0);
    if (!list.length) return;
    if (!list.some((w) => w.id === this.trainPick)) this.trainPick = list[0].id;
    const picked = list.find((w) => w.id === this.trainPick) || list[0];

    this.addModalImage(f.x + 62, f.y + 112, 'trainDummy', 'upgAtk', 72, 72);
    this.addModalText(f.x + 24, f.y + 158, '木桩 · 无限 HP', 'gold', { color: UI.text.gold });
    this.addModalText(f.x + 24, f.y + 178, '基准角色伤害 × 武器倍率 × 锻造', 'muted', {
      color: UI.text.muted, wordWrap: { width: 100, useAdvancedWrap: true },
    });

    const bx = f.x + 142;
    const by = f.y + 58;
    const bw = 130;
    list.slice(0, 6).forEach((w, i) => {
      const x = bx + (i % 2) * (bw + 8);
      const y = by + Math.floor(i / 2) * 30;
      this.addModalButton({
        x, y, w: bw, h: 24,
        label: (w.id === picked.id ? '● ' : '') + w.name,
        variant: 'ghost',
        onClick: () => { this.trainPick = w.id; this.openTrain(); },
      });
    });

    this.trainText = this.addModalText(bx, f.y + 164, '选一把武器，点“开始试挥”', 'body', {
      color: UI.text.body, wordWrap: { width: f.w - 158, useAdvancedWrap: true },
    });
    this.addModalButton({
      x: bx, y: f.y + 190, w: 160, h: 24,
      label: '开始 4 秒试挥', variant: 'ghost',
      onClick: () => this.startTrain(picked),
    });
    const lv = forgeLevel(meta, picked.id);
    this.addModalText(bx + 174, f.y + 194, picked.name + ' · Lv.' + lv, 'muted', {
      color: UI.text.muted, wordWrap: { width: f.w - 330, useAdvancedWrap: true },
    });
  }

  startTrain(weapon) {
    if (!weapon) return;
    const meta = loadSave();
    const dmg = Math.round(CFG.playerDmg * weapon.dmgMul * forgeMul(meta, weapon.id));
    const cd = Math.max(120, Math.round(weapon.cd));
    if (this.trainTimer) { this.trainTimer.remove(); this.trainTimer = null; }
    if (this.trainStop) { this.trainStop.remove(); this.trainStop = null; }
    this.trainHits = 0;
    this.trainTotal = 0;
    this.trainExpected = Math.max(1, Math.floor(4000 / cd));
    this.trainText.setText('试挥中… ' + weapon.name + ' · 每 ' + cd + 'ms 一击');
    this.trainTimer = this.time.addEvent({
      delay: cd, loop: true, callback: () => {
        if (!this.trainText) return;
        this.trainHits += 1;
        this.trainTotal += dmg;
        if (this.trainHits >= this.trainExpected) {
          this.finishTrain();
          return;
        }
        this.trainText.setText('试挥中 · ' + this.trainHits + ' 击 · 总伤 ' + this.trainTotal);
      },
    });
  }

  finishTrain() {
    if (this.trainTimer) { this.trainTimer.remove(); this.trainTimer = null; }
    if (this.trainStop) { this.trainStop.remove(); this.trainStop = null; }
    if (!this.trainText) return;
    const dps = this.trainTotal / 4;
    this.trainText.setText('4.0s · ' + this.trainHits + ' 击 · 总伤 ' + this.trainTotal
      + ' · DPS ' + dps.toFixed(1));
    try { this.sound.play('bonus', { volume: 0.45 }); } catch (e) {}
  }

  /* ---------- 批 13：NPC 对话 ---------- */
  openNpc(id) {
    const d = npcDialogue(id, loadSave());
    if (!d) return;
    const f = this.modalFrame({
      w: Math.min(560, S.W - 24), h: 200, title: d.name,
      subtitle: d.role + ' · ESC / 右键关闭',
    });
    this.addModalImage(f.x + 54, f.y + 112, d.face, 'faceNinja', 72, 72);
    this.addModalText(f.x + 102, f.y + 64, d.lines.join('\n'), 'body', {
      color: UI.text.body, lineSpacing: 6,
      wordWrap: { width: f.w - 130, useAdvancedWrap: true },
    });
    this.addModalButton({
      x: f.x + f.w - 146, y: f.y + f.h - 34, w: 130, h: 24,
      label: '结束交谈', variant: 'ghost', onClick: () => this.closeModal(),
    });
  }

  /* ---------- 解锁 ---------- */
  buy(kind, id, price) {
    this.meta = loadSave();
    if ((this.meta.gem || 0) < price) {
      this.toast('宝石不够：还差 ' + (price - this.meta.gem));
      return;
    }
    if (kind === 'weapon') {
      const list = (this.meta.unlockedWeapons || []).slice();
      if (list.indexOf(id) < 0) list.push(id);
      this.meta = patchSave({ gem: this.meta.gem - price, unlockedWeapons: list });
    } else {
      const list = (this.meta.chars || []).slice();
      if (list.indexOf(id) < 0) list.push(id);
      this.meta = patchSave({ gem: this.meta.gem - price, chars: list });
    }
    try { this.sound.play('bonus', { volume: 0.7 }); } catch (e) {}
    this.render();
  }

  toast(msg) {
    if (this.toastT) this.toastT.destroy();
    this.toastT = this.add.text(S.W / 2, S.H - 44, msg, {
      fontFamily: FONT, fontSize: '12px', color: '#ffb0a0', backgroundColor: '#000000aa',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5, 0).setDepth(900);
    this.time.delayedCall(1600, () => { if (this.toastT) { this.toastT.destroy(); this.toastT = null; } });
  }
}
