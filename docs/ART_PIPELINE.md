# ART PIPELINE：3D 像素素材生产口径

日期：2026-11-23
状态：项目级素材管线，已采纳；**运行时仍不接 ink-studio**。
工具：`https://github.com/siliconjungle/shapeshift-labs-ink-studio`
固定 commit：`823981c`（0.1.0）
本地固定 checkout：`/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio`
许可：MIT（正式发行保留版权与许可声明）

## 核心原则

3D 模型只做**离线源**：SDF 雕塑 → pixel-art Gaussian splat → 透明 RGBA 多方向图集 → 量化/修边 → 现有 Phaser 图集。
不把 `createRenderer`、WebGL2 splat 或 11.2 MB 浏览器 bundle 接进游戏运行时。

## 素材适用范围

| 类别 | 用 3D 工具 | 交付尺寸 / 方向 | 说明 |
|---|---|---|---|
| 主角 / 人形 NPC / 精英 | 可用，需手修 | 32–64 px，4 向 | 16px 原图不推荐；64 源图缩到 32 |
| Boss / 大型怪物 | 主力使用 | 64–128 px，4 向 | 剪影优先；96 源图缩到 64 |
| 武器 / 装备 / 遗物 | 主力使用 | 64–80 px，1 向图标 + 4 向预览 | 透明 RGBA；UI 用单视角 |
| 场景摆件（树 / 岩 / 洞口 / 桥 / 篝火 / 遗迹） | 可用 | 32–128 px，单视角 | 碰撞与 tile 对齐单独处理 |
| 背景 / 过场 / 标题 / 加载 / Boss 主视觉 | 可用 | 960×540 或 1600×1000 | 只做离线图，不做运行时 splat |
| 基础地形 tile（草地 / 沙 / 水 / 墙面） | **不用** | 保持现有 16px tile | 3D 烘焙会破坏无缝与网格 |
| UI 九宫格 / 字体 / 图标底板 | **不用** | 现有 UI 组件 | 3D 管线不适合严格九宫格 |

## 生产步骤（每个资产都走）

1. 写 brief：目标显示尺寸、方向数、帧数、调色板、pivot、是否透明。
2. `art-src/<asset>/` 放场景 `.cjs` 与固定 seed；不要依赖 demo 模型。
3. `spriteAtlas` 导出 RGBA + JSON（rect / pivot / unitsPerPixel / yaw）。
4. PIL 最近邻缩放到目标显示尺寸；量化到现有游戏色板，手工修边、补轮廓、去掉浮点。
5. 在 640 / 960 实机或 mock 场景看剪影、脚点、遮挡和碰撞；不通过就回炉。
6. 只在验收后进入正式图集 / `assets/`；源文件与导出图进 `docs/revamp/<batch>/3d-pixel/`。

## 批次映射

- **批 13 小屋（已完成）**：3 NPC 头像 / 立绘、锻造坊与训练场摆件；5 件 64×64 已进图集，源 `art-src/hub/` 与 `docs/revamp/b13-3d/`。
- **批 14 支线/隐藏/条件**：13 个特殊关的入口图、场景主视觉、Boss 变体。
- **批 15 剧情**：6 张过场卡、结局主视觉、引路人/铁匠/商人对话头像。
- **批 16 元进度**：20 个成就图标、第二技能图标、周目词条图标。
- **批 17 工程化**：PWA 图标 / 启动图 / 分享图；不进入游戏内 tile。
- **G2 五群系**：G2-1 竹林、G2-2 沙漠、G2-3 雪原、G2-4 火山、G2-5 火山第二委托与篝火均已接入；五群系 30 屏完成，基础地面仍走 16px tile 调色。G2-5 不新增美术，只补 campfire 落点。
- **G3 收尾（已完成）**：5 只世界 Boss（苔背巨兽 / 雾竹蜃 / 沙海蜃 / 霜灯巨鸮 / 熔心巨像）均为 ink-studio 3D 四向件，配套远征结局与 3 条成就；基础地面仍走 16px tile 调色。

## 批 13 产出（2026-11-23）

