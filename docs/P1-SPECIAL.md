# P1-A 特殊关卡（13 关）：通路与规则

目标：把 `web/data/chapters.json` 里已有、但此前不可达的 13 个特殊关卡接成「地图可见 → 条件可判 → 可进 Select / Play → 可结算 → 返回地图看到通关记录」的完整节点路径，并补上最容易被玩家当场看穿的三条实际玩法规则：`timer`、`noCoinPickup`、`fists`。

上一批完成通路、条件、进入与结算；本批在同一批代码上继续补规则消费与地图规则标签。未接规则仍按文末「未接规则」保留，不伪装成已完成。

## 1. 数据与规格

`src/systems/stages.js` 新增特殊关卡 API：

| API | 作用 |
|---|---|
| `specials()` | 汇总 `side / hidden / conditional` 三类，补 `type / typeName` |
| `specialById(id)` | 按 id 取单条 |
| `specialKey(id)` | 存档键 `sp_<id>:1` |
| `specialChapterId(id)` | 伪章节 id `sp_<id>` |
| `specialCleared(save, id)` | 读 `stars['sp_<id>:1'] >= 1` |
| `specialGateOk(save, s)` | 条件达成判定 |
| `specialSpec(id)` | 生成单关规格：房数、模板、Boss 池、怪池、主题、难度 |
| `specialGateLabel(s, save)` | 条件文案（带当前进度） |
| `specialRuleLabel(s)` | 规则标签：限时 / 不掉金币 / 赤手空拳 / 指定武器 |

特殊关会派生一个伪章节：`chapterId = sp_<id>`、`stages = 1`、`key = sp_<id>:1`。房数 / 模板 / Boss 池 / 怪池 / 主题从所属章节派生；首房强制非 Boss，末房强制 Boss。`totalStars()` 改为只统计主线章节，特殊星不污染主线 ★。

`chapters.json` 里本批消费的字段：

```json
{ "rule": "timer", "seconds": 300 }
{ "rule": "noCoinPickup" }
{ "loadout": { "weapons": [] } }
{ "loadout": { "weapons": ["kunai"] } }
```

## 2. 13 条条件与入口

| id | 类型 | 章节 | 房数 | 条件 | 首通奖励 |
|---|---|---|---|---:|---|---:|
| `firefly` | 支线 | 竹林村 | 5 | 本章 ★ ≥15 | +20 宝石 |
| `cellar` | 支线 | 旧堡 | 3 | 击败 Boss 赤武士（`seen.bosses`，`samRed/samuraiRed` 别名） | +25 |
| `caravan` | 支线 | 沙海遗迹 | 5 | 累计金币 ≥30（当前以 `meta.coins` 代理） | +30 |
| `ship` | 支线 | 沉水神殿 | 4 | 无伤挑战；无显式 gate 时要求本章全关 ≥1★ | +35 |
| `forge` | 支线 | 熔岩地心 | 4 | 火盆 ×3；无显式 gate 时要求本章全关 ≥1★ | +40 |
| `epilogue` | 支线 | 星火之巅 | 3 | 通关 `final` | +50 |
| `darkhall` | 隐藏 | — | 6 | 主线 ★ ≥100 | 无 |
| `mirror` | 隐藏 | — | 5 | 沙海遗迹全关 3★ | 无 |
| `ashfall` | 隐藏 | — | 7 | 通关 `darkhall` | 无 |
| `kunai` | 条件 | — | 5 | 解锁武器 `kunai` | 无 |
| `fists` | 条件 | — | 5 | 通关 `fort` | 无 |
| `poor` | 条件 | — | 6 | 累计金币 ≥200 | 无 |
| `speedrun` | 条件 | — | 5 | 通关 `desert` | 无 |

## 3. 交互

- `map.js` 页眉新增「特殊关卡 N ›」，打开 600×320 覆盖层。
- 13 卡按 5 / 5 / 3 居中，三类颜色：支线绿、隐藏紫、条件蓝；卡内显示名称、类型、已通 / 可挑战 / 未达成。
- 点卡只选中；Enter / 「开始挑战」进入 Select；锁卡只弹条件 toast；ESC / 右键 / 遮罩关闭。
- `pendingSpecial` 让 Play 结算返回 Map 时自动重开对应特殊卡，并选中该卡。
- Select 标题显示「类型 · 关卡名」，返回 Map 带 `{special:id}`。
- Play HUD 显示「关卡名 · 房 N/M」；结算显示「关卡名 完成 / 星级 / 首通奖励或奖励已领取 / 击杀 / 金币」，返回 Map 带 `{special:id}`。
- 详情面板第二行在「首通奖励」之后追加规则标签：`限时 300 秒`、`本关不掉金币`、`赤手空拳`、`仅限苦无`。

