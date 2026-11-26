/* 开放世界独立存档：只记远征进度，不碰主线 na.save
 *
 * G4-3 v14：
 *   - 新增 expedition（远征周目，默认 1）；星火重燃时 +1，六 Boss 进度清零；
 *   - v13 旧档补 expedition 1，其余字段不动。
 *
 * G4-2 v13：
 *   - bosses 增加第六只 mireWraith（雾泽 · 归水）；v12 旧档补 none；
 *   - 其余字段与 v12 一致；六只世界 Boss 全部有独立进度。
 *
 * G4-1 v12：
 *   - 新增 mire-1…mire-6 屏，追加雾泽 6 屏；
 *   - 新增 mireHerbs / mireQuest / mireQuest2；v11 旧档补 0 / none；
 *
 * G2-6 v11：
 *   - 新增 fieldQuest2 / bambooQuest2 / desertQuest2 / snowQuest2；
 *   - 四群系第二条委托全部落档；v10 旧档补 none，其余字段不变；
 *
 * G3-4/5 v10：
 *   - bosses 增加 frostOwl（雪原 · 白原）与 magmaColossus（火山 · 火心）；
 *   - v9 旧档补两只 none，其余字段与 v9 一致；G3 五只世界 Boss 全部有独立进度。
 *
 * G3-3 v9：
 *   - bosses 增加第三只 sandMirage（沙海 · 无旗）；v8 旧档补 none，不迁移已访问；
 *   - 其余字段沿用 v8，仍是两值进度 none|done。
 *
 * G3-2 v8：
 *   - 世界 Boss 进度由单值 boss 改为 bosses 对象（mossBeast / bambooMirage）；
 *   - 旧 v7 的 boss:'done' 迁移到 bosses.mossBeast；boss 字段保留为草原 Boss 兼容别名；
 *
 * G2-5 v7：
 *   - 新增 volcanoQuest2 / volcanoVents；篝火传送由 volcanoQuest2 完成解锁；
 *   - 30 屏和旧群系字段保持不变；
 *
 * G2-4 v6：
 *   - 草原 6 + 竹林 6 + 沙漠 6 + 雪原 6 + 火山 6（field-1 … volcano-6）；
 *   - 新增 volcanoQuest / volcanoHerbs；前四群系字段保持不变；
 *   - 旧 G0 的 field/bamboo/desert 仍映射到 field-1/field-3/field-6；
 *   - 战斗中的 HP、Boss 血量、坐标都是场景态，不进档；
 *   - 坏档保留 na.world.broken，读档失败回默认。
 */
const KEY = 'na.world';
const VERSION = 15;
const SCREENS = [
  'field-1', 'field-2', 'field-3', 'field-4', 'field-5', 'field-6',
  'bamboo-1', 'bamboo-2', 'bamboo-3', 'bamboo-4', 'bamboo-5', 'bamboo-6',
  'desert-1', 'desert-2', 'desert-3', 'desert-4', 'desert-5', 'desert-6',
  'snow-1', 'snow-2', 'snow-3', 'snow-4', 'snow-5', 'snow-6',
  'volcano-1', 'volcano-2', 'volcano-3', 'volcano-4', 'volcano-5', 'volcano-6',
  'mire-1', 'mire-2', 'mire-3', 'mire-4', 'mire-5', 'mire-6',
];
const LEGACY_SCREEN = { field: 'field-1', bamboo: 'field-3', desert: 'field-6' };
const QUESTS = ['none', 'active', 'done'];
const VENTS = new Set(['vent-jiao', 'vent-hei', 'vent-hui']);

function sanitizeVents(v) {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.filter((id) => VENTS.has(id)))];
}
const BOSS_STATES = ['none', 'done'];
const BOSS_IDS = ['mossBeast', 'bambooMirage', 'sandMirage', 'frostOwl', 'magmaColossus', 'mireWraith'];
const bossDefaults = () => Object.fromEntries(BOSS_IDS.map((id) => [id, 'none']));

function sanitizeBosses(raw, legacy) {
  const out = bossDefaults();
  if (raw && typeof raw === 'object') {
    for (const id of BOSS_IDS) {
      if (BOSS_STATES.includes(raw[id])) out[id] = raw[id];
    }
  } else if (legacy === 'done') {
    out.mossBeast = 'done';
  }
  return out;
}

