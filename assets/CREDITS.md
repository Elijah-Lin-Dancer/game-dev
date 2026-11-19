# 素材登记表

字段：`名称 | 作者 | 协议 | 来源 URL | 是否需署名 | 署名模板 | 原始 LICENSE 路径`

规则：
- 每件素材入库时必须新增一行，"原始 LICENSE 路径" 指向 `assets/00-raw/<包名>/` 内的协议原文。
- 只写核验过的值；未核验写 `[待核]`。
- 既有行不改不删，更正另起一行并标注 `更正 #行号`。

## 当前状态

主美术已选定 Ninja Adventure（ADR 0002），素材包尚未下载，下载后补齐 LICENSE 原文路径。

| 名称 | 作者 | 协议 | 来源 URL | 是否需署名 | 署名模板 | 原始 LICENSE 路径 |
|---|---|---|---|---|---|---|
| Ninja Adventure - Asset Pack | Pixel-Boy / AAA | CC0 1.0 | https://pixel-boy.itch.io/ninja-adventure-asset-pack | 否（作者希望保留主页链接） | `Assets by Pixel-Boy — https://pixel-boy.itch.io/ninja-adventure-asset-pack` | 待下载：`assets/00-raw/NinjaAdventure/LICENSE` |

## 鸣谢页生成

把「是否需署名」为「是」的行，取「署名模板」列拼成一段文本，直接用于游戏的关于页。

已知模板：

- game-icons.net：`Icons made by {作者}. Available on https://game-icons.net`
- Incompetech：`"{曲名}" Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0`
