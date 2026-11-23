/* 批 13：小屋 3D 像素件离线渲染
 *
 * 只产出透明 RGBA 源图集，再由 crop_hub.py 取正面帧、最近邻落到游戏尺寸。
 * 不接运行时 splat 渲染器；正式图在 assets/01-primary/hub/。
 */
const fs = require('node:fs');
const path = require('node:path');
const studioPath = process.env.INK_STUDIO || '/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio';
if (!fs.existsSync(studioPath)) throw new Error('Set INK_STUDIO to a checkout of siliconjungle/shapeshift-labs-ink-studio');
const lib = require(studioPath);
const studio = lib.load();
const outDir = path.resolve(__dirname, '../../docs/revamp/b13-3d');
fs.mkdirSync(outDir, { recursive: true });

const specs = [
  { file: 'guide.cjs', out: 'guide-atlas', size: 64, directions: 4, dist: 4.7 },
  { file: 'smith.cjs', out: 'smith-atlas', size: 64, directions: 4, dist: 4.8 },
  { file: 'merchant.cjs', out: 'merchant-atlas', size: 64, directions: 4, dist: 4.8 },
  { file: 'anvil.cjs', out: 'anvil-atlas', size: 64, directions: 1, dist: 3.4 },
  { file: 'dummy.cjs', out: 'dummy-atlas', size: 64, directions: 1, dist: 4.0 },
];

for (const spec of specs) {
  const scene = require(path.join(__dirname, spec.file))(studio);
  const world = scene.build(scene.seed);
  const atlas = lib.spriteAtlas(world, {
    width: spec.size,
    height: spec.size,
    directions: spec.directions,
    times: [0],
    columns: spec.directions,
    view: { dist: spec.dist },
  });
  const png = require(path.join(studioPath, 'cli/png.js')).encode(
    atlas.metadata.width, atlas.metadata.height, atlas.images.color, 4
  );
  fs.writeFileSync(path.join(outDir, spec.out + '.png'), png);
  fs.writeFileSync(path.join(outDir, spec.out + '.json'), JSON.stringify({
    ...atlas.metadata,
    sourceScene: spec.file,
    renderer: 'ink-studio CPU spriteAtlas',
    note: 'RGBA color atlas; frames are left-to-right, one row, directions 0..3'
  }, null, 2) + '\n');
  console.log(`${scene.name}: ${world.count} splats -> ${spec.out}.png (${atlas.metadata.width}x${atlas.metadata.height})`);
}
