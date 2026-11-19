/* 入口：装配 Phaser 并处理自适应尺寸 */
import { S, logicalSize } from './core/config.js';
import { Boot } from './scenes/boot.js';
import { Play } from './scenes/play.js';

window.addEventListener('load', () => {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: S.W, height: S.H,
    parent: 'game',
    backgroundColor: '#2f3b2a',
    pixelArt: true,
    roundPixels: true,
    scale: { mode: Phaser.Scale.NONE, width: S.W, height: S.H },
    audio: { disableWebAudio: true },
    scene: [Boot, Play],
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
});
