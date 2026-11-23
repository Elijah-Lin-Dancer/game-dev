#!/usr/bin/env python3
"""批 13：把 ink-studio 的 4 向图集取正面帧，落到游戏 64×64 透明 PNG。
输入 docs/revamp/b13-3d/*-atlas.png；输出 assets/01-primary/hub/*.png。
只做最近邻裁切，不做模糊缩放，避免把像素边缘洗掉。
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'docs/revamp/b13-3d'
DST = ROOT / 'assets/01-primary/hub'
DST.mkdir(parents=True, exist_ok=True)

ITEMS = [
    ('guide-atlas.png', 'npc-guide.png'),
    ('smith-atlas.png', 'npc-smith.png'),
    ('merchant-atlas.png', 'npc-merchant.png'),
    ('anvil-atlas.png', 'forge-anvil.png'),
    ('dummy-atlas.png', 'train-dummy.png'),
]

for src_name, dst_name in ITEMS:
    im = Image.open(SRC / src_name).convert('RGBA')
    if im.height != 64:
        raise SystemExit(f'{src_name} is not 64px high: {im.size}')
    frame = im.crop((0, 0, 64, 64))
    frame.save(DST / dst_name)
    print(f'{dst_name}: {frame.size} {frame.mode}')

# 对照板：每件 128×128（4× 最近邻），深底，方便肉眼过剪影
sheet = Image.new('RGBA', (128 * len(ITEMS), 128), (18, 24, 20, 255))
for i, (_, dst_name) in enumerate(ITEMS):
    im = Image.open(DST / dst_name).resize((128, 128), Image.Resampling.NEAREST)
    sheet.alpha_composite(im, (i * 128, 0))
sheet.save(SRC / 'hub-contact-sheet.png')
print('hub-contact-sheet.png: 640x128')
