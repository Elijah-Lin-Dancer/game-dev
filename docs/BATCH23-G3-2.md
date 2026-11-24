# 批 23 / G3-2：雾竹蜃 3D 重制（世界 Boss 第二只）

> 2026-11-24。G3 五只世界 Boss 的 **第 2 只**——竹林 `bamboo-6` 的雾竹蜃——从“无 Boss 的空屏”接成 ink-studio 生成的 96×96 四向三姿态专属 Boss，并把单 Boss 数据 / 存档 / 运行时一次性扩成多 Boss 结构。
> G3 世界 Boss 完成度 **2/5**；沙漠 / 雪原 / 火山三只仍未做，不在本轮冒充。

---

## 1. 结论先行

- `bamboo-6` 原先没有 Boss，只有竹门与空场；本轮新增 **雾竹蜃 / Mistbamboo Mirage**，`hp 72 / dmg 5 / rewardTokens 4`。
- 造型不是放大竹节虫，也不是换色苔背巨兽：四足由老竹搭成，背上驮一座小竹龛，龛窗透青焰；头是一张旧戏面，冠后生竹角，脸侧垂朱砂 / 米纸符，尾是三根断竹。目标是“高、瘦、会走的神龛”，与苔背巨兽的低伏小丘区分。
- 三张 atlas 均为 **384×96（4 帧 96×96）**，透明 RGBA；`idle / charge / roar` 三姿态 × 前 / 左 / 后 / 右四向；源 `art-src/g3/bamboo-mirage.cjs` seed 302。
- 可见高度：待机 **2.87–2.98×**、蓄力 **2.53–2.70×**、咆哮 **3.21–3.26×** 玩家（32px 可见高度）；脚底统一落在 **73/96**。
- 运行时从单 `boss` 扩为 `bosses[]`：`bossByScreen / bossDone / bossSpawnFor / spawnBoss`，`na.world` 升 **v8**；旧 v7 的 `boss:'done'` 自动迁到 `bosses.mossBeast`。
- 扑击命中判定改为“玩家到标记落点的距离 ≤ Boss 冲击半径”，不再拿 Boss 中心到玩家的距离硬套安全带；雾竹蜃实测 20 HP → 15，苔背巨兽回归 20 → 16。
- G3 世界 Boss **2/5**；`bamboo-6` 清场后竹林采集点 12 → 10，但「雾竹三味」只需 4 株、每丛 2，仍可完成。

---

## 2. 素材：从“空屏”到“会走的神龛”

### 2.1 造型与可读性

雾竹蜃的剪影按“高、瘦、会走的神龛”设计：

- **腿**：四条老竹高跷，膝节外凸，脚掌是三节竹筒；`charge` 时腿收短、身体压低，`roar` 时拔高；
- **龛身**：窄长的深色竹龛，正面 / 侧面各开一扇米纸窗，窗内青焰；龛顶三层竹檐，脊上金顶；
- **头**：米纸旧戏面，厚眉、空眼窝 + 青焰眼、朱砂额符 / 颊纹；冠后两枝竹角，枝梢挂竹叶与纸符；
- **侧影**：本轮补了 **长竹喙**，侧视靠“弯喙 + 竹角 + 高跷腿”读轮廓；正面才读到戏面的双眼，不再要求 1× 下侧脸也长眼；
- **尾**：三根断竹向后拖，末端挂纸铃 / 朱砂符，给背面识别；
- **龛下悬灯**：腹底垂一盏小青灯，正面 / 侧面都能看到一点青焰，补足“神龛”而不是“木偶”的感觉。

初版偏高胖，第二轮拉长腿、收窄龛身、抬高头部；第三轮加长喙、提亮龛窗、补悬灯与侧脸竹喙；最终脚底统一到 73/96，避免浮空 / 陷地。

### 2.2 输出与来源

