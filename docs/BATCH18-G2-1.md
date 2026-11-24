# 批 18 / G2-1：竹林群系与多群系底座

日期：2026-11-24
状态：本地实现 + 构建 + 桌面 / 窄屏 / 单文件 / 冒烟验收完成；G2 只完成第 2 个群系，尚未达到“五群系可通”。

## 1. 范围与结果

G2-1 把 `web/data/world.json` 从草原 6 屏扩到 **草原 6 + 竹林 6 = 12 屏**，`na.world` 升 v3；竹林接入 1 个 NPC“竹隐”、1 条“雾竹三味”委托、12 丛雾竹与竹丛 / 石门摆件。`world.js` 从单 NPC / 单委托改成 NPC 数组 + 按群系读取 `quest / herbs / bambooQuest / bambooHerbs`，并补了逐屏地表底色与跨群系接缝混色。

同时用固定 commit 的 `ink-studio` 离线生成 9 件四群系素材：竹林 3 件（竹丛 / 石门 / 竹隐）+ 沙漠 2 件 + 雪原 2 件 + 火山 2 件。**只接入竹林 3 件**；其余 6 件已进图集、有源图集和对照板，但还没有对应群系的屏幕与摆件逻辑。

## 2. 素材

- 工具：`/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio`，commit `823981c`，MIT。
- 源目录：`art-src/g2/`，9 个 `.cjs` + `render-g2.cjs`，固定 seed；运行时仍不接 splat 渲染器。
- 源图集：`docs/revamp/g2-3d/*-atlas.png/json`；对照板 `g2-props-board.png`。
- 正式输出：`assets/01-primary/world/` 9 张 PNG；登记见 `assets/CREDITS.md`，MIT 原文随包。
- 竹隐 4 向源图集 256×64，正式 PNG 只取正面 64×64，运行时 1.5 倍显示。
- 竹林石门从 96×64 回炉到 96×128：原剪影横梁偏低、像一张桌子；加高立柱与上梁后，640 / 960 实机可读为门。

## 3. 代码与数据

| 文件 | 改动 |
|---|---|
| `web/data/world.json` | `version=3`；12 屏 `field-1..6 / bamboo-1..6`；新增 `bambooQuest`（`bamboo4 / 雾竹三味 / need 4 / yield 2 / rewardTokens 2`）；`bamboo-4` NPC `hermit / 竹隐`；竹林摆件 / 雾竹分布；清掉竹林屏误继承的 `cave / plateau` |
| `src/systems/worldSave.js` | `VERSION=3`；`SCREENS` 12；默认 / 迁移补 `bambooHerbs / bambooQuest`；旧 v2 映射 `field/bamboo/desert → field-1/3/6`；迁移即刻落盘 |
| `src/scenes/world.js` | `TINT` 加竹林；逐屏底色 + 群系接缝混色；`bamboo / bambooGate` 摆件与碰撞；NPC 数组、最近 NPC、按 NPC 分派委托；采集按 `node.biome` 分 `herbs / bambooHerbs`；HUD / 提示按当前群系切文案 |
| `tools/build.mjs` | 9 张 G2 素材登记 `img / FRAME`；`bambooGate` 96×128；PWA 缓存名改 `na-b18-*`，清 b17 / b18 旧缓存 |
| `src/scenes/world.js` | 竹林屏不再继承草原 `cave / plateau`；HUD 不再出现“地穴”误标 |

