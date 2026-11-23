/* 版本化存档：只存"跨局"的东西（累计金币、击杀、最深、通关次数、静音）
 * 局内血量/房间不进存档——roguelike 的每一局都该从零开始。
 * 读坏了不抛错、不崩游戏：解析失败就当新档，并且保留坏档副本供排查。
 */
const KEY = 'na.save';
const VERSION = 9;

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
  chars: ['ninja'],  // 已解锁角色（批 7 起默认只有忍者，法师/骑士用宝石解锁）
  gem: 0,            // 宝石（批 7）：Boss 掉 1–3、通关 +5，只用于解锁
  unlockedWeapons: ['katana', 'bigsword', 'wand', 'kunai'], // 已解锁武器（bow/hammer 要买）
  // 批 13：锻造等级。键 = 武器 id，值 = 2..4；缺省/1 都是 Lv.1
  forge: {},
  // 批 13：支线图纸。只有拿到对应武器图纸，锻造才能进 Lv.4
  blueprints: [],
  // 批 14：累计拾取的资源（强化道具 / 钥匙 / 回血），用于商队遗骸等条件
  resources: 0,
  // 批 14：某关无伤 / 未用休整房通关记录；键为 "章:关" 或 "sp_<id>:1"
  noHit: {},
  noRest: {},
  // 批 14：称号与支线奖励标记
  titles: [],
  flags: {},
  seen: { enemies: {}, weapons: {}, bosses: {}, rooms: {} }, // 图鉴点亮记录
  // 批 9：章节星级。键 = "章:关"（关从 1 起），值 0–3；0/缺省都算没打过
  stars: {},
  // 批 13：逐章难度。键 = 章 id，值 = normal | nightmare | hell
  diffSel: {},
  // 噩梦/地狱星级。键 = "章:关"，值 = { nightmare:1..3, hell:1..3 }
  tierStars: {},
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

/* 图鉴点亮表：只收"键 → 1"，键做长度与字符白名单，避免坏档塞进巨型键 */
function sanitizeMarks(v) {
  const out = {};
  if (!v || typeof v !== 'object') return out;
  Object.keys(v).slice(0, 200).forEach((k) => {
    if (/^[a-zA-Z0-9_-]{1,24}$/.test(k) && v[k]) out[k] = 1;
  });
  return out;
}

/* 武器解锁表：只允许入库里出现过的 id，且至少保留一把起始武器 */
const WEAPONS = ['katana', 'bigsword', 'hammer', 'bow', 'wand', 'kunai'];
function sanitizeWeapons(v) {
  if (!Array.isArray(v)) return defaults().unlockedWeapons;
  const list = WEAPONS.filter((id) => v.includes(id));
  if (!list.includes('katana')) list.unshift('katana');
  return list;
}

/* 锻造等级：只允许已入库武器，值夹到 1–4；Lv.1 不写，避免空对象膨胀 */
function sanitizeForge(v) {
  const out = {};
  if (!v || typeof v !== 'object') return out;
  WEAPONS.forEach((id) => {
    const lv = Math.max(1, Math.min(4, Math.round(num(v[id], 1))));
    if (lv > 1) out[id] = lv;
  });
  return out;
}

/* 图纸：只允许已入库武器 id，不重复 */
function sanitizeBlueprints(v) {
  if (!Array.isArray(v)) return [];
  return WEAPONS.filter((id) => v.includes(id));
}

/* 关卡记录：键必须是 "章:关" 或 "sp_<id>:1"，只存 1；旧档没有就空对象 */
function sanitizeStageMarks(v) {
  const out = {};
  if (!v || typeof v !== 'object') return out;
  Object.keys(v).slice(0, 260).forEach((k) => {
    if (/^[a-z][a-z0-9_-]{0,24}:\d{1,2}$/i.test(k) && v[k]) out[k] = 1;
  });
  return out;
}

