/* 平衡数值外部化：web/data/balance.json → CFG
 * 只覆盖白名单里的数值字段，结构常量（格子尺寸、网格）仍留在代码里，
 * 避免把"能调的数"和"能改的架构"混在一起。
 * 加载失败（file:// 双击、断网）时退回构建期内嵌的同一份 JSON。
 */
import { CFG } from '../core/config.js';

const MAP = [
  ['player.maxHp', 'maxHp'],
  ['player.touchDmg', 'touchDmg'],
  ['player.playerDmg', 'playerDmg'],
  ['player.atkCd', 'atkCd'],
  ['player.atkReach', 'atkReach'],
  ['player.iFrame', 'iFrame'],
  ['beast.hp', 'enemyHp'],
  ['beast.speed', 'enemySpeed'],
  ['beast.chaseRange', 'chaseRange'],
  ['beast.stuckMs', 'beastStuckMs'],
  ['beast.slideMs', 'beastSlideMs'],
  ['boss.hp', 'bossHp'],
  ['boss.speed', 'bossSpeed'],
  ['boss.dmg', 'bossDmg'],
  ['boss.windup', 'bossWindup'],
  ['boss.lungeSpeed', 'bossLungeSpeed'],
  ['boss.lungeTime', 'bossLungeTime'],
  ['boss.recover', 'bossRecover'],
  ['boss.lungeReach', 'bossLungeReach'],
  ['camera.lerp', 'camLerp'],
  ['camera.lookAhead', 'camLookAhead'],
  ['drops.healAmount', 'healAmount'],
  ['drops.coinChance', 'coinChance'],
  ['drops.heartChance', 'heartChance'],
  ['dungeon.roomEnemiesMin', 'roomEnemiesMin'],
  ['dungeon.roomEnemiesMax', 'roomEnemiesMax'],
];

const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

/* 结构化分组（敌人档、强化、Boss 二阶段）：只覆盖默认里已有的数字字段，防止 JSON 塞进陌生键 */
const GROUPS = ['cyclope', 'eye', 'larva', 'upgrades', 'boss2'];

function mergeNumbers(target, src) {
  if (!src || typeof src !== 'object') return;
  for (const k of Object.keys(target)) {
    const t = target[k], v = src[k];
    if (typeof t === 'number') { if (typeof v === 'number' && Number.isFinite(v)) target[k] = v; }
    else if (t && typeof t === 'object') mergeNumbers(t, v);
  }
}

let applied = [];

export function applyBalance(json) {
  if (!json) return applied;
  applied = [];
  for (const [path, key] of MAP) {
    const v = get(json, path);
    if (typeof v !== 'number' || !Number.isFinite(v)) continue;
    CFG[key] = v;
    applied.push(`${key}=${v}`);
  }
    for (const g of GROUPS) {
    if (json[g] && typeof json[g] === 'object' && CFG[g]) {
      mergeNumbers(CFG[g], json[g]);
      applied.push(`${g}:merge`);
    }
  }
  // 房间怪数上下限要自洽，别配出 5..3
  if (CFG.roomEnemiesMax < CFG.roomEnemiesMin) {
    CFG.roomEnemiesMax = CFG.roomEnemiesMin;
    applied.push('roomEnemiesMax 已夹到 roomEnemiesMin');
  }
  return applied;
}

export function balanceDigest() { return applied.slice(); }
