/* 逐章难度：普通 / 噩梦 / 地狱
 *
 * 设计口径：
 * - 难度是"章"的属性，不是全局设置；每章独立选择与解锁。
 * - 普通通关（本章所有关至少 1 星）解锁噩梦；噩梦全章通关解锁地狱。
 * - 普通星级仍写 `save.stars`，是章节解锁与主线进度的唯一来源；
 *   噩梦/地狱星级写 `save.tierStars[章:关][tier]`，不覆盖普通进度。
 */
import { chapterById, chapterUnlocked, starsOf } from './stages.js';

export const TIERS = [
  { id: 'normal', name: '普通', hp: 1.00, dmg: 1.00, color: '#a9bcae', note: '基础强度，计入主线星级与解锁' },
  { id: 'nightmare', name: '噩梦', hp: 1.25, dmg: 1.20, color: '#ffb0a0', note: '敌血 ×1.25 · 敌伤 ×1.20' },
  { id: 'hell', name: '地狱', hp: 1.55, dmg: 1.40, color: '#ff8a72', note: '敌血 ×1.55 · 敌伤 ×1.40' },
];

export function normalizeTier(v) {
  return TIERS.some((t) => t.id === v) ? v : 'normal';
}

export function tierMeta(id) {
  return TIERS.find((t) => t.id === normalizeTier(id)) || TIERS[0];
}

export function difficultyMods(id) {
  const t = tierMeta(id);
  return { hp: t.hp, dmg: t.dmg, name: t.name };
}

export function tierStarsOf(save, chId, idx, tier) {
  const id = normalizeTier(tier);
  if (id === 'normal') return starsOf(save, chId, idx);
  const slot = (save && save.tierStars && save.tierStars[chId + ':' + idx]) || {};
  return Math.max(0, Math.min(3, Math.round(Number(slot[id]) || 0)));
}

export function chapterTierCleared(save, chId, tier) {
  const c = chapterById(chId);
  if (!c) return false;
  for (let i = 1; i <= c.stages; i += 1) {
    if (tierStarsOf(save, chId, i, tier) < 1) return false;
  }
  return true;
}

export function tierUnlocked(save, chId, tier) {
  const id = normalizeTier(tier);
  const at = chapterIndexOf(chId);
  if (at < 0) return false;
  if (id === 'normal') return chapterUnlocked(save, at);
  if (!chapterUnlocked(save, at)) return false;
  if (id === 'nightmare') return chapterTierCleared(save, chId, 'normal');
  return chapterTierCleared(save, chId, 'nightmare');
}

function chapterIndexOf(chId) {
  const c = chapterById(chId);
  if (!c) return -1;
  // 防止循环依赖：只按 id 找索引，不 import chapters 的列表函数
  const list = (window.__chaptersData && window.__chaptersData.chapters) || [];
  return list.findIndex((x) => String(x.id) === c.id);
}

export function selectedTier(save, chId) {
  const picked = normalizeTier((save && save.diffSel && save.diffSel[chId]) || 'normal');
  return tierUnlocked(save, chId, picked) ? picked : 'normal';
}

export function tierClearCount(save, chId, tier) {
  const c = chapterById(chId);
  if (!c) return 0;
  let n = 0;
  for (let i = 1; i <= c.stages; i += 1) {
    if (tierStarsOf(save, chId, i, tier) > 0) n += 1;
  }
  return n;
}
