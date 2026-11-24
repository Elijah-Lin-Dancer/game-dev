# 批 21 / G2-4：火山群系、落灰气候与 v6 存档

日期：2026-11-24

## 范围

把开放世界「远征」推进到第五群系：新增火山 6 屏、熔匠 赤砧、委托「拾火五枚」、14 枚火种与落灰气候；`na.world` 由 v5 升到 v6，总地图 30 屏。

本轮继续执行 G2-3 建立的比例硬约束：所有摆件、NPC、草药按 **PNG alpha 可见 bbox** 对 32px 玩家（16×16 源帧 ×2）校准，不用画布留白充数；基础 16px 地形只做颜色重映射，不重绘。

## 内容与数据

| 项 | 值 |
|---|---|
| 总屏数 | 30（`field / bamboo / desert / snow / volcano` 各 6） |
| 火山屏 | `volcano-1 焦原`、`volcano-2 熔河`、`volcano-3 铁砧`、`volcano-4 黑曜坡`、`volcano-5 灰口`、`volcano-6 火心` |
| 天气 | `volcano-3` 晴；其余 5 屏落灰（`ashFall` + `ashVeil α0.10`，暗角 0.30） |
| NPC | `volcanoSmith`「熔匠 赤砧」，`volcano-3`，`x=350 / y=232 / frame=0` |
| 委托 | `volcanoQuest = { id:'volcano5', name:'拾火五枚', npc:'volcanoSmith', need:5, yield:2, rewardTokens:2 }` |
| 采集点 | 14 枚火种，按 2 / 2 / 3 / 2 / 2 / 3 分布在火山 1–6 |
| 存档 | `na.world v6`，`SCREENS=30`，新增 `volcanoHerbs / volcanoQuest`；v5→v6 迁移保留旧字段并即时落盘 |

## 火山 6 屏取景

| 屏 | 名字 | 天气 | 主要摆件 / 说明 |
|---|---|---|---|
| volcano-1 | 焦原 | 落灰 | 黑曜尖柱、熔岩裂口、火种；入口荒原 |
| volcano-2 | 熔河 | 落灰 | 熔岩池与尖柱夹出的熔河通道 |
| volcano-3 | 铁砧 | 晴 | 熔岩锻炉 + 熔匠 + 篝火；唯一晴天与委托点 |
| volcano-4 | 黑曜坡 | 落灰 | 密集尖柱坡；横向穿越 |
| volcano-5 | 灰口 | 落灰 | 裂口与灰雾；接近火心 |
| volcano-6 | 火心 | 落灰 | 大熔岩池、尖柱环与篝火；群系终点 |

`volcano-3` 最终摆位：`volcanoForge 250,246,1.15`、`campfire 420,244,1.6`、`volcanoSpire 70,206,1.2`、`volcanoVent 440,236,0.9`；三个火种为 `[150,222] / [400,216] / [240,220]`，避开 NPC 与玩家初始落点。`volcano-6` 篝火同为 `1.6`，尖柱 `430,206,.95`。

## 素材

| 件 | 源 | 源尺寸 | 正式输出 | 运行时 / 比例 |
|---|---|---|---|---|
| 熔岩锻炉 | `art-src/g2/volcano-forge.cjs`（seed242） | 96×128 / 1 向 | `volcano-forge.png` 96×128 | `volcanoForge`；约 3.59×玩家 |
| 熔匠 赤砧 | `art-src/g2/volcano-smith.cjs`（seed243） | 256×64 / 4 向 | `volcano-smith.png` 64×64 正面 | 火山 NPC；1.28×玩家，`.95` 显示缩放 |
| 火种 | `art-src/g2/volcano-ember.cjs`（seed244） | 32×48 / 1 向 | `volcano-ember.png` 32×48 | 火山采集；约 0.73×玩家 |
| 熔岩池 | `art-src/g2/volcano-lava.cjs`（seed245） | 64×48 / 1 向 | `volcano-lava.png` 64×48 | `volcanoLava`；0.75–1.20×玩家 |
| 黑曜尖柱 | `art-src/g2/volcano-spire.cjs`（G2 后备件重导） | 64×96 / 1 向 | `volcano-spire.png` 64×96 | `volcanoSpire`；2.46–3.36×玩家 |
| 熔岩裂口 | `art-src/g2/volcano-vent.cjs`（G2 后备件重导） | 64×48 / 1 向 | `volcano-vent.png` 64×48 | `volcanoVent`；0.75–1.22×玩家 |
| 16px 火山地 | NinjaAdventure CC0 `TilesetField.png` 帧 21 调色 | 16×16 | `volcano-tile.png` 16×16 | `volcanoTile`；`(173,188,58)→(44,36,38)`、`(116,163,52)→(28,23,25)` |

熔匠经过两次回炉：初版是过宽的棕色方块，二版仍偏「木桩」，最终改为接近守灯人的长外套剪影 + 围裙 + 锤子 + 火种挂饰。图集 `frame0` 为正面、`frame2` 为背面，数据显式 `frame:0`，`buildNPC` 支持 `n.frame`。

