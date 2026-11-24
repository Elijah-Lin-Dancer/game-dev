# 批 20 / G2-3：雪原 6 屏、比例基线重做与守灯人委托

日期：2026-11-24
范围：在 G2-2 的 18 屏世界上追加 `snow-1..6`，把雪原做成第四个可走、可采、可委托的群系；同时重做全 G2 摆件 / NPC / 采集物的显示比例，明确“素材来源 = 素材库 / ink-studio 生成”。

## 1. 世界与数据

`web/data/world.json` 升 **v5**，共 **24 屏**：

| 段 | 屏 | 群系 |
|---|---|---|
| 草原 | `field-1..6` | `field` |
| 竹林 | `bamboo-1..6` | `bamboo` |
| 沙漠 | `desert-1..6` | `desert` |
| 雪原 | `snow-1..6` | `snow` |

雪原屏名：`雪坳 / 霜林 / 破祠 / 石灯 / 风口 / 白原`。其中 `snow-1/2/3/5/6` 是 `snow`（雪），`snow-4` 是 `clear`（晴），保留一个可喘息的清晰屏。雪原共 **17 棵雪松、1 座雪中小祠、1 个篝火、14 个雪灯草采集点**；雪松分布为 `snow-1:2 / 2:3 / 3:2 / 4:3 / 5:3 / 6:4`，雪灯草分布为 `雪坳 2 / 霜林 2 / 破祠 3 / 石灯 2 / 风口 2 / 白原 3`。

雪原 NPC 在 `snow-3`：

```json
{ "id": "snowkeeper", "name": "守灯人 阿霁", "x": 320, "y": 232, "quest": "snow" }
```

委托：

```json
{ "id": "snow5", "name": "雪灯五盏", "npc": "snowkeeper",
  "need": 5, "yield": 2, "rewardTokens": 2 }
```

`na.world` 升 **v5**：

```js
VERSION = 5;
SCREENS = [field-1..6, bamboo-1..6, desert-1..6, snow-1..6]; // 24
// 新字段
snowHerbs: 0,
snowQuest: 'none'
```

v4→v5 迁移保留 `visited / herbs / quest / bambooHerbs / bambooQuest / desertHerbs / desertQuest / boss / tokens`，补 `snowHerbs=0 / snowQuest='none'` 并即时写回。旧 G0 的 `field / bamboo / desert` 仍映射 `field-1 / field-3 / field-6`。

## 2. 比例基线（本轮硬约束）

用户明确要求：**植物、动物、NPC、装备、建筑摆件都不能比玩家还小**，尤其小祠堂、小房子、大树不能缩成桌面摆件。此前的 3D 素材画布透明留白很大，按画布尺寸算会让视觉高度严重偏小；本轮改为 **按 alpha 可见 bbox 校准**。

运行时基线：

```js
PLAYER_H = 32;           // 16×16 源帧 ×2
// 显示倍率 = p.scale × PROP_SCALE[kind]
```

| 类别 | 当前可见高度 / 玩家 | 说明 |
|---|---:|---|
| 草原树 | **2.29–2.97×** | 不再只有 1.5×；大树高于玩家一倍以上 |
| 草原灌木 | **1.23–1.49×** | 低矮但明显高于玩家腰线 |
| 竹丛 | **2.27–3.03×** | 竹竿按真实树高处理 |
| 竹林石门 | **3.38×** | 拱门高于玩家一倍以上，可穿行 |
| 沙海旧门 | **3.41–3.75×** | 两根柱碰撞、中间可走 |
| 沙棕（完整树） | **约 3.3×** | 改掉原先只有树冠切片、像小盆栽的版本 |
| 枯沙木 | **2.5–3.0×** | 沙漠剪影不再贴地 |
| 雪松 | **2.47–3.53×** | 雪原最高植被；树干有碰撞 |
| 雪中小祠 | **3.37×** | 建筑摆件不再小于玩家 |
| 篝火 | **0.85–0.98×** | 交互物，低于玩家但可辨识 |
| 村医 / 竹隐 / 沙婆 / 守灯人 | **0.94 / 1.21 / 1.22 / 1.18×** | NPC 不再出现 2× 巨人；保留 NPC 比玩家略高的读感 |
| 草原 / 竹林草药 | **0.44×** | 采集物应低于玩家 |
| 沙漠沙枣丛 | **约 0.8×** | 按 alpha bbox 放大后不再是“0.3× 灰尘” |
| 雪灯草 | **0.69×** | 雪地里的发光采集物，低于玩家 |

审计脚本：

```bash
cd /home/user/Doubao/chats/38454996042111490/game-repo
python3 tools/audit_scale.py
# 当前：INSTANCES 106 / FAILS 0
```

审计口径：每件 PNG 先算 alpha bbox 的可见高度，再乘 `p.scale × PROP_SCALE[kind]`，与 `PLAYER_H=32` 比较；不再用画布尺寸。`tools/audit_scale.py` 的 `BASE / HERB / NPC` 必须与 `world.js` 同步。

比例板：

