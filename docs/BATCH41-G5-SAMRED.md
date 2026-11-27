# BATCH41 · G5-2 赤武士 3D 四向 Boss

- 日期：2026-11-27
- 范围：旧堡 `bossPool` 第二位 Boss「赤武士」`samRed` 从 Ninja Adventure 96×48 贴图换成 ink-studio 3D 像素四向件，并接入真实运行时。
- 前置：`docs/BATCH39-G5-SAMBLUE.md`（蓝武士 G5-1 已完成并上线）；`docs/decisions/0018-terrain-art-direction.md` 第 4 条 pilot。
- 不在本批：地形套件、机关石像 / 篝火摆件、旧堡 2–6 数值再调、49 关全量地形重做、真多边形碰撞。

## 结论

`samRed` 已改为 5 姿态 × 4 方向的 96×96 图集，运行时按朝向与状态切帧；旧 96×48 贴图与 96×96 攻击 overlay 在该 Boss 上不再使用。`fort:4` 强制 `samRed` 的真实键盘验证中，Boss HP **43 → 19**（8 次空格、每次 3 伤），`art3d='samRed'`、`samRedIdle` 4 帧、无 pageerror，命中 / 受击 / 帧切换正常。

**本批没有新的整关通关证据**：`fort:2` 2 次、`fort:4` 2 次真实键盘回归都死在 Boss 前（机器人方差），不能写成「G5-2 真实通关」。旧素材时期的 `fort-4-a1-win.png`（1/1、28/28）仍是该关玩法基线；本轮只换皮，未改碰撞、数值、Boss 状态机。

## 产出

| 件 | 源 | 图集 | 运行时 |
|---|---|---|---|
| 赤武士 5 姿态 | `art-src/g5/sam-red.cjs`（seed 3902，24 色） | `docs/revamp/g5-3d/sam-red-{idle,walk,slash,charge,roar}.png`，各 384×96 | `assets/01-primary/world/sam-red-*.png`，构建键 `samRed*`，`FRAME [96,96]` |
| 渲染 | `art-src/g5/render-sam-red.cjs` | 5 × 4 向，单帧 96×96 | 相机 target `[0,1.13,0.04]`、dist `4.65`、pitch `0.13`、yaw `0.10` |
| 对照板 | — | `docs/revamp/g5-3d/sam-red-board.png`（1268×1760） | 5 姿态 × 4 向，3× 最近邻，深底 |

- 姿态：`idle` 站姿；`walk` 前脚前探；`slash` 右臂抬起、长刀横过体前；`charge` 下蹲收刀；`roar` 双臂张开、长刀竖起。
- 帧序：0 前 / 1 左 / 2 后 / 3 右。
- 造型：黑铁衬底 + 赤漆甲片 + 金饰；黑色铁面 + 橙红单条眼缝 + 骨白下颌；一根高金角 + 两侧后掠短金翼；赤旗金脊；右长刀 + 左胁差。
- 与蓝武士的区分：蓝武士是深蓝面甲、双后弯角、金新月前立、青旗；赤武士是黑铁面、单高角、赤旗，远看剪影和色相都能分开。
- alpha bbox：idle / walk 正面约 57×83，侧面约 36×83；charge 约 50×79；顶部 y=3、底部 y=86，96px 内不裁切。

## 视觉修正

第一版有两个问题：整块骨白面具在 96px 下变成白板、眼睛消失；刀身沿用了赤色甲片色板，实机读成两根橙木棍。

第二版回到黑铁面 + 橙眼，但仍是两只方眼，脸上信息过多；背旗是 0.26×0.52 的整块红板，背视像一块红箱。第三版只改材质与轮廓，不改碰撞、数值、姿态：

- 新增中性钢色 `blade` 色板（`#7a828a / #b8c2ca / #f2f6f8`），长刀 / 胁差改用该色；赤甲高光仍走赤金色。
- 衬底 `cloth` / `clothLight` 压到近黑，赤漆甲片与黑衬底拉开；胸甲加中央亮面板 + 金框 + 两侧窄金线。
- 面部改为一条橙红眼缝 + 金眉压条 + 骨白下颌，去掉两只方眼和整块白眉条。
- 前立改成更粗的单根高角，侧翼由方块改成后掠金管；高角尖从 `+0.70` 收到 96px 内不顶格。
- 背旗从 0.26×0.52 收到 0.13×0.37，补赤旗金脊 / 金顶 / 金家纹，背视不再整块盖住腰背。

## 运行时接入

- `tools/build.mjs`：新增 `samRedIdle` / `samRedWalk` / `samRedSlash` / `samRedCharge` / `samRedRoar` 五个图片键，`FRAME [96,96]`。
- `web/data/bosses.json`：`samRed.art3d = "samRed"`；`hp 38`、`dmg 4`、`speed 60`、`half 22`、`scale 1.5` 未改。
- `src/scenes/play.js`：沿用 G5-1 的 `spawnBoss()` / `samuraiArt()` / `updateSamurai()` 泛化分支；`samRed` 有 `art3d` 时直接读 3D 图集，不再生成旧 96×96 攻击 overlay，也不再 `setFlipX`。
- 出现关卡：旧堡 `bossPool ["samBlue","samRed"]`，stage 2 / 4 / 6 交替遇到；stage 4 Boss HP 43。