- 对照板：`docs/revamp/g2-3d/volcano-props-board.png`（1600×660，6 件 + 比例 + 来源）。
- 源图集：`volcano-forge / smith / ember / lava / spire / vent` 的 `*-atlas.png/json` 同目录。
- 复现：`INK_STUDIO=/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio node art-src/g2/render-g2.cjs` → `python3 tools/crop_volcano.py`。
- 来源：新 4 件为 ink-studio 3D 生成；尖柱 / 裂口为 G2 后备 3D 件重导；16px 火山地是 NinjaAdventure CC0 调色；篝火为 krial CC0。`assets/CREDITS.md` 已登记。

## 比例审计（硬约束）

口径：PNG alpha 可见 bbox × `p.scale × PROP_SCALE[kind]`，基准玩家可见高度 32px。

| 类 | 实测 |
|---|---|
| 锻炉 | 3.59× |
| 熔匠 | 1.28× |
| 火种 | 0.73× |
| 熔岩池 | 0.75–1.20× |
| 黑曜尖柱 | 2.46–3.36× |
| 熔岩裂口 | 0.75–1.22× |
| 篝火 | 1.04× |

`PROP_SCALE` 新增：`volcanoSpire 1.2 / volcanoVent 2.0 / volcanoForge 1.0 / volcanoLava 3.0`；`audit_scale.py` 新增火山摆件 / 草药 / NPC 与篝火下限 0.7。结果：**139 实例 / 0 FAIL**。

## 运行时

- `world.js` 新增 `volcano` profile；`TINT.volcano = UI.world.volcano`；`UI.world` 补 `volcano / volcanoLight / volcanoDark / volcanoVeil / ash / ember`。
- 地表 `volcanoTile`，`whiteGround`、`shade .16`、`rim Light .30`、`deco α.30`；跨群系接缝沿用混色。
- 落灰：`ashFall` 用 `dust` 纹理 + `UI.world.ash` 着色，`ashVeil α0.10`，`worldVig 0.30`；`applyWeather` 按屏启停。
- `buildProp` 新增 `volcanoForge / volcanoLava / volcanoSpire / volcanoVent`；forge 底部块 `84*k×16`、spire `20*k×20` 做为碰撞。
- `vent / lava` 的硬边圆形光晕改为柔和 `aura` 叠加，forge / lava / vent 加 ADD 热光；避免高亮圆盘像「大地洞」。
- `buildHerbs` 用 `volcanoEmber`、缩放 1.3；NPC 对白 / 交付文本补熔匠分支。

## 验证

| 项 | 结果 |
|---|---|
| 30 屏 / 5 NPC / 65 采集点 | 通过；五群系 ID 完整，`errs=[]` |
| 火山 6 屏天气 | 通过；`volcano-3=clear`，其余 `ash`；`ashVeil α.10` |
| 熔匠委托 | 接取 `active` → 5 个节点共 10 枚 → 面板「需要 5 枚火种，当前 10 枚」→ 交付 `done / 剩余 5 / tokens 2`，对白「火种够了。」 |
| v5→v6 迁移 | 通过；`v=6 / screens=30 / visited` 保留，`snowQuest=active / tokens=7` 保留，补 `volcanoHerbs=0 / volcanoQuest=none` |
| 960 / 640 / 844×390 | 通过；逻辑分别 960×540、640×360、844×390→779×360；HUD / 面板无溢出 |
| 单文件 | 通过；`web/game.html?world` 30 屏 / 5 NPC，`errs=[]` |
| PWA 断网 | 通过；`na-b18-64a58679` / 12 条；`setOffline(true)` reload 仍 30 屏 / 5 NPC，`errs=[]` |
| 构建 / 冒烟 | 通过；图集 148 切片 / 203 KB；首屏 1914 KB / gzip 785 KB；`assets.db63aacd.js` 120 KB、`game.19501372.js` 304 KB；单文件 2,072,254 B；`npm run smoke` 9 项 PASS |
| Pages 线上 | 通过；入口 `game.19501372.js` + `assets.db63aacd.js`；30 屏 / 5 NPC / 火山 6；熔匠 `active/0 → 10 枚 → done / 剩余 5 / tokens 2`；PWA `na-b18-64a58679` / 12 条；844×390 正常；`errs=[]` |

证据：本地 `docs/revamp/g2/g2-volcano-1..6-960.png`、`g2-volcano-3-final-960.png`、`g2-volcano-npc-960.png`、`g2-volcano-quest-960.png`、`g2-volcano-done-960.png`、`g2-volcano-3-640.png`、`g2-volcano-3-844x390.png`、`g2-volcano-single-960.png`、`g2-volcano-pwa-960.png`；线上 `g2-online-volcano-3-960.png`、`g2-online-volcano-npc-960.png`、`g2-online-volcano-quest-960.png`、`g2-online-volcano-done-960.png`、`g2-online-volcano-844x390.png`；素材板与源图集在 `docs/revamp/g2-3d/`。

## 已知限制 / 下一步

- 火山目前只有 1 条委托；G2 总量 30 屏 / 5 委托，目标 10 条委托，还差雪原第二条 + 火山第二条 + 草原 / 竹林 / 沙漠各 1。
- 篝火传送未接；world 场景触屏未接（只有 Play 有触屏）。
- 熔岩格持续伤害未做；本轮 `lava / vent` 仅为摆件与光效，不碰碰撞与生命值。
- `volcano-6` 作为群系终点，暂未接世界 Boss（G3）。
