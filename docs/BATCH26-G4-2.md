# 批 26 / G4-2：雾泽终局 Boss「沉灯水魇」

> 2026-11-25。G4-1 把世界扩到 36 屏 / 6 群系 / 12 委托，但 `mire-6 归水` 只是尾屏、无 Boss、无 NPC。本轮把第六群系接成真正的终局：`mire-6` 加专属 Boss、专属 `mire` 攻击、半血阶段、战斗采集点与六群系结局，并把成就扩到 24 条。
>
> **自主决策声明**：用户此前的授权是“大方向内自主决策”，本轮 Boss 名称「沉灯水魇」、叙事身份「归水守灯者」、招式「沼潮」、第 24 条成就「六火归位」及 `mire-6` 进屏即战，均为主 Agent 自主选定，尚未经用户逐项拍板；视觉与手感如有否决，按第 10 节回退。

## 1. 结论

| 项 | 结果 |
|---|---|
| Boss | `mireWraith`「沉灯水魇」，`title=归水守灯者` |
| 屏 / 坐标 | `mire-6`，`x300 / y170` |
| 数值 | `hp104 / dmg6 / rewardTokens6 / pattern=mire / speed25 / specialGap5000` |
| 造型 | ink-studio 3D 像素，96×96 四向 × `idle / charge / roar`；一盏沉在沼底的旧祠灯，被水草与断木缠成弓背灯影 |
| 专属攻击 | 沼潮：760ms 预警，3 片（半血后 4 片）冷焰水洼；半径 30、持续 2500ms、每 700ms 2 伤 |
| 半血 | `hp ≤ 52`：`rage=true`、`speed 25→30`、`specialGap 5000→3600`、沼潮 4 片 |
| 终局 | 六只世界 Boss 全 `done` 才触发「星火归途 · 远征完成」；正文改为六片群系 |
| 成就 | 新增 `world_boss_6`「六火归位」；`world_boss_5` 改为“击败 5 只世界 Boss”；成就 24 条 |
| 数据 | `web/data/world.json` **v10**、36 屏、6 Boss；`mire-6` 三个 `[...,1]` 战斗采集点 |
| 存档 | `src/systems/worldSave.js` **v13**、`BOSS_IDS` 6 个；v12 旧档只补 `mireWraith:none` |
| 美术 | `art-src/g4/mire-wraith.cjs`（seed 405）、`docs/revamp/g4-3d/mire-wraith-*.png`、运行时 3 张 PNG |
| 构建 | 首屏 **1897 KB / gzip721 KB**；图集 174 切片 / **123,265 B**；`game.8be60f73.js` 369,447 B；`assets.1b86f4c5.js` 131,938 B；单文件 2,027,136 B |
| PWA | `na-b18-b5c05acf` / 12 条；离线 probe `rejected:TypeError`，reload 仍进 `mire-6` 并启动 Boss |
| 验收 | 960 / 640 / 844 / 单文件 / PWA / 自然计时沼潮 / v12→v13 / 六 Boss 结局全通过；`smoke` 9 PASS；`audit_scale.py` **220 / 0 FAIL** |

## 2. 美术：沉灯水魇

源文件 `art-src/g4/mire-wraith.cjs`，seed 405；`art-src/g4/render-g4.cjs` 增加三姿态 spec，并让 `scene.build(seed, spec.pose)` 按姿态出图。生成 `docs/revamp/g4-3d/mire-wraith-idle.png / -charge.png / -roar.png`（384×96，四向横排），再复制为 `assets/01-primary/world/mire-wraith-*.png`。

- 正面：旧祠灯的方形灯窗 + 冷焰，灯壳被水草缠住；背面：裂开的祠脊与拖尾水草。
- 姿态：`idle` 弓背低头、`charge` 灯窗收束、`roar` 灯窗张开；四向帧序仍为 0 前 / 1 左 / 2 后 / 3 右。
- 暗色灯影在雾泽地皮上原本偏黑；后一轮把 body palette 的 P2–P5 提亮为 `0x1b2f24 / 0x2c4937 / 0x3e5b45 / 0x5d7b5e`，重新渲染并替换运行时帧。
- `BOSS_ART.mireWraith`：`scale 1.48 / standoff 108 / swipeAt 96 / origin 78/96 / shadow [84,15] / glowY 30 / labelY 106`。
- 审计：`tools/audit_scale.py` 中 `mireWraith` 三姿态 **3.0–3.29×**，不超出 2.2–3.3 区间。

## 3. 数据与存档

`web/data/world.json` 升 **v10**：`bosses` 从 5 增至 6，`mireWraith` 为第 6 项：

