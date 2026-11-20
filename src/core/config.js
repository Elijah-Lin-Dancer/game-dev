/* 全局常量与手感数值。改数值只改这里。 */
const TILE = 32;            // 16px 美术 × 2 倍
const COLS = 24, ROWS = 26; // 房间格数：768 × 832 世界像素
const RW = COLS * TILE, RH = ROWS * TILE;
const MINOR = 360, MAX_MAJOR = 800;

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
  cycle: { hpMul: 0.15, bossMul: 0.2, legacyPower: 1 },
  upgrades: { dropChance: 0.35, powerStep: 1, speedStep: 0.12, atkStep: 0.15, minAtkMul: 0.4 },
  boss2: { at: 0.5, roarMs: 650, slamWindup: 520, slamAir: 460, slamRadius: 78, slamDmg: 4, speedMul: 1.3, windupMul: 0.75 },
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

export { TILE, COLS, ROWS, RW, RH, MINOR, MAX_MAJOR, CFG, DIRS, ANGLE, VEC, DOOR_VEC, OPPOSITE, logicalSize, S };
