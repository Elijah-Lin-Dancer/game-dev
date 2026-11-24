# 批 19 / G2-2：沙漠 6 屏、沙婆委托与沙尘

日期：2026-11-24
范围：在 G2-1 的 12 屏世界上追加 `desert-1..6`，把沙漠从“素材库中已有旧门 / 枯木”变成可走、可采、可委托的第三个群系；不触碰主线 `na.save`。

## 1. 世界与数据

`web/data/world.json` 升 **v4**，共 **18 屏**：

| 段 | 屏 | 群系 |
|---|---|---|
| 草原 | `field-1..6` | `field` |
| 竹林 | `bamboo-1..6` | `bamboo` |
| 沙漠 | `desert-1..6` | `desert` |

沙漠屏名：`沙口 / 风蚀 / 枯井 / 旧门 / 流沙 / 无旗`。其中 `沙口 / 枯井 / 旧门 / 无旗` 是 `dust`（沙尘），`风蚀 / 流沙` 是 `clear`。`desert-4` 放 NPC「沙婆 阿砾」，委托「沙海拾味」：

```json
{ "id": "desert5", "name": "沙海拾味", "npc": "sandmother",
  "need": 5, "yield": 2, "rewardTokens": 2 }
```

全沙漠 **14 个沙枣丛**（`desert-1:2 / 2:2 / 3:3 / 4:3 / 5:2 / 6:2`），每个采一次得 2 颗，90 秒重生。沙婆在旧门（`desert-4`），旧门旁有篝火；本轮篝火只作视觉与后续传送点预留，传送逻辑尚未接。

`na.world` 升 **v4**：

```js
VERSION = 4;
SCREENS = [field-1..6, bamboo-1..6, desert-1..6]; // 18
// 新字段
desertHerbs: 0,
desertQuest: 'none'
```

v3→v4 迁移保留 `herbs / quest / bambooHerbs / bambooQuest / boss / tokens / visited`，补 `desertHerbs=0 / desertQuest='none'` 并即时写回。旧 G0 的 `field / bamboo / desert` 仍映射 `field-1 / field-3 / field-6`，不改变旧档语义。

## 2. 运行时

`src/scenes/world.js` 不再用 `bamboo` 单布尔分派，新增 `QUEST_PROFILE`：

| 群系 | 委托数据键 | 存档键 | 资源 | NPC 素材 |
|---|---|---|---|---|
| 草原 | `quest` | `quest / herbs` | 草药 | `villager2` |
| 竹林 | `bambooQuest` | `bambooQuest / bambooHerbs` | 雾竹 | `bambooHermit` |
| 沙漠 | `desertQuest` | `desertQuest / desertHerbs` | 沙枣 | `desertNomad` |

HUD、就绪提示、采集 toast、重生 toast、委托面板、交付对话都从配置取，不再出现“沙漠屏显示草药 / 竹隐”之类的串味。`questFor / questStateFor / herbCountFor / herbKeyFor / questKeyFor` 全部改为按 NPC 的群系查配置。

沙漠地表：
- `desertTile`：从 `TilesetField` 的 16×16 纯色草皮帧（帧 21，`16,64`）只做调色，得到 `#c9a968` 沙地 + `#b08a52` 颗粒；不使用 3D 烘焙图替代基础 16px tile。
- 沙漠屏仍保留逐屏 `deco` 贴花（低 alpha），增加一条低对比沙丘椭圆；跨屏接缝沿用 `makeSeamTexture()` 的混色。
- `desertArch` / `desertDeadTree` / `desertPalm` / `campfire` 四类摆件：旧门 96×128（两根柱碰撞、中间可走），枯沙木 64×80，沙棕 48×48，篝火复用现有 `campfire-burn` 四帧动画。
- 沙尘：新增横向 `dustStorm` 粒子 + `dustVeil` 近地层；`applyWeather` 对 `dust` 设暗角 0.34、veil 0.13，`clear` 全关；移速在沙尘下乘 0.94。沙尘只压视觉，不改碰撞与任务判定。

## 3. 素材（工具 + 既有素材库）

沿用 `ink-studio` 固定 commit `823981c`，源目录 `art-src/g2/`；不接运行时 splat。

| 件 | 源 | 源图集 | 正式 PNG | 运行时 |
|---|---|---|---|---|
| 沙婆 | `art-src/g2/desert-nomad.cjs` | 256×64，4 向 | `desert-nomad.png` 64×64 | 沙漠 NPC，1.7 倍 |
| 沙枣丛 | `art-src/g2/desert-shrub.cjs` | 32×48，1 向 | `desert-shrub.png` 32×48 | 沙漠采集点，1.25 倍 |
| 沙海旧门 | `art-src/g2/desert-arch.cjs` | 96×128，1 向 | `desert-arch.png` 96×128 | `desertArch` 摆件；两根柱碰撞 |
| 枯沙木 | `art-src/g2/desert-dead-tree.cjs` | 64×80，1 向 | `desert-dead-tree.png` 64×80 | `desertDeadTree` 摆件 |
| 沙棕 | NinjaAdventure `TilesetDesert.png` 裁切 | 48×48 | `desert-palm.png` 48×48 | `desertPalm` 摆件；素材库原件，非 3D |
| 16px 沙地 | NinjaAdventure `TilesetField.png` 帧 21 调色 | 16×16 | `desert-tile.png` 16×16 | `desertTile` 地表 |
| 篝火 | 既有 `krial` CC0 四帧 | 64×16 | `assets/01-primary/external/campfire-16x16.png` | `campfire` 摆件 / `campfire-burn` |