## 4. 结算规则

- 首次通关写 `stars['sp_<id>:1']`，取历史最高星级。
- 首通 `prev === 0` 且该关有 `reward.gem` 时，只发一次宝石；重复通关显示「奖励已领取」。
- 特殊关不写 `tierStars`，不参与主线章节解锁与主线 ★。
- 通关返回后详情面板立即显示「已有通关记录」，卡片显示「已通」。

## 5. 已修复

**覆盖层引用跨场景重启残留。** Phaser 会复用同一个 Map 场景实例；从 Play 返回 Map 时，`this.specialBox` 仍指向上一次已销毁的对象，`openSpecial()` 里的 `if (this.specialBox) return` 会直接拦住 `pendingSpecial`。表现为：存档已有 `sp_firefly:1=3`，但返回后的详情仍显示「首通 +20 宝石」，卡片不显示「已通」。

修复：`MapScene.create()` 开头清空 `specialBox / specialCards / specialDetail / specialStart / specialSel / diffBox`，再走 `pendingSpecial`。这不是读档问题，存档写入一直正确。

## 6. 本批新增规则

### 6.1 `timer`：商队速递 300 秒

- `chapters.json` 的 `speedrun` 写 `rule:"timer"`、`seconds:300`；Play 读取为 `timeLimit / timeLeft`。
- HUD 右侧 `y=54` 显示「剩余 M:SS」；剩余 ≤30 秒文字变红。最初放顶部中央，实测与右上角 `metaText` 重叠，已下移到右侧。
- `tickTimer()` 每秒递减；`paused / panelOpen / talking / dead / won` 时都不递减，避免暂停或对话偷时间。
- 归零时停止计时，`timeUp()` 设 `dead`、`commitRun(false)`、显示「时间到」覆盖层，点击 / Enter 返回 Map 并重开 `speedrun` 特殊卡。
- 规则标签：「限时 300 秒」。

### 6.2 `noCoinPickup`：贫者之路不掉金币

- `chapters.json` 的 `poor` 写 `rule:"noCoinPickup"`；Play 读取为 `noCoinRule`。
- `dropItem()` 对 `kind === 'coin'` 直接 return；本关金币的常规来源只有掉落拾取，因此金币不会增长。
- 进入本关和底部操作提示显示「本关不掉金币」；升级道具、钥匙、武器等非金币掉落不受影响。
- 规则标签：「本关不掉金币」。

### 6.3 `fists`：赤手空拳

- `chapters.json` 的 `fists` 写 `loadout:{weapons:[]}`；Play 读取为 `fistMode`，使用本地伪武器 `FIST_WEAPON`，不读 `weapons.json`。
- `FIST_WEAPON`：`id:'fist'`、`name:'赤手'`、`kind:'melee'`、`dmgMul:0.5`、`cd:320`、`reach:24`、`box:[26,24]`、`knock:70`、`fx:'slA'`、`fxScale:1.8`、`sfx:'sword'`。
- 强制 `this.W.list=[]`；`equipWeapon()` 直接 return，`dropItem()` 对 `weapon` return；武器图标与手持贴图隐藏，HUD 显示「赤手」。
- 规则标签：「赤手空拳」。

### 6.4 规则标签

`specialRuleLabel()` 位于 `src/systems/stages.js` 末尾，`map.js` 的 `refreshSpecial()` 把它拼到详情第二行。最终标签形式：

| 关卡 | 第二行 |
|---|---|
| `speedrun` | `无首通宝石 · 限时 300 秒` |
| `poor` | `无首通宝石 · 本关不掉金币` |
| `fists` | `无首通宝石 · 赤手空拳` |
| `kunai` | `无首通宝石 · 仅限苦无` |

## 7. 验收

构建：`dist/game.54285c08.js`（204,154 B / 199 KB）+ `dist/assets.4a2b12f8.js`（97,038 B / 95 KB）；单文件 `web/game.html`（1,889,402 B / 1845 KB）；`index.html` 指向 `game.54285c08.js`。

功能提交 `8f765c9` 已推送；GitHub Pages 构建状态 `built`，线上入口 `game.54285c08.js`，线上 bundle 204,154 B、SHA-256 `54285c086a9d308eef6080a304eab783a1cee97428722e7ae53877a6f5d7a815` 与本地一致。线上 `fists / poor / speedrun / firefly` 实测通过，`errs=[]`；13 关全量进入/结算回归在同一 SHA 的本地包上通过。

