# 批 2 · 房间编排的素材关（开工前核对，2026-11-20）

按 ADR 0013 的四级顺序走完。结论：**四类新房间只有一件真需要外部素材（篝火），已经用 OGA 的 CC0 四帧**；其余全部本包现成件或代码点阵（小地图本来就该用 `Graphics`，不是"没素材所以画"）。

## 1. 逐件核对

| 需求 | 本包有什么 | 判定 |
|---|---|---|
| 宝箱（关/开两态） | `Items/Treasure/LittleTreasureChest.png` **32×16 = 2 帧 16×16**（实测：左关右开）；另有 `BigTreasureChest.png` 32×14 单帧 | **够**，两帧直接做开箱动画 |
| 钥匙 | `Items/Treasure/GoldKey.png` 12×8、`SilverKey.png` 12×8 | **够**，金色用金钥匙、银色当商店货 |
| 商店货架 | **无货架**。`Ui/Theme` 12 张 nine_path 面板 + 已有物品图标 | **换表达**：不摆货架，摆 3 个悬浮商品图标 + 一个商人（`Villager2` 已有），靠近按 E 开价目面板 |
| 商人 NPC | `Actor/Characters/Villager2/`（叙事层已在用），另有 `Villager`、`Merchant`? 实测目录里只有 Villager/Villager2 | **够**，复用行脚商 |
| 篝火 | **包内没有**（`find -iname "*camp*"`、`"*fire*"` 只命中 `FX/Particle/Fire.png` 粒子） | **外部采纳**：OGA `16x16 Animated Campfire`（krial，**CC0**），64×16 = 4 帧 16×16，467 B → `assets/01-primary/external/campfire-16x16.png` |
| 精英标记 | `FX/Magic/Aura/SpriteSheetWhite.png` **128×32 = 4 帧 32×32** 光环 | **够**：光环 tint 金色 + 放大 1.15 + 血量翻倍，就是精英 |
| 小地图 | — | **代码点阵**（`Graphics` 画 3×3 圆点）。这类像素级的 UI 状态点，素材库里没有可直接对齐本作调色板的版本，自绘属于 ADR 0013 的"动态 + 无合风格素材"两种例外之一 |
| 房间名浮字 | 已有 `NinjaPixel` 字体 + `floatText` | **够** |

## 2. 外部素材落地要求（按 ADR 0013 第 5 条）

1. 文件进 `assets/01-primary/external/campfire-16x16.png`（已落地）
2. `assets/CREDITS.md` 新增一行：作者 krial、CC0 1.0、源 URL、改动（无缩放、按 4 帧切片）
3. 构建期进图集（`build.mjs` 的 `img`/`FRAME` 加 `campfire: [16,16]`），运行期 `anims` 播 4 帧

## 3. 缺口与处置

| 缺口 | 处置 |
|---|---|
| 没有"货架"美术 | 用商品图标 + 九宫格面板表达"明码标价"，不做货架 |
| 宝箱只有两帧、没有光效 | 用 `playAct('upgrade')` 的金环 + 碎片补"开箱"反馈 |
| 篝火没有配套音效 | 用已有的 `bonus`（低频）+ `boom`（轻量）叠；不新增音频文件 |

**外部件 1 件（篝火），自绘 1 处（小地图点阵）。** 其余 0。

## 4. 验收判据（与 ROADMAP §4 批 2 对齐）

| 编号 | 判据 |
|---|---|
| R-1 | 10 局 dump `room.type`：首间必 battle、末间必 boss、每局 ≥1 个非战斗房、精英房不在第一间 |
| R-2 | 非战斗房（treasure/shop/shrine/rest）合计权重 ≤ 35% |
| R-3 | 宝箱必须持钥匙才能开，精英房必掉一把钥匙，商店可买钥匙（不断供） |
| R-4 | 商店三件货明码标价，金币不足有提示且不扣钱 |
| R-5 | 篝火付 2 金币回 6 血，只能触发一次 |
| R-6 | 小地图 3×3 反映"已走 / 当前 / 未走"，房间类型有颜色区分，进门即更新 |

---

## 5. 实施结果（2026-11-20，已落地）

| 项 | 落地情况 |
|---|---|
| 宝箱 | `Items/Treasure/BigTreasureChest.png`（32×14 = 2 帧 16×14）。原计划用 Little（32×16），实测打开帧在 2.4× 下像"木框"，换红箱后辨识度明显更好；开箱后切第 2 帧 + 金色 upgrade 特效 + 三件掉落撒到 44px 外，不会被一开就自动捡走 |
| 钥匙 | `GoldKey.png` 12×8；精英必掉、商店 5 金币、HUD 计数；宝箱 0 钥匙时只弹"需要 1 把钥匙"，不扣除任何东西 |
| 光环 | **改用 `FX/Magic/Circle/SpriteSheetOrange.png`**（128×32，4 帧 32×32 橙色扩散圆环）。原候选 `Aura/SpriteSheetWhite.png` 实测只在人物右侧显示两根细线（该图是"爪痕"不是光环），直接换件，不画图 |
| 篝火 | `assets/01-primary/external/campfire-16x16.png`（OGA krial CC0），3× 缩放，4 帧 8fps 循环，尺寸与角色一致 |
| 商店 | 行脚商（`villager2` 淡蓝 tint）+ 3 个悬浮货图标（武器/红心/钥匙）+ 说话结束自动接价目面板；价格 10 / 4 / 5 |
| 小地图 | `Graphics` 3×3 点阵，右上角，已走按房型上色、当前白框、未走暗格 |
| 精英 | 同 kind 放大 2.5×、血量 ×2.4、伤害 ×1.2、速度 ×1.1、暖色 tint、脚下橙色光环；死亡必掉 1 钥匙 + 1 武器 |

外部件仍为 **1 件**（篝火），自绘仍为 **1 处**（小地图点阵）。
