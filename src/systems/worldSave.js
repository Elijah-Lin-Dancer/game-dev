/* 开放世界独立存档：只记远征进度，不碰主线 na.save
 *
 * G1 v2：
 *   - 六屏草原（field-1 … field-6），旧 G0 的 field/bamboo/desert 映射到 field-1/field-3/field-6；
 *   - 新增 boss: none / done；战斗中的 HP、Boss 血量、坐标都是场景态，不进档；
 *   - 坏档保留 na.world.broken，读档失败回默认。
 */
const KEY = 'na.world';
const VERSION = 2;
const SCREENS = ['field-1', 'field-2', 'field-3', 'field-4', 'field-5', 'field-6'];
const LEGACY_SCREEN = { field: 'field-1', bamboo: 'field-3', desert: 'field-6' };
const QUESTS = ['none', 'active', 'done'];
const BOSSES = ['none', 'done'];

const defaults = () => ({
  v: VERSION,
  visited: [],
  herbs: 0,
  quest: 'none',
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
    return migrate(JSON.parse(raw));
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
  next.boss = BOSSES.includes(next.boss) ? next.boss : 'none';
  next.tokens = Math.min(99, Math.round(num(next.tokens)));
  return writeWorldSave(next);
}

export function resetWorldSave() {
  try { localStorage.removeItem(KEY); } catch (e) {}
  return defaults();
}

export function worldSaveVersion() { return VERSION; }
