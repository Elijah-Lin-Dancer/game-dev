/* P1-C 视觉令牌：字号只允许 12 / 24；场景不再新增散落色值。 */
import { FONT } from '../../core/config.js';

const UI = {
  font: FONT,
  size: { h1: 24, h2: 12, body: 12, caption: 12 },
  color: {
    overlay: 0x000000,
    panel: 0x121a16,
    panelRaised: 0x1c2420,
    panelLocked: 0x171b18,
    line: 0x3f4f46,
    lineMuted: 0x35302a,
    specialLine: 0x5a4f6c,
    selected: 0xffe9b0,
    gold: 0xffd479,
    info: 0x9fe0ff,
    danger: 0xffb0a0,
    side: 0x7cb342,
    hidden: 0xab47bc,
    conditional: 0x42a5f5,
    neutral: 0x55645a,
  },
  text: {
    heading: '#ffe9b0',
    primary: '#e6efe6',
    body: '#c8d8c0',
    muted: '#8fa0a8',
    info: '#9fe0ff',
    danger: '#ffb0a0',
    gold: '#ffd479',
    onAccent: '#101713',
    locked: '#7a6a64',
    disabled: '#665f5a',
    nameLocked: '#8a837e',
    typeOpen: '#b8c8ba',
    special: '#e7d4ff',
    specialMuted: '#9e93aa',
    foot: '#c8d8c0cc',
  },
  atlas: {
    panelBase: 'uiBg2',
    panelRaised: 'uiBg',
    panelSpecial: 'uiBg2',
    cardBase: 'uiBg',
    cardRaised: 'uiBg2',
    buttonNormal: 'uiBtnNormal',
    buttonHover: 'uiBtnHover',
    buttonPressed: 'uiBtnPressed',
    buttonDisabled: 'uiBtnDisabled',
    focus: 'uiFocus',
  },
  nineslice: {
    panel: [4, 4, 4, 4],
    button: [4, 4, 2, 2],
  },
  alpha: {
    panel: 0.96,
    overlay: 0.78,
    disabled: 0.52,
    locked: 0.72,
  },
  hud: {
    bg: '#0a0f12dd',
    bgSoft: '#0a0f1299',
    bgClear: '#0a0f1266',
  },
  typeColor(type) {
    return { side: UI.color.side, hidden: UI.color.hidden, conditional: UI.color.conditional }[type] || UI.color.neutral;
  },
};

export { UI };