const defaults = () => ({
  v: VERSION,
  visited: [],
  herbs: 0,
  quest: 'none',
  fieldQuest2: 'none',
  bambooHerbs: 0,
  bambooQuest: 'none',
  bambooQuest2: 'none',
  desertHerbs: 0,
  desertQuest: 'none',
  desertQuest2: 'none',
  snowHerbs: 0,
  snowQuest: 'none',
  snowQuest2: 'none',
  volcanoHerbs: 0,
  volcanoQuest: 'none',
  volcanoQuest2: 'none',
  volcanoVents: [],
  mireHerbs: 0,
  mireQuest: 'none',
  mireQuest2: 'none',
  lampQuest: 'none',
  expedition: 1,
  boss: 'none',
  bosses: bossDefaults(),
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
    fieldQuest2: QUESTS.includes(old.fieldQuest2) ? old.fieldQuest2 : 'none',
    bambooHerbs: Math.min(99, Math.round(num(old.bambooHerbs))),
    bambooQuest: QUESTS.includes(old.bambooQuest) ? old.bambooQuest : 'none',
    bambooQuest2: QUESTS.includes(old.bambooQuest2) ? old.bambooQuest2 : 'none',
    desertHerbs: Math.min(99, Math.round(num(old.desertHerbs))),
    desertQuest: QUESTS.includes(old.desertQuest) ? old.desertQuest : 'none',
    desertQuest2: QUESTS.includes(old.desertQuest2) ? old.desertQuest2 : 'none',
    snowHerbs: Math.min(99, Math.round(num(old.snowHerbs))),
    snowQuest: QUESTS.includes(old.snowQuest) ? old.snowQuest : 'none',
    snowQuest2: QUESTS.includes(old.snowQuest2) ? old.snowQuest2 : 'none',
    volcanoHerbs: Math.min(99, Math.round(num(old.volcanoHerbs))),
    volcanoQuest: QUESTS.includes(old.volcanoQuest) ? old.volcanoQuest : 'none',
    volcanoQuest2: QUESTS.includes(old.volcanoQuest2) ? old.volcanoQuest2 : 'none',
    volcanoVents: sanitizeVents(old.volcanoVents),
    mireHerbs: Math.min(99, Math.round(num(old.mireHerbs))),
    mireQuest: QUESTS.includes(old.mireQuest) ? old.mireQuest : 'none',
    mireQuest2: QUESTS.includes(old.mireQuest2) ? old.mireQuest2 : 'none',
    lampQuest: QUESTS.includes(old.lampQuest) ? old.lampQuest : 'none',
    expedition: Math.max(1, Math.min(99, Math.round(num(old.expedition, 1)))),
    bosses: sanitizeBosses(old.bosses, old.bosses ? null : old.boss),
    boss: sanitizeBosses(old.bosses, old.bosses ? null : old.boss).mossBeast === 'done' ? 'done' : 'none',
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
  next.fieldQuest2 = QUESTS.includes(next.fieldQuest2) ? next.fieldQuest2 : 'none';
  next.bambooHerbs = Math.min(99, Math.round(num(next.bambooHerbs)));
  next.bambooQuest = QUESTS.includes(next.bambooQuest) ? next.bambooQuest : 'none';
  next.bambooQuest2 = QUESTS.includes(next.bambooQuest2) ? next.bambooQuest2 : 'none';
  next.desertHerbs = Math.min(99, Math.round(num(next.desertHerbs)));
  next.desertQuest = QUESTS.includes(next.desertQuest) ? next.desertQuest : 'none';
  next.desertQuest2 = QUESTS.includes(next.desertQuest2) ? next.desertQuest2 : 'none';
  next.snowHerbs = Math.min(99, Math.round(num(next.snowHerbs)));
  next.snowQuest = QUESTS.includes(next.snowQuest) ? next.snowQuest : 'none';
  next.snowQuest2 = QUESTS.includes(next.snowQuest2) ? next.snowQuest2 : 'none';
  next.volcanoHerbs = Math.min(99, Math.round(num(next.volcanoHerbs)));
  next.volcanoQuest = QUESTS.includes(next.volcanoQuest) ? next.volcanoQuest : 'none';
  next.volcanoQuest2 = QUESTS.includes(next.volcanoQuest2) ? next.volcanoQuest2 : 'none';
  next.mireHerbs = Math.min(99, Math.round(num(next.mireHerbs)));
  next.mireQuest = QUESTS.includes(next.mireQuest) ? next.mireQuest : 'none';
  next.mireQuest2 = QUESTS.includes(next.mireQuest2) ? next.mireQuest2 : 'none';
  next.lampQuest = QUESTS.includes(next.lampQuest) ? next.lampQuest : 'none';
  const currentBosses = loadWorldSave().bosses;
  const bossPatch = patch && patch.bosses && typeof patch.bosses === 'object'
    ? { ...currentBosses, ...patch.bosses }
    : { ...currentBosses };
  if (patch && patch.boss === 'done') bossPatch.mossBeast = 'done';
  next.bosses = sanitizeBosses(bossPatch, null);
  next.boss = next.bosses.mossBeast === 'done' ? 'done' : 'none';
  next.tokens = Math.min(99, Math.round(num(next.tokens)));
  return writeWorldSave(next);
}

export function rekindleWorldSave() {
  const cur = loadWorldSave();
  return patchWorldSave({
    bosses: bossDefaults(),
    boss: 'none',
    expedition: Math.min(99, Math.max(1, cur.expedition || 1) + 1),
  });
}

export function resetWorldSave() {
  try { localStorage.removeItem(KEY); } catch (e) {}
  return defaults();
}

export function worldSaveVersion() { return VERSION; }
