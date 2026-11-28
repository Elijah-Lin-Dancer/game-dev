# BATCH43 · G5-4 旧堡 fort:4 稳定通关

- 日期：2026-11-28
- 范围：`fort:4` 的玩法调整、Boss 房布局修复、真实键盘机器人稳定性；不改 G5-3 地形素材、32px 碰撞、门锁与存档。
- 前置：`docs/BATCH42-G5-3-FORT-TERRAIN.md`（旧堡地形第一版）、`docs/audit/PLAYTEST-FORT-G5-3.json`（`fort:4` 0/3）。
- 不在本批：其他 5 章地形、Boss 数值全面重调、真多边形碰撞、真机触屏。

## 结论

`fort:4` 当前构建达到 **3/3 连续真实键盘通关**：131.9s / 130.8s / 131.9s，结束 HP 22、26、27（满 26），击杀 23 / 21 / 26，Boss 全部清零，末次截图 `docs/revamp/playtest/fort-g54-stable3-4-a1-win.png`。

G5-3 的三次失败不是地形碰撞回归，而是三个独立问题叠加：

1. **Boss 房 2×2 障碍压中线**：Boss 固定生成在房间中央线上，障碍生成只避让房间中心 ±3 格，但 Boss 实际生成在玩家对侧约 150px（约 4.7 格），可能被 2×2 墙块隔成两个半场。近战玩家/机器人无法绕到 Boss，机器人只能顶墙罚站（证据：`fort-g54-bossfix-seed4-4-a1-timeout.png`，180s 时 Boss 仍 43/43）。
2. **第二战斗房双远程**：旧堡第二间可同时抽到蜘蛛 + 骷髅，26–30 血近战玩家要在门口吃两轮弹幕才能贴脸。
3. **机器人路径兜底缺失**：目标怪贴墙或被障碍挡住时，`pathNear()` 返回空，战斗分支回退成“朝目标直走”，顶墙后原地挨弹幕；Boss 房和普通战斗房都可能复现。

## 改动

### 游戏逻辑

| 文件 | 改动 | 目的 |
|---|---|---|
| `src/scenes/play.js` | Boss 房内部障碍生成时，`room.isBoss && Math.abs(bx - midX) <= 3` 直接跳过 | 整条中央线留空，保证 Boss 与玩家不被 2×2 障碍隔断；普通房仍只避让房间中心出生点 |
| `src/scenes/play.js` | 旧堡 `idx<=1` 的 `pickKind()` 只出 `larva / slime / mole` | 前两间先教近战与钻地，远程风筝从第三间（idx 2）再上 |
| `src/scenes/play.js` | 旧堡同房最多 1 只远程：第二只远程换成 `larva / slime / mole / beast`；总数仍 2 | 去掉“蜘蛛 + 骷髅”双远程门口弹幕；不减少刷怪数量、不改出生位置、不关门锁 |

### 机器人（`tools/playtest_ch1.mjs`）

- 新增 `--seed` / `--tag`：seed 用页面启动前 LCG 覆盖 `Math.random`，tag 隔离截图；seed 只用于布局覆盖，**不保证复现同一局**（帧时序仍会让敌人组合变化）。
- 新增 `openRun()`：按墙格计算某方向可走距离，用于弹幕躲避和 Boss 前摇逃生。
- 新增 `pathClosest()`：目标格不可达时 BFS 到离目标最近的可达格；战斗与 Boss 接近都用它兜底，避免顶墙站死。
- 新增 `travelDash()`：清场后距离 ≥130、Q 就绪、前方 ≥40px 时用 Q 赶路，压缩 7 房长线移动时间。
- Boss 前摇逃生：不再只选“空间最大方向”，按实际可走落点计算与 Boss 的距离，禁止朝 Boss 方向逃；低血 Q 阈值 20→24。
- Boss 近战：只在 `recover` 相位用 Q 贴脸，避免 approach 期 Q 落到 40–50px 后被 420ms 前摇的 96 reach 横斩命中；砍完若距离 <62 且有空间，退 100ms。
- Boss 召唤兽：Boss 70px 内但召唤兽贴到 60px 内时，优先砍召唤兽；Boss DANGER 分支仍优先。
- 低血（≤35% maxHp）优先吃可达且 ≤8 格的心；KITE Q 阈值 70→65；顶墙脱困从“无敌人或 Boss”放宽到“敌人 ≤2”。

未改：`isWall()`、`reachableTiles()`、BFS、门锁集合、刷怪总数 / 出生位置、Boss 选择 / 状态机、存档。

## 验收

### 真实键盘 3/3

