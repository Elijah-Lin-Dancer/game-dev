/* G2 五群系 3D 像素离线素材
 *
 * 源：art-src/g2/*.cjs，固定 seed；只产出透明 RGBA 图集，不接运行时。
 * 复现：INK_STUDIO=... node art-src/g2/render-g2.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const studioPath = process.env.INK_STUDIO || '/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio';
if (!fs.existsSync(studioPath)) throw new Error('Set INK_STUDIO to a checkout of siliconjungle/shapeshift-labs-ink-studio');
const lib = require(studioPath);
const studio = lib.load();
const outDir = path.resolve(__dirname, '../../docs/revamp/g2-3d');
fs.mkdirSync(outDir, { recursive: true });

const specs = [
  { file: 'bamboo-grove.cjs', out: 'bamboo-grove-atlas', w: 64, h: 96, directions: 1, dist: 5.2 },
  { file: 'bamboo-gate.cjs', out: 'bamboo-gate-atlas', w: 96, h: 160, directions: 1, dist: 8.2 },
  { file: 'bamboo-hermit.cjs', out: 'bamboo-hermit-atlas', w: 64, h: 64, directions: 4, dist: 4.3 },
  { file: 'desert-nomad.cjs', out: 'desert-nomad-atlas', w: 64, h: 64, directions: 4, dist: 4.3 },
  { file: 'desert-shrub.cjs', out: 'desert-shrub-atlas', w: 32, h: 48, directions: 1, dist: 3.5 },
  { file: 'desert-arch.cjs', out: 'desert-arch-atlas', w: 96, h: 128, directions: 1, dist: 5.4 },
  { file: 'desert-palm.cjs', out: 'desert-palm-atlas', w: 64, h: 96, directions: 1, dist: 6.3 },
  { file: 'desert-dead-tree.cjs', out: 'desert-dead-tree-atlas', w: 64, h: 80, directions: 1, dist: 5.0 },
  { file: 'snow-pine.cjs', out: 'snow-pine-atlas', w: 96, h: 128, directions: 1, dist: 4.2 },
  { file: 'snow-shrine.cjs', out: 'snow-shrine-atlas', w: 96, h: 128, directions: 1, dist: 3.8 },
  { file: 'snow-keeper.cjs', out: 'snow-keeper-atlas', w: 64, h: 64, directions: 4, dist: 4.3 },
  { file: 'snow-lantern.cjs', out: 'snow-lantern-atlas', w: 32, h: 48, directions: 1, dist: 3.4 },
  { file: 'volcano-spire.cjs', out: 'volcano-spire-atlas', w: 64, h: 96, directions: 1, dist: 5.2 },
  { file: 'volcano-vent.cjs', out: 'volcano-vent-atlas', w: 64, h: 48, directions: 1, dist: 4.6 },
];

for (const spec of specs) {
  const scene = require(path.join(__dirname, spec.file))(studio);
  const world = scene.build(scene.seed);
  const atlas = lib.spriteAtlas(world, {
    width: spec.w,
    height: spec.h,
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
    note: 'RGBA color atlas; frames left-to-right, one row, directions 0..3',
  }, null, 2) + '\n');
  console.log(`${scene.name}: ${world.count} splats -> ${spec.out}.png (${atlas.metadata.width}x${atlas.metadata.height})`);
}
