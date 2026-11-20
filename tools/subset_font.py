#!/usr/bin/env python3
"""字体子集化：把 900 KB 的 Fusion Pixel 12px 全字库裁到游戏真正用得上的字符。

字符集 = 源码/文案里出现过的所有字符 ∪ GB2312 一级字库（3755 汉字）。
裁剪后改名（OFL 要求派生字体不得沿用原字体名），产出 web/fonts/game.woff2。

用法：python3 tools/subset_font.py <源 woff2> <输出 woff2>
"""
import glob
import os
import sys

from fontTools.ttLib import TTFont
from fontTools.subset import Subsetter, Options

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# 只扫运行时文案（源码里的 UI 字符串 + story.json / balance.json）。
# 不扫 docs：那会让"改一段文档"也能改变字体产物，构建不可复现。
SCAN = [
    'src/**/*.js', 'web/data/*.json',
]
FAMILY = 'NinjaPixel'
STYLE = 'Regular'


def scan_chars():
    chars = set()
    for pat in SCAN:
        for p in glob.glob(os.path.join(ROOT, pat), recursive=True):
            with open(p, encoding='utf-8') as f:
                chars |= set(f.read())
    # 兜底：GB2312 一级字库，避免玩家在 story.json 里改文案时大量缺字
    for hi in range(0xB0, 0xD8):
        for lo in range(0xA1, 0xFF):
            try:
                chars.add(bytes([hi, lo]).decode('gb2312'))
            except UnicodeDecodeError:
                pass
    # 打印/排版常用符号
    chars |= set('　！＂＃＄％＆＇（）＊＋，－．／：；＜＝＞？＠［＼］＾＿｀｛｜｝～·—…“”‘’《》〈〉、。！？；：（）【】')
    return ''.join(sorted(c for c in chars if c.isprintable() or c == ' '))


def rename(font, family, style):
    name = font['name']
    for rec in list(name.names):
        if rec.nameID in (1, 2, 3, 4, 6, 16, 17, 18, 20, 21, 22):
            try:
                text = rec.toUnicode()
            except Exception:
                continue
            if rec.nameID == 1:
                new = family
            elif rec.nameID == 2:
                new = style
            elif rec.nameID == 3:
                new = f'{family}-{style}-subset'
            elif rec.nameID == 4:
                new = f'{family} {style}'
            elif rec.nameID == 6:
                new = f'{family}-{style}'
            else:
                new = text
            name.setName(new, rec.nameID, rec.platformID, rec.platEncID, rec.langID)


def main(src, out):
    chars = scan_chars()
    font = TTFont(src)
    opts = Options()
    opts.layout_features = []
    opts.hinting = False
    opts.desubroutinize = True
    opts.drop_tables += ['DSIG']
    opts.name_IDs = ['*']
    opts.name_languages = ['*']
    opts.notdef_outline = True
    sub = Subsetter(options=opts)
    sub.populate(text=chars)
    sub.subset(font)
    rename(font, FAMILY, STYLE)
    font.flavor = 'woff2'
    os.makedirs(os.path.dirname(out), exist_ok=True)
    font.save(out)
    print(f'字体子集：{len(chars)} 个字符 → {out}（{os.path.getsize(out) / 1024:.1f} KB，族名 {FAMILY}）')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
