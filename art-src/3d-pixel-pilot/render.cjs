const fs = require('node:fs');
const path = require('node:path');
const studioPath = process.env.INK_STUDIO || '/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio';
if (!require('node:fs').existsSync(studioPath)) throw new Error('Set INK_STUDIO to a checkout of siliconjungle/shapeshift-labs-ink-studio');
const lib = require(studioPath);
const studio = lib.load();
const outDir = path.resolve(__dirname, '../../docs/revamp/3d-pixel');
fs.mkdirSync(outDir, { recursive: true });

const specs = [
  { file: 'boss.cjs', out: 'boss-atlas', size: 96, directions: 4, dist: 6.4 },
  { file: 'hero.cjs', out: 'hero-atlas', size: 64, directions: 4, dist: 4.5 },
  { file: 'blade.cjs', out: 'blade-atlas', size: 80, directions: 4, dist: 5.4 },
  { file: 'armor.cjs', out: 'armor-atlas', size: 80, directions: 4, dist: 3.6 }
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
    view: { dist: spec.dist }
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
