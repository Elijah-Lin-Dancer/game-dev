#!/usr/bin/env python3
"""字形覆盖审计：源码 / 数据里出现的每个可打印字符，字体 cmap 是否都有。

用法：python3 tools/audit_glyphs.py [font.woff2]
默认字体：web/fonts/game.woff2。
"""
import glob
import sys
from fontTools.ttLib import TTFont

ROOT = __file__.rsplit('/tools/', 1)[0]
FONT = sys.argv[1] if len(sys.argv) > 1 else ROOT + '/web/fonts/game.woff2'
SCAN = ['src/**/*.js', 'web/data/*.json']

font = TTFont(FONT)
cmap = set()
for table in font['cmap'].tables:
    cmap.update(table.cmap.keys())

chars = set()
for pat in SCAN:
    for path in glob.glob(ROOT + '/' + pat, recursive=True):
        chars |= set(open(path, encoding='utf-8').read())

missing = sorted(c for c in chars if c.strip() and ord(c) > 31 and ord(c) not in cmap)
print(f'FONT {FONT}')
print(f'CHARS {len(chars)} / CMAP {len(cmap)} / MISSING {len(missing)}')
if missing:
    print('MISSING: ' + ' '.join(f'{c}(U+{ord(c):04X})' for c in missing))
    sys.exit(1)
print('GLYPHS OK')
