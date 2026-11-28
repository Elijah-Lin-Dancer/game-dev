# BATCH44 · G5-5 旧堡 2–6 回归与 fort:3 软锁修复

- 日期：2026-11-28
- 范围：旧堡 `fort:2–6` 真实键盘回归；`fort:3` 蜘蛛满血软锁；机关房守卫池与蜘蛛网数值。不改地形素材、32px 格子、门锁、Boss 状态机、存档。
- 前置：`docs/BATCH43-G5-4-FORT-PLAYABILITY.md`（`fort:4` 3/3）、`docs/audit/PLAYTEST-FORT-G5-4.json`。
- 不在本批：其他 4 章回归、墙体 16 向 autotile、关键摆件、真多边形碰撞、真机触屏。

## 结论

当前构建 `game.2906b6e2` 下，旧堡 **2–6 共 9 次真实键盘启动全部通关**：

- `fort:3` 连续 **3/3**：133.8s / 138.5s / 141.3s，结束 HP 15、24、18（满 24）。
- `fort:4` 连续 **3/3**：104.9s / 114.7s / 151.3s，结束 HP 26、24、11（满 26）。
- `fort:2 / 5 / 6` 各 **1/1**：126.4s（23/22）、138.7s（17/28）、118.7s（27/30）。
- 9 次结束场上无敌人，Boss 均已清零。

`fort:3` 的偶发软锁定位到蜘蛛网叠加机关房远程守卫，不再只归因于“随机布局”：

1. **蜘蛛网接近永久减速**：旧值 `0.4× / 1500ms / 1900ms cd`，玩家 96 速被压到 38，只比蜘蛛 36 快 2px/s；减速 1.5s、冷却 1.9s，中间只留 0.4s 正常移速。近战追不上，蜘蛛可以一直满血风筝。
2. **机关房可能抽到远程**：gate 房只放 1 个守卫，但 `pickKind()` 仍可能给蜘蛛/骷髅；玩家拉石像时被隔墙风筝，残血死在机关前。
3. 失败样本集中在 gate / 战斗房左上角，蜘蛛 10/10 HP、玩家 0 HP，符合“追不上 + 被磨死”，不是路径完全不可达。

## 改动

| 文件 | 改动 | 目的 |
|---|---|---|
| `src/scenes/play.js` | 旧堡 gate 房守卫只出 `larva / slime / mole`；抽到 `spider / skull / eye / octopus / flam / demon / lantern / spirit / mush` 时替换为按房间序号轮换的近战 | 谜题房不再放远程风筝点；守卫数量仍为 1，石像与门锁不变 |
| `src/core/config.js` | `spider.webSlow` 0.4→0.55；`webSlowMs` 1500→1100；`webCd` 1900→2100 | 玩家减速后 52.8 速，仍比蜘蛛 36 快 16.8px/s；减速 1.1s 后有约 1s 正常移速窗口，追得动但仍需躲网 |

未改：`isWall()`、BFS、刷怪总数（旧堡仍每房 2 只）、出生位置、Boss 数值与状态机、机关房石像交互、存档结构。

## 验收

### 真实键盘回归（最终构建）

| 关 | 次数 | 结果 | 用时 | 结束 HP | 击杀 | 证据 |
|---|---|---|---|---|---|---|
| `fort:2` | 1 | 通关 7/7 | 126.4s | 23/22（篝火后上限） | 20 | `docs/revamp/playtest/fort-g55-reg2-2-a1-win.png` |
| `fort:3` | 3 | 通关 7/7 ×3 | 133.8s / 138.5s / 141.3s | 15/24、24/24、18/24 | 23 / 22 / 25 | `fort-g55-web-{1,2,3}-3-a1-win.png` |
| `fort:4` | 3 | 通关 7/7 ×3 | 104.9s / 114.7s / 151.3s | 26/26、24/26、11/26 | 24 / 20 / 25 | `fort-g55-fort4-{1,2,3}-4-a1-win.png` |
| `fort:5` | 1 | 通关 7/7 | 138.7s | 17/28 | 25 | `docs/revamp/playtest/fort-g55-reg5-5-a1-win.png` |
| `fort:6` | 1 | 通关 7/7 | 118.7s | 27/30 | 22 | `docs/revamp/playtest/fort-g55-reg6-6-a1-win.png` |

