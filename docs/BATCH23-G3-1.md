# 批 23 / G3-1：苔背巨兽 3D 重制（世界 Boss 第一只）

> 2026-11-24。用户要求“世界 Boss 一定要用工具生成、精细打磨”。本轮先把 **G3 五只世界 Boss 的第 1 只**——草原 `field-6` 的苔背巨兽——从 Ninja Adventure 的 `GiantRacoon` 占位素材，换成 ink-studio 生成的 96×96 四向三姿态专属 Boss，并把世界 Boss 运行时按“可扩展多 Boss”的方式重新收口。
> 本轮不冒充“五只都做了”：G3 世界 Boss 完成度 **1/5**，其余 4 只仍待后续批次。

---

## 1. 结论先行

- 旧 Boss 是 `racoonIdle / racoonAtk / racoonJump / racoonChg` 的巨浣熊，名字叫“苔背巨兽”但视觉上没有苔背。
- 新 Boss 是 **苔背巨兽 / Mossback Behemoth**：四足低伏、苔甲覆背、旧石与蕨草从背脊生长、骨色獠牙、琥珀眼；有 `idle / charge / roar` 三套姿态，每套 4 向（前 / 左 / 后 / 右）。
- 三张 atlas 都是 **384×96（4 帧 96×96）**，透明 RGBA，运行时按帧切换；不接 ink-studio 运行时。
- Boss 可见高度：待机 **2.41–2.61×** 玩家（32px），蓄力 **2.61–3.03×**，咆哮 **2.34–2.54×**；不靠画布留白冒充体型。
- 代码不再播放 `racoon-*`；`world.boss.id` 改为 `mossBeast`，`hp 64 / dmg 4 / rewardTokens 3`；`na.world` 仍是 v7，Boss 进度仍是单字段 `none|done`，没有伪造多 Boss 存档。

---

## 2. 素材：不是换皮，是重新建模

### 2.1 造型与可读性

苔背巨兽的剪影按“会走的小丘”设计，而不是放大浣熊：

- **躯干**：低伏的宽背，暗褐皮毛，肩胯分成两组体块，避免圆球感；
- **背甲**：6 块苔盖 + 3 块旧石背脊 + 5 根垂苔 + 3 株高蕨，背面和侧面都能看出“苔背”；
- **头部**：低垂楔形头、骨色长獠牙、下颚黑腔 + 4 颗牙、琥珀发光眼、深色眉骨；
- **四肢**：四条粗腿外撇，前后脚掌各有 3 根骨爪；蓄力姿态会把后腿拉长、身体压低；
- **小细节**：背甲上的两朵浅色小蘑菇、喉部呼吸微光、尾端苔球；在 1× 下仍能读出 2–3 个特征，不靠放大后才成立。

### 2.2 输出与来源

| 姿态 | 源 | 源图集 | 正式 PNG | 可见高度 |
|---|---|---|---|---|
| 待机 `idle` | `art-src/g3/moss-beast.cjs`（seed 301） | 384×96，4 向 | `assets/01-primary/world/moss-beast-idle.png` 384×96 | 77–84px；2.41–2.61× 玩家 |
| 蓄力 `charge` | 同上，`pose='charge'` | 384×96，4 向 | `assets/01-primary/world/moss-beast-charge.png` 384×96 | 84–97px；2.61–3.03× 玩家 |
| 咆哮 `roar` | 同上，`pose='roar'` | 384×96，4 向 | `assets/01-primary/world/moss-beast-roar.png` 384×96 | 75–81px；2.34–2.54× 玩家 |

- 渲染入口：`art-src/g3/render-g3.cjs`；固定 `INK_STUDIO` 指向 `toolchains/ink-studio`，`library` 的 `spriteAtlas({width:96,height:96,directions:4,times:[0],columns:4})`。
- 源元数据：`docs/revamp/g3-3d/moss-beast-*.json`；对照板：`docs/revamp/g3-3d/moss-beast-board.png`。
- 图集尺寸：每张 384×96；运行时帧序 0 前 / 1 左 / 2 后 / 3 右；pivot 取 `0.5,1` 底部贴地。
- 来源口径：ink-studio 生成（工具 MIT，成品本项目自制）；**不是 Ninja Adventure 二次改色，也不是 image-to-image**。

### 2.3 复现

```bash
cd /home/user/Doubao/chats/38454996042111490/game-repo
INK_STUDIO=/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio \
node art-src/g3/render-g3.cjs
```

---

## 3. 运行时：从单只浣熊到可扩展的单 Boss

### 3.1 数据

`web/data/world.json` 顶层 `boss`：

```json
{
  "id": "mossBeast",
  "name": "苔背巨兽",
  "screen": "field-6",
  "x": 300,
  "y": 170,
  "hp": 64,
  "dmg": 4,
  "rewardTokens": 3
}
```

