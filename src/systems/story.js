/* 剧情导演：节点、顺序、一次性触发。
 *
 * 数据是唯一真源（web/data/story.json 的 story.nodes）；本文件只做查询与 seen 写入，
 * 不渲染、不决定章节奖励，避免把叙事条件散进各场景。
 */
import { loadSave, patchSave } from './save.js';

const STORY_IDS = ['prologue', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'final', 'epilogue', 'cycle2'];
const CHAPTER_STORY = { bamboo: 'ch1', desert: 'ch3', sunken: 'ch4', lava: 'ch5' };

function data() {
  return (window.__storyData && window.__storyData.story) || {};
}

export function storyNodes() {
  const nodes = data().nodes;
  return Array.isArray(nodes) ? nodes.filter((n) => n && STORY_IDS.includes(n.id)) : [];
}

export function storyNode(id) {
  return storyNodes().find((n) => n.id === id) || null;
}

export function storyIds() { return STORY_IDS.slice(); }

export function storyIndex(id) {
  const ids = (data().order && Array.isArray(data().order)) ? data().order : STORY_IDS;
  return Math.max(0, ids.indexOf(id));
}

export function storyCount() { return storyNodes().length || STORY_IDS.length; }

export function storySeen(save, id) {
  return !!(save && save.story && save.story.seen && save.story.seen[id]);
}

/* 顺序由数据里的 requires 决定；cycle2 额外要求周目 >= 2。 */
export function storyCanTrigger(save, id) {
  const node = storyNode(id);
  if (!node || storySeen(save, id)) return false;
  const req = node.requires || null;
  if (req && !storySeen(save, req)) return false;
  if (id === 'cycle2' && Math.max(1, Number(save && save.cycle) || 1) < 2) return false;
  return true;
}

export function markStorySeen(id) {
  if (!STORY_IDS.includes(id)) return loadSave();
  const save = loadSave();
  const seen = Object.assign({}, (save.story && save.story.seen) || {}, { [id]: 1 });
  const ended = !!((save.story && save.story.ended) || id === 'final');
  return patchSave({ story: { seen, ended } });
}

/* 章节卡在打开章节时触发；序章 / 后日谈 / 二周目由各自入口触发。 */
export function chapterStory(chId) { return CHAPTER_STORY[chId] || null; }

export function storyAfterBoss(spec, bossId) {
  if (!spec) return null;
  if (spec.chapterId === 'fort' && (bossId === 'samRed' || bossId === 'samuraiRed')) return 'ch2';
  if (spec.chapterId === 'final') return 'final';
  if (spec.special && spec.special.id === 'epilogue') return 'epilogue';
  return null;
}

/* 小屋入口：先序章；终章后第二次回小屋看「再燃」。 */
export function storyForHall(save) {
  if (storyCanTrigger(save, 'prologue')) return 'prologue';
  if (Number(save && save.cycle) >= 2 && storyCanTrigger(save, 'cycle2')) return 'cycle2';
  return null;
}

export function storyForTitle(save) {
  return storyCanTrigger(save, 'prologue') ? 'prologue' : null;
}
