# 批 12B：终章「星火之巅」

> 目标：把 `chapters.json` 里的 `final` 行做成一场能收束整条主线的三幕终战——影织者「影袭 → 影潮 → 星火」，打完写周目、回地图，并把图鉴、单文件版、线上入口同步到 11 Boss。素材仍全部来自 Ninja Adventure 包内，外部件 0、自绘 0。

## 1. 结论

- 终章入口：`final / 星火之巅 / sky / 1 关 ×1 房 / diff 1.8 / bossPool:['weaver'] / unlock:lava.stage9`。
- 影织者：`hp 108`（终章 ×1.8 ≈194）、`dmg 3`、`half 30`、`scale 2.2`；三幕血量门槛 `66% / 33%`，最后一下不会跨幕。
- 结局：`win()` 终章分支写 `commitRun(true)`，周目 `1→2`、通关 `0→1`、宝石 `+5`；结算文案「星火归位 / 影织者散去 · 村子回暖 · 第 N 周目」。
- 图鉴：25 怪 / **11 Boss**；新增短名「影织者」，Boss 两行布局仍不压武器栏。
- 普通构建 `dist/game.3229d58d.js`；单文件 `web/game.html` 1817 KB；12A 的熔岩/水殿/沙海压力回归通过。

## 2. 数据与入口

| 文件 | 内容 |
|---|---|
| `web/data/chapters.json` | `final`：1 关、1 房、`diff 1.8`、`pressure:["threePhase"]`、`bossPool:["weaver"]`、`unlock:"lava.stage9"`、`roomTemplate:["boss"]` |
| `web/data/bosses.json` | `weaver`：`kind:weaver`、`sheet:spiritIdle`、`name:影织者`、`hp:108`、`dmg:3`、`speed:52`、`half:30`、`scale:2.2` |
| `src/core/config.js` | `CFG.weaverBoss`：三幕阈值、冲刺/瞬移/召唤/弹幕/火雨的全部参数 |
| `src/scenes/play.js` | `spawnBoss` 的 `weaver` 分支、`updateWeaver` 三幕状态机、`weaverPhase1/2/3`、`weaverShift/Burst/Summon/Teleport/Ghost`、`updateWeaverPips`、终章 `win()`、`finalFx()`、`sky` 主题 |
| `src/scenes/hall.js` | `BOSSES` 11 项，新增 `['weaver','影织者','spiritIdle',0.62,0xb8a0ff]`；`section` 支持第 5 位 tint |
| `src/scenes/map.js` | `BOSS_CN.weaver` 改「影织者」 |

终章不生成普通怪、不生成宝箱/商店/篝火/机关；`spawnRoomProps` 在 `room.isBoss` 时直接 return，Boss 房不会混入引路人 NPC。

## 3. 影织者三幕

### 3.1 第一幕：影袭（`stalk → dashWindup → lunge → recover`）

- 保持距离，`dashT` 到点后锁定玩家方向，430ms 前摇，260ms 以 250 速直线冲撞；冲撞帧才是伤害窗口。
- 半血前只做这一套，给玩家读「白身抖动 + 影袭」的字。
- 首幕截图 `b12b-1-phase1.png`：Boss `(384,350)`、玩家 `(280,450)`，镜头固定，Boss 完整在画面中，血条/底部提示都不遮头。

### 3.2 第二幕：影潮（`hover → blinkOut → castWindup → cast`）

- 血量 ≤66% 触发 `weaverShift(2)`：900ms 转场、无敌、白闪/震屏/紫色扩散环。
- `hover` 保持 120–190 中距；`blinkOut` 260ms 后瞬移到玩家 150–220 距离内的空位；每 2600ms 一次。
- 每 4200ms 召唤 2 只 `spirit` 影仆：tint `0xb89aff`、hp 为原 max 的 45%（2 血）、speed 44、dmg 2。
- `castWindup` 480ms 后 12 发环形弹，弹速 112、2 伤；半血后前摇 ×0.82。
- 第二幕截图 `b12b-2-phase2.png`：Boss 粉色、环弹 12 发、左右 2 只影仆、3 格幕指示亮 2 格。

