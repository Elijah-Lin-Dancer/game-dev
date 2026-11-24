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
- **G2 五群系**：G2-1 已完成竹林 3 件并接入；沙漠 / 雪原 / 火山 6 件已生成源图集，等群系接入；基础地面仍走 tile。
- **G3 收尾**：4 只世界 Boss、远征结局主视觉、3 个成就图标。

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

## G2-1 产出（2026-11-24）

源目录 `art-src/g2/`，固定 seed；运行时只读导出的 PNG / 图集，不接 ink-studio。

| 件 | 源 | 源图集 | 正式输出 | 运行时状态 |
|---|---|---|---|---|
| 竹林竹丛 | `art-src/g2/bamboo-grove.cjs` | 64×96，1 向 | `assets/01-primary/world/bamboo-grove.png` | 已接入 `bamboo` 摆件 |
| 竹林石门 | `art-src/g2/bamboo-gate.cjs` | 96×160，1 向 | `assets/01-primary/world/bamboo-gate.png` | 已接入 `bambooGate`；两根柱碰撞，中间可走 |
| 竹隐 | `art-src/g2/bamboo-hermit.cjs` | 256×64，4 向 | `assets/01-primary/world/bamboo-hermit.png`（正面 64×64） | 已接入竹林 NPC；运行只用正面帧 |
| 沙海旧门 | `art-src/g2/desert-arch.cjs` | 96×80，1 向 | `assets/01-primary/world/desert-arch.png` | 已入图集，未接沙漠屏 |
| 枯沙木 | `art-src/g2/desert-dead-tree.cjs` | 64×80，1 向 | `assets/01-primary/world/desert-dead-tree.png` | 已入图集，未接沙漠屏 |
| 雪松 | `art-src/g2/snow-pine.cjs` | 64×96，1 向 | `assets/01-primary/world/snow-pine.png` | 已入图集，未接雪原屏 |
| 雪中小祠 | `art-src/g2/snow-shrine.cjs` | 64×80，1 向 | `assets/01-primary/world/snow-shrine.png` | 已入图集，未接雪原屏 |
| 黑曜尖柱 | `art-src/g2/volcano-spire.cjs` | 64×96，1 向 | `assets/01-primary/world/volcano-spire.png` | 已入图集，未接火山屏 |
| 熔岩裂口 | `art-src/g2/volcano-vent.cjs` | 64×48，1 向 | `assets/01-primary/world/volcano-vent.png` | 已入图集，未接火山屏 |

- 图集对照板：`docs/revamp/g2-3d/g2-props-board.png`；9 个 `*-atlas.png/json` 同目录。
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
