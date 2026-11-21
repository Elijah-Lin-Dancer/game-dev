# 批 12A：第五章熔岩地心

> 目标：把第五章从数据表里的 `lava` 行做成一套可辨认、可打、可验收的熔岩地心；补 5 张新怪、2 只可打 Boss、灼烧/火雨两套压力，并让图鉴、HUD、单文件版同步到 25 怪 / 10 Boss。素材仍全部来自 Ninja Adventure 包内，外部件 0、自绘 0。终章（12B）不在本批。

## 1. 数据表

| 文件 | 内容 | 说明 |
|---|---|---|
| `web/data/chapters.json` | 第五章 `lava` 9 关 ×10 房 | `diff 1.6`，章内每关 +0.08；`pressure: burn,firerain` |
| `web/data/enemies.json` | 25 只小怪（原 20 + 新 5） | 新增 `flam / dragon / demon / lantern / spirit` |
| `web/data/bosses.json` | 11 个 Boss（原 9 + 新 2） | 新增 `flam / demonCyclop2`；`weaver` 仍是 12B 占位 |
| `src/core/config.js` | 5 组小怪数值 + `flamBoss` | 沿用同一套 `CFG` 读取，不在场景里写死 |
| `tools/build.mjs` | 新增 8 张切片 | 5 小怪四向 + `flamIdle` + `demon2Idle` + `demon2Walk` |

第五章配置（与 `chapters.json` 一致）：

| 项 | 值 |
|---|---|
| 章 id / 名 | `lava` / 熔岩地心 |
| 单关房数 | 10 |
| 房型模板 | `battle×4, elite×2, treasure, shop, rest, boss` |
| 怪池 | `flam, dragon, demon, lantern, spirit` |
| Boss 池 | `flam, demonCyclop2` |
| 难度 | 第 1 关 ×1.60，逐关 +0.08，第 9 关 ×2.24 |
| 压力 | `burn`（灼烧圈）、`firerain`（火雨） |

Boss 按 `bossPool[(stage.index - 1) % pool.length]` 轮换：奇数关炎巨灵、偶数关熔火独眼。实测 1–9 关 `bossId` 为 `flam → demonCyclop2 → flam → … → flam`。

## 2. 新怪与行为

5 张图都是 **64×64 / 4×4 / 16px 帧**，`spawnFoe` 统一 `setScale(2)`；四向 walk 行直接切，帧锚点一致。

| id | 中文 | 行为 | 破法 |
|---|---|---|---|
| `flam` | 火灵 | 保持 95–220 中距，蓄力 280ms 后单发火球（2 伤） | 侧移后近身，别在它正前方对射 |
| `dragon` | 火龙 | 保持 150–300 远距，蓄力 420ms 后三连扇形火 | 贴近或绕到侧后，扇形中段最危险 |
| `demon` | 炎魔 | 近身蓄力 380ms，随后 240ms 直线冲撞（4 伤） | 看脚下蓄力，横向闪开让冲撞撞墙 |
| `lantern` | 鬼灯 | 漂浮追踪，110–210 距离发慢速追踪火（0.35 转向） | 保持移动，利用追踪弹转弯半径 |
| `spirit` | 火魂 | 半透明飘移，100–200 距离三向扇射 | 从扇射缝隙穿，别贴脸 |

实测：`flam` 同屏最多 1 弹、`dragon` 3 弹、`lantern` 1 弹、`spirit` 5 弹；`demon` 进入 `charge / windup` 但没有远程弹。`enemyShot()` 为 5 只怪共用，颜色/速度/伤害/追踪都是参数，不新增弹种类。

首间怪池有一个修正：章节首间原本用 `easy.find(...)`，熔岩池没有 easy 项时回落 `pool[0]=flam`，导致第一间清一色火灵。现改为 `easy.filter(pool.includes)`，并按 `this.enemies.length` 交替，实测第 1 关首间为 `flam/demon` 交替。

## 3. 两只 Boss

### 3.1 炎巨灵（flam）

- 悬浮保持 110–240 中距，不贴脸时不会持续伤人。
- **近身火环**：`castWindup` 480ms，半径 92，3 伤；逼玩家离开中心。
- **远距扇火**：前摇后 4 弹（半血 6 弹）扇形，弹速 145，2 伤。
- 半血 `roar`：速度 ×1.2、施法间隔 1500ms 缩短、前摇更短。
- 图集帧：`GiantFlam/Idle.png`，50×50，5 帧，`scale 2.0`；没有攻击帧，靠前摇、缩放和火环/弹幕表达动作。

### 3.2 熔火独眼（demonCyclop2）

