# 批 24 / G3-4 · G3-5：霜灯巨鸮 + 熔心巨像（G3 五只世界 Boss 收尾）

> 2026-11-25。G3 五只世界 Boss 的 **第 4、5 只**——雪原 `snow-6` 的霜灯巨鸮、火山 `volcano-6` 的熔心巨像——从占位 / 空场接成 ink-studio 生成的 96×96 四向 × 待机 / 蓄力 / 咆哮专属 Boss。
> 同批把两处 Boss 场补成有地表、植物、石景与专属攻击的战场；`na.world` 升 **v10**，五只 Boss 各有独立进度；最后一只倒下后触发 **星火归途 · 远征完成**，并接入 **3 条远征成就**（成就总数 20 → 23）。G3 世界 Boss **5/5**，G3 收尾完成。

---

## 1. 结论先行

- `snow-6` 新增 **霜灯巨鸮 / Frostlantern Owl**，`hp 88 / dmg 6 / rewardTokens 5`；`volcano-6` 新增 **熔心巨像 / Magma Colossus**，`hp 96 / dmg 7 / rewardTokens 5`。
- 两套源均为 **ink-studio 3D 像素离线管线**：`art-src/g3/frost-owl.cjs`（seed 306）、`art-src/g3/magma-colossus.cjs`（seed 307）；每只 3 张 **384×96 RGBA** 图集（4 帧 96×96 × 前 / 左 / 后 / 右），共 6 张。
- 霜灯巨鸮识别点是 **直立鸮身、白色大面盘、冰枝角、翅缘霜羽、胸口旧雪灯、雪岩基座**；熔心巨像是 **宽肩窄腰的黑曜石铁炉人形、胸口炉膛、肩部烟管、铁砧拳、后掠黑角、冷灰蓝黑曜岩**，不再糊在火山暗底里。
- 比例：霜灯巨鸮 idle **98.8px / 3.09×**、charge **92.3px / 2.89×**、roar **103.7px / 3.24×**；熔心巨像 idle **99.4px / 3.11×**、charge **97.2px / 3.04×**、roar **103.7px / 3.24×**；均在 2.2–3.3× 世界 Boss基线内。
- 运行时 `BOSS_ART.frostOwl`：`origin75/96 / scale1.62 / standoff108 / swipeAt96 / pounceGap84 / pounceR98 / swipeR106 / swipeWarn96 / shadow102×15 / glowY28 / labelY104`，雪色 tint；`BOSS_ART.magmaColossus`：`origin70/96 / scale2.16 / standoff108 / swipeAt102 / pounceGap84 / pounceR104 / swipeR116 / swipeWarn104 / shadow132×18 / glowY34 / labelY112`，熔火 tint。
- 追击速度从硬编码 34 改为 `B.speed`：霜鸮 **29** 慢而稳，熔像 **36** 重而快；两只普通扑 / 扫仍保留，但 **先判定专属攻击**。
- 雪原专属 **霜锥**：3 个预警圈，落点偏移 `[-62,8] / [52,-32] / [0,38]`，预警 **640ms**，落点 34px 内 `max(2,dmg-2)=4` 伤害；冰蓝碎晶上冲 + 冰蓝爆点。
- 火山专属 **炉口喷发**：3 个红圈，偏移 `[-54,22] / [58,6] / [4,-48]`，预警 **720ms**，落点 32px 内即时 **2** 伤害；留下 3 个半径 30 / 持续 2400ms / 每 650ms 烫 2 点的熔渣池。
- `na.world` **v9 → v10**：`BOSS_IDS = mossBeast / bambooMirage / sandMirage / frostOwl / magmaColossus`；v9 旧档补两只 `none`，其余字段不丢；`normalizeBoss` 新增 `pattern / speed / specialGap` 白名单归一化。
- 战场：`snow-6` 4 个 `snowPine` + 3 个 battle 节点 + 雪脊 / 冰裂 / 冰簇；`volcano-6` 6 个 prop（两熔岩池、三尖柱、一个裂口）+ 3 个 battle 节点 + 黑曜台 / 熔缝 / 余烬；`buildBossEdge` 按群系补边，`buildBossArena` 只做地表不挡走位。
- 最后一只 Boss 倒下：标题 **星火归途 · 远征完成**，正文说明五片群系星火连成一线，按钮改为 **回到小屋**；同批新增 `world_boss_1 / world_boss_3 / world_boss_5` 三条远征成就，成就页 23 条。
- 本地最终：`audit_scale.py` **170 实例 / 0 FAIL**；`npm run smoke` **9 PASS**；构建首屏 **2022 KB / gzip 858 KB**；图集 **166 切片 / 267 KB**；`dist/game.505510f9.js` **352,488 B** + `dist/assets.711efd4b.js` **126,652 B**；单文件 **2,204,975 B**；PWA `na-b18-38dab29e` / 12 条。