- `id` 从 `racoon` 改为 `mossBeast`；`world.js` 的默认值同步。
- `hp` 56 → 64（22 次玩家攻击），`dmg 4` 不变，`rewardTokens 3` 不变。
- `na.world` 仍是 v7：Boss 进度原为 `boss: none|done`，本轮不添加假的“多 Boss 进度”字段；等下一只 Boss 真正接入时再升存档。
- `field-6` 地面 `deco` 从 12 条清空：Boss 战场只留草纹 / 光束 / 跨屏左侧树框，避免灌木与树冠盖住玩家；场景名仍是「草原 · 苔背巢」。

### 3.2 朝向与姿态

`src/scenes/world.js` 新增：

- `BOSS_TEX = { idle, charge, roar }`，`BOSS_SCALE = 2.2`；
- `bossDirection()`：玩家在下方 → 帧 0（正前），上方 → 帧 2（背面），左右 → 帧 1 / 3（左右侧）；
- `setBossPose(pose, dir)`：切 `mossBeastIdle / Charge / Roar` + 对应帧，避免 `play('racoon-idle')` 一类旧动画残留；
- Boss 入场 `state='intro'` 900ms，先咆哮再转 `chase`；不会一进屏就被 chase 的朝向刷新覆盖掉咆哮；
- 追击、蓄力、扑击、落地、回气、死亡分别绑定姿态；`spr` 有 1.2% 的呼吸缩放 tween，但切姿态时保持帧完整。

### 3.3 96×96 级“精细打磨”做在哪

不是只换图片，运行时同步重做了一圈可感知的反馈：

- **姿态**：蓄力用 `charge`，挥击 / 落地 / 死亡用 `roar`，静止用 `idle`；
- **朝向**：四向跟随玩家，侧身扑击时不再“背对玩家放大招”；
- **落地反馈**：`bossImpact()` 环形冲击波 + 8–16 个苔屑方块飞散，配 70–200ms 镜头震动；
- **环境苔尘**：Boss 激活时每 300ms 从背脊附近升起 1–2px 苔光碎屑，不遮挡判定；
- **地面**：新增 118×20 黑色投影 + 102×22 苔色贴地环，Boss 不再像贴纸浮空；
- **名字**：世界名标签在 Boss 战中隐藏，名字交给底部血条，避免顶栏压字；入场 banner 仍独立显示「苔背巨兽 · 星火守巢者」；
- **入场站位**：`startBossFight / retryBoss` 把玩家放在 `screen.x+150 / WORLD_Y+240`，避开左侧跨屏树冠与底栏 Boss 血条；`field-6` 地面 deco 清空，保留草纹、光束与跨屏树框，战场中心不再有前景树盖住玩家；
- **结算清理**：胜利时清掉入场 banner / toast，失败面板同样独占视线，避免残留「SPACE / J 攻击」压住结算；
- **触屏**：Boss 战隐藏桌面“攻击”大块，只保留右下「攻」触控键；HUD 提示改“点按「攻」击败…”；解决 844×390 下两个攻击按钮重叠；
- **文案**：banner / HUD / 失败面板 / 胜利面板的“苔背巨兽”改为从 `this.boss.name` 读取，为下一只 Boss 留口，不再硬编码。

### 3.3.1 脚底锚定与站位（本轮新增）

- **脚底锚定**：96×96 图集里脚底只到第 65–72 行，整帧下方有 24–31 px 透明边；旧 `setOrigin(0.5,1)` 把脚底抬高了 60–70 px，Boss 看起来浮空。现在按姿态把 origin 设到脚底线：`idle 66/96 / charge 72/96 / roar 65/96`，阴影与苔色贴地环仍贴 `spr.y-3`。
- **站位重算**：脚底落回地面后，`world.boss.y` 从 210 收到 **170**，`x` 从 252 右移到 **300**；玩家仍在 `screen.x+150`，与 Boss 体宽（约 183 px）留出可读间隙。入场 / 重试都站在 `WORLD_Y+240`，不再被左侧跨屏树冠或底栏血条压住。
- **追击距离**：新增 `BOSS_STANDOFF=122`。巨兽不再追到玩家脚边再停下，而是在 122 px 外站住；近身（<104 px）才切抓击，避免整只玩家被背甲盖住。
- **四向修正**：图集实际是 `0 前 / 1 左 / 2 后 / 3 右`；旧代码把 1/3 写反，Boss 会背对玩家。`bossDirection()` 已改为左→1、右→3，进场咆哮就朝玩家。

### 3.4 边界与战斗

- `movePlayer` 的 `screenIndex === 5` 硬编码改为 `bossSpawn.screenIndex`，Boss 换屏时不锁错边；
- Boss 场地边界仍是 `x1 = s.x + 44 / x2 = s.x + SCREEN_W - 44`，但玩家侧锁边改为 `bossSpawn.screen.x + 24`；
- 近身抓击判定 74px、扑击落地判定 64px、半径 104px 内才进入抓击、122px 外停止追击，符合新体型；
- 失败面板保留“重新挑战 / 回到小屋”，R / 按钮重试；重试重置 `intro → chase`、满血、姿态 idle；
- 击杀写 `patchWorldSave({ boss: 'done', tokens: +3 })`；胜利面板动态显示 Boss 名。

---

## 4. 验收

### 4.1 功能

