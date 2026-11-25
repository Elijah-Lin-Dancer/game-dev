# 批 26 / G4-3：终局闭环「归水灯 · 星火重燃」

> 2026-11-26。G4-2 已经把六群系收束到 `mire-6` 的「沉灯水魇」，但最后一屏仍是“进屏即战”，打完只能回小屋；六只 Boss 的进度也变成一次性消耗品。本轮不再加采集量，只补终局体验的两个缺口：**Boss 前的最后一道仪式**，和**打完之后的下一轮远征**。
>
> **自主决策声明**：用户此轮只说“继续吧”，没有指定新批次。按此前“大方向内自主决策”的授权，本轮把范围定为 G4-3 终局闭环；「归水灯」「星火重燃」「远征周目」的名称、数值与交互均为主 Agent 自主选定，尚未经用户逐项视觉验收。若否决，按第 10 节回退。

## 1. 结论

| 项 | 结果 |
|---|---|
| 归水灯 | `mireWraith.bossGate = { x:250, y:246, prompt:"E 点燃归水灯", hint:"归水灯未燃 · 沉灯水魇还在水底" }`；进入 `mire-6` 不再自动开战 |
| 灯前表现 | 沉祠前生成冷焰、光晕、光圈与「归水灯」标签；Boss 本体隐藏，`bossActive=false`；靠近 54px 显示 E 提示 |
| 点燃 | E 清除 gate 后调用 `startBossFight`；战斗开始不再残留 gate |
| 星火重燃 | 六 Boss 全 done 时，终局面板增加第二个按钮；篝火传送面板也追加「星火重燃」行，避免先回小屋后无法再进周目 |
| 周目 | `expedition` 默认 1，重燃 +1（上限 99）；Boss `maxHp = round(def.hp * (1 + 0.12 * (tier - 1)))`，`dmg = def.dmg + floor((tier - 1) / 2)`，第 1 周目保持原数值 |
| 重置范围 | 只重置六 Boss 与 `boss` 兼容别名；`tokens / visited / herbs / 12 委托 / 24 成就` 保留 |
| 数据 / 存档 | `world.json` 仍为 **v10**（只加 `bossGate` 字段）；`na.world` 升 **v14**，v13 旧档补 `expedition:1` |
| 美术 | **无新增图集切片**；灯复用 `aura` 与 `mireShrine` 沉祠，Boss 仍用 G4-2 的 `mire-wraith-*` |
| 成就 | 仍是 **24 条**，本轮不新增「重燃」成就 |

## 2. 归水灯：Boss 前不再进屏即战

### 2.1 数据

`mireWraith` 在 `web/data/world.json` 中新增：

```json
"bossGate": {
  "x": 250,
  "y": 246,
  "prompt": "E 点燃归水灯",
  "hint": "归水灯未燃 · 沉灯水魇还在水底"
}
```

实际世界坐标为 `x = screen.x + 250 = 17050`、`y = WORLD_Y + 246 = 290`。`mire-6` 的三个战斗采集点仍是 G4-2 的 `[150,226,1] / [330,208,1] / [430,214,1]`，灯燃后才按战斗规则生效。

### 2.2 运行时链路

```
applyScreen(35)
  → enterBossScreen(mireWraith)
    → spawnBoss(mireWraith)          // 先创建 Boss 对象，但保持隐藏
    → def.bossGate ? buildBossGate() // 画灯、清 bossActive
    → return                         // 不调用 startBossFight
  → onAction() / E
    → bossGate && dist <= 54
      → lightBossGate()
        → clearBossGate()
        → startBossFight()
```

- `spawnBoss` 仍按原逻辑创建 Boss、缩放数值、设置 `bossActive=false`；`buildBossGate` 再把 `spr / mirror / glow / shadow / ring / label` 隐藏。
- `buildBossGate` 在沉祠前生成 `aura`、椭圆光圈、冷焰、冷焰光晕、`归水灯` 标签与 E 提示；标签在 `y-94`、冷焰在 `y-61`、提示在 `y-44`。
- `onAction` 把 gate 判断放在 `bossActive` 之前；`updatePrompts` 与 `hudHintText` 同样优先走 gate 分支，避免灯前显示“攻击”或战斗提示。
- `startBossFight` 自身也调用 `clearBossGate()`，即使从重试或非正常路径进入战斗，也不会留下灯的残留。
- `mire-6` 仍**没有 NPC**；归水灯是一个静态交互物，不是人物。G4-2 的“无 NPC”现状没有被本轮改变。

