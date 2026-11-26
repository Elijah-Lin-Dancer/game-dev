# 批 27 · G4-7 守灯人 阿烬 · 独立 3D 立绘与长明暖灯

## 1. 结论

G4-7 是 G4-6 的视觉补完，不改委托数值、不加委托 / 成就 / Boss / 屏：

- `mire-6` 的「守灯人 阿烬」从复用 `mireKeeper + flipX` 换成独立 ink-studio 3D 像素立绘 `mireLampkeeper`（seed 406）；守泽人阿芦仍是 `mireKeeper`，两者不再共用身体。
- `mireWraith done && lampQuest done` 时，归水灯从冷焰变成持续暖灯：暖色 aura、地面 ring、双圈火焰和 `dust` 余烬粒子；标牌从「归水灯 · 长明」移到灯上方，不再压住火光。
- 离开 `mire-6` 时回收火光，回到屏内再重建；重燃、切换其他 Boss 纪念物时不残留。
- 仍 **36 屏 / 6 群系 / 13 委托 / 6 Boss / 24 成就 / 7 NPC**；`world.json v11`、`na.world v15`、13 条委托数值、24 条成就均不变；本轮只加 1 件立绘 + 1 个图集切片。

## 2. 行为合同

| 场景 | 入口 | 期望 |
|---|---|---|
| 灯前 / 水魇未退 | `mire-6` 靠近阿烬 | 立绘为 `mireLampkeeper`；`role=lampkeeper / quest=lamp`；无 `lampCore`；归水灯保持冷焰 + gate 休眠 |
| 水魇退后、长明芯未接 | 同上按 E | 新立绘保持；offer 仍为「六盏灯都亮了」+「长明芯」+ 重燃警示；`lampQuest` 不提前写 done |
| 已接未交付 | 同上 / 灯旁 | 新立绘保持；`lampCore` 不出现；交付面板与采集提示不变 |
| 交付长明芯 | 面板第一行 | `lampQuest=done / tokens+4 / mireHerbs-3`；**无需重进屏**，归水灯立刻出现暖色 aura / ring / 火焰 / 余烬粒子；标牌「归水灯 · 长明」 |
| 完成态再进 `mire-6` | `applyScreen(35)` | 暖灯重建；同 key 不重复建；`embers.emitting=true`，至少 1 个存活粒子 |
| 离开 `mire-6` | 走到相邻屏 | `lampCore` 清理，离屏发射器不再跑；回到 `mire-6` 后重新出现，不叠加 |
| 重燃 / 其他 Boss 纪念物 | 终局 / 篝火 / 其他 Boss 屏 | 清掉归水灯暖灯；`lampQuest done` 与六 Boss 重置逻辑沿用 G4-6 |
| 640 / 844 / 单文件 / PWA | 响应式与离线 | 新立绘、暖灯、标牌均可用；无横向溢出；`errs=[]` |

## 3. 实现

- `art-src/g4/mire-lampkeeper.cjs`（新增）
  - seed 406，名称「守灯人 阿烬」；深灰高兜帽、灰披肩、左手长灯杆、胸前暖色灯笼、腰间余烬挂饰。
  - 四向 256×64 图集；首帧 bbox `(17,9,45,55)`；运行时裁成 64×64。
- `art-src/g4/render-g4.cjs`
  - 加入 `mireLampkeeper` spec，输出 `docs/revamp/g4-3d/mire-lampkeeper-atlas.png/.json`。
- `tools/crop_mire.py`
  - 加入首帧裁切，生成 `assets/01-primary/world/mire-lampkeeper.png`（64×64，1,118 B）。
- `tools/build.mjs`
  - 新增 `mireLampkeeper` 图像与 `[64,64]` 帧定义；图集 **174 → 175 切片**。