- 复用 `updateDemon()` 状态机，`spawnBoss` 支持 `prefix / sheet / minion`。
- **冲撞**：440ms 前摇，300ms 直线 235 速，4 伤；
- **震地**：520ms 前摇，72 半径预警圈，4 伤并击退；
- **召唤**：每 3 秒且同屏 <5 时召 2 只 `flam`，给清场压力。
- 半血：速度 ×1.3、前摇 ×0.78。
- 动画 `demon2-idle` / `demon2-walk` 来自 `DemonCyclop2/Idle.png` 与 `Walk.png`，50px 帧；`kind` 仍是 `demon`，`bossId` 为 `demonCyclop2`。
- 实测 5.2s 后场上 `n=3`（Boss + 2 只 flam），召唤逻辑生效。

## 4. 主题皮肤

熔岩没有可直接整屏平铺的专用底板，沿用包内 `floorDungeon` 322 花砖，用“熔岩染色 + 加法光 + 裂纹贴花 + 火把/光柱/灰尘”做地底火道：

| 项 | lava |
|---|---|
| 地面 tint | `0xffb08a` |
| 加法光 | `0xff4a20` 24% |
| 墙色 | `0x4a2018` |
| 地板贴花 | 染橙 + 7 个 ADD 熔岩裂纹 |
| 暗角 alpha | 1.0（最强的一档） |
| 火把 | `0xff6a30` |
| 光柱 | `0xff8a4a` 12% |
| 灰尘 | `0xff9a5a` |
| Boss 房压暗 | `0x33100c` |

**暗角实现改为 UI 下面的贴图**：原先 `this.cameras.main.postFX.addVignette` 会把 HUD 一起压黑，熔岩 `[0.56,0.22]` 下顶栏文字被裁、血量看不清。现 `buildVignette(theme)` 生成 640×360 Canvas 径向渐变（中心透明 → 0.55 处 0.06 → 边缘 0.34），`setDepth(790)`、`setScrollFactor(0)`，HUD 800 在其上；主题 alpha 表 `field .5 / fort .78 / desert .78 / water .88 / lava 1 / dungeon .9`。删掉 `_vig/_vigCfg` 与 postFX，`__dbg.light` 改为切 `roomFx` 与 `vig` 可见性。实测 HUD 完整显示，帧率略升。

## 5. 压力机制

只作用于 `battle` / `elite`；Boss 房、宝箱、商店、休整房保持干净读招。`enterRoom` 开头统一销毁 `fireRain` 预警圈并清 `fireRainT`，跨房不残留。

### 5.1 灼烧（burn）

- 每个战斗/精英房随机 3 个灼烧圈，半径 44，伤害 1，每 650ms 跳一次；**不减速**。
- 视觉：红橙圆 + 内圈 + 呼吸。
- 实测：站进圈内 1.45s，HP `20 → 18`（两跳）。

### 5.2 火雨（firerain）

- 进房 1.8s 后第一波，之后每 2.8s 一波；每波 2 个预警圈，半径 34。
- 预警 850ms 后落火，2 伤；同屏最多 6 个预警圈。
- 视觉：暖黄白粗边预警圈（`0xfff0b0`，4px）+ 橙填充；落火后消失。与红色灼烧圈区分。
- 实测：`__dbg.pressure()` 同屏抓到 `fireRain=2, burn=3`，截图 `b12a-2-rain.png` 有 3 个暖黄预警圈 + 3 个红灼烧圈。

### 5.3 旧区域清理

从熔岩战斗房跳 Boss 房后 `pressure.burn=0, fireRain=0, rainT=0`；水殿的 `waterSlow/currents` 也仍由同一段 `enterRoom` 清理，未回归。

## 6. 图鉴与 HUD

- `hall.js` FOES 25、BOSSES 10；宽屏 9 列 / 40px。
- 新增短名「炎巨灵」「火独眼」，避免 4 字在 40px 格内压字。
- **Boss 键修正**：`bosses.json` 的 `seen` 是 `samurai / samuraiRed`，`hall.js` 原来用 `samBlue / samRed`，导致蓝/赤武士永远 ???。现 BOSSES 的 key 改为 `samurai / samuraiRed`（贴图仍 `samIdle / rsamIdle`），图鉴 10/10。
- **10 Boss 布局**：原武器栏固定 `bossY+16+cell`，只按 Boss 一行算；10 Boss 在 9 列下占 2 行。现 `bossRows=Math.ceil(BOSSES.length/cols)`，`wpnY=bossY+16+bossRows*cell`，第二行不再压武器栏。
- 截图 `b12a-5-hall.png`：怪物 25/25、Boss 10/10；蓝武士/赤武士已点亮。截图时武器未特意点亮，所以武器栏仍是 0/6，不影响本轮判据。