| 编号 | 检查 | 结果 |
|---|---|---|
| R-01 | `speedrun` 进入 | `timeLimit=300`，HUD「剩余 5:00」；2.2 秒后 `298`「剩余 4:58」 |
| R-02 | `speedrun` 归零 | 手动置 1 并触发 tick：`dead=true`、标题「时间到」、返回 `{special:'speedrun'}` |
| R-03 | `timer` 暂停 / 面板 / 640×360 | 暂停 2.1s、面板打开 2.1s 均保持 `timeLeft=300`；640×360 下 `metaText` y=12 高 20、计时 y=54 高 21，无重叠 |
| R-04 | `poor` 金币拦截 | `noCoinRule=true`；直接投金币 0 掉落；投 `upg` 仍得 1 个升级道具 |
| R-05 | `fists` 空手攻击 | 武器 `fist`、`W.list=0`、图标/手持均隐藏；近身 beast 8→6、`wdmg=2`；武器掉落被拦截，金币仍可掉落 |
| R-06 | 规则标签 13 卡 | 13 张卡详情第二行均按类型出现规则标签，无多余括号 / 空格 |
| R-07 | 13 关全量进入 / 结算 | 13/13 `open`；13 个 `sp_<id>:1` 均写入；首通宝石 20/25/30/35/40/50，隐藏/条件关 0；返回均带 `{special:id}`；`errs=[]` |
| R-08 | 普通特殊关回归 | `firefly` +20 宝石、`key=sp_firefly:1`、`rooms=5`、`errs=[]` |
| R-09 | 单文件冒烟 | `web/game.html` 进入 `fists`（`fist`、图标隐藏）与 `speedrun`（`300` / 「剩余 5:00」），`errs=[]` |
| R-10 | 线上 Pages 实测 | 线上脚本加载 `game.54285c08.js`；`fists` 空手状态、`poor` 金币拦截、`speedrun` 300→297 / 归零「时间到」、`firefly` +20 宝石均通过，`errs=[]` |

上一批通路验收（S-01～S-09）仍保留，证据见 `docs/revamp/p1/p1-special-all.png`、`p1-special-return.png`、`p1-special-locked.png`、`p1-special-win.png`、`p1-special-single.png`。

本批规则截图（960×540）：

- `docs/revamp/p1/p1-special-rules.png`：特殊覆盖层详情出现「限时 300 秒」
- `docs/revamp/p1/p1-special-fists.png`：赤手空拳战斗，HUD「赤手」、武器图标隐藏
- `docs/revamp/p1/p1-special-poor.png`：贫者之路「本关不掉金币」与升级掉落
- `docs/revamp/p1/p1-special-timeup.png`：商队速递「时间到」覆盖层，计时在右上
- `docs/revamp/p1/p1-special-timer-640.png`：640×360 下计时 HUD 与顶部 meta 不重叠
- `docs/revamp/p1/p1-online-fists.png`：线上赤手空拳
- `docs/revamp/p1/p1-online-poor.png`：线上贫者之路
- `docs/revamp/p1/p1-online-timeup.png`：线上商队速递「时间到」

已知边界：计时在 960×540 与 640×360 下验证（640 截图见 `p1-special-timer-640.png`），更窄 / 超宽视口尚未逐项验证；`noCoinPickup` 只验证直接 `dropItem`，未逐房间核对宝箱 / 商店 / 击杀的全部金币来源；`fists` 只验证近身 beast 与武器拦截，全部怪物碰撞、Boss、拳击音画与关卡平衡未逐项验证。

## 8. 未接规则

以下字段目前只参与条件 / 展示，尚未改变实际玩法，不能按「已完成」对外描述：

- `braziers`：熔炉核心没有火盆目标与点火交互。
- `noHitStage`：只作为入口条件，没有独立的无伤失败 / 记录。
- `resources`：商队遗骸以累计金币代理，不是本局资源。
- `loadout` 非空只强制第一把武器，未做多武器槽。
- 特殊星级统一一条 `sp_<id>:1`，不区分普通 / 噩梦 / 地狱；是否拆三档待拍板。

下一步建议：先评估 `braziers / noHitStage` 是否需要独立房间机制与失败记录，再决定 `resources` 是否值得做成本局资源；特殊关三档星级与 `loadout` 多武器槽需要先定口径再动代码。
