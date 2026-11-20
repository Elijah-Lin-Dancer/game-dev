/* 武器表：web/data/weapons.json → 归一化结构
 *
 * 和 balance.js 同一套思路：能调的数值放 JSON，结构常量与白名单留在代码里。
 * 任何字段缺失/类型不对都退回内置默认值，保证"JSON 写坏了游戏还能打"。
 * 新增武器 = JSON 里加一条 + 图集里加两张图（图标、手持），不改战斗代码。
 */

const DEFAULT_LIST = [
  { id: 'katana', name: '忍者刀', kind: 'melee', icon: 'wKatana', inhand: 'hKatana', dmgMul: 1, cd: 280, reach: 30, box: [34, 30], knock: 120, fx: 'slA', fxScale: 2.2, hitHeavy: 0, sfx: 'sword' },
  { id: 'bigsword', name: '巨剑', kind: 'melee', icon: 'wBigSword', inhand: 'hBigSword', dmgMul: 2, cd: 480, reach: 38, box: [46, 36], knock: 170, fx: 'slB', fxScale: 2.7, hitHeavy: 1, sfx: 'sword' },
  { id: 'hammer', name: '战锤', kind: 'melee', icon: 'wHammer', inhand: 'hHammer', dmgMul: 2.8, cd: 720, reach: 32, box: [42, 42], knock: 210, fx: 'slC', fxScale: 2.9, hitHeavy: 2, sfx: 'sword' },
  { id: 'bow', name: '短弓', kind: 'ranged', icon: 'wBow', inhand: null, dmgMul: 1.2, cd: 460, reach: 0, box: [0, 0], knock: 60, proj: 'arrow', projSpeed: 300, projLife: 700, pierce: 0, sfx: 'sword' },
  { id: 'wand', name: '魔杖', kind: 'ranged', icon: 'wWand', inhand: 'hWand', dmgMul: 1.5, cd: 600, reach: 0, box: [0, 0], knock: 40, proj: 'fireball', projSpeed: 210, projLife: 900, projAnim: 'fireball-play', pierce: 0, sfx: 'magic' },
  { id: 'kunai', name: '苦无', kind: 'throw', icon: 'wKunai', inhand: 'hKunai', dmgMul: 1.1, cd: 400, reach: 0, box: [0, 0], knock: 80, proj: 'kunaiProj', projSpeed: 330, projLife: 650, pierce: 2, sfx: 'sword' },
];

const KIND = ['melee', 'ranged', 'throw'];
const num = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const str = (v, d) => (typeof v === 'string' && v ? v : d);

function pick(raw, i) {
  const d = DEFAULT_LIST[Math.min(i, DEFAULT_LIST.length - 1)];
  const box = Array.isArray(raw.box) && raw.box.length === 2 && raw.box.every((n) => typeof n === 'number')
    ? raw.box : d.box;
  return {
    id: str(raw.id, d.id),
    name: str(raw.name, d.name),
    kind: KIND.indexOf(raw.kind) >= 0 ? raw.kind : d.kind,
    icon: str(raw.icon, d.icon),
    inhand: raw.inhand === null ? null : str(raw.inhand, d.inhand),
    dmgMul: Math.max(0.2, num(raw.dmgMul, d.dmgMul)),
    cd: Math.max(120, num(raw.cd, d.cd)),
    reach: Math.max(0, num(raw.reach, d.reach)),
    box: box.map((n) => Math.max(0, n)),
    knock: num(raw.knock, d.knock),
    fx: str(raw.fx, d.fx),
    fxScale: Math.max(1, num(raw.fxScale, d.fxScale)),
    hitHeavy: Math.max(0, Math.min(2, num(raw.hitHeavy, d.hitHeavy))),
    sfx: str(raw.sfx, d.sfx),
    proj: str(raw.proj, d.proj || ''),
    projSpeed: Math.max(60, num(raw.projSpeed, d.projSpeed || 280)),
    projLife: Math.max(200, num(raw.projLife, d.projLife || 700)),
    projAnim: str(raw.projAnim, d.projAnim || ''),
    pierce: Math.max(0, num(raw.pierce, d.pierce || 0)),
  };
}

export function normalizeWeapons(json) {
  const g = (json && typeof json.global === 'object' && json.global) || {};
  const rawList = json && Array.isArray(json.list) && json.list.length ? json.list : DEFAULT_LIST;
  const list = rawList.map((w, i) => pick(w || {}, i));
  const byId = {};
  list.forEach((w) => { byId[w.id] = w; });
  const global = {
    dropChance: Math.min(1, Math.max(0, num(g.dropChance, 0.07))),
    bossExtra: Math.max(0, Math.min(3, num(g.bossExtra, 1))),
    startWeapon: byId[g.startWeapon] ? g.startWeapon : list[0].id,
    swapKeepOld: g.swapKeepOld !== false,
  };
  return { global, list, byId };
}

/* 随机一件"不是手上这件"的武器，用来做掉落 */
export function rollWeapon(W, excludeId) {
  const pool = W.list.filter((w) => w.id !== excludeId);
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