## 7. 验收

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| P-1 | 10 房关可推进到通关 | 开 GOD，逐房 `clear + next`，读房型/结算 | 通过；顺序 battle×4 → elite×2 → treasure → shop → rest → boss，`won=true`，`hp=20`。GOD 只验证流程/门/结算，不代表真实难度平衡 |
| P-2 | 9 关编排一致、难度递进 | 逐关起 `lava`，读 `plan/diff/template` 与首间怪 | 通过；9 关均 10 房、模板一致，diff 1.6/1.68/1.76/1.84/1.92/2.0/2.08/2.16/2.24，首间均为 flam/demon 交替 |
| P-3 | 两只 Boss 可打、按池轮换 | 逐关 `jump('boss')` 读 `bossId`；强制两只读状态机 | 通过；1–9 关奇数 flam、偶数 demonCyclop2；flam `phase=castWindup`、hp 93；demon2 5.2s 后 `n=3`（Boss + 2 flam） |
| P-4 | 5 只新怪有独立行为 | 逐只 `__dbg.newFoe()`，3s 内采样 `shots/phase` | 通过；flam 1 弹、dragon 3 弹、lantern 1 弹、spirit 5 弹；demon 进入 `charge / windup`，无远程弹 |
| P-5 | 灼烧/火雨生效且不残留 | `__dbg.pressure()` + 站圈扣血 + 跳 Boss 房 | 通过；`burn=3, fireRain=2`；圈内 HP 20→18；Boss 房 `burn=0, fireRain=0` |
| P-6 | HUD 不被暗角压、图鉴 25/10 | 熔岩截图 + Hall 全量 `markSeen` 后截图 | 通过；HUD 完整；怪物 25/25、Boss 10/10；蓝/赤武士点亮；Boss 第二行不压武器栏 |
| P-7 | 单文件版数据/字体/图集完整 | `web/game.html` 单文件起熔岩，读 `plan/tex/font` | 通过；`game.html` 1807 KB；5 小怪 `frames=16`，`flamIdle=5 / demon2Idle=5`，`document.fonts.check('16px NinjaPixel')=true`，`errs=[]` |

截图：`b12a-1-foes.png`（5 怪 + 标签 + 完整 HUD）、`b12a-2-rain.png`（火雨预警 + 灼烧）、`b12a-3-flam.png`（炎巨灵）、`b12a-4-demon2.png`（熔火独眼 + 2 召唤 flam）、`b12a-5-hall.png`（25/25、10/10）、`b12a-6-single.png`（单文件实机）。

## 8. 构建与线上

- 普通构建：`dist/game.4bc90aed.js`（162 KB）、`dist/assets.759b311b.js`（94 KB）、`web/vendor/phaser.min.js`（1154 KB，单独缓存）。
- 图集：`web/atlas/core.png` 168 KB / 97 切片；字体 `web/fonts/game.woff2` 130 KB；音乐 6 首 3.11 MB 懒加载。
- 单文件：`web/game.html` 1807 KB（引擎/图集/字体/音频/数据全内联）。
- 旧构建 `dist/assets.c223544a.js`、`dist/game.19c18ee6.js` 删除。
- 线上仍为批 11 `game.19c18ee6.js`；本批 commit/push 后由 GitHub Pages 切到 12A，入口不变。

## 9. 已知限制

- 熔岩没有专属整屏地板，皮肤是“同一张 322 花砖 + 熔岩染色/裂纹/加法光”；`TilesetElement`、`Pipes` 仍是备选素材，后续若找到可平铺的 16px 熔岩底板，只需换 `floorKey`，主题分支已留好。
- 炎巨灵只有 5 帧 Idle，熔火独眼只有 Idle/Walk；没有逐帧攻击图，动作可信度靠状态机、前摇、缩放和预警圈，不靠攻击帧。
- 火雨/灼烧只在战斗与精英房；Boss 房刻意不加，避免读招被环境伤害打断。
- 帧率只在 headless 软件渲染下测：同房间火雨开 `24.3 fps`、关 `25.1 fps`（约 −3%），worst frame `60.6ms vs 47.8ms`；未在真实 GPU/桌面浏览器上验证 60fps，P3 只证明“相对不掉帧”，不是绝对 60。
- 9 关只逐关验证 plan / 首间 / Boss 池；完整 10 房推演只在第 1 关做（GOD）。2–9 关没有逐房真打，难度平衡仍待主测。
- 图鉴 10 Boss 在 9 列下占 2 行，第二行只有 1 项；宽屏可读，窄屏仍靠右栏压缩，未做 10 列重排。
- 12B 终章未开始：`weaver` 仍是 `kind:frog` 占位，三阶段与影织者素材未定。
