# 批 25 / G2-6：四群系第二条委托（G2 10/10）

> 2026-11-25。范围：给草原 / 竹林 / 沙漠 / 雪原各补一条第二条委托，把 G2 从 **6/10** 收到 **10/10**；新增 `na.world v11`，不新增美术、不改已有 30 屏地形与摆件。

## 1. 结论

G2 五群系 10 条委托全部落地。四条新委托都是各群系的**加量采集单**，复用已有草药节点与 NPC，重点在第二轮对话、HUD 状态、交付扣减与存档迁移；火山已有「三淬归火」保持原机制。

| 群系 | 委托 | 需求 | 交付奖励 | 设计意图 |
|---|---|---|---:|---|
| 草原 | 雨后药圃 `fieldHerb8` | 8 株草药 | 3 碎片 | 村医第一副药之后的补茬；把村口药圃再采一轮 |
| 竹林 | 旧祠灯油 `bambooOil7` | 7 株雾竹 | 3 碎片 | 竹隐把雾竹榨成旧祠灯油，续上旧祠的夜灯 |
| 沙漠 | 沙井回甘 `desertWell7` | 7 颗沙枣 | 3 碎片 | 沙婆用沙枣换井水，旧门重新听见水声 |
| 雪原 | 长夜续灯 `snowNight7` | 7 盏雪灯 | 3 碎片 | 阿霁把破祠的灯续到天亮 |

G2 总量：**30 屏 / 5 群系 / 10 委托 / 5 只世界 Boss / 23 条成就**；`na.world` 从 v10 升到 **v11**。

## 2. 数据

`web/data/world.json` 升 **v8**，顶层新增四个第二条委托：

| 键 | id | 名称 | 需求 | yield | rewardTokens |
|---|---|---|---:|---:|---:|
| `fieldQuest2` | `fieldHerb8` | 雨后药圃 | 8 | 2 | 3 |
| `bambooQuest2` | `bambooOil7` | 旧祠灯油 | 7 | 2 | 3 |
| `desertQuest2` | `desertWell7` | 沙井回甘 | 7 | 2 | 3 |
| `snowQuest2` | `snowNight7` | 长夜续灯 | 7 | 2 | 3 |

四条的 `npc` 仍分别对齐 `doctor / hermit / sandmother / snowkeeper`；`yield` 只作为采集节点的通用掉落口径，第二条委托仍用各群系原有草药节点，不新增 `herbs` 坐标。

## 3. 存档

`src/systems/worldSave.js` 升 **v11**：

- 新增 `fieldQuest2 / bambooQuest2 / desertQuest2 / snowQuest2`，取值仍是 `none | active | done`。
- v10 旧档迁移时四项补 `none`，`visited / herbs / 五群系第一条委托 / bosses / tokens` 原样保留。
- `patchWorldSave` 对四条新状态与既有 `volcanoQuest2` 一起做白名单清洗；旧档只写一次迁移结果。
- 第二条采集仍复用各群系的 `herbs / bambooHerbs / desertHerbs / snowHerbs` 计数；交付时扣 `need`，不做第二套库存。

## 4. 运行时

`src/scenes/world.js`：

1. `QUEST_PROFILE` 四个群系各加 `quest2Def / quest2Save / readyHint2`；火山保留 `ventSave`。
2. 新增 `secondCountFor(prof)` 与 `secondCountForNpc(npc)`：有 `ventSave` 的火山读炉眼数组，其余群系读对应 `herbSave`；`ventCountFor` 删除。
3. `updateHud` 在第一条 `done` 后切到第二条：物品名、计数、`待接 / 采集 / 可交付 / 已完成` 状态都按新委托；火山仍是 `待接 / 淬火 / 可交付 / 已淬`。
4. `hudHintText` 泛化：未接提示 NPC 名与委托名；采集中显示「继续采集 X · 还差 N」；采满显示 `readyHint2`；火山仍提示炉眼 / 篝火。
5. `npcLines2` 扩到草原 / 竹林 / 沙漠 / 雪原 / 火山五套：完成、未接、采集中各两行；四条新委托的对白不与第一条重复。
6. `interactNpc` 第二条分支改用 `secondCountForNpc`；`showQuestChoice` 第二条的 `count / item / unit` 按 profile 回退；`deliverQuest` 第二条对采集型扣 `need` 并写 `done`，火山仍走三处炉眼与篝火 banner。
7. `completeGather` 在第一条 `done`、第二条 `active` 时，采满会提示 `readyHint2`；第一条的 `readyHint` 不变。