| 次 | 结果 | 用时 | 结束 HP | 击杀 | Boss | 证据 |
|---|---|---|---|---|---|---|
| 1 | 通关 7/7 | 131.9s | 22/26 | 23 | 清零 | `docs/revamp/playtest/fort-g54-stable1-4-a1-win.png` |
| 2 | 通关 7/7 | 130.8s | 26/26 | 21 | 清零 | `docs/revamp/playtest/fort-g54-stable2-4-a1-win.png` |
| 3 | 通关 7/7 | 131.9s | 27/26（篝火后上限） | 26 | 清零 | `docs/revamp/playtest/fort-g54-stable3-4-a1-win.png` |

- 记录：`docs/audit/PLAYTEST-FORT-G5-4.json`；三次均为真实键盘输入，无 `__dbg.next` / `__dbg.win`。
- 对照：G5-3 最终构建 `fort:4` 0/3（1 次 Boss 19/43，2 次第二战斗房死亡）；G5-2 旧素材基线 1/1、142.2s、10/30，仅作玩法对照，不作为 G5-4 证据。
- 进入 Boss 房 HP：27 / 28 / 27；三次均在 130–132s 完成，180s 外部窗口余量约 48s。

### 构建与静态

- `npm run build`：`dist/assets.b269ef7b.js` 133,313 B；`dist/game.39f79735.js` 391,576 B；首屏 1948 KB / 2.00 MB，gzip 753 KB；`sw.js` 缓存 `na-b18-30bb814f`。
- `npm run build:single`：`web/game.html` 2,040 KB；单文件自测通过。
- `npm run smoke` → `SMOKE OK`：Title / story 9 / chars 3、Map → Select → Play、WASD、攻击、暂停、存档 v11、触屏攻击 / 摇杆互斥全 PASS。
- `npm run audit` → `SUMMARY {"stagesExpected":49,"stagesRun":49,"stagesPass":49,"screensExpected":108,"screensPass":108,"bossesPass":6,"transitionsPass":35}`，`AUDIT OK`。
- `npm run audit:font` → `CHARS 1426 / CMAP 3939 / MISSING 0`，`GLYPHS OK`；单文件字体审计 `passed:true`。
- 图集 `web/atlas/core.png` 151,754 B / 189 切片不变；G5-3 三张地形件未改。

### Pages

- 提交：`2231e85 fix(fort): stabilize G5-4 playtest and boss lane`。
- 线上地址：https://elijah-lin-dancer.github.io/game-dev/
- 线上脚本：`dist/assets.b269ef7b.js` / `dist/game.39f79735.js`；`sw.js` 缓存 `na-b18-30bb814f`；首屏可读 `game.39f79735.js`。
- `npm run audit:pages` → `passed:true`、`errors:[]`；entry scripts 为上述两项，36 屏入口可加载，world `mire-6` 36/36、visible 1312、missing []。

### 飞书

- BATCH43 文件：https://my.feishu.cn/file/WNT0b0disoezszxi0MncAEjmnqf（file_token `WNT0b0disoezszxi0MncAEjmnqf`，7,796 B）

## 已知限制

1. **3/3 不是永久保证**：同 seed 仍可能因帧时序产生不同敌人组合；3/3 证明“当前构建在该测试协议下可达”，不是“每个随机布局都必胜”。后续若改刷怪权重或 Boss 数值，要重跑。
2. **只验收 `fort:4`**：旧堡 2、3、5、6 未在本轮全量重跑；Boss 房中央线留空只影响 Boss 房，普通房布局规则未变。
3. **机器人不是玩家**：它用真实键盘输入，但会利用 Q 无敌帧、精确落点躲避与路径 BFS；真实玩家手感仍需人工试玩，特别是 640 / 844 触屏。
4. **Boss 血条与 HUD 仍重叠**：960 / 844 的既有问题，本批未改。
5. **玩法调整越过 G5-3 视觉范围**：前两间近战池、同房单远程是对旧堡难度的实质修改，不只是地形美术；如果用户不接受，可单独回滚 `pickKind()` 与 `spawnRoomEnemies()` 两段。
6. **同 seed 不稳定**：seed 只做布局覆盖，不能当“复现某次失败”的保证；根因证据来自截图与多轮 trace，不是单 seed 必然复现。

## 复现

```bash
node tools/playtest_ch1.mjs --chapter=fort --start=4 --end=4 --stageTime=180000 --attempts=1
# 连续 3 次独立启动，不要用 --attempts=3 代替：
for i in 1 2 3; do
  node tools/playtest_ch1.mjs --chapter=fort --start=4 --end=4 --stageTime=180000 --attempts=1 --tag=fort-g54-stable$i
done
```

`--attempts=3` 在首次通关后会提前结束该 stage，因此报告里的 3/3 是三次独立启动，不是一次 `--attempts=3`。

## 下一步

1. 补旧堡关键摆件与墙体拐角规则，再评估 B2 是否进入“49 关全量地形重做”。
2. 人工试玩 640 / 844 触屏，确认前两间近战池与单远程限制的实际手感。
3. 若要继续压 `fort:4` 时长，优先做房间过渡与清场移动，不再靠加伤害/加血。
