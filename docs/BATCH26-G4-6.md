# 批 26 · G4-6 守灯人的长明芯 · 阿烬的委托

## 1. 结论

G4-6 把 G4-5 的纯对话 NPC「守灯人 阿烬」接成一条一次性小委托：`mire-6` 的沉灯水魇退去后，她会请玩家再采 **3 束灯芯草**，搓一根「长明芯」；交付后归水灯的纪念标牌从「雾泽星火 · 已归位」变成「归水灯 · 长明」，奖励 **4 枚星火碎片**。

当前为 **36 屏 / 6 群系 / 13 委托 / 6 Boss / 24 成就 / 7 NPC**。`world.json` 升 **v11**，`na.world` 升 **v15**，新增 `lampQuest`（none / active / done）。无新增美术、无新增成就、无新增屏、无新增 Boss；阿烬继续复用 `mireKeeper` + `flipX`。

## 2. 行为合同

| 场景 | 入口 | 期望 |
|---|---|---|
| 灯前 / 水魇未退 | `mire-6`，靠近阿烬按 E | 四组原有状态对话；`lampQuest` 保持 none，不接受委托 |
| 水魇已退，未接长明芯 | 同上 | 出现「水魇退了，归水灯不再沉。」/「可灯里还缺一根长明芯。」/「再采三束灯芯草，我给它收尾。」；对话结束写 `lampQuest='active'` |
| 六 Boss 全 done，未接 | 同上 | 仍先提示六灯全亮与星火重燃代价，再提出长明芯；不覆盖重燃警示 |
| 已接，采集不足 3 束 | 同上 | 「长明芯还差 N 束灯芯草。」；HUD 在 `mire-6` 显示「长明芯 N/3 · 采集」 |
| 采集达到 3 束 | 归水灯旁再次按 E | 打开「委托 · 守灯人的长明芯」面板，显示 `交付 3 束灯芯草 / 再等等` |
| 交付 | 面板第一行 | 扣 3 束 `mireHerbs`，`lampQuest='done'`，`tokens +4`；HUD「长明芯 · 已完成」，纪念标牌「归水灯 · 长明」 |
| 重燃 | 终局 / 篝火 | `lampQuest='done'` 与已完成状态保留；只重置六 Boss 与周目 |
| 关闭对话 / 移动 / ESC | 任意状态 | 无面板残留；采集、对话、gate、Boss 互不串扰 |

## 3. 实现

- `src/scenes/world.js`
  - `QUEST_PROFILE.lamp`：`biome=mire / questDef=lampQuest / questSave=lampQuest / herbSave=mireHerbs / item=灯芯草 / unit=束 / npcAsset=mireKeeper / scale0.95 / flipX` 由 NPC 数据控制。
  - `interactNpc()` 的 `role==='lampkeeper'` 分支改调 `lampkeeperTalk()`；不再只读一段纯对话。
  - `lampkeeperTalk()` 按 `mireWraith done / lampQuest / mireHerbs / allDone / expedition` 分流：灯前对话、委托 offer、采集进度、交付面板、完成对话。
  - `completeGather()` 在雾泽节点补一条 `lampQuest active && mireHerbs >= need` 的「长明芯够了 · 回归水灯找阿烬」toast。
  - `updateHud()` 在 `s.id==='mire-6'` 时优先显示长明芯状态；`hudHintText()` 在 `mire-6` 显示「还差 N 束」或「找阿烬交付」。
  - `deliverQuest()` 增 `lamp` 完成台词；交付后即时把纪念标牌改成「归水灯 · 长明」。
  - `showMemorial()` 在 `mireWraith` + `lampQuest done` 时使用「归水灯 · 长明」。
- `web/data/world.json`
  - `version` 10→11；新增 `lampQuest { id:'lampCore3', name:'守灯人的长明芯', npc:'mireLampkeeper', need:3, yield:1, rewardTokens:4 }`。
  - `mire-6` 的 NPC `quest` 从 `mire` 改为 `lamp`；位置仍 `110/190`，`role=lampkeeper`，`flipX=true`。
- `src/systems/worldSave.js`
  - `VERSION` 14→15；defaults / migrate / patch 增 `lampQuest:'none'`，v14 旧档补 none，其余字段保留。
- 未改动：图集、Boss 数据、成就数据、Hall 成就页（仍 24 条）；`sw` 只随构建哈希更新。

## 4. 实测

| 项 | 结果 |
|---|---|
| 委托前置 | 灯前 `lampQuest=none`，按 E 不写档；`mireWraith none` 时不会出现长明芯 offer |
| offer / 接受 | 六 Boss 全 done 时 offer 含「六盏灯都亮了」+「长明芯」+「星火重燃」；对话完 `lampQuest=active` |
| 采集 / 面板 | `mireHerbs=3` 时按 E 打开 `panel stage1 / rows2`；640 `scrollWidth=640`，无溢出 |
| 交付 | `lampQuest=done / tokens20→24 / mireHerbs3→0`；完成台词「长明芯够了。」；标牌「归水灯 · 长明」 |
| 采集提示 | 雾泽节点采集 `mireHerbs2→4`，toast「长明芯够了 · 回归水灯找阿烬」 |
| 重燃 | `rekindleExpedition` 后 `exp1→2`、六 Boss 全 none，`lampQuest` 仍 done |
| 旧档 | v14→v15，`lampQuest` 补 none；原 `mireHerbs / mireQuest / mireQuest2 / bosses / tokens` 保留 |
| 单文件 / PWA | 单文件 offer 可用；PWA `na-b18-fef5cd06` 断网 reload 后 NPC/offer 可用；`errs=[]` |

