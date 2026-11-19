# 素材清点：Ninja Adventure

状态：**已落地**（2026-11-19）。原始包在 `assets/00-raw/NinjaAdventure/`（不入 git），入库子集在 `assets/01-primary/NinjaAdventure/`。

## 来源链

| 环节 | 地址 | 说明 |
|---|---|---|
| 官方页 | https://pixel-boy.itch.io/ninja-adventure-asset-pack | 本机与用户端均**不可达** |
| 作者 GitHub | https://github.com/pixel-boy/NinjaAdventure | 仅 98 张地图切片（120 KB）+ 4 首音乐，**不含角色美术** |
| 实际获取 | https://github.com/MarioLDD/Kuroshiro-adventure | 转存了完整目录 `Assets/NinjaAdventure/`，含官方 `README.md` 与 `LICENSE.txt` 全文 |
| 许可 | CC0 1.0 | 已核对 LICENSE.txt 原文，确为 CC0 全文，非声明 |

## 清点

有效文件 1545 个，47.2 MB（已剔除 1881 个 Unity `.meta`）。

| 分类 | 文件 | 大小 | 内容 |
|---|---|---|---|
| Actor | 1099 | 2.97 MB | 角色 81 / 怪物 58 / Boss 12 / 动物 13，逐动作拆帧 |
| Musics | 31 | 33.63 MB | 31 首主题音乐 |
| Sounds | 62 | 5.23 MB | 62 个音效 |
| Backgrounds | 60 | 0.32 MB | 地块、载具、动态背景 |
| Ui | 84 | 0.32 MB | 对话框、血条、表情、主题、字体 |
| Items | 97 | 0.15 MB | 道具、宝箱、藏宝 |
| FX | 85 | 0.12 MB | 挥砍、投射、烟雾、粒子、魔法、元素、环境 |
| HUD | 15 | 0.04 MB | 界面元件 |

附带：`Ui/Font/NormalFont.ttf`（像素英文字体）、`ninja_adventure_news_.aseprite`（源文件）。

入库策略：**美术与 UI 进 git（约 8 MB）**；音乐与音效留在 `00-raw`，需要时再单独取，避免仓库被 39 MB 音频拖重。

## 与本项目的对应

| 需要 | 落在哪 | 备注 |
|---|---|---|
| 角色行走/攻击/受伤 | `01-primary/NinjaAdventure/Actor/Characters/` | 逐帧 PNG，需自行打图集 |
| 敌人与 Boss | `.../Actor/Monsters`、`.../Actor/Boss` | Boss 有 12 个，够做关卡终点 |
| 地形与拼接 | `.../Backgrounds/Tilesets` | 16×16，需按 Tiled 规则拼 |
| 界面 | `.../Ui`、`.../HUD` | 同一色板，可直接用 |
| 战斗特效 | `.../FX` | 与 pixelfx 的运行时特效叠加时注意色温 |
| 音效 | `00-raw/.../Sounds` | 62 个，未入库 |
| 音乐 | `00-raw/.../Musics` | 31 首，未入库 |

## 已知缺口

1. **版本待核**：官方包在 2026-03 有第 8 次更新（动画 V2 / 动物 / 露营），转存快照可能早于此。`[待补测]` 拿到可达版本后比对 `Actor/Characters` 目录数。
2. **不含官方 Godot 示例工程**（itch 上的 `Godot Project V4.zip` 30 MB），所以没有现成的场景装配与 TileSet 配置，拼接规则要自己写。
3. 文件名无统一规范（部分为拼音/西语命名），打图集前需做一次重命名与清单映射。