---

## 2. 美术：两只 Boss 的轮廓与可读性

### 2.1 霜灯巨鸮

`art-src/g3/frost-owl.cjs`（seed 306）按“站在雪岩上的守夜鸮”建模，不把苔背巨兽 / 雾竹蜃换色：

- **头**：圆头 + 深色外缘 + 整片白色大面盘；面盘推到头部表面之外，前端两片圆颊 + 深眼窝 + 冰蓝眼 + 小瞳；钩喙短而弯，roar 时口腔发暖光；
- **耳羽 / 冰枝角**：从头顶向后上方分叉，三叉冰枝 + 枝梢冰晶；这是雪原 Boss 最远的轮廓线；
- **身**：直立厚羽胸腹、三道浅色胸羽横线、收在身侧的厚披风式双翼；roar 展开、charge 后掠；
- **翼缘**：三根长霜羽 + 冰蓝翼尖；侧视有“结霜刀刃”的翼缘，不是圆球；
- **尾**：三根短宽霜羽向后撑，背面能看到鸟尾线；
- **灯**：胸口旧雪灯，木框 + 冰蓝灯芯 + 金火，是“守夜”的叙事焦点；
- **基座**：雪岩 + 霜壳 + 冰蓝碎块，脚底落在 75/96。

首轮面盘是薄片，侧视像一块白板；后续把面盘改成 **白色前半球** 扣在圆头上，侧视变成圆润面罩；再补白色侧颊与冰蓝小点，四向转身时不再只剩一颗圆头。最终 idle / charge / roar 三姿态在前 / 左 / 后 / 右都能读。

### 2.2 熔心巨像

`art-src/g3/magma-colossus.cjs`（seed 307）按“黑曜石铁炉人形”建模：

- **体**：宽肩窄腰、短而重的腿，肩背有烟管 / 排气口；不是石巨人换色，也不是苔背巨兽放大；
- **胸**：正面炉膛，炉门格栅 + 橙金炉心 + 外溢火光；背面是三道横向炉口 / 热缝，背后也能读出“炉”；
- **头**：低矮炉盔 + 后掠黑角 + 橙红眼缝；侧面有肩甲与烟管，背面有双角与热缝；
- **手**：右臂铁砧拳、左臂炉钳 / 重拳；攻击时前倾、抬拳；
- **色**：首版整体偏黑，在火山暗底上糊成一团；先整体提亮棕色仍不够，最终改 **冷灰蓝黑曜岩**（`rock` 灰蓝、`iron` 暖褐、炉心橙金），在 960 取景下轮廓与炉心都能分开；
- **基座**：黑曜石台 + 熔缝 + 余烬点，脚底落在 70/96。

### 2.3 输出与来源

| 姿态 | 源 | 源图集 | 正式 PNG | 可见高度 |
|---|---|---|---|---|
| 霜灯巨鸮 待机 | `art-src/g3/frost-owl.cjs`（seed 306） | 384×96，4 向 | `assets/01-primary/world/frost-owl-idle.png` 384×96 | 98.8px；3.09× 玩家 |
| 霜灯巨鸮 蓄力 | 同上，`pose='charge'` | 384×96，4 向 | `assets/01-primary/world/frost-owl-charge.png` 384×96 | 92.3px；2.89× 玩家 |
| 霜灯巨鸮 咆哮 | 同上，`pose='roar'` | 384×96，4 向 | `assets/01-primary/world/frost-owl-roar.png` 384×96 | 103.7px；3.24× 玩家 |
| 熔心巨像 待机 | `art-src/g3/magma-colossus.cjs`（seed 307） | 384×96，4 向 | `assets/01-primary/world/magma-colossus-idle.png` 384×96 | 99.4px；3.11× 玩家 |
| 熔心巨像 蓄力 | 同上，`pose='charge'` | 384×96，4 向 | `assets/01-primary/world/magma-colossus-charge.png` 384×96 | 97.2px；3.04× 玩家 |
| 熔心巨像 咆哮 | 同上，`pose='roar'` | 384×96，4 向 | `assets/01-primary/world/magma-colossus-roar.png` 384×96 | 103.7px；3.24× 玩家 |