## 3. 星火重燃与远征周目

### 3.1 终局面板

六 Boss 全 done 时，`finishBoss` 调用 `showVictory(reward, allDone, newAch)`，面板：

- 高度 **218**（普通胜利仍 184）；
- 按钮区底板高 **74**；
- 两个按钮：
  1. `回到小屋` → `leave()`
  2. `星火重燃 · 第 N 次远征` → `rekindleExpedition()`

N 是 `min(99, 当前 expedition + 1)`，所以第 1 周目通关时显示「第 2 次远征」。

### 3.2 篝火入口

`openTravel()` 在 `allDone` 时多渲染一行：

- 6 行篝火 + 1 行「星火重燃 · 第 N 次远征」+ 1 行「留在原地」= **8 行**；
- 面板高度 `70 + 6*30 + 34 + 34 = 318`；
- 点击走 `closePanel()` → `rekindleExpedition(true)`，与终局面板走同一个方法。

这样玩家即使先点了「回到小屋」，仍能从任意篝火重新开周目。

### 3.3 重置语义

`rekindleWorldSave()` 通过 `patchWorldSave` 写入：

```js
{
  bosses: bossDefaults(),   // 六只全部 none
  boss: 'none',             // 草原兼容别名
  expedition: min(99, max(1, 当前 expedition) + 1)
}
```

保留：

- `tokens`；
- `visited`；
- `herbs / mireHerbs` 等采集计数；
- 12 条委托状态；
- `ach`（成就永久点亮）。

`rekindleExpedition(allowOutsideVictory=false)` 只允许在终局面板（`this.victory`）或显式 `true` 的篝火入口执行；它会销毁 Boss、memorial、Boss edge、hazards、mobs、modal，回到 `field-1` 起点，重置 HP，重建场景，显示「星火重燃 · 第 2 次远征」横幅与「六盏星火重新落回群系 · 这次它们记得你」toast。

### 3.4 周目数值

`spawnBoss` 读取 `save.expedition`：

```js
tier = clamp(1..99, save.expedition)
maxHp = Math.round(def.hp * (1 + 0.12 * (tier - 1)))
dmg   = def.dmg + Math.floor((tier - 1) / 2)
```

第 1 周目：

- `mireWraith` 仍是 `hp104 / dmg6`；
- 草原苔背巨兽仍是 `hp64 / dmg4`。

第 2 周目：

- `mireWraith` gate 仍是 `maxHp116 / dmg6`；
- 草原苔背巨兽 `maxHp72 / dmg4`。

伤害直到第 3 周目才 `+1`，这是有意把前期周目压力放在血量而非秒杀上；更高周目与奖励曲线尚未实测，见第 10 节。

HUD 在 `cycle > 1` 时显示「远征 · 归水 · 周目 2」；`retryBoss` 继续复用已经缩放的 `maxHp`，不会退回基础值。

## 4. 本轮唯一的真实运行时 bug

`normalizeWorld` 原来的 Boss 归一化白名单没有 `bossGate`。数据里虽然写了 gate，归一化时会被丢掉，导致：

- 首次测试 gate 不存在；
- `enterBossScreen` 看不到 `def.bossGate`；
- Boss 仍然自动开战。

修复：

- 新增 `normalizeBossGate(raw)`，校验 `x / y` 为有限数字、`prompt / hint` 为字符串；
- 在 Boss 归一化对象里写入 `bossGate: normalizeBossGate(b.bossGate)`。

这是本轮唯一影响运行时的代码 bug；其余改动均为新功能接入。

## 5. 数据 / 存档

| 文件 | 变化 |
|---|---|
| `web/data/world.json` | 版本仍 10；`mireWraith` 增加 `bossGate`；36 屏 / 6 Boss 不变 |
| `src/systems/worldSave.js` | 版本 14；`defaults.expedition=1`；migrate / patch 限制 1–99；导出 `rekindleWorldSave()` |
| `src/scenes/world.js` | `normalizeBossGate / buildBossGate / clearBossGate / lightBossGate / rekindleExpedition`；`enterBossScreen / onAction / updatePrompts / hudHintText / startBossFight / openTravel / showVictory` 接入；`spawnBoss` 周目缩放 |

`world.json` 没有升版本，因为 `bossGate` 是可选字段，旧运行时会忽略，新运行时通过 `normalizeBossGate` 读取；真正需要迁移的是 `na.world` 的 `expedition`，所以存档升 v14。

