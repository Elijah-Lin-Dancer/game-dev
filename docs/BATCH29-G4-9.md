# 批 29 · G4-9 长明芯草独立 3D 与采集反馈

## 1. 结论

G4-9 收掉 G4-8 唯一的视觉欠账：长明芯草不再复用阿芦的 `mireHerb` 加暖金 tint，换成独立 ink-studio 3D 像素小件 `mireLampHerb`；采集时补 +1 浮字和暖色扩散环。

- `art-src/g4/mire-lamp-herb.cjs`（seed 407）：32×48、单帧、1 向；琥珀灯芯 + 三根低位灯芯 + 深色泥座，和普通灯芯草的薄荷色五芯簇分开。
- 运行时 `buildLampHerbs` 改用 `mireLampHerb`，去掉旧 tint；暖光 / 2px 火星 / prompt 保持。
- 采集专属节点时新增 `lampGatherFx`：节点上方浮出「长明芯 +1」，3/3 时浮出「长明芯 3/3」；同时一个暖色圆环扩散消失。
- **不动存档 / 数据 / 数值**：`na.world` 仍 v16、`world.json` 仍 v12，3 个节点坐标与获得量不变，仍 3 束 / 4 碎片 / 一次性；无新屏 / Boss / 成就。
- 图集 **175 → 176 切片**；仍 36 屏 / 6 群系 / 13 委托 / 6 Boss / 24 成就 / 7 NPC。

## 2. 行为合同

| 场景 | 入口 | 期望 |
|---|---|---|
| 未接长明芯 | `mire-4 / mire-5` | 长明芯草节点隐藏；普通灯芯草仍是 `mireHerb` |
| 接取后进灯沼 | `lampQuest active` | 3 个节点用 `mireLampHerb`，琥珀灯芯清晰可辨；prompt「E 采长明芯草」 |
| 采专属草 | 节点旁按 E，读条 2s | `lampHerbs +1`、`mireHerbs` 不变；节点上方「长明芯 +1」浮字 + 暖色环；HUD「长明芯 1 · 采集 1/3」 |
| 采普通草 | 阿芦的 `mireHerb` | `mireHerbs +2`、`lampHerbs` 不变；普通节点不出现长明芯浮字 |
| 集满 3 束 | 跨 `mire-4 / mire-5` | 采第 3 束时浮出「长明芯 3/3」；节点隐藏；`mire-6` HUD「长明芯 3 · 可交付 3/3」 |
| 交付 | 阿烬面板第一行 | `lampHerbs 3→0`、`mireHerbs` 不动、`tokens +4`、`lampQuest done`；暖灯沿用 G4-7 |
| done / 重燃 | 再进灯沼 / `rekindleExpedition` | 节点隐藏；重燃保留 `lampQuest done`，只重置六 Boss |
| 640 / 844 / 单文件 / PWA | 响应式与离线 | 新草、浮字、HUD 均可用；无横向溢出；`errs=[]` |

## 3. 素材

| 件 | 源 | 源尺寸 | 正式输出 | 运行时 |
|---|---|---|---|---|
| 长明芯草 | `art-src/g4/mire-lamp-herb.cjs`（seed 407） | 32×48、1 向 | `mire-lamp-herb-atlas.png` 32×48 / 316 B | `assets/01-primary/world/mire-lamp-herb.png` 32×48 / 495 B；bbox `(4,17,28,32)`，可见高 15px；运行时 1.20×，审计 **0.63×** |

- 造型：深色湿泥底座 + 三根低位灯芯 + 中央一枚琥珀灯芯果；果体有亮芯与深色笼骨，左右各一束浅金芽。
- 和 G4-1 的普通灯芯草区分：普通为薄荷 / 冰蓝五芯簇，长明芯为琥珀 / 暖金三芯 + 中央灯果；不用靠 tint 区分。
- 图集：`tools/build.mjs` 新增 `mireLampHerb: [32,48]`；`web/atlas/core.png` **176 切片 / 123,847 B**。
- 复现：`INK_STUDIO=/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio node art-src/g4/render-g4.cjs`，再 `python3 tools/crop_mire.py`。
- 素材出处：ink-studio 生成件，工具 MIT，成品本项目自制；不涉及 Ninja Adventure 原图。