| 件 | 源 | 朝向 / 源尺寸 | 正式输出 | 用途 |
|---|---|---|---|---|
| 引路人 | `art-src/hub/guide.cjs` | 4 向 / 64×64 | `assets/01-primary/hub/npc-guide.png` | 小屋 NPC 卡 + 对话头像 |
| 铁匠 | `art-src/hub/smith.cjs` | 4 向 / 64×64 | `npc-smith.png` | 同上 |
| 商人 | `art-src/hub/merchant.cjs` | 4 向 / 64×64 | `npc-merchant.png` | 同上 |
| 铁砧 | `art-src/hub/anvil.cjs` | 1 向 / 64×64 | `forge-anvil.png` | 锻造坊顶卡 / 摆件 |
| 木桩 | `art-src/hub/dummy.cjs` | 1 向 / 64×64 | `train-dummy.png` | 训练场顶卡 / 摆件 |

- 4 向源图集全部保留在 `docs/revamp/b13-3d/*-atlas.png/json`；Hall 只用正面帧，后续剧情头像可复用同源。
- 64×64 是最终游戏尺寸，不再二次放大；以 48 / 72 px 显示时靠最近邻，不模糊。
- MIT 原文随正式素材：`assets/01-primary/hub/ink-studio-LICENSE.txt`；来源与作者行见 `assets/CREDITS.md`。

复现：

```bash
cd /home/user/Doubao/chats/38454996042111490/game-repo
INK_STUDIO=/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio \
node art-src/hub/render-hub.cjs
python3 tools/crop_hub.py
```

## G2-2 产出（2026-11-24）

| 件 | 源 | 源图集 | 正式输出 | 运行时状态 |
|---|---|---|---|---|
| 沙婆 | `art-src/g2/desert-nomad.cjs` | 256×64，4 向 | `desert-nomad.png` 64×64 | 沙漠 NPC，1.7 倍 |
| 沙枣丛 | `art-src/g2/desert-shrub.cjs` | 32×48，1 向 | `desert-shrub.png` 32×48 | 沙漠采集点，1.25 倍 |
| 沙海旧门（加高） | `art-src/g2/desert-arch.cjs` | 96×128，1 向 | `desert-arch.png` 96×128 | `desertArch`；两根柱碰撞、中间可走 |
| 沙棕（G2-2 当时） | NinjaAdventure `TilesetDesert.png` 裁切 | 48×48 | `desert-palm.png` 48×48 | 仅树冠切片；G2-3 已替换为 ink-studio 完整树，见下节 |
| 16px 沙地 | NinjaAdventure `TilesetField.png` 帧 21 调色 | 16×16 | `desert-tile.png` 16×16 | `desertTile` 地表 |

- 沙海旧门从 96×80 加高到 96×128，并删掉横在门洞底部的整条沙堤；两柱保留碰撞，中间可走。
- 沙婆 / 沙枣丛沿用 ink-studio 固定 seed；`desert-nomad` 4 向源图集保留，运行时只取正面首帧。
- `desertPalm` 与 `desertTile` 均来自 NinjaAdventure CC0 原包；沙地只做颜色重映射，不重绘 16px tile。
- 沙枣丛与沙婆均登记 `assets/CREDITS.md`；NinjaAdventure 原包 LICENSE 为 CC0 1.0。


## G3-3 产出（2026-11-25）

世界 Boss 第三只，沙海蜃；同批补沙海战场小怪与沙岩堆，`desert-6` 不再清场。玩家基线仍是 32px 可见高度；这不是沙门 / 神龛，也不是苔背巨兽换色，而是贴地游走的沙海活体。

| 件 | 源 | 源尺寸 | 正式输出 | 运行时 |
|---|---|---|---|---|
| 沙海蜃 待机 | `art-src/g3/sand-mirage.cjs`（seed 303，`pose=idle`） | 384×96，4 向 | `sand-mirage-idle.png` 384×96 | 世界 Boss；2.48× 玩家，79.2px |
| 沙海蜃 蓄力 | 同上，`pose=charge` | 384×96，4 向 | `sand-mirage-charge.png` 384×96 | 蓄力 / 扑击 / 横扫；2.25× 玩家，72.0px |
| 沙海蜃 咆哮 | 同上，`pose=roar` | 384×96，4 向 | `sand-mirage-roar.png` 384×96 | 入场 / 落地 / 死亡；2.85× 玩家，91.2px |
| 沙蚋 待机 / 疾走 | `art-src/g3/sand-scarab.cjs`（seed 304） | 256×64，4 向 × 2 姿态 | `sand-scarab-idle.png` / `sand-scarab-skitter.png` 256×64 | Boss 场小怪；0.93× / 0.89× 玩家 |
| 沙岩堆 | `art-src/g3/sand-rock.cjs`（seed 305） | 64×64，1 向 | `sand-rock.png` 64×64 | Boss 场石景；2.07–2.19× 玩家 |

