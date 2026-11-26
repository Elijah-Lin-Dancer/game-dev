# 批 26 · G4-5 守灯人阿烬 · 雾泽尾声

## 1. 结论

G4-5 只补 `mire-6` 的人物缺口：归水灯旁新增「守灯人 阿烬」。她不发委托、不改存档、不加屏、不加 Boss、不加成就，只提供与当前进度相关的四组对话：灯前、水魇退后、六 Boss 全 done、周目 2 之后。

当前仍是 **36 屏 / 6 群系 / 12 委托 / 6 Boss / 24 成就**；NPC 从 6 个增至 7 个。`world.json` 仍 v10，`na.world` 仍 v14。无新增美术，复用 `mireKeeper` 运行时图并水平翻转，避免在归水灯旁再出现一张同姿态的立绘。

## 2. 行为合同

| 场景 | 入口 | 期望 |
|---|---|---|
| 灯前 | `mire-6`，靠近阿烬按 E 或点击立绘 | 出现「归水灯在等一簇火。」；不触发 Boss，不写档 |
| 水魇已退、其他 Boss 未全清 | 同上 | 出现「水魇退了，归水灯不再沉。」；不重复领奖 |
| 六 Boss 全 done | 同上 | 出现「六盏灯都亮了。」并明确「星火重燃：六 Boss 会重置，碎片 / 委托 / 成就都留下」 |
| 周目 2 且未点灯 | 同上 | 出现「第 2 次远征。灯又沉下去了。」；指示走近归水灯按 E |
| 任意状态 | 关闭对话 / 移动 / ESC | 回到可操作状态；无面板残留、无确认态串扰 |

阿烬是 `role='lampkeeper'` 的纯对话 NPC。她的 `quest='mire'` 只用于复用雾泽 NPC 的素材、缩放、标签和光晕配置，不进入 `interactNpc` 的接委托 / 交委托分支；不会把「灯芯七束」「沉祠长明」再发一遍。

## 3. 实现

- `src/scenes/world.js`
  - `buildNPC()` 支持 NPC 级 `role`、`tint`、`alpha`、`flipX`；阿烬使用 `flipX`，其余 NPC 不受影响。
  - `interactNpc()` 最先分流 `npc.role === 'lampkeeper'`，调用 `lampkeeperLines()` 后直接 `say()`，不读写委托状态。
  - `lampkeeperLines()` 依据 `save.bosses.mireWraith`、六 Boss 全 done、`save.expedition` 返回对应文案；不新增存档字段。
- `web/data/world.json`
  - `mire-6` 的 `npc` 从 `null` 改为 `{ id: 'mireLampkeeper', name: '守灯人 阿烬', x: 110, y: 190, quest: 'mire', role: 'lampkeeper', flipX: true }`。
  - 位置在归水灯左侧、现有采集点 46px 交互半径之外；玩家走近时先看到 NPC，而不是误触采集。
- 无改动：`worldSave.js`、委托数据、成就数据、图集、Boss 数据、`sw` 预缓存列表。

## 4. 实测

| 项 | 结果 |
|---|---|
| `mire-6` NPC | 1 个；`守灯人 阿烬`；`role=lampkeeper`；靠近时「E 交谈」可见 |
| 灯前 | `gate=true / boss=false`；第一句「归水灯在等一簇火。」；对话不触发 Boss |
| 水魇退后 | 无 gate；第一句「六盏灯都亮了。」；第三句含「星火重燃 / 六 Boss / 碎片」 |
| 周目 2 | HUD「周目 2」；无 Boss；第一句「第 2 次远征。灯又沉下去了。」 |
| 640 / 844 | `scrollWidth` 分别为 640 / 844；无横向溢出 |
| 单文件 | `web/game.html` 内 NPC、gate、对话均可用 |
| PWA 离线 | `na-b18-4707d526` 缓存；断网 reload 后 NPC、gate、对话均可用 |
| 旧档 | v13→v14、gate 休眠、E 唤醒 `104/6` 不变 |
| G4-4 回归 | `g44` 14/14；`g44-reg` 6/6；重燃、周目奖励、640/844、单文件、PWA 均未回退 |
| 冒烟 / 比例 | `npm run smoke` 9 PASS；`audit_scale.py` **221 INSTANCES / 0 FAIL** |
| 控制台 | `errs=[]` |

测试脚本：`/tmp/g45.py` **15/15**、`/tmp/g45-reg.py` **6/6**；回归 `/tmp/g44.py` **14/14**、`/tmp/g44-reg.py` **6/6**。测试档 `/tmp/g44-base.json`、`/tmp/g44-all.json`、`/tmp/g44-tier2.json`。

## 5. 构建

- 首屏 **1905 KB / 2.00 MB（gzip 723 KB）**
- `dist/game.48b6f1c6.js` **377,404 B**
- `dist/assets.845b6943.js` **132,158 B**
- 单文件 `web/game.html` **2,035,289 B**
- `web/fonts/game.woff2` **133,768 B**
- 图集 `web/atlas/core.png` **123,265 B / 174 切片（无新增）**
- PWA `sw.js` **`na-b18-4707d526`**

## 6. 改动文件

- `src/scenes/world.js`：NPC 级 `role / tint / alpha / flipX` 支持、`lampkeeperLines()`、`interactNpc()` 分流。
- `web/data/world.json`：`mire-6` 新增 `mireLampkeeper`；`version` 仍 10。
- `dist/game.48b6f1c6.js`、`dist/assets.845b6943.js`、`web/game.html`、`web/fonts/game.woff2`、`sw.js`、`index.html`：构建产物。
- `docs/revamp/g4-5/`：本地 / 单文件 / PWA 证据。
- 文档：本文件、`CURRENT.md`、`LEDGER.md`、`docs/ACCEPTANCE.md`、`docs/MASTERPLAN.md`、`docs/OPENWORLD.md`。

## 7. 风险与回退

- 阿烬是纯对话角色，没有任务奖励和新存档字段；若觉得信息量不足，后续可再加「重燃」成就或独立委托，不需要改存档结构。
- 复用 `mireKeeper` 图并 `flipX`，视觉上与阿芦同源；用名字、站位和朝向区分。若要独立立绘，需走 ink-studio 新素材并重新审计比例。
- 不给阿烬接委托入口；若后续要让她发委托，需要给 `QUEST_PROFILE` 增加独立 profile 和存档键，不能复用 `mire`。
- 回退：删除 `mire-6` 的 `npc`、移除 `lampkeeperLines()` 与 `interactNpc()` 分支，重建即可恢复 G4-4 视觉；不影响存档。

## 8. 证据

本地 / 单文件 / PWA：

- `docs/revamp/g4-5/g4-5-lampkeeper-scene-960.png`
- `g4-5-lampkeeper-gate-960.png`
- `g4-5-lampkeeper-gate-640.png`
- `g4-5-lampkeeper-gate-844.png`
- `g4-5-lampkeeper-all-960.png`
- `g4-5-lampkeeper-tier2-960.png`
- `g4-5-lampkeeper-single-960.png`
- `g4-5-lampkeeper-pwa-960.png`

## 9. Pages 线上

待推送。线上当前仍为 G4-4（`game.9d324e8d.js` + `assets.8c75570a.js`，PWA `na-b18-ae4a669e`）。
