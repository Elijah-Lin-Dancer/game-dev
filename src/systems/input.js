/* 触屏输入：右下角半透明动作键 + 场景内的拖拽摇杆。
 *
 * 只负责“在哪里、按了什么”，不持有战斗状态；Play 传入动作回调。
 * 键盘路径保持不变，桌面不创建这层 UI。
 */
import { UI } from './ui/tokens.js';
import { makeText } from './ui/primitives.js';

export function isTouchDevice() {
  if (typeof navigator === 'undefined') return false;
  const points = navigator.maxTouchPoints || 0;
  const coarse = typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(pointer: coarse)').matches;
  return points > 0 || !!coarse;
}

/* fx / fy 是从右 / 下边缘回退的逻辑像素；运行时按实际短边布局重算 */
const BUTTONS = [
  { id: 'attack', label: '攻', r: 22, fx: 38, fy: 42 },
  { id: 'skill', label: 'Q', r: 18, fx: 96, fy: 76 },
  { id: 'skill2', label: 'X', r: 18, fx: 140, fy: 38 },
  { id: 'interact', label: 'E', r: 15, fx: 78, fy: 28 },
  { id: 'pause', label: 'II', r: 13, fx: 34, fy: 112 },
];

export class TouchControls {
  constructor(scene, handlers = {}, specs = BUTTONS) {
    this.scene = scene;
    this.handlers = handlers;
    this.specs = specs;
    this.items = [];
    this.enabled = true;
    this._resize = () => this.layout();
    scene.scale.on('resize', this._resize);
    this.build();
    this.layout();
  }

  build() {
    for (const spec of this.specs) {
      const bg = this.scene.add.circle(0, 0, spec.r, UI.color.panel, 0.86)
        .setStrokeStyle(1, UI.color.line, 0.9)
        .setScrollFactor(0)
        .setDepth(905)
        .setInteractive({ useHandCursor: true });
      const text = makeText(this.scene, 0, 0, spec.label, 'body', {
        color: spec.id === 'pause' ? UI.text.muted : UI.text.heading,
        origin: [0.5, 0.5],
      }).setScrollFactor(0).setDepth(906);
      const item = { ...spec, bg, text, x: 0, y: 0 };
      bg.on('pointerdown', (pointer, localX, localY, event) => {
        if (event && event.stopPropagation) event.stopPropagation();
        this.press(item.id);
      });
      this.items.push(item);
    }
  }

  layout() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    for (const it of this.items) {
      it.x = w - it.fx;
      it.y = h - it.fy;
      it.bg.setPosition(it.x, it.y);
      it.text.setPosition(it.x, it.y);
    }
  }

  /* 点在按钮命中范围内就不让场景把它当成摇杆起点 */
  hitTest(x, y) {
    if (!this.enabled) return false;
    return this.items.some((it) => Phaser.Math.Distance.Between(x, y, it.x, it.y) <= it.r + 8);
  }

  setEnabled(on) {
    if (this.enabled === on) return;
    this.enabled = on;
    for (const it of this.items) {
      it.bg.setAlpha(on ? 0.86 : 0.38);
      it.text.setAlpha(on ? 1 : 0.45);
    }
  }

  press(id) {
    if (!this.enabled) return;
    const fn = this.handlers[id];
    if (typeof fn === 'function') fn();
  }

  destroy() {
    this.scene.scale.off('resize', this._resize);
    this.items.forEach((it) => { it.bg.destroy(); it.text.destroy(); });
    this.items = [];
  }
}
