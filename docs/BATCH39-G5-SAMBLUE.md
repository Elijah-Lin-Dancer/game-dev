# BATCH39 · G5-1 蓝武士 3D 四向 Boss

- 日期：2026-11-27
- 范围：旧堡第 1 关 Boss「蓝武士」从 Ninja Adventure 96×48 贴图换成 ink-studio 3D 像素四向件，并接入真实可玩流程。
- 决策依据：`docs/decisions/0018-terrain-art-direction.md` 第 4 条，Boss / 地形 / 关键摆件换 ink-studio，第 1 关先做 pilot。
- 不在本批：地形套件、机关石像 / 篝火等摆件、赤武士 `samRed`、旧堡 2–6 关、49 关全量地形重做、真多边形碰撞。

## 结论

`samBlue` 已改为 5 姿态 × 4 方向的 96×96 图集，运行时按朝向与状态切帧；旧 96×48 贴图与 96×96 攻击 overlay 在该 Boss 上不再使用。`fort:1` 真实键盘回归连续 **2/2** 通关，最终 canonical 记录为第二次 115.0 秒、15/20 血、Boss 已清。

## 产出

| 件 | 源 | 图集 | 运行时 |
|---|---|---|---|
| 蓝武士 5 姿态 | `art-src/g5/sam-blue.cjs`（seed 3901，20 色） | `docs/revamp/g5-3d/sam-blue-{idle,walk,slash,charge,roar}.png`，各 384×96 | `assets/01-primary/world/sam-blue-*.png`，构建键 `samBlue*`，`FRAME [96,96]` |
| 渲染 | `art-src/g5/render-g5.cjs` | 5 × 4 向，单帧 96×96 | 相机 target `[0,1.10,0.04]`、dist `4.65`、pitch `0.13`、yaw `0.10` |
| 对照板 | — | `docs/revamp/g5-3d/sam-blue-board.png` | 5 姿态 × 4 向，3× 最近邻，深底 |

- 姿态：`idle` 正面站姿；`walk` 前脚前探；`slash` 右臂抬起、长刀横过体前；`charge` 下蹲收刀；`roar` 双臂张开、长刀竖起。
- 帧序：0 前 / 1 左 / 2 后 / 3 右。
- 结构：宽底足甲 + 金鞋尖、袴 + 胫甲、黑腰带 + 三片草摺、两层胸甲 + 金色家纹、外翘两层肩甲 + 短金棘、右长刀 + 左胁差、宽兜 + 深色铁面 + 青眼 + 骨白下颌、双后弯金角 + 中央金轮 + 金新月前立、背旗 + 红缨 + 护颈。
- alpha bbox：正面 / 背面约 51×75，侧面约 39×76；`scale 1.5` 下显示约 112 px 高，接近旧 Boss 的约 110 px。

## 运行时接入

- `tools/build.mjs`：新增 `samBlueIdle` / `samBlueWalk` / `samBlueSlash` / `samBlueCharge` / `samBlueRoar` 五个图片键，`FRAME [96,96]`。
- `web/data/bosses.json`：`samBlue.art3d = "samBlue"`；`hp 34`、`speed 58`、`half 22`、`scale 1.5` 未改。`samRed` 未加 `art3d`，仍走旧贴图。
- `src/scenes/play.js`：
  - `spawnBoss()` 的 `def.kind === 'sam'` 分支识别 `def.art3d`；有 3D 图集时不 `play(prefix + '-idle')`，直接 `setTexture(art3d + 'Idle', 0)`，记录 `art3d`、`baseScale`、`samPose`、`samDir`。
  - `samuraiFacing(dx,dy)`：水平差更大走左右，否则走上下。
  - `samuraiArt(e,pose,dx,dy)`：姿态 + 方向切帧；同一姿态与方向不重复 `setTexture`。
  - `updateSamurai()`：`roar` / `summon` → `Roar`；`slashWindup` → `Idle` + 黄色 tint；`slashHit` → `Slash`；`chargeWindup` / `charge` → `Charge`；`recover` → `Idle`；接近移动 → `Walk`，近距离停步 → `Idle`。
  - 3D 分支不再 `setFlipX`；`samuraiSlash()` 的 3D 分支不再生成旧 96×96 攻击 overlay，只切 `Slash`。
  - 旧 `samRed` 仍保留 overlay、`setFlipX`、`sam-atk` / `sam-chg` 动画。

## 视觉修正

第一版侧视有一个明显问题：胸甲球体与下摆使用近黑色 `cloth`，侧看是一整块黑柱，读不出甲胄。第二版只改材质与轮廓，不改碰撞、数值、姿态：

- 胸甲内衬 `cloth` → `steelDark`，侧视能看到深钢色胸廓。
- 宽下摆 `cloth` → `clothLight`，半径从 `0.28–0.42` 收窄到 `0.24–0.34`，侧视不再吞掉腿。
- 两侧新增侧胸板、侧腰草摺与窄金线，侧视有甲片层次。
- 重新渲染 5 张图集并复制到运行时；`web/atlas/core.png` 137,160 B / 181 切片。

## 验收

### 构建与静态检查