- 造型：宽薄沙帆翼（后掠、前后向骨架）、低宽主躯干、三块覆瓦沙甲、新月背帆（半张 / 后掠 / 张开三态）、宽楔头 + 深眼窝 + 青焰瞳 + 金色高光、颊甲 / 沙玻璃短角 / 两颗小獠牙、四只短桨足 + 三枚沙玻璃爪、三节沙壳长鞭尾 + 玻璃倒刺 + 金色尾晶。
- 帧序：0 前 / 1 左 / 2 后 / 3 右；三姿态脚底统一 **65/96**，`originY=0.6771`；运行时 `scale=2.4`，静态姿态切帧 + 呼吸 tween；`mirror` 为同姿态 ADD 重影，不参与碰撞。
- 取景：`cam target [0,1.04,0], dist 10.2, pitch 0.13, yaw 0.04`；`charge` 的 `finTop 1.66`，把蓄力可见高度从 25px 提到 30px，保证 2.2× 下限。
- 对照板：`docs/revamp/g3-3d/sand-mirage-board.png`、`docs/revamp/g3-3d/sand-battle-board.png`；源元数据：`docs/revamp/g3-3d/sand-mirage-{idle,charge,roar}.json`、`sand-scarab-{idle,skitter}.json`、`sand-rock.json`。
- 审计：`python3 tools/audit_scale.py` 扩第三只 Boss + 沙蚋 + 沙岩堆 + battle 沙蓬 → **161 实例 / 0 FAIL**，沙海蜃 idle 2.48× / charge 2.25× / roar 2.85×；沙蚋 idle 0.93× / skitter 0.89×；沙岩堆 2.07–2.19×。
- 战场运行时：battle 沙蓬 3 节点复用 `desertShrub` + 绿色光晕，采后 45s 重生；沙蚋 9s 增援、首杀必掉心火；Boss 战右邻雪原暂隐 30 对象并补 7 项沙海延伸，胜利关闭后恢复；沙海蜃 `bodyTint=0xa68f73`。
- 复现：`node art-src/g3/render-g3.cjs`（需要 `INK_STUDIO` 指向固定 checkout）。
- 素材出处：ink-studio 生成件，工具 MIT，成品本项目自制；不涉及 Ninja Adventure 原 Boss 图。

## G3-2 产出（2026-11-24）

世界 Boss 第二只，雾竹蜃。玩家基线仍是 32px 可见高度；这不是放大竹节虫，也不是苔背巨兽换色，而是重新建模。

| 件 | 源 | 源尺寸 | 正式输出 | 运行时 |
|---|---|---|---|---|
| 雾竹蜃 待机 | `art-src/g3/bamboo-mirage.cjs`（seed 302，`pose=idle`） | 384×96，4 向 | `bamboo-mirage-idle.png` 384×96 | 世界 Boss；2.87–2.98× 玩家 |
| 雾竹蜃 蓄力 | 同上，`pose=charge` | 384×96，4 向 | `bamboo-mirage-charge.png` 384×96 | 蓄力 / 扑击；2.53–2.70× 玩家 |
| 雾竹蜃 咆哮 | 同上，`pose=roar` | 384×96，4 向 | `bamboo-mirage-roar.png` 384×96 | 挥击 / 落地 / 死亡；3.21–3.26× 玩家 |

- 造型：老竹高跷四腿、窄长竹龛、米纸窗 + 青焰、旧戏面（厚眉 / 空眼窝 / 青焰眼 / 朱砂额符与颊纹）、冠后竹角、长竹喙、龛下悬灯、三根断竹尾与纸铃。
- 帧序：0 前 / 1 左 / 2 后 / 3 右；三姿态脚底统一 73/96，`originY=0.7604`；运行时 `BOSS_SCALE=1.8`，静态姿态切帧 + 呼吸 tween。
- 对照板：`docs/revamp/g3-3d/bamboo-mirage-board.png`；源元数据：`docs/revamp/g3-3d/bamboo-mirage-{idle,charge,roar}.json`。
- 审计：`python3 tools/audit_scale.py` 扩两只 Boss → **145 实例 / 0 FAIL**，雾竹蜃 2.53–3.26× 班组通过。
- 复现：`node art-src/g3/render-g3.cjs`（需要 `INK_STUDIO` 指向固定 checkout）。
- 素材出处：ink-studio 生成件，工具 MIT，成品本项目自制；不涉及 Ninja Adventure 原 Boss 图。

