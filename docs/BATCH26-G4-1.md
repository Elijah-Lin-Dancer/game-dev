# 批 26 / G4-1：第六群系「雾泽」第一版

> 2026-11-25。范围：在火山群系之后追加第六群系「雾泽 / mire」，把开放世界从 **30 屏 / 5 群系 / 10 委托** 扩到 **36 屏 / 6 群系 / 12 委托**。本轮是 G4 的第一版，不新增世界 Boss、不新增成就。

## 1. 结论

雾泽已按「同群系 6 屏 + 1 NPC + 2 条采集委托」的完整链路落地。第六群系沿用现有沼泽 / 水泽语义，但地表、气候、植被、遗迹、NPC 与委托都是独立配置；没有复用火山或雪原的群系状态。

| 项 | 结果 |
|---|---|
| 群系 | 雾泽 `mire`；6 屏，索引 30–35 |
| 屏名 | `mire-1 芦口` / `mire-2 浅汀` / `mire-3 沉祠` / `mire-4 灯沼` / `mire-5 无岸` / `mire-6 归水` |
| NPC | 守泽人 阿芦，`mire-3`，`npc.quest='mire'` |
| 委托 | `mireQuest 灯芯七束`（7 束 / 2 碎片 / 3 星火碎片）、`mireQuest2 沉祠长明`（9 束 / 2 / 3） |
| 采集 | 灯芯草，18 个节点（每屏 3 个），单位「束」，存档键 `mireHerbs` |
| 气候 | `miasma`「瘴雾」：绿色孢子 + 薄绿 veil + 暗角 0.42，移速 ×0.88 |
| 篝火 | `mireCamp 芦口篝火`，`mire-1` `x386 / y246`，`spawnX350 / spawnY244`；总篝火 6 |
| 地形 | 现有 16px `TilesetField` 帧 21 调色出 `mire-tile.png`；水洼只做视觉层，不做碰撞 / 液体模拟 |
| Boss / 成就 | 不新增；当前仍 5 只世界 Boss / 23 条成就 |
| 存档 | `world.json` v9；`na.world` v12（v11 旧档补 0 / none） |

## 2. 群系设计

### 2.1 六屏

| 屏 | 名字 | 场景意图 | 主要摆件 / 交互 |
|---|---|---|---|
| `mire-1` | 芦口 | 进入雾泽的第一屏；篝火与旧木门作为落点 | `mireCamp`、`mireArch`、芦苇、灌木、3 水洼、3 灯芯草 |
| `mire-2` | 浅汀 | 浅水与芦苇交错，第一次看到大片水洼 | 芦苇 ×5、枯木、沙岩堆、2 水洼、3 灯芯草 |
| `mire-3` | 沉祠 | 守泽人阿芦与沉祠；两条委托的接取 / 交付点 | `mireShrine`、NPC、芦苇、枯木、2 水洼、3 灯芯草 |
| `mire-4` | 灯沼 | 旧木门与灯沼水面，路感最窄 | `mireArch`、芦苇 ×4、枯木、沙岩堆、灌木、2 水洼、3 灯芯草 |
| `mire-5` | 无岸 | 水洼最密、岸线最模糊的一屏 | 芦苇 ×4、沙岩堆、枯木、灌木 ×2、2 水洼、3 灯芯草 |
| `mire-6` | 归水 | 尾屏；沉祠与第二道旧木门，作为回望 / 归水 | `mireShrine`、`mireArch`、芦苇 ×3、枯木、灌木、2 水洼、3 灯芯草 |

### 2.2 设计边界

- **不重绘 16px tile**：遵守用户既定边界，基础地形仍是现有 tile / 手绘；`mire-tile.png` 只从 `TilesetField` 帧 21 调色，不换素材体系。
- **水洼是视觉层**：`pools` 只负责暗色水底、冷青水面、亮边、glint 与呼吸 tween，不做液体碰撞、推挤或落水伤害。
- **不新增 Boss**：`mire-6` 是尾屏，不挂 Boss、不做终局结算；世界 Boss 仍只有 G3 五只。
- **不新增成就**：`ach.js` 未改，仍 23 条；雾泽进度只写 `na.world` 的 `mireHerbs / mireQuest / mireQuest2`。
- **不做 mire 专属地下层**：没有洞穴 / 台地新规则；地表仍然是一层可走平面。

