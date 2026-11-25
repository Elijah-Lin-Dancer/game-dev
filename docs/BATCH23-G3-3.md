# 批 23 / G3-3：沙海蜃 3D 重制（世界 Boss 第三只）

> 2026-11-25。G3 五只世界 Boss 的 **第 3 只**——沙漠 `desert-6` 的沙海蜃——从“有沙门 / 有采集点、但没有 Boss”的空屏，接成 ink-studio 生成的 96×96 四向 × 待机 / 蓄力 / 咆哮专属活体 Boss。
> G3 世界 Boss 完成度 **3/5**；雪原 / 火山两只仍未做，不在本轮冒充。

---

## 1. 结论先行

- `desert-6` 原先只有沙门、枯木、沙棕与 2 个沙枣点；本轮新增 **沙海蜃 / Sandsea Mirage**，`hp 80 / dmg 5 / rewardTokens 4`。
- 造型不是“沙神龛”，也不是苔背巨兽换色：它是一只贴地游走的沙海活体——宽薄沙帆翼、玻璃质沙壳、四只短桨足、长鞭尾；不驮龛、不背苔，低伏轮廓与苔背巨兽“小丘”、雾竹蜃“高龛”明确区分。
- 三张 atlas 均为 **384×96（4 帧 96×96）**，透明 RGBA；`idle / charge / roar` 三姿态 × 前 / 左 / 后 / 右四向；源 `art-src/g3/sand-mirage.cjs` seed 303。
- 可见高度：待机 **2.48×**、蓄力 **2.25×**、咆哮 **2.85×** 玩家（32px 可见高度）；脚底统一落在 **65/96**，`originY=0.6771`，`scale=2.4`。
- 运行时新增第三只 Boss 的 `BOSS_ART.sandMirage`，并把近身攻击阈值从全局 `dist<104` 拆为每只 Boss 的 `swipeAt`；沙海蜃 `standoff 132 / swipeAt 104 / pounceGap 92 / pounceR 100 / swipeR 112 / swipeWarn 104`。
- 沙海蜃专属 **蜃气重影**：身后一层沙金色 ADD 重影，4px 漂移、α 0.09–0.135，随本体姿态 / 朝向 / 缩放同步；不改变碰撞与伤害。
- `na.world` 升 **v9**：`bosses={mossBeast,bambooMirage,sandMirage}`；v8 旧档补 `sandMirage:'none'`，不丢 `mossBeast / bambooMirage` 进度。
- `desert-6` 清空 `props / herbs`，沙漠采集点 14 → 12；「沙海拾味」只需 5 颗、每丛 2，仍可在前五屏完成。
- G3 世界 Boss **3/5**；剩余雪原 / 火山两只、远征结局与 3 条成就未做。

---

## 2. 素材：从“沙门空场”到“贴地活体”

### 2.1 造型与可读性

沙海蜃按“低伏、宽薄、会游走的沙海活体”设计，避免做成第三座神龛：

- **翼**：两片后掠沙帆翼，正面展开约 110px，侧面收成薄翼缘；翼缘保留沙玻璃刺，但不使用高亮青色，避免背面读成“第三只眼”；
- **身**：低而宽的主躯干，沙壳米黄 / 深褐腹甲，背部三块覆瓦状沙甲，裂缝透青；
- **背帆**：一道后掠的新月形沙玻璃帆，`idle` 半张、`charge` 压低、`roar` 张开；正 / 背面有前后向骨架，不再是一根光桅杆；
- **头**：宽楔形沙壳，两只深眼窝 + 青焰瞳 + 金色高光，横裂口 + 两颗小獠牙，颊侧沙玻璃短角；侧视靠颊甲 / 短吻 / 角读轮廓；
- **足**：四只短桨足，脚底三枚沙玻璃爪，`charge` 前足前探、`roar` 后足撑起；
- **尾**：三节沙壳长鞭尾 + 玻璃倒刺 + 尾端金色沙晶，背面能看到一条高出体表的尾线；
- **活体感**：不是静态摆件；运行时叠加蜃气重影，站定会四向转身，攻击时进入蓄力 / 咆哮。

首轮正面偏“沙色小飞机 / 甲虫”，眼窝被长吻板遮住，背帆正面像桅杆；后续放大眼窝 / 青焰瞳、收紧长吻板、加颊甲与獠牙、给背帆加前后向骨架、把蓄力背帆抬高到 2.25× 下限，并补背面尾线。最终在 960 / 640 / 844 实机上以 2.4 倍显示，前 / 左 / 后 / 右四面都能读。

