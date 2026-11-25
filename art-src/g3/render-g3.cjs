/* G3 世界 Boss 3D 像素离线素材
 *
 * 源：art-src/g3/*.cjs，固定 seed；只产出透明 RGBA 图集，不接运行时。
 * 复现：INK_STUDIO=... node art-src/g3/render-g3.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const studioPath = process.env.INK_STUDIO || '/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio';
if (!fs.existsSync(studioPath)) throw new Error('Set INK_STUDIO to a checkout of siliconjungle/shapeshift-labs-ink-studio');
const lib = require(studioPath);
const studio = lib.load();
const outDir = path.resolve(__dirname, '../../docs/revamp/g3-3d');
fs.mkdirSync(outDir, { recursive: true });

const specs = [
  { file: 'moss-beast.cjs', pose: 'idle', out: 'moss-beast-idle', w: 96, h: 96, directions: 4, dist: 8.4 },
  { file: 'moss-beast.cjs', pose: 'charge', out: 'moss-beast-charge', w: 96, h: 96, directions: 4, dist: 8.4 },
  { file: 'moss-beast.cjs', pose: 'roar', out: 'moss-beast-roar', w: 96, h: 96, directions: 4, dist: 8.4 },
  { file: 'bamboo-mirage.cjs', pose: 'idle', out: 'bamboo-mirage-idle', w: 96, h: 96, directions: 4, dist: 12.0 },
  { file: 'bamboo-mirage.cjs', pose: 'charge', out: 'bamboo-mirage-charge', w: 96, h: 96, directions: 4, dist: 12.0 },
  { file: 'bamboo-mirage.cjs', pose: 'roar', out: 'bamboo-mirage-roar', w: 96, h: 96, directions: 4, dist: 12.0 },
  { file: 'sand-mirage.cjs', pose: 'idle', out: 'sand-mirage-idle', w: 96, h: 96, directions: 4, dist: 10.2 },
  { file: 'sand-mirage.cjs', pose: 'charge', out: 'sand-mirage-charge', w: 96, h: 96, directions: 4, dist: 10.2 },
  { file: 'sand-mirage.cjs', pose: 'roar', out: 'sand-mirage-roar', w: 96, h: 96, directions: 4, dist: 10.2 },
  { file: 'frost-owl.cjs', pose: 'idle', out: 'frost-owl-idle', w: 96, h: 96, directions: 4, dist: 10.0 },
  { file: 'frost-owl.cjs', pose: 'charge', out: 'frost-owl-charge', w: 96, h: 96, directions: 4, dist: 10.0 },
  { file: 'frost-owl.cjs', pose: 'roar', out: 'frost-owl-roar', w: 96, h: 96, directions: 4, dist: 10.0 },
  { file: 'magma-colossus.cjs', pose: 'idle', out: 'magma-colossus-idle', w: 96, h: 96, directions: 4, dist: 12.4 },
  { file: 'magma-colossus.cjs', pose: 'charge', out: 'magma-colossus-charge', w: 96, h: 96, directions: 4, dist: 12.4 },
  { file: 'magma-colossus.cjs', pose: 'roar', out: 'magma-colossus-roar', w: 96, h: 96, directions: 4, dist: 12.4 },
  { file: 'sand-scarab.cjs', pose: 'idle', out: 'sand-scarab-idle', w: 64, h: 64, directions: 4, dist: 4.6 },
  { file: 'sand-scarab.cjs', pose: 'skitter', out: 'sand-scarab-skitter', w: 64, h: 64, directions: 4, dist: 4.6 },
  { file: 'sand-rock.cjs', pose: 'idle', out: 'sand-rock', w: 64, h: 64, directions: 1, dist: 5.2 },
];

for (const spec of specs) {
  const scene = require(path.join(__dirname, spec.file))(studio);
  const world = scene.build(scene.seed, spec.pose);
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
    pose: spec.pose,
    renderer: 'ink-studio CPU spriteAtlas',
    note: 'RGBA color atlas; frames left-to-right, one row, directions 0..3',
  }, null, 2) + '\n');
  console.log(`${scene.name} ${spec.pose}: ${world.count} splats -> ${spec.out}.png (${atlas.metadata.width}x${atlas.metadata.height})`);
}
