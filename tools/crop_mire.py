from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/01-primary/world'
OUT.mkdir(parents=True, exist_ok=True)

# G4-1 ink-studio 源图集 -> 运行时帧
Image.open(ROOT / 'docs/revamp/g4-3d/mire-keeper-atlas.png').convert('RGBA').crop((0, 0, 64, 64)).save(OUT / 'mire-keeper.png')
Image.open(ROOT / 'docs/revamp/g4-3d/mire-lampkeeper-atlas.png').convert('RGBA').crop((0, 0, 64, 64)).save(OUT / 'mire-lampkeeper.png')
Image.open(ROOT / 'docs/revamp/g4-3d/mire-reed-atlas.png').convert('RGBA').save(OUT / 'mire-reed.png')
Image.open(ROOT / 'docs/revamp/g4-3d/mire-shrine-atlas.png').convert('RGBA').save(OUT / 'mire-shrine.png')
Image.open(ROOT / 'docs/revamp/g4-3d/mire-herb-atlas.png').convert('RGBA').save(OUT / 'mire-herb.png')
Image.open(ROOT / 'docs/revamp/g4-3d/mire-lamp-herb-atlas.png').convert('RGBA').save(OUT / 'mire-lamp-herb.png')

# 16px 雾泽地：TilesetField 纯色帧 21 调成湿苔绿，只重映射颜色，不重绘 tile。
field = Image.open(ROOT / 'assets/00-raw/NinjaAdventure/Backgrounds/Tilesets/TilesetField.png').convert('RGBA')
frame = field.crop((16, 64, 32, 80))
remap = {
    (173, 188, 58, 255): (76, 98, 70, 255),
    (116, 163, 52, 255): (56, 78, 60, 255),
}
tile = Image.new('RGBA', (16, 16))
for y in range(16):
    for x in range(16):
        px = frame.getpixel((x, y))
        tile.putpixel((x, y), remap.get(px, px))
tile.save(OUT / 'mire-tile.png')
print('mire assets written')