## 4. 运行时

- `src/scenes/world.js`
  - `buildLampHerbs`：sprite key `mireHerb → mireLampHerb`；去掉 `setTint(0xffb35c)`；保留 `scale 1.35` / origin `32/48` / 暖光半径 17 / 2px 火星。
  - 新增 `lampGatherFx(node, ready)`：`+1` / `3/3` 浮字，900ms 上浮淡出；暖色圆环 620 / 760ms 扩散；只由专属节点采集调用。
  - `completeGather` 的 `node.lampOnly` 分支在写 `lampHerbs` 后调用 `lampGatherFx(node, lampCount >= lq.need)`。
- `tools/build.mjs`：登记 `mireLampHerb` 资源与 `[32,48]` 帧。
- `tools/crop_mire.py`：新增 `mire-lamp-herb-atlas.png` → `mire-lamp-herb.png`。
- `tools/audit_scale.py`：新增 `LAMP_HERB` 映射，按 `lampHerbs` 存在的屏各审 1 次；`mire-4 / mire-5` 均 **20.2px / 0.63×**。

## 5. 实测

`/tmp/g49.py` **27/27 PASS**：

| 项 | 结果 |
|---|---|
| 资源 / 切片 | `mireLampHerb` 纹理存在；3 个专属节点全部用 `mireLampHerb`；普通 `mire-4` 节点仍 `mireHerb` |
| 隐藏 / 接取 | `lampQuest none` 3 节点隐藏；`active` 全部可见；prompt「E 采长明芯草」 |
| 采集 | 专属草 `lampHerbs 0→1`、`mireHerbs 0`；普通草 `mireHerbs 0→2`、`lampHerbs 0`；HUD 1/3 |
| 浮字 | 采 1 束出现「长明芯 +1」；采第 3 束出现「长明芯 3/3」 |
| 集满 / 隐藏 | 跨 `mire-4 / mire-5` 3 束；节点全部隐藏；`mire-6` HUD「长明芯 3 · 可交付 3/3」 |
| 交付 | 先交阿烬：`lampHerbs 0 / mireHerbs 7 / tokens20→24`；暖灯 `emitting=true` |
| 响应式 / 离线 | 640 `scrollWidth=640`、844 `scrollWidth=844`；单文件 / PWA `na-b18-1ee6383d` 离线节点均可用；`errs=[]` |

`/tmp/g49-reg.py` **11/11 PASS**：v15 active → v16 折 3 束且 `mireHerbs` 保留；`lampHerbs` 上限 99；先交阿芦 `mireHerbs 0 / lampHerbs 3` 且长明芯仍可交付；done 节点隐藏；阿烬 `mireLampkeeper`；重燃保留 done / 节点隐藏。

回归：

- `npm run smoke` **9 PASS**。
- `python3 tools/audit_scale.py` **223 INSTANCES / 0 FAIL**；新增 `mire-4 / mire-5` 两条 `lampHerb` 实例。

## 6. 构建

- 首屏 **1915 KB / 2.00 MB（gzip 726 KB）**
- `dist/game.61c24f45.js` **387,013 B**
- `dist/assets.f7d3dce6.js` **132,467 B**
- 单文件 `web/game.html` **2,045,983 B**
- `web/fonts/game.woff2` **133,768 B**
- 图集 `web/atlas/core.png` **123,847 B / 176 切片**
- PWA `sw.js` **`na-b18-1ee6383d`**
- `index.html` 入口 `game.61c24f45.js + assets.f7d3dce6.js`

## 7. 改动文件

