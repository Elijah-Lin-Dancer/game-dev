/* 把 Phaser + 素材 + 游戏逻辑打成单个自包含 HTML
 * 用法：node tools/build-webapp.mjs
 * 产物：web/game.html（约 1.5 MB，双击或任意静态服务均可运行）
 */
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSET = join(ROOT, 'assets/01-primary/NinjaAdventure');

const src = {
  phaser: join(ROOT, 'web/vendor/phaser.min.js'),
  game: join(ROOT, 'web/main.js'),
};

const img = {
  walk: join(ASSET, 'Actor/Characters/BlueNinja/SeparateAnim/Walk.png'),
  idle: join(ASSET, 'Actor/Characters/BlueNinja/SeparateAnim/Idle.png'),
  attack: join(ASSET, 'Actor/Characters/BlueNinja/SeparateAnim/Attack.png'),
  field: join(ASSET, 'Backgrounds/Tilesets/TilesetField.png'),
  beast: join(ASSET, 'Actor/Monsters/Beast/Beast.png'),
  slash: join(ASSET, 'FX/SlashFx/SlashCurved/SpriteSheet.png'),
  heart: join(ASSET, 'Ui/LifeReceptacle/heart.png'),
  coin: join(ASSET, 'Items/Treasure/Coin2.png'),
  boss: join(ASSET, 'Actor/Boss/GiantFrog/Idle40x40.png'),
};

// 音效优先用仓库里转好的 mp3；没有就报错提示先转码
const SFX_DIR = join(ROOT, 'web/audio');
const sfx = {
  sword: join(SFX_DIR, 'Sword.mp3'),
  hit: join(SFX_DIR, 'Hit.mp3'),
  hurt: join(SFX_DIR, 'MiniImpact.mp3'),
  kill: join(SFX_DIR, 'Kill.mp3'),
  gameover: join(SFX_DIR, 'GameOver.mp3'),
  coin: join(SFX_DIR, 'Coin.mp3'),
};

const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`;
const audio = (p) => `data:audio/mpeg;base64,${readFileSync(p).toString('base64')}`;

const assets = {};
for (const [k, p] of Object.entries(img)) assets[k] = b64(p);
assets.sfx = {};
for (const [k, p] of Object.entries(sfx)) assets.sfx[k] = audio(p);

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<title>Ninja Adventure · 原型 A</title>
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #0d1017; overflow: hidden; }
  #game { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; }
  canvas { image-rendering: pixelated; image-rendering: crisp-edges; }
  .fallback { color: #fff; font: 14px ui-monospace, monospace; padding: 16px; }
</style>
</head>
<body>
<div id="game"></div>
<script>window.ASSET_DATA = ${JSON.stringify(assets)};</script>
<script>${readFileSync(src.phaser, 'utf8')}</script>
<script>${readFileSync(src.game, 'utf8')}</script>
</body>
</html>
`;

const out = join(ROOT, 'web/game.html');
writeFileSync(out, html, 'utf8');

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`已生成 ${out}`);
console.log(`  phaser   ${kb(statSync(src.phaser).size)}`);
console.log(`  逻辑     ${kb(statSync(src.game).size)}`);
console.log(`  图片     ${kb(Object.entries(assets).filter(([k]) => k !== 'sfx').reduce((s, [, b]) => s + b.length, 0))}`);
console.log(`  音效     ${kb(Object.values(assets.sfx).reduce((s, b) => s + b.length, 0))}`);
console.log(`  合计     ${kb(statSync(out).size)}`);
