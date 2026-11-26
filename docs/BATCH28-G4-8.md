# 批 28 · G4-8 长明芯资源解耦

## 1. 结论

G4-8 修的是 G4-6 留下的真实体验缺陷：阿烬的「长明芯」一直借阿芦的 `mireHerbs`，两条委托同时 active 时，先交长明芯会消耗 3 束灯芯草，抢走阿芦的资源。本轮把长明芯拆成独立 `lampHerbs`，并补 3 个专属「长明芯草」节点；不改委托数值、不加 Boss / 成就 / 屏。

- `QUEST_PROFILE.lamp.herbSave` 从 `mireHerbs` 改为 `lampHerbs`；阿芦仍只用 `mireHerbs`。
- 新增 3 个专属采集节点：`mire-4` 2 个、`mire-5` 1 个；只在 `lampQuest active` 且不足 3 束时出现，`done / none` 隐藏。
- `na.world` 升 **v16**；新增 `lampHerbs`（默认 0 / 上限 99）。v15 旧档若 `lampQuest active`，最多把已有的 `mireHerbs` 折 3 束进 `lampHerbs`，不让玩家白跑；`mireHerbs` 原样保留。
- `world.json` 升 **v12**；`lampQuest { need3 / yield1 / reward4 }` 不变，长明芯仍是一次性 3 束 / 4 碎片。
- HUD 在 `mire-4 / mire-5 / mire-6` 的 `lampQuest active` 态改显「长明芯 N/3 · 采集 / 可交付」，避免玩家看着「灯芯草 0」采长明芯。
- 仍 **36 屏 / 6 群系 / 13 委托 / 6 Boss / 24 成就 / 7 NPC**；图集仍 **175 切片**，没有新增美术。

## 2. 行为合同

| 场景 | 入口 | 期望 |
|---|---|---|
| 未接长明芯 | `lampQuest none` 进 `mire-4 / mire-5` | 3 个长明芯节点均隐藏；阿芦的 `mireHerbs` 采集不受影响 |
| 接取长明芯 | `mire-6` 阿烬 offer 走完 | `lampQuest active`；3 个节点全部出现；HUD 显「长明芯 0 · 采集 0/3」 |
| 采长明芯草 | 靠近节点按 E，读条 2s | `lampHerbs +1`；`mireHerbs` 不变； toast「采到长明芯草 ×1」；HUD「长明芯 1 · 采集 1/3」 |
| 采普通灯芯草 | 靠近普通 `mireHerb` 按 E | `mireHerbs +2`（原 `mireQuest.yield=2`）；`lampHerbs` 不变；HUD 长明芯计数不涨 |
| 集满 3 束 | `lampHerbs 3` | 剩余节点隐藏；`mire-6` HUD「长明芯 3 · 可交付 3/3」；提示「长明芯够了 · 找阿烬交付」 |
| 交付长明芯 | 阿烬面板第一行 | `lampHerbs 3→0`；`mireHerbs` 原值不动；`tokens +4`；`lampQuest done`；归水灯暖灯 /「归水灯 · 长明」沿用 G4-7 |
| 先交阿芦 | `mireQuest active / mireHerbs 7`，先交阿芦 | `mireHerbs 7→0`；`lampHerbs` 仍 3；长明芯仍可交付 |
| 先交阿烬 | 两条委托同时 active，先交阿烬 | `lampHerbs 3→0`；`mireHerbs` 仍 7；阿芦仍可交付 |
| 完成 / 重燃 | `lampQuest done`；`rekindleExpedition` | 节点隐藏；重燃保留 `lampQuest done` / `lampHerbs` 不被重置；只重置六 Boss |
| 旧档迁移 | v15 `lampQuest active / mireHerbs 3` | `v16`；`lampHerbs 3`；`mireHerbs 3` 保留；不需要重新采 3 束 |
| 640 / 844 / 单文件 / PWA | 响应式与离线 | 节点、金色光点、HUD、提示均可用；无横向溢出；`errs=[]` |

