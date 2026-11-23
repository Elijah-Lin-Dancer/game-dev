/* 批 13：锻造坊数据层
 *
 * 只负责“武器 id → 锻造等级 → 伤害乘区”的纯函数，不碰场景、不碰 UI。
 * 存档里的 forge 是一个小对象：{ katana: 2, bigsword: 3 }；缺省按 Lv.1。
 * Lv.4 需要支线图纸：普通升级封顶 Lv.3，蓝图解锁后才是 Lv.4。
 */

export const FORGE_LEVELS = [
  null,
  { lv: 1, mul: 1.00, cost: 0, label: 'Lv.1', name: '原胚', desc: '基础锻造，无额外加成' },
  { lv: 2, mul: 1.20, cost: 60, label: 'Lv.2', name: '淬火', desc: '伤害 +20%' },
  { lv: 3, mul: 1.35, cost: 140, label: 'Lv.3', name: '重铸', desc: '伤害 +35%' },
  { lv: 4, mul: 1.50, cost: 260, label: 'Lv.4', name: '星火', desc: '伤害 +50%', blueprint: true },
];
export const FORGE_MAX = 3;
export const FORGE_BLUEPRINT_MAX = 4;

const clampLv = (n) => Math.max(1, Math.min(FORGE_BLUEPRINT_MAX, Math.round(Number(n) || 1)));
const levelOf = (lv) => FORGE_LEVELS[clampLv(lv)] || FORGE_LEVELS[1];

export function forgeLevel(meta, weaponId) {
  const raw = meta && meta.forge && meta.forge[weaponId];
  return clampLv(raw);
}

export function forgeLevelData(lv) {
  return levelOf(lv);
}

export function forgeNext(meta, weaponId) {
  const lv = forgeLevel(meta, weaponId);
  if (lv >= FORGE_BLUEPRINT_MAX) return null;
  return levelOf(lv + 1);
}

export function forgeCost(lv) {
  return Math.max(0, Number(levelOf(lv).cost) || 0);
}

export function hasBlueprint(meta, weaponId) {
  return !!(meta && Array.isArray(meta.blueprints) && meta.blueprints.indexOf(weaponId) >= 0);
}

export function forgeMul(meta, weaponId) {
  return levelOf(forgeLevel(meta, weaponId)).mul;
}

export function forgeBonus(lv) {
  return Math.round((levelOf(lv).mul - 1) * 100);
}

/* 把锻造倍率乘进 normalizeWeapons 的产物；保留原值以便 UI 展示。 */
export function applyForgeLevels(normalized, meta) {
  if (!normalized || !Array.isArray(normalized.list)) return normalized;
  normalized.list.forEach((w) => {
    w.forgeLv = forgeLevel(meta, w.id);
    w.forgeRawDmgMul = w.dmgMul;
    w.dmgMul = Math.round(w.dmgMul * levelOf(w.forgeLv).mul * 100) / 100;
  });
  return normalized;
}
