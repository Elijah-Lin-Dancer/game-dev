# 素材来源清单

调研时间：2026-11-19。核验方式：GitHub 仓库实际克隆 / 官方页面原文核对 / 包内 LICENSE 说明。

**使用前提**：本清单只解决"去哪找"，不解决"用哪套"。主美术风格未定之前，不要批量下载（见文末「先定风格」）。

---

## 1. 授权分级：先看这一眼

| 档位 | 常见协议 | 能不能进商业小游戏 | 要做什么 |
|---|---|---|---|
| 绿 | CC0、MIT、OFL、免版税商用 | 可以 | 无需署名（建议仍登记） |
| 黄 | CC BY 3.0 / 4.0 | 可以 | 游戏内留「鸣谢 / 关于」页，按模板写署名 |
| 红 | CC BY-SA 3.0/4.0、GPL、LGPL | 不要用 | 衍生美术须按同协议开放，商业项目不适用 |
| 红 | NC（禁商用）、ND（禁改作） | 不要用 | — |
| 自定义 | 站点自有协议 | 逐条读 | 常见写法是"可商用、禁止把素材当素材包再分发" |

两个高频误读：

- **「禁止再分发」不等于「禁止用进游戏」**。把素材打包进你的游戏是允许的；不允许的是把素材当素材包再卖一遍。Tiny Swords、Pixel Crawler、小森平都是这一类。
- **CC BY-SA 是传染的**。LPC 全套是这类，社区教程推荐得多，但商业小游戏用它等于给后续埋雷。

---

## 2. GitHub 上的整套素材仓库

可直接 clone，天然可版本化、可追溯。

