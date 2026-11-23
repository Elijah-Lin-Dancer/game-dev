/* 成就：20 条跨局记录，数据与判定同源。
 *
 * 设计原则：
 * - 只读已有存档字段（stars / seen / kills / noHit / story / cycle…），不新造局内统计；
 * - 成就是“记录”，暂不发宝石，避免把经济系统再开一条不可控的口子；
 * - evaluate 只在结算 / 回小屋时调用，不逐帧写盘。
 */
import { loadSave, patchSave } from './save.js';

const num = (v, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const starsTotal = (m) => Object.keys(m.stars || {})
  .filter((k) => k.indexOf('sp_') !== 0)
  .reduce((n, k) => n + num(m.stars[k]), 0);
const cleared = (m, ch, n) => {
  let c = 0;
  for (let i = 1; i <= n; i++) if (num(m.stars && m.stars[ch + ':' + i]) > 0) c += 1;
  return c;
};
const bossCount = (m) => Object.keys((m.seen && m.seen.bosses) || {})
  .filter((k) => m.seen.bosses[k]).length;
const specialCount = (m) => Object.keys(m.stars || {})
  .filter((k) => k.indexOf('sp_') === 0 && num(m.stars[k]) > 0).length;
const anyStar = (m) => Object.keys(m.stars || {}).some((k) => num(m.stars[k]) > 0);
const anyMark = (m, key) => Object.keys(m[key] || {}).length > 0;

export const ACHIEVEMENTS = [
  {
    id: 'first_clear', name: '初燃', desc: '完成任意一关', cat: '旅程', goal: 1,
    accent: 0xffb86b, value: (m) => (anyStar(m) ? 1 : 0),
  },
  {
    id: 'first_blood', name: '第一滴血', desc: '击败第 1 名敌人', cat: '战斗', goal: 1,
    accent: 0xff8a7a, value: (m) => (num(m.kills) >= 1 ? 1 : 0),
  },
  {
    id: 'kill_50', name: '五十步', desc: '累计击败 50 名敌人', cat: '战斗', goal: 50,
    accent: 0xff8a7a, value: (m) => num(m.kills),
  },
  {
    id: 'kill_200', name: '百人斩', desc: '累计击败 200 名敌人', cat: '战斗', goal: 200,
    accent: 0xff6b5a, value: (m) => num(m.kills),
  },
  {
    id: 'boss_1', name: '猎首', desc: '击败任意 Boss', cat: '战斗', goal: 1,
    accent: 0xffd479, value: (m) => (bossCount(m) >= 1 ? 1 : 0),
  },
  {
    id: 'boss_6', name: '巨兽猎手', desc: '击败 6 种 Boss', cat: '战斗', goal: 6,
    accent: 0xffd479, value: (m) => bossCount(m),
  },
  {
    id: 'boss_all', name: '万物皆影', desc: '击败全部 11 种 Boss', cat: '战斗', goal: 11,
    accent: 0xffb0d8, value: (m) => bossCount(m),
  },
  {
    id: 'clear_bamboo', name: '竹影归客', desc: '通关竹林村 5 关', cat: '旅程', goal: 5,
    accent: 0x9fe0a0, value: (m) => cleared(m, 'bamboo', 5),
  },
  {
    id: 'clear_fort', name: '旧堡破门', desc: '通关旧堡 6 关', cat: '旅程', goal: 6,
    accent: 0xff9a7a, value: (m) => cleared(m, 'fort', 6),
  },
  {
    id: 'clear_desert', name: '沙海无旗', desc: '通关沙海遗迹 7 关', cat: '旅程', goal: 7,
    accent: 0xffd479, value: (m) => cleared(m, 'desert', 7),
  },
  {
    id: 'clear_sunken', name: '沉水熄神', desc: '通关沉水神殿 8 关', cat: '旅程', goal: 8,
    accent: 0x9fe0ff, value: (m) => cleared(m, 'sunken', 8),
  },
  {
    id: 'clear_lava', name: '熔岩铸我', desc: '通关熔岩地心 9 关', cat: '旅程', goal: 9,
    accent: 0xff8a5a, value: (m) => cleared(m, 'lava', 9),
  },
  {
    id: 'stars_30', name: '三十星', desc: '累计 30 颗星', cat: '旅程', goal: 30,
    accent: 0x9fe0ff, value: (m) => starsTotal(m),
  },
  {
    id: 'stars_60', name: '六十星', desc: '累计 60 颗星', cat: '旅程', goal: 60,
    accent: 0xd8c0ff, value: (m) => starsTotal(m),
  },
  {
    id: 'stars_100', name: '百星', desc: '累计 100 颗星', cat: '旅程', goal: 100,
    accent: 0xffd479, value: (m) => starsTotal(m),
  },
  {
    id: 'no_hit', name: '无伤', desc: '任意关无伤通关', cat: '挑战', goal: 1,
    accent: 0x9be27a, value: (m) => (anyMark(m, 'noHit') ? 1 : 0),
  },
  {
    id: 'no_rest', name: '不眠', desc: '任意关不用篝火通关', cat: '挑战', goal: 1,
    accent: 0x9fd8ff, value: (m) => (anyMark(m, 'noRest') ? 1 : 0),
  },
  {
    id: 'special', name: '支线旅人', desc: '通关任意支线 / 隐藏 / 条件关', cat: '挑战', goal: 1,
    accent: 0xc9a45a, value: (m) => (specialCount(m) >= 1 ? 1 : 0),
  },
  {
    id: 'cycle2', name: '再燃', desc: '进入二周目', cat: '旅程', goal: 1,
    accent: 0xffb86b, value: (m) => (num(m.cycle, 1) >= 2 ? 1 : 0),
  },
  {
    id: 'story_end', name: '星火归途', desc: '看完终章', cat: '剧情', goal: 1,
    accent: 0xffe9b0, value: (m) => (m.story && m.story.ended ? 1 : 0),
  },
];

export function achDone(meta, id) {
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  return !!a && num(a.value(meta || {})) >= a.goal;
}

export function achProgress(meta, a) {
  const v = Math.max(0, Math.min(a.goal, Math.floor(num(a.value(meta || {})))));
  return a.goal <= 1 ? (v >= 1 ? '已达成' : '未达成') : (v + '/' + a.goal);
}

export function achUnlocked(meta, id) {
  return !!(meta && meta.ach && meta.ach[id]);
}

/* 返回 { meta, unlocked }；unlocked 是本次新解锁，供结算 toast 使用。 */
export function evaluateAchievements(meta) {
  const m = meta || loadSave();
  const have = (m.ach && typeof m.ach === 'object') ? m.ach : {};
  const unlocked = ACHIEVEMENTS.filter((a) => !have[a.id] && num(a.value(m)) >= a.goal);
  if (!unlocked.length) return { meta: m, unlocked: [] };
  const ach = Object.assign({}, have);
  unlocked.forEach((a) => { ach[a.id] = 1; });
  return { meta: patchSave({ ach }), unlocked };
}
