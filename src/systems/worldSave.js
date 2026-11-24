/* 开放世界独立存档：只记远征进度，不碰主线 na.save
 *
 * G2-4 v6：
 *   - 草原 6 + 竹林 6 + 沙漠 6 + 雪原 6 + 火山 6（field-1 … volcano-6）；
 *   - 新增 volcanoQuest / volcanoHerbs；前四群系字段保持不变；
 *   - 旧 G0 的 field/bamboo/desert 仍映射到 field-1/field-3/field-6；
 *   - 战斗中的 HP、Boss 血量、坐标都是场景态，不进档；
 *   - 坏档保留 na.world.broken，读档失败回默认。
 */
const KEY = 'na.world';
const VERSION = 6;
const SCREENS = [
  'field-1', 'field-2', 'field-3', 'field-4', 'field-5', 'field-6',
  'bamboo-1', 'bamboo-2', 'bamboo-3', 'bamboo-4', 'bamboo-5', 'bamboo-6',
  'desert-1', 'desert-2', 'desert-3', 'desert-4', 'desert-5', 'desert-6',
  'snow-1', 'snow-2', 'snow-3', 'snow-4', 'snow-5', 'snow-6',
  'volcano-1', 'volcano-2', 'volcano-3', 'volcano-4', 'volcano-5', 'volcano-6',
];
const LEGACY_SCREEN = { field: 'field-1', bamboo: 'field-3', desert: 'field-6' };
const QUESTS = ['none', 'active', 'done'];
const BOSSES = ['none', 'done'];

const defaults = () => ({
  v: VERSION,
  visited: [],
  herbs: 0,
  quest: 'none',
  bambooHerbs: 0,
  bambooQuest: 'none',
  desertHerbs: 0,
  desertQuest: 'none',
  snowHerbs: 0,
  snowQuest: 'none',
  volcanoHerbs: 0,
  volcanoQuest: 'none',
  boss: 'none',
  tokens: 0,
  updatedAt: 0,
});

const num = (v, d = 0) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : d);

function sanitizeVisited(v) {
  if (!Array.isArray(v)) return [];
  const mapped = v.map((id) => LEGACY_SCREEN[id] || id);
  return SCREENS.filter((id) => mapped.includes(id));
}

function migrate(old) {
  const base = defaults();
  if (!old || typeof old !== 'object') return base;
  return {
    ...base,
    visited: sanitizeVisited(old.visited),
    herbs: Math.min(99, Math.round(num(old.herbs))),
    quest: QUESTS.includes(old.quest) ? old.quest : 'none',
    bambooHerbs: Math.min(99, Math.round(num(old.bambooHerbs))),
    bambooQuest: QUESTS.includes(old.bambooQuest) ? old.bambooQuest : 'none',
    desertHerbs: Math.min(99, Math.round(num(old.desertHerbs))),
    desertQuest: QUESTS.includes(old.desertQuest) ? old.desertQuest : 'none',
    snowHerbs: Math.min(99, Math.round(num(old.snowHerbs))),
    snowQuest: QUESTS.includes(old.snowQuest) ? old.snowQuest : 'none',
    volcanoHerbs: Math.min(99, Math.round(num(old.volcanoHerbs))),
    volcanoQuest: QUESTS.includes(old.volcanoQuest) ? old.volcanoQuest : 'none',
    boss: BOSSES.includes(old.boss) ? old.boss : 'none',
    tokens: Math.min(99, Math.round(num(old.tokens))),
    updatedAt: num(old.updatedAt),
    v: VERSION,
  };
}

export function loadWorldSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw);
    const migrated = migrate(parsed);
    if (parsed && parsed.v !== VERSION) writeWorldSave(migrated);
    return migrated;
  } catch (e) {
    try { localStorage.setItem(KEY + '.broken', String(localStorage.getItem(KEY))); } catch (_) {}
    return defaults();
  }
}

export function writeWorldSave(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  return state;
}

export function patchWorldSave(patch) {
  const next = { ...loadWorldSave(), ...patch, v: VERSION, updatedAt: Date.now() };
  next.visited = sanitizeVisited(next.visited);
  next.herbs = Math.min(99, Math.round(num(next.herbs)));
  next.quest = QUESTS.includes(next.quest) ? next.quest : 'none';
  next.bambooHerbs = Math.min(99, Math.round(num(next.bambooHerbs)));
  next.bambooQuest = QUESTS.includes(next.bambooQuest) ? next.bambooQuest : 'none';
  next.desertHerbs = Math.min(99, Math.round(num(next.desertHerbs)));
  next.desertQuest = QUESTS.includes(next.desertQuest) ? next.desertQuest : 'none';
  next.snowHerbs = Math.min(99, Math.round(num(next.snowHerbs)));
  next.snowQuest = QUESTS.includes(next.snowQuest) ? next.snowQuest : 'none';
  next.volcanoHerbs = Math.min(99, Math.round(num(next.volcanoHerbs)));
  next.volcanoQuest = QUESTS.includes(next.volcanoQuest) ? next.volcanoQuest : 'none';
  next.boss = BOSSES.includes(next.boss) ? next.boss : 'none';
  next.tokens = Math.min(99, Math.round(num(next.tokens)));
  return writeWorldSave(next);
}

export function resetWorldSave() {
  try { localStorage.removeItem(KEY); } catch (e) {}
  return defaults();
}

export function worldSaveVersion() { return VERSION; }