- 机读记录：`docs/audit/PLAYTEST-FORT-G5-5.json`，9 条 stage 全 `win`、`endEnemies` 为空。
- 对照：G5-4 构建 `fort:3` 曾 1 次 97.5s 死亡（gate 房，0/24，蜘蛛 10/10）；调参前 gate 近战构建仍出现 1 次 87.1s、房 3 蜘蛛满血死亡。保留的失败证据为 `docs/revamp/playtest/fort-g55-fort3-3-3-a1-dead.png`。
- 所有跑次为独立启动、真实键盘输入，未使用 `__dbg.next` / `__dbg.win`；每个 180s 外部窗口均有 ≥28s 余量（最慢 `fort:4` 第 3 次 151.3s）。

### 构建与静态

- `npm run build`：`dist/assets.b269ef7b.js` 133,313 B；`dist/game.2906b6e2.js` 391,727 B；首屏 1948 KB / 2.00 MB，gzip 753 KB；`sw.js` 缓存 `na-b18-f9d9c2e8`。
- `npm run build:single`：`web/game.html` 2,040 KB（2,088,863 B）；单文件自测通过。
- `npm run smoke` → `SMOKE OK`：Title / story 9 / chars 3、Map → Select → Play、WASD、攻击、暂停、存档 v11、触屏攻击 / 摇杆互斥全 PASS。
- `npm run audit` → `SUMMARY {"stagesExpected":49,"stagesRun":49,"stagesPass":49,"screensExpected":108,"screensPass":108,"bossesPass":6,"transitionsPass":35}`，`AUDIT OK`。
- `npm run audit:font` → `CHARS 1426 / CMAP 3939 / MISSING 0`，`GLYPHS OK`；单文件字体审计 `passed:true`。
- 图集 `web/atlas/core.png` 151,754 B / 189 切片；G5-3 三张地形件未改。

### Pages

- 提交：`20e9d3d fix(fort): stabilize G5-5 fort 2-6 regression`、`91995e5 docs(audit): record G5-5 fort 2-6 regression`。
- 线上地址：https://elijah-lin-dancer.github.io/game-dev/
- 线上脚本：`dist/assets.b269ef7b.js` / `dist/game.2906b6e2.js`；`sw.js` 缓存 `na-b18-f9d9c2e8`；`entry.scripts` 已读到新构建，`entry.sw:true`。
- `npm run audit:pages` → `passed:true`、`errors:[]`；stage 抽查 `lava:9` 10 房完整，world `mire-6` 36/36、visible 1312、missing []。

## 已知限制

1. **3/3 不是永久保证**：仍是“当前测试协议下可达”，不是每个随机布局必胜；改刷怪权重、蜘蛛数值或 Boss 后需重跑。
2. **2/5/6 只有 1/1**：这三关本轮只证明最新构建没有明显退步，不足以称稳定；下一轮若改全局怪值，应补到 3/3。
3. **蜘蛛调参是全局的**：`CFG.spider` 同样影响竹林、沙漠、雪原、火山、雾泽；本轮只回归旧堡，其他章未做整关重跑。
4. **机器人不是玩家**：真实键盘输入，但会利用 Q 无敌帧、精确落点与 BFS；640 / 844 触屏手感仍需人工试玩。
5. **玩法改动未经显式拍板**：gate 守卫池与蜘蛛网数值是实质难度修改，用户只授权“按你倾向继续”。回滚点是 `spawnRoomEnemies()` 的 gate 分支与 `CFG.spider`。
6. **Boss 血条与 HUD 重叠**：960 / 844 的既有问题，本批未改。

## 复现

```bash
# fort:3 连续 3 次独立启动
for i in 1 2 3; do
  node tools/playtest_ch1.mjs --chapter=fort --start=3 --end=3 --stageTime=180000 --attempts=1 --tag=fort-g55-web-$i
done

# fort:2 / 5 / 6 各 1 次
for s in 2 5 6; do
  node tools/playtest_ch1.mjs --chapter=fort --start=$s --end=$s --stageTime=180000 --attempts=1 --tag=fort-g55-reg$s
done
```

## 下一步

1. 做旧堡墙体 16 向 autotile + gate 石像 / 休息房篝火关键摆件，回到美术主线。
2. 其他章至少抽 1 关验证蜘蛛调参没有让远程压力失衡。
3. 人工试玩 640 / 844 触屏，确认机关房单近战守卫与蜘蛛网的实际手感。