| 仓库 | 内容 | 授权 | 核验 | 备注 |
|---|---|---|---|---|
| [sparklinlabs/superpowers-asset-packs](https://github.com/sparklinlabs/superpowers-asset-packs) | 1000+ 素材，按主题成套：史前平台、太空射击、西部、RPG 战斗 UI、俯视射击 | CC0 | 已核 | 2019-09 后停更，素材可用 |
| [pixel-boy/NinjaAdventure](https://github.com/pixel-boy/NinjaAdventure) | 俯视忍者全套：地块、角色、UI、**字体与音效也在包内** | CC0 | 已核（作者 itch 页原文） | 少见的单包可撑起整个原型 |
| [TakWolf/fusion-pixel-font](https://github.com/TakWolf/fusion-pixel-font) | 中日韩**像素字体**，8 / 10 / 12 px，含 zh-Hans / zh-Hant / ja / ko 专用字形 | OFL-1.1 | 已核（README） | 带 Godot、Unity 本地化示例项目 |
| [patch-gg/pixelfx](https://github.com/patch-gg/pixelfx) | 244 个像素特效，纯代码；120 个时间函数式 + 120 个粒子模拟，73 个带角色表演 | MIT | 已核（克隆实测） | core 140 KB（gzip 43 KB）；单个特效约 3.6 KB |
| [DeerTears/GB-Studio-Community-Assets](https://github.com/DeerTears/GB-Studio-Community-Assets) | GB Studio 社区素材：角色、地块、UI、音乐 | MIT | [待核] 仅见镜像页标注 | 偏 GameBoy 单色，适合小体量 |
| [LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator) | 网页版角色拼装器，数千件可叠加图层 | CC-BY-SA 3.0 / GPL 混合 | 已核 | **红档**，只作学习参考，不进商业项目 |

---

## 3. 非 GitHub 平台

| 平台 | 定位 | 授权要点 | 适合 |
|---|---|---|---|
| [kenney.nl](https://kenney.nl/assets)（itch 同名店） | 免费素材的基准线，2D / 3D / UI / 音效，**同一套风格跨包统一** | 全 CC0；2D 包同时给精灵图、单张 PNG、XML 图集 | 原型、UI、图标、占位 |
| [itch.io](https://itch.io/game-assets/free) | 个人作者生态，主题包最多 | 一包一协议，逐页读 | 找具体风格的主题包 |
| [OpenGameArt](https://opengameart.org) | 最老的社区库，像素图最多 | 每个文件单独标协议；站内**不收 NC / ND**，可按协议筛 | 愿意逐件核对时性价比最高 |
| [Pixel Frog](https://pixelfrog-assets.itch.io/) | `Pixel Adventure`（CC0）；`Tiny Swords` 免费包 | Tiny Swords：可商用可改，**禁止再分发 / 转售 / 重打包** | Tiny Swords 的奇幻战棋风最接近成品 |
| [Anokolisa / Pixel Crawler](https://anokolisa.itch.io/) | 俯视 rogue-like 环境，免费包 500 精灵 / 3 角色 / 8 敌人 / 50 武器 | 任意项目含商用，**不得当素材包转售** | 俯视地牢、农场类 |
| [Quaternius](https://quaternius.com) / [KayKit](https://kaylousberg.itch.io/) | 低多边形 3D，80+ 主题包，glTF / FBX / OBJ | **CC0** | 仅做 3D 时 |
| [爱给网](https://www.aigei.com/) | 中文站，有 CC 协议专区 | 混有搬运内容，**逐件核来源** | 应急找中文 UI / 图标，风险自担 |

---

## 4. 按资源类型补齐

整套包里最容易缺的四类：

| 类型 | 首选 | 授权 / 条件 |
|---|---|---|
| **图标**（技能 / 道具 / 状态） | [game-icons.net](https://game-icons.net)，4180 个 SVG，每周新增 | CC BY 3.0。署名模板：`Icons made by {作者}. Available on https://game-icons.net`；个别作者为 CC0，见作者目录 |
| **音效** | [Sonniss #GameAudioGDC](https://sonniss.com/gameaudiogdc/) 年度包（2026 版 7.47 GB / 347 个文件）；[小森平](https://taira-komori.net/freesoundcn.html) 约 1800–2000 条 | Sonniss：免版税、免署名、终身无限项目，**不得当音效包转售**；小森平：可商用可加工，**禁止再配布 / 贩卖** |
| **音乐** | [Incompetech](https://incompetech.com/music/packs.html)（Kevin MacLeod），按中世纪 / 复古 / 现代分组，带多速度版本 | CC BY 4.0，**必须署名**；不想署名可按首付费去署名 |
| **UI 套件** | Kenney 的 UI / Input / Puzzle 系列 | CC0，带 PNG + SVG + XML |

已失效：**FreePD 于 2025 年关站**，旧链接与教程仍在流传，不要再用。

---

## 5. 第一批下载清单（未执行，等确认后跑）

| # | 下什么 | 用途 | 量级 |
|---|---|---|---|
| 1 | Kenney `Tiny Dungeon` + `UI Pack` | UI、按钮、图标、基础地块 | 各 100 KB 级 |
| 2 | `NinjaAdventure` | 主角 + 敌人 + 场景 + 音效 + 字体，一套跑通 | 10 MB 级 |
| 3 | `Fusion Pixel Font` 12px zh-Hans 比例模式 | 中文 UI 文本 | 1–2 MB |
| 4 | `Pixel Adventure` | 平台跳跃补充、粒子 / 陷阱 | 1 MB 级 |
| 5 | `Tiny Swords` 免费包 | 战棋 / 塔防方向的主美术候选 | 5 MB 级 |
| 6 | game-icons.net 全量 SVG | 技能 / 道具图标，可改色 | 20 MB 级 |
| 7 | Sonniss 任一年度音效包 | 打击 / 环境 / UI 音效库 | 数 GB，按需挑 |
| 8 | `pixelfx` | 打击特效 + `act` 时间表 | 27 MB |

第 1、2、3、8 项可用 `tools/fetch-assets.sh` 拉取（只含可 clone 的仓库）。

---

## 6. 先定风格，再批量下

素材包真正的问题是**风格打架**：Kenney 的扁平矢量、Pixel Adventure 的圆润描边、Tiny Swords 的高饱和平涂，三者混用会立刻显得廉价。

正确顺序：

1. 选**一个主包**（定色板、像素颗粒、描边规则）
2. 其余只做填空（UI、图标、音效），不各取一半
3. 主包确定后再批量下载，避免下一堆用不上

主美术候选（待选，需同场景对比图）：

| 候选 | 风格 | 授权 | 适合的玩法 |
|---|---|---|---|
| Kenney Tiny Dungeon | 16×16 极简、低饱和 | CC0 | roguelike / 地牢 / 塔防 |
| Ninja Adventure | 16×16 圆润、强描边 | CC0 | 俯视动作 / 冒险 |
| Tiny Swords | 64×64 高饱和平涂 | 免费包可商用、禁再分发 | 战棋 / 塔防 / 大规模单位 |
| Pixel Adventure | 圆润卡通、20 fps | CC0 | 平台跳跃 |

---

## 7. 登记规范

每件素材进仓时必须登记到 [`../assets/CREDITS.md`](../assets/CREDITS.md)，字段：

`名称 | 作者 | 协议 | 来源 URL | 是否需署名 | 署名模板 | 原始 LICENSE 路径`

下载后立刻把包内 `LICENSE` / `README` 原文一并入库（`assets/00-raw/<包名>/`），这是授权核验的唯一证据。

署名页生成规则：把「需署名」为是的条目按 `{署名模板}` 拼成一段，直接进游戏的「关于 / 鸣谢」页面。
