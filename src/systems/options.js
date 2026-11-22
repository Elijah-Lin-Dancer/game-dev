/* 游戏设置（批 8 外壳）：独立于存档的一份小配置，改完立刻生效
 *
 * 只放"程序级"选项：静音、震屏。难度是章节属性，已移到 difficulty.js，
 * 不再挂在全局设置里。
 */
const KEY = 'na.options';
const DEFAULTS = {
  muted: false,      // 全局静音（与存档里的 muted 同步，M 键也能切）
  shake: true,       // 打击震屏
};

export function loadOptions() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      muted: !!raw.muted,
      shake: raw.shake !== false,
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
