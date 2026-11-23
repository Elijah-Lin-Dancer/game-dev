/* 批 13：归途小屋 NPC 区
 *
 * 三个 NPC 的立绘、身份与台词都在这里；Hall 只负责摆卡和弹层。
 * 台词按存档进度分阶段，不写分支任务，也不写“必须送礼”之类的系统。
 * 引路人推进主线，铁匠负责锻造说明，商人是第三章后的幸存者。
 */

export const NPCS = [
  {
    id: 'guide',
    name: '引路人',
    role: '守夜人 · 主线',
    face: 'faceGuide',
    accent: 0x9fe0ff,
    lines: ['火熄之后，村子一天比一天冷。', '星火碎片散在六章里，先把路走通，再谈归途。'],
  },
  {
    id: 'smith',
    name: '铁匠',
    role: '前朝铸剑师 · 锻造',
    face: 'faceSmith',
    accent: 0xffd479,
    lines: ['兵器不是越重越好，顺手才打得久。', '带金币来，我替你把旧刃重新淬一遍。'],
  },
  {
    id: 'merchant',
    name: '商人',
    role: '沙海幸存者 · 入伙',
    face: 'faceMerchant',
    accent: 0x7cb342,
    lines: ['沙暴里能活下来的，都懂得轻装。', '第三章之后，我这条命就押在你的归途上了。'],
  },
];

const chapterCleared = (meta, chapterId) => Object.keys((meta && meta.stars) || {})
  .some((k) => k.indexOf(chapterId + ':') === 0);

const forgeCount = (meta) => Object.keys((meta && meta.forge) || {}).length;

export function npcById(id) {
  return NPCS.find((n) => n.id === id) || null;
}

/* 返回 { name, role, face, accent, lines }；不修改存档 */
export function npcDialogue(id, meta) {
  const npc = npcById(id);
  if (!npc) return null;
  const wins = Math.max(0, Number(meta && meta.wins) || 0);
  const cycle = Math.max(1, Number(meta && meta.cycle) || 1);
  let lines = npc.lines.slice();

  if (id === 'guide') {
    if (wins > 0) {
      lines = ['星火已经归位，村子缓过来了。', '但裂痕还在——第 ' + cycle + ' 周目，路只会更长。'];
    } else if (chapterCleared(meta, 'lava')) {
      lines = ['熔岩地心的伪星火已经灭了。', '最后一段路，影织者会亲自来拦你。'];
    } else if (chapterCleared(meta, 'desert')) {
      lines = ['商队的事我听说了，商人还愿意跟着你。', '第三块碎片在沉水神殿底，别让水汽迷了眼。'];
    }
  } else if (id === 'smith') {
    const n = forgeCount(meta);
    if (n > 0) {
      lines = ['你送来的兵器我重新淬了 ' + n + ' 把。', 'Lv.3 之前靠金币，Lv.4 要等支线图纸。'];
    } else {
      lines = ['先把常用的刀剑拿来，我看看刃口。', '金币够的话，Lv.2 和 Lv.3 现在就能开。'];
    }
  } else if (id === 'merchant') {
    if (chapterCleared(meta, 'desert')) {
      lines = ['我从沙海捡回一条命，账本却烧没了。', '以后你的补给，我来想办法。'];
    } else {
      lines = ['商队在沙海出了事，我还在等消息。', '等你走到第三章，我再把货箱打开。'];
    }
  }

  return {
    id: npc.id, name: npc.name, role: npc.role, face: npc.face,
    accent: npc.accent, lines,
  };
}