## G3-1 产出（2026-11-24）

世界 Boss 第一只，苔背巨兽。玩家基线仍是 32px 可见高度；这不是把 GiantRacoon 换色，而是重新建模。

| 件 | 源 | 源尺寸 | 正式输出 | 运行时 |
|---|---|---|---|---|
| 苔背巨兽 待机 | `art-src/g3/moss-beast.cjs`（seed 301，`pose=idle`） | 384×96，4 向 | `moss-beast-idle.png` 384×96 | 世界 Boss；2.41–2.61×玩家 |
| 苔背巨兽 蓄力 | 同上，`pose=charge` | 384×96，4 向 | `moss-beast-charge.png` 384×96 | 蓄力 / 扑击；2.61–3.03×玩家 |
| 苔背巨兽 咆哮 | 同上，`pose=roar` | 384×96，4 向 | `moss-beast-roar.png` 384×96 | 挥击 / 落地 / 死亡；2.34–2.54×玩家 |

- 造型：四足低伏、宽背；6 块苔盖 + 3 块旧石背脊 + 5 根垂苔 + 3 株高蕨；骨色长獠牙、4 颗下齿、琥珀发光眼、背甲小蘑菇、喉部呼吸光。
- 帧序：0 前 / 1 左 / 2 后 / 3 右；底部 pivot `0.5,1`；运行时 `BOSS_SCALE=2.2`，用三相呼吸 tween 不是逐帧旋转。
- 对照板：`docs/revamp/g3-3d/moss-beast-board.png`；源元数据：`docs/revamp/g3-3d/moss-beast-{idle,charge,roar}.json`。
- 审计：`python3 tools/audit_scale.py` 新增三行 Boss → **144 实例 / 0 FAIL**，Boss 2.2–3.3× 班组通过。
- 复现：`node art-src/g3/render-g3.cjs`（需要 `INK_STUDIO` 指向固定 checkout）。
- 素材出处：ink-studio 生成件，工具 MIT，成品本项目自制；不涉及 Ninja Adventure 原 Boss 图。

## G2-5 产出（2026-11-24）

本轮 **0 新增美术件**。 `field-1` / `bamboo-4` 补的两个篝火落点复用既有 `campfire` 摆件（krial CC0，`16x16 Animated Campfire`）；三处炉眼复用 `volcanoVent`，火种复用 `volcanoEmber`，均为 G2-4 已登记的 ink-studio / G2 后备件重导。基础地形仍为 NinjaAdventure CC0 16px tile 调色。

- 比例审计：`python3 tools/audit_scale.py` → **141 实例 / 0 FAIL**；新增的 2 个实例仅为 campfire 落点。
- 来源口径不变：篝火 krial CC0；炉眼 / 火种 / 熔岩锻炉等为 ink-studio 生成（工具 MIT，成品自制）；16px 火山地 CC0 调色。
- 对照板 / 源图集仍用 `docs/revamp/g2-3d/volcano-props-board.png` 与 `volcano-*-atlas.png/json`。

## G2-4 产出（2026-11-24）

火山群系。玩家基线仍是 **32px 可见高度**，所有件按 PNG alpha bbox 审计。

| 件 | 源 | 源尺寸 | 正式输出 | 运行时 |
|---|---|---|---|---|
| 熔岩锻炉 | `art-src/g2/volcano-forge.cjs`（seed242） | 96×128，1 向 | `volcano-forge.png` 96×128 | `volcanoForge`；3.59×玩家 |
| 熔匠 赤砧 | `art-src/g2/volcano-smith.cjs`（seed243） | 256×64，4 向 | `volcano-smith.png` 64×64 正面 | 火山 NPC；1.28×玩家 |
| 火种 | `art-src/g2/volcano-ember.cjs`（seed244） | 32×48，1 向 | `volcano-ember.png` 32×48 | 火山采集；0.73×玩家 |
| 熔岩池 | `art-src/g2/volcano-lava.cjs`（seed245） | 64×48，1 向 | `volcano-lava.png` 64×48 | `volcanoLava`；0.75–1.20×玩家 |
| 黑曜尖柱 | `art-src/g2/volcano-spire.cjs` | 64×96，1 向 | `volcano-spire.png` 64×96 | `volcanoSpire`；2.46–3.36×玩家 |
| 熔岩裂口 | `art-src/g2/volcano-vent.cjs` | 64×48，1 向 | `volcano-vent.png` 64×48 | `volcanoVent`；0.75–1.22×玩家 |
| 16px 火山地 | NinjaAdventure CC0 `TilesetField.png` 帧 21 | 16×16 | `volcano-tile.png` 16×16 | `volcanoTile`；只做色 remap |