- 渲染入口：`art-src/g3/render-g3.cjs`；`spriteAtlas({width:96,height:96,directions:4,times:[0],columns:4})`。
- 帧序：0 前 / 1 左 / 2 后 / 3 右；霜鸮脚底 **75/96**，熔像 **70/96**。
- 源元数据：`docs/revamp/g3-3d/frost-owl-{idle,charge,roar}.json`、`magma-colossus-{idle,charge,roar}.json`。
- 对照板：`docs/revamp/g3-3d/frost-owl-board.png`、`magma-colossus-board.png`；转身 GIF：`docs/revamp/g3/g3-frost-owl-turn.gif`、`g3-magma-colossus-turn.gif`。
- 来源口径：ink-studio 生成（工具 MIT，成品本项目自制）；**不是 Ninja Adventure 二次改色，也不是 image-to-image**。

复现：

```bash
cd /home/user/Doubao/chats/38454996042111490/game-repo
INK_STUDIO=/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio \
node art-src/g3/render-g3.cjs
```

---

## 3. 数据与存档

### 3.1 `world.bosses` 新增两项

`web/data/world.json`：

```json
{
  "id": "frostOwl", "name": "霜灯巨鸮", "screen": "snow-6",
  "x": 300, "y": 170, "hp": 88, "dmg": 6, "rewardTokens": 5,
  "art": "frostOwl", "title": "霜灯守夜者", "pattern": "frost",
  "speed": 29, "specialGap": 5200,
  "victoryTitle": "雪原的星火 · 已归位",
  "victoryBody": "白原的雪灯重新亮起，守夜者把最后一片霜羽留在你掌心。",
  "memorialText": "雪原星火 · 已归位"
}
```

```json
{
  "id": "magmaColossus", "name": "熔心巨像", "screen": "volcano-6",
  "x": 300, "y": 170, "hp": 96, "dmg": 7, "rewardTokens": 5,
  "art": "magmaColossus", "title": "熔心守炉者", "pattern": "magma",
  "speed": 36, "specialGap": 4800,
  "victoryTitle": "火山的星火 · 已归位",
  "victoryBody": "火心的炉膛慢慢冷却，巨像把最后一块烧红的铁留在你脚下。",
  "memorialText": "火山星火 · 已归位"
}
```

两只都**没有小怪编队**：本轮差异在专属范围攻击与场地，不硬塞第二套小怪；沙海蜃的小怪逻辑保持原样。

### 3.2 存档 v10

`src/systems/worldSave.js`：

- `VERSION=10`；
- `BOSS_IDS=['mossBeast','bambooMirage','sandMirage','frostOwl','magmaColossus']`；
- `bosses` 每项仍为 `none|done`，五只独立；
- v9 旧档迁移：保留 `visited / herbs / quest / 各群系采集与委托 / tokens / boss`，只补 `frostOwl:'none' / magmaColossus:'none'`；
- `normalizeBoss` 只放行 `pattern / speed / specialGap`，坏档不会把任意字段带进运行时。

v9→v10 实测：种子 `v9 / bosses={mossBeast:done,bambooMirage:done,sandMirage:done} / tokens11`，进页面后 `v10`，补 `frostOwl:none / magmaColossus:none`，`visited` 补 `field-1` 保留 `snow-6`，`errs=[]`。

### 3.3 运行时

`src/scenes/world.js`：

- `BOSS_ART.frostOwl` / `BOSS_ART.magmaColossus` 新增；
- `updateBoss` 的追击速度由硬编码 34 改为 `B.speed`；
- `specialAt` 在 `intro` 后 3.6s 首次触发，`recover` 后按 `specialGap` 重置；专属攻击先于普通扑 / 扫；
- 普通扑 / 扫的预警圈使用 `B.art.warnColor || 0xff7a6a`：雪原 **0x9fe8ff**、火山 **0xffa24a**，不再用通用红圈；
- `startFrostVolley / resolveFrostVolley`、`startMagmaEruption / resolveMagmaEruption`、`updateBossHazards / clearBossHazards`；
- `clearBossHazards` 在 `spawnBoss / startBossFight / finishBoss / worldDown / retryBoss` 调用，重试 / 胜负后不残留；
- 四向转身沿用 `BOSS_TURN_MS=1600`：站定每 1.6s 转 90°，帧序 0 前 / 1 左 / 2 后 / 3 右，追击 / 攻击朝玩家。