## 3. 数据与存档

`web/data/world.json` 升 **v9**，追加 6 屏与 `pools`：

- `screens` 从 30 → **36**；`mire-1..mire-6` 索引 **30–35**。
- 每屏 `biome: 'mire'`、`weather: 'miasma'`、`weatherName: '瘴雾'`。
- `pools` 共 **13** 组：`mire-1` 3 组，其余 5 屏各 2 组；字段 `[x, y, w, h]`。
- `mireQuest`：

| 键 | id | 名称 | npc | need | yield | rewardTokens |
|---|---|---|---|---|---:|---:|---:|
| `mireQuest` | `mireReed7` | 灯芯七束 | `mireKeeper` | 7 | 2 | 3 |
| `mireQuest2` | `mireReed9` | 沉祠长明 | `mireKeeper` | 9 | 2 | 3 |

- `campfires` 追加 `mireCamp`；总数 **6**。传送仍在火山第二条委托完成后解锁，新增落点不改变解锁条件。
- 18 个 `mire` 采集节点（每屏 3 个）；`mire-3` 的一个节点从 `352,214` 移到 `420,214`，避免与 NPC 交互提示争同一块位置。

`src/systems/worldSave.js` 升 **v12**：

- 新增 `mireHerbs / mireQuest / mireQuest2`；`SCREENS` 36。
- `defaults / migrate / patchWorldSave` 全部补齐；v11 旧档补 `0 / none / none`，`visited / herbs / 五群系状态 / bosses / tokens` 保留。
- `worldSaveVersion()` 返回 12；旧档首次读取时写回迁移结果。

## 4. 素材与比例

新增 4 件 ink-studio 3D + 1 张调色 tile：

| 件 | 源 | 输出 | 运行时 |
|---|---|---|---|
| 守泽人 阿芦 | `art-src/g4/mire-keeper.cjs`（seed 401，64×64 四向） | `mire-keeper-atlas.png` 256×64 | `mire-keeper.png` 64×64；bbox 42px / 1.24×；origin 54/64；`npcScale 0.95` |
| 芦苇 | `mire-reed.cjs`（seed 402，64×96 单向） | `mire-reed-atlas.png` 64×96 | `mire-reed.png` 64×96；bbox 63px / 2.31×；origin 75/96；`PROP_SCALE 1.0`，节点 `scale 1.2` |
| 沉祠 | `mire-shrine.cjs`（seed 403，96×128 单向） | `mire-shrine-atlas.png` 96×128 | `mire-shrine.png` 96×128；bbox 96px / 3.0×；origin 110/128；`PROP_SCALE 1.0` |
| 灯芯草 | `mire-herb.cjs`（seed 404，32×48 单向） | `mire-herb-atlas.png` 32×48 | `mire-herb.png` 32×48；bbox 16px / 0.675×；origin 32/48；`herbScale 1.35` |
| 湿苔 tile | 现有 `TilesetField` 帧 21 + 湿苔绿调色 | — | `mire-tile.png` 16×16；`buildGround` 的 `mireTile` 分支 |

复用件：`mireArch` 复用 `desertArch` 加 tint；`mireDeadTree` 复用 `desertDeadTree`；`mireRock` 复用 `sand-rock`；`mireBush` 复用 `worldBush`。

- 源图集 / json：`docs/revamp/g4-3d/mire-{keeper,reed,shrine,herb}-atlas.png`、同名 `.json`。
- 裁切 / tile：`tools/crop_mire.py`（新建）。
- 复现：`INK_STUDIO=/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio node art-src/g4/render-g4.cjs`，再 `python3 tools/crop_mire.py`。
- `tools/build.mjs` 登记 5 个新切片；图集 **166 → 171 切片**。
- `tools/audit_scale.py` 扩 mire 规则；最终 **217 实例 / 0 FAIL**。
- 3D 对照：`docs/revamp/g4-1/g4-mire-3d.png`。

