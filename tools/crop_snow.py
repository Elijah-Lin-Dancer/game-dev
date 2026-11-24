from PIL import Image
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
out = ROOT / 'assets/01-primary/world'
out.mkdir(parents=True, exist_ok=True)

# G2-3 ink-studio 源图集 -> 运行时帧
Image.open(ROOT / 'docs/revamp/g2-3d/snow-pine-atlas.png').convert('RGBA').save(out / 'snow-pine.png')
Image.open(ROOT / 'docs/revamp/g2-3d/snow-shrine-atlas.png').convert('RGBA').save(out / 'snow-shrine.png')
Image.open(ROOT / 'docs/revamp/g2-3d/snow-keeper-atlas.png').convert('RGBA').crop((0, 0, 64, 64)).save(out / 'snow-keeper.png')
Image.open(ROOT / 'docs/revamp/g2-3d/snow-lantern-atlas.png').convert('RGBA').save(out / 'snow-lantern.png')

# 16px 雪地：TilesetField 纯色帧 21 调白蓝，只重映射颜色，不重绘 tile。
field = Image.open(ROOT / 'assets/00-raw/NinjaAdventure/Backgrounds/Tilesets/TilesetField.png').convert('RGBA')
frame = field.crop((16, 64, 32, 80))
remap = {
    (173, 188, 58, 255): (226, 235, 238, 255),
    (116, 163, 52, 255): (188, 207, 216, 255),
}
tile = Image.new('RGBA', (16, 16))
for y in range(16):
    for x in range(16):
        px = frame.getpixel((x, y))
        tile.putpixel((x, y), remap.get(px, px))
tile.save(out / 'snow-tile.png')
print('snow assets written')
