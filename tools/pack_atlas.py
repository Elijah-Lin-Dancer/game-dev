#!/usr/bin/env python3
"""把多张 spritesheet 打成一个图集（只做整张切片打包，不拆帧，保证帧号语义不变）

用法：python3 tools/pack_atlas.py <manifest.json> <out.png> <out.json>
manifest: {"atlasWidth":1024, "sheets":{"walk":{"path":"...","fw":16,"fh":16}, ...}}
输出 JSON: {"sheets":{"walk":{"x":..,"y":..,"w":..,"h":..,"fw":..,"fh":..}}}
"""
import json, sys
from PIL import Image

PAD = 1


def main():
    mpath, out_png, out_json = sys.argv[1], sys.argv[2], sys.argv[3]
    m = json.load(open(mpath))
    width = m.get("atlasWidth", 1024)

    items = []
    for key, cfg in m["sheets"].items():
        im = Image.open(cfg["path"]).convert("RGBA")
        items.append((key, im, cfg.get("fw"), cfg.get("fh")))
    items.sort(key=lambda t: -t[1].height)

    # 货架式装箱
    x = y = 0
    shelf_h = 0
    pos = {}
    for key, im, fw, fh in items:
        w, h = im.size
        if x + w + PAD > width:
            x = 0
            y += shelf_h + PAD
            shelf_h = 0
        pos[key] = (x, y)
        x += w + PAD
        shelf_h = max(shelf_h, h)

    total_h = y + shelf_h
    atlas = Image.new("RGBA", (width, total_h), (0, 0, 0, 0))
    sheets = {}
    for key, im, fw, fh in items:
        px, py = pos[key]
        atlas.paste(im, (px, py))
        sheets[key] = {"x": px, "y": py, "w": im.width, "h": im.height,
                       "fw": fw, "fh": fh}

    atlas.save(out_png, optimize=True)
    json.dump({"width": width, "height": total_h, "sheets": sheets},
              open(out_json, "w"), ensure_ascii=False)
    print(f"atlas {width}x{total_h} · {len(sheets)} 张切片 · {out_png}")


if __name__ == "__main__":
    main()
