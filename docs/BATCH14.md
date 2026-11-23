# 批 14：13 个额外关的条件、入口与首通奖励

> 2026-11-23。范围：支线 6 / 隐藏 3 / 条件 4。批 13 已把 13 关做成“地图可见 → 条件可判 → Select / Play → 结算 → 返回地图”的通路；本批把仍是代理或未消费的条件改成真实记录，并补首通奖励与存档字段。

## 1. 这一批实际改了什么

| 层 | 改动 |
|---|---|
| 存档 | `na.save` v8 → v9；新增 `resources / noHit / noRest / titles / flags`，旧档保留 `forge / blueprints` |
| 条件 | `resources` 改读 `save.resources`；`noHitStage` / `noRestInStage` 改读真实通关记录；`forge` 入口改 `clear:lava`，火盆变关内目标 |
| 记录 | `commitRun()` 在通关时写 `noHit[stageKey]` / `noRest[stageKey]`；无伤 = `hitsTaken===0`，无休整 = `!usedRest` |
| 资源 | 本局新增 `resourceCount`；拾取 `upg / key / heart` 各 +1，结算累加进 `save.resources` |
| 火盆 | `forge` 前 3 房各 1 处火盆；当前房火盆未点燃时门锁住，点燃后放行；HUD 显示 `火盆 n/3` |
| 奖励 | 首通宝石之外，补 `cellar` 图纸、`caravan` 商人线报、`ship` 第二技能折扣、`forge` 火焰附魔、`poor` 称号「贫者」；条件关补宝石 15 / 20 / 25 |
| 展示 | 地图详情第二行改为完整首通奖励文案；新增 `specialRewardLabel()`；结算覆盖层显示实际首通奖励 |

## 2. 三个语义拍板

1. **资源 = 本局拾取的强化道具 / 钥匙 / 回血。** 不把金币算成资源；金币仍只用于累计金币与锻造。宝箱“打开”不算拾取，只有实际进背包的掉落才 +1。这样 `商队遗骸` 的 `resources:30` 不再读 `save.coins`。
2. **`noHitStage` / `noRestInStage` 都是真实通关记录。** 每次通关写当前关键 `"章:关"` 或 `"sp_<id>:1"`；`ship` 只要任意一条 `noHit`，`cellar` 只数 `fort:` 前缀的 `noRest`，避免拿别的章的记录钻空子。
3. **`braziers` 是关内目标，不是入口条件。** 入口改成“通关熔岩地心”，进关后在 3 个房间点燃 3 处火盆；当前房未点燃时门锁住，点完才放行。这样不会出现“入口前无法完成”的死条件。

## 3. 13 关最终条件与奖励

| 类型 | 关 | 入口条件（实际读取） | 首通奖励 |
|---|---|---|---|
| 支线 | 萤火虫之森 | 竹林 15★ | +20 宝石 |
| 支线 | 旧堡地窖 | 见过赤武士 + 任一旧堡关未用篝火通关 | +25 宝石 + 图纸「巨剑」 |
| 支线 | 商队遗骸 | `save.resources ≥ 30` | +30 宝石 + 商人线报 |
| 支线 | 沉船货舱 | 任意一关无伤通关 | +35 宝石 + 第二技能折扣 |
| 支线 | 熔炉核心 | 通关熔岩地心 | +40 宝石 + 火焰附魔；关内点燃 3 火盆 |
| 支线 | 灰烬之后 | 通关终章 | +50 宝石 |
| 隐藏 | 无光回廊 | 累计 100★ | 无首通奖励 |
| 隐藏 | 镜之屋 | 沙海全三星 | 无首通奖励 |
| 隐藏 | 灰烬墓 | 通关无光回廊 | 无首通奖励 |
| 条件 | 苦无试炼 | 解锁苦无 | +15 宝石 |
| 条件 | 赤手空拳 | 通关旧堡 | +20 宝石 |
| 条件 | 贫者之路 | 累计金币 ≥200 | 称号「贫者」 |
| 条件 | 商队速递 | 通关沙海遗迹 | +25 宝石 |

首通奖励只发一次；重复通关覆盖层显示“奖励已领取”，宝石与图纸 / 称号 / 标记不重复入档。

## 4. 验收

