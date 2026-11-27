# BATCH42 · G5-3 旧堡地形套件（第一版）

- 日期：2026-11-27
- 范围：旧堡 `theme==='fort'` 的全部战斗 / 休息 / 门房 / Boss 房，把地面、墙体、墙脚阴影换成 ink-studio 离线预渲染件。
- 前置：`docs/BATCH39-G5-SAMBLUE.md`（蓝武士）、`docs/BATCH41-G5-SAMRED.md`（赤武士）、`docs/decisions/0018-terrain-art-direction.md`。
- 不在本批：真多边形碰撞、其他 5 章地形、地形拐角 autotile、关键摆件、Boss 数值再调。

## 结论

旧堡地形第一版已接入最终构建：8×8 共 64 块 32px 石板地面、4 帧灰岩墙体、32px 墙脚阴影；960 / 640 / 844 实机可读，`npm run smoke`、49 关 `npm run audit`、字体审计均通过。

**没有把 `fort:4` 写成稳定通关。** 最终构建 `fort:2` 真实键盘 **1/1 通关**（108.8s，19/22 HP，min 11，16 kills）；`fort:4` 在 G5-3 的 3 次真实键盘尝试均未通关（1 次到 Boss 19/43，2 次房 1 死亡）。这是机器人稳定性和旧堡数值的遗留问题，不是本轮地形碰撞改变；G5-2 的旧素材 `fort:4` 1/1 通关仍保留为玩法基线，但不能拿来替代 G5-3 证据。

## 范围偏差：全 fort，而不是单房 pilot

`docs/decisions/0018-terrain-art-direction.md` 原写「先改一间战斗房 + Boss 房做并排对比」。本轮实际按 **全部 `theme==='fort'` 房间** 统一切换：

- 旧堡只有 6 关，单房替换会在同一关内出现新旧地形跳变，验收时反而干扰判断；
- 只改视觉分支；`walls` / `isWall()` / `reachableTiles()` / 门锁 / 刷怪 / Boss 状态机全部复用原路径；回滚点是 `src/scenes/play.js` 的一个 `fortTerrain` 分支和 3 张图集；
- 代价是验收范围更大，`fort:4` 的机器人失败也一起暴露。发布说明必须保留这条限制。

## 素材与图集

| 件 | 源 | 生成 | 正式输出 | 运行时 |
|---|---|---|---|---|
| 地面 | `art-src/g5/fort-terrain.cjs`（seed 4207，17 色） | 8×8 共 64 块 32px 石板；深色勾缝底板 + 顶面 + 裂缝 / 铁锈 / 缺口 | `docs/revamp/g5-3d/fort-floor.png` 256×256 | `assets/01-primary/world/fort-floor.png`；构建键 `fortFloor`，`FRAME [256,256]` |
| 墙体 | 同上，`wall(variant)` | 4 个变体；灰岩 `slate` / `slateLight` / `slateDark`，顶盖 + 南侧暗立面 + 顶面裂缝 | `docs/revamp/g5-3d/fort-wall.png` 128×32（4×32） | `assets/01-primary/world/fort-wall.png`；构建键 `fortWall`，`FRAME [32,32]` |
| 墙脚阴影 | `art-src/g5/render-fort-terrain.cjs` | 32×32 RGBA，顶部 12px 黑到透明渐变 | `docs/revamp/g5-3d/fort-shadow.png` 32×32 | `assets/01-primary/world/fort-shadow.png`；构建键 `fortShadow`，`FRAME [32,32]` |

- 地面渲染 1024→256 最近邻，保持 8×8 变体、每格 32px；没有把地面拆成运行时 3D。
- 墙体渲染 512→32，相机 `pitch 1.10`、`target [0,0.50,0]`、`lensScale 20.0`；让墙顶和南侧立面都能读出高度。
- 墙体不是 N/E/S/W autotile：4 帧只按 `((x*7+y*11)%4+4)%4` 的坐标哈希选，内外拐角仍靠单块贴图。
- 17 色板包含新增的 3 个灰岩色 `#4a4238 / #807260 / #322b24`；地面仍是旧堡棕，墙体独立成灰，避免墙地同色。

## 运行时接入

- `tools/build.mjs`：新增 `fortFloor` / `fortWall` / `fortShadow` 三个图片键与 `FRAME`。
- `src/scenes/play.js`：
  - `paintFloorAndWalls` 新增 `fortTerrain = theme === 'fort'`；fort 用 `tileSprite(0,0,RW,RH,'fortFloor',0)` 平铺整房，跳过旧 `floorDungeon` tint，只留 0.06 暖光。
  - 地板贴花 alpha 0.32；旧石砖仍 0.55，草地 0.40。
  - `wallAt` 在 fort 下只登记 `this.walls` 和 `fortWallCells`，不画旧矩形；新增 `paintFortWalls(wrap, cells)`，按 4 帧铺墙，并只向南侧空地格铺 `fortShadow`。
  - 门洞不再铺旧 `field` 路面；门锁改用 `fortWall` 暖色 tint `0xc08a6a`，锁容器 / 碰撞 / 门位不变。
  - 绘制顺序：地板 → 门洞 → 内部障碍 → `paintFortWalls` → 门锁 → 暗角 / 火光。
- 未改：`isWall()`、`reachableTiles()`、BFS、门锁集合、刷怪数量 / 位置、Boss 选择 / 状态机、存档。

## 验收

### 构建与静态