- 新增 `art-src/g4/mire-lamp-herb.cjs`
- 新增 `assets/01-primary/world/mire-lamp-herb.png`
- 新增 `docs/revamp/g4-3d/mire-lamp-herb-atlas.png/.json`
- `art-src/g4/render-g4.cjs`、`tools/crop_mire.py`、`tools/build.mjs`、`tools/audit_scale.py`
- `src/scenes/world.js`
- `index.html`、`sw.js`、`web/game.html`、`web/fonts/game.woff2`、`web/atlas/core.json`、`web/atlas/core.png`
- `dist/game.61c24f45.js`、`dist/assets.f7d3dce6.js`（替换 G4-8 的 `game.ed616f54.js` / `assets.40dfdad3.js`）
- `docs/revamp/g4-9/` 10 张本地证据

## 8. 风险 / 回退

- **视觉尺寸**：新件可见高 15px、运行时 1.35× 后约 20.2px；与普通灯芯草同量级，不抢 NPC / Boss 比例。若实际仍偏小，只调 `scale` 或源图 cam，不动存档。
- **浮字层级**：`lampGatherFx` 的浮字 / 圆环是临时对象，900ms / 760ms 后销毁；不写存档。若以后同屏连续采集很多，仍是一次性对象，不会堆积。
- **回退**：把 `buildLampHerbs` 的 sprite 改回 `'mireHerb'` 并恢复 `setTint(0xffb35c)`，删除 `mireLampHerb` 资源 / build / crop / audit 条目，移除 `lampGatherFx` 调用；存档与委托数据不受影响。

## 9. 证据（本地）

- `docs/revamp/g4-9/g4-9-lamp-herb-960.png`：灯沼新长明芯草 + prompt
- `docs/revamp/g4-9/g4-9-lamp-herb-mire5-960.png`：无岸节点
- `docs/revamp/g4-9/g4-9-gather-fx-960.png`：采集「长明芯 +1」浮字 + HUD 1/3
- `docs/revamp/g4-9/g4-9-hud-3of3-960.png`：`mire-6` HUD 3/3
- `docs/revamp/g4-9/g4-9-delivered-960.png`：交付后暖灯
- `docs/revamp/g4-9/g4-9-lamp-herb-640.png` / `g4-9-lamp-herb-844.png`
- `docs/revamp/g4-9/g4-9-lamp-herb-single-960.png` / `g4-9-lamp-herb-pwa-960.png`
- `docs/revamp/g4-9/g4-9-herb-board.png`：普通灯芯草 / 长明芯草 12× 对照板

## 10. Pages 线上验收

推送 `a2d2662..f7395b9` 后 Pages 已切 G4-9：

- 入口 `game.61c24f45.js` + `assets.f7d3dce6.js`；`world.json v12`；PWA `na-b18-1ee6383d` / 12 条。
- 线上 **25/25 PASS**：入口 / 纹理 / 3 个专属节点换 `mireLampHerb` / 普通 `mireHerb` 未换 / `none` 隐藏 / `active` 可见 + prompt / 专属草 +1 且 `mireHerbs 0` / 浮字「长明芯 +1」/ HUD 1/3 / 跨屏 3 束节点隐藏 / 浮字「长明芯 3/3」/ `mire-6` HUD 3/3 / 交付 `done / lampHerbs 0 / mireHerbs 7 / tokens20→24` + 暖灯 / 640·844 无溢出 / PWA 断网节点可用；`errs=[]`。
- 8 张线上证据：`docs/revamp/g4-9/g4-online-lamp-herb-960.png`、`g4-online-gather-fx-960.png`、`g4-online-lamp-herb-mire5-960.png`、`g4-online-hud-3of3-960.png`、`g4-online-delivered-960.png`、`g4-online-lamp-herb-640.png`、`g4-online-lamp-herb-844.png`、`g4-online-lamp-herb-pwa-960.png`。

