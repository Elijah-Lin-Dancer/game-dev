# 批 13：归途小屋（出发台 / 锻造坊 / 训练场 + 3 NPC）

日期：2026-11-23
状态：已推送 `712d2c3`（代码 / 构建）+ `4582ce6`（文档 / 截图）到 `origin/main`；Pages 已切到 `game.f2323f2e.js` + `assets.cf4685ab.js`，线上小屋 / 锻造 / 训练 / NPC 实测通过，`errs=[]`。运行时仍不接 ink-studio，3D 件只作为离线 PNG 进图集。

## 1. 交付内容

| 模块 | 文件 | 做法 |
|---|---|---|
| 锻造数值 | `src/systems/forge.js` | Lv.1–4 纯函数；倍率 1.00 / 1.20 / 1.35 / 1.50，费用 0 / 60 / 140 / 260；普通锻造 `FORGE_MAX=3`，Lv.4 需图纸；`applyForgeLevels()` 乘进 `dmgMul` 并保留 `forgeRawDmgMul / forgeLv` |
| 存档 | `src/systems/save.js` | `na.save` 升 v8；新增 `forge:{}`（只存 Lv.2–4）与 `blueprints:[]`；`sanitizeForge / sanitizeBlueprints` 只收 6 把已知武器；`patchSave` 同步清洗；v7 旧档迁移不丢字段 |
| NPC 数据 | `src/systems/npc.js` | `guide / smith / merchant`；引路人“守夜人 · 主线”、铁匠“前朝铸剑师 · 锻造”、商人“沙海幸存者 · 入伙”；按 `wins / stars / forge` 切 2 行台词 |
| 小屋页 | `src/scenes/hall.js` | 四页签 `武器 / 角色 / 图鉴 / 小屋`；顶层三卡 200×88，NPC 三卡 200×126；锻造 600×250、训练 600×230、NPC 560×200；统一 `modalFrame` 遮罩 / 面板 / 关闭层 |
| 战斗接入 | `src/scenes/play.js` | `normalizeWeapons` 后调用 `applyForgeLevels(this.W, this.meta)`，再选起始武器 / 掉落池；锻造对所有武器生效，不只是当前手持 |
| 3D 素材 | `art-src/hub/` + `tools/build.mjs` | 5 个 ink-studio 离线源：`guide / smith / merchant / anvil / dummy`；正面帧裁到 64×64 进图集；图集 121→126 切片 |
| 正式素材 | `assets/01-primary/hub/` | `npc-guide.png / npc-smith.png / npc-merchant.png / forge-anvil.png / train-dummy.png` 全 64×64 RGBA；`ink-studio-LICENSE.txt` 为 MIT 原文 |
| 可复现 | `art-src/hub/render-hub.cjs`、`tools/crop_hub.py` | 固定 `INK_STUDIO` 路径、固定 seed / 朝向 / 裁切；源图集在 `docs/revamp/b13-3d/` |

## 2. 规则

- 锻造费用从累计金币扣；金币不足只弹 toast，不改存档。
- 普通锻造 Lv.3 封顶；Lv.3 再点显示「图纸未获得」并禁用，不会扣钱。
- `blueprints` 有对应武器 id 时才允许 Lv.4；本次只提供数据层与 UI 锁，正式图纸掉落留给批 14/15。
- 训练场只读：不写存档、不扣金币；按武器 `cd` 自动挥击 4 秒，末帧显示 `4.0s · 击数 · 总伤 · DPS`。
- NPC 对话只读：打开不暂停世界、不改存档；ESC / 右键 / 关闭按钮只关当前弹层，关闭后可继续点锻造 / 训练 / 出发台。
- 小屋页顶部三卡：出发台 `Enter 出发`、锻造坊 `金币升级 Lv.1–3 / 图纸开 Lv.4`、训练场 `木桩 DPS · 4 秒试挥 / 试武器与锻造加成`。
- 图鉴仍是原三页内容；小屋是第四页，不改变原有 1/2/3 键盘行为。

## 3. 验收 Q1 / Q2 / Q3

### Q1 锻造落盘生效：通过

- 初始 v7 档：`{v:7, coins:300, gem:30, chars:['ninja','mage','knight'], unlockedWeapons:['katana','bigsword','hammer','bow','wand','kunai']}`。
- 打开锻造坊，实际点击第一张卡「升级 Lv.2 · 60」：
  - `meta` 变 v8；
  - 金币 `300 → 240`；
  - 存档 `na.save` 为 `{"v":8,"coins":240,"forge":{"katana":2}}`。
- **刷新页面后**再读：`{v:8, coins:240, forge:{katana:2}}`，说明不是只改了场景内对象。
- 进入 Play（`char:'ninja'`，起始忍者刀）：`wdmg()=4`；忍者刀基础 3 × 1.20 = 3.6，取整 4。
- 额外路径：
  - Lv.2→Lv.3：500→440→300，`forge.katana=3`；Lv.3 按钮变「图纸未获得」，再点不扣钱。
  - 预置 `blueprints:['katana']`：300→40，`forge.katana=4`；Play `wdmg()=5`（3 × 1.50 = 4.5，取整 5）。

### Q2 DPS 可读：通过

