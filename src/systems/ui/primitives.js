/* P1-C UI 基础组件：只负责表现，不读写存档、不持有玩法状态。
 * 调用方保留交互与内容；组件只返回可组合的 Phaser 对象。
 */
import { UI } from './tokens.js';

const ROLE_COLOR = {
  h1: UI.text.heading,
  h2: UI.text.heading,
  body: UI.text.body,
  muted: UI.text.muted,
  info: UI.text.info,
  danger: UI.text.danger,
  gold: UI.text.gold,
  locked: UI.text.locked,
  caption: UI.text.muted,
  special: UI.text.special,
  specialMuted: UI.text.specialMuted,
};

const ROLE_SIZE = {
  h1: UI.size.h1,
  h2: UI.size.h2,
  body: UI.size.body,
  muted: UI.size.body,
  info: UI.size.body,
  danger: UI.size.body,
  gold: UI.size.body,
  locked: UI.size.body,
  caption: UI.size.caption,
  special: UI.size.body,
  specialMuted: UI.size.body,
};

function addChildren(container, children) {
  children.forEach((child) => { if (child) container.add(child); });
}

function panelObject(scene, key, w, h, variant) {
  const [left, right, top, bottom] = UI.nineslice.panel;
  if (scene.textures.exists(key)) {
    return scene.add.nineslice(0, 0, key, 0, w, h, left, right, top, bottom).setOrigin(0);
  }
  const bg = scene.add.rectangle(0, 0, w, h, variant === 'raised' ? UI.color.panelRaised : UI.color.panel, UI.alpha.panel)
    .setOrigin(0);
  bg.setStrokeStyle(2, UI.color.line);
  return bg;
}

export function makePanel(scene, { x, y, w, h, variant = 'base', depth = 0 }) {
  const container = scene.add.container(x, y).setDepth(depth);
  const key = variant === 'special' ? UI.atlas.panelSpecial
    : variant === 'raised' ? UI.atlas.panelRaised : UI.atlas.panelBase;
  const bg = panelObject(scene, key, w, h, variant);
  container.add(bg);
  container.setSize(w, h);
  return {
    container,
    bg,
    add(...children) { addChildren(container, children); return this; },
  };
}

export function makeText(scene, x, y, text, role = 'body', opts = {}) {
  const size = ROLE_SIZE[role] || UI.size.body;
  const { origin, ...style } = opts;
  const color = style.color || ROLE_COLOR[role] || UI.text.body;
  const t = scene.add.text(x, y, text, {
    fontFamily: UI.font,
    fontSize: `${size}px`,
    color,
    ...style,
  });
  if (origin) t.setOrigin(origin[0], origin[1]);
  return t;
}

export function makeCard(scene, {
  x, y, w, h, accent = UI.color.neutral, state = 'default', depth = 0, onClick,
}) {
  const container = scene.add.container(x, y).setDepth(depth);
  const base = panelObject(scene, UI.atlas.cardBase, w, h, 'base');
  const alt = panelObject(scene, UI.atlas.cardRaised, w, h, 'raised').setVisible(false);
  const bar = scene.add.rectangle(0, 0, 4, h, accent, 0.95).setOrigin(0);
  const outline = scene.add.rectangle(0, 0, w, h).setOrigin(0)
    .setStrokeStyle(2, accent, 1).setVisible(false);
  addChildren(container, [base, alt, bar, outline]);
  container.setSize(w, h);
  // Container 内的输入在嵌套/重排时不稳定；用独立透明命中层承接指针，视觉仍由 container 负责。
  const hit = scene.add.rectangle(x, y, w, h, 0, 0).setOrigin(0).setDepth(depth + 0.02);

  let baseState = state;
  let accentColor = accent;

  function setAccent(color) {
    accentColor = color;
    bar.setFillStyle(color, 0.95);
    outline.setStrokeStyle(2, color, 1);
  }

  function apply(visual) {
    base.setVisible(true);
    alt.setVisible(visual === 'hover' || visual === 'selected');
    bar.setAlpha(visual === 'locked' ? 0.38 : 0.95);
    if (visual === 'selected') {
      outline.setVisible(true).setStrokeStyle(2, UI.color.selected, 1);
    } else if (visual === 'hover') {
      outline.setVisible(true).setStrokeStyle(2, accentColor, 0.9);
    } else if (visual === 'cleared') {
      outline.setVisible(true).setStrokeStyle(1, UI.color.gold, 0.6);
    } else {
      outline.setVisible(false);
    }
  }

  const api = {
    container,
    hit,
    bg: base,
    accent: bar,
    setAccent,
    setState(next, opts = {}) {
      baseState = next;
      if (opts.accent) setAccent(opts.accent);
      apply(baseState);
    },
    setVisible(visible) {
      container.setVisible(visible);
      hit.setVisible(visible);
      if (hit.input) hit.input.enabled = visible;
    },
    add(...children) { addChildren(container, children); return api; },
  };

  if (onClick) {
    hit.setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => {
      if (baseState !== 'locked' && baseState !== 'selected') apply('hover');
    });
    hit.on('pointerout', () => apply(baseState));
    hit.on('pointerdown', onClick);
  }
  apply(baseState);
  return api;
}