## 4. 验收

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| G2-1-1 | 12 屏与 2 NPC | 进 world 读 `screens / ids / npcs` | 通过；`screens=12`，`bamboo-1..6` 齐全，NPC `村医 阿杏 / 竹隐`，`errs=[]` |
| G2-1-2 | 草原 Boss 后真实进竹林 | 持久化 `boss='done'`，站到 `field-6` 右边界按 D | 通过；`screen=6 / bamboo-1`，`x=2912.32`，`bossActive=false`，`layer=surface`，HUD `雾 · 第 7/12 屏` |
| G2-1-3 | 竹林摆件与地表 | 640×360 / 960×540 实机截图 | 通过；石门 96×128 两柱可走、竹丛剪影可读；竹林地表比草原暗，接缝混色不透明 |
| G2-1-4 | 竹隐委托闭环 | 接委托 → 采 2 丛（每丛 2）→ 交付 | 通过；`active/0 → active/4 → done/0`，`tokens 0→2`，面板与交付对话均出现 |
| G2-1-5 | 草原委托回归 | 村医接委托 → 采 3 丛 → 交付 | 通过；`active/0 → active/6 → done/1`，`tokens 0→1`，面板正常 |
| G2-1-6 | v2→v3 迁移 | 写 v2 种子后 reload | 通过；`v=3`，`visited [field-1,field-2,field-3,field-6]`，`bambooHerbs=0 / bambooQuest=none` 并立即落盘 |
| G2-1-7 | 640 / 960 / 844 / 单文件 | 640×360、960×540、844×390 hasTouch、`web/game.html` | 通过；内部逻辑 640×360、960 为 CSS 1.5×、844 逻辑 779×360；单文件 12 屏，均 `errs=[]` |
| G2-1-8 | 构建与冒烟 | `npm run build` / `build:single` / `npm run smoke` | 通过；首屏报告 1,881 KB（gzip 768 KB）< 2 MiB；9 项冒烟 PASS |
| G2-1-9 | PWA 缓存升级 | 本地 HTTP 首次加载 → SW ready / controller → 读 cache；断网 reload | 通过；`na-b18-80e8cc33` / 12 条缓存；离线 world 场景仍可进，`errs=[]` |

### 构建产物

- `dist/game.d2e34f5f.js` 299,789 B；`dist/assets.a8c2948a.js` 113,615 B。
- `web/game.html` 2,035,389 B；`index.html` 1,328 B；`sw.js` 1,808 B，缓存 `na-b18-80e8cc33`。
- `web/atlas/core.png` 195,712 B / 136 切片（新增 9 件 G2 素材）。
- `manifest.json` 762 B；字体 133,548 B。

### 截图

- `docs/revamp/g2/g2-bamboo-1-960.png` / `g2-bamboo-1-640.png`
- `docs/revamp/g2/g2-bamboo-4-960.png` / `g2-bamboo-4-640.png`
- `docs/revamp/g2/g2-bamboo-quest-960.png` / `g2-bamboo-quest-640.png`
- `docs/revamp/g2/g2-bamboo-done-960.png`
- `docs/revamp/g2/g2-single-960.png`
- `docs/revamp/g2/g2-mobile-844x390.png`
- 素材：`docs/revamp/g2-3d/*-atlas.png/json`、`g2-props-board.png`

## 5. 已知限制

- **不是完整 G2**：沙漠 / 雪原 / 火山 3 个群系、18 屏、篝火传送、10 条委托、雪原 / 火山气候都未接；G2 的“五群系可通”尚未达成。
- 沙漠 / 雪原 / 火山 6 件素材已进图集，但运行时没有摆件 / 屏幕引用；后续接群系时还要按显示尺寸复查剪影。
- 竹隐运行只用 4 向源图的正面帧；没有按朝向切帧。
- 竹林地表仍是 `field` tile 染色，没有独立竹叶 tile（遵守“基础地形走 16px tile”的管线边界）。
- world 场景没有触屏摇杆 / 动作键；本轮 844×390 只验证 HUD 与画面不裁切，不代表手机可完整操作远征。
- 竹林石门两根柱有碰撞、中间可走；没有做门禁 / 传送语义。

## 6. 复现

```bash
cd /home/user/Doubao/chats/38454996042111490/game-repo
INK_STUDIO=/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio \
node art-src/g2/render-g2.cjs
npm run build
npm run build:single
npm run smoke
```

## 7. 下一步

G2 还剩 **沙漠、雪原、火山 3 个群系 ×6 屏**。建议按 G2-2 沙漠切片继续：先接沙海旧门 / 枯沙木与沙尘气候，再做沙漠 NPC + 委托；雪原 / 火山留到 G2-3 / G2-4，最后补篝火传送与 10 条委托总表。