| 姿态 | 源 | 源图集 | 正式 PNG | 可见高度 |
|---|---|---|---|---|
| 待机 `idle` | `art-src/g3/bamboo-mirage.cjs`（seed 302） | 384×96，4 向 | `assets/01-primary/world/bamboo-mirage-idle.png` 384×96 | 92–95px；2.87–2.98× 玩家 |
| 蓄力 `charge` | 同上，`pose='charge'` | 384×96，4 向 | `assets/01-primary/world/bamboo-mirage-charge.png` 384×96 | 81–86px；2.53–2.70× 玩家 |
| 咆哮 `roar` | 同上，`pose='roar'` | 384×96，4 向 | `assets/01-primary/world/bamboo-mirage-roar.png` 384×96 | 103–104px；3.21–3.26× 玩家 |

- 渲染入口：`art-src/g3/render-g3.cjs`；固定 `INK_STUDIO` 指向 `toolchains/ink-studio`，`spriteAtlas({width:96,height:96,directions:4,times:[0],columns:4})`。
- 源元数据：`docs/revamp/g3-3d/bamboo-mirage-{idle,charge,roar}.json`；对照板：`docs/revamp/g3-3d/bamboo-mirage-board.png`。
- 图集尺寸：每张 384×96；运行时帧序 0 前 / 1 左 / 2 后 / 3 右；三姿态脚底均为 **73/96**，`originY=0.7604`。
- 来源口径：ink-studio 生成（工具 MIT，成品本项目自制）；**不是 Ninja Adventure 二次改色，也不是 image-to-image**。

### 2.3 复现

```bash
cd /home/user/Doubao/chats/38454996042111490/game-repo
INK_STUDIO=/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio \
node art-src/g3/render-g3.cjs
```

---

## 3. 数据与运行时：单 Boss → 多 Boss

### 3.1 数据

`web/data/world.json` 顶层从单 `boss` 改为 `bosses` 数组：

```json
{
  "id": "bambooMirage",
  "name": "雾竹蜃",
  "screen": "bamboo-6",
  "x": 300,
  "y": 170,
  "hp": 72,
  "dmg": 5,
  "rewardTokens": 4,
  "art": "bambooMirage",
  "title": "竹影守渡者",
  "victoryTitle": "竹林的星火 · 已归位",
  "victoryBody": "雾隐渡的竹影，暂时安静下来。",
  "memorialText": "星火已归位"
}
```

- 保留苔背巨兽 `mossBeast`，新增 `bambooMirage`；`bosses` 数组驱动生成与胜利文案。
- `bamboo-6` 清空 `deco` 与 `herbs`，`props` 只留 `bambooGate 430,224` 与两侧边界竹 `26,186 / 452,190`，避免树冠 / 采集点盖住 Boss 与玩家。
- 竹林采集点从 12 → 10；委托「雾竹三味」需 4 株、每丛 2，仍可在前五屏完成。

### 3.2 存档 v8

`src/systems/worldSave.js` 升 **v8**：

- 新增 `bosses: { mossBeast, bambooMirage }`，值 `none | done`；
- v7 的 `boss:'done'` 迁移为 `bosses.mossBeast:'done'`；
- `boss` 字段保留为草原 Boss 兼容别名；
- `patchWorldSave` 兼容 `patch.boss==='done'`，新代码统一写 `bosses[id]`。

实测 v7 旧档 → v8：`v=8 / boss=done / bosses={mossBeast:done,bambooMirage:none} / tokens 9`，并即时落盘；`field-6` 的已击杀苔背巨兽不再生成，只留纪念光环。

### 3.3 运行时

`src/scenes/world.js` 改为多 Boss：

