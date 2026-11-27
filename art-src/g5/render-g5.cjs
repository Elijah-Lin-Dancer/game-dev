/* G5 / 旧堡 Boss：蓝武士 3D 像素离线素材
 * 源：art-src/g5/sam-blue.cjs，固定 seed；只产出透明 RGBA 图集。
 * 复现：INK_STUDIO=... node art-src/g5/render-g5.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const studioPath = process.env.INK_STUDIO || '/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio';
if (!fs.existsSync(studioPath)) throw new Error('Set INK_STUDIO to a checkout of siliconjungle/shapeshift-labs-ink-studio');
const lib = require(studioPath);
const studio = lib.load();
const outDir = path.resolve(__dirname, '../../docs/revamp/g5-3d');
fs.mkdirSync(outDir, { recursive: true });

const poses = ['idle', 'walk', 'slash', 'charge', 'roar'];
for (const pose of poses) {
  const scene = require(path.join(__dirname, 'sam-blue.cjs'))(studio);
  const world = scene.build(scene.seed, pose);
  const atlas = lib.spriteAtlas(world, {
    width: 96, height: 96, directions: 4, times: [0], columns: 4,
    view: { dist: 4.65 },
  });
  const png = require(path.join(studioPath, 'cli/png.js')).encode(
    atlas.metadata.width, atlas.metadata.height, atlas.images.color, 4
  );
  fs.writeFileSync(path.join(outDir, `sam-blue-${pose}.png`), png);
  fs.writeFileSync(path.join(outDir, `sam-blue-${pose}.json`), JSON.stringify({
    ...atlas.metadata,
    sourceScene: 'sam-blue.cjs',
    pose,
    renderer: 'ink-studio CPU spriteAtlas',
    note: 'RGBA color atlas; frames left-to-right, one row, directions 0..3',
  }, null, 2) + '\n');
  console.log(`${scene.name} ${pose}: ${world.count} splats -> sam-blue-${pose}.png (${atlas.metadata.width}x${atlas.metadata.height})`);
}
