# 批 8：外壳层（标题 / 设置 / 暂停）

> 2026-11-21。批 7 之后本来打算"工程收尾"（PWA、图集拆分、冒烟脚本），被否掉：游戏还缺大厅入口、章节、地图、设置与主线，先补"玩家第一分钟能碰到的东西"。
> 本批只做外壳，不做章节与地图内容；两者的排期见 `docs/MASTERPLAN.md`。

## 1. 这次新增了什么

| 模块 | 文件 | 行为 |
|---|---|---|
| 设置存档 | `src/systems/options.js`（新） | 独立键 `na.options = { muted, shake, difficulty }`，与 `na.save` 分开，删档不丢设置 |
| 标题画面 | `src/scenes/title.js`（新） | 标题「忍者地牢」+ 副标 + 三菜单（开始冒险 / 设置 / 制作名单）+ 三角色立绘 + 双角篝火 + 存档统计行 |
| 难度 | `options.js` `difficultyMods()` | 普通 ×1；困难 敌血 1.25×、敌伤 1.2×，作用到小怪与 Boss 的 `hp` 与玩家受伤公式 |
| 震屏开关 | `play.js` `shake(ms, mag)` | 全部震屏收敛到一个口子；关掉后一处都不抖，数值不变 |
| 暂停 | `play.js` `togglePause()` | ESC 打开：压暗 + 「继续 / 回小屋（本局作废）」；Enter 继续，H 回大厅 |
| 压暗 | `play.js` `dim(on)` | 全屏压暗层，暂停与通关/失败结算共用 |
| 流程 | `main.js` / `boot.js` | `Boot → Title → Hall → Select → Play`；`?char=` 仍直达战斗，方便调试 |

## 2. 验收

| 编号 | 判据 | 实测 | 证据 |
|---|---|---|---|
| Y-1 | 冷启动落在标题而非大厅 | 是（`boot.js` 默认 `title`） | `b8-0-title.png` |
| Y-2 | 三菜单可用键鼠操作，Enter 进大厅 | 是 | `b8-3-hall.png` |
| Y-3 | 设置三项即时生效并落盘 | `na.options` 读出 `{"muted":true,"shake":true,"difficulty":"normal"}` | `b8-1-settings.png`、`b8-2-settings-muted.png` |
| Y-4 | 设置面板不透明、打开时菜单与脚注不打架 | 是（alpha 1 + 隐藏菜单 + 脚注入框） | `b8-1-settings.png` |
| Y-5 | 困难难度真的加血 | `spawn('beast')` 返回 max hp 8（= 6 × 1.25 取整） | 控制台采样 |
| Y-6 | ESC 暂停：画面压暗、逻辑停、文字可读 | 暂停期间角色/敌人位置不动，时钟继续走（场景时钟未停，仅 `update` 拦在首行） | `b8-4-pause.png` |
| Y-7 | ESC 再按恢复，压暗层撤掉 | 是 | `b8-5-resume.png` |
| Y-8 | H 回小屋，本局作废回大厅 | 是（`scene.start('hall')`） | `b8-6-back-hall.png` |
| Y-9 | 通关结算沿用同一压暗层，文字可读 | 是 | `b8-7-win.png` |
| Y-10 | 全程无 JS 报错 | `errs=[]` | 测试脚本输出 |

## 3. 踩到的坑（后续别再踩）

**压暗层的 alpha 有硬阈值。** 同一张 `__WHITE` 图拉满全屏、染近黑：`alpha ≤ 0.66` 时屏幕上等于不存在，`0.86~0.9` 才正常变暗，`1.0` 直接全黑。成因未定位到 Phaser 具体管线（怀疑本场景 `postFX` 与形状批处理叠加），结论是**压暗一律用 0.86 档**，别指望细调。
顺带记一笔：`this.add.graphics()` 在本场景中途新建的填充有时整块不渲染（暂停、结算遮罩最初都栽在这），换成 `image('__WHITE')` 才稳。

**镜头调色矩阵不可用。** 试过 `postFX.addColorMatrix().brightness()` 压暗，WebGL 直接抛 `uniform1fv ... cannot be converted to a sequence`，与既有 `addVignette` 冲突。压暗别走 postFX。

**布局必须按逻辑屏算。** `S.W/S.H` 由 `logicalSize()` 按窗口比例算，1280×720 下是 640×360。按 800×450 手写坐标会让大厅卡片溢出——标题、设置、暂停三处都改成动态算。

**暂停只拦逻辑，不 pause 场景。** 场景暂停会连带停掉输入与 tween，恢复手感差；`update()` 首行 `if (this.paused) return` 足够，注意 `attack()`、`castSkill()` 也要加同样拦截。

## 4. 已知未做

- 标题背景是单一花砖平铺，缺主视觉大图，观感仍偏"原型"；等 `MASTERPLAN` 的美术层一起换。
- 暂停面板没有音量/难度热切换，只能回标题改。
- 没有"继续上次存档"入口（现在每次从大厅重新出发）。