- `BOSS_ART` 按 `art` 取 `tex / origin / scale / standoff / shadow / glowY / labelY / tint`，并新增 `pounceGap / pounceR / swipeR / swipeWarn`；
- 新增 `bossByScreen`（`field-6 / bamboo-6`）、`bossDone(def)`、`bossSpawnFor(def)`；
- `spawnBoss(def)` 按当前屏生成；`startBossFight / finishBoss / retryBoss / victory / memorial` 都读当前 Boss；
- `finishBoss` 写 `bosses[id]='done'`，奖励按 Boss 数据走；`showMemorial` 带 key，切换 Boss 时销毁旧光环；
- 玩家入场 / 重试站位统一 `bossSpawn.screen.x + 150 / WORLD_Y + 240`。

### 3.4 扑击判定修正

旧逻辑：扑击落点放在玩家与 Boss 之间的“安全带”，命中却拿 `distBoss`（Boss 中心到玩家）去比 `standoff*0.74`。雾竹蜃落点 gap 85、实测 `distBoss 96.66 > 76.96`，玩家 HP 20 不掉。

现在：

- `startPounce` 用每只 Boss 的 `pounceGap` 落点：
  - 雾竹蜃 **48px**（体宽约 75px，半宽 37.8 + 玩家半宽 8，48px 刚好不整只压住）；
  - 苔背巨兽 **118px**（体宽约 216px，半宽 108 + 8，留 2px 缝）；
- 伤害判定改为玩家当前坐标到 **标记落点** 的距离 ≤ `pounceR`：
  - 雾竹蜃 **58px**；苔背巨兽 **126px**；
- 预警圈半径与伤害半径一致（`pounceR`），玩家可以靠移动躲开；`swipeR / swipeWarn` 也按 Boss 体宽拆开（雾竹蜃 62 / 苔背巨兽 96）。

实测：雾竹蜃站桩吃扑击 `HP 20 → 15`；苔背巨兽回归 `HP 20 → 16`；两者都没有整只压住玩家。

### 3.5 四向转身 / 站定扫视

上一版运行时只在追击 / 攻击时按玩家方位换向，站定后容易长期停在侧脸。既然素材是 96×96 的 3D 像素四向件，场上就应该把四个面都转出来：

- 新增 `BOSS_TURN_MS = 1600`；Boss 对象带 `turnAt / turnDir`；
- `startBossFight` 强制 `setBossPose('roar', 0)`（正面）；`intro → chase` 先 `setBossPose('idle', 0)`；
- `chase` 中若 `dist <= standoff + 4`（站定等待），每 1600ms 执行 `turnDir = (turnDir + 1) % 4`，再 `setBossPose('idle', turnDir)`，按 `0 前 → 1 左 → 2 后 → 3 右` 循环；
- 若 `dist > standoff`（追击移动），则按玩家方向 `setBossPose('idle')`，并把 `turnDir` 同步为当前 `dir`、重置 `turnAt`；`startSwipe / startPounce` 也强制朝玩家并重置计时；
- `recover` 结束回 `chase` 时 `turnDir = B.dir`；`retryBoss / finishBoss / victory` 都强制正面。

这样待机时能看到正面戏面双眼、左侧 / 右侧的长竹喙与竹角、背面的三根断竹尾；一旦玩家移动或 Boss 出手，又立刻回到“朝玩家”的战斗朝向。线上实测站定序列 `1 → 2 → 3 → 0 → 1`，每步约 1.6s，玩家 HP 保持 20；`errs=[]`。

---

## 4. 本地验收

### 4.1 功能