---

## 4. 专属攻击

### 4.1 霜锥

`startFrostVolley`：

- 3 个落点，基于玩家位置偏移 `[-62,8] / [52,-32] / [0,38]`，限制在 Boss 场内；
- 预警圈 `2px #bdf4ff`，640ms；冰蓝小点 + 呼吸 tween；
- `resolveFrostVolley`：冰晶柱上冲、冰蓝爆点、震屏；落点 34px 内受 `max(2, dmg-2)=4`；
- 状态 `frostWindup → recover 620ms`，roar 姿态。

实测 960：`state=frostWindup / volley3`；站到第一落点后 `state=recover / HP20→16`。

### 4.2 炉口喷发

`startMagmaEruption`：

- 3 个落点，偏移 `[-54,22] / [58,6] / [4,-48]`；
- 预警圈 `2px #ffb066`，720ms；橙金余烬；
- 落点 32px 内即时 **2** 伤害；
- 留下 3 个半径 30、持续 **2400ms**、每 **650ms** 烫 **2** 点的熔渣池；池子有橙红发光与余烬点，`updateBossHazards` 按时间扣血，`clearBossHazards` 清理；
- 状态 `magmaWindup → recover 720ms`，roar 姿态。

实测 960：`state=magmaWindup / erupt3`；落点后 `state=recover / HP20→18 / hazards3 / hazardParts[3,3,3]`；2.3s 后 `hazards0 / HP9`（玩家持续站在熔渣里）。

---

## 5. 战场层次

### 5.1 雪原 `snow-6`

- `props4`：`snowPine` at `34,198 / 452,188 / 105,178 / 388,168`，从 2 棵扩成 4 棵，Boss 读区不被树冠堵；
- `herbs3`：`[64,230,1] / [424,236,1] / [246,82,1]`，全部是 battle 节点；
- `buildBossArena`：雪脊（3 条低透明椭圆）、冰裂（4 条 + 4 个冰蓝反光点）、冰簇（3 枚低矮三角）；只做地表层，不挡走位；
- `buildBossEdge`：雪原补 `snowTile`、雪脊、雪松、雪祠、雪灯、冷雾；`edgeHidden35 / edgeProps8`；
- 关闭胜利后 `restoreBossEdge` 恢复 `edge0 / hidden0`，并清掉 arena。

### 5.2 火山 `volcano-6`

- `props6`：`volcanoLava 180,238,1.3 / volcanoSpire 240,190,1.2 / volcanoVent 320,240,1.2 / volcanoLava 360,244,1.1 / volcanoSpire 80,200,1.1 / volcanoSpire 430,200,.95`；
- 去掉容易误导为“可点篝火”的 `campfire`，避免 Boss 场出现能点的篝火错觉；
- `herbs3`：`[64,226,1] / [432,232,1] / [220,78,1]`，battle 节点；
- `buildBossArena`：黑曜台（3 块暗色椭圆）、熔缝（4 条橙红 + 煤点）、余烬点（5 个 ADD 小光）；
- `buildBossEdge`：火山补 `volcanoTile`、黑曜台、尖柱、裂口、熔岩、余烬；`edgeHidden0 / edgeProps16`；
- 末屏没有右邻群系可露，补边把镜头收在火心。

### 5.3 Battle 草药通用

`BATTLE_HERB_LABEL` 从“沙蓬专用”改为群系通用：

| 群系 | 名字 | 提示 | 使用文案 | 重生文案 |
|---|---|---|---|---|
| field / bamboo / desert | 草药 / 雾竹 / 沙蓬 | E 采… | …暖身 | …重新长出 |
| snow | 雪灯 | E 采雪灯 | 雪灯暖身 | 雪灯重新亮起 |
| volcano | 火种 | E 拾火种 | 火种暖身 | 火种重新燃起 |

仍是 45s 重生、不读条、不冻结 Boss、+2 HP，不计入普通采集数量。

实测：
- 雪原 `prompt=E 采雪灯`，`hp10→12`，`active=false`，`respawn≈44633ms`，toast `雪灯暖身 · 回 2 点生命`；
- 火山 `prompt=E 拾火种`，`hp10→12`，`active=false`，`respawn≈44683ms`，toast `火种暖身 · 回 2 点生命`。

---

## 6. 结局与成就

### 6.1 星火归途 · 远征完成