### 2.2 输出与来源

| 姿态 | 源 | 源图集 | 正式 PNG | 可见高度 |
|---|---|---|---|---|
| 待机 `idle` | `art-src/g3/sand-mirage.cjs`（seed 303） | 384×96，4 向 | `assets/01-primary/world/sand-mirage-idle.png` 384×96 | 79.2px；2.48× 玩家 |
| 蓄力 `charge` | 同上，`pose='charge'` | 384×96，4 向 | `assets/01-primary/world/sand-mirage-charge.png` 384×96 | 72.0px；2.25× 玩家 |
| 咆哮 `roar` | 同上，`pose='roar'` | 384×96，4 向 | `assets/01-primary/world/sand-mirage-roar.png` 384×96 | 91.2px；2.85× 玩家 |

- 渲染入口：`art-src/g3/render-g3.cjs`；固定 `INK_STUDIO` 指向 `toolchains/ink-studio`，`spriteAtlas({width:96,height:96,directions:4,times:[0],columns:4})`。
- 源元数据：`docs/revamp/g3-3d/sand-mirage-{idle,charge,roar}.json`；对照板：`docs/revamp/g3-3d/sand-mirage-board.png`。
- 图集尺寸：每张 384×96；运行时帧序 0 前 / 1 左 / 2 后 / 3 右；三姿态脚底均为 **65/96**，`originY=0.6771`。
- 来源口径：ink-studio 生成（工具 MIT，成品本项目自制）；**不是 Ninja Adventure 二次改色，也不是 image-to-image**。

### 2.3 复现

```bash
cd /home/user/Doubao/chats/38454996042111490/game-repo
INK_STUDIO=/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio \
node art-src/g3/render-g3.cjs
```

---

## 3. 数据与运行时

### 3.1 数据

`web/data/world.json` 的 `bosses` 数组新增第三项：

```json
{
  "id": "sandMirage",
  "name": "沙海蜃",
  "screen": "desert-6",
  "x": 300,
  "y": 170,
  "hp": 80,
  "dmg": 5,
  "rewardTokens": 4,
  "art": "sandMirage",
  "title": "蜃楼守沙者",
  "victoryTitle": "沙海的星火 · 已归位",
  "victoryBody": "无旗的沙海，终于散去了蜃楼。",
  "memorialText": "沙海星火 · 已归位"
}
```

- `desert-6` 清空 `props` 与 `herbs`：Boss 战中不再有沙门 / 沙棕 / 枯木盖住身体或攻击预警圈；沙门等摆件仍保留在 `desert-1..5`。
- 沙漠采集点 14 → 12；「沙海拾味」需求 5、每丛 2，仍可完成。
- Boss 站位 `x300 / y170`，玩家入场 `screen.x+150 / WORLD_Y+240`；沙海蜃 `scale 2.4`，侧向可见宽约 154px，横向不再和玩家叠在一起。

### 3.2 存档 v9

`src/systems/worldSave.js` 升 **v9**：

- `BOSS_IDS` 增加 `sandMirage`，`bosses` 默认变为 `{mossBeast,bambooMirage,sandMirage}`，值仍 `none | done`；
- v8 旧档没有 `sandMirage` 时自动补 `none`，已有两只 Boss 进度保持不变；
- 旧 v7 的 `boss:'done'` 仍迁到 `bosses.mossBeast`，`boss` 继续作为草原兼容别名；
- `patchWorldSave` 合并 `bosses`，不改其它群系计数 / 委托 / 篝火字段。

实测 v8 种子（`boss:'done' / bosses.mossBeast=done / bambooMirage=none / tokens=9`）载入即升 v9，并补 `sandMirage:none`；`desert-6` 进入后 `sandMirage` 可战、`mossBeast` 仍为 done。

### 3.3 运行时

`src/scenes/world.js` 新增：

- `BOSS_ART.sandMirage`：
  - `tex: sandMirageIdle / Charge / Roar`；
  - `origin 65/96` 三姿态；
  - `scale 2.4 / standoff 132 / swipeAt 104`；
  - `pounceGap 92 / pounceR 100 / swipeR 112 / swipeWarn 104`；
  - `shadow [142,18] / glowY 28 / labelY 100 / tint UI.world.desert / mirage true`。