| 项 | 结果 |
|---|---|
| 入口 | `?world=1&debug` → `applyScreen(11)`；Boss `bambooMirage / hp 72 / dmg 5 / reward 4` |
| 图集 | `bambooMirageIdle / Charge / Roar` 均存在；`idle` 默认帧 `bambooMirageIdle` |
| 四向 | 图集 0 前 / 1 左 / 2 后 / 3 右；站定等待时每 1.6s 转 90°；移动 / 攻击朝玩家 | 通过；图集 0 前 / 1 左 / 2 后 / 3 右；站定序列 `1→2→3→0→1`（1.6s/步），HP 20 不掉；intro `dir=0` 正面 |
| 姿态 | `intro=roar → chase=idle`；蓄力 `charge`；落地 / 死亡 `roar` |
| 站位 | Boss `x300 / y170`，脚底 origin 生效；玩家 `screen.x+150 / WORLD_Y+240`，不再整只重叠 |
| 扑击 | 触发后 `HP 20 → 15`；预警圈与伤害半径一致；玩家可移动躲避 |
| 击杀 | 真实 24 次 3 伤 → `bossDead=true / bosses.bambooMirage='done' / tokens 4 / victory=true` |
| 失败 / 重试 | HP 归零 → 失败面板；`retryBoss()` → `hp 20 / bossHp 72 / active=true` |
| 苔背巨兽回归 | `applyScreen(5)` → `mossBeast / hp 64`；扑击 `HP 20 → 16`；已击杀档不再生成 |

### 4.2 三档与离线

- **960×540**：`docs/revamp/g3/g3-bamboo-intro-960.png`、`g3-bamboo-idle-960.png`、`g3-bamboo-pounce-960.png`、`g3-bamboo-victory-960.png`、`g3-bamboo-down-960.png`、`g3-bamboo-turn-board.png`、`g3-bamboo-turn.gif`；`errs=[]`。
- **640×360**：`g3-bamboo-640.png`；逻辑 640×360，底栏 Boss 名可见，HUD 血条 / 攻击块无溢出；`errs=[]`。
- **844×390 hasTouch**：`g3-bamboo-touch-844x390.png`；`touchCtl=true / touchItems=3`；桌面攻击块隐藏，只留右下「攻 / E / 返」；顶部提示「点按「攻」· 击败雾竹蜃」，底部「点按「攻」击败雾竹蜃 · 点按「返」回小屋」；`errs=[]`。
- **单文件**：`web/game.html?world=1&debug`（`file://`）→ `bambooMirage / hp 72 / tex=bambooMirageIdle / sw=false`；`errs=[]`；`g3-bamboo-single-960.png`。
- **PWA 断网**：SW controller → `setOffline(true)` → reload → 30 屏；再 `applyScreen(11)` 仍 `bambooMirage / hp 72`；`na-b18-52a234f6` / 12 条；`errs=[]`；`g3-bamboo-pwa-offline-960.png`。
- **比例审计**：`python3 tools/audit_scale.py` 扩两只 Boss → **145 实例 / 0 FAIL**；雾竹蜃 idle 2.98× / charge 2.70× / roar 3.26×，在 2.2–3.3× 区间内。

### 4.3 构建

| 项 | 值 |
|---|---|
| 首屏预算 | **1959 KB / gzip 814 KB**（<2 MiB） |
| 图集 | **154 切片 / 233,083 B**（新增 3 张 384×96 Boss atlas） |
| 游戏逻辑 | `dist/game.4aaa2e55.js` **330,568 B** |
| 素材数据 | `dist/assets.cf099f61.js` **124,157 B** |
| 单文件 | `web/game.html` **2,126,800 B** |
| PWA | `na-b18-52a234f6` / 12 条 |
| 冒烟 | 9 项 PASS |

### 4.4 Pages 线上

