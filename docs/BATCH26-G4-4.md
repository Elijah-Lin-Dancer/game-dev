# 批 26 / G4-4：星火重燃「二次确认 · 周目回报」

> 2026-11-26。G4-3 已把六 Boss 终局收束到「归水灯 → 星火重燃」，但留下两个最明显的未决：**重燃点击即重置，没有确认**；**周目只加难度，不加奖励**。本轮不加屏、不加 Boss、不加成就，只补这两个终局体验缺口。
>
> **前置核对**：用户要求“继续吧，别忘了先 push”。开工前确认 `main = origin/main = 005d954`、工作树干净；G4-3 已在线，不需要补推。随后在本地继续 G4-4。
>
> **自主决策声明**：用户没有指定新范围。按此前“大方向内自主决策”的授权，本轮把范围定为「重燃安全确认 + 周目碎片回报」；名称、文案、确认交互与 `+1 / 周目` 的奖励曲线均为主 Agent 自主选定，尚未经用户逐项视觉验收。若否决，按第 8 节回退。

## 1. 结论

| 项 | 结果 |
|---|---|
| 终局二次确认 | 第一次点「星火重燃」只进入确认态：按钮改为「确认重燃 · 第 N 次远征」，弹出提示，**不重置六 Boss**；第二次点才真正重燃 |
| 篝火入口 | allDone 的篝火面板同样两步确认：副标题显示“重燃会重置六 Boss · 碎片 / 委托 / 成就保留”，第一次点击把副标题改为金色「再点一次确认 · 六 Boss 会重置」 |
| 取消 / 关闭 | 关闭胜利面板、关闭篝火面板、离开场景都会清掉确认态；不会留下“下一次点一下就重置”的悬空状态 |
| 周目奖励 | `rewardTokens = min(20, 基础碎片 + (tier - 1))`；第 1 周目保持原值，tier2 每只 Boss +1 |
| 结算文案 | 普通胜利 / 终局胜利都显示实际碎片；有周目加成时追加「（周目加成 +N）」 |
| 存档 | `na.world v14` 不变；`expedition` 仍为 1–99；本轮没有新增字段 |
| 数据 / 美术 / 成就 | `world.json` v10 不变；**无新增图集切片**；成就仍 **24 条** |

## 2. 重燃二次确认

### 2.1 状态

`world.js` 新增场景态：

- `this.rekindleArmed`：是否已进入确认态；
- `this.rekindleLabel`：当前面板上「星火重燃 / 确认重燃」按钮文字对象；
- `this.rekindleHint`：篝火面板副标题文字对象。

这些状态只属于当前场景，不入 `na.world`。关闭面板 / 离开 / 重新打开都会复位。

### 2.2 终局面板

```
finishBoss → allDone
  → showVictory(reward, true, newAch)
    → 按钮 2：「星火重燃 · 第 N 次远征」
    → onClick requestRekindle('finale')

requestRekindle('finale')
  → 未 armed：
      armed = true
      按钮文字：确认重燃 · 第 N 次远征
      toast：再点一次确认 · 六 Boss 会重置 · 碎片 / 委托 / 成就保留
      return（不写档）
  → 已 armed：
      armed = false
      rekindleExpedition()
```

- 第一次点击后 `save.expedition` 仍为原值，六 Boss 仍全部 `done`；第二次点击才调用 `rekindleWorldSave()`。
- 终局按钮区高度仍为 **74**，面板总高仍为 **218**；确认态只改文字，不扩面板。
- 如果玩家第一次点完又点「回到小屋」，场景离开，不会重燃；如果按 ESC / 右键关闭胜利面板，`closeVictory()` 会清 `armed`。

### 2.3 篝火面板

allDone 时 `openTravel()` 的副标题从通用说明改为：

> 重燃会重置六 Boss · 碎片 / 委托 / 成就保留

第一次点击「星火重燃」：

- 按钮文字改为「确认重燃 · 第 N 次远征」；
- 副标题改为金色「再点一次确认 · 六 Boss 会重置」；
- 面板保持打开，行数仍为 **8 行**。

第二次点击：

```
requestRekindle('travel')
  → armed = false
  → closePanel()
  → rekindleExpedition(true)
```

- 不再用 toast 压住篝火面板标题；警示放在面板副标题内，960 / 640 都不遮字。
- 关闭面板（`留在原地` / ESC）会清 `armed` 与文字引用。

## 3. 周目碎片回报

### 3.1 公式

```js
const tier = clamp(save.expedition || 1, 1, 99);
const scaledReward = Math.min(20, def.rewardTokens + Math.max(0, tier - 1));
```

- 第 1 周目：草原 Boss `3`、雾泽 `6` 等全部保持原值；
- 第 2 周目：草原 Boss `3 → 4`，雾泽 `6 → 7`；
- 上限 20，避免高周目无限膨胀。

### 3.2 结算

`showVictory` 读取 `def.rewardTokens` 作为基础值，计算：

```js
const rewardBonus = Math.max(0, reward - baseReward);
```

正文：

- 无加成：`苔背巨兽倒下，星火碎片 +3。`
- 有加成：`苔背巨兽倒下，星火碎片 +4（周目加成 +1）。`

终局面板同样按实际碎片显示，不会把周目加成藏掉。

## 4. 实测

