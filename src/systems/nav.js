/* 导航层（P0）：场景返回栈 + 覆盖层登记
 *
 * 只负责两件事：
 *   1. 场景跳转统一走 push / back，返回目标由栈决定，不再逐场景硬编码；
 *   2. 覆盖层（设置 / 制作名单）登记在最上层，ESC / 右键 / 遮罩只关当前层。
 *
 * 不接管 Phaser 的 scene.start 本身；场景内部仍可保留同场景覆盖层，
 * 但跨场景跳转必须经过这里，栈才会与玩家看到的层级一致。
 */

let gameRef = null;
let stack = [];
let overlays = [];

function game() {
  return gameRef || (typeof window !== 'undefined' ? window.__game : null);
}

function start(fromKey, sceneKey, data) {
  const g = game();
  if (!g || !g.scene) return false;
  overlays.length = 0;
  const from = fromKey ? g.scene.getScene(fromKey) : null;
  if (from && from.scene && typeof from.scene.start === 'function') {
    from.scene.start(sceneKey, data || {});
  } else {
    g.scene.start(sceneKey, data || {});
  }
  return true;
}

export function initNav(game) {
  gameRef = game;
  stack = ['title'];
  overlays.length = 0;
}

export function reset(root = 'title') {
  stack = [root];
  overlays.length = 0;
}

export function push(sceneKey, data = {}) {
  if (!sceneKey) return false;
  const from = stack[stack.length - 1] || null;
  stack.push(sceneKey);
  return start(from, sceneKey, data);
}

export function back(data = {}) {
  if (stack.length <= 1) return false;
  const from = stack.pop();
  return start(from, stack[stack.length - 1], data);
}

export function current() {
  return stack[stack.length - 1] || null;
}

export function depth() {
  return stack.length;
}

export function path() {
  return stack.slice();
}

export function openOverlay(key) {
  if (key && overlays.indexOf(key) < 0) overlays.push(key);
}

export function closeOverlay(key) {
  const i = overlays.indexOf(key);
  if (i >= 0) overlays.splice(i, 1);
}

export function topOverlay() {
  return overlays.length ? overlays[overlays.length - 1] : null;
}

export function clearOverlays() {
  overlays.length = 0;
}

export const NAV = {
  initNav, reset, push, back, current, depth, path,
  openOverlay, closeOverlay, topOverlay, clearOverlays,
};