- 推送 `c7246dc..6bf514d`，部署等待约 16s；入口 `https://elijah-lin-dancer.github.io/game-dev/` 已切到 `game.4aaa2e55.js` + `assets.cf099f61.js`，PWA `na-b18-52a234f6` / 12 条。
- 线上 960×540 `?world=1&debug=1`：30 屏，`applyScreen(11)` 为竹林 `bamboo-6`，Boss `bambooMirage / hp72 / active / scale1.8084 / originY0.7604 / tex=bambooMirageIdle`，`standoff104 / pounceGap48 / pounceR58`。
- 转身：`intro` 为 `pose=roar / dir=0 / tex=bambooMirageRoar`；站定后实测 `dir` 序列 `1 → 2 → 3 → 0 → 1`，时间点 `60034 / 61651 / 63284 / 64901`，每步约 1.6s，玩家 HP 保持 20；`errs=[]`。
- 扑击：`HP20→15`，Boss `state=recover / pose=roar / dir=1`，落点 `{x:5524,y:225}`；最后一击 3 伤 → `hp0 / bossDead=true / bosses={mossBeast:none,bambooMirage:done} / tokens4 / victory=true`。
- 线上 640×360：`scrollWidth=640 / clientWidth=640`；844×390 `hasTouch`：`touchCtl=true / touchItems=3 / scrollWidth=844`；PWA 断网 `online=false / 30 屏 / cache 12 条`，离线后再 `applyScreen(11)` 仍 `bambooMirage / hp72 / tex=bambooMirageIdle`；四组 `errs=[]`。
- 截图：`g3-online-bamboo-intro-960.png`、`g3-online-bamboo-idle-960.png`、`g3-online-bamboo-pounce-960.png`、`g3-online-bamboo-victory-960.png`、`g3-online-bamboo-640.png`、`g3-online-bamboo-touch-844x390.png`、`g3-online-bamboo-pwa-offline-960.png`，以及 `g3-online-bamboo-turn-board.png`、`g3-online-bamboo-turn.gif`，共 8 张 + GIF。
- 旧 `game.f3072417.js` 的 24 次真实击杀 / 7 张线上截图仍是有效基线，保留在 `LEDGER.md` 79–80；本次 `4aaa2e55` 的增量以 W-71 与上面的转身证据为准。

---

## 5. 已知边界 / 下一步

- G3 世界 Boss 仍 **2/5**：草原苔背巨兽、竹林雾竹蜃已重制；沙漠 / 雪原 / 火山三只未做。
- `bamboo-6` 清场后竹林采集点 12 → 10；委托仍可完成，但 G2 “采集点总数”口径从 65 降到 63，需在 G2 收尾时决定是否补回 2 个远端采集点。
- 四向仍是姿态切帧，不是逐帧行走；但现在站定会每 1.6s 主动转 90°，追击 / 攻击朝玩家。侧视的戏面只保留竹喙 / 竹角 / 红纹轮廓，正脸才读双眼，这是当前 96×96 的取舍。
- 战斗仍是“追击 + 近身挥击 + 扑击 + 回气”四段；没有独立多阶段、弹幕、地形破坏。扑击预警圈已经可躲，但 `charge` 与 `roar` 的差别主要靠姿态，不靠特效。
- 竹林 Boss 场景只有清场 + 竹门地标，没有专属祭坛 / 雾障；下一轮若要“神龛”氛围，可在 `bamboo-6` 加一盏石灯或一圈纸符（不挡判定）。

---

## 6. 改动文件

- 新增：`art-src/g3/bamboo-mirage.cjs`、`docs/revamp/g3-3d/bamboo-mirage-{idle,charge,roar}.png/.json`、`docs/revamp/g3-3d/bamboo-mirage-board.png`、`assets/01-primary/world/bamboo-mirage-{idle,charge,roar}.png`、`docs/revamp/g3/g3-bamboo-*.png`、`docs/revamp/g3/g3-bamboo-turn-board.png`、`docs/revamp/g3/g3-bamboo-turn.gif`、`docs/revamp/g3/g3-online-bamboo-turn-board.png`、`docs/revamp/g3/g3-online-bamboo-turn.gif`
- 修改：`art-src/g3/render-g3.cjs`、`web/data/world.json`、`src/systems/worldSave.js`、`src/scenes/world.js`、`tools/build.mjs`、`tools/audit_scale.py`、`assets/CREDITS.md`、`docs/ART_PIPELINE.md`、`docs/OPENWORLD.md`、`docs/ACCEPTANCE.md`、`docs/MASTERPLAN.md`、`CURRENT.md`、`LEDGER.md`