- `src/scenes/world.js`
  - `QUEST_PROFILE.lamp`：`npcAsset='mireLampkeeper'`、`npcScale=0.95`、`npcOriginY=54/64`、`glowTint=UI.world.lampGlow`、`glowScale=1.05`、`labelY=56`、`promptY=70`。
  - `QUEST_PROFILE.mire` 保持 `mireKeeper / mireGlow`，阿芦未被换脸。
  - 新增 `lampCorePos(def)`：取 `bossGate` 的灯坐标（`bossSpawn.screen.x + gate.x`、`WORLD_Y + gate.y`）。
  - 新增 `clearLampCoreFlame()`：销毁 aura / ring / flame / flameGlow / embers，置空。
  - 新增 `addLampCoreFlame(def)`：按 key `mire-6:lamp` 去重；暖色 aura（ADD，α0.42，2.4→2.9 呼吸）、地面 ring（64×18，α0.20）、双圈火焰（半径 5 / 14，α0.95 / 0.20，ADD，520ms 呼吸）、`dust` 余烬（speedY -38..-14、lifespan 800..1500、frequency 70、ADD）。
  - `showMemorial()` 在 `lampDone` 时调用 `addLampCoreFlame`，并把标牌移到 `p.y-94`；非 lamp / 非 done 时清火。
  - `deliverQuest()` 的 lamp 分支交付后即时 `addLampCoreFlame` + 标牌更新。
  - `applyScreen()` 离开当前屏时回收 `lampCore`；`rekindleExpedition()` 清火。
- `src/systems/ui/tokens.js`
  - 新增 `UI.world.lampGlow = 0xffc46a`。

## 4. 实测

| 项 | 结果 |
|---|---|
| 独立立绘 | `mire-6` NPC texture = `mireLampkeeper`；`role=lampkeeper / quest=lamp`；首帧 64×64，审计 **39.9px / 1.25×** |
| 阿芦回归 | `QUEST_PROFILE.mire` 仍 `mireKeeper`；G4-5 / G4-6 回归 15/15、26/26，阿芦未被替换 |
| 灯前 / offer | 灯前 `lampCore=null`；六 Boss done 的 offer 仍有「六盏灯都亮了」+「长明芯」+ 重燃警示；新立绘两处均生效 |
| done 暖灯 | `lampCore.key='mire-6:lamp'`；`embers.emitting=true`，存活粒子 ≥1；标牌「归水灯 · 长明」位于 `gate.x, gate.y-50`（`p.y-94`） |
| 实际交付 | `lampQuest=done / tokens20→24 / mireHerbs3→0`；交付后当场出现暖灯，不需重进屏 |
| 离屏 / 回屏 | 离开 `mire-6` 后 `lampCore=null`；回到 `mire-6` 后重建，key 相同，无重复 |
| 重燃 | `expedition 1→2`、六 Boss 全 none；暖灯被清；`lampQuest done` 与 G4-6 保持一致 |
| 960 / 640 / 844 | 960 暖灯 + 立绘；640 `scrollWidth=640`；844 `scrollWidth=844`；均有 `lampCore` |
| 单文件 | `file://…/web/game.html?world&debug`：`mireLampkeeper` + `lampCore` +「归水灯 · 长明」均可用 |
| PWA | `na-b18-a6875c40` / 12 条；`set_offline(true)` reload 后 `mireLampkeeper` + `lampCore` + 标牌均可用 |
| 回归 | `g47` **22/22**、`g47-deliver` **11/11**；`g46` **26/26**、`g46-reg` **8/8**、`g45` **15/15**；`smoke` 9 PASS；`audit_scale` **221 INSTANCES / 0 FAIL** |

测试脚本：`/tmp/g47.py`、`/tmp/g47-deliver.py`；G4-5 / G4-6 回归为原脚本的临时副本，截图输出到 `/tmp/g47-*`，不覆盖历史证据。

## 5. 构建

- 首屏 **1911 KB / 2.00 MB（gzip 725 KB）**
- `dist/game.c78659be.js` **383,543 B**
- `dist/assets.14770575.js` **132,345 B**
- 单文件 `web/game.html` **2,042,191 B**
- `web/fonts/game.woff2` **133,768 B**
- 图集 `web/atlas/core.png` **123,697 B / 175 切片**
- PWA `sw.js` **`na-b18-a6875c40`**
- `index.html` 入口 `game.c78659be.js + assets.14770575.js`

## 6. 改动文件

