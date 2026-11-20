/* 版本化存档：只存"跨局"的东西（累计金币、击杀、最深、通关次数、静音）
 * 局内血量/房间不进存档——roguelike 的每一局都该从零开始。
 * 读坏了不抛错、不崩游戏：解析失败就当新档，并且保留坏档副本供排查。
 */
const KEY = 'na.save';
const VERSION = 2;

const defaults = () => ({
  v: VERSION,
  coins: 0,          // 累计金币（跨局）
  kills: 0,
  runs: 0,
  wins: 0,
  bestRoom: 0,       // 到过的最深房间序号
  muted: false,
  updatedAt: 0,
});

const num = (v, d = 0) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : d);

/* v1 → v2：v1 只有 coins/kills，缺的字段补齐即可，不需要丢弃 */
function migrate(old) {
  const base = defaults();
  if (!old || typeof old !== 'object') return base;
  return {
    ...base,
    coins: num(old.coins), kills: num(old.kills), runs: num(old.runs),
    wins: num(old.wins), bestRoom: num(old.bestRoom),
    muted: !!old.muted, updatedAt: num(old.updatedAt),
    v: VERSION,
  };
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw);
    return migrate(parsed);
  } catch (e) {
    try { localStorage.setItem(KEY + '.broken', String(localStorage.getItem(KEY))); } catch (_) {}
    return defaults();
  }
}

export function writeSave(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  return state;
}

export function patchSave(patch) {
  const next = { ...loadSave(), ...patch, v: VERSION, updatedAt: Date.now() };
  next.coins = num(next.coins); next.kills = num(next.kills); next.runs = num(next.runs);
  next.wins = num(next.wins); next.bestRoom = num(next.bestRoom);
  return writeSave(next);
}

export function resetSave() {
  try { localStorage.removeItem(KEY); } catch (e) {}
  return defaults();
}

export function saveVersion() { return VERSION; }