- `updateBoss` 的近身分支由硬编码 `dist < 104` 改为 `dist < (B.art.swipeAt || 104)`；苔背巨兽 / 雾竹蜃不声明 `swipeAt`，保持旧行为。
- 沙海蜃专属 `mirror` 重影：
  - 与本体共用三姿态四向纹理；
  - 位置 `spr.x + 4 + sin(time/210)*2.5`、`spr.y - 1`；
  - 缩放跟随本体 ×1.03，ADD 混合，α `0.09–0.135` 缓慢呼吸；
  - `spawnBoss / setBossPose / updateBoss / retryBoss` 同步，`finishBoss` 立即隐藏。
- `finishBoss` / `showMemorial` / `retryBoss` 全部走通用多 Boss 路径，奖励 / 胜利文案读 `sandMirage` 数据。

### 3.4 战斗参数

| 参数 | 沙海蜃 | 设计理由 |
|---|---|---|
| `standoff` | 132 | 侧向体宽约 154px，站定留出玩家可见空间 |
| `swipeAt` | 104 | 玩家贴近到翼内侧时横扫，避免大体型一直扑击 |
| `pounceGap` | 92 | 落点放在玩家外侧，不整只压住玩家 |
| `pounceR` | 100 | 玩家不移动时会吃扑击；可移动躲开 |
| `swipeR / swipeWarn` | 112 / 104 | 预警圈与近身伤害半径按本 Boss 体宽拆开 |
| `shadow` | 142×18 | 与侧向体宽匹配，不出现“脚底悬空” |

实测：站桩扑击 `HP 20 → 15`；站桩横扫 `HP 20 → 15`；两种攻击都能在预警后移动躲开。

---

## 4. 本地验收

### 4.1 功能

| 项 | 结果 |
|---|---|
| 入口 | `?world=1&debug` → `applyScreen(17)`；`desert-6` 生成 `sandMirage / hp80 / dmg5 / reward4 / scale2.4 / originY0.6771` |
| 图集 | `sandMirageIdle / Charge / Roar` 均存在；idle 默认帧 `sandMirageIdle`；`mirror=true` |
| 四向 | 图集 0 前 / 1 左 / 2 后 / 3 右；站定每 1.6s 转 90°；实测 `3→0→1→2→3→0→1`，步长约 1.48–1.78s，HP 保持 20 |
| 姿态 | `intro=roar 0`；蓄力 `charge`；落地 / 死亡 `roar`；重试 `roar 0 → idle` |
| 扑击 | `pounceWindup / charge`，落点后 `HP20→15`，随后 `chase / idle` |
| 横扫 | 近距离 `swipeWindup / charge`，结算后 `HP20→15` |
| 击杀 | 真实攻击 3 伤 → `victory=true / bossDead=true / bosses.sandMirage=done / tokens=4`；本体与 mirror 均隐藏 |
| 失败 / 重试 | `HP` 归零 → `dead=true / panelOpen=true`；`retryBoss()` → `dead=false / active=true / hp20 / bossHp80` |
| 苔背 / 雾竹回归 | 960 fresh page：`field-6` 生成 `mossBeast / hp64 / pose roar / dir0`、`bamboo-6` 生成 `bambooMirage / hp72 / dir0`；两只均触发原有扑击，`errs=[]` |

### 4.2 三档与离线

- **960×540**：`docs/revamp/g3/g3-sand-turn-d0.png` ～ `d3.png`、`g3-sand-turn-board.png`、`g3-sand-turn.gif`、`g3-sand-pounce-960.png`、`g3-sand-swipe-960.png`、`g3-sand-victory-960.png`、`g3-sand-down-960.png`；`errs=[]`。
- **640×360**：`g3-sand-640.png`；逻辑 640×360，`scrollWidth=640 / clientWidth=640`；HUD 与底栏 Boss 名无溢出；`errs=[]`。
- **844×390 hasTouch**：`g3-sand-touch-844x390.png`；逻辑 779×360，`scrollWidth=844`；`touchCtl=true / touchItems=3`；提示「点按「攻」· 击败沙海蜃」；`errs=[]`。
- **单文件**：`web/game.html?world=1&debug`（`file://`）→ `__SINGLE__=true / sandMirage / hp80 / tex=sandMirageIdle / mirror=true / sw=false`；`errs=[]`。
- **PWA 断网**：SW controller → `setOffline(true)` → reload → 30 屏；再进 `desert-6` 仍 `sandMirage / hp80 / idle`；`na-b18-5ce6f0a6` / 12 条；`errs=[]`。
- **比例审计**：`python3 tools/audit_scale.py` 扩第三只 Boss → **144 实例 / 0 FAIL**；沙海蜃 idle 2.48× / charge 2.25× / roar 2.85×，在 2.2–3.3× 区间内。
- **存档迁移**：v8 种子载入即 `v=9`，`bosses={mossBeast:done,bambooMirage:none,sandMirage:none}`，`tokens=9`，进入 `desert-6` 后可战。

