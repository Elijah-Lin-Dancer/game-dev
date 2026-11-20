/* 版本化存档：只存"跨局"的东西（累计金币、击杀、最深、通关次数、静音）
 * 局内血量/房间不进存档——roguelike 的每一局都该从零开始。
 * 读坏了不抛错、不崩游戏：解析失败就当新档，并且保留坏档副本供排查。
 */
const KEY = 'na.save';
const VERSION = 4;

const defaults = () => ({
  v: VERSION,
  coins: 0,          // 累计金币（跨局）
  kills: 0,
  runs: 0,
  wins: 0,
  bestRoom: 0,       // 到过的最深房间序号
  cycle: 1,          // 周目：通关一次 +1，新一局继承一点强度
  muted: false,
  roomsSeen: {},     // 各房型进过的次数（图鉴用，批 7 消费）
  lastChar: 'ninja', // 上次选的角色（批 5）
  chars: ['ninja', 'mage', 'knight'], // 已解锁角色（默认三只全开）
  updatedAt: 0,
});

const num = (v, d = 0) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : d);

/* 房型计数：只保留已知房型的非负整数，坏值丢掉，不让存档把一个奇怪的键带进图鉴 */
const SEEN_KEYS = ['battle', 'elite', 'treasure', 'shop', 'shrine', 'rest', 'boss'];
function sanitizeSeen(v) {
  const out = {};
  if (!v || typeof v !== 'object') return out;
  SEEN_KEYS.forEach((k) => { out[k] = num(v[k]); });
  return out;
}

/* 角色解锁表：只允许三只已知角色，去重后按固定顺序；旧档没有就全开 */
const CHARS = ['ninja', 'mage', 'knight'];
function sanitizeChars(v) {
  if (!Array.isArray(v)) return CHARS.slice();
  const list = CHARS.filter((id) => v.includes(id));
  return list.length ? list : CHARS.slice();
}

/* v1 → v2：v1 只有 coins/kills，缺的字段补齐即可，不需要丢弃 */
function migrate(old) {
  const base = defaults();
  if (!old || typeof old !== 'object') return base;
  return {
    ...base,
    coins: num(old.coins), kills: num(old.kills), runs: num(old.runs),
    wins: num(old.wins), bestRoom: num(old.bestRoom),
    cycle: Math.max(1, num(old.cycle, 1)),
    muted: !!old.muted, updatedAt: num(old.updatedAt),
    roomsSeen: sanitizeSeen(old.roomsSeen),
    lastChar: ['ninja', 'mage', 'knight'].includes(old.lastChar) ? old.lastChar : 'ninja',
    chars: sanitizeChars(old.chars),
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
  next.cycle = Math.max(1, num(next.cycle, 1));
  next.roomsSeen = sanitizeSeen(next.roomsSeen);
  next.chars = sanitizeChars(next.chars);
  if (!CHARS.includes(next.lastChar)) next.lastChar = 'ninja';
  return writeSave(next);
}

export function resetSave() {
  try { localStorage.removeItem(KEY); } catch (e) {}
  return defaults();
}

export function saveVersion() { return VERSION; }