const TITLES = ['poor'];
function sanitizeTitles(v) {
  if (!Array.isArray(v)) return [];
  return TITLES.filter((id) => v.includes(id));
}

const FLAGS = ['merchant', 'skillDiscount', 'fireEnchant', 'epilogue'];
function sanitizeFlags(v) {
  const out = {};
  if (!v || typeof v !== 'object') return out;
  FLAGS.forEach((k) => { if (v[k]) out[k] = 1; });
  return out;
}

/* 星级表：键必须匹配 "章:关"，值夹到 0–3；坏键直接丢掉，避免存档被垃圾键撑大 */
function sanitizeStars(v) {
  const out = {};
  if (!v || typeof v !== 'object') return out;
  Object.keys(v).slice(0, 200).forEach((k) => {
    if (!/^[a-z][a-z0-9_-]{0,20}:\d{1,2}$/i.test(k)) return;
    const n = Math.max(0, Math.min(3, Math.round(num(v[k], 0))));
    if (n > 0) out[k] = n;
  });
  return out;
}

const TIERS = ['normal', 'nightmare', 'hell'];
function sanitizeDiffSel(v) {
  const out = {};
  if (!v || typeof v !== 'object') return out;
  Object.keys(v).slice(0, 40).forEach((k) => {
    if (!/^[a-z][a-z0-9_-]{0,20}$/i.test(k)) return;
    if (TIERS.includes(v[k])) out[k] = v[k];
  });
  return out;
}

function sanitizeTierStars(v) {
  const out = {};
  if (!v || typeof v !== 'object') return out;
  Object.keys(v).slice(0, 200).forEach((k) => {
    if (!/^[a-z][a-z0-9_-]{0,20}:\d{1,2}$/i.test(k)) return;
    const raw = v[k];
    if (!raw || typeof raw !== 'object') return;
    const slot = {};
    ['nightmare', 'hell'].forEach((tier) => {
      const n = Math.max(0, Math.min(3, Math.round(num(raw[tier], 0))));
      if (n > 0) slot[tier] = n;
    });
    if (Object.keys(slot).length) out[k] = slot;
  });
  return out;
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
    forge: sanitizeForge(old.forge),
    blueprints: sanitizeBlueprints(old.blueprints),
    resources: Math.floor(num(old.resources)),
    noHit: sanitizeStageMarks(old.noHit),
    noRest: sanitizeStageMarks(old.noRest),
    titles: sanitizeTitles(old.titles),
    flags: sanitizeFlags(old.flags),
    gem: num(old.gem),
    stars: sanitizeStars(old.stars),
    diffSel: sanitizeDiffSel(old.diffSel),
    tierStars: sanitizeTierStars(old.tierStars),
    unlockedWeapons: sanitizeWeapons(old.unlockedWeapons),
    seen: {
      enemies: sanitizeMarks(old.seen && old.seen.enemies),
      weapons: sanitizeMarks(old.seen && old.seen.weapons),
      bosses: sanitizeMarks(old.seen && old.seen.bosses),
      rooms: sanitizeMarks(old.seen && old.seen.rooms),
    },
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
  next.forge = sanitizeForge(next.forge);
  next.blueprints = sanitizeBlueprints(next.blueprints);
  next.resources = Math.floor(num(next.resources));
  next.noHit = sanitizeStageMarks(next.noHit);
  next.noRest = sanitizeStageMarks(next.noRest);
  next.titles = sanitizeTitles(next.titles);
  next.flags = sanitizeFlags(next.flags);
  next.stars = sanitizeStars(next.stars);
  next.diffSel = sanitizeDiffSel(next.diffSel);
  next.tierStars = sanitizeTierStars(next.tierStars);
  if (!CHARS.includes(next.lastChar)) next.lastChar = 'ninja';
  return writeSave(next);
}

export function resetSave() {
  try { localStorage.removeItem(KEY); } catch (e) {}
  return defaults();
}

export function saveVersion() { return VERSION; }
