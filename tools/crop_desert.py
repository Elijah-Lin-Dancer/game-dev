from PIL import Image
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
out = ROOT / 'assets/01-primary/world'
out.mkdir(parents=True, exist_ok=True)

# G2-2 ink-studio 源图集 -> 运行时正面帧
atlas = Image.open(ROOT / 'docs/revamp/g2-3d/desert-nomad-atlas.png').convert('RGBA')
atlas.crop((0, 0, 64, 64)).save(out / 'desert-nomad.png')
Image.open(ROOT / 'docs/revamp/g2-3d/desert-shrub-atlas.png').convert('RGBA').save(out / 'desert-shrub.png')
Image.open(ROOT / 'docs/revamp/g2-3d/desert-arch-atlas.png').convert('RGBA').save(out / 'desert-arch.png')

# G2-3：沙棕改为 ink-studio 64×96 完整树，替换原先只有树冠的素材库切片。
Image.open(ROOT / 'docs/revamp/g2-3d/desert-palm-atlas.png').convert('RGBA').save(out / 'desert-palm.png')

# 16px 沙地：取 TilesetField 的纯色草皮帧 21（16,64），只做调色，不重绘。
field = Image.open(ROOT / 'assets/00-raw/NinjaAdventure/Backgrounds/Tilesets/TilesetField.png').convert('RGBA')
frame = field.crop((16, 64, 32, 80))
remap = {
    (173, 188, 58, 255): (201, 169, 104, 255),
    (116, 163, 52, 255): (176, 138, 82, 255),
}
tile = Image.new('RGBA', (16, 16))
for y in range(16):
    for x in range(16):
        px = frame.getpixel((x, y))
        tile.putpixel((x, y), remap.get(px, px))
tile.save(out / 'desert-tile.png')
print('desert assets written')
