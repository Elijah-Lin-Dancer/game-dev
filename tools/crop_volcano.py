from PIL import Image
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
out = ROOT / 'assets/01-primary/world'
out.mkdir(parents=True, exist_ok=True)

# G2-4 ink-studio 源图集 -> 运行时帧
Image.open(ROOT / 'docs/revamp/g2-3d/volcano-spire-atlas.png').convert('RGBA').save(out / 'volcano-spire.png')
Image.open(ROOT / 'docs/revamp/g2-3d/volcano-vent-atlas.png').convert('RGBA').save(out / 'volcano-vent.png')
Image.open(ROOT / 'docs/revamp/g2-3d/volcano-forge-atlas.png').convert('RGBA').save(out / 'volcano-forge.png')
Image.open(ROOT / 'docs/revamp/g2-3d/volcano-smith-atlas.png').convert('RGBA').crop((0, 0, 64, 64)).save(out / 'volcano-smith.png')
Image.open(ROOT / 'docs/revamp/g2-3d/volcano-ember-atlas.png').convert('RGBA').save(out / 'volcano-ember.png')
Image.open(ROOT / 'docs/revamp/g2-3d/volcano-lava-atlas.png').convert('RGBA').save(out / 'volcano-lava.png')

# 16px 火山地：TilesetField 纯色帧 21 调成黑灰玄武岩，只重映射颜色，不重绘 tile。
field = Image.open(ROOT / 'assets/00-raw/NinjaAdventure/Backgrounds/Tilesets/TilesetField.png').convert('RGBA')
frame = field.crop((16, 64, 32, 80))
remap = {
    (173, 188, 58, 255): (44, 36, 38, 255),
    (116, 163, 52, 255): (28, 23, 25, 255),
}
tile = Image.new('RGBA', (16, 16))
for y in range(16):
    for x in range(16):
        px = frame.getpixel((x, y))
        tile.putpixel((x, y), remap.get(px, px))
tile.save(out / 'volcano-tile.png')
print('volcano assets written')