`finishBoss` 写入当前 Boss 进度后：

```js
const allDone = this.world.bosses.every((b) => this.save.bosses[b.id] === 'done');
this.showVictory(reward, allDone, this.newAch);
```

`showVictory` 在 `finale=true` 时：

- 标题改为 **星火归途 · 远征完成**；
- 正文改为 **五片群系的星火重新连成一线，归途在火心尽头亮起。**；
- 按钮改为 **回到小屋**（走 `leave()`，不再显示“继续探索”）；
- 若本次解锁远征成就，面板多一行 `新成就 · …`。

普通 Boss 胜利仍是原来的 `victoryTitle / victoryBody / 继续探索`。

实测：预置前四只 done，击杀熔心巨像 → `victory=true / bosses 五键全 done / tokens20 / panelOpen=true`，面板标题与按钮正确；点击按钮离开世界场景。

### 6.2 三条远征成就

`src/systems/ach.js`：

- 新增 `world_boss_1` **远征初火**：击败任意 1 只世界 Boss；
- `world_boss_3` **三片星火**：击败 3 只；
- `world_boss_5` **五火归位**：五只全部归位；
- 值函数只读 `loadWorldSave().bosses`，不把世界存档搬进 `na.save`；
- `finishBoss` 立即调用 `evaluateAchievements()`，不必等回小屋；
- `achDone` 改为“一旦写入 `ach` 就永久点亮”，避免重置世界进度后成就回退；
- 成就总数 **20 → 23**，Hall 成就页 4 列布局可容纳 6 行。

实测：击杀最后一只后 `na.save.ach = {world_boss_1:1, world_boss_3:1, world_boss_5:1}`；Hall 成就页标题 `成就 3/23`（预置 3 条成就的测试档）。

---

## 7. 验收

### 7.1 逻辑与交互

| 项 | 结果 |
|---|---|
| 入口 | `?world=1&debug` → `applyScreen(23)`：`snow-6 / props4 / herbs3 / battleHerbs3 / boss=frostOwl / hp88 / edgeHidden35 / edgeProps8` |
| 火山入口 | `applyScreen(29)`：`volcano-6 / props6 / herbs3 / battleHerbs3 / boss=magmaColossus / hp96 / edgeHidden0 / edgeProps16` |
| 四向 | 图集 0 前 / 1 左 / 2 后 / 3 右；站定 `turnDir` 每 1.6s 循环；实测拍到 `turn=1/2/3` 时 `frame=1/2/3`、`tex=frostOwlIdle / magmaColossusIdle`，朝向与帧一致 |
| 霜锥 | `state=frostWindup / volley3`；站第一落点 `state=recover / HP20→16` |
| 炉口 | `state=magmaWindup / erupt3`；落点后 `state=recover / HP20→18 / hazards3 / hazardParts[3,3,3]`；2.3s 后 `hazards0 / HP9` |
| 霜鸮击杀 | `victory=true / bosses.frostOwl=done / tokens5`；关闭胜利 `edge0 / hidden0 / memorial=true` |
| 熔像击杀 | `victory=true / bosses.magmaColossus=done / tokens10`；五键均在 |
| 雪灯 / 火种 | `hp10→12`；提示 / 重生文案正确；Boss 保持 active |
| v9→v10 | `v10 / 五 Boss 键 / 旧进度保留 / errs=[]` |
| 结局 / 成就 | 最后一只倒下 → `星火归途 · 远征完成`；`ach` 三键写入；Hall `成就 3/23` |
| 回归 | 苔背 / 雾竹 / 沙海蜃数据与场景仍存在；30 屏 / 5 群系 / 5 Boss |

### 7.2 三档、单文件、PWA

- **960×540**：`g3-frost-intro-960 / arena / volley / impact / victory / herb`、`g3-magma-intro / arena / erupt / hazards / victory / herb`、`g3-finale-960`；`errs=[]`。
- **640×360**：`g3-frost-640`、`g3-magma-640`；画面与 HUD 无溢出，`errs=[]`。
- **844×390 hasTouch**：`g3-frost-844`、`g3-magma-844`；触屏按钮可见，`errs=[]`。
- **单文件**：`file:///.../web/game.html?world=1&debug=1` → `__SINGLE__=true / snow-6 / frostOwl / props4 / herbs3 / errs=[]`。
- **PWA 断网**：SW controller + `setOffline(true)` → `online=false / snow-6 / frostOwl / controller=true / errs=[]`。
- **审计**：`tools/audit_scale.py` → **170 实例 / 0 FAIL**；霜鸮 3.09/2.89/3.24×，熔像 3.11/3.04/3.24×。
- **冒烟**：`npm run smoke` → **9 PASS**。