- 复现：`INK_STUDIO=/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio node art-src/g2/render-g2.cjs`，再 `python3 tools/crop_desert.py`。
- 沙海旧门第一次 96×80 在实机像矮桌；改为 **96×128** 并删掉横在门洞底部的整条沙堤后，才读成门。沙婆 / 沙枣丛是 G2-2 新建的两件 3D 源。
- 图集对照板 `docs/revamp/g2-3d/g2-props-board.png` 已扩为 11 件 3D + 1 件素材库沙棕；全部 `*-atlas.png/json` 同目录。
- 新素材登记在 `assets/CREDITS.md`；ink-studio MIT 原文仍在 `assets/01-primary/world/ink-studio-LICENSE.txt`；NinjaAdventure 原包 `LICENSE.txt` 为 CC0 1.0（已核对全文）。

## 4. 构建

`tools/build.mjs` 新登记 `desertNomad / desertShrub / desertPalm / desertTile` 四张 PNG，图集从 136→**140 张切片**，`core.png` **198,729 B**。PWA 缓存名 `na-b18-b0baeb7b`（12 条预缓存）；`swVersion` 仍包含 `core.png` 内容哈希。

最终构建：

| 产物 | 大小 |
|---|---|
| `dist/game.c6eead2a.js` | 303,870 B |
| `dist/assets.fc823a9d.js` | 116,392 B |
| `web/game.html`（单文件） | 2,046,243 B |
| `index.html` | 1,328 B |
| `sw.js` | 1,808 B |
| `web/atlas/core.png` | 198,729 B |
| 首屏预算 | 1,891 KB / gzip 772 KB（< 2 MiB） |

## 5. 验收结果

| 编号 | 结果 |
|---|---|
| W-11 | 18 屏 / 3 NPC；`field-1..6 + bamboo-1..6 + desert-1..6`；3 个 NPC：村医 / 竹隐 / 沙婆；`errs=[]` |
| W-12 | 沙漠 6 屏可走；HUD `沙尘 · 第 13/18 屏` 到 `第 18/18 屏`；`dust` 屏 veil α=0.13，`clear` 屏 veil=0 |
| W-13 | 沙婆委托：接取对话两行 → `desertQuest=active`；采 1 丛 `desertHerbs=2`；5 颗时面板「沙海拾味 / 当前 5 颗」；交付后 `done/0 / tokens=2` |
| W-14 | 摆件 / 地表：旧门 96×128、枯木、沙棕、沙枣丛、篝火、16px 沙地均有实机图；两柱可走 |
| W-15 | 草原 / 竹林回归：村医面板「草药五株 / 5 株」；竹隐面板「雾竹三味 / 4 株」；`errs=[]` |
| W-16 | v3→v4 迁移：`v=4`，保留 `herbs=3 / quest=active / bambooHerbs=2 / bambooQuest=active / boss=done / tokens=4`，补 `desertHerbs=0 / desertQuest=none` 并即时落盘 |
| W-17 | 640×360 / 960×540 / 844×390 hasTouch / `web/game.html` 单文件：18 屏 / 3 NPC，`errs=[]` |
| W-18 | `npm run build` / `build:single` / `npm run smoke`：140 切片、9 项 PASS、单文件自测通过 |
| W-19 | PWA：SW `na-b18-b0baeb7b` / 12 条；在线 reload 后断网再 reload 仍进 world，18 屏 / 3 NPC，`errs=[]` |
| W-20 | Pages 线上：入口 `game.c6eead2a.js` + `assets.fc823a9d.js`；18 屏 / 3 NPC；沙婆面板「交付 5 颗沙枣」；交付 `done/0 / tokens 2`；844×390 布局；线上 960×540 / 844×390 均 `errs=[]`；844 线上 `touchCtl=false`，仅验证 HUD / 取景，world 触屏仍未接（见 `docs/ACCEPTANCE.md` W-20） |

证据：
- 960：`docs/revamp/g2/g2-desert-1..6-960.png`、`g2-desert-dust-960.png`、`g2-desert-quest-960.png`、`g2-desert-done-960.png`
- 640：`g2-desert-1-640.png`、`g2-desert-4-640.png`
- 移动：`g2-desert-mobile-844x390.png`
- 单文件：`g2-desert-single-960.png`
- PWA 断网：`g2-desert-pwa-offline-960.png`（离线下到 desert-4）
- 线上：`g2-online-desert-1-960.png`、`g2-online-desert-4-960.png`、`g2-online-desert-quest-960.png`、`g2-online-desert-done-960.png`、`g2-online-desert-mobile-844x390.png`
- 素材：`docs/revamp/g2-3d/g2-props-board.png`、`desert-*-atlas.png/json`

## 6. 已知限制

- G2 总量仍为 30 屏；当前 18 屏，雪原 6 屏 / 火山 6 屏未做，G2 的“五群系可通”尚未达成。
- 10 条委托只有 3 条（草药 / 雾竹 / 沙枣）；雪原、火山委托未做。
- 篝火传送未接：沙漠旧门旁篝火目前是视觉 + 后续传送点预留，不可传送 / 休息。
- 雪原 / 火山气候、world 场景触屏摇杆与动作键仍未做；沙漠只有键盘 / 鼠标 / 点按移动，844×390 仅验证 HUD 与布局。
- `desertPalm` 是 `TilesetDesert` 的树冠裁切（48×48），不是完整树干；后续若要更像棕榈，可另裁树干或补 3D 件。

## 7. 文件

`web/data/world.json`、`src/systems/worldSave.js`、`src/scenes/world.js`、`tools/build.mjs`、`tools/crop_desert.py`、`art-src/g2/desert-nomad.cjs`、`desert-shrub.cjs`、`desert-arch.cjs`、`art-src/g2/render-g2.cjs`、`assets/01-primary/world/desert-*.png`、`docs/revamp/g2-3d/*`、`docs/revamp/g2/g2-desert-*`、`docs/BATCH19-G2-2.md`。