export function makeButton(scene, {
  x, y, w, h, label, state = 'normal', variant = 'solid', depth = 0, onClick,
}) {
  const container = scene.add.container(x, y).setDepth(depth);
  const backgrounds = {};
  if (variant === 'ghost') {
    // 次级操作：暗底 + 细描边，不和暖橙主按钮抢注意力
    const skins = {
      normal: [UI.color.panelRaised, 0.9, UI.color.line, UI.text.info],
      hover: [UI.color.panelRaised, 0.98, UI.color.info, UI.text.info],
      pressed: [UI.color.panel, 1, UI.color.selected, UI.text.heading],
      disabled: [UI.color.panelLocked, 0.8, UI.color.lineMuted, UI.text.disabled],
    };
    Object.entries(skins).forEach(([name, [fill, alpha, line, color]]) => {
      const bg = scene.add.rectangle(0, 0, w, h, fill, alpha).setOrigin(0)
        .setStrokeStyle(1, line);
      bg.setVisible(name === 'normal');
      bg._textColor = color;
      backgrounds[name] = bg;
      container.add(bg);
    });
  } else {
    const [left, right, top, bottom] = UI.nineslice.button;
    const keys = {
      normal: UI.atlas.buttonNormal,
      hover: UI.atlas.buttonHover,
      pressed: UI.atlas.buttonPressed,
      disabled: UI.atlas.buttonDisabled,
    };
    Object.entries(keys).forEach(([name, key]) => {
      const bg = scene.textures.exists(key)
        ? scene.add.nineslice(0, 0, key, 0, w, h, left, right, top, bottom).setOrigin(0)
        : scene.add.rectangle(0, 0, w, h, name === 'disabled' ? UI.color.lineMuted : UI.color.gold, 1).setOrigin(0);
      bg.setVisible(name === 'normal');
      backgrounds[name] = bg;
      container.add(bg);
    });
  }
  const text = makeText(scene, w / 2, h / 2, label, 'body', {
    color: UI.text.onAccent,
    origin: [0.5, 0.5],
  });
  container.add(text);
  container.setSize(w, h);

  let baseState = state;
  let enabled = state !== 'disabled';
  const hit = scene.add.rectangle(x, y, w, h, 0, 0).setOrigin(0).setDepth(depth + 0.02);

  function apply(visual) {
    Object.entries(backgrounds).forEach(([name, bg]) => bg.setVisible(name === visual));
    if (variant === 'ghost') {
      const active = backgrounds[visual] || backgrounds.normal;
      text.setColor(active._textColor || UI.text.info);
    } else {
      text.setColor(visual === 'disabled' ? UI.text.disabled : UI.text.onAccent);
    }
  }

  const api = {
    container,
    hit,
    text,
    setVisible(visible) {
      container.setVisible(visible);
      hit.setVisible(visible);
      if (hit.input) hit.input.enabled = visible && enabled;
    },
    setEnabled(next) {
      enabled = next;
      if (hit.input) hit.input.enabled = next;
      if (!next) apply('disabled');
      else apply(baseState === 'disabled' ? 'normal' : baseState);
    },
    setState(next) {
      baseState = next;
      enabled = next !== 'disabled';
      apply(baseState);
      if (hit.input) hit.input.enabled = enabled;
    },
    setLabel(next) { text.setText(next); },
  };

  hit.setInteractive({ useHandCursor: enabled });
  hit.input.enabled = enabled;
  hit.on('pointerover', () => { if (enabled) apply('hover'); });
  hit.on('pointerout', () => { if (enabled) apply(baseState === 'disabled' ? 'normal' : baseState); });
  hit.on('pointerup', () => { if (enabled) apply('hover'); });
  hit.on('pointerdown', () => {
    if (!enabled) return;
    apply('pressed');
    if (onClick) onClick();
  });
  apply(baseState);
  return api;
}