- 对照板：`docs/revamp/g2-3d/volcano-props-board.png`，6 件 + 比例 + 来源。
- 源图集：`volcano-forge / smith / ember / lava / spire / vent` 的 `*-atlas.png/json`。
- 审计：`python3 tools/audit_scale.py`，**139 实例 / 0 FAIL**；`PROP_SCALE` 为 `volcanoSpire 1.2 / volcanoVent 2.0 / volcanoForge 1.0 / volcanoLava 3.0`。
- 复现：`node art-src/g2/render-g2.cjs` → `python3 tools/crop_volcano.py`。
- 素材出处：4 件新 3D + 2 件重导为 ink-studio 生成；火山地是 NinjaAdventure CC0 调色；篝火是 krial CC0。

## G2-3 产出（2026-11-24）

雪原与比例基线重做。所有运行时尺寸按 **alpha 可见 bbox** 校准，不以画布留白为准；玩家基线 `16×16 ×2 = 32px`。

| 件 | 源 | 源尺寸 | 正式输出 | 运行时 |
|---|---|---|---|---|
| 雪松 | `art-src/g2/snow-pine.cjs` | 96×128，1 向 | `snow-pine.png` 96×128 | `snowPine`；2.47–3.53×玩家 |
| 雪中小祠 | `art-src/g2/snow-shrine.cjs` | 96×128，1 向 | `snow-shrine.png` 96×128 | `snowShrine`；3.37×玩家 |
| 守灯人 阿霁 | `art-src/g2/snow-keeper.cjs` | 256×64，4 向 | `snow-keeper.png` 64×64 正面 | 雪原 NPC；1.18×玩家 |
| 雪灯草 | `art-src/g2/snow-lantern.cjs` | 32×48，1 向 | `snow-lantern.png` 32×48 | 雪原采集；0.69×玩家 |
| 完整沙棕 | `art-src/g2/desert-palm.cjs` | 64×96，1 向 | `desert-palm.png` 64×96 | 替换 G2-2 的 48×48 树冠；约 3.3×玩家 |
| 16px 雪地 | NinjaAdventure CC0 `TilesetField.png` 帧 21 | 16×16 | `snow-tile.png` 16×16 | `snowTile`；只改调色 |

- 图集对照板：`docs/revamp/g2-3d/g2-props-board.png`，15 件（14 件 ink-studio 3D + 1 件 krial CC0 篝火）。
- 比例对照板：`docs/revamp/g2/scale-baseline-board.png`。
- 审计：`python3 tools/audit_scale.py`，106 实例 / 0 FAIL。
- 复现：`node art-src/g2/render-g2.cjs` → `python3 tools/crop_snow.py` → `python3 tools/crop_desert.py`。
- 素材出处：ink-studio 生成件与本项目自制成品；工具 MIT；基础 tile、树 / 灌木 / 旧门等仍为 NinjaAdventure CC0；篝火为 krial CC0。

## G2-1 产出（2026-11-24）

源目录 `art-src/g2/`，固定 seed；运行时只读导出的 PNG / 图集，不接 ink-studio。

