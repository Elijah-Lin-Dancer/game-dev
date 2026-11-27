# BATCH40：旧堡 2–6 可玩性基线

日期：2026-11-27
构建：`dist/game.89c0ceef.js` / `dist/assets.9349b5fa.js`
范围：旧堡 2–6 数值、房间编排、测试机器人；不涉及 3D 美术

## 结论

旧堡 2–6 已从“第一房/第二房必死”改为“分关可通”：

- 6 关全部有真实键盘通关证据（第 6 关第 2 次尝试通关）。
- 第 4 关仍是方差最大的一关：有一次 1/1 通关，也有 Boss 19/43、22/43、Boss 房超时等失败。
- **未拿到 2–6 同一次进程连续通关**；这是测试机器人方差，不是关卡必死。

## 改动

### 关卡与房间

- `web/data/chapters.json`：旧堡 `rooms` 由 `[7,6,6,6,6,6]` 改为 `[7,7,7,7,7,7]`，
  恢复 `battle / battle / rest / battle / gate / rest / boss`，首领前免费篝火不再被截断。
- `src/scenes/play.js`：
  - 旧堡所有战斗房 `n = min(2, n)`；机关房守卫 `fort ? 1 : 2`。
  - 首间 `easy` 池移除 `spider`，首间只出近战/分裂/钻地。
  - 旧堡 2–6 普通篝火与首领前篝火免费回满；第 1 关首领前仍只回 8。
  - 最大生命按关深 +2：第 2 关 22、第 3 关 24、第 4 关 26、第 5 关 28、第 6 关 30。
  - 第 2 关起玩家平伤 +1。
  - 旧堡 2–6 Boss 血量 ×0.85。
- 未采用：旧堡 2–6 Boss 伤害 ×0.75。实装后 `fort:4` 两连败且无改善，已回退，Boss 仍 4 伤。

### 测试机器人

- `tools/playtest_ch1.mjs` 新增 `--start/--end` 分段回归；前置关只补星，当前关真实打。
- 超时后重载重进本关，同一关允许多一次真实输入机会。
- 普通怪真实攻击盒距离 44→54；斜 40px 先副轴对齐再砍。
- Boss 70–132px 且 Q 就绪时疾影冲刺贴脸。
- 旧堡篝火免费时不再要求 2 金币。

## 验证

960×540，真实键盘输入，无 `__dbg.next` / `__dbg.win`。

| 关 | 结果 | 结束血量 | 击杀 | 篝火 | Boss |
|---|---|---|---|---|---|
| `fort:1` | 1/1 通关 | 22/20 | 23 | 2 | 已清 |
| `fort:2` | 1/1 通关 | 24/22 | 14 | 2 | 已清 |
| `fort:3` | 1/1 通关 | 21/24 | 19 | 2 | 已清 |
| `fort:4` | 1/1 通关 | 28/26 | 21 | 2 | 已清 |
| `fort:5` | 1/1 通关 | 25/28 | 19 | 2 | 已清 |
| `fort:6` | 第 2 次通关 | 32/30 | 19 | 2 | 已清 |

截图：`docs/revamp/playtest/fort-{1..6}-a*-{win,dead,timeout}.png`。

### 构建与回归

- `npm run build`：`dist/assets.9349b5fa.js` 130 KB，`dist/game.89c0ceef.js` 381 KB。
- `npm run smoke`：PASS。
- `npm run audit:font`：1423 字 / 3939 cmap / 0 missing。
- `npm run build:single` + `audit:font:single`：单文件 2019 KB，字体通过。
- `npm run audit`：49/49 关、108/108 屏、6 Boss、35 跨屏 PASS。

## 已知限制

1. `fort:4` 的蜘蛛/分裂怪/召唤兽组合仍会让机器人磨死或超时；连续 2–6 全链未成立。
2. `samRed` 仍是旧贴图，和 3D 蓝武士同场有画风断层。
3. 线上已切到 `dist/game.89c0ceef.js`；`audit:pages` 已对新构建 PASS。PWA 用户需刷新/等 Service Worker 换缓存后生效。

## 复跑

```bash
node tools/playtest_ch1.mjs --chapter=fort --start=4 --end=4 --stageTime=150000 --attempts=2
node tools/playtest_ch1.mjs --chapter=fort --start=2 --end=6 --stageTime=150000 --attempts=3
```