```json
{
  "id": "mireWraith", "screen": "mire-6", "x": 300, "y": 170,
  "name": "沉灯水魇", "title": "归水守灯者",
  "hp": 104, "dmg": 6, "rewardTokens": 6,
  "pattern": "mire", "speed": 25, "specialGap": 5000
}
```

`mire-6` 原有 3 个普通灯芯草采集点改为战斗采集点：

```json
"herbs": [[150,226,1],[330,208,1],[430,214,1]]
```

`mire-6` 仍无 NPC；`props` 保留 `mireShrine / mireReed / mireArch / mireDeadTree / mireBush`，`pools` 保留两组视觉水洼。Boss 战期间不读条、按 E 立即 `+2 HP`、45s 重生；这条链路单独实测 `hp10→12 / active=false / battle=true`。

`src/systems/worldSave.js` 升 **v13**：

- `BOSS_IDS = ['mossBeast','bambooMirage','sandMirage','frostOwl','magmaColossus','mireWraith']`
- `defaults / migrate / patchWorldSave` 三处自动补 `mireWraith:'none'`
- v12 旧档迁移实测：`v=13`，其余 5 只保留 `done`，只新增 `mireWraith:'none'`；`visited / herbs / tokens` 不动。

## 4. 运行时

### 4.1 专属场景

- `buildBossEdge(screen)` 增加 `mire` 分支：复用 `mireTile`、水面 ellipse、`mireReed`、`desertArch` tint、`mireShrine`、`desertDeadTree`、绿色光点与 `mireVeil` haze；`mire-6` 不再落入默认沙漠补景。实测 `bossEdge` 中 `desertTile` 数量为 **0**。
- `buildBossArena(screen)` 增加 `mire` 分支：三块浅水、湿泥岸、断苇、低层绿光；不挡走位，深度 2.4–3.4。
- `world.js` 的 Boss `pattern` 白名单加入 `'mire'`。这是本轮抓到的关键 bug：此前只允许 `frost / magma`，新 Boss 的 `pattern` 被清零，专属攻击与半血阶段都不触发；修复后实测 `pattern='mire'`。

### 4.2 沼潮与半血

- `startMireTide()`：760ms 预警；普通 3 片、`rage` 4 片；落点围绕玩家 ±72/±64/±2/±6，夹在 Boss arena 内；预警圈为 `UI.world.mireGlow`，不是通用红圈。
- `resolveMireTide()`：落地生成半径 30、`end=2500ms`、`dmg2`、`tick700` 的冷焰水洼；保留断苇剪影；`bossImpact` 与轻震屏。
- `updateBossHazards` 读取 `h.dmg || 2` 与 `h.tick || 650`，所以雾泽水洼是 2 伤 / 700ms，旧火山熔渣仍为 2 伤 / 650ms。
- `clearBossHazards` 同步清理 `B.tide`，死亡重试 / 胜利 / 离屏都不会留预警圈。
- `maybeMireRage()`：`hp ≤ maxHp*0.5`（104→52）触发一次；`rage=true`、`speed += 5`（25→30）、`specialGap=3600`；同时把下一次专属攻击提前到 `now + 900ms`，避免半血后等太久。
- 伤害路径 `damageBoss` 与每帧 `updateBoss` 调用同一入口；`B.hp <= 0` 时直接返回，不让“击杀瞬间”误触半血横幅。
- `startBossFight` 每次重置 `rage / speed / specialGap`；`retryBoss` 同样重置，避免死亡重试继承二阶段速度。
- `finishBoss` 仍使用 `this.world.bosses.every(...)`，现在必须 6 只全 `done`；`showVictory` 终局正文改为“六片群系的星火重新连成一线，归途在火心尽头亮起。”；`mireWraith` 单独胜利文案为“雾泽的星火 · 已归位”。

### 4.3 自动专属攻击调度修复

初版 `updateBoss` 在**每次普通攻击 recover** 时都执行 `B.specialAt = now + specialGap`。只要普通扑 / 扫循环短于 `specialGap`，专属攻击的计时就会被无限后推；自然计时测试中 Boss 一直只出普通招，直到用 `startMireTide()` 直接调用才看见沼潮。

修复：

- `recover` 不再重置 `specialAt`；
- `resolveFrostVolley / resolveMagmaEruption / resolveMireTide` 结束各自把 `specialAt` 推到 `now + specialGap`；
- 半血 `maybeMireRage` 把 `specialAt` 夹到 `now + 900ms`；
- 普通攻击之间只保留一次已排定的专属窗口。