### 7.3 构建

| 项 | 值 |
|---|---|
| 首屏预算 | **2022 KB / gzip 858 KB** |
| 图集 | **166 切片 / 267 KB** |
| 游戏逻辑 | `dist/game.505510f9.js` **352,488 B** |
| 素材数据 | `dist/assets.711efd4b.js` **126,652 B** |
| 单文件 | `web/game.html` **2,204,975 B** |
| PWA | `na-b18-38dab29e` / 12 条 |
| 冒烟 | 9 PASS |

---

## 8. 已知边界 / 下一步

- G3 世界 Boss **5/5** 完成；本轮两只 **无小怪编队**，差异靠体型、速度、专属范围攻击与场地；如果后续要更接近“团本”，可给熔心巨像加炉渣小怪，但不建议在同一轮再加机制。
- 四向仍是姿态切帧，不是逐帧行走；站定 1.6s 主动转 90°，追击 / 攻击朝玩家，满足 3D 件在场上的四向可读。
- 雪原 / 火山 Boss 场有地表、植物、石景、补边与 battle 草药；没有地形破坏、阶段转换或场景机关。
- 远征结局是胜利面板的 finale 变体，不是独立过场 / 结局动画；3 条成就是 Hall 记录的远征成就，不额外发宝石。
- G2 仍缺 **4 条委托**：雪原第二条 + 草原 / 竹林 / 沙漠各 1；G3 收尾已完成，下一段可转 G2 委托补齐或 G3 线上 Pages。
- 960 / 640 / 844 的三档本次均已重验；Pages 线上验收在提交推送后补记。

---

## 9. 改动文件

- 新增：`art-src/g3/frost-owl.cjs`、`art-src/g3/magma-colossus.cjs`、`docs/revamp/g3-3d/frost-owl-{idle,charge,roar}.png/.json`、`magma-colossus-{idle,charge,roar}.png/.json`、`frost-owl-board.png`、`magma-colossus-board.png`、`assets/01-primary/world/frost-owl-*.png`、`magma-colossus-*.png`、`docs/revamp/g3/g3-frost-*`、`g3-magma-*`、`g3-finale-960.png`、`g3-frost-owl-turn.gif`、`g3-magma-colossus-turn.gif`。
- 修改：`art-src/g3/render-g3.cjs`、`web/data/world.json`、`src/systems/worldSave.js`、`src/scenes/world.js`、`src/systems/ach.js`、`tools/build.mjs`、`tools/audit_scale.py`、`assets/CREDITS.md`、`docs/ART_PIPELINE.md`、`docs/OPENWORLD.md`、`docs/ACCEPTANCE.md`、`docs/MASTERPLAN.md`、`CURRENT.md`、`LEDGER.md`、`index.html`、`sw.js`、`dist/game.505510f9.js`、`dist/assets.711efd4b.js`、`web/game.html`。

---

## 10. 本地证据索引

- 雪原：`docs/revamp/g3/g3-frost-intro-960.png`、`g3-frost-arena-960.png`、`g3-frost-volley-960.png`、`g3-frost-impact-960.png`、`g3-frost-victory-960.png`、`g3-frost-herb-960.png`、`g3-frost-640.png`、`g3-frost-844.png`、`g3-frost-single-960.png`、`g3-frost-pwa-960.png`。
- 火山：`docs/revamp/g3/g3-magma-intro-960.png`、`g3-magma-arena-960.png`、`g3-magma-erupt-960.png`、`g3-magma-hazards-960.png`、`g3-magma-victory-960.png`、`g3-magma-herb-960.png`、`g3-magma-640.png`、`g3-magma-844.png`。
- 结局：`docs/revamp/g3/g3-finale-960.png`。
- 3D：`docs/revamp/g3-3d/frost-owl-board.png`、`magma-colossus-board.png`、两套 atlas / json。
- 文档：`docs/BATCH24-G3-4-5.md`、`docs/ACCEPTANCE.md` W96–W108、`CURRENT.md`、`LEDGER.md`、`docs/MASTERPLAN.md`、`docs/OPENWORLD.md`、`docs/ART_PIPELINE.md`、`assets/CREDITS.md`。