### 4.3 构建

| 项 | 值 |
|---|---|
| 首屏预算 | **1971 KB / gzip 824 KB**（<2 MiB） |
| 图集 | **157 切片 / 239 KB**（新增 3 张 384×96 Boss atlas） |
| 游戏逻辑 | `dist/game.1697e515.js` **331,606 B** |
| 素材数据 | `dist/assets.edb3c810.js` **124,555 B** |
| 单文件 | `web/game.html` **2,143,420 B** |
| PWA | `na-b18-5ce6f0a6` / 12 条 |
| 冒烟 | 9 项 PASS |

### 4.4 Pages 线上

- Pages 入口 `game.1697e515.js` + `assets.edb3c810.js`，PWA `na-b18-5ce6f0a6` / 12 条。
- 线上 960×540 `?world=1&debug=1`：`applyScreen(17)` 为 `sandMirage / hp80 / scale2.4109（呼吸峰值，基准 2.4） / originY0.6771 / mirror=true`；站定 `dir 2→3→0→1→2→3→0`（1.50–1.75s/步，HP20）；扑击 `HP20→15`；横扫 `HP20→15`；真实 3 伤击杀 `bossDead=true / bosses.sandMirage=done / tokens4 / 本体与 mirror 隐藏`；640 `scrollWidth=640`；844 `touchCtl=true / touchItems=3`；PWA 断网 `online=false / 30 屏 / desert-6 / sandMirage / hp80 / controller=true`；四组 `errs=[]`。
- 截图：`g3-online-sand-intro-960.png`、`g3-online-sand-idle-960.png`、`g3-online-sand-turn-d0..d3.png`、`g3-online-sand-pounce-960.png`、`g3-online-sand-swipe-960.png`、`g3-online-sand-victory-960.png`、`g3-online-sand-640.png`、`g3-online-sand-touch-844x390.png`、`g3-online-sand-pwa-offline-960.png`、`g3-online-sand-turn-board.png` / `.gif`。

---

## 5. 已知边界 / 下一步

- G3 世界 Boss 仍 **3/5**：草原苔背巨兽、竹林雾竹蜃、沙漠沙海蜃已重制；雪原 / 火山两只未做。
- `desert-6` 清空 `props / herbs` 后，沙漠采集点 14 → 12；G2 “采集点总数”口径会降 2，G2 收尾时需决定是否在远端补回。
- 四向仍是姿态切帧，不是逐帧行走；但站定每 1.6s 主动转 90°，追击 / 攻击朝玩家，满足 3D 件在场上的四向可读。
- 战斗仍是“追击 + 近身横扫 + 扑击 + 回气”；沙海蜃的差异在体型、近身阈值、蜃气重影与沙帆轮廓，没有独立多阶段 / 地形破坏。
- 沙海蜃场景只有清场 + 沙漠气候，没有专属祭坛 / 蜃楼建筑；下一轮若要“蜃景”氛围，可在 `desert-6` 加一处不挡判定的远景沙门残影。

---

## 6. 改动文件

- 新增：`art-src/g3/sand-mirage.cjs`、`docs/revamp/g3-3d/sand-mirage-{idle,charge,roar}.png/.json`、`docs/revamp/g3-3d/sand-mirage-board.png`、`assets/01-primary/world/sand-mirage-{idle,charge,roar}.png`、`docs/revamp/g3/g3-sand-*`（本地 960 / 640 / 844 / 单文件 / PWA / 失败 / 转身板 / GIF）。
- 修改：`art-src/g3/render-g3.cjs`、`web/data/world.json`、`src/systems/worldSave.js`、`src/scenes/world.js`、`tools/build.mjs`、`tools/audit_scale.py`、`assets/CREDITS.md`、`docs/ART_PIPELINE.md`、`docs/OPENWORLD.md`、`docs/ACCEPTANCE.md`、`docs/MASTERPLAN.md`、`CURRENT.md`、`LEDGER.md`、`index.html`、`sw.js`。