## 3. 实现

- `src/systems/worldSave.js`
  - `VERSION 15 → 16`；`defaults` 新增 `lampHerbs: 0`。
  - `migrate`：`lampHerbs = min(99, round(num(old.lampHerbs, old.lampQuest === 'active' ? min(num(old.mireHerbs), 3) : 0)))`；旧 v15 active 档最多折 3 束，`mireHerbs` 不扣。
  - `patchWorldSave` 新增 `lampHerbs` 清洗 / 99 上限；其余字段不变。
- `web/data/world.json`
  - `version 11 → 12`。
  - `mire-4` 新增 `lampHerbs: [[100,226],[380,222]]`；`mire-5` 新增 `lampHerbs: [[390,218]]`。
  - `lampQuest` 数值不变：`need 3 / yield 1 / rewardTokens 4`。
- `src/scenes/world.js`
  - `QUEST_PROFILE.lamp`：`herbSave='lampHerbs'`、`item='长明芯草'`、`respawn='一束长明芯草重新抽芽了'`；阿芦 `QUEST_PROFILE.mire` 不动。
  - `normalizeWorld` 读取 `s.lampHerbs`；`create` 在 `buildHerbs()` 后调 `buildLampHerbs()`。
  - `buildLampHerbs()`：专属节点复用 `mireHerb` 64×64 帧，`scale 1.35`、`tint 0xffb35c`、暖色 `lampGlow` 光晕、2px 上升金色光点；prompt「E 采长明芯草」；`lampOnly=true`。
  - `lampHerbAvailable()`：仅 `lampQuest active` 且 `lampHerbs < 3` 时可用；`refreshLampHerbs()` 在接取 / 交付 / 重燃时统一切换可见态；`updateRespawns()` 90s 重生，但 `done / 满 3` 不再放回。
  - `completeGather()`：`node.lampOnly` 走独立分支，只写 `lampHerbs`；普通 `mire` 节点仍走 `mireHerbs`。
  - `updateHud()`：`lampScreen` 扩到 `mire-4 / mire-5 / mire-6`；`lampQuest active` 时 `count` 读 `lampHerbs`，HUD 文案「长明芯 N · 采集 / 可交付」。
  - `hudHintText()` / `lampkeeperTalk()`：长明芯计数、还差几束、offer 文案全部改读 `lampHerbs`，并把「灯芯草」改称「长明芯草」。
  - `deliverQuest()`：`herbKey=prof.herbSave` 自动扣 `lampHerbs`；lamp 交付后 `refreshLampHerbs()` 隐藏剩余节点。
  - `rekindleExpedition()`：`rekindleWorldSave()` 后 `refreshLampHerbs()`；`lampQuest done` 与 `lampHerbs` 不重置。
- `src/systems/ui/tokens.js`
  - 复用已有 `lampGlow 0xffc46a`，不新增颜色。

## 4. 数据 / 坐标

| 屏 | 屏名 | 长明芯节点 | 普通灯芯草（阿芦） |
|---|---|---|---|
| `mire-4` | 雾泽 · 灯沼 | `[100,226]`、`[380,222]` | `[140,226]`、`[300,216]`、`[430,222]` |
| `mire-5` | 雾泽 · 无岸 | `[390,218]` | `[180,222]`、`[340,208]`、`[460,226]` |

- 节点坐标避开 `mire-6` Boss 场；`mire-4` 的 `[380,222]` 在温泉池中，符合灯沼地貌；`mire-5` 的 `[390,218]` 在池外干地，避免与芦苇 / 岩石重叠。
- 专属节点与普通节点可同时可见，但用暖金 tint + 2px 金色光点 + 「E 采长明芯草」区分；不新增图集切片。

## 5. 实测

测试脚本 `/tmp/g48.py`，**38/38 PASS**：