## 5. 运行时

`src/scenes/world.js`：

1. 新增 `BIOME_LABEL.mire='雾泽'`、`BATTLE_HERB_LABEL.mire`、`TINT.mire`、`QUEST_PROFILE.mire`（`labelY 56 / promptY 70 / npcOriginY 54/64`）。
2. `normalizeWorld` 补 `pools`、`mireQuest / mireQuest2`。
3. `buildGround` 新增 `mireTile` 分支：湿苔绿 shade / rim / decoAlpha、4 个固定湿苔斑、薄雾带；不新增基础 tile 素材。
4. 新增 `buildMirePools()`：暗色水底、深青水面、亮边、冷光 glint 与呼吸 tween；共 13 个水洼。
5. `buildProp` 新增 `mireReed / mireShrine / mireArch / mireDeadTree / mireRock / mireBush`；芦苇有轻微摆动，沉祠 / 门 / 石堆按脚底 blocker。
6. `buildHerbs` 新增 `mireHerb` 分支：1.35 scale、灯芯草光晕与「E 采集」提示。
7. `buildWeather / applyWeather` 新增 `mireSpores / mireVeil`；`movePlayer` 新增 `miasma` 0.88 移速。
8. `npcLines / npcLines2 / deliverQuest` 新增 mire 对白与交付；`buildNPC` 支持 `npcOriginY`。
9. `deliverQuest` 原有嵌套三元重构成 `doneLines` map，修正 mire 分支括号错误。
10. NPC 名牌 / E 提示统一改为 `promptY = max(promptY, labelY + 26)`，修复 mire NPC 与采集提示在同一行重叠；该修正对所有 NPC 生效。

`src/systems/ui/tokens.js` 新增 `mire / mireLight / mireDark / mireWater / mireVeil / mireGlow / mireSpore` 色板。

## 6. 验收

### 6.1 本地功能

| 项目 | 结果 |
|---|---|
| 接取第一条 | `mireQuest active`；HUD `灯芯草 0 · 采集 0/7 · 碎片 0` |
| 采 4 个节点 | `mireHerbs 8`；HUD `灯芯草 8 · 可交付 7/7`；面板「需要 7 束，当前 8 束」 |
| 交付第一条 | `mireQuest done / mireHerbs 1 / tokens 3 / HUD 待接` |
| 接取第二条 | `mireQuest2 active`；HUD `1/9` |
| 再采 5 个节点 | `mireHerbs 11`；HUD `可交付 9/9` |
| 交付第二条 | `mireQuest2 done / mireHerbs 2 / tokens 6 / HUD 已完成` |
| 错误 | `errs=[]`；`window.__world.save.v=12`；`screens=36`；`worldData.version=9` |

> 第一次任务测试误用 `npcs[0]`（草原村医），得到「草药 0/5」的错误结果；改为 `npcs.find(n=>n.quest==='mire')` 后重跑，以当前结果为准。

### 6.2 实际走屏 / Boss 边

- 预置 `magmaColossus='done'`，从 `volcano-6` 屏右边缘连续 `movePlayer`，`screenId` 从 `volcano-6` → `mire-1`；`visited` 写入 `mire-1`；`errs=[]`。
- 预置熔心巨像未击杀时，`applyScreen(29)` 进入 Boss 战，`bossActive=true`，`buildBossEdge` 暂隐 **59** 个下一屏对象；Boss 结束后可正常走屏。说明火山 Boss 战不会提前露出 `mire-1`。

### 6.3 响应式 / 单文件 / PWA / 存档