验证：`mireWraith` 自然计时在开战约 3.6s 后的第一个窗口（场景时间约 5.5s）进入 `mireWindup`，3 片沼潮、`tide3`，随后 `hazards3 / dmg2 / tick700`；`frostOwl / magmaColossus` 回归也各自自然触发 `frostWindup / volley3` 与 `magmaWindup / erupt3`，说明调度修复没有只对雾泽生效。

## 5. 终局与成就

- `world_boss_6`「六火归位」，goal 6；`world_boss_5` 描述改为“击败 5 只世界 Boss”；成就总数 **24**。
- `src/systems/ach.js` 的 Hall 成就页仍是 4 列 × 6 行，正好容纳 24 条，不需要改布局。
- 六只全 `done` 时 `showVictory` 的标题为 `星火归途 · 远征完成`，正文为六片群系；按钮「回到小屋」；新成就行会列出本次跨过的远征条目（测试档缺 4 条，实际存档按已有进度只列新增）。
- `mireWraith` 单只胜利文案“雾泽的星火 · 已归位”，奖励 `+6` 星火碎片。

## 6. 构建与预算

第一次加入 3 张 Boss 切片后，首屏 **2064 KB / gzip881 KB**，超过 2 MB 上限。处理方式是 `tools/pack_atlas.py` 在超过 256 色时用 `Image.FASTOCTREE` 量化为 256 色调色板：

- `web/atlas/core.png`：**294,325 B → 123,265 B**（最终构建；早期记录 123,166 B 为同轮中间值）
- 首屏 **1897 KB / gzip721 KB**
- 图集 **174 切片**；`audit_scale.py` **220 实例 / 0 FAIL**
- 量化前后视觉对比：平均 RGB 差 **1.4**、平均 alpha 差 **0.125**、最大 alpha 差 **49**；截图观感几乎一致
- 这是**有损压缩**，如果用户视觉验收否决，回退 `pack_atlas.py` 并另找预算方案（例如拆 atlas 或压缩其他首屏资源），不要把量化版当成无损。

最终构建：

| 文件 | 字节 |
|---|---|
| `dist/game.8be60f73.js` | 369,447 B |
| `dist/assets.1b86f4c5.js` | 131,938 B |
| `web/game.html` | 2,027,136 B |
| `web/atlas/core.png` | 123,265 B |
| `web/fonts/game.woff2` | 133,768 B |
| `web/vendor/phaser.min.js` | 1,181,917 B |
| `sw.js` | `na-b18-b5c05acf` / 12 条 |

## 7. 验收

### 7.1 核心流程（960×540，最终构建）

| 项 | 结果 |
|---|---|
| v12→v13 | `v=13`、`mireWraith='none'`、其余 5 只 `done`、36 屏、6 Boss、`mire-6` 三个 `[...,1]` |
| Boss intro | `active=true / state=chase / hp=104 / name=沉灯水魇 / desertTile=0 / bossHazards=0` |
| 沼潮（直接触发） | `tide=3`；落地 `hazards=3 / dmg=2 / tick=700`；玩家 `HP20→18` |
| 自然计时沼潮 | 开战约 3.6s 后的第一个窗口进入 `mireWindup`，`tide=3`；resolve 后 `hazards=3` |
| 半血 | `hp55→50` 后 `rage=true / speed=30 / gap=3600 / tide=4 / hazards=4` |
| 战斗采集 | `hp10→12 / active=false / battle=true` |
| 胜利 | `allDone=true`、6 只全 `done`、`tokens20→26`、`v=13`；标题 `星火归途 · 远征完成`、正文六片群系 |
| 终局面板 | `newAch` 列出四条（测试档原本缺远征成就）；不代表真实存档会一次全弹 |

### 7.2 视口 / 单文件 / PWA

| 档 | 结果 |
|---|---|
| 960×540 | 960 画面、Boss 与 HUD 正常；截图 `g4-mire6-boss-intro-960.png` 等 |
| 640×360 | `scrollWidth=640 / clientWidth=640 / canvas640×360 / active=true / touchItems=0` |
| 844×390 hasTouch | `scrollWidth=844 / canvas779×360 / active=true / touchItems=3 / labels=['攻','E','返']` |
| 单文件 | `__SINGLE__=true / screen=mire-6 / 36 屏 / v=13 / Boss active / errs=[]` |
| PWA | `sw=na-b18-b5c05acf`、controller=true；`set_offline(true)` 后外部 `fetch` probe `rejected:TypeError`；离线 reload 仍进 `mire-6` 并启动 `mireWraith`；console 仅预期 `ERR_INTERNET_DISCONNECTED`，无应用异常 |

> PWA 注记：无头 Chromium 的 `navigator.onLine` 在 `set_offline(true)` 后仍显示 `true`，因此不以它作为断网判据；以外部 fetch 被拒 (`TypeError`) + 离线 reload 仍进入世界并启动 Boss 作为有效证据。