| 项 | 结果 |
|---|---|
| 入口 | `?world=1&debug` → `applyScreen(5)`；Boss `mossBeast / hp 64 / dmg 4 / reward 3` |
| 图集 | `textures.exists('mossBeastIdle')=true`；`frameTotal=5`（SpriteSheet 含 1 个 base frame + 4 帧） |
| 四向 | `below=0 / above=2 / left=1 / right=3`；帧序 0 前 / 1 左 / 2 后 / 3 右 |
| 姿态 | `intro=roar → chase=idle`；蓄力 `charge`；落地 / 死亡 `roar` |
| 击杀 | 22 次 3 伤 → `bossDead=true / boss='done' / tokens 3 / victory=true` |
| 失败 / 重试 | HP 归零 → 失败面板；`retryBoss()` → `hp 20 / bossHp 64 / state intro→chase` |
| 草原回归 | 30 屏 / 5 NPC / 65 采集点 / 5 篝火 / 3 炉眼不变；`npm run smoke` 9 项 PASS |

### 4.2 三档与离线

- **960×540**：`docs/revamp/g3/g3-boss-intro-960.png`、`g3-boss-idle-960.png`、`g3-boss-fight-960.png`、`g3-boss-victory-960.png`、`g3-boss-down-960.png`；`errs=[]`。
- **640×360**：`g3-boss-640.png`；逻辑 640×360，底栏 Boss 名可见，HUD 血条 / 攻击块无溢出；`errs=[]`。
- **844×390 hasTouch**：`g3-boss-touch-844x390.png`；逻辑 779×360；`touchCtl=true / touchItems=3`；桌面攻击块 `visible=false`，`hudHint` 为“点按「攻」击败苔背巨兽 · 点按「返」回小屋”；`errs=[]`。
- **单文件**：`web/game.html?world=1&debug`（`file://`）→ `field-6 / boss 苔背巨兽 / hp 64 / mossBeastIdle=true / sw=false`；`errs=[]`；`g3-boss-single-960.png`。
- **PWA 断网**：SW controller → `setOffline(true)` → reload → `field-6 / boss hp 64 / mossBeastIdle=true`；`errs=[]`；`g3-boss-pwa-offline-960.png`。
- **比例审计**：`python3 tools/audit_scale.py` 扩 Boss 三项 → **144 实例 / 0 FAIL**；Boss idle 2.61× / charge 3.03× / roar 2.54×，在 2.2–3.3× 区间内。

### 4.3 构建

| 项 | 值 |
|---|---|
| 首屏预算 | **1943 KB / gzip 801 KB**（<2 MiB） |
| 图集 | **151 切片 / 216 KB**（新增 3 张 384×96 Boss atlas） |
| 游戏逻辑 | `dist/game.09389bb4.js` **327,151 B** |
| 素材数据 | `dist/assets.5d1e6b5b.js` **123,728 B** |
| 单文件 | `web/game.html` **2,106,726 B** |
| PWA | `na-b18-6719a767` / 12 条 |
| 冒烟 | 9 项 PASS |

### 4.4 Pages 线上

- 入口 `https://elijah-lin-dancer.github.io/game-dev/` → `game.09389bb4.js` + `assets.5d1e6b5b.js`；Boss `x300 / y170`，`field-6` `deco=0`，脚底 origin 生效；
- 960 / 640 / 844×390 七张 `g3-online-boss-*`：入场 / 待机 / 战斗 / 胜利 / 失败 / 640 / 触屏；`labelVisible=false`，844 `touchItems=3`、桌面攻击块隐藏；
- 击杀 `boss='done' / tokens=3 / victory=true`；失败面板 / 重试正常；三档 `errs=[]`。

---

## 5. 已知边界 / 下一步

- G3 世界 Boss 仍 **1/5**：草原苔背巨兽已重制；竹林 / 沙漠 / 雪原 / 火山四只未做，不在本轮冒充。
- 本轮 Boss 是“单只 Boss 的深打磨”，不是“多 Boss 系统”：`world.boss` 仍是单对象，`na.world.boss` 仍是单 `done` 位；第二只接入时需一次性升级数据 / 存档 / 运行时的 boss key。
- 四向是 **静态姿态切帧 + 呼吸 tween**，不是 8 向行走动画；对俯视 16px 世界足够，但下一只大体型 Boss 可考虑 6–8 向或分帧 walk。
- 战斗仍是“追击 + 抓击 + 扑击 + 回气”四段；没有独立多阶段、弹幕、地形破坏。先把第一只的资产 / 朝向 / 反馈做扎实，再扩 Boss 数量。

---

## 6. 改动文件

- 新增：`art-src/g3/moss-beast.cjs`、`art-src/g3/render-g3.cjs`、`docs/revamp/g3-3d/*`、`docs/revamp/g3/*`、`assets/01-primary/world/moss-beast-{idle,charge,roar}.png`
- 修改：`web/data/world.json`、`src/scenes/world.js`、`tools/build.mjs`、`tools/audit_scale.py`、`assets/CREDITS.md`、`docs/ART_PIPELINE.md`、`docs/OPENWORLD.md`、`docs/ACCEPTANCE.md`、`CURRENT.md`、`LEDGER.md`、`docs/MASTERPLAN.md`