| 件 | 源 | 源图集 | 正式输出 | 运行时状态 |
|---|---|---|---|---|
| 竹林竹丛 | `art-src/g2/bamboo-grove.cjs` | 64×96，1 向 | `assets/01-primary/world/bamboo-grove.png` | 已接入 `bamboo` 摆件 |
| 竹林石门 | `art-src/g2/bamboo-gate.cjs` | 96×160，1 向 | `assets/01-primary/world/bamboo-gate.png` | 已接入 `bambooGate`；两根柱碰撞，中间可走 |
| 竹隐 | `art-src/g2/bamboo-hermit.cjs` | 256×64，4 向 | `assets/01-primary/world/bamboo-hermit.png`（正面 64×64） | 已接入竹林 NPC；运行只用正面帧 |
| 沙海旧门 | `art-src/g2/desert-arch.cjs` | 96×128，1 向 | `assets/01-primary/world/desert-arch.png` | G2-2 已接入 `desertArch`；两柱碰撞、中间可走 |
| 枯沙木 | `art-src/g2/desert-dead-tree.cjs` | 64×80，1 向 | `assets/01-primary/world/desert-dead-tree.png` | G2-2 已接入 `desertDeadTree` |
| 雪松 | `art-src/g2/snow-pine.cjs` | 96×128，1 向 | `assets/01-primary/world/snow-pine.png` | G2-3 已接入 `snowPine`；树干碰撞 |
| 雪中小祠 | `art-src/g2/snow-shrine.cjs` | 96×128，1 向 | `assets/01-primary/world/snow-shrine.png` | G2-3 已接入 `snowShrine`；3.37×玩家 |
| 黑曜尖柱 | `art-src/g2/volcano-spire.cjs` | 64×96，1 向 | `assets/01-primary/world/volcano-spire.png` | G2-4 已接入 `volcanoSpire`；2.46–3.36×玩家 |
| 熔岩裂口 | `art-src/g2/volcano-vent.cjs` | 64×48，1 向 | `assets/01-primary/world/volcano-vent.png` | G2-4 已接入 `volcanoVent`；0.75–1.22×玩家 |

- 图集对照板：`docs/revamp/g2-3d/g2-props-board.png`；G2-1 的 9 个 `*-atlas.png/json` + G2-2 的 `desert-nomad / desert-shrub` 同目录。
- 竹林石门从 96×64 两次回炉到 96×160，最终改为石拱门：两柱 + 弧形拱券 + 拱心石 + 低门槛，解决 1x 下“横梁像桌子”的剪影问题。
- 竹隐源图 4 向保留；正式 PNG 只取正面首帧 64×64，运行时显示 1.5 倍，避免透明边过多导致角色显小。
- 正式输出已登记 `assets/CREDITS.md`；MIT 原文随包 `assets/01-primary/world/ink-studio-LICENSE.txt`。

复现：

```bash
cd /home/user/Doubao/chats/38454996042111490/game-repo
INK_STUDIO=/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio \
node art-src/g2/render-g2.cjs
# 再从 docs/revamp/g2-3d/*-atlas.png 用最近邻裁到正式尺寸
```

## 定位与复现

```bash
cd /home/user/Doubao/chats/38454996042111490/toolchains/ink-studio
git checkout 823981c
npm run build
node cli/ink-studio.js render examples/sculpt.js --colored --out /tmp/sculpt.png
```

渲染现有试验：

```bash
cd /home/user/Doubao/chats/38454996042111490/game-repo
INK_STUDIO=/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio \
node art-src/3d-pixel-pilot/render.cjs
```

若本地 checkout 丢失，按上面的 GitHub 地址重新 clone 并 checkout `823981c`；`docs/revamp/3d-pixel/` 保留本轮样张，`art-src/3d-pixel-pilot/` 保留场景源。

## 三条硬规则

1. 不直接替换现有 16px 基础 tile；3D 只做“可独立摆放的物件”。
2. 任何资产先在目标显示尺寸过剪影；不能靠外描边或放大后才好看。
3. 不进运行时；所有产物最终都是 PNG / atlas / 静态图。

## G3-4 / G3-5 产出（2026-11-25）

G3 世界 Boss 第 4、5 只：雪原霜灯巨鸮、火山熔心巨像。两只都没有使用 Ninja Adventure 原 Boss 图，也不是 image-to-image；按 ink-studio 离线 SDF → 像素 → 四向图集生成，运行时只读成品 PNG。

| 件 | 源 | 源尺寸 | 正式输出 | 运行时 |
|---|---|---|---|---|
| 霜灯巨鸮 待机 | `art-src/g3/frost-owl.cjs`（seed 306，`pose=idle`） | 384×96，4 向 | `frost-owl-idle.png` 384×96 | 世界 Boss；3.09× 玩家，98.8px |
| 霜灯巨鸮 蓄力 | 同上，`pose=charge` | 384×96，4 向 | `frost-owl-charge.png` 384×96 | 蓄力 / 扑击；2.89× 玩家，92.3px |
| 霜灯巨鸮 咆哮 | 同上，`pose=roar` | 384×96，4 向 | `frost-owl-roar.png` 384×96 | 入场 / 霜锥 / 死亡；3.24× 玩家，103.7px |
| 熔心巨像 待机 | `art-src/g3/magma-colossus.cjs`（seed 307，`pose=idle`） | 384×96，4 向 | `magma-colossus-idle.png` 384×96 | 世界 Boss；3.11× 玩家，99.4px |
| 熔心巨像 蓄力 | 同上，`pose=charge` | 384×96，4 向 | `magma-colossus-charge.png` 384×96 | 蓄力 / 扑击；3.04× 玩家，97.2px |
| 熔心巨像 咆哮 | 同上，`pose=roar` | 384×96，4 向 | `magma-colossus-roar.png` 384×96 | 入场 / 炉口 / 死亡；3.24× 玩家，103.7px |

