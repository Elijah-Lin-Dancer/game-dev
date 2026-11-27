/* G5-3 / 旧堡地形套件渲染
 * 地面：4×4 变体板，512→128 最近邻；
 * 墙体：4 个 32px 块，512→32 最近邻后横排成 128×32；
 * 墙脚阴影：32×32 RGBA，12px 黑到透明渐变。
 * 复现：INK_STUDIO=... node art-src/g5/render-fort-terrain.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const studioPath = process.env.INK_STUDIO || '/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio';
if (!fs.existsSync(studioPath)) throw new Error('Set INK_STUDIO to a checkout of siliconjungle/shapeshift-labs-ink-studio');
const lib = require(studioPath);
const png = require(path.join(studioPath, 'cli/png.js'));
const studio = lib.load();
const outDir = path.resolve(__dirname, '../../docs/revamp/g5-3d');
fs.mkdirSync(outDir, { recursive: true });

function render(part, size, opts = {}) {
  const scene = require(path.join(__dirname, 'fort-terrain.cjs'))(studio);
  const world = scene.build(scene.seed, part);
  return lib.render(world, {
    w: size, h: size, px: 1, ortho: true, lensScale: opts.lens || 4.8,
    fov: 0.8, pitch: opts.pitch ?? 1.55, yaw: 0,
    target: opts.target ?? [0, 0, 0],
  });
}

// 地面：1024 → 256（最近邻，保持 32px 网格 / 8×8 变体）。
const floorBig = render('floor', 1024, { lens: 2.4 });
const floorSmall = new Uint8Array(256 * 256 * 3);
for (let y = 0; y < 256; y += 1) for (let x = 0; x < 256; x += 1) {
  const sx = x * 4, sy = y * 4;
  const si = (sy * 1024 + sx) * 3, di = (y * 256 + x) * 3;
  floorSmall[di] = floorBig.rgb[si]; floorSmall[di + 1] = floorBig.rgb[si + 1]; floorSmall[di + 2] = floorBig.rgb[si + 2];
}
fs.writeFileSync(path.join(outDir, 'fort-floor.png'), png.encode(256, 256, floorSmall, 3));

// 墙体：每个变体 512 → 32，然后横向拼接 4 帧。
const wallSmall = new Uint8Array(128 * 32 * 3);
for (let v = 0; v < 4; v += 1) {
  const big = render(String(v), 512, { lens: 20.0, pitch: 1.10, target: [0, 0.50, 0] });
  for (let y = 0; y < 32; y += 1) for (let x = 0; x < 32; x += 1) {
    const sx = x * 16, sy = y * 16;
    const si = (sy * 512 + sx) * 3, di = (y * 128 + v * 32 + x) * 3;
    wallSmall[di] = big.rgb[si]; wallSmall[di + 1] = big.rgb[si + 1]; wallSmall[di + 2] = big.rgb[si + 2];
  }
}
fs.writeFileSync(path.join(outDir, 'fort-wall.png'), png.encode(128, 32, wallSmall, 3));

// 墙脚阴影：RGBA，顶部 12px 不透明度 92→0。
const shadow = new Uint8Array(32 * 32 * 4);
for (let y = 0; y < 32; y += 1) for (let x = 0; x < 32; x += 1) {
  const i = (y * 32 + x) * 4;
  shadow[i] = 4; shadow[i + 1] = 2; shadow[i + 2] = 1;
  shadow[i + 3] = y < 12 ? Math.round(92 * (1 - y / 12)) : 0;
}
fs.writeFileSync(path.join(outDir, 'fort-shadow.png'), png.encode(32, 32, shadow, 4));

console.log(`fort-floor.png 256x256; fort-wall.png 128x32 (4x32); fort-shadow.png 32x32; floor ${floorBig.w}x${floorBig.h} -> 256; wall ${'4x'}32`);
