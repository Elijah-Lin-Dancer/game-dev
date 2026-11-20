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
  villager: join(ASSET, 'Actor/Characters/Villager/SeparateAnim/Walk.png'),
  villager2: join(ASSET, 'Actor/Characters/Villager2/SeparateAnim/Walk.png'),
  statue: join(ASSET, 'Actor/Characters/Statue/SeparateAnim/Idle.png'),
  /* 批 1 武器：6 张图标 + 5 张手持（弓没有手持帧，用图标顶）+ 4 套斩击 + 3 种弹体 */
  wKatana: join(ASSET, 'Items/Weapons/Katana/Sprite.png'),
  wBigSword: join(ASSET, 'Items/Weapons/BigSword/Sprite.png'),
  wHammer: join(ASSET, 'Items/Weapons/Hammer/Sprite.png'),
  wBow: join(ASSET, 'Items/Weapons/Bow/Sprite.png'),
  wWand: join(ASSET, 'Items/Weapons/MagicWand/Sprite.png'),
  wKunai: join(ASSET, 'Items/Weapons/Ninjaku/Sprite.png'),
  hKatana: join(ASSET, 'Items/Weapons/Katana/SpriteInHand.png'),
  hBigSword: join(ASSET, 'Items/Weapons/BigSword/SpriteInHand.png'),
  hHammer: join(ASSET, 'Items/Weapons/Hammer/SpriteInHand.png'),
  hWand: join(ASSET, 'Items/Weapons/MagicWand/SpriteInHand.png'),
  hKunai: join(ASSET, 'Items/Weapons/Ninjaku/SpriteInHand.png'),
  slA: join(ASSET, 'FX/SlashFx/Slash/SpriteSheet.png'),
  slB: join(ASSET, 'FX/SlashFx/SlashDoubleCurved/SpriteSheet.png'),
  slC: join(ASSET, 'FX/SlashFx/CircularSlash/SpriteSheet.png'),
  slD: join(ASSET, 'FX/SlashFx/Cut/SpriteSheet.png'),
  arrow: join(ASSET, 'FX/Projectile/Arrow.png'),
  kunaiProj: join(ASSET, 'FX/Projectile/Kunai.png'),
  fireball: join(ASSET, 'FX/Projectile/Fireball.png'),
  /* 批 2 房间：宝箱两帧 / 钥匙 / 精英光环 / 篝火（外部 CC0，见 assets/CREDITS.md） */
  chest: join(ASSET, 'Items/Treasure/BigTreasureChest.png'),
  key: join(ASSET, 'Items/Treasure/GoldKey.png'),
  aura: join(ASSET, 'FX/Magic/Circle/SpriteSheetOrange.png'),
  campfire: join(ROOT, 'assets/01-primary/external/campfire-16x16.png'),
};
/* 每张切片的帧尺寸（拆帧语义不变，只换打包方式） */
const FRAME = {
  walk: [16, 16], idle: [16, 16], field: [16, 16], beast: [16, 16],
  slash: [32, 32], heart: [16, 16], boss: [40, 40], coin: [10, 10],
  cyclope: [16, 16], eye: [16, 16], larva: [16, 16], ball: [16, 16],
  upgPower: [16, 16], upgSpeed: [16, 16], upgAtk: [16, 16],
  villager: [16, 16], villager2: [16, 16], statue: [16, 16],
  wKatana: [6, 14], wBigSword: [7, 16], wHammer: [9, 16], wBow: [15, 7], wWand: [5, 18], wKunai: [7, 12],
  hKatana: [6, 10], hBigSword: [7, 12], hHammer: [9, 9], hWand: [5, 10], hKunai: [3, 12],
  slA: [32, 32], slB: [32, 32], slC: [32, 32], slD: [32, 32],
  arrow: [13, 5], kunaiProj: [14, 5], fireball: [16, 16],
  chest: [16, 14], key: [12, 8], aura: [32, 32], campfire: [16, 16],
};
const SFX_DIR = join(ROOT, 'web/audio/sfx');
/* 音乐按情绪懒加载（不进 assets.js，走 HTMLAudio 流式），key 即 mood */
const MUSIC = {
  dungeon: './web/audio/music/dungeon.mp3',
  fight: './web/audio/music/fight.mp3',
  lobby: './web/audio/music/lobby.mp3',
  shop: './web/audio/music/shop.mp3',
  victory: './web/audio/music/victory.mp3',
  cave: './web/audio/music/cave.mp3',
};
/* 音效 base64 内联：单个 2–20 KB，换来"开口即响"没有额外请求 */
const sfx = {
  sword: join(SFX_DIR, 'sword.mp3'),
  hit: join(SFX_DIR, 'hit.mp3'),
  hurt: join(SFX_DIR, 'hurt.mp3'),
  kill: join(SFX_DIR, 'kill.mp3'),
  gameover: join(SFX_DIR, 'gameover.mp3'),
  coin: join(SFX_DIR, 'coin.mp3'),
  ui: join(SFX_DIR, 'ui.mp3'),
  bonus: join(SFX_DIR, 'bonus.mp3'),
  boom: join(SFX_DIR, 'boom.mp3'),
  alarm: join(SFX_DIR, 'alarm.mp3'),
  magic: join(SFX_DIR, 'magic.mp3'),
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

/* ---------- 字体：构建期子集化（900 KB 全字库 → 游戏实际用到的字符） ---------- */
const FONT_SRC = join(ROOT, 'assets/01-primary/fonts/fusion-pixel-12px-monospaced-zh_hans.ttf.woff2');
const FONT_OUT = join(ROOT, 'web/fonts/game.woff2');
const subset = spawnSync('python3', [join(ROOT, 'tools/subset_font.py'), FONT_SRC, FONT_OUT], { encoding: 'utf8' });
if (subset.status !== 0) {
  console.error('字体子集化失败：\n' + (subset.stderr || subset.error));
  process.exit(1);
}
const FONT_SIZE = statSync(FONT_OUT).size;

const BALANCE_FILE = join(ROOT, 'web/data/balance.json');
const BALANCE = JSON.parse(readFileSync(BALANCE_FILE, 'utf8'));
const STORY = JSON.parse(readFileSync(join(ROOT, 'web/data/story.json'), 'utf8'));
const WEAPONS = JSON.parse(readFileSync(join(ROOT, 'web/data/weapons.json'), 'utf8'));
const TALENTS = JSON.parse(readFileSync(join(ROOT, 'web/data/talents.json'), 'utf8'));

function assetsJs(packUrl, dataUrl) {
  const out = { pack: packUrl, packMeta: PACK_META, music: MUSIC,
    balanceUrl: dataUrl, gameData: BALANCE, storyData: STORY, storyUrl: dataUrl.replace('balance', 'story'),
    weaponsUrl: dataUrl.replace('balance', 'weapons'), weaponsData: WEAPONS,
    talentsUrl: dataUrl.replace('balance', 'talents'), talentsData: TALENTS };
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

const head = (title, fontUrl) => `<html lang="zh-CN">
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
  @font-face { font-family: "NinjaPixel"; src: url("${fontUrl}") format("woff2"); font-display: block; }
</style>
</head>
<body>
<div id="game"></div>
`;

/* ---------- Pages 入口：引擎与资源分开，可被缓存 ---------- */
const pagesHtml = `${head('Ninja Adventure · 开发中', './web/fonts/game.woff2')}<script src="./web/vendor/phaser.min.js"></script>
<script src="./dist/${assetsName}"></script>
<script src="./dist/${gameName}"></script>
</body>
</html>
`;
writeFileSync(join(ROOT, 'index.html'), pagesHtml);

let singleSize = 0;
if (single) {
  const singleAssets = { pack: b64(join(ROOT, 'web/atlas/core.png'), 'image/png'), packMeta: PACK_META,
    balanceUrl: './data/balance.json', gameData: BALANCE, weaponsData: WEAPONS, weaponsUrl: './data/weapons.json',
    talentsUrl: './data/talents.json', talentsData: TALENTS,
    music: { dungeon: './audio/music/dungeon.mp3', fight: './audio/music/fight.mp3',
      lobby: './audio/music/lobby.mp3', shop: './audio/music/shop.mp3',
      victory: './audio/music/victory.mp3', cave: './audio/music/cave.mp3' }, sfx: {} };
  for (const [k, p] of Object.entries(sfx)) singleAssets.sfx[k] = b64(p, 'audio/mpeg');
  const singleHtml = `${head('Ninja Adventure · 单文件版', b64(FONT_OUT, 'font/woff2'))}<script>window.ASSET_DATA = ${JSON.stringify(singleAssets)};</script>
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
console.log(`  字体           ${kb(FONT_SIZE)}  → web/fonts/game.woff2（NinjaPixel，子集）`);
console.log(`  图集           ${kb(statSync(join(ROOT, 'web/atlas/core.png')).size)}  → web/atlas/core.png（${Object.keys(PACK_META.sheets).length} 张切片）`);
console.log(`  素材数据       ${kb(statSync(join(ROOT, 'dist', assetsName)).size)}  → dist/${assetsName}`);
console.log(`  游戏逻辑       ${kb(statSync(join(ROOT, 'dist', gameName)).size)}  → dist/${gameName}`);
const audioSize = Object.keys(MUSIC).reduce((n, k) => n + statSync(join(ROOT, MUSIC[k].replace('./', ''))).size, 0);
console.log(`  音乐(懒加载)   ${(audioSize / 1048576).toFixed(2)} MB  → ${Object.keys(MUSIC).length} 首 mood（不进 assets.js）`);
if (single) console.log(`  单文件自测     ${kb(singleSize)}  → web/game.html`);