## 6. 验收

### 6.1 主测试 `/tmp/g43.py`：18/18 PASS

| 项 | 结果 |
|---|---|
| v13→v14 | `v=14 / expedition=1`；5 只 Boss 进度保留，`mireWraith=none` |
| `mire-6` gate | gate 存在；`screen=35 / bossActive=false / boss.visible=false / state=idle` |
| 靠近提示 | 玩家站到灯前，`gate.prompt.visible=true` |
| E 点燃 | `bossActive=true / gate=null / boss.visible=true`；`maxHp=104 / tier=1` |
| 终局面板 | `victory=true / rows=2 / fillH=74` |
| 星火重燃 | `expedition=2 / screen=0 / victory=false`；六 Boss 全 `none`；`tokens=26` 保留 |
| HUD | 含「周目 2」 |
| 周目 2 草原 Boss | `maxHp=72 / dmg=4 / tier=2` |
| 640 | `scrollWidth=640 / canvas 640×360` |
| 844 触屏 | `touchCtl=true / gate.prompt=true / canvas 779×360` |

### 6.2 补充测试

| 脚本 / 项 | 结果 |
|---|---|
| `/tmp/g43-gate-tier2.py` | 第 2 周目 `mire-6` gate：`maxHp=116 / dmg=6 / tier=2 / visible=false`；E 后 `active=true / gate=null`；HUD「远征 · 归水 · 周目 2」 |
| 同上 / 640 篝火全 done | 8 行、含「星火重燃 · 第 2 次远征」；`scrollWidth=640`；截图 `g4-3-travel-640.png` 无溢出 |
| `/tmp/g43-extra.py` | 7/8；唯一 FAIL 是测试档把 `tokens=20` 误期望成 26，不是产品缺陷。travel 8 行 / 单文件 gate / PWA 离线 gate 均通过 |
| `/tmp/g43-tide.py` | 强制沼潮路径：`state=mireWindup / tide=3`；落地 `state=recover / hazards=3 / dmg=2 / tick=700`。自然计时下的完整 special 本轮未长跑；G4-2 已验证自然窗口，本轮只确认 gate 后的强制路径 |
| `npm run smoke` | 9 PASS |
| `tools/audit_scale.py` | 220 实例 / 0 FAIL |
| 单文件 | `__SINGLE__=true`；`mire-6` gate 存在；E 可唤醒 |
| PWA | `controller=true`；`set_offline(true)` 后 reload 仍 `mire-6`，gate 存在且 `bossActive=false` |

证据见 `docs/revamp/g4-3/`：

- `g4-3-gate-960.png`、`g4-3-gate-640.png`、`g4-3-gate-844.png`；
- `g4-3-tier2-gate-960.png`；
- `g4-3-boss-intro-960.png`、`g4-3-mire-tide-960.png`；
- `g4-3-finale-960.png`、`g4-3-rekindle-960.png`、`g4-3-tier2-960.png`；
- `g4-3-travel-960.png`、`g4-3-travel-rekindle-960.png`、`g4-3-travel-640.png`；
- `g4-3-single-960.png`、`g4-3-pwa-960.png`。

线上证据见 `docs/revamp/g4-3/`：

- `g4-online-mire-gate-960.png`、`g4-online-mire-boss-960.png`、`g4-online-mire-finale-960.png`、`g4-online-mire-rekindle-960.png`；
- `g4-online-mire-travel-960.png`、`g4-online-mire-640.png`、`g4-online-mire-844.png`、`g4-online-mire-pwa-960.png`。

## 7. 构建

| 项 | 值 |
|---|---|
| 首屏预算 | **1902 KB / 2.00 MB（gzip 723 KB）** |
| 图集 | `web/atlas/core.png` **120 KB / 174 切片**；本轮无新增切片 |
| 入口 | `dist/game.c7d2c0ba.js` **374,292 B** + `dist/assets.8c75570a.js` **132,049 B** |
| 单文件 | `web/game.html` **2,032,200 B（1985 KB）** |
| PWA | `sw.js` cache **`na-b18-9cf996b0`** / 12 条 |
| 字体 | `web/fonts/game.woff2` **133,868 B**（构建重生成，随代码提交） |
| 构建命令 | `npm run build -- --single` |

## 8. 改动文件