- 训练场选忍者刀 Lv.2，点「开始 4 秒试挥」：
  - 进行中：`试挥中… 忍者刀 · 每 280ms 一击`；
  - 结束：`4.0s · 14 击 · 总伤 56 · DPS 14.0`。
- 结束判定改为“击数达到 `floor(4000/cd)` 即收尾”，不再依赖单独的 `delayedCall`；因此无头环境 timer 被 rAF 拖慢时也不会停在「试挥中」。
- 本机无头 Chromium 的 4 秒按游戏时间计，测试脚本等待 7 秒是为了覆盖 rAF 上限；正常 60fps 下 14 击在 3.92 s 收尾。

### Q3 对话不挡操作：通过

- 点引路人 `(100,240)`：`modalOpen=true`，标题「引路人」、副标「守夜人 · 主线 · ESC / 右键关闭」，两行台词、结束交谈。
- 按 ESC：`modalOpen=false`；随后点锻造坊 `(320,116)`：`modalOpen=true` 且出现「升级 Lv.2 · 60」，说明弹层没有残留阻塞输入。
- 同样实际点开铁匠 / 商人并关闭；三者均能打开、关闭、回到小屋页。

## 4. 视觉门禁

- 960×540：小屋三张顶卡与三张 NPC 卡不重叠；锻造坊三列六卡、训练场左木桩右武器、NPC 560×200 均完整可见。
- 640×360：小屋页、锻造坊、训练场、NPC 弹层均无溢出；右键 / ESC 关闭后焦点回到页签。
- 3D 件在 48 / 72 px 显示尺寸下剪影可读：引路人的灯笼、铁匠的锤、商人的兜帽、铁砧、木桩的靶心均可辨认。
- 3D 源图集保留 4 向（NPC）与单向（摆件），但 Hall 只用正面裁切；不在运行时加载 11.2 MB 浏览器 bundle。

## 5. Pages 线上（2026-11-23）

- 推送：`38041fb..4582ce6` 到 `main`；远端 head `4582ce6a4a03c4f9900fe84de79c0181229d1263`。
- Pages 入口：`game.f2323f2e.js` + `assets.cf4685ab.js`；线上实际加载命中这两个文件。
- 线上 Playwright 种子 v8 档（300 金币、全武器）：
  - Hall 第 4 页签：`小屋 / 出发台 / 锻造坊 / 训练场 / 引路人 / 铁匠 / 商人` 全部出现；
  - 锻造 300→240，`forge.katana=2`；
  - 训练 `4.0s · 14 击 · 总伤 56 · DPS 14.0`；
  - 引路人打开 / ESC 关闭后再开锻造坊成功；
  - `errs=[]`。
- 截图：`docs/revamp/b13/b13-online-hub-960.png`、`b13-online-forge-960.png`、`b13-online-train-dps-960.png`、`b13-online-npc-960.png`。

## 6. 构建

| 项 | 值 |
|---|---|
| 逻辑 | `dist/game.f2323f2e.js` 265,105 B |
| 素材数据 | `dist/assets.cf4685ab.js` 101,724 B |
| 图集 | `web/atlas/core.png` 181,071 B / 126 切片 |
| 字体 | `web/fonts/game.woff2` 133,360 B |
| 单文件 | `web/game.html` 1,966,839 B |
| 入口 | `index.html` 指向 `game.f2323f2e.js` + `assets.cf4685ab.js` |

单文件冒烟：`web/game.html` 启动 Title → Hall，按 4 进入小屋，`小屋 / 出发台 / 锻造坊 / 训练场 / 引路人 / 铁匠 / 商人` 全部出现，`errs=[]`。

## 7. 截图

- 小屋：`docs/revamp/b13/b13-hub-960.png`、`b13-hub-640.png`
- 锻造：`docs/revamp/b13/b13-forge-960.png`、`b13-forge-lv2-960.png`、`b13-forge-640.png`
- 训练：`docs/revamp/b13/b13-train-960.png`、`b13-train-dps-960.png`、`b13-train-640.png`
- NPC：`docs/revamp/b13/b13-npc-960.png`、`b13-npc-640.png`、`b13-npc-smith-960.png`、`b13-npc-merchant-960.png`
- 单文件：`docs/revamp/b13/b13-single-960.png`
- 线上：`docs/revamp/b13/b13-online-hub-960.png`、`b13-online-forge-960.png`、`b13-online-train-dps-960.png`、`b13-online-npc-960.png`
- 3D 源：`docs/revamp/b13-3d/hub-contact-sheet.png` 及 5 组 `*-atlas.png/json`

共 17 张（13 张本地 / 单文件 + 4 张线上）。

## 8. 已知限制 / 下一步

- Lv.4 图纸只有字段、锁定态和测试密钥；正式图纸掉落尚未接入（批 14 支线 / 批 15 剧情）。
- 3D NPC 目前是静态正面头像，不进 Play 行走帧；后续剧情头像 / 过场可复用同源图集。
- 训练 DPS 是新档基准 UI，不参与战斗结算；实际伤害仍以 Play `wdmg()` 为准。
- Pages 线上已补验，入口哈希与交互见第 5 节；G1 世界场景的线上冒烟另见 `docs/G1.md`。
