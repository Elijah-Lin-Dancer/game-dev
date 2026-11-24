/* G2 开放世界：草原 / 竹林 / 沙漠群系，18 屏 30×17
 *
 * 设计边界：
 *   - 单屏 480×272（30×17 格 ×16px），镜头仍是 640×360，能看到相邻屏边缘；
 *   - 四种地表群系共用同一套走 / 采 / 谈 / 打动词，任务、资源和 HUD 按群系配置；
 *   - 世界 Boss 仍只在 field-6，任务不跨群系记账；
 *   - 仍只写 na.world，不碰主线 na.save。
 */
import { S, VEC, ANGLE } from '../core/config.js';
import { loadSave } from '../systems/save.js';
import { NAV } from '../systems/nav.js';
import { loadWorldSave, patchWorldSave } from '../systems/worldSave.js';
import { UI } from '../systems/ui/tokens.js';
import { makePanel, makeCard, makeText } from '../systems/ui/primitives.js';

/* G0 的 640×360 是“镜头尺寸”；单屏改为 30×17 格的 480×272，镜头仍按 S 尺寸。 */
const SCREEN_W = 480;
const SCREEN_H = 272;
const WORLD_Y = Math.max(32, Math.round((S.H - SCREEN_H) / 2));
const VIEW_W = S.W;
const VIEW_H = S.H;
const SPEED = 78;
const PLAYER_MAX_HP = 20;
const GATHER_MS = 2000;
const RESPAWN_MS = 90000;
const ATTACK_CD = 320;
const ATTACK_RANGE = 62;
const ATTACK_DMG = 3;
const IFRAME = 700;
const QUEST_LABEL = { none: '未接委托', active: '采集', done: '委托完成' };

const TINT = { field: UI.world.field, bamboo: UI.world.bamboo, desert: UI.world.desert, snow: UI.world.snow };

/* 尺寸基线：玩家 16×16 源帧 ×2 = 32px 高。所有摆件按“可见像素高度”对齐：
 * 树 / 门 / 祠 >= 2.5 个玩家，灌木 / 采集物 <= 1.3 个玩家，NPC 约 1.0–1.2 个玩家。
 * 这里的倍率只修正素材库与 3D 件的画布留白，p.scale 仍保留逐屏变化。 */
const PLAYER_H = 32;
const PROP_SCALE = {
  tree: 1.8, bush: 0.9, bamboo: 1.1, bambooGate: 1.0, desertArch: 1.0,
  desertDeadTree: 1.35, desertPalm: 1.5, campfire: 1.3,
  snowPine: 1.0, snowShrine: 1.1, snowLantern: 1.3,
  volcanoSpire: 1.5, volcanoVent: 1.0,
};

/* 群系任务配置：数据键、存档键、HUD 文案、NPC 素材都在这里对齐。
 * 不再用 bamboo 单布尔分派；沙漠和后续雪原 / 火山复用同一结构。 */
const QUEST_PROFILE = {
  field: {
    biome: 'field', questDef: 'quest', questSave: 'quest', herbSave: 'herbs',
    item: '草药', unit: '株', npcAsset: 'villager2', npcScale: 2, glowTint: UI.world.herbGold,
    glowScale: 1.1, labelY: 44, promptY: 58,
    readyHint: '草药够了 · 去找村医阿杏交付',
    respawn: '一丛草药重新长成了',
  },
  bamboo: {
    biome: 'bamboo', questDef: 'bambooQuest', questSave: 'bambooQuest', herbSave: 'bambooHerbs',
    item: '雾竹', unit: '株', npcAsset: 'bambooHermit', npcScale: 0.9, glowTint: UI.world.herb,
    glowScale: 1.1, labelY: 46, promptY: 60,
    readyHint: '雾竹够了 · 去找竹隐交付',
    respawn: '一丛雾竹重新长成了',
  },
  desert: {
    biome: 'desert', questDef: 'desertQuest', questSave: 'desertQuest', herbSave: 'desertHerbs',
    item: '沙枣', unit: '颗', npcAsset: 'desertNomad', npcScale: 0.95, glowTint: UI.world.herbGold,
    glowScale: 1.1, labelY: 46, promptY: 60,
    readyHint: '沙枣够了 · 去找沙婆阿砾交付',
    respawn: '一丛沙枣重新长成了',
  },
  snow: {
    biome: 'snow', questDef: 'snowQuest', questSave: 'snowQuest', herbSave: 'snowHerbs',
    item: '雪灯', unit: '盏', npcAsset: 'snowKeeper', npcScale: 0.9, glowTint: UI.world.snowLight,
    glowScale: 1.1, labelY: 46, promptY: 60,
    readyHint: '雪灯够了 · 去雪祠找阿霁交付',
    respawn: '一盏雪灯草重新亮了',
  },
};

function profileFor(biome) { return QUEST_PROFILE[biome] || QUEST_PROFILE.field; }
function profileForNpc(npc) { return QUEST_PROFILE[npc && npc.quest] || QUEST_PROFILE.field; }

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function mixColor(a, b, t) {
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  return ((Math.round(ar + (br - ar) * t) << 16)
    | (Math.round(ag + (bg - ag) * t) << 8)
    | Math.round(ab + (bb - ab) * t));
}

function hudText(scene, x, y, text, role = 'body', opts = {}) {
  const { depth = 800, background = UI.hud.bg, padding = { x: 6, y: 4 }, ...style } = opts;
  const t = makeText(scene, x, y, text, role, {
    ...style,
    ...(background ? { backgroundColor: background, padding } : {}),
  });
  return t.setScrollFactor(0).setDepth(depth);
}

function screenPanel(scene, opts) {
  const p = makePanel(scene, opts);
  p.container.setScrollFactor(0);
  return p;
}

function destroyRow(row) {
  if (!row) return;
  if (row.card) { row.card.container.destroy(); row.card.hit.destroy(); return; }
  row.destroy();
}

