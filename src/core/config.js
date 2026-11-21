/* 全局常量与手感数值。改数值只改这里。 */
const TILE = 32;            // 16px 美术 × 2 倍
const COLS = 24, ROWS = 26; // 房间格数：768 × 832 世界像素
const RW = COLS * TILE, RH = ROWS * TILE;
const MINOR = 360, MAX_MAJOR = 800;

/* 字体：NinjaPixel 是 Fusion Pixel 12px 的构建期子集（tools/subset_font.py 生成）。
 * 像素字体只有 12px 一个设计尺寸，字号请用 12 / 24 的倍数，其它尺寸会糊。 */
const FONT = '"NinjaPixel", ui-monospace, monospace';

const CFG = {
  maxHp: 20, touchDmg: 3, playerDmg: 3, enemyHp: 6,
  atkCd: 300, atkReach: 30, atkBox: [34, 30],
  enemySpeed: 46, chaseRange: 420, iFrame: 700, hitStop: 55,
  bossHp: 28, bossSpeed: 52, bossDmg: 3,
  bossWindup: 420, bossLungeSpeed: 190, bossLungeTime: 220, bossRecover: 380, bossLungeReach: 132,
  beastStuckMs: 260, beastSlideMs: 420, camLerp: 0.12, camLookAhead: 22,
  roomEnemiesMin: 3, roomEnemiesMax: 5,
  healAmount: 4, coinChance: 0.45, heartChance: 0.12,
  cyclope: { hp: 10, speed: 30, dmg: 4, dashSpeed: 230, dashTime: 260, dashCd: 1400, dashRange: 170 },
  eye: { hp: 8, speed: 34, dmg: 2, shotCd: 1600, shotSpeed: 150, keepMin: 110, keepMax: 230, range: 380, shotDmg: 2 },
  larva: { hp: 9, speed: 56, dmg: 3, miniHp: 3, miniSpeed: 74, miniHalf: 10, splitCount: 2 },
  /* 批 4：新怪。每只一个"破法"，数值都留在这里可调 */
  slime: { hp: 7, speed: 32, dmg: 3, splitHp: 3, splitSpeed: 46, splitCount: 2 },
  spider: { hp: 8, speed: 36, dmg: 2, webCd: 1900, webSpeed: 118, webSlow: 0.4, webSlowMs: 1500, keepMin: 120, range: 360 },
  owl: { hp: 6, speed: 42, dmg: 3, hoverMs: 720, diveSpeed: 205, diveRange: 230, tall: 18 },
  mush: { hp: 10, speed: 8, dmg: 2, poisonCd: 2400, poisonRadius: 54, poisonLife: 3000, poisonTick: 600, poisonDmg: 1, poisonRange: 300 },
  mole: { hp: 9, speed: 38, dmg: 3, diveMs: 620, emergeMs: 260, diveRange: 260 },
  skull: { hp: 7, speed: 26, dmg: 2, shotCd: 2100, shotSpeed: 105, shotDmg: 2, turn: 0.6, range: 420 },
  /* 批 10：小浣熊（快近战，偶尔侧跳） */
  racoon: { hp: 8, speed: 66, dmg: 2, half: 10, hopCd: 1300, hopRange: 150, hopSpeed: 155 },
  /* 精英词缀：任意怪都能带一个 */
  elite: { hpMul: 1.8, affix: { enrage: { speed: 1.4, dmg: 1.5, hp: 1.2 }, swift: { speed: 1.1, windup: 0.7 }, split: {}, shield: {} } },
  /* 第二只 Boss：蓝武士（横斩 / 突进斩 / 召小怪） */
  bossB: { hp: 34, speed: 58, dmg: 4, at: 0.5, slashWindup: 420, slashDmg: 4, slashReach: 96, slashWidth: 120,
    chargeWindup: 480, chargeSpeed: 230, chargeTime: 300, chargeDmg: 5, summonCd: 2600, summonCount: 2 },
  /* 批 10：巨浣熊（跃扑 + 抓击；半血后更急） */
  racoonBoss: { pounceWindup: 440, pounceAir: 340, pounceRadius: 74, pounceDmg: 4,
    swipeWindup: 300, swipeHit: 160, swipeReach: 64, swipeDmg: 3, at: 0.5, speedMul: 1.25 },
  cycle: { hpMul: 0.15, bossMul: 0.2, legacyPower: 1 },
  upgrades: { dropChance: 0.35, powerStep: 1, speedStep: 0.12, atkStep: 0.15, minAtkMul: 0.4 },
  boss2: { at: 0.5, roarMs: 650, slamWindup: 520, slamAir: 460, slamRadius: 78, slamDmg: 4, speedMul: 1.3, windupMul: 0.75 },
  /* 打击表现：顿帧分级、震屏分级、闪屏强度。全是可调数值，改 balance.json 即可 */
  feel: {
    stopLight: 42, stopKill: 78, stopHurt: 95, stopSlam: 130, stopPhase: 190,
    shakeLightMs: 70, shakeLightMag: 0.005,
    shakeHitMs: 95, shakeHitMag: 0.009,
    shakeHeavyMs: 210, shakeHeavyMag: 0.019,
    shakeBossMs: 340, shakeBossMag: 0.028,
    flashHurt: 0.26, flashSlam: 0.3, flashPhase: 0.26,
  },
};

const DIRS = { down: 0, up: 1, left: 2, right: 3 };
const ANGLE = { down: Math.PI / 2, up: -Math.PI / 2, left: Math.PI, right: 0 };
const VEC = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
const DOOR_VEC = { l: [-1, 0], r: [1, 0], u: [0, -1], d: [0, 1] };
const OPPOSITE = { l: 'r', r: 'l', u: 'd', d: 'u' };

function logicalSize() {
  const a = window.innerWidth / window.innerHeight;
  if (a >= 1) {
    const H = MINOR;
    return { W: Math.min(MAX_MAJOR, Math.max(MINOR, Math.round(H * a))), H };
  }
  const W = MINOR;
  return { W, H: Math.min(MAX_MAJOR, Math.max(MINOR, Math.round(W / a))) };
}
const S = logicalSize();

/* ---------- 地牢生成：3×3 网格随机游走，从 (0,0) 走到 (2,2) ---------- */

export { TILE, COLS, ROWS, RW, RH, MINOR, MAX_MAJOR, FONT, CFG, DIRS, ANGLE, VEC, DOOR_VEC, OPPOSITE, logicalSize, S };
