/* G0 开放世界独立存档：只记远征进度，不碰主线 na.save
 *
 * 设计边界：
 *   - 只存跨场景/跨刷新需要保留的少量字段：到过哪些屏、草药数量、村医委托状态；
 *   - 位置、采集读条、天气粒子都是场景态，不进存档；
 *   - 读坏档不抛错，保留 na.world.broken 方便排查。
 */
const KEY = 'na.world';
const VERSION = 1;
const SCREENS = ['field', 'bamboo', 'desert'];
const QUESTS = ['none', 'active', 'done'];

const defaults = () => ({
  v: VERSION,
  visited: [],
  herbs: 0,
  quest: 'none',
  tokens: 0,
  updatedAt: 0,
});

const num = (v, d = 0) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : d);

function sanitizeVisited(v) {
  if (!Array.isArray(v)) return [];
  return SCREENS.filter((id) => v.includes(id));
}

function migrate(old) {
  const base = defaults();
  if (!old || typeof old !== 'object') return base;
  return {
    ...base,
    visited: sanitizeVisited(old.visited),
    herbs: Math.min(99, Math.round(num(old.herbs))),
    quest: QUESTS.includes(old.quest) ? old.quest : 'none',
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
  next.tokens = Math.min(99, Math.round(num(next.tokens)));
  return writeWorldSave(next);
}

export function resetWorldSave() {
  try { localStorage.removeItem(KEY); } catch (e) {}
  return defaults();
}

export function worldSaveVersion() { return VERSION; }
