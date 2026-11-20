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
    // 房间怪数上下限要自洽，别配出 5..3
  if (CFG.roomEnemiesMax < CFG.roomEnemiesMin) {
    CFG.roomEnemiesMax = CFG.roomEnemiesMin;
    applied.push('roomEnemiesMax 已夹到 roomEnemiesMin');
  }
  return applied;
}

export function balanceDigest() { return applied.slice(); }
