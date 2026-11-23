# 批 13 小屋 3D 像素源

工具：`shapeshift-labs-ink-studio`，固定 commit `823981c3`，MIT。
固定 checkout：`/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio`。

## 文件

| 文件 | 内容 | 输出 |
|---|---|---|
| `guide.cjs` | 引路人：深蓝斗篷、提灯、木杖 | `guide-atlas.png` 4 向 256×64 |
| `smith.cjs` | 铁匠：棕围裙、锤、短须 | `smith-atlas.png` 4 向 256×64 |
| `merchant.cjs` | 商人：绿袍、兜帽、货袋 | `merchant-atlas.png` 4 向 256×64 |
| `anvil.cjs` | 铁砧：灰铁 + 木座 | `anvil-atlas.png` 64×64 |
| `dummy.cjs` | 木桩：靶心 + 木架 | `dummy-atlas.png` 64×64 |
| `render-hub.cjs` | 批量导出 5 组 RGBA 图集 | `docs/revamp/b13-3d/*-atlas.png/json` |

## 复现

```bash
cd /home/user/Doubao/chats/38454996042111490/game-repo
INK_STUDIO=/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio \
node art-src/hub/render-hub.cjs
python3 tools/crop_hub.py
```

`crop_hub.py` 取每组正面帧，缩到 64×64，写 `assets/01-primary/hub/`，并生成 640×128 对照板。

## 口径

- 源图集是 4 向 / 单向 RGBA 预览，不是运行时资源；游戏只加载 64×64 正面 PNG。
- 不把 ink-studio 的 WebGL2 / WebGPU 渲染器接进 Phaser；不进 `web/vendor/`。
- 改模型只改 `.cjs` + 固定 seed，再跑上面两条命令；不要手工改正式 PNG。
- `assets/01-primary/hub/ink-studio-LICENSE.txt` 是 MIT 原文，随素材保留。