- `src/scenes/world.js`：gate、rekindle、周目缩放、旅行入口、终局面板；
- `src/systems/worldSave.js`：v14、`expedition`、`rekindleWorldSave`；
- `web/data/world.json`：`mireWraith.bossGate`；
- 构建：`dist/game.c7d2c0ba.js`、`dist/assets.8c75570a.js`、`index.html`、`sw.js`、`web/game.html`、`web/fonts/game.woff2`；
- 文档：本文件、`docs/ACCEPTANCE.md`、`LEDGER.md`、`CURRENT.md`、`docs/OPENWORLD.md`、`docs/MASTERPLAN.md`、`docs/BATCH26-G4-2.md` 基线注记；
- 截图：`docs/revamp/g4-3/` 本地 14 张 + 线上 8 张（共 22 张）。

## 9. 未决 / 风险 / 回退

| 项 | 现状 | 回退 |
|---|---|---|
| 名称 / 叙事 | 「归水灯」「星火重燃」为主 Agent 自主命名 | 只改 `world.json` 的 `bossGate.prompt/hint` 与 UI 文案 |
| 灯不是 NPC | `mire-6` 仍无 NPC，灯是静态交互物 | 要 NPC 需新增人物数据 / 对话 / 动作，不在本轮 |
| 周目缩放 | 只验 tier2；更高周目、奖励曲线未验 | 改 `spawnBoss` 的 0.12 / 每 2 周目 +1 公式即可 |
| 重燃确认 | 点击即重置，没有二次确认弹窗 | 在 `rekindleExpedition` 前加 `confirm` 面板；注意触屏 |
| 重置范围 | 只重置六 Boss，保留委托 / 采集 / 成就 | 若要重置更多，改 `rekindleWorldSave` 的 patch |
| 战斗采集点 | 灯燃后仍按 G4-2 战斗规则生效 | 改 `mire-6.herbs` 或删点 |
| 沼潮自然窗口 | 本轮未完整长跑，只验强制路径 | 无代码改动；G4-2 自然窗口已验证，风险低 |
| 256 色图集 | 有损，未视觉验收（G4-2 遗留） | 回退 `pack_atlas.py` 或另拆 atlas |
| 844 灯提示 | 靠近右侧「返」按钮，无溢出但视觉距离偏近 | 调 gate 标签 / 提示 x 或 844 专用偏移 |

## 10. 回退方式

- **只回退归水灯**：删 `world.json` 的 `mireWraith.bossGate`；`enterBossScreen` 会自动回到“进屏即战”。
- **只回退星火重燃**：把终局面板第二按钮与 `openTravel` 的 allDone 行去掉；`worldSave` v14 的 `expedition` 可保留，不影响第 1 周目。
- **整体回退**：恢复 G4-2 的 `game.8be60f73.js + assets.1b86f4c5.js` / `na.world v13`；`world.json` 删除 `bossGate` 即可回到旧行为。

## 11. 提交与 Pages

- 代码 / 构建 / 本地证据 / 文档提交 **`433afe6`**，推送 `35bcaed..433afe6` 到 `origin/main`。
- Pages 入口 **`game.c7d2c0ba.js` + `assets.8c75570a.js`**，PWA **`na-b18-9cf996b0` / 12 条**。
- 线上 `web/data/world.json` **v10 / 36 屏 / 6 Boss**，`mireWraith.bossGate {250,246 / E 点燃归水灯}`。
- 960：v13→v14 / `expedition=1`；`mire-6` gate 存在，Boss `visible=false / state=idle`；近灯 prompt 可见；E 后 `active=true / gate=null / maxHp=104 / tier=1`；击杀后终局面板 `rows=2 / fillH=74`；重燃 `expedition=2 / screen=0 / 六 Boss none / tokens=26`，HUD「远征 · 村口 · 周目 2」。
- 640 `scrollWidth=640 / canvas640×360`；844×390 `touchCtl=true / canvas779×360`，gate 正常。
- allDone 篝火面板 8 行，含「星火重燃 · 第 2 次远征」，无溢出。
- PWA controller `activated`，`set_offline(true)` 外部 fetch `rejected:TypeError`，离线 reload 仍 `mire-6`，gate 存在且 `bossActive=false`。
- 线上截图：`g4-online-mire-gate-960.png`、`g4-online-mire-boss-960.png`、`g4-online-mire-finale-960.png`、`g4-online-mire-rekindle-960.png`、`g4-online-mire-travel-960.png`、`g4-online-mire-640.png`、`g4-online-mire-844.png`、`g4-online-mire-pwa-960.png`。