- 造型：霜灯巨鸮是直立守夜鸮，白色前半球面盘、深色眼窝、冰蓝眼、三叉冰枝角、厚羽胸腹、霜刃翼缘、胸口旧雪灯、雪岩基座；熔心巨像是冷灰蓝黑曜岩人形，宽肩窄腰、胸口炉膛 / 背面热缝、后掠黑角、肩部烟管、铁砧拳、黑曜台基座。
- 帧序：0 前 / 1 左 / 2 后 / 3 右；脚底霜鸮 **75/96**、熔像 **70/96**；运行时 `scale=1.62 / 2.16`，静态姿态切帧 + 呼吸 tween。
- 取景：两只均单独建模、分别取景；没有把苔背巨兽 / 沙海蜃换色复用。
- 对照板：`docs/revamp/g3-3d/frost-owl-board.png`、`magma-colossus-board.png`；源元数据：`frost-owl-{idle,charge,roar}.json`、`magma-colossus-{idle,charge,roar}.json`。
- 审计：`python3 tools/audit_scale.py` **170 实例 / 0 FAIL**；霜鸮 idle 3.09× / charge 2.89× / roar 3.24×；熔像 idle 3.11× / charge 3.04× / roar 3.24×。
- 复现：`INK_STUDIO=/.../toolchains/ink-studio node art-src/g3/render-g3.cjs`。
- 素材出处：ink-studio 生成件，工具 MIT，成品本项目自制；不涉及 Ninja Adventure 原 Boss 图。

## G4-1 产出（2026-11-25）

第六群系雾泽的 4 件角色 / 摆件 / 采集物与 1 张湿苔调色 tile。4 件均按 ink-studio 离线 SDF → 像素 → 图集生成，运行时只读成品 PNG；基础 16px 地形仍用现有 `TilesetField` 调色，不换 tile 体系。

| 件 | 源 | 源尺寸 | 正式输出 | 运行时 |
|---|---|---|---|---|
| 守泽人 阿芦 | `art-src/g4/mire-keeper.cjs`（seed 401，四向） | 256×64，4 向 × 64×64 | `mire-keeper.png` 64×64 | `mire-3` NPC；bbox 42px / 1.24×；origin 54/64 |
| 芦苇 | `art-src/g4/mire-reed.cjs`（seed 402，单向） | 64×96 | `mire-reed.png` 64×96 | 各屏摆件；bbox 63px / 2.31×；origin 75/96 |
| 沉祠 | `art-src/g4/mire-shrine.cjs`（seed 403，单向） | 96×128 | `mire-shrine.png` 96×128 | `mire-3 / mire-6`；bbox 96px / 3.0×；origin 110/128 |
| 灯芯草 | `art-src/g4/mire-herb.cjs`（seed 404，单向） | 32×48 | `mire-herb.png` 32×48 | 采集节点；bbox 16px / 0.675×；origin 32/48 |
| 湿苔 tile | `TilesetField` 帧 21 + 湿苔绿调色 | 16×16 | `mire-tile.png` | `buildGround` 的 `mireTile` 分支 |

- 造型：守泽人是斗笠 + 深绿蓑衣 + 木杖 + 腰间旧灯芯的泽地守人；芦苇是高秆细叶 + 锈褐穗 + 浅水根；沉祠是低矮石基 + 木柱 + 湿苔顶 + 暖纸灯；灯芯草是冷水叶簇 + 白蓝灯芯。
- 复用件：`mireArch` 复用 `desertArch` 加 tint；`mireDeadTree` 复用 `desertDeadTree`；`mireRock` 复用 `sand-rock`；`mireBush` 复用 `worldBush`。
- 对照板：`docs/revamp/g4-1/g4-mire-3d.png`；源图集 / json：`docs/revamp/g4-3d/mire-*-atlas.png`。
- 审计：`python3 tools/audit_scale.py` **217 实例 / 0 FAIL**；keeper 1.24×、reed 2.31×、shrine 3.0×、herb 0.675×。
- 复现：`INK_STUDIO=/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio node art-src/g4/render-g4.cjs`，再 `python3 tools/crop_mire.py`。
- 素材出处：4 件 ink-studio 生成件，工具 MIT，成品本项目自制；tile 为 NinjaAdventure CC0 调色。

