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
import { FONT, S, TILE } from '../core/config.js';
import { loadSave, patchSave } from '../systems/save.js';

const TABS = ['武器', '角色', '图鉴'];
const PRICE = { bow: 15, hammer: 20, mage: 30, knight: 40 };
const CHARS = ['ninja', 'mage', 'knight'];
const CHAR_NAME = { ninja: '忍者', mage: '法师', knight: '骑士' };
const CHAR_FACE = { ninja: 'faceNinja', mage: 'faceMage', knight: 'faceKnight' };
const KIND_NAME = { melee: '近战', ranged: '远程', throw: '投掷' };
const ROOM_NAME = {
  battle: '战场', elite: '精英', treasure: '宝箱', shop: '商店',
  shrine: '石龛', rest: '篝火', gate: '机关', boss: '首领',
};
/* 图鉴里要列的东西：怪用图集里的 kind 键（首帧当头像），Boss 用两只专用贴图 */
const FOES = [
  ['beast', '野兽'], ['cyclope', '独眼'], ['eye', '眼球'], ['larva', '幼虫'],
  ['slime', '史莱姆'], ['spider', '蜘蛛'], ['owl', '夜枭'], ['mush', '毒菇'],
  ['mole', '鼹鼠'], ['skull', '骷髅'], ['racoon', '浣熊'],
];
const BOSSES = [
  ['frog', '青蛙大王', 'boss', 1.4], ['racoon', '巨浣熊', 'racoonIdle', 1.0],
  ['samurai', '蓝武士', 'samIdle', 0.5], ['samuraiRed', '赤武士', 'rsamIdle', 0.5],
];

export class Hall extends Phaser.Scene {
  constructor() { super('hall'); }

  create() {
    this.tab = 0;
    this.meta = loadSave();
    this.rows = [];
    this.buildBackdrop();
    this.buildHeader();
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
    this.add.text(12, 9, '归途小屋', {
      fontFamily: FONT, fontSize: '12px', color: '#ffe9b0',
    }).setOrigin(0, 0);
    this.gemIcon = this.add.image(S.W - 96, 17, 'gem', 43).setScale(1.4);
    this.gemText = this.add.text(S.W - 82, 9, '0', {
      fontFamily: FONT, fontSize: '12px', color: '#9fe0ff',
    }).setOrigin(0, 0);
  }

