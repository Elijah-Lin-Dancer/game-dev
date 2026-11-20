# 批 4 · 敌人与 Boss 扩展（实施记录，2026-11-20）

## 1. 做了什么

6 只新怪 + 4 种精英词缀 + 第二只 Boss 蓝武士。**素材 0 外部件、0 自绘**——全部来自包内 `NinjaAdventure/Actor/Monsters/` 与 `Actor/Boss/GiantBlueSamurai/`，符合 ADR 0013 的"本包现成件"第一顺位。

- 数据：`config.js` / `balance.json` 加 8 组数值（`slime/spider/owl/mush/mole/skull/elite/bossB`）
- 图集：`tools/build.mjs` 的 `img` 加 13 张（6 怪 + sam 的 Idle/Walk/AtkL/AtkR/ChgL/ChgR），`FRAME` 加 16/48/96 三档
- 动画：`boot.js` 加 6 种怪的 `${kind}-${dir}` 四向循环、`sam-idle/sam-walk/sam-atkL/sam-atkR/sam-chgL/sam-chgR`
- 行为：`play.js` 的 `updateFoe` 分派到 `updateSpider/updateOwl/updateMush/updateMole/updateSkull`，史莱姆沿用 `updateBeast` + 死亡分裂
- 系统：`this.zones`（毒雾地面区域）、`this.slowUntil`（网住减速）、敌弹 `slow/slowMs/homing` 字段、`damageFoe` 的护盾/无敌判定
- Boss：`spawnBoss()` 随机二选一并写 `bossKind`，`updateBoss` 按 `bossKind` 分派 `updateSamurai`；新增 `samuraiSlash`

## 2. 素材清单（全部包内）

| 用途 | 源文件 | 尺寸 / 帧 | 备注 |
|---|---|---|---|
| Slime | `Actors/Monsters/Slime.png` | 64×64 = 4×4，16px | 帧 0 bbox (0,6,16,15) |
| Spider | `Actors/Monsters/SpiderRed.png` | 64×64 = 4×4，16px | bbox (0,2,16,15) |
| Owl | `Actors/Monsters/Owl.png` | 64×64，16px | 近满格 |
| Mushroom | `Actors/Monsters/Mushroom.png` | 64×64，16px | 近满格 |
| Mole | `Actors/Monsters/Mole.png` | 64×64，16px | 近满格 |
| Skull | `Actors/Monsters/SkullBlue.png` | 64×64，16px | 近满格 |
| 蓝武士 待机 | `Actors/Boss/GiantBlueSamurai/Idle.png` | 576×48 = 12 帧 48px | |
| 蓝武士 行走 | `Walk.png` | 576×48，48px | |
| 蓝武士 横斩 | `AttackLeft/Right.png` | 384×96 = 4 帧 96px | **帧里带身体**，叠加时必须与本体同中心同缩放 |
| 蓝武士 突进 | `ChargeLeft/Right.png` | 288×96 = 3 帧 96px | 暂未单独播，冲撞靠位移 + 抖动 |
| 蓝武士 受击 | `Hit.png` | 384×48，48px | 未接（通用闪白已够） |

普通怪只有一张 4×4 表，**没有攻击/受击专属帧**：吐网、俯冲、钻地、放毒全部用"位移 + FX + 变色 + 浮字"表达。

## 3. 行为与破法（一句话成立）

| 怪 | 行为 | 破法 | 实测 |
|---|---|---|---|
| Slime | 慢速直线靠近，死后裂 2 只 3 血小号 | 先清小的，别被围 | 打死 → 场上出现 2 只 `hp3 / speed46 / scale1.3`，小号不再裂 |
| Spider | 中距离（360）吐网，命中 `slowUntil=now+1500`、移速 ×0.6 | 侧向绕，别正面撞网 | 命中后 `__dbg.slowNow()` 读到 1483ms；玩家 hp 20→18 |
| Owl | 悬停 720ms（影子预警）→ 俯冲 205px/s → 回收 | 看影子位移躲开 | 俯冲阶段有影子、落点偏离后可躲 |
| Mushroom | 原地放毒雾（半径 54，3s，每 600ms 跳 1 伤） | 逼它移动或远程打 | `__dbg.zonesList()` 读到 `[320,352,54,alpha]`；站在圈内 hp 递减 |
| Mole | 钻地 620ms（无敌、半透明、不碰伤）→ 冒头砸地 → 走 1.8s 再钻 | 冒头前离开原地 | 相位序列 `dive(inv=true) → emerge → walk → dive`，钻地时接触不掉血 |
| Skull | 追踪弹：逐帧把速度向量朝玩家插值（turn 0.6） | 靠墙/急转甩掉 | 弹体命中 hp 99→97；贴墙会自毁 |

同屏上限 8：`spawnFoe` 入口判 `enemiesAlive() >= 8` 直接返回 null；分裂/召唤都做了空值保护。

## 4. 精英词缀