## G4-2 产出（2026-11-25）

雾泽终局 Boss「沉灯水魇」1 件，仍按 ink-studio 离线 SDF → 像素 → 四向图集生成，运行时只读成品 PNG；没有把 Ninja Adventure 原 Boss 图换色，也没有 image-to-image。

| 件 | 源 | 源尺寸 | 正式输出 | 运行时 |
|---|---|---|---|---|
| 沉灯水魇 | `art-src/g4/mire-wraith.cjs`（seed 405，四向） | 384×96，4 向 × 96×96 × 3 姿态 | `mire-wraith-idle.png` / `-charge.png` / `-roar.png` | `mire-6` Boss；bbox idle `(24,12,72,77)`、charge `(24,15,72,77)`、roar `(24,9,72,77)`；origin 78/96；scale 1.48 |

- 造型：一盏沉在沼底的旧祠灯，灯壳被水草与断木缠住，长成弓背灯影；正面是带冷焰灯窗的旧灯，背面是裂开的祠脊与水草拖尾。
- 姿态：`idle` 弓背低头 / `charge` 灯窗收束 / `roar` 灯窗张开；帧序 0 前 / 1 左 / 2 后 / 3 右。
- 暗色灯影在雾泽地面上原本偏黑；后一轮把 body palette 的 P2–P5 提亮为 `0x1b2f24 / 0x2c4937 / 0x3e5b45 / 0x5d7b5e`，重新渲染并复制到运行时。
- 对照 / 元数据：`docs/revamp/g4-3d/mire-wraith-*.png` + 同名 `.json`；运行时 `assets/01-primary/world/mire-wraith-*.png`。
- 审计：`python3 tools/audit_scale.py` **220 实例 / 0 FAIL**；`mireWraith` 三姿态 **3.0–3.29×**，在 2.2–3.3 内。
- 复现：`INK_STUDIO=/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio node art-src/g4/render-g4.cjs`。
- 素材出处：ink-studio 生成件，工具 MIT，成品本项目自制；不涉及 Ninja Adventure 原 Boss 图。

## G4-7 产出（2026-11-26）

守灯人阿烬的独立 3D 像素立绘 1 件。此前 G4-5 / G4-6 的阿烬复用守泽人阿芦的 `mireKeeper + flipX`；本轮按 ink-studio 离线 SDF → 像素 → 四向图集生成，运行时只读成品 PNG。阿芦仍使用 `mireKeeper`，没有换脸。

| 件 | 源 | 源尺寸 | 正式输出 | 运行时 |
|---|---|---|---|---|
| 守灯人 阿烬 | `art-src/g4/mire-lampkeeper.cjs`（seed 406，四向） | 256×64，4 向 × 64×64 | `mire-lampkeeper-atlas.png` 256×64；首帧裁成 `mire-lampkeeper.png` 64×64 | `mire-6` NPC；bbox `(17,9,45,55)`；审计 **39.9px / 1.25×**；origin 54/64；scale 0.95 |

- 造型：深灰高兜帽 + 灰披肩 + 左手长灯杆 + 胸前暖色灯笼 + 腰间余烬挂饰；与阿芦的斗笠 / 深绿蓑衣 / 木杖区分。
- 帧序：0 前 / 1 左 / 2 后 / 3 右；运行时按 NPC 朝向切帧。
- 对照板：`docs/revamp/g4-7/g4-7-lampkeeper-portrait-board.png`；源图集 / 元数据：`docs/revamp/g4-3d/mire-lampkeeper-atlas.png/.json`。
- 审计：`python3 tools/audit_scale.py` **221 实例 / 0 FAIL**；阿烬 39.9px / 1.25×；阿芦仍 1.24×。
- 复现：`INK_STUDIO=/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio node art-src/g4/render-g4.cjs`，再 `python3 tools/crop_mire.py`。
- 素材出处：ink-studio 生成件，工具 MIT，成品本项目自制；不涉及 Ninja Adventure 原图。