| 项 | 结果 |
|---|---|
| v15 → v16 | `v=16`；`lampQuest active / mireHerbs 3` 迁移后 `lampHerbs=3`，`mireHerbs` 仍 3 |
| 上限清洗 | v16 `lampHerbs 999` 读档后 `99` |
| 节点数量 / 隐藏 | 3 个专属节点（`mire-4` 2、`mire-5` 1）；`lampQuest none` 全部 `active=false / visible=false` |
| 接取 | `mire-6` offer 走完 `lampQuest active`；3 节点全部 active / visible；HUD「长明芯 0 · 采集 0/3」 |
| 采专属草 | `mire-4` 采 1 束：`lampHerbs 0→1`、`mireHerbs 0`；HUD「长明芯 1 · 采集 1/3」 |
| 采普通草 | `mire-4` 普通节点：`mireHerbs 0→2`、`lampHerbs 0`；长明芯 HUD 仍 0 |
| 集满 3 束 | 跨 `mire-4 / mire-5` 采 3 束：`lampHerbs 3`、`mireHerbs 0`；剩余节点隐藏；`mire-6` HUD「长明芯 3 · 可交付 3/3」 |
| 先交阿烬 | 双 active / `lampHerbs 3 / mireHerbs 7`：交付后 `lampHerbs 0`、`mireHerbs 7`、`tokens 20→24`、暖灯 `emitting=true` |
| 先交阿芦 | 先交阿芦：`mireHerbs 7→0`、`lampHerbs` 仍 3；随后长明芯仍可交付 `done / lampHerbs 0` |
| 640 / 844 / 960 | `scrollWidth` 分别 640 / 844 / 960；节点可见、无溢出 |
| 单文件 | `file://…/web/game.html?world&debug` 节点可见、prompt「E 采长明芯草」 |
| PWA | `na-b18-44effc2c` / 12 条；断网 reload 后节点仍可见 |
| done / 重燃 | `lampQuest done` 节点隐藏；`rekindleExpedition` 后 `lampQuest done` 保留、节点仍隐藏 |
| 页面错误 | `errs=[]` |

回归：

- `/tmp/g47.py` **22/22**、`/tmp/g47-deliver.py` **11/11**（G4-7 立绘 / 暖灯 / 走屏 / 重燃）。
- `npm run smoke` **9 PASS**。
- `python3 tools/audit_scale.py` **221 INSTANCES / 0 FAIL**，长明芯草复用 `mireHerb`，无新增审计实例。
- G4-6 的旧测试基线按共享 `mireHerbs` 编写，已被 G4-8 的独立资源合同取代；本轮不把旧 `g46` 数字混入新验收。G4-8 的 38 项已覆盖接取 / 采集 / 面板 / 交付 / 双委托顺序 / 迁移。

## 6. 构建

- 首屏 **1914 KB / 2.00 MB（gzip 726 KB）**
- `dist/game.ed616f54.js` **386,447 B**
- `dist/assets.40dfdad3.js` **132,403 B**
- 单文件 `web/game.html` **2,045,077 B**
- `web/fonts/game.woff2` **133,712 B**
- 图集 `web/atlas/core.png` **123,697 B / 175 切片**
- PWA `sw.js` **`na-b18-44effc2c`**
- `index.html` 入口 `game.ed616f54.js + assets.40dfdad3.js`

## 7. 改动文件

- `src/scenes/world.js`
- `src/systems/worldSave.js`
- `web/data/world.json`
- `index.html`、`sw.js`、`web/game.html`、`web/fonts/game.woff2`、`web/atlas/core.png`（构建产物；图集二进制未变）
- `dist/game.ed616f54.js`、`dist/assets.40dfdad3.js`（替换 G4-7 的 `game.c78659be.js` / `assets.14770575.js`）
- `docs/revamp/g4-8/` 10 张本地证据

## 8. 风险 / 回退

