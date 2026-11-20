# 素材登记表

字段：`名称 | 作者 | 协议 | 来源 URL | 是否需署名 | 署名模板 | 原始 LICENSE 路径`

规则：
- 每件素材入库时必须新增一行，"原始 LICENSE 路径" 指向 `assets/00-raw/<包名>/` 内的协议原文。
- 只写核验过的值；未核验写 `[待核]`。
- 既有行不改不删，更正另起一行并标注 `更正 #行号`。

## 当前状态

主美术 Ninja Adventure 素材包**已落地**：原始包 `assets/00-raw/NinjaAdventure/`（不入 git），美术子集 `assets/01-primary/NinjaAdventure/`（入 git）。清点见 `docs/ASSET-INVENTORY.md`。

| 名称 | 作者 | 协议 | 来源 URL | 是否需署名 | 署名模板 | 原始 LICENSE 路径 |
|---|---|---|---|---|---|---|
| Ninja Adventure - Asset Pack | Pixel-Boy / AAA | CC0 1.0（已核对全文） | https://github.com/MarioLDD/Kuroshiro-adventure （转存，原始页 https://pixel-boy.itch.io/ninja-adventure-asset-pack ） | 否（作者希望保留主页链接） | `Assets by Pixel-Boy — https://pixel-boy.itch.io/ninja-adventure-asset-pack` | `assets/00-raw/NinjaAdventure/LICENSE.txt` |

| Fusion Pixel 12px Mono zh-Hans（子集改名 NinjaPixel） | TakWolf | OFL 1.1（已随文件入库） | https://github.com/TakWolf/fusion-pixel-font （release 2026.11.10） | 是（OFL 要求保留协议；已改名，未使用保留字体名） | `Font: Fusion Pixel Font by TakWolf — https://github.com/TakWolf/fusion-pixel-font (SIL OFL 1.1)` | `assets/01-primary/fonts/OFL.txt` |

## 鸣谢页生成

把「是否需署名」为「是」的行，取「署名模板」列拼成一段文本，直接用于游戏的关于页。

已知模板：

- game-icons.net：`Icons made by {作者}. Available on https://game-icons.net`
- Incompetech：`"{曲名}" Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0`