### 3.3 第三幕：星火（`storm / castWindup`）

- 血量 ≤33% 触发 `weaverShift(3)`：速度提到 66，开启 `rainOn`。
- 火雨：`rainCount=4`、`rainTint=0xff6a9a`、`rainEdge=0xffd8ea`、`rainBoom=0xff4a7a`；4 圈围绕玩家，预警 850ms，2 伤。
- 环形弹：16 发、弹速 128、2 伤，间隔 2100ms。
- 第三幕截图 `b12b-3-phase3.png`：4 个紫粉预警圈全部在镜头内，Boss + 4 影仆，弹幕 16–18 发。

### 3.4 血量门槛

`damageFoe` 对 `weaver` 做门槛钉住：`fp<3` 时，若这一刀会从门槛上方跨到下方，只把血钉在 `floor(maxHp*at)`，返回；下一帧 `updateWeaver` 触发 `weaverShift`。普通伤害不会一刀跨幕，高伤害也只跨一幕。

转场期间 `invuln=true`，`damageFoe` 统一弹「无敌」，避免玩家在 900ms 演出里偷掉下一幕。

## 4. 结局与周目

`win()` 的 `chapterId === 'final'` 分支：

1. 按 `starRating` 算星（通关 / 剩血 ≥70% / 未用休整房），写入 `stars`。
2. `gems += 5`。
3. `commitRun(true)`：普通章节关传 `false`，只有终章涨 `wins/cycle`。
4. `finalFx()`：620ms 白闪、520ms 震屏、22 颗星火从屏幕中心炸开（`dust` 切片，depth 895，压在结算压暗层之上）。
5. `showOverlay`：「星火归位 / 影织者散去 · 村子回暖 · 第 N 周目 / 点击回地图（下一周目）」。

实测结算：`cycle 1→2`、`wins 0→1`、`gem 8`；截图 `b12b-4-ending.png` 显示三星、周目 2、回地图提示。

## 5. `sky` 主题

终章没有专属整屏底板，沿用石砖 `floorDungeon` 322，用「暗紫染色 + 星点 + 星晕 + 冷光」做天穹：

| 项 | sky |
|---|---|
| 地面 tint | `0x7060a8` |
| 加法光 | `0x7a5aff` 14% |
| 墙色 | `0x1a1830` |
| Boss 房压暗 | `0x100820`（25%） |
| 火把 | `0xc8a0ff` |
| 光柱 | `0xd8c8ff`，scale 2.1、rotation −0.18、alpha 0.16 |
| 灰尘 | `0xe8d8ff` |
| 暗角 alpha | 1.0 |
| 星点 | 58 颗 `dust` 单帧，tint 三色随机，alpha 0.18–0.65，scale 0.5–1.25，ADD |
| 星晕 | `aura` 单帧，scale 4.2、alpha 0.1、ADD |

星点只做 `alpha +=0.28` 的 1.6s 呼吸，不滚屏；没有新绘素材。

## 6. 图鉴与 HUD

- `hall.js` FOES 25、BOSSES 11；9 列布局下第二行 2 项，`bossRows` 计算后武器栏仍在其下。
- 新增 `weaver` tint `0xb8a0ff`；Boss 图标仍是 `spiritIdle` 的 5 帧 Idle。
- 截图 `b12b-5-hall.png`：怪物 25/25、Boss 11/11、武器 6/6、房间事件 7 项；「影织者」在第二行第 2 格。
- 地图 `BOSS_CN` 同步「影织者」，避免地图写「织命者」、图鉴写「影织者」。

