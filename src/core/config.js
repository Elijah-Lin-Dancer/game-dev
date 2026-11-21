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
  /* 批 11：沙海遗迹 / 沉水神殿的十只小怪。每只保留一个可读的"破法" */
  snake: { hp: 7, speed: 58, dmg: 2, half: 10, weave: 26, weaveHz: 4.2 },
  reptile: { hp: 13, speed: 24, dmg: 3, half: 14 },
  lizard: { hp: 8, speed: 42, dmg: 3, half: 10, dashSpeed: 214, dashTime: 260, dashCd: 1500, dashRange: 200, windup: 360 },
  mollusc: { hp: 16, speed: 14, dmg: 4, half: 15 },
  mouse: { hp: 5, speed: 74, dmg: 2, half: 9, dashSpeed: 188, dashTime: 150, dashCd: 760, dashRange: 150 },
  fish: { hp: 8, speed: 34, dmg: 3, half: 10, dashSpeed: 208, dashTime: 260, dashCd: 1350, dashRange: 190, windup: 320 },
  octopus: { hp: 11, speed: 24, dmg: 2, half: 12, shotCd: 1550, shotSpeed: 118, shotDmg: 2, keepMin: 105, keepMax: 230, range: 380, inkSlow: 0.5, inkSlowMs: 1200 },
  kappa: { hp: 14, speed: 30, dmg: 3, half: 12, shieldCd: 3000, shieldMs: 1500 },
  axolot: { hp: 10, speed: 30, dmg: 2, half: 11, shotCd: 1650, shotSpeed: 105, shotDmg: 2, healCd: 2400, heal: 1, range: 360 },
  /* 批 12A：熔岩地心五只小怪。全部保留一个可读的“破法” */
  flam: { hp: 9, speed: 38, dmg: 2, half: 10, shotCd: 1700, shotSpeed: 126, shotDmg: 2, keepMin: 95, keepMax: 220, range: 360, windup: 280 },
  dragon: { hp: 14, speed: 28, dmg: 3, half: 14, shotCd: 2300, shotSpeed: 112, shotDmg: 2, keepMin: 150, keepMax: 300, range: 420, windup: 420, spread: 3 },
  demon: { hp: 15, speed: 46, dmg: 4, half: 14, chargeCd: 1600, chargeSpeed: 220, chargeTime: 240, chargeRange: 210, windup: 380 },
  lantern: { hp: 7, speed: 22, dmg: 2, half: 10, shotCd: 2000, shotSpeed: 96, shotDmg: 2, keepMin: 110, keepMax: 210, range: 380, homing: 0.35 },
  spirit: { hp: 8, speed: 40, dmg: 2, half: 9, shotCd: 1800, shotSpeed: 120, shotDmg: 2, keepMin: 100, keepMax: 200, range: 380, burst: 3 },
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
  /* 批 11：天狗（飞行扇射 + 俯冲）/ 魂灵（瞬移环形弹）/ 恶魔独眼（冲撞 + 震地 + 召唤） */
  tenguBoss: {
    at: 0.5, roarMs: 620, speed: 78, speedMul: 1.25, fanWindup: 380, fanCd: 950, fanCount: 3, fanCount2: 5,
    fanSpread: 0.34, fanSpeed: 150, fanDmg: 2, diveWindup: 320, diveTime: 240, diveSpeed: 255, diveDmg: 4,
    keepMin: 180, keepMax: 270, bob: 3.2,
  },
  spiritBoss: {
    at: 0.5, speed: 36, speedMul: 1.2, castWindup: 430, castCd: 1150, burst: 6, burst2: 8,
    orbSpeed: 108, orbDmg: 2, blinkCd: 1700, blinkMs: 260, keepMin: 120, keepMax: 210,
  },
  demonBoss: {
    at: 0.5, speed: 48, speedMul: 1.3, chargeWindup: 440, chargeTime: 300, chargeSpeed: 235, chargeDmg: 4,
    slamWindup: 520, slamRadius: 72, slamDmg: 4, summonCd: 3000, summonCount: 2, windupMul: 0.78,
  },
  /* 批 12A：炎狱巨灵（扇射 + 近身火环；半血更急） */
  flamBoss: {
    at: 0.5, speed: 44, speedMul: 1.2, castWindup: 480, castCd: 1500, burst: 4, burst2: 6,
    orbSpeed: 145, orbDmg: 2, ringRadius: 92, ringDmg: 3, keepMin: 110, keepMax: 240,
  },
  /* 批 12B：影织者。三幕：影袭追击 → 影仆+环形弹 → 星火火雨 */
  weaverBoss: {
    at1: 0.66, at2: 0.33,
    speed: 52, speed3: 66,
    dashWindup: 430, dashTime: 260, dashSpeed: 250, dashCd: 1150,
    blinkCd: 2600, blinkMs: 260, keepMin: 120, keepMax: 190,
    summonCd: 4200, summonCount: 2,
    castWindup: 480, castCd: 2100, burst: 12, burst3: 16,
    orbSpeed: 112, orbDmg: 2, rainCd: 1600, rainCount: 4,
  },
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