| 编号 | 检查 | 结果 |
|---|---|---|
| R-01 | 条件未达全锁 | v9 种子 `stars={}`、`seen.bosses={}`、`resources=0`、`coins=0`、无 `noHit/noRest`、只解锁刀：13/13 `open=false`，详情分别显示 `本章星级 0/15`、`击败 Boss 赤武士 · 未用篝火通关 0/1`、`累计资源 0/30`、`无伤挑战 0/1`、`通关 熔岩地心`、`主线星级 0/100`、`解锁武器 苦无`、`累计金币 0/200` |
| R-02 | 条件达成全开 | 36 关全三星 + `sp_darkhall:1` + `seen samRed` + `noHit bamboo:1` + `noRest fort:1` + `resources 30` + `coins 300` + 全武器：13/13 `open=true`，无锁卡 |
| R-03 | 13 关首通奖励 | 逐关调用真实 `win()` 结算：首通宝石 20+25+30+35+40+50+0+0+0+15+20+0+25 = **260**；`blueprints=['bigsword']`；`flags={merchant,skillDiscount,fireEnchant}`；`titles=['poor']`；隐藏 3 关宝石不变 |
| R-04 | 重复首通 | `cellar` 二次结算：宝石 27 不变、图纸不重复、覆盖层「奖励已领取」；`sp_cellar:1=3` |
| R-05 | 无伤 / 无休整记录 | 竹林 1 关 `hitsTaken=0 / usedRest=false` → `noHit bamboo:1 / noRest bamboo:1`；竹林 2 关 `hitsTaken=1 / usedRest=true` → 两条均不新增；`ship` 的 `noHitStage` 仅凭 `bamboo:1` 开卡 |
| R-06 | 资源拾取与累计 | 实际掉 1 个 `upg` 并走到拾取：`resourceCount=1`；通关后 `save.resources` 0→1；不把金币算进资源 |
| R-07 | 火盆与门锁 | `forge` 3 个火盆房：未点燃时当前房门锁 `visible=true`，点燃后 1/3→2/3→3/3，门锁逐房放行；HUD `火盆 0/3 → 1/3`；3 处点满后 Boss 方向门全部打开 |
| R-08 | v8→v9 迁移 | v8 种子 `forge.katana=2`、`blueprints=['bigsword']`、`stars.bamboo:1=2` 保留；`v=9`、`resources=0`、`noHit/noRest={}`、`titles/flags=[]/{}` |
| R-09 | 960 / 640 / 单文件 | 特殊覆盖层 960×540、640×360 无溢出；单文件 1,970,730 B 内 13/13 开卡、`forge` 火盆点火、首通 +40 宝石 + `fireEnchant` 入档，`errs=[]` |
| R-10 | Pages 线上 | `https://elijah-lin-dancer.github.io/game-dev/` 入口 `game.7697c789.js` + `assets.76948dad.js`；13/13 全锁、13/13 全开；`forge` 点火 `0/3→1/3`；首次通关 +40 宝石 + `fireEnchant` 入档；`errs=[]`。首次加载约 30–35 秒（CDN 资源），加载完成后交互正常 |

截图：

- `docs/revamp/b14/b14-specials-locked-960.png`：13 卡全锁与各自条件文案
- `docs/revamp/b14/b14-specials-960.png`：全开，首卡「萤火虫之森」；`+20 宝石`
- `docs/revamp/b14/b14-specials-640.png`：640×360 特殊覆盖层，`forge` 详情不溢出
- `docs/revamp/b14/b14-forge-detail-960.png`：`forge` 详情「条件已达成 / +40 宝石 · 火焰附魔 · 火盆 ×3 · 未点满锁门」
- `docs/revamp/b14/b14-cellar-detail-960.png`：`cellar` 详情「+25 宝石 · 图纸 · 巨剑」
- `docs/revamp/b14/b14-brazier-unlit-960.png`：未点火盆、HUD `火盆 0/3`
- `docs/revamp/b14/b14-brazier-lit-960.png`：点燃后 `火盆 1/3`
- `docs/revamp/b14/b14-single-960.png`：单文件特殊覆盖层
- `docs/revamp/b14/b14-online-locked-960.png`：Pages 线上 13 卡全锁
- `docs/revamp/b14/b14-online-specials-960.png`：Pages 线上 13 卡全开

## 5. 已知边界

- R-03 的 13 关首通用场景的 `win()` 结算入口逐关调用，**没有逐关真实打到 Boss**；条件 / 奖励写盘路径与实战一致，但 13 关完整房流程仍建议后续补一次长跑。
- `forge` 只验证了火盆与门锁，未完整打穿 4 房 Boss；`fireEnchant` 目前只落 `flags`，实际附魔消费留给批 16（第二技能 / 元进度）。
- `resources` 目前只统计 `upg / key / heart`，不统计金币、宝箱开启、武器换装；若后续要“资源”扩展为草药 / 矿石，需要再改定义。
- `titles` 只落存档，Hall / 个人资料尚未展示称号；`poor` 称号当前在首通结算与存档可见。
- `merchant / skillDiscount / fireEnchant` 三个 flag 只落盘，尚未接 NPC 台词、第二技能价格或武器附魔。
- 特殊关星级仍统一一条 `sp_<id>:1`，不区分普通 / 噩梦 / 地狱；`loadout` 非空仍只强制第一把武器，多武器槽未做。
- `b14-brazier-*` 是 960×540 证据；640 下火盆 HUD 未单独截图，特殊覆盖层 640 已验。

## 6. 构建

- 逻辑：`dist/game.7697c789.js` 268,882 B
- 素材：`dist/assets.76948dad.js` 101,910 B
- 单文件：`web/game.html` 1,970,730 B
- 入口：`index.html` → `game.7697c789.js` + `assets.76948dad.js`
- 代码 / 构建本地提交：`6945e64`
- 线上入口：`https://elijah-lin-dancer.github.io/game-dev/`；Pages 构建 `38940e2`，入口 `game.7697c789.js` + `assets.76948dad.js`
- 本地 / 单文件全程 `errs=[]`；本轮未接新的 3D 素材，保留批 13 的 126 切片图集。
