/* 章节与关卡：把 web/data/chapters.json 变成可查询的关卡规格
 * 数据是唯一的真源；这里只做归一化、解锁判定、星级与难度计算，不写任何逐关分支。
 * 关卡 id 统一用 "章:关"（关从 1 起），存档 stars 也用这个键。
 */
const num = (v, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

function raw() {
  const d = window.__chaptersData;
  return (d && Array.isArray(d.chapters)) ? d.chapters : [];
}

/* 章节定义：补齐缺字段，保证坏表不会把游戏打崩 */
export function chapters() {
  return raw().map((c) => ({
    id: String(c.id || ''),
    name: String(c.name || c.id || ''),
    theme: String(c.theme || 'field'),
    stages: Math.max(1, Math.round(num(c.stages, 5))),
    rooms: Array.isArray(c.rooms) ? c.rooms.map((n) => Math.max(1, Math.round(num(n, 5)))) : [],
    roomTemplate: Array.isArray(c.roomTemplate) ? c.roomTemplate.map((t) => String(t)) : [],
    diff: Math.max(0.5, num(c.diff, 1)),
    bossPool: Array.isArray(c.bossPool) ? c.bossPool.map(String) : [],
    monsters: Array.isArray(c.monsters) ? c.monsters.map(String) : [],
    pressure: Array.isArray(c.pressure) ? c.pressure.map(String) : [],
  })).filter((c) => c.id);
}

export function chapterByIndex(i) { return chapters()[i] || null; }
export function chapterById(id) { return chapters().find((c) => c.id === id) || null; }

/* 单关规格：房数按章取，模板与 Boss 池也按章取；终章只有 1 房（Boss） */
export function stageSpec(chId, stageIdx) {
  const c = chapterById(chId);
  if (!c) return null;
  const n = Math.max(1, Math.min(c.stages, Math.round(stageIdx)));
  const rooms = c.rooms[n - 1] || c.rooms[c.rooms.length - 1] || 5;
  // 模板长度必须与房数一致，短了用 battle 补、长了截断；末房强制 boss
  let tpl = c.roomTemplate.slice(0, rooms);
  while (tpl.length < rooms) tpl.push('battle');
  if (rooms > 1) tpl[rooms - 1] = 'boss';
  return {
    chapter: c, chapterId: c.id, chapterName: c.name,
    index: n, key: c.id + ':' + n,
    rooms, template: tpl,
    diff: stageDiff(c, n),
    bossPool: c.bossPool,
  };
}

/* 章内递进：第 N 关再乘 1 + 0.05×(N−1) */
export function stageDiff(chapter, stageIdx) {
  return Math.max(0.5, chapter.diff * (1 + 0.05 * (Math.max(1, stageIdx) - 1)));
}

export function stageKey(chId, idx) { return chId + ':' + idx; }

export function starsOf(save, chId, idx) {
  const s = (save && save.stars) || {};
  return Math.max(0, Math.min(3, Math.round(num(s[stageKey(chId, idx)], 0))));
}

/* 全表满星上限（49 关 × 3 = 147），给地图页眉用 */
export function maxStars() {
  return chapters().reduce((n, c) => n + c.stages * 3, 0);
}

export function totalStars(save) {
  const s = (save && save.stars) || {};
  return Object.keys(s).reduce((n, k) => n + Math.max(0, Math.min(3, Math.round(num(s[k], 0)))), 0);
}

/* 章解锁：第一章永远开；后面要求上一章最后一关至少 1 星 */
export function chapterUnlocked(save, chIndex) {
  const list = chapters();
  if (chIndex <= 0) return true;
  const prev = list[chIndex - 1];
  if (!prev) return false;
  return starsOf(save, prev.id, prev.stages) >= 1;
}

/* 关解锁：本章第一关开；后面要求上一关至少 1 星 */
export function stageUnlocked(save, chId, idx) {
  const c = chapterById(chId);
  if (!c) return false;
  if (idx <= 1) return true;
  return starsOf(save, chId, idx - 1) >= 1;
}

/* 星级：★1 通关、★2 剩血 ≥70%、★3 本关没用休整房 */
export function starRating({ hp, maxHp, usedRest }) {
  let n = 1;
  if (maxHp > 0 && hp / maxHp >= 0.7) n += 1;
  if (!usedRest) n += 1;
  return Math.min(3, n);
}

/* 进度摘要：给地图页脚用 */
export function progress(save) {
  const list = chapters();
  let cleared = 0;
  let full = 0;
  let total = 0;
  list.forEach((c) => {
    total += c.stages;
    for (let i = 1; i <= c.stages; i += 1) {
      const s = starsOf(save, c.id, i);
      if (s > 0) cleared += 1;
      if (s >= 3) full += 1;
    }
  });
  return { cleared, full, total, max: maxStars(), stars: totalStars(save) };
}
