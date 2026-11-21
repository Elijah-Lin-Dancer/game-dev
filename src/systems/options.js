/* 游戏设置（批 8 外壳）：独立于存档的一份小配置，改完立刻生效
 *
 * 目前只有三项真正接进玩法：静音、震屏、难度。
 * 以后要加"像素缩放 / 按键映射 / 语言"时，只在这个文件里扩字段，不动场景代码。
 */
const KEY = 'na.options';
const DEFAULTS = {
  muted: false,      // 全局静音（与存档里的 muted 同步，M 键也能切）
  shake: true,       // 打击震屏
  difficulty: 'normal', // normal | hard（困难 = 敌血 ×1.25、敌伤 ×1.2）
};

export function loadOptions() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      muted: !!raw.muted,
      shake: raw.shake !== false,
      difficulty: raw.difficulty === 'hard' ? 'hard' : 'normal',
    };
  } catch (e) {
    return Object.assign({}, DEFAULTS);
  }
}

export function patchOptions(patch) {
  const next = Object.assign(loadOptions(), patch);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) {}
  return next;
}

/* 难度乘区：只乘"敌人"，不碰玩家数值，避免两边一起放大互相抵消 */
export function difficultyMods(opt) {
  return (opt && opt.difficulty === 'hard')
    ? { hp: 1.25, dmg: 1.2, name: '困难' }
    : { hp: 1, dmg: 1, name: '普通' };
}