function asNumber(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function normalizeRect(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const x = asNumber(raw.x, 0);
  const y = asNumber(raw.y, 0);
  const w = asNumber(raw.w, 0);
  const h = asNumber(raw.h, 0);
  if (w <= 0 || h <= 0) return null;
  return { x, y, w, h, ramp: Array.isArray(raw.ramp) ? raw.ramp : null };
}

function normalizeProps(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter((p) => Array.isArray(p) && p.length >= 3).map((p) => ({
    kind: String(p[0]),
    x: asNumber(p[1], 0),
    y: asNumber(p[2], 0),
    scale: Math.max(0.5, asNumber(p[3], 1)),
  }));
}

function normalizeWorld(raw) {
  const src = raw && Array.isArray(raw.screens) ? raw.screens : [];
  const screens = src.filter((s) => s && s.id).map((s, i) => ({
    id: String(s.id),
    name: String(s.name || s.id),
    short: String(s.short || s.name || s.id),
    biome: String(s.biome || 'field'),
    weather: String(s.weather || 'clear'),
    weatherName: String(s.weatherName || '晴'),
    deco: Array.isArray(s.deco) ? s.deco : [],
    props: normalizeProps(s.props),
    herbs: Array.isArray(s.herbs) ? s.herbs.filter((h) => Array.isArray(h) && h.length >= 2) : [],
    npc: s.npc || null,
    plateau: normalizeRect(s.plateau),
    cave: normalizeRect(s.cave),
    x: i * SCREEN_W,
  }));
  const q = raw && raw.quest ? raw.quest : {};
  const bq = raw && raw.bambooQuest ? raw.bambooQuest : {};
  const dq = raw && raw.desertQuest ? raw.desertQuest : {};
  const sq = raw && raw.snowQuest ? raw.snowQuest : {};
  const bossRaw = raw && raw.boss ? raw.boss : null;
  return {
    screens,
    quest: {
      id: String(q.id || 'herb5'),
      name: String(q.name || '草药五株'),
      need: Math.max(1, Math.round(asNumber(q.need, 5))),
      yield: Math.max(1, Math.round(asNumber(q.yield, 2))),
      rewardTokens: Math.max(0, Math.round(asNumber(q.rewardTokens, 1))),
    },
    bambooQuest: {
      id: String(bq.id || 'bamboo4'),
      name: String(bq.name || '雾竹三味'),
      need: Math.max(1, Math.round(asNumber(bq.need, 4))),
      yield: Math.max(1, Math.round(asNumber(bq.yield, 2))),
      rewardTokens: Math.max(0, Math.round(asNumber(bq.rewardTokens, 2))),
    },
    desertQuest: {
      id: String(dq.id || 'desert5'),
      name: String(dq.name || '沙海拾味'),
      need: Math.max(1, Math.round(asNumber(dq.need, 5))),
      yield: Math.max(1, Math.round(asNumber(dq.yield, 2))),
      rewardTokens: Math.max(0, Math.round(asNumber(dq.rewardTokens, 2))),
    },
    snowQuest: {
      id: String(sq.id || 'snow5'),
      name: String(sq.name || '雪灯五盏'),
      need: Math.max(1, Math.round(asNumber(sq.need, 5))),
      yield: Math.max(1, Math.round(asNumber(sq.yield, 2))),
      rewardTokens: Math.max(0, Math.round(asNumber(sq.rewardTokens, 2))),
    },
    boss: bossRaw ? {
      id: String(bossRaw.id || 'racoon'),
      name: String(bossRaw.name || '苔背巨兽'),
      screen: String(bossRaw.screen || 'field-6'),
      x: asNumber(bossRaw.x, 240),
      y: asNumber(bossRaw.y, 190),
      hp: Math.max(1, Math.round(asNumber(bossRaw.hp, 56))),
      dmg: Math.max(1, Math.round(asNumber(bossRaw.dmg, 4))),
      rewardTokens: Math.max(0, Math.round(asNumber(bossRaw.rewardTokens, 3))),
    } : null,
  };
}

export class World extends Phaser.Scene {
  constructor() { super('world'); }

  create() {
    this.main = loadSave();
    this.charId = ['ninja', 'mage', 'knight'].includes(this.main.lastChar) ? this.main.lastChar : 'ninja';
    this.world = normalizeWorld(window.__worldData);
    this.save = loadWorldSave();
    this.screens = this.world.screens;
    this.worldWidth = this.screens.length * SCREEN_W;
    this.blockers = [];
    this.screenIndex = -1;
    this.screenId = '';
    this.layer = 'surface';
    this.weather = 'clear';
    this.hp = PLAYER_MAX_HP;
    this.maxHp = PLAYER_MAX_HP;
    this.iframe = 0;
    this.lastHurtAt = -9999;
    this.atkAt = -9999;
    this.face = 'down';
    this.talking = false;
    this.talk = null;
    this.panelOpen = false;
    this.panel = null;
    this.modal = null;
    this.victory = false;
    this.dead = false;
    this.boss = null;
    this.bossActive = false;
    this.bossDead = false;
    this.bossSpawn = null;
    this.arenaLine = null;
    this.attackBtn = null;
    this.attackT = null;
    this.pointerTarget = null;
    this.herbs = [];
    this.gathering = null;
    this.npc = null;
    this.npcs = [];

    if (!this.screens.length) {
      this.add.text(VIEW_W / 2, VIEW_H / 2, 'world.json 缺失', {
        fontFamily: UI.font, fontSize: '12px', color: UI.text.danger,
      }).setOrigin(0.5);
      return;
    }

    this.buildBackdrop();
    this.buildGround();
    this.buildTerrain();
    this.buildNPC();
    this.buildHerbs();
    this.buildPlayer();
    this.buildWeather();
    this.buildHud();
    this.bindInput();

    this.cameras.main.setBounds(0, 0, this.worldWidth, VIEW_H);
    // 0.1/帧 在 60fps 下约 0.45s 收敛；镜头可以同时看到两屏边缘。
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBackgroundColor('#0d1017');
    this.cameras.main.setRoundPixels(true);
    this.applyScreen(0, true);
    this.updateLayer(true);
    this.updateHud();

    if (location.search.indexOf('debug') >= 0) window.__world = this;
  }

  /* ---------- 世界底图 ---------- */
  buildBackdrop() {
    this.add.rectangle(0, 0, this.worldWidth, VIEW_H, UI.world.backdrop)
      .setOrigin(0).setDepth(-3);
    // 上下留出窄条：上边给 HUD，下边给生命 / Boss 血条和操作提示。
    this.add.rectangle(0, 0, this.worldWidth, WORLD_Y, 0x1d2a1f)
      .setOrigin(0).setDepth(-2);
    this.add.rectangle(0, WORLD_Y + SCREEN_H, this.worldWidth, VIEW_H - WORLD_Y - SCREEN_H, 0x0b120d)
      .setOrigin(0).setDepth(-2);
  }

  makeSeamTexture() {
    if (this.textures.exists('__worldSeamG1')) return;
    const cv = document.createElement('canvas');
    cv.width = 96;
    cv.height = 1;
    const ctx = cv.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 96, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.75)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 96, 1);
    this.textures.addCanvas('__worldSeamG1', cv);
  }

  buildGround() {
    this.makeSeamTexture();
    // 先铺一层整块底色，填掉 16px 图块在 480px 屏边界留下的透明缝。
    this.add.rectangle(0, WORLD_Y, this.worldWidth, SCREEN_H, UI.world.backdrop)
      .setOrigin(0).setDepth(-0.5);
    this.screens.forEach((s) => {
      const tint = TINT[s.biome] || TINT.field;
      const ground = s.biome === 'desert' ? 'desertTile' : (s.biome === 'snow' ? 'snowTile' : 'field');
      const groundFrame = (s.biome === 'desert' || s.biome === 'snow') ? 0 : 21;
      const whiteGround = s.biome === 'desert' || s.biome === 'snow';
      this.add.rectangle(s.x, WORLD_Y, SCREEN_W, SCREEN_H, tint, 1)
        .setOrigin(0).setDepth(-0.4);
      this.add.tileSprite(s.x, WORLD_Y, SCREEN_W, SCREEN_H, ground, groundFrame)
        .setOrigin(0).setTint(whiteGround ? 0xffffff : tint).setDepth(0);
      this.add.rectangle(s.x, WORLD_Y, SCREEN_W, SCREEN_H, 0x0a120c, s.biome === 'snow' ? 0.035 : (s.biome === 'desert' ? 0.10 : 0.07))
        .setOrigin(0).setDepth(1);
      this.add.rectangle(s.x, WORLD_Y, SCREEN_W, 3, s.biome === 'snow' ? UI.world.snowLight : (s.biome === 'desert' ? 0xe5c37d : UI.world.fieldLight), s.biome === 'snow' ? 0.32 : (s.biome === 'desert' ? 0.20 : 0.16))
        .setOrigin(0).setDepth(1.4);
      s.deco.forEach((d) => {
        const [dx, dy, frame = 0, scale = 1] = d;
        this.add.image(s.x + dx, WORLD_Y + dy, 'floorDetail', frame)
          .setScale(scale).setAlpha(s.biome === 'snow' ? 0.28 : (s.biome === 'desert' ? 0.32 : 0.42)).setTint(tint).setDepth(2);
      });
      if (s.biome === 'field') {
        const beam = this.add.image(s.x + 330, WORLD_Y + 20, 'ray', 0)
          .setOrigin(0.5, 0).setScale(1.2, 1.7).setRotation(0.16)
          .setAlpha(0.06).setTint(0xd8f0c8).setBlendMode(Phaser.BlendModes.ADD).setDepth(3);
        this.tweens.add({ targets: beam, alpha: 0.03, duration: 1800, yoyo: true, repeat: -1 });
      }
      if (s.biome === 'desert') {
        const dune = this.add.ellipse(s.x + 238, WORLD_Y + 254, 300, 34, 0xdfbf82, 0.12)
          .setOrigin(0.5, 0.5).setDepth(2.4);
        dune.setBlendMode(Phaser.BlendModes.ADD);
      }
      if (s.biome === 'snow') {
        this.add.ellipse(s.x + 238, WORLD_Y + 250, 316, 36, UI.world.snowLight, 0.10)
          .setOrigin(0.5, 0.5).setDepth(2.3);
        this.add.ellipse(s.x + 118, WORLD_Y + 210, 160, 22, UI.world.snowDark, 0.08)
          .setOrigin(0.5, 0.5).setDepth(2.35);
      }
      this.add.text(s.x + 16, WORLD_Y + 12, s.name, {
        fontFamily: UI.font, fontSize: '12px', color: UI.text.muted,
      }).setAlpha(0.55).setDepth(3);
    });

    for (let i = 1; i < this.screens.length; i += 1) {
      const bx = this.screens[i].x;
      this.add.image(bx, WORLD_Y, '__worldSeamG1')
        .setOrigin(0.5, 0).setDisplaySize(112, SCREEN_H)
        .setTint(mixColor(TINT[this.screens[i - 1].biome] || TINT.field, TINT[this.screens[i].biome] || TINT.field, 0.55)).setAlpha(0.56).setDepth(1.6);
    }
  }

  /* ---------- 台地 / 洞穴 / 摆件 ---------- */
  addBlock(s, x, y, w, h) {
    if (!w || !h) return;
    this.blockers.push({ x: s.x + x, y: WORLD_Y + y, w, h });
  }

  buildTerrain() {
    this.screens.forEach((s) => {
      if (s.plateau) this.buildPlateau(s, s.plateau);
      if (s.cave) this.buildCave(s, s.cave);
      s.props.forEach((p) => this.buildProp(s, p));
    });
  }

  buildPlateau(s, p) {
    const px = s.x + p.x;
    const py = WORLD_Y + p.y;
    this.add.rectangle(px, py + p.h, p.w + 8, 7, 0x0a120c, 0.35)
      .setOrigin(0).setDepth(4);
    this.add.tileSprite(px, py, p.w, p.h, 'field', 21)
      .setOrigin(0).setTint(UI.world.plateau).setDepth(5);
    this.add.rectangle(px, py, p.w, 3, UI.world.fieldLight, 0.6)
      .setOrigin(0).setDepth(6);
    this.add.rectangle(px, py + p.h - 4, p.w, 4, UI.world.plateauEdge, 0.95)
      .setOrigin(0).setDepth(6);
    this.add.rectangle(px, py, 3, p.h, UI.world.plateauEdge, 0.85)
      .setOrigin(0).setDepth(6);
    this.add.rectangle(px + p.w - 3, py, 3, p.h, UI.world.plateauEdge, 0.85)
      .setOrigin(0).setDepth(6);
    const ramp = Array.isArray(p.ramp) ? p.ramp : [p.w / 2, 44];
    const rampX = clamp(asNumber(ramp[0], p.w / 2), 8, p.w - 8);
    const rampW = clamp(asNumber(ramp[1], 44), 20, 60);
    this.add.rectangle(px + rampX, py + p.h - 6, rampW, 10, 0xa9c884, 0.3)
      .setOrigin(0, 0).setDepth(6.2);
    this.add.text(px + 8, py + 7, '台地', {
      fontFamily: UI.font, fontSize: '12px', color: UI.text.foot,
    }).setAlpha(0.65).setDepth(7);

    const edge = 7;
    this.addBlock(s, p.x, p.y, p.w, edge);
    this.addBlock(s, p.x, p.y, edge, p.h);
    this.addBlock(s, p.x + p.w - edge, p.y, edge, p.h);
    this.addBlock(s, p.x, p.y + p.h - edge, rampX, edge);
    this.addBlock(s, p.x + rampX + rampW, p.y + p.h - edge, p.w - rampX - rampW, edge);
  }

  buildCave(s, c) {
    const cx = s.x + c.x;
    const cy = WORLD_Y + c.y;
    this.add.rectangle(cx, cy, c.w, c.h, 0x0b120d, 0.42)
      .setOrigin(0).setDepth(4);
    this.add.tileSprite(cx + 5, cy + 5, c.w - 10, c.h - 10, 'floorDungeon', 0)
      .setOrigin(0).setTint(UI.world.cave).setAlpha(0.86).setDepth(5);
    this.add.rectangle(cx, cy + 4, c.w, 5, 0x111810, 0.95)
      .setOrigin(0).setDepth(6);
    this.add.rectangle(cx, cy + c.h - 5, c.w, 5, 0x111810, 0.95)
      .setOrigin(0).setDepth(6);
    this.add.rectangle(cx, cy, 5, c.h, 0x111810, 0.95)
      .setOrigin(0).setDepth(6);
    this.add.rectangle(cx + c.w - 5, cy, 5, c.h, 0x111810, 0.95)
      .setOrigin(0).setDepth(6);
    this.add.image(cx + c.w / 2, cy + 6, 'caveMouth')
      .setOrigin(0.5, 1).setDepth(6.5);
    this.add.text(cx + 8, cy - 17, '地穴', {
      fontFamily: UI.font, fontSize: '12px', color: UI.text.muted,
      backgroundColor: UI.hud.bgSoft, padding: { x: 4, y: 2 },
    }).setAlpha(0.8).setDepth(7);

    const mouth = 48;
    const edge = 7;
    const mouthL = c.x + c.w / 2 - mouth / 2;
    const mouthR = c.x + c.w / 2 + mouth / 2;
    this.addBlock(s, c.x, c.y, mouthL - c.x, edge);
    this.addBlock(s, mouthR, c.y, c.x + c.w - mouthR, edge);
    this.addBlock(s, c.x, c.y, edge, c.h);
    this.addBlock(s, c.x + c.w - edge, c.y, edge, c.h);
    this.addBlock(s, c.x, c.y + c.h - edge, c.w, edge);
  }

  buildProp(s, p) {
    const base = PROP_SCALE[p.kind] || 1;
    const k = p.scale * base;
    const x = s.x + p.x;
    const y = WORLD_Y + p.y;
    if (p.kind === 'tree') {
      this.add.ellipse(x, y - 3, 34 * k, 9 * k, 0x000000, 0.25).setDepth(17);
      this.add.image(x, y, 'worldTree')
        .setOrigin(0.5, 1).setScale(k).setDepth(18);
      this.addBlock(s, p.x - 8, p.y - 12, 16, 12);
    } else if (p.kind === 'bush') {
      this.add.ellipse(x, y - 2, 24 * k, 7 * k, 0x000000, 0.2).setDepth(17);
      this.add.image(x, y, 'worldBush')
        .setOrigin(0.5, 1).setScale(k).setDepth(18);
      this.addBlock(s, p.x - 5, p.y - 7, 10, 7);
    } else if (p.kind === 'bamboo') {
      this.add.ellipse(x, y - 3, 34 * k, 8 * k, 0x000000, 0.24).setDepth(17);
      this.add.image(x, y, 'bambooGrove')
        .setOrigin(0.5, 1).setScale(k).setDepth(18);
      this.addBlock(s, p.x - 10, p.y - 12, 20, 12);
    } else if (p.kind === 'bambooGate') {
      this.add.ellipse(x, y - 2, 72 * k, 10 * k, 0x000000, 0.22).setDepth(17);
      this.add.image(x, y, 'bambooGate')
        .setOrigin(0.5, 1).setScale(k).setDepth(18);
      // Only the two posts block; the gate opening stays walkable.
      this.addBlock(s, p.x - 46 * k, p.y - 12, 8, 12);
      this.addBlock(s, p.x + 38 * k, p.y - 12, 8, 12);
    } else if (p.kind === 'desertArch') {
      this.add.ellipse(x, y - 2, 92 * k, 12 * k, 0x000000, 0.24).setDepth(17);
      this.add.image(x, y, 'desertArch')
        .setOrigin(0.5, 1).setScale(k).setDepth(18);
      this.addBlock(s, p.x - 42 * k, p.y - 14, 10, 14);
      this.addBlock(s, p.x + 32 * k, p.y - 14, 10, 14);
    } else if (p.kind === 'desertDeadTree') {
      this.add.ellipse(x, y - 3, 36 * k, 9 * k, 0x000000, 0.24).setDepth(17);
      this.add.image(x, y, 'desertDeadTree')
        .setOrigin(0.5, 1).setScale(k).setDepth(18);
      this.addBlock(s, p.x - 8, p.y - 18, 16, 16);
    } else if (p.kind === 'desertPalm') {
      this.add.ellipse(x, y - 2, 30 * k, 8 * k, 0x000000, 0.2).setDepth(17);
      this.add.image(x, y, 'desertPalm')
        .setOrigin(0.5, 1).setScale(k).setDepth(18);
      this.addBlock(s, p.x - 7, p.y - 9, 14, 9);
    } else if (p.kind === 'snowPine') {
      this.add.ellipse(x, y - 3, 36 * k, 9 * k, 0x000000, 0.22).setDepth(17);
      this.add.image(x, y, 'snowPine')
        .setOrigin(0.5, 1).setScale(k).setDepth(18);
      this.addBlock(s, p.x - 9, p.y - 12, 18, 12);
    } else if (p.kind === 'snowShrine') {
      this.add.circle(x, y - 66 * k, 44 * k, 0xa9e8ff, 0.08)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(16);
      this.add.ellipse(x, y - 2, 78 * k, 12 * k, 0x000000, 0.24).setDepth(17);
      this.add.image(x, y, 'snowShrine')
        .setOrigin(0.5, 1).setScale(k).setDepth(18);
      this.addBlock(s, p.x - 38 * k, p.y - 14, 76 * k, 14);
    } else if (p.kind === 'campfire') {
      this.add.circle(x, y - 8, 28 * k, 0xff9a4a, 0.10)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(16);
      this.add.ellipse(x, y - 1, 24 * k, 7 * k, 0x000000, 0.22).setDepth(17);
      this.add.sprite(x, y, 'campfire', 0)
        .setOrigin(0.5, 1).setScale(k).setDepth(18).play('campfire-burn');
      this.add.text(x, y - 28 * k, '篝火', {
        fontFamily: UI.font, fontSize: '12px', color: UI.text.muted,
      }).setOrigin(0.5, 1).setAlpha(0.65).setDepth(19);
    }
  }

  /* ---------- 村医 / 竹隐：每个群系最多一个 NPC ---------- */
  buildNPC() {
    this.npcs = [];
    this.screens.forEach((s, idx) => {
      if (!s.npc) return;
      const n = s.npc;
      const x = s.x + asNumber(n.x, 300);
      const y = WORLD_Y + asNumber(n.y, 200);
      const p = profileForNpc(n);
      const glow = this.add.image(x, y - 10, 'aura', 0)
        .setScale(p.glowScale).setAlpha(0.16).setTint(p.glowTint)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(22);
      this.tweens.add({ targets: glow, alpha: 0.06, scale: p.glowScale + 0.4, duration: 900, yoyo: true, repeat: -1 });
      const sprite = this.add.sprite(x, y, p.npcAsset, 0)
        .setOrigin(0.5, 1).setScale(p.npcScale).setDepth(25);
      this.tweens.add({ targets: sprite, y: y - 2, duration: 620, yoyo: true, repeat: -1 });
      const label = this.add.text(x, y - p.labelY, String(n.name || '村民'), {
        fontFamily: UI.font, fontSize: '12px', color: UI.text.primary,
        backgroundColor: UI.hud.bgSoft, padding: { x: 4, y: 2 },
      }).setOrigin(0.5, 1).setDepth(40);
      const prompt = this.add.text(x, y - p.promptY, 'E 交谈', {
        fontFamily: UI.font, fontSize: '12px', color: UI.text.heading,
        backgroundColor: UI.hud.bg, padding: { x: 5, y: 2 },
      }).setOrigin(0.5, 1).setDepth(46).setVisible(false);
      sprite.setInteractive({ useHandCursor: true });
      sprite.on('pointerdown', () => {
        if (this.talking || this.panelOpen || this.gathering || this.bossActive) return;
        if (this.distPlayer(x, y) <= 52) this.interactNpc(this.nearestNpc());
        else this.pointerTarget = { x, y };
      });
      this.npcs.push({ ...n, x, y, sprite, label, prompt, screenIndex: idx, quest: n.quest || 'field' });
    });
  }

  nearestNpc() {
    let best = null;
    let bestD = 999;
    this.npcs.forEach((n) => {
      const d = this.distPlayer(n.x, n.y);
      if (d < bestD) { bestD = d; best = n; }
    });
    return bestD <= 80 ? best : null;
  }

  /* ---------- 草药 ---------- */
  buildHerbs() {
    this.screens.forEach((s) => {
      const prof = profileFor(s.biome);
      s.herbs.forEach((h, i) => {
        const x = s.x + asNumber(h[0], 0);
        const y = WORLD_Y + asNumber(h[1], 0);
        const desert = s.biome === 'desert';
        const snow = s.biome === 'snow';
        const glow = this.add.circle(x, y - 6, snow ? 12 : (desert ? 15 : 12), prof.glowTint, snow ? 0.10 : (desert ? 0.08 : 0.10))
          .setDepth(23).setBlendMode(Phaser.BlendModes.ADD);
        const sprite = this.add.sprite(x, y, desert ? 'desertShrub' : (snow ? 'snowLantern' : 'herb'), 0)
          .setOrigin(0.5, 1).setScale(desert ? 1.7 : (snow ? 1.3 : 1.0)).setDepth(24);
        this.tweens.add({ targets: sprite, y: y - 3, duration: 760 + i * 90, yoyo: true, repeat: -1 });
        const prompt = this.add.text(x, y - (desert || snow ? 32 : 24), 'E 采集', {
          fontFamily: UI.font, fontSize: '12px', color: UI.text.heading,
          backgroundColor: UI.hud.bg, padding: { x: 5, y: 2 },
        }).setOrigin(0.5, 1).setDepth(46).setVisible(false);
        sprite.setInteractive({ useHandCursor: true });
        const node = {
          id: s.id + '-' + i, screen: s.id, screenIndex: this.screens.indexOf(s), biome: s.biome,
          x, y, sprite, glow, prompt, active: true, respawnAt: 0,
        };
        sprite.on('pointerdown', () => {
          if (this.talking || this.panelOpen || this.gathering || this.bossActive) return;
          if (!node.active) return;
          if (this.distPlayer(x, y) <= 48) this.startGather(node);
          else this.pointerTarget = { x, y };
        });
        this.herbs.push(node);
      });
    });
  }

  /* ---------- 玩家 ---------- */
  buildPlayer() {
    const skin = this.charId;
    const startX = this.screens[0].x + 72;
    const startY = WORLD_Y + 232;
    this.player = this.add.sprite(startX, startY, 'walk', 0)
      .setOrigin(0.5, 1).setScale(2).setDepth(30);
    this.player.shadow = this.add.ellipse(startX, startY - 2, 22, 6, 0x000000, 0.25)
      .setDepth(29);
    this.face = 'down';
    this.player.anims.play('p-' + skin + '-idle-down');
    this.charSkin = skin;
  }

  /* ---------- 三种天气 ---------- */
  makeVignette() {
    if (this.textures.exists('worldVigG1')) return;
    const cv = document.createElement('canvas');
    cv.width = VIEW_W;
    cv.height = VIEW_H;
    const ctx = cv.getContext('2d');
    const grd = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 120, VIEW_W / 2, VIEW_H / 2, 430);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(0.52, 'rgba(0,0,0,0.04)');
    grd.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    this.textures.addCanvas('worldVigG1', cv);
  }

  buildWeather() {
    this.makeVignette();
    this.rain = this.add.particles(0, 0, 'dust', {
      x: { min: -20, max: VIEW_W + 20 },
      y: -12,
      lifespan: { min: 620, max: 980 },
      speedX: { min: -14, max: 8 },
      speedY: { min: 190, max: 280 },
      scaleX: { min: 0.35, max: 0.65 },
      scaleY: { min: 1.1, max: 1.8 },
      alpha: { start: 0.85, end: 0.18 },
      quantity: 2,
      frequency: 36,
      tint: UI.world.rain,
      blendMode: 'ADD',
    }).setScrollFactor(0).setDepth(795);
    this.rain.stop();

    this.fogMist = this.add.particles(0, 0, 'dust', {
      x: { min: -40, max: VIEW_W + 40 },
      y: { min: 40, max: VIEW_H - 20 },
      lifespan: { min: 1500, max: 2600 },
      speedX: { min: -24, max: 14 },
      speedY: { min: -5, max: 5 },
      scale: { min: 0.65, max: 1.7 },
      alpha: { start: 0.15, end: 0 },
      quantity: 1,
      frequency: 90,
      tint: UI.world.fog,
      blendMode: 'ADD',
    }).setScrollFactor(0).setDepth(795);
    this.fogMist.stop();

    // 沙尘：横向风沙 + 褐色近地层，遮住远景但不改判定。
    this.dustStorm = this.add.particles(0, 0, 'dust', {
      x: { min: VIEW_W + 20, max: VIEW_W + 80 },
      y: { min: 44, max: VIEW_H - 18 },
      lifespan: { min: 900, max: 1600 },
      speedX: { min: -110, max: -42 },
      speedY: { min: 8, max: 34 },
      scaleX: { min: 0.4, max: 1.1 },
      scaleY: { min: 0.2, max: 0.5 },
      alpha: { start: 0.7, end: 0.05 },
      quantity: 2,
      frequency: 26,
      tint: UI.world.dust,
    }).setScrollFactor(0).setDepth(796);
    this.dustStorm.stop();

    // 雪：小片缓慢落下，偏蓝白；和沙尘共用 Snow.png 粒子纹理，不新增运行时依赖。
    this.snowFall = this.add.particles(0, 0, 'dust', {
      x: { min: -20, max: VIEW_W + 20 },
      y: -12,
      lifespan: { min: 1700, max: 2800 },
      speedX: { min: -26, max: 18 },
      speedY: { min: 48, max: 96 },
      scaleX: { min: 0.45, max: 0.95 },
      scaleY: { min: 0.45, max: 0.95 },
      alpha: { start: 0.72, end: 0.08 },
      quantity: 2,
      frequency: 44,
      tint: 0xe9fbff,
      blendMode: 'ADD',
    }).setScrollFactor(0).setDepth(795);
    this.snowFall.stop();
    this.snowVeil = this.add.rectangle(0, 0, VIEW_W, VIEW_H, UI.world.snowVeil, 0.08)
      .setOrigin(0).setScrollFactor(0).setDepth(792).setAlpha(0);

    this.dustVeil = this.add.rectangle(0, 0, VIEW_W, VIEW_H, UI.world.dustVeil, 0.13)
      .setOrigin(0).setScrollFactor(0).setDepth(791).setAlpha(0);
    this.fogVeil = this.add.rectangle(0, 0, VIEW_W, VIEW_H, UI.world.fogVeil, 0.16)
      .setOrigin(0).setScrollFactor(0).setDepth(790).setAlpha(0);
    this.caveShade = this.add.rectangle(0, 0, VIEW_W, VIEW_H, UI.world.caveVeil, 0.52)
      .setOrigin(0).setScrollFactor(0).setDepth(788).setAlpha(0);
    this.worldVig = this.add.image(0, 0, 'worldVigG1').setOrigin(0)
      .setDisplaySize(VIEW_W, VIEW_H).setScrollFactor(0).setDepth(789).setAlpha(0.12);
  }

  applyWeather(s) {
    this.weather = s.weather;
    this.rain.stop();
    this.fogMist.stop();
    this.dustStorm.stop();
    this.snowFall.stop();
    this.fogVeil.setAlpha(0);
    this.dustVeil.setAlpha(0);
    this.snowVeil.setAlpha(0);
    this.worldVig.setAlpha(s.weather === 'fog' ? 0.48 : (s.weather === 'dust' ? 0.34 : (s.weather === 'snow' ? 0.22 : 0.12)));
    if (s.weather === 'rain') this.rain.start();
    if (s.weather === 'fog') {
      this.fogMist.start();
      this.fogVeil.setAlpha(0.15);
    }
    if (s.weather === 'dust') {
      this.dustStorm.start();
      this.dustVeil.setAlpha(0.13);
    }
    if (s.weather === 'snow') {
      this.snowFall.start();
      this.snowVeil.setAlpha(0.08);
    }
  }

  /* ---------- HUD ---------- */
  buildHud() {
    this.hudBg = this.add.rectangle(0, 0, VIEW_W, 36, UI.color.panel, 0.82)
      .setOrigin(0).setScrollFactor(0).setDepth(800);
    this.hudTitle = hudText(this, 12, 7, '远征', 'h2', { background: null });
    this.hudPlace = hudText(this, VIEW_W - 12, 7, '', 'body', {
      background: null, color: UI.text.muted, origin: [1, 0],
    });
    this.hudQuest = hudText(this, VIEW_W - 12, 20, '', 'body', {
      background: null, color: UI.text.body, origin: [1, 0],
    });
    this.hudHint = hudText(this, VIEW_W / 2, VIEW_H - 18, '', 'body', {
      background: UI.hud.bgSoft, color: UI.text.foot, origin: [0.5, 0],
    });

    this.hpIcon = this.add.image(12, VIEW_H - 30, 'heart')
      .setScrollFactor(0).setDepth(812);
    this.hpText = hudText(this, 32, VIEW_H - 40, '', 'caption', {
      background: null, color: UI.text.body, depth: 812,
    });
    this.hpBarBg = this.add.rectangle(32, VIEW_H - 28, 90, 8, 0x000000, 0.58)
      .setOrigin(0).setScrollFactor(0).setDepth(812);
    this.hpBar = this.add.rectangle(34, VIEW_H - 26, 86, 4, UI.world.hp, 1)
      .setOrigin(0).setScrollFactor(0).setDepth(813);

    this.bossName = hudText(this, VIEW_W / 2, VIEW_H - 58, '', 'h2', {
      background: UI.hud.bgSoft, color: UI.text.danger, origin: [0.5, 0], depth: 820,
    }).setVisible(false);
    this.bossBarBg = this.add.rectangle(VIEW_W / 2 - 130, VIEW_H - 42, 260, 8, 0x000000, 0.62)
      .setOrigin(0).setScrollFactor(0).setDepth(812).setVisible(false);
    this.bossBar = this.add.rectangle(VIEW_W / 2 - 127, VIEW_H - 40, 254, 4, UI.world.boss, 1)
      .setOrigin(0).setScrollFactor(0).setDepth(813).setVisible(false);

    this.attackBtn = this.add.rectangle(VIEW_W - 82, VIEW_H - 46, 70, 24, UI.color.panelRaised, 0.9)
      .setOrigin(0).setScrollFactor(0).setDepth(821).setInteractive({ useHandCursor: true })
      .setVisible(false);
    this.attackT = hudText(this, VIEW_W - 47, VIEW_H - 39, '攻击', 'body', {
      background: null, color: UI.text.heading, origin: [0.5, 0], depth: 822,
    }).setVisible(false);
    this.attackBtn.on('pointerdown', () => this.attack());
    this.updateHp();
  }

  updateHp() {
    if (!this.hpBar) return;
    this.hpText.setText('HP ' + this.hp + ' / ' + this.maxHp);
    this.hpBar.width = Math.max(0, 86 * (this.hp / this.maxHp));
    this.hpBar.setFillStyle(this.hp <= 7 ? UI.world.hpLow : UI.world.hp, 1);
  }

  updateBossBar() {
    if (!this.bossBar || !this.boss) return;
    const B = this.boss;
    this.bossName.setText(B.name + '  ' + Math.max(0, B.hp) + ' / ' + B.maxHp);
    this.bossBar.width = Math.max(0, 254 * (Math.max(0, B.hp) / B.maxHp));
    this.bossBarBg.setVisible(this.bossActive);
    this.bossBar.setVisible(this.bossActive);
    this.bossName.setVisible(this.bossActive);
  }

  updateHud() {
    if (!this.hudTitle) return;
    const s = this.screens[this.screenIndex] || this.screens[0];
    const prof = profileFor(s.biome);
    const q = this.world[prof.questDef];
    const questState = this.save[prof.questSave];
    const herbCount = this.save[prof.herbSave];
    this.hudTitle.setText('远征 · ' + (s.short || s.name));
    const layerName = this.layer === 'cave' ? ' · 地穴' : (this.layer === 'plateau' ? ' · 台地' : '');
    this.hudPlace.setText(s.weatherName + ' · 第 ' + (this.screenIndex + 1) + '/' + this.screens.length + ' 屏' + layerName);
    let qs = QUEST_LABEL[questState] || QUEST_LABEL.none;
    if (questState === 'active') {
      qs = '采集 ' + Math.min(herbCount, q.need) + '/' + q.need;
      if (herbCount >= q.need) qs = '可交付 ' + q.need + '/' + q.need;
    }
    this.hudQuest.setText(prof.item + ' ' + herbCount + ' · ' + qs + ' · 碎片 ' + this.save.tokens);
    this.hudQuest.setColor(questState === 'done' ? UI.text.gold : UI.text.body);
    this.hudHint.setText(this.hudHintText());
    this.updateHp();
    this.updateBossBar();
    const showAttack = this.bossActive && !this.panelOpen && !this.talking && !this.dead && !this.victory;
    if (this.attackBtn) {
      this.attackBtn.setVisible(showAttack);
      this.attackT.setVisible(showAttack);
    }
  }

  hudHintText() {
    if (this.gathering) return '正在采集 · 移动会打断';
    if (this.dead) return '星火熄灭 · R 重新挑战 / ESC 回小屋';
    if (this.bossActive) return 'SPACE / J 攻击 · 击败苔背巨兽 · ESC 回小屋';
    const s = this.screens[this.screenIndex] || this.screens[0];
    const prof = profileFor(s.biome);
    const q = this.world[prof.questDef];
    const questState = this.save[prof.questSave];
    const herbCount = this.save[prof.herbSave];
    if (questState === 'active' && herbCount >= q.need) {
      return prof.readyHint + ' · ESC 回小屋';
    }
    return 'WASD / 方向键 移动 · E 采集 / 交谈 · SPACE / J 攻击 · ESC 回小屋';
  }

  toast(msg) {
    if (this.toastT) this.toastT.destroy();
    this.toastT = hudText(this, VIEW_W / 2, 44, msg, 'body', {
      background: UI.hud.bgSoft, color: UI.text.heading, origin: [0.5, 0], depth: 900,
    });
    this.time.delayedCall(1700, () => {
      if (this.toastT) this.toastT.destroy();
      this.toastT = null;
    });
  }

  banner(text) {
    if (this.dead) return;
    if (this.bannerT) this.bannerT.destroy();
    this.bannerT = hudText(this, VIEW_W / 2, 82, text, 'h1', {
      background: UI.hud.bgSoft, color: UI.text.heading, origin: [0.5, 0], depth: 850,
    }).setAlpha(0);
    this.tweens.add({
      targets: this.bannerT, alpha: 1, duration: 220, yoyo: true, hold: 700,
      onComplete: () => { if (this.bannerT) { this.bannerT.destroy(); this.bannerT = null; } },
    });
  }

  /* ---------- 屏幕切换 ---------- */
  applyScreen(index, initial = false) {
    const s = this.screens[index];
    if (!s) return;
    this.screenIndex = index;
    this.screenId = s.id;
    this.applyWeather(s);
    if (!this.save.visited.includes(s.id)) {
      this.save = patchWorldSave({ visited: [...this.save.visited, s.id] });
    }
    this.updateLayer(true);
    this.updateHud();
    if (!initial) this.banner(s.name);
    if (this.world.boss && s.id === this.world.boss.screen) this.enterBossScreen();
  }

  enterBossScreen() {
    if (!this.world.boss) return;
    if (this.save.boss === 'done') {
      this.showMemorial();
      return;
    }
    if (!this.boss) this.spawnBoss();
    if (!this.bossActive && !this.bossDead) this.startBossFight();
  }

  /* ---------- 输入 ---------- */
  bindInput() {
    this.keys = this.input.keyboard.addKeys({
      up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT',
      w: 'W', a: 'A', s: 'S', d: 'D',
    });
    this.input.keyboard.on('keydown-E', () => this.onAction());
    this.input.keyboard.on('keydown-ESC', () => this.onEsc());
    this.input.keyboard.on('keydown-SPACE', () => this.attack());
    this.input.keyboard.on('keydown-J', () => this.attack());
    this.input.keyboard.on('keydown-R', () => {
      if (this.dead) this.retryBoss();
    });
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (pointer, currentlyOver) => {
      if (currentlyOver && currentlyOver.length) return;
      if (this.talking || this.panelOpen || this.gathering || this.dead || this.victory) return;
      if (pointer.y < 38 || pointer.y > VIEW_H - 58) return;
      this.pointerTarget = { x: pointer.worldX, y: pointer.worldY };
    });
    ['W', 'A', 'S', 'D'].forEach((k) => {
      this.input.keyboard.on('keydown-' + k, () => { this.pointerTarget = null; });
    });
  }

  onEsc() {
    if (this.victory) { this.closeVictory(); return; }
    if (this.dead) { this.leave(); return; }
    if (this.panelOpen) { this.closePanel(); return; }
    if (this.talking) { this.closeTalk(); return; }
    if (this.gathering) { this.cancelGather(); return; }
    this.leave();
  }

  leave() {
    try { this.sound.play('ui', { volume: 0.3 }); } catch (e) {}
    if (!NAV.back()) this.scene.start('title');
  }

  onAction() {
    if (this.victory) { this.closeVictory(); return; }
    if (this.dead) { this.retryBoss(); return; }
    if (this.talking) { this.advanceTalk(); return; }
    if (this.panelOpen || this.gathering) return;
    if (this.bossActive) { this.attack(); return; }
    const herb = this.nearestHerb();
    if (herb && this.distPlayer(herb.x, herb.y) <= 46) {
      this.startGather(herb);
      return;
    }
    const npc = this.nearestNpc();
    if (npc && this.distPlayer(npc.x, npc.y) <= 52) {
      this.interactNpc(npc);
      return;
    }
    this.toast('走近草药或村医再按 E');
  }

  /* ---------- 移动与每帧 ---------- */
  update(time, delta) {
    if (!this.player || !this.screens) return;
    if (this.dead || this.victory) return;
    if (this.panelOpen) return;
    if (this.talking) return;
    if (this.gathering) {
      this.updateGather(delta);
      this.updateHud();
      return;
    }
    let vx = 0;
    let vy = 0;
    const k = this.keys;
    if (k.left.isDown || k.a.isDown) vx -= 1;
    if (k.right.isDown || k.d.isDown) vx += 1;
    if (k.up.isDown || k.w.isDown) vy -= 1;
    if (k.down.isDown || k.s.isDown) vy += 1;

    if (vx || vy) {
      this.pointerTarget = null;
      this.movePlayer(vx, vy, delta);
    } else if (this.pointerTarget) {
      const dx = this.pointerTarget.x - this.player.x;
      const dy = this.pointerTarget.y - this.player.y;
      const d = Math.hypot(dx, dy);
      if (d <= 4) {
        this.pointerTarget = null;
        this.playIdle();
      } else {
        this.movePlayer(dx / d, dy / d, delta);
      }
    } else {
      this.playIdle();
    }

    this.player.shadow.x = this.player.x;
    this.player.shadow.y = this.player.y - 2;
    this.updateLayer();
    this.updatePrompts();
    this.updateRespawns(time);
    this.updateBoss(time, delta);
    const next = clamp(Math.floor((this.player.x + 2) / SCREEN_W), 0, this.screens.length - 1);
    if (next !== this.screenIndex) this.applyScreen(next);
  }

  movePlayer(vx, vy, delta) {
    const d = Math.hypot(vx, vy) || 1;
    let mul = this.weather === 'rain' ? 1.05 : (this.weather === 'fog' ? 0.92 : (this.weather === 'dust' ? 0.94 : (this.weather === 'snow' ? 0.90 : 1)));
    if (this.layer === 'cave') mul *= 0.9;
    const step = SPEED * mul * (delta / 1000);
    let nx = this.player.x + (vx / d) * step;
    let ny = this.player.y + (vy / d) * step;
    nx = clamp(nx, 8, this.worldWidth - 8);
    ny = clamp(ny, WORLD_Y + 14, WORLD_Y + SCREEN_H - 10);
    if (this.bossActive && this.screenIndex === 5) {
      nx = Math.max(nx, this.screens[5].x + 24);
    }
    if (!this.isBlocked(nx, this.player.y)) this.player.x = nx;
    if (!this.isBlocked(this.player.x, ny)) this.player.y = ny;
    if (Math.abs(vx) > Math.abs(vy)) this.face = vx < 0 ? 'left' : 'right';
    else this.face = vy < 0 ? 'up' : 'down';
    const anim = 'p-' + this.charSkin + '-walk-' + this.face;
    if (this.player.anims.currentAnim?.key !== anim) this.player.anims.play(anim, true);
  }

  isBlocked(x, y) {
    const fx = x;
    const fy = y - 4;
    const r = 7;
    for (let i = 0; i < this.blockers.length; i += 1) {
      const b = this.blockers[i];
      if (fx + r > b.x && fx - r < b.x + b.w && fy + r > b.y && fy - r < b.y + b.h) return true;
    }
    return false;
  }

  playIdle() {
    const anim = 'p-' + this.charSkin + '-idle-' + this.face;
    if (this.player.anims.currentAnim?.key !== anim) this.player.anims.play(anim, true);
  }

  updateLayer(force = false) {
    const s = this.screens[this.screenIndex];
    if (!s) return;
    let layer = 'surface';
    const lx = this.player.x - s.x;
    const ly = this.player.y - WORLD_Y;
    if (s.cave && lx >= s.cave.x + 6 && lx <= s.cave.x + s.cave.w - 6
      && ly >= s.cave.y + 8 && ly <= s.cave.y + s.cave.h - 6) layer = 'cave';
    else if (s.plateau && lx >= s.plateau.x + 4 && lx <= s.plateau.x + s.plateau.w - 4
      && ly >= s.plateau.y + 4 && ly <= s.plateau.y + s.plateau.h - 4) layer = 'plateau';
    if (layer !== this.layer || force) {
      this.layer = layer;
      this.caveShade.setAlpha(layer === 'cave' ? 0.46 : 0);
      this.updateHud();
    }
  }

  distPlayer(x, y) {
    return Phaser.Math.Distance.Between(this.player.x, this.player.y - 14, x, y - 8);
  }

  nearestHerb() {
    let best = null;
    let bestD = 999;
    this.herbs.forEach((n) => {
      if (!n.active) return;
      const d = this.distPlayer(n.x, n.y);
      if (d < bestD) { bestD = d; best = n; }
    });
    return bestD <= 80 ? best : null;
  }

  updatePrompts() {
    const busy = this.talking || this.panelOpen || !!this.gathering || this.dead || this.victory || this.bossActive;
    this.herbs.forEach((n) => n.prompt.setVisible(false));
    this.npcs.forEach((n) => n.prompt.setVisible(false));
    if (busy) return;
    const herb = this.nearestHerb();
    const npc = this.nearestNpc();
    if (herb && this.distPlayer(herb.x, herb.y) <= 46) herb.prompt.setVisible(true);
    else if (npc && this.distPlayer(npc.x, npc.y) <= 52) npc.prompt.setVisible(true);
  }

  updateRespawns(time) {
    this.herbs.forEach((n) => {
      if (!n.active && n.respawnAt && time >= n.respawnAt) {
        n.active = true;
        n.respawnAt = 0;
        n.sprite.setVisible(true);
        n.glow.setVisible(true);
        this.toast(profileFor(n.biome).respawn);
      }
    });
  }

  /* ---------- 采集读条 ---------- */
  startGather(node) {
    if (!node || !node.active || this.gathering || this.bossActive) return;
    this.pointerTarget = null;
    this.playIdle();
    const x = node.x;
    const y = node.y - 34;
    this.gathering = { node, t: 0, dur: GATHER_MS };
    this.gatherBg = this.add.rectangle(x - 20, y, 40, 5, 0x000000, 0.8)
      .setOrigin(0).setDepth(50);
    this.gatherFill = this.add.rectangle(x - 19, y + 1, 0, 3, UI.world.herbGold, 1)
      .setOrigin(0).setDepth(51);
    this.gatherLabel = this.add.text(x, y - 4, '采集中', {
      fontFamily: UI.font, fontSize: '12px', color: UI.text.heading,
      backgroundColor: UI.hud.bgSoft, padding: { x: 4, y: 1 },
    }).setOrigin(0.5, 1).setDepth(52);
    node.prompt.setVisible(false);
    this.updateHud();
  }

  updateGather(delta) {
    const g = this.gathering;
    if (!g) return;
    const k = this.keys;
    if (k.left.isDown || k.a.isDown || k.right.isDown || k.d.isDown
      || k.up.isDown || k.w.isDown || k.down.isDown || k.s.isDown) {
      this.cancelGather('移动打断采集');
      return;
    }
    g.t += delta;
    this.gatherFill.width = 38 * Math.min(1, g.t / g.dur);
    if (g.t >= g.dur) this.completeGather();
  }

  cancelGather(msg) {
    const g = this.gathering;
    this.gathering = null;
    this.destroyGather();
    if (msg) this.toast(msg);
    this.updateHud();
    if (g) this.updatePrompts();
  }

  destroyGather() {
    [this.gatherBg, this.gatherFill, this.gatherLabel].forEach((o) => { if (o) o.destroy(); });
    this.gatherBg = this.gatherFill = this.gatherLabel = null;
  }

  completeGather() {
    const g = this.gathering;
    if (!g) return;
    const node = g.node;
    this.gathering = null;
    this.destroyGather();
    node.active = false;
    node.respawnAt = this.time.now + RESPAWN_MS;
    node.sprite.setVisible(false);
    node.glow.setVisible(false);
    const prof = profileFor(node.biome);
    const q = this.world[prof.questDef];
    const key = prof.herbSave;
    const count = this.save[key] + q.yield;
    this.save = patchWorldSave({ [key]: count });
    this.toast('采到' + prof.item + ' ×' + q.yield);
    this.updateHud();
    if (this.save[prof.questSave] === 'active' && count >= q.need) {
      this.toast(prof.readyHint);
    }
  }

  /* ---------- 村医 / 竹隐 / 沙婆与委托 ---------- */
  questFor(npc) {
    return this.world[profileForNpc(npc).questDef];
  }

  questStateFor(npc) {
    return this.save[profileForNpc(npc).questSave];
  }

  herbCountFor(npc) {
    return this.save[profileForNpc(npc).herbSave];
  }

  herbKeyFor(npc) {
    return profileForNpc(npc).herbSave;
  }

  questKeyFor(npc) {
    return profileForNpc(npc).questSave;
  }

  npcLines(npc, state, count) {
    const q = this.questFor(npc);
    const missing = q.need - count;
    if (npc.quest === 'bamboo') {
      if (state === 'done') return ['雾竹的味道，和五十年前一样。', '路还长，别把灯熄了。'];
      if (state === 'none') return ['这片竹林最近起了雾，旧祠的灯也暗了。', '帮我采四株雾竹回来，我要熬一锅汤。'];
      return ['还差 ' + missing + ' 株雾竹。', '旧祠后面的竹丛，采完会重新长出来。'];
    }
    if (npc.quest === 'desert') {
      if (state === 'done') return ['沙枣够甜，井水也活了。', '收下碎片，别在沙暴里回头。'];
      if (state === 'none') return ['风把沙枣吹到旧门那边了。', '帮我拾五颗回来，井里还有一盏灯。'];
      return ['还差 ' + missing + ' 颗沙枣。', '旧门附近的沙丘上还有，采完会重新长出来。'];
    }
    if (npc.quest === 'snow') {
      if (state === 'done') return ['雪灯亮了，破祠里终于有影子。', '往风口走时别回头，雪会替你记路。'];
      if (state === 'none') return ['破祠的灯灭了很久，雪把灯芯压在霜林里。', '帮我拾五盏雪灯回来，我想再点一次。'];
      return ['还差 ' + missing + ' 盏雪灯。', '白原和石灯附近还有，雪化之前它们会重新亮。'];
    }
    if (state === 'done') return ['这些草药救了不少人。', '路上小心，星火会记得你。'];
    if (state === 'none') return ['你来得正好。村东的草药被雨泡坏了不少。', '能帮我采 5 株回来吗？草原上还有三丛。'];
    return ['还差 ' + missing + ' 株。', '草原上那几丛，采完会重新长出来。'];
  }

  interactNpc(npc) {
    if (!npc || this.talking || this.panelOpen || this.bossActive) return;
    const prof = profileForNpc(npc);
    const q = this.questFor(npc);
    const state = this.questStateFor(npc);
    if (state === 'done') {
      this.say(npc.name, this.npcLines(npc, state, this.herbCountFor(npc)));
      return;
    }
    if (state === 'none') {
      this.say(npc.name, this.npcLines(npc, state, 0), () => {
        this.save = patchWorldSave({ [prof.questSave]: 'active' });
        this.updateHud();
        this.toast('委托已接受 · ' + q.name);
      });
      return;
    }
    const count = this.herbCountFor(npc);
    if (count < q.need) {
      this.say(npc.name, this.npcLines(npc, state, count));
      return;
    }
    this.showQuestChoice(npc);
  }

  showQuestChoice(npc) {
    const prof = profileForNpc(npc);
    const q = this.questFor(npc);
    const count = this.herbCountFor(npc);
    const unit = prof.unit || '株';
    const W = Math.min(390, VIEW_W - 40);
    const H = 154;
    const x = VIEW_W / 2 - W / 2;
    const y = VIEW_H / 2 - H / 2;
    this.panelOpen = true;
    this.pointerTarget = null;
    if (this.hudHint) this.hudHint.setVisible(false);
    const dim = this.add.rectangle(0, 0, VIEW_W, VIEW_H, UI.color.overlay, UI.alpha.disabled)
      .setOrigin(0).setScrollFactor(0).setDepth(90).setInteractive();
    const p = screenPanel(this, { x, y, w: W, h: H, variant: 'raised', depth: 100 });
    p.add(makeText(this, 14, 12, '委托 · ' + q.name, 'h2', { color: UI.text.heading }));
    p.add(makeText(this, 14, 34, npc.name + ' 需要 ' + q.need + ' ' + unit + prof.item + '，当前 ' + count + ' ' + unit + '。', 'body', {
      color: UI.text.body,
    }));
    const rows = [
      ['交付 ' + q.need + ' ' + unit + prof.item, () => this.deliverQuest(npc)],
      ['再等等', () => this.closePanel()],
    ].map(([label, cb], i) => {
      const card = makeCard(this, {
        x: x + 16, y: y + 68 + i * 32, w: W - 32, h: 26,
        accent: i === 0 ? UI.color.gold : UI.color.lineMuted,
        depth: 104, onClick: cb,
      });
      card.container.setScrollFactor(0);
      card.hit.setScrollFactor(0);
      card.add(makeText(this, 12, 7, label, 'body', {
        color: i === 0 ? UI.text.primary : UI.text.muted,
      }));
      return { card };
    });
    this.panel = { dim, panel: p, rows, npc };
    this.updateHud();
  }

  deliverQuest(npc) {
    const prof = profileForNpc(npc);
    const q = this.questFor(npc);
    const count = this.herbCountFor(npc);
    const herbKey = prof.herbSave;
    const questKey = prof.questSave;
    this.save = patchWorldSave({
      [herbKey]: Math.max(0, count - q.need),
      [questKey]: 'done',
      tokens: this.save.tokens + q.rewardTokens,
    });
    this.closePanel();
    this.updateHud();
    this.toast('委托完成 · 星火碎片 +' + q.rewardTokens);
    this.say(npc.name, npc.quest === 'bamboo'
      ? ['雾竹够了。', '收下这枚星火碎片，旧祠的灯就拜托你了。']
      : (npc.quest === 'desert'
        ? ['沙枣够了。', '收下这枚星火碎片，旧门的灯就拜托你了。']
        : (npc.quest === 'snow'
          ? ['雪灯够了。', '收下这枚星火碎片，破祠的灯就拜托你了。']
          : ['这些草药够了。', '收下这枚星火碎片吧，路上用得上。'])));
  }

  closePanel() {
    if (this.panel) {
      this.panel.rows.forEach((r) => destroyRow(r));
      this.panel.dim.destroy();
      this.panel.panel.container.destroy();
      this.panel = null;
    }
    this.panelOpen = false;
    if (this.hudHint) this.hudHint.setVisible(true);
    this.updatePrompts();
    this.updateHud();
  }

  /* ---------- 对话 ---------- */
  say(name, lines, onDone) {
    if (this.talking) return;
    this.talking = true;
    this.pointerTarget = null;
    if (this.hudHint) this.hudHint.setVisible(false);
    const arr = Array.isArray(lines) ? lines : [String(lines)];
    const W = VIEW_W - 48;
    const H = 96;
    const x = 24;
    const y = VIEW_H - H - 26;
    this.talkHit = this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0, 0)
      .setOrigin(0).setScrollFactor(0).setDepth(96).setInteractive();
    this.talkHit.on('pointerdown', () => this.advanceTalk());
    const p = screenPanel(this, { x, y, w: W, h: H, variant: 'raised', depth: 100 });
    const nameT = makeText(this, 12, 9, name, 'h2', { color: UI.text.heading });
    const body = makeText(this, 12, 30, '', 'body', {
      color: UI.text.body, wordWrap: { width: W - 24 }, lineSpacing: 4,
    });
    const hint = makeText(this, W - 12, H - 12, 'E / 点击 继续', 'caption', {
      color: UI.text.muted, origin: [1, 1],
    });
    p.add(nameT, body, hint);
    this.talk = { p, name, lines: arr, index: 0, body, onDone, hit: this.talkHit };
    this.showTalkLine();
    this.updatePrompts();
    this.updateHud();
  }

  showTalkLine() {
    if (!this.talk) return;
    this.talk.body.setText(this.talk.lines[this.talk.index] || '');
  }

  advanceTalk() {
    if (!this.talk) return;
    if (this.talk.index < this.talk.lines.length - 1) {
      this.talk.index += 1;
      this.showTalkLine();
      return;
    }
    const cb = this.talk.onDone;
    this.closeTalk();
    if (cb) cb();
  }

  closeTalk() {
    if (!this.talk) return;
    this.talk.p.container.destroy();
    if (this.talk.hit) this.talk.hit.destroy();
    this.talk = null;
    this.talking = false;
    if (this.hudHint) this.hudHint.setVisible(!this.panelOpen);
    this.updatePrompts();
    this.updateHud();
  }

  /* ---------- Boss ---------- */
  spawnBoss() {
    const b = this.world.boss;
    if (!b) return;
    const si = this.screens.findIndex((s) => s.id === b.screen);
    if (si < 0) return;
    const s = this.screens[si];
    const x = s.x + b.x;
    const y = WORLD_Y + b.y;
    this.bossSpawn = { x, y, screenIndex: si, screen: s };
    const glow = this.add.image(x, y - 26, 'aura', 0)
      .setScale(3.4).setAlpha(0.16).setTint(UI.world.boss)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(33).setVisible(false);
    const ring = this.add.ellipse(x, y - 2, 58, 14, UI.world.boss, 0.12).setDepth(32).setVisible(false);
    const spr = this.add.sprite(x, y, 'racoonIdle', 0)
      .setOrigin(0.5, 1).setScale(1.75).setDepth(35).setVisible(false);
    spr.play('racoon-idle');
    const label = this.add.text(x, y - 74, b.name, {
      fontFamily: UI.font, fontSize: '12px', color: UI.text.danger,
      backgroundColor: UI.hud.bgSoft, padding: { x: 5, y: 2 },
    }).setOrigin(0.5, 1).setDepth(40).setVisible(false);
    this.boss = {
      name: b.name, spr, glow, ring, label, x, y,
      maxHp: b.hp, hp: b.hp, dmg: b.dmg, rewardTokens: b.rewardTokens,
      state: 'idle', stateEnd: 0, nextAt: 0, target: null, warning: null, flash: 0,
      screenIndex: si, arena: {
        x1: s.x + 44, x2: s.x + SCREEN_W - 44,
        y1: WORLD_Y + 104, y2: WORLD_Y + SCREEN_H - 22,
      },
    };
  }

  startBossFight() {
    const b = this.world.boss;
    if (!b || !this.boss) return;
    this.bossActive = true;
    this.bossDead = false;
    this.victory = false;
    this.dead = false;
    this.hp = this.maxHp;
    this.iframe = 0;
    this.lastHurtAt = -9999;
    this.pointerTarget = null;
    this.boss.hp = this.boss.maxHp;
    this.boss.state = 'chase';
    this.boss.nextAt = this.time.now + 900;
    this.boss.spr.setPosition(this.bossSpawn.x, this.bossSpawn.y).setVisible(true);
    this.boss.glow.setVisible(true);
    this.boss.ring.setVisible(true);
    this.boss.label.setVisible(true);
    this.boss.spr.play('racoon-idle');
    if (!this.arenaLine) {
      const s = this.screens[this.boss.screenIndex];
      this.arenaLine = this.add.rectangle(s.x + 6, WORLD_Y + 6, 5, SCREEN_H - 12, UI.world.boss, 0.45)
        .setOrigin(0).setDepth(38);
    }
    this.updateHud();
    this.updateBossBar();
    this.banner('苔背巨兽 · 星火守巢者');
    this.time.delayedCall(900, () => {
      if (this.bossActive) this.toast('SPACE / J 攻击 · 击败守巢者');
    });
  }

  distBoss() {
    if (!this.boss) return 999;
    return Phaser.Math.Distance.Between(this.player.x, this.player.y - 14, this.boss.spr.x, this.boss.spr.y - 30);
  }

  updateBoss(time, delta) {
    const B = this.boss;
    if (!B || !this.bossActive || this.dead || this.victory) return;
    B.spr.x = clamp(B.spr.x, B.arena.x1, B.arena.x2);
    B.spr.y = clamp(B.spr.y, B.arena.y1, B.arena.y2);
    B.glow.x = B.spr.x; B.glow.y = B.spr.y - 26;
    B.ring.x = B.spr.x; B.ring.y = B.spr.y - 2;
    B.label.x = B.spr.x; B.label.y = B.spr.y - 74;
    if (B.flash > 0) {
      B.flash -= delta;
      if (B.flash <= 0) B.spr.clearTint();
    }
    const dist = this.distBoss();
    if (B.state === 'chase') {
      if (time >= B.nextAt) {
        if (dist < 68) this.startSwipe();
        else this.startPounce();
        return;
      }
      if (dist > 74) {
        const dx = this.player.x - B.spr.x;
        const dy = this.player.y - B.spr.y;
        const d = Math.hypot(dx, dy) || 1;
        const step = 34 * (delta / 1000);
        B.spr.x = clamp(B.spr.x + (dx / d) * step, B.arena.x1, B.arena.x2);
        B.spr.y = clamp(B.spr.y + (dy / d) * step, B.arena.y1, B.arena.y2);
      }
      return;
    }
    if (B.state === 'pounceWindup' && time >= B.stateEnd) {
      if (B.warning) { B.warning.destroy(); B.warning = null; }
      B.state = 'pounceAir';
      B.spr.play('racoon-jump');
      const tx = clamp(B.target.x, B.arena.x1, B.arena.x2);
      const ty = clamp(B.target.y, B.arena.y1, B.arena.y2);
      this.tweens.add({
        targets: B.spr, x: tx, y: ty, duration: 180, ease: 'Quad.easeOut',
        onComplete: () => {
          if (!this.bossActive) return;
          if (this.distBoss() <= 52) this.hurtPlayer(B.spr.x, B.spr.y, B.dmg);
          B.state = 'recover';
          B.stateEnd = this.time.now + 480;
          B.spr.play('racoon-idle');
        },
      });
      return;
    }
    if (B.state === 'pounceAir') return;
    if (B.state === 'swipeWindup' && time >= B.stateEnd) {
      if (B.warning) { B.warning.destroy(); B.warning = null; }
      B.spr.play('racoon-atk');
      if (this.distBoss() <= 58) this.hurtPlayer(B.spr.x, B.spr.y, B.dmg);
      this.cameras.main.shake(80, 0.006);
      B.state = 'recover';
      B.stateEnd = this.time.now + 460;
      return;
    }
    if (B.state === 'recover') {
      if (time >= B.stateEnd) {
        B.spr.play('racoon-idle');
        B.state = 'chase';
        B.nextAt = time + 760;
      }
    }
  }

  startSwipe() {
    const B = this.boss;
    if (!B) return;
    B.state = 'swipeWindup';
    B.stateEnd = this.time.now + 320;
    B.spr.play('racoon-chg');
    if (B.warning) B.warning.destroy();
    B.warning = this.add.circle(B.spr.x, B.spr.y - 18, 38, UI.world.boss, 0.26)
      .setDepth(37);
    this.tweens.add({ targets: B.warning, alpha: 0.08, scale: 1.15, duration: 160, yoyo: true });
  }

  startPounce() {
    const B = this.boss;
    if (!B) return;
    B.state = 'pounceWindup';
    B.stateEnd = this.time.now + 420;
    B.target = { x: this.player.x, y: this.player.y };
    B.spr.play('racoon-chg');
    if (B.warning) B.warning.destroy();
    B.warning = this.add.circle(B.target.x, B.target.y - 10, 24, UI.world.boss, 0.3)
      .setDepth(37);
    this.tweens.add({ targets: B.warning, alpha: 0.1, scale: 1.2, duration: 210, yoyo: true });
  }

  attack() {
    if (!this.player || this.dead || this.victory || this.panelOpen || this.talking || this.gathering) return;
    if (this.time.now - this.atkAt < ATTACK_CD) return;
    this.atkAt = this.time.now;
    const v = VEC[this.face] || VEC.down;
    const fx = this.add.sprite(this.player.x + v[0] * 12, this.player.y + v[1] * 9, 'slA')
      .setDepth(36).setRotation((ANGLE[this.face] || 0) + Math.PI / 4).setScale(1.8);
    fx.play('slA-play');
    this.tweens.add({ targets: fx, scale: 2.2, duration: 180, onComplete: () => fx.destroy() });
    this.tweens.add({ targets: this.player, scaleX: 2.25, scaleY: 1.8, duration: 70, yoyo: true });
    try { this.sound.play('sword', { rate: Phaser.Math.FloatBetween(0.95, 1.08), volume: 0.5 }); } catch (e) {}
    if (!this.bossActive || !this.boss) return;
    if (this.distBoss() <= ATTACK_RANGE) this.damageBoss(ATTACK_DMG);
  }

  damageBoss(dmg) {
    const B = this.boss;
    if (!B || B.hp <= 0) return;
    B.hp = Math.max(0, B.hp - dmg);
    B.flash = 70;
    B.spr.setTintFill(0xffffff);
    this.updateBossBar();
    this.cameras.main.shake(70, 0.006);
    const float = this.add.text(B.spr.x + 10, B.spr.y - 40, '-' + dmg, {
      fontFamily: UI.font, fontSize: '12px', color: UI.text.danger,
    }).setDepth(44);
    this.tweens.add({ targets: float, y: float.y - 22, alpha: 0, duration: 620, onComplete: () => float.destroy() });
    if (B.hp <= 0) this.finishBoss();
  }

  hurtPlayer(fromX, fromY, dmg) {
    if (this.dead || this.victory) return;
    if (this.time.now - this.lastHurtAt < IFRAME) return;
    this.lastHurtAt = this.time.now;
    this.hp = Math.max(0, this.hp - dmg);
    this.iframe = IFRAME;
    this.cameras.main.shake(90, 0.009);
    this.player.setTintFill(0xff9a8a);
    this.time.delayedCall(90, () => { if (!this.dead) this.player.clearTint(); });
    const dx = this.player.x - fromX;
    const dy = this.player.y - fromY;
    const d = Math.hypot(dx, dy) || 1;
    this.tweens.add({
      targets: this.player,
      x: this.player.x + (dx / d) * 18,
      y: this.player.y + (dy / d) * 12,
      duration: 100, yoyo: true, ease: 'Quad.easeOut',
    });
    try { this.sound.play('hurt', { rate: 1.0, volume: 0.55 }); } catch (e) {}
    this.updateHp();
    if (this.hp <= 0) this.worldDown();
  }

  finishBoss() {
    if (!this.boss || this.bossDead) return;
    this.bossDead = true;
    this.bossActive = false;
    this.boss.state = 'dead';
    if (this.boss.warning) { this.boss.warning.destroy(); this.boss.warning = null; }
    this.boss.spr.setVisible(false);
    this.boss.glow.setVisible(false);
    this.boss.ring.setVisible(false);
    this.boss.label.setVisible(false);
    if (this.arenaLine) { this.arenaLine.destroy(); this.arenaLine = null; }
    this.updateBossBar();
    const reward = this.world.boss.rewardTokens;
    this.save = patchWorldSave({ boss: 'done', tokens: this.save.tokens + reward });
    this.updateHud();
    this.addAuraAtBoss();
    this.showVictory(reward);
  }

  addAuraAtBoss() {
    if (!this.bossSpawn) return;
    const { x, y } = this.bossSpawn;
    const aura = this.add.image(x, y - 18, 'aura', 0)
      .setScale(2.4).setAlpha(0.5).setTint(UI.world.herbGold)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(26);
    this.tweens.add({ targets: aura, alpha: 0.16, scale: 2.8, duration: 900, yoyo: true, repeat: -1 });
    this.memorial = { aura };
  }

  showMemorial() {
    if (!this.bossSpawn) return;
    if (this.memorial) return;
    this.addAuraAtBoss();
    this.memorialText = this.add.text(this.bossSpawn.x, this.bossSpawn.y - 66, '星火已归位', {
      fontFamily: UI.font, fontSize: '12px', color: UI.text.gold,
      backgroundColor: UI.hud.bgSoft, padding: { x: 5, y: 2 },
    }).setOrigin(0.5, 1).setDepth(40);
  }

  worldDown() {
    if (this.dead) return;
    this.dead = true;
    this.bossActive = false;
    this.pointerTarget = null;
    // 死亡面板要独占视线：清掉入场 banner / toast，避免压住“星火熄灭”。
    if (this.bannerT) { this.bannerT.destroy(); this.bannerT = null; }
    if (this.toastT) { this.toastT.destroy(); this.toastT = null; }
    this.player.setAlpha(0.4);
    this.updateHud();
    this.showDownPanel();
  }

  showDownPanel() {
    const W = Math.min(390, VIEW_W - 40);
    const H = 154;
    const x = VIEW_W / 2 - W / 2;
    const y = VIEW_H / 2 - H / 2;
    this.panelOpen = true;
    if (this.bannerT) { this.bannerT.destroy(); this.bannerT = null; }
    if (this.hudHint) this.hudHint.setVisible(false);
    const dim = this.add.rectangle(0, 0, VIEW_W, VIEW_H, UI.color.overlay, UI.alpha.disabled)
      .setOrigin(0).setScrollFactor(0).setDepth(90).setInteractive();
    const p = screenPanel(this, { x, y, w: W, h: H, variant: 'raised', depth: 100 });
    p.add(makeText(this, 14, 12, '星火熄灭', 'h2', { color: UI.text.danger }));
    p.add(makeText(this, 14, 34, '你被苔背巨兽击倒了。', 'body', { color: UI.text.body }));
    const rows = [
      ['重新挑战', () => this.retryBoss()],
      ['回到小屋', () => this.leave()],
    ].map(([label, cb], i) => {
      const card = makeCard(this, {
        x: x + 16, y: y + 68 + i * 32, w: W - 32, h: 26,
        accent: i === 0 ? UI.color.gold : UI.color.lineMuted,
        depth: 104, onClick: cb,
      });
      card.container.setScrollFactor(0);
      card.hit.setScrollFactor(0);
      card.add(makeText(this, 12, 7, label, 'body', {
        color: i === 0 ? UI.text.primary : UI.text.muted,
      }));
      return { card };
    });
    this.modal = { dim, panel: p, rows };
  }

  retryBoss() {
    if (!this.dead || !this.boss) return;
    this.destroyModal();
    this.dead = false;
    this.victory = false;
    this.panelOpen = false;
    this.hp = this.maxHp;
    this.iframe = 0;
    this.lastHurtAt = -9999;
    this.player.setAlpha(1);
    this.player.setPosition(this.bossSpawn.screen.x + 74, WORLD_Y + 232);
    this.boss.hp = this.boss.maxHp;
    this.boss.spr.setPosition(this.bossSpawn.x, this.bossSpawn.y);
    this.boss.state = 'chase';
    this.boss.nextAt = this.time.now + 900;
    this.bossActive = true;
    this.boss.spr.setVisible(true);
    this.boss.glow.setVisible(true);
    this.boss.ring.setVisible(true);
    this.boss.label.setVisible(true);
    this.boss.spr.play('racoon-idle');
    if (this.hudHint) this.hudHint.setVisible(true);
    this.updateHud();
    this.banner('苔背巨兽 · 再战');
    this.updatePrompts();
    this.updateBossBar();
  }

  showVictory(reward) {
    this.victory = true;
    this.panelOpen = true;
    this.pointerTarget = null;
    if (this.hudHint) this.hudHint.setVisible(false);
    const W = Math.min(400, VIEW_W - 40);
    const H = 184;
    const x = VIEW_W / 2 - W / 2;
    const y = VIEW_H / 2 - H / 2;
    const dim = this.add.rectangle(0, 0, VIEW_W, VIEW_H, UI.color.overlay, UI.alpha.disabled)
      .setOrigin(0).setScrollFactor(0).setDepth(90).setInteractive();
    const p = screenPanel(this, { x, y, w: W, h: H, variant: 'raised', depth: 100 });
    // 胜利按钮用一块无描边底板：保留按钮感，又不让卡片顶线贴着“继续探索”。
    const rowFill = this.add.rectangle(x + 16, y + 100, W - 32, 34, UI.color.panelRaised, 0.92)
      .setOrigin(0).setScrollFactor(0).setDepth(103);
    p.add(makeText(this, 14, 12, '草原的星火 · 已归位', 'h2', { color: UI.text.gold }));
    p.add(makeText(this, 14, 36, '苔背巨兽倒下，星火碎片 +' + reward + '。', 'body', { color: UI.text.body }));
    p.add(makeText(this, 14, 58, '这片草原的远征，暂时告一段落。', 'caption', { color: UI.text.muted }));
    const rows = [['继续探索', () => this.closeVictory()]].map(([label, cb]) => {
      const card = makeCard(this, {
        x: x + 16, y: y + 100, w: W - 32, h: 34,
        accent: UI.color.gold, depth: 104, onClick: cb,
      });
      card.container.setScrollFactor(0);
      card.hit.setScrollFactor(0);
      // 胜利页只有一个按钮，去掉卡片顶部的横向描边，避免它像一条压在“继续探索”上的分隔线。
      card.bg.setVisible(false);
      card.add(makeText(this, 12, 14, label, 'body', { color: UI.text.primary }));
      return { card };
    });
    this.modal = { dim, panel: p, rows, fill: rowFill };
    this.updateHud();
  }

  closeVictory() {
    if (!this.victory) return;
    this.destroyModal();
    this.victory = false;
    this.panelOpen = false;
    if (this.hudHint) this.hudHint.setVisible(true);
    this.showMemorial();
    this.updateHud();
    this.updatePrompts();
  }

  destroyModal() {
    if (!this.modal) return;
    this.modal.rows.forEach((r) => destroyRow(r));
    if (this.modal.fill) this.modal.fill.destroy();
    this.modal.dim.destroy();
    this.modal.panel.container.destroy();
    this.modal = null;
  }
}
