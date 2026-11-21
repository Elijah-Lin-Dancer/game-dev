/* 入口：装配 Phaser 并处理自适应尺寸 */
import { S, logicalSize } from './core/config.js';
import { Boot } from './scenes/boot.js';
import { Play } from './scenes/play.js';
import { Select } from './scenes/select.js';
import { Hall } from './scenes/hall.js';
import { resetSave } from './systems/save.js';

// 像素字体按 12px 设计；用带引号的族名，避免被当成通用族名解析
const FONT_PROBE = '12px "NinjaPixel"';

window.addEventListener('load', () => {
  // ?reset 清掉本地存档（调试/换机器时用）
  if (location.search.indexOf('reset') >= 0) resetSave();

  // 像素字体必须先 load 完再建 Phaser：文字纹理是在建场景时一次性画进 canvas 的，
  // 字体晚到会整屏退回系统等宽字体，而且不会自己重画。1.5 秒兜底，字体挂了也能进游戏。
  let started = false;
  const start = () => { if (started) return; started = true; boot(); };

  if (document.fonts && document.fonts.load) {
    Promise.race([
      document.fonts.load(FONT_PROBE),
      new Promise((r) => setTimeout(r, 1500)),
    ]).then(start, start);
  } else {
    start();
  }

  function boot() {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: S.W, height: S.H,
      parent: 'game',
      backgroundColor: '#2f3b2a',
      pixelArt: true,
      roundPixels: true,
      scale: { mode: Phaser.Scale.NONE, width: S.W, height: S.H },
      audio: { disableWebAudio: true },
      scene: [Boot, Hall, Select, Play],
    });

    function present() {
      const g = game.scale;
      const k = Math.min(window.innerWidth / g.width, window.innerHeight / g.height);
      game.canvas.style.width = Math.round(g.width * k) + 'px';
      game.canvas.style.height = Math.round(g.height * k) + 'px';
    }
    present();

    let timer = 0;
    window.addEventListener('resize', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const next = logicalSize();
        game.scale.resize(next.W, next.H);
        present();
      }, 120);
    });
  }
});
