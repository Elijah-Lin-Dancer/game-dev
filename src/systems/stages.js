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

/* 章内递进：第 N 关再乘 1 + 0.05×(N-1) */
export function stageDiff(chapter, stageIdx) {
  return Math.max(0.5, chapter.diff * (1 + 0.05 * (Math.max(1, stageIdx) - 1)));
}

export function stageKey(chId, idx) { return chId + ':' + idx; }

export function starsOf(save, chId, idx) {
  const s = (save && save.stars) || {};
  return Math.max(0, Math.min(3, Math.round(num(s[stageKey(chId, idx)], 0))));
}

/* 主线满星上限（36 关 × 3 = 108）；特殊关另记，不计入地图页眉 */
export function maxStars() {
  return chapters().reduce((n, c) => n + c.stages * 3, 0);
}

export function totalStars(save) {
  // 只统计主线章节；特殊关卡用 sp_<id>:1 的键，不计入主线 ★
  let n = 0;
  chapters().forEach((c) => {
    for (let i = 1; i <= c.stages; i += 1) n += starsOf(save, c.id, i);
  });
  return n;
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

/* 星级：★1 通关、★2 剩血 >=70%、★3 本关没用休整房 */
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

/* ---------- 特殊关卡（支线 / 隐藏 / 条件） ----------
 * 特殊关与主线分开记：键统一为 sp_<id>:1，不计入主线 ★ 与章节解锁。
 * 这里只做规格、条件判定与清关记录；timer / noCoinPickup / fists 已由 Play 消费，
 * braziers / noHitStage / resources 已在批 14 接入；多武器槽仍待接入。
 */
const SPECIAL_TYPES = [
  ['side', '支线'], ['hidden', '隐藏'], ['conditional', '条件'],
];
const SPECIAL_THEME = {
  darkhall: 'sky', mirror: 'water', ashfall: 'sky',
  kunai: 'field', fists: 'fort', poor: 'desert', speedrun: 'desert',
};
const GATE_LABEL = {
  starsInChapter: '本章星级', beat: '击败 Boss', resources: '累计资源',
  noHitStage: '无伤挑战', noRestInStage: '未用篝火通关', braziers: '火盆目标', clear: '通关',
  stars: '主线星级', fullStarsChapter: '全关三星', weapon: '解锁武器',
  coins: '累计金币',
};
const SPECIAL_SEEN_BOSS = { samBlue: 'samurai', samRed: 'samuraiRed' };

function specialRaw() {
  const d = window.__chaptersData || {};
  const out = [];
  SPECIAL_TYPES.forEach(([type, typeName]) => {
    (d[type] || []).forEach((e) => {
      if (!e || !e.id) return;
      out.push({
        id: String(e.id), name: String(e.name || e.id), type, typeName,
        chapter: String(e.chapter || ''), rooms: Math.max(1, Math.round(num(e.rooms, 5))),
        gates: e.gates || {}, reward: e.reward || {}, bossPool: Array.isArray(e.bossPool) ? e.bossPool.map(String) : [],
        diff: num(e.diff, 0), rule: String(e.rule || ''), seconds: num(e.seconds, 0),
        braziers: Math.max(0, Math.round(num(e.braziers, 0))),
        loadout: e.loadout || null,
      });
    });
  });
  return out;
}

export function specials() { return specialRaw(); }
export function specialById(id) { return specialRaw().find((s) => s.id === id) || null; }
export function specialKey(id) { return 'sp_' + id + ':1'; }
export function specialChapterId(id) { return 'sp_' + id; }

export function specialCleared(save, id) {
  return starsOf(save, specialChapterId(id), 1) >= 1;
}

function chapterClear(save, chId) {
  const c = chapterById(chId);
  if (!c) return false;
  for (let i = 1; i <= c.stages; i += 1) if (starsOf(save, c.id, i) < 1) return false;
  return true;
}

function chapterStars(save, chId) {
  const c = chapterById(chId);
  if (!c) return 0;
  let n = 0;
  for (let i = 1; i <= c.stages; i += 1) n += starsOf(save, c.id, i);
  return n;
}

function fullStarsChapter(save, chId) {
  const c = chapterById(chId);
  if (!c) return false;
  for (let i = 1; i <= c.stages; i += 1) if (starsOf(save, c.id, i) < 3) return false;
  return true;
}

function bossSeen(save, id) {
  const seen = (save && save.seen && save.seen.bosses) || {};
  return !!seen[id] || !!seen[SPECIAL_SEEN_BOSS[id]];
}

/* 条件是否达成。noRest/noHit 是真实通关记录；braziers 是关内目标，不参与入口 gate。 */
export function specialGateOk(save, s) {
  if (!s) return false;
  const g = s.gates || {};
  if (g.starsInChapter && s.chapter && chapterStars(save, s.chapter) < num(g.starsInChapter)) return false;
  if (g.beat && !bossSeen(save, String(g.beat))) return false;
  if (g.resources && num(save && save.resources) < num(g.resources)) return false;
  if (g.noHitStage && !Object.keys((save && save.noHit) || {}).length) return false;
  if (g.noRestInStage && !Object.keys((save && save.noRest) || {}).some((k) => k.indexOf('fort:') === 0)) return false;
  if (g.clear) {
    const id = String(g.clear);
    if (specials().some((x) => x.id === id)) { if (!specialCleared(save, id)) return false; }
    else if (!chapterClear(save, id)) return false;
  }
  if (g.stars && totalStars(save) < num(g.stars)) return false;
  if (g.fullStarsChapter && !fullStarsChapter(save, String(g.fullStarsChapter))) return false;
  if (g.weapon && !((save && save.unlockedWeapons) || []).includes(String(g.weapon))) return false;
  if (g.coins && num(save && save.coins) < num(g.coins)) return false;

  // 只有规则、没有显式解锁条件的支线：本章通关即可进
  const ruleOnly = !g.starsInChapter && !g.beat && !g.resources && !g.noHitStage && !g.noRestInStage
    && !g.clear && !g.stars && !g.fullStarsChapter && !g.weapon && !g.coins;
  if (ruleOnly && s.chapter && !chapterClear(save, s.chapter)) return false;
  return true;
}

export function specialSpec(id) {
  const s = specialById(id);
  if (!s) return null;
  const base = s.chapter ? chapterById(s.chapter) : null;
  const theme = base ? base.theme : (SPECIAL_THEME[s.id] || 'dungeon');
  const rooms = s.rooms;
  let template = base && base.roomTemplate.length ? base.roomTemplate.slice(0, rooms) : [];
  while (template.length < rooms) template.push('battle');
  if (template.length && template[0] === 'boss') template[0] = 'battle';
  if (rooms > 1) template[rooms - 1] = 'boss';
  const diff = s.diff || ((base ? base.diff : 1.2) + 0.1);
  const bossPool = s.bossPool.length ? s.bossPool
    : ((base && base.bossPool.length) ? base.bossPool : ['frog', 'samBlue']);
  const monsters = (base && base.monsters.length) ? base.monsters
    : ['beast', 'raccoon', 'spider', 'slime', 'flam', 'demon'];
  const pseudo = {
    id: specialChapterId(s.id), name: s.name, theme, stages: 1,
    rooms: [rooms], roomTemplate: template, diff, bossPool, monsters,
    pressure: base ? base.pressure : [],
  };
  return {
    chapter: pseudo, chapterId: pseudo.id, chapterName: s.name, index: 1,
    key: specialKey(s.id), rooms, template, diff, bossPool, special: s,
  };
}

export function specialRuleLabel(s) {
  if (!s) return '';
  if (s.rule === 'timer') { const sec = Math.max(1, Math.round(num(s.seconds, 300))); return '限时 ' + sec + ' 秒'; }
  if (s.rule === 'noCoinPickup') return '本关不掉金币';
  if (s.braziers) return '火盆 ×' + s.braziers + ' · 未点满锁门';
  const weapons = s.loadout && s.loadout.weapons;
  if (Array.isArray(weapons)) {
    if (!weapons.length) return '赤手空拳';
    return '仅限' + String(weapons[0]);
  }
  return '';
}

const REWARD_FLAG_LABEL = {
  merchant: '商人线报',
  skillDiscount: '第二技能折扣',
  fireEnchant: '火焰附魔',
  epilogue: '灰烬之后',
};

function weaponName(id) {
  const list = (window.__weaponsData && window.__weaponsData.list) || [];
  const w = list.find((x) => x.id === id);
  return w ? w.name : id;
}

/* 首通奖励文案：宝石 / 图纸 / 称号 / 支线标记 */
export function specialRewardLabel(s) {
  const r = (s && s.reward) || {};
  const parts = [];
  if (r.gem) parts.push('+' + r.gem + ' 宝石');
  if (r.blueprint) parts.push('图纸 · ' + weaponName(r.blueprint));
  if (r.title === 'poor') parts.push('称号「贫者」');
  if (r.flag && REWARD_FLAG_LABEL[r.flag]) parts.push(REWARD_FLAG_LABEL[r.flag]);
  return parts.length ? parts.join(' · ') : '无首通奖励';
}

export function specialGateLabel(s, save) {
  if (!s) return '';
  const g = s.gates || {};
  const names = [];
  if (g.starsInChapter) names.push((GATE_LABEL.starsInChapter) + ' ' + chapterStars(save, s.chapter) + '/' + num(g.starsInChapter));
  if (g.beat) names.push(GATE_LABEL.beat + ' ' + String(g.beat));
  if (g.resources) names.push(GATE_LABEL.resources + ' ' + num(save && save.resources) + '/' + num(g.resources));
  if (g.noHitStage) {
    const n = Object.keys((save && save.noHit) || {}).length;
    names.push(GATE_LABEL.noHitStage + ' ' + n + '/1');
  }
  if (g.noRestInStage) {
    const n = Object.keys((save && save.noRest) || {}).filter((k) => k.indexOf('fort:') === 0).length;
    names.push(GATE_LABEL.noRestInStage + ' ' + n + '/1');
  }
  if (g.clear) {
    const id = String(g.clear);
    const sp = specialById(id);
    names.push(GATE_LABEL.clear + ' ' + (sp ? sp.name : (chapterById(id) || {}).name || id));
  }
  if (g.stars) names.push(GATE_LABEL.stars + ' ' + totalStars(save) + '/' + num(g.stars));
  if (g.fullStarsChapter) names.push(GATE_LABEL.fullStarsChapter + ' ' + ((chapterById(g.fullStarsChapter) || {}).name || g.fullStarsChapter));
  if (g.weapon) names.push(GATE_LABEL.weapon + ' ' + String(g.weapon));
  if (g.coins) names.push(GATE_LABEL.coins + ' ' + num(save && save.coins) + '/' + num(g.coins));
  if (g.braziers) names.push(GATE_LABEL.braziers + ' ×' + num(g.braziers));
  if (!names.length) names.push('无前置条件');
  return names.join(' · ');
}
