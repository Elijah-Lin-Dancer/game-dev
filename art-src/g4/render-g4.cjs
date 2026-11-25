/* G4-1 雾泽 3D 像素离线素材
 *
 * 源：art-src/g4/*.cjs，固定 seed；只产出透明 RGBA 图集，不接运行时。
 * 复现：INK_STUDIO=... node art-src/g4/render-g4.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const studioPath = process.env.INK_STUDIO || '/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio';
if (!fs.existsSync(studioPath)) throw new Error('Set INK_STUDIO to a checkout of siliconjungle/shapeshift-labs-ink-studio');
const lib = require(studioPath);
const studio = lib.load();
const outDir = path.resolve(__dirname, '../../docs/revamp/g4-3d');
fs.mkdirSync(outDir, { recursive: true });

const specs = [
  { file: 'mire-keeper.cjs', out: 'mire-keeper-atlas', w: 64, h: 64, directions: 4, dist: 4.35 },
  { file: 'mire-reed.cjs', out: 'mire-reed-atlas', w: 64, h: 96, directions: 1, dist: 5.15 },
  { file: 'mire-shrine.cjs', out: 'mire-shrine-atlas', w: 96, h: 128, directions: 1, dist: 5.2 },
  { file: 'mire-herb.cjs', out: 'mire-herb-atlas', w: 32, h: 48, directions: 1, dist: 3.45 },
  { file: 'mire-wraith.cjs', pose: 'idle', out: 'mire-wraith-idle', w: 96, h: 96, directions: 4, dist: 7.3 },
  { file: 'mire-wraith.cjs', pose: 'charge', out: 'mire-wraith-charge', w: 96, h: 96, directions: 4, dist: 7.3 },
  { file: 'mire-wraith.cjs', pose: 'roar', out: 'mire-wraith-roar', w: 96, h: 96, directions: 4, dist: 7.3 },
];

for (const spec of specs) {
  const scene = require(path.join(__dirname, spec.file))(studio);
  const world = scene.build(scene.seed, spec.pose || 'idle');
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
