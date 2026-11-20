/* 构建：源码分模块 + 引擎单独成文件（可缓存），输出 Pages 入口与单文件自测版
 *
 * 用法：
 *   node tools/build.mjs            产出 index.html + dist/game.<hash>.js + dist/assets.<hash>.js
 *   node tools/build.mjs --single   额外产出 web/game.html（全内联，双击即玩）
 */
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSET = join(ROOT, 'assets/01-primary/NinjaAdventure');
const single = process.argv.includes('--single');

/* ---------- 素材清单（新增素材只改这里） ---------- */
const img = {
  walk: join(ASSET, 'Actor/Characters/BlueNinja/SeparateAnim/Walk.png'),
  idle: join(ASSET, 'Actor/Characters/BlueNinja/SeparateAnim/Idle.png'),
  field: join(ASSET, 'Backgrounds/Tilesets/TilesetField.png'),
  beast: join(ASSET, 'Actor/Monsters/Beast/Beast.png'),
  slash: join(ASSET, 'FX/SlashFx/SlashCurved/SpriteSheet.png'),
  heart: join(ASSET, 'Ui/LifeReceptacle/heart.png'),
  coin: join(ASSET, 'Items/Treasure/Coin2.png'),
  boss: join(ASSET, 'Actor/Boss/GiantFrog/Idle40x40.png'),
  cyclope: join(ASSET, 'Actor/Monsters/Cyclope/SpriteSheet.png'),
  eye: join(ASSET, 'Actor/Monsters/Eye/Eye.png'),
  larva: join(ASSET, 'Actor/Monsters/Larva/Larva.png'),
  ball: join(ASSET, 'FX/Projectile/EnergyBall.png'),
  upgPower: join(ASSET, 'Items/Scroll/ScrollFire.png'),
  upgSpeed: join(ASSET, 'Items/Scroll/ScrollPlant.png'),
  upgAtk: join(ASSET, 'Items/Scroll/ScrollIce.png'),
};
/* 每张切片的帧尺寸（拆帧语义不变，只换打包方式） */
const FRAME = {
  walk: [16, 16], idle: [16, 16], field: [16, 16], beast: [16, 16],
  slash: [32, 32], heart: [16, 16], boss: [40, 40], coin: [10, 10],
  cyclope: [16, 16], eye: [16, 16], larva: [16, 16], ball: [16, 16],
  upgPower: [16, 16], upgSpeed: [16, 16], upgAtk: [16, 16],
};
const SFX_DIR = join(ROOT, 'web/audio');
const MUSIC = { dungeon: './web/audio/music/dungeon.mp3', fight: './web/audio/music/fight.mp3' };
const sfx = {
  sword: join(SFX_DIR, 'Sword.mp3'),
  hit: join(SFX_DIR, 'Hit.mp3'),
  hurt: join(SFX_DIR, 'MiniImpact.mp3'),
  kill: join(SFX_DIR, 'Kill.mp3'),
  gameover: join(SFX_DIR, 'GameOver.mp3'),
  coin: join(SFX_DIR, 'Coin.mp3'),
};

const b64 = (p, mime) => `data:${mime};base64,${readFileSync(p).toString('base64')}`;

/* ---------- 图集打包：多张切片 → 一张 PNG + 区域清单 ---------- */
mkdirSync(join(ROOT, 'build'), { recursive: true });
mkdirSync(join(ROOT, 'web/atlas'), { recursive: true });
const manifest = { atlasWidth: 1024, sheets: {} };
for (const [k, p] of Object.entries(img)) manifest.sheets[k] = { path: p, fw: FRAME[k][0], fh: FRAME[k][1] };
writeFileSync(join(ROOT, 'build/atlas-input.json'), JSON.stringify(manifest));
const packed = spawnSync('python3', [
  join(ROOT, 'tools/pack_atlas.py'),
  join(ROOT, 'build/atlas-input.json'),
  join(ROOT, 'web/atlas/core.png'),
  join(ROOT, 'web/atlas/core.json'),
], { encoding: 'utf8' });
if (packed.status !== 0) {
  console.error('图集打包失败：\n' + (packed.stderr || packed.error));
  process.exit(1);
}
const PACK_META = JSON.parse(readFileSync(join(ROOT, 'web/atlas/core.json'), 'utf8'));

