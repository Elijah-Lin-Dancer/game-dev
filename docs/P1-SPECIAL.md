# P1-A 特殊关卡通路（13 关）

目标：把 `web/data/chapters.json` 里已有、但此前不可达的 13 个特殊关卡接成「地图可见 → 条件可判 → 可进 Select / Play → 可结算 → 返回地图看到通关记录」的完整节点路径。

本批只做通路、条件、进入与结算；特殊关的独立玩法规则（限时、禁金币、火盆、无伤等）仍按文末「未接规则」保留，不伪装成已完成。

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

特殊关会派生一个伪章节：`chapterId = sp_<id>`、`stages = 1`、`key = sp_<id>:1`。房数 / 模板 / Boss 池 / 怪池 / 主题从所属章节派生；首房强制非 Boss，末房强制 Boss。`totalStars()` 改为只统计主线章节，特殊星不污染主线 ★。

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

## 4. 结算规则

- 首次通关写 `stars['sp_<id>:1']`，取历史最高星级。
- 首通 `prev === 0` 且该关有 `reward.gem` 时，只发一次宝石；重复通关显示「奖励已领取」。
- 特殊关不写 `tierStars`，不参与主线章节解锁与主线 ★。
- 通关返回后详情面板立即显示「已有通关记录」，卡片显示「已通」。

## 5. 已修复

**覆盖层引用跨场景重启残留。** Phaser 会复用同一个 Map 场景实例；从 Play 返回 Map 时，`this.specialBox` 仍指向上一次已销毁的对象，`openSpecial()` 里的 `if (this.specialBox) return` 会直接拦住 `pendingSpecial`。表现为：存档已有 `sp_firefly:1=3`，但返回后的详情仍显示「首通 +20 宝石」，卡片不显示「已通」。

修复：`MapScene.create()` 开头清空 `specialBox / specialCards / specialDetail / specialStart / specialSel / diffBox`，再走 `pendingSpecial`。这不是读档问题，存档写入一直正确。

## 6. 验收

构建：`dist/game.acaaf12d.js`（197 KB）+ `dist/assets.4a2b12f8.js`（95 KB）；单文件 `web/game.html` 1843 KB；`index.html` 指向 `game.acaaf12d.js`。

| 编号 | 检查 | 结果 |
|---|---|---|
| S-01 | 新档 `?reset` 打开特殊覆盖层 | 13 卡，5/5/3 居中；默认仅 `kunai` 可挑战 |
| S-02 | 全解锁种档打开 13 卡 | 13/13 可挑战，13 条条件文案与房数正确 |
| S-03 | 新档点锁卡 `cellar` | toast「条件未达成：击败 Boss 赤武士」；锁卡不进入 Select |
| S-04 | `firefly` 完整路径 | 覆盖层 → Select → Play → 强制通关 → +20 宝石 → 返回 Map 重开覆盖层 |
| S-05 | 13 关逐项进入与结算 | 13/13 进入 Select、Play，房数 / HUD 名称 / `sp_<id>:1=3` / 返回 Map 全通过 |
| S-06 | 首通后记录刷新 | `firefly` 返回后卡片「已通」，详情「已有通关记录」；重复通关不再发宝石 |
| S-07 | ESC 链 | 覆盖层 ESC 关闭；Select ESC 回 Map 并自动重开覆盖层；章节层 ESC 回 Title |
| S-08 | 单文件冒烟 | `web/game.html` 打开 Title→Map→特殊覆盖层，13 卡正常，`errs=[]` |
| S-09 | 错误监控 | 上述标准包与单文件测试均 `errs=[]` |

验收截图：

- `docs/revamp/p1/p1-special-all.png`：全解锁 13 卡
- `docs/revamp/p1/p1-special-return.png`：首通返回后的「已通 / 已有通关记录」
- `docs/revamp/p1/p1-special-locked.png`：锁卡 toast
- `docs/revamp/p1/p1-special-win.png`：特殊关结算
- `docs/revamp/p1/p1-special-single.png`：单文件冒烟

## 7. 未接规则

以下字段目前只参与条件 / 展示，尚未改变实际玩法，不能按「已完成」对外描述：

- `timer`：商队速递的 300 秒限时没有倒计时与失败结算。
- `noCoinPickup`：贫者之路仍会掉金币。
- `braziers`：熔炉核心没有火盆目标与点火交互。
- `noHitStage`：只作为入口条件，没有独立的无伤失败 / 记录。
- `resources`：商队遗骸以累计金币代理，不是本局资源。
- `fists`：`loadout.weapons=[]` 仍使用当前武器，「赤手空拳」尚无空手攻击。
- `loadout` 非空只强制第一把武器，未做多武器槽。
- 特殊星级统一一条 `sp_<id>:1`，不区分普通 / 噩梦 / 地狱；是否拆三档待拍板。

下一步建议：先补 `timer / noCoinPickup / fists` 这三个最容易被玩家当场看穿的规则，再评估 `braziers / noHitStage` 是否需要独立房间机制。