- 图集 `web/atlas/core.png` **151,754 B / 189 切片**；`fortFloor` 256×256、`fortWall` 32×32、`fortShadow` 32×32。
- `dist/assets.b269ef7b.js` **133,313 B**；`dist/game.2f403d3b.js` **391,232 B**。
- 首屏 **1947 KB / 2.00 MB**，gzip **753 KB**；`sw.js` 缓存 `na-b18-ef592c55`。
- `npm run smoke` → `SMOKE OK`：Title / story 9 / chars 3、Title → Map、Map → Select、Select → Play、WASD、攻击、暂停 / 恢复、存档 v11、触屏攻击 / 摇杆互斥全部 PASS。
- `npm run audit` → `SUMMARY {"stagesExpected":49,"stagesRun":49,"stagesPass":49,"screensExpected":108,"screensPass":108,"bossesPass":6,"transitionsPass":35}`，`AUDIT OK`。
- `npm run audit:font` → `CHARS 1424 / CMAP 3939 / MISSING 0`，`GLYPHS OK`。
- `npm run build:single` → `web/game.html` 2039 KB；单文件自测通过。

### 实机

- `docs/revamp/playtest/fort-4-g5-3-room-960.png`：960×540，`fort:4` 战斗房，8×8 地面、灰岩墙块、门锁 tint 均可辨；HUD 不遮玩家。
- `docs/revamp/playtest/fort-4-g5-3-boss-960.png`：960×540，Boss 房，`samRed` 全身、灰岩墙块与地面同屏。
- `docs/revamp/playtest/fort-4-g5-3-room-640.png` / `fort-4-g5-3-boss-640.png`：640×360，1:1 逻辑分辨率下 32px 格子仍清楚；墙体比地面暗，读成阻挡而非地面。
- `docs/revamp/playtest/fort-4-g5-3-room-844.png`：844×390，HUD / 地形不溢出；Boss 头与底线 HUD 仍有既有遮挡，不是本轮引入。

### Pages

- 提交 `98630c5 feat(fort): add G5-3 ink-studio terrain kit`；线上脚本为 `dist/assets.b269ef7b.js` / `dist/game.2f403d3b.js`，`sw.js` 缓存 `na-b18-ef592c55`。
- `npm run audit:pages` → `passed:true`、`errors:[]`；36 屏章节入口可加载，world `mire-6` 36/36、visible 1312、missing []。
- 线上地址：https://elijah-lin-dancer.github.io/game-dev/
- 飞书文件：https://my.feishu.cn/file/HJAOb2Fb8oyptTxcsWdcKLHanV5

### 真实键盘

| 关 | 次 | 结果 | 结束 HP | 最低 HP | 击杀 | 用时 | Boss |
|---|---|---|---|---|---|---|---|
| `fort:2` | 1/1 | 通关 7/7 | 19/22 | 11 | 16 | 108.8s | `bossKind=sam`，结算时 Boss 已清 |
| `fort:4` | 1/3 | 死在 Boss 房 | 0/26 | 0 | 13 | 134.0s | Boss 19/43 |
| `fort:4` | 2/3、3/3 | 死在房 1 | 0/26 | 0 | 7 / 9 | 68.9s / 41.7s | 未到 Boss |

- 记录：`docs/audit/PLAYTEST-FORT-G5-3.json`；`fort:2` 证据图 `docs/revamp/playtest/fort-2-g5-3-a1-win.png`。
- `fort:4` 的 G5-2 旧素材基线 `docs/revamp/playtest/fort-4-a1-win.png` 仍保留（1/1、28/28）；本轮不覆盖。
- 机器人仍是真实键盘输入，无 `__dbg.next` / `__dbg.win`；`fort:4` 失败不是地形碰撞改变，而是旧堡数值 + 机器人方差。

## 已知限制

1. **不是完整 autotile**：墙体只有 4 个 hash 变体，没有按 N/E/S/W 邻居接边，L 形 / 内拐角会出现重复块；门锁也只是 tint 后的墙块，不是独立门美术。
2. **地面重复**：8×8 变体比 4×4 好，但大房间仍有可辨的重复；裂缝 / 铁锈密度偏高，后续可再降。
3. **Boss 血条被 HUD 压住**：960 / 844 Boss 图底部仍有旧 HUD 与 Boss 血条重叠；这是 G5-2 之前就存在的问题，本轮未改。
4. **`fort:4` 未稳定通关**：G5-3 三次均失败；不能把 G5-2 的旧通关拿来替代。下一步要么修机器人 Boss 房路径 / 攻击门，要么单独做旧堡数值回归。
5. **只覆盖 fort**：field / bamboo / desert / snow / volcano / mire 仍是旧地形；真多边形碰撞和 49 关全量重做仍在 `docs/BACKLOG.md` 暂缓。
6. **未做真机触屏**：smoke 覆盖触屏攻击 / 摇杆互斥，但 640 / 844 只做桌面窗口缩放截图，未在真实手机浏览器重跑。

## 复现

```bash
INK_STUDIO=/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio \
  node art-src/g5/render-fort-terrain.cjs
node tools/build.mjs
npm run smoke
npm run audit
npm run audit:font
npm run build:single
```

```bash
node tools/playtest_ch1.mjs --chapter=fort --start=2 --end=2 --stageTime=180000 --attempts=1
node tools/playtest_ch1.mjs --chapter=fort --start=4 --end=4 --stageTime=180000 --attempts=2
```

## 下一步

先修 `fort:4` 的机器人 Boss 房卡位 / 攻击门，或补一次 3 次尝试内的稳定通关；然后做旧堡关键摆件与墙体拐角规则，再决定是否把这套地形铺到其他章节。
