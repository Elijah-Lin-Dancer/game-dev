# ADR 0012 · 表现力：像素中文字体、act 打击时间轴、顿帧与震屏分级

日期：2026-11-20
状态：已采纳

## 背景

到叙事层为止，这套东西"能玩"但还"不像作品"：HUD 是浏览器默认等宽字体，中文混排时字宽忽宽忽窄；打中敌人的反馈只有一层白色圆圈；震屏时长/幅度是散落在 20 处的魔法数字，没有人能一句话说清"重击该震多久"。

三条里最后一条，就是把"能跑"变成"看起来是打磨过的"。

## 决定

### 1. 像素中文字体（构建期子集化）

- 主字体选 **Fusion Pixel 12px Monospaced（zh-Hans，TakWolf，OFL 1.1）**：12px 像素字，和 16px 美术 2 倍放大的网格同频。
- 全字库 957 KB 太大，构建期用 `tools/subset_font.py` 裁到 **3911 字**（源码/文案实际用到的字 ∪ GB2312 一级字库 3755）→ **129.8 KB woff2**。
- 子集字体按 OFL 要求**改名**为 `NinjaPixel`（派生字体不得沿用原字体名），原始文件与 `OFL.txt` 一并入库。
- 加载顺序改过：`document.fonts.load('12px "NinjaPixel"')` 完成后再 `new Phaser.Game()`，1.5 秒兜底。原因是 Phaser 的文字是**建场景时一次性画进 canvas 纹理**的，字体晚到会整屏退回系统字体且不会自动重画。
- 字号统一到 **12 / 24**（像素字只有 12px 一个设计尺寸，13px、14px 这种会糊）。

### 2. act 时间轴（`src/systems/fx.js`）

打击表现不再是一行行手写 tween，而是一张表：一次打击 = 若干带时间点的 beat。

```
{ at: 0,  k: 'stop',   v: 'stopLight' }        // 顿帧档位
{ at: 0,  k: 'shake',  v: 'shakeHit'   }        // 震屏档位
{ at: 0,  k: 'star',   len: 9, rays: 4 }        // 十字星（接触点弹开）
{ at: 0,  k: 'ring',   r: 5, grow: 3.6, fill }  // 扩散环（带淡填充）
{ at: 0,  k: 'debris', n: 6, speed: 160 }       // 碎片飞散
{ at: 0,  k: 'pop' }                            // 目标压扁（纵 squash）
{ at: 0,  k: 'flash',  color: 0xff3b30, alpha: 'flashHurt' }  // 全屏染色闪
```

业务代码只写 `playAct(this, 'hit', cx, cy, { target: spr })`，改手感不用碰战斗逻辑。目前 8 套 act：`hit / kill / hurt / slam / roar / pickup / upgrade`。

`at > 0` 的 beat 用 tween 的 `delay` 排队（不是 `time.delayedCall`），这样时间轴和补间共用同一条时间线。

### 3. 顿帧与震屏分级（`CFG.feel`，外部可调）

| 档 | 场景 | 值（`balance.json → feel`） |
|---|---|---|
| stopLight | 普通命中 | 42 ms |
| stopKill | 击杀 | 78 ms |
| stopHurt | 玩家挨打 | 95 ms |
| stopSlam | Boss 砸地 | 130 ms |
| stopPhase | Boss 变身 | 190 ms |
| shakeLight / shakeHit / shakeHeavy / shakeBoss | 拾取 / 命中 / 挨打 / 砸地+变身 | 70ms@0.005 → 340ms@0.028 |

顿帧**只冻世界逻辑和精灵动画，不冻特效补间**。这是本次踩出来的坑：最初实现是 `tweens.pauseAll()`，结果 130ms 的砸地顿帧把画面定格在"特效刚创建、还没长开"的那一帧——玩家看到的是静止且几乎没有反馈的画面，顿帧越长越像卡死。现在的分工是：精灵定格提供"打到实处"，特效继续播提供"看得见的反馈"。

### 4. 受击反馈分材质

- 小怪：命中瞬间 `setTintFill(0xffffff)` 打成**白色剪影**（像素游戏最脆的反馈），70ms 后 `clearTint`。
- Boss：Boss 身上有阶段染色（蓄力红、变身黄），白色剪影会把语义覆盖掉，因此退一级用半透明 0.45。

## 实测

| 项 | 方法 | 结果 |
|---|---|---|
| 字体真的生效 | `document.fonts.check('12px "NinjaPixel"')` | `true`（modular 与单文件两版都验） |
| 字体请求 | 线上/本地抓请求 | `web/fonts/game.woff2` 200，129.8 KB |
| 顿帧生效 | `atk()` 后逐 30ms 采样 `__state.freeze/freezePaused` | 命中当帧 `freeze=42 / paused=true`，到期回落 0 并恢复 |
| 重击档更大 | 砸地/变身 | `freeze` 采样到 78（击杀）、130（砸地）、190（变身） |
| 特效在顿帧期间继续播 | 慢放 0.1 抓帧 | 砸地的金环从 r16 扩到 5 倍、碎片飞散，画面不是静帧 |
| 白闪回位 | 连续命中同一只怪 | 每次 70ms 后恢复原色，无残留白像 |
| 全流程无回归 | 对话 3 行 → 石龛选 1 → 清房 → Boss 房 | 无 `pageerror`，对话期间 HP 20/20，`upg.power=1` |
| 单文件版 | `file://web/game.html?debug` | 字体为 data URI，`document.fonts.check` 为 true |

## 代价与边界

- 字体 129.8 KB 是这个项目里"单文件最大的一个非美术资源"，比打包后的游戏逻辑（44 KB）还大；换来的是中文不再是系统等宽字体。若将来只保留少量文案，子集还能再砍。
- 子集只覆盖 GB2312 一级字库 + 现有文案，**生僻字会回退系统字体**（不会缺字，只是字重不一致）。玩家改 `story.json` 用二级字库里的字时能看到混排。
- 非整数倍缩放（如 960×540 → 1.5×）时，12px 字形会有 1px 粗细不均；1280×720（2×）完全干净。没有为此改整数缩放，因为那会在常见窗口下留黑边。
- act 表仍是"艺术判断"，没有对比数据证明"42ms 比 60ms 更好"；数值都外置在 `balance.json`，后续可实测调整。
- 碎片是纯色方块，不是手绘像素粒子；砸地的抛物线位移仍不做碰撞体。

## 下一步

- 音量/听感的人工确认（音效至今只有"能播不报错"的证据）。
- PWA + Capacitor 套壳；按章节拆图集做真懒加载。
- 周目专属文本、精英怪词缀。