- `docs/revamp/g2/scale-baseline-board.png`：玩家 1.0×、树 / 门 / 祠 / NPC / 草药同框，标注“素材库 / ink-studio 生成”。
- `docs/revamp/g2-3d/g2-props-board.png`：G2 素材总览，15 件（14 件 ink-studio 3D + 1 件 krial CC0 篝火）。

## 3. 素材与出处

雪原新增 / 重生成：

| 件 | 来源 | 源图集 / 尺寸 | 正式 PNG | 运行时 |
|---|---|---|---|---|
| 雪松 | ink-studio 生成，`art-src/g2/snow-pine.cjs` | 96×128，1 向 | `assets/01-primary/world/snow-pine.png` | `snowPine`，约 3.2×玩家 |
| 雪中小祠 | ink-studio 生成，`art-src/g2/snow-shrine.cjs` | 96×128，1 向 | `assets/01-primary/world/snow-shrine.png` | `snowShrine`，3.37×玩家 |
| 守灯人 阿霁 | ink-studio 生成，`art-src/g2/snow-keeper.cjs` | 256×64，4 向 | `snow-keeper.png` 64×64（正面） | 雪原 NPC，1.18×玩家 |
| 雪灯草 | ink-studio 生成，`art-src/g2/snow-lantern.cjs` | 32×48，1 向 | `snow-lantern.png` 32×48 | 雪原采集点，0.69×玩家 |
| 沙棕（替换） | ink-studio 生成，`art-src/g2/desert-palm.cjs` | 64×96，1 向 | `desert-palm.png` 64×96 | 完整树干 + 树冠，约 3.3×玩家 |
| 16px 雪地 | NinjaAdventure CC0 `TilesetField.png` 帧 21 调色重映射 | 16×16 | `snow-tile.png` 16×16 | `snowTile` 地表；只改调色，不重绘 tile |
| 篝火 | krial CC0 四帧 | 64×16 | `assets/01-primary/external/campfire-16x16.png` | `campfire` / `campfire-burn` |
| 草原树 / 灌木 / 竹丛 / 门 / 旧门 / 枯木 / NPC | NinjaAdventure CC0 原包 | 原包切片 | 既有 `assets/01-primary/world/*.png` | 继续按同一比例基线缩放 |

> 口径修正：G2-2 文档里“沙棕 = NinjaAdventure `TilesetDesert` 48×48 素材库树冠”是当时的事实；G2-3 已把它替换为 **ink-studio 生成的 64×96 完整沙棕**。`CREDITS.md`、`ART_PIPELINE.md` 与本文件以 G2-3 为准。

复现：

```bash
cd /home/user/Doubao/chats/38454996042111490/game-repo
INK_STUDIO=/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio \
node art-src/g2/render-g2.cjs
python3 tools/crop_snow.py
python3 tools/crop_desert.py
```

`art-src/g2/render-g2.cjs` 已登记 `snowKeeper / snowLantern / snowPine / snowShrine / desertPalm`；`tools/build.mjs` 将 `snowPine 96×128 / snowShrine 96×128 / desertPalm 64×96 / snowKeeper 64×64 / snowLantern 32×48 / snowTile 16×16` 入图集。

## 4. 代码接入

- `src/scenes/world.js`：
  - 新增 `PROP_SCALE` 与 `PLAYER_H=32`；`buildProp` 统一按 `p.scale × PROP_SCALE[kind]` 计算显示倍率。
  - `QUEST_PROFILE.snow`：`item: 雪灯 / unit: 盏 / npcAsset: snowKeeper / npcScale: 0.9 / labelY: 46 / promptY: 60`。
  - `snowPine` 树干碰撞、`snowShrine` 底栏碰撞宽 `76×k`、`campfire` 复用既有动画。
  - `buildHerbs` 在 `snow` 群系使用 `snowLantern`，缩放 1.3；沙漠采集物改为 1.7，以抵消 alpha 留白。
  - 雪天气：`snowFall` 使用 `dust` 的 `Snow.png` 纹理、白蓝 tint；`snowVeil` α0.08、`worldVig` 0.22，雪地移动速度 0.90；`applyWeather` 会停止 / 启动雪粒子。
  - 雪原 NPC 对白：未接「破祠的灯灭了很久，雪把灯芯压在霜林里。」/「帮我拾五盏雪灯回来，我想再点一次。」；催交「还差 X 盏雪灯。」/「白原和石灯附近还有，雪化之前它们会重新亮。」；完成「雪灯亮了，破祠里终于有影子。」/「往风口走时别回头，雪会替你记路。」；交付「雪灯够了。」/「收下这枚星火碎片，破祠的灯就拜托你了。」
- `src/systems/worldSave.js`：v5 / `SCREENS=24`；新增 `snowHerbs / snowQuest`；v4→v5 即时写回。
- `src/systems/ui/tokens.js`：新增 `TINT.snow` 与 `UI.world.snow / snowLight / snowDark / snowVeil`。
- `tools/build.mjs`：登记 `snowKeeper / snowLantern / snowTile`，雪松 / 雪祠改为 96×128，沙棕改为 64×96；图集 **143 切片 / 202,244 B**。
- `src/main.js`：单文件加 `window.__SINGLE__` 守卫，单文件通过 HTTP 打开时不再注册不存在的 `./sw.js`。