| 词缀 | 效果 | 外观 |
|---|---|---|
| 狂暴 | 血 ×1.2、伤害 ×1.5、移速 ×1.4 | 橙红染色 + 橙环 |
| 护盾 | 首次伤害免疫（`shield=1`），破盾仅一次 | 淡蓝染色 + 蓝环 |
| 分裂 | 死亡裂 2 只 30% 血的小号（不再带词缀） | 浅绿染色 + 绿环 |
| 迅捷 | `windupMul=0.7`，`cdT` 走快即出手更勤 | 淡黄染色 + 黄环 |

基础倍率 `hp ×1.8`，体型 `scale 2.5`，浮字"精英 · 词缀名"；`__state.enemyList` 第 4 位即词缀 id。

## 5. 蓝武士（GiantBlueSamurai）

- 血量 `CFG.bossB.hp=34`（按周目 `cycle.bossMul` 缩放），半格 `half=22`，`scale 1.5`
- 三招轮换：近身 <110 且场上 <4 只时先**召唤 2 小怪**（`summonCd 2600`）；否则 `moveCount % 3 === 0` 走**突进斩**，其余**横斩**
- 横斩：前摇 420ms（染黄 + 呼吸缩放）→ `samuraiSlash` 在 96px 攻击帧叠加（同中心同缩放，避免"两个武士"）+ 前方矩形判定 + 震屏 + 刀声；命中 4 伤
- 突进：前摇 480ms（染蓝）→ 230px/s 冲 300ms，接触伤害 5
- 二阶段：血量 ≤50% 时 `roar` 600ms（"刀势转急"、变橙、Boss 条变橙），之后速度 ×1.3、前摇 ×0.8
- 出现方式：每局 Boss 房随机 `frog / sam`，`__state.bossKind` 可读

## 6. 验收（U 段，实测于 127.0.0.1:8765）

| 编号 | 判据 | 结果 |
|---|---|---|
| U-1 | 6 只新怪都能生成、动画四向可播 | `__dbg.tex` 全部 `frames=16`；截图 `b4-0-foes.png` 六只同屏 |
| U-2 | 蜘蛛网命中减速，`__state.slowUntil` 可采样 | 命中后 `slowNow=1483`，hp −2 |
| U-3 | 毒雾是持续区域伤害 | `zonesList` 有圈，圈内 hp 递减，3s 后自动销毁 |
| U-4 | 鼹鼠钻地无敌、冒头才可打 | 相位 `dive/inv=true` → `emerge` → `walk`；钻地期接触不掉血 |
| U-5 | 骷髅弹会转向、能被打墙销毁 | 弹体命中 −2 血；贴墙 `isWall` 自毁 |
| U-6 | 史莱姆分裂不无限 | 死 1 裂 2，小号 `mini=true` 不再裂；同屏到 8 后不再新增 |
| U-7 | 四词缀数值正确且 `enemyList` 可读 | 12 次纯随机：enrage `13/64/5`、shield `11+shield1`、split `11`、swift `11/51/wm0.7`；`enemyList` 词缀字段有值 |
| U-8 | 护盾先破盾再掉血 | 第一击 hp 不变 `sh 1→0`，第二击 −3 |
| U-9 | 蓝武士三招都能出、半血二阶段 | 实测 `slashWindup→slashHit`（hp −4）、`summon`（召 2 怪）、`roar`（50% 血）；青蛙 Boss 回归正常（`windup→lunge→recover`） |
| U-10 | 两只 Boss 都能打死并通关 | `bossHp→None`、`won=true`、`kills=1` |
| U-11 | 同屏上限 8 | 连刷 12 只，`__state.enemies=8`，后续返回 `'cap'` |
| U-12 | 无 pageerror | 全部用例 `errs=[]` |

截图：`docs/screens/b4-0-foes.png`、`b4-1-web.png`、`b4-2-poison.png`、`b4-3-mole.png`、`b4-5-slime-split.png`、`b4-6-elite.png`、`b4-7-samurai.png`、`b4-8-samurai-p2.png`、`b4-9-sam-*.png`、`b4-10-win.png`。

## 7. 已知取舍

- **攻击帧自带身体**：96px 帧里画着武士本人，所以叠加图必须和本体同中心同 `scale 1.5`，否则会出现两个武士；代价是斩击的"刀光"被本体挡住一部分，观感偏克制。
- **Hit.png 没接**：通用闪白 + 击退已够，接专属受击帧会打断攻击帧，收益低。
- **迅捷语义**：从"前摇 −30%"落成"`cdT` 走快 ≈ 出手更勤"，因为多数怪没有独立前摇字段；文档口径以此为准。
- **毒雾 tick 600ms vs 无敌帧 700ms**：站圈里实际每 1.2s 掉 1 血，比纸面低；若实测太弱再把 tick 调到 800ms 并同步 iframe。
- **同屏上限含 Boss**：Boss 房不会再加小怪，避免"8 只围殴 + Boss"。
- **青蛙/蓝武士各 50%**：没有按深度或房号分流；两套都验过，随机够用。