  buildTabs() {
    this.tabs = TABS.map((name, i) => this.add.text(S.W / 2 - 120 + i * 120, 44, name, {
      fontFamily: FONT, fontSize: '12px', color: '#8fa0a8',
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { this.tab = i; this.render(); }));
  }

  buildFoot() {
    this.add.text(S.W / 2, S.H - 16, '1/2/3 或 ← → 切页 · 点击条目解锁 · Enter / 空格 出发（选关）', {
      fontFamily: FONT, fontSize: '12px', color: '#c8d8c0',
    }).setOrigin(0.5, 0);
  }

  bindKeys() {
    this.input.keyboard.on('keydown-LEFT', () => this.switchTab(-1));
    this.input.keyboard.on('keydown-RIGHT', () => this.switchTab(1));
    ['ONE', 'TWO', 'THREE'].forEach((k, i) => {
      this.input.keyboard.on('keydown-' + k, () => { this.tab = i; this.render(); });
    });
    this.input.keyboard.on('keydown-ENTER', () => this.start());
    this.input.keyboard.on('keydown-SPACE', () => this.start());
  }

  switchTab(d) {
    this.tab = (this.tab + d + TABS.length) % TABS.length;
    this.render();
  }

  start() {
    try { this.sound.play('ui', { volume: 0.4 }); } catch (e) {}
    this.scene.start('map');
  }

  /* ---------- 内容区 ---------- */
  render() {
    if (this.body) this.body.forEach((o) => o.destroy());
    this.body = [];
    this.rows = [];
    this.meta = loadSave();
    this.gemText.setText(String(this.meta.gem || 0));
    this.tabs.forEach((t, i) => t.setColor(i === this.tab ? '#ffe9b0' : '#8fa0a8'));

    if (this.tab === 0) this.renderWeapons();
    else if (this.tab === 1) this.renderChars();
    else this.renderGallery();
  }

  keep(obj) { this.body.push(obj); return obj; }

  /* 武器页：三列两行（逻辑屏 640×360 下每格约 200×108） */
  renderWeapons() {
    const list = (window.__weaponsData && window.__weaponsData.list) || [];
    const unlocked = this.meta.unlockedWeapons || [];
    const CW = this.colW(3, 8);
    const CH = 108;
    const rowH = 122;
    list.slice(0, 6).forEach((w, i) => {
      const x = 12 + (i % 3) * (CW + 8);
      const y = 72 + Math.floor(i / 3) * rowH;
      const on = unlocked.indexOf(w.id) >= 0;
      const box = this.keep(this.add.rectangle(x, y, CW, CH, on ? 0x1f2a20 : 0x1b211d, 0.92)
        .setOrigin(0).setStrokeStyle(2, on ? 0x4a5f42 : 0x39423a));
      this.keep(this.add.image(x + 30, y + 34, w.icon || 'wKatana', 0).setScale(1.5));
      this.keep(this.add.text(x + 54, y + 12, w.name, {
        fontFamily: FONT, fontSize: '12px', color: on ? '#ffffff' : '#a8b0a4',
      }));
      this.keep(this.add.text(x + 54, y + 32, KIND_NAME[w.kind] || w.kind, {
        fontFamily: FONT, fontSize: '12px', color: '#8fa0a8',
      }));
      const tail = this.keep(this.add.text(x + 10, y + 58, on ? '已解锁 · 进掉落池' : '未解锁', {
        fontFamily: FONT, fontSize: '12px', color: on ? '#9fe0ff' : '#ffb0a0',
      }));
      if (!on) {
        const price = PRICE[w.id] || 15;
        const btn = this.keep(this.add.text(x + 10, y + 82, '解锁 ' + price + ' 宝石', {
          fontFamily: FONT, fontSize: '12px', color: this.meta.gem >= price ? '#9fe0ff' : '#8a7a70',
        }).setInteractive({ useHandCursor: true }));
        btn.on('pointerdown', () => this.buy('weapon', w.id, price));
      } else {
        this.keep(this.add.text(x + 10, y + 82, '本局会掉这把', {
          fontFamily: FONT, fontSize: '12px', color: '#7f8f86',
        }));
      }
      this.rows.push({ box, on, name: w.name, tail });
    });
  }

  /* 角色页：三张卡 */
  renderChars() {
    const list = Array.isArray(window.__charsData) ? window.__charsData
      : ((window.__charsData && window.__charsData.list) || []);
    const unlocked = this.meta.chars || ['ninja'];
    const CW = this.colW(3, 8);
    CHARS.forEach((id, i) => {
      const x = 12 + i * (CW + 8);
      const y = 72;
      const on = unlocked.indexOf(id) >= 0;
      const data = list.find((c) => c.id === id) || {};
      const box = this.keep(this.add.rectangle(x, y, CW, 240, on ? 0x1f2a20 : 0x1b211d, 0.92)
        .setOrigin(0).setStrokeStyle(2, on ? 0x4a5f42 : 0x39423a));
      this.keep(this.add.image(x + CW / 2, y + 62, CHAR_FACE[id], 0).setScale(1.5).setAlpha(on ? 1 : 0.45));
      this.keep(this.add.text(x + CW / 2, y + 10, CHAR_NAME[id], {
        fontFamily: FONT, fontSize: '12px', color: on ? '#ffffff' : '#a8b0a4',
      }).setOrigin(0.5, 0));
      const desc = this.keep(this.add.text(x + 10, y + 108,
        'HP ' + (data.hp || 20) + '  攻 ' + (data.dmg || 3) + '  速 ' + (data.speed || 96)
        + '\n' + (on ? '可选' : '需 ' + (PRICE[id] || 30) + ' 宝石解锁'), {
        fontFamily: FONT, fontSize: '12px', color: on ? '#d8e8d0' : '#c8b0a0',
        lineSpacing: 4, wordWrap: { width: CW - 20, useAdvancedWrap: true },
      }));
      if (!on) {
        const price = PRICE[id] || 30;
        const btn = this.keep(this.add.text(x + CW / 2, y + 200, '解锁 ' + price + ' 宝石', {
          fontFamily: FONT, fontSize: '12px', color: this.meta.gem >= price ? '#9fe0ff' : '#8a7a70',
        }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true }));
        btn.on('pointerdown', () => this.buy('char', id, price));
      }
      this.rows.push({ box, on, name: CHAR_NAME[id], tail: desc });
    });
  }

  /* 图鉴页：怪物 / Boss / 武器 / 房间四栏，未点亮显示 ??? */
  renderGallery() {
    const seen = this.meta.seen || {};
    const marks = {
      enemies: seen.enemies || {}, weapons: seen.weapons || {},
      bosses: seen.bosses || {}, rooms: seen.rooms || {},
    };
    const cols = 6;
    const cell = 44;
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
        if (got && it[2]) this.keep(this.add.image(cx + 20, cy + 13, it[2], 0).setScale(it[3] || iconScale || 1.6));
        else if (got) this.keep(this.add.image(cx + 20, cy + 13, it[0], 4).setScale(1.2));
        this.keep(this.add.text(cx + 20, cy + 26, got ? it[1] : '???', {
          fontFamily: FONT, fontSize: '12px', color: got ? '#d8e8d0' : '#5f6a60',
        }).setOrigin(0.5, 0));
      });
    };

    section('怪物', 56, FOES, 'enemies');
    section('Boss', 162, BOSSES, 'bosses', 0.8);
    const wpn = ((window.__weaponsData && window.__weaponsData.list) || [])
      .map((w) => [w.id, w.name, w.icon]).slice(0, 6);
    section('武器', 226, wpn, 'weapons');

    // 房间事件放右下角，竖排小字，不抢网格
    const rx = startX + cols * cell + 16;
    this.keep(this.add.text(rx, 162, '房间事件', {
      fontFamily: FONT, fontSize: '12px', color: '#ffe9b0',
    }));
    Object.keys(ROOM_NAME).forEach((k, i) => {
      const got = !!marks.rooms[k];
      this.keep(this.add.text(rx, 182 + i * 18, (got ? '● ' : '○ ') + (got ? ROOM_NAME[k] : '???'), {
        fontFamily: FONT, fontSize: '12px', color: got ? '#d8e8d0' : '#5f6a60',
      }));
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