const BALANCE_FILE = join(ROOT, 'web/data/balance.json');
const BALANCE = JSON.parse(readFileSync(BALANCE_FILE, 'utf8'));

function assetsJs(packUrl, dataUrl) {
  const out = { pack: packUrl, packMeta: PACK_META, music: MUSIC,
    balanceUrl: dataUrl, gameData: BALANCE };
  out.sfx = {};
  for (const [k, p] of Object.entries(sfx)) out.sfx[k] = b64(p, 'audio/mpeg');
  return `window.ASSET_DATA = ${JSON.stringify(out)};\n`;
}

const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 8);
const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

/* ---------- 清掉上一轮的带 hash 产物 ---------- */
mkdirSync(join(ROOT, 'dist'), { recursive: true });
for (const f of readdirSync(join(ROOT, 'dist'))) {
  if (/^game\.\w+\.js$|^assets\.\w+\.js$/.test(f)) unlinkSync(join(ROOT, 'dist', f));
}

/* ---------- 打游戏逻辑 ---------- */
const bundled = await build({
  entryPoints: [join(ROOT, 'src/main.js')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  write: false,
  logLevel: 'warning',
});
const code = bundled.outputFiles[0].text;
const assetsCode = assetsJs('./web/atlas/core.png', './web/data/balance.json');

const gameName = `game.${sha(code)}.js`;
const assetsName = `assets.${sha(assetsCode)}.js`;
writeFileSync(join(ROOT, 'dist', gameName), code);
writeFileSync(join(ROOT, 'dist', assetsName), assetsCode);

const phaser = readFileSync(join(ROOT, 'web/vendor/phaser.min.js'), 'utf8');

const head = (title) => `<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<link rel="icon" href="data:,">
<title>${title}</title>
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #0d1017; overflow: hidden; }
  #game { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; }
  canvas { image-rendering: pixelated; image-rendering: crisp-edges; }
  .fallback { color: #fff; font: 14px ui-monospace, monospace; padding: 16px; }
</style>
</head>
<body>
<div id="game"></div>
`;

/* ---------- Pages 入口：引擎与资源分开，可被缓存 ---------- */
const pagesHtml = `${head('Ninja Adventure · 开发中')}<script src="./web/vendor/phaser.min.js"></script>
<script src="./dist/${assetsName}"></script>
<script src="./dist/${gameName}"></script>
</body>
</html>
`;
writeFileSync(join(ROOT, 'index.html'), pagesHtml);

let singleSize = 0;
if (single) {
  const singleAssets = { pack: b64(join(ROOT, 'web/atlas/core.png'), 'image/png'), packMeta: PACK_META,
    balanceUrl: './data/balance.json', gameData: BALANCE,
    music: { dungeon: './audio/music/dungeon.mp3', fight: './audio/music/fight.mp3' }, sfx: {} };
  for (const [k, p] of Object.entries(sfx)) singleAssets.sfx[k] = b64(p, 'audio/mpeg');
  const singleHtml = `${head('Ninja Adventure · 单文件版')}<script>window.ASSET_DATA = ${JSON.stringify(singleAssets)};</script>
<script>${phaser}</script>
<script>${code}</script>
</body>
</html>
`;
  writeFileSync(join(ROOT, 'web/game.html'), singleHtml);
  singleSize = statSync(join(ROOT, 'web/game.html')).size;
}

console.log(`已生成 index.html`);
console.log(`  引擎(单独缓存) ${kb(statSync(join(ROOT, 'web/vendor/phaser.min.js')).size)}  → web/vendor/phaser.min.js`);
console.log(`  图集           ${kb(statSync(join(ROOT, 'web/atlas/core.png')).size)}  → web/atlas/core.png（${Object.keys(PACK_META.sheets).length} 张切片）`);
console.log(`  素材数据       ${kb(statSync(join(ROOT, 'dist', assetsName)).size)}  → dist/${assetsName}`);
console.log(`  游戏逻辑       ${kb(statSync(join(ROOT, 'dist', gameName)).size)}  → dist/${gameName}`);
if (single) console.log(`  单文件自测     ${kb(singleSize)}  → web/game.html`);