## 5. 实测

| 项目 | 结果 |
|---|---|
| v10 → v11 | `v11 / herbs12 / visited [field-1,snow-3]`；四个 q2 全部 `none`；`mossBeast:'done'` 保留 |
| 草原第二条 | `active` 对话 → 接取；`6/8` HUD；`8/8` 可交付；panel `stage2`；交付 `done / tokens3 / herbs0`；提示「第二批草药够了 · 回村口找阿杏」 |
| 竹林第二条 | `active / 5/7 → 7/7`；交付 `done / tokens3 / bambooHerbs0`；提示「灯油材料够了 · 回旧祠找竹隐」 |
| 沙漠第二条 | `active / 5/7 → 7/7`；交付 `done / tokens3 / desertHerbs0`；提示「第二批沙枣够了 · 回旧门找阿砾」 |
| 雪原第二条 | `active / 5/7 → 7/7`；交付 `done / tokens3 / snowHerbs0`；提示「续灯够了 · 回雪祠找阿霁」 |
| 实际采集 | 草原第二条 `herbs6 → 8`，toast「第二批草药够了 · 回村口找阿杏」；HUD `可交付 8/8` |
| 村医第一条回归 | `active / 5 株 → panel → done / tokens1 / herbs0` |
| 火山三淬回归 | `active / vents[3] → panel → done / tokens3`；HUD `炉眼 3 · 已淬` |
| 640 | `scrollWidth=640 / clientWidth=640`；HUD 正常 |
| 844 | `scrollWidth=844 / clientWidth=844 / touchCtl=true / touchItems=3 / canvas779×360` |
| 单文件 | `__SINGLE__ / sw=false / v11 / 四 q2 数据可读 / errs=[]` |
| PWA | cache `na-b18-686abf47` / 12 条；controller=true；全网络请求 abort 后 reload 仍进入 `field-1 / v11 / fieldQuest2=雨后药圃`；`errs=[]` |
| 冒烟 | `npm run smoke` 9 PASS |
| 比例 | `audit_scale.py` **170 / 0 FAIL**（无新增美术，数量不变） |

## 6. 构建

- 首屏 **2027 KB / gzip 859 KB**；图集 **267 KB / 166 切片**。
- `dist/game.af68aa30.js` **357,526 B** + `dist/assets.272a87b6.js` **127,090 B**。
- 单文件 `web/game.html` **2,210,407 B**；PWA `na-b18-686abf47` / 12 条。
- `web/data/world.json` v8；`na.world` v11。

## 7. 证据

`docs/revamp/g2-6/`：

- `g2-6-field-active-960.png`：草原第二条 6/8。
- `g2-6-field-panel-960.png`：交付 8 株 panel。
- `g2-6-field-done-960.png`：交付完成 +3、对话「药圃的草药够了」。
- `g2-6-field-gather-960.png`：实际采集后 8/8 与 ready toast。
- `g2-6-bamboo-active-960.png`、`g2-6-desert-active-960.png`、`g2-6-snow-active-960.png`：三条 5/7。
- `g2-6-field-640.png`、`g2-6-field-844.png`：640 / 844 触屏。
- `g2-6-single-field-960.png`、`g2-6-pwa-field-960.png`：单文件 / PWA。

## 8. 已知边界

- 四条新委托是**同群系加量采集**，不新增采集点、不新增美术、不新增战斗；与第一条的差异主要体现在 NPC 第二轮叙事、HUD 状态、交付扣减和奖励（3 碎片）。
- 第二条与第一条共用草药计数：如果玩家在第一条交完前大量囤货，第二条接取后可能直接接近或达到 `need`；这是已有采集经济下的预期行为，不另做“接取时清零”。
- 火山第二条仍是炉眼淬火，不改成采集；篝火传送解锁条件不变。
- 未新增成就；G2 的全部委托完成度以 `na.world` 四条 q2 + 火山 q2 的状态记录，不把委托数塞进 `ach.js`。
- 未单独验证从 Hall → World 的真实 NAV 栈下连续做四条第二条委托；本轮以 `?world=1&debug=1` 直入、逐屏 `applyScreen` + NPC 交互验收，逻辑与 HUD 已覆盖。