## 验收

### 构建与静态检查

- `dist/assets.0f832904.js` 133,118 B。
- `dist/game.89c0ceef.js` 390,623 B。
- `web/atlas/core.png` 146 KB，186 张切片；`core.json` 有 `samRedIdle/Walk/Slash/Charge/Roar` 五键，均 96×96。
- 首屏预算 1945 KB / 2.00 MB，gzip 751 KB。
- `npm run smoke` → `SMOKE OK`：Title / story 9 / chars 3、Title → Map、Map → Select、Select → Play、WASD、攻击、暂停 / 恢复、存档 v11、触屏攻击 / 摇杆互斥全部 PASS。
- `npm run audit:font` → `CHARS 1423 / CMAP 3939 / MISSING 0`，`GLYPHS OK`。
- `npm run build:single` → `web/game.html` 2036 KB；`npm run audit:font:single` → `passed:true`。

### 实机

- `docs/revamp/playtest/fort-4-samred-960.png`：960×540，`fort:4` 强制 `samRed`，Boss 全身、赤甲、单高角、双刀可辨；HUD 血条与门标不遮挡 Boss 主体。
- `docs/revamp/playtest/fort-4-samred-close.png`：从 960 图裁出的近身，赤甲 / 黑面 / 橙眼缝 / 金角 / 钢刀可读。
- `__dbg.tex('samRedIdle')` → `{ok:true, frames:4}`；`samRedSlash` 同。
- 960 Boss 房截图脚本为临时 `/tmp/shot-samred.mjs`；相机先跟随玩家再暂停，Boss 放在玩家上方 60px，避免 96px 高角顶到 HUD。

### 真实键盘打点

`/tmp/bossfight-samred.mjs` 在 `fort:4` Boss 房强制 `samRed`，玩家 `facing='up'`、8 次空格：

| 次 | Boss HP | 伤害 | 纹理 |
|---|---|---|---|
| 起始 | 43 | — | samRedWalk |
| 1–8 | 40 / 37 / 34 / 31 / 28 / 25 / 22 / 19 | 每次 3 | samRedIdle（命中后回待机） |

- `art3d='samRed'`、`playerHp 26` 稳定、`errors []`；没有 pageerror。
- 这是 Boss 段命中验证，不是整关通关。

### 整关回归（未通过，按事实记录）

| 关 | 次 | 结果 | 死亡 / 结束 | 击杀 |
|---|---|---|---|---|
| `fort:2` | 1 | 房 1 死亡 | 22→0 | 6 |
| `fort:2` | 2 | 房 3 死亡 | 13 kills | 未到 Boss |
| `fort:4` | 1 | 房 1 死亡 | 22→0 | 7 |
| `fort:4` | 2 | 房 5 篝火超时 | hp 8/26 | 11 |

- 4 次都没有进入 Boss 房；与 G5-1 时的机器人方差一致，不是 3D 美术直接导致。
- 失败记录未写进 `docs/audit/PLAYTEST-FORT.json`；该文件恢复为 HEAD 旧记录，避免把一次性失败当成 canonical。
- 旧素材完整关证据仍在：`docs/revamp/playtest/fort-4-a1-win.png`（旧堡 4，1/1、28/28）。

## 未完成 / 风险

- 没有「G5-2 新素材整关通关」；下一步应先修机器人对蜘蛛 / 分裂怪 / 召唤兽的处理，再重跑 `fort:2` / `fort:4`，而不是继续削关卡数值。
- 背旗在背视仍偏「背箱」，不是飘动旗帜；96px 下可接受，但不如蓝武士的窄旗 + 金脊干净。
- 黑铁面在 1.5× 游戏尺寸下仍偏暗；远看靠金角和橙眼缝识别，近看才读得出下颌。
- 640 / 844 的 Boss 房未单独重拍；当前 960 图是主证据，窄视口镜头另开专项。
- 地形套件、机关石像、篝火等关键摆件尚未开始。

## 发布

- `9141a76 feat(fort): add ink-studio samRed 3D four-direction boss`
- 线上 `https://elijah-lin-dancer.github.io/game-dev/` 已切到 `dist/assets.0f832904.js`（133,118 B）与 `dist/game.89c0ceef.js`（390,623 B）；`sw.js` 缓存 `na-b18-6605dc41`。
- `npm run audit:pages`：`passed:true`、`errors:[]`；`entry.scripts` 为 `phaser.min.js` / `assets.0f832904.js` / `game.89c0ceef.js`；world `mire-6` 36/36、`visible 1312`、`missing:[]`。

## 复现

```bash
INK_STUDIO=/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio \
  node art-src/g5/render-sam-red.cjs

for p in idle walk slash charge roar; do
  cp docs/revamp/g5-3d/sam-red-$p.png assets/01-primary/world/sam-red-$p.png
done

node tools/build.mjs
npm run smoke
npm run audit:font
npm run build:single
npm run audit:font:single
```

## 素材出处

- ink-studio 工具链：`/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio`，commit `823981c`，MIT。
- 赤武士为本项目自制 ink-studio 生成件；不涉及 Ninja Adventure 原 Boss 图的换色或 image-to-image。