- 新增 `art-src/g4/mire-lampkeeper.cjs`
- `art-src/g4/render-g4.cjs`、`tools/crop_mire.py`、`tools/build.mjs`
- 新增 `assets/01-primary/world/mire-lampkeeper.png`
- 新增 `docs/revamp/g4-3d/mire-lampkeeper-atlas.png/.json`
- `src/scenes/world.js`、`src/systems/ui/tokens.js`
- `index.html`、`sw.js`、`web/game.html`、`web/fonts/game.woff2`、`web/atlas/core.png`、`web/atlas/core.json`、`dist/game.c78659be.js`、`dist/assets.14770575.js`
- 证据 `docs/revamp/g4-7/` 9 张：stand / offer / core 960 / core 640 / core 844 / core single / core PWA / delivered 960 / 立绘对照板

## 7. 风险与回退

- **只动视觉**：本轮不写 `world.json`、不写 `worldSave.js`、不改委托 / 奖励 / 成就 / 屏数；G4-6 的 `lampQuest` 一次性与共享 `mireHerbs` 边界原样保留。
- **立绘辨识度**：新件为深兜帽 + 长灯杆 + 暖灯 + 余烬挂饰，与阿芦的斗笠 / 绿蓑衣区分；若实际观感仍偏暗，下一轮只调 palette / 局部高光，不动机制。
- **暖灯强度**：当前以「不压住 NPC、不盖 UI」为上限；若用户希望更亮的火光，可提高 `embers.frequency` 或火焰半径，但需重新验 640 / 844 与标签可读性。
- **离屏清理**：`applyScreen` 只回收当前 `lampCore`；如果以后把归水灯改成多灯或跨屏常驻，需要改成按屏 key 的池，不可直接复用单对象。
- **回退**：删除 `mireLampkeeper` 资产 / build 定义 / profile 引用与 `lampCore` 系列方法，恢复 `QUEST_PROFILE.lamp.npcAsset='mireKeeper'` / `glowTint=UI.world.mireGlow`，构建与证据同步回退；G4-6 委托数据不受影响。

## 8. 证据（本地）

- `docs/revamp/g4-7/g4-7-lampkeeper-stand-960.png`：灯前新立绘 + 冷焰 gate
- `docs/revamp/g4-7/g4-7-lampkeeper-offer-960.png`：六 Boss done 的 offer + 新立绘
- `docs/revamp/g4-7/g4-7-lamp-core-960.png`：done 暖灯 +「归水灯 · 长明」
- `docs/revamp/g4-7/g4-7-lamp-core-640.png` / `g4-7-lamp-core-844.png`
- `docs/revamp/g4-7/g4-7-lamp-core-single-960.png` / `g4-7-lamp-core-pwa-960.png`
- `docs/revamp/g4-7/g4-7-lamp-core-delivered-960.png`：实际交付后当场出现暖灯
- `docs/revamp/g4-7/g4-7-lampkeeper-portrait-board.png`：旧 `mireKeeper`（阿芦）与新 `mireLampkeeper`（阿烬）对照板

## 9. Pages 线上验收

- 推送：`b099246..b293de4`（代码 / 构建 / 本地证据）；Pages 入口 `game.c78659be.js` + `assets.14770575.js`。
- `world.json v11`：`lampQuest { id:'lampCore3', need:3, rewardTokens:4, npc:'mireLampkeeper' }`。
- PWA `na-b18-a6875c40` / 12 条；断网 reload 后仍进 `mire-6`。
- 线上 960：灯前新立绘 + gate 休眠；offer 新立绘 +「长明芯」；实际交付 `done / tokens20→24 / herbs3→0`，当场出现暖灯，标牌「归水灯 · 长明」。
- 线上 640 / 844：`scrollWidth` 640 / 844，暖灯与立绘均可读。
- PWA 断网：新立绘 + 暖灯 + 标牌可用；`errs=[]`，**17/17 PASS**。
- 线上证据：`docs/revamp/g4-7/g4-online-lampkeeper-stand-960.png`、`g4-online-lamp-offer-960.png`、`g4-online-lamp-core-delivered-960.png`、`g4-online-lamp-core-640.png`、`g4-online-lamp-core-844.png`、`g4-online-lamp-core-pwa-960.png`。