### 7.3 构建 / 冒烟 / 比例

- `npm run build:single` 首屏 **1897 KB / gzip721 KB**，图集 **174 切片**。
- `npm run smoke` **9 PASS**。
- `python3 tools/audit_scale.py` **220 实例 / 0 FAIL**。

## 8. 证据

本地：

- `docs/revamp/g4-2/g4-mire6-boss-intro-960.png`
- `.../g4-mire-tide-warn-960.png`
- `.../g4-mire-tide-pools-960.png`
- `.../g4-mire-phase2-warn-960.png`
- `.../g4-mire-victory-960.png`
- `.../g4-mire-boss-640.png`
- `.../g4-mire-boss-844.png`
- `.../g4-mire-boss-single-960.png`
- `.../g4-mire-boss-pwa-960.png`

线上：

- `docs/revamp/g4-2/g4-online-mire-boss-intro-960.png`
- `.../g4-online-mire-tide-warn-960.png`
- `.../g4-online-mire-victory-960.png`
- `.../g4-online-mire-boss-640.png`
- `.../g4-online-mire-boss-844.png`
- `.../g4-online-mire-boss-pwa-960.png`

美术：

- `docs/revamp/g4-3d/mire-wraith-idle.png` / `-charge.png` / `-roar.png`（384×96，4 帧横排）
- 同名 `.json` 元数据
- 运行时 `assets/01-primary/world/mire-wraith-*.png`

## 9. 改动文件

- `src/scenes/world.js`：`mireWraith` BOSS_ART、`mire` pattern / 沼潮 / 半血、mire edge / arena、终局六群系正文、自动 special 调度修复、retry / hp0 守卫
- `src/systems/worldSave.js`：v13、6 BOSS_IDS
- `src/systems/ach.js`：`world_boss_6`、`world_boss_5` 描述
- `web/data/world.json`：v10、第 6 只 Boss、`mire-6` 战斗采集点
- `tools/build.mjs`：`mireWraith*` 3 个 asset / FRAME
- `tools/audit_scale.py`：`mireWraith` 配置
- `tools/pack_atlas.py`：>256 色时 FASTOCTREE 量化
- `art-src/g4/mire-wraith.cjs`、`art-src/g4/render-g4.cjs`
- 文档：`docs/BATCH26-G4-2.md`、`ACCEPTANCE.md`、`LEDGER.md`、`CURRENT.md`、`docs/OPENWORLD.md`、`docs/MASTERPLAN.md`、`docs/ART_PIPELINE.md`、`assets/CREDITS.md`、`docs/BATCH26-G4-1.md` 基线注记

## 10. 未决 / 风险 / 回退

| 项 | 现状 | 回退 |
|---|---|---|
| 名称 / 招式 / 成就 | 自主选定，未逐项拍板 | 改名只动 `world.json` / `ach.js` 文案；招式改 `startMireTide` 参数；成就改 `world_boss_6` |
| 256 色量化 | 有损；视觉差已量 | 回退 `pack_atlas.py`，另拆 atlas 或压其他首屏资源 |
| Boss 体型 | 审计 3.0–3.29×，在区间内 | 调 `BOSS_ART.mireWraith.scale`，重跑 audit |
| `mire-6` 无 NPC、进屏即战 | 当前设计 | 加 Boss 前 NPC / 剧情需要新数据字段与对话层，不在本轮 |
| 3 个战斗采集点 | 已验回血 | 改 `mire-6.herbs` 或删点即可 |
| 自动 special 调度 | 已修，雾泽 / 霜鸮 / 熔像自然触发均过 | 回退需恢复 `recover` 的 `specialAt` 重排；不建议，会复现专属攻击饿死 |

## 11. 提交与 Pages

- 代码 / 构建 / 本地截图 / 文档提交 **`cef57e3`**，推送 `6878312..cef57e3` 到 `origin/main`；线上截图随 Pages 回填提交。
- Pages 入口 **`game.8be60f73.js` + `assets.1b86f4c5.js`**，PWA **`na-b18-b5c05acf` / 12 条**。
- 线上 960 / 640 / 844 / PWA 均验：`worldBosses6 / screens36 / save.v13`；Boss intro `desertTile0`；沼潮 `tide3→hazards3/dmg2/tick700`；胜利 `allDone / tokens26 / ach`；640 `scrollWidth640`；844 `touchItems3 / canvas779×360`；PWA `probe=rejected:TypeError`、离线 reload `mire-6 / mireWraith`。详见 `LEDGER` 第 94 条与 `ACCEPTANCE` W-133。