测试脚本：`/tmp/g46.py` **26/26**、`/tmp/g46-reg.py` **8/8**；G4-5 回归 `/tmp/g45.py` **15/15**；采集提示脚本 PASS；重燃保留脚本 PASS；`npm run smoke` 9 PASS；`audit_scale.py` **221 INSTANCES / 0 FAIL**。

## 5. 构建

- 首屏 **1909 KB / 2.00 MB（gzip 724 KB）**
- `dist/game.55b9c15d.js` **381,646 B**
- `dist/assets.ccf47434.js` **132,279 B**
- 单文件 `web/game.html` **2,039,656 B**
- `web/fonts/game.woff2` **133,772 B**
- 图集 `web/atlas/core.png` **123,265 B / 174 切片（无新增）**
- PWA `sw.js` **`na-b18-fef5cd06`**
- `index.html` 入口 `game.55b9c15d.js + assets.ccf47434.js`

## 6. 改动文件

- `src/scenes/world.js`
- `src/systems/worldSave.js`
- `web/data/world.json`
- `index.html`、`sw.js`、`web/game.html`、`web/fonts/game.woff2`、`dist/game.55b9c15d.js`、`dist/assets.ccf47434.js`
- `docs/BATCH26-G4-6.md`、`docs/ACCEPTANCE.md`、`CURRENT.md`、`LEDGER.md`、`docs/MASTERPLAN.md`、`docs/OPENWORLD.md`、`docs/BATCH26-G4-5.md` 注记
- `docs/revamp/g4-6/`：本地 7 张 + 单文件 1 张 + PWA 1 张

## 7. 风险与回退

- **共享 `mireHerbs`**：阿烬与阿芦都用灯芯草。阿烬的委托只在 `mireWraith done` 后开放，但若阿芦第二条「沉祠长明」仍在 active，先交阿烬会消耗 3 束，可能延迟阿芦；两条任务都不会坏档。若认为资源冲突不可接受，可回退本轮，或下一轮把长明芯改为独立 `lampHerbs` / 独立节点。
- **一次性**：`lampQuest` 完成后不随重燃重置；玩家不能重复领取 4 碎片。若要可重复，需要改成按周目刷新，并补经济上限。
- **无独立立绘**：阿烬仍复用 `mireKeeper + flipX`，没有新增 ink-studio 3D；若要求角色辨识度，下一轮再做独立立绘。
- **无成就**：仍 24 条，Hall 成就页 4×6 布局不变；本轮刻意不把「长明芯」硬塞进成就页。
- 回退：撤销 `lampQuest` 数据与 `lampkeeperTalk` / `worldSave` v15 / `world.json` v11，恢复 G4-5 的 `quest='mire'` 纯对话，构建与证据同步回退。

## 8. 证据

`docs/revamp/g4-6/`：

- `g4-6-lampkeeper-gate-960.png`
- `g4-6-lampkeeper-gate-640.png`
- `g4-6-lampkeeper-gate-844.png`
- `g4-6-lamp-offer-960.png`
- `g4-6-lamp-choice-960.png`
- `g4-6-lamp-done-960.png`
- `g4-6-lamp-choice-640.png`
- `g4-6-lamp-offer-single-960.png`
- `g4-6-lamp-offer-pwa-960.png`

## 9. Pages 线上

已推送 `101dde9`；Pages 入口 **`game.55b9c15d.js + assets.ccf47434.js`**，`world.json v11`，PWA **`na-b18-fef5cd06`** / 12 条；线上 **26/26 PASS**，`errs=[]`。

- 960 灯前：`mire-6` 1 个 NPC「守灯人 阿烬」，`role=lampkeeper / quest=lamp`，gate 休眠、`boss=false`，按 E 出「归水灯在等一簇火」，`lampQuest=none`。
- 960 六 Boss 全 done：无 gate，NPC offer 含「六盏灯都亮了」+「可灯里还缺一根长明芯」+ 星火重燃警示；关闭对话后 `lampQuest=active`。
- 960 active / `mireHerbs=3`：按 E 打开「委托 · 守灯人的长明芯」面板 `stage1 / rows2`；交付后 `lampQuest=done / tokens20→24 / mireHerbs3→0 / memorial='归水灯 · 长明'`。
- 640：交付面板 `scrollWidth=640` 无溢出；844：offer 面板 `scrollWidth=844` 无溢出。
- PWA：controller 后断网 reload，`mire-6` NPC / active 交付面板仍可用；`errs=[]`。