## 7. 验收

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| Q-1 | 终章入口正确 | 起 `final` 第 1 关读 `chapter/rooms/plan/theme/boss/pips` | 通过；`final / 1 房 / ['0:boss'] / sky / weaver / 3 幕` |
| Q-2 | 第一幕影袭可复现 | 冻结在 `dashWindup` 截图 | 通过；`fp=1`，Boss/玩家完整入镜（`b12b-1-phase1.png`） |
| Q-3 | 第二幕转场、召唤、环弹 | `bosshp(0.65*max)`，轮询到 `fp=2`、`n>=3`、`shots>0` | 通过；约 2.0s `shift` → `hover`；约 2.8s 召 2 影仆；约 3.4s 12 发环弹；截图 `b12b-2-phase2.png` |
| Q-4 | 第三幕火雨与密集弹 | `bosshp(0.32*max)`，轮询 `fireRain>0` | 通过；`fp=3 / storm`、`pressure.fireRain=4`、`shots 17`、`n=5`；4 圈紫粉火雨都在镜头内（`b12b-3-phase3.png`） |
| Q-5 | 真实武器链路不跨幕 | 测试配装 `upg.power=80`，把玩家摆到 Boss 近身，按实际 `attack()` 挥刀；每幕等到 `shift` 结束再出下一刀 | 通过；`hp 194→128→64→0`、`fp 1→2→3→won`；3 刀分别落在 66%/33% 门槛，未出现「一刀从 194 到 0」。高力量仅用于缩短验收，不代表平衡 |
| Q-6 | 结局/周目写盘 | `__dbg.clear()` 后读 `won/save` | 通过；`won=true`、`cycle 1→2`、`wins 0→1`、`gem 8`；截图 `b12b-4-ending.png` |
| Q-7 | 图鉴 25 怪 / 11 Boss | `markSeen` 全量后 Hall 截图 | 通过；`enemies 25/25`、`bosses 11/11`、`bossRows=11`（`b12b-5-hall.png`） |
| Q-8 | 单文件版可起终章 | `web/game.html?debug` 起 `final`，读数据/字体/Boss | 通过；1817 KB；`__bossesData` 11 条、`final` 可启动、`NinjaPixel` 可用、`weaver` 3 幕；`errs=[]`；截图 `b12b-6-single.png` |
| Q-9 | 12A 火雨回归 | 起 `lava` 战斗房，强制 `rainOn/fireRainT=0` 调 `updateFireRain` | 通过；`burn=3`，火雨 2 圈，落点都在玩家 ±132 内；`errs=[]` |

截图：`b12b-1-phase1.png`（第一幕影袭）、`b12b-2-phase2.png`（第二幕环弹 + 影仆）、`b12b-3-phase3.png`（第三幕 4 圈火雨）、`b12b-4-ending.png`（星火归位）、`b12b-5-hall.png`（25/11）、`b12b-6-single.png`（单文件实机）。

## 8. 构建与线上

- 普通构建：`dist/game.3229d58d.js`（172 KB）、`dist/assets.5a11159c.js`（96 KB）、`web/vendor/phaser.min.js`（1154 KB，单独缓存）。
- 图集：`web/atlas/core.png` 168 KB / 97 切片；字体 `web/fonts/game.woff2` 130 KB；音乐 6 首 3.11 MB 懒加载。
- 单文件：`web/game.html` 1817 KB（引擎/图集/字体/数据内联；音乐仍走 `web/audio/music/*.mp3` 懒加载）。
- 线上：本批 commit/push 后 GitHub Pages 切到 `game.3229d58d.js`，入口 `https://elijah-lin-dancer.github.io/game-dev/` 不变；上线后按 12A 口径逐文件核 SHA。

## 9. 已知限制

- 影织者仍复用 `GiantSpirit/Idle.png` 5 帧，**没有攻击帧**；影袭/瞬移/弹幕的可读性靠状态机、前摇、缩放、环弹和火雨，而不是逐帧动作。
- 终章只有 1 房，难度/血量平衡没有主测；`hp 108 × diff 1.8 ≈194` 与第三幕 4 圈火雨/16 弹是设计起点，真实手感待试玩。
- Q-5 用 `power=80` 缩短验收，只证明门槛/真实 `attack()` 链路；不代表正常 3 伤害流程的击杀时长。
- 终章 FPS 未单独测；12A 的火雨 FPS 是 headless 软件渲染相对值（24.3 vs 25.1 fps），不能代表真实 GPU 60fps。
- 单文件版音乐不内联（沿用 12A 的懒加载口径）；双击单文件时无 BGM，不影响流程。
- 结局是「压暗层 + 星火粒子 + 三段文字」，没有独立过场场景；后续若做长结局，应放到批 15 剧情线。