| 场景 | 结果 |
|---|---|
| 终局面板 | 预置其余 5 只 done、`mireWraith none`；点灯、击杀；`rows=2 / fillH=74`；按钮初始「星火重燃 · 第 2 次远征」 |
| 第一次点重燃 | `expedition=1 / armed=true / label="确认重燃 · 第 2 次远征"`；六 Boss 仍全 `done`；`tokens=26` 未变 |
| 第二次点重燃 | `expedition=2 / screen=0 / 六 Boss none / tokens=26`；HUD「远征 · 村口 · 周目 2」 |
| 关闭胜利 | 第一次点完再 `closeVictory()`：`expedition=1 / armed=false / mireWraith=done`，没有误重置 |
| 篝火确认 | allDone 960：8 行；第一次点后 `armed=true / label="确认重燃 · 第 2 次远征" / 副标题="再点一次确认 · 六 Boss 会重置"`；`panel` 仍开 |
| 篝火取消 | 第一次点后 `closePanel()`：`expedition=1 / armed=false / panel=false` |
| 640 篝火 | 连点两次：`expedition=2 / panel 关闭 / scrollWidth=640`；回到村口 |
| tier2 草原 | `tier=2 / reward=4 / maxHp=72`；击杀后 `tokens 20→24`，结算含「周目加成 +1」 |
| tier2 雾泽 | `tier=2 / reward=7 / maxHp=116`；E 后 Boss 唤醒 |
| 640 / 844 | 640 终局面板 `scrollWidth=640`；844 终局确认态 `scrollWidth≤844`，按钮与提示无溢出 |
| 单文件 | `file://` 单文件 gate 休眠；E、击杀、第一次点重燃进入确认态，`rows=2` |
| PWA 离线 | `na-b18-ae4a669e` controller；断网 reload 后 `applyScreen(35)`，gate 存在且 `bossActive=false` |
| 回归 | v13→v14、gate 休眠、E 唤醒 `104/tier1`、tier2 gate `116/6`、六 Boss 重燃、640 / 844 几何均通过 |

测试脚本：

- `/tmp/g44.py`：14 / 14 PASS；
- `/tmp/g44-reg.py`：6 / 6 PASS（v13→v14、844、单文件、PWA）；
- `/tmp/g44-disarm.py`：终局 / 篝火关闭复位，PASS。

## 5. 构建

| 项 | 数值 |
|---|---|
| 首屏预算 | **1903 KB / 2.00 MB（gzip 723 KB）** |
| 图集 | **123,265 B / 174 切片（无新增）** |
| 游戏逻辑 | `dist/game.9d324e8d.js` **375,789 B** |
| 素材数据 | `dist/assets.8c75570a.js` **132,049 B** |
| 单文件 | `web/game.html` **2,033,573 B** |
| 字体 | `web/fonts/game.woff2` **133,776 B**（构建重生成） |
| PWA | `na-b18-ae4a669e` |
| 冒烟 / 审计 | `npm run smoke` **9 PASS**；`audit_scale.py` **220 / 0 FAIL** |

## 6. 改动文件

- `src/scenes/world.js`：重燃二次确认状态 / `requestRekindle`、篝火副标题警示、周目奖励缩放、胜利结算加成文案；
- 构建：`dist/game.9d324e8d.js`、`dist/assets.8c75570a.js`、`index.html`、`sw.js`、`web/game.html`、`web/fonts/game.woff2`；
- 文档：本文件、`docs/ACCEPTANCE.md` W-142–W-146、`LEDGER.md`、`CURRENT.md`、`docs/OPENWORLD.md`；
- 证据：`docs/revamp/g4-4/` 8 张本地截图。

## 7. 未决 / 风险

| 项 | 现状 | 后续 |
|---|---|---|
| 确认交互 | 两步点击，不是独立确认弹窗；触屏同样可用 | 若用户要“确认框 + 取消按钮”，再加独立 modal |
| 奖励曲线 | 每多一周目每只 Boss +1，上限 20 | 高周目 / 多轮经济未长跑；可改 `scaledReward` |
| 难度曲线 | 仍为 `hp +12% / 周目`、`dmg +1 / 2 周目`，只实测 tier2 | 更高周目需另测平衡 |
| 重燃范围 | 仍只重置六 Boss，保留碎片 / 委托 / 采集 / 成就 | 若重置更多，改 `rekindleWorldSave` |
| `mire-6` NPC | 仍无 NPC，归水灯是静态交互物 | 下一轮可做守灯人 |
| 成就 | 仍 24 条；没有「重燃」成就 | 若要加，需扩 Hall 成就页布局 |
| 视觉验收 | 「确认重燃」「周目加成」文案与交互未逐项验收 | 等用户确认 |

## 8. 回退

- **只回退二次确认**：终局第二按钮改回 `() => this.rekindleExpedition()`；篝火行改回 `closePanel(); rekindleExpedition(true)`；删除 `requestRekindle` 与 `rekindleArmed`。
- **只回退周目奖励**：`spawnBoss` 的 `rewardTokens` 改回 `b.rewardTokens`；删除 `showVictory` 的 `rewardBonus` 文案。
- **整体回退**：恢复 G4-3 的 `game.c7d2c0ba.js + assets.8c75570a.js` / PWA `na-b18-9cf996b0`；数据与 `na.world v14` 不需要回滚。

## 9. 提交与 Pages

（提交 / Pages 线上证据见下一节回填。）