## 5. 验收

### 5.1 本地 / 单文件 / PWA

| 判据 | 结果 |
|---|---|
| 24 屏 / 4 NPC | 通过；`screens=24 / npcs=4`，雪原 6 屏 |
| 雪原天气 | 通过；`snow-1/2/3/5/6 = snow`、`snow-4 = clear`；`snowFall=true / snowVeil α0.08` |
| 守灯人委托 | 通过；`active/0 → active/2 → active/5 → done/0 / tokens 2`；面板「需要 5 盏雪灯，当前 5 盏」 |
| 比例审计 | 通过；106 实例 / 0 FAIL；树 / 门 / 祠 / NPC / 草药均落在基线区间 |
| v4→v5 迁移 | 通过；`v=5 / screens=24 / visited=18`，补 `snowHerbs=0 / snowQuest=none` 并写回 |
| 960 / 640 / 844×390 | 通过；960×540、640×360、844×390 逻辑 779×360；world 场景仍无触屏（已知限制） |
| 单文件 | 通过；`web/game.html` 24 屏 / 4 NPC；`file://` 双击 24 屏，`errs=[]`；`__SINGLE__` 下不注册 SW |
| PWA | 通过；`na-b18-1ff21147` / 12 条；断网 reload 仍 24 屏 / 4 NPC，`errs=[]` |
| 构建 / 冒烟 | 通过；`npm run build`、`npm run build:single`、`npm run smoke` 9 项 PASS |
| 线上 | **待 Pages 推送后验收**（W-30） |

## 6. 构建

- 首屏预算：**1901 KB / gzip 778 KB**（<2.00 MB）。
- 图集：**143 切片 / 202,244 B**。
- `dist/assets.4021e544.js`：**119,252 B**。
- `dist/game.016492e8.js`：**307,067 B**。
- `web/game.html`：**2,057,162 B**。
- PWA 缓存：`na-b18-1ff21147`，12 条预缓存。
- 雪原正式 PNG：`snow-pine.png` 96×128、`snow-shrine.png` 96×128、`snow-keeper.png` 64×64、`snow-lantern.png` 32×48、`snow-tile.png` 16×16、`desert-palm.png` 64×96。

## 7. 截图与证据

本地：

- `docs/revamp/g2/g2-snow-1..6-960.png`
- `docs/revamp/g2/g2-snow-3-final-960.png`
- `docs/revamp/g2/g2-snow-3-640.png`
- `docs/revamp/g2/g2-snow-3-844x390.png`
- `docs/revamp/g2/g2-snow-quest-960.png`
- `docs/revamp/g2/g2-snow-done-960.png`
- `docs/revamp/g2/g2-snow-single-960.png`
- `docs/revamp/g2/g2-snow-pwa-offline-960.png`
- `docs/revamp/g2/scale-baseline-board.png`
- `docs/revamp/g2/g2-scale-field-1-960.png`、`g2-scale-bamboo-4-960.png`、`g2-scale-desert-4-960.png`

源图集 / 总览：

- `docs/revamp/g2-3d/snow-pine-atlas.png/json` 96×128
- `docs/revamp/g2-3d/snow-shrine-atlas.png/json` 96×128
- `docs/revamp/g2-3d/snow-keeper-atlas.png/json` 256×64 四向
- `docs/revamp/g2-3d/snow-lantern-atlas.png/json` 32×48
- `docs/revamp/g2-3d/desert-palm-atlas.png/json` 64×96
- `docs/revamp/g2-3d/g2-props-board.png` 15 件总览（G2-3 重生成）

## 8. 已知限制

- world 场景触屏仍未接；844×390 只验收 HUD / 布局。
- 雪原目前只有 1 条委托；G2 计划总量 10 条委托未达，仍需第二委托与火山群系。
- 篝火传送未实现；雪原 `snow-3` 的篝火只是视觉与预留点。
- 雪中小祠 / 雪松的碰撞 footprint 窄于可见图（建筑侧面可绕行），这是现有摆件体系的一致做法，不是本轮新引入。
- `tools/audit_scale.py` 覆盖世界摆件 / NPC / 采集物；Hall 图标、武器 UI 等非世界素材不在该脚本范围。

## 9. 来源标注约定

从 G2-3 起，素材文档与总览板统一标注：

- **素材库来源**：NinjaAdventure CC0、krial CC0 等，保留包名与许可。
- **ink-studio 生成**：本项目自制，工具 MIT，成品版权归本项目；保留 `assets/01-primary/world/ink-studio-LICENSE.txt`。

后续所有新植物 / 动物 / NPC / 装备 / 建筑摆件在进入运行时前，先跑 `tools/audit_scale.py`；不达标的实例必须改 `p.scale` 或 `PROP_SCALE`，不能靠肉眼“看着差不多”。