- **旧档折算**：v15 active 档最多补 3 束；若玩家原有 `mireHerbs` 很多，会多出 3 束长明芯，但阿芦的 `mireHerbs` 不扣，不改变阿芦进度。若不做折算，已攒 3 束的玩家会被迫重采，体验更差。
- **节点位置**：`mire-4 [380,222]` 在温泉池中，`mire-5 [390,218]` 在池外；两者都避开 `mire-6` Boss 场。若后续调整 `mire-4 / mire-5` 的 props / pools，需要重看节点是否被摆件遮挡。
- **视觉区分**：专属节点复用 `mireHerb` 并加暖金 tint / 光点；没有新增 3D 件，符合本轮“只解耦资源”的范围。若后续要做独立 3D 长明芯草，只替换 `buildLampHerbs` 的 sprite，不动存档 / 委托。
- **HUD 优先级**：`mire-4 / mire-5` 在长明芯 active 时 HUD 让给长明芯，阿芦的 `mireHerbs` 计数在这两屏不显示；阿芦委托的交付仍在 `mire-3`，不影响交付判断。若后续要求同屏双计数，需要再加一行 HUD。
- **回退**：将 `QUEST_PROFILE.lamp.herbSave` 改回 `mireHerbs`，删除 `lampHerbs` 字段 / 节点 / `buildLampHerbs` / `refreshLampHerbs`，`world.json` 删除 `lampHerbs` 并回 v11；G4-7 视觉与 G4-6 委托数据不受影响。

## 9. 证据（本地）

- `docs/revamp/g4-8/g4-8-lamp-herb-960.png`：`mire-4` 长明芯草 + 暖金光点 + prompt
- `docs/revamp/g4-8/g4-8-lamp-herb-mire5-960.png`：`mire-5` 长明芯草 + 「长明芯 0 · 采集 0/3」HUD
- `docs/revamp/g4-8/g4-8-lamp-herb-640.png` / `g4-8-lamp-herb-844.png`
- `docs/revamp/g4-8/g4-8-lamp-herb-single-960.png` / `g4-8-lamp-herb-pwa-960.png`
- `docs/revamp/g4-8/g4-8-offer-960.png`：阿烬 offer 入口
- `docs/revamp/g4-8/g4-8-choice-960.png`：交付面板「3 束长明芯草」
- `docs/revamp/g4-8/g4-8-hud-3of3-960.png`：`mire-6` HUD「长明芯 3 · 可交付 3/3」
- `docs/revamp/g4-8/g4-8-delivered-960.png`：交付后 `done / tokens +4` + 暖灯

## 10. Pages 线上验收

- 推送 `5ab6403..2569103`；Pages 入口同步为 `game.ed616f54.js` + `assets.40dfdad3.js`。
- `world.json v12`：`lampQuest { id:'lampCore3', need:3, yield:1, rewardTokens:4 }`；3 个 `lampHerbs` 节点（`mire-4` 2 / `mire-5` 1）。
- 线上 **28/28 PASS**：v12 数据 / 3 节点 / `none` 隐藏 / 接取 active / 3 节点出现 / HUD 0/3 / 专属草 +1 且 `mireHerbs` 0 / HUD 1/3 / `mire-5` 节点 / 跨屏集满 3 / 3 束后节点隐藏 / `mire-6` HUD 3/3 / 先交阿烬 `lampHerbs 0 + mireHerbs 7 + tokens20→24 + 暖灯` / 先交阿芦 `mireHerbs 0 + lampHerbs 3` 且长明芯仍可交付 / 640·844 无溢出且节点可见 / PWA `na-b18-44effc2c` 断网节点可见 / `errs=[]`。
- PWA 断网：`set_offline(true)` reload 后仍进 `mire-4`，长明芯草节点与「E 采长明芯草」可用；阿烬 offer / 暖灯沿用 G4-7。
- 线上证据：`docs/revamp/g4-8/g4-online-lamp-herb-960.png`、`g4-online-lamp-herb-mire5-960.png`、`g4-online-lamp-herb-640.png`、`g4-online-lamp-herb-844.png`、`g4-online-lamp-herb-pwa-960.png`、`g4-online-lamp-hud-3of3-960.png`、`g4-online-lamp-herb-delivered-960.png`。