| 项目 | 结果 |
|---|---|
| 960 | 6 屏正常；`mire-3` NPC 名牌 / E 提示分离；三屏 clean 截图无 banner |
| 640×360 | `scrollWidth=640 / clientWidth=640`；HUD / 场景无溢出；`g4-mire-640.png` |
| 844×390 hasTouch | `scrollWidth=844 / clientWidth=844 / touchCtl=true / touchItems=3 / labels=['攻','E','返']`；`canvas779×360` |
| 单文件 `file://` | `__SINGLE__ / mire-3 / screens=36 / v=12 / errs=[]`；`g4-mire-single-960.png` |
| PWA | `na-b18-04de8b50` / 12 条；controller=true；`set_offline(true)` 后网络 probe `rejected:TypeError`，reload 仍进 `mire-3 / screens=36`；`g4-mire-pwa-960.png` |
| v11 → v12 | `v=12`；`mireHerbs=0 / mireQuest=none / mireQuest2=none`；`screens=36`；`herbs3 / quest active` 保留 |
| 6 篝火传送 | 960 / 640 均打开 `travel` 面板；6 行 + 留在原地；`overflow=false`；`g4-mire-travel-960.png` / `g4-mire-travel-640.png` |
| 冒烟 | `npm run smoke` 9 PASS |
| 比例 | `audit_scale.py` **217 实例 / 0 FAIL** |
| 帧率（无 GPU headless 参考） | `field-0 23fps / volcano-6 20fps / mire-3 21fps`；只作相对参考，不作为 60fps 结论 |

### 6.4 构建

| 项 | 值 |
|---|---|
| 首屏预算 | **2042 KB / gzip 865 KB** |
| 图集 | **272 KB / 171 切片**；`web/atlas/core.png` **278,152 B** |
| 游戏逻辑 | `dist/game.196888a7.js` **364,269 B**（gzip 102,384 B） |
| 素材数据 | `dist/assets.0b93f349.js` **131,323 B**（gzip 67,597 B） |
| 单文件 | `web/game.html` **2,227,695 B**（gzip 893,928 B） |
| PWA | `sw.js` cache **`na-b18-04de8b50`**，CORE 12 条 |
| 入口 | `index.html` → `dist/assets.0b93f349.js` + `dist/game.196888a7.js` |

## 7. 已知边界

- **无 Boss / 无成就**：`mire-6` 只作为归水尾屏，不触发终局；世界 Boss 仍 5 只，成就仍 23。
- **无液体模拟**：水洼不阻挡、不推挤、不落水；只有视觉与冷光呼吸。
- **未走完整 Hall → World NAV**：本轮从 `?world&debug` 直入、逐屏 `applyScreen`，另补了 `volcano-6 → mire-1` 的实际走屏；没有单独重走 Hall → World 的完整导航栈。
- **640 / 844 的 mire 采集提示**：截图脚本只调用 `updateHud`，未调用 `updatePrompts`，因此 844 截图中 NPC 的 E 提示未显示；不代表运行时提示缺失。
- **帧率**：headless / 无 GPU 下 20–23fps，只能说明 mire 与既有场景同档，不能作为真实设备 60fps 证明。
- **性能专项未做**：水洼 tween、孢子 emitter、13 组水洼在低端设备上的长期开销未做专项 profile。

## 8. 证据

- 六屏：`docs/revamp/g4-1/g4-mire-1-960.png` … `g4-mire-6-960.png`；总览 `g4-mire-screens.png`。
- 委托：`g4-mire-active-960.png`、`g4-mire-panel-960.png`、`g4-mire-done1-960.png`、`g4-mire-q2active-960.png`、`g4-mire-done2-960.png`。
- 走屏 / 边：`g4-mire-cross-960.png`。
- 响应式 / 单文件 / PWA：`g4-mire-640.png`、`g4-mire-844.png`、`g4-mire-single-960.png`、`g4-mire-pwa-960.png`。
- 篝火传送：`g4-mire-travel-960.png`、`g4-mire-travel-640.png`。
- 3D：`g4-mire-3d.png`；源图集在 `docs/revamp/g4-3d/`。

## 9. 线上验收

待 Pages 部署后回填。