- `dist/game.1933151d.js` 390,260 B。
- `dist/assets.101163a0.js` 132,787 B。
- `web/atlas/core.png` 137,160 B，181 张切片。
- `web/fonts/game.woff2` 133,756 B。
- 首屏预算 1932 KB / 2.00 MB，gzip 739 KB。
- `npm run smoke` → `SMOKE OK`：Title / story 9 / chars 3、Title → Map、Map → Select、Select → Play、WASD、攻击、暂停 / 恢复、存档 v11、触屏攻击 / 摇杆互斥全部 PASS。
- `npm run audit:font` → `CHARS 1422 / CMAP 3939 / MISSING 0`，`GLYPHS OK`。
- `npm run build:single` → `web/game.html` 2019 KB；`npm run audit:font:single` → `passed:true`。

### 实机

- 960×540：`docs/revamp/playtest/fort-1-boss3d-960.png`、`fort-1-boss3d-close.png`。Boss 蓝甲、双刀、金冠、红缨可辨；`__dbg.tex('samBlueIdle')` 为 `ok:true / frames:4`。
- 844×390：`fort-1-boss3d-844.png`；640×360：`fort-1-boss3d-640.png`。Boss 脚部在 640 下贴近底部 HUD，但血条与操作按钮未遮挡；后续地形 / 镜头再修。

### `fort:1` 真实键盘回归

| 次 | 时长 | 最低血 | 结束血 | 击杀 | 金币 / 宝石 | 天赋 | 结果 |
|---|---|---|---|---|---|---|---|
| 1 | 100.6 s | 16 | 18 | 22 | 3 / 5 | 重击 / 稳手 / 吸血 | pass，Boss 已清 |
| 2（canonical） | 115.0 s | 11 | 15 | 23 | 1 / 5 | 厚皮 / 快手 / 拾荒 | pass，Boss 已清 |

- 两次都是 7 房全通，Boss 房进入血量 18 / 14，`bossEnd: null` 表示 Boss 死亡、没有残留 Boss 状态。
- `docs/audit/PLAYTEST-FORT.json` 保留第二次；`docs/revamp/playtest/fort-1-a1-win.png` 为第二次结算。
- 复跑命令：`node tools/playtest_ch1.mjs --chapter=fort --stages=1 --stageTime=180000 --attempts=1`。

## 回归失败根因与机器人修正

3D 接入后第一次 `fort:1` 失败，表现是玩家死在 Boss 房、Boss 仍 39/39。隔离测试把玩家直接放到 Boss 左侧 40 px，按一次空格，Boss `39 → 36`，`samBlueSlash` 帧切换正常，证明贴图、帧序、命中盒与 `damageFoe` 没有坏。

根因在测试机器人，不在 3D 美术：

- 蓝武士横斩 `slashReach 96`、`slashWidth 120`、击退 150；忍者刀真实命中范围约 `reach 30 + box 17 + Boss half 22 ≈ 69`。
- 旧机器人只在 `bd <= 46` 出手，且不把 `slashWindup` / `slashHit` 当危险相位；Boss 停在 70–100 的外圈反复横斩，机器人既贴不进去也不躲，整场摸不到 Boss。
- 机器人还直接在 Boss 房朝 Boss 走，遇到柱子会顶墙；Boss 存在时旧的“顶墙脱困”不触发。

本批修正 `tools/playtest_ch1.mjs`：

- 近战 Boss 出手距离按真实攻击盒改为 68（忍者刀），不是贴脸 46。
- `DANGER` 增加 `slashWindup` / `slashHit`，前摇与命中期先退。
- Boss 房移动改走 `pathNear` 路径，绕过柱子；Boss 存在时也允许顶墙脱困。

这是回归机器人建模修正，不是给 Boss 放水；游戏数值、贴图尺寸、碰撞盒均未改。

## 发布

- `76efc9d feat(fort): add ink-studio samBlue 3D four-direction boss`
- `51e5a16 test(fort): pass fort:1 2/2 with 3D samurai; record boss pathing fix`
- `660c4dd docs(audit): record Pages build game.1933151d`
- 线上 `https://elijah-lin-dancer.github.io/game-dev/` 已切到 `dist/game.1933151d.js`（390,260 B）与 `dist/assets.101163a0.js`（132,787 B）。
- `node tools/audit_pages.mjs`：`passed:true`、`errors:[]`；world `mire-6` 36/36、`visible 1312`、`missing:[]`。

## 未完成 / 风险

- `samRed` 仍是 Ninja Adventure 旧贴图，未同批升级。
- 面部在 1.5× 游戏尺寸下仍偏暗；金新月前立与双角远看容易糊成金色块。对照板可读，实机侧视仍偏块状。
- `slashWindup` 目前没有独立地面预警弧，只用 `Idle + 黄色 tint + 轻微缩放`；后续可加一条与 `slashReach` 对齐的短弧。
- 地形套件、机关石像、篝火等关键摆件尚未开始；旧堡 2–6 关、49 关整体抽样未跑。
- 真多边形碰撞、49 关全量地形重做仍在 `docs/BACKLOG.md` 暂缓。

## 复现

```bash
INK_STUDIO=/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio \
  node art-src/g5/render-g5.cjs

node tools/build.mjs
npm run smoke
npm run audit:font

node tools/playtest_ch1.mjs --chapter=fort --stages=1 --stageTime=180000 --attempts=1
```

## 素材出处

- ink-studio 工具链：`/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio`，commit `823981c`，MIT。
- 蓝武士为本项目自制 ink-studio 生成件；不涉及 Ninja Adventure 原 Boss 图的换色或 image-to-image。
